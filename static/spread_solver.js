/* Spread Solver — reverse-engineers EV spreads from what a battle showed.
 *
 * Every damage roll and speed order is a constraint. A single hit rules out
 * most of the grid; a top-cut's worth of them usually leaves one or two
 * spreads standing. The maths runs entirely here: @smogon/calc (the same
 * bundle /calc/ uses) produces the rolls, the server only supplies base
 * stats and the priors — ladder spread usage and published EV spreads.
 *
 * Search strategy: damage depends on the defender's *defense stat*, not on
 * its HP, so rolls are calculated once per candidate stat value (≤64 calc
 * calls per interaction) and matched against every candidate HP arithmetically.
 * Each stat dimension is scored on its own, then the survivors are joined
 * under the format's EV budget. Where both sides of an interaction are
 * unknown they are resolved against each other by re-running the solve with
 * the previous pass's answers.
 */

var t = window.msT || function (s) { return s; };

/* ─── constants ──────────────────────────────────────────────────────── */

const STATS = ["hp", "atk", "def", "spa", "spd", "spe"];
const STAT_LABEL = { hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" };

// [raised, lowered]; a nature missing from the table is neutral.
const NATURES = {
  Lonely: ["atk", "def"], Brave: ["atk", "spe"], Adamant: ["atk", "spa"], Naughty: ["atk", "spd"],
  Bold: ["def", "atk"], Relaxed: ["def", "spe"], Impish: ["def", "spa"], Lax: ["def", "spd"],
  Modest: ["spa", "atk"], Mild: ["spa", "def"], Quiet: ["spa", "spe"], Rash: ["spa", "spd"],
  Calm: ["spd", "atk"], Gentle: ["spd", "def"], Sassy: ["spd", "spe"], Careful: ["spd", "spa"],
  Timid: ["spe", "atk"], Hasty: ["spe", "def"], Jolly: ["spe", "spa"], Naive: ["spe", "spd"],
  Hardy: null, Docile: null, Serious: null, Bashful: null, Quirky: null,
};
const NATURE_NAMES = Object.keys(NATURES).sort();

const WEATHERS = ["", "Sun", "Rain", "Sand", "Snow", "Harsh Sunshine", "Heavy Rain", "Strong Winds"];
const TERRAINS = ["", "Electric", "Grassy", "Misty", "Psychic"];
const TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
  "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy", "Stellar",
];
const STATUSES = ["", "Burned", "Poisoned", "Badly Poisoned", "Paralyzed", "Asleep", "Frozen"];
// Speed multipliers a player can usually identify from the battle itself.
const SPEED_MODS = [
  ["", "—", 1],
  ["scarf", "Choice Scarf (×1.5)", 1.5],
  ["booster", "Booster Energy / Quark Drive (×1.5)", 1.5],
  ["weather", "Swift Swim / Chlorophyll / Sand Rush (×2)", 2],
  ["unburden", "Unburden (×2)", 2],
  ["slowstart", "Slow Start (×0.5)", 0.5],
  ["ironball", "Iron Ball (×0.5)", 0.5],
];

// How many values of an unknown opposing stat to marginalise over. Six covers
// the realistic spreads without turning one interaction into thousands of calcs.
// Six is empirical, not arbitrary. Truncating here can hard-eliminate a true
// spread whose only supporting opponent falls outside the sample, so widening it
// looks like an obvious win — but measured against a fully revealed team, every
// version of that (carrying the range extremes, flooring zeroed entries, using
// the whole distribution for Speed) scored *worse*: letting implausible opposing
// spreads vote dilutes constraints that should be sharp. Do not widen this
// without re-running that calibration.
const OPPOSING_SAMPLES = 6;
// Hard ceiling on the joint enumeration; dimensions are trimmed to their
// best-scoring values if a case would exceed it (reported in the results).
// Trimming is the enemy: measured against a fully revealed team it was the only
// thing deleting true spreads, and it deleted them despite excellent
// likelihoods, purely because thousands of alternatives fit marginally better.
// The enumeration walks dimensions in ascending EV order and breaks the moment
// the budget is blown, so most of this nominal space is never visited — which
// buys a cap high enough that trimming almost never fires.
// 1.5M is a browser budget, not a theoretical one: the loop below runs once per
// Pokémon per pass, so this is already a few seconds of work on a real case.
const MAX_COMBOS = 1500000;
const KEEP_CANDIDATES = 40000;
const MAX_DEF_ROWS = 250000;
// How far below the best fit a candidate may sit and still be kept. e^-16 is
// about 1e-7 of the leader's weight — it cannot move the answer, the shares or
// the confidence bars, so storing it only costs memory and sort time.
const LL_HORIZON = 16;
const MAX_SHOWN = 8;
// Weight on the prior relative to the damage evidence. Evidence should win a
// straight fight; the prior is there to break ties between spreads the rolls
// cannot separate — which is most of them.
const PRIOR_WEIGHT = 1.0;
// Ladder usage is measured on the ladder, and the teams this tool is pointed at
// are exactly the ones that deviate from it. Raw usage odds (45% run max Atk vs
// 0.6% run none) are far too confident to weigh against a damage roll, so the
// prior is flattened before it competes: p^TEMPER. Without this the answer just
// restates usage and the tool can never find the set it exists to find.
const PRIOR_TEMPER = 0.5;
// Rounds of joint refinement, and how many of each Pokémon's candidates get
// re-scored against concrete opposing spreads rather than a distribution.
let JOINT_ROUNDS = 3;
const JOINT_CANDIDATES = 200;
// An EV that buys no stat point over the value below it. Real spreads almost
// never carry one, and this is what separates "2 HP / 32 SpA" from "1 HP / 1 Def / 32 SpA".
const WASTE_PENALTY = -1.2;
// How strongly the teamsheet reading steers *where* leftover budget lands,
// judged on the allocation itself rather than through a normalised density.
const DESIRE_WEIGHT = 6;
// Cost of putting anything at all into a stat the sheet rules out — the
// nature-lowered one, or an offence the Pokémon has no moves for.
const LAST_RESORT_PENALTY = -6;
// Applied to a candidate that cannot reach the full budget even after its
// unconstrained stats soak up everything they can hold.
const UNSPENT_PENALTY = -6;
// Applied when a candidate's solved stats under-spend and the leftover is
// forced into a stat no real set would use — a nature-lowered one, or an
// offence with no moves behind it. "2 HP / 32 Atk / 18 SpD, and 14 points of
// SpA on an Adamant Basculegion" is not a spread anybody built; the budget has
// to balance somewhere, so under-spending is itself evidence against the
// solved stats that caused it. Worth 28 stat points of accuracy on a
// twelve-Pokémon benchmark. Tuned, not guessed: -25 measured slightly worse
// than -12, so it stops the absurd dumps without dictating the whole spread.
const DUMP_PENALTY = -12;
const STORE_KEY = "munchstats.spreadSolver.v1";

/* ─── small helpers ──────────────────────────────────────────────────── */

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pct = (n, digits) => (n * 100).toFixed(digits == null ? 1 : digits) + "%";

function spriteStyle(sprite) {
  const s = sprite || [0, 0];
  return `background-position:-${s[1] * 40}px -${s[0] * 30}px`;
}

function natureMult(nature, stat) {
  if (stat === "hp") return 1;
  const n = NATURES[nature];
  if (!n) return 1;
  if (n[0] === stat && n[1] === stat) return 1;
  if (n[0] === stat) return 1.1;
  if (n[1] === stat) return 0.9;
  return 1;
}

/* Stat value from base/EV/IV. Champions spends stat points on its own formula
 * (base + points + 20, HP base + points + 75); everything else is the cartridge
 * formula @smogon/calc uses, reproduced here so a candidate stat can be priced
 * without building a Pokemon for it. */
function statValue(stat, base, ev, iv, level, nature, champions) {
  if (champions) {
    if (stat === "hp") return base + ev + 75;
    return Math.floor((base + ev + 20) * natureMult(nature, stat));
  }
  if (stat === "hp") {
    if (base === 1) return 1;
    return Math.floor((base * 2 + iv + Math.floor(ev / 4)) * level / 100) + level + 10;
  }
  return Math.floor(
    (Math.floor((base * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5) * natureMult(nature, stat)
  );
}

function evGrid(rules) {
  const out = [];
  for (let v = 0; v <= rules.perStat; v += rules.step) out.push(v);
  return out;
}

/* ─── state ──────────────────────────────────────────────────────────── */

const boot = window.SOLVER_BOOT || {};
let S = null;
const speciesCache = new Map();   // "format|rating|species" -> payload
const communityLoaded = new Set();
const rollCache = new Map();

function blankState() {
  return {
    v: 1,
    format: boot.format || "",
    rating: boot.rating || "0",
    month: boot.month || "",
    activeTeam: null,
    refine: true,
    community: true,
    teams: [],
    obs: [],
  };
}

function newTeam(name) {
  return { id: uid(), name: name || "", player: "", paste: "", mons: [] };
}

function newMon(set) {
  const evs = {}, ivs = {};
  const known = !!(set && set.evs && set.evs.some((v) => v > 0));
  STATS.forEach((s, i) => {
    evs[s] = known ? set.evs[i] : null;
    ivs[s] = set && set.ivs ? set.ivs[i] : 31;
  });
  return {
    id: uid(),
    species: (set && set.species) || "",
    nickname: (set && set.nickname) || "",
    sprite: (set && set.sprite) || [0, 0],
    item: (set && set.item) || "",
    ability: (set && set.ability) || "",
    tera: (set && set.tera) || "",
    nature: (set && set.nature) || "",
    level: (set && set.level) || 0,
    moves: (set && set.moves) || [],
    evs, ivs,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 1 && Array.isArray(parsed.teams)) return parsed;
    }
  } catch (e) { /* corrupt or blocked storage: start clean */ }
  return null;
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* quota / private mode */ }
}

const teamById = (id) => S.teams.find((x) => x.id === id) || null;
const monById = (teamId, monId) => {
  const team = teamById(teamId);
  return team ? team.mons.find((m) => m.id === monId) || null : null;
};

function teamLabel(team, index) {
  return team.name || t("Team") + " " + String.fromCharCode(65 + index);
}

function monLabel(mon) {
  return mon.nickname && mon.nickname !== mon.species
    ? `${mon.nickname} (${mon.species})` : mon.species;
}

/* Every roster slot, flattened, for the interaction pickers. */
function allSlots() {
  const out = [];
  S.teams.forEach((team, ti) => {
    team.mons.forEach((mon) => {
      out.push({ teamId: team.id, monId: mon.id, team, mon, label: `${teamLabel(team, ti)} · ${monLabel(mon)}` });
    });
  });
  return out;
}

function slotOf(ref) {
  if (!ref || !ref.monId) return null;
  const mon = monById(ref.teamId, ref.monId);
  if (!mon) return null;
  const ti = S.teams.findIndex((x) => x.id === ref.teamId);
  return { teamId: ref.teamId, monId: ref.monId, team: S.teams[ti], mon, index: ti };
}

/* ─── species data ───────────────────────────────────────────────────── */

const speciesKey = (species) => `${S.format}|${S.rating}|${species}`;

async function loadSpecies(species, withCommunity) {
  const key = speciesKey(species);
  const cached = speciesCache.get(key);
  const needCommunity = !!withCommunity && !communityLoaded.has(key);
  if (cached && !needCommunity) return cached;

  const url = `/api/tools/spread-context/${encodeURIComponent(S.format)}/`
    + `${encodeURIComponent(S.rating)}/${encodeURIComponent(species)}`
    + `?community=${withCommunity ? 1 : 0}`
    + (S.month ? `&month=${encodeURIComponent(S.month)}` : "");
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(t("No data for") + " " + species);
  const data = await resp.json();
  if (cached && !withCommunity) return cached;
  if (withCommunity) communityLoaded.add(key);
  speciesCache.set(key, data);
  // The server resolves near-misses, so cache the resolved name too.
  if (data.name && data.name !== species) speciesCache.set(speciesKey(data.name), data);
  return data;
}

const speciesData = (species) => speciesCache.get(speciesKey(species)) || null;

/* ─── stat maths against a roster slot ───────────────────────────────── */

function monLevel(mon, sp) { return mon.level || (sp && sp.level) || 50; }

function monStat(mon, sp, stat, ev, iv) {
  const base = (sp.baseStats && sp.baseStats[stat]) || 1;
  const useIv = iv == null ? (mon.ivs[stat] == null ? 31 : mon.ivs[stat]) : iv;
  return statValue(stat, base, ev, useIv, monLevel(mon, sp), mon.nature || "Serious", !!sp.isChampions);
}

/* Best current guess at a whole stat line — pinned EVs where the user gave
 * them, the ladder's average otherwise. Used for the stats an interaction
 * does not actually depend on. */
function baselineStats(mon, sp) {
  const out = {};
  for (const stat of STATS) {
    if (mon.evs[stat] != null) out[stat] = monStat(mon, sp, stat, mon.evs[stat]);
    else out[stat] = (sp.averageStats && sp.averageStats[stat]) || monStat(mon, sp, stat, 0);
  }
  return out;
}

/* EVs above the smallest value buying the same stat point are wasted; real
 * spreads almost never carry them, so they are the tie-breaker of last resort. */
function isWastefulEv(mon, sp, stat, ev, iv, rules) {
  if (ev <= 0) return false;
  return monStat(mon, sp, stat, ev, iv) === monStat(mon, sp, stat, ev - rules.step, iv);
}

/* ─── @smogon/calc adapter ───────────────────────────────────────────── */

function getCalc() { return window.MunchSmogonCalc || window.calc || null; }

const CALC_STATUS = {
  Burned: "brn", Poisoned: "psn", "Badly Poisoned": "tox",
  Paralyzed: "par", Asleep: "slp", Frozen: "frz",
};

/* calculate() clones both Pokémon and a clone rebuilds its stats from EVs, so
 * an overridden stat has to be re-applied to every copy or it is silently lost
 * before any damage maths runs. Same reason damage_calc.js wraps clone(). */
function applyExactStats(mon, stats, curHP) {
  for (const k of STATS) { mon.rawStats[k] = stats[k]; mon.stats[k] = stats[k]; }
  mon.originalCurHP = curHP == null ? stats.hp : Math.max(1, Math.min(curHP, stats.hp));
  const inner = mon.clone.bind(mon);
  mon.clone = () => applyExactStats(inner(), stats, curHP);
  return mon;
}

function buildPokemon(mon, sp, stats, opts) {
  const calc = getCalc();
  const ability = opts.ability || mon.ability || sp.topAbility || undefined;
  const p = new calc.Pokemon(9, sp.calcSpecies || sp.name, {
    name: sp.name,
    level: monLevel(mon, sp),
    ability: ability,
    item: opts.item || mon.item || undefined,
    nature: mon.nature || "Serious",
    status: CALC_STATUS[opts.status] || "",
    teraType: opts.tera && mon.tera ? mon.tera : undefined,
    boosts: opts.boosts || {},
    overrides: {
      name: sp.calcSpecies || sp.name,
      types: sp.types && sp.types.length ? sp.types : ["Normal"],
      weightkg: Number(sp.weightkg) || 0,
      baseStats: sp.baseStats,
      abilities: { 0: ability || "" },
    },
  });
  applyExactStats(p, stats, opts.curHP);
  p.types = sp.types && sp.types.length ? sp.types : p.types;
  p.weightkg = Number(sp.weightkg) || p.weightkg || 0;
  return p;
}

function buildMove(move, attackerAbility, attackerItem, obs) {
  const calc = getCalc();
  const overrides = Object.assign({}, move.calcOverrides || {});
  if (!overrides.name) overrides.name = move.calcName || move.name;
  if (move.variableBp) delete overrides.basePower;
  if (obs.bp) overrides.basePower = Number(obs.bp);
  // A spread move that only had one legal target keeps its full power.
  if (move.isSpread && obs.spread === "no") overrides.target = "normal";
  return new calc.Move(9, move.calcName || move.name, {
    ability: attackerAbility || undefined,
    item: attackerItem || undefined,
    isCrit: !!obs.crit,
    hits: obs.hits ? Number(obs.hits) : undefined,
    overrides,
  });
}

function buildField(obs, atkAbility, defAbility) {
  const calc = getCalc();
  // The calc already reads an aura off the attacker or defender itself; these
  // flags are what carries one held by a *third* Pokémon on the field, which in
  // doubles is the usual case (a Xerneas boosting its partner's Fairy moves).
  // Auto-detection stays as a convenience — the boost applies once either way.
  const aura = (name) => atkAbility === name || defAbility === name;
  return new calc.Field({
    gameType: obs.singles ? "Singles" : "Doubles",
    weather: obs.weather || undefined,
    terrain: obs.terrain || undefined,
    isGravity: !!obs.gravity,
    isFairyAura: !!obs.fairyAura || aura("Fairy Aura"),
    isDarkAura: !!obs.darkAura || aura("Dark Aura"),
    isAuraBreak: !!obs.auraBreak || aura("Aura Break"),
    isBeadsOfRuin: !!obs.beadsOfRuin,
    isSwordOfRuin: !!obs.swordOfRuin,
    isTabletsOfRuin: !!obs.tabletsOfRuin,
    isVesselOfRuin: !!obs.vesselOfRuin,
    attackerSide: {
      isHelpingHand: !!obs.helpingHand,
      isBattery: !!obs.battery,
      isPowerSpot: !!obs.powerSpot,
      isSteelySpirit: !!obs.steelySpirit,
    },
    defenderSide: {
      isReflect: !!obs.reflect,
      isLightScreen: !!obs.lightScreen,
      isAuroraVeil: !!obs.auroraVeil,
      isFriendGuard: !!obs.friendGuard,
    },
  });
}

function rollsFromDamage(damage) {
  if (typeof damage === "number") return [damage];
  if (!Array.isArray(damage)) return [];
  if (damage.length && Array.isArray(damage[0])) {
    const n = Math.max.apply(null, damage.map((h) => h.length || 1).concat([1]));
    const out = [];
    for (let i = 0; i < n; i++) {
      let total = 0;
      for (const hit of damage) total += Number(hit[Math.min(i, hit.length - 1)]) || 0;
      out.push(total);
    }
    return out;
  }
  return damage.map((d) => Number(d) || 0);
}

/* Damage rolls for one interaction at a given offensive/defensive stat value.
 * The defender's HP is deliberately left out of the key: damage does not scale
 * with it, so one calc serves every candidate HP. */
function rollsFor(plan, offValue, defValue) {
  const key = `${plan.id}|${offValue}|${defValue}`;
  const hit = rollCache.get(key);
  if (hit) return hit;

  const obs = plan.obs;
  const atkStats = Object.assign({}, plan.atkBase);
  const defStats = Object.assign({}, plan.defBase);
  // Foul Play and friends borrow the target's attacking stat.
  if (plan.offOnDefender) defStats[plan.offKey] = offValue;
  else atkStats[plan.offKey] = offValue;
  defStats[plan.defKey] = defValue;

  const attacker = buildPokemon(plan.atk.mon, plan.atkSp, atkStats, {
    ability: obs.atkAbility, item: obs.atkItem, status: obs.atkStatus,
    tera: obs.atkTera, boosts: plan.atkBoosts,
    curHP: Math.max(1, Math.round(atkStats.hp * (obs.atkHpPct == null ? 100 : obs.atkHpPct) / 100)),
  });
  const defender = buildPokemon(plan.def.mon, plan.defSp, defStats, {
    ability: obs.defAbility, item: obs.defItem, status: obs.defStatus,
    tera: obs.defTera, boosts: plan.defBoosts,
    // Only "was it at full HP" matters here (Multiscale, Tera Shell), and the
    // percentage is scored against the candidate HP separately.
    curHP: plan.defAtFull ? defStats.hp : Math.max(1, defStats.hp - 1),
  });
  const move = buildMove(plan.move, attacker.ability, attacker.item, obs);
  const field = buildField(obs, attacker.ability, defender.ability);

  let rolls = [];
  try {
    rolls = rollsFromDamage(getCalc().calculate(9, attacker, defender, move, field).damage);
  } catch (e) {
    rolls = [];
  }
  rollCache.set(key, rolls);
  return rolls;
}

/* ─── matching an observation against a roll set ─────────────────────── */

/* Likelihood of the 16 damage rolls having produced what was seen.
 *
 * A percentage you read off a bar carries its own error — Showdown rounds, a
 * stream is approximate — so the tolerance is treated as one standard deviation
 * rather than a wall. A hard box makes the likelihood wildly overconfident: a
 * roll 0.99% out counts fully and one 1.01% out counts as impossible, and across
 * eight interactions those cliffs compound until they swamp a prior that is
 * right. Rolls stay hard-zero past HARD_SIGMA so a genuine contradiction is
 * still detected.
 *
 * Exact HP, explicit ranges and KOs stay hard — those are assertions, not reads. */
const HARD_SIGMA = 3;

function matchFraction(rolls, maxHP, obs) {
  if (!rolls.length) return 0;
  let total = 0;
  for (const raw of rolls) total += matchWeight(Number(raw) || 0, maxHP, obs);
  return total / rolls.length;
}

function matchWeight(dmg, maxHP, obs) {
  // Anything but a plain percentage reading is an assertion: match it exactly.
  if (obs.mode !== "pct" || obs.fainted) return matchesOne(dmg, maxHP, obs) ? 1 : 0;
  const before = obs.hpBeforePct == null ? 100 : Number(obs.hpBeforePct);
  const target = before - (Number(obs.hpAfterPct) || 0);
  const sigma = Math.max(Number(obs.tol) == null ? 1 : Number(obs.tol), 0.05);
  const z = ((dmg / maxHP) * 100 - target) / sigma;
  if (Math.abs(z) > HARD_SIGMA) return 0;
  return Math.exp(-0.5 * z * z);
}

function matchesOne(dmg, maxHP, obs) {
  if (obs.mode === "hp") {
    const before = Number(obs.hpBefore) || 0;
    const after = Number(obs.hpAfter) || 0;
    if (!before) return false;
    if (obs.fainted || after <= 0) return dmg >= before;
    return dmg === before - after;
  }
  const dmgPct = (dmg / maxHP) * 100;
  if (obs.mode === "range") {
    return dmgPct >= (Number(obs.pctMin) || 0) - 1e-9
        && dmgPct <= (Number(obs.pctMax) || 100) + 1e-9;
  }
  const before = obs.hpBeforePct == null ? 100 : Number(obs.hpBeforePct);
  if (obs.fainted) return dmgPct >= before - 1e-9;
  const target = before - (Number(obs.hpAfterPct) || 0);
  const tol = obs.tol == null ? 1 : Number(obs.tol);
  return Math.abs(dmgPct - target) <= tol + 1e-9;
}

/* An observation whose exact HP numbers reveal the defender's max HP pins the
 * HP EV outright — the strongest single constraint available. */
function knownMaxHP(obs) {
  if (obs.mode !== "hp") return null;
  const v = Number(obs.maxHp);
  return v > 0 ? v : null;
}

/* ─── speed maths ────────────────────────────────────────────────────── */

function boostMult(stage) {
  const n = clamp(Number(stage) || 0, -6, 6);
  return n >= 0 ? (2 + n) / 2 : 2 / (2 - n);
}

function effectiveSpeed(base, mods) {
  let s = Math.floor(base * boostMult(mods.boost));
  const entry = SPEED_MODS.find((m) => m[0] === mods.mod);
  if (entry && entry[2] !== 1) s = Math.floor(s * entry[2]);
  if (mods.tailwind) s = Math.floor(s * 2);
  if (mods.para) s = Math.floor(s * 0.5);
  return Math.max(0, s);
}

/* 1 when the order is possible, 0.5 on an exact tie (a coin flip decided it),
 * 0 when the order is impossible. */
function speedProb(fastSpe, slowSpe, obs) {
  const faster = obs.trickRoom ? fastSpe < slowSpe : fastSpe > slowSpe;
  if (faster) return 1;
  if (fastSpe === slowSpe) return obs.tie === false ? 0 : 0.5;
  return 0;
}

/* ─── priors ─────────────────────────────────────────────────────────── */

/* Corpus of real spreads for a species: the ladder's own spread distribution
 * plus whatever EV spreads players published for this format. */
function corpusFor(sp) {
  if (sp._corpus) return sp._corpus;
  const rows = [];
  // A Pokémon with no usage line gets a single all-zero placeholder spread so
  // the calc has something to run; treating that as evidence would push every
  // answer towards 0 EVs, so it is left out of the prior entirely.
  for (const u of (sp.hasUsageData ? sp.usageSpreads : []) || []) {
    rows.push({ nature: u.nature, evs: u.evs, ivs: u.ivs, weight: u.weight, source: "usage" });
  }
  const community = sp.communitySpreads || [];
  const communityTotal = community.reduce((a, c) => a + (c.count || 1), 0) || 1;
  for (const c of community) {
    // Published spreads are few but exact — worth as much in total as the
    // ladder's whole distribution, which is huge but noisy.
    rows.push({
      nature: c.nature, evs: c.evs, ivs: c.ivs,
      weight: (c.count || 1) / communityTotal, source: "paste",
      teams: c.teams || [], count: c.count || 1,
    });
  }
  sp._corpus = rows;
  return rows;
}

// Items that say "this thing is here to survive", not "this thing is here to hit".
const BULK_ITEMS = new Set([
  "leftovers", "eviolite", "rocky helmet", "sitrus berry", "covert cloak",
  "safety goggles", "mental herb", "light clay", "aguav berry", "figy berry",
  "iapapa berry", "mago berry", "wiki berry", "clear amulet",
]);

/* How much a Pokémon wants EVs in each stat, on 0..1, read off the things a
 * teamsheet always shows: nature, moves, item, and its own base stats.
 *
 * This is what stands in for usage data when there is none — a Pokémon nobody
 * ladders with still tells you a lot. A Modest sheet has 0 Atk EVs; a set with
 * only physical moves has 0 SpA; Choice Specs is not on a wall. */
function heuristicDesire(mon, sp) {
  const d = { hp: 0.55, atk: 0.35, def: 0.45, spa: 0.35, spd: 0.45, spe: 0.55 };
  const bs = sp.baseStats || {};
  const moves = mon.moves || [];
  const attacking = moves.filter((m) => m && m.category && m.category !== "Status");
  const hasPhys = attacking.some((m) => m.category === "Physical");
  const hasSpec = attacking.some((m) => m.category === "Special");

  if (hasPhys && hasSpec) { d.atk = 0.65; d.spa = 0.65; }
  else if (hasPhys) { d.atk = 0.9; d.spa = 0.02; }
  else if (hasSpec) { d.spa = 0.9; d.atk = 0.02; }
  else if (moves.length) {
    // A full sheet of status moves is a support Pokémon: bulk and speed.
    d.atk = 0.05; d.spa = 0.05; d.hp = 0.8; d.def = 0.6; d.spd = 0.6;
  } else {
    // No moves logged either — the base stats are all that is left to go on.
    if ((bs.atk || 0) > (bs.spa || 0) + 15) { d.atk = 0.7; d.spa = 0.08; }
    else if ((bs.spa || 0) > (bs.atk || 0) + 15) { d.spa = 0.7; d.atk = 0.08; }
  }

  const item = (mon.item || "").toLowerCase();
  if (item === "choice band") { d.atk = 0.95; d.spa = 0.02; }
  else if (item === "choice specs") { d.spa = 0.95; d.atk = 0.02; }
  else if (item === "choice scarf") { d.spe = 0.92; }
  else if (item === "assault vest") { d.spd = 0.8; }
  else if (item === "focus sash") { d.spe = 0.82; d.hp = 0.25; }
  else if (item === "life orb" || item === "expert belt" || item === "booster energy") {
    d.spe = Math.max(d.spe, 0.7);
  } else if (BULK_ITEMS.has(item)) {
    d.hp = 0.85;
    d.def = Math.max(d.def, 0.55);
    d.spd = Math.max(d.spd, 0.55);
  }

  // Nature last, because it is the sharpest signal on the sheet: the stat it
  // lowers is left at 0 essentially always.
  const nature = NATURES[mon.nature];
  if (nature) {
    d[nature[0]] = Math.min(0.97, d[nature[0]] + 0.3);
    d[nature[1]] = 0.02;
  }
  for (const stat of STATS) d[stat] = clamp(d[stat], 0.01, 0.99);
  return d;
}

// How sharply desire bends the EV distribution. At 5, a stat the sheet clearly
// wants is ~150x likelier to be maxed than empty, and vice versa.
const HEURISTIC_SLOPE = 5;

function heuristicPrior(mon, sp, rules) {
  const desire = heuristicDesire(mon, sp);
  const grid = evGrid(rules);
  const out = {};
  for (const stat of STATS) {
    const slope = HEURISTIC_SLOPE * (2 * desire[stat] - 1);
    const raw = grid.map((ev) => Math.exp(slope * (ev / rules.perStat)));
    const total = raw.reduce((a, b) => a + b, 0) || 1;
    const table = new Map();
    grid.forEach((ev, i) => table.set(ev, raw[i] / total));
    out[stat] = table;
  }
  return out;
}

/* Per-stat probability of each EV value, blending the ladder's own spreads with
 * what the teamsheet implies. With no usage data the heuristic carries it alone. */
function buildPriorModel(mon, sp, rules) {
  const grid = evGrid(rules);
  const snap = (v) => {
    const c = clamp(Math.round(Number(v) || 0), 0, rules.perStat);
    return Math.round(c / rules.step) * rules.step;
  };
  const marg = {};
  for (const stat of STATS) marg[stat] = new Map();
  let total = 0;
  for (const row of corpusFor(sp)) {
    // Nature is on the teamsheet, so a spread with a different one tells us
    // nothing about this Pokémon's EVs.
    if (mon.nature && row.nature && row.nature !== mon.nature) continue;
    const w = Number(row.weight) || 0;
    if (w <= 0) continue;
    total += w;
    for (const stat of STATS) {
      const v = snap(row.evs[stat]);
      marg[stat].set(v, (marg[stat].get(v) || 0) + w);
    }
  }
  // The teamsheet reading is a far better backstop than a uniform prior, and
  // it is the whole prior for a Pokémon with no usage line at this rating.
  const heuristic = heuristicPrior(mon, sp, rules);
  const corpusWeight = total > 0 ? 0.7 : 0;
  const p = {};
  for (const stat of STATS) {
    p[stat] = new Map();
    for (const v of grid) {
      const seen = total > 0 ? (marg[stat].get(v) || 0) / total : 0;
      p[stat].set(v, corpusWeight * seen + (1 - corpusWeight) * heuristic[stat].get(v));
    }
  }
  return { p, total, grid, snap, desire: heuristicDesire(mon, sp) };
}

/* Prior probability of one EV value, snapped onto the grid so a hand-typed
 * off-grid number (a pinned 250 where the grid steps by 4) still looks one up. */
function priorP(unit, stat, ev) {
  const table = unit.prior.p[stat];
  const direct = table.get(ev);
  if (direct != null) return direct;
  return table.get(unit.prior.snap(ev)) || 1e-6;
}

/* ─── building the solve model ───────────────────────────────────────── */

function unitKey(teamId, monId) { return teamId + ":" + monId; }

function buildUnits() {
  const units = new Map();
  S.teams.forEach((team, ti) => {
    team.mons.forEach((mon) => {
      const sp = speciesData(mon.species);
      if (!sp) return;
      const rules = sp.evRules || { perStat: 252, total: 508, step: 4, label: "EV", hasIvs: true };
      const unknown = STATS.filter((s) => mon.evs[s] == null);
      const pinnedTotal = STATS.reduce((a, s) => a + (mon.evs[s] || 0), 0);
      units.set(unitKey(team.id, mon.id), {
        key: unitKey(team.id, mon.id),
        team, teamIndex: ti, mon, sp, rules,
        unknown, pinnedTotal,
        prior: buildPriorModel(mon, sp, rules),
        base: baselineStats(mon, sp),
        // Filled in by each pass; seeded from the prior.
        marginal: null,
        tables: null,
        candidates: null,
        notes: [],
      });
    });
  });
  return units;
}

/* Candidate EV values for one stat: the pinned value if the user gave one,
 * otherwise the whole grid. Speed also carries its IV, so a minus-Speed nature
 * gets its 0 IV variant considered without doubling every other dimension. */
function evChoices(unit, stat) {
  const mon = unit.mon;
  const ivs = [];
  const baseIv = mon.ivs[stat] == null ? 31 : mon.ivs[stat];
  ivs.push(baseIv);
  if (stat === "spe" && unit.rules.hasIvs && baseIv === 31 && natureMult(mon.nature, "spe") < 1) {
    ivs.push(0);
  }
  const evs = mon.evs[stat] != null ? [mon.evs[stat]] : evGrid(unit.rules);
  const out = [];
  for (const ev of evs) for (const iv of ivs) out.push({ ev, iv, pinned: mon.evs[stat] != null });
  return out;
}

/* A handful of stat values spanning the full plausible range, for asking
 * "could ANY opposing spread have produced this?" without touching the weights. */
function rangeProbes(unit, stat, count) {
  const values = statDistribution(unit, stat, Infinity).map((r) => r.value);
  if (values.length <= count) return values;
  values.sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(values[Math.round((i * (values.length - 1)) / (count - 1))]);
  }
  return Array.from(new Set(out));
}

/* Top values of a stat we do not know, with probabilities — the previous
 * pass's answer where there is one, the corpus prior otherwise. */
function statDistribution(unit, stat, limit) {
  const mon = unit.mon;
  if (mon.evs[stat] != null) {
    return [{ value: monStat(mon, unit.sp, stat, mon.evs[stat]), p: 1 }];
  }
  const source = (unit.marginal && unit.marginal[stat]) || null;
  const rows = [];
  if (source && source.size) {
    for (const [k, p] of source) rows.push({ ev: Number(k.split("|")[0]), iv: Number(k.split("|")[1]), p });
  } else {
    for (const [ev, p] of unit.prior.p[stat]) rows.push({ ev, iv: mon.ivs[stat] == null ? 31 : mon.ivs[stat], p });
  }
  rows.sort((a, b) => b.p - a.p);
  const top = rows.slice(0, limit || OPPOSING_SAMPLES);
  // Collapse to distinct stat values — several EV amounts often buy the same one.
  const byValue = new Map();
  for (const r of top) {
    const v = monStat(mon, unit.sp, stat, r.ev, r.iv);
    byValue.set(v, (byValue.get(v) || 0) + r.p);
  }
  const sum = Array.from(byValue.values()).reduce((a, b) => a + b, 0) || 1;
  return Array.from(byValue, ([value, p]) => ({ value, p: p / sum }));
}

/* Joint (HP, defence) pairs for an unknown defender, so an attacker's stat can
 * be scored without pretending we know how bulky the target was. */
function defenceDistribution(unit, defKey, limit) {
  const mon = unit.mon;
  if (mon.evs.hp != null && mon.evs[defKey] != null) {
    return [{
      hp: monStat(mon, unit.sp, "hp", mon.evs.hp),
      defValue: monStat(mon, unit.sp, defKey, mon.evs[defKey]),
      p: 1,
    }];
  }
  const rows = [];
  if (unit.joint && unit.joint[defKey] && unit.joint[defKey].size) {
    for (const [k, p] of unit.joint[defKey]) {
      const [hp, dv] = k.split("|").map(Number);
      rows.push({ hp, defValue: dv, p });
    }
  } else {
    for (const row of corpusFor(unit.sp)) {
      if (mon.nature && row.nature && row.nature !== mon.nature) continue;
      const w = Number(row.weight) || 0;
      if (w <= 0) continue;
      const hp = mon.evs.hp != null ? mon.evs.hp : row.evs.hp;
      const dv = mon.evs[defKey] != null ? mon.evs[defKey] : row.evs[defKey];
      rows.push({
        hp: monStat(mon, unit.sp, "hp", hp),
        defValue: monStat(mon, unit.sp, defKey, dv),
        p: w,
      });
    }
    if (!rows.length) {
      rows.push({ hp: unit.base.hp, defValue: unit.base[defKey], p: 1 });
    }
  }
  const merged = new Map();
  for (const r of rows) {
    const k = r.hp + "|" + r.defValue;
    merged.set(k, (merged.get(k) || 0) + r.p);
  }
  const out = Array.from(merged, ([k, p]) => {
    const [hp, dv] = k.split("|").map(Number);
    return { hp, defValue: dv, p };
  }).sort((a, b) => b.p - a.p).slice(0, limit || OPPOSING_SAMPLES);
  const sum = out.reduce((a, b) => a + b.p, 0) || 1;
  out.forEach((r) => { r.p /= sum; });
  return out;
}

/* One damage interaction resolved down to the two Pokémon, the move, and which
 * stat on each side it actually prices. */
function planDamage(obs, units) {
  const atk = slotOf(obs.atk);
  const def = slotOf(obs.def);
  if (!atk || !def || !obs.move) return null;
  const atkUnit = units.get(unitKey(atk.teamId, atk.monId));
  const defUnit = units.get(unitKey(def.teamId, def.monId));
  if (!atkUnit || !defUnit) return null;

  const move = obs.move;
  const physical = move.category === "Physical";
  const offKey = move.overrideOffensiveStat || (physical ? "atk" : "spa");
  const defKey = move.overrideDefensiveStat || (physical ? "def" : "spd");
  const offOnDefender = move.overrideOffensivePokemon === "target";

  const before = obs.mode === "hp"
    ? (knownMaxHP(obs) ? (Number(obs.hpBefore) || 0) / knownMaxHP(obs) * 100 : 100)
    : (obs.hpBeforePct == null ? 100 : Number(obs.hpBeforePct));

  return {
    id: obs.id, obs, move,
    atk, def, atkUnit, defUnit,
    atkSp: atkUnit.sp, defSp: defUnit.sp,
    atkBase: atkUnit.base, defBase: defUnit.base,
    offKey, defKey, offOnDefender,
    // Whose stat line the offensive number belongs to.
    offUnit: offOnDefender ? defUnit : atkUnit,
    atkBoosts: { atk: Number(obs.atkBoostAtk) || 0, spa: Number(obs.atkBoostSpa) || 0 },
    defBoosts: { def: Number(obs.defBoostDef) || 0, spd: Number(obs.defBoostSpd) || 0 },
    defAtFull: before >= 100,
  };
}

function planSpeed(obs, units) {
  const fast = slotOf(obs.fast);
  const slow = slotOf(obs.slow);
  if (!fast || !slow) return null;
  const fastUnit = units.get(unitKey(fast.teamId, fast.monId));
  const slowUnit = units.get(unitKey(slow.teamId, slow.monId));
  if (!fastUnit || !slowUnit) return null;
  return { id: obs.id, obs, fast, slow, fastUnit, slowUnit };
}

/* ─── likelihood tables ──────────────────────────────────────────────── */

function newTable() { return { map: new Map(), count: 0 }; }

function addLL(table, key, prob) {
  const prev = table.map.get(key);
  const ll = prob > 0 ? Math.log(prob) : -Infinity;
  table.map.set(key, prev == null ? ll : prev + ll);
}

/* Score every candidate (HP, defence) pair of `unit` against one hit it took. */
function scoreDefensive(plan, unit, tables) {
  const obs = plan.obs;
  const defKey = plan.defKey;
  const target = defKey === "def" ? tables.hpDef : tables.hpSpd;
  // Where the attacking stat is unknown too (including Foul Play, which reads
  // it off this very Pokémon), marginalise over its current distribution
  // rather than pretending a single value.
  const offDist = statDistribution(plan.offUnit, plan.offKey, OPPOSING_SAMPLES);
  const hpChoices = evChoices(unit, "hp");
  const defChoices = evChoices(unit, defKey);
  const fixedMax = knownMaxHP(obs);

  for (const d of defChoices) {
    const defValue = monStat(unit.mon, unit.sp, defKey, d.ev, d.iv);
    const rollSets = offDist.map((o) => ({ p: o.p, rolls: rollsFor(plan, o.value, defValue) }));
    for (const h of hpChoices) {
      const maxHP = monStat(unit.mon, unit.sp, "hp", h.ev, h.iv);
      // Exact HP numbers name the max HP outright.
      if (fixedMax && maxHP !== fixedMax) { addLL(target, h.ev + "|" + d.ev, 0); continue; }
      let prob = 0;
      for (const r of rollSets) prob += r.p * matchFraction(r.rolls, maxHP, obs);
      addLL(target, h.ev + "|" + d.ev, prob);
    }
  }
  target.count++;
}

/* Score every candidate offensive EV of `unit` against one hit it dealt. */
function scoreOffensive(plan, unit, tables) {
  const obs = plan.obs;
  const offKey = plan.offKey;
  const target = tables.off[offKey] || (tables.off[offKey] = newTable());
  const defDist = defenceDistribution(plan.defUnit, plan.defKey, OPPOSING_SAMPLES);
  const fixedMax = knownMaxHP(obs);

  for (const o of evChoices(unit, offKey)) {
    const offValue = monStat(unit.mon, unit.sp, offKey, o.ev, o.iv);
    let prob = 0;
    for (const d of defDist) {
      // Exact HP numbers name the defender's max HP outright, whatever its
      // own spread distribution currently believes.
      const maxHP = fixedMax || d.hp;
      prob += d.p * matchFraction(rollsFor(plan, offValue, d.defValue), maxHP, obs);
    }
    addLL(target, String(o.ev), prob);
  }
  target.count++;
}

function scoreSpeed(plan, unit, tables) {
  const obs = plan.obs;
  const isFast = plan.fastUnit === unit;
  const other = isFast ? plan.slowUnit : plan.fastUnit;
  const otherMods = isFast ? obs.slowMods : obs.fastMods;
  const ownMods = isFast ? obs.fastMods : obs.slowMods;
  // Deliberately the top few rather than the whole distribution. Widening this
  // is tempting — speed order is a hard inequality and marginalising it costs
  // no calc calls — but measured against a known team it made things worse: the
  // implausible tail dilutes a constraint that should be sharp, and Speed stops
  // discriminating. See the note above OPPOSING_SAMPLES.
  const otherDist = statDistribution(other, "spe", OPPOSING_SAMPLES);

  for (const c of evChoices(unit, "spe")) {
    const own = effectiveSpeed(monStat(unit.mon, unit.sp, "spe", c.ev, c.iv), ownMods);
    let prob = 0;
    for (const o of otherDist) {
      const theirs = effectiveSpeed(o.value, otherMods);
      prob += o.p * (isFast ? speedProb(own, theirs, obs) : speedProb(theirs, own, obs));
    }
    addLL(tables.spe, c.ev + "|" + c.iv, prob);
  }
  tables.spe.count++;
}

/* ─── joining the dimensions ─────────────────────────────────────────── */

/* Which stats any interaction actually says something about. An unconstrained
 * stat is left alone rather than guessed at across the whole grid. */
function constrainedStats(tables) {
  const out = new Set();
  if (tables.hpDef.count) { out.add("hp"); out.add("def"); }
  if (tables.hpSpd.count) { out.add("hp"); out.add("spd"); }
  if (tables.spe.count) out.add("spe");
  for (const key of Object.keys(tables.off)) if (tables.off[key].count) out.add(key);
  return out;
}

function dimensionValues(unit, stat, tables) {
  const rows = [];
  for (const c of evChoices(unit, stat)) {
    let ll = 0;
    if (stat === "spe" && tables.spe.count) {
      const v = tables.spe.map.get(c.ev + "|" + c.iv);
      if (v == null) continue;
      ll = v;
    } else if (stat === "atk" || stat === "spa") {
      const table = tables.off[stat];
      if (table && table.count) {
        const v = table.map.get(String(c.ev));
        if (v == null) continue;
        ll = v;
      }
    }
    if (ll === -Infinity) continue;
    const prior = Math.log(priorP(unit, stat, c.ev))
      + (isWastefulEv(unit.mon, unit.sp, stat, c.ev, c.iv, unit.rules) ? WASTE_PENALTY : 0)
      + (stat === "spe" && c.iv === 0 ? Math.log(0.15) : 0);
    rows.push({ ev: c.ev, iv: c.iv, ll, prior });
  }
  return rows;
}

/* HP is priced jointly with each defence because a hit's percentage depends on
 * both; the two tables are merged here into one (hp, def, spd) surface. */
function defensiveRows(unit, tables, constrained) {
  const wantDef = constrained.has("def");
  const wantSpd = constrained.has("spd");
  const hpChoices = evChoices(unit, "hp");
  const defChoices = wantDef ? evChoices(unit, "def") : [{ ev: unit.mon.evs.def, iv: unit.mon.ivs.def }];
  const spdChoices = wantSpd ? evChoices(unit, "spd") : [{ ev: unit.mon.evs.spd, iv: unit.mon.ivs.spd }];
  const budget = unit.rules.total;
  const rows = [];
  for (const h of hpChoices) {
    const hpPrior = Math.log(priorP(unit, "hp", h.ev))
      + (isWastefulEv(unit.mon, unit.sp, "hp", h.ev, h.iv, unit.rules) ? WASTE_PENALTY : 0);
    for (const d of defChoices) {
      let ll = 0;
      if (wantDef) {
        const v = tables.hpDef.map.get(h.ev + "|" + d.ev);
        if (v == null || v === -Infinity) continue;
        ll += v;
      }
      const defPrior = wantDef
        ? Math.log(priorP(unit, "def", d.ev))
          + (isWastefulEv(unit.mon, unit.sp, "def", d.ev, d.iv, unit.rules) ? WASTE_PENALTY : 0)
        : 0;
      for (const s of spdChoices) {
        let ll2 = ll;
        if (wantSpd) {
          const v = tables.hpSpd.map.get(h.ev + "|" + s.ev);
          if (v == null || v === -Infinity) continue;
          ll2 += v;
        }
        // Three defensive stats alone cannot outspend the budget.
        if ((h.ev || 0) + (d.ev || 0) + (s.ev || 0) > budget) continue;
        const spdPrior = wantSpd
          ? Math.log(priorP(unit, "spd", s.ev))
            + (isWastefulEv(unit.mon, unit.sp, "spd", s.ev, s.iv, unit.rules) ? WASTE_PENALTY : 0)
          : 0;
        rows.push({
          hp: h.ev, def: d.ev, spd: s.ev,
          ll: ll2, prior: hpPrior + defPrior + spdPrior,
        });
      }
    }
  }
  // Loose constraints can leave most of the grid standing; keep the surface
  // bounded rather than building a quarter-million objects nobody will read.
  let trimmed = false;
  if (rows.length > MAX_DEF_ROWS) {
    rows.sort((a, b) => b.ll - a.ll);
    rows.length = MAX_DEF_ROWS;
    trimmed = true;
  }
  return { rows, trimmed };
}

function trimToBudget(lists, cap) {
  let size = lists.reduce((a, l) => a * Math.max(l.length, 1), 1);
  let trimmed = false;
  while (size > cap) {
    let biggest = 0;
    for (let i = 1; i < lists.length; i++) if (lists[i].length > lists[biggest].length) biggest = i;
    if (lists[biggest].length <= 2) break;
    // Trim on evidence alone, never on the prior. A value the rolls rule out is
    // genuinely gone; a value that is merely uncommon has to survive to be
    // ranked, or the search quietly deletes exactly the unusual spreads this
    // tool exists to find before they are ever scored.
    lists[biggest].sort((a, b) => b.ll - a.ll);
    lists[biggest].length = Math.ceil(lists[biggest].length / 2);
    trimmed = true;
    size = lists.reduce((a, l) => a * Math.max(l.length, 1), 1);
  }
  return trimmed;
}

function joinCandidates(unit, tables) {
  const constrained = constrainedStats(tables);
  const free = unit.unknown.filter((s) => !constrained.has(s));
  const solving = unit.unknown.filter((s) => constrained.has(s));
  if (!solving.length) return { candidates: [], constrained, free, trimmed: false };

  const wantDefensive = constrained.has("hp") || constrained.has("def") || constrained.has("spd");
  const defensive = wantDefensive
    ? defensiveRows(unit, tables, constrained)
    : { rows: [{ hp: null, def: null, spd: null, ll: 0, prior: 0 }], trimmed: false };
  const defRows = defensive.rows;
  const atkRows = constrained.has("atk") ? dimensionValues(unit, "atk", tables) : [null];
  const spaRows = constrained.has("spa") ? dimensionValues(unit, "spa", tables) : [null];
  const speRows = constrained.has("spe") ? dimensionValues(unit, "spe", tables) : [null];

  // A dimension with nothing left in it means the interactions contradict each
  // other: report no candidates rather than joining against an empty list.
  const empty = [defRows, atkRows, spaRows, speRows].some((l) => !l.length);
  if (empty) return { candidates: [], constrained, free, trimmed: false, solving };

  const lists = [defRows, atkRows, spaRows, speRows].filter((l) => l.length && l[0] !== null);
  let trimmed = trimToBudget(lists, MAX_COMBOS) || defensive.trimmed;

  // Walk each dimension in ascending EV order. The budget then fails
  // monotonically, so the loops below can break instead of skipping — which is
  // what makes a large space cheap enough to enumerate rather than trim. That
  // matters: measured against a revealed team, trimming was the *only* thing
  // removing true spreads, and it removed them despite excellent likelihoods,
  // simply because thousands of alternatives fit marginally better.
  defRows.sort((a, b) => ((a.hp || 0) + (a.def || 0) + (a.spd || 0))
    - ((b.hp || 0) + (b.def || 0) + (b.spd || 0)));
  for (const list of [atkRows, spaRows, speRows]) {
    if (list.length && list[0] !== null) list.sort((a, b) => a.ev - b.ev);
  }

  const budget = unit.rules.total;
  // Whatever the enumeration already carries must not be counted twice: a
  // pinned stat still appears in its dimension's rows.
  const enumerated = new Set();
  if (defRows[0].hp != null) enumerated.add("hp");
  if (defRows[0].def != null) enumerated.add("def");
  if (defRows[0].spd != null) enumerated.add("spd");
  if (atkRows[0]) enumerated.add("atk");
  if (spaRows[0]) enumerated.add("spa");
  if (speRows[0]) enumerated.add("spe");
  const fixedSum = STATS.reduce(
    (a, s) => a + (enumerated.has(s) ? 0 : (unit.mon.evs[s] || 0)), 0);
  // Most the stats nothing constrained could absorb, used to judge whether a
  // candidate can still reach the full budget.
  const freeCapacity = free.length * unit.rules.perStat;
  // How willing the best available free stat is to receive leftover budget. If
  // the only home is one the sheet rules out, leftover is a mark against the
  // candidate rather than a neutral remainder.
  const desire = (unit.prior && unit.prior.desire) || {};
  const freeDesire = free.length
    ? Math.max.apply(null, free.map((s) => (desire[s] == null ? 0.5 : desire[s])))
    : 1;

  // A spread somebody actually built is worth more than the product of its
  // marginals suggests, so index the corpus on the stats this solve determines
  // and look each candidate up as a whole.
  const determined = STATS.filter((s) => unit.mon.evs[s] != null || enumerated.has(s));
  const corpusIndex = new Map();
  for (const row of corpusFor(unit.sp)) {
    if (unit.mon.nature && row.nature && row.nature !== unit.mon.nature) continue;
    const w = Number(row.weight) || 0;
    if (w <= 0) continue;
    const key = determined.map((s) => unit.prior.snap(row.evs[s])).join("/");
    corpusIndex.set(key, (corpusIndex.get(key) || 0) + w);
  }

  const out = [];
  // A candidate this far below the best fit carries relative weight e^-16 in the
  // softmax: it cannot move the answer, the shares or the confidence bars, so it
  // is never worth storing. Filtering on a running best is what keeps the kept
  // list small enough to enumerate a large space instead of trimming one.
  let bestLl = -Infinity;
  // Same rule as trimToBudget: keep what the evidence supports. The prior is
  // re-applied when the list is ranked, so culling by it here would drop an
  // unusual spread before it ever got the chance to win on fit.
  const prune = () => {
    out.sort((a, b) => b.ll - a.ll);
    out.length = KEEP_CANDIDATES;
    trimmed = true;
  };
  for (const d of defRows) {
    const dSum = (d.hp || 0) + (d.def || 0) + (d.spd || 0);
    if (fixedSum + dSum > budget) break;
    for (const a of atkRows) {
      const aSum = dSum + (a ? a.ev : 0);
      if (fixedSum + aSum > budget) break;
      for (const sa of spaRows) {
        const saSum = aSum + (sa ? sa.ev : 0);
        if (fixedSum + saSum > budget) break;
        for (const sp of speRows) {
          const total = saSum + (sp ? sp.ev : 0);
          if (fixedSum + total > budget) break;
          const ll = d.ll + (a ? a.ll : 0) + (sa ? sa.ll : 0) + (sp ? sp.ll : 0);
          if (!isFinite(ll)) continue;
          // Cheap reject before any object is built: this is what lets the
          // enumeration cover a large space without the kept list exploding.
          if (ll < bestLl - LL_HORIZON) continue;
          if (ll > bestLl) bestLl = ll;
          const evs = {};
          for (const stat of STATS) evs[stat] = unit.mon.evs[stat];
          if (d.hp != null) evs.hp = d.hp;
          if (d.def != null) evs.def = d.def;
          if (d.spd != null) evs.spd = d.spd;
          if (a) evs.atk = a.ev;
          if (sa) evs.spa = sa.ev;
          if (sp) evs.spe = sp.ev;
          const seen = corpusIndex.get(determined.map((s) => evs[s]).join("/")) || 0;
          // Competitive sets spend the whole budget. Only charge for what the
          // unconstrained stats could not possibly soak up — with free stats
          // left this is normally zero, so it bites exactly when the spread is
          // fully determined and still under budget.
          const shortfall = Math.max(0, budget - (fixedSum + total) - freeCapacity);
          // Whatever the solved stats leave has to be dumped on the free ones;
          // charge for that when the best home available is a stat the sheet
          // rules out.
          const leftover = Math.max(0, budget - (fixedSum + total));
          const prior = d.prior + (a ? a.prior : 0) + (sa ? sa.prior : 0) + (sp ? sp.prior : 0)
            + Math.log(1 + 6 * seen)
            + UNSPENT_PENALTY * (shortfall / budget)
            + DUMP_PENALTY * (leftover / budget) * (1 - freeDesire);
          out.push({
            evs, speIv: sp ? sp.iv : null, seen,
            ll, prior, spent: fixedSum + total,
            score: ll + PRIOR_WEIGHT * PRIOR_TEMPER * prior,
          });
          if (out.length >= KEEP_CANDIDATES * 2) prune();
        }
      }
    }
  }

  // The running filter above only saw the best fit found *so far*, so sweep
  // once more now that it is known.
  const floor = bestLl - LL_HORIZON;
  const kept = out.filter((c) => c.ll >= floor);
  kept.sort((a, b) => b.score - a.score);
  return { candidates: kept, constrained, free, trimmed, solving };
}

/* Posterior share of each EV value, taken over the whole candidate list rather
 * than the shown top few — that is the honest "how sure are we" number. */
function marginalsFrom(result, unit) {
  const marg = {};
  for (const stat of STATS) marg[stat] = new Map();
  if (!result.candidates.length) return marg;
  const top = result.candidates[0].score;
  let total = 0;
  const weights = result.candidates.map((c) => {
    const w = Math.exp(c.score - top);
    total += w;
    return w;
  });
  if (!total) return marg;
  result.candidates.forEach((c, i) => {
    const w = weights[i] / total;
    for (const stat of result.solving || []) {
      const iv = stat === "spe" && c.speIv != null ? c.speIv : (unit.mon.ivs[stat] == null ? 31 : unit.mon.ivs[stat]);
      const key = c.evs[stat] + "|" + iv;
      marg[stat].set(key, (marg[stat].get(key) || 0) + w);
    }
  });
  return marg;
}

function jointFrom(result, unit) {
  const joint = { def: new Map(), spd: new Map() };
  if (!result.candidates.length) return joint;
  const top = result.candidates[0].score;
  let total = 0;
  const weights = result.candidates.map((c) => { const w = Math.exp(c.score - top); total += w; return w; });
  if (!total) return joint;
  result.candidates.forEach((c, i) => {
    const w = weights[i] / total;
    const hp = monStat(unit.mon, unit.sp, "hp", c.evs.hp == null ? 0 : c.evs.hp);
    for (const key of ["def", "spd"]) {
      const ev = c.evs[key];
      if (ev == null) continue;
      const k = hp + "|" + monStat(unit.mon, unit.sp, key, ev);
      joint[key].set(k, (joint[key].get(k) || 0) + w);
    }
  });
  return joint;
}

/* ─── joint refinement ───────────────────────────────────────────────── */

/* The marginal passes score each Pokémon against a *distribution* of opposing
 * spreads, so a candidate survives if it works against any plausible opponent.
 * That is correct as far as it goes, but it can report "Garchomp 32 Atk" whose
 * only supporting Kingambit is one the answer for Kingambit then contradicts —
 * two halves of a solve that never have to agree with each other.
 *
 * This pass makes them agree. Every Pokémon is pinned to one concrete spread,
 * and each is re-chosen in turn against the others as they actually stand.
 * Candidates that satisfy every logged interaction always beat ones that do
 * not, whatever usage says: a spread that cannot produce a roll we watched
 * happen is not the answer, however popular it is.
 */
function assignedEvs(unit, assignment) {
  const a = assignment.get(unit.key);
  return a ? a.evs : unit.mon.evs;
}

function assignedStat(unit, assignment, stat) {
  const a = assignment.get(unit.key);
  const evs = a ? a.evs : unit.mon.evs;
  const iv = stat === "spe" && a && a.speIv != null ? a.speIv : undefined;
  return monStat(unit.mon, unit.sp, stat, evs[stat] == null ? 0 : evs[stat], iv);
}

/* Fit of one interaction with both sides pinned. `override` swaps in the
 * candidate being tried for the unit under consideration. */
function jointFit(plan, assignment, unit, override) {
  const evsFor = (u) => (u === unit && override ? override.evs : assignedEvs(u, assignment));
  const ivFor = (u, stat) => {
    if (u === unit && override) return stat === "spe" ? override.speIv : undefined;
    const a = assignment.get(u.key);
    return stat === "spe" && a && a.speIv != null ? a.speIv : undefined;
  };
  const statOf = (u, stat) => {
    const evs = evsFor(u);
    return monStat(u.mon, u.sp, stat, evs[stat] == null ? 0 : evs[stat], ivFor(u, stat));
  };

  if (plan.obs.kind === "speed") {
    const fast = effectiveSpeed(statOf(plan.fastUnit, "spe"), plan.obs.fastMods);
    const slow = effectiveSpeed(statOf(plan.slowUnit, "spe"), plan.obs.slowMods);
    return speedProb(fast, slow, plan.obs);
  }
  const rolls = rollsFor(plan, statOf(plan.offUnit, plan.offKey), statOf(plan.defUnit, plan.defKey));
  const maxHP = knownMaxHP(plan.obs) || statOf(plan.defUnit, "hp");
  return matchFraction(rolls, maxHP, plan.obs);
}

function refineJointly(targets, units, damagePlans, speedPlans, results) {
  const allPlans = damagePlans.concat(speedPlans.map((p) => Object.assign({}, p, { obs: p.obs })));
  const assignment = new Map();

  // Start from each marginal answer, unconstrained stats filled legally.
  for (const unit of units.values()) {
    const entry = results.get(unit.key);
    const best = entry && entry.result.candidates.length ? entry.result.candidates[0] : null;
    const base = best ? best.evs : unit.mon.evs;
    const free = STATS.filter((s) => base[s] == null);
    assignment.set(unit.key, {
      evs: fillRemaining(unit, base, free).evs,
      speIv: best ? best.speIv : null,
      cand: best,
    });
  }

  const plansFor = (unit) => allPlans.filter((p) => p.obs.kind === "speed"
    ? (p.fastUnit === unit || p.slowUnit === unit)
    : (p.defUnit === unit || p.offUnit === unit));

  for (let round = 0; round < JOINT_ROUNDS; round++) {
    let moved = false;
    for (const unit of targets) {
      const entry = results.get(unit.key);
      if (!entry || !entry.result.candidates.length) continue;
      const mine = plansFor(unit);
      if (!mine.length) continue;
      const free = entry.result.free || [];

      let bestPick = null;
      for (const cand of entry.result.candidates.slice(0, JOINT_CANDIDATES)) {
        const filled = fillRemaining(unit, cand.evs, free);
        const override = { evs: filled.evs, speIv: cand.speIv };
        let ll = 0;
        let failures = 0;
        for (const plan of mine) {
          const f = jointFit(plan, assignment, unit, override);
          if (f <= 0) failures++;
          ll += Math.log(Math.max(f, 1e-9));
        }
        const score = ll + PRIOR_WEIGHT * PRIOR_TEMPER * cand.prior;
        // Satisfying every interaction outranks any prior advantage.
        if (!bestPick || failures < bestPick.failures
            || (failures === bestPick.failures && score > bestPick.score)) {
          bestPick = { failures, score, ll, cand, evs: filled.evs, speIv: cand.speIv };
        }
      }
      if (!bestPick) continue;
      const prev = assignment.get(unit.key);
      if (!prev || !prev.cand || prev.cand !== bestPick.cand) moved = true;
      assignment.set(unit.key, {
        evs: bestPick.evs, speIv: bestPick.speIv, cand: bestPick.cand,
        failures: bestPick.failures, jointLl: bestPick.ll,
      });
    }
    if (!moved) break;
  }

  // Final pass: re-score every candidate against the settled assignment, so the
  // table a reader scans is ordered by the same measure that chose the headline.
  // Ranking on the marginal score while picking the headline jointly puts a row
  // at the top that is not the answer, which is indefensible on its face.
  // Cost is low: rolls only vary with the one stat being tried, and they are
  // memoised, so this is arithmetic over an already-warm cache.
  for (const unit of targets) {
    const entry = results.get(unit.key);
    if (!entry || !entry.result.candidates.length) continue;
    const mine = plansFor(unit);
    if (!mine.length) continue;
    const free = entry.result.free || [];
    const ranked = [];
    for (const cand of entry.result.candidates) {
      const filled = fillRemaining(unit, cand.evs, free);
      const override = { evs: filled.evs, speIv: cand.speIv };
      let ll = 0;
      let failures = 0;
      for (const plan of mine) {
        const f = jointFit(plan, assignment, unit, override);
        if (f <= 0) failures++;
        ll += Math.log(Math.max(f, 1e-9));
      }
      ranked.push({
        evs: filled.evs, speIv: cand.speIv, seen: cand.seen, prior: cand.prior,
        spent: filled.spent, over: filled.over, shortfall: filled.shortfall,
        ll, failures, score: ll + PRIOR_WEIGHT * PRIOR_TEMPER * cand.prior,
      });
    }
    ranked.sort((a, b) => (a.failures - b.failures) || (b.score - a.score));
    const slot = assignment.get(unit.key);
    if (slot) {
      slot.ranked = ranked;
      slot.obsCount = mine.length;
    }
  }
  return assignment;
}

/* Every interaction re-checked against the final answer, so the report can
 * never claim a fit the chosen spreads do not actually produce. */
function checkConsistency(assignment, damagePlans, speedPlans) {
  const rows = [];
  for (const plan of damagePlans) {
    const offValue = assignedStat(plan.offUnit, assignment, plan.offKey);
    const defValue = assignedStat(plan.defUnit, assignment, plan.defKey);
    const maxHP = knownMaxHP(plan.obs) || assignedStat(plan.defUnit, assignment, "hp");
    const rolls = rollsFor(plan, offValue, defValue);
    // Count the rolls the solver actually gives credit to, so "0/16" can never
    // sit next to a non-zero fit again.
    const matches = rolls.filter((d) => matchWeight(d, maxHP, plan.obs) > 0).length;
    rows.push({
      plan, kind: "damage",
      label: `${monLabel(plan.atk.mon)} ${plan.move.name} → ${monLabel(plan.def.mon)}`,
      lo: rolls.length ? Math.min.apply(null, rolls) / maxHP * 100 : 0,
      hi: rolls.length ? Math.max.apply(null, rolls) / maxHP * 100 : 0,
      observed: observedLabel(plan.obs),
      matches, total: rolls.length || 16,
      fit: matchFraction(rolls, maxHP, plan.obs),
      units: [plan.offUnit, plan.defUnit],
    });
  }
  for (const plan of speedPlans) {
    const fast = effectiveSpeed(assignedStat(plan.fastUnit, assignment, "spe"), plan.obs.fastMods);
    const slow = effectiveSpeed(assignedStat(plan.slowUnit, assignment, "spe"), plan.obs.slowMods);
    const fit = speedProb(fast, slow, plan.obs);
    rows.push({
      plan, kind: "speed",
      label: `${monLabel(plan.fast.mon)} ${t("moved before")} ${monLabel(plan.slow.mon)}`,
      lo: fast, hi: slow,
      observed: plan.obs.trickRoom ? t("Trick Room") : t("normal order"),
      matches: null, total: null, fit,
      units: [plan.fastUnit, plan.slowUnit],
    });
  }
  return rows;
}

/* ─── the solve run ──────────────────────────────────────────────────── */

let solving = false;
// Kept so Team Output can be rebuilt without re-running the solve.
let lastResults = null;
let lastAssignment = null;

async function runSolve() {
  if (solving) return;
  const calc = getCalc();
  if (!calc) { setStatus(t("The damage engine failed to load. Reload the page and try again."), true); return; }

  solving = true;
  $("sv-solve").disabled = true;
  rollCache.clear();
  setProgress(0);
  setStatus(t("Loading Pokémon data…"));

  try {
    const species = new Set();
    for (const team of S.teams) for (const mon of team.mons) if (mon.species) species.add(mon.species);
    if (!species.size) { setStatus(t("Add at least one team first."), true); return; }

    let loaded = 0;
    for (const name of species) {
      try { await loadSpecies(name, S.community); } catch (e) { /* reported below */ }
      setProgress(++loaded / species.size * 0.25);
    }

    const units = buildUnits();
    const damagePlans = [];
    const speedPlans = [];
    const broken = [];
    for (const obs of S.obs) {
      if (obs.disabled) continue;
      const plan = obs.kind === "damage" ? planDamage(obs, units) : planSpeed(obs, units);
      if (!plan) { broken.push(obs); continue; }
      (obs.kind === "damage" ? damagePlans : speedPlans).push(plan);
    }
    if (!damagePlans.length && !speedPlans.length) {
      setStatus(t("Log at least one complete interaction — an attack with a damage figure, or a speed order."), true);
      renderResults(null);
      return;
    }

    // A move or forme the engine cannot build produces no rolls at all, which
    // would otherwise read as "no spread fits". Catch it here and say so.
    const dead = damagePlans.filter(
      (p) => !rollsFor(p, p.atkBase[p.offKey], p.defBase[p.defKey]).length);
    if (dead.length === damagePlans.length && damagePlans.length) {
      setStatus(`${t("The damage engine could not calculate any of these attacks — check the move and Pokémon names.")}`, true);
      renderResults(null);
      return;
    }
    for (const plan of dead) {
      damagePlans.splice(damagePlans.indexOf(plan), 1);
      broken.push(plan.obs);
    }

    const targets = Array.from(units.values()).filter((u) => u.unknown.length);
    if (!targets.length) {
      setStatus(t("Every spread is already filled in — clear an EV box to solve for it."), true);
      renderResults(null);
      return;
    }

    // One marginal pass, then joint refinement. A second marginal pass sounds
    // like it should help — it feeds each Pokémon the others' answers — but
    // measured against a fully revealed team it consistently made things worse
    // (132 -> 160 stat points of error). It is re-estimating from point guesses
    // and the errors compound; the joint pass does the same job properly, against
    // concrete spreads, and converges instead of drifting.
    const passes = 1;
    let done = 0;
    const work = passes * targets.length;
    let results = new Map();

    for (let pass = 0; pass < passes; pass++) {
      for (const unit of targets) {
        setStatus(passes > 1
          ? `${t("Pass")} ${pass + 1}/${passes} — ${t("solving")} ${monLabel(unit.mon)}…`
          : `${t("Solving")} ${monLabel(unit.mon)}…`);
        await sleep(0);

        const tables = { hpDef: newTable(), hpSpd: newTable(), spe: newTable(), off: {} };
        for (const plan of damagePlans) {
          if (plan.defUnit === unit) scoreDefensive(plan, unit, tables);
          if (plan.offUnit === unit) scoreOffensive(plan, unit, tables);
        }
        for (const plan of speedPlans) {
          if (plan.fastUnit === unit || plan.slowUnit === unit) scoreSpeed(plan, unit, tables);
        }

        const result = joinCandidates(unit, tables);
        result.observations = damagePlans.filter((p) => p.defUnit === unit || p.offUnit === unit).length
          + speedPlans.filter((p) => p.fastUnit === unit || p.slowUnit === unit).length;
        unit.marginal = marginalsFrom(result, unit);
        unit.joint = jointFrom(result, unit);
        unit.tables = tables;
        results.set(unit.key, { unit, result });
        setProgress(0.25 + (++done / work) * 0.72);
      }
    }

    // Pin every Pokémon to one spread and make them agree with each other,
    // then re-check every interaction against that concrete answer.
    setStatus(t("Cross-checking every interaction against the final spreads…"));
    await sleep(0);
    // The "cross-reference" switch now controls the joint rounds, which is where
    // cross-referencing actually happens.
    JOINT_ROUNDS = S.refine ? 3 : 1;
    const assignment = refineJointly(targets, units, damagePlans, speedPlans, results);
    const consistency = checkConsistency(assignment, damagePlans, speedPlans);
    const failed = consistency.filter((r) => r.fit <= 0);

    setProgress(1);
    let note = broken.length
      ? `${t("Solved.")} ${broken.length} ${t("interaction(s) were skipped — fill in every field.")}`
      : t("Solved.");
    if (failed.length) {
      note += ` ${failed.length} ${t("interaction(s) still do not fit — see the consistency check.")}`;
    }
    setStatus(note, failed.length > 0);
    lastResults = results;
    lastAssignment = assignment;
    renderResults({
      results: Array.from(results.values()), damagePlans, speedPlans, units,
      assignment, consistency,
    });
    // Every Pokémon gets a set, not just the ones an interaction touched.
    renderTeamOutput(buildTeamOutput(units, results, assignment));
  } catch (err) {
    console.error(err);
    setStatus(t("Solve failed:") + " " + (err && err.message ? err.message : String(err)), true);
  } finally {
    solving = false;
    $("sv-solve").disabled = false;
    setTimeout(() => setProgress(null), 400);
  }
}

function setStatus(text, isError) {
  const el = $("sv-status");
  el.textContent = text || "";
  el.style.color = isError ? "var(--neg)" : "";
}

function setProgress(fraction) {
  const bar = $("sv-progress");
  if (fraction == null) { bar.hidden = true; return; }
  bar.hidden = false;
  bar.firstElementChild.style.width = Math.round(clamp(fraction, 0, 1) * 100) + "%";
}

/* ─── results rendering ──────────────────────────────────────────────── */

/* "252 HP / 156 Def / 100 SpD". Stats no interaction constrained are marked
 * with a ? so a headline spread never reads as more certain than it is. */
function evString(evs, rules, speIv, guessed) {
  const parts = [];
  for (const stat of STATS) {
    const v = evs[stat];
    if (v == null || v <= 0) continue;
    parts.push(`${v} ${STAT_LABEL[stat]}${guessed && guessed.has(stat) ? "?" : ""}`);
  }
  let out = parts.length ? parts.join(" / ") : t("no investment");
  if (speIv === 0) out += " (0 Spe IV)";
  return out;
}

/* Fill the EVs nothing constrained with the likeliest values that still FIT.
 *
 * Taking each stat's most likely value independently is what produced illegal
 * spreads: pin 252 HP / 156 Def / 100 SpD from the rolls and usage will happily
 * add 252 Atk on top of an already-spent budget. This is a knapsack instead —
 * maximise the summed log-prior over the free stats subject to whatever budget
 * the solved and given EVs left behind, so the result is always legal.
 */
function fillRemaining(unit, baseEvs, freeStats) {
  const rules = unit.rules;
  const evs = Object.assign({}, baseEvs);
  const stats = (freeStats || STATS).filter((s) => evs[s] == null);
  const determined = STATS.reduce((a, s) => a + (evs[s] || 0), 0);
  if (!stats.length) {
    return { evs, spent: determined, over: determined > rules.total, filled: [] };
  }

  const grid = evGrid(rules);
  const buckets = Math.floor(Math.max(0, rules.total - determined) / rules.step);
  const n = stats.length;

  // If maxing every free stat still cannot absorb what the solved stats left
  // over, there is nothing to choose: they are all forced to their cap, and the
  // surplus means the solved stats themselves do not add up.
  const capacity = n * Math.floor(rules.perStat / rules.step);
  if (buckets > capacity) {
    for (const s of stats) evs[s] = rules.perStat;
    const forced = STATS.reduce((a, s) => a + (evs[s] || 0), 0);
    return {
      evs, spent: forced, over: forced > rules.total, filled: stats,
      shortfall: rules.total - forced,
    };
  }

  const desire = (unit.prior && unit.prior.desire) || {};
  // score[i][gi]: how likely stats[i] is to carry grid[gi] EVs.
  //
  // The prior alone is not enough to decide *where* spare points go. When usage
  // says "0" for two stats equally, the deciding vote falls to the leftover
  // heuristic mass — and a distribution concentrated at 0 (a nature-lowered
  // stat) keeps a fatter tail than one spread flat across the whole grid, so it
  // wins at a value it actively dislikes. The two terms below judge the
  // allocation directly instead of through a normalised density.
  const score = stats.map((s) => {
    const want = desire[s] == null ? 0.5 : desire[s];
    return grid.map((ev) => {
      let v = Math.log(priorP(unit, s, ev))
        + (isWastefulEv(unit.mon, unit.sp, s, ev, unit.mon.ivs[s], rules) ? WASTE_PENALTY : 0)
        + DESIRE_WEIGHT * (2 * want - 1) * (ev / rules.perStat);
      // A stat the sheet rules out — above all the one the nature lowers — is
      // where spare points go only when nothing else can hold them.
      if (ev > 0 && want < 0.1) v += LAST_RESORT_PENALTY;
      return v;
    });
  });

  // best[i][b]: best achievable score for stats i.. with b buckets to spend.
  const best = [];
  const pick = [];
  for (let i = 0; i <= n; i++) {
    best.push(new Float64Array(buckets + 1));
    pick.push(new Int32Array(buckets + 1));
  }
  // Once the solved stats are known, the leftover is not a preference — it is a
  // deduction. A set that spends 60 of 66 does not exist, so the fill is
  // *required* to place the remainder and only gets to pick where. Usage saying
  // "0 Speed" must not win that argument: it is evidence about where points go,
  // not about points vanishing. (Capacity was checked above, so a full spend is
  // always reachable from here.)
  for (let b = 0; b <= buckets; b++) best[n][b] = b === 0 ? 0 : -Infinity;
  for (let i = n - 1; i >= 0; i--) {
    for (let b = 0; b <= buckets; b++) {
      let bestScore = -Infinity;
      let bestGi = 0;
      // grid[gi] === gi * step, so the bucket cost of a choice is its index.
      for (let gi = 0; gi < grid.length && gi <= b; gi++) {
        const v = score[i][gi] + best[i + 1][b - gi];
        if (v > bestScore) { bestScore = v; bestGi = gi; }
      }
      best[i][b] = bestScore;
      pick[i][b] = bestGi;
    }
  }
  let left = buckets;
  for (let i = 0; i < n; i++) {
    const gi = pick[i][left];
    evs[stats[i]] = grid[gi];
    left -= gi;
  }
  const spent = STATS.reduce((a, s) => a + (evs[s] || 0), 0);
  return { evs, spent, over: spent > rules.total, filled: stats };
}

function renderResults(payload) {
  const host = $("sv-results");
  if (!payload) { host.innerHTML = ""; return; }
  const { results, damagePlans, speedPlans, assignment, consistency } = payload;
  const html = [];

  if (consistency) html.push(renderConsistency(consistency));

  for (const { unit, result } of results) {
    const rules = unit.rules;
    const slot = assignment && assignment.get(unit.key);
    // One ordering drives the verdict, the headline and the table alike.
    const order = (slot && slot.ranked && slot.ranked.length) ? slot.ranked : result.candidates;
    const mine = (consistency || []).filter((r) => r.units.indexOf(unit) >= 0);
    const unfit = mine.filter((r) => r.fit <= 0);
    const verdict = !result.observations
      ? ["bad", t("No interactions")]
      : !order.length
        ? ["bad", t("No spread fits")]
        : unfit.length
          ? ["bad", t("Contradicted")]
          : order.length === 1
            ? ["ok", t("Pinned")]
            : candidateShare(order)[0] >= 0.6 ? ["ok", t("Confident")] : ["warn", t("Narrowed")];

    html.push(`<div class="sv-result">`);
    html.push(`<div class="sv-result-head">
      <span class="sv-sprite" style="${spriteStyle(unit.sp.sprite)}"></span>
      <b>${esc(monLabel(unit.mon))}</b>
      <span class="sv-team-name">${esc(teamLabel(unit.team, unit.teamIndex))}${unit.mon.nature ? " · " + esc(unit.mon.nature) : ""}</span>
      <span class="sv-verdict ${verdict[0]}">${esc(verdict[1])}</span>
    </div><div class="sv-result-body">`);

    if (!result.observations) {
      html.push(`<div class="sv-flag is-note">${t("Nothing in the log involves this Pokémon, so its EVs are still whatever usage says they are. Add an interaction it took part in.")}</div>`);
    } else if (!result.candidates.length) {
      html.push(`<div class="sv-flag"><b>${t("No spread can produce every number logged.")}</b>${
        t("Usually one of the interactions is missing context — a screen that was up, a crit, a spread move counted as single-target, the wrong item or ability, or a percentage read a little off. Loosen the tolerance on the tightest reading, or disable interactions one at a time to find the culprit.")}</div>`);
    } else {
      const picked = slot;
      const ranked = order;
      const obsCount = (picked && picked.obsCount) || result.observations;
      const share = candidateShare(ranked);
      const freeSet = new Set(result.free);
      const headBest = ranked[0];
      const filled = {
        evs: headBest.evs,
        spent: headBest.spent != null ? headBest.spent
          : STATS.reduce((a, s) => a + (headBest.evs[s] || 0), 0),
        over: !!headBest.over,
        shortfall: headBest.shortfall,
      };
      // The per-stat bars are a view of the same posterior as the table.
      const marginal = picked && picked.ranked
        ? marginalsFrom({ candidates: ranked, solving: result.solving }, unit)
        : unit.marginal;

      if (unfit.length) {
        html.push(`<div class="sv-flag"><b>${
          t("No spread for this Pokémon can produce every roll logged.")}</b>${
          t("The best available answer still fails")} ${unfit.length} ${
          t("interaction(s), listed above. Either some context is missing from one of them — a screen, a crit, an item or ability, a spread move counted as single-target — or the reading is off. If you are confident in all of them, the set may use something the calculator has not been told about.")}</div>`);
      }
      html.push(`<div class="sv-headline">
        <span class="spread">${esc(evString(filled.evs, rules, headBest.speIv, freeSet))}</span>
        <span class="meta">${esc(unit.mon.nature || t("nature unknown"))} · ${
          esc(statLine(unit, filled.evs, headBest.speIv))} · ${t("spends")} <b${
          filled.over ? ' style="color:var(--neg)"' : ""}>${filled.spent}/${rules.total}</b> ${esc(rules.label)}</span>
        <span class="meta" style="margin-left:auto">${t("share")} ${pct(share[0])}</span>
      </div>`);
      if (filled.over) {
        html.push(`<div class="sv-flag"><b>${t("This spread is over the legal limit.")}</b>${
          t("The EVs you pinned by hand already exceed the budget — clear one of the boxes and solve again.")}</div>`);
      } else if (filled.shortfall > 0) {
        html.push(`<div class="sv-flag"><b>${filled.shortfall} ${esc(rules.label)} ${
          t("cannot be placed anywhere.")}</b>${
          t("Even with every unconstrained stat maxed, the solved stats leave more budget than there is room for — so one of the solved stats is too low. Check the interactions feeding this Pokémon.")}</div>`);
      }

      // A percentage read to the nearest point cannot separate two HP values a
      // few points apart, which is usually what leaves a case this wide. One
      // exact HP number pins the whole HP dimension outright.
      const pctOnly = mine.length && mine.every(
        (r) => r.kind === "speed" || (r.plan.obs.mode === "pct" && !knownMaxHP(r.plan.obs)));
      if (pctOnly && share[0] < 0.25 && result.candidates.length > 200) {
        html.push(`<div class="sv-flag is-note">${
          t("Every reading here is a percentage. Percentages cannot tell apart max HP values a few points apart, which is what usually leaves a case this wide. If you can get one exact HP number for this Pokémon — from a replay, or the damage figure in your own battle log — switch that interaction to Exact HP and give its max: it pins HP on its own and typically cuts the search by an order of magnitude.")}</div>`);
      }

      if (result.free.length) {
        const spare = rules.total - STATS.reduce(
          (a, s) => a + (filled.evs[s] != null && !result.free.includes(s) ? filled.evs[s] : 0), 0);
        html.push(`<div class="sv-flag is-note">${t("Not constrained by anything logged:")} <b style="display:inline">${
          result.free.map((s) => STAT_LABEL[s]).join(", ")}</b>. ${
          spare > 0
            ? `${t("The solved stats leave")} <b style="display:inline">${spare} ${esc(rules.label)}</b> ${
                result.free.length === 1
                  ? t("which can only be in that stat.")
                  : t("to split between them — placed where usage and the nature say they most likely went.")}`
            : t("The solved stats already account for the whole budget, so these are empty.")}
          ${t("Log a hit that uses them to pin them down.")}</div>`);
      }
      if (result.trimmed) {
        html.push(`<div class="sv-flag is-note">${t("The search space was too large to enumerate exhaustively, so the least likely values were dropped first. Add more interactions to narrow it properly.")}</div>`);
      }

      html.push(`<div class="sv-sub-h">${t("Candidate spreads")}</div>`);
      html.push(`<div class="sv-msg" style="margin-bottom:7px">${
        t("Ranked by fit and prior together, so the row at the top is the spread above. A common spread that fits decently can outrank a novel one that fits a little better — that is the Prior column earning its place.")}</div>`);
      html.push(`<table class="sv-table"><thead><tr>
        <th>${t("Spread")}</th><th>${t("Share")}</th><th>${t("Fit")}</th>
        <th>${t("Prior")}</th><th>${rules.label}</th><th>${t("Seen in")}</th></tr></thead><tbody>`);
      ranked.slice(0, MAX_SHOWN).forEach((c, i) => {
        const seen = corpusMatches(unit, c);
        html.push(`<tr class="${i === 0 ? "is-best" : ""}">
          <td class="mono">${esc(evString(c.evs, rules, c.speIv))}</td>
          <td class="num">${pct(share[i])}</td>
          <td class="num">${pct(Math.exp(c.ll / Math.max(obsCount, 1)))}</td>
          <td class="num">${Math.exp(c.prior).toExponential(1)}</td>
          <td class="num">${c.spent}</td>
          <td>${seen}</td></tr>`);
      });
      html.push(`</tbody></table>`);
      if (ranked.length > MAX_SHOWN) {
        html.push(`<div class="sv-msg" style="margin-top:6px">${
          ranked.length - MAX_SHOWN} ${t("more spreads also fit; the share column already accounts for them.")}</div>`);
      }

      html.push(`<div class="sv-sub-h">${t("Per-stat confidence")}</div><div class="sv-marginals">`);
      for (const stat of STATS) {
        if (unit.mon.evs[stat] != null) {
          html.push(`<div class="sv-marg is-free"><b>${STAT_LABEL[stat]}</b><div class="free-note">${
            unit.mon.evs[stat]} ${esc(rules.label)} — ${t("given")}</div></div>`);
          continue;
        }
        if (!(result.solving || []).includes(stat)) {
          // Nothing pointed at this stat directly, but the budget still has to
          // balance: whatever the solved stats did not spend has to live in the
          // free ones. With only one free stat left that is arithmetic, not a
          // guess, so say so.
          const value = filled.evs[stat] || 0;
          const soleHome = result.free.length === 1;
          const note = value > 0
            ? (soleHome
              ? `<b style="color:var(--accent)">${value} ${esc(rules.label)}</b> · ${
                  t("the only stat left to hold the remaining budget")}`
              : `<b style="color:var(--accent)">${value} ${esc(rules.label)}</b> · ${
                  t("leftover budget, placed here as the likeliest home")}`)
            : t("unconstrained · nothing left to spend here");
          html.push(`<div class="sv-marg is-free"><b>${STAT_LABEL[stat]}</b>
            <div class="free-note">${note}</div></div>`);
          continue;
        }
        const rows = Array.from((marginal && marginal[stat]) || []).sort((a, b) => b[1] - a[1]).slice(0, 5);
        html.push(`<div class="sv-marg"><b>${STAT_LABEL[stat]}</b>`);
        for (const [key, p] of rows) {
          const [ev, iv] = key.split("|");
          html.push(`<div class="sv-bar"><span class="v">${ev}${iv === "0" && stat === "spe" ? "*" : ""}</span>
            <span class="track"><i style="width:${Math.round(p * 100)}%"></i></span>
            <span class="p">${pct(p, 0)}</span></div>`);
        }
        html.push(`</div>`);
      }
      html.push(`</div>`);

      html.push(renderEvidence(mine));
    }
    html.push(`</div></div>`);
  }

  host.innerHTML = html.join("");
}

function statLine(unit, evs, speIv) {
  return STATS.map((s) => {
    const iv = s === "spe" && speIv != null ? speIv : undefined;
    return monStat(unit.mon, unit.sp, s, evs[s] == null ? 0 : evs[s], iv);
  }).join("/");
}

function candidateShare(candidates) {
  const top = candidates[0].score;
  const w = candidates.map((c) => Math.exp(c.score - top));
  const total = w.reduce((a, b) => a + b, 0) || 1;
  return w.map((x) => x / total);
}

function corpusMatches(unit, cand) {
  const rows = corpusFor(unit.sp);
  const tags = [];
  let usage = 0, pastes = 0;
  for (const row of rows) {
    if (unit.mon.nature && row.nature && row.nature !== unit.mon.nature) continue;
    let same = true;
    for (const stat of STATS) {
      if (cand.evs[stat] == null) continue;
      if ((row.evs[stat] || 0) !== cand.evs[stat]) { same = false; break; }
    }
    if (!same) continue;
    if (row.source === "usage") usage += row.weight;
    else pastes += row.count || 1;
  }
  if (usage > 0) tags.push(`<span class="sv-src usage">${t("ladder")} ${pct(usage, usage < 0.01 ? 2 : 1)}</span>`);
  if (pastes > 0) tags.push(`<span class="sv-src paste">${pastes} ${t("paste(s)")}</span>`);
  return tags.length ? tags.join(" ") : `<span class="sv-src">${t("novel")}</span>`;
}

function interactionRow(r, highlightFailure) {
  const colour = r.fit >= 0.5 ? "var(--pos)" : r.fit > 0 ? "var(--accent)" : "var(--neg)";
  const predicted = r.kind === "speed"
    ? `${r.lo} ${t("vs")} ${r.hi}`
    : `${r.lo.toFixed(1)}–${r.hi.toFixed(1)}%`;
  return `<tr${highlightFailure && r.fit <= 0 ? ' style="background:var(--danger-bg)"' : ""}>
    <td>${esc(r.label)}</td>
    <td class="num">${esc(predicted)}</td>
    <td class="num">${esc(r.observed)}</td>
    <td class="num">${r.total == null ? "—" : `${r.matches}/${r.total}`}</td>
    <td class="num" style="color:${colour}">${pct(r.fit, 0)}</td>
  </tr>`;
}

function interactionTable(rows, highlightFailure) {
  return `<table class="sv-table"><thead><tr>
      <th>${t("Interaction")}</th><th>${t("Predicted")}</th><th>${t("Observed")}</th>
      <th>${t("Rolls")}</th><th>${t("Fit")}</th></tr></thead>
    <tbody>${rows.map((r) => interactionRow(r, highlightFailure)).join("")}</tbody></table>`;
}

/* Every interaction this Pokémon took part in, scored against the FINAL agreed
 * spreads rather than an independent guess at the other side. Guessing the
 * opponent separately from the solve is how a 31% fit could sit directly above
 * a table reporting 0/16 for that same interaction. */
function renderEvidence(rows) {
  if (!rows || !rows.length) return "";
  return `<div class="sv-sub-h">${t("What each interaction says")}</div>`
    + interactionTable(rows, true);
}

/* The verdict on the whole case: do the final spreads actually reproduce every
 * number logged? That is the question the tool exists to answer, so it goes
 * first and it does not hedge. */
function renderConsistency(rows) {
  if (!rows.length) return "";
  const failed = rows.filter((r) => r.fit <= 0);
  const tight = rows.filter((r) => r.fit > 0 && r.fit <= 0.125);
  const head = failed.length
    ? `<div class="sv-flag"><b>${failed.length} ${t("of")} ${rows.length} ${
        t("interactions cannot happen with these spreads.")}</b>${
        t("No legal combination reproduces them all, so either a logged interaction is missing context — a screen, a crit, an item or ability, a spread move counted as single-target — or a reading is off. Until that is settled the spreads below are the closest fit, not an answer.")}</div>`
    : tight.length
      ? `<div class="sv-flag is-note">${t("Every interaction fits, but")} ${tight.length} ${
          t("of them need a roll at the very edge of the range — one more observation would firm this up.")}</div>`
      : `<div class="sv-flag is-note">${t("Every interaction logged is reproducible with the spreads below.")}</div>`;

  return `<div class="sv-result">
    <div class="sv-result-head">
      <b>${t("Consistency check")}</b>
      <span class="sv-team-name">${t("every interaction re-run against the final spreads")}</span>
      <span class="sv-verdict ${failed.length ? "bad" : "ok"}">${
        failed.length ? `${failed.length} ${t("unexplained")}` : t("all explained")}</span>
    </div>
    <div class="sv-result-body">${head}${interactionTable(rows, true)}</div>
  </div>`;
}

function bestGuessEv(unit, stat) {
  if (unit.mon.evs[stat] != null) return unit.mon.evs[stat];
  const source = (unit.marginal && unit.marginal[stat]) || null;
  if (source && source.size) {
    const top = Array.from(source).sort((a, b) => b[1] - a[1])[0];
    return Number(top[0].split("|")[0]);
  }
  const prior = Array.from(unit.prior.p[stat]).sort((a, b) => b[1] - a[1])[0];
  return prior ? prior[0] : 0;
}

function observedLabel(obs) {
  if (obs.mode === "hp") {
    return obs.fainted ? `${obs.hpBefore} → KO` : `${obs.hpBefore} → ${obs.hpAfter}`;
  }
  if (obs.mode === "range") return `${obs.pctMin}–${obs.pctMax}%`;
  const before = obs.hpBeforePct == null ? 100 : obs.hpBeforePct;
  return obs.fainted ? `${before}% → KO` : `${before}% → ${obs.hpAfterPct || 0}%`;
}

/* ─── team output ────────────────────────────────────────────────────── */

/* One complete, legal set per Pokémon: solved EVs where the interactions
 * settled them, pinned EVs where you gave them, and the likeliest legal values
 * everywhere else. Every Pokémon gets one, including those no interaction
 * touched — those fall back to usage, or to the teamsheet reading when the
 * Pokémon has no usage line at all. */
function buildTeamOutput(units, resultsByKey, assignment) {
  const teams = [];
  S.teams.forEach((team, ti) => {
    const rows = [];
    for (const mon of team.mons) {
      const unit = units.get(unitKey(team.id, mon.id));
      if (!unit) {
        rows.push({ mon, missing: true });
        continue;
      }
      const entry = resultsByKey ? resultsByKey.get(unit.key) : null;
      const result = entry ? entry.result : null;
      const best = result && result.candidates.length ? result.candidates[0] : null;
      const solved = new Set(best ? (result.solving || []) : []);
      const given = new Set(STATS.filter((s) => mon.evs[s] != null));
      // Prefer the jointly-agreed spread so the paste matches the headline and
      // the consistency check rather than this Pokémon's marginal favourite.
      const picked = assignment && assignment.get(unit.key);
      const base = picked && picked.cand ? picked.cand.evs
        : (best ? best.evs : Object.assign({}, mon.evs));
      const free = STATS.filter((s) => base[s] == null);
      const filled = picked && picked.cand
        ? { evs: picked.evs, filled: free,
            spent: STATS.reduce((a, s) => a + (picked.evs[s] || 0), 0),
            over: STATS.reduce((a, s) => a + (picked.evs[s] || 0), 0) > unit.rules.total }
        : fillRemaining(unit, base, free);
      rows.push({
        mon, unit, filled, solved, given,
        inferred: new Set(filled.filled),
        speIv: picked && picked.cand ? picked.speIv : (best ? best.speIv : null),
        confidence: best && result.candidates.length
          ? candidateShare(result.candidates)[0] : null,
        observations: result ? result.observations : 0,
        source: unit.sp.hasUsageData ? "usage" : "sheet",
      });
    }
    teams.push({ team, index: ti, rows });
  });
  return teams;
}

/* Showdown export text for one solved team, ready to paste into the builder. */
function teamPaste(entry) {
  const out = [];
  for (const row of entry.rows) {
    if (row.missing) continue;
    const mon = row.mon;
    const head = mon.nickname && mon.nickname !== mon.species
      ? `${mon.nickname} (${mon.species})` : mon.species;
    const lines = [mon.item ? `${head} @ ${mon.item}` : head];
    if (mon.ability) lines.push(`Ability: ${mon.ability}`);
    lines.push(`Level: ${monLevel(mon, row.unit.sp)}`);
    if (mon.tera) lines.push(`Tera Type: ${mon.tera}`);
    const evs = STATS.filter((s) => (row.filled.evs[s] || 0) > 0)
      .map((s) => `${row.filled.evs[s]} ${STAT_LABEL[s]}`);
    if (evs.length) lines.push(`EVs: ${evs.join(" / ")}`);
    if (mon.nature) lines.push(`${mon.nature} Nature`);
    if (row.speIv === 0) lines.push("IVs: 0 Spe");
    for (const m of mon.moves || []) lines.push(`- ${m.name}`);
    out.push(lines.join("\n"));
  }
  return out.join("\n\n");
}

function renderTeamOutput(teams) {
  const host = $("sv-output");
  if (!teams || !teams.length) { host.innerHTML = ""; return; }
  const html = [];
  for (const entry of teams) {
    const rules = entry.rows.find((r) => r.unit)
      ? entry.rows.find((r) => r.unit).unit.rules : { total: 508, label: "EV" };
    html.push(`<div class="sv-result">
      <div class="sv-result-head">
        <b>${esc(teamLabel(entry.team, entry.index))}</b>
        ${entry.team.player ? `<span class="sv-team-name">${esc(entry.team.player)}</span>` : ""}
        <span style="flex:1"></span>
        <button type="button" class="sv-btn is-small" data-copy-team="${entry.team.id}">${t("Copy paste")}</button>
      </div>
      <div class="sv-result-body">`);

    if (!entry.rows.length) {
      html.push(`<div class="sv-msg">${t("No Pokémon on this team yet.")}</div>`);
    } else {
      html.push(`<table class="sv-table"><thead><tr>
        <th></th><th>${t("Pokémon")}</th><th>${t("Spread")}</th>
        <th>${rules.label}</th><th>${t("Stats")}</th><th>${t("Based on")}</th></tr></thead><tbody>`);
      for (const row of entry.rows) {
        if (row.missing) {
          html.push(`<tr><td></td><td>${esc(row.mon.species || t("unknown"))}</td>
            <td colspan="4" style="color:var(--text-dim)">${t("no data loaded for this Pokémon")}</td></tr>`);
          continue;
        }
        const basis = row.observations
          ? `${row.observations} ${t("interaction(s)")}`
          : (row.source === "usage" ? t("usage only") : t("teamsheet only"));
        html.push(`<tr>
          <td><span class="sv-sprite" style="${spriteStyle(row.unit.sp.sprite)};width:32px;height:24px;background-size:384px auto;display:block"></span></td>
          <td>${esc(monLabel(row.mon))}${row.mon.nature ? `<br><span style="color:var(--text-dim);font-size:11px">${esc(row.mon.nature)}</span>` : ""}</td>
          <td class="mono">${evCells(row, rules)}</td>
          <td class="num"${row.filled.over ? ' style="color:var(--neg)"' : ""}>${row.filled.spent}/${rules.total}</td>
          <td class="num">${esc(statLine(row.unit, row.filled.evs, row.speIv))}</td>
          <td>${esc(basis)}${row.confidence != null
            ? ` <span class="sv-src">${pct(row.confidence, 0)}</span>` : ""}</td>
        </tr>`);
      }
      html.push(`</tbody></table>`);
      html.push(`<div class="sv-sub-h">${t("Showdown paste")}</div>
        <pre class="sv-paste" data-paste-for="${entry.team.id}">${esc(teamPaste(entry))}</pre>`);
    }
    html.push(`</div></div>`);
  }
  html.push(`<div class="sv-msg" style="margin-top:4px">
    <span class="sv-ev-solved">&#9632;</span> ${t("solved from interactions")} &nbsp;
    <span class="sv-ev-given">&#9632;</span> ${t("you gave it")} &nbsp;
    <span class="sv-ev-inferred">&#9632;</span> ${t("inferred from usage / teamsheet")}</div>`);
  host.innerHTML = html.join("");
}

function evCells(row, rules) {
  const parts = [];
  for (const stat of STATS) {
    const v = row.filled.evs[stat] || 0;
    if (!v) continue;
    const cls = row.given.has(stat) ? "sv-ev-given"
      : row.solved.has(stat) ? "sv-ev-solved" : "sv-ev-inferred";
    parts.push(`<span class="${cls}">${v} ${STAT_LABEL[stat]}</span>`);
  }
  if (row.speIv === 0) parts.push(`<span class="sv-ev-solved">0 Spe IV</span>`);
  return parts.length ? parts.join(" / ") : t("no investment");
}

/* Team output can be built without a solve — the priors alone already give a
 * best guess for every Pokémon, which is the whole answer for one no
 * interaction touched. */
async function buildOutputOnly() {
  const btn = $("sv-build-sets");
  btn.disabled = true;
  setStatus(t("Loading Pokémon data…"));
  try {
    const species = new Set();
    for (const team of S.teams) for (const mon of team.mons) if (mon.species) species.add(mon.species);
    if (!species.size) { setStatus(t("Add at least one team first."), true); return; }
    for (const name of species) {
      try { await loadSpecies(name, S.community); } catch (e) { /* row says "no data" */ }
    }
    renderTeamOutput(buildTeamOutput(buildUnits(), lastResults, lastAssignment));
    setStatus(lastResults
      ? t("Sets rebuilt from the last solve.")
      : t("Sets built from usage and the teamsheets — log interactions and solve to pin them down."));
  } catch (err) {
    setStatus(err.message || String(err), true);
  } finally {
    btn.disabled = false;
  }
}

/* ─── team UI ────────────────────────────────────────────────────────── */

function renderTeams() {
  const tabs = $("sv-team-tabs");
  const body = $("sv-team-body");
  if (!S.teams.length) {
    tabs.innerHTML = "";
    body.innerHTML = `<div class="sv-empty">${t("No teams yet. Add one and paste a teamsheet — Open Team Sheets from the stream work fine, EVs and all missing.")}</div>`;
    return;
  }
  if (!S.teams.some((x) => x.id === S.activeTeam)) S.activeTeam = S.teams[0].id;

  tabs.innerHTML = S.teams.map((team, i) => `<button type="button" class="sv-team-tab${
    team.id === S.activeTeam ? " is-active" : ""}" data-team="${team.id}"><span class="sv-dot"></span>`
    + `<span class="sv-team-label">${esc(teamLabel(team, i))}</span>`
    + `<span style="color:var(--text-dim);font-weight:400">${team.mons.length}</span></button>`).join("");

  const team = teamById(S.activeTeam);
  const index = S.teams.indexOf(team);
  body.innerHTML = `
    <div class="sv-team-meta">
      <label class="sv-field"><span>${t("Team name")}</span>
        <input type="text" data-team-field="name" value="${esc(team.name)}" placeholder="${esc(teamLabel(team, index))}" style="width:180px"></label>
      <label class="sv-field"><span>${t("Player")}</span>
        <input type="text" data-team-field="player" value="${esc(team.player)}" placeholder="${t("optional")}" style="width:160px"></label>
      <div class="sv-spacer" style="flex:1"></div>
      <button type="button" class="sv-btn is-danger" data-remove-team="${team.id}">${t("Delete team")}</button>
    </div>
    <div class="sv-import">
      <textarea data-team-field="paste" placeholder="${t("Paste a Showdown export or a pokepast.es link, then Import.")}">${esc(team.paste)}</textarea>
      <div class="sv-import-row">
        <button type="button" class="sv-btn" id="sv-do-import">${t("Import teamsheet")}</button>
        <button type="button" class="sv-btn" id="sv-clear-roster">${t("Clear roster")}</button>
        <span style="flex:1"></span>
        <input type="text" id="sv-add-species" placeholder="${t("or add one Pokémon by name")}" style="width:200px">
        <button type="button" class="sv-btn" id="sv-do-add-mon">${t("Add")}</button>
      </div>
      <div class="sv-import-row"><span class="sv-msg" id="sv-import-msg"></span></div>
    </div>
    ${team.mons.length
      ? `<div class="sv-roster">${team.mons.map((m) => renderMon(team, m)).join("")}</div>`
      : `<div class="sv-empty">${t("Nothing imported yet.")}</div>`}`;
}

function renderMon(team, mon) {
  const sp = speciesData(mon.species);
  const rules = (sp && sp.evRules) || { perStat: 252, total: 508, step: 4, label: "EV" };
  const unknownCount = STATS.filter((s) => mon.evs[s] == null).length;
  const spent = STATS.reduce((a, s) => a + (mon.evs[s] || 0), 0);
  const over = spent > rules.total;
  const abilities = sp ? (sp.allAbilities || []).map((a) => a.name) : [];
  if (mon.ability && !abilities.includes(mon.ability)) abilities.unshift(mon.ability);

  return `<div class="sv-mon ${unknownCount ? "is-unknown" : "is-known"}" data-mon="${mon.id}">
    <div class="sv-mon-top">
      <span class="sv-sprite" style="${spriteStyle(sp ? sp.sprite : mon.sprite)}"></span>
      <span class="sv-mon-name">
        <b>${esc(mon.species || t("unknown"))}</b>
        <small>${esc(mon.nickname && mon.nickname !== mon.species ? mon.nickname + " · " : "")}${
          sp ? esc(STATS.map((s) => sp.baseStats[s]).join("/")) : t("loading…")}</small>
      </span>
      <button type="button" class="sv-btn is-small is-danger" data-remove-mon="${mon.id}" title="${t("Remove")}">&times;</button>
    </div>
    <div class="sv-mon-fields">
      <label>${t("Item")}<input type="text" data-mon-field="item" list="sv-items-${mon.id}"
        value="${esc(mon.item)}" placeholder="${t("none")}">
        <datalist id="sv-items-${mon.id}">${
          (sp ? sp.allItems || [] : []).slice(0, 40).map((it) => `<option value="${esc(it.name)}"></option>`).join("")
        }</datalist></label>
      <label>${t("Ability")}<select data-mon-field="ability">
        <option value="">${t("(unknown)")}</option>
        ${abilities.map((a) => `<option value="${esc(a)}"${a === mon.ability ? " selected" : ""}>${esc(a)}</option>`).join("")}
      </select></label>
      <label>${t("Nature")}<select data-mon-field="nature">
        <option value="">${t("(unknown)")}</option>
        ${NATURE_NAMES.map((n) => `<option value="${n}"${n === mon.nature ? " selected" : ""}>${n}</option>`).join("")}
      </select></label>
      <label>${t("Tera")}<select data-mon-field="tera">
        <option value="">${t("(none)")}</option>
        ${TYPES.map((ty) => `<option value="${ty}"${ty === mon.tera ? " selected" : ""}>${ty}</option>`).join("")}
      </select></label>
    </div>
    <div class="sv-evs">
      ${STATS.map((s) => `<label><span>${STAT_LABEL[s]}</span>
        <input type="number" min="0" max="${rules.perStat}" step="${rules.step}"
          class="${mon.evs[s] == null ? "is-blank" : ""}" data-ev="${s}"
          value="${mon.evs[s] == null ? "" : mon.evs[s]}" placeholder="?"></label>`).join("")}
    </div>
    <div class="sv-ev-foot">
      <span>${unknownCount
        ? `${unknownCount} ${t("unknown")} · ${t("blank = solve for it")}`
        : t("fully known — used as a reference")}</span>
      <span class="${over ? "over" : ""}">${spent}/${rules.total} ${esc(rules.label)}</span>
    </div>
  </div>`;
}

async function importPaste() {
  const team = teamById(S.activeTeam);
  if (!team) return;
  const msg = $("sv-import-msg");
  const text = (team.paste || "").trim();
  if (!text) { msg.textContent = t("Paste something first."); msg.className = "sv-msg is-err"; return; }
  msg.textContent = t("Importing…");
  msg.className = "sv-msg";
  try {
    const resp = await fetch("/api/calc/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, format: S.format }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || t("Import failed."));
    const sets = data.sets || [];
    if (!sets.length) throw new Error(t("No Pokémon found in that paste."));
    team.mons = sets.map(newMon);
    save();
    // Pull base stats before re-rendering so the cards land with real numbers.
    await hydrateSpecies(team);
    renderObs();
    const done = $("sv-import-msg");
    if (done) {
      done.textContent = `${sets.length} ${t("imported.")}`
        + (data.warnings && data.warnings.length ? " " + data.warnings.join(" ") : "");
      done.className = "sv-msg is-ok";
    }
  } catch (err) {
    msg.textContent = err.message || String(err);
    msg.className = "sv-msg is-err";
  }
}

/* Add one Pokémon by name — for the half of a battle you only saw pieces of,
 * where there is no teamsheet to paste. */
async function addMonByName(name) {
  const team = teamById(S.activeTeam);
  const msg = $("sv-import-msg");
  if (!team || !name.trim()) return;
  msg.textContent = t("Looking up…");
  msg.className = "sv-msg";
  try {
    const sp = await loadSpecies(name.trim(), false);
    const mon = newMon(null);
    mon.species = sp.name;
    mon.sprite = sp.sprite;
    mon.ability = sp.topAbility || "";
    mon.item = sp.topItem || "";
    team.mons.push(mon);
    save();
    renderTeams();
    renderObs();
    const done = $("sv-import-msg");
    if (done) { done.textContent = `${sp.name} ${t("added.")}`; done.className = "sv-msg is-ok"; }
  } catch (err) {
    msg.textContent = `${t("No Pokémon found for")} "${name.trim()}".`;
    msg.className = "sv-msg is-err";
  }
}

/* Pull base stats and priors for a roster so the cards can show real numbers
 * before anyone hits Solve. */
async function hydrateSpecies(team) {
  const names = Array.from(new Set(team.mons.map((m) => m.species).filter(Boolean)));
  for (const name of names) {
    try { await loadSpecies(name, false); } catch (e) { /* leave the card in its loading state */ }
  }
  renderTeams();
}

async function hydrateAll() {
  for (const team of S.teams) await hydrateSpecies(team);
  renderObs();
}

/* ─── observation UI ─────────────────────────────────────────────────── */

function newDamageObs() {
  return {
    id: uid(), kind: "damage",
    atk: {}, def: {}, move: null,
    mode: "pct", hpBeforePct: 100, hpAfterPct: 50, fainted: false, tol: 1,
    hpBefore: "", hpAfter: "", maxHp: "",
    pctMin: 40, pctMax: 60,
    crit: false, spread: "auto", hits: "", bp: "",
    helpingHand: false, reflect: false, lightScreen: false, auroraVeil: false, friendGuard: false,
    battery: false, powerSpot: false, steelySpirit: false, gravity: false, singles: false,
    beadsOfRuin: false, swordOfRuin: false, tabletsOfRuin: false, vesselOfRuin: false,
    fairyAura: false, darkAura: false, auraBreak: false,
    atkTera: false, defTera: false,
    atkBoostAtk: 0, atkBoostSpa: 0, defBoostDef: 0, defBoostSpd: 0,
    weather: "", terrain: "", atkStatus: "", defStatus: "",
    atkItem: "", atkAbility: "", defItem: "", defAbility: "",
    atkHpPct: 100, note: "", disabled: false, collapsed: false,
  };
}

function newSpeedObs() {
  const mods = () => ({ tailwind: false, para: false, boost: 0, mod: "" });
  return {
    id: uid(), kind: "speed",
    fast: {}, slow: {},
    fastMods: mods(), slowMods: mods(),
    trickRoom: false, tie: true, note: "", disabled: false, collapsed: false,
  };
}

/* One-line summary of a logged interaction, so a collapsed card still reads as
 * a log entry rather than just a row number. */
function obsSummary(obs) {
  if (obs.kind === "speed") {
    const fast = slotOf(obs.fast);
    const slow = slotOf(obs.slow);
    if (!fast || !slow) return t("incomplete");
    return `${monLabel(fast.mon)} ${t("moved before")} ${monLabel(slow.mon)}`
      + (obs.trickRoom ? ` · ${t("Trick Room")}` : "");
  }
  const atk = slotOf(obs.atk);
  const def = slotOf(obs.def);
  if (!atk || !def || !obs.move) return t("incomplete");
  const tags = [];
  if (obs.crit) tags.push(t("crit"));
  if (obs.helpingHand) tags.push("Helping Hand");
  if (obs.reflect) tags.push("Reflect");
  if (obs.lightScreen) tags.push("Light Screen");
  if (obs.auroraVeil) tags.push("Aurora Veil");
  if (obs.friendGuard) tags.push("Friend Guard");
  if (obs.atkTera || obs.defTera) tags.push("Tera");
  return `${monLabel(atk.mon)} — ${obs.move.name} → ${monLabel(def.mon)} · ${observedLabel(obs)}`
    + (tags.length ? ` · ${tags.join(", ")}` : "");
}

function collapseButton(obs) {
  return `<button type="button" class="sv-collapse" data-collapse="${obs.id}"
    aria-expanded="${obs.collapsed ? "false" : "true"}"
    title="${obs.collapsed ? t("Expand") : t("Collapse")}">${obs.collapsed ? "&#9656;" : "&#9662;"}</button>`;
}

function slotOptions(ref) {
  const slots = allSlots();
  const opts = [`<option value="">${t("— pick —")}</option>`];
  for (const s of slots) {
    const value = s.teamId + "|" + s.monId;
    const selected = ref && ref.teamId === s.teamId && ref.monId === s.monId;
    opts.push(`<option value="${value}"${selected ? " selected" : ""}>${esc(s.label)}</option>`);
  }
  return opts.join("");
}

function moveOptions(obs) {
  const slot = slotOf(obs.atk);
  const moves = slot ? slot.mon.moves || [] : [];
  const current = obs.move;
  const opts = [`<option value="">${t("— move —")}</option>`];
  const seen = new Set();
  for (const m of moves) {
    if (m.category === "Status") continue;
    seen.add(m.name);
    opts.push(`<option value="${esc(m.name)}"${current && current.name === m.name ? " selected" : ""}>${esc(m.name)}</option>`);
  }
  if (current && !seen.has(current.name)) {
    opts.push(`<option value="${esc(current.name)}" selected>${esc(current.name)}</option>`);
  }
  return opts.join("");
}

function renderObs() {
  const host = $("sv-obs-list");
  if (!S.obs.length) {
    host.innerHTML = `<div class="sv-empty">${t("No interactions logged. Add the first attack you remember — even a rough percentage narrows things down.")}</div>`;
    return;
  }
  host.innerHTML = S.obs.map((o, i) => o.kind === "damage" ? renderDamageObs(o, i) : renderSpeedObs(o, i)).join("");
}

function checkbox(obs, field, label, title) {
  return `<label class="sv-check"${title ? ` title="${esc(title)}"` : ""}>
    <input type="checkbox" data-obs="${obs.id}" data-field="${field}"${obs[field] ? " checked" : ""}> ${esc(label)}</label>`;
}

function numField(obs, field, label, min, max, step, width) {
  return `<label class="sv-field"><span>${esc(label)}</span>
    <input type="number" data-obs="${obs.id}" data-field="${field}" value="${obs[field] == null ? "" : obs[field]}"
      ${min != null ? `min="${min}"` : ""} ${max != null ? `max="${max}"` : ""} ${step ? `step="${step}"` : ""}
      style="width:${width || 62}px"></label>`;
}

function selectField(obs, field, label, options, width) {
  return `<label class="sv-field"><span>${esc(label)}</span>
    <select data-obs="${obs.id}" data-field="${field}" style="width:${width || 110}px">${options}</select></label>`;
}

function renderDamageObs(obs, i) {
  let observed;
  if (obs.mode === "hp") {
    observed = `${numField(obs, "hpBefore", t("HP before"), 0, null, 1, 70)}
      <span class="sv-arrow">&rarr;</span>
      ${numField(obs, "hpAfter", t("HP after"), 0, null, 1, 70)}
      ${numField(obs, "maxHp", t("Max HP (opt)"), 0, null, 1, 84)}
      ${checkbox(obs, "fainted", t("Fainted"))}`;
  } else if (obs.mode === "range") {
    observed = `${numField(obs, "pctMin", t("Min %"), 0, 999, 0.1, 70)}
      <span class="sv-arrow">–</span>
      ${numField(obs, "pctMax", t("Max %"), 0, 999, 0.1, 70)}`;
  } else {
    observed = `${numField(obs, "hpBeforePct", t("HP before %"), 0, 100, 0.1, 78)}
      <span class="sv-arrow">&rarr;</span>
      ${numField(obs, "hpAfterPct", t("HP after %"), 0, 100, 0.1, 78)}
      ${numField(obs, "tol", t("± tol %"), 0, 50, 0.1, 66)}
      ${checkbox(obs, "fainted", t("Fainted"))}`;
  }

  return `<div class="sv-obs${obs.disabled ? " is-off" : ""}${obs.collapsed ? " is-collapsed" : ""}" data-obs-card="${obs.id}">
    <div class="sv-obs-head" data-collapse-zone="${obs.id}">
      ${collapseButton(obs)}
      <span class="sv-obs-tag dmg">${t("Damage")} ${i + 1}</span>
      <span class="sv-obs-title">${esc(obsSummary(obs))}</span>
      ${checkbox(obs, "disabled", t("Ignore"), t("Leave the interaction logged but out of the solve — useful for finding a contradictory reading."))}
      <button type="button" class="sv-btn is-small is-danger" data-remove-obs="${obs.id}">&times;</button>
    </div>
    <div class="sv-obs-body">
      <div class="sv-row">
        <span class="sv-row-label">${t("Attack")}</span>
        ${selectField(obs, "atk", t("Attacker"), slotOptions(obs.atk), 210)}
        ${selectField(obs, "move", t("Move"), moveOptions(obs), 160)}
        <label class="sv-field"><span>${t("or type")}</span>
          <input type="text" data-obs="${obs.id}" data-field="moveText" value=""
            placeholder="${t("any move")}" style="width:130px"></label>
        <span class="sv-arrow">&rarr;</span>
        ${selectField(obs, "def", t("Defender"), slotOptions(obs.def), 210)}
      </div>
      <div class="sv-row">
        <span class="sv-row-label">${t("Damage")}</span>
        ${selectField(obs, "mode", t("Read as"), [
          ["pct", t("HP %")], ["hp", t("Exact HP")], ["range", t("% range")],
        ].map(([v, l]) => `<option value="${v}"${obs.mode === v ? " selected" : ""}>${esc(l)}</option>`).join(""), 100)}
        ${observed}
      </div>
      <div class="sv-row">
        <span class="sv-row-label">${t("Context")}</span>
        <div class="sv-checkbank">
          ${checkbox(obs, "crit", t("Critical hit"))}
          ${checkbox(obs, "helpingHand", t("Helping Hand"))}
          ${checkbox(obs, "reflect", t("Reflect"))}
          ${checkbox(obs, "lightScreen", t("Light Screen"))}
          ${checkbox(obs, "auroraVeil", t("Aurora Veil"))}
          ${checkbox(obs, "friendGuard", t("Friend Guard"))}
          ${checkbox(obs, "atkTera", t("Attacker Tera'd"))}
          ${checkbox(obs, "defTera", t("Defender Tera'd"))}
        </div>
      </div>
      <div class="sv-row">
        <span class="sv-row-label">${t("Field")}</span>
        ${selectField(obs, "weather", t("Weather"), WEATHERS.map((w) =>
          `<option value="${w}"${obs.weather === w ? " selected" : ""}>${w || t("none")}</option>`).join(""), 130)}
        ${selectField(obs, "terrain", t("Terrain"), TERRAINS.map((w) =>
          `<option value="${w}"${obs.terrain === w ? " selected" : ""}>${w || t("none")}</option>`).join(""), 110)}
        ${selectField(obs, "spread", t("Spread hit"), [
          ["auto", t("As on sheet")], ["no", t("Only one target")],
        ].map(([v, l]) => `<option value="${v}"${obs.spread === v ? " selected" : ""}>${esc(l)}</option>`).join(""), 130)}
        ${numField(obs, "atkBoostAtk", t("Atk stage"), -6, 6, 1)}
        ${numField(obs, "atkBoostSpa", t("SpA stage"), -6, 6, 1)}
        ${numField(obs, "defBoostDef", t("Def stage"), -6, 6, 1)}
        ${numField(obs, "defBoostSpd", t("SpD stage"), -6, 6, 1)}
      </div>
      <details data-adv="${obs.id}"${obs.advOpen ? " open" : ""}>
        <summary>${t("More: items, abilities, status, multi-hit")}</summary>
        <div class="sv-adv">
          <div class="sv-row">
            <span class="sv-row-label">${t("Attacker")}</span>
            ${textField(obs, "atkItem", t("Item override"), 130)}
            ${textField(obs, "atkAbility", t("Ability override"), 140)}
            ${selectField(obs, "atkStatus", t("Status"), STATUSES.map((s) =>
              `<option value="${s}"${obs.atkStatus === s ? " selected" : ""}>${s || t("none")}</option>`).join(""), 120)}
            ${numField(obs, "atkHpPct", t("HP %"), 1, 100, 1)}
          </div>
          <div class="sv-row">
            <span class="sv-row-label">${t("Defender")}</span>
            ${textField(obs, "defItem", t("Item override"), 130)}
            ${textField(obs, "defAbility", t("Ability override"), 140)}
            ${selectField(obs, "defStatus", t("Status"), STATUSES.map((s) =>
              `<option value="${s}"${obs.defStatus === s ? " selected" : ""}>${s || t("none")}</option>`).join(""), 120)}
          </div>
          <div class="sv-row">
            <span class="sv-row-label">${t("Move")}</span>
            ${numField(obs, "hits", t("Multi-hit hits"), 1, 10, 1, 84)}
            ${numField(obs, "bp", t("BP override"), 0, 300, 1, 84)}
            <div class="sv-checkbank">
              ${checkbox(obs, "singles", t("Singles"), t("Turns off the doubles spread reduction."))}
              ${checkbox(obs, "battery", "Battery")}
              ${checkbox(obs, "powerSpot", "Power Spot")}
              ${checkbox(obs, "steelySpirit", "Steely Spirit")}
              ${checkbox(obs, "gravity", "Gravity")}
              ${checkbox(obs, "fairyAura", "Fairy Aura", t("An ally or the opposing partner had it. The attacker's or defender's own is picked up automatically."))}
              ${checkbox(obs, "darkAura", "Dark Aura", t("An ally or the opposing partner had it. The attacker's or defender's own is picked up automatically."))}
              ${checkbox(obs, "auraBreak", "Aura Break", t("Flips an active aura from a 1.33x boost to a 0.75x cut."))}
              ${checkbox(obs, "swordOfRuin", "Sword of Ruin")}
              ${checkbox(obs, "beadsOfRuin", "Beads of Ruin")}
              ${checkbox(obs, "tabletsOfRuin", "Tablets of Ruin")}
              ${checkbox(obs, "vesselOfRuin", "Vessel of Ruin")}
            </div>
          </div>
          <div class="sv-row">
            <span class="sv-row-label">${t("Note")}</span>
            ${textField(obs, "note", t("Turn / context"), 320)}
          </div>
        </div>
      </details>
    </div>
  </div>`;
}

function textField(obs, field, label, width) {
  return `<label class="sv-field"><span>${esc(label)}</span>
    <input type="text" data-obs="${obs.id}" data-field="${field}" value="${esc(obs[field] || "")}"
      style="width:${width || 130}px" placeholder="${t("as on sheet")}"></label>`;
}

function speedModRow(obs, side, label) {
  const mods = obs[side];
  return `<div class="sv-row">
    <span class="sv-row-label">${esc(label)}</span>
    <label class="sv-check"><input type="checkbox" data-obs="${obs.id}" data-mods="${side}" data-key="tailwind"${mods.tailwind ? " checked" : ""}> ${t("Tailwind")}</label>
    <label class="sv-check"><input type="checkbox" data-obs="${obs.id}" data-mods="${side}" data-key="para"${mods.para ? " checked" : ""}> ${t("Paralysed")}</label>
    <label class="sv-field"><span>${t("Stage")}</span>
      <input type="number" min="-6" max="6" step="1" data-obs="${obs.id}" data-mods="${side}" data-key="boost" value="${mods.boost || 0}" style="width:56px"></label>
    <label class="sv-field"><span>${t("Modifier")}</span>
      <select data-obs="${obs.id}" data-mods="${side}" data-key="mod" style="width:250px">
        ${SPEED_MODS.map(([v, l]) => `<option value="${v}"${mods.mod === v ? " selected" : ""}>${esc(l)}</option>`).join("")}
      </select></label>
  </div>`;
}

function renderSpeedObs(obs, i) {
  return `<div class="sv-obs${obs.disabled ? " is-off" : ""}${obs.collapsed ? " is-collapsed" : ""}" data-obs-card="${obs.id}">
    <div class="sv-obs-head" data-collapse-zone="${obs.id}">
      ${collapseButton(obs)}
      <span class="sv-obs-tag spd">${t("Speed")} ${i + 1}</span>
      <span class="sv-obs-title">${esc(obsSummary(obs))}</span>
      ${checkbox(obs, "disabled", t("Ignore"))}
      <button type="button" class="sv-btn is-small is-danger" data-remove-obs="${obs.id}">&times;</button>
    </div>
    <div class="sv-obs-body">
      <div class="sv-row">
        <span class="sv-row-label">${t("Order")}</span>
        ${selectField(obs, "fast", t("Moved first"), slotOptions(obs.fast), 210)}
        <span class="sv-arrow">&rarr;</span>
        ${selectField(obs, "slow", t("Moved second"), slotOptions(obs.slow), 210)}
        <div class="sv-checkbank">
          ${checkbox(obs, "trickRoom", t("Trick Room"))}
          ${checkbox(obs, "tie", t("Could have been a speed tie"), t("Allows equal Speed, scored as the coin flip it is."))}
        </div>
      </div>
      ${speedModRow(obs, "fastMods", t("First"))}
      ${speedModRow(obs, "slowMods", t("Second"))}
      <div class="sv-row">
        <span class="sv-row-label">${t("Note")}</span>
        ${textField(obs, "note", t("Turn / context"), 320)}
      </div>
    </div>
  </div>`;
}

/* ─── move lookup ────────────────────────────────────────────────────── */

const moveCache = new Map();

async function resolveMove(name) {
  const key = name.toLowerCase();
  if (moveCache.has(key)) return moveCache.get(key);
  const resp = await fetch(`/api/moves/search?q=${encodeURIComponent(name)}&format=${encodeURIComponent(S.format)}`);
  const list = resp.ok ? await resp.json() : [];
  const hit = list.find((m) => m.name.toLowerCase() === key) || list[0] || null;
  moveCache.set(key, hit);
  return hit;
}

function monMove(ref, name) {
  const slot = slotOf(ref);
  if (!slot) return null;
  return (slot.mon.moves || []).find((m) => m.name === name) || null;
}

/* ─── events ─────────────────────────────────────────────────────────── */

function setRatingOptions() {
  const select = $("sv-rating");
  const ratings = (boot.formatRatings && boot.formatRatings[S.format]) || ["0"];
  select.innerHTML = ratings.map((r) =>
    `<option value="${r}"${String(r) === String(S.rating) ? " selected" : ""}>${r === "0" ? t("All ratings") : r + "+"}</option>`).join("");
  if (!ratings.map(String).includes(String(S.rating))) S.rating = ratings[0];
  select.value = S.rating;
}

function wire() {
  $("sv-format").addEventListener("change", async (e) => {
    S.format = e.target.value;
    setRatingOptions();
    speciesCache.clear();
    communityLoaded.clear();
    rollCache.clear();
    save();
    setStatus(t("Format changed — reloading Pokémon data…"));
    await hydrateAll();
    setStatus("");
  });

  $("sv-rating").addEventListener("change", async (e) => {
    S.rating = e.target.value;
    speciesCache.clear();
    communityLoaded.clear();
    save();
    await hydrateAll();
  });

  $("sv-refine").addEventListener("change", (e) => { S.refine = e.target.checked; save(); });
  $("sv-use-community").addEventListener("change", (e) => { S.community = e.target.checked; save(); });

  $("sv-add-team").addEventListener("click", () => {
    const team = newTeam("");
    S.teams.push(team);
    S.activeTeam = team.id;
    save();
    renderTeams();
    renderObs();
  });

  $("sv-reset").addEventListener("click", () => {
    if (!confirm(t("Clear every team and interaction on this page?"))) return;
    S = blankState();
    S.teams = [newTeam(""), newTeam("")];
    S.activeTeam = S.teams[0].id;
    save();
    setRatingOptions();
    renderTeams();
    renderObs();
    renderResults(null);
    setStatus("");
  });

  $("sv-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "spread-solver-case.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $("sv-import-file").addEventListener("click", () => $("sv-file").click());
  $("sv-file").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !Array.isArray(parsed.teams)) throw new Error(t("Not a solver case file."));
      S = Object.assign(blankState(), parsed);
      save();
      $("sv-format").value = S.format;
      setRatingOptions();
      renderTeams();
      renderObs();
      await hydrateAll();
      setStatus(t("Case loaded."));
    } catch (err) {
      setStatus(err.message || String(err), true);
    }
    e.target.value = "";
  });

  document.querySelectorAll("[data-add-obs]").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Fold the finished ones away so the new card is the only one open.
      for (const o of S.obs) o.collapsed = true;
      S.obs.push(btn.dataset.addObs === "damage" ? newDamageObs() : newSpeedObs());
      save();
      renderObs();
      const last = $("sv-obs-list").lastElementChild;
      if (last && last.scrollIntoView) last.scrollIntoView({ block: "nearest" });
    });
  });

  const setAllCollapsed = (value) => {
    for (const o of S.obs) o.collapsed = value;
    save();
    renderObs();
  };
  $("sv-collapse-all").addEventListener("click", () => setAllCollapsed(true));
  $("sv-expand-all").addEventListener("click", () => setAllCollapsed(false));

  $("sv-solve").addEventListener("click", runSolve);
  $("sv-build-sets").addEventListener("click", buildOutputOnly);

  $("sv-output").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy-team]");
    if (!btn) return;
    const pre = $("sv-output").querySelector(`[data-paste-for="${btn.dataset.copyTeam}"]`);
    if (!pre) return;
    try {
      await navigator.clipboard.writeText(pre.textContent);
      btn.textContent = t("Copied");
      setTimeout(() => { btn.textContent = t("Copy paste"); }, 1500);
    } catch (err) {
      // Clipboard access can be refused; select the text so Ctrl+C still works.
      const range = document.createRange();
      range.selectNodeContents(pre);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  // Team panel — delegated so re-renders never leave stale listeners behind.
  $("sv-team-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-team]");
    if (!btn) return;
    S.activeTeam = btn.dataset.team;
    save();
    renderTeams();
  });

  const teamBody = $("sv-team-body");
  teamBody.addEventListener("click", async (e) => {
    if (e.target.id === "sv-do-import") return importPaste();
    if (e.target.id === "sv-do-add-mon") {
      const field = $("sv-add-species");
      return addMonByName(field ? field.value : "");
    }
    if (e.target.id === "sv-clear-roster") {
      const team = teamById(S.activeTeam);
      if (team) { team.mons = []; save(); renderTeams(); renderObs(); }
      return;
    }
    const removeTeam = e.target.closest("[data-remove-team]");
    if (removeTeam) {
      const id = removeTeam.dataset.removeTeam;
      if (!confirm(t("Delete this team and every interaction that uses it?"))) return;
      S.teams = S.teams.filter((x) => x.id !== id);
      S.obs = S.obs.filter((o) => ![o.atk, o.def, o.fast, o.slow].some((r) => r && r.teamId === id));
      save();
      renderTeams();
      renderObs();
      return;
    }
    const removeMon = e.target.closest("[data-remove-mon]");
    if (removeMon) {
      const team = teamById(S.activeTeam);
      if (!team) return;
      const id = removeMon.dataset.removeMon;
      team.mons = team.mons.filter((m) => m.id !== id);
      S.obs = S.obs.filter((o) => ![o.atk, o.def, o.fast, o.slow].some((r) => r && r.monId === id));
      save();
      renderTeams();
      renderObs();
    }
  });

  teamBody.addEventListener("keydown", (e) => {
    if (e.target.id === "sv-add-species" && e.key === "Enter") {
      e.preventDefault();
      addMonByName(e.target.value);
    }
  });

  teamBody.addEventListener("input", (e) => {
    const field = e.target.dataset.teamField;
    if (field) {
      const team = teamById(S.activeTeam);
      if (!team) return;
      team[field] = e.target.value;
      save();
      // Patch the tab label in place: re-rendering here would take the focus
      // out of the box being typed in.
      if (field === "name") {
        const label = $("sv-team-tabs").querySelector(`[data-team="${team.id}"] .sv-team-label`);
        if (label) label.textContent = teamLabel(team, S.teams.indexOf(team));
      }
      return;
    }
    const card = e.target.closest("[data-mon]");
    if (!card) return;
    const mon = monById(S.activeTeam, card.dataset.mon);
    if (!mon) return;
    const evStat = e.target.dataset.ev;
    if (evStat) {
      const sp = speciesData(mon.species);
      const max = (sp && sp.evRules ? sp.evRules.perStat : 252);
      const raw = e.target.value.trim();
      mon.evs[evStat] = raw === "" ? null : clamp(parseInt(raw, 10) || 0, 0, max);
      e.target.classList.toggle("is-blank", mon.evs[evStat] == null);
      save();
      updateEvFoot(card, mon);
      return;
    }
    const monField = e.target.dataset.monField;
    if (monField) { mon[monField] = e.target.value; save(); }
  });

  // The slot labels in the interaction pickers carry the team name, so refresh
  // them once the rename is finished rather than on every keystroke.
  teamBody.addEventListener("change", (e) => {
    if (e.target.dataset.teamField === "name") renderObs();
  });

  // Interaction panel.
  const obsList = $("sv-obs-list");
  obsList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-obs]");
    if (btn) {
      S.obs = S.obs.filter((o) => o.id !== btn.dataset.removeObs);
      save();
      renderObs();
      return;
    }
    // The caret, or anywhere on the header bar that is not another control.
    const caret = e.target.closest("[data-collapse]");
    const zone = caret || (e.target.closest("[data-collapse-zone]")
      && !e.target.closest("label, button, input, select") ? e.target.closest("[data-collapse-zone]") : null);
    if (!zone) return;
    const id = caret ? caret.dataset.collapse : zone.dataset.collapseZone;
    const obs = S.obs.find((o) => o.id === id);
    if (obs) { obs.collapsed = !obs.collapsed; save(); setCollapsed(obsList, obs); }
  });

  // Remember which Advanced panels were open across the re-renders a picker
  // change forces. ("toggle" does not bubble, so capture it.)
  obsList.addEventListener("toggle", (e) => {
    const id = e.target.dataset && e.target.dataset.adv;
    if (!id) return;
    const obs = S.obs.find((o) => o.id === id);
    if (obs) { obs.advOpen = e.target.open; save(); }
  }, true);

  const handleObsChange = async (e) => {
    const id = e.target.dataset.obs;
    if (!id) return;
    const obs = S.obs.find((o) => o.id === id);
    if (!obs) return;

    const modsSide = e.target.dataset.mods;
    if (modsSide) {
      const key = e.target.dataset.key;
      obs[modsSide][key] = e.target.type === "checkbox" ? e.target.checked
        : (key === "boost" ? clamp(parseInt(e.target.value, 10) || 0, -6, 6) : e.target.value);
      save();
      return;
    }

    const field = e.target.dataset.field;
    if (!field) return;

    if (field === "atk" || field === "def" || field === "fast" || field === "slow") {
      const [teamId, monId] = (e.target.value || "").split("|");
      obs[field] = teamId ? { teamId, monId } : {};
      // The move list belongs to whoever is attacking.
      if (field === "atk") obs.move = null;
      save();
      renderObs();
      return;
    }
    if (field === "move" || field === "moveText") {
      const name = (e.target.value || "").trim();
      if (field === "moveText" && !name) return;
      obs.move = name ? (monMove(obs.atk, name) || await resolveMove(name)) : null;
      if (field === "moveText" && !obs.move) {
        setStatus(`${t("No move found for")} "${name}".`, true);
        return;
      }
      save();
      renderObs();
      return;
    }
    if (e.target.type === "checkbox") obs[field] = e.target.checked;
    else if (e.target.type === "number") obs[field] = e.target.value === "" ? "" : Number(e.target.value);
    else obs[field] = e.target.value;
    save();
    // Only the damage-entry mode swaps which fields exist; everything else is
    // patched in place so an open Advanced panel stays open.
    if (field === "mode") { renderObs(); return; }
    if (field === "disabled") {
      const card = obsList.querySelector(`[data-obs-card="${id}"]`);
      if (card) card.classList.toggle("is-off", !!obs.disabled);
    }
    refreshObsTitle(obsList, obs);
  };
  obsList.addEventListener("change", handleObsChange);
  obsList.addEventListener("input", (e) => {
    // Text and number fields update as they are typed; selects and checkboxes
    // fire "change", and the move lookup waits for one so it is not queried
    // once per keystroke.
    if (e.target.tagName === "SELECT" || e.target.type === "checkbox") return;
    if (e.target.dataset.field === "moveText") return;
    handleObsChange(e);
  });
}

/* Patch one card's collapsed state in place — re-rendering the list would
 * scroll the page and shut every open Advanced panel. */
function setCollapsed(host, obs) {
  const card = host.querySelector(`[data-obs-card="${obs.id}"]`);
  if (!card) return;
  card.classList.toggle("is-collapsed", !!obs.collapsed);
  const caret = card.querySelector("[data-collapse]");
  if (caret) {
    caret.innerHTML = obs.collapsed ? "&#9656;" : "&#9662;";
    caret.setAttribute("aria-expanded", obs.collapsed ? "false" : "true");
    caret.title = obs.collapsed ? t("Expand") : t("Collapse");
  }
}

/* Keep the header summary current so a card can be collapsed straight after
 * being filled in and still say what it holds. */
function refreshObsTitle(host, obs) {
  const card = host.querySelector(`[data-obs-card="${obs.id}"]`);
  const title = card && card.querySelector(".sv-obs-title");
  if (title) title.textContent = obsSummary(obs);
}

function updateEvFoot(card, mon) {
  const sp = speciesData(mon.species);
  const rules = (sp && sp.evRules) || { total: 508, label: "EV" };
  const spent = STATS.reduce((a, s) => a + (mon.evs[s] || 0), 0);
  const unknown = STATS.filter((s) => mon.evs[s] == null).length;
  const foot = card.querySelector(".sv-ev-foot");
  if (!foot) return;
  foot.children[0].textContent = unknown
    ? `${unknown} ${t("unknown")} · ${t("blank = solve for it")}`
    : t("fully known — used as a reference");
  foot.children[1].textContent = `${spent}/${rules.total} ${rules.label}`;
  foot.children[1].className = spent > rules.total ? "over" : "";
  card.classList.toggle("is-unknown", unknown > 0);
  card.classList.toggle("is-known", unknown === 0);
}

/* ─── boot ───────────────────────────────────────────────────────────── */

async function init() {
  S = load() || blankState();
  // A stored case may predate the format list this page was served with.
  if (!boot.formatRatings || !boot.formatRatings[S.format]) S.format = boot.format;
  $("sv-format").value = S.format;
  setRatingOptions();
  $("sv-refine").checked = S.refine !== false;
  $("sv-use-community").checked = S.community !== false;

  if (!S.teams.length) {
    S.teams = [newTeam(""), newTeam("")];
    S.activeTeam = S.teams[0].id;
  }
  wire();
  renderTeams();
  renderObs();
  await hydrateAll();
}

document.addEventListener("DOMContentLoaded", init);
