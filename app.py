import base64
import difflib
import gzip
import json
import math
import os
import re
import smtplib
import threading
import time
import zlib
from email.message import EmailMessage
from collections import OrderedDict
from datetime import datetime
from functools import lru_cache

import ijson
import requests
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, redirect, render_template, request, url_for
from flask_babel import Babel, get_locale, gettext
import pyjson5

import insights
import limitless_stats
import og_card
import vgcpastes

load_dotenv()

app = Flask(__name__)

# i18n: UI chrome only -- Pokemon/move/item/ability names stay English.
LANGUAGES = ["en", "es"]


def _select_locale():
    lang = request.args.get("lang")
    if lang in LANGUAGES:
        return lang
    lang = request.cookies.get("lang")
    if lang in LANGUAGES:
        return lang
    return request.accept_languages.best_match(LANGUAGES, "en")


babel = Babel(app, locale_selector=_select_locale)

# Strings rendered by static JS (client-side HTML builders). Served to the
# page as window.I18N so JS can translate via msT(); English pages get an
# empty dict and msT() falls back to the key.
JS_UI_STRINGS = [
    # usage page sections (tools_2.3.js rebuilds the right panel on click)
    "Base Stats", "Moves", "Teammates", "Items", "Abilities", "Natures",
    "Tera Types", "EV Spreads", "Stat Point Spreads", "Top EVs By Category",
    "Top Points By Category", "Export Pokemon", "Checks and Counters",
    "Usage Trend", "Usage Rank Trend", "Merch", "Top Teams", "Recent Replays",
    "Copy Pokemon to Clipboard", "Copy Team", "Copy Team to Clipboard",
    "Show", "Hide", "Show all", "Export", "Usage", "Rank",
    "Cumulative", "Reverse Cumulative",
    "Loading merch...", "No merch found", "Could not load merch",
    "Loading tournament data...", "No tournament data found",
    "Could not load tournament data", "Loading replays...",
    "No replays found", "Could not load replays",
    # damage calc
    "Outspeeds", "Ties", "Slower", "of sets", "More", "Less", "Guaranteed",
    # damage calc team importer
    "team", "Paste a team first.", "Importing…", "Couldn't import that paste.",
    "Pokémon imported to", "your side", "the opponent",
    "no data in this format.", "Clear imported team",
    # teams page cards
    "View Team", "Source", "Report", "Untitled Team", "No EVs",
    "Click to copy", "Rental Code", "Replica Code",
    # teams page Limitless section
    "Loading tournament teams...", "No matching tournament teams.",
    "No Limitless data for this format yet.", "matching teams",
    "points", "win rate", "best",
    # tournaments hub
    "Loading teams...", "No teams found.", "Failed to load teams.",
    "Loading standings...", "No standings available.",
    "Failed to load standings.", "No tournaments found.",
    "Largest Fields", "Most Recent", "Top Usage by Stage", "Biggest Movers",
    "players", "Standings", "Events", "All Events",
    "Day 1", "Day 2", "Top Cut", "All Teams", "Top 8", "Top 16", "Top 32",
    "Most used Pokemon at each stage of the tournament. Δ is the change in usage share (percentage points) from the previous stage. Click a Pokemon for its full stats.",
    "Largest changes in usage share between stages — a quick read on what worked and what didn't.",
    # tooltips injected by JS
    "These are affiliate eBay links that help support the website.",
    "High-rated replays where this Pokemon was used.",
    "Replays show base form only and may not reflect this specific form.",
]


@app.context_processor
def _inject_locale():
    lang = str(get_locale())
    js_i18n = {}
    if lang != "en":
        js_i18n = {s: gettext(s) for s in JS_UI_STRINGS}
    return {"current_lang": lang, "languages": LANGUAGES, "js_i18n": js_i18n}

# Directory and global data definitions
DATA_DIRECTORY = "stats"
os.makedirs(DATA_DIRECTORY, exist_ok=True)

DEFAULT_META = "gen9championsvgc2026regmbbo3"
SMOGON_STATS_URL = "https://www.smogon.com/stats/"

# Global dictionaries for loaded data
formatDisplayNames = {}
availableFormats = []
spriteIndex = {}
itemDetails = {}
abilityDetails = {}
moveDetails = {}
championsMoveDetails = {}
championsAbilityDetails = {}
pokedexEntries = {}

STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"]

# Replay/Teams integration
REPLAY_DATA_DIR = os.path.join(DATA_DIRECTORY, "replays")
os.makedirs(REPLAY_DATA_DIR, exist_ok=True)

REPLAY_FORMATS = [
    "gen9championsvgc2026regmb",
    "gen9championsvgc2026regmbbo3",
    "gen9championsou",
    "gen9championsbssregmb",
    "gen9vgc2026regibo3",
    "gen9vgc2026regi",
    "gen9nationaldex",
    "gen9ou",
    "gen9nationaldexubers",
    "gen9anythinggoes",
    "gen9doublesou",
    "gen9ubers",
    "gen9nationaldexdoubles"
]

# Replay JSONs are regenerated every ~6h by the update-replay-stats workflow
# and published to the repo's replay-data branch (not main, so no Heroku
# redeploy). They are stored there gzipped — the raw JSONs run past GitHub's
# 100MB file limit — and fetched from raw.githubusercontent.com on demand,
# then cached on disk decompressed with ETag revalidation. Set
# REPLAY_DATA_URL="" to skip fetching and serve the local (uncompressed)
# stats/replays/ copies directly (dev).
REPLAY_DATA_URL = os.environ.get(
    "REPLAY_DATA_URL",
    "https://raw.githubusercontent.com/PizzaTimeJoshua/munchstats/replay-data/stats/replays/",
)
REPLAY_CACHE_DIR = os.path.join("cache", "replays")
os.makedirs(REPLAY_CACHE_DIR, exist_ok=True)
REPLAY_CACHE_TTL = 30 * 60

_replay_fetch_guard = threading.Lock()
_replay_fetch_locks = {}


def _replay_fetch_lock(filename):
    with _replay_fetch_guard:
        return _replay_fetch_locks.setdefault(filename, threading.Lock())


def get_replay_data_file(filename):
    """Return a local path to the freshest available copy of a replay data
    file, or None if it exists nowhere. Checks the remote at most once per
    REPLAY_CACHE_TTL; a stored ETag turns unchanged re-checks into cheap 304s.
    Falls back to a stale cached copy, then to the snapshot bundled in the
    deploy at stats/replays/."""
    bundled = os.path.join(REPLAY_DATA_DIR, filename)
    if not REPLAY_DATA_URL:
        return bundled if os.path.exists(bundled) else None

    cached = os.path.join(REPLAY_CACHE_DIR, filename)
    # Sidecar's content is the last ETag; its mtime is the last remote check.
    marker = cached + ".etag"
    with _replay_fetch_lock(filename):
        if (
            os.path.exists(marker)
            and time.time() - os.path.getmtime(marker) < REPLAY_CACHE_TTL
        ):
            if os.path.exists(cached):
                return cached
            # Recent check found nothing remote (404); don't re-ask yet.
            return bundled if os.path.exists(bundled) else None

        etag = ""
        if os.path.exists(marker) and os.path.exists(cached):
            with open(marker, "r", encoding="utf-8") as f:
                etag = f.read().strip()
        headers = {"If-None-Match": etag} if etag else {}
        status = None
        tmp = cached + ".tmp"
        try:
            with requests.get(
                REPLAY_DATA_URL + filename + ".gz",
                headers=headers,
                stream=True,
                timeout=(6.1, 120),
            ) as resp:
                status = resp.status_code
                if status == 200:
                    # wbits=31 selects a gzip wrapper. Inflating chunk by
                    # chunk keeps peak memory at one chunk rather than the
                    # whole file, which matters on a 512MB dyno.
                    dec = zlib.decompressobj(31)
                    with open(tmp, "wb") as f:
                        for chunk in resp.iter_content(chunk_size=1 << 20):
                            f.write(dec.decompress(chunk))
                        f.write(dec.flush())
                    if not dec.eof:
                        raise zlib.error("truncated gzip stream")
                    os.replace(tmp, cached)
                    with open(marker, "w", encoding="utf-8") as f:
                        f.write(resp.headers.get("ETag", ""))
        except (requests.RequestException, zlib.error, OSError):
            # A failure partway through a 200 leaves status at 200 on purpose,
            # so the TTL window below still resets: back off and serve the
            # stale copy instead of re-downloading tens of MB every request.
            try:
                os.remove(tmp)
            except OSError:
                pass
        if status in (200, 304, 404):
            # Got a definitive answer — start a fresh TTL window.
            with open(marker, "a", encoding="utf-8"):
                pass
            os.utime(marker, None)

        if os.path.exists(cached):
            return cached
        return bundled if os.path.exists(bundled) else None


def normalize_format(fmt):
    """Strip bo3 suffix for format comparison."""
    return fmt[:-3] if fmt.endswith("bo3") else fmt


def tournament_format_matches(tournament_format, page_format):
    """Check if a tournament's format matches the page's current format."""
    return normalize_format(tournament_format) == normalize_format(page_format)


def get_base_pokemon_name(name):
    """Strip Mega/Primal suffixes to get the base Pokemon name for tournament/replay lookup."""
    # Exception: Floette-Mega's base form is Floette-Eternal, not Floette.
    if name == "Floette-Mega":
        return "Floette-Eternal"
    return re.sub(r"-(Mega|Primal)(-[A-Z])?$", "", name)


def is_transformed_pokemon(name):
    """Check if a Pokemon name is a Mega or Primal form."""
    return bool(re.search(r"-(Mega|Primal)(-[A-Z])?$", name))


# Built after data load — maps "Charizard-Mega-X" -> "Charizardite X", etc.
_mega_required_items = {}


def build_mega_item_lookup():
    """Build reverse lookup from mega Pokemon name to required held item."""
    global _mega_required_items
    for _key, item in itemDetails.items():
        mega_map = item.get("megaStone")
        if mega_map and isinstance(mega_map, dict):
            for _base, mega_name in mega_map.items():
                _mega_required_items[mega_name.lower()] = item.get("name", "")
        if item.get("isPrimalOrb"):
            users = item.get("itemUser", [])
            for user in users:
                primal_name = user + "-Primal"
                _mega_required_items[primal_name.lower()] = item.get("name", "")


def load_data_file(filepath, mode="r", encoding="utf8"):
    """Load and return data from a JSON/JSON5 file if it exists."""
    if os.path.exists(filepath):
        with open(filepath, mode, encoding=encoding) as file:
            content = file.read()
        try:
            return json.loads(content)
        except (json.JSONDecodeError, ValueError):
            return pyjson5.loads(content)
    return None


def build_data_path(filename):
    """Construct a path relative to the data directory."""
    return os.path.join(DATA_DIRECTORY, filename)


def get_local_months():
    """Return sorted list of locally available month strings."""
    return sorted(
        d for d in os.listdir(DATA_DIRECTORY)
        if os.path.isdir(os.path.join(DATA_DIRECTORY, d)) and re.match(r"\d{4}-\d{2}$", d)
    )


@lru_cache(maxsize=1)
def get_smogon_months():
    """Fetch and cache the list of available months from Smogon. Returns sorted list."""
    try:
        from bs4 import BeautifulSoup as BS
        resp = requests.get(SMOGON_STATS_URL, timeout=10)
        if resp.status_code != 200:
            return []
        soup = BS(resp.text, "html.parser")
        months = set()
        for a in soup.find_all("a", href=True):
            href = a["href"].strip("/")
            # Match base months like 2024-06 (not DLC/H suffixes)
            if re.match(r"\d{4}-\d{2}$", href):
                months.add(href)
            # Also include DLC/H variants mapped to their base month
            elif re.match(r"\d{4}-\d{2}-(DLC[12]|H[12])$", href):
                months.add(href[:7])
        return sorted(months)
    except Exception as e:
        print(f"Warning: Could not fetch Smogon month list: {e}")
        return []


def get_available_months():
    """Return sorted list of all available months (local + Smogon remote)."""
    local = set(get_local_months())
    remote = set(get_smogon_months())
    return sorted(local | remote)


def get_latest_month():
    """Return the latest available month string."""
    local = get_local_months()
    if local:
        return local[-1]
    now = datetime.now()
    month = now.month - 1
    year = now.year
    if month == 0:
        month = 12
        year -= 1
    return f"{year}-{str(month).zfill(2)}"


def is_local_month(month):
    """Check if a month has locally split data."""
    return os.path.isdir(os.path.join(DATA_DIRECTORY, month))


# Cache max 2 entries (one format at two ratings): each parsed chaos dict is
# 17-40 MB, so a bigger cache risks the 512 MB dyno quota when crawlers walk
# old months. A hand-rolled cache instead of lru_cache so hits never wait on
# the fetch locks below.
_remote_format_cache = OrderedDict()
_remote_format_cache_lock = threading.Lock()
REMOTE_FORMAT_CACHE_MAX = 2
# Striped fetch locks: at most len(stripes) downloads+parses run at once, and
# identical concurrent requests share one fetch instead of each holding a
# 30 MB decompressed body + parsed dict (8 crawler threads doing that
# simultaneously is what breached the dyno quota).
_remote_fetch_stripes = [threading.Lock() for _ in range(2)]
# Give up rather than queue indefinitely: a burst of old-month requests must
# not pin all 8 gunicorn threads behind ~5s fetches (that starves fast
# requests into H18/H27 interruptions). Long enough for ~2 queued fetches.
REMOTE_FETCH_WAIT_SECONDS = 12


def fetch_remote_format_data(month, format_code, rating):
    """Fetch a full format JSON from Smogon and return its data dict. Cached.

    Returns None (uncached, so a later retry can succeed) when the fetch
    stripes stay contended past REMOTE_FETCH_WAIT_SECONDS.
    """
    key = (month, format_code, rating)
    with _remote_format_cache_lock:
        if key in _remote_format_cache:
            _remote_format_cache.move_to_end(key)
            return _remote_format_cache[key]
    stripe = _remote_fetch_stripes[hash(key) % len(_remote_fetch_stripes)]
    if not stripe.acquire(timeout=REMOTE_FETCH_WAIT_SECONDS):
        return None
    try:
        # Re-check: another thread may have fetched this key while we waited.
        with _remote_format_cache_lock:
            if key in _remote_format_cache:
                _remote_format_cache.move_to_end(key)
                return _remote_format_cache[key]
        data = _fetch_remote_format_data(month, format_code, rating)
        # Failures cache as None too, so bad URLs don't hammer Smogon.
        with _remote_format_cache_lock:
            _remote_format_cache[key] = data
            while len(_remote_format_cache) > REMOTE_FORMAT_CACHE_MAX:
                _remote_format_cache.popitem(last=False)
    finally:
        stripe.release()
    return data


def _fetch_remote_format_data(month, format_code, rating):
    # Try variants: base, DLC1, DLC2, H1, H2
    suffixes = ["", "-DLC1", "-DLC2", "-H1", "-H2"]
    for suffix in suffixes:
        url = f"{SMOGON_STATS_URL}{month}{suffix}/chaos/{format_code}-{rating}.json.gz"
        try:
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                raw = gzip.decompress(resp.content)
                data = json.loads(raw.decode("utf-8"))
                return data
        except Exception:
            continue
    # Fallback: try uncompressed
    for suffix in suffixes:
        url = f"{SMOGON_STATS_URL}{month}{suffix}/chaos/{format_code}-{rating}.json"
        try:
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                return json.loads(resp.text)
        except Exception:
            continue
    return None


@lru_cache(maxsize=6)
def get_remote_formats_for_month(month):
    """Fetch the list of available formats and ratings for a remote month. Returns dict {format_code: [ratings]}."""
    from bs4 import BeautifulSoup as BS
    suffixes = ["", "-DLC1", "-DLC2", "-H1", "-H2"]
    for suffix in suffixes:
        url = f"{SMOGON_STATS_URL}{month}{suffix}/chaos/"
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code != 200:
                continue
            soup = BS(resp.text, "html.parser")
            formats = {}
            for a in soup.find_all("a", href=True):
                href = a["href"]
                # Smogon serves these gzipped; some months still carry plain
                # JSON too, so accept either and dedupe the ratings.
                name = href[:-3] if href.endswith(".gz") else href
                if name.endswith(".json"):
                    # Parse "gen9ou-0.json" -> format_code="gen9ou", rating="0"
                    name = name.rsplit(".", 1)[0]
                    parts = name.rsplit("-", 1)
                    if len(parts) == 2 and parts[1].isdigit():
                        fmt, rat = parts
                        formats.setdefault(fmt, set()).add(rat)
            for fmt in formats:
                formats[fmt] = sorted(formats[fmt], key=int)
            return formats
        except Exception:
            continue
    return {}


def fetch_index_data(format_code, rating, month=None):
    """Load index data for a format/rating/month. Returns dict with 'info' and 'pokemon' keys."""
    if month is None:
        month = get_latest_month()
    # Try local first
    if is_local_month(month):
        file_path = os.path.join(DATA_DIRECTORY, month, format_code, str(rating), "_index.json")
        data = load_data_file(file_path)
        if data:
            return data
    # Fall back to remote Smogon fetch
    remote_data = fetch_remote_format_data(month, format_code, str(rating))
    if remote_data and "data" in remote_data:
        # Build index from remote monolithic data
        info = remote_data.get("info", {})
        num_battles = info.get("number of battles", 0)
        pokemon_index = {}
        for name, poke in remote_data["data"].items():
            usage = poke.get("usage", 0)
            raw = poke.get("Raw count", 0)
            # Pre-2015-12 data lacks the "usage" field — compute it
            if not usage and raw and num_battles:
                usage = raw / (num_battles * 2)
            pokemon_index[name] = {"usage": usage, "raw": raw}
        return {"info": info, "pokemon": pokemon_index}
    return {}


def fix_no_ability(format_code, pokemon_name, data):
    """Remap Smogon's bogus 'noability' usage entries to the real ability.

    Smogon usage stats record 'noability' for some new Mega formes (Mega
    Staraptor, Mega Raichu, Mega Scrafty, ...) even though a Mega always has
    exactly one real ability: its dex slot-0 ability. Only Megas are
    remapped: gen 1-2 formats have no abilities at all, and in Hackmons
    formats a non-Mega can genuinely run No Ability.
    """
    abilities = data.get("Abilities")
    if not abilities or "noability" not in abilities:
        return data
    gen = extract_generation_from_format(format_code)
    if gen is None or gen < 3:
        return data
    dex_key = re.sub(r"[^a-z0-9]+", "", pokemon_name.lower())
    dex_entry = pokedexEntries.get(dex_key, {})
    if "Mega" not in dex_entry.get("forme", ""):
        return data
    real = dex_entry.get("abilities", {}).get("0")
    if not real:
        return data
    real_id = re.sub(r"[^a-z0-9]+", "", real.lower())
    fixed = dict(abilities)
    fixed[real_id] = fixed.get(real_id, 0) + fixed.pop("noability")
    data = dict(data)
    data["Abilities"] = fixed
    return data


def fetch_pokemon_data(format_code, rating, pokemon_name, month=None):
    """Load individual Pokémon data. Returns the Pokémon's data dict."""
    if month is None:
        month = get_latest_month()
    # Try local first
    if is_local_month(month):
        file_path = os.path.join(DATA_DIRECTORY, month, format_code, str(rating), f"{pokemon_name}.json")
        data = load_data_file(file_path)
        if data:
            return fix_no_ability(format_code, pokemon_name, data)
    # Fall back to remote (the full format is already cached by fetch_remote_format_data)
    remote_data = fetch_remote_format_data(month, format_code, str(rating))
    if remote_data and "data" in remote_data:
        return fix_no_ability(
            format_code, pokemon_name, remote_data["data"].get(pokemon_name, {})
        )
    return {}


@lru_cache(maxsize=16)
def load_trend_data(format_code, rating):
    """Load pre-computed trend data for a format/rating. Returns dict or None."""
    trend_path = os.path.join(DATA_DIRECTORY, "trends", format_code, f"{rating}.json")
    if os.path.exists(trend_path):
        with open(trend_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def extract_generation_from_format(format_code):
    """Extract the generation number from a format code string like 'gen9ou'."""
    special_formats = ["1v1", "2v2", "350", "12switch", "4v4"]
    try:
        gen_segment = format_code
        for sf in special_formats:
            gen_segment = gen_segment.split(sf)[0]
        return int(re.findall(r"\d+", gen_segment)[0])
    except (IndexError, ValueError):
        return None


def get_valid_rating_thresholds(format_code, month=None):
    """Return a sorted list of valid rating thresholds for a format."""
    if month is None:
        month = get_latest_month()
    # Try local first
    if is_local_month(month):
        format_dir = os.path.join(DATA_DIRECTORY, month, format_code)
        if os.path.isdir(format_dir):
            return sorted(
                [d for d in os.listdir(format_dir) if d.isdigit()],
                key=int,
            )
    # Fall back to remote
    remote_formats = get_remote_formats_for_month(month)
    return remote_formats.get(format_code, [])


def fuzzy_match(target, options):
    """Return the closest match to target within options using fuzzy matching."""
    normalized_options = {option.lower(): option for option in options}
    matches = difflib.get_close_matches(target.lower(), normalized_options.keys(), 10)
    return normalized_options[matches[0]] if matches else None


def build_calc_move_payload(move_key, move_info, usage_pct=None):
    """Normalize move data for the client-side damage calc."""
    raw_bp = move_info.get("basePower", 0)
    bp = raw_bp if isinstance(raw_bp, (int, float)) and not isinstance(raw_bp, bool) else 0
    category = move_info.get("category", "Physical")
    move_id = move_key.lower()
    variable_bp_type = ""
    if category != "Status" and move_info.get("basePowerCallback"):
        if move_id in ("lowkick", "grassknot"):
            variable_bp_type = "targetWeight"

    target = move_info.get("target", "normal")
    flags = move_info.get("flags", {})
    raw_multihit = move_info.get("multihit")
    if isinstance(raw_multihit, list) and len(raw_multihit) == 2:
        multihit = raw_multihit  # [min, max]
    elif isinstance(raw_multihit, int) and raw_multihit > 1:
        multihit = [1, raw_multihit]
    else:
        multihit = None
    calc_overrides = {
        "name": move_info.get("name", move_key.title()),
        "basePower": bp,
        "type": move_info.get("type", "Normal"),
        "category": category,
        "target": target,
        "flags": flags,
    }
    if move_info.get("priority") is not None:
        calc_overrides["priority"] = move_info.get("priority")
    if move_info.get("recoil"):
        calc_overrides["recoil"] = move_info.get("recoil")
    if move_info.get("secondary"):
        calc_overrides["secondaries"] = [move_info.get("secondary")]
    elif move_info.get("secondaries"):
        calc_overrides["secondaries"] = move_info.get("secondaries")
    if raw_multihit:
        calc_overrides["multihit"] = raw_multihit
    for override_key in ("overrideOffensiveStat", "overrideDefensiveStat", "overrideOffensivePokemon"):
        if move_info.get(override_key):
            calc_overrides[override_key] = move_info[override_key]

    payload = {
        "id": move_key,
        "name": move_info.get("name", move_key.title()),
        "type": move_info.get("type", "Normal"),
        "category": category,
        "bp": bp,
        "calcName": move_info.get("name", move_key.title()),
        "calcOverrides": calc_overrides,
        "variableBp": bool(variable_bp_type),
        "variableBpType": variable_bp_type,
        "isSpread": target in ("allAdjacentFoes", "allAdjacent"),
        "flags": flags,
        "hasSecondary": bool(move_info.get("secondary") or move_info.get("secondaries")),
        "hasRecoil": bool(move_info.get("recoil")),
    }
    if multihit:
        payload["multihit"] = multihit
        if move_id in ("tripleaxel", "triplekick"):
            payload["escalatingBp"] = True
    for override_key in ("overrideOffensiveStat", "overrideDefensiveStat", "overrideOffensivePokemon"):
        if move_info.get(override_key):
            payload[override_key] = move_info[override_key]
    if usage_pct is not None:
        payload["usagePct"] = usage_pct
    return payload


# ─── SHOWDOWN PASTE IMPORT ───────────────────────────────────────────────────
# Turns Showdown export text (or a pokepast.es link) into sets the damage calc
# can drop straight into a panel. Parsing lives server-side so it can reuse the
# pokedex/move/item/ability tables and hand back ready-made move payloads.

_POKEPASTE_INPUT_RE = re.compile(
    r"^(?:https?://)?(?:www\.)?pokepast\.es/([0-9a-f]+)(?:/raw)?/?$", re.I
)

# Attribute lines belong to the set above them; anything else (moves excluded)
# starts a new set. Blank-line splitting is unreliable -- some pastes
# double-space every line.
_PASTE_ATTR_RE = re.compile(
    r"^(ability|level|shiny|happiness|pokeball|poke ball|hidden power|tera type"
    r"|evs?|ivs?|dynamax level|gigantamax|gender|nature|item)\s*:",
    re.I,
)
_PASTE_NATURE_RE = re.compile(r"^([A-Za-z]+)\s+Nature$", re.I)
_PASTE_TRAILING_GENDER_RE = re.compile(r"\((m|f)\)\s*$", re.I)
_PASTE_SPECIES_PAREN_RE = re.compile(r"\(([^)]+)\)\s*$")
_PASTE_STAT_CHUNK_RE = re.compile(r"(\d+)\s*([A-Za-z]+)")

_PASTE_STAT_ALIASES = {
    "hp": 0,
    "atk": 1, "at": 1, "attack": 1,
    "def": 2, "df": 2, "defense": 2, "defence": 2,
    "spa": 3, "sa": 3, "satk": 3, "spatk": 3, "spattack": 3, "specialattack": 3,
    "spd": 4, "sd": 4, "sdef": 4, "spdef": 4, "specialdefense": 4, "specialdefence": 4,
    "spe": 5, "sp": 5, "speed": 5,
}
_PASTE_TERA_TYPES = {
    _normalized: _normalized.title()
    for _normalized in [
        "normal", "fire", "water", "electric", "grass", "ice", "fighting",
        "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
        "dragon", "dark", "steel", "fairy", "stellar",
    ]
}

PASTE_MAX_CHARS = 60000
PASTE_MAX_SETS = 24
PASTE_MAX_MOVES = 6


def _paste_key(value):
    """Normalize a paste token to the id form used by the data files."""
    return re.sub(r"[^a-z0-9]+", "", (value or "").lower())


def _paste_canonical_name(raw, source):
    """Return the display name for an item/ability, or the raw text if unknown."""
    entry = source.get(_paste_key(raw)) if raw else None
    if isinstance(entry, dict) and entry.get("name"):
        return entry["name"]
    return (raw or "").strip()


def _paste_resolve_species(raw):
    """Return (display_name, matched) for a species name out of a paste.

    Only near-exact matches count: a paste's title or a stray note lands here
    the same way a species line does, and the usual 0.6 fuzzy cutoff happily
    turns "Rain Team" into Sinistea.
    """
    key = _paste_key(raw)
    if not key:
        return raw, False
    entry = pokedexEntries.get(key)
    if entry:
        return entry.get("name", raw), True
    close = difflib.get_close_matches(key, pokedexEntries.keys(), 1, 0.8)
    if close:
        return pokedexEntries[close[0]].get("name", close[0]), True
    return raw, False


def _paste_stat_line(value, default):
    """Parse an "EVs: 252 Atk / 4 Def" style line into a 6-slot stat list."""
    stats = [default] * 6
    for chunk in value.split("/"):
        match = _PASTE_STAT_CHUNK_RE.search(chunk)
        if not match:
            continue
        index = _PASTE_STAT_ALIASES.get(_paste_key(match.group(2)))
        if index is not None:
            stats[index] = int(match.group(1))
    return stats


def _paste_split_blocks(text):
    """Group paste lines into one list of lines per Pokémon."""
    blocks = []
    for raw_line in (text or "").replace("\r", "\n").split("\n"):
        line = raw_line.strip()
        # "=== [gen9vgc2026regi] Team name ===" headers in multi-team exports.
        if not line or line.startswith("==="):
            continue
        is_attribute = (
            line[0] in "-~"
            or bool(_PASTE_ATTR_RE.match(line))
            or bool(_PASTE_NATURE_RE.match(line))
        )
        if is_attribute:
            if blocks:
                blocks[-1].append(line)
            continue
        blocks.append([line])
    return blocks


def _paste_parse_head(head):
    """Split a set's first line into (species_raw, nickname, item_raw)."""
    item_raw = ""
    name_part = head
    at_index = head.find(" @ ")
    if at_index >= 0:
        item_raw = head[at_index + 3:].strip()
        name_part = head[:at_index]
    name_part = _PASTE_TRAILING_GENDER_RE.sub("", name_part.strip()).strip()
    paren = _PASTE_SPECIES_PAREN_RE.search(name_part)
    if paren:
        return paren.group(1).strip(), name_part[:paren.start()].strip(), item_raw
    return name_part.strip(), "", item_raw


def parse_showdown_paste(text, format_code=""):
    """Parse Showdown export text into calc-ready sets.

    Returns (sets, warnings). Sets whose species can't be resolved are dropped
    with a warning -- the calc has nothing to load them into.
    """
    champions = is_champions_format(format_code)
    move_source = (championsMoveDetails if champions else moveDetails) or moveDetails or {}
    ability_source = (championsAbilityDetails if champions else abilityDetails) or {}

    sets = []
    warnings = []
    blocks = _paste_split_blocks(text)
    if len(blocks) > PASTE_MAX_SETS:
        warnings.append(f"Only the first {PASTE_MAX_SETS} Pokémon were imported.")
        blocks = blocks[:PASTE_MAX_SETS]

    for block in blocks:
        species_raw, nickname, item_raw = _paste_parse_head(block[0])
        if not species_raw:
            continue
        species, matched = _paste_resolve_species(species_raw)
        if not matched:
            warnings.append(f"Skipped unknown Pokémon: {species_raw}")
            continue

        ability = ""
        tera = ""
        nature = ""
        level = 0
        evs = [0] * 6
        ivs = [31] * 6
        moves = []
        unknown_moves = []

        for line in block[1:]:
            if line[0] in "-~":
                move_raw = line[1:].strip()
                if not move_raw or len(moves) >= PASTE_MAX_MOVES:
                    continue
                move_key = _paste_key(move_raw)
                move_info = move_source.get(move_key)
                if move_info:
                    moves.append(build_calc_move_payload(move_key, move_info))
                else:
                    unknown_moves.append(move_raw)
                continue
            nature_match = _PASTE_NATURE_RE.match(line)
            if nature_match:
                nature = nature_match.group(1).capitalize()
                continue
            field, _, value = line.partition(":")
            field = _paste_key(field)
            value = value.strip()
            if field == "ability":
                ability = _paste_canonical_name(value, ability_source)
            elif field == "teratype":
                tera = _PASTE_TERA_TYPES.get(_paste_key(value), "")
            elif field in ("ev", "evs"):
                evs = _paste_stat_line(value, 0)
            elif field in ("iv", "ivs"):
                ivs = _paste_stat_line(value, 31)
            elif field == "nature":
                nature = value.capitalize()
            elif field == "level" and value.isdigit():
                level = int(value)
            elif field == "item" and not item_raw:
                item_raw = value

        sets.append({
            "species": species,
            "nickname": nickname,
            "sprite": list(get_pokemon_sprite(species)),
            "item": _paste_canonical_name(item_raw, itemDetails),
            "ability": ability,
            "tera": tera,
            "nature": nature,
            "level": level,
            "evs": evs,
            "ivs": ivs,
            # Open teamsheets (Limitless) carry no spread -- flag it so the calc
            # keeps its usage-based spread instead of zeroing the panel out.
            "hasSpread": bool(nature) or any(evs),
            "hasIvs": any(iv != 31 for iv in ivs),
            "moves": moves,
            "unknownMoves": unknown_moves,
        })

    return sets, warnings


def load_all_data():
    """Load all necessary data files into global variables."""
    global formatDisplayNames, availableFormats, spriteIndex, itemDetails, abilityDetails, moveDetails, championsMoveDetails, championsAbilityDetails, pokedexEntries
    formatDisplayNames = load_data_file(build_data_path("meta_names.json")) or {}
    # Build availableFormats from directory structure
    latest_month = get_latest_month()
    month_dir = os.path.join(DATA_DIRECTORY, latest_month)
    if os.path.isdir(month_dir):
        format_dirs = [
            d for d in os.listdir(month_dir)
            if os.path.isdir(os.path.join(month_dir, d))
        ]
    else:
        format_dirs = []
    # Build list with generation and pokemon count for sorting
    format_info = []
    for fmt in format_dirs:
        if fmt in formatDisplayNames:
            gen = extract_generation_from_format(fmt)
            idx_path = os.path.join(month_dir, fmt, "0", "_index.json")
            idx_data = load_data_file(idx_path)
            count = len(idx_data.get("pokemon", {})) if idx_data else 0
            format_info.append((fmt, formatDisplayNames[fmt], gen or 0, count))
    format_info.sort(key=lambda x: (-x[2], -x[3]))
    availableFormats = [[fi[0], fi[1]] for fi in format_info]
    # Put Champions formats at the top of the list
    champions = [f for f in availableFormats if "Champions]" in f[1]]
    others = [f for f in availableFormats if "Champions]" not in f[1]]
    availableFormats = champions + others
    # Register the live Pokémon Champions in-game formats and float them first.
    for code, disp in CHAMPIONS_GAME_DISPLAY.items():
        formatDisplayNames[code] = disp
    availableFormats = champions_game_format_list() + availableFormats
    spriteIndex = load_data_file(build_data_path("forms_index.json")) or {}
    itemDetails = load_data_file(build_data_path("items.json")) or {}
    abilityDetails = load_data_file(build_data_path("abilities.json")) or {}
    moveDetails = load_data_file(build_data_path("moves.json")) or {}
    championsMoveDetails = load_data_file(build_data_path("champions_moves.json")) or moveDetails
    championsAbilityDetails = load_data_file(build_data_path("champions_abilities.json")) or abilityDetails
    pokedexEntries = load_data_file(build_data_path("pokedex.json")) or {}


def get_formats_for_month(month):
    """Get sorted format list for a given month. Returns list of [code, display_name] pairs."""
    if is_local_month(month):
        return availableFormats
    # Remote month: build format list from Smogon directory listing
    remote_formats = get_remote_formats_for_month(month)
    format_list = []
    for fmt in remote_formats:
        display = formatDisplayNames.get(fmt, fmt)
        gen = extract_generation_from_format(fmt) or 0
        format_list.append([fmt, display, gen])
    format_list.sort(key=lambda x: (-x[2], x[1]))
    champions = [[f[0], f[1]] for f in format_list if "Champions]" in f[1]]
    others = [[f[0], f[1]] for f in format_list if "Champions]" not in f[1]]
    return champions_game_format_list() + champions + others


def is_champions_format(format_code):
    """Check if a format code is a Champions format."""
    return "champions" in format_code.lower()


# ─── Pokémon Champions (in-game) Battle Data ─────────────────────────────
# Usage comes from our own capture. The emulator scraper in the
# Pokemon-Champions-Scraper repo walks the game's Battle Data screens and
# publishes to this repo's champions-data branch, in the shape the third-party
# API used to return -- so nothing downstream of get_champions_detail changed
# when the source was swapped.
#
# That API is no longer consulted at all. It is still up, but we no longer
# depend on it: our capture carries all ~30 stat spreads where it published 8,
# tells apart the forms the game shows under one bare name, and does not rely
# on anyone else staying online. When the branch is briefly unreachable the
# app serves its own stale cache rather than falling back elsewhere.
#
# The static half of the index -- types, base stats, movepools -- is not
# fetched either. It is rebuilt from public Showdown data by
# updateChampionsIndex() and bundled at stats/champions_index_static.json;
# get_champions_index merges the two.
#
# CHAMPIONS_DATA_URL can point at a local directory server for development.
CHAMPIONS_DATA_URL = os.environ.get(
    "CHAMPIONS_DATA_URL",
    "https://raw.githubusercontent.com/PizzaTimeJoshua/munchstats/"
    "champions-data/champions/",
)
CHAMPIONS_STATIC_INDEX = "champions_index_static.json"
CHAMPIONS_CACHE_DIR = os.path.join("cache", "champions")
os.makedirs(CHAMPIONS_CACHE_DIR, exist_ok=True)
# How long before re-asking the branch. Kept short because the check is
# conditional: a stored ETag turns an unchanged re-check into a 304 carrying
# no body. A 6-hour TTL meant a nightly publish could take six hours to reach
# the site, which is a long time to show yesterday's numbers when the new
# ones are already sitting on the branch.
CHAMPIONS_CACHE_TTL = 30 * 60
CHAMPIONS_SEASON = "Current"
CHAMPIONS_ATTRIBUTION = "Battle data captured in-game by MunchStats"
CHAMPIONS_ATTRIBUTION_URL = ""

# App format code -> API battle-data folder name
CHAMPIONS_GAME_FORMATS = {
    "championsdoubles": "Doubles",
    "championssingles": "Singles",
}
CHAMPIONS_GAME_DISPLAY = {
    "championsdoubles": "[Champions] In-Game Doubles",
    "championssingles": "[Champions] In-Game Singles",
}


def is_champions_game_format(format_code):
    """Check if a format code is a live Pokémon Champions in-game data format."""
    return format_code in CHAMPIONS_GAME_FORMATS


def champions_game_format_list():
    """Return [[code, display], ...] for the champions in-game formats."""
    return [[code, CHAMPIONS_GAME_DISPLAY[code]] for code in CHAMPIONS_GAME_FORMATS]


def _champions_cache_path(key):
    safe = re.sub(r"[^A-Za-z0-9_.-]", "_", key)
    return os.path.join(CHAMPIONS_CACHE_DIR, safe + ".json")


def _champions_cache_read(key, allow_stale=False):
    """Return cached JSON if present and fresh (or any age when allow_stale)."""
    path = _champions_cache_path(key)
    if not os.path.exists(path):
        return None
    if not allow_stale and (time.time() - os.path.getmtime(path)) > CHAMPIONS_CACHE_TTL:
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _champions_cache_write(key, data):
    try:
        with open(_champions_cache_path(key), "w", encoding="utf-8") as f:
            json.dump(data, f)
    except Exception:
        pass


def champions_data_get(path, cache_key, cache_missing=True):
    """GET a published capture file from the champions-data branch.

    Fresh copy if one is cached, else fetch, else whatever stale copy we still
    hold -- so a branch that is briefly unreachable serves yesterday's data
    rather than nothing.

    For a per-Pokémon file a 404 is a real answer -- that Pokémon has no
    published data -- so it is cached rather than re-asked on every request.
    For the index it is not: a missing index means the branch has not been
    pushed yet, or a push is mid-flight, and caching that would pin the app to
    the fallback for the whole six-hour TTL even after the data arrived. Pass
    cache_missing=False for anything where absence means "not yet" rather
    than "none".
    """
    cached = _champions_cache_read(cache_key)
    if cached is not None:
        return cached

    # Sidecar: its contents are the last ETag, its mtime the last check.
    marker = _champions_cache_path(cache_key) + ".etag"
    etag = ""
    if os.path.exists(marker):
        try:
            with open(marker, "r", encoding="utf-8") as f:
                etag = f.read().strip()
        except Exception:
            etag = ""

    data = None
    try:
        resp = requests.get(
            CHAMPIONS_DATA_URL + path,
            timeout=20,
            headers={
                "User-Agent": "MunchStats (+https://munchstats.com)",
                **({"If-None-Match": etag} if etag else {}),
            },
        )
        if resp.status_code == 304:
            # Unchanged. Refresh the cached copy's mtime so it counts as fresh
            # again, and serve it without having downloaded a byte of body.
            stale = _champions_cache_read(cache_key, allow_stale=True)
            if stale is not None:
                _champions_cache_write(cache_key, stale)
                return stale
        elif resp.status_code == 200:
            data = resp.json()
            new_etag = resp.headers.get("ETag", "")
            if new_etag:
                try:
                    with open(marker, "w", encoding="utf-8") as f:
                        f.write(new_etag)
                except Exception:
                    pass
        elif resp.status_code == 404 and cache_missing:
            data = {}
    except Exception:
        pass
    if data is not None:
        _champions_cache_write(cache_key, data)
        return data
    return _champions_cache_read(cache_key, allow_stale=True)


_champions_static_mem = None


def load_champions_static():
    """The bundled static index, as {showdownId: entry}. Empty if absent."""
    global _champions_static_mem
    if _champions_static_mem is None:
        try:
            with open(build_data_path(CHAMPIONS_STATIC_INDEX), "r",
                      encoding="utf-8") as f:
                _champions_static_mem = json.load(f).get("pokemon") or {}
        except Exception:
            _champions_static_mem = {}
    return _champions_static_mem


# The index is ~7MB; memoize the parsed copy in-process, keyed on cache mtime.
_champions_index_mem = {"mtime": None, "index": None}


def get_champions_index():
    """Return the parsed Champions index dict (memoized on the cache file mtime)."""
    path = _champions_cache_path("index")
    if (
        _champions_index_mem["index"] is not None
        and os.path.exists(path)
        and (time.time() - os.path.getmtime(path)) <= CHAMPIONS_CACHE_TTL
        and _champions_index_mem["mtime"] == os.path.getmtime(path)
    ):
        return _champions_index_mem["index"]
    data = champions_data_get("index.json", "index", cache_missing=False)
    # The published index carries usage only -- ranks per format. Types, base
    # stats and movepools come from the bundled static file, keyed on
    # showdownId, so a Pokémon missing from one still renders from the other
    # rather than disappearing.
    static = load_champions_static()
    if data and static:
        for entry in data.get("pokemon") or []:
            s = static.get(entry.get("showdownId") or "")
            if not s:
                continue
            entry.setdefault("learnableMoveNames", s.get("learnableMoveNames") or [])
            summary = entry.setdefault("summary", {})
            for field in ("types", "baseStats", "baseStatTotal"):
                if s.get(field) is not None:
                    summary.setdefault(field, s[field])
    if not data:
        return None
    mtime = os.path.getmtime(path) if os.path.exists(path) else time.time()
    _champions_index_mem.update({"mtime": mtime, "index": data})
    return data


def get_champions_pokemon_by_name():
    """Return {battleName: index entry} for all champions Pokémon, or {}."""
    idx = get_champions_index()
    if not idx:
        return {}
    return {p["name"]: p for p in idx.get("pokemon", [])}


def get_champions_detail(slug, format_folder):
    """Return {"rows": [...], "trend": [[date, rank], ...]} for one Pokémon/format.

    Published per Pokémon and format, already trimmed to these two pieces, so
    there is nothing to reshape here. The trend is one point per capture date,
    accumulated by the scraper across sweeps.
    """
    key = f"detail_{format_folder}_{slug}"
    return champions_data_get(f"battle/{format_folder}/{slug}.json", key) or {}


# Champions uses long in-game form names ("Aegislash Shield Forme",
# "Basculegion Male", "Alolan Ninetales"); map them to Showdown-style names so
# they match the pokedex/sprite data and read consistently with the rest of the site.
_CHAMPIONS_REGIONS = {"Alolan": "alola", "Galarian": "galar", "Hisuian": "hisui", "Paldean": "paldea"}
_CHAMPIONS_FILLER = {"Forme", "Form", "Variety", "Pattern", "Natural", "Flower", "Breed"}
_CHAMPIONS_VARIANT_ALIASES = {"Jumbo": "super"}  # Gourgeist Jumbo -> Gourgeist-Super
# The API's name doesn't always match the in-game form.
#  - The game only has Floette-Eternal, which the API just calls "Floette".
#  - The Fan Rotom form breaks the API's own "Rotom X" naming: the entry that
#    carries real battle data is called "Fan Rotom" (unlike "Rotom Heat" etc.)
#    and so doesn't resolve to the Rotom-Fan pokedex id on its own. (The API
#    also ships a separate, empty "Rotom Fan" placeholder — filtered out in
#    compile_champions_page_data.)
_CHAMPIONS_NAME_OVERRIDES = {"Floette": "Floette-Eternal", "Fan Rotom": "Rotom-Fan"}
_champions_name_cache = {}


def champions_display_name(raw_name):
    """Map a Champions in-game name to its Showdown pokedex display name.

    Falls back to the raw name if nothing matches. Result is cached.
    """
    if raw_name in _champions_name_cache:
        return _champions_name_cache[raw_name]

    def norm(s):
        return re.sub(r"[^a-z0-9]+", "", s.lower())

    if raw_name in _CHAMPIONS_NAME_OVERRIDES:
        result = _CHAMPIONS_NAME_OVERRIDES[raw_name]
    elif norm(raw_name) in pokedexEntries:
        result = pokedexEntries[norm(raw_name)].get("name", raw_name)
    else:
        result = raw_name
        tokens = raw_name.split()
        region = ""
        if tokens and tokens[0] in _CHAMPIONS_REGIONS:
            region = _CHAMPIONS_REGIONS[tokens[0]]
            tokens = tokens[1:]
        gender = ""
        if tokens and tokens[-1] in ("Male", "Female"):
            gender = "" if tokens[-1] == "Male" else "f"
            tokens = tokens[:-1]
        core = [t for t in tokens if t not in _CHAMPIONS_FILLER]
        base = core[0] if core else raw_name
        extras = "".join(_CHAMPIONS_VARIANT_ALIASES.get(e, e) for e in core[1:])
        # Candidate Showdown ids, most specific first; use the first real one.
        candidates = []
        if region and extras:
            candidates += [norm(base + region + extras), norm(base + extras + region)]
        if region:
            candidates.append(norm(base + region))
        if extras:
            candidates += [norm(base + extras + gender), norm(base + extras)]
        if gender:
            candidates.append(norm(base + gender))
        candidates.append(norm(base))
        for cand in candidates:
            if cand in pokedexEntries:
                result = pokedexEntries[cand].get("name", raw_name)
                break

    _champions_name_cache[raw_name] = result
    return result


def _champions_pct(row):
    """Return the row's usage percentage as a bare string (no %), or '' if none."""
    return str(row.get("percentage", "")).rstrip("%")


# The Champions battle rows are scraped from screenshots via OCR and Limitless
# decklists are typed by hand, so ability/move names arrive with misread
# letters ("Leat Guard"), dropped words ("Boost" for Speed Boost), or typos
# ("Adapability"). Snap them to the Pokémon's legal options. A name that is
# already a real move/ability but outside the legal set is never rewritten:
# scans and typos produce non-words, so a real name is a row the scraper
# attributed to the wrong Pokémon (Runerigus showing Rotom's "Static"/"Volt
# Switch"), not a misread — rewriting it (Volt Switch -> Ally Switch) would
# invent data. The in-game Champions page drops such rows instead.
def correct_scanned_name(name, legal_by_key, known_by_key, legal_cutoff):
    """Match a scanned name against legal_by_key / known_by_key maps of
    {normalized key: display name}; return it unchanged if nothing is close."""
    key = re.sub(r"[^a-z0-9]+", "", name.lower())
    if not key:
        return name
    if key in legal_by_key:
        return legal_by_key[key]
    if key in known_by_key:
        return known_by_key[key]
    # A scan that dropped a word survives as a fragment of exactly one option
    # ("Boost" -> Speed Boost); a stray word typed in wraps one instead
    # ("Blaze  Ability" -> Blaze). Only unambiguous, non-tiny overlaps count,
    # and only for names that aren't real (checked above), so a legitimate
    # "Flying Press" is never swallowed by a legal "Fly".
    containing = [
        k for k in legal_by_key if len(k) >= 4 and (key in k or k in key)
    ]
    if len(containing) == 1:
        return legal_by_key[containing[0]]
    close = difflib.get_close_matches(key, legal_by_key.keys(), 1, legal_cutoff)
    if close:
        return legal_by_key[close[0]]
    # Last resort: a strict match against every known name, for when the
    # legal set is unavailable or itself missing the option.
    close = difflib.get_close_matches(key, known_by_key.keys(), 1, 0.85)
    return known_by_key[close[0]] if close else name


_known_name_maps = {}


def _known_names(details):
    """{normalized key: display name} for a moves/abilities details dict,
    memoized per dict (they are loaded once and shared)."""
    known = _known_name_maps.get(id(details))
    if known is None:
        known = {
            key: info.get("name") or key
            for key, info in details.items()
            if isinstance(info, dict)
        }
        _known_name_maps[id(details)] = known
    return known


def _champions_legal_abilities(entry):
    """Collect the ability names legal for an index entry (all forms), as
    {normalized: display}."""
    summary = entry.get("summary") or {}
    forms = [summary.get("primary") or {}] + list(summary.get("forms") or [])
    legal = {}
    for form in forms:
        for field in ("abilities", "hidden_ability"):
            for name in (form.get(field) or "").split("|"):
                name = name.strip()
                if name:
                    legal[re.sub(r"[^a-z0-9]+", "", name.lower())] = name
    return legal


_champions_learnable_memo = {}


def _champions_learnable_moves(pokemon_name):
    """Legal move names for a Showdown-named Pokémon, {normalized: display},
    from the Champions index learnsets (the tournament metas are all
    Champions formats). Returns {} when the index is unavailable."""
    idx = get_champions_index()
    if not idx:
        return {}
    by_id = _champions_learnable_memo.get(id(idx))
    if by_id is None:
        by_id = {}
        for e in idx.get("pokemon") or []:
            sid = e.get("showdownId") or ""
            moves = e.get("learnableMoveNames") or []
            if sid and moves:
                by_id[sid] = {
                    re.sub(r"[^a-z0-9]+", "", m.lower()): m for m in moves
                }
        # The index refreshes every few hours; keep only the current one.
        _champions_learnable_memo.clear()
        _champions_learnable_memo[id(idx)] = by_id
    key = re.sub(r"[^a-z0-9]+", "", pokemon_name.lower())
    learnable = by_id.get(key)
    if learnable is None:
        # Megas battle under their base species' index entry.
        base = (pokedexEntries.get(key) or {}).get("baseSpecies", "")
        learnable = by_id.get(re.sub(r"[^a-z0-9]+", "", base.lower()))
    return learnable or {}


def format_champions_updated(iso_ts):
    """Format the index's `generatedAt` (when the source scraped the data) for display."""
    if not iso_ts:
        return ""
    try:
        dt = datetime.fromisoformat(str(iso_ts).replace("Z", "+00:00"))
        return dt.strftime("%B %d, %Y at %H:%M UTC")
    except (ValueError, TypeError):
        return str(iso_ts)


def compile_champions_page_data(format_code, pokemon_name=""):
    """Compile the Pokémon-page data dict for a Champions in-game format.

    Returns the same shape as compile_page_data so index.html renders unchanged;
    unused sections (rating, months, tera, counters, EVs, trends) are emptied.
    """
    folder = CHAMPIONS_GAME_FORMATS.get(format_code)
    if not folder:
        return None
    pokemon_by_name = get_champions_pokemon_by_name()
    if not pokemon_by_name:
        return None

    def _format_summary(index_entry):
        return (
            index_entry.get("summary", {})
            .get("battleSummary", {})
            .get(CHAMPIONS_SEASON, {})
            .get(folder)
        ) or {}

    def _usage_position(index_entry):
        # Position is a dense 1..N usage rank. The API used to carry it only on
        # the battle rows, which the index no longer embeds; read it off the
        # format summary and fall back to the rows for older cached copies.
        fmt = _format_summary(index_entry)
        pos = fmt.get("position")
        if pos is None:
            rows = fmt.get("rows")
            pos = rows[0].get("position") if rows else None
        # Sort unranked Pokémon (a format they don't appear in) last.
        return pos if pos is not None else 10 ** 9

    # Order by in-game usage placement for the selected format. Skip entries
    # with no battle summary for this format — currently just the source's empty
    # "Rotom Fan" placeholder (the real Fan-form data ships under "Fan Rotom").
    listed = [e for e in pokemon_by_name.values() if _format_summary(e)]
    ordered = sorted(listed, key=_usage_position)
    display_names = []
    display_to_raw = {}
    display_ranks = {}
    for e in ordered:
        disp = champions_display_name(e["name"])
        display_names.append(disp)
        display_to_raw[disp] = e["name"]
        pos = _usage_position(e)
        display_ranks[disp] = "#" + str(pos) if pos < 10 ** 9 else ""

    default_pokemon = display_names[0]
    if pokemon_name and pokemon_name != "No Pokemon":
        matched = fuzzy_match(pokemon_name, display_names)
        if matched:
            default_pokemon = matched

    entry = pokemon_by_name[display_to_raw[default_pokemon]]
    # The index once embedded every Pokémon's battle rows; it now ships only the
    # top row per category, so the page needs one per-Pokémon request. Use the
    # /api/pokemon endpoint for it — the same response also carries the daily
    # rank snapshots, making the usage-rank trend free.
    rows = _format_summary(entry).get("rows")
    rank_trend = []
    if not rows:
        detail = get_champions_detail(entry.get("slug", ""), folder)
        rows = detail.get("rows") or []
        rank_trend = detail.get("trend") or []

    rows_by_cat = {}
    for row in rows:
        rows_by_cat.setdefault(row.get("category", ""), []).append(row)

    summary = entry.get("summary", {})
    primary = summary.get("primary", {})

    # Base stats come from the Showdown pokedex (mainline values), matched via
    # the resolved display name. Fall back to the API metadata only if the
    # Pokémon isn't in the pokedex.
    base_stats = compile_top_data({"_": 1}, default_pokemon, "Stats")
    if not base_stats:
        base = summary.get("baseStats") or {}
        base_stats = [
            base.get("hp", primary.get("hp", 0)),
            base.get("attack", primary.get("attack", 0)),
            base.get("defense", primary.get("defense", 0)),
            base.get("sp_attack", primary.get("sp_attack", 0)),
            base.get("sp_defense", primary.get("sp_defense", 0)),
            base.get("speed", primary.get("speed", 0)),
        ]
    pokemon_types = summary.get("types") or primary.get("types") or []

    # OCR-corrected names can collide (e.g. "Boost" and "Speed Boost" rows both
    # resolving to Speed Boost); rows are usage-ordered, so keep the first.
    legal_moves = {
        re.sub(r"[^a-z0-9]+", "", m.lower()): m
        for m in entry.get("learnableMoveNames") or []
    }
    moves_list = []
    seen_moves = set()
    for r in rows_by_cat.get("move", []):
        name = correct_scanned_name(
            r.get("name", ""), legal_moves, _known_names(championsMoveDetails), 0.7
        )
        # Still not a legal move -> the scraper attributed another Pokémon's
        # row to this one; drop it rather than show an impossible move.
        if legal_moves and re.sub(r"[^a-z0-9]+", "", name.lower()) not in legal_moves:
            continue
        if name in seen_moves:
            continue
        seen_moves.add(name)
        moves_list.append([name, _champions_pct(r), build_move_tooltip(name)])

    items_list = []
    for r in rows_by_cat.get("held_item", []):
        name = r.get("name", "")
        info = itemDetails.get(re.sub(r"[^a-z0-9]+", "", name.lower()), {})
        items_list.append([
            info.get("name", name),
            _champions_pct(r),
            info.get("desc", "No info."),
            divmod(info.get("spritenum", 0), 16),
        ])

    legal_abilities = _champions_legal_abilities(entry)
    abilities_list = []
    seen_abilities = set()
    for r in rows_by_cat.get("ability", []):
        name = correct_scanned_name(
            r.get("name", ""), legal_abilities, _known_names(championsAbilityDetails), 0.6
        )
        # Still not a legal ability -> a misattributed row (Runerigus can't
        # have Static); drop it.
        if legal_abilities and re.sub(r"[^a-z0-9]+", "", name.lower()) not in legal_abilities:
            continue
        if name in seen_abilities:
            continue
        seen_abilities.add(name)
        key = re.sub(r"[^a-z0-9]+", "", name.lower())
        info = championsAbilityDetails.get(key) or abilityDetails.get(key) or {}
        abilities_list.append([info.get("name", name), _champions_pct(r), info.get("desc", "No info.")])

    # Teammates have no usage % in the source data — show rank instead.
    teammates_list = []
    for r in rows_by_cat.get("teammate", []):
        mate = champions_display_name(r.get("name", ""))
        teammates_list.append([mate, "#" + str(r.get("rank", "")), get_pokemon_sprite(mate)])

    natures_list = []
    for r in rows_by_cat.get("stat_alignment", []):
        up, down = r.get("stat_up", ""), r.get("stat_down", "")
        desc = f"+{up} / -{down}" if (up or down) else "Neutral"
        natures_list.append([r.get("name", ""), _champions_pct(r), desc])

    spreads_list = []
    for r in rows_by_cat.get("stat_points", []):
        pts = [
            r.get("hp_points", 0), r.get("attack_points", 0), r.get("defense_points", 0),
            r.get("sp_atk_points", 0), r.get("sp_def_points", 0), r.get("speed_points", 0),
        ]
        label = "/".join(str(p if p != "" else 0) for p in pts)
        spreads_list.append([label, _champions_pct(r)])

    available_months = get_available_months()
    selected_month = available_months[-1] if available_months else get_latest_month()

    trend_dates = [p[0] for p in rank_trend]
    trend_ranks = [p[1] for p in rank_trend]

    index_meta = get_champions_index() or {}

    return {
        "pokemon_names": [
            [disp, display_ranks.get(disp, ""), get_pokemon_sprite(disp), ""]
            for disp in display_names
        ],
        "selected_format": [format_code, formatDisplayNames.get(format_code, format_code)],
        "selected_pokemon": default_pokemon,
        "selected_rating": "0",
        "selected_month": selected_month,
        "available_months": available_months,
        "base_stats": base_stats,
        "pokemon_types": pokemon_types,
        "moves_list": moves_list,
        "teammates_list": teammates_list,
        "items_list": items_list,
        "abilities_list": abilities_list,
        "spreads_list": spreads_list,
        "natures_list": natures_list,
        "evs_list": [[], [], [], [], []],
        "counters_list": [],
        "current_pokemon": [
            default_pokemon, "", display_ranks.get(default_pokemon, "").lstrip("#"),
            get_pokemon_sprite(default_pokemon),
        ],
        "rating_options": [],
        "tera_types_list": [],
        "graph_data": "[[],[],[],[],[],[]]",
        "is_champions": True,
        "is_champions_game": True,
        "champions_slug": folder.lower(),
        "champions_updated": format_champions_updated(index_meta.get("generatedAt")),
        "month_formats": get_formats_for_month(selected_month),
        "trend_months": trend_dates,
        "trend_usage": trend_ranks,
        "trend_kind": "rank",
        "show_trend": len(trend_ranks) >= 2,
        "has_tournament_data": has_top_teams_data(format_code),
        "has_replay_data": False,
        "is_transformed": False,
        "champions_attribution": CHAMPIONS_ATTRIBUTION,
        "champions_attribution_url": CHAMPIONS_ATTRIBUTION_URL,
    }


def calculate_stat_value(base, iv, ev, level, nature_multiplier):
    """Calculate a stat value given parameters."""
    return math.floor(
        ((2 * base + iv + math.floor(ev / 4)) * level / 100 + 5)
        * nature_multiplier
    )


def calculate_hp_value(base, iv, ev, level):
    """Calculate HP value."""
    return (
        math.floor((2 * base + iv + math.floor(ev / 4)) * level / 100)
        + level
        + 10
    )


def calculate_champions_stat_value(base, stat_points, alignment):
    """Calculate a stat value for Champions format."""
    return math.floor((base + stat_points + 20) * alignment)


def calculate_champions_hp_value(base, stat_points):
    """Calculate HP value for Champions format."""
    return base + stat_points + 75


def compile_top_data(pokemon_data, pokemon_name, category, format_code="", base_stats=[]):
    """Compile and return the requested category data for a given Pokémon."""
    if not pokemon_data:
        return []

    # Branch for 'Stats' and 'Types'
    if category in ["Stats", "Types"]:
        matched_name = fuzzy_match(pokemon_name, pokedexEntries.keys())
        if not matched_name:
            return []
        if category == "Stats":
            stats = pokedexEntries[matched_name]["baseStats"]
            return [stats[k] for k in ["hp", "atk", "def", "spa", "spd", "spe"]]
        return pokedexEntries[matched_name]["types"]

    # Branch for 'Natures'
    if category == "Natures":
        nature_info = {
            "Adamant": "+Atk / -SpA", "Brave": "+Atk / -Spe",
            "Lonely": "+Atk / -Def", "Naughty": "+Atk / -SpD",
            "Bold": "+Def / -Atk", "Relaxed": "+Def / -Spe",
            "Impish": "+Def / -SpA", "Lax": "+Def / -SpD",
            "Modest": "+SpA / -Atk", "Quiet": "+SpA / -Spe",
            "Mild": "+SpA / -Def", "Rash": "+SpA / -SpD",
            "Calm": "+SpD / -Atk", "Sassy": "+SpD / -Spe",
            "Gentle": "+SpD / -Def", "Careful": "+SpD / -SpA",
            "Timid": "+Spe / -Atk", "Hasty": "+Spe / -Def",
            "Jolly": "+Spe / -SpA", "Naive": "+Spe / -SpD",
            "Hardy": "Neutral", "Docile": "Neutral",
            "Serious": "Neutral", "Bashful": "Neutral", "Quirky": "Neutral",
        }
        nature_weights = {}
        # Early usage stats expose a direct "Natures" field (lowercase keys)
        # before full "Spreads" data is available; prefer it when present.
        direct_natures = pokemon_data.get("Natures", {})
        if direct_natures:
            for nature, weight in direct_natures.items():
                normalized = nature.capitalize()
                nature_weights[normalized] = (
                    nature_weights.get(normalized, 0) + weight
                )
        else:
            for spread_key, weight in pokemon_data.get("Spreads", {}).items():
                nature = spread_key.split(":")[0]
                nature_weights[nature] = nature_weights.get(nature, 0) + weight
        total_weight = max(
            sum(pokemon_data.get("Abilities", {"Unknown": 1}).values()),
            1,
        )
        sorted_natures = sorted(
            nature_weights.keys(), key=lambda x: nature_weights[x], reverse=True
        )[:10]
        return [
            [
                n,
                "{:.3f}".format(round(nature_weights[n] / total_weight * 100, 3)),
                nature_info.get(n, ""),
            ]
            for n in sorted_natures
        ][:10]

    # Branch for 'Graph'
    if category == "Graph":
        graph_stats = {stat: {} for stat in ["hp", "atk", "def", "spa", "spd", "spe"]}
        spreads = pokemon_data.get("Spreads", {})
        champions = is_champions_format(format_code)
        fmt_lower = format_code.lower()
        level = 50 if ("vgc" in fmt_lower or "bss" in fmt_lower or "champions" in fmt_lower) else 100
        total_weight = max(
            sum(pokemon_data.get("Abilities", {"Unknown": 1}).values()),
            1,
        )
        stat_modifiers = {
            "atk": (
                ["Naughty", "Adamant", "Lonely", "Brave"],
                ["Bold", "Timid", "Modest", "Calm"],
            ),
            "def": (
                ["Bold", "Relaxed", "Impish", "Lax"],
                ["Lonely", "Hasty", "Mild", "Gentle"],
            ),
            "spa": (
                ["Modest", "Mild", "Quiet", "Rash"],
                ["Adamant", "Impish", "Jolly", "Careful"],
            ),
            "spd": (
                ["Calm", "Gentle", "Sassy", "Careful"],
                ["Naughty", "Lax", "Naive", "Rash"],
            ),
            "spe": (
                ["Timid", "Hasty", "Jolly", "Naive"],
                ["Brave", "Relaxed", "Quiet", "Sassy"],
            ),
        }
        for spread, weight in spreads.items():
            parts = spread.split(":")
            nature = parts[0]
            evs = list(map(int, parts[1].split("/")))
            multipliers = {}
            for stat, (boost_list, nerf_list) in stat_modifiers.items():
                if nature in boost_list:
                    multipliers[stat] = 1.1
                elif nature in nerf_list:
                    multipliers[stat] = 0.9
                else:
                    multipliers[stat] = 1
            if champions:
                hp_val = calculate_champions_hp_value(base_stats[0], evs[0])
                atk_val = calculate_champions_stat_value(
                    base_stats[1], evs[1], multipliers["atk"]
                )
                def_val = calculate_champions_stat_value(
                    base_stats[2], evs[2], multipliers["def"]
                )
                spa_val = calculate_champions_stat_value(
                    base_stats[3], evs[3], multipliers["spa"]
                )
                spd_val = calculate_champions_stat_value(
                    base_stats[4], evs[4], multipliers["spd"]
                )
                spe_val = calculate_champions_stat_value(
                    base_stats[5], evs[5], multipliers["spe"]
                )
            else:
                hp_val = calculate_hp_value(base_stats[0], 31, evs[0], level)
                atk_val = calculate_stat_value(
                    base_stats[1], 31, evs[1], level, multipliers["atk"]
                )
                def_val = calculate_stat_value(
                    base_stats[2], 31, evs[2], level, multipliers["def"]
                )
                spa_val = calculate_stat_value(
                    base_stats[3], 31, evs[3], level, multipliers["spa"]
                )
                spd_val = calculate_stat_value(
                    base_stats[4], 31, evs[4], level, multipliers["spd"]
                )
                speed_iv = 0 if (multipliers["spe"] == 0.9 and evs[5] == 0) else 31
                spe_val = calculate_stat_value(
                    base_stats[5], speed_iv, evs[5], level, multipliers["spe"]
                )
            for stat, value in zip(
                ["hp", "atk", "def", "spa", "spd", "spe"],
                [hp_val, atk_val, def_val, spa_val, spd_val, spe_val],
            ):
                graph_stats[stat][value] = graph_stats[stat].get(value, 0) + weight
        sorted_graph = []
        for stat in ["hp", "atk", "def", "spa", "spd", "spe"]:
            sorted_values = sorted(
                graph_stats[stat].items(), key=lambda x: x[1], reverse=True
            )
            sorted_graph.append(
                [
                    [val, graph_stats[stat][val] / total_weight * 100]
                    for val, _ in sorted_values
                ]
            )
        if sorted_graph == []:
            return json.dumps([])
        return json.dumps(sorted_graph, separators=(",", ":"))

    # Branch for 'Moves'
    if category == "Moves":
        moves = pokemon_data.get("Moves", {})
        total_weight = max(
            sum(pokemon_data.get("Abilities", {"Unknown": 1}).values()),
            1,
        )
        moves_source = championsMoveDetails if is_champions_format(format_code) else moveDetails
        sorted_moves = sorted(moves.keys(), key=lambda m: moves[m], reverse=True)[:10]
        result = []
        for move in sorted_moves:
            move_info = moves_source.get(
                move,
                {
                    "name": "Nothing",
                    "type": "",
                    "category": "",
                    "basePower": "N/A",
                    "accuracy": "N/A",
                    "priority": 0,
                    "desc": "No info.",
                },
            )
            usage_percent = "{:.3f}".format(round(moves[move] / total_weight * 100, 3))
            move_text = (
                f"{move_info.get('type', '')} ({move_info.get('category', '')})\n"
                f"Base Power: "
                f"{'N/A' if move_info.get('basePower', 'N/A') == 0 else move_info.get('basePower', 'N/A')}\n"
                f"Accuracy: "
                f"{'N/A' if move_info.get('accuracy', 'N/A') is True else move_info.get('accuracy', 'N/A')}\n"
                f"Priority: {move_info.get('priority', 0)}\n"
                f"{move_info.get('desc', 'No info.')}"
            )
            result.append([move_info.get("name", "Nothing"), usage_percent, move_text])
        return result

    # Branch for 'Teammates'
    if category == "Teammates":
        teammates = pokemon_data.get("Teammates", {})
        total_weight = max(
            sum(pokemon_data.get("Abilities", {"Unknown": 1}).values()),
            1,
        )
        # Hot Fix for Teammmate Usage
        if total_weight < sum(teammates.values()) / 6:
            total_weight = sum(teammates.values()) / 6
        sorted_teammates = sorted(
            teammates.keys(), key=lambda x: teammates[x], reverse=True
        )[:10]
        return [
            [
                poke,
                "{:.3f}".format(round(teammates[poke] / total_weight * 100, 3)),
                get_pokemon_sprite(poke),
            ]
            for poke in sorted_teammates
        ]

    # Branch for 'Items'
    if category == "Items":
        items = pokemon_data.get("Items", {})
        total_weight = max(sum(items.values()), 1)
        sorted_items = sorted(items.keys(), key=lambda x: items[x], reverse=True)[:10]
        return [
            [
                itemDetails.get(item, {"name": "Nothing"})["name"],
                "{:.3f}".format(round(items[item] / total_weight * 100, 3)),
                itemDetails.get(item, {"desc": "No info."}).get("desc", "No info."),
                divmod(itemDetails.get(item, {"spritenum": 0})["spritenum"], 16),
            ]
            for item in sorted_items
        ]

    # Branch for 'Abilities'
    if category == "Abilities":
        abilities_source = championsAbilityDetails if is_champions_format(format_code) else abilityDetails
        abilities = pokemon_data.get("Abilities", {})
        total_weight = max(sum(abilities.values()), 1)
        sorted_abilities = sorted(
            abilities.keys(), key=lambda x: abilities[x], reverse=True
        )[:10]
        return [
            [
                abilities_source.get(ability, {"name": "Nothing"})["name"],
                "{:.1f}".format(round(abilities[ability] / total_weight * 100, 1)),
                abilities_source.get(ability, {"desc": "No info."}).get(
                    "desc", "No info."
                ),
            ]
            for ability in sorted_abilities
        ]

    # Branch for 'Spreads'
    if category == "Spreads":
        spreads = pokemon_data.get("Spreads", {})
        total_spread_weight = max(sum(spreads.values()), 1)
        sorted_spreads = sorted(
            spreads.keys(), key=lambda s: spreads[s], reverse=True
        )[:15]
        return [
            [s, "{:.3f}".format(round(spreads[s] / total_spread_weight * 100, 3))]
            for s in sorted_spreads
        ]

    # Branch for 'EVs'
    if category == "EVs":
        # Initialize dictionary for EVs by category.
        ev_data = {"atk": {}, "spa": {}, "spe": {}, "hp_def": {}, "hp_spd": {}}
        spreads = pokemon_data.get("Spreads", {})
        total_count = max(
            sum(pokemon_data.get("Abilities", {"Unknown": 1}).values()),
            1,
        )
        # Define nature lists.
        attack_natures = ["Naughty", "Adamant", "Lonely", "Brave"]
        defense_natures = ["Bold", "Relaxed", "Impish", "Lax"]
        sattack_natures = ["Modest", "Mild", "Quiet", "Rash"]
        sdefense_natures = ["Calm", "Gentle", "Sassy", "Careful"]
        speed_natures = ["Timid", "Hasty", "Jolly", "Naive"]
        attack_natures_m = ["Bold", "Timid", "Modest", "Calm"]
        defense_natures_m = ["Lonely", "Hasty", "Mild", "Gentle"]
        sattack_natures_m = ["Adamant", "Impish", "Jolly", "Careful"]
        sdefense_natures_m = ["Naughty", "Lax", "Naive", "Rash"]
        speed_natures_m = ["Brave", "Relaxed", "Quiet", "Sassy"]
        for spread in spreads:
            parts = spread.split(":")
            nature = parts[0]
            evs = parts[1].split("/")
            weight = spreads[spread]
            pa = "+" if nature in attack_natures else ""
            pd = "+" if nature in defense_natures else ""
            psa = "+" if nature in sattack_natures else ""
            psd = "+" if nature in sdefense_natures else ""
            pse = "+" if nature in speed_natures else ""
            if nature in attack_natures_m:
                pa = "-"
            if nature in defense_natures_m:
                pd = "-"
            if nature in sattack_natures_m:
                psa = "-"
            if nature in sdefense_natures_m:
                psd = "-"
            if nature in speed_natures_m:
                pse = "-"
            key_atk = evs[1] + pa + " Atk"
            key_spa = evs[3] + psa + " SpA"
            key_spe = evs[5] + pse + " Spe"
            key_hp_def = evs[0] + " HP / " + evs[2] + pd + " Def"
            key_hp_spd = evs[0] + " HP / " + evs[4] + psd + " SpD"
            ev_data["atk"][key_atk] = ev_data["atk"].get(key_atk, 0) + weight
            ev_data["spa"][key_spa] = ev_data["spa"].get(key_spa, 0) + weight
            ev_data["spe"][key_spe] = ev_data["spe"].get(key_spe, 0) + weight
            ev_data["hp_def"][key_hp_def] = (
                ev_data["hp_def"].get(key_hp_def, 0) + weight
            )
            ev_data["hp_spd"][key_hp_spd] = (
                ev_data["hp_spd"].get(key_hp_spd, 0) + weight
            )
        # Now sort each category and calculate percentages.
        sorted_ev = [[], [], [], [], []]
        sorted_ev[0] = sorted(
            ev_data["atk"].keys(), key=lambda x: ev_data["atk"][x], reverse=True
        )
        sorted_ev[0] = [
            [
                stat,
                "{:.3f}".format(round(ev_data["atk"][stat] / total_count * 100, 3)),
            ]
            for stat in sorted_ev[0]
        ][:15]
        sorted_ev[1] = sorted(
            ev_data["spa"].keys(), key=lambda x: ev_data["spa"][x], reverse=True
        )
        sorted_ev[1] = [
            [
                stat,
                "{:.3f}".format(round(ev_data["spa"][stat] / total_count * 100, 3)),
            ]
            for stat in sorted_ev[1]
        ][:15]
        sorted_ev[2] = sorted(
            ev_data["spe"].keys(), key=lambda x: ev_data["spe"][x], reverse=True
        )
        sorted_ev[2] = [
            [
                stat,
                "{:.3f}".format(round(ev_data["spe"][stat] / total_count * 100, 3)),
            ]
            for stat in sorted_ev[2]
        ][:15]
        sorted_ev[3] = sorted(
            ev_data["hp_def"].keys(), key=lambda x: ev_data["hp_def"][x], reverse=True
        )
        sorted_ev[3] = [
            [
                stat,
                "{:.3f}".format(round(ev_data["hp_def"][stat] / total_count * 100, 3)),
            ]
            for stat in sorted_ev[3]
        ][:15]
        sorted_ev[4] = sorted(
            ev_data["hp_spd"].keys(), key=lambda x: ev_data["hp_spd"][x], reverse=True
        )
        sorted_ev[4] = [
            [
                stat,
                "{:.3f}".format(round(ev_data["hp_spd"][stat] / total_count * 100, 3)),
            ]
            for stat in sorted_ev[4]
        ][:15]
        return sorted_ev

    # Branch for 'Tera Types'
    if category == "Tera Types":
        tera_types = pokemon_data.get("Tera Types", {})
        total_tera_types_weight = max(sum(tera_types.values()), 1)
        sorted_tera_types = sorted(
            tera_types.keys(), key=lambda s: tera_types[s], reverse=True
        )[:15]
        return [
            [
                t.capitalize(),
                "{:.3f}".format(
                    round(tera_types[t] / total_tera_types_weight * 100, 3)
                ),
            ]
            for t in sorted_tera_types
        ]

    # Branch for 'Checks and Counters'
    if category == "Checks and Counters":
        unfiltered_counters = pokemon_data.get("Checks and Counters", {})
        # Normalize: remote data uses [n, p, d] lists, local uses {"n", "p", "d"} dicts
        normalized = {}
        for key, value in unfiltered_counters.items():
            if isinstance(value, list):
                normalized[key] = {"n": value[0], "p": value[1], "d": value[2]}
            else:
                normalized[key] = value
        filtered_counters = {
            key: value
            for key, value in normalized.items()
            if value['d'] < 0.01 and value['p'] > 0.5
        }
        sorted_counters = sorted(
            filtered_counters.keys(), key=lambda x: filtered_counters[x]['p'], reverse=True
        )[:10]
        return [
            [
                poke,
                "{:.3f}".format(round(filtered_counters[poke]['p'] * 100, 3)),
                get_pokemon_sprite(poke),
            ]
            for poke in sorted_counters
        ]

    # Default branch:
    total_weight = max(
        sum(pokemon_data.get("Abilities", {"Unknown": 1}).values()),
        1,
    )
    sorted_keys = sorted(
        pokemon_data.keys(),
        key=lambda key: (
            pokemon_data[key]
            if isinstance(pokemon_data[key], (int, float))
            else 0
        ),
        reverse=True,
    )[:10]
    return [
        [
            key,
            "{:.3f}".format(
                round(pokemon_data[key] / total_weight * 100, 3)
            ),
        ]
        for key in sorted_keys
    ]


def get_pokemon_sprite(pokemon_name):
    """Return sprite coordinates as a tuple (row, col) for a given PokAcmon name."""
    word = pokemon_name.lower()
    word = re.sub(r"[^a-z0-9]+", "", word)
    if word in spriteIndex.keys():
        sprite_num = spriteIndex[word]
    elif word in pokedexEntries.keys():
        sprite_num = pokedexEntries[word].get("num", 0)
    else:
        return (0, 0)
    return divmod(sprite_num, 12)


load_all_data()
build_mega_item_lookup()
# Rebuild the Limitless cache in the background after (re)start; dyno
# restarts wipe the disk cache, so don't make the first visitor wait.
limitless_stats.warm_cache_async(pokedexEntries)
vgcpastes.warm_cache_async()


@app.route("/robots.txt")
def robots_txt():
    return app.send_static_file("robots.txt")


@app.route("/about/")
def about():
    return render_template("about.html")


def compile_page_data(format_code, rating_threshold="", pokemon_name="", month=None):
    """Resolve parameters and compile all data needed for a Pokemon page."""
    if month is None:
        month = get_latest_month()

    # Get formats available for this month
    month_formats = get_formats_for_month(month)
    month_format_codes = {f[0] for f in month_formats}

    default_format = DEFAULT_META
    chosen_format = format_code if format_code in month_format_codes else default_format
    # Fall back further if default isn't in this month either. The in-game
    # Champions entries lead every month's list but carry no ladder rating
    # cutoffs, so picking one here returns no data and bounces the request back
    # to the current month -- skip them and take a real ladder format, which the
    # list orders newest generation first.
    if chosen_format not in month_format_codes and month_formats:
        ladder = [f[0] for f in month_formats if not is_champions_game_format(f[0])]
        if ladder:
            chosen_format = ladder[0]
    display_name = formatDisplayNames.get(chosen_format, chosen_format)
    selected_format = [chosen_format, display_name]

    rating_options = get_valid_rating_thresholds(chosen_format, month)
    if not rating_options:
        return None

    chosen_rating = (
        rating_threshold if rating_threshold in rating_options else rating_options[-1]
    )

    # Load index for sidebar pokemon list
    index_data = fetch_index_data(chosen_format, chosen_rating, month)
    if not index_data or not index_data.get("pokemon"):
        return None

    pokemon_index = index_data["pokemon"]
    sorted_pokemon = sorted(
        pokemon_index.keys(), key=lambda name: pokemon_index[name]["usage"], reverse=True
    )
    default_pokemon = sorted_pokemon[0] if sorted_pokemon else ""

    if pokemon_name and pokemon_name != "No Pokemon":
        matched_pokemon = fuzzy_match(pokemon_name, pokemon_index.keys())
        if matched_pokemon:
            default_pokemon = matched_pokemon

    if default_pokemon == "":
        return None

    # Load individual pokemon data
    poke_data = fetch_pokemon_data(chosen_format, chosen_rating, default_pokemon, month)
    if not poke_data:
        return None

    try:
        rank = sorted_pokemon.index(default_pokemon) + 1
    except ValueError:
        rank = "N/A"
    usage_percent = round(
        pokemon_index.get(default_pokemon, {}).get("usage", 0) * 100, 2
    )
    current_pokemon_data = [
        default_pokemon,
        usage_percent,
        rank,
        get_pokemon_sprite(default_pokemon),
    ]

    # Load trend data
    trend_data = load_trend_data(chosen_format, chosen_rating)
    trend_months = []
    trend_usage = []
    trend_pokemon = {}
    if trend_data:
        trend_pokemon = trend_data.get("pokemon", {})
        pokemon_trend = trend_pokemon.get(default_pokemon)
        if pokemon_trend:
            trend_months = trend_data["months"]
            trend_usage = pokemon_trend

    def get_trend_direction(name):
        """Return 'up', 'down', 'same', or '' based on last two months."""
        vals = trend_pokemon.get(name)
        if not vals:
            return ""
        # Fill interior nulls with 0, keep leading/trailing nulls
        non_null_idxs = [i for i, v in enumerate(vals) if v is not None]
        if len(non_null_idxs) < 2:
            return ""
        first, last = non_null_idxs[0], non_null_idxs[-1]
        resolved = [
            (v if v is not None else 0) if first <= i <= last else None
            for i, v in enumerate(vals)
        ]
        # Compare last two non-null values
        recent = [v for v in resolved if v is not None]
        if len(recent) < 2:
            return ""
        if recent[-1] > recent[-2]:
            return "up"
        elif recent[-1] < recent[-2]:
            return "down"
        return "same"

    base_stats = compile_top_data(poke_data, default_pokemon, "Stats")
    pokemon_types = compile_top_data(poke_data, default_pokemon, "Types")
    moves_list = compile_top_data(
        poke_data, default_pokemon, "Moves", chosen_format
    )
    teammates_list = compile_top_data(poke_data, default_pokemon, "Teammates")
    items_list = compile_top_data(poke_data, default_pokemon, "Items")
    abilities_list = compile_top_data(
        poke_data, default_pokemon, "Abilities", chosen_format
    )
    spreads_list = compile_top_data(poke_data, default_pokemon, "Spreads")
    natures_list = compile_top_data(poke_data, default_pokemon, "Natures")
    evs_list = compile_top_data(poke_data, default_pokemon, "EVs")
    counters_list = compile_top_data(
        poke_data, default_pokemon, "Checks and Counters"
    )
    graph_data = compile_top_data(
        poke_data, default_pokemon, "Graph", chosen_format, base_stats
    )
    tera_types_list = compile_top_data(poke_data, default_pokemon, "Tera Types")

    return {
        "pokemon_names": [
            [
                name,
                "{:.2f}".format(round(pokemon_index[name]["usage"] * 100, 2)),
                get_pokemon_sprite(name),
                get_trend_direction(name) if month == get_latest_month() else "",
            ]
            for name in sorted_pokemon
        ],
        "selected_format": selected_format,
        "selected_pokemon": default_pokemon,
        "selected_rating": chosen_rating,
        "selected_month": month,
        "available_months": get_available_months(),
        "base_stats": base_stats,
        "pokemon_types": pokemon_types,
        "moves_list": moves_list,
        "teammates_list": teammates_list,
        "items_list": items_list,
        "abilities_list": abilities_list,
        "spreads_list": spreads_list,
        "natures_list": natures_list,
        "evs_list": evs_list,
        "counters_list": counters_list,
        "current_pokemon": current_pokemon_data,
        "rating_options": rating_options,
        "tera_types_list": tera_types_list,
        "graph_data": graph_data,
        "is_champions": is_champions_format(chosen_format),
        "is_champions_game": False,
        "month_formats": month_formats,
        "trend_months": trend_months,
        "trend_usage": trend_usage,
        "trend_kind": "usage",
        "show_trend": sum(1 for v in trend_usage if v is not None and v > 0) >= 2,
        "has_tournament_data": has_top_teams_data(chosen_format),
        "has_replay_data": chosen_format in REPLAY_FORMATS,
        "is_transformed": is_transformed_pokemon(default_pokemon),
    }


@app.route("/calc/")
@app.route("/calc/<format_code>/")
@app.route("/calc/<format_code>/<rating_threshold>/")
def calc_page(format_code="", rating_threshold=""):
    # The damage calc isn't available for in-game Champions data — send the
    # user to that format's usage page instead.
    if is_champions_game_format(format_code):
        return redirect(url_for(
            "display_pokemon_page", format_code=format_code,
            rating_threshold="0", pokemon_name="",
        ))
    month = request.args.get("month", None)
    data = compile_page_data(format_code or DEFAULT_META, rating_threshold, "", month)
    if data is None:
        return redirect(url_for("calc_page", format_code=DEFAULT_META, rating_threshold="0"))
    # A month fallback inside compile_page_data can still land on an in-game
    # format when the default meta is missing for that month.
    if is_champions_game_format(data["selected_format"][0]):
        return redirect(url_for("calc_page", format_code=DEFAULT_META, rating_threshold="0"))

    # The in-game Champions formats publish stats and natures separately, so the
    # calc can't pair them into a usable spread — keep them out of the picker.
    calc_formats = [
        fmt for fmt in data["month_formats"] if not is_champions_game_format(fmt[0])
    ]
    calc_format_ratings = {
        fmt[0]: get_valid_rating_thresholds(fmt[0], data["selected_month"])
        for fmt in calc_formats
    }
    data["pokemon_names"] = _calc_picker_names(
        data["selected_format"][0], data["selected_rating"],
        data["selected_month"], data["pokemon_names"],
    )
    return render_template(
        "index.html",
        **data,
        availableFormats=calc_formats,
        calc_only=True,
        calc_format_ratings=calc_format_ratings,
    )


@app.route("/<format_code>/<rating_threshold>/<pokemon_name>")
@app.route("/<format_code>/<rating_threshold>/")
@app.route("/<format_code>/")
def display_pokemon_page(format_code, rating_threshold="", pokemon_name=""):
    if is_champions_game_format(format_code):
        # Send legacy /championsdoubles/0/x URLs to the clean /champions/... path.
        slug = CHAMPIONS_GAME_FORMATS[format_code].lower()
        return redirect(url_for("champions_page", fmt=slug, pokemon_name=pokemon_name))
    month = request.args.get("month", None)
    data = compile_page_data(format_code, rating_threshold, pokemon_name, month)
    if data is None:
        return redirect(
            url_for(
                "display_pokemon_page",
                format_code=DEFAULT_META,
                rating_threshold="0",
                pokemon_name="",
            )
        )

    # Redirect if parameters were corrected (not on homepage)
    if request.path != "/" and (
        data["selected_format"][0] != format_code
        or data["selected_rating"] != rating_threshold
        or data["selected_pokemon"] != pokemon_name
    ):
        redirect_args = {
            "format_code": data["selected_format"][0],
            "rating_threshold": data["selected_rating"],
            "pokemon_name": data["selected_pokemon"],
        }
        if month and month != get_latest_month():
            redirect_args["month"] = month
        return redirect(url_for("display_pokemon_page", **redirect_args))

    # Pokemon deep links get a generated stat card as link-preview image
    og = {}
    if request.path != "/" and data.get("selected_pokemon"):
        og = {
            "og_image": url_for(
                "og_card_png",
                format_code=data["selected_format"][0],
                rating_threshold=data["selected_rating"],
                pokemon_name=data["selected_pokemon"],
                month=month if month and month != get_latest_month() else None,
                v=OG_CARD_REV, _external=True,
            ),
            "og_card": "summary_large_image",
        }

    return render_template(
        "index.html", **data, availableFormats=data["month_formats"], **og
    )


# Slug (doubles/singles) -> app format code, for the clean /champions/ URLs.
CHAMPIONS_SLUG_TO_FORMAT = {
    CHAMPIONS_GAME_FORMATS[code].lower(): code for code in CHAMPIONS_GAME_FORMATS
}


@app.route("/champions/")
@app.route("/champions/<fmt>/")
@app.route("/champions/<fmt>/<pokemon_name>")
def champions_page(fmt="doubles", pokemon_name=""):
    """Clean, bookmarkable URLs for the Pokémon Champions in-game data."""
    format_code = CHAMPIONS_SLUG_TO_FORMAT.get(fmt.lower())
    if not format_code:
        return redirect(url_for("champions_page", fmt="doubles"))
    data = compile_champions_page_data(format_code, pokemon_name)
    if data is None:
        return redirect(url_for("champions_page", fmt="doubles"))
    # Redirect to the canonical URL when the Pokémon was defaulted/corrected.
    if data["selected_pokemon"] != pokemon_name:
        return redirect(url_for(
            "champions_page", fmt=fmt.lower(), pokemon_name=data["selected_pokemon"],
        ))
    og = {
        "og_image": url_for(
            "og_card_champions", fmt=fmt.lower(),
            pokemon_name=data["selected_pokemon"],
            v=OG_CARD_REV, _external=True,
        ),
        "og_card": "summary_large_image",
    }
    return render_template(
        "index.html", **data, availableFormats=data["month_formats"], **og
    )


@lru_cache(maxsize=2)
def _champions_release_pool(month):
    """Lowercased species seen in any Champions format in a given month.

    The Showdown dex still marks shipped Champions Megas as isNonstandard
    "Future", so play anywhere in the game is the only release signal there is.
    A few hundred names per month, so caching two of them is cheap.
    """
    if not is_local_month(month):
        return frozenset()
    root = os.path.join(DATA_DIRECTORY, month)
    names = set()
    for fmt in os.listdir(root):
        if not is_champions_format(fmt) or not os.path.isdir(os.path.join(root, fmt)):
            continue
        index = (fetch_index_data(fmt, "0", month) or {}).get("pokemon") or {}
        names.update(k.lower() for k in index)
    return frozenset(names)


def _species_pool(format_code, rating, month, current_names):
    """Lowercased species that exist in this format, for form filtering.

    Smogon cuts each rating tier independently, so a form can be listed at 1760
    and missing from the unrestricted tier — the pool is the union of the tier
    being viewed and the unrestricted one. Remote months would have to download
    a whole chaos file to add the latter, so they get the viewed tier alone.
    """
    pool = {name.lower() for name in current_names}
    if not is_local_month(month):
        return pool
    if str(rating) != "0":
        index = (fetch_index_data(format_code, "0", month) or {}).get("pokemon") or {}
        pool.update(k.lower() for k in index)
    if is_champions_format(format_code):
        pool |= _champions_release_pool(month)
    return pool


# Shown in the calc's Pokémon picker for entries with no usage at the chosen
# rating. Anything non-numeric here also suppresses the "%" suffix client-side.
CALC_NO_DATA_USAGE = "—"


def _calc_picker_names(format_code, rating, month, pokemon_names):
    """Fold the unrestricted tier's roster into a rating-filtered picker list.

    A Pokémon that only saw play below the chosen rating is otherwise
    unreachable in the calc; it gets listed with a dash for usage instead, and
    compile_calc_data serves it from the pokedex.
    """
    if str(rating) == "0" or not is_local_month(month):
        return pokemon_names
    index = (fetch_index_data(format_code, "0", month) or {}).get("pokemon") or {}
    listed = {row[0].lower() for row in pokemon_names}
    extra = sorted((n for n in index if n.lower() not in listed), key=str.lower)
    return pokemon_names + [
        [name, CALC_NO_DATA_USAGE, get_pokemon_sprite(name), ""] for name in extra
    ]


def _ratings_with_data(format_code, pokemon_name, month):
    """Rating tiers (ascending, as strings) whose index lists this Pokémon."""
    if not is_local_month(month):
        return []
    key = pokemon_name.lower()
    found = []
    for tier in get_valid_rating_thresholds(format_code, month):
        index = (fetch_index_data(format_code, tier, month) or {}).get("pokemon") or {}
        if any(k.lower() == key for k in index):
            found.append(tier)
    return found


def _filter_forme_order(forme_order_raw, base_entry, pokemon_index_lower, champions=False):
    """Keep forms that have usage data OR differ mechanically from the base form.
    Exclude Illegal-tier forms (unreleased) unless in Champions format."""
    result = []
    for position, f in enumerate(forme_order_raw):
        if f.lower() in pokemon_index_lower:
            result.append(f)
            continue
        dex_key = f.lower().replace(" ", "").replace("-", "")
        entry = pokedexEntries.get(dex_key, {})
        if not entry:
            continue
        # The base form always stays. It is what the distinctness test below
        # compares against, so that test can never keep it, and without it
        # there is no way back from Lucario-Mega to Lucario in a tier where
        # only the Mega saw play.
        if position == 0 and not entry.get("baseSpecies"):
            result.append(f)
            continue
        if not champions and entry.get("tier") == "Illegal":
            continue
        # "Future" marks a forme Showdown knows about but no game has released
        # yet (Lucario-Mega-Z). Once it ships it picks up usage data and comes
        # back through the pool check above.
        if entry.get("isNonstandard") == "Future":
            continue
        # Ogerpon's Terastallized formes belong to the Tera toggle, not to a
        # picker that is supposed to list what you can bring to the match.
        if entry.get("forme", "").endswith("-Tera"):
            continue
        # Different stats or typing means a different damage roll, so the form
        # is worth offering even with no usage behind it. Cosmetic forms
        # (Vivillon patterns, Alcremie flavours) match on both and are dropped.
        if _forme_differs(entry, base_entry):
            result.append(f)
    return result


def _forme_differs(entry, base_entry):
    """True if a forme differs from its base species in base stats or typing."""
    if not base_entry:
        return bool(entry.get("baseStats"))
    return any(
        entry.get(field) and entry.get(field) != base_entry.get(field)
        for field in ("baseStats", "types")
    )


def _index_lookup(pokemon_index, name):
    """The usage-index key matching a species name exactly, ignoring case."""
    key = name.lower()
    return next((k for k in pokemon_index if k.lower() == key), None)


def _battle_only_origins(dex_entry):
    """Species a forme can only ever appear as a mid-battle transformation of.

    Aegislash-Blade and Aegislash are one Pokémon as far as teambuilding goes,
    so Showdown records the pair under a single usage line — the origin's.
    """
    origin = dex_entry.get("battleOnly")
    if not origin:
        return []
    return [origin] if isinstance(origin, str) else list(origin)


def _neutral_spread(base_list, level, champions):
    """A 0-EV, neutral-nature spread, shaped like the ones built from usage data.

    Something has to stand in when a Pokémon has no spreads at this rating: a
    defender with all-zero stats takes absurd damage, which reads as a calc bug.
    """
    evs = [0] * 6
    if champions:
        stats = {
            "hp": calculate_champions_hp_value(base_list[0], 0),
            "atk": calculate_champions_stat_value(base_list[1], 0, 1.0),
            "def": calculate_champions_stat_value(base_list[2], 0, 1.0),
            "spa": calculate_champions_stat_value(base_list[3], 0, 1.0),
            "spd": calculate_champions_stat_value(base_list[4], 0, 1.0),
            "spe": calculate_champions_stat_value(base_list[5], 0, 1.0),
        }
    else:
        stats = {
            "hp": calculate_hp_value(base_list[0], 31, 0, level),
            "atk": calculate_stat_value(base_list[1], 31, 0, level, 1.0),
            "def": calculate_stat_value(base_list[2], 31, 0, level, 1.0),
            "spa": calculate_stat_value(base_list[3], 31, 0, level, 1.0),
            "spd": calculate_stat_value(base_list[4], 31, 0, level, 1.0),
            "spe": calculate_stat_value(base_list[5], 31, 0, level, 1.0),
        }
    return {
        "spread": "Hardy:0/0/0/0/0/0",
        "nature": "Hardy",
        "evs": dict(zip(STAT_KEYS, evs)),
        "ivs": {stat: 31 for stat in STAT_KEYS},
        "weight": 1.0,
        "stats": stats,
    }


def _pokedex_only_calc_data(format_code, rating, month, dex_entry, pokemon_index):
    """Calc payload for a Pokémon with no usage line to draw on.

    Base stats and typing come from the pokedex; the spread is a neutral
    placeholder so the defender has real HP and defenses instead of zeros.
    """
    display_name = dex_entry.get("name", "")
    base_stats_dict = dex_entry.get("baseStats", {})
    pokemon_types = dex_entry.get("types", ["Normal"])
    pokemon_weightkg = dex_entry.get("weightkg", 0)
    dex_abilities = dex_entry.get("abilities", {})
    all_abilities = [{"name": v, "usage": 0} for v in dex_abilities.values() if v]
    champions = is_champions_format(format_code)
    fmt_lower = format_code.lower()
    level = 50 if any(k in fmt_lower for k in ("vgc", "bss", "champions", "doubl")) else 100
    calc_generation = 0 if champions else (extract_generation_from_format(format_code) or 9)
    # Build formeOrder from base species, filtered to mechanically distinct forms
    base_species = dex_entry.get("baseSpecies", "")
    base_dex_key = base_species.lower().replace(" ", "").replace("-", "") if base_species else None
    base_dex = pokedexEntries.get(base_dex_key, {}) if base_dex_key else {}
    forme_base_entry = base_dex or dex_entry
    forme_order_raw = base_dex.get("formeOrder", []) or dex_entry.get("formeOrder", [])
    pokemon_index_lower = _species_pool(format_code, rating, month, pokemon_index)
    forme_order = _filter_forme_order(forme_order_raw, forme_base_entry, pokemon_index_lower, champions)
    lower_tiers = [
        t for t in _ratings_with_data(format_code, display_name, month)
        if str(t) != str(rating)
    ]
    base_list = [base_stats_dict.get(k, 0) for k in STAT_KEYS]
    neutral = _neutral_spread(base_list, level, champions)
    return {
        "name": display_name,
        "calcSpecies": display_name,
        "calcGeneration": calc_generation,
        "types": pokemon_types,
        "weightkg": pokemon_weightkg,
        "baseStats": base_stats_dict,
        "speciesOverrides": {
            "name": display_name,
            "types": pokemon_types,
            "weightkg": pokemon_weightkg,
            "baseStats": base_stats_dict,
            "abilities": {"0": all_abilities[0]["name"] if all_abilities else ""},
        },
        "level": level,
        "isChampions": champions,
        "averageStats": neutral["stats"],
        # No preset to offer, but the damage maths still needs a spread to run
        # against — an all-zero defender takes absurd damage.
        "spreads": [],
        "allSpreads": [neutral],
        "defGroups": [],
        "spdGroups": [],
        "atkGroups": [],
        "spaGroups": [],
        "topMoves": [],
        "topAbility": all_abilities[0]["name"] if all_abilities else "",
        "topItem": "",
        "allAbilities": all_abilities,
        "allItems": [],
        "topTera": "",
        "formeOrder": forme_order,
        "hasUsageData": False,
        "dataRatings": lower_tiers,
    }


def compile_calc_data(format_code, rating, pokemon_name, month=None):
    """Return base stats, spread distribution, and top moves/ability/item for damage calc."""
    if month is None:
        month = get_latest_month()

    index_data = fetch_index_data(format_code, rating, month)
    if not index_data:
        return None
    pokemon_index = index_data.get("pokemon", {})
    if not pokemon_index:
        return None

    matched_pokemon = fuzzy_match(pokemon_name, pokemon_index.keys())

    # Detect if fuzzy_match returned a different form (e.g. "Aegislash" for "Aegislash-Blade").
    # If the requested name has an exact pokedex entry but differs from the usage match,
    # treat it as a battle-only form and use the pokedex fallback.
    exact_dex_key = pokemon_name.lower().replace(" ", "").replace("-", "")
    is_different_form = (
        matched_pokemon
        and exact_dex_key in pokedexEntries
        and matched_pokemon.lower().replace(" ", "").replace("-", "") != exact_dex_key
    )

    # Forms without a usage line of their own: borrow the origin species' sets
    # where there is one (Aegislash-Blade), otherwise serve pokedex base stats
    # so the calc still works.
    battle_only_forme = None
    if not matched_pokemon or is_different_form:
        dex_key = exact_dex_key if exact_dex_key in pokedexEntries else None
        if not dex_key:
            if not matched_pokemon:
                return None
            # Fall through to normal path if the name just isn't in the pokedex
        else:
            dex_entry = pokedexEntries[dex_key]
            display_name = dex_entry.get("name", pokemon_name)
            # A battle-only forme shares its origin's usage line, so run the
            # origin's sets through this forme's own base stats and typing
            # rather than serving a statless pokedex entry.
            origin_key = next(
                (k for k in (_index_lookup(pokemon_index, o)
                             for o in _battle_only_origins(dex_entry)) if k),
                None,
            )
            if origin_key:
                matched_pokemon = origin_key
                battle_only_forme = display_name
            else:
                return _pokedex_only_calc_data(
                    format_code, rating, month, dex_entry, pokemon_index
                )

    poke_data = fetch_pokemon_data(format_code, rating, matched_pokemon, month)
    if not poke_data:
        return None

    # A battle-only forme borrows matched_pokemon's usage line but keeps its own
    # dex entry, so stats, typing and the displayed name come from the forme.
    display_name = battle_only_forme or matched_pokemon
    matched_dex = fuzzy_match(display_name, pokedexEntries.keys())
    dex_entry = pokedexEntries.get(matched_dex, {}) if matched_dex else {}
    base_stats_dict = dex_entry.get("baseStats", {})
    pokemon_types = dex_entry.get("types", ["Normal"])
    pokemon_weightkg = dex_entry.get("weightkg", 0)
    base_list = [base_stats_dict.get(k, 0) for k in ["hp", "atk", "def", "spa", "spd", "spe"]]

    champions = is_champions_format(format_code)
    fmt_lower = format_code.lower()
    level = 50 if any(k in fmt_lower for k in ("vgc", "bss", "champions", "doubl")) else 100

    stat_mod_lists = {
        "atk": (["Naughty", "Adamant", "Lonely", "Brave"], ["Bold", "Timid", "Modest", "Calm"]),
        "def": (["Bold", "Relaxed", "Impish", "Lax"], ["Lonely", "Hasty", "Mild", "Gentle"]),
        "spa": (["Modest", "Mild", "Quiet", "Rash"], ["Adamant", "Impish", "Jolly", "Careful"]),
        "spd": (["Calm", "Gentle", "Sassy", "Careful"], ["Naughty", "Lax", "Naive", "Rash"]),
        "spe": (["Timid", "Hasty", "Jolly", "Naive"], ["Brave", "Relaxed", "Quiet", "Sassy"]),
    }

    spreads_raw = poke_data.get("Spreads", {})
    total_raw = sum(spreads_raw.values()) or 1

    # Process ALL spreads for stat group accuracy; preset dropdown gets top 30.
    all_computed = []
    for spread_key, weight in sorted(spreads_raw.items(), key=lambda x: -x[1]):
        parts = spread_key.split(":")
        if len(parts) < 2:
            continue
        nature = parts[0]
        try:
            evs = list(map(int, parts[1].split("/")))
            if len(evs) < 6:
                continue
        except (ValueError, IndexError):
            continue
        multipliers = {}
        for stat, (boosts, nerfs) in stat_mod_lists.items():
            multipliers[stat] = 1.1 if nature in boosts else (0.9 if nature in nerfs else 1.0)
        ev_table = dict(zip(STAT_KEYS, evs[:6]))
        iv_table = {stat: 31 for stat in STAT_KEYS}
        if champions:
            stats = {
                "hp": calculate_champions_hp_value(base_list[0], evs[0]),
                "atk": calculate_champions_stat_value(base_list[1], evs[1], multipliers["atk"]),
                "def": calculate_champions_stat_value(base_list[2], evs[2], multipliers["def"]),
                "spa": calculate_champions_stat_value(base_list[3], evs[3], multipliers["spa"]),
                "spd": calculate_champions_stat_value(base_list[4], evs[4], multipliers["spd"]),
                "spe": calculate_champions_stat_value(base_list[5], evs[5], multipliers["spe"]),
            }
        else:
            speed_iv = 0 if (multipliers["spe"] == 0.9 and evs[5] == 0) else 31
            iv_table["spe"] = speed_iv
            stats = {
                "hp": calculate_hp_value(base_list[0], 31, evs[0], level),
                "atk": calculate_stat_value(base_list[1], 31, evs[1], level, multipliers["atk"]),
                "def": calculate_stat_value(base_list[2], 31, evs[2], level, multipliers["def"]),
                "spa": calculate_stat_value(base_list[3], 31, evs[3], level, multipliers["spa"]),
                "spd": calculate_stat_value(base_list[4], 31, evs[4], level, multipliers["spd"]),
                "spe": calculate_stat_value(base_list[5], speed_iv, evs[5], level, multipliers["spe"]),
            }
        all_computed.append({
            "spread": spread_key,
            "nature": nature,
            "evs": ev_table,
            "ivs": iv_table,
            "weight": weight / total_raw,
            "stats": stats,
        })

    # Top-30 preset list for the attacker dropdown
    computed_spreads = all_computed[:30]

    if all_computed:
        total_w = sum(s["weight"] for s in all_computed)
        avg_stats = {
            stat: round(sum(s["stats"][stat] * s["weight"] for s in all_computed) / total_w)
            for stat in STAT_KEYS
        }
    else:
        avg_stats = {k: 0 for k in STAT_KEYS}

    # Build stat group distributions from ALL spreads for maximum accuracy
    def_pair_counter = {}
    spd_pair_counter = {}
    atk_counter = {}
    spa_counter = {}
    for s in all_computed:
        st, w = s["stats"], s["weight"]
        def_key = (st["hp"], st["def"])
        spd_key = (st["hp"], st["spd"])
        def_pair_counter[def_key] = def_pair_counter.get(def_key, 0) + w
        spd_pair_counter[spd_key] = spd_pair_counter.get(spd_key, 0) + w
        atk_counter[st["atk"]] = atk_counter.get(st["atk"], 0) + w
        spa_counter[st["spa"]] = spa_counter.get(st["spa"], 0) + w

    def_groups = sorted([{"hp": k[0], "def": k[1], "weight": round(v, 5)} for k, v in def_pair_counter.items()], key=lambda x: -x["weight"])
    spd_groups = sorted([{"hp": k[0], "spd": k[1], "weight": round(v, 5)} for k, v in spd_pair_counter.items()], key=lambda x: -x["weight"])
    atk_groups = sorted([{"atk": k, "weight": round(v, 5)} for k, v in atk_counter.items()], key=lambda x: -x["weight"])
    spa_groups = sorted([{"spa": k, "weight": round(v, 5)} for k, v in spa_counter.items()], key=lambda x: -x["weight"])

    moves_source = championsMoveDetails if champions else moveDetails
    moves_raw = poke_data.get("Moves", {})
    moves_total = max(sum(poke_data.get("Abilities", {"x": 1}).values()), 1)
    top_moves = []
    for move_key in sorted(moves_raw.keys(), key=lambda m: moves_raw[m], reverse=True)[:6]:
        if move_key in ("nothing", ""):
            continue
        move_info = moves_source.get(move_key, {})
        top_moves.append(build_calc_move_payload(
            move_key,
            move_info,
            round(moves_raw[move_key] / moves_total * 100, 1),
        ))

    abilities_source = championsAbilityDetails if champions else abilityDetails
    abilities_raw = poke_data.get("Abilities", {})
    abilities_total = sum(abilities_raw.values()) if abilities_raw else 1
    all_abilities = []
    if abilities_raw:
        for ab_key in sorted(abilities_raw.keys(), key=lambda a: abilities_raw[a], reverse=True):
            ab_info = abilities_source.get(ab_key, {})
            all_abilities.append({
                "name": ab_info.get("name", ab_key.title()),
                "usage": round(abilities_raw[ab_key] / abilities_total * 100, 1),
            })

    items_raw = poke_data.get("Items", {})
    items_total = sum(items_raw.values()) if items_raw else 1
    all_items = []
    if items_raw:
        for item_key in sorted(items_raw.keys(), key=lambda i: items_raw[i], reverse=True):
            item_info = itemDetails.get(item_key, {})
            name = item_info.get("name", item_key.title())
            if name and name.lower() != "nothing":
                all_items.append({
                    "name": name,
                    "usage": round(items_raw[item_key] / items_total * 100, 1),
                })

    tera_raw = poke_data.get("Tera Types", {})
    top_tera = ""
    if tera_raw:
        top_tera_key = max(tera_raw.keys(), key=lambda t: tera_raw[t])
        if top_tera_key.lower() != "nothing":
            top_tera = top_tera_key.capitalize()

    # Get form data from pokedex, filtered to forms that are playable here
    forme_order_raw = dex_entry.get("formeOrder", [])
    forme_base_entry = dex_entry
    if not forme_order_raw and dex_entry.get("baseSpecies"):
        base_key = fuzzy_match(
            dex_entry["baseSpecies"].lower().replace(" ", "").replace("-", ""),
            pokedexEntries.keys(),
        )
        if base_key:
            forme_order_raw = pokedexEntries[base_key].get("formeOrder", [])
            forme_base_entry = pokedexEntries[base_key]
    pokemon_index_lower = _species_pool(format_code, rating, month, pokemon_index)
    forme_order = _filter_forme_order(forme_order_raw, forme_base_entry, pokemon_index_lower, champions)
    calc_generation = 0 if champions else (extract_generation_from_format(format_code) or 9)
    species_overrides = {
        "name": display_name,
        "types": pokemon_types,
        "weightkg": pokemon_weightkg,
        "baseStats": base_stats_dict,
        "abilities": {"0": all_abilities[0] if all_abilities else ""},
    }
    if dex_entry.get("nfe") is not None:
        species_overrides["nfe"] = dex_entry.get("nfe")

    return {
        "name": display_name,
        "calcSpecies": display_name,
        "calcGeneration": calc_generation,
        "types": pokemon_types,
        "weightkg": pokemon_weightkg,
        "baseStats": base_stats_dict,
        "speciesOverrides": species_overrides,
        "level": level,
        "isChampions": champions,
        "averageStats": avg_stats,
        "spreads": computed_spreads,
        "allSpreads": all_computed,
        "defGroups": def_groups,
        "spdGroups": spd_groups,
        "atkGroups": atk_groups,
        "spaGroups": spa_groups,
        "topMoves": top_moves,
        "topAbility": all_abilities[0]["name"] if all_abilities else "",
        "topItem": all_items[0]["name"] if all_items else "",
        "allAbilities": all_abilities,
        "allItems": all_items,
        "topTera": top_tera,
        "formeOrder": forme_order,
        "hasUsageData": True,
        "dataRatings": [],
    }


@app.route("/api/moves/search")
def api_moves_search():
    q = request.args.get("q", "").strip().lower()
    fmt = request.args.get("format", "")
    if not q or len(q) < 2:
        return jsonify([])
    source = championsMoveDetails if is_champions_format(fmt) else moveDetails
    if not source:
        source = moveDetails or {}
    results = []
    for move_key, move_info in source.items():
        name = move_info.get("name", move_key.title())
        nl = name.lower()
        if not (nl.startswith(q) or q in nl):
            continue
        results.append(build_calc_move_payload(move_key, move_info))
    starts   = sorted([r for r in results if r["name"].lower().startswith(q)], key=lambda r: r["name"])
    contains = sorted([r for r in results if not r["name"].lower().startswith(q)], key=lambda r: r["name"])
    return jsonify((starts + contains)[:15])


@app.route("/api/calc/import", methods=["POST"])
def api_calc_import():
    """Parse a pasted team (or pokepast.es link) into calc-ready sets."""
    payload = request.get_json(silent=True) or {}
    text = (payload.get("text") or "").strip()
    format_code = payload.get("format") or ""
    if not text:
        return jsonify({"error": "Paste a team first."}), 400
    if len(text) > PASTE_MAX_CHARS:
        return jsonify({"error": "That paste is too long to import."}), 413

    link = _POKEPASTE_INPUT_RE.match(text)
    if link:
        fetched = vgcpastes.get_paste_text(f"https://pokepast.es/{link.group(1)}")
        if not fetched:
            return jsonify({"error": "Couldn't load that pokepast.es link."}), 400
        text = fetched

    sets, warnings = parse_showdown_paste(text, format_code)
    if not sets:
        return jsonify({"error": "No Pokémon found in that paste."}), 400
    return jsonify({"sets": sets, "warnings": warnings})


@app.route("/api/<format_code>/<rating_threshold>/calc/<pokemon_name>")
def api_calc_data(format_code, rating_threshold="", pokemon_name=""):
    month = request.args.get("month", None)
    data = compile_calc_data(format_code, rating_threshold, pokemon_name, month)
    if data is None:
        return jsonify({"error": "No data found"}), 404
    return jsonify(data)


@app.route("/api/<format_code>/<rating_threshold>/<pokemon_name>")
@app.route("/api/<format_code>/<rating_threshold>/")
@app.route("/api/<format_code>/")
def api_pokemon_data(format_code, rating_threshold="", pokemon_name=""):
    if is_champions_game_format(format_code):
        data = compile_champions_page_data(format_code, pokemon_name)
        if data is None:
            return jsonify({"error": "No data found"}), 404
        return jsonify(data)
    month = request.args.get("month", None)
    data = compile_page_data(format_code, rating_threshold, pokemon_name, month)
    if data is None:
        return jsonify({"error": "No data found"}), 404
    if request.args.get("calc"):
        data["pokemon_names"] = _calc_picker_names(
            data["selected_format"][0], data["selected_rating"],
            data["selected_month"], data["pokemon_names"],
        )
    return jsonify(data)


@app.route("/search_pokemon", methods=["POST"])
def search_pokemon_route():
    default_format = DEFAULT_META
    selected_format_input = request.form.get(
        "meta_value",
        f'["{default_format}", "{formatDisplayNames.get(default_format, default_format)}"]',
    )
    selected_pokemon_input = request.form.get("pokemon_value", "No Pokemon")
    selected_rating_input = request.form.get("rating_value", "No Rating")
    print(selected_format_input, selected_pokemon_input, selected_rating_input)

    try:
        selected_format = json.loads(selected_format_input)
    except Exception:
        selected_format = [
            default_format,
            formatDisplayNames.get(default_format, default_format),
        ]

    chosen_format = (
        selected_format[0]
        if selected_format[0] in formatDisplayNames
        else default_format
    )

    # In-game Champions formats have no ratings/months — resolve the Pokémon and
    # redirect straight to its usage page.
    if is_champions_game_format(chosen_format):
        search = selected_pokemon_input if selected_pokemon_input != "No Pokemon" else ""
        data = compile_champions_page_data(chosen_format, search)
        return redirect(url_for(
            "display_pokemon_page", format_code=chosen_format,
            rating_threshold="0", pokemon_name=(data["selected_pokemon"] if data else ""),
        ))

    rating_options = get_valid_rating_thresholds(chosen_format)
    chosen_rating = (
        selected_rating_input
        if selected_rating_input in rating_options
        else rating_options[-1]
    )

    index_data = fetch_index_data(chosen_format, chosen_rating)
    pokemon_index = index_data.get("pokemon", {})
    sorted_pokemon = sorted(
        pokemon_index.keys(), key=lambda name: pokemon_index[name]["usage"], reverse=True
    )
    default_pokemon = sorted_pokemon[0] if sorted_pokemon else ""

    if selected_pokemon_input != "No Pokemon":
        matched_pokemon = fuzzy_match(selected_pokemon_input, pokemon_index.keys())
        if matched_pokemon:
            default_pokemon = matched_pokemon

    return redirect(
        url_for(
            "display_pokemon_page",
            format_code=chosen_format,
            rating_threshold=chosen_rating,
            pokemon_name=default_pokemon,
        )
    )


# ─── Replay/Teams Integration ────��───────────────────────────────────────────


def get_pokemon_sprite_num(pokemon_name):
    """Return sprite index number for a given Pokemon name (for JS-side divmod)."""
    word = pokemon_name.lower()
    word = re.sub(r"[^a-z0-9]+", "", word)
    if word in spriteIndex:
        return spriteIndex[word]
    elif word in pokedexEntries:
        return pokedexEntries[word].get("num", 0)
    return 0


def find_replays(poke_search, meta, replay_total=100, filters=None):
    """Stream through replay JSON and return matching replays. Uses ijson for low memory."""
    if filters is None:
        filters = {
            "teamused": False,
            "rating": 0,
            "winner": False,
            "usage_score": 0,
            "player_search": [],
            "filter_all_pokemon": True,
        }

    # meta comes from query args; restrict to slug characters since it is
    # interpolated into a cache path and a fetch URL.
    if not re.fullmatch(r"[a-z0-9]+", meta or ""):
        return []
    filepath = get_replay_data_file(f"search-replays-list-{meta}.json")
    if not filepath:
        return []

    search_replays = []
    with open(filepath, "rb") as file:
        replay_data = ijson.items(file, "item")
        for replay in replay_data:
            # Apply Pokemon search filter
            if poke_search:
                if filters.get("filter_all_pokemon"):
                    if not (
                        set(poke_search).issubset(replay["teams"][0])
                        or set(poke_search).issubset(replay["teams"][1])
                    ):
                        continue
                else:
                    if (
                        len(set(poke_search).intersection(replay["teams"][0]))
                        + len(set(poke_search).intersection(replay["teams"][1]))
                    ) == 0:
                        continue

            # Apply Player Search
            if len(filters.get("player_search", [])) > 0 and filters.get("player_search")[0] != "":
                players = set(
                    p.lower().replace(" ", "") for p in filters.get("player_search")
                )
                replay_players = set(
                    p.lower().replace(" ", "") for p in replay["players"]
                )
                if not (players & replay_players):
                    continue

            # Apply teamused filter
            if filters.get("teamused"):
                if filters.get("filter_all_pokemon"):
                    if not (
                        set(poke_search).issubset(replay["teamused"][0])
                        or set(poke_search).issubset(replay["teamused"][1])
                    ):
                        continue
                else:
                    if (
                        len(set(poke_search).intersection(replay["teamused"][0]))
                        + len(set(poke_search).intersection(replay["teamused"][1]))
                    ) == 0:
                        continue

            # Apply rating filter
            if filters.get("rating", 0) > 0 and replay.get("rating", 0) > filters["rating"]:
                continue

            # Apply usage score filter
            if filters.get("usage_score", 0) > 0 and min(
                replay.get("usage_score", [600, 600])
            ) > filters["usage_score"]:
                continue

            # Apply winner filter
            if filters.get("winner"):
                if filters.get("filter_all_pokemon"):
                    if not (
                        (set(poke_search).issubset(replay["teams"][0]) and replay["winner_index"] == 1)
                        or (set(poke_search).issubset(replay["teams"][1]) and replay["winner_index"] == 2)
                    ):
                        continue
                else:
                    if not (
                        (len(set(poke_search).intersection(replay["teams"][0])) > 0 and replay["winner_index"] == 1)
                        or (len(set(poke_search).intersection(replay["teams"][1])) > 0 and replay["winner_index"] == 2)
                    ):
                        continue

            sprite_index_team = [
                [get_pokemon_sprite_num(p) for p in replay["teams"][0]],
                [get_pokemon_sprite_num(p) for p in replay["teams"][1]],
            ]
            teamused_raw = replay.get("teamused", [[], []])
            teamused_brought = [
                [p in teamused_raw[0] for p in replay["teams"][0]],
                [p in teamused_raw[1] for p in replay["teams"][1]],
            ]
            search_replays.append([
                replay["id"],
                replay["rating"],
                replay["winner"],
                replay["players"],
                sprite_index_team,
                replay["score"],
                replay["uploadtime"],
                replay["usage_score"],
                replay["bo3_matches"],
                replay["format"],
                teamused_brought,
                replay.get("winner_index", 0),
            ])

            if len(search_replays) >= replay_total:
                break

    return search_replays


def stream_team_rankings(format_name, poke_filter=None, filter_all_pokemon=True, limit=50):
    """Stream team rankings JSON with ijson for low memory usage."""
    if not re.fullmatch(r"[a-z0-9]+", format_name or ""):
        return []
    filepath = get_replay_data_file(f"team-rankings-{format_name}.json")
    if not filepath:
        return []

    results = []
    with open(filepath, "rb") as f:
        for team in ijson.items(f, "item"):
            if poke_filter:
                team_names = set(team["team"])
                if filter_all_pokemon:
                    if not set(poke_filter).issubset(team_names):
                        continue
                else:
                    if not set(poke_filter) & team_names:
                        continue

            results.append({
                "team": team["team"],
                "sprites": [get_pokemon_sprite_num(p) for p in team["team"]],
                "wins": team["wins"],
                "losses": team["losses"],
                "total_battles": team["total_battles"],
                "avg_rating": round(team["avg_rating"]),
                "max_rating": team["max_rating"],
                "win_rate": round(team["win_rate"] * 100, 1),
                "rank_score": round(team["rank_score"], 1),
                "replays": team["replays"][:20],
            })
            if len(results) >= limit:
                break

    return results


# Default replay list, memoized on the data file's mtime so it refreshes
# whenever a newer copy is fetched (the dyno no longer restarts on data
# updates, so a boot-time constant would go stale).
_default_replays = {"key": None, "data": []}


def get_default_replays():
    filepath = get_replay_data_file(f"search-replays-list-{REPLAY_FORMATS[0]}.json")
    if not filepath:
        return []
    key = (filepath, os.path.getmtime(filepath))
    if _default_replays["key"] != key:
        _default_replays["data"] = find_replays("", REPLAY_FORMATS[0])
        _default_replays["key"] = key
    return _default_replays["data"]


# Prefetch in the background after (re)start so the first /replays/ visitor
# doesn't wait on the ~80 MB download.
threading.Thread(target=get_default_replays, daemon=True).start()


@app.route("/tools/")
def tools_page():
    return render_template(
        "tools.html",
        selected_format=[DEFAULT_META, formatDisplayNames.get(DEFAULT_META, DEFAULT_META)],
        selected_rating="0",
        selected_pokemon="",
    )


@app.route("/replays/")
@app.route("/replays/<format_code>/")
def replays_page(format_code=None):
    chosen_format = format_code if format_code in REPLAY_FORMATS else REPLAY_FORMATS[0]
    return render_template(
        "replays.html",
        replay_formats=REPLAY_FORMATS,
        selected_replay_format=chosen_format,
        format_display_names=formatDisplayNames,
        selected_format=[DEFAULT_META, formatDisplayNames.get(DEFAULT_META, DEFAULT_META)],
        selected_rating="0",
        selected_pokemon="",
    )


# ─── VGCPastes Team Search ───────────────────────────────────────────────
def _vgcpastes_sprite(name):
    """Sprite for a sheet Pokémon name, falling back to the base form for
    mega forms missing from the sprite index (e.g. Floette-Eternal-Mega)."""
    sprite = get_pokemon_sprite(name)
    if sprite == (0, 0) and name.lower().endswith("-mega"):
        sprite = get_pokemon_sprite(name[:-5])
    return sprite


def _item_icon_sprite(item_name):
    """Item icon (row, col) on itemicons-sheet.png, or None if unknown."""
    key = re.sub(r"[^a-z0-9]+", "", (item_name or "").lower())
    spritenum = itemDetails.get(key, {}).get("spritenum")
    if not spritenum:
        return None
    return list(divmod(spritenum, 16))


# {normalized: display} of every Pokémon and item name, for fuzzy spelling
# correction in the team search (built once; the source data is static).
_vgcpastes_vocab_mem = None


def _vgcpastes_vocab():
    global _vgcpastes_vocab_mem
    if _vgcpastes_vocab_mem is None:
        vocab = {}
        for source in (pokedexEntries, itemDetails):
            for entry in source.values():
                name = entry.get("name", "")
                key = re.sub(r"[^a-z0-9]", "", name.lower())
                if key:
                    vocab[key] = name
        _vgcpastes_vocab_mem = vocab
    return _vgcpastes_vocab_mem


def _ordinal(n):
    """1 -> "1st", 22 -> "22nd", 111 -> "111th"."""
    if n % 100 in (11, 12, 13):
        return f"{n}th"
    return f"{n}{ {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th') }"


def _limitless_format_for_repo(repo_id):
    """Limitless format id for a teams repository's regulation, or None.

    Matches the repo's regulation token ("mb") against each available
    Limitless format's display name ("Regulation Set M-B"); only formats
    with cached team data qualify, so a retired regulation simply
    contributes nothing.
    """
    token = vgcpastes.REPOSITORIES.get(repo_id, {}).get("limitless_reg")
    if not token:
        return None
    for fid, disp in limitless_stats.get_available_formats().items():
        if _limitless_reg_token(fid, disp) == token:
            return fid
    return None


def _limitless_paste_text(entry):
    """Showdown-export text for a Limitless team, for the in-site viewer.

    Open teamsheets carry species/item/ability/tera/moves but no EVs or
    natures beyond what the API exposes; the text mirrors what pokepaste
    would serve so the existing client-side set parser renders it.
    """
    blocks = []
    for s in entry["team"]:
        lines = [s["pokemon"] + (f" @ {s['item']}" if s.get("item") else "")]
        if s.get("ability"):
            lines.append(f"Ability: {s['ability']}")
        if s.get("tera"):
            lines.append(f"Tera Type: {s['tera']}")
        if s.get("nature"):
            lines.append(f"{s['nature']} Nature")
        lines.extend(f"- {m}" for m in (s.get("moves") or []))
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


def _limitless_card(entry, index):
    """Reshape one Limitless team entry into the VGCPastes team dict shape
    so the teams API serializes both sources identically."""
    tournament = entry["tournament"] or {}
    date_iso = (tournament.get("date") or "")[:10]
    try:
        date_display = datetime.strptime(date_iso, "%Y-%m-%d").strftime("%d %b %Y")
    except ValueError:
        date_display = date_iso
    rank_bits = []
    if entry.get("placing"):
        rank = _ordinal(entry["placing"])
        if tournament.get("players"):
            rank += f" of {tournament['players']}"
        rank_bits.append(rank)
    record = entry.get("record") or {}
    if record.get("wins") is not None and record.get("losses") is not None:
        rec = f"{record['wins']}-{record['losses']}"
        if record.get("ties"):
            rec += f"-{record['ties']}"
        rank_bits.append(f"({rec})")
    return {
        "team_id": f"LL{index}",
        "source": "limitless",
        "description": tournament.get("name") or "Online Tournament",
        "player": entry.get("player", ""),
        "owner": "",
        "pokemon": [s["pokemon"] for s in entry["team"]],
        "items": [s.get("item") or "" for s in entry["team"]],
        "pokepaste": "",
        "has_evs": False,
        "code": "",
        "date": date_iso,
        "date_display": date_display,
        "event": "",
        "rank": " ".join(rank_bits),
        "source_link": (
            f"https://play.limitlesstcg.com/tournament/{tournament['id']}/standings"
            if tournament.get("id") else ""
        ),
        "report_link": "",
        "other_link": "",
        "paste_text": _limitless_paste_text(entry),
    }


def _limitless_slot_match(entry, terms):
    """True when all terms match one slot's search blob (Pokémon + item +
    ability + tera + nature + moves) — same slot scoping as the sheet
    search, just over the richer data open teamsheets carry."""
    return any(all(term in slot for term in terms) for slot in entry["search_slots"])


def _limitless_repo_entries(repo_id, query, player_query, match_any):
    """Limitless team entries for a repository's regulation, filtered
    with the teams-page search semantics: the Pokémon query matches team
    slots only, the player query the player/tournament-name metadata.
    [] when the repo's regulation has no Limitless format with data."""
    format_id = _limitless_format_for_repo(repo_id)
    if not format_id:
        return []
    player_terms = player_query.strip().lower().split()
    groups = [g.split() for g in query.strip().lower().split(",")]
    groups = [g for g in groups if g]
    checks = []
    if groups:
        vocab = _vgcpastes_vocab()
        vocab_keys = list(vocab.keys())
        checks = [
            (g, vgcpastes._fuzzy_correct_group(g, vocab, vocab_keys))
            for g in groups
        ]
    combine = any if match_any else all
    entries = []
    for entry in limitless_stats.get_all_teams(format_id, pokedexEntries):
        _ensure_team_search_index(entry)
        if player_terms and not all(t in entry["search_meta"] for t in player_terms):
            continue
        if checks and not combine(
            _limitless_slot_match(entry, g)
            or (c is not None and _limitless_slot_match(entry, c))
            for g, c in checks
        ):
            continue
        entries.append(entry)
    return entries


@app.route("/teams/")
@app.route("/teams/<repo_id>/")
def teams_page(repo_id=vgcpastes.DEFAULT_REPOSITORY):
    if repo_id not in vgcpastes.REPOSITORIES:
        return redirect(url_for("teams_page"))
    return render_template(
        "teams.html",
        repositories=vgcpastes.repository_list(),
        selected_repo=repo_id,
        selected_repo_name=vgcpastes.REPOSITORIES[repo_id]["display"],
        code_label=vgcpastes.REPOSITORIES[repo_id]["code_label"],
        vgcpastes_attribution=vgcpastes.ATTRIBUTION_TEXT,
        vgcpastes_attribution_url=vgcpastes.ATTRIBUTION_URL,
        vgcpastes_sheet_url=vgcpastes.SHEET_URL,
        selected_format=[DEFAULT_META, formatDisplayNames.get(DEFAULT_META, DEFAULT_META)],
        selected_rating="0",
        selected_pokemon="",
    )


def _vgcpastes_team_json(t):
    """Serialize one VGCPastes-shaped team dict for the teams-page JSON
    (sheet teams and reshaped Limitless teams share this shape)."""
    return {
        "team_id": t["team_id"],
        "description": t["description"],
        "player": t["player"],
        "owner": t["owner"],
        "pokemon": [
            {
                "name": name,
                "item": t["items"][i] if i < len(t["items"]) else "",
                "sprite": list(_vgcpastes_sprite(name)),
                "item_sprite": _item_icon_sprite(
                    t["items"][i] if i < len(t["items"]) else ""
                ),
            }
            for i, name in enumerate(t["pokemon"])
        ],
        "pokepaste": t["pokepaste"],
        "has_evs": t["has_evs"],
        "code": t["code"],
        "date": t["date"],
        "date_display": t["date_display"],
        "event": t["event"],
        "rank": t["rank"],
        "source_link": t["source_link"],
        "report_link": t["report_link"],
        "other_link": t["other_link"],
        "source": t.get("source", ""),
        "paste_text": t.get("paste_text", ""),
    }


@app.route("/teams/api/<repo_id>/")
def api_vgcpastes_teams(repo_id):
    """Search VGCPastes teams. `q` splits on commas into groups; within a
    group every term must match the same team slot (Pokémon + held item),
    so "kingambit focus sash, garchomp" finds a Kingambit holding a Focus
    Sash alongside a Garchomp. `player` searches the team metadata
    (player, event, rank, team ID) separately, so Pokémon searches never
    match player names. `mode=any` accepts teams matching any group
    instead of all groups. Newest teams first; paged via offset/limit."""
    if repo_id not in vgcpastes.REPOSITORIES:
        return jsonify({"error": "Unknown repository"}), 404
    query = request.args.get("q", "")
    limit = min(request.args.get("limit", type=int) or 60, 300)
    offset = max(request.args.get("offset", type=int) or 0, 0)
    sort = request.args.get("sort", "newest")
    if sort not in ("newest", "oldest", "random"):
        sort = "newest"
    teams, total = vgcpastes.search_teams(
        repo_id,
        query,
        player_query=request.args.get("player", ""),
        require_evs=request.args.get("evs") == "1",
        require_code=request.args.get("code") == "1",
        require_report=request.args.get("report") == "1",
        match_any=request.args.get("mode") == "any",
        vocab=_vgcpastes_vocab(),
        sort=sort,
        seed=request.args.get("seed", type=int),
    )
    return jsonify({
        "total": total,
        "offset": offset,
        "code_label": vgcpastes.REPOSITORIES[repo_id]["code_label"],
        "teams": [_vgcpastes_team_json(t) for t in teams[offset:offset + limit]],
    })


@app.route("/teams/api/<repo_id>/limitless/")
def api_vgcpastes_limitless(repo_id):
    """Archetype-grouped Limitless online-tournament teams for the teams
    page's collapsible section. Identical 6-Pokémon rosters pool into one
    archetype ranked by pooled Swiss points (the tournaments hub's Top
    Teams semantics); runs inside an archetype rank by their own points.
    `q`/`player`/`mode` reuse the page's search semantics; the page's
    newest/oldest/random sort deliberately does not apply here — the
    section always leads with the best-performing teams."""
    if repo_id not in vgcpastes.REPOSITORIES:
        return jsonify({"error": "Unknown repository"}), 404
    if _limitless_format_for_repo(repo_id) is None:
        return jsonify({"available": False, "total": 0, "archetypes": []})
    entries = _limitless_repo_entries(
        repo_id,
        request.args.get("q", ""),
        request.args.get("player", ""),
        request.args.get("mode") == "any",
    )
    archetypes = limitless_stats.group_team_archetypes(entries)
    result = []
    n = 0
    for group in archetypes[:50]:
        points = group["points"]
        players = []
        for e in group["players"][:30]:
            players.append(_vgcpastes_team_json(_limitless_card(e, n)))
            n += 1
        result.append({
            "pokemon": [
                {"name": name, "sprite": list(_vgcpastes_sprite(name))}
                for name in group["pokemon"]
            ],
            "count": group["count"],
            "points": int(points) if points == int(points) else points,
            "win_rate": group["win_rate"],
            "best_placing": group["best_placing"],
            "total_players": len(group["players"]),
            "players": players,
        })
    return jsonify({"available": True, "total": len(entries), "archetypes": result})


@app.route("/teams/api/<repo_id>/paste/<team_id>")
def api_vgcpastes_paste(repo_id, team_id):
    """Return the raw Showdown text of a team's Pokepaste for the in-site
    team viewer. Pastes are immutable and cached on disk after first fetch."""
    if repo_id not in vgcpastes.REPOSITORIES:
        return jsonify({"error": "Unknown repository"}), 404
    team = vgcpastes.get_team(repo_id, team_id)
    if team is None:
        return jsonify({"error": "Unknown team"}), 404
    text = vgcpastes.get_paste_text(team["pokepaste"])
    if text is None:
        return jsonify({"error": "Paste unavailable"}), 502
    return jsonify({"url": team["pokepaste"], "text": text})


@app.route("/replays/api/search")
def replay_search():
    filter_battleused = request.args.get("filter_battleused") == "true"
    filter_rating_enabled = request.args.get("filter_rating_enabled") == "true"
    filter_usage_score_enabled = request.args.get("filter_usage_score_enabled") == "true"
    filter_winner = request.args.get("filter_winner") == "true"
    filter_all_pokemon = request.args.get("filter_all_pokemon") == "true"

    pokemon_search = request.args.get("pokemon_search", "")
    filter_players = request.args.get("filter_players", "")
    filter_format = request.args.get("filter_format", REPLAY_FORMATS[0])
    filter_rating = request.args.get("filter_rating", "0")
    filter_usage_score = request.args.get("filter_usage_score", "0")

    filters = {
        "teamused": filter_battleused,
        "rating": 0,
        "winner": filter_winner,
        "filter_all_pokemon": filter_all_pokemon,
        "player_search": filter_players.split(",") if filter_players else [],
        "usage_score": 0,
    }

    if filter_rating_enabled and filter_rating.isnumeric():
        filters["rating"] = int(filter_rating)
    if filter_usage_score_enabled and filter_usage_score.isnumeric():
        filters["usage_score"] = int(filter_usage_score)

    poke_search = []
    for poke in pokemon_search.split(","):
        word = poke.strip().lower()
        if not word:
            continue
        matched = fuzzy_match(word, pokedexEntries.keys())
        if matched:
            poke_name = pokedexEntries[matched].get("name", "")
            if poke_name:
                poke_search.append(poke_name)

    top_replays = find_replays(poke_search, filter_format, filters=filters)
    return jsonify(top_replays)


@app.route("/replays/api/default")
def replay_default():
    return jsonify(get_default_replays())


@app.route("/replays/api/rankings")
def replay_rankings():
    format_name = request.args.get("format", REPLAY_FORMATS[0])
    limit = min(int(request.args.get("limit", 50)), 200)
    pokemon_search = request.args.get("pokemon_search", "")
    filter_all_pokemon = request.args.get("filter_all_pokemon", "true") == "true"

    poke_filter = []
    if pokemon_search.strip():
        for poke in pokemon_search.split(","):
            word = poke.strip().lower()
            if not word:
                continue
            matched = fuzzy_match(word, pokedexEntries.keys())
            if matched:
                poke_name = pokedexEntries[matched].get("name", "")
                if poke_name:
                    poke_filter.append(poke_name)

    results = stream_team_rankings(format_name, poke_filter or None, filter_all_pokemon, limit)
    return jsonify(results)


@app.route("/replays/watch/<replay_id>")
def watch_replay(replay_id):
    return render_template("watch.html", replay_id=replay_id)


# ─── Tournament Usage Integration ─────────────────────────────────────────

TOURNAMENT_DATA_DIR = os.path.join(DATA_DIRECTORY, "tournaments")
os.makedirs(TOURNAMENT_DATA_DIR, exist_ok=True)

_tournament_formats_cache = None


def get_tournament_formats():
    """Return set of normalized format codes that have tournament data."""
    global _tournament_formats_cache
    if _tournament_formats_cache is not None:
        return _tournament_formats_cache
    tournaments = load_tournament_list()
    _tournament_formats_cache = {
        normalize_format(t["format"])
        for t in tournaments
        if t.get("format")
    }
    return _tournament_formats_cache


def load_tournament_list():
    """Load tournament index, sorted newest first. Filters out tournaments with no team data."""
    index_path = os.path.join(TOURNAMENT_DATA_DIR, "tournaments_index.json")
    data = load_data_file(index_path)
    if not data:
        # Fallback: scan directories
        data = []
        if os.path.isdir(TOURNAMENT_DATA_DIR):
            for tid in os.listdir(TOURNAMENT_DATA_DIR):
                meta_path = os.path.join(TOURNAMENT_DATA_DIR, tid, "metadata.json")
                if os.path.exists(meta_path):
                    meta = load_data_file(meta_path)
                    if meta:
                        data.append(meta)
    # Only keep tournaments that have team data scraped
    tournaments = [t for t in data if t.get("teams_scraped", 0) > 0]
    tournaments.sort(key=lambda t: t.get("date", ""), reverse=True)
    return tournaments


def load_tournament_aggregated(tournament_id):
    """Load aggregated usage data for a tournament."""
    path = os.path.join(TOURNAMENT_DATA_DIR, tournament_id, "aggregated.json")
    return load_data_file(path) or {}


def load_tournament_players(tournament_id):
    """Load player data for a tournament."""
    path = os.path.join(TOURNAMENT_DATA_DIR, tournament_id, "players.json")
    return load_data_file(path) or []


# Day filters are hierarchical: top8 > top16 > day2 > day1
_DAY_HIERARCHY = {"top8": 4, "top16": 3, "day2": 2, "day1": 1}


def player_passes_day_filter(player, day_filter):
    """True when the player reached at least the filtered day/cut."""
    if day_filter == "all":
        return True
    required = _DAY_HIERARCHY.get(day_filter, 0)
    return _DAY_HIERARCHY.get(player.get("day_reached", "day1"), 1) >= required


def compute_official_win_rate(players, day_filter, pokemon_name):
    """Pooled final-record win rate of teams that used a Pokemon.

    Sums the final Swiss+cut records (RK9 stores no ties) of every
    player passing the day filter whose team includes the Pokemon.
    Returns a percentage, or None when no games are recorded.
    """
    target = pokemon_name.lower()
    wins = losses = 0
    for player in players:
        if not player.get("team"):
            continue
        if not player_passes_day_filter(player, day_filter):
            continue
        if target not in (s["pokemon"].lower() for s in player["team"]):
            continue
        record = player.get("record") or {}
        wins += record.get("wins", 0) or 0
        losses += record.get("losses", 0) or 0
    total = wins + losses
    if not total:
        return None
    return round(wins / total * 100, 1)


def build_move_tooltip(move_name):
    """Build tooltip text for a move from the move database."""
    move_key = re.sub(r"[^a-z0-9]+", "", move_name.lower())
    move_info = moveDetails.get(move_key, {})
    if not move_info:
        return move_name
    bp = move_info.get("basePower", "N/A")
    if bp == 0:
        bp = "N/A"
    acc = move_info.get("accuracy", "N/A")
    if acc is True:
        acc = "N/A"
    return (
        f"{move_info.get('type', '')} ({move_info.get('category', '')})\n"
        f"Base Power: {bp}\n"
        f"Accuracy: {acc}\n"
        f"Priority: {move_info.get('priority', 0)}\n"
        f"{move_info.get('desc', 'No info.')}"
    )


def _pre_mega_entry(pokemon_name, dex_entry):
    """The pokedex entry a Mega forme evolved from, or {} if not a Mega.

    Trims the name at "-Mega" rather than trusting baseSpecies, which points
    at the species (Meowstic-F-Mega -> "Meowstic", the male forme with
    Prankster) instead of the forme that actually Mega Evolved (Meowstic-F,
    with Competitive).
    """
    trimmed = re.split(r"-Mega\b", pokemon_name, 1)[0]
    if trimmed != pokemon_name:
        entry = pokedexEntries.get(re.sub(r"[^a-z0-9]+", "", trimmed.lower()))
        if entry:
            return entry
    base = dex_entry.get("baseSpecies") or ""
    return pokedexEntries.get(re.sub(r"[^a-z0-9]+", "", base.lower())) or {}


def _correct_tournament_counts(counts, category, pokemon_name):
    """Snap typo'd decklist ability/move names to the Pokémon's legal options
    and merge the corrected counts ("Tough Skin" folds into "Rough Skin").
    Abilities that still don't resolve to a legal one are dropped (a
    Mawile-Mega slot listing Inner Focus is a data-entry mixup, not usage)."""
    drop_illegal = False
    if category == "abilities":
        # A Mega slot's decklist can list either the battling forme's ability
        # (Huge Power) or the pre-Mega one it was entered with (Intimidate),
        # so both formes' abilities are legal.
        dex = pokedexEntries.get(re.sub(r"[^a-z0-9]+", "", pokemon_name.lower())) or {}
        pre_mega = _pre_mega_entry(pokemon_name, dex)
        legal = {
            re.sub(r"[^a-z0-9]+", "", n.lower()): n
            for entry in (dex, pre_mega)
            for n in (entry.get("abilities") or {}).values()
        }
        known = _known_names(abilityDetails)
        cutoff = 0.6
        drop_illegal = bool(legal)
    else:
        legal = _champions_learnable_moves(pokemon_name)
        known = _known_names(moveDetails)
        cutoff = 0.7
    merged = {}
    for name, count in counts.items():
        fixed = correct_scanned_name(name, legal, known, cutoff)
        if drop_illegal and re.sub(r"[^a-z0-9]+", "", fixed.lower()) not in legal:
            continue
        merged[fixed] = merged.get(fixed, 0) + count
    return merged


def compile_tournament_category(poke_data, category, total_count, pokemon_name=""):
    """Convert tournament aggregated counts into display lists."""
    data = poke_data.get(category, {})
    if pokemon_name and category in ("abilities", "moves"):
        data = _correct_tournament_counts(data, category, pokemon_name)
    total = max(total_count, 1)
    sorted_keys = sorted(data.keys(), key=lambda k: data[k], reverse=True)

    if category == "items":
        result = []
        for k in sorted_keys:
            item_key = re.sub(r"[^a-z0-9]+", "", k.lower())
            info = itemDetails.get(item_key, {"name": k, "desc": "No info.", "spritenum": 0})
            result.append([
                info.get("name", k),
                "{:.1f}".format(round(data[k] / total * 100, 1)),
                info.get("desc", "No info."),
                divmod(info.get("spritenum", 0), 16),
            ])
        return result

    if category == "abilities":
        result = []
        for k in sorted_keys:
            ability_key = re.sub(r"[^a-z0-9]+", "", k.lower())
            info = abilityDetails.get(ability_key, {"name": k, "desc": "No info."})
            result.append([
                info.get("name", k),
                "{:.1f}".format(round(data[k] / total * 100, 1)),
                info.get("desc", "No info."),
            ])
        return result

    if category == "moves":
        result = []
        for k in sorted_keys:
            move_key = re.sub(r"[^a-z0-9]+", "", k.lower())
            info = moveDetails.get(move_key, {"name": k})
            result.append([
                info.get("name", k),
                "{:.1f}".format(round(data[k] / total * 100, 1)),
                build_move_tooltip(k),
            ])
        return result

    if category == "tera_types":
        return [
            [k, "{:.1f}".format(round(data[k] / total * 100, 1))]
            for k in sorted_keys
        ]

    if category == "natures":
        nature_info = {
            "Adamant": "+Atk / -SpA", "Brave": "+Atk / -Spe",
            "Lonely": "+Atk / -Def", "Naughty": "+Atk / -SpD",
            "Bold": "+Def / -Atk", "Relaxed": "+Def / -Spe",
            "Impish": "+Def / -SpA", "Lax": "+Def / -SpD",
            "Modest": "+SpA / -Atk", "Quiet": "+SpA / -Spe",
            "Mild": "+SpA / -Def", "Rash": "+SpA / -SpD",
            "Calm": "+SpD / -Atk", "Sassy": "+SpD / -Spe",
            "Gentle": "+SpD / -Def", "Careful": "+SpD / -SpA",
            "Timid": "+Spe / -Atk", "Hasty": "+Spe / -Def",
            "Jolly": "+Spe / -SpA", "Naive": "+Spe / -SpD",
            "Hardy": "Neutral", "Docile": "Neutral",
            "Serious": "Neutral", "Bashful": "Neutral", "Quirky": "Neutral",
        }
        return [
            [k, "{:.1f}".format(round(data[k] / total * 100, 1)),
             nature_info.get(k, "")]
            for k in sorted_keys
        ]

    return [
        [k, "{:.1f}".format(round(data[k] / total * 100, 1))]
        for k in sorted_keys
    ]


def compile_tournament_teammates(poke_data, total_count):
    """Build teammates list with sprites from tournament data."""
    teammates = poke_data.get("teammates", {})
    total = max(total_count, 1)
    sorted_mates = sorted(teammates.keys(), key=lambda k: teammates[k], reverse=True)
    return [
        [
            name,
            "{:.1f}".format(round(teammates[name] / total * 100, 1)),
            get_pokemon_sprite(name),
        ]
        for name in sorted_mates
    ]


def _overview_with_sprites(overview):
    """Attach sprite-sheet coordinates to every overview row.

    Sprites are stored as lists so the dict is JSON-safe as-is (the
    overview rides along in both the page context and the hub API).
    """
    if not overview:
        return None
    for stage in overview["stages"]:
        for row in stage["rows"]:
            row["sprite"] = list(get_pokemon_sprite(row["name"]))
    for transition in overview["movers"]:
        for side in ("gains", "drops"):
            for row in transition[side]:
                row["sprite"] = list(get_pokemon_sprite(row["name"]))
    return overview


def compile_tournament_page_data(tournament_id="", day_filter="all", pokemon_name=""):
    """Compile all data needed for the tournament page."""
    tournaments = load_tournament_list()
    if not tournaments:
        return None

    # Resolve tournament
    chosen = None
    if tournament_id:
        chosen = next((t for t in tournaments if t["id"] == tournament_id), None)
    if not chosen:
        chosen = tournaments[0]

    # Load aggregated data
    agg = load_tournament_aggregated(chosen["id"])
    if not agg:
        return None

    # Get data for the selected day filter
    filter_data = agg.get(day_filter, agg.get("all", {}))
    pokemon_index = filter_data.get("pokemon", {})
    total_teams = filter_data.get("total_teams", 1)

    if not pokemon_index:
        return None

    # Sort Pokemon by usage
    sorted_pokemon = sorted(
        pokemon_index.keys(),
        key=lambda n: pokemon_index[n].get("usage_pct", 0),
        reverse=True,
    )

    # Resolve selected Pokemon
    selected_pokemon = sorted_pokemon[0] if sorted_pokemon else ""
    if pokemon_name:
        matched = fuzzy_match(pokemon_name, list(pokemon_index.keys()))
        if matched:
            selected_pokemon = matched

    if not selected_pokemon or selected_pokemon not in pokemon_index:
        return None

    poke_data = pokemon_index[selected_pokemon]
    usage_pct = poke_data.get("usage_pct", 0)
    usage_count = poke_data.get("usage_count", 0)
    rank = sorted_pokemon.index(selected_pokemon) + 1
    win_rate = compute_official_win_rate(
        load_tournament_players(chosen["id"]), day_filter, selected_pokemon
    )

    # Compile data lists
    moves_list = compile_tournament_category(poke_data, "moves", usage_count, selected_pokemon)
    items_list = compile_tournament_category(poke_data, "items", usage_count)
    abilities_list = compile_tournament_category(poke_data, "abilities", usage_count, selected_pokemon)
    tera_types_list = compile_tournament_category(poke_data, "tera_types", usage_count)
    natures_list = compile_tournament_category(poke_data, "natures", usage_count)
    teammates_list = compile_tournament_teammates(poke_data, usage_count)

    # Base stats and types from pokedex (pass dummy truthy dict so compile_top_data doesn't bail)
    base_stats = compile_top_data({"_": 1}, selected_pokemon, "Stats") if pokedexEntries else []
    pokemon_types = compile_top_data({"_": 1}, selected_pokemon, "Types") if pokedexEntries else []

    # Build pokemon list for sidebar
    pokemon_names = []
    for name in sorted_pokemon:
        pct = pokemon_index[name].get("usage_pct", 0)
        pokemon_names.append([
            name,
            "{:.1f}".format(pct),
            get_pokemon_sprite(name),
        ])

    # Per-stage usage overview (Day 1 / Day 2 / Top Cut with deltas and
    # biggest movers), shown in the right panel until a Pokemon is picked.
    overview = _overview_with_sprites(insights.official_stage_usage_report(agg))

    return {
        "tournaments": tournaments,
        "selected_tournament": chosen,
        "overview": overview,
        "day_filter": day_filter,
        "day_options": ["all", "day2", "top16", "top8"],
        "pokemon_names": pokemon_names,
        "selected_pokemon": selected_pokemon,
        "current_pokemon": [selected_pokemon, usage_pct, rank, get_pokemon_sprite(selected_pokemon)],
        "win_rate": "{:.1f}".format(win_rate) if win_rate is not None else "—",
        "base_stats": base_stats,
        "pokemon_types": pokemon_types,
        "moves_list": moves_list,
        "items_list": items_list,
        "abilities_list": abilities_list,
        "tera_types_list": tera_types_list,
        "natures_list": natures_list,
        "teammates_list": teammates_list,
        "total_teams": total_teams,
    }


_DAY_FILTER_LABELS = {"day2": "Day 2", "top16": "Top 16", "top8": "Top 8"}


def _hub_og_description(source, ctx, og_pokemon):
    """Link-preview description for the tournament hub (Discord/Twitter).

    Names the tournament/format and its team count; adds the selected
    Pokemon's stats when the link targets one, else the top usage pick.
    """
    teams = ctx.get("total_teams", 0)
    if source == "official":
        day = _DAY_FILTER_LABELS.get(ctx.get("day_filter", "all"))
        scope = f"{teams} {day} teams" if day else f"{teams} teams"
        head = f"{ctx['selected_tournament']['name']} — Pokemon usage stats from {scope}."
    elif source == "limitless_event":
        ev = ctx["selected_event"]
        players = ev.get("players") or 0
        played = f" ({players} players)" if players else ""
        head = f"{ev['name']}{played} — Pokemon usage stats from {teams} public teams."
    else:
        head = (
            f"{ctx['selected_format_name']} — online usage stats from {teams} teams "
            f"across {ctx['tournament_count']} Limitless tournaments "
            f"in the last {ctx['window_days']} days."
        )
    mon = ctx.get("current_pokemon")
    if not mon:
        return head
    name, pct, rank = mon[0], mon[1], mon[2]
    if og_pokemon:
        line = f" {name}: {pct:.1f}% usage (#{rank})"
        if ctx.get("win_rate") not in (None, "—"):
            line += f", {ctx['win_rate']}% win rate"
        return head + line + "."
    return head + f" Top pick: {name} ({pct:.1f}% of teams)."


def _render_tournament_hub(source, data, og_pokemon=""):
    """Render the merged tournament stats page for either data source.

    The sidebar always lists both official (RK9) tournaments and Limitless
    online formats, whichever source is currently selected. `og_pokemon`
    marks that the URL targets a specific Pokemon, which switches the
    link preview to that Pokemon's stats and sprite.
    """
    ctx = dict(data)
    if source == "official":
        ctx["official_tournaments"] = ctx.pop("tournaments")
        # Cheap: disk-cached formats + tournament list, {} on failure
        ctx["limitless_formats"] = [
            [code, disp]
            for code, disp in limitless_stats.get_available_formats().items()
        ]
    else:
        ctx["limitless_formats"] = ctx.pop("formats")
        ctx["official_tournaments"] = load_tournament_list()
    og = {"og_description": _hub_og_description(source, ctx, og_pokemon)}
    if og_pokemon and ctx.get("selected_pokemon"):
        mon = ctx["selected_pokemon"]
        if source == "official":
            card_url = url_for(
                "og_card_tournament",
                tournament_id=ctx["selected_tournament"]["id"],
                day_filter=ctx.get("day_filter", "all"),
                pokemon_name=mon, v=OG_CARD_REV, _external=True,
            )
        elif source == "limitless_event":
            card_url = url_for(
                "og_card_limitless_event",
                event_id=ctx["selected_event"]["id"], pokemon_name=mon,
                cut=ctx.get("cut") if ctx.get("cut") not in (None, "all") else None,
                v=OG_CARD_REV, _external=True,
            )
        else:
            card_url = url_for(
                "og_card_limitless",
                format_id=ctx["selected_format_id"], segment=ctx.get("segment", ""),
                pokemon_name=mon,
                cut=ctx.get("cut") if ctx.get("cut") not in (None, "all") else None,
                v=OG_CARD_REV, _external=True,
            )
        og["og_image"] = card_url
        og["og_card"] = "summary_large_image"
    return render_template(
        "tournaments.html",
        source=source,
        # No Pokemon in the URL: the right panel opens on the
        # tournament-level view (overview/events) instead of the
        # defaulted top-usage Pokemon.
        pokemon_requested=bool(og_pokemon),
        limitless_attribution=limitless_stats.ATTRIBUTION_TEXT,
        limitless_attribution_url=limitless_stats.ATTRIBUTION_URL,
        selected_format=[DEFAULT_META, formatDisplayNames.get(DEFAULT_META, DEFAULT_META)],
        selected_rating="0",
        **og,
        **ctx,
    )


def _render_tournament_hub_empty():
    return render_template(
        "tournaments.html",
        no_data=True,
        source="official",
        selected_pokemon="",
        selected_format=[DEFAULT_META, formatDisplayNames.get(DEFAULT_META, DEFAULT_META)],
        selected_rating="0",
    )


@app.route("/tournaments/")
@app.route("/tournaments/<tournament_id>/")
@app.route("/tournaments/<tournament_id>/<day_filter>/")
@app.route("/tournaments/<tournament_id>/<day_filter>/<pokemon_name>")
def tournaments_page(tournament_id="", day_filter="all", pokemon_name=""):
    data = compile_tournament_page_data(tournament_id, day_filter, pokemon_name)
    if data is not None:
        return _render_tournament_hub("official", data, og_pokemon=pokemon_name)
    # No official data scraped: fall back to the online (Limitless) source
    ldata = compile_limitless_page_data()
    if ldata is not None:
        return _render_tournament_hub("limitless", ldata)
    return _render_tournament_hub_empty()


def _hub_json(data):
    """Convert a hub page-data dict's sprite tuples for JSON serialization."""
    result = dict(data)
    result["current_pokemon"] = list(result["current_pokemon"])
    result["current_pokemon"][3] = list(result["current_pokemon"][3])
    result["pokemon_names"] = [
        [p[0], p[1], list(p[2])] for p in result["pokemon_names"]
    ]
    result["teammates_list"] = [
        [t[0], t[1], list(t[2])] for t in result["teammates_list"]
    ]
    result["items_list"] = [
        [i[0], i[1], i[2], list(i[3])] if len(i) > 3 else i
        for i in result["items_list"]
    ]
    return result


@app.route("/tournaments/api/<tournament_id>/<day_filter>/")
@app.route("/tournaments/api/<tournament_id>/<day_filter>/<pokemon_name>")
def api_tournament_data(tournament_id, day_filter="all", pokemon_name=""):
    data = compile_tournament_page_data(tournament_id, day_filter, pokemon_name)
    if data is None:
        return jsonify({"error": "No data found"}), 404
    return jsonify(_hub_json(data))


@app.route("/tournaments/api/<tournament_id>/teams/<pokemon_name>")
def api_tournament_teams(tournament_id, pokemon_name):
    """Return teams that used a given Pokemon, sorted by placement."""
    players = load_tournament_players(tournament_id)
    day_filter = request.args.get("day", "all")

    matching_teams = []
    for player in players:
        if not player.get("team"):
            continue
        if not player_passes_day_filter(player, day_filter):
            continue
        day = player.get("day_reached", "day1")

        team_names = [slot["pokemon"] for slot in player["team"]]
        matched = pokemon_name.lower() in [n.lower() for n in team_names]
        if matched:
            matching_teams.append({
                "player": player["name"],
                "placement": player["placement"],
                "record": player.get("record", {}),
                "day_reached": day,
                "team": [
                    {
                        "pokemon": s["pokemon"],
                        "sprite": list(get_pokemon_sprite(s["pokemon"])),
                        "item": s.get("item", ""),
                        "item_sprite": _item_icon_sprite(s.get("item", "")),
                        "ability": s.get("ability", ""),
                        "tera_type": s.get("tera_type", ""),
                        "nature": s.get("nature", ""),
                        "moves": s.get("moves", []),
                    }
                    for s in player["team"]
                ],
            })

    matching_teams.sort(key=lambda t: t["placement"])
    return jsonify(matching_teams[:50])


@app.route("/tournaments/api/<tournament_id>/standings")
def api_tournament_standings(tournament_id):
    """Return player standings for a tournament, filtered by day."""
    players = load_tournament_players(tournament_id)
    day_filter = request.args.get("day", "all")

    standings = []
    for player in players:
        if not player.get("team"):
            continue
        if not player_passes_day_filter(player, day_filter):
            continue
        day = player.get("day_reached", "day1")

        team_sprites = []
        for slot in player["team"]:
            sp = get_pokemon_sprite(slot["pokemon"])
            team_sprites.append({
                "pokemon": slot["pokemon"],
                "sprite": list(sp),
                "item": slot.get("item", ""),
                "ability": slot.get("ability", ""),
                "tera_type": slot.get("tera_type", ""),
                "nature": slot.get("nature", ""),
                "moves": slot.get("moves", []),
            })

        standings.append({
            "placement": player["placement"],
            "name": player["name"],
            "record": player.get("record", {}),
            "day_reached": day,
            "team": team_sprites,
        })

    standings.sort(key=lambda s: s["placement"])
    return jsonify(standings)


@app.route("/tournaments/api/<tournament_id>/results/")
def api_tournament_results(tournament_id):
    """Return an official event's team archetypes, filtered by day.

    Players are reshaped into Limitless-style entries (placing/tera
    slot keys, empty tournament meta) so the shared grouping and
    serialization helpers apply. `q` uses the teams-page comma-group
    search syntax.
    """
    players = load_tournament_players(tournament_id)
    day_filter = request.args.get("day", "all")

    teams = []
    for player in players:
        if not player.get("team"):
            continue
        if not player_passes_day_filter(player, day_filter):
            continue
        teams.append({
            "player": player["name"],
            "placing": player["placement"],
            "record": player.get("record", {}) or {},
            "tournament": {},
            "team": [
                {
                    "pokemon": s["pokemon"],
                    "item": s.get("item", ""),
                    "ability": s.get("ability", ""),
                    "tera": s.get("tera_type", ""),
                    "nature": s.get("nature", ""),
                    "moves": s.get("moves", []),
                }
                for s in player["team"]
            ],
        })

    query = request.args.get("q", "").strip().lower()
    return jsonify(_archetype_results_json(teams, query))


# ─── Limitless Online Tournament Usage Stats ─────────────────────────────
# Aggregated usage from Limitless online VGC tournaments (attribution in
# the template). Data is fetched lazily and cached by limitless_stats.

# Placement cuts offered on the Limitless sources. Online events carry no
# day-2 information, so top-placement cuts stand in for the official
# events' day filters.
LIMITLESS_CUTS = ("32", "16", "8")


def _parse_limitless_cut(value):
    """Normalize a ?cut= value to (cut, max_placing); invalid -> ("all", None)."""
    if value in LIMITLESS_CUTS:
        return value, int(value)
    return "all", None


def _compile_limitless_pokemon_context(pokemon_index, total_teams, pokemon_name):
    """Pokemon selection + display lists shared by format and event pages.

    Mirrors the selection logic of compile_tournament_page_data, but the
    win rate comes precomputed from the Limitless aggregate.
    """
    if not pokemon_index:
        return None

    sorted_pokemon = sorted(
        pokemon_index.keys(),
        key=lambda n: pokemon_index[n].get("usage_pct", 0),
        reverse=True,
    )

    selected_pokemon = sorted_pokemon[0]
    if pokemon_name:
        matched = fuzzy_match(pokemon_name, list(pokemon_index.keys()))
        if matched:
            selected_pokemon = matched

    poke_data = pokemon_index[selected_pokemon]
    usage_pct = poke_data.get("usage_pct", 0)
    usage_count = poke_data.get("usage_count", 0)
    rank = sorted_pokemon.index(selected_pokemon) + 1
    win_rate = poke_data.get("win_rate")

    return {
        "pokemon_names": [
            [
                name,
                "{:.1f}".format(pokemon_index[name].get("usage_pct", 0)),
                get_pokemon_sprite(name),
            ]
            for name in sorted_pokemon
        ],
        "selected_pokemon": selected_pokemon,
        "current_pokemon": [selected_pokemon, usage_pct, rank, get_pokemon_sprite(selected_pokemon)],
        "win_rate": "{:.1f}".format(win_rate) if win_rate is not None else "—",
        "base_stats": compile_top_data({"_": 1}, selected_pokemon, "Stats") if pokedexEntries else [],
        "pokemon_types": compile_top_data({"_": 1}, selected_pokemon, "Types") if pokedexEntries else [],
        "moves_list": compile_tournament_category(poke_data, "moves", usage_count, selected_pokemon),
        "items_list": compile_tournament_category(poke_data, "items", usage_count),
        "abilities_list": compile_tournament_category(poke_data, "abilities", usage_count, selected_pokemon),
        "tera_types_list": compile_tournament_category(poke_data, "tera_types", usage_count),
        "natures_list": compile_tournament_category(poke_data, "natures", usage_count),
        "teammates_list": compile_tournament_teammates(poke_data, usage_count),
        "total_teams": total_teams,
    }


def compile_limitless_page_data(format_id="", segment="", pokemon_name="", cut="all"):
    """Compile all data needed for the Limitless usage stats page."""
    # Offer only formats that currently have eligible tournaments; dead
    # regulations (or deep links to them) fall back to the newest one.
    formats = limitless_stats.get_available_formats()
    if not formats:
        return None
    if format_id not in formats:
        format_id = next(iter(formats))

    bundle = limitless_stats.build_limitless_aggregate(format_id, pokedexEntries)
    if not bundle:
        return None

    # Segments are tournament-size tiers ("25", "50", ...); default to
    # the smallest, which always exists when the bundle does.
    segments = bundle.get("segments", {})
    segment_options = sorted(segments, key=int)
    if not segment_options:
        return None
    if segment not in segments:
        segment = segment_options[0]
    filter_data = segments.get(segment, {})

    # A placement cut narrows the aggregate to each tournament's top
    # finishers; an empty cut falls back to the full field.
    cut, max_placing = _parse_limitless_cut(cut)
    if max_placing is not None:
        cut_data = limitless_stats.build_limitless_cut_aggregate(
            format_id, pokedexEntries, int(segment), max_placing
        )
        if cut_data and cut_data.get("pokemon"):
            filter_data = cut_data
        else:
            cut = "all"

    ctx = _compile_limitless_pokemon_context(
        filter_data.get("pokemon", {}),
        filter_data.get("total_teams", 1),
        pokemon_name,
    )
    if ctx is None:
        return None

    ctx.update({
        "formats": [[code, disp] for code, disp in formats.items()],
        "selected_format_id": format_id,
        "selected_format_name": formats.get(format_id, format_id),
        "segment": segment,
        "segment_options": segment_options,
        "cut": cut,
        "tournament_count": len([
            t for t in bundle.get("tournaments", [])
            if (t.get("players") or 0) >= int(segment)
        ]),
        "included_tournaments": bundle.get("tournaments", []),
        "window_days": limitless_stats.WINDOW_DAYS,
        "min_players": int(segment),
        "attribution": limitless_stats.ATTRIBUTION_TEXT,
        "attribution_url": limitless_stats.ATTRIBUTION_URL,
    })
    return ctx


def compile_limitless_event_page_data(tournament_id, pokemon_name="", cut="all"):
    """Compile page data for a single Limitless online tournament."""
    bundle = limitless_stats.get_event_bundle(tournament_id, pokedexEntries)
    if not bundle:
        return None

    agg = bundle["aggregate"]
    cut, max_placing = _parse_limitless_cut(cut)
    if max_placing is not None:
        cut_agg = limitless_stats.get_event_cut_aggregate(
            tournament_id, pokedexEntries, max_placing
        )
        if cut_agg and cut_agg.get("pokemon"):
            agg = cut_agg
        else:
            cut = "all"

    ctx = _compile_limitless_pokemon_context(
        agg.get("pokemon", {}),
        agg.get("total_teams", 1),
        pokemon_name,
    )
    if ctx is None:
        return None

    # Parent format drives the sidebar highlight and the "All Events"
    # back-navigation; fall back to the newest format when the event's
    # regulation is unknown or has no browsable data.
    formats = limitless_stats.get_available_formats()
    parent_format = bundle["format_id"]
    if parent_format not in formats:
        parent_format = next(iter(formats)) if formats else ""

    # Per-cut usage overview — the online counterpart of the official
    # Day 1/Day 2/Top Cut stages (events carry no day-2 information).
    # Cut aggregates are memoized on the event's LRU bundle.
    stage_list = [("All Teams", bundle["aggregate"])]
    for placing, label in ((16, "Top 16"), (8, "Top 8")):
        stage_list.append((label, limitless_stats.get_event_cut_aggregate(
            tournament_id, pokedexEntries, placing
        )))
    overview = _overview_with_sprites(insights.stage_usage_report(stage_list))

    ctx.update({
        "formats": [[code, disp] for code, disp in formats.items()],
        "selected_format_id": parent_format,
        "selected_format_name": formats.get(parent_format, parent_format),
        "selected_event": bundle["meta"],
        "overview": overview,
        "cut": cut,
        "attribution": limitless_stats.ATTRIBUTION_TEXT,
        "attribution_url": limitless_stats.ATTRIBUTION_URL,
    })
    return ctx


@app.route("/limitless/")
@app.route("/limitless/<format_id>/")
@app.route("/limitless/<format_id>/<segment>/")
@app.route("/limitless/<format_id>/<segment>/<pokemon_name>")
def limitless_page(format_id="", segment="", pokemon_name=""):
    """Deep links to Limitless stats open the merged tournaments page."""
    data = compile_limitless_page_data(
        format_id, segment, pokemon_name, request.args.get("cut", "all")
    )
    if data is not None:
        return _render_tournament_hub("limitless", data, og_pokemon=pokemon_name)
    # Limitless data unavailable: fall back to the official source
    odata = compile_tournament_page_data()
    if odata is not None:
        return _render_tournament_hub("official", odata)
    return _render_tournament_hub_empty()


@app.route("/limitless/api/<format_id>/<segment>/")
@app.route("/limitless/api/<format_id>/<segment>/<pokemon_name>")
def api_limitless_data(format_id, segment="", pokemon_name=""):
    data = compile_limitless_page_data(
        format_id, segment, pokemon_name, request.args.get("cut", "all")
    )
    if data is None:
        return jsonify({"error": "No data found"}), 404
    return jsonify(_hub_json(data))


@app.route("/limitless/event/<tournament_id>/")
@app.route("/limitless/event/<tournament_id>/<pokemon_name>")
def limitless_event_page(tournament_id, pokemon_name=""):
    """Deep links to a single online tournament's stats."""
    data = compile_limitless_event_page_data(
        tournament_id, pokemon_name, request.args.get("cut", "all")
    )
    if data is not None:
        return _render_tournament_hub("limitless_event", data, og_pokemon=pokemon_name)
    # Unknown/uncached event: fall back to the regular source chain
    return limitless_page()


@app.route("/limitless/api/event/<tournament_id>/")
@app.route("/limitless/api/event/<tournament_id>/<pokemon_name>")
def api_limitless_event_data(tournament_id, pokemon_name=""):
    data = compile_limitless_event_page_data(
        tournament_id, pokemon_name, request.args.get("cut", "all")
    )
    if data is None:
        return jsonify({"error": "No data found"}), 404
    return jsonify(_hub_json(data))


@app.route("/limitless/api/event/<tournament_id>/teams/<pokemon_name>")
def api_limitless_event_teams(tournament_id, pokemon_name):
    """Return one event's teams using a Pokemon, sorted by placing.

    `cut` restricts to top placements (8/16/32).
    """
    bundle = limitless_stats.get_event_bundle(tournament_id, pokedexEntries)
    if not bundle:
        return jsonify([])
    _, max_placing = _parse_limitless_cut(request.args.get("cut"))
    target = pokemon_name.lower()
    matching = [
        e for e in bundle["teams"]
        if (max_placing is None or (e["placing"] or 9999) <= max_placing)
        and target in (s["pokemon"].lower() for s in e["team"])
    ]
    return jsonify([_limitless_team_entry(e) for e in matching[:50]])


@app.route("/limitless/api/event/<tournament_id>/standings")
def api_limitless_event_standings(tournament_id):
    """Return one event's standings (players with public decklists).

    `cut` restricts to top placements (8/16/32).
    """
    bundle = limitless_stats.get_event_bundle(tournament_id, pokedexEntries)
    if not bundle:
        return jsonify([])
    _, max_placing = _parse_limitless_cut(request.args.get("cut"))
    teams = bundle["teams"]
    if max_placing is not None:
        teams = [e for e in teams if (e["placing"] or 9999) <= max_placing]
    return jsonify([_limitless_team_entry(e) for e in teams])


@app.route("/limitless/api/event/<tournament_id>/results/")
def api_limitless_event_results(tournament_id):
    """Return one event's team archetypes (identical 6 grouped).

    `cut` restricts to top placements (8/16/32); `q` uses the
    teams-page comma-group search syntax.
    """
    bundle = limitless_stats.get_event_bundle(tournament_id, pokedexEntries)
    if not bundle:
        return jsonify([])
    _, max_placing = _parse_limitless_cut(request.args.get("cut"))
    teams = bundle["teams"]
    if max_placing is not None:
        teams = [e for e in teams if (e["placing"] or 9999) <= max_placing]
    query = request.args.get("q", "").strip().lower()
    return jsonify(_archetype_results_json(teams, query))


def _limitless_team_entry(entry):
    """Serialize one Limitless team entry for the JSON endpoints."""
    return {
        "player": entry["player"],
        "placing": entry["placing"],
        "record": entry["record"],
        "tournament": entry["tournament"],
        "team": [
            {
                "pokemon": s["pokemon"],
                "sprite": list(get_pokemon_sprite(s["pokemon"])),
                "item": s["item"],
                "item_sprite": _item_icon_sprite(s["item"]),
                "ability": s["ability"],
                "tera_type": s["tera"],
                "nature": s["nature"],
                "moves": s["moves"],
            }
            for s in entry["team"]
        ],
    }


@app.route("/limitless/api/<format_id>/teams/<pokemon_name>")
def api_limitless_teams(format_id, pokemon_name):
    """Return the best-performing teams using a Pokemon across all events.

    `min` filters by tournament size (player count) and `cut` by
    placement (top 8/16/32); teams are ranked by Swiss points (an 11-3
    run outranks a 4-1) rather than placing.
    """
    if format_id not in limitless_stats.get_available_formats():
        return jsonify([])
    min_players = request.args.get("min", type=int) or 0
    _, max_placing = _parse_limitless_cut(request.args.get("cut"))
    teams = limitless_stats.get_all_teams(format_id, pokedexEntries)
    target = pokemon_name.lower()
    matching = [
        e for e in teams
        if (e["tournament"].get("players") or 0) >= min_players
        and (max_placing is None or (e["placing"] or 9999) <= max_placing)
        and target in (s["pokemon"].lower() for s in e["team"])
    ]
    matching.sort(key=lambda e: (
        -limitless_stats.record_points(e["record"]),
        e["placing"] or 9999,
        -(e["tournament"].get("players") or 0),
    ))
    return jsonify([_limitless_team_entry(e) for e in matching[:50]])


def _limitless_group_matches(entry, terms):
    """True if all terms of one comma-group match the same team slot
    (Pokemon + item + ability + tera + nature + moves), or all match
    the player/tournament metadata.

    Same slot-scoping as vgcpastes._group_matches: "kingambit focus
    sash" means a Kingambit *holding* a Focus Sash, not any Focus Sash
    on the team.
    """
    for slot in entry["search_slots"]:
        if all(term in slot for term in terms):
            return True
    return all(term in entry["search_meta"] for term in terms)


def _ensure_team_search_index(entry):
    """Backfill search_slots/search_meta on entries that lack them.

    Format-level Limitless teams precompute these; single-event bundles
    and reshaped RK9 players are small enough to index per request.
    """
    if "search_slots" not in entry:
        entry["search_slots"] = [
            " ".join(filter(None, [
                s["pokemon"], s.get("item"), s.get("ability"),
                s.get("tera"), s.get("nature"), *(s.get("moves") or []),
            ])).lower()
            for s in entry["team"]
        ]
        entry["search_meta"] = " ".join(filter(None, [
            entry.get("player"), (entry.get("tournament") or {}).get("name"),
        ])).lower()
    return entry


def _archetype_results_json(teams, query):
    """Filter, group and serialize team entries for a Top Teams view.

    Teams are Limitless-shaped entries (placing/record/tournament/team).
    The query uses the teams-page comma-group syntax; it filters the
    underlying teams before grouping, so counts reflect matching teams.
    """
    if query:
        groups = [g.split() for g in query.split(",")]
        groups = [g for g in groups if g]
        if groups:
            teams = [
                e for e in teams
                if all(
                    _limitless_group_matches(_ensure_team_search_index(e), g)
                    for g in groups
                )
            ]
    archetypes = limitless_stats.group_team_archetypes(teams)

    result = []
    for group in archetypes[:50]:
        points = group["points"]
        result.append({
            "pokemon": [
                {"name": name, "sprite": list(get_pokemon_sprite(name))}
                for name in group["pokemon"]
            ],
            "count": group["count"],
            "points": int(points) if points == int(points) else points,
            "win_rate": group["win_rate"],
            "best_placing": group["best_placing"],
            "total_players": len(group["players"]),
            "players": [_limitless_team_entry(e) for e in group["players"][:30]],
        })
    return result


@app.route("/limitless/api/<format_id>/results/")
def api_limitless_results(format_id):
    """Return team archetypes (identical 6 Pokemon grouped), most-used first.

    The optional search uses the teams-page comma-group syntax: groups
    split on commas, every term in a group must match the same team
    slot (or the player/tournament metadata), and teams must satisfy
    all groups. It filters the underlying teams before grouping, so
    counts reflect matching teams. `min` filters by tournament size
    (player count) and `cut` by placement (top 8/16/32).
    """
    if format_id not in limitless_stats.get_available_formats():
        return jsonify([])
    min_players = request.args.get("min", type=int) or 0
    _, max_placing = _parse_limitless_cut(request.args.get("cut"))
    teams = limitless_stats.get_all_teams(format_id, pokedexEntries)
    if min_players:
        teams = [e for e in teams if (e["tournament"].get("players") or 0) >= min_players]
    if max_placing is not None:
        teams = [e for e in teams if (e["placing"] or 9999) <= max_placing]
    query = request.args.get("q", "").strip().lower()
    return jsonify(_archetype_results_json(teams, query))


# ─── Meta Insights ────────────────────────────────────────────────────────
# Cross-source analysis reports (tournament win rate vs usage, ladder vs
# tournament usage gaps, month-over-month trend movers) built by insights.py
# from data the other pages already load — no extra fetching or caching.


def _ladder_format_for_limitless(format_id):
    """Map a Limitless format id to its Showdown ladder format code, or None.

    Inverse of limitless_format_for over the current month's formats.
    Prefers the plain (non-BO3) ladder: it has by far the larger sample
    and its trend history reaches further back.
    """
    candidates = [
        code for code, _ in availableFormats
        if limitless_format_for(code) == format_id
    ]
    if not candidates:
        return None
    candidates.sort(key=lambda c: (c.endswith("bo3"), c))
    return candidates[0]


def _og_sprite_url(name):
    """Showdown gen5 sprite URL for a Pokemon, for link-preview thumbnails.

    PS sprite filenames are toID(baseSpecies)-toID(forme) for formes and
    toID(name) otherwise ("Urshifu-Rapid-Strike" -> urshifu-rapidstrike,
    "Chien-Pao" -> chienpao). Unknown names return None: the preview
    then simply has no thumbnail.
    """
    entry = pokedexEntries.get(re.sub(r"[^a-z0-9]+", "", name.lower()))
    if not entry:
        return None

    def to_id(s):
        return re.sub(r"[^a-z0-9]+", "", s.lower())

    if entry.get("forme") and entry.get("baseSpecies"):
        sprite_id = f"{to_id(entry['baseSpecies'])}-{to_id(entry['forme'])}"
    else:
        sprite_id = to_id(entry.get("name", name))
    return f"https://play.pokemonshowdown.com/sprites/gen5/{sprite_id}.png"


# OG stat cards: generated on demand, small LRUs keep the dyno RAM-safe
# (~150KB per card PNG, ~10KB per cached sprite).
# OG_CARD_REV is appended to og:image URLs (?v=): Discord caches embed
# images per URL, so bump it whenever card rendering changes materially.
OG_CARD_REV = 2
_og_card_mem = OrderedDict()
OG_CARD_MEM_MAX = 24
_og_sprite_png_mem = OrderedDict()
OG_SPRITE_PNG_MEM_MAX = 64


def _fetch_sprite_png(name):
    """Raw PNG bytes of a Pokemon's card art: Showdown gen5 sprite, falling
    back to the local pokemonicons sheet for mons the gen5 set lacks
    (Champions-only Megas etc.). Failures are cached as b"" so a dead CDN
    can't stall every card render."""
    cached = _og_sprite_png_mem.get(name)
    if cached is not None:
        _og_sprite_png_mem.move_to_end(name)
        return cached or None
    data = b""
    url = _og_sprite_url(name)
    if url:
        try:
            resp = requests.get(
                url, timeout=4,
                headers={"User-Agent": "MunchStats link-preview card generator"},
            )
            if resp.ok and resp.headers.get("Content-Type", "").startswith("image"):
                data = resp.content
        except requests.RequestException:
            pass
    if not data:
        row, col = get_pokemon_sprite(name)
        if (row, col) != (0, 0):
            data = og_card.icon_from_sheet(
                os.path.join("static", "pokemonicons-sheet.png"), row, col
            ) or b""
    _og_sprite_png_mem[name] = data
    while len(_og_sprite_png_mem) > OG_SPRITE_PNG_MEM_MAX:
        _og_sprite_png_mem.popitem(last=False)
    return data or None


def _og_card_facts(format_code, rating_threshold, pokemon_name, month):
    """Light-weight stats lookup for an OG card. Strict (no format/rating
    fallbacks): card URLs are built from already-resolved page params."""
    index_data = fetch_index_data(format_code, rating_threshold, month)
    if not index_data or not index_data.get("pokemon"):
        return None
    pokemon_index = index_data["pokemon"]
    matched = fuzzy_match(pokemon_name, pokemon_index.keys())
    if not matched:
        return None
    poke_data = fetch_pokemon_data(format_code, rating_threshold, matched, month)
    if not poke_data:
        return None
    sorted_pokemon = sorted(
        pokemon_index.keys(), key=lambda n: pokemon_index[n]["usage"], reverse=True
    )
    moves = [
        (m[0], m[1])
        for m in compile_top_data(poke_data, matched, "Moves", format_code)[:4]
    ]
    items = compile_top_data(poke_data, matched, "Items")
    abilities = compile_top_data(poke_data, matched, "Abilities", format_code)
    return {
        "name": matched,
        "format_name": formatDisplayNames.get(format_code, format_code),
        "month": month,
        "usage_percent": round(pokemon_index[matched].get("usage", 0) * 100, 2),
        "rank": sorted_pokemon.index(matched) + 1,
        "total": len(sorted_pokemon),
        "types": compile_top_data(poke_data, matched, "Types"),
        "moves": moves,
        "item": (items[0][0], items[0][1]) if items and items[0][0] != "Nothing" else None,
        "ability": (abilities[0][0], abilities[0][1]) if abilities else None,
        "sprite_png": _fetch_sprite_png(matched),
    }


def _serve_og_card(key, facts_fn):
    """LRU-cached PNG response for a card; 404 when facts are unavailable."""
    png = _og_card_mem.get(key)
    if png is None:
        facts = facts_fn()
        if facts is None:
            return "Not found", 404
        png = og_card.render_card(facts)
        _og_card_mem[key] = png
        while len(_og_card_mem) > OG_CARD_MEM_MAX:
            _og_card_mem.popitem(last=False)
    else:
        _og_card_mem.move_to_end(key)
    return Response(
        png, mimetype="image/png",
        headers={"Cache-Control": "public, max-age=21600"},
    )


def _ctx_card_facts(ctx, format_name):
    """Map a compiled page-data dict (tournament hub / champions page --
    they share key names) onto og_card facts."""
    if not ctx or not ctx.get("current_pokemon"):
        return None
    mon = ctx["current_pokemon"]
    name = ctx.get("selected_pokemon") or mon[0]

    def top_pair(lst):
        if lst and lst[0] and lst[0][0] and lst[0][0] != "Nothing":
            return (lst[0][0], lst[0][1])
        return None

    rank = mon[2] if len(mon) > 2 and isinstance(mon[2], int) else None
    win_rate = ctx.get("win_rate")
    return {
        "name": name,
        "format_name": format_name,
        "usage_percent": mon[1] if len(mon) > 1 else None,
        "rank": rank,
        "total": len(ctx.get("pokemon_names") or []) or None,
        "win_rate": win_rate if win_rate not in (None, "", "—") else None,
        "types": ctx.get("pokemon_types") or [],
        "moves": [(m[0], m[1]) for m in (ctx.get("moves_list") or [])[:4]],
        "item": top_pair(ctx.get("items_list")),
        "ability": top_pair(ctx.get("abilities_list")),
        "sprite_png": _fetch_sprite_png(name),
    }


@app.route("/og-card/<format_code>/<rating_threshold>/<pokemon_name>.png")
def og_card_png(format_code, rating_threshold, pokemon_name):
    """Link-preview stat card, referenced by og:image on Pokemon deep links."""
    month = request.args.get("month") or get_latest_month()
    key = (format_code, rating_threshold, pokemon_name, month)
    return _serve_og_card(
        key, lambda: _og_card_facts(format_code, rating_threshold, pokemon_name, month)
    )


@app.route("/og-card/tournaments/<tournament_id>/<day_filter>/<pokemon_name>.png")
def og_card_tournament(tournament_id, day_filter, pokemon_name):
    def facts():
        ctx = compile_tournament_page_data(tournament_id, day_filter, pokemon_name)
        if not ctx:
            return None
        label = _DAY_FILTER_LABELS.get(ctx.get("day_filter", "all"))
        sub = ctx["selected_tournament"]["name"] + (f"  ·  {label}" if label else "")
        return _ctx_card_facts(ctx, sub)

    return _serve_og_card(("t", tournament_id, day_filter, pokemon_name), facts)


@app.route("/og-card/limitless/<format_id>/<segment>/<pokemon_name>.png")
def og_card_limitless(format_id, segment, pokemon_name):
    cut = request.args.get("cut", "all")

    def facts():
        ctx = compile_limitless_page_data(format_id, segment, pokemon_name, cut)
        if not ctx:
            return None
        sub = ctx["selected_format_name"] + " (Online)"
        if ctx.get("cut") and ctx["cut"] != "all":
            sub += f"  ·  Top {ctx['cut']}"
        return _ctx_card_facts(ctx, sub)

    return _serve_og_card(("l", format_id, segment, pokemon_name, cut), facts)


@app.route("/og-card/limitless-event/<event_id>/<pokemon_name>.png")
def og_card_limitless_event(event_id, pokemon_name):
    cut = request.args.get("cut", "all")

    def facts():
        ctx = compile_limitless_event_page_data(event_id, pokemon_name, cut)
        if not ctx:
            return None
        sub = ctx["selected_event"]["name"]
        if ctx.get("cut") and ctx["cut"] != "all":
            sub += f"  ·  Top {ctx['cut']}"
        return _ctx_card_facts(ctx, sub)

    return _serve_og_card(("e", event_id, pokemon_name, cut), facts)


@app.route("/og-card/champions/<fmt>/<pokemon_name>.png")
def og_card_champions(fmt, pokemon_name):
    def facts():
        format_code = CHAMPIONS_SLUG_TO_FORMAT.get(fmt.lower())
        if not format_code:
            return None
        ctx = compile_champions_page_data(format_code, pokemon_name)
        if not ctx:
            return None
        return _ctx_card_facts(ctx, ctx["selected_format"][1])

    return _serve_og_card(("c", fmt.lower(), pokemon_name), facts)


def _dex_base_species(name):
    """A name's pokedex baseSpecies ("Floette-Eternal" -> "Floette").

    Falls back to the name itself for base species and unknown names.
    """
    entry = pokedexEntries.get(re.sub(r"[^a-z0-9]+", "", name.lower()))
    if not entry:
        return name
    return entry.get("baseSpecies") or entry.get("name") or name


def _core_search_query(*names):
    """Slot-scoped team-results query matching the given (form) names.

    Mega forms exist in decklists only as base name + stone, so
    "Charizard-Mega-Y" becomes the group "Charizard Charizardite Y" —
    the same semantics the Teams search uses for held items. The base
    term is the pokedex baseSpecies so it substring-matches every
    decklist spelling of the holder.
    """
    groups = []
    for name in names:
        stone = _mega_required_items.get(name.lower())
        groups.append(f"{_dex_base_species(name)} {stone}" if stone else name)
    return ", ".join(groups)


# Momentum/cores reports iterate every cached team (tens of thousands of
# pair accumulations), too much per request; memoized per format/segment
# on the identity of the teams list, which limitless_stats swaps out
# whenever the underlying tournament set changes.
_team_reports_mem = OrderedDict()
TEAM_REPORTS_MEM_MAX = 8


def _insights_team_reports(format_id, segment):
    """Return (momentum, core stats) for a format/segment, memoized.

    Core stats hold the qualified rows for every core size; per-request
    sorting stays cheap while the expensive combination expansion runs
    only when the underlying tournament set changes.
    """
    teams = limitless_stats.get_all_teams(format_id, pokedexEntries)
    if not teams:
        return None, None
    key = (format_id, segment)
    memo = _team_reports_mem.get(key)
    if memo and memo["teams"] is teams:
        _team_reports_mem.move_to_end(key)
        return memo["momentum"], memo["core_stats"]

    # Slot names arrive form-resolved from limitless_stats (Mega stones
    # make Charizard-Mega-Y its own name), so no slot_name override.
    min_players = int(segment)
    seg_teams = [
        e for e in teams
        if (e["tournament"].get("players") or 0) >= min_players
    ]
    momentum = insights.tournament_momentum_report(
        seg_teams, limitless_stats.WINDOW_DAYS
    )
    core_stats = insights.core_stats(seg_teams)
    _team_reports_mem[key] = {
        "teams": teams, "momentum": momentum, "core_stats": core_stats,
    }
    while len(_team_reports_mem) > TEAM_REPORTS_MEM_MAX:
        _team_reports_mem.popitem(last=False)
    return momentum, core_stats


def compile_insights_page_data(format_id="", segment="", rating="",
                               core_size="", core_sort="", cut=""):
    """Compile all data for the meta insights page, or None when no data."""
    formats = limitless_stats.get_available_formats()
    if not formats:
        return None
    if format_id not in formats:
        format_id = next(iter(formats))

    bundle = limitless_stats.build_limitless_aggregate(format_id, pokedexEntries)
    if not bundle:
        return None
    segments = bundle.get("segments", {})
    segment_options = sorted(segments, key=int)
    if not segment_options:
        return None
    if segment not in segments:
        segment = segment_options[0]
    seg_data = segments[segment]
    pokemon_stats = seg_data.get("pokemon", {})

    momentum, core_stats = _insights_team_reports(format_id, segment)

    # Prefer the teams pass's form-resolved per-Pokemon stats (Mega
    # stones make Charizard-Mega-Y its own row); fall back to the
    # base-name aggregate if the teams list is ever unavailable.
    form_stats = core_stats.get("solo_stats") if core_stats else None
    performance = insights.performance_report(form_stats or pokemon_stats)

    # Usage-share movers from all entrants to each event's top-X
    # finishers, mirroring the tournament overview's Biggest Movers.
    if cut not in LIMITLESS_CUTS:
        cut = "16"
    cut_movers = None
    cut_data = limitless_stats.build_limitless_cut_aggregate(
        format_id, pokedexEntries, int(segment), int(cut)
    )
    if cut_data and cut_data.get("pokemon"):
        cut_movers = insights.limitless_cut_movers(
            seg_data, cut_data, f"All teams → Top {cut}"
        )

    cores = None
    if core_stats:
        if core_size not in [str(s) for s in insights.CORE_SIZES]:
            core_size = str(insights.CORE_SIZES[0])
        if core_sort not in insights.CORE_SORTS:
            core_sort = insights.CORE_SORTS[0]
        cores = {
            "rows": insights.sort_cores(
                core_stats["sizes"].get(int(core_size), []), core_sort
            ),
            "size": core_size,
            "size_options": [str(s) for s in insights.CORE_SIZES],
            "sort": core_sort,
            "min_games": core_stats["min_games"],
            "min_teams": core_stats["min_teams"],
            "min_top_usage": core_stats["min_top_usage"],
        }

    # The ladder-side reports need the matching Showdown ladder format;
    # both use the same rating cutoff (defaulting to the highest, whose
    # players are closest in skill to tournament entrants).
    ladder_format = _ladder_format_for_limitless(format_id)
    divergence = None
    trend = None
    rating_options = []
    if ladder_format:
        rating_options = get_valid_rating_thresholds(ladder_format)
        if rating_options:
            if rating not in rating_options:
                rating = rating_options[-1]
            ladder_index = fetch_index_data(ladder_format, rating)
            ladder_pokemon = (ladder_index or {}).get("pokemon") or {}
            if ladder_pokemon:
                # Both sources list Mega formes separately (the ladder
                # natively, the tournament side resolved from held
                # stones), so they join per-form with no collapsing.
                divergence = insights.divergence_report(
                    ladder_pokemon, form_stats or pokemon_stats
                )
            trend = insights.trend_report(load_trend_data(ladder_format, rating))

    if not (performance or momentum or cores or divergence or trend):
        return None

    # Decorate every report row with its sprite-sheet coordinates.
    for report, keys in (
        (performance, ("over", "under")),
        (momentum, ("rising", "falling")),
        (divergence, ("tournament_favored", "ladder_favored")),
        (trend, ("rising", "falling")),
        (cut_movers, ("gains", "drops")),
    ):
        for key in keys if report else ():
            for row in report.get(key) or []:
                row["sprite"] = get_pokemon_sprite(row["name"])
    for row in cores["rows"] if cores else ():
        row["sprites"] = [get_pokemon_sprite(n) for n in row["names"]]
        row["label"] = " + ".join(row["names"])
        # Deep link into the Team Results search for this exact core.
        row["query"] = _core_search_query(*row["names"])

    ladder_display = formatDisplayNames.get(ladder_format, ladder_format) if ladder_format else ""
    tab_format = ladder_format or DEFAULT_META
    return {
        "formats": [[code, disp] for code, disp in formats.items()],
        "selected_format_id": format_id,
        "selected_format_name": formats.get(format_id, format_id),
        "segment": segment,
        "segment_options": segment_options,
        "rating": rating if rating_options else "",
        "rating_options": rating_options,
        "ladder_format": ladder_format or "",
        "ladder_format_name": ladder_display,
        "latest_month": get_latest_month(),
        "performance": performance,
        "momentum": momentum,
        "cores": cores,
        "divergence": divergence,
        "trend": trend,
        "cut_movers": cut_movers,
        "cut": cut,
        "cut_options": list(LIMITLESS_CUTS),
        "cut_min_usage": insights.MIN_MOVER_USAGE,
        "total_teams": seg_data.get("total_teams", 0),
        "tournament_count": len([
            t for t in bundle.get("tournaments", [])
            if (t.get("players") or 0) >= int(segment)
        ]),
        "window_days": limitless_stats.WINDOW_DAYS,
        "min_players": int(segment),
        "attribution": limitless_stats.ATTRIBUTION_TEXT,
        "attribution_url": limitless_stats.ATTRIBUTION_URL,
        # Tab-bar links shared with every page template.
        "selected_format": [tab_format, formatDisplayNames.get(tab_format, tab_format)],
        "selected_rating": rating or "0",
        "selected_pokemon": "",
    }


@app.route("/insights/")
@app.route("/insights/<format_id>/")
def insights_page(format_id=""):
    """Meta insight reports for a VGC regulation.

    Query params: ?min= tournament-size tier, ?rating= ladder cutoff,
    ?cores= core size (2-6), ?sort= core sort (wr/usage/lift),
    ?cut= top-cut size (8/16/32).
    """
    data = compile_insights_page_data(
        format_id,
        request.args.get("min", ""),
        request.args.get("rating", ""),
        request.args.get("cores", ""),
        request.args.get("sort", ""),
        request.args.get("cut", ""),
    )
    if data is None:
        return render_template(
            "insights.html",
            no_data=True,
            selected_format=[DEFAULT_META, formatDisplayNames.get(DEFAULT_META, DEFAULT_META)],
            selected_rating="0",
            selected_pokemon="",
        )
    return render_template("insights.html", **data)


# ─── Pokemon Detail Page: Tournament & Replay Integration ────────────────


def _top_teams_source_format(format_code):
    """Resolve the page format to the format used for Top Teams lookups.

    The Champions in-game Doubles ladder plays the current VGC regulation,
    so its page shows the current reg's tournament teams. In-game Singles
    has no tournament scene.
    """
    if format_code in CHAMPIONS_GAME_FORMATS:
        return normalize_format(DEFAULT_META) if format_code == "championsdoubles" else None
    return format_code


def _limitless_reg_token(format_id, display_name):
    """Regulation token ("ma", "i") identifying a Limitless format."""
    m = re.search(
        r"regulation\s+(?:set\s+)?([a-z\-]+)\s*$", (display_name or "").lower()
    )
    token = m.group(1) if m else format_id
    return re.sub(r"[^a-z0-9]", "", token.lower())


def limitless_format_for(format_code):
    """Map a usage-page VGC format code to its Limitless format id, or None.

    Matches the page's reg suffix (gen9championsvgc2026regmb -> "mb")
    against each Limitless format's regulation ("Regulation Set M-B").
    Non-VGC formats (BSS, Smogon tiers) have no Limitless counterpart.
    """
    code = normalize_format(format_code or "")
    if "vgc" not in code:
        return None
    m = re.search(r"reg([a-z0-9]+)$", code)
    if not m:
        return None
    token = m.group(1)
    for fid, disp in limitless_stats.get_vgc_formats().items():
        if _limitless_reg_token(fid, disp) == token:
            return fid
    return None


def has_top_teams_data(format_code):
    """True when the Top Teams section has RK9 or Limitless teams to show."""
    source = _top_teams_source_format(format_code)
    if not source:
        return False
    if normalize_format(source) in get_tournament_formats():
        return True
    return limitless_format_for(source) in limitless_stats.get_available_formats()


@app.route("/api/pokemon-teams/<format_code>/<pokemon_name>")
def api_pokemon_tournament_teams(format_code, pokemon_name):
    """Return top tournament teams that used a given Pokemon.

    Merges RK9 majors with Limitless online events, ranked by Swiss
    points, then tournament size, then placement — a deep run at a big
    event outranks a short one at a small event.
    """
    source_format = _top_teams_source_format(format_code)
    if not source_format:
        return jsonify([])

    base_name = get_base_pokemon_name(pokemon_name)
    poke_lower = base_name.lower()
    required_item = _mega_required_items.get(pokemon_name.lower(), "").lower()

    all_teams = []

    tournaments = load_tournament_list()
    matching = [
        t for t in tournaments
        if t.get("format") and tournament_format_matches(t["format"], source_format)
    ][:5]
    for tourney in matching:
        players = load_tournament_players(tourney["id"])
        for player in players:
            if not player.get("team"):
                continue
            # Slots carry form-resolved names (Charizard-Mega-Y), so match
            # on base species; the required-item check below then narrows
            # a Mega page to its own stone.
            matched_slot = None
            for slot in player["team"]:
                if get_base_pokemon_name(slot["pokemon"]).lower() == poke_lower:
                    matched_slot = slot
                    break
            if not matched_slot:
                continue
            # If viewing a Mega/Primal, verify the held item matches
            if required_item and matched_slot.get("item", "").lower() != required_item:
                continue
            record = player.get("record", {}) or {}
            all_teams.append({
                "player": player["name"],
                "placement": player["placement"],
                "record": record,
                "day_reached": player.get("day_reached", "day1"),
                "tournament_name": tourney["name"],
                "tournament_date": tourney.get("date", ""),
                "tournament_id": tourney["id"],
                "tournament_players": tourney.get("total_players", 0),
                "points": limitless_stats.record_points(record),
                "source": "rk9",
                "team": [
                    {
                        "pokemon": s["pokemon"],
                        "sprite": list(get_pokemon_sprite(s["pokemon"])),
                        "item": s.get("item", ""),
                        "item_sprite": _item_icon_sprite(s.get("item", "")),
                        "ability": s.get("ability", ""),
                        "tera_type": s.get("tera_type", ""),
                        "nature": s.get("nature", ""),
                        "moves": s.get("moves", []),
                    }
                    for s in player["team"]
                ],
            })

    lformat = limitless_format_for(source_format)
    if lformat and lformat in limitless_stats.get_available_formats():
        for e in limitless_stats.get_all_teams(lformat, pokedexEntries):
            # Limitless slots carry form-resolved names (Charizard-Mega-Y),
            # so match on base species; the required-item check then
            # narrows a Mega page to its own stone.
            matched_slot = None
            for slot in e["team"]:
                if get_base_pokemon_name(slot["pokemon"]).lower() == poke_lower:
                    matched_slot = slot
                    break
            if not matched_slot:
                continue
            if required_item and (matched_slot.get("item") or "").lower() != required_item:
                continue
            entry = _limitless_team_entry(e)
            record = e.get("record") or {}
            all_teams.append({
                "player": entry["player"],
                "placement": entry["placing"],
                "record": record,
                "day_reached": "day1",
                "tournament_name": e["tournament"].get("name", ""),
                "tournament_date": e["tournament"].get("date", ""),
                "tournament_id": e["tournament"].get("id", ""),
                "tournament_players": e["tournament"].get("players") or 0,
                "points": limitless_stats.record_points(record),
                "source": "limitless",
                "team": entry["team"],
            })

    all_teams.sort(key=lambda t: (
        -t["points"],
        -(t["tournament_players"] or 0),
        t["placement"] or 9999,
    ))
    return jsonify(all_teams[:12])


@app.route("/api/pokemon-replays/<format_code>/<pokemon_name>")
def api_pokemon_replays(format_code, pokemon_name):
    """Return recent high-level replays featuring a given Pokemon."""
    if format_code not in REPLAY_FORMATS:
        return jsonify([])
    search_name = get_base_pokemon_name(pokemon_name)
    replays = find_replays([search_name], format_code, replay_total=10)
    return jsonify(replays)


# ─── eBay Merch API ──────────────────────────────────────────────────────

EBAY_CLIENT_ID = os.environ.get("EBAY_CLIENT_ID", "")
EBAY_CLIENT_SECRET = os.environ.get("EBAY_CLIENT_SECRET", "")

_ebay_token_cache = {"token": None, "expires": 0}
_ebay_merch_cache = {}
MERCH_CACHE_TTL = 86400  # 24 hours for genuine results
MERCH_FAIL_CACHE_TTL = 600  # 10 minutes when the lookup failed (rate limit, timeout, etc.)


def get_ebay_oauth_token():
    """Get an eBay OAuth application token, cached until expiry."""
    if _ebay_token_cache["token"] and time.time() < _ebay_token_cache["expires"]:
        return _ebay_token_cache["token"]

    if not EBAY_CLIENT_ID or not EBAY_CLIENT_SECRET:
        app.logger.warning("eBay merch: EBAY_CLIENT_ID/SECRET not set in environment")
        return None

    credentials = base64.b64encode(
        f"{EBAY_CLIENT_ID}:{EBAY_CLIENT_SECRET}".encode()
    ).decode()

    try:
        resp = requests.post(
            "https://api.ebay.com/identity/v1/oauth2/token",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {credentials}",
            },
            data={
                "grant_type": "client_credentials",
                "scope": "https://api.ebay.com/oauth/api_scope",
            },
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            _ebay_token_cache["token"] = data["access_token"]
            _ebay_token_cache["expires"] = time.time() + data.get("expires_in", 7200) - 60
            return _ebay_token_cache["token"]
        app.logger.warning(
            "eBay merch: OAuth token request failed (status %s): %s",
            resp.status_code, resp.text[:300],
        )
    except Exception as exc:
        app.logger.warning("eBay merch: OAuth token request errored: %r", exc)
    return None


@app.route("/api/merch/<pokemon_name>")
def api_merch(pokemon_name):
    """Return eBay listings for a Pokemon, cached for 24 hours."""
    cache_key = pokemon_name.lower()
    cached = _ebay_merch_cache.get(cache_key)
    if cached and time.time() < cached["expires"]:
        return jsonify(cached["data"])

    token = get_ebay_oauth_token()
    if not token:
        # Token failure is transient — don't return an empty list that the
        # client would show as "No merch found" without caching a retry window.
        return jsonify([])

    categories = [
        ("plush", f"{pokemon_name} Pokemon plush"),
        ("card", f"{pokemon_name} Pokemon card"),
        ("figure", f"{pokemon_name} Pokemon figure"),
        ("merch", f"{pokemon_name} Pokemon"),
    ]

    # Collect results per category, then interleave. Track whether at least
    # one category call actually reached eBay successfully — an all-failure
    # run (rate limit, timeout, 5xx) must not be cached like a genuine empty.
    per_category = {cat: [] for cat, _ in categories}
    any_success = False
    for category, query in categories:
        try:
            resp = requests.get(
                "https://api.ebay.com/buy/browse/v1/item_summary/search",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
                    "X-EBAY-C-ENDUSERCTX": "affiliateCampaignId=5339155159",
                },
                params={"q": query, "limit": 2},
                timeout=10,
            )
            if resp.status_code == 200:
                any_success = True
                data = resp.json()
                for item in data.get("itemSummaries", []):
                    image = item.get("image", {}).get("imageUrl", "")
                    price_obj = item.get("price", {})
                    price = price_obj.get("value", "")
                    currency = price_obj.get("currency", "USD")
                    per_category[category].append({
                        "title": item.get("title", ""),
                        "price": price,
                        "currency": currency,
                        "image": image,
                        "url": item.get("itemAffiliateWebUrl") or item.get("itemWebUrl", ""),
                        "category": category,
                    })
            else:
                app.logger.warning(
                    "eBay merch: search '%s' failed (status %s): %s",
                    query, resp.status_code, resp.text[:300],
                )
        except Exception as exc:
            app.logger.warning("eBay merch: search '%s' errored: %r", query, exc)
            continue

    # Interleave: [plush1, card1, figure1, merch1, plush2, card2, figure2, merch2]
    listings = []
    max_per_cat = max((len(v) for v in per_category.values()), default=0)
    cat_keys = [cat for cat, _ in categories]
    for i in range(max_per_cat):
        for cat in cat_keys:
            if i < len(per_category[cat]):
                listings.append(per_category[cat][i])

    now = time.time()
    # Sweep expired entries so crawler-invented names can't grow this forever.
    for key in [k for k, v in _ebay_merch_cache.items() if now >= v["expires"]]:
        del _ebay_merch_cache[key]
    # Cache genuine results (including a real empty from a successful call) for
    # 24h. If every eBay call failed, cache the empty list only briefly so a
    # transient outage doesn't freeze "No merch found" for a full day.
    ttl = MERCH_CACHE_TTL if (listings or any_success) else MERCH_FAIL_CACHE_TTL
    _ebay_merch_cache[cache_key] = {"data": listings, "expires": now + ttl}
    return jsonify(listings)


# ─── Contact Form ────────────────────────────────────────────────────────

TURNSTILE_SITE_KEY = os.environ.get("TURNSTILE_SITE_KEY", "")
TURNSTILE_SECRET_KEY = os.environ.get("TURNSTILE_SECRET_KEY", "")
# Gmail account used both as SMTP login and as the recipient. The visitor's
# optional address only ever goes in Reply-To, never From (DMARC).
CONTACT_EMAIL_ADDRESS = os.environ.get("CONTACT_EMAIL_ADDRESS", "")
CONTACT_EMAIL_APP_PASSWORD = os.environ.get("CONTACT_EMAIL_APP_PASSWORD", "")

CONTACT_CATEGORIES = ["bug", "feature", "improvement", "translation", "other"]
CONTACT_MAX_MESSAGE_LEN = 5000
CONTACT_MIN_MESSAGE_LEN = 10

# Per-IP submission timestamps, size-bounded (single worker, no Redis).
_contact_rate = OrderedDict()
_CONTACT_RATE_MAX_IPS = 1000
_CONTACT_RATE_LIMIT = 3        # submissions...
_CONTACT_RATE_WINDOW = 3600    # ...per hour per IP


def contact_form_enabled():
    return bool(
        TURNSTILE_SITE_KEY
        and TURNSTILE_SECRET_KEY
        and CONTACT_EMAIL_ADDRESS
        and CONTACT_EMAIL_APP_PASSWORD
    )


def _contact_client_ip():
    # Heroku router appends the client IP to X-Forwarded-For.
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.remote_addr or "unknown"


def _contact_rate_limited(ip):
    now = time.time()
    times = [t for t in _contact_rate.get(ip, []) if now - t < _CONTACT_RATE_WINDOW]
    if len(times) >= _CONTACT_RATE_LIMIT:
        _contact_rate[ip] = times
        return True
    times.append(now)
    _contact_rate[ip] = times
    _contact_rate.move_to_end(ip)
    while len(_contact_rate) > _CONTACT_RATE_MAX_IPS:
        _contact_rate.popitem(last=False)
    return False


def _verify_turnstile(token, ip):
    if not token:
        return False
    try:
        resp = requests.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={
                "secret": TURNSTILE_SECRET_KEY,
                "response": token,
                "remoteip": ip,
            },
            timeout=10,
        )
        return resp.status_code == 200 and resp.json().get("success", False)
    except Exception:
        return False


def _send_contact_email(category, message, reply_email, page, ip, lang="en"):
    msg = EmailMessage()
    msg["From"] = CONTACT_EMAIL_ADDRESS
    msg["To"] = CONTACT_EMAIL_ADDRESS
    msg["Subject"] = f"[MunchStats] {category.capitalize()} report"
    if reply_email:
        msg["Reply-To"] = reply_email
    body_lines = [
        f"Category: {category}",
        f"Reply email: {reply_email or '(none)'}",
        f"Page: {page or '(not given)'}",
        f"IP: {ip}",
        f"Language: {lang}",
        "",
        message,
    ]
    msg.set_content("\n".join(body_lines))
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=15) as smtp:
        smtp.starttls()
        smtp.login(CONTACT_EMAIL_ADDRESS, CONTACT_EMAIL_APP_PASSWORD)
        smtp.send_message(msg)


@app.route("/contact/", methods=["GET", "POST"])
def contact_page():
    ctx = {
        "enabled": contact_form_enabled(),
        "site_key": TURNSTILE_SITE_KEY,
        "categories": CONTACT_CATEGORIES,
        "sent": False,
        "error": None,
        "form": {"category": "bug", "message": "", "email": "", "page": ""},
    }
    if request.method == "GET" or not ctx["enabled"]:
        return render_template("contact.html", **ctx)

    form = {
        "category": request.form.get("category", "other"),
        "message": request.form.get("message", "").strip(),
        "email": request.form.get("email", "").strip(),
        "page": request.form.get("page", "").strip(),
    }
    if form["category"] not in CONTACT_CATEGORIES:
        form["category"] = "other"
    ctx["form"] = form

    # Honeypot: bots fill the hidden field; pretend it worked.
    if request.form.get("website", ""):
        ctx["sent"] = True
        return render_template("contact.html", **ctx)

    if len(form["message"]) < CONTACT_MIN_MESSAGE_LEN:
        ctx["error"] = gettext("Please write a few more details in the message.")
        return render_template("contact.html", **ctx)
    if form["email"] and (
        len(form["email"]) > 200 or not re.match(r"[^@\s]+@[^@\s]+\.[^@\s]+$", form["email"])
    ):
        ctx["error"] = gettext("That email address doesn't look valid.")
        return render_template("contact.html", **ctx)

    ip = _contact_client_ip()
    if _contact_rate_limited(ip):
        ctx["error"] = gettext("Too many messages from this connection. Please try again later.")
        return render_template("contact.html", **ctx)

    if not _verify_turnstile(request.form.get("cf-turnstile-response", ""), ip):
        ctx["error"] = gettext("Captcha verification failed. Please try again.")
        return render_template("contact.html", **ctx)

    try:
        _send_contact_email(
            form["category"],
            form["message"][:CONTACT_MAX_MESSAGE_LEN],
            form["email"],
            form["page"][:300],
            ip,
            lang=str(get_locale()),
        )
    except Exception:
        ctx["error"] = gettext("Something went wrong sending your message. Please try again later.")
        return render_template("contact.html", **ctx)

    ctx["sent"] = True
    ctx["form"] = {"category": "bug", "message": "", "email": "", "page": ""}
    return render_template("contact.html", **ctx)


# ─── Error Handlers & Index ──────────────────────────────────────────────


@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


@app.errorhandler(500)
def internal_server_error(e):
    return render_template("500.html"), 500


@app.route("/", methods=["GET"])
def index():
    return display_pokemon_page(DEFAULT_META)


if __name__ == "__main__":
    app.run(debug=True)
