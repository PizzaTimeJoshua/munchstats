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
MIN_PLAYERS = 24  # ignore small casual/practice events
WINDOW_DAYS = 30  # rolling metagame window
COMPLETION_GRACE_HOURS = 12  # skip events until date + grace < now
MAX_STANDINGS_PER_REFRESH = 30  # rate-limit frugality cap per refresh
FETCH_DELAY_SECONDS = 0.3  # politeness delay between standings fetches
LIST_FETCH_LIMIT = 200
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


def get_tournament_list(format_id):
    """Return the raw tournament list for a format (1h TTL, stale fallback)."""
    path = _cache_path("tournaments_" + format_id)
    cached = _cache_read(path, ttl=LIST_CACHE_TTL)
    if cached is not None:
        return cached
    data = _api_get(
        "/tournaments",
        params={"game": "VGC", "format": format_id, "limit": LIST_FETCH_LIMIT},
    )
    if isinstance(data, list):
        _cache_write(path, data)
        return data
    return _cache_read(path, ttl=LIST_CACHE_TTL, allow_stale=True) or []


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

            team_names = [normalize_limitless_pokemon(s, pokedex) for s in decklist]
            for slot, name in zip(decklist, team_names):
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

                for move in slot.get("attacks") or []:
                    move = _clean_value(move)
                    if move:
                        stats["moves"][move] = stats["moves"].get(move, 0) + 1
                item = _clean_value(slot.get("item"))
                if item:
                    stats["items"][item] = stats["items"].get(item, 0) + 1
                ability = _clean_value(slot.get("ability"))
                if ability:
                    stats["abilities"][ability] = stats["abilities"].get(ability, 0) + 1
                total_slots += 1
                # Tera types and natures render raw (CSS classes, tooltip
                # lookups), so force canonical capitalization here.
                tera = _clean_value(slot.get("tera")).capitalize()
                if tera:
                    tera_slots += 1
                    stats["tera_types"][tera] = stats["tera_types"].get(tera, 0) + 1
                nature = _clean_value(slot.get("nature")).capitalize()
                if nature:
                    stats["natures"][nature] = stats["natures"].get(nature, 0) + 1
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


# One aggregate per format, memoized on the set of tournament ids it
# covers; the refresh lock keeps concurrent requests from stampeding the
# API (losers of the race serve whatever standings are already cached).
_agg_mem = {}
_refresh_lock = threading.Lock()


def build_limitless_aggregate(format_id, pokedex):
    """Return the aggregated stats bundle for a format, refreshing lazily.

    Network cost: one tournament-list request at most once per hour,
    plus standings requests only for newly finished tournaments (capped
    at MAX_STANDINGS_PER_REFRESH per cycle). Returns None when no data
    is available at all.
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

    if not standings_by_tid:
        return None

    key = tuple(sorted(standings_by_tid))
    memo = _agg_mem.get(format_id)
    if memo and memo["key"] == key:
        return memo["data"]

    data = {
        "format": format_id,
        "segments": {
            "all": aggregate_standings(standings_by_tid, pokedex),
            "top8": aggregate_standings(standings_by_tid, pokedex, max_placing=8),
        },
        "tournaments": included,
        "generated_at": time.time(),
    }
    _agg_mem[format_id] = {"key": key, "data": data}
    return data


def _warm_cache(pokedex, max_cycles=5):
    """Backfill the default format's caches until no standings are missing.

    Each build_limitless_aggregate call fetches at most
    MAX_STANDINGS_PER_REFRESH standings, so loop (bounded, in case the
    API keeps failing) until the eligible set is fully cached.
    """
    try:
        formats = get_vgc_formats()
        if not formats:
            return
        format_id = next(iter(formats))
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
