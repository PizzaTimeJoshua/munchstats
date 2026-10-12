---
name: verify
description: Launch and drive the MunchStats Flask app locally to verify changes end-to-end.
---

# Verifying MunchStats changes

## Launch

```powershell
$env:PYTHONIOENCODING='utf-8'   # console is cp1252; pages contain → and é
python -c "import app; app.app.run(port=5099, debug=False)"
```

Run in the background; first import takes ~15-25s (loads stats data,
Limitless disk cache). Wait until `curl -s http://127.0.0.1:5099/tools/`
answers. Production entry is gunicorn (Procfile), but `app.run` exercises
the same code.

For meta-tag/context checks, Flask's test client is faster and avoids the
port entirely:

```powershell
python -c "import app; c = app.app.test_client(); print(c.get('/tools/').status_code)"
```

## Surfaces worth driving

- `/` and `/<format>/<rating>/<pokemon>` — ladder usage (index.html; JS-heavy)
- `/calc/` — damage calc mode of index.html
- `/tournaments/` — landing page (conversion panels + event listings)
- `/tournaments/<id>/<day>/<mon>` — official stats hub (tournaments.html + tournament_stats.js)
- `/limitless/`, `/limitless/event/<id>/` — online stats hub
- `/insights/` (`?min= ?rating= ?cores= ?sort= ?cut=`) — report panels
- `/teams/`, `/replays/`, `/tools/`, `/champions/`

Get a real tournament id via `python -c "import app; print(app.load_tournament_list()[0]['id'])"`.

## Gotchas

- Unknown URLs return 200 via the `/<format_code>/` catch-all — a 200 is
  NOT proof a route exists; check the title/content.
- Limitless API JSON grows between runs (incremental standings cache);
  cross-run diffs are not regressions.
- Templates are CRLF. All tabbed pages extend `templates/base.html` and
  include `templates/_tabs.html`; shared chrome CSS is `static/style.css`.
- Structural render checks that catch template breakage cheaply: exactly
  one `<!doctype`, one `googletagmanager`, one `tab-active` per page.
- No browser drivers (playwright/selenium) are installed; client-side JS
  can only be eyeballed manually in a browser.
