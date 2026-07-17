"""Meta insight reports derived from data the app already serves.

Every report here is a pure function over already-loaded structures
(the Smogon ladder index, the Limitless tournament aggregate, the
pre-computed trend files) so it adds no new fetching, caching or
memory pressure: each call is a sort over a few hundred entries.

Reports:
  - performance_report: tournament win rate vs usage (over/underrated)
  - divergence_report:  ladder usage vs tournament usage gaps
  - trend_report:       month-over-month ladder usage movers
"""

import re
from datetime import datetime, timedelta
from itertools import combinations

# Win-rate lists only rank Pokemon with a real sample behind them: a
# 5-2 one-off would otherwise top every list. Tournament games per
# Pokemon accumulate fast (each team plays a whole Swiss run), so 100
# games / 20 teams keeps the meta staples in and the novelties out.
MIN_GAMES = 100
MIN_TEAMS = 20

# The two conversion panels are deliberately asymmetric: an obscure
# Pokemon winning a lot is a hidden gem (keep it), but an obscure
# Pokemon losing a lot is trivia — "overrated" only means something
# for picks people actually bring, so the underperforming list also
# requires meaningful usage.
MIN_UNDERPERFORMER_USAGE = 5.0  # percent of teams

# Divergence and trend rows below these usage floors are noise: a jump
# from 0.1% to 0.4% is a rounding artifact, not a metagame shift.
MIN_DIVERGENCE_USAGE = 1.0  # percent, in at least one source
MIN_TREND_USAGE = 0.5  # percent, in at least one of the two months

# Tournament momentum splits the rolling window into an earlier and a
# recent half; with fewer teams than this on either side, a single
# mid-sized event would swing every number.
MIN_HALF_TEAMS = 100

# The win-rate core sort answers a different question than the synergy
# sort (same asymmetry as the conversion panels): it ranks established
# cores by record, so it carries a usage floor. Without it, both sorts
# converge on the same niche high-win-rate cores, because lift ~= win
# rate minus ~50.
MIN_TOP_CORE_USAGE = 1.0  # percent of teams

CORE_SIZES = (2, 3, 4, 5, 6)  # 6 = the full team, i.e. exact archetypes
CORE_SORTS = ("wr", "usage", "lift")

TOP_N = 15


def _norm_key(name):
    """Join key across data sources ("Urshifu-Rapid-Strike" == "urshifurapidstrike")."""
    return re.sub(r"[^a-z0-9]+", "", name.lower())


CONVERSION_TOP_N = 10


def limitless_cut_movers(full_data, cut_data, label, top_n=CONVERSION_TOP_N):
    """Usage-share movers between all entrants and a top-placement cut.

    Same presentation as the tournament overview's Biggest Movers:
    the largest gains and drops in usage share (percentage points)
    from the full field to each event's top-X finishers. `full_data`
    and `cut_data` are limitless aggregates ({"pokemon",
    "total_teams"}). Returns None when either side is empty.
    """
    full_mons = (full_data or {}).get("pokemon") or {}
    cut_mons = (cut_data or {}).get("pokemon") or {}
    if not full_mons or not cut_mons:
        return None
    movers = _stage_movers(full_mons, cut_mons, label, top_n)
    if not movers:
        return None
    movers["from_teams"] = full_data.get("total_teams") or 0
    movers["to_teams"] = cut_data.get("total_teams") or 0
    return movers


# Movers below this usage share (in both stages) are noise: at a
# 156-team Day 2, 2% is a three-team blip.
MIN_MOVER_USAGE = 2.0
MOVERS_TOP_N = 5


def _stage_movers(prev_mons, cur_mons, label, top_n=MOVERS_TOP_N):
    """Biggest usage-share changes between two consecutive stages."""
    rows = []
    for name in set(prev_mons) | set(cur_mons):
        prev_pct = prev_mons.get(name, {}).get("usage_pct", 0)
        pct = cur_mons.get(name, {}).get("usage_pct", 0)
        if max(prev_pct, pct) < MIN_MOVER_USAGE:
            continue
        rows.append({
            "name": name,
            "prev_pct": prev_pct,
            "usage_pct": pct,
            "delta": pct - prev_pct,
        })
    gains = sorted(
        (r for r in rows if r["delta"] > 0),
        key=lambda r: -r["delta"],
    )[:top_n]
    drops = sorted(
        (r for r in rows if r["delta"] < 0),
        key=lambda r: r["delta"],
    )[:top_n]
    if not gains and not drops:
        return None
    return {"label": label, "gains": gains, "drops": drops}


def stage_usage_report(stage_list, top_n=10):
    """Per-stage usage overview shared by official and online events.

    `stage_list` is an ordered [(label, {"pokemon", "total_teams"})].
    Empty stages are dropped, as are stages not strictly smaller than
    the previous kept one (a "cut" the whole field fits in says
    nothing). Returns None when fewer than two stages survive, else:

      stages — each with its top_n Pokemon by usage share and
        `delta` = usage_pct minus the previous stage's usage_pct
        (None on the first stage).
      movers — the biggest usage gains and drops for each stage
        transition.
    """
    stages = []
    movers = []
    prev = None  # (label, mons, total) of the previous kept stage
    for label, data in stage_list:
        data = data or {}
        mons = data.get("pokemon") or {}
        total = data.get("total_teams") or 0
        if not mons or total <= 0:
            continue
        if prev is not None and total >= prev[2]:
            continue
        top = sorted(
            mons, key=lambda n: mons[n].get("usage_pct", 0), reverse=True
        )[:top_n]
        rows = []
        for name in top:
            pct = mons[name].get("usage_pct", 0)
            rows.append({
                "name": name,
                "usage_pct": pct,
                "count": mons[name].get("usage_count", 0),
                # A Pokemon absent from the previous stage rose from 0%.
                "delta": None if prev is None
                else pct - prev[1].get(name, {}).get("usage_pct", 0),
            })
        stages.append({"label": label, "total_teams": total, "rows": rows})
        if prev is not None:
            m = _stage_movers(prev[1], mons, f"{prev[0]} → {label}")
            if m:
                movers.append(m)
        prev = (label, mons, total)

    # A lone stage carries no story (it's just the sidebar's list).
    if len(stages) < 2:
        return None
    return {"stages": stages, "movers": movers}


def official_stage_usage_report(agg, top_n=10):
    """Day 1 / Day 2 / Top Cut usage overview for one official event.

    `agg` is the tournament's aggregated dict keyed by day filter
    ("all"/"day2"/"top16"/"top8"). "Top cut" is the single-elimination
    bracket: top8, with top16 as a stand-in when top8 wasn't scraped.
    """
    order = [("Day 1", agg.get("all")), ("Day 2", agg.get("day2"))]
    for cut_key, cut_label in (("top8", "Top 8"), ("top16", "Top 16")):
        if (agg.get(cut_key) or {}).get("pokemon"):
            order.append((cut_label, agg.get(cut_key)))
            break
    return stage_usage_report(order, top_n)


def performance_report(pokemon_stats, top_n=TOP_N):
    """Rank Pokemon by tournament win rate, best and worst converters.

    `pokemon_stats` is one segment's aggregate from limitless_stats
    (name -> usage_pct/usage_count/wins/losses/ties/win_rate). Only
    Pokemon meeting the MIN_GAMES/MIN_TEAMS floor are ranked; usage
    rank is computed over the whole segment so a row can say
    "3rd most used, 41% win rate".
    """
    by_usage = sorted(
        pokemon_stats,
        key=lambda n: pokemon_stats[n].get("usage_pct", 0),
        reverse=True,
    )
    usage_rank = {name: i + 1 for i, name in enumerate(by_usage)}

    qualified = []
    for name, stats in pokemon_stats.items():
        win_rate = stats.get("win_rate")
        games = (
            (stats.get("wins") or 0)
            + (stats.get("losses") or 0)
            + (stats.get("ties") or 0)
        )
        if win_rate is None or games < MIN_GAMES:
            continue
        if (stats.get("usage_count") or 0) < MIN_TEAMS:
            continue
        qualified.append({
            "name": name,
            "usage_pct": stats.get("usage_pct", 0),
            "usage_rank": usage_rank[name],
            "win_rate": win_rate,
            "games": games,
            "teams": stats.get("usage_count", 0),
        })
    if not qualified:
        return None

    by_win_rate = sorted(
        qualified, key=lambda r: (-r["win_rate"], -r["games"])
    )
    # Each panel only lists Pokemon on its own side of 50%: padding
    # "underperforming" with winning Pokemon (or vice versa) just to
    # fill top_n rows would say the opposite of what it means.
    over = [r for r in by_win_rate if r["win_rate"] > 50]
    under = [
        r for r in by_win_rate[::-1]
        if r["win_rate"] < 50 and r["usage_pct"] >= MIN_UNDERPERFORMER_USAGE
    ]
    return {
        "over": over[:top_n],
        "under": under[:top_n],
        "qualified_count": len(qualified),
        "min_games": MIN_GAMES,
        "min_teams": MIN_TEAMS,
        "min_under_usage": MIN_UNDERPERFORMER_USAGE,
    }


def _collapse_usage(usage_by_name, base_name):
    """Sum usage across forms of the same base Pokemon.

    {"Charizard": 0.1, "Charizard-Mega-Y": 17.9} -> {"Charizard": 18.0}.
    A team never carries two forms of the same Pokemon, so summing
    their team shares is exact.
    """
    if base_name is None:
        return dict(usage_by_name)
    collapsed = {}
    for name, pct in usage_by_name.items():
        base = base_name(name)
        collapsed[base] = collapsed.get(base, 0) + pct
    return collapsed


def divergence_report(ladder_index, pokemon_stats, base_name=None, top_n=TOP_N):
    """Compare ladder usage against tournament usage, biggest gaps first.

    `ladder_index` is a Smogon _index.json pokemon dict (name ->
    {"usage": fraction}); `pokemon_stats` is a Limitless segment
    aggregate (usage_pct is percent-of-teams). Both measure "share of
    teams including this Pokemon", so they compare directly. The
    sources name forms differently — the ladder counts
    "Charizard-Mega-Y" separately while tournament decklists say
    "Charizard" — so both sides are collapsed to base forms via
    `base_name` and joined on a normalized name key.
    """
    ladder = _collapse_usage(
        {n: e.get("usage", 0) * 100 for n, e in ladder_index.items()},
        base_name,
    )
    ladder = {_norm_key(n): (n, round(pct, 2)) for n, pct in ladder.items()}
    tournament = _collapse_usage(
        {n: s.get("usage_pct", 0) for n, s in pokemon_stats.items()},
        base_name,
    )

    rows = []
    seen = set()
    for name, tour_pct in tournament.items():
        key = _norm_key(name)
        seen.add(key)
        ladder_name, ladder_pct = ladder.get(key, (name, 0.0))
        if max(ladder_pct, tour_pct) < MIN_DIVERGENCE_USAGE:
            continue
        rows.append({
            "name": ladder_name,
            "ladder_pct": ladder_pct,
            "tournament_pct": round(tour_pct, 2),
            "delta": round(tour_pct - ladder_pct, 2),
        })
    # Ladder Pokemon that never show up in tournament data at all
    for key, (name, ladder_pct) in ladder.items():
        if key in seen or ladder_pct < MIN_DIVERGENCE_USAGE:
            continue
        rows.append({
            "name": name,
            "ladder_pct": ladder_pct,
            "tournament_pct": 0.0,
            "delta": round(-ladder_pct, 2),
        })
    if not rows:
        return None

    rows.sort(key=lambda r: r["delta"], reverse=True)
    tournament_favored = [r for r in rows if r["delta"] > 0][:top_n]
    ladder_favored = [r for r in rows[::-1] if r["delta"] < 0][:top_n]
    if not tournament_favored and not ladder_favored:
        return None
    return {
        "tournament_favored": tournament_favored,
        "ladder_favored": ladder_favored,
    }


def _team_names(entry, slot_name):
    """The distinct member names of one team entry, form-resolved."""
    return sorted({
        name for name in (slot_name(s) for s in entry["team"]) if name
    })


def _parse_iso_date(value):
    """Parse an ISO date like 2026-07-01T17:30:00.000Z, or None."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def tournament_momentum_report(teams, window_days, slot_name=None,
                               top_n=TOP_N, min_half_teams=MIN_HALF_TEAMS):
    """Usage movement between the window's earlier and recent halves.

    Ladder trends only update monthly; tournament results are dated, so
    splitting the rolling window at its midpoint gives a much fresher
    rising/falling signal. `teams` are Limitless team entries; usage is
    the share of each half's teams that include the Pokemon. Returns
    None when either half has fewer than `min_half_teams` teams (a
    single mid-sized event would otherwise swing every number).
    """
    if slot_name is None:
        slot_name = lambda s: s["pokemon"]
    dated = []
    for entry in teams:
        date = _parse_iso_date(entry["tournament"].get("date"))
        if date is not None:
            dated.append((date, entry))
    if not dated:
        return None

    split = max(date for date, _ in dated) - timedelta(days=window_days / 2)
    counts = {"earlier": {}, "recent": {}}
    totals = {"earlier": 0, "recent": 0}
    for date, entry in dated:
        half = "recent" if date >= split else "earlier"
        totals[half] += 1
        for name in _team_names(entry, slot_name):
            counts[half][name] = counts[half].get(name, 0) + 1
    if min(totals.values()) < min_half_teams:
        return None

    rows = []
    for name in set(counts["earlier"]) | set(counts["recent"]):
        prev = counts["earlier"].get(name, 0) / totals["earlier"] * 100
        last = counts["recent"].get(name, 0) / totals["recent"] * 100
        if max(prev, last) < MIN_DIVERGENCE_USAGE:
            continue
        delta = round(last - prev, 2)
        if delta == 0:
            continue
        rows.append({
            "name": name,
            "prev_pct": round(prev, 2),
            "last_pct": round(last, 2),
            "delta": delta,
        })
    if not rows:
        return None

    rows.sort(key=lambda r: r["delta"], reverse=True)
    rising = [r for r in rows if r["delta"] > 0][:top_n]
    falling = [r for r in rows[::-1] if r["delta"] < 0][:top_n]
    return {
        "rising": rising,
        "falling": falling,
        "half_days": round(window_days / 2),
        "earlier_teams": totals["earlier"],
        "recent_teams": totals["recent"],
    }


# Accumulators here are [teams, wins, losses, ties] lists, not dicts:
# a big format expands to ~10^5 transient core accumulators per rebuild
# and lists keep that spike materially smaller on the RAM-bound dyno.


def _acc_win_rate(acc):
    games = acc[1] + acc[2] + acc[3]
    if games == 0:
        return None, 0
    return round((acc[1] + 0.5 * acc[3]) / games * 100, 1), games


def core_stats(teams, slot_name=None, sizes=CORE_SIZES):
    """Pooled tournament records for every teammate core of each size.

    Returns {"sizes": {size: qualified rows}, ...} where a row pools
    every team containing that exact core (win rate, games, teams,
    lift over the best member's overall win rate), floored at
    MIN_GAMES/MIN_TEAMS like the conversion report. Sorting is left to
    sort_cores so one computation serves every sort mode. Also returns
    "solo_stats" — per-Pokemon stats in the aggregate's shape but with
    `slot_name`-resolved names, so the single-Pokemon reports can use
    the same form resolution (Mega stones) as the core rows.

    Kept tractable two ways: teams collapse to unique (form-resolved)
    six-Pokemon sets first, so combinations expand per archetype
    rather than per team; and only members on MIN_TEAMS+ teams can
    appear in a core (anything rarer could never qualify anyway).
    """
    if slot_name is None:
        slot_name = lambda s: s["pokemon"]

    groups = {}
    total_teams = 0
    for entry in teams:
        names = tuple(_team_names(entry, slot_name))
        if not names:
            continue
        total_teams += 1
        record = entry.get("record") or {}
        acc = groups.get(names)
        if acc is None:
            acc = groups[names] = [0, 0, 0, 0]
        acc[0] += 1
        acc[1] += record.get("wins") or 0
        acc[2] += record.get("losses") or 0
        acc[3] += record.get("ties") or 0
    if not total_teams:
        return None

    solo = {}
    for names, acc in groups.items():
        for name in names:
            s = solo.get(name)
            if s is None:
                s = solo[name] = [0, 0, 0, 0]
            for i in range(4):
                s[i] += acc[i]
    solo_rates = {}
    solo_stats = {}
    for name, acc in solo.items():
        win_rate, _games = _acc_win_rate(acc)
        solo_rates[name] = win_rate
        solo_stats[name] = {
            "usage_count": acc[0],
            "usage_pct": round(acc[0] / total_teams * 100, 2),
            "wins": acc[1],
            "losses": acc[2],
            "ties": acc[3],
            "win_rate": win_rate,
        }
    frequent = {name for name, acc in solo.items() if acc[0] >= MIN_TEAMS}

    by_size = {}
    for size in sizes:
        combo_accs = {}
        for names, acc in groups.items():
            members = [n for n in names if n in frequent]
            if len(members) < size:
                continue
            for combo in combinations(members, size):
                c = combo_accs.get(combo)
                if c is None:
                    c = combo_accs[combo] = [0, 0, 0, 0]
                for i in range(4):
                    c[i] += acc[i]

        rows = []
        for combo, acc in combo_accs.items():
            win_rate, games = _acc_win_rate(acc)
            if win_rate is None or games < MIN_GAMES or acc[0] < MIN_TEAMS:
                continue
            best_solo = max(solo_rates[n] or 0 for n in combo)
            rows.append({
                "names": list(combo),
                "teams": acc[0],
                "usage_pct": round(acc[0] / total_teams * 100, 2),
                "games": games,
                "win_rate": win_rate,
                "best_solo": best_solo,
                "lift": round(win_rate - best_solo, 1),
            })
        by_size[size] = rows

    if not any(by_size.values()):
        return None
    return {
        "sizes": by_size,
        "solo_stats": solo_stats,
        "total_teams": total_teams,
        "min_games": MIN_GAMES,
        "min_teams": MIN_TEAMS,
        "min_top_usage": MIN_TOP_CORE_USAGE,
    }


def sort_cores(rows, sort, top_n=TOP_N):
    """Order qualified core rows for one sort mode.

    "usage" ranks by how common the core is (what to prepare for, win
    rate shown unfiltered); "lift" ranks by synergy (cores that win
    more than either member does overall); the default "wr" ranks
    established cores (MIN_TOP_CORE_USAGE floor) by record.
    """
    if sort == "usage":
        rows = sorted(rows, key=lambda r: (-r["teams"], -r["win_rate"]))
    elif sort == "lift":
        rows = sorted(
            (r for r in rows if r["lift"] > 0 and r["win_rate"] > 50),
            key=lambda r: (-r["lift"], -r["games"]),
        )
    else:
        rows = sorted(
            (
                r for r in rows
                if r["win_rate"] > 50 and r["usage_pct"] >= MIN_TOP_CORE_USAGE
            ),
            key=lambda r: (-r["win_rate"], -r["games"]),
        )
    return rows[:top_n]


def trend_report(trend_data, top_n=TOP_N):
    """Biggest month-over-month ladder usage movers, from a trend file.

    Compares the last two months in the file ({"months": [...],
    "pokemon": {name: [usage% or None per month]}}). None means the
    Pokemon fell below Smogon's listing that month and counts as 0, so
    new arrivals and dropouts rank as real movers. Returns None when
    fewer than two months exist (e.g. a regulation in its first month).
    """
    if not trend_data:
        return None
    months = trend_data.get("months") or []
    pokemon = trend_data.get("pokemon") or {}
    if len(months) < 2 or not pokemon:
        return None
    # A format in its first tracked month has no previous column at all;
    # without this guard everything would "rise from 0%" and nothing fall.
    if not any(len(v) >= 2 and v[-2] for v in pokemon.values()):
        return None

    rows = []
    for name, values in pokemon.items():
        if len(values) < 2:
            continue
        prev = values[-2] or 0
        last = values[-1] or 0
        if max(prev, last) < MIN_TREND_USAGE:
            continue
        delta = round(last - prev, 2)
        if delta == 0:
            continue
        rows.append({
            "name": name,
            "prev_pct": round(prev, 2),
            "last_pct": round(last, 2),
            "delta": delta,
        })
    if not rows:
        return None

    rows.sort(key=lambda r: r["delta"], reverse=True)
    rising = [r for r in rows if r["delta"] > 0][:top_n]
    falling = [r for r in rows[::-1] if r["delta"] < 0][:top_n]
    return {
        "rising": rising,
        "falling": falling,
        "prev_month": months[-2],
        "last_month": months[-1],
    }
