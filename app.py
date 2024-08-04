
from flask import Flask, render_template, request, redirect, url_for
import os
import pyjson5
from datetime import datetime
import difflib
import re

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
        print("Warning, Usage Stats outdated.")

    return pokemonData
def getTeraData(meta,poke):
    if os.path.exists(f"stats/tera-data-{meta}.json"):
        with open(f"stats/tera-data-{meta}.json",'rb') as file:
            teraData = pyjson5.load(file)
    else:
        teraData = {}
    return teraData.get(poke,{})

def extract_gen(s):
    """Extract the generation number from the string."""
    val = s.split("-")[2].split("gen")[1].split("1v1")[0].split("2v2")[0].split("350")[0]
    val = int(re.findall(r'\d+', val)[0]) if re.findall(r'\d+', val) else None
    return val

def sort_files_by_gen_and_size(files):
    """Sort the list of files by generation and size."""
    files_info = [(f, extract_gen(f), os.path.getsize(f)) for f in files]
    sorted_files = sorted(files_info, key=lambda x: (-x[1], -x[2]))
    return [f[0] for f in sorted_files]

def get_valid_ratings(meta):
    valid_rates = ["stats/"+f for f in os.listdir("stats/") if meta in f.split("-")]
    valid_rates = [f.split("-")[-1] for f in valid_rates]
    valid_rates = [f.split(".")[0] for f in valid_rates]
    valid_rates.sort(key=int)
    return valid_rates
    

def safe_load_files():
    global itemData, movesData, abilitiesData, pokedexData, meta_games_list, indexData, meta_names
    # Load Meta Names
    if os.path.exists("stats/meta_names.json"):
        with open('stats/meta_names.json', 'r') as file:
            meta_names = pyjson5.load(file)
    meta_games_list = ["stats/"+f for f in os.listdir("stats/") if f.split("-")[-1] == "0.json"]
    meta_games_list = sort_files_by_gen_and_size(meta_games_list)
    meta_games_list = [f.split("-")[-2] for f in meta_games_list]
    meta_games_list = [[meta,meta_names[meta]] for meta in meta_games_list if meta_names.get(meta,False)]
   

    # Load Sprite Index
    if os.path.exists("stats/forms_index.json"):
        with open('stats/forms_index.json', 'r', encoding="utf8") as file:
            indexRaw = file.read()
        indexData = pyjson5.loads(indexRaw)

    # Load Items
    if os.path.exists("stats/items.json"):
        with open('stats/items.json', 'r', encoding="utf8") as file:
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
    totalCount = sum(list(data[pokemon].get("Abilities",{"Unknown":1}).values()))
    if cat=="Natures":
        dataPokemon = {}
        datSpread = data[pokemon].get("Spreads",[])
        for spread in datSpread:
            nature = spread.split(':')[0]
            weight = data[pokemon]["Spreads"][spread]
            dataPokemon[nature] = dataPokemon.get(nature,0) + weight
    else:
        dataPokemon = data[pokemon].get(cat,{})

    if cat=="EVs":
        dataPokemon = {"atk" : {},"spa" : {},"spe" : {},"hp_def" : {},"hp_spd" : {}}
        datSpread = data[pokemon].get("Spreads",[])
        attack_natures = ["Naughty","Adamant","Lonely","Brave"]
        defense_natures = ["Bold","Relaxed","Impish","Lax"]
        sattack_natures = ["Modest","Mild","Quiet","Rash"]
        sdefense_natures = ["Calm","Gentle","Sassy","Careful"]
        speed_natures = ["Timid","Hasty","Jolly","Naive"]

        attack_natures_m = ["Bold","Timid","Modest","Calm"]
        defense_natures_m = ["Lonely","Hasty","Mild","Gentle"]
        sattack_natures_m = ["Adamant","Impish","Jolly","Careful"]
        sdefense_natures_m = ["Naughty","Lax","Naive","Rash"]
        speed_natures_m = ["Brave","Relaxed","Quiet","Sassy"]

        for spread in datSpread:
            nature = spread.split(':')[0]
            EVs = spread.split(':')[1].split('/')
            weight = data[pokemon]["Spreads"][spread]
            pa  = "+" if nature in attack_natures else ""
            pd  = "+" if nature in defense_natures else ""
            psa  = "+" if nature in sattack_natures else ""
            psd = "+" if nature in sdefense_natures else ""
            pse = "+" if nature in speed_natures else ""

            pa  = "-" if nature in attack_natures_m else pa
            pd  = "-" if nature in defense_natures_m else pd
            psa  = "-" if nature in sattack_natures_m else psa
            psd = "-" if nature in sdefense_natures_m else psd
            pse = "-" if nature in speed_natures_m else pse


            dataPokemon["atk"][EVs[1]+pa+" Atk"] = dataPokemon["atk"].get(EVs[1]+pa+" Atk",0) + weight
            dataPokemon["spa"][EVs[3]+psa+" SpA"] = dataPokemon["spa"].get(EVs[3]+psa+" SpA",0) + weight
            dataPokemon["spe"][EVs[5]+pse+" Spe"] = dataPokemon["spe"].get(EVs[5]+pse+" Spe",0) + weight
            dataPokemon["hp_def"][EVs[0]+" HP / "+EVs[2]+pd+" Def"] = dataPokemon["hp_def"].get(EVs[0]+" HP / "+EVs[2]+pd+" Def",0) + weight
            dataPokemon["hp_spd"][EVs[0]+" HP / "+EVs[4]+psd+" SpD"] = dataPokemon["hp_spd"].get(EVs[0]+" HP / "+EVs[4]+psd+" SpD",0) + weight


        catSorted = [[],[],[],[],[],[]]

        catSorted[0] = sorted(dataPokemon["atk"].keys(), key=lambda x: dataPokemon["atk"][x], reverse=True)[:15]
        catSorted[0] = [[stat,"{:.3f}".format(round(dataPokemon["atk"][stat]/totalCount*100,3))] for stat in catSorted[0] ]

        catSorted[1] = sorted(dataPokemon["spa"].keys(), key=lambda x: dataPokemon["spa"][x], reverse=True)[:15]
        catSorted[1] = [[stat,"{:.3f}".format(round(dataPokemon["spa"][stat]/totalCount*100,3))] for stat in catSorted[1] ]

        catSorted[2] = sorted(dataPokemon["spe"].keys(), key=lambda x: dataPokemon["spe"][x], reverse=True)[:15]
        catSorted[2] = [[stat,"{:.3f}".format(round(dataPokemon["spe"][stat]/totalCount*100,3))] for stat in catSorted[2] ]

        catSorted[3] = sorted(dataPokemon["hp_def"].keys(), key=lambda x: dataPokemon["hp_def"][x], reverse=True)[:15]
        catSorted[3] = [[stat,"{:.3f}".format(round(dataPokemon["hp_def"][stat]/totalCount*100,3))] for stat in catSorted[3] ]

        catSorted[4] = sorted(dataPokemon["hp_spd"].keys(), key=lambda x: dataPokemon["hp_spd"][x], reverse=True)[:15]
        catSorted[4] = [[stat,"{:.3f}".format(round(dataPokemon["hp_spd"][stat]/totalCount*100,3))] for stat in catSorted[4] ]
        
        return catSorted

        
    if cat=="Checks and Counters":
        filtered_counters = {key: value for key, value in dataPokemon.items() if (value[2] < 0.01 and value[1] > 0.5)}
        catSorted = sorted(filtered_counters.keys(), key=lambda x: filtered_counters[x][1], reverse=True)[:10]
        catSorted = [[poke,"{:.3f}".format(round(dataPokemon[poke][1]*100,3)), get_sprite_pokemon(poke)] for poke in catSorted ]
        return catSorted
    if cat=="Moves":
        catSorted = sorted(dataPokemon.keys(), key=lambda x: dataPokemon[x], reverse=True)[:10]
        catSorted = [[movesData.get(poke,{"name": "Nothing"})["name"],"{:.3f}".format(round(dataPokemon[poke]/totalCount*100,3)),
                      movesData.get(poke, {"type" : ""}).get("type","")+" ("+movesData.get(poke, {"category" : ""}).get("category","")+")"+
                      '\nBase Power: '+f'{"N/A" if movesData.get(poke, {"basePower" : "N/A"}).get("basePower","N/A")==0 else movesData.get(poke, {"basePower" : "N/A"}).get("basePower","N/A")}'+
                      " Accuracy: "+f"{"N/A" if movesData.get(poke, {"accuracy" : "N/A"}).get("accuracy","N/A")==True else movesData.get(poke, {"accuracy" : "N/A"}).get("accuracy","N/A")}"+
                      '\nPriority: '+f'{movesData.get(poke, {"priority" : 0}).get("priority",0)}'+
                      '\n'+movesData.get(poke, {"desc" : "No info."}).get("desc","No info.")] for poke in catSorted ]
        return catSorted
    if cat=="Items":
        catSorted = sorted(dataPokemon.keys(), key=lambda x: dataPokemon[x], reverse=True)[:10]
        catSorted = [[itemData.get(poke,{"name": "Nothing"})["name"],"{:.3f}".format(round(dataPokemon[poke]/totalCount*100,3)), itemData.get(poke, {"desc" : "No info."}).get("desc","No info."),(divmod(itemData.get(poke, {"spritenum" : 0})["spritenum"],16))] for poke in catSorted ]
        return catSorted
    if cat=="Abilities":
        catSorted = sorted(dataPokemon.keys(), key=lambda x: dataPokemon[x], reverse=True)[:10]
        catSorted = [[abilitiesData.get(poke,{"name": "Unknown"})["name"],"{:.1f}".format(round(dataPokemon[poke]/totalCount*100,1)),abilitiesData.get(poke, {"desc" : "No info."}).get("desc","No info.")] for poke in catSorted ]
        return catSorted
    if cat=="Teammates":
        catSorted = sorted(dataPokemon.keys(), key=lambda x: dataPokemon[x], reverse=True)[:10]
        catSorted = [[poke,"{:.3f}".format(round(dataPokemon[poke]/totalCount*100,3)), get_sprite_pokemon(poke)] for poke in catSorted ]
        return catSorted
    if cat=="Spreads":
        catSorted = sorted(dataPokemon.keys(), key=lambda x: dataPokemon[x], reverse=True)
        catSorted = catSorted[:15]
        catSorted = [[poke,"{:.3f}".format(round(dataPokemon[poke]/totalCount*100,3))] for poke in catSorted]
        return catSorted
    
    catSorted = sorted(dataPokemon.keys(), key=lambda x: dataPokemon[x], reverse=True)[:10]
    catSorted = [[poke,"{:.3f}".format(round(dataPokemon[poke]/totalCount*100,3))] for poke in catSorted ]
    return catSorted

def get_sprite_pokemon(poke):
    word = poke.lower()
    word = re.sub(r'[^a-z0-9]+', '', word)
    if word in indexData.keys():
        sprite_num = indexData[word]
    elif word in pokedexData.keys():
        sprite_num = pokedexData[word].get("num",0)
    else:
        return (0,0)
    return divmod(sprite_num,12)
    
safe_load_files()


@app.route('/<meta_name>/<meta_rating>/<pokemon_name>')
@app.route('/<meta_name>/<meta_rating>/')
@app.route('/<meta_name>/')
def show_page_pokemon(meta_name,meta_rating="",pokemon_name=""):
    rating = "0"
    meta = "gen9vgc2024regh"

    selected_rating = meta_rating
    selected_meta = f"{[meta_name,meta_names.get(meta_name,meta_name)]}"
    selected_pokemon = pokemon_name

    try:
        selected_meta = pyjson5.loads(selected_meta)
    except pyjson5.Json5IllegalCharacter:
        selected_meta = [meta,meta_names.get(meta,meta)]

    
    if (selected_meta[0] in meta_names.keys()):
        meta = selected_meta[0]
    valid_ratings = get_valid_ratings(meta)

    if (selected_rating in valid_ratings):
        rating = selected_rating 
    else:
        rating = valid_ratings[-1]
        selected_rating = valid_ratings[-1]


    pokemonData = getPokemonData(meta,rating)

    pokemon_top_usage = list(sorted(pokemonData.keys(), key=lambda x: pokemonData[x]["usage"], reverse=True))
    try:
        pokeSearch = pokemon_top_usage[0]
    except IndexError:
        pokeSearch = ""
        
    if selected_pokemon != "No Pokemon":
        word = selected_pokemon.lower()
        possibilities = pokemonData.keys()
        normalized_possibilities = {p.lower(): p for p in possibilities}
        result = difflib.get_close_matches(word, normalized_possibilities.keys(),10)
        normalized_result = [normalized_possibilities[r] for r in result]
        if len(normalized_result)>0:
            close = normalized_result[0]
            pokeSearch = close
    print((selected_meta),selected_rating,selected_pokemon)
    if (meta != meta_name):
        print("Incorrect Meta")
        return redirect(url_for('show_page_pokemon',
                            meta_name=meta,
                            meta_rating=rating,
                            pokemon_name=pokeSearch))

    if (rating != meta_rating):
        print("Incorrect Rating")
        return redirect(url_for('show_page_pokemon',
                            meta_name=meta,
                            meta_rating=rating,
                            pokemon_name=pokeSearch))

    if (pokeSearch != selected_pokemon):
        print("Incorrect Pokemon")
        return redirect(url_for('show_page_pokemon',
                            meta_name=meta,
                            meta_rating=rating,
                            pokemon_name=pokeSearch))

    try:
        rank = pokemon_top_usage.index(pokeSearch) + 1
    except ValueError:
        rank = "N/A"

    try:
        use = round(pokemonData[pokeSearch]["usage"]*100,2)
    except ValueError:
        use = "N/A"

    pokemon_top_usage = [[poke,"{:.2f}".format(round(pokemonData[poke]["usage"]*100,2)),get_sprite_pokemon(poke)] for poke in pokemon_top_usage]
    


    current_pokemon = [pokeSearch,use,rank,get_sprite_pokemon(pokeSearch)]

    pokemon_base_stats = top_data_list(pokemonData,pokeSearch,"Stats")
    pokemon_moves = top_data_list(pokemonData,pokeSearch,"Moves")
    pokemon_teammates = top_data_list(pokemonData,pokeSearch,"Teammates")
    pokemon_items = top_data_list(pokemonData,pokeSearch,"Items")
    pokemon_abilities = top_data_list(pokemonData,pokeSearch,"Abilities")
    pokemon_spreads = top_data_list(pokemonData,pokeSearch,"Spreads")
    pokemon_natures = top_data_list(pokemonData,pokeSearch,"Natures")
    pokemon_evs = top_data_list(pokemonData,pokeSearch,"EVs")
    pokemon_counters = top_data_list(pokemonData,pokeSearch,"Checks and Counters")

    dictTera = getTeraData(meta,pokeSearch)
    total_tera = sum(list(dictTera.values()))
    listTera = [(tera,round(dictTera[tera]/total_tera*100,2)) for tera in dictTera.keys()]
    listTera.sort(key=lambda x: x[1],reverse=True)
    listTera = [(tera[0],"{:.2f}".format(tera[1])) for tera in listTera]


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
                           pokemon_evs=pokemon_evs,
                           pokemon_counters=pokemon_counters,
                           current_pokemon = current_pokemon,
                           valid_ratings = valid_ratings,
                           tera_data = listTera)

@app.route('/search_pokemon', methods=['POST'])
def search_pokemon():
    meta = "gen9vgc2024regh"
    selected_meta = request.form.get('meta_value',f"{[meta,meta_names.get(meta,meta)]}")
    selected_pokemon = request.form.get('pokemon_value',"No Pokemon")
    selected_rating = request.form.get('rating_value',"No Rating")
#
    try:
        selected_meta = pyjson5.loads(selected_meta)
    except pyjson5.Json5IllegalCharacter:
        selected_meta = [meta,meta_names.get(meta,meta)]

    
    if (selected_meta[0] in meta_names.keys()):
        meta = selected_meta[0]
    valid_ratings = get_valid_ratings(meta)

    if (selected_rating in valid_ratings):
        rating = selected_rating 
    else:
        rating = valid_ratings[-1]
        selected_rating = valid_ratings[-1]


    pokemonData = getPokemonData(meta,rating)

    pokemon_top_usage = list(sorted(pokemonData.keys(), key=lambda x: pokemonData[x]["usage"], reverse=True))
    try:
        pokeSearch = pokemon_top_usage[0]
    except IndexError:
        pokeSearch = ""
        
    if selected_pokemon != "No Pokemon":
        word = selected_pokemon.lower()
        possibilities = pokemonData.keys()
        normalized_possibilities = {p.lower(): p for p in possibilities}
        result = difflib.get_close_matches(word, normalized_possibilities.keys(),10)
        normalized_result = [normalized_possibilities[r] for r in result]
        if len(normalized_result)>0:
            close = normalized_result[0]
            pokeSearch = close
    if (meta != selected_meta[0]):
        print("Incorrect Meta")

    if (rating != selected_rating):
        print("Incorrect Rating")

    if (pokeSearch != selected_pokemon):
        print("Incorrect Pokemon")
#
    
    return redirect(url_for('show_page_pokemon',
                            meta_name=meta,
                            meta_rating=rating,
                            pokemon_name=pokeSearch))

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/', methods=['GET'])
def index():
    rating = "0"
    meta = "gen9vgc2024regh"
    selected_pokemon = ""
    valid_ratings = ["0","1500","1760"]

    selected_meta = request.form.get('meta_value',f"{[meta,meta_names.get(meta,meta)]}")
    selected_pokemon = request.form.get('pokemon_value',"No Pokemon")
    selected_rating = request.form.get('rating_value',"No Rating")
    valid_ratings = request.form.get('valid_ratings',valid_ratings)

    try:
        selected_meta = pyjson5.loads(selected_meta)
    except pyjson5.Json5IllegalCharacter:
        selected_meta = [meta,meta_names.get(meta,meta)]

    print((selected_meta[1]),selected_rating,selected_pokemon)
    if (selected_meta[0] in meta_names.keys()):
        meta = selected_meta[0]
    valid_ratings = get_valid_ratings(meta)

    if (selected_rating in valid_ratings):
        rating = selected_rating 
    else:
        rating = valid_ratings[-1]
        selected_rating = valid_ratings[-1]
    
    pokemonData = getPokemonData(meta,rating)

    pokemon_top_usage = list(sorted(pokemonData.keys(), key=lambda x: pokemonData[x]["usage"], reverse=True))
    try:
        pokeSearch = pokemon_top_usage[0]
    except IndexError:
        pokeSearch = ""
        
    if selected_pokemon != "No Pokemon":
        word = selected_pokemon.lower()
        possibilities = pokemonData.keys()
        normalized_possibilities = {p.lower(): p for p in possibilities}
        result = difflib.get_close_matches(word, normalized_possibilities.keys(),10)
        normalized_result = [normalized_possibilities[r] for r in result]
        if len(normalized_result)>0:
            close = normalized_result[0]
            pokeSearch = close

    try:
        rank = pokemon_top_usage.index(pokeSearch) + 1
    except ValueError:
        rank = "N/A"

    try:
        use = round(pokemonData[pokeSearch]["usage"]*100,2)
    except ValueError:
        use = "N/A"

    pokemon_top_usage = [[poke,"{:.2f}".format(round(pokemonData[poke]["usage"]*100,2)),get_sprite_pokemon(poke)] for poke in pokemon_top_usage]
    


    current_pokemon = [pokeSearch,use,rank,get_sprite_pokemon(pokeSearch)]

    pokemon_base_stats = top_data_list(pokemonData,pokeSearch,"Stats")
    pokemon_moves = top_data_list(pokemonData,pokeSearch,"Moves")
    pokemon_teammates = top_data_list(pokemonData,pokeSearch,"Teammates")
    pokemon_items = top_data_list(pokemonData,pokeSearch,"Items")
    pokemon_abilities = top_data_list(pokemonData,pokeSearch,"Abilities")
    pokemon_spreads = top_data_list(pokemonData,pokeSearch,"Spreads")
    pokemon_natures = top_data_list(pokemonData,pokeSearch,"Natures")
    pokemon_evs = top_data_list(pokemonData,pokeSearch,"EVs")
    pokemon_counters = top_data_list(pokemonData,pokeSearch,"Checks and Counters")

    dictTera = getTeraData(meta,pokeSearch)
    total_tera = sum(list(dictTera.values()))
    listTera = [(tera,round(dictTera[tera]/total_tera*100,2)) for tera in dictTera.keys()]
    listTera.sort(key=lambda x: x[1],reverse=True)
    listTera = [(tera[0],"{:.2f}".format(tera[1])) for tera in listTera]

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
                           pokemon_evs=pokemon_evs,
                           pokemon_counters=pokemon_counters,
                           current_pokemon = current_pokemon,
                           valid_ratings = valid_ratings,
                           tera_data = listTera)

if __name__ == "__main__":
    app.run(debug=True)