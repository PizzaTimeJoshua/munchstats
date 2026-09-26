"""Build the app's Mystery Dungeon sprites: every Pokémon in the replay data
as the PMD Sprite Collab draws it, for the replay player.

Run by .github/workflows/update-replay-stats.yml after the app's replay files
are built, and before they are published:

    python site/build_sprite_pack.py --out site-data/app --prev prev/app \
        --pokedex site/stats/pokedex.json

The PMD Sprite Collab (https://sprites.pmdcollab.org, its files at
https://github.com/PMDCollab/SpriteCollab) shares its sprites under CC BY-NC
4.0: free, non-commercial use, with its artists credited. A sprite is a set
of small animations, each a sheet of frames in eight facings (Down,
DownRight, Right, UpRight, Up, UpLeft, Left, DownLeft). The player uses a few
of them, and only the facings it shows -- toward the viewer (the far side)
and away (the near one), and for a move aimed at a foe the diagonals toward
the right too, so that in doubles a Pokémon attacking across the field turns
to its target (toward the left is the right mirrored):

    Idle              standing
    Attack            a move that makes contact
    Shoot, SpAttack   a move sent from afar (SpAttack, when it has one, for
                      a special move)
    Rotate            a spinning one (one facing: it turns through them all)
    Charge            a move on itself or the field
    Hurt, Sleep       hit; asleep

(The collab draws more -- a double strike, a swing, a hop -- which would
double the pack for moves Attack shows well enough.)

A Pokémon's animations are trimmed to what is drawn in them, each frame
drawn once (a frame shown twice is kept once), and laid out in rows in one
image, about as wide as it is tall; scaled twice (nearest neighbour, so the
pixels stay crisp when the phone scales them) unless that would make it too
big to hold on a phone, and saved as a palette PNG:
app/pmd/<Showdown sprite id>.png, about 17 KB each, so a change fetches just
that Pokémon again.

app/pmd/index.json.gz says, per Pokémon, its image's size and revision, the
scale it is saved at, and each animation's frames: for how long each is
shown (in 1/60 s), the one an attack strikes on, which cell each frame is
when a drawing is shown more than once, and per facing
[x, y, per row, w, h, ax, ay] -- where its cells start, how many to a row,
their size and where the Pokémon stands in them (the frame's centre in the
collab's sheets: its shadow falls 4 pixels below) -- and, if its frames are
not the others' cells, its own list of them. An animation the collab draws
as another is that one's name. Then the artists to credit, each with
the Pokémon they drew. index.json gains "pmd": that file, its size and
revision.

--out holds the replay files build_replay_packs.py wrote: index.json and
sprites.json.gz, which names every species the replays show (species id ->
[icon, Showdown sprite id]); each is matched to the collab's tracker by its
national dex number and forme. --prev is the app's files as last published:
a Pokémon whose sprite the collab has not changed since (the tracker's
"sprite_modified") is copied from there, not fetched again, and so is one
that could not be fetched this time; a run that cannot reach the collab at
all publishes the pack as it was.

Standalone: the standard library, and Pillow for the images.
"""

import argparse
import gzip
import hashlib
import io
import json
import math
import os
import re
import shutil
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

# The layout of what this writes: a change to it rebuilds every image.
VERSION = 1
RAW = "https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/"
DIR = "pmd"
# The animations the player uses, and the facings of each it needs; the
# first ones are kept first when an image has to lose some to fit.
ANIMS = {
    "Idle": (0, 4),
    "Attack": (0, 1, 3, 4),
    "Hurt": (0, 4),
    "Sleep": (0,),
    "Charge": (0, 4),
    "Shoot": (0, 1, 3, 4),
    "Rotate": (0,),
    "SpAttack": (0, 1, 3, 4),
}
# Scaled twice, unless that makes an image too big for a phone to hold
# decoded: then as drawn. Pixels of the image as saved.
SCALE = 2
MAX_SIDE = 4096          # a side: the largest texture most phones draw
MAX_AREA = 4 << 20       # 16 MB decoded


def norm(text):
    return re.sub(r"[^a-z0-9]", "", (text or "").lower())


def fetch(url, tries=3):
    for attempt in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=60) as res:
                return res.read()
        except urllib.error.HTTPError as err:
            if err.code == 404 or attempt == tries - 1:
                raise
        except Exception:
            if attempt == tries - 1:
                raise
    return b""


def missing(err):
    """Whether a fetch failed because the file is not there (not the network)."""
    return isinstance(err, urllib.error.HTTPError) and err.code == 404


# ─── which of the collab's sprites is which Pokémon ────────────────────────

# Formes no rule below finds: Showdown's species id -> the collab's forme
# ("" its base form). Its base Maushold is the family of four; the rest are
# drawn no differently from the base.
ALIASES = {
    "maushold": "three",
    "mausholdfour": "",
    "rockruffdusk": "",
    "greninjabond": "",
    "sinisteaantique": "",
    "polteageistantique": "",
    "poltchageistartisan": "",
    "sinistchamasterpiece": "",
    "tatsugiricurlymega": "mega",
}
# What a forme's name may end in that the collab does not draw apart: a
# Totem is its form bigger, a Terastallized Ogerpon its mask's form, Let's
# Go's partners the usual ones.
LOOKS_LIKE = ("totem", "tera", "starter")


def dex_forme(species, pokedex, cosmetic):
    """(national dex number, forme, whether the forme is only cosmetic) for a
    species id, or None. A cosmetic forme ("Gastrodon-East", "Unown-B") has
    no number of its own, or no entry: its base species' number."""
    info = pokedex.get(species)
    if info is None:
        if species not in cosmetic:
            return None
        base, forme = cosmetic[species]
        num = pokedex[base].get("num")
        return (num, forme, True) if isinstance(num, int) and num > 0 else None
    num = info.get("num")
    if isinstance(num, int) and num > 0:
        return num, info.get("forme"), False
    num = (pokedex.get(norm(info.get("baseSpecies"))) or {}).get("num")
    return (num, info.get("forme"), True) if isinstance(num, int) and num > 0 else None


def form_node(tracker, num, forme, cosmetic=False, alias=None):
    """The tracker's node for a Pokémon -- its dex number's entry, or the
    forme's slot in it -- as (path, node), or None when the collab has none.
    The forme by name; else, but for a Mega or Gigantamax, by the start of
    either name ("Ice" is "Ice_Rider", "Blue-Striped" "Blue"); a cosmetic one
    the collab does not draw is drawn as the base form."""
    entry = tracker.get("%04d" % num)
    if not entry:
        return None
    base = ("%04d" % num, entry)
    if alias is not None:
        want = alias
    else:
        want = norm(forme).replace("gmax", "gigantamax")
        for tail in LOOKS_LIKE:
            if want.endswith(tail):
                want = want[: -len(tail)]
    if not want:
        return base
    fallback = base if cosmetic else None
    subs = sorted((entry.get("subgroups") or {}).items())
    for key, sub in subs:
        if norm(sub.get("name")) == want:
            return ("%04d/%s" % (num, key), sub) if sub.get("sprite_files") or not cosmetic else base
    # A gendered forme ("Indeedee-F") is the female slot of the base form
    # (though Unown-F is a letter, found above).
    if want == "f":
        normal = ((entry.get("subgroups") or {}).get("0000") or {}).get("subgroups") or {}
        female = ((normal.get("0000") or {}).get("subgroups") or {}).get("0002")
        return ("%04d/0000/0000/0002" % num, female) if female and female.get("sprite_files") else fallback
    if "mega" not in want and "gigantamax" not in want and "primal" not in want:
        for key, sub in subs:
            name = norm(sub.get("name"))
            if name and sub.get("sprite_files") and (name.startswith(want) or want.startswith(name)):
                return "%04d/%s" % (num, key), sub
    return fallback


def targets(table, pokedex, tracker):
    """Showdown sprite id -> (collab path, node), for each the collab has a sprite of."""
    cosmetic = {}
    for base, info in pokedex.items():
        for name in info.get("cosmeticFormes") or ():
            cosmetic[norm(name)] = (base, name[len(info.get("name", "")) + 1:])
    out = {}
    for species, value in table.items():
        sprite_id = value[1] if isinstance(value, list) and len(value) > 1 else species
        if sprite_id in out:
            continue
        found = dex_forme(species, pokedex, cosmetic)
        if not found:
            continue
        num, forme, only_cosmetic = found
        node = form_node(tracker, num, forme, only_cosmetic, ALIASES.get(species))
        if node and node[1] and node[1].get("sprite_files"):
            out[sprite_id] = node
    return out


# ─── one Pokémon ──────────────────────────────────────────────────────────

def anim_table(xml_bytes):
    """Name -> <Anim>, a CopyOf followed to what it copies."""
    root = ET.fromstring(xml_bytes)
    anims = {a.findtext("Name"): a for a in root.iter("Anim")}
    resolved = {}
    for name, a in anims.items():
        seen = set()
        while a is not None and a.findtext("CopyOf") and a.findtext("Name") not in seen:
            seen.add(a.findtext("Name"))
            a = anims.get(a.findtext("CopyOf"))
        if a is not None:
            resolved[name] = a
    return resolved


def half(n):
    return n // 2 if n % 2 == 0 else n / 2


def cut(a, sheet, facings):
    """One sheet's frames, per facing asked for (of those it has): a strip of
    them trimmed to what is drawn in any, each drawn frame once. None when
    nothing is drawn."""
    fw, fh = int(a.findtext("FrameWidth")), int(a.findtext("FrameHeight"))
    count = sheet.width // fw
    durations = [int(d.text) for d in a.findall("Durations/Duration")][:count] or [1] * count
    count = len(durations)
    strips = {}
    for f in [f for f in facings if (f + 1) * fh <= sheet.height] or [0]:
        frames = [sheet.crop((i * fw, f * fh, (i + 1) * fw, (f + 1) * fh)) for i in range(count)]
        box = None
        for frame in frames:
            drawn = frame.getchannel("A").getbbox()
            if drawn:
                box = drawn if box is None else (
                    min(box[0], drawn[0]), min(box[1], drawn[1]), max(box[2], drawn[2]), max(box[3], drawn[3]))
        if box is None:
            continue
        cells, order, seen = [], [], {}
        for frame in frames:
            cell = frame.crop(box)
            key = cell.tobytes()
            if key not in seen:
                seen[key] = len(cells)
                cells.append(cell)
            order.append(seen[key])
        strip = {
            "w": box[2] - box[0],
            "h": box[3] - box[1],
            # Where the Pokémon stands in a cell: the frame's centre.
            "ax": half(fw) - box[0],
            "ay": half(fh) - box[1],
            "cells": cells,
        }
        if order != list(range(count)):
            strip["frames"] = order
        strips[f] = strip
    if not strips:
        return None
    block = {"durations": durations, "strips": strips}
    for key, tag in (("hit", "HitFrame"), ("rush", "RushFrame"), ("return", "ReturnFrame")):
        if a.findtext(tag):
            block[key] = int(a.findtext(tag))
    return block


def pack(strips):
    """Strips of cells in one image about as wide as it is tall: each strip's
    cells in rows of as many as fit, the strips in shelves, tallest first.
    (image, [(x, y, cells to a row)] in the strips' order)."""
    area = sum(len(s["cells"]) * s["w"] * s["h"] for s in strips)
    width = max(max(s["w"] for s in strips), math.ceil(math.sqrt(area) * 1.05))
    places = [None] * len(strips)
    x = y = shelf = right = 0
    for i in sorted(range(len(strips)), key=lambda i: -strips[i]["h"]):
        s = strips[i]
        cols = max(1, min(len(s["cells"]), width // s["w"]))
        w, h = cols * s["w"], -(-len(s["cells"]) // cols) * s["h"]
        if x and x + w > width:
            x, y, shelf = 0, y + shelf, 0
        places[i] = (x, y, cols)
        x += w
        shelf = max(shelf, h)
        right = max(right, x)
    atlas = Image.new("RGBA", (right, y + shelf), (0, 0, 0, 0))
    for s, (sx, sy, cols) in zip(strips, places):
        for i, cell in enumerate(s["cells"]):
            atlas.paste(cell, (sx + (i % cols) * s["w"], sy + (i // cols) * s["h"]))
    return atlas, places


def fits(w, h, scale):
    return max(w, h) * scale <= MAX_SIDE and w * h * scale * scale <= MAX_AREA


def build_sprite(path):
    """(image bytes, {scale, size, anims}) for the collab sprite at `path`,
    or None: when any of it could not be fetched, to be tried again another
    run (a sheet the collab does not have is only left out), or when there
    is no Idle."""
    base = RAW + "sprite/" + path + "/"
    try:
        anims = anim_table(fetch(base + "AnimData.xml"))
    except Exception:
        return None
    # The sheets, each once, with every facing the animations drawn from it need.
    uses = {}
    for name, facings in ANIMS.items():
        a = anims.get(name)
        if a is not None:
            uses.setdefault(a.findtext("Name"), [a, set()])[1].update(facings)
    blocks = {}
    for sheet, (a, facings) in uses.items():
        try:
            image = Image.open(io.BytesIO(fetch(base + sheet + "-Anim.png"))).convert("RGBA")
        except Exception as err:
            if missing(err):
                continue
            return None
        block = cut(a, image, sorted(facings))
        if block:
            blocks[sheet] = block
    named = [(name, anims[name].findtext("Name")) for name in ANIMS if name in anims and anims[name].findtext("Name") in blocks]
    if not named or named[0][0] != "Idle":
        return None
    # The whole, at the largest scale it fits; if it does not fit as drawn,
    # the last animations are let go until it does.
    while True:
        sheets = list(dict.fromkeys(sheet for _, sheet in named))
        strips = [(sheet, f) for sheet in sheets for f in blocks[sheet]["strips"]]
        atlas, places = pack([blocks[sheet]["strips"][f] for sheet, f in strips])
        scale = next((s for s in (SCALE, 1) if fits(atlas.width, atlas.height, s)), 0)
        if scale or len(named) == 1:
            break
        named.pop()
    if not scale:
        return None
    at = dict(zip(strips, places))
    layout = {}
    first = {}
    for name, sheet in named:
        if sheet in first:
            layout[name] = first[sheet]
            continue
        first[sheet] = name
        b = blocks[sheet]
        entry = {k: v for k, v in b.items() if k != "strips"}
        # Which cell each frame is: once for the animation when every facing
        # has the same, as most do.
        orders = [s.get("frames") for s in b["strips"].values()]
        shared = all(o == orders[0] for o in orders)
        if shared and orders[0]:
            entry["frames"] = orders[0]
        entry["facings"] = {}
        for f, s in b["strips"].items():
            x, y, cols = at[(sheet, f)]
            cell = [x, y, cols, s["w"], s["h"], s["ax"], s["ay"]]
            if not shared:
                cell.append(s.get("frames") or list(range(len(b["durations"]))))
            entry["facings"][str(f)] = cell
        layout[name] = entry
    if scale != 1:
        atlas = atlas.resize((atlas.width * scale, atlas.height * scale), Image.NEAREST)
    buf = io.BytesIO()
    atlas.quantize(colors=64, method=Image.Quantize.FASTOCTREE).save(buf, "PNG", optimize=True)
    return buf.getvalue(), {"scale": scale, "size": [atlas.width // scale, atlas.height // scale], "anims": layout}


# ─── all of them ──────────────────────────────────────────────────────────

def credit_names(text):
    """Discord id or name -> (name, contact), from the collab's credit_names.txt."""
    names = {}
    for line in text.splitlines()[1:]:
        parts = line.split("\t")
        if len(parts) >= 2:
            name, discord = parts[0].strip(), parts[1].strip()
            contact = parts[2].strip() if len(parts) > 2 else ""
            names[discord] = (name, contact)
            names[name] = (name, contact)
    return names


def read_json_gz(path):
    try:
        with gzip.open(path, "rt", encoding="utf8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return None


LAID_OUT = ("scale", "size", "anims")


def build(out, prev, pokedex_path, workers=16, limit=0):
    index_path = os.path.join(out, "index.json")
    with open(index_path, encoding="utf8") as fh:
        index = json.load(fh)
    with gzip.open(os.path.join(out, index["sprites"]["file"]), "rt", encoding="utf8") as fh:
        table = json.load(fh)
    with open(pokedex_path, encoding="utf8") as fh:
        pokedex = json.load(fh)
    tracker = json.loads(fetch(RAW + "tracker.json"))
    names = credit_names(fetch(RAW + "credit_names.txt").decode("utf8"))
    want = sorted(targets(table, pokedex, tracker).items())
    if limit:
        want = want[:limit]

    old_index = read_json_gz(os.path.join(prev, DIR, "index.json.gz")) if prev else None
    old = (old_index or {}).get("sprites", {}) if (old_index or {}).get("version") == VERSION else {}
    os.makedirs(os.path.join(out, DIR), exist_ok=True)

    def job(item):
        """(sprite id, collab path, its tracker node, when the collab last
        changed what is written, its layout or None, whether fetched)."""
        sprite_id, (path, node) = item
        modified = node.get("sprite_modified", "")
        was = old.get(sprite_id)
        src = os.path.join(prev, DIR, sprite_id + ".png") if prev else ""
        dst = os.path.join(out, DIR, sprite_id + ".png")
        kept = bool(was) and os.path.exists(src)
        if kept and was.get("path") == path and was.get("modified") == modified:
            shutil.copyfile(src, dst)
            return sprite_id, path, node, modified, {k: was[k] for k in LAID_OUT}, False
        built = build_sprite(path)
        if not built:
            # Not fetched this time: the one last published, if there is one,
            # under its old date so that the next run tries again.
            if kept:
                shutil.copyfile(src, dst)
                return sprite_id, was["path"], node, was.get("modified", ""), {k: was[k] for k in LAID_OUT}, False
            return sprite_id, path, node, modified, None, False
        data, layout = built
        with open(dst, "wb") as fh:
            fh.write(data)
        return sprite_id, path, node, modified, layout, True

    sprites = {}
    artists = {}
    fetched = 0
    with ThreadPoolExecutor(workers) as pool:
        for sprite_id, path, node, modified, layout, new in pool.map(job, want):
            if layout is None:
                continue
            fetched += new
            with open(os.path.join(out, DIR, sprite_id + ".png"), "rb") as fh:
                data = fh.read()
            credit = node.get("sprite_credit") or {}
            for key in [credit.get("primary")] + list(credit.get("secondary") or []):
                if key:
                    name, contact = names.get(key, (key, ""))
                    artists.setdefault(name, {"name": name, "contact": contact, "pokemon": set()})["pokemon"].add(sprite_id)
            sprites[sprite_id] = {
                "bytes": len(data),
                "revision": hashlib.sha256(data).hexdigest()[:16],
                "path": path,
                "modified": modified,
                **layout,
            }

    body = {
        "version": VERSION,
        "source": "https://sprites.pmdcollab.org",
        "license": "CC BY-NC 4.0",
        "license_url": "https://creativecommons.org/licenses/by-nc/4.0/",
        "sprites": sprites,
        "artists": sorted(
            ({"name": a["name"], "contact": a["contact"], "pokemon": sorted(a["pokemon"])} for a in artists.values()),
            key=lambda a: (-len(a["pokemon"]), a["name"].lower()),
        ),
    }
    blob = gzip.compress(json.dumps(body, separators=(",", ":"), ensure_ascii=False).encode("utf8"), 9, mtime=0)
    with open(os.path.join(out, DIR, "index.json.gz"), "wb") as fh:
        fh.write(blob)
    index["pmd"] = {
        "file": DIR + "/index.json.gz",
        "bytes": len(blob),
        "revision": hashlib.sha256(blob).hexdigest()[:16],
        "version": VERSION,
        "count": len(sprites),
        "total": sum(s["bytes"] for s in sprites.values()),
    }
    write_index(index_path, index)
    print("sprites: %d of %d Pokémon (%d fetched, %d kept), %.1f MB of images, index %.0f KB, %d artists"
          % (len(sprites), len(table), fetched, len(sprites) - fetched,
             index["pmd"]["total"] / 1048576, len(blob) / 1024, len(body["artists"])))
    return 0


def write_index(path, index):
    """index.json, whole or not at all: the replay files are published even
    when this step fails."""
    with open(path + ".tmp", "w", encoding="utf8") as fh:
        json.dump(index, fh, separators=(",", ":"), ensure_ascii=False)
    os.replace(path + ".tmp", path)


def carry_forward(out, prev):
    """The pack as last published, for a run that cannot build one (the
    collab out of reach): the app keeps its sprites rather than losing them
    for six hours. Whether there was one to keep."""
    try:
        with open(os.path.join(prev, "index.json"), encoding="utf8") as fh:
            entry = json.load(fh).get("pmd")
    except (OSError, ValueError):
        return False
    if not entry or entry.get("version") != VERSION or not os.path.isdir(os.path.join(prev, DIR)):
        return False
    index_path = os.path.join(out, "index.json")
    with open(index_path, encoding="utf8") as fh:
        index = json.load(fh)
    shutil.rmtree(os.path.join(out, DIR), ignore_errors=True)
    shutil.copytree(os.path.join(prev, DIR), os.path.join(out, DIR))
    index["pmd"] = entry
    write_index(index_path, index)
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", required=True, help="the app's replay files, as build_replay_packs.py wrote them")
    parser.add_argument("--prev", default="", help="the app's files as last published, if any")
    parser.add_argument("--pokedex", required=True, help="Showdown's pokedex.json")
    parser.add_argument("--workers", type=int, default=16)
    parser.add_argument("--limit", type=int, default=0, help="only the first N Pokémon (for trying it out)")
    args = parser.parse_args()
    try:
        return build(args.out, args.prev, args.pokedex, args.workers, args.limit)
    except Exception as exc:
        print("sprites: not built -- %s: %s" % (type(exc).__name__, exc), file=sys.stderr)
        if args.prev and carry_forward(args.out, args.prev):
            print("sprites: kept the pack as last published")
            return 0
        return 1


if __name__ == "__main__":
    sys.exit(main())
