"""VGCPastes team repository (Google Sheets, cached 12h).

Fetches the public VGCPastes spreadsheet tabs as CSV and parses them into
searchable team entries. The sheet holds the team roster (six Pokémon +
held items), player/event metadata and a Pokepaste link per team; the
actual movesets live at the Pokepaste, which the UI links out to.

Caching strategy:
  - Each repository tab is cached on disk for 12 hours with stale
    fallback, matching the Champions battle-data pattern (Heroku dynos
    wipe the disk daily; warm_cache_async rebuilds it at boot).
  - The parsed team list is memoized in-process, keyed on cache mtime.
"""

import csv
import difflib
import io
import json
import os
import random
import re
import threading
import time
from datetime import datetime
from urllib.parse import quote

import requests

SHEET_ID = "1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw"
CACHE_DIR = os.path.join("cache", "vgcpastes")
CACHE_TTL = 12 * 3600
ATTRIBUTION_TEXT = "Team data from the VGCPastes Repository"
ATTRIBUTION_URL = "https://twitter.com/VGCPastes"
SHEET_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/"

# Repository slug -> sheet tab. "code_label" names the per-team code column
# (Champions teams share replica codes, cartridge VGC teams rental codes).
# "limitless_reg" is the regulation token matching the corresponding
# Limitless online-tournament format (see app._limitless_reg_token).
REPOSITORIES = {
    "champions-mb": {
        "sheet": "Champions M-B",
        "display": "Champions M-B",
        "code_label": "Replica Code",
        "limitless_reg": "mb",
    },
    "champions-ma": {
        "sheet": "Champions M-A",
        "display": "Champions M-A",
        "code_label": "Replica Code",
        "limitless_reg": "ma",
    },
    "sv-regulation-i": {
        "sheet": "SV Regulation I",
        "display": "SV Regulation I",
        "code_label": "Rental Code",
        "limitless_reg": "i",
    },
}
DEFAULT_REPOSITORY = "champions-mb"

# Fixed column layout of every repository tab (header rows 0-2, data from 3).
_COL_TEAM_ID = 0
_COL_DESCRIPTION = 1
_COL_PLAYER = 3
_ITEM_COLS = [7, 10, 13, 16, 19, 22]
_COL_PASTE = 24
_COL_EVS = 25
_COL_CODE = 28
_COL_DATE = 29
_COL_EVENT = 30
_COL_RANK = 31
_COL_SOURCE = 32
_COL_REPORT = 33
_COL_OTHER = 34
_COL_OWNER = 35
_POKEMON_COLS = [37, 38, 39, 40, 41, 42]
_MIN_COLS = 43

_DATE_FORMATS = ["%d %b %Y", "%d %B %Y", "%Y-%m-%d", "%m/%d/%Y"]

os.makedirs(CACHE_DIR, exist_ok=True)


def _cache_path(repo_id):
    safe = re.sub(r"[^A-Za-z0-9_-]", "_", repo_id)
    return os.path.join(CACHE_DIR, safe + ".json")


def _cache_read(path, allow_stale=False):
    if not os.path.exists(path):
        return None
    if not allow_stale and (time.time() - os.path.getmtime(path)) > CACHE_TTL:
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _cache_write(path, data):
    tmp = path + ".tmp"
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f)
        os.replace(tmp, path)
    except Exception:
        pass


def _clean(value):
    """Normalize a sheet cell: strip, and map '', '-' and 'None' to ''."""
    value = (value or "").strip()
    return "" if value in ("-", "None") else value


def _clean_link(value):
    value = _clean(value)
    return value if value.startswith("http") else ""


def _parse_date(value):
    """Return (iso_date, display) from the sheet's date cell, or ("", raw)."""
    value = _clean(value)
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).strftime("%Y-%m-%d"), value
        except ValueError:
            continue
    return "", value


def _parse_row(row):
    """Parse one CSV data row into a team dict, or None if not a team."""
    if len(row) < _MIN_COLS or not _clean(row[_COL_TEAM_ID]):
        return None
    pokemon = [_clean(row[c]) for c in _POKEMON_COLS]
    pokemon = [p for p in pokemon if p]
    if not pokemon:
        return None
    items = [_clean(row[c]) for c in _ITEM_COLS][: len(pokemon)]
    date_iso, date_display = _parse_date(row[_COL_DATE])
    team = {
        "team_id": _clean(row[_COL_TEAM_ID]),
        "description": _clean(row[_COL_DESCRIPTION]),
        "player": _clean(row[_COL_PLAYER]),
        "owner": _clean(row[_COL_OWNER]),
        "pokemon": pokemon,
        "items": items,
        "pokepaste": _clean_link(row[_COL_PASTE]),
        "has_evs": _clean(row[_COL_EVS]).lower() == "yes",
        "code": _clean(row[_COL_CODE]),
        "date": date_iso,
        "date_display": date_display,
        "event": _clean(row[_COL_EVENT]),
        "rank": _clean(row[_COL_RANK]),
        "source_link": _clean_link(row[_COL_SOURCE]),
        "report_link": _clean_link(row[_COL_REPORT]),
        "other_link": _clean_link(row[_COL_OTHER]),
    }
    return team


def _fetch_repository(sheet_name):
    """Download one tab as CSV and parse it, or None on any failure."""
    url = (
        f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq"
        f"?tqx=out:csv&sheet={quote(sheet_name)}"
    )
    try:
        resp = requests.get(
            url,
            timeout=30,
            headers={"User-Agent": "MunchStats (+https://munchstats.com)"},
        )
        if resp.status_code != 200:
            return None
        resp.encoding = "utf-8"
        rows = list(csv.reader(io.StringIO(resp.text)))
        # The first three rows are banner/header rows in every tab.
        teams = [t for t in (_parse_row(r) for r in rows[3:]) if t]
        # A format/layout change upstream would parse to nothing; treat
        # that as a failure so the stale cache keeps serving instead.
        return teams or None
    except Exception:
        return None


# Parsed team lists are small (<1MB); memoize per repo on cache mtime.
_teams_mem = {}


def get_teams(repo_id):
    """Return the parsed team list for a repository (newest first), or []."""
    repo = REPOSITORIES.get(repo_id)
    if repo is None:
        return []
    path = _cache_path(repo_id)
    mtime = os.path.getmtime(path) if os.path.exists(path) else None
    memo = _teams_mem.get(repo_id)
    if (
        memo is not None
        and mtime is not None
        and memo["mtime"] == mtime
        and (time.time() - mtime) <= CACHE_TTL
    ):
        return memo["teams"]

    teams = _cache_read(path)
    if teams is None:
        teams = _fetch_repository(repo["sheet"])
        if teams is not None:
            _cache_write(path, teams)
        else:
            teams = _cache_read(path, allow_stale=True) or []
    if os.path.exists(path):
        _teams_mem[repo_id] = {"mtime": os.path.getmtime(path), "teams": teams}
    return teams


def _normalize_word(word):
    return re.sub(r"[^a-z0-9]", "", word.lower())


def _fuzzy_correct_group(terms, vocab, vocab_keys):
    """Return a copy of `terms` with misspelled Pokémon/item names replaced
    by their closest vocabulary match, or None when nothing changed.

    Word n-grams (longest first) are compared so multi-word names correct
    as a unit ("focus sassh" -> "focus sash"). The 0.8 cutoff only fixes
    small typos, keeping player/event words from turning into Pokémon.
    """
    corrected = []
    changed = False
    i = 0
    while i < len(terms):
        match, used = None, 1
        for n in (3, 2, 1):
            if i + n > len(terms):
                continue
            gram = _normalize_word("".join(terms[i:i + n]))
            if not gram:
                continue
            if gram in vocab:
                match, used = vocab[gram], n
                break
            close = difflib.get_close_matches(gram, vocab_keys, 1, 0.8)
            if close:
                match, used = vocab[close[0]], n
                break
        if match is None:
            corrected.append(terms[i])
            i += 1
        else:
            match = match.lower()
            if match != " ".join(terms[i:i + used]):
                changed = True
            corrected.append(match)
            i += used
    return corrected if changed else None


def _slot_matches(team, terms):
    """True if all terms of one comma-group match the same team slot
    (Pokémon name + its held item).

    Slot scoping is what makes "kingambit focus sash" mean a Kingambit
    *holding* a Focus Sash rather than any Focus Sash on the team.
    """
    items = team["items"]
    for i, name in enumerate(team["pokemon"]):
        slot = f"{name} {items[i] if i < len(items) else ''}".lower()
        if all(term in slot for term in terms):
            return True
    return False


def _meta_blob(team):
    """Lowercase metadata blob the player search matches against."""
    return " ".join(
        filter(None, [
            team["team_id"], team["description"], team["player"],
            team["owner"], team["event"], team["rank"], team["code"],
        ])
    ).lower()


def search_teams(repo_id, query="", player_query="", limit=None,
                 require_evs=False, require_code=False, require_report=False,
                 match_any=False, vocab=None, sort="newest", seed=None):
    """Return (matching teams, total match count).

    The Pokémon `query` splits on commas into groups; within a group
    every term must match the same slot (see _slot_matches). Teams must
    satisfy all groups, or any group when match_any is set. It never
    matches players or events, so "Snorlax" won't return teams by a
    player named Snorlax.

    `player_query` is a separate search over the team's metadata
    (player, owner, description, event, rank, team ID, code): every
    whitespace term must appear somewhere in that blob.

    `vocab` ({normalized: canonical} of Pokémon/item names) enables fuzzy
    spelling correction; corrections only ever widen a group's matches,
    since the original terms are always tried too.

    `sort` is "newest" (sheet order), "oldest", or "random"; a random
    order is deterministic for a given `seed` so paged requests sharing
    one seed see a single consistent shuffle.
    """
    teams = get_teams(repo_id)
    if require_evs:
        teams = [t for t in teams if t["has_evs"]]
    if require_code:
        teams = [t for t in teams if t["code"]]
    if require_report:
        teams = [t for t in teams if t["report_link"]]
    player_terms = player_query.strip().lower().split()
    if player_terms:
        teams = [
            t for t in teams
            if all(term in _meta_blob(t) for term in player_terms)
        ]
    groups = [g.split() for g in query.strip().lower().split(",")]
    groups = [g for g in groups if g]
    if groups:
        vocab_keys = list(vocab.keys()) if vocab else []
        checks = [
            (g, _fuzzy_correct_group(g, vocab, vocab_keys) if vocab else None)
            for g in groups
        ]
        combine = any if match_any else all
        teams = [
            t for t in teams
            if combine(
                _slot_matches(t, g) or (c is not None and _slot_matches(t, c))
                for g, c in checks
            )
        ]
    if sort == "oldest":
        teams = teams[::-1]
    elif sort == "random":
        # Copy first: without filters `teams` is the memoized cache list,
        # which an in-place shuffle would corrupt for later requests.
        teams = list(teams)
        random.Random(seed).shuffle(teams)
    total = len(teams)
    if limit is not None:
        teams = teams[:limit]
    return teams, total


def get_team(repo_id, team_id):
    """Return one team by its sheet Team ID, or None."""
    for team in get_teams(repo_id):
        if team["team_id"] == team_id:
            return team
    return None


_PASTE_URL_RE = re.compile(r"^https://pokepast\.es/([0-9a-f]+)/?$")
_PASTES_DIR = os.path.join(CACHE_DIR, "pastes")
os.makedirs(_PASTES_DIR, exist_ok=True)


def get_paste_text(paste_url):
    """Return the raw Showdown-format text of a pokepast.es paste, or None.

    Pastes are immutable, so cached copies never expire (the dyno wiping
    the disk just means a cheap refetch on next view).
    """
    match = _PASTE_URL_RE.match(paste_url or "")
    if not match:
        return None
    path = os.path.join(_PASTES_DIR, match.group(1) + ".txt")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception:
            pass
    try:
        resp = requests.get(
            f"https://pokepast.es/{match.group(1)}/raw",
            timeout=15,
            headers={"User-Agent": "MunchStats (+https://munchstats.com)"},
        )
        if resp.status_code != 200:
            return None
        resp.encoding = "utf-8"
        text = resp.text
    except Exception:
        return None
    tmp = path + ".tmp"
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(text)
        os.replace(tmp, path)
    except Exception:
        pass
    return text


def repository_list():
    """Return [[repo_id, display_name], ...] in declared order."""
    return [[rid, repo["display"]] for rid, repo in REPOSITORIES.items()]


def _warm_cache():
    for repo_id in REPOSITORIES:
        try:
            get_teams(repo_id)
        except Exception:
            pass


def warm_cache_async():
    """Refetch all repositories in a daemon thread at app startup."""
    threading.Thread(target=_warm_cache, daemon=True).start()
