import requests
from datetime import datetime
from bs4 import BeautifulSoup
import re
import json

def updateMetagames():
    year = datetime.now().year
    month = datetime.now().month-1
    if month==0:
        month = 12
        year = year-1
    month = str(month).zfill(2)
    year = str(year)
    urls = [f'https://www.smogon.com/stats/{year}-{month}/chaos/',
            f'https://www.smogon.com/stats/{year}-{month}-DLC1/chaos/',
            f'https://www.smogon.com/stats/{year}-{month}-DLC2/chaos/',
            f'https://www.smogon.com/stats/{year}-{month}-H1/chaos/',
            f'https://www.smogon.com/stats/{year}-{month}-H2/chaos/',
            ]
    for url in urls:
        response = requests.get(url)
        if response.status_code == 200:
            print(f"Getting stats from {url}")
            soup = BeautifulSoup(response.text, 'html.parser')
            links = soup.find_all('a', href=True)
            for link in links:
                href = link['href']
                if (".json" in href):
                    response = requests.get(url+href)
                    with open(f'stats/{year}-{month}-{href}', 'w', encoding="utf-8") as file:
                        file.write(response.text)
            break
    else:
        print("Unable to update metagames.")

def extract_battle_icon_indexes_from_url(mjs_url, output_json_path):
    # 1. Fetch the content from the URL
    response = requests.get(mjs_url)
    mjs_content = response.text.splitlines()

    # 2. Extract the content of BattlePokemonIconIndexes
    start_index = mjs_content.index('const BattlePokemonIconIndexes = {')
    end_index = start_index
    while mjs_content[end_index] != '};':
        end_index += 1
    icon_indexes_content = mjs_content[start_index + 1:end_index]

    # 3. Clean and process the content
    cleaned_content = [line for line in icon_indexes_content if not line.strip().startswith('//')]
    content_string = ''.join(cleaned_content)
    content_string = re.sub(r'/\*.*?\*/', '', content_string, flags=re.DOTALL)  # Remove multi-line comments
    content_string = re.sub(r'(\d+ \+ \d+)', lambda x: str(eval(x.group(1))), content_string)  # Evaluate arithmetic
    content_string = re.sub(r'(\w+):', r'"\1":', content_string)  # Quote dictionary keys

    # 4. Convert the content string to a Python dictionary
    icon_indexes_dict = eval(f"{{{content_string}}}")

    # 5. Serialize the dictionary to a JSON file
    with open(output_json_path, 'w') as json_file:
        json.dump(icon_indexes_dict, json_file, indent=4)


def updateData():
    print("Getting data.")
    url = 'https://play.pokemonshowdown.com/data/items.js'
    itemJS = requests.get(url).text
    itemRaw = "{"+itemJS.split("{",1)[1][:-1]
    with open('stats/items.json', 'w', encoding="utf-8") as file:
        file.write(itemRaw)

    url = 'https://play.pokemonshowdown.com/data/abilities.js'
    abilitiesJS = requests.get(url).text
    abilitiesRaw = "{"+abilitiesJS.split("{",1)[1][:-1]
    with open('stats/abilities.json', 'w', encoding="utf-8") as file:
        file.write(abilitiesRaw)

    url = 'https://play.pokemonshowdown.com/data/moves.json'
    movesRaw = requests.get(url).text
    with open('stats/moves.json', 'w', encoding="utf-8") as file:
        file.write(movesRaw)

    url = 'https://play.pokemonshowdown.com/data/pokedex.json'
    pokedexRaw = requests.get(url).text
    with open('stats/pokedex.json', 'w', encoding="utf-8") as file:
        file.write(pokedexRaw)
    
    url = 'https://raw.githubusercontent.com/smogon/sprites/master/ps-pokemon.sheet.mjs'
    extract_battle_icon_indexes_from_url(url,'stats/forms_index.json')


def updateImage():
    print("Getting images.")
    url = 'https://play.pokemonshowdown.com/sprites/pokemonicons-sheet.png'
    response = requests.get(url, stream=True)
    response.raise_for_status()  # Raise an error for failed requests

    # Save the image to the desired path
    with open('static/pokemonicons-sheet.png', 'wb') as file:
        for chunk in response.iter_content(chunk_size=8192):
            file.write(chunk)

    url = 'https://play.pokemonshowdown.com/sprites/itemicons-sheet.png'
    response = requests.get(url, stream=True)
    response.raise_for_status()  # Raise an error for failed requests

    # Save the image to the desired path
    with open('static/itemicons-sheet.png', 'wb') as file:
        for chunk in response.iter_content(chunk_size=8192):
            file.write(chunk)

updateData()
updateImage()
updateMetagames()
print("Update done.")