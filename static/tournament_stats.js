$(document).ready(function () {
  var t = window.msT || function (s) { return s; };

  // ========== TOOLTIP ==========
  var tooltip = document.getElementById("tooltip");
  document.addEventListener("mouseover", function (event) {
    var button = event.target.closest(".has-tooltip");
    if (!button) return;
    var tooltipText = button.getAttribute("data-tooltip");
    if (tooltipText) {
      tooltip.innerHTML = tooltipText.replace(/(?:\r\n|\r|\n)/g, "<br>");
      tooltip.style.display = "block";
    }
  });
  document.addEventListener("mousemove", function (event) {
    if (tooltip.style.display === "block") {
      tooltip.style.left = event.pageX + 10 + "px";
      tooltip.style.top = event.pageY + 10 + "px";
    }
  });
  document.addEventListener("mouseout", function (event) {
    var button = event.target.closest(".has-tooltip");
    if (!button) return;
    if (button.contains(event.relatedTarget)) return;
    tooltip.style.display = "none";
  });

  // ========== STATE ==========
  // One page, three data sources: "official" (RK9 events, day filter),
  // "limitless" (online formats, min-player segments) and
  // "limitless_event" (a single online tournament). Each keeps its own
  // selection so switching back and forth doesn't lose context.
  var currentSource = window.hubSource || "official";
  var currentTournamentId = window.currentTournamentId || "";
  var currentDayFilter = window.currentDayFilter || "all";
  var currentFormatId = window.currentFormatId || "";
  var currentSegment = window.currentSegment || "";
  var currentEventId = window.currentEventId || "";
  // Placement cut ("all" | "32" | "16" | "8") shared by both Limitless
  // sources — the online counterpart of the official day filters.
  var currentCut = window.currentCut || "all";
  var currentPokemonName = window.currentPokemonName || "";
  // Tournaments feeding the current format's stats; drives the Events
  // browser and refreshes with every format response, so newly cached
  // events show up without extra requests.
  var includedTournaments = window.includedTournaments || [];
  // Official-event overview (per-stage top usage + biggest movers),
  // shown until the visitor actually picks a Pokemon. pokemonRequested
  // tracks that choice: URLs only carry a Pokemon segment once made.
  var hubOverview = window.hubOverview || null;
  var pokemonRequested = !!window.pokemonRequested;
  var currentView = "usage";
  var isLoading = false;

  // ========== SEARCH FILTERS ==========
  $("#tournamentSearchInput").on("input", function () {
    var query = $(this).val().toLowerCase();
    $("#source-list li").each(function () {
      var text = $(this).text().toLowerCase();
      if ($(this).hasClass("tournament-group-header")) {
        // Show/hide group headers based on whether any child is visible
        $(this).show();
      } else {
        $(this).toggle(text.indexOf(query) !== -1);
      }
    });
    // Hide group headers with no visible children after them
    if (query) {
      $("#source-list li.tournament-group-header").each(function () {
        var hasVisible = false;
        var next = $(this).next();
        while (next.length && !next.hasClass("tournament-group-header")) {
          if (next.is(":visible")) hasVisible = true;
          next = next.next();
        }
        $(this).toggle(hasVisible);
      });
    }
  });

  $("#pokemonSearchInput").on("input", function () {
    var query = $(this).val().toLowerCase();
    $("#pokemon-list li").each(function () {
      var text = $(this).text().toLowerCase();
      $(this).toggle(text.indexOf(query) !== -1);
    });
  });

  // ========== DATA FETCHING ==========
  function pushHistory(replace) {
    var state = {
      source: currentSource,
      tournament: currentTournamentId,
      day: currentDayFilter,
      format: currentFormatId,
      segment: currentSegment,
      event: currentEventId,
      cut: currentCut,
      pokemon: currentPokemonName,
    };
    // Until the visitor picks a Pokemon the URL stays tournament-level,
    // so shared links open on the overview/events view.
    var urlPokemon = pokemonRequested ? currentPokemonName : "";
    var url;
    if (currentSource === "limitless") {
      url = "/limitless/" + currentFormatId + "/" + currentSegment + "/" + urlPokemon;
    } else if (currentSource === "limitless_event") {
      url = "/limitless/event/" + currentEventId + "/" + urlPokemon;
    } else {
      url = "/tournaments/" + currentTournamentId + "/" + currentDayFilter + "/" + urlPokemon;
    }
    if (currentSource !== "official" && currentCut !== "all") {
      url += "?cut=" + currentCut;
    }
    if (replace) {
      history.replaceState(state, "", url);
    } else {
      history.pushState(state, "", url);
    }
  }

  async function fetchHubData(source, url, skipPush) {
    if (isLoading) return;
    isLoading = true;
    document.getElementById("loading-overlay").classList.add("active");

    try {
      var res = await fetch(url);
      if (res.ok) {
        var data = await res.json();
        updatePage(data, source);
        if (!skipPush) pushHistory(false);
      } else {
        console.error("Tournament data request failed:", res.status, url);
      }
    } catch (e) {
      console.error("Failed to fetch tournament data:", e);
    }

    isLoading = false;
    document.getElementById("loading-overlay").classList.remove("active");
  }

  function fetchOfficialData(tournamentId, dayFilter, pokemonName, skipPush) {
    var url = "/tournaments/api/" + encodeURIComponent(tournamentId) +
              "/" + encodeURIComponent(dayFilter) + "/";
    if (pokemonName) url += encodeURIComponent(pokemonName);
    fetchHubData("official", url, skipPush);
  }

  function fetchLimitlessData(formatId, segment, pokemonName, skipPush) {
    var url = "/limitless/api/" + encodeURIComponent(formatId) +
              "/" + encodeURIComponent(segment) + "/";
    if (pokemonName) url += encodeURIComponent(pokemonName);
    url += "?cut=" + encodeURIComponent(currentCut || "all");
    fetchHubData("limitless", url, skipPush);
  }

  function fetchEventData(eventId, pokemonName, skipPush) {
    var url = "/limitless/api/event/" + encodeURIComponent(eventId) + "/";
    if (pokemonName) url += encodeURIComponent(pokemonName);
    url += "?cut=" + encodeURIComponent(currentCut || "all");
    fetchHubData("limitless_event", url, skipPush);
  }

  function updateSidebarHighlight() {
    // A single event highlights its parent format in the sidebar
    var selSource = currentSource === "limitless_event" ? "limitless" : currentSource;
    var selId = selSource === "limitless" ? currentFormatId : currentTournamentId;
    $("#source-list .meta-button").each(function () {
      var src = $(this).attr("data-source");
      var id = $(this).attr("data-id");
      $(this).toggleClass("active", src === selSource && id === selId);
    });
  }

  function updatePage(data, source) {
    currentSource = source;
    currentPokemonName = data.selected_pokemon;
    if (source === "limitless") {
      currentFormatId = data.selected_format_id;
      currentSegment = data.segment;
      currentCut = data.cut || "all";
      includedTournaments = data.included_tournaments || [];
    } else if (source === "limitless_event") {
      currentEventId = data.selected_event.id;
      // Parent format: keeps the sidebar highlight and "All Events"
      // back-navigation anchored while browsing a single event.
      currentFormatId = data.selected_format_id;
      currentCut = data.cut || "all";
      hubOverview = data.overview || null;
    } else {
      currentTournamentId = data.selected_tournament.id;
      currentDayFilter = data.day_filter;
      hubOverview = data.overview || null;
    }

    // Update pokemon info card
    var cp = data.current_pokemon;
    var sprite = cp[3];
    $("#info-sprite").css("background-position", (sprite[1] * -40) + "px " + (sprite[0] * -30) + "px");
    $("#info-name").text(cp[0]);
    $("#info-usage").text(cp[1] + "%");
    $("#info-rank").text("#" + cp[2]);
    $("#info-teams").text(data.total_teams);

    $("#info-winrate").text(data.win_rate === "—" ? data.win_rate : data.win_rate + "%");

    // Source-specific card bits: context line + page title
    var cutSuffix = currentCut !== "all" ? " · Top " + currentCut : "";
    if (source === "limitless") {
      $("#info-context").text(
        data.selected_format_name + " · " + data.tournament_count +
        " online tournaments · last " + data.window_days + " days · " +
        data.min_players + "+ players" + cutSuffix
      );
      document.title = "Tournaments | MunchStats | " + data.selected_format_name + " (Online)";
    } else if (source === "limitless_event") {
      var ev = data.selected_event;
      var bits = [ev.name];
      if (ev.players) bits.push(ev.players + " players");
      if (ev.date) bits.push(ev.date.slice(0, 10));
      $("#info-context").text(bits.join(" · ") + cutSuffix);
      document.title = "Tournaments | MunchStats | " + ev.name;
    } else {
      $("#info-context").text(data.selected_tournament.name);
      document.title = "Tournaments | MunchStats | " + data.selected_tournament.name;
    }

    // Update types
    var typesHtml = "";
    if (data.pokemon_types) {
      data.pokemon_types.forEach(function (t) {
        typesHtml += '<div class="type-' + t + '">' + t + '</div>';
      });
    }
    $("#info-types").html(typesHtml);

    // Update base stats
    var statFills = ["hp", "atk", "def", "spa", "spd", "spe"];
    if (data.base_stats && data.base_stats.length === 6) {
      for (var i = 0; i < 6; i++) {
        var pct = (data.base_stats[i] / 255 * 81) + "%";
        $(".bar-fill." + statFills[i] + "-fill").css("width", pct);
        $("#stat-val-" + i).text(data.base_stats[i]);
      }
    }

    updateSidebarHighlight();

    // Show the filter rows that belong to the selected source; both
    // Limitless sources share the placement-cut row
    $("#day-filter-container").toggle(source === "official");
    $("#segment-filter-wrap").toggle(source === "limitless");
    $("#cut-filter-wrap").toggle(source !== "official");
    $("#cut-filter-container .rating-button").each(function () {
      var onclick = $(this).attr("onclick") || "";
      $(this).toggleClass("active", onclick.indexOf("'" + currentCut + "'") !== -1);
    });
    if (source === "limitless") {
      // Rebuild segment (tournament-size) buttons: tiers differ per format
      var segHtml = "";
      (data.segment_options || []).forEach(function (opt) {
        segHtml += '<button type="button" onclick="selectSegment(\'' + opt + '\')" class="rating-button' +
          (opt === currentSegment ? ' active' : '') + '">' + opt + '+</button>';
      });
      $("#segment-filter-container").html(segHtml);
    } else if (source === "official") {
      $("#day-filter-container .rating-button").each(function () {
        var onclick = $(this).attr("onclick") || "";
        $(this).toggleClass("active", onclick.indexOf("'" + currentDayFilter + "'") !== -1);
      });
    }

    // Update Pokemon list
    var pokemonHtml = "";
    data.pokemon_names.forEach(function (p) {
      var bgPos = (p[2][1] * -40) + "px " + (p[2][0] * -30) + "px";
      pokemonHtml += '<li><button type="button" onclick="selectPokemon(\'' +
        p[0].replace(/'/g, "\\'") + '\')" class="pokemon-button" style="padding: 2px 8px;">' +
        '<div class="image-pokemon" style="background-position: ' + bgPos + ';">' +
        '<span class="left-text" style="padding-left: 48px;">' + p[0] + '</span>' +
        '</div><span class="right-text">' + p[1] + '%</span></button></li>';
    });
    $("#pokemon-list").html(pokemonHtml);

    // Update data sections
    updateDataSection("#moves-container", data.moves_list, "move");
    $("#moves-section").toggle(!!(data.moves_list && data.moves_list.length));
    updateDataSection("#items-container", data.items_list, "item");
    $("#items-section").toggle(!!(data.items_list && data.items_list.length));
    updateDataSection("#abilities-container", data.abilities_list, "ability");
    $("#abilities-section").toggle(!!(data.abilities_list && data.abilities_list.length));
    updateDataSection("#tera-container", data.tera_types_list, "tera");
    $("#tera-section").toggle(!!(data.tera_types_list && data.tera_types_list.length));
    updateDataSection("#natures-container", data.natures_list, "nature");
    $("#natures-section").toggle(!!(data.natures_list && data.natures_list.length));
    initExportState(data);
    var hasExportData = (data.moves_list && data.moves_list.length) ||
                        (data.items_list && data.items_list.length) ||
                        (data.abilities_list && data.abilities_list.length);
    $("#export-section").toggle(!!hasExportData);
    updateTeammatesSection(data.teammates_list);
    $("#teammates-section").toggle(!!(data.teammates_list && data.teammates_list.length));
    updateMerchSection(data.selected_pokemon);

    // Reload teams for the selected Pokemon
    $("#teams-heading").text(t("Teams with") + " " + currentPokemonName);
    loadTeams();

    // Attribution follows the data source
    $("#attribution-official").toggle(source === "official");
    $("#attribution-limitless").toggle(source !== "official");

    // Relabel the secondary view for the source and refresh it if open
    $("#btn-secondary-view").text(source === "limitless" ? t("Top Teams") : t("Standings"));
    applyView(currentView === "secondary");
  }

  function updateDataSection(containerId, dataList, type) {
    var container = $(containerId);
    if (!dataList || dataList.length === 0) {
      container.html("");
      return;
    }
    var html = "<ul>";
    dataList.forEach(function (entry) {
      var exportAttr = ' export-data="' + escapeAttr(JSON.stringify(buildExportData(type, entry[0]))) + '"';
      if (type === "item" && entry.length > 3) {
        var itemBg = (entry[3][1] * -24) + "px " + (entry[3][0] * -24) + "px";
        html += '<li><button type="button" class="export-button has-tooltip" data-tooltip="' +
          escapeAttr(entry[2]) + '"' + exportAttr + '>' +
          '<div class="image-item" style="background-position: ' + itemBg + ';">' +
          '<span class="left-text" style="padding-left: 32px;">' + entry[0] + '</span></div>' +
          '<span class="right-text">' + entry[1] + '%</span></button></li>';
      } else if (type === "tera") {
        html += '<li><button type="button" class="export-button"' + exportAttr + '>' +
          '<span class="type-' + entry[0] + '">' + entry[0] + '</span>' +
          '<span class="right-text">' + entry[1] + '%</span></button></li>';
      } else {
        var tooltipAttr = entry.length > 2 ? ' has-tooltip" data-tooltip="' + escapeAttr(entry[2]) : '';
        html += '<li><button type="button" class="export-button' + tooltipAttr + '"' + exportAttr + '>' +
          '<span class="left-text">' + entry[0] + '</span>' +
          '<span class="right-text">' + entry[1] + '%</span></button></li>';
      }
    });
    html += "</ul>";
    container.html(html);
  }

  function buildExportData(type, name) {
    var obj = {};
    obj[type] = name;
    return obj;
  }

  function updateTeammatesSection(teammatesList) {
    var container = $("#teammates-container");
    if (!teammatesList || teammatesList.length === 0) {
      container.html("");
      return;
    }
    var html = "<ul>";
    teammatesList.forEach(function (t) {
      var bgPos = (t[2][1] * -40) + "px " + (t[2][0] * -30) + "px";
      html += '<li><button type="button" onclick="selectPokemon(\'' +
        t[0].replace(/'/g, "\\'") + '\')" class="pokemon-button" style="padding: 2px 8px;">' +
        '<div class="image-pokemon" style="background-position: ' + bgPos + ';">' +
        '<span class="left-text" style="padding-left: 48px;">' + t[0] + '</span></div>' +
        '<span class="right-text">' + t[1] + '%</span></button></li>';
    });
    html += "</ul>";
    container.html(html);
  }

  // ========== MERCH CAROUSEL ==========
  var merchInterval = null;
  var merchCurrentSlide = 0;
  var merchLoaded = false;
  var merchPokemon = "";

  function updateMerchSection(pokemonName) {
    // Only fetch if section is expanded and pokemon changed
    var section = document.getElementById("merch-section");
    if (!section) return;
    merchPokemon = pokemonName;
    merchLoaded = false;
    clearInterval(merchInterval);
    var carousel = document.getElementById("merch-carousel");
    if (carousel) {
      carousel.innerHTML = '<div class="merch-loading">Loading merch...</div>';
    }
    if (!section.classList.contains("collapsed")) {
      fetchMerchListings(pokemonName);
    }
  }

  function fetchMerchListings(pokemonName) {
    if (merchLoaded && merchPokemon === pokemonName) return;
    var carousel = document.getElementById("merch-carousel");
    if (!carousel) return;

    fetch("/api/merch/" + encodeURIComponent(pokemonName))
      .then(function (res) { return res.json(); })
      .then(function (listings) {
        merchLoaded = true;
        if (!listings || listings.length === 0) {
          carousel.innerHTML = '<div class="merch-loading">No merch found</div>';
          return;
        }
        renderMerchCarousel(carousel, listings);
      })
      .catch(function () {
        carousel.innerHTML = '<div class="merch-loading">Could not load merch</div>';
      });
  }

  var MERCH_VISIBLE = 2;
  var MERCH_CARD_W = 150;
  var merchItemCount = 0;

  function buildCardHtml(item) {
    return '<a class="merch-card" href="' + escapeAttr(item.url) +
      '" target="_blank" rel="noopener nofollow">' +
      '<img src="' + escapeAttr(item.image) + '" alt="' + escapeAttr(item.title) + '" loading="lazy">' +
      '<div class="merch-card-title">' + escapeAttr(item.title) + '</div>' +
      '<div class="merch-card-price">$' + escapeAttr(item.price) + '</div>' +
      '</a>';
  }

  // Affiliate tracking is handled server-side via the Browse API
  // X-EBAY-C-ENDUSERCTX header, so no client-side EPN script needed.

  function renderMerchCarousel(carousel, listings) {
    merchItemCount = listings.length;
    // Build track: [clones of last VISIBLE] [real items] [clones of first VISIBLE]
    var html = '<div class="merch-track">';
    for (var c = listings.length - MERCH_VISIBLE; c < listings.length; c++) {
      html += buildCardHtml(listings[c]);
    }
    listings.forEach(function (item) { html += buildCardHtml(item); });
    for (var c2 = 0; c2 < MERCH_VISIBLE; c2++) {
      html += buildCardHtml(listings[c2]);
    }
    html += '</div>';
    html += '<div class="merch-nav">';
    html += '<button type="button" class="merch-arrow merch-prev">&#8249;</button>';
    html += '<button type="button" class="merch-arrow merch-next">&#8250;</button>';
    html += '</div>';
    carousel.innerHTML = html;

    var track = carousel.querySelector(".merch-track");
    merchCurrentSlide = 0;
    setTrackPos(track, false);

    function restartMerchInterval() {
      clearInterval(merchInterval);
      if (merchItemCount > MERCH_VISIBLE) {
        merchInterval = setInterval(function () {
          merchCurrentSlide++;
          setTrackPos(track, true);
        }, 5000);
      }
    }

    carousel.querySelector(".merch-prev").addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      merchCurrentSlide--;
      setTrackPos(track, true);
      restartMerchInterval();
    });
    carousel.querySelector(".merch-next").addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      merchCurrentSlide++;
      setTrackPos(track, true);
      restartMerchInterval();
    });

    // Seamless wrap after transition
    track.addEventListener("transitionend", function () {
      if (merchCurrentSlide >= merchItemCount) {
        merchCurrentSlide = 0;
        setTrackPos(track, false);
      } else if (merchCurrentSlide < 0) {
        merchCurrentSlide = merchItemCount - 1;
        setTrackPos(track, false);
      }
    });

    restartMerchInterval();
  }

  function setTrackPos(track, animate) {
    var offset = (merchCurrentSlide + MERCH_VISIBLE) * MERCH_CARD_W;
    if (!animate) {
      track.classList.add("no-transition");
      track.offsetHeight; // force reflow
    }
    track.style.transform = "translateX(-" + offset + "px)";
    if (!animate) {
      track.offsetHeight;
      track.classList.remove("no-transition");
    }
  }

  // Merch collapse toggle with localStorage persistence
  (function () {
    var section = document.getElementById("merch-section");
    var toggle = document.getElementById("merch-toggle");
    if (!section || !toggle) return;
    if (localStorage.getItem("merchCollapsed") === "true") {
      section.classList.add("collapsed");
      toggle.textContent = "Show";
    }
    toggle.addEventListener("click", function () {
      var collapsed = section.classList.toggle("collapsed");
      toggle.textContent = collapsed ? "Show" : "Hide";
      localStorage.setItem("merchCollapsed", collapsed);
      if (!collapsed && !merchLoaded && merchPokemon) {
        fetchMerchListings(merchPokemon);
      }
      if (collapsed) {
        clearInterval(merchInterval);
      } else {
        var carousel = document.getElementById("merch-carousel");
        var track = carousel ? carousel.querySelector(".merch-track") : null;
        if (track && merchItemCount > MERCH_VISIBLE) {
          merchInterval = setInterval(function () {
            merchCurrentSlide++;
            setTrackPos(track, true);
          }, 5000);
        }
      }
    });
  })();

  function escapeAttr(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;")
              .replace(/'/g, "&#39;")
              .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // export-data attributes hold JSON; values like "King's Rock" must not
  // break the attribute or crash updatePage, so parse defensively.
  function parseExportData(el) {
    var d = $(el).attr("export-data");
    if (!d) return null;
    try {
      return JSON.parse(d);
    } catch (e) {
      return null;
    }
  }

  // ========== EXPORT STATE ==========
  var exportItem = "";
  var exportAbility = "";
  var exportTeraType = "";
  var exportNature = "";
  var exportMoves = [];

  function initExportState(data) {
    exportMoves = [];
    exportItem = "";
    exportAbility = "";
    exportTeraType = "";
    exportNature = "";

    if (data.items_list && data.items_list.length > 0) {
      exportItem = data.items_list[0][0];
    }
    if (data.abilities_list && data.abilities_list.length > 0) {
      exportAbility = data.abilities_list[0][0];
    }
    if (data.tera_types_list && data.tera_types_list.length > 0) {
      exportTeraType = data.tera_types_list[0][0];
    }
    if (data.natures_list && data.natures_list.length > 0) {
      exportNature = data.natures_list[0][0];
    }
    if (data.moves_list && data.moves_list.length > 0) {
      for (var i = 0; i < Math.min(4, data.moves_list.length); i++) {
        exportMoves.push(data.moves_list[i][0]);
      }
    }
    updateExportHighlights();
    updateShowdownSet();
  }

  function generateShowdownSet() {
    var showdownSet = currentPokemonName;
    if (exportItem) {
      showdownSet += " @ " + exportItem;
    }
    showdownSet += "\nAbility: " + exportAbility;
    showdownSet += "\nLevel: 50";
    if (exportTeraType) {
      showdownSet += "\nTera Type: " + exportTeraType;
    }
    showdownSet += "\n" + exportNature + " Nature";
    exportMoves.forEach(function (move) {
      showdownSet += "\n- " + move;
    });
    return showdownSet;
  }

  function updateShowdownSet() {
    var el = document.getElementById("showdown-set");
    if (el) el.value = generateShowdownSet();
  }

  function updateExportHighlights() {
    $("#moves-container .export-button").each(function () {
      var parsed = parseExportData(this);
      if (!parsed) return;
      $(this).toggleClass("selected", exportMoves.indexOf(parsed.move) !== -1);
    });
    $("#items-container .export-button").each(function () {
      var parsed = parseExportData(this);
      if (!parsed) return;
      $(this).toggleClass("selected", parsed.item === exportItem);
    });
    $("#abilities-container .export-button").each(function () {
      var parsed = parseExportData(this);
      if (!parsed) return;
      $(this).toggleClass("selected", parsed.ability === exportAbility);
    });
    $("#tera-container .export-button").each(function () {
      var parsed = parseExportData(this);
      if (!parsed) return;
      $(this).toggleClass("selected", parsed.tera === exportTeraType);
    });
    $("#natures-container .export-button").each(function () {
      var parsed = parseExportData(this);
      if (!parsed) return;
      $(this).toggleClass("selected", parsed.nature === exportNature);
    });
  }

  // ========== EXPORT BUTTON HANDLER ==========
  $(document).on("click", "#usage-view .export-button", function () {
    var data = parseExportData(this);
    if (!data) return;

    if (typeof data.move === "string") {
      if ($(this).hasClass("selected")) {
        var pos = exportMoves.indexOf(data.move);
        if (pos !== -1) exportMoves.splice(pos, 1);
      } else {
        exportMoves.push(data.move);
        if (exportMoves.length > 4) exportMoves.shift();
      }
    }
    if (typeof data.item === "string") {
      exportItem = $(this).hasClass("selected") ? "" : data.item;
    }
    if (typeof data.ability === "string") {
      exportAbility = $(this).hasClass("selected") ? "" : data.ability;
    }
    if (typeof data.tera === "string") {
      exportTeraType = $(this).hasClass("selected") ? "" : data.tera;
    }
    if (typeof data.nature === "string") {
      exportNature = $(this).hasClass("selected") ? "" : data.nature;
    }

    updateExportHighlights();
    updateShowdownSet();
  });

  // ========== COPY BUTTON ==========
  $(document).on("click", "#copy-button", function () {
    var textToCopy = document.getElementById("showdown-set").value;
    navigator.clipboard.writeText(textToCopy).then(function () {
      document.getElementById("copy-button").textContent = "Copied!";
      setTimeout(function () {
        document.getElementById("copy-button").textContent = t("Copy Pokemon to Clipboard");
      }, 2000);
    });
  });

  // ========== TEAM CARDS (shared by all team lists) ==========
  function teamToShowdown(team) {
    var lines = [];
    team.forEach(function (slot) {
      var header = slot.pokemon;
      if (slot.item) header += " @ " + slot.item;
      lines.push(header);
      if (slot.ability) lines.push("Ability: " + slot.ability);
      if (slot.tera_type) lines.push("Tera Type: " + slot.tera_type);
      if (slot.nature) lines.push(slot.nature + " Nature");
      if (slot.moves) {
        slot.moves.forEach(function (m) { lines.push("- " + m); });
      }
      lines.push("");
    });
    return lines.join("\n").trim();
  }

  // Official entries use placement/name, Limitless ones placing/player;
  // normalize here so one card builder serves every list.
  function buildTeamEntryHtml(entry, prefix, idx, opts) {
    var placing = entry.placing != null ? entry.placing : entry.placement;
    var player = entry.player || entry.name || "";
    var t = entry.tournament || null;
    var placementClass = opts.muted ? "team-placement team-standing" : "team-placement";

    var html = '<div class="team-card" onclick="toggleTeamDetail(\'' + prefix + '\', ' + idx + ')">';
    html += '<span class="' + placementClass + '">#' + placing + '</span>';
    html += '<span class="team-player">' + escapeAttr(player);
    if (entry.record && entry.record.wins !== undefined) {
      html += ' <span class="team-record">(' + entry.record.wins + '-' + entry.record.losses + ')</span>';
    }
    html += '</span>';
    if (opts.showTournament && t) {
      html += '<span class="team-tournament">' + escapeAttr(t.name || "") +
              (t.players ? ' &middot; ' + t.players + ' players' : '') + '</span>';
    }
    html += '<span class="team-sprites">';
    entry.team.forEach(function (slot) {
      var bgPos = (slot.sprite[1] * -40) + "px " + (slot.sprite[0] * -30) + "px";
      html += '<div class="image-pokemon" style="background-position: ' + bgPos + ';" title="' + escapeAttr(slot.pokemon) + '"></div>';
    });
    html += '</span>';
    html += '</div>';

    html += '<div class="team-detail" id="' + prefix + '-detail-' + idx + '">';
    html += '<div class="team-detail-grid">';
    entry.team.forEach(function (slot) {
      html += '<div class="team-detail-pokemon">';
      html += '<div class="td-name">' + escapeAttr(slot.pokemon) + '</div>';
      html += '<div class="td-info">';
      if (slot.tera_type) html += 'Tera: ' + escapeAttr(slot.tera_type) + '<br>';
      if (slot.nature) html += 'Nature: ' + escapeAttr(slot.nature) + '<br>';
      if (slot.ability) html += 'Ability: ' + escapeAttr(slot.ability) + '<br>';
      if (slot.item) html += 'Item: ' + escapeAttr(slot.item) + '<br>';
      if (slot.moves && slot.moves.length > 0) {
        slot.moves.forEach(function (m) { html += '- ' + escapeAttr(m) + '<br>'; });
      }
      html += '</div></div>';
    });
    html += '</div>';
    html += '<button class="team-copy-btn" onclick="copyTeam(event, \'' + prefix + '\', ' + idx + ')">Copy Team to Clipboard</button>';
    html += '</div>';
    return html;
  }

  function renderTeamEntries(entries, container, prefix, opts) {
    if (!entries || entries.length === 0) {
      container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">' + t("No teams found.") + '</p>';
      return;
    }
    var html = "";
    entries.forEach(function (entry, idx) {
      html += buildTeamEntryHtml(entry, prefix, idx, opts || {});
    });
    container.innerHTML = html;
    window._teamEntries = window._teamEntries || {};
    window._teamEntries[prefix] = entries;
  }

  window.toggleTeamDetail = function (prefix, idx) {
    var el = document.getElementById(prefix + "-detail-" + idx);
    if (el) {
      el.classList.toggle("open");
    }
  };

  window.copyTeam = function (event, prefix, idx) {
    event.stopPropagation();
    var entries = (window._teamEntries || {})[prefix];
    if (!entries || !entries[idx]) return;
    var text = teamToShowdown(entries[idx].team);
    navigator.clipboard.writeText(text).then(function () {
      var btn = event.target;
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(function () {
        btn.textContent = t("Copy Team to Clipboard");
        btn.classList.remove("copied");
      }, 2000);
    });
  };

  // ========== TEAMS WITH SELECTED POKEMON ==========
  async function loadTeams() {
    var container = document.getElementById("teams-list");
    if (!container) return;
    container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">' + t("Loading teams...") + '</p>';

    var url;
    var opts;
    if (currentSource === "limitless") {
      url = "/limitless/api/" + encodeURIComponent(currentFormatId) +
            "/teams/" + encodeURIComponent(currentPokemonName) +
            "?min=" + encodeURIComponent(currentSegment) +
            "&cut=" + encodeURIComponent(currentCut);
      opts = { muted: true, showTournament: true };
    } else if (currentSource === "limitless_event") {
      // Single event: placings are real standings, no tournament column
      url = "/limitless/api/event/" + encodeURIComponent(currentEventId) +
            "/teams/" + encodeURIComponent(currentPokemonName) +
            "?cut=" + encodeURIComponent(currentCut);
      opts = {};
    } else {
      url = "/tournaments/api/" + encodeURIComponent(currentTournamentId) +
            "/teams/" + encodeURIComponent(currentPokemonName) +
            "?day=" + encodeURIComponent(currentDayFilter);
      opts = {};
    }

    try {
      var res = await fetch(url);
      if (!res.ok) {
        container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">' + t("No teams found.") + '</p>';
        return;
      }
      renderTeamEntries(await res.json(), container, "teams", opts);
    } catch (e) {
      container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">' + t("Failed to load teams.") + '</p>';
    }
  }

  // ========== STANDINGS VIEW (official events + single online events) ==========
  // The full list can run to hundreds of team cards (an 800+ player
  // online event), which lags mobile browsers, so standings render in
  // pages: search runs over the full fetched data, the DOM only holds
  // what's shown, and "Show all" remains available.
  var STANDINGS_PAGE = 50;
  var standingsData = [];
  var standingsLimit = STANDINGS_PAGE;

  async function loadStandings() {
    var container = document.getElementById("standings-list");
    if (!container) return;
    container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">' + t("Loading standings...") + '</p>';

    var url;
    if (currentSource === "limitless_event") {
      url = "/limitless/api/event/" + encodeURIComponent(currentEventId) +
            "/standings?cut=" + encodeURIComponent(currentCut);
    } else {
      url = "/tournaments/api/" + encodeURIComponent(currentTournamentId) +
            "/standings?day=" + encodeURIComponent(currentDayFilter);
    }

    try {
      var res = await fetch(url);
      if (!res.ok) {
        container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">' + t("No standings available.") + '</p>';
        return;
      }
      standingsData = await res.json();
      standingsData.forEach(function (entry) {
        entry._search = buildSearchIndex(entry);
      });
      standingsLimit = STANDINGS_PAGE;
      renderStandings();
    } catch (e) {
      container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">Failed to load standings.</p>';
    }
  }

  // Slot-scoped search index, mirroring the teams page: one string per
  // team member plus a metadata string, so "kingambit focus sash" must
  // match a single slot — a Kingambit *holding* a Focus Sash.
  function buildSearchIndex(entry) {
    var slots = entry.team.map(function (slot) {
      var parts = [slot.pokemon];
      if (slot.item) parts.push(slot.item);
      if (slot.ability) parts.push(slot.ability);
      if (slot.tera_type) parts.push(slot.tera_type);
      if (slot.nature) parts.push(slot.nature);
      if (slot.moves) parts = parts.concat(slot.moves);
      return parts.join(" ").toLowerCase();
    });
    return {
      slots: slots,
      meta: (entry.name || entry.player || "").toLowerCase(),
    };
  }

  // "kingambit focus sash, garchomp" -> [["kingambit","focus","sash"],
  // ["garchomp"]]; empty groups from stray commas are dropped.
  function parseSearchGroups(query) {
    var groups = [];
    query.toLowerCase().split(",").forEach(function (part) {
      var terms = part.split(/\s+/).filter(function (t) { return t; });
      if (terms.length) groups.push(terms);
    });
    return groups;
  }

  function entryMatchesGroups(index, groups) {
    return groups.every(function (terms) {
      var slotHit = index.slots.some(function (slot) {
        return terms.every(function (t) { return slot.indexOf(t) !== -1; });
      });
      if (slotHit) return true;
      return terms.every(function (t) { return index.meta.indexOf(t) !== -1; });
    });
  }

  function renderStandings() {
    var container = document.getElementById("standings-list");
    if (!container) return;
    var groups = parseSearchGroups($("#standingsSearchInput").val() || "");
    var matched = groups.length
      ? standingsData.filter(function (e) { return entryMatchesGroups(e._search, groups); })
      : standingsData;

    if (matched.length === 0) {
      container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">' + t("No standings available.") + '</p>';
      window._teamEntries = window._teamEntries || {};
      window._teamEntries["standings"] = [];
      return;
    }

    var shown = matched.slice(0, standingsLimit);
    var html = "";
    shown.forEach(function (entry, idx) {
      html += buildTeamEntryHtml(entry, "standings", idx, {});
    });
    if (matched.length > shown.length) {
      html += '<div class="show-more-row">';
      html += '<button type="button" class="team-copy-btn" onclick="showMoreStandings(false)">Show ' +
        Math.min(100, matched.length - shown.length) + ' more</button>';
      html += '<button type="button" class="team-copy-btn" onclick="showMoreStandings(true)">' + t("Show all") + ' ' +
        matched.length + '</button>';
      html += '</div>';
    }
    container.innerHTML = html;
    // Detail toggles and copy buttons look entries up by rendered index
    window._teamEntries = window._teamEntries || {};
    window._teamEntries["standings"] = shown;
  }

  window.showMoreStandings = function (all) {
    standingsLimit = all ? Infinity : standingsLimit + 100;
    renderStandings();
  };

  $("#standingsSearchInput").on("input", function () {
    standingsLimit = STANDINGS_PAGE;
    renderStandings();
  });

  // ========== TOP TEAMS VIEW (Limitless archetypes, server-side search) ==========
  var resultsLoadedFor = null; // format + segment + query the list currently shows

  function renderArchetypes(archetypes, container) {
    if (!archetypes || archetypes.length === 0) {
      container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">' + t("No teams found.") + '</p>';
      return;
    }

    var html = "";
    archetypes.forEach(function (a, idx) {
      var topPlayer = a.players.length ? a.players[0].player : "";
      html += '<div class="team-card" onclick="toggleArchetype(' + idx + ')">';
      html += '<span class="team-placement">#' + (idx + 1) + '</span>';
      html += '<span class="team-player">' + a.count + (a.count === 1 ? ' team' : ' teams');
      html += ' <span class="team-record">(' + a.points + ' pts';
      if (a.win_rate !== null && a.win_rate !== undefined) {
        html += ' &middot; ' + a.win_rate + '% WR';
      }
      html += ')</span>';
      html += '</span>';
      html += '<span class="team-tournament">' + escapeAttr(topPlayer) +
              (a.count > 1 ? ' +' + (a.count - 1) + ' more' : '') + '</span>';
      html += '<span class="team-sprites">';
      a.pokemon.forEach(function (p) {
        var bgPos = (p.sprite[1] * -40) + "px " + (p.sprite[0] * -30) + "px";
        html += '<div class="image-pokemon" style="background-position: ' + bgPos + ';" title="' + escapeAttr(p.name) + '"></div>';
      });
      html += '</span>';
      html += '</div>';
      html += '<div class="team-detail" id="arch-detail-' + idx + '"><div id="arch-players-' + idx + '"></div></div>';
    });

    container.innerHTML = html;
    window._archetypes = archetypes;
  }

  window.toggleArchetype = function (idx) {
    var el = document.getElementById("arch-detail-" + idx);
    if (!el) return;
    var opened = el.classList.toggle("open");
    var playersEl = document.getElementById("arch-players-" + idx);
    if (opened && playersEl && !playersEl.hasChildNodes()) {
      var a = (window._archetypes || [])[idx];
      if (!a) return;
      renderTeamEntries(a.players, playersEl, "arch" + idx, { muted: true, showTournament: true });
      if (a.count > a.players.length) {
        playersEl.innerHTML += '<p style="color: var(--text-disabled); font-size: 12px;">Showing the top ' +
          a.players.length + ' of ' + a.count + ' teams.</p>';
      }
    }
  };

  async function loadResults() {
    var container = document.getElementById("results-list");
    if (!container) return;
    var query = ($("#resultsSearchInput").val() || "").trim();
    var cacheKey = currentFormatId + " " + currentSegment + " " + currentCut + " " + query;
    if (resultsLoadedFor === cacheKey) return;

    container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">' + t("Loading teams...") + '</p>';
    var url = "/limitless/api/" + encodeURIComponent(currentFormatId) +
              "/results/?min=" + encodeURIComponent(currentSegment) +
              "&cut=" + encodeURIComponent(currentCut) +
              "&q=" + encodeURIComponent(query);
    try {
      var res = await fetch(url);
      if (!res.ok) {
        container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">' + t("No teams found.") + '</p>';
        return;
      }
      renderArchetypes(await res.json(), container);
      resultsLoadedFor = cacheKey;
    } catch (e) {
      container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">' + t("Failed to load teams.") + '</p>';
    }
  }

  var resultsSearchTimer = null;
  $("#resultsSearchInput").on("input", function () {
    clearTimeout(resultsSearchTimer);
    resultsSearchTimer = setTimeout(loadResults, 300);
  });

  // ========== EVENTS BROWSER (individual Limitless tournaments) ==========
  function eventCard(t) {
    return '<div class="team-card" onclick="selectEvent(\'' + escapeAttr(t.id) + '\')">' +
      '<span class="event-date">' + escapeAttr((t.date || "").slice(0, 10)) + '</span>' +
      '<span class="team-player" style="flex: 1;">' + escapeAttr(t.name || "") + '</span>' +
      '<span class="team-record">' + (t.players || 0) + ' players</span>' +
      '</div>';
  }

  function renderEventsList() {
    var container = document.getElementById("events-list");
    if (!container) return;
    var query = ($("#eventsSearchInput").val() || "").toLowerCase();
    var minPlayers = parseInt(currentSegment, 10) || 0;
    var events = (includedTournaments || []).filter(function (t) {
      return (t.players || 0) >= minPlayers &&
        (!query || (t.name || "").toLowerCase().indexOf(query) !== -1);
    });

    $("#events-count").text(
      events.length + (events.length === 1 ? " tournament" : " tournaments") +
      (minPlayers ? " · " + minPlayers + "+ players" : "")
    );
    if (events.length === 0) {
      container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px;">' + t("No tournaments found.") + '</p>';
      return;
    }

    // Searching: one flat filtered list (already newest-first).
    if (query) {
      container.innerHTML = events.map(eventCard).join("");
      return;
    }

    // Browsing: the biggest fields first, then everything by date.
    var html = "";
    var largest = events.slice().sort(function (a, b) {
      return (b.players || 0) - (a.players || 0);
    }).slice(0, 8);
    if (largest.length > 2) {
      html += '<h2 class="ov-section-title">' + t("Largest Fields") + '</h2>';
      html += largest.map(eventCard).join("");
      html += '<h2 class="ov-section-title" style="margin-top: 18px;">' + t("Most Recent") + '</h2>';
    }
    html += events.map(eventCard).join("");
    container.innerHTML = html;
  }

  $("#eventsSearchInput").on("input", renderEventsList);

  // ========== TOURNAMENT OVERVIEW (official events) ==========
  // Per-stage top-10 usage (Day 1 / Day 2 / Top Cut) with the usage
  // delta vs the previous stage, plus the biggest movers per transition.
  // For onclick='selectPokemon(...)' handlers: Pokemon names carry no
  // HTML metacharacters, but apostrophes (Sirfetch'd) must be escaped
  // for the JS string, not HTML-escaped (entities would decode back to
  // raw quotes before the JS parses).
  function ovName(name) {
    return String(name).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function ovMonCell(row) {
    var bg = (row.sprite[1] * -40) + "px " + (row.sprite[0] * -30) + "px";
    return '<td class="mon-cell"><span class="ov-sprite" style="background-position: ' +
      bg + ';"></span>' + escapeAttr(row.name) + '</td>';
  }

  function ovDelta(delta, decorate) {
    if (delta === null || delta === undefined) return '<td class="ov-dim">—</td>';
    var cls = delta > 0 ? "ov-pos" : (delta < 0 ? "ov-neg" : "ov-dim");
    var sign = delta > 0 ? "+" : "";
    return '<td class="' + (decorate || cls) + '">' + sign + delta.toFixed(1) + '</td>';
  }

  function renderOverview() {
    var container = document.getElementById("overview-content");
    if (!container) return;
    if (!hubOverview || !hubOverview.stages || !hubOverview.stages.length) {
      container.innerHTML = '<p style="color: var(--text-disabled); font-size: 13px; text-align: left;">' +
        'No stage data is available for this tournament yet.</p>';
      return;
    }

    var html = '<h2 class="ov-section-title">' + t("Top Usage by Stage") + '</h2>' +
      '<p class="ov-sub">' + t("Most used Pokemon at each stage of the tournament. Δ is the change in usage share (percentage points) from the previous stage. Click a Pokemon for its full stats.") + '</p>';
    html += '<div class="ov-panels">';
    hubOverview.stages.forEach(function (stage) {
      html += '<div class="ov-panel"><h3>' + escapeAttr(t(stage.label)) + '</h3>';
      html += '<p class="ov-panel-sub">' + stage.total_teams +
        (stage.total_teams === 1 ? " team" : " teams") + '</p>';
      html += '<table><tr><th class="mon-col">Pokemon</th><th>Usage</th><th>Δ</th></tr>';
      stage.rows.forEach(function (row) {
        html += '<tr class="ov-row" onclick="selectPokemon(\'' + ovName(row.name) + '\')">';
        html += ovMonCell(row);
        html += '<td>' + row.usage_pct.toFixed(1) + '%</td>';
        html += ovDelta(row.delta);
        html += '</tr>';
      });
      html += '</table></div>';
    });
    html += '</div>';

    if (hubOverview.movers && hubOverview.movers.length) {
      html += '<h2 class="ov-section-title">' + t("Biggest Movers") + '</h2>' +
        '<p class="ov-sub">' + t("Largest changes in usage share between stages — a quick read on what worked and what didn't.") + '</p>';
      html += '<div class="ov-panels">';
      hubOverview.movers.forEach(function (transition) {
        html += '<div class="ov-panel"><h3>' + escapeAttr(t(transition.label)) + '</h3>';
        html += '<table><tr><th class="mon-col">Pokemon</th><th>From</th><th>To</th><th>Δ</th></tr>';
        transition.gains.concat(transition.drops).forEach(function (row) {
          html += '<tr class="ov-row" onclick="selectPokemon(\'' + ovName(row.name) + '\')">';
          html += ovMonCell(row);
          html += '<td class="ov-dim">' + row.prev_pct.toFixed(1) + '%</td>';
          html += '<td>' + row.usage_pct.toFixed(1) + '%</td>';
          html += ovDelta(row.delta);
          html += '</tr>';
        });
        html += '</table></div>';
      });
      html += '</div>';
    }
    container.innerHTML = html;
  }

  // ========== VIEW TOGGLE ==========
  // The secondary view depends on the source: Standings for official
  // events and single online events, Top Teams (archetypes) for
  // Limitless formats. The Events browser exists only on the format.
  function updateEventsButton() {
    var btn = $("#btn-events-view");
    if (currentSource === "limitless") {
      btn.show().text(t("Events")).toggleClass("active", currentView === "events");
    } else if (currentSource === "limitless_event") {
      btn.show().html("&#8249; " + t("All Events")).removeClass("active");
    } else {
      btn.hide();
    }
    // The overview exists per tournament: official events and single
    // online events, but not the rolling format aggregate.
    $("#btn-overview-view").toggle(currentSource !== "limitless")
      .toggleClass("active", currentView === "overview");
  }

  function applyView(load) {
    var usageView = document.getElementById("usage-view");
    var standingsView = document.getElementById("standings-view");
    var resultsView = document.getElementById("results-view");
    var eventsView = document.getElementById("events-view");
    var overviewView = document.getElementById("overview-view");

    if (currentView === "events" && currentSource !== "limitless") {
      currentView = "usage";
    }
    if (currentView === "overview" && currentSource === "limitless") {
      currentView = "usage";
    }
    var secondary = currentSource === "limitless" ? resultsView : standingsView;

    usageView.style.display = "none";
    standingsView.style.display = "none";
    resultsView.style.display = "none";
    eventsView.style.display = "none";
    overviewView.style.display = "none";

    if (currentView === "secondary") {
      secondary.style.display = "grid";
      if (load) {
        if (currentSource === "limitless") {
          loadResults();
        } else {
          loadStandings();
        }
      }
    } else if (currentView === "events") {
      eventsView.style.display = "grid";
      renderEventsList();
    } else if (currentView === "overview") {
      overviewView.style.display = "grid";
      renderOverview();
    } else {
      usageView.style.display = "grid";
    }
    $("#btn-usage-view").toggleClass("active", currentView === "usage");
    $("#btn-secondary-view").toggleClass("active", currentView === "secondary");
    updateEventsButton();
  }

  window.switchView = function (view) {
    currentView = view === "secondary" || view === "events" || view === "overview"
      ? view : "usage";
    applyView(true);
  };

  // ========== GLOBAL SELECTION FUNCTIONS ==========
  // Switching tournament/format/event carries the selected Pokemon
  // along; the server falls back to the top-usage Pokemon when it
  // isn't present in the new dataset. Until a Pokemon has actually
  // been picked, sidebar navigation lands on the tournament-level
  // view: the overview for events, the events browser for a format.
  window.selectTournament = function (id) {
    if (!pokemonRequested) currentView = "overview";
    fetchOfficialData(id, currentDayFilter || "all", currentPokemonName);
  };

  window.selectFormat = function (id) {
    if (!pokemonRequested) currentView = "events";
    // First visit to the online source in this session: the server
    // clamps an unknown segment to the smallest available tier.
    fetchLimitlessData(id, currentSegment || "25", currentPokemonName);
  };

  window.selectDayFilter = function (filter) {
    fetchOfficialData(currentTournamentId, filter, currentPokemonName);
  };

  window.selectSegment = function (segment) {
    fetchLimitlessData(currentFormatId, segment, currentPokemonName);
  };

  window.selectCut = function (cut) {
    currentCut = cut;
    if (currentSource === "limitless_event") {
      fetchEventData(currentEventId, currentPokemonName);
    } else {
      fetchLimitlessData(currentFormatId, currentSegment, currentPokemonName);
    }
  };

  window.selectEvent = function (id) {
    currentView = pokemonRequested ? "usage" : "overview";
    fetchEventData(id, currentPokemonName);
  };

  // One button, two jobs: opens the events browser on a format page,
  // returns to it from a single event page.
  window.eventsButton = function () {
    if (currentSource === "limitless_event") {
      currentView = "events";
      fetchLimitlessData(currentFormatId, currentSegment || "25", currentPokemonName);
    } else if (currentSource === "limitless") {
      switchView("events");
    }
  };

  window.selectPokemon = function (name) {
    // Picking a Pokemon is the handoff from the tournament-level views
    // to its usage cards.
    pokemonRequested = true;
    if (currentView === "overview" || currentView === "events") {
      currentView = "usage";
    }
    if (currentSource === "limitless") {
      fetchLimitlessData(currentFormatId, currentSegment, name);
    } else if (currentSource === "limitless_event") {
      fetchEventData(currentEventId, name);
    } else {
      fetchOfficialData(currentTournamentId, currentDayFilter, name);
    }
  };

  // ========== BROWSER HISTORY ==========
  window.addEventListener("popstate", function (event) {
    if (event.state) {
      currentCut = event.state.cut || "all";
      if (event.state.source === "limitless") {
        fetchLimitlessData(event.state.format, event.state.segment, event.state.pokemon, true);
      } else if (event.state.source === "limitless_event") {
        fetchEventData(event.state.event, event.state.pokemon, true);
      } else {
        fetchOfficialData(event.state.tournament, event.state.day, event.state.pokemon, true);
      }
    }
  });

  history.replaceState({
    source: currentSource,
    tournament: currentTournamentId,
    day: currentDayFilter,
    format: currentFormatId,
    segment: currentSegment,
    event: currentEventId,
    cut: currentCut,
    pokemon: currentPokemonName,
  }, "");

  // ========== INITIAL LOAD ==========
  // Keep the active tournament/format visible in the merged sidebar list
  (function () {
    var listContainer = document.getElementById("source-list-container");
    var activeBtn = document.querySelector("#source-list .meta-button.active");
    if (listContainer && activeBtn) {
      var offset = activeBtn.getBoundingClientRect().top -
                   listContainer.getBoundingClientRect().top;
      var target = offset - (listContainer.clientHeight - activeBtn.offsetHeight) / 2;
      if (target > 0) listContainer.scrollTop = target;
    }
  })();

  // No Pokemon in the URL: open on the tournament-level view — the
  // overview for events, the events browser for a Limitless format —
  // instead of the defaulted top-usage Pokemon.
  if (!pokemonRequested) {
    currentView = currentSource === "limitless" ? "events" : "overview";
    applyView(false);
  }

  // Deep link: /limitless/...?view=results&q=... opens the Team Results
  // view with a pre-filled search (used by the Insights winning-cores
  // rows to show the actual teams running a core).
  (function () {
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q");
    if (currentSource === "limitless" && (params.get("view") === "results" || query)) {
      if (query) $("#resultsSearchInput").val(query);
      switchView("secondary");
    }
  })();

  if (currentPokemonName) {
    loadTeams();
    updateMerchSection(currentPokemonName);

    // Initialize export from server-rendered data
    var initialData = { moves_list: [], items_list: [], abilities_list: [], tera_types_list: [], natures_list: [] };
    $("#moves-container .export-button").each(function () {
      var parsed = parseExportData(this);
      if (parsed) initialData.moves_list.push([parsed.move]);
    });
    $("#items-container .export-button").each(function () {
      var parsed = parseExportData(this);
      if (parsed) initialData.items_list.push([parsed.item]);
    });
    $("#abilities-container .export-button").each(function () {
      var parsed = parseExportData(this);
      if (parsed) initialData.abilities_list.push([parsed.ability]);
    });
    $("#tera-container .export-button").each(function () {
      var parsed = parseExportData(this);
      if (parsed) initialData.tera_types_list.push([parsed.tera]);
    });
    $("#natures-container .export-button").each(function () {
      var parsed = parseExportData(this);
      if (parsed) initialData.natures_list.push([parsed.nature]);
    });
    initExportState(initialData);
  }
});
