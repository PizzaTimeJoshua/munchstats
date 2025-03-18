$(document).ready(function() {
    // Tooltip functionality
    const tooltip = document.getElementById("tooltip");
    const tooltipButtons = document.querySelectorAll(".has-tooltip");
    tooltipButtons.forEach(button => {
      button.addEventListener("mouseenter", (event) => {
        const tooltipText = event.target.getAttribute("data-tooltip");
        tooltip.innerHTML = tooltipText.replace(/(?:\r\n|\r|\n)/g, '<br>');
        tooltip.style.display = "block";
      });
      button.addEventListener("mousemove", (event) => {
        tooltip.style.left = (event.pageX + 10) + "px";
        tooltip.style.top = (event.pageY + 10) + "px";
      });
      button.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });
    });
  
    // Chart setup and functions
    const graphDataString = window.graphData;
    const chartStats = JSON.parse(graphDataString);
    const statLabels = ["HP", "Attack", "Defense", "Sp. Attack", "Sp. Defense", "Speed"];
  
    function sortChartData(dataArray) {
      return dataArray.slice().sort((a, b) => a[0] - b[0]);
    }
    function convertChartData(dataArray) {
      return dataArray.map(pair => ({ x: pair[0], y: pair[1] }));
    }
    function calculateAxisLimits(dataArray) {
      const xValues = dataArray.map(pair => pair[0]);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const yValues = dataArray.map(pair => pair[1]);
      const maxY = Math.ceil(Math.max(...yValues));
      return { minX, maxX, maxY };
    }
    // Initialize chart with Speed data (index 5)
    let currentChartData = sortChartData(chartStats[5]);
    const { minX, maxX, maxY } = calculateAxisLimits(currentChartData);
    const processedChartData = convertChartData(currentChartData);
    const ctx = document.getElementById('evChart').getContext('2d');
    const evChart = new Chart(ctx, {
      type: 'bar',
      data: {
        datasets: [{
          data: processedChartData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          barPercentage: 1,
          categoryPercentage: 1,
        }]
      },
      options: {
        interaction: {
          mode: 'nearest',
          intersect: false
        },
        plugins: {
          tooltip: { intersect: false },
          legend: { display: false }
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: maxY,
            ticks: {
              stepSize: 1,
              callback: value => value + '%'
            }
          },
          x: {
            type: 'linear',
            position: 'bottom',
            min: minX,
            max: maxX,
            ticks: { stepSize: 1 },
            title: { display: true, text: statLabels[5] }
          }
        }
      }
    });
    // Update chart when a stat button is clicked
    window.updateChartData = function(event, index) {
      event.preventDefault();
      const newData = sortChartData(chartStats[index]);
      const { minX, maxX, maxY } = calculateAxisLimits(newData);
      const newProcessedData = convertChartData(newData);
      evChart.data.datasets[0].data = newProcessedData;
      evChart.options.scales.x.min = minX;
      evChart.options.scales.x.max = maxX;
      evChart.options.scales.x.title.text = statLabels[index];
      evChart.options.scales.y.max = maxY;
      // Remove underline class from all stat buttons
      statLabels.forEach(label => {
        const btn = document.getElementById("stat-" + label);
        if (btn) btn.classList.remove("underline");
      });
      document.getElementById("stat-" + statLabels[index]).classList.add("underline");
      evChart.update();
    };
  
    // Variables for export/set generation
    const initialPokemonListItems = $("#pokemon-list li").get();
    const initialMetaListItems = $("#meta-list li").get();
    let currentPokemonName = window.currentPokemonName;
    let currentItem = window.currentItem;
    let currentAbility = window.currentAbility;
    let currentNature = "";
    let currentEVSpread = "";
    if (window.initialSpread !== "") {
      const spreadResult = toShowdownSpread(window.initialSpread);
      currentNature = spreadResult[0];
      currentEVSpread = spreadResult[1];
    }
    let currentMoves = window.initialMoves;
    let currentTeraType = "";
    if (window.teraType !== "" && window.teraType !== "Nothing") {
      currentTeraType = "\nTera Type: " + window.teraType;
    }
    let currentLevel = "";
    if (window.selectedFormat.includes("vgc") || window.selectedFormat.includes("battlestadium")) {
      currentLevel = "\nLevel: 50";
    }
    if (window.selectedFormat.includes("lc")) {
      currentLevel = "\nLevel: 5";
    }
    function generateShowdownSet() {
      let showdownSet = currentPokemonName;
      if (currentItem != "Nothing") {
        showdownSet += " @ " + currentItem;
      }
      showdownSet += "\nAbility: " + currentAbility;
      showdownSet += currentLevel;
      showdownSet += currentTeraType;
      showdownSet += "\nEVs: " + currentEVSpread;
      showdownSet += "\n" + currentNature + " Nature";
      currentMoves.forEach(move => {
        showdownSet += "\n- " + move;
      });
      return showdownSet;
    }
    $("#showdown-set").val(generateShowdownSet());
  
    $("#pokemonSearchInput").on("input", function() {
      let query = $(this).val().toLowerCase();
      let filteredItems = initialPokemonListItems.filter(item => $(item).text().toLowerCase().includes(query));
      $("#pokemon-list").empty().append(filteredItems);
    });
    $("#metaSearchInput").on("input", function() {
      let query = $(this).val().toLowerCase();
      let filteredItems = initialMetaListItems.filter(item => $(item).text().toLowerCase().includes(query));
      $("#meta-list").empty().append(filteredItems);
    });
    function toShowdownSpread(statsSpread) {
      const [naturePart, evPart] = statsSpread.split(":");
      const evs = evPart.replace(/\s/g, '').split("/");
      let evSpreadArr = [];
      if (evs[0] !== "0") { evSpreadArr.push(evs[0] + " HP"); }
      if (evs[1] !== "0") { evSpreadArr.push(evs[1] + " Atk"); }
      if (evs[2] !== "0") { evSpreadArr.push(evs[2] + " Def"); }
      if (evs[3] !== "0") { evSpreadArr.push(evs[3] + " SpA"); }
      if (evs[4] !== "0") { evSpreadArr.push(evs[4] + " SpD"); }
      if (evs[5] !== "0") { evSpreadArr.push(evs[5] + " Spe"); }
      return [naturePart, evSpreadArr.join(" / ")];
    }
    window.toShowdownSpread = toShowdownSpread;
    
    // Functions used by HTML (exposed globally)
    window.selectPokemon = function(pokemonName) {
      document.getElementById('selectedPokemon').value = pokemonName;
    };
    window.selectMeta = function(metaType) {
      document.getElementById('selectedMeta').value = metaType;
    };
    window.selectRating = function(ratingType) {
      document.getElementById('selectedRating').value = ratingType;
    };
    window.selectEVs = function(evType) {
      const evCategories = ["hp", "atk", "def", "spa", "spd", "spe"];
      // Hide all EV categories
      evCategories.forEach(cat => {
        const elements = document.getElementsByClassName("evs_" + cat);
        for (let el of elements) {
          el.hidden = true;
        }
      });
      // Show selected category
      const selectedElements = document.getElementsByClassName("evs_" + evType);
      for (let el of selectedElements) {
        el.hidden = false;
      }
      // Remove underline from all EV buttons (hp not clickable)
      const evButtonIds = ["atk_evs", "spa_evs", "spe_evs", "def_evs", "spd_evs"];
      evButtonIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove("underline");
      });
      document.getElementById(evType + "_evs").classList.add("underline");
    };
    document.getElementById('pokemonSearchInput').addEventListener('keydown', function(event) {
      if (event.key === "Enter" || event.keyCode === 13) {
        event.preventDefault();
      }
    });
    document.getElementById('metaSearchInput').addEventListener('keydown', function(event) {
      if (event.key === "Enter" || event.keyCode === 13) {
        event.preventDefault();
      }
    });
    function changeNature(currentNatureVal, stat, diff) {
      const attackNatures = ["Adamant", "Naughty", "Lonely", "Brave"];
      const defenseNatures = ["Relaxed", "Bold", "Impish", "Lax"];
      const spAttackNatures = ["Modest", "Mild", "Quiet", "Rash"];
      const spDefenseNatures = ["Sassy", "Gentle", "Calm", "Careful"];
      const speedNatures = ["Timid", "Hasty", "Jolly", "Naive"];
      const attackNaturesM = ["Bold", "Timid", "Modest", "Calm"];
      const defenseNaturesM = ["Lonely", "Hasty", "Mild", "Gentle"];
      const spAttackNaturesM = ["Adamant", "Impish", "Jolly", "Careful"];
      const spDefenseNaturesM = ["Naughty", "Lax", "Naive", "Rash"];
      const speedNaturesM = ["Brave", "Relaxed", "Quiet", "Sassy"];
      let naturesForStat = [];
      if (diff === "+") {
        if (stat === "Atk") { naturesForStat = attackNatures; }
        if (stat === "SpA") { naturesForStat = spAttackNatures; }
        if (stat === "Spe") { naturesForStat = speedNatures; }
        if (stat === "Def") { naturesForStat = defenseNatures; }
        if (stat === "SpD") { naturesForStat = spDefenseNatures; }
        if (attackNaturesM.includes(currentNatureVal)) {
          const filtered = naturesForStat.filter(n => attackNaturesM.includes(n));
          return filtered.length ? filtered[0] : naturesForStat[0];
        }
        if (defenseNaturesM.includes(currentNatureVal)) {
          const filtered = naturesForStat.filter(n => defenseNaturesM.includes(n));
          return filtered.length ? filtered[0] : naturesForStat[0];
        }
        if (spAttackNaturesM.includes(currentNatureVal)) {
          const filtered = naturesForStat.filter(n => spAttackNaturesM.includes(n));
          return filtered.length ? filtered[0] : naturesForStat[0];
        }
        if (spDefenseNaturesM.includes(currentNatureVal)) {
          const filtered = naturesForStat.filter(n => spDefenseNaturesM.includes(n));
          return filtered.length ? filtered[0] : naturesForStat[0];
        }
        if (speedNaturesM.includes(currentNatureVal)) {
          const filtered = naturesForStat.filter(n => speedNaturesM.includes(n));
          return filtered.length ? filtered[0] : naturesForStat[0];
        }
        return naturesForStat[0];
      }
      if (diff === "-") {
        if (stat === "Atk") { naturesForStat = attackNaturesM; }
        if (stat === "SpA") { naturesForStat = spAttackNaturesM; }
        if (stat === "Spe") { naturesForStat = speedNaturesM; }
        if (stat === "Def") { naturesForStat = defenseNaturesM; }
        if (stat === "SpD") { naturesForStat = spDefenseNaturesM; }
        if (attackNatures.includes(currentNatureVal)) {
          const filtered = naturesForStat.filter(n => attackNatures.includes(n));
          return filtered.length ? filtered[0] : naturesForStat[0];
        }
        if (defenseNatures.includes(currentNatureVal)) {
          const filtered = naturesForStat.filter(n => defenseNatures.includes(n));
          return filtered.length ? filtered[0] : naturesForStat[0];
        }
        if (spAttackNatures.includes(currentNatureVal)) {
          const filtered = naturesForStat.filter(n => spAttackNatures.includes(n));
          return filtered.length ? filtered[0] : naturesForStat[0];
        }
        if (spDefenseNatures.includes(currentNatureVal)) {
          const filtered = naturesForStat.filter(n => spDefenseNatures.includes(n));
          return filtered.length ? filtered[0] : naturesForStat[0];
        }
        if (speedNatures.includes(currentNatureVal)) {
          const filtered = naturesForStat.filter(n => speedNatures.includes(n));
          return filtered.length ? filtered[0] : naturesForStat[0];
        }
        return naturesForStat[0];
      }
      if (diff === " ") {
        if (stat === "Atk" && (attackNatures.includes(currentNatureVal) || attackNaturesM.includes(currentNatureVal))) {
          return "Hardy";
        }
        if (stat === "Def" && (defenseNatures.includes(currentNatureVal) || defenseNaturesM.includes(currentNatureVal))) {
          return "Hardy";
        }
        if (stat === "SpA" && (spAttackNatures.includes(currentNatureVal) || spAttackNaturesM.includes(currentNatureVal))) {
          return "Hardy";
        }
        if (stat === "SpD" && (spDefenseNatures.includes(currentNatureVal) || spDefenseNaturesM.includes(currentNatureVal))) {
          return "Hardy";
        }
        if (stat === "Spe" && (speedNatures.includes(currentNatureVal) || speedNaturesM.includes(currentNatureVal))) {
          return "Hardy";
        }
        return currentNatureVal;
      }
    }
    window.changeNature = changeNature;
  
    $(".export-button").click(function() {
      const exportDataText = $(this).attr("export-data");
      const exportData = JSON.parse(exportDataText);
      if (typeof exportData.ev === 'string') {
        let stat = "";
        if (exportData.ev.includes("Atk")) { stat = "Atk"; }
        if (exportData.ev.includes("SpA")) { stat = "SpA"; }
        if (exportData.ev.includes("Spe")) { stat = "Spe"; }
        if (exportData.ev.includes("Def")) { stat = "Def"; }
        if (exportData.ev.includes("SpD")) { stat = "SpD"; }
        let diff = " ";
        if (exportData.ev.includes("+")) { diff = "+"; }
        if (exportData.ev.includes("-")) { diff = "-"; }
        currentNature = changeNature(currentNature, stat, diff);
        currentEVSpread = exportData.ev.replace("+", "").replace("-", "");
      }
      if (typeof exportData.item === 'string') {
        currentItem = exportData.item;
      }
      if (typeof exportData.ability === 'string') {
        currentAbility = exportData.ability;
      }
      if (typeof exportData.nature === 'string') {
        currentNature = exportData.nature;
      }
      if (typeof exportData.tera === 'string') {
        currentTeraType = "\nTera Type: " + exportData.tera;
      }
      if (typeof exportData.move === 'string' && exportData.move != "Nothing") {
        if (!currentMoves.includes(exportData.move)) {
          currentMoves.unshift(exportData.move);
          if (currentMoves.length > 4) { currentMoves.pop(); }
        } else {
          const pos = currentMoves.indexOf(exportData.move);
          currentMoves.splice(pos, 1);
          currentMoves.unshift(exportData.move);
        }
      }
      if (typeof exportData.spread === 'string') {
        const temp = toShowdownSpread(exportData.spread);
        currentNature = temp[0];
        currentEVSpread = temp[1];
      }
      $("#showdown-set").val(generateShowdownSet());
    });
  
    document.getElementById("copy-button").addEventListener("click", function() {
      const textToCopy = document.getElementById("showdown-set").value;
      navigator.clipboard.writeText(textToCopy).then(function() {
        document.getElementById("copy-button").textContent = "Copied!";
      });
      setTimeout(function() {
        document.getElementById("copy-button").textContent = "Copy Pokemon to Clipboard";
      }, 2000);
    });
  });
  