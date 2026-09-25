"""Precompute the official tournament packs for the mobile app.

One gzipped file per event holding everything the app shows for it: usage for
each cut (all players, Day 2, Top 16, Top 8) with every Pokémon's detail, the
standings with each player's team, and every round's pairings. Built from the
files scrape_tournaments.py commits -- nothing is fetched -- so a pack only
changes when an event is added or re-scraped.

Normally run by .github/workflows/update-tournament-packs.yml, which publishes
the output to the mobile-packs branch whenever stats/tournaments/ changes on
main.

Also one file per regulation of every run's team (tournament_packs.TeamRuns),
which the app's Teams tab groups into archetypes.

Layout:
    stats/tournaments/_packs/<id>.json.gz
    stats/tournaments/_packs/teams/<format>.json.gz
    stats/tournaments/_packs/index.json

Usage:
    python build_tournament_packs.py
"""

import json
import os
import sys
import time

os.environ.setdefault("MUNCHSTATS_NO_WARM", "1")

import app as A  # noqa: E402
import tournament_packs as TP  # noqa: E402

OUT_DIR = os.path.join(A.TOURNAMENT_DATA_DIR, "_packs")
INDEX_NAME = "index.json"


def load_pairings(tournament_id):
    path = os.path.join(A.TOURNAMENT_DATA_DIR, tournament_id, "pairings.json")
    return A.load_data_file(path) if os.path.exists(path) else None


def official_win_rates(players, cut, names):
    """{name: pooled win rate} for one cut, by the site's own calculation."""
    rates = {}
    for name in names:
        rate = A.compute_official_win_rate(players, cut, name)
        if rate is not None:
            rates[name] = rate
    return rates


def build_event(meta):
    """The pack body for one event, or None when it has no usage data."""
    agg = A.load_tournament_aggregated(meta["id"])
    if not agg:
        return None
    players = A.load_tournament_players(meta["id"])
    pdict = TP.PackDict(A)

    cuts = []
    for key, label in TP.OFFICIAL_CUTS:
        filtered = agg.get(key) or {}
        index = filtered.get("pokemon") or {}
        if not index:
            continue
        data = TP.dataset(
            A, index, filtered.get("total_teams", 1), pdict,
            win_rates=official_win_rates(players, key, index.keys()),
        )
        cuts.append(dict(data, key=key, label=label))
    if not cuts:
        return None

    ranked = sorted(players, key=lambda p: p.get("placement") or 9999)
    standings = []
    for player in ranked:
        record = player.get("record") or {}
        standings.append({
            "place": player.get("placement"),
            "name": player.get("name", ""),
            "country": player.get("country", ""),
            "record": [record.get("wins", 0), record.get("losses", 0), record.get("ties", 0)],
            "reached": player.get("day_reached", ""),
            "team": TP.team_sheet(player.get("team"), pdict),
        })

    pairings = load_pairings(meta["id"]) or {}
    rounds = TP.resolve_rounds(
        pairings.get("rounds"),
        TP.unique_index([s["name"] for s in standings]),
    )

    fmt = meta.get("format") or ""
    return {
        "api_version": TP.API_VERSION,
        "kind": "official",
        "id": meta["id"],
        "name": meta.get("name", ""),
        "date": meta.get("date", ""),
        "type": meta.get("type", ""),
        "location": meta.get("location", ""),
        "players": meta.get("total_players") or len(players),
        "format": fmt,
        "format_name": A.formatDisplayNames.get(fmt, fmt),
        "cuts": cuts,
        "standings": standings,
        "rounds": rounds,
        "dict": pdict.body(),
    }


def build_team_files(events):
    """One file per regulation of every official run's team, for the app's
    Teams tab (see TP.TeamRuns). Returns the index rows."""
    by_format = {}
    for meta in events:
        fmt = meta.get("format") or ""
        if not TP.reg_token(fmt):
            continue
        players = A.load_tournament_players(meta["id"])
        if not any(p.get("team") for p in players):
            continue
        runs = by_format.get(fmt)
        if runs is None:
            runs = by_format[fmt] = TP.TeamRuns(TP.PackDict(A))
        event = runs.add_event(meta["id"], meta.get("name", ""), meta.get("date", ""),
                               meta.get("total_players") or len(players))
        for p in sorted(players, key=lambda p: p.get("placement") or 9999):
            record = p.get("record") or {}
            runs.add_run(event, p.get("placement"), p.get("name", ""),
                         [record.get("wins", 0), record.get("losses", 0), record.get("ties", 0)],
                         p.get("team"), p.get("day_reached", ""))

    os.makedirs(os.path.join(OUT_DIR, "teams"), exist_ok=True)
    rows = []
    for fmt in sorted(by_format):
        runs = by_format[fmt]
        if not runs.runs:
            continue
        name = A.formatDisplayNames.get(fmt, fmt)
        body = runs.body(kind="official_teams", format=fmt, format_name=name,
                         reg=TP.reg_token(fmt))
        filename = "teams/%s.json.gz" % fmt
        size, revision = TP.write_pack(os.path.join(OUT_DIR, filename), body)
        rows.append({
            "format": fmt,
            "format_name": name,
            "reg": TP.reg_token(fmt),
            "events": len(runs.events),
            "runs": len(runs.runs),
            "file": filename,
            "bytes": size,
            "revision": revision,
        })
        print("  teams %-30s %2d events %5d runs %5d sets  %5.0f KB"
              % (fmt, len(runs.events), len(runs.runs), len(runs.sets), size / 1024))
    return rows


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for folder in (OUT_DIR, os.path.join(OUT_DIR, "teams")):
        if not os.path.isdir(folder):
            continue
        for stale in os.listdir(folder):
            if stale.endswith(".tmp"):
                try:
                    os.remove(os.path.join(folder, stale))
                except OSError:
                    pass

    events = A.load_tournament_list()  # VGC events with teams, newest first
    print("building %d official tournament packs -> %s\n" % (len(events), OUT_DIR))
    started = time.time()
    rows = []
    for meta in events:
        t0 = time.time()
        body = build_event(meta)
        if body is None:
            print("  %-22s no usage data, skipped" % meta["id"])
            continue
        filename = "%s.json.gz" % meta["id"]
        size, revision = TP.write_pack(os.path.join(OUT_DIR, filename), body)
        rows.append({
            "id": meta["id"],
            "name": body["name"],
            "date": body["date"],
            "type": body["type"],
            "players": body["players"],
            "teams": body["cuts"][0]["teams"],
            "format": body["format"],
            "format_name": body["format_name"],
            "has_rounds": bool(body["rounds"]),
            "file": filename,
            "bytes": size,
            "revision": revision,
        })
        print("  %-22s %4d players  %3d rounds  %5.0f KB  %4.1fs  %s"
              % (meta["id"], body["players"], len(body["rounds"]), size / 1024,
                 time.time() - t0, body["name"][:40]))

    if not rows:
        print("\nno packs built")
        return 1

    print()
    team_rows = build_team_files(events)

    # No build timestamp: the index changes only when an event does, so an
    # unchanged rebuild is a 304 for every installed app.
    TP.write_json(os.path.join(OUT_DIR, INDEX_NAME), {
        "api_version": TP.API_VERSION,
        "kind": "official",
        "events": rows,
        "teams": team_rows,
    })
    print("\nbuilt %d packs in %.1f min, %.2f MB total"
          % (len(rows), (time.time() - started) / 60,
             sum(r["bytes"] for r in rows) / 1048576))
    return 0


if __name__ == "__main__":
    sys.exit(main())
