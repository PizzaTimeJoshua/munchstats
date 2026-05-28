/**
 * Replay embed (local version)
 * Modified to load JS/CSS from local server instead of play.pokemonshowdown.com
 * Individual Pokemon sprites still load from CDN.
 *
 * Original author: Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

window.exports = window;

function linkStyle(url) {
	var linkEl = document.createElement('link');
	linkEl.rel = 'stylesheet';
	linkEl.href = url;
	document.head.appendChild(linkEl);
}
function requireScript(url) {
	var scriptEl = document.createElement('script');
	scriptEl.src = url;
	document.head.appendChild(scriptEl);
}

/**
 * Inject dark theme overrides as the LAST stylesheet.
 * Uses direct selectors (no .dark prefix) with !important so it works
 * regardless of whether any Showdown script adds or removes the .dark class.
 */
function injectDarkTheme() {
	// Remove any previous injection to avoid duplicates
	var existing = document.getElementById('dark-theme-override');
	if (existing) existing.remove();

	var style = document.createElement('style');
	style.id = 'dark-theme-override';
	style.textContent = [
		/* Body */
		'body { background: #1e1e1e !important; color: #ccc !important; }',

		/* Hide the h1 title below the replay */
		'.replay-wrapper > h1 { display: none !important; }',

		/* Battle area */
		'.battle { border-color: #444 !important; }',
		'.battle-log { background: #222222 !important; color: #ccc !important; border-color: #444 !important; }',
		'.battle-log h2 { background: #1e1e1e !important; border-color: #444 !important; color: #ddd !important; }',
		'.battle-log .infobox { background: #2a2a2a !important; border-color: #444 !important; color: #ccc !important; }',
		'.leftbar, .rightbar { background: rgba(0,0,0,0.55) !important; color: #ccc !important; }',
		'.messagebar { background: rgba(30,30,50,0.85) !important; color: #ddd !important; }',
		'.statbar strong { color: #bbb !important; text-shadow: #000 1px 1px 0, #000 1px -1px 0, #000 -1px 1px 0, #000 -1px -1px 0 !important; }',
		'.statbar .hpbar { background: #1a1a1a !important; }',

		/* Replay control buttons (Play, Last turn, Next turn, etc.) */
		'.replay-controls button { background: #333333 !important; color: #ccc !important; border: 1px solid #555 !important; padding: 4px 10px !important; border-radius: 4px !important; font-size: 9pt !important; }',
		'.replay-controls button:hover { background: #444444 !important; border-color: #6688bb !important; color: #eee !important; }',
		'.replay-controls button:disabled { opacity: 0.35 !important; }',
		'.replay-controls button i { display: inline !important; margin-right: 3px !important; }',

		/* Speed / Color / Sound chooser bar */
		'.chooser { background: #333333 !important; color: #ccc !important; border-color: #444 !important; }',
		'.chooser em { background: #2a2a2a !important; color: #999 !important; border-color: #444 !important; }',
		'.chooser button { background: #2a2a2a !important; color: #999 !important; border: 1px solid #444 !important; }',
		'.chooser button:hover { background: #3a3a3a !important; color: #ddd !important; border-color: #555 !important; }',
		'.chooser button.sel, .chooser button.sel:hover { background: #4488bb !important; color: #fff !important; border-color: #4488bb !important; }',

		/* Links and text */
		'a { color: #81AAF2 !important; }',
		'a:hover { color: #CCDDFF !important; }',

		/* Chat / log text */
		'.chat > strong { color: #8097BA !important; }',
		'.battle-log .chat > em, .battle-log .chat > q { color: #8097BA !important; }',

		/* Standard Showdown .button class (used in some UI elements) */
		'.button { background: #2b2c31 !important; background: linear-gradient(to bottom, #393d46, #2b2c31) !important; border-color: #34373b !important; color: #F9F9F9 !important; text-shadow: none !important; box-shadow: 0.5px 1px 2px rgba(255,255,255,0.45), inset 0.5px 1px 1px rgba(255,255,255,0.5) !important; }',
		'.button:hover { background: #3e4149 !important; background: linear-gradient(to bottom, #646877, #3e4149) !important; border-color: #50555b !important; }',
		'.button.cur, .button.cur:hover { background: #555555 !important; color: #E9E9E9 !important; border-color: #34373b !important; }',

		/* Scrollbars */
		'*::-webkit-scrollbar { width: 10px !important; }',
		'*::-webkit-scrollbar-track { background: #1e1e1e !important; }',
		'*::-webkit-scrollbar-thumb { background: #444 !important; border-radius: 5px !important; }',
		'*::-webkit-scrollbar-thumb:hover { background: #666 !important; }',
	].join('\n');
	document.head.appendChild(style);
}

/**
 * Ensure .dark class stays on body. Uses MutationObserver to catch
 * any Showdown script that removes it.
 */
function forceDarkClass() {
	document.body.classList.add('dark');
	var observer = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			if (mutation.attributeName === 'class' && !document.body.classList.contains('dark')) {
				document.body.classList.add('dark');
			}
		});
	});
	observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

// Load CSS from local assets
linkStyle('/static/replay_assets/style/font-awesome.css?v=3');
linkStyle('/static/replay_assets/style/battle.css?v=3');
linkStyle('/static/replay_assets/style/replay.css?v=3');
linkStyle('/static/replay_assets/style/utilichart.css?v=3');

// Load JS from local assets
requireScript('/static/replay_assets/js/lib/ps-polyfill.js');
requireScript('/static/replay_assets/config/config.js');
requireScript('/static/replay_assets/js/lib/jquery-1.11.0.min.js');
requireScript('/static/replay_assets/js/lib/html-sanitizer-minified.js');
requireScript('/static/replay_assets/js/battle-sound.js');
requireScript('/static/replay_assets/js/battledata.js');
requireScript('/static/replay_assets/data/pokedex-mini.js');
requireScript('/static/replay_assets/data/pokedex-mini-bw.js');
requireScript('/static/replay_assets/data/graphics.js');
requireScript('/static/replay_assets/data/pokedex.js');
requireScript('/static/replay_assets/data/moves.js');
requireScript('/static/replay_assets/data/abilities.js');
requireScript('/static/replay_assets/data/items.js');
requireScript('/static/replay_assets/data/teambuilder-tables.js');
requireScript('/static/replay_assets/js/battle-tooltips.js');
requireScript('/static/replay_assets/js/battle.js');

var Replays = {
	battle: null,
	muted: false,
	init: function () {
		this.$el = $('.wrapper');
		if (!this.$el.length) {
			$('body').append('<div class="wrapper replay-wrapper" style="max-width:1180px;margin:0 auto"><div class="battle"></div><div class="battle-log"></div><div class="replay-controls"></div><div class="replay-controls-2"></div>');
			this.$el = $('.wrapper');
		}

		var id = $('input[name=replayid]').val() || '';
		var log = ($('script.battle-log-data').text() || '').replace(/\\\//g, '/');

		var self = this;
		this.$el.on('click', '.chooser button', function (e) {
			self.clickChangeSetting(e);
		});
		this.$el.on('click', 'button', function (e) {
			var action = $(e.currentTarget).data('action');
			if (action) self[action]();
		});

		this.battle = new Battle({
			id: id,
			$frame: this.$('.battle'),
			$logFrame: this.$('.battle-log'),
			log: log.split('\n'),
			isReplay: true,
			paused: true,
			autoresize: true
		});

		this.$('.replay-controls-2').html('<div class="chooser leftchooser speedchooser"> <em>Speed:</em> <div><button value="hyperfast">Hyperfast</button><button value="fast">Fast</button><button value="normal" class="sel">Normal</button><button value="slow">Slow</button><button value="reallyslow">Really Slow</button></div> </div> <div class="chooser colorchooser"> <em>Color&nbsp;scheme:</em> <div><button value="light">Light</button><button class="sel" value="dark">Dark</button></div> </div> <div class="chooser soundchooser" style="display:none"> <em>Music:</em> <div><button class="sel" value="on">On</button><button value="off">Off</button></div> </div>');

		// this works around a WebKit/Blink bug relating to float layout
		var rc2 = this.$('.replay-controls-2')[0];
		// eslint-disable-next-line no-self-assign
		if (rc2) rc2.innerHTML = rc2.innerHTML;

		if (window.HTMLAudioElement) $('.soundchooser, .startsoundchooser').show();

		this.update();
		this.battle.subscribe(function (state) { self.update(state); });

		// Apply dark theme AFTER all Showdown init is done
		forceDarkClass();
		injectDarkTheme();
	},
	"$": function (sel) {
		return this.$el.find(sel);
	},
	clickChangeSetting: function (e) {
		e.preventDefault();
		var $chooser = $(e.currentTarget).closest('.chooser');
		var value = e.currentTarget.value;
		this.changeSetting($chooser, value, $(e.currentTarget));
	},
	changeSetting: function (type, value, valueElem) {
		var $chooser;
		if (typeof type === 'string') {
			$chooser = this.$('.' + type + 'chooser');
		} else {
			$chooser = type;
			type = '';
			if ($chooser.hasClass('colorchooser')) {
				type = 'color';
			} else if ($chooser.hasClass('soundchooser')) {
				type = 'sound';
			} else if ($chooser.hasClass('speedchooser')) {
				type = 'speed';
			}
		}
		if (!valueElem) valueElem = $chooser.find('button[value=' + value + ']');

		$chooser.find('button').removeClass('sel');
		valueElem.addClass('sel');

		switch (type) {
		case 'color':
			if (value === 'dark') {
				$(document.body).addClass('dark');
				injectDarkTheme();
			} else {
				$(document.body).removeClass('dark');
				var override = document.getElementById('dark-theme-override');
				if (override) override.remove();
			}
			break;

		case 'sound':
			// remember this is reversed: sound[off] === muted[true]
			this.muted = (value === 'off');
			this.battle.setMute(this.muted);
			this.$('.startsoundchooser').remove();
			break;

		case 'speed':
			var fadeTable = {
				hyperfast: 40,
				fast: 50,
				normal: 300,
				slow: 500,
				reallyslow: 1000
			};
			var delayTable = {
				hyperfast: 1,
				fast: 1,
				normal: 1,
				slow: 1000,
				reallyslow: 3000
			};
			this.battle.messageShownTime = delayTable[value];
			this.battle.messageFadeTime = fadeTable[value];
			this.battle.scene.updateAcceleration();
			break;
		}
	},
	update: function (state) {
		if (state === 'error') {
			var m = /^([a-z0-9]+)-[a-z0-9]+-[0-9]+$/.exec(this.battle.id);
			if (m) {
				this.battle.log('<hr /><div class="chat">This replay was uploaded from a third-party server (<code>' + BattleLog.escapeHTML(m[1]) + '</code>). It contains errors.</div><div class="chat">Replays uploaded from third-party servers can contain errors if the server is running custom code, or the server operator has otherwise incorrectly configured their server.</div>', true);
			}
			return;
		}

		if (BattleSound.muted && !this.muted) this.changeSetting('sound', 'off');

		if (this.battle.paused) {
			var resetDisabled = !this.battle.started ? ' disabled' : '';
			this.$('.replay-controls').html('<button data-action="play"><i class="fa fa-play"></i> Play</button><button data-action="reset"' + resetDisabled + '><i class="fa fa-undo"></i> Reset</button> <button data-action="rewind"><i class="fa fa-step-backward"></i> Last turn</button><button data-action="ff"><i class="fa fa-step-forward"></i> Next turn</button> <button data-action="ffto"><i class="fa fa-fast-forward"></i> Go to turn...</button> <button data-action="switchViewpoint"><i class="fa fa-random"></i> Switch sides</button>');
		} else {
			this.$('.replay-controls').html('<button data-action="pause"><i class="fa fa-pause"></i> Pause</button><button data-action="reset"><i class="fa fa-undo"></i> Reset</button> <button data-action="rewind"><i class="fa fa-step-backward"></i> Last turn</button><button data-action="ff"><i class="fa fa-step-forward"></i> Next turn</button> <button data-action="ffto"><i class="fa fa-fast-forward"></i> Go to turn...</button> <button data-action="switchViewpoint"><i class="fa fa-random"></i> Switch sides</button>');
		}
	},
	pause: function () {
		this.battle.pause();
	},
	play: function () {
		this.battle.play();
	},
	reset: function () {
		this.battle.reset();
	},
	ff: function () {
		this.battle.seekBy(1);
	},
	rewind: function () {
		this.battle.seekBy(-1);
	},
	ffto: function () {
		var turn = prompt('Turn?');
		if (!turn || !turn.trim()) return;
		if (turn === 'e' || turn === 'end' || turn === 'f' || turn === 'finish') turn = Infinity;
		turn = Number(turn);
		if (isNaN(turn) || turn < 0) alert("Invalid turn");
		this.battle.seekTurn(turn);
	},
	switchViewpoint: function () {
		this.battle.switchViewpoint();
	},
	loadNewBattle: function (logText, replayId) {
		// Pause and clean up old battle
		if (this.battle) {
			this.battle.pause();
			this.$('.battle').empty();
			this.$('.battle-log').empty();
		}

		// Create new battle with new log data
		var self = this;
		this.battle = new Battle({
			id: replayId || '',
			$frame: this.$('.battle'),
			$logFrame: this.$('.battle-log'),
			log: logText.split('\n'),
			isReplay: true,
			paused: true,
			autoresize: true
		});

		this.battle.subscribe(function (state) { self.update(state); });
		this.update();
	}
};

// Listen for new battle data from parent window (iframe reuse)
window.addEventListener('message', function (e) {
	if (e.data && e.data.type === 'loadReplay' && e.data.log) {
		var log = e.data.log.replace(/\\\//g, '/');
		Replays.loadNewBattle(log, e.data.replay_id || '');
	}
});

window.onload = function () {
	Replays.init();
};

// Immediate: set dark class and inject theme (covers time before onload)
document.body.classList.add('dark');
injectDarkTheme();

// Safety net: re-apply after a delay in case any late-loading scripts override
setTimeout(function () {
	document.body.classList.add('dark');
	injectDarkTheme();
}, 1500);
