"""Build the mobile app's replay files from the scraper's replay lists.

Run by .github/workflows/update-replay-stats.yml after the scraper and before
the lists are gzipped and published to the replay-data branch:

    python site/build_replay_packs.py --src site-data/stats/replays \
        --data site/stats --out site-data/app

Standalone on purpose -- the standard library and two of the site's data files
-- because that workflow checks out the scraper, not the site.

The app searches replays itself, on the phone, rather than asking the site:
each search there streams a format's whole list, up to 67,000 replays, through
the dyno. What it needs per replay is small -- who played, both teams, what
each brought, rating, winner, when -- and the battles themselves stay on
Showdown, fetched one at a time when watched.

Replays are grouped into one file per upload day (UTC). A day that has passed
never changes again, so after the first download the app fetches only today's
file every six hours, not the month again: about a third of a megabyte a day
across all sixteen formats, where whole-format files would be tens.

Output (--out):
    index.json                    formats, their days and top teams, sizes and
                                  content hashes
    sprites.json.gz               every species name -> [icon number, Showdown
                                  sprite id], for sprites in lists and the player
    replays/<format>/<day>.json.gz
    teams/<format>.json.gz        the TOP_TEAMS best teams by the site's score

A day file:
    {"format", "day", "species": [names], "players": [names],
     "replays": [[id, p1, p2, team1, team2, brought1, brought2, time, rating,
                  winner(, bo3)], ...]}
id is the number after the format in the replay id; players and species are
positions in the file's own tables; brought is a bitmask over the team's six;
winner is 1 or 2 (0 for none); bo3, in best-of-three formats, is
[score, [game ids]].
"""

import argparse
import glob
import gzip
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone

API_VERSION = 1
TOP_TEAMS = 500
REPLAYS_PER_TEAM = 10

# Chip labels for the formats the scraper follows, in the order the app offers
# them: Champions first, newest regulation first, each best-of-three beside its
# best-of-one. Anything else follows, labelled with its display name without
# the "[Gen 9 ...]" prefix.
SHORT_NAMES = {
    "gen9championsvgc2026regmc": "VGC M-C",
    "gen9championsvgc2026regmcbo3": "VGC M-C Bo3",
    "gen9championsvgc2026regmb": "VGC M-B",
    "gen9championsvgc2026regmbbo3": "VGC M-B Bo3",
    "gen9championsou": "Champions OU",
    "gen9championsbssregmc": "BSS M-C",
    "gen9championsbssregmb": "BSS M-B",
    "gen9vgc2026regi": "VGC Reg I",
    "gen9vgc2026regibo3": "VGC Reg I Bo3",
    "gen9ou": "OU",
    "gen9ubers": "Ubers",
    "gen9doublesou": "Doubles OU",
    "gen9anythinggoes": "AG",
    "gen9nationaldex": "National Dex",
    "gen9nationaldexubers": "NatDex Ubers",
    "gen9nationaldexdoubles": "NatDex Doubles",
}


def to_id(text):
    return re.sub(r"[^a-z0-9]+", "", (text or "").lower())


def read_json(path):
    """A .json or .json.gz file."""
    opener = gzip.open if path.endswith(".gz") else open
    with opener(path, "rt", encoding="utf8") as fh:
        return json.load(fh)


def write_pack(path, body):
    """Gzipped JSON, the same bytes for the same data; returns (bytes, revision)."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    blob = json.dumps(body, separators=(",", ":"), ensure_ascii=False).encode("utf8")
    packed = gzip.compress(blob, compresslevel=9, mtime=0)
    with open(path, "wb") as fh:
        fh.write(packed)
    return len(packed), hashlib.sha256(packed).hexdigest()[:16]


def replay_number(replay_id):
    """"gen9ou-2672888839" -> 2672888839; 0 for an empty slot."""
    tail = (replay_id or "").rsplit("-", 1)[-1]
    return int(tail) if tail.isdigit() else 0


class Table:
    """Strings stored once, referred to by position."""

    def __init__(self):
        self.items = []
        self._at = {}

    def __call__(self, value):
        at = self._at.get(value)
        if at is None:
            at = self._at[value] = len(self.items)
            self.items.append(value)
        return at


def brought_mask(team, used):
    used = set(used or [])
    return sum(1 << i for i, name in enumerate(team) if name in used)


# --- sprites -------------------------------------------------------------------

def sprite_table(data_dir):
    """{species id: [icon number, Showdown sprite id]} for every species the
    site's data knows, as app.get_pokemon_sprite and Showdown's client name
    them."""
    dex = read_json(os.path.join(data_dir, "pokedex.json"))
    forms = read_json(os.path.join(data_dir, "forms_index.json"))
    table = {}
    for key, entry in dex.items():
        name = entry.get("name") or key
        base = entry.get("baseSpecies") or name
        forme = entry.get("forme") or ""
        sprite_id = to_id(base) + ("-" + to_id(forme) if forme else "")
        num = forms.get(key, entry.get("num", 0))
        table[to_id(name)] = [num, sprite_id]
    for key, num in forms.items():
        table.setdefault(key, [num, key])
    return dict(sorted(table.items()))


# --- replays -------------------------------------------------------------------

def format_name(replays, fmt):
    for r in replays:
        if r.get("format"):
            return r["format"]
    return fmt


def short_name(fmt, name):
    return SHORT_NAMES.get(fmt) or re.sub(r"^\[[^\]]*\]\s*", "", name) or fmt


def brings(fmt):
    """How many of the six a player takes into a game, by the format's rules.

    From the rules, not the data: "teamused" is what appeared in battle, which
    in a best-of-three is every game's together, and an Illusion or a forme can
    count one Pokemon twice.
    """
    if "vgc" in fmt:
        return 4
    if "bss" in fmt:
        return 3
    return 6


def day_of(timestamp):
    return datetime.fromtimestamp(timestamp or 0, timezone.utc).strftime("%Y-%m-%d")


def day_file(fmt, day, replays):
    species, players = Table(), Table()
    rows = []
    # Best first within the day, as the site lists them; the app merges days.
    for r in sorted(replays, key=lambda r: (-(r.get("rating") or 0), -replay_number(r["id"]))):
        teams = r.get("teams") or [[], []]
        used = r.get("teamused") or [[], []]
        names = (r.get("players") or ["", ""]) + ["", ""]
        row = [
            replay_number(r["id"]),
            players(names[0]),
            players(names[1]),
            [species(n) for n in teams[0]],
            [species(n) for n in teams[1]],
            brought_mask(teams[0], used[0]),
            brought_mask(teams[1], used[1]),
            r.get("uploadtime") or 0,
            r.get("rating") or 0,
            r.get("winner_index") or 0,
        ]
        games = r.get("bo3_matches") or []
        if r.get("bo3_id") not in (None, -1, "") and any(games):
            row.append([r.get("score") or "", [replay_number(g) for g in games]])
        rows.append(row)
    return {
        "api_version": API_VERSION,
        "format": fmt,
        "day": day,
        "species": species.items,
        "players": players.items,
        "replays": rows,
    }


def teams_file(fmt, rankings):
    species, players = Table(), Table()
    rows = []
    for t in rankings[:TOP_TEAMS]:
        replays = []
        for r in (t.get("replays") or [])[:REPLAYS_PER_TEAM]:
            ref = [
                replay_number(r.get("id")),
                r.get("rating") or 0,
                players(r.get("player") or ""),
                players(r.get("opponent") or ""),
                1 if r.get("won") else 0,
            ]
            games = r.get("bo3_matches") or []
            if any(games) and sum(1 for g in games if g) > 1:
                ref.append([replay_number(g) for g in games])
            replays.append(ref)
        rows.append([
            [species(n) for n in t.get("team") or []],
            t.get("wins") or 0,
            t.get("losses") or 0,
            t.get("avg_rating") or 0,
            t.get("max_rating") or 0,
            round(t.get("rank_score") or 0, 1),
            replays,
        ])
    return {
        "api_version": API_VERSION,
        "format": fmt,
        "species": species.items,
        "players": players.items,
        "teams": rows,
    }


def build(src, data_dir, out):
    formats = []
    for path in sorted(glob.glob(os.path.join(src, "search-replays-list-*.json*"))):
        fmt = re.sub(r"^search-replays-list-|\.json(\.gz)?$", "", os.path.basename(path))
        replays = read_json(path) or []
        if not replays:
            continue
        name = format_name(replays, fmt)

        by_day = {}
        for r in replays:
            by_day.setdefault(day_of(r.get("uploadtime")), []).append(r)
        days = []
        for day in sorted(by_day, reverse=True):
            rel = "replays/%s/%s.json.gz" % (fmt, day)
            size, revision = write_pack(os.path.join(out, rel), day_file(fmt, day, by_day[day]))
            days.append({"day": day, "replays": len(by_day[day]), "file": rel,
                         "bytes": size, "revision": revision})

        teams = None
        for candidate in (".json", ".json.gz"):
            rpath = os.path.join(src, "team-rankings-%s%s" % (fmt, candidate))
            if os.path.exists(rpath):
                body = teams_file(fmt, read_json(rpath) or [])
                if body["teams"]:
                    rel = "teams/%s.json.gz" % fmt
                    size, revision = write_pack(os.path.join(out, rel), body)
                    teams = {"file": rel, "teams": len(body["teams"]), "bytes": size,
                             "revision": revision}
                break

        formats.append({
            "id": fmt,
            "name": name,
            "short": short_name(fmt, name),
            "champions": "champions" in fmt,
            "doubles": "doubles" in fmt or "vgc" in fmt,
            "bo3": fmt.endswith("bo3"),
            "brings": brings(fmt),
            "replays": len(replays),
            "from": days[-1]["day"],
            "to": days[0]["day"],
            "days": days,
            "teams": teams,
        })
        print("  %-30s %6d replays  %2d days  %5.0f KB  teams %s"
              % (fmt, len(replays), len(days), sum(d["bytes"] for d in days) / 1024,
                 teams["teams"] if teams else "-"), flush=True)

    if not formats:
        print("no replay lists found in %s -- nothing built" % src)
        return 1

    size, revision = write_pack(os.path.join(out, "sprites.json.gz"), sprite_table(data_dir))
    order = list(SHORT_NAMES)
    formats.sort(key=lambda f: (order.index(f["id"]) if f["id"] in order else len(order),
                                -f["replays"]))
    with open(os.path.join(out, "index.json"), "w", encoding="utf8") as fh:
        json.dump({
            "api_version": API_VERSION,
            "kind": "replays",
            "sprites": {"file": "sprites.json.gz", "bytes": size, "revision": revision},
            "formats": formats,
        }, fh, separators=(",", ":"), ensure_ascii=False)
    total = sum(d["bytes"] for f in formats for d in f["days"])
    print("built %d formats, %.1f MB of day files" % (len(formats), total / 1048576))
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--src", required=True, help="the scraper's stats/replays directory")
    parser.add_argument("--data", required=True, help="the site's stats/ (pokedex.json, forms_index.json)")
    parser.add_argument("--out", required=True, help="where to write the app's files")
    args = parser.parse_args()
    return build(args.src, args.data, args.out)


if __name__ == "__main__":
    sys.exit(main())
