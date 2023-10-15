
from flask import Flask, render_template, request
import os
import pyjson5
from datetime import datetime
import difflib

app = Flask(__name__)

DATA_DIR = "stats"
os.makedirs(DATA_DIR, exist_ok=True)

def getPokemonData(meta,rating):
    year = datetime.now().year
    month = datetime.now().month-1
    if month==0:
        month = 12
        year = year-1
    month = str(month).zfill(2)
    year = str(year)

    if os.path.exists(f"stats/{year}-{month}-{meta}-{rating}.json"):
        with open(f'stats/{year}-{month}-{meta}-{rating}.json', 'r', encoding="utf8") as file:
            statsRaw = pyjson5.loads(file.read())
        pokemonData = statsRaw["data"]
    else:
        oldMonth = int(month)-1
        oldYear = int(year)
        if oldMonth==0:
            oldMonth = 12
            oldYear=oldYear-1
        oldMonth = str(oldMonth).zfill(2)
        oldYear = str(oldYear)
        with open(f'stats/{oldYear}-{oldMonth}-{meta}-{rating}.json', 'r', encoding="utf8") as file:
            statsRaw = pyjson5.loads(file.read())
        pokemonData = statsRaw["data"]

    return pokemonData

def get_valid_ratings(meta):
    valid_rates = ["stats/"+f for f in os.listdir("stats/") if meta in f.split("-")]
    valid_rates = [f.split("-")[-1] for f in valid_rates]
    valid_rates = [f.split(".")[0] for f in valid_rates]
    return valid_rates
    

def safe_load_files():
    global itemData, movesData, abilitiesData, pokedexData, meta_games_list
    meta_games_list = ["stats/"+f for f in os.listdir("stats/") if f.split("-")[-1] == "0.json"]
    meta_games_list.sort(reverse=True,key=os.path.getsize)
    meta_games_list = [f.split("-")[-2] for f in meta_games_list]
    # Load Items
    if os.path.exists("stats/items.json"):
        with open('stats/items.json', 'r') as file:
            itemRaw = file.read()
        itemData = pyjson5.loads(itemRaw)

    # Load Abilities
    if os.path.exists("stats/abilities.json"):
        with open('stats/abilities.json', 'r', encoding="utf8") as file:
            abilitiesRaw = file.read()
        abilitiesData = pyjson5.loads(abilitiesRaw)

    # Load Moves
    if os.path.exists("stats/moves.json"):
        with open('stats/moves.json', 'r', encoding="utf8") as file:
            movesRaw = file.read()
        movesData = pyjson5.loads(movesRaw)
    
    # Load Pokedex
    if os.path.exists("stats/pokedex.json"):
        with open('stats/pokedex.json', 'r', encoding="utf8") as file:
            pokedexRaw = file.read()
        pokedexData = pyjson5.loads(pokedexRaw)

def top_data_list(data,pokemon,cat):
    if not data.get(pokemon,False):
        return []
    if cat=="Stats":
        word = pokemon.lower()
        possibilities = pokedexData.keys()
        normalized_possibilities = {p.lower(): p for p in possibilities}
        result = difflib.get_close_matches(word, normalized_possibilities.keys(),10)
        normalized_result = [normalized_possibilities[r] for r in result]
        if len(normalized_result)>0:
            close = normalized_result[0]
            pokeSearch = close
        else:
            return []
        statData = pokedexData[pokeSearch]["baseStats"]
        return [statData["hp"],
               statData["atk"],
               statData["def"],
               statData["spa"],
               statData["spd"],
               statData["spe"]]
    totalCount = sum(list(data[pokemon]["Abilities"].values()))
    if cat=="Natures":
        dataPokemon = {}
        for spread in data[pokemon]["Spreads"]:
            nature = spread.split(':')[0]
            weight = data[pokemon]["Spreads"][spread]
            dataPokemon[nature] = dataPokemon.get(nature,0) + weight
    else:
        dataPokemon = data[pokemon][cat]

    if cat=="Checks and Counters":
        filtered_counters = {key: value for key, value in dataPokemon.items() if (value[2] < 0.01 and value[1] > 0.5)}
        catSorted = sorted(filtered_counters.keys(), key=lambda x: filtered_counters[x][1], reverse=True)
        catSorted = [[poke,round(dataPokemon[poke][1]*100,3)] for poke in catSorted ][:10]
        return catSorted
    if cat=="Moves":
        catSorted = sorted(dataPokemon.keys(), key=lambda x: dataPokemon[x], reverse=True)
        catSorted = [[movesData.get(poke,{"name": "Nothing"})["name"],round(dataPokemon[poke]/totalCount*100,3)] for poke in catSorted ][:10]
        return catSorted
    if cat=="Items":
        catSorted = sorted(dataPokemon.keys(), key=lambda x: dataPokemon[x], reverse=True)
        catSorted = [[itemData.get(poke,{"name": "Nothing"})["name"],round(dataPokemon[poke]/totalCount*100,3)] for poke in catSorted ][:10]
        return catSorted
    if cat=="Abilities":
        catSorted = sorted(dataPokemon.keys(), key=lambda x: dataPokemon[x], reverse=True)
        catSorted = [[abilitiesData.get(poke,{"name": "Unknown"})["name"],round(dataPokemon[poke]/totalCount*100,3)] for poke in catSorted ][:10]
        return catSorted
    
    catSorted = sorted(dataPokemon.keys(), key=lambda x: dataPokemon[x], reverse=True)
    catSorted = [[poke,round(dataPokemon[poke]/totalCount*100,3)] for poke in catSorted ][:10]
    return catSorted


safe_load_files()

@app.route('/', methods=['GET', 'POST'])
def index():
    rating = "0"
    meta = "gen9vgc2023regulatione"
    selected_pokemon = ""
    valid_ratings = ["0","1500","1630","1760"]

    selected_meta = request.form.get('meta_value',meta)
    selected_pokemon = request.form.get('pokemon_value',selected_pokemon)
    selected_rating = request.form.get('rating_value',rating)
    valid_ratings = request.form.get('valid_ratings',valid_ratings)

    print(selected_meta,selected_rating,selected_pokemon)
    if (selected_meta in meta_games_list):
        meta = selected_meta
    valid_ratings = get_valid_ratings(meta)
    
    if (selected_rating in valid_ratings):
        rating = selected_rating 
    else:
        rating = valid_ratings[-1]
        selected_rating = valid_ratings[-1]
    
    pokemonData = getPokemonData(meta,rating)

    pokeSearch = ""
    if selected_pokemon:
        word = selected_pokemon.lower()
        possibilities = pokemonData.keys()
        normalized_possibilities = {p.lower(): p for p in possibilities}
        result = difflib.get_close_matches(word, normalized_possibilities.keys(),10)
        normalized_result = [normalized_possibilities[r] for r in result]
        if len(normalized_result)>0:
            close = normalized_result[0]
            pokeSearch = close
        else:
            pokeSearch = ""

    pokemon_base_stats = top_data_list(pokemonData,pokeSearch,"Stats")
    pokemon_moves = top_data_list(pokemonData,pokeSearch,"Moves")
    pokemon_teammates = top_data_list(pokemonData,pokeSearch,"Teammates")
    pokemon_items = top_data_list(pokemonData,pokeSearch,"Items")
    pokemon_abilities = top_data_list(pokemonData,pokeSearch,"Abilities")
    pokemon_spreads = top_data_list(pokemonData,pokeSearch,"Spreads")
    pokemon_natures = top_data_list(pokemonData,pokeSearch,"Natures")
    pokemon_counters = top_data_list(pokemonData,pokeSearch,"Checks and Counters")

    pokemon_top_usage = list(sorted(pokemonData.keys(), key=lambda x: pokemonData[x]["usage"], reverse=True))
    pokemon_top_usage = [[poke,round(pokemonData[poke]["usage"]*100,2)] for poke in pokemon_top_usage]
    return render_template('index.html', 
                           pokemon_names=pokemon_top_usage,
                           meta_games=meta_games_list,
                           selected_meta=selected_meta,
                           selected_pokemon=selected_pokemon,
                           selected_rating=selected_rating,
                           pokemon_base_stats=pokemon_base_stats,
                           pokemon_moves=pokemon_moves,
                           pokemon_teammates=pokemon_teammates,
                           pokemon_items=pokemon_items,
                           pokemon_abilities=pokemon_abilities,
                           pokemon_spreads=pokemon_spreads,
                           pokemon_natures=pokemon_natures,
                           pokemon_counters=pokemon_counters,
                           current_pokemon = pokeSearch,
                           valid_ratings = valid_ratings)

