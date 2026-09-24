"""Precompute per-Pokemon detail packs for the mobile app.

One gzipped file per format/rating holding every species' payload, so the app
can take a whole format offline in a single download and the server spends no
CPU doing it. Run after update_all_data.py; the packs are a pure function of
the split stats, so they are rebuilt whenever a month is re-split.

Why precompute rather than build on request: a 277-species format takes ~13 s to
assemble, and the dyno runs one worker with eight threads and also serves the
website. That is not a request. Built here, serving a pack is sendfile() on a
file that is already gzipped -- the response body is the bytes on disk.

Layout:
    stats/<month>/_packs/<format>__<rating>.json.gz
    stats/<month>/_packs/_manifest.json

Each pack:
    {"api_version": 1, "month": ..., "format": ..., "rating": ...,
     "revision": <same as /sync/manifest>, "species_count": N,
     "pokemon": {"<Name>": {<the /api/v1/pokemon payload>}, ...}}

graph_data is deliberately excluded -- it is 47% of a species payload and the
histogram is drawn on a screen that can ask for it per-Pokemon. See mobile_api.

Usage:
    python build_packs.py                  # latest month, every format
    python build_packs.py --month 2026-08
    python build_packs.py --formats gen9vgc2026regi,gen9ou
    python build_packs.py --jobs 4         # default: one per core, capped at 8
"""

import argparse
import gzip
import json
import multiprocessing as mp
import os
import sys
import time

# Workers import app.py for its data layer, not to serve traffic.
os.environ.setdefault("MUNCHSTATS_NO_WARM", "1")

# Paths and filenames come from mobile_api so the builder and the routes that
# serve these files cannot disagree about where a pack lives.
from mobile_api import (  # noqa: E402  (after the env var above)
    PACK_DIRNAME,
    PACK_MANIFEST_NAME as MANIFEST_NAME,
    pack_filename,
)


def _build_one(job):
    """Worker: build and write one pack. Returns a manifest row.

    Imports inside the function because multiprocessing on Windows spawns fresh
    interpreters -- module-level imports here would load app.py in the parent
    too, for nothing.
    """
    month, format_code, rating, out_dir = job
    import app as A
    import mobile_api

    index = A.fetch_index_data(format_code, rating, month)
    species = (index or {}).get("pokemon") or {}
    if not species:
        return None

    names = sorted(species, key=lambda n: species[n].get("usage", 0), reverse=True)
    payloads = {}
    skipped = []
    for name in names:
        # One unreadable species must not lose the other 850. Some names cannot
        # round-trip through a filesystem at all -- "Type: Null" becomes an NTFS
        # alternate data stream on Windows -- and a format is still worth
        # shipping without it.
        try:
            data = A.compile_page_data(
                format_code, rating, name, month, include_species_list=False
            )
        except Exception as exc:
            skipped.append("%s (%s)" % (name, type(exc).__name__))
            continue
        if data is None:
            skipped.append(name)
            continue
        # include_graph: the stat-distribution chart ships in the pack rather
        # than being fetched per Pokemon. It roughly doubles a pack and the time
        # to build one, and buys the detail screen working entirely offline --
        # which is the point of the packs.
        payloads[name] = mobile_api.build_pokemon_payload(
            data, month, format_code, rating, include_graph=True
        )

    try:
        index_size = os.path.getsize(
            os.path.join(A.DATA_DIRECTORY, month, format_code, rating,
                         mobile_api.INDEX_FILE)
        )
    except OSError:
        index_size = 0
    revision = mobile_api.dataset_revision(
        (index or {}).get("info") or {}, len(species), index_size
    )

    body = {
        "api_version": mobile_api.API_VERSION,
        "month": month,
        "format": format_code,
        "format_name": A.formatDisplayNames.get(format_code, format_code),
        "rating": rating,
        "revision": revision,
        "species_count": len(payloads),
        "pokemon": payloads,
    }

    blob = json.dumps(body, separators=(",", ":"), default=str).encode("utf8")
    path = os.path.join(out_dir, pack_filename(format_code, rating))
    # Per-process temp name: two builds running at once (a full run and a
    # single-format rebuild, say) would otherwise share one path, and whichever
    # renamed second would leave the loser's file behind to be published.
    tmp = "%s.%d.tmp" % (path, os.getpid())
    # mtime=0 and filename="" so rebuilding identical data produces an identical
    # file; otherwise every run would look like a change to anything comparing
    # bytes. The name matters as much as the time: GzipFile stores the file it
    # writes to, and that is the per-process temp name above, so every build
    # carried a different pid in its header.
    with open(tmp, "wb") as fh:
        with gzip.GzipFile(filename="", fileobj=fh, mode="wb", compresslevel=9, mtime=0) as gz:
            gz.write(blob)
    os.replace(tmp, path)

    return {
        "format": format_code,
        "format_name": body["format_name"],
        "rating": rating,
        "revision": revision,
        "species_count": len(payloads),
        "raw_bytes": len(blob),
        "bytes": os.path.getsize(path),
        "file": pack_filename(format_code, rating),
        "skipped": skipped,
    }


def discover(month, data_dir, only_formats=None):
    root = os.path.join(data_dir, month)
    jobs = []
    for fmt in sorted(os.listdir(root)):
        if only_formats and fmt not in only_formats:
            continue
        fd = os.path.join(root, fmt)
        if not os.path.isdir(fd) or fmt == PACK_DIRNAME:
            continue
        for rating in sorted((d for d in os.listdir(fd) if d.isdigit()), key=int):
            if os.path.exists(os.path.join(fd, rating, "_index.json")):
                jobs.append((fmt, rating))
    return jobs


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--month", default=None, help="default: latest local month")
    ap.add_argument("--formats", default=None, help="comma-separated format codes")
    ap.add_argument("--jobs", type=int, default=0, help="worker processes")
    ap.add_argument("--limit", type=int, default=0, help="stop after N datasets (testing)")
    args = ap.parse_args()

    import app as A  # parent needs it only for paths and the month default

    month = args.month or A.get_latest_month()
    data_dir = A.DATA_DIRECTORY
    if not os.path.isdir(os.path.join(data_dir, month)):
        sys.exit(f"no local data for {month}")

    only = set(f.strip() for f in args.formats.split(",")) if args.formats else None
    pairs = discover(month, data_dir, only)
    if args.limit:
        pairs = pairs[: args.limit]
    if not pairs:
        sys.exit("nothing to build")

    out_dir = os.path.join(data_dir, month, PACK_DIRNAME)
    os.makedirs(out_dir, exist_ok=True)
    # Clear anything a killed run left behind, so it cannot be published.
    for stale in os.listdir(out_dir):
        if stale.endswith(".tmp"):
            try:
                os.remove(os.path.join(out_dir, stale))
            except OSError:
                pass

    jobs = [(month, fmt, rating, out_dir) for fmt, rating in pairs]
    workers = args.jobs or min(mp.cpu_count(), 8)
    print(f"building {len(jobs)} packs for {month} with {workers} workers")
    print(f"  -> {out_dir}")

    started = time.time()
    rows = []
    done = 0
    with mp.Pool(workers) as pool:
        for row in pool.imap_unordered(_build_one, jobs, chunksize=1):
            done += 1
            if row:
                rows.append(row)
                note = ""
                if row["skipped"]:
                    note = "  (skipped %d: %s)" % (
                        len(row["skipped"]), ", ".join(row["skipped"][:2]))
                print("  [%3d/%3d] %-34s %-5s %4d species  %6.1f KB%s"
                      % (done, len(jobs), row["format"][:34], row["rating"],
                         row["species_count"], row["bytes"] / 1024, note), flush=True)
            else:
                print("  [%3d/%3d] (empty, skipped)" % (done, len(jobs)), flush=True)

    rows.sort(key=lambda r: (r["format"], int(r["rating"])))
    total = sum(r["bytes"] for r in rows)
    manifest = {
        "api_version": 1,
        "month": month,
        "generated_at": int(time.time()),
        "pack_count": len(rows),
        "total_bytes": total,
        "packs": rows,
    }
    with open(os.path.join(out_dir, MANIFEST_NAME), "w", encoding="utf8") as fh:
        json.dump(manifest, fh, separators=(",", ":"))

    elapsed = time.time() - started
    print("\nbuilt %d packs in %.1f min" % (len(rows), elapsed / 60))
    print("  on disk (gzipped): %.1f MB" % (total / 1048576))
    print("  species total    : %d" % sum(r["species_count"] for r in rows))
    if rows:
        big = max(rows, key=lambda r: r["bytes"])
        print("  biggest pack     : %s/%s  %.2f MB"
              % (big["format"], big["rating"], big["bytes"] / 1048576))
    missing = sorted({n for r in rows for n in r["skipped"]})
    if missing:
        print("  species skipped  : %d distinct -> %s"
              % (len(missing), ", ".join(missing[:6])))


if __name__ == "__main__":
    main()
