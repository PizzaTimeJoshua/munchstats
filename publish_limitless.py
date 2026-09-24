"""Publish Limitless data for the site and the app to the limitless-data branch.

Run every two hours by .github/workflows/update-limitless.yml. The only thing
that talks to the Limitless API is this script, once per run; the site reads
what it publishes (limitless_stats in "published" mode) and so does the app.

  1. Seed the local cache from the previous snapshot. Standings and pairings of
     a finished event never change, so a run only fetches events it has not
     seen -- a handful every two hours.
  2. Fetch the regulations, the recent event list, and standings and pairings
     for every finished event of 25+ players from the last RETENTION_DAYS.
  3. Write the site's copy of those, and the app's packs: one per regulation
     (its 30-day stats at every size tier and cut) and one per event in that
     window (usage by cut, standings with teams, every round).

Output (--out), published as one orphan commit so the branch never grows:
    limitless/formats.json               the site's inputs, same shapes as
    limitless/tournaments.json           limitless_stats' own cache
    limitless/standings/<id>.json.gz
    limitless/pairings/<id>.json.gz
    app/index.json                       what the app lists and downloads
    app/formats/<format>.json.gz
    app/events/<id>.json.gz

Usage:
    python publish_limitless.py --out out [--seed previous-snapshot]
"""

import argparse
import glob
import gzip
import json
import os
import shutil
import sys
import time
from datetime import datetime, timedelta, timezone

os.environ.setdefault("MUNCHSTATS_NO_WARM", "1")
# Read before app imports limitless_stats: this is the one place allowed to
# call the Limitless API.
os.environ["LIMITLESS_SOURCE"] = "api"

import app as A  # noqa: E402
import limitless_stats as L  # noqa: E402
import tournament_packs as TP  # noqa: E402

# How far back the site can still open an event page. The stats window is
# L.WINDOW_DAYS (30); this is longer so links to recent-but-older events keep
# working, and each event is fetched once however long it is kept.
RETENTION_DAYS = 90
LIST_PAGE_LIMIT = 10

# Pause between API requests. The first run fetches standings and pairings
# for three months of events; at the site's 0.3 s, and two requests an event,
# a local trial had 8 of 174 refused part way (each returned fine a minute
# later). A second per request keeps a full backfill well inside the job's
# hour, and later runs fetch only a handful of new events. Anything refused
# is simply retried on the next run.
REQUEST_SPACING_SECONDS = 1.0


def log(msg):
    print(msg, flush=True)


# --- 1. seed -----------------------------------------------------------------

def seed_cache(seed_dir):
    """Unpack a previous snapshot's standings and pairings into the cache."""
    seeded = 0
    for kind, cache_dir in (("standings", L.STANDINGS_DIR), ("pairings", L.PAIRINGS_DIR)):
        for path in glob.glob(os.path.join(seed_dir, "limitless", kind, "*.json.gz")):
            name = os.path.basename(path)[: -len(".gz")]
            target = os.path.join(cache_dir, name)
            if os.path.exists(target):
                continue
            with gzip.open(path, "rb") as src, open(target, "wb") as dst:
                shutil.copyfileobj(src, dst)
            seeded += 1
    return seeded


# --- 2. fetch ----------------------------------------------------------------

def fetch_event_list(now):
    """Every VGC event since the retention cutoff, newest first.

    Pages further than limitless_stats does for the site (which only needs
    the 30-day window), and stores the result where limitless_stats reads its
    list, so every helper below sees the same events.
    """
    cutoff = now - timedelta(days=RETENTION_DAYS)
    events = []
    for page in range(1, LIST_PAGE_LIMIT + 1):
        data = L._api_get(
            "/tournaments",
            params={"game": "VGC", "limit": L.LIST_FETCH_LIMIT, "page": page},
        )
        time.sleep(REQUEST_SPACING_SECONDS)
        if not isinstance(data, list) or not data:
            break
        events.extend(data)
        oldest = L._parse_date(data[-1].get("date"))
        if len(data) < L.LIST_FETCH_LIMIT or (oldest and oldest < cutoff):
            break
    if not events:
        raise SystemExit("Limitless returned no events -- not publishing an empty list")
    L._cache_write(L._cache_path("tournaments_all"), events)
    return events


def publishable(events, now):
    """Finished events of MIN_PLAYERS+ within the retention window."""
    cutoff = now - timedelta(days=RETENTION_DAYS)
    finished = now - timedelta(hours=L.COMPLETION_GRACE_HOURS)
    kept = []
    for t in events:
        if (t.get("players") or 0) < L.MIN_PLAYERS:
            continue
        date = L._parse_date(t.get("date"))
        if date is None or date < cutoff or date > finished:
            continue
        kept.append(t)
    return kept


def fetch_missing(events):
    """Standings and pairings for each event not already cached."""
    fetched = failed = 0
    for t in events:
        tid = t["id"]
        need_standings = not os.path.exists(L._standings_path(tid))
        need_pairings = not os.path.exists(L._cache_path("pairings", tid))
        if not (need_standings or need_pairings):
            continue
        if need_standings:
            ok = L.get_standings(tid, meta=L._event_meta(t)) is not None
            time.sleep(REQUEST_SPACING_SECONDS)
            if not ok:
                failed += 1
                log("  refused: %s %s" % (tid, (t.get("name") or "")[:50]))
                continue
        if need_pairings:
            L.get_pairings(tid)
            time.sleep(REQUEST_SPACING_SECONDS)
        fetched += 1
    return fetched, failed


# --- 3. write ----------------------------------------------------------------

def write_gz_json(path, body):
    """Same bytes for the same data (see TP.write_pack), so unchanged events
    keep their ETag across the orphan commits this branch is published as."""
    return TP.write_pack(path, body)


def write_site_copy(out, events):
    """The inputs limitless_stats reads in "published" mode."""
    root = os.path.join(out, "limitless")
    for sub in ("standings", "pairings"):
        os.makedirs(os.path.join(root, sub), exist_ok=True)

    formats = L._cache_read(L._cache_path("formats"), allow_stale=True) or {}
    TP.write_json(os.path.join(root, "formats.json"), formats)

    listed = []
    for t in events:
        tid = t["id"]
        standings = L._cache_read(L._standings_path(tid))
        if not standings:
            continue  # fetch failed; listing it would send the site asking
        listed.append(t)
        write_gz_json(os.path.join(root, "standings", L._safe_id(tid) + ".json.gz"), standings)
        pairings = L._cache_read(L._cache_path("pairings", tid))
        if pairings:
            write_gz_json(os.path.join(root, "pairings", L._safe_id(tid) + ".json.gz"), pairings)
    TP.write_json(os.path.join(root, "tournaments.json"), listed)
    return listed


def _result(match):
    """A Limitless match's result in pairings.json terms (scrape_tournaments)."""
    winner, p1, p2 = match.get("winner"), match.get("player1"), match.get("player2")
    if winner is not None and winner == p1:
        return 1
    if p2 and winner == p2:
        return 2
    if winner == 0:
        return 0
    if winner == -1:
        return -2 if p2 else -1
    return None


def event_rounds(pairings, usernames):
    """Rounds as the official packs carry them, players by standings index."""
    by_round = {}
    for m in pairings or []:
        rnd = m.get("round")
        if rnd is None:
            continue
        entry = by_round.setdefault(rnd, {
            "round": rnd,
            "stage": "top" if m.get("phase") == 2 else "swiss",
            "matches": [],
        })
        entry["matches"].append([m.get("player1"), m.get("player2") or None, _result(m)])
    return TP.resolve_rounds(
        [by_round[r] for r in sorted(by_round)],
        TP.unique_index(usernames),
    )


def event_pack(t, formats):
    """One event's pack, or None when nobody published a team."""
    tid = t["id"]
    bundle = L.get_event_bundle(tid, A.pokedexEntries)
    if not bundle:
        return None
    raw = L.get_standings(tid, fetch=False) or []
    teams = bundle["aggregate"].get("total_teams", 0)
    pdict = TP.PackDict(A)

    cuts = [dict(TP.dataset(A, bundle["aggregate"]["pokemon"], teams, pdict),
                 key="all", label="All")]
    for key, label in TP.LIMITLESS_CUTS[1:]:
        if int(key) >= teams:
            continue  # a Top 32 of a 30-team event is the whole event again
        agg = L.get_event_cut_aggregate(tid, A.pokedexEntries, int(key))
        if agg and agg.get("pokemon"):
            cuts.append(dict(TP.dataset(A, agg["pokemon"], agg["total_teams"], pdict),
                             key=key, label=label))

    ranked = sorted(raw, key=lambda p: p.get("placing") or 9999)
    standings = []
    for p in ranked:
        record = p.get("record") or {}
        slots = [L._normalize_slot(s, A.pokedexEntries) for s in p.get("decklist") or []]
        standings.append({
            "place": p.get("placing"),
            "name": p.get("name") or p.get("player") or "",
            "country": p.get("country") or "",
            "record": [record.get("wins", 0), record.get("losses", 0), record.get("ties", 0)],
            "reached": "",
            "dropped": p.get("drop"),
            "team": TP.team_sheet(slots, pdict),
        })

    meta = bundle["meta"]
    fmt = meta.get("format") or bundle.get("format_id") or ""
    return {
        "api_version": TP.API_VERSION,
        "kind": "limitless",
        "id": tid,
        "name": meta.get("name", ""),
        "date": (meta.get("date") or "")[:10],
        "players": meta.get("players") or len(raw),
        "format": fmt,
        "format_name": formats.get(fmt, fmt),
        "cuts": cuts,
        "standings": standings,
        "rounds": event_rounds(L.get_pairings(tid, fetch=False),
                               [p.get("player") or "" for p in ranked]),
        "attribution": L.ATTRIBUTION_TEXT,
        "dict": pdict.body(),
    }


def format_pack(fmt, name):
    """A regulation's 30-day stats: every size tier, each at every cut."""
    bundle = L.build_limitless_aggregate(fmt, A.pokedexEntries)
    if not bundle or not bundle.get("segments"):
        return None
    pdict = TP.PackDict(A)
    tiers = []
    for tier in sorted(bundle["segments"], key=int):
        events = [t for t in bundle["tournaments"] if (t.get("players") or 0) >= int(tier)]
        base = bundle["segments"][tier]
        cuts = [dict(TP.dataset(A, base["pokemon"], base["total_teams"], pdict),
                     key="all", label="All")]
        for key, label in TP.LIMITLESS_CUTS[1:]:
            agg = L.build_limitless_cut_aggregate(fmt, A.pokedexEntries, int(tier), int(key))
            if agg and agg.get("pokemon"):
                cuts.append(dict(TP.dataset(A, agg["pokemon"], agg["total_teams"], pdict),
                                 key=key, label=label))
        tiers.append({"min_players": int(tier), "events": len(events), "cuts": cuts})
    return {
        "api_version": TP.API_VERSION,
        "kind": "limitless_format",
        "format": fmt,
        "format_name": name,
        "window_days": L.WINDOW_DAYS,
        "events": [t["id"] for t in bundle["tournaments"]],
        "tiers": tiers,
        "attribution": L.ATTRIBUTION_TEXT,
        "dict": pdict.body(),
    }


def write_app_packs(out):
    root = os.path.join(out, "app")
    for sub in ("formats", "events"):
        os.makedirs(os.path.join(root, sub), exist_ok=True)

    formats = L.get_available_formats()
    format_rows, event_rows, seen = [], [], set()
    for fmt, name in formats.items():
        t0 = time.time()
        body = format_pack(fmt, name)
        if body is None:
            continue
        filename = "%s.json.gz" % L._safe_id(fmt)
        size, revision = TP.write_pack(os.path.join(root, "formats", filename), body)
        tier0 = body["tiers"][0]
        format_rows.append({
            "id": fmt,
            "name": name,
            "events": tier0["events"],
            "teams": tier0["cuts"][0]["teams"],
            "tiers": [t["min_players"] for t in body["tiers"]],
            "file": "formats/" + filename,
            "bytes": size,
            "revision": revision,
        })
        log("  format %-6s %3d events %6d teams  %5.0f KB  %4.1fs"
            % (fmt, tier0["events"], tier0["cuts"][0]["teams"], size / 1024, time.time() - t0))

        for t in L.eligible_tournaments(L.get_tournament_list(fmt)):
            if t["id"] in seen:
                continue
            seen.add(t["id"])
            ev = event_pack(t, formats)
            if ev is None:
                continue
            filename = "%s.json.gz" % L._safe_id(t["id"])
            size, revision = TP.write_pack(os.path.join(root, "events", filename), ev)
            event_rows.append({
                "id": ev["id"],
                "name": ev["name"],
                "date": ev["date"],
                "players": ev["players"],
                "teams": ev["cuts"][0]["teams"],
                "format": ev["format"],
                "format_name": ev["format_name"],
                "has_rounds": bool(ev["rounds"]),
                "file": "events/" + filename,
                "bytes": size,
                "revision": revision,
            })

    event_rows.sort(key=lambda e: (e["date"], e["players"]), reverse=True)
    # Content only -- no build time -- so a run that finds nothing new
    # republishes identical bytes and every app gets a 304.
    TP.write_json(os.path.join(root, "index.json"), {
        "api_version": TP.API_VERSION,
        "kind": "limitless",
        "window_days": L.WINDOW_DAYS,
        "latest": event_rows[0]["date"] if event_rows else "",
        "attribution": L.ATTRIBUTION_TEXT,
        "formats": format_rows,
        "events": event_rows,
    })
    return format_rows, event_rows


def main():
    global RETENTION_DAYS
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", required=True, help="directory to write the snapshot into")
    parser.add_argument("--seed", help="the previous snapshot, to skip events already fetched")
    parser.add_argument("--retention-days", type=int, default=RETENTION_DAYS,
                        help="how far back to publish events (default %(default)s)")
    args = parser.parse_args()
    RETENTION_DAYS = max(args.retention_days, L.WINDOW_DAYS)

    started = time.time()
    now = datetime.now(timezone.utc)
    if args.seed and os.path.isdir(args.seed):
        log("seeded %d cached files from %s" % (seed_cache(args.seed), args.seed))

    L.get_vgc_formats()
    events = publishable(fetch_event_list(now), now)
    fetched, failed = fetch_missing(events)
    log("%d publishable events: fetched %d new, %d failed" % (len(events), fetched, failed))

    if os.path.isdir(args.out):
        shutil.rmtree(args.out)
    listed = write_site_copy(args.out, events)
    log("site copy: %d events" % len(listed))

    format_rows, event_rows = write_app_packs(args.out)
    total = sum(r["bytes"] for r in format_rows + event_rows)
    log("app packs: %d formats, %d events, %.2f MB, in %.1f min"
        % (len(format_rows), len(event_rows), total / 1048576, (time.time() - started) / 60))
    if not format_rows:
        log("no format produced a pack -- refusing to publish an empty snapshot")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
