"""Limitless online VGC tournament usage stats.

Fetches tournament lists and standings from the Limitless API
(https://docs.limitlesstcg.com/developer.html) and aggregates them into
Pikalytics-style usage stats per regulation format.

Caching strategy (keyless-API friendly):
  - The tournament list for a format is cached on disk for 1 hour.
  - Standings of finished tournaments never change, so they are cached
    on disk forever; each hourly refresh only fetches newly seen events.
  - The computed aggregate is memoized in-process, keyed on the set of
    tournament ids it was built from. That key is derived from file
    existence alone, so steady-state requests never re-parse the
    standings JSON; full parses happen only when the tournament set
    changes, serialized behind a lock (the dyno is RAM-bound and one
    large event's standings expand to many MB of Python objects).
"""

import json
import os
import re
import sys
import threading
import time
from collections import OrderedDict
from datetime import datetime, timedelta, timezone

import requests

LIMITLESS_API_BASE = "https://play.limitlesstcg.com/api"
LIMITLESS_CACHE_DIR = os.path.join("cache", "limitless")
STANDINGS_DIR = os.path.join(LIMITLESS_CACHE_DIR, "standings")
LIST_CACHE_TTL = 3600  # tournament lists refresh hourly
FORMATS_CACHE_TTL = 12 * 3600  # /games changes rarely
PLAYER_TIERS = [25, 50, 100, 200, 500]  # usage-segment thresholds (tournament size)
MIN_PLAYERS = PLAYER_TIERS[0]  # ignore small casual/practice events
WINDOW_DAYS = 30  # rolling metagame window
COMPLETION_GRACE_HOURS = 12  # skip events until date + grace < now
MAX_STANDINGS_PER_REFRESH = 30  # rate-limit frugality cap per refresh
FETCH_DELAY_SECONDS = 0.3  # politeness delay between standings fetches
FAILED_FETCH_COOLDOWN = 3600  # seconds before retrying a failed standings fetch
LIST_FETCH_LIMIT = 500
LIST_MAX_PAGES = 3  # page until the rolling window is covered
EVENT_MEM_MAX = 6  # single-event bundles kept in RAM (dyno is RAM-bound)
API_KEY = os.environ.get("LIMITLESS_API_KEY", "")
ATTRIBUTION_TEXT = "Data from Limitless TCG"
ATTRIBUTION_URL = "https://play.limitlesstcg.com/"

os.makedirs(STANDINGS_DIR, exist_ok=True)


def _cache_path(*segments):
    # No dots allowed: keeps ".." out of path segments (".json" is appended here).
    safe = [re.sub(r"[^A-Za-z0-9_-]", "_", s) for s in segments]
    return os.path.join(LIMITLESS_CACHE_DIR, *safe[:-1], safe[-1] + ".json")


def _cache_read(path, ttl=None, allow_stale=False):
    """Return cached JSON if present and fresh (ttl=None means never stale)."""
    if not os.path.exists(path):
        return None
    if (
        ttl is not None
        and not allow_stale
        and (time.time() - os.path.getmtime(path)) > ttl
    ):
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _cache_write(path, data):
    # Write-then-rename: a crash mid-write must not leave a corrupt file
    # behind, because existing files are never refetched (standings have
    # no TTL and `missing` checks are existence-based).
    tmp = path + ".tmp"
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f)
        os.replace(tmp, path)
    except Exception:
        pass


def _api_get(path, params=None):
    """GET JSON from the Limitless API, or None on any failure."""
    headers = {"User-Agent": "MunchStats (+https://munchstats.com)"}
    if API_KEY:
        headers["X-Access-Key"] = API_KEY
    try:
        resp = requests.get(
            LIMITLESS_API_BASE + path,
            params=params,
            timeout=20,
            headers=headers,
        )
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return None


def get_vgc_formats():
    """Return the {format_id: display_name} dict for VGC from /games.

    The first key is the most recent regulation. Cached 12h on disk with
    stale fallback; returns {} when nothing is available at all.
    """
    path = _cache_path("formats")
    cached = _cache_read(path, ttl=FORMATS_CACHE_TTL)
    if cached is not None:
        return cached
    games = _api_get("/games")
    if games:
        for game in games:
            if game.get("id") == "VGC":
                formats = game.get("formats") or {}
                _cache_write(path, formats)
                return formats
    return _cache_read(path, ttl=FORMATS_CACHE_TTL, allow_stale=True) or {}


def get_vgc_tournaments():
    """Return all recent VGC tournaments (1h TTL, stale fallback).

    One shared list instead of one request per format, paged until it
    reaches past the rolling window (the API caps page size, so a busy
    month can need more than one page).
    """
    path = _cache_path("tournaments_all")
    cached = _cache_read(path, ttl=LIST_CACHE_TTL)
    if cached is not None:
        return cached

    window_start = datetime.now(timezone.utc) - timedelta(days=WINDOW_DAYS)
    results = []
    for page in range(1, LIST_MAX_PAGES + 1):
        data = _api_get(
            "/tournaments",
            params={"game": "VGC", "limit": LIST_FETCH_LIMIT, "page": page},
        )
        if not isinstance(data, list) or not data:
            if page == 1:
                return _cache_read(path, ttl=LIST_CACHE_TTL, allow_stale=True) or []
            break
        results.extend(data)
        oldest = _parse_date(data[-1].get("date"))
        if len(data) < LIST_FETCH_LIMIT or (oldest and oldest < window_start):
            break
    _cache_write(path, results)
    return results


def _format_matches_name(format_id, name):
    """True when a tournament name references the format id as a token.

    A hyphen in the id matches an optional hyphen or space in the name, so
    the "M-B" regulation is found in "Reg M-B", "Reg MB" and
    "Champions-MB" alike (organizers spell it inconsistently).
    """
    token = r"[-\s]?".join(re.escape(p) for p in format_id.split("-"))
    return re.search(
        r"(?<![A-Za-z0-9])" + token + r"(?![A-Za-z0-9])",
        name,
        re.IGNORECASE,
    )


def _name_regulation(name, format_ids):
    """Return the format id explicitly named in a tournament title, or None.

    An explicit regulation in the title is more reliable than the API's
    format tag: organizers routinely leave the format dropdown on the
    previous regulation (so a Reg M-B event is tagged "M-A") or on
    "CUSTOM", while still naming the event for the regulation it actually
    runs. Only titles that name a known regulation trigger this override.
    """
    if not name:
        return None
    for fid in format_ids:
        if _format_matches_name(fid, name):
            return fid
    return None


def resolve_format_id(tournament, format_ids=None):
    """Return the regulation a tournament actually runs.

    An explicit regulation in the tournament name wins over the API's
    format tag, which organizers routinely leave on the previous
    regulation or on "CUSTOM" (e.g. the 898-player Smogon VGC Major Live
    "Reg M-B"). Tournaments whose name references no known regulation fall
    back to their API format tag.
    """
    if format_ids is None:
        format_ids = list(get_vgc_formats())
    named = _name_regulation(tournament.get("name"), format_ids)
    return named or tournament.get("format") or ""


def get_tournament_list(format_id):
    """Return the tournaments belonging to one format."""
    format_ids = list(get_vgc_formats())
    return [
        t for t in get_vgc_tournaments()
        if resolve_format_id(t, format_ids) == format_id
    ]


# format_id -> {"key": cached-event ids, "value": bool}; avoids re-reading
# standings files on every sidebar render.
_has_data_mem = {}


def _format_has_data(format_id):
    """True when some cached standings for the format contain a decklist.

    Having eligible tournaments is not enough to offer a format in the
    UI: its stats page only renders from cached standings with at least
    one public decklist, so anything less would be a dead sidebar entry
    (e.g. right after a restart, before the warm thread reaches the
    format, or when every event keeps teamlists private). Checks cached
    files only — backfilling stays with the warm thread and page loads.
    """
    eligible = eligible_tournaments(get_tournament_list(format_id))
    key = tuple(sorted(
        t["id"] for t in eligible
        if os.path.exists(_standings_path(t["id"]))
    ))
    if not key:
        return False
    memo = _has_data_mem.get(format_id)
    if memo and memo["key"] == key:
        return memo["value"]
    value = False
    for tid in key:
        standings = get_standings(tid, fetch=False)
        if standings and any(p.get("decklist") for p in standings):
            value = True
            break
    _has_data_mem[format_id] = {"key": key, "value": value}
    return value


def get_available_formats():
    """Return {format_id: display_name} for formats that will render data.

    Old regulations have no recent tournaments and some formats have no
    public team data yet, so offering them in the UI would only lead to
    empty pages. Costs one (1h-cached) tournament-list request shared by
    all formats; the decklist check is memoized per format.
    """
    return {
        fid: disp
        for fid, disp in get_vgc_formats().items()
        if _format_has_data(fid)
    }


def _parse_date(value):
    """Parse an ISO date string like 2026-07-01T17:30:00.000Z, or None."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def eligible_tournaments(tournaments, now=None):
    """Filter tournaments to those that should count toward the stats.

    Keeps events with >= MIN_PLAYERS players, dated within WINDOW_DAYS,
    and finished (date + COMPLETION_GRACE_HOURS in the past, so
    in-progress events are skipped and picked up by a later refresh).
    Sorted newest first.
    """
    if now is None:
        now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=WINDOW_DAYS)
    completion_cutoff = now - timedelta(hours=COMPLETION_GRACE_HOURS)

    kept = []
    for t in tournaments:
        if (t.get("players") or 0) < MIN_PLAYERS:
            continue
        date = _parse_date(t.get("date"))
        if date is None or date < window_start or date > completion_cutoff:
            continue
        kept.append(t)
    kept.sort(key=lambda t: t.get("date") or "", reverse=True)
    return kept


def _standings_path(tournament_id):
    return _cache_path("standings", tournament_id)


# In-process cooldown for standings requests that failed (event deleted,
# API outage, rate limiting): without it every page view would retry the
# same doomed fetches. Cleared naturally on process restart.
_failed_fetches = {}


def _fetch_cooling_down(tournament_id):
    return time.time() - _failed_fetches.get(tournament_id, 0) < FAILED_FETCH_COOLDOWN


def get_standings(tournament_id, fetch=True, meta=None):
    """Return cached standings for a tournament, fetching once if missing.

    Finished tournaments never change, so the cache has no TTL. Returns
    None only when the standings were never fetched successfully. `meta`
    (name/date/players) is persisted alongside a fresh fetch so event
    pages can still label a tournament after it leaves the rolling list.
    """
    path = _standings_path(tournament_id)
    cached = _cache_read(path)
    if cached is not None:
        return cached.get("standings")
    if not fetch or _fetch_cooling_down(tournament_id):
        return None
    data = _api_get("/tournaments/" + tournament_id + "/standings")
    if data is None:
        _failed_fetches[tournament_id] = time.time()
        return None
    _failed_fetches.pop(tournament_id, None)
    if not isinstance(data, list):
        data = []
    _cache_write(path, {"id": tournament_id, "meta": meta or {}, "standings": data})
    return data


def _cached_event_meta(tournament_id):
    """Return the meta persisted with a standings file, or None."""
    cached = _cache_read(_standings_path(tournament_id))
    return (cached or {}).get("meta") or None


def normalize_limitless_pokemon(entry, pokedex):
    """Map a Limitless decklist entry to the canonical pokedex name.

    Limitless ids like "urshifu-rapid-strike" collapse to pokedex keys
    like "urshifurapidstrike" (same normalization as sprite lookups).
    Falls back to the Limitless display name when unknown.
    """
    for candidate in (entry.get("id"), entry.get("name")):
        if not candidate:
            continue
        key = re.sub(r"[^a-z0-9]+", "", candidate.lower())
        info = pokedex.get(key)
        if info and info.get("name"):
            return info["name"]
    return entry.get("name") or entry.get("id") or ""


def _clean_value(value):
    """Strip a raw decklist value; treat empty and literal "None" as missing."""
    if not value or not isinstance(value, str):
        return ""
    value = value.strip()
    return "" if value.lower() == "none" else value


def _normalize_slot(slot, pokedex):
    """Normalize one raw Limitless decklist slot into munchstats terms.

    Every value is interned: the same few hundred Pokemon/item/move names
    repeat across tens of thousands of cached team slots, and json.loads
    gives each occurrence its own string object — interning collapses
    them so the resident teams/aggregate memos stay small.
    """
    return {
        "pokemon": sys.intern(normalize_limitless_pokemon(slot, pokedex)),
        "item": sys.intern(_clean_value(slot.get("item"))),
        "ability": sys.intern(_clean_value(slot.get("ability"))),
        # Tera types and natures render raw (CSS classes, tooltip
        # lookups), so force canonical capitalization.
        "tera": sys.intern(_clean_value(slot.get("tera")).capitalize()),
        "nature": sys.intern(_clean_value(slot.get("nature")).capitalize()),
        "moves": [
            sys.intern(m)
            for m in (_clean_value(a) for a in slot.get("attacks") or [])
            if m
        ],
    }


def _display_score(name):
    """Rank how display-ready a variant looks ("Life Orb" beats "life orb")."""
    return (any(c.isupper() for c in name), " " in name)


def _dedupe_counts(counts):
    """Merge case/format variants of the same key ("jolly" + "Jolly").

    Limitless decklists aren't normalized across tournaments, so the same
    move/item/ability shows up in several spellings; merge their counts
    under the most display-ready variant.
    """
    merged = {}
    for name, count in counts.items():
        key = re.sub(r"[^a-z0-9]+", "", name.lower())
        entry = merged.get(key)
        if entry is None:
            merged[key] = [name, count]
        else:
            entry[1] += count
            if _display_score(name) > _display_score(entry[0]):
                entry[0] = name
    return {name: count for name, count in merged.values()}


def _new_acc():
    """Fresh accumulator for incremental standings aggregation."""
    return {"total_teams": 0, "pokemon": {}, "total_slots": 0, "tera_slots": 0}


def _acc_standings(acc, standings, pokedex, max_placing=None):
    """Fold one tournament's standings into an accumulator.

    Incremental so callers can stream tournaments one parsed file at a
    time instead of materializing every standings list at once (the
    full corpus expands to far more RAM than any single event).
    """
    pokemon_stats = acc["pokemon"]
    for player in standings or []:
        decklist = player.get("decklist")
        if not decklist:
            continue
        if max_placing is not None:
            placing = player.get("placing")
            if not placing or placing > max_placing:
                continue
        acc["total_teams"] += 1
        record = player.get("record") or {}
        wins = record.get("wins") or 0
        losses = record.get("losses") or 0
        ties = record.get("ties") or 0

        slots = [_normalize_slot(s, pokedex) for s in decklist]
        team_names = [s["pokemon"] for s in slots]
        for slot, name in zip(slots, team_names):
            if not name:
                continue
            if name not in pokemon_stats:
                pokemon_stats[name] = {
                    "usage_count": 0,
                    "usage_pct": 0,
                    "moves": {},
                    "items": {},
                    "abilities": {},
                    "tera_types": {},
                    "natures": {},
                    "teammates": {},
                    "wins": 0,
                    "losses": 0,
                    "ties": 0,
                }
            stats = pokemon_stats[name]
            stats["usage_count"] += 1
            stats["wins"] += wins
            stats["losses"] += losses
            stats["ties"] += ties

            for move in slot["moves"]:
                stats["moves"][move] = stats["moves"].get(move, 0) + 1
            if slot["item"]:
                stats["items"][slot["item"]] = stats["items"].get(slot["item"], 0) + 1
            if slot["ability"]:
                stats["abilities"][slot["ability"]] = stats["abilities"].get(slot["ability"], 0) + 1
            acc["total_slots"] += 1
            if slot["tera"]:
                acc["tera_slots"] += 1
                stats["tera_types"][slot["tera"]] = stats["tera_types"].get(slot["tera"], 0) + 1
            if slot["nature"]:
                stats["natures"][slot["nature"]] = stats["natures"].get(slot["nature"], 0) + 1
            for teammate in team_names:
                if teammate and teammate != name:
                    stats["teammates"][teammate] = stats["teammates"].get(teammate, 0) + 1


def _finalize_acc(acc):
    """Turn an accumulator into the served aggregate shape.

    Like scrape_tournaments._has_tera_data: when fewer than 10% of slots
    carry a Tera type the format doesn't use Tera (e.g. the Mega
    regulations) and the handful of stale entries are discarded.
    """
    total_teams = acc["total_teams"]
    has_tera = acc["total_slots"] > 0 and (acc["tera_slots"] / acc["total_slots"]) >= 0.10
    for stats in acc["pokemon"].values():
        if not has_tera:
            stats["tera_types"] = {}
        for category in ("moves", "items", "abilities", "tera_types", "natures"):
            stats[category] = _dedupe_counts(stats[category])
        stats["usage_pct"] = round(stats["usage_count"] / max(total_teams, 1) * 100, 2)
        games = stats["wins"] + stats["losses"] + stats["ties"]
        stats["win_rate"] = (
            round((stats["wins"] + 0.5 * stats["ties"]) / games * 100, 1)
            if games > 0
            else None
        )

    return {"total_teams": total_teams, "pokemon": acc["pokemon"]}


def aggregate_standings(standings_by_tid, pokedex, max_placing=None):
    """Aggregate usage stats over many tournaments' standings.

    Mirrors scrape_tournaments.aggregate_usage but for the Limitless
    standings shape (attacks->moves, tera->tera_types) and additionally
    accumulates win/loss/tie records per Pokemon for win rates.
    When max_placing is set, only teams placing at or above it count
    (e.g. 8 for a "top cut" segment).
    """
    acc = _new_acc()
    for standings in standings_by_tid.values():
        _acc_standings(acc, standings, pokedex, max_placing)
    return _finalize_acc(acc)


# One aggregate (and teams list) per format, memoized on the set of
# tournament ids covered; the refresh lock keeps concurrent requests from
# stampeding the API (losers of the race serve whatever is cached).
_agg_mem = {}
_teams_mem = {}
_refresh_lock = threading.Lock()

# Parsing every cached standings file materializes tens of MB of Python
# objects (one 4000+-player event alone is several MB of JSON), so the
# parse must never run per-request: consumers check their key-based memo
# first and rebuild under this lock, so losers of a memo race wait and
# then serve the rebuilt memo instead of parsing their own copy.
_parse_lock = threading.Lock()


def _refresh_and_key(format_id):
    """Refresh lazily; return (cached eligible tournaments, memo key).

    Does no JSON parsing — only existence checks — so it is cheap enough
    to run per-request. Network cost: one tournament-list request at most
    once per hour, plus standings requests only for newly finished
    tournaments (capped at MAX_STANDINGS_PER_REFRESH per cycle). The key
    is the id set of eligible tournaments with standings on disk;
    standings are immutable, so anything memoized on the key stays valid
    until that set changes (new event fetched or window rolls).
    """
    eligible = eligible_tournaments(get_tournament_list(format_id))

    missing = [
        t for t in eligible
        if not os.path.exists(_standings_path(t["id"]))
        and not _fetch_cooling_down(t["id"])
    ]
    if missing and _refresh_lock.acquire(blocking=False):
        try:
            for t in missing[:MAX_STANDINGS_PER_REFRESH]:
                get_standings(t["id"], meta=_event_meta(t))
                time.sleep(FETCH_DELAY_SECONDS)
        finally:
            _refresh_lock.release()

    present = [t for t in eligible if os.path.exists(_standings_path(t["id"]))]
    return present, tuple(sorted(t["id"] for t in present))


def _build_format_memos(format_id, pokedex, present, key):
    """Rebuild a format's aggregate and teams memos in one streamed pass.

    Parses one standings file at a time and folds it into per-tier
    accumulators and the teams list, so peak transient memory is one
    tournament's standings instead of the whole corpus — a single big
    online event expands to tens of MB of parsed JSON on its own. Both
    memos share the pass because they invalidate on the same key.
    Caller must hold _parse_lock. Returns (aggregate data, teams).
    """
    tier_accs = {}
    included = []
    teams = []
    for t in present:
        standings = get_standings(t["id"], fetch=False)
        if not standings or not any(p.get("decklist") for p in standings):
            continue
        meta = {
            "id": t["id"],
            "name": t.get("name", ""),
            "date": t.get("date", ""),
            "players": t.get("players", 0),
        }
        included.append(meta)

        # One accumulator per tournament-size tier: usage from 25+ player
        # events, from 50+ only, etc. Tiers with no tournaments are omitted.
        players = t.get("players") or 0
        for tier in PLAYER_TIERS:
            if players >= tier:
                if tier not in tier_accs:
                    tier_accs[tier] = _new_acc()
                _acc_standings(tier_accs[tier], standings, pokedex)

        for player in standings:
            entry = _team_entry(player, meta, pokedex)
            if entry is None:
                continue
            search_parts = [entry["player"], meta["name"]]
            for s in entry["team"]:
                search_parts += [s["pokemon"], s["item"], s["ability"], s["tera"], s["nature"]]
                search_parts += s["moves"]
            entry["search"] = " ".join(p for p in search_parts if p).lower()
            teams.append(entry)

    data = None
    if included:
        segments = {}
        for tier in PLAYER_TIERS:
            if tier in tier_accs:
                segments[str(tier)] = _finalize_acc(tier_accs[tier])
        data = {
            "format": format_id,
            "segments": segments,
            "tournaments": included,
            "generated_at": time.time(),
        }

    teams.sort(key=lambda e: (e["placing"] or 9999, -(e["tournament"].get("players") or 0)))
    _agg_mem[format_id] = {"key": key, "data": data}
    _teams_mem[format_id] = {"key": key, "teams": teams}
    return data, teams


def build_limitless_aggregate(format_id, pokedex):
    """Return the aggregated stats bundle for a format, refreshing lazily.

    Returns None when no data is available at all (also memoized, so a
    format whose cached standings all lack decklists doesn't re-parse
    them on every request).
    """
    present, key = _refresh_and_key(format_id)
    if not key:
        return None

    memo = _agg_mem.get(format_id)
    if memo and memo["key"] == key:
        return memo["data"]

    with _parse_lock:
        memo = _agg_mem.get(format_id)
        if memo and memo["key"] == key:
            return memo["data"]
        data, _ = _build_format_memos(format_id, pokedex, present, key)
        return data


def _team_entry(player, meta, pokedex):
    """Normalize one standings row into a team entry, or None without a team."""
    decklist = player.get("decklist")
    if not decklist:
        return None
    slots = [s for s in (_normalize_slot(x, pokedex) for x in decklist) if s["pokemon"]]
    if not slots:
        return None
    return {
        "player": player.get("name") or player.get("player") or "",
        "placing": player.get("placing"),
        "record": player.get("record") or {},
        "tournament": meta,
        "team": slots,
    }


# Cut (top-placement) aggregates are built lazily per requested
# (format, size tier, cut) combination instead of eagerly for every one,
# and LRU-bounded so rarely used combinations don't accumulate in RAM.
_cut_agg_mem = OrderedDict()
CUT_AGG_MEM_MAX = 12


def build_limitless_cut_aggregate(format_id, pokedex, min_players, max_placing):
    """Aggregate a format's usage over teams placing at or above a cut.

    Online events carry no day-2 information, so top-placement cuts
    (top 8/16/32 of each tournament) are the Limitless counterpart of
    the official events' day filters. Returns None when no tournament
    matches the size tier.
    """
    present, _ = _refresh_and_key(format_id)
    tier_present = [t for t in present if (t.get("players") or 0) >= min_players]
    if not tier_present:
        return None

    key = tuple(sorted(t["id"] for t in tier_present))
    memo_key = (format_id, min_players, max_placing)
    memo = _cut_agg_mem.get(memo_key)
    if memo and memo["key"] == key:
        _cut_agg_mem.move_to_end(memo_key)
        return memo["data"]

    with _parse_lock:
        memo = _cut_agg_mem.get(memo_key)
        if memo and memo["key"] == key:
            _cut_agg_mem.move_to_end(memo_key)
            return memo["data"]

        acc = _new_acc()
        any_decklists = False
        for t in tier_present:
            standings = get_standings(t["id"], fetch=False)
            if not standings or not any(p.get("decklist") for p in standings):
                continue
            any_decklists = True
            _acc_standings(acc, standings, pokedex, max_placing=max_placing)
        if not any_decklists:
            return None

        data = _finalize_acc(acc)
        _cut_agg_mem[memo_key] = {"key": key, "data": data}
        while len(_cut_agg_mem) > CUT_AGG_MEM_MAX:
            _cut_agg_mem.popitem(last=False)
        return data


def get_all_teams(format_id, pokedex):
    """Return every team from a format's cached standings, best first.

    Each entry carries the player, placing, record, source tournament and
    the normalized team, plus a precomputed lowercase `search` blob
    (player, tournament, Pokemon, items, abilities, moves, teras,
    natures) so callers can text-search the whole corpus cheaply.
    Sorted by placing, ties broken by tournament size (a 1st out of 80
    players beats a 1st out of 25).
    """
    present, key = _refresh_and_key(format_id)
    if not key:
        return []

    memo = _teams_mem.get(format_id)
    if memo and memo["key"] == key:
        return memo["teams"]

    with _parse_lock:
        memo = _teams_mem.get(format_id)
        if memo and memo["key"] == key:
            return memo["teams"]
        _, teams = _build_format_memos(format_id, pokedex, present, key)
        return teams


def _event_meta(tournament):
    """Normalize an API tournament object into the meta served for one event."""
    return {
        "id": tournament.get("id", ""),
        "name": tournament.get("name", ""),
        "date": tournament.get("date", ""),
        "players": tournament.get("players", 0),
        "format": resolve_format_id(tournament),
    }


def find_event(tournament_id):
    """Return the recent-list API object for a tournament id, or None."""
    for t in get_vgc_tournaments():
        if t.get("id") == tournament_id:
            return t
    return None


# Single-event bundles, LRU-bounded: standings never change, so entries
# are immortal until evicted, and EVENT_MEM_MAX keeps a burst of distinct
# event pages from ballooning the dyno's memory.
_event_mem = OrderedDict()


def get_event_bundle(tournament_id, pokedex):
    """Return {"meta", "format_id", "aggregate", "teams"} for one event.

    Serves from cached standings; fetches once only for ids present in
    the recent tournament list, so arbitrary deep-link ids can't spend
    API quota. Returns None when no standings with decklists exist.
    """
    bundle = _event_mem.get(tournament_id)
    if bundle is not None:
        _event_mem.move_to_end(tournament_id)
        return bundle

    listed = find_event(tournament_id)
    standings = get_standings(
        tournament_id,
        fetch=listed is not None,
        meta=_event_meta(listed) if listed else None,
    )
    if not standings:
        return None

    meta = (
        (_event_meta(listed) if listed else None)
        or _cached_event_meta(tournament_id)
        or {"id": tournament_id, "name": "Online Tournament",
            "date": "", "players": 0, "format": ""}
    )

    teams = []
    for player in standings:
        entry = _team_entry(player, meta, pokedex)
        if entry is not None:
            teams.append(entry)
    if not teams:
        return None
    teams.sort(key=lambda e: e["placing"] or 9999)

    bundle = {
        "meta": meta,
        "format_id": meta.get("format") or "",
        "aggregate": aggregate_standings({tournament_id: standings}, pokedex),
        "teams": teams,
    }
    _event_mem[tournament_id] = bundle
    while len(_event_mem) > EVENT_MEM_MAX:
        _event_mem.popitem(last=False)
    return bundle


def get_event_cut_aggregate(tournament_id, pokedex, max_placing):
    """Return one event's aggregate over teams placing at or above a cut.

    Stored on the event's LRU bundle: cut aggregates are small (at most
    max_placing teams) and get evicted together with their event.
    """
    bundle = get_event_bundle(tournament_id, pokedex)
    if not bundle:
        return None
    cuts = bundle.setdefault("cuts", {})
    agg = cuts.get(max_placing)
    if agg is None:
        standings = get_standings(tournament_id, fetch=False) or []
        agg = aggregate_standings(
            {tournament_id: standings}, pokedex, max_placing=max_placing
        )
        cuts[max_placing] = agg
    return agg


def record_points(record):
    """Swiss-style points for one record: a win is 1, a tie is half."""
    record = record or {}
    return (record.get("wins") or 0) + 0.5 * (record.get("ties") or 0)


def group_team_archetypes(teams):
    """Group identical 6-Pokemon teams into archetypes, most points first.

    Two players running the same six Pokemon (regardless of slot order,
    items or moves) pool into one archetype: their points collect into
    one total and their records combine into one win rate. Archetypes
    rank by pooled points; each archetype's players rank by their own
    points (an 11-3 run beats a 4-1), ties broken by placing.
    """
    groups = {}
    order = []
    for entry in teams:
        key = tuple(sorted(s["pokemon"] for s in entry["team"]))
        group = groups.get(key)
        if group is None:
            group = groups[key] = {
                # Display in the best-placing player's slot order
                "pokemon": [s["pokemon"] for s in entry["team"]],
                "count": 0,
                "wins": 0,
                "losses": 0,
                "ties": 0,
                "best_placing": entry["placing"] or 9999,
                "players": [],
            }
            order.append(group)
        group["count"] += 1
        record = entry["record"] or {}
        group["wins"] += record.get("wins") or 0
        group["losses"] += record.get("losses") or 0
        group["ties"] += record.get("ties") or 0
        placing = entry["placing"] or 9999
        if placing < group["best_placing"]:
            group["best_placing"] = placing
        group["players"].append(entry)

    for group in order:
        games = group["wins"] + group["losses"] + group["ties"]
        group["win_rate"] = (
            round((group["wins"] + 0.5 * group["ties"]) / games * 100, 1)
            if games > 0
            else None
        )
        group["points"] = group["wins"] + 0.5 * group["ties"]
        group["players"].sort(
            key=lambda e: (
                -record_points(e["record"]),
                e["placing"] or 9999,
                -(e["tournament"].get("players") or 0),
            )
        )

    order.sort(key=lambda g: (-g["points"], -g["count"], -(g["win_rate"] or 0)))
    return order


def _warm_cache(pokedex, max_cycles=5):
    """Backfill every active format's caches until nothing is missing.

    Iterates formats with eligible tournaments (not get_available_formats,
    which requires already-cached standings — on a cold cache that set is
    empty, and this thread is what populates it). Each
    build_limitless_aggregate call fetches at most
    MAX_STANDINGS_PER_REFRESH standings, so loop (bounded, in case the
    API keeps failing) until each format's eligible set is fully cached.
    """
    try:
        for format_id in get_vgc_formats():
            for _ in range(max_cycles):
                eligible = eligible_tournaments(get_tournament_list(format_id))
                if not eligible:
                    break
                build_limitless_aggregate(format_id, pokedex)
                if all(os.path.exists(_standings_path(t["id"])) for t in eligible):
                    break
    except Exception:
        pass


def warm_cache_async(pokedex):
    """Warm the cache in a daemon thread at app startup.

    On ephemeral hosts (Heroku dynos restart daily and wipe the disk
    cache) this rebuilds the data before the first visitor arrives,
    instead of making them wait out the backfill.
    """
    threading.Thread(target=_warm_cache, args=(pokedex,), daemon=True).start()
