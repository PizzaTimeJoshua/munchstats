import difflib
import gzip
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
    session = requests.Session()
    for url in urls:
        listing = session.get(url)
        if listing.status_code == 200:
            print(f"Getting stats from {url}")
            soup = BeautifulSoup(listing.text, "html.parser")
            links = soup.find_all("a", href=True)
            # Smogon serves the chaos files gzipped; fall back to plain JSON for
            # older months that still have it. Only fetch one copy per format.
            hrefs = [link["href"] for link in links]
            plain = {h for h in hrefs if h.endswith(".json")}
            targets = [h for h in hrefs if h.endswith(".json.gz") and h[:-3] not in plain]
            targets += sorted(plain)
            for href in targets:
                print(f"Downloading {href}...")
                response = session.get(url + href)
                if response.status_code != 200:
                    print(f"  Failed ({response.status_code}), skipping.")
                    continue
                if href.endswith(".gz"):
                    text = gzip.decompress(response.content).decode("utf-8")
                    name = href[:-3]
                else:
                    text = response.text
                    name = href
                with open(
                    f"stats/{year}-{month}-{name}", "w", encoding="utf-8"
                ) as file:
                    file.write(text)
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


# A learnset source string is generation + method letter + an optional number:
# "9M" = Gen 9 TM, "9L30" = Gen 9 by level-up at 30, "9E" = Gen 9 egg move.
# Methods seen with a Gen 9 tag: M=TM, L=level-up, E=egg, S=event, R=reminder.
# All five are obtainable in SV, so all five count as "can learn". A source
# without a leading 9 is a past-generation entry and is dropped -- that filter
# is the whole reason transfer-only moves do not leak into the index.
#
# The trailing number means different things per method and only means "level"
# after L. After S it is an index into the entry's eventData array, so it is
# discarded: printing "Event 11" next to a move would read as a level and be
# wrong. Incineroar is the case that makes this concrete -- its own Fake Out
# entry is "7S0", a Gen 7 event, which the gen filter drops; the move is legal
# in SV only because Litten learns it as "9E" and it survives evolution.
LEARNSET_SOURCE_LABEL = {
    "M": "TM", "L": "Level", "E": "Egg", "S": "Event", "R": "Reminder",
}
LEARNSET_KEEPS_LEVEL = {"L"}
# Formes that exist only outside the Gen 9 games (Gmax, CAP, LGPE, and every
# past-generation-only species).
LEARNSET_SKIP_NONSTANDARD = {"Past", "Future", "CAP", "LGPE", "Custom"}

# Megas and Primals are the exception to that skip. Showdown marks them
# "Past" because SV has no Mega Evolution, but draft leagues draft them
# constantly and the site's own default format is a Champions regulation
# where they are legal via held stones. They never carry a learnset of their
# own in any generation -- a Mega's movepool IS its base forme's -- so the
# baseSpecies fallback already produces the right answer, and a Mega whose
# base has no Gen 9 movepool drops out on its own. Their stats, typing and
# ability still come from their own dex entry, which is the whole reason to
# list them separately.
LEARNSET_KEEP_FORMES = ("Mega", "Primal")


def _to_id(name):
    """Showdown's toID(): lowercase, strip everything but a-z0-9."""
    return re.sub(r"[^a-z0-9]", "", (name or "").lower())


def buildLearnsets(gen="9", mode="gen9"):
    """Build a learnset index -- who can learn what.

    Two indexes are produced, because draft leagues run both rule sets and
    they disagree about which Pokemon exist at all:

      mode="gen9"    stats/learnsets_gen9.json -- the Scarlet/Violet dex, with
                     only Gen 9 move sources. Correct for VGC and any SV
                     ladder format.
      mode="natdex"  stats/learnsets_natdex.json -- National Dex: every
                     species, with moves from any generation. Runerigus,
                     Mr. Rime, Obstagoon and Cursola are not in SV at all, so
                     a Gen 9 index has nothing to say about them, but they are
                     drafted constantly in National Dex leagues.

    The two are kept as separate files rather than one file with per-move
    generation tags. A draft is played under one rule set at a time, so the
    useful thing is an index that is internally consistent and can be named
    in the UI -- not a merged one that has to be re-filtered on every query
    and can quietly answer under the wrong rules.

    Source is Showdown's published learnsets.json, which lists every move a
    species has ever learned tagged with the generation and method it came
    from ("9M" = Gen 9 TM, "8L30" = Gen 8 at level 30). In gen9 mode only the
    tags for this generation are kept, and that is what makes the answer
    trustworthy: a move that exists solely as an "8M" entry cannot be brought
    into SV, and a tool that reported it would be worse than no tool at all.
    In natdex mode every generation counts, which is the National Dex rule --
    a transferred Pokemon keeps what it could learn where it came from.

    Two inheritance rules are applied, both of them load-bearing:

      prevo        An evolution keeps everything its pre-evolutions could
                   learn. Incineroar's Fake Out is an egg move on Litten.
      baseSpecies  A forme with no Gen 9 movepool of its own shares its base
                   forme's. This fallback fires on an entry that yields *no
                   Gen 9 moves*, not merely on a missing entry -- every
                   Therian forme has an entry carrying only pre-Gen-9 sources,
                   so testing presence alone silently left Tornadus-Therian
                   with an empty movepool.

    The fallback deliberately does not merge: a forme that does have its own
    Gen 9 moves keeps them and never consults the base. That is what stops
    Wicked Blow and Surging Strikes leaking across the two Urshifu formes,
    and Glacial Lance across the two Calyrex formes.

    Moves are interned into a shared list and referenced by index, which takes
    the file from a few megabytes to a few hundred kilobytes -- it is loaded
    whole at request time, so the size is worth the small indirection.
    """
    print("Getting learnset data.")
    url = "https://play.pokemonshowdown.com/data/learnsets.json"
    raw = json.loads(requests.get(url, timeout=120).text)

    with open("stats/pokedex.json", "r", encoding="utf-8") as f:
        dex = pyjson5.loads(f.read())

    memo = {}

    natdex = mode == "natdex"

    natdex = mode == "natdex"

    # Pools are carried as {move id: (generation, {method tokens})} and only
    # rendered to a string at the end. Merging needs the generation as a
    # number to compare, and folding it into the token string first would
    # mean parsing it back out on every merge.
    def own(sid):
        """The in-scope slice of one species' OWN learnset entry. No fallback."""
        out = {}
        learnset = (raw.get(sid) or {}).get("learnset") or {}
        for move_id, sources in learnset.items():
            best_gen, tokens = None, set()
            for s in sources:
                if not s[:1].isdigit():
                    continue
                if not natdex and s[:1] != gen:
                    continue
                method = s[1:2]
                if method not in LEARNSET_SOURCE_LABEL:
                    continue
                # A move can come from several generations. The newest is the
                # honest label: that is the game a set would actually be built
                # in, and older entries are the same move by transfer.
                src_gen = int(s[:1])
                if best_gen is not None and src_gen < best_gen:
                    continue
                if best_gen is None or src_gen > best_gen:
                    best_gen, tokens = src_gen, set()
                rest = s[2:]
                tokens.add(method + rest
                           if method in LEARNSET_KEEPS_LEVEL and rest
                           else method)
            if tokens:
                out[move_id] = (best_gen, tokens)
        return out

    def merge_into(pool, other):
        """Union two pools, keeping the newer generation's methods per move."""
        for move_id, (src_gen, tokens) in other.items():
            have = pool.get(move_id)
            if have is None:
                pool[move_id] = (src_gen, set(tokens))
            elif src_gen > have[0]:
                pool[move_id] = (src_gen, set(tokens))
            elif src_gen == have[0]:
                have[1].update(tokens)
        return pool

    def render(pool):
        """Serialise {move: (gen, tokens)} to the on-disk string form."""
        out = {}
        for move_id, (src_gen, tokens) in pool.items():
            # Lowest level first, bare methods ahead of levelled ones, so the
            # rendered hint reads "TM, Level 30".
            label = ",".join(sorted(
                tokens, key=lambda t: (t[0], int(t[1:] or 0))))
            # Natdex entries carry the generation, so a move only reachable by
            # transfer from an older game can be seen to be one.
            out[move_id] = f"g{src_gen}:{label}" if natdex else label
        return out

    def resolve(sid):
        if sid in memo:
            return memo[sid]
        memo[sid] = {}  # guards against a malformed prevo or forme cycle
        pool = own(sid)
        if not pool:
            # No Gen 9 moves of its own: this is a forme that shares its base
            # forme's movepool (a Mega, a Therian, an Ogerpon mask). Take the
            # base's FULLY RESOLVED pool, not just its own entry -- the base's
            # pre-evolution moves belong to the forme too, and reading only
            # the base entry silently cost Mega Charizard the seven moves
            # Charmander and Charmeleon pass up to Charizard.
            base = (dex.get(sid) or {}).get("baseSpecies")
            base_id = _to_id(base) if base else None
            if base_id and base_id != sid:
                pool = dict(resolve(base_id))
                memo[sid] = pool
                return pool
        prevo = (dex.get(sid) or {}).get("prevo")
        if prevo:
            merge_into(pool, resolve(_to_id(prevo)))
        memo[sid] = pool
        return pool

    move_index = {}

    def intern(move_id):
        if move_id not in move_index:
            move_index[move_id] = len(move_index)
        return move_index[move_id]

    # National Dex still excludes the things that are not real Pokemon in any
    # game -- CAP creations, Let's Go exclusives and Gmax formes, which are a
    # battle state rather than a drafted species.
    skip = {"CAP", "Custom", "Future", "LGPE"} if natdex else LEARNSET_SKIP_NONSTANDARD

    pokemon = {}
    borrowed = []
    for sid, entry in dex.items():
        forme = entry.get("forme") or ""
        if forme.startswith("Gmax"):
            continue
        is_kept_forme = forme.startswith(LEARNSET_KEEP_FORMES)
        if entry.get("isNonstandard") in skip and not is_kept_forme:
            continue
        if is_kept_forme:
            borrowed.append(sid)
        pool = resolve(sid)
        if not pool:
            continue
        rendered = render(pool)
        # Sorted by index so the file diffs cleanly between data refreshes.
        pokemon[sid] = sorted(
            [intern(move_id), letters] for move_id, letters in rendered.items()
        )

    out = {
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "gen": None if natdex else int(gen),
        "mode": mode,
        "source": url,
        "sourceLabels": LEARNSET_SOURCE_LABEL,
        "count": len(pokemon),
        "moves": [m for m, _ in sorted(move_index.items(), key=lambda kv: kv[1])],
        # Formes whose movepool is their base forme's rather than their own,
        # so a reader can be told that rather than left to assume otherwise.
        "inheritsMovepool": sorted(s for s in borrowed if s in pokemon),
        "pokemon": pokemon,
    }
    path = ("stats/learnsets_natdex.json" if natdex
            else f"stats/learnsets_gen{gen}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"  Wrote {mode} movepools for {len(pokemon)} Pokemon "
          f"({len(move_index)} distinct moves, "
          f"{len(out['inheritsMovepool'])} borrowing a base forme's).")


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


def updateChampionsIndex():
    """Build the static half of the Champions in-game index from public data.

    The live index used to come from championsbattledata.com, which stopped
    updating and whose terms do not allow republishing it. Everything static in
    it turns out to be reconstructible from sources that are already public:

      types       identical to the standard dex for all 236 species
      baseStats   the standard dex with HP +75 and every other stat +20
      movepools   Showdown's own champions mod learnsets

    The +75/+20 rule was checked against every species and holds exactly; the
    single apparent exception is Floette, which battles with Floette-Eternal's
    stats. Showdown's learnsets are used as published and are incomplete for
    some species, so a move missing here means "not listed by Showdown", not
    "illegal in game" -- treat it as a hint, never as proof.

    Usage (ranks, moves, items, teammates, spreads) is NOT here. That is
    captured separately and merged by app.py at read time.
    """
    learnsets_url = (
        "https://raw.githubusercontent.com/smogon/pokemon-showdown/"
        "refs/heads/master/data/mods/champions/learnsets.ts"
    )
    print("Building Champions static index.")
    ts = requests.get(learnsets_url, timeout=60).text

    # Find each species block first, then look for a learnset inside it.
    # Requiring "learnset: {" immediately after the opening brace quietly
    # dropped six species: floetteeternal carries "inherit: true," first, and
    # five more are empty {} entries that inherit their base species' moves
    # (those are picked up by FORM_MOVE_SOURCE below).
    starts = [(m.group(1), m.start()) for m in re.finditer(r"^\t(\w+): \{", ts, re.M)]
    move_re = re.compile(r"^\t\t\t(\w+):", re.M)
    learnsets = {}
    for i, (sid, pos) in enumerate(starts):
        end = starts[i + 1][1] if i + 1 < len(starts) else len(ts)
        body = re.search(r"learnset: \{(.*?)\n\t\t\}", ts[pos:end], re.S)
        if body:
            learnsets[sid] = move_re.findall(body.group(1))

    with open("stats/pokedex.json", "r", encoding="utf-8") as f:
        dex = pyjson5.loads(f.read())
    with open("stats/moves.json", "r", encoding="utf-8") as f:
        moves = pyjson5.loads(f.read())

    # Champions battles Floette in its Eternal form; every other species maps
    # to its own dex entry.
    STAT_SOURCE_OVERRIDES = {"floette": "floetteeternal"}
    # Forms Champions fields that Showdown's champions learnsets do not list
    # separately, because they share their base species' movepool. Their base
    # STATS still differ (the Gourgeist sizes are the whole point of telling
    # them apart), so each takes its own dex entry and the base's moves.
    # Listed explicitly rather than generated from every form in the dex, so
    # this cannot invent a form the game does not have.
    FORM_MOVE_SOURCE = {
        "floette": "floetteeternal",
        "gourgeistsmall": "gourgeist",
        "gourgeistlarge": "gourgeist",
        "gourgeistsuper": "gourgeist",
        "mausholdfour": "maushold",
        "vivillonfancy": "vivillon",
    }
    HP_BONUS, OTHER_BONUS = 75, 20
    STAT_KEYS = [("hp", "hp"), ("attack", "atk"), ("defense", "def"),
                 ("sp_attack", "spa"), ("sp_defense", "spd"), ("speed", "spe")]

    entries = {}
    for sid, move_ids in sorted(learnsets.items()):
        src = dex.get(STAT_SOURCE_OVERRIDES.get(sid, sid)) or dex.get(sid)
        if not src:
            continue
        base = src.get("baseStats") or {}
        stats = {
            ours: base.get(theirs, 0) + (HP_BONUS if ours == "hp" else OTHER_BONUS)
            for ours, theirs in STAT_KEYS
        }
        entries[sid] = {
            "showdownId": sid,
            "showdownName": src.get("name", sid),
            "types": src.get("types") or [],
            "baseStats": stats,
            "baseStatTotal": sum(stats.values()),
            "learnableMoveNames": sorted(
                (moves.get(m) or {}).get("name", m) for m in move_ids
            ),
        }

    for form_id, move_src in FORM_MOVE_SOURCE.items():
        if form_id in entries:
            continue
        # Honour the stat override here too: Floette's moves come from the
        # Eternal entry and so must its stats, or it lands on the ordinary
        # Floette line and every number is wrong.
        src = dex.get(STAT_SOURCE_OVERRIDES.get(form_id, form_id))
        move_ids = learnsets.get(move_src) or learnsets.get(form_id)
        if not src or not move_ids:
            continue
        base = src.get("baseStats") or {}
        stats = {
            ours: base.get(theirs, 0) + (HP_BONUS if ours == "hp" else OTHER_BONUS)
            for ours, theirs in STAT_KEYS
        }
        entries[form_id] = {
            "showdownId": form_id,
            "showdownName": src.get("name", form_id),
            "types": src.get("types") or [],
            "baseStats": stats,
            "baseStatTotal": sum(stats.values()),
            "learnableMoveNames": sorted(
                (moves.get(m) or {}).get("name", m) for m in move_ids
            ),
            "movesFrom": move_src,
        }

    out = {
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "source": "Showdown champions mod learnsets + standard dex (HP+75, others+20)",
        "count": len(entries),
        "pokemon": entries,
    }
    with open("stats/champions_index_static.json", "w", encoding="utf-8") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"  Wrote static index for {len(entries)} Pokemon.")


if __name__ == "__main__":
    updateData()
    buildLearnsets(mode="gen9")
    buildLearnsets(mode="natdex")
    updateImage()
    updateMetagames()
    splitMetagameFiles()
    generate_trend_data()
    generateFormatList()
    updateChampionsMods()
    updateChampionsIndex()
    print("Update done.")
