"""Build the app's offline battles: each replay's battle, coded small.

Run by .github/workflows/update-replay-stats.yml after build_replay_packs.py,
and before the replay data is published:

    python site/build_battle_packs.py --out site-data/app --logs scraper/replays \
        --prev prev/app

--out holds what build_replay_packs.py just wrote: index.json and a file of
replays per format per day. Beside each of those day files this writes the
same day's battles, one per replay in the same order, coded by battle_codec
against a model trained on that format's recent games:

    battles/<format>/model-<id>.bin.gz    its model, trained once a month
    battles/<format>/<day>.bin            that day's battles

and adds them to index.json: the format's models under "battles", and each
day's battle file on the day's row. A day's battle file records the revision
of the day file it follows, row for row, so the app never pairs mismatched
files.

--prev is the app's files as last published. A format has one model: a new
one is trained each month (sooner for a young format, as its games double),
and every day coded with the one before is coded again with it, so the phone
keeps one model a format, not one for each month its days span. A day's
battles are copied when its replays have not changed and its model is the
current one, and otherwise only its new replays are coded. Each run codes the
new replays first, then the days still on an older model, in --budget
minutes: a day moves to the new model only once all of it is coded again,
keeping its battles and their model until then. Replays not yet coded are
empty rows, and the app fetches those from Showdown until a later run fills
them in.

--logs is the scraper's cache: <format>/<replay id>.json, Showdown's replay
JSON with the battle in "log".

Standalone, like build_replay_packs.py: the standard library and the codec.
"""

import argparse
import gzip
import hashlib
import json
import multiprocessing
import os
import sys
import time
from datetime import datetime, timezone

import battle_codec as B

TRAIN_GAMES = 3000        # a model's training games: the format's latest
MIN_TRAIN = 300           # fewer than this and a format waits for more
REFIT_PASSES = 1          # passes refitting the weights (battle_codec.refit)
PRUNE = True              # keep only the cells worth their bytes (battle_codec.prune)
JUDGE_GAMES = 3000        # the games before the training ones, to judge cells on
MIN_JUDGE = 1000          # fewer, and the cells are judged on the training games
# A model trained on few games (a format days old) is retrained when there
# are twice as many -- until it has UPGRADE_UNTIL.
UPGRADE_UNTIL = 2000


def min_seen(replays):
    """How often a cell must have been seen to be shipped, by how many
    replays the format has in the index's month: a quiet format's model
    must be small, or it would outweigh its own battles."""
    if replays >= 10000:
        return 8
    if replays >= 3000:
        return 16
    return 32


def read_json(path):
    opener = gzip.open if path.endswith(".gz") else open
    with opener(path, "rt", encoding="utf8") as fh:
        return json.load(fh)


def write_file(path, blob):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as fh:
        fh.write(blob)
    return len(blob), hashlib.sha256(blob).hexdigest()[:16]


def replay_log(logs, fmt, number):
    """A replay's log from the scraper's cache, or None."""
    path = os.path.join(logs, fmt, "%s-%d.json" % (fmt, number))
    try:
        with open(path, "rb") as fh:
            raw = fh.read()
    except OSError:
        return None
    try:
        data = json.loads(raw)
    except ValueError:
        try:
            import pyjson5  # the scraper's own reader, if it is installed
            data = pyjson5.loads(raw.decode("utf8"))
        except Exception:
            return None
    log = data.get("log") if isinstance(data, dict) else None
    return log or None


def day_rows(out, day):
    """A day file's replays as (replay number, teams), in its order."""
    body = read_json(os.path.join(out, day["file"]))
    species = body.get("species") or []
    rows = []
    for r in body.get("replays") or []:
        teams = [[species[i] for i in r[3]], [species[i] for i in r[4]]]
        rows.append((r[0], teams, r[7]))
    return rows


def previous_codes(prev, before, path):
    """A day's battles as last published, by replay number: its rows are the
    day file it was built beside, which was published with it."""
    try:
        _, matches, codes = B.read_day_file(open(path, "rb").read())
        if not before.get("file") or matches != before.get("revision"):
            return {}
        rows = day_rows(prev, before)
    except (OSError, ValueError, IndexError):
        return {}
    return {r[0]: c for r, c in zip(rows, codes) if c}


# ─── models ────────────────────────────────────────────────────────────────

def train_model(task):
    """(format, [(text, teams)] to train on, [(text, teams)] to judge its
    cells on, replays in the index, model id) -> model file bytes, or None
    if training failed."""
    fmt, games, judge, replays, model_id = task
    try:
        codec = B.train(games)
        _, parts = B.ship(codec, min_seen(replays))
        # The weights fitted again to the table as shipped (battle_codec.refit),
        # then only the cells worth their bytes over a month of the format's
        # battles kept, judged on games the model did not train on where there
        # are enough (battle_codec.prune), and the weights fitted again: a
        # smaller model, quicker to load, and fewer bytes a battle with the
        # model's share counted (battles a little bigger in small formats).
        _, parts = B.refit(codec, parts, games, REFIT_PASSES)
        meta = {"format": fmt, "id": model_id, "games": len(games), "min_seen": min_seen(replays),
                "refit": REFIT_PASSES}
        if PRUNE:
            judged = judge if len(judge) >= MIN_JUDGE else games
            parts = B.prune(codec, parts, judged, replays)
            _, parts = B.refit(codec, parts, games, REFIT_PASSES)
            meta.update(pruned=B.PRUNE_STRICT, judged=len(judged) if judged is judge else 0)
        return fmt, model_id, len(games), B.model_file(parts, meta)
    except Exception as e:  # one format's trouble is not every format's
        print("  %-30s training failed: %r" % (fmt, e), flush=True)
        return fmt, model_id, len(games), None


def training_games(out, logs, fmt, days, limit):
    """The format's latest replays with logs, oldest first."""
    found = []
    for day in days:   # newest first
        rows = sorted(day_rows(out, day), key=lambda r: -r[2])
        for number, teams, _ in rows:
            log = replay_log(logs, fmt, number)
            if log:
                found.append((B.canonical(log), teams))
                if len(found) >= limit:
                    return found[::-1]
    return found[::-1]


# ─── coding battles, in parallel ─────────────────────────────────────────

_models = {}


def _load(path):
    codec = _models.get(path)
    if codec is None:
        with open(path, "rb") as fh:
            _, codec = B.read_model_file(fh.read())
        _models[path] = codec
    return codec


def code_battle(task):
    """(key, model path, logs, format, number, teams) -> (key, bytes). Empty
    bytes when the log is missing, or when (it never should) the coded
    battle does not decode to itself."""
    key, model_path, logs, fmt, number, teams = task
    log = replay_log(logs, fmt, number)
    if not log:
        return key, b""
    codec = _load(model_path)
    text = B.canonical(log)
    try:
        data = B.encode_game(codec, text, teams)
        if B.decode_game(codec, data, teams) != text:
            return key, b""
    except Exception:
        return key, b""
    return key, data


# ─── the build ─────────────────────────────────────────────────────────────

def build(out, logs, prev, budget, workers, retrain=False):
    started = time.time()
    index_path = os.path.join(out, "index.json")
    index = read_json(index_path)
    prev_index = None
    if prev and os.path.exists(os.path.join(prev, "index.json")):
        try:
            prev_index = read_json(os.path.join(prev, "index.json"))
        except ValueError:
            prev_index = None
    prev_formats = {f["id"]: f for f in (prev_index or {}).get("formats") or []}
    today = datetime.now(timezone.utc)
    month = today.strftime("%Y-%m")

    # 1. Models: this month's for each format, trained where missing.
    plans = {}
    to_train = []
    for f in index["formats"]:
        fmt = f["id"]
        old = prev_formats.get(fmt) or {}
        models = {}
        if (old.get("battles") or {}).get("version") != B.VERSION:
            old = {}   # another codec's files: none of it can be reused
        for m in ((old.get("battles") or {}).get("models") or []):
            path = os.path.join(prev, m["file"]) if prev else None
            if path and os.path.exists(path):
                models[m["id"]] = dict(m, path=path)
        current = max(models.values(), key=lambda m: m["id"]) if models else None
        stale = current is None or current["id"][:7] != month
        grown = (current is not None and current.get("games", 0) < UPGRADE_UNTIL
                 and f["replays"] >= 2 * current.get("games", 0))
        plans[fmt] = {"models": models, "current": current}
        if stale or grown or retrain:
            found = training_games(out, logs, fmt, f["days"], TRAIN_GAMES + JUDGE_GAMES)
            games, judge = found[-TRAIN_GAMES:], found[:-TRAIN_GAMES]
            if len(games) >= MIN_TRAIN and (stale or retrain or len(games) >= 2 * current.get("games", 0)):
                # Down to the minute: a young format can be retrained the same
                # day, and its earlier days are then coded again with it.
                to_train.append((fmt, games, judge, f["replays"], today.strftime("%Y-%m-%d-%H%M")))
    if to_train:
        print("training %d models: %s" % (len(to_train), ", ".join("%s (%d games)" % (t[0], len(t[1]))
                                                                     for t in to_train)), flush=True)
        with multiprocessing.Pool(min(workers, len(to_train))) as pool:
            for fmt, model_id, games, blob in pool.imap_unordered(train_model, to_train):
                if blob is None:
                    continue
                rel = "battles/%s/model-%s.bin.gz" % (fmt, model_id)
                size, revision = write_file(os.path.join(out, rel), blob)
                entry = {"id": model_id, "file": rel, "bytes": size, "revision": revision, "games": games,
                         "path": os.path.join(out, rel)}
                plans[fmt]["models"][model_id] = entry
                plans[fmt]["current"] = entry
                print("  %-30s model %s: %d games, %.0f KB" % (fmt, model_id, games, size / 1024), flush=True)
        del to_train

    # 2. Days: copied when unchanged, else coded -- the new replays first, then
    # the days still on an older model, coded again with the current one.
    deadline = started + budget * 60
    work = {}
    fresh = []
    again = []
    for f in index["formats"]:
        try:
            work[f["id"]], tasks, recodes = plan_days(f, plans[f["id"]], prev_formats, out, logs, prev)
        except Exception as e:
            print("  %-30s battles failed: %r" % (f["id"], e), flush=True)
            drop_battles(f)
            continue
        fresh += tasks
        again.append(recodes)
    # The smallest formats' first: a format is down to one model only once
    # every one of its days is.
    again.sort(key=len)
    done = code_all(fresh + [t for recodes in again for t in recodes], workers, deadline)
    for f in index["formats"]:
        if f["id"] not in work:
            continue
        try:
            finish_days(f, plans[f["id"]], work[f["id"]], done, out)
        except Exception as e:
            print("  %-30s battles failed: %r" % (f["id"], e), flush=True)
            drop_battles(f)

    with open(index_path, "w", encoding="utf8") as fh:
        json.dump(index, fh, separators=(",", ":"), ensure_ascii=False)
    print("battles built in %.0f min" % ((time.time() - started) / 60))
    return 0


def drop_battles(f):
    for day in f["days"]:
        day.pop("battles", None)
    f.pop("battles", None)


def code_all(tasks, workers, deadline):
    """Each task's coded battle by its key, in order, as many as there is time for."""
    done = {}
    if not tasks or time.time() >= deadline:
        return done
    with multiprocessing.Pool(workers) as pool:
        for key, data in pool.imap_unordered(code_battle, tasks, chunksize=16):
            done[key] = data
            if time.time() > deadline:
                pool.terminate()
                break
    return done


def plan_days(f, plan, prev_formats, out, logs, prev):
    """A format's days as work: each day's battles as they stand -- copied,
    topped up, or coded -- and, for a day coded with an older model, the whole
    day again with the current one. Returns (work, tasks, re-code tasks)."""
    fmt = f["id"]
    current = plan["current"]
    work = {"days": [], "tasks": 0}
    if current is None:
        return work, [], []
    old = prev_formats.get(fmt) or {}
    if (old.get("battles") or {}).get("version") != B.VERSION:
        old = {}
    old_days = {d["day"]: d for d in old.get("days") or []}
    tasks = []
    recodes = []
    for day in f["days"]:
        before = old_days.get(day["day"]) or {}
        had = before.get("battles")
        model = plan["models"].get(had["model"]) if had else None
        path = os.path.join(prev, had["file"]) if had and prev else None
        entry = {"day": day, "model": model, "copy": None, "codes": None, "again": None}
        rows = None
        if model is not None and path and os.path.exists(path):
            if had.get("matches") == day["revision"] and had.get("games") == day["replays"]:
                # The same replays, every one coded: as it was.
                entry["copy"] = (path, had)
            else:
                reuse = previous_codes(prev, before, path)
                rows = day_rows(out, day)
                entry["codes"] = [reuse.get(number, b"") for number, _, _ in rows]
        else:
            entry["model"] = current
            rows = day_rows(out, day)
            entry["codes"] = [b""] * len(rows)
        if entry["codes"] is not None:
            for i, (number, teams, _) in enumerate(rows):
                if not entry["codes"][i]:
                    tasks.append(((fmt, day["day"], i), entry["model"]["path"], logs, fmt, number, teams))
        if entry["model"]["id"] != current["id"]:
            if rows is None:
                rows = day_rows(out, day)
            entry["again"] = len(rows)
            for i, (number, teams, _) in enumerate(rows):
                recodes.append(((fmt, day["day"], "again", i), current["path"], logs, fmt, number, teams))
        work["days"].append(entry)
    work["tasks"] = len(tasks)
    return work, tasks, recodes


def finish_days(f, plan, work, done, out):
    """A format's days written as the run left them, and its models: those
    the days use, and no others. A day coded again moves to the current
    model only when every replay is back, and no fewer coded than before
    (a log gone from the cache since); until then it keeps what it had."""
    fmt = f["id"]
    current = plan["current"]
    if current is None:
        return
    coded = 0
    moved = 0
    short = 0
    for entry in work["days"]:
        day = entry["day"]
        model, codes = entry["model"], entry["codes"]
        if codes is not None:
            for i in range(len(codes)):
                data = done.get((fmt, day["day"], i))
                if data is not None:
                    codes[i] = data
                    coded += 1
        if entry["again"] is not None:
            fresh = [done.get((fmt, day["day"], "again", i)) for i in range(entry["again"])]
            if all(c is not None for c in fresh):
                have = entry["copy"][1]["games"] if entry["copy"] else sum(1 for c in codes if c)
                if sum(1 for c in fresh if c) >= have:
                    model, codes, entry["copy"] = current, fresh, None
                    moved += 1
                else:
                    short += 1
        if entry["copy"]:
            path, had = entry["copy"]
            size, revision = write_file(os.path.join(out, had["file"]), open(path, "rb").read())
            day["battles"] = dict(had, bytes=size, revision=revision)
            continue
        rel = "battles/%s/%s.bin" % (fmt, day["day"])
        size, revision = write_file(os.path.join(out, rel), B.day_file(model["id"], day["revision"], codes))
        day["battles"] = {"file": rel, "bytes": size, "revision": revision, "model": model["id"],
                          "matches": day["revision"], "games": sum(1 for c in codes if c)}
    if work["tasks"]:
        print("  %-30s coded %d of %d battles%s" % (fmt, coded, work["tasks"],
                                                     "" if coded == work["tasks"] else " (out of time)"), flush=True)
    again = sum(1 for e in work["days"] if e["again"] is not None)
    if again:
        print("  %-30s %d of %d days coded again with model %s%s%s"
              % (fmt, moved, again, current["id"],
                 " (%d kept: fewer of their logs left)" % short if short else "",
                 " (the rest next run)" if moved + short < again else ""), flush=True)

    # The models the days use, and the current one even before any day does:
    # left out, a model trained this run with no day yet coded again with it
    # (out of time) would be lost, and the next run would carry on with the
    # one before. The app downloads only the models days use.
    used = {d["battles"]["model"] for d in f["days"] if d.get("battles")}
    used.add(current["id"])
    models = []
    for model_id in sorted(used):
        m = plan["models"][model_id]
        rel = m["file"]
        target = os.path.join(out, rel)
        if not os.path.exists(target):
            write_file(target, open(m["path"], "rb").read())
        models.append({k: m[k] for k in ("id", "file", "bytes", "revision", "games")})
    f["battles"] = {"version": B.VERSION, "models": models}
    coded = sum(d["battles"]["games"] for d in f["days"] if d.get("battles"))
    size = sum(d["battles"]["bytes"] for d in f["days"] if d.get("battles"))
    print("  %-30s %6d of %6d battles  %6.0f KB of days  %5.0f KB of models"
          % (fmt, coded, f["replays"], size / 1024, sum(m["bytes"] for m in models) / 1024), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--out", required=True, help="the app's files, as build_replay_packs.py wrote them")
    parser.add_argument("--logs", required=True, help="the scraper's replay cache: <format>/<id>.json")
    parser.add_argument("--prev", default="", help="the app's files as last published, if any")
    parser.add_argument("--budget", type=float, default=90, help="minutes to spend coding battles")
    parser.add_argument("--workers", type=int, default=os.cpu_count() or 2)
    parser.add_argument("--retrain", action="store_true",
                        help="train every format a new model now, not only when the month turns (days follow)")
    args = parser.parse_args()
    return build(args.out, args.logs, args.prev, args.budget, args.workers, args.retrain)


if __name__ == "__main__":
    sys.exit(main())
