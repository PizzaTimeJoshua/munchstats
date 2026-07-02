$(document).ready(function () {
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
  var currentFormatId = window.currentFormatId;
  var currentSegment = window.currentSegment;
  var currentPokemonName = window.currentPokemonName;
  var isLoading = false;

  // ========== SEARCH FILTER ==========
  $("#pokemonSearchInput").on("input", function () {
    var query = $(this).val().toLowerCase();
    $("#pokemon-list li").each(function () {
      var text = $(this).text().toLowerCase();
      $(this).toggle(text.indexOf(query) !== -1);
    });
  });

  // ========== DATA FETCHING ==========
  async function fetchLimitlessData(formatId, segment, pokemonName) {
    if (isLoading) return;
    isLoading = true;
    document.getElementById("loading-overlay").classList.add("active");

    var url = "/limitless/api/" + encodeURIComponent(formatId) +
              "/" + encodeURIComponent(segment) + "/";
    if (pokemonName) {
      url += encodeURIComponent(pokemonName);
    }

    try {
      var res = await fetch(url);
      if (!res.ok) {
        isLoading = false;
        document.getElementById("loading-overlay").classList.remove("active");
        return;
      }
      var data = await res.json();
      updatePage(data);

      // Update URL
      var newUrl = "/limitless/" + data.selected_format_id + "/" +
                   data.segment + "/" + data.selected_pokemon;
      history.pushState({
        format: data.selected_format_id,
        segment: data.segment,
        pokemon: data.selected_pokemon
      }, "", newUrl);
    } catch (e) {
      console.error("Failed to fetch Limitless data:", e);
    }

    isLoading = false;
    document.getElementById("loading-overlay").classList.remove("active");
  }

  function updatePage(data) {
    currentFormatId = data.selected_format_id;
    currentSegment = data.segment;
    currentPokemonName = data.selected_pokemon;

    // Update pokemon info card
    var cp = data.current_pokemon;
    var sprite = cp[3];
    $("#info-sprite").css("background-position", (sprite[1] * -40) + "px " + (sprite[0] * -30) + "px");
    $("#info-name").text(cp[0]);
    $("#info-usage").text(cp[1] + "%");
    $("#info-rank").text("#" + cp[2]);
    $("#info-winrate").text(data.win_rate === "—" ? data.win_rate : data.win_rate + "%");
    $("#info-teams").text(data.total_teams);
    $("#info-summary").text(
      data.selected_format_name + " · " + data.tournament_count +
      " tournaments · last " + data.window_days + " days · " +
      data.min_players + "+ players"
    );

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

    // Update format list highlights
    $("#format-list .meta-button").removeClass("active");
    $("#format-list .meta-button").each(function () {
      var onclick = $(this).attr("onclick") || "";
      if (onclick.indexOf('"' + currentFormatId + '"') !== -1) {
        $(this).addClass("active");
      }
    });

    // Update segment filter highlights
    $("#segment-filter-container .rating-button").removeClass("active");
    $("#segment-filter-container .rating-button").each(function () {
      var onclick = $(this).attr("onclick") || "";
      if (onclick.indexOf("'" + currentSegment + "'") !== -1) {
        $(this).addClass("active");
      }
    });

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
  }

  function updateDataSection(containerId, dataList, type) {
    var container = $(containerId);
    if (!dataList || dataList.length === 0) {
      container.html("");
      return;
    }
    var html = "<ul>";
    dataList.forEach(function (entry) {
      var exportAttr = ' export-data=\'' + JSON.stringify(buildExportData(type, entry[0])) + '\'';
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
        var tooltip = entry.length > 2 ? ' has-tooltip" data-tooltip="' + escapeAttr(entry[2]) : '';
        html += '<li><button type="button" class="export-button' + tooltip + '"' + exportAttr + '>' +
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
    return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
              .replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
      var d = $(this).attr("export-data");
      if (!d) return;
      var parsed = JSON.parse(d);
      $(this).toggleClass("selected", exportMoves.indexOf(parsed.move) !== -1);
    });
    $("#items-container .export-button").each(function () {
      var d = $(this).attr("export-data");
      if (!d) return;
      var parsed = JSON.parse(d);
      $(this).toggleClass("selected", parsed.item === exportItem);
    });
    $("#abilities-container .export-button").each(function () {
      var d = $(this).attr("export-data");
      if (!d) return;
      var parsed = JSON.parse(d);
      $(this).toggleClass("selected", parsed.ability === exportAbility);
    });
    $("#tera-container .export-button").each(function () {
      var d = $(this).attr("export-data");
      if (!d) return;
      var parsed = JSON.parse(d);
      $(this).toggleClass("selected", parsed.tera === exportTeraType);
    });
    $("#natures-container .export-button").each(function () {
      var d = $(this).attr("export-data");
      if (!d) return;
      var parsed = JSON.parse(d);
      $(this).toggleClass("selected", parsed.nature === exportNature);
    });
  }

  // ========== EXPORT BUTTON HANDLER ==========
  $(document).on("click", "#usage-view .export-button", function () {
    var exportDataText = $(this).attr("export-data");
    if (!exportDataText) return;
    var data = JSON.parse(exportDataText);

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
        document.getElementById("copy-button").textContent = "Copy Pokemon to Clipboard";
      }, 2000);
    });
  });

  // ========== GLOBAL SELECTION FUNCTIONS ==========
  window.selectFormat = function (id) {
    currentFormatId = id;
    fetchLimitlessData(id, currentSegment, "");
  };

  window.selectSegment = function (segment) {
    currentSegment = segment;
    fetchLimitlessData(currentFormatId, segment, currentPokemonName);
  };

  window.selectPokemon = function (name) {
    currentPokemonName = name;
    fetchLimitlessData(currentFormatId, currentSegment, name);
  };

  // ========== BROWSER HISTORY ==========
  window.addEventListener("popstate", function (event) {
    if (event.state) {
      fetchLimitlessData(event.state.format, event.state.segment, event.state.pokemon);
    }
  });

  history.replaceState({
    format: currentFormatId,
    segment: currentSegment,
    pokemon: currentPokemonName
  }, "");

  // ========== INITIAL LOAD ==========
  if (currentPokemonName) {
    updateMerchSection(currentPokemonName);

    // Initialize export from server-rendered data
    var initialData = { moves_list: [], items_list: [], abilities_list: [], tera_types_list: [], natures_list: [] };
    $("#moves-container .export-button").each(function () {
      var d = $(this).attr("export-data");
      if (d) initialData.moves_list.push([JSON.parse(d).move]);
    });
    $("#items-container .export-button").each(function () {
      var d = $(this).attr("export-data");
      if (d) initialData.items_list.push([JSON.parse(d).item]);
    });
    $("#abilities-container .export-button").each(function () {
      var d = $(this).attr("export-data");
      if (d) initialData.abilities_list.push([JSON.parse(d).ability]);
    });
    $("#tera-container .export-button").each(function () {
      var d = $(this).attr("export-data");
      if (d) initialData.tera_types_list.push([JSON.parse(d).tera]);
    });
    $("#natures-container .export-button").each(function () {
      var d = $(this).attr("export-data");
      if (d) initialData.natures_list.push([JSON.parse(d).nature]);
    });
    initExportState(initialData);
  }
});
