"""Shared shaping for the mobile app's tournament packs, official and Limitless.

A tournament dataset -- one event's cut, or a regulation's 30-day window at one
size tier and cut -- is shipped exactly as the site computes it: every number
below comes from the same helpers the tournament pages call, so the app and
the site cannot disagree.

What is not shipped per Pokémon is the text. A move's tooltip, an item's
description and icon, a species' sprite, types and base stats are the same
wherever they appear, so each pack carries them once, in "dict", and the app
joins them back in. Across a pack's several hundred Pokémon entries those
repeats were most of the bytes -- and gzip's 32 KB window is too short to find
a tooltip that last appeared a hundred kilobytes earlier.

Needs app imported (as A) for its data and helpers; see the builders.
"""

import gzip
import hashlib
import json
import os
import re

import mobile_api

# Placement cuts, in the order the app offers them. Official events have Day 2
# information; online events do not, so their cuts are top placements only.
OFFICIAL_CUTS = (("all", "All"), ("day2", "Day 2"), ("top16", "Top 16"), ("top8", "Top 8"))
LIMITLESS_CUTS = (("all", "All"), ("32", "Top 32"), ("16", "Top 16"), ("8", "Top 8"))


class PackDict:
    """The text and art a pack's entries refer to by name, collected once."""

    def __init__(self, A):
        self.A = A
        self.species = {}
        self.moves = {}
        self.items = {}
        self.abilities = {}
        self.natures = {}

    def add_species(self, name):
        if not name or name in self.species:
            return
        A = self.A
        has_dex = bool(A.pokedexEntries)
        self.species[name] = {
            "sprite": list(A.get_pokemon_sprite(name)),
            "types": A.compile_top_data({"_": 1}, name, "Types") if has_dex else [],
            "stats": A.compile_top_data({"_": 1}, name, "Stats") if has_dex else [],
        }

    def add_item(self, name):
        """For items met outside a usage list, e.g. in a team sheet."""
        if not name or name in self.items:
            return
        key = re.sub(r"[^a-z0-9]+", "", name.lower())
        info = self.A.itemDetails.get(key, {})
        self.items[name] = [info.get("desc", "No info."), list(divmod(info.get("spritenum", 0), 16))]

    def body(self):
        return {
            "species": self.species,
            "moves": self.moves,
            "items": self.items,
            "abilities": self.abilities,
            "natures": self.natures,
        }


# Longest list kept per Pokémon, as the app's ladder screens already do. The
# tails are real but unreadable on a phone -- one Pokémon in a month of
# Limitless events had 210 distinct teammates -- and they were most of a
# regulation pack, which changes, and is re-downloaded, several times a day.
# The entries kept carry exactly the site's numbers.
LIST_LIMITS = {"moves": 20, "items": 12, "abilities": 10, "tera": 10, "natures": 10, "mates": 20}


def _named(rows, table=None, text_at=2, icon_at=None, limit=None):
    """[[name, pct], ...] from the site's display rows, filing their text once."""
    out = []
    for row in (rows or [])[:limit]:
        name = row[0]
        if table is not None and len(row) > text_at and name not in table:
            text = row[text_at]
            table[name] = [text, list(row[icon_at] or (0, 0))] if icon_at is not None else text
        out.append([name, row[1]])
    return out


def dataset(A, pokemon_index, total_teams, pdict, win_rates=None):
    """One dataset: every Pokémon, ranked by usage, with its full detail.

    pokemon_index is the aggregate's {name: counts} as the site holds it.
    win_rates, when given, is {name: percent} for sources whose aggregate does
    not carry its own (official events work it out from final records).
    """
    ordered = sorted(
        pokemon_index,
        key=lambda n: pokemon_index[n].get("usage_pct", 0),
        reverse=True,
    )
    entries = []
    for name in ordered:
        counts = pokemon_index[name]
        if win_rates is not None:
            counts = dict(counts, win_rate=win_rates.get(name))
        # The page's own per-Pokémon compiler, handed a one-entry index so it
        # neither re-ranks the whole list nor fuzzy-matches the name.
        ctx = A._compile_limitless_pokemon_context({name: counts}, total_teams, name)
        if ctx is None:
            continue
        pdict.add_species(name)
        mates = _named(ctx["teammates_list"], limit=LIST_LIMITS["mates"])
        for mate, _ in mates:
            pdict.add_species(mate)
        win = ctx.get("win_rate")
        entries.append({
            "name": name,
            "pct": "{:.1f}".format(counts.get("usage_pct", 0)),
            "count": counts.get("usage_count", 0),
            "win": None if win in (None, "—") else win,
            "moves": _named(ctx["moves_list"], pdict.moves, limit=LIST_LIMITS["moves"]),
            "items": _named(ctx["items_list"], pdict.items, icon_at=3,
                            limit=LIST_LIMITS["items"]),
            "abilities": _named(ctx["abilities_list"], pdict.abilities,
                                limit=LIST_LIMITS["abilities"]),
            "tera": _named(ctx["tera_types_list"], limit=LIST_LIMITS["tera"]),
            "natures": _named(ctx["natures_list"], pdict.natures, limit=LIST_LIMITS["natures"]),
            "mates": mates,
        })
    return {"teams": total_teams, "pokemon": entries}


def team_sheet(slots, pdict):
    """A team as [[species, item, ability, tera, nature, [moves]], ...]."""
    sheet = []
    for slot in slots or []:
        species = slot.get("pokemon") or ""
        if not species:
            continue
        item = slot.get("item") or ""
        pdict.add_species(species)
        pdict.add_item(item)
        sheet.append([
            species,
            item,
            slot.get("ability") or "",
            slot.get("tera_type") or slot.get("tera") or "",
            slot.get("nature") or "",
            list(slot.get("moves") or []),
        ])
    return sheet


def resolve_rounds(rounds, index_of):
    """Pairings with each player replaced by their standings index.

    index_of maps a name to its index; a name it does not cover -- a player the
    roster never matched, or two players sharing a name -- stays a string, so
    the round still reads correctly and simply cannot link to a team.
    """
    out = []
    for rnd in rounds or []:
        out.append({
            "round": rnd["round"],
            "stage": rnd.get("stage", ""),
            "matches": [
                [index_of.get(a, a) if a else None, index_of.get(b, b) if b else None, result]
                for a, b, result in rnd["matches"]
            ],
        })
    return out


def unique_index(names):
    """{name: position} for names that occur once; shared names are left out."""
    seen = {}
    for i, name in enumerate(names):
        seen.setdefault(name, []).append(i)
    return {name: spots[0] for name, spots in seen.items() if len(spots) == 1}


def write_pack(path, body):
    """Write gzipped JSON; return (bytes, revision).

    mtime=0 and a fixed serialization make the same data produce the same
    bytes, so an unchanged rebuild keeps its ETag and the app gets a 304. The
    revision is the hash of those bytes, for the index.
    """
    blob = json.dumps(body, separators=(",", ":"), ensure_ascii=False).encode("utf8")
    packed = gzip.compress(blob, compresslevel=9, mtime=0)
    tmp = "%s.%d.tmp" % (path, os.getpid())
    with open(tmp, "wb") as fh:
        fh.write(packed)
    os.replace(tmp, path)
    return len(packed), hashlib.sha256(packed).hexdigest()[:16]


def write_json(path, body):
    tmp = "%s.%d.tmp" % (path, os.getpid())
    with open(tmp, "w", encoding="utf8") as fh:
        json.dump(body, fh, separators=(",", ":"), ensure_ascii=False)
    os.replace(tmp, path)


API_VERSION = mobile_api.API_VERSION
