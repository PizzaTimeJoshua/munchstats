$(document).ready(function () {
  // ========== TOOLTIP (event delegation - works with dynamic elements) ==========
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

  // ========== CHART ==========
  var evChart = null;
  var chartStats = [[], [], [], [], [], []];
  var statLabels = [
    "HP",
    "Attack",
    "Defense",
    "Sp. Attack",
    "Sp. Defense",
    "Speed",
  ];

  function sortChartData(dataArray) {
    return dataArray.slice().sort(function (a, b) {
      return a[0] - b[0];
    });
  }
  function convertChartData(dataArray) {
    return dataArray.map(function (pair) {
      return { x: pair[0], y: pair[1] };
    });
  }
  function calculateAxisLimits(dataArray) {
    var xValues = dataArray.map(function (pair) {
      return pair[0];
    });
    var minX = Math.min.apply(null, xValues);
    var maxX = Math.max.apply(null, xValues);
    var yValues = dataArray.map(function (pair) {
      return pair[1];
    });
    var maxY = Math.ceil(Math.max.apply(null, yValues));
    return { minX: minX, maxX: maxX, maxY: maxY };
  }

  function initChart(graphDataString) {
    try {
      chartStats = JSON.parse(graphDataString);
    } catch (e) {
      chartStats = [[], [], [], [], [], []];
    }
    if (evChart) {
      evChart.destroy();
      evChart = null;
    }
    var canvas = document.getElementById("evChart");
    if (
      !canvas ||
      chartStats.every(function (s) {
        return s.length === 0;
      })
    )
      return;
    var currentChartData = sortChartData(chartStats[5]);
    var limits = calculateAxisLimits(currentChartData);
    var ctx = canvas.getContext("2d");
    evChart = new Chart(ctx, {
      type: "bar",
      data: {
        datasets: [
          {
            data: convertChartData(currentChartData),
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            barPercentage: 1,
            categoryPercentage: 1,
          },
        ],
      },
      options: {
        interaction: { mode: "nearest", intersect: false },
        plugins: {
          tooltip: { intersect: false },
          legend: { display: false },
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: limits.maxY,
            ticks: {
              stepSize: 1,
              callback: function (value) {
                return value + "%";
              },
            },
          },
          x: {
            type: "linear",
            position: "bottom",
            min: limits.minX,
            max: limits.maxX,
            ticks: { stepSize: 1 },
            title: { display: true, text: statLabels[5] },
          },
        },
      },
    });
  }

  window.updateChartData = function (event, index) {
    event.preventDefault();
    if (!evChart) return;
    var newData = sortChartData(chartStats[index]);
    var limits = calculateAxisLimits(newData);
    evChart.data.datasets[0].data = convertChartData(newData);
    evChart.options.scales.x.min = limits.minX;
    evChart.options.scales.x.max = limits.maxX;
    evChart.options.scales.x.title.text = statLabels[index];
    evChart.options.scales.y.max = limits.maxY;
    statLabels.forEach(function (label) {
      var btn = document.getElementById("stat-" + label);
      if (btn) btn.classList.remove("underline");
    });
    var activeBtn = document.getElementById("stat-" + statLabels[index]);
    if (activeBtn) activeBtn.classList.add("underline");
    evChart.update();
  };

  // Initialize chart on first load
  initChart(window.graphData);

  // ========== EXPORT STATE ==========
  var currentPokemonName = window.currentPokemonName;
  var currentItem = window.currentItem;
  var currentAbility = window.currentAbility;
  var currentNature = "";
  var currentEVSpread = "";
  var currentIVs = "";
  var currentTeraType = "";
  var currentLevel = "";
  var currentMoves = window.initialMoves ? window.initialMoves.slice() : [];

  function toShowdownSpread(statsSpread) {
    var parts = statsSpread.split(":");
    var naturePart = parts[0];
    var evs = parts[1].replace(/\s/g, "").split("/");
    var evSpreadArr = [];
    if (evs[0] !== "0") evSpreadArr.push(evs[0] + " HP");
    if (evs[1] !== "0") evSpreadArr.push(evs[1] + " Atk");
    if (evs[2] !== "0") evSpreadArr.push(evs[2] + " Def");
    if (evs[3] !== "0") evSpreadArr.push(evs[3] + " SpA");
    if (evs[4] !== "0") evSpreadArr.push(evs[4] + " SpD");
    if (evs[5] !== "0") evSpreadArr.push(evs[5] + " Spe");
    return [naturePart, evSpreadArr.join(" / ")];
  }
  window.toShowdownSpread = toShowdownSpread;

  function initExportState() {
    currentPokemonName = window.currentPokemonName;
    currentItem = window.currentItem;
    currentAbility = window.currentAbility;
    currentMoves = window.initialMoves ? window.initialMoves.slice() : [];
    currentNature = "";
    currentEVSpread = "";
    currentIVs = "";
    currentTeraType = "";
    currentLevel = "";

    if (window.initialSpread !== "") {
      var spreadResult = toShowdownSpread(window.initialSpread);
      currentNature = spreadResult[0];
      currentEVSpread = spreadResult[1];
    }
    if (window.initialSpread !== "" && !window.isChampions) {
      var sp = window.initialSpread.split(":");
      var evs = sp[1].replace(/\s/g, "").split("/");
      if (
        ["Brave", "Relaxed", "Quiet", "Sassy"].includes(currentNature) &&
        evs[5] == "0"
      ) {
        currentIVs = "\nIVs: 0 Spe";
      } else {
        currentIVs = "";
      }
    }
    if (
      window.teraType &&
      window.teraType !== "" &&
      window.teraType !== "Nothing"
    ) {
      currentTeraType = "\nTera Type: " + window.teraType;
    } else {
      currentTeraType = "";
    }
    if (
      window.selectedFormat.includes("vgc") ||
      window.selectedFormat.includes("battlestadium") ||
      window.selectedFormat.includes("champions") ||
      window.selectedFormat.includes("bss")
    ) {
      currentLevel = "\nLevel: 50";
    }
    if (window.selectedFormat.includes("lc")) {
      currentLevel = "\nLevel: 5";
    }
  }
  initExportState();

  function generateShowdownSet() {
    var showdownSet = currentPokemonName;
    if (currentItem != "Nothing") {
      showdownSet += " @ " + currentItem;
    }
    showdownSet += "\nAbility: " + currentAbility;
    showdownSet += currentLevel;
    showdownSet += currentTeraType;
    showdownSet += "\nEVs: " + currentEVSpread;
    showdownSet += "\n" + currentNature + " Nature";
    showdownSet += currentIVs;
    currentMoves.forEach(function (move) {
      showdownSet += "\n- " + move;
    });
    return showdownSet;
  }

  function updateShowdownSet() {
    var el = document.getElementById("showdown-set");
    if (el) el.value = generateShowdownSet();
  }
  updateShowdownSet();

  // ========== SEARCH INPUTS ==========
  var initialPokemonListItems = $("#pokemon-list li").get();
  var initialMetaListItems = $("#meta-list li").get();

  $("#pokemonSearchInput").on("input", function () {
    var query = $(this).val().toLowerCase();
    var filteredItems = initialPokemonListItems.filter(function (item) {
      return $(item).text().toLowerCase().includes(query);
    });
    $("#pokemon-list").empty().append(filteredItems);
  });
  $("#metaSearchInput").on("input", function () {
    var query = $(this).val().toLowerCase();
    var filteredItems = initialMetaListItems.filter(function (item) {
      return $(item).text().toLowerCase().includes(query);
    });
    $("#meta-list").empty().append(filteredItems);
  });

  document
    .getElementById("pokemonSearchInput")
    .addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.keyCode === 13) {
        event.preventDefault();
      }
    });
  document
    .getElementById("metaSearchInput")
    .addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.keyCode === 13) {
        event.preventDefault();
      }
    });

  // ========== NATURE HELPER ==========
  function changeNature(currentNatureVal, stat, diff) {
    var attackNatures = ["Adamant", "Naughty", "Lonely", "Brave"];
    var defenseNatures = ["Relaxed", "Bold", "Impish", "Lax"];
    var spAttackNatures = ["Modest", "Mild", "Quiet", "Rash"];
    var spDefenseNatures = ["Sassy", "Gentle", "Calm", "Careful"];
    var speedNatures = ["Timid", "Hasty", "Jolly", "Naive"];
    var attackNaturesM = ["Bold", "Timid", "Modest", "Calm"];
    var defenseNaturesM = ["Lonely", "Hasty", "Mild", "Gentle"];
    var spAttackNaturesM = ["Adamant", "Impish", "Jolly", "Careful"];
    var spDefenseNaturesM = ["Naughty", "Lax", "Naive", "Rash"];
    var speedNaturesM = ["Brave", "Relaxed", "Quiet", "Sassy"];
    var naturesForStat = [];
    if (diff === "+") {
      if (stat === "Atk") naturesForStat = attackNatures;
      if (stat === "SpA") naturesForStat = spAttackNatures;
      if (stat === "Spe") naturesForStat = speedNatures;
      if (stat === "Def") naturesForStat = defenseNatures;
      if (stat === "SpD") naturesForStat = spDefenseNatures;
      var minusLists = [
        attackNaturesM,
        defenseNaturesM,
        spAttackNaturesM,
        spDefenseNaturesM,
        speedNaturesM,
      ];
      for (var i = 0; i < minusLists.length; i++) {
        if (minusLists[i].includes(currentNatureVal)) {
          var filtered = naturesForStat.filter(function (n) {
            return minusLists[i].includes(n);
          });
          return filtered.length ? filtered[0] : naturesForStat[0];
        }
      }
      return naturesForStat[0];
    }
    if (diff === "-") {
      if (stat === "Atk") naturesForStat = attackNaturesM;
      if (stat === "SpA") naturesForStat = spAttackNaturesM;
      if (stat === "Spe") naturesForStat = speedNaturesM;
      if (stat === "Def") naturesForStat = defenseNaturesM;
      if (stat === "SpD") naturesForStat = spDefenseNaturesM;
      var plusLists = [
        attackNatures,
        defenseNatures,
        spAttackNatures,
        spDefenseNatures,
        speedNatures,
      ];
      for (var j = 0; j < plusLists.length; j++) {
        if (plusLists[j].includes(currentNatureVal)) {
          var filtered2 = naturesForStat.filter(function (n) {
            return plusLists[j].includes(n);
          });
          return filtered2.length ? filtered2[0] : naturesForStat[0];
        }
      }
      return naturesForStat[0];
    }
    if (diff === " ") {
      if (
        stat === "Atk" &&
        (attackNatures.includes(currentNatureVal) ||
          attackNaturesM.includes(currentNatureVal))
      )
        return "Hardy";
      if (
        stat === "Def" &&
        (defenseNatures.includes(currentNatureVal) ||
          defenseNaturesM.includes(currentNatureVal))
      )
        return "Hardy";
      if (
        stat === "SpA" &&
        (spAttackNatures.includes(currentNatureVal) ||
          spAttackNaturesM.includes(currentNatureVal))
      )
        return "Hardy";
      if (
        stat === "SpD" &&
        (spDefenseNatures.includes(currentNatureVal) ||
          spDefenseNaturesM.includes(currentNatureVal))
      )
        return "Hardy";
      if (
        stat === "Spe" &&
        (speedNatures.includes(currentNatureVal) ||
          speedNaturesM.includes(currentNatureVal))
      )
        return "Hardy";
      return currentNatureVal;
    }
  }
  window.changeNature = changeNature;

  // ========== HIGHLIGHT HELPERS ==========
  function updateMoveHighlights() {
    $(".export-button").each(function () {
      var data = JSON.parse($(this).attr("export-data") || "{}");
      if (typeof data.move === "string") {
        if (currentMoves.includes(data.move)) {
          $(this).addClass("selected");
        } else {
          $(this).removeClass("selected");
        }
      }
    });
  }
  function updateAbilityHighlights() {
    $(".export-button").each(function () {
      var data = JSON.parse($(this).attr("export-data") || "{}");
      if (typeof data.ability === "string") {
        if (data.ability === currentAbility) {
          $(this).addClass("selected");
        } else {
          $(this).removeClass("selected");
        }
      }
    });
  }
  function updateItemHighlights() {
    $(".export-button").each(function () {
      var data = JSON.parse($(this).attr("export-data") || "{}");
      if (typeof data.item === "string") {
        if (data.item === currentItem) {
          $(this).addClass("selected");
        } else {
          $(this).removeClass("selected");
        }
      }
    });
  }
  function updateSpreadHighlights() {
    $(".export-button").each(function () {
      var data = JSON.parse($(this).attr("export-data") || "{}");
      if (typeof data.spread === "string") {
        var temp = toShowdownSpread(data.spread);
        if (temp[0] === currentNature && temp[1] === currentEVSpread) {
          $(this).addClass("selected");
        } else {
          $(this).removeClass("selected");
        }
      }
    });
  }
  function updateNatureHighlights() {
    $(".export-button").each(function () {
      var data = JSON.parse($(this).attr("export-data") || "{}");
      if (typeof data.nature === "string") {
        if (data.nature === currentNature) {
          $(this).addClass("selected");
        } else {
          $(this).removeClass("selected");
        }
      }
    });
  }
  function updateAllHighlights() {
    updateMoveHighlights();
    updateAbilityHighlights();
    updateItemHighlights();
    updateSpreadHighlights();
    updateNatureHighlights();
  }
  updateAllHighlights();

  // ========== EXPORT BUTTON HANDLER (event delegation) ==========
  $(document).on("click", ".export-button", function () {
    var exportDataText = $(this).attr("export-data");
    var exportData = JSON.parse(exportDataText);
    if (typeof exportData.ev === "string") {
      var stat = "";
      if (exportData.ev.includes("Atk")) stat = "Atk";
      if (exportData.ev.includes("SpA")) stat = "SpA";
      if (exportData.ev.includes("Spe")) stat = "Spe";
      if (exportData.ev.includes("Def")) stat = "Def";
      if (exportData.ev.includes("SpD")) stat = "SpD";
      var diff = " ";
      if (exportData.ev.includes("+")) diff = "+";
      if (exportData.ev.includes("-")) diff = "-";
      currentNature = changeNature(currentNature, stat, diff);
      currentEVSpread = exportData.ev.replace("+", "").replace("-", "");
      updateSpreadHighlights();
      updateNatureHighlights();
    }
    if (typeof exportData.item === "string") {
      if ($(this).hasClass("selected")) {
        currentItem = window.currentItem;
      } else {
        currentItem = exportData.item;
      }
      updateItemHighlights();
    }
    if (typeof exportData.ability === "string") {
      if ($(this).hasClass("selected")) {
        currentAbility = window.currentAbility;
      } else {
        currentAbility = exportData.ability;
      }
      updateAbilityHighlights();
    }
    if (typeof exportData.nature === "string") {
      currentNature = exportData.nature;
      if (!window.isChampions) {
        var speed_evs = currentEVSpread.includes("Spe");
        if (
          ["Brave", "Relaxed", "Quiet", "Sassy"].includes(currentNature) &&
          !speed_evs
        ) {
          currentIVs = "\nIVs: 0 Spe";
        } else {
          currentIVs = "";
        }
      }
      updateSpreadHighlights();
      updateNatureHighlights();
    }
    if (typeof exportData.tera === "string") {
      currentTeraType = "\nTera Type: " + exportData.tera;
    }
    if (typeof exportData.move === "string" && exportData.move != "Nothing") {
      if ($(this).hasClass("selected")) {
        var pos = currentMoves.indexOf(exportData.move);
        if (pos !== -1) currentMoves.splice(pos, 1);
      } else {
        currentMoves.push(exportData.move);
        if (currentMoves.length > 4) currentMoves.shift();
      }
      updateMoveHighlights();
    }
    if (typeof exportData.spread === "string") {
      var wasSelected = $(this).hasClass("selected");
      if (wasSelected) {
        if (window.initialSpread !== "") {
          var temp = toShowdownSpread(window.initialSpread);
          currentNature = temp[0];
          currentEVSpread = temp[1];
        }
      } else {
        var temp2 = toShowdownSpread(exportData.spread);
        currentNature = temp2[0];
        currentEVSpread = temp2[1];
      }
      if (!window.isChampions) {
        var spreadToCheck = wasSelected
          ? window.initialSpread
          : exportData.spread;
        if (spreadToCheck) {
          var sp = spreadToCheck.split(":");
          var evs = sp[1].replace(/\s/g, "").split("/");
          if (
            ["Brave", "Relaxed", "Quiet", "Sassy"].includes(currentNature) &&
            evs[5] == "0"
          ) {
            currentIVs = "\nIVs: 0 Spe";
          } else {
            currentIVs = "";
          }
        }
      }
      updateSpreadHighlights();
      updateNatureHighlights();
    }
    updateShowdownSet();
  });

  // ========== COPY BUTTON (event delegation) ==========
  $(document).on("click", "#copy-button", function () {
    var textToCopy = document.getElementById("showdown-set").value;
    navigator.clipboard.writeText(textToCopy).then(function () {
      document.getElementById("copy-button").textContent = "Copied!";
    });
    setTimeout(function () {
      document.getElementById("copy-button").textContent =
        "Copy Pokemon to Clipboard";
    }, 2000);
  });

  // ========== EV SELECTION ==========
  window.selectEVs = function (evType) {
    var evCategories = ["hp", "atk", "def", "spa", "spd", "spe"];
    evCategories.forEach(function (cat) {
      var elements = document.getElementsByClassName("evs_" + cat);
      for (var i = 0; i < elements.length; i++) {
        elements[i].hidden = true;
      }
    });
    var selectedElements = document.getElementsByClassName("evs_" + evType);
    for (var i = 0; i < selectedElements.length; i++) {
      selectedElements[i].hidden = false;
    }
    var evButtonIds = ["atk_evs", "spa_evs", "spe_evs", "def_evs", "spd_evs"];
    evButtonIds.forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.classList.remove("underline");
    });
    var activeBtn = document.getElementById(evType + "_evs");
    if (activeBtn) activeBtn.classList.add("underline");
  };

  // ========== HTML ESCAPE HELPER ==========
  function esc(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeName(str) {
    return String(str).replace(/'/g, "\\'");
  }

  // ========== DOM BUILDERS ==========
  function buildInfoPanelHTML(data) {
    var typesHTML = "";
    if (data.pokemon_types) {
      data.pokemon_types.forEach(function (type) {
        typesHTML +=
          '<div class="type-' + esc(type) + '">' + esc(type) + "</div> ";
      });
    }
    var sprite = data.current_pokemon[3];
    return (
      '<h3> Current Format:<br><span style="color: yellow;">' +
      esc(data.selected_format[1]) +
      "</span></h3>" +
      '<h3> Current Glicko Rating Threshold: <span style="color: yellow;">' +
      esc(data.selected_rating) +
      "</span></h3>" +
      "<h3> Current Pokemon:<br>" +
      '<div style="color: yellow;">' +
      "<span>" +
      esc(data.current_pokemon[0]) +
      "</span>" +
      '<div class="image-pokemon" style="background-position: ' +
      sprite[1] * -40 +
      "px " +
      sprite[0] * -30 +
      'px; position: relative;left: 135px;"></div>' +
      "</div>" +
      typesHTML +
      "</h3>" +
      '<h3> Usage: <span style="color: yellow;">' +
      data.current_pokemon[1] +
      "%</span></h3>" +
      '<h3> Monthly Rank: <span style="color: yellow;">' +
      data.current_pokemon[2] +
      "</span></h3>"
    );
  }

  function buildRatingButtonsHTML(options, selected) {
    var html =
      '<input type="hidden" name="rating_value" id="selectedRating" value="' +
      esc(selected) +
      '">';
    options.forEach(function (rate) {
      html +=
        '<button type="button" onclick="selectRating(\'' +
        esc(rate) +
        '\')" class="rating-button">' +
        esc(rate) +
        "+</button>\n";
    });
    return html;
  }

  function buildPokemonListHTML(pokemonNames) {
    var html = "";
    pokemonNames.forEach(function (pokemon) {
      var sprite = pokemon[2];
      html +=
        '<li><button type="button" onclick="selectPokemon(\'' +
        safeName(pokemon[0]) +
        '\')" class="pokemon-button" style="padding: 2px 8px;">' +
        '<div class="image-pokemon" style="background-position: ' +
        sprite[1] * -40 +
        "px " +
        sprite[0] * -30 +
        'px;">' +
        '<span class="left-text" style="padding-left: 48px;">' +
        esc(pokemon[0]) +
        "</span>" +
        "</div>" +
        '<span class="right-text">' +
        pokemon[1] +
        "%</span>" +
        "</button></li>\n";
    });
    return html;
  }

  function buildBaseStatsHTML(stats) {
    if (!stats || stats.length === 0) return "<h2>Base Stats</h2>";
    var labels = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
    var fills = ["hp", "atk", "def", "spa", "spd", "spe"];
    var html = "<h2>Base Stats</h2>";
    labels.forEach(function (label, i) {
      html +=
        '<div class="bar-container">' +
        '<div class="left-container">' +
        '<span class="bar-text-left" style="width: 30px;">' +
        label +
        "</span>" +
        '<div class="bar-fill ' +
        fills[i] +
        '-fill" style="width: ' +
        (stats[i] / 255) * 81 +
        '%;"></div>' +
        "</div>" +
        '<span class="bar-text-right">' +
        stats[i] +
        "</span>" +
        "</div>";
    });
    return html;
  }

  function buildMovesHTML(moves) {
    if (!moves || moves.length === 0) return "";
    var html = "<h2>Moves</h2><div class=\"Data\"><ul>";
    moves.forEach(function (move) {
      html +=
        '<li><button type="button" class="export-button has-tooltip" export-data=\'' +
        JSON.stringify({ move: move[0] }).replace(/'/g, "&#39;") +
        "' data-tooltip=\"" +
        esc(move[2]) +
        '">' +
        '<span class="left-text">' +
        esc(move[0]) +
        "</span>" +
        '<span class="right-text">' +
        move[1] +
        "%</span>" +
        "</button></li>";
    });
    html += "</ul></div>";
    return html;
  }

  function buildTeammatesHTML(teammates) {
    if (!teammates || teammates.length === 0) return "";
    var html = "<h2>Teammates</h2><div class=\"Data\"><ul>";
    teammates.forEach(function (team) {
      var sprite = team[2];
      html +=
        '<li><button type="button" onclick="selectPokemon(\'' +
        safeName(team[0]) +
        '\')" class="pokemon-button" style="padding: 2px 8px;">' +
        '<div class="image-pokemon" style="background-position: ' +
        sprite[1] * -40 +
        "px " +
        sprite[0] * -30 +
        'px;">' +
        '<span class="left-text" style="padding-left: 48px;">' +
        esc(team[0]) +
        "</span>" +
        "</div>" +
        '<span class="right-text">' +
        team[1] +
        "%</span>" +
        "</button></li>";
    });
    html += "</ul></div>";
    return html;
  }

  function buildItemsHTML(items, abilities) {
    if (
      !items ||
      items.length === 0 ||
      !abilities ||
      abilities[0][0] === "Nothing"
    )
      return "";
    var html = "<h2>Items</h2><div class=\"Data\"><ul>";
    items.forEach(function (item) {
      var sprite = item[3];
      html +=
        '<li><button type="button" class="export-button has-tooltip" export-data=\'' +
        JSON.stringify({ item: item[0] }).replace(/'/g, "&#39;") +
        "' data-tooltip=\"" +
        esc(item[2]) +
        '">' +
        '<div class="image-item" style="background-position: ' +
        sprite[1] * -24 +
        "px " +
        sprite[0] * -24 +
        'px;">' +
        '<span class="left-text" style="padding-left: 32px;">' +
        esc(item[0]) +
        "</span>" +
        "</div>" +
        '<span class="right-text">' +
        item[1] +
        "%</span>" +
        "</button></li>";
    });
    html += "</ul></div>";
    return html;
  }

  function buildAbilitiesHTML(abilities) {
    if (
      !abilities ||
      abilities.length === 0 ||
      abilities[0][0] === "Nothing"
    )
      return "";
    var html = "<h2>Abilities</h2><div class=\"Data\"><ul>";
    abilities.forEach(function (ability) {
      html +=
        '<li><button type="button" class="export-button has-tooltip" export-data=\'' +
        JSON.stringify({ ability: ability[0] }).replace(/'/g, "&#39;") +
        "' data-tooltip=\"" +
        esc(ability[2]) +
        '">' +
        '<span class="left-text">' +
        esc(ability[0]) +
        "</span>" +
        '<span class="right-text">' +
        ability[1] +
        "%</span>" +
        "</button></li>";
    });
    html += "</ul></div>";
    return html;
  }

  function buildSpreadsHTML(spreads, isChampions) {
    if (!spreads || spreads.length === 0) return "";
    var html =
      "<h2>" +
      (isChampions ? "Stat Point Spreads" : "EV Spreads") +
      "</h2><div class=\"Data\"><ul>";
    spreads.forEach(function (spread) {
      html +=
        "<li><button type=\"button\" export-data='" +
        JSON.stringify({ spread: spread[0] }).replace(/'/g, "&#39;") +
        "' class=\"export-button\">" +
        '<span class="left-text">' +
        esc(spread[0]) +
        "</span>" +
        '<span class="right-text">' +
        spread[1] +
        "%</span>" +
        "</button></li>";
    });
    html += "</ul></div>";
    return html;
  }

  function buildNaturesHTML(natures) {
    if (!natures || natures.length === 0) return "";
    var html = "<h2>Natures</h2><div class=\"Data\"><ul>";
    natures.forEach(function (nature) {
      html +=
        '<li><button type="button" class="export-button has-tooltip" export-data=\'' +
        JSON.stringify({ nature: nature[0] }).replace(/'/g, "&#39;") +
        "' data-tooltip=\"" +
        esc(nature[2]) +
        '">' +
        '<span class="left-text">' +
        esc(nature[0]) +
        "</span>" +
        '<span class="right-text">' +
        nature[1] +
        "%</span>" +
        "</button></li>";
    });
    html += "</ul></div>";
    return html;
  }

  function buildEvsHTML(evs, isChampions) {
    if (!evs || !evs[0] || evs[0].length === 0) return "";
    var categories = ["atk", "spa", "spe", "def", "spd"];
    var html =
      '<h2 style="margin-bottom: 5px;">' +
      (isChampions ? "Top Points By Category" : "Top EVs By Category") +
      "</h2>";
    html +=
      '<button type="button" id="atk_evs" onclick="selectEVs(\'atk\')" value="atk" class="ev-button">ATK</button>';
    html +=
      '<button type="button" id="spa_evs" onclick="selectEVs(\'spa\')" value="spa" class="ev-button">SPA</button>';
    html +=
      '<button type="button" id="spe_evs" onclick="selectEVs(\'spe\')" value="spe" class="ev-button underline">SPE</button>';
    html +=
      '<button type="button" id="def_evs" onclick="selectEVs(\'def\')" value="def" class="ev-button">HP+DEF</button>';
    html +=
      '<button type="button" id="spd_evs" onclick="selectEVs(\'spd\')" value="spd" class="ev-button">HP+SPD</button>';
    html += '<div class="Data" style="height: 188px;"><ul>';
    evs.forEach(function (evCategory, idx) {
      var cat = categories[idx];
      var hidden = cat !== "spe" ? " hidden" : "";
      evCategory.forEach(function (evSet) {
        html +=
          '<li class="evs_' +
          cat +
          '"' +
          hidden +
          ">" +
          "<button type=\"button\" class=\"export-button\" export-data='" +
          JSON.stringify({ ev: evSet[0] }).replace(/'/g, "&#39;") +
          "'>" +
          '<span class="left-text">' +
          esc(evSet[0]) +
          "</span>" +
          '<span class="right-text">' +
          evSet[1] +
          "%</span>" +
          "</button></li>";
      });
    });
    html += "</ul></div>";
    return html;
  }

  function buildGraphHTML(graphData) {
    var isEmpty = graphData === "[[],[],[],[],[],[]]" || !graphData;
    var html = "<div" + (isEmpty ? ' style="display: none;"' : "") + ">";
    html += '<h2 style="margin-bottom: 5px;">Stats Graph (Beta)</h2>';
    html +=
      '<div class="Data" style="max-height: 225px; height: 225px; margin-bottom: 0px;"><div>';
    html +=
      '<button type="button" class="stat-button" onclick="updateChartData(event, 0)" id="stat-HP">HP</button>';
    html +=
      '<button type="button" class="stat-button" onclick="updateChartData(event, 1)" id="stat-Attack">ATK</button>';
    html +=
      '<button type="button" class="stat-button" onclick="updateChartData(event, 2)" id="stat-Defense">DEF</button>';
    html +=
      '<button type="button" class="stat-button" onclick="updateChartData(event, 3)" id="stat-Sp. Attack">SPA</button>';
    html +=
      '<button type="button" class="stat-button" onclick="updateChartData(event, 4)" id="stat-Sp. Defense">SPD</button>';
    html +=
      '<button type="button" class="stat-button underline" onclick="updateChartData(event, 5)" id="stat-Speed">SPE</button>';
    html +=
      '</div><div id="chart-container"><canvas id="evChart"></canvas></div></div></div>';
    return html;
  }

  function buildTeraTypesHTML(tera) {
    if (!tera || tera.length === 0 || tera[0][0] === "Nothing") return "";
    var html = "<h2>Tera Types</h2><div class=\"Data\"><ul>";
    tera.forEach(function (t) {
      html +=
        "<li><button type=\"button\" class=\"export-button\" export-data='" +
        JSON.stringify({ tera: t[0] }).replace(/'/g, "&#39;") +
        "'>" +
        '<span class="type-' +
        esc(t[0]) +
        '">' +
        esc(t[0]) +
        "</span>" +
        '<span class="right-text">' +
        t[1] +
        "%</span>" +
        "</button></li>";
    });
    html += "</ul></div>";
    return html;
  }

  function buildExportHTML(data) {
    if (!data.evs_list || !data.evs_list[0] || data.evs_list[0].length === 0)
      return "";
    var isChampions = data.is_champions;
    var html =
      '<h2>Export Pokemon <span class="fa has-tooltip" style="font-size: 14px; vertical-align: text-top; cursor: pointer;" data-tooltip="Click on Moves, Items, ' +
      (isChampions ? "Stat Point Spreads" : "EV Spreads") +
      ' and Abilities to change the Export!">&#xf059;</span></h2>';
    html +=
      '<textarea class="Export" id="showdown-set" spellcheck="false"></textarea>';
    html +=
      '<button type="button" class="copy-button" id="copy-button" style="text-align: center;">Copy Pokemon to Clipboard</button>';
    return html;
  }

  function buildCountersHTML(counters) {
    if (!counters || counters.length === 0) return "";
    var html =
      "<h2>Checks and Counters</h2><div class=\"Data\"><ul>";
    counters.forEach(function (counter) {
      var sprite = counter[2];
      html +=
        '<li><button type="button" onclick="selectPokemon(\'' +
        safeName(counter[0]) +
        '\')" class="pokemon-button" style="padding: 2px 8px;">' +
        '<div class="image-pokemon" style="background-position: ' +
        sprite[1] * -40 +
        "px " +
        sprite[0] * -30 +
        'px;">' +
        '<span class="left-text" style="padding-left: 48px;">' +
        esc(counter[0]) +
        "</span>" +
        "</div>" +
        '<span class="right-text">' +
        counter[1] +
        "%</span>" +
        "</button></li>";
    });
    html += "</ul></div>";
    return html;
  }

  function buildRightPanelHTML(data) {
    var html = "";
    // Base Stats
    html +=
      '<div class="Stats">' + buildBaseStatsHTML(data.base_stats) + "</div>";
    // Moves
    var movesHTML = buildMovesHTML(data.moves_list);
    if (movesHTML) html += "<div>" + movesHTML + "</div>";
    // Teammates
    var teammatesHTML = buildTeammatesHTML(data.teammates_list);
    if (teammatesHTML) html += "<div>" + teammatesHTML + "</div>";
    // Items
    var itemsHTML = buildItemsHTML(data.items_list, data.abilities_list);
    if (itemsHTML) html += "<div>" + itemsHTML + "</div>";
    // Abilities
    var abilitiesHTML = buildAbilitiesHTML(data.abilities_list);
    if (abilitiesHTML) html += "<div>" + abilitiesHTML + "</div>";
    // Spreads
    var spreadsHTML = buildSpreadsHTML(data.spreads_list, data.is_champions);
    if (spreadsHTML) html += "<div>" + spreadsHTML + "</div>";
    // Natures
    var naturesHTML = buildNaturesHTML(data.natures_list);
    if (naturesHTML) html += "<div>" + naturesHTML + "</div>";
    // EVs
    var evsHTML = buildEvsHTML(data.evs_list, data.is_champions);
    if (evsHTML) html += "<div>" + evsHTML + "</div>";
    // Graph
    html += buildGraphHTML(data.graph_data);
    // Tera Types
    var teraHTML = buildTeraTypesHTML(data.tera_types_list);
    if (teraHTML) html += "<div>" + teraHTML + "</div>";
    // Export
    var exportHTML = buildExportHTML(data);
    if (exportHTML) html += "<div>" + exportHTML + "</div>";
    // Counters
    var countersHTML = buildCountersHTML(data.counters_list);
    if (countersHTML) html += "<div>" + countersHTML + "</div>";
    return html;
  }

  // ========== DYNAMIC PAGE LOADING ==========
  var currentFormatCode = window.selectedFormat;
  var currentRatingValue = window.selectedRating || "";
  var isLoading = false;

  function decodeHtmlEntities(str) {
    var el = document.createElement("textarea");
    el.innerHTML = str;
    return el.value;
  }

  async function fetchPageData(format, rating, pokemon) {
    if (isLoading) return;
    isLoading = true;
    try {
      var url =
        "/api/" +
        encodeURIComponent(format) +
        "/" +
        encodeURIComponent(rating) +
        "/" +
        encodeURIComponent(pokemon);
      var res = await fetch(url);
      if (!res.ok) {
        isLoading = false;
        return;
      }
      var data = await res.json();
      updatePage(data);
      var newUrl =
        "/" +
        data.selected_format[0] +
        "/" +
        data.selected_rating +
        "/" +
        data.selected_pokemon;
      history.pushState(
        {
          format: data.selected_format[0],
          rating: data.selected_rating,
          pokemon: data.selected_pokemon,
        },
        "",
        newUrl
      );
      document.title =
        data.selected_pokemon +
        " | MunchStats | " +
        data.selected_format[1];
    } catch (e) {
      console.error("Failed to fetch data:", e);
    }
    isLoading = false;
  }

  function updatePage(data) {
    // Update window globals
    window.graphData = data.graph_data;
    window.currentPokemonName = data.current_pokemon[0];
    window.currentItem =
      data.items_list.length > 0 ? data.items_list[0][0] : "";
    window.currentAbility =
      data.abilities_list.length > 0
        ? decodeHtmlEntities(data.abilities_list[0][0])
        : "";
    window.initialSpread =
      data.spreads_list.length > 0 ? data.spreads_list[0][0] : "";
    window.selectedFormat = data.selected_format[0];
    window.selectedRating = data.selected_rating;
    window.isChampions = data.is_champions;
    window.teraType =
      data.tera_types_list.length > 0 ? data.tera_types_list[0][0] : "";
    window.initialMoves = data.moves_list
      .slice(0, 4)
      .filter(function (m) {
        return m[0] !== "Nothing";
      })
      .map(function (m) {
        return m[0];
      });

    // Update local state
    currentFormatCode = data.selected_format[0];
    currentRatingValue = data.selected_rating;

    // Update info panel
    document.getElementById("pokemon-info").innerHTML =
      buildInfoPanelHTML(data);

    // Update rating buttons
    document.getElementById("rating-buttons-container").innerHTML =
      buildRatingButtonsHTML(data.rating_options, data.selected_rating);

    // Update Pokemon list
    document.getElementById("pokemon-list").innerHTML = buildPokemonListHTML(
      data.pokemon_names
    );
    initialPokemonListItems = $("#pokemon-list li").get();
    document.getElementById("pokemonSearchInput").value = "";

    // Update right panel
    document.getElementById("right-panel").innerHTML =
      buildRightPanelHTML(data);

    // Re-init chart
    initChart(data.graph_data);

    // Re-init export state and highlights
    initExportState();
    updateShowdownSet();
    updateAllHighlights();
  }

  // ========== OVERRIDE SELECTION FUNCTIONS ==========
  window.selectPokemon = function (pokemonName) {
    fetchPageData(currentFormatCode, currentRatingValue, pokemonName);
  };
  window.selectMeta = function (metaCode) {
    fetchPageData(metaCode, currentRatingValue, "");
  };
  window.selectRating = function (ratingType) {
    fetchPageData(currentFormatCode, ratingType, "");
  };

  // ========== BROWSER HISTORY ==========
  window.addEventListener("popstate", function (event) {
    if (event.state) {
      fetchPageData(event.state.format, event.state.rating, event.state.pokemon);
    }
  });
  // Set initial state so back button works correctly
  history.replaceState(
    {
      format: currentFormatCode,
      rating: currentRatingValue,
      pokemon: currentPokemonName,
    },
    ""
  );
});
