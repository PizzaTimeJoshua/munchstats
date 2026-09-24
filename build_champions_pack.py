"""Precompute the in-game Champions packs for the mobile app.

One gzipped file per in-game format holding the ranked list and every
Pokemon's detail, so the app can hold the whole thing offline.

Why this is a script and not an endpoint: assembling one format takes about
210 seconds. That is not something to do on a dyno that also serves the
website, however it is cached. The app fetches these from the mobile-packs
branch; a user who has not downloaded anything still gets per-Pokemon answers
from /api/v1/champions/<format>/<name>, which is cheap.

Kept separate from build_packs.py because the cadence is different. Ladder
stats are published monthly; the Champions branch republishes on its own
schedule, so this wants running more often and is not filed under a month.

Layout:
    stats/champions/<format>.json.gz
    stats/champions/_manifest.json

Usage:
    python build_champions_pack.py

Normally run by .github/workflows/update-champions-packs.yml, which rebuilds
and publishes whenever the scraper pushes new battle data.
"""

import gzip
import json
import os
import time

os.environ.setdefault("MUNCHSTATS_NO_WARM", "1")

import app as A  # noqa: E402
import mobile_api  # noqa: E402

OUT_DIR = os.path.join(A.DATA_DIRECTORY, "champions")
MANIFEST_NAME = "_manifest.json"


def build(format_code):
    """Assemble one format, or None when the upstream data is unavailable."""
    index = A.compile_champions_page_data(format_code)
    if index is None:
        return None

    rows = index.get("pokemon_names") or []
    names = [r[0] for r in rows if r and r[0]]

    payloads = {}
    skipped = []
    for name in names:
        try:
            data = A.compile_champions_page_data(format_code, name)
        except Exception as exc:
            skipped.append("%s (%s)" % (name, type(exc).__name__))
            continue
        if data is None:
            skipped.append(name)
            continue
        # The name has to round-trip, or the app would file one species' data
        # under another's -- the same guard the routes apply.
        if not mobile_api.same_species(name, data.get("selected_pokemon", "")):
            skipped.append("%s (resolved to %s)" % (name, data.get("selected_pokemon")))
            continue
        payloads[name] = mobile_api.build_pokemon_payload(
            data, data.get("selected_month", ""), format_code, "0",
            include_graph=True,
        )

    return {
        "api_version": mobile_api.API_VERSION,
        "format": format_code,
        "format_name": A.formatDisplayNames.get(format_code, format_code),
        "category": mobile_api.CATEGORY_IN_GAME,
        "value_kind": mobile_api.VALUE_RANK,
        "updated": index.get("champions_updated", ""),
        "attribution": index.get("champions_attribution", ""),
        # No build timestamp in here: the same data has to produce the same
        # bytes, or every rebuild -- a builder change, a merge -- would make
        # every installed app download both packs again. The manifest, which
        # the app never reads, records when they were built.
        "species_count": len(payloads),
        "index": rows,
        "pokemon": payloads,
    }, skipped


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for stale in os.listdir(OUT_DIR):
        if stale.endswith(".tmp"):
            try:
                os.remove(os.path.join(OUT_DIR, stale))
            except OSError:
                pass

    formats = list(A.CHAMPIONS_GAME_FORMATS)
    print("building %d in-game packs -> %s\n" % (len(formats), OUT_DIR))

    entries = []
    started = time.time()
    for format_code in formats:
        t0 = time.time()
        result = build(format_code)
        if result is None:
            print("  %-20s no upstream data, skipped" % format_code)
            continue
        body, skipped = result

        blob = json.dumps(body, separators=(",", ":"), default=str).encode("utf8")
        path = os.path.join(OUT_DIR, "%s.json.gz" % format_code)
        tmp = "%s.%d.tmp" % (path, os.getpid())
        # mtime=0 and filename="" so an unchanged rebuild is byte-identical,
        # which is what lets the app's conditional request come back 304
        # instead of re-downloading. Without filename="" GzipFile records the
        # temp file's name in the header -- pid included -- and every build
        # differed.
        with open(tmp, "wb") as fh:
            with gzip.GzipFile(filename="", fileobj=fh, mode="wb", compresslevel=9,
                               mtime=0) as gz:
                gz.write(blob)
        os.replace(tmp, path)

        entries.append({
            "format": format_code,
            "format_name": body["format_name"],
            "species_count": body["species_count"],
            "updated": body["updated"],
            "bytes": os.path.getsize(path),
            "file": "%s.json.gz" % format_code,
        })
        note = "  (skipped %d)" % len(skipped) if skipped else ""
        print("  %-20s %3d species  %6.0f KB  %5.0fs%s"
              % (format_code, body["species_count"],
                 os.path.getsize(path) / 1024, time.time() - t0, note))
        if skipped:
            print("      %s" % ", ".join(skipped[:4]))

    if not entries:
        # Nothing to publish. Writing an empty manifest would be worse than
        # failing: the workflow would commit it, and the check that stops
        # rebuilds would then believe this source had been built.
        print("\nno packs built -- is the champions-data branch reachable?")
        return 1

    with open(os.path.join(OUT_DIR, MANIFEST_NAME), "w", encoding="utf8") as fh:
        json.dump({
            "api_version": mobile_api.API_VERSION,
            "generated_at": int(time.time()),
            # The champions-data commit these were built from. The workflow
            # compares it with the branch to decide whether to build at all.
            # Empty for a build by hand, which the next scheduled run replaces.
            "source_commit": os.environ.get("CHAMPIONS_SOURCE_COMMIT", ""),
            "pack_count": len(entries),
            "total_bytes": sum(e["bytes"] for e in entries),
            "packs": entries,
        }, fh, separators=(",", ":"))

    print("\nbuilt %d packs in %.1f min, %.2f MB total"
          % (len(entries), (time.time() - started) / 60,
             sum(e["bytes"] for e in entries) / 1048576))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
