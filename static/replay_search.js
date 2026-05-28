$(document).ready(function() {
    defaultReplays();

    // View tab switching
    $('.view-tab').on('click', function() {
        var view = $(this).data('view');
        $('.view-tab').removeClass('active');
        $(this).addClass('active');
        $('.view-content').removeClass('active');
        $('#' + view + 'View').addClass('active');
        if (view === 'rankings' && $('#rankings-list').children().length === 0) {
            loadTeamRankings();
        }
    });

    $('#ratingToggle').on('change', function() {
        $('#ratingValue').toggle(this.checked);
    });

    $('#usageScoreToggle').on('change', function() {
        $('#usageScoreValue').toggle(this.checked);
        $('#usageScoreExplained').toggle(this.checked);
    });

    // Reload replays when the "Load" button is clicked
    $('#loadButton').on('click', function() {
        if ($('.view-tab[data-view="rankings"]').hasClass('active')) {
            loadTeamRankings();
        } else {
            loadReplays();
        }
    });

    // Delegated click handler for non-Bo3 replay cards
    $(document).on('click', 'button.team-container', function() {
        var replayId = $(this).data('replay-id');
        var title = decodeURIComponent($(this).data('replay-title'));
        openReplayModal(replayId, title);
    });

    // Delegated click handler for Bo3 game buttons
    $(document).on('click', '.bo3-game-btn', function() {
        var replayId = $(this).data('replay-id');
        var bo3 = JSON.parse(decodeURIComponent($(this).data('bo3')));
        var title = decodeURIComponent($(this).data('bo3-title'));
        var gameIndex = $(this).data('game-index');
        openReplayModal(replayId, title + ' - Game ' + (gameIndex + 1), bo3, gameIndex);
    });

    function getFormatDisplayName() {
        return $('#formatSelect option:selected').text();
    }

    function defaultReplays() {
        $('#replays-list').empty();
        $('#replay-header').hide();
        $('#loadingText').toggle(true);
        $.ajax({
            url: '/replays/api/default',
            method: 'GET',
            success: function(data) {
                updateReplays(data, getFormatDisplayName());
            },
            error: function(error) {
                console.error('Error fetching replays:', error);
                $('#errorText').toggle(true);
                $('#loadingText').toggle(false);
            }
        });
    }

    function loadReplays() {
        $('#replays-list').empty();
        $('#replay-header').hide();
        $('#loadingText').toggle(true);
        $('#errorText').toggle(false);
        $('#noReplaysText').toggle(false);

        var pokemonValue = $('#pokemonValue').val();
        var playerValue = $('#playerValue').val();
        var filter_format = $('#formatSelect').val();
        var filter_battleused = $('#usedToggle').is(':checked');
        var filter_rating_enabled = $('#ratingToggle').is(':checked');
        var filter_rating = $('#ratingValue').val();
        var filter_usage_score_enabled = $('#usageScoreToggle').is(':checked');
        var filter_usage_score = $('#usageScoreValue').val();
        var filter_winner = $('#winnerToggle').is(':checked');
        var filter_all_pokemon = $('#allPokemon').is(':checked');

        $.ajax({
            url: '/replays/api/search',
            method: 'GET',
            data: {
                pokemon_search: pokemonValue,
                filter_format: filter_format,
                filter_battleused: filter_battleused,
                filter_rating_enabled: filter_rating_enabled,
                filter_rating: filter_rating,
                filter_usage_score_enabled: filter_usage_score_enabled,
                filter_usage_score: filter_usage_score,
                filter_winner: filter_winner,
                filter_players: playerValue,
                filter_all_pokemon: filter_all_pokemon
            },
            success: function(data) {
                updateReplays(data, getFormatDisplayName());
            },
            error: function(error) {
                console.error('Error fetching replays:', error);
                $('#errorText').toggle(true);
                $('#loadingText').toggle(false);
            }
        });
    }

    function updateReplays(replays, format) {
        $('#replays-list').empty();
        $('#loadingText').toggle(false);

        if (replays.length < 1) {
            $('#noReplaysText').toggle(true);
            $('#replay-header').hide();
            return;
        }

        // Show Games column only if any replay is Bo3
        var hasBo3 = replays.some(function(r) { return r[9].includes("Bo3"); });
        var header = $('#replay-header');
        var gamesCol = $('#header-games-col');
        if (hasBo3) {
            header.addClass('has-games');
            gamesCol.text('Games').show();
        } else {
            header.removeClass('has-games');
            gamesCol.text('').hide();
        }
        header.show();

        var showUsageScore = $('#usageScoreToggle').is(':checked');

        replays.forEach(function(replay) {
            var bo3 = replay[9].includes("Bo3");

            // Build sprite HTML inline
            var p1Sprites = '';
            replay[4][0].forEach(function(idx) { p1Sprites += spriteHTML(idx); });
            var p2Sprites = '';
            replay[4][1].forEach(function(idx) { p2Sprites += spriteHTML(idx); });

            var li_item = '<li>';
            var gamesClass = hasBo3 ? ' has-games' : '';

            if (bo3) {
                li_item += '<div class="team-container' + gamesClass + '">';
            } else {
                var replayTitle = encodeURIComponent(replay[3][0] + ' vs ' + replay[3][1]);
                li_item += '<button class="team-container' + gamesClass + '" data-replay-id="' + replay[0] + '" data-replay-title="' + replayTitle + '">';
            }

            // Col 1: Rating
            li_item += '<div class="grid-item">' + replay[1] + '</div>';

            // Col 2: Player 1
            li_item += '<div class="grid-item player-cell">';
            li_item += '<div class="player-name">' + replay[3][0] + '</div>';
            li_item += '<div class="sprite-container">' + p1Sprites + '</div>';
            if (showUsageScore) {
                li_item += '<div class="usage-score">Usage: ' + parseFloat(replay[7][0]).toFixed(2) + '</div>';
            }
            li_item += '</div>';

            // Col 3: Player 2
            li_item += '<div class="grid-item player-cell">';
            li_item += '<div class="player-name">' + replay[3][1] + '</div>';
            li_item += '<div class="sprite-container">' + p2Sprites + '</div>';
            if (showUsageScore) {
                li_item += '<div class="usage-score">Usage: ' + parseFloat(replay[7][1]).toFixed(2) + '</div>';
            }
            li_item += '</div>';

            // Col 4: Score
            li_item += '<div class="grid-item">' + replay[5] + '</div>';

            // Col 5: Date
            var upload_time = new Date(replay[6] * 1000);
            li_item += '<div class="grid-item">' + upload_time.toLocaleDateString("default") + '</div>';

            // Col 6: Games column (only when hasBo3)
            if (hasBo3) {
                if (bo3) {
                    li_item += '<div class="grid-item">';
                    var bo3Attr = encodeURIComponent(JSON.stringify(replay[8]));
                    var bo3Title = replay[3][0] + ' vs ' + replay[3][1];
                    var bo3TitleAttr = encodeURIComponent(bo3Title);
                    for (var gi = 0; gi < 3; gi++) {
                        if (replay[8][gi] != "") {
                            li_item += '<button class="game-btn bo3-game-btn" data-replay-id="' + replay[8][gi] + '" data-bo3="' + bo3Attr + '" data-bo3-title="' + bo3TitleAttr + '" data-game-index="' + gi + '">Game ' + (gi + 1) + '</button>';
                        } else {
                            li_item += '<button class="game-btn disabled"><s>Game ' + (gi + 1) + '</s></button>';
                        }
                    }
                    li_item += '</div>';
                } else {
                    li_item += '<div class="grid-item"></div>';
                }
            }

            if (bo3) {
                li_item += '</div>';
            } else {
                li_item += '</button>';
            }

            li_item += '</li>';
            $('#replays-list').append(li_item);
        });
    }

    function spriteHTML(index) {
        var columnIndex = index % 12;
        var rowIndex = Math.floor(index / 12);
        return '<div class="sprite" style="background-position: -' + (columnIndex * 40) + 'px -' + (rowIndex * 30) + 'px"></div>';
    }

    function loadTeamRankings() {
        var format = $('#formatSelect').val();
        $('#rankings-list').empty();
        $('#rankingsLoadingText').toggle(true);
        $('#rankingsNoDataText').toggle(false);
        $('#rankingsErrorText').toggle(false);
        $('#rankings-format-name').text(getFormatDisplayName());

        var pokemonValue = $('#pokemonValue').val();
        var filterAllPokemon = $('#allPokemon').is(':checked');

        $.ajax({
            url: '/replays/api/rankings',
            method: 'GET',
            data: {
                format: format,
                limit: 50,
                pokemon_search: pokemonValue,
                filter_all_pokemon: filterAllPokemon
            },
            success: function(data) {
                $('#rankingsLoadingText').toggle(false);
                if (data.length === 0) {
                    $('#rankingsNoDataText').toggle(true);
                    return;
                }
                renderTeamRankings(data);
            },
            error: function() {
                $('#rankingsLoadingText').toggle(false);
                $('#rankingsErrorText').toggle(true);
            }
        });
    }

    function renderTeamRankings(teams) {
        var container = $('#rankings-list');
        container.empty();

        teams.forEach(function(team, idx) {
            var rank = idx + 1;
            var spritesHtml = '';
            for (var i = 0; i < team.sprites.length; i++) {
                spritesHtml += spriteHTML(team.sprites[i]);
            }

            var namesHtml = '';
            for (var i = 0; i < team.team.length; i++) {
                namesHtml += '<span>' + team.team[i] + '</span>';
            }

            var hasBo3 = team.replays.some(function(r) {
                return r.bo3_matches && r.bo3_matches.filter(function(m) { return m !== ''; }).length > 1;
            });

            var gridCols = hasBo3 ? '1fr 1fr 80px 80px 80px' : '1fr 1fr 80px 80px';
            var replaysHtml = '<div class="team-rank-replay-header" style="grid-template-columns:' + gridCols + '">' +
                '<div>Player</div><div>Opponent</div><div>Rating</div><div>Result</div>' + (hasBo3 ? '<div>Games</div>' : '') + '</div>';

            team.replays.forEach(function(r) {
                var resultClass = r.won ? 'replay-won' : 'replay-lost';
                var resultText = r.won ? 'W' : 'L';
                var bo3Count = r.bo3_matches ? r.bo3_matches.filter(function(m) { return m !== ''; }).length : 0;
                var isBo3 = bo3Count > 1;
                var gamesHtml = '';

                if (isBo3) {
                    var bo3Attr = encodeURIComponent(JSON.stringify(r.bo3_matches));
                    var bo3Title = encodeURIComponent(r.player + ' vs ' + r.opponent);
                    for (var gi = 0; gi < r.bo3_matches.length; gi++) {
                        if (r.bo3_matches[gi] !== '') {
                            gamesHtml += '<button class="game-btn bo3-game-btn" data-replay-id="' + r.bo3_matches[gi] + '" data-bo3="' + bo3Attr + '" data-bo3-title="' + bo3Title + '" data-game-index="' + gi + '">G' + (gi + 1) + '</button>';
                        } else {
                            gamesHtml += '<button class="game-btn disabled"><s>G' + (gi + 1) + '</s></button>';
                        }
                    }
                }

                var replayAttrs = isBo3 ? '' : ' data-replay-id="' + r.id + '" data-replay-title="' + encodeURIComponent(r.player + ' vs ' + r.opponent) + '"';
                replaysHtml += '<div class="team-rank-replay-row' + (isBo3 ? '' : ' clickable-replay') + '"' + replayAttrs + ' style="grid-template-columns:' + gridCols + '">' +
                    '<div>' + r.player + '</div>' +
                    '<div>' + r.opponent + '</div>' +
                    '<div>' + r.rating + '</div>' +
                    '<div class="' + resultClass + '">' + resultText + '</div>' +
                    (hasBo3 ? '<div>' + gamesHtml + '</div>' : '') +
                    '</div>';
            });

            var card = '<div class="team-rank-card">' +
                '<div class="team-rank-header">' +
                    '<div class="team-rank-number">#' + rank + '</div>' +
                    '<div class="team-rank-sprites">' + spritesHtml + '</div>' +
                    '<div class="team-rank-stats">' +
                        '<div class="team-rank-stat"><span class="team-rank-stat-label">Record</span><span class="team-rank-stat-value">' + team.wins + '-' + team.losses + '</span></div>' +
                        '<div class="team-rank-stat"><span class="team-rank-stat-label">Win Rate</span><span class="team-rank-stat-value">' + team.win_rate + '%</span></div>' +
                        '<div class="team-rank-stat"><span class="team-rank-stat-label">Avg Rating</span><span class="team-rank-stat-value">' + team.avg_rating + '</span></div>' +
                        '<div class="team-rank-stat"><span class="team-rank-stat-label">Max Rating</span><span class="team-rank-stat-value">' + team.max_rating + '</span></div>' +
                        '<div class="team-rank-stat"><span class="team-rank-stat-label">Battles</span><span class="team-rank-stat-value">' + team.total_battles + '</span></div>' +
                    '</div>' +
                    '<div class="team-rank-expand">&#9660;</div>' +
                '</div>' +
                '<div class="team-rank-names">' + namesHtml + '</div>' +
                '<div class="team-rank-replays">' + replaysHtml + '</div>' +
                '</div>';

            container.append(card);
        });
    }

    // Toggle expand/collapse on header or names click
    $('#rankings-list').on('click', '.team-rank-header, .team-rank-names', function() {
        $(this).closest('.team-rank-card').toggleClass('expanded');
    });

    // Open replay modal for non-Bo3 replay rows in team rankings
    $('#rankings-list').on('click', '.clickable-replay', function() {
        var replayId = $(this).data('replay-id');
        var title = decodeURIComponent($(this).data('replay-title'));
        openReplayModal(replayId, title);
    });
});

// Replay Modal
var currentBo3Data = null;

function openReplayModal(replayId, title, bo3Matches, gameIndex) {
    var modal = document.getElementById('replayModal');
    var iframe = document.getElementById('replayIframe');
    var titleEl = document.getElementById('replayModalTitle');
    var extLink = document.getElementById('replayExternalLink');
    var gamesEl = document.getElementById('replayModalGames');

    titleEl.textContent = title || 'Replay Viewer';
    extLink.href = 'https://replay.pokemonshowdown.com/' + replayId;
    iframe.src = '/replays/watch/' + replayId;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (bo3Matches && bo3Matches.length > 0) {
        currentBo3Data = {
            matches: bo3Matches,
            title: title ? title.replace(/ - Game \d$/, '') : 'Replay',
            activeGame: gameIndex || 0
        };
        renderBo3GameButtons();
    } else {
        currentBo3Data = null;
        gamesEl.innerHTML = '';
    }
}

function renderBo3GameButtons() {
    var gamesEl = document.getElementById('replayModalGames');
    if (!currentBo3Data) { gamesEl.innerHTML = ''; return; }

    var html = '';
    for (var i = 0; i < currentBo3Data.matches.length; i++) {
        var matchId = currentBo3Data.matches[i];
        var isActive = (i === currentBo3Data.activeGame);
        var isDisabled = (!matchId || matchId === '');
        var cls = 'replay-modal-game-btn';
        if (isActive) cls += ' active';
        if (isDisabled) cls += ' disabled';
        html += '<button class="' + cls + '" data-game-index="' + i + '">Game ' + (i + 1) + '</button>';
    }
    gamesEl.innerHTML = html;

    gamesEl.querySelectorAll('.replay-modal-game-btn:not(.disabled)').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-game-index'));
            switchBo3Game(idx);
        });
    });
}

function switchBo3Game(gameIndex) {
    if (!currentBo3Data) return;
    var matchId = currentBo3Data.matches[gameIndex];
    if (!matchId || matchId === '') return;

    currentBo3Data.activeGame = gameIndex;

    var iframe = document.getElementById('replayIframe');
    var titleEl = document.getElementById('replayModalTitle');
    var extLink = document.getElementById('replayExternalLink');

    titleEl.textContent = currentBo3Data.title + ' - Game ' + (gameIndex + 1);
    extLink.href = 'https://replay.pokemonshowdown.com/' + matchId;

    iframe.contentWindow.postMessage({ type: 'loadReplay', replayId: matchId }, '*');
    renderBo3GameButtons();
}

function closeReplayModal() {
    var modal = document.getElementById('replayModal');
    var iframe = document.getElementById('replayIframe');

    modal.classList.remove('active');
    iframe.src = 'about:blank';
    document.body.style.overflow = '';
    currentBo3Data = null;
    document.getElementById('replayModalGames').innerHTML = '';
}

// Close button
document.getElementById('replayModalClose').addEventListener('click', closeReplayModal);

// Close on overlay click
document.getElementById('replayModal').addEventListener('click', function(e) {
    if (e.target === this) closeReplayModal();
});

// Close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeReplayModal();
});

// Listen for replay switch requests from the iframe
window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'switchReplay' && e.data.replayId) {
        var newId = e.data.replayId;

        if (currentBo3Data) {
            var gameIdx = currentBo3Data.matches.indexOf(newId);
            if (gameIdx !== -1) {
                switchBo3Game(gameIdx);
                return;
            }
        }

        var iframe = document.getElementById('replayIframe');
        var extLink = document.getElementById('replayExternalLink');
        extLink.href = 'https://replay.pokemonshowdown.com/' + newId;
        iframe.contentWindow.postMessage({ type: 'loadReplay', replayId: newId }, '*');
    }
});
