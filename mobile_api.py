"""Versioned JSON API for the MunchStats mobile app.

Pure functions over data already on disk -- nothing here imports Flask, so the
payload shaping and revision logic stay testable without a request context
(same convention as og_card.py and draft_tools.py). app.py owns the routes and
does the loading.

Why this exists instead of reusing /api/<format>/<rating>/<pokemon>: that
endpoint returns whole-*page* data, and 78-80% of a response is chrome -- the
850-entry pokemon_names list, month_formats, available_months -- byte-identical
for every Pokemon in the format. A phone caching a format offline would store
that list once per Pokemon: 39 MB for gen9nationaldexubers where 8.8 MB of it
is actual per-Pokemon data. v1 hoists the chrome into /meta and /index and
leaves /pokemon carrying only what differs per Pokemon. Building the list is
also most of the server-side work for a detail request (a sprite lookup and a
trend scan per species), so skipping it cuts dyno CPU as well as bytes.

Offline contract the app is built against:
  - /meta and /sync/manifest are small; the client polls them on launch and on
    a background sync, and does nothing else if the revisions are unchanged.
  - Every payload is ETagged, so a revalidation that finds nothing new costs a
    304 with no body -- that is what makes "works offline, still current"
    affordable on a metered connection.
  - Revisions are content-derived (battle count + species count + index size),
    deliberately NOT mtimes. A Heroku redeploy rewrites every file's mtime, and
    an mtime-keyed revision would order every installed client to re-download
    all 252 datasets because the slug was rebuilt.

Local months only. fetch_remote_format_data() downloads and parses a 17-40 MB
chaos dict, and the dyno is 512 MB; a phone walking formats could pin several
of those at once. Unknown months 404 here rather than falling back to Smogon.
"""

import hashlib
import json
import os
import re

API_VERSION = 1

MONTH_RE = re.compile(r"^\d{4}-\d{2}$")

# A format/rating directory carries one _index.json plus one file per species.
INDEX_FILE = "_index.json"

# Precomputed detail packs, written by build_packs.py and served untouched.
# Named here rather than in either consumer so the builder and the routes cannot
# disagree about where a pack lives.
PACK_DIRNAME = "_packs"
PACK_MANIFEST_NAME = "_manifest.json"


def pack_key(format_code, rating):
    """Stable id for one dataset's pack. '__' never occurs in a format code."""
    return "%s__%s" % (format_code, rating)


def pack_filename(format_code, rating):
    return pack_key(format_code, rating) + ".json.gz"

# Keys of compile_page_data() that vary per Pokemon. Everything it returns that
# is not listed here is chrome and belongs to /meta or /index -- see the module
# docstring. Kept explicit so that adding a key to compile_page_data() without
# deciding which side it falls on shows up as a missing field in the app rather
# than silently re-inflating every detail response.
POKEMON_FIELDS = (
    "base_stats",
    "pokemon_types",
    "moves_list",
    "teammates_list",
    "items_list",
    "abilities_list",
    "spreads_list",
    "natures_list",
    "evs_list",
    "counters_list",
    "tera_types_list",
)

# graph_data is the website's stat-distribution histogram, and it is not cheap:
# 6.3 KB of a 13.4 KB payload (47%) and most of the build time, because it walks
# every recorded spread across six stats. The usage lists it sits beside are
# already capped at their top 10-15 entries, so this one field -- not the move
# or item tails -- is where a species payload's weight actually is.
#
# Left out by default and requested with ?graph=1, so a screen that draws the
# histogram can ask for it and an offline pack of several hundred species does
# not carry it for every one.
GRAPH_FIELD = "graph_data"


def is_month(value):
    """True for a well-formed 'YYYY-MM' string."""
    return bool(value and MONTH_RE.match(value))


def safe_segment(value):
    """Reject path separators and traversal in a URL segment.

    Format codes, ratings and species names all become path components under
    stats/, so anything that could climb out of the data directory is refused
    before it reaches open().
    """
    if not value or value in (".", ".."):
        return False
    return not any(c in value for c in ("/", "\\", "\0"))


def same_species(requested, resolved):
    """True when `resolved` is only a respelling of `requested`.

    compile_page_data() runs the requested name through difflib, which is right
    for a URL someone typed but wrong for an API the app caches by key: asking
    for a name that does not exist returns the closest real Pokemon with a 200,
    and the app would file that data under the name it asked for. Comparing the
    normalised forms keeps the harmless differences (case, hyphens, spaces) and
    rejects an actual mismatch.
    """
    strip = lambda s: re.sub(r"[^a-z0-9]+", "", (s or "").lower())
    return strip(requested) == strip(resolved)


def payload_etag(payload):
    """Strong ETag for a JSON-serialisable payload.

    Hashes the canonical encoding rather than the response bytes so the tag is
    stable across dict ordering and whitespace changes in how Flask serialises.
    """
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=True, default=str)
    return '"%s"' % hashlib.sha256(blob.encode("utf8")).hexdigest()[:20]


def dataset_revision(info, species_count, index_size):
    """Short content-derived revision for one format/rating dataset.

    Built from the battle count recorded in _index.json, the number of species
    and the index file's size: all three move when a month is re-split and none
    of them move when the slug is merely rebuilt. See the module docstring on
    why this is not an mtime.
    """
    seed = "%s|%s|%s|%s" % (
        (info or {}).get("metagame", ""),
        (info or {}).get("number of battles", 0),
        species_count,
        index_size,
    )
    return hashlib.sha256(seed.encode("utf8")).hexdigest()[:12]


def scan_month(data_dir, month):
    """Stat every format/rating dataset of a local month.

    Returns a sorted list of (format_code, rating, index_path, size, mtime_ns).
    Pure stat calls -- no file is opened here, so this stays cheap enough to run
    on every manifest request as the cache key for the expensive part.
    """
    root = os.path.join(data_dir, month)
    if not os.path.isdir(root):
        return []
    found = []
    for fmt in os.listdir(root):
        fmt_dir = os.path.join(root, fmt)
        if not os.path.isdir(fmt_dir):
            continue
        for rating in os.listdir(fmt_dir):
            rating_dir = os.path.join(fmt_dir, rating)
            if not rating.isdigit() or not os.path.isdir(rating_dir):
                continue
            index_path = os.path.join(rating_dir, INDEX_FILE)
            try:
                st = os.stat(index_path)
            except OSError:
                # A rating directory mid-split has no index yet; it is simply
                # not offerable to a client until the splitter finishes.
                continue
            found.append((fmt, rating, index_path, st.st_size, st.st_mtime_ns))
    found.sort()
    return found


def scan_signature(entries):
    """Cheap key over scan_month() output, for memoising the manifest.

    Uses mtimes deliberately: this only decides whether to recompute, and
    recomputing after a redeploy is harmless because the revisions it produces
    are content-derived and come out identical.
    """
    seed = "|".join("%s/%s:%s:%s" % (f, r, sz, mt) for f, r, _, sz, mt in entries)
    return hashlib.sha256(seed.encode("utf8")).hexdigest()[:16]


def build_manifest(data_dir, month, display_names=None):
    """Revision listing for every dataset in a month.

    The client stores the revision it last synced per dataset and re-downloads
    only the ones whose revision moved. Opens each _index.json (the battle count
    lives inside), which is why app.py memoises this behind scan_signature().
    """
    display_names = display_names or {}
    datasets = []
    for fmt, rating, index_path, size, _mtime in scan_month(data_dir, month):
        try:
            with open(index_path, "r", encoding="utf8") as fh:
                index = json.load(fh)
        except (OSError, ValueError):
            continue
        species = index.get("pokemon") or {}
        info = index.get("info") or {}
        datasets.append({
            "format": fmt,
            "format_name": display_names.get(fmt, fmt),
            "rating": rating,
            "species_count": len(species),
            "battles": info.get("number of battles", 0),
            "revision": dataset_revision(info, len(species), size),
        })
    datasets.sort(key=lambda d: (d["format"], int(d["rating"])))
    return {
        "api_version": API_VERSION,
        "month": month,
        "dataset_count": len(datasets),
        # One value covering the whole month: a client whose stored copy matches
        # this can skip walking the list entirely.
        "revision": hashlib.sha256(
            "|".join(d["revision"] for d in datasets).encode("utf8")
        ).hexdigest()[:16],
        "datasets": datasets,
    }


def build_index_payload(index_data, month, format_code, format_name, rating,
                        sprite_fn, trend_fn=None, index_size=0):
    """Ranked species list for one dataset -- the chrome hoisted out of /pokemon.

    Each entry is [name, usage_percent, sprite, trend] in descending usage
    order, matching what the web client already consumes so the app and the site
    agree on ranking. trend_fn is optional: historical months have no trend to
    show, and the caller passes None rather than computing empty strings.

    index_size must be the size of the same _index.json the manifest measured,
    so the revision here is identical to the one /sync/manifest reports for this
    dataset. A client that cross-checks the two would otherwise see a permanent
    mismatch and re-sync forever.
    """
    species = index_data.get("pokemon") or {}
    ordered = sorted(species, key=lambda n: species[n].get("usage", 0), reverse=True)
    info = index_data.get("info") or {}
    return {
        "api_version": API_VERSION,
        "month": month,
        "format": format_code,
        "format_name": format_name,
        "rating": rating,
        "battles": info.get("number of battles", 0),
        "revision": dataset_revision(info, len(species), index_size),
        "category": CATEGORY_SHOWDOWN,
        "value_kind": VALUE_USAGE,
        "pokemon": [
            [
                name,
                "{:.2f}".format(round(species[name].get("usage", 0) * 100, 2)),
                sprite_fn(name),
                trend_fn(name) if trend_fn else "",
            ]
            for name in ordered
        ],
    }


def build_index_pack(month, entries, manifest_revision):
    """Every dataset's species list for a month, in one response.

    `entries` is [(format_code, format_name, rating, index_payload), ...].

    This is what the app downloads on first run and at a month boundary. The
    whole thing is ~2.4 MB raw and ~0.5 MB over the wire -- 72k species rows for
    252 datasets -- because a species row is only name, value, sprite and trend.
    Fetching those datasets one at a time would be 252 round trips for the same
    bytes; fetching the *details* they point at would be 232 MB, which is why
    only the lists are packed here.

    The client unpacks each dataset under the same URL /api/v1/index/... would
    have used, so every later read hits the ordinary cache path and needs no
    knowledge that a pack exists.
    """
    return {
        "api_version": API_VERSION,
        "month": month,
        # Matches /sync/manifest, so a client can tell whether its pack is
        # current without downloading this again.
        "revision": manifest_revision,
        "dataset_count": len(entries),
        "datasets": [
            {
                "format": code,
                "format_name": name,
                "rating": rating,
                "revision": payload.get("revision", ""),
                "battles": payload.get("battles", 0),
                "value_kind": payload.get("value_kind", VALUE_USAGE),
                "pokemon": payload.get("pokemon") or [],
            }
            for code, name, rating, payload in entries
        ],
    }


def build_champions_index_payload(page_data, format_code, format_name):
    """Ranked species list for an in-game Champions format.

    compile_champions_page_data() already returns the list in pokemon_names, in
    the same [name, value, sprite, trend] shape as the ladder index -- but the
    value is a placing ("#1"), not a usage share, which is why the payload says
    so in value_kind rather than leaving the client to guess.

    There is no revision here: this data comes from the Champions branch via
    get_champions_index(), not from a month's split files, so /sync/manifest
    does not cover it and the ETag is what keeps it current.
    """
    return {
        "api_version": API_VERSION,
        "format": format_code,
        "format_name": format_name,
        "category": CATEGORY_IN_GAME,
        "value_kind": VALUE_RANK,
        "updated": page_data.get("champions_updated", ""),
        "attribution": page_data.get("champions_attribution", ""),
        "pokemon": page_data.get("pokemon_names") or [],
    }


def build_pokemon_payload(page_data, month, format_code, rating, include_graph=False):
    """Per-Pokemon payload: compile_page_data() output minus the chrome.

    Takes the already-compiled page dict and keeps only POKEMON_FIELDS plus the
    identity and trend of the selected species. Anything compile_page_data()
    grows later is dropped here by default -- see POKEMON_FIELDS.
    """
    current = page_data.get("current_pokemon") or ["", 0, "N/A", ""]
    payload = {
        "api_version": API_VERSION,
        "month": month,
        "format": format_code,
        "rating": rating,
        "name": current[0],
        "usage": current[1],
        "rank": current[2],
        "sprite": current[3],
        "is_transformed": page_data.get("is_transformed", False),
        "category": (CATEGORY_IN_GAME if page_data.get("is_champions_game")
                     else CATEGORY_SHOWDOWN),
        # In-game entries carry a placing where ladder entries carry a percent.
        "value_kind": (VALUE_RANK if page_data.get("is_champions_game")
                       else VALUE_USAGE),
        "trend": {
            "months": page_data.get("trend_months") or [],
            "usage": page_data.get("trend_usage") or [],
            "show": page_data.get("show_trend", False),
            # "usage" trends climb when a Pokemon gets more popular; "rank"
            # trends fall. Plotting both the same way inverts half the charts.
            "kind": page_data.get("trend_kind", VALUE_USAGE),
        },
    }
    for key in POKEMON_FIELDS:
        payload[key] = page_data.get(key)
    if include_graph:
        payload[GRAPH_FIELD] = page_data.get(GRAPH_FIELD)
    return payload


# Which tab of the app's Usage screen a format belongs to. The screen's top
# control is In-Game / Showdown / Tournaments, so the server names the group
# rather than making the client pattern-match on format codes.
CATEGORY_IN_GAME = "in_game"    # live Pokemon Champions in-game battle data
CATEGORY_SHOWDOWN = "showdown"  # Smogon ladder usage stats

# What the second column of a species row means. Ladder data ranks by usage
# share; the in-game Champions feed publishes a placing instead, so a client
# that assumed "percent" would render "#1" as 1%.
VALUE_USAGE = "usage"
VALUE_RANK = "rank"


def build_meta(months, formats_by_month, ratings_by_format, default_format,
               default_month, category_fn=None):
    """Bootstrap payload: what the client may ask for at all.

    Sent once per sync rather than repeated inside every detail response, which
    is where most of the duplicated weight in the old endpoint came from.
    """
    formats = []
    for month in months:
        entries = []
        for code, name in formats_by_month(month):
            category = category_fn(code) if category_fn else CATEGORY_SHOWDOWN
            ratings = ratings_by_format(month, code)
            # In-game formats have no ladder rating cutoffs at all, so the
            # "nothing on disk" test below would drop every one of them.
            if category == CATEGORY_IN_GAME:
                entries.append({"code": code, "name": name, "ratings": [],
                                "category": category})
                continue
            # A ladder format with no cutoffs on disk has nothing the app could
            # open. Listing it anyway just produces a menu entry that 404s.
            if ratings:
                entries.append({"code": code, "name": name, "ratings": ratings,
                                "category": category})
        formats.append({"month": month, "entries": entries})
    return {
        "api_version": API_VERSION,
        "default_month": default_month,
        "default_format": default_format,
        "months": months,
        "formats": formats,
    }
