import difflib
import json
import os
import re
from datetime import datetime

import pyjson5
import requests
from bs4 import BeautifulSoup


def updateMetagames():
    year = datetime.now().year
    month = datetime.now().month - 1
    if month == 0:
        month = 12
        year = year - 1
    month = str(month).zfill(2)
    year = str(year)
    urls = [
        f"https://www.smogon.com/stats/{year}-{month}/chaos/",
        f"https://www.smogon.com/stats/{year}-{month}-DLC1/chaos/",
        f"https://www.smogon.com/stats/{year}-{month}-DLC2/chaos/",
        f"https://www.smogon.com/stats/{year}-{month}-H1/chaos/",
        f"https://www.smogon.com/stats/{year}-{month}-H2/chaos/",
    ]
    for url in urls:
        response = requests.get(url)
        if response.status_code == 200:
            print(f"Getting stats from {url}")
            soup = BeautifulSoup(response.text, "html.parser")
            links = soup.find_all("a", href=True)
            for link in links:
                href = link["href"]
                if ".json" in href and ".gz" not in href:
                    print(f"Downloading {href}...")
                    response = requests.get(url + href)
                    with open(
                        f"stats/{year}-{month}-{href}", "w", encoding="utf-8"
                    ) as file:
                        file.write(response.text)
            break
    else:
        print("Unable to update metagames.")


def extract_battle_icon_indexes_from_url(mjs_url, output_json_path):
    # 1. Fetch the content from the URL
    response = requests.get(mjs_url)
    mjs_content = response.text.splitlines()

    # 2. Extract the content of BattlePokemonIconIndexes
    start_index = next(
        i
        for i, line in enumerate(mjs_content)
        if "BattlePokemonIconIndexes" in line and line.rstrip().endswith("{")
    )
    end_index = start_index
    while mjs_content[end_index] != "};":
        end_index += 1
    icon_indexes_content = mjs_content[start_index + 1 : end_index]

    # 3. Clean and process the content
    cleaned_content = [
        line for line in icon_indexes_content if not line.strip().startswith("//")
    ]
    content_string = "".join(cleaned_content)
    content_string = re.sub(
        r"/\*.*?\*/", "", content_string, flags=re.DOTALL
    )  # Remove multi-line comments
    content_string = re.sub(
        r"(\d+ \+ \d+)", lambda x: str(eval(x.group(1))), content_string
    )  # Evaluate arithmetic
    content_string = re.sub(
        r"(\w+):", r'"\1":', content_string
    )  # Quote dictionary keys

    # 4. Convert the content string to a Python dictionary
    icon_indexes_dict = eval(f"{{{content_string}}}")

    # 5. Serialize the dictionary to a JSON file
    with open(output_json_path, "w") as json_file:
        pyjson5.dump(icon_indexes_dict, json_file, indent=4)


def updateData():
    print("Getting item data.")
    url = "https://play.pokemonshowdown.com/data/items.js"
    itemJS = requests.get(url).text
    itemRaw = "{" + itemJS.split("{", 1)[1][:-1]
    with open("stats/items.json", "w", encoding="utf-8") as file:
        file.write(itemRaw)
    print("Getting ability data.")
    url = "https://play.pokemonshowdown.com/data/abilities.js"
    abilitiesJS = requests.get(url).text
    abilitiesRaw = "{" + abilitiesJS.split("{", 1)[1][:-1]
    with open("stats/abilities.json", "w", encoding="utf-8") as file:
        file.write(abilitiesRaw)
    print("Getting move data.")
    url = "https://play.pokemonshowdown.com/data/moves.json"
    movesRaw = requests.get(url).text
    with open("stats/moves.json", "w", encoding="utf-8") as file:
        file.write(movesRaw)
    print("Getting pokedex data.")
    url = "https://play.pokemonshowdown.com/data/pokedex.json"
    pokedexRaw = requests.get(url).text
    with open("stats/pokedex.json", "w", encoding="utf-8") as file:
        file.write(pokedexRaw)
    print("Getting form data.")
    url = "https://raw.githubusercontent.com/smogon/pokemon-showdown-client/master/play.pokemonshowdown.com/src/battle-dex-data.ts"
    extract_battle_icon_indexes_from_url(url, "stats/forms_index.json")


def updateImage():
    print("Getting images.")
    url = "https://play.pokemonshowdown.com/sprites/pokemonicons-sheet.png"
    response = requests.get(url, stream=True)
    response.raise_for_status()  # Raise an error for failed requests

    # Save the image to the desired path
    with open("static/pokemonicons-sheet.png", "wb") as file:
        for chunk in response.iter_content(chunk_size=8192):
            file.write(chunk)

    url = "https://play.pokemonshowdown.com/sprites/itemicons-sheet.png"
    response = requests.get(url, stream=True)
    response.raise_for_status()  # Raise an error for failed requests

    # Save the image to the desired path
    with open("static/itemicons-sheet.png", "wb") as file:
        for chunk in response.iter_content(chunk_size=8192):
            file.write(chunk)


def extract_gen(s):
    """Extract the generation number from the string."""
    val = s.split("gen")[1].split("1v1")[0].split("2v2")[0].split("350")[0]
    val = int(re.findall(r"\d+", val)[0]) if re.findall(r"\d+", val) else None
    return str(val)


def generateFormatList():
    # 1. Fetch the content from the URL
    response = requests.get(
        "https://raw.githubusercontent.com/smogon/pokemon-showdown/master/config/formats.ts"
    )
    mjs_content = response.text

    format_names = re.findall(r"name:\s*['\"]([^'\"]+)['\"]", mjs_content)

    # Find latest month directory and list format subdirectories
    month_dirs = sorted(
        [d for d in os.listdir("stats/") if re.match(r"\d{4}-\d{2}$", d)]
    )
    if not month_dirs:
        print("No month directories found. Unable to generate format list.")
        return
    latest = month_dirs[-1]
    latest_path = os.path.join("stats", latest)
    meta_games_list = [
        d
        for d in os.listdir(latest_path)
        if os.path.isdir(os.path.join(latest_path, d))
    ]

    # Keep previously discovered format names so formats missing from the
    # latest month don't get dropped. Only resolve names for new formats.
    meta_names = {}
    if os.path.exists("stats/meta_names.json"):
        try:
            with open("stats/meta_names.json", "r") as file:
                meta_names = pyjson5.load(file)
        except Exception as e:
            print(f"Unable to load existing meta_names.json: {e}")
            meta_names = {}

    for meta in meta_games_list:
        if meta in meta_names:
            continue
        word = meta
        possibilities = format_names
        normalized_possibilities = {p.lower(): p for p in possibilities}
        result = difflib.get_close_matches(
            word, normalized_possibilities.keys(), 10
        )
        normalized_result = [normalized_possibilities[r] for r in result]
        if len(normalized_result) > 0:
            close = normalized_result[0]
            pokeSearch = close

            if re.sub(r"[^a-z0-9]+", "", pokeSearch.lower()) != meta:
                print(f"Possible incorrect name with {meta} as {pokeSearch}")

            meta_names[meta] = pokeSearch
        else:
            print(f"Unable to find format name for {meta}")
    with open("stats/meta_names.json", "w") as file:
        pyjson5.dump(meta_names, file)


def parse_ts_overrides(ts_content, relevant_fields):
    """Parse a Showdown TS mod file and extract relevant field overrides."""
    overrides = {}
    pattern = re.compile(r"^\t(\w+):\s*\{(.*?)\n\t\}", re.MULTILINE | re.DOTALL)
    for match in pattern.finditer(ts_content):
        entry_id = match.group(1)
        body = match.group(2)
        entry = {}
        for field in relevant_fields:
            num_match = re.search(rf"^\s*{field}:\s*(\d+)\s*,?\s*$", body, re.MULTILINE)
            if num_match:
                entry[field] = int(num_match.group(1))
                continue
            bool_match = re.search(rf"^\s*{field}:\s*(true|false)\s*,?\s*$", body, re.MULTILINE)
            if bool_match:
                entry[field] = True if bool_match.group(1) == "true" else False
                continue
            str_match = re.search(rf'^\s*{field}:\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$', body, re.MULTILINE)
            if str_match:
                entry[field] = str_match.group(1)
                continue
        if entry:
            overrides[entry_id] = entry
    return overrides


def updateChampionsMods():
    """Download Champions mod data and merge with base moves/abilities."""
    moves_url = "https://raw.githubusercontent.com/smogon/pokemon-showdown/refs/heads/master/data/mods/champions/moves.ts"
    abilities_url = "https://raw.githubusercontent.com/smogon/pokemon-showdown/refs/heads/master/data/mods/champions/abilities.ts"

    print("Getting Champions moves mod data.")
    moves_ts = requests.get(moves_url).text
    move_overrides = parse_ts_overrides(
        moves_ts, {"basePower", "accuracy", "pp", "type", "desc", "shortDesc"}
    )
    with open("stats/moves.json", "r", encoding="utf-8") as f:
        base_moves = pyjson5.loads(f.read())
    for entry_id, fields in move_overrides.items():
        if entry_id in base_moves:
            base_moves[entry_id].update(fields)
    with open("stats/champions_moves.json", "w", encoding="utf-8") as f:
        pyjson5.dump(base_moves, f, separators=(",", ":"))
    print(f"  Applied {len(move_overrides)} move overrides.")

    print("Getting Champions abilities mod data.")
    abilities_ts = requests.get(abilities_url).text
    ability_overrides = parse_ts_overrides(abilities_ts, {"desc", "shortDesc"})
    with open("stats/abilities.json", "r", encoding="utf-8") as f:
        base_abilities = pyjson5.loads(f.read())
    for entry_id, fields in ability_overrides.items():
        if entry_id in base_abilities:
            base_abilities[entry_id].update(fields)
    with open("stats/champions_abilities.json", "w", encoding="utf-8") as f:
        pyjson5.dump(base_abilities, f, separators=(",", ":"))
    print(f"  Applied {len(ability_overrides)} ability overrides.")


def get_trend_months(num_months=12):
    """Return list of the last num_months month strings (YYYY-MM), oldest first."""
    now = datetime.now()
    year = now.year
    month = now.month - 1
    if month == 0:
        month = 12
        year -= 1
    months = []
    for i in range(num_months):
        m = month - i
        y = year
        while m <= 0:
            m += 12
            y -= 1
        months.append(f"{y}-{str(m).zfill(2)}")
    return list(reversed(months))


def fetch_chaos_usage(session, month, fmt, rating):
    """Fetch chaos JSON for a format-rating-month and return {pokemon: usage_pct} or None."""
    import gzip as _gzip
    suffixes = ["", "-DLC1", "-DLC2", "-H1", "-H2"]
    for suffix in suffixes:
        # Try .json.gz first (much smaller)
        gz_url = f"https://www.smogon.com/stats/{month}{suffix}/chaos/{fmt}-{rating}.json.gz"
        try:
            resp = session.get(gz_url, timeout=30)
            if resp.status_code == 200:
                raw = _gzip.decompress(resp.content)
                data = json.loads(raw)
                return _extract_usage_from_chaos(data)
        except Exception:
            pass
        # Fall back to plain JSON
        json_url = f"https://www.smogon.com/stats/{month}{suffix}/chaos/{fmt}-{rating}.json"
        try:
            resp = session.get(json_url, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                return _extract_usage_from_chaos(data)
        except Exception:
            pass
    return None


def _extract_usage_from_chaos(chaos_data):
    """Extract {pokemon_name: usage_percent} from a chaos JSON structure."""
    poke_data = chaos_data.get("data", {})
    info = chaos_data.get("info", {})
    num_battles = info.get("number of battles", 0)
    result = {}
    for name, entry in poke_data.items():
        usage = entry.get("usage", 0)
        # Pre-2015-12 data may lack 'usage'; compute from raw count
        if not usage and num_battles:
            raw = entry.get("Raw count", 0)
            if raw:
                usage = raw / (num_battles * 2)
        result[name] = round(usage * 100, 3)
    return result


def generate_trend_data():
    """Download chaos JSON from Smogon for the last 12 months and build trend files."""
    months = get_trend_months(12)
    # Find latest local month directory to discover formats/ratings
    month_dirs = sorted(
        [d for d in os.listdir("stats/") if re.match(r"\d{4}-\d{2}$", d)]
    )
    if not month_dirs:
        print("No local month data found. Skipping trend generation.")
        return

    latest = month_dirs[-1]
    latest_path = os.path.join("stats", latest)
    format_ratings = {}
    for fmt in os.listdir(latest_path):
        fmt_path = os.path.join(latest_path, fmt)
        if os.path.isdir(fmt_path):
            ratings = [d for d in os.listdir(fmt_path) if d.isdigit()]
            if ratings:
                format_ratings[fmt] = sorted(ratings, key=int)

    if not format_ratings:
        print("No format/rating pairs found. Skipping trend generation.")
        return

    os.makedirs("stats/trends", exist_ok=True)
    session = requests.Session()
    total_pairs = sum(len(r) for r in format_ratings.values())
    count = 0

    for fmt, ratings in format_ratings.items():
        for rating in ratings:
            count += 1
            print(f"[{count}/{total_pairs}] Generating trend: {fmt}/{rating}")
            trend = {"months": months, "pokemon": {}}

            for month_idx, m in enumerate(months):
                # Use local _index.json if available
                index_path = os.path.join("stats", m, fmt, rating, "_index.json")
                usage_data = None
                if os.path.exists(index_path):
                    with open(index_path, "r", encoding="utf-8") as f:
                        index = json.load(f)
                    info = index.get("info", {})
                    num_battles = info.get("number of battles", 0)
                    usage_data = {}
                    for name, entry in index.get("pokemon", {}).items():
                        usage = entry.get("usage", 0)
                        if not usage and num_battles:
                            raw = entry.get("raw", 0)
                            if raw:
                                usage = raw / (num_battles * 2)
                        usage_data[name] = round(usage * 100, 3)
                else:
                    usage_data = fetch_chaos_usage(session, m, fmt, rating)

                if usage_data:
                    for pokemon_name, usage_pct in usage_data.items():
                        if pokemon_name not in trend["pokemon"]:
                            trend["pokemon"][pokemon_name] = [None] * len(months)
                        trend["pokemon"][pokemon_name][month_idx] = usage_pct

            trend_dir = os.path.join("stats", "trends", fmt)
            os.makedirs(trend_dir, exist_ok=True)
            trend_path = os.path.join(trend_dir, f"{rating}.json")
            with open(trend_path, "w", encoding="utf-8") as f:
                json.dump(trend, f, separators=(",", ":"))

    print(f"Trend generation complete. Wrote {count} trend files.")


def splitMetagameFiles():
    """Split monolithic format JSON files into per-Pokémon files in a directory structure."""
    pattern = re.compile(r"^(\d{4}-\d{2})-(.+)-(\d+)\.json$")
    stats_dir = "stats"
    files = [f for f in os.listdir(stats_dir) if pattern.match(f)]
    if not files:
        print("No monolithic stats files to split.")
        return
    for filename in files:
        match = pattern.match(filename)
        month, format_code, rating = match.group(1), match.group(2), match.group(3)
        filepath = os.path.join(stats_dir, filename)
        print(f"Splitting {filename}...")
        with open(filepath, "r", encoding="utf-8") as f:
            raw = json.load(f)
        info = raw.get("info", {})
        data = raw.get("data", {})
        if not data:
            print(f"  Skipping {filename} (no data).")
            continue
        out_dir = os.path.join(stats_dir, month, format_code, rating)
        os.makedirs(out_dir, exist_ok=True)
        index = {
            "info": info,
            "pokemon": {
                name: {"usage": poke.get("usage", 0), "raw": poke.get("Raw count", 0)}
                for name, poke in data.items()
            },
        }
        with open(os.path.join(out_dir, "_index.json"), "w", encoding="utf-8") as f:
            json.dump(index, f, separators=(",", ":"))
        for name, poke in data.items():
            poke_path = os.path.join(out_dir, f"{name}.json")
            with open(poke_path, "w", encoding="utf-8") as f:
                json.dump(poke, f, separators=(",", ":"))
        os.remove(filepath)
        print(f"  Split into {len(data)} Pokémon files.")
    print("Splitting complete.")


if __name__ == "__main__":
    updateData()
    updateImage()
    updateMetagames()
    splitMetagameFiles()
    generate_trend_data()
    generateFormatList()
    updateChampionsMods()
    print("Update done.")
