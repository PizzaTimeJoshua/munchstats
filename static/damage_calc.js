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

// ─── UTILITY ─────────────────────────────────────────────────────────────────
function pokeRound(n) { return Math.floor(n + 0.5); }

function chainMods(mods) {
  let M = 0x1000;
  for (const m of mods) {
    M = M >= 0x1000 ? Math.floor((M * m + 0x800) / 0x1000) : Math.floor(M * m / 0x1000);
  }
  return M;
}

function getTypeEffectiveness(moveType, defTypes, defTera) {
  const effectiveTypes = (defTera && defTera !== "None" && defTera !== "") ? [defTera] : defTypes;
  const chart = TYPE_CHART[moveType];
  if (!chart) return 1;
  let eff = 1;
  for (const dt of effectiveTypes) eff *= (chart[dt] !== undefined ? chart[dt] : 1);
  return eff;
}

function checkAbilityImmunity(moveType, defAbility, moveFlags) {
  const abilImm = TYPE_IMMUNITY_ABILITIES[defAbility];
  if (!abilImm) return false;
  if (abilImm === "_sound") return !!(moveFlags && moveFlags.sound);
  if (abilImm === "_ball") return !!(moveFlags && (moveFlags.bullet || moveFlags.bomb));
  return abilImm === moveType;
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
  let bp = move.bp;
  if (!bp || move.category === "Status") return 0;
  const ability = attacker.ability;
  const flags = move.flags || {};
  if (ability === "Technician" && bp <= 60) bp = Math.floor(bp * 1.5);
  if (ability === "Strong Jaw" && flags.bite) bp = Math.floor(bp * 1.5);
  if (ability === "Iron Fist" && flags.punch) bp = Math.floor(bp * 1.2);
  if (ability === "Tough Claws" && flags.contact) bp = Math.floor(bp * 1.3);
  if (ability === "Reckless" && move.hasRecoil) bp = Math.floor(bp * 1.2);
  if (ability === "Punk Rock" && flags.sound) bp = Math.floor(bp * 1.3);
  if (ability === "Steelworker" && move.type === "Steel") bp = Math.floor(bp * 1.5);
  if (ability === "Transistor" && move.type === "Electric") bp = Math.floor(bp * 1.5);
  if (ability === "Dragon's Maw" && move.type === "Dragon") bp = Math.floor(bp * 1.5);
  if (ability === "Rocky Payload" && move.type === "Rock") bp = Math.floor(bp * 1.5);
  if (ability === "Sheer Force" && move.hasSecondary) bp = Math.floor(bp * 1.3);
  if (ability === "Sand Force" && field.weather === "Sand" && ["Ground","Rock","Steel"].includes(move.type)) bp = Math.floor(bp * 1.3);
  if (field.terrain === "Electric" && move.type === "Electric") bp = Math.floor(bp * 1.3);
  if (field.terrain === "Grassy" && move.type === "Grass") bp = Math.floor(bp * 1.3);
  if (field.terrain === "Psychic" && move.type === "Psychic") bp = Math.floor(bp * 1.3);
  if (field.terrain === "Misty" && move.type === "Dragon") bp = Math.floor(bp * 0.5);
  return bp;
}

// ─── EFFECTIVE ATTACK / DEFENSE STATS ────────────────────────────────────────
function getEffectiveAtkStat(attacker, move) {
  const isPhys = move.category === "Physical";
  const stats = attacker.customStats;
  let stat = isPhys ? stats.atk : stats.spa;
  const ability = attacker.ability;
  const item = attacker.item;
  if (item === "Choice Band" && isPhys) stat = Math.floor(stat * 1.5);
  if (item === "Choice Specs" && !isPhys) stat = Math.floor(stat * 1.5);
  if ((ability === "Huge Power" || ability === "Pure Power") && isPhys) stat *= 2;
  if (ability === "Hustle" && isPhys) stat = Math.floor(stat * 1.5);
  if (ability === "Gorilla Tactics" && isPhys) stat = Math.floor(stat * 1.5);
  if (item === "Thick Club" && isPhys) stat *= 2;
  if (item === "Light Ball") stat *= 2;
  const boost = (attacker.boosts || {})[isPhys ? "atk" : "spa"] || 0;
  if (boost !== 0) stat = Math.floor(stat * (boost >= 0 ? (2 + boost) / 2 : 2 / (2 + Math.abs(boost))));
  return stat;
}

function getEffectiveDefStat(defStats, defItem, atkAbility, move, defBoosts) {
  const isPhys = move.category === "Physical";
  let stat = isPhys ? defStats.def : defStats.spd;
  if (defItem === "Assault Vest" && !isPhys) stat = Math.floor(stat * 1.5);
  if (defItem === "Eviolite") stat = Math.floor(stat * 1.5);
  if (atkAbility === "Sword of Ruin" && isPhys) stat = Math.floor(stat * 0.75);
  if (atkAbility === "Beads of Ruin" && !isPhys) stat = Math.floor(stat * 0.75);
  const boost = (defBoosts || {})[isPhys ? "def" : "spd"] || 0;
  if (boost !== 0) stat = Math.floor(stat * (boost >= 0 ? (2 + boost) / 2 : 2 / (2 + Math.abs(boost))));
  return stat;
}

// ─── CORE DAMAGE ROLLS ───────────────────────────────────────────────────────
// Returns { rolls: number[], typeEff: number, immune: boolean } or null
function calcDamageRolls(attacker, move, defStats, defTypes, defTera, defAbility, defItem, field, defBoosts) {
  const bp = getEffectiveBasePower(move, attacker, field);
  if (bp === 0) return null;

  const atkStat = getEffectiveAtkStat(attacker, move);
  const defStat = getEffectiveDefStat(defStats, defItem, attacker.ability, move, defBoosts);
  const level = attacker.level || 50;
  const isPhys = move.category === "Physical";

  if (!atkStat || !defStat) return null;

  const typeEff = getTypeEffectiveness(move.type, defTypes, defTera);
  if (typeEff === 0) return { rolls: [0], typeEff: 0, immune: true };
  if (checkAbilityImmunity(move.type, defAbility, move.flags)) return { rolls: [0], typeEff: 0, immune: true };
  if (defAbility === "Wonder Guard" && typeEff <= 1) return { rolls: [0], typeEff: 0, immune: true };

  const stabMod = getSTABMod(attacker.types, attacker.ability, move.type, attacker.tera);
  let base = Math.floor(Math.floor((Math.floor(2 * level / 5 + 2) * bp * atkStat) / defStat) / 50 + 2);

  if (move.isSpread && field.format !== "Singles") base = pokeRound(base * 0xC00 / 0x1000);
  const sunActive = field.weather === "Sun" || field.weather === "Harsh Sunshine";
  const rainActive = field.weather === "Rain" || field.weather === "Heavy Rain";
  if ((sunActive && move.type === "Fire") || (rainActive && move.type === "Water")) base = pokeRound(base * 0x1800 / 0x1000);
  else if ((sunActive && move.type === "Water") || (rainActive && move.type === "Fire")) base = pokeRound(base * 0x800 / 0x1000);
  if (field.isCritical) base = Math.floor(base * 1.5);

  const finalMods = [];
  if (field.isHelpingHand) finalMods.push(0x1800);
  if (!field.isCritical) {
    const screenMod = field.format !== "Singles" ? 0xAAC : 0x800;
    if (field.isAuroraVeil) finalMods.push(screenMod);
    else if (field.isReflect && isPhys) finalMods.push(screenMod);
    else if (field.isLightScreen && !isPhys) finalMods.push(screenMod);
  }
  if (field.isFriendGuard) finalMods.push(0xC00);
  if ((defAbility === "Filter" || defAbility === "Solid Rock" || defAbility === "Prism Armor") && typeEff > 1) finalMods.push(0xC00);
  if (defAbility === "Multiscale" || defAbility === "Shadow Shield") finalMods.push(0x800);
  if (defAbility === "Thick Fat" && (move.type === "Fire" || move.type === "Ice")) finalMods.push(0x800);
  if (defAbility === "Ice Scales" && !isPhys) finalMods.push(0x800);
  if (defAbility === "Heatproof" && move.type === "Fire") finalMods.push(0x800);
  if (defAbility === "Punk Rock" && (move.flags || {}).sound) finalMods.push(0x800);
  if (attacker.item === "Life Orb") finalMods.push(0x14CC);
  if (attacker.item === "Expert Belt" && typeEff > 1) finalMods.push(0x1333);
  if (attacker.item === "Muscle Band" && isPhys) finalMods.push(0x1199);
  if (attacker.item === "Wise Glasses" && !isPhys) finalMods.push(0x1199);
  const typeBoostType = TYPE_BOOST_ITEMS[attacker.item];
  if (typeBoostType && typeBoostType === move.type) finalMods.push(0x1333);
  const berryType = RESIST_BERRIES[defItem];
  if (berryType && berryType === move.type && typeEff > 1) finalMods.push(0x800);

  const finalChain = chainMods(finalMods);
  const isBurned = field.isBurned && isPhys && attacker.ability !== "Guts";

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

// ─── TIERED KO DISTRIBUTION ──────────────────────────────────────────────────
// Returns { koPct, tiers: { frail?, average?, bulky? }, immune }
function calcKODistribution(attacker, move, defenderData, field) {
  if (!attacker || !move || !defenderData) return null;
  const isPhys = move.category === "Physical";
  const tierData = isPhys ? defenderData.defTiers : defenderData.spdTiers;
  const allGroups = isPhys ? defenderData.defGroups : defenderData.spdGroups;
  if (!tierData && !allGroups) return null;

  const tierNames = ["frail", "average", "bulky"];
  const tierResults = {};
  let overallW = 0, overallKO = 0;
  let anyImmune = false;

  for (const tierName of tierNames) {
    const tier = tierData?.[tierName];
    if (!tier) continue;

    let tierW = 0, tierKO = 0;
    let reprRolls = null, reprHP = 0;

    for (const grp of tier.groups) {
      const defStats = { hp: grp.hp, def: isPhys ? grp.def : 999, spd: isPhys ? 999 : grp.spd };
      const result = calcDamageRolls(attacker, move, defStats,
        defenderData.types, defenderData.tera, defenderData.ability, defenderData.item, field, defenderData.boosts);
      if (!result) { tierW += grp.weight; continue; }
      if (result.immune) { anyImmune = true; tierW += grp.weight; continue; }
      const koCount = result.rolls.filter(r => r >= grp.hp).length;
      tierKO += grp.weight * (koCount / 16);
      tierW += grp.weight;
      if (!reprRolls) { reprRolls = result.rolls; reprHP = grp.hp; }
    }

    if (tierW > 0) {
      // Recalculate repr rolls using tier-level HP/def so % matches displayed stats
      const tierReprStats = { hp: tier.hp, def: isPhys ? tier.def : 999, spd: isPhys ? 999 : tier.spd };
      const tierReprRes = calcDamageRolls(attacker, move, tierReprStats,
        defenderData.types, defenderData.tera, defenderData.ability, defenderData.item, field, defenderData.boosts);
      if (tierReprRes && !tierReprRes.immune) { reprRolls = tierReprRes.rolls; reprHP = tier.hp; }
      tierResults[tierName] = {
        koPct: (tierKO / tierW) * 100,
        weight: tier.weight,
        hp: tier.hp,
        defStat: isPhys ? tier.def : tier.spd,
        reprRolls,
        reprHP,
      };
    }
    overallKO += tierKO;
    overallW += tierW;
  }

  // If tiers not available, fall back to raw groups
  if (Object.keys(tierResults).length === 0 && allGroups) {
    for (const grp of allGroups) {
      const defStats = { hp: grp.hp, def: isPhys ? grp.def : 999, spd: isPhys ? 999 : grp.spd };
      const result = calcDamageRolls(attacker, move, defStats,
        defenderData.types, defenderData.tera, defenderData.ability, defenderData.item, field, defenderData.boosts);
      if (!result || result.immune) { overallW += grp.weight; continue; }
      const koCount = result.rolls.filter(r => r >= grp.hp).length;
      overallKO += grp.weight * (koCount / 16);
      overallW += grp.weight;
    }
  }

  return {
    koPct: overallW > 0 ? (overallKO / overallW) * 100 : (anyImmune ? 0 : null),
    tiers: tierResults,
    isPhys,
    immune: anyImmune && Object.keys(tierResults).length === 0,
  };
}

// Reverse: single set check (attacker's one specific stats vs rolling damage)
function calcSingleKOChance(rolls, atkHP) {
  return (rolls.filter(r => r >= atkHP).length / 16) * 100;
}

// nHKO: probability sum of n independent random rolls >= hp
function calcNHKOChance(rolls, hp, n) {
  if (!rolls || !rolls.length || !hp) return 0;
  if (n === 1) return (rolls.filter(r => r >= hp).length / 16) * 100;
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
  return (count / Math.pow(16, n)) * 100;
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
function quickDamageSummary(attacker, move, defenderData, field) {
  if (!move.bp || move.category === "Status") return "—";
  const isPhys = move.category === "Physical";
  const avgDef = defenderData.averageStats;
  const defStats = { hp: avgDef.hp, def: avgDef.def, spd: avgDef.spd };
  const result = calcDamageRolls(attacker, move, defStats,
    defenderData.types, defenderData.tera, defenderData.ability, defenderData.item, field);
  if (!result) return "—";
  if (result.immune) return "immune";
  const hp = avgDef.hp || 1;
  const minP = (result.rolls[0] / hp * 100).toFixed(0);
  const maxP = (result.rolls[result.rolls.length - 1] / hp * 100).toFixed(0);
  return `${minP}–${maxP}%`;
}

// Quick damage for reverse (defender attacks user Pokemon using average stats)
function quickReverseSummary(defenderData, move, attacker, field) {
  if (!move.bp || move.category === "Status") return "—";
  const defAsAttacker = {
    types: defenderData.types, ability: defenderData.ability, item: defenderData.item,
    tera: defenderData.tera, level: defenderData.level,
    customStats: defenderData.averageStats,
    boosts: defenderData.boosts || {},
  };
  const atkHP = attacker.customStats.hp || 1;
  const result = calcDamageRolls(defAsAttacker, move, attacker.customStats,
    attacker.types, attacker.tera, attacker.ability, attacker.item, field);
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
  field: {
    format: "Doubles",
    weather: "None",
    terrain: "None",
    isReflect: false, isLightScreen: false, isAuroraVeil: false,
    isHelpingHand: false, isAtkTailwind: false,
    isDefTailwind: false, isFriendGuard: false,
    isCritical: false, isBurned: false,
  },
};

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

function calcFinalStat(base, ev, natureMult, isHP, level) {
  if (isHP) return Math.floor((2 * base + 31 + Math.floor(ev / 4)) * level / 100) + level + 10;
  return Math.floor((Math.floor((2 * base + 31 + Math.floor(ev / 4)) * level / 100) + 5) * natureMult);
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
  for (const k of STAT_KEYS) {
    const ev = parseInt(document.getElementById(`calc-atk-ev-${k}`)?.value) || 0;
    const base = atk.baseStats[k] || 0;
    const isHP = k === "hp";
    const mult = isHP ? 1 : (mods[k] || 1);
    stats[k] = isChamp ? calcChampionsStat(base, ev, mult, isHP)
                       : calcFinalStat(base, ev, mult, isHP, level);
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

// ─── POPULATE HELPERS ─────────────────────────────────────────────────────────
function populateTeraSelect(selectId, currentTera) {
  const types = ["None","Normal","Fire","Water","Electric","Grass","Ice","Fighting","Poison","Ground","Flying","Psychic","Bug","Rock","Ghost","Dragon","Dark","Steel","Fairy","Stellar"];
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = types.map(t => `<option value="${t}"${t === currentTera ? " selected" : ""}>${t}</option>`).join("");
}

function populateAbilitySelect(selectId, allAbilities, top) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const options = [...new Set([top, ...allAbilities].filter(Boolean))];
  sel.innerHTML = options.map(a => `<option value="${a}">${a}</option>`).join("");
  sel.appendChild(Object.assign(document.createElement("option"), { value: "__custom__", textContent: "Other…" }));
}

function populateItemSelect(selectId, allItems, top) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const options = ["None", ...new Set([top, ...allItems].filter(a => a && a.toLowerCase() !== "none"))];
  sel.innerHTML = options.map(a => `<option value="${a}"${a === top ? " selected" : ""}>${a}</option>`).join("");
  if (!top) sel.value = "None";
  sel.appendChild(Object.assign(document.createElement("option"), { value: "__custom__", textContent: "Other…" }));
}

function populatePresetSelect(data) {
  const sel = document.getElementById("calc-attacker-preset");
  if (!sel) return;
  sel.innerHTML = "";
  data.spreads.forEach((spread, idx) => {
    const pct = (spread.weight * 100).toFixed(1);
    sel.appendChild(Object.assign(document.createElement("option"), {
      value: idx,
      textContent: `${spread.spread} (${pct}%)`,
    }));
  });
  if (!data.spreads.length) sel.innerHTML = '<option value="">No spread data</option>';
}

// ─── CUSTOM AUTOCOMPLETE ──────────────────────────────────────────────────────
function initCalcAutocomplete(inputId, dropdownId, onSelect) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;
  let activeIdx = -1;

  function showItems(items) {
    activeIdx = -1;
    if (!items.length) { dropdown.style.display = "none"; return; }
    dropdown.innerHTML = items.map((n, i) =>
      `<div class="calc-ac-item" data-idx="${i}" data-name="${n}">${n}</div>`
    ).join("");
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
    const val = input.value.trim().toLowerCase();
    if (!val || !window.calcPokemonNames) { dropdown.style.display = "none"; return; }
    const starts = window.calcPokemonNames.filter(n => n.toLowerCase().startsWith(val));
    const contains = window.calcPokemonNames.filter(n => !n.toLowerCase().startsWith(val) && n.toLowerCase().includes(val));
    showItems([...starts, ...contains].slice(0, 12));
  });

  input.addEventListener("keydown", e => {
    const items = dropdown.querySelectorAll(".calc-ac-item");
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIdx + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeIdx - 1); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); choose(items[activeIdx].dataset.name); }
    else if (e.key === "Escape") { dropdown.style.display = "none"; }
  });

  input.addEventListener("blur", () => setTimeout(() => { dropdown.style.display = "none"; }, 150));
  input.addEventListener("focus", () => { if (input.value.trim()) input.dispatchEvent(new Event("input")); });
}

function typeBadgeHTML(type) {
  const color = TYPE_COLORS[type] || "#888";
  const dark = ["Electric","Ice","Ground","Steel","Fairy","Normal","Dragon"].includes(type);
  return `<span class="calc-type-badge" style="background:${color};color:${dark?"#333":"#fff"}">${type}</span>`;
}

// ─── MOVE LIST RENDERING ──────────────────────────────────────────────────────
function renderAttackerMoveList() {
  const { attacker, defender, selectedMove, field } = calcState;
  const container = document.getElementById("calc-atk-movelist");
  if (!container || !attacker) return;

  const damaging = (attacker.topMoves || []).filter(m => m.bp > 0 && m.category !== "Status").slice(0, 4);
  const status   = (attacker.topMoves || []).filter(m => !m.bp || m.category === "Status").slice(0, 2);
  const custom   = attacker.customMoves || [];
  const allMoves = [...damaging, ...status, ...custom];

  container.innerHTML = allMoves.map(m => {
    const isSel = selectedMove?.source === "attacker" && selectedMove?.move?.id === m.id;
    let dmgLabel = "";
    if (defender && m.bp > 0 && m.category !== "Status") {
      dmgLabel = `<span class="move-dmg-badge">${quickDamageSummary(attacker, m, defender, field)}</span>`;
    }
    const catLabel = m.category === "Physical" ? "Phy" : m.category === "Special" ? "Spc" : "Sta";
    return `<div class="calc-move-btn${isSel ? " selected" : ""}" data-moveid="${m.id}" onclick="onMoveClick('${m.id}', true)">
      <span class="move-name">${m.name}</span>${m.id.startsWith("custom") ? " <span style='color:#555;font-size:10px'>(custom)</span>" : ""}
      ${typeBadgeHTML(m.type)}
      <span class="move-meta">${m.bp > 0 ? m.bp+" BP" : "—"} ${catLabel}</span>
      ${dmgLabel}
    </div>`;
  }).join("") || '<div style="color:#555;font-size:12px">No moves</div>';
}

function renderDefenderMoveList() {
  const { attacker, defender, selectedMove, field } = calcState;
  const container = document.getElementById("calc-def-movelist");
  if (!container || !defender) return;

  const damaging = (defender.topMoves || []).filter(m => m.bp > 0 && m.category !== "Status").slice(0, 4);
  const custom   = defender.customMoves || [];
  const allMoves = [...damaging, ...custom];

  container.innerHTML = allMoves.map(m => {
    const isSel = selectedMove?.source === "defender" && selectedMove?.move?.id === m.id;
    let dmgLabel = "";
    if (attacker) {
      dmgLabel = `<span class="move-dmg-badge">${quickReverseSummary(defender, m, attacker, field)}</span>`;
    }
    const catLabel = m.category === "Physical" ? "Phy" : "Spc";
    return `<div class="calc-move-btn${isSel ? " selected" : ""}" data-moveid="${m.id}" onclick="onMoveClick('${m.id}', false)">
      <span class="move-name">${m.name}</span>${m.id.startsWith("custom") ? " <span style='color:#555;font-size:10px'>(custom)</span>" : ""}
      ${typeBadgeHTML(m.type)}
      <span class="move-meta">${m.bp > 0 ? m.bp+" BP" : "—"} ${catLabel}</span>
      ${dmgLabel}
    </div>`;
  }).join("") || '<div style="color:#555;font-size:12px">No moves</div>';
}

// ─── RESULTS RENDERING ────────────────────────────────────────────────────────
const TIER_CONFIG = {
  frail:   { label: "Frail",   color: "#ef9a9a", bg: "#ef9a9a20" },
  average: { label: "Average", color: "#ffd54f", bg: "#ffd54f20" },
  bulky:   { label: "Bulky",   color: "#a5d6a7", bg: "#a5d6a720" },
};

// Returns HTML of factor chips affecting the damage calculation
function renderFactorChips(atkObj, move, defObj, field) {
  const chips = [];
  const isPhys = move.category === "Physical";
  const typeEff = getTypeEffectiveness(move.type, defObj.types || [], defObj.tera);

  if (typeEff === 4) chips.push(["4× effective", "#4caf50"]);
  else if (typeEff === 2) chips.push(["2× effective", "#66bb6a"]);
  else if (typeEff === 0.5) chips.push(["½× effective", "#ef9a9a"]);
  else if (typeEff === 0.25) chips.push(["¼× effective", "#ef5350"]);

  const stabMod = getSTABMod(atkObj.types || [], atkObj.ability, move.type, atkObj.tera);
  if (stabMod === 0x2400) chips.push(["Adaptability STAB ×2.25", "#ffd54f"]);
  else if (stabMod === 0x2000) chips.push(["STAB ×2", "#ffd54f"]);
  else if (stabMod === 0x1800) chips.push(["STAB ×1.5", "#ffd54f"]);
  else if (stabMod > 0x1000) chips.push(["STAB", "#ffd54f"]);

  if (move.bp <= 60 && atkObj.ability === "Technician") chips.push(["Technician ×1.5 BP", "#b0bec5"]);
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
  if (tboost && tboost === move.type) chips.push([`${atkObj.item} ×1.2`, "#ccc"]);

  const da = defObj.ability || "";
  if ((da === "Filter" || da === "Solid Rock" || da === "Prism Armor") && typeEff > 1) chips.push([`${da} ×0.75`, "#ef9a9a"]);
  if (da === "Multiscale" || da === "Shadow Shield") chips.push([`${da} ×0.5`, "#ef9a9a"]);
  if (da === "Thick Fat" && (move.type === "Fire" || move.type === "Ice")) chips.push(["Thick Fat ×0.5", "#ef9a9a"]);
  if (da === "Ice Scales" && !isPhys) chips.push(["Ice Scales ×0.5", "#ef9a9a"]);
  if (da === "Heatproof" && move.type === "Fire") chips.push(["Heatproof ×0.5", "#ef9a9a"]);
  const berry = RESIST_BERRIES[defObj.item || ""];
  if (berry && berry === move.type && typeEff > 1) chips.push([`${defObj.item} ×0.5`, "#ef9a9a"]);
  if ((defObj.item || "") === "Assault Vest" && !isPhys) chips.push(["Assault Vest ×1.5 SpD", "#ef9a9a"]);

  const sun = field.weather === "Sun" || field.weather === "Harsh Sunshine";
  const rain = field.weather === "Rain" || field.weather === "Heavy Rain";
  if (sun && move.type === "Fire") chips.push(["Sun ×1.5", "#f08030"]);
  if (sun && move.type === "Water") chips.push(["Sun ×0.5", "#f08030"]);
  if (rain && move.type === "Water") chips.push(["Rain ×1.5", "#6890f0"]);
  if (rain && move.type === "Fire") chips.push(["Rain ×0.5", "#6890f0"]);
  if (field.weather === "Sand" && atkObj.ability === "Sand Force" && ["Ground","Rock","Steel"].includes(move.type)) chips.push(["Sand Force ×1.3 BP", "#b0a070"]);
  if (field.terrain === "Electric" && move.type === "Electric") chips.push(["Elec Terrain ×1.3 BP", "#f8d030"]);
  if (field.terrain === "Grassy" && move.type === "Grass") chips.push(["Grassy Terrain ×1.3 BP", "#78c850"]);
  if (field.terrain === "Psychic" && move.type === "Psychic") chips.push(["Psychic Terrain ×1.3 BP", "#f85888"]);
  if (field.terrain === "Misty" && move.type === "Dragon") chips.push(["Misty Terrain ×0.5 BP", "#98d8d8"]);

  if (!field.isCritical) {
    if (field.isAuroraVeil) chips.push(["Aurora Veil ÷2", "#90caf9"]);
    else if (field.isReflect && isPhys) chips.push(["Reflect ÷2", "#90caf9"]);
    else if (field.isLightScreen && !isPhys) chips.push(["Light Screen ÷2", "#f8d030"]);
  }
  if (move.isSpread && field.format !== "Singles") chips.push(["Spread ×0.75", "#aaa"]);
  if (field.isHelpingHand) chips.push(["Helping Hand ×1.5", "#a5d6a7"]);
  if (field.isCritical) chips.push(["Crit ×1.5", "#ef9a9a"]);
  if (field.isBurned && isPhys && atkObj.ability !== "Guts") chips.push(["Burned ÷2", "#f08030"]);

  const atkBoost = (atkObj.boosts || {})[isPhys ? "atk" : "spa"] || 0;
  if (atkBoost) {
    const m = atkBoost >= 0 ? `×${(2+atkBoost)/2}` : `÷${(2+Math.abs(atkBoost))/2}`;
    chips.push([`${atkBoost>0?"+":""}${atkBoost} ${isPhys?"Atk":"SpA"} ${m}`, atkBoost > 0 ? "#a5d6a7" : "#ef9a9a"]);
  }
  const defBoost = (defObj.boosts || {})[isPhys ? "def" : "spd"] || 0;
  if (defBoost) {
    const m = defBoost >= 0 ? `×${(2+defBoost)/2}` : `÷${(2+Math.abs(defBoost))/2}`;
    chips.push([`Opp ${defBoost>0?"+":""}${defBoost} ${isPhys?"Def":"SpD"} ${m}`, defBoost > 0 ? "#ef9a9a" : "#a5d6a7"]);
  }

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
function buildCalcString(atkObj, move, rolls, hp, defObj, field, useEVNotation, defEvStr, overridePcts) {
  if (!rolls || !rolls.length || !hp) return "";
  const isPhys = move.category === "Physical";
  const statKey = isPhys ? "atk" : "spa";
  const statLabel = isPhys ? "Atk" : "SpA";
  const typeEff = getTypeEffectiveness(move.type, defObj.types || [], defObj.tera);

  // Boost stage prefix
  const atkBoost = (atkObj.boosts || {})[statKey] || 0;
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
  const itemPart = doesAtkItemBoostDamage(atkObj.item, move, isPhys, typeEff) ? `${atkObj.item} ` : "";

  // Defender boost on defense stat
  const defBoostKey = isPhys ? "def" : "spd";
  const defBoostLabel = isPhys ? "Def" : "SpD";
  const defBoost = (defObj.boosts || {})[defBoostKey] || 0;
  const defBoostPart = defBoost !== 0 ? ` (${defBoost > 0 ? "+" : ""}${defBoost} ${defBoostLabel})` : "";

  // Defender EVs (only in reverse calc where user's Pokemon is the defender)
  const defEvPart = defEvStr ? `${defEvStr} ` : "";

  // Defender item: only show if it reduces incoming damage
  const defItemPart = doesDefItemReduceDamage(defObj.item, move, isPhys, typeEff) ? `${defObj.item} ` : "";

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
  else if (field.weather === "Snow" || field.weather === "Hail") residual = " after hail damage";

  const str = `${boostPart}${evPart}${itemPart}${atkObj.name} ${hhPart}${move.name} vs. ${defEvPart}${defItemPart}${defObj.name}${defBoostPart}${screenPart}: (${minPct} - ${maxPct}%) -- ${koText}${residual}`;
  return `<div class="calc-string"><code>${str}</code><button class="calc-copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(str)})">Copy</button></div>`;
}

function renderForwardResults(koDist, move, attacker, defenderData, field) {
  if (!koDist) return `<div style="color:#666;padding:6px 0">No data.</div>`;
  const moveName = move.name, defenderName = defenderData.name;
  if (koDist.immune) return `<div style="color:#666;padding:6px 0"><strong>${moveName}</strong> → No effect (${defenderName} is immune)</div>`;

  const defLabel = koDist.isPhys ? "Def" : "SpD";
  let html = `<div class="calc-result-header">${moveName} → ${defenderName}</div>`;
  html += renderFactorChips(attacker, move, defenderData, field);

  const tierNames = ["frail", "average", "bulky"];
  let hasTiers = false;
  let w2 = 0, w3 = 0, wTotal = 0;

  for (const name of tierNames) {
    const tier = koDist.tiers[name];
    if (!tier || !tier.reprRolls) continue;
    hasTiers = true;
    const cfg = TIER_CONFIG[name];
    const rolls = tier.reprRolls, hp = tier.reprHP;
    const minD = rolls[0], maxD = rolls[rolls.length - 1];
    const minP = (minD / hp * 100).toFixed(1);
    const maxP = (maxD / hp * 100).toFixed(1);
    const pct = (tier.weight * 100).toFixed(0);
    const p2 = calcNHKOChance(rolls, hp, 2);
    const p3 = calcNHKOChance(rolls, hp, 3);
    w2 += tier.weight * p2; w3 += tier.weight * p3; wTotal += tier.weight;
    html += `<div class="calc-tier-row" style="border-left:3px solid ${cfg.color}">
      <div class="calc-tier-left">
        <span class="calc-tier-badge" style="background:${cfg.bg};color:${cfg.color}">${cfg.label}</span>
        <span class="calc-tier-stats">HP ${tier.hp} / ${defLabel} ${tier.defStat}</span>
        <span class="calc-tier-freq">${pct}% of sets</span>
      </div>
      <div class="calc-tier-right">
        <span class="calc-tier-dmg">${minD}–${maxD} <strong>(${minP}–${maxP}%)</strong></span>
        ${renderNHKORow(rolls, hp)}
      </div>
    </div>`;
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
  html += `<div class="calc-overall-ko"><strong>Weighted overall:</strong> ${ovHTML} <span style="color:#555;font-size:11px">across all usage sets</span></div>`;

  // Calc string: overall damage range (min of all tier mins → max of all tier maxes)
  const reprTier = koDist.tiers.average || koDist.tiers.frail || koDist.tiers.bulky;
  if (reprTier?.reprRolls) {
    let allMinPct = Infinity, allMaxPct = -Infinity;
    for (const name of tierNames) {
      const t = koDist.tiers[name];
      if (!t?.reprRolls || !t.reprHP) continue;
      allMinPct = Math.min(allMinPct, t.reprRolls[0] / t.reprHP * 100);
      allMaxPct = Math.max(allMaxPct, t.reprRolls[t.reprRolls.length - 1] / t.reprHP * 100);
    }
    const overridePcts = {
      o1: koDist.koPct || 0,
      o2: (koDist.koPct > 0) ? 0 : (overall2 || 0),
      o3: (koDist.koPct > 0 || overall2 > 0) ? 0 : (overall3 || 0),
      minPct: isFinite(allMinPct) ? allMinPct.toFixed(1) : null,
      maxPct: isFinite(allMaxPct) ? allMaxPct.toFixed(1) : null,
    };
    html += buildCalcString(attacker, move, reprTier.reprRolls, reprTier.reprHP, defenderData, field, true, null, overridePcts);
  }
  return html;
}

// Renders a single-result block (reverse: defender's move vs attacker's single HP pool)
function renderSingleResult(result, move, atkObj, defObj, field) {
  const hp = defObj.customStats?.hp || 1;
  let html = `<div class="calc-result-header">${atkObj.name}'s ${move.name} → ${defObj.name}</div>`;
  html += renderFactorChips(atkObj, move, defObj, field);
  if (!result || result.immune) {
    html += `<div style="color:#666;padding:6px 0">No effect / immune</div>`;
    return html;
  }
  const rolls = result.rolls;
  const minD = rolls[0], maxD = rolls[rolls.length - 1];
  html += `<div class="calc-tier-row" style="border-left:3px solid #a5d6a7">
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
  html += buildCalcString(atkObj, move, rolls, hp, defObj, field, false, defEvStr);
  return html;
}

// ─── SPEED COMPARISON ────────────────────────────────────────────────────────
function defSpeedFromSpread(spreadStr, baseSpe, level, isChampions) {
  const [nature, evStr] = spreadStr.split(":");
  const speEV = evStr ? (parseInt(evStr.split("/")[5]) || 0) : 0;
  const natMult = (NATURES[nature] || {}).spe || 1;
  if (isChampions) return Math.floor((baseSpe + speEV + 20) * natMult);
  return Math.floor((Math.floor((2 * baseSpe + 31 + Math.floor(speEV / 4)) * level / 100) + 5) * natMult);
}

function computeSpeedComparison() {
  const field = calcState.field;
  const baseSpe = parseInt(document.getElementById("calc-atk-final-spe")?.textContent) || 0;
  const userSpe = baseSpe * (field.isAtkTailwind ? 2 : 1);
  const def = calcState.defender;
  if (!baseSpe || !def?.spreads?.length || !def?.baseStats?.spe) return null;
  let totalW = 0, outW = 0, tieW = 0;
  for (const s of def.spreads) {
    const defBaseSpe = defSpeedFromSpread(s.spread, def.baseStats.spe, def.level, def.isChampions);
    const defSpe = defBaseSpe * (field.isDefTailwind ? 2 : 1);
    const w = s.usage || 1;
    totalW += w;
    if (userSpe > defSpe) outW += w;
    else if (userSpe === defSpe) tieW += w;
  }
  if (!totalW) return null;
  return {
    outPct: (outW / totalW) * 100,
    tiePct: (tieW / totalW) * 100,
    sloPct: ((totalW - outW - tieW) / totalW) * 100,
    userSpe, baseSpe,
    atkTailwind: field.isAtkTailwind, defTailwind: field.isDefTailwind,
    defName: def.name,
  };
}

// ─── RUN CALC ────────────────────────────────────────────────────────────────
function runCalc() {
  const resultsEl = document.getElementById("calc-results");
  if (!resultsEl) return;

  renderAttackerMoveList();
  renderDefenderMoveList();

  const { attacker, defender, selectedMove, field } = calcState;

  // Speed comparison display
  const scEl = document.getElementById("calc-speed-comp");
  if (scEl) {
    const sc = (attacker && defender) ? computeSpeedComparison() : null;
    if (sc) {
      const outColor = sc.outPct >= 75 ? "#a5d6a7" : sc.outPct >= 40 ? "#ffd54f" : "#ef9a9a";
      const tieHtml = sc.tiePct >= 1 ? ` | <span style="color:#ffd54f">Ties ${sc.tiePct.toFixed(0)}%</span>` : "";
      const sloHtml = ` | <span style="color:#ef9a9a">Slower ${sc.sloPct.toFixed(0)}%</span>`;
      const atkTwHtml = sc.atkTailwind ? ` <span style="color:#90caf9">TW</span>` : "";
      const defTwHtml = sc.defTailwind ? ` <span style="color:#90caf9">TW</span>` : "";
      scEl.innerHTML = `<span style="color:#666">Spe ${sc.userSpe}${atkTwHtml} vs ${sc.defName}${defTwHtml} — </span><span style="color:${outColor}">Outspeeds ${sc.outPct.toFixed(0)}%</span>${tieHtml}${sloHtml} <span style="color:#444">of sets</span>`;
    } else {
      scEl.innerHTML = "";
    }
  }

  // Update move controls bar
  const ctrlEl = document.getElementById("calc-move-controls");
  const lblEl  = document.getElementById("calc-selected-move-label");
  const critEl = document.getElementById("calc-move-crit");
  if (ctrlEl) ctrlEl.style.display = selectedMove ? "flex" : "none";
  if (selectedMove && lblEl) {
    const src = selectedMove.source === "attacker" ? attacker?.name : defender?.name;
    lblEl.textContent = `${src || "?"}'s ${selectedMove.move.name}`;
  }
  if (critEl && selectedMove) critEl.checked = selectedMove.isCrit;

  if (!attacker || !defender) {
    resultsEl.innerHTML = `<div style="color:#888;padding:10px 0;">Select both a Pokémon and an opponent to see results.</div>`;
    return;
  }
  if (!selectedMove) {
    resultsEl.innerHTML = `<div style="color:#888;padding:10px 0;">Click a move from either side to see the damage breakdown.</div>`;
    return;
  }

  const { source, move, isCrit } = selectedMove;
  const effectiveField = { ...field, isCritical: isCrit };

  let html = "";
  if (source === "attacker") {
    if (!move.bp || move.category === "Status") {
      html = `<div class="calc-result-section"><div style="color:#888">${move.name} is a status move — no damage to calculate.</div></div>`;
    } else {
      const koDist = calcKODistribution(attacker, move, defender, effectiveField);
      html = `<div class="calc-result-section">${renderForwardResults(koDist, move, attacker, defender, effectiveField)}</div>`;
    }
  } else {
    if (!move.bp || move.category === "Status") {
      html = `<div class="calc-result-section"><div style="color:#888">${move.name} is a status move — no damage to calculate.</div></div>`;
    } else {
      const defAsAttacker = {
        name: defender.name, types: defender.types, ability: defender.ability,
        item: defender.item, tera: defender.tera, level: defender.level,
        customStats: defender.averageStats, boosts: defender.boosts || {},
      };
      const result = calcDamageRolls(defAsAttacker, move, attacker.customStats,
        attacker.types, attacker.tera, attacker.ability, attacker.item, effectiveField, attacker.boosts);
      html = `<div class="calc-result-section">${renderSingleResult(result, move, defAsAttacker, attacker, effectiveField)}</div>`;
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
  const prevCrit = calcState.selectedMove?.isCrit || false;
  calcState.selectedMove = move ? { source, move, isCrit: prevCrit } : null;
  runCalc();
}

function toggleMoveCrit() {
  if (!calcState.selectedMove) return;
  calcState.selectedMove.isCrit = document.getElementById("calc-move-crit")?.checked || false;
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
        <span style="color:#555;font-size:10px;margin-left:4px">${m.bp > 0 ? m.bp+"BP " : ""}${m.category}</span>
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

function onAttackerPresetChange() {
  const sel = document.getElementById("calc-attacker-preset");
  if (!sel || !calcState.attacker) return;
  const idx = parseInt(sel.value);
  if (isNaN(idx)) return;
  const spread = calcState.attacker.spreads?.[idx];
  if (!spread) return;
  const [nature, evStr] = spread.spread.split(":");
  const evs = evStr ? evStr.split("/").map(Number) : Array(6).fill(0);
  fillEVTable(nature, evs);
  const noteEl = document.getElementById("calc-attacker-spread-note");
  if (noteEl) noteEl.textContent = spread.spread;
  calcState.attacker.customStats = computeStatsFromInputs();
  runCalc();
}

function onAttackerStatChange() {
  if (!calcState.attacker) return;
  calcState.attacker.customStats = computeStatsFromInputs();
  runCalc();
}

async function onAttackerChange() {
  const input = document.getElementById("calc-attacker-input")?.value.trim();
  if (!input) return;
  const noteEl = document.getElementById("calc-attacker-spread-note");
  if (noteEl) noteEl.textContent = "Loading…";

  const data = await fetchCalcData(input);
  if (!data) {
    if (noteEl) noteEl.textContent = "Not found in this format.";
    calcState.attacker = null;
    return;
  }

  populateTeraSelect("calc-attacker-tera", "None");
  populateAbilitySelect("calc-attacker-ability", data.allAbilities, data.topAbility);
  populateItemSelect("calc-attacker-item", data.allItems, data.topItem);
  populatePresetSelect(data);

  // Update EV/SP column label
  const evLabel = document.getElementById("calc-ev-col-label");
  if (evLabel) evLabel.textContent = data.isChampions ? "SP" : "EV";

  // Store attacker state (needed by computeStatsFromInputs)
  const firstDamaging = data.topMoves.find(m => m.bp > 0 && m.category !== "Status");
  calcState.attacker = {
    name: data.name, types: data.types, level: data.level,
    isChampions: data.isChampions, baseStats: data.baseStats || {},
    ability: data.topAbility || "", item: data.topItem || "", tera: "None",
    customStats: {}, spreads: data.spreads, topMoves: data.topMoves,
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }, customMoves: [],
  };
  // Reset boost selects
  ["atk","def","spa","spd","spe"].forEach(k => {
    const el = document.getElementById(`calc-boost-${k}`);
    if (el) { el.value = "0"; applyBoostColor(el); }
  });

  // Populate base stat column
  setBaseStatDisplay(data.baseStats || {});

  // Load top spread into EV table
  const firstSpread = data.spreads[0];
  if (firstSpread) {
    const [nature, evStr] = firstSpread.spread.split(":");
    const evs = evStr ? evStr.split("/").map(Number) : Array(6).fill(0);
    fillEVTable(nature, evs);
    if (noteEl) noteEl.textContent = firstSpread.spread;
  } else {
    fillEVTable("Hardy", Array(6).fill(0));
    if (noteEl) noteEl.textContent = "";
  }

  calcState.attacker.customStats = computeStatsFromInputs() || data.averageStats;
  if (firstDamaging) calcState.selectedMove = { source: "attacker", move: firstDamaging, isCrit: false };
  runCalc();
}

async function onDefenderChange() {
  const input = document.getElementById("calc-defender-input")?.value.trim();
  if (!input) return;
  const statsEl = document.getElementById("calc-defender-stats");
  if (statsEl) statsEl.textContent = "Loading…";

  const data = await fetchCalcData(input);
  if (!data) {
    if (statsEl) statsEl.textContent = "Not found in this format.";
    calcState.defender = null;
    return;
  }

  populateTeraSelect("calc-defender-tera", "None");
  populateAbilitySelect("calc-defender-ability", data.allAbilities, data.topAbility);
  populateItemSelect("calc-defender-item", data.allItems, data.topItem);

  const s = data.averageStats;
  if (statsEl) statsEl.textContent =
    `HP ${s.hp} | Atk ${s.atk} | Def ${s.def} | SpA ${s.spa} | SpD ${s.spd} | Spe ${s.spe}`;

  calcState.defender = {
    name: data.name, types: data.types, level: data.level,
    isChampions: data.isChampions || false, baseStats: data.baseStats || {},
    spreads: data.spreads || [],
    ability: data.topAbility || "", item: data.topItem || "", tera: "None",
    averageStats: data.averageStats,
    defGroups: data.defGroups || [], spdGroups: data.spdGroups || [],
    atkGroups: data.atkGroups || [], spaGroups: data.spaGroups || [],
    defTiers: data.defTiers || {}, spdTiers: data.spdTiers || {},
    topMoves: data.topMoves,
    boosts: { atk: 0, def: 0, spa: 0, spd: 0 }, customMoves: [],
  };
  // Reset opponent boost selects
  ["atk","spa","def","spd"].forEach(k => {
    const el = document.getElementById(`calc-boost-opp-${k}`);
    if (el) { el.value = "0"; applyBoostColor(el); }
  });
  runCalc();
}

function _handleCustomSelect(sel, stateProp, subProp) {
  if (!calcState[stateProp]) return;
  if (sel.value === "__custom__") {
    const v = prompt("Enter name:");
    if (v) calcState[stateProp][subProp] = v;
    else return;
  } else {
    calcState[stateProp][subProp] = sel.value === "None" ? "" : sel.value;
  }
  runCalc();
}

function onAttackerAbilityChange() { _handleCustomSelect(document.getElementById("calc-attacker-ability"), "attacker", "ability"); }
function onAttackerItemChange()    { _handleCustomSelect(document.getElementById("calc-attacker-item"), "attacker", "item"); }
function onAttackerTeraChange()    { if (calcState.attacker) { calcState.attacker.tera = document.getElementById("calc-attacker-tera")?.value || "None"; runCalc(); } }
function onDefenderAbilityChange() { _handleCustomSelect(document.getElementById("calc-defender-ability"), "defender", "ability"); }
function onDefenderItemChange()    { _handleCustomSelect(document.getElementById("calc-defender-item"), "defender", "item"); }
function onDefenderTeraChange()    { if (calcState.defender) { calcState.defender.tera = document.getElementById("calc-defender-tera")?.value || "None"; runCalc(); } }

function onFieldChange() {
  calcState.field.format = document.getElementById("calc-field-format")?.value || "Doubles";
  calcState.field.weather = document.getElementById("calc-field-weather")?.value || "None";
  calcState.field.terrain = document.getElementById("calc-field-terrain")?.value || "None";
  calcState.field.isHelpingHand = document.getElementById("calc-helpinghand")?.checked || false;
  calcState.field.isAtkTailwind = document.getElementById("calc-atk-tailwind")?.checked || false;
  calcState.field.isBurned = document.getElementById("calc-burned")?.checked || false;
  calcState.field.isReflect = document.getElementById("calc-reflect")?.checked || false;
  calcState.field.isLightScreen = document.getElementById("calc-lightscreen")?.checked || false;
  calcState.field.isAuroraVeil = document.getElementById("calc-auroraveil")?.checked || false;
  calcState.field.isDefTailwind = document.getElementById("calc-def-tailwind")?.checked || false;
  calcState.field.isFriendGuard = document.getElementById("calc-friendguard")?.checked || false;
  runCalc();
}

// ─── TAB SWITCHING ────────────────────────────────────────────────────────────
function switchTab(tab) {
  const usagePanel = document.getElementById("usage-panel");
  const calcPanel = document.getElementById("calc-panel");
  const usageBtn = document.getElementById("tab-usage-btn");
  const calcBtn = document.getElementById("tab-calc-btn");
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
    if (!calcState.attacker && window.currentPokemonName) {
      const atkInput = document.getElementById("calc-attacker-input");
      if (atkInput && !atkInput.value) {
        atkInput.value = window.currentPokemonName;
        onAttackerChange();
      }
    }
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
function initBoostSelects() {
  const opts = Array.from({length:13}, (_,i) => {
    const v = i - 6;
    return `<option value="${v}"${v===0?" selected":""}>${v>0?"+":""}${v}</option>`;
  }).join("");
  ["calc-boost-atk","calc-boost-def","calc-boost-spa","calc-boost-spd",
   "calc-boost-opp-atk","calc-boost-opp-spa","calc-boost-opp-def","calc-boost-opp-spd"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("activeTab") === "calc") switchTab("calc");

  initCalcAutocomplete("calc-attacker-input", "calc-attacker-dropdown", () => onAttackerChange());
  initCalcAutocomplete("calc-defender-input", "calc-defender-dropdown", () => onDefenderChange());
  initBoostSelects();

  const fmtIsDoubles = window.selectedFormat && (
    window.selectedFormat.includes("vgc") || window.selectedFormat.includes("doubl") ||
    window.selectedFormat.includes("champions") || window.selectedFormat.includes("bss")
  );
  calcState.field.format = fmtIsDoubles ? "Doubles" : "Singles";
  const fmtSel = document.getElementById("calc-field-format");
  if (fmtSel) fmtSel.value = calcState.field.format;
});
