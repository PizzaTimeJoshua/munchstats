# MunchStats — README.md

> **Live:** https://munchstats.com
> **Repo:** https://github.com/PizzaTimeJoshua/munchstats

## Overview
**MunchStats** is a fast, single-page style Flask app that presents Pokémon Showdown usage statistics by format. Pick a ladder (e.g., VGC 2026, OU), then dive into Pokémon detail pages with usage %, common moves, items, abilities, EV spreads, and usage trends. Also features an integrated damage calculator, VGC tournament stats, a searchable team repository, and a replay search engine. Available in English and Spanish, with a selectable site theme.

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
- **Individual Limitless events:** per-event pages at `/limitless/event/<id>/` with that tournament's own usage stats, teams, standings, and team archetypes (also cut-filterable)
- **Stage analysis:** "Top Usage by Stage" overview — per-stage top-10 usage with usage-share deltas vs the previous stage (Day 1 / Day 2 / Top Cut on official events; All Teams / Top 32 / Top 16 / Top 8 on single Limitless events) — plus a "Biggest Movers" list of the largest usage shifts between stages
- **Official-event team archetypes:** the Team Results grouping (identical 6-Pokémon teams, combined win rates, comma-group search) is also available for RK9 events, filterable by day
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
  - **Top-Cut Conversion:** all-teams vs top-cut usage across the window's online tournaments, with a selectable cut size (`?cut=` — Top 8/16/32) — what actually converts to top finishes
  - **Rising & Falling:** biggest month-over-month ladder usage movers (hidden for formats in their first tracked month)
- Filters: tournament-size tier (`?min=`) and ladder rating cutoff (`?rating=`)
- Built entirely from data the other pages already load (Limitless aggregate, Smogon index, trend files) — no extra fetching or caching

### Replay Search
- Searchable replay database at `/replays/`
- Filter by format, Pokémon, player, rating, and wins
- Team usage rankings
- Embedded replay viewer
- BO3 replay selector
- Replay data auto-updated ~4×/day by a scheduled GitHub Actions workflow that publishes to the `replay-data` branch; the app pulls it at runtime with ETag caching — no redeploy needed (see Data Pipeline)

### Localization, Themes & Sharing
- **i18n:** full Spanish translation via Flask-Babel — auto-detected from `Accept-Language`, overridable with `?lang=` or the cookie-backed EN/ES picker in the nav; Pokémon, move, item, and ability names intentionally stay in English (competitive lingua franca)
- **Themes:** theme picker with 8 presets (classic dark, light, and Pokémon-inspired themes like Rayquaza, Umbreon, Gengar, Sylveon, Munchlax) — `theme-boot.js` applies the saved theme before first paint, and charts/the replay viewer restyle live on change
- **OG stat cards:** server-rendered Open Graph images (1200×630 PNG via Pillow) so shared Pokémon deep links preview with actual usage stats — covers ladder, RK9, Limitless (rolling window + single events), and Champions pages
- `robots.txt` served at the root

### Contact
- Contact form at `/contact/` (bug reports, feature requests, translation feedback) delivered via Gmail SMTP
- Spam protection layers: Cloudflare Turnstile captcha, hidden honeypot field, minimum message length, and per-IP rate limiting (3/hour)
- Hidden unless all four contact env vars are set (see Deployment)

### Tools
Three sub-tabs at `/tools/`:
- **Extensions** — the Pokémon Showdown browser extensions (VGC Replay Analyzer, VGC Practice Extension)
- **Draft Scout** (`/tools/draft/`) — scout a draft-league opponent's whole roster at once instead of checking Pokémon one at a time. Two rosters (yours and theirs), and two questions answered across all of them
  - **Move coverage:** who has Fake Out, priority, speed control, screens, redirection, hazards…? Curated preset groups plus free-text search over every move and ability. Results are a **list, not a matrix** — only matches are printed, with everything that matched nothing collapsed onto one line at the end. A twelve-ability preset against ten Pokémon is a 120-cell grid that is almost entirely blank; the same query as a list is usually two or three lines. Groupable by move ("who has Fake Out") or by Pokémon ("what does this bring"), with the old grid still available via `?view=grid`. The Priority group is *derived* from `moves.json` (`priority > 0`) rather than hand-listed, so it cannot fall behind a new generation; moves whose priority is conditional (Grassy Glide) are folded back in explicitly, since the static field reads 0 for them
  - **Usage overlay:** each hit shows how often that Pokémon *actually runs* the move on the selected ladder, not just whether it can learn it — Garchomp, Landorus-T and Rillaboom all learn Earthquake, but at 95%/73%/3% those are three different facts. A Pokémon with no usage row reads as unknown, never as 0%
  - **Speed investment:** for each of your Pokémon, every Speed EV amount that actually raises the stat and which opposing benchmarks it newly beats — plus where investment *stops paying*, so you can put the rest into bulk instead of buying nothing. Speed ties are reported as ties, never rounded up into wins. The Trick Room direction (max EVs while staying slower) is reported alongside
  - **"What it takes to outspeed":** nature is an *output*, not an input. For every Pokémon on their side, the grid reports the least investment that gets past it under a neutral nature and under a +Speed nature separately — whether that nature slot is affordable depends on what else it is doing for damage, which is the player's call. Optional modifiers (Choice Scarf, Tailwind, +1/+2, −1/−2, paralysis) can be switched on **for either side** to have those lines costed too — the drops cover Icy Wind, Electroweb, Sticky Web and Cotton Spore, and are as useful on their side (what your Icy Wind buys) as on yours (what surviving one costs). The four stage changes are mutually exclusive, since they all name one stat stage. The held-item rule applies to *both* sides: their Mega Gengar cannot be given a Choice Scarf either, and assuming one there is the more dangerous error — it invents a threat that cannot exist and would have you over-invest to beat it. A stat drop is not an item, so those still apply to a Mega. Each configuration also gets a one-line **"run N EVs"** summary — the least investment that beats everything that configuration can beat, which is the number that actually goes on the spread ("Scarf Gallade, +Speed: run 172 EVs → 201 Speed, clears the roster, 80 EVs spare"). Within a nature the recommendation ranks by what an option costs to *arrange* — self-contained first (a Scarf is a set slot; Tailwind needs an ally's turn and expires), so Scarf-at-44-EVs beats Tailwind-at-0
  - **Megas are costed as two rows**, the Mega and its pre-Mega forme, because Mega Evolution happens mid-battle and the slower turn is real. Held-item modifiers are excluded from **every** column of a Mega's card, the pre-Mega row included: drafting a Mega spends the item slot on its stone for the whole set, so the base forme is already holding it on turn one. "Mega Gengar + Choice Scarf" is an impossible set at any point in the turn, not just after evolving. Wanting a Scarf on the base forme is a different draft pick and is available as one — adding plain Gengar yields a single base row with every item option open, which is also where the real trade-off shows up: Scarf Gengar (110 base × 1.5 = 214) outruns Mega Gengar (130 base, no item, 193)
  - Opponent Speed is shown at three benchmarks (uninvested / max neutral / max +nature) because their real spread is unknown; a Showdown paste pins it where you do know it
  - Rosters accept typed names, bulk lists, or a full Showdown export, and live in the URL so a scouting link can be shared
  - **Name tolerance:** draft documents never agree on forme names, so resolution is form-aware rather than purely fuzzy — a qualifier may sit before or after the base name and be spelled either way (`Hisuian Zoroark` / `Zoroark-Hisui` / `Zoroark Hisuian` / `Zoroark-Hisuian` / `H-Zoroark`), Mega orderings all work (`Mega Charizard X` / `Charizard-Mega-X` / `M-Charizard X`), qualifier order is permuted (`Tauros-Paldea-Aqua` / `Tauros Aqua Paldean`), and spoken-only words are dropped (`Shadow Rider Calyrex`, `Zacian Crowned Sword`). Form matching runs *before* fuzzy matching on purpose: fuzzy matching will happily call "Hisuian Zoroark" a good-enough match for plain Zoroark, and silently swapping a forme for its base is worse than admitting ignorance. A trailing `(F)` is treated as a forme where gender is one (Indeedee, Meowstic, Basculegion, Oinkologne — Indeedee-F gets Follow Me and Indeedee-M does not) and as cosmetic everywhere else
  - **Megas** are included with their own stats, typing and ability, movepool inherited from the base forme (marked †). Showdown flags them `isNonstandard: Past` since SV has no Mega Evolution, but draft leagues draft them and the site's default format is a Champions regulation where they are legal via held stones
  - **The roster follows the selected format**, because the three rule sets disagree about which Pokémon exist at all. Runerigus and Mr. Rime are absent from Scarlet/Violet but present in both National Dex and Champions; Rillaboom and Flutter Mane are in the first two and not in Champions. `draft_tools.dex_for_format()` maps a format code to one of `gen9` (983 species) / `natdex` (1377) / `champions` (315, including 77 Megas), and the species picker reloads from `/tools/api/draft/species` when the format implies a different one
  - **Champions is a different stat system, not just a different roster.** It spends 66 stat points (max 32 per stat, step 1, no IVs) through `floor((base + points + 20) * nature)` rather than 508 EVs through the cartridge formula, so its Speed panel is measured in SP with a 0–32 axis. `draft_tools.speed_stat(..., system="champions")` is checked against `app.py`'s own `calculate_champions_stat_value()` so the two cannot drift. The +75 HP / +20 elsewhere in `champions_index_static.json` are the **in-game display stats, not base stats** — feeding them to the formula would apply the bonus twice, so base stats are recovered by removing the bonus. That also picks up the documented Floette override for free (Champions battles it as Floette-Eternal, 92 Speed rather than 52) instead of duplicating the table
  - Deliberately **not** a team builder: it reports data and leaves the decisions to the player
- **Spread Solver** (`/tools/spread-solver/`) — reverse-engineers EV spreads from what a battle showed. Enter two or more teams (Open Team Sheets are the point: species, item, ability, Tera and nature but no EVs), log every damage roll and speed order, and it keeps only the spreads that could have produced all of them
  - Damage rolls are calculated **in the browser** with the same bundled @smogon/calc the site's calculator uses; the server only supplies base stats and priors
  - Interactions carry the context that moves a calc: crits, spread vs. single-target hits, Helping Hand, screens, Friend Guard, Tera, weather/terrain, stat stages, item/ability/status overrides, multi-hit and base-power overrides. Hits on your own ally (a spread Earthquake) are logged the same way
  - Damage can be entered as HP % (with a tolerance, since Showdown rounds), exact HP numbers (which pin max HP outright), or a % range; a KO is matched as "at least the remaining HP"
  - Speed order constrains Speed EVs, with Tailwind, paralysis, stat stages, Choice Scarf / Booster Energy / weather abilities, Trick Room, and speed ties
  - **Scoring:** each candidate spread is scored by *fit* — the probability its damage rolls produce every number logged, so a spread needing the maximum roll four times running is discounted — times a *prior* built from ladder spread usage, published EV spreads (VGCPastes teams that reported EVs), and a penalty for EVs that buy no stat point. The prior is flattened (`p^0.5`) before it competes: raw ladder odds are far too confident to weigh against a damage roll, and the teams this tool is pointed at are exactly the ones that deviate from the ladder
  - **Reading error is modelled.** A percentage read off an HP bar is not exact, so the tolerance is one standard deviation of a Gaussian rather than a hard window; rolls only stop counting past 3σ, where a genuine contradiction begins. A hard box makes the likelihood badly overconfident — a roll 0.99% out counts fully and one 1.01% out counts as impossible — and across a top-cut's worth of interactions those cliffs compound until they overrule a prior that is right. Exact HP, explicit ranges and KOs stay hard, because those are assertions rather than reads
  - Where both sides of an interaction are unknown they resolve each other: one marginal pass, then a **joint refinement** that pins every Pokémon to one concrete spread and re-picks each against the others as they actually stand. A spread that satisfies every logged interaction always outranks one that does not, whatever usage says. (A *second* marginal pass looks like it should help and measurably does not — it re-estimates from point guesses and the errors compound. The joint pass does the same job against concrete spreads and converges instead of drifting.)
  - Candidates are enumerated in ascending EV order so the budget check can break rather than skip, which makes a large search space cheap to walk; anything more than 16 log-units below the best fit is discarded unstored, since it carries ~1e-7 of the leader's posterior weight. Both exist to avoid trimming, which measurement showed was the single biggest source of wrong answers
  - When the search space has to be trimmed, it is trimmed on **evidence only, never on the prior** — a value the rolls rule out is genuinely gone, but a value that is merely uncommon has to survive to be ranked, or the search quietly deletes exactly the unusual spreads the tool exists to find
  - **Consistency check:** after solving, every interaction is re-run against the final spreads and reported. Anything the answer cannot reproduce is flagged as unexplained rather than buried — the headline, the per-Pokémon evidence table and the exported paste all read from that same joint answer, so they cannot disagree with each other
  - **Team output:** a complete, legal set for every Pokémon — solved where the rolls settled it, given where you pinned it, inferred everywhere else — as a table and a ready-to-paste Showdown export. EVs are filled by a knapsack over the remaining budget, so a set is always legal and always spends the full 508 (or 66 stat points). Pokémon with no usage data at all are inferred from nature, moves, item and base stats
  - Cases are stored in the browser only (localStorage), with JSON export/import

### Other
- Pokémon merchandise listings via eBay affiliate integration
- Shared page chrome (nav tabs, theme/language pickers, meta tags) in `base.html` + `_tabs.html`, extended by every page template

## Tech Stack
- **Backend:** Python 3 · Flask · Flask-Babel (i18n) · Pillow (OG stat cards)
- **Templating:** Jinja2 (`base.html` + `_tabs.html` shared chrome)
- **Frontend:** HTML/CSS/JavaScript · jQuery 3.7.1 · `theme-boot.js` theme engine · shared `style.css`
- **Charts:** Chart.js (EV distribution bar chart, usage trend line chart)
- **Damage Calc:** @smogon/calc 0.11.0 (bundled with esbuild)
- **Process management:** Gunicorn (Procfile; worker recycled via `--max-requests` to cap memory growth)
- **Data:** Per-Pokémon JSON files in `stats/`, trend data in `stats/trends/`, tournament data in `stats/tournaments/`, Limitless API cache in `cache/limitless/`, VGCPastes sheet cache in `cache/vgcpastes/`, replay-data cache in `cache/replays/`
- **Automation:** GitHub Actions (scheduled replay-stats updates published to the `replay-data` branch)

## Data Files
- **Per-Pokémon stats:** `stats/{YYYY-MM}/{format}/{rating}/{Pokemon}.json`
- **Index files:** `stats/{YYYY-MM}/{format}/{rating}/_index.json` (Pokémon list + usage + raw count)
- **Trend data:** `stats/trends/{format}/{rating}.json` (12 months of usage % per Pokémon)
- **Tournament data:** `stats/tournaments/{tournament_id}/` (metadata, players, aggregated stats)
- **Limitless cache:** `cache/limitless/` (formats, tournament list, per-tournament standings) — fetched lazily at runtime, safe to delete
- **VGCPastes cache:** `cache/vgcpastes/` (sheet tabs as CSV, fetched Pokepaste texts) — fetched lazily at runtime, safe to delete
- **Replay-data cache:** `cache/replays/` (replay JSONs pulled from the `replay-data` branch, with `.etag` sidecars) — fetched lazily at runtime, safe to delete
- **EV corpus cache:** `cache/ev_corpus/` (per-species EV spreads parsed out of VGCPastes pokepastes for the Spread Solver, 12h TTL) — fetched lazily at runtime, safe to delete
- **Translations:** `translations/es/LC_MESSAGES/messages.po` (+ compiled `.mo`, committed), `messages.pot` template, `babel.cfg`
- **Metadata:** `stats/pokedex.json`, `stats/moves.json`, `stats/items.json`, `stats/abilities.json`, `stats/forms_index.json`, `stats/meta_names.json`
- **Learnsets:** `stats/learnsets_gen9.json` (SV dex, Gen 9 sources only — 983 Pokémon, ~610KB) and `stats/learnsets_natdex.json` (National Dex: every species, moves from any generation, each labelled with the newest generation it came from — 1377 Pokémon, ~1.3MB). Champions uses its own movepools from `champions_index_static.json`, plus 77 Megas grafted on: that index is built from the Champions mod's learnsets, where Mega Evolution is a held stone rather than a species, so it lists only base formes — a Mega is added when its base forme is on the roster, taking the base's movepool and the Mega's own stats, typing and ability (this picks up the Champions-only Megas such as Mega Raichu and Mega Victreebel too). Without them "Mega Charizard Y" resolved to plain Charizard, which is the silently-wrong-forme failure the resolver exists to avoid. Two files rather than one with per-move generation tags: a draft is played under one rule set at a time, so the useful thing is an index that is internally consistent and can be named in the UI. Built by `buildLearnsets()` from Showdown's `learnsets.json`, keeping only sources tagged for this gen so transfer-only moves cannot leak in. Move ids are interned into a shared list and referenced by index. Two inheritance rules apply: evolutions keep their pre-evolutions' moves (Incineroar's Fake Out is an egg move on Litten — its own entry is a Gen 7 event and is correctly dropped), and a forme with no Gen 9 movepool of its own falls back to its base forme (every Therian forme has an entry carrying only pre-Gen-9 sources). The fallback does not *merge*, which is what keeps Wicked Blow and Surging Strikes on separate Urshifu formes — and it takes the base's **fully resolved** pool, not just its own entry, or a Mega would silently lose the moves its base inherits from pre-evolutions. Megas and Primals are kept despite their `Past` flag (see Draft Scout); `inheritsMovepool` lists the formes whose pool came from another forme
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
- `GET /insights/` → meta insight reports (also `/insights/<format_id>/`; `?min=` size tier, `?rating=` ladder cutoff, `?cores=` core size 2–6, `?sort=` core sort wr/usage/lift, `?cut=` top-cut size 8/16/32)
- `GET /replays/` → replay search (also `/replays/<format_code>/`)
- `GET /replays/watch/<replay_id>` → replay viewer
- `GET /tools/` → tools page (Extensions sub-tab)
- `GET /tools/spread-solver/` → Spread Solver (also `/tools/spread-solver/<format_code>/`)
- `GET /tools/draft/` → Draft Scout (also `/tools/draft/<format_code>/`; rosters and query carried in `?mine=`/`?theirs=`/`?moves=`/`?presets=`/`?abilities=`)
- `GET /about/` → about page
- `GET|POST /contact/` → contact form (hidden unless contact env vars are set)
- `GET /robots.txt` → robots file
- All pages accept `?lang=en|es` to switch language (also persisted via a `lang` cookie)

### API
- `POST /search_pokemon` → fuzzy search redirect
- `GET /api/<format_code>/<rating>/<pokemon_name>` → Pokémon data JSON
- `GET /api/<format_code>/<rating>/` → format index JSON
- `GET /api/<format_code>/<rating>/calc/<pokemon_name>` → calc data JSON
- `GET /api/moves/search` → move autocomplete
- `GET /api/tools/spread-context/<format_code>/<rating>/<pokemon_name>` → Spread Solver priors for one species: base stats, the format's EV rules, ladder spread usage, and published EV spreads scraped from VGCPastes pokepastes (`?community=0` skips the paste corpus, the only slow half)
- `GET /tools/api/draft/scout` → Draft Scout coverage + Speed plans + outspeed-requirement grid for two rosters (`?mine=`, `?theirs=`, `?moves=`, `?presets=`, `?abilities=`, `?fmt=`, `?rating=`, `?my_mods=`, `?their_mods=`). `my_mods`/`their_mods` name modifiers to *enumerate* (scarf, tailwind, boost1, boost2, para), not to assume — each adds a costed column rather than changing one answer
- `GET /tools/api/draft/resolve` → resolve pasted roster text (list or Showdown export) to species, without loading usage (`?dex=`)
- `GET /tools/api/draft/lookup` → move + ability autocomplete for the Draft Scout query box
- `GET /tools/api/draft/species?dex=gen9|natdex|champions` → the species one rule set allows (served rather than embedded; the three together are ~2600 entries)
- `GET /api/pokemon-teams/<format_code>/<pokemon_name>` → top tournament teams using Pokémon
- `GET /api/pokemon-replays/<format_code>/<pokemon_name>` → related replay links
- `GET /api/merch/<pokemon_name>` → eBay merchandise listings
- `GET /tournaments/api/<tournament_id>/<day_filter>/` → tournament data JSON
- `GET /tournaments/api/<tournament_id>/teams/<pokemon_name>` → teams using Pokémon
- `GET /tournaments/api/<tournament_id>/standings` → player standings
- `GET /tournaments/api/<tournament_id>/results/` → official-event team archetypes (`?day=` filter, `?q=` comma-group search)
- `GET /limitless/api/<format_id>/<segment>/` → Limitless usage stats JSON (also `/<pokemon_name>`; `?cut=` placement filter)
- `GET /limitless/api/<format_id>/teams/<pokemon_name>` → best teams using Pokémon (`?min=` tournament size, `?cut=` placement)
- `GET /limitless/api/<format_id>/results/` → team archetypes (`?q=` slot-scoped comma-group search, `?min=` size, `?cut=` placement)
- `GET /limitless/api/event/<tournament_id>/` → single-event usage stats JSON (also `/<pokemon_name>`; `?cut=`)
- `GET /limitless/api/event/<tournament_id>/teams/<pokemon_name>` → one event's teams using Pokémon (`?cut=`)
- `GET /limitless/api/event/<tournament_id>/standings` → one event's standings (`?cut=`)
- `GET /limitless/api/event/<tournament_id>/results/` → one event's team archetypes (`?q=`, `?cut=`)
- `GET /teams/api/<repo_id>/` → VGCPastes team search (`?q=` comma-group search, `?evs=`/`?code=`/`?report=` filters, `?sort=newest|oldest|random`, `?mode=any`, paged via `offset`/`limit`)
- `GET /teams/api/<repo_id>/paste/<team_id>` → raw Showdown text of a team's Pokepaste
- `GET /replays/api/search` → replay search with filters
- `GET /replays/api/default` → default replay listing
- `GET /replays/api/rankings` → team usage rankings

### OG Stat Cards (link-preview PNGs)
- `GET /og-card/<format_code>/<rating_threshold>/<pokemon_name>.png` → ladder stats card
- `GET /og-card/tournaments/<tournament_id>/<day_filter>/<pokemon_name>.png` → official-event card
- `GET /og-card/limitless/<format_id>/<segment>/<pokemon_name>.png` → Limitless rolling-window card
- `GET /og-card/limitless-event/<event_id>/<pokemon_name>.png` → single Limitless event card
- `GET /og-card/champions/<fmt>/<pokemon_name>.png` → Champions card

## Project Structure
```
static/
  tools_2.3.js                Main frontend logic
  damage_calc.js              Damage calculator UI
  replay_search.js            Replay search/filtering
  tournament_stats.js         Tournament page logic
  spread_solver.js            Spread Solver (EV reverse-engineering, runs client-side)
  draft_scout.js              Draft Scout (two rosters, coverage matrix, EV strips)
  theme-boot.js               Theme engine (preset registry, pre-paint apply, picker menu)
  style.css                   Shared site styles + per-theme token blocks
  robots.txt
  vendor/smogon-calc.js       Bundled Smogon damage calculator
  pokemonicons-sheet.png, itemicons-sheet.png, favicon.ico
templates/
  base.html                   Shared page chrome (head, meta/OG tags, theme + lang boot)
  _tabs.html                  Nav tabs partial with language and theme pickers
  _tools_subtabs.html         Sub-tab bar shared by the /tools/ pages
  index.html                  Main stats page
  tournaments.html            Tournament stats page
  teams.html                  VGCPastes team search page
  insights.html               Meta insights page
  replays.html                Replay search page
  watch.html                  Replay viewer
  contact.html                Contact form
  tools_solver.html           Spread Solver page
  tools_draft.html            Draft Scout page
  tools.html, about.html, 404.html, 500.html
stats/
  {YYYY-MM}/                  Per-Pokémon split stats by month/format/rating
  trends/                     Pre-computed 12-month usage trend data
  tournaments/                Tournament data (RK9.gg)
  replays/                    Replay data (bundled snapshot; fresh copies pulled from replay-data branch)
  pokedex.json, moves.json, items.json, abilities.json, etc.
translations/
  es/LC_MESSAGES/             Spanish catalog (messages.po + compiled messages.mo)
.github/workflows/
  update-replay-stats.yml     Scheduled replay-stats update (GitHub Actions)
app.py                        Flask application
limitless_stats.py            Limitless API client + online tournament usage aggregation
insights.py                   Meta insight report builders (pure functions over loaded data)
draft_tools.py                Draft Scout engine: movepool queries, preset groups, Speed maths
vgcpastes.py                  VGCPastes sheet client + team search
og_card.py                    Open Graph stat card renderer (Pillow, Flask-free)
update_all_data.py            Data pipeline (downloads, splits, generates trends)
scrape_tournaments.py         Tournament data scraper (RK9.gg)
babel.cfg                     pybabel extraction config
messages.pot                  Translation template
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
1. Download latest Pokémon data (pokedex, moves, items, abilities, sprites) and build the Gen 9 learnset index
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
`.github/workflows/update-replay-stats.yml` runs the replay scraper on a schedule (4×/day) via GitHub Actions: it scrapes new Showdown replays, rebuilds the searcher/team-ranking JSONs, and publishes them to this repo's **`replay-data` branch** — not `main`, so no Heroku redeploy is triggered. They are stored gzipped (`.json.gz`): the busiest formats exceed GitHub's 100MB file limit uncompressed, and gzip runs them roughly 7× smaller. The app fetches them from `raw.githubusercontent.com` on demand, decompresses them into `cache/replays/`, and revalidates at most every 30 minutes using ETags (unchanged checks are cheap 304s); it falls back to a stale cached copy, then to the snapshot bundled in the deploy at `stats/replays/`. Set `REPLAY_DATA_URL=""` to skip remote fetching and serve the local `stats/replays/` copies directly (dev).

The raw replay cache is carried between workflow runs via `actions/cache`, seeded from a release asset on the private scraper repo. Requires one repository secret, `SCRAPER_TOKEN` (fine-grained PAT with Contents:Read on the scraper repo); until it is set, runs are silent no-ops. It can also be triggered manually via `workflow_dispatch`.

### Translations (i18n)
UI strings are wrapped with Flask-Babel; the Spanish catalog lives in `translations/es/LC_MESSAGES/`. To update after adding or changing strings:
```bash
pybabel extract -F babel.cfg -o messages.pot .
pybabel update -i messages.pot -d translations
# ...edit translations/es/LC_MESSAGES/messages.po...
pybabel compile -d translations
```
Commit the compiled `.mo` — it is what gets deployed (no compile step on the server). Literal `%` in a translated string must be escaped as `%%`. Pokémon, move, item, and ability names are deliberately left untranslated.

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

# Prod-like (mirrors Procfile: single worker + threads to fit Heroku's 512MB dyno;
# --max-requests recycles the worker periodically to cap memory growth)
gunicorn app:app --workers 1 --threads 8 --max-requests 6000 --max-requests-jitter 600 --bind 127.0.0.1:8000
```

## Deployment
- **Heroku / Render / Fly.io:** use `Procfile` (single gunicorn worker with 8 threads and periodic worker recycling, tuned for a 512MB dyno).
- Ensure the `/stats` directory is populated at build/deploy time.
- Set `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET` environment variables for merch integration.
- Optionally set `LIMITLESS_API_KEY` for the Limitless API (works keyless by default).
- Contact form (all four required, otherwise the form is hidden): `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `CONTACT_EMAIL_ADDRESS`, `CONTACT_EMAIL_APP_PASSWORD` (Gmail address + app password; used as both SMTP login and recipient).
- Optionally set `REPLAY_DATA_URL` to override where replay JSONs are fetched from (defaults to this repo's `replay-data` branch on `raw.githubusercontent.com`; empty string = serve bundled local copies).

## Contributing
Issues and PRs welcome — especially for new formats, better UX, or data visualizations.
