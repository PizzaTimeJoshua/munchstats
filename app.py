import difflib
import gzip
import json
import math
import os
import re
from datetime import datetime
from functools import lru_cache

import requests
from flask import Flask, jsonify, redirect, render_template, request, url_for
import pyjson5

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


@lru_cache(maxsize=8)
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


@lru_cache(maxsize=12)
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


@lru_cache(maxsize=32)
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
    champions = [f for f in availableFormats if f[1].startswith("[Champions]")]
    others = [f for f in availableFormats if not f[1].startswith("[Champions]")]
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
    champions = [[f[0], f[1]] for f in format_list if f[1].startswith("[Champions]")]
    others = [[f[0], f[1]] for f in format_list if not f[1].startswith("[Champions]")]
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
    if not matched_pokemon:
        return None

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

    def _build_tiers(groups, stat_key):
        sorted_g = sorted(groups, key=lambda g: g[stat_key])
        total = sum(g["weight"] for g in sorted_g) or 1
        buckets = {"frail": [], "average": [], "bulky": []}
        cumulative = 0
        for g in sorted_g:
            frac = cumulative / total
            if frac < 0.33:
                buckets["frail"].append(g)
            elif frac < 0.67:
                buckets["average"].append(g)
            else:
                buckets["bulky"].append(g)
            cumulative += g["weight"]

        def _tier_info(tier_groups):
            if not tier_groups:
                return None
            tw = sum(g["weight"] for g in tier_groups) or 1
            avg_hp = round(sum(g["hp"] * g["weight"] for g in tier_groups) / tw)
            avg_stat = round(sum(g[stat_key] * g["weight"] for g in tier_groups) / tw)
            return {"hp": avg_hp, stat_key: avg_stat, "weight": round(tw, 5), "groups": tier_groups}

        return {k: _tier_info(v) for k, v in buckets.items()}

    def_tiers = _build_tiers(def_groups, "def") if def_groups else {"frail": None, "average": None, "bulky": None}
    spd_tiers = _build_tiers(spd_groups, "spd") if spd_groups else {"frail": None, "average": None, "bulky": None}

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
    all_abilities = []
    if abilities_raw:
        for ab_key in sorted(abilities_raw.keys(), key=lambda a: abilities_raw[a], reverse=True)[:4]:
            ab_info = abilities_source.get(ab_key, {})
            all_abilities.append(ab_info.get("name", ab_key.title()))

    items_raw = poke_data.get("Items", {})
    all_items = []
    if items_raw:
        for item_key in sorted(items_raw.keys(), key=lambda i: items_raw[i], reverse=True)[:4]:
            item_info = itemDetails.get(item_key, {})
            name = item_info.get("name", item_key.title())
            if name and name.lower() != "nothing":
                all_items.append(name)

    tera_raw = poke_data.get("Tera Types", {})
    top_tera = ""
    if tera_raw:
        top_tera_key = max(tera_raw.keys(), key=lambda t: tera_raw[t])
        if top_tera_key.lower() != "nothing":
            top_tera = top_tera_key.capitalize()

    # Get form data from pokedex, filtered to forms present in usage stats
    forme_order = dex_entry.get("formeOrder", [])
    if not forme_order and dex_entry.get("baseSpecies"):
        base_key = fuzzy_match(
            dex_entry["baseSpecies"].lower().replace(" ", "").replace("-", ""),
            pokedexEntries.keys(),
        )
        if base_key:
            forme_order = pokedexEntries[base_key].get("formeOrder", [])
    pokemon_index_lower = {k.lower() for k in pokemon_index.keys()}
    forme_order = [f for f in forme_order if f.lower() in pokemon_index_lower]
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
        "defTiers": def_tiers,
        "spdTiers": spd_tiers,
        "topMoves": top_moves,
        "topAbility": all_abilities[0] if all_abilities else "",
        "topItem": all_items[0] if all_items else "",
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
