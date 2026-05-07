# MunchStats — README.md

> **Live:** https://munchstats.com
> **Repo:** https://github.com/PizzaTimeJoshua/munchstats

## Overview
**MunchStats** is a fast, single-page style Flask app that presents Pokémon Showdown usage statistics by format. Pick a ladder (e.g., VGC 2026, OU), then dive into Pokémon detail pages with usage %, common moves, items, abilities, EV spreads, and usage trends.

## Key Features
- Format selector across all generations and metagames
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

## Tech Stack
- **Backend:** Python 3 · Flask
- **Templating:** Jinja2
- **Frontend:** HTML/CSS/JavaScript (custom; see `static/tools_2.2.js`)
- **Charts:** Chart.js (EV distribution bar chart, usage trend line chart)
- **Process management:** Gunicorn (Procfile)
- **Data:** Per-Pokémon JSON files in `stats/`, trend data in `stats/trends/`

## Data Files
- **Per-Pokémon stats:** `stats/{YYYY-MM}/{format}/{rating}/{Pokemon}.json`
- **Index files:** `stats/{YYYY-MM}/{format}/{rating}/_index.json` (Pokémon list + usage + raw count)
- **Trend data:** `stats/trends/{format}/{rating}.json` (12 months of usage % per Pokémon)
- **Metadata:** `stats/pokedex.json`, `stats/moves.json`, `stats/items.json`, `stats/abilities.json`, `stats/forms_index.json`, `stats/meta_names.json`

## Routes (Flask)
- `GET /` → home/index (default format)
- `GET /about/` → about page
- `GET /<format_code>/` → format landing
- `GET /<format_code>/<rating>/` → format with specific rating
- `GET /<format_code>/<rating>/<pokemon_name>` → Pokémon detail page
- `GET /api/<format_code>/<rating>/<pokemon_name>` → JSON API for dynamic page updates
- `POST /search_pokemon` → fuzzy search redirect

## Project Structure
```
/ static
  favicon.ico, pokemonicons-sheet.png, itemicons-sheet.png, tools_2.2.js
/ templates
  index.html, about.html, 404.html, 500.html
/ stats
  {YYYY-MM}/                  Per-Pokémon split stats by month/format/rating
  trends/                     Pre-computed 12-month usage trend data
  pokedex.json, moves.json, items.json, abilities.json, etc.
app.py                        Flask application
update_all_data.py            Data pipeline (downloads, splits, generates trends)
Procfile
requirements.txt
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

## Local Setup
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run
```bash
# Dev
export FLASK_APP=app.py  # Windows: set FLASK_APP=app.py
flask run

# Prod-like
gunicorn app:app --workers 2 --bind 127.0.0.1:8000
```

## Deployment
- **Heroku / Render / Fly.io:** use `Procfile` (`web: gunicorn app:app`).
- Ensure the `/stats` directory is populated at build/deploy time.

## Contributing
Issues and PRs welcome — especially for new formats, better UX, or data visualizations.
