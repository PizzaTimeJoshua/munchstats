"""Publish VGCPastes teams for the site and the app to the teams-data branch.

Run every six hours by .github/workflows/update-teams.yml. The only thing that
reads the VGCPastes sheet and pokepast.es for the site is this script; the site
reads what it publishes (vgcpastes in "published" mode) and so does the app.

  1. Seed from the previous snapshot. A paste never changes once made, so a
     run only fetches the pastes of teams added since the last one.
  2. Read each repository's tab of the sheet, exactly as the site parses it.
     A tab that cannot be read keeps its last published copy.
  3. Fetch every paste the snapshot lacks: newest team first, one request a
     second, until FETCH_BUDGET_SECONDS is spent. A first backfill (3,600
     teams) takes two runs; after that it is a few a day.
  4. Write the site's copy -- the parsed tabs and the raw pastes -- and the
     app's packs: one per repository, every team with its sets parsed.

A set in the app's packs is the tournament packs' team-sheet row with the
spread appended:
    [species, item, ability, tera, nature, [moves], evs | null, ivs | null]
evs and ivs are [HP, Atk, Def, SpA, SpD, Spe]; evs is null when the paste
gives none, ivs when every IV is 31. Champions pastes put stat points on the
EVs line (66 in all, 32 at most), so the pack says which in stat_label.
Nicknames, gender, shininess and level are dropped: the app rebuilds a clean
Showdown export from the rest, and links to the paste for the original.

Output (--out), published as one orphan commit so the branch never grows:
    site/<repo>.json.gz            a tab as vgcpastes parses it
    site/pastes/<repo>.json.gz     {paste id: Showdown text} for its teams
    app/index.json                 what the app lists and downloads
    app/<repo>.json.gz

Usage:
    python publish_teams.py --out out [--seed previous-snapshot]
"""

import argparse
import glob
import gzip
import json
import os
import shutil
import sys
import time

os.environ.setdefault("MUNCHSTATS_NO_WARM", "1")
# Read before app imports vgcpastes: the published copy is made from the live
# sheet, not from itself.
os.environ["VGCPASTES_SOURCE"] = "live"

import requests  # noqa: E402

import app as A  # noqa: E402
import tournament_packs as TP  # noqa: E402
import vgcpastes as V  # noqa: E402

PASTE_URL = "https://pokepast.es/%s/raw"
USER_AGENT = "MunchStats (+https://munchstats.com)"

# pokepast.es is one person's site with no stated limit, so this stays well
# clear of mattering to it: one request at a time, a second apart.
REQUEST_SPACING_SECONDS = 1.0
FETCH_BUDGET_SECONDS = 30 * 60
# Timeouts, 5xx and 429s in a row after which the run stops asking and
# publishes what it has. A 404 is not trouble: it is a mistyped link.
MAX_TROUBLE_STREAK = 5


def log(msg):
    print(msg, flush=True)


def read_gz_json(path):
    with gzip.open(path, "rt", encoding="utf8") as fh:
        return json.load(fh)


# --- 1. seed -----------------------------------------------------------------

def read_seed(seed_dir):
    """(pastes, tabs) from a previous snapshot: every paste it holds, and each
    repository's tab as last published."""
    pastes, tabs = {}, {}
    if not seed_dir or not os.path.isdir(seed_dir):
        return pastes, tabs
    for path in sorted(glob.glob(os.path.join(seed_dir, "site", "pastes", "*.json.gz"))):
        try:
            pastes.update(read_gz_json(path))
        except (OSError, ValueError):
            log("  unreadable seed file: %s" % path)
    for repo_id in V.REPOSITORIES:
        path = os.path.join(seed_dir, "site", repo_id + ".json.gz")
        if os.path.exists(path):
            try:
                tabs[repo_id] = read_gz_json(path)
            except (OSError, ValueError):
                log("  unreadable seed file: %s" % path)
    return pastes, tabs


# --- 2. the sheet --------------------------------------------------------------

def read_tabs(previous):
    """{repo_id: teams}, newest first, in REPOSITORIES order."""
    tabs = {}
    for repo_id, repo in V.REPOSITORIES.items():
        teams = V._fetch_repository(repo["sheet"])
        if teams is None:
            teams = previous.get(repo_id)
            log("  %-16s tab unreadable -- %s"
                % (repo_id, "republishing the last copy" if teams else "left out"))
            if not teams:
                continue
        tabs[repo_id] = teams
    return tabs


# --- 3. pastes -----------------------------------------------------------------

def wanted_pastes(tabs, have):
    """Ids of the pastes the tabs link and `have` lacks, newest team first."""
    dated = {}
    for teams in tabs.values():
        for team in teams:
            pid = V.paste_id(team.get("pokepaste"))
            if not pid or pid in have:
                continue
            date = team.get("date") or ""
            if pid not in dated or date > dated[pid]:
                dated[pid] = date
    return sorted(dated, key=lambda pid: (dated[pid], pid), reverse=True)


def _retry_after(resp):
    try:
        return max(1, int(resp.headers.get("Retry-After", "60")))
    except ValueError:
        return 60


def fetch_pastes(wanted, pastes, budget_seconds):
    """Fetch `wanted` into `pastes`, in order, within the budget.

    Returns (fetched, not_found, deferred); deferred ones are the next run's.
    """
    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT
    started = time.time()
    fetched = not_found = trouble = 0
    for i, pid in enumerate(wanted):
        if time.time() - started > budget_seconds:
            return fetched, not_found, len(wanted) - i
        if trouble >= MAX_TROUBLE_STREAK:
            log("  pokepast.es keeps failing -- stopping for this run")
            return fetched, not_found, len(wanted) - i
        # Spaced from one request's start to the next, so a slow answer is not
        # followed by a full extra second of nothing.
        next_at = time.time() + REQUEST_SPACING_SECONDS
        try:
            resp = session.get(PASTE_URL % pid, timeout=20)
        except requests.RequestException:
            resp = None
        if resp is not None and resp.status_code == 200:
            resp.encoding = "utf-8"
            pastes[pid] = resp.text
            fetched += 1
            trouble = 0
        elif resp is not None and resp.status_code == 404:
            not_found += 1
            trouble = 0
        else:
            trouble += 1
            if resp is not None and resp.status_code == 429:
                wait = min(_retry_after(resp), 120)
                log("  asked to slow down; waiting %ds" % wait)
                time.sleep(wait)
        time.sleep(max(0.0, next_at - time.time()))
    return fetched, not_found, 0


# --- 4. write ------------------------------------------------------------------

def parse_sets(text, format_code):
    """A paste's Pokémon as the app's set rows (see the module docstring).

    Built from the calc import's own helpers (app.parse_showdown_paste), so
    a species or item resolves to the same name on the site and in the app;
    a block whose head is not a Pokémon -- a title, a stray note -- is
    dropped, as the import drops it.
    """
    champions = A.is_champions_format(format_code)
    move_source = (A.championsMoveDetails if champions else A.moveDetails) or A.moveDetails or {}
    ability_source = (A.championsAbilityDetails if champions else A.abilityDetails) or {}

    sets = []
    for block in A._paste_split_blocks(text)[:A.PASTE_MAX_SETS]:
        species_raw, _nickname, item_raw = A._paste_parse_head(block[0])
        if not species_raw:
            continue
        species, matched = A._paste_resolve_species(species_raw)
        if not matched:
            continue
        ability = tera = nature = ""
        evs = ivs = None
        moves = []
        for line in block[1:]:
            if line[0] in "-~":
                move = line[1:].strip()
                if move and len(moves) < A.PASTE_MAX_MOVES:
                    info = move_source.get(A._paste_key(move))
                    moves.append(info.get("name", move) if isinstance(info, dict) else move)
                continue
            nature_match = A._PASTE_NATURE_RE.match(line)
            if nature_match:
                nature = nature_match.group(1).capitalize()
                continue
            field, _, value = line.partition(":")
            field = A._paste_key(field)
            value = value.strip()
            if field == "ability":
                ability = A._paste_canonical_name(value, ability_source)
            elif field == "teratype":
                tera = A._PASTE_TERA_TYPES.get(A._paste_key(value), "")
            elif field in ("ev", "evs"):
                evs = A._paste_stat_line(value, 0)
            elif field in ("iv", "ivs"):
                ivs = A._paste_stat_line(value, 31)
            elif field == "nature":
                nature = value.capitalize()
            elif field == "item" and not item_raw:
                item_raw = value
        if evs is not None and not any(evs):
            evs = None
        if ivs is not None and all(v == 31 for v in ivs):
            ivs = None
        sets.append([
            species,
            A._paste_canonical_name(item_raw, A.itemDetails),
            ability,
            tera,
            nature,
            moves,
            evs,
            ivs,
        ])
    return sets


def add_sheet_species(pdict, name):
    """A tab's Pokémon name, which may be a Mega the sprite index lacks
    (Floette-Eternal-Mega): the site's cards fall back to the base form."""
    if not name or name in pdict.species:
        return
    pdict.add_species(name)
    if pdict.species[name]["sprite"] == [0, 0]:
        pdict.species[name]["sprite"] = list(A._vgcpastes_sprite(name))


def team_entry(team, pastes, format_code, pdict):
    pid = V.paste_id(team.get("pokepaste")) or ""
    sets = parse_sets(pastes[pid], format_code) if pid in pastes else []
    roster = []
    for i, name in enumerate(team["pokemon"]):
        item = team["items"][i] if i < len(team["items"]) else ""
        add_sheet_species(pdict, name)
        pdict.add_item(item)
        roster.append([name, item])
    for row in sets:
        pdict.add_species(row[0])
        pdict.add_item(row[1])
    return {
        "id": team["team_id"],
        "title": team["description"],
        "player": team["player"],
        "owner": team["owner"],
        "date": team["date"],
        "event": team["event"],
        "rank": team["rank"],
        "code": team["code"],
        # From the sets when we have them; the sheet's own flag until then.
        "evs": any(row[6] for row in sets) if sets else bool(team["has_evs"]),
        "paste": pid,
        "source": team["source_link"],
        "report": team["report_link"],
        "other": team["other_link"],
        # The tab's names, which are the forms the team battles as
        # (Salamence-Mega); the sets keep the species Showdown imports.
        "roster": roster,
        "sets": sets or None,
    }


def repo_pack(repo_id, teams, pastes):
    repo = V.REPOSITORIES[repo_id]
    fmt = repo["format"]
    pdict = TP.PackDict(A)
    entries = [team_entry(t, pastes, fmt, pdict) for t in teams]
    return {
        "api_version": TP.API_VERSION,
        "kind": "vgcpastes",
        "repo": repo_id,
        "name": repo["display"],
        "reg": repo["limitless_reg"],
        "format": fmt,
        "code_label": repo["code_label"],
        "stat_label": "SP" if A.is_champions_format(fmt) else "EVs",
        "attribution": V.ATTRIBUTION_TEXT,
        "teams": entries,
        "dict": pdict.body(),
    }


def write_snapshot(out, tabs, pastes):
    site = os.path.join(out, "site")
    app_dir = os.path.join(out, "app")
    os.makedirs(os.path.join(site, "pastes"), exist_ok=True)
    os.makedirs(app_dir, exist_ok=True)

    rows = []
    for repo_id, teams in tabs.items():
        # The site's copy. Same data, same bytes (TP.write_pack), so an
        # unchanged tab keeps its ETag across the orphan commits.
        TP.write_pack(os.path.join(site, repo_id + ".json.gz"), teams)
        ids = sorted({V.paste_id(t.get("pokepaste")) for t in teams} - {None})
        TP.write_pack(os.path.join(site, "pastes", repo_id + ".json.gz"),
                      {pid: pastes[pid] for pid in ids if pid in pastes})

        t0 = time.time()
        body = repo_pack(repo_id, teams, pastes)
        filename = repo_id + ".json.gz"
        size, revision = TP.write_pack(os.path.join(app_dir, filename), body)
        with_sets = sum(1 for e in body["teams"] if e["sets"])
        rows.append({
            "id": repo_id,
            "name": body["name"],
            "reg": body["reg"],
            "format": body["format"],
            "teams": len(body["teams"]),
            "with_sets": with_sets,
            "file": filename,
            "bytes": size,
            "revision": revision,
        })
        log("  %-16s %5d teams  %5d with sets  %5.0f KB  %4.1fs"
            % (repo_id, len(body["teams"]), with_sets, size / 1024, time.time() - t0))

    # Content only -- no build time -- so a run that finds nothing new
    # republishes identical bytes and every app gets a 304.
    TP.write_json(os.path.join(app_dir, "index.json"), {
        "api_version": TP.API_VERSION,
        "kind": "teams",
        "attribution": {"text": V.ATTRIBUTION_TEXT, "url": V.ATTRIBUTION_URL},
        "repos": rows,
    })
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", required=True, help="directory to write the snapshot into")
    parser.add_argument("--seed", help="the previous snapshot, to skip pastes already fetched")
    parser.add_argument("--budget-minutes", type=float, default=FETCH_BUDGET_SECONDS / 60,
                        help="time allowed for fetching pastes (default %(default)s)")
    args = parser.parse_args()

    started = time.time()
    pastes, previous = read_seed(args.seed)
    log("seed: %d pastes, %d repositories" % (len(pastes), len(previous)))

    tabs = read_tabs(previous)
    if not tabs:
        log("no repository could be read -- refusing to publish an empty snapshot")
        return 1
    log("sheet: " + ", ".join("%s %d" % (r, len(t)) for r, t in tabs.items()))

    wanted = wanted_pastes(tabs, pastes)
    fetched, not_found, deferred = fetch_pastes(wanted, pastes, args.budget_minutes * 60)
    log("pastes: %d new to fetch -- fetched %d, %d not found, %d left for the next run"
        % (len(wanted), fetched, not_found, deferred))

    if os.path.isdir(args.out):
        shutil.rmtree(args.out)
    rows = write_snapshot(args.out, tabs, pastes)
    log("app packs: %d repositories, %.2f MB, in %.1f min"
        % (len(rows), sum(r["bytes"] for r in rows) / 1048576, (time.time() - started) / 60))
    return 0


if __name__ == "__main__":
    sys.exit(main())
