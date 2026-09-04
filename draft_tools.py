"""Draft-league scouting: movepool lookups across a roster, and the Speed
maths behind "how much Speed do I actually need?".

Pure functions over data already on disk (stats/learnsets_gen9.json,
stats/pokedex.json, stats/moves.json). Nothing here fetches, and nothing here
builds a team -- it reports what the numbers are and leaves the decision to
the player.
"""
import json
import os
import re
from functools import lru_cache

STATS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stats")

# Level 50 is the only level competitive doubles is played at, and singles
# draft leagues normalise to it too. Kept as a parameter anyway because the
# formula's floors land differently at 100 and it is cheap to support.
DEFAULT_LEVEL = 50


def to_id(name):
    """Showdown's toID(): lowercase, strip everything but a-z0-9."""
    return re.sub(r"[^a-z0-9]", "", (name or "").lower())


# ---------------------------------------------------------------- data loading

# Which roster a query runs against. A draft is played under one rule set, and
# the three disagree about which Pokemon exist at all -- Runerigus and Mr. Rime
# are absent from SV but present in both National Dex and Champions, while
# Rillaboom and Flutter Mane are in the first two and not in Champions. Picking
# the wrong one does not merely lose a Pokemon; in Champions it would also
# answer with the wrong base stats, since that game adds +75 HP and +20 to
# everything else.
DEXES = ("gen9", "natdex", "champions")
DEFAULT_DEX = "gen9"

# Champions gives every Pokemon perfect IVs and spends "stat points" at one
# point of stat per SP, with the nature applied last. The constants below are
# what perfect IVs (and the fixed level) contribute, folded into a single
# number -- they are part of the stat formula, not a bonus layered on top of
# it, which is why a stat at 0 SP is already base + 20. HP takes a larger
# constant and no nature, as it does on cartridge.
# Mirrors calculate_champions_stat_value/hp_value in app.py.
CHAMPIONS_HP_BONUS = 75
CHAMPIONS_STAT_BONUS = 20

_LEARNSET_FILE = {
    "gen9": "learnsets_gen9.json",
    "natdex": "learnsets_natdex.json",
}


@lru_cache(maxsize=len(DEXES))
def _load_learnset_file(dex):
    path = os.path.join(STATS_DIR, _LEARNSET_FILE[dex])
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def load_champions_index():
    """The Champions roster: its own species list, stats and movepools."""
    path = os.path.join(STATS_DIR, "champions_index_static.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def champions_megas():
    """{mega species id: base species id} for Megas playable in Champions.

    champions_index_static.json is built from the Champions mod's learnsets,
    where Mega Evolution is a held stone rather than a separate species, so
    the index lists only base formes. Champions does have Megas, though, and
    without them "Mega Charizard Y" resolved to plain Charizard -- a silently
    wrong forme, which is the one failure mode worse than saying "unknown".

    A Mega is included when its base forme is on the Champions roster. That
    catches the Champions-only additions (Mega Raichu, Mega Victreebel) as
    well as the classic ones, because Showdown's pokedex carries them all.
    """
    roster = load_champions_index()["pokemon"]
    out = {}
    for sid, entry in load_dex().items():
        if not (entry.get("forme") or "").startswith(("Mega", "Primal")):
            continue
        base_id = to_id(entry.get("baseSpecies") or "")
        if base_id in roster:
            out[sid] = base_id
    return out


@lru_cache(maxsize=len(DEXES))
def load_learnsets(dex=DEFAULT_DEX):
    """Movepools as {species id: frozenset(move id)} for one rule set.

    Held for the process lifetime: a few MB resident, which is cheaper than
    re-reading the file on every request and well inside the dyno budget.
    """
    if dex == "champions":
        pools = {
            sid: frozenset(to_id(n) for n in entry.get("learnableMoveNames") or [])
            for sid, entry in load_champions_index()["pokemon"].items()
        }
        # A Mega has never had a learnset of its own in any game; its movepool
        # is the base forme's, here as everywhere else.
        for mega_id, base_id in champions_megas().items():
            pools[mega_id] = pools[base_id]
        return pools
    data = _load_learnset_file(dex)
    moves = data["moves"]
    return {
        sid: frozenset(moves[i] for i, _ in entries)
        for sid, entries in data["pokemon"].items()
    }


@lru_cache(maxsize=len(DEXES))
def load_learnset_methods(dex=DEFAULT_DEX):
    """{species id: {move id: label}} -- how each move is learned, for hover text.

    Champions publishes a flat movepool with no method or level attached, so
    its labels are empty rather than invented.
    """
    if dex == "champions":
        methods = {
            sid: {to_id(n): "" for n in entry.get("learnableMoveNames") or []}
            for sid, entry in load_champions_index()["pokemon"].items()
        }
        for mega_id, base_id in champions_megas().items():
            methods[mega_id] = methods[base_id]
        return methods
    data = _load_learnset_file(dex)
    moves = data["moves"]
    return {
        sid: {moves[i]: letters for i, letters in entries}
        for sid, entries in data["pokemon"].items()
    }


@lru_cache(maxsize=len(DEXES))
def load_species(dex=DEFAULT_DEX):
    """{species id: {name, types, baseStats, abilities}} for one rule set.

    Champions restricts WHICH species exist, but its base stats are the
    standard dex's. The +75 HP / +20 elsewhere carried in
    champions_index_static.json are the final stats shown in game, not base
    stats, so they must not be fed to the stat formula -- doing that would
    apply the bonus twice over. They are exposed separately as
    "displayStats" for anything that wants to show the in-game number.

    Champions publishes no ability data, so abilities come from the standard
    dex in every mode.
    """
    standard = load_dex()
    if dex != "champions":
        return {sid: standard[sid] for sid in load_learnsets(dex) if sid in standard}
    out = {}
    for sid, entry in load_champions_index()["pokemon"].items():
        base = standard.get(sid)
        if not base:
            continue
        shown = entry.get("baseStats") or {}
        display = {
            "hp": shown.get("hp", 0), "atk": shown.get("attack", 0),
            "def": shown.get("defense", 0), "spa": shown.get("sp_attack", 0),
            "spd": shown.get("sp_defense", 0), "spe": shown.get("speed", 0),
        }
        # Base stats are recovered from the in-game numbers by removing the
        # flat bonus, rather than read from the standard dex. The two agree
        # for all but Floette, which Champions battles in its Eternal forme --
        # reading the plain Floette line there gives 72 Speed where the game
        # shows 112. Deriving keeps this in step with the index instead of
        # duplicating its override table.
        derived = {k: v - (CHAMPIONS_HP_BONUS if k == "hp" else CHAMPIONS_STAT_BONUS)
                   for k, v in display.items()}
        out[sid] = dict(
            base,
            name=entry.get("showdownName", base.get("name", sid)),
            types=entry.get("types") or base.get("types") or [],
            baseStats=derived,
            displayStats=display,
        )

    # Megas are absent from the Champions index (it lists the base forme and
    # treats the stone as an item), so they are added from the standard dex
    # with their own stats, typing and ability. The in-game display number is
    # assumed to follow the same rule as every other Champions species --
    # base +75 HP, +20 elsewhere -- since that rule held for all 238 of them.
    for mega_id, base_id in champions_megas().items():
        mega = load_dex().get(mega_id)
        if not mega or mega_id in out:
            continue
        stats = mega.get("baseStats") or {}
        out[mega_id] = dict(
            mega,
            name=mega.get("name", mega_id),
            baseStats=dict(stats),
            displayStats={
                k: v + (CHAMPIONS_HP_BONUS if k == "hp" else CHAMPIONS_STAT_BONUS)
                for k, v in stats.items()
            },
        )
    return out


def dex_for_format(format_code):
    """Which roster a Showdown format code implies."""
    code = (format_code or "").lower()
    if "champions" in code:
        return "champions"
    if "nationaldex" in code or "natdex" in code:
        return "natdex"
    return "gen9"


@lru_cache(maxsize=1)
def load_dex():
    with open(os.path.join(STATS_DIR, "pokedex.json"), "r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def load_moves():
    with open(os.path.join(STATS_DIR, "moves.json"), "r", encoding="utf-8") as f:
        return json.load(f)


# ------------------------------------------------------------- movepool lookup

def can_learn(species_id, move_id, dex=DEFAULT_DEX):
    return move_id in load_learnsets(dex).get(species_id, frozenset())


def coverage(species_ids, move_ids, dex=DEFAULT_DEX):
    """Which of these Pokemon learn which of these moves.

    Returned both ways round because the two questions are genuinely
    different: "what does their Incineroar bring" is answered by rows, and
    "who on their side has Fake Out" -- the question that started this -- is
    answered by columns.
    """
    pools = load_learnsets(dex)
    methods = load_learnset_methods(dex)
    by_species, by_move = {}, {move: [] for move in move_ids}
    for sid in species_ids:
        pool = pools.get(sid, frozenset())
        hits = [m for m in move_ids if m in pool]
        by_species[sid] = {m: methods.get(sid, {}).get(m, "") for m in hits}
        for m in hits:
            by_move[m].append(sid)
    return {"by_species": by_species, "by_move": by_move}


# --------------------------------------------------------- derived move groups

# Moves whose priority is granted by a condition rather than by the static
# `priority` field, so moves.json reports them at 0 and the derived list below
# cannot see them. Listed explicitly because a Fake Out scout that silently
# omitted Grassy Glide would be wrong in exactly the matchups it is for.
# The condition is carried with each one so the UI can say why it is here.
CONDITIONAL_PRIORITY = {
    "grassyglide": "+1 in Grassy Terrain",
}


def moves_with_priority(minimum=1, maximum=None, include_conditional=True):
    """Every move at or above a priority bracket.

    Derived from moves.json rather than hand-listed, so it cannot fall behind
    a new generation's additions the way a curated list would. The exception
    is moves that earn their priority from a condition -- Grassy Glide reads
    as priority 0 in the data and only becomes +1 under Grassy Terrain -- so
    those are folded back in from CONDITIONAL_PRIORITY. Prankster is not
    handled here at all: it turns every status move into a priority move, and
    that belongs in the ability column rather than in a move list.
    """
    out = []
    for move_id, m in load_moves().items():
        if m.get("isNonstandard"):
            continue
        pri = m.get("priority", 0)
        if pri >= minimum and (maximum is None or pri <= maximum):
            out.append((pri, move_id))
    ranked = [move_id for _, move_id in sorted(out, key=lambda t: (-t[0], t[1]))]
    if include_conditional and minimum <= 1:
        known = set(ranked)
        ranked += [m for m in sorted(CONDITIONAL_PRIORITY) if m not in known]
    return ranked


# Curated scouting groups. Each is the set of moves you would otherwise have
# to check one Pokemon at a time, which is the whole complaint this tool
# exists to answer. "scope" only decides ordering and the default selection --
# every group stays queryable in both singles and doubles, because a draft
# league will happily run Fake Out in singles and hazards in doubles.
PRESET_GROUPS = [
    ("fake_out", "Fake Out", "doubles", ["fakeout"]),
    # Kept deliberately tight. The dedicated speed-control moves are the ones
    # you scout for; folding every attack that happens to drop Speed in with
    # them widens the matrix until Tailwind and Trick Room are hard to find.
    # Those live in their own group below.
    ("speed_control", "Speed Control", "both", [
        "tailwind", "trickroom", "icywind", "electroweb", "bleakwindstorm",
        "thunderwave", "nuzzle", "glare", "quash", "afteryou", "stickyweb",
        "scaryface", "cottonspore", "stringshot", "tarshot",
    ]),
    ("speed_drops", "Speed-Dropping Attacks", "both", [
        "rocktomb", "bulldoze", "lowsweep", "mudshot", "drumbeating",
        "bubble", "bubblebeam", "constrict", "pounce",
    ]),
    ("redirection", "Redirection", "doubles", [
        "followme", "ragepowder", "allyswitch",
    ]),
    ("screens", "Screens", "both", ["lightscreen", "reflect", "auroraveil"]),
    ("screen_removal", "Screen / Field Removal", "both", [
        "brickbreak", "psychicfangs", "defog", "courtchange", "ragingbull",
    ]),
    ("protect", "Protect Family", "doubles", [
        "protect", "detect", "wideguard", "quickguard", "banefulbunker",
        "spikyshield", "burningbulwark", "silktrap", "kingsshield", "obstruct",
    ]),
    ("disruption", "Disruption", "both", [
        "taunt", "encore", "disable", "haze", "clearsmog", "roar", "whirlwind",
        "trick", "switcheroo", "knockoff", "torment", "spite", "partingshot",
    ]),
    ("recovery", "Recovery", "both", [
        "recover", "roost", "softboiled", "moonlight", "morningsun",
        "synthesis", "slackoff", "milkdrink", "shoreup", "strengthsap",
        "junglehealing", "lifedew", "rest", "wish",
    ]),
    ("weather", "Weather", "both", [
        "sunnyday", "raindance", "sandstorm", "snowscape", "chillyreception",
        "drought", "drizzle", "sandstream", "snowwarning", "orichalcumpulse",
        "hadronengine", "electricsurge", "grassysurge", "mistysurge",
        "psychicsurge", "desolateland", "primordialsea",
        "airlock","cloudnine","deltastream",
    ]),
    ("terrain", "Terrain", "both", [
        "electricterrain", "grassyterrain", "mistyterrain", "psychicterrain",
        "electricsurge", "grassysurge", "mistysurge",
        "psychicsurge",
    ]),
    ("pivot", "Pivoting", "both", [
        "uturn", "voltswitch", "flipturn", "partingshot", "teleport",
        "batonpass", "shedtail", "chillyreception",
    ]),
    ("setup", "Setup", "both", [
        "swordsdance", "nastyplot", "dragondance", "calmmind", "bulkup",
        "quiverdance", "shellsmash", "irondefense", "agility", "rockpolish",
        "tidyup", "victorydance", "honeclaws", "workup", "growth", "coil",
        "curse", "bellydrum", "clangoroussoul", "takeheart", "trailblaze",
        "flamecharge",
        "coaching", "decorate",
    ]),
    ("support", "Ally Support", "doubles", [
        "helpinghand", "healpulse", "decorate", "coaching", "lifedew",
        "junglehealing", "healingwish", "lunardance",
    ]),
    ("hazards", "Entry Hazards", "singles", [
        "stealthrock", "spikes", "toxicspikes", "stickyweb",
    ]),
    ("hazard_removal", "Hazard Removal", "singles", [
        "rapidspin", "defog", "courtchange", "tidyup", "mortalspin",
    ]),
    ("status", "Status Moves", "both", [
        "willowisp", "thunderwave", "toxic", "sleeppowder", "spore", "hypnosis",
        "glare", "nuzzle", "yawn", "poisonpowder", "stunspore", "lovelykiss",
        "darkvoid", "sing", "grasswhistle", "toxicthread",
    ]),
    ("trapping", "Trapping", "both", [
        "meanlook", "block", "spiderweb", "jawlock", "thousandwaves",
        "anchorshot", "spiritshackle", "octolock", "shadowtag","arenatrap",
    ]),
]

# Ability groups matter as much as moves when scouting -- Intimidate and
# Prankster shape a matchup the way a move does, and they cannot be scouted
# out of a movepool.
PRESET_ABILITIES = [
    ("intimidate_family", "Intimidate & Attack Drops", [
        "intimidate", "supersweetsyrup",
    ]),
    ("speed_abilities", "Speed Abilities", [
        "swiftswim", "chlorophyll", "sandrush", "slushrush", "surgesurfer",
        "unburden", "quickfeet", "protosynthesis", "quarkdrive", "steadfast",
    ]),
    ("priority_abilities", "Priority Abilities", [
        "prankster", "galewings", "triage",
    ]),
    ("weather_setters", "Weather & Terrain Abilities", [
        "drought", "drizzle", "sandstream", "snowwarning", "orichalcumpulse",
        "hadronengine", "electricsurge", "grassysurge", "mistysurge",
        "psychicsurge", "desolateland", "primordialsea", "deltastream",
    ]),
    ("damage_immunity", "Damage Immunities", [
        "levitate", "flashfire", "waterabsorb", "voltabsorb", "stormdrain",
        "lightningrod", "sapsipper", "motordrive", "dryskin", "eartheater",
        "wellbakedbody", "thermalexchange", "purifyingsalt",
    ]),
    ("stat_ignoring", "Ignores / Negates", [
        "unaware", "moldbreaker", "teravolt", "turboblaze", "neutralizinggas",
        "magicbounce", "magicguard",
    ]),
]


# Abilities that belong to a move group. "Who can set sun" is one question,
# and answering it with only Sunny Day misses Torkoal entirely -- on most
# rosters the ability is the more likely answer. So a preset expands into both
# moves and abilities, rather than making the player find a second button.
PRESET_GROUP_ABILITIES = {
    "weather": [
        "drought", "drizzle", "sandstream", "snowwarning", "orichalcumpulse",
        "desolateland", "primordialsea", "deltastream",
    ],
    "terrain": [
        "electricsurge", "grassysurge", "mistysurge", "psychicsurge",
        "hadronengine",
    ],
    "priority": ["prankster", "galewings", "triage"],
    # Lightning Rod and Storm Drain redirect a type outright -- the same job
    # Follow Me does, without spending a turn.
    "redirection": ["lightningrod", "stormdrain"],
    "speed_control": ["prankster"],
    # The abilities are the main way trapping happens at all -- the moves are
    # a fringe of the category, not the whole of it. Shadow Tag was briefly in
    # the MOVE list by mistake and removed as an ability rather than moved
    # here, which left the group unable to answer its own question.
    "trapping": ["arenatrap", "shadowtag", "magnetpull"],
    # Scoped to abilities that actually restore HP, matching the move list.
    # Dry Skin is deliberately here as well as under Damage Immunities: it
    # heals in rain, which is the same job Rain Dish does, and a preset is a
    # question rather than a taxonomy -- a Pokemon can be a right answer to
    # two of them. Status-clearing abilities (Natural Cure, Shed Skin) are
    # left out, since the group's moves are about HP.
    "recovery": ["regenerator", "poisonheal", "raindish", "icebody", "dryskin"],
}


def preset_abilities(preset_id):
    """Ability ids that belong with a preset group, if any."""
    return list(PRESET_GROUP_ABILITIES.get(preset_id, ()))


def preset_moves(preset_id):
    """Move ids for a curated group, or the derived list for 'priority'."""
    if preset_id == "priority":
        return moves_with_priority(1)
    if preset_id == "negative_priority":
        return moves_with_priority(-99, maximum=-1)
    for pid, _label, _scope, moves in PRESET_GROUPS:
        if pid == preset_id:
            # Filtered against moves.json so a typo or a move that leaves the
            # game does not show up as a column nothing can ever match.
            known = load_moves()
            return [m for m in dict.fromkeys(moves) if m in known]
    return []


def preset_catalog(battle_format="doubles"):
    """The preset list a UI should offer, most relevant scope first."""
    order = {battle_format: 0, "both": 1}
    groups = [
        {"id": pid, "label": label, "scope": scope,
         "moves": preset_moves(pid), "abilities": preset_abilities(pid)}
        for pid, label, scope, _ in PRESET_GROUPS
    ]
    groups.sort(key=lambda g: (order.get(g["scope"], 2), g["label"]))
    derived = [
        {"id": "priority", "label": "Priority Moves", "scope": "both",
         "moves": moves_with_priority(1),
         "abilities": preset_abilities("priority")},
        {"id": "negative_priority", "label": "Negative Priority", "scope": "both",
         "moves": moves_with_priority(-99, maximum=-1), "abilities": []},
    ]
    return derived + groups


def moves_of_type(type_name, damaging_only=True):
    out = []
    for move_id, m in load_moves().items():
        if m.get("isNonstandard"):
            continue
        if m.get("type") != type_name:
            continue
        if damaging_only and m.get("category") == "Status":
            continue
        out.append(move_id)
    return sorted(out)


# ------------------------------------------------------------- ability lookup

def abilities_for(species_id, dex=DEFAULT_DEX):
    """Every ability a species can have, as ids, including its hidden one."""
    entry = load_species(dex).get(species_id) or {}
    return [to_id(a) for a in (entry.get("abilities") or {}).values()]


def ability_coverage(species_ids, ability_ids, dex=DEFAULT_DEX):
    by_species, by_ability = {}, {a: [] for a in ability_ids}
    for sid in species_ids:
        have = set(abilities_for(sid, dex))
        hits = [a for a in ability_ids if a in have]
        by_species[sid] = hits
        for a in hits:
            by_ability[a].append(sid)
    return {"by_species": by_species, "by_ability": by_ability}


# ------------------------------------------------------------- roster parsing

# Lines in a Showdown export that describe a set rather than name a species.
_PASTE_FIELD = re.compile(
    r"^(ability|level|shiny|happiness|tera type|evs|ivs|gigantamax|dynamax level)\s*:",
    re.I)
_NATURE_LINE = re.compile(r"^[a-z]+\s+nature\s*$", re.I)


@lru_cache(maxsize=len(DEXES))
def _name_lookup(dex=DEFAULT_DEX):
    """{normalised name: species id} for everything in this rule set's roster."""
    out = {}
    for sid, entry in load_species(dex).items():
        out[sid] = sid
        out[to_id(entry.get("name", ""))] = sid
    return out


# Form qualifiers, mapped from every spelling a draft document might use to
# the token Showdown actually puts in the species id. Draft sheets are written
# by hand and none of them agree: "Hisuian Zoroark", "Zoroark-Hisui",
# "Zoroark Hisuian" and "Zoroark-Hisuian" are all the same Pokemon, and a tool
# that only accepts one of them makes the player do the reformatting.
FORM_ALIASES = {
    "alola": "alola", "alolan": "alola",
    "galar": "galar", "galarian": "galar",
    "hisui": "hisui", "hisuian": "hisui",
    "paldea": "paldea", "paldean": "paldea",
    "therian": "therian", "incarnate": "incarnate",
    "mega": "mega", "primal": "primal",
    "origin": "origin", "altered": "altered",
    "female": "f", "male": "m",
    "rapidstrike": "rapidstrike", "singlestrike": "singlestrike",
    "crowned": "crowned", "hero": "hero", "eternamax": "eternamax",
    "bloodmoon": "bloodmoon", "wellspring": "wellspring",
    "hearthflame": "hearthflame", "cornerstone": "cornerstone",
    "teal": "teal", "aqua": "aqua", "blaze": "blaze", "combat": "combat",
    "shadow": "shadow", "ice": "ice", "dawnwings": "dawnwings",
    "duskmane": "duskmane", "ultra": "ultra", "resolute": "resolute",
    "unbound": "unbound", "sky": "sky", "zen": "zen", "galarzen": "galarzen",
    "busted": "busted", "noice": "noice", "hangry": "hangry",
    "lowkey": "lowkey", "antique": "antique", "masterpiece": "masterpiece",
    "roaming": "roaming", "threesegment": "threesegment", "four": "four",
    "stellar": "stellar", "terastal": "terastal", "gulping": "gulping",
    "gorging": "gorging", "droopy": "droopy", "stretchy": "stretchy",
    "x": "x", "y": "y",
}

# Single-letter shorthands, only honoured as a hyphenated prefix ("H-Zoroark")
# or a hyphenated suffix ("Landorus-T"). Deliberately NOT applied to a bare
# trailing letter of a whole word: before this existed, "H-Zoroark" fell
# through to fuzzy matching and quietly resolved to plain Zoroark -- the wrong
# Pokemon, which is worse than refusing to answer.
FORM_LETTERS = {
    "a": "alola", "g": "galar", "h": "hisui", "p": "paldea",
    "t": "therian", "i": "incarnate", "m": "mega", "f": "f",
    "x": "x", "y": "y", "s": "shadow",
}
# "m" is ambiguous: a leading "M-" means Mega, a trailing "-M" means male.
FORM_LETTERS_SUFFIX = dict(FORM_LETTERS, m="m", s="s")

# Words people say but Showdown does not put in an id. "Shadow Rider Calyrex"
# and "Zacian Crowned Sword" are how these are spoken and written on draft
# sheets; the ids are calyrexshadow and zaciancrowned.
FORM_NOISE = {
    "rider", "forme", "form", "style", "mode", "cloak", "size", "mask",
    "sword", "shield", "the",
}

_SEPARATORS = re.compile(r"[\s\-_.,:()\[\]]+")


def _split_name(text):
    """Lowercased word tokens, with hyphen shorthands expanded."""
    raw = (text or "").strip().lower()
    parts = [p for p in _SEPARATORS.split(raw) if p]
    if not parts:
        return []
    # A single leading letter attached by a hyphen is a form shorthand.
    if len(parts) > 1 and len(parts[0]) == 1 and parts[0] in FORM_LETTERS:
        parts = [FORM_LETTERS[parts[0]]] + parts[1:]
    if len(parts) > 1 and len(parts[-1]) == 1 and parts[-1] in FORM_LETTERS_SUFFIX:
        parts = parts[:-1] + [FORM_LETTERS_SUFFIX[parts[-1]]]
    return parts


def resolve_species(text, dex=DEFAULT_DEX):
    """Best-effort species id for a typed or pasted name.

    Draft rosters are copied out of spreadsheets and Discord messages, so the
    same Pokemon arrives spelled several ways. Resolution runs in order of how
    much it is willing to assume:

      1. the id as written, which settles anything already canonical
      2. form-aware reordering, so a qualifier can sit before or after the
         base name and be spelled either way ("Hisuian Zoroark" /
         "Zoroark-Hisui" / "Zoroark Hisuian")
      3. fuzzy matching, for ordinary misspellings

    Step 2 runs before fuzzy matching on purpose. Fuzzy matching is happy to
    call "Hisuian Zoroark" a good-enough match for plain Zoroark, and a
    scouting tool that silently swaps a forme for its base is worse than one
    that says it does not know.
    """
    lookup = _name_lookup(dex)

    key = to_id(text)
    if key in lookup:
        return lookup[key]

    parts = _split_name(text)
    if not parts:
        return None
    if "".join(parts) in lookup:
        return lookup["".join(parts)]

    # Peel off every token that is a form qualifier; whatever is left is the
    # base name, which may itself be several words ("Iron Hands", "Ting-Lu").
    # Noise words are dropped only when something else survives, so a species
    # whose real name is one of them cannot be erased.
    quals, base = [], []
    i = 0
    while i < len(parts):
        # Two-word qualifiers first ("Rapid Strike Urshifu"), or the pair
        # would be read as part of the base name and never match.
        pair = FORM_ALIASES.get(parts[i] + parts[i + 1]) if i + 1 < len(parts) else None
        if pair is not None:
            quals.append(pair)
            i += 2
            continue
        canon = FORM_ALIASES.get(parts[i])
        if canon is not None:
            quals.append(canon)
        elif parts[i] not in FORM_NOISE or len(parts) == 1:
            base.append(parts[i])
        i += 1
    base_id = "".join(base)
    if not base_id:
        return None
    if not quals:
        return _fuzzy(lookup, base_id)

    # Qualifier order varies as much as spelling ("Tauros Paldean Aqua" vs
    # "Tauros-Aqua-Paldea"), so try the orderings rather than trusting one.
    import itertools
    seen = set()
    for order in itertools.permutations(quals, len(quals)):
        candidate = base_id + "".join(order)
        if candidate in seen:
            continue
        seen.add(candidate)
        if candidate in lookup:
            return lookup[candidate]

    # A qualifier we recognised but that this species does not use -- treat it
    # as noise around a real name rather than giving up ("Shadow Rider
    # Calyrex" is Calyrex-Shadow; the "rider" is not part of the id).
    if base_id in lookup:
        return lookup[base_id]
    for order in itertools.permutations(quals, len(quals)):
        hit = _fuzzy(lookup, base_id + "".join(order), cutoff=0.86)
        if hit:
            return hit
    return _fuzzy(lookup, base_id)


def _fuzzy(lookup, key, cutoff=0.82):
    import difflib
    close = difflib.get_close_matches(key, lookup.keys(), n=1, cutoff=cutoff)
    return lookup[close[0]] if close else None


def _strip_gender(chunk):
    """Split a trailing "(M)"/"(F)" off a species line, keeping the letter."""
    m = re.search(r"\((m|f)\)\s*$", chunk, flags=re.I)
    if not m:
        return chunk.strip(), ""
    return chunk[: m.start()].strip(), m.group(1).lower()


def _resolve_with_gender(text, gender, dex=DEFAULT_DEX):
    """Resolve a name, treating a trailing gender mark as a forme if it is one.

    For most species "(F)" is cosmetic and belongs nowhere near the id. For
    Indeedee, Meowstic, Basculegion and Oinkologne the gender IS the forme,
    and a draft sheet writing "Indeedee (F)" means the female forme -- which
    has a different movepool and, for Indeedee, is the one that gets Follow
    Me. So the gendered id is tried first and only falls back when the
    species has no such forme.
    """
    if gender:
        sid = resolve_species(text + "-" + gender, dex)
        if sid and sid.endswith(gender) and sid != resolve_species(text, dex):
            return sid
    return resolve_species(text, dex)


def parse_roster(text, limit=24, dex=DEFAULT_DEX):
    """Species ids from a pasted roster, plus anything that did not resolve.

    Accepts three things without being told which it is: a Showdown export, a
    newline list, and a comma list. Draft rosters get shared as all three, and
    making the player reformat before pasting is exactly the friction this
    tool is meant to remove. Spreads are read off a paste when present, so
    your own side can use real numbers instead of assumed benchmarks.
    """
    found, unknown, seen = [], [], set()
    for raw_line in (text or "").splitlines():
        line = raw_line.strip()
        if not line or line.startswith(("-", "#", "//")):
            continue
        if _PASTE_FIELD.match(line) or _NATURE_LINE.match(line):
            continue
        # A paste line can hold several fields; a plain list can hold commas.
        for chunk in line.split(","):
            chunk = chunk.split("@")[0].strip()
            # "Nickname (Incineroar)" -> Incineroar.
            paren = re.search(r"\(([^)]{2,})\)", chunk)
            if paren and to_id(paren.group(1)) not in ("m", "f"):
                chunk = paren.group(1)
            chunk, gender = _strip_gender(chunk)
            if not chunk:
                continue
            sid = _resolve_with_gender(chunk, gender, dex)
            if sid is None:
                unknown.append(chunk)
            elif sid not in seen:
                seen.add(sid)
                found.append(sid)
            if len(found) >= limit:
                return found, unknown
    return found, unknown


def parse_paste_spreads(text, dex=DEFAULT_DEX):
    """{species id: {"nature": Â±1|0, "spe_ev": int, "spe_iv": int}} from a paste.

    Only Speed is extracted, because Speed is the only stat this tool reasons
    about. A set that pins its own Speed beats any assumed benchmark, so this
    is what lets your own side stop guessing.
    """
    boosting = {"timid", "jolly", "hasty", "naive"}
    hindering = {"brave", "relaxed", "quiet", "sassy"}
    out, current = {}, None
    for raw_line in (text or "").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if _NATURE_LINE.match(line):
            nature = to_id(line.split()[0])
            if current:
                out.setdefault(current, {})["nature"] = (
                    1 if nature in boosting else -1 if nature in hindering else 0)
            continue
        low = line.lower()
        if low.startswith("evs:") or low.startswith("ivs:"):
            key = "spe_ev" if low.startswith("evs:") else "spe_iv"
            m = re.search(r"(\d+)\s*spe\b", low)
            if m and current:
                out.setdefault(current, {})[key] = int(m.group(1))
            continue
        if _PASTE_FIELD.match(line) or line.startswith("-"):
            continue
        chunk = line.split("@")[0].strip()
        paren = re.search(r"\(([^)]{2,})\)", chunk)
        if paren and to_id(paren.group(1)) not in ("m", "f"):
            chunk = paren.group(1)
        chunk, gender = _strip_gender(chunk)
        sid = _resolve_with_gender(chunk, gender, dex)
        if sid:
            current = sid
            out.setdefault(sid, {})
    return out



def species_list(dex=DEFAULT_DEX):
    """[{id, name}] for a roster, alphabetical -- what a picker should offer."""
    return sorted(
        ({"id": sid, "name": entry.get("name", sid)}
         for sid, entry in load_species(dex).items()),
        key=lambda s: s["name"],
    )


# ------------------------------------------------------------- usage overlay

def attach_usage(coverage_result, usage_by_species):
    """Fold "how often is it actually run" into a coverage result.

    Kept separate from coverage() so this module stays free of the app's data
    loaders, the way insights.py does: the caller supplies
    {species id: {move id: fraction}} and this only merges.

    The distinction it draws is the point of the overlay. "Can learn" is a
    legality fact and is never wrong; "is run" is a usage observation that may
    be missing entirely for an unpopular species or an off-ladder format. A
    move that is learnable but has no usage row is reported as unknown, never
    as 0%, because those two mean very different things to someone deciding
    whether to play around it.
    """
    out = {"by_species": {}, "by_move": coverage_result["by_move"]}
    for sid, hits in coverage_result["by_species"].items():
        rows = {}
        seen = usage_by_species.get(sid)
        for move_id, method in hits.items():
            pct = None if seen is None else seen.get(move_id, 0.0)
            rows[move_id] = {"method": method, "usage": pct}
        out["by_species"][sid] = rows
    return out


def usage_from_stats(pokemon_data):
    """{move id: fraction of sets} from one Smogon per-Pokemon stats blob.

    The denominator is the summed ability weight rather than Raw count: every
    set has exactly one ability, so that sum is the weighted set count, and it
    is the same denominator the Pokemon pages already display against.
    """
    moves = (pokemon_data or {}).get("Moves") or {}
    total = sum((pokemon_data or {}).get("Abilities", {}).values())
    if not total:
        return {}
    return {m: c / total for m, c in moves.items() if m not in ("", "nothing")}


# ---------------------------------------------------------------- speed maths

# The two stat systems this tool has to speak. Champions is not the cartridge
# game with different numbers -- it spends 66 "stat points" (max 32 per stat,
# in steps of 1, no IVs) through its own formula, so walking a 0-252 EV axis
# there would describe investment the game does not have.
# "has_ivs" means IVs are something the player picks, not that they exist:
# Champions IVs are always perfect, so there is no lower roll to choose and
# nothing for an underspeed plan to give away.
STAT_SYSTEMS = {
    "ev": {"label": "EV", "max_per_stat": 252, "step": 4, "budget": 508,
           "has_ivs": True},
    "champions": {"label": "SP", "max_per_stat": 32, "step": 1, "budget": 66,
                  "has_ivs": False},
}


def stat_system_for(dex):
    return "champions" if dex == "champions" else "ev"


def speed_stat(base, ev=0, iv=31, nature=0, level=DEFAULT_LEVEL, system="ev"):
    """Speed stat from base and investment.

    nature: +1 boosting, 0 neutral, -1 hindering.

    Two formulas, picked by `system`:

      ev          the cartridge formula at the given level, using EVs and IVs
      champions   floor((base + stat points + 20) * nature). One SP buys one
                  point of stat, and the 20 is the fixed contribution of the
                  perfect IVs every Champions Pokemon has -- so `iv` is not
                  ignored here so much as already accounted for, and there is
                  nothing to vary. Mirrors calculate_champions_stat_value()
                  in app.py so the two cannot drift apart

    Done in integer arithmetic throughout. The nature step is a floor, and
    doing it as a float multiply is a real source of off-by-one errors --
    (inner + 5) * 1.1 lands just under the integer often enough to matter,
    and a Speed number that is one point low is exactly the kind of wrong
    that loses a game.
    """
    if system == "champions":
        inner = base + ev + 20
    else:
        inner = (2 * base + iv + ev // 4) * level // 100 + 5
    if nature > 0:
        return inner * 11 // 10
    if nature < 0:
        return inner * 9 // 10
    return inner


def apply_speed_modifiers(stat, tailwind=False, scarf=False, paralysis=False,
                          stage=0, ability=None):
    """Battle modifiers, applied in Showdown's order.

    Stat stages first, then multiplicative ability and item modifiers, then
    the paralysis halving last. Order matters: each step floors, so folding
    them into a single multiply gives a different (wrong) number.

    `ability` is a (numerator, denominator) pair -- (2, 1) for Swift Swim and
    friends, (13, 10) for the Booster abilities, (1, 2) for Slow Start.
    """
    if stage:
        num, den = (2 + stage, 2) if stage > 0 else (2, 2 - stage)
        stat = stat * num // den
    if ability:
        stat = stat * ability[0] // ability[1]
    if scarf:
        stat = stat * 3 // 2
    if tailwind:
        stat = stat * 2
    if paralysis:
        stat = stat // 2
    return max(stat, 1)


# Abilities that change Speed, with the condition each needs. They are offered
# only to Pokemon that actually have them -- a blanket "Swift Swim" toggle
# would invite nonsense -- and every row is labelled with its condition,
# because a doubled Speed that needs rain on the field is not the same claim
# as an unconditional one.
SPEED_ABILITIES = {
    "swiftswim":      ("Swift Swim", "in rain", (2, 1)),
    "chlorophyll":    ("Chlorophyll", "in sun", (2, 1)),
    "sandrush":       ("Sand Rush", "in sand", (2, 1)),
    "slushrush":      ("Slush Rush", "in snow", (2, 1)),
    "surgesurfer":    ("Surge Surfer", "in Electric Terrain", (2, 1)),
    "unburden":       ("Unburden", "once its item is gone", (2, 1)),
    "quickfeet":      ("Quick Feet", "when statused", (3, 2)),
    "protosynthesis": ("Protosynthesis", "in sun / Booster Energy", (13, 10)),
    "quarkdrive":     ("Quark Drive", "in Electric Terrain / Booster Energy", (13, 10)),
    "slowstart":      ("Slow Start", "for its first five turns", (1, 2)),
}

# Booster abilities raise the highest stat, not Speed specifically.
_BOOSTER_ABILITIES = {"protosynthesis", "quarkdrive"}


def speed_abilities_for(species_id, dex=DEFAULT_DEX):
    """Speed-changing abilities this species can actually have.

    Protosynthesis and Quark Drive are filtered on whether Speed is the
    species' highest base stat: they boost whichever stat is highest, so on
    Flutter Mane (highest Special Attack) they do nothing to Speed and
    reporting a 1.3x there would be wrong.
    """
    entry = load_species(dex).get(species_id) or {}
    stats = entry.get("baseStats") or {}
    out = []
    for ability_id in abilities_for(species_id, dex):
        info = SPEED_ABILITIES.get(ability_id)
        if not info:
            continue
        if ability_id in _BOOSTER_ABILITIES:
            # Ties go to the earlier stat in Showdown's order, which is what
            # iterating the dict in its natural hp/atk/def/spa/spd/spe order
            # gives -- so a tie never resolves to Speed.
            if not stats or max(stats, key=lambda k: stats[k]) != "spe":
                continue
        label, when, mult = info
        out.append({"id": ability_id, "label": label, "when": when, "mult": mult})
    return out


# Benchmarks an opponent's Pokemon is assumed to be at when its real spread is
# unknown. Reported as three separate lines rather than one guess, because
# "their Landorus" is not a single number and pretending it is hides the risk.
DEFAULT_BENCHMARKS = (
    ("uninvested", 0, 0),
    ("max neutral", None, 0),
    ("max +nature", None, 1),
)


def _benchmark_investment(ev, system):
    """None in a benchmark means "as much as this system allows"."""
    return STAT_SYSTEMS[system]["max_per_stat"] if ev is None else ev

# 4 EVs raise the pre-level term by exactly 1, which the level-50 halving then
# floors away every other step -- so Speed usually moves once per 8 EVs, but
# whether the first useful step lands at 4 or at 8 depends on the parity of
# (2 * base + IV). Both gaps really occur, so the curve is walked at the
# system's own step and de-duplicated on the resulting stat rather than
# assumed to move every time. That de-duplication is what exposes investment
# which buys no stat point at all -- in Champions every point buys one, so the
# curve there is dense and the dead zone appears only past the cap.
EV_STEP = 4
EV_MAX = 252


def speed_curve(base, nature=0, iv=31, level=DEFAULT_LEVEL, system="ev",
                **modifiers):
    """[(investment, stat)] for every point that changes the Speed stat."""
    rules = STAT_SYSTEMS[system]
    curve, last = [], None
    for ev in range(0, rules["max_per_stat"] + 1, rules["step"]):
        stat = apply_speed_modifiers(
            speed_stat(base, ev, iv, nature, level, system), **modifiers)
        if stat != last:
            curve.append((ev, stat))
            last = stat
    return curve


def benchmarks_for(species_id, benchmarks=DEFAULT_BENCHMARKS, level=DEFAULT_LEVEL,
                   dex=DEFAULT_DEX, include_abilities=True, **modifiers):
    """Speed numbers to beat for one opposing Pokemon."""
    entry = load_species(dex).get(species_id) or {}
    base = (entry.get("baseStats") or {}).get("spe")
    if base is None:
        return []
    system = stat_system_for(dex)
    iv = 31 if STAT_SYSTEMS[system]["has_ivs"] else 0
    # An unconditional row plus one per Speed ability the species can have.
    # Skipped entirely for the vast majority of Pokemon, which have none.
    variants = [{"id": None, "label": "", "when": "", "mult": None}]
    if include_abilities:
        variants += speed_abilities_for(species_id, dex)
    out = []
    for variant in variants:
        for label, ev, nat in benchmarks:
            invested = _benchmark_investment(ev, system)
            out.append({
                "species": species_id,
                "name": entry.get("name", species_id),
                "label": label,
                "ev": invested,
                "nature": nat,
                "ability": variant["id"],
                "abilityLabel": variant["label"],
                "abilityWhen": variant["when"],
                "speed": apply_speed_modifiers(
                    speed_stat(base, invested, iv, nat, level, system),
                    ability=variant["mult"], **modifiers),
            })
    return out


def speed_plan(species_id, opponent_ids, nature=0, iv=31, level=DEFAULT_LEVEL,
               benchmarks=DEFAULT_BENCHMARKS, mine=None, theirs=None,
               dex=DEFAULT_DEX):
    """What each Speed EV actually buys against a specific opposing roster.

    This is the whole point of the tool. It reports, for one of your Pokemon:

      steps    every EV amount that raises the Speed stat, and which opposing
               benchmarks that step newly beats
      enough   the smallest investment that beats everything you can beat --
               past this, Speed EVs buy nothing against THIS roster
      wasted   how many EVs going to 252 would burn for no gain
      unreachable
               the benchmarks max investment still loses to, named, so the
               decision to stop is made on evidence rather than on hope

    A speed tie is reported as a tie, never as an outspeed. Equal Speed is a
    coin flip, and a tool that quietly rounded that up to a win would be
    lying at exactly the moment the number mattered.
    """
    mine = mine or {}
    theirs = theirs or {}
    entry = load_species(dex).get(species_id) or {}
    base = (entry.get("baseStats") or {}).get("spe")
    if base is None:
        return None
    system = stat_system_for(dex)
    rules = STAT_SYSTEMS[system]
    if not rules["has_ivs"]:
        iv = 0

    targets = []
    for oid in opponent_ids:
        targets.extend(benchmarks_for(oid, benchmarks, level, dex, **theirs))

    curve = speed_curve(base, nature, iv, level, system, **mine)
    ceiling = curve[-1][1] if curve else 0

    beaten_so_far = set()
    steps = []
    for ev, stat in curve:
        gained, tied = [], []
        for i, t in enumerate(targets):
            if i in beaten_so_far:
                continue
            if stat > t["speed"]:
                gained.append(t)
                beaten_so_far.add(i)
            elif stat == t["speed"]:
                tied.append(t)
        steps.append({"ev": ev, "stat": stat, "gains": gained, "ties": tied})

    # The last step that newly beat something is where investment stops paying.
    enough = 0
    for s in steps:
        if s["gains"]:
            enough = s["ev"]
    unreachable = [t for t in targets if ceiling <= t["speed"]]

    return {
        "species": species_id,
        "name": entry.get("name", species_id),
        "base": base,
        "nature": nature,
        "system": system,
        "unit": rules["label"],
        "max_investment": rules["max_per_stat"],
        "steps": steps,
        "enough_ev": enough,
        "enough_speed": speed_stat(base, enough, iv, nature, level, system),
        "wasted_ev": rules["max_per_stat"] - enough,
        "max_speed": ceiling,
        "beats": len(beaten_so_far),
        "targets": len(targets),
        "unreachable": unreachable,
    }


# Modifiers worth enumerating rather than assuming. Each is something a player
# chooses (an item, a support move, a boosting move), so the useful question is
# not "what happens under these conditions" but "which conditions get me there"
# -- a Scarf that clears a threat you otherwise lose to is a drafting decision,
# not a footnote.
# "kind" separates what a Pokemon brings by itself from what the rest of the
# turn has to provide. A Choice Scarf is a slot on the set and nothing else;
# Tailwind costs an ally a turn and expires; a boost costs a turn of your own.
# They are not interchangeable, so the recommendation ranks self-contained
# options ahead of ones that need the board to cooperate.
SPEED_MODIFIERS = (
    ("scarf", "Choice Scarf", {"scarf": True}, "item"),
    ("tailwind", "Tailwind", {"tailwind": True}, "setup"),
    ("boost1", "+1", {"stage": 1}, "setup"),
    ("boost2", "+2", {"stage": 2}, "setup"),
    # Speed drops, for Icy Wind / Electroweb / Sticky Web / Cotton Spore.
    # Useful on either side: on theirs it is what your Icy Wind buys you, and
    # on yours it is what surviving one costs.
    ("drop1", "-1", {"stage": -1}, "setup"),
    ("drop2", "-2", {"stage": -2}, "setup"),
    ("para", "Paralysed", {"paralysis": True}, "status"),
)
# Kind "item" occupies the held-item slot, which a Mega or Primal has already
# spent on its stone. Offering "Mega Gengar + Choice Scarf" is not a stretch of
# the rules, it is an impossible set -- and it is the kind of false positive
# that makes every other number in the table suspect.
_ITEM_KIND = "item"
_MODIFIER_BY_ID = {mid: (label, mods, kind) for mid, label, mods, kind in SPEED_MODIFIERS}

# Combining these two is incoherent: a paralysed Pokemon that is also at +2
# is a real state, but "+1 and +2 at once" is not, and Scarf plus Choice-lock
# is fine while Scarf on a Pokemon already holding Booster is not. Only the
# genuinely exclusive pair is blocked; the rest are left to the player.
# All four stage changes name a single stat stage, so at most one can apply:
# "+1 and -2 at once" is not a state the game has.
_EXCLUSIVE = ({"boost1", "boost2", "drop1", "drop2"},)


def modifier_combos(enabled):
    """Every coherent combination of the enabled modifiers, smallest first.

    Returned with a label so the UI never has to reconstruct one, and always
    including the empty combination -- "no help at all" is the baseline every
    other column is read against.
    """
    import itertools
    ids = [mid for mid, _, _, _ in SPEED_MODIFIERS if mid in set(enabled or ())]
    out = []
    for size in range(len(ids) + 1):
        for combo in itertools.combinations(ids, size):
            chosen = set(combo)
            if any(len(chosen & pair) > 1 for pair in _EXCLUSIVE):
                continue
            mods = {}
            for mid in combo:
                mods.update(_MODIFIER_BY_ID[mid][1])
            out.append({
                "ids": list(combo),
                "label": " + ".join(_MODIFIER_BY_ID[m][0] for m in combo) or "no modifiers",
                "mods": mods,
                "setupCount": sum(1 for m in combo
                                  if _MODIFIER_BY_ID[m][2] == "setup"),
                "usesItem": any(_MODIFIER_BY_ID[m][2] == _ITEM_KIND
                                for m in combo),
            })
    return out


def holds_mega_stone(species_id, dex=DEFAULT_DEX):
    """True when this species' held-item slot is spoken for by its stone.

    Applies to whichever side the Pokemon is on: a Choice Scarf is as
    impossible on their Mega Gengar as on yours, and assuming one on their
    side is the more dangerous error -- it invents a threat that cannot exist
    and would have you over-invest to beat it.
    """
    entry = load_species(dex).get(species_id) or {}
    return (entry.get("forme") or "").startswith(("Mega", "Primal"))


def forme_group(species_id, dex=DEFAULT_DEX):
    """A Pokemon and the other forme it can become mid-battle.

    Megas are returned alongside their base forme because Mega Evolution is a
    choice made during the game, not at team preview: the base forme's Speed
    is what matters on the turn you have not yet Mega'd, and for Charizard-X
    and Gengar the two differ enough to change who moves first. Reported as
    two rows rather than one so neither number is hidden behind the other.
    """
    species = load_species(dex)
    entry = species.get(species_id) or {}
    forme = entry.get("forme") or ""
    out = [{"id": species_id, "name": entry.get("name", species_id),
            "role": "mega" if forme.startswith(("Mega", "Primal")) else "base"}]
    if forme.startswith(("Mega", "Primal")):
        base_id = to_id(entry.get("baseSpecies") or "")
        base = species.get(base_id)
        if base:
            out.insert(0, {"id": base_id, "name": base.get("name", base_id),
                           "role": "pre-mega"})
    return out


def underspeed_plan(species_id, opponent_ids, nature=-1, iv=0,
                    level=DEFAULT_LEVEL, benchmarks=DEFAULT_BENCHMARKS,
                    theirs=None, dex=DEFAULT_DEX):
    """The Trick Room direction: the most Speed you can take and stay slower.

    Worth its own function rather than a flag, because the answer is a
    ceiling instead of a floor and the failure mode is the opposite one --
    here an extra point of Speed is what costs you the turn.
    """
    theirs = theirs or {}
    entry = load_species(dex).get(species_id) or {}
    base = (entry.get("baseStats") or {}).get("spe")
    if base is None:
        return None

    targets = []
    for oid in opponent_ids:
        targets.extend(benchmarks_for(oid, benchmarks, level, dex, **theirs))
    if not targets:
        return None

    system = stat_system_for(dex)
    rules = STAT_SYSTEMS[system]
    if not rules["has_ivs"]:
        iv = 0
    slowest = min(t["speed"] for t in targets)
    best = None
    for ev in range(0, rules["max_per_stat"] + 1, rules["step"]):
        stat = speed_stat(base, ev, iv, nature, level, system)
        if stat < slowest:
            best = {"ev": ev, "stat": stat}
    return {
        "species": species_id,
        "name": entry.get("name", species_id),
        "base": base,
        "system": system,
        "unit": rules["label"],
        "slowest_target": min(targets, key=lambda t: t["speed"]),
        "max_ev_staying_slower": best,
    }


def min_investment_to_beat(base, target_speed, nature, iv, level, system,
                           mods, tie_ok=False):
    """Least investment that outspeeds target_speed, or None if unreachable.

    A tie is not a win and is reported separately, because equal Speed is a
    coin flip -- rounding it up to "outspeeds" would be lying at exactly the
    moment the number decides the game.
    """
    rules = STAT_SYSTEMS[system]
    tie_at = None
    for ev in range(0, rules["max_per_stat"] + 1, rules["step"]):
        stat = apply_speed_modifiers(
            speed_stat(base, ev, iv, nature, level, system), **mods)
        if stat > target_speed:
            return {"ev": ev, "stat": stat, "tie": False}
        if stat == target_speed and tie_at is None:
            tie_at = {"ev": ev, "stat": stat, "tie": True}
    return tie_at if (tie_ok and tie_at) else None


def speed_requirements(species_id, opponent_ids, dex=DEFAULT_DEX,
                       my_modifiers=(), their_modifiers=(),
                       natures=(0, 1), level=DEFAULT_LEVEL,
                       benchmarks=DEFAULT_BENCHMARKS, include_formes=True):
    """What it takes to outspeed each of their Pokemon, across every option.

    This is the answer to "Scarf Gallade could OHKO Sneasler -- what do I
    need?". Rather than asking the player to pick a nature and a set of
    conditions up front and reporting one number, it enumerates the choices
    and reports the cost of each, so the nature is an output.

    Columns are the things you control: which forme is out (a Mega and its
    pre-Mega self are both listed, since Mega Evolution happens mid-battle),
    which modifiers are in play, and which nature. Rows are their Pokemon at
    each assumed spread, optionally under their own modifiers. Every cell is
    the least investment that gets there, or nothing at all if it cannot.
    """
    my_combos = modifier_combos(my_modifiers)
    their_combos = modifier_combos(their_modifiers)
    system = stat_system_for(dex)
    rules = STAT_SYSTEMS[system]
    iv = 31 if rules["has_ivs"] else 0
    species = load_species(dex)

    formes = forme_group(species_id, dex) if include_formes else [
        {"id": species_id,
         "name": (species.get(species_id) or {}).get("name", species_id),
         "role": "base"}]

    # Rows: their roster at every assumed spread, under every combination of
    # their modifiers that we were asked to consider.
    targets = []
    for oid in opponent_ids:
        oid_holds_stone = holds_mega_stone(oid, dex)
        for tcombo in their_combos:
            if tcombo["usesItem"] and oid_holds_stone:
                continue
            for b in benchmarks_for(oid, benchmarks, level, dex, **tcombo["mods"]):
                targets.append({**b, "theirMods": tcombo["ids"],
                                "theirModLabel": tcombo["label"]})

    # column_mods runs parallel to columns: the modifier dict is needed to
    # recompute a stat for the summary, but it is an implementation detail
    # rather than something the client should have to understand.
    # Drafting a Mega spends the held-item slot on its stone for the WHOLE
    # set, not just after it evolves -- the pre-Mega forme is already holding
    # the stone on turn one. So no column in a Mega's card may carry an item,
    # including the pre-Mega row. Wanting a Scarf on the base forme is a
    # different draft pick, and it is available as one: adding plain Gengar
    # yields a single base row with every item option open.
    holds_stone = any(f["role"] == "mega" for f in formes)

    columns, cells, column_mods = [], [], []
    for forme in formes:
        base = ((species.get(forme["id"]) or {}).get("baseStats") or {}).get("spe")
        if base is None:
            continue
        # Your own Speed abilities are columns too: if this Pokemon has Swift
        # Swim, "how much Speed do I need" has a very different answer under
        # rain, and leaving it out would over-state the investment needed.
        ability_variants = [{"id": None, "label": "", "when": "", "mult": None}]
        ability_variants += speed_abilities_for(forme["id"], dex)
        for combo in my_combos:
            if combo["usesItem"] and holds_stone:
                continue
            for variant in ability_variants:
                mods = dict(combo["mods"], ability=variant["mult"])
                for nature in natures:
                    columns.append({
                        "forme": forme["id"],
                        "formeName": forme["name"],
                        "role": forme["role"],
                        "mods": combo["ids"],
                        "modLabel": combo["label"],
                        "setupCount": combo["setupCount"],
                        "ability": variant["id"],
                        "abilityLabel": variant["label"],
                        "abilityWhen": variant["when"],
                        "nature": nature,
                        "base": base,
                        "maxSpeed": apply_speed_modifiers(
                            speed_stat(base, rules["max_per_stat"], iv, nature,
                                       level, system), **mods),
                    })
                    column_mods.append(mods)
                    cells.append([
                        min_investment_to_beat(base, t["speed"], nature, iv,
                                               level, system, mods, tie_ok=True)
                        for t in targets
                    ])

    # Per configuration, the single number a player actually writes on the
    # spread: the least investment that beats everything this configuration
    # can beat. Once you have committed to a Choice Scarf, "124 EVs clears
    # their whole roster" is the answer -- reading it off a per-target grid
    # by eye is work the tool should be doing.
    summaries = []
    for ci, col in enumerate(columns):
        reachable = [c for c in cells[ci] if c and not c["tie"]]
        ties = [c for c in cells[ci] if c and c["tie"]]
        enough = max((c["ev"] for c in reachable), default=0)
        summaries.append({
            "beats": len(reachable),
            "ties": len(ties),
            "targets": len(targets),
            "enoughEv": enough,
            "enoughSpeed": apply_speed_modifiers(
                speed_stat(col["base"], enough, iv, col["nature"], level, system),
                **column_mods[ci]),
            "wastedEv": rules["max_per_stat"] - enough,
            "clearsAll": len(reachable) == len(targets),
        })

    # The least-cost way to beat each target, reported once PER NATURE rather
    # than as a single winner. Whether a +Speed nature is worth the 88 EVs it
    # saves depends on whether that nature slot is already spoken for by
    # damage, which is the player's call and not something this tool should
    # quietly make for them.
    #
    # Within a nature the ranking is by what the option costs to arrange:
    # things the board must provide first (Tailwind needs an ally's turn and
    # expires; a boost costs your own), then total moving parts, then
    # investment. Holding a Scarf and spending 44 EVs is a cheaper plan than
    # needing Tailwind up even though the EV number is larger -- ordering
    # purely by investment said the opposite and was wrong.
    options = []
    for ti in range(len(targets)):
        per_nature = {}
        for ci, col in enumerate(columns):
            cell = cells[ci][ti]
            if not cell or cell["tie"]:
                continue
            # A Speed ability counts as another thing the board must provide:
            # Swift Swim needs rain up, so it should not outrank an answer
            # that works on a bare field.
            conditions = col["setupCount"] + (1 if col.get("ability") else 0)
            key = (conditions, len(col["mods"]), cell["ev"])
            prev = per_nature.get(col["nature"])
            if prev is None or key < prev["_key"]:
                per_nature[col["nature"]] = {"_key": key, "column": ci, **cell}
        for v in per_nature.values():
            v.pop("_key", None)
        options.append({str(n): per_nature.get(n) for n in natures})

    return {
        "species": species_id,
        "name": (species.get(species_id) or {}).get("name", species_id),
        "unit": rules["label"],
        "maxInvestment": rules["max_per_stat"],
        "system": system,
        "formes": formes,
        "columns": columns,
        "targets": targets,
        "cells": cells,
        "options": options,
        "summaries": summaries,
        "natures": list(natures),
    }

