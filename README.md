# MunchStats — README.md

> **Live:** https://munchstats.com  
> **Repo:** https://github.com/PizzaTimeJoshua/munchstats

## Overview
**MunchStats** is a fast, single‑page style Flask app that presents Pokémon Showdown usage statistics by format. Pick a ladder (e.g., VGC 2025, OU), then dive into Pokémon detail pages with usage %, common moves, items, abilities, and EV spreads.

## Key Features
- Format selector (VGC / Singles ladders)
- Pokémon detail pages (usage %, moves, items, abilities, EVs)
- Rating threshold controls (e.g., 1500/1630/1760)

## Tech Stack
- **Backend:** Python 3 · Flask
- **Templating:** Jinja2
- **Frontend:** HTML/CSS/JavaScript (custom; see `static/tools_1.2.js`)
- **Process management:** Gunicorn (Procfile)
- **Data:** Pre‑generated JSON stats files per format & rating in `/stats`

## Data Files
- Location: `stats/`
- Naming: `YYYY-MM-<format-code>-<rating>.json`  
  Example: `2025-08-gen9vgc2025regh-1760.json`
- Each file contains a JSON object with a top‑level `data` map keyed by Pokémon.

## Routes (Flask)
- `GET /` → home/index
- `GET /about/` → about page
- `GET /<format_code>/` → format landing / Pokémon table
- `POST /search_pokemon` → returns a rendered Pokémon detail panel based on submitted form data

## Project Structure
```
/ static
  favicon.ico, pokemonicons-sheet.png, itemicons-sheet.png, tools_1.2.js
/ templates
  index.html, about.html, 404.html, 500.html
/ stats
  <YYYY-MM-format-rating>.json files (see Data Files)
app.py
Procfile
requirements.txt
```

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
gunicorn app:app --workers 2 --bind 0.0.0.0:8000
```

## Deployment
- **Heroku / Render / Fly.io:** use `Procfile` (`web: gunicorn app:app`).
- Ensure the `/stats` directory is populated at build/deploy time.

## Contributing
Issues and PRs welcome — especially for new formats, better UX, or data visualizations.
