/* Draft Scout — movepool coverage and Speed breakpoints across two rosters.
 *
 * State is deliberately small: two lists of species ids, a set of selected
 * moves/abilities, and the format pickers. All of it lives in the URL query
 * string so a scouting page can be pasted to a teammate, and every change
 * re-queries /tools/api/draft/scout rather than recomputing locally — the
 * legality and Speed maths belong on the server where they are tested.
 */

var t = window.msT || function (s) { return s; };

const BOOT = window.DRAFT_BOOT || {};

/* The roster depends on the selected format: Champions, National Dex and the
 * SV dex list genuinely different Pokemon (Runerigus and Mr. Rime exist in
 * two of the three), so this is reloaded whenever the format implies a
 * different rule set rather than being fixed at page load. */
let SPECIES = BOOT.species || [];
let BY_ID = new Map(SPECIES.map((s) => [s.id, s]));
let activeDex = BOOT.dex || "gen9";

function setSpecies(list) {
  SPECIES = list || [];
  BY_ID = new Map(SPECIES.map((s) => [s.id, s]));
}

function dexForFormat(code) {
  const c = (code || "").toLowerCase();
  if (c.includes("champions")) return "champions";
  if (c.includes("nationaldex") || c.includes("natdex")) return "natdex";
  return "gen9";
}

/* Returns a promise so callers can refresh only once the roster is in hand;
 * resolving names against the previous dex would drop anything the new one
 * added. */
function ensureDex(code) {
  const want = dexForFormat(code);
  if (want === activeDex) return Promise.resolve(false);
  return fetch("/tools/api/draft/species?dex=" + encodeURIComponent(want))
    .then((r) => r.json())
    .then((res) => {
      if (res.error) return false;
      activeDex = res.dex;
      setSpecies(res.species);
      // Drop anything the new rule set does not have, and say so rather than
      // letting it vanish silently.
      const dropped = [];
      ["mine", "theirs"].forEach((side) => {
        const kept = state[side].filter((id) => BY_ID.has(id));
        state[side]
          .filter((id) => !BY_ID.has(id))
          .forEach((id) => dropped.push(id));
        state[side] = kept;
      });
      if (dropped.length) {
        $("dr-warn").innerHTML = `<div class="dr-warn">${t(
          "Not in this format's dex, removed:"
        )} ${esc(dropped.join(", "))}</div>`;
      }
      return true;
    })
    .catch(() => false);
}

const state = {
  mine: [],
  theirs: [],
  moves: [],       // move ids the user picked by hand
  abilities: [],   // ability ids the user picked by hand
  presets: [],     // preset ids toggled on
  format: BOOT.format,
  rating: BOOT.rating,
  style: "doubles",
  // Which modifiers to COST OUT, on each side. Not assumptions -- each one
  // turned on adds a column showing what it would buy. Nature is deliberately
  // absent: it is an output of the requirement grid, not an input.
  myMods: [],
  theirMods: [],
  // "move" lists each queried move with who has it (the scouting question),
  // "pokemon" lists each Pokemon with what it brings, "grid" is the old
  // matrix. The matrix is unreadable once a preset adds a dozen columns, so
  // it is no longer the default.
  listBy: "move",
  // Everything works without the advanced controls; they are a second
  // question you ask once the first is answered. Remembered per browser so a
  // returning user is not re-simplified, but a shared link's ?advanced= wins
  // so the recipient sees what the sender meant them to see.
  advanced: false,
};

/* Presets kept in the simple view: the ones people actually open the tool to
 * check. The rest stay one click away rather than crowding the default. */
const COMMON_PRESETS = new Set([
  "fake_out", "speed_control", "priority", "screens", "redirection",
  "disruption",
]);
const COMMON_ABILITY_PRESETS = new Set(["intimidate_family", "speed_abilities"]);

function loadAdvancedPref() {
  try {
    return localStorage.getItem("munchstats.draft.advanced") === "1";
  } catch (e) {
    return false; // private windows and blocked site data throw here
  }
}
function saveAdvancedPref(on) {
  try {
    localStorage.setItem("munchstats.draft.advanced", on ? "1" : "0");
  } catch (e) {
    /* not important enough to bother the user about */
  }
}

let lastResult = null;
/* The columns actually shown: the server's expansion of presets plus the
 * hand-picked moves. Kept apart from state.moves so toggling a preset off
 * removes only its own columns and leaves hand-picked moves alone. */
let columns = [];

/* ─── helpers ─────────────────────────────────────────────────────────── */

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Icon sheet: 12 columns of 40x30 (get_pokemon_sprite returns divmod(n, 12)).
 * The small variant renders the sheet at 360px instead of 480px, so both axes
 * scale by 0.75 — a cell is 30 x 22.5. Using 24 for the row height drifts
 * 1.5px per row and lands on the wrong Pokemon further down the sheet. */
const SPRITE_W = 40;
const SPRITE_H = 30;
const SPRITE_SM_SCALE = 0.75;

function spriteStyle(sprite) {
  const s = sprite || [0, 0];
  return `background-position:-${s[1] * SPRITE_W}px -${s[0] * SPRITE_H}px`;
}
function spriteStyleSm(sprite) {
  const s = sprite || [0, 0];
  return (
    `background-position:-${s[1] * SPRITE_W * SPRITE_SM_SCALE}px ` +
    `-${s[0] * SPRITE_H * SPRITE_SM_SCALE}px`
  );
}

function nameOf(id) {
  const s = BY_ID.get(id);
  return s ? s.name : id;
}

/* Link a Pokemon through to its usage page for the format on screen. The tool
 * answers "who has Fake Out"; the natural next question is "what else does
 * that thing run", and that lives on the usage page. */
function usageHref(name) {
  const base = (lastResult && lastResult.usageBase) || BOOT.usageBase;
  return base ? base + encodeURIComponent(name) : null;
}

function usageLink(name, extraClass) {
  const href = usageHref(name);
  const cls = extraClass ? ` class="${extraClass}"` : "";
  return href
    ? `<a href="${esc(href)}"${cls} title="${t("Usage stats for")} ${esc(name)}">${esc(name)}</a>`
    : `<span${cls}>${esc(name)}</span>`;
}

/* A learnset method string is "M", "L30" or a comma list of them. Rendered
 * long-hand because "E" on its own means nothing to a reader. */
const METHOD_WORD = { M: "TM", L: "Lv", E: "Egg", S: "Event", R: "Reminder" };
function methodText(method) {
  if (!method) return "";
  return method
    .split(",")
    .map((tok) => {
      const word = METHOD_WORD[tok[0]] || tok[0];
      const num = tok.slice(1);
      return num ? word + " " + num : word;
    })
    .join(", ");
}

/* ─── URL state ───────────────────────────────────────────────────────── */

function readUrl() {
  const q = new URLSearchParams(location.search);
  const list = (k) => (q.get(k) || "").split(",").filter(Boolean);
  state.mine = list("mine").filter((id) => BY_ID.has(id));
  state.theirs = list("theirs").filter((id) => BY_ID.has(id));
  state.moves = list("moves");
  state.abilities = list("abilities");
  state.presets = list("presets");
  state.myMods = list("my_mods");
  state.theirMods = list("their_mods");
  if (q.get("fmt")) state.format = q.get("fmt");
  if (q.get("rating")) state.rating = q.get("rating");
  if (q.get("style")) state.style = q.get("style");
  if (["move", "pokemon", "grid"].includes(q.get("view"))) state.listBy = q.get("view");
  // A link that was shared with advanced on should open that way; otherwise
  // fall back to whatever this browser last chose.
  state.advanced = q.has("advanced")
    ? q.get("advanced") === "1"
    : loadAdvancedPref();
}

function writeUrl(push) {
  const q = new URLSearchParams();
  if (state.mine.length) q.set("mine", state.mine.join(","));
  if (state.theirs.length) q.set("theirs", state.theirs.join(","));
  if (state.moves.length) q.set("moves", state.moves.join(","));
  if (state.abilities.length) q.set("abilities", state.abilities.join(","));
  if (state.presets.length) q.set("presets", state.presets.join(","));
  if (state.format !== BOOT.format) q.set("fmt", state.format);
  if (state.rating !== BOOT.rating) q.set("rating", state.rating);
  if (state.style !== "doubles") q.set("style", state.style);
  if (state.myMods.length) q.set("my_mods", state.myMods.join(","));
  if (state.theirMods.length) q.set("their_mods", state.theirMods.join(","));
  if (state.listBy !== "move") q.set("view", state.listBy);
  if (state.advanced) q.set("advanced", "1");
  const url = location.pathname + (q.toString() ? "?" + q.toString() : "");
  if (push) history.pushState(null, "", url);
  else history.replaceState(null, "", url);
}

/* ─── roster editing ──────────────────────────────────────────────────── */

function addSpecies(side, id) {
  if (!BY_ID.has(id) || state[side].includes(id)) return false;
  state[side].push(id);
  return true;
}

function renderChips(side) {
  const box = $("dr-" + side + "-chips");
  const speeds = new Map();
  (lastResult ? lastResult[side] || [] : []).forEach((p) => {
    if (p.baseStats && p.baseStats.spe != null) speeds.set(p.id, p.baseStats.spe);
  });
  box.innerHTML = state[side].length
    ? state[side]
        .map((id) => {
          const s = BY_ID.get(id) || { name: id, sprite: [0, 0] };
          const spe = speeds.has(id) ? ` <span class="dr-spe">${speeds.get(id)}</span>` : "";
          return `<span class="dr-chip" data-id="${esc(id)}">
              <span class="dr-sprite is-sm" style="${spriteStyleSm(s.sprite)}"></span>
              <b>${usageLink(s.name)}</b>${spe}
              <span class="dr-x" data-remove="${esc(side)}:${esc(id)}" title="${t("Remove")}">×</span>
            </span>`;
        })
        .join("")
    : `<span style="color:var(--text-ghost);font-size:12px">${t("Nothing added yet.")}</span>`;
  $("dr-" + side + "-count").textContent =
    state[side].length ? state[side].length + " " + t("Pokémon") : "";
}

/* ─── autocomplete ────────────────────────────────────────────────────── */

function attachAutocomplete(input, getItems, onPick) {
  let box = null;
  let cursor = -1;
  let items = [];

  function close() {
    if (box) box.remove();
    box = null;
    cursor = -1;
    items = [];
  }

  function open() {
    const q = input.value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!q) return close();
    items = getItems(q).slice(0, 30);
    if (!items.length) return close();
    if (!box) {
      box = document.createElement("div");
      box.className = "dr-sugg";
      input.parentNode.appendChild(box);
    }
    cursor = 0;
    box.innerHTML = items
      .map(
        (it, i) =>
          `<div data-i="${i}" class="${i === cursor ? "is-cursor" : ""}">${it.html}</div>`
      )
      .join("");
    box.querySelectorAll("div").forEach((el) => {
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        onPick(items[parseInt(el.dataset.i, 10)]);
        input.value = "";
        close();
      });
    });
  }

  input.addEventListener("input", open);
  input.addEventListener("blur", () => setTimeout(close, 120));
  input.addEventListener("keydown", (e) => {
    if (!box) {
      if (e.key === "Enter" && input.value.trim()) {
        // No suggestion box open: fall back to the server's fuzzy resolver.
        onPick({ raw: input.value.trim() });
        input.value = "";
      }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      cursor = (cursor + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      box.querySelectorAll("div").forEach((el, i) =>
        el.classList.toggle("is-cursor", i === cursor));
      const active = box.children[cursor];
      if (active) active.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[cursor]) onPick(items[cursor]);
      input.value = "";
      close();
    } else if (e.key === "Escape") {
      close();
    }
  });
}

function speciesMatches(q) {
  const starts = [];
  const contains = [];
  for (const s of SPECIES) {
    const key = s.id;
    if (key.startsWith(q)) starts.push(s);
    else if (key.includes(q)) contains.push(s);
    if (starts.length > 30) break;
  }
  return starts.concat(contains).map((s) => ({
    id: s.id,
    html: `<span class="dr-sprite is-sm" style="${spriteStyleSm(s.sprite)}"></span>${esc(s.name)}`,
  }));
}

/* Moves and abilities share one input. Matching runs on the server against
 * the full move and ability lists rather than against the preset members, so
 * a move no preset happens to mention is still reachable by typing it. */
function attachQueryAutocomplete(input, onPick) {
  let box = null;
  let items = [];
  let cursor = -1;
  let seq = 0;

  const close = () => {
    if (box) box.remove();
    box = null;
    items = [];
    cursor = -1;
  };

  const paint = () => {
    if (!items.length) return close();
    if (!box) {
      box = document.createElement("div");
      box.className = "dr-sugg";
      input.parentNode.appendChild(box);
    }
    box.innerHTML = items
      .map((it, i) => {
        const tag =
          it.kind === "ability"
            ? ` <i style="color:var(--text-dim);font-size:10px">${t("ability")}</i>`
            : it.priority
            ? ` <i style="color:var(--accent);font-size:10px">${it.priority > 0 ? "+" : ""}${it.priority}</i>`
            : "";
        return `<div data-i="${i}" class="${i === cursor ? "is-cursor" : ""}">${esc(it.name)}${tag}</div>`;
      })
      .join("");
    box.querySelectorAll("div").forEach((el) =>
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        onPick(items[parseInt(el.dataset.i, 10)]);
        input.value = "";
        close();
      }));
  };

  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (q.length < 2) return close();
    const mine = ++seq;
    fetch("/tools/api/draft/lookup?q=" + encodeURIComponent(q))
      .then((r) => r.json())
      .then((rows) => {
        if (mine !== seq) return; // a later keystroke already answered
        items = rows;
        cursor = 0;
        paint();
      })
      .catch(close);
  });
  input.addEventListener("blur", () => setTimeout(close, 120));
  input.addEventListener("keydown", (e) => {
    if (!box) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      cursor = (cursor + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      box.querySelectorAll("div").forEach((el, i) =>
        el.classList.toggle("is-cursor", i === cursor));
      const active = box.children[cursor];
      if (active) active.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[cursor]) onPick(items[cursor]);
      input.value = "";
      close();
    } else if (e.key === "Escape") {
      close();
    }
  });
}

/* ─── query bar ───────────────────────────────────────────────────────── */

function renderPresets() {
  const groups = (BOOT.presets || []).slice();
  // Reorder so the chosen play style's groups lead, matching the server's
  // ordering rule but without a round trip.
  groups.sort((a, b) => {
    const rank = (g) => (g.scope === state.style ? 0 : g.scope === "both" ? 1 : 2);
    return rank(a) - rank(b) || a.label.localeCompare(b.label);
  });
  // A preset that is switched on stays visible even when it is an advanced
  // one: hiding a filter that is actively shaping the results would make the
  // page look like it was lying.
  const moveBtns = groups.map((g) => {
    const on = state.presets.includes(g.id);
    const adv = !COMMON_PRESETS.has(g.id) && !on ? " dr-adv" : "";
    return `<button type="button" class="dr-btn is-tiny${adv}${on ? " is-on" : ""}"
         data-preset="${esc(g.id)}" title="${esc((g.moves || []).length)} ${t("moves")}">${esc(g.label)}</button>`;
  });
  const abilBtns = (BOOT.abilityPresets || []).map((g) => {
    const on = (g.abilities || []).every((a) => state.abilities.includes(a.id));
    const adv = !COMMON_ABILITY_PRESETS.has(g.id) && !on ? " dr-adv" : "";
    return `<button type="button" class="dr-btn is-tiny${adv}${on ? " is-on" : ""}"
         data-abilpreset="${esc(g.id)}">${esc(g.label)}</button>`;
  });
  $("dr-presets").innerHTML =
    moveBtns.join("") +
    `<span style="width:100%;height:0"></span>` +
    abilBtns.join("");
}

/* Available modifiers come from the server so the two lists cannot drift;
 * until the first reply we fall back to the ones the UI is built around. */
const FALLBACK_MODS = [
  { id: "scarf", label: "Choice Scarf" },
  { id: "tailwind", label: "Tailwind" },
  { id: "boost1", label: "+1" },
  { id: "boost2", label: "+2" },
  { id: "drop1", label: "-1" },
  { id: "drop2", label: "-2" },
  { id: "para", label: "Paralysed" },
];

function renderListToggle() {
  $("dr-listby").querySelectorAll("[data-listby]").forEach((b) =>
    b.classList.toggle("is-on", b.dataset.listby === state.listBy));
}

function renderAdvanced() {
  const wrap = document.querySelector(".dr-wrap");
  if (wrap) wrap.classList.toggle("show-adv", state.advanced);
  const btn = $("dr-advanced");
  if (btn) {
    btn.textContent = state.advanced ? t("Hide advanced") : t("Show advanced");
    btn.classList.toggle("is-on", state.advanced);
    btn.setAttribute("aria-expanded", state.advanced ? "true" : "false");
  }
}

function renderModifiers() {
  const mods = (lastResult && lastResult.modifiers) || FALLBACK_MODS;
  [["dr-my-mods", "myMods"], ["dr-their-mods", "theirMods"]].forEach(
    ([id, key]) => {
      $(id).innerHTML = mods
        .map(
          (m) =>
            `<button type="button" class="dr-btn is-tiny ${
              state[key].includes(m.id) ? "is-on" : ""
            }" data-mod="${esc(key)}:${esc(m.id)}">${esc(m.label)}</button>`
        )
        .join("");
    }
  );
}

function renderSelected() {
  const names = (lastResult && lastResult.moveNames) || BOOT.moveNames || {};
  const abilNames = (lastResult && lastResult.abilityNames) || {};
  const pri = (lastResult && lastResult.movePriority) || {};
  const cond = (lastResult && lastResult.conditionalPriority) || {};
  const tags = state.moves
    .map((m) => {
      let badge = "";
      if (pri[m] > 0) badge = `<i title="${t("Priority")} +${pri[m]}">+${pri[m]}</i>`;
      else if (pri[m] < 0) badge = `<i title="${t("Priority")} ${pri[m]}">${pri[m]}</i>`;
      else if (cond[m]) badge = `<i title="${esc(cond[m])}">±</i>`;
      return `<span class="dr-mtag">${esc(names[m] || m)}${badge}
          <span class="dr-x" data-unmove="${esc(m)}">×</span></span>`;
    })
    .concat(
      state.abilities.map(
        (a) =>
          `<span class="dr-mtag">${esc(abilNames[a] || a)}
             <i style="color:var(--text-dim)">${t("ability")}</i>
             <span class="dr-x" data-unabil="${esc(a)}">×</span></span>`
      )
    );
  // Presets show as lit buttons above, so the hint only belongs here when
  // nothing at all has been asked for.
  $("dr-selected").innerHTML = tags.length
    ? tags.join("")
    : state.presets.length
    ? `<span style="color:var(--text-dim);font-size:12px">${
        columns.length + " " + t("moves from the presets above")
      }</span>`
    : `<span style="color:var(--text-ghost);font-size:12px">${t(
        "Pick a preset above, or type a move name."
      )}</span>`;
}

/* ─── coverage matrix ─────────────────────────────────────────────────── */

function usageClass(usage) {
  if (usage == null) return "is-unknown";
  if (usage >= 0.5) return "is-common";
  if (usage >= 0.05) return "is-yes";
  return "is-rare";
}

/* A match, rendered the same way wherever it appears. */
function hitTag(label, hit) {
  const u = hit && hit.usage;
  const pctText =
    u == null ? "" : u >= 0.995 ? "100%" : (u * 100).toFixed(u < 0.1 ? 1 : 0) + "%";
  const title =
    (hit && methodText(hit.method)) + (u == null ? " · " + t("no usage data") : "");
  return `<span class="dr-tag ${usageClass(u)}" title="${esc(title.trim())}">
      ${esc(label)}${pctText ? ` <i>${pctText}</i>` : ""}</span>`;
}

/* The matrix goes unreadable fast: an ability preset alone is a dozen columns,
 * and most cells are empty because most Pokemon do not have most things. The
 * list inverts that — only matches are printed, so the answer is what you see
 * rather than what you have to find. */
function listFor(sideLabel, side, res) {
  const roster = res[side] || [];
  const cov = res[side + "Coverage"] || { by_species: {}, by_move: {} };
  const abil = res[side + "Abilities"] || { by_species: {}, by_ability: {} };
  if (!roster.length || (!columns.length && !state.abilities.length)) return "";

  const names = res.moveNames || {};
  const abilNames = res.abilityNames || {};
  const byId = new Map(roster.map((p) => [p.id, p]));

  let body;
  if (state.listBy === "pokemon") {
    const rows = roster
      .map((p) => {
        const hits = cov.by_species[p.id] || {};
        const tags = Object.keys(hits)
          .sort((a, b) => (hits[b].usage || 0) - (hits[a].usage || 0))
          .map((m) => hitTag(names[m] || m, hits[m]))
          .concat((abil.by_species[p.id] || []).map((a) =>
            `<span class="dr-tag is-ability">${esc(abilNames[a] || a)}</span>`));
        if (!tags.length) return "";
        return `<li>
            <span class="dr-listkey">
              <span class="dr-sprite" style="${spriteStyle(p.sprite)}"></span>
              ${usageLink(p.name)}</span>
            <span class="dr-listvals">${tags.join("")}</span>
          </li>`;
      })
      .filter(Boolean);
    const silent = roster.filter(
      (p) => !Object.keys(cov.by_species[p.id] || {}).length &&
             !(abil.by_species[p.id] || []).length
    );
    body =
      (rows.length ? `<ul class="dr-list">${rows.join("")}</ul>` : "") +
      (silent.length
        ? `<p class="dr-none">${t("No matches:")} ${esc(
            silent.map((p) => p.name).join(", ")
          )}</p>`
        : "");
  } else {
    const entries = [];
    columns.forEach((m) => {
      const who = cov.by_move[m] || [];
      if (who.length) entries.push({ label: names[m] || m, who, moveId: m });
    });
    state.abilities.forEach((a) => {
      const who = abil.by_ability[a] || [];
      if (who.length)
        entries.push({ label: abilNames[a] || a, who, ability: true });
    });
    entries.sort((a, b) => b.who.length - a.who.length || a.label.localeCompare(b.label));
    const rows = entries.map((e) => {
      const tags = e.who
        .map((sid) => {
          const p = byId.get(sid) || { name: sid, sprite: [0, 0] };
          const hit = e.ability ? null : (cov.by_species[sid] || {})[e.moveId];
          const u = hit && hit.usage;
          const pct =
            u == null ? "" : u >= 0.995 ? "100%" : (u * 100).toFixed(u < 0.1 ? 1 : 0) + "%";
          return `<span class="dr-tag ${e.ability ? "is-ability" : usageClass(u)}"
              title="${esc(hit ? methodText(hit.method) : "")}">
              <span class="dr-sprite is-sm" style="${spriteStyleSm(p.sprite)}"></span>
              ${usageLink(p.name)}${pct ? ` <i>${pct}</i>` : ""}</span>`;
        })
        .join("");
      return `<li>
          <span class="dr-listkey">${esc(e.label)}
            <span class="dr-count">${e.who.length}/${roster.length}</span></span>
          <span class="dr-listvals">${tags}</span>
        </li>`;
    });
    const empty = columns
      .filter((m) => !(cov.by_move[m] || []).length)
      .map((m) => names[m] || m)
      .concat(
        state.abilities
          .filter((a) => !(abil.by_ability[a] || []).length)
          .map((a) => abilNames[a] || a)
      );
    body =
      (rows.length ? `<ul class="dr-list">${rows.join("")}</ul>` : "") +
      (empty.length
        ? `<p class="dr-none">${t("Nobody has:")} ${esc(empty.join(", "))}</p>`
        : "");
  }

  return `<div class="dr-listwrap">
      <h4 class="dr-listhead">${esc(sideLabel)}</h4>${body}</div>`;
}

function matrixFor(sideLabel, side, res) {
  const roster = res[side] || [];
  const cov = res[side + "Coverage"] || { by_species: {}, by_move: {} };
  const abil = res[side + "Abilities"] || { by_species: {}, by_ability: {} };
  const moves = columns;
  const abilities = state.abilities;
  if (!roster.length || (!moves.length && !abilities.length)) return "";

  const head = [
    `<th class="dr-rowhead">${esc(sideLabel)}</th>`,
    ...moves.map((m) => {
      const n = (cov.by_move[m] || []).length;
      return `<th>${esc((res.moveNames || {})[m] || m)}<br><span class="dr-count">${n}/${roster.length}</span></th>`;
    }),
    ...abilities.map((a) => {
      const n = (abil.by_ability[a] || []).length;
      return `<th>${esc((res.abilityNames || {})[a] || a)}<br><span class="dr-count">${n}/${roster.length}</span></th>`;
    }),
  ].join("");

  const rows = roster
    .map((p) => {
      const hits = cov.by_species[p.id] || {};
      const myAbils = new Set(abil.by_species[p.id] || []);
      const cells = moves
        .map((m) => {
          const hit = hits[m];
          if (!hit) return `<td class="dr-no">·</td>`;
          const u = hit.usage;
          const label =
            u == null ? "—" : u >= 0.995 ? "100%" : (u * 100).toFixed(u < 0.1 ? 1 : 0) + "%";
          const title =
            methodText(hit.method) +
            (u == null ? " · " + t("no usage data") : "");
          return `<td><span class="dr-hit ${usageClass(u)}" title="${esc(title)}">
              <b>✓</b><small>${esc(label)}</small></span></td>`;
        })
        .join("");
      const abilCells = abilities
        .map((a) =>
          myAbils.has(a)
            ? `<td><span class="dr-hit is-yes"><b>✓</b></span></td>`
            : `<td class="dr-no">·</td>`
        )
        .join("");
      const borrowed = p.inheritsFrom
        ? `<sup title="${esc(
            t("Movepool follows ") + p.inheritsFrom + t(" — Megas have no learnset of their own.")
          )}" style="color:var(--text-dim);cursor:help">†</sup>`
        : "";
      return `<tr><th class="dr-rowhead"><span class="dr-mon-cell">
          <span class="dr-sprite" style="${spriteStyle(p.sprite)}"></span>${esc(p.name)}${borrowed}
        </span></th>${cells}${abilCells}</tr>`;
    })
    .join("");

  return `<div class="dr-scroll" style="margin-bottom:14px">
      <table class="dr-matrix"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>
    </div>`;
}

/* ─── speed plans ─────────────────────────────────────────────────────── */

/* Champions spends 66 stat points (max 32 per stat) rather than 508 EVs, so
 * the axis and the unit come from the plan instead of being hardcoded. */
function stripFor(plan) {
  const max = plan.max_investment || 252;
  const unit = plan.unit === "SP" ? t("SP") : t("EVs");
  const pos = (ev) => (ev / max) * 100;
  const ticks = [];
  plan.steps.forEach((s) => {
    if (s.gains.length) {
      ticks.push(
        `<div class="dr-tick" style="left:${pos(s.ev)}%" title="${esc(
          s.ev + " EVs → " + s.stat + " Speed: " + s.gains.map((g) => g.name + " (" + g.label + ")").join(", ")
        )}"></div>`,
        `<div class="dr-tick-label" style="left:${pos(s.ev)}%">${s.ev}</div>`
      );
    } else if (s.ties.length) {
      ticks.push(
        `<div class="dr-tick is-tie" style="left:${pos(s.ev)}%" title="${esc(
          t("Speed tie at ") + s.stat + ": " + s.ties.map((g) => g.name).join(", ")
        )}"></div>`
      );
    }
  });
  const enough = pos(plan.enough_ev);
  return `<div class="dr-strip">
      <div class="dr-strip-ends"><span>0 ${esc(unit)}</span><span>${max} ${esc(unit)}</span></div>
      <div class="dr-strip-rail"></div>
      <div class="dr-strip-fill" style="left:0;width:${enough}%"></div>
      ${plan.enough_ev < max
        ? `<div class="dr-strip-dead" style="left:${enough}%;right:0" title="${t(
            "This investment buys no extra Speed benchmark against this roster."
          )}"></div>`
        : ""}
      ${ticks.join("")}
    </div>`;
}

function planCard(plan, res) {
  const mon = (res.mine || []).find((p) => p.id === plan.species) || { sprite: [0, 0] };
  const natureWord = plan.nature > 0 ? t("+Speed nature") : plan.nature < 0 ? t("−Speed nature") : t("neutral nature");
  const max = plan.max_investment || 252;
  const unit = plan.unit === "SP" ? t("stat points") : t("Speed EVs");
  const unitShort = plan.unit === "SP" ? t("SP") : t("EVs");

  let verdict;
  if (!plan.targets) {
    verdict = t("Add some opponents to compare against.");
  } else if (plan.beats === 0) {
    verdict = `<strong>${t("Speed is not the lever here.")}</strong> ${t(
      "Even at maximum investment this outspeeds nothing on their roster — spend the points elsewhere."
    )}`;
  } else if (plan.enough_ev === 0) {
    verdict = `${t("Beats")} <strong>${plan.beats}/${plan.targets}</strong> ${t(
      "benchmarks with no investment at all."
    )}`;
  } else {
    verdict =
      `${t("Stop at")} <strong>${plan.enough_ev} ${esc(unit)}</strong> (${plan.enough_speed} ${t("Speed")}, ${natureWord}) — ` +
      `${t("that beats")} ${plan.beats}/${plan.targets} ${t("benchmarks")}. ` +
      (plan.wasted_ev > 0
        ? `<span class="dr-waste">${t("The remaining")} ${plan.wasted_ev} ${esc(unitShort)} ${t(
            "to"
          )} ${max} ${t("buy nothing against this roster.")}</span>`
        : t("Max investment is genuinely needed here."));
  }

  const stepRows = plan.steps
    .filter((s) => s.gains.length || s.ties.length)
    .map(
      (s) =>
        `<tr><td class="dr-num">${s.ev}</td><td class="dr-num">${s.stat}</td><td>` +
        s.gains.map((g) => `${esc(g.name)} <span style="color:var(--text-dim)">(${esc(g.label)})</span>`).join(", ") +
        s.ties
          .map((g) => `<span class="dr-tiepill">${t("TIE")} ${esc(g.name)}</span>`)
          .join("") +
        `</td></tr>`
    )
    .join("");

  const unreachNames = Array.from(
    new Set((plan.unreachable || []).map((u) => u.name))
  );

  return `<div class="dr-plan">
      <div class="dr-plan-head">
        <span class="dr-sprite" style="${spriteStyle(mon.sprite)}"></span>
        <b>${esc(plan.name)}</b>
        <span class="dr-forme-tag">${esc(natureWord)}</span>
        <span style="color:var(--text-dim);font-size:12px">${t("base")} ${plan.base} ${t("Speed")}</span>
        <span class="dr-spacer"></span>
        <span style="color:var(--text-dim);font-size:12px">${t("max")} ${plan.max_speed}</span>
      </div>
      <p class="dr-verdict">${verdict}</p>
      ${plan.targets ? stripFor(plan) : ""}
      ${stepRows
        ? `<table class="dr-steps"><thead><tr>
             <th style="text-align:right">${esc(unitShort)}</th>
             <th style="text-align:right">${t("Speed")}</th>
             <th>${t("Newly beats")}</th></tr></thead><tbody>${stepRows}</tbody></table>`
        : ""}
      ${unreachNames.length
        ? `<p class="dr-unreach">${t("Never outspeeds:")} <b>${esc(unreachNames.join(", "))}</b> — ${t(
            "at any investment."
          )}</p>`
        : ""}
      ${underspeedLine(plan.species, res)}
    </div>`;
}

/* The Trick Room direction. Shown alongside the outspeed plan rather than
 * behind a mode switch, because for a slow Pokemon the useful answer is
 * often "stay under them", and that is a ceiling rather than a floor. */
function underspeedLine(speciesId, res) {
  const u = (res.underspeed || []).find((x) => x.species === speciesId);
  if (!u || !u.max_ev_staying_slower) return "";
  const s = u.slowest_target;
  const unit = u.unit === "SP" ? t("SP") : t("EVs");
  const how = u.unit === "SP"
    ? t("with a −Speed nature you can take up to")
    : t("with 0 IVs and a −Speed nature you can take up to");
  return `<p class="dr-unreach">${t("Trick Room:")} ${how}
      <b style="color:var(--text-strong)">${u.max_ev_staying_slower.ev} ${esc(unit)}</b>
      (${u.max_ev_staying_slower.stat} ${t("Speed")}) ${t("and still move under")}
      ${esc(s.name)} <span style="color:var(--text-dim)">(${esc(s.label)}, ${s.speed})</span>.</p>`;
}

/* ─── requirement grid ────────────────────────────────────────────────── */

/* The core question: for each of their Pokemon, what does it cost to be
 * faster? Reported per nature rather than as one recommendation, because
 * whether a +Speed nature is affordable depends on what the nature slot is
 * already doing for damage -- which the tool has no way to know. */
function reqCell(option, req) {
  if (!option) {
    return `<span class="dr-cost is-none">${t("no")}</span>`;
  }
  const col = req.columns[option.column];
  const free = option.ev === 0;
  const how = [];
  if (col.modLabel && col.mods.length) how.push(col.modLabel);
  if (col.role === "mega") how.push(t("as Mega"));
  else if (col.role === "pre-mega") how.push(t("pre-Mega"));
  return (
    `<span class="dr-cost ${free ? "is-free" : ""}">${option.ev} ${esc(req.unit)}</span>` +
    ` <span class="dr-how">→ ${option.stat}` +
    (how.length ? " · " + esc(how.join(", ")) : "") +
    `</span>`
  );
}

/* The number you write on the spread. Once a configuration is chosen, "run
 * 172 EVs" is the answer — reading it off the per-target grid by eye is work
 * the tool should do. Sorted best-coverage-first so the line that clears the
 * roster leads, and configurations that beat nothing are dropped. */
function summaryLines(req) {
  const rows = (req.summaries || [])
    .map((s, ci) => ({ s, ci, col: req.columns[ci] }))
    .filter((r) => r.s.beats > 0)
    .sort(
      (a, b) =>
        b.s.beats - a.s.beats ||
        a.col.setupCount - b.col.setupCount ||
        a.col.mods.length - b.col.mods.length ||
        (a.col.nature !== 0) - (b.col.nature !== 0) ||
        a.s.enoughEv - b.s.enoughEv
    );
  if (!rows.length) {
    return `<p class="dr-verdict"><strong>${t(
      "Speed is not the lever here."
    )}</strong> ${t("Nothing on their roster is outsped under any option shown.")}</p>`;
  }
  const items = rows
    .map(({ s, ci, col }, i) => {
      const nat = col.nature > 0 ? t("+Speed nature") : t("neutral nature");
      const how =
        (col.mods.length ? esc(col.modLabel) + ", " : "") +
        nat +
        (col.role === "mega" ? ", " + t("as Mega") : "") +
        (col.role === "pre-mega" ? ", " + t("pre-Mega") : "");
      return `<li class="${s.clearsAll ? "is-clear" : ""}">
          <details${i === 0 ? " open" : ""}>
            <summary>
              <span class="dr-runline">${t("run")} <b>${s.enoughEv} ${esc(req.unit)}</b>
                <span class="dr-how">→ ${s.enoughSpeed} ${t("Speed")}</span></span>
              <span class="dr-how">${how}</span>
              <span class="dr-beats ${s.clearsAll ? "is-clear" : ""}">${
                s.clearsAll
                  ? t("outspeeds their whole roster")
                  : t("outspeeds") + " " + s.beats + " " + t("of") + " " +
                    s.targets + " " + t("spreads")
              }</span>
              ${s.wastedEv > 0
                ? `<span class="dr-how">${s.wastedEv} ${esc(req.unit)} ${t("spare")}</span>`
                : ""}
            </summary>
            ${beatenDetail(req, ci)}
          </details>
        </li>`;
    })
    .join("");
  return `<ul class="dr-runlist">${items}</ul>`;
}

/* Group a set of benchmark rows back into Pokemon. "Jolteon" reads better
 * than three separate lines, and naming the spreads only when it is a partial
 * win is what makes the difference between them visible. */
function groupTargets(list, allTargets) {
  const total = {};
  allTargets.forEach((tg) => {
    total[tg.name] = (total[tg.name] || 0) + 1;
  });
  const got = {};
  list.forEach((tg) => {
    const label =
      tg.theirMods && tg.theirMods.length
        ? tg.label + " + " + tg.theirModLabel
        : tg.label;
    (got[tg.name] = got[tg.name] || []).push(label);
  });
  return Object.keys(got)
    .sort()
    .map((n) =>
      got[n].length === total[n]
        ? esc(n)
        : `${esc(n)} <span class="dr-how">(${esc(got[n].join(", "))})</span>`
    );
}

/* "22/30" on its own says nothing about whether that is good. This names the
 * Pokemon on each side of the line, which is the actual scouting answer. */
function beatenDetail(req, ci) {
  if (ci < 0) return "";
  const cells = req.cells[ci] || [];
  const beaten = [];
  const missed = [];
  req.targets.forEach((tg, ti) => {
    const cell = cells[ti];
    if (cell && !cell.tie) beaten.push(tg);
    else missed.push(tg);
  });
  const parts = [];
  if (beaten.length) {
    parts.push(
      `<p class="dr-beat-line"><b class="is-beat">${t("Outspeeds")}</b> ${groupTargets(
        beaten, req.targets
      ).join(", ")}</p>`
    );
  }
  if (missed.length) {
    parts.push(
      `<p class="dr-beat-line"><b class="is-miss">${t("Does not outspeed")}</b> ${groupTargets(
        missed, req.targets
      ).join(", ")}</p>`
    );
  }
  return `<div class="dr-detail">${parts.join("")}</div>`;
}

function requirementCard(req, res) {
  if (!req.targets.length || !req.columns.length) return "";
  const mon = (res.mine || []).find((p) => p.id === req.species) || { sprite: [0, 0] };
  const natures = req.natures || [0, 1];

  const rows = req.targets
    .map((tg, ti) => {
      const opt = req.options[ti] || {};
      const cells = natures
        .map((n) => `<td>${reqCell(opt[String(n)], req)}</td>`)
        .join("");
      const theirs =
        tg.theirMods && tg.theirMods.length
          ? ` <span class="dr-how">+ ${esc(tg.theirModLabel)}</span>`
          : "";
      return `<tr>
          <td>${usageLink(tg.name)}${theirs}</td>
          <td class="dr-how">${esc(tg.label)}</td>
          <td class="dr-num">${tg.speed}</td>
          ${cells}
        </tr>`;
    })
    .join("");

  const formeNote =
    req.formes.length > 1
      ? `<span class="dr-forme-tag is-mega">${t("Mega + pre-Mega both costed")}</span>`
      : "";

  return `<div class="dr-plan">
      <div class="dr-req-head">
        <span class="dr-sprite" style="${spriteStyle(mon.sprite)}"></span>
        <b>${esc(req.name)}</b>${formeNote}
      </div>
      ${summaryLines(req)}
      <div class="dr-scroll dr-adv">
        <table class="dr-req"><thead><tr>
          <th>${t("Their Pokémon")}</th>
          <th>${t("Assumed spread")}</th>
          <th style="text-align:right">${t("Speed")}</th>
          ${natures
            .map((n) => `<th>${n > 0 ? t("+Speed nature") : t("Neutral nature")}</th>`)
            .join("")}
        </tr></thead><tbody>${rows}</tbody></table>
      </div>
    </div>`;
}

/* ─── ladder ──────────────────────────────────────────────────────────── */

function ladderTable(res) {
  const rows = (res.ladder || [])
    .map(
      (r) =>
        `<tr class="${r.side === "mine" ? "dr-mine" : "dr-theirs"}">
           <td>${usageLink(r.name)}</td>
           <td style="color:var(--text-dim)">${esc(r.label)}</td>
           <td class="dr-num"><b>${r.speed}</b></td>
           <td style="color:var(--text-dim);font-size:11px">${r.side === "mine" ? t("mine") : t("theirs")}</td>
         </tr>`
    )
    .join("");
  return rows
    ? `<table class="dr-ladder"><thead><tr>
         <th>${t("Pokémon")}</th><th>${t("Assumed spread")}</th>
         <th style="text-align:right">${t("Speed")}</th><th></th>
       </tr></thead><tbody>${rows}</tbody></table>`
    : "";
}

/* ─── render ──────────────────────────────────────────────────────────── */

function renderResult(res) {
  lastResult = res;
  renderChips("mine");
  renderChips("theirs");
  renderModifiers();
  renderSelected();

  // "Not recognised" and "real, but not in this format" are different
  // problems with different fixes, so they are said differently.
  const DEX_NAME = { gen9: t("Scarlet/Violet"), natdex: t("National Dex"),
                     champions: t("Champions") };
  const elsewhere = res.unknownElsewhere || {};
  const notes = (res.unknown || []).map((name) => {
    const where = elsewhere[name];
    return where && where.length
      ? `<b>${esc(name)}</b> — ${t("not in this format's dex; available in")} ${esc(
          where.map((d) => DEX_NAME[d] || d).join(", ")
        )}`
      : `<b>${esc(name)}</b> — ${t("not recognised")}`;
  });
  $("dr-warn").innerHTML = notes.length
    ? `<div class="dr-warn">${notes.join("<br>")}</div>`
    : "";

  const hasQuery = columns.length || state.abilities.length;
  const render = state.listBy === "grid" ? matrixFor : listFor;
  const cov =
    render(t("Opponent"), "theirs", res) + render(t("Mine"), "mine", res);
  $("dr-coverage").innerHTML = cov
    ? cov
    : `<div class="dr-empty">${
        hasQuery
          ? t("Add some Pokémon to either roster.")
          : t("Pick a preset — Speed Control, Fake Out, Priority — or type a move.")
      }</div>`;

  $("dr-req").innerHTML = (res.requirements || []).length
    ? res.requirements.map((r) => requirementCard(r, res)).join("")
    : `<div class="dr-empty">${t(
        "Add Pokémon to both rosters to see what it takes to outspeed them."
      )}</div>`;

  $("dr-speed").innerHTML = (res.speed || []).length
    ? res.speed.map((p) => planCard(p, res)).join("")
    : `<div class="dr-empty">${t(
        "Add Pokémon to both rosters to see Speed breakpoints."
      )}</div>`;

  $("dr-ladder").innerHTML =
    ladderTable(res) ||
    `<div class="dr-empty">${t("Add Pokémon to either roster.")}</div>`;
}

/* ─── fetch ───────────────────────────────────────────────────────────── */

let pending = null;

function refresh() {
  writeUrl(false);
  renderChips("mine");
  renderChips("theirs");
  renderPresets();
  renderModifiers();
  renderSelected();
  renderAdvanced();

  if (!state.mine.length && !state.theirs.length) {
    lastResult = null;
    $("dr-coverage").innerHTML = `<div class="dr-empty">${t(
      "Add a roster to get started."
    )}</div>`;
    $("dr-speed").innerHTML = "";
    $("dr-ladder").innerHTML = "";
    return;
  }

  // Simple mode still costs out a Choice Scarf, because "would a Scarf fix
  // this" is the first thing anyone asks about Speed and the summary labels
  // every row anyway — the analysis explains itself without a control to set
  // it. Advanced mode hands the choice over.
  const myMods = state.advanced ? state.myMods : ["scarf"];
  const theirMods = state.advanced ? state.theirMods : [];

  const q = new URLSearchParams({
    mine: state.mine.join(","),
    theirs: state.theirs.join(","),
    moves: state.moves.join(","),
    abilities: state.abilities.join(","),
    presets: state.presets.join(","),
    fmt: state.format,
    rating: state.rating,
    my_mods: myMods.join(","),
    their_mods: theirMods.join(","),
  });

  const token = {};
  pending = token;
  fetch("/tools/api/draft/scout?" + q.toString())
    .then((r) => r.json())
    .then((res) => {
      if (pending !== token) return; // a newer request already went out
      if (res.error) throw new Error(res.error);
      // The server owns preset expansion, so the columns come from its reply
      // rather than being re-derived here — the two cannot then disagree.
      columns = Object.keys(res.moveNames || {});
      renderResult(res);
    })
    .catch(() => {
      if (pending !== token) return;
      $("dr-warn").innerHTML = `<div class="dr-warn">${t(
        "Could not load scouting data. Try again."
      )}</div>`;
    });
}

/* ─── wiring ──────────────────────────────────────────────────────────── */

function fillRatings() {
  const opts = (BOOT.formatRatings || {})[state.format] || ["0"];
  $("dr-rating").innerHTML = opts
    .map((r) => `<option value="${esc(r)}">${r === "0" ? t("All ratings") : esc(r) + "+"}</option>`)
    .join("");
  if (!opts.includes(state.rating)) state.rating = opts[0];
  $("dr-rating").value = state.rating;
}

function init() {
  readUrl();

  $("dr-format").value = state.format;
  fillRatings();
  $("dr-style").value = state.style;
  renderModifiers();
  renderListToggle();
  renderAdvanced();

  attachAutocomplete($("dr-mine-input"), speciesMatches, (item) => {
    if (item.id) {
      addSpecies("mine", item.id);
      refresh();
    } else if (item.raw) {
      addByText("mine", item.raw);
    }
  });
  attachAutocomplete($("dr-theirs-input"), speciesMatches, (item) => {
    if (item.id) {
      addSpecies("theirs", item.id);
      refresh();
    } else if (item.raw) {
      addByText("theirs", item.raw);
    }
  });
  attachQueryAutocomplete($("dr-move-input"), (item) => {
    if (item.kind === "ability") {
      if (!state.abilities.includes(item.id)) state.abilities.push(item.id);
    } else if (item.id && !state.moves.includes(item.id)) {
      state.moves.push(item.id);
    }
    refresh();
  });

  $("dr-format").addEventListener("change", (e) => {
    state.format = e.target.value;
    fillRatings();
    ensureDex(state.format).then(refresh);
  });
  $("dr-rating").addEventListener("change", (e) => {
    state.rating = e.target.value;
    refresh();
  });
  $("dr-style").addEventListener("change", (e) => {
    state.style = e.target.value;
    renderPresets();
    writeUrl(false);
  });

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-remove],[data-preset],[data-abilpreset],[data-unmove],[data-unabil],[data-paste],[data-mod],[data-listby]");
    if (!el) return;
    if (el.dataset.listby) {
      state.listBy = el.dataset.listby;
      writeUrl(false);
      renderListToggle();
      if (lastResult) renderResult(lastResult);
    } else if (el.dataset.mod) {
      const [key, id] = el.dataset.mod.split(":");
      state[key] = state[key].includes(id)
        ? state[key].filter((m) => m !== id)
        : state[key].concat([id]);
      refresh();
    } else if (el.dataset.remove) {
      const [side, id] = el.dataset.remove.split(":");
      state[side] = state[side].filter((x) => x !== id);
      refresh();
    } else if (el.dataset.preset) {
      const id = el.dataset.preset;
      state.presets = state.presets.includes(id)
        ? state.presets.filter((p) => p !== id)
        : state.presets.concat([id]);
      refresh();
    } else if (el.dataset.abilpreset) {
      const group = (BOOT.abilityPresets || []).find((g) => g.id === el.dataset.abilpreset);
      if (group) {
        const ids = group.abilities.map((a) => a.id);
        const allOn = ids.every((a) => state.abilities.includes(a));
        state.abilities = allOn
          ? state.abilities.filter((a) => !ids.includes(a))
          : Array.from(new Set(state.abilities.concat(ids)));
      }
      refresh();
    } else if (el.dataset.unmove) {
      state.moves = state.moves.filter((m) => m !== el.dataset.unmove);
      refresh();
    } else if (el.dataset.unabil) {
      state.abilities = state.abilities.filter((a) => a !== el.dataset.unabil);
      refresh();
    } else if (el.dataset.paste) {
      addByText(el.dataset.paste, $("dr-" + el.dataset.paste + "-paste").value);
      $("dr-" + el.dataset.paste + "-paste").value = "";
    }
  });

  $("dr-clear").addEventListener("click", () => {
    state.mine = [];
    state.theirs = [];
    state.moves = [];
    state.abilities = [];
    state.presets = [];
    state.myMods = [];
    state.theirMods = [];
    refresh();
  });

  $("dr-advanced").addEventListener("click", () => {
    state.advanced = !state.advanced;
    saveAdvancedPref(state.advanced);
    // Leaving advanced mode must not strand a view only reachable from it.
    if (!state.advanced && state.listBy !== "move") state.listBy = "move";
    writeUrl(false);
    renderAdvanced();
    renderListToggle();
    if (lastResult) renderResult(lastResult);
  });

  $("dr-share").addEventListener("click", () => {
    writeUrl(false);
    navigator.clipboard.writeText(location.href).then(() => {
      const b = $("dr-share");
      const old = b.textContent;
      b.textContent = t("Copied");
      setTimeout(() => (b.textContent = old), 1400);
    });
  });

  window.addEventListener("popstate", () => {
    readUrl();
    ensureDex(state.format).then(refresh);
  });

  // A shared link can name a format whose dex is not the one the page was
  // rendered with, so settle the roster before the first query.
  ensureDex(state.format).then(refresh);
}

/* Pasted rosters go through the server so one fuzzy resolver handles typed,
 * pasted and Showdown-export names identically. */
function addByText(side, text) {
  if (!text || !text.trim()) return;
  fetch("/tools/api/draft/resolve?dex=" + encodeURIComponent(activeDex) +
        "&text=" + encodeURIComponent(text))
    .then((r) => r.json())
    .then((res) => {
      (res.species || []).forEach((p) => addSpecies(side, p.id));
      if ((res.unknown || []).length) {
        $("dr-warn").innerHTML = `<div class="dr-warn">${t(
          "Could not recognise:"
        )} ${esc(res.unknown.join(", "))}</div>`;
      }
      refresh();
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
