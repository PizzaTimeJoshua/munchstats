/* MunchStats theme engine. Loaded synchronously in <head> (before
   style.css) by every page so the saved theme applies before first
   paint. Owns: the preset registry, localStorage("theme") handling,
   the custom-theme derivation (localStorage("themeCustom")), and the
   picker menu behavior (pages without #theme-menu just get theming).

   Contract with the rest of the site:
   - <html data-theme="..."> selects a preset token block in style.css
     (absent = classic dark; custom themes reuse the dark/light base
     and override tokens via inline style properties).
   - <html data-scheme="dark|light"> is ALWAYS set and is what scheme-
     dependent code keys off (chart colors in tools_2.3.js, the replay
     viewer's body.dark skin, replay-override.css).
   - "ms-theme-change" fires on <document> after any theme change so
     live charts restyle. Cross-tab/iframe changes arrive via the
     "storage" event and re-fire it. */
(function () {
  var THEMES = {
    classic: { scheme: "dark" },
    light: { scheme: "light" },
    starry: { scheme: "dark" },
    rayquaza: { scheme: "dark" },
    umbreon: { scheme: "dark" },
    gengar: { scheme: "dark" },
    sylveon: { scheme: "light" },
    munchlax: { scheme: "dark" },
  };

  /* Inline properties applyCustom() may set; cleared on every apply so
     switching custom -> preset leaves no stragglers. */
  var CUSTOM_PROPS = [
    "--bg", "--surface", "--surface-2", "--surface-3",
    "--raised", "--raised-2", "--raised-3", "--inset", "--inset-2",
    "--border-soft", "--border", "--border-2", "--border-3",
    "--border-4", "--border-hi",
    "--accent", "--accent-2", "--accent-tint", "--accent-tint-2",
    "--on-accent", "--bg-image", "--bg-size", "--bg-repeat",
  ];

  var HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

  function hexToRgb(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function toHex(c) {
    var out = "#";
    for (var i = 0; i < 3; i++) {
      var v = Math.max(0, Math.min(255, Math.round(c[i])));
      out += (v < 16 ? "0" : "") + v.toString(16);
    }
    return out;
  }
  function mix(a, b, pct) {
    var A = hexToRgb(a), B = hexToRgb(b), c = [];
    for (var i = 0; i < 3; i++) c[i] = A[i] + (B[i] - A[i]) * pct / 100;
    return toHex(c);
  }
  function rgba(h, a) {
    var c = hexToRgb(h);
    return "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", " + a + ")";
  }
  function lum(h) {
    var c = hexToRgb(h);
    return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
  }

  /* Background patterns available to custom themes (presets define
     theirs directly in style.css). Ink follows the scheme. */
  function pattern(name, scheme, accent) {
    var ink = scheme === "light" ? "0, 0, 0" : "255, 255, 255";
    if (name === "stars") {
      return {
        image: "radial-gradient(1.4px 1.4px at 22px 34px, rgba(" + ink + ", 0.5) 50%, transparent 51%), " +
          "radial-gradient(1px 1px at 88px 112px, rgba(" + ink + ", 0.38) 50%, transparent 51%), " +
          "radial-gradient(1.2px 1.2px at 150px 60px, rgba(" + ink + ", 0.42) 50%, transparent 51%), " +
          "radial-gradient(0.8px 0.8px at 200px 180px, rgba(" + ink + ", 0.34) 50%, transparent 51%), " +
          "radial-gradient(1px 1px at 55px 210px, rgba(" + ink + ", 0.38) 50%, transparent 51%), " +
          "radial-gradient(1.6px 1.6px at 240px 20px, rgba(" + ink + ", 0.3) 50%, transparent 51%)",
        size: "280px 280px", repeat: "repeat",
      };
    }
    if (name === "pokeballs") {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
        '<g fill="none" stroke="rgba(' + ink + ',0.055)" stroke-width="2">' +
        '<circle cx="60" cy="60" r="22"/><path d="M38 60h14"/><path d="M68 60h14"/>' +
        '<circle cx="60" cy="60" r="8"/></g></svg>';
      return { image: 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")', size: "120px 120px", repeat: "repeat" };
    }
    if (name === "stripes") {
      return { image: "repeating-linear-gradient(135deg, rgba(" + ink + ", 0.03) 0 2px, transparent 2px 26px)", size: "auto", repeat: "repeat" };
    }
    if (name === "rings") {
      return {
        image: "radial-gradient(circle at 70px 70px, transparent 22px, " + rgba(accent, 0.05) + " 23px, " + rgba(accent, 0.05) + " 27px, transparent 28px)",
        size: "190px 190px", repeat: "repeat",
      };
    }
    if (name === "dots") {
      return { image: "radial-gradient(1.5px 1.5px at 12px 12px, rgba(" + ink + ", 0.12) 50%, transparent 51%)", size: "44px 44px", repeat: "repeat" };
    }
    return null;
  }

  function readCustom() {
    try { return JSON.parse(localStorage.getItem("themeCustom") || "null"); } catch (e) { return null; }
  }

  function applyCustom(root, cfg) {
    cfg = cfg || {};
    var scheme = cfg.scheme === "light" ? "light" : "dark";
    if (scheme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    root.setAttribute("data-scheme", scheme);

    var bg = HEX_RE.test(cfg.bg || "") ? cfg.bg : (scheme === "light" ? "#f1f1f4" : "#1e1e1e");
    var ac = HEX_RE.test(cfg.accent || "") ? cfg.accent : (scheme === "light" ? "#9a6700" : "#ffd54f");
    var s = root.style;

    /* Derive the surface/border scales from the chosen background so
       one color pick restyles the whole chrome coherently. */
    if (scheme === "dark") {
      s.setProperty("--bg", bg);
      s.setProperty("--surface", mix(bg, "#ffffff", 3));
      s.setProperty("--surface-2", mix(bg, "#ffffff", 4.5));
      s.setProperty("--surface-3", mix(bg, "#ffffff", 7));
      s.setProperty("--raised", mix(bg, "#ffffff", 12));
      s.setProperty("--raised-2", mix(bg, "#ffffff", 15));
      s.setProperty("--raised-3", mix(bg, "#ffffff", 20));
      s.setProperty("--inset", mix(bg, "#000000", 18));
      s.setProperty("--inset-2", mix(bg, "#000000", 35));
      s.setProperty("--border-soft", mix(bg, "#ffffff", 12));
      s.setProperty("--border", mix(bg, "#ffffff", 20));
      s.setProperty("--border-2", mix(bg, "#ffffff", 27));
      s.setProperty("--border-3", mix(bg, "#ffffff", 35));
      s.setProperty("--border-4", mix(bg, "#ffffff", 42));
      s.setProperty("--border-hi", mix(bg, "#ffffff", 52));
      s.setProperty("--accent-2", mix(ac, "#000000", 15));
      s.setProperty("--accent-tint", rgba(ac, 0.15));
      s.setProperty("--accent-tint-2", rgba(ac, 0.3));
    } else {
      s.setProperty("--bg", bg);
      s.setProperty("--surface", mix(bg, "#ffffff", 70));
      s.setProperty("--surface-2", mix(bg, "#ffffff", 55));
      s.setProperty("--surface-3", mix(bg, "#000000", 4));
      s.setProperty("--raised", mix(bg, "#000000", 8));
      s.setProperty("--raised-2", mix(bg, "#000000", 12));
      s.setProperty("--raised-3", mix(bg, "#000000", 18));
      s.setProperty("--inset", mix(bg, "#000000", 5));
      s.setProperty("--inset-2", mix(bg, "#000000", 8));
      s.setProperty("--border-soft", mix(bg, "#000000", 10));
      s.setProperty("--border", mix(bg, "#000000", 20));
      s.setProperty("--border-2", mix(bg, "#000000", 28));
      s.setProperty("--border-3", mix(bg, "#000000", 40));
      s.setProperty("--border-4", mix(bg, "#000000", 44));
      s.setProperty("--border-hi", mix(bg, "#000000", 52));
      s.setProperty("--accent-2", mix(ac, "#000000", 20));
      s.setProperty("--accent-tint", rgba(ac, 0.1));
      s.setProperty("--accent-tint-2", rgba(ac, 0.25));
    }
    s.setProperty("--accent", ac);
    s.setProperty("--on-accent", lum(ac) > 0.55 ? "#1e1e1e" : "#fff");

    /* Background image beats pattern; both are drawn by body::before. */
    var img = typeof cfg.image === "string" ? cfg.image.trim() : "";
    if (img && /^https?:\/\/|^data:image\//i.test(img)) {
      var scrim = rgba(bg, 0.72);
      s.setProperty("--bg-image", "linear-gradient(" + scrim + ", " + scrim + '), url("' + encodeURI(img) + '")');
      s.setProperty("--bg-size", "cover");
      s.setProperty("--bg-repeat", "no-repeat");
    } else {
      var pat = pattern(cfg.pattern, scheme, ac);
      if (pat) {
        s.setProperty("--bg-image", pat.image);
        s.setProperty("--bg-size", pat.size);
        s.setProperty("--bg-repeat", pat.repeat);
      }
    }
  }

  function storedName() {
    var v = null;
    try { v = localStorage.getItem("theme"); } catch (e) {}
    if (v === "custom") return "custom";
    if (!v || v === "dark") return "classic";
    return THEMES[v] ? v : "classic";
  }

  function apply(name) {
    var root = document.documentElement;
    for (var i = 0; i < CUSTOM_PROPS.length; i++) root.style.removeProperty(CUSTOM_PROPS[i]);
    if (name === "custom") { applyCustom(root, readCustom()); return; }
    var th = THEMES[name] || THEMES.classic;
    if (name === "classic" || !THEMES[name]) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", name);
    root.setAttribute("data-scheme", th.scheme);
  }

  window.MS_THEMES = THEMES;
  window.msThemeScheme = function () {
    return document.documentElement.getAttribute("data-scheme") === "light" ? "light" : "dark";
  };
  window.msApplyStoredTheme = function () { apply(storedName()); };
  window.msSetTheme = function (name) {
    try { localStorage.setItem("theme", name); } catch (e) {}
    apply(name);
    markActive(name);
    try { document.dispatchEvent(new CustomEvent("ms-theme-change")); } catch (e) {}
  };
  window.msSetCustomTheme = function (cfg) {
    try { localStorage.setItem("themeCustom", JSON.stringify(cfg)); } catch (e) {}
    window.msSetTheme("custom");
  };

  /* Apply before first paint. */
  window.msApplyStoredTheme();

  /* Follow changes made in other tabs / the parent page (the replay
     iframe in watch.html relies on this). */
  window.addEventListener("storage", function (e) {
    if (e.key !== "theme" && e.key !== "themeCustom") return;
    window.msApplyStoredTheme();
    try { document.dispatchEvent(new CustomEvent("ms-theme-change")); } catch (e2) {}
  });

  /* ---- picker menu (only wired on pages that render #theme-menu) ---- */

  function markActive(name) {
    var chips = document.querySelectorAll(".theme-chip[data-theme-id]");
    for (var i = 0; i < chips.length; i++) {
      var sel = chips[i].getAttribute("data-theme-id") === name;
      chips[i].className = chips[i].className.replace(/ ?\bsel\b/, "") + (sel ? " sel" : "");
    }
  }

  function normHex(v) {
    v = (v || "").trim();
    if (!HEX_RE.test(v)) return null;
    if (v.length === 4) v = "#" + v.charAt(1) + v.charAt(1) + v.charAt(2) + v.charAt(2) + v.charAt(3) + v.charAt(3);
    return v.toLowerCase();
  }

  function fillCustomForm() {
    var scheme = document.getElementById("ct-scheme");
    if (!scheme) return;
    var cfg = readCustom() || {};
    var cs = getComputedStyle(document.documentElement);
    scheme.value = (cfg.scheme === "light" || (!cfg.scheme && window.msThemeScheme() === "light")) ? "light" : "dark";
    document.getElementById("ct-bg").value = normHex(cfg.bg) || normHex(cs.getPropertyValue("--bg")) || "#1e1e1e";
    document.getElementById("ct-accent").value = normHex(cfg.accent) || normHex(cs.getPropertyValue("--accent")) || "#ffd54f";
    document.getElementById("ct-pattern").value = cfg.pattern || "none";
    document.getElementById("ct-image").value = cfg.image || "";
  }

  window.msToggleThemeMenu = function () {
    var m = document.getElementById("theme-menu");
    if (!m) return;
    m.hidden = !m.hidden;
    if (!m.hidden) { markActive(storedName()); fillCustomForm(); }
  };
  window.msToggleCustomPanel = function () {
    var p = document.getElementById("theme-custom");
    if (!p) return;
    p.hidden = !p.hidden;
    if (!p.hidden) fillCustomForm();
  };
  window.msCustomChanged = function () {
    window.msSetCustomTheme({
      scheme: document.getElementById("ct-scheme").value,
      bg: document.getElementById("ct-bg").value,
      accent: document.getElementById("ct-accent").value,
      pattern: document.getElementById("ct-pattern").value,
      image: document.getElementById("ct-image").value.trim(),
    });
  };
  window.msResetCustom = function () {
    try { localStorage.removeItem("themeCustom"); } catch (e) {}
    window.msSetTheme("classic");
    fillCustomForm();
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("theme-menu")) return;
    markActive(storedName());
    document.addEventListener("click", function (e) {
      var m = document.getElementById("theme-menu");
      if (!m || m.hidden) return;
      if (!e.target.closest || !e.target.closest(".theme-menu-wrap")) m.hidden = true;
    });
  });
})();
