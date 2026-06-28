import base64
import difflib
import gzip
import json
import math
import os
import re
import time
from datetime import datetime
from functools import lru_cache

import ijson
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, render_template, request, url_for
import pyjson5

load_dotenv()

app = Flask(__name__)

# Directory and global data definitions
DATA_DIRECTORY = "stats"
os.makedirs(DATA_DIRECTORY, exist_ok=True)

DEFAULT_META = "gen9championsvgc2026regmabo3"
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
    "gen9championsvgc2026regmbbo3",
    "gen9championsvgc2026regmb",
    "gen9championsvgc2026regmabo3",
    "gen9championsvgc2026regma",
    "gen9championsou",
    "gen9championsbssregma",
    "gen9vgc2026regibo3",
    "gen9vgc2026regi",
    "gen9nationaldex",
    "gen9ou",
    "gen9nationaldexubers",
    "gen9anythinggoes",
    "gen9doublesou",
    "gen9ubers",
    "gen9nationaldexdoubles",
]


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


@lru_cache(maxsize=4)
def fetch_remote_format_data(month, format_code, rating):
    """Fetch a full format JSON from Smogon and return its data dict. Cached."""
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
                if href.endswith(".json") and ".gz" not in href:
                    # Parse "gen9ou-0.json" -> format_code="gen9ou", rating="0"
                    name = href.rsplit(".", 1)[0]
                    parts = name.rsplit("-", 1)
                    if len(parts) == 2 and parts[1].isdigit():
                        fmt, rat = parts
                        formats.setdefault(fmt, []).append(rat)
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


def fetch_pokemon_data(format_code, rating, pokemon_name, month=None):
    """Load individual Pokémon data. Returns the Pokémon's data dict."""
    if month is None:
        month = get_latest_month()
    # Try local first
    if is_local_month(month):
        file_path = os.path.join(DATA_DIRECTORY, month, format_code, str(rating), f"{pokemon_name}.json")
        data = load_data_file(file_path)
        if data:
            return data
    # Fall back to remote (the full format is already cached by fetch_remote_format_data)
    remote_data = fetch_remote_format_data(month, format_code, str(rating))
    if remote_data and "data" in remote_data:
        return remote_data["data"].get(pokemon_name, {})
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
    return champions + others


def is_champions_format(format_code):
    """Check if a format code is a Champions format."""
    return "champions" in format_code.lower()


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
    # Fall back further if default isn't in this month either
    if chosen_format not in month_format_codes and month_formats:
        chosen_format = month_formats[0][0]
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
        "month_formats": month_formats,
        "trend_months": trend_months,
        "trend_usage": trend_usage,
        "show_trend": sum(1 for v in trend_usage if v is not None and v > 0) >= 2,
        "has_tournament_data": normalize_format(chosen_format) in get_tournament_formats(),
        "has_replay_data": chosen_format in REPLAY_FORMATS,
        "is_transformed": is_transformed_pokemon(default_pokemon),
    }


@app.route("/calc/")
@app.route("/calc/<format_code>/")
@app.route("/calc/<format_code>/<rating_threshold>/")
def calc_page(format_code="", rating_threshold=""):
    month = request.args.get("month", None)
    data = compile_page_data(format_code or DEFAULT_META, rating_threshold, "", month)
    if data is None:
        return redirect(url_for("calc_page", format_code=DEFAULT_META, rating_threshold="0"))

    calc_format_ratings = {
        fmt[0]: get_valid_rating_thresholds(fmt[0], data["selected_month"])
        for fmt in data["month_formats"]
    }
    return render_template(
        "index.html",
        **data,
        availableFormats=data["month_formats"],
        calc_only=True,
        calc_format_ratings=calc_format_ratings,
    )


@app.route("/<format_code>/<rating_threshold>/<pokemon_name>")
@app.route("/<format_code>/<rating_threshold>/")
@app.route("/<format_code>/")
def display_pokemon_page(format_code, rating_threshold="", pokemon_name=""):
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

    return render_template("index.html", **data, availableFormats=data["month_formats"])


def _filter_forme_order(forme_order_raw, base_stats, pokemon_index_lower, champions=False):
    """Keep forms that have usage data OR different base stats from the base form.
    Exclude Illegal-tier forms (unreleased) unless in Champions format."""
    result = []
    for f in forme_order_raw:
        if f.lower() in pokemon_index_lower:
            result.append(f)
            continue
        dex_key = f.lower().replace(" ", "").replace("-", "")
        entry = pokedexEntries.get(dex_key, {})
        if not entry:
            continue
        if not champions and entry.get("tier") == "Illegal":
            continue
        form_stats = entry.get("baseStats")
        if form_stats and form_stats != base_stats:
            result.append(f)
    return result


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

    # Battle-only forms (e.g. Aegislash-Blade) may not have usage data.
    # Fall back to pokedex data so the calc still works with correct base stats.
    if not matched_pokemon or is_different_form:
        dex_key = exact_dex_key if exact_dex_key in pokedexEntries else None
        if not dex_key:
            if not matched_pokemon:
                return None
            # Fall through to normal path if the name just isn't in the pokedex
        else:
            dex_entry = pokedexEntries[dex_key]
            display_name = dex_entry.get("name", pokemon_name)
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
            base_stats = base_dex.get("baseStats") or dex_entry.get("baseStats")
            forme_order_raw = base_dex.get("formeOrder", []) or dex_entry.get("formeOrder", [])
            pokemon_index_lower = {k.lower() for k in pokemon_index.keys()}
            forme_order = _filter_forme_order(forme_order_raw, base_stats, pokemon_index_lower, champions)
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
                "averageStats": {k: 0 for k in STAT_KEYS},
                "spreads": [],
                "allSpreads": [],
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
            }

    poke_data = fetch_pokemon_data(format_code, rating, matched_pokemon, month)
    if not poke_data:
        return None

    matched_dex = fuzzy_match(matched_pokemon, pokedexEntries.keys())
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

    # Get form data from pokedex, filtered to forms with usage data or different stats
    forme_order_raw = dex_entry.get("formeOrder", [])
    forme_base_stats = base_stats_dict
    if not forme_order_raw and dex_entry.get("baseSpecies"):
        base_key = fuzzy_match(
            dex_entry["baseSpecies"].lower().replace(" ", "").replace("-", ""),
            pokedexEntries.keys(),
        )
        if base_key:
            forme_order_raw = pokedexEntries[base_key].get("formeOrder", [])
            forme_base_stats = pokedexEntries[base_key].get("baseStats", base_stats_dict)
    pokemon_index_lower = {k.lower() for k in pokemon_index.keys()}
    forme_order = _filter_forme_order(forme_order_raw, forme_base_stats, pokemon_index_lower, champions)
    calc_generation = 0 if champions else (extract_generation_from_format(format_code) or 9)
    species_overrides = {
        "name": matched_pokemon,
        "types": pokemon_types,
        "weightkg": pokemon_weightkg,
        "baseStats": base_stats_dict,
        "abilities": {"0": all_abilities[0] if all_abilities else ""},
    }
    if dex_entry.get("nfe") is not None:
        species_overrides["nfe"] = dex_entry.get("nfe")

    return {
        "name": matched_pokemon,
        "calcSpecies": matched_pokemon,
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
    month = request.args.get("month", None)
    data = compile_page_data(format_code, rating_threshold, pokemon_name, month)
    if data is None:
        return jsonify({"error": "No data found"}), 404
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

    filepath = os.path.join(REPLAY_DATA_DIR, f"search-replays-list-{meta}.json")
    if not os.path.exists(filepath):
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
    filepath = os.path.join(REPLAY_DATA_DIR, f"team-rankings-{format_name}.json")
    if not os.path.exists(filepath):
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


# Cache default replays at startup
_default_replay_path = os.path.join(REPLAY_DATA_DIR, f"search-replays-list-{REPLAY_FORMATS[0]}.json")
DEFAULT_REPLAYS = find_replays("", REPLAY_FORMATS[0]) if os.path.exists(_default_replay_path) else []


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
    return jsonify(DEFAULT_REPLAYS)


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


def compile_tournament_category(poke_data, category, total_count):
    """Convert tournament aggregated counts into display lists."""
    data = poke_data.get(category, {})
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

    # Compile data lists
    moves_list = compile_tournament_category(poke_data, "moves", usage_count)
    items_list = compile_tournament_category(poke_data, "items", usage_count)
    abilities_list = compile_tournament_category(poke_data, "abilities", usage_count)
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

    return {
        "tournaments": tournaments,
        "selected_tournament": chosen,
        "day_filter": day_filter,
        "day_options": ["all", "day2", "top16", "top8"],
        "pokemon_names": pokemon_names,
        "selected_pokemon": selected_pokemon,
        "current_pokemon": [selected_pokemon, usage_pct, rank, get_pokemon_sprite(selected_pokemon)],
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


@app.route("/tournaments/")
@app.route("/tournaments/<tournament_id>/")
@app.route("/tournaments/<tournament_id>/<day_filter>/")
@app.route("/tournaments/<tournament_id>/<day_filter>/<pokemon_name>")
def tournaments_page(tournament_id="", day_filter="all", pokemon_name=""):
    data = compile_tournament_page_data(tournament_id, day_filter, pokemon_name)
    tab_kwargs = dict(
        selected_format=[DEFAULT_META, formatDisplayNames.get(DEFAULT_META, DEFAULT_META)],
        selected_rating="0",
    )
    if data is None:
        return render_template("tournaments.html", no_data=True, selected_pokemon="", **tab_kwargs)
    return render_template("tournaments.html", **data, **tab_kwargs)


@app.route("/tournaments/api/<tournament_id>/<day_filter>/")
@app.route("/tournaments/api/<tournament_id>/<day_filter>/<pokemon_name>")
def api_tournament_data(tournament_id, day_filter="all", pokemon_name=""):
    data = compile_tournament_page_data(tournament_id, day_filter, pokemon_name)
    if data is None:
        return jsonify({"error": "No data found"}), 404
    # Convert tuple sprites to lists for JSON serialization
    result = dict(data)
    result["current_pokemon"] = list(result["current_pokemon"])
    result["current_pokemon"][3] = list(result["current_pokemon"][3])
    result["pokemon_names"] = [
        [p[0], p[1], list(p[2])] for p in result["pokemon_names"]
    ]
    result["teammates_list"] = [
        [t[0], t[1], list(t[2])] for t in result["teammates_list"]
    ]
    # Convert item sprite tuples
    result["items_list"] = [
        [i[0], i[1], i[2], list(i[3])] if len(i) > 3 else i
        for i in result["items_list"]
    ]
    return jsonify(result)


@app.route("/tournaments/api/<tournament_id>/teams/<pokemon_name>")
def api_tournament_teams(tournament_id, pokemon_name):
    """Return teams that used a given Pokemon, sorted by placement."""
    players = load_tournament_players(tournament_id)
    day_filter = request.args.get("day", "all")

    matching_teams = []
    for player in players:
        if not player.get("team"):
            continue
        # Day filter - hierarchical: top8 > top16 > day2 > day1
        day = player.get("day_reached", "day1")
        day_hierarchy = {"top8": 4, "top16": 3, "day2": 2, "day1": 1}
        if day_filter != "all":
            required_level = day_hierarchy.get(day_filter, 0)
            player_level = day_hierarchy.get(day, 1)
            if player_level < required_level:
                continue

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
    day_hierarchy = {"top8": 4, "top16": 3, "day2": 2, "day1": 1}
    for player in players:
        if not player.get("team"):
            continue
        day = player.get("day_reached", "day1")
        if day_filter != "all":
            required_level = day_hierarchy.get(day_filter, 0)
            if day_hierarchy.get(day, 1) < required_level:
                continue

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


# ─── Pokemon Detail Page: Tournament & Replay Integration ────────────────


@app.route("/api/pokemon-teams/<format_code>/<pokemon_name>")
def api_pokemon_tournament_teams(format_code, pokemon_name):
    """Return top-performing tournament teams that used a given Pokemon."""
    tournaments = load_tournament_list()
    matching = [
        t for t in tournaments
        if t.get("format") and tournament_format_matches(t["format"], format_code)
    ][:5]

    if not matching:
        return jsonify([])

    all_teams = []
    base_name = get_base_pokemon_name(pokemon_name)
    poke_lower = base_name.lower()
    required_item = _mega_required_items.get(pokemon_name.lower(), "")
    for tourney in matching:
        players = load_tournament_players(tourney["id"])
        for player in players:
            if not player.get("team"):
                continue
            # Find the slot matching the base Pokemon
            matched_slot = None
            for slot in player["team"]:
                if slot["pokemon"].lower() == poke_lower:
                    matched_slot = slot
                    break
            if not matched_slot:
                continue
            # If viewing a Mega/Primal, verify the held item matches
            if required_item and matched_slot.get("item", "") != required_item:
                continue
            all_teams.append({
                "player": player["name"],
                "placement": player["placement"],
                "record": player.get("record", {}),
                "day_reached": player.get("day_reached", "day1"),
                "tournament_name": tourney["name"],
                "tournament_date": tourney.get("date", ""),
                "tournament_id": tourney["id"],
                "team": [
                    {
                        "pokemon": s["pokemon"],
                        "sprite": list(get_pokemon_sprite(s["pokemon"])),
                        "item": s.get("item", ""),
                        "ability": s.get("ability", ""),
                        "tera_type": s.get("tera_type", ""),
                        "nature": s.get("nature", ""),
                        "moves": s.get("moves", []),
                    }
                    for s in player["team"]
                ],
            })

    all_teams.sort(key=lambda t: t["placement"])
    return jsonify(all_teams[:8])


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
MERCH_CACHE_TTL = 86400  # 24 hours


def get_ebay_oauth_token():
    """Get an eBay OAuth application token, cached until expiry."""
    if _ebay_token_cache["token"] and time.time() < _ebay_token_cache["expires"]:
        return _ebay_token_cache["token"]

    if not EBAY_CLIENT_ID or not EBAY_CLIENT_SECRET:
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
    except Exception:
        pass
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
        return jsonify([])

    categories = [
        ("plush", f"{pokemon_name} Pokemon plush"),
        ("card", f"{pokemon_name} Pokemon card"),
        ("figure", f"{pokemon_name} Pokemon figure"),
        ("merch", f"{pokemon_name} Pokemon"),
    ]

    # Collect results per category, then interleave
    per_category = {cat: [] for cat, _ in categories}
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
        except Exception:
            continue

    # Interleave: [plush1, card1, figure1, merch1, plush2, card2, figure2, merch2]
    listings = []
    max_per_cat = max((len(v) for v in per_category.values()), default=0)
    cat_keys = [cat for cat, _ in categories]
    for i in range(max_per_cat):
        for cat in cat_keys:
            if i < len(per_category[cat]):
                listings.append(per_category[cat][i])

    _ebay_merch_cache[cache_key] = {"data": listings, "expires": time.time() + MERCH_CACHE_TTL}
    return jsonify(listings)


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
