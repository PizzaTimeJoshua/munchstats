# MunchStats — README.md

> **Live:** https://munchstats.com
> **Repo:** https://github.com/PizzaTimeJoshua/munchstats

## Overview
**MunchStats** is a fast, single-page style Flask app that presents Pokémon Showdown usage statistics by format. Pick a ladder (e.g., VGC 2026, OU), then dive into Pokémon detail pages with usage %, common moves, items, abilities, EV spreads, and usage trends. Also features an integrated damage calculator, VGC tournament stats, a searchable team repository, and a replay search engine.

## Key Features

### Usage Statistics
- Format selector across all generations and metagames (70+ formats)
- Pokémon detail pages (usage %, moves, items, abilities, EVs, natures, teammates, checks & counters)
- Rating threshold controls (e.g., 0/1500/1630/1760)
- Usage trend line chart showing 12 months of historical usage data
- Trend direction indicators (up/down/same) in the Pokémon sidebar list
- Month selector to browse historical stats from any available Smogon month
- On-demand fetching of historical months from Smogon with LRU caching
- Per-Pokémon JSON splitting for fast page loads (~5-50KB per request vs 2-13MB)
- Showdown set export with move/item/ability/spread selection
- EV distribution graph with cumulative toggle
- Tera Type display for Gen 9 formats
- Champions format mod support (custom moves/abilities)

### Damage Calculator
- Integrated Smogon damage calculator at `/calc/`
- Usage-based move, item, and ability suggestions
- IV/EV stat overrides
- Form & type selectors
- Field condition support (weather, terrain, screens)
- Stat boost/reduction controls

### Tournament Stats
- Merged tournament hub at `/tournaments/` with two data sources: official (RK9.gg) events and online (Limitless) events
- **Official (RK9.gg):** per-tournament usage stats with day-based filtering (Day 1, Day 2, Top 16, Top 8), player standings with team compositions, and per-Pokémon win rates
  - Mega forms are resolved from held stones here too (Champions-regulation events), at scrape/aggregation time; `python scrape_tournaments.py --reaggregate` rebuilds saved tournaments through the current aggregation logic without re-scraping
- **Online (Limitless):** aggregated usage stats from recent Limitless online VGC tournaments (data from [Limitless TCG](https://play.limitlesstcg.com/)), deep-linkable at `/limitless/`
  - Mega forms are resolved from held stones at the decklist level (a Charizard holding Charizardite Y counts as Charizard-Mega-Y), so usage stats, win rates, teams, and archetypes all track each forme separately — matching the Showdown ladder's native form listings
  - Rolling 30-day window per regulation format; only formats with recent events and public team data are offered
  - Tournament-size segments (25+/50+/100+/200+ players) to filter for more competitive events
  - Placement-cut filter (`?cut=` — Top 32 / Top 16 / Top 8) to restrict stats, teams, and standings to top finishers
  - Per-Pokémon usage %, win rates, moves, items, abilities, Tera types, natures, and teammates
  - Team results view grouping identical 6-Pokémon teams into archetypes ranked by usage, with combined win rates and slot-scoped comma-group search (`kingambit focus sash, garchomp` = a Kingambit *holding* Focus Sash alongside a Garchomp; terms also match player/tournament metadata); deep-linkable via `?view=results&q=`
  - Best-performing teams per Pokémon across all events, ranked by Swiss points
- **Individual Limitless events:** per-event pages at `/limitless/event/<id>/` with that tournament's own usage stats, teams, and standings (also cut-filterable)
- Top tournament teams shown on Pokémon detail pages — merges RK9 majors with Limitless online events, ranked by Swiss points, then tournament size, then placement
- BO3 format support

### Team Search (VGCPastes)
- Searchable team repository at `/teams/` — team data from the [VGCPastes Repository](https://twitter.com/VGCPastes) (public Google Sheet)
- Repository selector (Champions M-A/M-B, SV Regulation I)
- Slot-scoped comma-group search: within a comma group, every term must match the same team slot (Pokémon + held item) or the team's metadata; `mode=any` matches any group instead of all
- Filters: has EV spreads, has rental/replica code, has tournament report; sort by newest/oldest/random
- Team cards with Pokémon and item sprites, player/event/rank metadata, and source/report links
- In-site team viewer: fetches the raw Showdown paste from Pokepaste (immutable, cached on disk) into a modal
- Sheet tabs cached on disk for 12 hours with stale fallback; cache warmed in a background thread at startup

### Meta Insights
- Analysis page at `/insights/` combining the site's data sources into three reports per VGC regulation:
  - **Tournament Conversion:** highest/lowest win rates from online tournament records (min-games floor so one-off runs don't rank), with usage rank alongside — surfaces overrated and underrated picks; Mega forms resolved from held stones
  - **Tournament Momentum:** usage movement between the rolling window's earlier and recent halves — a fresher rising/falling signal than the monthly ladder stats
  - **Cores:** 2–6 Pokémon cores (6 = full team) with pooled tournament records, sortable by best win rate (with a usage floor), most common (what to prepare for), or best synergy (combined win rate beats every member's solo rate); Mega forms are resolved from held stones, each core deep-links into the Team Results search showing the actual teams, and switching size/sort swaps the table in place without a page reload
  - **Ladder vs Tournament:** biggest gaps between Showdown ladder usage and online tournament usage; tournament Mega forms are resolved from held stones so both sources count each forme separately, matching the ladder's native form listings
  - **Rising & Falling:** biggest month-over-month ladder usage movers (hidden for formats in their first tracked month)
- Filters: tournament-size tier (`?min=`) and ladder rating cutoff (`?rating=`)
- Built entirely from data the other pages already load (Limitless aggregate, Smogon index, trend files) — no extra fetching or caching

### Replay Search
- Searchable replay database at `/replays/`
- Filter by format, Pokémon, player, rating, and wins
- Team usage rankings
- Embedded replay viewer
- BO3 replay selector
- Replay data auto-updated ~4×/day by a scheduled GitHub Actions workflow (see Data Pipeline)

### Other
- Pokémon merchandise listings via eBay affiliate integration
- Tools page with Pokémon Showdown browser extensions

## Tech Stack
- **Backend:** Python 3 · Flask
- **Templating:** Jinja2
- **Frontend:** HTML/CSS/JavaScript · jQuery 3.7.1
- **Charts:** Chart.js (EV distribution bar chart, usage trend line chart)
- **Damage Calc:** @smogon/calc 0.11.0 (bundled with esbuild)
- **Process management:** Gunicorn (Procfile)
- **Data:** Per-Pokémon JSON files in `stats/`, trend data in `stats/trends/`, tournament data in `stats/tournaments/`, Limitless API cache in `cache/limitless/`, VGCPastes sheet cache in `cache/vgcpastes/`
- **Automation:** GitHub Actions (scheduled replay-stats updates)

## Data Files
- **Per-Pokémon stats:** `stats/{YYYY-MM}/{format}/{rating}/{Pokemon}.json`
- **Index files:** `stats/{YYYY-MM}/{format}/{rating}/_index.json` (Pokémon list + usage + raw count)
- **Trend data:** `stats/trends/{format}/{rating}.json` (12 months of usage % per Pokémon)
- **Tournament data:** `stats/tournaments/{tournament_id}/` (metadata, players, aggregated stats)
- **Limitless cache:** `cache/limitless/` (formats, tournament list, per-tournament standings) — fetched lazily at runtime, safe to delete
- **VGCPastes cache:** `cache/vgcpastes/` (sheet tabs as CSV, fetched Pokepaste texts) — fetched lazily at runtime, safe to delete
- **Metadata:** `stats/pokedex.json`, `stats/moves.json`, `stats/items.json`, `stats/abilities.json`, `stats/forms_index.json`, `stats/meta_names.json`
- **Champions mod:** `stats/champions_moves.json`, `stats/champions_abilities.json`

## Routes (Flask)

### Pages
- `GET /` → home/index (default format)
- `GET /<format_code>/` → format landing
- `GET /<format_code>/<rating>/` → format with specific rating
- `GET /<format_code>/<rating>/<pokemon_name>` → Pokémon detail page
- `GET /calc/` → damage calculator (also `/calc/<format_code>/` and `/calc/<format_code>/<rating>/`)
- `GET /champions/` → Champions format stats (also `/champions/<fmt>/` and `/champions/<fmt>/<pokemon_name>`)
- `GET /tournaments/` → tournament hub, official RK9 source (also `/tournaments/<id>/`, `/tournaments/<id>/<day_filter>/`, `/tournaments/<id>/<day_filter>/<pokemon_name>`)
- `GET /limitless/` → tournament hub, online Limitless source (also `/limitless/<format_id>/`, `/limitless/<format_id>/<segment>/`, `/limitless/<format_id>/<segment>/<pokemon_name>`; all accept `?cut=8|16|32`)
- `GET /limitless/event/<tournament_id>/` → single online tournament's stats (also `/<pokemon_name>`, `?cut=`)
- `GET /teams/` → VGCPastes team search (also `/teams/<repo_id>/`)
- `GET /insights/` → meta insight reports (also `/insights/<format_id>/`; `?min=` size tier, `?rating=` ladder cutoff, `?cores=` core size 2–6, `?sort=` core sort wr/usage/lift)
- `GET /replays/` → replay search (also `/replays/<format_code>/`)
- `GET /replays/watch/<replay_id>` → replay viewer
- `GET /tools/` → tools page
- `GET /about/` → about page

### API
- `POST /search_pokemon` → fuzzy search redirect
- `GET /api/<format_code>/<rating>/<pokemon_name>` → Pokémon data JSON
- `GET /api/<format_code>/<rating>/` → format index JSON
- `GET /api/<format_code>/<rating>/calc/<pokemon_name>` → calc data JSON
- `GET /api/moves/search` → move autocomplete
- `GET /api/pokemon-teams/<format_code>/<pokemon_name>` → top tournament teams using Pokémon
- `GET /api/pokemon-replays/<format_code>/<pokemon_name>` → related replay links
- `GET /api/merch/<pokemon_name>` → eBay merchandise listings
- `GET /tournaments/api/<tournament_id>/<day_filter>/` → tournament data JSON
- `GET /tournaments/api/<tournament_id>/teams/<pokemon_name>` → teams using Pokémon
- `GET /tournaments/api/<tournament_id>/standings` → player standings
- `GET /limitless/api/<format_id>/<segment>/` → Limitless usage stats JSON (also `/<pokemon_name>`; `?cut=` placement filter)
- `GET /limitless/api/<format_id>/teams/<pokemon_name>` → best teams using Pokémon (`?min=` tournament size, `?cut=` placement)
- `GET /limitless/api/<format_id>/results/` → team archetypes (`?q=` slot-scoped comma-group search, `?min=` size, `?cut=` placement)
- `GET /limitless/api/event/<tournament_id>/` → single-event usage stats JSON (also `/<pokemon_name>`; `?cut=`)
- `GET /limitless/api/event/<tournament_id>/teams/<pokemon_name>` → one event's teams using Pokémon (`?cut=`)
- `GET /limitless/api/event/<tournament_id>/standings` → one event's standings (`?cut=`)
- `GET /teams/api/<repo_id>/` → VGCPastes team search (`?q=` comma-group search, `?evs=`/`?code=`/`?report=` filters, `?sort=newest|oldest|random`, `?mode=any`, paged via `offset`/`limit`)
- `GET /teams/api/<repo_id>/paste/<team_id>` → raw Showdown text of a team's Pokepaste
- `GET /replays/api/search` → replay search with filters
- `GET /replays/api/default` → default replay listing
- `GET /replays/api/rankings` → team usage rankings

## Project Structure
```
static/
  tools_2.3.js                Main frontend logic
  damage_calc.js              Damage calculator UI
  replay_search.js            Replay search/filtering
  tournament_stats.js         Tournament page logic
  vendor/smogon-calc.js       Bundled Smogon damage calculator
  pokemonicons-sheet.png, itemicons-sheet.png, favicon.ico
templates/
  index.html                  Main stats page
  tournaments.html            Tournament stats page
  teams.html                  VGCPastes team search page
  insights.html               Meta insights page
  replays.html                Replay search page
  watch.html                  Replay viewer
  tools.html, about.html, 404.html, 500.html
stats/
  {YYYY-MM}/                  Per-Pokémon split stats by month/format/rating
  trends/                     Pre-computed 12-month usage trend data
  tournaments/                Tournament data (RK9.gg)
  replays/                    Replay data
  pokedex.json, moves.json, items.json, abilities.json, etc.
.github/workflows/
  update-replay-stats.yml     Scheduled replay-stats update (GitHub Actions)
app.py                        Flask application
limitless_stats.py            Limitless API client + online tournament usage aggregation
insights.py                   Meta insight report builders (pure functions over loaded data)
vgcpastes.py                  VGCPastes sheet client + team search
update_all_data.py            Data pipeline (downloads, splits, generates trends)
scrape_tournaments.py         Tournament data scraper (RK9.gg)
Procfile
requirements.txt
package.json
```

## Data Pipeline
Run `update_all_data.py` to update all data:
```bash
python update_all_data.py
```
This will:
1. Download latest Pokémon data (pokedex, moves, items, abilities, sprites)
2. Download current month's usage stats from Smogon
3. Split monolithic JSON files into per-Pokémon files
4. Generate 12-month usage trend data from Smogon chaos files
5. Generate format name mappings
6. Download Champions mod data

To update tournament data separately:
```bash
python scrape_tournaments.py
```

### Limitless Online Data
Online tournament data needs no pipeline step — it is fetched lazily at runtime from the [Limitless API](https://docs.limitlesstcg.com/developer.html) and cached under `cache/limitless/` to keep API usage minimal (the public API is used without a key):
- The VGC format list is cached for 12 hours, the tournament list for 1 hour (one shared request covers all formats).
- Standings of finished tournaments never change, so they are cached forever; each hourly refresh only fetches newly finished events (capped per refresh, with a politeness delay and a cooldown on failed fetches).
- The cache is warmed in a background thread at app startup, so a fresh deploy (or Heroku dyno restart, which wipes the disk) rebuilds itself before the first visitor.
- Set `LIMITLESS_API_KEY` to send an access key with requests (optional; only needed if rate-limited).

### VGCPastes Team Data
Team data also needs no pipeline step — the public VGCPastes spreadsheet tabs are fetched as CSV at runtime and cached under `cache/vgcpastes/` for 12 hours (with stale fallback if the sheet is unreachable). Pokepaste texts are immutable and cached on first fetch. Like the Limitless cache, it is warmed in a background thread at startup.

### Replay Stats Automation
`.github/workflows/update-replay-stats.yml` runs the replay scraper on a schedule (4×/day) via GitHub Actions: it scrapes new Showdown replays, rebuilds the searcher/team-ranking JSONs under `stats/replays/`, and commits them to this repo (which triggers the Heroku auto-deploy). The raw replay cache is carried between runs via `actions/cache`, seeded from a release asset on the private scraper repo. Requires one repository secret, `SCRAPER_TOKEN` (fine-grained PAT with Contents:Read on the scraper repo); until it is set, runs are silent no-ops. It can also be triggered manually via `workflow_dispatch`.

## Local Setup
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
npm install                # for damage calc build
```

## Run
```bash
# Dev
export FLASK_APP=app.py  # Windows: set FLASK_APP=app.py
flask run

# Prod-like (mirrors Procfile: single worker + threads to fit Heroku's 512MB dyno)
gunicorn app:app --workers 1 --threads 8 --bind 127.0.0.1:8000
```

## Deployment
- **Heroku / Render / Fly.io:** use `Procfile` (single gunicorn worker with 8 threads, tuned for a 512MB dyno).
- Ensure the `/stats` directory is populated at build/deploy time.
- Set `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET` environment variables for merch integration.
- Optionally set `LIMITLESS_API_KEY` for the Limitless API (works keyless by default).

## Contributing
Issues and PRs welcome — especially for new formats, better UX, or data visualizations.
