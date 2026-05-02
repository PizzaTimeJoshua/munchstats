import difflib
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
    start_index = mjs_content.index("const BattlePokemonIconIndexes = {")
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
    url = "https://raw.githubusercontent.com/smogon/sprites/master/ps-pokemon.sheet.mjs"
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

    meta_games_list = [
        "stats/" + f for f in os.listdir("stats/") if f.split("-")[-1] == "0.json"
    ]
    meta_games_list = [f.split("-")[-2] for f in meta_games_list]
    meta_names = {}
    for meta in meta_games_list:
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


if __name__ == "__main__":
    updateData()
    updateImage()
    updateMetagames()
    generateFormatList()
    updateChampionsMods()
    print("Update done.")
