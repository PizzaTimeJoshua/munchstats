import os
import math
import re
import difflib
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for
import pyjson5

app = Flask(__name__)

# Directory and global data definitions
DATA_DIRECTORY = "stats"
os.makedirs(DATA_DIRECTORY, exist_ok=True)

# Global dictionaries for loaded data
formatDisplayNames = {}
availableFormats = []
spriteIndex = {}
itemDetails = {}
abilityDetails = {}
moveDetails = {}
pokedexEntries = {}

def load_data_file(filepath, mode='r', encoding="utf8"):
    """Load and return data from a JSON/JSON5 file if it exists."""
    if os.path.exists(filepath):
        with open(filepath, mode, encoding=encoding) as file:
            return pyjson5.loads(file.read())
    return None

def build_data_path(filename):
    """Construct a path relative to the data directory."""
    path = f"{DATA_DIRECTORY}\\{filename}"
    return path

def get_previous_year_month():
    """Return the year and month (as strings) for the previous month."""
    now = datetime.now()
    month = now.month - 1
    year = now.year
    if month == 0:
        month = 12
        year -= 1
    return str(year), str(month).zfill(2)

def fetch_pokemon_usage_data(format_code, rating_threshold):
    """Return usage data for a given format and rating threshold. Falls back if current data is missing."""
    year, month = get_previous_year_month()
    file_name = f"{year}-{month}-{format_code}-{rating_threshold}.json"
    file_path = build_data_path(file_name)
    usage_data = load_data_file(file_path)
    if usage_data:
        return usage_data.get("data", {})
    # Fallback to previous month
    previous_month = int(month) - 1
    previous_year = int(year)
    if previous_month == 0:
        previous_month = 12
        previous_year -= 1
    prev_file_name = f"{previous_year}-{str(previous_month).zfill(2)}-{format_code}-{rating_threshold}.json"
    prev_file_path = build_data_path(prev_file_name)
    usage_data = load_data_file(prev_file_path)
    if usage_data:
        print("Warning: Usage stats data is outdated.")
        return usage_data.get("data", {})
    return {}

def extract_generation_from_filename(filename):
    """Extract the generation number from a filename string."""
    special_formats = ["1v1","2v2","350","12switch"]
    try:
        segment = filename.split("-")[2]
        gen_segment = segment
        for format in special_formats:
            gen_segment = gen_segment.split(format)[0]
        return int(re.findall(r'\d+', gen_segment)[0])
    except (IndexError, ValueError):
        return None

def sort_files_by_generation_and_size(file_list):
    """Sort file names by generation (descending) and file size (descending)."""
    file_info = [(f, extract_generation_from_filename(f), os.path.getsize(f)) for f in file_list]
    sorted_files = sorted(file_info, key=lambda x: (-x[1] if x[1] is not None else 0, -x[2]))
    return [info[0] for info in sorted_files]

def get_valid_rating_thresholds(format_code):
    """Return a sorted list of valid rating thresholds for a format."""
    files = [f for f in os.listdir(DATA_DIRECTORY) if format_code in f.split("-")]
    ratings = sorted([f.split("-")[-1].split(".")[0] for f in files], key=int)
    return ratings

def fuzzy_match(target, options):
    """Return the closest match to target within options using fuzzy matching."""
    normalized_options = {option.lower(): option for option in options}
    matches = difflib.get_close_matches(target.lower(), normalized_options.keys(), 10)
    return normalized_options[matches[0]] if matches else None

def load_all_data():
    """Load all necessary data files into global variables."""
    global formatDisplayNames, availableFormats, spriteIndex, itemDetails, abilityDetails, moveDetails, pokedexEntries
    formatDisplayNames = load_data_file(build_data_path("meta_names.json")) or {}
    # Build availableFormats list from files ending with "0.json"
    format_files = [build_data_path(f) for f in os.listdir(DATA_DIRECTORY) if f.endswith("-0.json")]
    format_files = sort_files_by_generation_and_size(format_files)
    availableFormats = []
    for file_path in format_files:
        parts = os.path.basename(file_path).split("-")
        if len(parts) >= 3:
            fmt = parts[-2]
            if fmt in formatDisplayNames:
                availableFormats.append([fmt, formatDisplayNames[fmt]])
    spriteIndex = load_data_file(build_data_path("forms_index.json")) or {}
    itemDetails = load_data_file(build_data_path("items.json")) or {}
    abilityDetails = load_data_file(build_data_path("abilities.json")) or {}
    moveDetails = load_data_file(build_data_path("moves.json")) or {}
    pokedexEntries = load_data_file(build_data_path("pokedex.json")) or {}

def calculate_stat_value(base, iv, ev, level, nature_multiplier):
    """Calculate a stat value given parameters."""
    return math.floor(((2 * base + iv + math.floor(ev / 4)) * level / 100 + 5) * nature_multiplier)

def calculate_hp_value(base, iv, ev, level):
    """Calculate HP value."""
    return math.floor((2 * base + iv + math.floor(ev / 4)) * level / 100) + level + 10

def compile_top_data(usage_data, pokemon_name, category, format_code="", base_stats=[]):
    """Compile and return the requested category data for a given Pokémon."""
    if pokemon_name not in usage_data:
        return []
    
    # Branch for 'Stats' and 'Types'
    if category in ["Stats", "Types"]:
        matched_name = fuzzy_match(pokemon_name, pokedexEntries.keys())
        if not matched_name:
            return []
        if category == "Stats":
            stats = pokedexEntries[matched_name]["baseStats"]
            return [stats[k] for k in ["hp", "atk", "def", "spa", "spd", "spe"]]
        else:
            return pokedexEntries[matched_name]["types"]
    
    # Branch for 'Natures'
    if category == "Natures":
        nature_weights = {}
        for spread_key, weight in usage_data[pokemon_name].get("Spreads", {}).items():
            nature = spread_key.split(':')[0]
            nature_weights[nature] = nature_weights.get(nature, 0) + weight
        total_weight = max(sum(usage_data[pokemon_name].get("Abilities", {"Unknown": 1}).values()), 1)
        sorted_natures = sorted(nature_weights.keys(), key=lambda x: nature_weights[x], reverse=True)[:10]
        return [[n, "{:.3f}".format(round(nature_weights[n] / total_weight * 100, 3))] for n in sorted_natures][:10]
    
    
    # Branch for 'Graph'
    if category == "Graph":
        graph_stats = {stat: {} for stat in ["hp", "atk", "def", "spa", "spd", "spe"]}
        spreads = usage_data[pokemon_name].get("Spreads", {})
        level = 50 if "vgc" in format_code.lower() else 100
        total_weight = max(sum(usage_data[pokemon_name].get("Abilities", {"Unknown": 1}).values()), 1)
        stat_modifiers = {
            "atk": (["Naughty", "Adamant", "Lonely", "Brave"], ["Bold", "Timid", "Modest", "Calm"]),
            "def": (["Bold", "Relaxed", "Impish", "Lax"], ["Lonely", "Hasty", "Mild", "Gentle"]),
            "spa": (["Modest", "Mild", "Quiet", "Rash"], ["Adamant", "Impish", "Jolly", "Careful"]),
            "spd": (["Calm", "Gentle", "Sassy", "Careful"], ["Naughty", "Lax", "Naive", "Rash"]),
            "spe": (["Timid", "Hasty", "Jolly", "Naive"], ["Brave", "Relaxed", "Quiet", "Sassy"])
        }
        for spread, weight in spreads.items():
            parts = spread.split(':')
            nature = parts[0]
            evs = list(map(int, parts[1].split('/')))
            multipliers = {}
            for stat, (boost_list, nerf_list) in stat_modifiers.items():
                if nature in boost_list:
                    multipliers[stat] = 1.1
                elif nature in nerf_list:
                    multipliers[stat] = 0.9
                else:
                    multipliers[stat] = 1
            hp_val = calculate_hp_value(base_stats[0], 31, evs[0], level)
            atk_val = calculate_stat_value(base_stats[1], 31, evs[1], level, multipliers["atk"])
            def_val = calculate_stat_value(base_stats[2], 31, evs[2], level, multipliers["def"])
            spa_val = calculate_stat_value(base_stats[3], 31, evs[3], level, multipliers["spa"])
            spd_val = calculate_stat_value(base_stats[4], 31, evs[4], level, multipliers["spd"])
            speed_iv = 0 if (multipliers["spe"] == 0.9 and evs[5] == 0) else 31
            spe_val = calculate_stat_value(base_stats[5], speed_iv, evs[5], level, multipliers["spe"])
            for stat, value in zip(["hp", "atk", "def", "spa", "spd", "spe"],
                                   [hp_val, atk_val, def_val, spa_val, spd_val, spe_val]):
                graph_stats[stat][value] = graph_stats[stat].get(value, 0) + weight
        sorted_graph = []
        for stat in ["hp", "atk", "def", "spa", "spd", "spe"]:
            sorted_values = sorted(graph_stats[stat].items(), key=lambda x: x[1], reverse=True)
            sorted_graph.append([[val, graph_stats[stat][val] / total_weight * 100] for val, _ in sorted_values])
        return pyjson5.dumps(sorted_graph, separators=(',', ':'))
    
    # Branch for 'Moves'
    if category == "Moves":
        moves = usage_data[pokemon_name].get("Moves", {})
        total_weight = max(sum(usage_data[pokemon_name].get("Abilities", {"Unknown": 1}).values()), 1)
        sorted_moves = sorted(moves.keys(), key=lambda m: moves[m], reverse=True)[:10]
        result = []
        for move in sorted_moves:
            move_info = moveDetails.get(move, {
                "name": "Nothing", "type": "", "category": "",
                "basePower": "N/A", "accuracy": "N/A", "priority": 0, "desc": "No info."
            })
            usage_percent = "{:.3f}".format(round(moves[move] / total_weight * 100, 3))
            move_text = (f"{move_info.get('type','')} ({move_info.get('category','')})\n"
                         f"Base Power: {'N/A' if move_info.get('basePower', 'N/A') == 0 else move_info.get('basePower', 'N/A')}\n"
                         f"Accuracy: {'N/A' if move_info.get('accuracy', 'N/A') is True else move_info.get('accuracy', 'N/A')}\n"
                         f"Priority: {move_info.get('priority', 0)}\n"
                         f"{move_info.get('desc','No info.')}")
            result.append([move_info.get("name", "Nothing"), usage_percent, move_text])
        return result

    # Branch for 'Teammates'
    if category == "Teammates":
        teammates = usage_data[pokemon_name].get("Teammates", {})
        total_weight = max(sum(usage_data[pokemon_name].get("Abilities", {"Unknown": 1}).values()), 1)
        sorted_teammates = sorted(teammates.keys(), key=lambda x: teammates[x], reverse=True)[:10]
        return [[poke, "{:.3f}".format(round(teammates[poke] / total_weight * 100, 3)), get_pokemon_sprite(poke)]
                for poke in sorted_teammates]
    
    # Branch for 'Items'
    if category == "Items":
        items = usage_data[pokemon_name].get("Items", {})
        total_weight = max(sum(items.values()), 1)
        sorted_items = sorted(items.keys(), key=lambda x: items[x], reverse=True)[:10]
        return [[itemDetails.get(item, {"name": "Nothing"})["name"],
                 "{:.3f}".format(round(items[item] / total_weight * 100, 3)),
                 itemDetails.get(item, {"desc": "No info."}).get("desc", "No info."),
                 divmod(itemDetails.get(item, {"spritenum": 0})["spritenum"], 16)]
                for item in sorted_items]
    
    # Branch for 'Abilities'
    if category == "Abilities":
        abilities = usage_data[pokemon_name].get("Abilities", {})
        total_weight = max(sum(abilities.values()), 1)
        sorted_abilities = sorted(abilities.keys(), key=lambda x: abilities[x], reverse=True)[:10]
        return [[abilityDetails.get(ability, {"name": "Nothing"})["name"],
                 "{:.1f}".format(round(abilities[ability] / total_weight * 100, 1)),
                 abilityDetails.get(ability, {"desc": "No info."}).get("desc", "No info.")]
                for ability in sorted_abilities]
    
    # Branch for 'Spreads'
    if category == "Spreads":
        spreads = usage_data[pokemon_name].get("Spreads", {})
        total_spread_weight = max(sum(spreads.values()), 1)
        sorted_spreads = sorted(spreads.keys(), key=lambda s: spreads[s], reverse=True)[:15]
        return [[s, "{:.3f}".format(round(spreads[s] / total_spread_weight * 100, 3))] for s in sorted_spreads]
    
    # Branch for 'EVs'
    if category == "EVs":
        # Initialize dictionary for EVs by category.
        ev_data = {"atk": {}, "spa": {}, "spe": {}, "hp_def": {}, "hp_spd": {}}
        spreads = usage_data[pokemon_name].get("Spreads", {})
        total_count = max(sum(usage_data[pokemon_name].get("Abilities", {"Unknown": 1}).values()), 1)
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
            parts = spread.split(':')
            nature = parts[0]
            EVs = parts[1].split('/')
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
            key_atk = EVs[1] + pa + " Atk"
            key_spa = EVs[3] + psa + " SpA"
            key_spe = EVs[5] + pse + " Spe"
            key_hp_def = EVs[0] + " HP / " + EVs[2] + pd + " Def"
            key_hp_spd = EVs[0] + " HP / " + EVs[4] + psd + " SpD"
            ev_data["atk"][key_atk] = ev_data["atk"].get(key_atk, 0) + weight
            ev_data["spa"][key_spa] = ev_data["spa"].get(key_spa, 0) + weight
            ev_data["spe"][key_spe] = ev_data["spe"].get(key_spe, 0) + weight
            ev_data["hp_def"][key_hp_def] = ev_data["hp_def"].get(key_hp_def, 0) + weight
            ev_data["hp_spd"][key_hp_spd] = ev_data["hp_spd"].get(key_hp_spd, 0) + weight
        # Now sort each category and calculate percentages.
        sorted_ev = [[], [], [], [], []]
        sorted_ev[0] = sorted(ev_data["atk"].keys(), key=lambda x: ev_data["atk"][x], reverse=True)
        sorted_ev[0] = [[stat, "{:.3f}".format(round(ev_data["atk"][stat] / total_count * 100, 3))] for stat in sorted_ev[0]][:15]
        sorted_ev[1] = sorted(ev_data["spa"].keys(), key=lambda x: ev_data["spa"][x], reverse=True)
        sorted_ev[1] = [[stat, "{:.3f}".format(round(ev_data["spa"][stat] / total_count * 100, 3))] for stat in sorted_ev[1]][:15]
        sorted_ev[2] = sorted(ev_data["spe"].keys(), key=lambda x: ev_data["spe"][x], reverse=True)
        sorted_ev[2] = [[stat, "{:.3f}".format(round(ev_data["spe"][stat] / total_count * 100, 3))] for stat in sorted_ev[2]][:15]
        sorted_ev[3] = sorted(ev_data["hp_def"].keys(), key=lambda x: ev_data["hp_def"][x], reverse=True)
        sorted_ev[3] = [[stat, "{:.3f}".format(round(ev_data["hp_def"][stat] / total_count * 100, 3))] for stat in sorted_ev[3]][:15]
        sorted_ev[4] = sorted(ev_data["hp_spd"].keys(), key=lambda x: ev_data["hp_spd"][x], reverse=True)
        sorted_ev[4] = [[stat, "{:.3f}".format(round(ev_data["hp_spd"][stat] / total_count * 100, 3))] for stat in sorted_ev[4]][:15]
        return sorted_ev
    
    # Branch for 'Tera Types'
    if category == "Tera Types":
        tera_types = usage_data[pokemon_name].get("Tera Types", {})
        total_tera_types_weight = max(sum(tera_types.values()), 1)
        sorted_tera_types = sorted(tera_types.keys(), key=lambda s: tera_types[s], reverse=True)[:15]
        return [[t.capitalize(), "{:.3f}".format(round(tera_types[t] / total_tera_types_weight * 100, 3))] for t in sorted_tera_types]
    
    # Branch for 'Checks and Counters'
    if category == "Checks and Counters":
        unfiltered_counters = usage_data[pokemon_name].get("Checks and Counters", {})
        filtered_counters = {key: value for key, value in unfiltered_counters.items() if (value[2] < 0.01 and value[1] > 0.5)}
        sorted_counters = sorted(filtered_counters.keys(), key=lambda x: filtered_counters[x][1], reverse=True)[:10]
        return [[poke,"{:.3f}".format(round(filtered_counters[poke][1]*100,3)), get_pokemon_sprite(poke)] for poke in sorted_counters]
                
    
    # Default branch:
    total_weight = max(sum(usage_data[pokemon_name].get("Abilities", {"Unknown":1}).values()), 1)
    sorted_keys = sorted(usage_data[pokemon_name].keys(),
                         key=lambda key: usage_data[pokemon_name][key] if isinstance(usage_data[pokemon_name][key], (int, float)) else 0,
                         reverse=True)[:10]
    return [[key, "{:.3f}".format(round(usage_data[pokemon_name][key] / total_weight * 100, 3))]
            for key in sorted_keys]

def get_pokemon_sprite(pokemon_name):
    """Return sprite coordinates as a tuple (row, col) for a given Pokémon name."""
    word = pokemon_name.lower()
    word = re.sub(r'[^a-z0-9]+', '', word)
    if word in spriteIndex.keys():
        sprite_num = spriteIndex[word]
    elif word in pokedexEntries.keys():
        sprite_num = pokedexEntries[word].get("num",0)
    else:
        return (0,0)
    return divmod(sprite_num,12)

load_all_data()
@app.route('/about/')
def about():
    return render_template('about.html')

@app.route('/<format_code>/<rating_threshold>/<pokemon_name>')
@app.route('/<format_code>/<rating_threshold>/')
@app.route('/<format_code>/')
def display_pokemon_page(format_code, rating_threshold="", pokemon_name=""):
    default_format = "gen9vgc2025regg"
    try:
        selected_format = pyjson5.loads(f'["{format_code}", "{formatDisplayNames.get(format_code, format_code)}"]')
    except Exception:
        selected_format = [default_format, formatDisplayNames.get(default_format, default_format)]
    
    chosen_format = selected_format[0] if selected_format[0] in formatDisplayNames else default_format
    rating_options = get_valid_rating_thresholds(chosen_format)
    
    if rating_threshold in rating_options:
        chosen_rating = rating_threshold
    else:
        chosen_rating = rating_options[-1]
        rating_threshold = chosen_rating
    
    usage_stats = fetch_pokemon_usage_data(chosen_format, chosen_rating)
    sorted_pokemon = sorted(usage_stats.keys(), key=lambda name: usage_stats[name]["usage"], reverse=True)
    default_pokemon = sorted_pokemon[0] if sorted_pokemon else ""
    
    if pokemon_name and pokemon_name != "No Pokemon":
        matched_pokemon = fuzzy_match(pokemon_name, usage_stats.keys())
        if matched_pokemon:
            default_pokemon = matched_pokemon
    
    # Only redirect if not on the homepage ("/")
    if (chosen_format != format_code or chosen_rating != rating_threshold or default_pokemon != pokemon_name) and request.path != '/':
        return redirect(url_for('display_pokemon_page',
                                format_code=chosen_format,
                                rating_threshold=chosen_rating,
                                pokemon_name=default_pokemon))
    
    try:
        rank = sorted_pokemon.index(default_pokemon) + 1
    except ValueError:
        rank = "N/A"
    usage_percent = round(usage_stats.get(default_pokemon, {}).get("usage", 0) * 100, 2)
    current_pokemon_data = [default_pokemon, usage_percent, rank, get_pokemon_sprite(default_pokemon)]
    
    base_stats = compile_top_data(usage_stats, default_pokemon, "Stats")
    pokemon_types = compile_top_data(usage_stats, default_pokemon, "Types")
    moves_list = compile_top_data(usage_stats, default_pokemon, "Moves")
    teammates_list = compile_top_data(usage_stats, default_pokemon, "Teammates")
    items_list = compile_top_data(usage_stats, default_pokemon, "Items")
    abilities_list = compile_top_data(usage_stats, default_pokemon, "Abilities")
    spreads_list = compile_top_data(usage_stats, default_pokemon, "Spreads")
    natures_list = compile_top_data(usage_stats, default_pokemon, "Natures")
    evs_list = compile_top_data(usage_stats, default_pokemon, "EVs")
    counters_list = compile_top_data(usage_stats, default_pokemon, "Checks and Counters")
    graph_data = compile_top_data(usage_stats, default_pokemon, "Graph", chosen_format, base_stats)
    tera_types_list = compile_top_data(usage_stats, default_pokemon, "Tera Types")
    
    return render_template('index.html', 
                           pokemon_names=[[name, "{:.2f}".format(round(usage_stats[name]["usage"] * 100, 2)), get_pokemon_sprite(name)]
                                          for name in sorted_pokemon],
                           availableFormats=availableFormats,
                           selected_format=selected_format,
                           selected_pokemon=default_pokemon,
                           selected_rating=rating_threshold,
                           base_stats=base_stats,
                           pokemon_types=pokemon_types,
                           moves_list=moves_list,
                           teammates_list=teammates_list,
                           items_list=items_list,
                           abilities_list=abilities_list,
                           spreads_list=spreads_list,
                           natures_list=natures_list,
                           evs_list=evs_list,
                           counters_list=counters_list,
                           current_pokemon=current_pokemon_data,
                           rating_options=rating_options,
                           tera_types_list=tera_types_list,
                           graph_data=graph_data)

@app.route('/search_pokemon', methods=['POST'])
def search_pokemon_route():
    default_format = "gen9vgc2025regg"
    selected_format_input = request.form.get('meta_value', f'["{default_format}", "{formatDisplayNames.get(default_format, default_format)}"]')
    selected_pokemon_input = request.form.get('pokemon_value', "No Pokemon")
    selected_rating_input = request.form.get('rating_value', "No Rating")
    print(selected_format_input,selected_pokemon_input,selected_rating_input)
    
    try:
        selected_format = pyjson5.loads(selected_format_input)
    except Exception:
        selected_format = [default_format, formatDisplayNames.get(default_format, default_format)]
    
    chosen_format = selected_format[0] if selected_format[0] in formatDisplayNames else default_format
    rating_options = get_valid_rating_thresholds(chosen_format)
    chosen_rating = selected_rating_input if selected_rating_input in rating_options else rating_options[-1]
    
    usage_stats = fetch_pokemon_usage_data(chosen_format, chosen_rating)
    sorted_pokemon = sorted(usage_stats.keys(), key=lambda name: usage_stats[name]["usage"], reverse=True)
    default_pokemon = sorted_pokemon[0] if sorted_pokemon else ""
    
    if selected_pokemon_input != "No Pokemon":
        matched_pokemon = fuzzy_match(selected_pokemon_input, usage_stats.keys())
        if matched_pokemon:
            default_pokemon = matched_pokemon
    
    return redirect(url_for('display_pokemon_page',
                            format_code=chosen_format,
                            rating_threshold=chosen_rating,
                            pokemon_name=default_pokemon))

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500


@app.route('/', methods=['GET'])
def index():
    return display_pokemon_page("gen9vgc2025regg")

if __name__ == "__main__":
    app.run(debug=True)