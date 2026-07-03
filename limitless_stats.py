"""Limitless online VGC tournament usage stats.

Fetches tournament lists and standings from the Limitless API
(https://docs.limitlesstcg.com/developer.html) and aggregates them into
Pikalytics-style usage stats per regulation format.

Caching strategy (keyless-API friendly):
  - The tournament list for a format is cached on disk for 1 hour.
  - Standings of finished tournaments never change, so they are cached
    on disk forever; each hourly refresh only fetches newly seen events.
  - The computed aggregate is memoized in-process, keyed on the set of
    tournament ids it was built from.
"""

import json
import os
import re
import threading
import time
from datetime import datetime, timedelta, timezone

import requests

LIMITLESS_API_BASE = "https://play.limitlesstcg.com/api"
LIMITLESS_CACHE_DIR = os.path.join("cache", "limitless")
STANDINGS_DIR = os.path.join(LIMITLESS_CACHE_DIR, "standings")
LIST_CACHE_TTL = 3600  # tournament lists refresh hourly
FORMATS_CACHE_TTL = 12 * 3600  # /games changes rarely
PLAYER_TIERS = [25, 50, 100, 200]  # usage-segment thresholds (tournament size)
MIN_PLAYERS = PLAYER_TIERS[0]  # ignore small casual/practice events
WINDOW_DAYS = 30  # rolling metagame window
COMPLETION_GRACE_HOURS = 12  # skip events until date + grace < now
MAX_STANDINGS_PER_REFRESH = 30  # rate-limit frugality cap per refresh
FETCH_DELAY_SECONDS = 0.3  # politeness delay between standings fetches
LIST_FETCH_LIMIT = 500
LIST_MAX_PAGES = 3  # page until the rolling window is covered
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
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f)
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
    """True when a tournament name references the format id as a token."""
    return re.search(
        r"(?<![A-Za-z0-9])" + re.escape(format_id) + r"(?![A-Za-z0-9])",
        name,
        re.IGNORECASE,
    )


def get_tournament_list(format_id):
    """Return the tournaments belonging to one format.

    Tournaments run with tweaked rules are tagged "CUSTOM" instead of a
    regulation (e.g. the 898-player Smogon VGC Major Live "Reg M-B");
    count them toward a format when their name says so.
    """
    return [
        t for t in get_vgc_tournaments()
        if t.get("format") == format_id
        or (
            t.get("format") == "CUSTOM"
            and t.get("name")
            and _format_matches_name(format_id, t["name"])
        )
    ]


def get_available_formats():
    """Return {format_id: display_name} for formats with eligible events.

    Old regulations have no recent tournaments, so offering them in the
    UI would only lead to empty pages. Checking costs one (1h-cached)
    tournament-list request per format.
    """
    return {
        fid: disp
        for fid, disp in get_vgc_formats().items()
        if eligible_tournaments(get_tournament_list(fid))
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


def get_standings(tournament_id, fetch=True):
    """Return cached standings for a tournament, fetching once if missing.

    Finished tournaments never change, so the cache has no TTL. Returns
    None only when the standings were never fetched successfully.
    """
    path = _standings_path(tournament_id)
    cached = _cache_read(path)
    if cached is not None:
        return cached.get("standings")
    if not fetch:
        return None
    data = _api_get("/tournaments/" + tournament_id + "/standings")
    if data is None:
        return None
    if not isinstance(data, list):
        data = []
    _cache_write(path, {"id": tournament_id, "standings": data})
    return data


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
    """Normalize one raw Limitless decklist slot into munchstats terms."""
    return {
        "pokemon": normalize_limitless_pokemon(slot, pokedex),
        "item": _clean_value(slot.get("item")),
        "ability": _clean_value(slot.get("ability")),
        # Tera types and natures render raw (CSS classes, tooltip
        # lookups), so force canonical capitalization.
        "tera": _clean_value(slot.get("tera")).capitalize(),
        "nature": _clean_value(slot.get("nature")).capitalize(),
        "moves": [m for m in (_clean_value(a) for a in slot.get("attacks") or []) if m],
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


def aggregate_standings(standings_by_tid, pokedex, max_placing=None):
    """Aggregate usage stats over many tournaments' standings.

    Mirrors scrape_tournaments.aggregate_usage but for the Limitless
    standings shape (attacks->moves, tera->tera_types) and additionally
    accumulates win/loss/tie records per Pokemon for win rates.
    When max_placing is set, only teams placing at or above it count
    (e.g. 8 for a "top cut" segment).

    Like scrape_tournaments._has_tera_data: when fewer than 10% of slots
    carry a Tera type the format doesn't use Tera (e.g. the Mega
    regulations) and the handful of stale entries are discarded.
    """
    total_teams = 0
    pokemon_stats = {}
    total_slots = 0
    tera_slots = 0

    for standings in standings_by_tid.values():
        for player in standings or []:
            decklist = player.get("decklist")
            if not decklist:
                continue
            if max_placing is not None:
                placing = player.get("placing")
                if not placing or placing > max_placing:
                    continue
            total_teams += 1
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
                total_slots += 1
                if slot["tera"]:
                    tera_slots += 1
                    stats["tera_types"][slot["tera"]] = stats["tera_types"].get(slot["tera"], 0) + 1
                if slot["nature"]:
                    stats["natures"][slot["nature"]] = stats["natures"].get(slot["nature"], 0) + 1
                for teammate in team_names:
                    if teammate and teammate != name:
                        stats["teammates"][teammate] = stats["teammates"].get(teammate, 0) + 1

    has_tera = total_slots > 0 and (tera_slots / total_slots) >= 0.10
    for stats in pokemon_stats.values():
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

    return {"total_teams": total_teams, "pokemon": pokemon_stats}


# One aggregate (and teams list) per format, memoized on the set of
# tournament ids covered; the refresh lock keeps concurrent requests from
# stampeding the API (losers of the race serve whatever is cached).
_agg_mem = {}
_teams_mem = {}
_refresh_lock = threading.Lock()


def _cached_standings_map(format_id):
    """Refresh lazily and return ({tid: standings}, [tournament meta]).

    Network cost: one tournament-list request at most once per hour,
    plus standings requests only for newly finished tournaments (capped
    at MAX_STANDINGS_PER_REFRESH per cycle). Only tournaments with at
    least one public decklist are included.
    """
    tournaments = get_tournament_list(format_id)
    eligible = eligible_tournaments(tournaments)

    missing = [t for t in eligible if not os.path.exists(_standings_path(t["id"]))]
    if missing and _refresh_lock.acquire(blocking=False):
        try:
            for t in missing[:MAX_STANDINGS_PER_REFRESH]:
                get_standings(t["id"])
                time.sleep(FETCH_DELAY_SECONDS)
        finally:
            _refresh_lock.release()

    standings_by_tid = {}
    included = []
    for t in eligible:
        standings = get_standings(t["id"], fetch=False)
        if standings and any(p.get("decklist") for p in standings):
            standings_by_tid[t["id"]] = standings
            included.append({
                "id": t["id"],
                "name": t.get("name", ""),
                "date": t.get("date", ""),
                "players": t.get("players", 0),
            })
    return standings_by_tid, included


def build_limitless_aggregate(format_id, pokedex):
    """Return the aggregated stats bundle for a format, refreshing lazily.

    Returns None when no data is available at all.
    """
    standings_by_tid, included = _cached_standings_map(format_id)
    if not standings_by_tid:
        return None

    key = tuple(sorted(standings_by_tid))
    memo = _agg_mem.get(format_id)
    if memo and memo["key"] == key:
        return memo["data"]

    # One segment per tournament-size tier: usage from 25+ player events,
    # from 50+ only, etc. Tiers with no tournaments are omitted.
    players_by_tid = {t["id"]: t.get("players") or 0 for t in included}
    segments = {}
    for tier in PLAYER_TIERS:
        tier_standings = {
            tid: s for tid, s in standings_by_tid.items()
            if players_by_tid[tid] >= tier
        }
        if tier_standings:
            segments[str(tier)] = aggregate_standings(tier_standings, pokedex)

    data = {
        "format": format_id,
        "segments": segments,
        "tournaments": included,
        "generated_at": time.time(),
    }
    _agg_mem[format_id] = {"key": key, "data": data}
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
    standings_by_tid, included = _cached_standings_map(format_id)
    if not standings_by_tid:
        return []

    key = tuple(sorted(standings_by_tid))
    memo = _teams_mem.get(format_id)
    if memo and memo["key"] == key:
        return memo["teams"]

    meta_by_tid = {t["id"]: t for t in included}
    teams = []
    for tid, standings in standings_by_tid.items():
        meta = meta_by_tid[tid]
        for player in standings:
            decklist = player.get("decklist")
            if not decklist:
                continue
            slots = [s for s in (_normalize_slot(x, pokedex) for x in decklist) if s["pokemon"]]
            if not slots:
                continue
            name = player.get("name") or player.get("player") or ""
            entry = {
                "player": name,
                "placing": player.get("placing"),
                "record": player.get("record") or {},
                "tournament": meta,
                "team": slots,
            }
            search_parts = [name, meta["name"]]
            for s in slots:
                search_parts += [s["pokemon"], s["item"], s["ability"], s["tera"], s["nature"]]
                search_parts += s["moves"]
            entry["search"] = " ".join(p for p in search_parts if p).lower()
            teams.append(entry)

    teams.sort(key=lambda e: (e["placing"] or 9999, -(e["tournament"].get("players") or 0)))
    _teams_mem[format_id] = {"key": key, "teams": teams}
    return teams


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

    Each build_limitless_aggregate call fetches at most
    MAX_STANDINGS_PER_REFRESH standings, so loop (bounded, in case the
    API keeps failing) until each format's eligible set is fully cached.
    """
    try:
        for format_id in get_available_formats():
            for _ in range(max_cycles):
                build_limitless_aggregate(format_id, pokedex)
                eligible = eligible_tournaments(get_tournament_list(format_id))
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
