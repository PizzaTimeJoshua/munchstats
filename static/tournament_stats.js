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
  var currentTournamentId = window.currentTournamentId;
  var currentDayFilter = window.currentDayFilter;
  var currentPokemonName = window.currentPokemonName;
  var isLoading = false;

  // ========== SEARCH FILTERS ==========
  $("#tournamentSearchInput").on("input", function () {
    var query = $(this).val().toLowerCase();
    $("#tournament-list li").each(function () {
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
      $("#tournament-list li.tournament-group-header").each(function () {
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
  async function fetchTournamentData(tournamentId, dayFilter, pokemonName) {
    if (isLoading) return;
    isLoading = true;
    document.getElementById("loading-overlay").classList.add("active");

    var url = "/tournaments/api/" + encodeURIComponent(tournamentId) +
              "/" + encodeURIComponent(dayFilter) + "/";
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
      var newUrl = "/tournaments/" + data.selected_tournament.id + "/" +
                   data.day_filter + "/" + data.selected_pokemon;
      history.pushState({
        tournament: data.selected_tournament.id,
        day: data.day_filter,
        pokemon: data.selected_pokemon
      }, "", newUrl);
    } catch (e) {
      console.error("Failed to fetch tournament data:", e);
    }

    isLoading = false;
    document.getElementById("loading-overlay").classList.remove("active");
  }

  function updatePage(data) {
    currentTournamentId = data.selected_tournament.id;
    currentDayFilter = data.day_filter;
    currentPokemonName = data.selected_pokemon;

    // Update pokemon info card
    var cp = data.current_pokemon;
    var sprite = cp[3];
    $("#info-sprite").css("background-position", (sprite[1] * -40) + "px " + (sprite[0] * -30) + "px");
    $("#info-name").text(cp[0]);
    $("#info-usage").text(cp[1] + "%");
    $("#info-rank").text("#" + cp[2]);
    $("#info-teams").text(data.total_teams);
    $("#info-tournament").text(data.selected_tournament.name);

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

    // Update tournament list highlights
    $("#tournament-list .meta-button").removeClass("active");
    $("#tournament-list .meta-button").each(function () {
      var onclick = $(this).attr("onclick") || "";
      if (onclick.indexOf(currentTournamentId) !== -1) {
        $(this).addClass("active");
      }
    });

    // Update day filter highlights
    $("#day-filter-container .rating-button").removeClass("active");
    $("#day-filter-container .rating-button").each(function () {
      var onclick = $(this).attr("onclick") || "";
      if (onclick.indexOf("'" + currentDayFilter + "'") !== -1) {
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
    updateDataSection("#items-container", data.items_list, "item");
    updateDataSection("#abilities-container", data.abilities_list, "ability");
    updateDataSection("#tera-container", data.tera_types_list, "tera");
    $("#tera-section").toggle(!!(data.tera_types_list && data.tera_types_list.length));
    updateDataSection("#natures-container", data.natures_list, "nature");
    $("#natures-section").toggle(!!(data.natures_list && data.natures_list.length));
    updateTeammatesSection(data.teammates_list);

    // Update teams header
    $(".teams-container h2").text("Teams with " + currentPokemonName);

    // Load teams for the selected Pokemon
    loadTeams(currentTournamentId, currentPokemonName, currentDayFilter);

    // Reload standings if that view is active
    var standingsView = document.getElementById("standings-view");
    if (standingsView && standingsView.style.display !== "none") {
      loadStandings(currentTournamentId, currentDayFilter);
    }
  }

  function updateDataSection(containerId, dataList, type) {
    var container = $(containerId);
    if (!dataList || dataList.length === 0) {
      container.html("");
      return;
    }
    var html = "<ul>";
    dataList.forEach(function (entry) {
      if (type === "item" && entry.length > 3) {
        var itemBg = (entry[3][1] * -24) + "px " + (entry[3][0] * -24) + "px";
        html += '<li><button type="button" class="export-button has-tooltip" data-tooltip="' +
          escapeAttr(entry[2]) + '">' +
          '<div class="image-item" style="background-position: ' + itemBg + ';">' +
          '<span class="left-text" style="padding-left: 32px;">' + entry[0] + '</span></div>' +
          '<span class="right-text">' + entry[1] + '%</span></button></li>';
      } else if (type === "tera") {
        html += '<li><button type="button" class="export-button">' +
          '<span class="type-' + entry[0] + '">' + entry[0] + '</span>' +
          '<span class="right-text">' + entry[1] + '%</span></button></li>';
      } else {
        var tooltip = entry.length > 2 ? ' has-tooltip" data-tooltip="' + escapeAttr(entry[2]) : '';
        html += '<li><button type="button" class="export-button' + tooltip + '">' +
          '<span class="left-text">' + entry[0] + '</span>' +
          '<span class="right-text">' + entry[1] + '%</span></button></li>';
      }
    });
    html += "</ul>";
    container.html(html);
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

  function escapeAttr(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
              .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ========== TEAMS LOADING ==========
  async function loadTeams(tournamentId, pokemonName, dayFilter) {
    var container = document.getElementById("teams-list");
    if (!container) return;
    container.innerHTML = '<p style="color: #666; font-size: 13px;">Loading teams...</p>';

    var url = "/tournaments/api/" + encodeURIComponent(tournamentId) +
              "/teams/" + encodeURIComponent(pokemonName) +
              "?day=" + encodeURIComponent(dayFilter);

    try {
      var res = await fetch(url);
      if (!res.ok) {
        container.innerHTML = '<p style="color: #666; font-size: 13px;">No teams found.</p>';
        return;
      }
      var teams = await res.json();
      renderTeams(teams, container);
    } catch (e) {
      container.innerHTML = '<p style="color: #666; font-size: 13px;">Failed to load teams.</p>';
    }
  }

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

  function renderTeams(teams, container) {
    if (!teams || teams.length === 0) {
      container.innerHTML = '<p style="color: #666; font-size: 13px;">No teams found.</p>';
      return;
    }

    var html = "";
    teams.forEach(function (team, idx) {
      // Team card header
      html += '<div class="team-card" onclick="toggleTeamDetail(' + idx + ')">';
      html += '<span class="team-placement">#' + team.placement + '</span>';
      html += '<span class="team-player">' + team.player;
      if (team.record && team.record.wins !== undefined) {
        html += ' <span class="team-record">(' + team.record.wins + '-' + team.record.losses + ')</span>';
      }
      html += '</span>';
      html += '<span class="team-sprites">';
      team.team.forEach(function (slot) {
        var bgPos = (slot.sprite[1] * -40) + "px " + (slot.sprite[0] * -30) + "px";
        html += '<div class="image-pokemon" style="background-position: ' + bgPos + ';" title="' + slot.pokemon + '"></div>';
      });
      html += '</span>';
      html += '</div>';

      // Expandable detail with grid
      html += '<div class="team-detail" id="team-detail-' + idx + '">';
      html += '<div class="team-detail-grid">';
      team.team.forEach(function (slot) {
        html += '<div class="team-detail-pokemon">';
        html += '<div class="td-name">' + slot.pokemon + '</div>';
        html += '<div class="td-info">';
        if (slot.tera_type) html += 'Tera: ' + slot.tera_type + '<br>';
        if (slot.nature) html += 'Nature: ' + slot.nature + '<br>';
        if (slot.ability) html += 'Ability: ' + slot.ability + '<br>';
        if (slot.item) html += 'Item: ' + slot.item + '<br>';
        if (slot.moves && slot.moves.length > 0) {
          slot.moves.forEach(function (m) { html += '- ' + m + '<br>'; });
        }
        html += '</div></div>';
      });
      html += '</div>';
      html += '<button class="team-copy-btn" onclick="copyTeam(event, ' + idx + ')">Copy Team to Clipboard</button>';
      html += '</div>';
    });

    container.innerHTML = html;

    // Store team data for copy
    window._teamsData = teams;
  }

  window.toggleTeamDetail = function (idx) {
    var el = document.getElementById("team-detail-" + idx);
    if (el) {
      el.classList.toggle("open");
    }
  };

  window.toggleStandingsDetail = function (idx) {
    var el = document.getElementById("standings-detail-" + idx);
    if (el) {
      el.classList.toggle("open");
    }
  };

  window.copyStandingsTeam = function (event, idx) {
    event.stopPropagation();
    if (!window._standingsData || !window._standingsData[idx]) return;
    var text = teamToShowdown(window._standingsData[idx].team);
    navigator.clipboard.writeText(text).then(function () {
      var btn = event.target;
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(function () {
        btn.textContent = "Copy Team to Clipboard";
        btn.classList.remove("copied");
      }, 2000);
    });
  };

  window.copyTeam = function (event, idx) {
    event.stopPropagation();
    if (!window._teamsData || !window._teamsData[idx]) return;
    var text = teamToShowdown(window._teamsData[idx].team);
    navigator.clipboard.writeText(text).then(function () {
      var btn = event.target;
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(function () {
        btn.textContent = "Copy Team to Clipboard";
        btn.classList.remove("copied");
      }, 2000);
    });
  };

  // ========== STANDINGS ==========
  async function loadStandings(tournamentId, dayFilter) {
    var container = document.getElementById("standings-list");
    if (!container) return;
    container.innerHTML = '<p style="color: #666; font-size: 13px;">Loading standings...</p>';

    var url = "/tournaments/api/" + encodeURIComponent(tournamentId) +
              "/standings?day=" + encodeURIComponent(dayFilter);

    try {
      var res = await fetch(url);
      if (!res.ok) {
        container.innerHTML = '<p style="color: #666; font-size: 13px;">No standings available.</p>';
        return;
      }
      var standings = await res.json();
      renderStandings(standings, container);
    } catch (e) {
      container.innerHTML = '<p style="color: #666; font-size: 13px;">Failed to load standings.</p>';
    }
  }

  function buildSearchText(entry) {
    var parts = [entry.name];
    entry.team.forEach(function (slot) {
      parts.push(slot.pokemon);
      if (slot.item) parts.push(slot.item);
      if (slot.ability) parts.push(slot.ability);
      if (slot.tera_type) parts.push(slot.tera_type);
      if (slot.nature) parts.push(slot.nature);
      if (slot.moves) slot.moves.forEach(function (m) { parts.push(m); });
    });
    return parts.join(" ").toLowerCase();
  }

  function renderStandings(standings, container) {
    if (!standings || standings.length === 0) {
      container.innerHTML = '<p style="color: #666; font-size: 13px;">No standings available.</p>';
      return;
    }

    var html = "";
    standings.forEach(function (entry, idx) {
      var searchText = escapeAttr(buildSearchText(entry));
      html += '<div class="standings-entry" data-search="' + searchText + '">';

      html += '<div class="team-card" onclick="toggleStandingsDetail(' + idx + ')">';
      html += '<span class="team-placement">#' + entry.placement + '</span>';
      html += '<span class="team-player">' + entry.name;
      if (entry.record && entry.record.wins !== undefined) {
        html += ' <span class="team-record">(' + entry.record.wins + '-' + entry.record.losses + ')</span>';
      }
      html += '</span>';
      html += '<span class="team-sprites">';
      entry.team.forEach(function (slot) {
        var bgPos = (slot.sprite[1] * -40) + "px " + (slot.sprite[0] * -30) + "px";
        html += '<div class="image-pokemon" style="background-position: ' + bgPos + ';" title="' + slot.pokemon + '"></div>';
      });
      html += '</span>';
      html += '</div>';

      // Expandable detail
      html += '<div class="team-detail" id="standings-detail-' + idx + '">';
      html += '<div class="team-detail-grid">';
      entry.team.forEach(function (slot) {
        html += '<div class="team-detail-pokemon">';
        html += '<div class="td-name">' + slot.pokemon + '</div>';
        html += '<div class="td-info">';
        if (slot.tera_type) html += 'Tera: ' + slot.tera_type + '<br>';
        if (slot.nature) html += 'Nature: ' + slot.nature + '<br>';
        if (slot.ability) html += 'Ability: ' + slot.ability + '<br>';
        if (slot.item) html += 'Item: ' + slot.item + '<br>';
        if (slot.moves && slot.moves.length > 0) {
          slot.moves.forEach(function (m) { html += '- ' + m + '<br>'; });
        }
        html += '</div></div>';
      });
      html += '</div>';
      html += '<button class="team-copy-btn" onclick="copyStandingsTeam(event, ' + idx + ')">Copy Team to Clipboard</button>';
      html += '</div>';

      html += '</div>'; // .standings-entry
    });

    container.innerHTML = html;

    // Store standings data for copy
    window._standingsData = standings;
  }

  // ========== STANDINGS SEARCH ==========
  $("#standingsSearchInput").on("input", function () {
    var query = $(this).val().toLowerCase();
    $("#standings-list .standings-entry").each(function () {
      var searchText = $(this).attr("data-search") || "";
      $(this).toggle(searchText.indexOf(query) !== -1);
    });
  });

  // ========== VIEW TOGGLE ==========
  window.switchView = function (view) {
    var usageView = document.getElementById("usage-view");
    var standingsView = document.getElementById("standings-view");
    var btnUsage = document.getElementById("btn-usage-view");
    var btnStandings = document.getElementById("btn-standings-view");

    if (view === "standings") {
      usageView.style.display = "none";
      standingsView.style.display = "grid";
      btnUsage.classList.remove("active");
      btnStandings.classList.add("active");
      loadStandings(currentTournamentId, currentDayFilter);
    } else {
      usageView.style.display = "grid";
      standingsView.style.display = "none";
      btnUsage.classList.add("active");
      btnStandings.classList.remove("active");
    }
  };

  // ========== GLOBAL SELECTION FUNCTIONS ==========
  window.selectTournament = function (id) {
    currentTournamentId = id;
    fetchTournamentData(id, currentDayFilter, "");
  };

  window.selectDayFilter = function (filter) {
    currentDayFilter = filter;
    fetchTournamentData(currentTournamentId, filter, currentPokemonName);
  };

  window.selectPokemon = function (name) {
    currentPokemonName = name;
    fetchTournamentData(currentTournamentId, currentDayFilter, name);
  };

  // ========== BROWSER HISTORY ==========
  window.addEventListener("popstate", function (event) {
    if (event.state) {
      fetchTournamentData(event.state.tournament, event.state.day, event.state.pokemon);
    }
  });

  history.replaceState({
    tournament: currentTournamentId,
    day: currentDayFilter,
    pokemon: currentPokemonName
  }, "");

  // ========== INITIAL LOAD ==========
  if (currentPokemonName && currentTournamentId) {
    loadTeams(currentTournamentId, currentPokemonName, currentDayFilter);
  }
});
