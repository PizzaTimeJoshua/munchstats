"""Usage packs, compact: the same data in under half the bytes.

A pack (build_packs.py) repeats itself: every Pokemon's moves carry the move's
whole description, every percentage is a string, every species holds the same
twelve trend months, and its long lists -- EV spreads, the stat histogram --
are numbers spelled out in full. gzip only looks 32 KB back, so a description
repeated a megabyte apart costs nearly as much the second time as the first.

The compact layout says each name and description once, numbers as integers
(each percentage as the step from the entry before, the lists being sorted),
and what every species shares once a pack. It is still JSON, gzipped, so the
app reads it as it reads a pack, then expands it back to exactly that pack
(src/db/compactpack.ts) -- the screens never see the difference. On September
2026's packs: 45% of the size, Gen 9 OU's four 3.0 MB -> 1.3 MB.

Exact or not at all: a species that does not come back exactly as it was --
a field this does not know, a percentage written differently -- is kept as it
was, in full, beside the others. encode() checks every species, and the whole
pack, against decode().

    {"compact": 1, <the pack's own fields but "pokemon">,
     "shared": {field: value every species has}, "months": [the trend's months],
     "dec": {list: decimals of its percentages},
     "names": [every name, once], "texts": [every description, once],
     "desc": [[list, name, text]], "sprite": [[list or "species", name, [x, y]]],
     "order": [species, in the pack's order],
     "species": [record, or null for one kept as it was], "raw": {species: payload}}

A record: [name, usage, sprite, base stats, types, trend usage, trend show,
trend kind, is_transformed, each of LISTS as [name, step, ...], spreads as
[nature, six numbers, step, ...], the EV lists, the stat histogram (null for
a species without one)] -- names by their place in "names".

Standard library only.
"""

import gzip
import json
import re

LAYOUT = 1

# The lists of [name, "percentage", ...]: what else their entries carry, which
# is the same for a name wherever it appears.
LISTS = [
    ("moves_list", "desc"),
    ("teammates_list", "sprite"),
    ("items_list", "desc+sprite"),
    ("abilities_list", "desc"),
    ("natures_list", "desc"),
    ("counters_list", "sprite"),
    ("tera_types_list", ""),
]
# Fields every species of a pack has alike.
SHARED = ["api_version", "month", "format", "rating", "category", "value_kind"]
KNOWN = {"name", "usage", "rank", "sprite", "base_stats", "pokemon_types", "trend", "spreads_list",
         "evs_list", "graph_data", "is_transformed"} | set(SHARED) | {f for f, _ in LISTS}
EV = re.compile(r"^(\d+)([+-]?) (\S+)$")              # "32+ Atk", "252 HP"
SPREAD = re.compile(r"^([^:]+):(\d+)/(\d+)/(\d+)/(\d+)/(\d+)/(\d+)$")   # "Adamant:252/0/4/0/0/252"
SIGNS = ["", "-", "+"]


def compact_filename(filename):
    """"gen9ou__1500.json.gz" -> "gen9ou__1500.c.json.gz"."""
    return filename[:-len(".json.gz")] + ".c.json.gz"


class _Table:
    def __init__(self):
        self.items, self.at = [], {}

    def __call__(self, s):
        i = self.at.get(s)
        if i is None:
            i = self.at[s] = len(self.items)
            self.items.append(s)
        return i


def _pct_int(s, dec):
    """"97.541" with 3 decimals -> 97541; anything else raises."""
    whole, _, frac = s.partition(".")
    if len(frac) != dec or not whole.isdigit() or (frac and not frac.isdigit()):
        raise ValueError(s)
    return int(whole + frac)


def _pct_str(v, dec):
    s = str(v).rjust(dec + 1, "0")
    return s[:-dec] + "." + s[-dec:] if dec else s


def _sprite_kind(field):
    # Teammates and counters are species: one sprite each, whichever list.
    return "species" if field in ("teammates_list", "counters_list") else field


def encode(pack):
    """A pack (build_packs.py's body) -> its compact form; decode() gives it back exactly."""
    sp = pack["pokemon"]
    first = next(iter(sp.values()), {})
    shared = {k: first.get(k) for k in SHARED}
    months = (first.get("trend") or {}).get("months")
    names, texts = _Table(), _Table()
    desc, sprite = {}, {}
    dec = {}
    for field, _ in LISTS:
        found = {len(e[1].partition(".")[2]) for p in sp.values() for e in p.get(field) or []
                 if isinstance(e, list) and len(e) > 1 and isinstance(e[1], str)}
        dec[field] = found.pop() if len(found) == 1 else 3

    def record(rank, p):
        # graph_data may be missing: a species with no stat histogram.
        assert set(p) | {"graph_data"} == KNOWN and p["rank"] == rank and all(p[k] == v for k, v in shared.items())
        trend = p["trend"]
        assert set(trend) == {"months", "usage", "show", "kind"} and trend["months"] == months
        rec = [names(p["name"]), p["usage"], p["sprite"], p["base_stats"], [names(t) for t in p["pokemon_types"]],
               trend["usage"], trend["show"], names(trend["kind"]), p["is_transformed"]]
        for field, extra in LISTS:
            flat, prev = [], 0
            for e in p[field]:
                assert len(e) == 2 + ("desc" in extra) + ("sprite" in extra)
                i = names(e[0])
                v = _pct_int(e[1], dec[field])
                flat += [i, prev - v]
                prev = v
                if "desc" in extra:
                    t = texts(e[2])
                    assert desc.setdefault((field, i), t) == t
                if "sprite" in extra:
                    assert sprite.setdefault((_sprite_kind(field), i), e[-1]) == e[-1]
            rec.append(flat)
        flat, prev = [], 0
        for label, pct in p["spreads_list"]:
            m = SPREAD.match(label)
            v = _pct_int(pct, 3)
            flat += [names(m.group(1))] + [int(x) for x in m.groups()[1:]] + [prev - v]
            prev = v
        rec.append(flat)
        evs = []
        for lst in p["evs_list"]:
            # "32+ Atk", or several joined: "252 HP / 0 Def". The stats are
            # the list's own; each entry, a number and a sign for each.
            stats = [EV.match(part).group(3) for part in lst[0][0].split(" / ")] if lst else []
            row, prev = [len(stats)] + [names(s) for s in stats], 0
            for label, pct in lst:
                parts = [EV.match(part) for part in label.split(" / ")]
                assert [m.group(3) for m in parts] == stats
                for m in parts:
                    row += [int(m.group(1)), SIGNS.index(m.group(2))]
                v = _pct_int(pct, 3)
                row.append(prev - v)
                prev = v
            evs.append(row)
        rec.append(evs)
        graph = [] if "graph_data" in p else None
        for st in p.get("graph_data") or []:
            row, ps, pv = [], 0, 0
            for s, pct in st:
                v = round(pct * 100)
                assert isinstance(s, int) and v / 100 == pct
                row += [s - ps, pv - v]
                ps, pv = s, v
            graph.append(row)
        rec.append(graph)
        return rec

    out = {k: v for k, v in pack.items() if k != "pokemon"}
    out.update(compact=LAYOUT, shared=shared, months=months, dec=dec)
    records, raw = [], {}
    for rank, (name, p) in enumerate(sp.items(), 1):
        try:
            rec = record(rank, p)
            ok = _species(rec, rank, out, names.items, texts.items, desc, sprite) == p
        except Exception:
            ok = False
        if ok:
            records.append(rec)
        else:
            records.append(None)
            raw[name] = p
    out.update(names=names.items, texts=texts.items,
               desc=sorted([f, i, t] for (f, i), t in desc.items()),
               sprite=sorted([f, i, xy] for (f, i), xy in sprite.items()),
               order=list(sp), species=records, raw=raw)
    if decode(out) != pack:
        raise ValueError("pack does not come back exactly")
    return out


def _species(rec, rank, c, names, texts, desc, sprite):
    shared = c["shared"]
    name, usage, at, base, types, trend_usage, show, kind, transformed = rec[:9]
    p = {"api_version": shared["api_version"], "month": shared["month"], "format": shared["format"],
         "rating": shared["rating"], "name": names[name], "usage": usage, "rank": rank, "sprite": at,
         "is_transformed": transformed, "category": shared["category"], "value_kind": shared["value_kind"],
         "trend": {"months": c["months"], "usage": trend_usage, "show": show, "kind": names[kind]},
         "base_stats": base, "pokemon_types": [names[t] for t in types]}
    for (field, extra), flat in zip(LISTS, rec[9:9 + len(LISTS)]):
        lst, v = [], 0
        for j in range(0, len(flat), 2):
            i = flat[j]
            v -= flat[j + 1]
            e = [names[i], _pct_str(v, c["dec"][field])]
            if "desc" in extra:
                e.append(texts[desc[(field, i)]])
            if "sprite" in extra:
                e.append(sprite[(_sprite_kind(field), i)])
            lst.append(e)
        p[field] = lst
    flat, v = rec[9 + len(LISTS)], 0
    p["spreads_list"] = []
    for j in range(0, len(flat), 8):
        v -= flat[j + 7]
        p["spreads_list"].append(["%s:%s" % (names[flat[j]], "/".join(str(x) for x in flat[j + 1:j + 7])),
                                  _pct_str(v, 3)])
    p["evs_list"] = []
    for row in rec[10 + len(LISTS)]:
        k = row[0]
        stats = [names[i] for i in row[1:1 + k]]
        lst, j, v = [], 1 + k, 0
        while j < len(row):
            label = " / ".join("%d%s %s" % (row[j + 2 * q], SIGNS[row[j + 2 * q + 1]], stats[q]) for q in range(k))
            v -= row[j + 2 * k]
            lst.append([label, _pct_str(v, 3)])
            j += 2 * k + 1
        p["evs_list"].append(lst)
    if rec[11 + len(LISTS)] is None:
        return p
    p["graph_data"] = []
    for row in rec[11 + len(LISTS)]:
        st, s, v = [], 0, 0
        for j in range(0, len(row), 2):
            s += row[j]
            v -= row[j + 1]
            st.append([s, v / 100])
        p["graph_data"].append(st)
    return p


def decode(c):
    """A compact pack -> the pack it was made from."""
    desc = {(f, i): t for f, i, t in c["desc"]}
    sprite = {(f, i): xy for f, i, xy in c["sprite"]}
    pokemon = {}
    for rank, (name, rec) in enumerate(zip(c["order"], c["species"]), 1):
        pokemon[name] = c["raw"][name] if rec is None else _species(rec, rank, c, c["names"], c["texts"], desc, sprite)
    own = ("compact", "shared", "months", "dec", "names", "texts", "desc", "sprite", "order", "species", "raw")
    return dict({k: v for k, v in c.items() if k not in own}, pokemon=pokemon)


def gzipped(obj):
    """JSON, gzipped as build_packs writes packs: the same bytes for the same data."""
    blob = json.dumps(obj, separators=(",", ":"), ensure_ascii=False, default=str).encode("utf8")
    return blob, gzip.compress(blob, compresslevel=9, mtime=0)
