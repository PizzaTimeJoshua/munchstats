"""
Scrape VGC tournament data from RK9.gg and save locally.

Usage:
    python scrape_tournaments.py                          # Scrape all past VGC tournaments
    python scrape_tournaments.py <tournament_id> ...      # Scrape specific tournament(s)
    python scrape_tournaments.py --topcut 8 --day2 64     # Override day cutoffs

Data is saved to stats/tournaments/{tournament_id}/ with:
    metadata.json    - Tournament info (name, date, type, etc.)
    players.json     - Player standings + team lists
    aggregated.json  - Pre-computed usage stats per filter level
"""

import argparse
import difflib
import json
import os
import re
import sys
import time
from datetime import datetime

import requests
from bs4 import BeautifulSoup

TOURNAMENT_DATA_DIR = os.path.join("stats", "tournaments")
RK9_BASE = "https://rk9.gg"
REQUEST_DELAY = 1.5

# Load local data for name normalization
STATS_DIR = "stats"


def load_json(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def load_name_lookups():
    """Load pokedex and forms index for name normalization."""
    pokedex = load_json(os.path.join(STATS_DIR, "pokedex.json"))
    forms_index = load_json(os.path.join(STATS_DIR, "forms_index.json"))
    moves = load_json(os.path.join(STATS_DIR, "moves.json"))

    # Build display name -> internal key mappings
    pokemon_display_to_key = {}
    for key, entry in pokedex.items():
        name = entry.get("name", key)
        pokemon_display_to_key[name.lower()] = name
        pokemon_display_to_key[key.lower()] = name

    # Also add forms index keys
    for key in forms_index:
        if key.lower() not in pokemon_display_to_key:
            # Try to find in pokedex
            if key in pokedex:
                pokemon_display_to_key[key.lower()] = pokedex[key].get("name", key)

    move_display_to_key = {}
    for key, entry in moves.items():
        name = entry.get("name", key)
        move_display_to_key[name.lower()] = name

    return pokemon_display_to_key, move_display_to_key, moves


def normalize_pokemon_name(raw_name, pokemon_lookup):
    """Normalize a Pokemon name from RK9 to match our local data."""
    if not raw_name:
        return raw_name

    # Clean up the name
    name = raw_name.strip()

    # Handle RK9-specific form names
    # e.g., "Urshifu [Rapid Strike Style]" -> try various formats
    form_patterns = [
        # Calyrex riders
        (r"\s*\[Ice Rider\]", "-Ice"),
        (r"\s*\[Shadow Rider\]", "-Shadow"),
        # Urshifu - Single Strike is the default form on Showdown
        (r"\s*\[Single Strike Style\]", ""),
        (r"\s*\[Rapid Strike Style\]", "-Rapid-Strike"),
        # Landorus/Tornadus/Thundurus/Enamorus formes
        (r"\s*\[Incarnate Forme?\]", ""),
        (r"\s*\[Therian Forme?\]", "-Therian"),
        # Giratina/Dialga/Palkia formes
        (r"\s*\[Origin Forme?\]", "-Origin"),
        (r"\s*\[Altered Forme?\]", ""),
        # Shaymin
        (r"\s*\[Sky Forme?\]", "-Sky"),
        (r"\s*\[Land Forme?\]", ""),
        # Rotom forms
        (r"\s*\[Heat Rotom\]", "-Heat"),
        (r"\s*\[Wash Rotom\]", "-Wash"),
        (r"\s*\[Frost Rotom\]", "-Frost"),
        (r"\s*\[Fan Rotom\]", "-Fan"),
        (r"\s*\[Mow Rotom\]", "-Mow"),
        # Aegislash
        (r"\s*\[Blade Forme?\]", "-Blade"),
        (r"\s*\[Shield Forme?\]", "-Shield"),
        # Ogerpon masks
        (r"\s*\[Hearthflame Mask\]", "-Hearthflame"),
        (r"\s*\[Wellspring Mask\]", "-Wellspring"),
        (r"\s*\[Cornerstone Mask\]", "-Cornerstone"),
        (r"\s*\[Teal Mask\]", ""),
        # Basculegion
        (r"\s*\[Male\]", ""),
        (r"\s*\[Female\]", "-F"),
        # Tatsugiri - Curly is the default form on Showdown
        (r"\s*\[Curly Form\]", ""),
        (r"\s*\[Droopy Form\]", "-Droopy"),
        (r"\s*\[Stretchy Form\]", "-Stretchy"),
        # Regional forms (Alolan, Galarian, Hisuian, Paldean)
        (r"\s*\[Alolan Form\]", "-Alola"),
        (r"\s*\[Galarian Form\]", "-Galar"),
        (r"\s*\[Hisuian Form\]", "-Hisui"),
        (r"\s*\[Paldean Form\]", "-Paldea"),
        # Ursaluna
        (r"\s*\[Blood ?Moon\]", "-Bloodmoon"),
        # Tauros Paldean breeds
        (r"\s*\[Combat Breed\]", "-Paldea-Combat"),
        (r"\s*\[Blaze Breed\]", "-Paldea-Blaze"),
        (r"\s*\[Aqua Breed\]", "-Paldea-Aqua"),
        # Oricorio styles - Baile is default
        (r"\s*\[Pom-Pom Style\]", "-Pom-Pom"),
        (r"\s*\[Pa'u Style\]", "-Pa'u"),
        (r"\s*\[Sensu Style\]", "-Sensu"),
        (r"\s*\[Baile Style\]", ""),
        # Toxtricity - Amped is default
        (r"\s*\[Amped Form\]", ""),
        (r"\s*\[Low Key Form\]", "-Low-Key"),
        # Lycanroc - Midday is default
        (r"\s*\[Midday Form\]", ""),
        (r"\s*\[Midnight Form\]", "-Midnight"),
        (r"\s*\[Dusk Form\]", "-Dusk"),
        # Necrozma
        (r"\s*\[Dusk Mane\]", "-Dusk-Mane"),
        (r"\s*\[Dawn Wings\]", "-Dawn-Wings"),
        (r"\s*\[Ultra\]", "-Ultra"),
        # Kyurem
        (r"\s*\[Black Kyurem\]", "-Black"),
        (r"\s*\[White Kyurem\]", "-White"),
        # Zacian/Zamazenta
        (r"\s*\[Crowned Sword\]", "-Crowned"),
        (r"\s*\[Crowned Shield\]", "-Crowned"),
        (r"\s*\[Hero of Many Battles\]", ""),
        # Zygarde
        (r"\s*\[10% Forme?\]", "-10%"),
        (r"\s*\[50% Forme?\]", ""),
        (r"\s*\[Complete Forme?\]", "-Complete"),
        # Hoopa
        (r"\s*\[Hoopa Confined\]", ""),
        (r"\s*\[Hoopa Unbound\]", "-Unbound"),
        (r"\s*\[Unbound\]", "-Unbound"),
        (r"\s*\[Confined\]", ""),
        # Deoxys
        (r"\s*\[Attack Forme?\]", "-Attack"),
        (r"\s*\[Defense Forme?\]", "-Defense"),
        (r"\s*\[Speed Forme?\]", "-Speed"),
        (r"\s*\[Normal Forme?\]", ""),
        # Indeedee/Meowstic (Male/Female already handled under Basculegion)
        # Wormadam
        (r"\s*\[Plant Cloak\]", ""),
        (r"\s*\[Sandy Cloak\]", "-Sandy"),
        (r"\s*\[Trash Cloak\]", "-Trash"),
        # Maushold - Family of Four is default on Showdown
        (r"\s*\[Family of Four\]", ""),
        (r"\s*\[Family of Three\]", "-Three"),
        # Sinistcha/Polteageist
        (r"\s*\[Unremarkable Form\]", ""),
        (r"\s*\[Masterpiece Form\]", ""),
        (r"\s*\[Counterfeit\]", ""),
        (r"\s*\[Antique\]", ""),
        # Catch-all: strip unknown form brackets (default form)
        (r"\s*\[.*?\]", ""),
    ]

    for pattern, replacement in form_patterns:
        if re.search(pattern, name):
            if pattern == r"\s*\[.*?\]":
                bracket_match = re.search(r"\[.*?\]", name)
                if bracket_match:
                    print(f"  WARNING: Unknown form bracket stripped: {raw_name} -> check if this needs a specific pattern")
            name = re.sub(pattern, replacement, name)
            break

    # Try exact match first
    if name.lower() in pokemon_lookup:
        return pokemon_lookup[name.lower()]

    # Try without special characters
    clean = re.sub(r"[^a-z0-9]", "", name.lower())
    if clean in pokemon_lookup:
        return pokemon_lookup[clean]

    # Try with common transformations
    for suffix in ["-f", "-m", ""]:
        test = clean + suffix
        if test in pokemon_lookup:
            return pokemon_lookup[test]

    # Fallback: return as-is (title cased)
    return name.strip()


def classify_tournament_type(name):
    """Determine tournament type from its name."""
    lower = name.lower()
    if "world" in lower:
        return "Worlds"
    if "international" in lower:
        return "International"
    if "special" in lower:
        return "Special"
    return "Regional"


def _parse_round_data(rnd_soup):
    """Parse player names, records, and win/loss results from a round's htmx HTML.

    Returns (match_count, player_data) where player_data is a dict of:
        normalized_name -> {"name": raw_name, "wins": W, "losses": L}
    The record includes the result of this round (winner gets +1 win, loser +1 loss).
    """
    rows = rnd_soup.find_all("div", class_="row")
    match_rows = [m for m in rows if m.find("div", class_="player1")]

    player_data = {}
    for row in match_rows:
        for cell in row.find_all("div", class_=re.compile(r"player[12]")):
            name_span = cell.find("span", class_="name")
            if not name_span:
                continue
            raw_name = name_span.get_text(strip=True)
            clean_name = re.sub(r"\s*\[.*?\]\s*$", "", raw_name).strip()
            if not clean_name:
                continue

            # Base record (before this round's result)
            cell_text = cell.get_text()
            rec_match = re.search(r"\((\d+)-(\d+)-(\d+)\)", cell_text)
            wins = int(rec_match.group(1)) if rec_match else 0
            losses = int(rec_match.group(2)) if rec_match else 0

            # Apply this round's result based on CSS classes
            classes = cell.get("class", [])
            if "winner" in classes:
                wins += 1
            elif row.get("class") and "complete" in row.get("class", []):
                # Match is complete and this player isn't the winner
                if "tie" in row.get("class", []):
                    pass  # tie - don't add win or loss
                else:
                    losses += 1

            player_data[normalize_player_name(clean_name)] = {
                "name": clean_name,
                "wins": wins,
                "losses": losses,
            }

    return len(match_rows), player_data


def scrape_pairings_data(session, tournament_id):
    """Scrape all rounds from pairings to determine Day 2 players and final records.

    Iterates through every round via htmx endpoints. For each round:
    - Counts matches (to detect the Day 2 boundary via >50% drop)
    - Tracks each player's record (last seen record is their final record)

    Returns (day2_names, all_player_records) where:
        day2_names: set of normalized player names who appeared in Day 2+ rounds
        all_player_records: dict of normalized_name -> {"name", "wins", "losses"}
    """
    # 1. Get pairings page to find total rounds for Masters (pod 2)
    url = f"{RK9_BASE}/pairings/{tournament_id}"
    resp = session.get(url, timeout=30)
    if resp.status_code != 200:
        return None, {}

    soup = BeautifulSoup(resp.text, "html.parser")
    round_tabs = soup.find_all("a", id=re.compile(r"^P2R\d+-tab$"))
    if not round_tabs:
        return None, {}

    total_rounds = len(round_tabs)
    if total_rounds < 2:
        return None, {}

    # 2. Iterate all rounds, tracking records and match counts
    all_records = {}          # normalized_name -> {"name", "wins", "losses"}
    round_match_counts = {}   # round_num -> match_count
    round_players = {}        # round_num -> set of normalized player names
    day2_round = None

    for rnd in range(1, total_rounds + 1):
        time.sleep(REQUEST_DELAY)
        rnd_url = f"{RK9_BASE}/pairings/{tournament_id}?pod=2&rnd={rnd}"
        try:
            rnd_resp = session.get(rnd_url, timeout=15)
            if rnd_resp.status_code != 200:
                continue
            rnd_soup = BeautifulSoup(rnd_resp.text, "html.parser")
            match_count, player_data = _parse_round_data(rnd_soup)
            round_match_counts[rnd] = match_count
            round_players[rnd] = set(player_data.keys())
            print(f"      Round {rnd}: {match_count} matches, {len(player_data)} players")

            # Update running records (last seen = final record)
            all_records.update(player_data)
        except Exception as e:
            print(f"      Round {rnd}: ERROR {e}")
            continue

        # Detect Day 2 boundary
        if day2_round is None and rnd >= 3:
            prev = round_match_counts.get(rnd - 1, 0)
            curr = match_count
            if prev > 0 and curr < prev * 0.6:
                day2_round = rnd
                print(f"      Day 2 detected at Round {rnd} ({prev} -> {curr} matches)")

    # 3. Collect Day 2 player names (everyone who appeared in day2_round or later)
    if day2_round is None:
        print("      No Day 2 boundary detected")
        return None, all_records

    day2_names = set()
    for rnd in range(day2_round, total_rounds + 1):
        if rnd in round_players:
            day2_names.update(round_players[rnd])

    print(f"      Day 2 players: {len(day2_names)}, Total tracked: {len(all_records)}")
    return day2_names, all_records


def normalize_player_name(name):
    """Normalize a player name for matching (lowercase, no spaces/punctuation)."""
    return re.sub(r"[^a-z0-9]", "", name.lower())


def build_player_match_map(roster_players, pairings_records):
    """Build a mapping from roster player names to pairings record keys using fuzzy matching.

    Returns dict: roster_player_name -> pairings_record_key
    """
    # First pass: exact normalized match
    pairings_keys = list(pairings_records.keys())
    pairings_norm = {k: k for k in pairings_keys}  # normalized -> key (already normalized)

    match_map = {}
    unmatched_roster = []

    for player in roster_players:
        pnorm = normalize_player_name(player["name"])
        if pnorm in pairings_norm:
            match_map[player["name"]] = pnorm
        else:
            unmatched_roster.append(player)

    # Second pass: fuzzy match remaining
    if unmatched_roster:
        remaining_pairings = [k for k in pairings_keys if k not in match_map.values()]
        for player in unmatched_roster:
            pnorm = normalize_player_name(player["name"])
            matches = difflib.get_close_matches(pnorm, remaining_pairings, n=1, cutoff=0.6)
            if matches:
                match_map[player["name"]] = matches[0]
                remaining_pairings.remove(matches[0])

    return match_map


def classify_players_day(players, day2_names, match_map):
    """Classify players using actual Day 2 roster from pairings data.

    day2_names is a set of normalized names from the pairings page.
    match_map maps roster player names to pairings record keys.
    Players in top 8/16 by placement are classified accordingly.
    Players whose name matches a day2_name are classified as day2.
    Everyone else is day1.
    """
    for player in players:
        placement = player["placement"]
        if placement <= 8:
            player["day_reached"] = "top8"
        elif placement <= 16:
            player["day_reached"] = "top16"
        else:
            pairings_key = match_map.get(player["name"])
            if pairings_key and pairings_key in day2_names:
                player["day_reached"] = "day2"
            else:
                player["day_reached"] = "day1"


def classify_players_day_fallback(players, day2_cutoff):
    """Fallback classification using placement cutoffs when pairings data unavailable."""
    for player in players:
        placement = player["placement"]
        if placement <= 8:
            player["day_reached"] = "top8"
        elif placement <= 16:
            player["day_reached"] = "top16"
        elif placement <= day2_cutoff:
            player["day_reached"] = "day2"
        else:
            player["day_reached"] = "day1"


def discover_tournaments(session):
    """Scrape the RK9 events page for VGC tournament links."""
    url = f"{RK9_BASE}/events/pokemon"
    print(f"Fetching tournament list from {url}...")
    resp = session.get(url, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    tournaments = []
    # Find all tournament links - VG tournaments contain specific IDs
    for link in soup.find_all("a", href=True):
        href = link["href"]
        if "/tournament/" in href and href.count("/") >= 2:
            tid = href.split("/tournament/")[-1].strip("/")
            if tid and len(tid) > 5:
                # Check if it's a VG tournament (typically has "02" in the ID)
                # Get the parent row context for name/date info
                tournaments.append(tid)

    # Also try to get event metadata from the tables
    event_info = {}
    for table in soup.find_all("table"):
        for row in table.find_all("tr"):
            cells = row.find_all("td")
            if len(cells) >= 3:
                # Look for date and name
                date_text = cells[0].get_text(strip=True) if cells[0] else ""
                name_text = cells[1].get_text(strip=True) if cells[1] else ""
                location_text = cells[2].get_text(strip=True) if cells[2] else ""
                # Find VG link in this row
                for a in row.find_all("a", href=True):
                    if "/tournament/" in a["href"]:
                        tid = a["href"].split("/tournament/")[-1].strip("/")
                        if tid:
                            event_info[tid] = {
                                "date_text": date_text,
                                "name": name_text,
                                "location": location_text,
                            }

    return list(set(tournaments)), event_info


def scrape_tournament_metadata(session, tournament_id, event_info=None):
    """Get basic tournament metadata."""
    url = f"{RK9_BASE}/tournament/{tournament_id}"
    print(f"  Fetching tournament page: {url}")
    resp = session.get(url, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    # Extract title from the page
    name = ""
    for h_tag in soup.find_all(["h1", "h2", "h3", "h4", "h5"]):
        text = h_tag.get_text(strip=True)
        if "championship" in text.lower() or "regional" in text.lower() or "international" in text.lower() or "world" in text.lower():
            name = text
            break

    if not name:
        title = soup.find("title")
        name = title.get_text(strip=True) if title else tournament_id

    # Clean up name
    name = re.sub(r"\s*\|\s*RK9.*$", "", name).strip()
    name = re.sub(r"\s*-\s*RK9.*$", "", name).strip()
    # Remove trailing date text that gets concatenated (e.g. "ChampionshipsMay 23-24, 2026")
    name = re.sub(r"(Championships|Championship)((?:January|February|March|April|May|June|July|August|September|October|November|December).*)", r"\1", name).strip()
    # Remove trailing "Time zone: ..." text
    name = re.sub(r"\s*Time zone:.*$", "", name).strip()

    # Try to get date from event info or page content
    date_str = ""
    location = ""
    if event_info and tournament_id in event_info:
        info = event_info[tournament_id]
        date_str = info.get("date_text", "")
        location = info.get("location", "")
        # Only use event_info name if it distinguishes TCG/VGC (has the game type)
        # Otherwise keep the more specific name from the tournament page
        if info.get("name") and ("VGC" in info["name"] or "TCG" in info["name"]):
            name = info["name"]

    # Parse date - try to extract YYYY-MM-DD
    if date_str:
        # RK9 dates might be "May 23-24, 2026" or similar
        date_match = re.search(r"(\w+ \d+).*?(\d{4})", date_str)
        if date_match:
            try:
                parsed = datetime.strptime(f"{date_match.group(1)} {date_match.group(2)}", "%B %d %Y")
                date_str = parsed.strftime("%Y-%m-%d")
            except ValueError:
                date_match2 = re.search(r"(\d{4})-(\d{2})-(\d{2})", date_str)
                if date_match2:
                    date_str = date_match2.group(0)

    tournament_type = classify_tournament_type(name)

    return {
        "id": tournament_id,
        "name": name,
        "date": date_str,
        "location": location,
        "type": tournament_type,
    }


def scrape_roster(session, tournament_id):
    """Scrape player roster with standings."""
    url = f"{RK9_BASE}/roster/{tournament_id}"
    print(f"  Fetching roster: {url}")
    resp = session.get(url, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    players = []
    table = soup.find("table", id="dtLiveRoster")
    if not table:
        table = soup.find("table")
    if not table:
        print("    WARNING: No roster table found")
        return []

    rows = table.find_all("tr")
    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 6:
            continue

        # Columns: Player ID, First Name, Last Name, Country, Division, Trainer, Team List, Standing
        first_name = cells[1].get_text(strip=True)
        last_name = cells[2].get_text(strip=True)
        country = cells[3].get_text(strip=True)
        division = cells[4].get_text(strip=True)

        # Only scrape Masters division
        if division.lower() != "masters":
            continue

        # Team list link
        team_link = None
        teamlist_cell = cells[6] if len(cells) > 6 else None
        if teamlist_cell:
            a_tag = teamlist_cell.find("a", href=True)
            if a_tag:
                team_link = a_tag["href"]

        # Standing
        standing_text = cells[-1].get_text(strip=True) if cells[-1] else ""
        try:
            standing = int(standing_text)
        except (ValueError, TypeError):
            standing = 9999

        player_name = f"{first_name} {last_name}".strip()
        if not player_name:
            continue

        players.append({
            "name": player_name,
            "country": country,
            "placement": standing,
            "team_link": team_link,
            "team": [],
        })

    # Sort by placement
    players.sort(key=lambda p: p["placement"])
    print(f"    Found {len(players)} Masters players")
    return players


def parse_team_list(soup, pokemon_lookup, move_lookup):
    """Parse a team list page and return list of 6 Pokemon dicts.

    RK9 HTML structure per Pokemon (repeated once per language, ~9 languages):
        <div class="pokemon bg-light-green-50 p-3">
            <img src="..."/>
            Flutter Mane
            <b>EN</b> <br/>
            <b>Tera Type:</b> Fairy<br/>
            <b>Ability:</b> Protosynthesis
            <b>Held Item:</b> Booster Energy<br/>
            <h5>
                <span class="badge">Icy Wind</span>
                <span class="badge">Protect</span>
                <span class="badge">Moonblast</span>
                <span class="badge">Thunder Wave</span>
            </h5>
        </div>

    We only want the English entries, identified by containing <b>EN</b>.
    With 6 Pokemon * ~9 languages, there are ~54 div.pokemon on each page.
    """
    team = []

    pokemon_divs = soup.find_all("div", class_="pokemon")
    if not pokemon_divs:
        return []

    for poke_div in pokemon_divs:
        # Only process English entries: look for a <b> tag containing "EN"
        lang_tags = poke_div.find_all("b")
        is_english = False
        for b_tag in lang_tags:
            if b_tag.get_text(strip=True) == "EN":
                is_english = True
                break
        if not is_english:
            continue

        pokemon_name = ""
        tera_type = ""
        ability = ""
        item = ""
        moves = []

        # Extract Pokemon name: text content before the <b>EN</b> tag,
        # after the <img> tag. We get the direct text nodes of the div.
        # The name is typically the first meaningful text node.
        for child in poke_div.children:
            if isinstance(child, str):
                text = child.strip()
                if text and text not in ("", "\n"):
                    # Filter out stray text that isn't a name
                    if not any(kw in text for kw in ["Tera Type:", "Ability:", "Held Item:"]):
                        pokemon_name = text
                        break

        # Extract labeled fields from <b> tags
        for b_tag in lang_tags:
            b_text = b_tag.get_text(strip=True)
            if b_text in ("EN", "FR", "IT", "DE", "ES", "JA", "KO", "ZH", "ZH-T"):
                continue

            # The value follows the <b> tag as a text sibling
            value = ""
            next_sib = b_tag.next_sibling
            while next_sib:
                if isinstance(next_sib, str):
                    value = next_sib.strip()
                    if value:
                        break
                # Stop if we hit another tag (next <b>, <br>, <h5>, etc.)
                break

            if b_text == "Tera Type:":
                tera_type = value
            elif b_text == "Ability:":
                ability = value
            elif b_text == "Held Item:":
                item = value

        # Extract moves from <span class="badge"> inside <h5>
        h5 = poke_div.find("h5")
        if h5:
            for badge in h5.find_all("span", class_="badge"):
                move_text = badge.get_text(strip=True)
                if move_text:
                    # Normalize move name via lookup
                    if move_text.lower() in move_lookup:
                        moves.append(move_lookup[move_text.lower()])
                    else:
                        moves.append(move_text)

        if not pokemon_name:
            continue

        # Normalize Pokemon name
        normalized_name = normalize_pokemon_name(pokemon_name, pokemon_lookup)

        team.append({
            "pokemon": normalized_name,
            "item": item,
            "ability": ability,
            "tera_type": tera_type,
            "moves": moves[:4],
        })

    return team[:6]


def scrape_team_lists(session, players, tournament_id, pokemon_lookup, move_lookup):
    """Scrape team lists for all players who have them."""
    total = len([p for p in players if p.get("team_link")])
    count = 0
    for player in players:
        if not player.get("team_link"):
            continue
        count += 1

        url = f"{RK9_BASE}{player['team_link']}"
        if count % 25 == 1:
            print(f"    Scraping team lists... ({count}/{total})")

        try:
            time.sleep(REQUEST_DELAY)
            resp = session.get(url, timeout=30)
            if resp.status_code != 200:
                continue
            soup = BeautifulSoup(resp.text, "html.parser")
            team = parse_team_list(soup, pokemon_lookup, move_lookup)
            if team:
                player["team"] = team
        except Exception as e:
            print(f"    WARNING: Failed to scrape team for {player['name']}: {e}")
            continue

    teams_found = len([p for p in players if p.get("team") and len(p["team"]) > 0])
    print(f"    Scraped {teams_found}/{total} team lists")


def aggregate_usage(players, filter_key):
    """Compute usage stats for a given filter level."""
    day_hierarchy = {"top8": 4, "top16": 3, "day2": 2, "day1": 1}
    filter_level = day_hierarchy.get(filter_key, 0)

    if filter_level == 0:
        # "all" or unknown: include everyone with teams
        filtered = [p for p in players if p.get("team")]
    else:
        # Include players at or above the requested level
        filtered = [p for p in players if p.get("team") and
                    day_hierarchy.get(p.get("day_reached"), 0) >= filter_level]

    total_teams = len(filtered)
    if total_teams == 0:
        return {"total_teams": 0, "pokemon": {}}

    pokemon_stats = {}
    for player in filtered:
        team_names = [slot["pokemon"] for slot in player["team"]]
        for slot in player["team"]:
            name = slot["pokemon"]
            if name not in pokemon_stats:
                pokemon_stats[name] = {
                    "usage_count": 0,
                    "usage_pct": 0,
                    "moves": {},
                    "items": {},
                    "abilities": {},
                    "tera_types": {},
                    "teammates": {},
                }

            stats = pokemon_stats[name]
            stats["usage_count"] += 1

            for move in slot.get("moves", []):
                if move:
                    stats["moves"][move] = stats["moves"].get(move, 0) + 1

            if slot.get("item"):
                stats["items"][slot["item"]] = stats["items"].get(slot["item"], 0) + 1

            if slot.get("ability"):
                stats["abilities"][slot["ability"]] = stats["abilities"].get(slot["ability"], 0) + 1

            if slot.get("tera_type"):
                stats["tera_types"][slot["tera_type"]] = stats["tera_types"].get(slot["tera_type"], 0) + 1

            # Teammates = other 5 Pokemon on the same team
            for teammate in team_names:
                if teammate != name:
                    stats["teammates"][teammate] = stats["teammates"].get(teammate, 0) + 1

    # Compute usage percentages
    for name, stats in pokemon_stats.items():
        stats["usage_pct"] = round(stats["usage_count"] / total_teams * 100, 2)

    return {"total_teams": total_teams, "pokemon": pokemon_stats}


def build_aggregated_data(players):
    """Build all filter-level aggregations."""
    return {
        "all": aggregate_usage(players, "all"),
        "day2": aggregate_usage(players, "day2"),
        "top16": aggregate_usage(players, "top16"),
        "top8": aggregate_usage(players, "top8"),
    }


def save_tournament_data(tournament_id, metadata, players, aggregated):
    """Save tournament data atomically."""
    out_dir = os.path.join(TOURNAMENT_DATA_DIR, tournament_id)
    os.makedirs(out_dir, exist_ok=True)

    clean_players = list(players)

    with open(os.path.join(out_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    with open(os.path.join(out_dir, "players.json"), "w", encoding="utf-8") as f:
        json.dump(clean_players, f, separators=(",", ":"), ensure_ascii=False)

    with open(os.path.join(out_dir, "aggregated.json"), "w", encoding="utf-8") as f:
        json.dump(aggregated, f, separators=(",", ":"), ensure_ascii=False)

    print(f"  Saved data to {out_dir}/")


def update_tournaments_index():
    """Rebuild the tournaments index file from saved tournament data."""
    tournaments = []
    if not os.path.isdir(TOURNAMENT_DATA_DIR):
        return

    for tid in os.listdir(TOURNAMENT_DATA_DIR):
        meta_path = os.path.join(TOURNAMENT_DATA_DIR, tid, "metadata.json")
        if os.path.exists(meta_path):
            meta = load_json(meta_path)
            if meta:
                tournaments.append(meta)

    tournaments.sort(key=lambda t: t.get("date", ""), reverse=True)

    with open(os.path.join(TOURNAMENT_DATA_DIR, "tournaments_index.json"), "w", encoding="utf-8") as f:
        json.dump(tournaments, f, indent=2, ensure_ascii=False)

    print(f"Updated tournaments index with {len(tournaments)} tournaments.")


def scrape_tournament(session, tournament_id, event_info, pokemon_lookup, move_lookup,
                      day2_override=None, force=False):
    """Full pipeline for one tournament."""
    out_dir = os.path.join(TOURNAMENT_DATA_DIR, tournament_id)
    if not force and os.path.exists(os.path.join(out_dir, "metadata.json")):
        print(f"Skipping {tournament_id} (already scraped). Use --force to re-scrape.")
        return

    print(f"\nScraping tournament: {tournament_id}")

    # 1. Get metadata
    time.sleep(REQUEST_DELAY)
    metadata = scrape_tournament_metadata(session, tournament_id, event_info)
    print(f"  Tournament: {metadata['name']} ({metadata['type']})")

    # 2. Scrape roster
    time.sleep(REQUEST_DELAY)
    players = scrape_roster(session, tournament_id)
    if not players:
        print("  No players found. Skipping.")
        return

    total_players = len(players)
    metadata["total_players"] = total_players

    # 3. Determine Day 2 players from pairings data
    print("  Scraping pairings to determine Day 2 players...")
    day2_names, player_records = scrape_pairings_data(session, tournament_id)

    if day2_names is not None:
        match_map = build_player_match_map(players, player_records)
        # Store final records on matching players
        for player in players:
            pairings_key = match_map.get(player["name"])
            if pairings_key and pairings_key in player_records:
                rec = player_records[pairings_key]
                player["record"] = {"wins": rec["wins"], "losses": rec["losses"]}

        classify_players_day(players, day2_names, match_map)
        day2_count = sum(1 for p in players if p["day_reached"] in ("day2", "top16", "top8"))
        metadata["day2_count"] = day2_count
        metadata["day2_source"] = "pairings"
        print(f"  Day 2 players (from pairings): {day2_count}")
    else:
        # Fallback: store any records we got, use placement-based estimation
        if player_records:
            match_map = build_player_match_map(players, player_records)
            for player in players:
                pairings_key = match_map.get(player["name"])
                if pairings_key and pairings_key in player_records:
                    rec = player_records[pairings_key]
                    player["record"] = {"wins": rec["wins"], "losses": rec["losses"]}
        day2_cutoff = day2_override or 32
        classify_players_day_fallback(players, day2_cutoff)
        metadata["day2_cutoff_standing"] = day2_cutoff
        metadata["day2_source"] = "estimated"
        print(f"  Day 2 cutoff (estimated): top {day2_cutoff}")

    # 5. Scrape team lists
    scrape_team_lists(session, players, tournament_id, pokemon_lookup, move_lookup)

    teams_with_data = len([p for p in players if p.get("team") and len(p["team"]) > 0])
    if teams_with_data == 0:
        print("  No team data found. Saving roster only.")

    # 6. Aggregate usage
    aggregated = build_aggregated_data(players)
    metadata["teams_scraped"] = teams_with_data
    metadata["scraped_at"] = datetime.utcnow().isoformat() + "Z"

    # 7. Save
    save_tournament_data(tournament_id, metadata, players, aggregated)


def reteam_tournament(session, tournament_id, pokemon_lookup, move_lookup):
    """Re-scrape team lists for an existing tournament using saved roster data."""
    out_dir = os.path.join(TOURNAMENT_DATA_DIR, tournament_id)
    meta_path = os.path.join(out_dir, "metadata.json")
    players_path = os.path.join(out_dir, "players.json")

    if not os.path.exists(meta_path) or not os.path.exists(players_path):
        print(f"Skipping {tournament_id} (no existing data)")
        return

    metadata = load_json(meta_path)
    players = load_json(players_path)

    if not isinstance(players, list) or not players:
        print(f"Skipping {tournament_id} (no players)")
        return

    # Check if players have team_links saved
    has_links = any(p.get("team_link") for p in players)
    if not has_links:
        # Need to re-scrape roster to get team links
        print(f"\n  {metadata.get('name', tournament_id)}: no saved team_links, re-fetching roster...")
        time.sleep(REQUEST_DELAY)
        roster = scrape_roster(session, tournament_id)
        if not roster:
            print("    No roster found. Skipping.")
            return
        # Match roster team_links to existing players by name
        link_map = {p["name"]: p.get("team_link") for p in roster if p.get("team_link")}
        for player in players:
            if not player.get("team_link"):
                player["team_link"] = link_map.get(player["name"])

    total_links = sum(1 for p in players if p.get("team_link"))
    print(f"\n  Re-scraping teams for {metadata.get('name', tournament_id)} ({total_links} team links)")

    # Reclassify day_reached using pairings data
    print("    Scraping pairings to determine Day 2 players...")
    day2_names, player_records = scrape_pairings_data(session, tournament_id)

    if day2_names is not None:
        match_map = build_player_match_map(players, player_records)
        for player in players:
            pairings_key = match_map.get(player["name"])
            if pairings_key and pairings_key in player_records:
                rec = player_records[pairings_key]
                player["record"] = {"wins": rec["wins"], "losses": rec["losses"]}
        classify_players_day(players, day2_names, match_map)
        metadata["day2_source"] = "pairings"
    else:
        if player_records:
            match_map = build_player_match_map(players, player_records)
            for player in players:
                pairings_key = match_map.get(player["name"])
                if pairings_key and pairings_key in player_records:
                    rec = player_records[pairings_key]
                    player["record"] = {"wins": rec["wins"], "losses": rec["losses"]}
        classify_players_day_fallback(players, 32)
        metadata["day2_source"] = "estimated"

    # Clear existing team data and re-scrape
    for player in players:
        player["team"] = []

    scrape_team_lists(session, players, tournament_id, pokemon_lookup, move_lookup)

    teams_with_data = len([p for p in players if p.get("team") and len(p["team"]) > 0])
    metadata["teams_scraped"] = teams_with_data
    metadata["scraped_at"] = datetime.utcnow().isoformat() + "Z"

    # Re-aggregate and save
    aggregated = build_aggregated_data(players)
    save_tournament_data(tournament_id, metadata, players, aggregated)


def main():
    parser = argparse.ArgumentParser(description="Scrape VGC tournament data from RK9.gg")
    parser.add_argument("tournament_ids", nargs="*", help="Specific tournament IDs to scrape")
    parser.add_argument("--topcut", type=int, default=None, help="(Deprecated, ignored)")
    parser.add_argument("--day2", type=int, default=None, help="Override day 2 placement cutoff")
    parser.add_argument("--force", action="store_true", help="Re-scrape even if data exists")
    parser.add_argument("--reteam", action="store_true",
                        help="Re-scrape team lists for existing tournaments (uses saved roster/team_links)")
    parser.add_argument("--discover", action="store_true", help="Discover and list available tournaments")
    args = parser.parse_args()

    os.makedirs(TOURNAMENT_DATA_DIR, exist_ok=True)

    # Load name lookups
    print("Loading Pokemon data for name normalization...")
    pokemon_lookup, move_lookup, _ = load_name_lookups()

    session = requests.Session()
    session.headers.update({
        "User-Agent": "MunchStats Tournament Scraper (munchstats.com)",
    })

    if args.reteam:
        # Re-scrape team lists for existing tournaments
        if args.tournament_ids:
            tids = args.tournament_ids
        else:
            # All tournaments with teams_scraped > 0
            index = load_json(os.path.join(TOURNAMENT_DATA_DIR, "tournaments_index.json"))
            if isinstance(index, list):
                tids = [t["id"] for t in index if t.get("teams_scraped", 0) > 0]
            else:
                tids = []
        print(f"Re-scraping team lists for {len(tids)} tournaments...")
        for tid in tids:
            try:
                reteam_tournament(session, tid, pokemon_lookup, move_lookup)
            except Exception as e:
                print(f"ERROR re-teaming {tid}: {e}")
                continue
        update_tournaments_index()
        print("\nDone.")
        return

    if args.tournament_ids:
        # Scrape specific tournaments
        for tid in args.tournament_ids:
            try:
                scrape_tournament(session, tid, {}, pokemon_lookup, move_lookup,
                                  args.day2, args.force)
            except Exception as e:
                print(f"ERROR scraping {tid}: {e}")
                continue
    else:
        # Discover and scrape all tournaments
        tournament_ids, event_info = discover_tournaments(session)
        if not tournament_ids:
            print("No tournaments found.")
            return

        if args.discover:
            print(f"\nFound {len(tournament_ids)} VGC tournaments:")
            for tid in tournament_ids:
                info = event_info.get(tid, {})
                print(f"  {tid}: {info.get('name', '?')} - {info.get('date_text', '?')}")
            return

        print(f"\nFound {len(tournament_ids)} VGC tournaments to process.")
        for tid in tournament_ids:
            try:
                scrape_tournament(session, tid, event_info, pokemon_lookup, move_lookup,
                                  args.day2, args.force)
            except Exception as e:
                print(f"ERROR scraping {tid}: {e}")
                continue

    # Update index
    update_tournaments_index()
    print("\nDone.")


if __name__ == "__main__":
    main()
