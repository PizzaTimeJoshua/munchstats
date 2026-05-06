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

  // ========== TREND CHART ==========
  var trendChart = null;

  function formatMonthLabel(monthStr) {
    var parts = monthStr.split("-");
    var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return monthNames[parseInt(parts[1], 10) - 1] + " '" + parts[0].slice(2);
  }

  function initTrendChart(months, usageData, pokemonName) {
    if (trendChart) {
      trendChart.destroy();
      trendChart = null;
    }
    var canvas = document.getElementById("trendChart");
    if (!canvas || !months || !usageData || months.length === 0) return;

    // Fill interior nulls with 0% (format existed but Pokemon wasn't ranked)
    // Keep leading/trailing nulls as-is
    var first = -1, last = -1;
    for (var i = 0; i < usageData.length; i++) {
      if (usageData[i] !== null) { first = i; break; }
    }
    for (var j = usageData.length - 1; j >= 0; j--) {
      if (usageData[j] !== null) { last = j; break; }
    }
    if (first === -1) return;
    var resolved = usageData.map(function(v, idx) {
      if (v !== null) return v;
      return (idx >= first && idx <= last) ? 0 : null;
    });

    // Trim to just the range with data
    resolved = resolved.slice(first, last + 1);
    var trimmedMonths = months.slice(first, last + 1);

    if (resolved.length < 2) return;

    var labels = trimmedMonths.map(formatMonthLabel);
    var ctx = canvas.getContext("2d");

    trendChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: pokemonName + " Usage",
          data: resolved,
          borderColor: "rgba(245, 166, 35, 1)",
          backgroundColor: "rgba(245, 166, 35, 0.1)",
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "rgba(245, 166, 35, 1)",
          tension: 0.3,
          fill: true,
          spanGaps: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(12, 12, 12, 0.92)",
            borderColor: "rgba(255, 255, 255, 0.14)",
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                var val = context.parsed.y;
                return val !== null ? val.toFixed(3) + "%" : "N/A";
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            border: { color: "rgba(255, 255, 255, 0.12)" },
            grid: { color: "rgba(255, 255, 255, 0.055)" },
            ticks: {
              color: "rgba(224, 224, 224, 0.58)",
              font: { size: 11 },
              callback: function(value) { return value + "%"; }
            }
          },
          x: {
            border: { color: "rgba(255, 255, 255, 0.12)" },
            grid: { color: "rgba(255, 255, 255, 0.035)" },
            ticks: {
              color: "rgba(224, 224, 224, 0.5)",
              font: { size: 10 },
              maxRotation: 45,
            }
          }
        }
      }
    });
  }

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
  var graphDatasetIndexes = { usage: 0, cumulative: 1, reverseCumulative: 2 };
  var graphDatasetVisibility = {
    usage: true,
    cumulative: false,
    reverseCumulative: false,
  };


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
  function convertCumulativeChartData(dataArray) {
    var cumulative = 0;
    return dataArray.map(function (pair) {
      cumulative += pair[1];
      return { x: pair[0], y: Math.min(cumulative, 100) };
    });
  }
  function convertReverseCumulativeChartData(dataArray) {
    var cumulative = 0;
    return dataArray
      .slice()
      .reverse()
      .map(function (pair) {
        cumulative += pair[1];
        return { x: pair[0], y: Math.min(cumulative, 100) };
      })
      .reverse();
  }
  function calculateAxisLimits(dataArray) {
    if (!dataArray.length) {
      return { minX: 0, maxX: 1, maxY: 1 };
    }
    var xValues = dataArray.map(function (pair) {
      return pair[0];
    });
    var minX = Math.min.apply(null, xValues);
    var maxX = Math.max.apply(null, xValues);
    var yValues = dataArray.map(function (pair) {
      return pair[1];
    });
    var maxY = Math.max(1, Math.ceil(Math.max.apply(null, yValues) * 1.1));
    return { minX: minX, maxX: maxX, maxY: maxY };
  }

  function updateGraphToggleButtons() {
    Object.keys(graphDatasetVisibility).forEach(function (name) {
      var button = document.getElementById("graph-toggle-" + name);
      if (!button) return;
      button.classList.toggle("selected", graphDatasetVisibility[name]);
      button.setAttribute(
        "aria-pressed",
        graphDatasetVisibility[name] ? "true" : "false"
      );
    });
  }

  function applyGraphDatasetVisibility(redraw) {
    var cumulativeVisible =
      graphDatasetVisibility.cumulative ||
      graphDatasetVisibility.reverseCumulative;
    if (evChart) {
      Object.keys(graphDatasetIndexes).forEach(function (name) {
        evChart.setDatasetVisibility(
          graphDatasetIndexes[name],
          graphDatasetVisibility[name]
        );
      });
      evChart.options.scales.y.ticks.color = graphDatasetVisibility.usage
        ? "rgba(224, 224, 224, 0.58)"
        : "rgba(224, 224, 224, 0)";
      evChart.options.scales.y.border.color = graphDatasetVisibility.usage
        ? "rgba(255, 255, 255, 0.12)"
        : "rgba(255, 255, 255, 0)";
      evChart.options.scales.yCumulative.ticks.color = cumulativeVisible
        ? "rgba(245, 193, 84, 0.78)"
        : "rgba(245, 193, 84, 0)";
      evChart.options.scales.yCumulative.border.color = cumulativeVisible
        ? "rgba(245, 193, 84, 0.4)"
        : "rgba(245, 193, 84, 0)";
      if (redraw !== false) evChart.update();
    }
    updateGraphToggleButtons();
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
            type: "bar",
            label: "Usage",
            data: convertChartData(currentChartData),
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            barPercentage: 1,
            categoryPercentage: 1,
            hidden: !graphDatasetVisibility.usage,
            yAxisID: "y",
            order: 2,
          },
          {
            type: "line",
            label: "Cumulative",
            data: convertCumulativeChartData(currentChartData),
            borderColor: "rgba(245, 193, 84, 0.95)",
            backgroundColor: "rgba(245, 193, 84, 0.12)",
            borderWidth: 2.5,
            cubicInterpolationMode: "monotone",
            pointHitRadius: 8,
            pointRadius: 0,
            pointHoverRadius: 3,
            tension: 0.35,
            fill: false,
            hidden: !graphDatasetVisibility.cumulative,
            yAxisID: "yCumulative",
            order: 1,
          },
          {
            type: "line",
            label: "Reverse Cumulative",
            data: convertReverseCumulativeChartData(currentChartData),
            borderColor: "rgba(180, 150, 255, 0.95)",
            backgroundColor: "rgba(180, 150, 255, 0.12)",
            borderWidth: 2.5,
            cubicInterpolationMode: "monotone",
            pointHitRadius: 8,
            pointRadius: 0,
            pointHoverRadius: 3,
            tension: 0.35,
            fill: false,
            hidden: !graphDatasetVisibility.reverseCumulative,
            yAxisID: "yCumulative",
            order: 1,
          },
        ],
      },
      options: {
        interaction: { mode: "index", intersect: false },
        layout: { padding: { top: 4, right: 2, bottom: 0, left: 0 } },
        plugins: {
          tooltip: {
            intersect: false,
            backgroundColor: "rgba(12, 12, 12, 0.92)",
            borderColor: "rgba(255, 255, 255, 0.14)",
            borderWidth: 1,
            displayColors: true,
            callbacks: {
              label: function (context) {
                var value = context.parsed.y || 0;
                return context.dataset.label + ": " + value.toFixed(1) + "%";
              },
            },
          },
          legend: { display: false },
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            display: true,
            max: limits.maxY,
            border: { color: "rgba(255, 255, 255, 0.12)" },
            grid: { color: "rgba(255, 255, 255, 0.055)" },
            ticks: {
              color: "rgba(224, 224, 224, 0.58)",
              font: { size: 11 },
              maxTicksLimit: 5,
              padding: 4,
              callback: function (value) {
                return value + "%";
              },
            },
          },
          yCumulative: {
            beginAtZero: true,
            display: true,
            max: 100,
            position: "right",
            border: { color: "rgba(245, 193, 84, 0.4)" },
            grid: { drawOnChartArea: false },
            ticks: {
              color: "rgba(245, 193, 84, 0.78)",
              font: { size: 11, weight: "bold" },
              padding: 4,
              stepSize: 25,
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
            border: { color: "rgba(255, 255, 255, 0.12)" },
            grid: { color: "rgba(255, 255, 255, 0.035)" },
            ticks: {
              autoSkip: true,
              color: "rgba(224, 224, 224, 0.5)",
              font: { size: 10 },
              maxRotation: 0,
              maxTicksLimit: 6,
              minRotation: 0,
              padding: 3,
              stepSize: 1,
              callback: function (value) {
                return Math.round(value);
              },
            },
            title: { display: false, text: statLabels[5] },
          },
        },
      },
    });
    applyGraphDatasetVisibility(false);
  }

  window.toggleGraphDataset = function (event, datasetName) {
    event.preventDefault();
    if (!Object.prototype.hasOwnProperty.call(graphDatasetVisibility, datasetName)) {
      return;
    }
    var nextVisibility = !graphDatasetVisibility[datasetName];
    var visibleCount = Object.keys(graphDatasetVisibility).filter(function (name) {
      return name === datasetName
        ? nextVisibility
        : graphDatasetVisibility[name];
    }).length;
    if (visibleCount === 0) {
      return;
    }
    graphDatasetVisibility[datasetName] = nextVisibility;
    applyGraphDatasetVisibility();
  };

  window.updateChartData = function (event, index) {
    event.preventDefault();
    if (!evChart) return;
    var newData = sortChartData(chartStats[index]);
    var limits = calculateAxisLimits(newData);
    evChart.data.datasets[0].data = convertChartData(newData);
    evChart.data.datasets[1].data = convertCumulativeChartData(newData);
    evChart.data.datasets[2].data = convertReverseCumulativeChartData(newData);
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

  // Initialize charts on first load
  initChart(window.graphData);
  if (window.trendMonths && window.trendMonths.length > 0) {
    initTrendChart(window.trendMonths, window.trendUsage, window.currentPokemonName);
  }

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

  var statOrder = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];

  function emptyStatValues() {
    return {
      HP: "0",
      Atk: "0",
      Def: "0",
      SpA: "0",
      SpD: "0",
      Spe: "0",
    };
  }

  function parseStatLabel(label) {
    var match = String(label)
      .trim()
      .match(/^(\d+)\s*([+-])?\s+(HP|Atk|Def|SpA|SpD|Spe)$/);
    if (!match) return null;
    return {
      value: match[1],
      diff: match[2] || " ",
      stat: match[3],
    };
  }

  function parseSpreadValues(spread) {
    var values = emptyStatValues();
    String(spread || "")
      .split("/")
      .forEach(function (part) {
        var parsed = parseStatLabel(part);
        if (parsed) values[parsed.stat] = parsed.value;
      });
    return values;
  }

  function formatSpreadValues(values) {
    var spreadParts = [];
    statOrder.forEach(function (stat) {
      var value = values[stat] || "0";
      if (parseInt(value, 10) > 0) {
        spreadParts.push(value + " " + stat);
      }
    });
    return spreadParts.join(" / ");
  }

  function parseEVCategorySelection(label) {
    var selection = {
      values: emptyStatValues(),
      affectedStats: [],
      natureStat: "",
      diff: " ",
    };
    String(label || "")
      .split("/")
      .forEach(function (part) {
        var parsed = parseStatLabel(part);
        if (!parsed) return;
        selection.values[parsed.stat] = parsed.value;
        selection.affectedStats.push(parsed.stat);
        if (parsed.stat !== "HP") {
          selection.natureStat = parsed.stat;
          selection.diff = parsed.diff;
        }
      });
    return selection;
  }

  function updateSpeedIVsForCurrentSpread() {
    if (window.isChampions) {
      currentIVs = "";
      return;
    }
    var values = parseSpreadValues(currentEVSpread);
    if (
      ["Brave", "Relaxed", "Quiet", "Sassy"].includes(currentNature) &&
      values.Spe === "0"
    ) {
      currentIVs = "\nIVs: 0 Spe";
    } else {
      currentIVs = "";
    }
  }

  function applyEVCategorySelection(label, clearSelection) {
    var selection = parseEVCategorySelection(label);
    if (selection.affectedStats.length === 0) return;

    var values = parseSpreadValues(currentEVSpread);
    selection.affectedStats.forEach(function (stat) {
      values[stat] = clearSelection ? "0" : selection.values[stat];
    });

    if (selection.natureStat) {
      currentNature = changeNature(
        currentNature,
        selection.natureStat,
        clearSelection ? " " : selection.diff
      );
    }
    currentEVSpread = formatSpreadValues(values);
    updateSpeedIVsForCurrentSpread();
  }

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

  // ========== MONTH SELECTOR TOGGLE ==========
  var monthToggle = document.getElementById("month-toggle");
  if (monthToggle) {
    monthToggle.addEventListener("click", function () {
      var dd = document.getElementById("month-dropdown");
      dd.style.display = dd.style.display === "none" ? "block" : "none";
    });
  }

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

  function natureSuffixForStat(stat, natureVal) {
    var boostedNatures = {
      Atk: ["Naughty", "Adamant", "Lonely", "Brave"],
      Def: ["Bold", "Relaxed", "Impish", "Lax"],
      SpA: ["Modest", "Mild", "Quiet", "Rash"],
      SpD: ["Calm", "Gentle", "Sassy", "Careful"],
      Spe: ["Timid", "Hasty", "Jolly", "Naive"],
    };
    var loweredNatures = {
      Atk: ["Bold", "Timid", "Modest", "Calm"],
      Def: ["Lonely", "Hasty", "Mild", "Gentle"],
      SpA: ["Adamant", "Impish", "Jolly", "Careful"],
      SpD: ["Naughty", "Lax", "Naive", "Rash"],
      Spe: ["Brave", "Relaxed", "Quiet", "Sassy"],
    };
    if (boostedNatures[stat] && boostedNatures[stat].includes(natureVal)) {
      return "+";
    }
    if (loweredNatures[stat] && loweredNatures[stat].includes(natureVal)) {
      return "-";
    }
    return "";
  }

  function currentStatPointLabels() {
    var values = parseSpreadValues(currentEVSpread);
    return [
      values.Atk + natureSuffixForStat("Atk", currentNature) + " Atk",
      values.SpA + natureSuffixForStat("SpA", currentNature) + " SpA",
      values.Spe + natureSuffixForStat("Spe", currentNature) + " Spe",
      values.HP +
        " HP / " +
        values.Def +
        natureSuffixForStat("Def", currentNature) +
        " Def",
      values.HP +
        " HP / " +
        values.SpD +
        natureSuffixForStat("SpD", currentNature) +
        " SpD",
    ];
  }

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
  function updateEVHighlights() {
    var selectedStats = currentStatPointLabels();
    $(".export-button").each(function () {
      var data = JSON.parse($(this).attr("export-data") || "{}");
      if (typeof data.ev === "string") {
        if (selectedStats.includes(data.ev)) {
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
    updateEVHighlights();
  }
  updateAllHighlights();

  // ========== EXPORT BUTTON HANDLER (event delegation) ==========
  $(document).on("click", ".export-button", function () {
    var exportDataText = $(this).attr("export-data");
    var exportData = JSON.parse(exportDataText);
    if (typeof exportData.ev === "string") {
      applyEVCategorySelection(exportData.ev, $(this).hasClass("selected"));
      updateSpreadHighlights();
      updateNatureHighlights();
      updateEVHighlights();
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
      updateEVHighlights();
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
      updateEVHighlights();
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
        (pokemon[3] === "up" ? '<span class="trend-up">&#9650;</span> ' :
         pokemon[3] === "down" ? '<span class="trend-down">&#9660;</span> ' :
         pokemon[3] === "same" ? '<span class="trend-same">&#8212;</span> ' : '') +
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
      '<div class="Data" style="max-height: 225px; height: 225px; margin-bottom: 0px; overflow: hidden;"><div>';
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
      '</div><div class="graph-toggle-row">' +
      '<button type="button" class="graph-toggle-button selected" id="graph-toggle-usage" onclick="toggleGraphDataset(event, \'usage\')" aria-pressed="true">Usage</button>' +
      '<button type="button" class="graph-toggle-button" id="graph-toggle-cumulative" onclick="toggleGraphDataset(event, \'cumulative\')" aria-pressed="false">Cumulative</button>' +
      '<button type="button" class="graph-toggle-button" id="graph-toggle-reverseCumulative" onclick="toggleGraphDataset(event, \'reverseCumulative\')" aria-pressed="false">Reverse</button>' +
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

  function buildTrendHTML(data) {
    if (!data.trend_months || !data.trend_usage || data.trend_months.length === 0) return "";
    var nonNull = data.trend_usage.filter(function(v) { return v !== null && v > 0; });
    if (nonNull.length < 2) return "";
    var html = "<div>";
    html += "<h2>Usage Trend</h2>";
    html += '<div class="Data" style="max-height: 210px; height: 210px; margin-bottom: 0px; overflow: hidden;">';
    html += '<div id="trend-chart-container" style="width: 100%; height: 190px; position: relative;">';
    html += '<canvas id="trendChart"></canvas>';
    html += "</div></div></div>";
    return html;
  }

  function buildRightPanelHTML(data) {
    var html = "";
    // Base Stats
    html +=
      '<div class="Stats">' + buildBaseStatsHTML(data.base_stats) + "</div>";
    // Usage Trend
    var trendHTML = buildTrendHTML(data);
    if (trendHTML) html += trendHTML;
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
  var currentMonth = window.selectedMonth || "";
  var isLoading = false;

  function decodeHtmlEntities(str) {
    var el = document.createElement("textarea");
    el.innerHTML = str;
    return el.value;
  }

  var loadingTimer = null;
  function showLoading() {
    loadingTimer = setTimeout(function () {
      var overlay = document.getElementById("loading-overlay");
      if (overlay) overlay.classList.add("active");
    }, 300);
  }
  function hideLoading() {
    clearTimeout(loadingTimer);
    var overlay = document.getElementById("loading-overlay");
    if (overlay) overlay.classList.remove("active");
  }

  async function fetchPageData(format, rating, pokemon) {
    if (isLoading) return;
    isLoading = true;
    showLoading();
    try {
      var url =
        "/api/" +
        encodeURIComponent(format) +
        "/" +
        encodeURIComponent(rating) +
        "/" +
        encodeURIComponent(pokemon);
      if (currentMonth) {
        url += "?month=" + encodeURIComponent(currentMonth);
      }
      var res = await fetch(url);
      if (!res.ok) {
        isLoading = false;
        hideLoading();
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
      if (data.selected_month && data.available_months &&
          data.selected_month !== data.available_months[data.available_months.length - 1]) {
        newUrl += "?month=" + encodeURIComponent(data.selected_month);
      }
      history.pushState(
        {
          format: data.selected_format[0],
          rating: data.selected_rating,
          pokemon: data.selected_pokemon,
          month: data.selected_month,
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
    hideLoading();
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
    if (data.selected_month) {
      currentMonth = data.selected_month;
      var monthDisplay = document.getElementById("month-display");
      if (monthDisplay) monthDisplay.textContent = data.selected_month;
      var monthOptions = document.querySelectorAll(".month-option");
      monthOptions.forEach(function (btn) {
        btn.classList.toggle("active", btn.textContent.trim() === data.selected_month);
      });
    }

    // Update info panel
    document.getElementById("pokemon-info").innerHTML =
      buildInfoPanelHTML(data);

    // Update rating buttons
    document.getElementById("rating-buttons-container").innerHTML =
      buildRatingButtonsHTML(data.rating_options, data.selected_rating);

    // Update format list if month changed
    if (data.month_formats) {
      var metaHtml = "";
      data.month_formats.forEach(function (fmt) {
        metaHtml +=
          '<li><button type="button" onclick=\'selectMeta("' +
          fmt[0] +
          '")\' class="meta-button">' +
          fmt[1] +
          "</button></li>";
      });
      document.getElementById("meta-list").innerHTML = metaHtml;
      initialMetaListItems = $("#meta-list li").get();
      document.getElementById("metaSearchInput").value = "";
    }

    // Update month dropdown
    if (data.available_months) {
      var monthDropdown = document.getElementById("month-dropdown");
      if (monthDropdown) {
        var monthHtml = "";
        for (var i = data.available_months.length - 1; i >= 0; i--) {
          var m = data.available_months[i];
          var activeClass = m === data.selected_month ? " active" : "";
          monthHtml +=
            '<button type="button" onclick="selectMonth(\'' +
            m +
            "')\" class=\"month-option" +
            activeClass +
            '">' +
            m +
            "</button>";
        }
        monthDropdown.innerHTML = monthHtml;
      }
    }

    // Update Pokemon list
    document.getElementById("pokemon-list").innerHTML = buildPokemonListHTML(
      data.pokemon_names
    );
    initialPokemonListItems = $("#pokemon-list li").get();
    document.getElementById("pokemonSearchInput").value = "";

    // Update right panel
    document.getElementById("right-panel").innerHTML =
      buildRightPanelHTML(data);

    // Re-init charts
    initChart(data.graph_data);
    if (data.trend_months && data.trend_usage) {
      initTrendChart(data.trend_months, data.trend_usage, data.selected_pokemon);
    }

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
  window.selectMonth = function (month) {
    currentMonth = month;
    var dropdown = document.getElementById("month-dropdown");
    if (dropdown) dropdown.style.display = "none";
    fetchPageData(currentFormatCode, currentRatingValue, "");
  };

  // ========== BROWSER HISTORY ==========
  window.addEventListener("popstate", function (event) {
    if (event.state) {
      currentMonth = event.state.month || "";
      fetchPageData(event.state.format, event.state.rating, event.state.pokemon);
    }
  });
  // Set initial state so back button works correctly
  history.replaceState(
    {
      format: currentFormatCode,
      rating: currentRatingValue,
      pokemon: currentPokemonName,
      month: currentMonth,
    },
    ""
  );
});
