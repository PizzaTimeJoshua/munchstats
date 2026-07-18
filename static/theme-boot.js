/* MunchStats theme engine. Loaded synchronously in <head> (before
   style.css) by every page so the saved theme applies before first
   paint. Owns: the preset registry, localStorage("theme") handling,
   and the picker menu behavior (pages without #theme-menu just get
   theming).

   Contract with the rest of the site:
   - <html data-theme="..."> selects a preset token block in style.css
     (absent = classic dark).
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

  function storedName() {
    var v = null;
    try { v = localStorage.getItem("theme"); } catch (e) {}
    if (!v || v === "dark") return "classic";
    return THEMES[v] ? v : "classic";
  }

  function apply(name) {
    var root = document.documentElement;
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

  /* Apply before first paint. */
  window.msApplyStoredTheme();

  /* Follow changes made in other tabs / the parent page (the replay
     iframe in watch.html relies on this). */
  window.addEventListener("storage", function (e) {
    if (e.key !== "theme") return;
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

  window.msToggleThemeMenu = function () {
    var m = document.getElementById("theme-menu");
    if (!m) return;
    m.hidden = !m.hidden;
    if (!m.hidden) markActive(storedName());
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
