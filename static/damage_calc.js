// MunchStats Damage Calculator
// Attacker = your Pokemon (fully editable stats/move/item/ability).
// Defender = average opponent based on usage-weighted stat distributions.

// ─── NATURES ─────────────────────────────────────────────────────────────────
// Each entry maps stat keys to their multiplier (1.1 boost, 0.9 nerf; omitted = 1.0).
const NATURES = {
  Hardy:{}, Docile:{}, Serious:{}, Bashful:{}, Quirky:{},
  Lonely:{atk:1.1,def:0.9}, Brave:{atk:1.1,spe:0.9}, Adamant:{atk:1.1,spa:0.9}, Naughty:{atk:1.1,spd:0.9},
  Bold:{def:1.1,atk:0.9},   Relaxed:{def:1.1,spe:0.9}, Impish:{def:1.1,spa:0.9}, Lax:{def:1.1,spd:0.9},
  Timid:{spe:1.1,atk:0.9},  Hasty:{spe:1.1,def:0.9},  Jolly:{spe:1.1,spa:0.9},  Naive:{spe:1.1,spd:0.9},
  Modest:{spa:1.1,atk:0.9}, Mild:{spa:1.1,def:0.9},   Quiet:{spa:1.1,spe:0.9},  Rash:{spa:1.1,spd:0.9},
  Calm:{spd:1.1,atk:0.9},   Gentle:{spd:1.1,def:0.9}, Sassy:{spd:1.1,spe:0.9},  Careful:{spd:1.1,spa:0.9},
};

// ─── TYPE CHART (Gen 9 / SV) ─────────────────────────────────────────────────
const TYPE_CHART = {
  Normal:   { Normal:1, Fire:1, Water:1, Electric:1, Grass:1, Ice:1, Fighting:1, Poison:1, Ground:1, Flying:1, Psychic:1, Bug:1, Rock:0.5, Ghost:0, Dragon:1, Dark:1, Steel:0.5, Fairy:1, Stellar:1 },
  Fire:     { Normal:1, Fire:0.5, Water:0.5, Electric:1, Grass:2, Ice:2, Fighting:1, Poison:1, Ground:1, Flying:1, Psychic:1, Bug:2, Rock:0.5, Ghost:1, Dragon:0.5, Dark:1, Steel:2, Fairy:1, Stellar:1 },
  Water:    { Normal:1, Fire:2, Water:0.5, Electric:1, Grass:0.5, Ice:1, Fighting:1, Poison:1, Ground:2, Flying:1, Psychic:1, Bug:1, Rock:2, Ghost:1, Dragon:0.5, Dark:1, Steel:1, Fairy:1, Stellar:1 },
  Electric: { Normal:1, Fire:1, Water:2, Electric:0.5, Grass:0.5, Ice:1, Fighting:1, Poison:1, Ground:0, Flying:2, Psychic:1, Bug:1, Rock:1, Ghost:1, Dragon:0.5, Dark:1, Steel:1, Fairy:1, Stellar:1 },
  Grass:    { Normal:1, Fire:0.5, Water:2, Electric:1, Grass:0.5, Ice:1, Fighting:1, Poison:0.5, Ground:2, Flying:0.5, Psychic:1, Bug:0.5, Rock:2, Ghost:1, Dragon:0.5, Dark:1, Steel:0.5, Fairy:1, Stellar:1 },
  Ice:      { Normal:1, Fire:0.5, Water:0.5, Electric:1, Grass:2, Ice:0.5, Fighting:1, Poison:1, Ground:2, Flying:2, Psychic:1, Bug:1, Rock:1, Ghost:1, Dragon:2, Dark:1, Steel:0.5, Fairy:1, Stellar:1 },
  Fighting: { Normal:2, Fire:1, Water:1, Electric:1, Grass:1, Ice:2, Fighting:1, Poison:0.5, Ground:1, Flying:0.5, Psychic:0.5, Bug:0.5, Rock:2, Ghost:0, Dragon:1, Dark:2, Steel:2, Fairy:0.5, Stellar:1 },
  Poison:   { Normal:1, Fire:1, Water:1, Electric:1, Grass:2, Ice:1, Fighting:1, Poison:0.5, Ground:0.5, Flying:1, Psychic:1, Bug:1, Rock:0.5, Ghost:0.5, Dragon:1, Dark:1, Steel:0, Fairy:2, Stellar:1 },
  Ground:   { Normal:1, Fire:2, Water:1, Electric:2, Grass:0.5, Ice:1, Fighting:1, Poison:2, Ground:1, Flying:0, Psychic:1, Bug:0.5, Rock:2, Ghost:1, Dragon:1, Dark:1, Steel:2, Fairy:1, Stellar:1 },
  Flying:   { Normal:1, Fire:1, Water:1, Electric:0.5, Grass:2, Ice:1, Fighting:2, Poison:1, Ground:1, Flying:1, Psychic:1, Bug:2, Rock:0.5, Ghost:1, Dragon:1, Dark:1, Steel:0.5, Fairy:1, Stellar:1 },
  Psychic:  { Normal:1, Fire:1, Water:1, Electric:1, Grass:1, Ice:1, Fighting:2, Poison:2, Ground:1, Flying:1, Psychic:0.5, Bug:1, Rock:1, Ghost:1, Dragon:1, Dark:0, Steel:0.5, Fairy:1, Stellar:1 },
  Bug:      { Normal:1, Fire:0.5, Water:1, Electric:1, Grass:2, Ice:1, Fighting:0.5, Poison:0.5, Ground:1, Flying:0.5, Psychic:2, Bug:1, Rock:1, Ghost:0.5, Dragon:1, Dark:2, Steel:0.5, Fairy:0.5, Stellar:1 },
  Rock:     { Normal:1, Fire:2, Water:1, Electric:1, Grass:1, Ice:2, Fighting:0.5, Poison:1, Ground:0.5, Flying:2, Psychic:1, Bug:2, Rock:1, Ghost:1, Dragon:1, Dark:1, Steel:0.5, Fairy:1, Stellar:1 },
  Ghost:    { Normal:0, Fire:1, Water:1, Electric:1, Grass:1, Ice:1, Fighting:1, Poison:1, Ground:1, Flying:1, Psychic:2, Bug:1, Rock:1, Ghost:2, Dragon:1, Dark:0.5, Steel:1, Fairy:1, Stellar:1 },
  Dragon:   { Normal:1, Fire:1, Water:1, Electric:1, Grass:1, Ice:1, Fighting:1, Poison:1, Ground:1, Flying:1, Psychic:1, Bug:1, Rock:1, Ghost:1, Dragon:2, Dark:1, Steel:0.5, Fairy:0, Stellar:1 },
  Dark:     { Normal:1, Fire:1, Water:1, Electric:1, Grass:1, Ice:1, Fighting:0.5, Poison:1, Ground:1, Flying:1, Psychic:2, Bug:1, Rock:1, Ghost:2, Dragon:1, Dark:0.5, Steel:0.5, Fairy:0.5, Stellar:1 },
  Steel:    { Normal:1, Fire:0.5, Water:0.5, Electric:0.5, Grass:1, Ice:2, Fighting:1, Poison:1, Ground:1, Flying:1, Psychic:1, Bug:1, Rock:2, Ghost:1, Dragon:1, Dark:1, Steel:0.5, Fairy:2, Stellar:1 },
  Fairy:    { Normal:1, Fire:0.5, Water:1, Electric:1, Grass:1, Ice:1, Fighting:2, Poison:0.5, Ground:1, Flying:1, Psychic:1, Bug:1, Rock:1, Ghost:1, Dragon:2, Dark:2, Steel:0.5, Fairy:1, Stellar:1 },
  Stellar:  { Normal:1, Fire:1, Water:1, Electric:1, Grass:1, Ice:1, Fighting:1, Poison:1, Ground:1, Flying:1, Psychic:1, Bug:1, Rock:1, Ghost:1, Dragon:1, Dark:1, Steel:1, Fairy:1, Stellar:1 },
};

const TYPE_COLORS = {
  Normal:"#a8a878", Fire:"#f08030", Water:"#6890f0", Electric:"#f8d030",
  Grass:"#78c850", Ice:"#98d8d8", Fighting:"#c03028", Poison:"#a040a0",
  Ground:"#e0c068", Flying:"#a890f0", Psychic:"#f85888", Bug:"#a8b820",
  Rock:"#b8a038", Ghost:"#705898", Dragon:"#7038f8", Dark:"#705848",
  Steel:"#b8b8d0", Fairy:"#f0b6bc", Stellar:"#40a0ff",
};

const TYPE_BOOST_ITEMS = {
  "Silk Scarf":"Normal","Charcoal":"Fire","Mystic Water":"Water","Magnet":"Electric",
  "Miracle Seed":"Grass","Never-Melt Ice":"Ice","Black Belt":"Fighting","Poison Barb":"Poison",
  "Soft Sand":"Ground","Sharp Beak":"Flying","Twisted Spoon":"Psychic","Odd Incense":"Psychic",
  "Silver Powder":"Bug","Hard Stone":"Rock","Rock Incense":"Rock","Spell Tag":"Ghost",
  "Dragon Fang":"Dragon","Black Glasses":"Dark","Metal Coat":"Steel","Fairy Feather":"Fairy",
  "Sea Incense":"Water","Wave Incense":"Water","Rose Incense":"Grass","Pure Incense":"Normal",
};

const RESIST_BERRIES = {
  "Occa Berry":"Fire","Passho Berry":"Water","Wacan Berry":"Electric","Rindo Berry":"Grass",
  "Yache Berry":"Ice","Chople Berry":"Fighting","Kebia Berry":"Poison","Shuca Berry":"Ground",
  "Coba Berry":"Flying","Payapa Berry":"Psychic","Tanga Berry":"Bug","Charti Berry":"Rock",
  "Kasib Berry":"Ghost","Haban Berry":"Dragon","Colbur Berry":"Dark","Babiri Berry":"Steel",
  "Roseli Berry":"Fairy","Chilan Berry":"Normal",
};

const TYPE_IMMUNITY_ABILITIES = {
  "Flash Fire":"Fire","Levitate":"Ground","Storm Drain":"Water",
  "Lightning Rod":"Electric","Volt Absorb":"Electric","Water Absorb":"Water",
  "Sap Sipper":"Grass","Motor Drive":"Electric","Earth Eater":"Ground",
  "Soundproof":"_sound","Bulletproof":"_ball",
};

// ─── ABILITY ACTIVATIONS ─────────────────────────────────────────────────────
// Abilities with a toggle checkbox: "activated" means their switch-in or
// trigger effect has occurred.  Abilities NOT listed here are passive
// (always-on) and have no checkbox (e.g. Technician, Levitate, Adaptability).
const ABILITY_ACTIVATIONS = {
  // ── Default ON (switch-in) ──
  "Intimidate": {
    defaultOn: true, target: "opponent", desc: "\u22121 Atk to opponent",
    boosts: { atk: -1 },
    immuneAbilities: [
      "Inner Focus","Scrappy","Oblivious","Own Tempo",
      "Clear Body","White Smoke","Full Metal Body","Hyper Cutter",
    ],
    reactions: {
      "Contrary":     { replace: { atk: 1 } },
      "Defiant":      { extra: { atk: 2 } },
      "Competitive":  { extra: { spa: 2 } },
      "Mirror Armor": { reflect: true },
    },
  },
  "Intrepid Sword":  { defaultOn: true, target: "self", desc: "+1 Atk",  boosts: { atk: 1 } },
  "Dauntless Shield": { defaultOn: true, target: "self", desc: "+1 Def",  boosts: { def: 1 } },
  "Embody Aspect (Teal Mask)":        { defaultOn: true, target: "self", desc: "+1 Spe", boosts: { spe: 1 } },
  "Embody Aspect (Wellspring Mask)":  { defaultOn: true, target: "self", desc: "+1 SpD", boosts: { spd: 1 } },
  "Embody Aspect (Hearthflame Mask)": { defaultOn: true, target: "self", desc: "+1 Atk", boosts: { atk: 1 } },
  "Embody Aspect (Cornerstone Mask)": { defaultOn: true, target: "self", desc: "+1 Def", boosts: { def: 1 } },

  // ── Default OFF (conditional triggers) ──
  "Electromorphosis": { defaultOn: false, target: "self", desc: "Charge (2\u00d7 Elec)", effect: "charge" },
  "Wind Power":       { defaultOn: false, target: "self", desc: "Charge (2\u00d7 Elec)", effect: "charge" },
  "Unburden":         { defaultOn: false, target: "self", desc: "2\u00d7 Speed", effect: "unburden" },
  "Flash Fire":       { defaultOn: false, target: "self", desc: "+50% Fire",  effect: "flashfire" },
  "Justified":        { defaultOn: false, target: "self", desc: "+1 Atk",  boosts: { atk: 1 } },
  "Moxie":            { defaultOn: false, target: "self", desc: "+1 Atk",  boosts: { atk: 1 } },
  "Chilling Neigh":   { defaultOn: false, target: "self", desc: "+1 Atk",  boosts: { atk: 1 } },
  "Grim Neigh":       { defaultOn: false, target: "self", desc: "+1 SpA",  boosts: { spa: 1 } },
  "Beast Boost":      { defaultOn: false, target: "self", desc: "+1 highest stat", boosts: { atk: 1 } },
  "Weak Armor":       { defaultOn: false, target: "self", desc: "\u22121 Def +2 Spe", boosts: { def: -1, spe: 2 } },
  "Steam Engine":     { defaultOn: false, target: "self", desc: "+6 Spe",  boosts: { spe: 6 } },
  "Wind Rider":       { defaultOn: false, target: "self", desc: "+1 Atk",  boosts: { atk: 1 } },
  "Thermal Exchange": { defaultOn: false, target: "self", desc: "+1 Atk",  boosts: { atk: 1 } },
  "Stamina":          { defaultOn: false, target: "self", desc: "+1 Def",  boosts: { def: 1 } },
  "Seed Sower":       { defaultOn: false, target: "self", desc: "Grassy Terrain", effect: "grassyterrain" },
  "Berserk":          { defaultOn: false, target: "self", desc: "+1 SpA",  boosts: { spa: 1 } },
  "Soul-Heart":       { defaultOn: false, target: "self", desc: "+1 SpA",  boosts: { spa: 1 } },
  "Anger Point":      { defaultOn: false, target: "self", desc: "+6 Atk",  boosts: { atk: 6 } },
  "Water Compaction":  { defaultOn: false, target: "self", desc: "+2 Def",  boosts: { def: 2 } },
  "Anger Shell":      { defaultOn: false, target: "self", desc: "\u22121 Def/SpD +1 Atk/SpA/Spe", boosts: { def:-1, spd:-1, atk:1, spa:1, spe:1 } },
  "Rattled":          { defaultOn: false, target: "self", desc: "+1 Spe",  boosts: { spe: 1 } },
  "Cotton Down":      { defaultOn: false, target: "opponent", desc: "\u22121 Spe to opponent", boosts: { spe: -1 } },
};

// ─── UTILITY ─────────────────────────────────────────────────────────────────
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[ch]));
}

function pokeRound(n) { return Math.floor(n + 0.5); }

function chainMods(mods) {
  let M = 0x1000;
  for (const m of mods) {
    M = M >= 0x1000 ? Math.floor((M * m + 0x800) / 0x1000) : Math.floor(M * m / 0x1000);
  }
  return M;
}

function getTypeEffectiveness(moveType, defTypes, defTera, field) {
  const effectiveTypes = (defTera && defTera !== "None" && defTera !== "") ? [defTera] : defTypes;
  const chart = TYPE_CHART[moveType];
  if (!chart) return 1;
  let eff = 1;
  for (const dt of effectiveTypes) {
    let mult = chart[dt] !== undefined ? chart[dt] : 1;
    // Gravity: Ground moves hit Flying types (override immunity)
    if (field?.isGravity && moveType === "Ground" && dt === "Flying" && mult === 0) mult = 1;
    eff *= mult;
  }
  return eff;
}

function checkAbilityImmunity(moveType, defAbility, moveFlags, field) {
  const abilImm = TYPE_IMMUNITY_ABILITIES[defAbility];
  if (!abilImm) return false;
  if (abilImm === "_sound") return !!(moveFlags && moveFlags.sound);
  if (abilImm === "_ball") return !!(moveFlags && (moveFlags.bullet || moveFlags.bomb));
  // Gravity: Ground-immunity abilities (Levitate, Earth Eater) are bypassed
  if (field?.isGravity && abilImm === "Ground") return false;
  return abilImm === moveType;
}

function attackerIsBurned(attacker, field) {
  return attacker?.status === "Burned";
}

function attackerHasMajorStatus(attacker, field) {
  return !!(attacker?.status && attacker.status !== "Healthy");
}

function variableBasePowerType(move) {
  if (!move || move.category === "Status") return "";
  const moveId = (move.id || "").toLowerCase();
  if (move.variableBpType) return move.variableBpType;
  if (moveId === "lowkick" || moveId === "grassknot") return "targetWeight";
  return "";
}

function targetWeightBasePower(weightkg) {
  const weight = Number(weightkg) || 0;
  if (weight >= 200) return 120;
  if (weight >= 100) return 100;
  if (weight >= 50) return 80;
  if (weight >= 25) return 60;
  if (weight >= 10) return 40;
  return 20;
}

function isWeatherBall(move) {
  const id = (move?.id || move?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return id === "weatherball";
}

function weatherBallWeather(field = {}, attacker = null) {
  if (attacker?.ability === "Mega Sol" || field.attackerAbility === "Mega Sol") return "Sun";
  const weather = field.weather;
  return weather && weather !== "None" ? weather : "";
}

function getEffectiveMoveType(move, attacker = null, field = {}) {
  if (!move) return "Normal";
  if (isWeatherBall(move)) {
    const weather = weatherBallWeather(field, attacker);
    if (weather === "Sun" || weather === "Harsh Sunshine") return "Fire";
    if (weather === "Rain" || weather === "Heavy Rain") return "Water";
    if (weather === "Sand" || weather === "Sandstorm") return "Rock";
    if (weather === "Snow" || weather === "Hail") return "Ice";
    return "Normal";
  }
  const noTypeChange = ["terrainpulse", "struggle", "judgment", "naturalgift", "technoblast", "multiattack", "revelationdance", "terablast"];
  const moveId = (move.id || move.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (move.type === "Normal" && !noTypeChange.includes(moveId)) {
    if (attacker?.ability === "Pixilate") return "Fairy";
    if (attacker?.ability === "Aerilate") return "Flying";
    if (attacker?.ability === "Galvanize") return "Electric";
    if (attacker?.ability === "Refrigerate") return "Ice";
  }
  return move.type || "Normal";
}

function getMoveBasePower(move, field = {}) {
  if (!move || move.category === "Status") return 0;
  const bp = Number(move.bp) || 0;
  if (bp > 0) {
    if (isWeatherBall(move) && weatherBallWeather(field)) return bp * 2;
    return bp;
  }
  if (variableBasePowerType(move) === "targetWeight") {
    return targetWeightBasePower(field.targetWeightkg);
  }
  return 0;
}

function isDamagingMove(move) {
  return !!move && move.category !== "Status" && ((Number(move.bp) || 0) > 0 || !!variableBasePowerType(move));
}

function moveBasePowerLabel(move, field = null) {
  if (!isDamagingMove(move)) return "—";
  if (variableBasePowerType(move) === "targetWeight" && field?.targetWeightkg == null) return "20-120 BP";
  return `${getMoveBasePower(move, field || {})} BP`;
}

function getSTABMod(attTypes, ability, moveType, atkTera) {
  const teraActive = atkTera && atkTera !== "None" && atkTera !== "";
  const hasOrigSTAB = attTypes.includes(moveType);
  if (teraActive && atkTera !== "Stellar") {
    if (moveType === atkTera && hasOrigSTAB) return ability === "Adaptability" ? 0x2400 : 0x2000;
    if (moveType === atkTera || hasOrigSTAB) return ability === "Adaptability" && moveType === atkTera ? 0x2000 : 0x1800;
    return 0x1000;
  }
  if (!teraActive) {
    if (hasOrigSTAB) return ability === "Adaptability" ? 0x2000 : 0x1800;
    if (ability === "Protean" || ability === "Libero") return 0x1800;
    return 0x1000;
  }
  return hasOrigSTAB ? 0x2000 : 0x1555; // Stellar
}

// ─── EFFECTIVE BASE POWER ─────────────────────────────────────────────────────
function getEffectiveBasePower(move, attacker, field) {
  let bp = getMoveBasePower(move, { ...field, attackerAbility: attacker.ability });
  if (!bp) return 0;
  const ability = attacker.ability;
  const flags = move.flags || {};
  const moveType = getEffectiveMoveType(move, attacker, field);
  if (ability === "Technician" && bp <= 60) bp = Math.floor(bp * 1.5);
  if (["Pixilate", "Aerilate", "Galvanize", "Refrigerate"].includes(ability) && move.type === "Normal" && moveType !== "Normal") bp = Math.floor(bp * 1.2);
  if (ability === "Strong Jaw" && flags.bite) bp = Math.floor(bp * 1.5);
  if (ability === "Iron Fist" && flags.punch) bp = Math.floor(bp * 1.2);
  if (ability === "Tough Claws" && flags.contact) bp = Math.floor(bp * 1.3);
  if (ability === "Reckless" && move.hasRecoil) bp = Math.floor(bp * 1.2);
  if (ability === "Punk Rock" && flags.sound) bp = Math.floor(bp * 1.3);
  if (ability === "Steelworker" && moveType === "Steel") bp = Math.floor(bp * 1.5);
  if (ability === "Transistor" && moveType === "Electric") bp = Math.floor(bp * 1.5);
  if (ability === "Dragon's Maw" && moveType === "Dragon") bp = Math.floor(bp * 1.5);
  if (ability === "Rocky Payload" && moveType === "Rock") bp = Math.floor(bp * 1.5);
  if (ability === "Sheer Force" && move.hasSecondary) bp = Math.floor(bp * 1.3);
  if (ability === "Sand Force" && field.weather === "Sand" && ["Ground","Rock","Steel"].includes(moveType)) bp = Math.floor(bp * 1.3);
  // Ability activation effects (legacy path)
  if (attacker._abilityFlags?.charge && moveType === "Electric") bp = Math.floor(bp * 2);
  if (attacker._abilityFlags?.flashfire && moveType === "Fire") bp = Math.floor(bp * 1.5);
  if (field.terrain === "Electric" && moveType === "Electric") bp = Math.floor(bp * 1.3);
  if (field.terrain === "Grassy" && moveType === "Grass") bp = Math.floor(bp * 1.3);
  if (field.terrain === "Psychic" && moveType === "Psychic") bp = Math.floor(bp * 1.3);
  if (field.terrain === "Misty" && moveType === "Dragon") bp = Math.floor(bp * 0.5);
  return bp;
}

// ─── EFFECTIVE ATTACK / DEFENSE STATS ────────────────────────────────────────
function getEffectiveAtkStat(attacker, move, defAbility = "", defStats = null, defBoosts = null) {
  const isPhys = move.category === "Physical";
  const stats = attacker.customStats;
  let stat;
  // Foul Play: uses target's Atk stat and boosts
  if (move.overrideOffensivePokemon === "target" && defStats) {
    stat = isPhys ? (defStats.atk || 1) : (defStats.spa || 1);
    const boost = (defBoosts || {})[isPhys ? "atk" : "spa"] || 0;
    if (boost !== 0) stat = Math.floor(stat * (boost >= 0 ? (2 + boost) / 2 : 2 / (2 + Math.abs(boost))));
    if (defAbility === "Tablets of Ruin" && isPhys) stat = Math.floor(stat * 0.75);
    if (defAbility === "Vessel of Ruin" && !isPhys) stat = Math.floor(stat * 0.75);
    return stat;
  }
  // Body Press: uses attacker's Def stat
  if (move.overrideOffensiveStat) {
    stat = stats[move.overrideOffensiveStat] || (isPhys ? stats.atk : stats.spa);
  } else {
    stat = isPhys ? stats.atk : stats.spa;
  }
  const ability = attacker.ability;
  const item = attacker.item;
  if (item === "Choice Band" && isPhys) stat = Math.floor(stat * 1.5);
  if (item === "Choice Specs" && !isPhys) stat = Math.floor(stat * 1.5);
  if ((ability === "Huge Power" || ability === "Pure Power") && isPhys) stat *= 2;
  if (ability === "Guts" && isPhys && attackerHasMajorStatus(attacker, {})) stat = Math.floor(stat * 1.5);
  if (ability === "Hustle" && isPhys) stat = Math.floor(stat * 1.5);
  if (ability === "Gorilla Tactics" && isPhys) stat = Math.floor(stat * 1.5);
  if (item === "Thick Club" && isPhys) stat *= 2;
  if (item === "Light Ball") stat *= 2;
  if (defAbility === "Tablets of Ruin" && isPhys) stat = Math.floor(stat * 0.75);
  if (defAbility === "Vessel of Ruin" && !isPhys) stat = Math.floor(stat * 0.75);
  const boostKey = move.overrideOffensiveStat || (isPhys ? "atk" : "spa");
  const boost = Math.max(-6, Math.min(6, ((attacker.boosts || {})[boostKey] || 0) + ((attacker._abilityBoosts || {})[boostKey] || 0)));
  if (boost !== 0) stat = Math.floor(stat * (boost >= 0 ? (2 + boost) / 2 : 2 / (2 + Math.abs(boost))));
  return stat;
}

function getEffectiveDefStat(defStats, defItem, atkAbility, move, defBoosts, field = {}, defTypes = [], defTera = "") {
  // Psyshock/Psystrike/Secret Sword: Special moves that target Def
  const hitsPhysical = move.overrideDefensiveStat === "def"
    || (move.category === "Physical" && !move.overrideDefensiveStat);
  let stat = hitsPhysical ? defStats.def : defStats.spd;
  if (defItem === "Assault Vest" && !hitsPhysical) stat = Math.floor(stat * 1.5);
  if (defItem === "Eviolite") stat = Math.floor(stat * 1.5);
  const activeDefTypes = defTera && defTera !== "None" ? [defTera] : defTypes;
  if (field.weather === "Snow" && hitsPhysical && activeDefTypes.includes("Ice")) stat = Math.floor(stat * 1.5);
  if (atkAbility === "Sword of Ruin" && hitsPhysical) stat = Math.floor(stat * 0.75);
  if (atkAbility === "Beads of Ruin" && !hitsPhysical) stat = Math.floor(stat * 0.75);
  const boostKey = move.overrideDefensiveStat || (move.category === "Physical" ? "def" : "spd");
  const boost = (defBoosts || {})[boostKey] || 0;
  if (boost !== 0) stat = Math.floor(stat * (boost >= 0 ? (2 + boost) / 2 : 2 / (2 + Math.abs(boost))));
  return stat;
}

// ─── CORE DAMAGE ROLLS ───────────────────────────────────────────────────────
// Returns { rolls: number[], typeEff: number, immune: boolean } or null
function calcDamageRolls(attacker, move, defStats, defTypes, defTera, defAbility, defItem, field, defBoosts) {
  // Protect: blocks all damage in Gen 9 VGC (no Max/Z-moves)
  if (field.isProtected) {
    const moveType = getEffectiveMoveType(move, attacker, field);
    const typeEff = getTypeEffectiveness(moveType, defTypes, defTera, field);
    return { rolls: [0], typeEff, immune: false, isProtected: true };
  }
  let bp = getEffectiveBasePower(move, attacker, field);
  if (bp === 0) return null;
  const moveType = getEffectiveMoveType(move, attacker, field);
  if (moveType === "Fairy" && (attacker.ability === "Fairy Aura" || defAbility === "Fairy Aura")) {
    bp = (attacker.ability === "Aura Break" || defAbility === "Aura Break")
      ? Math.floor(bp * 0.75)
      : Math.floor(bp * 5448 / 4096);
  }
  if (moveType === "Dark" && (attacker.ability === "Dark Aura" || defAbility === "Dark Aura")) {
    bp = (attacker.ability === "Aura Break" || defAbility === "Aura Break")
      ? Math.floor(bp * 0.75)
      : Math.floor(bp * 5448 / 4096);
  }

  const atkStat = getEffectiveAtkStat(attacker, move, defAbility, defStats, defBoosts);
  const defStat = getEffectiveDefStat(defStats, defItem, attacker.ability, move, defBoosts, field, defTypes, defTera);
  const level = attacker.level || 50;
  const isPhys = move.category === "Physical";

  if (!atkStat || !defStat) return null;

  const typeEff = getTypeEffectiveness(moveType, defTypes, defTera, field);
  if (typeEff === 0) return { rolls: [0], typeEff: 0, immune: true };
  if (checkAbilityImmunity(moveType, defAbility, move.flags, field)) return { rolls: [0], typeEff: 0, immune: true };
  if (defAbility === "Wonder Guard" && typeEff <= 1) return { rolls: [0], typeEff: 0, immune: true };

  const stabMod = getSTABMod(attacker.types, attacker.ability, moveType, attacker.tera);
  let base = Math.floor(Math.floor((Math.floor(2 * level / 5 + 2) * bp * atkStat) / defStat) / 50 + 2);

  if (move.isSpread && field.format !== "Singles") base = pokeRound(base * 0xC00 / 0x1000);
  const sunActive = field.weather === "Sun" || field.weather === "Harsh Sunshine";
  const rainActive = field.weather === "Rain" || field.weather === "Heavy Rain";
  if ((sunActive && moveType === "Fire") || (rainActive && moveType === "Water")) base = pokeRound(base * 0x1800 / 0x1000);
  else if ((sunActive && moveType === "Water") || (rainActive && moveType === "Fire")) base = pokeRound(base * 0x800 / 0x1000);
  if (field.isCritical) base = Math.floor(base * 1.5);

  const finalMods = [];
  if (field.isHelpingHand) finalMods.push(0x1800);
  if (field.isBattery && !isPhys) finalMods.push(0x14CD);
  if (field.isPowerSpot) finalMods.push(0x14CD);
  if (field.isSteelySpirit && moveType === "Steel") finalMods.push(0x1800);
  if (!field.isCritical) {
    const screenMod = field.format !== "Singles" ? 0xAAC : 0x800;
    if (field.isAuroraVeil) finalMods.push(screenMod);
    else if (field.isReflect && isPhys) finalMods.push(screenMod);
    else if (field.isLightScreen && !isPhys) finalMods.push(screenMod);
  }
  if (field.isFriendGuard) finalMods.push(0xC00);
  if ((defAbility === "Filter" || defAbility === "Solid Rock" || defAbility === "Prism Armor") && typeEff > 1) finalMods.push(0xC00);
  if (defAbility === "Multiscale" || defAbility === "Shadow Shield") finalMods.push(0x800);
  if (defAbility === "Thick Fat" && (moveType === "Fire" || moveType === "Ice")) finalMods.push(0x800);
  if (defAbility === "Ice Scales" && !isPhys) finalMods.push(0x800);
  if (defAbility === "Heatproof" && moveType === "Fire") finalMods.push(0x800);
  if (defAbility === "Punk Rock" && (move.flags || {}).sound) finalMods.push(0x800);
  if (attacker.item === "Life Orb") finalMods.push(0x14CC);
  if (attacker.item === "Expert Belt" && typeEff > 1) finalMods.push(0x1333);
  if (attacker.item === "Muscle Band" && isPhys) finalMods.push(0x1199);
  if (attacker.item === "Wise Glasses" && !isPhys) finalMods.push(0x1199);
  const typeBoostType = TYPE_BOOST_ITEMS[attacker.item];
  if (typeBoostType && typeBoostType === moveType) finalMods.push(0x1333);
  const berryType = RESIST_BERRIES[defItem];
  if (berryType && berryType === moveType && typeEff > 1) finalMods.push(0x800);

  const finalChain = chainMods(finalMods);
  const isBurned = attackerIsBurned(attacker, field) && isPhys && attacker.ability !== "Guts";

  const rolls = [];
  for (let i = 0; i <= 15; i++) {
    let d = Math.floor(base * (85 + i) / 100);
    d = pokeRound(d * stabMod / 0x1000);
    d = Math.floor(d * typeEff);
    if (isBurned) d = Math.floor(d / 2);
    d = pokeRound(d * finalChain / 0x1000);
    rolls.push(Math.max(1, d));
  }
  return { rolls, typeEff, immune: false };
}

// Wrapper that handles multi-hit: regular (multiply) and escalating BP (Triple Axel/Kick)
function calcMultihitRolls(attacker, move, defStats, defTypes, defTera, defAbility, defItem, field, defBoosts, hits) {
  if (!move.escalatingBp || hits <= 1) {
    const result = calcDamageRolls(attacker, move, defStats, defTypes, defTera, defAbility, defItem, field, defBoosts);
    if (!result || result.immune || hits <= 1) return result;
    return { ...result, rolls: result.rolls.map(r => r * hits) };
  }
  // Escalating BP: each hit has BP = baseBP × hitNumber
  let totalRolls = new Array(16).fill(0);
  let lastResult = null;
  for (let h = 1; h <= hits; h++) {
    const hitMove = { ...move, bp: move.bp * h };
    const result = calcDamageRolls(attacker, hitMove, defStats, defTypes, defTera, defAbility, defItem, field, defBoosts);
    if (!result) return null;
    if (result.immune) return result;
    lastResult = result;
    for (let i = 0; i < 16; i++) totalRolls[i] += result.rolls[i];
  }
  return lastResult ? { ...lastResult, rolls: totalRolls } : null;
}

// Official engine adapter for Gen 9 and Champions-format calcs. Champions keeps its
// local stat formula/data, then runs through Gen 9 damage mechanics with mod overrides.
function getOfficialCalc() {
  return window.MunchSmogonCalc || window.calc || null;
}

function officialCalcGeneration(pokemon) {
  const gen = Number(pokemon?.calcGeneration);
  if (gen === 0 || gen === 9) return gen;
  if (pokemon?.isChampions) return 0;
  return null;
}

function officialRuntimeGeneration(pokemon) {
  const gen = officialCalcGeneration(pokemon);
  return gen === 0 ? 9 : gen;
}

function supportsOfficialCalc(attacker, defender) {
  if (!getOfficialCalc()) return false;
  const atkGen = officialCalcGeneration(attacker);
  const defGen = officialCalcGeneration(defender);
  return (atkGen === 0 || atkGen === 9) && (defGen === 0 || defGen === 9);
}

function normalizeCalcStatus(status) {
  switch (status) {
    case "Burned": return "brn";
    case "Poisoned": return "psn";
    case "Badly Poisoned": return "tox";
    case "Paralyzed": return "par";
    case "Asleep": return "slp";
    case "Frozen": return "frz";
    default: return "";
  }
}

function normalizeCalcWeather(weather) {
  if (!weather || weather === "None") return undefined;
  if (weather === "Sandstorm") return "Sand";
  return weather;
}

function normalizeCalcTerrain(terrain) {
  if (!terrain || terrain === "None") return undefined;
  return terrain;
}

function effectiveWeatherForAttacker(attacker, field) {
  const weather = normalizeCalcWeather(field?.weather);
  if (attacker?.ability === "Mega Sol") return "Sun";
  return weather;
}

function buildOfficialField(attacker, defender, field) {
  const calc = getOfficialCalc();
  return new calc.Field({
    gameType: field?.format === "Singles" ? "Singles" : "Doubles",
    weather: effectiveWeatherForAttacker(attacker, field),
    terrain: normalizeCalcTerrain(field?.terrain),
    isGravity: !!field?.isGravity,
    isFairyAura: attacker?.ability === "Fairy Aura" || defender?.ability === "Fairy Aura",
    isDarkAura: attacker?.ability === "Dark Aura" || defender?.ability === "Dark Aura",
    isAuraBreak: attacker?.ability === "Aura Break" || defender?.ability === "Aura Break",
    isBeadsOfRuin: attacker?.ability === "Beads of Ruin" || defender?.ability === "Beads of Ruin",
    isSwordOfRuin: attacker?.ability === "Sword of Ruin" || defender?.ability === "Sword of Ruin",
    isTabletsOfRuin: attacker?.ability === "Tablets of Ruin" || defender?.ability === "Tablets of Ruin",
    isVesselOfRuin: attacker?.ability === "Vessel of Ruin" || defender?.ability === "Vessel of Ruin",
    attackerSide: {
      isHelpingHand: !!field?.isHelpingHand,
      isTailwind: !!field?.isAtkTailwind,
      isBattery: !!field?.isBattery,
      isPowerSpot: !!field?.isPowerSpot,
      isSteelySpirit: !!field?.isSteelySpirit,
    },
    defenderSide: {
      isReflect: !!field?.isReflect,
      isLightScreen: !!field?.isLightScreen,
      isAuroraVeil: !!field?.isAuroraVeil,
      isFriendGuard: !!field?.isFriendGuard,
      isProtected: !!field?.isProtected,
      isTailwind: !!field?.isDefTailwind,
    },
  });
}

function calcSpeciesOverrides(pokemon) {
  const baseStats = pokemon?.baseStats || {};
  return {
    ...(pokemon?.speciesOverrides || {}),
    name: pokemon?.calcSpecies || pokemon?.name,
    types: pokemon?.types?.length ? pokemon.types : ["Normal"],
    weightkg: Number(pokemon?.weightkg) || 0,
    baseStats: {
      hp: Number(baseStats.hp) || 1,
      atk: Number(baseStats.atk) || 1,
      def: Number(baseStats.def) || 1,
      spa: Number(baseStats.spa) || 1,
      spd: Number(baseStats.spd) || 1,
      spe: Number(baseStats.spe) || 1,
    },
    abilities: {
      "0": pokemon?.ability || pokemon?.speciesOverrides?.abilities?.["0"] || "",
    },
  };
}

function exactStatsFromPokemon(pokemon, spreadOrStats) {
  const source = spreadOrStats?.stats || spreadOrStats || pokemon?.customStats || pokemon?.averageStats || {};
  const stats = {};
  for (const k of ["hp", "atk", "def", "spa", "spd", "spe"]) stats[k] = Number(source[k]) || 1;
  return stats;
}

function buildOfficialPokemon(pokemon, spreadOrStats) {
  const calc = getOfficialCalc();
  const genNum = officialRuntimeGeneration(pokemon);
  if (!calc || !genNum) return null;
  const stats = exactStatsFromPokemon(pokemon, spreadOrStats);
  const spread = spreadOrStats?.stats ? spreadOrStats : null;
  const speciesName = pokemon?.calcSpecies || pokemon?.name || "Mew";
  const mon = new calc.Pokemon(genNum, speciesName, {
    name: pokemon?.name || speciesName,
    level: Number(pokemon?.level) || 50,
    ability: pokemon?.ability || undefined,
    item: pokemon?.item || undefined,
    status: normalizeCalcStatus(pokemon?.status),
    teraType: pokemon?.tera && pokemon.tera !== "None" ? pokemon.tera : undefined,
    nature: spread?.nature || pokemon?.nature || "Serious",
    evs: spread?.evs || pokemon?.evs || {},
    ivs: spread?.ivs || pokemon?.ivs || {},
    boosts: getMergedBoosts(pokemon),
    originalCurHP: stats.hp,
    overrides: calcSpeciesOverrides(pokemon),
    abilityOn: (pokemon?.ability === "Flash Fire" && pokemon?._abilityFlags?.flashfire) || undefined,
  });
  for (const k of ["hp", "atk", "def", "spa", "spd", "spe"]) {
    mon.rawStats[k] = stats[k];
    mon.stats[k] = stats[k];
  }
  // Unburden: double speed stat
  if (pokemon?._abilityFlags?.unburden) {
    mon.rawStats.spe = mon.rawStats.spe * 2;
    mon.stats.spe = mon.stats.spe * 2;
  }
  mon.originalCurHP = stats.hp;
  mon.types = pokemon?.types?.length ? pokemon.types : mon.types;
  mon.weightkg = Number(pokemon?.weightkg) || mon.weightkg || 0;
  return mon;
}

function buildOfficialMove(attacker, move, field, hits) {
  const calc = getOfficialCalc();
  const genNum = officialRuntimeGeneration(attacker);
  if (!calc || !genNum) return null;
  const overrides = { ...(move?.calcOverrides || {}) };
  if (!overrides.name) overrides.name = move?.calcName || move?.name;
  if (move?.variableBp) delete overrides.basePower;
  if (!move?.variableBp && Number(move?.bp) > 0) overrides.basePower = Number(move.bp);
  if (move?.type) overrides.type = move.type;
  if (move?.category) overrides.category = move.category;
  if (move?.flags) overrides.flags = move.flags;
  if (move?.isSpread) overrides.target = field?.format === "Singles" ? "normal" : "allAdjacentFoes";
  if (move?.multihit) overrides.multihit = move.multihit;
  // Charge: double Electric move base power (Electromorphosis / Wind Power)
  if (attacker?._abilityFlags?.charge && (overrides.type || move?.type) === "Electric" && overrides.basePower) {
    overrides.basePower = overrides.basePower * 2;
  }
  return new calc.Move(genNum, move?.calcName || move?.name || move?.id || "Tackle", {
    ability: attacker?.ability || undefined,
    item: attacker?.item || undefined,
    species: attacker?.name || undefined,
    isCrit: !!field?.isCritical,
    hits,
    overrides,
  });
}

function rollsFromOfficialDamage(damage) {
  if (typeof damage === "number") return [damage];
  if (!Array.isArray(damage)) return [];
  if (damage.length && Array.isArray(damage[0])) {
    const rollCount = Math.max(...damage.map(hit => hit.length || 1), 1);
    const rolls = [];
    for (let i = 0; i < rollCount; i++) {
      let total = 0;
      for (const hit of damage) total += Number(hit[Math.min(i, hit.length - 1)]) || 0;
      rolls.push(total);
    }
    return rolls;
  }
  return damage.map(d => Number(d) || 0);
}

function calcOfficialResult(attacker, move, defender, field, hits = 1, attackerStats = null, defenderStats = null) {
  try {
    if (!supportsOfficialCalc(attacker, defender)) return null;
    const calc = getOfficialCalc();
    const genNum = officialRuntimeGeneration(attacker);
    const atkMon = buildOfficialPokemon(attacker, attackerStats || attacker.customStats || attacker.averageStats);
    const defMon = buildOfficialPokemon(defender, defenderStats || defender.customStats || defender.averageStats);
    const calcMove = buildOfficialMove(attacker, move, field, hits);
    const calcField = buildOfficialField(attacker, defender, field);
    if (!atkMon || !defMon || !calcMove || !calcField) return null;
    const official = calc.calculate(genNum, atkMon, defMon, calcMove, calcField);
    const rolls = rollsFromOfficialDamage(official.damage);
    const immune = !rolls.length || rolls.every(r => r === 0);
    return { rolls, immune, typeEff: immune ? 0 : 1, calcResult: official };
  } catch (err) {
    console.warn("Official calc failed; falling back to legacy damage path.", err);
    return null;
  }
}

function calcWeightedNHKOChance(entries, n) {
  if (!entries?.length) return 0;
  let total = 0, weighted = 0;
  for (const entry of entries) {
    const w = Number(entry.weight) || 0;
    if (!w) continue;
    total += w;
    weighted += w * calcNHKOChance(entry.rolls, entry.hp, n);
  }
  return total ? weighted / total : 0;
}

function renderWeightedNHKORow(entries) {
  const o = calcWeightedNHKOChance(entries, 1);
  const t = o > 0 ? 0 : calcWeightedNHKOChance(entries, 2);
  const h = o > 0 || t > 0 ? 0 : calcWeightedNHKOChance(entries, 3);
  let label, pct;
  if (o > 0)      { label = "OHKO"; pct = o; }
  else if (t > 0) { label = "2HKO"; pct = t; }
  else if (h > 0) { label = "3HKO"; pct = h; }
  else return `<span style="color:#444;font-size:11px">Cannot 3HKO</span>`;
  const col = pct >= 100 ? "#4caf50" : pct >= 93.75 ? "#66bb6a" : pct >= 50 ? "#ffd54f" : "#ff9800";
  const txt = pct >= 100 ? `${label}: Guaranteed` : `${label}: ${pct.toFixed(1)}%`;
  return `<span class="calc-nhko-badge" style="color:${col}">${txt}</span>`;
}

function summarizeOfficialTier(entries, isPhys) {
  if (!entries?.length) return null;
  const weight = entries.reduce((sum, e) => sum + (Number(e.weight) || 0), 0) || 1;
  const minDamage = Math.min(...entries.flatMap(e => e.rolls));
  const maxDamage = Math.max(...entries.flatMap(e => e.rolls));
  const minPct = Math.min(...entries.map(e => Math.min(...e.rolls) / e.hp * 100));
  const maxPct = Math.max(...entries.map(e => Math.max(...e.rolls) / e.hp * 100));
  const avgHP = Math.round(entries.reduce((sum, e) => sum + e.hp * e.weight, 0) / weight);
  const avgDef = Math.round(entries.reduce((sum, e) => sum + e.defStat * e.weight, 0) / weight);
  const repr = entries[Math.floor(entries.length / 2)] || entries[0];
  return {
    koPct: calcWeightedNHKOChance(entries, 1),
    weight,
    hp: avgHP,
    defStat: avgDef,
    reprRolls: repr.rolls,
    reprHP: repr.hp,
    rollResults: entries,
    minDamage,
    maxDamage,
    minPct,
    maxPct,
    isPhys,
  };
}

function buildOfficialTierResults(entries, isPhys) {
  const buckets = { ohko: [], "2hko": [], "3hko": [], survives: [] };
  for (const entry of entries) {
    const o = calcNHKOChance(entry.rolls, entry.hp, 1);
    if (o > 0) { buckets.ohko.push(entry); continue; }
    const t = calcNHKOChance(entry.rolls, entry.hp, 2);
    if (t > 0) { buckets["2hko"].push(entry); continue; }
    const h = calcNHKOChance(entry.rolls, entry.hp, 3);
    if (h > 0) { buckets["3hko"].push(entry); continue; }
    buckets.survives.push(entry);
  }
  return {
    ohko: summarizeOfficialTier(buckets.ohko, isPhys),
    "2hko": summarizeOfficialTier(buckets["2hko"], isPhys),
    "3hko": summarizeOfficialTier(buckets["3hko"], isPhys),
    survives: summarizeOfficialTier(buckets.survives, isPhys),
  };
}

function collapseEquivalentSpreads(spreads) {
  const byStats = new Map();
  for (const spread of spreads || []) {
    const key = JSON.stringify(spread.stats || {});
    const existing = byStats.get(key);
    if (existing) {
      existing.weight += Number(spread.weight) || 0;
    } else {
      byStats.set(key, { ...spread, weight: Number(spread.weight) || 0 });
    }
  }
  return [...byStats.values()];
}

function calcKODistributionOfficial(attacker, move, defenderData, field, hits = 1) {
  const rawSpreads = defenderData?.allSpreads?.length ? defenderData.allSpreads : defenderData?.spreads;
  const spreads = collapseEquivalentSpreads(rawSpreads);
  if (!spreads?.length || !supportsOfficialCalc(attacker, defenderData)) return null;
  const isPhys = move.category === "Physical";
  const entries = [];
  let anyImmune = false;
  for (const spread of spreads) {
    const result = calcOfficialResult(attacker, move, defenderData, field, hits, attacker.customStats, spread);
    const stats = spread.stats || {};
    const hp = Number(stats.hp) || 1;
    const defStat = Number(isPhys ? stats.def : stats.spd) || 1;
    const weight = Number(spread.weight) || 0;
    if (!result || result.immune) {
      anyImmune = true;
      if (weight) entries.push({ weight, hp, defStat, rolls: [0], spread, immune: true });
      continue;
    }
    entries.push({ weight, hp, defStat, rolls: result.rolls, spread, calcResult: result.calcResult });
  }
  if (!entries.length) return null;
  const nonImmune = entries.filter(e => !e.immune);
  const tiers = buildOfficialTierResults(entries, isPhys);
  return {
    koPct: calcWeightedNHKOChance(entries, 1),
    tiers,
    isPhys,
    immune: anyImmune && !nonImmune.length,
    usedOfficial: true,
  };
}

// ─── TIERED KO DISTRIBUTION ──────────────────────────────────────────────────
// Returns { koPct, tiers: { ohko?, 2hko?, 3hko?, survives? }, immune }
function calcKODistribution(attacker, move, defenderData, field, hits = 1) {
  const official = calcKODistributionOfficial(attacker, move, defenderData, field, hits);
  if (official) return official;
  if (!attacker || !move || !defenderData) return null;
  const isPhys = move.category === "Physical";
  const allGroups = isPhys ? defenderData.defGroups : defenderData.spdGroups;
  if (!allGroups?.length) return null;

  const entries = [];
  let anyImmune = false;

  for (const grp of allGroups) {
    const defStats = { hp: grp.hp, def: isPhys ? grp.def : 999, spd: isPhys ? 999 : grp.spd };
    const result = calcMultihitRolls(attacker, move, defStats,
      defenderData.types, defenderData.tera, defenderData.ability, defenderData.item, field, getMergedBoosts(defenderData), hits);
    const weight = Number(grp.weight) || 0;
    if (!result) { entries.push({ weight, hp: grp.hp, defStat: isPhys ? grp.def : grp.spd, rolls: [0] }); continue; }
    if (result.immune) { anyImmune = true; entries.push({ weight, hp: grp.hp, defStat: isPhys ? grp.def : grp.spd, rolls: [0], immune: true }); continue; }
    entries.push({ weight, hp: grp.hp, defStat: isPhys ? grp.def : grp.spd, rolls: result.rolls });
  }

  if (!entries.length) return null;
  const nonImmune = entries.filter(e => !e.immune);
  const tiers = buildOfficialTierResults(entries, isPhys);

  return {
    koPct: calcWeightedNHKOChance(entries, 1),
    tiers,
    isPhys,
    immune: anyImmune && !nonImmune.length,
  };
}

// Reverse: single set check (attacker's one specific stats vs rolling damage)
function calcSingleKOChance(rolls, atkHP) {
  return (rolls.filter(r => r >= atkHP).length / 16) * 100;
}

// nHKO: probability sum of n independent random rolls >= hp
function calcNHKOChance(rolls, hp, n) {
  if (!rolls || !rolls.length || !hp) return 0;
  const rollCount = rolls.length;
  if (n === 1) return (rolls.filter(r => r >= hp).length / rollCount) * 100;
  const maxRoll = rolls[rolls.length - 1];
  const minRoll = rolls[0];
  if (maxRoll * n < hp) return 0;
  if (minRoll * n >= hp) return 100;
  let count = 0;
  function recurse(depth, sum) {
    if (sum + maxRoll * depth < hp) return;
    if (depth === 0) { count++; return; }
    for (const r of rolls) recurse(depth - 1, sum + r);
  }
  recurse(n, 0);
  return (count / Math.pow(rollCount, n)) * 100;
}

// Render the single best applicable nHKO label (cascade: OHKO → 2HKO → 3HKO)
function renderNHKORow(rolls, hp) {
  if (!rolls || !hp) return "";
  const o = calcNHKOChance(rolls, hp, 1);
  const t = o > 0 ? 0 : calcNHKOChance(rolls, hp, 2);
  const h = o > 0 || t > 0 ? 0 : calcNHKOChance(rolls, hp, 3);
  let label, pct;
  if (o > 0)      { label = "OHKO"; pct = o; }
  else if (t > 0) { label = "2HKO"; pct = t; }
  else if (h > 0) { label = "3HKO"; pct = h; }
  else return `<span style="color:#444;font-size:11px">Cannot 3HKO</span>`;
  const col = pct >= 100 ? "#4caf50" : pct >= 93.75 ? "#66bb6a" : pct >= 50 ? "#ffd54f" : "#ff9800";
  const txt = pct >= 100 ? `${label}: Guaranteed` : `${label}: ${pct.toFixed(1)}%`;
  return `<span class="calc-nhko-badge" style="color:${col}">${txt}</span>`;
}

// ─── QUICK DAMAGE SUMMARY (for move list badges) ──────────────────────────────
// Returns a short string like "54–64%" or "immune" using defender average stats.
function quickDamageSummary(attacker, move, defenderData, field, hits = 1) {
  if (!isDamagingMove(move)) return "—";
  const useManual = defenderData.defenderMode === "manual" && defenderData.customStats;
  const defStats = useManual ? defenderData.customStats : defenderData.averageStats;
  if (!defStats) return "—";
  const official = calcOfficialResult(attacker, move, defenderData, field, hits, attacker.customStats, defStats);
  const result = official || calcMultihitRolls(attacker, move, defStats,
    defenderData.types, defenderData.tera, defenderData.ability, defenderData.item, field, undefined, hits);
  if (!result) return "—";
  if (result.immune) return "immune";
  const hp = defStats.hp || 1;
  const minP = (result.rolls[0] / hp * 100).toFixed(0);
  const maxP = (result.rolls[result.rolls.length - 1] / hp * 100).toFixed(0);
  return `${minP}–${maxP}%`;
}

// Quick damage for reverse (defender attacks user Pokemon using average stats)
function quickReverseSummary(defenderData, move, attacker, field, hits = 1) {
  if (!isDamagingMove(move)) return "—";
  const defStats = (defenderData.defenderMode === "manual" && defenderData.customStats)
    ? defenderData.customStats : defenderData.averageStats;
  const defAsAttacker = {
    types: defenderData.types, ability: defenderData.ability, item: defenderData.item,
    tera: defenderData.tera, level: defenderData.level,
    customStats: defStats,
    boosts: defenderData.boosts || {},
    status: defenderData.status || "Healthy",
    name: defenderData.name,
    weightkg: defenderData.weightkg,
    baseStats: defenderData.baseStats || {},
    calcSpecies: defenderData.calcSpecies,
    calcGeneration: defenderData.calcGeneration,
    speciesOverrides: defenderData.speciesOverrides,
    _abilityBoosts: defenderData._abilityBoosts,
    _abilityFlags: defenderData._abilityFlags,
    abilityActivated: defenderData.abilityActivated,
  };
  const atkHP = attacker.customStats.hp || 1;
  const official = calcOfficialResult(defAsAttacker, move, attacker, field, hits, defStats, attacker.customStats);
  const result = official || calcMultihitRolls(defAsAttacker, move, attacker.customStats,
    attacker.types, attacker.tera, attacker.ability, attacker.item, field, undefined, hits);
  if (!result) return "—";
  if (result.immune) return "immune";
  const minP = (result.rolls[0] / atkHP * 100).toFixed(0);
  const maxP = (result.rolls[result.rolls.length - 1] / atkHP * 100).toFixed(0);
  return `${minP}–${maxP}%`;
}

// ─── STATE ────────────────────────────────────────────────────────────────────
let calcCache = {};
let calcState = {
  attacker: null,
  defender: null,
  selectedMove: null,  // { source: "attacker"|"defender", move: {...}, isCrit: false }
  critByMove: {},
  hitsByMove: {},
  field: {
    format: "Doubles",
    weather: "None",
    terrain: "None",
    yourReflect: false, yourLightScreen: false, yourAuroraVeil: false,
    yourHelpingHand: false, yourTailwind: false, yourFriendGuard: false, yourProtect: false,
    yourBattery: false, yourPowerSpot: false, yourSteelySpirit: false,
    oppReflect: false, oppLightScreen: false, oppAuroraVeil: false,
    oppHelpingHand: false, oppTailwind: false, oppFriendGuard: false, oppProtect: false,
    oppBattery: false, oppPowerSpot: false, oppSteelySpirit: false,
    isReflect: false, isLightScreen: false, isAuroraVeil: false,
    isHelpingHand: false, isAtkTailwind: false,
    isDefTailwind: false, isFriendGuard: false,
    isGravity: false,
    isTrickRoom: false,
    isCritical: false,
  },
};

function moveCritKey(source, moveId) {
  return `${source}:${moveId}`;
}

function isMoveCrit(source, moveId) {
  return !!calcState.critByMove?.[moveCritKey(source, moveId)];
}

function setMoveCrit(source, moveId, checked) {
  const key = moveCritKey(source, moveId);
  if (checked) calcState.critByMove[key] = true;
  else delete calcState.critByMove[key];
}

function clearCritStateForSource(source) {
  Object.keys(calcState.critByMove || {}).forEach(key => {
    if (key.startsWith(`${source}:`)) delete calcState.critByMove[key];
  });
}

function moveHitsKey(source, moveId) {
  return `${source}:${moveId}`;
}

function getMoveHits(source, moveId, move) {
  const stored = calcState.hitsByMove?.[moveHitsKey(source, moveId)];
  if (stored != null) return stored;
  if (move?.multihit) return move.multihit[1]; // default to max hits
  return 1;
}

function setMoveHits(source, moveId, hits) {
  calcState.hitsByMove[moveHitsKey(source, moveId)] = hits;
}

function clearHitsStateForSource(source) {
  Object.keys(calcState.hitsByMove || {}).forEach(key => {
    if (key.startsWith(`${source}:`)) delete calcState.hitsByMove[key];
  });
}

function getEffectiveFieldForSource(source, isCritical = false) {
  const field = calcState.field;
  const userAttacking = source === "attacker";
  const target = userAttacking ? calcState.defender : calcState.attacker;
  const sourcePokemon = userAttacking ? calcState.attacker : calcState.defender;
  // Seed Sower: override terrain to Grassy when activated on either side
  const seedSowerTerrain = (sourcePokemon?._abilityFlags?.grassyterrain || target?._abilityFlags?.grassyterrain);
  return {
    ...field,
    terrain: seedSowerTerrain ? "Grassy" : field.terrain,
    isCritical,
    attackerWeightkg: sourcePokemon?.weightkg ?? null,
    targetWeightkg: target?.weightkg ?? null,
    attackerAbility: sourcePokemon?.ability || "",
    isHelpingHand: userAttacking ? field.yourHelpingHand : field.oppHelpingHand,
    isReflect: userAttacking ? field.oppReflect : field.yourReflect,
    isLightScreen: userAttacking ? field.oppLightScreen : field.yourLightScreen,
    isAuroraVeil: userAttacking ? field.oppAuroraVeil : field.yourAuroraVeil,
    isFriendGuard: userAttacking ? field.oppFriendGuard : field.yourFriendGuard,
    isProtected: userAttacking ? field.oppProtect : field.yourProtect,
    isBattery: userAttacking ? field.yourBattery : field.oppBattery,
    isPowerSpot: userAttacking ? field.yourPowerSpot : field.oppPowerSpot,
    isSteelySpirit: userAttacking ? field.yourSteelySpirit : field.oppSteelySpirit,
  };
}

// ─── ABILITY ACTIVATION ──────────────────────────────────────────────────────
function _mergeBoosts(target, source) {
  for (const [k, v] of Object.entries(source || {})) {
    target[k] = Math.max(-6, Math.min(6, (target[k] || 0) + v));
  }
}

function _applyTargetedAbility(activation, source, target, sourceBoosts, targetBoosts) {
  const targetAbility = target?.ability || "";
  if (activation.immuneAbilities?.includes(targetAbility)) return;
  const reaction = activation.reactions?.[targetAbility];
  if (reaction) {
    if (reaction.reflect) { _mergeBoosts(sourceBoosts, activation.boosts); return; }
    if (reaction.replace) { _mergeBoosts(targetBoosts, reaction.replace); return; }
    if (reaction.extra)   { _mergeBoosts(targetBoosts, activation.boosts); _mergeBoosts(targetBoosts, reaction.extra); return; }
  }
  _mergeBoosts(targetBoosts, activation.boosts);
}

// Recompute _abilityBoosts / _abilityFlags on both sides before every calc.
function recomputeAbilityEffects() {
  const atk = calcState.attacker;
  const def = calcState.defender;
  if (atk) { atk._abilityBoosts = {}; atk._abilityFlags = {}; }
  if (def) { def._abilityBoosts = {}; def._abilityFlags = {}; }
  if (!atk || !def) return;

  if (atk.abilityActivated) {
    const act = ABILITY_ACTIVATIONS[atk.ability];
    if (act) {
      if (act.target === "self") {
        if (act.boosts) _mergeBoosts(atk._abilityBoosts, act.boosts);
        if (act.effect) atk._abilityFlags[act.effect] = true;
      } else if (act.target === "opponent") {
        _applyTargetedAbility(act, atk, def, atk._abilityBoosts, def._abilityBoosts);
      }
    }
  }

  if (def.abilityActivated) {
    const act = ABILITY_ACTIVATIONS[def.ability];
    if (act) {
      if (act.target === "self") {
        if (act.boosts) _mergeBoosts(def._abilityBoosts, act.boosts);
        if (act.effect) def._abilityFlags[act.effect] = true;
      } else if (act.target === "opponent") {
        _applyTargetedAbility(act, def, atk, def._abilityBoosts, atk._abilityBoosts);
      }
    }
  }
}

function getMergedBoosts(pokemon) {
  const base = { ...(pokemon?.boosts || {}) };
  for (const [k, v] of Object.entries(pokemon?._abilityBoosts || {})) {
    base[k] = Math.max(-6, Math.min(6, (base[k] || 0) + v));
  }
  return base;
}

function updateAbilityCheckbox(isAttacker) {
  const prefix = isAttacker ? "calc-attacker" : "calc-defender";
  const stateKey = isAttacker ? "attacker" : "defender";
  const wrapEl = document.getElementById(`${prefix}-ability-activate`);
  const cbEl   = document.getElementById(`${prefix}-ability-activate-cb`);
  if (!wrapEl || !cbEl) return;

  const pokemon = calcState[stateKey];
  const ability = pokemon?.ability || "";
  const activation = ABILITY_ACTIVATIONS[ability];

  if (!activation) {
    wrapEl.style.display = "none";
    if (pokemon) pokemon.abilityActivated = false;
    return;
  }

  wrapEl.style.display = "";
  wrapEl.title = `${ability}: ${activation.desc}`;
  cbEl.checked = activation.defaultOn;
  if (pokemon) pokemon.abilityActivated = activation.defaultOn;
}

function onAbilityActivationToggle(isAttacker) {
  const prefix = isAttacker ? "calc-attacker" : "calc-defender";
  const stateKey = isAttacker ? "attacker" : "defender";
  const cbEl = document.getElementById(`${prefix}-ability-activate-cb`);
  const pokemon = calcState[stateKey];
  if (pokemon) pokemon.abilityActivated = cbEl?.checked || false;
  runCalc();
}

// ─── API FETCH ────────────────────────────────────────────────────────────────
async function fetchCalcData(pokemonName) {
  const key = `${window.selectedFormat}/${window.selectedRating}/${pokemonName}`;
  if (calcCache[key]) return calcCache[key];
  const monthParam = window.selectedMonth ? `?month=${window.selectedMonth}` : "";
  const url = `/api/${window.selectedFormat}/${window.selectedRating}/calc/${encodeURIComponent(pokemonName)}${monthParam}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    calcCache[key] = data;
    return data;
  } catch (e) { return null; }
}

// ─── STAT CALCULATION FROM EVs / SPs ─────────────────────────────────────────
const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"];

function applyEffectiveStat(el, base, boost) {
  if (boost !== 0) {
    const eff = Math.floor(base * (boost >= 0 ? (2 + boost) / 2 : 2 / (2 + Math.abs(boost))));
    el.textContent = eff;
    el.style.color = boost > 0 ? "#a5d6a7" : "#ef9a9a";
  } else {
    el.textContent = base;
    el.style.color = el.dataset.natColor || "";
  }
}

function calcFinalStat(base, ev, natureMult, isHP, level, iv) {
  if (iv === undefined) iv = 31;
  if (isHP) return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10;
  return Math.floor((Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5) * natureMult);
}
function calcChampionsStat(base, sp, alignment, isHP) {
  if (isHP) return base + sp + 75;
  return Math.floor((base + sp + 20) * alignment);
}

// Reads nature + EV/SP inputs, calculates final stats, updates display spans, returns stats object.
function computeStatsFromInputs() {
  const atk = calcState.attacker;
  if (!atk || !atk.baseStats) return null;
  const nature = document.getElementById("calc-atk-nature")?.value || "Hardy";
  const mods = NATURES[nature] || {};
  const level = atk.level || 50;
  const isChamp = atk.isChampions;
  const stats = {};
  const evTable = {};
  const ivTable = {};
  for (const k of STAT_KEYS) {
    const ev = parseInt(document.getElementById(`calc-atk-ev-${k}`)?.value) || 0;
    evTable[k] = ev;
    const rawIV = parseInt(document.getElementById(`calc-atk-iv-${k}`)?.value);
    const iv = isChamp ? 31 : (isNaN(rawIV) ? 31 : rawIV);
    ivTable[k] = iv;
    const base = atk.baseStats[k] || 0;
    const isHP = k === "hp";
    const mult = isHP ? 1 : (mods[k] || 1);
    stats[k] = isChamp ? calcChampionsStat(base, ev, mult, isHP)
                       : calcFinalStat(base, ev, mult, isHP, level, iv);
    const finalEl = document.getElementById(`calc-atk-final-${k}`);
    if (finalEl) {
      let natColor = "";
      if (!isHP) {
        if (mods[k] === 1.1) natColor = "#ef9a9a";
        else if (mods[k] === 0.9) natColor = "#90caf9";
      }
      if (isHP) {
        finalEl.textContent = stats[k];
        finalEl.style.color = natColor;
      } else {
        finalEl.dataset.base = stats[k];
        finalEl.dataset.natColor = natColor;
        applyEffectiveStat(finalEl, stats[k], (atk.boosts || {})[k] || 0);
      }
    }
  }
  atk.nature = nature;
  atk.evs = evTable;
  atk.ivs = ivTable;
  updateEVTotal();
  return stats;
}

function populateNatureSelect(selectId, selected) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const groups = [
    ["Neutral", ["Hardy","Docile","Serious","Bashful","Quirky"]],
    ["+Atk",    ["Lonely","Brave","Adamant","Naughty"]],
    ["+Def",    ["Bold","Relaxed","Impish","Lax"]],
    ["+SpA",    ["Modest","Mild","Quiet","Rash"]],
    ["+SpD",    ["Calm","Gentle","Sassy","Careful"]],
    ["+Spe",    ["Timid","Hasty","Jolly","Naive"]],
  ];
  sel.innerHTML = groups.map(([lbl, nats]) =>
    `<optgroup label="${lbl}">${nats.map(n => `<option value="${n}"${n === selected ? " selected" : ""}>${n}</option>`).join("")}</optgroup>`
  ).join("");
}

function fillEVTable(nature, evs) {
  populateNatureSelect("calc-atk-nature", nature);
  STAT_KEYS.forEach((k, i) => {
    const el = document.getElementById(`calc-atk-ev-${k}`);
    if (el) el.value = evs[i] ?? 0;
  });
  computeStatsFromInputs();
}

function setBaseStatDisplay(baseStats) {
  STAT_KEYS.forEach(k => {
    const el = document.getElementById(`calc-atk-base-${k}`);
    if (el) el.textContent = baseStats[k] ?? "—";
  });
}

function toggleIVColumns(isChampions) {
  const display = isChampions ? "none" : "";
  document.querySelectorAll(".calc-atk-iv-col, .calc-def-iv-col").forEach(el => {
    el.style.display = display;
  });
}

// ─── DEFENDER STAT HELPERS ───────────────────────────────────────────────────
function computeDefenderStatsFromInputs() {
  const def = calcState.defender;
  if (!def || !def.baseStats) return null;
  const nature = document.getElementById("calc-defender-nature")?.value || "Hardy";
  const mods = NATURES[nature] || {};
  const level = def.level || 50;
  const isChamp = def.isChampions;
  const stats = {};
  const evTable = {};
  const ivTable = {};
  for (const k of STAT_KEYS) {
    const ev = parseInt(document.getElementById(`calc-def-ev-${k}`)?.value) || 0;
    evTable[k] = ev;
    const rawIV = parseInt(document.getElementById(`calc-def-iv-${k}`)?.value);
    const iv = isChamp ? 31 : (isNaN(rawIV) ? 31 : rawIV);
    ivTable[k] = iv;
    const base = def.baseStats[k] || 0;
    const isHP = k === "hp";
    const mult = isHP ? 1 : (mods[k] || 1);
    stats[k] = isChamp ? calcChampionsStat(base, ev, mult, isHP)
                       : calcFinalStat(base, ev, mult, isHP, level, iv);
    const finalEl = document.getElementById(`calc-def-final-${k}`);
    if (finalEl) {
      let natColor = "";
      if (!isHP) {
        if (mods[k] === 1.1) natColor = "#ef9a9a";
        else if (mods[k] === 0.9) natColor = "#90caf9";
      }
      if (isHP) {
        finalEl.textContent = stats[k];
        finalEl.style.color = natColor;
      } else {
        finalEl.dataset.base = stats[k];
        finalEl.dataset.natColor = natColor;
        applyEffectiveStat(finalEl, stats[k], (def.boosts || {})[k] || 0);
      }
    }
  }
  def.nature = nature;
  def.evs = evTable;
  def.ivs = ivTable;
  updateDefenderEVTotal();
  return stats;
}

function fillDefenderEVTable(nature, evs) {
  populateNatureSelect("calc-defender-nature", nature);
  STAT_KEYS.forEach((k, i) => {
    const el = document.getElementById(`calc-def-ev-${k}`);
    if (el) el.value = evs[i] ?? 0;
  });
  if (calcState.defender?.defenderMode === "manual") {
    computeDefenderStatsFromInputs();
  }
}

function updateDefenderEVTotal() {
  let total = 0;
  STAT_KEYS.forEach(k => {
    total += parseInt(document.getElementById(`calc-def-ev-${k}`)?.value) || 0;
  });
  const el = document.getElementById("calc-def-ev-total");
  if (el) el.textContent = total;
}

function updateDefenderEVInputLimits(isChampions) {
  const max = isChampions ? 32 : 252;
  STAT_KEYS.forEach(k => {
    const el = document.getElementById(`calc-def-ev-${k}`);
    if (el) {
      el.max = max;
      if (parseInt(el.value) > max) el.value = max;
    }
  });
  const maxLabel = document.getElementById("calc-def-ev-max");
  if (maxLabel) maxLabel.textContent = isChampions ? "" : " / 510";
  updateDefenderEVTotal();
}

function onDefenderStatChange() {
  if (!calcState.defender || calcState.defender.defenderMode !== "manual") return;
  const max = calcState.defender.isChampions ? 32 : 252;
  STAT_KEYS.forEach(k => {
    const el = document.getElementById(`calc-def-ev-${k}`);
    if (el) {
      let v = parseInt(el.value) || 0;
      if (v > max) { el.value = max; }
      if (v < 0) { el.value = 0; }
    }
    // Clamp IV values (0-31)
    const ivEl = document.getElementById(`calc-def-iv-${k}`);
    if (ivEl) {
      let iv = parseInt(ivEl.value) || 0;
      if (iv > 31) { ivEl.value = 31; }
      if (iv < 0) { ivEl.value = 0; }
    }
  });
  calcState.defender.customStats = computeDefenderStatsFromInputs();

  // Sync preset display to current nature+EVs
  const nature = document.getElementById("calc-defender-nature")?.value || "Hardy";
  const evTable = {};
  STAT_KEYS.forEach(k => { evTable[k] = parseInt(document.getElementById(`calc-def-ev-${k}`)?.value) || 0; });
  const currentStr = buildSpreadStr(nature, evTable);
  const match = findMatchingSpread(calcState.defender.spreads, currentStr);
  const display = document.getElementById("calc-defender-preset-display");
  if (match) {
    const readable = formatSpreadReadable(match.spread.spread);
    if (display) { display.textContent = spreadDisplayText(readable, match.spread.weight); display.dataset.value = String(match.idx); }
  } else {
    if (display) { display.textContent = "Custom Spread"; display.dataset.value = ""; }
  }

  runCalc();
}

// ─── POPULATE HELPERS ─────────────────────────────────────────────────────────
function populateTeraSelect(selectId, currentTera) {
  const types = ["None","Normal","Fire","Water","Electric","Grass","Ice","Fighting","Poison","Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy","Stellar"];
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = types.map(t => `<option value="${t}"${t === currentTera ? " selected" : ""}>${t}</option>`).join("");
}

// Registry for option autocompletes (ability/item fields)
const _optionACs = {};

// Master lists from smogon-calc (populated on init)
let _allAbilityNames = [];
let _allItemNames = [];

function loadSmogonCalcLists() {
  const calc = getOfficialCalc();
  if (!calc?.Generations) return;
  try {
    const gen = calc.Generations.get(9);
    if (gen.abilities) _allAbilityNames = [...gen.abilities].map(a => a.name).sort();
    if (gen.items) _allItemNames = [...gen.items].map(i => i.name).sort();
  } catch (e) { /* ignore */ }
}

function initOptionAutocomplete(inputId, dropdownId, onChange) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;
  let activeIdx = -1;
  // options: array of { name, usage } — usage may be null for non-usage entries
  let options = [];

  function setOptions(opts, selected) {
    options = opts;
    input.value = selected || "";
  }

  function filterItems(query) {
    const val = query.trim().toLowerCase();
    if (!val) return options;
    const starts = options.filter(o => o.name.toLowerCase().startsWith(val));
    const contains = options.filter(o => !o.name.toLowerCase().startsWith(val) && o.name.toLowerCase().includes(val));
    return [...starts, ...contains];
  }

  function renderItem(o, i) {
    const usageHtml = o.usage != null
      ? `<span class="calc-ac-usage">${escapeHTML(o.usage.toFixed(1) + "%")}</span>`
      : "";
    return `<div class="calc-ac-item calc-option-ac-item" data-idx="${i}" data-name="${escapeHTML(o.name)}">
      <span class="calc-ac-name">${escapeHTML(o.name)}</span>${usageHtml}</div>`;
  }

  function showItems(items) {
    activeIdx = -1;
    if (!items.length) { dropdown.style.display = "none"; return; }
    dropdown.innerHTML = items.map(renderItem).join("");
    dropdown.style.display = "block";
    dropdown.querySelectorAll(".calc-ac-item").forEach(el => {
      el.addEventListener("mousedown", e => { e.preventDefault(); choose(el.dataset.name); });
    });
  }

  function choose(name) {
    input.value = name;
    dropdown.style.display = "none";
    activeIdx = -1;
    onChange(name);
  }

  function commit() {
    const val = input.value.trim();
    onChange(val);
  }

  function setActive(idx) {
    const items = dropdown.querySelectorAll(".calc-ac-item");
    items.forEach(el => el.classList.remove("active"));
    activeIdx = Math.max(-1, Math.min(idx, items.length - 1));
    if (activeIdx >= 0) items[activeIdx]?.classList.add("active");
  }

  input.addEventListener("input", () => showItems(filterItems(input.value)));
  input.addEventListener("keydown", e => {
    const items = dropdown.querySelectorAll(".calc-ac-item");
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIdx + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeIdx - 1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0) choose(items[activeIdx].dataset.name);
      else commit();
    }
    else if (e.key === "Escape") { dropdown.style.display = "none"; }
  });
  input.addEventListener("blur", () => setTimeout(() => { dropdown.style.display = "none"; commit(); }, 150));
  input.addEventListener("focus", () => { setTimeout(() => input.select(), 0); showItems(options); });
  input.addEventListener("click", () => showItems(options));

  _optionACs[inputId] = { setOptions };
}

function populateAbilitySelect(inputId, allAbilities, top) {
  const ac = _optionACs[inputId];
  if (!ac) return;
  // allAbilities: [{name, usage}] from API
  const usageNames = new Set(allAbilities.map(a => a.name));
  const rest = _allAbilityNames.filter(n => !usageNames.has(n)).map(n => ({ name: n, usage: null }));
  ac.setOptions([...allAbilities, ...rest], top || (allAbilities[0]?.name) || "");
}

function populateItemSelect(inputId, allItems, top) {
  const ac = _optionACs[inputId];
  if (!ac) return;
  // allItems: [{name, usage}] from API
  const usageNames = new Set(allItems.map(a => a.name));
  const rest = _allItemNames.filter(n => !usageNames.has(n) && n.toLowerCase() !== "none").map(n => ({ name: n, usage: null }));
  ac.setOptions([{ name: "None", usage: null }, ...allItems, ...rest], top || "None");
}

function formatSpreadReadable(spreadStr) {
  const [nature, evStr] = (spreadStr || "").split(":");
  if (!nature || !evStr) return spreadStr || "";
  const labels = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
  const evs = evStr.split("/").map(Number);
  const parts = evs.map((v, i) => v ? `${v} ${labels[i]}` : "").filter(Boolean);
  return parts.length ? `${nature} ${parts.join(" / ")}` : nature;
}

function buildSpreadStr(nature, evs) {
  return nature + ":" + STAT_KEYS.map(k => evs[k] || 0).join("/");
}

function findMatchingSpread(spreads, spreadStr) {
  if (!spreads) return null;
  for (let i = 0; i < spreads.length; i++) {
    if (spreads[i].spread === spreadStr) return { idx: i, spread: spreads[i] };
  }
  return null;
}

function spreadDisplayText(readableStr, weight) {
  const pct = (weight * 100).toFixed(1) + "%";
  return readableStr + "  (" + pct + ")";
}

function spreadItemHTML(spread, idx, dataAttr = "data-idx") {
  const pct = (spread.weight * 100).toFixed(1) + "%";
  return `<div class="calc-ac-item calc-preset-item" ${dataAttr}="${idx}">
    <span class="calc-preset-name">${escapeHTML(formatSpreadReadable(spread.spread))}</span>
    <span class="calc-preset-usage">${escapeHTML(pct)}</span>
  </div>`;
}

function initPresetDropdown(displayId, dropdownId, onSelect) {
  const display = document.getElementById(displayId);
  const dropdown = document.getElementById(dropdownId);
  if (!display || !dropdown) return;
  display.addEventListener("click", () => {
    if (dropdown.children.length === 0) return;
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
  });
  display.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); display.click(); }
    if (e.key === "Escape") dropdown.style.display = "none";
  });
  display.addEventListener("blur", () => setTimeout(() => { dropdown.style.display = "none"; }, 150));
  // Delegate click on items
  dropdown.addEventListener("mousedown", e => {
    e.preventDefault();
    const item = e.target.closest(".calc-ac-item");
    if (!item) return;
    const val = item.dataset.idx ?? item.dataset.value;
    if (val != null) { dropdown.style.display = "none"; onSelect(val); }
  });
}

function populatePresetSelect(data) {
  const display = document.getElementById("calc-attacker-preset-display");
  const dropdown = document.getElementById("calc-attacker-preset-dropdown");
  if (!display || !dropdown) return;
  if (!data.spreads?.length) {
    display.textContent = "No spread data";
    dropdown.innerHTML = "";
    return;
  }
  dropdown.innerHTML = data.spreads.map((s, i) => spreadItemHTML(s, i)).join("");
  const first = data.spreads[0];
  display.textContent = spreadDisplayText(formatSpreadReadable(first.spread), first.weight);
  display.dataset.value = "0";
}

function populateDefenderPresetDisplay(data) {
  const display = document.getElementById("calc-defender-preset-display");
  const dropdown = document.getElementById("calc-defender-preset-dropdown");
  if (display && dropdown) {
    let html = `<div class="calc-ac-item calc-preset-item" data-value="average">
      <span class="calc-preset-name">Usage-weighted average</span>
    </div>`;
    html += (data.spreads || []).map((s, i) => spreadItemHTML(s, i, "data-value")).join("");
    dropdown.innerHTML = html;
    display.innerHTML = `Usage-weighted average${tipHTML("Stats are averaged across all spreads this Pokémon runs on ladder, weighted by usage. Damage is calculated against every individual spread.")}`;
    display.dataset.value = "average";
  }
}

function setDefenderStatDisplay(baseStats, avgStats) {
  STAT_KEYS.forEach(k => {
    const baseEl = document.getElementById(`calc-def-base-${k}`);
    const avgEl = document.getElementById(`calc-def-avg-${k}`);
    const finalEl = document.getElementById(`calc-def-final-${k}`);
    const baseVal = baseStats?.[k];
    const avgVal = avgStats?.[k];
    if (baseEl) baseEl.textContent = baseVal ?? "—";
    if (avgEl) avgEl.textContent = avgVal ?? "—";
    if (!finalEl) return;
    if (avgVal == null) {
      finalEl.textContent = "—";
      finalEl.dataset.base = "";
      finalEl.style.color = "";
      return;
    }
    if (k === "hp") {
      finalEl.textContent = avgVal;
      finalEl.dataset.base = avgVal;
      finalEl.style.color = "";
    } else {
      finalEl.dataset.base = avgVal;
      finalEl.dataset.natColor = "";
      applyEffectiveStat(finalEl, avgVal, (calcState.defender?.boosts || {})[k] || 0);
    }
  });
}

// ─── CUSTOM AUTOCOMPLETE ──────────────────────────────────────────────────────
function initCalcAutocomplete(inputId, dropdownId, onSelect) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;
  let activeIdx = -1;

  function getPokemonOptions() {
    const source = (Array.isArray(window.calcPokemonOptions) && window.calcPokemonOptions.length)
      ? window.calcPokemonOptions
      : (window.calcPokemonNames || []).map(name => ({ name, usage: "" }));
    return source
      .map(p => (typeof p === "string" ? { name: p, usage: "" } : p))
      .filter(p => p?.name);
  }

  function formatUsage(usage) {
    const text = String(usage ?? "").trim();
    if (!text) return "";
    return text.endsWith("%") ? text : `${text}%`;
  }

  function filterItems(query) {
    const val = query.trim().toLowerCase();
    const options = getPokemonOptions();
    if (!val) return options;
    const starts = options.filter(p => p.name.toLowerCase().startsWith(val));
    const contains = options.filter(p => !p.name.toLowerCase().startsWith(val) && p.name.toLowerCase().includes(val));
    return [...starts, ...contains];
  }

  function showItems(items) {
    activeIdx = -1;
    if (!items.length) { dropdown.style.display = "none"; return; }
    dropdown.innerHTML = items.map((p, i) => {
      const name = escapeHTML(p.name);
      const usage = formatUsage(p.usage);
      return `<div class="calc-ac-item calc-pokemon-ac-item" data-idx="${i}" data-name="${name}">
        <span class="calc-ac-name">${name}</span>
        <span class="calc-ac-usage">${escapeHTML(usage)}</span>
      </div>`;
    }).join("");
    dropdown.style.display = "block";
    dropdown.querySelectorAll(".calc-ac-item").forEach(el => {
      el.addEventListener("mousedown", e => { e.preventDefault(); choose(el.dataset.name); });
    });
  }

  function choose(name) {
    input.value = name;
    dropdown.style.display = "none";
    activeIdx = -1;
    onSelect(name);
  }

  function setActive(idx) {
    const items = dropdown.querySelectorAll(".calc-ac-item");
    items.forEach(el => el.classList.remove("active"));
    activeIdx = Math.max(-1, Math.min(idx, items.length - 1));
    if (activeIdx >= 0) items[activeIdx]?.classList.add("active");
  }

  input.addEventListener("input", () => {
    showItems(filterItems(input.value));
  });

  input.addEventListener("keydown", e => {
    const items = dropdown.querySelectorAll(".calc-ac-item");
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIdx + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeIdx - 1); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); choose(items[activeIdx].dataset.name); }
    else if (e.key === "Escape") { dropdown.style.display = "none"; }
  });

  input.addEventListener("blur", () => setTimeout(() => { dropdown.style.display = "none"; }, 150));
  input.addEventListener("focus", () => {
    setTimeout(() => input.select(), 0);
    showItems(getPokemonOptions());
  });
  input.addEventListener("click", () => showItems(getPokemonOptions()));
}

function typeBadgeHTML(type) {
  const color = TYPE_COLORS[type] || "#888";
  const dark = ["Electric","Ice","Ground","Steel","Fairy","Normal","Dragon"].includes(type);
  return `<span class="calc-type-badge" style="background:${color};color:${dark?"#333":"#fff"}">${type}</span>`;
}

// ─── MOVE LIST RENDERING ──────────────────────────────────────────────────────
function renderHitsDropdown(move, source, isAttacker) {
  if (!move.multihit) return "";
  const [min, max] = move.multihit;
  const current = getMoveHits(source, move.id, move);
  let opts = "";
  for (let i = min; i <= max; i++) {
    opts += `<option value="${i}"${i === current ? " selected" : ""}>${i}×</option>`;
  }
  return `<select class="move-hits-select" data-moveid="${escapeHTML(move.id)}" onchange="onMoveHitsChange(this.dataset.moveid, ${isAttacker}, this.value)">${opts}</select>`;
}

function renderAttackerMoveList() {
  const { attacker, defender, selectedMove } = calcState;
  const container = document.getElementById("calc-atk-movelist");
  if (!container || !attacker) return;
  const top      = (attacker.topMoves || []).slice(0, 6);
  const custom   = attacker.customMoves || [];
  const allMoves = [...top, ...custom];

  container.innerHTML = allMoves.map(m => {
    const isSel = selectedMove?.source === "attacker" && selectedMove?.move?.id === m.id;
    const isCrit = isMoveCrit("attacker", m.id);
    const moveField = getEffectiveFieldForSource("attacker", isCrit);
    const hits = getMoveHits("attacker", m.id, m);
    let dmgLabel = "";
    if (defender && isDamagingMove(m)) {
      dmgLabel = `<span class="move-dmg-badge">${quickDamageSummary(attacker, m, defender, moveField, hits)}</span>`;
    }
    const isStatus = m.category === "Status";
    const catLabel = m.category === "Physical" ? "Phy" : m.category === "Special" ? "Spc" : "Status";
    const critBtn = isStatus ? "" : `<button type="button" class="move-crit-btn${isCrit ? " crit-on" : ""}" data-moveid="${escapeHTML(m.id)}" aria-pressed="${isCrit}" onclick="onMoveCritToggle(this.dataset.moveid, true)">Crit</button>`;
    return `<div class="calc-move-row">
      <div class="calc-move-btn${isSel ? " selected" : ""}" data-moveid="${escapeHTML(m.id)}" onclick="onMoveClick(this.dataset.moveid, true)">
        <span class="move-name">${m.name}</span>${m.id.startsWith("custom") ? " <span style='color:#555;font-size:10px'>(custom)</span>" : ""}
        ${typeBadgeHTML(m.type)}
        <span class="move-meta">${moveBasePowerLabel(m, moveField)} ${catLabel}</span>
        ${dmgLabel}
      </div>
      ${renderHitsDropdown(m, "attacker", true)}
      ${critBtn}
    </div>`;
  }).join("") || '<div style="color:#555;font-size:12px">No moves</div>';
}

function renderDefenderMoveList() {
  const { attacker, defender, selectedMove } = calcState;
  const container = document.getElementById("calc-def-movelist");
  if (!container || !defender) return;
  const top      = (defender.topMoves || []).slice(0, 6);
  const custom   = defender.customMoves || [];
  const allMoves = [...top, ...custom];

  container.innerHTML = allMoves.map(m => {
    const isSel = selectedMove?.source === "defender" && selectedMove?.move?.id === m.id;
    const isCrit = isMoveCrit("defender", m.id);
    const moveField = getEffectiveFieldForSource("defender", isCrit);
    const hits = getMoveHits("defender", m.id, m);
    let dmgLabel = "";
    if (attacker && isDamagingMove(m)) {
      dmgLabel = `<span class="move-dmg-badge">${quickReverseSummary(defender, m, attacker, moveField, hits)}</span>`;
    }
    const isStatus = m.category === "Status";
    const catLabel = m.category === "Physical" ? "Phy" : m.category === "Special" ? "Spc" : "Status";
    const critBtn = isStatus ? "" : `<button type="button" class="move-crit-btn${isCrit ? " crit-on" : ""}" data-moveid="${escapeHTML(m.id)}" aria-pressed="${isCrit}" onclick="onMoveCritToggle(this.dataset.moveid, false)">Crit</button>`;
    return `<div class="calc-move-row">
      <div class="calc-move-btn${isSel ? " selected" : ""}" data-moveid="${escapeHTML(m.id)}" onclick="onMoveClick(this.dataset.moveid, false)">
        <span class="move-name">${m.name}</span>${m.id.startsWith("custom") ? " <span style='color:#555;font-size:10px'>(custom)</span>" : ""}
        ${typeBadgeHTML(m.type)}
        <span class="move-meta">${moveBasePowerLabel(m, moveField)} ${catLabel}</span>
        ${dmgLabel}
      </div>
      ${renderHitsDropdown(m, "defender", false)}
      ${critBtn}
    </div>`;
  }).join("") || '<div style="color:#555;font-size:12px">No moves</div>';
}

// ─── RESULTS RENDERING ────────────────────────────────────────────────────────
const TIER_CONFIG = {
  ohko:     { label: "OHKO range",  color: "#ef5350", bg: "#ef535020", tip: "Sets where at least one damage roll can knock out in a single hit." },
  "2hko":   { label: "2HKO range",  color: "#ffa726", bg: "#ffa72620", tip: "Sets that require two hits to knock out." },
  "3hko":   { label: "3HKO range",  color: "#ffd54f", bg: "#ffd54f20", tip: "Sets that require three hits to knock out." },
  survives: { label: "Survives",    color: "#a5d6a7", bg: "#a5d6a720", tip: "Sets that survive three or more hits." },
};

// Returns HTML of factor chips affecting the damage calculation
function renderFactorChips(atkObj, move, defObj, field) {
  const chips = [];
  const isPhys = move.category === "Physical";
  const moveType = getEffectiveMoveType(move, atkObj, field);
  const basePower = getMoveBasePower(move, { ...field, attackerAbility: atkObj.ability });
  const typeEff = getTypeEffectiveness(moveType, defObj.types || [], defObj.tera, field);

  if (typeEff === 4) chips.push(["4× effective", "#4caf50"]);
  else if (typeEff === 2) chips.push(["2× effective", "#66bb6a"]);
  else if (typeEff === 0.5) chips.push(["½× effective", "#ef9a9a"]);
  else if (typeEff === 0.25) chips.push(["¼× effective", "#ef5350"]);

  const stabMod = getSTABMod(atkObj.types || [], atkObj.ability, moveType, atkObj.tera);
  if (stabMod === 0x2400) chips.push(["Adaptability STAB ×2.25", "#ffd54f"]);
  else if (stabMod === 0x2000) chips.push(["STAB ×2", "#ffd54f"]);
  else if (stabMod === 0x1800) chips.push(["STAB ×1.5", "#ffd54f"]);
  else if (stabMod > 0x1000) chips.push(["STAB", "#ffd54f"]);

  if (basePower <= 60 && atkObj.ability === "Technician") chips.push(["Technician ×1.5 BP", "#b0bec5"]);
  if (["Pixilate", "Aerilate", "Galvanize", "Refrigerate"].includes(atkObj.ability) && move.type === "Normal" && moveType !== "Normal") chips.push([`${atkObj.ability} ${moveType}`, "#b0bec5"]);
  if (atkObj.ability === "Fairy Aura" && moveType === "Fairy") chips.push(["Fairy Aura ×1.33", "#b0bec5"]);
  if (defObj.ability === "Fairy Aura" && moveType === "Fairy") chips.push(["Opp Fairy Aura ×1.33", "#b0bec5"]);
  if (atkObj.ability === "Dark Aura" && moveType === "Dark") chips.push(["Dark Aura ×1.33", "#b0bec5"]);
  if (defObj.ability === "Dark Aura" && moveType === "Dark") chips.push(["Opp Dark Aura ×1.33", "#b0bec5"]);
  if (atkObj.ability === "Guts" && isPhys && attackerHasMajorStatus(atkObj, field)) chips.push(["Guts x1.5 Atk", "#b0bec5"]);
  if ((move.flags||{}).bite && atkObj.ability === "Strong Jaw") chips.push(["Strong Jaw ×1.5 BP", "#b0bec5"]);
  if ((move.flags||{}).punch && atkObj.ability === "Iron Fist") chips.push(["Iron Fist ×1.2 BP", "#b0bec5"]);
  if (atkObj.ability === "Huge Power" || atkObj.ability === "Pure Power") chips.push([`${atkObj.ability} ×2 Atk`, "#b0bec5"]);
  if (atkObj.ability === "Gorilla Tactics" && isPhys) chips.push(["Gorilla Tactics ×1.5", "#b0bec5"]);
  if (atkObj.ability === "Hustle" && isPhys) chips.push(["Hustle ×1.5", "#b0bec5"]);

  if (atkObj.item === "Life Orb") chips.push(["Life Orb ×1.3", "#ccc"]);
  if (atkObj.item === "Choice Band" && isPhys) chips.push(["Choice Band ×1.5", "#ccc"]);
  if (atkObj.item === "Choice Specs" && !isPhys) chips.push(["Choice Specs ×1.5", "#ccc"]);
  if (atkObj.item === "Expert Belt" && typeEff > 1) chips.push(["Expert Belt ×1.2", "#ccc"]);
  if (atkObj.item === "Muscle Band" && isPhys) chips.push(["Muscle Band ×1.1", "#ccc"]);
  if (atkObj.item === "Wise Glasses" && !isPhys) chips.push(["Wise Glasses ×1.1", "#ccc"]);
  const tboost = TYPE_BOOST_ITEMS[atkObj.item];
  if (tboost && tboost === moveType) chips.push([`${atkObj.item} ×1.2`, "#ccc"]);

  const da = defObj.ability || "";
  if ((da === "Filter" || da === "Solid Rock" || da === "Prism Armor") && typeEff > 1) chips.push([`${da} ×0.75`, "#ef9a9a"]);
  if (da === "Multiscale" || da === "Shadow Shield") chips.push([`${da} ×0.5`, "#ef9a9a"]);
  if (da === "Thick Fat" && (moveType === "Fire" || moveType === "Ice")) chips.push(["Thick Fat ×0.5", "#ef9a9a"]);
  if (da === "Ice Scales" && !isPhys) chips.push(["Ice Scales ×0.5", "#ef9a9a"]);
  if (da === "Heatproof" && moveType === "Fire") chips.push(["Heatproof ×0.5", "#ef9a9a"]);
  if (da === "Tablets of Ruin" && isPhys) chips.push(["Tablets of Ruin ×0.75 Atk", "#ef9a9a"]);
  if (da === "Vessel of Ruin" && !isPhys) chips.push(["Vessel of Ruin ×0.75 SpA", "#ef9a9a"]);
  if (atkObj.ability === "Sword of Ruin" && isPhys) chips.push(["Sword of Ruin ×0.75 Def", "#a5d6a7"]);
  if (atkObj.ability === "Beads of Ruin" && !isPhys) chips.push(["Beads of Ruin ×0.75 SpD", "#a5d6a7"]);
  const berry = RESIST_BERRIES[defObj.item || ""];
  if (berry && berry === moveType && typeEff > 1) chips.push([`${defObj.item} ×0.5`, "#ef9a9a"]);
  if ((defObj.item || "") === "Assault Vest" && !isPhys) chips.push(["Assault Vest ×1.5 SpD", "#ef9a9a"]);

  const activeWeather = weatherBallWeather(field, atkObj) || field.weather;
  const sun = activeWeather === "Sun" || activeWeather === "Harsh Sunshine";
  const rain = activeWeather === "Rain" || activeWeather === "Heavy Rain";
  if (sun && moveType === "Fire") chips.push(["Sun ×1.5", "#f08030"]);
  if (sun && moveType === "Water") chips.push(["Sun ×0.5", "#f08030"]);
  if (rain && moveType === "Water") chips.push(["Rain ×1.5", "#6890f0"]);
  if (rain && moveType === "Fire") chips.push(["Rain ×0.5", "#6890f0"]);
  if (field.weather === "Sand" && atkObj.ability === "Sand Force" && ["Ground","Rock","Steel"].includes(moveType)) chips.push(["Sand Force ×1.3 BP", "#b0a070"]);
  if (field.terrain === "Electric" && moveType === "Electric") chips.push(["Elec Terrain ×1.3 BP", "#f8d030"]);
  if (field.terrain === "Grassy" && moveType === "Grass") chips.push(["Grassy Terrain ×1.3 BP", "#78c850"]);
  if (field.terrain === "Psychic" && moveType === "Psychic") chips.push(["Psychic Terrain ×1.3 BP", "#f85888"]);
  if (field.terrain === "Misty" && moveType === "Dragon") chips.push(["Misty Terrain ×0.5 BP", "#98d8d8"]);

  if (!field.isCritical) {
    if (field.isAuroraVeil) chips.push(["Aurora Veil ÷2", "#90caf9"]);
    else if (field.isReflect && isPhys) chips.push(["Reflect ÷2", "#90caf9"]);
    else if (field.isLightScreen && !isPhys) chips.push(["Light Screen ÷2", "#f8d030"]);
  }
  if (move.isSpread && field.format !== "Singles") chips.push(["Spread ×0.75", "#aaa"]);
  if (field.isHelpingHand) chips.push(["Helping Hand ×1.5", "#a5d6a7"]);
  if (field.isBattery && !isPhys) chips.push(["Battery ×1.3", "#a5d6a7"]);
  if (field.isPowerSpot) chips.push(["Power Spot ×1.3", "#a5d6a7"]);
  if (field.isSteelySpirit && moveType === "Steel") chips.push(["Steely Spirit ×1.5", "#a5d6a7"]);
  if (field.isCritical) chips.push(["Crit ×1.5", "#ef9a9a"]);
  if (attackerIsBurned(atkObj, field) && isPhys && atkObj.ability !== "Guts") chips.push(["Burned ÷2", "#f08030"]);
  if (field.isGravity) chips.push(["Gravity", "#b0bec5"]);
  if (field.isProtected) chips.push(["Protected", "#ef9a9a"]);
  if (move.overrideOffensiveStat === "def") chips.push(["Uses Def as Atk", "#90caf9"]);
  if (move.overrideOffensivePokemon === "target") chips.push(["Uses target's Atk", "#90caf9"]);
  if (move.overrideDefensiveStat === "def" && move.category === "Special") chips.push(["Targets Def", "#90caf9"]);

  const atkBoostKey = move.overrideOffensiveStat || (isPhys ? "atk" : "spa");
  const atkBoostLabel = { atk: "Atk", spa: "SpA", def: "Def", spd: "SpD", spe: "Spe" }[atkBoostKey] || atkBoostKey;
  const atkBoost = move.overrideOffensivePokemon === "target"
    ? ((defObj.boosts || {})[isPhys ? "atk" : "spa"] || 0)
    : ((atkObj.boosts || {})[atkBoostKey] || 0);
  if (atkBoost) {
    const m = atkBoost >= 0 ? `×${(2+atkBoost)/2}` : `÷${(2+Math.abs(atkBoost))/2}`;
    chips.push([`${atkBoost>0?"+":""}${atkBoost} ${atkBoostLabel} ${m}`, atkBoost > 0 ? "#a5d6a7" : "#ef9a9a"]);
  }
  const defBoostKey = move.overrideDefensiveStat || (isPhys ? "def" : "spd");
  const defBoostLabel = { def: "Def", spd: "SpD", atk: "Atk", spa: "SpA" }[defBoostKey] || defBoostKey;
  const defBoost = (defObj.boosts || {})[defBoostKey] || 0;
  if (defBoost) {
    const m = defBoost >= 0 ? `×${(2+defBoost)/2}` : `÷${(2+Math.abs(defBoost))/2}`;
    chips.push([`Opp ${defBoost>0?"+":""}${defBoost} ${defBoostLabel} ${m}`, defBoost > 0 ? "#ef9a9a" : "#a5d6a7"]);
  }

  // ── Ability activation chips ──
  const _statLabel = { atk:"Atk", def:"Def", spa:"SpA", spd:"SpD", spe:"Spe" };
  function _abilityChips(pokemon, opponent, isOpp) {
    const pfx = isOpp ? "Opp " : "";
    const act = ABILITY_ACTIVATIONS[pokemon?.ability];
    if (!act || !pokemon?.abilityActivated) return;
    // Effect-based
    if (act.effect === "charge") chips.push([`${pfx}Charge 2\u00d7 Elec BP`, "#f8d030"]);
    if (act.effect === "flashfire") chips.push([`${pfx}Flash Fire +50% Fire`, "#f08030"]);
    if (act.effect === "unburden") chips.push([`${pfx}Unburden 2\u00d7 Spe`, "#b0bec5"]);
    if (act.effect === "grassyterrain") chips.push([`${pfx}Seed Sower \u2192 Grassy`, "#78c850"]);
    // Self-targeting boosts
    if (act.target === "self" && act.boosts) {
      const desc = Object.entries(act.boosts).map(([k,v]) => `${v>0?"+":""}${v} ${_statLabel[k]||k}`).join(", ");
      chips.push([`${pfx}${pokemon.ability}: ${desc}`, isOpp ? "#ef9a9a" : "#b0bec5"]);
    }
    // Opponent-targeting (Intimidate, Cotton Down)
    if (act.target === "opponent") {
      const ta = opponent?.ability || "";
      if (act.immuneAbilities?.includes(ta)) {
        chips.push([`${pfx}${pokemon.ability} blocked (${ta})`, "#666"]);
      } else {
        const rx = act.reactions?.[ta];
        if (rx?.reflect)  { chips.push([`${pfx}${pokemon.ability} \u2192 Mirror Armor`, isOpp ? "#a5d6a7" : "#ef9a9a"]); }
        else if (rx?.replace || rx?.extra) { chips.push([`${pfx}${pokemon.ability} \u2192 ${ta}`, "#ffd54f"]); }
        else {
          const desc = Object.entries(act.boosts).map(([k,v]) => `${v>0?"+":""}${v} ${_statLabel[k]||k}`).join(", ");
          chips.push([`${pfx}${pokemon.ability}: ${desc} opp`, isOpp ? "#a5d6a7" : "#ef9a9a"]);
        }
      }
    }
  }
  _abilityChips(atkObj, defObj, false);
  _abilityChips(defObj, atkObj, true);

  if (!chips.length) return "";
  return `<div class="calc-factors">${chips.map(([t,c]) => `<span class="calc-factor-chip" style="color:${c}">${t}</span>`).join("")}</div>`;
}

function renderKOLabel(koPct, label = "OHKO") {
  if (koPct >= 100) return `<span style="color:#4caf50;font-weight:bold">Guaranteed ${label}</span>`;
  if (koPct >= 93.75) return `<span style="color:#66bb6a;font-weight:bold">${koPct.toFixed(1)}% ${label} (${Math.round(koPct/6.25)}/16)</span>`;
  if (koPct >= 6.25) return `<span style="color:#ffd54f;font-weight:bold">${koPct.toFixed(1)}% ${label} (${Math.round(koPct/6.25)}/16)</span>`;
  if (koPct > 0) return `<span style="color:#ff9800;font-weight:bold">&lt;6.25% ${label}</span>`;
  return `<span style="color:#555">0% ${label}</span>`;
}

function renderPrimaryResult(title, damageText, koHTML, note = "") {
  return `<div class="calc-primary-result">
    <div class="calc-primary-title">${title}</div>
    <div class="calc-primary-main">${damageText}</div>
    <div class="calc-primary-ko">${koHTML}${note ? ` <span>${note}</span>` : ""}</div>
  </div>`;
}

function renderBestKOLabelForRolls(rolls, hp) {
  const o1 = calcNHKOChance(rolls, hp, 1);
  const o2 = o1 > 0 ? 0 : calcNHKOChance(rolls, hp, 2);
  const o3 = (o1 > 0 || o2 > 0) ? 0 : calcNHKOChance(rolls, hp, 3);
  if (o1 > 0) return renderKOLabel(o1, "OHKO");
  if (o2 > 0) return renderKOLabel(o2, "2HKO");
  if (o3 > 0) return renderKOLabel(o3, "3HKO");
  return `<span style="color:#555">Cannot 3HKO</span>`;
}

function doesAtkItemBoostDamage(item, move, isPhys, typeEff) {
  if (!item || item === "None") return false;
  if (item === "Life Orb") return true;
  if (item === "Choice Band" && isPhys) return true;
  if (item === "Choice Specs" && !isPhys) return true;
  if (item === "Expert Belt" && typeEff > 1) return true;
  if (item === "Muscle Band" && isPhys) return true;
  if (item === "Wise Glasses" && !isPhys) return true;
  const tboost = TYPE_BOOST_ITEMS[item];
  if (tboost && tboost === move.type) return true;
  return false;
}

function doesDefItemReduceDamage(item, move, isPhys, typeEff) {
  if (!item || item === "None") return false;
  if (item === "Assault Vest" && !isPhys) return true;
  const berry = RESIST_BERRIES[item];
  if (berry && berry === move.type && typeEff > 1) return true;
  return false;
}

// Builds a Smogon-style calc string.
// useEVNotation = true           → reads attacker EVs/nature from DOM
// defEvStr      = "252 HP / 4 SpD" → prepended before defender name (reverse calc)
// overridePcts  = { o1, o2, o3 } → precomputed weighted KO probabilities (forward calc)
function buildCalcString(atkObj, move, rolls, hp, defObj, field, useEVNotation, defEvStr, overridePcts, extraClass = "", hits = 1) {
  if (!rolls || !rolls.length || !hp) return "";
  const isPhys = move.category === "Physical";
  const statKey = isPhys ? "atk" : "spa";
  const statLabel = isPhys ? "Atk" : "SpA";
  const moveType = getEffectiveMoveType(move, atkObj, field);
  const displayMove = { ...move, type: moveType };
  const typeEff = getTypeEffectiveness(moveType, defObj.types || [], defObj.tera, field);

  // Boost stage prefix (includes ability activation boosts)
  const atkBoost = Math.max(-6, Math.min(6, ((atkObj.boosts || {})[statKey] || 0) + ((atkObj._abilityBoosts || {})[statKey] || 0)));
  const boostPart = atkBoost !== 0 ? `${atkBoost > 0 ? "+" : ""}${atkBoost} ` : "";

  // EV / nature notation (attacker side, reads from DOM)
  let evPart = "";
  if (useEVNotation) {
    const evVal = parseInt(document.getElementById(`calc-atk-ev-${statKey}`)?.value) || 0;
    const nature = document.getElementById("calc-atk-nature")?.value || "Hardy";
    const natMult = (NATURES[nature] || {})[statKey];
    const natSign = natMult === 1.1 ? "+" : natMult === 0.9 ? "-" : "";
    evPart = `${evVal}${natSign} ${statLabel} `;
  }

  const hhPart = field.isHelpingHand ? "Helping Hand " : "";

  // Attacker item: only show if it boosts damage
  const itemPart = doesAtkItemBoostDamage(atkObj.item, displayMove, isPhys, typeEff) ? `${atkObj.item} ` : "";
  const statusPart = attackerIsBurned(atkObj, field) && isPhys && atkObj.ability !== "Guts" ? "burned " : "";

  // Defender boost on defense stat (includes ability activation boosts)
  const defBoostKey = isPhys ? "def" : "spd";
  const defBoostLabel = isPhys ? "Def" : "SpD";
  const defBoost = Math.max(-6, Math.min(6, ((defObj.boosts || {})[defBoostKey] || 0) + ((defObj._abilityBoosts || {})[defBoostKey] || 0)));
  const defBoostPart = defBoost !== 0 ? ` (${defBoost > 0 ? "+" : ""}${defBoost} ${defBoostLabel})` : "";

  // Defender EVs (only in reverse calc where user's Pokemon is the defender)
  const defEvPart = defEvStr ? `${defEvStr} ` : "";

  // Defender item: only show if it reduces incoming damage
  const defItemPart = doesDefItemReduceDamage(defObj.item, displayMove, isPhys, typeEff) ? `${defObj.item} ` : "";

  // Screen
  let screenPart = "";
  if (!field.isCritical) {
    if (field.isAuroraVeil) screenPart = " through Aurora Veil";
    else if (field.isReflect && isPhys) screenPart = " through Reflect";
    else if (field.isLightScreen && !isPhys) screenPart = " through Light Screen";
  }
  if (field.isFriendGuard) screenPart += " (Friend Guard)";

  // Damage range as % — use override range if provided (overall across all tiers)
  const minPct = overridePcts?.minPct != null ? overridePcts.minPct : (rolls[0] / hp * 100).toFixed(1);
  const maxPct = overridePcts?.maxPct != null ? overridePcts.maxPct : (rolls[rolls.length - 1] / hp * 100).toFixed(1);

  // KO label — use weighted override when provided, else compute from rolls
  const o1 = overridePcts != null ? overridePcts.o1 : calcNHKOChance(rolls, hp, 1);
  const o2 = overridePcts != null ? overridePcts.o2 : (o1 > 0 ? 0 : calcNHKOChance(rolls, hp, 2));
  const o3 = overridePcts != null ? overridePcts.o3 : ((o1 > 0 || o2 > 0) ? 0 : calcNHKOChance(rolls, hp, 3));
  let koText = "";
  if      (o1 >= 100)    koText = "guaranteed OHKO";
  else if (o1 >= 93.75)  koText = `${o1.toFixed(1)}% chance to OHKO (${Math.round(o1/6.25)}/16)`;
  else if (o1 > 0)       koText = `${o1.toFixed(1)}% chance to OHKO`;
  else if (o2 >= 100)    koText = "guaranteed 2HKO";
  else if (o2 >= 93.75)  koText = `${o2.toFixed(1)}% chance to 2HKO (${Math.round(o2/6.25)}/16)`;
  else if (o2 > 0)       koText = `${o2.toFixed(1)}% chance to 2HKO`;
  else if (o3 >= 100)    koText = "guaranteed 3HKO";
  else if (o3 >= 93.75)  koText = `${o3.toFixed(1)}% chance to 3HKO (${Math.round(o3/6.25)}/16)`;
  else if (o3 > 0)       koText = `${o3.toFixed(1)}% chance to 3HKO`;
  else                   koText = "cannot 3HKO";

  // Weather residual note
  let residual = "";
  if (field.weather === "Sand" || field.weather === "Sandstorm") residual = " after sandstorm damage";
  else if (field.weather === "Hail") residual = " after hail damage";

  const hitsPart = move.multihit ? ` (${hits} ${hits === 1 ? "hit" : "hits"})` : "";
  const str = `${boostPart}${evPart}${itemPart}${statusPart}${atkObj.name} ${hhPart}${move.name}${hitsPart} vs. ${defEvPart}${defItemPart}${defObj.name}${defBoostPart}${screenPart}: (${minPct} - ${maxPct}%) -- ${koText}${residual}`;
  return `<div class="calc-string${extraClass ? ` ${extraClass}` : ""}"><code>${str}</code><button class="calc-copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(str)})">Copy</button></div>`;
}

function renderForwardResults(koDist, move, attacker, defenderData, field, hits = 1) {
  if (!koDist) return `<div style="color:#666;padding:6px 0">No data.</div>`;
  const moveName = move.name, defenderName = defenderData.name;
  if (koDist.immune) return renderPrimaryResult(`${moveName} -> ${defenderName}`, "No effect", `<span style="color:#666">${defenderName} is immune</span>`);

  const defLabel = koDist.isPhys ? "Def" : "SpD";
  let html = renderFactorChips(attacker, move, defenderData, field);

  const tierNames = ["ohko", "2hko", "3hko", "survives"];
  const activeTierCount = tierNames.filter(n => koDist.tiers[n]?.reprRolls).length;
  let hasTiers = false;
  let w2 = 0, w3 = 0, wTotal = 0;
  let allMinPct = Infinity, allMaxPct = -Infinity;

  for (const name of tierNames) {
    const tier = koDist.tiers[name];
    if (!tier || !tier.reprRolls) continue;
    hasTiers = true;
    const cfg = TIER_CONFIG[name];
    const rolls = tier.reprRolls, hp = tier.reprHP;
    const minD = tier.minDamage ?? rolls[0];
    const maxD = tier.maxDamage ?? rolls[rolls.length - 1];
    const minPctVal = tier.minPct ?? (minD / hp * 100);
    const maxPctVal = tier.maxPct ?? (maxD / hp * 100);
    const minP = minPctVal.toFixed(1);
    const maxP = maxPctVal.toFixed(1);
    allMinPct = Math.min(allMinPct, minPctVal);
    allMaxPct = Math.max(allMaxPct, maxPctVal);
    const pct = (tier.weight * 100).toFixed(0);
    const p2 = tier.rollResults ? calcWeightedNHKOChance(tier.rollResults, 2) : calcNHKOChance(rolls, hp, 2);
    const p3 = tier.rollResults ? calcWeightedNHKOChance(tier.rollResults, 3) : calcNHKOChance(rolls, hp, 3);
    w2 += tier.weight * p2; w3 += tier.weight * p3; wTotal += tier.weight;
    // Skip rendering tier rows when there's only 1 tier — the primary result already covers it
    if (activeTierCount > 1) {
      // Show KO chance within bucket for context
      const bucketKO = tier.rollResults ? calcWeightedNHKOChance(tier.rollResults, name === "ohko" ? 1 : name === "2hko" ? 2 : 3) : 0;
      const koDetail = name !== "survives" && bucketKO > 0
        ? `<span style="color:#888;font-size:11px">${bucketKO >= 100 ? "guaranteed" : `avg ${bucketKO.toFixed(1)}% chance`}</span>`
        : "";
      html += `<div class="calc-tier-row" style="border-left:3px solid ${cfg.color}">
        <div class="calc-tier-left">
          <span class="calc-tier-badge" style="background:${cfg.bg};color:${cfg.color}">${cfg.label}${tipHTML(cfg.tip)}</span>
          <span class="calc-tier-freq">${pct}% of sets</span>
          ${koDetail}
        </div>
        <div class="calc-tier-right">
          <span class="calc-tier-dmg">${minD}–${maxD} <strong>(${minP}–${maxP}%)</strong></span>
          ${tier.rollResults ? renderWeightedNHKORow(tier.rollResults) : renderNHKORow(rolls, hp)}
        </div>
      </div>`;
    }
  }

  if (!hasTiers) {
    html += `<div style="color:#666;font-size:12px;padding:6px 0">No spread distribution available.</div>`;
  }

  const overall2 = wTotal > 0 ? w2 / wTotal : 0;
  const overall3 = wTotal > 0 ? w3 / wTotal : 0;
  let ovLabel, ovPct;
  if (koDist.koPct > 0)   { ovLabel = "OHKO"; ovPct = koDist.koPct; }
  else if (overall2 > 0)  { ovLabel = "2HKO"; ovPct = overall2; }
  else if (overall3 > 0)  { ovLabel = "3HKO"; ovPct = overall3; }
  const ovHTML = ovLabel ? renderKOLabel(ovPct, ovLabel) : `<span style="color:#444">Cannot 3HKO</span>`;
  // Show the weighted overall line only when there are multiple tiers to aggregate
  if (activeTierCount > 1) {
    html += `<div class="calc-overall-ko"><strong>Weighted overall:</strong>${tipHTML("KO chance averaged across all opponent spreads, weighted by how often each spread is used on ladder.")} ${ovHTML} <span style="color:#555;font-size:11px">across all usage sets</span></div>`;
  }

  const damageSummary = isFinite(allMinPct) && isFinite(allMaxPct)
    ? `${allMinPct.toFixed(1)}-${allMaxPct.toFixed(1)}%`
    : "No damage range";
  const primaryHTML = renderPrimaryResult(`${moveName} -> ${defenderName}`, damageSummary, ovHTML, `weighted across usage sets${tipHTML("Damage range and KO chance calculated against every spread your opponent runs, weighted by popularity.")}`);

  // Calc string: overall damage range (min of all tier mins → max of all tier maxes)
  const reprTier = koDist.tiers.ohko || koDist.tiers["2hko"] || koDist.tiers["3hko"] || koDist.tiers.survives;
  let calcStringHTML = "";
  if (reprTier?.reprRolls) {
    const overridePcts = {
      o1: koDist.koPct || 0,
      o2: (koDist.koPct > 0) ? 0 : (overall2 || 0),
      o3: (koDist.koPct > 0 || overall2 > 0) ? 0 : (overall3 || 0),
      minPct: isFinite(allMinPct) ? allMinPct.toFixed(1) : null,
      maxPct: isFinite(allMaxPct) ? allMaxPct.toFixed(1) : null,
    };
    calcStringHTML = buildCalcString(attacker, move, reprTier.reprRolls, reprTier.reprHP, defenderData, field, true, null, overridePcts, "calc-string-primary", hits);
  }
  return primaryHTML + calcStringHTML + html;
}

// Renders a single-result block (reverse: defender's move vs attacker's single HP pool)
function renderSingleResult(result, move, atkObj, defObj, field, hits = 1) {
  const hp = defObj.customStats?.hp || 1;
  let detailHTML = renderFactorChips(atkObj, move, defObj, field);
  if (!result || result.immune) {
    return renderPrimaryResult(`${atkObj.name}'s ${move.name} -> ${defObj.name}`, "No effect", `<span style="color:#666">Immune</span>`);
  }
  const rolls = result.rolls;
  const minD = rolls[0], maxD = rolls[rolls.length - 1];
  const damageText = `${minD}-${maxD} (${(minD/hp*100).toFixed(1)}-${(maxD/hp*100).toFixed(1)}%)`;
  const primaryHTML = renderPrimaryResult(`${atkObj.name}'s ${move.name} -> ${defObj.name}`, damageText, renderBestKOLabelForRolls(rolls, hp));
  detailHTML += `<div class="calc-tier-row" style="border-left:3px solid #a5d6a7">
    <div class="calc-tier-left">
      <span class="calc-tier-stats">HP ${hp}</span>
    </div>
    <div class="calc-tier-right">
      <span class="calc-tier-dmg">${minD}–${maxD} <strong>(${(minD/hp*100).toFixed(1)}–${(maxD/hp*100).toFixed(1)}%)</strong></span>
      ${renderNHKORow(rolls, hp)}
    </div>
  </div>`;
  // Defender (user's Pokemon) EVs from DOM for the calc string
  const _isPhys = move.category === "Physical";
  const _hpEV = parseInt(document.getElementById("calc-atk-ev-hp")?.value) || 0;
  const _defEV = parseInt(document.getElementById(`calc-atk-ev-${_isPhys ? "def" : "spd"}`)?.value) || 0;
  const defEvStr = `${_hpEV} HP / ${_defEV} ${_isPhys ? "Def" : "SpD"}`;
  const calcStringHTML = buildCalcString(atkObj, move, rolls, hp, defObj, field, false, defEvStr, null, "calc-string-primary", hits);
  return primaryHTML + calcStringHTML + detailHTML;
}

// Renders a single-result block (forward: attacker's move vs defender's specific stats in manual mode)
function renderSingleForwardResult(result, move, attacker, defender, field, hits = 1) {
  const hp = defender.customStats?.hp || 1;
  let detailHTML = renderFactorChips(attacker, move, defender, field);
  if (!result || result.immune) {
    return renderPrimaryResult(`${move.name} -> ${defender.name}`, "No effect", `<span style="color:#666">Immune</span>`);
  }
  const rolls = result.rolls;
  const minD = rolls[0], maxD = rolls[rolls.length - 1];
  const damageText = `${minD}-${maxD} (${(minD/hp*100).toFixed(1)}-${(maxD/hp*100).toFixed(1)}%)`;
  const primaryHTML = renderPrimaryResult(`${move.name} -> ${defender.name}`, damageText, renderBestKOLabelForRolls(rolls, hp));
  detailHTML += `<div class="calc-tier-row" style="border-left:3px solid #a5d6a7">
    <div class="calc-tier-left">
      <span class="calc-tier-stats">HP ${hp}</span>
    </div>
    <div class="calc-tier-right">
      <span class="calc-tier-dmg">${minD}–${maxD} <strong>(${(minD/hp*100).toFixed(1)}–${(maxD/hp*100).toFixed(1)}%)</strong></span>
      ${renderNHKORow(rolls, hp)}
    </div>
  </div>`;
  // Defender EVs from DOM for the calc string
  const _isPhys = move.category === "Physical";
  const _hpEV = parseInt(document.getElementById("calc-def-ev-hp")?.value) || 0;
  const _defEV = parseInt(document.getElementById(`calc-def-ev-${_isPhys ? "def" : "spd"}`)?.value) || 0;
  const defEvStr = `${_hpEV} HP / ${_defEV} ${_isPhys ? "Def" : "SpD"}`;
  const calcStringHTML = buildCalcString(attacker, move, rolls, hp, defender, field, true, defEvStr, null, "calc-string-primary", hits);
  return primaryHTML + calcStringHTML + detailHTML;
}

// ─── SPEED COMPARISON ────────────────────────────────────────────────────────
function defSpeedFromSpread(spreadStr, baseSpe, level, isChampions, iv) {
  if (iv === undefined) iv = 31;
  const [nature, evStr] = spreadStr.split(":");
  const speEV = evStr ? (parseInt(evStr.split("/")[5]) || 0) : 0;
  const natMult = (NATURES[nature] || {}).spe || 1;
  if (isChampions) return Math.floor((baseSpe + speEV + 20) * natMult);
  return Math.floor((Math.floor((2 * baseSpe + iv + Math.floor(speEV / 4)) * level / 100) + 5) * natMult);
}

function _weatherSpeedMultiplier(ability, weather) {
  if (!ability || !weather || weather === "None") return 1;
  const sun = weather === "Sun" || weather === "Harsh Sunshine";
  const rain = weather === "Rain" || weather === "Heavy Rain";
  const sand = weather === "Sand" || weather === "Sandstorm";
  const snow = weather === "Snow" || weather === "Hail";
  if (ability === "Swift Swim" && rain) return 2;
  if (ability === "Chlorophyll" && sun) return 2;
  if (ability === "Sand Rush" && sand) return 2;
  if (ability === "Slush Rush" && snow) return 2;
  return 1;
}

function computeSpeedComparison() {
  const field = calcState.field;
  const baseSpe = parseInt(document.getElementById("calc-atk-final-spe")?.textContent) || 0;
  const atkUnburden = calcState.attacker?._abilityFlags?.unburden ? 2 : 1;
  const atkWeatherSpe = _weatherSpeedMultiplier(calcState.attacker?.ability, field.weather);
  const userSpe = baseSpe * atkUnburden * atkWeatherSpe * (field.isAtkTailwind ? 2 : 1);
  const def = calcState.defender;
  if (!baseSpe || !def) return null;
  const isTR = field.isTrickRoom;

  const defSpeBoost = Math.max(-6, Math.min(6, ((def.boosts || {}).spe || 0) + ((def._abilityBoosts || {}).spe || 0)));
  const defSpeBoostMult = defSpeBoost >= 0 ? (2 + defSpeBoost) / 2 : 2 / (2 + Math.abs(defSpeBoost));
  const defUnburden = def._abilityFlags?.unburden ? 2 : 1;
  const defWeatherSpe = _weatherSpeedMultiplier(def.ability, field.weather);

  // Manual mode: single speed value comparison
  if (def.defenderMode === "manual" && def.customStats?.spe) {
    const defSpe = Math.floor(def.customStats.spe * defSpeBoostMult * defUnburden * defWeatherSpe) * (field.isDefTailwind ? 2 : 1);
    const faster = isTR ? (userSpe < defSpe) : (userSpe > defSpe);
    const slower = isTR ? (userSpe > defSpe) : (userSpe < defSpe);
    return {
      outPct: faster ? 100 : 0,
      tiePct: userSpe === defSpe ? 100 : 0,
      sloPct: slower ? 100 : 0,
      userSpe, baseSpe, defSpe,
      atkTailwind: field.isAtkTailwind, defTailwind: field.isDefTailwind,
      isTrickRoom: isTR,
      defName: def.name,
      isManual: true,
    };
  }

  // Average mode: usage-weighted speed comparison
  if (!def.spreads?.length || !def.baseStats?.spe) return null;
  let totalW = 0, outW = 0, tieW = 0;
  for (const s of def.spreads) {
    const defBaseSpe = defSpeedFromSpread(s.spread, def.baseStats.spe, def.level, def.isChampions);
    const defSpe = Math.floor(defBaseSpe * defSpeBoostMult * defUnburden * defWeatherSpe) * (field.isDefTailwind ? 2 : 1);
    const w = s.usage || 1;
    totalW += w;
    if (isTR ? (userSpe < defSpe) : (userSpe > defSpe)) outW += w;
    else if (userSpe === defSpe) tieW += w;
  }
  if (!totalW) return null;
  return {
    outPct: (outW / totalW) * 100,
    tiePct: (tieW / totalW) * 100,
    sloPct: ((totalW - outW - tieW) / totalW) * 100,
    userSpe, baseSpe,
    atkTailwind: field.isAtkTailwind, defTailwind: field.isDefTailwind,
    isTrickRoom: isTR,
    defName: def.name,
  };
}

// ─── RUN CALC ────────────────────────────────────────────────────────────────
function runCalc() {
  const resultsEl = document.getElementById("calc-results");
  if (!resultsEl) return;

  recomputeAbilityEffects();

  renderAttackerMoveList();
  renderDefenderMoveList();

  const { attacker, defender, selectedMove, field } = calcState;

  // Speed comparison display (attacker panel + opponent panel)
  const sc = (attacker && defender) ? computeSpeedComparison() : null;
  const scEl = document.getElementById("calc-speed-comp");
  const scOppEl = document.getElementById("calc-speed-comp-opp");
  if (scEl) scEl.innerHTML = "";
  if (scOppEl) scOppEl.innerHTML = "";
  if (sc) {
    const atkTwHtml = sc.atkTailwind ? ` <span style="color:#90caf9">TW</span>` : "";
    const defTwHtml = sc.defTailwind ? ` <span style="color:#90caf9">TW</span>` : "";
    const trHtml = sc.isTrickRoom ? ` <span style="color:#ce93d8">TR</span>` : "";
    const atkName = attacker.name || "You";
    if (sc.isManual) {
      const defSpeLabel = sc.defSpe || "?";
      let atkResult, oppResult;
      if (sc.outPct === 100) { atkResult = `<span style="color:#a5d6a7">Outspeeds</span>`; oppResult = `<span style="color:#ef9a9a">Slower</span>`; }
      else if (sc.tiePct === 100) { atkResult = `<span style="color:#ffd54f">Speed tie</span>`; oppResult = `<span style="color:#ffd54f">Speed tie</span>`; }
      else { atkResult = `<span style="color:#ef9a9a">Slower</span>`; oppResult = `<span style="color:#a5d6a7">Outspeeds</span>`; }
      if (scEl) scEl.innerHTML = `<span style="color:#666">Spe ${sc.userSpe}${atkTwHtml} vs ${sc.defName} ${defSpeLabel}${defTwHtml}${trHtml} — </span>${atkResult}`;
      if (scOppEl) scOppEl.innerHTML = `<span style="color:#666">Spe ${defSpeLabel}${defTwHtml} vs ${atkName} ${sc.userSpe}${atkTwHtml}${trHtml} — </span>${oppResult}`;
    } else {
      // Attacker panel: your speed vs opponent spreads
      const outColor = sc.outPct >= 75 ? "#a5d6a7" : sc.outPct >= 40 ? "#ffd54f" : "#ef9a9a";
      const tieHtml = sc.tiePct >= 1 ? ` | <span style="color:#ffd54f">Ties ${sc.tiePct.toFixed(0)}%</span>` : "";
      const sloHtml = ` | <span style="color:#ef9a9a">Slower ${sc.sloPct.toFixed(0)}%</span>`;
      if (scEl) scEl.innerHTML = `<span style="color:#666">Spe ${sc.userSpe}${atkTwHtml} vs ${sc.defName}${defTwHtml}${trHtml} — </span><span style="color:${outColor}">Outspeeds ${sc.outPct.toFixed(0)}%</span>${tieHtml}${sloHtml} <span style="color:#444">of sets</span>`;
      // Opponent panel: opponent's perspective (inverted percentages)
      const oppOutColor = sc.sloPct >= 75 ? "#a5d6a7" : sc.sloPct >= 40 ? "#ffd54f" : "#ef9a9a";
      const oppTieHtml = sc.tiePct >= 1 ? ` | <span style="color:#ffd54f">Ties ${sc.tiePct.toFixed(0)}%</span>` : "";
      const oppSloHtml = ` | <span style="color:#ef9a9a">Slower ${sc.outPct.toFixed(0)}%</span>`;
      if (scOppEl) scOppEl.innerHTML = `<span style="color:#666">${sc.defName}${defTwHtml} vs ${atkName} ${sc.userSpe}${atkTwHtml}${trHtml} — </span><span style="color:${oppOutColor}">Outspeeds ${sc.sloPct.toFixed(0)}%</span>${oppTieHtml}${oppSloHtml} <span style="color:#444">of sets</span>`;
    }
  }

  if (!attacker || !defender) {
    resultsEl.innerHTML = `<div style="color:#888;padding:10px 0;">Select both a Pokémon and an opponent to see results.</div>`;
    return;
  }
  if (!selectedMove) {
    resultsEl.innerHTML = `<div style="color:#888;padding:10px 0;">Click a move from either side to see the damage breakdown.</div>`;
    return;
  }

  const { source, move, isCrit } = selectedMove;
  const effectiveField = getEffectiveFieldForSource(source, isCrit);
  const hits = getMoveHits(source, move.id, move);

  let html = "";
  if (source === "attacker") {
    if (!isDamagingMove(move)) {
      const reason = move.category === "Status" ? "is a status move" : "does not have supported damage data";
      html = `<div class="calc-result-section"><div style="color:#888">${move.name} ${reason} — no damage to calculate.</div></div>`;
    } else if (defender.defenderMode === "manual" && defender.customStats) {
      // Manual mode: single-result calc against specific stats
      const official = calcOfficialResult(attacker, move, defender, effectiveField, hits, attacker.customStats, defender.customStats);
      const result = official || calcMultihitRolls(attacker, move, defender.customStats,
        defender.types, defender.tera, defender.ability, defender.item, effectiveField, getMergedBoosts(defender), hits);
      html = `<div class="calc-result-section">${renderSingleForwardResult(result, move, attacker, defender, effectiveField, hits)}</div>`;
    } else {
      // Average mode: tier-based distribution
      const koDist = calcKODistribution(attacker, move, defender, effectiveField, hits);
      html = `<div class="calc-result-section">${renderForwardResults(koDist, move, attacker, defender, effectiveField, hits)}</div>`;
    }
  } else {
    if (!isDamagingMove(move)) {
      const reason = move.category === "Status" ? "is a status move" : "does not have supported damage data";
      html = `<div class="calc-result-section"><div style="color:#888">${move.name} ${reason} — no damage to calculate.</div></div>`;
    } else {
      const defStats = (defender.defenderMode === "manual" && defender.customStats)
        ? defender.customStats : defender.averageStats;
      const defAsAttacker = {
        name: defender.name, types: defender.types, ability: defender.ability,
        item: defender.item, tera: defender.tera, level: defender.level,
        customStats: defStats, boosts: defender.boosts || {},
        status: defender.status || "Healthy",
        weightkg: defender.weightkg,
        baseStats: defender.baseStats || {},
        calcSpecies: defender.calcSpecies,
        calcGeneration: defender.calcGeneration,
        speciesOverrides: defender.speciesOverrides,
        _abilityBoosts: defender._abilityBoosts,
        _abilityFlags: defender._abilityFlags,
        abilityActivated: defender.abilityActivated,
      };
      const official = calcOfficialResult(defAsAttacker, move, attacker, effectiveField, hits, defStats, attacker.customStats);
      const result = official || calcMultihitRolls(defAsAttacker, move, attacker.customStats,
        attacker.types, attacker.tera, attacker.ability, attacker.item, effectiveField, getMergedBoosts(attacker), hits);
      html = `<div class="calc-result-section">${renderSingleResult(result, move, defAsAttacker, attacker, effectiveField, hits)}</div>`;
    }
  }
  resultsEl.innerHTML = html;
}

// ─── EVENT HANDLERS ───────────────────────────────────────────────────────────
function onMoveClick(moveId, isAttacker) {
  const source = isAttacker ? "attacker" : "defender";
  const pool = isAttacker
    ? [...(calcState.attacker?.topMoves || []), ...(calcState.attacker?.customMoves || [])]
    : [...(calcState.defender?.topMoves || []), ...(calcState.defender?.customMoves || [])];
  const move = pool.find(m => m.id === moveId);
  calcState.selectedMove = move ? { source, move, isCrit: isMoveCrit(source, move.id) } : null;
  runCalc();
}

function onMoveCritToggle(moveId, isAttacker, checked = null) {
  const source = isAttacker ? "attacker" : "defender";
  if (checked === null) checked = !isMoveCrit(source, moveId);
  setMoveCrit(source, moveId, checked);
  onMoveClick(moveId, isAttacker);
}

function onMoveHitsChange(moveId, isAttacker, value) {
  const source = isAttacker ? "attacker" : "defender";
  setMoveHits(source, moveId, parseInt(value));
  runCalc();
}

function applyBoostColor(el) {
  if (!el) return;
  const v = parseInt(el.value) || 0;
  el.style.color = v > 0 ? "#a5d6a7" : v < 0 ? "#ef9a9a" : "";
  el.style.borderColor = v > 0 ? "#4caf50" : v < 0 ? "#ef5350" : "";
}

function onBoostChange(statKey, isAttacker) {
  const prefix = isAttacker ? "calc-boost-" : "calc-boost-opp-";
  const el = document.getElementById(`${prefix}${statKey}`);
  const val = parseInt(el?.value) || 0;
  applyBoostColor(el);
  if (isAttacker) {
    if (calcState.attacker) {
      calcState.attacker.boosts = calcState.attacker.boosts || {};
      calcState.attacker.boosts[statKey] = val;
      const finalEl = document.getElementById(`calc-atk-final-${statKey}`);
      const baseStat = parseInt(finalEl?.dataset?.base) || 0;
      if (finalEl) applyEffectiveStat(finalEl, baseStat, val);
    }
  } else {
    if (calcState.defender) {
      calcState.defender.boosts = calcState.defender.boosts || {};
      calcState.defender.boosts[statKey] = val;
      const finalEl = document.getElementById(`calc-def-final-${statKey}`);
      const baseStat = parseInt(finalEl?.dataset?.base) || 0;
      if (finalEl) applyEffectiveStat(finalEl, baseStat, val);
    }
  }
  runCalc();
}

// ─── MOVE SEARCH ─────────────────────────────────────────────────────────────
const _movePool = {};  // moveId → move object (populated from search results)

async function searchMoves(query, isAttacker) {
  const prefix = isAttacker ? "calc-atk-move" : "calc-def-move";
  const dropdown = document.getElementById(`${prefix}-dropdown`);
  if (!dropdown) return;
  const q = query.trim();
  if (!q || q.length < 2) { dropdown.style.display = "none"; return; }
  try {
    const fmt = encodeURIComponent(window.selectedFormat || "");
    const resp = await fetch(`/api/moves/search?q=${encodeURIComponent(q)}&format=${fmt}`);
    const moves = await resp.json();
    if (!moves.length) { dropdown.style.display = "none"; return; }
    moves.forEach(m => { _movePool[m.id] = m; });
    dropdown.innerHTML = moves.map(m =>
      `<div class="calc-ac-item" data-moveid="${m.id}" onmousedown="selectSearchedMove('${m.id}',${isAttacker})">
        ${typeBadgeHTML(m.type)}
        <span>${m.name}</span>
        <span style="color:#555;font-size:10px;margin-left:4px">${moveBasePowerLabel(m)} ${m.category}</span>
       </div>`
    ).join("");
    dropdown.style.display = "block";
  } catch { dropdown.style.display = "none"; }
}

function selectSearchedMove(moveId, isAttacker) {
  const move = _movePool[moveId];
  if (!move) return;
  const prefix = isAttacker ? "calc-atk-move" : "calc-def-move";
  const input = document.getElementById(`${prefix}-search`);
  const dropdown = document.getElementById(`${prefix}-dropdown`);
  if (input) input.value = move.name;
  if (dropdown) dropdown.style.display = "none";
  if (isAttacker && calcState.attacker) {
    calcState.attacker.customMoves = [{ ...move }];
  } else if (!isAttacker && calcState.defender) {
    calcState.defender.customMoves = [{ ...move }];
  }
  onMoveClick(move.id, isAttacker);
}

function onAttackerPresetChange(val) {
  if (!calcState.attacker) return;
  const idx = parseInt(val);
  if (isNaN(idx)) return;
  const spread = calcState.attacker.spreads?.[idx];
  if (!spread) return;
  const [nature, evStr] = spread.spread.split(":");
  const evs = evStr ? evStr.split("/").map(Number) : Array(6).fill(0);
  fillEVTable(nature, evs);
  const display = document.getElementById("calc-attacker-preset-display");
  if (display) { display.textContent = spreadDisplayText(formatSpreadReadable(spread.spread), spread.weight); display.dataset.value = val; }
  calcState.attacker.customStats = computeStatsFromInputs();
  runCalc();
}

function setDefenderMode(mode) {
  const isAverage = mode === "average";
  if (calcState.defender) calcState.defender.defenderMode = mode;

  // Toggle column header
  const colLabel = document.getElementById("calc-def-ev-col-label");
  if (colLabel) colLabel.textContent = isAverage ? "Avg" : (calcState.defender?.isChampions ? "SP" : "EV");

  // Toggle avg spans vs EV inputs
  STAT_KEYS.forEach(k => {
    const avgSpan = document.getElementById(`calc-def-avg-${k}`);
    const evInput = document.getElementById(`calc-def-ev-${k}`);
    if (avgSpan) avgSpan.style.display = isAverage ? "" : "none";
    if (evInput) evInput.style.display = isAverage ? "none" : "";
  });

  // Toggle EV total row
  const totalRow = document.getElementById("calc-def-ev-total-row");
  if (totalRow) totalRow.style.display = isAverage ? "none" : "";

  // Toggle nature dropdown
  const natureEl = document.getElementById("calc-defender-nature");
  if (natureEl) {
    if (isAverage) {
      natureEl.disabled = true;
      natureEl.innerHTML = "<option>Average</option>";
    } else {
      natureEl.disabled = false;
      populateNatureSelect("calc-defender-nature", calcState.defender?.nature || "Hardy");
    }
  }

  // Update header text
  const headerEl = document.getElementById("calc-defender-header");
  if (headerEl) headerEl.textContent = isAverage ? "Average Opponent" : "Opponent";

  // In manual mode, update EV input limits and compute stats
  if (!isAverage && calcState.defender) {
    updateDefenderEVInputLimits(calcState.defender.isChampions);
    calcState.defender.customStats = computeDefenderStatsFromInputs();
  }
}

function onDefenderPresetChange(val) {
  if (!calcState.defender) return;
  const display = document.getElementById("calc-defender-preset-display");

  if (val === "average") {
    if (display) { display.innerHTML = `Usage-weighted average${tipHTML("Stats are averaged across all spreads this Pokémon runs on ladder, weighted by usage. Damage is calculated against every individual spread.")}`; display.dataset.value = "average"; }
    setDefenderMode("average");
    setDefenderStatDisplay(calcState.defender.baseStats, calcState.defender.averageStats);
    runCalc();
    return;
  }

  const idx = parseInt(val);
  if (isNaN(idx)) return;
  const spread = calcState.defender.spreads?.[idx];
  if (!spread) return;

  if (display) { display.textContent = spreadDisplayText(formatSpreadReadable(spread.spread), spread.weight); display.dataset.value = val; }

  const [nature, evStr] = spread.spread.split(":");
  const evs = evStr ? evStr.split("/").map(Number) : Array(6).fill(0);

  setDefenderMode("manual");
  fillDefenderEVTable(nature, evs);

  calcState.defender.customStats = computeDefenderStatsFromInputs();
  runCalc();
}

function updateEVTotal() {
  let total = 0;
  STAT_KEYS.forEach(k => {
    total += parseInt(document.getElementById(`calc-atk-ev-${k}`)?.value) || 0;
  });
  const el = document.getElementById("calc-atk-ev-total");
  if (el) el.textContent = total;
}

function updateEVInputLimits(isChampions) {
  const max = isChampions ? 32 : 252;
  STAT_KEYS.forEach(k => {
    const el = document.getElementById(`calc-atk-ev-${k}`);
    if (el) {
      el.max = max;
      if (parseInt(el.value) > max) el.value = max;
    }
  });
  const maxLabel = document.getElementById("calc-atk-ev-max");
  if (maxLabel) maxLabel.textContent = isChampions ? "" : " / 510";
  updateEVTotal();
}

const ALL_POKEMON_TYPES = ["Normal","Fire","Water","Electric","Grass","Ice","Fighting","Poison","Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy"];

function populateTypeSelects(side, types) {
  const sel1 = document.getElementById(`calc-${side}-type1`);
  const sel2 = document.getElementById(`calc-${side}-type2`);
  if (!sel1 || !sel2) return;
  sel1.innerHTML = ALL_POKEMON_TYPES.map(t => `<option value="${t}"${t === types[0] ? " selected" : ""}>${t}</option>`).join("");
  sel2.innerHTML = `<option value="None"${types.length < 2 ? " selected" : ""}>None</option>` +
    ALL_POKEMON_TYPES.map(t => `<option value="${t}"${types.length >= 2 && t === types[1] ? " selected" : ""}>${t}</option>`).join("");
}

function _onTypeChange(side, stateKey) {
  if (!calcState[stateKey]) return;
  const t1 = document.getElementById(`calc-${side}-type1`)?.value;
  const t2 = document.getElementById(`calc-${side}-type2`)?.value;
  if (t1) {
    calcState[stateKey].types = t2 && t2 !== "None" ? [t1, t2] : [t1];
  }
  runCalc();
}
function onAttackerTypeChange() { _onTypeChange("attacker", "attacker"); }
function onDefenderTypeChange() { _onTypeChange("defender", "defender"); }

function populateFormSelect(side, formeOrder, currentName) {
  const wrap = document.getElementById(`calc-${side}-form-wrap`);
  const sel = document.getElementById(`calc-${side}-form`);
  if (!wrap || !sel) return;
  if (!formeOrder || formeOrder.length <= 1) {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "";
  sel.innerHTML = formeOrder.map(f =>
    `<option value="${f}"${f === currentName ? " selected" : ""}>${f}</option>`
  ).join("");
}

function onAttackerFormChange() {
  const sel = document.getElementById("calc-attacker-form");
  if (!sel) return;
  const input = document.getElementById("calc-attacker-input");
  if (input) input.value = sel.value;
  onAttackerChange({ formSwap: true });
}

function onDefenderFormChange() {
  const sel = document.getElementById("calc-defender-form");
  if (!sel) return;
  const input = document.getElementById("calc-defender-input");
  if (input) input.value = sel.value;
  onDefenderChange({ formSwap: true });
}

function onAttackerStatChange() {
  if (!calcState.attacker) return;
  // Clamp EV/SP values
  const max = calcState.attacker.isChampions ? 32 : 252;
  STAT_KEYS.forEach(k => {
    const el = document.getElementById(`calc-atk-ev-${k}`);
    if (el) {
      let v = parseInt(el.value) || 0;
      if (v > max) { el.value = max; }
      if (v < 0) { el.value = 0; }
    }
    // Clamp IV values (0-31)
    const ivEl = document.getElementById(`calc-atk-iv-${k}`);
    if (ivEl) {
      let iv = parseInt(ivEl.value) || 0;
      if (iv > 31) { ivEl.value = 31; }
      if (iv < 0) { ivEl.value = 0; }
    }
  });
  calcState.attacker.customStats = computeStatsFromInputs();

  // Sync preset display to current nature+EVs
  const nature = document.getElementById("calc-atk-nature")?.value || "Hardy";
  const evTable = {};
  STAT_KEYS.forEach(k => { evTable[k] = parseInt(document.getElementById(`calc-atk-ev-${k}`)?.value) || 0; });
  const currentStr = buildSpreadStr(nature, evTable);
  const match = findMatchingSpread(calcState.attacker.spreads, currentStr);
  const display = document.getElementById("calc-attacker-preset-display");
  if (match) {
    const readable = formatSpreadReadable(match.spread.spread);
    if (display) { display.textContent = spreadDisplayText(readable, match.spread.weight); display.dataset.value = String(match.idx); }
  } else {
    if (display) { display.textContent = "Custom Spread"; display.dataset.value = ""; }
  }

  runCalc();
}

async function onAttackerChange(opts = {}) {
  const input = document.getElementById("calc-attacker-input")?.value.trim();
  if (!input) return;

  const data = await fetchCalcData(input);
  if (!data) {
    calcState.attacker = null;
    return;
  }
  const isFormSwap = opts.formSwap && calcState.attacker;
  clearCritStateForSource("attacker");
  clearHitsStateForSource("attacker");

  populateTeraSelect("calc-attacker-tera", isFormSwap ? (calcState.attacker._selectedTera || "None") : "None");
  populateAbilitySelect("calc-attacker-ability", data.allAbilities, data.topAbility);
  populateItemSelect("calc-attacker-item", data.allItems, isFormSwap ? calcState.attacker.item : data.topItem);
  populateTypeSelects("attacker", data.types || ["Normal"]);
  populateFormSelect("attacker", data.formeOrder || [], data.name);
  const attackerStatusSel = document.getElementById("calc-attacker-status");
  if (attackerStatusSel && !isFormSwap) attackerStatusSel.value = "Healthy";
  populatePresetSelect(data);

  // Update EV/SP column label and input limits
  const evLabel = document.getElementById("calc-ev-col-label");
  if (evLabel) evLabel.textContent = data.isChampions ? "SP" : "EV";
  updateEVInputLimits(data.isChampions);
  toggleIVColumns(data.isChampions);
  if (!isFormSwap) {
    // Reset IV inputs to 31 for new Pokemon
    STAT_KEYS.forEach(k => {
      const el = document.getElementById(`calc-atk-iv-${k}`);
      if (el) el.value = 31;
    });
  }

  // Preserve prior state on form swap
  const prevAbility = isFormSwap ? calcState.attacker.ability : null;
  const prevItem = isFormSwap ? calcState.attacker.item : null;
  const prevStatus = isFormSwap ? calcState.attacker.status : "Healthy";
  const prevBoosts = isFormSwap ? { ...calcState.attacker.boosts } : { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const prevTera = isFormSwap ? calcState.attacker._selectedTera : "None";
  const prevTeraActive = isFormSwap ? calcState.attacker.teraActive : false;

  // Store attacker state (needed by computeStatsFromInputs)
  const firstDamaging = data.topMoves.find(isDamagingMove);
  calcState.attacker = {
    name: data.name, types: data.types, level: data.level, weightkg: data.weightkg || 0,
    isChampions: data.isChampions, calcGeneration: data.calcGeneration, calcSpecies: data.calcSpecies,
    speciesOverrides: data.speciesOverrides || {}, baseStats: data.baseStats || {},
    ability: prevAbility || data.topAbility || "", item: prevItem || data.topItem || "",
    status: prevStatus,
    tera: prevTeraActive ? prevTera : "None", _selectedTera: prevTera, teraActive: prevTeraActive,
    customStats: {}, spreads: data.spreads, allSpreads: data.allSpreads || data.spreads || [], topMoves: data.topMoves,
    boosts: prevBoosts, customMoves: [],
  };
  updateAbilityCheckbox(true);
  if (!isFormSwap) {
    // Reset boost selects
    ["atk","def","spa","spd","spe"].forEach(k => {
      const el = document.getElementById(`calc-boost-${k}`);
      if (el) { el.value = "0"; applyBoostColor(el); }
    });
  }

  // Populate base stat column
  setBaseStatDisplay(data.baseStats || {});

  // Load top spread into EV table — on form swap, keep current EVs/nature
  if (!isFormSwap) {
    const firstSpread = data.spreads[0];
    if (firstSpread) {
      const [nature, evStr] = firstSpread.spread.split(":");
      const evs = evStr ? evStr.split("/").map(Number) : Array(6).fill(0);
      fillEVTable(nature, evs);
    } else {
      fillEVTable("Hardy", Array(6).fill(0));
    }
  }

  calcState.attacker.customStats = computeStatsFromInputs() || data.averageStats;
  syncTeraToggle(true);
  if (!isFormSwap && firstDamaging) calcState.selectedMove = { source: "attacker", move: firstDamaging, isCrit: false };
  runCalc();
}

async function onDefenderChange(opts = {}) {
  const input = document.getElementById("calc-defender-input")?.value.trim();
  if (!input) return;

  const data = await fetchCalcData(input);
  if (!data) {
    setDefenderStatDisplay({}, {});
    const presetDisplay = document.getElementById("calc-defender-preset-display");
    const presetDrop = document.getElementById("calc-defender-preset-dropdown");
    if (presetDisplay) { presetDisplay.textContent = "— load a Pokémon first —"; presetDisplay.dataset.value = ""; }
    if (presetDrop) presetDrop.innerHTML = "";
    const natureEl = document.getElementById("calc-defender-nature");
    if (natureEl) {
      natureEl.disabled = true;
      natureEl.innerHTML = "<option>Average</option>";
    }
    calcState.defender = null;
    return;
  }
  const isFormSwap = opts.formSwap && calcState.defender;
  clearCritStateForSource("defender");
  clearHitsStateForSource("defender");

  populateTeraSelect("calc-defender-tera", isFormSwap ? (calcState.defender._selectedTera || "None") : "None");
  populateAbilitySelect("calc-defender-ability", data.allAbilities, data.topAbility);
  populateItemSelect("calc-defender-item", data.allItems, isFormSwap ? calcState.defender.item : data.topItem);
  populateTypeSelects("defender", data.types || ["Normal"]);
  populateFormSelect("defender", data.formeOrder || [], data.name);
  const defenderStatusSel = document.getElementById("calc-defender-status");
  if (defenderStatusSel && !isFormSwap) defenderStatusSel.value = "Healthy";
  populateDefenderPresetDisplay(data);

  // Preserve prior state on form swap
  const prevAbility = isFormSwap ? calcState.defender.ability : null;
  const prevItem = isFormSwap ? calcState.defender.item : null;
  const prevStatus = isFormSwap ? calcState.defender.status : "Healthy";
  const prevBoosts = isFormSwap ? { ...calcState.defender.boosts } : { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const prevTera = isFormSwap ? calcState.defender._selectedTera : "None";
  const prevTeraActive = isFormSwap ? calcState.defender.teraActive : false;
  const prevMode = isFormSwap ? calcState.defender.defenderMode : "average";
  const prevCustomStats = isFormSwap ? calcState.defender.customStats : null;
  // On form swap with no new spread data, inherit spreads from previous form
  const hasSpreads = data.spreads && data.spreads.length > 0;
  const prevSpreads = isFormSwap && !hasSpreads ? calcState.defender.spreads : (data.spreads || []);
  const prevAllSpreads = isFormSwap && !hasSpreads ? calcState.defender.allSpreads : (data.allSpreads || data.spreads || []);
  const prevAvgStats = isFormSwap && !hasSpreads ? calcState.defender.averageStats : data.averageStats;

  calcState.defender = {
    name: data.name, types: data.types, level: data.level, weightkg: data.weightkg || 0,
    isChampions: data.isChampions || false, calcGeneration: data.calcGeneration, calcSpecies: data.calcSpecies,
    speciesOverrides: data.speciesOverrides || {}, baseStats: data.baseStats || {},
    spreads: prevSpreads, allSpreads: prevAllSpreads,
    ability: prevAbility || data.topAbility || "", item: prevItem || data.topItem || "",
    status: prevStatus,
    tera: prevTeraActive ? prevTera : "None", _selectedTera: prevTera, teraActive: prevTeraActive,
    averageStats: prevAvgStats,
    defGroups: data.defGroups || [], spdGroups: data.spdGroups || [],
    atkGroups: data.atkGroups || [], spaGroups: data.spaGroups || [],
    defTiers: data.defTiers || {}, spdTiers: data.spdTiers || {},
    topMoves: data.topMoves,
    boosts: prevBoosts, customMoves: [],
    defenderMode: prevMode,
  };
  updateAbilityCheckbox(false);
  if (!isFormSwap) {
    // Reset opponent boost selects
    ["atk","spa","def","spd","spe"].forEach(k => {
      const el = document.getElementById(`calc-boost-opp-${k}`);
      if (el) { el.value = "0"; applyBoostColor(el); }
    });
    // Reset IV inputs to 31 for new Pokemon
    STAT_KEYS.forEach(k => {
      const el = document.getElementById(`calc-def-iv-${k}`);
      if (el) el.value = 31;
    });
  }
  setDefenderMode(prevMode);
  if (isFormSwap && prevMode === "manual" && prevCustomStats) {
    calcState.defender.customStats = computeDefenderStatsFromInputs() || prevCustomStats;
  }
  syncTeraToggle(false);
  setDefenderStatDisplay(data.baseStats || {}, prevAvgStats || {});
  runCalc();
}


function onAttackerAbilityChange(val) { if (calcState.attacker) { calcState.attacker.ability = val || ""; updateAbilityCheckbox(true); runCalc(); } }
function onAttackerItemChange(val)    { if (calcState.attacker) { calcState.attacker.item = (!val || val === "None") ? "" : val; runCalc(); } }
function onAttackerStatusChange()  { if (calcState.attacker) { calcState.attacker.status = document.getElementById("calc-attacker-status")?.value || "Healthy"; runCalc(); } }
function onAttackerTeraChange() {
  if (!calcState.attacker) return;
  const val = document.getElementById("calc-attacker-tera")?.value || "None";
  calcState.attacker._selectedTera = val;
  calcState.attacker.tera = calcState.attacker.teraActive ? val : "None";
  syncTeraToggle(true);
  runCalc();
}
function onDefenderAbilityChange(val) { if (calcState.defender) { calcState.defender.ability = val || ""; updateAbilityCheckbox(false); runCalc(); } }
function onDefenderItemChange(val)    { if (calcState.defender) { calcState.defender.item = (!val || val === "None") ? "" : val; runCalc(); } }
function onDefenderStatusChange()  { if (calcState.defender) { calcState.defender.status = document.getElementById("calc-defender-status")?.value || "Healthy"; runCalc(); } }
function onDefenderTeraChange() {
  if (!calcState.defender) return;
  const val = document.getElementById("calc-defender-tera")?.value || "None";
  calcState.defender._selectedTera = val;
  calcState.defender.tera = calcState.defender.teraActive ? val : "None";
  syncTeraToggle(false);
  runCalc();
}

function syncTeraToggle(isAttacker) {
  const prefix = isAttacker ? "calc-attacker" : "calc-defender";
  const stateKey = isAttacker ? "attacker" : "defender";
  const btn = document.getElementById(`${prefix}-tera-btn`);
  if (!btn) return;
  const st = calcState[stateKey];
  if (!st) return;
  const selected = st._selectedTera || "None";
  const isOn = st.teraActive && selected !== "None";
  btn.classList.toggle("tera-on", isOn);
  btn.setAttribute("aria-pressed", isOn);
  btn.textContent = selected !== "None" ? selected : "Tera";
}

function onTeraToggle(isAttacker) {
  const prefix = isAttacker ? "calc-attacker" : "calc-defender";
  const stateKey = isAttacker ? "attacker" : "defender";
  const st = calcState[stateKey];
  if (!st) return;
  const sel = document.getElementById(`${prefix}-tera`);
  if (!sel) return;
  // If no type selected yet, pick the Pokemon's first type
  if (!st._selectedTera || st._selectedTera === "None") {
    const fallback = st.types?.[0] || "Normal";
    st._selectedTera = fallback;
    sel.value = fallback;
  }
  // Toggle active state
  st.teraActive = !st.teraActive;
  st.tera = st.teraActive ? st._selectedTera : "None";
  syncTeraToggle(isAttacker);
  runCalc();
}

function toggleCalcExplainer() {
  const body = document.getElementById("calc-explainer-body");
  const btn = document.getElementById("calc-explainer-btn");
  if (!body) return;
  const open = body.style.display === "block";
  body.style.display = open ? "none" : "block";
  btn.classList.toggle("open", !open);
  try { localStorage.setItem("calcExplainerDismissed", open ? "1" : ""); } catch (e) {}
}

function tipHTML(text) {
  return `<span class="calc-tip">?<span class="calc-tip-text">${text}</span></span>`;
}

function toggleFieldMore(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  const hidden = el.style.display === "none";
  el.style.display = hidden ? "" : "none";
  btn.textContent = hidden ? "Less \u25b4" : "More \u25be";
}

function onFieldChange() {
  const checked = id => document.getElementById(id)?.checked || false;
  calcState.field.format = document.querySelector("input[name='calc-field-format-mode']:checked")?.value
    || document.getElementById("calc-field-format")?.value || "Doubles";
  calcState.field.weather = document.querySelector("input[name='calc-field-weather-mode']:checked")?.value
    || document.getElementById("calc-field-weather")?.value || "None";
  calcState.field.terrain = document.querySelector("input[name='calc-field-terrain-mode']:checked")?.value
    || document.getElementById("calc-field-terrain")?.value || "None";
  calcState.field.yourHelpingHand = checked("calc-your-helpinghand");
  calcState.field.yourReflect = checked("calc-your-reflect");
  calcState.field.yourLightScreen = checked("calc-your-lightscreen");
  calcState.field.yourAuroraVeil = checked("calc-your-auroraveil");
  calcState.field.yourTailwind = checked("calc-your-tailwind");
  calcState.field.yourFriendGuard = checked("calc-your-friendguard");
  calcState.field.oppHelpingHand = checked("calc-opp-helpinghand");
  calcState.field.oppReflect = checked("calc-opp-reflect");
  calcState.field.oppLightScreen = checked("calc-opp-lightscreen");
  calcState.field.oppAuroraVeil = checked("calc-opp-auroraveil");
  calcState.field.oppTailwind = checked("calc-opp-tailwind");
  calcState.field.oppFriendGuard = checked("calc-opp-friendguard");
  calcState.field.yourProtect = checked("calc-your-protect");
  calcState.field.oppProtect = checked("calc-opp-protect");
  calcState.field.yourBattery = checked("calc-your-battery");
  calcState.field.yourPowerSpot = checked("calc-your-powerspot");
  calcState.field.yourSteelySpirit = checked("calc-your-steelyspirit");
  calcState.field.oppBattery = checked("calc-opp-battery");
  calcState.field.oppPowerSpot = checked("calc-opp-powerspot");
  calcState.field.oppSteelySpirit = checked("calc-opp-steelyspirit");

  calcState.field.isAtkTailwind = calcState.field.yourTailwind;
  calcState.field.isDefTailwind = calcState.field.oppTailwind;
  calcState.field.isGravity = checked("calc-field-gravity");
  calcState.field.isTrickRoom = checked("calc-field-trickroom");
  runCalc();
}

// ─── TAB SWITCHING ────────────────────────────────────────────────────────────
function setCalcMessage(text) {
  const resultsEl = document.getElementById("calc-results");
  if (resultsEl) resultsEl.innerHTML = `<div style="color:#888;padding:10px 0;">${text}</div>`;
}

function resetCalcPokemonState() {
  calcState.attacker = null;
  calcState.defender = null;
  calcState.selectedMove = null;
  calcState.critByMove = {};
  calcCache = {};

  const atkInput = document.getElementById("calc-attacker-input");
  const defInput = document.getElementById("calc-defender-input");
  if (atkInput) atkInput.value = "";
  if (defInput) defInput.value = "";

  const atkMoves = document.getElementById("calc-atk-movelist");
  const defMoves = document.getElementById("calc-def-movelist");
  if (atkMoves) atkMoves.innerHTML = '<div style="color:#444;font-size:11px">Load a Pokémon to see moves</div>';
  if (defMoves) defMoves.innerHTML = '<div style="color:#444;font-size:11px">Load an opponent to see moves</div>';

  const atkPresetDisplay = document.getElementById("calc-attacker-preset-display");
  const atkPresetDrop = document.getElementById("calc-attacker-preset-dropdown");
  if (atkPresetDisplay) { atkPresetDisplay.textContent = "— load a Pokémon first —"; atkPresetDisplay.dataset.value = ""; }
  if (atkPresetDrop) atkPresetDrop.innerHTML = "";

  const defPresetDisplay = document.getElementById("calc-defender-preset-display");
  const defPresetDrop = document.getElementById("calc-defender-preset-dropdown");
  if (defPresetDisplay) { defPresetDisplay.textContent = "— load a Pokémon first —"; defPresetDisplay.dataset.value = ""; }
  if (defPresetDrop) defPresetDrop.innerHTML = "";

  setBaseStatDisplay({});
  setDefenderStatDisplay({}, {});
}

function resetDefenderUI() {
  const defInput = document.getElementById("calc-defender-input");
  if (defInput) defInput.value = "";

  const defMoves = document.getElementById("calc-def-movelist");
  if (defMoves) defMoves.innerHTML = '<div style="color:#444;font-size:11px">Load an opponent to see moves</div>';

  const defPresetDisplay = document.getElementById("calc-defender-preset-display");
  const defPresetDrop = document.getElementById("calc-defender-preset-dropdown");
  if (defPresetDisplay) { defPresetDisplay.textContent = "— load a Pokémon first —"; defPresetDisplay.dataset.value = ""; }
  if (defPresetDrop) defPresetDrop.innerHTML = "";

  setDefenderMode("average");
  setDefenderStatDisplay({}, {});
}

function populateCalcRatingSelect(formatCode, selectedRating) {
  const ratingSel = document.getElementById("calc-rating-select");
  if (!ratingSel) return selectedRating || "";
  const ratings = (window.calcFormatRatings && window.calcFormatRatings[formatCode]) || [];
  const nextRating = ratings.includes(selectedRating) ? selectedRating : (ratings[ratings.length - 1] || selectedRating || "");
  ratingSel.innerHTML = ratings.map(r => `<option value="${r}"${r === nextRating ? " selected" : ""}>${r}+</option>`).join("");
  if (!ratings.length && nextRating) ratingSel.innerHTML = `<option value="${nextRating}">${nextRating}+</option>`;
  ratingSel.value = nextRating;
  return nextRating;
}

function initCalcSourceControls() {
  const formatSel = document.getElementById("calc-format-select");
  if (formatSel) formatSel.value = window.selectedFormat || formatSel.value;
  populateCalcRatingSelect(formatSel?.value || window.selectedFormat, window.selectedRating);
}

async function reloadCalcDataSource(formatCode, ratingValue) {
  if (!formatCode || !ratingValue) return;
  window.selectedFormat = formatCode;
  window.selectedRating = ratingValue;

  // Clear cache only — preserve attacker, field, and (conditionally) defender state
  calcCache = {};
  setCalcMessage("Loading usage data…");

  const monthParam = window.selectedMonth ? `?month=${encodeURIComponent(window.selectedMonth)}` : "";
  try {
    const resp = await fetch(`/api/${encodeURIComponent(formatCode)}/${encodeURIComponent(ratingValue)}/${monthParam}`);
    if (!resp.ok) throw new Error("No data found");
    const data = await resp.json();
    window.calcPokemonOptions = (data.pokemon_names || []).map(p => ({ name: p[0], usage: p[1] }));
    window.calcPokemonNames = window.calcPokemonOptions.map(p => p.name);
    window.currentPokemonName = window.calcPokemonNames[0] || data.selected_pokemon || "";
    window.isChampions = !!data.is_champions;
    toggleIVColumns(window.isChampions);
    history.replaceState(null, "", `/calc/${encodeURIComponent(formatCode)}/${encodeURIComponent(ratingValue)}/${monthParam}`);

    // Handle defender based on its current mode
    if (calcState.defender) {
      if (calcState.defender.defenderMode === "average") {
        // Re-fetch defender data for new format/rating
        const defName = document.getElementById("calc-defender-input")?.value.trim() || calcState.defender.name;
        const defData = await fetchCalcData(defName);
        if (defData) {
          const defInput = document.getElementById("calc-defender-input");
          if (defInput) defInput.value = defName;
          // Preserve selected move source info before reloading defender
          const prevSelectedMove = calcState.selectedMove;
          await onDefenderChange();
          // Restore the selected move if it was an attacker move
          if (prevSelectedMove?.source === "attacker") {
            calcState.selectedMove = prevSelectedMove;
          }
        } else {
          // Pokemon doesn't exist in new format — clear defender
          calcState.defender = null;
          calcState.selectedMove = null;
          resetDefenderUI();
        }
      }
      // If in manual mode: preserve defender as-is (no changes needed)
    }

    // If no attacker loaded, load default
    if (!calcState.attacker) {
      const defaultName = getDefaultCalcPokemonName();
      if (defaultName) {
        const atkInput = document.getElementById("calc-attacker-input");
        if (atkInput && !atkInput.value) {
          atkInput.value = defaultName;
          await onAttackerChange();
        }
      }
    }

    // If no defender loaded, load default
    if (!calcState.defender) {
      const defaultName = getDefaultCalcPokemonName();
      if (defaultName) {
        const defInput = document.getElementById("calc-defender-input");
        if (defInput && !defInput.value) {
          defInput.value = defaultName;
          await onDefenderChange();
        }
      }
    }

    runCalc();
  } catch (e) {
    setCalcMessage("No damage calc data found for that format and rating.");
  }
}

function onCalcFormatChange() {
  const formatCode = document.getElementById("calc-format-select")?.value || window.selectedFormat;
  const ratingValue = populateCalcRatingSelect(formatCode, window.selectedRating);
  // Format changed — reset both Pokémon so defaults load from the new format
  resetCalcPokemonState();
  reloadCalcDataSource(formatCode, ratingValue);
}

function onCalcRatingChange() {
  const formatCode = document.getElementById("calc-format-select")?.value || window.selectedFormat;
  const ratingValue = document.getElementById("calc-rating-select")?.value || window.selectedRating;
  reloadCalcDataSource(formatCode, ratingValue);
}

function getDefaultCalcPokemonName() {
  return window.calcPokemonNames?.[0] || window.currentPokemonName || "";
}

async function loadDefaultCalcPokemon() {
  const defaultName = getDefaultCalcPokemonName();
  if (!defaultName) return;
  const loads = [];

  const atkInput = document.getElementById("calc-attacker-input");
  if (!calcState.attacker && atkInput && !atkInput.value) {
    atkInput.value = defaultName;
    loads.push(onAttackerChange());
  }

  const defInput = document.getElementById("calc-defender-input");
  if (!calcState.defender && defInput && !defInput.value) {
    defInput.value = defaultName;
    loads.push(onDefenderChange());
  }
  await Promise.all(loads);
}

function switchTab(tab) {
  const usagePanel = document.getElementById("usage-panel");
  const calcPanel = document.getElementById("calc-panel");
  const usageBtn = document.getElementById("tab-usage-btn");
  const calcBtn = document.getElementById("tab-calc-btn");
  if (!usagePanel || !calcPanel) {
    if (calcPanel) calcPanel.style.display = "block";
    if (calcBtn) calcBtn.classList.add("tab-active");
    if (usageBtn) usageBtn.classList.remove("tab-active");
    loadDefaultCalcPokemon();
    return;
  }
  if (tab === "usage") {
    usagePanel.style.display = "contents";
    calcPanel.style.display = "none";
    usageBtn.classList.add("tab-active");
    calcBtn.classList.remove("tab-active");
    sessionStorage.setItem("activeTab", "usage");
  } else {
    usagePanel.style.display = "none";
    calcPanel.style.display = "block";
    usageBtn.classList.remove("tab-active");
    calcBtn.classList.add("tab-active");
    sessionStorage.setItem("activeTab", "calc");
    loadDefaultCalcPokemon();
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
function initBoostSelects() {
  const opts = Array.from({length:13}, (_,i) => {
    const v = 6 - i;
    return `<option value="${v}"${v===0?" selected":""}>${v>0?"+":""}${v}</option>`;
  }).join("");
  ["calc-boost-atk","calc-boost-def","calc-boost-spa","calc-boost-spd","calc-boost-spe",
   "calc-boost-opp-atk","calc-boost-opp-spa","calc-boost-opp-def","calc-boost-opp-spd","calc-boost-opp-spe"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
}

function setRadioValue(name, value) {
  const el = document.querySelector(`input[name='${name}'][value='${value}']`);
  if (el) el.checked = true;
}

document.addEventListener("DOMContentLoaded", () => {
  loadSmogonCalcLists();
  initCalcAutocomplete("calc-attacker-input", "calc-attacker-dropdown", () => onAttackerChange());
  initCalcAutocomplete("calc-defender-input", "calc-defender-dropdown", () => onDefenderChange());
  initOptionAutocomplete("calc-attacker-ability", "calc-attacker-ability-dropdown", onAttackerAbilityChange);
  initOptionAutocomplete("calc-attacker-item", "calc-attacker-item-dropdown", onAttackerItemChange);
  initOptionAutocomplete("calc-defender-ability", "calc-defender-ability-dropdown", onDefenderAbilityChange);
  initOptionAutocomplete("calc-defender-item", "calc-defender-item-dropdown", onDefenderItemChange);
  initPresetDropdown("calc-attacker-preset-display", "calc-attacker-preset-dropdown", onAttackerPresetChange);
  initPresetDropdown("calc-defender-preset-display", "calc-defender-preset-dropdown", onDefenderPresetChange);
  initBoostSelects();
  initCalcSourceControls();

  const fmtIsDoubles = window.selectedFormat && (
    window.selectedFormat.includes("vgc") || window.selectedFormat.includes("doubl") ||
    window.selectedFormat.includes("champions") || window.selectedFormat.includes("bss")
  );
  calcState.field.format = fmtIsDoubles ? "Doubles" : "Singles";
  const fmtSel = document.getElementById("calc-field-format");
  if (fmtSel) fmtSel.value = calcState.field.format;
  setRadioValue("calc-field-format-mode", calcState.field.format);

  toggleIVColumns(!!window.isChampions);

  // Show explainer on first visit
  try {
    if (!localStorage.getItem("calcExplainerDismissed")) {
      const body = document.getElementById("calc-explainer-body");
      const btn = document.getElementById("calc-explainer-btn");
      if (body) { body.style.display = "block"; }
      if (btn) { btn.classList.add("open"); }
    }
  } catch (e) {}

  if (window.isCalcPage || sessionStorage.getItem("activeTab") === "calc") switchTab("calc");
});
