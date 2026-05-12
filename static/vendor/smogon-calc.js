var MunchSmogonCalc = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/@smogon/calc/dist/util.js
  var require_util = __commonJS({
    "node_modules/@smogon/calc/dist/util.js"(exports) {
      "use strict";
      exports.__esModule = true;
      exports.extend = exports.assignWithout = exports.error = exports.toID = void 0;
      function toID(text) {
        var lcase = ("" + text).toLowerCase();
        if (lcase === "flab\xE9b\xE9") {
          return "flabebe";
        }
        return lcase.replace(/[^a-z0-9]+/g, "");
      }
      exports.toID = toID;
      function error(err, msg) {
        if (err) {
          throw new Error(msg);
        } else {
          console.log(msg);
        }
      }
      exports.error = error;
      function assignWithout(a, b, exclude) {
        for (var key in b) {
          if (Object.prototype.hasOwnProperty.call(b, key) && !exclude.has(key)) {
            a[key] = b[key];
          }
        }
      }
      exports.assignWithout = assignWithout;
      var class2Type = {
        "[object Boolean]": "boolean",
        "[object Number]": "number",
        "[object String]": "string",
        "[object Function]": "function",
        "[object Array]": "array",
        "[object Date]": "date",
        "[object RegExp]": "regexp",
        "[object Object]": "object",
        "[object Error]": "error"
      };
      var coreToString = class2Type.toString;
      var coreHasOwn = class2Type.hasOwnProperty;
      function isFunction(obj) {
        return getType(obj) === "function";
      }
      function isWindow(obj) {
        return obj != null && obj === obj.window;
      }
      function getType(obj) {
        if (obj == null) {
          return String(obj);
        }
        return typeof obj === "object" || typeof obj === "function" ? class2Type[coreToString.call(obj)] || "object" : typeof obj;
      }
      function isPlainObject(obj) {
        if (getType(obj) !== "object" || obj.nodeType || isWindow(obj)) {
          return false;
        }
        try {
          if (obj.constructor && !coreHasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
            return false;
          }
        } catch (e) {
          return false;
        }
        return true;
      }
      function extend() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var options, name, src, copy, copyIsArray, clone;
        var target = args[0] || {};
        var i = 1;
        var deep = false;
        var length = args.length;
        if (typeof target === "boolean") {
          deep = target;
          target = args[1] || {};
          i = 2;
        }
        if (typeof target !== "object" && !isFunction(target)) {
          target = {};
        }
        if (length === i) {
          target = this;
          --i;
        }
        for (; i < length; i++) {
          if ((options = args[i]) != null) {
            for (name in options) {
              src = target[name];
              copy = options[name];
              if (target === copy) {
                continue;
              }
              if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                if (copyIsArray) {
                  copyIsArray = false;
                  clone = src && Array.isArray(src) ? src : [];
                } else {
                  clone = src && isPlainObject(src) ? src : {};
                }
                target[name] = extend(deep, clone, copy);
              } else if (copy !== void 0) {
                target[name] = copy;
              }
            }
          }
        }
        return target;
      }
      exports.extend = extend;
    }
  });

  // node_modules/@smogon/calc/dist/data/abilities.js
  var require_abilities = __commonJS({
    "node_modules/@smogon/calc/dist/data/abilities.js"(exports) {
      "use strict";
      var __generator = exports && exports.__generator || function(thisArg, body) {
        var _ = { label: 0, sent: function() {
          if (t[0] & 1) throw t[1];
          return t[1];
        }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
          return this;
        }), g;
        function verb(n) {
          return function(v) {
            return step([n, v]);
          };
        }
        function step(op) {
          if (f) throw new TypeError("Generator is already executing.");
          while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
              case 0:
              case 1:
                t = op;
                break;
              case 4:
                _.label++;
                return { value: op[1], done: false };
              case 5:
                _.label++;
                y = op[1];
                op = [0];
                continue;
              case 7:
                op = _.ops.pop();
                _.trys.pop();
                continue;
              default:
                if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                  _ = 0;
                  continue;
                }
                if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                  _.label = op[1];
                  break;
                }
                if (op[0] === 6 && _.label < t[1]) {
                  _.label = t[1];
                  t = op;
                  break;
                }
                if (t && _.label < t[2]) {
                  _.label = t[2];
                  _.ops.push(op);
                  break;
                }
                if (t[2]) _.ops.pop();
                _.trys.pop();
                continue;
            }
            op = body.call(thisArg, _);
          } catch (e) {
            op = [6, e];
            y = 0;
          } finally {
            f = t = 0;
          }
          if (op[0] & 5) throw op[1];
          return { value: op[0] ? op[1] : void 0, done: true };
        }
      };
      var __values = exports && exports.__values || function(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
          next: function() {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
          }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
      };
      var e_1;
      var _a;
      var e_2;
      var _b;
      exports.__esModule = true;
      exports.Abilities = exports.ABILITIES = void 0;
      var util_1 = require_util();
      var RBY = [];
      var GSC = [];
      var ADV = [
        "Air Lock",
        "Arena Trap",
        "Battle Armor",
        "Blaze",
        "Chlorophyll",
        "Clear Body",
        "Cloud Nine",
        "Color Change",
        "Compound Eyes",
        "Cute Charm",
        "Drizzle",
        "Damp",
        "Drought",
        "Early Bird",
        "Effect Spore",
        "Flame Body",
        "Flash Fire",
        "Forecast",
        "Guts",
        "Huge Power",
        "Hustle",
        "Hyper Cutter",
        "Illuminate",
        "Immunity",
        "Inner Focus",
        "Insomnia",
        "Intimidate",
        "Keen Eye",
        "Levitate",
        "Lightning Rod",
        "Limber",
        "Liquid Ooze",
        "Magma Armor",
        "Magnet Pull",
        "Marvel Scale",
        "Minus",
        "Natural Cure",
        "Oblivious",
        "Overgrow",
        "Own Tempo",
        "Pickup",
        "Plus",
        "Poison Point",
        "Pressure",
        "Pure Power",
        "Rain Dish",
        "Rock Head",
        "Rough Skin",
        "Run Away",
        "Sand Stream",
        "Sand Veil",
        "Serene Grace",
        "Shadow Tag",
        "Shed Skin",
        "Shell Armor",
        "Shield Dust",
        "Soundproof",
        "Speed Boost",
        "Static",
        "Stench",
        "Sticky Hold",
        "Sturdy",
        "Suction Cups",
        "Swarm",
        "Swift Swim",
        "Synchronize",
        "Thick Fat",
        "Torrent",
        "Trace",
        "Truant",
        "Vital Spirit",
        "Volt Absorb",
        "Water Absorb",
        "Water Veil",
        "White Smoke",
        "Wonder Guard"
      ];
      var DPP = ADV.concat([
        "Adaptability",
        "Aftermath",
        "Anger Point",
        "Anticipation",
        "Bad Dreams",
        "Download",
        "Dry Skin",
        "Filter",
        "Flower Gift",
        "Forewarn",
        "Frisk",
        "Gluttony",
        "Heatproof",
        "Honey Gather",
        "Hydration",
        "Ice Body",
        "Iron Fist",
        "Klutz",
        "Leaf Guard",
        "Magic Guard",
        "Mold Breaker",
        "Motor Drive",
        "Mountaineer",
        "Multitype",
        "No Guard",
        "Normalize",
        "Persistent",
        "Poison Heal",
        "Quick Feet",
        "Rebound",
        "Reckless",
        "Rivalry",
        "Scrappy",
        "Simple",
        "Skill Link",
        "Slow Start",
        "Sniper",
        "Snow Cloak",
        "Snow Warning",
        "Solar Power",
        "Solid Rock",
        "Stall",
        "Steadfast",
        "Storm Drain",
        "Super Luck",
        "Tangled Feet",
        "Technician",
        "Tinted Lens",
        "Unaware",
        "Unburden"
      ]);
      var BW = DPP.concat([
        "Analytic",
        "Big Pecks",
        "Contrary",
        "Cursed Body",
        "Defeatist",
        "Defiant",
        "Flare Boost",
        "Friend Guard",
        "Harvest",
        "Healer",
        "Heavy Metal",
        "Illusion",
        "Imposter",
        "Infiltrator",
        "Iron Barbs",
        "Light Metal",
        "Justified",
        "Magic Bounce",
        "Moody",
        "Moxie",
        "Multiscale",
        "Mummy",
        "Overcoat",
        "Pickpocket",
        "Poison Touch",
        "Prankster",
        "Rattled",
        "Regenerator",
        "Sand Force",
        "Sand Rush",
        "Sap Sipper",
        "Sheer Force",
        "Telepathy",
        "Teravolt",
        "Toxic Boost",
        "Turboblaze",
        "Unnerve",
        "Victory Star",
        "Weak Armor",
        "Wonder Skin",
        "Zen Mode"
      ]);
      var XY = BW.concat([
        "Aerilate",
        "Aura Break",
        "Aroma Veil",
        "Bulletproof",
        "Cheek Pouch",
        "Competitive",
        "Dark Aura",
        "Delta Stream",
        "Desolate Land",
        "Fairy Aura",
        "Flower Veil",
        "Fur Coat",
        "Gale Wings",
        "Gooey",
        "Grass Pelt",
        "Magician",
        "Mega Launcher",
        "Parental Bond",
        "Pixilate",
        "Primordial Sea",
        "Protean",
        "Refrigerate",
        "Stance Change",
        "Strong Jaw",
        "Sweet Veil",
        "Symbiosis",
        "Tough Claws"
      ]);
      var SM = XY.concat([
        "Battery",
        "Battle Bond",
        "Beast Boost",
        "Berserk",
        "Comatose",
        "Corrosion",
        "Dancer",
        "Dazzling",
        "Disguise",
        "Electric Surge",
        "Emergency Exit",
        "Fluffy",
        "Full Metal Body",
        "Galvanize",
        "Grassy Surge",
        "Innards Out",
        "Liquid Voice",
        "Long Reach",
        "Merciless",
        "Misty Surge",
        "Neuroforce",
        "Power Construct",
        "Power of Alchemy",
        "Prism Armor",
        "Psychic Surge",
        "Queenly Majesty",
        "RKS System",
        "Receiver",
        "Schooling",
        "Shadow Shield",
        "Shields Down",
        "Slush Rush",
        "Stamina",
        "Stakeout",
        "Steelworker",
        "Soul-Heart",
        "Surge Surfer",
        "Tangling Hair",
        "Triage",
        "Water Bubble",
        "Water Compaction",
        "Wimp Out"
      ]);
      var SS = SM.concat([
        "As One (Glastrier)",
        "As One (Spectrier)",
        "Ball Fetch",
        "Chilling Neigh",
        "Cotton Down",
        "Curious Medicine",
        "Dauntless Shield",
        "Dragon's Maw",
        "Gorilla Tactics",
        "Grim Neigh",
        "Gulp Missile",
        "Hunger Switch",
        "Ice Face",
        "Ice Scales",
        "Intrepid Sword",
        "Libero",
        "Mimicry",
        "Mirror Armor",
        "Neutralizing Gas",
        "Pastel Veil",
        "Perish Body",
        "Power Spot",
        "Propeller Tail",
        "Punk Rock",
        "Quick Draw",
        "Ripen",
        "Sand Spit",
        "Screen Cleaner",
        "Stalwart",
        "Steam Engine",
        "Steely Spirit",
        "Transistor",
        "Unseen Fist",
        "Wandering Spirit"
      ]);
      var SV = SS.concat([
        "Anger Shell",
        "Armor Tail",
        "Beads of Ruin",
        "Commander",
        "Costar",
        "Cud Chew",
        "Earth Eater",
        "Electromorphosis",
        "Embody Aspect (Cornerstone)",
        "Embody Aspect (Hearthflame)",
        "Embody Aspect (Teal)",
        "Embody Aspect (Wellspring)",
        "Good as Gold",
        "Guard Dog",
        "Hadron Engine",
        "Hospitality",
        "Lingering Aroma",
        "Mind's Eye",
        "Mycelium Might",
        "Opportunist",
        "Orichalcum Pulse",
        "Poison Puppeteer",
        "Protosynthesis",
        "Purifying Salt",
        "Quark Drive",
        "Rocky Payload",
        "Seed Sower",
        "Sharpness",
        "Supersweet Syrup",
        "Supreme Overlord",
        "Sword of Ruin",
        "Tablets of Ruin",
        "Tera Shell",
        "Tera Shift",
        "Teraform Zero",
        "Thermal Exchange",
        "Toxic Chain",
        "Toxic Debris",
        "Vessel of Ruin",
        "Well-Baked Body",
        "Wind Power",
        "Wind Rider",
        "Zero to Hero"
      ]);
      exports.ABILITIES = [[], RBY, GSC, ADV, DPP, BW, XY, SM, SS, SV];
      var Abilities = (function() {
        function Abilities2(gen) {
          this.gen = gen;
        }
        Abilities2.prototype.get = function(id) {
          return ABILITIES_BY_ID[this.gen][id];
        };
        Abilities2.prototype[Symbol.iterator] = function() {
          var _a2, _b2, _c, _i, id;
          return __generator(this, function(_d) {
            switch (_d.label) {
              case 0:
                _a2 = ABILITIES_BY_ID[this.gen];
                _b2 = [];
                for (_c in _a2)
                  _b2.push(_c);
                _i = 0;
                _d.label = 1;
              case 1:
                if (!(_i < _b2.length)) return [3, 4];
                _c = _b2[_i];
                if (!(_c in _a2)) return [3, 3];
                id = _c;
                return [4, this.get(id)];
              case 2:
                _d.sent();
                _d.label = 3;
              case 3:
                _i++;
                return [3, 1];
              case 4:
                return [2];
            }
          });
        };
        return Abilities2;
      })();
      exports.Abilities = Abilities;
      var Ability = /* @__PURE__ */ (function() {
        function Ability2(name) {
          this.kind = "Ability";
          this.id = (0, util_1.toID)(name);
          this.name = name;
        }
        return Ability2;
      })();
      var ABILITIES_BY_ID = [];
      try {
        for (ABILITIES_1 = __values(exports.ABILITIES), ABILITIES_1_1 = ABILITIES_1.next(); !ABILITIES_1_1.done; ABILITIES_1_1 = ABILITIES_1.next()) {
          abilities = ABILITIES_1_1.value;
          map = {};
          try {
            for (abilities_1 = (e_2 = void 0, __values(abilities)), abilities_1_1 = abilities_1.next(); !abilities_1_1.done; abilities_1_1 = abilities_1.next()) {
              ability = abilities_1_1.value;
              a = new Ability(ability);
              map[a.id] = a;
            }
          } catch (e_2_1) {
            e_2 = { error: e_2_1 };
          } finally {
            try {
              if (abilities_1_1 && !abilities_1_1.done && (_b = abilities_1["return"])) _b.call(abilities_1);
            } finally {
              if (e_2) throw e_2.error;
            }
          }
          ABILITIES_BY_ID.push(map);
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (ABILITIES_1_1 && !ABILITIES_1_1.done && (_a = ABILITIES_1["return"])) _a.call(ABILITIES_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      var abilities;
      var map;
      var ability;
      var a;
      var abilities_1;
      var abilities_1_1;
      var ABILITIES_1;
      var ABILITIES_1_1;
    }
  });

  // node_modules/@smogon/calc/dist/data/items.js
  var require_items = __commonJS({
    "node_modules/@smogon/calc/dist/data/items.js"(exports) {
      "use strict";
      var __generator = exports && exports.__generator || function(thisArg, body) {
        var _ = { label: 0, sent: function() {
          if (t[0] & 1) throw t[1];
          return t[1];
        }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
          return this;
        }), g;
        function verb(n) {
          return function(v) {
            return step([n, v]);
          };
        }
        function step(op) {
          if (f) throw new TypeError("Generator is already executing.");
          while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
              case 0:
              case 1:
                t = op;
                break;
              case 4:
                _.label++;
                return { value: op[1], done: false };
              case 5:
                _.label++;
                y = op[1];
                op = [0];
                continue;
              case 7:
                op = _.ops.pop();
                _.trys.pop();
                continue;
              default:
                if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                  _ = 0;
                  continue;
                }
                if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                  _.label = op[1];
                  break;
                }
                if (op[0] === 6 && _.label < t[1]) {
                  _.label = t[1];
                  t = op;
                  break;
                }
                if (t && _.label < t[2]) {
                  _.label = t[2];
                  _.ops.push(op);
                  break;
                }
                if (t[2]) _.ops.pop();
                _.trys.pop();
                continue;
            }
            op = body.call(thisArg, _);
          } catch (e) {
            op = [6, e];
            y = 0;
          } finally {
            f = t = 0;
          }
          if (op[0] & 5) throw op[1];
          return { value: op[0] ? op[1] : void 0, done: true };
        }
      };
      var __read = exports && exports.__read || function(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i2 = m.call(o), r, ar = [], e;
        try {
          while ((n === void 0 || n-- > 0) && !(r = i2.next()).done) ar.push(r.value);
        } catch (error) {
          e = { error };
        } finally {
          try {
            if (r && !r.done && (m = i2["return"])) m.call(i2);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      };
      var __spreadArray = exports && exports.__spreadArray || function(to, from, pack) {
        if (pack || arguments.length === 2) for (var i2 = 0, l = from.length, ar; i2 < l; i2++) {
          if (ar || !(i2 in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i2);
            ar[i2] = from[i2];
          }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
      };
      var __values = exports && exports.__values || function(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i2 = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
          next: function() {
            if (o && i2 >= o.length) o = void 0;
            return { value: o && o[i2++], done: !o };
          }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
      };
      var e_1;
      var _a;
      var e_2;
      var _b;
      exports.__esModule = true;
      exports.Items = exports.ITEMS = exports.MEGA_STONES = void 0;
      var util_1 = require_util();
      var RBY = [];
      var GSC = [
        "Berry Juice",
        "Berry",
        "Berserk Gene",
        "Bitter Berry",
        "Black Belt",
        "Black Glasses",
        "Bright Powder",
        "Burnt Berry",
        "Charcoal",
        "Dragon Fang",
        "Dragon Scale",
        "Fast Ball",
        "Fire Stone",
        "Focus Band",
        "Friend Ball",
        "Gold Berry",
        "Great Ball",
        "Hard Stone",
        "Heavy Ball",
        "Ice Berry",
        "King's Rock",
        "Leaf Stone",
        "Leftovers",
        "Level Ball",
        "Light Ball",
        "Love Ball",
        "Lucky Punch",
        "Lure Ball",
        "Magnet",
        "Mail",
        "Master Ball",
        "Metal Coat",
        "Metal Powder",
        "Mint Berry",
        "Miracle Berry",
        "Miracle Seed",
        "Moon Ball",
        "Moon Stone",
        "Mystery Berry",
        "Mystic Water",
        "Never-Melt Ice",
        "Pink Bow",
        "Poison Barb",
        "Poke Ball",
        "Polkadot Bow",
        "PRZ Cure Berry",
        "PSN Cure Berry",
        "Quick Claw",
        "Safari Ball",
        "Scope Lens",
        "Sharp Beak",
        "Silver Powder",
        "Soft Sand",
        "Spell Tag",
        "Sport Ball",
        "Stick",
        "Sun Stone",
        "Thick Club",
        "Thunder Stone",
        "Twisted Spoon",
        "Ultra Ball",
        "Up-Grade",
        "Water Stone"
      ];
      var GSC_ONLY = [
        "Berry",
        "Berserk Gene",
        "Bitter Berry",
        "Burnt Berry",
        "Ice Berry",
        "Mint Berry",
        "Miracle Berry",
        "Mystery Berry",
        "PRZ Cure Berry",
        "Gold Berry",
        "Pink Bow",
        "Polkadot Bow",
        "PSN Cure Berry"
      ];
      var ADV = GSC.filter(function(i2) {
        return !GSC_ONLY.includes(i2);
      }).concat([
        "Aguav Berry",
        "Apicot Berry",
        "Aspear Berry",
        "Belue Berry",
        "Bluk Berry",
        "Cheri Berry",
        "Chesto Berry",
        "Choice Band",
        "Claw Fossil",
        "Cornn Berry",
        "Deep Sea Scale",
        "Deep Sea Tooth",
        "Dive Ball",
        "Dome Fossil",
        "Durin Berry",
        "Enigma Berry",
        "Figy Berry",
        "Ganlon Berry",
        "Grepa Berry",
        "Helix Fossil",
        "Hondew Berry",
        "Iapapa Berry",
        "Kelpsy Berry",
        "Lansat Berry",
        "Lax Incense",
        "Leppa Berry",
        "Liechi Berry",
        "Lum Berry",
        "Luxury Ball",
        "Macho Brace",
        "Mago Berry",
        "Magost Berry",
        "Mental Herb",
        "Nanab Berry",
        "Nest Ball",
        "Net Ball",
        "Nomel Berry",
        "Old Amber",
        "Oran Berry",
        "Pamtre Berry",
        "Pecha Berry",
        "Persim Berry",
        "Petaya Berry",
        "Pinap Berry",
        "Pomeg Berry",
        "Premier Ball",
        "Qualot Berry",
        "Rabuta Berry",
        "Rawst Berry",
        "Razz Berry",
        "Repeat Ball",
        "Root Fossil",
        "Salac Berry",
        "Sea Incense",
        "Shell Bell",
        "Silk Scarf",
        "Sitrus Berry",
        "Soul Dew",
        "Spelon Berry",
        "Starf Berry",
        "Tamato Berry",
        "Timer Ball",
        "Watmel Berry",
        "Wepear Berry",
        "White Herb",
        "Wiki Berry"
      ]);
      var DPP = ADV.concat([
        "Adamant Orb",
        "Armor Fossil",
        "Babiri Berry",
        "Big Root",
        "Black Sludge",
        "Charti Berry",
        "Cherish Ball",
        "Chilan Berry",
        "Choice Scarf",
        "Choice Specs",
        "Chople Berry",
        "Coba Berry",
        "Colbur Berry",
        "Custap Berry",
        "Damp Rock",
        "Dawn Stone",
        "Destiny Knot",
        "Draco Plate",
        "Dread Plate",
        "Dubious Disc",
        "Dusk Ball",
        "Dusk Stone",
        "Earth Plate",
        "Electirizer",
        "Expert Belt",
        "Fist Plate",
        "Flame Orb",
        "Flame Plate",
        "Focus Sash",
        "Full Incense",
        "Grip Claw",
        "Griseous Orb",
        "Haban Berry",
        "Heal Ball",
        "Heat Rock",
        "Icicle Plate",
        "Icy Rock",
        "Insect Plate",
        "Iron Ball",
        "Iron Plate",
        "Jaboca Berry",
        "Kasib Berry",
        "Kebia Berry",
        "Lagging Tail",
        "Life Orb",
        "Light Clay",
        "Lustrous Orb",
        "Magmarizer",
        "Meadow Plate",
        "Metronome",
        "Micle Berry",
        "Mind Plate",
        "Muscle Band",
        "Occa Berry",
        "Odd Incense",
        "Oval Stone",
        "Park Ball",
        "Passho Berry",
        "Payapa Berry",
        "Power Anklet",
        "Power Band",
        "Power Belt",
        "Power Bracer",
        "Power Herb",
        "Power Lens",
        "Power Weight",
        "Protector",
        "Quick Ball",
        "Quick Powder",
        "Rare Bone",
        "Razor Claw",
        "Razor Fang",
        "Reaper Cloth",
        "Rindo Berry",
        "Rock Incense",
        "Rose Incense",
        "Rowap Berry",
        "Shed Shell",
        "Shiny Stone",
        "Shuca Berry",
        "Skull Fossil",
        "Sky Plate",
        "Smooth Rock",
        "Splash Plate",
        "Spooky Plate",
        "Sticky Barb",
        "Stone Plate",
        "Tanga Berry",
        "Toxic Orb",
        "Toxic Plate",
        "Wacan Berry",
        "Wave Incense",
        "Wide Lens",
        "Wise Glasses",
        "Yache Berry",
        "Zap Plate",
        "Zoom Lens"
      ]);
      var BW = DPP.concat([
        "Absorb Bulb",
        "Air Balloon",
        "Big Nugget",
        "Binding Band",
        "Bug Gem",
        "Burn Drive",
        "Cell Battery",
        "Chill Drive",
        "Cover Fossil",
        "Dark Gem",
        "Douse Drive",
        "Dragon Gem",
        "Dream Ball",
        "Eject Button",
        "Electric Gem",
        "Eviolite",
        "Fighting Gem",
        "Fire Gem",
        "Float Stone",
        "Flying Gem",
        "Ghost Gem",
        "Grass Gem",
        "Ground Gem",
        "Ice Gem",
        "Normal Gem",
        "Plume Fossil",
        "Poison Gem",
        "Pretty Feather",
        "Prism Scale",
        "Psychic Gem",
        "Red Card",
        "Ring Target",
        "Rock Gem",
        "Rocky Helmet",
        "Shock Drive",
        "Steel Gem",
        "Water Gem"
      ]);
      var GEN_6_MEGA_STONES = {
        Abomasite: { Abomasnow: "Abomasnow-Mega" },
        Absolite: { Absol: "Absol-Mega" },
        Aerodactylite: { Aerodactyl: "Aerodactyl-Mega" },
        Aggronite: { Aggron: "Aggron-Mega" },
        Alakazite: { Alakazam: "Alakazam-Mega" },
        Altarianite: { Altaria: "Altaria-Mega" },
        Ampharosite: { Ampharos: "Ampharos-Mega" },
        Audinite: { Audino: "Audino-Mega" },
        Banettite: { Banette: "Banette-Mega" },
        Beedrillite: { Beedrill: "Beedrill-Mega" },
        Blastoisinite: { Blastoise: "Blastoise-Mega" },
        Blazikenite: { Blaziken: "Blaziken-Mega" },
        Cameruptite: { Camerupt: "Camerupt-Mega" },
        "Charizardite X": { Charizard: "Charizard-Mega-X" },
        "Charizardite Y": { Charizard: "Charizard-Mega-Y" },
        Crucibellite: { Crucibelle: "Crucibelle-Mega" },
        Diancite: { Diancie: "Diancie-Mega" },
        Galladite: { Gallade: "Gallade-Mega" },
        Garchompite: { Garchomp: "Garchomp-Mega" },
        Gardevoirite: { Gardevoir: "Gardevoir-Mega" },
        Gengarite: { Gengar: "Gengar-Mega" },
        Glalitite: { Glalie: "Glalie-Mega" },
        Gyaradosite: { Gyarados: "Gyarados-Mega" },
        Heracronite: { Heracross: "Heracross-Mega" },
        Houndoominite: { Houndoom: "Houndoom-Mega" },
        Kangaskhanite: { Kangaskhan: "Kangaskhan-Mega" },
        Latiasite: { Latias: "Latias-Mega" },
        Latiosite: { Latios: "Latios-Mega" },
        Lopunnite: { Lopunny: "Lopunny-Mega" },
        Lucarionite: { Lucario: "Lucario-Mega" },
        Manectite: { Manectric: "Manectric-Mega" },
        Mawilite: { Mawile: "Mawile-Mega" },
        Medichamite: { Medicham: "Medicham-Mega" },
        Metagrossite: { Metagross: "Metagross-Mega" },
        "Mewtwonite X": { Mewtwo: "Mewtwo-Mega-X" },
        "Mewtwonite Y": { Mewtwo: "Mewtwo-Mega-Y" },
        Pidgeotite: { Pidgeot: "Pidgeot-Mega" },
        Pinsirite: { Pinsir: "Pinsir-Mega" },
        Sablenite: { Sableye: "Sableye-Mega" },
        Salamencite: { Salamence: "Salamence-Mega" },
        Sceptilite: { Sceptile: "Sceptile-Mega" },
        Scizorite: { Scizor: "Scizor-Mega" },
        Sharpedonite: { Sharpedo: "Sharpedo-Mega" },
        Slowbronite: { Slowbro: "Slowbro-Mega" },
        Steelixite: { Steelix: "Steelix-Mega" },
        Swampertite: { Swampert: "Swampert-Mega" },
        Tyranitarite: { Tyranitar: "Tyranitar-Mega" },
        Venusaurite: { Venusaur: "Venusaur-Mega" }
      };
      var XY = BW.concat(__spreadArray(__spreadArray([], __read(Object.keys(GEN_6_MEGA_STONES)), false), [
        "Assault Vest",
        "Blue Orb",
        "Fairy Gem",
        "Jaw Fossil",
        "Kee Berry",
        "Luminous Moss",
        "Maranga Berry",
        "Pixie Plate",
        "Red Orb",
        "Roseli Berry",
        "Sachet",
        "Safety Goggles",
        "Sail Fossil",
        "Snowball",
        "Weakness Policy",
        "Whipped Dream"
      ], false).sort());
      var SM = XY.filter(function(i2) {
        return i2 !== "Old Amber";
      }).concat([
        "Adrenaline Orb",
        "Aloraichium Z",
        "Beast Ball",
        "Bottle Cap",
        "Bug Memory",
        "Buginium Z",
        "Dark Memory",
        "Darkinium Z",
        "Decidium Z",
        "Dragon Memory",
        "Dragonium Z",
        "Eevium Z",
        "Electric Memory",
        "Electric Seed",
        "Electrium Z",
        "Fairium Z",
        "Fairy Memory",
        "Fighting Memory",
        "Fightinium Z",
        "Fire Memory",
        "Firium Z",
        "Flying Memory",
        "Flyinium Z",
        "Ghost Memory",
        "Ghostium Z",
        "Gold Bottle Cap",
        "Grass Memory",
        "Grassium Z",
        "Grassy Seed",
        "Ground Memory",
        "Groundium Z",
        "Ice Memory",
        "Ice Stone",
        "Icium Z",
        "Incinium Z",
        "Kommonium Z",
        "Lunalium Z",
        "Lycanium Z",
        "Marshadium Z",
        "Mewnium Z",
        "Mimikium Z",
        "Misty Seed",
        "Normalium Z",
        "Pikanium Z",
        "Pikashunium Z",
        "Poison Memory",
        "Poisonium Z",
        "Primarium Z",
        "Protective Pads",
        "Psychic Memory",
        "Psychic Seed",
        "Psychium Z",
        "Rock Memory",
        "Rockium Z",
        "Snorlium Z",
        "Solganium Z",
        "Steel Memory",
        "Steelium Z",
        "Tapunium Z",
        "Terrain Extender",
        "Ultranecrozium Z",
        "Water Memory",
        "Waterium Z"
      ]);
      var SS = SM.concat([
        "Berry Sweet",
        "Blunder Policy",
        "Chipped Pot",
        "Clover Sweet",
        "Cracked Pot",
        "Eject Pack",
        "Flower Sweet",
        "Fossilized Bird",
        "Fossilized Dino",
        "Fossilized Drake",
        "Fossilized Fish",
        "Galarica Cuff",
        "Galarica Wreath",
        "Heavy-Duty Boots",
        "Leek",
        "Love Sweet",
        "Ribbon Sweet",
        "Room Service",
        "Rusted Shield",
        "Rusted Sword",
        "Star Sweet",
        "Strawberry Sweet",
        "Sweet Apple",
        "Tart Apple",
        "Throat Spray"
      ]);
      for (i = 0; i < 100; i++) {
        SS.push("TR".concat(i < 10 ? "0".concat(i) : i));
      }
      var i;
      SS.push("Utility Umbrella", "Vile Vial");
      SS.push.apply(SS, __spreadArray(__spreadArray([], __read(GSC_ONLY), false), ["Old Amber"], false));
      var ZA_MEGA_STONES = {
        "Absolite Z": { Absol: "Absol-Mega-Z" },
        Barbaracite: { Barbaracle: "Barbaracle-Mega" },
        Baxcalibrite: { Baxcalibur: "Baxcalibur-Mega" },
        Chandelurite: { Chandelure: "Chandelure-Mega" },
        Chesnaughtite: { Chesnaught: "Chesnaught-Mega" },
        Chimechite: { Chimecho: "Chimecho-Mega" },
        Clefablite: { Clefable: "Clefable-Mega" },
        Crabominite: { Crabominable: "Crabominable-Mega" },
        Darkranite: { Darkrai: "Darkrai-Mega" },
        Delphoxite: { Delphox: "Delphox-Mega" },
        Dragalgite: { Dragalge: "Dragalge-Mega" },
        Dragoninite: { Dragonite: "Dragonite-Mega" },
        Drampanite: { Drampa: "Drampa-Mega" },
        Eelektrossite: { Eelektross: "Eelektross-Mega" },
        Emboarite: { Emboar: "Emboar-Mega" },
        Excadrite: { Excadrill: "Excadrill-Mega" },
        Falinksite: { Falinks: "Falinks-Mega" },
        Feraligite: { Feraligatr: "Feraligatr-Mega" },
        Floettite: { "Floette-Eternal": "Floette-Mega" },
        Froslassite: { Froslass: "Froslass-Mega" },
        "Garchompite Z": { Garchomp: "Garchomp-Mega-Z" },
        Glimmoranite: { Glimmora: "Glimmora-Mega" },
        Golisopite: { Golisopod: "Golisopod-Mega" },
        Golurkite: { Golurk: "Golurk-Mega" },
        Greninjite: { Greninja: "Greninja-Mega" },
        Hawluchanite: { Hawlucha: "Hawlucha-Mega" },
        Heatranite: { Heatran: "Heatran-Mega" },
        "Lucarionite Z": { Lucario: "Lucario-Mega-Z" },
        Magearnite: { Magearna: "Magearna-Mega", "Magearna-Original": "Magearna-Original-Mega" },
        Malamarite: { Malamar: "Malamar-Mega" },
        Meganiumite: { Meganium: "Meganium-Mega" },
        Meowsticite: { Meowstic: "Meowstic-M-Mega", "Meowstic-F": "Meowstic-F-Mega" },
        Pyroarite: { Pyroar: "Pyroar-Mega" },
        "Raichunite X": { Raichu: "Raichu-Mega-X" },
        "Raichunite Y": { Raichu: "Raichu-Mega-Y" },
        Scolipite: { Scolipede: "Scolipede-Mega" },
        Scovillainite: { Scovillain: "Scovillain-Mega" },
        Scraftinite: { Scrafty: "Scrafty-Mega" },
        Skarmorite: { Skarmory: "Skarmory-Mega" },
        Staraptite: { Staraptor: "Staraptor-Mega" },
        Starminite: { Starmie: "Starmie-Mega" },
        Tatsugirinite: {
          Tatsugiri: "Tatsugiri-Curly-Mega",
          "Tatsugiri-Droopy": "Tatsugiri-Droopy-Mega",
          "Tatsugiri-Stretchy": "Tatsugiri-Stretchy-Mega"
        },
        Victreebelite: { Victreebel: "Victreebel-Mega" },
        Zeraorite: { Zeraora: "Zeraora-Mega" },
        Zygardite: { "Zygarde-Complete": "Zygarde-Mega" }
      };
      var SV = SS.concat(__spreadArray(__spreadArray([], __read(Object.keys(ZA_MEGA_STONES)), false), [
        "Adamant Crystal",
        "Auspicious Armor",
        "Ability Shield",
        "Booster Energy",
        "Clear Amulet",
        "Cornerstone Mask",
        "Covert Cloak",
        "Fairy Feather",
        "Hearthflame Mask",
        "Loaded Dice",
        "Malicious Armor",
        "Masterpiece Teacup",
        "Metal Alloy",
        "Mirror Herb",
        "Punching Glove",
        "Lustrous Globe",
        "Griseous Core",
        "Strange Ball",
        "Syrupy Apple",
        "Unremarkable Teacup",
        "Wellspring Mask"
      ], false).sort());
      var BERRIES = {
        "Aguav Berry": { t: "Dragon", p: 80 },
        "Apicot Berry": { t: "Ground", p: 100 },
        "Aspear Berry": { t: "Ice", p: 80 },
        "Babiri Berry": { t: "Steel", p: 80 },
        "Belue Berry": { t: "Electric", p: 100 },
        Berry: { t: "Poison", p: 80 },
        "Bitter Berry": { t: "Ground", p: 80 },
        "Bluk Berry": { t: "Fire", p: 90 },
        "Burnt Berry": { t: "Ice", p: 80 },
        "Charti Berry": { t: "Rock", p: 80 },
        "Cheri Berry": { t: "Fire", p: 80 },
        "Chesto Berry": { t: "Water", p: 80 },
        "Chilan Berry": { t: "Normal", p: 80 },
        "Chople Berry": { t: "Fighting", p: 80 },
        "Coba Berry": { t: "Flying", p: 80 },
        "Colbur Berry": { t: "Dark", p: 80 },
        "Cornn Berry": { t: "Bug", p: 90 },
        "Custap Berry": { t: "Ghost", p: 100 },
        "Durin Berry": { t: "Water", p: 100 },
        "Enigma Berry": { t: "Bug", p: 100 },
        "Figy Berry": { t: "Bug", p: 80 },
        "Ganlon Berry": { t: "Ice", p: 100 },
        "Gold Berry": { t: "Psychic", p: 80 },
        "Grepa Berry": { t: "Flying", p: 90 },
        "Haban Berry": { t: "Dragon", p: 80 },
        "Hondew Berry": { t: "Ground", p: 90 },
        "Iapapa Berry": { t: "Dark", p: 80 },
        "Ice Berry": { t: "Grass", p: 80 },
        "Jaboca Berry": { t: "Dragon", p: 100 },
        "Kasib Berry": { t: "Ghost", p: 80 },
        "Kebia Berry": { t: "Poison", p: 80 },
        "Kee Berry": { t: "Fairy", p: 100 },
        "Kelpsy Berry": { t: "Fighting", p: 90 },
        "Lansat Berry": { t: "Flying", p: 100 },
        "Leppa Berry": { t: "Fighting", p: 80 },
        "Liechi Berry": { t: "Grass", p: 100 },
        "Lum Berry": { t: "Flying", p: 80 },
        "Mago Berry": { t: "Ghost", p: 80 },
        "Magost Berry": { t: "Rock", p: 90 },
        "Maranga Berry": { t: "Dark", p: 100 },
        "Micle Berry": { t: "Rock", p: 100 },
        "Mint Berry": { t: "Water", p: 80 },
        "Miracle Berry": { t: "Flying", p: 80 },
        "Mystery Berry": { t: "Fighting", p: 80 },
        "Nanab Berry": { t: "Water", p: 90 },
        "Nomel Berry": { t: "Dragon", p: 90 },
        "Occa Berry": { t: "Fire", p: 80 },
        "Oran Berry": { t: "Poison", p: 80 },
        "Pamtre Berry": { t: "Steel", p: 90 },
        "Passho Berry": { t: "Water", p: 80 },
        "Payapa Berry": { t: "Psychic", p: 80 },
        "Pecha Berry": { t: "Electric", p: 80 },
        "Persim Berry": { t: "Ground", p: 80 },
        "Petaya Berry": { t: "Poison", p: 100 },
        "Pinap Berry": { t: "Grass", p: 90 },
        "Pomeg Berry": { t: "Ice", p: 90 },
        "PRZ Cure Berry": { t: "Fire", p: 80 },
        "PSN Cure Berry": { t: "Electric", p: 80 },
        "Qualot Berry": { t: "Poison", p: 90 },
        "Rabuta Berry": { t: "Ghost", p: 90 },
        "Rawst Berry": { t: "Grass", p: 80 },
        "Razz Berry": { t: "Steel", p: 80 },
        "Rindo Berry": { t: "Grass", p: 80 },
        "Roseli Berry": { t: "Fairy", p: 80 },
        "Rowap Berry": { t: "Dark", p: 100 },
        "Salac Berry": { t: "Fighting", p: 100 },
        "Shuca Berry": { t: "Ground", p: 80 },
        "Sitrus Berry": { t: "Psychic", p: 80 },
        "Spelon Berry": { t: "Dark", p: 90 },
        "Starf Berry": { t: "Psychic", p: 100 },
        "Tamato Berry": { t: "Psychic", p: 90 },
        "Tanga Berry": { t: "Bug", p: 80 },
        "Wacan Berry": { t: "Electric", p: 80 },
        "Watmel Berry": { t: "Fire", p: 100 },
        "Wepear Berry": { t: "Electric", p: 90 },
        "Wiki Berry": { t: "Rock", p: 80 },
        "Yache Berry": { t: "Ice", p: 80 }
      };
      exports.MEGA_STONES = Object.assign({}, GEN_6_MEGA_STONES, ZA_MEGA_STONES);
      exports.ITEMS = [[], RBY, GSC, ADV, DPP, BW, XY, SM, SS, SV];
      var Items = (function() {
        function Items2(gen2) {
          this.gen = gen2;
        }
        Items2.prototype.get = function(id) {
          return ITEMS_BY_ID[this.gen][id];
        };
        Items2.prototype[Symbol.iterator] = function() {
          var _a2, _b2, _c, _i, id;
          return __generator(this, function(_d) {
            switch (_d.label) {
              case 0:
                _a2 = ITEMS_BY_ID[this.gen];
                _b2 = [];
                for (_c in _a2)
                  _b2.push(_c);
                _i = 0;
                _d.label = 1;
              case 1:
                if (!(_i < _b2.length)) return [3, 4];
                _c = _b2[_i];
                if (!(_c in _a2)) return [3, 3];
                id = _c;
                return [4, this.get(id)];
              case 2:
                _d.sent();
                _d.label = 3;
              case 3:
                _i++;
                return [3, 1];
              case 4:
                return [2];
            }
          });
        };
        return Items2;
      })();
      exports.Items = Items;
      var Item = /* @__PURE__ */ (function() {
        function Item2(name, gen2) {
          this.kind = "Item";
          this.id = (0, util_1.toID)(name);
          this.name = name;
          this.megaStone = exports.MEGA_STONES[name];
          var berry = BERRIES[name];
          if (berry) {
            this.isBerry = true;
            this.naturalGift = {
              basePower: gen2 < 6 ? berry.p - 20 : berry.p,
              type: berry.t
            };
          }
        }
        return Item2;
      })();
      var ITEMS_BY_ID = [];
      var gen = 0;
      try {
        for (ITEMS_1 = __values(exports.ITEMS), ITEMS_1_1 = ITEMS_1.next(); !ITEMS_1_1.done; ITEMS_1_1 = ITEMS_1.next()) {
          items = ITEMS_1_1.value;
          map = {};
          try {
            for (items_1 = (e_2 = void 0, __values(items)), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
              item = items_1_1.value;
              i = new Item(item, gen);
              map[i.id] = i;
            }
          } catch (e_2_1) {
            e_2 = { error: e_2_1 };
          } finally {
            try {
              if (items_1_1 && !items_1_1.done && (_b = items_1["return"])) _b.call(items_1);
            } finally {
              if (e_2) throw e_2.error;
            }
          }
          ITEMS_BY_ID.push(map);
          gen++;
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (ITEMS_1_1 && !ITEMS_1_1.done && (_a = ITEMS_1["return"])) _a.call(ITEMS_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      var items;
      var map;
      var item;
      var i;
      var items_1;
      var items_1_1;
      var ITEMS_1;
      var ITEMS_1_1;
    }
  });

  // node_modules/@smogon/calc/dist/data/moves.js
  var require_moves = __commonJS({
    "node_modules/@smogon/calc/dist/data/moves.js"(exports) {
      "use strict";
      var __generator = exports && exports.__generator || function(thisArg, body) {
        var _ = { label: 0, sent: function() {
          if (t[0] & 1) throw t[1];
          return t[1];
        }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
          return this;
        }), g;
        function verb(n) {
          return function(v) {
            return step([n, v]);
          };
        }
        function step(op) {
          if (f) throw new TypeError("Generator is already executing.");
          while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
              case 0:
              case 1:
                t = op;
                break;
              case 4:
                _.label++;
                return { value: op[1], done: false };
              case 5:
                _.label++;
                y = op[1];
                op = [0];
                continue;
              case 7:
                op = _.ops.pop();
                _.trys.pop();
                continue;
              default:
                if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                  _ = 0;
                  continue;
                }
                if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                  _.label = op[1];
                  break;
                }
                if (op[0] === 6 && _.label < t[1]) {
                  _.label = t[1];
                  t = op;
                  break;
                }
                if (t && _.label < t[2]) {
                  _.label = t[2];
                  _.ops.push(op);
                  break;
                }
                if (t[2]) _.ops.pop();
                _.trys.pop();
                continue;
            }
            op = body.call(thisArg, _);
          } catch (e) {
            op = [6, e];
            y = 0;
          } finally {
            f = t = 0;
          }
          if (op[0] & 5) throw op[1];
          return { value: op[0] ? op[1] : void 0, done: true };
        }
      };
      var __values = exports && exports.__values || function(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m2 = s && o[s], i = 0;
        if (m2) return m2.call(o);
        if (o && typeof o.length === "number") return {
          next: function() {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
          }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
      };
      var e_1;
      var _a;
      var e_2;
      var _b;
      exports.__esModule = true;
      exports.Moves = exports.MOVES = void 0;
      var util_1 = require_util();
      var RBY = {
        "(No Move)": { bp: 0, category: "Status", type: "Normal" },
        Absorb: { bp: 20, type: "Grass", drain: [1, 2] },
        Acid: { bp: 40, type: "Poison" },
        Amnesia: { bp: 0, category: "Status", type: "Psychic" },
        "Aurora Beam": { bp: 65, type: "Ice" },
        Barrage: { bp: 15, type: "Normal", multihit: [2, 5] },
        Bide: { bp: 0, type: "???" },
        Bind: { bp: 15, type: "Normal" },
        Bite: { bp: 60, type: "Normal" },
        Blizzard: { bp: 120, type: "Ice" },
        Bonemerang: { bp: 50, type: "Ground", multihit: 2 },
        Bubble: { bp: 20, type: "Water" },
        "Bubble Beam": { bp: 65, type: "Water" },
        Clamp: { bp: 35, type: "Water" },
        "Comet Punch": { bp: 18, type: "Normal", multihit: [2, 5] },
        Constrict: { bp: 10, type: "Normal" },
        Conversion: { bp: 0, category: "Status", type: "Normal" },
        Counter: { bp: 1, type: "Fighting" },
        Crabhammer: { bp: 90, type: "Water" },
        "Defense Curl": { bp: 0, category: "Status", type: "Normal" },
        Dig: { bp: 100, type: "Ground" },
        Disable: { bp: 0, category: "Status", type: "Normal" },
        "Dizzy Punch": { bp: 70, type: "Normal" },
        "Double-Edge": { bp: 100, type: "Normal", recoil: [25, 100] },
        "Double Kick": { bp: 30, type: "Fighting", multihit: 2 },
        "Double Slap": { bp: 15, type: "Normal", multihit: [2, 5] },
        "Dragon Rage": { bp: 1, type: "Dragon" },
        "Dream Eater": { bp: 100, type: "Psychic", drain: [1, 2] },
        Earthquake: { bp: 100, type: "Ground" },
        Explosion: { bp: 170, type: "Normal" },
        "Fire Blast": { bp: 120, type: "Fire" },
        "Fire Spin": { bp: 15, type: "Fire" },
        Fissure: { bp: 0, type: "Ground" },
        Fly: { bp: 70, type: "Flying" },
        "Focus Energy": { bp: 0, category: "Status", type: "Normal" },
        "Fury Attack": { bp: 15, type: "Normal", multihit: [2, 5] },
        "Fury Swipes": { bp: 18, type: "Normal", multihit: [2, 5] },
        Glare: { bp: 0, category: "Status", type: "Normal" },
        Growth: { bp: 0, category: "Status", type: "Normal" },
        Guillotine: { bp: 0, type: "Normal" },
        Gust: { bp: 40, type: "Normal" },
        Haze: { bp: 0, category: "Status", type: "Ice" },
        "High Jump Kick": { bp: 85, type: "Fighting", hasCrashDamage: true },
        "Horn Drill": { bp: 0, type: "Normal" },
        "Hyper Beam": { bp: 150, type: "Normal" },
        "Jump Kick": { bp: 70, type: "Fighting", hasCrashDamage: true },
        "Karate Chop": { bp: 50, type: "Normal" },
        "Leech Seed": { bp: 0, category: "Status", type: "Grass" },
        "Light Screen": { bp: 0, category: "Status", type: "Psychic" },
        Metronome: { bp: 0, category: "Status", type: "Normal" },
        Mimic: { bp: 0, category: "Status", type: "Normal" },
        Minimize: { bp: 0, category: "Status", type: "Normal" },
        "Mirror Move": { bp: 0, category: "Status", type: "Flying" },
        Mist: { bp: 0, category: "Status", type: "Ice" },
        "Night Shade": { bp: 1, type: "Ghost" },
        "Petal Dance": { bp: 70, type: "Grass" },
        "Pin Missile": { bp: 14, type: "Bug", multihit: [2, 5] },
        "Poison Sting": { bp: 15, type: "Poison" },
        Psychic: { bp: 90, type: "Psychic" },
        Psywave: { bp: 1, type: "Psychic" },
        Rage: { bp: 20, type: "Normal" },
        "Razor Leaf": { bp: 55, type: "Grass" },
        "Razor Wind": { bp: 80, type: "Normal" },
        Recover: { bp: 0, category: "Status", type: "Normal" },
        Reflect: { bp: 0, category: "Status", type: "Psychic" },
        Rest: { bp: 0, category: "Status", type: "Psychic" },
        Roar: { bp: 0, category: "Status", type: "Normal" },
        "Rock Slide": { bp: 75, type: "Rock" },
        "Rock Throw": { bp: 50, type: "Rock" },
        "Sand Attack": { bp: 0, category: "Status", type: "Normal" },
        "Seismic Toss": { bp: 1, type: "Fighting" },
        "Self-Destruct": { bp: 130, type: "Normal" },
        "Skull Bash": { bp: 100, type: "Normal" },
        Slash: { bp: 70, type: "Normal" },
        Sludge: { bp: 65, type: "Poison" },
        "Soft-Boiled": { bp: 0, category: "Status", type: "Normal" },
        "Solar Beam": { bp: 120, type: "Grass" },
        "Sonic Boom": { bp: 1, type: "Normal" },
        "Spike Cannon": { bp: 20, type: "Normal", multihit: [2, 5] },
        Stomp: { bp: 65, type: "Normal" },
        Struggle: { bp: 50, type: "Normal", recoil: [1, 2] },
        "Stun Spore": { bp: 0, category: "Status", type: "Grass" },
        Submission: { bp: 80, type: "Fighting", recoil: [1, 4] },
        Substitute: { bp: 0, category: "Status", type: "Normal" },
        "Super Fang": { bp: 1, type: "Normal" },
        Swift: { bp: 60, type: "Normal" },
        "Take Down": { bp: 90, type: "Normal", recoil: [1, 4] },
        Thrash: { bp: 90, type: "Normal" },
        Thunder: { bp: 120, type: "Electric" },
        "Thunder Wave": { bp: 0, category: "Status", type: "Electric" },
        Transform: { bp: 0, category: "Status", type: "Normal" },
        "Tri Attack": { bp: 80, type: "Normal" },
        Twineedle: { bp: 25, type: "Bug", multihit: 2 },
        Whirlwind: { bp: 0, category: "Status", type: "Normal" },
        "Wing Attack": { bp: 35, type: "Flying" },
        Wrap: { bp: 15, type: "Normal" },
        Growl: { bp: 0, category: "Status", type: "Normal" },
        Leer: { bp: 0, category: "Status", type: "Normal" },
        "Low Kick": { bp: 50, type: "Fighting" },
        "Poison Gas": { bp: 0, category: "Status", type: "Poison" },
        "Poison Powder": { bp: 0, category: "Status", type: "Poison" },
        "Sky Attack": { bp: 140, type: "Flying" },
        "String Shot": { bp: 0, category: "Status", type: "Bug" },
        Surf: { bp: 95, type: "Water" },
        "Tail Whip": { bp: 0, category: "Status", type: "Normal" },
        Toxic: { bp: 0, category: "Status", type: "Poison" },
        Flash: { bp: 0, category: "Status", type: "Normal" },
        Hypnosis: { bp: 0, category: "Status", type: "Psychic" },
        "Leech Life": { bp: 20, type: "Bug", drain: [1, 2] },
        "Mega Drain": { bp: 40, type: "Grass", drain: [1, 2] },
        "Vine Whip": { bp: 35, type: "Grass" },
        Waterfall: { bp: 80, type: "Water" },
        Tackle: { bp: 35, type: "Normal" },
        "Acid Armor": { bp: 0, category: "Status", type: "Poison" },
        Barrier: { bp: 0, category: "Status", type: "Psychic" },
        "Body Slam": { bp: 85, type: "Normal" },
        Flamethrower: { bp: 95, type: "Fire" },
        "Hydro Pump": { bp: 120, type: "Water" },
        "Ice Beam": { bp: 95, type: "Ice" },
        Lick: { bp: 20, type: "Ghost" },
        Screech: { bp: 0, category: "Status", type: "Normal" },
        Sing: { bp: 0, category: "Status", type: "Normal" },
        "Sleep Powder": { bp: 0, category: "Status", type: "Grass" },
        Smog: { bp: 20, type: "Poison" },
        Spore: { bp: 0, category: "Status", type: "Grass" },
        Supersonic: { bp: 0, category: "Status", type: "Normal" },
        "Swords Dance": { bp: 0, category: "Status", type: "Normal" },
        Thunderbolt: { bp: 95, type: "Electric" },
        "Bone Club": { bp: 65, type: "Ground" },
        "Egg Bomb": { bp: 100, type: "Normal" },
        "Hyper Fang": { bp: 80, type: "Normal" },
        Kinesis: { bp: 0, category: "Status", type: "Psychic" },
        "Lovely Kiss": { bp: 0, category: "Status", type: "Normal" },
        Meditate: { bp: 0, category: "Status", type: "Psychic" },
        "Rolling Kick": { bp: 60, type: "Fighting" },
        Sharpen: { bp: 0, category: "Status", type: "Normal" },
        Teleport: { bp: 0, category: "Status", type: "Psychic" },
        Agility: { bp: 0, category: "Status", type: "Psychic" },
        "Confuse Ray": { bp: 0, category: "Status", type: "Ghost" },
        Confusion: { bp: 50, type: "Psychic" },
        Cut: { bp: 50, type: "Normal" },
        "Double Team": { bp: 0, category: "Status", type: "Normal" },
        "Drill Peck": { bp: 80, type: "Flying" },
        Ember: { bp: 40, type: "Fire" },
        "Fire Punch": { bp: 75, type: "Fire" },
        Harden: { bp: 0, category: "Status", type: "Normal" },
        Headbutt: { bp: 70, type: "Normal" },
        "Horn Attack": { bp: 65, type: "Normal" },
        "Ice Punch": { bp: 75, type: "Ice" },
        "Mega Kick": { bp: 120, type: "Normal" },
        "Mega Punch": { bp: 80, type: "Normal" },
        "Paleo Wave": { bp: 85, type: "Rock" },
        "Pay Day": { bp: 40, type: "Normal" },
        Peck: { bp: 35, type: "Flying" },
        "Polar Flare": { bp: 75, type: "Fire" },
        Pound: { bp: 40, type: "Normal" },
        Psybeam: { bp: 65, type: "Psychic" },
        "Quick Attack": { bp: 40, type: "Normal", priority: 1 },
        Scratch: { bp: 40, type: "Normal" },
        "Shadow Strike": { bp: 80, type: "Ghost" },
        Slam: { bp: 80, type: "Normal" },
        Smokescreen: { bp: 0, category: "Status", type: "Normal" },
        Splash: { bp: 0, category: "Status", type: "Normal" },
        Strength: { bp: 80, type: "Normal" },
        "Thunder Punch": { bp: 75, type: "Electric" },
        "Thunder Shock": { bp: 40, type: "Electric" },
        "Vise Grip": { bp: 55, type: "Normal" },
        "Water Gun": { bp: 40, type: "Water" },
        Withdraw: { bp: 0, category: "Status", type: "Water" }
      };
      var GSC_PATCH = {
        Bide: { type: "Normal" },
        Counter: { bp: 0 },
        Dig: { bp: 60 },
        "Double-Edge": { bp: 120 },
        Explosion: { bp: 250 },
        Gust: { type: "Flying" },
        "Karate Chop": { type: "Fighting" },
        Psywave: { bp: 0 },
        "Self-Destruct": { bp: 200 },
        Struggle: { recoil: [1, 4] },
        "Dragon Rage": { bp: 0 },
        Bite: { type: "Dark" },
        "Night Shade": { bp: 0 },
        "Sand Attack": { type: "Ground" },
        "Seismic Toss": { bp: 0 },
        "Sonic Boom": { bp: 0 },
        "Super Fang": { bp: 0 },
        "Wing Attack": { bp: 60 },
        Aeroblast: { bp: 100, type: "Flying" },
        Attract: { bp: 0, category: "Status", type: "Normal" },
        "Beat Up": { bp: 10, type: "Dark" },
        "Belly Drum": { bp: 0, category: "Status", type: "Normal" },
        "Conversion 2": { bp: 0, category: "Status", type: "Normal" },
        "Cross Chop": { bp: 100, type: "Fighting" },
        Curse: { bp: 0, category: "Status", type: "???" },
        "Destiny Bond": { bp: 0, category: "Status", type: "Ghost" },
        Detect: { bp: 0, category: "Status", type: "Fighting", priority: 2 },
        Encore: { bp: 0, category: "Status", type: "Normal" },
        Endure: { bp: 0, category: "Status", type: "Normal", priority: 2 },
        Flail: { bp: 0, type: "Normal" },
        Foresight: { bp: 0, category: "Status", type: "Normal" },
        "Future Sight": { bp: 80, type: "Psychic" },
        "Heal Bell": { bp: 0, category: "Status", type: "Normal" },
        "Icy Wind": { bp: 55, type: "Ice" },
        "Lock-On": { bp: 0, category: "Status", type: "Normal" },
        "Mind Reader": { bp: 0, category: "Status", type: "Normal" },
        "Mirror Coat": { bp: 0, type: "Psychic" },
        Moonlight: { bp: 0, category: "Status", type: "Normal" },
        "Morning Sun": { bp: 0, category: "Status", type: "Normal" },
        Nightmare: { bp: 0, category: "Status", type: "Ghost" },
        Outrage: { bp: 90, type: "Dragon" },
        "Powder Snow": { bp: 40, type: "Ice" },
        Present: { bp: 0, type: "Normal" },
        Protect: { bp: 0, category: "Status", type: "Normal", priority: 2 },
        "Psych Up": { bp: 0, category: "Status", type: "Normal" },
        Pursuit: { bp: 40, type: "Dark" },
        "Rain Dance": { bp: 0, category: "Status", type: "Water" },
        Reversal: { bp: 0, type: "Fighting" },
        Safeguard: { bp: 0, category: "Status", type: "Normal" },
        Sandstorm: { bp: 0, category: "Status", type: "Rock" },
        Sketch: { bp: 0, category: "Status", type: "Normal" },
        "Sleep Talk": { bp: 0, category: "Status", type: "Normal" },
        Spikes: { bp: 0, category: "Status", type: "Ground" },
        Spite: { bp: 0, category: "Status", type: "Ghost" },
        "Sunny Day": { bp: 0, category: "Status", type: "Fire" },
        Swagger: { bp: 0, category: "Status", type: "Normal" },
        "Sweet Scent": { bp: 0, category: "Status", type: "Normal" },
        Synthesis: { bp: 0, category: "Status", type: "Grass" },
        Thief: { bp: 40, type: "Dark" },
        "Triple Kick": { bp: 10, type: "Fighting", multihit: [1, 3] },
        Twister: { bp: 40, type: "Dragon" },
        "Ancient Power": { bp: 60, type: "Rock" },
        "Bone Rush": { bp: 25, type: "Ground", multihit: [2, 5] },
        Crunch: { bp: 80, type: "Dark" },
        "Feint Attack": { bp: 60, type: "Dark" },
        "Giga Drain": { bp: 60, type: "Grass", drain: [1, 2] },
        "Hidden Power": { bp: 0, type: "Normal" },
        "Mean Look": { bp: 0, category: "Status", type: "Normal" },
        "Rapid Spin": { bp: 20, type: "Normal" },
        "Rock Smash": { bp: 20, type: "Fighting" },
        "Spider Web": { bp: 0, category: "Status", type: "Bug" },
        Whirlpool: { bp: 15, type: "Water" },
        "Zap Cannon": { bp: 100, type: "Electric" },
        "Cotton Spore": { bp: 0, category: "Status", type: "Grass" },
        "Extreme Speed": { bp: 80, type: "Normal", priority: 1 },
        "Fury Cutter": { bp: 10, type: "Bug" },
        Magnitude: { bp: 0, type: "Ground" },
        "Milk Drink": { bp: 0, category: "Status", type: "Normal" },
        "Scary Face": { bp: 0, category: "Status", type: "Normal" },
        Charm: { bp: 0, category: "Status", type: "Normal" },
        "Hidden Power Bug": { bp: 70, type: "Bug" },
        "Hidden Power Dark": { bp: 70, type: "Dark" },
        "Hidden Power Dragon": { bp: 70, type: "Dragon" },
        "Hidden Power Electric": { bp: 70, type: "Electric" },
        "Hidden Power Fighting": { bp: 70, type: "Fighting" },
        "Hidden Power Fire": { bp: 70, type: "Fire" },
        "Hidden Power Flying": { bp: 70, type: "Flying" },
        "Hidden Power Ghost": { bp: 70, type: "Ghost" },
        "Hidden Power Grass": { bp: 70, type: "Grass" },
        "Hidden Power Ground": { bp: 70, type: "Ground" },
        "Hidden Power Ice": { bp: 70, type: "Ice" },
        "Hidden Power Poison": { bp: 70, type: "Poison" },
        "Hidden Power Psychic": { bp: 70, type: "Psychic" },
        "Hidden Power Rock": { bp: 70, type: "Rock" },
        "Hidden Power Steel": { bp: 70, type: "Steel" },
        "Hidden Power Water": { bp: 70, type: "Water" },
        "Perish Song": { bp: 0, category: "Status", type: "Normal" },
        Snore: { bp: 40, type: "Normal" },
        "Sweet Kiss": { bp: 0, category: "Status", type: "Normal" },
        Rollout: { bp: 30, type: "Rock" },
        Frustration: { bp: 0, type: "Normal" },
        Return: { bp: 0, type: "Normal" },
        "Sacred Fire": { bp: 100, type: "Fire" },
        "Baton Pass": { bp: 0, category: "Status", type: "Normal" },
        "Dragon Breath": { bp: 60, type: "Dragon" },
        "Dynamic Punch": { bp: 100, type: "Fighting" },
        "False Swipe": { bp: 40, type: "Normal" },
        "Flame Wheel": { bp: 60, type: "Fire" },
        "Iron Tail": { bp: 100, type: "Steel" },
        "Mach Punch": { bp: 40, type: "Fighting", priority: 1 },
        Megahorn: { bp: 120, type: "Bug" },
        "Metal Claw": { bp: 50, type: "Steel" },
        "Mud-Slap": { bp: 20, type: "Ground" },
        Octazooka: { bp: 65, type: "Water" },
        "Pain Split": { bp: 0, category: "Status", type: "Normal" },
        "Shadow Ball": { bp: 80, type: "Ghost" },
        "Sludge Bomb": { bp: 90, type: "Poison" },
        Spark: { bp: 65, type: "Electric" },
        "Steel Wing": { bp: 70, type: "Steel" },
        "Vital Throw": { bp: 70, type: "Fighting" }
      };
      var GSC = (0, util_1.extend)(true, {}, RBY, GSC_PATCH);
      var ADV_PATCH = {
        Acid: { target: "allAdjacentFoes" },
        "Ancient Power": { makesContact: true },
        Bide: { makesContact: true },
        Bind: { makesContact: true },
        Blizzard: { target: "allAdjacentFoes" },
        Clamp: { makesContact: true },
        "Comet Punch": { makesContact: true },
        Counter: { makesContact: true },
        Crunch: { makesContact: true },
        Detect: { priority: 3 },
        Endure: { priority: 4 },
        Protect: { priority: 3 },
        Dig: { makesContact: true },
        "Double Kick": { makesContact: true },
        "Double Slap": { makesContact: true },
        Explosion: { target: "allAdjacent" },
        Flail: { makesContact: true },
        Fly: { makesContact: true },
        "Fury Attack": { makesContact: true },
        "Fury Swipes": { makesContact: true },
        "High Jump Kick": { makesContact: true },
        "Jump Kick": { makesContact: true },
        "Leech Life": { makesContact: true },
        Outrage: { makesContact: true },
        "Petal Dance": { makesContact: true },
        Pursuit: { makesContact: true },
        Rage: { makesContact: true },
        "Rapid Spin": { makesContact: true },
        "Razor Wind": { target: "allAdjacentFoes" },
        Reversal: { makesContact: true },
        "Rock Smash": { makesContact: true },
        "Self-Destruct": { target: "allAdjacent" },
        "Skull Bash": { makesContact: true },
        Stomp: { makesContact: true },
        Struggle: { makesContact: true },
        Surf: { target: "allAdjacentFoes" },
        Thief: { makesContact: true },
        Thrash: { makesContact: true },
        "Triple Kick": { makesContact: true, multihit: 3, multiaccuracy: true },
        "Vine Whip": { makesContact: true },
        Waterfall: { makesContact: true },
        Wrap: { makesContact: true },
        Crabhammer: { makesContact: true },
        "Double-Edge": { recoil: [1, 3], makesContact: true },
        Earthquake: { target: "allAdjacent" },
        "Extreme Speed": { makesContact: true },
        "Fury Cutter": { makesContact: true },
        "Heal Bell": { isSound: true },
        Magnitude: { target: "allAdjacent" },
        Roar: { isSound: true },
        Submission: { makesContact: true },
        Tackle: { makesContact: true },
        "Take Down": { makesContact: true },
        Twister: { target: "allAdjacentFoes" },
        "Body Slam": { makesContact: true },
        Bubble: { target: "allAdjacentFoes" },
        Growl: { isSound: true, target: "allAdjacentFoes" },
        Lick: { makesContact: true },
        "Perish Song": { isSound: true },
        Screech: { isSound: true },
        Sing: { isSound: true },
        Snore: { isSound: true },
        "String Shot": { target: "allAdjacentFoes" },
        Supersonic: { isSound: true },
        "Sweet Scent": { target: "allAdjacentFoes" },
        Rollout: { makesContact: true },
        Constrict: { makesContact: true },
        "Dizzy Punch": { makesContact: true },
        Frustration: { makesContact: true },
        "Hyper Fang": { makesContact: true },
        "Karate Chop": { makesContact: true },
        "Low Kick": { bp: 0, makesContact: true },
        Return: { makesContact: true },
        "Rolling Kick": { makesContact: true },
        Bite: { makesContact: true },
        "Cross Chop": { makesContact: true },
        Cut: { makesContact: true },
        "Drill Peck": { makesContact: true },
        "Dynamic Punch": { makesContact: true },
        "False Swipe": { makesContact: true },
        "Fire Punch": { makesContact: true },
        "Flame Wheel": { makesContact: true },
        Guillotine: { makesContact: true },
        Headbutt: { makesContact: true },
        "Horn Attack": { makesContact: true },
        "Horn Drill": { makesContact: true },
        "Ice Punch": { makesContact: true },
        "Icy Wind": { target: "allAdjacentFoes" },
        "Iron Tail": { makesContact: true },
        Leer: { target: "allAdjacentFoes" },
        "Mach Punch": { makesContact: true },
        Megahorn: { makesContact: true },
        "Mega Kick": { makesContact: true },
        "Mega Punch": { makesContact: true },
        "Metal Claw": { makesContact: true },
        Peck: { makesContact: true },
        "Polar Flare": { target: "allAdjacentFoes" },
        Pound: { makesContact: true },
        "Powder Snow": { target: "allAdjacentFoes" },
        "Quick Attack": { makesContact: true },
        "Razor Leaf": { target: "allAdjacentFoes" },
        "Rock Slide": { target: "allAdjacentFoes" },
        Scratch: { makesContact: true },
        "Seismic Toss": { makesContact: true },
        "Shadow Strike": { makesContact: true },
        Slam: { makesContact: true },
        Slash: { makesContact: true },
        Spark: { makesContact: true },
        "Steel Wing": { makesContact: true },
        Strength: { makesContact: true },
        "Super Fang": { makesContact: true },
        Swift: { target: "allAdjacentFoes" },
        "Tail Whip": { target: "allAdjacentFoes" },
        "Thunder Punch": { makesContact: true },
        "Vise Grip": { makesContact: true },
        "Vital Throw": { makesContact: true },
        "Wing Attack": { makesContact: true },
        "Arm Thrust": {
          bp: 15,
          type: "Fighting",
          multihit: [2, 5],
          makesContact: true
        },
        Assist: { bp: 0, category: "Status", type: "Normal" },
        Astonish: { bp: 30, type: "Ghost", makesContact: true },
        Block: { bp: 0, category: "Status", type: "Normal" },
        Bounce: { bp: 85, type: "Flying", makesContact: true },
        "Bullet Seed": { bp: 10, type: "Grass", multihit: [2, 5] },
        Camouflage: { bp: 0, category: "Status", type: "Normal" },
        Charge: { bp: 0, category: "Status", type: "Electric" },
        Covet: { bp: 40, type: "Normal" },
        Dive: { bp: 60, type: "Water", makesContact: true },
        "Doom Desire": { bp: 120, type: "Steel" },
        Extrasensory: { bp: 80, type: "Psychic" },
        "Fake Out": { bp: 40, type: "Normal", priority: 1 },
        "Follow Me": { bp: 0, category: "Status", type: "Normal", priority: 3 },
        Hail: { bp: 0, category: "Status", type: "Ice" },
        "Icicle Spear": { bp: 10, type: "Ice", multihit: [2, 5] },
        Ingrain: { bp: 0, category: "Status", type: "Grass" },
        "Knock Off": { bp: 20, type: "Dark", makesContact: true },
        "Leaf Blade": { bp: 70, type: "Grass", makesContact: true },
        "Magic Coat": { bp: 0, category: "Status", type: "Psychic", priority: 4 },
        Memento: { bp: 0, category: "Status", type: "Dark" },
        "Nature Power": { bp: 0, category: "Status", type: "Normal" },
        "Needle Arm": { bp: 60, type: "Grass", makesContact: true },
        "Odor Sleuth": { bp: 0, category: "Status", type: "Normal" },
        Overheat: { bp: 140, type: "Fire", self: { boosts: { spa: -2 } }, makesContact: true },
        Revenge: { bp: 60, type: "Fighting", makesContact: true },
        "Rock Blast": { bp: 25, type: "Rock", multihit: [2, 5] },
        "Role Play": { bp: 0, category: "Status", type: "Psychic" },
        "Sand Tomb": { bp: 15, type: "Ground" },
        "Skill Swap": { bp: 0, category: "Status", type: "Psychic" },
        "Smelling Salts": { bp: 60, type: "Normal", makesContact: true },
        "Spit Up": { bp: 0, type: "Normal" },
        Stockpile: { bp: 0, category: "Status", type: "Normal" },
        Swallow: { bp: 0, category: "Status", type: "Normal" },
        Taunt: { bp: 0, category: "Status", type: "Dark" },
        "Teeter Dance": { bp: 0, category: "Status", type: "Normal", target: "allAdjacent" },
        Tickle: { bp: 0, category: "Status", type: "Normal" },
        Trick: { bp: 0, category: "Status", type: "Psychic" },
        Uproar: { bp: 50, type: "Normal", isSound: true },
        "Volt Tackle": { bp: 120, type: "Electric", recoil: [1, 3], makesContact: true },
        "Weather Ball": { bp: 50, type: "Normal" },
        Aromatherapy: { bp: 0, category: "Status", type: "Grass" },
        "Brick Break": { bp: 75, type: "Fighting", makesContact: true },
        Endeavor: { bp: 0, type: "Normal", makesContact: true },
        "Focus Punch": { bp: 150, type: "Fighting", makesContact: true },
        Imprison: { bp: 0, category: "Status", type: "Psychic" },
        "Mud Sport": { bp: 0, category: "Status", type: "Ground" },
        Recycle: { bp: 0, category: "Status", type: "Normal" },
        "Secret Power": { bp: 70, type: "Normal" },
        "Sky Uppercut": { bp: 85, type: "Fighting", makesContact: true },
        "Slack Off": { bp: 0, category: "Status", type: "Normal" },
        Snatch: { bp: 0, category: "Status", type: "Dark", priority: 4 },
        "Tail Glow": { bp: 0, category: "Status", type: "Bug" },
        Torment: { bp: 0, category: "Status", type: "Dark" },
        "Water Sport": { bp: 0, category: "Status", type: "Water" },
        Wish: { bp: 0, category: "Status", type: "Normal" },
        "Air Cutter": { bp: 55, type: "Flying", target: "allAdjacentFoes" },
        Facade: { bp: 70, type: "Normal", makesContact: true },
        "Grass Whistle": { bp: 0, category: "Status", type: "Grass", isSound: true },
        "Heat Wave": { bp: 100, type: "Fire", target: "allAdjacentFoes" },
        "Hyper Voice": { bp: 90, type: "Normal", isSound: true, target: "allAdjacentFoes" },
        "Metal Sound": { bp: 0, category: "Status", type: "Steel", isSound: true },
        "Meteor Mash": { bp: 100, type: "Steel", makesContact: true },
        "Muddy Water": { bp: 95, type: "Water", target: "allAdjacentFoes" },
        "Poison Fang": { bp: 50, type: "Poison", makesContact: true },
        "Rock Tomb": { bp: 50, type: "Rock" },
        "Will-O-Wisp": { bp: 0, category: "Status", type: "Fire" },
        "Ice Ball": { bp: 30, type: "Ice", makesContact: true },
        "Sheer Cold": { bp: 0, type: "Ice" },
        Howl: { bp: 0, category: "Status", type: "Normal" },
        "Luster Purge": { bp: 70, type: "Psychic" },
        "Mist Ball": { bp: 70, type: "Psychic" },
        "Psycho Boost": { bp: 140, type: "Psychic", self: { boosts: { spa: -2 } } },
        Refresh: { bp: 0, category: "Status", type: "Normal" },
        "Signal Beam": { bp: 75, type: "Bug" },
        "Silver Wind": { bp: 60, type: "Bug" },
        "Aerial Ace": { bp: 60, type: "Flying", makesContact: true },
        "Blast Burn": { bp: 150, type: "Fire" },
        "Blaze Kick": { bp: 85, type: "Fire", makesContact: true },
        "Bulk Up": { bp: 0, category: "Status", type: "Fighting" },
        "Calm Mind": { bp: 0, category: "Status", type: "Psychic" },
        "Cosmic Power": { bp: 0, category: "Status", type: "Psychic" },
        "Crush Claw": { bp: 75, type: "Normal", makesContact: true },
        "Dragon Claw": { bp: 80, type: "Dragon", makesContact: true },
        "Dragon Dance": { bp: 0, category: "Status", type: "Dragon" },
        Eruption: { bp: 150, type: "Fire", target: "allAdjacentFoes" },
        "Fake Tears": { bp: 0, category: "Status", type: "Dark" },
        "Feather Dance": { bp: 0, category: "Status", type: "Flying" },
        Flatter: { bp: 0, category: "Status", type: "Dark" },
        "Frenzy Plant": { bp: 150, type: "Grass" },
        Grudge: { bp: 0, category: "Status", type: "Ghost" },
        "Helping Hand": { bp: 0, category: "Status", type: "Normal", priority: 5 },
        "Hydro Cannon": { bp: 150, type: "Water" },
        "Iron Defense": { bp: 0, category: "Status", type: "Steel" },
        "Magical Leaf": { bp: 60, type: "Grass" },
        "Mud Shot": { bp: 55, type: "Ground" },
        "Poison Tail": { bp: 50, type: "Poison", makesContact: true },
        "Shadow Punch": { bp: 60, type: "Ghost", makesContact: true },
        "Shock Wave": { bp: 60, type: "Electric" },
        Superpower: { bp: 120, type: "Fighting", self: { boosts: { atk: -1, def: -1 } }, makesContact: true },
        "Water Pulse": { bp: 60, type: "Water" },
        "Water Spout": { bp: 150, type: "Water", target: "allAdjacentFoes" },
        Yawn: { bp: 0, category: "Status", type: "Normal" }
      };
      var ADV = (0, util_1.extend)(true, {}, GSC, ADV_PATCH);
      var DPP_PATCH = {
        Absorb: { category: "Special" },
        "Arm Thrust": { category: "Physical" },
        Barrage: { category: "Physical" },
        "Beat Up": { category: "Physical" },
        Bide: { priority: 1, category: "Physical" },
        Bind: { category: "Physical" },
        "Bone Rush": { category: "Physical" },
        Bonemerang: { category: "Physical" },
        Bounce: { category: "Physical" },
        "Brick Break": { category: "Physical" },
        "Bullet Seed": { category: "Physical" },
        Clamp: { category: "Physical" },
        "Comet Punch": { isPunch: true, category: "Physical" },
        Counter: { category: "Physical" },
        Covet: { makesContact: true, category: "Physical" },
        Crabhammer: { category: "Physical" },
        Dig: { bp: 80, category: "Physical" },
        Dive: { bp: 80, category: "Physical" },
        "Doom Desire": { category: "Special" },
        "Double-Edge": { category: "Physical" },
        "Double Kick": { category: "Physical" },
        "Double Slap": { category: "Physical" },
        "Dream Eater": { category: "Special" },
        Earthquake: { category: "Physical" },
        Endeavor: { category: "Physical" },
        Explosion: { category: "Physical" },
        "Extreme Speed": { category: "Physical" },
        "Fake Out": { makesContact: true, category: "Physical" },
        "Fire Spin": { category: "Special" },
        Flail: { category: "Physical" },
        Fly: { bp: 90, category: "Physical" },
        "Focus Punch": { isPunch: true, category: "Physical" },
        "Fury Attack": { category: "Physical" },
        "Fury Cutter": { category: "Physical" },
        "Fury Swipes": { category: "Physical" },
        "Future Sight": { category: "Special" },
        "Giga Drain": { category: "Special" },
        Gust: { category: "Special" },
        "High Jump Kick": { bp: 100, category: "Physical" },
        "Icicle Spear": { category: "Physical" },
        "Jump Kick": { bp: 85, category: "Physical" },
        "Knock Off": { category: "Physical" },
        "Leech Life": { category: "Physical" },
        Magnitude: { category: "Physical" },
        "Mega Drain": { category: "Special" },
        "Mirror Coat": { category: "Special" },
        Outrage: { bp: 120, category: "Physical" },
        "Petal Dance": { bp: 90, category: "Special" },
        "Pin Missile": { category: "Physical" },
        Psywave: { category: "Special" },
        Pursuit: { category: "Physical" },
        "Rapid Spin": { category: "Physical" },
        "Razor Wind": { category: "Special" },
        Revenge: { category: "Physical" },
        Reversal: { category: "Physical" },
        "Rock Blast": { category: "Physical" },
        "Sand Tomb": { category: "Physical" },
        "Secret Power": { category: "Physical" },
        "Self-Destruct": { category: "Physical" },
        "Sky Uppercut": { isPunch: true, category: "Physical" },
        "Smelling Salts": { category: "Physical" },
        "Solar Beam": { category: "Special" },
        "Spike Cannon": { category: "Physical" },
        "Spit Up": { category: "Special" },
        Stomp: { category: "Physical" },
        Struggle: { category: "Physical", struggleRecoil: true },
        Submission: { category: "Physical" },
        Surf: { target: "allAdjacent", category: "Special" },
        Tackle: { category: "Physical" },
        "Take Down": { category: "Physical" },
        Thief: { category: "Physical" },
        Thrash: { category: "Physical" },
        Thunder: { category: "Special" },
        "Triple Kick": { category: "Physical" },
        Twineedle: { category: "Physical" },
        Twister: { category: "Special" },
        Uproar: { category: "Special" },
        "Volt Tackle": { category: "Physical" },
        Whirlpool: { category: "Special" },
        Wrap: { category: "Physical" },
        "Air Cutter": { category: "Special" },
        Blizzard: { category: "Special" },
        "Body Slam": { category: "Physical" },
        Bubble: { category: "Special" },
        Extrasensory: { category: "Special" },
        Facade: { category: "Physical" },
        "Fire Blast": { category: "Special" },
        Flamethrower: { category: "Special" },
        "Heat Wave": { category: "Special" },
        "Hidden Power": { category: "Special" },
        "Hidden Power Bug": { category: "Special" },
        "Hidden Power Dark": { category: "Special" },
        "Hidden Power Dragon": { category: "Special" },
        "Hidden Power Electric": { category: "Special" },
        "Hidden Power Fighting": { category: "Special" },
        "Hidden Power Fire": { category: "Special" },
        "Hidden Power Flying": { category: "Special" },
        "Hidden Power Ghost": { category: "Special" },
        "Hidden Power Grass": { category: "Special" },
        "Hidden Power Ground": { category: "Special" },
        "Hidden Power Ice": { category: "Special" },
        "Hidden Power Poison": { category: "Special" },
        "Hidden Power Psychic": { category: "Special" },
        "Hidden Power Rock": { category: "Special" },
        "Hidden Power Steel": { category: "Special" },
        "Hidden Power Water": { category: "Special" },
        "Hydro Pump": { category: "Special" },
        "Hyper Voice": { category: "Special" },
        "Ice Beam": { category: "Special" },
        Lick: { category: "Physical" },
        "Meteor Mash": { isPunch: true, category: "Physical" },
        "Muddy Water": { category: "Special" },
        Overheat: { category: "Special", makesContact: false },
        "Poison Fang": { isBite: true, category: "Physical" },
        "Rock Tomb": { category: "Physical" },
        "Skull Bash": { category: "Physical" },
        Smog: { category: "Special" },
        Snore: { category: "Special" },
        Thunderbolt: { category: "Special" },
        "Vine Whip": { category: "Physical" },
        "Weather Ball": { category: "Special" },
        "Ice Ball": { category: "Physical" },
        Rollout: { category: "Physical" },
        "Sheer Cold": { category: "Special" },
        Aeroblast: { category: "Special" },
        "Bone Club": { category: "Physical" },
        Constrict: { category: "Physical" },
        "Dizzy Punch": { isPunch: true, category: "Physical" },
        "Dragon Rage": { category: "Special" },
        "Egg Bomb": { category: "Physical" },
        "Feint Attack": { makesContact: true, category: "Physical" },
        Frustration: { category: "Physical" },
        "Hyper Fang": { isBite: true, category: "Physical" },
        "Karate Chop": { category: "Physical" },
        "Low Kick": { category: "Physical" },
        "Luster Purge": { category: "Special" },
        "Mist Ball": { category: "Special" },
        "Needle Arm": { category: "Physical" },
        "Psycho Boost": { category: "Special" },
        Rage: { category: "Physical" },
        Return: { category: "Physical" },
        "Rolling Kick": { category: "Physical" },
        "Sacred Fire": { category: "Physical" },
        "Signal Beam": { category: "Special" },
        "Silver Wind": { category: "Special" },
        "Sonic Boom": { category: "Special" },
        Acid: { category: "Special" },
        "Aerial Ace": { category: "Physical" },
        "Ancient Power": { category: "Special", makesContact: false },
        Astonish: { category: "Physical" },
        "Aurora Beam": { category: "Special" },
        Bite: { isBite: true, category: "Physical" },
        "Blast Burn": { category: "Special" },
        "Blaze Kick": { category: "Physical" },
        "Bubble Beam": { category: "Special" },
        Confusion: { category: "Special" },
        "Cross Chop": { category: "Physical" },
        Crunch: { isBite: true, category: "Physical" },
        "Crush Claw": { category: "Physical" },
        Cut: { category: "Physical" },
        "Dragon Breath": { category: "Special" },
        "Dragon Claw": { category: "Physical" },
        "Drill Peck": { category: "Physical" },
        "Dynamic Punch": { isPunch: true, category: "Physical" },
        Ember: { category: "Special" },
        Eruption: { category: "Special" },
        "False Swipe": { category: "Physical" },
        "Fire Punch": { isPunch: true, category: "Physical" },
        Fissure: { category: "Physical" },
        "Flame Wheel": { category: "Physical" },
        "Frenzy Plant": { category: "Special" },
        Guillotine: { category: "Physical" },
        Headbutt: { category: "Physical" },
        "Horn Attack": { category: "Physical" },
        "Horn Drill": { category: "Physical" },
        "Hydro Cannon": { category: "Special" },
        "Hyper Beam": { category: "Special" },
        "Ice Punch": { isPunch: true, category: "Physical" },
        "Icy Wind": { category: "Special" },
        "Iron Tail": { category: "Physical" },
        "Leaf Blade": { bp: 90, category: "Physical" },
        "Mach Punch": { isPunch: true, category: "Physical" },
        "Magical Leaf": { category: "Special" },
        Megahorn: { category: "Physical" },
        "Mega Kick": { category: "Physical" },
        "Mega Punch": { isPunch: true, category: "Physical" },
        "Metal Claw": { category: "Physical" },
        "Mud Shot": { category: "Special" },
        "Mud-Slap": { category: "Special" },
        "Night Shade": { category: "Special" },
        Octazooka: { category: "Special" },
        "Paleo Wave": { category: "Special" },
        "Pay Day": { category: "Physical" },
        Peck: { category: "Physical" },
        "Poison Sting": { category: "Physical" },
        "Poison Tail": { category: "Physical" },
        "Polar Flare": { category: "Special" },
        Pound: { category: "Physical" },
        "Powder Snow": { category: "Special" },
        Present: { category: "Physical" },
        Psybeam: { category: "Special" },
        Psychic: { category: "Special" },
        "Quick Attack": { category: "Physical" },
        "Razor Leaf": { category: "Physical" },
        "Rock Slide": { category: "Physical" },
        "Rock Smash": { bp: 40, category: "Physical" },
        "Rock Throw": { category: "Physical" },
        Scratch: { category: "Physical" },
        "Seismic Toss": { category: "Physical" },
        "Shadow Ball": { category: "Special" },
        "Shadow Punch": { isPunch: true, category: "Physical" },
        "Shadow Strike": { category: "Physical" },
        "Shock Wave": { category: "Special" },
        "Sky Attack": { category: "Physical" },
        Slam: { category: "Physical" },
        Slash: { category: "Physical" },
        Sludge: { category: "Special" },
        "Sludge Bomb": { category: "Special" },
        Spark: { category: "Physical" },
        "Steel Wing": { category: "Physical" },
        Strength: { category: "Physical" },
        "Super Fang": { category: "Physical" },
        Superpower: { category: "Physical" },
        Swift: { category: "Special" },
        "Thunder Punch": { isPunch: true, category: "Physical" },
        "Thunder Shock": { category: "Special" },
        "Tri Attack": { category: "Special" },
        "Vise Grip": { category: "Physical" },
        "Vital Throw": { category: "Physical" },
        Waterfall: { category: "Physical" },
        "Water Gun": { category: "Special" },
        "Water Pulse": { category: "Special" },
        "Water Spout": { category: "Special" },
        "Wing Attack": { category: "Physical" },
        "Zap Cannon": { bp: 120, category: "Special" },
        Acupressure: { bp: 0, type: "Normal" },
        "Aqua Ring": { bp: 0, type: "Water" },
        Assurance: {
          bp: 50,
          type: "Dark",
          makesContact: true,
          category: "Physical"
        },
        Avalanche: {
          bp: 60,
          type: "Ice",
          makesContact: true,
          category: "Physical"
        },
        "Brave Bird": {
          bp: 120,
          type: "Flying",
          recoil: [1, 3],
          makesContact: true,
          category: "Physical"
        },
        "Bug Bite": {
          bp: 60,
          type: "Bug",
          makesContact: true,
          category: "Physical"
        },
        Chatter: { bp: 60, type: "Flying", isSound: true, category: "Special" },
        Copycat: { bp: 0, type: "Normal" },
        "Crush Grip": {
          bp: 0,
          type: "Normal",
          makesContact: true,
          category: "Physical"
        },
        Defog: { bp: 0, type: "Flying" },
        "Double Hit": {
          bp: 35,
          type: "Normal",
          multihit: 2,
          makesContact: true,
          category: "Physical"
        },
        "Drain Punch": {
          bp: 60,
          type: "Fighting",
          drain: [1, 2],
          makesContact: true,
          isPunch: true,
          category: "Physical"
        },
        Embargo: { bp: 0, type: "Dark" },
        Feint: {
          bp: 50,
          type: "Normal",
          priority: 2,
          breaksProtect: true,
          category: "Physical"
        },
        "Fire Fang": {
          bp: 65,
          type: "Fire",
          makesContact: true,
          isBite: true,
          category: "Physical"
        },
        "Flare Blitz": {
          bp: 120,
          type: "Fire",
          recoil: [1, 3],
          makesContact: true,
          category: "Physical"
        },
        Fling: { bp: 0, type: "Dark", category: "Physical" },
        Gravity: { bp: 0, type: "Psychic" },
        "Head Smash": {
          bp: 150,
          type: "Rock",
          recoil: [1, 2],
          makesContact: true,
          category: "Physical"
        },
        "Heal Block": { bp: 0, type: "Psychic", target: "allAdjacentFoes" },
        "Healing Wish": { bp: 0, type: "Psychic" },
        "Heal Order": { bp: 0, type: "Bug" },
        "Last Resort": {
          bp: 130,
          type: "Normal",
          makesContact: true,
          category: "Physical"
        },
        "Lucky Chant": { bp: 0, type: "Normal" },
        "Lunar Dance": { bp: 0, type: "Psychic" },
        "Magma Storm": { bp: 120, type: "Fire", category: "Special" },
        "Magnet Rise": { bp: 0, type: "Electric" },
        "Me First": { bp: 0, type: "Normal" },
        "Metal Burst": { bp: 0, type: "Steel", category: "Physical" },
        "Miracle Eye": { bp: 0, type: "Psychic" },
        "Natural Gift": { bp: 0, type: "Normal", category: "Physical" },
        Payback: {
          bp: 50,
          type: "Dark",
          makesContact: true,
          category: "Physical"
        },
        Pluck: {
          bp: 60,
          type: "Flying",
          makesContact: true,
          category: "Physical"
        },
        "Power Trick": { bp: 0, type: "Psychic" },
        Roost: { bp: 0, type: "Flying" },
        "Stealth Rock": { bp: 0, type: "Rock" },
        "Sucker Punch": {
          bp: 80,
          type: "Dark",
          priority: 1,
          makesContact: true,
          category: "Physical"
        },
        Switcheroo: { bp: 0, type: "Dark" },
        Tailwind: { bp: 0, type: "Flying" },
        "Toxic Spikes": { bp: 0, type: "Poison" },
        "Trick Room": { bp: 0, type: "Psychic" },
        "U-turn": {
          bp: 70,
          type: "Bug",
          makesContact: true,
          category: "Physical"
        },
        "Wake-Up Slap": {
          bp: 60,
          type: "Fighting",
          makesContact: true,
          category: "Physical"
        },
        "Wood Hammer": {
          bp: 120,
          type: "Grass",
          recoil: [1, 3],
          makesContact: true,
          category: "Physical"
        },
        "Worry Seed": { bp: 0, type: "Grass" },
        "Wring Out": {
          bp: 0,
          type: "Normal",
          makesContact: true,
          category: "Special"
        },
        "Air Slash": { bp: 75, type: "Flying", category: "Special" },
        "Aura Sphere": { bp: 90, type: "Fighting", category: "Special" },
        "Bug Buzz": { bp: 90, type: "Bug", isSound: true, category: "Special" },
        "Draco Meteor": { bp: 140, type: "Dragon", self: { boosts: { spa: -2 } }, category: "Special" },
        "Dragon Pulse": { bp: 90, type: "Dragon", category: "Special" },
        "Dragon Rush": {
          bp: 100,
          type: "Dragon",
          makesContact: true,
          category: "Physical"
        },
        "Energy Ball": { bp: 80, type: "Grass", category: "Special" },
        "Gunk Shot": { bp: 120, type: "Poison", category: "Physical" },
        "Gyro Ball": {
          bp: 0,
          type: "Steel",
          makesContact: true,
          category: "Physical"
        },
        "Leaf Storm": { bp: 140, type: "Grass", self: { boosts: { spa: -2 } }, category: "Special" },
        "Power Gem": { bp: 70, type: "Rock", category: "Special" },
        "Psycho Shift": { bp: 0, type: "Psychic" },
        "Shadow Force": {
          bp: 120,
          type: "Ghost",
          breaksProtect: true,
          makesContact: true,
          category: "Physical"
        },
        "Dark Void": { bp: 0, type: "Dark", target: "allAdjacentFoes" },
        "Gastro Acid": { bp: 0, type: "Poison" },
        Captivate: { bp: 0, type: "Normal", target: "allAdjacentFoes" },
        "Grass Knot": {
          bp: 0,
          type: "Grass",
          makesContact: true,
          category: "Special"
        },
        "Heart Swap": { bp: 0, type: "Psychic" },
        Judgment: { bp: 100, type: "Normal", category: "Special" },
        "Magnet Bomb": { bp: 60, type: "Steel", category: "Physical" },
        "Mirror Shot": { bp: 65, type: "Steel", category: "Special" },
        "Mud Bomb": { bp: 65, type: "Ground", category: "Special" },
        "Ominous Wind": { bp: 60, type: "Ghost", category: "Special" },
        Punishment: {
          bp: 0,
          type: "Dark",
          makesContact: true,
          category: "Physical"
        },
        "Roar of Time": { bp: 150, type: "Dragon", category: "Special" },
        "Rock Climb": {
          bp: 90,
          type: "Normal",
          makesContact: true,
          category: "Physical"
        },
        "Seed Flare": { bp: 120, type: "Grass", category: "Special" },
        "Spacial Rend": { bp: 100, type: "Dragon", category: "Special" },
        "Trump Card": {
          bp: 0,
          type: "Normal",
          makesContact: true,
          category: "Special"
        },
        "Aqua Jet": {
          bp: 40,
          type: "Water",
          priority: 1,
          makesContact: true,
          category: "Physical"
        },
        "Aqua Tail": {
          bp: 90,
          type: "Water",
          makesContact: true,
          category: "Physical"
        },
        "Attack Order": { bp: 90, type: "Bug", category: "Physical" },
        Brine: { bp: 65, type: "Water", category: "Special" },
        "Bullet Punch": {
          bp: 40,
          type: "Steel",
          priority: 1,
          makesContact: true,
          isPunch: true,
          category: "Physical"
        },
        "Charge Beam": { bp: 50, type: "Electric", category: "Special" },
        "Close Combat": {
          bp: 120,
          type: "Fighting",
          makesContact: true,
          category: "Physical"
        },
        "Cross Poison": {
          bp: 70,
          type: "Poison",
          makesContact: true,
          category: "Physical"
        },
        "Dark Pulse": { bp: 80, type: "Dark", category: "Special" },
        "Defend Order": { bp: 0, type: "Bug" },
        Discharge: {
          bp: 80,
          type: "Electric",
          target: "allAdjacent",
          category: "Special"
        },
        "Earth Power": { bp: 90, type: "Ground", category: "Special" },
        "Flash Cannon": { bp: 80, type: "Steel", category: "Special" },
        "Focus Blast": { bp: 120, type: "Fighting", category: "Special" },
        "Force Palm": {
          bp: 60,
          type: "Fighting",
          makesContact: true,
          category: "Physical"
        },
        "Giga Impact": {
          bp: 150,
          type: "Normal",
          makesContact: true,
          category: "Physical"
        },
        "Guard Swap": { bp: 0, type: "Psychic" },
        "Hammer Arm": {
          bp: 100,
          type: "Fighting",
          makesContact: true,
          isPunch: true,
          category: "Physical"
        },
        "Ice Fang": {
          bp: 65,
          type: "Ice",
          makesContact: true,
          isBite: true,
          category: "Physical"
        },
        "Ice Shard": { bp: 40, type: "Ice", priority: 1, category: "Physical" },
        "Iron Head": {
          bp: 80,
          type: "Steel",
          makesContact: true,
          category: "Physical"
        },
        "Lava Plume": {
          bp: 80,
          type: "Fire",
          target: "allAdjacent",
          category: "Special"
        },
        "Nasty Plot": { bp: 0, type: "Dark" },
        "Night Slash": {
          bp: 70,
          type: "Dark",
          makesContact: true,
          category: "Physical"
        },
        "Poison Jab": {
          bp: 80,
          type: "Poison",
          makesContact: true,
          category: "Physical"
        },
        "Power Swap": { bp: 0, type: "Psychic" },
        "Power Whip": {
          bp: 120,
          type: "Grass",
          makesContact: true,
          category: "Physical"
        },
        "Psycho Cut": { bp: 70, type: "Psychic", category: "Physical" },
        "Rock Polish": { bp: 0, type: "Rock" },
        "Rock Wrecker": { bp: 150, type: "Rock", category: "Physical" },
        "Seed Bomb": { bp: 80, type: "Grass", category: "Physical" },
        "Shadow Claw": {
          bp: 70,
          type: "Ghost",
          makesContact: true,
          category: "Physical"
        },
        "Shadow Sneak": {
          bp: 40,
          type: "Ghost",
          priority: 1,
          makesContact: true,
          category: "Physical"
        },
        "Stone Edge": { bp: 100, type: "Rock", category: "Physical" },
        "Thunder Fang": {
          bp: 65,
          type: "Electric",
          makesContact: true,
          isBite: true,
          category: "Physical"
        },
        "Vacuum Wave": {
          bp: 40,
          type: "Fighting",
          priority: 1,
          category: "Special"
        },
        "X-Scissor": {
          bp: 80,
          type: "Bug",
          makesContact: true,
          category: "Physical"
        },
        "Zen Headbutt": {
          bp: 80,
          type: "Psychic",
          makesContact: true,
          category: "Physical"
        }
      };
      var DPP = (0, util_1.extend)(true, {}, ADV, DPP_PATCH);
      var BW_PATCH = {
        "Air Slash": { secondaries: true },
        Blizzard: { secondaries: true },
        "Body Slam": { secondaries: true },
        Bounce: { secondaries: true },
        Bubble: { secondaries: true },
        "Brave Bird": { recoil: [33, 100] },
        "Bug Buzz": { secondaries: true },
        Chatter: { secondaries: true },
        Covet: { bp: 60 },
        "Dragon Rush": { secondaries: true },
        "Drain Punch": { bp: 75 },
        "Energy Ball": { secondaries: true },
        Extrasensory: { secondaries: true },
        Feint: { bp: 30 },
        Detect: { priority: 4 },
        "Double-Edge": { recoil: [33, 100] },
        Protect: { priority: 4 },
        "Fire Blast": { secondaries: true },
        "Fire Spin": { bp: 35 },
        Flamethrower: { secondaries: true },
        "Fury Cutter": { bp: 20 },
        "Future Sight": { bp: 100, type: "Psychic" },
        "Giga Drain": { bp: 75 },
        "Gunk Shot": { secondaries: true },
        "Heat Wave": { secondaries: true },
        "Ice Beam": { secondaries: true },
        Lick: { secondaries: true },
        "Meteor Mash": { secondaries: true },
        "Muddy Water": { secondaries: true },
        Overheat: {},
        "Poison Fang": { secondaries: true },
        "Poison Gas": { target: "allAdjacentFoes" },
        "Rock Tomb": { secondaries: true },
        "Sand Tomb": { bp: 35 },
        "Secret Power": { secondaries: true },
        Smog: { secondaries: true },
        Snore: { secondaries: true },
        Stomp: { secondaries: true },
        Thunder: { secondaries: true },
        Thunderbolt: { secondaries: true },
        Uproar: { bp: 90 },
        Whirlpool: { bp: 35 },
        "Petal Dance": { bp: 120 },
        Tackle: { bp: 50 },
        Thrash: { bp: 120 },
        "Bone Club": { secondaries: true },
        Constrict: { secondaries: true },
        "Dizzy Punch": { secondaries: true },
        "Hyper Fang": { secondaries: true },
        "Jump Kick": { bp: 100 },
        "Luster Purge": { secondaries: true },
        "Mirror Shot": { secondaries: true },
        "Mist Ball": { secondaries: true },
        "Mud Bomb": { secondaries: true },
        "Needle Arm": { secondaries: true },
        "Ominous Wind": { secondaries: true },
        "Rock Climb": { secondaries: true },
        "Rolling Kick": { secondaries: true },
        "Sacred Fire": { secondaries: true },
        "Seed Flare": { secondaries: true },
        "Signal Beam": { secondaries: true },
        "Silver Wind": { secondaries: true },
        Twineedle: { secondaries: true },
        Acid: { secondaries: true },
        "Ancient Power": { secondaries: true },
        Astonish: { secondaries: true },
        "Aurora Beam": { secondaries: true },
        "Beat Up": { bp: 0 },
        Bite: { secondaries: true },
        "Blaze Kick": { secondaries: true },
        "Bubble Beam": { secondaries: true },
        "Bullet Seed": { bp: 25 },
        "Charge Beam": { secondaries: true },
        Confusion: { secondaries: true },
        "Cross Poison": { secondaries: true },
        Crunch: { secondaries: true },
        "Crush Claw": { secondaries: true },
        Curse: { type: "Ghost" },
        "Dark Pulse": { secondaries: true },
        Discharge: { secondaries: true },
        "Doom Desire": { bp: 140 },
        "Dragon Breath": { secondaries: true },
        "Dynamic Punch": { secondaries: true },
        "Earth Power": { secondaries: true },
        "Extreme Speed": { priority: 2 },
        Ember: { secondaries: true },
        "Fake Out": { secondaries: true, priority: 3 },
        "Fire Fang": { secondaries: true },
        "Fire Punch": { secondaries: true },
        "Flame Wheel": { secondaries: true },
        "Flare Blitz": { secondaries: true, recoil: [33, 100] },
        "Flash Cannon": { secondaries: true },
        "Focus Blast": { secondaries: true },
        "Force Palm": { secondaries: true },
        Headbutt: { secondaries: true },
        "High Jump Kick": { bp: 130 },
        "Ice Fang": { secondaries: true },
        "Ice Punch": { secondaries: true },
        "Icicle Spear": { bp: 25 },
        "Icy Wind": { secondaries: true },
        "Iron Head": { secondaries: true },
        "Iron Tail": { secondaries: true },
        "Last Resort": { bp: 140 },
        "Lava Plume": { secondaries: true },
        "Metal Claw": { secondaries: true },
        "Mud Shot": { secondaries: true },
        "Mud-Slap": { secondaries: true },
        Octazooka: { secondaries: true },
        "Paleo Wave": { secondaries: true },
        "Poison Jab": { secondaries: true },
        "Poison Sting": { secondaries: true },
        "Poison Tail": { secondaries: true },
        "Polar Flare": { secondaries: true },
        "Powder Snow": { secondaries: true },
        Psybeam: { secondaries: true },
        Psychic: { secondaries: true },
        "Rock Slide": { secondaries: true },
        "Rock Smash": { secondaries: true },
        "Shadow Ball": { secondaries: true },
        "Shadow Strike": { secondaries: true },
        "Sky Attack": { secondaries: true },
        Sludge: { secondaries: true },
        "Sludge Bomb": { secondaries: true },
        Spark: { secondaries: true },
        "Steel Wing": { secondaries: true },
        "Thunder Fang": { secondaries: true },
        "Thunder Punch": { secondaries: true },
        "Thunder Shock": { secondaries: true },
        "Tri Attack": { secondaries: true },
        Twister: { secondaries: true },
        "Volt Tackle": { secondaries: true, recoil: [33, 100] },
        "Wood Hammer": { recoil: [33, 100] },
        Waterfall: { secondaries: true },
        "Water Pulse": { secondaries: true },
        "Zap Cannon": { secondaries: true },
        "Zen Headbutt": { secondaries: true },
        Autotomize: { bp: 0, type: "Steel" },
        Bestow: { bp: 0, type: "Normal" },
        "Echoed Voice": { bp: 40, type: "Normal", isSound: true, category: "Special" },
        "Electro Ball": { bp: 0, type: "Electric", category: "Special" },
        Entrainment: { bp: 0, type: "Normal" },
        "Final Gambit": {
          bp: 0,
          type: "Fighting",
          makesContact: true,
          category: "Special"
        },
        "Fire Pledge": { bp: 50, type: "Fire", category: "Special" },
        "Frost Breath": { bp: 40, type: "Ice", willCrit: true, category: "Special" },
        "Grass Pledge": { bp: 50, type: "Grass", category: "Special" },
        "Heal Pulse": { bp: 0, type: "Psychic" },
        "Heat Crash": {
          bp: 0,
          type: "Fire",
          makesContact: true,
          category: "Physical"
        },
        Hex: { bp: 50, type: "Ghost", category: "Special" },
        "Horn Leech": {
          bp: 75,
          type: "Grass",
          drain: [1, 2],
          makesContact: true,
          category: "Physical"
        },
        Hurricane: {
          bp: 120,
          type: "Flying",
          category: "Special",
          secondaries: true
        },
        Incinerate: { bp: 30, type: "Fire", target: "allAdjacentFoes", category: "Special" },
        "Low Sweep": {
          bp: 60,
          type: "Fighting",
          makesContact: true,
          category: "Physical",
          secondaries: true
        },
        "Magic Room": { bp: 0, type: "Psychic" },
        "Quick Guard": { bp: 0, type: "Fighting", priority: 3 },
        "Rage Powder": { bp: 0, type: "Bug", priority: 3 },
        "Relic Song": {
          bp: 75,
          type: "Normal",
          isSound: true,
          target: "allAdjacentFoes",
          category: "Special",
          secondaries: true
        },
        Round: { bp: 60, type: "Normal", isSound: true, category: "Special" },
        "Sacred Sword": {
          bp: 90,
          type: "Fighting",
          makesContact: true,
          category: "Physical",
          ignoreDefensive: true
        },
        Scald: {
          bp: 80,
          type: "Water",
          category: "Special",
          secondaries: true
        },
        "Simple Beam": { bp: 0, type: "Normal" },
        "Sky Drop": {
          bp: 60,
          type: "Flying",
          makesContact: true,
          category: "Physical"
        },
        Snarl: {
          bp: 55,
          type: "Dark",
          isSound: true,
          target: "allAdjacentFoes",
          category: "Special",
          secondaries: true
        },
        Soak: { bp: 0, type: "Water" },
        Steamroller: {
          bp: 65,
          type: "Bug",
          makesContact: true,
          category: "Physical",
          secondaries: true
        },
        "Storm Throw": {
          bp: 40,
          type: "Fighting",
          willCrit: true,
          makesContact: true,
          category: "Physical"
        },
        "Struggle Bug": {
          bp: 30,
          type: "Bug",
          target: "allAdjacentFoes",
          category: "Special",
          secondaries: true
        },
        Synchronoise: {
          bp: 70,
          type: "Psychic",
          target: "allAdjacent",
          category: "Special"
        },
        "Techno Blast": { bp: 85, type: "Normal", category: "Special" },
        Telekinesis: { bp: 0, type: "Psychic" },
        "Water Pledge": { bp: 50, type: "Water", category: "Special" },
        "Wide Guard": { bp: 0, type: "Rock", priority: 3 },
        "Wonder Room": { bp: 0, type: "Psychic" },
        "Ally Switch": { bp: 0, type: "Psychic", priority: 1 },
        "Flame Burst": { bp: 70, type: "Fire", category: "Special" },
        "Heavy Slam": {
          bp: 0,
          type: "Steel",
          makesContact: true,
          category: "Physical"
        },
        "Reflect Type": { bp: 0, type: "Normal" },
        "Volt Switch": { bp: 70, type: "Electric", category: "Special" },
        "Chip Away": {
          bp: 70,
          type: "Normal",
          makesContact: true,
          category: "Physical",
          ignoreDefensive: true
        },
        "Fiery Dance": {
          bp: 80,
          type: "Fire",
          category: "Special",
          secondaries: true
        },
        "Head Charge": {
          bp: 120,
          type: "Normal",
          recoil: [1, 4],
          makesContact: true,
          category: "Physical"
        },
        "Heart Stamp": {
          bp: 60,
          type: "Psychic",
          makesContact: true,
          category: "Physical",
          secondaries: true
        },
        Quash: { bp: 0, type: "Dark" },
        "Searing Shot": {
          bp: 100,
          type: "Fire",
          target: "allAdjacent",
          category: "Special",
          secondaries: true
        },
        "Acid Spray": {
          bp: 40,
          type: "Poison",
          category: "Special",
          secondaries: true
        },
        Acrobatics: {
          bp: 55,
          type: "Flying",
          makesContact: true,
          category: "Physical"
        },
        "After You": { bp: 0, type: "Normal" },
        "Blue Flare": {
          bp: 130,
          type: "Fire",
          category: "Special",
          secondaries: true
        },
        "Bolt Strike": {
          bp: 130,
          type: "Electric",
          makesContact: true,
          category: "Physical",
          secondaries: true
        },
        Bulldoze: {
          bp: 60,
          type: "Ground",
          target: "allAdjacent",
          category: "Physical",
          secondaries: true
        },
        "Circle Throw": {
          bp: 60,
          type: "Fighting",
          makesContact: true,
          category: "Physical"
        },
        "Clear Smog": { bp: 50, type: "Poison", category: "Special" },
        Coil: { bp: 0, type: "Poison" },
        "Cotton Guard": { bp: 0, type: "Grass" },
        "Dragon Tail": {
          bp: 60,
          type: "Dragon",
          makesContact: true,
          category: "Physical"
        },
        "Drill Run": {
          bp: 80,
          type: "Ground",
          makesContact: true,
          category: "Physical"
        },
        "Dual Chop": {
          bp: 40,
          type: "Dragon",
          multihit: 2,
          makesContact: true,
          category: "Physical"
        },
        Electroweb: {
          bp: 55,
          type: "Electric",
          target: "allAdjacentFoes",
          category: "Special",
          secondaries: true
        },
        "Flame Charge": {
          bp: 50,
          type: "Fire",
          makesContact: true,
          category: "Physical",
          secondaries: true
        },
        "Foul Play": {
          bp: 95,
          type: "Dark",
          makesContact: true,
          category: "Physical",
          overrideOffensivePokemon: "target"
        },
        "Freeze Shock": {
          bp: 140,
          type: "Ice",
          category: "Physical",
          secondaries: true
        },
        "Fusion Bolt": { bp: 100, type: "Electric", category: "Physical" },
        "Fusion Flare": { bp: 100, type: "Fire", category: "Special" },
        "Gear Grind": {
          bp: 50,
          type: "Steel",
          multihit: 2,
          makesContact: true,
          category: "Physical"
        },
        Glaciate: {
          bp: 65,
          type: "Ice",
          target: "allAdjacentFoes",
          category: "Special",
          secondaries: true
        },
        "Guard Split": { bp: 0, type: "Psychic" },
        "Hone Claws": { bp: 0, type: "Dark" },
        "Ice Burn": {
          bp: 140,
          type: "Ice",
          category: "Special",
          secondaries: true
        },
        "Icicle Crash": {
          bp: 85,
          type: "Ice",
          category: "Physical",
          secondaries: true
        },
        Inferno: {
          bp: 100,
          type: "Fire",
          category: "Special",
          secondaries: true
        },
        "Leaf Tornado": {
          bp: 65,
          type: "Grass",
          category: "Special",
          secondaries: true
        },
        "Night Daze": {
          bp: 85,
          type: "Dark",
          category: "Special",
          secondaries: true
        },
        "Power Split": { bp: 0, type: "Psychic" },
        Psyshock: {
          bp: 80,
          type: "Psychic",
          category: "Special",
          overrideDefensiveStat: "def"
        },
        Psystrike: {
          bp: 100,
          type: "Psychic",
          category: "Special",
          overrideDefensiveStat: "def"
        },
        "Quiver Dance": { bp: 0, type: "Bug" },
        "Razor Shell": {
          bp: 75,
          type: "Water",
          makesContact: true,
          category: "Physical",
          secondaries: true
        },
        Retaliate: {
          bp: 70,
          type: "Normal",
          makesContact: true,
          category: "Physical"
        },
        "Secret Sword": {
          bp: 85,
          type: "Fighting",
          category: "Special",
          overrideDefensiveStat: "def"
        },
        "Shell Smash": { bp: 0, type: "Normal" },
        "Shift Gear": { bp: 0, type: "Steel" },
        "Sludge Wave": {
          bp: 95,
          type: "Poison",
          target: "allAdjacent",
          category: "Special",
          secondaries: true
        },
        "Smack Down": { bp: 50, type: "Rock", category: "Physical" },
        "Stored Power": { bp: 20, type: "Psychic", category: "Special" },
        "Tail Slap": {
          bp: 25,
          type: "Normal",
          multihit: [2, 5],
          makesContact: true,
          category: "Physical"
        },
        "V-create": {
          bp: 180,
          type: "Fire",
          makesContact: true,
          category: "Physical"
        },
        Venoshock: { bp: 65, type: "Poison", category: "Special" },
        "Wild Charge": {
          bp: 90,
          type: "Electric",
          recoil: [1, 4],
          makesContact: true,
          category: "Physical"
        },
        "Work Up": { bp: 0, type: "Normal" }
      };
      var BW = (0, util_1.extend)(true, {}, DPP, BW_PATCH);
      delete BW["Faint Attack"];
      var XY_PATCH = {
        "Ice Ball": { isBullet: true },
        "Knock Off": { bp: 65 },
        Thief: { bp: 60 },
        Barrage: { isBullet: true },
        Bubble: { bp: 40 },
        Chatter: { bp: 65 },
        "Egg Bomb": { isBullet: true },
        "Follow Me": { priority: 2 },
        Hurricane: { bp: 110 },
        "Hidden Power": { bp: 60 },
        "Hidden Power Bug": { bp: 60 },
        "Hidden Power Dark": { bp: 60 },
        "Hidden Power Dragon": { bp: 60 },
        "Hidden Power Electric": { bp: 60 },
        "Hidden Power Fighting": { bp: 60 },
        "Hidden Power Fire": { bp: 60 },
        "Hidden Power Flying": { bp: 60 },
        "Hidden Power Ghost": { bp: 60 },
        "Hidden Power Grass": { bp: 60 },
        "Hidden Power Ground": { bp: 60 },
        "Hidden Power Ice": { bp: 60 },
        "Hidden Power Poison": { bp: 60 },
        "Hidden Power Psychic": { bp: 60 },
        "Hidden Power Rock": { bp: 60 },
        "Hidden Power Steel": { bp: 60 },
        "Hidden Power Water": { bp: 60 },
        "Magma Storm": { bp: 100 },
        "Magnet Bomb": { isBullet: true },
        "Mist Ball": { isBullet: true },
        Moonlight: { type: "Fairy" },
        "Mud Bomb": { isBullet: true },
        "Searing Shot": { isBullet: true },
        "Smelling Salts": { bp: 70 },
        Synchronoise: { bp: 120 },
        "Techno Blast": { bp: 120 },
        Thunder: { bp: 110 },
        "Wake-Up Slap": { bp: 70 },
        "Acid Spray": { isBullet: true },
        "Air Cutter": { bp: 60 },
        "Ancient Power": {},
        Assurance: { bp: 60 },
        "Aura Sphere": { bp: 80, isBullet: true, isPulse: true },
        Blizzard: { bp: 110 },
        "Bullet Seed": { isBullet: true },
        Charm: { type: "Fairy" },
        "Cotton Spore": { target: "allAdjacentFoes" },
        Crabhammer: { bp: 100 },
        "Dark Pulse": { isPulse: true },
        "Draco Meteor": { bp: 130 },
        "Dragon Pulse": { bp: 85, isPulse: true },
        "Electro Ball": { isBullet: true },
        "Energy Ball": { bp: 90, isBullet: true },
        "Final Gambit": { makesContact: false },
        "Fire Blast": { bp: 110 },
        "Fire Pledge": { bp: 80 },
        Flamethrower: { bp: 90 },
        "Focus Blast": { isBullet: true },
        "Frost Breath": { bp: 60 },
        "Fury Cutter": { bp: 40 },
        "Future Sight": { bp: 120 },
        "Grass Pledge": { bp: 80 },
        "Gyro Ball": { isBullet: true },
        "Heal Pulse": { isPulse: true },
        "Heat Wave": { bp: 95 },
        Hex: { bp: 65 },
        "Hydro Pump": { bp: 110 },
        "Ice Beam": { bp: 90 },
        Incinerate: { bp: 60 },
        "Leaf Storm": { bp: 130 },
        Lick: { bp: 30 },
        "Low Sweep": { bp: 65 },
        "Meteor Mash": { bp: 90 },
        "Muddy Water": { bp: 90 },
        Octazooka: { isBullet: true },
        Overheat: { bp: 130 },
        "Pin Missile": { bp: 25 },
        "Power Gem": { bp: 80 },
        "Rage Powder": { priority: 2 },
        "Rock Tomb": { bp: 60 },
        "Rock Wrecker": { isBullet: true },
        "Seed Bomb": { isBullet: true },
        "Shadow Ball": { isBullet: true },
        "Skull Bash": { bp: 130 },
        "Sludge Bomb": { isBullet: true },
        Smog: { bp: 30 },
        Snore: { bp: 50 },
        "Storm Throw": { bp: 60 },
        "Struggle Bug": { bp: 50 },
        Surf: { bp: 90 },
        "Sweet Kiss": { type: "Fairy" },
        Thunderbolt: { bp: 90 },
        "Vine Whip": { bp: 45 },
        "Water Pledge": { bp: 80 },
        "Water Pulse": { isPulse: true },
        "Weather Ball": { isBullet: true },
        "Zap Cannon": { isBullet: true },
        "Diamond Storm": {
          bp: 100,
          type: "Rock",
          target: "allAdjacentFoes",
          category: "Physical",
          secondaries: true
        },
        "Fell Stinger": {
          bp: 30,
          type: "Bug",
          makesContact: true,
          category: "Physical"
        },
        "Flying Press": {
          bp: 80,
          type: "Fighting",
          makesContact: true,
          category: "Physical"
        },
        "Hyperspace Fury": {
          bp: 100,
          type: "Dark",
          breaksProtect: true,
          category: "Physical"
        },
        "Hyperspace Hole": {
          bp: 80,
          type: "Psychic",
          breaksProtect: true,
          category: "Special"
        },
        "King's Shield": { bp: 0, type: "Steel", priority: 4 },
        "Misty Terrain": { bp: 0, type: "Fairy" },
        "Mystical Fire": {
          bp: 65,
          type: "Fire",
          category: "Special",
          secondaries: true
        },
        "Parabolic Charge": {
          bp: 50,
          type: "Electric",
          drain: [1, 2],
          target: "allAdjacent",
          category: "Special"
        },
        "Parting Shot": { bp: 0, type: "Dark", isSound: true },
        "Phantom Force": {
          bp: 90,
          type: "Ghost",
          breaksProtect: true,
          makesContact: true,
          category: "Physical"
        },
        Powder: { bp: 0, type: "Bug", priority: 1 },
        "Spiky Shield": { bp: 0, type: "Grass", priority: 4 },
        "Thousand Arrows": { bp: 90, type: "Ground", target: "allAdjacentFoes", category: "Physical" },
        "Thousand Waves": { bp: 90, type: "Ground", target: "allAdjacentFoes", category: "Physical" },
        "Water Shuriken": {
          bp: 15,
          type: "Water",
          multihit: [2, 5],
          priority: 1,
          category: "Physical"
        },
        "Dragon Ascent": {
          bp: 120,
          type: "Flying",
          makesContact: true,
          category: "Physical"
        },
        "Electric Terrain": { bp: 0, type: "Electric" },
        Geomancy: { bp: 0, type: "Fairy" },
        "Grassy Terrain": { bp: 0, type: "Grass" },
        "Ion Deluge": { bp: 0, type: "Electric", priority: 1 },
        "Land's Wrath": { bp: 90, type: "Ground", target: "allAdjacentFoes", category: "Physical" },
        "Light of Ruin": { bp: 140, type: "Fairy", recoil: [1, 2], category: "Special" },
        "Oblivion Wing": {
          bp: 80,
          type: "Flying",
          drain: [3, 4],
          category: "Special"
        },
        "Origin Pulse": {
          bp: 110,
          type: "Water",
          target: "allAdjacentFoes",
          category: "Special",
          isPulse: true
        },
        "Precipice Blades": {
          bp: 120,
          type: "Ground",
          target: "allAdjacentFoes",
          category: "Physical"
        },
        Rototiller: { bp: 0, type: "Ground" },
        "Steam Eruption": {
          bp: 110,
          type: "Water",
          category: "Special",
          secondaries: true
        },
        "Aromatic Mist": { bp: 0, type: "Fairy" },
        "Baby-Doll Eyes": { bp: 0, type: "Fairy", priority: 1 },
        Belch: { bp: 120, type: "Poison", category: "Special" },
        Boomburst: {
          bp: 140,
          type: "Normal",
          isSound: true,
          target: "allAdjacent",
          category: "Special"
        },
        Celebrate: { bp: 0, type: "Normal" },
        Confide: { bp: 0, type: "Normal", isSound: true },
        "Crafty Shield": { bp: 0, type: "Fairy", priority: 3 },
        "Dazzling Gleam": { bp: 80, type: "Fairy", target: "allAdjacentFoes", category: "Special" },
        "Disarming Voice": {
          bp: 40,
          type: "Fairy",
          isSound: true,
          target: "allAdjacentFoes",
          category: "Special"
        },
        "Draining Kiss": {
          bp: 50,
          type: "Fairy",
          drain: [3, 4],
          makesContact: true,
          category: "Special"
        },
        "Eerie Impulse": { bp: 0, type: "Electric" },
        Electrify: { bp: 0, type: "Electric" },
        "Fairy Lock": { bp: 0, type: "Fairy" },
        "Fairy Wind": { bp: 40, type: "Fairy", category: "Special" },
        "Flower Shield": { bp: 0, type: "Fairy" },
        "Forest's Curse": { bp: 0, type: "Grass" },
        "Freeze-Dry": {
          bp: 70,
          type: "Ice",
          category: "Special",
          secondaries: true
        },
        "Happy Hour": { bp: 0, type: "Normal" },
        "Hold Back": {
          bp: 40,
          type: "Normal",
          makesContact: true,
          category: "Physical"
        },
        "Hold Hands": { bp: 0, type: "Normal" },
        Infestation: { bp: 20, type: "Bug", makesContact: true, category: "Special" },
        "Magnetic Flux": { bp: 0, type: "Electric" },
        "Mat Block": { bp: 0, type: "Fighting" },
        Moonblast: {
          bp: 95,
          type: "Fairy",
          category: "Special",
          secondaries: true
        },
        "Noble Roar": { bp: 0, type: "Normal", isSound: true },
        Nuzzle: {
          bp: 20,
          type: "Electric",
          makesContact: true,
          category: "Physical",
          secondaries: true
        },
        "Petal Blizzard": {
          bp: 90,
          type: "Grass",
          target: "allAdjacent",
          category: "Physical"
        },
        "Play Nice": { bp: 0, type: "Normal" },
        "Play Rough": {
          bp: 90,
          type: "Fairy",
          makesContact: true,
          category: "Physical",
          secondaries: true
        },
        "Power-Up Punch": {
          bp: 40,
          type: "Fighting",
          makesContact: true,
          isPunch: true,
          category: "Physical",
          secondaries: true
        },
        "Sticky Web": { bp: 0, type: "Bug" },
        "Topsy-Turvy": { bp: 0, type: "Dark" },
        "Trick-or-Treat": { bp: 0, type: "Ghost" },
        "Venom Drench": { bp: 0, type: "Poison", target: "allAdjacentFoes" }
      };
      var XY = (0, util_1.extend)(true, {}, BW, XY_PATCH);
      var SM_PATCH = {
        "Ally Switch": { priority: 2 },
        Aeroblast: { zp: 180 },
        Barrage: { zp: 100 },
        Bide: { zp: 100 },
        "Bone Club": { zp: 120 },
        Bonemerang: { zp: 100 },
        Bubble: { zp: 100 },
        Chatter: { zp: 120 },
        "Chip Away": { zp: 140 },
        Clamp: { zp: 100 },
        "Comet Punch": { zp: 100 },
        Constrict: { zp: 100 },
        "Crush Grip": { zp: 190 },
        "Diamond Storm": { zp: 180 },
        "Dizzy Punch": { zp: 140 },
        "Double Slap": { zp: 100 },
        "Dragon Ascent": { zp: 190 },
        "Dragon Rage": { zp: 100 },
        "Egg Bomb": { zp: 180 },
        "Feint Attack": { zp: 120 },
        "Fiery Dance": { zp: 160 },
        "Flame Burst": { zp: 140 },
        Frustration: { zp: 160 },
        "Grass Knot": { zp: 160 },
        "Head Charge": { zp: 190 },
        "Heart Stamp": { zp: 120 },
        "Heat Crash": { zp: 160 },
        "Heavy Slam": { zp: 160 },
        Hurricane: { zp: 185 },
        "Hidden Power": { zp: 120 },
        "Hidden Power Bug": { zp: 120 },
        "Hidden Power Dark": { zp: 120 },
        "Hidden Power Dragon": { zp: 120 },
        "Hidden Power Electric": { zp: 120 },
        "Hidden Power Fighting": { zp: 120 },
        "Hidden Power Fire": { zp: 120 },
        "Hidden Power Flying": { zp: 120 },
        "Hidden Power Ghost": { zp: 120 },
        "Hidden Power Grass": { zp: 120 },
        "Hidden Power Ground": { zp: 120 },
        "Hidden Power Ice": { zp: 120 },
        "Hidden Power Poison": { zp: 120 },
        "Hidden Power Psychic": { zp: 120 },
        "Hidden Power Rock": { zp: 120 },
        "Hidden Power Steel": { zp: 120 },
        "Hidden Power Water": { zp: 120 },
        "Hyper Fang": { zp: 160 },
        "Hyperspace Fury": { zp: 180 },
        "Hyperspace Hole": { zp: 160 },
        "Ice Ball": { zp: 100 },
        Judgment: { zp: 180 },
        "Jump Kick": { zp: 180 },
        "Karate Chop": { zp: 100 },
        "Knock Off": { zp: 120 },
        "Land's Wrath": { zp: 185 },
        "Light of Ruin": { zp: 200 },
        "Low Kick": { zp: 160 },
        "Luster Purge": { zp: 140 },
        "Magma Storm": { zp: 180 },
        "Magnet Bomb": { zp: 120 },
        Magnitude: { zp: 140 },
        "Mirror Shot": { zp: 120 },
        "Mist Ball": { zp: 140 },
        "Mud Bomb": { zp: 120 },
        "Natural Gift": { zp: 160 },
        "Needle Arm": { zp: 120 },
        "Oblivion Wing": { zp: 160 },
        "Ominous Wind": { zp: 120 },
        "Origin Pulse": { zp: 185 },
        "Precipice Blades": { zp: 190 },
        "Psycho Boost": { zp: 200 },
        Psywave: { zp: 100 },
        Punishment: { zp: 160 },
        Pursuit: { zp: 100 },
        Rage: { zp: 100 },
        "Rapid Spin": { zp: 100 },
        "Razor Wind": { zp: 160 },
        "Relic Song": { zp: 140 },
        Return: { zp: 160 },
        "Roar of Time": { zp: 200 },
        "Rock Climb": { zp: 175 },
        "Rolling Kick": { zp: 120 },
        "Sacred Fire": { zp: 180 },
        "Searing Shot": { zp: 180 },
        "Secret Power": { zp: 140 },
        "Seed Flare": { zp: 190 },
        "Shadow Force": { zp: 190 },
        "Signal Beam": { zp: 140 },
        "Silver Wind": { zp: 120 },
        "Sky Drop": { zp: 120 },
        "Sky Uppercut": { zp: 160 },
        "Smelling Salts": { zp: 140 },
        "Solar Beam": { zp: 190 },
        "Sonic Boom": { zp: 100 },
        "Spacial Rend": { zp: 180 },
        "Spike Cannon": { zp: 120 },
        "Steam Eruption": { zp: 185 },
        Steamroller: { zp: 120 },
        Synchronoise: { zp: 190 },
        "Techno Blast": { zp: 190 },
        "Thousand Arrows": { zp: 180 },
        "Thousand Waves": { zp: 175 },
        "Trump Card": { zp: 160 },
        Thunder: { zp: 185 },
        Twineedle: { zp: 100 },
        "Wake-Up Slap": { zp: 140 },
        "Wring Out": { zp: 190 },
        Absorb: { zp: 100 },
        Acid: { zp: 100 },
        "Acid Spray": { zp: 100 },
        Acrobatics: { zp: 100 },
        "Aerial Ace": { zp: 120 },
        "Air Cutter": { zp: 120 },
        "Air Slash": { zp: 140 },
        "Ancient Power": { zp: 120 },
        "Aqua Jet": { zp: 100 },
        "Aqua Tail": { zp: 175 },
        "Arm Thrust": { zp: 100 },
        Assurance: { zp: 120 },
        Astonish: { zp: 100 },
        "Attack Order": { zp: 175 },
        "Aura Sphere": { zp: 160 },
        "Aurora Beam": { zp: 120 },
        Avalanche: { zp: 120 },
        "Beat Up": { zp: 100 },
        Belch: { zp: 190 },
        Bind: { zp: 100 },
        Bite: { zp: 120 },
        "Blast Burn": { zp: 200 },
        "Blaze Kick": { zp: 160 },
        Blizzard: { zp: 185 },
        "Blue Flare": { zp: 195 },
        "Body Slam": { zp: 160 },
        "Bolt Strike": { zp: 195 },
        "Bone Rush": { zp: 140 },
        Boomburst: { zp: 200 },
        Bounce: { zp: 160 },
        "Brave Bird": { zp: 190 },
        "Brick Break": { zp: 140 },
        Brine: { zp: 120 },
        "Bubble Beam": { zp: 120 },
        "Bug Bite": { zp: 120 },
        "Bug Buzz": { zp: 175 },
        Bulldoze: { zp: 120 },
        "Bullet Punch": { zp: 100 },
        "Bullet Seed": { zp: 140 },
        "Charge Beam": { zp: 100 },
        "Circle Throw": { zp: 120 },
        "Clear Smog": { zp: 100 },
        "Close Combat": { zp: 190 },
        Confusion: { zp: 100 },
        Counter: { zp: 100 },
        Covet: { zp: 120 },
        Crabhammer: { zp: 180 },
        "Cross Chop": { zp: 180 },
        "Cross Poison": { zp: 140 },
        Crunch: { zp: 160 },
        "Crush Claw": { zp: 140 },
        Cut: { zp: 100 },
        "Dark Pulse": { zp: 160 },
        "Dazzling Gleam": { zp: 160 },
        Dig: { zp: 160 },
        "Disarming Voice": { zp: 100 },
        Discharge: { zp: 160 },
        Dive: { zp: 160 },
        "Doom Desire": { zp: 200 },
        "Double-Edge": { zp: 190 },
        "Double Hit": { zp: 140 },
        "Double Kick": { zp: 100 },
        "Draco Meteor": { zp: 195 },
        "Dragon Breath": { zp: 120 },
        "Dragon Claw": { zp: 160 },
        "Dragon Pulse": { zp: 160 },
        "Dragon Rush": { zp: 180 },
        "Dragon Tail": { zp: 120 },
        "Draining Kiss": { zp: 100 },
        "Drain Punch": { zp: 140 },
        "Dream Eater": { zp: 180 },
        "Drill Peck": { zp: 160 },
        "Drill Run": { zp: 160 },
        "Dual Chop": { zp: 100 },
        "Dynamic Punch": { zp: 180 },
        "Earth Power": { zp: 175 },
        Earthquake: { zp: 180 },
        "Echoed Voice": { zp: 100 },
        "Electro Ball": { zp: 160 },
        Electroweb: { zp: 100 },
        Ember: { zp: 100 },
        Endeavor: { zp: 160 },
        "Energy Ball": { zp: 175 },
        Eruption: { zp: 200 },
        Explosion: { zp: 200 },
        Extrasensory: { zp: 160 },
        "Extreme Speed": { zp: 160 },
        Facade: { zp: 140 },
        "Fairy Wind": { zp: 100 },
        "Fake Out": { zp: 100 },
        "False Swipe": { zp: 100 },
        Feint: { zp: 100 },
        "Fell Stinger": { bp: 50, zp: 100 },
        "Final Gambit": { zp: 180 },
        "Fire Blast": { zp: 185 },
        "Fire Fang": { zp: 120 },
        "Fire Pledge": { zp: 160 },
        "Fire Punch": { zp: 140 },
        "Fire Spin": { zp: 100 },
        Fissure: { zp: 180 },
        Flail: { zp: 160 },
        "Flame Charge": { zp: 100 },
        "Flame Wheel": { zp: 120 },
        Flamethrower: { zp: 175 },
        "Flare Blitz": { zp: 190 },
        "Flash Cannon": { zp: 160 },
        Fling: { zp: 100 },
        Fly: { zp: 175 },
        "Flying Press": { bp: 100, zp: 170 },
        "Focus Blast": { zp: 190 },
        "Focus Punch": { zp: 200 },
        "Force Palm": { zp: 120 },
        "Foul Play": { zp: 175 },
        "Freeze-Dry": { zp: 140 },
        "Freeze Shock": { zp: 200 },
        "Frenzy Plant": { zp: 200 },
        "Frost Breath": { zp: 120 },
        "Fury Attack": { zp: 100 },
        "Fury Cutter": { zp: 100 },
        "Fury Swipes": { zp: 100 },
        "Fusion Bolt": { zp: 180 },
        "Fusion Flare": { zp: 180 },
        "Future Sight": { zp: 190 },
        "Gear Grind": { zp: 180 },
        "Giga Drain": { zp: 140 },
        "Giga Impact": { zp: 200 },
        Glaciate: { zp: 120 },
        "Grass Pledge": { zp: 160 },
        Guillotine: { zp: 180 },
        "Gunk Shot": { zp: 190 },
        Gust: { zp: 100 },
        "Gyro Ball": { zp: 160 },
        "Hammer Arm": { zp: 180 },
        Headbutt: { zp: 140 },
        "Head Smash": { zp: 200 },
        "Heat Wave": { zp: 175 },
        Hex: { zp: 160 },
        "High Jump Kick": { zp: 195 },
        "Hold Back": { zp: 100 },
        "Horn Attack": { zp: 120 },
        "Horn Drill": { zp: 180 },
        "Horn Leech": { zp: 140 },
        "Hydro Cannon": { zp: 200 },
        "Hydro Pump": { zp: 185 },
        "Hyper Beam": { zp: 200 },
        "Hyper Voice": { zp: 175 },
        "Ice Beam": { zp: 175 },
        "Ice Burn": { zp: 200 },
        "Ice Fang": { zp: 120 },
        "Ice Punch": { zp: 140 },
        "Ice Shard": { zp: 100 },
        "Icicle Crash": { zp: 160 },
        "Icicle Spear": { zp: 140 },
        "Icy Wind": { zp: 100 },
        Incinerate: { zp: 120 },
        Inferno: { zp: 180 },
        Infestation: { zp: 100 },
        "Iron Head": { zp: 160 },
        "Iron Tail": { zp: 180 },
        "Last Resort": { zp: 200 },
        "Lava Plume": { zp: 160 },
        "Leaf Blade": { zp: 175 },
        "Leaf Storm": { zp: 195 },
        "Leaf Tornado": { zp: 120 },
        "Leech Life": { bp: 80, zp: 160 },
        Lick: { zp: 100 },
        "Low Sweep": { zp: 120 },
        "Mach Punch": { zp: 100 },
        "Magical Leaf": { zp: 120 },
        "Mega Drain": { zp: 120 },
        Megahorn: { zp: 190 },
        "Mega Kick": { zp: 190 },
        "Mega Punch": { zp: 160 },
        "Metal Burst": { zp: 100 },
        "Metal Claw": { zp: 100 },
        "Meteor Mash": { zp: 175 },
        "Mirror Coat": { zp: 100 },
        Moonblast: { zp: 175 },
        "Mud Shot": { zp: 100 },
        "Mud-Slap": { zp: 100 },
        "Muddy Water": { zp: 175 },
        "Mystical Fire": { bp: 75, zp: 140 },
        "Night Daze": { zp: 160 },
        "Night Shade": { zp: 100 },
        "Night Slash": { zp: 140 },
        Nuzzle: { zp: 100 },
        Octazooka: { zp: 120 },
        Outrage: { zp: 190 },
        Overheat: { zp: 195 },
        "Paleo Wave": { zp: 160 },
        "Parabolic Charge": { bp: 65, zp: 120 },
        Payback: { zp: 100 },
        "Pay Day": { zp: 100 },
        Peck: { zp: 100 },
        "Petal Blizzard": { zp: 175 },
        "Petal Dance": { zp: 190 },
        "Phantom Force": { zp: 175 },
        "Pin Missile": { zp: 140 },
        "Play Rough": { zp: 175 },
        Pluck: { zp: 120 },
        "Poison Fang": { zp: 100 },
        "Poison Jab": { zp: 160 },
        "Poison Sting": { zp: 100 },
        "Poison Tail": { zp: 100 },
        "Polar Flare": { zp: 140 },
        Pound: { zp: 100 },
        "Powder Snow": { zp: 100 },
        "Power Gem": { zp: 160 },
        "Power-Up Punch": { zp: 100 },
        "Power Whip": { zp: 190 },
        Present: { zp: 100 },
        Psybeam: { zp: 120 },
        Psychic: { zp: 175 },
        "Psycho Cut": { zp: 140 },
        Psyshock: { zp: 160 },
        Psystrike: { zp: 180 },
        "Quick Attack": { zp: 100 },
        "Razor Leaf": { zp: 100 },
        "Razor Shell": { zp: 140 },
        Retaliate: { zp: 140 },
        Revenge: { zp: 120 },
        Reversal: { zp: 160 },
        "Rock Blast": { isBullet: true, zp: 140 },
        "Rock Slide": { zp: 140 },
        "Rock Smash": { zp: 100 },
        "Rock Throw": { zp: 100 },
        "Rock Tomb": { zp: 120 },
        "Rock Wrecker": { zp: 200 },
        Rollout: { zp: 100 },
        Round: { zp: 120 },
        "Sacred Sword": { zp: 175 },
        "Sand Tomb": { zp: 100 },
        Scald: { zp: 160 },
        Scratch: { zp: 100 },
        "Secret Sword": { zp: 160 },
        "Seed Bomb": { zp: 160 },
        "Seismic Toss": { zp: 100 },
        "Self-Destruct": { zp: 200 },
        "Shadow Ball": { zp: 160 },
        "Shadow Claw": { zp: 140 },
        "Shadow Punch": { zp: 120 },
        "Shadow Sneak": { zp: 100 },
        "Shadow Strike": { zp: 160 },
        "Sheer Cold": { zp: 180 },
        "Shock Wave": { zp: 120 },
        "Skull Bash": { zp: 195 },
        "Sky Attack": { zp: 200 },
        Slam: { zp: 160 },
        Slash: { zp: 140 },
        Sludge: { zp: 120 },
        "Sludge Bomb": { zp: 175 },
        "Sludge Wave": { zp: 175 },
        "Smack Down": { zp: 100 },
        Smog: { zp: 100 },
        Snarl: { zp: 100 },
        Snore: { zp: 100 },
        Spark: { zp: 120 },
        "Spit Up": { zp: 100 },
        "Steel Wing": { zp: 140 },
        Stomp: { zp: 120 },
        "Stone Edge": { zp: 180 },
        "Stored Power": { zp: 160 },
        "Storm Throw": { zp: 120 },
        Strength: { zp: 160 },
        "Struggle Bug": { zp: 100 },
        Submission: { zp: 160 },
        "Sucker Punch": { bp: 70, zp: 140 },
        "Super Fang": { zp: 100 },
        Superpower: { zp: 190 },
        Surf: { zp: 175 },
        Swift: { zp: 120 },
        Tackle: { bp: 40, zp: 100 },
        "Tail Slap": { zp: 140 },
        "Take Down": { zp: 175 },
        Thief: { zp: 120 },
        Thrash: { zp: 190 },
        Thunderbolt: { zp: 175 },
        "Thunder Fang": { zp: 120 },
        "Thunder Punch": { zp: 140 },
        "Thunder Shock": { zp: 100 },
        "Tri Attack": { zp: 160 },
        "Triple Kick": { zp: 120 },
        Twister: { zp: 100 },
        "U-turn": { zp: 140 },
        Uproar: { zp: 175 },
        "Vacuum Wave": { zp: 100 },
        "V-create": { zp: 220 },
        Venoshock: { zp: 120 },
        "Vine Whip": { zp: 100 },
        "Vise Grip": { zp: 100 },
        "Vital Throw": { zp: 140 },
        "Volt Switch": { zp: 140 },
        "Volt Tackle": { zp: 190 },
        Waterfall: { zp: 160 },
        "Water Gun": { zp: 100 },
        "Water Pledge": { zp: 160 },
        "Water Pulse": { zp: 120 },
        "Water Shuriken": { category: "Special", zp: 100 },
        "Water Spout": { zp: 200 },
        "Weather Ball": { zp: 160 },
        Whirlpool: { zp: 100 },
        "Wild Charge": { zp: 175 },
        "Wing Attack": { zp: 120 },
        "Wood Hammer": { zp: 190 },
        Wrap: { zp: 100 },
        "X-Scissor": { zp: 160 },
        "Zap Cannon": { zp: 190 },
        "Zen Headbutt": { zp: 160 },
        "10,000,000 Volt Thunderbolt": { bp: 195, type: "Electric", category: "Special", isZ: true },
        "Acid Downpour": { bp: 1, type: "Poison", category: "Physical", isZ: true },
        "All-Out Pummeling": { bp: 1, type: "Fighting", category: "Physical", isZ: true },
        "Baddy Bad": { bp: 90, type: "Dark", category: "Special", zp: 175 },
        "Baneful Bunker": { bp: 0, type: "Poison", priority: 4 },
        "Beak Blast": {
          bp: 100,
          type: "Flying",
          category: "Physical",
          isBullet: true,
          zp: 180
        },
        "Black Hole Eclipse": { bp: 1, type: "Dark", category: "Physical", isZ: true },
        "Bloom Doom": { bp: 1, type: "Grass", category: "Physical", isZ: true },
        "Bouncy Bubble": {
          bp: 90,
          type: "Water",
          drain: [1, 2],
          category: "Special",
          zp: 175
        },
        "Breakneck Blitz": { bp: 1, type: "Normal", category: "Physical", isZ: true },
        "Buzzy Buzz": {
          bp: 90,
          type: "Electric",
          category: "Special",
          secondaries: true,
          zp: 175
        },
        Catastropika: {
          bp: 210,
          type: "Electric",
          makesContact: true,
          category: "Physical",
          isZ: true
        },
        "Clangorous Soulblaze": {
          bp: 185,
          type: "Dragon",
          isSound: true,
          target: "allAdjacentFoes",
          category: "Special",
          secondaries: true,
          isZ: true
        },
        "Continental Crush": { bp: 1, type: "Rock", category: "Physical", isZ: true },
        "Core Enforcer": {
          bp: 100,
          type: "Dragon",
          target: "allAdjacentFoes",
          category: "Special",
          zp: 140
        },
        "Corkscrew Crash": { bp: 1, type: "Steel", category: "Physical", isZ: true },
        "Devastating Drake": { bp: 1, type: "Dragon", category: "Physical", isZ: true },
        "Double Iron Bash": {
          bp: 60,
          type: "Steel",
          multihit: 2,
          makesContact: true,
          isPunch: true,
          category: "Physical",
          secondaries: true,
          zp: 180
        },
        "Dragon Hammer": {
          bp: 90,
          type: "Dragon",
          makesContact: true,
          category: "Physical",
          zp: 175
        },
        "Extreme Evoboost": { bp: 0, type: "Normal", isZ: true },
        "Fleur Cannon": {
          bp: 130,
          type: "Fairy",
          self: { boosts: { spa: -2 } },
          category: "Special",
          zp: 195
        },
        "Floral Healing": { bp: 0, type: "Fairy" },
        "Freezy Frost": { bp: 90, type: "Ice", category: "Special", zp: 175 },
        "Genesis Supernova": {
          bp: 185,
          type: "Psychic",
          category: "Special",
          secondaries: true,
          isZ: true
        },
        "Gigavolt Havoc": { bp: 1, type: "Electric", category: "Physical", isZ: true },
        "Glitzy Glow": { bp: 90, type: "Psychic", category: "Special", zp: 175 },
        "Guardian of Alola": { bp: 0, type: "Fairy", category: "Special", isZ: true },
        "Hydro Vortex": { bp: 1, type: "Water", category: "Physical", isZ: true },
        "Ice Hammer": {
          bp: 100,
          type: "Ice",
          makesContact: true,
          isPunch: true,
          category: "Physical",
          zp: 180
        },
        "Inferno Overdrive": { bp: 1, type: "Fire", category: "Physical", isZ: true },
        Instruct: { bp: 0, type: "Psychic" },
        "Let's Snuggle Forever": {
          bp: 190,
          type: "Fairy",
          makesContact: true,
          category: "Physical",
          isZ: true
        },
        "Light That Burns the Sky": {
          bp: 200,
          type: "Psychic",
          category: "Special",
          isZ: true
        },
        "Malicious Moonsault": {
          bp: 180,
          type: "Dark",
          makesContact: true,
          category: "Physical",
          isZ: true
        },
        "Menacing Moonraze Maelstrom": { bp: 200, type: "Ghost", category: "Special", isZ: true },
        "Mind Blown": {
          bp: 150,
          type: "Fire",
          mindBlownRecoil: true,
          target: "allAdjacent",
          category: "Special",
          zp: 200
        },
        "Multi-Attack": {
          bp: 90,
          type: "Normal",
          makesContact: true,
          category: "Physical",
          zp: 185
        },
        "Nature's Madness": { bp: 0, type: "Fairy", category: "Special", zp: 100 },
        "Never-Ending Nightmare": { bp: 1, type: "Ghost", category: "Physical", isZ: true },
        "Oceanic Operetta": { bp: 195, type: "Water", category: "Special", isZ: true },
        "Psychic Terrain": { bp: 0, type: "Psychic" },
        "Pulverizing Pancake": {
          bp: 210,
          type: "Normal",
          makesContact: true,
          category: "Physical",
          isZ: true
        },
        "Revelation Dance": { bp: 90, type: "Normal", category: "Special", zp: 175 },
        "Sappy Seed": { bp: 90, type: "Grass", category: "Physical", zp: 175 },
        "Savage Spin-Out": { bp: 1, type: "Bug", category: "Physical", isZ: true },
        "Searing Sunraze Smash": {
          bp: 200,
          type: "Steel",
          makesContact: true,
          category: "Physical",
          isZ: true
        },
        "Shadow Bone": {
          bp: 85,
          type: "Ghost",
          category: "Physical",
          secondaries: true,
          zp: 160
        },
        "Shattered Psyche": { bp: 1, type: "Psychic", category: "Physical", isZ: true },
        "Shore Up": { bp: 0, type: "Ground" },
        "Sinister Arrow Raid": { bp: 180, type: "Ghost", category: "Physical", isZ: true },
        "Sizzly Slide": {
          bp: 90,
          type: "Fire",
          makesContact: true,
          category: "Physical",
          secondaries: true,
          zp: 175
        },
        "Solar Blade": {
          bp: 125,
          type: "Grass",
          makesContact: true,
          category: "Physical",
          zp: 190
        },
        "Soul-Stealing 7-Star Strike": {
          bp: 195,
          type: "Ghost",
          makesContact: true,
          category: "Physical",
          isZ: true
        },
        "Sparkly Swirl": { bp: 90, type: "Fairy", category: "Special", zp: 175 },
        "Splintered Stormshards": { bp: 190, type: "Rock", category: "Physical", isZ: true },
        Spotlight: { bp: 0, type: "Normal", priority: 3 },
        "Stoked Sparksurfer": {
          bp: 175,
          type: "Electric",
          category: "Special",
          secondaries: true,
          isZ: true
        },
        "Subzero Slammer": { bp: 1, type: "Ice", category: "Physical", isZ: true },
        "Supersonic Skystrike": { bp: 1, type: "Flying", category: "Physical", isZ: true },
        "Tectonic Rage": { bp: 1, type: "Ground", category: "Physical", isZ: true },
        "Throat Chop": {
          bp: 80,
          type: "Dark",
          makesContact: true,
          category: "Physical",
          secondaries: true,
          zp: 160
        },
        "Toxic Thread": { bp: 0, type: "Poison" },
        "Twinkle Tackle": { bp: 1, type: "Fairy", category: "Physical", isZ: true },
        "Zippy Zap": {
          bp: 50,
          type: "Electric",
          willCrit: true,
          priority: 2,
          makesContact: true,
          category: "Physical",
          zp: 100
        },
        Accelerock: {
          bp: 40,
          type: "Rock",
          priority: 1,
          makesContact: true,
          category: "Physical",
          zp: 100
        },
        "Anchor Shot": {
          bp: 80,
          type: "Steel",
          makesContact: true,
          category: "Physical",
          secondaries: true,
          zp: 160
        },
        "Aurora Veil": { bp: 0, type: "Ice" },
        "Brutal Swing": {
          bp: 60,
          type: "Dark",
          makesContact: true,
          target: "allAdjacent",
          category: "Physical",
          zp: 120
        },
        "Burn Up": { bp: 130, type: "Fire", category: "Special", zp: 195 },
        "Clanging Scales": {
          bp: 110,
          type: "Dragon",
          isSound: true,
          target: "allAdjacentFoes",
          category: "Special",
          zp: 185
        },
        "Darkest Lariat": {
          bp: 85,
          type: "Dark",
          makesContact: true,
          category: "Physical",
          ignoreDefensive: true,
          zp: 160
        },
        "Fire Lash": {
          bp: 80,
          type: "Fire",
          makesContact: true,
          category: "Physical",
          secondaries: true,
          zp: 160
        },
        "First Impression": {
          bp: 90,
          type: "Bug",
          priority: 2,
          makesContact: true,
          category: "Physical",
          zp: 175
        },
        "Floaty Fall": {
          bp: 90,
          type: "Flying",
          makesContact: true,
          category: "Physical",
          secondaries: true,
          zp: 175
        },
        "Gear Up": { bp: 0, type: "Steel" },
        "High Horsepower": {
          bp: 95,
          type: "Ground",
          makesContact: true,
          category: "Physical",
          zp: 175
        },
        "Laser Focus": { bp: 0, type: "Normal" },
        Leafage: { bp: 40, type: "Grass", category: "Physical", zp: 100 },
        Liquidation: {
          bp: 85,
          type: "Water",
          makesContact: true,
          category: "Physical",
          secondaries: true,
          zp: 160
        },
        Lunge: {
          bp: 80,
          type: "Bug",
          makesContact: true,
          category: "Physical",
          secondaries: true,
          zp: 160
        },
        "Moongeist Beam": { bp: 100, type: "Ghost", category: "Special", zp: 180 },
        "Photon Geyser": {
          bp: 100,
          type: "Psychic",
          category: "Special",
          zp: 180
        },
        "Pika Papow": { bp: 0, type: "Electric", category: "Special", zp: 100 },
        "Plasma Fists": {
          bp: 100,
          type: "Electric",
          makesContact: true,
          isPunch: true,
          category: "Physical",
          zp: 180
        },
        "Pollen Puff": {
          bp: 90,
          type: "Bug",
          category: "Special",
          isBullet: true,
          zp: 175
        },
        "Power Trip": {
          bp: 20,
          type: "Dark",
          makesContact: true,
          category: "Physical",
          zp: 160
        },
        "Prismatic Laser": { bp: 160, type: "Psychic", category: "Special", zp: 200 },
        "Psychic Fangs": {
          bp: 85,
          type: "Psychic",
          makesContact: true,
          isBite: true,
          category: "Physical",
          zp: 160
        },
        Purify: { bp: 0, type: "Poison" },
        "Shell Trap": {
          bp: 150,
          type: "Fire",
          target: "allAdjacentFoes",
          category: "Special",
          zp: 200
        },
        "Smart Strike": {
          bp: 70,
          type: "Steel",
          makesContact: true,
          category: "Physical",
          zp: 140
        },
        "Sparkling Aria": {
          bp: 90,
          type: "Water",
          isSound: true,
          target: "allAdjacent",
          category: "Special",
          secondaries: true,
          zp: 175
        },
        "Spectral Thief": {
          bp: 90,
          type: "Ghost",
          makesContact: true,
          category: "Physical",
          zp: 175
        },
        "Speed Swap": { bp: 0, type: "Psychic" },
        "Spirit Shackle": {
          bp: 80,
          type: "Ghost",
          category: "Physical",
          secondaries: true,
          zp: 160
        },
        "Splishy Splash": {
          bp: 90,
          type: "Water",
          target: "allAdjacentFoes",
          category: "Special",
          secondaries: true,
          zp: 175
        },
        "Stomping Tantrum": {
          bp: 75,
          type: "Ground",
          makesContact: true,
          category: "Physical",
          zp: 140
        },
        "Strength Sap": { bp: 0, type: "Grass" },
        "Sunsteel Strike": {
          bp: 100,
          type: "Steel",
          makesContact: true,
          category: "Physical",
          zp: 180
        },
        "Tearful Look": { bp: 0, type: "Normal" },
        "Trop Kick": {
          bp: 70,
          type: "Grass",
          makesContact: true,
          category: "Physical",
          secondaries: true,
          zp: 140
        },
        "Veevee Volley": {
          bp: 0,
          type: "Normal",
          makesContact: true,
          category: "Physical",
          zp: 100
        },
        "Zing Zap": {
          bp: 80,
          type: "Electric",
          makesContact: true,
          category: "Physical",
          secondaries: true,
          zp: 160
        }
      };
      var SM = (0, util_1.extend)(true, {}, XY, SM_PATCH);
      var SS_PATCH = {
        "Apple Acid": {
          bp: 80,
          type: "Grass",
          category: "Special",
          secondaries: true,
          zp: 160,
          maxPower: 130
        },
        "Astral Barrage": {
          bp: 120,
          type: "Ghost",
          category: "Special",
          target: "allAdjacentFoes",
          zp: 190,
          maxPower: 140
        },
        "Aura Wheel": {
          bp: 110,
          type: "Electric",
          category: "Physical",
          secondaries: true,
          zp: 185,
          maxPower: 140
        },
        "Behemoth Bash": {
          bp: 100,
          type: "Steel",
          makesContact: true,
          category: "Physical",
          zp: 180,
          maxPower: 130
        },
        "Behemoth Blade": {
          bp: 100,
          type: "Steel",
          makesContact: true,
          category: "Physical",
          zp: 180,
          maxPower: 130
        },
        "Body Press": {
          bp: 80,
          type: "Fighting",
          makesContact: true,
          category: "Physical",
          overrideOffensiveStat: "def",
          zp: 160,
          maxPower: 90
        },
        "Bolt Beak": {
          bp: 85,
          type: "Electric",
          makesContact: true,
          category: "Physical",
          zp: 160,
          maxPower: 130
        },
        "Branch Poke": {
          bp: 40,
          type: "Grass",
          makesContact: true,
          category: "Physical",
          zp: 100,
          maxPower: 90
        },
        "Breaking Swipe": {
          bp: 60,
          type: "Dragon",
          makesContact: true,
          target: "allAdjacentFoes",
          category: "Physical",
          secondaries: true,
          zp: 120,
          maxPower: 110
        },
        "Burning Jealousy": {
          bp: 70,
          type: "Fire",
          target: "allAdjacentFoes",
          category: "Special",
          secondaries: true,
          zp: 140,
          maxPower: 120
        },
        "Clangorous Soul": { bp: 0, type: "Dragon", isSound: true },
        "Coaching": {
          bp: 0,
          type: "Fighting",
          category: "Status"
        },
        "Corrosive Gas": {
          bp: 0,
          type: "Poison",
          category: "Status",
          target: "allAdjacent"
        },
        "Court Change": { bp: 0, type: "Normal" },
        Decorate: { bp: 0, type: "Fairy" },
        "Dragon Darts": {
          bp: 50,
          type: "Dragon",
          multihit: 2,
          category: "Physical",
          zp: 100,
          maxPower: 130
        },
        "Dragon Energy": {
          bp: 150,
          type: "Dragon",
          category: "Special",
          target: "allAdjacentFoes",
          zp: 200,
          maxPower: 150
        },
        "Drum Beating": {
          bp: 80,
          type: "Grass",
          category: "Physical",
          secondaries: true,
          zp: 160,
          maxPower: 130
        },
        "Dual Wingbeat": {
          bp: 40,
          type: "Flying",
          category: "Physical",
          makesContact: true,
          multihit: 2,
          zp: 100,
          maxPower: 130
        },
        "Dynamax Cannon": {
          bp: 100,
          type: "Dragon",
          category: "Special",
          zp: 180,
          maxPower: 130
        },
        "Eerie Spell": {
          bp: 80,
          type: "Psychic",
          category: "Special",
          isSound: true,
          secondaries: true,
          zp: 160,
          maxPower: 130
        },
        Eternabeam: {
          bp: 160,
          type: "Dragon",
          category: "Special",
          zp: 200,
          maxPower: 150
        },
        "Expanding Force": {
          bp: 80,
          type: "Psychic",
          category: "Special",
          zp: 160,
          maxPower: 130
        },
        "False Surrender": {
          bp: 80,
          type: "Dark",
          makesContact: true,
          category: "Physical",
          zp: 160,
          maxPower: 130
        },
        "Fiery Wrath": {
          bp: 90,
          type: "Dark",
          category: "Special",
          target: "allAdjacentFoes",
          secondaries: true,
          zp: 175,
          maxPower: 130
        },
        "Fishious Rend": {
          bp: 85,
          type: "Water",
          makesContact: true,
          isBite: true,
          category: "Physical",
          zp: 160,
          maxPower: 130
        },
        "Flip Turn": {
          bp: 60,
          type: "Water",
          category: "Physical",
          makesContact: true,
          zp: 120,
          maxPower: 110
        },
        "Freezing Glare": {
          bp: 90,
          type: "Psychic",
          category: "Special",
          secondaries: true,
          zp: 175,
          maxPower: 130
        },
        "Glacial Lance": {
          bp: 130,
          type: "Ice",
          category: "Physical",
          target: "allAdjacentFoes",
          zp: 195,
          maxPower: 140
        },
        "G-Max Befuddle": {
          bp: 10,
          type: "Bug",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Centiferno": {
          bp: 10,
          type: "Fire",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Cannonade": {
          bp: 10,
          type: "Water",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Chi Strike": {
          bp: 10,
          type: "Fighting",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Cuddle": {
          bp: 10,
          type: "Normal",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Depletion": {
          bp: 10,
          type: "Dragon",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Drum Solo": {
          bp: 160,
          type: "Grass",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Fireball": {
          bp: 160,
          type: "Fire",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Finale": {
          bp: 10,
          type: "Fairy",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Foam Burst": {
          bp: 10,
          type: "Water",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Gold Rush": {
          bp: 10,
          type: "Normal",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Gravitas": {
          bp: 10,
          type: "Psychic",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Hydrosnipe": {
          bp: 160,
          type: "Water",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Malodor": {
          bp: 10,
          type: "Poison",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Meltdown": {
          bp: 10,
          type: "Steel",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max One Blow": {
          bp: 10,
          type: "Dark",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Rapid Flow": {
          bp: 10,
          type: "Water",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Replenish": {
          bp: 10,
          type: "Normal",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Resonance": {
          bp: 10,
          type: "Ice",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Sandblast": {
          bp: 10,
          type: "Ground",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Smite": {
          bp: 10,
          type: "Fairy",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Snooze": {
          bp: 10,
          type: "Dark",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Steelsurge": {
          bp: 10,
          type: "Steel",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Stonesurge": {
          bp: 10,
          type: "Water",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Stun Shock": {
          bp: 10,
          type: "Electric",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Sweetness": {
          bp: 10,
          type: "Grass",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Tartness": {
          bp: 10,
          type: "Grass",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Terror": {
          bp: 10,
          type: "Ghost",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Vine Lash": {
          bp: 10,
          type: "Grass",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Volcalith": {
          bp: 10,
          type: "Rock",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Volt Crash": {
          bp: 10,
          type: "Electric",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Wildfire": {
          bp: 10,
          type: "Fire",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "G-Max Wind Rage": {
          bp: 10,
          type: "Flying",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Grassy Glide": {
          bp: 70,
          type: "Grass",
          category: "Physical",
          makesContact: true,
          zp: 140,
          maxPower: 120
        },
        "Grav Apple": {
          bp: 80,
          type: "Grass",
          category: "Physical",
          secondaries: true,
          zp: 160,
          maxPower: 130
        },
        "Jaw Lock": {
          bp: 80,
          type: "Dark",
          makesContact: true,
          isBite: true,
          category: "Physical",
          zp: 160,
          maxPower: 130
        },
        "Jungle Healing": {
          bp: 0,
          type: "Grass",
          category: "Status"
        },
        "Lash Out": {
          bp: 75,
          type: "Dark",
          makesContact: true,
          category: "Physical",
          zp: 140,
          maxPower: 130
        },
        "Life Dew": { bp: 0, type: "Water" },
        "Magic Powder": { bp: 0, type: "Psychic" },
        "Max Airstream": {
          bp: 10,
          type: "Flying",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Darkness": {
          bp: 10,
          type: "Dark",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Flare": {
          bp: 100,
          type: "Fire",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Flutterby": {
          bp: 10,
          type: "Bug",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Geyser": {
          bp: 10,
          type: "Water",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Guard": { bp: 0, type: "Normal", priority: 4, isMax: true },
        "Max Hailstorm": {
          bp: 10,
          type: "Ice",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Knuckle": {
          bp: 10,
          type: "Fighting",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Lightning": {
          bp: 10,
          type: "Electric",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Mindstorm": {
          bp: 10,
          type: "Psychic",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Ooze": {
          bp: 10,
          type: "Poison",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Overgrowth": {
          bp: 10,
          type: "Grass",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Phantasm": {
          bp: 10,
          type: "Ghost",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Quake": {
          bp: 10,
          type: "Ground",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Rockfall": {
          bp: 10,
          type: "Rock",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Starfall": {
          bp: 10,
          type: "Fairy",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Steelspike": {
          bp: 10,
          type: "Steel",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Strike": {
          bp: 10,
          type: "Normal",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Max Wyrmwind": {
          bp: 10,
          type: "Dragon",
          category: "Physical",
          isMax: true,
          maxPower: 1
        },
        "Meteor Assault": {
          bp: 150,
          type: "Fighting",
          category: "Physical",
          zp: 200,
          maxPower: 100
        },
        "Meteor Beam": {
          bp: 120,
          type: "Rock",
          category: "Special",
          zp: 190,
          maxPower: 140
        },
        "Misty Explosion": {
          bp: 100,
          type: "Fairy",
          category: "Special",
          target: "allAdjacent",
          zp: 180,
          maxPower: 130
        },
        "No Retreat": { bp: 0, type: "Fighting" },
        Obstruct: { bp: 0, type: "Dark", priority: 4 },
        Octolock: { bp: 0, type: "Fighting" },
        Overdrive: {
          bp: 80,
          type: "Electric",
          isSound: true,
          target: "allAdjacentFoes",
          category: "Special",
          zp: 160,
          maxPower: 130
        },
        Poltergeist: {
          bp: 110,
          type: "Ghost",
          category: "Physical",
          zp: 185,
          maxPower: 140
        },
        "Pyro Ball": {
          bp: 120,
          type: "Fire",
          category: "Physical",
          secondaries: true,
          isBullet: true,
          zp: 190,
          maxPower: 140
        },
        "Rising Voltage": {
          bp: 70,
          type: "Electric",
          category: "Special",
          zp: 140,
          maxPower: 140
        },
        "Scale Shot": {
          bp: 25,
          type: "Dragon",
          category: "Physical",
          multihit: [2, 5],
          zp: 140,
          maxPower: 130
        },
        "Shell Side Arm": {
          bp: 90,
          type: "Poison",
          category: "Special",
          secondaries: true,
          zp: 175,
          maxPower: 90
        },
        "Snap Trap": {
          bp: 35,
          type: "Grass",
          makesContact: true,
          category: "Physical",
          zp: 100,
          maxPower: 90
        },
        "Snipe Shot": {
          bp: 80,
          type: "Water",
          category: "Special",
          zp: 160,
          maxPower: 130
        },
        "Scorching Sands": {
          bp: 70,
          type: "Ground",
          category: "Special",
          secondaries: true,
          zp: 140,
          maxPower: 120
        },
        "Skitter Smack": {
          bp: 70,
          type: "Bug",
          category: "Physical",
          makesContact: true,
          secondaries: true,
          zp: 140,
          maxPower: 120
        },
        "Spirit Break": {
          bp: 75,
          type: "Fairy",
          makesContact: true,
          category: "Physical",
          secondaries: true,
          zp: 140,
          maxPower: 130
        },
        "Steel Beam": {
          bp: 140,
          type: "Steel",
          mindBlownRecoil: true,
          category: "Special",
          zp: 200,
          maxPower: 140
        },
        "Steel Roller": {
          bp: 130,
          type: "Steel",
          category: "Physical",
          makesContact: true,
          zp: 195,
          maxPower: 140
        },
        "Strange Steam": {
          bp: 90,
          type: "Fairy",
          category: "Special",
          secondaries: true,
          zp: 175,
          maxPower: 130
        },
        "Surging Strikes": {
          bp: 25,
          type: "Water",
          category: "Physical",
          makesContact: true,
          willCrit: true,
          isPunch: true,
          multihit: 3,
          zp: 140,
          maxPower: 130
        },
        "Terrain Pulse": {
          bp: 50,
          type: "Normal",
          category: "Special",
          isPulse: true,
          zp: 160,
          maxPower: 130
        },
        "Triple Axel": {
          bp: 20,
          type: "Ice",
          category: "Physical",
          makesContact: true,
          multihit: 3,
          multiaccuracy: true,
          zp: 120,
          maxPower: 140
        },
        "Wicked Blow": {
          bp: 80,
          type: "Dark",
          category: "Physical",
          makesContact: true,
          willCrit: true,
          isPunch: true,
          zp: 160,
          maxPower: 130
        },
        "Stuff Cheeks": { bp: 0, type: "Normal" },
        "Tar Shot": { bp: 0, type: "Rock" },
        Teatime: { bp: 0, type: "Normal" },
        "Thunder Cage": {
          bp: 80,
          type: "Electric",
          category: "Special",
          zp: 160,
          maxPower: 130
        },
        "Thunderous Kick": {
          bp: 90,
          type: "Fighting",
          category: "Physical",
          secondaries: true,
          makesContact: true,
          zp: 175,
          maxPower: 90
        },
        "10,000,000 Volt Thunderbolt": { maxPower: 1 },
        Absorb: { maxPower: 90 },
        Accelerock: { maxPower: 90 },
        Acid: { maxPower: 70 },
        "Acid Downpour": { maxPower: 1 },
        "Acid Spray": { maxPower: 70 },
        Acrobatics: { maxPower: 110 },
        "Aerial Ace": { maxPower: 110 },
        Aeroblast: { maxPower: 130 },
        "Air Cutter": { maxPower: 110 },
        "Air Slash": { maxPower: 130 },
        "All-Out Pummeling": { maxPower: 1 },
        "Anchor Shot": { maxPower: 130 },
        "Ancient Power": { maxPower: 110 },
        "Aqua Jet": { maxPower: 90 },
        "Aqua Tail": { maxPower: 130 },
        "Arm Thrust": { maxPower: 70 },
        Assurance: { maxPower: 110 },
        Astonish: { maxPower: 90 },
        "Attack Order": { maxPower: 130 },
        "Aura Sphere": { maxPower: 90 },
        "Aurora Beam": { maxPower: 120 },
        Avalanche: { maxPower: 110 },
        Barrage: { maxPower: 90 },
        "Beak Blast": { maxPower: 130 },
        "Beat Up": { maxPower: 100 },
        Belch: { maxPower: 95 },
        Bide: { maxPower: 100 },
        Bind: { maxPower: 90 },
        Bite: { maxPower: 110 },
        "Black Hole Eclipse": { maxPower: 1 },
        "Blast Burn": { maxPower: 150 },
        "Blaze Kick": { maxPower: 130 },
        Blizzard: { maxPower: 140 },
        "Bloom Doom": { maxPower: 1 },
        "Blue Flare": { maxPower: 140 },
        "Body Slam": { maxPower: 130 },
        "Bolt Strike": { maxPower: 140 },
        "Bone Club": { maxPower: 120 },
        Bonemerang: { maxPower: 130 },
        "Bone Rush": { maxPower: 130 },
        Boomburst: { maxPower: 140 },
        Bounce: { maxPower: 130 },
        "Brave Bird": { maxPower: 140 },
        "Breakneck Blitz": { maxPower: 1 },
        "Brick Break": { maxPower: 90 },
        Brine: { maxPower: 120 },
        "Brutal Swing": { maxPower: 110 },
        Bubble: { maxPower: 90 },
        "Bubble Beam": { maxPower: 120 },
        "Bug Bite": { maxPower: 110 },
        "Bug Buzz": { maxPower: 130 },
        Bulldoze: { maxPower: 110 },
        "Bullet Punch": { maxPower: 90 },
        "Bullet Seed": { maxPower: 130 },
        "Burn Up": { maxPower: 140 },
        Catastropika: { maxPower: 1 },
        "Charge Beam": { maxPower: 100 },
        Chatter: { maxPower: 120 },
        "Chip Away": { maxPower: 120 },
        "Circle Throw": { maxPower: 80 },
        Clamp: { maxPower: 90 },
        "Clanging Scales": { maxPower: 140 },
        "Clangorous Soulblaze": { maxPower: 1 },
        "Clear Smog": { maxPower: 75 },
        "Close Combat": { maxPower: 95 },
        "Comet Punch": { maxPower: 100 },
        Confusion: { maxPower: 100 },
        Constrict: { maxPower: 90 },
        "Continental Crush": { maxPower: 1 },
        "Core Enforcer": { maxPower: 130 },
        "Corkscrew Crash": { maxPower: 1 },
        Counter: { maxPower: 75 },
        Covet: { maxPower: 110 },
        Crabhammer: { maxPower: 130 },
        "Cross Chop": { maxPower: 90 },
        "Cross Poison": { maxPower: 85 },
        Crunch: { maxPower: 130 },
        "Crush Claw": { maxPower: 130 },
        "Crush Grip": { maxPower: 140 },
        Cut: { maxPower: 100 },
        "Darkest Lariat": { maxPower: 130 },
        "Dark Pulse": { maxPower: 130 },
        "Dazzling Gleam": { maxPower: 130 },
        "Devastating Drake": { maxPower: 1 },
        "Diamond Storm": { maxPower: 130 },
        Dig: { maxPower: 130 },
        "Disarming Voice": { maxPower: 90 },
        Discharge: { maxPower: 130 },
        Dive: { maxPower: 130 },
        "Dizzy Punch": { maxPower: 120 },
        "Doom Desire": { maxPower: 140 },
        "Double-Edge": { maxPower: 140 },
        "Double Hit": { maxPower: 120 },
        "Double Iron Bash": { maxPower: 140 },
        "Double Kick": { maxPower: 80 },
        "Double Slap": { maxPower: 90 },
        "Draco Meteor": { maxPower: 140 },
        "Dragon Ascent": { maxPower: 140 },
        "Dragon Breath": { maxPower: 110 },
        "Dragon Claw": { maxPower: 130 },
        "Dragon Hammer": { maxPower: 130 },
        "Dragon Pulse": { maxPower: 130 },
        "Dragon Rage": { maxPower: 100 },
        "Dragon Rush": { maxPower: 130 },
        "Dragon Tail": { maxPower: 110 },
        "Draining Kiss": { maxPower: 100 },
        "Drain Punch": { maxPower: 90 },
        "Dream Eater": { maxPower: 130 },
        "Drill Peck": { maxPower: 130 },
        "Drill Run": { maxPower: 130 },
        "Dual Chop": { maxPower: 130 },
        "Dynamic Punch": { maxPower: 90 },
        "Earth Power": { maxPower: 130 },
        Earthquake: { maxPower: 130 },
        "Echoed Voice": { maxPower: 90 },
        "Egg Bomb": { maxPower: 130 },
        "Electro Ball": { maxPower: 130 },
        Electroweb: { maxPower: 110 },
        Ember: { maxPower: 90 },
        Endeavor: { maxPower: 130 },
        "Energy Ball": { maxPower: 130 },
        Eruption: { maxPower: 150 },
        Explosion: { maxPower: 150 },
        Extrasensory: { maxPower: 130 },
        "Extreme Speed": { maxPower: 130 },
        Facade: { maxPower: 120 },
        "Fairy Wind": { maxPower: 90 },
        "Fake Out": { maxPower: 90 },
        "False Swipe": { maxPower: 90 },
        Feint: { maxPower: 90 },
        "Feint Attack": { maxPower: 110 },
        "Fell Stinger": { maxPower: 100 },
        "Fiery Dance": { maxPower: 130 },
        "Final Gambit": { maxPower: 100 },
        "Fire Blast": { maxPower: 140 },
        "Fire Fang": { maxPower: 120 },
        "Fire Lash": { maxPower: 130 },
        "Fire Pledge": { maxPower: 130 },
        "Fire Punch": { maxPower: 130 },
        "Fire Spin": { maxPower: 90 },
        "First Impression": { maxPower: 130 },
        Fissure: { maxPower: 130 },
        Flail: { maxPower: 130 },
        "Flame Burst": { maxPower: 120 },
        "Flame Charge": { maxPower: 100 },
        "Flame Wheel": { maxPower: 110 },
        Flamethrower: { maxPower: 130 },
        "Flare Blitz": { maxPower: 140 },
        "Flash Cannon": { maxPower: 130 },
        "Fleur Cannon": { maxPower: 140 },
        Fling: { maxPower: 100 },
        Fly: { maxPower: 130 },
        "Flying Press": { maxPower: 90 },
        "Focus Blast": { maxPower: 95 },
        "Focus Punch": { maxPower: 100 },
        "Force Palm": { maxPower: 80 },
        "Foul Play": { maxPower: 130 },
        "Freeze-Dry": { maxPower: 120 },
        "Freeze Shock": { maxPower: 140 },
        "Frenzy Plant": { maxPower: 150 },
        "Frost Breath": { maxPower: 110 },
        Frustration: { maxPower: 130 },
        "Fury Attack": { maxPower: 90 },
        "Fury Cutter": { maxPower: 90 },
        "Fury Swipes": { maxPower: 100 },
        "Fusion Bolt": { maxPower: 130 },
        "Fusion Flare": { maxPower: 130 },
        "Future Sight": { maxPower: 140 },
        "Gear Grind": { maxPower: 130 },
        "Genesis Supernova": { maxPower: 1 },
        "Giga Drain": { maxPower: 130 },
        "Giga Impact": { maxPower: 150 },
        "Gigavolt Havoc": { maxPower: 1 },
        Glaciate: { maxPower: 120 },
        "Grass Knot": { maxPower: 130 },
        "Grass Pledge": { maxPower: 130 },
        "Guardian of Alola": { maxPower: 1 },
        Guillotine: { maxPower: 130 },
        "Gunk Shot": { maxPower: 95 },
        Gust: { maxPower: 90 },
        "Gyro Ball": { maxPower: 130 },
        "Hammer Arm": { maxPower: 90 },
        Headbutt: { maxPower: 120 },
        "Head Charge": { maxPower: 140 },
        "Head Smash": { maxPower: 150 },
        "Heart Stamp": { maxPower: 110 },
        "Heat Crash": { maxPower: 130 },
        "Heat Wave": { maxPower: 130 },
        "Heavy Slam": { maxPower: 130 },
        Hex: { maxPower: 120 },
        "Hidden Power": { maxPower: 110 },
        "Hidden Power Bug": { maxPower: 110 },
        "Hidden Power Dark": { maxPower: 110 },
        "Hidden Power Dragon": { maxPower: 110 },
        "Hidden Power Electric": { maxPower: 110 },
        "Hidden Power Fighting": { maxPower: 80 },
        "Hidden Power Fire": { maxPower: 110 },
        "Hidden Power Flying": { maxPower: 110 },
        "Hidden Power Ghost": { maxPower: 110 },
        "Hidden Power Grass": { maxPower: 110 },
        "Hidden Power Ground": { maxPower: 110 },
        "Hidden Power Ice": { maxPower: 110 },
        "Hidden Power Poison": { maxPower: 80 },
        "Hidden Power Psychic": { maxPower: 110 },
        "Hidden Power Rock": { maxPower: 110 },
        "Hidden Power Steel": { maxPower: 110 },
        "Hidden Power Water": { maxPower: 110 },
        "High Horsepower": { maxPower: 130 },
        "High Jump Kick": { maxPower: 95 },
        "Hold Back": { maxPower: 90 },
        "Horn Attack": { maxPower: 120 },
        "Horn Drill": { maxPower: 130 },
        "Horn Leech": { maxPower: 130 },
        Howl: { isSound: true },
        Hurricane: { maxPower: 140 },
        "Hydro Cannon": { maxPower: 150 },
        "Hydro Pump": { maxPower: 140 },
        "Hydro Vortex": { maxPower: 1 },
        "Hyper Beam": { maxPower: 150 },
        "Hyper Fang": { maxPower: 130 },
        "Hyperspace Fury": { maxPower: 130 },
        "Hyperspace Hole": { maxPower: 130 },
        "Hyper Voice": { maxPower: 130 },
        "Ice Ball": { maxPower: 90 },
        "Ice Beam": { maxPower: 130 },
        "Ice Burn": { maxPower: 140 },
        "Ice Fang": { maxPower: 120 },
        "Ice Hammer": { maxPower: 130 },
        "Ice Punch": { maxPower: 130 },
        "Ice Shard": { maxPower: 90 },
        "Icicle Crash": { maxPower: 130 },
        "Icicle Spear": { maxPower: 130 },
        "Icy Wind": { maxPower: 110 },
        Incinerate: { maxPower: 110 },
        Inferno: { maxPower: 130 },
        "Inferno Overdrive": { maxPower: 1 },
        Infestation: { maxPower: 90 },
        "Iron Head": { maxPower: 130 },
        "Iron Tail": { maxPower: 130 },
        Judgment: { maxPower: 130 },
        "Jump Kick": { maxPower: 90 },
        "Karate Chop": { maxPower: 75 },
        "Knock Off": { maxPower: 120 },
        "Land's Wrath": { maxPower: 130 },
        "Last Resort": { maxPower: 140 },
        "Lava Plume": { maxPower: 130 },
        Leafage: { maxPower: 90 },
        "Leaf Blade": { maxPower: 130 },
        "Leaf Storm": { maxPower: 140 },
        "Leaf Tornado": { maxPower: 120 },
        "Leech Life": { maxPower: 130 },
        "Let's Snuggle Forever": { maxPower: 1 },
        Lick: { maxPower: 90 },
        "Light of Ruin": { maxPower: 140 },
        "Light That Burns the Sky": { maxPower: 1 },
        Liquidation: { maxPower: 130 },
        "Low Kick": { maxPower: 100 },
        "Low Sweep": { maxPower: 85 },
        Lunge: { maxPower: 130 },
        "Luster Purge": { maxPower: 120 },
        "Mach Punch": { maxPower: 70 },
        "Magical Leaf": { maxPower: 110 },
        "Magma Storm": { maxPower: 130 },
        "Magnet Bomb": { maxPower: 110 },
        Magnitude: { maxPower: 140 },
        "Malicious Moonsault": { maxPower: 1 },
        "Mega Drain": { maxPower: 90 },
        Megahorn: { maxPower: 140 },
        "Mega Kick": { maxPower: 140 },
        "Mega Punch": { maxPower: 130 },
        "Menacing Moonraze Maelstrom": { maxPower: 1 },
        "Metal Burst": { maxPower: 100 },
        "Metal Claw": { maxPower: 100 },
        "Meteor Mash": { maxPower: 130 },
        "Mind Blown": { maxPower: 150 },
        "Mirror Coat": { maxPower: 100 },
        "Mirror Shot": { maxPower: 120 },
        "Mist Ball": { maxPower: 120 },
        Moonblast: { maxPower: 130 },
        "Moongeist Beam": { maxPower: 130 },
        "Mud Bomb": { maxPower: 120 },
        "Mud Shot": { maxPower: 110 },
        "Mud-Slap": { maxPower: 90 },
        "Muddy Water": { maxPower: 130 },
        "Multi-Attack": { bp: 120, maxPower: 95 },
        "Mystical Fire": { maxPower: 130 },
        "Natural Gift": { maxPower: 130 },
        "Nature's Madness": { maxPower: 100 },
        "Needle Arm": { maxPower: 110 },
        "Never-Ending Nightmare": { maxPower: 1 },
        "Night Daze": { maxPower: 130 },
        "Night Shade": { maxPower: 100 },
        "Night Slash": { maxPower: 120 },
        Nuzzle: { maxPower: 90 },
        "Oblivion Wing": { maxPower: 130 },
        "Oceanic Operetta": { maxPower: 1 },
        Octazooka: { maxPower: 120 },
        "Ominous Wind": { maxPower: 110 },
        "Origin Pulse": { maxPower: 140 },
        Outrage: { maxPower: 140 },
        Overheat: { maxPower: 140 },
        "Paleo Wave": { maxPower: 130 },
        "Parabolic Charge": { maxPower: 120 },
        Payback: { maxPower: 100 },
        "Pay Day": { maxPower: 90 },
        Peck: { maxPower: 90 },
        "Petal Blizzard": { maxPower: 130 },
        "Petal Dance": { maxPower: 140 },
        "Phantom Force": { maxPower: 130 },
        "Photon Geyser": { maxPower: 130 },
        "Pin Missile": { maxPower: 130 },
        "Plasma Fists": { maxPower: 130 },
        "Play Rough": { maxPower: 130 },
        Pluck: { maxPower: 110 },
        "Poison Fang": { maxPower: 75 },
        "Poison Jab": { maxPower: 90 },
        "Poison Sting": { maxPower: 70 },
        "Poison Tail": { maxPower: 75 },
        "Polar Flare": { maxPower: 130 },
        "Pollen Puff": { maxPower: 130 },
        Pound: { maxPower: 90 },
        "Powder Snow": { maxPower: 90 },
        "Power Gem": { maxPower: 130 },
        "Power Trip": { maxPower: 130 },
        "Power-Up Punch": { maxPower: 70 },
        "Power Whip": { maxPower: 140 },
        "Precipice Blades": { maxPower: 140 },
        Present: { maxPower: 100 },
        "Prismatic Laser": { maxPower: 150 },
        Psybeam: { maxPower: 120 },
        Psychic: { maxPower: 130 },
        "Psychic Fangs": { maxPower: 130 },
        "Psycho Boost": { maxPower: 140 },
        "Psycho Cut": { maxPower: 120 },
        Psyshock: { maxPower: 130 },
        Psystrike: { maxPower: 130 },
        Psywave: { maxPower: 100 },
        "Pulverizing Pancake": { maxPower: 1 },
        Punishment: { maxPower: 130 },
        Pursuit: { maxPower: 90 },
        "Quick Attack": { maxPower: 90 },
        Rage: { maxPower: 90 },
        "Rapid Spin": { bp: 50, secondaries: true, maxPower: 100 },
        "Razor Leaf": { maxPower: 110 },
        "Razor Shell": { maxPower: 130 },
        "Razor Wind": { maxPower: 130 },
        "Relic Song": { maxPower: 130 },
        Retaliate: { maxPower: 120 },
        Return: { maxPower: 130 },
        "Revelation Dance": { maxPower: 130 },
        Revenge: { maxPower: 80 },
        Reversal: { maxPower: 100 },
        "Roar of Time": { maxPower: 150 },
        "Rock Blast": { maxPower: 130 },
        "Rock Climb": { maxPower: 130 },
        "Rock Slide": { maxPower: 130 },
        "Rock Smash": { maxPower: 70 },
        "Rock Throw": { maxPower: 100 },
        "Rock Tomb": { maxPower: 110 },
        "Rock Wrecker": { maxPower: 150 },
        "Rolling Kick": { maxPower: 80 },
        Rollout: { maxPower: 90 },
        Round: { maxPower: 110 },
        "Sacred Fire": { maxPower: 130 },
        "Sacred Sword": { maxPower: 90 },
        "Sand Tomb": { maxPower: 90 },
        "Savage Spin-Out": { maxPower: 1 },
        Scald: { maxPower: 130 },
        Scratch: { maxPower: 90 },
        "Searing Shot": { maxPower: 130 },
        "Searing Sunraze Smash": { maxPower: 1 },
        "Secret Power": { maxPower: 120 },
        "Secret Sword": { maxPower: 90 },
        "Seed Bomb": { maxPower: 130 },
        "Seed Flare": { maxPower: 140 },
        "Seismic Toss": { maxPower: 75 },
        "Self-Destruct": { maxPower: 150 },
        "Shadow Ball": { maxPower: 130 },
        "Shadow Bone": { maxPower: 130 },
        "Shadow Claw": { maxPower: 120 },
        "Shadow Force": { maxPower: 140 },
        "Shadow Punch": { maxPower: 110 },
        "Shadow Sneak": { maxPower: 90 },
        "Shadow Strike": { maxPower: 130 },
        "Shattered Psyche": { maxPower: 1 },
        "Sheer Cold": { maxPower: 130 },
        "Shell Trap": { maxPower: 150 },
        "Shock Wave": { maxPower: 110 },
        "Signal Beam": { maxPower: 130 },
        "Silver Wind": { maxPower: 110 },
        "Sinister Arrow Raid": { maxPower: 1 },
        "Skull Bash": { maxPower: 140 },
        "Sky Attack": { maxPower: 140 },
        "Sky Drop": { maxPower: 110 },
        "Sky Uppercut": { maxPower: 90 },
        Slam: { maxPower: 130 },
        Slash: { maxPower: 120 },
        Sludge: { maxPower: 85 },
        "Sludge Bomb": { maxPower: 90 },
        "Sludge Wave": { maxPower: 90 },
        "Smack Down": { maxPower: 100 },
        "Smart Strike": { maxPower: 120 },
        "Smelling Salts": { maxPower: 120 },
        Smog: { maxPower: 70 },
        Snarl: { maxPower: 110 },
        Snore: { maxPower: 100 },
        "Solar Beam": { maxPower: 140 },
        "Solar Blade": { maxPower: 140 },
        "Sonic Boom": { maxPower: 100 },
        "Soul-Stealing 7-Star Strike": { maxPower: 1 },
        "Spacial Rend": { maxPower: 130 },
        Spark: { maxPower: 120 },
        "Sparkling Aria": { maxPower: 130 },
        "Spectral Thief": { maxPower: 130 },
        "Spike Cannon": { maxPower: 120 },
        "Spirit Shackle": { maxPower: 130 },
        "Spit Up": { maxPower: 100 },
        "Splintered Stormshards": { maxPower: 1 },
        "Steam Eruption": { maxPower: 140 },
        Steamroller: { maxPower: 120 },
        "Steel Wing": { maxPower: 120 },
        "Stoked Sparksurfer": { maxPower: 1 },
        Stomp: { maxPower: 120 },
        "Stomping Tantrum": { maxPower: 130 },
        "Stone Edge": { maxPower: 130 },
        "Stored Power": { maxPower: 130 },
        "Storm Throw": { maxPower: 80 },
        Strength: { maxPower: 130 },
        "Struggle Bug": { maxPower: 100 },
        Submission: { maxPower: 90 },
        "Subzero Slammer": { maxPower: 1 },
        "Sucker Punch": { maxPower: 120 },
        "Sunsteel Strike": { maxPower: 130 },
        "Super Fang": { maxPower: 100 },
        Superpower: { maxPower: 95 },
        "Supersonic Skystrike": { maxPower: 1 },
        Surf: { maxPower: 130 },
        Swift: { maxPower: 110 },
        Synchronoise: { maxPower: 140 },
        Tackle: { maxPower: 90 },
        "Tail Slap": { maxPower: 130 },
        "Take Down": { maxPower: 130 },
        "Techno Blast": { maxPower: 140 },
        "Tectonic Rage": { maxPower: 1 },
        Thief: { maxPower: 110 },
        "Thousand Arrows": { maxPower: 130 },
        "Thousand Waves": { maxPower: 130 },
        Thrash: { maxPower: 140 },
        "Throat Chop": { maxPower: 130 },
        Thunder: { maxPower: 140 },
        Thunderbolt: { maxPower: 130 },
        "Thunder Fang": { maxPower: 120 },
        "Thunder Punch": { maxPower: 130 },
        "Thunder Shock": { maxPower: 90 },
        "Tri Attack": { maxPower: 130 },
        "Triple Kick": { maxPower: 80 },
        "Trop Kick": { maxPower: 120 },
        "Trump Card": { maxPower: 130 },
        Twineedle: { maxPower: 100 },
        "Twinkle Tackle": { maxPower: 1 },
        Twister: { maxPower: 90 },
        "U-turn": { maxPower: 120 },
        Uproar: { maxPower: 130 },
        "Vacuum Wave": { maxPower: 70 },
        "V-create": { maxPower: 150 },
        Venoshock: { maxPower: 85 },
        "Vine Whip": { maxPower: 100 },
        "Vise Grip": { maxPower: 110 },
        "Vital Throw": { maxPower: 85 },
        "Volt Switch": { maxPower: 120 },
        "Volt Tackle": { maxPower: 140 },
        "Wake-Up Slap": { maxPower: 85 },
        Waterfall: { maxPower: 130 },
        "Water Gun": { maxPower: 90 },
        "Water Pledge": { maxPower: 130 },
        "Water Pulse": { maxPower: 110 },
        "Water Shuriken": { maxPower: 90 },
        "Water Spout": { maxPower: 150 },
        "Weather Ball": { maxPower: 130 },
        Whirlpool: { maxPower: 90 },
        "Wild Charge": { maxPower: 130 },
        "Wing Attack": { maxPower: 110 },
        "Wood Hammer": { maxPower: 140 },
        Wrap: { maxPower: 90 },
        "Wring Out": { maxPower: 140 },
        "X-Scissor": { maxPower: 130 },
        "Zap Cannon": { maxPower: 140 },
        "Zen Headbutt": { maxPower: 130 },
        "Zing Zap": { maxPower: 130 }
      };
      var SS = (0, util_1.extend)(true, {}, SM, SS_PATCH);
      var LGPE_MOVES = [
        "Baddy Bad",
        "Bouncy Bubble",
        "Buzzy Buzz",
        "Freezy Frost",
        "Glitzy Glow",
        "Sappy Seed",
        "Sizzly Slide",
        "Sparkly Swirl",
        "Zippy Zap",
        "Floaty Fall",
        "Pika Papow",
        "Splishy Splash",
        "Veevee Volley"
      ];
      try {
        for (LGPE_MOVES_1 = __values(LGPE_MOVES), LGPE_MOVES_1_1 = LGPE_MOVES_1.next(); !LGPE_MOVES_1_1.done; LGPE_MOVES_1_1 = LGPE_MOVES_1.next()) {
          m = LGPE_MOVES_1_1.value;
          delete SS[m];
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (LGPE_MOVES_1_1 && !LGPE_MOVES_1_1.done && (_a = LGPE_MOVES_1["return"])) _a.call(LGPE_MOVES_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      var m;
      var LGPE_MOVES_1;
      var LGPE_MOVES_1_1;
      var SV_PATCH = {
        "Aerial Ace": { isSlicing: true },
        Aeroblast: { isWind: true },
        "Air Cutter": { isSlicing: true, isWind: true },
        "Air Slash": { isSlicing: true },
        "Behemoth Blade": { isSlicing: true },
        Blizzard: { isWind: true },
        "Cross Poison": { isSlicing: true },
        Cut: { isSlicing: true },
        "Fairy Wind": { isWind: true },
        "Fury Cutter": { isSlicing: true },
        "Glacial Lance": { bp: 120, zp: 190 },
        "Grassy Glide": { bp: 55, zp: 100, maxPower: 110 },
        Gust: { isWind: true },
        "Heat Wave": { isWind: true },
        Hurricane: { isWind: true },
        "Icy Wind": { isWind: true },
        "Leaf Blade": { isSlicing: true },
        "Luster Purge": { bp: 95, zp: 175, maxPower: 130 },
        "Mist Ball": { bp: 95, zp: 175, maxPower: 130 },
        "Night Slash": { isSlicing: true },
        "Petal Blizzard": { isWind: true },
        "Psycho Cut": { isSlicing: true },
        "Razor Leaf": { isSlicing: true },
        "Razor Shell": { isSlicing: true },
        "Sacred Sword": { isSlicing: true },
        "Secret Sword": { isSlicing: true },
        Sandstorm: { isWind: true },
        Slash: { isSlicing: true },
        "Solar Blade": { isSlicing: true },
        Tailwind: { isWind: true },
        Twister: { isWind: true },
        Whirlwind: { isWind: true },
        "Wicked Blow": { bp: 75, zp: 140 },
        "X-Scissor": { isSlicing: true },
        "Aqua Cutter": {
          bp: 70,
          type: "Water",
          category: "Physical",
          zp: 140,
          maxPower: 120,
          isSlicing: true
        },
        "Alluring Voice": {
          bp: 80,
          type: "Fairy",
          category: "Special",
          zp: 160,
          maxPower: 130,
          secondaries: true,
          isSound: true
        },
        "Aqua Step": {
          bp: 80,
          type: "Water",
          category: "Physical",
          zp: 160,
          maxPower: 130,
          secondaries: true,
          makesContact: true
        },
        "Armor Cannon": {
          bp: 120,
          type: "Fire",
          category: "Special",
          zp: 190,
          maxPower: 140
        },
        "Axe Kick": {
          bp: 120,
          type: "Fighting",
          category: "Physical",
          zp: 190,
          maxPower: 95,
          secondaries: true,
          hasCrashDamage: true,
          makesContact: true
        },
        "Barb Barrage": {
          bp: 60,
          type: "Poison",
          category: "Physical",
          zp: 120,
          maxPower: 80,
          secondaries: true
        },
        "Bitter Blade": {
          bp: 90,
          type: "Fire",
          category: "Physical",
          zp: 175,
          maxPower: 130,
          makesContact: true,
          isSlicing: true,
          drain: [1, 2]
        },
        "Bitter Malice": {
          bp: 75,
          type: "Ghost",
          category: "Special",
          zp: 140,
          maxPower: 130,
          secondaries: true
        },
        "Blazing Torque": {
          bp: 80,
          type: "Fire",
          category: "Physical",
          zp: 160,
          maxPower: 130,
          secondaries: true
        },
        "Bleakwind Storm": {
          bp: 100,
          type: "Flying",
          category: "Special",
          zp: 180,
          maxPower: 130,
          secondaries: true,
          isWind: true,
          target: "allAdjacentFoes"
        },
        "Blood Moon": {
          bp: 140,
          type: "Normal",
          category: "Special",
          zp: 200,
          maxPower: 140
        },
        "Burning Bulwark": { bp: 0, type: "Fire", priority: 4 },
        "Ceaseless Edge": {
          bp: 65,
          type: "Dark",
          category: "Physical",
          zp: 120,
          maxPower: 120,
          makesContact: true,
          isSlicing: true,
          secondaries: true
        },
        "Chilling Water": {
          bp: 50,
          type: "Water",
          category: "Special",
          zp: 100,
          maxPower: 100,
          secondaries: true
        },
        "Chilly Reception": {
          bp: 0,
          type: "Ice",
          category: "Status"
        },
        "Chloroblast": {
          bp: 150,
          type: "Grass",
          mindBlownRecoil: true,
          category: "Special",
          zp: 200,
          maxPower: 150
        },
        "Collision Course": {
          bp: 100,
          type: "Fighting",
          category: "Physical",
          zp: 180,
          maxPower: 90,
          makesContact: true
        },
        "Combat Torque": {
          bp: 100,
          type: "Fighting",
          category: "Physical",
          zp: 180,
          maxPower: 90,
          secondaries: true
        },
        Comeuppance: {
          bp: 0,
          type: "Dark",
          category: "Physical",
          zp: 100,
          maxPower: 100,
          makesContact: true
        },
        Doodle: {
          bp: 0,
          type: "Normal",
          category: "Status"
        },
        "Double Shock": {
          bp: 120,
          type: "Electric",
          category: "Physical",
          zp: 190,
          maxPower: 140,
          makesContact: true
        },
        "Dire Claw": {
          bp: 80,
          type: "Poison",
          category: "Physical",
          zp: 160,
          maxPower: 90,
          makesContact: true,
          secondaries: true
        },
        "Dragon Cheer": { bp: 0, type: "Dragon" },
        "Electro Drift": {
          bp: 100,
          type: "Electric",
          category: "Special",
          zp: 180,
          maxPower: 130,
          makesContact: true
        },
        "Electro Shot": {
          bp: 130,
          type: "Electric",
          category: "Special",
          zp: 195,
          maxPower: 140
        },
        "Esper Wing": {
          bp: 80,
          type: "Psychic",
          category: "Special",
          zp: 160,
          maxPower: 130,
          secondaries: true
        },
        "Fickle Beam": {
          bp: 80,
          type: "Dragon",
          category: "Special",
          zp: 160,
          maxPower: 130
        },
        "Fillet Away": {
          bp: 0,
          type: "Normal",
          category: "Status"
        },
        "Flower Trick": {
          bp: 70,
          type: "Grass",
          category: "Physical",
          willCrit: true,
          zp: 140,
          maxPower: 120
        },
        "Gigaton Hammer": {
          bp: 160,
          type: "Steel",
          category: "Physical",
          zp: 200,
          maxPower: 150
        },
        "Glaive Rush": {
          bp: 120,
          type: "Dragon",
          category: "Physical",
          zp: 190,
          maxPower: 140,
          makesContact: true
        },
        "Hard Press": {
          bp: 0,
          type: "Steel",
          category: "Physical",
          zp: 100,
          maxPower: 100,
          makesContact: true
        },
        "Headlong Rush": {
          bp: 120,
          type: "Ground",
          category: "Physical",
          zp: 190,
          maxPower: 140,
          makesContact: true,
          isPunch: true
        },
        "Hydro Steam": {
          bp: 80,
          type: "Water",
          category: "Special",
          zp: 160,
          maxPower: 130
        },
        "Hyper Drill": {
          bp: 100,
          type: "Normal",
          category: "Physical",
          zp: 180,
          maxPower: 130,
          makesContact: true,
          breaksProtect: true
        },
        "Ice Spinner": {
          bp: 80,
          type: "Ice",
          category: "Physical",
          zp: 160,
          maxPower: 130,
          makesContact: true
        },
        "Infernal Parade": {
          bp: 60,
          type: "Ghost",
          category: "Special",
          zp: 120,
          maxPower: 110,
          secondaries: true
        },
        "Ivy Cudgel": {
          bp: 100,
          type: "Grass",
          category: "Physical",
          zp: 180,
          maxPower: 130
        },
        "Jet Punch": {
          bp: 60,
          type: "Water",
          category: "Physical",
          zp: 120,
          maxPower: 110,
          makesContact: true,
          isPunch: true,
          priority: 1
        },
        "Kowtow Cleave": {
          bp: 85,
          type: "Dark",
          category: "Physical",
          zp: 160,
          maxPower: 130,
          makesContact: true,
          isSlicing: true
        },
        "Last Respects": {
          bp: 50,
          type: "Ghost",
          category: "Physical",
          zp: 100,
          maxPower: 100
        },
        "Lumina Crash": {
          bp: 80,
          type: "Psychic",
          category: "Special",
          zp: 160,
          maxPower: 130,
          secondaries: true
        },
        "Lunar Blessing": {
          bp: 0,
          type: "Psychic",
          category: "Status"
        },
        "Magical Torque": {
          bp: 100,
          type: "Fairy",
          category: "Physical",
          zp: 180,
          maxPower: 130,
          secondaries: true
        },
        "Make It Rain": {
          bp: 120,
          type: "Steel",
          category: "Special",
          zp: 190,
          maxPower: 140,
          target: "allAdjacentFoes",
          self: { boosts: { spa: -1 } }
        },
        "Malignant Chain": {
          bp: 100,
          type: "Poison",
          category: "Special",
          zp: 180,
          maxPower: 90,
          secondaries: true
        },
        "Matcha Gotcha": {
          bp: 80,
          type: "Grass",
          category: "Special",
          target: "allAdjacentFoes",
          zp: 160,
          maxPower: 130,
          secondaries: true,
          drain: [1, 2]
        },
        "Mighty Cleave": {
          bp: 95,
          type: "Rock",
          category: "Physical",
          zp: 175,
          maxPower: 130,
          makesContact: true,
          isSlicing: true
        },
        "Mortal Spin": {
          bp: 30,
          type: "Poison",
          category: "Physical",
          zp: 100,
          maxPower: 70,
          makesContact: true,
          secondaries: true,
          target: "allAdjacentFoes"
        },
        "Mountain Gale": {
          bp: 100,
          type: "Ice",
          category: "Physical",
          zp: 180,
          maxPower: 130,
          secondaries: true
        },
        "Mystical Power": {
          bp: 70,
          type: "Psychic",
          category: "Special",
          zp: 140,
          maxPower: 120,
          secondaries: true
        },
        "Noxious Torque": {
          bp: 100,
          type: "Poison",
          category: "Physical",
          zp: 180,
          maxPower: 90,
          secondaries: true
        },
        "Order Up": {
          bp: 80,
          type: "Dragon",
          category: "Physical",
          zp: 160,
          maxPower: 130,
          isPulse: true
        },
        "Population Bomb": {
          bp: 20,
          type: "Normal",
          category: "Physical",
          zp: 100,
          maxPower: 90,
          makesContact: true,
          isSlicing: true,
          multihit: 10,
          multiaccuracy: true
        },
        Pounce: {
          bp: 50,
          type: "Bug",
          category: "Physical",
          zp: 100,
          maxPower: 100,
          makesContact: true,
          secondaries: true
        },
        "Power Shift": {
          bp: 0,
          type: "Normal",
          category: "Status"
        },
        "Psychic Noise": {
          bp: 75,
          type: "Psychic",
          category: "Special",
          zp: 140,
          maxPower: 130,
          secondaries: true,
          isSound: true
        },
        Psyblade: {
          bp: 80,
          type: "Psychic",
          category: "Physical",
          zp: 160,
          maxPower: 130,
          makesContact: true,
          isSlicing: true
        },
        "Psyshield Bash": {
          bp: 70,
          type: "Psychic",
          category: "Physical",
          zp: 140,
          maxPower: 120,
          makesContact: true,
          secondaries: true
        },
        "Rage Fist": {
          bp: 50,
          type: "Ghost",
          category: "Physical",
          zp: 100,
          maxPower: 100,
          makesContact: true,
          isPunch: true
        },
        "Raging Bull": {
          bp: 90,
          type: "Normal",
          category: "Physical",
          zp: 175,
          maxPower: 130,
          makesContact: true
        },
        "Raging Fury": {
          bp: 120,
          type: "Fire",
          category: "Physical",
          zp: 190,
          maxPower: 140
        },
        "Revival Blessing": {
          bp: 0,
          type: "Normal",
          category: "Status"
        },
        Ruination: {
          bp: 0,
          type: "Dark",
          category: "Special",
          zp: 100,
          maxPower: 100
        },
        "Salt Cure": {
          bp: 40,
          type: "Rock",
          category: "Physical",
          zp: 100,
          maxPower: 90,
          secondaries: true
        },
        "Sandsear Storm": {
          bp: 100,
          type: "Ground",
          category: "Special",
          zp: 180,
          maxPower: 130,
          secondaries: true,
          isWind: true,
          target: "allAdjacentFoes"
        },
        "Shed Tail": {
          bp: 0,
          type: "Normal",
          category: "Status"
        },
        Shelter: {
          bp: 0,
          type: "Steel",
          category: "Status"
        },
        "Silk Trap": {
          bp: 0,
          type: "Bug",
          category: "Status",
          priority: 4
        },
        Snowscape: {
          bp: 0,
          type: "Ice",
          category: "Status"
        },
        "Spicy Extract": {
          bp: 0,
          type: "Grass",
          category: "Status"
        },
        "Spin Out": {
          bp: 100,
          type: "Steel",
          category: "Physical",
          zp: 180,
          maxPower: 130,
          makesContact: true
        },
        "Springtide Storm": {
          bp: 100,
          type: "Fairy",
          category: "Special",
          zp: 180,
          maxPower: 130,
          secondaries: true,
          isWind: true,
          target: "allAdjacentFoes"
        },
        "Stone Axe": {
          bp: 65,
          type: "Rock",
          category: "Physical",
          zp: 120,
          maxPower: 120,
          makesContact: true,
          isSlicing: true,
          secondaries: true
        },
        "Supercell Slam": {
          bp: 100,
          type: "Electric",
          category: "Physical",
          zp: 180,
          maxPower: 130,
          makesContact: true,
          hasCrashDamage: true
        },
        "Syrup Bomb": {
          bp: 60,
          type: "Grass",
          category: "Special",
          zp: 120,
          maxPower: 110,
          isBullet: true,
          secondaries: true
        },
        "Tachyon Cutter": {
          bp: 50,
          type: "Steel",
          category: "Special",
          zp: 180,
          maxPower: 140,
          multihit: 2,
          isSlicing: true
        },
        "Take Heart": {
          bp: 0,
          type: "Psychic",
          category: "Status"
        },
        "Temper Flare": {
          bp: 75,
          type: "Fire",
          category: "Physical",
          zp: 140,
          maxPower: 130,
          makesContact: true
        },
        "Tera Blast": {
          bp: 80,
          type: "Normal",
          category: "Special",
          zp: 160,
          maxPower: 130
        },
        "Tera Starstorm": {
          bp: 120,
          type: "Normal",
          category: "Special",
          zp: 190,
          maxPower: 140
        },
        "Thunderclap": {
          bp: 70,
          type: "Electric",
          category: "Special",
          zp: 140,
          maxPower: 120,
          priority: 1
        },
        "Tidy Up": {
          bp: 0,
          type: "Normal",
          category: "Status"
        },
        "Torch Song": {
          bp: 80,
          type: "Fire",
          category: "Special",
          zp: 160,
          maxPower: 130,
          secondaries: true,
          isSound: true
        },
        Trailblaze: {
          bp: 50,
          type: "Grass",
          category: "Physical",
          zp: 100,
          maxPower: 100,
          secondaries: true,
          makesContact: true
        },
        "Triple Arrows": {
          bp: 90,
          type: "Fighting",
          category: "Physical",
          zp: 175,
          maxPower: 90,
          secondaries: true
        },
        "Triple Dive": {
          bp: 30,
          type: "Water",
          category: "Physical",
          zp: 100,
          maxPower: 90,
          makesContact: true,
          multihit: 3
        },
        "Twin Beam": {
          bp: 40,
          type: "Psychic",
          category: "Special",
          zp: 100,
          maxPower: 90,
          multihit: 2
        },
        "Upper Hand": {
          bp: 65,
          type: "Fighting",
          category: "Physical",
          zp: 120,
          maxPower: 85,
          makesContact: true,
          secondaries: true,
          priority: 3
        },
        "Victory Dance": {
          bp: 0,
          type: "Fighting",
          category: "Status"
        },
        "Wave Crash": {
          bp: 120,
          type: "Water",
          category: "Physical",
          zp: 190,
          maxPower: 140,
          makesContact: true,
          recoil: [33, 100]
        },
        "Wicked Torque": {
          bp: 80,
          type: "Dark",
          category: "Physical",
          zp: 160,
          maxPower: 130,
          secondaries: true
        },
        "Wildbolt Storm": {
          bp: 100,
          type: "Electric",
          category: "Special",
          zp: 180,
          maxPower: 130,
          secondaries: true,
          isWind: true,
          target: "allAdjacentFoes"
        }
      };
      var ZA_PATCH = {
        "Nihil Light": {
          bp: 100,
          type: "Dragon",
          category: "Special",
          zp: 180,
          maxPower: 130,
          target: "allAdjacentFoes",
          ignoreDefensive: true
        }
      };
      var SV = (0, util_1.extend)(true, {}, SS, SV_PATCH, ZA_PATCH);
      exports.MOVES = [{}, RBY, GSC, ADV, DPP, BW, XY, SM, SS, SV];
      var Moves = (function() {
        function Moves2(gen2) {
          this.gen = gen2;
        }
        Moves2.prototype.get = function(id) {
          return MOVES_BY_ID[this.gen][id];
        };
        Moves2.prototype[Symbol.iterator] = function() {
          var _a2, _b2, _c, _i, id;
          return __generator(this, function(_d) {
            switch (_d.label) {
              case 0:
                _a2 = MOVES_BY_ID[this.gen];
                _b2 = [];
                for (_c in _a2)
                  _b2.push(_c);
                _i = 0;
                _d.label = 1;
              case 1:
                if (!(_i < _b2.length)) return [3, 4];
                _c = _b2[_i];
                if (!(_c in _a2)) return [3, 3];
                id = _c;
                return [4, this.get(id)];
              case 2:
                _d.sent();
                _d.label = 3;
              case 3:
                _i++;
                return [3, 1];
              case 4:
                return [2];
            }
          });
        };
        return Moves2;
      })();
      exports.Moves = Moves;
      var Move2 = (function() {
        function Move3(name, data2, gen2) {
          this.kind = "Move";
          this.id = (0, util_1.toID)(name);
          this.name = name;
          this.flags = {};
          if (data2.makesContact)
            this.flags.contact = 1;
          if (data2.isPunch)
            this.flags.punch = 1;
          if (data2.isBite)
            this.flags.bite = 1;
          if (data2.isBullet)
            this.flags.bullet = 1;
          if (data2.isSound)
            this.flags.sound = 1;
          if (data2.isPulse)
            this.flags.pulse = 1;
          if (data2.isSlicing)
            this.flags.slicing = 1;
          if (data2.isWind)
            this.flags.wind = 1;
          (0, util_1.assignWithout)(this, data2, Move3.FLAGS);
          this.basePower = data2.bp;
          if (data2.zp)
            this.zMove = { basePower: data2.zp };
          if (data2.maxPower)
            this.maxMove = { basePower: data2.maxPower };
          if (!this.category && gen2 >= 4)
            this.category = "Status";
          if (this.struggleRecoil)
            delete this.recoil;
        }
        Move3.FLAGS = /* @__PURE__ */ new Set([
          "bp",
          "makesContact",
          "isPunch",
          "isBite",
          "isBullet",
          "isSound",
          "isPulse",
          "zp",
          "maxPower",
          "isSlicing",
          "isWind"
        ]);
        return Move3;
      })();
      var MOVES_BY_ID = [];
      var gen = 0;
      try {
        for (MOVES_1 = __values(exports.MOVES), MOVES_1_1 = MOVES_1.next(); !MOVES_1_1.done; MOVES_1_1 = MOVES_1.next()) {
          moves = MOVES_1_1.value;
          map = {};
          for (move in moves) {
            data = moves[move];
            m = new Move2(move, data, gen);
            map[m.id] = m;
          }
          MOVES_BY_ID.push(map);
          gen++;
        }
      } catch (e_2_1) {
        e_2 = { error: e_2_1 };
      } finally {
        try {
          if (MOVES_1_1 && !MOVES_1_1.done && (_b = MOVES_1["return"])) _b.call(MOVES_1);
        } finally {
          if (e_2) throw e_2.error;
        }
      }
      var moves;
      var map;
      var data;
      var m;
      var move;
      var MOVES_1;
      var MOVES_1_1;
    }
  });

  // node_modules/@smogon/calc/dist/data/species.js
  var require_species = __commonJS({
    "node_modules/@smogon/calc/dist/data/species.js"(exports) {
      "use strict";
      var __generator = exports && exports.__generator || function(thisArg, body) {
        var _ = { label: 0, sent: function() {
          if (t[0] & 1) throw t[1];
          return t[1];
        }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
          return this;
        }), g;
        function verb(n) {
          return function(v) {
            return step([n, v]);
          };
        }
        function step(op) {
          if (f) throw new TypeError("Generator is already executing.");
          while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
              case 0:
              case 1:
                t = op;
                break;
              case 4:
                _.label++;
                return { value: op[1], done: false };
              case 5:
                _.label++;
                y = op[1];
                op = [0];
                continue;
              case 7:
                op = _.ops.pop();
                _.trys.pop();
                continue;
              default:
                if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                  _ = 0;
                  continue;
                }
                if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                  _.label = op[1];
                  break;
                }
                if (op[0] === 6 && _.label < t[1]) {
                  _.label = t[1];
                  t = op;
                  break;
                }
                if (t && _.label < t[2]) {
                  _.label = t[2];
                  _.ops.push(op);
                  break;
                }
                if (t[2]) _.ops.pop();
                _.trys.pop();
                continue;
            }
            op = body.call(thisArg, _);
          } catch (e) {
            op = [6, e];
            y = 0;
          } finally {
            f = t = 0;
          }
          if (op[0] & 5) throw op[1];
          return { value: op[0] ? op[1] : void 0, done: true };
        }
      };
      var __read = exports && exports.__read || function(o, n) {
        var m2 = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m2) return o;
        var i = m2.call(o), r, ar = [], e;
        try {
          while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
          e = { error };
        } finally {
          try {
            if (r && !r.done && (m2 = i["return"])) m2.call(i);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      };
      var __spreadArray = exports && exports.__spreadArray || function(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
      };
      var __values = exports && exports.__values || function(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m2 = s && o[s], i = 0;
        if (m2) return m2.call(o);
        if (o && typeof o.length === "number") return {
          next: function() {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
          }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
      };
      var e_1;
      var _a;
      exports.__esModule = true;
      exports.Species = exports.SPECIES = void 0;
      var util_1 = require_util();
      var RBY = {
        Abra: {
          types: ["Psychic"],
          bs: { hp: 25, at: 20, df: 15, sp: 90, sl: 105 },
          weightkg: 19.5,
          nfe: true
        },
        Aerodactyl: {
          types: ["Rock", "Flying"],
          bs: { hp: 80, at: 105, df: 65, sp: 130, sl: 60 },
          weightkg: 59
        },
        Alakazam: {
          types: ["Psychic"],
          bs: { hp: 55, at: 50, df: 45, sp: 120, sl: 135 },
          weightkg: 48
        },
        Arbok: { types: ["Poison"], bs: { hp: 60, at: 85, df: 69, sp: 80, sl: 65 }, weightkg: 65 },
        Arcanine: {
          types: ["Fire"],
          bs: { hp: 90, at: 110, df: 80, sp: 95, sl: 80 },
          weightkg: 155
        },
        Articuno: {
          types: ["Ice", "Flying"],
          bs: { hp: 90, at: 85, df: 100, sp: 85, sl: 125 },
          weightkg: 55.4
        },
        Beedrill: {
          types: ["Bug", "Poison"],
          bs: { hp: 65, at: 80, df: 40, sp: 75, sl: 45 },
          weightkg: 29.5
        },
        Bellsprout: {
          types: ["Grass", "Poison"],
          bs: { hp: 50, at: 75, df: 35, sp: 40, sl: 70 },
          weightkg: 4,
          nfe: true
        },
        Blastoise: {
          types: ["Water"],
          bs: { hp: 79, at: 83, df: 100, sp: 78, sl: 85 },
          weightkg: 85.5
        },
        Bulbasaur: {
          types: ["Grass", "Poison"],
          bs: { hp: 45, at: 49, df: 49, sp: 45, sl: 65 },
          weightkg: 6.9,
          nfe: true
        },
        Butterfree: {
          types: ["Bug", "Flying"],
          bs: { hp: 60, at: 45, df: 50, sp: 70, sl: 80 },
          weightkg: 32
        },
        Caterpie: {
          types: ["Bug"],
          bs: { hp: 45, at: 30, df: 35, sp: 45, sl: 20 },
          weightkg: 2.9,
          nfe: true
        },
        Chansey: {
          types: ["Normal"],
          bs: { hp: 250, at: 5, df: 5, sp: 50, sl: 105 },
          weightkg: 34.6
        },
        Charizard: {
          types: ["Fire", "Flying"],
          bs: { hp: 78, at: 84, df: 78, sp: 100, sl: 85 },
          weightkg: 90.5
        },
        Charmander: {
          types: ["Fire"],
          bs: { hp: 39, at: 52, df: 43, sp: 65, sl: 50 },
          weightkg: 8.5,
          nfe: true
        },
        Charmeleon: {
          types: ["Fire"],
          bs: { hp: 58, at: 64, df: 58, sp: 80, sl: 65 },
          weightkg: 19,
          nfe: true
        },
        Clefable: { types: ["Normal"], bs: { hp: 95, at: 70, df: 73, sp: 60, sl: 85 }, weightkg: 40 },
        Clefairy: {
          types: ["Normal"],
          bs: { hp: 70, at: 45, df: 48, sp: 35, sl: 60 },
          weightkg: 7.5,
          nfe: true
        },
        Cloyster: {
          types: ["Water", "Ice"],
          bs: { hp: 50, at: 95, df: 180, sp: 70, sl: 85 },
          weightkg: 132.5
        },
        Cubone: {
          types: ["Ground"],
          bs: { hp: 50, at: 50, df: 95, sp: 35, sl: 40 },
          weightkg: 6.5,
          nfe: true
        },
        Dewgong: {
          types: ["Water", "Ice"],
          bs: { hp: 90, at: 70, df: 80, sp: 70, sl: 95 },
          weightkg: 120
        },
        Diglett: {
          types: ["Ground"],
          bs: { hp: 10, at: 55, df: 25, sp: 95, sl: 45 },
          weightkg: 0.8,
          nfe: true
        },
        Ditto: { types: ["Normal"], bs: { hp: 48, at: 48, df: 48, sp: 48, sl: 48 }, weightkg: 4 },
        Dodrio: {
          types: ["Normal", "Flying"],
          bs: { hp: 60, at: 110, df: 70, sp: 100, sl: 60 },
          weightkg: 85.2
        },
        Doduo: {
          types: ["Normal", "Flying"],
          bs: { hp: 35, at: 85, df: 45, sp: 75, sl: 35 },
          weightkg: 39.2,
          nfe: true
        },
        Dragonair: {
          types: ["Dragon"],
          bs: { hp: 61, at: 84, df: 65, sp: 70, sl: 70 },
          weightkg: 16.5,
          nfe: true
        },
        Dragonite: {
          types: ["Dragon", "Flying"],
          bs: { hp: 91, at: 134, df: 95, sp: 80, sl: 100 },
          weightkg: 210
        },
        Dratini: {
          types: ["Dragon"],
          bs: { hp: 41, at: 64, df: 45, sp: 50, sl: 50 },
          weightkg: 3.3,
          nfe: true
        },
        Drowzee: {
          types: ["Psychic"],
          bs: { hp: 60, at: 48, df: 45, sp: 42, sl: 90 },
          weightkg: 32.4,
          nfe: true
        },
        Dugtrio: {
          types: ["Ground"],
          bs: { hp: 35, at: 80, df: 50, sp: 120, sl: 70 },
          weightkg: 33.3
        },
        Eevee: {
          types: ["Normal"],
          bs: { hp: 55, at: 55, df: 50, sp: 55, sl: 65 },
          weightkg: 6.5,
          nfe: true
        },
        Ekans: {
          types: ["Poison"],
          bs: { hp: 35, at: 60, df: 44, sp: 55, sl: 40 },
          weightkg: 6.9,
          nfe: true
        },
        Electabuzz: {
          types: ["Electric"],
          bs: { hp: 65, at: 83, df: 57, sp: 105, sl: 85 },
          weightkg: 30
        },
        Electrode: {
          types: ["Electric"],
          bs: { hp: 60, at: 50, df: 70, sp: 140, sl: 80 },
          weightkg: 66.6
        },
        Exeggcute: {
          types: ["Grass", "Psychic"],
          bs: { hp: 60, at: 40, df: 80, sp: 40, sl: 60 },
          weightkg: 2.5,
          nfe: true
        },
        Exeggutor: {
          types: ["Grass", "Psychic"],
          bs: { hp: 95, at: 95, df: 85, sp: 55, sl: 125 },
          weightkg: 120
        },
        "Farfetch\u2019d": {
          types: ["Normal", "Flying"],
          bs: { hp: 52, at: 65, df: 55, sp: 60, sl: 58 },
          weightkg: 15
        },
        Fearow: {
          types: ["Normal", "Flying"],
          bs: { hp: 65, at: 90, df: 65, sp: 100, sl: 61 },
          weightkg: 38
        },
        Flareon: { types: ["Fire"], bs: { hp: 65, at: 130, df: 60, sp: 65, sl: 110 }, weightkg: 25 },
        Gastly: {
          types: ["Ghost", "Poison"],
          bs: { hp: 30, at: 35, df: 30, sp: 80, sl: 100 },
          weightkg: 0.1,
          nfe: true
        },
        Gengar: {
          types: ["Ghost", "Poison"],
          bs: { hp: 60, at: 65, df: 60, sp: 110, sl: 130 },
          weightkg: 40.5
        },
        Geodude: {
          types: ["Rock", "Ground"],
          bs: { hp: 40, at: 80, df: 100, sp: 20, sl: 30 },
          weightkg: 20,
          nfe: true
        },
        Gloom: {
          types: ["Grass", "Poison"],
          bs: { hp: 60, at: 65, df: 70, sp: 40, sl: 85 },
          weightkg: 8.6,
          nfe: true
        },
        Golbat: {
          types: ["Poison", "Flying"],
          bs: { hp: 75, at: 80, df: 70, sp: 90, sl: 75 },
          weightkg: 55
        },
        Goldeen: {
          types: ["Water"],
          bs: { hp: 45, at: 67, df: 60, sp: 63, sl: 50 },
          weightkg: 15,
          nfe: true
        },
        Golduck: { types: ["Water"], bs: { hp: 80, at: 82, df: 78, sp: 85, sl: 80 }, weightkg: 76.6 },
        Golem: {
          types: ["Rock", "Ground"],
          bs: { hp: 80, at: 110, df: 130, sp: 45, sl: 55 },
          weightkg: 300
        },
        Graveler: {
          types: ["Rock", "Ground"],
          bs: { hp: 55, at: 95, df: 115, sp: 35, sl: 45 },
          weightkg: 105,
          nfe: true
        },
        Grimer: {
          types: ["Poison"],
          bs: { hp: 80, at: 80, df: 50, sp: 25, sl: 40 },
          weightkg: 30,
          nfe: true
        },
        Growlithe: {
          types: ["Fire"],
          bs: { hp: 55, at: 70, df: 45, sp: 60, sl: 50 },
          weightkg: 19,
          nfe: true
        },
        Gyarados: {
          types: ["Water", "Flying"],
          bs: { hp: 95, at: 125, df: 79, sp: 81, sl: 100 },
          weightkg: 235
        },
        Haunter: {
          types: ["Ghost", "Poison"],
          bs: { hp: 45, at: 50, df: 45, sp: 95, sl: 115 },
          weightkg: 0.1,
          nfe: true
        },
        Hitmonchan: {
          types: ["Fighting"],
          bs: { hp: 50, at: 105, df: 79, sp: 76, sl: 35 },
          weightkg: 50.2
        },
        Hitmonlee: {
          types: ["Fighting"],
          bs: { hp: 50, at: 120, df: 53, sp: 87, sl: 35 },
          weightkg: 49.8
        },
        Horsea: {
          types: ["Water"],
          bs: { hp: 30, at: 40, df: 70, sp: 60, sl: 70 },
          weightkg: 8,
          nfe: true
        },
        Hypno: {
          types: ["Psychic"],
          bs: { hp: 85, at: 73, df: 70, sp: 67, sl: 115 },
          weightkg: 75.6
        },
        Ivysaur: {
          types: ["Grass", "Poison"],
          bs: { hp: 60, at: 62, df: 63, sp: 60, sl: 80 },
          weightkg: 13,
          nfe: true
        },
        Jigglypuff: {
          types: ["Normal"],
          bs: { hp: 115, at: 45, df: 20, sp: 20, sl: 25 },
          weightkg: 5.5,
          nfe: true
        },
        Jolteon: {
          types: ["Electric"],
          bs: { hp: 65, at: 65, df: 60, sp: 130, sl: 110 },
          weightkg: 24.5
        },
        Jynx: {
          types: ["Ice", "Psychic"],
          bs: { hp: 65, at: 50, df: 35, sp: 95, sl: 95 },
          weightkg: 40.6
        },
        Kabuto: {
          types: ["Rock", "Water"],
          bs: { hp: 30, at: 80, df: 90, sp: 55, sl: 45 },
          weightkg: 11.5,
          nfe: true
        },
        Kabutops: {
          types: ["Rock", "Water"],
          bs: { hp: 60, at: 115, df: 105, sp: 80, sl: 70 },
          weightkg: 40.5
        },
        Kadabra: {
          types: ["Psychic"],
          bs: { hp: 40, at: 35, df: 30, sp: 105, sl: 120 },
          weightkg: 56.5,
          nfe: true
        },
        Kakuna: {
          types: ["Bug", "Poison"],
          bs: { hp: 45, at: 25, df: 50, sp: 35, sl: 25 },
          weightkg: 10,
          nfe: true
        },
        Kangaskhan: {
          types: ["Normal"],
          bs: { hp: 105, at: 95, df: 80, sp: 90, sl: 40 },
          weightkg: 80
        },
        Kingler: { types: ["Water"], bs: { hp: 55, at: 130, df: 115, sp: 75, sl: 50 }, weightkg: 60 },
        Koffing: {
          types: ["Poison"],
          bs: { hp: 40, at: 65, df: 95, sp: 35, sl: 60 },
          weightkg: 1,
          nfe: true
        },
        Krabby: {
          types: ["Water"],
          bs: { hp: 30, at: 105, df: 90, sp: 50, sl: 25 },
          weightkg: 6.5,
          nfe: true
        },
        Lapras: {
          types: ["Water", "Ice"],
          bs: { hp: 130, at: 85, df: 80, sp: 60, sl: 95 },
          weightkg: 220
        },
        Lickitung: {
          types: ["Normal"],
          bs: { hp: 90, at: 55, df: 75, sp: 30, sl: 60 },
          weightkg: 65.5
        },
        Machamp: {
          types: ["Fighting"],
          bs: { hp: 90, at: 130, df: 80, sp: 55, sl: 65 },
          weightkg: 130
        },
        Machoke: {
          types: ["Fighting"],
          bs: { hp: 80, at: 100, df: 70, sp: 45, sl: 50 },
          weightkg: 70.5,
          nfe: true
        },
        Machop: {
          types: ["Fighting"],
          bs: { hp: 70, at: 80, df: 50, sp: 35, sl: 35 },
          weightkg: 19.5,
          nfe: true
        },
        Magikarp: {
          types: ["Water"],
          bs: { hp: 20, at: 10, df: 55, sp: 80, sl: 20 },
          weightkg: 10,
          nfe: true
        },
        Magmar: {
          types: ["Fire"],
          bs: { hp: 65, at: 95, df: 57, sp: 93, sl: 85 },
          weightkg: 44.5
        },
        Magnemite: {
          types: ["Electric"],
          bs: { hp: 25, at: 35, df: 70, sp: 45, sl: 95 },
          weightkg: 6,
          nfe: true
        },
        Magneton: {
          types: ["Electric"],
          bs: { hp: 50, at: 60, df: 95, sp: 70, sl: 120 },
          weightkg: 60
        },
        Mankey: {
          types: ["Fighting"],
          bs: { hp: 40, at: 80, df: 35, sp: 70, sl: 35 },
          weightkg: 28,
          nfe: true
        },
        Marowak: { types: ["Ground"], bs: { hp: 60, at: 80, df: 110, sp: 45, sl: 50 }, weightkg: 45 },
        Meowth: {
          types: ["Normal"],
          bs: { hp: 40, at: 45, df: 35, sp: 90, sl: 40 },
          weightkg: 4.2,
          nfe: true
        },
        Metapod: {
          types: ["Bug"],
          bs: { hp: 50, at: 20, df: 55, sp: 30, sl: 25 },
          weightkg: 9.9,
          nfe: true
        },
        Mew: {
          types: ["Psychic"],
          bs: { hp: 100, at: 100, df: 100, sp: 100, sl: 100 },
          weightkg: 4
        },
        Mewtwo: {
          types: ["Psychic"],
          bs: { hp: 106, at: 110, df: 90, sp: 130, sl: 154 },
          weightkg: 122
        },
        Moltres: {
          types: ["Fire", "Flying"],
          bs: { hp: 90, at: 100, df: 90, sp: 90, sl: 125 },
          weightkg: 60
        },
        "Mr. Mime": {
          types: ["Psychic"],
          bs: { hp: 40, at: 45, df: 65, sp: 90, sl: 100 },
          weightkg: 54.5
        },
        Muk: { types: ["Poison"], bs: { hp: 105, at: 105, df: 75, sp: 50, sl: 65 }, weightkg: 30 },
        Nidoking: {
          types: ["Poison", "Ground"],
          bs: { hp: 81, at: 92, df: 77, sp: 85, sl: 75 },
          weightkg: 62
        },
        Nidoqueen: {
          types: ["Poison", "Ground"],
          bs: { hp: 90, at: 82, df: 87, sp: 76, sl: 75 },
          weightkg: 60
        },
        "Nidoran-F": {
          types: ["Poison"],
          bs: { hp: 55, at: 47, df: 52, sp: 41, sl: 40 },
          weightkg: 7,
          nfe: true
        },
        "Nidoran-M": {
          types: ["Poison"],
          bs: { hp: 46, at: 57, df: 40, sp: 50, sl: 40 },
          weightkg: 9,
          nfe: true
        },
        Nidorina: {
          types: ["Poison"],
          bs: { hp: 70, at: 62, df: 67, sp: 56, sl: 55 },
          weightkg: 20,
          nfe: true
        },
        Nidorino: {
          types: ["Poison"],
          bs: { hp: 61, at: 72, df: 57, sp: 65, sl: 55 },
          weightkg: 19.5,
          nfe: true
        },
        Ninetales: {
          types: ["Fire"],
          bs: { hp: 73, at: 76, df: 75, sp: 100, sl: 100 },
          weightkg: 19.9
        },
        Oddish: {
          types: ["Grass", "Poison"],
          bs: { hp: 45, at: 50, df: 55, sp: 30, sl: 75 },
          weightkg: 5.4,
          nfe: true
        },
        Omanyte: {
          types: ["Rock", "Water"],
          bs: { hp: 35, at: 40, df: 100, sp: 35, sl: 90 },
          weightkg: 7.5,
          nfe: true
        },
        Omastar: {
          types: ["Rock", "Water"],
          bs: { hp: 70, at: 60, df: 125, sp: 55, sl: 115 },
          weightkg: 35
        },
        Onix: {
          types: ["Rock", "Ground"],
          bs: { hp: 35, at: 45, df: 160, sp: 70, sl: 30 },
          weightkg: 210
        },
        Paras: {
          types: ["Bug", "Grass"],
          bs: { hp: 35, at: 70, df: 55, sp: 25, sl: 55 },
          weightkg: 5.4,
          nfe: true
        },
        Parasect: {
          types: ["Bug", "Grass"],
          bs: { hp: 60, at: 95, df: 80, sp: 30, sl: 80 },
          weightkg: 29.5
        },
        Persian: { types: ["Normal"], bs: { hp: 65, at: 70, df: 60, sp: 115, sl: 65 }, weightkg: 32 },
        Pidgeot: {
          types: ["Normal", "Flying"],
          bs: { hp: 83, at: 80, df: 75, sp: 91, sl: 70 },
          weightkg: 39.5
        },
        Pidgeotto: {
          types: ["Normal", "Flying"],
          bs: { hp: 63, at: 60, df: 55, sp: 71, sl: 50 },
          weightkg: 30,
          nfe: true
        },
        Pidgey: {
          types: ["Normal", "Flying"],
          bs: { hp: 40, at: 45, df: 40, sp: 56, sl: 35 },
          weightkg: 1.8,
          nfe: true
        },
        Pikachu: {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 30, sp: 90, sl: 50 },
          weightkg: 6,
          nfe: true
        },
        Pinsir: { types: ["Bug"], bs: { hp: 65, at: 125, df: 100, sp: 85, sl: 55 }, weightkg: 55 },
        Poliwag: {
          types: ["Water"],
          bs: { hp: 40, at: 50, df: 40, sp: 90, sl: 40 },
          weightkg: 12.4,
          nfe: true
        },
        Poliwhirl: {
          types: ["Water"],
          bs: { hp: 65, at: 65, df: 65, sp: 90, sl: 50 },
          weightkg: 20,
          nfe: true
        },
        Poliwrath: {
          types: ["Water", "Fighting"],
          bs: { hp: 90, at: 85, df: 95, sp: 70, sl: 70 },
          weightkg: 54
        },
        Ponyta: {
          types: ["Fire"],
          bs: { hp: 50, at: 85, df: 55, sp: 90, sl: 65 },
          weightkg: 30,
          nfe: true
        },
        Porygon: {
          types: ["Normal"],
          bs: { hp: 65, at: 60, df: 70, sp: 40, sl: 75 },
          weightkg: 36.5
        },
        Primeape: {
          types: ["Fighting"],
          bs: { hp: 65, at: 105, df: 60, sp: 95, sl: 60 },
          weightkg: 32
        },
        Psyduck: {
          types: ["Water"],
          bs: { hp: 50, at: 52, df: 48, sp: 55, sl: 50 },
          weightkg: 19.6,
          nfe: true
        },
        Raichu: {
          types: ["Electric"],
          bs: { hp: 60, at: 90, df: 55, sp: 100, sl: 90 },
          weightkg: 30
        },
        Rapidash: { types: ["Fire"], bs: { hp: 65, at: 100, df: 70, sp: 105, sl: 80 }, weightkg: 95 },
        Raticate: {
          types: ["Normal"],
          bs: { hp: 55, at: 81, df: 60, sp: 97, sl: 50 },
          weightkg: 18.5
        },
        Rattata: {
          types: ["Normal"],
          bs: { hp: 30, at: 56, df: 35, sp: 72, sl: 25 },
          weightkg: 3.5,
          nfe: true
        },
        Rhydon: {
          types: ["Ground", "Rock"],
          bs: { hp: 105, at: 130, df: 120, sp: 40, sl: 45 },
          weightkg: 120
        },
        Rhyhorn: {
          types: ["Ground", "Rock"],
          bs: { hp: 80, at: 85, df: 95, sp: 25, sl: 30 },
          weightkg: 115,
          nfe: true
        },
        Sandshrew: {
          types: ["Ground"],
          bs: { hp: 50, at: 75, df: 85, sp: 40, sl: 30 },
          weightkg: 12,
          nfe: true
        },
        Sandslash: {
          types: ["Ground"],
          bs: { hp: 75, at: 100, df: 110, sp: 65, sl: 55 },
          weightkg: 29.5
        },
        Scyther: {
          types: ["Bug", "Flying"],
          bs: { hp: 70, at: 110, df: 80, sp: 105, sl: 55 },
          weightkg: 56
        },
        Seadra: { types: ["Water"], bs: { hp: 55, at: 65, df: 95, sp: 85, sl: 95 }, weightkg: 25 },
        Seaking: { types: ["Water"], bs: { hp: 80, at: 92, df: 65, sp: 68, sl: 80 }, weightkg: 39 },
        Seel: {
          types: ["Water"],
          bs: { hp: 65, at: 45, df: 55, sp: 45, sl: 70 },
          weightkg: 90,
          nfe: true
        },
        Shellder: {
          types: ["Water"],
          bs: { hp: 30, at: 65, df: 100, sp: 40, sl: 45 },
          weightkg: 4,
          nfe: true
        },
        Slowbro: {
          types: ["Water", "Psychic"],
          bs: { hp: 95, at: 75, df: 110, sp: 30, sl: 80 },
          weightkg: 78.5
        },
        Slowpoke: {
          types: ["Water", "Psychic"],
          bs: { hp: 90, at: 65, df: 65, sp: 15, sl: 40 },
          weightkg: 36,
          nfe: true
        },
        Snorlax: {
          types: ["Normal"],
          bs: { hp: 160, at: 110, df: 65, sp: 30, sl: 65 },
          weightkg: 460
        },
        Spearow: {
          types: ["Normal", "Flying"],
          bs: { hp: 40, at: 60, df: 30, sp: 70, sl: 31 },
          weightkg: 2,
          nfe: true
        },
        Squirtle: {
          types: ["Water"],
          bs: { hp: 44, at: 48, df: 65, sp: 43, sl: 50 },
          weightkg: 9,
          nfe: true
        },
        Starmie: {
          types: ["Water", "Psychic"],
          bs: { hp: 60, at: 75, df: 85, sp: 115, sl: 100 },
          weightkg: 80
        },
        Staryu: {
          types: ["Water"],
          bs: { hp: 30, at: 45, df: 55, sp: 85, sl: 70 },
          weightkg: 34.5,
          nfe: true
        },
        Tangela: {
          types: ["Grass"],
          bs: { hp: 65, at: 55, df: 115, sp: 60, sl: 100 },
          weightkg: 35
        },
        Tauros: {
          types: ["Normal"],
          bs: { hp: 75, at: 100, df: 95, sp: 110, sl: 70 },
          weightkg: 88.4
        },
        Tentacool: {
          types: ["Water", "Poison"],
          bs: { hp: 40, at: 40, df: 35, sp: 70, sl: 100 },
          weightkg: 45.5,
          nfe: true
        },
        Tentacruel: {
          types: ["Water", "Poison"],
          bs: { hp: 80, at: 70, df: 65, sp: 100, sl: 120 },
          weightkg: 55
        },
        Vaporeon: {
          types: ["Water"],
          bs: { hp: 130, at: 65, df: 60, sp: 65, sl: 110 },
          weightkg: 29
        },
        Venomoth: {
          types: ["Bug", "Poison"],
          bs: { hp: 70, at: 65, df: 60, sp: 90, sl: 90 },
          weightkg: 12.5
        },
        Venonat: {
          types: ["Bug", "Poison"],
          bs: { hp: 60, at: 55, df: 50, sp: 45, sl: 40 },
          weightkg: 30,
          nfe: true
        },
        Venusaur: {
          types: ["Grass", "Poison"],
          bs: { hp: 80, at: 82, df: 83, sp: 80, sl: 100 },
          weightkg: 100
        },
        Victreebel: {
          types: ["Grass", "Poison"],
          bs: { hp: 80, at: 105, df: 65, sp: 70, sl: 100 },
          weightkg: 15.5
        },
        Vileplume: {
          types: ["Grass", "Poison"],
          bs: { hp: 75, at: 80, df: 85, sp: 50, sl: 100 },
          weightkg: 18.6
        },
        Voltorb: {
          types: ["Electric"],
          bs: { hp: 40, at: 30, df: 50, sp: 100, sl: 55 },
          weightkg: 10.4,
          nfe: true
        },
        Vulpix: {
          types: ["Fire"],
          bs: { hp: 38, at: 41, df: 40, sp: 65, sl: 65 },
          weightkg: 9.9,
          nfe: true
        },
        Wartortle: {
          types: ["Water"],
          bs: { hp: 59, at: 63, df: 80, sp: 58, sl: 65 },
          weightkg: 22.5,
          nfe: true
        },
        Weedle: {
          types: ["Bug", "Poison"],
          bs: { hp: 40, at: 35, df: 30, sp: 50, sl: 20 },
          weightkg: 3.2,
          nfe: true
        },
        Weepinbell: {
          types: ["Grass", "Poison"],
          bs: { hp: 65, at: 90, df: 50, sp: 55, sl: 85 },
          weightkg: 6.4,
          nfe: true
        },
        Weezing: {
          types: ["Poison"],
          bs: { hp: 65, at: 90, df: 120, sp: 60, sl: 85 },
          weightkg: 9.5
        },
        Wigglytuff: {
          types: ["Normal"],
          bs: { hp: 140, at: 70, df: 45, sp: 45, sl: 50 },
          weightkg: 12
        },
        Zapdos: {
          types: ["Electric", "Flying"],
          bs: { hp: 90, at: 90, df: 85, sp: 100, sl: 125 },
          weightkg: 52.6
        },
        Zubat: {
          types: ["Poison", "Flying"],
          bs: { hp: 40, at: 45, df: 35, sp: 55, sl: 40 },
          weightkg: 7.5,
          nfe: true
        }
      };
      var GSC_PATCH = {
        Abra: { bs: { sa: 105, sd: 55 } },
        Aerodactyl: { bs: { sa: 60, sd: 75 } },
        Alakazam: { bs: { sa: 135, sd: 85 } },
        Arbok: { bs: { sa: 65, sd: 79 } },
        Arcanine: { bs: { sa: 100, sd: 80 } },
        Articuno: { bs: { sa: 95, sd: 125 }, gender: "N" },
        Beedrill: { bs: { sa: 45, sd: 80 } },
        Bellsprout: { bs: { sa: 70, sd: 30 } },
        Blastoise: { bs: { sa: 85, sd: 105 } },
        Bulbasaur: { bs: { sa: 65, sd: 65 } },
        Butterfree: { bs: { sa: 80, sd: 80 } },
        Caterpie: { bs: { sa: 20, sd: 20 } },
        Chansey: { bs: { sa: 35, sd: 105 }, nfe: true },
        Charizard: { bs: { sa: 109, sd: 85 } },
        Charmander: { bs: { sa: 60, sd: 50 } },
        Charmeleon: { bs: { sa: 80, sd: 65 } },
        Clefable: { bs: { sa: 85, sd: 90 } },
        Clefairy: { bs: { sa: 60, sd: 65 } },
        Cloyster: { bs: { sa: 85, sd: 45 } },
        Cubone: { bs: { sa: 40, sd: 50 } },
        Dewgong: { bs: { sa: 70, sd: 95 } },
        Diglett: { bs: { sa: 35, sd: 45 } },
        Ditto: { bs: { sa: 48, sd: 48 }, gender: "N" },
        Dodrio: { bs: { sa: 60, sd: 60 } },
        Doduo: { bs: { sa: 35, sd: 35 } },
        Dragonair: { bs: { sa: 70, sd: 70 } },
        Dragonite: { bs: { sa: 100, sd: 100 } },
        Dratini: { bs: { sa: 50, sd: 50 } },
        Drowzee: { bs: { sa: 43, sd: 90 } },
        Dugtrio: { bs: { sa: 50, sd: 70 } },
        Eevee: { bs: { sa: 45, sd: 65 } },
        Ekans: { bs: { sa: 40, sd: 54 } },
        Electabuzz: { bs: { sa: 95, sd: 85 } },
        Electrode: { bs: { sa: 80, sd: 80 }, gender: "N" },
        Exeggcute: { bs: { sa: 60, sd: 45 } },
        Exeggutor: { bs: { sa: 125, sd: 65 } },
        "Farfetch\u2019d": { bs: { sa: 58, sd: 62 } },
        Fearow: { bs: { sa: 61, sd: 61 } },
        Flareon: { bs: { sa: 95, sd: 110 } },
        Gastly: { bs: { sa: 100, sd: 35 } },
        Gengar: { bs: { sa: 130, sd: 75 } },
        Geodude: { bs: { sa: 30, sd: 30 } },
        Gloom: { bs: { sa: 85, sd: 75 } },
        Golbat: { bs: { sa: 65, sd: 75 }, nfe: true },
        Goldeen: { bs: { sa: 35, sd: 50 } },
        Golduck: { bs: { sa: 95, sd: 80 } },
        Golem: { bs: { sa: 55, sd: 65 } },
        Graveler: { bs: { sa: 45, sd: 45 } },
        Grimer: { bs: { sa: 40, sd: 50 } },
        Growlithe: { bs: { sa: 70, sd: 50 } },
        Gyarados: { bs: { sa: 60, sd: 100 } },
        Haunter: { bs: { sa: 115, sd: 55 } },
        Hitmonchan: { bs: { sa: 35, sd: 110 } },
        Hitmonlee: { bs: { sa: 35, sd: 110 } },
        Horsea: { bs: { sa: 70, sd: 25 } },
        Hypno: { bs: { sa: 73, sd: 115 } },
        Ivysaur: { bs: { sa: 80, sd: 80 } },
        Jigglypuff: { bs: { sa: 45, sd: 25 } },
        Jolteon: { bs: { sa: 110, sd: 95 } },
        Jynx: { bs: { sa: 115, sd: 95 } },
        Kabuto: { bs: { sa: 55, sd: 45 } },
        Kabutops: { bs: { sa: 65, sd: 70 } },
        Kadabra: { bs: { sa: 120, sd: 70 } },
        Kakuna: { bs: { sa: 25, sd: 25 } },
        Kangaskhan: { bs: { sa: 40, sd: 80 } },
        Kingler: { bs: { sa: 50, sd: 50 } },
        Koffing: { bs: { sa: 60, sd: 45 } },
        Krabby: { bs: { sa: 25, sd: 25 } },
        Lapras: { bs: { sa: 85, sd: 95 } },
        Lickitung: { bs: { sa: 60, sd: 75 } },
        Machamp: { bs: { sa: 65, sd: 85 } },
        Machoke: { bs: { sa: 50, sd: 60 } },
        Machop: { bs: { sa: 35, sd: 35 } },
        Magikarp: { bs: { sa: 15, sd: 20 } },
        Magmar: { bs: { sa: 100, sd: 85 } },
        Magnemite: { types: ["Electric", "Steel"], bs: { sa: 95, sd: 55 }, gender: "N" },
        Magneton: { types: ["Electric", "Steel"], bs: { sa: 120, sd: 70 }, gender: "N" },
        Mankey: { bs: { sa: 35, sd: 45 } },
        Marowak: { bs: { sa: 50, sd: 80 } },
        Meowth: { bs: { sa: 40, sd: 40 } },
        Metapod: { bs: { sa: 25, sd: 25 } },
        Mew: { bs: { sa: 100, sd: 100 }, gender: "N" },
        Mewtwo: { bs: { sa: 154, sd: 90 }, gender: "N" },
        Moltres: { bs: { sa: 125, sd: 85 }, gender: "N" },
        "Mr. Mime": { bs: { sa: 100, sd: 120 } },
        Muk: { bs: { sa: 65, sd: 100 } },
        Nidoking: { bs: { sa: 85, sd: 75 } },
        Nidoqueen: { bs: { sa: 75, sd: 85 } },
        "Nidoran-F": { bs: { sa: 40, sd: 40 } },
        "Nidoran-M": { bs: { sa: 40, sd: 40 } },
        Nidorina: { bs: { sa: 55, sd: 55 } },
        Nidorino: { bs: { sa: 55, sd: 55 } },
        Ninetales: { bs: { sa: 81, sd: 100 } },
        Oddish: { bs: { sa: 75, sd: 65 } },
        Omanyte: { bs: { sa: 90, sd: 55 } },
        Omastar: { bs: { sa: 115, sd: 70 } },
        Onix: { bs: { sa: 30, sd: 45 }, nfe: true },
        Paras: { bs: { sa: 45, sd: 55 } },
        Parasect: { bs: { sa: 60, sd: 80 } },
        Persian: { bs: { sa: 65, sd: 65 } },
        Pidgeot: { bs: { sa: 70, sd: 70 } },
        Pidgeotto: { bs: { sa: 50, sd: 50 } },
        Pidgey: { bs: { sa: 35, sd: 35 } },
        Pikachu: { bs: { sa: 50, sd: 40 } },
        Pinsir: { bs: { sa: 55, sd: 70 } },
        Poliwag: { bs: { sa: 40, sd: 40 } },
        Poliwhirl: { bs: { sa: 50, sd: 50 } },
        Poliwrath: { bs: { sa: 70, sd: 90 } },
        Ponyta: { bs: { sa: 65, sd: 65 } },
        Porygon: { bs: { sa: 85, sd: 75 }, nfe: true, gender: "N" },
        Primeape: { bs: { sa: 60, sd: 70 } },
        Psyduck: { bs: { sa: 65, sd: 50 } },
        Raichu: { bs: { sa: 90, sd: 80 } },
        Rapidash: { bs: { sa: 80, sd: 80 } },
        Raticate: { bs: { sa: 50, sd: 70 } },
        Rattata: { bs: { sa: 25, sd: 35 } },
        Rhydon: { bs: { sa: 45, sd: 45 } },
        Rhyhorn: { bs: { sa: 30, sd: 30 } },
        Sandshrew: { bs: { sa: 20, sd: 30 } },
        Sandslash: { bs: { sa: 45, sd: 55 } },
        Scyther: { bs: { sa: 55, sd: 80 }, nfe: true },
        Seadra: { bs: { sa: 95, sd: 45 }, nfe: true },
        Seaking: { bs: { sa: 65, sd: 80 } },
        Seel: { bs: { sa: 45, sd: 70 } },
        Shellder: { bs: { sa: 45, sd: 25 } },
        Slowbro: { bs: { sa: 100, sd: 80 } },
        Slowpoke: { bs: { sa: 40, sd: 40 } },
        Snorlax: { bs: { sa: 65, sd: 110 } },
        Spearow: { bs: { sa: 31, sd: 31 } },
        Squirtle: { bs: { sa: 50, sd: 64 } },
        Starmie: { bs: { sa: 100, sd: 85 }, gender: "N" },
        Staryu: { bs: { sa: 70, sd: 55 }, gender: "N" },
        Tangela: { bs: { sa: 100, sd: 40 } },
        Tauros: { bs: { sa: 40, sd: 70 } },
        Tentacool: { bs: { sa: 50, sd: 100 } },
        Tentacruel: { bs: { sa: 80, sd: 120 } },
        Vaporeon: { bs: { sa: 110, sd: 95 } },
        Venomoth: { bs: { sa: 90, sd: 75 } },
        Venonat: { bs: { sa: 40, sd: 55 } },
        Venusaur: { bs: { sa: 100, sd: 100 } },
        Victreebel: { bs: { sa: 100, sd: 60 } },
        Vileplume: { bs: { sa: 100, sd: 90 } },
        Voltorb: { bs: { sa: 55, sd: 55 }, gender: "N" },
        Vulpix: { bs: { sa: 50, sd: 65 } },
        Wartortle: { bs: { sa: 65, sd: 80 } },
        Weedle: { bs: { sa: 20, sd: 20 } },
        Weepinbell: { bs: { sa: 85, sd: 45 } },
        Weezing: { bs: { sa: 85, sd: 70 } },
        Wigglytuff: { bs: { sa: 75, sd: 50 } },
        Zapdos: { bs: { sa: 125, sd: 90 }, gender: "N" },
        Zubat: { bs: { sa: 30, sd: 40 } },
        Aipom: { types: ["Normal"], bs: { hp: 55, at: 70, df: 55, sa: 40, sd: 55, sp: 85 }, weightkg: 11.5 },
        Ampharos: {
          types: ["Electric"],
          bs: { hp: 90, at: 75, df: 75, sa: 115, sd: 90, sp: 55 },
          weightkg: 61.5
        },
        Ariados: {
          types: ["Bug", "Poison"],
          bs: { hp: 70, at: 90, df: 70, sa: 60, sd: 60, sp: 40 },
          weightkg: 33.5
        },
        Azumarill: {
          types: ["Water"],
          bs: { hp: 100, at: 50, df: 80, sa: 50, sd: 80, sp: 50 },
          weightkg: 28.5
        },
        Bayleef: {
          types: ["Grass"],
          bs: { hp: 60, at: 62, df: 80, sa: 63, sd: 80, sp: 60 },
          weightkg: 15.8,
          nfe: true
        },
        Bellossom: {
          types: ["Grass"],
          bs: { hp: 75, at: 80, df: 85, sa: 90, sd: 100, sp: 50 },
          weightkg: 5.8
        },
        Blissey: {
          types: ["Normal"],
          bs: { hp: 255, at: 10, df: 10, sa: 75, sd: 135, sp: 55 },
          weightkg: 46.8
        },
        Celebi: {
          types: ["Psychic", "Grass"],
          bs: { hp: 100, at: 100, df: 100, sa: 100, sd: 100, sp: 100 },
          weightkg: 5,
          gender: "N"
        },
        Chikorita: {
          types: ["Grass"],
          bs: { hp: 45, at: 49, df: 65, sa: 49, sd: 65, sp: 45 },
          weightkg: 6.4,
          nfe: true
        },
        Chinchou: {
          types: ["Water", "Electric"],
          bs: { hp: 75, at: 38, df: 38, sa: 56, sd: 56, sp: 67 },
          weightkg: 12,
          nfe: true
        },
        Cleffa: {
          types: ["Normal"],
          bs: { hp: 50, at: 25, df: 28, sa: 45, sd: 55, sp: 15 },
          weightkg: 3,
          nfe: true
        },
        Corsola: {
          types: ["Water", "Rock"],
          bs: { hp: 55, at: 55, df: 85, sa: 65, sd: 85, sp: 35 },
          weightkg: 5
        },
        Crobat: {
          types: ["Poison", "Flying"],
          bs: { hp: 85, at: 90, df: 80, sa: 70, sd: 80, sp: 130 },
          weightkg: 75
        },
        Croconaw: {
          types: ["Water"],
          bs: { hp: 65, at: 80, df: 80, sa: 59, sd: 63, sp: 58 },
          weightkg: 25,
          nfe: true
        },
        Cyndaquil: {
          types: ["Fire"],
          bs: { hp: 39, at: 52, df: 43, sa: 60, sd: 50, sp: 65 },
          weightkg: 7.9,
          nfe: true
        },
        Delibird: {
          types: ["Ice", "Flying"],
          bs: { hp: 45, at: 55, df: 45, sa: 65, sd: 45, sp: 75 },
          weightkg: 16
        },
        Donphan: {
          types: ["Ground"],
          bs: { hp: 90, at: 120, df: 120, sa: 60, sd: 60, sp: 50 },
          weightkg: 120
        },
        Dunsparce: {
          types: ["Normal"],
          bs: { hp: 100, at: 70, df: 70, sa: 65, sd: 65, sp: 45 },
          weightkg: 14
        },
        Elekid: {
          types: ["Electric"],
          bs: { hp: 45, at: 63, df: 37, sa: 65, sd: 55, sp: 95 },
          weightkg: 23.5,
          nfe: true
        },
        Entei: {
          types: ["Fire"],
          bs: { hp: 115, at: 115, df: 85, sa: 90, sd: 75, sp: 100 },
          weightkg: 198,
          gender: "N"
        },
        Espeon: {
          types: ["Psychic"],
          bs: { hp: 65, at: 65, df: 60, sa: 130, sd: 95, sp: 110 },
          weightkg: 26.5
        },
        Feraligatr: {
          types: ["Water"],
          bs: { hp: 85, at: 105, df: 100, sa: 79, sd: 83, sp: 78 },
          weightkg: 88.8
        },
        Flaaffy: {
          types: ["Electric"],
          bs: { hp: 70, at: 55, df: 55, sa: 80, sd: 60, sp: 45 },
          weightkg: 13.3,
          nfe: true
        },
        Forretress: {
          types: ["Bug", "Steel"],
          bs: { hp: 75, at: 90, df: 140, sa: 60, sd: 60, sp: 40 },
          weightkg: 125.8
        },
        Furret: { types: ["Normal"], bs: { hp: 85, at: 76, df: 64, sa: 45, sd: 55, sp: 90 }, weightkg: 32.5 },
        Girafarig: {
          types: ["Normal", "Psychic"],
          bs: { hp: 70, at: 80, df: 65, sa: 90, sd: 65, sp: 85 },
          weightkg: 41.5
        },
        Gligar: {
          types: ["Ground", "Flying"],
          bs: { hp: 65, at: 75, df: 105, sa: 35, sd: 65, sp: 85 },
          weightkg: 64.8
        },
        Granbull: {
          types: ["Normal"],
          bs: { hp: 90, at: 120, df: 75, sa: 60, sd: 60, sp: 45 },
          weightkg: 48.7
        },
        Heracross: {
          types: ["Bug", "Fighting"],
          bs: { hp: 80, at: 125, df: 75, sa: 40, sd: 95, sp: 85 },
          weightkg: 54
        },
        Hitmontop: {
          types: ["Fighting"],
          bs: { hp: 50, at: 95, df: 95, sa: 35, sd: 110, sp: 70 },
          weightkg: 48
        },
        "Ho-Oh": {
          types: ["Fire", "Flying"],
          bs: { hp: 106, at: 130, df: 90, sa: 110, sd: 154, sp: 90 },
          weightkg: 199,
          gender: "N"
        },
        Hoothoot: {
          types: ["Normal", "Flying"],
          bs: { hp: 60, at: 30, df: 30, sa: 36, sd: 56, sp: 50 },
          weightkg: 21.2,
          nfe: true
        },
        Hoppip: {
          types: ["Grass", "Flying"],
          bs: { hp: 35, at: 35, df: 40, sa: 35, sd: 55, sp: 50 },
          weightkg: 0.5,
          nfe: true
        },
        Houndoom: {
          types: ["Dark", "Fire"],
          bs: { hp: 75, at: 90, df: 50, sa: 110, sd: 80, sp: 95 },
          weightkg: 35
        },
        Houndour: {
          types: ["Dark", "Fire"],
          bs: { hp: 45, at: 60, df: 30, sa: 80, sd: 50, sp: 65 },
          weightkg: 10.8,
          nfe: true
        },
        Igglybuff: {
          types: ["Normal"],
          bs: { hp: 90, at: 30, df: 15, sa: 40, sd: 20, sp: 15 },
          weightkg: 1,
          nfe: true
        },
        Jumpluff: {
          types: ["Grass", "Flying"],
          bs: { hp: 75, at: 55, df: 70, sa: 55, sd: 85, sp: 110 },
          weightkg: 3
        },
        Kingdra: {
          types: ["Water", "Dragon"],
          bs: { hp: 75, at: 95, df: 95, sa: 95, sd: 95, sp: 85 },
          weightkg: 152
        },
        Lanturn: {
          types: ["Water", "Electric"],
          bs: { hp: 125, at: 58, df: 58, sa: 76, sd: 76, sp: 67 },
          weightkg: 22.5
        },
        Larvitar: {
          types: ["Rock", "Ground"],
          bs: { hp: 50, at: 64, df: 50, sa: 45, sd: 50, sp: 41 },
          weightkg: 72,
          nfe: true
        },
        Ledian: {
          types: ["Bug", "Flying"],
          bs: { hp: 55, at: 35, df: 50, sa: 55, sd: 110, sp: 85 },
          weightkg: 35.6
        },
        Ledyba: {
          types: ["Bug", "Flying"],
          bs: { hp: 40, at: 20, df: 30, sa: 40, sd: 80, sp: 55 },
          weightkg: 10.8,
          nfe: true
        },
        Lugia: {
          types: ["Psychic", "Flying"],
          bs: { hp: 106, at: 90, df: 130, sa: 90, sd: 154, sp: 110 },
          weightkg: 216,
          gender: "N"
        },
        Magby: {
          types: ["Fire"],
          bs: { hp: 45, at: 75, df: 37, sa: 70, sd: 55, sp: 83 },
          weightkg: 21.4,
          nfe: true
        },
        Magcargo: {
          types: ["Fire", "Rock"],
          bs: { hp: 50, at: 50, df: 120, sa: 80, sd: 80, sp: 30 },
          weightkg: 55
        },
        Mantine: {
          types: ["Water", "Flying"],
          bs: { hp: 65, at: 40, df: 70, sa: 80, sd: 140, sp: 70 },
          weightkg: 220
        },
        Mareep: {
          types: ["Electric"],
          bs: { hp: 55, at: 40, df: 40, sa: 65, sd: 45, sp: 35 },
          weightkg: 7.8,
          nfe: true
        },
        Marill: {
          types: ["Water"],
          bs: { hp: 70, at: 20, df: 50, sa: 20, sd: 50, sp: 40 },
          weightkg: 8.5,
          nfe: true
        },
        Meganium: {
          types: ["Grass"],
          bs: { hp: 80, at: 82, df: 100, sa: 83, sd: 100, sp: 80 },
          weightkg: 100.5
        },
        Miltank: {
          types: ["Normal"],
          bs: { hp: 95, at: 80, df: 105, sa: 40, sd: 70, sp: 100 },
          weightkg: 75.5
        },
        Misdreavus: {
          types: ["Ghost"],
          bs: { hp: 60, at: 60, df: 60, sa: 85, sd: 85, sp: 85 },
          weightkg: 1
        },
        Murkrow: {
          types: ["Dark", "Flying"],
          bs: { hp: 60, at: 85, df: 42, sa: 85, sd: 42, sp: 91 },
          weightkg: 2.1
        },
        Natu: {
          types: ["Psychic", "Flying"],
          bs: { hp: 40, at: 50, df: 45, sa: 70, sd: 45, sp: 70 },
          weightkg: 2,
          nfe: true
        },
        Noctowl: {
          types: ["Normal", "Flying"],
          bs: { hp: 100, at: 50, df: 50, sa: 76, sd: 96, sp: 70 },
          weightkg: 40.8
        },
        Octillery: {
          types: ["Water"],
          bs: { hp: 75, at: 105, df: 75, sa: 105, sd: 75, sp: 45 },
          weightkg: 28.5
        },
        Phanpy: {
          types: ["Ground"],
          bs: { hp: 90, at: 60, df: 60, sa: 40, sd: 40, sp: 40 },
          weightkg: 33.5,
          nfe: true
        },
        Pichu: {
          types: ["Electric"],
          bs: { hp: 20, at: 40, df: 15, sa: 35, sd: 35, sp: 60 },
          weightkg: 2,
          nfe: true
        },
        Piloswine: {
          types: ["Ice", "Ground"],
          bs: { hp: 100, at: 100, df: 80, sa: 60, sd: 60, sp: 50 },
          weightkg: 55.8
        },
        Pineco: {
          types: ["Bug"],
          bs: { hp: 50, at: 65, df: 90, sa: 35, sd: 35, sp: 15 },
          weightkg: 7.2,
          nfe: true
        },
        Politoed: {
          types: ["Water"],
          bs: { hp: 90, at: 75, df: 75, sa: 90, sd: 100, sp: 70 },
          weightkg: 33.9
        },
        Porygon2: {
          types: ["Normal"],
          bs: { hp: 85, at: 80, df: 90, sa: 105, sd: 95, sp: 60 },
          weightkg: 32.5,
          gender: "N"
        },
        Pupitar: {
          types: ["Rock", "Ground"],
          bs: { hp: 70, at: 84, df: 70, sa: 65, sd: 70, sp: 51 },
          weightkg: 152,
          nfe: true
        },
        Quagsire: {
          types: ["Water", "Ground"],
          bs: { hp: 95, at: 85, df: 85, sa: 65, sd: 65, sp: 35 },
          weightkg: 75
        },
        Quilava: {
          types: ["Fire"],
          bs: { hp: 58, at: 64, df: 58, sa: 80, sd: 65, sp: 80 },
          weightkg: 19,
          nfe: true
        },
        Qwilfish: {
          types: ["Water", "Poison"],
          bs: { hp: 65, at: 95, df: 75, sa: 55, sd: 55, sp: 85 },
          weightkg: 3.9
        },
        Raikou: {
          types: ["Electric"],
          bs: { hp: 90, at: 85, df: 75, sa: 115, sd: 100, sp: 115 },
          weightkg: 178,
          gender: "N"
        },
        Remoraid: {
          types: ["Water"],
          bs: { hp: 35, at: 65, df: 35, sa: 65, sd: 35, sp: 65 },
          weightkg: 12,
          nfe: true
        },
        Scizor: {
          types: ["Bug", "Steel"],
          bs: { hp: 70, at: 130, df: 100, sa: 55, sd: 80, sp: 65 },
          weightkg: 118
        },
        Sentret: {
          types: ["Normal"],
          bs: { hp: 35, at: 46, df: 34, sa: 35, sd: 45, sp: 20 },
          weightkg: 6,
          nfe: true
        },
        Shuckle: {
          types: ["Bug", "Rock"],
          bs: { hp: 20, at: 10, df: 230, sa: 10, sd: 230, sp: 5 },
          weightkg: 20.5
        },
        Skarmory: {
          types: ["Steel", "Flying"],
          bs: { hp: 65, at: 80, df: 140, sa: 40, sd: 70, sp: 70 },
          weightkg: 50.5
        },
        Skiploom: {
          types: ["Grass", "Flying"],
          bs: { hp: 55, at: 45, df: 50, sa: 45, sd: 65, sp: 80 },
          weightkg: 1,
          nfe: true
        },
        Slowking: {
          types: ["Water", "Psychic"],
          bs: { hp: 95, at: 75, df: 80, sa: 100, sd: 110, sp: 30 },
          weightkg: 79.5
        },
        Slugma: {
          types: ["Fire"],
          bs: { hp: 40, at: 40, df: 40, sa: 70, sd: 40, sp: 20 },
          weightkg: 35,
          nfe: true
        },
        Smeargle: { types: ["Normal"], bs: { hp: 55, at: 20, df: 35, sa: 20, sd: 45, sp: 75 }, weightkg: 58 },
        Smoochum: {
          types: ["Ice", "Psychic"],
          bs: { hp: 45, at: 30, df: 15, sa: 85, sd: 65, sp: 65 },
          weightkg: 6,
          nfe: true
        },
        Sneasel: {
          types: ["Dark", "Ice"],
          bs: { hp: 55, at: 95, df: 55, sa: 35, sd: 75, sp: 115 },
          weightkg: 28
        },
        Snubbull: {
          types: ["Normal"],
          bs: { hp: 60, at: 80, df: 50, sa: 40, sd: 40, sp: 30 },
          weightkg: 7.8,
          nfe: true
        },
        Spinarak: {
          types: ["Bug", "Poison"],
          bs: { hp: 40, at: 60, df: 40, sa: 40, sd: 40, sp: 30 },
          weightkg: 8.5,
          nfe: true
        },
        Stantler: {
          types: ["Normal"],
          bs: { hp: 73, at: 95, df: 62, sa: 85, sd: 65, sp: 85 },
          weightkg: 71.2
        },
        Steelix: {
          types: ["Steel", "Ground"],
          bs: { hp: 75, at: 85, df: 200, sa: 55, sd: 65, sp: 30 },
          weightkg: 400
        },
        Sudowoodo: {
          types: ["Rock"],
          bs: { hp: 70, at: 100, df: 115, sa: 30, sd: 65, sp: 30 },
          weightkg: 38
        },
        Suicune: {
          types: ["Water"],
          bs: { hp: 100, at: 75, df: 115, sa: 90, sd: 115, sp: 85 },
          weightkg: 187,
          gender: "N"
        },
        Sunflora: {
          types: ["Grass"],
          bs: { hp: 75, at: 75, df: 55, sa: 105, sd: 85, sp: 30 },
          weightkg: 8.5
        },
        Sunkern: {
          types: ["Grass"],
          bs: { hp: 30, at: 30, df: 30, sa: 30, sd: 30, sp: 30 },
          weightkg: 1.8,
          nfe: true
        },
        Swinub: {
          types: ["Ice", "Ground"],
          bs: { hp: 50, at: 50, df: 40, sa: 30, sd: 30, sp: 50 },
          weightkg: 6.5,
          nfe: true
        },
        Teddiursa: {
          types: ["Normal"],
          bs: { hp: 60, at: 80, df: 50, sa: 50, sd: 50, sp: 40 },
          weightkg: 8.8,
          nfe: true
        },
        Togepi: {
          types: ["Normal"],
          bs: { hp: 35, at: 20, df: 65, sa: 40, sd: 65, sp: 20 },
          weightkg: 1.5,
          nfe: true
        },
        Togetic: {
          types: ["Normal", "Flying"],
          bs: { hp: 55, at: 40, df: 85, sa: 80, sd: 105, sp: 40 },
          weightkg: 3.2
        },
        Totodile: {
          types: ["Water"],
          bs: { hp: 50, at: 65, df: 64, sa: 44, sd: 48, sp: 43 },
          weightkg: 9.5,
          nfe: true
        },
        Typhlosion: {
          types: ["Fire"],
          bs: { hp: 78, at: 84, df: 78, sa: 109, sd: 85, sp: 100 },
          weightkg: 79.5
        },
        Tyranitar: {
          types: ["Rock", "Dark"],
          bs: { hp: 100, at: 134, df: 110, sa: 95, sd: 100, sp: 61 },
          weightkg: 202
        },
        Tyrogue: {
          types: ["Fighting"],
          bs: { hp: 35, at: 35, df: 35, sa: 35, sd: 35, sp: 35 },
          weightkg: 21,
          nfe: true
        },
        Umbreon: { types: ["Dark"], bs: { hp: 95, at: 65, df: 110, sa: 60, sd: 130, sp: 65 }, weightkg: 27 },
        Unown: {
          types: ["Psychic"],
          bs: { hp: 48, at: 72, df: 48, sa: 72, sd: 48, sp: 48 },
          weightkg: 5,
          gender: "N"
        },
        Ursaring: {
          types: ["Normal"],
          bs: { hp: 90, at: 130, df: 75, sa: 75, sd: 75, sp: 55 },
          weightkg: 125.8
        },
        Wobbuffet: {
          types: ["Psychic"],
          bs: { hp: 190, at: 33, df: 58, sa: 33, sd: 58, sp: 33 },
          weightkg: 28.5
        },
        Wooper: {
          types: ["Water", "Ground"],
          bs: { hp: 55, at: 45, df: 45, sa: 25, sd: 25, sp: 15 },
          weightkg: 8.5,
          nfe: true
        },
        Xatu: {
          types: ["Psychic", "Flying"],
          bs: { hp: 65, at: 75, df: 70, sa: 95, sd: 70, sp: 95 },
          weightkg: 15
        },
        Yanma: {
          types: ["Bug", "Flying"],
          bs: { hp: 65, at: 65, df: 45, sa: 75, sd: 45, sp: 95 },
          weightkg: 38
        }
      };
      var GSC = (0, util_1.extend)(true, {}, RBY, GSC_PATCH);
      var ADV_PATCH = {
        Abra: { abilities: { 0: "Synchronize" } },
        Aerodactyl: { abilities: { 0: "Rock Head" } },
        Alakazam: { abilities: { 0: "Synchronize" } },
        Arbok: { abilities: { 0: "Intimidate" } },
        Arcanine: { abilities: { 0: "Intimidate" } },
        Articuno: { abilities: { 0: "Pressure" } },
        Beedrill: { abilities: { 0: "Swarm" } },
        Bellsprout: { abilities: { 0: "Chlorophyll" } },
        Blastoise: { abilities: { 0: "Torrent" } },
        Bulbasaur: { abilities: { 0: "Overgrow" } },
        Butterfree: { abilities: { 0: "Compound Eyes" } },
        Caterpie: { abilities: { 0: "Shield Dust" } },
        Chansey: { abilities: { 0: "Natural Cure" } },
        Charizard: { abilities: { 0: "Blaze" } },
        Charmander: { abilities: { 0: "Blaze" } },
        Charmeleon: { abilities: { 0: "Blaze" } },
        Clefable: { abilities: { 0: "Cute Charm" } },
        Clefairy: { abilities: { 0: "Cute Charm" } },
        Cloyster: { abilities: { 0: "Shell Armor" } },
        Cubone: { abilities: { 0: "Rock Head" } },
        Dewgong: { abilities: { 0: "Thick Fat" } },
        Diglett: { abilities: { 0: "Sand Veil" } },
        Ditto: { abilities: { 0: "Limber" } },
        Dodrio: { abilities: { 0: "Run Away" } },
        Doduo: { abilities: { 0: "Run Away" } },
        Dragonair: { abilities: { 0: "Shed Skin" } },
        Dragonite: { abilities: { 0: "Inner Focus" } },
        Dratini: { abilities: { 0: "Shed Skin" } },
        Drowzee: { abilities: { 0: "Insomnia" } },
        Dugtrio: { abilities: { 0: "Sand Veil" } },
        Eevee: { abilities: { 0: "Run Away" } },
        Ekans: { abilities: { 0: "Intimidate" } },
        Electabuzz: { abilities: { 0: "Static" } },
        Electrode: { abilities: { 0: "Soundproof" } },
        Exeggcute: { abilities: { 0: "Chlorophyll" } },
        Exeggutor: { abilities: { 0: "Chlorophyll" } },
        "Farfetch\u2019d": { abilities: { 0: "Keen Eye" } },
        Fearow: { abilities: { 0: "Keen Eye" } },
        Flareon: { abilities: { 0: "Flash Fire" } },
        Gastly: { abilities: { 0: "Levitate" } },
        Gengar: { abilities: { 0: "Levitate" } },
        Geodude: { abilities: { 0: "Rock Head" } },
        Gloom: { abilities: { 0: "Chlorophyll" } },
        Golbat: { abilities: { 0: "Inner Focus" } },
        Goldeen: { abilities: { 0: "Swift Swim" } },
        Golduck: { abilities: { 0: "Damp" } },
        Golem: { abilities: { 0: "Rock Head" } },
        Graveler: { abilities: { 0: "Rock Head" } },
        Grimer: { abilities: { 0: "Stench" } },
        Growlithe: { abilities: { 0: "Intimidate" } },
        Gyarados: { abilities: { 0: "Intimidate" } },
        Haunter: { abilities: { 0: "Levitate" } },
        Hitmonchan: { abilities: { 0: "Keen Eye" } },
        Hitmonlee: { abilities: { 0: "Limber" } },
        Horsea: { abilities: { 0: "Swift Swim" } },
        Hypno: { abilities: { 0: "Insomnia" } },
        Ivysaur: { abilities: { 0: "Overgrow" } },
        Jigglypuff: { abilities: { 0: "Cute Charm" } },
        Jolteon: { abilities: { 0: "Volt Absorb" } },
        Jynx: { abilities: { 0: "Oblivious" } },
        Kabuto: { abilities: { 0: "Swift Swim" } },
        Kabutops: { abilities: { 0: "Swift Swim" } },
        Kadabra: { abilities: { 0: "Synchronize" } },
        Kakuna: { abilities: { 0: "Shed Skin" } },
        Kangaskhan: { abilities: { 0: "Early Bird" } },
        Kingler: { abilities: { 0: "Hyper Cutter" } },
        Koffing: { abilities: { 0: "Levitate" } },
        Krabby: { abilities: { 0: "Hyper Cutter" } },
        Lapras: { abilities: { 0: "Water Absorb" } },
        Lickitung: { abilities: { 0: "Own Tempo" } },
        Machamp: { abilities: { 0: "Guts" } },
        Machoke: { abilities: { 0: "Guts" } },
        Machop: { abilities: { 0: "Guts" } },
        Magikarp: { abilities: { 0: "Swift Swim" } },
        Magmar: { abilities: { 0: "Flame Body" } },
        Magnemite: { abilities: { 0: "Magnet Pull" } },
        Magneton: { abilities: { 0: "Magnet Pull" } },
        Mankey: { abilities: { 0: "Vital Spirit" } },
        Marowak: { abilities: { 0: "Rock Head" } },
        Meowth: { abilities: { 0: "Pickup" } },
        Metapod: { abilities: { 0: "Shed Skin" } },
        Mew: { abilities: { 0: "Synchronize" } },
        Mewtwo: { abilities: { 0: "Pressure" } },
        Moltres: { abilities: { 0: "Pressure" } },
        "Mr. Mime": { abilities: { 0: "Soundproof" } },
        Muk: { abilities: { 0: "Stench" } },
        Nidoking: { abilities: { 0: "Poison Point" } },
        Nidoqueen: { abilities: { 0: "Poison Point" } },
        "Nidoran-F": { abilities: { 0: "Poison Point" } },
        "Nidoran-M": { abilities: { 0: "Poison Point" } },
        Nidorina: { abilities: { 0: "Poison Point" } },
        Nidorino: { abilities: { 0: "Poison Point" } },
        Ninetales: { abilities: { 0: "Flash Fire" } },
        Oddish: { abilities: { 0: "Chlorophyll" } },
        Omanyte: { abilities: { 0: "Swift Swim" } },
        Omastar: { abilities: { 0: "Swift Swim" } },
        Onix: { abilities: { 0: "Rock Head" } },
        Paras: { abilities: { 0: "Effect Spore" } },
        Parasect: { abilities: { 0: "Effect Spore" } },
        Persian: { abilities: { 0: "Limber" } },
        Pidgeot: { abilities: { 0: "Keen Eye" } },
        Pidgeotto: { abilities: { 0: "Keen Eye" } },
        Pidgey: { abilities: { 0: "Keen Eye" } },
        Pikachu: { abilities: { 0: "Static" } },
        Pinsir: { abilities: { 0: "Hyper Cutter" } },
        Poliwag: { abilities: { 0: "Water Absorb" } },
        Poliwhirl: { abilities: { 0: "Water Absorb" } },
        Poliwrath: { abilities: { 0: "Water Absorb" } },
        Ponyta: { abilities: { 0: "Run Away" } },
        Porygon: { abilities: { 0: "Trace" } },
        Primeape: { abilities: { 0: "Vital Spirit" } },
        Psyduck: { abilities: { 0: "Damp" } },
        Raichu: { abilities: { 0: "Static" } },
        Rapidash: { abilities: { 0: "Run Away" } },
        Raticate: { abilities: { 0: "Run Away" } },
        Rattata: { abilities: { 0: "Run Away" } },
        Rhydon: { abilities: { 0: "Lightning Rod" } },
        Rhyhorn: { abilities: { 0: "Lightning Rod" } },
        Sandshrew: { abilities: { 0: "Sand Veil" } },
        Sandslash: { abilities: { 0: "Sand Veil" } },
        Scyther: { abilities: { 0: "Swarm" } },
        Seadra: { abilities: { 0: "Poison Point" } },
        Seaking: { abilities: { 0: "Swift Swim" } },
        Seel: { abilities: { 0: "Thick Fat" } },
        Shellder: { abilities: { 0: "Shell Armor" } },
        Slowbro: { abilities: { 0: "Oblivious" } },
        Slowpoke: { abilities: { 0: "Oblivious" } },
        Snorlax: { abilities: { 0: "Immunity" } },
        Spearow: { abilities: { 0: "Keen Eye" } },
        Squirtle: { abilities: { 0: "Torrent" } },
        Starmie: { abilities: { 0: "Illuminate" } },
        Staryu: { abilities: { 0: "Illuminate" } },
        Tangela: { abilities: { 0: "Chlorophyll" } },
        Tauros: { abilities: { 0: "Intimidate" } },
        Tentacool: { abilities: { 0: "Clear Body" } },
        Tentacruel: { abilities: { 0: "Clear Body" } },
        Vaporeon: { abilities: { 0: "Water Absorb" } },
        Venomoth: { abilities: { 0: "Shield Dust" } },
        Venonat: { abilities: { 0: "Compound Eyes" } },
        Venusaur: { abilities: { 0: "Overgrow" } },
        Victreebel: { abilities: { 0: "Chlorophyll" } },
        Vileplume: { abilities: { 0: "Chlorophyll" } },
        Voltorb: { abilities: { 0: "Soundproof" } },
        Vulpix: { abilities: { 0: "Flash Fire" } },
        Wartortle: { abilities: { 0: "Torrent" } },
        Weedle: { abilities: { 0: "Shield Dust" } },
        Weepinbell: { abilities: { 0: "Chlorophyll" } },
        Weezing: { abilities: { 0: "Levitate" } },
        Wigglytuff: { abilities: { 0: "Cute Charm" } },
        Zapdos: { abilities: { 0: "Pressure" } },
        Zubat: { abilities: { 0: "Inner Focus" } },
        Aipom: { abilities: { 0: "Run Away" } },
        Ampharos: { abilities: { 0: "Static" } },
        Ariados: { abilities: { 0: "Swarm" } },
        Azumarill: { abilities: { 0: "Thick Fat" } },
        Bayleef: { abilities: { 0: "Overgrow" } },
        Bellossom: { abilities: { 0: "Chlorophyll" } },
        Blissey: { abilities: { 0: "Natural Cure" } },
        Celebi: { abilities: { 0: "Natural Cure" } },
        Chikorita: { abilities: { 0: "Overgrow" } },
        Chinchou: { abilities: { 0: "Volt Absorb" } },
        Cleffa: { abilities: { 0: "Cute Charm" } },
        Corsola: { abilities: { 0: "Hustle" } },
        Crobat: { abilities: { 0: "Inner Focus" } },
        Croconaw: { abilities: { 0: "Torrent" } },
        Cyndaquil: { abilities: { 0: "Blaze" } },
        Delibird: { abilities: { 0: "Vital Spirit" } },
        Donphan: { abilities: { 0: "Sturdy" } },
        Dunsparce: { abilities: { 0: "Serene Grace" } },
        Elekid: { abilities: { 0: "Static" } },
        Entei: { abilities: { 0: "Pressure" } },
        Espeon: { abilities: { 0: "Synchronize" } },
        Feraligatr: { abilities: { 0: "Torrent" } },
        Flaaffy: { abilities: { 0: "Static" } },
        Forretress: { abilities: { 0: "Sturdy" } },
        Furret: { abilities: { 0: "Run Away" } },
        Girafarig: { abilities: { 0: "Inner Focus" } },
        Gligar: { abilities: { 0: "Hyper Cutter" } },
        Granbull: { abilities: { 0: "Intimidate" } },
        Heracross: { abilities: { 0: "Swarm" } },
        Hitmontop: { abilities: { 0: "Intimidate" } },
        "Ho-Oh": { abilities: { 0: "Pressure" } },
        Hoothoot: { abilities: { 0: "Insomnia" } },
        Hoppip: { abilities: { 0: "Chlorophyll" } },
        Houndoom: { abilities: { 0: "Early Bird" } },
        Houndour: { abilities: { 0: "Early Bird" } },
        Igglybuff: { abilities: { 0: "Cute Charm" } },
        Jumpluff: { abilities: { 0: "Chlorophyll" } },
        Kingdra: { abilities: { 0: "Swift Swim" } },
        Lanturn: { abilities: { 0: "Volt Absorb" } },
        Larvitar: { abilities: { 0: "Guts" } },
        Ledian: { abilities: { 0: "Swarm" } },
        Ledyba: { abilities: { 0: "Swarm" } },
        Lugia: { abilities: { 0: "Pressure" } },
        Magby: { abilities: { 0: "Flame Body" } },
        Magcargo: { abilities: { 0: "Magma Armor" } },
        Mantine: { abilities: { 0: "Swift Swim" } },
        Mareep: { abilities: { 0: "Static" } },
        Marill: { abilities: { 0: "Thick Fat" } },
        Meganium: { abilities: { 0: "Overgrow" } },
        Miltank: { abilities: { 0: "Thick Fat" } },
        Misdreavus: { abilities: { 0: "Levitate" } },
        Murkrow: { abilities: { 0: "Insomnia" } },
        Natu: { abilities: { 0: "Synchronize" } },
        Noctowl: { abilities: { 0: "Insomnia" } },
        Octillery: { abilities: { 0: "Suction Cups" } },
        Phanpy: { abilities: { 0: "Pickup" } },
        Pichu: { abilities: { 0: "Static" } },
        Piloswine: { abilities: { 0: "Oblivious" } },
        Pineco: { abilities: { 0: "Sturdy" } },
        Politoed: { abilities: { 0: "Water Absorb" } },
        Porygon2: { abilities: { 0: "Trace" } },
        Pupitar: { abilities: { 0: "Shed Skin" } },
        Quagsire: { abilities: { 0: "Damp" } },
        Quilava: { abilities: { 0: "Blaze" } },
        Qwilfish: { abilities: { 0: "Poison Point" } },
        Raikou: { abilities: { 0: "Pressure" } },
        Remoraid: { abilities: { 0: "Hustle" } },
        Scizor: { abilities: { 0: "Swarm" } },
        Sentret: { abilities: { 0: "Run Away" } },
        Shuckle: { abilities: { 0: "Sturdy" } },
        Skarmory: { abilities: { 0: "Keen Eye" } },
        Skiploom: { abilities: { 0: "Chlorophyll" } },
        Slowking: { abilities: { 0: "Oblivious" } },
        Slugma: { abilities: { 0: "Magma Armor" } },
        Smeargle: { abilities: { 0: "Own Tempo" } },
        Smoochum: { abilities: { 0: "Oblivious" } },
        Sneasel: { abilities: { 0: "Inner Focus" } },
        Snubbull: { abilities: { 0: "Intimidate" } },
        Spinarak: { abilities: { 0: "Swarm" } },
        Stantler: { abilities: { 0: "Intimidate" } },
        Steelix: { abilities: { 0: "Rock Head" } },
        Sudowoodo: { abilities: { 0: "Sturdy" } },
        Suicune: { abilities: { 0: "Pressure" } },
        Sunflora: { abilities: { 0: "Chlorophyll" } },
        Sunkern: { abilities: { 0: "Chlorophyll" } },
        Swinub: { abilities: { 0: "Oblivious" } },
        Teddiursa: { abilities: { 0: "Pickup" } },
        Togepi: { abilities: { 0: "Hustle" } },
        Togetic: { abilities: { 0: "Hustle" } },
        Totodile: { abilities: { 0: "Torrent" } },
        Typhlosion: { abilities: { 0: "Blaze" } },
        Tyranitar: { abilities: { 0: "Sand Stream" } },
        Tyrogue: { abilities: { 0: "Guts" } },
        Umbreon: { abilities: { 0: "Synchronize" } },
        Unown: { abilities: { 0: "Levitate" } },
        Ursaring: { abilities: { 0: "Guts" } },
        Wobbuffet: { abilities: { 0: "Shadow Tag" } },
        Wooper: { abilities: { 0: "Damp" } },
        Xatu: { abilities: { 0: "Synchronize" } },
        Yanma: { abilities: { 0: "Speed Boost" } },
        Absol: {
          types: ["Dark"],
          bs: { hp: 65, at: 130, df: 60, sa: 75, sd: 60, sp: 75 },
          weightkg: 47,
          abilities: { 0: "Pressure" }
        },
        Aggron: {
          types: ["Steel", "Rock"],
          bs: { hp: 70, at: 110, df: 180, sa: 60, sd: 60, sp: 50 },
          weightkg: 360,
          abilities: { 0: "Sturdy" }
        },
        Altaria: {
          types: ["Dragon", "Flying"],
          bs: { hp: 75, at: 70, df: 90, sa: 70, sd: 105, sp: 80 },
          weightkg: 20.6,
          abilities: { 0: "Natural Cure" }
        },
        Anorith: {
          types: ["Rock", "Bug"],
          bs: { hp: 45, at: 95, df: 50, sa: 40, sd: 50, sp: 75 },
          weightkg: 12.5,
          nfe: true,
          abilities: { 0: "Battle Armor" }
        },
        Armaldo: {
          types: ["Rock", "Bug"],
          bs: { hp: 75, at: 125, df: 100, sa: 70, sd: 80, sp: 45 },
          weightkg: 68.2,
          abilities: { 0: "Battle Armor" }
        },
        Aron: {
          types: ["Steel", "Rock"],
          bs: { hp: 50, at: 70, df: 100, sa: 40, sd: 40, sp: 30 },
          weightkg: 60,
          nfe: true,
          abilities: { 0: "Sturdy" }
        },
        Azurill: {
          types: ["Normal"],
          bs: { hp: 50, at: 20, df: 40, sa: 20, sd: 40, sp: 20 },
          weightkg: 2,
          nfe: true,
          abilities: { 0: "Thick Fat" }
        },
        Bagon: {
          types: ["Dragon"],
          bs: { hp: 45, at: 75, df: 60, sa: 40, sd: 30, sp: 50 },
          weightkg: 42.1,
          nfe: true,
          abilities: { 0: "Rock Head" }
        },
        Baltoy: {
          types: ["Ground", "Psychic"],
          bs: { hp: 40, at: 40, df: 55, sa: 40, sd: 70, sp: 55 },
          weightkg: 21.5,
          abilities: { 0: "Levitate" },
          nfe: true,
          gender: "N"
        },
        Banette: {
          types: ["Ghost"],
          bs: { hp: 64, at: 115, df: 65, sa: 83, sd: 63, sp: 65 },
          weightkg: 12.5,
          abilities: { 0: "Insomnia" }
        },
        Barboach: {
          types: ["Water", "Ground"],
          bs: { hp: 50, at: 48, df: 43, sa: 46, sd: 41, sp: 60 },
          weightkg: 1.9,
          nfe: true,
          abilities: { 0: "Oblivious" }
        },
        Beautifly: {
          types: ["Bug", "Flying"],
          bs: { hp: 60, at: 70, df: 50, sa: 90, sd: 50, sp: 65 },
          weightkg: 28.4,
          abilities: { 0: "Swarm" }
        },
        Beldum: {
          types: ["Steel", "Psychic"],
          bs: { hp: 40, at: 55, df: 80, sa: 35, sd: 60, sp: 30 },
          weightkg: 95.2,
          nfe: true,
          gender: "N",
          abilities: { 0: "Clear Body" }
        },
        Blaziken: {
          types: ["Fire", "Fighting"],
          bs: { hp: 80, at: 120, df: 70, sa: 110, sd: 70, sp: 80 },
          weightkg: 52,
          abilities: { 0: "Blaze" }
        },
        Breloom: {
          types: ["Grass", "Fighting"],
          bs: { hp: 60, at: 130, df: 80, sa: 60, sd: 60, sp: 70 },
          weightkg: 39.2,
          abilities: { 0: "Effect Spore" }
        },
        Cacnea: {
          types: ["Grass"],
          bs: { hp: 50, at: 85, df: 40, sa: 85, sd: 40, sp: 35 },
          weightkg: 51.3,
          nfe: true,
          abilities: { 0: "Sand Veil" }
        },
        Cacturne: {
          types: ["Grass", "Dark"],
          bs: { hp: 70, at: 115, df: 60, sa: 115, sd: 60, sp: 55 },
          weightkg: 77.4,
          abilities: { 0: "Sand Veil" }
        },
        Camerupt: {
          types: ["Fire", "Ground"],
          bs: { hp: 70, at: 100, df: 70, sa: 105, sd: 75, sp: 40 },
          weightkg: 220,
          abilities: { 0: "Magma Armor" }
        },
        Carvanha: {
          types: ["Water", "Dark"],
          bs: { hp: 45, at: 90, df: 20, sa: 65, sd: 20, sp: 65 },
          weightkg: 20.8,
          nfe: true,
          abilities: { 0: "Rough Skin" }
        },
        Cascoon: {
          types: ["Bug"],
          bs: { hp: 50, at: 35, df: 55, sa: 25, sd: 25, sp: 15 },
          weightkg: 11.5,
          abilities: { 0: "Shed Skin" },
          nfe: true
        },
        Castform: {
          types: ["Normal"],
          bs: { hp: 70, at: 70, df: 70, sa: 70, sd: 70, sp: 70 },
          weightkg: 0.8,
          abilities: { 0: "Forecast" },
          otherFormes: ["Castform-Rainy", "Castform-Snowy", "Castform-Sunny"]
        },
        "Castform-Rainy": {
          types: ["Water"],
          bs: { hp: 70, at: 70, df: 70, sa: 70, sd: 70, sp: 70 },
          weightkg: 0.8,
          abilities: { 0: "Forecast" },
          baseSpecies: "Castform"
        },
        "Castform-Snowy": {
          types: ["Ice"],
          bs: { hp: 70, at: 70, df: 70, sa: 70, sd: 70, sp: 70 },
          weightkg: 0.8,
          abilities: { 0: "Forecast" },
          baseSpecies: "Castform"
        },
        "Castform-Sunny": {
          types: ["Fire"],
          bs: { hp: 70, at: 70, df: 70, sa: 70, sd: 70, sp: 70 },
          weightkg: 0.8,
          abilities: { 0: "Forecast" },
          baseSpecies: "Castform"
        },
        Chimecho: {
          types: ["Psychic"],
          bs: { hp: 65, at: 50, df: 70, sa: 95, sd: 80, sp: 65 },
          weightkg: 1,
          abilities: { 0: "Levitate" }
        },
        Clamperl: {
          types: ["Water"],
          bs: { hp: 35, at: 64, df: 85, sa: 74, sd: 55, sp: 32 },
          weightkg: 52.5,
          nfe: true,
          abilities: { 0: "Shell Armor" }
        },
        Claydol: {
          types: ["Ground", "Psychic"],
          bs: { hp: 60, at: 70, df: 105, sa: 70, sd: 120, sp: 75 },
          weightkg: 108,
          abilities: { 0: "Levitate" },
          gender: "N"
        },
        Combusken: {
          types: ["Fire", "Fighting"],
          bs: { hp: 60, at: 85, df: 60, sa: 85, sd: 60, sp: 55 },
          weightkg: 19.5,
          nfe: true,
          abilities: { 0: "Blaze" }
        },
        Corphish: {
          types: ["Water"],
          bs: { hp: 43, at: 80, df: 65, sa: 50, sd: 35, sp: 35 },
          weightkg: 11.5,
          nfe: true,
          abilities: { 0: "Hyper Cutter" }
        },
        Cradily: {
          types: ["Rock", "Grass"],
          bs: { hp: 86, at: 81, df: 97, sa: 81, sd: 107, sp: 43 },
          weightkg: 60.4,
          abilities: { 0: "Suction Cups" }
        },
        Crawdaunt: {
          types: ["Water", "Dark"],
          bs: { hp: 63, at: 120, df: 85, sa: 90, sd: 55, sp: 55 },
          weightkg: 32.8,
          abilities: { 0: "Hyper Cutter" }
        },
        Delcatty: {
          types: ["Normal"],
          bs: { hp: 70, at: 65, df: 65, sa: 55, sd: 55, sp: 70 },
          weightkg: 32.6,
          abilities: { 0: "Cute Charm" }
        },
        Deoxys: {
          types: ["Psychic"],
          bs: { hp: 50, at: 150, df: 50, sa: 150, sd: 50, sp: 150 },
          weightkg: 60.8,
          abilities: { 0: "Pressure" },
          gender: "N",
          otherFormes: ["Deoxys-Attack", "Deoxys-Defense", "Deoxys-Speed"]
        },
        "Deoxys-Attack": {
          types: ["Psychic"],
          bs: { hp: 50, at: 180, df: 20, sa: 180, sd: 20, sp: 150 },
          weightkg: 60.8,
          abilities: { 0: "Pressure" },
          gender: "N",
          baseSpecies: "Deoxys"
        },
        "Deoxys-Defense": {
          types: ["Psychic"],
          bs: { hp: 50, at: 70, df: 160, sa: 70, sd: 160, sp: 90 },
          weightkg: 60.8,
          abilities: { 0: "Pressure" },
          gender: "N",
          baseSpecies: "Deoxys"
        },
        "Deoxys-Speed": {
          types: ["Psychic"],
          bs: { hp: 50, at: 95, df: 90, sa: 95, sd: 90, sp: 180 },
          weightkg: 60.8,
          abilities: { 0: "Pressure" },
          gender: "N",
          baseSpecies: "Deoxys"
        },
        Dusclops: {
          types: ["Ghost"],
          bs: { hp: 40, at: 70, df: 130, sa: 60, sd: 130, sp: 25 },
          weightkg: 30.6,
          abilities: { 0: "Pressure" }
        },
        Duskull: {
          types: ["Ghost"],
          bs: { hp: 20, at: 40, df: 90, sa: 30, sd: 90, sp: 25 },
          weightkg: 15,
          nfe: true,
          abilities: { 0: "Levitate" }
        },
        Dustox: {
          types: ["Bug", "Poison"],
          bs: { hp: 60, at: 50, df: 70, sa: 50, sd: 90, sp: 65 },
          weightkg: 31.6,
          abilities: { 0: "Shield Dust" }
        },
        Electrike: {
          types: ["Electric"],
          bs: { hp: 40, at: 45, df: 40, sa: 65, sd: 40, sp: 65 },
          weightkg: 15.2,
          nfe: true,
          abilities: { 0: "Static" }
        },
        Exploud: {
          types: ["Normal"],
          bs: { hp: 104, at: 91, df: 63, sa: 91, sd: 63, sp: 68 },
          weightkg: 84,
          abilities: { 0: "Soundproof" }
        },
        Feebas: {
          types: ["Water"],
          bs: { hp: 20, at: 15, df: 20, sa: 10, sd: 55, sp: 80 },
          weightkg: 7.4,
          nfe: true,
          abilities: { 0: "Swift Swim" }
        },
        Flygon: {
          types: ["Ground", "Dragon"],
          bs: { hp: 80, at: 100, df: 80, sa: 80, sd: 80, sp: 100 },
          weightkg: 82,
          abilities: { 0: "Levitate" }
        },
        Gardevoir: {
          types: ["Psychic"],
          bs: { hp: 68, at: 65, df: 65, sa: 125, sd: 115, sp: 80 },
          weightkg: 48.4,
          abilities: { 0: "Synchronize" }
        },
        Glalie: {
          types: ["Ice"],
          bs: { hp: 80, at: 80, df: 80, sa: 80, sd: 80, sp: 80 },
          weightkg: 256.5,
          abilities: { 0: "Inner Focus" }
        },
        Gorebyss: {
          types: ["Water"],
          bs: { hp: 55, at: 84, df: 105, sa: 114, sd: 75, sp: 52 },
          weightkg: 22.6,
          abilities: { 0: "Swift Swim" }
        },
        Groudon: {
          types: ["Ground"],
          bs: { hp: 100, at: 150, df: 140, sa: 100, sd: 90, sp: 90 },
          weightkg: 950,
          abilities: { 0: "Drought" },
          gender: "N"
        },
        Grovyle: {
          types: ["Grass"],
          bs: { hp: 50, at: 65, df: 45, sa: 85, sd: 65, sp: 95 },
          weightkg: 21.6,
          nfe: true,
          abilities: { 0: "Overgrow" }
        },
        Grumpig: {
          types: ["Psychic"],
          bs: { hp: 80, at: 45, df: 65, sa: 90, sd: 110, sp: 80 },
          weightkg: 71.5,
          abilities: { 0: "Thick Fat" }
        },
        Gulpin: {
          types: ["Poison"],
          bs: { hp: 70, at: 43, df: 53, sa: 43, sd: 53, sp: 40 },
          weightkg: 10.3,
          nfe: true,
          abilities: { 0: "Liquid Ooze" }
        },
        Hariyama: {
          types: ["Fighting"],
          bs: { hp: 144, at: 120, df: 60, sa: 40, sd: 60, sp: 50 },
          weightkg: 253.8,
          abilities: { 0: "Thick Fat" }
        },
        Huntail: {
          types: ["Water"],
          bs: { hp: 55, at: 104, df: 105, sa: 94, sd: 75, sp: 52 },
          weightkg: 27,
          abilities: { 0: "Swift Swim" }
        },
        Illumise: {
          types: ["Bug"],
          bs: { hp: 65, at: 47, df: 55, sa: 73, sd: 75, sp: 85 },
          abilities: { 0: "Oblivious" },
          weightkg: 17.7
        },
        Jirachi: {
          types: ["Steel", "Psychic"],
          bs: { hp: 100, at: 100, df: 100, sa: 100, sd: 100, sp: 100 },
          weightkg: 1.1,
          abilities: { 0: "Serene Grace" },
          gender: "N"
        },
        Kecleon: {
          types: ["Normal"],
          bs: { hp: 60, at: 90, df: 70, sa: 60, sd: 120, sp: 40 },
          weightkg: 22,
          abilities: { 0: "Color Change" }
        },
        Kirlia: {
          types: ["Psychic"],
          bs: { hp: 38, at: 35, df: 35, sa: 65, sd: 55, sp: 50 },
          weightkg: 20.2,
          nfe: true,
          abilities: { 0: "Synchronize" }
        },
        Kyogre: {
          types: ["Water"],
          bs: { hp: 100, at: 100, df: 90, sa: 150, sd: 140, sp: 90 },
          weightkg: 352,
          abilities: { 0: "Drizzle" },
          gender: "N"
        },
        Lairon: {
          types: ["Steel", "Rock"],
          bs: { hp: 60, at: 90, df: 140, sa: 50, sd: 50, sp: 40 },
          weightkg: 120,
          nfe: true,
          abilities: { 0: "Sturdy" }
        },
        Latias: {
          types: ["Dragon", "Psychic"],
          bs: { hp: 80, at: 80, df: 90, sa: 110, sd: 130, sp: 110 },
          weightkg: 40,
          abilities: { 0: "Levitate" }
        },
        Latios: {
          types: ["Dragon", "Psychic"],
          bs: { hp: 80, at: 90, df: 80, sa: 130, sd: 110, sp: 110 },
          weightkg: 60,
          abilities: { 0: "Levitate" }
        },
        Lileep: {
          types: ["Rock", "Grass"],
          bs: { hp: 66, at: 41, df: 77, sa: 61, sd: 87, sp: 23 },
          weightkg: 23.8,
          nfe: true,
          abilities: { 0: "Suction Cups" }
        },
        Linoone: {
          types: ["Normal"],
          bs: { hp: 78, at: 70, df: 61, sa: 50, sd: 61, sp: 100 },
          weightkg: 32.5,
          abilities: { 0: "Pickup" }
        },
        Lombre: {
          types: ["Water", "Grass"],
          bs: { hp: 60, at: 50, df: 50, sa: 60, sd: 70, sp: 50 },
          weightkg: 32.5,
          nfe: true,
          abilities: { 0: "Swift Swim" }
        },
        Lotad: {
          types: ["Water", "Grass"],
          bs: { hp: 40, at: 30, df: 30, sa: 40, sd: 50, sp: 30 },
          weightkg: 2.6,
          nfe: true,
          abilities: { 0: "Swift Swim" }
        },
        Loudred: {
          types: ["Normal"],
          bs: { hp: 84, at: 71, df: 43, sa: 71, sd: 43, sp: 48 },
          weightkg: 40.5,
          nfe: true,
          abilities: { 0: "Soundproof" }
        },
        Ludicolo: {
          types: ["Water", "Grass"],
          bs: { hp: 80, at: 70, df: 70, sa: 90, sd: 100, sp: 70 },
          weightkg: 55,
          abilities: { 0: "Swift Swim" }
        },
        Lunatone: {
          types: ["Rock", "Psychic"],
          bs: { hp: 70, at: 55, df: 65, sa: 95, sd: 85, sp: 70 },
          weightkg: 168,
          abilities: { 0: "Levitate" },
          gender: "N"
        },
        Luvdisc: {
          types: ["Water"],
          bs: { hp: 43, at: 30, df: 55, sa: 40, sd: 65, sp: 97 },
          weightkg: 8.7,
          abilities: { 0: "Swift Swim" }
        },
        Makuhita: {
          types: ["Fighting"],
          bs: { hp: 72, at: 60, df: 30, sa: 20, sd: 30, sp: 25 },
          weightkg: 86.4,
          nfe: true,
          abilities: { 0: "Thick Fat" }
        },
        Manectric: {
          types: ["Electric"],
          bs: { hp: 70, at: 75, df: 60, sa: 105, sd: 60, sp: 105 },
          weightkg: 40.2,
          abilities: { 0: "Static" }
        },
        Marshtomp: {
          types: ["Water", "Ground"],
          bs: { hp: 70, at: 85, df: 70, sa: 60, sd: 70, sp: 50 },
          weightkg: 28,
          nfe: true,
          abilities: { 0: "Torrent" }
        },
        Masquerain: {
          types: ["Bug", "Flying"],
          bs: { hp: 70, at: 60, df: 62, sa: 80, sd: 82, sp: 60 },
          weightkg: 3.6,
          abilities: { 0: "Intimidate" }
        },
        Mawile: {
          types: ["Steel"],
          bs: { hp: 50, at: 85, df: 85, sa: 55, sd: 55, sp: 50 },
          weightkg: 11.5,
          abilities: { 0: "Hyper Cutter" }
        },
        Medicham: {
          types: ["Fighting", "Psychic"],
          bs: { hp: 60, at: 60, df: 75, sa: 60, sd: 75, sp: 80 },
          weightkg: 31.5,
          abilities: { 0: "Pure Power" }
        },
        Meditite: {
          types: ["Fighting", "Psychic"],
          bs: { hp: 30, at: 40, df: 55, sa: 40, sd: 55, sp: 60 },
          weightkg: 11.2,
          nfe: true,
          abilities: { 0: "Pure Power" }
        },
        Metagross: {
          types: ["Steel", "Psychic"],
          bs: { hp: 80, at: 135, df: 130, sa: 95, sd: 90, sp: 70 },
          weightkg: 550,
          gender: "N",
          abilities: { 0: "Clear Body" }
        },
        Metang: {
          types: ["Steel", "Psychic"],
          bs: { hp: 60, at: 75, df: 100, sa: 55, sd: 80, sp: 50 },
          weightkg: 202.5,
          nfe: true,
          gender: "N",
          abilities: { 0: "Clear Body" }
        },
        Mightyena: {
          types: ["Dark"],
          bs: { hp: 70, at: 90, df: 70, sa: 60, sd: 60, sp: 70 },
          weightkg: 37,
          abilities: { 0: "Intimidate" }
        },
        Milotic: {
          types: ["Water"],
          bs: { hp: 95, at: 60, df: 79, sa: 100, sd: 125, sp: 81 },
          weightkg: 162,
          abilities: { 0: "Marvel Scale" }
        },
        Minun: {
          types: ["Electric"],
          bs: { hp: 60, at: 40, df: 50, sa: 75, sd: 85, sp: 95 },
          weightkg: 4.2,
          abilities: { 0: "Minus" }
        },
        Mudkip: {
          types: ["Water"],
          bs: { hp: 50, at: 70, df: 50, sa: 50, sd: 50, sp: 40 },
          weightkg: 7.6,
          nfe: true,
          abilities: { 0: "Torrent" }
        },
        Nincada: {
          types: ["Bug", "Ground"],
          bs: { hp: 31, at: 45, df: 90, sa: 30, sd: 30, sp: 40 },
          weightkg: 5.5,
          nfe: true,
          abilities: { 0: "Compound Eyes" }
        },
        Ninjask: {
          types: ["Bug", "Flying"],
          bs: { hp: 61, at: 90, df: 45, sa: 50, sd: 50, sp: 160 },
          weightkg: 12,
          abilities: { 0: "Speed Boost" }
        },
        Nosepass: {
          types: ["Rock"],
          bs: { hp: 30, at: 45, df: 135, sa: 45, sd: 90, sp: 30 },
          weightkg: 97,
          abilities: { 0: "Sturdy" }
        },
        Numel: {
          types: ["Fire", "Ground"],
          bs: { hp: 60, at: 60, df: 40, sa: 65, sd: 45, sp: 35 },
          weightkg: 24,
          nfe: true,
          abilities: { 0: "Oblivious" }
        },
        Nuzleaf: {
          types: ["Grass", "Dark"],
          bs: { hp: 70, at: 70, df: 40, sa: 60, sd: 40, sp: 60 },
          weightkg: 28,
          nfe: true,
          abilities: { 0: "Chlorophyll" }
        },
        Pelipper: {
          types: ["Water", "Flying"],
          bs: { hp: 60, at: 50, df: 100, sa: 85, sd: 70, sp: 65 },
          weightkg: 28,
          abilities: { 0: "Keen Eye" }
        },
        Plusle: {
          types: ["Electric"],
          bs: { hp: 60, at: 50, df: 40, sa: 85, sd: 75, sp: 95 },
          weightkg: 4.2,
          abilities: { 0: "Plus" }
        },
        Poochyena: {
          types: ["Dark"],
          bs: { hp: 35, at: 55, df: 35, sa: 30, sd: 30, sp: 35 },
          weightkg: 13.6,
          nfe: true,
          abilities: { 0: "Run Away" }
        },
        Ralts: {
          types: ["Psychic"],
          bs: { hp: 28, at: 25, df: 25, sa: 45, sd: 35, sp: 40 },
          weightkg: 6.6,
          nfe: true,
          abilities: { 0: "Synchronize" }
        },
        Rayquaza: {
          types: ["Dragon", "Flying"],
          bs: { hp: 105, at: 150, df: 90, sa: 150, sd: 90, sp: 95 },
          weightkg: 206.5,
          abilities: { 0: "Air Lock" },
          gender: "N"
        },
        Regice: {
          types: ["Ice"],
          bs: { hp: 80, at: 50, df: 100, sa: 100, sd: 200, sp: 50 },
          weightkg: 175,
          gender: "N",
          abilities: { 0: "Clear Body" }
        },
        Regirock: {
          types: ["Rock"],
          bs: { hp: 80, at: 100, df: 200, sa: 50, sd: 100, sp: 50 },
          weightkg: 230,
          gender: "N",
          abilities: { 0: "Clear Body" }
        },
        Registeel: {
          types: ["Steel"],
          bs: { hp: 80, at: 75, df: 150, sa: 75, sd: 150, sp: 50 },
          weightkg: 205,
          gender: "N",
          abilities: { 0: "Clear Body" }
        },
        Relicanth: {
          types: ["Water", "Rock"],
          bs: { hp: 100, at: 90, df: 130, sa: 45, sd: 65, sp: 55 },
          weightkg: 23.4,
          abilities: { 0: "Swift Swim" }
        },
        Roselia: {
          types: ["Grass", "Poison"],
          bs: { hp: 50, at: 60, df: 45, sa: 100, sd: 80, sp: 65 },
          weightkg: 2,
          abilities: { 0: "Natural Cure" }
        },
        Sableye: {
          types: ["Dark", "Ghost"],
          bs: { hp: 50, at: 75, df: 75, sa: 65, sd: 65, sp: 50 },
          weightkg: 11,
          abilities: { 0: "Keen Eye" }
        },
        Salamence: {
          types: ["Dragon", "Flying"],
          bs: { hp: 95, at: 135, df: 80, sa: 110, sd: 80, sp: 100 },
          weightkg: 102.6,
          abilities: { 0: "Intimidate" }
        },
        Sceptile: {
          types: ["Grass"],
          bs: { hp: 70, at: 85, df: 65, sa: 105, sd: 85, sp: 120 },
          weightkg: 52.2,
          abilities: { 0: "Overgrow" }
        },
        Sealeo: {
          types: ["Ice", "Water"],
          bs: { hp: 90, at: 60, df: 70, sa: 75, sd: 70, sp: 45 },
          weightkg: 87.6,
          nfe: true,
          abilities: { 0: "Thick Fat" }
        },
        Seedot: {
          types: ["Grass"],
          bs: { hp: 40, at: 40, df: 50, sa: 30, sd: 30, sp: 30 },
          weightkg: 4,
          nfe: true,
          abilities: { 0: "Chlorophyll" }
        },
        Seviper: {
          types: ["Poison"],
          bs: { hp: 73, at: 100, df: 60, sa: 100, sd: 60, sp: 65 },
          weightkg: 52.5,
          abilities: { 0: "Shed Skin" }
        },
        Sharpedo: {
          types: ["Water", "Dark"],
          bs: { hp: 70, at: 120, df: 40, sa: 95, sd: 40, sp: 95 },
          weightkg: 88.8,
          abilities: { 0: "Rough Skin" }
        },
        Shedinja: {
          types: ["Bug", "Ghost"],
          bs: { hp: 1, at: 90, df: 45, sa: 30, sd: 30, sp: 40 },
          weightkg: 1.2,
          abilities: { 0: "Wonder Guard" },
          gender: "N"
        },
        Shelgon: {
          types: ["Dragon"],
          bs: { hp: 65, at: 95, df: 100, sa: 60, sd: 50, sp: 50 },
          weightkg: 110.5,
          nfe: true,
          abilities: { 0: "Rock Head" }
        },
        Shiftry: {
          types: ["Grass", "Dark"],
          bs: { hp: 90, at: 100, df: 60, sa: 90, sd: 60, sp: 80 },
          weightkg: 59.6,
          abilities: { 0: "Chlorophyll" }
        },
        Shroomish: {
          types: ["Grass"],
          bs: { hp: 60, at: 40, df: 60, sa: 40, sd: 60, sp: 35 },
          weightkg: 4.5,
          nfe: true,
          abilities: { 0: "Effect Spore" }
        },
        Shuppet: {
          types: ["Ghost"],
          bs: { hp: 44, at: 75, df: 35, sa: 63, sd: 33, sp: 45 },
          weightkg: 2.3,
          nfe: true,
          abilities: { 0: "Insomnia" }
        },
        Silcoon: {
          types: ["Bug"],
          bs: { hp: 50, at: 35, df: 55, sa: 25, sd: 25, sp: 15 },
          weightkg: 10,
          abilities: { 0: "Shed Skin" },
          nfe: true
        },
        Skitty: {
          types: ["Normal"],
          bs: { hp: 50, at: 45, df: 45, sa: 35, sd: 35, sp: 50 },
          weightkg: 11,
          nfe: true,
          abilities: { 0: "Cute Charm" }
        },
        Slaking: {
          types: ["Normal"],
          bs: { hp: 150, at: 160, df: 100, sa: 95, sd: 65, sp: 100 },
          weightkg: 130.5,
          abilities: { 0: "Truant" }
        },
        Slakoth: {
          types: ["Normal"],
          bs: { hp: 60, at: 60, df: 60, sa: 35, sd: 35, sp: 30 },
          weightkg: 24,
          abilities: { 0: "Truant" },
          nfe: true
        },
        Snorunt: {
          types: ["Ice"],
          bs: { hp: 50, at: 50, df: 50, sa: 50, sd: 50, sp: 50 },
          weightkg: 16.8,
          nfe: true,
          abilities: { 0: "Inner Focus" }
        },
        Solrock: {
          types: ["Rock", "Psychic"],
          bs: { hp: 70, at: 95, df: 85, sa: 55, sd: 65, sp: 70 },
          weightkg: 154,
          abilities: { 0: "Levitate" },
          gender: "N"
        },
        Spheal: {
          types: ["Ice", "Water"],
          bs: { hp: 70, at: 40, df: 50, sa: 55, sd: 50, sp: 25 },
          weightkg: 39.5,
          nfe: true,
          abilities: { 0: "Thick Fat" }
        },
        Spinda: {
          types: ["Normal"],
          bs: { hp: 60, at: 60, df: 60, sa: 60, sd: 60, sp: 60 },
          weightkg: 5,
          abilities: { 0: "Own Tempo" }
        },
        Spoink: {
          types: ["Psychic"],
          bs: { hp: 60, at: 25, df: 35, sa: 70, sd: 80, sp: 60 },
          weightkg: 30.6,
          nfe: true,
          abilities: { 0: "Thick Fat" }
        },
        Surskit: {
          types: ["Bug", "Water"],
          bs: { hp: 40, at: 30, df: 32, sa: 50, sd: 52, sp: 65 },
          weightkg: 1.7,
          nfe: true,
          abilities: { 0: "Swift Swim" }
        },
        Swablu: {
          types: ["Normal", "Flying"],
          bs: { hp: 45, at: 40, df: 60, sa: 40, sd: 75, sp: 50 },
          weightkg: 1.2,
          nfe: true,
          abilities: { 0: "Natural Cure" }
        },
        Swalot: {
          types: ["Poison"],
          bs: { hp: 100, at: 73, df: 83, sa: 73, sd: 83, sp: 55 },
          weightkg: 80,
          abilities: { 0: "Liquid Ooze" }
        },
        Swampert: {
          types: ["Water", "Ground"],
          bs: { hp: 100, at: 110, df: 90, sa: 85, sd: 90, sp: 60 },
          weightkg: 81.9,
          abilities: { 0: "Torrent" }
        },
        Swellow: {
          types: ["Normal", "Flying"],
          bs: { hp: 60, at: 85, df: 60, sa: 50, sd: 50, sp: 125 },
          weightkg: 19.8,
          abilities: { 0: "Guts" }
        },
        Taillow: {
          types: ["Normal", "Flying"],
          bs: { hp: 40, at: 55, df: 30, sa: 30, sd: 30, sp: 85 },
          weightkg: 2.3,
          nfe: true,
          abilities: { 0: "Guts" }
        },
        Torchic: {
          types: ["Fire"],
          bs: { hp: 45, at: 60, df: 40, sa: 70, sd: 50, sp: 45 },
          weightkg: 2.5,
          nfe: true,
          abilities: { 0: "Blaze" }
        },
        Torkoal: {
          types: ["Fire"],
          bs: { hp: 70, at: 85, df: 140, sa: 85, sd: 70, sp: 20 },
          weightkg: 80.4,
          abilities: { 0: "White Smoke" }
        },
        Trapinch: {
          types: ["Ground"],
          bs: { hp: 45, at: 100, df: 45, sa: 45, sd: 45, sp: 10 },
          weightkg: 15,
          nfe: true,
          abilities: { 0: "Hyper Cutter" }
        },
        Treecko: {
          types: ["Grass"],
          bs: { hp: 40, at: 45, df: 35, sa: 65, sd: 55, sp: 70 },
          weightkg: 5,
          nfe: true,
          abilities: { 0: "Overgrow" }
        },
        Tropius: {
          types: ["Grass", "Flying"],
          bs: { hp: 99, at: 68, df: 83, sa: 72, sd: 87, sp: 51 },
          weightkg: 100,
          abilities: { 0: "Chlorophyll" }
        },
        Vibrava: {
          types: ["Ground", "Dragon"],
          bs: { hp: 50, at: 70, df: 50, sa: 50, sd: 50, sp: 70 },
          weightkg: 15.3,
          abilities: { 0: "Levitate" },
          nfe: true
        },
        Vigoroth: {
          types: ["Normal"],
          bs: { hp: 80, at: 80, df: 80, sa: 55, sd: 55, sp: 90 },
          weightkg: 46.5,
          abilities: { 0: "Vital Spirit" },
          nfe: true
        },
        Volbeat: {
          types: ["Bug"],
          bs: { hp: 65, at: 73, df: 55, sa: 47, sd: 75, sp: 85 },
          weightkg: 17.7,
          abilities: { 0: "Illuminate" }
        },
        Wailmer: {
          types: ["Water"],
          bs: { hp: 130, at: 70, df: 35, sa: 70, sd: 35, sp: 60 },
          weightkg: 130,
          nfe: true,
          abilities: { 0: "Water Veil" }
        },
        Wailord: {
          types: ["Water"],
          bs: { hp: 170, at: 90, df: 45, sa: 90, sd: 45, sp: 60 },
          weightkg: 398,
          abilities: { 0: "Water Veil" }
        },
        Walrein: {
          types: ["Ice", "Water"],
          bs: { hp: 110, at: 80, df: 90, sa: 95, sd: 90, sp: 65 },
          weightkg: 150.6,
          abilities: { 0: "Thick Fat" }
        },
        Whiscash: {
          types: ["Water", "Ground"],
          bs: { hp: 110, at: 78, df: 73, sa: 76, sd: 71, sp: 60 },
          weightkg: 23.6,
          abilities: { 0: "Oblivious" }
        },
        Whismur: {
          types: ["Normal"],
          bs: { hp: 64, at: 51, df: 23, sa: 51, sd: 23, sp: 28 },
          weightkg: 16.3,
          nfe: true,
          abilities: { 0: "Soundproof" }
        },
        Wingull: {
          types: ["Water", "Flying"],
          bs: { hp: 40, at: 30, df: 30, sa: 55, sd: 30, sp: 85 },
          weightkg: 9.5,
          nfe: true,
          abilities: { 0: "Keen Eye" }
        },
        Wurmple: {
          types: ["Bug"],
          bs: { hp: 45, at: 45, df: 35, sa: 20, sd: 30, sp: 20 },
          weightkg: 3.6,
          nfe: true,
          abilities: { 0: "Shield Dust" }
        },
        Wynaut: {
          types: ["Psychic"],
          bs: { hp: 95, at: 23, df: 48, sa: 23, sd: 48, sp: 23 },
          weightkg: 14,
          nfe: true,
          abilities: { 0: "Shadow Tag" }
        },
        Zangoose: {
          types: ["Normal"],
          bs: { hp: 73, at: 115, df: 60, sa: 60, sd: 60, sp: 90 },
          weightkg: 40.3,
          abilities: { 0: "Immunity" }
        },
        Zigzagoon: {
          types: ["Normal"],
          bs: { hp: 38, at: 30, df: 41, sa: 30, sd: 41, sp: 60 },
          weightkg: 17.5,
          nfe: true,
          abilities: { 0: "Pickup" }
        }
      };
      var ADV = (0, util_1.extend)(true, {}, GSC, ADV_PATCH);
      var DPP_PATCH = {
        Aipom: { nfe: true },
        Dusclops: { nfe: true },
        Electabuzz: { nfe: true },
        Gligar: { nfe: true },
        Lickitung: { nfe: true },
        Magmar: { nfe: true },
        Magneton: { nfe: true },
        Misdreavus: { nfe: true },
        Murkrow: { nfe: true },
        Nosepass: { nfe: true },
        Piloswine: { nfe: true },
        Pichu: { otherFormes: ["Pichu-Spiky-eared"] },
        Porygon2: { nfe: true },
        Rhydon: { nfe: true },
        Roselia: { nfe: true },
        Sneasel: { nfe: true },
        Tangela: { nfe: true },
        Togetic: { nfe: true },
        Yanma: { nfe: true },
        Abomasnow: {
          types: ["Grass", "Ice"],
          bs: { hp: 90, at: 92, df: 75, sa: 92, sd: 85, sp: 60 },
          weightkg: 135.5,
          abilities: { 0: "Snow Warning" }
        },
        Ambipom: {
          types: ["Normal"],
          bs: { hp: 75, at: 100, df: 66, sa: 60, sd: 66, sp: 115 },
          weightkg: 20.3,
          abilities: { 0: "Technician" }
        },
        Arceus: {
          types: ["Normal"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          otherFormes: [
            "Arceus-Bug",
            "Arceus-Dark",
            "Arceus-Dragon",
            "Arceus-Electric",
            "Arceus-Fighting",
            "Arceus-Fire",
            "Arceus-Flying",
            "Arceus-Ghost",
            "Arceus-Grass",
            "Arceus-Ground",
            "Arceus-Ice",
            "Arceus-Poison",
            "Arceus-Psychic",
            "Arceus-Rock",
            "Arceus-Steel",
            "Arceus-Water"
          ]
        },
        "Arceus-Bug": {
          types: ["Bug"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Dark": {
          types: ["Dark"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Dragon": {
          types: ["Dragon"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Electric": {
          types: ["Electric"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Fighting": {
          types: ["Fighting"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Fire": {
          types: ["Fire"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Flying": {
          types: ["Flying"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Ghost": {
          types: ["Ghost"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Grass": {
          types: ["Grass"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Ground": {
          types: ["Ground"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Ice": {
          types: ["Ice"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Poison": {
          types: ["Poison"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Psychic": {
          types: ["Psychic"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Rock": {
          types: ["Rock"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Steel": {
          types: ["Steel"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        "Arceus-Water": {
          types: ["Water"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          gender: "N",
          baseSpecies: "Arceus"
        },
        Arghonaut: {
          types: ["Water", "Fighting"],
          bs: { hp: 105, at: 110, df: 95, sa: 70, sd: 100, sp: 75 },
          weightkg: 151,
          abilities: { 0: "Unaware" }
        },
        Azelf: {
          types: ["Psychic"],
          bs: { hp: 75, at: 125, df: 70, sa: 125, sd: 70, sp: 115 },
          weightkg: 0.3,
          abilities: { 0: "Levitate" },
          gender: "N"
        },
        Bastiodon: {
          types: ["Rock", "Steel"],
          bs: { hp: 60, at: 52, df: 168, sa: 47, sd: 138, sp: 30 },
          weightkg: 149.5,
          abilities: { 0: "Sturdy" }
        },
        Bibarel: {
          types: ["Normal", "Water"],
          bs: { hp: 79, at: 85, df: 60, sa: 55, sd: 60, sp: 71 },
          weightkg: 31.5,
          abilities: { 0: "Simple" }
        },
        Bidoof: {
          types: ["Normal"],
          bs: { hp: 59, at: 45, df: 40, sa: 35, sd: 40, sp: 31 },
          weightkg: 20,
          nfe: true,
          abilities: { 0: "Simple" }
        },
        Bonsly: {
          types: ["Rock"],
          bs: { hp: 50, at: 80, df: 95, sa: 10, sd: 45, sp: 10 },
          weightkg: 15,
          nfe: true,
          abilities: { 0: "Sturdy" }
        },
        Breezi: {
          types: ["Poison", "Flying"],
          bs: { hp: 50, at: 46, df: 69, sa: 60, sd: 50, sp: 75 },
          weightkg: 0.6,
          nfe: true,
          abilities: { 0: "Unburden" }
        },
        Bronzong: {
          types: ["Steel", "Psychic"],
          bs: { hp: 67, at: 89, df: 116, sa: 79, sd: 116, sp: 33 },
          weightkg: 187,
          gender: "N",
          abilities: { 0: "Levitate" }
        },
        Bronzor: {
          types: ["Steel", "Psychic"],
          bs: { hp: 57, at: 24, df: 86, sa: 24, sd: 86, sp: 23 },
          weightkg: 60.5,
          nfe: true,
          gender: "N",
          abilities: { 0: "Levitate" }
        },
        Budew: {
          types: ["Grass", "Poison"],
          bs: { hp: 40, at: 30, df: 35, sa: 50, sd: 70, sp: 55 },
          weightkg: 1.2,
          nfe: true,
          abilities: { 0: "Natural Cure" }
        },
        Buizel: {
          types: ["Water"],
          bs: { hp: 55, at: 65, df: 35, sa: 60, sd: 30, sp: 85 },
          weightkg: 29.5,
          nfe: true,
          abilities: { 0: "Swift Swim" }
        },
        Buneary: {
          types: ["Normal"],
          bs: { hp: 55, at: 66, df: 44, sa: 44, sd: 56, sp: 85 },
          weightkg: 5.5,
          nfe: true,
          abilities: { 0: "Run Away" }
        },
        Burmy: {
          types: ["Bug"],
          bs: { hp: 40, at: 29, df: 45, sa: 29, sd: 45, sp: 36 },
          weightkg: 3.4,
          nfe: true,
          abilities: { 0: "Shed Skin" }
        },
        Carnivine: {
          types: ["Grass"],
          bs: { hp: 74, at: 100, df: 72, sa: 90, sd: 72, sp: 46 },
          weightkg: 27,
          abilities: { 0: "Levitate" }
        },
        Chatot: {
          types: ["Normal", "Flying"],
          bs: { hp: 76, at: 65, df: 45, sa: 92, sd: 42, sp: 91 },
          weightkg: 1.9,
          abilities: { 0: "Keen Eye" }
        },
        Cherrim: {
          types: ["Grass"],
          bs: { hp: 70, at: 60, df: 70, sa: 87, sd: 78, sp: 85 },
          weightkg: 9.3,
          abilities: { 0: "Flower Gift" },
          otherFormes: ["Cherrim-Sunshine"]
        },
        "Cherrim-Sunshine": {
          types: ["Grass"],
          bs: { hp: 70, at: 60, df: 70, sa: 87, sd: 78, sp: 85 },
          weightkg: 9.3,
          abilities: { 0: "Flower Gift" },
          baseSpecies: "Cherrim"
        },
        Cherubi: {
          types: ["Grass"],
          bs: { hp: 45, at: 35, df: 45, sa: 62, sd: 53, sp: 35 },
          weightkg: 3.3,
          abilities: { 0: "Chlorophyll" },
          nfe: true
        },
        Chimchar: {
          types: ["Fire"],
          bs: { hp: 44, at: 58, df: 44, sa: 58, sd: 44, sp: 61 },
          weightkg: 6.2,
          nfe: true,
          abilities: { 0: "Blaze" }
        },
        Chingling: {
          types: ["Psychic"],
          bs: { hp: 45, at: 30, df: 50, sa: 65, sd: 50, sp: 45 },
          weightkg: 0.6,
          abilities: { 0: "Levitate" },
          nfe: true
        },
        Colossoil: {
          types: ["Ground", "Dark"],
          bs: { hp: 133, at: 122, df: 72, sa: 71, sd: 72, sp: 95 },
          weightkg: 683.6,
          abilities: { 0: "Rebound" }
        },
        Combee: {
          types: ["Bug", "Flying"],
          bs: { hp: 30, at: 30, df: 42, sa: 30, sd: 42, sp: 70 },
          weightkg: 5.5,
          nfe: true,
          abilities: { 0: "Honey Gather" }
        },
        Cranidos: {
          types: ["Rock"],
          bs: { hp: 67, at: 125, df: 40, sa: 30, sd: 30, sp: 58 },
          weightkg: 31.5,
          nfe: true,
          abilities: { 0: "Mold Breaker" }
        },
        Cresselia: {
          types: ["Psychic"],
          bs: { hp: 120, at: 70, df: 120, sa: 75, sd: 130, sp: 85 },
          weightkg: 85.6,
          abilities: { 0: "Levitate" }
        },
        Croagunk: {
          types: ["Poison", "Fighting"],
          bs: { hp: 48, at: 61, df: 40, sa: 61, sd: 40, sp: 50 },
          weightkg: 23,
          nfe: true,
          abilities: { 0: "Anticipation" }
        },
        Cyclohm: {
          types: ["Electric", "Dragon"],
          bs: { hp: 108, at: 60, df: 118, sa: 112, sd: 70, sp: 80 },
          weightkg: 59,
          abilities: { 0: "Shield Dust" }
        },
        Darkrai: {
          types: ["Dark"],
          bs: { hp: 70, at: 90, df: 90, sa: 135, sd: 90, sp: 125 },
          weightkg: 50.5,
          abilities: { 0: "Bad Dreams" },
          gender: "N"
        },
        Dialga: {
          types: ["Steel", "Dragon"],
          bs: { hp: 100, at: 120, df: 120, sa: 150, sd: 100, sp: 90 },
          weightkg: 683,
          gender: "N",
          abilities: { 0: "Pressure" }
        },
        Dorsoil: {
          types: ["Ground"],
          bs: { hp: 103, at: 72, df: 52, sa: 61, sd: 52, sp: 65 },
          weightkg: 145,
          nfe: true,
          abilities: { 0: "Oblivious" }
        },
        Drapion: {
          types: ["Poison", "Dark"],
          bs: { hp: 70, at: 90, df: 110, sa: 60, sd: 75, sp: 95 },
          weightkg: 61.5,
          abilities: { 0: "Battle Armor" }
        },
        Drifblim: {
          types: ["Ghost", "Flying"],
          bs: { hp: 150, at: 80, df: 44, sa: 90, sd: 54, sp: 80 },
          weightkg: 15,
          abilities: { 0: "Aftermath" }
        },
        Drifloon: {
          types: ["Ghost", "Flying"],
          bs: { hp: 90, at: 50, df: 34, sa: 60, sd: 44, sp: 70 },
          weightkg: 1.2,
          nfe: true,
          abilities: { 0: "Aftermath" }
        },
        Duohm: {
          types: ["Electric", "Dragon"],
          bs: { hp: 88, at: 40, df: 103, sa: 77, sd: 60, sp: 60 },
          weightkg: 19.2,
          nfe: true,
          abilities: { 0: "Shield Dust" }
        },
        Dusknoir: {
          types: ["Ghost"],
          bs: { hp: 45, at: 100, df: 135, sa: 65, sd: 135, sp: 45 },
          weightkg: 106.6,
          abilities: { 0: "Pressure" }
        },
        Electivire: {
          types: ["Electric"],
          bs: { hp: 75, at: 123, df: 67, sa: 95, sd: 85, sp: 95 },
          weightkg: 138.6,
          abilities: { 0: "Motor Drive" }
        },
        Embirch: {
          types: ["Fire", "Grass"],
          bs: { hp: 60, at: 40, df: 55, sa: 65, sd: 40, sp: 60 },
          weightkg: 15,
          nfe: true,
          abilities: { 0: "Reckless" }
        },
        Empoleon: {
          types: ["Water", "Steel"],
          bs: { hp: 84, at: 86, df: 88, sa: 111, sd: 101, sp: 60 },
          weightkg: 84.5,
          abilities: { 0: "Torrent" }
        },
        Fidgit: {
          types: ["Poison", "Ground"],
          bs: { hp: 95, at: 76, df: 109, sa: 90, sd: 80, sp: 105 },
          weightkg: 53,
          abilities: { 0: "Persistent" }
        },
        Finneon: {
          types: ["Water"],
          bs: { hp: 49, at: 49, df: 56, sa: 49, sd: 61, sp: 66 },
          weightkg: 7,
          nfe: true,
          abilities: { 0: "Swift Swim" }
        },
        Flarelm: {
          types: ["Fire", "Grass"],
          bs: { hp: 90, at: 50, df: 95, sa: 75, sd: 70, sp: 40 },
          weightkg: 73,
          nfe: true,
          abilities: { 0: "Rock Head" }
        },
        Floatzel: {
          types: ["Water"],
          bs: { hp: 85, at: 105, df: 55, sa: 85, sd: 50, sp: 115 },
          weightkg: 33.5,
          abilities: { 0: "Swift Swim" }
        },
        Froslass: {
          types: ["Ice", "Ghost"],
          bs: { hp: 70, at: 80, df: 70, sa: 80, sd: 70, sp: 110 },
          weightkg: 26.6,
          abilities: { 0: "Snow Cloak" }
        },
        Gabite: {
          types: ["Dragon", "Ground"],
          bs: { hp: 68, at: 90, df: 65, sa: 50, sd: 55, sp: 82 },
          weightkg: 56,
          nfe: true,
          abilities: { 0: "Sand Veil" }
        },
        Gallade: {
          types: ["Psychic", "Fighting"],
          bs: { hp: 68, at: 125, df: 65, sa: 65, sd: 115, sp: 80 },
          weightkg: 52,
          abilities: { 0: "Steadfast" }
        },
        Garchomp: {
          types: ["Dragon", "Ground"],
          bs: { hp: 108, at: 130, df: 95, sa: 80, sd: 85, sp: 102 },
          weightkg: 95,
          abilities: { 0: "Sand Veil" }
        },
        Gastrodon: {
          types: ["Water", "Ground"],
          bs: { hp: 111, at: 83, df: 68, sa: 92, sd: 82, sp: 39 },
          weightkg: 29.9,
          abilities: { 0: "Sticky Hold" }
        },
        Gible: {
          types: ["Dragon", "Ground"],
          bs: { hp: 58, at: 70, df: 45, sa: 40, sd: 45, sp: 42 },
          weightkg: 20.5,
          nfe: true,
          abilities: { 0: "Sand Veil" }
        },
        Giratina: {
          types: ["Ghost", "Dragon"],
          bs: { hp: 150, at: 100, df: 120, sa: 100, sd: 120, sp: 90 },
          weightkg: 750,
          gender: "N",
          otherFormes: ["Giratina-Origin"],
          abilities: { 0: "Pressure" }
        },
        "Giratina-Origin": {
          types: ["Ghost", "Dragon"],
          bs: { hp: 150, at: 120, df: 100, sa: 120, sd: 100, sp: 90 },
          weightkg: 650,
          gender: "N",
          abilities: { 0: "Levitate" },
          baseSpecies: "Giratina"
        },
        Glaceon: {
          types: ["Ice"],
          bs: { hp: 65, at: 60, df: 110, sa: 130, sd: 95, sp: 65 },
          weightkg: 25.9,
          abilities: { 0: "Snow Cloak" }
        },
        Glameow: {
          types: ["Normal"],
          bs: { hp: 49, at: 55, df: 42, sa: 42, sd: 37, sp: 85 },
          weightkg: 3.9,
          nfe: true,
          abilities: { 0: "Limber" }
        },
        Gliscor: {
          types: ["Ground", "Flying"],
          bs: { hp: 75, at: 95, df: 125, sa: 45, sd: 75, sp: 95 },
          weightkg: 42.5,
          abilities: { 0: "Hyper Cutter" }
        },
        Grotle: {
          types: ["Grass"],
          bs: { hp: 75, at: 89, df: 85, sa: 55, sd: 65, sp: 36 },
          weightkg: 97,
          nfe: true,
          abilities: { 0: "Overgrow" }
        },
        Happiny: {
          types: ["Normal"],
          bs: { hp: 100, at: 5, df: 5, sa: 15, sd: 65, sp: 30 },
          weightkg: 24.4,
          nfe: true,
          abilities: { 0: "Natural Cure" }
        },
        Heatran: {
          types: ["Fire", "Steel"],
          bs: { hp: 91, at: 90, df: 106, sa: 130, sd: 106, sp: 77 },
          weightkg: 430,
          abilities: { 0: "Flash Fire" }
        },
        Hippopotas: {
          types: ["Ground"],
          bs: { hp: 68, at: 72, df: 78, sa: 38, sd: 42, sp: 32 },
          weightkg: 49.5,
          nfe: true,
          abilities: { 0: "Sand Stream" }
        },
        Hippowdon: {
          types: ["Ground"],
          bs: { hp: 108, at: 112, df: 118, sa: 68, sd: 72, sp: 47 },
          weightkg: 300,
          abilities: { 0: "Sand Stream" }
        },
        Honchkrow: {
          types: ["Dark", "Flying"],
          bs: { hp: 100, at: 125, df: 52, sa: 105, sd: 52, sp: 71 },
          weightkg: 27.3,
          abilities: { 0: "Insomnia" }
        },
        Infernape: {
          types: ["Fire", "Fighting"],
          bs: { hp: 76, at: 104, df: 71, sa: 104, sd: 71, sp: 108 },
          weightkg: 55,
          abilities: { 0: "Blaze" }
        },
        Kitsunoh: {
          types: ["Ghost", "Steel"],
          bs: { hp: 80, at: 103, df: 85, sa: 55, sd: 80, sp: 110 },
          weightkg: 51,
          abilities: { 0: "Frisk" }
        },
        Kricketot: {
          types: ["Bug"],
          bs: { hp: 37, at: 25, df: 41, sa: 25, sd: 41, sp: 25 },
          weightkg: 2.2,
          nfe: true,
          abilities: { 0: "Shed Skin" }
        },
        Kricketune: {
          types: ["Bug"],
          bs: { hp: 77, at: 85, df: 51, sa: 55, sd: 51, sp: 65 },
          weightkg: 25.5,
          abilities: { 0: "Swarm" }
        },
        Krilowatt: {
          types: ["Electric", "Water"],
          bs: { hp: 151, at: 84, df: 73, sa: 83, sd: 74, sp: 105 },
          weightkg: 10.6,
          abilities: { 0: "Trace" }
        },
        Leafeon: {
          types: ["Grass"],
          bs: { hp: 65, at: 110, df: 130, sa: 60, sd: 65, sp: 95 },
          weightkg: 25.5,
          abilities: { 0: "Leaf Guard" }
        },
        Lickilicky: {
          types: ["Normal"],
          bs: { hp: 110, at: 85, df: 95, sa: 80, sd: 95, sp: 50 },
          weightkg: 140,
          abilities: { 0: "Own Tempo" }
        },
        Lopunny: {
          types: ["Normal"],
          bs: { hp: 65, at: 76, df: 84, sa: 54, sd: 96, sp: 105 },
          weightkg: 33.3,
          abilities: { 0: "Cute Charm" }
        },
        Lucario: {
          types: ["Fighting", "Steel"],
          bs: { hp: 70, at: 110, df: 70, sa: 115, sd: 70, sp: 90 },
          weightkg: 54,
          abilities: { 0: "Steadfast" }
        },
        Lumineon: {
          types: ["Water"],
          bs: { hp: 69, at: 69, df: 76, sa: 69, sd: 86, sp: 91 },
          weightkg: 24,
          abilities: { 0: "Swift Swim" }
        },
        Luxio: {
          types: ["Electric"],
          bs: { hp: 60, at: 85, df: 49, sa: 60, sd: 49, sp: 60 },
          weightkg: 30.5,
          nfe: true,
          abilities: { 0: "Rivalry" }
        },
        Luxray: {
          types: ["Electric"],
          bs: { hp: 80, at: 120, df: 79, sa: 95, sd: 79, sp: 70 },
          weightkg: 42,
          abilities: { 0: "Rivalry" }
        },
        Magmortar: {
          types: ["Fire"],
          bs: { hp: 75, at: 95, df: 67, sa: 125, sd: 95, sp: 83 },
          weightkg: 68,
          abilities: { 0: "Flame Body" }
        },
        Magnezone: {
          types: ["Electric", "Steel"],
          bs: { hp: 70, at: 70, df: 115, sa: 130, sd: 90, sp: 60 },
          weightkg: 180,
          gender: "N",
          abilities: { 0: "Magnet Pull" }
        },
        Mamoswine: {
          types: ["Ice", "Ground"],
          bs: { hp: 110, at: 130, df: 80, sa: 70, sd: 60, sp: 80 },
          weightkg: 291,
          abilities: { 0: "Oblivious" }
        },
        Manaphy: {
          types: ["Water"],
          bs: { hp: 100, at: 100, df: 100, sa: 100, sd: 100, sp: 100 },
          weightkg: 1.4,
          abilities: { 0: "Hydration" },
          gender: "N"
        },
        Mantyke: {
          types: ["Water", "Flying"],
          bs: { hp: 45, at: 20, df: 50, sa: 60, sd: 120, sp: 50 },
          weightkg: 65,
          nfe: true,
          abilities: { 0: "Swift Swim" }
        },
        Mesprit: {
          types: ["Psychic"],
          bs: { hp: 80, at: 105, df: 105, sa: 105, sd: 105, sp: 80 },
          weightkg: 0.3,
          abilities: { 0: "Levitate" },
          gender: "N"
        },
        "Mime Jr.": {
          types: ["Psychic"],
          bs: { hp: 20, at: 25, df: 45, sa: 70, sd: 90, sp: 60 },
          weightkg: 13,
          nfe: true,
          abilities: { 0: "Soundproof" }
        },
        Mismagius: {
          types: ["Ghost"],
          bs: { hp: 60, at: 60, df: 60, sa: 105, sd: 105, sp: 105 },
          weightkg: 4.4,
          abilities: { 0: "Levitate" }
        },
        Monferno: {
          types: ["Fire", "Fighting"],
          bs: { hp: 64, at: 78, df: 52, sa: 78, sd: 52, sp: 81 },
          weightkg: 22,
          nfe: true,
          abilities: { 0: "Blaze" }
        },
        Monohm: {
          types: ["Electric"],
          bs: { hp: 53, at: 40, df: 58, sa: 67, sd: 55, sp: 55 },
          weightkg: 4.1,
          nfe: true,
          abilities: { 0: "Shield Dust" }
        },
        Mothim: {
          types: ["Bug", "Flying"],
          bs: { hp: 70, at: 94, df: 50, sa: 94, sd: 50, sp: 66 },
          weightkg: 23.3,
          abilities: { 0: "Swarm" }
        },
        Munchlax: {
          types: ["Normal"],
          bs: { hp: 135, at: 85, df: 40, sa: 40, sd: 85, sp: 5 },
          weightkg: 105,
          nfe: true,
          abilities: { 0: "Pickup" }
        },
        Nohface: {
          types: ["Ghost"],
          bs: { hp: 50, at: 73, df: 50, sa: 30, sd: 50, sp: 80 },
          weightkg: 5.9,
          nfe: true,
          abilities: { 0: "Frisk" }
        },
        Pachirisu: {
          types: ["Electric"],
          bs: { hp: 60, at: 45, df: 70, sa: 45, sd: 90, sp: 95 },
          weightkg: 3.9,
          abilities: { 0: "Run Away" }
        },
        Palkia: {
          types: ["Water", "Dragon"],
          bs: { hp: 90, at: 120, df: 100, sa: 150, sd: 120, sp: 100 },
          weightkg: 336,
          gender: "N",
          abilities: { 0: "Pressure" }
        },
        Phione: {
          types: ["Water"],
          bs: { hp: 80, at: 80, df: 80, sa: 80, sd: 80, sp: 80 },
          weightkg: 3.1,
          abilities: { 0: "Hydration" },
          gender: "N"
        },
        "Pichu-Spiky-eared": {
          types: ["Electric"],
          bs: { hp: 20, at: 40, df: 15, sa: 35, sd: 35, sp: 60 },
          weightkg: 2,
          abilities: { 0: "Static" },
          baseSpecies: "Pichu"
        },
        Piplup: {
          types: ["Water"],
          bs: { hp: 53, at: 51, df: 53, sa: 61, sd: 56, sp: 40 },
          weightkg: 5.2,
          nfe: true,
          abilities: { 0: "Torrent" }
        },
        "Porygon-Z": {
          types: ["Normal"],
          bs: { hp: 85, at: 80, df: 70, sa: 135, sd: 75, sp: 90 },
          weightkg: 34,
          gender: "N",
          abilities: { 0: "Adaptability" }
        },
        Prinplup: {
          types: ["Water"],
          bs: { hp: 64, at: 66, df: 68, sa: 81, sd: 76, sp: 50 },
          weightkg: 23,
          nfe: true,
          abilities: { 0: "Torrent" }
        },
        Privatyke: {
          types: ["Water", "Fighting"],
          bs: { hp: 65, at: 75, df: 65, sa: 40, sd: 60, sp: 45 },
          weightkg: 35,
          nfe: true,
          abilities: { 0: "Unaware" }
        },
        Probopass: {
          types: ["Rock", "Steel"],
          bs: { hp: 60, at: 55, df: 145, sa: 75, sd: 150, sp: 40 },
          weightkg: 340,
          abilities: { 0: "Sturdy" }
        },
        Protowatt: {
          types: ["Electric", "Water"],
          bs: { hp: 51, at: 44, df: 33, sa: 43, sd: 34, sp: 65 },
          weightkg: 0.1,
          nfe: true,
          abilities: { 0: "Trace" }
        },
        Purugly: {
          types: ["Normal"],
          bs: { hp: 71, at: 82, df: 64, sa: 64, sd: 59, sp: 112 },
          weightkg: 43.8,
          abilities: { 0: "Thick Fat" }
        },
        Pyroak: {
          types: ["Fire", "Grass"],
          bs: { hp: 120, at: 70, df: 105, sa: 95, sd: 90, sp: 60 },
          weightkg: 168,
          abilities: { 0: "Rock Head" }
        },
        Rampardos: {
          types: ["Rock"],
          bs: { hp: 97, at: 165, df: 60, sa: 65, sd: 50, sp: 58 },
          weightkg: 102.5,
          abilities: { 0: "Mold Breaker" }
        },
        Rebble: {
          types: ["Rock"],
          bs: { hp: 45, at: 25, df: 65, sa: 75, sd: 55, sp: 80 },
          weightkg: 7,
          nfe: true,
          gender: "N",
          abilities: { 0: "Levitate" }
        },
        Regigigas: {
          types: ["Normal"],
          bs: { hp: 110, at: 160, df: 110, sa: 80, sd: 110, sp: 100 },
          weightkg: 420,
          abilities: { 0: "Slow Start" },
          gender: "N"
        },
        Revenankh: {
          types: ["Ghost", "Fighting"],
          bs: { hp: 90, at: 105, df: 90, sa: 65, sd: 110, sp: 65 },
          weightkg: 44,
          abilities: { 0: "Air Lock" }
        },
        Rhyperior: {
          types: ["Ground", "Rock"],
          bs: { hp: 115, at: 140, df: 130, sa: 55, sd: 55, sp: 40 },
          weightkg: 282.8,
          abilities: { 0: "Lightning Rod" }
        },
        Riolu: {
          types: ["Fighting"],
          bs: { hp: 40, at: 70, df: 40, sa: 35, sd: 40, sp: 60 },
          weightkg: 20.2,
          nfe: true,
          abilities: { 0: "Steadfast" }
        },
        Roserade: {
          types: ["Grass", "Poison"],
          bs: { hp: 60, at: 70, df: 55, sa: 125, sd: 105, sp: 90 },
          weightkg: 14.5,
          abilities: { 0: "Natural Cure" }
        },
        Rotom: {
          types: ["Electric", "Ghost"],
          bs: { hp: 50, at: 50, df: 77, sa: 95, sd: 77, sp: 91 },
          weightkg: 0.3,
          abilities: { 0: "Levitate" },
          gender: "N",
          otherFormes: ["Rotom-Fan", "Rotom-Frost", "Rotom-Heat", "Rotom-Mow", "Rotom-Wash"]
        },
        "Rotom-Mow": {
          types: ["Electric", "Ghost"],
          bs: { hp: 50, at: 65, df: 107, sa: 105, sd: 107, sp: 86 },
          weightkg: 0.3,
          abilities: { 0: "Levitate" },
          gender: "N",
          baseSpecies: "Rotom"
        },
        "Rotom-Frost": {
          types: ["Electric", "Ghost"],
          bs: { hp: 50, at: 65, df: 107, sa: 105, sd: 107, sp: 86 },
          weightkg: 0.3,
          abilities: { 0: "Levitate" },
          gender: "N",
          baseSpecies: "Rotom"
        },
        "Rotom-Heat": {
          types: ["Electric", "Ghost"],
          bs: { hp: 50, at: 65, df: 107, sa: 105, sd: 107, sp: 86 },
          weightkg: 0.3,
          abilities: { 0: "Levitate" },
          gender: "N",
          baseSpecies: "Rotom"
        },
        "Rotom-Fan": {
          types: ["Electric", "Ghost"],
          bs: { hp: 50, at: 65, df: 107, sa: 105, sd: 107, sp: 86 },
          weightkg: 0.3,
          abilities: { 0: "Levitate" },
          gender: "N",
          baseSpecies: "Rotom"
        },
        "Rotom-Wash": {
          types: ["Electric", "Ghost"],
          bs: { hp: 50, at: 65, df: 107, sa: 105, sd: 107, sp: 86 },
          weightkg: 0.3,
          abilities: { 0: "Levitate" },
          gender: "N",
          baseSpecies: "Rotom"
        },
        Shaymin: {
          types: ["Grass"],
          bs: { hp: 100, at: 100, df: 100, sa: 100, sd: 100, sp: 100 },
          weightkg: 2.1,
          abilities: { 0: "Natural Cure" },
          gender: "N",
          otherFormes: ["Shaymin-Sky"]
        },
        "Shaymin-Sky": {
          types: ["Grass", "Flying"],
          bs: { hp: 100, at: 103, df: 75, sa: 120, sd: 75, sp: 127 },
          weightkg: 5.2,
          abilities: { 0: "Serene Grace" },
          gender: "N",
          baseSpecies: "Shaymin"
        },
        Shellos: {
          types: ["Water"],
          bs: { hp: 76, at: 48, df: 48, sa: 57, sd: 62, sp: 34 },
          weightkg: 6.3,
          nfe: true,
          abilities: { 0: "Sticky Hold" }
        },
        Shieldon: {
          types: ["Rock", "Steel"],
          bs: { hp: 30, at: 42, df: 118, sa: 42, sd: 88, sp: 30 },
          weightkg: 57,
          nfe: true,
          abilities: { 0: "Sturdy" }
        },
        Shinx: {
          types: ["Electric"],
          bs: { hp: 45, at: 65, df: 34, sa: 40, sd: 34, sp: 45 },
          weightkg: 9.5,
          nfe: true,
          abilities: { 0: "Rivalry" }
        },
        Skorupi: {
          types: ["Poison", "Bug"],
          bs: { hp: 40, at: 50, df: 90, sa: 30, sd: 55, sp: 65 },
          weightkg: 12,
          nfe: true,
          abilities: { 0: "Battle Armor" }
        },
        Skuntank: {
          types: ["Poison", "Dark"],
          bs: { hp: 103, at: 93, df: 67, sa: 71, sd: 61, sp: 84 },
          weightkg: 38,
          abilities: { 0: "Stench" }
        },
        Snover: {
          types: ["Grass", "Ice"],
          bs: { hp: 60, at: 62, df: 50, sa: 62, sd: 60, sp: 40 },
          weightkg: 50.5,
          nfe: true,
          abilities: { 0: "Snow Warning" }
        },
        Spiritomb: {
          types: ["Ghost", "Dark"],
          bs: { hp: 50, at: 92, df: 108, sa: 92, sd: 108, sp: 35 },
          weightkg: 108,
          abilities: { 0: "Pressure" }
        },
        Staraptor: {
          types: ["Normal", "Flying"],
          bs: { hp: 85, at: 120, df: 70, sa: 50, sd: 50, sp: 100 },
          weightkg: 24.9,
          abilities: { 0: "Intimidate" }
        },
        Staravia: {
          types: ["Normal", "Flying"],
          bs: { hp: 55, at: 75, df: 50, sa: 40, sd: 40, sp: 80 },
          weightkg: 15.5,
          nfe: true,
          abilities: { 0: "Intimidate" }
        },
        Starly: {
          types: ["Normal", "Flying"],
          bs: { hp: 40, at: 55, df: 30, sa: 30, sd: 30, sp: 60 },
          weightkg: 2,
          nfe: true,
          abilities: { 0: "Keen Eye" }
        },
        Stratagem: {
          types: ["Rock"],
          bs: { hp: 90, at: 60, df: 65, sa: 120, sd: 70, sp: 130 },
          weightkg: 45,
          gender: "N",
          abilities: { 0: "Levitate" }
        },
        Stunky: {
          types: ["Poison", "Dark"],
          bs: { hp: 63, at: 63, df: 47, sa: 41, sd: 41, sp: 74 },
          weightkg: 19.2,
          nfe: true,
          abilities: { 0: "Stench" }
        },
        Syclant: {
          types: ["Ice", "Bug"],
          bs: { hp: 70, at: 116, df: 70, sa: 114, sd: 64, sp: 121 },
          weightkg: 52,
          abilities: { 0: "Compound Eyes" }
        },
        Syclar: {
          types: ["Ice", "Bug"],
          bs: { hp: 40, at: 76, df: 45, sa: 74, sd: 39, sp: 91 },
          weightkg: 4,
          nfe: true,
          abilities: { 0: "Compound Eyes" }
        },
        Tactite: {
          types: ["Rock"],
          bs: { hp: 70, at: 40, df: 65, sa: 100, sd: 65, sp: 95 },
          weightkg: 16,
          nfe: true,
          gender: "N",
          abilities: { 0: "Levitate" }
        },
        Tangrowth: {
          types: ["Grass"],
          bs: { hp: 100, at: 100, df: 125, sa: 110, sd: 50, sp: 50 },
          weightkg: 128.6,
          abilities: { 0: "Chlorophyll" }
        },
        Togekiss: {
          types: ["Normal", "Flying"],
          bs: { hp: 85, at: 50, df: 95, sa: 120, sd: 115, sp: 80 },
          weightkg: 38,
          abilities: { 0: "Hustle" }
        },
        Torterra: {
          types: ["Grass", "Ground"],
          bs: { hp: 95, at: 109, df: 105, sa: 75, sd: 85, sp: 56 },
          weightkg: 310,
          abilities: { 0: "Overgrow" }
        },
        Toxicroak: {
          types: ["Poison", "Fighting"],
          bs: { hp: 83, at: 106, df: 65, sa: 86, sd: 65, sp: 85 },
          weightkg: 44.4,
          abilities: { 0: "Anticipation" }
        },
        Turtwig: {
          types: ["Grass"],
          bs: { hp: 55, at: 68, df: 64, sa: 45, sd: 55, sp: 31 },
          weightkg: 10.2,
          nfe: true,
          abilities: { 0: "Overgrow" }
        },
        Uxie: {
          types: ["Psychic"],
          bs: { hp: 75, at: 75, df: 130, sa: 75, sd: 130, sp: 95 },
          weightkg: 0.3,
          abilities: { 0: "Levitate" },
          gender: "N"
        },
        Vespiquen: {
          types: ["Bug", "Flying"],
          bs: { hp: 70, at: 80, df: 102, sa: 80, sd: 102, sp: 40 },
          weightkg: 38.5,
          abilities: { 0: "Pressure" }
        },
        Voodoll: {
          types: ["Normal", "Dark"],
          bs: { hp: 55, at: 40, df: 55, sa: 75, sd: 50, sp: 70 },
          weightkg: 25,
          nfe: true,
          abilities: { 0: "Volt Absorb" }
        },
        Voodoom: {
          types: ["Fighting", "Dark"],
          bs: { hp: 90, at: 85, df: 80, sa: 105, sd: 80, sp: 110 },
          weightkg: 75.5,
          abilities: { 0: "Volt Absorb" }
        },
        Weavile: {
          types: ["Dark", "Ice"],
          bs: { hp: 70, at: 120, df: 65, sa: 45, sd: 85, sp: 125 },
          weightkg: 34,
          abilities: { 0: "Pressure" }
        },
        Wormadam: {
          types: ["Bug", "Grass"],
          bs: { hp: 60, at: 59, df: 85, sa: 79, sd: 105, sp: 36 },
          weightkg: 6.5,
          abilities: { 0: "Anticipation" },
          otherFormes: ["Wormadam-Sandy", "Wormadam-Trash"]
        },
        "Wormadam-Sandy": {
          types: ["Bug", "Ground"],
          bs: { hp: 60, at: 79, df: 105, sa: 59, sd: 85, sp: 36 },
          weightkg: 6.5,
          abilities: { 0: "Anticipation" },
          baseSpecies: "Wormadam"
        },
        "Wormadam-Trash": {
          types: ["Bug", "Steel"],
          bs: { hp: 60, at: 69, df: 95, sa: 69, sd: 95, sp: 36 },
          weightkg: 6.5,
          abilities: { 0: "Anticipation" },
          baseSpecies: "Wormadam"
        },
        Yanmega: {
          types: ["Bug", "Flying"],
          bs: { hp: 86, at: 76, df: 86, sa: 116, sd: 56, sp: 95 },
          weightkg: 51.5,
          abilities: { 0: "Speed Boost" }
        }
      };
      var DPP = (0, util_1.extend)(true, {}, ADV, DPP_PATCH);
      var BW_PATCH = {
        "Rotom-Fan": { types: ["Electric", "Flying"] },
        "Rotom-Frost": { types: ["Electric", "Ice"] },
        "Rotom-Heat": { types: ["Electric", "Fire"] },
        "Rotom-Mow": { types: ["Electric", "Grass"] },
        "Rotom-Wash": { types: ["Electric", "Water"] },
        Accelgor: {
          types: ["Bug"],
          bs: { hp: 80, at: 70, df: 40, sa: 100, sd: 60, sp: 145 },
          weightkg: 25.3,
          abilities: { 0: "Hydration" }
        },
        Alomomola: {
          types: ["Water"],
          bs: { hp: 165, at: 75, df: 80, sa: 40, sd: 45, sp: 65 },
          weightkg: 31.6,
          abilities: { 0: "Healer" }
        },
        Amoonguss: {
          types: ["Grass", "Poison"],
          bs: { hp: 114, at: 85, df: 70, sa: 85, sd: 80, sp: 30 },
          weightkg: 10.5,
          abilities: { 0: "Effect Spore" }
        },
        Archen: {
          types: ["Rock", "Flying"],
          bs: { hp: 55, at: 112, df: 45, sa: 74, sd: 45, sp: 70 },
          weightkg: 9.5,
          abilities: { 0: "Defeatist" },
          nfe: true
        },
        Archeops: {
          types: ["Rock", "Flying"],
          bs: { hp: 75, at: 140, df: 65, sa: 112, sd: 65, sp: 110 },
          weightkg: 32,
          abilities: { 0: "Defeatist" }
        },
        Argalis: {
          types: ["Bug", "Psychic"],
          bs: { hp: 60, at: 90, df: 89, sa: 87, sd: 40, sp: 54 },
          weightkg: 341.4,
          nfe: true,
          abilities: { 0: "Shed Skin" }
        },
        Audino: {
          types: ["Normal"],
          bs: { hp: 103, at: 60, df: 86, sa: 60, sd: 86, sp: 50 },
          weightkg: 31,
          abilities: { 0: "Healer" }
        },
        Aurumoth: {
          types: ["Bug", "Psychic"],
          bs: { hp: 110, at: 120, df: 99, sa: 117, sd: 60, sp: 94 },
          weightkg: 193,
          abilities: { 0: "Weak Armor" }
        },
        Axew: {
          types: ["Dragon"],
          bs: { hp: 46, at: 87, df: 60, sa: 30, sd: 40, sp: 57 },
          weightkg: 18,
          nfe: true,
          abilities: { 0: "Rivalry" }
        },
        Basculin: {
          types: ["Water"],
          bs: { hp: 70, at: 92, df: 65, sa: 80, sd: 55, sp: 98 },
          weightkg: 18,
          abilities: { 0: "Reckless" },
          otherFormes: ["Basculin-Blue-Striped"]
        },
        "Basculin-Blue-Striped": {
          types: ["Water"],
          bs: { hp: 70, at: 92, df: 65, sa: 80, sd: 55, sp: 98 },
          weightkg: 18,
          abilities: { 0: "Rock Head" },
          baseSpecies: "Basculin"
        },
        Beartic: {
          types: ["Ice"],
          bs: { hp: 95, at: 110, df: 80, sa: 70, sd: 80, sp: 50 },
          weightkg: 260,
          abilities: { 0: "Snow Cloak" }
        },
        Beheeyem: {
          types: ["Psychic"],
          bs: { hp: 75, at: 75, df: 75, sa: 125, sd: 95, sp: 40 },
          weightkg: 34.5,
          abilities: { 0: "Telepathy" }
        },
        Bisharp: {
          types: ["Dark", "Steel"],
          bs: { hp: 65, at: 125, df: 100, sa: 60, sd: 70, sp: 70 },
          weightkg: 70,
          abilities: { 0: "Defiant" }
        },
        Blitzle: {
          types: ["Electric"],
          bs: { hp: 45, at: 60, df: 32, sa: 50, sd: 32, sp: 76 },
          weightkg: 29.8,
          nfe: true,
          abilities: { 0: "Lightning Rod" }
        },
        Boldore: {
          types: ["Rock"],
          bs: { hp: 70, at: 105, df: 105, sa: 50, sd: 40, sp: 20 },
          weightkg: 102,
          nfe: true,
          abilities: { 0: "Sturdy" }
        },
        Bouffalant: {
          types: ["Normal"],
          bs: { hp: 95, at: 110, df: 95, sa: 40, sd: 95, sp: 55 },
          weightkg: 94.6,
          abilities: { 0: "Reckless" }
        },
        Brattler: {
          types: ["Dark", "Grass"],
          bs: { hp: 80, at: 70, df: 40, sa: 20, sd: 90, sp: 30 },
          weightkg: 11.5,
          nfe: true,
          abilities: { 0: "Harvest" }
        },
        Braviary: {
          types: ["Normal", "Flying"],
          bs: { hp: 100, at: 123, df: 75, sa: 57, sd: 75, sp: 80 },
          weightkg: 41,
          abilities: { 0: "Keen Eye" }
        },
        Carracosta: {
          types: ["Water", "Rock"],
          bs: { hp: 74, at: 108, df: 133, sa: 83, sd: 65, sp: 32 },
          weightkg: 81,
          abilities: { 0: "Solid Rock" }
        },
        Cawdet: {
          types: ["Steel", "Flying"],
          bs: { hp: 35, at: 72, df: 85, sa: 40, sd: 55, sp: 88 },
          weightkg: 25,
          nfe: true,
          abilities: { 0: "Keen Eye" }
        },
        Cawmodore: {
          types: ["Steel", "Flying"],
          bs: { hp: 50, at: 92, df: 130, sa: 65, sd: 75, sp: 118 },
          weightkg: 37,
          abilities: { 0: "Intimidate" }
        },
        Chandelure: {
          types: ["Ghost", "Fire"],
          bs: { hp: 60, at: 55, df: 90, sa: 145, sd: 90, sp: 80 },
          weightkg: 34.3,
          abilities: { 0: "Flash Fire" }
        },
        Cinccino: {
          types: ["Normal"],
          bs: { hp: 75, at: 95, df: 60, sa: 65, sd: 60, sp: 115 },
          weightkg: 7.5,
          abilities: { 0: "Cute Charm" }
        },
        Cobalion: {
          types: ["Steel", "Fighting"],
          bs: { hp: 91, at: 90, df: 129, sa: 90, sd: 72, sp: 108 },
          weightkg: 250,
          abilities: { 0: "Justified" },
          gender: "N"
        },
        Cofagrigus: {
          types: ["Ghost"],
          bs: { hp: 58, at: 50, df: 145, sa: 95, sd: 105, sp: 30 },
          weightkg: 76.5,
          abilities: { 0: "Mummy" }
        },
        Conkeldurr: {
          types: ["Fighting"],
          bs: { hp: 105, at: 140, df: 95, sa: 55, sd: 65, sp: 45 },
          weightkg: 87,
          abilities: { 0: "Guts" }
        },
        Cottonee: {
          types: ["Grass"],
          bs: { hp: 40, at: 27, df: 60, sa: 37, sd: 50, sp: 66 },
          weightkg: 0.6,
          nfe: true,
          abilities: { 0: "Prankster" }
        },
        Crustle: {
          types: ["Bug", "Rock"],
          bs: { hp: 70, at: 95, df: 125, sa: 65, sd: 75, sp: 45 },
          weightkg: 200,
          abilities: { 0: "Sturdy" }
        },
        Cryogonal: {
          types: ["Ice"],
          bs: { hp: 70, at: 50, df: 30, sa: 95, sd: 135, sp: 105 },
          weightkg: 148,
          abilities: { 0: "Levitate" },
          gender: "N"
        },
        Cubchoo: {
          types: ["Ice"],
          bs: { hp: 55, at: 70, df: 40, sa: 60, sd: 40, sp: 40 },
          weightkg: 8.5,
          nfe: true,
          abilities: { 0: "Snow Cloak" }
        },
        Cupra: {
          types: ["Bug", "Psychic"],
          bs: { hp: 50, at: 60, df: 49, sa: 67, sd: 30, sp: 44 },
          weightkg: 4.8,
          nfe: true,
          abilities: { 0: "Shield Dust" }
        },
        Darmanitan: {
          types: ["Fire"],
          bs: { hp: 105, at: 140, df: 55, sa: 30, sd: 55, sp: 95 },
          weightkg: 92.9,
          abilities: { 0: "Sheer Force" },
          otherFormes: ["Darmanitan-Zen"]
        },
        "Darmanitan-Zen": {
          types: ["Fire", "Psychic"],
          bs: { hp: 105, at: 30, df: 105, sa: 140, sd: 105, sp: 55 },
          weightkg: 92.9,
          baseSpecies: "Darmanitan",
          abilities: { 0: "Zen Mode" }
        },
        Darumaka: {
          types: ["Fire"],
          bs: { hp: 70, at: 90, df: 45, sa: 15, sd: 45, sp: 50 },
          weightkg: 37.5,
          nfe: true,
          abilities: { 0: "Hustle" }
        },
        Deerling: {
          types: ["Normal", "Grass"],
          bs: { hp: 60, at: 60, df: 50, sa: 40, sd: 50, sp: 75 },
          weightkg: 19.5,
          nfe: true,
          abilities: { 0: "Chlorophyll" }
        },
        Deino: {
          types: ["Dark", "Dragon"],
          bs: { hp: 52, at: 65, df: 50, sa: 45, sd: 50, sp: 38 },
          weightkg: 17.3,
          abilities: { 0: "Hustle" },
          nfe: true
        },
        Dewott: {
          types: ["Water"],
          bs: { hp: 75, at: 75, df: 60, sa: 83, sd: 60, sp: 60 },
          weightkg: 24.5,
          nfe: true,
          abilities: { 0: "Torrent" }
        },
        Drilbur: {
          types: ["Ground"],
          bs: { hp: 60, at: 85, df: 40, sa: 30, sd: 45, sp: 68 },
          weightkg: 8.5,
          nfe: true,
          abilities: { 0: "Sand Rush" }
        },
        Druddigon: {
          types: ["Dragon"],
          bs: { hp: 77, at: 120, df: 90, sa: 60, sd: 90, sp: 48 },
          weightkg: 139,
          abilities: { 0: "Rough Skin" }
        },
        Ducklett: {
          types: ["Water", "Flying"],
          bs: { hp: 62, at: 44, df: 50, sa: 44, sd: 50, sp: 55 },
          weightkg: 5.5,
          nfe: true,
          abilities: { 0: "Keen Eye" }
        },
        Duosion: {
          types: ["Psychic"],
          bs: { hp: 65, at: 40, df: 50, sa: 125, sd: 60, sp: 30 },
          weightkg: 8,
          nfe: true,
          abilities: { 0: "Overcoat" }
        },
        Durant: {
          types: ["Bug", "Steel"],
          bs: { hp: 58, at: 109, df: 112, sa: 48, sd: 48, sp: 109 },
          weightkg: 33,
          abilities: { 0: "Swarm" }
        },
        Dwebble: {
          types: ["Bug", "Rock"],
          bs: { hp: 50, at: 65, df: 85, sa: 35, sd: 35, sp: 55 },
          weightkg: 14.5,
          nfe: true,
          abilities: { 0: "Sturdy" }
        },
        Eelektrik: {
          types: ["Electric"],
          bs: { hp: 65, at: 85, df: 70, sa: 75, sd: 70, sp: 40 },
          weightkg: 22,
          abilities: { 0: "Levitate" },
          nfe: true
        },
        Eelektross: {
          types: ["Electric"],
          bs: { hp: 85, at: 115, df: 80, sa: 105, sd: 80, sp: 50 },
          weightkg: 80.5,
          abilities: { 0: "Levitate" }
        },
        Elgyem: {
          types: ["Psychic"],
          bs: { hp: 55, at: 55, df: 55, sa: 85, sd: 55, sp: 30 },
          weightkg: 9,
          nfe: true,
          abilities: { 0: "Telepathy" }
        },
        Emboar: {
          types: ["Fire", "Fighting"],
          bs: { hp: 110, at: 123, df: 65, sa: 100, sd: 65, sp: 65 },
          weightkg: 150,
          abilities: { 0: "Blaze" }
        },
        Emolga: {
          types: ["Electric", "Flying"],
          bs: { hp: 55, at: 75, df: 60, sa: 75, sd: 60, sp: 103 },
          weightkg: 5,
          abilities: { 0: "Static" }
        },
        Escavalier: {
          types: ["Bug", "Steel"],
          bs: { hp: 70, at: 135, df: 105, sa: 60, sd: 105, sp: 20 },
          weightkg: 33,
          abilities: { 0: "Swarm" }
        },
        Excadrill: {
          types: ["Ground", "Steel"],
          bs: { hp: 110, at: 135, df: 60, sa: 50, sd: 65, sp: 88 },
          weightkg: 40.4,
          abilities: { 0: "Sand Rush" }
        },
        Ferroseed: {
          types: ["Grass", "Steel"],
          bs: { hp: 44, at: 50, df: 91, sa: 24, sd: 86, sp: 10 },
          weightkg: 18.8,
          nfe: true,
          abilities: { 0: "Iron Barbs" }
        },
        Ferrothorn: {
          types: ["Grass", "Steel"],
          bs: { hp: 74, at: 94, df: 131, sa: 54, sd: 116, sp: 20 },
          weightkg: 110,
          abilities: { 0: "Iron Barbs" }
        },
        Foongus: {
          types: ["Grass", "Poison"],
          bs: { hp: 69, at: 55, df: 45, sa: 55, sd: 55, sp: 15 },
          weightkg: 1,
          nfe: true,
          abilities: { 0: "Effect Spore" }
        },
        Fraxure: {
          types: ["Dragon"],
          bs: { hp: 66, at: 117, df: 70, sa: 40, sd: 50, sp: 67 },
          weightkg: 36,
          nfe: true,
          abilities: { 0: "Rivalry" }
        },
        Frillish: {
          types: ["Water", "Ghost"],
          bs: { hp: 55, at: 40, df: 50, sa: 65, sd: 85, sp: 40 },
          weightkg: 33,
          nfe: true,
          abilities: { 0: "Water Absorb" }
        },
        Galvantula: {
          types: ["Bug", "Electric"],
          bs: { hp: 70, at: 77, df: 60, sa: 97, sd: 60, sp: 108 },
          weightkg: 14.3,
          abilities: { 0: "Compound Eyes" }
        },
        Garbodor: {
          types: ["Poison"],
          bs: { hp: 80, at: 95, df: 82, sa: 60, sd: 82, sp: 75 },
          weightkg: 107.3,
          abilities: { 0: "Stench" }
        },
        Genesect: {
          types: ["Bug", "Steel"],
          bs: { hp: 71, at: 120, df: 95, sa: 120, sd: 95, sp: 99 },
          weightkg: 82.5,
          abilities: { 0: "Download" },
          gender: "N",
          otherFormes: ["Genesect-Burn", "Genesect-Chill", "Genesect-Douse", "Genesect-Shock"]
        },
        "Genesect-Burn": {
          types: ["Bug", "Steel"],
          bs: { hp: 71, at: 120, df: 95, sa: 120, sd: 95, sp: 99 },
          weightkg: 82.5,
          abilities: { 0: "Download" },
          gender: "N",
          baseSpecies: "Genesect"
        },
        "Genesect-Chill": {
          types: ["Bug", "Steel"],
          bs: { hp: 71, at: 120, df: 95, sa: 120, sd: 95, sp: 99 },
          weightkg: 82.5,
          abilities: { 0: "Download" },
          gender: "N",
          baseSpecies: "Genesect"
        },
        "Genesect-Douse": {
          types: ["Bug", "Steel"],
          bs: { hp: 71, at: 120, df: 95, sa: 120, sd: 95, sp: 99 },
          weightkg: 82.5,
          abilities: { 0: "Download" },
          gender: "N",
          baseSpecies: "Genesect"
        },
        "Genesect-Shock": {
          types: ["Bug", "Steel"],
          bs: { hp: 71, at: 120, df: 95, sa: 120, sd: 95, sp: 99 },
          weightkg: 82.5,
          abilities: { 0: "Download" },
          gender: "N",
          baseSpecies: "Genesect"
        },
        Gigalith: {
          types: ["Rock"],
          bs: { hp: 85, at: 135, df: 130, sa: 60, sd: 70, sp: 25 },
          weightkg: 260,
          abilities: { 0: "Sturdy" }
        },
        Golett: {
          types: ["Ground", "Ghost"],
          bs: { hp: 59, at: 74, df: 50, sa: 35, sd: 50, sp: 35 },
          weightkg: 92,
          nfe: true,
          gender: "N",
          abilities: { 0: "Iron Fist" }
        },
        Golurk: {
          types: ["Ground", "Ghost"],
          bs: { hp: 89, at: 124, df: 80, sa: 55, sd: 80, sp: 55 },
          weightkg: 330,
          gender: "N",
          abilities: { 0: "Iron Fist" }
        },
        Gothita: {
          types: ["Psychic"],
          bs: { hp: 45, at: 30, df: 50, sa: 55, sd: 65, sp: 45 },
          weightkg: 5.8,
          nfe: true,
          abilities: { 0: "Frisk" }
        },
        Gothitelle: {
          types: ["Psychic"],
          bs: { hp: 70, at: 55, df: 95, sa: 95, sd: 110, sp: 65 },
          weightkg: 44,
          abilities: { 0: "Frisk" }
        },
        Gothorita: {
          types: ["Psychic"],
          bs: { hp: 60, at: 45, df: 70, sa: 75, sd: 85, sp: 55 },
          weightkg: 18,
          nfe: true,
          abilities: { 0: "Frisk" }
        },
        Gurdurr: {
          types: ["Fighting"],
          bs: { hp: 85, at: 105, df: 85, sa: 40, sd: 50, sp: 40 },
          weightkg: 40,
          nfe: true,
          abilities: { 0: "Guts" }
        },
        Haxorus: {
          types: ["Dragon"],
          bs: { hp: 76, at: 147, df: 90, sa: 60, sd: 70, sp: 97 },
          weightkg: 105.5,
          abilities: { 0: "Rivalry" }
        },
        Heatmor: {
          types: ["Fire"],
          bs: { hp: 85, at: 97, df: 66, sa: 105, sd: 66, sp: 65 },
          weightkg: 58,
          abilities: { 0: "Gluttony" }
        },
        Herdier: {
          types: ["Normal"],
          bs: { hp: 65, at: 80, df: 65, sa: 35, sd: 65, sp: 60 },
          weightkg: 14.7,
          nfe: true,
          abilities: { 0: "Intimidate" }
        },
        Hydreigon: {
          types: ["Dark", "Dragon"],
          bs: { hp: 92, at: 105, df: 90, sa: 125, sd: 90, sp: 98 },
          weightkg: 160,
          abilities: { 0: "Levitate" }
        },
        Jellicent: {
          types: ["Water", "Ghost"],
          bs: { hp: 100, at: 60, df: 70, sa: 85, sd: 105, sp: 60 },
          weightkg: 135,
          abilities: { 0: "Water Absorb" }
        },
        Joltik: {
          types: ["Bug", "Electric"],
          bs: { hp: 50, at: 47, df: 50, sa: 57, sd: 50, sp: 65 },
          weightkg: 0.6,
          nfe: true,
          abilities: { 0: "Compound Eyes" }
        },
        Karrablast: {
          types: ["Bug"],
          bs: { hp: 50, at: 75, df: 45, sa: 40, sd: 45, sp: 60 },
          weightkg: 5.9,
          nfe: true,
          abilities: { 0: "Swarm" }
        },
        Keldeo: {
          types: ["Water", "Fighting"],
          bs: { hp: 91, at: 72, df: 90, sa: 129, sd: 90, sp: 108 },
          weightkg: 48.5,
          abilities: { 0: "Justified" },
          gender: "N",
          otherFormes: ["Keldeo-Resolute"]
        },
        "Keldeo-Resolute": {
          types: ["Water", "Fighting"],
          bs: { hp: 91, at: 72, df: 90, sa: 129, sd: 90, sp: 108 },
          weightkg: 48.5,
          abilities: { 0: "Justified" },
          gender: "N",
          baseSpecies: "Keldeo"
        },
        Klang: {
          types: ["Steel"],
          bs: { hp: 60, at: 80, df: 95, sa: 70, sd: 85, sp: 50 },
          weightkg: 51,
          nfe: true,
          gender: "N",
          abilities: { 0: "Plus" }
        },
        Klink: {
          types: ["Steel"],
          bs: { hp: 40, at: 55, df: 70, sa: 45, sd: 60, sp: 30 },
          weightkg: 21,
          nfe: true,
          gender: "N",
          abilities: { 0: "Plus" }
        },
        Klinklang: {
          types: ["Steel"],
          bs: { hp: 60, at: 100, df: 115, sa: 70, sd: 85, sp: 90 },
          weightkg: 81,
          gender: "N",
          abilities: { 0: "Plus" }
        },
        Krokorok: {
          types: ["Ground", "Dark"],
          bs: { hp: 60, at: 82, df: 45, sa: 45, sd: 45, sp: 74 },
          weightkg: 33.4,
          nfe: true,
          abilities: { 0: "Intimidate" }
        },
        Krookodile: {
          types: ["Ground", "Dark"],
          bs: { hp: 95, at: 117, df: 70, sa: 65, sd: 70, sp: 92 },
          weightkg: 96.3,
          abilities: { 0: "Intimidate" }
        },
        Kyurem: {
          types: ["Dragon", "Ice"],
          bs: { hp: 125, at: 130, df: 90, sa: 130, sd: 90, sp: 95 },
          weightkg: 325,
          abilities: { 0: "Pressure" },
          gender: "N",
          otherFormes: ["Kyurem-Black", "Kyurem-White"]
        },
        "Kyurem-Black": {
          types: ["Dragon", "Ice"],
          bs: { hp: 125, at: 170, df: 100, sa: 120, sd: 90, sp: 95 },
          weightkg: 325,
          abilities: { 0: "Teravolt" },
          gender: "N",
          baseSpecies: "Kyurem"
        },
        "Kyurem-White": {
          types: ["Dragon", "Ice"],
          bs: { hp: 125, at: 120, df: 90, sa: 170, sd: 100, sp: 95 },
          weightkg: 325,
          abilities: { 0: "Turboblaze" },
          gender: "N",
          baseSpecies: "Kyurem"
        },
        Lampent: {
          types: ["Ghost", "Fire"],
          bs: { hp: 60, at: 40, df: 60, sa: 95, sd: 60, sp: 55 },
          weightkg: 13,
          nfe: true,
          abilities: { 0: "Flash Fire" }
        },
        Landorus: {
          types: ["Ground", "Flying"],
          bs: { hp: 89, at: 125, df: 90, sa: 115, sd: 80, sp: 101 },
          weightkg: 68,
          abilities: { 0: "Sand Force" },
          otherFormes: ["Landorus-Therian"]
        },
        "Landorus-Therian": {
          types: ["Ground", "Flying"],
          bs: { hp: 89, at: 145, df: 90, sa: 105, sd: 80, sp: 91 },
          weightkg: 68,
          abilities: { 0: "Intimidate" },
          baseSpecies: "Landorus"
        },
        Larvesta: {
          types: ["Bug", "Fire"],
          bs: { hp: 55, at: 85, df: 55, sa: 50, sd: 55, sp: 60 },
          weightkg: 28.8,
          nfe: true,
          abilities: { 0: "Flame Body" }
        },
        Leavanny: {
          types: ["Bug", "Grass"],
          bs: { hp: 75, at: 103, df: 80, sa: 70, sd: 70, sp: 92 },
          weightkg: 20.5,
          abilities: { 0: "Swarm" }
        },
        Liepard: {
          types: ["Dark"],
          bs: { hp: 64, at: 88, df: 50, sa: 88, sd: 50, sp: 106 },
          weightkg: 37.5,
          abilities: { 0: "Limber" }
        },
        Lilligant: {
          types: ["Grass"],
          bs: { hp: 70, at: 60, df: 75, sa: 110, sd: 75, sp: 90 },
          weightkg: 16.3,
          abilities: { 0: "Chlorophyll" }
        },
        Lillipup: {
          types: ["Normal"],
          bs: { hp: 45, at: 60, df: 45, sa: 25, sd: 45, sp: 55 },
          weightkg: 4.1,
          nfe: true,
          abilities: { 0: "Vital Spirit" }
        },
        Litwick: {
          types: ["Ghost", "Fire"],
          bs: { hp: 50, at: 30, df: 55, sa: 65, sd: 55, sp: 20 },
          weightkg: 3.1,
          nfe: true,
          abilities: { 0: "Flash Fire" }
        },
        Malaconda: {
          types: ["Dark", "Grass"],
          bs: { hp: 115, at: 100, df: 60, sa: 40, sd: 130, sp: 55 },
          weightkg: 108.8,
          abilities: { 0: "Harvest" }
        },
        Mandibuzz: {
          types: ["Dark", "Flying"],
          bs: { hp: 110, at: 65, df: 105, sa: 55, sd: 95, sp: 80 },
          weightkg: 39.5,
          abilities: { 0: "Big Pecks" }
        },
        Maractus: {
          types: ["Grass"],
          bs: { hp: 75, at: 86, df: 67, sa: 106, sd: 67, sp: 60 },
          weightkg: 28,
          abilities: { 0: "Water Absorb" }
        },
        Meloetta: {
          types: ["Normal", "Psychic"],
          bs: { hp: 100, at: 77, df: 77, sa: 128, sd: 128, sp: 90 },
          weightkg: 6.5,
          abilities: { 0: "Serene Grace" },
          otherFormes: ["Meloetta-Pirouette"],
          gender: "N"
        },
        "Meloetta-Pirouette": {
          types: ["Normal", "Fighting"],
          bs: { hp: 100, at: 128, df: 90, sa: 77, sd: 77, sp: 128 },
          weightkg: 6.5,
          abilities: { 0: "Serene Grace" },
          baseSpecies: "Meloetta",
          gender: "N"
        },
        Mienfoo: {
          types: ["Fighting"],
          bs: { hp: 45, at: 85, df: 50, sa: 55, sd: 50, sp: 65 },
          weightkg: 20,
          nfe: true,
          abilities: { 0: "Inner Focus" }
        },
        Mienshao: {
          types: ["Fighting"],
          bs: { hp: 65, at: 125, df: 60, sa: 95, sd: 60, sp: 105 },
          weightkg: 35.5,
          abilities: { 0: "Inner Focus" }
        },
        Minccino: {
          types: ["Normal"],
          bs: { hp: 55, at: 50, df: 40, sa: 40, sd: 40, sp: 75 },
          weightkg: 5.8,
          nfe: true,
          abilities: { 0: "Cute Charm" }
        },
        Mollux: {
          types: ["Fire", "Poison"],
          bs: { hp: 95, at: 45, df: 83, sa: 131, sd: 105, sp: 76 },
          weightkg: 41,
          abilities: { 0: "Dry Skin" }
        },
        Munna: {
          types: ["Psychic"],
          bs: { hp: 76, at: 25, df: 45, sa: 67, sd: 55, sp: 24 },
          weightkg: 23.3,
          nfe: true,
          abilities: { 0: "Forewarn" }
        },
        Musharna: {
          types: ["Psychic"],
          bs: { hp: 116, at: 55, df: 85, sa: 107, sd: 95, sp: 29 },
          weightkg: 60.5,
          abilities: { 0: "Forewarn" }
        },
        Necturine: {
          types: ["Grass", "Ghost"],
          bs: { hp: 49, at: 55, df: 60, sa: 50, sd: 75, sp: 51 },
          weightkg: 1.8,
          nfe: true,
          abilities: { 0: "Anticipation" }
        },
        Necturna: {
          types: ["Grass", "Ghost"],
          bs: { hp: 64, at: 120, df: 100, sa: 85, sd: 120, sp: 81 },
          weightkg: 49.6,
          abilities: { 0: "Forewarn" }
        },
        Oshawott: {
          types: ["Water"],
          bs: { hp: 55, at: 55, df: 45, sa: 63, sd: 45, sp: 45 },
          weightkg: 5.9,
          nfe: true,
          abilities: { 0: "Torrent" }
        },
        Palpitoad: {
          types: ["Water", "Ground"],
          bs: { hp: 75, at: 65, df: 55, sa: 65, sd: 55, sp: 69 },
          weightkg: 17,
          nfe: true,
          abilities: { 0: "Swift Swim" }
        },
        Panpour: {
          types: ["Water"],
          bs: { hp: 50, at: 53, df: 48, sa: 53, sd: 48, sp: 64 },
          weightkg: 13.5,
          nfe: true,
          abilities: { 0: "Gluttony" }
        },
        Pansage: {
          types: ["Grass"],
          bs: { hp: 50, at: 53, df: 48, sa: 53, sd: 48, sp: 64 },
          weightkg: 10.5,
          nfe: true,
          abilities: { 0: "Gluttony" }
        },
        Pansear: {
          types: ["Fire"],
          bs: { hp: 50, at: 53, df: 48, sa: 53, sd: 48, sp: 64 },
          weightkg: 11,
          nfe: true,
          abilities: { 0: "Gluttony" }
        },
        Patrat: {
          types: ["Normal"],
          bs: { hp: 45, at: 55, df: 39, sa: 35, sd: 39, sp: 42 },
          weightkg: 11.6,
          nfe: true,
          abilities: { 0: "Run Away" }
        },
        Pawniard: {
          types: ["Dark", "Steel"],
          bs: { hp: 45, at: 85, df: 70, sa: 40, sd: 40, sp: 60 },
          weightkg: 10.2,
          nfe: true,
          abilities: { 0: "Defiant" }
        },
        Petilil: {
          types: ["Grass"],
          bs: { hp: 45, at: 35, df: 50, sa: 70, sd: 50, sp: 30 },
          weightkg: 6.6,
          nfe: true,
          abilities: { 0: "Chlorophyll" }
        },
        Pidove: {
          types: ["Normal", "Flying"],
          bs: { hp: 50, at: 55, df: 50, sa: 36, sd: 30, sp: 43 },
          weightkg: 2.1,
          nfe: true,
          abilities: { 0: "Big Pecks" }
        },
        Pignite: {
          types: ["Fire", "Fighting"],
          bs: { hp: 90, at: 93, df: 55, sa: 70, sd: 55, sp: 55 },
          weightkg: 55.5,
          nfe: true,
          abilities: { 0: "Blaze" }
        },
        Purrloin: {
          types: ["Dark"],
          bs: { hp: 41, at: 50, df: 37, sa: 50, sd: 37, sp: 66 },
          weightkg: 10.1,
          nfe: true,
          abilities: { 0: "Limber" }
        },
        Reshiram: {
          types: ["Dragon", "Fire"],
          bs: { hp: 100, at: 120, df: 100, sa: 150, sd: 120, sp: 90 },
          weightkg: 330,
          abilities: { 0: "Turboblaze" },
          gender: "N"
        },
        Reuniclus: {
          types: ["Psychic"],
          bs: { hp: 110, at: 65, df: 75, sa: 125, sd: 85, sp: 30 },
          weightkg: 20.1,
          abilities: { 0: "Overcoat" }
        },
        Roggenrola: {
          types: ["Rock"],
          bs: { hp: 55, at: 75, df: 85, sa: 25, sd: 25, sp: 15 },
          weightkg: 18,
          nfe: true,
          abilities: { 0: "Sturdy" }
        },
        Rufflet: {
          types: ["Normal", "Flying"],
          bs: { hp: 70, at: 83, df: 50, sa: 37, sd: 50, sp: 60 },
          weightkg: 10.5,
          nfe: true,
          abilities: { 0: "Keen Eye" }
        },
        Samurott: {
          types: ["Water"],
          bs: { hp: 95, at: 100, df: 85, sa: 108, sd: 70, sp: 70 },
          weightkg: 94.6,
          abilities: { 0: "Torrent" }
        },
        Sandile: {
          types: ["Ground", "Dark"],
          bs: { hp: 50, at: 72, df: 35, sa: 35, sd: 35, sp: 65 },
          weightkg: 15.2,
          nfe: true,
          abilities: { 0: "Intimidate" }
        },
        Sawk: {
          types: ["Fighting"],
          bs: { hp: 75, at: 125, df: 75, sa: 30, sd: 75, sp: 85 },
          weightkg: 51,
          abilities: { 0: "Sturdy" }
        },
        Sawsbuck: {
          types: ["Normal", "Grass"],
          bs: { hp: 80, at: 100, df: 70, sa: 60, sd: 70, sp: 95 },
          weightkg: 92.5,
          abilities: { 0: "Chlorophyll" }
        },
        Scolipede: {
          types: ["Bug", "Poison"],
          bs: { hp: 60, at: 90, df: 89, sa: 55, sd: 69, sp: 112 },
          weightkg: 200.5,
          abilities: { 0: "Poison Point" }
        },
        Scrafty: {
          types: ["Dark", "Fighting"],
          bs: { hp: 65, at: 90, df: 115, sa: 45, sd: 115, sp: 58 },
          weightkg: 30,
          abilities: { 0: "Shed Skin" }
        },
        Scraggy: {
          types: ["Dark", "Fighting"],
          bs: { hp: 50, at: 75, df: 70, sa: 35, sd: 70, sp: 48 },
          weightkg: 11.8,
          nfe: true,
          abilities: { 0: "Shed Skin" }
        },
        Scratchet: {
          types: ["Normal", "Fighting"],
          bs: { hp: 55, at: 85, df: 80, sa: 20, sd: 70, sp: 40 },
          weightkg: 20,
          nfe: true,
          abilities: { 0: "Scrappy" }
        },
        Seismitoad: {
          types: ["Water", "Ground"],
          bs: { hp: 105, at: 85, df: 75, sa: 85, sd: 75, sp: 74 },
          weightkg: 62,
          abilities: { 0: "Swift Swim" }
        },
        Serperior: {
          types: ["Grass"],
          bs: { hp: 75, at: 75, df: 95, sa: 75, sd: 95, sp: 113 },
          weightkg: 63,
          abilities: { 0: "Overgrow" }
        },
        Servine: {
          types: ["Grass"],
          bs: { hp: 60, at: 60, df: 75, sa: 60, sd: 75, sp: 83 },
          weightkg: 16,
          nfe: true,
          abilities: { 0: "Overgrow" }
        },
        Sewaddle: {
          types: ["Bug", "Grass"],
          bs: { hp: 45, at: 53, df: 70, sa: 40, sd: 60, sp: 42 },
          weightkg: 2.5,
          nfe: true,
          abilities: { 0: "Swarm" }
        },
        Shelmet: {
          types: ["Bug"],
          bs: { hp: 50, at: 40, df: 85, sa: 40, sd: 65, sp: 25 },
          weightkg: 7.7,
          nfe: true,
          abilities: { 0: "Hydration" }
        },
        Sigilyph: {
          types: ["Psychic", "Flying"],
          bs: { hp: 72, at: 58, df: 80, sa: 103, sd: 80, sp: 97 },
          weightkg: 14,
          abilities: { 0: "Wonder Skin" }
        },
        Simipour: {
          types: ["Water"],
          bs: { hp: 75, at: 98, df: 63, sa: 98, sd: 63, sp: 101 },
          weightkg: 29,
          abilities: { 0: "Gluttony" }
        },
        Simisage: {
          types: ["Grass"],
          bs: { hp: 75, at: 98, df: 63, sa: 98, sd: 63, sp: 101 },
          weightkg: 30.5,
          abilities: { 0: "Gluttony" }
        },
        Simisear: {
          types: ["Fire"],
          bs: { hp: 75, at: 98, df: 63, sa: 98, sd: 63, sp: 101 },
          weightkg: 28,
          abilities: { 0: "Gluttony" }
        },
        Snivy: {
          types: ["Grass"],
          bs: { hp: 45, at: 45, df: 55, sa: 45, sd: 55, sp: 63 },
          weightkg: 8.1,
          nfe: true,
          abilities: { 0: "Overgrow" }
        },
        Solosis: {
          types: ["Psychic"],
          bs: { hp: 45, at: 30, df: 40, sa: 105, sd: 50, sp: 20 },
          weightkg: 1,
          nfe: true,
          abilities: { 0: "Overcoat" }
        },
        Stoutland: {
          types: ["Normal"],
          bs: { hp: 85, at: 100, df: 90, sa: 45, sd: 90, sp: 80 },
          weightkg: 61,
          abilities: { 0: "Intimidate" }
        },
        Stunfisk: {
          types: ["Ground", "Electric"],
          bs: { hp: 109, at: 66, df: 84, sa: 81, sd: 99, sp: 32 },
          weightkg: 11,
          abilities: { 0: "Static" }
        },
        Swadloon: {
          types: ["Bug", "Grass"],
          bs: { hp: 55, at: 63, df: 90, sa: 50, sd: 80, sp: 42 },
          weightkg: 7.3,
          nfe: true,
          abilities: { 0: "Leaf Guard" }
        },
        Swanna: {
          types: ["Water", "Flying"],
          bs: { hp: 75, at: 87, df: 63, sa: 87, sd: 63, sp: 98 },
          weightkg: 24.2,
          abilities: { 0: "Keen Eye" }
        },
        Swoobat: {
          types: ["Psychic", "Flying"],
          bs: { hp: 67, at: 57, df: 55, sa: 77, sd: 55, sp: 114 },
          weightkg: 10.5,
          abilities: { 0: "Unaware" }
        },
        Tepig: {
          types: ["Fire"],
          bs: { hp: 65, at: 63, df: 45, sa: 45, sd: 45, sp: 45 },
          weightkg: 9.9,
          nfe: true,
          abilities: { 0: "Blaze" }
        },
        Terrakion: {
          types: ["Rock", "Fighting"],
          bs: { hp: 91, at: 129, df: 90, sa: 72, sd: 90, sp: 108 },
          weightkg: 260,
          abilities: { 0: "Justified" },
          gender: "N"
        },
        Throh: {
          types: ["Fighting"],
          bs: { hp: 120, at: 100, df: 85, sa: 30, sd: 85, sp: 45 },
          weightkg: 55.5,
          abilities: { 0: "Guts" }
        },
        Thundurus: {
          types: ["Electric", "Flying"],
          bs: { hp: 79, at: 115, df: 70, sa: 125, sd: 80, sp: 111 },
          weightkg: 61,
          abilities: { 0: "Prankster" },
          otherFormes: ["Thundurus-Therian"]
        },
        "Thundurus-Therian": {
          types: ["Electric", "Flying"],
          bs: { hp: 79, at: 105, df: 70, sa: 145, sd: 80, sp: 101 },
          weightkg: 61,
          abilities: { 0: "Volt Absorb" },
          baseSpecies: "Thundurus"
        },
        Timburr: {
          types: ["Fighting"],
          bs: { hp: 75, at: 80, df: 55, sa: 25, sd: 35, sp: 35 },
          weightkg: 12.5,
          nfe: true,
          abilities: { 0: "Guts" }
        },
        Tirtouga: {
          types: ["Water", "Rock"],
          bs: { hp: 54, at: 78, df: 103, sa: 53, sd: 45, sp: 22 },
          weightkg: 16.5,
          nfe: true,
          abilities: { 0: "Solid Rock" }
        },
        Tomohawk: {
          types: ["Flying", "Fighting"],
          bs: { hp: 105, at: 60, df: 90, sa: 115, sd: 80, sp: 85 },
          weightkg: 37.2,
          abilities: { 0: "Intimidate" }
        },
        Tornadus: {
          types: ["Flying"],
          bs: { hp: 79, at: 115, df: 70, sa: 125, sd: 80, sp: 111 },
          weightkg: 63,
          abilities: { 0: "Prankster" },
          otherFormes: ["Tornadus-Therian"]
        },
        "Tornadus-Therian": {
          types: ["Flying"],
          bs: { hp: 79, at: 100, df: 80, sa: 110, sd: 90, sp: 121 },
          weightkg: 63,
          abilities: { 0: "Regenerator" },
          baseSpecies: "Tornadus"
        },
        Tranquill: {
          types: ["Normal", "Flying"],
          bs: { hp: 62, at: 77, df: 62, sa: 50, sd: 42, sp: 65 },
          weightkg: 15,
          nfe: true,
          abilities: { 0: "Big Pecks" }
        },
        Trubbish: {
          types: ["Poison"],
          bs: { hp: 50, at: 50, df: 62, sa: 40, sd: 62, sp: 65 },
          weightkg: 31,
          nfe: true,
          abilities: { 0: "Stench" }
        },
        Tympole: {
          types: ["Water"],
          bs: { hp: 50, at: 50, df: 40, sa: 50, sd: 40, sp: 64 },
          weightkg: 4.5,
          nfe: true,
          abilities: { 0: "Swift Swim" }
        },
        Tynamo: {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 45, sd: 40, sp: 60 },
          weightkg: 0.3,
          abilities: { 0: "Levitate" },
          nfe: true
        },
        Unfezant: {
          types: ["Normal", "Flying"],
          bs: { hp: 80, at: 105, df: 80, sa: 65, sd: 55, sp: 93 },
          weightkg: 29,
          abilities: { 0: "Big Pecks" }
        },
        Vanillish: {
          types: ["Ice"],
          bs: { hp: 51, at: 65, df: 65, sa: 80, sd: 75, sp: 59 },
          weightkg: 41,
          nfe: true,
          abilities: { 0: "Ice Body" }
        },
        Vanillite: {
          types: ["Ice"],
          bs: { hp: 36, at: 50, df: 50, sa: 65, sd: 60, sp: 44 },
          weightkg: 5.7,
          nfe: true,
          abilities: { 0: "Ice Body" }
        },
        Vanilluxe: {
          types: ["Ice"],
          bs: { hp: 71, at: 95, df: 85, sa: 110, sd: 95, sp: 79 },
          weightkg: 57.5,
          abilities: { 0: "Ice Body" }
        },
        Venipede: {
          types: ["Bug", "Poison"],
          bs: { hp: 30, at: 45, df: 59, sa: 30, sd: 39, sp: 57 },
          weightkg: 5.3,
          nfe: true,
          abilities: { 0: "Poison Point" }
        },
        Victini: {
          types: ["Psychic", "Fire"],
          bs: { hp: 100, at: 100, df: 100, sa: 100, sd: 100, sp: 100 },
          weightkg: 4,
          abilities: { 0: "Victory Star" },
          gender: "N"
        },
        Virizion: {
          types: ["Grass", "Fighting"],
          bs: { hp: 91, at: 90, df: 72, sa: 90, sd: 129, sp: 108 },
          weightkg: 200,
          abilities: { 0: "Justified" },
          gender: "N"
        },
        Volcarona: {
          types: ["Bug", "Fire"],
          bs: { hp: 85, at: 60, df: 65, sa: 135, sd: 105, sp: 100 },
          weightkg: 46,
          abilities: { 0: "Flame Body" }
        },
        Vullaby: {
          types: ["Dark", "Flying"],
          bs: { hp: 70, at: 55, df: 75, sa: 45, sd: 65, sp: 60 },
          weightkg: 9,
          nfe: true,
          abilities: { 0: "Big Pecks" }
        },
        Watchog: {
          types: ["Normal"],
          bs: { hp: 60, at: 85, df: 69, sa: 60, sd: 69, sp: 77 },
          weightkg: 27,
          abilities: { 0: "Illuminate" }
        },
        Whimsicott: {
          types: ["Grass"],
          bs: { hp: 60, at: 67, df: 85, sa: 77, sd: 75, sp: 116 },
          weightkg: 6.6,
          abilities: { 0: "Prankster" }
        },
        Whirlipede: {
          types: ["Bug", "Poison"],
          bs: { hp: 40, at: 55, df: 99, sa: 40, sd: 79, sp: 47 },
          weightkg: 58.5,
          nfe: true,
          abilities: { 0: "Poison Point" }
        },
        Woobat: {
          types: ["Psychic", "Flying"],
          bs: { hp: 55, at: 45, df: 43, sa: 55, sd: 43, sp: 72 },
          weightkg: 2.1,
          nfe: true,
          abilities: { 0: "Unaware" }
        },
        Yamask: {
          types: ["Ghost"],
          bs: { hp: 38, at: 30, df: 85, sa: 55, sd: 65, sp: 30 },
          weightkg: 1.5,
          abilities: { 0: "Mummy" },
          nfe: true
        },
        Zebstrika: {
          types: ["Electric"],
          bs: { hp: 75, at: 100, df: 63, sa: 80, sd: 63, sp: 116 },
          weightkg: 79.5,
          abilities: { 0: "Lightning Rod" }
        },
        Zekrom: {
          types: ["Dragon", "Electric"],
          bs: { hp: 100, at: 150, df: 120, sa: 120, sd: 100, sp: 90 },
          weightkg: 345,
          abilities: { 0: "Teravolt" },
          gender: "N"
        },
        Zoroark: {
          types: ["Dark"],
          bs: { hp: 60, at: 105, df: 60, sa: 120, sd: 60, sp: 105 },
          weightkg: 81.1,
          abilities: { 0: "Illusion" }
        },
        Zorua: {
          types: ["Dark"],
          bs: { hp: 40, at: 65, df: 40, sa: 80, sd: 40, sp: 65 },
          weightkg: 12.5,
          abilities: { 0: "Illusion" },
          nfe: true
        },
        Zweilous: {
          types: ["Dark", "Dragon"],
          bs: { hp: 72, at: 85, df: 70, sa: 65, sd: 70, sp: 58 },
          weightkg: 50,
          abilities: { 0: "Hustle" },
          nfe: true
        }
      };
      var BW = (0, util_1.extend)(true, {}, DPP, BW_PATCH);
      delete BW["Pichu"].otherFormes;
      delete BW["Pichu-Spiky-eared"];
      var XY_PATCH = {
        Abomasnow: { otherFormes: ["Abomasnow-Mega"] },
        Absol: { otherFormes: ["Absol-Mega"] },
        Aerodactyl: { otherFormes: ["Aerodactyl-Mega"] },
        Aggron: { otherFormes: ["Aggron-Mega"] },
        Alakazam: { bs: { sd: 95 }, otherFormes: ["Alakazam-Mega"] },
        Altaria: { otherFormes: ["Altaria-Mega"] },
        Ampharos: { bs: { df: 85 }, otherFormes: ["Ampharos-Mega"] },
        Audino: { otherFormes: ["Audino-Mega"] },
        Azumarill: { types: ["Water", "Fairy"], bs: { sa: 60 } },
        Azurill: { types: ["Normal", "Fairy"] },
        Banette: { otherFormes: ["Banette-Mega"] },
        Beautifly: { bs: { sa: 100 } },
        Beedrill: { bs: { at: 90 }, otherFormes: ["Beedrill-Mega"] },
        Bellossom: { bs: { df: 95 } },
        Blastoise: { otherFormes: ["Blastoise-Mega"] },
        Blaziken: { otherFormes: ["Blaziken-Mega"] },
        Butterfree: { bs: { sa: 90 } },
        Camerupt: { otherFormes: ["Camerupt-Mega"] },
        Charizard: { otherFormes: ["Charizard-Mega-X", "Charizard-Mega-Y"] },
        Clefable: { types: ["Fairy"], bs: { sa: 95 } },
        Clefairy: { types: ["Fairy"] },
        Cleffa: { types: ["Fairy"] },
        Cottonee: { types: ["Grass", "Fairy"] },
        Exploud: { bs: { sd: 73 } },
        Gallade: { otherFormes: ["Gallade-Mega"] },
        Garchomp: { otherFormes: ["Garchomp-Mega"] },
        Gardevoir: { types: ["Psychic", "Fairy"], otherFormes: ["Gardevoir-Mega"] },
        Gengar: { otherFormes: ["Gengar-Mega"] },
        Gigalith: { bs: { sd: 80 } },
        Glalie: { otherFormes: ["Glalie-Mega"] },
        Golem: { bs: { at: 120 } },
        Granbull: { types: ["Fairy"] },
        Groudon: { otherFormes: ["Groudon-Primal"] },
        Gyarados: { otherFormes: ["Gyarados-Mega"] },
        Heracross: { otherFormes: ["Heracross-Mega"] },
        Houndoom: { otherFormes: ["Houndoom-Mega"] },
        Igglybuff: { types: ["Normal", "Fairy"] },
        Jigglypuff: { types: ["Normal", "Fairy"] },
        Jumpluff: { bs: { sd: 95 } },
        Kangaskhan: { otherFormes: ["Kangaskhan-Mega"] },
        Kirlia: { types: ["Psychic", "Fairy"] },
        Krookodile: { bs: { df: 80 } },
        Kyogre: { otherFormes: ["Kyogre-Primal"] },
        Latias: { otherFormes: ["Latias-Mega"] },
        Latios: { otherFormes: ["Latios-Mega"] },
        Leavanny: { bs: { sd: 80 } },
        Lopunny: { otherFormes: ["Lopunny-Mega"] },
        Lucario: { otherFormes: ["Lucario-Mega"] },
        Manectric: { otherFormes: ["Manectric-Mega"] },
        Marill: { types: ["Water", "Fairy"] },
        Mawile: { types: ["Steel", "Fairy"], otherFormes: ["Mawile-Mega"] },
        Medicham: { otherFormes: ["Medicham-Mega"] },
        Metagross: { otherFormes: ["Metagross-Mega"] },
        Mewtwo: { otherFormes: ["Mewtwo-Mega-X", "Mewtwo-Mega-Y"] },
        "Mime Jr.": { types: ["Psychic", "Fairy"] },
        "Mr. Mime": { types: ["Psychic", "Fairy"] },
        Nidoking: { bs: { at: 102 } },
        Nidoqueen: { bs: { at: 92 } },
        Pidgeot: { bs: { sp: 101 }, otherFormes: ["Pidgeot-Mega"] },
        Pikachu: {
          bs: { df: 40, sd: 50 },
          otherFormes: [
            "Pikachu-Belle",
            "Pikachu-Cosplay",
            "Pikachu-Libre",
            "Pikachu-PhD",
            "Pikachu-Pop-Star",
            "Pikachu-Rock-Star"
          ]
        },
        Pinsir: { otherFormes: ["Pinsir-Mega"] },
        Poliwrath: { bs: { at: 95 } },
        Raichu: { bs: { sp: 110 } },
        Ralts: { types: ["Psychic", "Fairy"] },
        Rayquaza: { otherFormes: ["Rayquaza-Mega"] },
        Roserade: { bs: { df: 65 } },
        Sableye: { otherFormes: ["Sableye-Mega"] },
        Salamence: { otherFormes: ["Salamence-Mega"] },
        Sceptile: { otherFormes: ["Sceptile-Mega"] },
        Scizor: { otherFormes: ["Scizor-Mega"] },
        Scolipede: { bs: { at: 100 } },
        Seismitoad: { bs: { at: 95 } },
        Sharpedo: { otherFormes: ["Sharpedo-Mega"] },
        Slowbro: { otherFormes: ["Slowbro-Mega"] },
        Snubbull: { types: ["Fairy"] },
        Staraptor: { bs: { sd: 60 } },
        Steelix: { otherFormes: ["Steelix-Mega"] },
        Stoutland: { bs: { at: 110 } },
        Swampert: { otherFormes: ["Swampert-Mega"] },
        Togekiss: { types: ["Fairy", "Flying"] },
        Togepi: { types: ["Fairy"] },
        Togetic: { types: ["Fairy", "Flying"] },
        Tyranitar: { otherFormes: ["Tyranitar-Mega"] },
        Unfezant: { bs: { at: 115 } },
        Venusaur: { otherFormes: ["Venusaur-Mega"] },
        Victreebel: { bs: { sd: 70 } },
        Vileplume: { bs: { sa: 110 } },
        Whimsicott: { types: ["Grass", "Fairy"] },
        Wigglytuff: { types: ["Normal", "Fairy"], bs: { sa: 85 } },
        "Aegislash-Blade": {
          types: ["Steel", "Ghost"],
          bs: { hp: 60, at: 150, df: 50, sa: 150, sd: 50, sp: 60 },
          weightkg: 53,
          abilities: { 0: "Stance Change" },
          otherFormes: ["Aegislash-Shield", "Aegislash-Both"]
        },
        "Aegislash-Shield": {
          types: ["Steel", "Ghost"],
          bs: { hp: 60, at: 50, df: 150, sa: 50, sd: 150, sp: 60 },
          weightkg: 53,
          abilities: { 0: "Stance Change" },
          baseSpecies: "Aegislash-Blade"
        },
        "Aegislash-Both": {
          types: ["Steel", "Ghost"],
          bs: { hp: 60, at: 150, df: 150, sa: 150, sd: 150, sp: 60 },
          weightkg: 53,
          abilities: { 0: "Stance Change" },
          baseSpecies: "Aegislash-Blade"
        },
        Amaura: {
          types: ["Rock", "Ice"],
          bs: { hp: 77, at: 59, df: 50, sa: 67, sd: 63, sp: 46 },
          weightkg: 25.2,
          nfe: true,
          abilities: { 0: "Refrigerate" }
        },
        "Arceus-Fairy": {
          types: ["Fairy"],
          bs: { hp: 120, at: 120, df: 120, sa: 120, sd: 120, sp: 120 },
          weightkg: 320,
          abilities: { 0: "Multitype" },
          baseSpecies: "Arceus",
          gender: "N"
        },
        Aromatisse: {
          types: ["Fairy"],
          bs: { hp: 101, at: 72, df: 72, sa: 99, sd: 89, sp: 29 },
          weightkg: 15.5,
          abilities: { 0: "Healer" }
        },
        Aurorus: {
          types: ["Rock", "Ice"],
          bs: { hp: 123, at: 77, df: 72, sa: 99, sd: 92, sp: 58 },
          weightkg: 225,
          abilities: { 0: "Refrigerate" }
        },
        Avalugg: {
          types: ["Ice"],
          bs: { hp: 95, at: 117, df: 184, sa: 44, sd: 46, sp: 28 },
          weightkg: 505,
          abilities: { 0: "Own Tempo" }
        },
        Barbaracle: {
          types: ["Rock", "Water"],
          bs: { hp: 72, at: 105, df: 115, sa: 54, sd: 86, sp: 68 },
          weightkg: 96,
          abilities: { 0: "Tough Claws" }
        },
        Bergmite: {
          types: ["Ice"],
          bs: { hp: 55, at: 69, df: 85, sa: 32, sd: 35, sp: 28 },
          weightkg: 99.5,
          nfe: true,
          abilities: { 0: "Own Tempo" }
        },
        Binacle: {
          types: ["Rock", "Water"],
          bs: { hp: 42, at: 52, df: 67, sa: 39, sd: 56, sp: 50 },
          weightkg: 31,
          nfe: true,
          abilities: { 0: "Tough Claws" }
        },
        Braixen: {
          types: ["Fire"],
          bs: { hp: 59, at: 59, df: 58, sa: 90, sd: 70, sp: 73 },
          weightkg: 14.5,
          nfe: true,
          abilities: { 0: "Blaze" }
        },
        Bunnelby: {
          types: ["Normal"],
          bs: { hp: 38, at: 36, df: 38, sa: 32, sd: 36, sp: 57 },
          weightkg: 5,
          nfe: true,
          abilities: { 0: "Pickup" }
        },
        Caimanoe: {
          types: ["Water", "Steel"],
          bs: { hp: 73, at: 85, df: 65, sa: 80, sd: 40, sp: 87 },
          weightkg: 72.5,
          nfe: true,
          abilities: { 0: "Water Veil" }
        },
        Carbink: {
          types: ["Rock", "Fairy"],
          bs: { hp: 50, at: 50, df: 150, sa: 50, sd: 150, sp: 50 },
          weightkg: 5.7,
          gender: "N",
          abilities: { 0: "Clear Body" }
        },
        Chesnaught: {
          types: ["Grass", "Fighting"],
          bs: { hp: 88, at: 107, df: 122, sa: 74, sd: 75, sp: 64 },
          weightkg: 90,
          abilities: { 0: "Overgrow" }
        },
        Chespin: {
          types: ["Grass"],
          bs: { hp: 56, at: 61, df: 65, sa: 48, sd: 45, sp: 38 },
          weightkg: 9,
          nfe: true,
          abilities: { 0: "Overgrow" }
        },
        Clauncher: {
          types: ["Water"],
          bs: { hp: 50, at: 53, df: 62, sa: 58, sd: 63, sp: 44 },
          weightkg: 8.3,
          abilities: { 0: "Mega Launcher" },
          nfe: true
        },
        Clawitzer: {
          types: ["Water"],
          bs: { hp: 71, at: 73, df: 88, sa: 120, sd: 89, sp: 59 },
          weightkg: 35.3,
          abilities: { 0: "Mega Launcher" }
        },
        Crucibelle: {
          types: ["Rock", "Poison"],
          bs: { hp: 106, at: 105, df: 65, sa: 75, sd: 85, sp: 104 },
          weightkg: 23.6,
          abilities: { 0: "Regenerator" },
          otherFormes: ["Crucibelle-Mega"]
        },
        Diancie: {
          types: ["Rock", "Fairy"],
          bs: { hp: 50, at: 100, df: 150, sa: 100, sd: 150, sp: 50 },
          weightkg: 8.8,
          abilities: { 0: "Clear Body" },
          otherFormes: ["Diancie-Mega"],
          gender: "N"
        },
        Dedenne: {
          types: ["Electric", "Fairy"],
          bs: { hp: 67, at: 58, df: 57, sa: 81, sd: 67, sp: 101 },
          weightkg: 2.2,
          abilities: { 0: "Cheek Pouch" }
        },
        Delphox: {
          types: ["Fire", "Psychic"],
          bs: { hp: 75, at: 69, df: 72, sa: 114, sd: 100, sp: 104 },
          weightkg: 39,
          abilities: { 0: "Blaze" }
        },
        Diggersby: {
          types: ["Normal", "Ground"],
          bs: { hp: 85, at: 56, df: 77, sa: 50, sd: 77, sp: 78 },
          weightkg: 42.4,
          abilities: { 0: "Pickup" }
        },
        Doublade: {
          types: ["Steel", "Ghost"],
          bs: { hp: 59, at: 110, df: 150, sa: 45, sd: 49, sp: 35 },
          weightkg: 4.5,
          abilities: { 0: "No Guard" },
          nfe: true
        },
        Dragalge: {
          types: ["Poison", "Dragon"],
          bs: { hp: 65, at: 75, df: 90, sa: 97, sd: 123, sp: 44 },
          weightkg: 81.5,
          abilities: { 0: "Poison Point" }
        },
        Espurr: {
          types: ["Psychic"],
          bs: { hp: 62, at: 48, df: 54, sa: 63, sd: 60, sp: 68 },
          weightkg: 3.5,
          nfe: true,
          abilities: { 0: "Keen Eye" }
        },
        Fennekin: {
          types: ["Fire"],
          bs: { hp: 40, at: 45, df: 40, sa: 62, sd: 60, sp: 60 },
          weightkg: 9.4,
          nfe: true,
          abilities: { 0: "Blaze" }
        },
        Flabe\u0301be\u0301: {
          types: ["Fairy"],
          bs: { hp: 44, at: 38, df: 39, sa: 61, sd: 79, sp: 42 },
          weightkg: 0.1,
          nfe: true,
          abilities: { 0: "Flower Veil" }
        },
        Fletchinder: {
          types: ["Fire", "Flying"],
          bs: { hp: 62, at: 73, df: 55, sa: 56, sd: 52, sp: 84 },
          weightkg: 16,
          nfe: true,
          abilities: { 0: "Flame Body" }
        },
        Fletchling: {
          types: ["Normal", "Flying"],
          bs: { hp: 45, at: 50, df: 43, sa: 40, sd: 38, sp: 62 },
          weightkg: 1.7,
          nfe: true,
          abilities: { 0: "Big Pecks" }
        },
        Floatoy: {
          types: ["Water"],
          bs: { hp: 48, at: 70, df: 40, sa: 70, sd: 30, sp: 77 },
          weightkg: 1.9,
          nfe: true,
          abilities: { 0: "Water Veil" }
        },
        Floette: {
          types: ["Fairy"],
          bs: { hp: 54, at: 45, df: 47, sa: 75, sd: 98, sp: 52 },
          weightkg: 0.9,
          nfe: true,
          otherFormes: ["Floette-Eternal"],
          abilities: { 0: "Flower Veil" }
        },
        "Floette-Eternal": {
          types: ["Fairy"],
          bs: { hp: 74, at: 65, df: 67, sa: 125, sd: 128, sp: 92 },
          weightkg: 0.9,
          abilities: { 0: "Flower Veil" },
          baseSpecies: "Floette"
        },
        Florges: {
          types: ["Fairy"],
          bs: { hp: 78, at: 65, df: 68, sa: 112, sd: 154, sp: 75 },
          weightkg: 10,
          abilities: { 0: "Flower Veil" }
        },
        Froakie: {
          types: ["Water"],
          bs: { hp: 41, at: 56, df: 40, sa: 62, sd: 44, sp: 71 },
          weightkg: 7,
          nfe: true,
          abilities: { 0: "Torrent" }
        },
        Frogadier: {
          types: ["Water"],
          bs: { hp: 54, at: 63, df: 52, sa: 83, sd: 56, sp: 97 },
          weightkg: 10.9,
          nfe: true,
          abilities: { 0: "Torrent" }
        },
        Furfrou: {
          types: ["Normal"],
          bs: { hp: 75, at: 80, df: 60, sa: 65, sd: 90, sp: 102 },
          weightkg: 28,
          abilities: { 0: "Fur Coat" }
        },
        Gogoat: {
          types: ["Grass"],
          bs: { hp: 123, at: 100, df: 62, sa: 97, sd: 81, sp: 68 },
          weightkg: 91,
          abilities: { 0: "Sap Sipper" }
        },
        Goodra: {
          types: ["Dragon"],
          bs: { hp: 90, at: 100, df: 70, sa: 110, sd: 150, sp: 80 },
          weightkg: 150.5,
          abilities: { 0: "Sap Sipper" }
        },
        Goomy: {
          types: ["Dragon"],
          bs: { hp: 45, at: 50, df: 35, sa: 55, sd: 75, sp: 40 },
          weightkg: 2.8,
          nfe: true,
          abilities: { 0: "Sap Sipper" }
        },
        Gourgeist: {
          types: ["Ghost", "Grass"],
          bs: { hp: 65, at: 90, df: 122, sa: 58, sd: 75, sp: 84 },
          weightkg: 12.5,
          abilities: { 0: "Pickup" },
          otherFormes: ["Gourgeist-Large", "Gourgeist-Small", "Gourgeist-Super"]
        },
        "Gourgeist-Large": {
          types: ["Ghost", "Grass"],
          bs: { hp: 75, at: 95, df: 122, sa: 58, sd: 75, sp: 69 },
          weightkg: 14,
          abilities: { 0: "Pickup" },
          baseSpecies: "Gourgeist"
        },
        "Gourgeist-Small": {
          types: ["Ghost", "Grass"],
          bs: { hp: 55, at: 85, df: 122, sa: 58, sd: 75, sp: 99 },
          weightkg: 9.5,
          abilities: { 0: "Pickup" },
          baseSpecies: "Gourgeist"
        },
        "Gourgeist-Super": {
          types: ["Ghost", "Grass"],
          bs: { hp: 85, at: 100, df: 122, sa: 58, sd: 75, sp: 54 },
          weightkg: 39,
          abilities: { 0: "Pickup" },
          baseSpecies: "Gourgeist"
        },
        Greninja: {
          types: ["Water", "Dark"],
          bs: { hp: 72, at: 95, df: 67, sa: 103, sd: 71, sp: 122 },
          weightkg: 40,
          abilities: { 0: "Torrent" }
        },
        Hawlucha: {
          types: ["Fighting", "Flying"],
          bs: { hp: 78, at: 92, df: 75, sa: 74, sd: 63, sp: 118 },
          weightkg: 21.5,
          abilities: { 0: "Limber" }
        },
        Heliolisk: {
          types: ["Electric", "Normal"],
          bs: { hp: 62, at: 55, df: 52, sa: 109, sd: 94, sp: 109 },
          weightkg: 21,
          abilities: { 0: "Dry Skin" }
        },
        Helioptile: {
          types: ["Electric", "Normal"],
          bs: { hp: 44, at: 38, df: 33, sa: 61, sd: 43, sp: 70 },
          weightkg: 6,
          nfe: true,
          abilities: { 0: "Dry Skin" }
        },
        Honedge: {
          types: ["Steel", "Ghost"],
          bs: { hp: 45, at: 80, df: 100, sa: 35, sd: 37, sp: 28 },
          weightkg: 2,
          abilities: { 0: "No Guard" },
          nfe: true
        },
        Hoopa: {
          types: ["Psychic", "Ghost"],
          bs: { hp: 80, at: 110, df: 60, sa: 150, sd: 130, sp: 70 },
          weightkg: 9,
          gender: "N",
          abilities: { 0: "Magician" },
          otherFormes: ["Hoopa-Unbound"]
        },
        "Hoopa-Unbound": {
          types: ["Psychic", "Dark"],
          bs: { hp: 80, at: 160, df: 60, sa: 170, sd: 130, sp: 80 },
          weightkg: 490,
          gender: "N",
          abilities: { 0: "Magician" },
          baseSpecies: "Hoopa"
        },
        Inkay: {
          types: ["Dark", "Psychic"],
          bs: { hp: 53, at: 54, df: 53, sa: 37, sd: 46, sp: 45 },
          weightkg: 3.5,
          nfe: true,
          abilities: { 0: "Contrary" }
        },
        Kerfluffle: {
          types: ["Fairy", "Fighting"],
          bs: { hp: 84, at: 78, df: 86, sa: 115, sd: 88, sp: 119 },
          weightkg: 24.2,
          abilities: { 0: "Natural Cure" }
        },
        Klefki: {
          types: ["Steel", "Fairy"],
          bs: { hp: 57, at: 80, df: 91, sa: 80, sd: 87, sp: 75 },
          weightkg: 3,
          abilities: { 0: "Prankster" }
        },
        Litleo: {
          types: ["Fire", "Normal"],
          bs: { hp: 62, at: 50, df: 58, sa: 73, sd: 54, sp: 72 },
          weightkg: 13.5,
          nfe: true,
          abilities: { 0: "Rivalry" }
        },
        Malamar: {
          types: ["Dark", "Psychic"],
          bs: { hp: 86, at: 92, df: 88, sa: 68, sd: 75, sp: 73 },
          weightkg: 47,
          abilities: { 0: "Contrary" }
        },
        "Abomasnow-Mega": {
          types: ["Grass", "Ice"],
          bs: { hp: 90, at: 132, df: 105, sa: 132, sd: 105, sp: 30 },
          weightkg: 185,
          abilities: { 0: "Snow Warning" },
          baseSpecies: "Abomasnow"
        },
        "Absol-Mega": {
          types: ["Dark"],
          bs: { hp: 65, at: 150, df: 60, sa: 115, sd: 60, sp: 115 },
          weightkg: 49,
          abilities: { 0: "Magic Bounce" },
          baseSpecies: "Absol"
        },
        "Aerodactyl-Mega": {
          types: ["Rock", "Flying"],
          bs: { hp: 80, at: 135, df: 85, sa: 70, sd: 95, sp: 150 },
          weightkg: 79,
          abilities: { 0: "Tough Claws" },
          baseSpecies: "Aerodactyl"
        },
        "Aggron-Mega": {
          types: ["Steel"],
          bs: { hp: 70, at: 140, df: 230, sa: 60, sd: 80, sp: 50 },
          weightkg: 395,
          abilities: { 0: "Filter" },
          baseSpecies: "Aggron"
        },
        "Alakazam-Mega": {
          types: ["Psychic"],
          bs: { hp: 55, at: 50, df: 65, sa: 175, sd: 95, sp: 150 },
          weightkg: 48,
          abilities: { 0: "Trace" },
          baseSpecies: "Alakazam"
        },
        "Altaria-Mega": {
          types: ["Dragon", "Fairy"],
          bs: { hp: 75, at: 110, df: 110, sa: 110, sd: 105, sp: 80 },
          weightkg: 20.6,
          abilities: { 0: "Pixilate" },
          baseSpecies: "Altaria"
        },
        "Ampharos-Mega": {
          types: ["Electric", "Dragon"],
          bs: { hp: 90, at: 95, df: 105, sa: 165, sd: 110, sp: 45 },
          weightkg: 61.5,
          abilities: { 0: "Mold Breaker" },
          baseSpecies: "Ampharos"
        },
        "Audino-Mega": {
          types: ["Normal", "Fairy"],
          bs: { hp: 103, at: 60, df: 126, sa: 80, sd: 126, sp: 50 },
          weightkg: 32,
          abilities: { 0: "Healer" },
          baseSpecies: "Audino"
        },
        "Banette-Mega": {
          types: ["Ghost"],
          bs: { hp: 64, at: 165, df: 75, sa: 93, sd: 83, sp: 75 },
          weightkg: 13,
          abilities: { 0: "Prankster" },
          baseSpecies: "Banette"
        },
        "Beedrill-Mega": {
          types: ["Bug", "Poison"],
          bs: { hp: 65, at: 150, df: 40, sa: 15, sd: 80, sp: 145 },
          weightkg: 40.5,
          abilities: { 0: "Adaptability" },
          baseSpecies: "Beedrill"
        },
        "Blastoise-Mega": {
          types: ["Water"],
          bs: { hp: 79, at: 103, df: 120, sa: 135, sd: 115, sp: 78 },
          weightkg: 101.1,
          abilities: { 0: "Mega Launcher" },
          baseSpecies: "Blastoise"
        },
        "Blaziken-Mega": {
          types: ["Fire", "Fighting"],
          bs: { hp: 80, at: 160, df: 80, sa: 130, sd: 80, sp: 100 },
          weightkg: 52,
          abilities: { 0: "Speed Boost" },
          baseSpecies: "Blaziken"
        },
        "Camerupt-Mega": {
          types: ["Fire", "Ground"],
          bs: { hp: 70, at: 120, df: 100, sa: 145, sd: 105, sp: 20 },
          weightkg: 320.5,
          abilities: { 0: "Sheer Force" },
          baseSpecies: "Camerupt"
        },
        "Charizard-Mega-X": {
          types: ["Fire", "Dragon"],
          bs: { hp: 78, at: 130, df: 111, sa: 130, sd: 85, sp: 100 },
          weightkg: 110.5,
          abilities: { 0: "Tough Claws" },
          baseSpecies: "Charizard"
        },
        "Charizard-Mega-Y": {
          types: ["Fire", "Flying"],
          bs: { hp: 78, at: 104, df: 78, sa: 159, sd: 115, sp: 100 },
          weightkg: 100.5,
          abilities: { 0: "Drought" },
          baseSpecies: "Charizard"
        },
        "Crucibelle-Mega": {
          types: ["Rock", "Poison"],
          bs: { hp: 106, at: 135, df: 75, sa: 85, sd: 125, sp: 114 },
          weightkg: 22.5,
          abilities: { 0: "Magic Guard" },
          baseSpecies: "Crucibelle"
        },
        "Diancie-Mega": {
          types: ["Rock", "Fairy"],
          bs: { hp: 50, at: 160, df: 110, sa: 160, sd: 110, sp: 110 },
          weightkg: 27.8,
          abilities: { 0: "Magic Bounce" },
          baseSpecies: "Diancie",
          gender: "N"
        },
        "Gallade-Mega": {
          types: ["Psychic", "Fighting"],
          bs: { hp: 68, at: 165, df: 95, sa: 65, sd: 115, sp: 110 },
          weightkg: 56.4,
          abilities: { 0: "Inner Focus" },
          baseSpecies: "Gallade"
        },
        "Garchomp-Mega": {
          types: ["Dragon", "Ground"],
          bs: { hp: 108, at: 170, df: 115, sa: 120, sd: 95, sp: 92 },
          weightkg: 95,
          abilities: { 0: "Sand Force" },
          baseSpecies: "Garchomp"
        },
        "Gardevoir-Mega": {
          types: ["Psychic", "Fairy"],
          bs: { hp: 68, at: 85, df: 65, sa: 165, sd: 135, sp: 100 },
          weightkg: 48.4,
          abilities: { 0: "Pixilate" },
          baseSpecies: "Gardevoir"
        },
        "Gengar-Mega": {
          types: ["Ghost", "Poison"],
          bs: { hp: 60, at: 65, df: 80, sa: 170, sd: 95, sp: 130 },
          weightkg: 40.5,
          abilities: { 0: "Shadow Tag" },
          baseSpecies: "Gengar"
        },
        "Glalie-Mega": {
          types: ["Ice"],
          bs: { hp: 80, at: 120, df: 80, sa: 120, sd: 80, sp: 100 },
          weightkg: 350.2,
          abilities: { 0: "Refrigerate" },
          baseSpecies: "Glalie"
        },
        "Gyarados-Mega": {
          types: ["Water", "Dark"],
          bs: { hp: 95, at: 155, df: 109, sa: 70, sd: 130, sp: 81 },
          weightkg: 305,
          abilities: { 0: "Mold Breaker" },
          baseSpecies: "Gyarados"
        },
        "Heracross-Mega": {
          types: ["Bug", "Fighting"],
          bs: { hp: 80, at: 185, df: 115, sa: 40, sd: 105, sp: 75 },
          weightkg: 62.5,
          abilities: { 0: "Skill Link" },
          baseSpecies: "Heracross"
        },
        "Houndoom-Mega": {
          types: ["Dark", "Fire"],
          bs: { hp: 75, at: 90, df: 90, sa: 140, sd: 90, sp: 115 },
          weightkg: 49.5,
          abilities: { 0: "Solar Power" },
          baseSpecies: "Houndoom"
        },
        "Kangaskhan-Mega": {
          types: ["Normal"],
          bs: { hp: 105, at: 125, df: 100, sa: 60, sd: 100, sp: 100 },
          weightkg: 100,
          abilities: { 0: "Parental Bond" },
          baseSpecies: "Kangaskhan"
        },
        "Latias-Mega": {
          types: ["Dragon", "Psychic"],
          bs: { hp: 80, at: 100, df: 120, sa: 140, sd: 150, sp: 110 },
          weightkg: 52,
          abilities: { 0: "Levitate" },
          baseSpecies: "Latias"
        },
        "Latios-Mega": {
          types: ["Dragon", "Psychic"],
          bs: { hp: 80, at: 130, df: 100, sa: 160, sd: 120, sp: 110 },
          weightkg: 70,
          abilities: { 0: "Levitate" },
          baseSpecies: "Latios"
        },
        "Lopunny-Mega": {
          types: ["Normal", "Fighting"],
          bs: { hp: 65, at: 136, df: 94, sa: 54, sd: 96, sp: 135 },
          weightkg: 28.3,
          abilities: { 0: "Scrappy" },
          baseSpecies: "Lopunny"
        },
        "Lucario-Mega": {
          types: ["Fighting", "Steel"],
          bs: { hp: 70, at: 145, df: 88, sa: 140, sd: 70, sp: 112 },
          weightkg: 57.5,
          abilities: { 0: "Adaptability" },
          baseSpecies: "Lucario"
        },
        "Manectric-Mega": {
          types: ["Electric"],
          bs: { hp: 70, at: 75, df: 80, sa: 135, sd: 80, sp: 135 },
          weightkg: 44,
          abilities: { 0: "Intimidate" },
          baseSpecies: "Manectric"
        },
        "Mawile-Mega": {
          types: ["Steel", "Fairy"],
          bs: { hp: 50, at: 105, df: 125, sa: 55, sd: 95, sp: 50 },
          weightkg: 23.5,
          abilities: { 0: "Huge Power" },
          baseSpecies: "Mawile"
        },
        "Medicham-Mega": {
          types: ["Fighting", "Psychic"],
          bs: { hp: 60, at: 100, df: 85, sa: 80, sd: 85, sp: 100 },
          weightkg: 31.5,
          abilities: { 0: "Pure Power" },
          baseSpecies: "Medicham"
        },
        "Metagross-Mega": {
          types: ["Steel", "Psychic"],
          bs: { hp: 80, at: 145, df: 150, sa: 105, sd: 110, sp: 110 },
          weightkg: 942.9,
          abilities: { 0: "Tough Claws" },
          baseSpecies: "Metagross",
          gender: "N"
        },
        "Mewtwo-Mega-X": {
          types: ["Psychic", "Fighting"],
          bs: { hp: 106, at: 190, df: 100, sa: 154, sd: 100, sp: 130 },
          weightkg: 127,
          abilities: { 0: "Steadfast" },
          baseSpecies: "Mewtwo",
          gender: "N"
        },
        "Mewtwo-Mega-Y": {
          types: ["Psychic"],
          bs: { hp: 106, at: 150, df: 70, sa: 194, sd: 120, sp: 140 },
          weightkg: 33,
          abilities: { 0: "Insomnia" },
          baseSpecies: "Mewtwo",
          gender: "N"
        },
        "Pidgeot-Mega": {
          types: ["Normal", "Flying"],
          bs: { hp: 83, at: 80, df: 80, sa: 135, sd: 80, sp: 121 },
          weightkg: 50.5,
          abilities: { 0: "No Guard" },
          baseSpecies: "Pidgeot"
        },
        "Pinsir-Mega": {
          types: ["Bug", "Flying"],
          bs: { hp: 65, at: 155, df: 120, sa: 65, sd: 90, sp: 105 },
          weightkg: 59,
          abilities: { 0: "Aerilate" },
          baseSpecies: "Pinsir"
        },
        "Rayquaza-Mega": {
          types: ["Dragon", "Flying"],
          bs: { hp: 105, at: 180, df: 100, sa: 180, sd: 100, sp: 115 },
          weightkg: 392,
          gender: "N",
          abilities: { 0: "Delta Stream" },
          baseSpecies: "Rayquaza"
        },
        "Sableye-Mega": {
          types: ["Dark", "Ghost"],
          bs: { hp: 50, at: 85, df: 125, sa: 85, sd: 115, sp: 20 },
          weightkg: 161,
          abilities: { 0: "Magic Bounce" },
          baseSpecies: "Sableye"
        },
        "Salamence-Mega": {
          types: ["Dragon", "Flying"],
          bs: { hp: 95, at: 145, df: 130, sa: 120, sd: 90, sp: 120 },
          weightkg: 112.6,
          abilities: { 0: "Aerilate" },
          baseSpecies: "Salamence"
        },
        "Sceptile-Mega": {
          types: ["Grass", "Dragon"],
          bs: { hp: 70, at: 110, df: 75, sa: 145, sd: 85, sp: 145 },
          weightkg: 55.2,
          abilities: { 0: "Lightning Rod" },
          baseSpecies: "Sceptile"
        },
        "Scizor-Mega": {
          types: ["Bug", "Steel"],
          bs: { hp: 70, at: 150, df: 140, sa: 65, sd: 100, sp: 75 },
          weightkg: 125,
          abilities: { 0: "Technician" },
          baseSpecies: "Scizor"
        },
        "Sharpedo-Mega": {
          types: ["Water", "Dark"],
          bs: { hp: 70, at: 140, df: 70, sa: 110, sd: 65, sp: 105 },
          weightkg: 130.3,
          abilities: { 0: "Strong Jaw" },
          baseSpecies: "Sharpedo"
        },
        "Slowbro-Mega": {
          types: ["Water", "Psychic"],
          bs: { hp: 95, at: 75, df: 180, sa: 130, sd: 80, sp: 30 },
          weightkg: 120,
          abilities: { 0: "Shell Armor" },
          baseSpecies: "Slowbro"
        },
        "Steelix-Mega": {
          types: ["Steel", "Ground"],
          bs: { hp: 75, at: 125, df: 230, sa: 55, sd: 95, sp: 30 },
          weightkg: 740,
          abilities: { 0: "Sand Force" },
          baseSpecies: "Steelix"
        },
        "Swampert-Mega": {
          types: ["Water", "Ground"],
          bs: { hp: 100, at: 150, df: 110, sa: 95, sd: 110, sp: 70 },
          weightkg: 102,
          abilities: { 0: "Swift Swim" },
          baseSpecies: "Swampert"
        },
        "Tyranitar-Mega": {
          types: ["Rock", "Dark"],
          bs: { hp: 100, at: 164, df: 150, sa: 95, sd: 120, sp: 71 },
          weightkg: 255,
          abilities: { 0: "Sand Stream" },
          baseSpecies: "Tyranitar"
        },
        "Venusaur-Mega": {
          types: ["Grass", "Poison"],
          bs: { hp: 80, at: 100, df: 123, sa: 122, sd: 120, sp: 80 },
          weightkg: 155.5,
          abilities: { 0: "Thick Fat" },
          baseSpecies: "Venusaur"
        },
        Meowstic: {
          types: ["Psychic"],
          bs: { hp: 74, at: 48, df: 76, sa: 83, sd: 81, sp: 104 },
          weightkg: 8.5,
          abilities: { 0: "Keen Eye" },
          otherFormes: ["Meowstic-F"]
        },
        "Meowstic-F": {
          types: ["Psychic"],
          bs: { hp: 74, at: 48, df: 76, sa: 83, sd: 81, sp: 104 },
          weightkg: 8.5,
          abilities: { 0: "Keen Eye" },
          baseSpecies: "Meowstic"
        },
        Naviathan: {
          types: ["Water", "Steel"],
          bs: { hp: 103, at: 110, df: 90, sa: 95, sd: 65, sp: 97 },
          weightkg: 510,
          abilities: { 0: "Water Veil" }
        },
        Noibat: {
          types: ["Flying", "Dragon"],
          bs: { hp: 40, at: 30, df: 35, sa: 45, sd: 40, sp: 55 },
          weightkg: 8,
          nfe: true,
          abilities: { 0: "Frisk" }
        },
        Noivern: {
          types: ["Flying", "Dragon"],
          bs: { hp: 85, at: 70, df: 80, sa: 97, sd: 80, sp: 123 },
          weightkg: 85,
          abilities: { 0: "Frisk" }
        },
        Pancham: {
          types: ["Fighting"],
          bs: { hp: 67, at: 82, df: 62, sa: 46, sd: 48, sp: 43 },
          weightkg: 8,
          nfe: true,
          abilities: { 0: "Iron Fist" }
        },
        Pangoro: {
          types: ["Fighting", "Dark"],
          bs: { hp: 95, at: 124, df: 78, sa: 69, sd: 71, sp: 58 },
          weightkg: 136,
          abilities: { 0: "Iron Fist" }
        },
        Phantump: {
          types: ["Ghost", "Grass"],
          bs: { hp: 43, at: 70, df: 48, sa: 50, sd: 60, sp: 38 },
          weightkg: 7,
          nfe: true,
          abilities: { 0: "Natural Cure" }
        },
        "Pikachu-Cosplay": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Lightning Rod" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-Rock-Star": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Lightning Rod" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-Belle": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Lightning Rod" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-PhD": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Lightning Rod" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-Pop-Star": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Lightning Rod" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-Libre": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Lightning Rod" },
          baseSpecies: "Pikachu"
        },
        Plasmanta: {
          types: ["Electric", "Poison"],
          bs: { hp: 60, at: 57, df: 119, sa: 131, sd: 98, sp: 100 },
          weightkg: 460,
          abilities: { 0: "Storm Drain" }
        },
        Pluffle: {
          types: ["Fairy"],
          bs: { hp: 74, at: 38, df: 51, sa: 65, sd: 78, sp: 49 },
          weightkg: 1.8,
          nfe: true,
          abilities: { 0: "Natural Cure" }
        },
        "Groudon-Primal": {
          types: ["Ground", "Fire"],
          bs: { hp: 100, at: 180, df: 160, sa: 150, sd: 90, sp: 90 },
          weightkg: 999.7,
          abilities: { 0: "Desolate Land" },
          baseSpecies: "Groudon",
          gender: "N"
        },
        "Kyogre-Primal": {
          types: ["Water"],
          bs: { hp: 100, at: 150, df: 90, sa: 180, sd: 160, sp: 90 },
          weightkg: 430,
          abilities: { 0: "Primordial Sea" },
          baseSpecies: "Kyogre",
          gender: "N"
        },
        Pumpkaboo: {
          types: ["Ghost", "Grass"],
          bs: { hp: 49, at: 66, df: 70, sa: 44, sd: 55, sp: 51 },
          weightkg: 5,
          nfe: true,
          abilities: { 0: "Pickup" },
          otherFormes: ["Pumpkaboo-Large", "Pumpkaboo-Small", "Pumpkaboo-Super"]
        },
        "Pumpkaboo-Large": {
          types: ["Ghost", "Grass"],
          bs: { hp: 54, at: 66, df: 70, sa: 44, sd: 55, sp: 46 },
          weightkg: 7.5,
          nfe: true,
          abilities: { 0: "Pickup" },
          baseSpecies: "Pumpkaboo"
        },
        "Pumpkaboo-Small": {
          types: ["Ghost", "Grass"],
          bs: { hp: 44, at: 66, df: 70, sa: 44, sd: 55, sp: 56 },
          weightkg: 3.5,
          nfe: true,
          abilities: { 0: "Pickup" },
          baseSpecies: "Pumpkaboo"
        },
        "Pumpkaboo-Super": {
          types: ["Ghost", "Grass"],
          bs: { hp: 59, at: 66, df: 70, sa: 44, sd: 55, sp: 41 },
          weightkg: 15,
          nfe: true,
          abilities: { 0: "Pickup" },
          baseSpecies: "Pumpkaboo"
        },
        Pyroar: {
          types: ["Fire", "Normal"],
          bs: { hp: 86, at: 68, df: 72, sa: 109, sd: 66, sp: 106 },
          weightkg: 81.5,
          abilities: { 0: "Rivalry" }
        },
        Quilladin: {
          types: ["Grass"],
          bs: { hp: 61, at: 78, df: 95, sa: 56, sd: 58, sp: 57 },
          weightkg: 29,
          nfe: true,
          abilities: { 0: "Overgrow" }
        },
        Scatterbug: {
          types: ["Bug"],
          bs: { hp: 38, at: 35, df: 40, sa: 27, sd: 25, sp: 35 },
          weightkg: 2.5,
          nfe: true,
          abilities: { 0: "Shield Dust" }
        },
        Skiddo: {
          types: ["Grass"],
          bs: { hp: 66, at: 65, df: 48, sa: 62, sd: 57, sp: 52 },
          weightkg: 31,
          nfe: true,
          abilities: { 0: "Sap Sipper" }
        },
        Skrelp: {
          types: ["Poison", "Water"],
          bs: { hp: 50, at: 60, df: 60, sa: 60, sd: 60, sp: 30 },
          weightkg: 7.3,
          nfe: true,
          abilities: { 0: "Poison Point" }
        },
        Sliggoo: {
          types: ["Dragon"],
          bs: { hp: 68, at: 75, df: 53, sa: 83, sd: 113, sp: 60 },
          weightkg: 17.5,
          nfe: true,
          abilities: { 0: "Sap Sipper" }
        },
        Slurpuff: {
          types: ["Fairy"],
          bs: { hp: 82, at: 80, df: 86, sa: 85, sd: 75, sp: 72 },
          weightkg: 5,
          abilities: { 0: "Sweet Veil" }
        },
        Snugglow: {
          types: ["Electric", "Poison"],
          bs: { hp: 40, at: 37, df: 79, sa: 91, sd: 68, sp: 70 },
          weightkg: 6,
          nfe: true,
          abilities: { 0: "Storm Drain" }
        },
        Spewpa: {
          types: ["Bug"],
          bs: { hp: 45, at: 22, df: 60, sa: 27, sd: 30, sp: 29 },
          weightkg: 8.4,
          nfe: true,
          abilities: { 0: "Shed Skin" }
        },
        Spritzee: {
          types: ["Fairy"],
          bs: { hp: 78, at: 52, df: 60, sa: 63, sd: 65, sp: 23 },
          weightkg: 0.5,
          nfe: true,
          abilities: { 0: "Healer" }
        },
        Swirlix: {
          types: ["Fairy"],
          bs: { hp: 62, at: 48, df: 66, sa: 59, sd: 57, sp: 49 },
          weightkg: 3.5,
          nfe: true,
          abilities: { 0: "Sweet Veil" }
        },
        Sylveon: {
          types: ["Fairy"],
          bs: { hp: 95, at: 65, df: 65, sa: 110, sd: 130, sp: 60 },
          weightkg: 23.5,
          abilities: { 0: "Cute Charm" }
        },
        Talonflame: {
          types: ["Fire", "Flying"],
          bs: { hp: 78, at: 81, df: 71, sa: 74, sd: 69, sp: 126 },
          weightkg: 24.5,
          abilities: { 0: "Flame Body" }
        },
        Trevenant: {
          types: ["Ghost", "Grass"],
          bs: { hp: 85, at: 110, df: 76, sa: 65, sd: 82, sp: 56 },
          weightkg: 71,
          abilities: { 0: "Natural Cure" }
        },
        Tyrantrum: {
          types: ["Rock", "Dragon"],
          bs: { hp: 82, at: 121, df: 119, sa: 69, sd: 59, sp: 71 },
          weightkg: 270,
          abilities: { 0: "Strong Jaw" }
        },
        Tyrunt: {
          types: ["Rock", "Dragon"],
          bs: { hp: 58, at: 89, df: 77, sa: 45, sd: 45, sp: 48 },
          weightkg: 26,
          nfe: true,
          abilities: { 0: "Strong Jaw" }
        },
        Vivillon: {
          types: ["Bug", "Flying"],
          bs: { hp: 80, at: 52, df: 50, sa: 90, sd: 50, sp: 89 },
          weightkg: 17,
          abilities: { 0: "Shield Dust" },
          otherFormes: ["Vivillon-Fancy", "Vivillon-Pokeball"]
        },
        "Vivillon-Fancy": {
          types: ["Bug", "Flying"],
          bs: { hp: 80, at: 52, df: 50, sa: 90, sd: 50, sp: 89 },
          weightkg: 17,
          abilities: { 0: "Shield Dust" },
          baseSpecies: "Vivillon"
        },
        "Vivillon-Pokeball": {
          types: ["Bug", "Flying"],
          bs: { hp: 80, at: 52, df: 50, sa: 90, sd: 50, sp: 89 },
          weightkg: 17,
          abilities: { 0: "Shield Dust" },
          baseSpecies: "Vivillon"
        },
        Volcanion: {
          types: ["Fire", "Water"],
          bs: { hp: 80, at: 110, df: 120, sa: 130, sd: 90, sp: 70 },
          weightkg: 195,
          gender: "N",
          abilities: { 0: "Water Absorb" }
        },
        Volkraken: {
          types: ["Water", "Fire"],
          bs: { hp: 100, at: 45, df: 80, sa: 135, sd: 100, sp: 95 },
          weightkg: 44.5,
          abilities: { 0: "Analytic" }
        },
        Volkritter: {
          types: ["Water", "Fire"],
          bs: { hp: 60, at: 30, df: 50, sa: 80, sd: 60, sp: 70 },
          weightkg: 15,
          nfe: true,
          abilities: { 0: "Anticipation" }
        },
        Xerneas: {
          types: ["Fairy"],
          bs: { hp: 126, at: 131, df: 95, sa: 131, sd: 98, sp: 99 },
          weightkg: 215,
          abilities: { 0: "Fairy Aura" },
          gender: "N"
        },
        Yveltal: {
          types: ["Dark", "Flying"],
          bs: { hp: 126, at: 131, df: 95, sa: 131, sd: 98, sp: 99 },
          weightkg: 203,
          abilities: { 0: "Dark Aura" },
          gender: "N"
        },
        Zygarde: {
          types: ["Dragon", "Ground"],
          bs: { hp: 108, at: 100, df: 121, sa: 81, sd: 95, sp: 95 },
          weightkg: 305,
          abilities: { 0: "Aura Break" },
          gender: "N"
        }
      };
      var XY = (0, util_1.extend)(true, {}, BW, XY_PATCH);
      XY["Arceus"].otherFormes.push("Arceus-Fairy");
      XY["Arceus"].otherFormes.sort();
      var SM_PATCH = {
        "Alakazam-Mega": { bs: { sd: 105 } },
        Arbok: { bs: { at: 95 } },
        Ariados: { bs: { sd: 70 } },
        Beartic: { bs: { at: 130 } },
        Chimecho: { bs: { hp: 75, df: 80, sd: 90 } },
        Corsola: { bs: { hp: 65, df: 95, sd: 95 } },
        "Crucibelle-Mega": { bs: { sa: 91, sp: 108 } },
        Crustle: { bs: { at: 105 } },
        Cryogonal: { bs: { hp: 80, df: 50 } },
        Delcatty: { bs: { sp: 90 } },
        Diglett: { otherFormes: ["Diglett-Alola"] },
        Dodrio: { bs: { sp: 110 } },
        Dugtrio: { bs: { at: 100 }, otherFormes: ["Dugtrio-Alola"] },
        Eevee: { otherFormes: ["Eevee-Starter"] },
        Electrode: { bs: { sp: 150 } },
        Exeggutor: { bs: { sd: 75 }, otherFormes: ["Exeggutor-Alola"] },
        "Farfetch\u2019d": { bs: { at: 90 } },
        Gengar: { abilities: { 0: "Cursed Body" } },
        Geodude: { otherFormes: ["Geodude-Alola"] },
        Golem: { otherFormes: ["Golem-Alola"] },
        Graveler: { otherFormes: ["Graveler-Alola"] },
        Greninja: { otherFormes: ["Greninja-Ash", "Greninja-Bond"] },
        Grimer: { otherFormes: ["Grimer-Alola"] },
        Illumise: { bs: { df: 75, sd: 85 } },
        Lunatone: { bs: { hp: 90 } },
        Magcargo: { bs: { hp: 60, sa: 90 } },
        Mantine: { bs: { hp: 85 } },
        Marowak: { otherFormes: ["Marowak-Alola", "Marowak-Alola-Totem"] },
        Masquerain: { bs: { sa: 100, sp: 80 } },
        Meowth: { otherFormes: ["Meowth-Alola"] },
        Muk: { otherFormes: ["Muk-Alola"] },
        Necturna: { bs: { sp: 58 } },
        Ninetales: { otherFormes: ["Ninetales-Alola"] },
        Naviathan: { abilities: { 0: "Guts" } },
        Noctowl: { bs: { sa: 86 } },
        Pelipper: { bs: { sa: 95 } },
        Persian: { otherFormes: ["Persian-Alola"] },
        Pikachu: {
          otherFormes: [
            "Pikachu-Alola",
            "Pikachu-Hoenn",
            "Pikachu-Kalos",
            "Pikachu-Original",
            "Pikachu-Partner",
            "Pikachu-Sinnoh",
            "Pikachu-Starter",
            "Pikachu-Unova"
          ]
        },
        Qwilfish: { bs: { df: 85 } },
        Raichu: { otherFormes: ["Raichu-Alola"] },
        Raticate: { otherFormes: ["Raticate-Alola", "Raticate-Alola-Totem"] },
        Rattata: { otherFormes: ["Rattata-Alola"] },
        Sandshrew: { otherFormes: ["Sandshrew-Alola"] },
        Sandslash: { otherFormes: ["Sandslash-Alola"] },
        Solrock: { bs: { hp: 90 } },
        Swellow: { bs: { sa: 75 } },
        Volbeat: { bs: { df: 75, sd: 85 } },
        Vulpix: { otherFormes: ["Vulpix-Alola"] },
        Woobat: { bs: { hp: 65 } },
        Zygarde: { otherFormes: ["Zygarde-10%", "Zygarde-Complete"] },
        Araquanid: {
          types: ["Water", "Bug"],
          bs: { hp: 68, at: 70, df: 92, sa: 50, sd: 132, sp: 42 },
          abilities: { 0: "Water Bubble" },
          weightkg: 82,
          otherFormes: ["Araquanid-Totem"]
        },
        "Araquanid-Totem": {
          types: ["Water", "Bug"],
          bs: { hp: 68, at: 70, df: 92, sa: 50, sd: 132, sp: 42 },
          abilities: { 0: "Water Bubble" },
          weightkg: 217.5,
          baseSpecies: "Araquanid"
        },
        Bewear: {
          types: ["Normal", "Fighting"],
          bs: { hp: 120, at: 125, df: 80, sa: 55, sd: 60, sp: 60 },
          abilities: { 0: "Fluffy" },
          weightkg: 135
        },
        Blacephalon: {
          types: ["Fire", "Ghost"],
          bs: { hp: 53, at: 127, df: 53, sa: 151, sd: 79, sp: 107 },
          weightkg: 13,
          abilities: { 0: "Beast Boost" },
          gender: "N"
        },
        Bounsweet: {
          types: ["Grass"],
          bs: { hp: 42, at: 30, df: 38, sa: 30, sd: 38, sp: 32 },
          weightkg: 3.2,
          nfe: true,
          abilities: { 0: "Leaf Guard" }
        },
        Brionne: {
          types: ["Water"],
          bs: { hp: 60, at: 69, df: 69, sa: 91, sd: 81, sp: 50 },
          weightkg: 17.5,
          nfe: true,
          abilities: { 0: "Torrent" }
        },
        Bruxish: {
          types: ["Water", "Psychic"],
          bs: { hp: 68, at: 105, df: 70, sa: 70, sd: 70, sp: 92 },
          weightkg: 19,
          abilities: { 0: "Dazzling" }
        },
        Buzzwole: {
          types: ["Bug", "Fighting"],
          bs: { hp: 107, at: 139, df: 139, sa: 53, sd: 53, sp: 79 },
          weightkg: 333.6,
          abilities: { 0: "Beast Boost" },
          gender: "N"
        },
        Caribolt: {
          types: ["Grass", "Electric"],
          bs: { hp: 84, at: 106, df: 82, sa: 77, sd: 80, sp: 106 },
          weightkg: 140,
          abilities: { 0: "Overgrow" }
        },
        Celesteela: {
          types: ["Steel", "Flying"],
          bs: { hp: 97, at: 101, df: 103, sa: 107, sd: 101, sp: 61 },
          weightkg: 999.9,
          abilities: { 0: "Beast Boost" },
          gender: "N"
        },
        Charjabug: {
          types: ["Bug", "Electric"],
          bs: { hp: 57, at: 82, df: 95, sa: 55, sd: 75, sp: 36 },
          weightkg: 10.5,
          nfe: true,
          abilities: { 0: "Battery" }
        },
        Comfey: {
          types: ["Fairy"],
          bs: { hp: 51, at: 52, df: 90, sa: 82, sd: 110, sp: 100 },
          weightkg: 0.3,
          abilities: { 0: "Flower Veil" }
        },
        Cosmoem: {
          types: ["Psychic"],
          bs: { hp: 43, at: 29, df: 131, sa: 29, sd: 131, sp: 37 },
          weightkg: 999.9,
          nfe: true,
          gender: "N",
          abilities: { 0: "Sturdy" }
        },
        Coribalis: {
          types: ["Water", "Bug"],
          bs: { hp: 76, at: 69, df: 90, sa: 65, sd: 77, sp: 43 },
          weightkg: 24.5,
          nfe: true,
          abilities: { 0: "Torrent" }
        },
        Cosmog: {
          types: ["Psychic"],
          bs: { hp: 43, at: 29, df: 31, sa: 29, sd: 31, sp: 37 },
          weightkg: 0.1,
          nfe: true,
          gender: "N",
          abilities: { 0: "Unaware" }
        },
        Crabominable: {
          types: ["Fighting", "Ice"],
          bs: { hp: 97, at: 132, df: 77, sa: 62, sd: 67, sp: 43 },
          weightkg: 180,
          abilities: { 0: "Hyper Cutter" }
        },
        Crabrawler: {
          types: ["Fighting"],
          bs: { hp: 47, at: 82, df: 57, sa: 42, sd: 47, sp: 63 },
          weightkg: 7,
          nfe: true,
          abilities: { 0: "Hyper Cutter" }
        },
        Cutiefly: {
          types: ["Bug", "Fairy"],
          bs: { hp: 40, at: 45, df: 40, sa: 55, sd: 40, sp: 84 },
          weightkg: 0.2,
          nfe: true,
          abilities: { 0: "Honey Gather" }
        },
        Dartrix: {
          types: ["Grass", "Flying"],
          bs: { hp: 78, at: 75, df: 75, sa: 70, sd: 70, sp: 52 },
          weightkg: 16,
          nfe: true,
          abilities: { 0: "Overgrow" }
        },
        Decidueye: {
          types: ["Grass", "Ghost"],
          bs: { hp: 78, at: 107, df: 75, sa: 100, sd: 100, sp: 70 },
          weightkg: 36.6,
          abilities: { 0: "Overgrow" }
        },
        Dewpider: {
          types: ["Water", "Bug"],
          bs: { hp: 38, at: 40, df: 52, sa: 40, sd: 72, sp: 27 },
          weightkg: 4,
          nfe: true,
          abilities: { 0: "Water Bubble" }
        },
        Dhelmise: {
          types: ["Ghost", "Grass"],
          bs: { hp: 70, at: 131, df: 100, sa: 86, sd: 90, sp: 40 },
          weightkg: 210,
          gender: "N",
          abilities: { 0: "Steelworker" }
        },
        Drampa: {
          types: ["Normal", "Dragon"],
          bs: { hp: 78, at: 60, df: 85, sa: 135, sd: 91, sp: 36 },
          weightkg: 185,
          abilities: { 0: "Berserk" }
        },
        "Diglett-Alola": {
          types: ["Ground", "Steel"],
          bs: { hp: 10, at: 55, df: 30, sa: 35, sd: 45, sp: 90 },
          weightkg: 1,
          baseSpecies: "Diglett",
          nfe: true,
          abilities: { 0: "Sand Veil" }
        },
        "Dugtrio-Alola": {
          types: ["Ground", "Steel"],
          bs: { hp: 35, at: 100, df: 60, sa: 50, sd: 70, sp: 110 },
          weightkg: 66.6,
          baseSpecies: "Dugtrio",
          abilities: { 0: "Sand Veil" }
        },
        "Eevee-Starter": {
          types: ["Normal"],
          bs: { hp: 65, at: 75, df: 70, sa: 65, sd: 85, sp: 75 },
          weightkg: 6.5,
          abilities: { 0: "Run Away" },
          baseSpecies: "Eevee"
        },
        Electrelk: {
          types: ["Grass", "Electric"],
          bs: { hp: 59, at: 81, df: 67, sa: 57, sd: 55, sp: 101 },
          weightkg: 41.5,
          nfe: true,
          abilities: { 0: "Overgrow" }
        },
        Equilibra: {
          types: ["Steel", "Ground"],
          bs: { hp: 102, at: 50, df: 96, sa: 133, sd: 118, sp: 60 },
          weightkg: 51.3,
          gender: "N",
          abilities: { 0: "Levitate" }
        },
        "Exeggutor-Alola": {
          types: ["Grass", "Dragon"],
          bs: { hp: 95, at: 105, df: 85, sa: 125, sd: 75, sp: 45 },
          weightkg: 415.6,
          baseSpecies: "Exeggutor",
          abilities: { 0: "Frisk" }
        },
        Fawnifer: {
          types: ["Grass"],
          bs: { hp: 49, at: 61, df: 42, sa: 52, sd: 40, sp: 76 },
          weightkg: 6.9,
          nfe: true,
          abilities: { 0: "Overgrow" }
        },
        Fomantis: {
          types: ["Grass"],
          bs: { hp: 40, at: 55, df: 35, sa: 50, sd: 35, sp: 35 },
          weightkg: 1.5,
          nfe: true,
          abilities: { 0: "Leaf Guard" }
        },
        "Geodude-Alola": {
          types: ["Rock", "Electric"],
          bs: { hp: 40, at: 80, df: 100, sa: 30, sd: 30, sp: 20 },
          weightkg: 20.3,
          baseSpecies: "Geodude",
          nfe: true,
          abilities: { 0: "Magnet Pull" }
        },
        "Golem-Alola": {
          types: ["Rock", "Electric"],
          bs: { hp: 80, at: 120, df: 130, sa: 55, sd: 65, sp: 45 },
          weightkg: 316,
          abilities: { 0: "Magnet Pull" },
          baseSpecies: "Golem"
        },
        Golisopod: {
          types: ["Bug", "Water"],
          bs: { hp: 75, at: 125, df: 140, sa: 60, sd: 90, sp: 40 },
          weightkg: 108,
          abilities: { 0: "Emergency Exit" }
        },
        "Graveler-Alola": {
          types: ["Rock", "Electric"],
          bs: { hp: 55, at: 95, df: 115, sa: 45, sd: 45, sp: 35 },
          weightkg: 110,
          baseSpecies: "Graveler",
          nfe: true,
          abilities: { 0: "Magnet Pull" }
        },
        "Grimer-Alola": {
          types: ["Poison", "Dark"],
          bs: { hp: 80, at: 80, df: 50, sa: 40, sd: 50, sp: 25 },
          weightkg: 42,
          baseSpecies: "Grimer",
          nfe: true,
          abilities: { 0: "Poison Touch" }
        },
        "Greninja-Ash": {
          types: ["Water", "Dark"],
          bs: { hp: 72, at: 145, df: 67, sa: 153, sd: 71, sp: 132 },
          weightkg: 40,
          abilities: { 0: "Battle Bond" },
          baseSpecies: "Greninja"
        },
        "Greninja-Bond": {
          types: ["Water", "Dark"],
          bs: { hp: 72, at: 95, df: 67, sa: 103, sd: 71, sp: 122 },
          weightkg: 40,
          abilities: { 0: "Battle Bond" },
          baseSpecies: "Greninja"
        },
        Grubbin: {
          types: ["Bug"],
          bs: { hp: 47, at: 62, df: 45, sa: 55, sd: 45, sp: 46 },
          weightkg: 4.4,
          nfe: true,
          abilities: { 0: "Swarm" }
        },
        Gumshoos: {
          types: ["Normal"],
          bs: { hp: 88, at: 110, df: 60, sa: 55, sd: 60, sp: 45 },
          weightkg: 14.2,
          otherFormes: ["Gumshoos-Totem"],
          abilities: { 0: "Stakeout" }
        },
        "Gumshoos-Totem": {
          types: ["Normal"],
          bs: { hp: 88, at: 110, df: 60, sa: 55, sd: 60, sp: 45 },
          weightkg: 60,
          baseSpecies: "Gumshoos",
          abilities: { 0: "Adaptability" }
        },
        Guzzlord: {
          types: ["Dark", "Dragon"],
          bs: { hp: 223, at: 101, df: 53, sa: 97, sd: 53, sp: 43 },
          weightkg: 888,
          abilities: { 0: "Beast Boost" },
          gender: "N"
        },
        "Hakamo-o": {
          types: ["Dragon", "Fighting"],
          bs: { hp: 55, at: 75, df: 90, sa: 65, sd: 70, sp: 65 },
          weightkg: 47,
          nfe: true,
          abilities: { 0: "Bulletproof" }
        },
        Incineroar: {
          types: ["Fire", "Dark"],
          bs: { hp: 95, at: 115, df: 90, sa: 80, sd: 90, sp: 60 },
          weightkg: 83,
          abilities: { 0: "Blaze" }
        },
        "Jangmo-o": {
          types: ["Dragon"],
          bs: { hp: 45, at: 55, df: 65, sa: 45, sd: 45, sp: 45 },
          weightkg: 29.7,
          nfe: true,
          abilities: { 0: "Bulletproof" }
        },
        Justyke: {
          types: ["Steel", "Ground"],
          bs: { hp: 72, at: 70, df: 56, sa: 83, sd: 68, sp: 30 },
          weightkg: 36.5,
          nfe: true,
          abilities: { 0: "Levitate" },
          gender: "N"
        },
        Jumbao: {
          types: ["Grass", "Fairy"],
          bs: { hp: 92, at: 63, df: 97, sa: 124, sd: 104, sp: 96 },
          weightkg: 200,
          abilities: { 0: "Trace" }
        },
        Kartana: {
          types: ["Grass", "Steel"],
          bs: { hp: 59, at: 181, df: 131, sa: 59, sd: 31, sp: 109 },
          weightkg: 0.1,
          abilities: { 0: "Beast Boost" },
          gender: "N"
        },
        Komala: {
          types: ["Normal"],
          bs: { hp: 65, at: 115, df: 65, sa: 75, sd: 95, sp: 65 },
          weightkg: 19.9,
          abilities: { 0: "Comatose" }
        },
        "Kommo-o": {
          types: ["Dragon", "Fighting"],
          bs: { hp: 75, at: 110, df: 125, sa: 100, sd: 105, sp: 85 },
          weightkg: 78.2,
          otherFormes: ["Kommo-o-Totem"],
          abilities: { 0: "Bulletproof" }
        },
        "Kommo-o-Totem": {
          types: ["Dragon", "Fighting"],
          bs: { hp: 75, at: 110, df: 125, sa: 100, sd: 105, sp: 85 },
          weightkg: 207.5,
          abilities: { 0: "Overcoat" },
          baseSpecies: "Kommo-o"
        },
        Litten: {
          types: ["Fire"],
          bs: { hp: 45, at: 65, df: 40, sa: 60, sd: 40, sp: 70 },
          weightkg: 4.3,
          nfe: true,
          abilities: { 0: "Blaze" }
        },
        Lunala: {
          types: ["Psychic", "Ghost"],
          bs: { hp: 137, at: 113, df: 89, sa: 137, sd: 107, sp: 97 },
          weightkg: 120,
          abilities: { 0: "Shadow Shield" },
          gender: "N"
        },
        Lurantis: {
          types: ["Grass"],
          bs: { hp: 70, at: 105, df: 90, sa: 80, sd: 90, sp: 45 },
          weightkg: 18.5,
          otherFormes: ["Lurantis-Totem"],
          abilities: { 0: "Leaf Guard" }
        },
        "Lurantis-Totem": {
          types: ["Grass"],
          bs: { hp: 70, at: 105, df: 90, sa: 80, sd: 90, sp: 45 },
          weightkg: 58,
          abilities: { 0: "Leaf Guard" },
          baseSpecies: "Lurantis"
        },
        Lycanroc: {
          types: ["Rock"],
          bs: { hp: 75, at: 115, df: 65, sa: 55, sd: 65, sp: 112 },
          weightkg: 25,
          otherFormes: ["Lycanroc-Dusk", "Lycanroc-Midnight"],
          abilities: { 0: "Keen Eye" }
        },
        "Lycanroc-Dusk": {
          types: ["Rock"],
          bs: { hp: 75, at: 117, df: 65, sa: 55, sd: 65, sp: 110 },
          weightkg: 25,
          abilities: { 0: "Tough Claws" },
          baseSpecies: "Lycanroc"
        },
        "Lycanroc-Midnight": {
          types: ["Rock"],
          bs: { hp: 85, at: 115, df: 75, sa: 55, sd: 75, sp: 82 },
          weightkg: 25,
          baseSpecies: "Lycanroc",
          abilities: { 0: "Keen Eye" }
        },
        Magearna: {
          types: ["Steel", "Fairy"],
          bs: { hp: 80, at: 95, df: 115, sa: 130, sd: 115, sp: 65 },
          weightkg: 80.5,
          gender: "N",
          abilities: { 0: "Soul-Heart" }
        },
        Mareanie: {
          types: ["Poison", "Water"],
          bs: { hp: 50, at: 53, df: 62, sa: 43, sd: 52, sp: 45 },
          weightkg: 8,
          nfe: true,
          abilities: { 0: "Merciless" }
        },
        "Marowak-Alola": {
          types: ["Fire", "Ghost"],
          bs: { hp: 60, at: 80, df: 110, sa: 50, sd: 80, sp: 45 },
          weightkg: 34,
          abilities: { 0: "Cursed Body" },
          baseSpecies: "Marowak"
        },
        "Marowak-Alola-Totem": {
          types: ["Fire", "Ghost"],
          bs: { hp: 60, at: 80, df: 110, sa: 50, sd: 80, sp: 45 },
          weightkg: 98,
          abilities: { 0: "Rock Head" },
          baseSpecies: "Marowak"
        },
        Marshadow: {
          types: ["Fighting", "Ghost"],
          bs: { hp: 90, at: 125, df: 80, sa: 90, sd: 90, sp: 125 },
          weightkg: 22.2,
          gender: "N",
          abilities: { 0: "Technician" }
        },
        Melmetal: {
          types: ["Steel"],
          bs: { hp: 135, at: 143, df: 143, sa: 80, sd: 65, sp: 34 },
          weightkg: 800,
          gender: "N",
          abilities: { 0: "Iron Fist" }
        },
        Meltan: {
          types: ["Steel"],
          bs: { hp: 46, at: 65, df: 65, sa: 55, sd: 35, sp: 34 },
          weightkg: 8,
          gender: "N",
          abilities: { 0: "Magnet Pull" }
        },
        "Meowth-Alola": {
          types: ["Dark"],
          bs: { hp: 40, at: 35, df: 35, sa: 50, sd: 40, sp: 90 },
          weightkg: 4.2,
          baseSpecies: "Meowth",
          nfe: true,
          abilities: { 0: "Pickup" }
        },
        Mimikyu: {
          types: ["Ghost", "Fairy"],
          bs: { hp: 55, at: 90, df: 80, sa: 50, sd: 105, sp: 96 },
          weightkg: 0.7,
          otherFormes: ["Mimikyu-Busted", "Mimikyu-Busted-Totem", "Mimikyu-Totem"],
          abilities: { 0: "Disguise" }
        },
        "Mimikyu-Busted": {
          types: ["Ghost", "Fairy"],
          bs: { hp: 55, at: 90, df: 80, sa: 50, sd: 105, sp: 96 },
          weightkg: 0.7,
          baseSpecies: "Mimikyu",
          abilities: { 0: "Disguise" }
        },
        "Mimikyu-Busted-Totem": {
          types: ["Ghost", "Fairy"],
          bs: { hp: 55, at: 90, df: 80, sa: 50, sd: 105, sp: 96 },
          weightkg: 2.8,
          baseSpecies: "Mimikyu",
          abilities: { 0: "Disguise" }
        },
        "Mimikyu-Totem": {
          types: ["Ghost", "Fairy"],
          bs: { hp: 55, at: 90, df: 80, sa: 50, sd: 105, sp: 96 },
          weightkg: 2.8,
          baseSpecies: "Mimikyu",
          abilities: { 0: "Disguise" }
        },
        Minior: {
          types: ["Rock", "Flying"],
          bs: { hp: 60, at: 100, df: 60, sa: 100, sd: 60, sp: 120 },
          weightkg: 0.3,
          otherFormes: ["Minior-Meteor"],
          gender: "N",
          abilities: { 0: "Shields Down" }
        },
        "Minior-Meteor": {
          types: ["Rock", "Flying"],
          bs: { hp: 60, at: 60, df: 100, sa: 60, sd: 100, sp: 60 },
          weightkg: 40,
          gender: "N",
          baseSpecies: "Minior",
          abilities: { 0: "Shields Down" }
        },
        Morelull: {
          types: ["Grass", "Fairy"],
          bs: { hp: 40, at: 35, df: 55, sa: 65, sd: 75, sp: 15 },
          weightkg: 1.5,
          nfe: true,
          abilities: { 0: "Illuminate" }
        },
        Mudbray: {
          types: ["Ground"],
          bs: { hp: 70, at: 100, df: 70, sa: 45, sd: 55, sp: 45 },
          weightkg: 110,
          nfe: true,
          abilities: { 0: "Own Tempo" }
        },
        Mudsdale: {
          types: ["Ground"],
          bs: { hp: 100, at: 125, df: 100, sa: 55, sd: 85, sp: 35 },
          weightkg: 920,
          abilities: { 0: "Own Tempo" }
        },
        "Muk-Alola": {
          types: ["Poison", "Dark"],
          bs: { hp: 105, at: 105, df: 75, sa: 65, sd: 100, sp: 50 },
          weightkg: 52,
          baseSpecies: "Muk",
          abilities: { 0: "Poison Touch" }
        },
        Mumbao: {
          types: ["Grass", "Fairy"],
          bs: { hp: 55, at: 30, df: 64, sa: 87, sd: 73, sp: 66 },
          weightkg: 83,
          nfe: true,
          abilities: { 0: "Trace" }
        },
        Naganadel: {
          types: ["Poison", "Dragon"],
          bs: { hp: 73, at: 73, df: 73, sa: 127, sd: 73, sp: 121 },
          weightkg: 150,
          abilities: { 0: "Beast Boost" },
          gender: "N"
        },
        Necrozma: {
          types: ["Psychic"],
          bs: { hp: 97, at: 107, df: 101, sa: 127, sd: 89, sp: 79 },
          weightkg: 230,
          abilities: { 0: "Prism Armor" },
          otherFormes: ["Necrozma-Dawn-Wings", "Necrozma-Dusk-Mane", "Necrozma-Ultra"],
          gender: "N"
        },
        "Necrozma-Dawn-Wings": {
          types: ["Psychic", "Ghost"],
          bs: { hp: 97, at: 113, df: 109, sa: 157, sd: 127, sp: 77 },
          weightkg: 350,
          abilities: { 0: "Prism Armor" },
          baseSpecies: "Necrozma",
          gender: "N"
        },
        "Necrozma-Dusk-Mane": {
          types: ["Psychic", "Steel"],
          bs: { hp: 97, at: 157, df: 127, sa: 113, sd: 109, sp: 77 },
          weightkg: 460,
          abilities: { 0: "Prism Armor" },
          baseSpecies: "Necrozma",
          gender: "N"
        },
        "Necrozma-Ultra": {
          types: ["Psychic", "Dragon"],
          bs: { hp: 97, at: 167, df: 97, sa: 167, sd: 97, sp: 129 },
          weightkg: 230,
          abilities: { 0: "Neuroforce" },
          baseSpecies: "Necrozma",
          gender: "N"
        },
        Nihilego: {
          types: ["Rock", "Poison"],
          bs: { hp: 109, at: 53, df: 47, sa: 127, sd: 131, sp: 103 },
          weightkg: 55.5,
          abilities: { 0: "Beast Boost" },
          gender: "N"
        },
        "Ninetales-Alola": {
          types: ["Ice", "Fairy"],
          bs: { hp: 73, at: 67, df: 75, sa: 81, sd: 100, sp: 109 },
          weightkg: 19.9,
          abilities: { 0: "Snow Cloak" },
          baseSpecies: "Ninetales"
        },
        Oranguru: {
          types: ["Normal", "Psychic"],
          bs: { hp: 90, at: 60, df: 80, sa: 90, sd: 110, sp: 60 },
          weightkg: 76,
          abilities: { 0: "Inner Focus" }
        },
        Oricorio: {
          types: ["Fire", "Flying"],
          bs: { hp: 75, at: 70, df: 70, sa: 98, sd: 70, sp: 93 },
          weightkg: 3.4,
          abilities: { 0: "Dancer" },
          otherFormes: ["Oricorio-Pa'u", "Oricorio-Pom-Pom", "Oricorio-Sensu"]
        },
        "Oricorio-Pa'u": {
          types: ["Psychic", "Flying"],
          bs: { hp: 75, at: 70, df: 70, sa: 98, sd: 70, sp: 93 },
          weightkg: 3.4,
          abilities: { 0: "Dancer" },
          baseSpecies: "Oricorio"
        },
        "Oricorio-Pom-Pom": {
          types: ["Electric", "Flying"],
          bs: { hp: 75, at: 70, df: 70, sa: 98, sd: 70, sp: 93 },
          weightkg: 3.4,
          abilities: { 0: "Dancer" },
          baseSpecies: "Oricorio"
        },
        "Oricorio-Sensu": {
          types: ["Ghost", "Flying"],
          bs: { hp: 75, at: 70, df: 70, sa: 98, sd: 70, sp: 93 },
          weightkg: 3.4,
          abilities: { 0: "Dancer" },
          baseSpecies: "Oricorio"
        },
        Pajantom: {
          types: ["Dragon", "Ghost"],
          bs: { hp: 84, at: 133, df: 71, sa: 51, sd: 111, sp: 101 },
          weightkg: 3.1,
          abilities: { 0: "Comatose" }
        },
        Palossand: {
          types: ["Ghost", "Ground"],
          bs: { hp: 85, at: 75, df: 110, sa: 100, sd: 75, sp: 35 },
          weightkg: 250,
          abilities: { 0: "Water Compaction" }
        },
        Passimian: {
          types: ["Fighting"],
          bs: { hp: 100, at: 120, df: 90, sa: 40, sd: 60, sp: 80 },
          weightkg: 82.8,
          abilities: { 0: "Receiver" }
        },
        "Persian-Alola": {
          types: ["Dark"],
          bs: { hp: 65, at: 60, df: 60, sa: 75, sd: 65, sp: 115 },
          weightkg: 33,
          baseSpecies: "Persian",
          abilities: { 0: "Fur Coat" }
        },
        Pheromosa: {
          types: ["Bug", "Fighting"],
          bs: { hp: 71, at: 137, df: 37, sa: 137, sd: 37, sp: 151 },
          weightkg: 25,
          abilities: { 0: "Beast Boost" },
          gender: "N"
        },
        "Pikachu-Alola": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Static" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-Hoenn": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Static" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-Kalos": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Static" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-Original": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Static" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-Partner": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Static" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-Sinnoh": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Static" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-Starter": {
          types: ["Electric"],
          bs: { hp: 45, at: 80, df: 50, sa: 75, sd: 60, sp: 120 },
          weightkg: 6,
          abilities: { 0: "Static" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-Unova": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Static" },
          baseSpecies: "Pikachu"
        },
        Pikipek: {
          types: ["Normal", "Flying"],
          bs: { hp: 35, at: 75, df: 30, sa: 30, sd: 30, sp: 65 },
          weightkg: 1.2,
          nfe: true,
          abilities: { 0: "Keen Eye" }
        },
        Poipole: {
          types: ["Poison"],
          bs: { hp: 67, at: 73, df: 67, sa: 73, sd: 67, sp: 73 },
          weightkg: 1.8,
          abilities: { 0: "Beast Boost" },
          nfe: true,
          gender: "N"
        },
        Popplio: {
          types: ["Water"],
          bs: { hp: 50, at: 54, df: 54, sa: 66, sd: 56, sp: 40 },
          weightkg: 7.5,
          nfe: true,
          abilities: { 0: "Torrent" }
        },
        Primarina: {
          types: ["Water", "Fairy"],
          bs: { hp: 80, at: 74, df: 74, sa: 126, sd: 116, sp: 60 },
          weightkg: 44,
          abilities: { 0: "Torrent" }
        },
        Pyukumuku: {
          types: ["Water"],
          bs: { hp: 55, at: 60, df: 130, sa: 30, sd: 130, sp: 5 },
          weightkg: 1.2,
          abilities: { 0: "Innards Out" }
        },
        "Raichu-Alola": {
          types: ["Electric", "Psychic"],
          bs: { hp: 60, at: 85, df: 50, sa: 95, sd: 85, sp: 110 },
          weightkg: 21,
          baseSpecies: "Raichu",
          abilities: { 0: "Surge Surfer" }
        },
        "Raticate-Alola": {
          types: ["Dark", "Normal"],
          bs: { hp: 75, at: 71, df: 70, sa: 40, sd: 80, sp: 77 },
          weightkg: 25.5,
          baseSpecies: "Raticate",
          abilities: { 0: "Gluttony" }
        },
        "Raticate-Alola-Totem": {
          types: ["Dark", "Normal"],
          bs: { hp: 75, at: 71, df: 70, sa: 40, sd: 80, sp: 77 },
          weightkg: 105,
          abilities: { 0: "Thick Fat" },
          baseSpecies: "Raticate"
        },
        "Rattata-Alola": {
          types: ["Dark", "Normal"],
          bs: { hp: 30, at: 56, df: 35, sa: 25, sd: 35, sp: 72 },
          weightkg: 3.8,
          baseSpecies: "Rattata",
          nfe: true,
          abilities: { 0: "Gluttony" }
        },
        Ribombee: {
          types: ["Bug", "Fairy"],
          bs: { hp: 60, at: 55, df: 60, sa: 95, sd: 70, sp: 124 },
          weightkg: 0.5,
          otherFormes: ["Ribombee-Totem"],
          abilities: { 0: "Honey Gather" }
        },
        "Ribombee-Totem": {
          types: ["Bug", "Fairy"],
          bs: { hp: 60, at: 55, df: 60, sa: 95, sd: 70, sp: 124 },
          weightkg: 2,
          abilities: { 0: "Sweet Veil" },
          baseSpecies: "Ribombee"
        },
        Rockruff: {
          types: ["Rock"],
          bs: { hp: 45, at: 65, df: 40, sa: 30, sd: 40, sp: 60 },
          weightkg: 9.2,
          nfe: true,
          otherFormes: ["Rockruff-Dusk"],
          abilities: { 0: "Keen Eye" }
        },
        "Rockruff-Dusk": {
          types: ["Rock"],
          bs: { hp: 45, at: 65, df: 40, sa: 30, sd: 40, sp: 60 },
          weightkg: 9.2,
          nfe: true,
          abilities: { 0: "Own Tempo" },
          baseSpecies: "Rockruff"
        },
        Rowlet: {
          types: ["Grass", "Flying"],
          bs: { hp: 68, at: 55, df: 55, sa: 50, sd: 50, sp: 42 },
          weightkg: 1.5,
          nfe: true,
          abilities: { 0: "Overgrow" }
        },
        Salandit: {
          types: ["Poison", "Fire"],
          bs: { hp: 48, at: 44, df: 40, sa: 71, sd: 40, sp: 77 },
          weightkg: 4.8,
          nfe: true,
          abilities: { 0: "Corrosion" }
        },
        Salazzle: {
          types: ["Poison", "Fire"],
          bs: { hp: 68, at: 64, df: 60, sa: 111, sd: 60, sp: 117 },
          weightkg: 22.2,
          otherFormes: ["Salazzle-Totem"],
          abilities: { 0: "Corrosion" }
        },
        "Salazzle-Totem": {
          types: ["Poison", "Fire"],
          bs: { hp: 68, at: 64, df: 60, sa: 111, sd: 60, sp: 117 },
          weightkg: 81,
          abilities: { 0: "Corrosion" },
          baseSpecies: "Salazzle"
        },
        "Sandshrew-Alola": {
          types: ["Ice", "Steel"],
          bs: { hp: 50, at: 75, df: 90, sa: 10, sd: 35, sp: 40 },
          weightkg: 40,
          baseSpecies: "Sandshrew",
          nfe: true,
          abilities: { 0: "Snow Cloak" }
        },
        "Sandslash-Alola": {
          types: ["Ice", "Steel"],
          bs: { hp: 75, at: 100, df: 120, sa: 25, sd: 65, sp: 65 },
          weightkg: 55,
          baseSpecies: "Sandslash",
          abilities: { 0: "Snow Cloak" }
        },
        Sandygast: {
          types: ["Ghost", "Ground"],
          bs: { hp: 55, at: 55, df: 80, sa: 70, sd: 45, sp: 15 },
          weightkg: 70,
          nfe: true,
          abilities: { 0: "Water Compaction" }
        },
        Shiinotic: {
          types: ["Grass", "Fairy"],
          bs: { hp: 60, at: 45, df: 80, sa: 90, sd: 100, sp: 30 },
          weightkg: 11.5,
          abilities: { 0: "Illuminate" }
        },
        Silvally: {
          types: ["Normal"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          gender: "N",
          otherFormes: [
            "Silvally-Bug",
            "Silvally-Dark",
            "Silvally-Dragon",
            "Silvally-Electric",
            "Silvally-Fairy",
            "Silvally-Fighting",
            "Silvally-Fire",
            "Silvally-Flying",
            "Silvally-Ghost",
            "Silvally-Grass",
            "Silvally-Ground",
            "Silvally-Ice",
            "Silvally-Poison",
            "Silvally-Psychic",
            "Silvally-Rock",
            "Silvally-Steel",
            "Silvally-Water"
          ]
        },
        "Silvally-Bug": {
          types: ["Bug"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Dark": {
          types: ["Dark"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Dragon": {
          types: ["Dragon"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Electric": {
          types: ["Electric"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Fairy": {
          types: ["Fairy"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Fighting": {
          types: ["Fighting"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Fire": {
          types: ["Fire"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Flying": {
          types: ["Flying"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Ghost": {
          types: ["Ghost"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Grass": {
          types: ["Grass"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Ground": {
          types: ["Ground"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Ice": {
          types: ["Ice"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Poison": {
          types: ["Poison"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Psychic": {
          types: ["Psychic"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Rock": {
          types: ["Rock"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Steel": {
          types: ["Steel"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        "Silvally-Water": {
          types: ["Water"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 95 },
          weightkg: 100.5,
          abilities: { 0: "RKS System" },
          baseSpecies: "Silvally",
          gender: "N"
        },
        Smogecko: {
          types: ["Fire"],
          bs: { hp: 48, at: 66, df: 43, sa: 58, sd: 48, sp: 56 },
          weightkg: 8.5,
          nfe: true,
          abilities: { 0: "Blaze" }
        },
        Smoguana: {
          types: ["Fire", "Ground"],
          bs: { hp: 68, at: 86, df: 53, sa: 68, sd: 68, sp: 76 },
          weightkg: 22.2,
          nfe: true,
          abilities: { 0: "Blaze" }
        },
        Smokomodo: {
          types: ["Fire", "Ground"],
          bs: { hp: 88, at: 116, df: 67, sa: 88, sd: 78, sp: 97 },
          weightkg: 205,
          abilities: { 0: "Blaze" }
        },
        Snaelstrom: {
          types: ["Water", "Bug"],
          bs: { hp: 91, at: 94, df: 110, sa: 80, sd: 97, sp: 63 },
          weightkg: 120,
          abilities: { 0: "Torrent" }
        },
        Solgaleo: {
          types: ["Psychic", "Steel"],
          bs: { hp: 137, at: 137, df: 107, sa: 113, sd: 89, sp: 97 },
          weightkg: 230,
          abilities: { 0: "Full Metal Body" },
          gender: "N"
        },
        Stakataka: {
          types: ["Rock", "Steel"],
          bs: { hp: 61, at: 131, df: 211, sa: 53, sd: 101, sp: 13 },
          weightkg: 820,
          abilities: { 0: "Beast Boost" },
          gender: "N"
        },
        Steenee: {
          types: ["Grass"],
          bs: { hp: 52, at: 40, df: 48, sa: 40, sd: 48, sp: 62 },
          weightkg: 8.2,
          nfe: true,
          abilities: { 0: "Leaf Guard" }
        },
        Stufful: {
          types: ["Normal", "Fighting"],
          bs: { hp: 70, at: 75, df: 50, sa: 45, sd: 50, sp: 50 },
          weightkg: 6.8,
          abilities: { 0: "Fluffy" },
          nfe: true
        },
        Swirlpool: {
          types: ["Water"],
          bs: { hp: 61, at: 49, df: 70, sa: 50, sd: 62, sp: 28 },
          weightkg: 7,
          nfe: true,
          abilities: { 0: "Torrent" }
        },
        "Tapu Bulu": {
          types: ["Grass", "Fairy"],
          bs: { hp: 70, at: 130, df: 115, sa: 85, sd: 95, sp: 75 },
          weightkg: 45.5,
          abilities: { 0: "Grassy Surge" },
          gender: "N"
        },
        "Tapu Fini": {
          types: ["Water", "Fairy"],
          bs: { hp: 70, at: 75, df: 115, sa: 95, sd: 130, sp: 85 },
          weightkg: 21.2,
          abilities: { 0: "Misty Surge" },
          gender: "N"
        },
        "Tapu Koko": {
          types: ["Electric", "Fairy"],
          bs: { hp: 70, at: 115, df: 85, sa: 95, sd: 75, sp: 130 },
          weightkg: 20.5,
          abilities: { 0: "Electric Surge" },
          gender: "N"
        },
        "Tapu Lele": {
          types: ["Psychic", "Fairy"],
          bs: { hp: 70, at: 85, df: 75, sa: 130, sd: 115, sp: 95 },
          weightkg: 18.6,
          abilities: { 0: "Psychic Surge" },
          gender: "N"
        },
        Togedemaru: {
          types: ["Electric", "Steel"],
          bs: { hp: 65, at: 98, df: 63, sa: 40, sd: 73, sp: 96 },
          weightkg: 3.3,
          abilities: { 0: "Iron Barbs" },
          otherFormes: ["Togedemaru-Totem"]
        },
        "Togedemaru-Totem": {
          types: ["Electric", "Steel"],
          bs: { hp: 65, at: 98, df: 63, sa: 40, sd: 73, sp: 96 },
          weightkg: 13,
          abilities: { 0: "Sturdy" },
          baseSpecies: "Togedemaru"
        },
        Torracat: {
          types: ["Fire"],
          bs: { hp: 65, at: 85, df: 50, sa: 80, sd: 50, sp: 90 },
          weightkg: 25,
          nfe: true,
          abilities: { 0: "Blaze" }
        },
        Toucannon: {
          types: ["Normal", "Flying"],
          bs: { hp: 80, at: 120, df: 75, sa: 75, sd: 75, sp: 60 },
          weightkg: 26,
          abilities: { 0: "Keen Eye" }
        },
        Toxapex: {
          types: ["Poison", "Water"],
          bs: { hp: 50, at: 63, df: 152, sa: 53, sd: 142, sp: 35 },
          weightkg: 14.5,
          abilities: { 0: "Merciless" }
        },
        Trumbeak: {
          types: ["Normal", "Flying"],
          bs: { hp: 55, at: 85, df: 50, sa: 40, sd: 50, sp: 75 },
          weightkg: 14.8,
          nfe: true,
          abilities: { 0: "Keen Eye" }
        },
        Tsareena: {
          types: ["Grass"],
          bs: { hp: 72, at: 120, df: 98, sa: 50, sd: 98, sp: 72 },
          weightkg: 21.4,
          abilities: { 0: "Leaf Guard" }
        },
        Turtonator: {
          types: ["Fire", "Dragon"],
          bs: { hp: 60, at: 78, df: 135, sa: 91, sd: 85, sp: 36 },
          weightkg: 212,
          abilities: { 0: "Shell Armor" }
        },
        "Type: Null": {
          types: ["Normal"],
          bs: { hp: 95, at: 95, df: 95, sa: 95, sd: 95, sp: 59 },
          weightkg: 120.5,
          abilities: { 0: "Battle Armor" },
          nfe: true,
          gender: "N"
        },
        Vikavolt: {
          types: ["Bug", "Electric"],
          bs: { hp: 77, at: 70, df: 90, sa: 145, sd: 75, sp: 43 },
          weightkg: 45,
          abilities: { 0: "Levitate" },
          otherFormes: ["Vikavolt-Totem"]
        },
        "Vikavolt-Totem": {
          types: ["Bug", "Electric"],
          bs: { hp: 77, at: 70, df: 90, sa: 145, sd: 75, sp: 43 },
          weightkg: 147.5,
          abilities: { 0: "Levitate" },
          baseSpecies: "Vikavolt"
        },
        "Vulpix-Alola": {
          types: ["Ice"],
          bs: { hp: 38, at: 41, df: 40, sa: 50, sd: 65, sp: 65 },
          weightkg: 9.9,
          baseSpecies: "Vulpix",
          nfe: true,
          abilities: { 0: "Snow Cloak" }
        },
        Wimpod: {
          types: ["Bug", "Water"],
          bs: { hp: 25, at: 35, df: 40, sa: 20, sd: 30, sp: 80 },
          weightkg: 12,
          abilities: { 0: "Wimp Out" },
          nfe: true
        },
        Wishiwashi: {
          types: ["Water"],
          bs: { hp: 45, at: 20, df: 20, sa: 25, sd: 25, sp: 40 },
          weightkg: 0.3,
          otherFormes: ["Wishiwashi-School"],
          abilities: { 0: "Schooling" }
        },
        "Wishiwashi-School": {
          types: ["Water"],
          bs: { hp: 45, at: 140, df: 130, sa: 140, sd: 135, sp: 30 },
          weightkg: 78.6,
          baseSpecies: "Wishiwashi",
          abilities: { 0: "Schooling" }
        },
        Xurkitree: {
          types: ["Electric"],
          bs: { hp: 83, at: 89, df: 71, sa: 173, sd: 71, sp: 83 },
          weightkg: 100,
          abilities: { 0: "Beast Boost" },
          gender: "N"
        },
        Yungoos: {
          types: ["Normal"],
          bs: { hp: 48, at: 70, df: 30, sa: 30, sd: 30, sp: 45 },
          weightkg: 6,
          nfe: true,
          abilities: { 0: "Stakeout" }
        },
        Zeraora: {
          types: ["Electric"],
          bs: { hp: 88, at: 112, df: 75, sa: 102, sd: 80, sp: 143 },
          weightkg: 44.5,
          abilities: { 0: "Volt Absorb" },
          gender: "N"
        },
        "Zygarde-10%": {
          types: ["Dragon", "Ground"],
          bs: { hp: 54, at: 100, df: 71, sa: 61, sd: 85, sp: 115 },
          weightkg: 33.5,
          abilities: { 0: "Aura Break" },
          baseSpecies: "Zygarde",
          gender: "N"
        },
        "Zygarde-Complete": {
          types: ["Dragon", "Ground"],
          bs: { hp: 216, at: 100, df: 121, sa: 91, sd: 95, sp: 85 },
          weightkg: 610,
          abilities: { 0: "Power Construct" },
          baseSpecies: "Zygarde",
          gender: "N"
        }
      };
      var SM = (0, util_1.extend)(true, {}, XY, SM_PATCH);
      delete SM["Pikachu-Cosplay"];
      delete SM["Pikachu-Rock-Star"];
      delete SM["Pikachu-Belle"];
      delete SM["Pikachu-PhD"];
      delete SM["Pikachu-Pop-Star"];
      delete SM["Pikachu-Libre"];
      var SS_PATCH = {
        "Aegislash-Blade": { bs: { at: 140, sa: 140 } },
        "Aegislash-Both": { bs: { at: 140, df: 140, sa: 140, sd: 140 } },
        "Aegislash-Shield": { bs: { df: 140, sd: 140 } },
        Articuno: { otherFormes: ["Articuno-Galar"] },
        Blastoise: { otherFormes: ["Blastoise-Gmax", "Blastoise-Mega"] },
        Butterfree: { otherFormes: ["Butterfree-Gmax"] },
        Charizard: { otherFormes: ["Charizard-Gmax", "Charizard-Mega-X", "Charizard-Mega-Y"] },
        Corsola: { otherFormes: ["Corsola-Galar"] },
        Darmanitan: {
          otherFormes: ["Darmanitan-Galar", "Darmanitan-Galar-Zen", "Darmanitan-Zen"]
        },
        Darumaka: { otherFormes: ["Darumaka-Galar"] },
        Eevee: { otherFormes: ["Eevee-Gmax"] },
        Equilibra: { bs: { sa: 133 } },
        "Farfetch\u2019d": { otherFormes: ["Farfetch\u2019d-Galar"] },
        Garbodor: { otherFormes: ["Garbodor-Gmax"] },
        Gengar: { otherFormes: ["Gengar-Gmax", "Gengar-Mega"] },
        Kingler: { otherFormes: ["Kingler-Gmax"] },
        Lapras: { otherFormes: ["Lapras-Gmax"] },
        Linoone: { otherFormes: ["Linoone-Galar"] },
        Machamp: { otherFormes: ["Machamp-Gmax"] },
        Melmetal: { otherFormes: ["Melmetal-Gmax"] },
        Meowth: { otherFormes: ["Meowth-Alola", "Meowth-Galar", "Meowth-Gmax"] },
        Moltres: { otherFormes: ["Moltres-Galar"] },
        "Mr. Mime": { otherFormes: ["Mr. Mime-Galar"] },
        Pikachu: {
          otherFormes: [
            "Pikachu-Alola",
            "Pikachu-Gmax",
            "Pikachu-Hoenn",
            "Pikachu-Kalos",
            "Pikachu-Original",
            "Pikachu-Partner",
            "Pikachu-Sinnoh",
            "Pikachu-Unova",
            "Pikachu-World"
          ]
        },
        Ponyta: { otherFormes: ["Ponyta-Galar"] },
        Pyroak: { bs: { sa: 70, sd: 65 } },
        Rapidash: { otherFormes: ["Rapidash-Galar"] },
        Slowbro: { otherFormes: ["Slowbro-Galar", "Slowbro-Mega"] },
        Slowking: { otherFormes: ["Slowking-Galar"] },
        Slowpoke: { otherFormes: ["Slowpoke-Galar"] },
        Snorlax: { otherFormes: ["Snorlax-Gmax"] },
        Stunfisk: { otherFormes: ["Stunfisk-Galar"] },
        Venusaur: { otherFormes: ["Venusaur-Gmax", "Venusaur-Mega"] },
        Voodoom: { bs: { sa: 130 } },
        Weezing: { otherFormes: ["Weezing-Galar"] },
        Yamask: { otherFormes: ["Yamask-Galar"] },
        Zapdos: { otherFormes: ["Zapdos-Galar"] },
        Zigzagoon: { otherFormes: ["Zigzagoon-Galar"] },
        Alcremie: {
          types: ["Fairy"],
          bs: { hp: 65, at: 60, df: 75, sa: 110, sd: 121, sp: 64 },
          weightkg: 0.5,
          abilities: { 0: "Sweet Veil" },
          otherFormes: ["Alcremie-Gmax"]
        },
        "Alcremie-Gmax": {
          types: ["Fairy"],
          bs: { hp: 65, at: 60, df: 75, sa: 110, sd: 121, sp: 64 },
          weightkg: 0,
          abilities: { 0: "Sweet Veil" },
          baseSpecies: "Alcremie"
        },
        Appletun: {
          types: ["Grass", "Dragon"],
          bs: { hp: 110, at: 85, df: 80, sa: 100, sd: 80, sp: 30 },
          weightkg: 13,
          abilities: { 0: "Ripen" },
          otherFormes: ["Appletun-Gmax"]
        },
        "Appletun-Gmax": {
          types: ["Grass", "Dragon"],
          bs: { hp: 110, at: 85, df: 80, sa: 100, sd: 80, sp: 30 },
          weightkg: 0,
          abilities: { 0: "Ripen" },
          baseSpecies: "Appletun"
        },
        Applin: {
          types: ["Grass", "Dragon"],
          bs: { hp: 40, at: 40, df: 80, sa: 40, sd: 40, sp: 20 },
          weightkg: 0.5,
          abilities: { 0: "Ripen" },
          nfe: true
        },
        Arctovish: {
          types: ["Water", "Ice"],
          bs: { hp: 90, at: 90, df: 100, sa: 80, sd: 90, sp: 55 },
          weightkg: 175,
          abilities: { 0: "Water Absorb" },
          gender: "N"
        },
        Arctozolt: {
          types: ["Electric", "Ice"],
          bs: { hp: 90, at: 100, df: 90, sa: 90, sd: 80, sp: 55 },
          weightkg: 150,
          abilities: { 0: "Volt Absorb" },
          gender: "N"
        },
        Arrokuda: {
          types: ["Water"],
          bs: { hp: 41, at: 63, df: 40, sa: 40, sd: 30, sp: 66 },
          weightkg: 1,
          abilities: { 0: "Swift Swim" },
          nfe: true
        },
        "Articuno-Galar": {
          types: ["Psychic", "Flying"],
          bs: { hp: 90, at: 85, df: 85, sa: 125, sd: 100, sp: 95 },
          weightkg: 50.9,
          abilities: { 0: "Competitive" },
          gender: "N",
          baseSpecies: "Articuno"
        },
        Astrolotl: {
          types: ["Fire", "Dragon"],
          bs: { hp: 108, at: 108, df: 74, sa: 92, sd: 64, sp: 114 },
          weightkg: 50,
          abilities: { 0: "Regenerator" }
        },
        Barraskewda: {
          types: ["Water"],
          bs: { hp: 61, at: 123, df: 60, sa: 60, sd: 50, sp: 136 },
          weightkg: 30,
          abilities: { 0: "Swift Swim" }
        },
        "Blastoise-Gmax": {
          types: ["Water"],
          bs: { hp: 79, at: 83, df: 100, sa: 85, sd: 105, sp: 78 },
          weightkg: 0,
          abilities: { 0: "Torrent" },
          baseSpecies: "Blastoise"
        },
        Blipbug: {
          types: ["Bug"],
          bs: { hp: 25, at: 20, df: 20, sa: 25, sd: 45, sp: 45 },
          weightkg: 8,
          abilities: { 0: "Swarm" },
          nfe: true
        },
        Boltund: {
          types: ["Electric"],
          bs: { hp: 69, at: 90, df: 60, sa: 90, sd: 60, sp: 121 },
          weightkg: 34,
          abilities: { 0: "Strong Jaw" }
        },
        "Butterfree-Gmax": {
          types: ["Bug", "Flying"],
          bs: { hp: 60, at: 45, df: 50, sa: 90, sd: 80, sp: 70 },
          weightkg: 0,
          abilities: { 0: "Compound Eyes" },
          baseSpecies: "Butterfree"
        },
        Calyrex: {
          types: ["Psychic", "Grass"],
          bs: { hp: 100, at: 80, df: 80, sa: 80, sd: 80, sp: 80 },
          weightkg: 7.7,
          abilities: { 0: "Unnerve" },
          gender: "N",
          otherFormes: ["Calyrex-Ice", "Calyrex-Shadow"]
        },
        "Calyrex-Ice": {
          types: ["Psychic", "Ice"],
          bs: { hp: 100, at: 165, df: 150, sa: 85, sd: 130, sp: 50 },
          weightkg: 809.1,
          abilities: { 0: "As One (Glastrier)" },
          gender: "N",
          baseSpecies: "Calyrex"
        },
        "Calyrex-Shadow": {
          types: ["Psychic", "Ghost"],
          bs: { hp: 100, at: 85, df: 80, sa: 165, sd: 100, sp: 150 },
          weightkg: 53.6,
          abilities: { 0: "As One (Spectrier)" },
          gender: "N",
          baseSpecies: "Calyrex"
        },
        Carkol: {
          types: ["Rock", "Fire"],
          bs: { hp: 80, at: 60, df: 90, sa: 60, sd: 70, sp: 50 },
          weightkg: 78,
          abilities: { 0: "Steam Engine" },
          nfe: true
        },
        Centiskorch: {
          types: ["Fire", "Bug"],
          bs: { hp: 100, at: 115, df: 65, sa: 90, sd: 90, sp: 65 },
          weightkg: 120,
          abilities: { 0: "Flash Fire" },
          otherFormes: ["Centiskorch-Gmax"]
        },
        "Centiskorch-Gmax": {
          types: ["Fire", "Bug"],
          bs: { hp: 100, at: 115, df: 65, sa: 90, sd: 90, sp: 65 },
          weightkg: 0,
          abilities: { 0: "Flash Fire" },
          baseSpecies: "Centiskorch"
        },
        "Charizard-Gmax": {
          types: ["Fire", "Flying"],
          bs: { hp: 78, at: 84, df: 78, sa: 109, sd: 85, sp: 100 },
          weightkg: 0,
          abilities: { 0: "Blaze" },
          baseSpecies: "Charizard"
        },
        Chewtle: {
          types: ["Water"],
          bs: { hp: 50, at: 64, df: 50, sa: 38, sd: 38, sp: 44 },
          weightkg: 8.5,
          abilities: { 0: "Strong Jaw" },
          nfe: true
        },
        Chromera: {
          types: ["Dark", "Normal"],
          bs: { hp: 85, at: 85, df: 115, sa: 115, sd: 100, sp: 100 },
          weightkg: 215,
          abilities: { 0: "Color Change" },
          gender: "N"
        },
        Cinderace: {
          types: ["Fire"],
          bs: { hp: 80, at: 116, df: 75, sa: 65, sd: 75, sp: 119 },
          weightkg: 33,
          abilities: { 0: "Blaze" },
          otherFormes: ["Cinderace-Gmax"]
        },
        "Cinderace-Gmax": {
          types: ["Fire"],
          bs: { hp: 80, at: 116, df: 75, sa: 65, sd: 75, sp: 119 },
          weightkg: 0,
          abilities: { 0: "Blaze" },
          baseSpecies: "Cinderace"
        },
        Clobbopus: {
          types: ["Fighting"],
          bs: { hp: 50, at: 68, df: 60, sa: 50, sd: 50, sp: 32 },
          weightkg: 4,
          abilities: { 0: "Limber" },
          nfe: true
        },
        Coalossal: {
          types: ["Rock", "Fire"],
          bs: { hp: 110, at: 80, df: 120, sa: 80, sd: 90, sp: 30 },
          weightkg: 310.5,
          abilities: { 0: "Steam Engine" },
          otherFormes: ["Coalossal-Gmax"]
        },
        "Coalossal-Gmax": {
          types: ["Rock", "Fire"],
          bs: { hp: 110, at: 80, df: 120, sa: 80, sd: 90, sp: 30 },
          weightkg: 0,
          abilities: { 0: "Steam Engine" },
          baseSpecies: "Coalossal"
        },
        Copperajah: {
          types: ["Steel"],
          bs: { hp: 122, at: 130, df: 69, sa: 80, sd: 69, sp: 30 },
          weightkg: 650,
          abilities: { 0: "Sheer Force" },
          otherFormes: ["Copperajah-Gmax"]
        },
        "Copperajah-Gmax": {
          types: ["Steel"],
          bs: { hp: 122, at: 130, df: 69, sa: 80, sd: 69, sp: 30 },
          weightkg: 0,
          abilities: { 0: "Sheer Force" },
          baseSpecies: "Copperajah"
        },
        "Corsola-Galar": {
          types: ["Ghost"],
          bs: { hp: 60, at: 55, df: 100, sa: 65, sd: 100, sp: 30 },
          weightkg: 0.5,
          abilities: { 0: "Weak Armor" },
          nfe: true,
          baseSpecies: "Corsola"
        },
        Corviknight: {
          types: ["Flying", "Steel"],
          bs: { hp: 98, at: 87, df: 105, sa: 53, sd: 85, sp: 67 },
          weightkg: 75,
          abilities: { 0: "Pressure" },
          otherFormes: ["Corviknight-Gmax"]
        },
        "Corviknight-Gmax": {
          types: ["Flying", "Steel"],
          bs: { hp: 98, at: 87, df: 105, sa: 53, sd: 85, sp: 67 },
          weightkg: 0,
          abilities: { 0: "Pressure" },
          baseSpecies: "Corviknight"
        },
        Corvisquire: {
          types: ["Flying"],
          bs: { hp: 68, at: 67, df: 55, sa: 43, sd: 55, sp: 77 },
          weightkg: 16,
          abilities: { 0: "Keen Eye" },
          nfe: true
        },
        Cramorant: {
          types: ["Flying", "Water"],
          bs: { hp: 70, at: 85, df: 55, sa: 85, sd: 95, sp: 85 },
          weightkg: 18,
          abilities: { 0: "Gulp Missile" },
          otherFormes: ["Cramorant-Gorging", "Cramorant-Gulping"]
        },
        "Cramorant-Gorging": {
          types: ["Flying", "Water"],
          bs: { hp: 70, at: 85, df: 55, sa: 85, sd: 95, sp: 85 },
          weightkg: 18,
          abilities: { 0: "Gulp Missile" },
          baseSpecies: "Cramorant"
        },
        "Cramorant-Gulping": {
          types: ["Flying", "Water"],
          bs: { hp: 70, at: 85, df: 55, sa: 85, sd: 95, sp: 85 },
          weightkg: 18,
          abilities: { 0: "Gulp Missile" },
          baseSpecies: "Cramorant"
        },
        Cufant: {
          types: ["Steel"],
          bs: { hp: 72, at: 80, df: 49, sa: 40, sd: 49, sp: 40 },
          weightkg: 100,
          abilities: { 0: "Sheer Force" },
          nfe: true
        },
        Cursola: {
          types: ["Ghost"],
          bs: { hp: 60, at: 95, df: 50, sa: 145, sd: 130, sp: 30 },
          weightkg: 0.4,
          abilities: { 0: "Weak Armor" }
        },
        "Darmanitan-Galar": {
          types: ["Ice"],
          bs: { hp: 105, at: 140, df: 55, sa: 30, sd: 55, sp: 95 },
          weightkg: 120,
          abilities: { 0: "Gorilla Tactics" },
          baseSpecies: "Darmanitan"
        },
        "Darmanitan-Galar-Zen": {
          types: ["Ice", "Fire"],
          bs: { hp: 105, at: 160, df: 55, sa: 30, sd: 55, sp: 135 },
          weightkg: 120,
          abilities: { 0: "Zen Mode" },
          baseSpecies: "Darmanitan"
        },
        "Darumaka-Galar": {
          types: ["Ice"],
          bs: { hp: 70, at: 90, df: 45, sa: 15, sd: 45, sp: 50 },
          weightkg: 40,
          abilities: { 0: "Hustle" },
          nfe: true,
          baseSpecies: "Darumaka"
        },
        Dottler: {
          types: ["Bug", "Psychic"],
          bs: { hp: 50, at: 35, df: 80, sa: 50, sd: 90, sp: 30 },
          weightkg: 19.5,
          abilities: { 0: "Swarm" },
          nfe: true
        },
        Dracovish: {
          types: ["Water", "Dragon"],
          bs: { hp: 90, at: 90, df: 100, sa: 70, sd: 80, sp: 75 },
          weightkg: 215,
          abilities: { 0: "Water Absorb" },
          gender: "N"
        },
        Dracozolt: {
          types: ["Electric", "Dragon"],
          bs: { hp: 90, at: 100, df: 90, sa: 80, sd: 70, sp: 75 },
          weightkg: 190,
          abilities: { 0: "Volt Absorb" },
          gender: "N"
        },
        Dragapult: {
          types: ["Dragon", "Ghost"],
          bs: { hp: 88, at: 120, df: 75, sa: 100, sd: 75, sp: 142 },
          weightkg: 50,
          abilities: { 0: "Clear Body" }
        },
        Drakloak: {
          types: ["Dragon", "Ghost"],
          bs: { hp: 68, at: 80, df: 50, sa: 60, sd: 50, sp: 102 },
          weightkg: 11,
          abilities: { 0: "Clear Body" },
          nfe: true
        },
        Drednaw: {
          types: ["Water", "Rock"],
          bs: { hp: 90, at: 115, df: 90, sa: 48, sd: 68, sp: 74 },
          weightkg: 115.5,
          abilities: { 0: "Strong Jaw" },
          otherFormes: ["Drednaw-Gmax"]
        },
        "Drednaw-Gmax": {
          types: ["Water", "Rock"],
          bs: { hp: 90, at: 115, df: 90, sa: 48, sd: 68, sp: 74 },
          weightkg: 0,
          abilities: { 0: "Strong Jaw" },
          baseSpecies: "Drednaw"
        },
        Dreepy: {
          types: ["Dragon", "Ghost"],
          bs: { hp: 28, at: 60, df: 30, sa: 40, sd: 30, sp: 82 },
          weightkg: 2,
          abilities: { 0: "Clear Body" },
          nfe: true
        },
        Drizzile: {
          types: ["Water"],
          bs: { hp: 65, at: 60, df: 55, sa: 95, sd: 55, sp: 90 },
          weightkg: 11.5,
          abilities: { 0: "Torrent" },
          nfe: true
        },
        Dubwool: {
          types: ["Normal"],
          bs: { hp: 72, at: 80, df: 100, sa: 60, sd: 90, sp: 88 },
          weightkg: 43,
          abilities: { 0: "Fluffy" }
        },
        Duraludon: {
          types: ["Steel", "Dragon"],
          bs: { hp: 70, at: 95, df: 115, sa: 120, sd: 50, sp: 85 },
          weightkg: 40,
          abilities: { 0: "Light Metal" },
          otherFormes: ["Duraludon-Gmax"]
        },
        "Duraludon-Gmax": {
          types: ["Steel", "Dragon"],
          bs: { hp: 70, at: 95, df: 115, sa: 120, sd: 50, sp: 85 },
          weightkg: 0,
          abilities: { 0: "Light Metal" },
          baseSpecies: "Duraludon"
        },
        "Eevee-Gmax": {
          types: ["Normal"],
          bs: { hp: 55, at: 55, df: 50, sa: 45, sd: 65, sp: 55 },
          weightkg: 0,
          abilities: { 0: "Run Away" },
          baseSpecies: "Eevee"
        },
        Eiscue: {
          types: ["Ice"],
          bs: { hp: 75, at: 80, df: 110, sa: 65, sd: 90, sp: 50 },
          weightkg: 89,
          abilities: { 0: "Ice Face" },
          otherFormes: ["Eiscue-Noice"]
        },
        "Eiscue-Noice": {
          types: ["Ice"],
          bs: { hp: 75, at: 80, df: 70, sa: 65, sd: 50, sp: 130 },
          weightkg: 89,
          abilities: { 0: "Ice Face" },
          baseSpecies: "Eiscue"
        },
        Eldegoss: {
          types: ["Grass"],
          bs: { hp: 60, at: 50, df: 90, sa: 80, sd: 120, sp: 60 },
          weightkg: 2.5,
          abilities: { 0: "Cotton Down" }
        },
        Eternatus: {
          types: ["Poison", "Dragon"],
          bs: { hp: 140, at: 85, df: 95, sa: 145, sd: 95, sp: 130 },
          weightkg: 950,
          abilities: { 0: "Pressure" },
          gender: "N",
          otherFormes: ["Eternatus-Eternamax"]
        },
        "Eternatus-Eternamax": {
          types: ["Poison", "Dragon"],
          bs: { hp: 255, at: 115, df: 250, sa: 125, sd: 250, sp: 130 },
          weightkg: 0,
          abilities: { 0: "Pressure" },
          gender: "N",
          baseSpecies: "Eternatus"
        },
        Falinks: {
          types: ["Fighting"],
          bs: { hp: 65, at: 100, df: 100, sa: 70, sd: 60, sp: 75 },
          weightkg: 62,
          abilities: { 0: "Battle Armor" },
          gender: "N"
        },
        "Farfetch\u2019d-Galar": {
          types: ["Fighting"],
          bs: { hp: 52, at: 95, df: 55, sa: 58, sd: 62, sp: 55 },
          weightkg: 42,
          abilities: { 0: "Steadfast" },
          nfe: true,
          baseSpecies: "Farfetch\u2019d"
        },
        Flapple: {
          types: ["Grass", "Dragon"],
          bs: { hp: 70, at: 110, df: 80, sa: 95, sd: 60, sp: 70 },
          weightkg: 1,
          abilities: { 0: "Ripen" },
          otherFormes: ["Flapple-Gmax"]
        },
        "Flapple-Gmax": {
          types: ["Grass", "Dragon"],
          bs: { hp: 70, at: 110, df: 80, sa: 95, sd: 60, sp: 70 },
          weightkg: 0,
          abilities: { 0: "Ripen" },
          baseSpecies: "Flapple"
        },
        Frosmoth: {
          types: ["Ice", "Bug"],
          bs: { hp: 70, at: 65, df: 60, sa: 125, sd: 90, sp: 65 },
          weightkg: 42,
          abilities: { 0: "Shield Dust" }
        },
        "Garbodor-Gmax": {
          types: ["Poison"],
          bs: { hp: 80, at: 95, df: 82, sa: 60, sd: 82, sp: 75 },
          weightkg: 0,
          abilities: { 0: "Stench" },
          baseSpecies: "Garbodor"
        },
        "Gengar-Gmax": {
          types: ["Ghost", "Poison"],
          bs: { hp: 60, at: 65, df: 60, sa: 130, sd: 75, sp: 110 },
          weightkg: 0,
          abilities: { 0: "Cursed Body" },
          baseSpecies: "Gengar"
        },
        Glastrier: {
          types: ["Ice"],
          bs: { hp: 100, at: 145, df: 130, sa: 65, sd: 110, sp: 30 },
          weightkg: 800,
          abilities: { 0: "Chilling Neigh" },
          gender: "N"
        },
        Gossifleur: {
          types: ["Grass"],
          bs: { hp: 40, at: 40, df: 60, sa: 40, sd: 60, sp: 10 },
          weightkg: 2.2,
          abilities: { 0: "Cotton Down" },
          nfe: true
        },
        Grapploct: {
          types: ["Fighting"],
          bs: { hp: 80, at: 118, df: 90, sa: 70, sd: 80, sp: 42 },
          weightkg: 39,
          abilities: { 0: "Limber" }
        },
        Greedent: {
          types: ["Normal"],
          bs: { hp: 120, at: 95, df: 95, sa: 55, sd: 75, sp: 20 },
          weightkg: 6,
          abilities: { 0: "Cheek Pouch" }
        },
        Grimmsnarl: {
          types: ["Dark", "Fairy"],
          bs: { hp: 95, at: 120, df: 65, sa: 95, sd: 75, sp: 60 },
          weightkg: 61,
          abilities: { 0: "Prankster" },
          otherFormes: ["Grimmsnarl-Gmax"]
        },
        "Grimmsnarl-Gmax": {
          types: ["Dark", "Fairy"],
          bs: { hp: 95, at: 120, df: 65, sa: 95, sd: 75, sp: 60 },
          weightkg: 0,
          abilities: { 0: "Prankster" },
          baseSpecies: "Grimmsnarl"
        },
        Grookey: {
          types: ["Grass"],
          bs: { hp: 50, at: 65, df: 50, sa: 40, sd: 40, sp: 65 },
          weightkg: 5,
          abilities: { 0: "Overgrow" },
          nfe: true
        },
        Hatenna: {
          types: ["Psychic"],
          bs: { hp: 42, at: 30, df: 45, sa: 56, sd: 53, sp: 39 },
          weightkg: 3.4,
          abilities: { 0: "Healer" },
          nfe: true
        },
        Hatterene: {
          types: ["Psychic", "Fairy"],
          bs: { hp: 57, at: 90, df: 95, sa: 136, sd: 103, sp: 29 },
          weightkg: 5.1,
          abilities: { 0: "Healer" },
          otherFormes: ["Hatterene-Gmax"]
        },
        "Hatterene-Gmax": {
          types: ["Psychic", "Fairy"],
          bs: { hp: 57, at: 90, df: 95, sa: 136, sd: 103, sp: 29 },
          weightkg: 0,
          abilities: { 0: "Healer" },
          baseSpecies: "Hatterene"
        },
        Hattrem: {
          types: ["Psychic"],
          bs: { hp: 57, at: 40, df: 65, sa: 86, sd: 73, sp: 49 },
          weightkg: 4.8,
          abilities: { 0: "Healer" },
          nfe: true
        },
        Impidimp: {
          types: ["Dark", "Fairy"],
          bs: { hp: 45, at: 45, df: 30, sa: 55, sd: 40, sp: 50 },
          weightkg: 5.5,
          abilities: { 0: "Prankster" },
          nfe: true
        },
        Indeedee: {
          types: ["Psychic", "Normal"],
          bs: { hp: 60, at: 65, df: 55, sa: 105, sd: 95, sp: 95 },
          weightkg: 28,
          abilities: { 0: "Inner Focus" },
          otherFormes: ["Indeedee-F"]
        },
        "Indeedee-F": {
          types: ["Psychic", "Normal"],
          bs: { hp: 70, at: 55, df: 65, sa: 95, sd: 105, sp: 85 },
          weightkg: 28,
          abilities: { 0: "Own Tempo" },
          baseSpecies: "Indeedee"
        },
        Inteleon: {
          types: ["Water"],
          bs: { hp: 70, at: 85, df: 65, sa: 125, sd: 65, sp: 120 },
          weightkg: 45.2,
          abilities: { 0: "Torrent" },
          otherFormes: ["Inteleon-Gmax"]
        },
        "Inteleon-Gmax": {
          types: ["Water"],
          bs: { hp: 70, at: 85, df: 65, sa: 125, sd: 65, sp: 120 },
          weightkg: 0,
          abilities: { 0: "Torrent" },
          baseSpecies: "Inteleon"
        },
        "Kingler-Gmax": {
          types: ["Water"],
          bs: { hp: 55, at: 130, df: 115, sa: 50, sd: 50, sp: 75 },
          weightkg: 0,
          abilities: { 0: "Hyper Cutter" },
          baseSpecies: "Kingler"
        },
        "Kubfu": {
          types: ["Fighting"],
          bs: { hp: 60, at: 90, df: 60, sa: 53, sd: 50, sp: 72 },
          weightkg: 12,
          nfe: true,
          abilities: { 0: "Inner Focus" }
        },
        "Lapras-Gmax": {
          types: ["Water", "Ice"],
          bs: { hp: 130, at: 85, df: 80, sa: 85, sd: 95, sp: 60 },
          weightkg: 0,
          abilities: { 0: "Water Absorb" },
          baseSpecies: "Lapras"
        },
        "Linoone-Galar": {
          types: ["Dark", "Normal"],
          bs: { hp: 78, at: 70, df: 61, sa: 50, sd: 61, sp: 100 },
          weightkg: 32.5,
          abilities: { 0: "Pickup" },
          nfe: true,
          baseSpecies: "Linoone"
        },
        Magearna: { otherFormes: ["Magearna-Original"] },
        "Magearna-Original": {
          baseSpecies: "Magearna",
          types: ["Steel", "Fairy"],
          bs: { hp: 80, at: 95, df: 115, sa: 130, sd: 115, sp: 65 },
          weightkg: 80.5,
          gender: "N",
          abilities: { 0: "Soul-Heart" }
        },
        "Machamp-Gmax": {
          types: ["Fighting"],
          bs: { hp: 90, at: 130, df: 80, sa: 65, sd: 85, sp: 55 },
          weightkg: 0,
          abilities: { 0: "Guts" },
          baseSpecies: "Machamp"
        },
        "Melmetal-Gmax": {
          types: ["Steel"],
          bs: { hp: 135, at: 143, df: 143, sa: 80, sd: 65, sp: 34 },
          weightkg: 0,
          abilities: { 0: "Iron Fist" },
          baseSpecies: "Melmetal",
          gender: "N"
        },
        "Meowth-Galar": {
          types: ["Steel"],
          bs: { hp: 50, at: 65, df: 55, sa: 40, sd: 40, sp: 40 },
          weightkg: 7.5,
          abilities: { 0: "Pickup" },
          nfe: true,
          baseSpecies: "Meowth"
        },
        "Meowth-Gmax": {
          types: ["Normal"],
          bs: { hp: 40, at: 45, df: 35, sa: 40, sd: 40, sp: 90 },
          weightkg: 0,
          abilities: { 0: "Pickup" },
          baseSpecies: "Meowth"
        },
        Miasmaw: {
          types: ["Bug", "Dragon"],
          bs: { hp: 85, at: 135, df: 60, sa: 88, sd: 105, sp: 99 },
          weightkg: 57,
          abilities: { 0: "Neutralizing Gas" }
        },
        Miasmite: {
          types: ["Bug", "Dragon"],
          bs: { hp: 40, at: 85, df: 60, sa: 52, sd: 52, sp: 44 },
          weightkg: 10.1,
          abilities: { 0: "Neutralizing Gas" },
          nfe: true
        },
        Milcery: {
          types: ["Fairy"],
          bs: { hp: 45, at: 40, df: 40, sa: 50, sd: 61, sp: 34 },
          weightkg: 0.3,
          abilities: { 0: "Sweet Veil" },
          nfe: true
        },
        "Moltres-Galar": {
          types: ["Dark", "Flying"],
          bs: { hp: 90, at: 85, df: 90, sa: 100, sd: 125, sp: 90 },
          weightkg: 66,
          abilities: { 0: "Berserk" },
          gender: "N",
          baseSpecies: "Moltres"
        },
        Morgrem: {
          types: ["Dark", "Fairy"],
          bs: { hp: 65, at: 60, df: 45, sa: 75, sd: 55, sp: 70 },
          weightkg: 12.5,
          abilities: { 0: "Prankster" },
          nfe: true
        },
        Morpeko: {
          types: ["Electric", "Dark"],
          bs: { hp: 58, at: 95, df: 58, sa: 70, sd: 58, sp: 97 },
          weightkg: 3,
          abilities: { 0: "Hunger Switch" },
          otherFormes: ["Morpeko-Hangry"]
        },
        "Morpeko-Hangry": {
          types: ["Electric", "Dark"],
          bs: { hp: 58, at: 95, df: 58, sa: 70, sd: 58, sp: 97 },
          weightkg: 3,
          abilities: { 0: "Hunger Switch" },
          baseSpecies: "Morpeko"
        },
        "Mr. Mime-Galar": {
          types: ["Ice", "Psychic"],
          bs: { hp: 50, at: 65, df: 65, sa: 90, sd: 90, sp: 100 },
          weightkg: 56.8,
          abilities: { 0: "Vital Spirit" },
          nfe: true,
          baseSpecies: "Mr. Mime"
        },
        "Mr. Rime": {
          types: ["Ice", "Psychic"],
          bs: { hp: 80, at: 85, df: 75, sa: 110, sd: 100, sp: 70 },
          weightkg: 58.2,
          abilities: { 0: "Tangled Feet" }
        },
        Nickit: {
          types: ["Dark"],
          bs: { hp: 40, at: 28, df: 28, sa: 47, sd: 52, sp: 50 },
          weightkg: 8.9,
          abilities: { 0: "Run Away" },
          nfe: true
        },
        Obstagoon: {
          types: ["Dark", "Normal"],
          bs: { hp: 93, at: 90, df: 101, sa: 60, sd: 81, sp: 95 },
          weightkg: 46,
          abilities: { 0: "Reckless" }
        },
        Orbeetle: {
          types: ["Bug", "Psychic"],
          bs: { hp: 60, at: 45, df: 110, sa: 80, sd: 120, sp: 90 },
          weightkg: 40.8,
          abilities: { 0: "Swarm" },
          otherFormes: ["Orbeetle-Gmax"]
        },
        "Orbeetle-Gmax": {
          types: ["Bug", "Psychic"],
          bs: { hp: 60, at: 45, df: 110, sa: 80, sd: 120, sp: 90 },
          weightkg: 0,
          abilities: { 0: "Swarm" },
          baseSpecies: "Orbeetle"
        },
        Perrserker: {
          types: ["Steel"],
          bs: { hp: 70, at: 110, df: 100, sa: 50, sd: 60, sp: 50 },
          weightkg: 28,
          abilities: { 0: "Battle Armor" }
        },
        "Pikachu-Gmax": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 0,
          abilities: { 0: "Static" },
          baseSpecies: "Pikachu"
        },
        "Pikachu-World": {
          types: ["Electric"],
          bs: { hp: 35, at: 55, df: 40, sa: 50, sd: 50, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Static" },
          baseSpecies: "Pikachu"
        },
        Pincurchin: {
          types: ["Electric"],
          bs: { hp: 48, at: 101, df: 95, sa: 91, sd: 85, sp: 15 },
          weightkg: 1,
          abilities: { 0: "Lightning Rod" }
        },
        Polteageist: {
          types: ["Ghost"],
          bs: { hp: 60, at: 65, df: 65, sa: 134, sd: 114, sp: 70 },
          weightkg: 0.4,
          abilities: { 0: "Weak Armor" },
          otherFormes: ["Polteageist-Antique"],
          gender: "N"
        },
        "Polteageist-Antique": {
          types: ["Ghost"],
          bs: { hp: 60, at: 65, df: 65, sa: 134, sd: 114, sp: 70 },
          weightkg: 0.4,
          abilities: { 0: "Weak Armor" },
          baseSpecies: "Polteageist",
          gender: "N"
        },
        "Ponyta-Galar": {
          types: ["Psychic"],
          bs: { hp: 50, at: 85, df: 55, sa: 65, sd: 65, sp: 90 },
          weightkg: 24,
          abilities: { 0: "Run Away" },
          nfe: true,
          baseSpecies: "Ponyta"
        },
        Raboot: {
          types: ["Fire"],
          bs: { hp: 65, at: 86, df: 60, sa: 55, sd: 60, sp: 94 },
          weightkg: 9,
          abilities: { 0: "Blaze" },
          nfe: true
        },
        "Rapidash-Galar": {
          types: ["Psychic", "Fairy"],
          bs: { hp: 65, at: 100, df: 70, sa: 80, sd: 80, sp: 105 },
          weightkg: 80,
          abilities: { 0: "Run Away" },
          baseSpecies: "Rapidash"
        },
        Regidrago: {
          types: ["Dragon"],
          bs: { hp: 200, at: 100, df: 50, sa: 100, sd: 50, sp: 80 },
          weightkg: 200,
          abilities: { 0: "Dragon's Maw" },
          gender: "N"
        },
        Regieleki: {
          types: ["Electric"],
          bs: { hp: 80, at: 100, df: 50, sa: 100, sd: 50, sp: 200 },
          weightkg: 145,
          abilities: { 0: "Transistor" },
          gender: "N"
        },
        Rillaboom: {
          types: ["Grass"],
          bs: { hp: 100, at: 125, df: 90, sa: 60, sd: 70, sp: 85 },
          weightkg: 90,
          abilities: { 0: "Overgrow" },
          otherFormes: ["Rillaboom-Gmax"]
        },
        "Rillaboom-Gmax": {
          types: ["Grass"],
          bs: { hp: 100, at: 125, df: 90, sa: 60, sd: 70, sp: 85 },
          weightkg: 0,
          abilities: { 0: "Overgrow" },
          baseSpecies: "Rillaboom"
        },
        Rolycoly: {
          types: ["Rock"],
          bs: { hp: 30, at: 40, df: 50, sa: 40, sd: 50, sp: 30 },
          weightkg: 12,
          abilities: { 0: "Steam Engine" },
          nfe: true
        },
        Rookidee: {
          types: ["Flying"],
          bs: { hp: 38, at: 47, df: 35, sa: 33, sd: 35, sp: 57 },
          weightkg: 1.8,
          abilities: { 0: "Keen Eye" },
          nfe: true
        },
        Runerigus: {
          types: ["Ground", "Ghost"],
          bs: { hp: 58, at: 95, df: 145, sa: 50, sd: 105, sp: 30 },
          weightkg: 66.6,
          abilities: { 0: "Wandering Spirit" }
        },
        Saharaja: {
          types: ["Ground"],
          bs: { hp: 70, at: 112, df: 105, sa: 65, sd: 123, sp: 78 },
          weightkg: 303.9,
          abilities: { 0: "Water Absorb" }
        },
        Saharascal: {
          types: ["Ground"],
          bs: { hp: 50, at: 80, df: 65, sa: 45, sd: 90, sp: 70 },
          weightkg: 48,
          abilities: { 0: "Water Absorb" },
          nfe: true
        },
        Sandaconda: {
          types: ["Ground"],
          bs: { hp: 72, at: 107, df: 125, sa: 65, sd: 70, sp: 71 },
          weightkg: 65.5,
          abilities: { 0: "Sand Spit" },
          otherFormes: ["Sandaconda-Gmax"]
        },
        "Sandaconda-Gmax": {
          types: ["Ground"],
          bs: { hp: 72, at: 107, df: 125, sa: 65, sd: 70, sp: 71 },
          weightkg: 0,
          abilities: { 0: "Sand Spit" },
          baseSpecies: "Sandaconda"
        },
        Scorbunny: {
          types: ["Fire"],
          bs: { hp: 50, at: 71, df: 40, sa: 40, sd: 40, sp: 69 },
          weightkg: 4.5,
          abilities: { 0: "Blaze" },
          nfe: true
        },
        Silicobra: {
          types: ["Ground"],
          bs: { hp: 52, at: 57, df: 75, sa: 35, sd: 50, sp: 46 },
          weightkg: 7.6,
          abilities: { 0: "Sand Spit" },
          nfe: true
        },
        Sinistea: {
          types: ["Ghost"],
          bs: { hp: 40, at: 45, df: 45, sa: 74, sd: 54, sp: 50 },
          weightkg: 0.2,
          abilities: { 0: "Weak Armor" },
          nfe: true,
          otherFormes: ["Sinistea-Antique"],
          gender: "N"
        },
        "Sinistea-Antique": {
          types: ["Ghost"],
          bs: { hp: 40, at: 45, df: 45, sa: 74, sd: 54, sp: 50 },
          weightkg: 0.2,
          abilities: { 0: "Weak Armor" },
          nfe: true,
          baseSpecies: "Sinistea",
          gender: "N"
        },
        "Sirfetch\u2019d": {
          types: ["Fighting"],
          bs: { hp: 62, at: 135, df: 95, sa: 68, sd: 82, sp: 65 },
          weightkg: 117,
          abilities: { 0: "Steadfast" }
        },
        Sizzlipede: {
          types: ["Fire", "Bug"],
          bs: { hp: 50, at: 65, df: 45, sa: 50, sd: 50, sp: 45 },
          weightkg: 1,
          abilities: { 0: "Flash Fire" },
          nfe: true
        },
        Skwovet: {
          types: ["Normal"],
          bs: { hp: 70, at: 55, df: 55, sa: 35, sd: 35, sp: 25 },
          weightkg: 2.5,
          abilities: { 0: "Cheek Pouch" },
          nfe: true
        },
        "Slowbro-Galar": {
          types: ["Poison", "Psychic"],
          bs: { hp: 95, at: 100, df: 95, sa: 100, sd: 70, sp: 30 },
          weightkg: 70.5,
          abilities: { 0: "Quick Draw" },
          baseSpecies: "Slowbro"
        },
        "Slowking-Galar": {
          types: ["Poison", "Psychic"],
          bs: { hp: 95, at: 65, df: 80, sa: 110, sd: 110, sp: 30 },
          weightkg: 79.5,
          abilities: { 0: "Curious Medicine" },
          baseSpecies: "Slowking"
        },
        "Slowpoke-Galar": {
          types: ["Psychic"],
          bs: { hp: 90, at: 65, df: 65, sa: 40, sd: 40, sp: 15 },
          weightkg: 36,
          nfe: true,
          abilities: { 0: "Gluttony" },
          baseSpecies: "Slowpoke"
        },
        Solotl: {
          types: ["Fire", "Dragon"],
          bs: { hp: 68, at: 48, df: 34, sa: 72, sd: 24, sp: 84 },
          weightkg: 11.8,
          nfe: true,
          abilities: { 0: "Regenerator" }
        },
        Snom: {
          types: ["Ice", "Bug"],
          bs: { hp: 30, at: 25, df: 35, sa: 45, sd: 30, sp: 20 },
          weightkg: 3.8,
          abilities: { 0: "Shield Dust" },
          nfe: true
        },
        "Snorlax-Gmax": {
          types: ["Normal"],
          bs: { hp: 160, at: 110, df: 65, sa: 65, sd: 110, sp: 30 },
          weightkg: 0,
          abilities: { 0: "Immunity" },
          baseSpecies: "Snorlax"
        },
        Sobble: {
          types: ["Water"],
          bs: { hp: 50, at: 40, df: 40, sa: 70, sd: 40, sp: 70 },
          weightkg: 4,
          abilities: { 0: "Torrent" },
          nfe: true
        },
        Spectrier: {
          types: ["Ghost"],
          bs: { hp: 100, at: 65, df: 60, sa: 145, sd: 80, sp: 130 },
          weightkg: 44.5,
          abilities: { 0: "Grim Neigh" },
          gender: "N"
        },
        Stonjourner: {
          types: ["Rock"],
          bs: { hp: 100, at: 125, df: 135, sa: 20, sd: 20, sp: 70 },
          weightkg: 520,
          abilities: { 0: "Power Spot" }
        },
        "Stunfisk-Galar": {
          types: ["Ground", "Steel"],
          bs: { hp: 109, at: 81, df: 99, sa: 66, sd: 84, sp: 32 },
          weightkg: 20.5,
          abilities: { 0: "Mimicry" },
          baseSpecies: "Stunfisk"
        },
        Thievul: {
          types: ["Dark"],
          bs: { hp: 70, at: 58, df: 58, sa: 87, sd: 92, sp: 90 },
          weightkg: 19.9,
          abilities: { 0: "Run Away" }
        },
        Thwackey: {
          types: ["Grass"],
          bs: { hp: 70, at: 85, df: 70, sa: 55, sd: 60, sp: 80 },
          weightkg: 14,
          abilities: { 0: "Overgrow" },
          nfe: true
        },
        Toxel: {
          types: ["Electric", "Poison"],
          bs: { hp: 40, at: 38, df: 35, sa: 54, sd: 35, sp: 40 },
          weightkg: 11,
          abilities: { 0: "Rattled" },
          nfe: true
        },
        Toxtricity: {
          types: ["Electric", "Poison"],
          bs: { hp: 75, at: 98, df: 70, sa: 114, sd: 70, sp: 75 },
          weightkg: 40,
          abilities: { 0: "Punk Rock" },
          otherFormes: ["Toxtricity-Gmax", "Toxtricity-Low-Key", "Toxtricity-Low-Key-Gmax"]
        },
        "Toxtricity-Gmax": {
          types: ["Electric", "Poison"],
          bs: { hp: 75, at: 98, df: 70, sa: 114, sd: 70, sp: 75 },
          weightkg: 0,
          abilities: { 0: "Punk Rock" },
          baseSpecies: "Toxtricity"
        },
        "Toxtricity-Low-Key": {
          types: ["Electric", "Poison"],
          bs: { hp: 75, at: 98, df: 70, sa: 114, sd: 70, sp: 75 },
          weightkg: 40,
          abilities: { 0: "Punk Rock" },
          baseSpecies: "Toxtricity"
        },
        "Toxtricity-Low-Key-Gmax": {
          types: ["Electric", "Poison"],
          bs: { hp: 75, at: 98, df: 70, sa: 114, sd: 70, sp: 75 },
          weightkg: 0,
          abilities: { 0: "Punk Rock" },
          baseSpecies: "Toxtricity"
        },
        Urshifu: {
          types: ["Fighting", "Dark"],
          bs: { hp: 100, at: 130, df: 100, sa: 63, sd: 60, sp: 97 },
          weightkg: 105,
          abilities: { 0: "Unseen Fist" },
          otherFormes: ["Urshifu-Gmax", "Urshifu-Rapid-Strike", "Urshifu-Rapid-Strike-Gmax"]
        },
        "Urshifu-Rapid-Strike": {
          types: ["Fighting", "Water"],
          bs: { hp: 100, at: 130, df: 100, sa: 63, sd: 60, sp: 97 },
          weightkg: 105,
          abilities: { 0: "Unseen Fist" },
          baseSpecies: "Urshifu"
        },
        "Urshifu-Rapid-Strike-Gmax": {
          types: ["Fighting", "Water"],
          bs: { hp: 100, at: 130, df: 100, sa: 63, sd: 60, sp: 97 },
          weightkg: 0,
          abilities: { 0: "Unseen Fist" },
          baseSpecies: "Urshifu"
        },
        "Urshifu-Gmax": {
          types: ["Fighting", "Dark"],
          bs: { hp: 100, at: 130, df: 100, sa: 63, sd: 60, sp: 97 },
          weightkg: 0,
          abilities: { 0: "Unseen Fist" },
          baseSpecies: "Urshifu"
        },
        Venomicon: {
          types: ["Poison", "Flying"],
          bs: { hp: 85, at: 50, df: 113, sa: 118, sd: 90, sp: 64 },
          weightkg: 11.5,
          abilities: { 0: "Stamina" },
          otherFormes: ["Venomicon-Epilogue"],
          gender: "N"
        },
        "Venomicon-Epilogue": {
          types: ["Poison", "Flying"],
          bs: { hp: 85, at: 102, df: 85, sa: 62, sd: 85, sp: 101 },
          weightkg: 12.4,
          abilities: { 0: "Tinted Lens" },
          baseSpecies: "Venomicon",
          gender: "N"
        },
        "Venusaur-Gmax": {
          types: ["Grass", "Poison"],
          bs: { hp: 80, at: 82, df: 83, sa: 100, sd: 100, sp: 80 },
          weightkg: 0,
          abilities: { 0: "Overgrow" },
          baseSpecies: "Venusaur"
        },
        "Weezing-Galar": {
          types: ["Poison", "Fairy"],
          bs: { hp: 65, at: 90, df: 120, sa: 85, sd: 70, sp: 60 },
          weightkg: 16,
          abilities: { 0: "Levitate" },
          baseSpecies: "Weezing"
        },
        Wooloo: {
          types: ["Normal"],
          bs: { hp: 42, at: 40, df: 55, sa: 40, sd: 45, sp: 48 },
          weightkg: 6,
          abilities: { 0: "Fluffy" },
          nfe: true
        },
        "Yamask-Galar": {
          types: ["Ground", "Ghost"],
          bs: { hp: 38, at: 55, df: 85, sa: 30, sd: 65, sp: 30 },
          weightkg: 1.5,
          abilities: { 0: "Wandering Spirit" },
          nfe: true,
          baseSpecies: "Yamask"
        },
        Yamper: {
          types: ["Electric"],
          bs: { hp: 59, at: 45, df: 50, sa: 40, sd: 50, sp: 26 },
          weightkg: 13.5,
          abilities: { 0: "Ball Fetch" },
          nfe: true
        },
        Zacian: {
          types: ["Fairy"],
          bs: { hp: 92, at: 130, df: 115, sa: 80, sd: 115, sp: 138 },
          weightkg: 110,
          abilities: { 0: "Intrepid Sword" },
          gender: "N",
          otherFormes: ["Zacian-Crowned"]
        },
        "Zacian-Crowned": {
          types: ["Fairy", "Steel"],
          bs: { hp: 92, at: 170, df: 115, sa: 80, sd: 115, sp: 148 },
          weightkg: 355,
          abilities: { 0: "Intrepid Sword" },
          baseSpecies: "Zacian",
          gender: "N"
        },
        Zamazenta: {
          types: ["Fighting"],
          bs: { hp: 92, at: 130, df: 115, sa: 80, sd: 115, sp: 138 },
          weightkg: 210,
          abilities: { 0: "Dauntless Shield" },
          gender: "N",
          otherFormes: ["Zamazenta-Crowned"]
        },
        "Zamazenta-Crowned": {
          types: ["Fighting", "Steel"],
          bs: { hp: 92, at: 130, df: 145, sa: 80, sd: 145, sp: 128 },
          weightkg: 785,
          abilities: { 0: "Dauntless Shield" },
          baseSpecies: "Zamazenta",
          gender: "N"
        },
        "Zapdos-Galar": {
          types: ["Fighting", "Flying"],
          bs: { hp: 90, at: 125, df: 90, sa: 85, sd: 90, sp: 100 },
          weightkg: 58.2,
          abilities: { 0: "Defiant" },
          gender: "N",
          baseSpecies: "Zapdos"
        },
        Zarude: {
          types: ["Dark", "Grass"],
          bs: { hp: 105, at: 120, df: 105, sa: 70, sd: 95, sp: 105 },
          weightkg: 70,
          abilities: { 0: "Leaf Guard" },
          gender: "N",
          otherFormes: ["Zarude-Dada"]
        },
        "Zarude-Dada": {
          types: ["Dark", "Grass"],
          bs: { hp: 105, at: 120, df: 105, sa: 70, sd: 95, sp: 105 },
          weightkg: 70,
          abilities: { 0: "Leaf Guard" },
          baseSpecies: "Zarude",
          gender: "N"
        },
        "Zigzagoon-Galar": {
          types: ["Dark", "Normal"],
          bs: { hp: 38, at: 30, df: 41, sa: 30, sd: 41, sp: 60 },
          weightkg: 17.5,
          abilities: { 0: "Pickup" },
          nfe: true,
          baseSpecies: "Zigzagoon"
        }
      };
      var SS = (0, util_1.extend)(true, {}, SM, SS_PATCH);
      delete SS["Pikachu-Starter"];
      delete SS["Eevee-Starter"];
      var PLA_PATCH = {
        Arcanine: { otherFormes: ["Arcanine-Hisui"] },
        Avalugg: { otherFormes: ["Avalugg-Hisui"] },
        Basculin: { otherFormes: ["Basculin-Blue-Striped", "Basculin-White-Striped"] },
        Braviary: { otherFormes: ["Braviary-Hisui"] },
        Decidueye: { otherFormes: ["Decidueye-Hisui"] },
        Dialga: { otherFormes: ["Dialga-Origin"] },
        Electrode: { otherFormes: ["Electrode-Hisui"] },
        Goodra: { otherFormes: ["Goodra-Hisui"] },
        Growlithe: { otherFormes: ["Growlithe-Hisui"] },
        Lilligant: { otherFormes: ["Lilligant-Hisui"] },
        Palkia: { otherFormes: ["Palkia-Origin"] },
        Qwilfish: { otherFormes: ["Qwilfish-Hisui"] },
        Samurott: { otherFormes: ["Samurott-Hisui"] },
        Sliggoo: { otherFormes: ["Sliggoo-Hisui"] },
        Sneasel: { otherFormes: ["Sneasel-Hisui"] },
        Stantler: { nfe: true },
        Typhlosion: { otherFormes: ["Typhlosion-Hisui"] },
        Ursaring: { nfe: true },
        Voltorb: { otherFormes: ["Voltorb-Hisui"] },
        Zoroark: { otherFormes: ["Zoroark-Hisui"] },
        Zorua: { otherFormes: ["Zorua-Hisui"] },
        "Arcanine-Hisui": {
          types: ["Fire", "Rock"],
          bs: { hp: 95, at: 115, df: 80, sa: 95, sd: 80, sp: 90 },
          weightkg: 168,
          abilities: { 0: "Intimidate" },
          baseSpecies: "Arcanine"
        },
        "Avalugg-Hisui": {
          types: ["Ice", "Rock"],
          bs: { hp: 95, at: 127, df: 184, sa: 34, sd: 36, sp: 38 },
          weightkg: 262.4,
          abilities: { 0: "Strong Jaw" },
          baseSpecies: "Avalugg"
        },
        Basculegion: {
          types: ["Water", "Ghost"],
          bs: { hp: 120, at: 112, df: 65, sa: 80, sd: 75, sp: 78 },
          weightkg: 110,
          abilities: { 0: "Swift Swim" },
          otherFormes: ["Basculegion-F"]
        },
        "Basculegion-F": {
          types: ["Water", "Ghost"],
          bs: { hp: 120, at: 92, df: 65, sa: 100, sd: 75, sp: 78 },
          weightkg: 110,
          abilities: { 0: "Swift Swim" },
          baseSpecies: "Basculegion"
        },
        "Basculin-White-Striped": {
          types: ["Water"],
          bs: { hp: 70, at: 92, df: 65, sa: 80, sd: 55, sp: 98 },
          weightkg: 18,
          abilities: { 0: "Rattled" },
          baseSpecies: "Basculin",
          nfe: true
        },
        "Braviary-Hisui": {
          types: ["Psychic", "Flying"],
          bs: { hp: 110, at: 83, df: 70, sa: 112, sd: 70, sp: 65 },
          weightkg: 43.4,
          abilities: { 0: "Keen Eye" },
          baseSpecies: "Braviary"
        },
        "Decidueye-Hisui": {
          types: ["Grass", "Fighting"],
          bs: { hp: 88, at: 112, df: 80, sa: 95, sd: 95, sp: 60 },
          weightkg: 37,
          abilities: { 0: "Overgrow" },
          baseSpecies: "Decidueye"
        },
        "Dialga-Origin": {
          types: ["Steel", "Dragon"],
          bs: { hp: 100, at: 100, df: 120, sa: 150, sd: 120, sp: 90 },
          weightkg: 850,
          gender: "N",
          abilities: { 0: "Pressure" },
          baseSpecies: "Dialga"
        },
        "Electrode-Hisui": {
          types: ["Electric", "Grass"],
          bs: { hp: 60, at: 50, df: 70, sa: 80, sd: 80, sp: 150 },
          weightkg: 71,
          gender: "N",
          abilities: { 0: "Soundproof" },
          baseSpecies: "Electrode"
        },
        Enamorus: {
          types: ["Fairy", "Flying"],
          bs: { hp: 74, at: 115, df: 70, sa: 135, sd: 80, sp: 106 },
          weightkg: 48,
          abilities: { 0: "Cute Charm" },
          otherFormes: ["Enamorus-Therian"]
        },
        "Enamorus-Therian": {
          types: ["Fairy", "Flying"],
          bs: { hp: 74, at: 115, df: 110, sa: 135, sd: 100, sp: 46 },
          weightkg: 48,
          abilities: { 0: "Overcoat" },
          baseSpecies: "Enamorus"
        },
        "Goodra-Hisui": {
          types: ["Steel", "Dragon"],
          bs: { hp: 80, at: 100, df: 100, sa: 110, sd: 150, sp: 60 },
          weightkg: 334.1,
          abilities: { 0: "Sap Sipper" },
          baseSpecies: "Goodra"
        },
        "Growlithe-Hisui": {
          types: ["Fire", "Rock"],
          bs: { hp: 60, at: 75, df: 45, sa: 65, sd: 50, sp: 55 },
          weightkg: 22.7,
          abilities: { 0: "Intimidate" },
          baseSpecies: "Growlithe",
          nfe: true
        },
        Kleavor: {
          types: ["Bug", "Rock"],
          bs: { hp: 70, at: 135, df: 95, sa: 45, sd: 70, sp: 85 },
          weightkg: 89,
          abilities: { 0: "Swarm" }
        },
        "Lilligant-Hisui": {
          types: ["Grass", "Fighting"],
          bs: { hp: 70, at: 105, df: 75, sa: 50, sd: 75, sp: 105 },
          weightkg: 19.2,
          abilities: { 0: "Chlorophyll" },
          baseSpecies: "Lilligant"
        },
        Overqwil: {
          types: ["Dark", "Poison"],
          bs: { hp: 85, at: 115, df: 95, sa: 65, sd: 65, sp: 85 },
          weightkg: 60.5,
          abilities: { 0: "Poison Point" }
        },
        "Palkia-Origin": {
          types: ["Water", "Dragon"],
          bs: { hp: 90, at: 100, df: 100, sa: 150, sd: 120, sp: 120 },
          weightkg: 660,
          gender: "N",
          abilities: { 0: "Pressure" },
          baseSpecies: "Palkia"
        },
        "Qwilfish-Hisui": {
          types: ["Dark", "Poison"],
          bs: { hp: 65, at: 95, df: 85, sa: 55, sd: 55, sp: 85 },
          weightkg: 3.9,
          abilities: { 0: "Poison Point" },
          baseSpecies: "Qwilfish",
          nfe: true
        },
        "Samurott-Hisui": {
          types: ["Water", "Dark"],
          bs: { hp: 90, at: 108, df: 80, sa: 100, sd: 65, sp: 85 },
          weightkg: 58.2,
          abilities: { 0: "Torrent" },
          baseSpecies: "Samurott"
        },
        "Sliggoo-Hisui": {
          types: ["Steel", "Dragon"],
          bs: { hp: 58, at: 75, df: 83, sa: 83, sd: 113, sp: 40 },
          weightkg: 68.5,
          abilities: { 0: "Sap Sipper" },
          baseSpecies: "Sliggoo",
          nfe: true
        },
        "Sneasel-Hisui": {
          types: ["Fighting", "Poison"],
          bs: { hp: 55, at: 95, df: 55, sa: 35, sd: 75, sp: 115 },
          weightkg: 27,
          abilities: { 0: "Inner Focus" },
          baseSpecies: "Sneasel",
          nfe: true
        },
        Sneasler: {
          types: ["Fighting", "Poison"],
          bs: { hp: 80, at: 130, df: 60, sa: 40, sd: 80, sp: 120 },
          weightkg: 43,
          abilities: { 0: "Pressure" }
        },
        "Typhlosion-Hisui": {
          types: ["Fire", "Ghost"],
          bs: { hp: 73, at: 84, df: 78, sa: 119, sd: 85, sp: 95 },
          weightkg: 69.8,
          abilities: { 0: "Blaze" },
          baseSpecies: "Typhlosion"
        },
        Ursaluna: {
          types: ["Ground", "Normal"],
          bs: { hp: 130, at: 140, df: 105, sa: 45, sd: 80, sp: 50 },
          weightkg: 290,
          abilities: { 0: "Guts" }
        },
        "Voltorb-Hisui": {
          types: ["Electric", "Grass"],
          bs: { hp: 40, at: 30, df: 50, sa: 55, sd: 55, sp: 100 },
          weightkg: 13,
          gender: "N",
          abilities: { 0: "Soundproof" },
          baseSpecies: "Voltorb",
          nfe: true
        },
        Wyrdeer: {
          types: ["Normal", "Psychic"],
          bs: { hp: 103, at: 105, df: 72, sa: 105, sd: 75, sp: 65 },
          weightkg: 95.1,
          abilities: { 0: "Intimidate" }
        },
        "Zoroark-Hisui": {
          types: ["Normal", "Ghost"],
          bs: { hp: 55, at: 100, df: 60, sa: 125, sd: 60, sp: 110 },
          weightkg: 73,
          abilities: { 0: "Illusion" },
          baseSpecies: "Zoroark"
        },
        "Zorua-Hisui": {
          types: ["Normal", "Ghost"],
          bs: { hp: 35, at: 60, df: 40, sa: 85, sd: 40, sp: 70 },
          weightkg: 12.5,
          abilities: { 0: "Illusion" },
          baseSpecies: "Zorua",
          nfe: true
        }
      };
      var SV_PATCH = {
        Bisharp: { nfe: true },
        Cresselia: { bs: { df: 110, sd: 120 } },
        Dunsparce: { nfe: true },
        Duraludon: { nfe: true },
        Girafarig: { nfe: true },
        Kitsunoh: { bs: { at: 103, sp: 120 } },
        Primeape: { nfe: true },
        Tauros: { otherFormes: ["Tauros-Paldea-Aqua", "Tauros-Paldea-Blaze", "Tauros-Paldea-Combat"] },
        Wooper: { otherFormes: ["Wooper-Paldea"] },
        Zacian: { bs: { at: 120 } },
        "Zacian-Crowned": { bs: { at: 150 } },
        Zamazenta: { bs: { at: 120 } },
        "Zamazenta-Crowned": { bs: { at: 120, df: 140, sd: 140 } },
        Ababo: {
          types: ["Fairy"],
          bs: { hp: 42, at: 35, df: 27, sa: 35, sd: 35, sp: 38 },
          weightkg: 3.5,
          abilities: { 0: "Pixilate" },
          nfe: true
        },
        Annihilape: {
          types: ["Fighting", "Ghost"],
          bs: { hp: 110, at: 115, df: 80, sa: 50, sd: 90, sp: 90 },
          weightkg: 56,
          abilities: { 0: "Vital Spirit" }
        },
        Arboliva: {
          types: ["Grass", "Normal"],
          bs: { hp: 78, at: 69, df: 90, sa: 125, sd: 109, sp: 39 },
          weightkg: 48.2,
          abilities: { 0: "Seed Sower" }
        },
        Archaludon: {
          types: ["Steel", "Dragon"],
          bs: { hp: 90, at: 105, df: 130, sa: 125, sd: 65, sp: 85 },
          weightkg: 60,
          abilities: { 0: "Stamina" }
        },
        Arctibax: {
          types: ["Dragon", "Ice"],
          bs: { hp: 90, at: 95, df: 66, sa: 45, sd: 65, sp: 62 },
          weightkg: 30,
          abilities: { 0: "Thermal Exchange" },
          nfe: true
        },
        Armarouge: {
          types: ["Fire", "Psychic"],
          bs: { hp: 85, at: 60, df: 100, sa: 125, sd: 80, sp: 75 },
          weightkg: 85,
          abilities: { 0: "Flash Fire" }
        },
        Baxcalibur: {
          types: ["Dragon", "Ice"],
          bs: { hp: 115, at: 145, df: 92, sa: 75, sd: 86, sp: 87 },
          weightkg: 210,
          abilities: { 0: "Thermal Exchange" }
        },
        Bellibolt: {
          types: ["Electric"],
          bs: { hp: 109, at: 64, df: 91, sa: 103, sd: 83, sp: 45 },
          weightkg: 113,
          abilities: { 0: "Electromorphosis" }
        },
        Bombirdier: {
          types: ["Flying", "Dark"],
          bs: { hp: 70, at: 103, df: 85, sa: 60, sd: 85, sp: 82 },
          weightkg: 42.9,
          abilities: { 0: "Big Pecks" }
        },
        Brambleghast: {
          types: ["Grass", "Ghost"],
          bs: { hp: 55, at: 115, df: 70, sa: 80, sd: 70, sp: 90 },
          weightkg: 6,
          abilities: { 0: "Wind Rider" }
        },
        Bramblin: {
          types: ["Grass", "Ghost"],
          bs: { hp: 40, at: 65, df: 30, sa: 45, sd: 35, sp: 60 },
          weightkg: 0.6,
          abilities: { 0: "Wind Rider" },
          nfe: true
        },
        "Brute Bonnet": {
          types: ["Grass", "Dark"],
          bs: { hp: 111, at: 127, df: 99, sa: 79, sd: 99, sp: 55 },
          weightkg: 21,
          gender: "N",
          abilities: { 0: "Protosynthesis" }
        },
        Capsakid: {
          types: ["Grass"],
          bs: { hp: 50, at: 62, df: 40, sa: 62, sd: 40, sp: 50 },
          weightkg: 3,
          abilities: { 0: "Chlorophyll" },
          nfe: true
        },
        Ceruledge: {
          types: ["Fire", "Ghost"],
          bs: { hp: 75, at: 125, df: 80, sa: 60, sd: 100, sp: 85 },
          weightkg: 62,
          abilities: { 0: "Flash Fire" }
        },
        Cetitan: {
          types: ["Ice"],
          bs: { hp: 170, at: 113, df: 65, sa: 45, sd: 55, sp: 73 },
          weightkg: 700,
          abilities: { 0: "Thick Fat" }
        },
        Cetoddle: {
          types: ["Ice"],
          bs: { hp: 108, at: 68, df: 45, sa: 30, sd: 40, sp: 43 },
          weightkg: 45,
          abilities: { 0: "Thick Fat" },
          nfe: true
        },
        Charcadet: {
          types: ["Fire"],
          bs: { hp: 40, at: 50, df: 40, sa: 50, sd: 40, sp: 35 },
          weightkg: 10.5,
          abilities: { 0: "Flash Fire" },
          nfe: true
        },
        "Chi-Yu": {
          types: ["Dark", "Fire"],
          bs: { hp: 55, at: 80, df: 80, sa: 135, sd: 120, sp: 100 },
          weightkg: 4.9,
          gender: "N",
          abilities: { 0: "Beads of Ruin" }
        },
        "Chien-Pao": {
          types: ["Dark", "Ice"],
          bs: { hp: 80, at: 120, df: 80, sa: 90, sd: 65, sp: 135 },
          weightkg: 152.2,
          gender: "N",
          abilities: { 0: "Sword of Ruin" }
        },
        Chuggon: {
          types: ["Dragon", "Poison"],
          bs: { hp: 30, at: 23, df: 77, sa: 55, sd: 65, sp: 30 },
          weightkg: 50,
          abilities: { 0: "Shell Armor" },
          nfe: true
        },
        Chuggalong: {
          types: ["Dragon", "Poison"],
          bs: { hp: 45, at: 43, df: 117, sa: 120, sd: 110, sp: 108 },
          weightkg: 201.6,
          abilities: { 0: "Armor Tail" }
        },
        Clodsire: {
          types: ["Poison", "Ground"],
          bs: { hp: 130, at: 75, df: 60, sa: 45, sd: 100, sp: 20 },
          weightkg: 223,
          abilities: { 0: "Poison Point" }
        },
        Cresceidon: {
          types: ["Water", "Fairy"],
          bs: { hp: 80, at: 32, df: 111, sa: 88, sd: 99, sp: 124 },
          weightkg: 999.9,
          abilities: { 0: "Multiscale" }
        },
        Crocalor: {
          types: ["Fire"],
          bs: { hp: 81, at: 55, df: 78, sa: 90, sd: 58, sp: 49 },
          weightkg: 30.7,
          abilities: { 0: "Blaze" },
          nfe: true
        },
        Cyclizar: {
          types: ["Dragon", "Normal"],
          bs: { hp: 70, at: 95, df: 65, sa: 85, sd: 65, sp: 121 },
          weightkg: 63,
          abilities: { 0: "Shed Skin" }
        },
        Dachsbun: {
          types: ["Fairy"],
          bs: { hp: 57, at: 80, df: 115, sa: 50, sd: 80, sp: 95 },
          weightkg: 14.9,
          abilities: { 0: "Well-Baked Body" }
        },
        Dipplin: {
          types: ["Grass", "Dragon"],
          bs: { hp: 80, at: 80, df: 110, sa: 95, sd: 80, sp: 40 },
          weightkg: 4.4,
          abilities: { 0: "Supersweet Syrup" },
          nfe: true
        },
        Dolliv: {
          types: ["Grass", "Normal"],
          bs: { hp: 52, at: 53, df: 60, sa: 78, sd: 78, sp: 33 },
          weightkg: 11.9,
          abilities: { 0: "Early Bird" },
          nfe: true
        },
        Dondozo: {
          types: ["Water"],
          bs: { hp: 150, at: 100, df: 115, sa: 65, sd: 65, sp: 35 },
          weightkg: 220,
          abilities: { 0: "Unaware" }
        },
        Draggalong: {
          types: ["Dragon", "Poison"],
          bs: { hp: 40, at: 33, df: 92, sa: 95, sd: 80, sp: 85 },
          weightkg: 110,
          abilities: { 0: "Armor Tail" },
          nfe: true
        },
        Dudunsparce: {
          types: ["Normal"],
          bs: { hp: 125, at: 100, df: 80, sa: 85, sd: 75, sp: 55 },
          weightkg: 39.2,
          abilities: { 0: "Serene Grace" },
          otherFormes: ["Dudunsparce-Three-Segment"]
        },
        "Dudunsparce-Three-Segment": {
          types: ["Normal"],
          bs: { hp: 125, at: 100, df: 80, sa: 85, sd: 75, sp: 55 },
          weightkg: 47.4,
          abilities: { 0: "Serene Grace" },
          baseSpecies: "Dudunsparce"
        },
        Espathra: {
          types: ["Psychic"],
          bs: { hp: 95, at: 60, df: 60, sa: 101, sd: 60, sp: 105 },
          weightkg: 90,
          abilities: { 0: "Opportunist" }
        },
        Farigiraf: {
          types: ["Normal", "Psychic"],
          bs: { hp: 120, at: 90, df: 70, sa: 110, sd: 70, sp: 60 },
          weightkg: 160,
          abilities: { 0: "Cud Chew" }
        },
        Fezandipiti: {
          types: ["Poison", "Fairy"],
          bs: { hp: 88, at: 91, df: 82, sa: 70, sd: 125, sp: 99 },
          weightkg: 30.1,
          abilities: { 0: "Toxic Chain" }
        },
        Fidough: {
          types: ["Fairy"],
          bs: { hp: 37, at: 55, df: 70, sa: 30, sd: 55, sp: 65 },
          weightkg: 10.9,
          abilities: { 0: "Own Tempo" },
          nfe: true
        },
        Finizen: {
          types: ["Water"],
          bs: { hp: 70, at: 45, df: 40, sa: 45, sd: 40, sp: 75 },
          weightkg: 60.2,
          abilities: { 0: "Water Veil" },
          nfe: true
        },
        Flamigo: {
          types: ["Flying", "Fighting"],
          bs: { hp: 82, at: 115, df: 74, sa: 75, sd: 64, sp: 90 },
          weightkg: 37,
          abilities: { 0: "Scrappy" }
        },
        Flittle: {
          types: ["Psychic"],
          bs: { hp: 30, at: 35, df: 30, sa: 55, sd: 30, sp: 75 },
          weightkg: 1.5,
          abilities: { 0: "Anticipation" },
          nfe: true
        },
        Floragato: {
          types: ["Grass"],
          bs: { hp: 61, at: 80, df: 63, sa: 60, sd: 63, sp: 83 },
          weightkg: 12.2,
          abilities: { 0: "Overgrow" },
          nfe: true
        },
        "Flutter Mane": {
          types: ["Ghost", "Fairy"],
          bs: { hp: 55, at: 55, df: 55, sa: 135, sd: 135, sp: 135 },
          weightkg: 4,
          gender: "N",
          abilities: { 0: "Protosynthesis" }
        },
        Frigibax: {
          types: ["Dragon", "Ice"],
          bs: { hp: 65, at: 75, df: 45, sa: 35, sd: 45, sp: 55 },
          weightkg: 17,
          abilities: { 0: "Thermal Exchange" },
          nfe: true
        },
        Fuecoco: {
          types: ["Fire"],
          bs: { hp: 67, at: 45, df: 59, sa: 63, sd: 40, sp: 36 },
          weightkg: 9.8,
          abilities: { 0: "Blaze" },
          nfe: true
        },
        Garganacl: {
          types: ["Rock"],
          bs: { hp: 100, at: 100, df: 130, sa: 45, sd: 90, sp: 35 },
          weightkg: 240,
          abilities: { 0: "Purifying Salt" }
        },
        Gholdengo: {
          types: ["Steel", "Ghost"],
          bs: { hp: 87, at: 60, df: 95, sa: 133, sd: 91, sp: 84 },
          weightkg: 30,
          gender: "N",
          abilities: { 0: "Good as Gold" }
        },
        Gimmighoul: {
          types: ["Ghost"],
          bs: { hp: 45, at: 30, df: 70, sa: 75, sd: 70, sp: 10 },
          weightkg: 5,
          gender: "N",
          abilities: { 0: "Rattled" },
          nfe: true,
          otherFormes: ["Gimmighoul-Roaming"]
        },
        "Gimmighoul-Roaming": {
          types: ["Ghost"],
          bs: { hp: 45, at: 30, df: 25, sa: 75, sd: 45, sp: 80 },
          weightkg: 0.1,
          gender: "N",
          abilities: { 0: "Run Away" },
          nfe: true,
          baseSpecies: "Gimmighoul"
        },
        Glimmet: {
          types: ["Rock", "Poison"],
          bs: { hp: 48, at: 35, df: 42, sa: 105, sd: 60, sp: 60 },
          weightkg: 8,
          abilities: { 0: "Toxic Debris" },
          nfe: true
        },
        Glimmora: {
          types: ["Rock", "Poison"],
          bs: { hp: 83, at: 55, df: 90, sa: 130, sd: 81, sp: 86 },
          weightkg: 45,
          abilities: { 0: "Toxic Debris" }
        },
        "Gouging Fire": {
          types: ["Fire", "Dragon"],
          bs: { hp: 105, at: 115, df: 121, sa: 65, sd: 93, sp: 91 },
          weightkg: 590,
          gender: "N",
          abilities: { 0: "Protosynthesis" }
        },
        Grafaiai: {
          types: ["Poison", "Normal"],
          bs: { hp: 63, at: 95, df: 65, sa: 80, sd: 72, sp: 110 },
          weightkg: 27.2,
          abilities: { 0: "Unburden" }
        },
        "Great Tusk": {
          types: ["Ground", "Fighting"],
          bs: { hp: 115, at: 131, df: 131, sa: 53, sd: 53, sp: 87 },
          weightkg: 320,
          gender: "N",
          abilities: { 0: "Protosynthesis" }
        },
        Greavard: {
          types: ["Ghost"],
          bs: { hp: 50, at: 61, df: 60, sa: 30, sd: 55, sp: 34 },
          weightkg: 35,
          abilities: { 0: "Pickup" },
          nfe: true
        },
        Hemogoblin: {
          types: ["Fairy", "Fire"],
          bs: { hp: 90, at: 96, df: 87, sa: 96, sd: 89, sp: 55 },
          weightkg: 85,
          abilities: { 0: "Pixilate" }
        },
        Houndstone: {
          types: ["Ghost"],
          bs: { hp: 72, at: 101, df: 100, sa: 50, sd: 97, sp: 68 },
          weightkg: 15,
          abilities: { 0: "Sand Rush" }
        },
        Hydrapple: {
          types: ["Grass", "Dragon"],
          bs: { hp: 106, at: 80, df: 110, sa: 120, sd: 80, sp: 44 },
          weightkg: 93,
          abilities: { 0: "Supersweet Syrup" }
        },
        "Iron Bundle": {
          types: ["Ice", "Water"],
          bs: { hp: 56, at: 80, df: 114, sa: 124, sd: 60, sp: 136 },
          weightkg: 11,
          gender: "N",
          abilities: { 0: "Quark Drive" }
        },
        "Iron Boulder": {
          types: ["Rock", "Psychic"],
          bs: { hp: 90, at: 120, df: 80, sa: 68, sd: 108, sp: 124 },
          weightkg: 162.5,
          gender: "N",
          abilities: { 0: "Quark Drive" }
        },
        "Iron Crown": {
          types: ["Steel", "Psychic"],
          bs: { hp: 90, at: 72, df: 100, sa: 122, sd: 108, sp: 98 },
          weightkg: 156,
          gender: "N",
          abilities: { 0: "Quark Drive" }
        },
        "Iron Hands": {
          types: ["Fighting", "Electric"],
          bs: { hp: 154, at: 140, df: 108, sa: 50, sd: 68, sp: 50 },
          weightkg: 380.7,
          gender: "N",
          abilities: { 0: "Quark Drive" }
        },
        "Iron Jugulis": {
          types: ["Dark", "Flying"],
          bs: { hp: 94, at: 80, df: 86, sa: 122, sd: 80, sp: 108 },
          weightkg: 111,
          gender: "N",
          abilities: { 0: "Quark Drive" }
        },
        "Iron Leaves": {
          types: ["Grass", "Psychic"],
          bs: { hp: 90, at: 130, df: 88, sa: 70, sd: 108, sp: 104 },
          weightkg: 125,
          gender: "N",
          abilities: { 0: "Quark Drive" }
        },
        "Iron Moth": {
          types: ["Fire", "Poison"],
          bs: { hp: 80, at: 70, df: 60, sa: 140, sd: 110, sp: 110 },
          weightkg: 36,
          gender: "N",
          abilities: { 0: "Quark Drive" }
        },
        "Iron Thorns": {
          types: ["Rock", "Electric"],
          bs: { hp: 100, at: 134, df: 110, sa: 70, sd: 84, sp: 72 },
          weightkg: 303,
          gender: "N",
          abilities: { 0: "Quark Drive" }
        },
        "Iron Treads": {
          types: ["Ground", "Steel"],
          bs: { hp: 90, at: 112, df: 120, sa: 72, sd: 70, sp: 106 },
          weightkg: 240,
          gender: "N",
          abilities: { 0: "Quark Drive" }
        },
        "Iron Valiant": {
          types: ["Fairy", "Fighting"],
          bs: { hp: 74, at: 130, df: 90, sa: 120, sd: 60, sp: 116 },
          weightkg: 35,
          gender: "N",
          abilities: { 0: "Quark Drive" }
        },
        Kilowattrel: {
          types: ["Electric", "Flying"],
          bs: { hp: 70, at: 70, df: 60, sa: 105, sd: 60, sp: 125 },
          weightkg: 38.6,
          abilities: { 0: "Wind Power" }
        },
        Kingambit: {
          types: ["Dark", "Steel"],
          bs: { hp: 100, at: 135, df: 120, sa: 60, sd: 85, sp: 50 },
          weightkg: 120,
          abilities: { 0: "Defiant" }
        },
        Klawf: {
          types: ["Rock"],
          bs: { hp: 70, at: 100, df: 115, sa: 35, sd: 55, sp: 75 },
          weightkg: 79,
          abilities: { 0: "Anger Shell" }
        },
        Koraidon: {
          types: ["Fighting", "Dragon"],
          bs: { hp: 100, at: 135, df: 115, sa: 85, sd: 100, sp: 135 },
          weightkg: 303,
          gender: "N",
          abilities: { 0: "Orichalcum Pulse" }
        },
        Lechonk: {
          types: ["Normal"],
          bs: { hp: 54, at: 45, df: 40, sa: 35, sd: 45, sp: 35 },
          weightkg: 10.2,
          abilities: { 0: "Aroma Veil" },
          nfe: true
        },
        Lokix: {
          types: ["Bug", "Dark"],
          bs: { hp: 71, at: 102, df: 78, sa: 52, sd: 55, sp: 92 },
          weightkg: 17.5,
          abilities: { 0: "Swarm" }
        },
        Mabosstiff: {
          types: ["Dark"],
          bs: { hp: 80, at: 120, df: 90, sa: 60, sd: 70, sp: 85 },
          weightkg: 61,
          abilities: { 0: "Intimidate" }
        },
        Maschiff: {
          types: ["Dark"],
          bs: { hp: 60, at: 78, df: 60, sa: 40, sd: 51, sp: 51 },
          weightkg: 16,
          abilities: { 0: "Intimidate" },
          nfe: true
        },
        Maushold: {
          types: ["Normal"],
          bs: { hp: 74, at: 75, df: 70, sa: 65, sd: 75, sp: 111 },
          weightkg: 2.3,
          gender: "N",
          abilities: { 0: "Friend Guard" },
          otherFormes: ["Maushold-Four"]
        },
        "Maushold-Four": {
          types: ["Normal"],
          bs: { hp: 74, at: 75, df: 70, sa: 65, sd: 75, sp: 111 },
          weightkg: 2.8,
          gender: "N",
          abilities: { 0: "Friend Guard" },
          baseSpecies: "Maushold"
        },
        Meowscarada: {
          types: ["Grass", "Dark"],
          bs: { hp: 76, at: 110, df: 70, sa: 81, sd: 70, sp: 123 },
          weightkg: 31.2,
          abilities: { 0: "Overgrow" }
        },
        Miraidon: {
          types: ["Electric", "Dragon"],
          bs: { hp: 100, at: 85, df: 100, sa: 135, sd: 115, sp: 135 },
          weightkg: 240,
          gender: "N",
          abilities: { 0: "Hadron Engine" }
        },
        Munkidori: {
          types: ["Poison", "Psychic"],
          bs: { hp: 88, at: 75, df: 66, sa: 130, sd: 90, sp: 106 },
          weightkg: 12.2,
          abilities: { 0: "Toxic Chain" }
        },
        Nacli: {
          types: ["Rock"],
          bs: { hp: 55, at: 55, df: 75, sa: 35, sd: 35, sp: 25 },
          weightkg: 16,
          abilities: { 0: "Purifying Salt" },
          nfe: true
        },
        Naclstack: {
          types: ["Rock"],
          bs: { hp: 60, at: 60, df: 100, sa: 35, sd: 65, sp: 35 },
          weightkg: 105,
          abilities: { 0: "Purifying Salt" },
          nfe: true
        },
        Nymble: {
          types: ["Bug"],
          bs: { hp: 33, at: 46, df: 40, sa: 21, sd: 25, sp: 45 },
          weightkg: 1,
          abilities: { 0: "Swarm" },
          nfe: true
        },
        Ogerpon: {
          types: ["Grass"],
          bs: { hp: 80, at: 120, df: 84, sa: 60, sd: 96, sp: 110 },
          abilities: { 0: "Defiant" },
          weightkg: 39.8,
          otherFormes: [
            "Ogerpon-Cornerstone",
            "Ogerpon-Cornerstone-Tera",
            "Ogerpon-Hearthflame",
            "Ogerpon-Hearthflame-Tera",
            "Ogerpon-Teal-Tera",
            "Ogerpon-Wellspring",
            "Ogerpon-Wellspring-Tera"
          ]
        },
        "Ogerpon-Wellspring": {
          types: ["Grass", "Water"],
          bs: { hp: 80, at: 120, df: 84, sa: 60, sd: 96, sp: 110 },
          abilities: { 0: "Water Absorb" },
          weightkg: 39.8,
          baseSpecies: "Ogerpon"
        },
        "Ogerpon-Hearthflame": {
          types: ["Grass", "Fire"],
          bs: { hp: 80, at: 120, df: 84, sa: 60, sd: 96, sp: 110 },
          abilities: { 0: "Mold Breaker" },
          weightkg: 39.8,
          baseSpecies: "Ogerpon"
        },
        "Ogerpon-Cornerstone": {
          types: ["Grass", "Rock"],
          bs: { hp: 80, at: 120, df: 84, sa: 60, sd: 96, sp: 110 },
          abilities: { 0: "Sturdy" },
          weightkg: 39.8,
          baseSpecies: "Ogerpon"
        },
        "Ogerpon-Teal-Tera": {
          types: ["Grass"],
          bs: { hp: 80, at: 120, df: 84, sa: 60, sd: 96, sp: 110 },
          abilities: { 0: "Embody Aspect (Teal)" },
          weightkg: 39.8,
          baseSpecies: "Ogerpon"
        },
        "Ogerpon-Wellspring-Tera": {
          types: ["Grass", "Water"],
          bs: { hp: 80, at: 120, df: 84, sa: 60, sd: 96, sp: 110 },
          abilities: { 0: "Embody Aspect (Wellspring)" },
          weightkg: 39.8,
          baseSpecies: "Ogerpon"
        },
        "Ogerpon-Hearthflame-Tera": {
          types: ["Grass", "Fire"],
          bs: { hp: 80, at: 120, df: 84, sa: 60, sd: 96, sp: 110 },
          abilities: { 0: "Embody Aspect (Hearthflame)" },
          weightkg: 39.8,
          baseSpecies: "Ogerpon"
        },
        "Ogerpon-Cornerstone-Tera": {
          types: ["Grass", "Rock"],
          bs: { hp: 80, at: 120, df: 84, sa: 60, sd: 96, sp: 110 },
          abilities: { 0: "Embody Aspect (Cornerstone)" },
          weightkg: 39.8,
          baseSpecies: "Ogerpon"
        },
        Oinkologne: {
          types: ["Normal"],
          bs: { hp: 110, at: 100, df: 75, sa: 59, sd: 80, sp: 65 },
          weightkg: 120,
          abilities: { 0: "Lingering Aroma" },
          otherFormes: ["Oinkologne-F"]
        },
        "Oinkologne-F": {
          types: ["Normal"],
          bs: { hp: 115, at: 90, df: 70, sa: 59, sd: 90, sp: 65 },
          weightkg: 120,
          abilities: { 0: "Aroma Veil" },
          baseSpecies: "Oinkologne"
        },
        Okidogi: {
          types: ["Poison", "Fighting"],
          bs: { hp: 88, at: 128, df: 115, sa: 58, sd: 86, sp: 80 },
          weightkg: 92,
          abilities: { 0: "Toxic Chain" }
        },
        Orthworm: {
          types: ["Steel"],
          bs: { hp: 70, at: 85, df: 145, sa: 60, sd: 55, sp: 65 },
          weightkg: 310,
          abilities: { 0: "Earth Eater" }
        },
        Palafin: {
          types: ["Water"],
          bs: { hp: 100, at: 70, df: 72, sa: 53, sd: 62, sp: 100 },
          weightkg: 60.2,
          abilities: { 0: "Zero to Hero" },
          otherFormes: ["Palafin-Hero"]
        },
        "Palafin-Hero": {
          types: ["Water"],
          bs: { hp: 100, at: 160, df: 97, sa: 106, sd: 87, sp: 100 },
          weightkg: 97.4,
          abilities: { 0: "Zero to Hero" },
          baseSpecies: "Palafin"
        },
        Pawmi: {
          types: ["Electric"],
          bs: { hp: 45, at: 50, df: 20, sa: 40, sd: 25, sp: 60 },
          weightkg: 2.5,
          abilities: { 0: "Static" },
          nfe: true
        },
        Pawmo: {
          types: ["Electric", "Fighting"],
          bs: { hp: 60, at: 75, df: 40, sa: 50, sd: 40, sp: 85 },
          weightkg: 6.5,
          abilities: { 0: "Volt Absorb" },
          nfe: true
        },
        Pawmot: {
          types: ["Electric", "Fighting"],
          bs: { hp: 70, at: 115, df: 70, sa: 70, sd: 60, sp: 105 },
          weightkg: 41,
          abilities: { 0: "Volt Absorb" }
        },
        Pecharunt: {
          types: ["Poison", "Ghost"],
          bs: { hp: 88, at: 88, df: 160, sa: 88, sd: 88, sp: 88 },
          weightkg: 0.3,
          gender: "N",
          abilities: { 0: "Poison Puppeteer" }
        },
        Poltchageist: {
          types: ["Grass", "Ghost"],
          bs: { hp: 40, at: 45, df: 45, sa: 74, sd: 54, sp: 50 },
          weightkg: 1.1,
          abilities: { 0: "Hospitality" },
          nfe: true,
          otherFormes: ["Poltchageist-Artisan"],
          gender: "N"
        },
        "Poltchageist-Artisan": {
          types: ["Grass", "Ghost"],
          bs: { hp: 40, at: 45, df: 45, sa: 74, sd: 54, sp: 50 },
          weightkg: 1.1,
          abilities: { 0: "Hospitality" },
          nfe: true,
          gender: "N",
          baseSpecies: "Poltchageist"
        },
        Quaquaval: {
          types: ["Water", "Fighting"],
          bs: { hp: 85, at: 120, df: 80, sa: 85, sd: 75, sp: 85 },
          weightkg: 61.9,
          abilities: { 0: "Torrent" }
        },
        Quaxly: {
          types: ["Water"],
          bs: { hp: 55, at: 65, df: 45, sa: 50, sd: 45, sp: 50 },
          weightkg: 6.1,
          abilities: { 0: "Torrent" },
          nfe: true
        },
        Quaxwell: {
          types: ["Water"],
          bs: { hp: 70, at: 85, df: 65, sa: 65, sd: 60, sp: 65 },
          weightkg: 21.5,
          abilities: { 0: "Torrent" },
          nfe: true
        },
        Rabsca: {
          types: ["Bug", "Psychic"],
          bs: { hp: 75, at: 50, df: 85, sa: 115, sd: 100, sp: 45 },
          weightkg: 3.5,
          abilities: { 0: "Synchronize" }
        },
        "Raging Bolt": {
          types: ["Electric", "Dragon"],
          bs: { hp: 125, at: 73, df: 91, sa: 137, sd: 89, sp: 75 },
          weightkg: 480,
          gender: "N",
          abilities: { 0: "Protosynthesis" }
        },
        Ramnarok: {
          types: ["Fire", "Steel"],
          bs: { hp: 110, at: 56, df: 104, sa: 111, sd: 134, sp: 85 },
          weightkg: 250,
          abilities: { 0: "No Guard" },
          otherFormes: ["Ramnarok-Radiant"],
          gender: "N"
        },
        "Ramnarok-Radiant": {
          types: ["Fire", "Ice"],
          bs: { hp: 110, at: 56, df: 85, sa: 141, sd: 54, sp: 154 },
          weightkg: 182,
          abilities: { 0: "No Guard" },
          baseSpecies: "Ramnarok",
          gender: "N"
        },
        Rellor: {
          types: ["Bug"],
          bs: { hp: 41, at: 50, df: 60, sa: 31, sd: 58, sp: 30 },
          weightkg: 1,
          abilities: { 0: "Compound Eyes" },
          nfe: true
        },
        Revavroom: {
          types: ["Steel", "Poison"],
          bs: { hp: 80, at: 119, df: 90, sa: 54, sd: 67, sp: 90 },
          weightkg: 120,
          abilities: { 0: "Overcoat" }
        },
        "Roaring Moon": {
          types: ["Dragon", "Dark"],
          bs: { hp: 105, at: 139, df: 71, sa: 55, sd: 101, sp: 119 },
          weightkg: 380,
          gender: "N",
          abilities: { 0: "Protosynthesis" }
        },
        "Sandy Shocks": {
          types: ["Electric", "Ground"],
          bs: { hp: 85, at: 81, df: 97, sa: 121, sd: 85, sp: 101 },
          weightkg: 60,
          gender: "N",
          abilities: { 0: "Protosynthesis" }
        },
        Scattervein: {
          types: ["Fairy"],
          bs: { hp: 75, at: 74, df: 87, sa: 62, sd: 89, sp: 63 },
          weightkg: 25,
          abilities: { 0: "Pixilate" },
          nfe: true
        },
        Scovillain: {
          types: ["Grass", "Fire"],
          bs: { hp: 65, at: 108, df: 65, sa: 108, sd: 65, sp: 75 },
          weightkg: 15,
          abilities: { 0: "Chlorophyll" }
        },
        "Scream Tail": {
          types: ["Fairy", "Psychic"],
          bs: { hp: 115, at: 65, df: 99, sa: 65, sd: 115, sp: 111 },
          weightkg: 8,
          gender: "N",
          abilities: { 0: "Protosynthesis" }
        },
        Shox: {
          types: ["Electric", "Normal"],
          bs: { hp: 136, at: 55, df: 87, sa: 108, sd: 108, sp: 56 },
          weightkg: 99.9,
          abilities: { 0: "Electromorphosis" }
        },
        Shroodle: {
          types: ["Poison", "Normal"],
          bs: { hp: 40, at: 65, df: 35, sa: 40, sd: 35, sp: 75 },
          weightkg: 0.7,
          abilities: { 0: "Unburden" },
          nfe: true
        },
        "Sinistcha": {
          types: ["Grass", "Ghost"],
          bs: { hp: 71, at: 60, df: 106, sa: 121, sd: 80, sp: 70 },
          weightkg: 2.2,
          abilities: { 0: "Hospitality" },
          otherFormes: ["Sinistcha-Masterpiece"],
          gender: "N"
        },
        "Sinistcha-Masterpiece": {
          types: ["Grass", "Ghost"],
          bs: { hp: 71, at: 60, df: 106, sa: 121, sd: 80, sp: 70 },
          weightkg: 2.2,
          abilities: { 0: "Hospitality" },
          gender: "N",
          baseSpecies: "Sinistcha"
        },
        Skeledirge: {
          types: ["Fire", "Ghost"],
          bs: { hp: 104, at: 75, df: 100, sa: 110, sd: 75, sp: 66 },
          weightkg: 326.5,
          abilities: { 0: "Blaze" }
        },
        "Slither Wing": {
          types: ["Bug", "Fighting"],
          bs: { hp: 85, at: 135, df: 79, sa: 85, sd: 105, sp: 81 },
          weightkg: 92,
          gender: "N",
          abilities: { 0: "Protosynthesis" }
        },
        Smoliv: {
          types: ["Grass", "Normal"],
          bs: { hp: 41, at: 35, df: 45, sa: 58, sd: 51, sp: 30 },
          weightkg: 6.5,
          abilities: { 0: "Early Bird" },
          nfe: true
        },
        Spidops: {
          types: ["Bug"],
          bs: { hp: 60, at: 79, df: 92, sa: 52, sd: 86, sp: 35 },
          weightkg: 16.5,
          abilities: { 0: "Insomnia" }
        },
        Sprigatito: {
          types: ["Grass"],
          bs: { hp: 40, at: 61, df: 54, sa: 45, sd: 45, sp: 65 },
          weightkg: 4.1,
          abilities: { 0: "Overgrow" },
          nfe: true
        },
        Squawkabilly: {
          types: ["Normal", "Flying"],
          bs: { hp: 82, at: 96, df: 51, sa: 45, sd: 51, sp: 92 },
          weightkg: 2.4,
          abilities: { 0: "Intimidate" },
          otherFormes: ["Squawkabilly-Blue", "Squawkabilly-White", "Squawkabilly-Yellow"]
        },
        "Squawkabilly-Blue": {
          types: ["Normal", "Flying"],
          bs: { hp: 82, at: 96, df: 51, sa: 45, sd: 51, sp: 92 },
          weightkg: 2.4,
          abilities: { 0: "Intimidate" },
          baseSpecies: "Squawkabilly"
        },
        "Squawkabilly-White": {
          types: ["Normal", "Flying"],
          bs: { hp: 82, at: 96, df: 51, sa: 45, sd: 51, sp: 92 },
          weightkg: 2.4,
          abilities: { 0: "Intimidate" },
          baseSpecies: "Squawkabilly"
        },
        "Squawkabilly-Yellow": {
          types: ["Normal", "Flying"],
          bs: { hp: 82, at: 96, df: 51, sa: 45, sd: 51, sp: 92 },
          weightkg: 2.4,
          abilities: { 0: "Intimidate" },
          baseSpecies: "Squawkabilly"
        },
        Tadbulb: {
          types: ["Electric"],
          bs: { hp: 61, at: 31, df: 41, sa: 59, sd: 35, sp: 45 },
          weightkg: 0.4,
          abilities: { 0: "Own Tempo" },
          nfe: true
        },
        Tandemaus: {
          types: ["Normal"],
          bs: { hp: 50, at: 50, df: 45, sa: 40, sd: 45, sp: 75 },
          weightkg: 1.8,
          gender: "N",
          abilities: { 0: "Run Away" },
          nfe: true
        },
        Tarountula: {
          types: ["Bug"],
          bs: { hp: 35, at: 41, df: 45, sa: 29, sd: 40, sp: 20 },
          weightkg: 4,
          abilities: { 0: "Insomnia" },
          nfe: true
        },
        Tatsugiri: {
          types: ["Dragon", "Water"],
          bs: { hp: 68, at: 50, df: 60, sa: 120, sd: 95, sp: 82 },
          weightkg: 8,
          abilities: { 0: "Commander" },
          otherFormes: ["Tatsugiri-Droopy", "Tatsugiri-Stretchy"]
        },
        "Tatsugiri-Droopy": {
          types: ["Dragon", "Water"],
          bs: { hp: 68, at: 50, df: 60, sa: 120, sd: 95, sp: 82 },
          weightkg: 8,
          abilities: { 0: "Commander" },
          baseSpecies: "Tatsugiri"
        },
        "Tatsugiri-Stretchy": {
          types: ["Dragon", "Water"],
          bs: { hp: 68, at: 50, df: 60, sa: 120, sd: 95, sp: 82 },
          weightkg: 8,
          abilities: { 0: "Commander" },
          baseSpecies: "Tatsugiri"
        },
        "Tauros-Paldea-Aqua": {
          types: ["Fighting", "Water"],
          bs: { hp: 75, at: 110, df: 105, sa: 30, sd: 70, sp: 100 },
          weightkg: 110,
          abilities: { 0: "Intimidate" },
          baseSpecies: "Tauros"
        },
        "Tauros-Paldea-Blaze": {
          types: ["Fighting", "Fire"],
          bs: { hp: 75, at: 110, df: 105, sa: 30, sd: 70, sp: 100 },
          weightkg: 85,
          abilities: { 0: "Intimidate" },
          baseSpecies: "Tauros"
        },
        "Tauros-Paldea-Combat": {
          types: ["Fighting"],
          bs: { hp: 75, at: 110, df: 105, sa: 30, sd: 70, sp: 100 },
          weightkg: 115,
          abilities: { 0: "Intimidate" },
          baseSpecies: "Tauros"
        },
        "Terapagos": {
          types: ["Normal"],
          bs: { hp: 90, at: 65, df: 85, sa: 65, sd: 85, sp: 60 },
          weightkg: 6.5,
          abilities: { 0: "Tera Shift" },
          otherFormes: ["Terapagos-Stellar", "Terapagos-Terastal"]
        },
        "Terapagos-Stellar": {
          types: ["Normal"],
          bs: { hp: 160, at: 105, df: 110, sa: 130, sd: 110, sp: 85 },
          weightkg: 77,
          abilities: { 0: "Teraform Zero" },
          baseSpecies: "Terapagos"
        },
        "Terapagos-Terastal": {
          types: ["Normal"],
          bs: { hp: 95, at: 95, df: 110, sa: 105, sd: 110, sp: 85 },
          weightkg: 16,
          abilities: { 0: "Tera Shell" },
          baseSpecies: "Terapagos"
        },
        "Ting-Lu": {
          types: ["Dark", "Ground"],
          bs: { hp: 155, at: 110, df: 125, sa: 55, sd: 80, sp: 45 },
          weightkg: 699.7,
          gender: "N",
          abilities: { 0: "Vessel of Ruin" }
        },
        Tinkatink: {
          types: ["Fairy", "Steel"],
          bs: { hp: 50, at: 45, df: 45, sa: 35, sd: 64, sp: 58 },
          weightkg: 8.9,
          abilities: { 0: "Mold Breaker" },
          nfe: true
        },
        Tinkaton: {
          types: ["Fairy", "Steel"],
          bs: { hp: 85, at: 75, df: 77, sa: 70, sd: 105, sp: 94 },
          weightkg: 112.8,
          abilities: { 0: "Mold Breaker" }
        },
        Tinkatuff: {
          types: ["Fairy", "Steel"],
          bs: { hp: 65, at: 55, df: 55, sa: 45, sd: 82, sp: 78 },
          weightkg: 59.1,
          abilities: { 0: "Mold Breaker" },
          nfe: true
        },
        Toedscool: {
          types: ["Ground", "Grass"],
          bs: { hp: 40, at: 40, df: 35, sa: 50, sd: 100, sp: 70 },
          weightkg: 33,
          abilities: { 0: "Mycelium Might" },
          nfe: true
        },
        Toedscruel: {
          types: ["Ground", "Grass"],
          bs: { hp: 80, at: 70, df: 65, sa: 80, sd: 120, sp: 100 },
          weightkg: 58,
          abilities: { 0: "Mycelium Might" }
        },
        "Ursaluna": {
          otherFormes: ["Ursaluna-Bloodmoon"]
        },
        "Ursaluna-Bloodmoon": {
          types: ["Ground", "Normal"],
          bs: { hp: 113, at: 70, df: 120, sa: 135, sd: 65, sp: 52 },
          weightkg: 333,
          abilities: { 0: "Mind's Eye" },
          baseSpecies: "Ursaluna"
        },
        Varoom: {
          types: ["Steel", "Poison"],
          bs: { hp: 45, at: 70, df: 63, sa: 30, sd: 45, sp: 47 },
          weightkg: 35,
          abilities: { 0: "Overcoat" },
          nfe: true
        },
        Veluza: {
          types: ["Water", "Psychic"],
          bs: { hp: 90, at: 102, df: 73, sa: 78, sd: 65, sp: 70 },
          weightkg: 90,
          abilities: { 0: "Mold Breaker" }
        },
        "Walking Wake": {
          types: ["Water", "Dragon"],
          bs: { hp: 99, at: 83, df: 91, sa: 125, sd: 83, sp: 109 },
          weightkg: 280,
          gender: "N",
          abilities: { 0: "Protosynthesis" }
        },
        Wattrel: {
          types: ["Electric", "Flying"],
          bs: { hp: 40, at: 40, df: 35, sa: 55, sd: 40, sp: 70 },
          weightkg: 3.6,
          abilities: { 0: "Wind Power" },
          nfe: true
        },
        Wiglett: {
          types: ["Water"],
          bs: { hp: 10, at: 55, df: 25, sa: 35, sd: 25, sp: 95 },
          weightkg: 1.8,
          abilities: { 0: "Gooey" },
          nfe: true
        },
        "Wo-Chien": {
          types: ["Dark", "Grass"],
          bs: { hp: 85, at: 85, df: 100, sa: 95, sd: 135, sp: 70 },
          weightkg: 74.2,
          gender: "N",
          abilities: { 0: "Tablets of Ruin" }
        },
        "Wooper-Paldea": {
          types: ["Poison", "Ground"],
          bs: { hp: 55, at: 45, df: 45, sa: 25, sd: 25, sp: 15 },
          weightkg: 11,
          abilities: { 0: "Poison Point" },
          baseSpecies: "Wooper",
          nfe: true
        },
        Wugtrio: {
          types: ["Water"],
          bs: { hp: 35, at: 100, df: 50, sa: 50, sd: 70, sp: 120 },
          weightkg: 5.4,
          abilities: { 0: "Gooey" }
        }
      };
      var ZA_PATCH = {
        Absol: { otherFormes: ["Absol-Mega", "Absol-Mega-Z"] },
        Barbaracle: { otherFormes: ["Barbaracle-Mega"] },
        Baxcalibur: { otherFormes: ["Baxcalibur-Mega"] },
        Chandelure: { otherFormes: ["Chandelure-Mega"] },
        Chesnaught: { otherFormes: ["Chesnaught-Mega"] },
        Chimecho: { otherFormes: ["Chimecho-Mega"] },
        Clefable: { otherFormes: ["Clefable-Mega"] },
        Crabominable: { otherFormes: ["Crabominable-Mega"] },
        Darkrai: { otherFormes: ["Darkrai-Mega"] },
        Delphox: { otherFormes: ["Delphox-Mega"] },
        Dragalge: { otherFormes: ["Dragalge-Mega"] },
        Dragonite: { otherFormes: ["Dragonite-Mega"] },
        Drampa: { otherFormes: ["Drampa-Mega"] },
        Eelektross: { otherFormes: ["Eelektross-Mega"] },
        Emboar: { otherFormes: ["Emboar-Mega"] },
        Excadrill: { otherFormes: ["Excadrill-Mega"] },
        Falinks: { otherFormes: ["Falinks-Mega"] },
        Feraligatr: { otherFormes: ["Feraligatr-Mega"] },
        Floette: { otherFormes: ["Floette-Eternal", "Floette-Mega"] },
        Froslass: { otherFormes: ["Froslass-Mega"] },
        Garchomp: { otherFormes: ["Garchomp-Mega", "Garchomp-Mega-Z"] },
        Glimmora: { otherFormes: ["Glimmora-Mega"] },
        Golisopod: { otherFormes: ["Golisopod-Mega"] },
        Golurk: { otherFormes: ["Golurk-Mega"] },
        Greninja: { otherFormes: ["Greninja-Ash", "Greninja-Bond", "Greninja-Mega"] },
        Hawlucha: { otherFormes: ["Hawlucha-Mega"] },
        Heatran: { otherFormes: ["Heatran-Mega"] },
        Lucario: { otherFormes: ["Lucario-Mega", "Lucario-Mega-Z"] },
        Magearna: { otherFormes: ["Magearna-Mega", "Magearna-Original", "Magearna-Original-Mega"] },
        Malamar: { otherFormes: ["Malamar-Mega"] },
        Meganium: { otherFormes: ["Meganium-Mega"] },
        Meowstic: { otherFormes: ["Meowstic-F", "Meowstic-F-Mega", "Meowstic-M-Mega"] },
        Pyroar: { otherFormes: ["Pyroar-Mega"] },
        Raichu: { otherFormes: ["Raichu-Alola", "Raichu-Mega-X", "Raichu-Mega-Y"] },
        Scolipede: { otherFormes: ["Scolipede-Mega"] },
        Scovillain: { otherFormes: ["Scovillain-Mega"] },
        Scrafty: { otherFormes: ["Scrafty-Mega"] },
        Skarmory: { otherFormes: ["Skarmory-Mega"] },
        Staraptor: { otherFormes: ["Staraptor-Mega"] },
        Starmie: { otherFormes: ["Starmie-Mega"] },
        Tatsugiri: {
          otherFormes: [
            "Tatsugiri-Curly-Mega",
            "Tatsugiri-Droopy",
            "Tatsugiri-Droopy-Mega",
            "Tatsugiri-Stretchy",
            "Tatsugiri-Stretchy-Mega"
          ]
        },
        Victreebel: { otherFormes: ["Victreebel-Mega"] },
        Zeraora: { otherFormes: ["Zeraora-Mega"] },
        Zygarde: { otherFormes: ["Zygarde-10%", "Zygarde-Complete", "Zygarde-Mega"] },
        "Absol-Mega-Z": {
          types: ["Dark", "Ghost"],
          bs: { hp: 65, at: 154, df: 60, sa: 75, sd: 60, sp: 151 },
          weightkg: 49,
          abilities: { 0: "Magic Bounce" },
          baseSpecies: "Absol"
        },
        "Barbaracle-Mega": {
          types: ["Rock", "Fighting"],
          bs: { hp: 72, at: 140, df: 130, sa: 64, sd: 106, sp: 88 },
          weightkg: 100,
          abilities: { 0: "Tough Claws" },
          baseSpecies: "Barbaracle"
        },
        "Baxcalibur-Mega": {
          types: ["Dragon", "Ice"],
          bs: { hp: 115, at: 175, df: 117, sa: 105, sd: 101, sp: 87 },
          weightkg: 315,
          abilities: { 0: "Thermal Exchange" },
          baseSpecies: "Baxcalibur"
        },
        "Chandelure-Mega": {
          types: ["Ghost", "Fire"],
          bs: { hp: 60, at: 75, df: 110, sa: 175, sd: 110, sp: 90 },
          weightkg: 69.6,
          abilities: { 0: "Flash Fire" },
          baseSpecies: "Chandelure"
        },
        "Chesnaught-Mega": {
          types: ["Grass", "Fighting"],
          bs: { hp: 88, at: 137, df: 172, sa: 74, sd: 115, sp: 44 },
          weightkg: 90,
          abilities: { 0: "Overgrow" },
          baseSpecies: "Chesnaught"
        },
        "Chimecho-Mega": {
          types: ["Psychic", "Steel"],
          bs: { hp: 75, at: 50, df: 110, sa: 135, sd: 120, sp: 65 },
          weightkg: 8,
          abilities: { 0: "Levitate" },
          baseSpecies: "Chimecho"
        },
        "Clefable-Mega": {
          types: ["Fairy", "Flying"],
          bs: { hp: 95, at: 80, df: 93, sa: 135, sd: 110, sp: 70 },
          weightkg: 42.3,
          abilities: { 0: "Cute Charm" },
          baseSpecies: "Clefable"
        },
        "Crabominable-Mega": {
          types: ["Fighting", "Ice"],
          bs: { hp: 97, at: 157, df: 122, sa: 62, sd: 107, sp: 33 },
          weightkg: 252.8,
          abilities: { 0: "Hyper Cutter" },
          baseSpecies: "Crabominable"
        },
        "Darkrai-Mega": {
          types: ["Dark"],
          bs: { hp: 70, at: 120, df: 130, sa: 165, sd: 130, sp: 85 },
          weightkg: 240,
          abilities: { 0: "Bad Dreams" },
          gender: "N",
          baseSpecies: "Darkrai"
        },
        "Delphox-Mega": {
          types: ["Fire", "Psychic"],
          bs: { hp: 75, at: 69, df: 72, sa: 159, sd: 125, sp: 134 },
          weightkg: 39,
          abilities: { 0: "Blaze" },
          baseSpecies: "Delphox"
        },
        "Dragalge-Mega": {
          types: ["Poison", "Dragon"],
          bs: { hp: 65, at: 85, df: 105, sa: 132, sd: 163, sp: 44 },
          weightkg: 100.3,
          abilities: { 0: "Poison Point" },
          baseSpecies: "Dragalge"
        },
        "Dragonite-Mega": {
          types: ["Dragon", "Flying"],
          bs: { hp: 91, at: 124, df: 115, sa: 145, sd: 125, sp: 100 },
          weightkg: 290,
          abilities: { 0: "Inner Focus" },
          baseSpecies: "Dragonite"
        },
        "Drampa-Mega": {
          types: ["Normal", "Dragon"],
          bs: { hp: 78, at: 85, df: 110, sa: 160, sd: 116, sp: 36 },
          weightkg: 185,
          abilities: { 0: "Berserk" },
          baseSpecies: "Drampa"
        },
        "Eelektross-Mega": {
          types: ["Electric"],
          bs: { hp: 85, at: 145, df: 80, sa: 135, sd: 90, sp: 80 },
          weightkg: 160,
          abilities: { 0: "Levitate" },
          baseSpecies: "Eelektross"
        },
        "Emboar-Mega": {
          types: ["Fire", "Fighting"],
          bs: { hp: 110, at: 148, df: 75, sa: 110, sd: 110, sp: 75 },
          weightkg: 180.3,
          abilities: { 0: "Blaze" },
          baseSpecies: "Emboar"
        },
        "Excadrill-Mega": {
          types: ["Ground", "Steel"],
          bs: { hp: 110, at: 165, df: 100, sa: 65, sd: 65, sp: 103 },
          weightkg: 60,
          abilities: { 0: "Sand Rush" },
          baseSpecies: "Excadrill"
        },
        "Falinks-Mega": {
          types: ["Fighting"],
          bs: { hp: 65, at: 135, df: 135, sa: 70, sd: 65, sp: 100 },
          weightkg: 99,
          abilities: { 0: "Battle Armor" },
          gender: "N",
          baseSpecies: "Falinks"
        },
        "Feraligatr-Mega": {
          types: ["Water", "Dragon"],
          bs: { hp: 85, at: 160, df: 125, sa: 89, sd: 93, sp: 78 },
          weightkg: 108.8,
          abilities: { 0: "Torrent" },
          baseSpecies: "Feraligatr"
        },
        "Floette-Mega": {
          types: ["Fairy"],
          bs: { hp: 74, at: 85, df: 87, sa: 155, sd: 148, sp: 102 },
          weightkg: 100.8,
          abilities: { 0: "Flower Veil" },
          baseSpecies: "Floette"
        },
        "Froslass-Mega": {
          types: ["Ice", "Ghost"],
          bs: { hp: 70, at: 80, df: 70, sa: 140, sd: 100, sp: 120 },
          weightkg: 29.6,
          abilities: { 0: "Snow Cloak" },
          baseSpecies: "Froslass"
        },
        "Garchomp-Mega-Z": {
          types: ["Dragon"],
          bs: { hp: 108, at: 130, df: 85, sa: 141, sd: 85, sp: 151 },
          weightkg: 99,
          abilities: { 0: "Sand Force" },
          baseSpecies: "Garchomp"
        },
        "Glimmora-Mega": {
          types: ["Rock", "Poison"],
          bs: { hp: 83, at: 90, df: 105, sa: 150, sd: 96, sp: 101 },
          weightkg: 77,
          abilities: { 0: "Toxic Debris" },
          baseSpecies: "Glimmora"
        },
        "Golisopod-Mega": {
          types: ["Bug", "Steel"],
          bs: { hp: 75, at: 150, df: 175, sa: 70, sd: 120, sp: 40 },
          weightkg: 148,
          abilities: { 0: "Emergency Exit" },
          baseSpecies: "Golisopod"
        },
        "Golurk-Mega": {
          types: ["Ground", "Ghost"],
          bs: { hp: 89, at: 159, df: 105, sa: 70, sd: 105, sp: 55 },
          weightkg: 330,
          abilities: { 0: "Iron Fist" },
          gender: "N",
          baseSpecies: "Golurk"
        },
        "Greninja-Mega": {
          types: ["Water", "Dark"],
          bs: { hp: 72, at: 125, df: 77, sa: 133, sd: 81, sp: 142 },
          weightkg: 40,
          abilities: { 0: "Torrent" },
          baseSpecies: "Greninja"
        },
        "Hawlucha-Mega": {
          types: ["Fighting", "Flying"],
          bs: { hp: 78, at: 137, df: 100, sa: 74, sd: 93, sp: 118 },
          weightkg: 25,
          abilities: { 0: "Limber" },
          baseSpecies: "Hawlucha"
        },
        "Heatran-Mega": {
          types: ["Fire", "Steel"],
          bs: { hp: 91, at: 120, df: 106, sa: 175, sd: 141, sp: 67 },
          weightkg: 570,
          abilities: { 0: "Flash Fire" },
          baseSpecies: "Heatran"
        },
        "Lucario-Mega-Z": {
          types: ["Fighting", "Steel"],
          bs: { hp: 70, at: 100, df: 70, sa: 164, sd: 70, sp: 151 },
          weightkg: 49.4,
          abilities: { 0: "Adaptability" },
          baseSpecies: "Lucario"
        },
        "Magearna-Mega": {
          types: ["Steel", "Fairy"],
          bs: { hp: 80, at: 125, df: 115, sa: 170, sd: 115, sp: 95 },
          weightkg: 248.1,
          abilities: { 0: "Soul-Heart" },
          gender: "N",
          baseSpecies: "Magearna"
        },
        "Magearna-Original-Mega": {
          types: ["Steel", "Fairy"],
          bs: { hp: 80, at: 125, df: 115, sa: 170, sd: 115, sp: 95 },
          weightkg: 248.1,
          abilities: { 0: "Soul-Heart" },
          gender: "N",
          baseSpecies: "Magearna"
        },
        "Malamar-Mega": {
          types: ["Dark", "Psychic"],
          bs: { hp: 86, at: 102, df: 88, sa: 98, sd: 120, sp: 88 },
          weightkg: 69.8,
          abilities: { 0: "Contrary" },
          baseSpecies: "Malamar"
        },
        "Meganium-Mega": {
          types: ["Grass", "Fairy"],
          bs: { hp: 80, at: 92, df: 115, sa: 143, sd: 115, sp: 80 },
          weightkg: 201,
          abilities: { 0: "Overgrow" },
          baseSpecies: "Meganium"
        },
        "Meowstic-F-Mega": {
          types: ["Psychic"],
          bs: { hp: 74, at: 48, df: 76, sa: 143, sd: 101, sp: 124 },
          weightkg: 10.1,
          abilities: { 0: "Keen Eye" },
          baseSpecies: "Meowstic"
        },
        "Meowstic-M-Mega": {
          types: ["Psychic"],
          bs: { hp: 74, at: 48, df: 76, sa: 143, sd: 101, sp: 124 },
          weightkg: 10.1,
          abilities: { 0: "Keen Eye" },
          baseSpecies: "Meowstic"
        },
        "Pyroar-Mega": {
          types: ["Fire", "Normal"],
          bs: { hp: 86, at: 88, df: 92, sa: 129, sd: 86, sp: 126 },
          weightkg: 93.3,
          abilities: { 0: "Rivalry" },
          baseSpecies: "Pyroar"
        },
        "Raichu-Mega-X": {
          types: ["Electric"],
          bs: { hp: 60, at: 135, df: 95, sa: 90, sd: 95, sp: 110 },
          weightkg: 38,
          abilities: { 0: "Surge Surfer" },
          baseSpecies: "Raichu"
        },
        "Raichu-Mega-Y": {
          types: ["Electric"],
          bs: { hp: 60, at: 100, df: 55, sa: 160, sd: 80, sp: 130 },
          weightkg: 26,
          abilities: { 0: "Surge Surfer" },
          baseSpecies: "Raichu"
        },
        "Scolipede-Mega": {
          types: ["Bug", "Poison"],
          bs: { hp: 60, at: 140, df: 149, sa: 75, sd: 99, sp: 62 },
          weightkg: 230.5,
          abilities: { 0: "Poison Point" },
          baseSpecies: "Scolipede"
        },
        "Scovillain-Mega": {
          types: ["Grass", "Fire"],
          bs: { hp: 65, at: 138, df: 85, sa: 138, sd: 85, sp: 75 },
          weightkg: 22,
          abilities: { 0: "Chlorophyll" },
          baseSpecies: "Scovillain"
        },
        "Scrafty-Mega": {
          types: ["Dark", "Fighting"],
          bs: { hp: 65, at: 130, df: 135, sa: 55, sd: 135, sp: 68 },
          weightkg: 31,
          abilities: { 0: "Shed Skin" },
          baseSpecies: "Scrafty"
        },
        "Skarmory-Mega": {
          types: ["Steel", "Flying"],
          bs: { hp: 65, at: 140, df: 110, sa: 40, sd: 100, sp: 110 },
          weightkg: 40.4,
          abilities: { 0: "Keen Eye" },
          baseSpecies: "Skarmory"
        },
        "Staraptor-Mega": {
          types: ["Fighting", "Flying"],
          bs: { hp: 85, at: 140, df: 100, sa: 60, sd: 90, sp: 110 },
          weightkg: 50,
          abilities: { 0: "Intimidate" },
          baseSpecies: "Staraptor"
        },
        "Starmie-Mega": {
          types: ["Water", "Psychic"],
          bs: { hp: 60, at: 140, df: 105, sa: 130, sd: 105, sp: 120 },
          weightkg: 80,
          abilities: { 0: "Illuminate" },
          gender: "N",
          baseSpecies: "Starmie"
        },
        "Tatsugiri-Curly-Mega": {
          types: ["Dragon", "Water"],
          bs: { hp: 68, at: 65, df: 90, sa: 135, sd: 125, sp: 92 },
          weightkg: 8,
          abilities: { 0: "Commander" },
          baseSpecies: "Tatsugiri"
        },
        "Tatsugiri-Droopy-Mega": {
          types: ["Dragon", "Water"],
          bs: { hp: 68, at: 65, df: 90, sa: 135, sd: 125, sp: 92 },
          weightkg: 8,
          abilities: { 0: "Commander" },
          baseSpecies: "Tatsugiri"
        },
        "Tatsugiri-Stretchy-Mega": {
          types: ["Dragon", "Water"],
          bs: { hp: 68, at: 65, df: 90, sa: 135, sd: 125, sp: 92 },
          weightkg: 8,
          abilities: { 0: "Commander" },
          baseSpecies: "Tatsugiri"
        },
        "Victreebel-Mega": {
          types: ["Grass", "Poison"],
          bs: { hp: 80, at: 125, df: 85, sa: 135, sd: 95, sp: 70 },
          weightkg: 125.5,
          abilities: { 0: "Chlorophyll" },
          baseSpecies: "Victreebel"
        },
        "Zeraora-Mega": {
          types: ["Electric"],
          bs: { hp: 88, at: 157, df: 75, sa: 147, sd: 80, sp: 153 },
          weightkg: 44.5,
          abilities: { 0: "Volt Absorb" },
          gender: "N",
          baseSpecies: "Zeraora"
        },
        "Zygarde-Mega": {
          types: ["Dragon", "Ground"],
          bs: { hp: 216, at: 70, df: 91, sa: 216, sd: 85, sp: 100 },
          weightkg: 610,
          abilities: { 0: "Aura Break" },
          gender: "N",
          baseSpecies: "Zygarde"
        }
      };
      var SV = (0, util_1.extend)(true, {}, SS, SV_PATCH, PLA_PATCH, ZA_PATCH);
      exports.SPECIES = [{}, RBY, GSC, ADV, DPP, BW, XY, SM, SS, SV];
      var Species = (function() {
        function Species2(gen2) {
          this.gen = gen2;
        }
        Species2.prototype.get = function(id) {
          return SPECIES_BY_ID[this.gen][id];
        };
        Species2.prototype[Symbol.iterator] = function() {
          var _a2, _b, _c, _i, id;
          return __generator(this, function(_d) {
            switch (_d.label) {
              case 0:
                _a2 = SPECIES_BY_ID[this.gen];
                _b = [];
                for (_c in _a2)
                  _b.push(_c);
                _i = 0;
                _d.label = 1;
              case 1:
                if (!(_i < _b.length)) return [3, 4];
                _c = _b[_i];
                if (!(_c in _a2)) return [3, 3];
                id = _c;
                return [4, this.get(id)];
              case 2:
                _d.sent();
                _d.label = 3;
              case 3:
                _i++;
                return [3, 1];
              case 4:
                return [2];
            }
          });
        };
        return Species2;
      })();
      exports.Species = Species;
      var Specie = (function() {
        function Specie2(name, data) {
          this.kind = "Species";
          this.id = (0, util_1.toID)(name);
          this.name = name;
          var baseStats = {};
          baseStats.hp = data.bs.hp;
          baseStats.atk = data.bs.at;
          baseStats.def = data.bs.df;
          baseStats.spa = gen >= 2 ? data.bs.sa : data.bs.sl;
          baseStats.spd = gen >= 2 ? data.bs.sd : data.bs.sl;
          baseStats.spe = data.bs.sp;
          this.baseStats = baseStats;
          if (data.otherFormes) {
            this.otherFormes = data.otherFormes;
            if (gen >= 9 && !["toxtricity", "urshifu"].includes(this.id)) {
              this.otherFormes = this.otherFormes.filter(function(f) {
                return !f.endsWith("-Gmax");
              });
              if (!this.otherFormes.length)
                this.otherFormes = void 0;
              if (this.otherFormes)
                this.otherFormes = __spreadArray([], __read(new Set(this.otherFormes)), false);
            }
          }
          (0, util_1.assignWithout)(this, data, Specie2.EXCLUDE);
        }
        Specie2.EXCLUDE = /* @__PURE__ */ new Set(["bs", "otherFormes"]);
        return Specie2;
      })();
      var SPECIES_BY_ID = [];
      var gen = 0;
      try {
        for (SPECIES_1 = __values(exports.SPECIES), SPECIES_1_1 = SPECIES_1.next(); !SPECIES_1_1.done; SPECIES_1_1 = SPECIES_1.next()) {
          species = SPECIES_1_1.value;
          map = {};
          for (specie in species) {
            if (gen >= 2 && species[specie].bs.sl)
              delete species[specie].bs.sl;
            m = new Specie(specie, species[specie]);
            map[m.id] = m;
          }
          SPECIES_BY_ID.push(map);
          gen++;
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (SPECIES_1_1 && !SPECIES_1_1.done && (_a = SPECIES_1["return"])) _a.call(SPECIES_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      var species;
      var map;
      var m;
      var specie;
      var SPECIES_1;
      var SPECIES_1_1;
    }
  });

  // node_modules/@smogon/calc/dist/data/types.js
  var require_types = __commonJS({
    "node_modules/@smogon/calc/dist/data/types.js"(exports) {
      "use strict";
      var __assign = exports && exports.__assign || function() {
        __assign = Object.assign || function(t2) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
              t2[p] = s[p];
          }
          return t2;
        };
        return __assign.apply(this, arguments);
      };
      var __generator = exports && exports.__generator || function(thisArg, body) {
        var _ = { label: 0, sent: function() {
          if (t2[0] & 1) throw t2[1];
          return t2[1];
        }, trys: [], ops: [] }, f, y, t2, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
          return this;
        }), g;
        function verb(n) {
          return function(v) {
            return step([n, v]);
          };
        }
        function step(op) {
          if (f) throw new TypeError("Generator is already executing.");
          while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t2 = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t2 = y["return"]) && t2.call(y), 0) : y.next) && !(t2 = t2.call(y, op[1])).done) return t2;
            if (y = 0, t2) op = [op[0] & 2, t2.value];
            switch (op[0]) {
              case 0:
              case 1:
                t2 = op;
                break;
              case 4:
                _.label++;
                return { value: op[1], done: false };
              case 5:
                _.label++;
                y = op[1];
                op = [0];
                continue;
              case 7:
                op = _.ops.pop();
                _.trys.pop();
                continue;
              default:
                if (!(t2 = _.trys, t2 = t2.length > 0 && t2[t2.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                  _ = 0;
                  continue;
                }
                if (op[0] === 3 && (!t2 || op[1] > t2[0] && op[1] < t2[3])) {
                  _.label = op[1];
                  break;
                }
                if (op[0] === 6 && _.label < t2[1]) {
                  _.label = t2[1];
                  t2 = op;
                  break;
                }
                if (t2 && _.label < t2[2]) {
                  _.label = t2[2];
                  _.ops.push(op);
                  break;
                }
                if (t2[2]) _.ops.pop();
                _.trys.pop();
                continue;
            }
            op = body.call(thisArg, _);
          } catch (e) {
            op = [6, e];
            y = 0;
          } finally {
            f = t2 = 0;
          }
          if (op[0] & 5) throw op[1];
          return { value: op[0] ? op[1] : void 0, done: true };
        }
      };
      var __values = exports && exports.__values || function(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
          next: function() {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
          }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
      };
      var e_1;
      var _a;
      exports.__esModule = true;
      exports.Types = exports.TYPE_CHART = void 0;
      var util_1 = require_util();
      var RBY = {
        "???": {
          Normal: 1,
          Grass: 1,
          Fire: 1,
          Water: 1,
          Electric: 1,
          Ice: 1,
          Flying: 1,
          Bug: 1,
          Poison: 1,
          Ground: 1,
          Rock: 1,
          Fighting: 1,
          Psychic: 1,
          Ghost: 1,
          Dragon: 1
        },
        Normal: {
          "???": 1,
          Normal: 1,
          Grass: 1,
          Fire: 1,
          Water: 1,
          Electric: 1,
          Ice: 1,
          Flying: 1,
          Bug: 1,
          Poison: 1,
          Ground: 1,
          Rock: 0.5,
          Fighting: 1,
          Psychic: 1,
          Ghost: 0,
          Dragon: 1
        },
        Grass: {
          "???": 1,
          Normal: 1,
          Grass: 0.5,
          Fire: 0.5,
          Water: 2,
          Electric: 1,
          Ice: 1,
          Flying: 0.5,
          Bug: 0.5,
          Poison: 0.5,
          Ground: 2,
          Rock: 2,
          Fighting: 1,
          Psychic: 1,
          Ghost: 1,
          Dragon: 0.5
        },
        Fire: {
          "???": 1,
          Normal: 1,
          Grass: 2,
          Fire: 0.5,
          Water: 0.5,
          Electric: 1,
          Ice: 2,
          Flying: 1,
          Bug: 2,
          Poison: 1,
          Ground: 1,
          Rock: 0.5,
          Fighting: 1,
          Psychic: 1,
          Ghost: 1,
          Dragon: 0.5
        },
        Water: {
          "???": 1,
          Normal: 1,
          Grass: 0.5,
          Fire: 2,
          Water: 0.5,
          Electric: 1,
          Ice: 1,
          Flying: 1,
          Bug: 1,
          Poison: 1,
          Ground: 2,
          Rock: 2,
          Fighting: 1,
          Psychic: 1,
          Ghost: 1,
          Dragon: 0.5
        },
        Electric: {
          "???": 1,
          Normal: 1,
          Grass: 0.5,
          Fire: 1,
          Water: 2,
          Electric: 0.5,
          Ice: 1,
          Flying: 2,
          Bug: 1,
          Poison: 1,
          Ground: 0,
          Rock: 1,
          Fighting: 1,
          Psychic: 1,
          Ghost: 1,
          Dragon: 0.5
        },
        Ice: {
          "???": 1,
          Normal: 1,
          Grass: 2,
          Fire: 1,
          Water: 0.5,
          Electric: 1,
          Ice: 0.5,
          Flying: 2,
          Bug: 1,
          Poison: 1,
          Ground: 2,
          Rock: 1,
          Fighting: 1,
          Psychic: 1,
          Ghost: 1,
          Dragon: 2
        },
        Flying: {
          "???": 1,
          Normal: 1,
          Grass: 2,
          Fire: 1,
          Water: 1,
          Electric: 0.5,
          Ice: 1,
          Flying: 1,
          Bug: 2,
          Poison: 1,
          Ground: 1,
          Rock: 0.5,
          Fighting: 2,
          Psychic: 1,
          Ghost: 1,
          Dragon: 1
        },
        Bug: {
          "???": 1,
          Normal: 1,
          Grass: 2,
          Fire: 0.5,
          Water: 1,
          Electric: 1,
          Ice: 1,
          Flying: 0.5,
          Bug: 1,
          Poison: 2,
          Ground: 1,
          Rock: 1,
          Fighting: 0.5,
          Psychic: 2,
          Ghost: 0.5,
          Dragon: 1
        },
        Poison: {
          "???": 1,
          Normal: 1,
          Grass: 2,
          Fire: 1,
          Water: 1,
          Electric: 1,
          Ice: 1,
          Flying: 1,
          Bug: 2,
          Poison: 0.5,
          Ground: 0.5,
          Rock: 0.5,
          Fighting: 1,
          Psychic: 1,
          Ghost: 0.5,
          Dragon: 1
        },
        Ground: {
          "???": 1,
          Normal: 1,
          Grass: 0.5,
          Fire: 2,
          Water: 1,
          Electric: 2,
          Ice: 1,
          Flying: 0,
          Bug: 0.5,
          Poison: 2,
          Ground: 1,
          Rock: 2,
          Fighting: 1,
          Psychic: 1,
          Ghost: 1,
          Dragon: 1
        },
        Rock: {
          "???": 1,
          Normal: 1,
          Grass: 1,
          Fire: 2,
          Water: 1,
          Electric: 1,
          Ice: 2,
          Flying: 2,
          Bug: 2,
          Poison: 1,
          Ground: 0.5,
          Rock: 1,
          Fighting: 0.5,
          Psychic: 1,
          Ghost: 1,
          Dragon: 1
        },
        Fighting: {
          "???": 1,
          Normal: 2,
          Grass: 1,
          Fire: 1,
          Water: 1,
          Electric: 1,
          Ice: 2,
          Flying: 0.5,
          Bug: 0.5,
          Poison: 0.5,
          Ground: 1,
          Rock: 2,
          Fighting: 1,
          Psychic: 0.5,
          Ghost: 0,
          Dragon: 1
        },
        Psychic: {
          "???": 1,
          Normal: 1,
          Grass: 1,
          Fire: 1,
          Water: 1,
          Electric: 1,
          Ice: 1,
          Flying: 1,
          Bug: 1,
          Poison: 2,
          Ground: 1,
          Rock: 1,
          Fighting: 2,
          Psychic: 0.5,
          Ghost: 1,
          Dragon: 1
        },
        Ghost: {
          "???": 1,
          Normal: 0,
          Grass: 1,
          Fire: 1,
          Water: 1,
          Electric: 1,
          Ice: 1,
          Flying: 1,
          Bug: 1,
          Poison: 1,
          Ground: 1,
          Rock: 1,
          Fighting: 1,
          Psychic: 0,
          Ghost: 2,
          Dragon: 1
        },
        Dragon: {
          "???": 1,
          Normal: 1,
          Grass: 1,
          Fire: 1,
          Water: 1,
          Electric: 1,
          Ice: 1,
          Flying: 1,
          Bug: 1,
          Poison: 1,
          Ground: 1,
          Rock: 1,
          Fighting: 1,
          Psychic: 1,
          Ghost: 1,
          Dragon: 2
        }
      };
      var GSC = (0, util_1.extend)(true, {}, RBY, {
        "???": { Dark: 1, Steel: 1 },
        Normal: { Dark: 1, Steel: 0.5 },
        Grass: { Dark: 1, Steel: 0.5 },
        Fire: { Dark: 1, Steel: 2 },
        Water: { Dark: 1, Steel: 1 },
        Electric: { Dark: 1, Steel: 1 },
        Ice: { Fire: 0.5, Dark: 1, Steel: 0.5 },
        Flying: { Dark: 1, Steel: 0.5 },
        Bug: { Poison: 0.5, Dark: 2, Steel: 0.5 },
        Poison: { Bug: 1, Dark: 1, Steel: 0 },
        Ground: { Dark: 1, Steel: 2 },
        Rock: { Dark: 1, Steel: 0.5 },
        Fighting: { Dark: 2, Steel: 2 },
        Psychic: { Dark: 0, Steel: 0.5 },
        Ghost: { Psychic: 2, Dark: 0.5, Steel: 0.5 },
        Dragon: { Dark: 1, Steel: 0.5 },
        Dark: {
          "???": 1,
          Normal: 1,
          Grass: 1,
          Fire: 1,
          Water: 1,
          Electric: 1,
          Ice: 1,
          Flying: 1,
          Bug: 1,
          Poison: 1,
          Ground: 1,
          Rock: 1,
          Fighting: 0.5,
          Psychic: 2,
          Ghost: 2,
          Dragon: 1,
          Dark: 0.5,
          Steel: 0.5
        },
        Steel: {
          "???": 1,
          Normal: 1,
          Grass: 1,
          Fire: 0.5,
          Water: 0.5,
          Electric: 0.5,
          Ice: 2,
          Flying: 1,
          Bug: 1,
          Poison: 1,
          Ground: 1,
          Rock: 2,
          Fighting: 1,
          Psychic: 1,
          Ghost: 1,
          Dragon: 1,
          Dark: 1,
          Steel: 0.5
        }
      });
      var ADV = GSC;
      var DPP = GSC;
      var BW = GSC;
      var XY = (0, util_1.extend)(true, {}, GSC, {
        "???": { Fairy: 1 },
        Normal: { Fairy: 1 },
        Grass: { Fairy: 1 },
        Fire: { Fairy: 1 },
        Water: { Fairy: 1 },
        Electric: { Fairy: 1 },
        Ice: { Fairy: 1 },
        Flying: { Fairy: 1 },
        Bug: { Fairy: 0.5 },
        Poison: { Fairy: 2 },
        Ground: { Fairy: 1 },
        Rock: { Fairy: 1 },
        Fighting: { Fairy: 0.5 },
        Psychic: { Fairy: 1 },
        Ghost: { Steel: 1, Fairy: 1 },
        Dragon: { Fairy: 0 },
        Dark: { Steel: 1, Fairy: 0.5 },
        Steel: { Fairy: 2 },
        Fairy: {
          "???": 1,
          Normal: 1,
          Grass: 1,
          Fire: 0.5,
          Water: 1,
          Electric: 1,
          Ice: 1,
          Flying: 1,
          Bug: 1,
          Poison: 0.5,
          Ground: 1,
          Rock: 1,
          Fighting: 2,
          Psychic: 1,
          Ghost: 1,
          Dragon: 2,
          Dark: 2,
          Steel: 0.5,
          Fairy: 1
        }
      });
      var SM = XY;
      var SS = SM;
      var SV = (0, util_1.extend)(true, {}, SS, {
        "???": { Stellar: 1 },
        Normal: { Stellar: 1 },
        Grass: { Stellar: 1 },
        Fire: { Stellar: 1 },
        Water: { Stellar: 1 },
        Electric: { Stellar: 1 },
        Ice: { Stellar: 1 },
        Flying: { Stellar: 1 },
        Bug: { Stellar: 1 },
        Poison: { Stellar: 1 },
        Ground: { Stellar: 1 },
        Rock: { Stellar: 1 },
        Fighting: { Stellar: 1 },
        Psychic: { Stellar: 1 },
        Ghost: { Stellar: 1 },
        Dragon: { Stellar: 1 },
        Dark: { Stellar: 1 },
        Steel: { Stellar: 1 },
        Fairy: { Stellar: 1 },
        Stellar: {
          "???": 1
        }
      });
      exports.TYPE_CHART = [{}, RBY, GSC, ADV, DPP, BW, XY, SM, SS, SV];
      var Types = (function() {
        function Types2(gen) {
          this.gen = gen;
        }
        Types2.prototype.get = function(id) {
          return TYPES_BY_ID[this.gen][id];
        };
        Types2.prototype[Symbol.iterator] = function() {
          var _a2, _b, _c, _i, id;
          return __generator(this, function(_d) {
            switch (_d.label) {
              case 0:
                _a2 = TYPES_BY_ID[this.gen];
                _b = [];
                for (_c in _a2)
                  _b.push(_c);
                _i = 0;
                _d.label = 1;
              case 1:
                if (!(_i < _b.length)) return [3, 4];
                _c = _b[_i];
                if (!(_c in _a2)) return [3, 3];
                id = _c;
                return [4, this.get(id)];
              case 2:
                _d.sent();
                _d.label = 3;
              case 3:
                _i++;
                return [3, 1];
              case 4:
                return [2];
            }
          });
        };
        return Types2;
      })();
      exports.Types = Types;
      var Type = /* @__PURE__ */ (function() {
        function Type2(name, effectiveness) {
          this.kind = "Type";
          this.id = (0, util_1.toID)(name);
          this.name = name;
          this.effectiveness = effectiveness;
        }
        return Type2;
      })();
      var TYPES_BY_ID = [];
      try {
        for (TYPE_CHART_1 = __values(exports.TYPE_CHART), TYPE_CHART_1_1 = TYPE_CHART_1.next(); !TYPE_CHART_1_1.done; TYPE_CHART_1_1 = TYPE_CHART_1.next()) {
          typeChart = TYPE_CHART_1_1.value;
          map = {};
          for (type in typeChart) {
            t = new Type(type, __assign({}, typeChart[type]));
            map[t.id] = t;
          }
          TYPES_BY_ID.push(map);
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (TYPE_CHART_1_1 && !TYPE_CHART_1_1.done && (_a = TYPE_CHART_1["return"])) _a.call(TYPE_CHART_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      var typeChart;
      var map;
      var t;
      var type;
      var TYPE_CHART_1;
      var TYPE_CHART_1_1;
    }
  });

  // node_modules/@smogon/calc/dist/data/natures.js
  var require_natures = __commonJS({
    "node_modules/@smogon/calc/dist/data/natures.js"(exports) {
      "use strict";
      var __generator = exports && exports.__generator || function(thisArg, body) {
        var _ = { label: 0, sent: function() {
          if (t[0] & 1) throw t[1];
          return t[1];
        }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
          return this;
        }), g;
        function verb(n2) {
          return function(v) {
            return step([n2, v]);
          };
        }
        function step(op) {
          if (f) throw new TypeError("Generator is already executing.");
          while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
              case 0:
              case 1:
                t = op;
                break;
              case 4:
                _.label++;
                return { value: op[1], done: false };
              case 5:
                _.label++;
                y = op[1];
                op = [0];
                continue;
              case 7:
                op = _.ops.pop();
                _.trys.pop();
                continue;
              default:
                if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                  _ = 0;
                  continue;
                }
                if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                  _.label = op[1];
                  break;
                }
                if (op[0] === 6 && _.label < t[1]) {
                  _.label = t[1];
                  t = op;
                  break;
                }
                if (t && _.label < t[2]) {
                  _.label = t[2];
                  _.ops.push(op);
                  break;
                }
                if (t[2]) _.ops.pop();
                _.trys.pop();
                continue;
            }
            op = body.call(thisArg, _);
          } catch (e) {
            op = [6, e];
            y = 0;
          } finally {
            f = t = 0;
          }
          if (op[0] & 5) throw op[1];
          return { value: op[0] ? op[1] : void 0, done: true };
        }
      };
      var __read = exports && exports.__read || function(o, n2) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
          while ((n2 === void 0 || n2-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
          e = { error };
        } finally {
          try {
            if (r && !r.done && (m = i["return"])) m.call(i);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      };
      exports.__esModule = true;
      exports.Natures = exports.NATURES = void 0;
      var util_1 = require_util();
      exports.NATURES = {
        Adamant: ["atk", "spa"],
        Bashful: ["spa", "spa"],
        Bold: ["def", "atk"],
        Brave: ["atk", "spe"],
        Calm: ["spd", "atk"],
        Careful: ["spd", "spa"],
        Docile: ["def", "def"],
        Gentle: ["spd", "def"],
        Hardy: ["atk", "atk"],
        Hasty: ["spe", "def"],
        Impish: ["def", "spa"],
        Jolly: ["spe", "spa"],
        Lax: ["def", "spd"],
        Lonely: ["atk", "def"],
        Mild: ["spa", "def"],
        Modest: ["spa", "atk"],
        Naive: ["spe", "spd"],
        Naughty: ["atk", "spd"],
        Quiet: ["spa", "spe"],
        Quirky: ["spd", "spd"],
        Rash: ["spa", "spd"],
        Relaxed: ["def", "spe"],
        Sassy: ["spd", "spe"],
        Serious: ["spe", "spe"],
        Timid: ["spe", "atk"]
      };
      var Natures = (function() {
        function Natures2() {
        }
        Natures2.prototype.get = function(id) {
          return NATURES_BY_ID[id];
        };
        Natures2.prototype[Symbol.iterator] = function() {
          var _a, _b, _c, _i, id;
          return __generator(this, function(_d) {
            switch (_d.label) {
              case 0:
                _a = NATURES_BY_ID;
                _b = [];
                for (_c in _a)
                  _b.push(_c);
                _i = 0;
                _d.label = 1;
              case 1:
                if (!(_i < _b.length)) return [3, 4];
                _c = _b[_i];
                if (!(_c in _a)) return [3, 3];
                id = _c;
                return [4, this.get(id)];
              case 2:
                _d.sent();
                _d.label = 3;
              case 3:
                _i++;
                return [3, 1];
              case 4:
                return [2];
            }
          });
        };
        return Natures2;
      })();
      exports.Natures = Natures;
      var Nature = /* @__PURE__ */ (function() {
        function Nature2(name, _a) {
          var _b = __read(_a, 2), plus = _b[0], minus = _b[1];
          this.kind = "Nature";
          this.id = (0, util_1.toID)(name);
          this.name = name;
          this.plus = plus;
          this.minus = minus;
        }
        return Nature2;
      })();
      var NATURES_BY_ID = {};
      for (nature in exports.NATURES) {
        n = new Nature(nature, exports.NATURES[nature]);
        NATURES_BY_ID[n.id] = n;
      }
      var n;
      var nature;
    }
  });

  // node_modules/@smogon/calc/dist/data/index.js
  var require_data = __commonJS({
    "node_modules/@smogon/calc/dist/data/index.js"(exports) {
      "use strict";
      exports.__esModule = true;
      exports.Generations = void 0;
      var abilities_1 = require_abilities();
      var items_1 = require_items();
      var moves_1 = require_moves();
      var species_1 = require_species();
      var types_1 = require_types();
      var natures_1 = require_natures();
      exports.Generations = new ((function() {
        function class_1() {
        }
        class_1.prototype.get = function(gen) {
          return new Generation(gen);
        };
        return class_1;
      })())();
      var Generation = /* @__PURE__ */ (function() {
        function Generation2(num) {
          this.num = num;
          this.abilities = new abilities_1.Abilities(num);
          this.items = new items_1.Items(num);
          this.moves = new moves_1.Moves(num);
          this.species = new species_1.Species(num);
          this.types = new types_1.Types(num);
          this.natures = new natures_1.Natures();
        }
        return Generation2;
      })();
    }
  });

  // node_modules/@smogon/calc/dist/field.js
  var require_field = __commonJS({
    "node_modules/@smogon/calc/dist/field.js"(exports) {
      "use strict";
      var __read = exports && exports.__read || function(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
          while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
          e = { error };
        } finally {
          try {
            if (r && !r.done && (m = i["return"])) m.call(i);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      };
      exports.__esModule = true;
      exports.Side = exports.Field = void 0;
      var Field2 = (function() {
        function Field3(field) {
          if (field === void 0) {
            field = {};
          }
          this.gameType = field.gameType || "Singles";
          this.terrain = field.terrain;
          this.weather = field.weather;
          this.isMagicRoom = !!field.isMagicRoom;
          this.isWonderRoom = !!field.isWonderRoom;
          this.isGravity = !!field.isGravity;
          this.isAuraBreak = field.isAuraBreak || false;
          this.isFairyAura = field.isFairyAura || false;
          this.isDarkAura = field.isDarkAura || false;
          this.isBeadsOfRuin = field.isBeadsOfRuin || false;
          this.isSwordOfRuin = field.isSwordOfRuin || false;
          this.isTabletsOfRuin = field.isTabletsOfRuin || false;
          this.isVesselOfRuin = field.isVesselOfRuin || false;
          this.attackerSide = new Side(field.attackerSide || {});
          this.defenderSide = new Side(field.defenderSide || {});
        }
        Field3.prototype.hasWeather = function() {
          var weathers = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            weathers[_i] = arguments[_i];
          }
          return !!(this.weather && weathers.includes(this.weather));
        };
        Field3.prototype.hasTerrain = function() {
          var terrains = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            terrains[_i] = arguments[_i];
          }
          return !!(this.terrain && terrains.includes(this.terrain));
        };
        Field3.prototype.swap = function() {
          var _a;
          _a = __read([this.defenderSide, this.attackerSide], 2), this.attackerSide = _a[0], this.defenderSide = _a[1];
          return this;
        };
        Field3.prototype.clone = function() {
          return new Field3({
            gameType: this.gameType,
            weather: this.weather,
            terrain: this.terrain,
            isMagicRoom: this.isMagicRoom,
            isWonderRoom: this.isWonderRoom,
            isGravity: this.isGravity,
            attackerSide: this.attackerSide,
            defenderSide: this.defenderSide,
            isAuraBreak: this.isAuraBreak,
            isDarkAura: this.isDarkAura,
            isFairyAura: this.isFairyAura,
            isBeadsOfRuin: this.isBeadsOfRuin,
            isSwordOfRuin: this.isSwordOfRuin,
            isTabletsOfRuin: this.isTabletsOfRuin,
            isVesselOfRuin: this.isVesselOfRuin
          });
        };
        return Field3;
      })();
      exports.Field = Field2;
      var Side = (function() {
        function Side2(side) {
          if (side === void 0) {
            side = {};
          }
          this.spikes = side.spikes || 0;
          this.steelsurge = !!side.steelsurge;
          this.vinelash = !!side.vinelash;
          this.wildfire = !!side.wildfire;
          this.cannonade = !!side.cannonade;
          this.volcalith = !!side.volcalith;
          this.isSR = !!side.isSR;
          this.isReflect = !!side.isReflect;
          this.isLightScreen = !!side.isLightScreen;
          this.isProtected = !!side.isProtected;
          this.isSeeded = !!side.isSeeded;
          this.isSaltCured = !!side.isSaltCured;
          this.isForesight = !!side.isForesight;
          this.isTailwind = !!side.isTailwind;
          this.isHelpingHand = !!side.isHelpingHand;
          this.isFlowerGift = !!side.isFlowerGift;
          this.isPowerTrick = !!side.isPowerTrick;
          this.isFriendGuard = !!side.isFriendGuard;
          this.isAuroraVeil = !!side.isAuroraVeil;
          this.isBattery = !!side.isBattery;
          this.isPowerSpot = !!side.isPowerSpot;
          this.isSteelySpirit = !!side.isSteelySpirit;
          this.isSwitching = side.isSwitching;
        }
        Side2.prototype.clone = function() {
          return new Side2(this);
        };
        return Side2;
      })();
      exports.Side = Side;
    }
  });

  // node_modules/@smogon/calc/dist/items.js
  var require_items2 = __commonJS({
    "node_modules/@smogon/calc/dist/items.js"(exports) {
      "use strict";
      exports.__esModule = true;
      exports.getMultiAttack = exports.getTechnoBlast = exports.getNaturalGift = exports.getFlingPower = exports.getBerryResistType = exports.getItemBoostType = exports.SEED_BOOSTED_STAT = void 0;
      var util_1 = require_util();
      exports.SEED_BOOSTED_STAT = {
        "Electric Seed": "def",
        "Grassy Seed": "def",
        "Misty Seed": "spd",
        "Psychic Seed": "spd"
      };
      function getItemBoostType(item) {
        switch (item) {
          case "Draco Plate":
          case "Dragon Fang":
            return "Dragon";
          case "Dread Plate":
          case "Black Glasses":
            return "Dark";
          case "Earth Plate":
          case "Soft Sand":
            return "Ground";
          case "Fist Plate":
          case "Black Belt":
            return "Fighting";
          case "Flame Plate":
          case "Charcoal":
            return "Fire";
          case "Icicle Plate":
          case "Never-Melt Ice":
            return "Ice";
          case "Insect Plate":
          case "Silver Powder":
            return "Bug";
          case "Iron Plate":
          case "Metal Coat":
            return "Steel";
          case "Meadow Plate":
          case "Rose Incense":
          case "Miracle Seed":
            return "Grass";
          case "Mind Plate":
          case "Odd Incense":
          case "Twisted Spoon":
            return "Psychic";
          case "Fairy Feather":
          case "Pixie Plate":
            return "Fairy";
          case "Sky Plate":
          case "Sharp Beak":
            return "Flying";
          case "Splash Plate":
          case "Sea Incense":
          case "Wave Incense":
          case "Mystic Water":
            return "Water";
          case "Spooky Plate":
          case "Spell Tag":
            return "Ghost";
          case "Stone Plate":
          case "Rock Incense":
          case "Hard Stone":
            return "Rock";
          case "Toxic Plate":
          case "Poison Barb":
            return "Poison";
          case "Zap Plate":
          case "Magnet":
            return "Electric";
          case "Silk Scarf":
          case "Pink Bow":
          case "Polkadot Bow":
            return "Normal";
          default:
            return void 0;
        }
      }
      exports.getItemBoostType = getItemBoostType;
      function getBerryResistType(berry) {
        switch (berry) {
          case "Chilan Berry":
            return "Normal";
          case "Occa Berry":
            return "Fire";
          case "Passho Berry":
            return "Water";
          case "Wacan Berry":
            return "Electric";
          case "Rindo Berry":
            return "Grass";
          case "Yache Berry":
            return "Ice";
          case "Chople Berry":
            return "Fighting";
          case "Kebia Berry":
            return "Poison";
          case "Shuca Berry":
            return "Ground";
          case "Coba Berry":
            return "Flying";
          case "Payapa Berry":
            return "Psychic";
          case "Tanga Berry":
            return "Bug";
          case "Charti Berry":
            return "Rock";
          case "Kasib Berry":
            return "Ghost";
          case "Haban Berry":
            return "Dragon";
          case "Colbur Berry":
            return "Dark";
          case "Babiri Berry":
            return "Steel";
          case "Roseli Berry":
            return "Fairy";
          default:
            return void 0;
        }
      }
      exports.getBerryResistType = getBerryResistType;
      var FLING_120 = /* @__PURE__ */ new Set([
        "TR24",
        "TR28",
        "TR34",
        "TR39",
        "TR53",
        "TR55",
        "TR64",
        "TR66",
        "TR72",
        "TR73"
      ]);
      var FLING_100 = /* @__PURE__ */ new Set([
        "Hard Stone",
        "Room Service",
        "Claw Fossil",
        "Dome Fossil",
        "Helix Fossil",
        "Old Amber",
        "Root Fossil",
        "Armor Fossil",
        "Old Amber",
        "Fossilized Bird",
        "Fossilized Dino",
        "Fossilized Drake",
        "Fossilized Fish",
        "Plume Fossil",
        "Jaw Fossil",
        "Cover Fossil",
        "Sail Fossil",
        "Rare Bone",
        "Skull Fossil",
        "TR10",
        "TR31",
        "TR75"
      ]);
      var FLING_90 = /* @__PURE__ */ new Set([
        "Deep Sea Tooth",
        "Thick Club",
        "TR02",
        "TR04",
        "TR05",
        "TR08",
        "TR11",
        "TR22",
        "TR35",
        "TR42",
        "TR45",
        "TR50",
        "TR61",
        "TR65",
        "TR67",
        "TR86",
        "TR90",
        "TR96"
      ]);
      var FLING_85 = /* @__PURE__ */ new Set(["TR01", "TR41", "TR62", "TR93", "TR97", "TR98"]);
      var FLING_80 = /* @__PURE__ */ new Set([
        "Assault Vest",
        "Blunder Policy",
        "Chipped Pot",
        "Cracked Pot",
        "Heavy-Duty Boots",
        "Weakness Policy",
        "Quick Claw",
        "Dawn Stone",
        "Dusk Stone",
        "Electirizer",
        "Magmarizer",
        "Oval Stone",
        "Protector",
        "Sachet",
        "Whipped Dream",
        "Razor Claw",
        "Shiny Stone",
        "TR16",
        "TR18",
        "TR19",
        "TR25",
        "TR32",
        "TR33",
        "TR47",
        "TR56",
        "TR57",
        "TR58",
        "TR59",
        "TR60",
        "TR63",
        "TR69",
        "TR70",
        "TR74",
        "TR84",
        "TR87",
        "TR92",
        "TR95",
        "TR99"
      ]);
      var FLING_70 = /* @__PURE__ */ new Set([
        "Poison Barb",
        "Dragon Fang",
        "Power Anklet",
        "Power Band",
        "Power Belt",
        "Power Bracer",
        "Power Lens",
        "Power Weight"
      ]);
      var FLING_60 = /* @__PURE__ */ new Set([
        "Adamant Orb",
        "Damp Rock",
        "Heat Rock",
        "Leek",
        "Lustrous Orb",
        "Macho Brace",
        "Rocky Helmet",
        "Stick",
        "Utility Umbrella",
        "Terrain Extender"
      ]);
      var FLING_30 = /* @__PURE__ */ new Set([
        "Absorb Bulb",
        "Black Belt",
        "Black Sludge",
        "Black Glasses",
        "Cell Battery",
        "Charcoal",
        "Deep Sea Scale",
        "Flame Orb",
        "King's Rock",
        "Life Orb",
        "Light Ball",
        "Light Clay",
        "Magnet",
        "Metal Coat",
        "Miracle Seed",
        "Mystic Water",
        "Never-Melt Ice",
        "Razor Fang",
        "Scope Lens",
        "Soul Dew",
        "Spell Tag",
        "Sweet Apple",
        "Tart Apple",
        "Throat Spray",
        "Toxic Orb",
        "Twisted Spoon",
        "Dragon Scale",
        "Energy Powder",
        "Fire Stone",
        "Leaf Stone",
        "Moon Stone",
        "Sun Stone",
        "Thunder Stone",
        "Up-Grade",
        "Water Stone",
        "Berry Juice",
        "Black Sludge",
        "Prism Scale",
        "Ice Stone",
        "Gold Bottle Cap",
        "Luminous Moss",
        "Eject Button",
        "Snowball",
        "Bottle Cap"
      ]);
      var FLING_10 = /* @__PURE__ */ new Set([
        "Air Balloon",
        "Berry Sweet",
        "Choice Band",
        "Choice Scarf",
        "Choice Specs",
        "Clover Sweet",
        "Destiny Knot",
        "Electric Seed",
        "Expert Belt",
        "Flower Sweet",
        "Focus Band",
        "Focus Sash",
        "Full Incense",
        "Grassy Seed",
        "Lagging Tail",
        "Lax Incense",
        "Leftovers",
        "Love Sweet",
        "Mental Herb",
        "Metal Powder",
        "Mint Berry",
        "Miracle Berry",
        "Misty Seed",
        "Muscle Band",
        "Power Herb",
        "Psychic Seed",
        "Odd Incense",
        "Quick Powder",
        "Reaper Cloth",
        "Red Card",
        "Ribbon Sweet",
        "Ring Target",
        "Rock Incense",
        "Rose Incense",
        "Sea Incense",
        "Shed Shell",
        "Silk Scarf",
        "Silver Powder",
        "Smooth Rock",
        "Soft Sand",
        "Soothe Bell",
        "Star Sweet",
        "Strawberry Sweet",
        "Wave Incense",
        "White Herb",
        "Wide Lens",
        "Wise Glasses",
        "Zoom Lens",
        "Silver Powder",
        "Power Herb",
        "TR00",
        "TR07",
        "TR12",
        "TR13",
        "TR14",
        "TR17",
        "TR20",
        "TR21",
        "TR23",
        "TR26",
        "TR27",
        "TR29",
        "TR30",
        "TR37",
        "TR38",
        "TR40",
        "TR44",
        "TR46",
        "TR48",
        "TR49",
        "TR51",
        "TR52",
        "TR54",
        "TR68",
        "TR76",
        "TR77",
        "TR79",
        "TR80",
        "TR83",
        "TR85",
        "TR88",
        "TR91"
      ]);
      function getFlingPower(item, gen) {
        if (gen === void 0) {
          gen = 9;
        }
        if (!item)
          return 0;
        if (item === "Big Nugget" && gen <= 7)
          return 30;
        if (["Big Nugget", "Iron Ball", "TR43", "TR71"].includes(item))
          return 130;
        if (FLING_120.has(item))
          return 85;
        if (["TR03", "TR06", "TR09", "TR15", "TR89"].includes(item))
          return 110;
        if (FLING_100.has(item))
          return 100;
        if (["TR36", "TR78", "TR81", "TR94"].includes(item))
          return 95;
        if (item.includes("Plate") || FLING_90.has(item))
          return 90;
        if (FLING_85.has(item))
          return 85;
        if (FLING_80.has(item))
          return 80;
        if (FLING_70.has(item))
          return 70;
        if (FLING_60.has(item))
          return 60;
        if (["Eject Pack", "Sharp Beak", "Dubious Disc"].includes(item))
          return 50;
        if (["Icy Rock", "Eviolite", "Lucky Punch"].includes(item))
          return 40;
        if (FLING_30.has(item))
          return 30;
        if (["TR82", "Pretty Feather"].includes(item))
          return 20;
        if (item.includes("Berry") || FLING_10.has(item))
          return 10;
        return 0;
      }
      exports.getFlingPower = getFlingPower;
      function getNaturalGift(gen, item) {
        var _a;
        var gift = (_a = gen.items.get((0, util_1.toID)(item))) === null || _a === void 0 ? void 0 : _a.naturalGift;
        return gift ? { t: gift.type, p: gift.basePower } : { t: "Normal", p: 1 };
      }
      exports.getNaturalGift = getNaturalGift;
      function getTechnoBlast(item) {
        switch (item) {
          case "Burn Drive":
            return "Fire";
          case "Chill Drive":
            return "Ice";
          case "Douse Drive":
            return "Water";
          case "Shock Drive":
            return "Electric";
          default:
            return void 0;
        }
      }
      exports.getTechnoBlast = getTechnoBlast;
      function getMultiAttack(item) {
        if (item.includes("Memory")) {
          return item.substring(0, item.indexOf(" "));
        }
        return void 0;
      }
      exports.getMultiAttack = getMultiAttack;
    }
  });

  // node_modules/@smogon/calc/dist/stats.js
  var require_stats = __commonJS({
    "node_modules/@smogon/calc/dist/stats.js"(exports) {
      "use strict";
      exports.__esModule = true;
      exports.Stats = exports.STATS = void 0;
      var util_1 = require_util();
      var RBY = ["hp", "atk", "def", "spc", "spe"];
      var GSC = ["hp", "atk", "def", "spa", "spd", "spe"];
      var ADV = GSC;
      var DPP = GSC;
      var BW = GSC;
      var XY = GSC;
      var SM = GSC;
      var SS = GSC;
      var SV = GSC;
      exports.STATS = [[], RBY, GSC, ADV, DPP, BW, XY, SM, SS, SV];
      var HP_TYPES = [
        "Fighting",
        "Flying",
        "Poison",
        "Ground",
        "Rock",
        "Bug",
        "Ghost",
        "Steel",
        "Fire",
        "Water",
        "Grass",
        "Electric",
        "Psychic",
        "Ice",
        "Dragon",
        "Dark"
      ];
      var HP = {
        Bug: { ivs: { atk: 30, def: 30, spd: 30 }, dvs: { atk: 13, def: 13 } },
        Dark: { ivs: {}, dvs: {} },
        Dragon: { ivs: { atk: 30 }, dvs: { def: 14 } },
        Electric: { ivs: { spa: 30 }, dvs: { atk: 14 } },
        Fighting: { ivs: { def: 30, spa: 30, spd: 30, spe: 30 }, dvs: { atk: 12, def: 12 } },
        Fire: { ivs: { atk: 30, spa: 30, spe: 30 }, dvs: { atk: 14, def: 12 } },
        Flying: { ivs: { hp: 30, atk: 30, def: 30, spa: 30, spd: 30 }, dvs: { atk: 12, def: 13 } },
        Ghost: { ivs: { def: 30, spd: 30 }, dvs: { atk: 13, def: 14 } },
        Grass: { ivs: { atk: 30, spa: 30 }, dvs: { atk: 14, def: 14 } },
        Ground: { ivs: { spa: 30, spd: 30 }, dvs: { atk: 12 } },
        Ice: { ivs: { atk: 30, def: 30 }, dvs: { def: 13 } },
        Poison: { ivs: { def: 30, spa: 30, spd: 30 }, dvs: { atk: 12, def: 14 } },
        Psychic: { ivs: { atk: 30, spe: 30 }, dvs: { def: 12 } },
        Rock: { ivs: { def: 30, spd: 30, spe: 30 }, dvs: { atk: 13, def: 12 } },
        Steel: { ivs: { spd: 30 }, dvs: { atk: 13 } },
        Water: { ivs: { atk: 30, def: 30, spa: 30 }, dvs: { atk: 14, def: 13 } }
      };
      exports.Stats = new ((function() {
        function class_1() {
        }
        class_1.prototype.displayStat = function(stat) {
          switch (stat) {
            case "hp":
              return "HP";
            case "atk":
              return "Atk";
            case "def":
              return "Def";
            case "spa":
              return "SpA";
            case "spd":
              return "SpD";
            case "spe":
              return "Spe";
            case "spc":
              return "Spc";
            default:
              throw new Error("unknown stat ".concat(stat));
          }
        };
        class_1.prototype.shortForm = function(stat) {
          switch (stat) {
            case "hp":
              return "hp";
            case "atk":
              return "at";
            case "def":
              return "df";
            case "spa":
              return "sa";
            case "spd":
              return "sd";
            case "spe":
              return "sp";
            case "spc":
              return "sl";
          }
        };
        class_1.prototype.getHPDV = function(ivs) {
          return this.IVToDV(ivs.atk) % 2 * 8 + this.IVToDV(ivs.def) % 2 * 4 + this.IVToDV(ivs.spe) % 2 * 2 + this.IVToDV(ivs.spc) % 2;
        };
        class_1.prototype.IVToDV = function(iv) {
          return Math.floor(iv / 2);
        };
        class_1.prototype.DVToIV = function(dv) {
          return dv * 2;
        };
        class_1.prototype.DVsToIVs = function(dvs) {
          var ivs = {};
          var dv;
          for (dv in dvs) {
            ivs[dv] = exports.Stats.DVToIV(dvs[dv]);
          }
          return ivs;
        };
        class_1.prototype.calcStat = function(gen, stat, base, iv, ev, level, nature) {
          if (gen.num < 1 || gen.num > 9)
            throw new Error("Invalid generation ".concat(gen.num));
          if (gen.num < 3)
            return this.calcStatRBY(stat, base, iv, level);
          return this.calcStatADV(gen.natures, stat, base, iv, ev, level, nature);
        };
        class_1.prototype.calcStatADV = function(natures, stat, base, iv, ev, level, nature) {
          if (stat === "hp") {
            return base === 1 ? base : Math.floor((base * 2 + iv + Math.floor(ev / 4)) * level / 100) + level + 10;
          } else {
            var mods = [void 0, void 0];
            if (nature) {
              var nat = natures.get((0, util_1.toID)(nature));
              mods = [nat === null || nat === void 0 ? void 0 : nat.plus, nat === null || nat === void 0 ? void 0 : nat.minus];
            }
            var n = mods[0] === stat && mods[1] === stat ? 1 : mods[0] === stat ? 1.1 : mods[1] === stat ? 0.9 : 1;
            return Math.floor((Math.floor((base * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5) * n);
          }
        };
        class_1.prototype.calcStatRBY = function(stat, base, iv, level) {
          return this.calcStatRBYFromDV(stat, base, this.IVToDV(iv), level);
        };
        class_1.prototype.calcStatRBYFromDV = function(stat, base, dv, level) {
          if (stat === "hp") {
            return Math.floor(((base + dv) * 2 + 63) * level / 100) + level + 10;
          } else {
            return Math.floor(((base + dv) * 2 + 63) * level / 100) + 5;
          }
        };
        class_1.prototype.getHiddenPowerIVs = function(gen, hpType) {
          var hp = HP[hpType];
          if (!hp)
            return void 0;
          return gen.num === 2 ? exports.Stats.DVsToIVs(hp.dvs) : hp.ivs;
        };
        class_1.prototype.getHiddenPower = function(gen, ivs) {
          var tr = function(num, bits) {
            if (bits === void 0) {
              bits = 0;
            }
            if (bits)
              return (num >>> 0) % Math.pow(2, bits);
            return num >>> 0;
          };
          var stats = { hp: 31, atk: 31, def: 31, spe: 31, spa: 31, spd: 31 };
          if (gen.num <= 2) {
            var atkDV = tr(ivs.atk / 2);
            var defDV = tr(ivs.def / 2);
            var speDV = tr(ivs.spe / 2);
            var spcDV = tr(ivs.spa / 2);
            return {
              type: HP_TYPES[4 * (atkDV % 4) + defDV % 4],
              power: tr((5 * ((spcDV >> 3) + 2 * (speDV >> 3) + 4 * (defDV >> 3) + 8 * (atkDV >> 3)) + spcDV % 4) / 2 + 31)
            };
          } else {
            var hpTypeX = 0;
            var hpPowerX = 0;
            var i = 1;
            for (var s in stats) {
              hpTypeX += i * (ivs[s] % 2);
              hpPowerX += i * (tr(ivs[s] / 2) % 2);
              i *= 2;
            }
            return {
              type: HP_TYPES[tr(hpTypeX * 15 / 63)],
              power: gen.num && gen.num < 6 ? tr(hpPowerX * 40 / 63) + 30 : 60
            };
          }
        };
        return class_1;
      })())();
    }
  });

  // node_modules/@smogon/calc/dist/mechanics/util.js
  var require_util2 = __commonJS({
    "node_modules/@smogon/calc/dist/mechanics/util.js"(exports) {
      "use strict";
      var __values = exports && exports.__values || function(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
          next: function() {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
          }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
      };
      var __read = exports && exports.__read || function(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
          while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
          e = { error };
        } finally {
          try {
            if (r && !r.done && (m = i["return"])) m.call(i);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      };
      var __spreadArray = exports && exports.__spreadArray || function(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
      };
      exports.__esModule = true;
      exports.OF32 = exports.OF16 = exports.pokeRound = exports.handleFixedDamageMoves = exports.getStatDescriptionText = exports.countBoosts = exports.getStellarStabMod = exports.getStabMod = exports.getWeight = exports.getShellSideArmCategory = exports.getFinalDamage = exports.isQPActive = exports.getQPBoostedStat = exports.getBaseDamage = exports.chainMods = exports.checkMultihitBoost = exports.checkSeedBoost = exports.checkInfiltrator = exports.checkEmbody = exports.checkWindRider = exports.checkDauntlessShield = exports.checkIntrepidSword = exports.checkDownload = exports.checkIntimidate = exports.checkRawStatChanges = exports.checkItem = exports.checkForecast = exports.checkTeraformZero = exports.checkAirLock = exports.getMoveEffectiveness = exports.getFinalSpeed = exports.computeFinalStats = exports.getModifiedStat = exports.isGrounded = void 0;
      var util_1 = require_util();
      var stats_1 = require_stats();
      var EV_ITEMS = [
        "Macho Brace",
        "Power Anklet",
        "Power Band",
        "Power Belt",
        "Power Bracer",
        "Power Lens",
        "Power Weight"
      ];
      function isGrounded(pokemon, field) {
        return field.isGravity || pokemon.hasItem("Iron Ball") || !pokemon.hasType("Flying") && !pokemon.hasAbility("Levitate") && !pokemon.hasItem("Air Balloon");
      }
      exports.isGrounded = isGrounded;
      function getModifiedStat(stat, mod, gen) {
        if (gen && gen.num < 3) {
          if (mod >= 0) {
            var pastGenBoostTable = [1, 1.5, 2, 2.5, 3, 3.5, 4];
            stat = Math.floor(stat * pastGenBoostTable[mod]);
          } else {
            var numerators = [100, 66, 50, 40, 33, 28, 25];
            stat = Math.floor(stat * numerators[-mod] / 100);
          }
          return Math.min(999, Math.max(1, stat));
        }
        var numerator = 0;
        var denominator = 1;
        var modernGenBoostTable = [
          [2, 8],
          [2, 7],
          [2, 6],
          [2, 5],
          [2, 4],
          [2, 3],
          [2, 2],
          [3, 2],
          [4, 2],
          [5, 2],
          [6, 2],
          [7, 2],
          [8, 2]
        ];
        stat = OF16(stat * modernGenBoostTable[6 + mod][numerator]);
        stat = Math.floor(stat / modernGenBoostTable[6 + mod][denominator]);
        return stat;
      }
      exports.getModifiedStat = getModifiedStat;
      function computeFinalStats(gen, attacker, defender, field) {
        var e_1, _a, e_2, _b;
        var stats = [];
        for (var _i = 4; _i < arguments.length; _i++) {
          stats[_i - 4] = arguments[_i];
        }
        var sides = [[attacker, field.attackerSide], [defender, field.defenderSide]];
        try {
          for (var sides_1 = __values(sides), sides_1_1 = sides_1.next(); !sides_1_1.done; sides_1_1 = sides_1.next()) {
            var _c = __read(sides_1_1.value, 2), pokemon = _c[0], side = _c[1];
            try {
              for (var stats_2 = (e_2 = void 0, __values(stats)), stats_2_1 = stats_2.next(); !stats_2_1.done; stats_2_1 = stats_2.next()) {
                var stat = stats_2_1.value;
                if (stat === "spe") {
                  pokemon.stats.spe = getFinalSpeed(gen, pokemon, field, side);
                } else {
                  pokemon.stats[stat] = getModifiedStat(pokemon.rawStats[stat], pokemon.boosts[stat], gen);
                }
              }
            } catch (e_2_1) {
              e_2 = { error: e_2_1 };
            } finally {
              try {
                if (stats_2_1 && !stats_2_1.done && (_b = stats_2["return"])) _b.call(stats_2);
              } finally {
                if (e_2) throw e_2.error;
              }
            }
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (sides_1_1 && !sides_1_1.done && (_a = sides_1["return"])) _a.call(sides_1);
          } finally {
            if (e_1) throw e_1.error;
          }
        }
      }
      exports.computeFinalStats = computeFinalStats;
      function getFinalSpeed(gen, pokemon, field, side) {
        var weather = field.weather || "";
        var terrain = field.terrain;
        var speed = getModifiedStat(pokemon.rawStats.spe, pokemon.boosts.spe, gen);
        var speedMods = [];
        if (side.isTailwind)
          speedMods.push(8192);
        if (pokemon.hasAbility("Unburden") && pokemon.abilityOn || pokemon.hasAbility("Chlorophyll") && weather.includes("Sun") || pokemon.hasAbility("Sand Rush") && weather === "Sand" || pokemon.hasAbility("Swift Swim") && weather.includes("Rain") || pokemon.hasAbility("Slush Rush") && ["Hail", "Snow"].includes(weather) || pokemon.hasAbility("Surge Surfer") && terrain === "Electric") {
          speedMods.push(8192);
        } else if (pokemon.hasAbility("Quick Feet") && pokemon.status) {
          speedMods.push(6144);
        } else if (pokemon.hasAbility("Slow Start") && pokemon.abilityOn) {
          speedMods.push(2048);
        } else if (isQPActive(pokemon, field) && getQPBoostedStat(pokemon, gen) === "spe") {
          speedMods.push(6144);
        }
        if (!(pokemon.hasAbility("Unburden") && pokemon.abilityOn)) {
          if (pokemon.hasItem("Choice Scarf")) {
            speedMods.push(6144);
          } else if (pokemon.hasItem.apply(pokemon, __spreadArray(["Iron Ball"], __read(EV_ITEMS), false))) {
            speedMods.push(2048);
          } else if (pokemon.hasItem("Quick Powder") && pokemon.named("Ditto")) {
            speedMods.push(8192);
          }
        }
        speed = OF32(pokeRound(speed * chainMods(speedMods, 410, 131172) / 4096));
        if (pokemon.hasStatus("par") && !pokemon.hasAbility("Quick Feet")) {
          speed = Math.floor(OF32(speed * (gen.num < 7 ? 25 : 50)) / 100);
        }
        speed = Math.min(gen.num <= 2 ? 999 : 1e4, speed);
        return Math.max(0, speed);
      }
      exports.getFinalSpeed = getFinalSpeed;
      function getMoveEffectiveness(gen, move, type, isGhostRevealed, isGravity, isRingTarget) {
        if (isGhostRevealed && type === "Ghost" && move.hasType("Normal", "Fighting")) {
          return 1;
        } else if (isGravity && type === "Flying" && move.hasType("Ground")) {
          return 1;
        } else if (move.named("Freeze-Dry") && type === "Water") {
          return 2;
        } else if (move.named("Nihil Light") && type === "Fairy") {
          return 1;
        } else {
          var effectiveness = gen.types.get((0, util_1.toID)(move.type)).effectiveness[type];
          if (effectiveness === 0 && isRingTarget) {
            effectiveness = 1;
          }
          if (move.named("Flying Press")) {
            effectiveness *= gen.types.get("flying").effectiveness[type];
          }
          return effectiveness;
        }
      }
      exports.getMoveEffectiveness = getMoveEffectiveness;
      function checkAirLock(pokemon, field) {
        if (pokemon.hasAbility("Air Lock", "Cloud Nine")) {
          field.weather = void 0;
        }
      }
      exports.checkAirLock = checkAirLock;
      function checkTeraformZero(pokemon, field) {
        if (pokemon.hasAbility("Teraform Zero") && pokemon.abilityOn) {
          field.weather = void 0;
          field.terrain = void 0;
        }
      }
      exports.checkTeraformZero = checkTeraformZero;
      function checkForecast(pokemon, weather) {
        if (pokemon.hasAbility("Forecast") && pokemon.named("Castform")) {
          switch (weather) {
            case "Sun":
            case "Harsh Sunshine":
              pokemon.types = ["Fire"];
              break;
            case "Rain":
            case "Heavy Rain":
              pokemon.types = ["Water"];
              break;
            case "Hail":
            case "Snow":
              pokemon.types = ["Ice"];
              break;
            default:
              pokemon.types = ["Normal"];
          }
        }
      }
      exports.checkForecast = checkForecast;
      function checkItem(pokemon, magicRoomActive) {
        if (pokemon.gen.num === 4 && pokemon.hasItem("Iron Ball"))
          return;
        if (pokemon.hasAbility("Klutz") && !EV_ITEMS.includes(pokemon.item) || magicRoomActive) {
          pokemon.disabledItem = pokemon.item;
          pokemon.item = "";
        }
      }
      exports.checkItem = checkItem;
      function checkRawStatChanges(pokemon, powerTrickActive, wonderRoomActive) {
        var _a, _b;
        if (powerTrickActive) {
          _a = __read([pokemon.rawStats.def, pokemon.rawStats.atk], 2), pokemon.rawStats.atk = _a[0], pokemon.rawStats.def = _a[1];
        }
        if (wonderRoomActive) {
          _b = __read([pokemon.rawStats.spd, pokemon.rawStats.def], 2), pokemon.rawStats.def = _b[0], pokemon.rawStats.spd = _b[1];
        }
      }
      exports.checkRawStatChanges = checkRawStatChanges;
      function checkIntimidate(gen, source, target) {
        var blocked = target.hasAbility("Clear Body", "White Smoke", "Hyper Cutter", "Full Metal Body") || gen.num >= 8 && target.hasAbility("Inner Focus", "Own Tempo", "Oblivious", "Scrappy") || target.hasItem("Clear Amulet");
        if (source.hasAbility("Intimidate") && source.abilityOn && !blocked) {
          if (target.hasAbility("Contrary", "Defiant", "Guard Dog")) {
            target.boosts.atk = Math.min(6, target.boosts.atk + 1);
          } else if (target.hasAbility("Simple")) {
            target.boosts.atk = Math.max(-6, target.boosts.atk - 2);
          } else {
            target.boosts.atk = Math.max(-6, target.boosts.atk - 1);
          }
          if (target.hasAbility("Competitive")) {
            target.boosts.spa = Math.min(6, target.boosts.spa + 2);
          }
        }
      }
      exports.checkIntimidate = checkIntimidate;
      function checkDownload(source, target, wonderRoomActive) {
        var _a;
        if (source.hasAbility("Download")) {
          var def = target.stats.def;
          var spd = target.stats.spd;
          if (wonderRoomActive)
            _a = __read([spd, def], 2), def = _a[0], spd = _a[1];
          if (spd <= def) {
            source.boosts.spa = Math.min(6, source.boosts.spa + 1);
          } else {
            source.boosts.atk = Math.min(6, source.boosts.atk + 1);
          }
        }
      }
      exports.checkDownload = checkDownload;
      function checkIntrepidSword(source, gen) {
        if (source.hasAbility("Intrepid Sword") && gen.num > 7) {
          source.boosts.atk = Math.min(6, source.boosts.atk + 1);
        }
      }
      exports.checkIntrepidSword = checkIntrepidSword;
      function checkDauntlessShield(source, gen) {
        if (source.hasAbility("Dauntless Shield") && gen.num > 7) {
          source.boosts.def = Math.min(6, source.boosts.def + 1);
        }
      }
      exports.checkDauntlessShield = checkDauntlessShield;
      function checkWindRider(source, attackingSide) {
        if (source.hasAbility("Wind Rider") && attackingSide.isTailwind) {
          source.boosts.atk = Math.min(6, source.boosts.atk + 1);
        }
      }
      exports.checkWindRider = checkWindRider;
      function checkEmbody(source, gen) {
        if (gen.num < 9)
          return;
        switch (source.ability) {
          case "Embody Aspect (Cornerstone)":
            source.boosts.def = Math.min(6, source.boosts.def + 1);
            break;
          case "Embody Aspect (Hearthflame)":
            source.boosts.atk = Math.min(6, source.boosts.atk + 1);
            break;
          case "Embody Aspect (Teal)":
            source.boosts.spe = Math.min(6, source.boosts.spe + 1);
            break;
          case "Embody Aspect (Wellspring)":
            source.boosts.spd = Math.min(6, source.boosts.spd + 1);
            break;
        }
      }
      exports.checkEmbody = checkEmbody;
      function checkInfiltrator(pokemon, affectedSide) {
        if (pokemon.hasAbility("Infiltrator")) {
          affectedSide.isReflect = false;
          affectedSide.isLightScreen = false;
          affectedSide.isAuroraVeil = false;
        }
      }
      exports.checkInfiltrator = checkInfiltrator;
      function checkSeedBoost(pokemon, field) {
        if (!pokemon.item)
          return;
        if (field.terrain && pokemon.item.includes("Seed")) {
          var terrainSeed = pokemon.item.substring(0, pokemon.item.indexOf(" "));
          if (field.hasTerrain(terrainSeed)) {
            if (terrainSeed === "Grassy" || terrainSeed === "Electric") {
              pokemon.boosts.def = pokemon.hasAbility("Contrary") ? Math.max(-6, pokemon.boosts.def - 1) : Math.min(6, pokemon.boosts.def + 1);
            } else {
              pokemon.boosts.spd = pokemon.hasAbility("Contrary") ? Math.max(-6, pokemon.boosts.spd - 1) : Math.min(6, pokemon.boosts.spd + 1);
            }
            pokemon.item = "";
          }
        }
      }
      exports.checkSeedBoost = checkSeedBoost;
      function checkMultihitBoost(gen, attacker, defender, move, field, desc, attackerUsedItem, defenderUsedItem) {
        if (attackerUsedItem === void 0) {
          attackerUsedItem = false;
        }
        if (defenderUsedItem === void 0) {
          defenderUsedItem = false;
        }
        if (move.named("Gyro Ball", "Electro Ball") && defender.hasAbility("Gooey", "Tangling Hair")) {
          if (attacker.hasItem("White Herb") && !attackerUsedItem) {
            desc.attackerItem = attacker.item;
            attackerUsedItem = true;
          } else {
            attacker.boosts.spe = Math.max(attacker.boosts.spe - 1, -6);
            attacker.stats.spe = getFinalSpeed(gen, attacker, field, field.attackerSide);
            desc.defenderAbility = defender.ability;
          }
        } else if (move.named("Power-Up Punch")) {
          attacker.boosts.atk = Math.min(attacker.boosts.atk + 1, 6);
          attacker.stats.atk = getModifiedStat(attacker.rawStats.atk, attacker.boosts.atk, gen);
        }
        var atkSimple = attacker.hasAbility("Simple") ? 2 : 1;
        var defSimple = defender.hasAbility("Simple") ? 2 : 1;
        if (!defenderUsedItem && (defender.hasItem("Luminous Moss") && move.hasType("Water")) || defender.hasItem("Maranga Berry") && move.category === "Special" || defender.hasItem("Kee Berry") && move.category === "Physical") {
          var defStat = defender.hasItem("Kee Berry") ? "def" : "spd";
          if (attacker.hasAbility("Unaware")) {
            desc.attackerAbility = attacker.ability;
          } else {
            if (defender.hasAbility("Contrary")) {
              desc.defenderAbility = defender.ability;
              if (defender.hasItem("White Herb") && !defenderUsedItem) {
                desc.defenderItem = defender.item;
                defenderUsedItem = true;
              } else {
                defender.boosts[defStat] = Math.max(-6, defender.boosts[defStat] - defSimple);
              }
            } else {
              defender.boosts[defStat] = Math.min(6, defender.boosts[defStat] + defSimple);
            }
            if (defSimple === 2)
              desc.defenderAbility = defender.ability;
            defender.stats[defStat] = getModifiedStat(defender.rawStats[defStat], defender.boosts[defStat], gen);
            desc.defenderItem = defender.item;
            defenderUsedItem = true;
          }
        }
        if (defender.hasAbility("Seed Sower")) {
          field.terrain = "Grassy";
        }
        if (defender.hasAbility("Sand Spit")) {
          field.weather = "Sand";
        }
        if (defender.hasAbility("Stamina")) {
          if (attacker.hasAbility("Unaware")) {
            desc.attackerAbility = attacker.ability;
          } else {
            defender.boosts.def = Math.min(defender.boosts.def + 1, 6);
            defender.stats.def = getModifiedStat(defender.rawStats.def, defender.boosts.def, gen);
            desc.defenderAbility = defender.ability;
          }
        } else if (defender.hasAbility("Water Compaction") && move.hasType("Water")) {
          if (attacker.hasAbility("Unaware")) {
            desc.attackerAbility = attacker.ability;
          } else {
            defender.boosts.def = Math.min(defender.boosts.def + 2, 6);
            defender.stats.def = getModifiedStat(defender.rawStats.def, defender.boosts.def, gen);
            desc.defenderAbility = defender.ability;
          }
        } else if (defender.hasAbility("Weak Armor")) {
          if (attacker.hasAbility("Unaware")) {
            desc.attackerAbility = attacker.ability;
          } else {
            if (defender.hasItem("White Herb") && !defenderUsedItem && defender.boosts.def === 0) {
              desc.defenderItem = defender.item;
              defenderUsedItem = true;
            } else {
              defender.boosts.def = Math.max(defender.boosts.def - 1, -6);
              defender.stats.def = getModifiedStat(defender.rawStats.def, defender.boosts.def, gen);
            }
            desc.defenderAbility = defender.ability;
          }
          defender.boosts.spe = Math.min(defender.boosts.spe + 2, 6);
          defender.stats.spe = getFinalSpeed(gen, defender, field, field.defenderSide);
        }
        if (move.dropsStats) {
          if (attacker.hasAbility("Unaware")) {
            desc.attackerAbility = attacker.ability;
          } else {
            var stat = move.category === "Special" ? "spa" : "atk";
            var boosts = attacker.boosts[stat];
            if (attacker.hasAbility("Contrary")) {
              boosts = Math.min(6, boosts + move.dropsStats);
              desc.attackerAbility = attacker.ability;
            } else {
              boosts = Math.max(-6, boosts - move.dropsStats * atkSimple);
            }
            if (atkSimple === 2)
              desc.attackerAbility = attacker.ability;
            if (attacker.hasItem("White Herb") && attacker.boosts[stat] < 0 && !attackerUsedItem) {
              boosts += move.dropsStats * atkSimple;
              desc.attackerItem = attacker.item;
              attackerUsedItem = true;
            }
            attacker.boosts[stat] = boosts;
            attacker.stats[stat] = getModifiedStat(attacker.rawStats[stat], defender.boosts[stat], gen);
          }
        }
        if (defender.hasAbility("Mummy", "Wandering Spirit", "Lingering Aroma") && move.flags.contact) {
          var oldAttackerAbility = attacker.ability;
          attacker.ability = defender.ability;
          if (desc.attackerAbility) {
            desc.defenderAbility = defender.ability;
          }
          if (defender.hasAbility("Wandering Spirit")) {
            defender.ability = oldAttackerAbility;
          }
        }
        return [attackerUsedItem, defenderUsedItem];
      }
      exports.checkMultihitBoost = checkMultihitBoost;
      function chainMods(mods, lowerBound, upperBound) {
        var e_3, _a;
        var M = 4096;
        try {
          for (var mods_1 = __values(mods), mods_1_1 = mods_1.next(); !mods_1_1.done; mods_1_1 = mods_1.next()) {
            var mod = mods_1_1.value;
            if (mod !== 4096) {
              M = M * mod + 2048 >> 12;
            }
          }
        } catch (e_3_1) {
          e_3 = { error: e_3_1 };
        } finally {
          try {
            if (mods_1_1 && !mods_1_1.done && (_a = mods_1["return"])) _a.call(mods_1);
          } finally {
            if (e_3) throw e_3.error;
          }
        }
        return Math.max(Math.min(M, upperBound), lowerBound);
      }
      exports.chainMods = chainMods;
      function getBaseDamage(level, basePower, attack, defense) {
        return Math.floor(OF32(Math.floor(OF32(OF32(Math.floor(2 * level / 5 + 2) * basePower) * attack) / defense) / 50 + 2));
      }
      exports.getBaseDamage = getBaseDamage;
      function getQPBoostedStat(pokemon, gen) {
        var e_4, _a;
        if (pokemon.boostedStat && pokemon.boostedStat !== "auto") {
          return pokemon.boostedStat;
        }
        var bestStat = "atk";
        try {
          for (var _b = __values(["def", "spa", "spd", "spe"]), _c = _b.next(); !_c.done; _c = _b.next()) {
            var stat = _c.value;
            if (getModifiedStat(pokemon.rawStats[stat], pokemon.boosts[stat], gen) > getModifiedStat(pokemon.rawStats[bestStat], pokemon.boosts[bestStat], gen)) {
              bestStat = stat;
            }
          }
        } catch (e_4_1) {
          e_4 = { error: e_4_1 };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
          } finally {
            if (e_4) throw e_4.error;
          }
        }
        return bestStat;
      }
      exports.getQPBoostedStat = getQPBoostedStat;
      function isQPActive(pokemon, field) {
        if (!pokemon.boostedStat) {
          return false;
        }
        var weather = field.weather || "";
        var terrain = field.terrain;
        return pokemon.hasAbility("Protosynthesis") && (weather.includes("Sun") || pokemon.hasItem("Booster Energy")) || pokemon.hasAbility("Quark Drive") && (terrain === "Electric" || pokemon.hasItem("Booster Energy")) || pokemon.boostedStat !== "auto";
      }
      exports.isQPActive = isQPActive;
      function getFinalDamage(baseAmount, i, effectiveness, isBurned, stabMod, finalMod, protect) {
        var damageAmount = Math.floor(OF32(baseAmount * (85 + i)) / 100);
        if (stabMod !== 4096)
          damageAmount = OF32(damageAmount * stabMod) / 4096;
        damageAmount = Math.floor(OF32(pokeRound(damageAmount) * effectiveness));
        if (isBurned)
          damageAmount = Math.floor(damageAmount / 2);
        if (protect)
          damageAmount = pokeRound(OF32(damageAmount * 1024) / 4096);
        return OF16(pokeRound(Math.max(1, OF32(damageAmount * finalMod) / 4096)));
      }
      exports.getFinalDamage = getFinalDamage;
      function getShellSideArmCategory(source, target, wonderRoomActive) {
        var physicalDamage = source.stats.atk / target.stats.def;
        var specialDamage = source.stats.spa / target.stats.spd;
        if (wonderRoomActive) {
          physicalDamage = source.stats.atk / target.stats.spd;
          specialDamage = source.stats.spa / target.stats.def;
        }
        return physicalDamage > specialDamage ? "Physical" : "Special";
      }
      exports.getShellSideArmCategory = getShellSideArmCategory;
      function getWeight(pokemon, desc, role) {
        var weightHG = pokemon.weightkg * 10;
        var abilityFactor = pokemon.hasAbility("Heavy Metal") ? 2 : pokemon.hasAbility("Light Metal") ? 0.5 : 1;
        if (abilityFactor !== 1) {
          weightHG = Math.max(Math.trunc(weightHG * abilityFactor), 1);
          desc["".concat(role, "Ability")] = pokemon.ability;
        }
        if (pokemon.hasItem("Float Stone")) {
          weightHG = Math.max(Math.trunc(weightHG * 0.5), 1);
          desc["".concat(role, "Item")] = pokemon.item;
        }
        return weightHG / 10;
      }
      exports.getWeight = getWeight;
      function getStabMod(pokemon, move, desc) {
        var stabMod = 4096;
        if (pokemon.hasOriginalType(move.type)) {
          stabMod += 2048;
        } else if (pokemon.hasAbility("Protean", "Libero") && !pokemon.teraType) {
          stabMod += 2048;
          desc.attackerAbility = pokemon.ability;
        }
        var teraType = pokemon.teraType;
        if (teraType === move.type && teraType !== "Stellar") {
          stabMod += 2048;
          desc.attackerTera = teraType;
        }
        if (pokemon.hasAbility("Adaptability") && pokemon.hasType(move.type)) {
          stabMod += teraType && pokemon.hasOriginalType(teraType) ? 1024 : 2048;
          desc.attackerAbility = pokemon.ability;
        }
        return stabMod;
      }
      exports.getStabMod = getStabMod;
      function getStellarStabMod(pokemon, move, stabMod, turns) {
        if (stabMod === void 0) {
          stabMod = 1;
        }
        if (turns === void 0) {
          turns = 0;
        }
        var isStellarBoosted = pokemon.teraType === "Stellar" && (move.isStellarFirstUse && turns === 0 || pokemon.named("Terapagos-Stellar"));
        if (isStellarBoosted) {
          if (pokemon.hasOriginalType(move.type)) {
            stabMod += 2048;
          } else {
            stabMod = 4915;
          }
        }
        return stabMod;
      }
      exports.getStellarStabMod = getStellarStabMod;
      function countBoosts(gen, boosts) {
        var e_5, _a;
        var sum = 0;
        var STATS = gen.num === 1 ? ["atk", "def", "spa", "spe"] : ["atk", "def", "spa", "spd", "spe"];
        try {
          for (var STATS_1 = __values(STATS), STATS_1_1 = STATS_1.next(); !STATS_1_1.done; STATS_1_1 = STATS_1.next()) {
            var stat = STATS_1_1.value;
            var boost = boosts[stat];
            if (boost && boost > 0)
              sum += boost;
          }
        } catch (e_5_1) {
          e_5 = { error: e_5_1 };
        } finally {
          try {
            if (STATS_1_1 && !STATS_1_1.done && (_a = STATS_1["return"])) _a.call(STATS_1);
          } finally {
            if (e_5) throw e_5.error;
          }
        }
        return sum;
      }
      exports.countBoosts = countBoosts;
      function getStatDescriptionText(gen, pokemon, stat, powerTrickActive, wonderRoomActive) {
        var initialStat = stat;
        if (wonderRoomActive) {
          if (stat === "def") {
            stat = "spd";
          } else if (stat === "spd") {
            stat = "def";
          }
        }
        if (powerTrickActive) {
          if (stat === "atk") {
            stat = "def";
          } else if (stat === "def") {
            stat = "atk";
          }
        }
        var nature = gen.natures.get((0, util_1.toID)(pokemon.nature));
        var desc = pokemon.evs[stat] + (stat === "hp" || nature.plus === nature.minus ? "" : nature.plus === stat ? "+" : nature.minus === stat ? "-" : "") + " " + stats_1.Stats.displayStat(initialStat);
        if (stat !== initialStat) {
          desc = desc + " (" + stats_1.Stats.displayStat(stat) + ")";
        }
        var iv = pokemon.ivs[stat];
        if (iv !== 31)
          desc += " ".concat(iv, " IVs");
        return desc;
      }
      exports.getStatDescriptionText = getStatDescriptionText;
      function handleFixedDamageMoves(attacker, move) {
        if (move.named("Seismic Toss", "Night Shade")) {
          return attacker.level;
        } else if (move.named("Dragon Rage")) {
          return 40;
        } else if (move.named("Sonic Boom")) {
          return 20;
        }
        return 0;
      }
      exports.handleFixedDamageMoves = handleFixedDamageMoves;
      function pokeRound(num) {
        return num % 1 > 0.5 ? Math.ceil(num) : Math.floor(num);
      }
      exports.pokeRound = pokeRound;
      function OF16(n) {
        return n > 65535 ? n % 65536 : n;
      }
      exports.OF16 = OF16;
      function OF32(n) {
        return n > 4294967295 ? n % 4294967296 : n;
      }
      exports.OF32 = OF32;
    }
  });

  // node_modules/@smogon/calc/dist/desc.js
  var require_desc = __commonJS({
    "node_modules/@smogon/calc/dist/desc.js"(exports) {
      "use strict";
      var __read = exports && exports.__read || function(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
          while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
          e = { error };
        } finally {
          try {
            if (r && !r.done && (m = i["return"])) m.call(i);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      };
      exports.__esModule = true;
      exports.getKOChance = exports.getRecoil = exports.getRecovery = exports.displayMove = exports.display = void 0;
      var result_1 = require_result();
      var util_1 = require_util();
      var util_2 = require_util2();
      function display(gen, attacker, defender, move, field, damage, rawDesc, notation, err) {
        if (notation === void 0) {
          notation = "%";
        }
        if (err === void 0) {
          err = true;
        }
        var _a = __read((0, result_1.damageRange)(damage), 2), min = _a[0], max = _a[1];
        var minDisplay = toDisplay(notation, min, defender.maxHP());
        var maxDisplay = toDisplay(notation, max, defender.maxHP());
        var desc = buildDescription(rawDesc, attacker, defender);
        var damageText = "".concat(min, "-").concat(max, " (").concat(minDisplay, " - ").concat(maxDisplay).concat(notation, ")");
        if (move.category === "Status" && !move.named("Nature Power"))
          return "".concat(desc, ": ").concat(damageText);
        var koChanceText = getKOChance(gen, attacker, defender, move, field, damage, err).text;
        return koChanceText ? "".concat(desc, ": ").concat(damageText, " -- ").concat(koChanceText) : "".concat(desc, ": ").concat(damageText);
      }
      exports.display = display;
      function displayMove(gen, attacker, defender, move, damage, notation) {
        if (notation === void 0) {
          notation = "%";
        }
        var _a = __read((0, result_1.damageRange)(damage), 2), min = _a[0], max = _a[1];
        var minDisplay = toDisplay(notation, min, defender.maxHP());
        var maxDisplay = toDisplay(notation, max, defender.maxHP());
        var recoveryText = getRecovery(gen, attacker, defender, move, damage, notation).text;
        var recoilText = getRecoil(gen, attacker, defender, move, damage, notation).text;
        return "".concat(minDisplay, " - ").concat(maxDisplay).concat(notation).concat(recoveryText && " (".concat(recoveryText, ")")).concat(recoilText && " (".concat(recoilText, ")"));
      }
      exports.displayMove = displayMove;
      function getRecovery(gen, attacker, defender, move, damage, notation) {
        var _a, _b;
        if (notation === void 0) {
          notation = "%";
        }
        var _c = __read((0, result_1.damageRange)(damage), 2), minDamage = _c[0], maxDamage = _c[1];
        var minD;
        var maxD;
        if (move.timesUsed && move.timesUsed > 1) {
          _a = __read((0, result_1.multiDamageRange)(damage), 2), minD = _a[0], maxD = _a[1];
        } else {
          minD = [minDamage];
          maxD = [maxDamage];
        }
        var recovery = [0, 0];
        var text = "";
        var ignoresShellBell = gen.num === 3 && move.named("Doom Desire", "Future Sight");
        if (attacker.hasItem("Shell Bell") && !ignoresShellBell) {
          for (var i = 0; i < minD.length; i++) {
            recovery[0] += minD[i] > 0 ? Math.max(Math.round(minD[i] / 8), 1) : 0;
            recovery[1] += maxD[i] > 0 ? Math.max(Math.round(maxD[i] / 8), 1) : 0;
          }
          var maxHealing = Math.round(defender.curHP() / 8);
          recovery[0] = Math.min(recovery[0], maxHealing);
          recovery[1] = Math.min(recovery[1], maxHealing);
        }
        if (move.named("G-Max Finale")) {
          recovery[0] += Math.round(attacker.maxHP() / 6);
          recovery[1] += Math.round(attacker.maxHP() / 6);
        }
        if (move.named("Pain Split")) {
          var average = Math.floor((attacker.curHP() + defender.curHP()) / 2);
          recovery[0] = recovery[1] = average - attacker.curHP();
        }
        if (move.drain) {
          if (attacker.hasAbility("Parental Bond") || move.hits > 1) {
            _b = __read((0, result_1.multiDamageRange)(damage), 2), minD = _b[0], maxD = _b[1];
          }
          var percentHealed = move.drain[0] / move.drain[1];
          var attackerHasBigRoot = attacker.hasItem("Big Root");
          var maxDrain = Math.round(defender.curHP() * percentHealed);
          if (attackerHasBigRoot)
            maxDrain = Math.trunc(maxDrain * 5324 / 4096);
          for (var i = 0; i < minD.length; i++) {
            var range = [minD[i], maxD[i]];
            for (var j in recovery) {
              var drained = Math.max(Math.round(range[j] * percentHealed), 1);
              if (attackerHasBigRoot)
                drained = Math.trunc(drained * 5324 / 4096);
              recovery[j] += Math.min(drained, maxDrain);
            }
          }
        }
        if (recovery[1] === 0)
          return { recovery, text };
        var minHealthRecovered = toDisplay(notation, recovery[0], attacker.maxHP());
        var maxHealthRecovered = toDisplay(notation, recovery[1], attacker.maxHP());
        var change = recovery[0] > 0 ? "recovered" : "lost";
        text = "".concat(minHealthRecovered, " - ").concat(maxHealthRecovered).concat(notation, " ").concat(change);
        return { recovery, text };
      }
      exports.getRecovery = getRecovery;
      function getRecoil(gen, attacker, defender, move, damage, notation) {
        if (notation === void 0) {
          notation = "%";
        }
        var _a = __read((0, result_1.damageRange)(damage), 2), min = _a[0], max = _a[1];
        var recoil = [0, 0];
        var text = "";
        var damageOverflow = min > defender.curHP() || max > defender.curHP();
        if (move.recoil) {
          var mod = move.recoil[0] / move.recoil[1] * 100;
          var minRecoilDamage = void 0, maxRecoilDamage = void 0;
          if (damageOverflow) {
            minRecoilDamage = toDisplay(notation, defender.curHP() * mod, attacker.maxHP(), 100);
            maxRecoilDamage = toDisplay(notation, defender.curHP() * mod, attacker.maxHP(), 100);
          } else {
            minRecoilDamage = toDisplay(notation, Math.min(min, defender.curHP()) * mod, attacker.maxHP(), 100);
            maxRecoilDamage = toDisplay(notation, Math.min(max, defender.curHP()) * mod, attacker.maxHP(), 100);
          }
          if (!attacker.hasAbility("Rock Head")) {
            recoil = [minRecoilDamage, maxRecoilDamage];
            text = "".concat(minRecoilDamage, " - ").concat(maxRecoilDamage).concat(notation, " recoil damage");
          }
        } else if (move.hasCrashDamage) {
          var genMultiplier = gen.num === 2 ? 12.5 : gen.num >= 3 ? 50 : 1;
          var minRecoilDamage = void 0, maxRecoilDamage = void 0;
          if (damageOverflow && gen.num !== 2) {
            minRecoilDamage = toDisplay(notation, defender.curHP() * genMultiplier, attacker.maxHP(), 100);
            maxRecoilDamage = toDisplay(notation, defender.curHP() * genMultiplier, attacker.maxHP(), 100);
          } else {
            minRecoilDamage = toDisplay(notation, Math.min(min, defender.maxHP()) * genMultiplier, attacker.maxHP(), 100);
            maxRecoilDamage = toDisplay(notation, Math.min(max, defender.maxHP()) * genMultiplier, attacker.maxHP(), 100);
          }
          recoil = [minRecoilDamage, maxRecoilDamage];
          switch (gen.num) {
            case 1:
              recoil = toDisplay(notation, 1, attacker.maxHP());
              text = "1hp damage on miss";
              break;
            case 2:
            case 3:
            case 4:
              if (defender.hasType("Ghost")) {
                if (gen.num === 4) {
                  var gen4CrashDamage = Math.floor(defender.maxHP() * 0.5 / attacker.maxHP() * 100);
                  recoil = notation === "%" ? gen4CrashDamage : Math.floor(gen4CrashDamage / 100 * 48);
                  text = "".concat(gen4CrashDamage, "% crash damage");
                } else {
                  recoil = 0;
                  text = "no crash damage on Ghost types";
                }
              } else {
                text = "".concat(minRecoilDamage, " - ").concat(maxRecoilDamage).concat(notation, " crash damage on miss");
              }
              break;
            default:
              recoil = notation === "%" ? 24 : 50;
              text = "50% crash damage";
          }
        } else if (move.struggleRecoil) {
          recoil = notation === "%" ? 12 : 25;
          text = "25% struggle damage";
          if (gen.num === 4)
            text += " (rounded down)";
        } else if (move.mindBlownRecoil) {
          recoil = notation === "%" ? 24 : 50;
          text = "50% recoil damage";
        }
        return { recoil, text };
      }
      exports.getRecoil = getRecoil;
      function getKOChance(gen, attacker, defender, move, field, damageObj, err) {
        if (err === void 0) {
          err = true;
        }
        var _a = __read(combine(damageObj), 2), damage = _a[0], approximate = _a[1];
        if (isNaN(damage[0])) {
          (0, util_1.error)(err, "damage[0] must be a number.");
          return { chance: 0, n: 0, text: "" };
        }
        if (damage[damage.length - 1] === 0) {
          (0, util_1.error)(err, "damage[damage.length - 1] === 0.");
          return { chance: 0, n: 0, text: "" };
        }
        if (move.timesUsed === void 0)
          move.timesUsed = 1;
        if (move.timesUsedWithMetronome === void 0)
          move.timesUsedWithMetronome = 1;
        if (damage[0] >= defender.maxHP() && move.timesUsed === 1 && move.timesUsedWithMetronome === 1) {
          return { chance: 1, n: 1, text: "guaranteed OHKO" };
        }
        var hazards = getHazards(gen, defender, field.defenderSide);
        var eot = getEndOfTurn(gen, attacker, defender, move, field);
        var toxicCounter = defender.hasStatus("tox") && !defender.hasAbility("Magic Guard", "Poison Heal") ? defender.toxicCounter : 0;
        var qualifier = approximate ? "approx. " : "";
        var hazardsText = hazards.texts.length > 0 ? " after " + serializeText(hazards.texts) : "";
        var afterText = hazards.texts.length > 0 || eot.texts.length > 0 ? " after " + serializeText(hazards.texts.concat(eot.texts)) : "";
        var afterTextNoHazards = eot.texts.length > 0 ? " after " + serializeText(eot.texts) : "";
        function roundChance(chance2) {
          return Math.max(Math.min(Math.round(chance2 * 1e3), 999), 1) / 10;
        }
        function KOChance(chanceWithoutEot, chanceWithEot2, n, multipleTurns) {
          if (multipleTurns === void 0) {
            multipleTurns = false;
          }
          var KOTurnText = n === 1 ? "OHKO" : multipleTurns ? "KO in ".concat(n, " turns") : "".concat(n, "HKO");
          var text = qualifier;
          var chance2 = void 0;
          if (chanceWithoutEot === void 0 || chanceWithEot2 === void 0) {
            text += "possible ".concat(KOTurnText);
          } else if (chanceWithoutEot + chanceWithEot2 === 0) {
            chance2 = 0;
            text += "not a KO";
          } else if (chanceWithoutEot === 1) {
            chance2 = chanceWithoutEot;
            text = "guaranteed ";
            text += "OHKO".concat(hazardsText);
          } else if (chanceWithoutEot > 0) {
            chance2 = chanceWithEot2;
            if (chanceWithEot2 === 1) {
              text += "".concat(roundChance(chanceWithoutEot), "% chance to ").concat(KOTurnText).concat(hazardsText, " ") + "(guaranteed ".concat(KOTurnText).concat(afterTextNoHazards, ")");
            } else if (chanceWithEot2 > chanceWithoutEot) {
              text += "".concat(roundChance(chanceWithoutEot), "% chance to ").concat(KOTurnText).concat(hazardsText, " ") + "(".concat(qualifier).concat(roundChance(chanceWithEot2), "% chance to ") + "".concat(KOTurnText).concat(afterTextNoHazards, ")");
            } else if (chanceWithoutEot > 0) {
              text += "".concat(roundChance(chanceWithoutEot), "% chance to ").concat(KOTurnText).concat(hazardsText);
            }
          } else if (chanceWithoutEot === 0) {
            chance2 = chanceWithEot2;
            if (chanceWithEot2 === 1) {
              text = "guaranteed ";
              text += "".concat(KOTurnText).concat(afterText);
            } else if (chanceWithEot2 > 0) {
              text += "".concat(roundChance(chanceWithEot2), "% chance to ").concat(KOTurnText).concat(afterText);
            }
          }
          return { chance: chance2, n, text };
        }
        if (move.timesUsed === 1 && move.timesUsedWithMetronome === 1 || move.isZ) {
          var chance = computeKOChance(damage, defender.curHP() - hazards.damage, 0, 1, 1, defender.maxHP(), 0);
          var chanceWithEot = computeKOChance(damage, defender.curHP() - hazards.damage, eot.damage, 1, 1, defender.maxHP(), toxicCounter);
          if (chance + chanceWithEot > 0)
            return KOChance(chance, chanceWithEot, 1);
          for (var i = 2; i <= 4; i++) {
            var chance_1 = computeKOChance(damage, defender.curHP() - hazards.damage, eot.damage, i, 1, defender.maxHP(), toxicCounter);
            if (chance_1 > 0)
              return KOChance(0, chance_1, i);
          }
          for (var i = 5; i <= 9; i++) {
            if (predictTotal(damage[0], eot.damage, i, 1, toxicCounter, defender.maxHP()) >= defender.curHP() - hazards.damage) {
              return KOChance(0, 1, i);
            } else if (predictTotal(damage[damage.length - 1], eot.damage, i, 1, toxicCounter, defender.maxHP()) >= defender.curHP() - hazards.damage) {
              return KOChance(void 0, void 0, i);
            }
          }
        } else {
          var chance = computeKOChance(damage, defender.maxHP() - hazards.damage, eot.damage, move.hits || 1, move.timesUsed || 1, defender.maxHP(), toxicCounter);
          if (chance > 0)
            return KOChance(0, chance, move.timesUsed, chance === 1);
          if (predictTotal(damage[0], eot.damage, 1, move.timesUsed, toxicCounter, defender.maxHP()) >= defender.curHP() - hazards.damage) {
            return KOChance(0, 1, move.timesUsed, true);
          } else if (predictTotal(damage[damage.length - 1], eot.damage, 1, move.timesUsed, toxicCounter, defender.maxHP()) >= defender.curHP() - hazards.damage) {
            return KOChance(void 0, void 0, move.timesUsed, true);
          }
          return KOChance(0, 0, move.timesUsed);
        }
        return { chance: 0, n: 0, text: "" };
      }
      exports.getKOChance = getKOChance;
      function combine(damage) {
        if (typeof damage === "number")
          return [[damage], false];
        if (damage.length >= 16 && typeof damage[0] === "number") {
          return [damage, false];
        }
        if (typeof damage[0] === "number" && typeof damage[1] === "number") {
          return [[damage[0] + damage[1]], false];
        }
        function reduce(dist, scaleValue) {
          var new_length = dist.length / scaleValue;
          var reduced = [];
          reduced[0] = dist[0];
          reduced[new_length - 1] = dist[dist.length - 1];
          for (var i = 1; i < new_length - 1; i++) {
            reduced[i] = dist[Math.round(i * scaleValue + scaleValue / 2)];
          }
          return reduced;
        }
        function combineTwo(dist1, dist2) {
          var combined = dist1.flatMap(function(val1) {
            return dist2.map(function(val2) {
              return val1 + val2;
            });
          }).sort(function(a, b) {
            return a - b;
          });
          return combined;
        }
        function combineDistributions(dists) {
          var combined = [0];
          var numRolls = dists[0].length;
          var numAccuracy = numRolls === 16 && dists.length === 3 ? 3 : 2;
          var approximate = false;
          for (var i = 0; i < dists.length; i++) {
            var distribution = dists[i];
            combined = combineTwo(combined, distribution);
            if (i >= numAccuracy) {
              combined = reduce(combined, distribution.length);
              approximate = true;
            }
          }
          return [combined, approximate];
        }
        var d = damage;
        return combineDistributions(d);
      }
      var TRAPPING = [
        "Bind",
        "Clamp",
        "Fire Spin",
        "Infestation",
        "Magma Storm",
        "Sand Tomb",
        "Thunder Cage",
        "Whirlpool",
        "Wrap",
        "G-Max Sandblast",
        "G-Max Centiferno"
      ];
      function getHazards(gen, defender, defenderSide) {
        var damage = 0;
        var texts = [];
        if (defender.hasItem("Heavy-Duty Boots")) {
          return { damage, texts };
        }
        if (defenderSide.isSR && !defender.hasAbility("Magic Guard", "Mountaineer")) {
          var rockType = gen.types.get("rock");
          var effectiveness = defender.teraType && defender.teraType !== "Stellar" ? rockType.effectiveness[defender.teraType] : rockType.effectiveness[defender.types[0]] * (defender.types[1] ? rockType.effectiveness[defender.types[1]] : 1);
          damage += Math.floor(effectiveness * defender.maxHP() / 8);
          texts.push("Stealth Rock");
        }
        if (defenderSide.steelsurge && !defender.hasAbility("Magic Guard", "Mountaineer")) {
          var steelType = gen.types.get("steel");
          var effectiveness = defender.teraType && defender.teraType !== "Stellar" ? steelType.effectiveness[defender.teraType] : steelType.effectiveness[defender.types[0]] * (defender.types[1] ? steelType.effectiveness[defender.types[1]] : 1);
          damage += Math.floor(effectiveness * defender.maxHP() / 8);
          texts.push("Steelsurge");
        }
        if (!defender.hasType("Flying") && !defender.hasAbility("Magic Guard", "Levitate") && !defender.hasItem("Air Balloon")) {
          if (defenderSide.spikes === 1) {
            damage += Math.floor(defender.maxHP() / 8);
            if (gen.num === 2) {
              texts.push("Spikes");
            } else {
              texts.push("1 layer of Spikes");
            }
          } else if (defenderSide.spikes === 2) {
            damage += Math.floor(defender.maxHP() / 6);
            texts.push("2 layers of Spikes");
          } else if (defenderSide.spikes === 3) {
            damage += Math.floor(defender.maxHP() / 4);
            texts.push("3 layers of Spikes");
          }
        }
        if (isNaN(damage)) {
          damage = 0;
        }
        return { damage, texts };
      }
      function getEndOfTurn(gen, attacker, defender, move, field) {
        var damage = 0;
        var texts = [];
        var loseItem = move.named("Knock Off") && !defender.hasAbility("Sticky Hold");
        var healBlock = move.named("Psychic Noise") && !(attacker.hasAbility("Sheer Force") || defender.hasItem("Covert Cloak") || defender.hasAbility("Shield Dust", "Aroma Veil"));
        if (field.hasWeather("Sun", "Harsh Sunshine")) {
          if (defender.hasAbility("Dry Skin", "Solar Power")) {
            damage -= Math.floor(defender.maxHP() / 8);
            texts.push(defender.ability + " damage");
          }
        } else if (field.hasWeather("Rain", "Heavy Rain") && !healBlock) {
          if (defender.hasAbility("Dry Skin")) {
            damage += Math.floor(defender.maxHP() / 8);
            texts.push("Dry Skin recovery");
          } else if (defender.hasAbility("Rain Dish")) {
            damage += Math.floor(defender.maxHP() / 16);
            texts.push("Rain Dish recovery");
          }
        } else if (field.hasWeather("Sand")) {
          if (!defender.hasType("Rock", "Ground", "Steel") && !defender.hasAbility("Magic Guard", "Overcoat", "Sand Force", "Sand Rush", "Sand Veil") && !defender.hasItem("Safety Goggles")) {
            damage -= Math.floor(defender.maxHP() / (gen.num === 2 ? 8 : 16));
            texts.push("sandstorm damage");
          }
        } else if (field.hasWeather("Hail", "Snow")) {
          if (defender.hasAbility("Ice Body") && !healBlock) {
            damage += Math.floor(defender.maxHP() / 16);
            texts.push("Ice Body recovery");
          } else if (!defender.hasType("Ice") && !defender.hasAbility("Magic Guard", "Overcoat", "Snow Cloak") && !defender.hasItem("Safety Goggles") && field.hasWeather("Hail")) {
            damage -= Math.floor(defender.maxHP() / 16);
            texts.push("hail damage");
          }
        }
        if (defender.hasItem("Leftovers") && !loseItem && !healBlock) {
          damage += Math.floor(defender.maxHP() / 16);
          texts.push("Leftovers recovery");
        } else if (defender.hasItem("Black Sludge") && !loseItem) {
          if (defender.hasType("Poison")) {
            if (!healBlock) {
              damage += Math.floor(defender.maxHP() / 16);
              texts.push("Black Sludge recovery");
            }
          } else if (!defender.hasAbility("Magic Guard", "Klutz")) {
            damage -= Math.floor(defender.maxHP() / 8);
            texts.push("Black Sludge damage");
          }
        } else if (defender.hasItem("Sticky Barb") && !loseItem && !defender.hasAbility("Magic Guard", "Klutz")) {
          damage -= Math.floor(defender.maxHP() / 8);
          texts.push("Sticky Barb damage");
        }
        if (field.defenderSide.isSeeded) {
          if (!defender.hasAbility("Magic Guard")) {
            damage -= Math.floor(defender.maxHP() / (gen.num >= 2 ? 8 : 16));
            texts.push("Leech Seed damage");
          }
        }
        if (field.attackerSide.isSeeded && !attacker.hasAbility("Magic Guard")) {
          var recovery = Math.floor(attacker.maxHP() / (gen.num >= 2 ? 8 : 16));
          if (defender.hasItem("Big Root"))
            recovery = Math.trunc(recovery * 5324 / 4096);
          if (attacker.hasAbility("Liquid Ooze")) {
            damage -= recovery;
            texts.push("Liquid Ooze damage");
          } else if (!healBlock) {
            damage += recovery;
            texts.push("Leech Seed recovery");
          }
        }
        if (field.hasTerrain("Grassy")) {
          if ((0, util_2.isGrounded)(defender, field) && !healBlock) {
            damage += Math.floor(defender.maxHP() / 16);
            texts.push("Grassy Terrain recovery");
          }
        }
        if (defender.hasStatus("psn")) {
          if (defender.hasAbility("Poison Heal")) {
            if (!healBlock) {
              damage += Math.floor(defender.maxHP() / 8);
              texts.push("Poison Heal");
            }
          } else if (!defender.hasAbility("Magic Guard")) {
            damage -= Math.floor(defender.maxHP() / (gen.num === 1 ? 16 : 8));
            texts.push("poison damage");
          }
        } else if (defender.hasStatus("tox")) {
          if (defender.hasAbility("Poison Heal")) {
            if (!healBlock) {
              damage += Math.floor(defender.maxHP() / 8);
              texts.push("Poison Heal");
            }
          } else if (!defender.hasAbility("Magic Guard")) {
            texts.push("toxic damage");
          }
        } else if (defender.hasStatus("brn")) {
          if (defender.hasAbility("Heatproof")) {
            damage -= Math.floor(defender.maxHP() / (gen.num > 6 ? 32 : 16));
            texts.push("reduced burn damage");
          } else if (!defender.hasAbility("Magic Guard")) {
            damage -= Math.floor(defender.maxHP() / (gen.num === 1 || gen.num > 6 ? 16 : 8));
            texts.push("burn damage");
          }
        } else if ((defender.hasStatus("slp") || defender.hasAbility("Comatose")) && attacker.hasAbility("Bad Dreams") && !defender.hasAbility("Magic Guard")) {
          damage -= Math.floor(defender.maxHP() / 8);
          texts.push("Bad Dreams");
        }
        if (!defender.hasAbility("Magic Guard") && TRAPPING.includes(move.name) && gen.num > 1) {
          if (attacker.hasItem("Binding Band")) {
            damage -= gen.num > 5 ? Math.floor(defender.maxHP() / 6) : Math.floor(defender.maxHP() / 8);
            texts.push("trapping damage");
          } else {
            damage -= gen.num > 5 ? Math.floor(defender.maxHP() / 8) : Math.floor(defender.maxHP() / 16);
            texts.push("trapping damage");
          }
        }
        if (field.defenderSide.isSaltCured && !defender.hasAbility("Magic Guard")) {
          var isWaterOrSteel = defender.hasType("Water", "Steel");
          damage -= Math.floor(defender.maxHP() / (isWaterOrSteel ? 4 : 8));
          texts.push("Salt Cure");
        }
        if (!defender.hasType("Fire") && !defender.hasAbility("Magic Guard") && move.named("Fire Pledge (Grass Pledge Boosted)", "Grass Pledge (Fire Pledge Boosted)")) {
          damage -= Math.floor(defender.maxHP() / 8);
          texts.push("Sea of Fire damage");
        }
        if (!defender.hasAbility("Magic Guard") && !defender.hasType("Grass") && (field.defenderSide.vinelash || move.named("G-Max Vine Lash"))) {
          damage -= Math.floor(defender.maxHP() / 6);
          texts.push("Vine Lash damage");
        }
        if (!defender.hasAbility("Magic Guard") && !defender.hasType("Fire") && (field.defenderSide.wildfire || move.named("G-Max Wildfire"))) {
          damage -= Math.floor(defender.maxHP() / 6);
          texts.push("Wildfire damage");
        }
        if (!defender.hasAbility("Magic Guard") && !defender.hasType("Water") && (field.defenderSide.cannonade || move.named("G-Max Cannonade"))) {
          damage -= Math.floor(defender.maxHP() / 6);
          texts.push("Cannonade damage");
        }
        if (!defender.hasAbility("Magic Guard") && !defender.hasType("Rock") && (field.defenderSide.volcalith || move.named("G-Max Volcalith"))) {
          damage -= Math.floor(defender.maxHP() / 6);
          texts.push("Volcalith damage");
        }
        return { damage, texts };
      }
      function computeKOChance(damage, hp, eot, hits, timesUsed, maxHP, toxicCounter) {
        var toxicDamage = 0;
        if (toxicCounter > 0) {
          toxicDamage = Math.floor(toxicCounter * maxHP / 16);
          toxicCounter++;
        }
        var n = damage.length;
        if (hits === 1) {
          if (eot - toxicDamage > 0) {
            eot = 0;
            toxicDamage = 0;
          }
          for (var i = 0; i < n; i++) {
            if (damage[n - 1] - eot + toxicDamage < hp)
              return 0;
            if (damage[i] - eot + toxicDamage >= hp) {
              return (n - i) / n;
            }
          }
        }
        var sum = 0;
        var lastc = 0;
        for (var i = 0; i < n; i++) {
          var c = void 0;
          if (i === 0 || damage[i] !== damage[i - 1]) {
            c = computeKOChance(damage, hp - damage[i] + eot - toxicDamage, eot, hits - 1, timesUsed, maxHP, toxicCounter);
          } else {
            c = lastc;
          }
          if (c === 1) {
            sum += n - i;
            break;
          } else {
            sum += c;
          }
          lastc = c;
        }
        return sum / n;
      }
      function predictTotal(damage, eot, hits, timesUsed, toxicCounter, maxHP) {
        var toxicDamage = 0;
        var lastTurnEot = eot;
        if (toxicCounter > 0) {
          for (var i = 0; i < hits - 1; i++) {
            toxicDamage += Math.floor((toxicCounter + i) * maxHP / 16);
          }
          lastTurnEot -= Math.floor((toxicCounter + (hits - 1)) * maxHP / 16);
        }
        var total = 0;
        if (hits > 1 && timesUsed === 1) {
          total = damage * hits - eot * (hits - 1) + toxicDamage;
        } else {
          total = damage - eot * (hits - 1) + toxicDamage;
        }
        if (lastTurnEot < 0)
          total -= lastTurnEot;
        return total;
      }
      function buildDescription(description, attacker, defender) {
        var _a = __read(getDescriptionLevels(attacker, defender), 2), attackerLevel = _a[0], defenderLevel = _a[1];
        var output = "";
        if (description.attackBoost) {
          if (description.attackBoost > 0) {
            output += "+";
          }
          output += description.attackBoost + " ";
        }
        output = appendIfSet(output, attackerLevel);
        output = appendIfSet(output, description.attackEVs);
        output = appendIfSet(output, description.attackerItem);
        output = appendIfSet(output, description.attackerAbility);
        output = appendIfSet(output, description.rivalry);
        if (description.isBurned) {
          output += "burned ";
        }
        if (description.alliesFainted) {
          output += Math.min(5, description.alliesFainted) + " ".concat(description.alliesFainted === 1 ? "ally" : "allies", " fainted ");
        }
        if (description.attackerTera) {
          output += "Tera ".concat(description.attackerTera, " ");
        }
        if (description.isStellarFirstUse) {
          output += "(First Use) ";
        }
        if (description.isBeadsOfRuin) {
          output += "Beads of Ruin ";
        }
        if (description.isSwordOfRuin) {
          output += "Sword of Ruin ";
        }
        output += description.attackerName + " ";
        if (description.isHelpingHand) {
          output += "Helping Hand ";
        }
        if (description.isFlowerGiftAttacker) {
          output += "with an ally's Flower Gift ";
        }
        if (description.isPowerTrickAttacker) {
          output += "with Power Trick ";
        }
        if (description.isSteelySpiritAttacker) {
          output += "with an ally's Steely Spirit ";
        }
        if (description.isBattery) {
          output += "Battery boosted ";
        }
        if (description.isPowerSpot) {
          output += "Power Spot boosted ";
        }
        if (description.isSwitching) {
          output += "switching boosted ";
        }
        output += description.moveName + " ";
        if (description.moveBP && description.moveType) {
          output += "(" + description.moveBP + " BP " + description.moveType + ") ";
        } else if (description.moveBP) {
          output += "(" + description.moveBP + " BP) ";
        } else if (description.moveType) {
          output += "(" + description.moveType + ") ";
        }
        if (description.hits) {
          output += "(" + description.hits + " hits) ";
        }
        output = appendIfSet(output, description.moveTurns);
        output += "vs. ";
        if (description.defenseBoost) {
          if (description.defenseBoost > 0) {
            output += "+";
          }
          output += description.defenseBoost + " ";
        }
        output = appendIfSet(output, defenderLevel);
        output = appendIfSet(output, description.HPEVs);
        if (description.defenseEVs) {
          output += "/ " + description.defenseEVs + " ";
        }
        output = appendIfSet(output, description.defenderItem);
        output = appendIfSet(output, description.defenderAbility);
        if (description.isTabletsOfRuin) {
          output += "Tablets of Ruin ";
        }
        if (description.isVesselOfRuin) {
          output += "Vessel of Ruin ";
        }
        if (description.isProtected) {
          output += "protected ";
        }
        if (description.isDefenderDynamaxed) {
          output += "Dynamax ";
        }
        if (description.defenderTera) {
          output += "Tera ".concat(description.defenderTera, " ");
        }
        output += description.defenderName;
        if (description.weather && description.terrain) {
          output += " in " + description.weather + " and " + description.terrain + " Terrain";
        } else if (description.weather) {
          output += " in " + description.weather;
        } else if (description.terrain) {
          output += " in " + description.terrain + " Terrain";
        }
        if (description.isReflect) {
          output += " through Reflect";
        } else if (description.isLightScreen) {
          output += " through Light Screen";
        }
        if (description.isFlowerGiftDefender) {
          output += " with an ally's Flower Gift";
        }
        if (description.isPowerTrickDefender) {
          output += " with Power Trick";
        }
        if (description.isFriendGuard) {
          output += " with an ally's Friend Guard";
        }
        if (description.isAuroraVeil) {
          output += " with an ally's Aurora Veil";
        }
        if (description.isCritical) {
          output += " on a critical hit";
        }
        if (description.isWonderRoom) {
          output += " in Wonder Room";
        }
        return output;
      }
      function getDescriptionLevels(attacker, defender) {
        if (attacker.level !== defender.level) {
          return [
            attacker.level === 100 ? "" : "Lvl ".concat(attacker.level),
            defender.level === 100 ? "" : "Lvl ".concat(defender.level)
          ];
        }
        var elide = [100, 50, 5].includes(attacker.level);
        var level = elide ? "" : "Lvl ".concat(attacker.level);
        return [level, level];
      }
      function serializeText(arr) {
        if (arr.length === 0) {
          return "";
        } else if (arr.length === 1) {
          return arr[0];
        } else if (arr.length === 2) {
          return arr[0] + " and " + arr[1];
        } else {
          var text = "";
          for (var i = 0; i < arr.length - 1; i++) {
            text += arr[i] + ", ";
          }
          return text + "and " + arr[arr.length - 1];
        }
      }
      function appendIfSet(str, toAppend) {
        return toAppend ? "".concat(str).concat(toAppend, " ") : str;
      }
      function toDisplay(notation, a, b, f) {
        if (f === void 0) {
          f = 1;
        }
        return notation === "%" ? Math.floor(a * (1e3 / f) / b) / 10 : Math.floor(a * (48 / f) / b);
      }
    }
  });

  // node_modules/@smogon/calc/dist/result.js
  var require_result = __commonJS({
    "node_modules/@smogon/calc/dist/result.js"(exports) {
      "use strict";
      var __read = exports && exports.__read || function(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
          while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
          e = { error };
        } finally {
          try {
            if (r && !r.done && (m = i["return"])) m.call(i);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      };
      var __values = exports && exports.__values || function(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
          next: function() {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
          }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
      };
      exports.__esModule = true;
      exports.multiDamageRange = exports.damageRange = exports.Result = void 0;
      var desc_1 = require_desc();
      var Result = (function() {
        function Result2(gen, attacker, defender, move, field, damage, rawDesc) {
          this.gen = gen;
          this.attacker = attacker;
          this.defender = defender;
          this.move = move;
          this.field = field;
          this.damage = damage;
          this.rawDesc = rawDesc;
        }
        Result2.prototype.desc = function() {
          return this.fullDesc();
        };
        Result2.prototype.range = function() {
          var _a = __read(damageRange(this.damage), 2), min = _a[0], max = _a[1];
          return [min, max];
        };
        Result2.prototype.fullDesc = function(notation, err) {
          if (notation === void 0) {
            notation = "%";
          }
          if (err === void 0) {
            err = true;
          }
          return (0, desc_1.display)(this.gen, this.attacker, this.defender, this.move, this.field, this.damage, this.rawDesc, notation, err);
        };
        Result2.prototype.moveDesc = function(notation) {
          if (notation === void 0) {
            notation = "%";
          }
          return (0, desc_1.displayMove)(this.gen, this.attacker, this.defender, this.move, this.damage, notation);
        };
        Result2.prototype.recovery = function(notation) {
          if (notation === void 0) {
            notation = "%";
          }
          return (0, desc_1.getRecovery)(this.gen, this.attacker, this.defender, this.move, this.damage, notation);
        };
        Result2.prototype.recoil = function(notation) {
          if (notation === void 0) {
            notation = "%";
          }
          return (0, desc_1.getRecoil)(this.gen, this.attacker, this.defender, this.move, this.damage, notation);
        };
        Result2.prototype.kochance = function(err) {
          if (err === void 0) {
            err = true;
          }
          return (0, desc_1.getKOChance)(this.gen, this.attacker, this.defender, this.move, this.field, this.damage, err);
        };
        return Result2;
      })();
      exports.Result = Result;
      function damageRange(damage) {
        var range = multiDamageRange(damage);
        if (typeof range[0] === "number")
          return range;
        var d = range;
        var summedRange = [0, 0];
        for (var i = 0; i < d[0].length; i++) {
          summedRange[0] += d[0][i];
          summedRange[1] += d[1][i];
        }
        return summedRange;
      }
      exports.damageRange = damageRange;
      function multiDamageRange(damage) {
        var e_1, _a;
        if (typeof damage === "number")
          return [damage, damage];
        if (typeof damage[0] !== "number") {
          damage = damage;
          var ranges = [[], []];
          try {
            for (var damage_1 = __values(damage), damage_1_1 = damage_1.next(); !damage_1_1.done; damage_1_1 = damage_1.next()) {
              var damageList = damage_1_1.value;
              ranges[0].push(damageList[0]);
              ranges[1].push(damageList[damageList.length - 1]);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (damage_1_1 && !damage_1_1.done && (_a = damage_1["return"])) _a.call(damage_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
          return ranges;
        }
        var d = damage;
        if (d.length < 16) {
          return [d, d];
        }
        return [d[0], d[d.length - 1]];
      }
      exports.multiDamageRange = multiDamageRange;
    }
  });

  // node_modules/@smogon/calc/dist/mechanics/gen12.js
  var require_gen12 = __commonJS({
    "node_modules/@smogon/calc/dist/mechanics/gen12.js"(exports) {
      "use strict";
      var __read = exports && exports.__read || function(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
          while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
          e = { error };
        } finally {
          try {
            if (r && !r.done && (m = i["return"])) m.call(i);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      };
      var __spreadArray = exports && exports.__spreadArray || function(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
      };
      exports.__esModule = true;
      exports.calculateRBYGSC = void 0;
      var items_1 = require_items2();
      var result_1 = require_result();
      var util_1 = require_util2();
      function calculateRBYGSC(gen, attacker, defender, move, field) {
        var _a;
        (0, util_1.computeFinalStats)(gen, attacker, defender, field, "atk", "def", "spa", "spd", "spe");
        var desc = {
          attackerName: attacker.name,
          moveName: move.name,
          defenderName: defender.name
        };
        var result = new result_1.Result(gen, attacker, defender, move, field, 0, desc);
        if (move.category === "Status") {
          return result;
        }
        if (field.defenderSide.isProtected) {
          desc.isProtected = true;
          return result;
        }
        if (move.name === "Pain Split") {
          var average = Math.floor((attacker.curHP() + defender.curHP()) / 2);
          var damage_1 = Math.max(0, defender.curHP() - average);
          result.damage = damage_1;
          return result;
        }
        if (gen.num === 1) {
          var fixedDamage = (0, util_1.handleFixedDamageMoves)(attacker, move);
          if (fixedDamage) {
            result.damage = fixedDamage;
            return result;
          }
        }
        var typeEffectivenessPrecedenceRules = [
          "Normal",
          "Fire",
          "Water",
          "Electric",
          "Grass",
          "Ice",
          "Fighting",
          "Poison",
          "Ground",
          "Flying",
          "Psychic",
          "Bug",
          "Rock",
          "Ghost",
          "Dragon",
          "Dark",
          "Steel"
        ];
        var firstDefenderType = defender.types[0];
        var secondDefenderType = defender.types[1];
        if (secondDefenderType && firstDefenderType !== secondDefenderType && gen.num === 2) {
          var firstTypePrecedence = typeEffectivenessPrecedenceRules.indexOf(firstDefenderType);
          var secondTypePrecedence = typeEffectivenessPrecedenceRules.indexOf(secondDefenderType);
          if (firstTypePrecedence > secondTypePrecedence) {
            _a = __read([secondDefenderType, firstDefenderType], 2), firstDefenderType = _a[0], secondDefenderType = _a[1];
          }
        }
        var type1Effectiveness = (0, util_1.getMoveEffectiveness)(gen, move, firstDefenderType, field.defenderSide.isForesight);
        var type2Effectiveness = secondDefenderType ? (0, util_1.getMoveEffectiveness)(gen, move, secondDefenderType, field.defenderSide.isForesight) : 1;
        var typeEffectiveness = type1Effectiveness * type2Effectiveness;
        if (typeEffectiveness === 0) {
          return result;
        }
        if (gen.num === 2) {
          var fixedDamage = (0, util_1.handleFixedDamageMoves)(attacker, move);
          if (fixedDamage) {
            result.damage = fixedDamage;
            return result;
          }
        }
        if (move.hits > 1) {
          desc.hits = move.hits;
        }
        if (move.name === "Triple Kick") {
          move.bp = move.hits === 2 ? 15 : move.hits === 3 ? 20 : 10;
          desc.moveBP = move.bp;
        }
        if (move.named("Flail", "Reversal")) {
          move.isCrit = false;
          var p = Math.floor(48 * attacker.curHP() / attacker.maxHP());
          move.bp = p <= 1 ? 200 : p <= 4 ? 150 : p <= 9 ? 100 : p <= 16 ? 80 : p <= 32 ? 40 : 20;
          desc.moveBP = move.bp;
        } else if (move.named("Present") && !move.bp) {
          move.bp = 40;
        }
        if (move.bp === 0) {
          return result;
        }
        var isPhysical = move.category === "Physical";
        var attackStat = isPhysical ? "atk" : "spa";
        var defenseStat = isPhysical ? "def" : "spd";
        var at = attacker.stats[attackStat];
        var df = defender.stats[defenseStat];
        var ignoreMods = move.isCrit && (gen.num === 1 || gen.num === 2 && attacker.boosts[attackStat] <= defender.boosts[defenseStat]);
        var lv = attacker.level;
        if (ignoreMods) {
          at = attacker.rawStats[attackStat];
          df = defender.rawStats[defenseStat];
          if (gen.num === 1) {
            lv *= 2;
            desc.isCritical = true;
          }
        } else {
          if (attacker.boosts[attackStat] !== 0)
            desc.attackBoost = attacker.boosts[attackStat];
          if (defender.boosts[defenseStat] !== 0)
            desc.defenseBoost = defender.boosts[defenseStat];
          if (isPhysical && attacker.hasStatus("brn")) {
            at = Math.floor(at / 2);
            desc.isBurned = true;
          }
        }
        if (move.named("Explosion", "Self-Destruct")) {
          df = Math.floor(df / 2);
        }
        if (!ignoreMods) {
          if (isPhysical && field.defenderSide.isReflect) {
            df *= 2;
            desc.isReflect = true;
          } else if (!isPhysical && field.defenderSide.isLightScreen) {
            df *= 2;
            desc.isLightScreen = true;
          }
        }
        if (attacker.named("Pikachu") && attacker.hasItem("Light Ball") && !isPhysical || attacker.named("Cubone", "Marowak") && attacker.hasItem("Thick Club") && isPhysical) {
          at *= 2;
          desc.attackerItem = attacker.item;
        }
        if (at > 255 || df > 255) {
          at = Math.floor(at / 4) % 256;
          df = Math.floor(df / 4) % 256;
        }
        if (move.named("Present")) {
          var lookup = {
            Normal: 0,
            Fighting: 1,
            Flying: 2,
            Poison: 3,
            Ground: 4,
            Rock: 5,
            Bug: 7,
            Ghost: 8,
            Steel: 9,
            "???": 19,
            Fire: 20,
            Water: 21,
            Grass: 22,
            Electric: 23,
            Psychic: 24,
            Ice: 25,
            Dragon: 26,
            Dark: 27
          };
          at = 10;
          df = Math.max(lookup[attacker.types[1] ? attacker.types[1] : attacker.types[0]], 1);
          lv = Math.max(lookup[defender.types[1] ? defender.types[1] : defender.types[0]], 1);
        }
        if (defender.named("Ditto") && defender.hasItem("Metal Powder")) {
          df = Math.floor(df * 1.5);
          desc.defenderItem = defender.item;
        }
        var baseDamage = Math.floor(Math.floor(Math.floor(2 * lv / 5 + 2) * Math.max(1, at) * move.bp / Math.max(1, df)) / 50);
        if (gen.num === 2 && move.isCrit) {
          baseDamage *= 2;
          desc.isCritical = true;
        }
        if (move.named("Pursuit") && field.defenderSide.isSwitching === "out") {
          baseDamage = Math.floor(baseDamage * 2);
          desc.isSwitching = "out";
        }
        var itemBoostType = attacker.hasItem("Dragon Fang") ? void 0 : (0, items_1.getItemBoostType)(attacker.hasItem("Dragon Scale") ? "Dragon Fang" : attacker.item);
        if (move.hasType(itemBoostType)) {
          baseDamage = Math.floor(baseDamage * 1.1);
          desc.attackerItem = attacker.item;
        }
        baseDamage = Math.min(997, baseDamage) + 2;
        if (field.hasWeather("Sun") && move.hasType("Fire") || field.hasWeather("Rain") && move.hasType("Water")) {
          baseDamage = Math.floor(baseDamage * 1.5);
          desc.weather = field.weather;
        } else if (field.hasWeather("Sun") && move.hasType("Water") || field.hasWeather("Rain") && (move.hasType("Fire") || move.named("Solar Beam"))) {
          baseDamage = Math.floor(baseDamage / 2);
          desc.weather = field.weather;
        }
        if (move.hasType.apply(move, __spreadArray([], __read(attacker.types), false))) {
          baseDamage = Math.floor(baseDamage * 1.5);
        }
        if (gen.num === 1) {
          baseDamage = Math.floor(baseDamage * type1Effectiveness);
          baseDamage = Math.floor(baseDamage * type2Effectiveness);
        } else {
          baseDamage = Math.floor(baseDamage * typeEffectiveness);
        }
        if (move.named("Flail", "Reversal")) {
          result.damage = baseDamage;
          return result;
        }
        var damage = [];
        for (var i = 217; i <= 255; i++) {
          if (gen.num === 2) {
            damage[i - 217] = Math.max(1, Math.floor(baseDamage * i / 255));
          } else {
            if (baseDamage === 1) {
              damage[i - 217] = 1;
            } else {
              damage[i - 217] = Math.floor(baseDamage * i / 255);
            }
          }
        }
        result.damage = damage;
        if (move.hits > 1) {
          var damageMatrix = [damage];
          for (var times = 1; times < move.hits; times++) {
            var damage_2 = [];
            for (var damageMultiplier = 217; damageMultiplier <= 255; damageMultiplier++) {
              var newFinalDamage = 0;
              if (gen.num === 2) {
                newFinalDamage = Math.max(1, Math.floor(baseDamage * damageMultiplier / 255));
              } else {
                if (baseDamage === 1) {
                  newFinalDamage = 1;
                } else {
                  newFinalDamage = Math.floor(baseDamage * damageMultiplier / 255);
                }
              }
              damage_2[damageMultiplier - 217] = newFinalDamage;
            }
            damageMatrix[times] = damage_2;
          }
          result.damage = damageMatrix;
        }
        return result;
      }
      exports.calculateRBYGSC = calculateRBYGSC;
    }
  });

  // node_modules/@smogon/calc/dist/mechanics/gen3.js
  var require_gen3 = __commonJS({
    "node_modules/@smogon/calc/dist/mechanics/gen3.js"(exports) {
      "use strict";
      var __read = exports && exports.__read || function(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
          while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
          e = { error };
        } finally {
          try {
            if (r && !r.done && (m = i["return"])) m.call(i);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      };
      var __spreadArray = exports && exports.__spreadArray || function(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
      };
      exports.__esModule = true;
      exports.calculateDefenseADV = exports.calculateAttackADV = exports.calculateBPModsADV = exports.calculateBasePowerADV = exports.calculateADV = void 0;
      var items_1 = require_items2();
      var result_1 = require_result();
      var util_1 = require_util2();
      function calculateADV(gen, attacker, defender, move, field) {
        var _a;
        (0, util_1.checkAirLock)(attacker, field);
        (0, util_1.checkAirLock)(defender, field);
        (0, util_1.checkForecast)(attacker, field.weather);
        (0, util_1.checkForecast)(defender, field.weather);
        (0, util_1.checkIntimidate)(gen, attacker, defender);
        (0, util_1.checkIntimidate)(gen, defender, attacker);
        attacker.stats.spe = (0, util_1.getFinalSpeed)(gen, attacker, field, field.attackerSide);
        defender.stats.spe = (0, util_1.getFinalSpeed)(gen, defender, field, field.defenderSide);
        var desc = {
          attackerName: attacker.name,
          moveName: move.name,
          defenderName: defender.name
        };
        var result = new result_1.Result(gen, attacker, defender, move, field, 0, desc);
        if (move.category === "Status" && !move.named("Nature Power")) {
          return result;
        }
        if (field.defenderSide.isProtected) {
          desc.isProtected = true;
          return result;
        }
        if (move.name === "Pain Split") {
          var average = Math.floor((attacker.curHP() + defender.curHP()) / 2);
          var damage_1 = Math.max(0, defender.curHP() - average);
          result.damage = damage_1;
          return result;
        }
        if (move.named("Weather Ball")) {
          move.type = field.hasWeather("Sun") ? "Fire" : field.hasWeather("Rain") ? "Water" : field.hasWeather("Sand") ? "Rock" : field.hasWeather("Hail") ? "Ice" : "Normal";
          move.category = move.type === "Rock" ? "Physical" : "Special";
          desc.weather = field.weather;
          desc.moveType = move.type;
          desc.moveBP = move.bp;
        } else if (move.named("Brick Break")) {
          field.defenderSide.isReflect = false;
          field.defenderSide.isLightScreen = false;
        }
        var typeEffectivenessPrecedenceRules = [
          "Normal",
          "Fire",
          "Water",
          "Electric",
          "Grass",
          "Ice",
          "Fighting",
          "Poison",
          "Ground",
          "Flying",
          "Psychic",
          "Bug",
          "Rock",
          "Ghost",
          "Dragon",
          "Dark",
          "Steel"
        ];
        var firstDefenderType = defender.types[0];
        var secondDefenderType = defender.types[1];
        if (secondDefenderType && firstDefenderType !== secondDefenderType) {
          var firstTypePrecedence = typeEffectivenessPrecedenceRules.indexOf(firstDefenderType);
          var secondTypePrecedence = typeEffectivenessPrecedenceRules.indexOf(secondDefenderType);
          if (firstTypePrecedence > secondTypePrecedence) {
            _a = __read([secondDefenderType, firstDefenderType], 2), firstDefenderType = _a[0], secondDefenderType = _a[1];
          }
        }
        var type1Effectiveness = (0, util_1.getMoveEffectiveness)(gen, move, firstDefenderType, field.defenderSide.isForesight);
        var type2Effectiveness = secondDefenderType ? (0, util_1.getMoveEffectiveness)(gen, move, secondDefenderType, field.defenderSide.isForesight) : 1;
        var typeEffectiveness = type1Effectiveness * type2Effectiveness;
        if (typeEffectiveness === 0) {
          return result;
        }
        if (defender.hasAbility("Flash Fire") && move.hasType("Fire") || defender.hasAbility("Levitate") && move.hasType("Ground") || defender.hasAbility("Volt Absorb") && move.hasType("Electric") || defender.hasAbility("Water Absorb") && move.hasType("Water") || defender.hasAbility("Wonder Guard") && !move.hasType("???") && typeEffectiveness <= 1 || defender.hasAbility("Soundproof") && move.flags.sound) {
          desc.defenderAbility = defender.ability;
          return result;
        }
        desc.HPEVs = (0, util_1.getStatDescriptionText)(gen, defender, "hp");
        var fixedDamage = (0, util_1.handleFixedDamageMoves)(attacker, move);
        if (fixedDamage) {
          result.damage = fixedDamage;
          return result;
        }
        if (move.hits > 1) {
          desc.hits = move.hits;
        }
        var bp = calculateBasePowerADV(attacker, defender, move, desc);
        if (bp === 0) {
          return result;
        }
        bp = calculateBPModsADV(attacker, move, desc, bp);
        var isCritical = move.isCrit && !defender.hasAbility("Battle Armor", "Shell Armor");
        var at = calculateAttackADV(gen, attacker, defender, move, desc, isCritical);
        var df = calculateDefenseADV(gen, defender, move, desc, isCritical);
        var lv = attacker.level;
        var baseDamage = Math.floor(Math.floor(Math.floor(2 * lv / 5 + 2) * at * bp / df) / 50);
        baseDamage = calculateFinalModsADV(baseDamage, attacker, move, field, desc, isCritical);
        baseDamage = Math.floor(baseDamage * type1Effectiveness);
        baseDamage = Math.floor(baseDamage * type2Effectiveness);
        var damage = [];
        for (var i = 85; i <= 100; i++) {
          damage[i - 85] = Math.max(1, Math.floor(baseDamage * i / 100));
        }
        result.damage = damage;
        if (move.timesUsed > 1 || move.hits > 1) {
          var origDefBoost = desc.defenseBoost;
          var origAtkBoost = desc.attackBoost;
          var numAttacks = 1;
          if (move.dropsStats && move.timesUsed > 1) {
            desc.moveTurns = "over ".concat(move.timesUsed, " turns");
            numAttacks = move.timesUsed;
          } else {
            numAttacks = move.hits;
          }
          var usedItems = [false, false];
          var damageMatrix = [damage];
          for (var times = 1; times < numAttacks; times++) {
            usedItems = (0, util_1.checkMultihitBoost)(gen, attacker, defender, move, field, desc, usedItems[0], usedItems[1]);
            var newAt = calculateAttackADV(gen, attacker, defender, move, desc, isCritical);
            var newBp = calculateBasePowerADV(attacker, defender, move, desc);
            newBp = calculateBPModsADV(attacker, move, desc, newBp);
            var newBaseDmg = Math.floor(Math.floor(Math.floor(2 * lv / 5 + 2) * newAt * newBp / df) / 50);
            newBaseDmg = calculateFinalModsADV(newBaseDmg, attacker, move, field, desc, isCritical);
            newBaseDmg = Math.floor(newBaseDmg * type1Effectiveness);
            newBaseDmg = Math.floor(newBaseDmg * type2Effectiveness);
            var damage_2 = [];
            for (var i = 85; i <= 100; i++) {
              var newFinalDamage = Math.max(1, Math.floor(newBaseDmg * i / 100));
              damage_2[i - 85] = newFinalDamage;
            }
            damageMatrix[times] = damage_2;
          }
          result.damage = damageMatrix;
          desc.defenseBoost = origDefBoost;
          desc.attackBoost = origAtkBoost;
        }
        return result;
      }
      exports.calculateADV = calculateADV;
      function calculateBasePowerADV(attacker, defender, move, desc, hit) {
        if (hit === void 0) {
          hit = 1;
        }
        var bp = move.bp;
        switch (move.name) {
          case "Flail":
          case "Reversal":
            var p = Math.floor(48 * attacker.curHP() / attacker.maxHP());
            bp = p <= 1 ? 200 : p <= 4 ? 150 : p <= 9 ? 100 : p <= 16 ? 80 : p <= 32 ? 40 : 20;
            desc.moveBP = bp;
            break;
          case "Eruption":
          case "Water Spout":
            bp = Math.max(1, Math.floor(150 * attacker.curHP() / attacker.maxHP()));
            desc.moveBP = bp;
            break;
          case "Low Kick":
            var w = defender.weightkg;
            bp = w >= 200 ? 120 : w >= 100 ? 100 : w >= 50 ? 80 : w >= 25 ? 60 : w >= 10 ? 40 : 20;
            desc.moveBP = bp;
            break;
          case "Facade":
            if (attacker.hasStatus("par", "psn", "tox", "brn")) {
              bp = move.bp * 2;
              desc.moveBP = bp;
            }
            break;
          case "Nature Power":
            move.category = "Physical";
            bp = 60;
            desc.moveName = "Swift";
            break;
          case "Triple Kick":
            bp = hit * 10;
            desc.moveBP = move.hits === 2 ? 30 : move.hits === 3 ? 60 : 10;
            break;
          default:
            bp = move.bp;
        }
        return bp;
      }
      exports.calculateBasePowerADV = calculateBasePowerADV;
      function calculateBPModsADV(attacker, move, desc, basePower) {
        if (attacker.curHP() <= attacker.maxHP() / 3 && (attacker.hasAbility("Overgrow") && move.hasType("Grass") || attacker.hasAbility("Blaze") && move.hasType("Fire") || attacker.hasAbility("Torrent") && move.hasType("Water") || attacker.hasAbility("Swarm") && move.hasType("Bug"))) {
          basePower = Math.floor(basePower * 1.5);
          desc.attackerAbility = attacker.ability;
        }
        return basePower;
      }
      exports.calculateBPModsADV = calculateBPModsADV;
      function calculateAttackADV(gen, attacker, defender, move, desc, isCritical) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        var isPhysical = move.category === "Physical";
        var attackStat = isPhysical ? "atk" : "spa";
        desc.attackEVs = (0, util_1.getStatDescriptionText)(gen, attacker, attackStat);
        var at = attacker.rawStats[attackStat];
        if (isPhysical && attacker.hasAbility("Huge Power", "Pure Power")) {
          at *= 2;
          desc.attackerAbility = attacker.ability;
        }
        if (!attacker.hasItem("Sea Incense") && move.hasType((0, items_1.getItemBoostType)(attacker.item))) {
          at = Math.floor(at * 1.1);
          desc.attackerItem = attacker.item;
        } else if (attacker.hasItem("Sea Incense") && move.hasType("Water")) {
          at = Math.floor(at * 1.05);
          desc.attackerItem = attacker.item;
        } else if (isPhysical && attacker.hasItem("Choice Band") || !isPhysical && attacker.hasItem("Soul Dew") && attacker.named("Latios", "Latias")) {
          at = Math.floor(at * 1.5);
          desc.attackerItem = attacker.item;
        } else if (!isPhysical && attacker.hasItem("Deep Sea Tooth") && attacker.named("Clamperl") || !isPhysical && attacker.hasItem("Light Ball") && attacker.named("Pikachu") || isPhysical && attacker.hasItem("Thick Club") && attacker.named("Cubone", "Marowak")) {
          at *= 2;
          desc.attackerItem = attacker.item;
        }
        if (defender.hasAbility("Thick Fat") && move.hasType("Fire", "Ice")) {
          at = Math.floor(at / 2);
          desc.defenderAbility = defender.ability;
        }
        if (isPhysical && (attacker.hasAbility("Hustle") || attacker.hasAbility("Guts") && attacker.status) || !isPhysical && attacker.abilityOn && attacker.hasAbility("Plus", "Minus")) {
          at = Math.floor(at * 1.5);
          desc.attackerAbility = attacker.ability;
        }
        var attackBoost = attacker.boosts[attackStat];
        if (attackBoost > 0 || !isCritical && attackBoost < 0) {
          at = (0, util_1.getModifiedStat)(at, attackBoost);
          desc.attackBoost = attackBoost;
        }
        return at;
      }
      exports.calculateAttackADV = calculateAttackADV;
      function calculateDefenseADV(gen, defender, move, desc, isCritical) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        var isPhysical = move.category === "Physical";
        var defenseStat = isPhysical ? "def" : "spd";
        desc.defenseEVs = (0, util_1.getStatDescriptionText)(gen, defender, defenseStat);
        var df = defender.rawStats[defenseStat];
        if (!isPhysical && defender.hasItem("Soul Dew") && defender.named("Latios", "Latias")) {
          df = Math.floor(df * 1.5);
          desc.defenderItem = defender.item;
        } else if (!isPhysical && defender.hasItem("Deep Sea Scale") && defender.named("Clamperl") || isPhysical && defender.hasItem("Metal Powder") && defender.named("Ditto")) {
          df *= 2;
          desc.defenderItem = defender.item;
        }
        if (isPhysical && defender.hasAbility("Marvel Scale") && defender.status) {
          df = Math.floor(df * 1.5);
          desc.defenderAbility = defender.ability;
        }
        if (move.named("Explosion", "Self-Destruct")) {
          df = Math.floor(df / 2);
        }
        var defenseBoost = defender.boosts[defenseStat];
        if (defenseBoost < 0 || !isCritical && defenseBoost > 0) {
          df = (0, util_1.getModifiedStat)(df, defenseBoost);
          desc.defenseBoost = defenseBoost;
        }
        return df;
      }
      exports.calculateDefenseADV = calculateDefenseADV;
      function calculateFinalModsADV(baseDamage, attacker, move, field, desc, isCritical) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        var isPhysical = move.category === "Physical";
        if (attacker.hasStatus("brn") && isPhysical && !attacker.hasAbility("Guts")) {
          baseDamage = Math.floor(baseDamage / 2);
          desc.isBurned = true;
        }
        if (!isCritical) {
          var screenMultiplier = field.gameType !== "Singles" ? 2 / 3 : 1 / 2;
          if (isPhysical && field.defenderSide.isReflect) {
            baseDamage = Math.floor(baseDamage * screenMultiplier);
            desc.isReflect = true;
          } else if (!isPhysical && field.defenderSide.isLightScreen) {
            baseDamage = Math.floor(baseDamage * screenMultiplier);
            desc.isLightScreen = true;
          }
        }
        if (field.gameType !== "Singles" && move.target === "allAdjacentFoes") {
          baseDamage = Math.floor(baseDamage / 2);
        }
        if (field.hasWeather("Sun") && move.hasType("Fire") || field.hasWeather("Rain") && move.hasType("Water")) {
          baseDamage = Math.floor(baseDamage * 1.5);
          desc.weather = field.weather;
        } else if (field.hasWeather("Sun") && move.hasType("Water") || field.hasWeather("Rain") && move.hasType("Fire") || move.named("Solar Beam") && field.hasWeather("Rain", "Sand", "Hail")) {
          baseDamage = Math.floor(baseDamage / 2);
          desc.weather = field.weather;
        }
        if (attacker.hasAbility("Flash Fire") && attacker.abilityOn && move.hasType("Fire")) {
          baseDamage = Math.floor(baseDamage * 1.5);
          desc.attackerAbility = "Flash Fire";
        }
        baseDamage = (move.category === "Physical" ? Math.max(1, baseDamage) : baseDamage) + 2;
        if (isCritical) {
          baseDamage *= 2;
          desc.isCritical = true;
        }
        if (move.named("Pursuit") && field.defenderSide.isSwitching === "out") {
          baseDamage = Math.floor(baseDamage * 2);
          desc.isSwitching = "out";
        }
        if (move.named("Weather Ball") && field.weather) {
          baseDamage *= 2;
          desc.moveBP = move.bp * 2;
        }
        if (field.attackerSide.isHelpingHand) {
          baseDamage = Math.floor(baseDamage * 1.5);
          desc.isHelpingHand = true;
        }
        if (move.hasType.apply(move, __spreadArray([], __read(attacker.types), false))) {
          baseDamage = Math.floor(baseDamage * 1.5);
        }
        return baseDamage;
      }
    }
  });

  // node_modules/@smogon/calc/dist/mechanics/gen4.js
  var require_gen4 = __commonJS({
    "node_modules/@smogon/calc/dist/mechanics/gen4.js"(exports) {
      "use strict";
      var __read = exports && exports.__read || function(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
          while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
          e = { error };
        } finally {
          try {
            if (r && !r.done && (m = i["return"])) m.call(i);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      };
      var __spreadArray = exports && exports.__spreadArray || function(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
      };
      exports.__esModule = true;
      exports.calculateDefenseDPP = exports.calculateAttackDPP = exports.calculateBPModsDPP = exports.calculateBasePowerDPP = exports.calculateDPP = void 0;
      var items_1 = require_items2();
      var result_1 = require_result();
      var util_1 = require_util2();
      function calculateDPP(gen, attacker, defender, move, field) {
        var _a;
        var _b;
        (0, util_1.checkAirLock)(attacker, field);
        (0, util_1.checkAirLock)(defender, field);
        (0, util_1.checkForecast)(attacker, field.weather);
        (0, util_1.checkForecast)(defender, field.weather);
        (0, util_1.checkItem)(attacker);
        (0, util_1.checkItem)(defender);
        (0, util_1.checkRawStatChanges)(attacker, field.attackerSide.isPowerTrick);
        (0, util_1.checkRawStatChanges)(defender, field.defenderSide.isPowerTrick);
        (0, util_1.checkIntimidate)(gen, attacker, defender);
        (0, util_1.checkIntimidate)(gen, defender, attacker);
        (0, util_1.checkDownload)(attacker, defender);
        (0, util_1.checkDownload)(defender, attacker);
        attacker.stats.spe = (0, util_1.getFinalSpeed)(gen, attacker, field, field.attackerSide);
        defender.stats.spe = (0, util_1.getFinalSpeed)(gen, defender, field, field.defenderSide);
        var desc = {
          attackerName: attacker.name,
          moveName: move.name,
          defenderName: defender.name
        };
        var result = new result_1.Result(gen, attacker, defender, move, field, 0, desc);
        if (move.category === "Status" && !move.named("Nature Power")) {
          return result;
        }
        if (field.defenderSide.isProtected && !move.breaksProtect) {
          desc.isProtected = true;
          return result;
        }
        if (move.name === "Pain Split") {
          var average = Math.floor((attacker.curHP() + defender.curHP()) / 2);
          var damage_1 = Math.max(0, defender.curHP() - average);
          result.damage = damage_1;
          return result;
        }
        var defenderAbilityIgnored = defender.hasAbility("Battle Armor", "Clear Body", "Damp", "Dry Skin", "Filter", "Flash Fire", "Flower Gift", "Heatproof", "Hyper Cutter", "Immunity", "Inner Focus", "Insomnia", "Keen Eye", "Leaf Guard", "Levitate", "Lightning Rod", "Limber", "Magma Armor", "Marvel Scale", "Motor Drive", "Oblivious", "Own Tempo", "Sand Veil", "Shell Armor", "Shield Dust", "Simple", "Snow Cloak", "Solid Rock", "Soundproof", "Sticky Hold", "Storm Drain", "Sturdy", "Suction Cups", "Tangled Feet", "Thick Fat", "Unaware", "Vital Spirit", "Volt Absorb", "Water Absorb", "Water Veil", "White Smoke", "Wonder Guard");
        if (attacker.hasAbility("Mold Breaker") && defenderAbilityIgnored) {
          defender.ability = "";
          desc.attackerAbility = attacker.ability;
        }
        var isCritical = move.isCrit && !defender.hasAbility("Battle Armor", "Shell Armor");
        if (move.named("Weather Ball")) {
          move.type = field.hasWeather("Sun") ? "Fire" : field.hasWeather("Rain") ? "Water" : field.hasWeather("Sand") ? "Rock" : field.hasWeather("Hail") ? "Ice" : "Normal";
          desc.weather = field.weather;
          desc.moveType = move.type;
        } else if (move.named("Judgment") && attacker.item && attacker.item.includes("Plate")) {
          move.type = (0, items_1.getItemBoostType)(attacker.item);
        } else if (move.named("Natural Gift") && ((_b = attacker.item) === null || _b === void 0 ? void 0 : _b.endsWith("Berry"))) {
          var gift = (0, items_1.getNaturalGift)(gen, attacker.item);
          move.type = gift.t;
          move.bp = gift.p;
          desc.attackerItem = attacker.item;
          desc.moveBP = move.bp;
          desc.moveType = move.type;
        } else if (move.named("Brick Break")) {
          field.defenderSide.isReflect = false;
          field.defenderSide.isLightScreen = false;
        }
        if (attacker.hasAbility("Normalize") && !move.named("Struggle")) {
          move.type = "Normal";
          desc.attackerAbility = attacker.ability;
        }
        var isGhostRevealed = attacker.hasAbility("Scrappy") || field.defenderSide.isForesight;
        var typeEffectivenessPrecedenceRules = [
          "Normal",
          "Fire",
          "Water",
          "Electric",
          "Grass",
          "Ice",
          "Fighting",
          "Poison",
          "Ground",
          "Flying",
          "Psychic",
          "Bug",
          "Rock",
          "Ghost",
          "Dragon",
          "Dark",
          "Steel"
        ];
        var firstDefenderType = defender.types[0];
        var secondDefenderType = defender.types[1];
        if (secondDefenderType && firstDefenderType !== secondDefenderType) {
          var firstTypePrecedence = typeEffectivenessPrecedenceRules.indexOf(firstDefenderType);
          var secondTypePrecedence = typeEffectivenessPrecedenceRules.indexOf(secondDefenderType);
          if (firstTypePrecedence > secondTypePrecedence) {
            _a = __read([secondDefenderType, firstDefenderType], 2), firstDefenderType = _a[0], secondDefenderType = _a[1];
          }
        }
        var type1Effectiveness = (0, util_1.getMoveEffectiveness)(gen, move, firstDefenderType, isGhostRevealed, field.isGravity);
        var type2Effectiveness = secondDefenderType ? (0, util_1.getMoveEffectiveness)(gen, move, secondDefenderType, isGhostRevealed, field.isGravity) : 1;
        var typeEffectiveness = type1Effectiveness * type2Effectiveness;
        if (typeEffectiveness === 0 && move.hasType("Ground") && (defender.hasItem("Iron Ball") && !defender.hasAbility("Klutz"))) {
          if (type1Effectiveness === 0) {
            type1Effectiveness = 1;
          } else if (defender.types[1] && type2Effectiveness === 0) {
            type2Effectiveness = 1;
          }
          typeEffectiveness = type1Effectiveness * type2Effectiveness;
        }
        if (typeEffectiveness === 0) {
          return result;
        }
        var ignoresWonderGuard = move.hasType("???") || move.named("Fire Fang");
        if (!ignoresWonderGuard && defender.hasAbility("Wonder Guard") && typeEffectiveness <= 1 || move.hasType("Fire") && defender.hasAbility("Flash Fire") || move.hasType("Water") && defender.hasAbility("Dry Skin", "Water Absorb") || move.hasType("Electric") && defender.hasAbility("Motor Drive", "Volt Absorb") || move.hasType("Ground") && !field.isGravity && !defender.hasItem("Iron Ball") && defender.hasAbility("Levitate") || move.flags.sound && defender.hasAbility("Soundproof")) {
          desc.defenderAbility = defender.ability;
          return result;
        }
        desc.HPEVs = (0, util_1.getStatDescriptionText)(gen, defender, "hp");
        var fixedDamage = (0, util_1.handleFixedDamageMoves)(attacker, move);
        if (fixedDamage) {
          result.damage = fixedDamage;
          return result;
        }
        if (move.hits > 1) {
          desc.hits = move.hits;
        }
        var isPhysical = move.category === "Physical";
        var basePower = calculateBasePowerDPP(gen, attacker, defender, move, field, desc);
        if (basePower === 0) {
          return result;
        }
        basePower = calculateBPModsDPP(attacker, defender, move, field, desc, basePower);
        var attack = calculateAttackDPP(gen, attacker, defender, move, field, desc, isCritical);
        var defense = calculateDefenseDPP(gen, attacker, defender, move, field, desc, isCritical);
        var baseDamage = Math.floor(Math.floor(Math.floor(2 * attacker.level / 5 + 2) * basePower * attack / 50) / defense);
        if (attacker.hasStatus("brn") && isPhysical && !attacker.hasAbility("Guts")) {
          baseDamage = Math.floor(baseDamage * 0.5);
          desc.isBurned = true;
        }
        baseDamage = calculateFinalModsDPP(baseDamage, attacker, move, field, desc, isCritical);
        var stabMod = 1;
        if (move.hasType.apply(move, __spreadArray([], __read(attacker.types), false))) {
          if (attacker.hasAbility("Adaptability")) {
            stabMod = 2;
            desc.attackerAbility = attacker.ability;
          } else {
            stabMod = 1.5;
          }
        }
        var filterMod = 1;
        if (defender.hasAbility("Filter", "Solid Rock") && typeEffectiveness > 1) {
          filterMod = 0.75;
          desc.defenderAbility = defender.ability;
        }
        var ebeltMod = 1;
        if (attacker.hasItem("Expert Belt") && typeEffectiveness > 1) {
          ebeltMod = 1.2;
          desc.attackerItem = attacker.item;
        }
        var tintedMod = 1;
        if (attacker.hasAbility("Tinted Lens") && typeEffectiveness < 1) {
          tintedMod = 2;
          desc.attackerAbility = attacker.ability;
        }
        var berryMod = 1;
        if (move.hasType((0, items_1.getBerryResistType)(defender.item)) && (typeEffectiveness > 1 || move.hasType("Normal"))) {
          berryMod = 0.5;
          desc.defenderItem = defender.item;
        }
        var damage = [];
        for (var i = 0; i < 16; i++) {
          damage[i] = Math.floor(baseDamage * (85 + i) / 100);
          damage[i] = Math.floor(damage[i] * stabMod);
          damage[i] = Math.floor(damage[i] * type1Effectiveness);
          damage[i] = Math.floor(damage[i] * type2Effectiveness);
          damage[i] = Math.floor(damage[i] * filterMod);
          damage[i] = Math.floor(damage[i] * ebeltMod);
          damage[i] = Math.floor(damage[i] * tintedMod);
          damage[i] = Math.floor(damage[i] * berryMod);
          damage[i] = Math.max(1, damage[i]);
        }
        result.damage = damage;
        if (move.timesUsed > 1 || move.hits > 1) {
          var origDefBoost = desc.defenseBoost;
          var origAtkBoost = desc.attackBoost;
          var numAttacks = 1;
          if (move.dropsStats && move.timesUsed > 1) {
            desc.moveTurns = "over ".concat(move.timesUsed, " turns");
            numAttacks = move.timesUsed;
          } else {
            numAttacks = move.hits;
          }
          var usedItems = [false, false];
          var damageMatrix = [damage];
          for (var times = 1; times < numAttacks; times++) {
            usedItems = (0, util_1.checkMultihitBoost)(gen, attacker, defender, move, field, desc, usedItems[0], usedItems[1]);
            var newBasePower = calculateBasePowerDPP(gen, attacker, defender, move, field, desc);
            newBasePower = calculateBPModsDPP(attacker, defender, move, field, desc, newBasePower);
            var newAtk = calculateAttackDPP(gen, attacker, defender, move, field, desc, isCritical);
            var baseDamage_1 = Math.floor(Math.floor(Math.floor(2 * attacker.level / 5 + 2) * newBasePower * newAtk / 50) / defense);
            if (attacker.hasStatus("brn") && isPhysical && !attacker.hasAbility("Guts")) {
              baseDamage_1 = Math.floor(baseDamage_1 * 0.5);
              desc.isBurned = true;
            }
            baseDamage_1 = calculateFinalModsDPP(baseDamage_1, attacker, move, field, desc, isCritical);
            var damageArray = [];
            for (var i = 0; i < 16; i++) {
              var newFinalDamage = 0;
              newFinalDamage = Math.floor(baseDamage_1 * (85 + i) / 100);
              newFinalDamage = Math.floor(newFinalDamage * stabMod);
              newFinalDamage = Math.floor(newFinalDamage * type1Effectiveness);
              newFinalDamage = Math.floor(newFinalDamage * type2Effectiveness);
              newFinalDamage = Math.floor(newFinalDamage * filterMod);
              newFinalDamage = Math.floor(newFinalDamage * ebeltMod);
              newFinalDamage = Math.floor(newFinalDamage * tintedMod);
              newFinalDamage = Math.max(1, newFinalDamage);
              damageArray[i] = newFinalDamage;
            }
            damageMatrix[times] = damageArray;
          }
          result.damage = damageMatrix;
          desc.defenseBoost = origDefBoost;
          desc.attackBoost = origAtkBoost;
        }
        return result;
      }
      exports.calculateDPP = calculateDPP;
      function calculateBasePowerDPP(gen, attacker, defender, move, field, desc, hit) {
        if (hit === void 0) {
          hit = 1;
        }
        var basePower = move.bp;
        var turnOrder = attacker.stats.spe > defender.stats.spe ? "first" : "last";
        switch (move.name) {
          case "Brine":
            if (defender.curHP() <= defender.maxHP() / 2) {
              basePower *= 2;
              desc.moveBP = basePower;
            }
            break;
          case "Eruption":
          case "Water Spout":
            basePower = Math.max(1, Math.floor(basePower * attacker.curHP() / attacker.maxHP()));
            desc.moveBP = basePower;
            break;
          case "Facade":
            if (attacker.hasStatus("par", "psn", "tox", "brn")) {
              basePower = move.bp * 2;
              desc.moveBP = basePower;
            }
            break;
          case "Flail":
          case "Reversal":
            var p = Math.floor(64 * attacker.curHP() / attacker.maxHP());
            basePower = p <= 1 ? 200 : p <= 5 ? 150 : p <= 12 ? 100 : p <= 21 ? 80 : p <= 42 ? 40 : 20;
            desc.moveBP = basePower;
            break;
          case "Fling":
            basePower = (0, items_1.getFlingPower)(attacker.item, gen.num);
            desc.moveBP = basePower;
            desc.attackerItem = attacker.item;
            break;
          case "Grass Knot":
          case "Low Kick":
            var w = defender.weightkg;
            basePower = w >= 200 ? 120 : w >= 100 ? 100 : w >= 50 ? 80 : w >= 25 ? 60 : w >= 10 ? 40 : 20;
            desc.moveBP = basePower;
            break;
          case "Gyro Ball":
            basePower = Math.min(150, Math.floor(25 * defender.stats.spe / attacker.stats.spe));
            desc.moveBP = basePower;
            break;
          case "Payback":
            if (turnOrder !== "first") {
              basePower *= 2;
              desc.moveBP = basePower;
            }
            break;
          case "Punishment":
            basePower = Math.min(200, 60 + 20 * (0, util_1.countBoosts)(gen, defender.boosts));
            desc.moveBP = basePower;
            break;
          case "Pursuit":
            var switching = field.defenderSide.isSwitching === "out";
            basePower = move.bp * (switching ? 2 : 1);
            if (switching)
              desc.isSwitching = "out";
            desc.moveBP = basePower;
            break;
          case "Wake-Up Slap":
            if (defender.hasStatus("slp")) {
              basePower *= 2;
              desc.moveBP = basePower;
            }
            break;
          case "Nature Power":
            move.category = "Special";
            move.secondaries = true;
            basePower = 80;
            desc.moveName = "Tri Attack";
            break;
          case "Crush Grip":
          case "Wring Out":
            basePower = Math.floor(defender.curHP() * 120 / defender.maxHP()) + 1;
            desc.moveBP = basePower;
            break;
          case "Triple Kick":
            basePower = hit * 10;
            desc.moveBP = move.hits === 2 ? 30 : move.hits === 3 ? 60 : 10;
            break;
          case "Weather Ball":
            basePower = move.bp * (field.weather ? 2 : 1);
            desc.moveBP = basePower;
            break;
          default:
            basePower = move.bp;
        }
        return basePower;
      }
      exports.calculateBasePowerDPP = calculateBasePowerDPP;
      function calculateBPModsDPP(attacker, defender, move, field, desc, basePower) {
        if (field.attackerSide.isHelpingHand) {
          basePower = Math.floor(basePower * 1.5);
          desc.isHelpingHand = true;
        }
        if (attacker.hasAbility("Technician") && basePower <= 60) {
          basePower = Math.floor(basePower * 1.5);
          desc.attackerAbility = attacker.ability;
        }
        var isPhysical = move.category === "Physical";
        if (attacker.hasItem("Muscle Band") && isPhysical || attacker.hasItem("Wise Glasses") && !isPhysical) {
          basePower = Math.floor(basePower * 1.1);
          desc.attackerItem = attacker.item;
        } else if (move.hasType((0, items_1.getItemBoostType)(attacker.item)) || attacker.hasItem("Adamant Orb") && attacker.named("Dialga") && move.hasType("Steel", "Dragon") || attacker.hasItem("Lustrous Orb") && attacker.named("Palkia") && move.hasType("Water", "Dragon") || attacker.hasItem("Griseous Orb") && attacker.named("Giratina-Origin") && move.hasType("Ghost", "Dragon")) {
          basePower = Math.floor(basePower * 1.2);
          desc.attackerItem = attacker.item;
        }
        if (attacker.hasAbility("Reckless") && (move.recoil || move.hasCrashDamage) || attacker.hasAbility("Iron Fist") && move.flags.punch) {
          basePower = Math.floor(basePower * 1.2);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.curHP() <= attacker.maxHP() / 3 && (attacker.hasAbility("Overgrow") && move.hasType("Grass") || attacker.hasAbility("Blaze") && move.hasType("Fire") || attacker.hasAbility("Torrent") && move.hasType("Water") || attacker.hasAbility("Swarm") && move.hasType("Bug"))) {
          basePower = Math.floor(basePower * 1.5);
          desc.attackerAbility = attacker.ability;
        }
        if (defender.hasAbility("Heatproof") && move.hasType("Fire") || defender.hasAbility("Thick Fat") && move.hasType("Fire", "Ice")) {
          basePower = Math.floor(basePower * 0.5);
          desc.defenderAbility = defender.ability;
        } else if (defender.hasAbility("Dry Skin") && move.hasType("Fire")) {
          basePower = Math.floor(basePower * 1.25);
          desc.defenderAbility = defender.ability;
        }
        if (attacker.hasAbility("Rivalry") && ![attacker.gender, defender.gender].includes("N")) {
          if (attacker.gender === defender.gender) {
            basePower = Math.floor(basePower * 1.25);
            desc.rivalry = "buffed";
          } else {
            basePower = Math.floor(basePower * 0.75);
            desc.rivalry = "nerfed";
          }
          desc.attackerAbility = attacker.ability;
        }
        return basePower;
      }
      exports.calculateBPModsDPP = calculateBPModsDPP;
      function calculateAttackDPP(gen, attacker, defender, move, field, desc, isCritical) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        var isPhysical = move.category === "Physical";
        var attackStat = isPhysical ? "atk" : "spa";
        desc.attackEVs = (0, util_1.getStatDescriptionText)(gen, attacker, attackStat, field.attackerSide.isPowerTrick);
        if (field.attackerSide.isPowerTrick && isPhysical) {
          desc.isPowerTrickAttacker = true;
        }
        var attack = attacker.rawStats[attackStat];
        var attackBoost = attacker.boosts[attackStat];
        if (defender.hasAbility("Unaware")) {
          desc.defenderAbility = defender.ability;
        } else if (attacker.hasAbility("Simple")) {
          attack = getSimpleModifiedStat(attack, attackBoost);
          desc.attackerAbility = attacker.ability;
          desc.attackBoost = attackBoost;
        } else if (attackBoost > 0 || !isCritical && attackBoost < 0) {
          attack = (0, util_1.getModifiedStat)(attack, attackBoost);
          desc.attackBoost = attackBoost;
        }
        if (isPhysical && attacker.hasAbility("Pure Power", "Huge Power")) {
          attack *= 2;
          desc.attackerAbility = attacker.ability;
        } else if (field.hasWeather("Sun") && attacker.hasAbility(isPhysical ? "Flower Gift" : "Solar Power")) {
          attack = Math.floor(attack * 1.5);
          desc.attackerAbility = attacker.ability;
          desc.weather = field.weather;
        } else if (isPhysical && (attacker.hasAbility("Hustle") || attacker.hasAbility("Guts") && attacker.status) || !isPhysical && attacker.abilityOn && attacker.hasAbility("Plus", "Minus")) {
          attack = Math.floor(attack * 1.5);
          desc.attackerAbility = attacker.ability;
        } else if (isPhysical && attacker.hasAbility("Slow Start") && attacker.abilityOn) {
          attack = Math.floor(attack / 2);
          desc.attackerAbility = attacker.ability;
        }
        if (field.attackerSide.isFlowerGift && !attacker.hasAbility("Flower Gift") && field.hasWeather("Sun") && isPhysical) {
          attack = Math.floor(attack * 1.5);
          desc.weather = field.weather;
          desc.isFlowerGiftAttacker = true;
        }
        if ((isPhysical ? attacker.hasItem("Choice Band") : attacker.hasItem("Choice Specs")) || !isPhysical && attacker.hasItem("Soul Dew") && attacker.named("Latios", "Latias")) {
          attack = Math.floor(attack * 1.5);
          desc.attackerItem = attacker.item;
        } else if (attacker.hasItem("Light Ball") && attacker.named("Pikachu") || attacker.hasItem("Thick Club") && attacker.named("Cubone", "Marowak") && isPhysical || attacker.hasItem("Deep Sea Tooth") && attacker.named("Clamperl") && !isPhysical) {
          attack *= 2;
          desc.attackerItem = attacker.item;
        }
        return attack;
      }
      exports.calculateAttackDPP = calculateAttackDPP;
      function calculateDefenseDPP(gen, attacker, defender, move, field, desc, isCritical) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        var isPhysical = move.category === "Physical";
        var defenseStat = isPhysical ? "def" : "spd";
        desc.defenseEVs = (0, util_1.getStatDescriptionText)(gen, defender, defenseStat, field.defenderSide.isPowerTrick);
        var defense = defender.rawStats[defenseStat];
        if (field.defenderSide.isPowerTrick && isPhysical) {
          desc.isPowerTrickDefender = true;
        }
        var defenseBoost = defender.boosts[defenseStat];
        if (attacker.hasAbility("Unaware")) {
          desc.attackerAbility = attacker.ability;
        } else if (defender.hasAbility("Simple")) {
          defense = getSimpleModifiedStat(defense, defenseBoost);
          desc.defenderAbility = defender.ability;
          desc.defenseBoost = defenseBoost;
        } else if (defenseBoost < 0 || !isCritical && defenseBoost > 0) {
          defense = (0, util_1.getModifiedStat)(defense, defenseBoost);
          desc.defenseBoost = defenseBoost;
        }
        if (defender.hasAbility("Marvel Scale") && defender.status && isPhysical) {
          defense = Math.floor(defense * 1.5);
          desc.defenderAbility = defender.ability;
        } else if (defender.hasAbility("Flower Gift") && field.hasWeather("Sun") && !isPhysical) {
          defense = Math.floor(defense * 1.5);
          desc.defenderAbility = defender.ability;
          desc.weather = field.weather;
        } else if (field.defenderSide.isFlowerGift && field.hasWeather("Sun") && !isPhysical) {
          defense = Math.floor(defense * 1.5);
          desc.weather = field.weather;
          desc.isFlowerGiftDefender = true;
        }
        if (defender.hasItem("Soul Dew") && defender.named("Latios", "Latias") && !isPhysical) {
          defense = Math.floor(defense * 1.5);
          desc.defenderItem = defender.item;
        } else if (defender.hasItem("Deep Sea Scale") && defender.named("Clamperl") && !isPhysical || defender.hasItem("Metal Powder") && defender.named("Ditto") && isPhysical) {
          defense *= 2;
          desc.defenderItem = defender.item;
        }
        if (field.hasWeather("Sand") && defender.hasType("Rock") && !isPhysical) {
          defense = Math.floor(defense * 1.5);
          desc.weather = field.weather;
        }
        if (move.named("Explosion") || move.named("Self-Destruct")) {
          defense = Math.floor(defense * 0.5);
        }
        if (defense < 1) {
          defense = 1;
        }
        return defense;
      }
      exports.calculateDefenseDPP = calculateDefenseDPP;
      function calculateFinalModsDPP(baseDamage, attacker, move, field, desc, isCritical) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        var isPhysical = move.category === "Physical";
        if (!isCritical) {
          var screenMultiplier = field.gameType !== "Singles" ? 2 / 3 : 1 / 2;
          if (isPhysical && field.defenderSide.isReflect) {
            baseDamage = Math.floor(baseDamage * screenMultiplier);
            desc.isReflect = true;
          } else if (!isPhysical && field.defenderSide.isLightScreen) {
            baseDamage = Math.floor(baseDamage * screenMultiplier);
            desc.isLightScreen = true;
          }
        }
        if (field.gameType !== "Singles" && ["allAdjacent", "allAdjacentFoes"].includes(move.target)) {
          baseDamage = Math.floor(baseDamage * 3 / 4);
        }
        if (field.hasWeather("Sun") && move.hasType("Fire") || field.hasWeather("Rain") && move.hasType("Water")) {
          baseDamage = Math.floor(baseDamage * 1.5);
          desc.weather = field.weather;
        } else if (field.hasWeather("Sun") && move.hasType("Water") || field.hasWeather("Rain") && move.hasType("Fire") || move.named("Solar Beam") && field.hasWeather("Rain", "Sand", "Hail")) {
          baseDamage = Math.floor(baseDamage * 0.5);
          desc.weather = field.weather;
        }
        if (attacker.hasAbility("Flash Fire") && attacker.abilityOn && move.hasType("Fire")) {
          baseDamage = Math.floor(baseDamage * 1.5);
          desc.attackerAbility = "Flash Fire";
        }
        baseDamage += 2;
        if (isCritical) {
          if (attacker.hasAbility("Sniper")) {
            baseDamage *= 3;
            desc.attackerAbility = attacker.ability;
          } else {
            baseDamage *= 2;
          }
          desc.isCritical = isCritical;
        }
        if (attacker.hasItem("Life Orb")) {
          baseDamage = Math.floor(baseDamage * 1.3);
          desc.attackerItem = attacker.item;
        }
        return baseDamage;
      }
      function getSimpleModifiedStat(stat, mod) {
        var simpleMod = Math.min(6, Math.max(-6, mod * 2));
        return simpleMod > 0 ? Math.floor(stat * (2 + simpleMod) / 2) : simpleMod < 0 ? Math.floor(stat * 2 / (2 - simpleMod)) : stat;
      }
    }
  });

  // node_modules/@smogon/calc/dist/mechanics/gen56.js
  var require_gen56 = __commonJS({
    "node_modules/@smogon/calc/dist/mechanics/gen56.js"(exports) {
      "use strict";
      exports.__esModule = true;
      exports.calculateDfModsBWXY = exports.calculateDefenseBWXY = exports.calculateAtModsBWXY = exports.calculateAttackBWXY = exports.calculateBPModsBWXY = exports.calculateBasePowerBWXY = exports.calculateBWXY = void 0;
      var util_1 = require_util();
      var items_1 = require_items2();
      var result_1 = require_result();
      var util_2 = require_util2();
      function calculateBWXY(gen, attacker, defender, move, field) {
        var _a;
        (0, util_2.checkAirLock)(attacker, field);
        (0, util_2.checkAirLock)(defender, field);
        (0, util_2.checkForecast)(attacker, field.weather);
        (0, util_2.checkForecast)(defender, field.weather);
        (0, util_2.checkItem)(attacker, field.isMagicRoom);
        (0, util_2.checkItem)(defender, field.isMagicRoom);
        (0, util_2.checkRawStatChanges)(attacker, field.attackerSide.isPowerTrick, field.isWonderRoom);
        (0, util_2.checkRawStatChanges)(defender, field.defenderSide.isPowerTrick, field.isWonderRoom);
        (0, util_2.checkSeedBoost)(attacker, field);
        (0, util_2.checkSeedBoost)(defender, field);
        (0, util_2.computeFinalStats)(gen, attacker, defender, field, "def", "spd", "spe");
        (0, util_2.checkIntimidate)(gen, attacker, defender);
        (0, util_2.checkIntimidate)(gen, defender, attacker);
        (0, util_2.checkDownload)(attacker, defender, field.isWonderRoom);
        (0, util_2.checkDownload)(defender, attacker, field.isWonderRoom);
        (0, util_2.computeFinalStats)(gen, attacker, defender, field, "atk", "spa");
        (0, util_2.checkInfiltrator)(attacker, field.defenderSide);
        (0, util_2.checkInfiltrator)(defender, field.attackerSide);
        var desc = {
          attackerName: attacker.name,
          moveName: move.name,
          defenderName: defender.name,
          isWonderRoom: field.isWonderRoom
        };
        var result = new result_1.Result(gen, attacker, defender, move, field, 0, desc);
        if (move.category === "Status" && !move.named("Nature Power")) {
          return result;
        }
        if (field.defenderSide.isProtected && !move.breaksProtect) {
          desc.isProtected = true;
          return result;
        }
        if (move.name === "Pain Split") {
          var average = Math.floor((attacker.curHP() + defender.curHP()) / 2);
          var damage_1 = Math.max(0, defender.curHP() - average);
          result.damage = damage_1;
          return result;
        }
        var defenderAbilityIgnored = defender.hasAbility("Aroma Veil", "Aura Break", "Battle Armor", "Big Pecks", "Bulletproof", "Clear Body", "Contrary", "Damp", "Dark Aura", "Dry Skin", "Fairy Aura", "Filter", "Flash Fire", "Flower Gift", "Flower Veil", "Friend Guard", "Fur Coat", "Grass Pelt", "Heatproof", "Heavy Metal", "Hyper Cutter", "Immunity", "Inner Focus", "Insomnia", "Keen Eye", "Leaf Guard", "Levitate", "Light Metal", "Lightning Rod", "Limber", "Magic Bounce", "Magma Armor", "Marvel Scale", "Motor Drive", "Multiscale", "Oblivious", "Overcoat", "Own Tempo", "Sand Veil", "Sap Sipper", "Shell Armor", "Shield Dust", "Simple", "Snow Cloak", "Solid Rock", "Soundproof", "Sticky Hold", "Storm Drain", "Sturdy", "Suction Cups", "Sweet Veil", "Tangled Feet", "Telepathy", "Thick Fat", "Unaware", "Vital Spirit", "Volt Absorb", "Water Absorb", "Water Veil", "White Smoke", "Wonder Guard", "Wonder Skin");
        if (attacker.hasAbility("Mold Breaker", "Teravolt", "Turboblaze") && defenderAbilityIgnored) {
          defender.ability = "";
          desc.attackerAbility = attacker.ability;
        }
        var isCritical = move.isCrit && !defender.hasAbility("Battle Armor", "Shell Armor") && move.timesUsed === 1;
        if (move.named("Weather Ball")) {
          move.type = field.hasWeather("Sun", "Harsh Sunshine") ? "Fire" : field.hasWeather("Rain", "Heavy Rain") ? "Water" : field.hasWeather("Sand") ? "Rock" : field.hasWeather("Hail") ? "Ice" : "Normal";
          desc.weather = field.weather;
          desc.moveType = move.type;
        } else if (move.named("Judgment") && attacker.item && attacker.item.includes("Plate")) {
          move.type = (0, items_1.getItemBoostType)(attacker.item);
        } else if (move.named("Techno Blast") && attacker.item && attacker.item.includes("Drive")) {
          move.type = (0, items_1.getTechnoBlast)(attacker.item);
        } else if (move.named("Natural Gift") && ((_a = attacker.item) === null || _a === void 0 ? void 0 : _a.endsWith("Berry"))) {
          var gift = (0, items_1.getNaturalGift)(gen, attacker.item);
          move.type = gift.t;
          move.bp = gift.p;
          desc.attackerItem = attacker.item;
          desc.moveBP = move.bp;
          desc.moveType = move.type;
        } else if (move.named("Nature Power")) {
          if (gen.num === 5) {
            move.type = "Ground";
          } else {
            move.type = field.hasTerrain("Electric") ? "Electric" : field.hasTerrain("Grassy") ? "Grass" : field.hasTerrain("Misty") ? "Fairy" : "Normal";
          }
        } else if (move.named("Brick Break")) {
          field.defenderSide.isReflect = false;
          field.defenderSide.isLightScreen = false;
        }
        var hasAteAbilityTypeChange = false;
        var isAerilate = false;
        var isPixilate = false;
        var isRefrigerate = false;
        var isNormalize = false;
        var noTypeChange = move.named("Judgment", "Nature Power", "Techo Blast", "Natural Gift", "Weather Ball", "Struggle");
        if (!move.isZ && !noTypeChange) {
          var normal = move.hasType("Normal");
          if (isAerilate = attacker.hasAbility("Aerilate") && normal) {
            move.type = "Flying";
          } else if (isPixilate = attacker.hasAbility("Pixilate") && normal) {
            move.type = "Fairy";
          } else if (isRefrigerate = attacker.hasAbility("Refrigerate") && normal) {
            move.type = "Ice";
          } else if (isNormalize = attacker.hasAbility("Normalize")) {
            move.type = "Normal";
          }
          if (isPixilate || isRefrigerate || isAerilate || isNormalize) {
            desc.attackerAbility = attacker.ability;
          }
          if (isPixilate || isRefrigerate || isAerilate) {
            hasAteAbilityTypeChange = true;
          }
        }
        if (attacker.hasAbility("Gale Wings") && move.hasType("Flying")) {
          move.priority = 1;
          desc.attackerAbility = attacker.ability;
        }
        var isGhostRevealed = attacker.hasAbility("Scrappy") || field.defenderSide.isForesight;
        var isRingTarget = defender.hasItem("Ring Target") && !defender.hasAbility("Klutz");
        var type1Effectiveness = (0, util_2.getMoveEffectiveness)(gen, move, defender.types[0], isGhostRevealed, field.isGravity, isRingTarget);
        var type2Effectiveness = defender.types[1] ? (0, util_2.getMoveEffectiveness)(gen, move, defender.types[1], isGhostRevealed, field.isGravity, isRingTarget) : 1;
        var typeEffectiveness = type1Effectiveness * type2Effectiveness;
        if (typeEffectiveness === 0 && move.named("Thousand Arrows")) {
          typeEffectiveness = 1;
        } else if (typeEffectiveness === 0 && move.hasType("Ground") && defender.hasItem("Iron Ball") && !defender.hasAbility("Klutz")) {
          typeEffectiveness = 1;
        }
        if (typeEffectiveness === 0) {
          return result;
        }
        if (move.named("Sky Drop") && (defender.hasType("Flying") || defender.weightkg >= 200 || field.isGravity) || move.named("Synchronoise") && !defender.hasType(attacker.types[0]) && (!attacker.types[1] || !defender.hasType(attacker.types[1])) || move.named("Dream Eater") && !defender.hasStatus("slp")) {
          return result;
        }
        if (field.hasWeather("Harsh Sunshine") && move.hasType("Water") || field.hasWeather("Heavy Rain") && move.hasType("Fire")) {
          desc.weather = field.weather;
          return result;
        }
        if (field.hasWeather("Strong Winds") && defender.hasType("Flying") && gen.types.get((0, util_1.toID)(move.type)).effectiveness["Flying"] > 1) {
          typeEffectiveness /= 2;
          desc.weather = field.weather;
        }
        if (defender.hasAbility("Wonder Guard") && typeEffectiveness <= 1 || move.hasType("Grass") && defender.hasAbility("Sap Sipper") || move.hasType("Fire") && defender.hasAbility("Flash Fire") || move.hasType("Water") && defender.hasAbility("Dry Skin", "Storm Drain", "Water Absorb") || move.hasType("Electric") && defender.hasAbility("Lightning Rod", "Motor Drive", "Volt Absorb") || move.hasType("Ground") && !field.isGravity && !move.named("Thousand Arrows") && !defender.hasItem("Iron Ball") && defender.hasAbility("Levitate") || move.flags.bullet && defender.hasAbility("Bulletproof") || move.flags.sound && defender.hasAbility("Soundproof")) {
          desc.defenderAbility = defender.ability;
          return result;
        }
        if (move.hasType("Ground") && !move.named("Thousand Arrows") && !field.isGravity && defender.hasItem("Air Balloon")) {
          desc.defenderItem = defender.item;
          return result;
        }
        if (move.priority > 0 && field.hasTerrain("Psychic") && (0, util_2.isGrounded)(defender, field)) {
          desc.terrain = field.terrain;
          return result;
        }
        desc.HPEVs = (0, util_2.getStatDescriptionText)(gen, defender, "hp");
        var fixedDamage = (0, util_2.handleFixedDamageMoves)(attacker, move);
        if (fixedDamage) {
          if (attacker.hasAbility("Parental Bond")) {
            result.damage = [fixedDamage, fixedDamage];
            desc.attackerAbility = attacker.ability;
          } else {
            result.damage = fixedDamage;
          }
          return result;
        }
        if (move.named("Final Gambit")) {
          result.damage = attacker.curHP();
          return result;
        }
        if (move.hits > 1) {
          desc.hits = move.hits;
        }
        var basePower = calculateBasePowerBWXY(gen, attacker, defender, move, field, hasAteAbilityTypeChange, desc);
        if (basePower === 0) {
          return result;
        }
        var attack = calculateAttackBWXY(gen, attacker, defender, move, field, desc, isCritical);
        var attackStat = move.category === "Special" ? "spa" : "atk";
        var defense = calculateDefenseBWXY(gen, attacker, defender, move, field, desc, isCritical);
        var baseDamage = calculateBaseDamageBWXY(gen, attacker, basePower, attack, defense, move, field, desc, isCritical);
        var stabMod = (0, util_2.getStabMod)(attacker, move, desc);
        var applyBurn = attacker.hasStatus("brn") && move.category === "Physical" && !attacker.hasAbility("Guts") && !(move.named("Facade") && gen.num === 6);
        desc.isBurned = applyBurn;
        var finalMods = calculateFinalModsBWXY(gen, attacker, defender, move, field, desc, isCritical, typeEffectiveness);
        var finalMod = (0, util_2.chainMods)(finalMods, 41, 131072);
        var isSpread = field.gameType !== "Singles" && ["allAdjacent", "allAdjacentFoes"].includes(move.target);
        var childDamage;
        if (attacker.hasAbility("Parental Bond") && move.hits === 1 && !isSpread) {
          var child = attacker.clone();
          child.ability = "Parental Bond (Child)";
          (0, util_2.checkMultihitBoost)(gen, child, defender, move, field, desc);
          childDamage = calculateBWXY(gen, child, defender, move, field).damage;
          desc.attackerAbility = attacker.ability;
        }
        var damage = [];
        for (var i = 0; i < 16; i++) {
          damage[i] = (0, util_2.getFinalDamage)(baseDamage, i, typeEffectiveness, applyBurn, stabMod, finalMod);
        }
        result.damage = childDamage ? [damage, childDamage] : damage;
        desc.attackBoost = move.named("Foul Play") ? defender.boosts[attackStat] : attacker.boosts[attackStat];
        if (move.timesUsed > 1 || move.hits > 1) {
          var damageMatrix = [damage];
          var origDefBoost = desc.defenseBoost;
          var origAtkBoost = desc.attackBoost;
          var numAttacks = 1;
          if (move.timesUsed > 1) {
            desc.moveTurns = "over ".concat(move.timesUsed, " turns");
            numAttacks = move.timesUsed;
          } else {
            numAttacks = move.hits;
          }
          var usedItems = [false, false];
          for (var times = 1; times < numAttacks; times++) {
            usedItems = (0, util_2.checkMultihitBoost)(gen, attacker, defender, move, field, desc, usedItems[0], usedItems[1]);
            var newAtk = calculateAttackBWXY(gen, attacker, defender, move, field, desc, isCritical);
            var newDef = calculateDefenseBWXY(gen, attacker, defender, move, field, desc, isCritical);
            hasAteAbilityTypeChange = hasAteAbilityTypeChange && attacker.hasAbility("Aerilate", "Galvanize", "Pixilate", "Refrigerate");
            if (move.timesUsed > 1) {
              stabMod = (0, util_2.getStabMod)(attacker, move, desc);
            }
            var newBasePower = calculateBasePowerBWXY(gen, attacker, defender, move, field, hasAteAbilityTypeChange, desc);
            var newBaseDamage = (0, util_2.getBaseDamage)(attacker.level, newBasePower, newAtk, newDef);
            var newFinalMods = calculateFinalModsBWXY(gen, attacker, defender, move, field, desc, isCritical, typeEffectiveness, times);
            var newFinalMod = (0, util_2.chainMods)(newFinalMods, 41, 131072);
            var damageArray = [];
            for (var i = 0; i < 16; i++) {
              var newFinalDamage = (0, util_2.getFinalDamage)(newBaseDamage, i, typeEffectiveness, applyBurn, stabMod, newFinalMod);
              damageArray[i] = newFinalDamage;
            }
            damageMatrix[times] = damageArray;
          }
          result.damage = damageMatrix;
          desc.defenseBoost = origDefBoost;
          desc.attackBoost = origAtkBoost;
        }
        return result;
      }
      exports.calculateBWXY = calculateBWXY;
      function calculateBasePowerBWXY(gen, attacker, defender, move, field, hasAteAbilityTypeChange, desc, hit) {
        if (hit === void 0) {
          hit = 1;
        }
        var basePower;
        var turnOrder = attacker.stats.spe > defender.stats.spe ? "first" : "last";
        switch (move.name) {
          case "Payback":
            basePower = move.bp * (turnOrder === "last" ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Pursuit":
            var switching = field.defenderSide.isSwitching === "out";
            basePower = move.bp * (switching ? 2 : 1);
            if (switching)
              desc.isSwitching = "out";
            desc.moveBP = basePower;
            break;
          case "Electro Ball":
            if (defender.stats.spe === 0)
              defender.stats.spe = 1;
            var r = Math.floor(attacker.stats.spe / defender.stats.spe);
            basePower = r >= 4 ? 150 : r >= 3 ? 120 : r >= 2 ? 80 : r >= 1 ? 60 : 40;
            desc.moveBP = basePower;
            break;
          case "Gyro Ball":
            if (attacker.stats.spe === 0)
              attacker.stats.spe = 1;
            basePower = Math.min(150, Math.floor(25 * defender.stats.spe / attacker.stats.spe) + 1);
            desc.moveBP = basePower;
            break;
          case "Punishment":
            basePower = Math.min(200, 60 + 20 * (0, util_2.countBoosts)(gen, defender.boosts));
            desc.moveBP = basePower;
            break;
          case "Low Kick":
          case "Grass Knot":
            var w = (0, util_2.getWeight)(defender, desc, "defender");
            basePower = w >= 200 ? 120 : w >= 100 ? 100 : w >= 50 ? 80 : w >= 25 ? 60 : w >= 10 ? 40 : 20;
            desc.moveBP = basePower;
            break;
          case "Hex":
            basePower = move.bp * (defender.status ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Heavy Slam":
          case "Heat Crash":
            var wr = (0, util_2.getWeight)(attacker, desc, "attacker") / (0, util_2.getWeight)(defender, desc, "defender");
            basePower = wr >= 5 ? 120 : wr >= 4 ? 100 : wr >= 3 ? 80 : wr >= 2 ? 60 : 40;
            desc.moveBP = basePower;
            break;
          case "Stored Power":
          case "Power Trip":
            basePower = 20 + 20 * (0, util_2.countBoosts)(gen, attacker.boosts);
            desc.moveBP = basePower;
            break;
          case "Acrobatics":
            basePower = move.bp * (attacker.hasItem("Flying Gem") || !attacker.item ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Assurance":
            basePower = move.bp * (defender.hasAbility("Parental Bond (Child)") ? 2 : 1);
            break;
          case "Wake-Up Slap":
            basePower = move.bp * (defender.hasStatus("slp") ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Smelling Salts":
            basePower = move.bp * (defender.hasStatus("par") ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Weather Ball":
            basePower = move.bp * (field.weather && !field.hasWeather("Strong Winds") ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Fling":
            basePower = (0, items_1.getFlingPower)(attacker.item, gen.num);
            desc.moveBP = basePower;
            desc.attackerItem = attacker.item;
            break;
          case "Eruption":
          case "Water Spout":
            basePower = Math.max(1, Math.floor(150 * attacker.curHP() / attacker.maxHP()));
            desc.moveBP = basePower;
            break;
          case "Flail":
          case "Reversal":
            var p = Math.floor(48 * attacker.curHP() / attacker.maxHP());
            basePower = p <= 1 ? 200 : p <= 4 ? 150 : p <= 9 ? 100 : p <= 16 ? 80 : p <= 32 ? 40 : 20;
            desc.moveBP = basePower;
            break;
          case "Nature Power":
            if (gen.num === 5) {
              move.category = "Physical";
              move.target = "allAdjacent";
              basePower = 100;
              desc.moveName = "Earthquake";
            } else {
              move.category = "Special";
              move.secondaries = true;
              switch (field.terrain) {
                case "Electric":
                  basePower = 90;
                  desc.moveName = "Thunderbolt";
                  break;
                case "Grassy":
                  basePower = 90;
                  desc.moveName = "Energy Ball";
                  break;
                case "Misty":
                  basePower = 95;
                  desc.moveName = "Moonblast";
                  break;
                default:
                  basePower = 80;
                  desc.moveName = "Tri Attack";
              }
            }
            break;
          case "Triple Kick":
            basePower = hit * 10;
            desc.moveBP = move.hits === 2 ? 30 : move.hits === 3 ? 60 : 10;
            break;
          case "Crush Grip":
          case "Wring Out":
            basePower = 100 * Math.floor(defender.curHP() * 4096 / defender.maxHP());
            basePower = Math.floor(Math.floor((120 * basePower + 2048 - 1) / 4096) / 100) || 1;
            desc.moveBP = basePower;
            break;
          default:
            basePower = move.bp;
        }
        if (basePower === 0) {
          return 0;
        }
        var bpMods = calculateBPModsBWXY(gen, attacker, defender, move, field, desc, basePower, hasAteAbilityTypeChange, turnOrder, hit);
        basePower = (0, util_2.OF16)(Math.max(1, (0, util_2.pokeRound)(basePower * (0, util_2.chainMods)(bpMods, 41, 2097152) / 4096)));
        return basePower;
      }
      exports.calculateBasePowerBWXY = calculateBasePowerBWXY;
      function calculateBPModsBWXY(gen, attacker, defender, move, field, desc, basePower, hasAteAbilityTypeChange, turnOrder, hit) {
        var bpMods = [];
        var defenderItem = defender.item && defender.item !== "" ? defender.item : defender.disabledItem;
        var resistedKnockOffDamage = !defenderItem || defender.named("Giratina-Origin") && defenderItem === "Griseous Orb" || defender.name.includes("Arceus") && defenderItem.includes("Plate") || defender.name.includes("Genesect") && defenderItem.includes("Drive") || defender.named("Groudon", "Groudon-Primal") && defenderItem === "Red Orb" || defender.named("Kyogre", "Kyogre-Primal") && defenderItem === "Blue Orb";
        if (!resistedKnockOffDamage && defenderItem) {
          var item = gen.items.get((0, util_1.toID)(defenderItem));
          resistedKnockOffDamage = !!(item.megaStone && (item.megaStone[defender.name] || Object.values(item.megaStone).includes(defender.name)));
        }
        if (!resistedKnockOffDamage && hit > 1 && !defender.hasAbility("Sticky Hold")) {
          resistedKnockOffDamage = true;
        }
        if (attacker.hasAbility("Technician") && basePower <= 60 || attacker.hasAbility("Flare Boost") && attacker.hasStatus("brn") && move.category === "Special" || attacker.hasAbility("Toxic Boost") && attacker.hasStatus("psn", "tox") && move.category === "Physical") {
          bpMods.push(6144);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Analytic") && turnOrder !== "first") {
          bpMods.push(5325);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Sand Force") && field.hasWeather("Sand") && move.hasType("Rock", "Ground", "Steel")) {
          bpMods.push(5325);
          desc.attackerAbility = attacker.ability;
          desc.weather = field.weather;
        } else if (attacker.hasAbility("Reckless") && (move.recoil || move.hasCrashDamage) || attacker.hasAbility("Iron Fist") && move.flags.punch) {
          bpMods.push(4915);
          desc.attackerAbility = attacker.ability;
        }
        if (defender.hasAbility("Heatproof") && move.hasType("Fire")) {
          bpMods.push(2048);
          desc.defenderAbility = defender.ability;
        } else if (defender.hasAbility("Dry Skin") && move.hasType("Fire")) {
          bpMods.push(5120);
          desc.defenderAbility = defender.ability;
        }
        if (attacker.hasAbility("Sheer Force") && move.secondaries) {
          bpMods.push(5325);
          desc.attackerAbility = attacker.ability;
        }
        if (attacker.hasAbility("Rivalry") && ![attacker.gender, defender.gender].includes("N")) {
          if (attacker.gender === defender.gender) {
            bpMods.push(5120);
            desc.rivalry = "buffed";
          } else {
            bpMods.push(3072);
            desc.rivalry = "nerfed";
          }
          desc.attackerAbility = attacker.ability;
        }
        if (attacker.item && (0, items_1.getItemBoostType)(attacker.item) === move.type) {
          bpMods.push(4915);
          desc.attackerItem = attacker.item;
        } else if (attacker.hasItem("Muscle Band") && move.category === "Physical" || attacker.hasItem("Wise Glasses") && move.category === "Special") {
          bpMods.push(4505);
          desc.attackerItem = attacker.item;
        } else if (attacker.hasItem("Adamant Orb") && attacker.named("Dialga") && move.hasType("Steel", "Dragon") || attacker.hasItem("Lustrous Orb") && attacker.named("Palkia") && move.hasType("Water", "Dragon") || attacker.hasItem("Griseous Orb") && attacker.named("Giratina-Origin") && move.hasType("Ghost", "Dragon")) {
          bpMods.push(4915);
          desc.attackerItem = attacker.item;
        } else if (attacker.hasItem("".concat(move.type, " Gem"))) {
          bpMods.push(gen.num > 5 ? 5325 : 6144);
          desc.attackerItem = attacker.item;
        }
        if (move.named("Facade") && attacker.hasStatus("brn", "par", "psn", "tox") || move.named("Brine") && defender.curHP() <= defender.maxHP() / 2 || move.named("Venoshock") && defender.hasStatus("psn", "tox")) {
          bpMods.push(8192);
          desc.moveBP = basePower * 2;
        } else if (gen.num > 5 && move.named("Knock Off") && !resistedKnockOffDamage) {
          bpMods.push(6144);
          desc.moveBP = basePower * 1.5;
        } else if (move.named("Solar Beam") && field.hasWeather("Rain", "Heavy Rain", "Sand", "Hail")) {
          bpMods.push(2048);
          desc.moveBP = basePower / 2;
          desc.weather = field.weather;
        }
        if (field.attackerSide.isHelpingHand) {
          bpMods.push(6144);
          desc.isHelpingHand = true;
        }
        if (hasAteAbilityTypeChange) {
          bpMods.push(5325);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Mega Launcher") && move.flags.pulse || attacker.hasAbility("Strong Jaw") && move.flags.bite) {
          bpMods.push(6144);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Tough Claws") && move.flags.contact) {
          bpMods.push(5325);
          desc.attackerAbility = attacker.ability;
        }
        var aura = "".concat(move.type, " Aura");
        var isAttackerAura = attacker.hasAbility(aura);
        var isDefenderAura = defender.hasAbility(aura);
        var isUserAuraBreak = attacker.hasAbility("Aura Break") || defender.hasAbility("Aura Break");
        var isFieldAuraBreak = field.isAuraBreak;
        var isFieldFairyAura = field.isFairyAura && move.type === "Fairy";
        var isFieldDarkAura = field.isDarkAura && move.type === "Dark";
        var auraActive = isAttackerAura || isDefenderAura || isFieldFairyAura || isFieldDarkAura;
        var auraBreak = isFieldAuraBreak || isUserAuraBreak;
        if (auraActive) {
          if (auraBreak) {
            bpMods.push(3072);
            desc.attackerAbility = attacker.ability;
            desc.defenderAbility = defender.ability;
          } else {
            bpMods.push(5448);
            if (isAttackerAura)
              desc.attackerAbility = attacker.ability;
            if (isDefenderAura)
              desc.defenderAbility = defender.ability;
          }
        }
        if ((0, util_2.isGrounded)(attacker, field)) {
          if (field.hasTerrain("Electric") && move.hasType("Electric") || field.hasTerrain("Grassy") && move.hasType("Grass")) {
            bpMods.push(6144);
            desc.terrain = field.terrain;
          }
        }
        if ((0, util_2.isGrounded)(defender, field)) {
          if (field.hasTerrain("Misty") && move.hasType("Dragon") || field.hasTerrain("Grassy") && move.named("Bulldoze", "Earthquake")) {
            bpMods.push(2048);
            desc.terrain = field.terrain;
          }
        }
        return bpMods;
      }
      exports.calculateBPModsBWXY = calculateBPModsBWXY;
      function calculateAttackBWXY(gen, attacker, defender, move, field, desc, isCritical) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        var attack;
        var attackSource = move.named("Foul Play") ? defender : attacker;
        var attackStat = move.category === "Special" ? "spa" : "atk";
        desc.attackEVs = move.named("Foul Play") ? (0, util_2.getStatDescriptionText)(gen, defender, attackStat, field.defenderSide.isPowerTrick) : (0, util_2.getStatDescriptionText)(gen, attacker, attackStat, field.attackerSide.isPowerTrick);
        if (field.attackerSide.isPowerTrick && move.category === "Physical" && !move.named("Foul Play")) {
          desc.isPowerTrickAttacker = true;
        }
        if (attackSource.boosts[attackStat] === 0 || isCritical && attackSource.boosts[attackStat] < 0) {
          attack = attackSource.rawStats[attackStat];
        } else if (defender.hasAbility("Unaware")) {
          attack = attackSource.rawStats[attackStat];
          desc.defenderAbility = defender.ability;
        } else {
          attack = (0, util_2.getModifiedStat)(attackSource.rawStats[attackStat], attackSource.boosts[attackStat]);
          desc.attackBoost = attackSource.boosts[attackStat];
        }
        if (attacker.hasAbility("Hustle") && move.category === "Physical") {
          attack = (0, util_2.pokeRound)(attack * 3 / 2);
          desc.attackerAbility = attacker.ability;
        }
        var atMods = calculateAtModsBWXY(attacker, defender, move, field, desc);
        attack = (0, util_2.OF16)(Math.max(1, (0, util_2.pokeRound)(attack * (0, util_2.chainMods)(atMods, 410, 131072) / 4096)));
        return attack;
      }
      exports.calculateAttackBWXY = calculateAttackBWXY;
      function calculateAtModsBWXY(attacker, defender, move, field, desc) {
        var atMods = [];
        if (defender.hasAbility("Thick Fat") && move.hasType("Fire", "Ice")) {
          atMods.push(2048);
          desc.defenderAbility = defender.ability;
        }
        if (attacker.hasAbility("Guts") && attacker.status && move.category === "Physical" || attacker.curHP() <= attacker.maxHP() / 3 && (attacker.hasAbility("Overgrow") && move.hasType("Grass") || attacker.hasAbility("Blaze") && move.hasType("Fire") || attacker.hasAbility("Torrent") && move.hasType("Water") || attacker.hasAbility("Swarm") && move.hasType("Bug")) || move.category === "Special" && attacker.abilityOn && attacker.hasAbility("Plus", "Minus")) {
          atMods.push(6144);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Flash Fire") && attacker.abilityOn && move.hasType("Fire")) {
          atMods.push(6144);
          desc.attackerAbility = "Flash Fire";
        } else if (attacker.hasAbility("Solar Power") && field.hasWeather("Sun", "Harsh Sunshine") && move.category === "Special" || attacker.named("Cherrim") && attacker.hasAbility("Flower Gift") && field.hasWeather("Sun", "Harsh Sunshine") && move.category === "Physical") {
          atMods.push(6144);
          desc.attackerAbility = attacker.ability;
          desc.weather = field.weather;
        } else if (attacker.hasAbility("Defeatist") && attacker.curHP() <= attacker.maxHP() / 2 || attacker.hasAbility("Slow Start") && attacker.abilityOn && move.category === "Physical") {
          atMods.push(2048);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Huge Power", "Pure Power") && move.category === "Physical") {
          atMods.push(8192);
          desc.attackerAbility = attacker.ability;
        }
        if (field.attackerSide.isFlowerGift && !attacker.hasAbility("Flower Gift") && field.hasWeather("Sun", "Harsh Sunshine") && move.category === "Physical") {
          atMods.push(6144);
          desc.weather = field.weather;
          desc.isFlowerGiftAttacker = true;
        }
        if (attacker.hasItem("Thick Club") && attacker.named("Cubone", "Marowak", "Marowak-Alola") && move.category === "Physical" || attacker.hasItem("Deep Sea Tooth") && attacker.named("Clamperl") && move.category === "Special" || attacker.hasItem("Light Ball") && attacker.name.startsWith("Pikachu") && !move.isZ) {
          atMods.push(8192);
          desc.attackerItem = attacker.item;
        } else if (attacker.hasItem("Soul Dew") && attacker.named("Latios", "Latias", "Latios-Mega", "Latias-Mega") && move.category === "Special" || attacker.hasItem("Choice Band") && move.category === "Physical" || attacker.hasItem("Choice Specs") && move.category === "Special") {
          atMods.push(6144);
          desc.attackerItem = attacker.item;
        }
        return atMods;
      }
      exports.calculateAtModsBWXY = calculateAtModsBWXY;
      function calculateDefenseBWXY(gen, attacker, defender, move, field, desc, isCritical) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        var defense;
        var defenseStat = move.overrideDefensiveStat || move.category === "Physical" ? "def" : "spd";
        var hitsPhysical = defenseStat === "def";
        desc.defenseEVs = (0, util_2.getStatDescriptionText)(gen, defender, defenseStat, field.defenderSide.isPowerTrick, field.isWonderRoom);
        if (field.defenderSide.isPowerTrick && field.isWonderRoom !== hitsPhysical) {
          desc.isPowerTrickDefender = true;
        }
        var boosts = defender.boosts[defenseStat];
        if (boosts === 0 || isCritical && boosts > 0 || move.ignoreDefensive) {
          defense = defender.rawStats[defenseStat];
        } else if (attacker.hasAbility("Unaware")) {
          defense = defender.rawStats[defenseStat];
          desc.attackerAbility = attacker.ability;
        } else {
          defense = (0, util_2.getModifiedStat)(defender.rawStats[defenseStat], boosts);
          desc.defenseBoost = boosts;
        }
        if (field.hasWeather("Sand") && defender.hasType("Rock") && !hitsPhysical) {
          defense = (0, util_2.pokeRound)(defense * 3 / 2);
          desc.weather = field.weather;
        }
        var dfMods = calculateDfModsBWXY(gen, defender, field, desc, hitsPhysical);
        defense = (0, util_2.OF16)(Math.max(1, (0, util_2.pokeRound)(defense * (0, util_2.chainMods)(dfMods, 410, 131072) / 4096)));
        return defense;
      }
      exports.calculateDefenseBWXY = calculateDefenseBWXY;
      function calculateDfModsBWXY(gen, defender, field, desc, hitsPhysical) {
        var _a;
        if (hitsPhysical === void 0) {
          hitsPhysical = false;
        }
        var dfMods = [];
        if (defender.hasAbility("Marvel Scale") && defender.status && hitsPhysical) {
          dfMods.push(6144);
          desc.defenderAbility = defender.ability;
        } else if (defender.named("Cherrim") && defender.hasAbility("Flower Gift") && field.hasWeather("Sun", "Harsh Sunshine") && !hitsPhysical) {
          dfMods.push(6144);
          desc.defenderAbility = defender.ability;
          desc.weather = field.weather;
        } else if (field.defenderSide.isFlowerGift && field.hasWeather("Sun", "Harsh Sunshine") && !hitsPhysical) {
          dfMods.push(6144);
          desc.weather = field.weather;
          desc.isFlowerGiftDefender = true;
        }
        if (field.hasTerrain("Grassy") && defender.hasAbility("Grass Pelt") && hitsPhysical) {
          dfMods.push(6144);
          desc.defenderAbility = defender.ability;
        }
        if (!hitsPhysical && defender.hasItem("Soul Dew") && defender.named("Latios", "Latias", "Latios-Mega", "Latias-Mega") || defender.hasItem("Eviolite") && ((_a = gen.species.get((0, util_1.toID)(defender.name))) === null || _a === void 0 ? void 0 : _a.nfe) || !hitsPhysical && defender.hasItem("Assault Vest")) {
          dfMods.push(6144);
          desc.defenderItem = defender.item;
        }
        if (defender.hasItem("Metal Powder") && defender.named("Ditto") && hitsPhysical || defender.hasItem("Deep Sea Scale") && defender.named("Clamperl") && !hitsPhysical) {
          dfMods.push(8192);
          desc.defenderItem = defender.item;
        }
        if (defender.hasAbility("Fur Coat") && hitsPhysical) {
          dfMods.push(8192);
          desc.defenderAbility = defender.ability;
        }
        return dfMods;
      }
      exports.calculateDfModsBWXY = calculateDfModsBWXY;
      function calculateBaseDamageBWXY(gen, attacker, basePower, attack, defense, move, field, desc, isCritical) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        var baseDamage = (0, util_2.getBaseDamage)(attacker.level, basePower, attack, defense);
        var isSpread = field.gameType !== "Singles" && ["allAdjacent", "allAdjacentFoes"].includes(move.target);
        if (isSpread) {
          baseDamage = (0, util_2.pokeRound)((0, util_2.OF32)(baseDamage * 3072) / 4096);
        }
        if (attacker.hasAbility("Parental Bond (Child)")) {
          baseDamage = (0, util_2.pokeRound)((0, util_2.OF32)(baseDamage * 2048) / 4096);
        }
        if (field.hasWeather("Sun", "Harsh Sunshine") && move.hasType("Fire") || field.hasWeather("Rain", "Heavy Rain") && move.hasType("Water")) {
          baseDamage = (0, util_2.pokeRound)((0, util_2.OF32)(baseDamage * 6144) / 4096);
          desc.weather = field.weather;
        } else if (field.hasWeather("Sun") && move.hasType("Water") || field.hasWeather("Rain") && move.hasType("Fire")) {
          baseDamage = (0, util_2.pokeRound)((0, util_2.OF32)(baseDamage * 2048) / 4096);
          desc.weather = field.weather;
        }
        if (isCritical) {
          baseDamage = Math.floor((0, util_2.OF32)(baseDamage * (gen.num > 5 ? 1.5 : 2)));
          desc.isCritical = isCritical;
        }
        return baseDamage;
      }
      function calculateFinalModsBWXY(gen, attacker, defender, move, field, desc, isCritical, typeEffectiveness, hitCount) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        if (hitCount === void 0) {
          hitCount = 0;
        }
        var finalMods = [];
        if (field.defenderSide.isReflect && move.category === "Physical" && !isCritical) {
          finalMods.push(field.gameType !== "Singles" ? gen.num > 5 ? 2732 : 2703 : 2048);
          desc.isReflect = true;
        } else if (field.defenderSide.isLightScreen && move.category === "Special" && !isCritical) {
          finalMods.push(field.gameType !== "Singles" ? gen.num > 5 ? 2732 : 2703 : 2048);
          desc.isLightScreen = true;
        }
        if (defender.hasAbility("Multiscale") && defender.curHP() === defender.maxHP() && hitCount === 0 && !field.defenderSide.isSR && (!field.defenderSide.spikes || defender.hasType("Flying")) && !attacker.hasAbility("Parental Bond (Child)")) {
          finalMods.push(2048);
          desc.defenderAbility = defender.ability;
        }
        if (attacker.hasAbility("Tinted Lens") && typeEffectiveness < 1) {
          finalMods.push(8192);
          desc.attackerAbility = attacker.ability;
        }
        if (field.defenderSide.isFriendGuard) {
          finalMods.push(3072);
          desc.isFriendGuard = true;
        }
        if (attacker.hasAbility("Sniper") && isCritical) {
          finalMods.push(6144);
          desc.attackerAbility = attacker.ability;
        }
        if (defender.hasAbility("Solid Rock", "Filter") && typeEffectiveness > 1) {
          finalMods.push(3072);
          desc.defenderAbility = defender.ability;
        }
        if (attacker.hasItem("Metronome") && move.timesUsedWithMetronome >= 1) {
          var timesUsedWithMetronome = Math.floor(move.timesUsedWithMetronome);
          if (timesUsedWithMetronome <= 4) {
            finalMods.push(4096 + timesUsedWithMetronome * 819);
          } else {
            finalMods.push(8192);
          }
          desc.attackerItem = attacker.item;
        }
        if (attacker.hasItem("Expert Belt") && typeEffectiveness > 1 && !move.isZ) {
          finalMods.push(4915);
          desc.attackerItem = attacker.item;
        } else if (attacker.hasItem("Life Orb")) {
          finalMods.push(5324);
          desc.attackerItem = attacker.item;
        }
        if (move.hasType((0, items_1.getBerryResistType)(defender.item)) && (typeEffectiveness > 1 || move.hasType("Normal")) && hitCount === 0 && !attacker.hasAbility("Unnerve")) {
          finalMods.push(2048);
          desc.defenderItem = defender.item;
        }
        return finalMods;
      }
    }
  });

  // node_modules/@smogon/calc/dist/mechanics/gen789.js
  var require_gen789 = __commonJS({
    "node_modules/@smogon/calc/dist/mechanics/gen789.js"(exports) {
      "use strict";
      exports.__esModule = true;
      exports.calculateFinalModsSMSSSV = exports.calculateDfModsSMSSSV = exports.calculateDefenseSMSSSV = exports.calculateAtModsSMSSSV = exports.calculateAttackSMSSSV = exports.calculateBPModsSMSSSV = exports.calculateBasePowerSMSSSV = exports.calculateSMSSSV = void 0;
      var util_1 = require_util();
      var items_1 = require_items2();
      var result_1 = require_result();
      var util_2 = require_util2();
      function calculateSMSSSV(gen, attacker, defender, move, field) {
        var _a;
        (0, util_2.checkAirLock)(attacker, field);
        (0, util_2.checkAirLock)(defender, field);
        (0, util_2.checkTeraformZero)(attacker, field);
        (0, util_2.checkTeraformZero)(defender, field);
        (0, util_2.checkForecast)(attacker, field.weather);
        (0, util_2.checkForecast)(defender, field.weather);
        (0, util_2.checkItem)(attacker, field.isMagicRoom);
        (0, util_2.checkItem)(defender, field.isMagicRoom);
        (0, util_2.checkRawStatChanges)(attacker, field.attackerSide.isPowerTrick, field.isWonderRoom);
        (0, util_2.checkRawStatChanges)(defender, field.defenderSide.isPowerTrick, field.isWonderRoom);
        (0, util_2.checkSeedBoost)(attacker, field);
        (0, util_2.checkSeedBoost)(defender, field);
        (0, util_2.checkDauntlessShield)(attacker, gen);
        (0, util_2.checkDauntlessShield)(defender, gen);
        (0, util_2.checkEmbody)(attacker, gen);
        (0, util_2.checkEmbody)(defender, gen);
        (0, util_2.computeFinalStats)(gen, attacker, defender, field, "def", "spd", "spe");
        (0, util_2.checkIntimidate)(gen, attacker, defender);
        (0, util_2.checkIntimidate)(gen, defender, attacker);
        (0, util_2.checkDownload)(attacker, defender, field.isWonderRoom);
        (0, util_2.checkDownload)(defender, attacker, field.isWonderRoom);
        (0, util_2.checkIntrepidSword)(attacker, gen);
        (0, util_2.checkIntrepidSword)(defender, gen);
        (0, util_2.checkWindRider)(attacker, field.attackerSide);
        (0, util_2.checkWindRider)(defender, field.defenderSide);
        if (move.named("Meteor Beam", "Electro Shot")) {
          attacker.boosts.spa += attacker.hasAbility("Simple") ? 2 : attacker.hasAbility("Contrary") ? -1 : 1;
          attacker.boosts.spa = Math.min(6, Math.max(-6, attacker.boosts.spa));
        }
        (0, util_2.computeFinalStats)(gen, attacker, defender, field, "atk", "spa");
        (0, util_2.checkInfiltrator)(attacker, field.defenderSide);
        (0, util_2.checkInfiltrator)(defender, field.attackerSide);
        var desc = {
          attackerName: attacker.name,
          moveName: move.name,
          defenderName: defender.name,
          isDefenderDynamaxed: defender.isDynamaxed,
          isWonderRoom: field.isWonderRoom
        };
        if (attacker.teraType !== "Stellar" || move.name === "Tera Blast" || move.isStellarFirstUse) {
          desc.isStellarFirstUse = attacker.name !== "Terapagos-Stellar" && move.name === "Tera Blast" && attacker.teraType === "Stellar" && move.isStellarFirstUse;
          desc.attackerTera = attacker.teraType;
        }
        if (defender.teraType !== "Stellar")
          desc.defenderTera = defender.teraType;
        if (move.named("Photon Geyser", "Light That Burns the Sky") || move.named("Tera Blast") && attacker.teraType || move.named("Tera Starstorm") && attacker.teraType && attacker.named("Terapagos-Stellar")) {
          move.category = attacker.stats.atk > attacker.stats.spa ? "Physical" : "Special";
        }
        var result = new result_1.Result(gen, attacker, defender, move, field, 0, desc);
        if (move.category === "Status" && !move.named("Nature Power")) {
          return result;
        }
        if (move.flags.punch && attacker.hasItem("Punching Glove")) {
          desc.attackerItem = attacker.item;
          move.flags.contact = 0;
        }
        if (move.named("Shell Side Arm") && (0, util_2.getShellSideArmCategory)(attacker, defender, field.isWonderRoom) === "Physical") {
          move.category = "Physical";
          move.flags.contact = 1;
        }
        var breaksProtect = move.breaksProtect || move.isZ || attacker.isDynamaxed || attacker.hasAbility("Unseen Fist") && move.flags.contact;
        if (field.defenderSide.isProtected && !breaksProtect) {
          desc.isProtected = true;
          return result;
        }
        if (move.name === "Pain Split") {
          var average = Math.floor((attacker.curHP() + defender.curHP()) / 2);
          var damage_1 = Math.max(0, defender.curHP() - average);
          result.damage = damage_1;
          return result;
        }
        var defenderAbilityIgnored = defender.hasAbility("Armor Tail", "Aroma Veil", "Aura Break", "Battle Armor", "Big Pecks", "Bulletproof", "Clear Body", "Contrary", "Damp", "Dazzling", "Disguise", "Dry Skin", "Earth Eater", "Filter", "Flash Fire", "Flower Gift", "Flower Veil", "Fluffy", "Friend Guard", "Fur Coat", "Good as Gold", "Grass Pelt", "Guard Dog", "Heatproof", "Heavy Metal", "Hyper Cutter", "Ice Face", "Ice Scales", "Illuminate", "Immunity", "Inner Focus", "Insomnia", "Keen Eye", "Leaf Guard", "Levitate", "Light Metal", "Lightning Rod", "Limber", "Magic Bounce", "Magma Armor", "Marvel Scale", "Mind's Eye", "Mirror Armor", "Motor Drive", "Multiscale", "Oblivious", "Overcoat", "Own Tempo", "Pastel Veil", "Punk Rock", "Purifying Salt", "Queenly Majesty", "Sand Veil", "Sap Sipper", "Shell Armor", "Shield Dust", "Simple", "Snow Cloak", "Solid Rock", "Soundproof", "Sticky Hold", "Storm Drain", "Sturdy", "Suction Cups", "Sweet Veil", "Tangled Feet", "Telepathy", "Tera Shell", "Thermal Exchange", "Thick Fat", "Unaware", "Vital Spirit", "Volt Absorb", "Water Absorb", "Water Bubble", "Water Veil", "Well-Baked Body", "White Smoke", "Wind Rider", "Wonder Guard", "Wonder Skin");
        var attackerIgnoresAbility = attacker.hasAbility("Mold Breaker", "Teravolt", "Turboblaze");
        var moveIgnoresAbility = move.named("G-Max Drum Solo", "G-Max Fire Ball", "G-Max Hydrosnipe", "Light That Burns the Sky", "Menacing Moonraze Maelstrom", "Moongeist Beam", "Photon Geyser", "Searing Sunraze Smash", "Sunsteel Strike");
        if (defenderAbilityIgnored && (attackerIgnoresAbility || moveIgnoresAbility)) {
          if (attackerIgnoresAbility)
            desc.attackerAbility = attacker.ability;
          if (defender.hasItem("Ability Shield")) {
            desc.defenderItem = defender.item;
          } else {
            defender.ability = "";
          }
        }
        var ignoresNeutralizingGas = [
          "As One (Glastrier)",
          "As One (Spectrier)",
          "Battle Bond",
          "Comatose",
          "Disguise",
          "Gulp Missile",
          "Ice Face",
          "Multitype",
          "Neutralizing Gas",
          "Power Construct",
          "RKS System",
          "Schooling",
          "Shields Down",
          "Stance Change",
          "Tera Shift",
          "Zen Mode",
          "Zero to Hero"
        ];
        if (attacker.hasAbility("Neutralizing Gas") && !ignoresNeutralizingGas.includes(defender.ability || "")) {
          desc.attackerAbility = attacker.ability;
          if (defender.hasItem("Ability Shield")) {
            desc.defenderItem = defender.item;
          } else {
            defender.ability = "";
          }
        }
        if (defender.hasAbility("Neutralizing Gas") && !ignoresNeutralizingGas.includes(attacker.ability || "")) {
          desc.defenderAbility = defender.ability;
          if (attacker.hasItem("Ability Shield")) {
            desc.attackerItem = attacker.item;
          } else {
            attacker.ability = "";
          }
        }
        var isCritical = !defender.hasAbility("Battle Armor", "Shell Armor") && (move.isCrit || attacker.hasAbility("Merciless") && defender.hasStatus("psn", "tox")) && move.timesUsed === 1;
        var type = move.type;
        if (move.originalName === "Weather Ball") {
          var holdingUmbrella = attacker.hasItem("Utility Umbrella");
          type = field.hasWeather("Sun", "Harsh Sunshine") && !holdingUmbrella ? "Fire" : field.hasWeather("Rain", "Heavy Rain") && !holdingUmbrella ? "Water" : field.hasWeather("Sand") ? "Rock" : field.hasWeather("Hail", "Snow") ? "Ice" : "Normal";
          desc.weather = field.weather;
          desc.moveType = type;
        } else if (move.named("Judgment") && attacker.item && attacker.item.includes("Plate")) {
          type = (0, items_1.getItemBoostType)(attacker.item);
        } else if (move.originalName === "Techno Blast" && attacker.item && attacker.item.includes("Drive")) {
          type = (0, items_1.getTechnoBlast)(attacker.item);
          desc.moveType = type;
        } else if (move.originalName === "Multi-Attack" && attacker.item && attacker.item.includes("Memory")) {
          type = (0, items_1.getMultiAttack)(attacker.item);
          desc.moveType = type;
        } else if (move.named("Natural Gift") && ((_a = attacker.item) === null || _a === void 0 ? void 0 : _a.endsWith("Berry"))) {
          var gift = (0, items_1.getNaturalGift)(gen, attacker.item);
          type = gift.t;
          desc.moveType = type;
          desc.attackerItem = attacker.item;
        } else if (move.named("Nature Power") || move.originalName === "Terrain Pulse" && (0, util_2.isGrounded)(attacker, field)) {
          type = field.hasTerrain("Electric") ? "Electric" : field.hasTerrain("Grassy") ? "Grass" : field.hasTerrain("Misty") ? "Fairy" : field.hasTerrain("Psychic") ? "Psychic" : "Normal";
          desc.terrain = field.terrain;
          if (move.isMax) {
            desc.moveType = type;
          }
          if (!(move.named("Nature Power") && attacker.hasAbility("Prankster")) && (defender.types.includes("Dark") || field.hasTerrain("Psychic") && (0, util_2.isGrounded)(defender, field))) {
            desc.moveType = type;
          }
        } else if (move.originalName === "Revelation Dance") {
          if (attacker.teraType) {
            type = attacker.teraType;
          } else {
            type = attacker.types[0];
          }
        } else if (move.named("Aura Wheel")) {
          if (attacker.named("Morpeko")) {
            type = "Electric";
          } else if (attacker.named("Morpeko-Hangry")) {
            type = "Dark";
          }
        } else if (move.named("Raging Bull")) {
          if (attacker.named("Tauros-Paldea-Combat")) {
            type = "Fighting";
          } else if (attacker.named("Tauros-Paldea-Blaze")) {
            type = "Fire";
          } else if (attacker.named("Tauros-Paldea-Aqua")) {
            type = "Water";
          }
          field.defenderSide.isReflect = false;
          field.defenderSide.isLightScreen = false;
          field.defenderSide.isAuroraVeil = false;
        } else if (move.named("Ivy Cudgel")) {
          if (attacker.name.includes("Ogerpon-Cornerstone")) {
            type = "Rock";
          } else if (attacker.name.includes("Ogerpon-Hearthflame")) {
            type = "Fire";
          } else if (attacker.name.includes("Ogerpon-Wellspring")) {
            type = "Water";
          }
        } else if (move.named("Tera Starstorm") && attacker.name === "Terapagos-Stellar") {
          move.target = "allAdjacentFoes";
          type = "Stellar";
        } else if (move.named("Brick Break", "Psychic Fangs")) {
          field.defenderSide.isReflect = false;
          field.defenderSide.isLightScreen = false;
          field.defenderSide.isAuroraVeil = false;
        }
        var hasAteAbilityTypeChange = false;
        var isAerilate = false;
        var isPixilate = false;
        var isRefrigerate = false;
        var isGalvanize = false;
        var isLiquidVoice = false;
        var isNormalize = false;
        var noTypeChange = move.named("Revelation Dance", "Judgment", "Nature Power", "Techno Blast", "Multi-Attack", "Natural Gift", "Weather Ball", "Terrain Pulse", "Struggle") || move.named("Tera Blast") && attacker.teraType;
        if (!move.isZ && !noTypeChange) {
          var normal = type === "Normal";
          if (isAerilate = attacker.hasAbility("Aerilate") && normal) {
            type = "Flying";
          } else if (isGalvanize = attacker.hasAbility("Galvanize") && normal) {
            type = "Electric";
          } else if (isLiquidVoice = attacker.hasAbility("Liquid Voice") && !!move.flags.sound) {
            type = "Water";
          } else if (isPixilate = attacker.hasAbility("Pixilate") && normal) {
            type = "Fairy";
          } else if (isRefrigerate = attacker.hasAbility("Refrigerate") && normal) {
            type = "Ice";
          } else if (isNormalize = attacker.hasAbility("Normalize")) {
            type = "Normal";
          }
          if (isGalvanize || isPixilate || isRefrigerate || isAerilate || isNormalize) {
            desc.attackerAbility = attacker.ability;
            hasAteAbilityTypeChange = true;
          } else if (isLiquidVoice) {
            desc.attackerAbility = attacker.ability;
          }
        }
        if (move.named("Tera Blast") && attacker.teraType) {
          type = attacker.teraType;
        }
        move.type = type;
        var isGhostRevealed = attacker.hasAbility("Scrappy") || attacker.hasAbility("Mind's Eye") || field.defenderSide.isForesight;
        var isRingTarget = defender.hasItem("Ring Target") && !defender.hasAbility("Klutz");
        var type1Effectiveness = (0, util_2.getMoveEffectiveness)(gen, move, defender.types[0], isGhostRevealed, field.isGravity, isRingTarget);
        var type2Effectiveness = defender.types[1] ? (0, util_2.getMoveEffectiveness)(gen, move, defender.types[1], isGhostRevealed, field.isGravity, isRingTarget) : 1;
        var typeEffectiveness = type1Effectiveness * type2Effectiveness;
        if (defender.teraType && defender.teraType !== "Stellar") {
          typeEffectiveness = (0, util_2.getMoveEffectiveness)(gen, move, defender.teraType, isGhostRevealed, field.isGravity, isRingTarget);
        }
        if (typeEffectiveness === 0 && move.hasType("Ground") && defender.hasItem("Iron Ball") && !defender.hasAbility("Klutz")) {
          typeEffectiveness = 1;
        }
        if (typeEffectiveness === 0 && move.named("Thousand Arrows")) {
          typeEffectiveness = 1;
        }
        if (typeEffectiveness === 0) {
          return result;
        }
        if (move.named("Sky Drop") && (defender.hasType("Flying") || defender.weightkg >= 200 || field.isGravity) || move.named("Synchronoise") && !defender.hasType(attacker.types[0]) && (!attacker.types[1] || !defender.hasType(attacker.types[1])) || move.named("Dream Eater") && !(defender.hasStatus("slp") || defender.hasAbility("Comatose")) || move.named("Steel Roller") && !field.terrain || move.named("Poltergeist") && (!defender.item || (0, util_2.isQPActive)(defender, field) && defender.hasItem("Booster Energy"))) {
          return result;
        }
        if (field.hasWeather("Harsh Sunshine") && move.hasType("Water") || field.hasWeather("Heavy Rain") && move.hasType("Fire")) {
          desc.weather = field.weather;
          return result;
        }
        if (field.hasWeather("Strong Winds") && defender.hasType("Flying") && gen.types.get((0, util_1.toID)(move.type)).effectiveness["Flying"] > 1) {
          typeEffectiveness /= 2;
          desc.weather = field.weather;
        }
        if (move.type === "Stellar") {
          desc.defenderTera = defender.teraType;
          typeEffectiveness = !defender.teraType ? 1 : 2;
        }
        var turn2typeEffectiveness = typeEffectiveness;
        if (defender.hasAbility("Tera Shell") && defender.curHP() === defender.maxHP() && (!field.defenderSide.isSR && (!field.defenderSide.spikes || defender.hasType("Flying")) || defender.hasItem("Heavy-Duty Boots"))) {
          typeEffectiveness = 0.5;
          desc.defenderAbility = defender.ability;
        }
        if (defender.hasAbility("Wonder Guard") && typeEffectiveness <= 1 || move.hasType("Grass") && defender.hasAbility("Sap Sipper") || move.hasType("Fire") && defender.hasAbility("Flash Fire", "Well-Baked Body") || move.hasType("Water") && defender.hasAbility("Dry Skin", "Storm Drain", "Water Absorb") || move.hasType("Electric") && defender.hasAbility("Lightning Rod", "Motor Drive", "Volt Absorb") || move.hasType("Ground") && !field.isGravity && !move.named("Thousand Arrows") && !defender.hasItem("Iron Ball") && defender.hasAbility("Levitate") || move.flags.bullet && defender.hasAbility("Bulletproof") || move.flags.sound && !move.named("Clangorous Soul") && defender.hasAbility("Soundproof") || move.priority > 0 && defender.hasAbility("Queenly Majesty", "Dazzling", "Armor Tail") || move.hasType("Ground") && defender.hasAbility("Earth Eater") || move.flags.wind && defender.hasAbility("Wind Rider")) {
          desc.defenderAbility = defender.ability;
          return result;
        }
        if (move.hasType("Ground") && !move.named("Thousand Arrows") && !field.isGravity && defender.hasItem("Air Balloon")) {
          desc.defenderItem = defender.item;
          return result;
        }
        if (move.priority > 0 && field.hasTerrain("Psychic") && (0, util_2.isGrounded)(defender, field)) {
          desc.terrain = field.terrain;
          return result;
        }
        var weightBasedMove = move.named("Heat Crash", "Heavy Slam", "Low Kick", "Grass Knot");
        if (defender.isDynamaxed && weightBasedMove) {
          return result;
        }
        desc.HPEVs = (0, util_2.getStatDescriptionText)(gen, defender, "hp");
        var fixedDamage = (0, util_2.handleFixedDamageMoves)(attacker, move);
        if (fixedDamage) {
          if (attacker.hasAbility("Parental Bond")) {
            result.damage = [fixedDamage, fixedDamage];
            desc.attackerAbility = attacker.ability;
          } else {
            result.damage = fixedDamage;
          }
          return result;
        }
        if (move.named("Final Gambit")) {
          result.damage = attacker.curHP();
          return result;
        }
        if (move.named("Guardian of Alola")) {
          var zLostHP = Math.floor(defender.curHP() * 3 / 4);
          if (field.defenderSide.isProtected && attacker.item && attacker.item.includes(" Z")) {
            zLostHP = Math.ceil(zLostHP / 4 - 0.5);
          }
          result.damage = zLostHP;
          return result;
        }
        if (move.named("Nature's Madness")) {
          var lostHP = field.defenderSide.isProtected ? 0 : Math.floor(defender.curHP() / 2);
          result.damage = lostHP;
          return result;
        }
        if (move.named("Spectral Thief")) {
          var stat = void 0;
          for (stat in defender.boosts) {
            if (defender.boosts[stat] > 0) {
              attacker.boosts[stat] += attacker.hasAbility("Contrary") ? -defender.boosts[stat] : defender.boosts[stat];
              if (attacker.boosts[stat] > 6)
                attacker.boosts[stat] = 6;
              if (attacker.boosts[stat] < -6)
                attacker.boosts[stat] = -6;
              attacker.stats[stat] = (0, util_2.getModifiedStat)(attacker.rawStats[stat], attacker.boosts[stat]);
              defender.boosts[stat] = 0;
              defender.stats[stat] = defender.rawStats[stat];
            }
          }
        }
        if (move.hits > 1) {
          desc.hits = move.hits;
        }
        var turnOrder = attacker.stats.spe > defender.stats.spe ? "first" : "last";
        var basePower = calculateBasePowerSMSSSV(gen, attacker, defender, move, field, hasAteAbilityTypeChange, desc);
        if (basePower === 0) {
          return result;
        }
        var attack = calculateAttackSMSSSV(gen, attacker, defender, move, field, desc, isCritical);
        var defense = calculateDefenseSMSSSV(gen, attacker, defender, move, field, desc, isCritical);
        var hitsPhysical = move.overrideDefensiveStat === "def" || move.category === "Physical";
        var defenseStat = hitsPhysical ? "def" : "spd";
        var baseDamage = calculateBaseDamageSMSSSV(gen, attacker, defender, basePower, attack, defense, move, field, desc, isCritical);
        if (attacker.hasAbility("Triage") && move.drain || attacker.hasAbility("Gale Wings") && move.hasType("Flying") && attacker.curHP() === attacker.maxHP()) {
          move.priority = 1;
          desc.attackerAbility = attacker.ability;
        }
        if (hasTerrainSeed(defender) && field.hasTerrain(defender.item.substring(0, defender.item.indexOf(" "))) && items_1.SEED_BOOSTED_STAT[defender.item] === defenseStat) {
          desc.defenderItem = defender.item;
        }
        var preStellarStabMod = (0, util_2.getStabMod)(attacker, move, desc);
        var stabMod = (0, util_2.getStellarStabMod)(attacker, move, preStellarStabMod);
        var applyBurn = attacker.hasStatus("brn") && move.category === "Physical" && !attacker.hasAbility("Guts") && !move.named("Facade");
        desc.isBurned = applyBurn;
        var finalMods = calculateFinalModsSMSSSV(gen, attacker, defender, move, field, desc, isCritical, typeEffectiveness);
        var protect = false;
        if (field.defenderSide.isProtected && (attacker.isDynamaxed || move.isZ && attacker.item && attacker.item.includes(" Z"))) {
          protect = true;
          desc.isProtected = true;
        }
        var finalMod = (0, util_2.chainMods)(finalMods, 41, 131072);
        var isSpread = field.gameType !== "Singles" && ["allAdjacent", "allAdjacentFoes"].includes(move.target);
        var childDamage;
        if (attacker.hasAbility("Parental Bond") && move.hits === 1 && !isSpread) {
          var child = attacker.clone();
          child.ability = "Parental Bond (Child)";
          (0, util_2.checkMultihitBoost)(gen, child, defender, move, field, desc);
          childDamage = calculateSMSSSV(gen, child, defender, move, field).damage;
          desc.attackerAbility = attacker.ability;
        }
        var damage = [];
        for (var i = 0; i < 16; i++) {
          damage[i] = (0, util_2.getFinalDamage)(baseDamage, i, typeEffectiveness, applyBurn, stabMod, finalMod, protect);
        }
        result.damage = childDamage ? [damage, childDamage] : damage;
        if (move.timesUsed > 1 || move.hits > 1) {
          var origDefBoost = desc.defenseBoost;
          var origAtkBoost = desc.attackBoost;
          var numAttacks = 1;
          if (move.timesUsed > 1) {
            desc.moveTurns = "over ".concat(move.timesUsed, " turns");
            numAttacks = move.timesUsed;
          } else {
            numAttacks = move.hits;
          }
          var usedItems = [false, false];
          var damageMatrix = [damage];
          for (var times = 1; times < numAttacks; times++) {
            usedItems = (0, util_2.checkMultihitBoost)(gen, attacker, defender, move, field, desc, usedItems[0], usedItems[1]);
            var newAttack = calculateAttackSMSSSV(gen, attacker, defender, move, field, desc, isCritical);
            var newDefense = calculateDefenseSMSSSV(gen, attacker, defender, move, field, desc, isCritical);
            hasAteAbilityTypeChange = hasAteAbilityTypeChange && attacker.hasAbility("Aerilate", "Galvanize", "Pixilate", "Refrigerate", "Normalize");
            if (move.timesUsed > 1) {
              preStellarStabMod = (0, util_2.getStabMod)(attacker, move, desc);
              typeEffectiveness = turn2typeEffectiveness;
              stabMod = (0, util_2.getStellarStabMod)(attacker, move, preStellarStabMod, times);
            }
            var newBasePower = calculateBasePowerSMSSSV(gen, attacker, defender, move, field, hasAteAbilityTypeChange, desc, times + 1);
            var newBaseDamage = calculateBaseDamageSMSSSV(gen, attacker, defender, newBasePower, newAttack, newDefense, move, field, desc, isCritical);
            var newFinalMods = calculateFinalModsSMSSSV(gen, attacker, defender, move, field, desc, isCritical, typeEffectiveness, times);
            var newFinalMod = (0, util_2.chainMods)(newFinalMods, 41, 131072);
            var damageArray = [];
            for (var i = 0; i < 16; i++) {
              var newFinalDamage = (0, util_2.getFinalDamage)(newBaseDamage, i, typeEffectiveness, applyBurn, stabMod, newFinalMod, protect);
              damageArray[i] = newFinalDamage;
            }
            damageMatrix[times] = damageArray;
          }
          result.damage = damageMatrix;
          desc.defenseBoost = origDefBoost;
          desc.attackBoost = origAtkBoost;
        }
        return result;
      }
      exports.calculateSMSSSV = calculateSMSSSV;
      function calculateBasePowerSMSSSV(gen, attacker, defender, move, field, hasAteAbilityTypeChange, desc, hit) {
        var _a;
        if (hit === void 0) {
          hit = 1;
        }
        var turnOrder = attacker.stats.spe > defender.stats.spe ? "first" : "last";
        var basePower;
        switch (move.name) {
          case "Payback":
            basePower = move.bp * (turnOrder === "last" ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Bolt Beak":
          case "Fishious Rend":
            basePower = move.bp * (turnOrder !== "last" ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Pursuit":
            var switching = field.defenderSide.isSwitching === "out";
            basePower = move.bp * (switching ? 2 : 1);
            if (switching)
              desc.isSwitching = "out";
            desc.moveBP = basePower;
            break;
          case "Electro Ball":
            var r = Math.floor(attacker.stats.spe / defender.stats.spe);
            basePower = r >= 4 ? 150 : r >= 3 ? 120 : r >= 2 ? 80 : r >= 1 ? 60 : 40;
            if (defender.stats.spe === 0)
              basePower = 40;
            desc.moveBP = basePower;
            break;
          case "Gyro Ball":
            basePower = Math.min(150, Math.floor(25 * defender.stats.spe / attacker.stats.spe) + 1);
            if (attacker.stats.spe === 0)
              basePower = 1;
            desc.moveBP = basePower;
            break;
          case "Punishment":
            basePower = Math.min(200, 60 + 20 * (0, util_2.countBoosts)(gen, defender.boosts));
            desc.moveBP = basePower;
            break;
          case "Low Kick":
          case "Grass Knot":
            var w = (0, util_2.getWeight)(defender, desc, "defender");
            basePower = w >= 200 ? 120 : w >= 100 ? 100 : w >= 50 ? 80 : w >= 25 ? 60 : w >= 10 ? 40 : 20;
            desc.moveBP = basePower;
            break;
          case "Hex":
          case "Infernal Parade":
            basePower = move.bp * (defender.status || defender.hasAbility("Comatose") ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Barb Barrage":
            basePower = move.bp * (defender.hasStatus("psn", "tox") ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Heavy Slam":
          case "Heat Crash":
            var wr = (0, util_2.getWeight)(attacker, desc, "attacker") / (0, util_2.getWeight)(defender, desc, "defender");
            basePower = wr >= 5 ? 120 : wr >= 4 ? 100 : wr >= 3 ? 80 : wr >= 2 ? 60 : 40;
            desc.moveBP = basePower;
            break;
          case "Stored Power":
          case "Power Trip":
            basePower = 20 + 20 * (0, util_2.countBoosts)(gen, attacker.boosts);
            desc.moveBP = basePower;
            break;
          case "Acrobatics":
            basePower = move.bp * (attacker.hasItem("Flying Gem") || (!attacker.item || (0, util_2.isQPActive)(attacker, field) && attacker.hasItem("Booster Energy")) ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Assurance":
            basePower = move.bp * (defender.hasAbility("Parental Bond (Child)") ? 2 : 1);
            break;
          case "Wake-Up Slap":
            basePower = move.bp * (defender.hasStatus("slp") || defender.hasAbility("Comatose") ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Smelling Salts":
            basePower = move.bp * (defender.hasStatus("par") ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Weather Ball":
            basePower = move.bp * (field.weather && !field.hasWeather("Strong Winds") ? 2 : 1);
            if (field.hasWeather("Sun", "Harsh Sunshine", "Rain", "Heavy Rain") && attacker.hasItem("Utility Umbrella"))
              basePower = move.bp;
            desc.moveBP = basePower;
            break;
          case "Terrain Pulse":
            basePower = move.bp * ((0, util_2.isGrounded)(attacker, field) && field.terrain ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Rising Voltage":
            basePower = move.bp * ((0, util_2.isGrounded)(defender, field) && field.hasTerrain("Electric") ? 2 : 1);
            desc.moveBP = basePower;
            break;
          case "Psyblade":
            basePower = move.bp * (field.hasTerrain("Electric") ? 1.5 : 1);
            if (field.hasTerrain("Electric")) {
              desc.moveBP = basePower;
              desc.terrain = field.terrain;
            }
            break;
          case "Fling":
            basePower = (0, items_1.getFlingPower)(attacker.item, gen.num);
            desc.moveBP = basePower;
            desc.attackerItem = attacker.item;
            break;
          case "Dragon Energy":
          case "Eruption":
          case "Water Spout":
            basePower = Math.max(1, Math.floor(150 * attacker.curHP() / attacker.maxHP()));
            desc.moveBP = basePower;
            break;
          case "Flail":
          case "Reversal":
            var p = Math.floor(48 * attacker.curHP() / attacker.maxHP());
            basePower = p <= 1 ? 200 : p <= 4 ? 150 : p <= 9 ? 100 : p <= 16 ? 80 : p <= 32 ? 40 : 20;
            desc.moveBP = basePower;
            break;
          case "Natural Gift":
            if ((_a = attacker.item) === null || _a === void 0 ? void 0 : _a.endsWith("Berry")) {
              var gift = (0, items_1.getNaturalGift)(gen, attacker.item);
              basePower = gift.p;
              desc.attackerItem = attacker.item;
              desc.moveBP = move.bp;
            } else {
              basePower = move.bp;
            }
            break;
          case "Nature Power":
            move.category = "Special";
            move.secondaries = true;
            if (attacker.hasAbility("Prankster") && defender.types.includes("Dark")) {
              basePower = 0;
              desc.moveName = "Nature Power";
              desc.attackerAbility = "Prankster";
              break;
            }
            switch (field.terrain) {
              case "Electric":
                basePower = 90;
                desc.moveName = "Thunderbolt";
                break;
              case "Grassy":
                basePower = 90;
                desc.moveName = "Energy Ball";
                break;
              case "Misty":
                basePower = 95;
                desc.moveName = "Moonblast";
                break;
              case "Psychic":
                if (attacker.hasAbility("Prankster") && (0, util_2.isGrounded)(defender, field)) {
                  basePower = 0;
                  desc.attackerAbility = "Prankster";
                } else {
                  basePower = 90;
                  desc.moveName = "Psychic";
                }
                break;
              default:
                basePower = 80;
                desc.moveName = "Tri Attack";
            }
            break;
          case "Water Shuriken":
            basePower = attacker.named("Greninja-Ash") && attacker.hasAbility("Battle Bond") ? 20 : 15;
            desc.moveBP = basePower;
            break;
          case "Triple Axel":
            basePower = hit * 20;
            desc.moveBP = move.hits === 2 ? 60 : move.hits === 3 ? 120 : 20;
            break;
          case "Triple Kick":
            basePower = hit * 10;
            desc.moveBP = move.hits === 2 ? 30 : move.hits === 3 ? 60 : 10;
            break;
          case "Crush Grip":
          case "Wring Out":
            basePower = 100 * Math.floor(defender.curHP() * 4096 / defender.maxHP());
            basePower = Math.floor(Math.floor((120 * basePower + 2048 - 1) / 4096) / 100) || 1;
            desc.moveBP = basePower;
            break;
          case "Hard Press":
            basePower = 100 * Math.floor(defender.curHP() * 4096 / defender.maxHP());
            basePower = Math.floor(Math.floor((100 * basePower + 2048 - 1) / 4096) / 100) || 1;
            desc.moveBP = basePower;
            break;
          case "Tera Blast":
            basePower = attacker.teraType === "Stellar" ? 100 : 80;
            desc.moveBP = basePower;
            break;
          default:
            basePower = move.bp;
        }
        if (basePower === 0) {
          return 0;
        }
        if (move.named("Breakneck Blitz", "Bloom Doom", "Inferno Overdrive", "Hydro Vortex", "Gigavolt Havoc", "Subzero Slammer", "Supersonic Skystrike", "Savage Spin-Out", "Acid Downpour", "Tectonic Rage", "Continental Crush", "All-Out Pummeling", "Shattered Psyche", "Never-Ending Nightmare", "Devastating Drake", "Black Hole Eclipse", "Corkscrew Crash", "Twinkle Tackle") || move.isMax) {
          desc.moveBP = move.bp;
        }
        var bpMods = calculateBPModsSMSSSV(gen, attacker, defender, move, field, desc, basePower, hasAteAbilityTypeChange, turnOrder, hit);
        basePower = (0, util_2.OF16)(Math.max(1, (0, util_2.pokeRound)(basePower * (0, util_2.chainMods)(bpMods, 41, 2097152) / 4096)));
        if (attacker.teraType && (move.type === attacker.teraType && attacker.hasType(attacker.teraType) || attacker.teraType === "Stellar" && move.isStellarFirstUse) && move.hits === 1 && !move.multiaccuracy && move.priority <= 0 && move.bp > 0 && !move.named("Dragon Energy", "Eruption", "Water Spout") && basePower < 60 && gen.num >= 9) {
          basePower = 60;
          desc.moveBP = 60;
        }
        return basePower;
      }
      exports.calculateBasePowerSMSSSV = calculateBasePowerSMSSSV;
      function calculateBPModsSMSSSV(gen, attacker, defender, move, field, desc, basePower, hasAteAbilityTypeChange, turnOrder, hit) {
        var bpMods = [];
        var defenderItem = defender.item && defender.item !== "" ? defender.item : defender.disabledItem;
        var resistedKnockOffDamage = !defenderItem || (0, util_2.isQPActive)(defender, field) && defenderItem === "Booster Energy" || defender.named("Dialga-Origin") && defenderItem === "Adamant Crystal" || defender.named("Palkia-Origin") && defenderItem === "Lustrous Globe" || defender.name.includes("Giratina-Origin") && defenderItem.includes("Griseous") || defender.name.includes("Arceus") && defenderItem.includes("Plate") || defender.name.includes("Genesect") && defenderItem.includes("Drive") || defender.named("Groudon", "Groudon-Primal") && defenderItem === "Red Orb" || defender.named("Kyogre", "Kyogre-Primal") && defenderItem === "Blue Orb" || defender.name.includes("Silvally") && defenderItem.includes("Memory") || defenderItem.includes(" Z") || defender.name.includes("Zacian") && defenderItem === "Rusted Sword" || defender.name.includes("Zamazenta") && defenderItem === "Rusted Shield" || defender.name.includes("Ogerpon-Cornerstone") && defenderItem === "Cornerstone Mask" || defender.name.includes("Ogerpon-Hearthflame") && defenderItem === "Hearthflame Mask" || defender.name.includes("Ogerpon-Wellspring") && defenderItem === "Wellspring Mask" || defender.named("Venomicon-Epilogue") && defenderItem === "Vile Vial";
        if (!resistedKnockOffDamage && defenderItem) {
          var item = gen.items.get((0, util_1.toID)(defenderItem));
          resistedKnockOffDamage = !!(item.megaStone && (item.megaStone[defender.name] || Object.values(item.megaStone).includes(defender.name)));
        }
        if (!resistedKnockOffDamage && hit > 1 && !defender.hasAbility("Sticky Hold")) {
          resistedKnockOffDamage = true;
        }
        if (move.named("Facade") && attacker.hasStatus("brn", "par", "psn", "tox") || move.named("Brine") && defender.curHP() <= defender.maxHP() / 2 || move.named("Venoshock") && defender.hasStatus("psn", "tox") || move.named("Lash Out") && (0, util_2.countBoosts)(gen, attacker.boosts) < 0) {
          bpMods.push(8192);
          desc.moveBP = basePower * 2;
        } else if (move.named("Expanding Force") && (0, util_2.isGrounded)(attacker, field) && field.hasTerrain("Psychic")) {
          move.target = "allAdjacentFoes";
          bpMods.push(6144);
          desc.moveBP = basePower * 1.5;
        } else if (move.named("Knock Off") && !resistedKnockOffDamage || move.named("Misty Explosion") && (0, util_2.isGrounded)(attacker, field) && field.hasTerrain("Misty") || move.named("Grav Apple") && field.isGravity) {
          bpMods.push(6144);
          desc.moveBP = basePower * 1.5;
        } else if (move.named("Solar Beam", "Solar Blade") && field.hasWeather("Rain", "Heavy Rain", "Sand", "Hail", "Snow")) {
          bpMods.push(2048);
          desc.moveBP = basePower / 2;
          desc.weather = field.weather;
        } else if (move.named("Collision Course", "Electro Drift")) {
          var isGhostRevealed = attacker.hasAbility("Scrappy") || attacker.hasAbility("Mind's Eye") || field.defenderSide.isForesight;
          var isRingTarget = defender.hasItem("Ring Target") && !defender.hasAbility("Klutz");
          var types = defender.teraType && defender.teraType !== "Stellar" ? [defender.teraType] : defender.types;
          var type1Effectiveness = (0, util_2.getMoveEffectiveness)(gen, move, types[0], isGhostRevealed, field.isGravity, isRingTarget);
          var type2Effectiveness = types[1] ? (0, util_2.getMoveEffectiveness)(gen, move, types[1], isGhostRevealed, field.isGravity, isRingTarget) : 1;
          if (type1Effectiveness * type2Effectiveness >= 2) {
            bpMods.push(5461);
            desc.moveBP = basePower * (5461 / 4096);
          }
        }
        if (field.attackerSide.isHelpingHand) {
          bpMods.push(6144);
          desc.isHelpingHand = true;
        }
        var terrainMultiplier = gen.num > 7 ? 5325 : 6144;
        if ((0, util_2.isGrounded)(attacker, field)) {
          if (field.hasTerrain("Electric") && move.hasType("Electric") || field.hasTerrain("Grassy") && move.hasType("Grass") || field.hasTerrain("Psychic") && move.hasType("Psychic")) {
            bpMods.push(terrainMultiplier);
            desc.terrain = field.terrain;
          }
        }
        if ((0, util_2.isGrounded)(defender, field)) {
          if (field.hasTerrain("Misty") && move.hasType("Dragon") || field.hasTerrain("Grassy") && move.named("Bulldoze", "Earthquake")) {
            bpMods.push(2048);
            desc.terrain = field.terrain;
          }
        }
        if (attacker.hasAbility("Technician") && basePower <= 60 || attacker.hasAbility("Flare Boost") && attacker.hasStatus("brn") && move.category === "Special" || attacker.hasAbility("Toxic Boost") && attacker.hasStatus("psn", "tox") && move.category === "Physical" || attacker.hasAbility("Mega Launcher") && move.flags.pulse || attacker.hasAbility("Strong Jaw") && move.flags.bite || attacker.hasAbility("Steely Spirit") && move.hasType("Steel") || attacker.hasAbility("Sharpness") && move.flags.slicing) {
          bpMods.push(6144);
          desc.attackerAbility = attacker.ability;
        }
        var aura = "".concat(move.type, " Aura");
        var isAttackerAura = attacker.hasAbility(aura);
        var isDefenderAura = defender.hasAbility(aura);
        var isUserAuraBreak = attacker.hasAbility("Aura Break") || defender.hasAbility("Aura Break");
        var isFieldAuraBreak = field.isAuraBreak;
        var isFieldFairyAura = field.isFairyAura && move.type === "Fairy";
        var isFieldDarkAura = field.isDarkAura && move.type === "Dark";
        var auraActive = isAttackerAura || isDefenderAura || isFieldFairyAura || isFieldDarkAura;
        var auraBreak = isFieldAuraBreak || isUserAuraBreak;
        if (auraActive) {
          if (auraBreak) {
            bpMods.push(3072);
            desc.attackerAbility = attacker.ability;
            desc.defenderAbility = defender.ability;
          } else {
            bpMods.push(5448);
            if (isAttackerAura)
              desc.attackerAbility = attacker.ability;
            if (isDefenderAura)
              desc.defenderAbility = defender.ability;
          }
        }
        if (attacker.hasAbility("Sheer Force") && (move.secondaries || move.named("Electro Shot", "Order Up")) && !move.isMax || attacker.hasAbility("Sand Force") && field.hasWeather("Sand") && move.hasType("Rock", "Ground", "Steel") || attacker.hasAbility("Analytic") && (turnOrder !== "first" || field.defenderSide.isSwitching === "out") || attacker.hasAbility("Tough Claws") && move.flags.contact || attacker.hasAbility("Punk Rock") && move.flags.sound) {
          bpMods.push(5325);
          desc.attackerAbility = attacker.ability;
        }
        if (field.attackerSide.isBattery && move.category === "Special") {
          bpMods.push(5325);
          desc.isBattery = true;
        }
        if (field.attackerSide.isPowerSpot) {
          bpMods.push(5325);
          desc.isPowerSpot = true;
        }
        if (attacker.hasAbility("Rivalry") && ![attacker.gender, defender.gender].includes("N")) {
          if (attacker.gender === defender.gender) {
            bpMods.push(5120);
            desc.rivalry = "buffed";
          } else {
            bpMods.push(3072);
            desc.rivalry = "nerfed";
          }
          desc.attackerAbility = attacker.ability;
        }
        if (!move.isMax && hasAteAbilityTypeChange) {
          bpMods.push(4915);
        }
        if (attacker.hasAbility("Reckless") && (move.recoil || move.hasCrashDamage) || attacker.hasAbility("Iron Fist") && move.flags.punch) {
          bpMods.push(4915);
          desc.attackerAbility = attacker.ability;
        }
        if (gen.num <= 8 && defender.hasAbility("Heatproof") && move.hasType("Fire")) {
          bpMods.push(2048);
          desc.defenderAbility = defender.ability;
        } else if (defender.hasAbility("Dry Skin") && move.hasType("Fire")) {
          bpMods.push(5120);
          desc.defenderAbility = defender.ability;
        }
        if (attacker.hasAbility("Supreme Overlord") && attacker.alliesFainted) {
          var powMod = [4096, 4506, 4915, 5325, 5734, 6144];
          bpMods.push(powMod[Math.min(5, attacker.alliesFainted)]);
          desc.attackerAbility = attacker.ability;
          desc.alliesFainted = attacker.alliesFainted;
        }
        if (attacker.hasItem("".concat(move.type, " Gem"))) {
          bpMods.push(5325);
          desc.attackerItem = attacker.item;
        } else if ((attacker.hasItem("Adamant Crystal") && attacker.named("Dialga-Origin") || attacker.hasItem("Adamant Orb") && attacker.named("Dialga")) && move.hasType("Steel", "Dragon") || (attacker.hasItem("Lustrous Orb") && attacker.named("Palkia") || attacker.hasItem("Lustrous Globe") && attacker.named("Palkia-Origin")) && move.hasType("Water", "Dragon") || (attacker.hasItem("Griseous Orb") || attacker.hasItem("Griseous Core")) && (attacker.named("Giratina-Origin") || attacker.named("Giratina")) && move.hasType("Ghost", "Dragon") || attacker.hasItem("Vile Vial") && attacker.named("Venomicon-Epilogue") && move.hasType("Poison", "Flying") || attacker.hasItem("Soul Dew") && attacker.named("Latios", "Latias", "Latios-Mega", "Latias-Mega") && move.hasType("Psychic", "Dragon") || attacker.item && move.hasType((0, items_1.getItemBoostType)(attacker.item)) || attacker.name.includes("Ogerpon-Cornerstone") && attacker.hasItem("Cornerstone Mask") || attacker.name.includes("Ogerpon-Hearthflame") && attacker.hasItem("Hearthflame Mask") || attacker.name.includes("Ogerpon-Wellspring") && attacker.hasItem("Wellspring Mask")) {
          bpMods.push(4915);
          desc.attackerItem = attacker.item;
        } else if (attacker.hasItem("Muscle Band") && move.category === "Physical" || attacker.hasItem("Wise Glasses") && move.category === "Special") {
          bpMods.push(4505);
          desc.attackerItem = attacker.item;
        } else if (attacker.hasItem("Punching Glove") && move.flags.punch) {
          bpMods.push(4506);
        }
        return bpMods;
      }
      exports.calculateBPModsSMSSSV = calculateBPModsSMSSSV;
      function calculateAttackSMSSSV(gen, attacker, defender, move, field, desc, isCritical) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        var attack;
        var attackSource = move.named("Foul Play") ? defender : attacker;
        var attackStat = move.named("Body Press") ? field.isWonderRoom ? "spd" : "def" : move.category === "Special" ? "spa" : "atk";
        desc.attackEVs = move.named("Foul Play") ? (0, util_2.getStatDescriptionText)(gen, attackSource, attackStat, field.defenderSide.isPowerTrick) : (0, util_2.getStatDescriptionText)(gen, attackSource, attackStat, field.attackerSide.isPowerTrick, field.isWonderRoom);
        if (field.attackerSide.isPowerTrick) {
          if (move.category === "Physical" && !move.named("Foul Play") || move.named("Body Press")) {
            desc.isPowerTrickAttacker = true;
          }
        }
        var boosts = attackSource.boosts[attackStat];
        if (boosts === 0 || isCritical && boosts < 0) {
          attack = attackSource.rawStats[attackStat];
        } else if (defender.hasAbility("Unaware")) {
          attack = attackSource.rawStats[attackStat];
          desc.defenderAbility = defender.ability;
        } else {
          attack = (0, util_2.getModifiedStat)(attackSource.rawStats[attackStat], boosts);
          desc.attackBoost = boosts;
        }
        if (attacker.hasAbility("Hustle") && move.category === "Physical") {
          attack = (0, util_2.pokeRound)(attack * 3 / 2);
          desc.attackerAbility = attacker.ability;
        }
        var atMods = calculateAtModsSMSSSV(gen, attacker, defender, move, field, desc);
        attack = (0, util_2.OF16)(Math.max(1, (0, util_2.pokeRound)(attack * (0, util_2.chainMods)(atMods, 410, 131072) / 4096)));
        return attack;
      }
      exports.calculateAttackSMSSSV = calculateAttackSMSSSV;
      function calculateAtModsSMSSSV(gen, attacker, defender, move, field, desc) {
        var atMods = [];
        if (attacker.hasAbility("Slow Start") && attacker.abilityOn && (move.category === "Physical" || move.category === "Special" && move.isZ) || attacker.hasAbility("Defeatist") && attacker.curHP() <= attacker.maxHP() / 2) {
          atMods.push(2048);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Solar Power") && field.hasWeather("Sun", "Harsh Sunshine") && move.category === "Special" || attacker.named("Cherrim") && attacker.hasAbility("Flower Gift") && field.hasWeather("Sun", "Harsh Sunshine") && move.category === "Physical") {
          atMods.push(6144);
          desc.attackerAbility = attacker.ability;
          desc.weather = field.weather;
        } else if (attacker.hasAbility("Gorilla Tactics") && move.category === "Physical" && !attacker.isDynamaxed) {
          atMods.push(6144);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Guts") && attacker.status && move.category === "Physical" || attacker.curHP() <= attacker.maxHP() / 3 && (attacker.hasAbility("Overgrow") && move.hasType("Grass") || attacker.hasAbility("Blaze") && move.hasType("Fire") || attacker.hasAbility("Torrent") && move.hasType("Water") || attacker.hasAbility("Swarm") && move.hasType("Bug")) || move.category === "Special" && attacker.abilityOn && attacker.hasAbility("Plus", "Minus")) {
          atMods.push(6144);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Flash Fire") && attacker.abilityOn && move.hasType("Fire")) {
          atMods.push(6144);
          desc.attackerAbility = "Flash Fire";
        } else if (attacker.hasAbility("Steelworker") && move.hasType("Steel") || attacker.hasAbility("Dragon's Maw") && move.hasType("Dragon") || attacker.hasAbility("Rocky Payload") && move.hasType("Rock")) {
          atMods.push(6144);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Transistor") && move.hasType("Electric")) {
          atMods.push(gen.num >= 9 ? 5325 : 6144);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Stakeout") && attacker.abilityOn) {
          atMods.push(8192);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Water Bubble") && move.hasType("Water") || attacker.hasAbility("Huge Power", "Pure Power") && move.category === "Physical") {
          atMods.push(8192);
          desc.attackerAbility = attacker.ability;
        }
        if (field.attackerSide.isFlowerGift && !attacker.hasAbility("Flower Gift") && field.hasWeather("Sun", "Harsh Sunshine") && move.category === "Physical") {
          atMods.push(6144);
          desc.weather = field.weather;
          desc.isFlowerGiftAttacker = true;
        }
        if (field.attackerSide.isSteelySpirit && move.hasType("Steel")) {
          atMods.push(6144);
          desc.isSteelySpiritAttacker = true;
        }
        if (defender.hasAbility("Thick Fat") && move.hasType("Fire", "Ice") || defender.hasAbility("Water Bubble") && move.hasType("Fire") || defender.hasAbility("Purifying Salt") && move.hasType("Ghost")) {
          atMods.push(2048);
          desc.defenderAbility = defender.ability;
        }
        if (gen.num >= 9 && defender.hasAbility("Heatproof") && move.hasType("Fire")) {
          atMods.push(2048);
          desc.defenderAbility = defender.ability;
        }
        var isTabletsOfRuinActive = (defender.hasAbility("Tablets of Ruin") || field.isTabletsOfRuin) && !attacker.hasAbility("Tablets of Ruin");
        var isVesselOfRuinActive = (defender.hasAbility("Vessel of Ruin") || field.isVesselOfRuin) && !attacker.hasAbility("Vessel of Ruin");
        if (isTabletsOfRuinActive && move.category === "Physical" || isVesselOfRuinActive && move.category === "Special") {
          if (defender.hasAbility("Tablets of Ruin") || defender.hasAbility("Vessel of Ruin")) {
            desc.defenderAbility = defender.ability;
          } else {
            desc[move.category === "Special" ? "isVesselOfRuin" : "isTabletsOfRuin"] = true;
          }
          atMods.push(3072);
        }
        if ((0, util_2.isQPActive)(attacker, field)) {
          if (move.category === "Physical" && (0, util_2.getQPBoostedStat)(attacker) === "atk" || move.category === "Special" && (0, util_2.getQPBoostedStat)(attacker) === "spa") {
            atMods.push(5325);
            desc.attackerAbility = attacker.ability;
          }
        }
        if (attacker.hasAbility("Hadron Engine") && move.category === "Special" && field.hasTerrain("Electric") || attacker.hasAbility("Orichalcum Pulse") && move.category === "Physical" && field.hasWeather("Sun", "Harsh Sunshine") && !attacker.hasItem("Utility Umbrella")) {
          atMods.push(5461);
          desc.attackerAbility = attacker.ability;
        }
        if (attacker.hasItem("Thick Club") && attacker.named("Cubone", "Marowak", "Marowak-Alola", "Marowak-Alola-Totem") && move.category === "Physical" || attacker.hasItem("Deep Sea Tooth") && attacker.named("Clamperl") && move.category === "Special" || attacker.hasItem("Light Ball") && attacker.name.includes("Pikachu") && !move.isZ) {
          atMods.push(8192);
          desc.attackerItem = attacker.item;
        } else if (!move.isZ && !move.isMax && (attacker.hasItem("Choice Band") && move.category === "Physical" || attacker.hasItem("Choice Specs") && move.category === "Special")) {
          atMods.push(6144);
          desc.attackerItem = attacker.item;
        }
        return atMods;
      }
      exports.calculateAtModsSMSSSV = calculateAtModsSMSSSV;
      function calculateDefenseSMSSSV(gen, attacker, defender, move, field, desc, isCritical) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        var defense;
        var hitsPhysical = move.overrideDefensiveStat === "def" || move.category === "Physical";
        var defenseStat = hitsPhysical ? "def" : "spd";
        desc.defenseEVs = (0, util_2.getStatDescriptionText)(gen, defender, defenseStat, field.defenderSide.isPowerTrick, field.isWonderRoom);
        if (field.defenderSide.isPowerTrick && field.isWonderRoom !== hitsPhysical) {
          desc.isPowerTrickDefender = true;
        }
        var boosts = defender.boosts[defenseStat];
        if (boosts === 0 || isCritical && boosts > 0 || move.ignoreDefensive) {
          defense = defender.rawStats[defenseStat];
        } else if (attacker.hasAbility("Unaware") || move.name === "Nihil Light") {
          defense = defender.rawStats[defenseStat];
          desc.attackerAbility = attacker.ability;
        } else {
          defense = (0, util_2.getModifiedStat)(defender.rawStats[defenseStat], boosts);
          desc.defenseBoost = boosts;
        }
        if (field.hasWeather("Sand") && defender.hasType("Rock") && !hitsPhysical) {
          defense = (0, util_2.pokeRound)(defense * 3 / 2);
          desc.weather = field.weather;
        }
        if (field.hasWeather("Snow") && defender.hasType("Ice") && hitsPhysical) {
          defense = (0, util_2.pokeRound)(defense * 3 / 2);
          desc.weather = field.weather;
        }
        var dfMods = calculateDfModsSMSSSV(gen, attacker, defender, move, field, desc, isCritical, hitsPhysical);
        return (0, util_2.OF16)(Math.max(1, (0, util_2.pokeRound)(defense * (0, util_2.chainMods)(dfMods, 410, 131072) / 4096)));
      }
      exports.calculateDefenseSMSSSV = calculateDefenseSMSSSV;
      function calculateDfModsSMSSSV(gen, attacker, defender, move, field, desc, isCritical, hitsPhysical) {
        var _a;
        if (isCritical === void 0) {
          isCritical = false;
        }
        if (hitsPhysical === void 0) {
          hitsPhysical = false;
        }
        var dfMods = [];
        if (defender.hasAbility("Marvel Scale") && defender.status && hitsPhysical) {
          dfMods.push(6144);
          desc.defenderAbility = defender.ability;
        } else if (defender.named("Cherrim") && defender.hasAbility("Flower Gift") && field.hasWeather("Sun", "Harsh Sunshine") && !hitsPhysical) {
          dfMods.push(6144);
          desc.defenderAbility = defender.ability;
          desc.weather = field.weather;
        } else if (field.defenderSide.isFlowerGift && field.hasWeather("Sun", "Harsh Sunshine") && !hitsPhysical) {
          dfMods.push(6144);
          desc.weather = field.weather;
          desc.isFlowerGiftDefender = true;
        } else if (defender.hasAbility("Grass Pelt") && field.hasTerrain("Grassy") && hitsPhysical) {
          dfMods.push(6144);
          desc.defenderAbility = defender.ability;
        } else if (defender.hasAbility("Fur Coat") && hitsPhysical) {
          dfMods.push(8192);
          desc.defenderAbility = defender.ability;
        }
        var isSwordOfRuinActive = (attacker.hasAbility("Sword of Ruin") || field.isSwordOfRuin) && !defender.hasAbility("Sword of Ruin");
        var isBeadsOfRuinActive = (attacker.hasAbility("Beads of Ruin") || field.isBeadsOfRuin) && !defender.hasAbility("Beads of Ruin");
        if (isSwordOfRuinActive && hitsPhysical || isBeadsOfRuinActive && !hitsPhysical) {
          if (attacker.hasAbility("Sword of Ruin") || attacker.hasAbility("Beads of Ruin")) {
            desc.attackerAbility = attacker.ability;
          } else {
            desc[hitsPhysical ? "isSwordOfRuin" : "isBeadsOfRuin"] = true;
          }
          dfMods.push(3072);
        }
        if ((0, util_2.isQPActive)(defender, field)) {
          if (hitsPhysical && (0, util_2.getQPBoostedStat)(defender) === "def" || !hitsPhysical && (0, util_2.getQPBoostedStat)(defender) === "spd") {
            desc.defenderAbility = defender.ability;
            dfMods.push(5324);
          }
        }
        if (defender.hasItem("Eviolite") && (defender.name === "Dipplin" || ((_a = gen.species.get((0, util_1.toID)(defender.name))) === null || _a === void 0 ? void 0 : _a.nfe)) || !hitsPhysical && defender.hasItem("Assault Vest")) {
          dfMods.push(6144);
          desc.defenderItem = defender.item;
        } else if (defender.hasItem("Metal Powder") && defender.named("Ditto") && hitsPhysical || defender.hasItem("Deep Sea Scale") && defender.named("Clamperl") && !hitsPhysical) {
          dfMods.push(8192);
          desc.defenderItem = defender.item;
        }
        return dfMods;
      }
      exports.calculateDfModsSMSSSV = calculateDfModsSMSSSV;
      function calculateBaseDamageSMSSSV(gen, attacker, defender, basePower, attack, defense, move, field, desc, isCritical) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        var baseDamage = (0, util_2.getBaseDamage)(attacker.level, basePower, attack, defense);
        var isSpread = field.gameType !== "Singles" && ["allAdjacent", "allAdjacentFoes"].includes(move.target);
        if (isSpread) {
          baseDamage = (0, util_2.pokeRound)((0, util_2.OF32)(baseDamage * 3072) / 4096);
        }
        if (attacker.hasAbility("Parental Bond (Child)")) {
          baseDamage = (0, util_2.pokeRound)((0, util_2.OF32)(baseDamage * 1024) / 4096);
        }
        if (field.hasWeather("Sun") && move.named("Hydro Steam") && !attacker.hasItem("Utility Umbrella")) {
          baseDamage = (0, util_2.pokeRound)((0, util_2.OF32)(baseDamage * 6144) / 4096);
          desc.weather = field.weather;
        } else if (!defender.hasItem("Utility Umbrella")) {
          if (field.hasWeather("Sun", "Harsh Sunshine") && move.hasType("Fire") || field.hasWeather("Rain", "Heavy Rain") && move.hasType("Water")) {
            baseDamage = (0, util_2.pokeRound)((0, util_2.OF32)(baseDamage * 6144) / 4096);
            desc.weather = field.weather;
          } else if (field.hasWeather("Sun") && move.hasType("Water") || field.hasWeather("Rain") && move.hasType("Fire")) {
            baseDamage = (0, util_2.pokeRound)((0, util_2.OF32)(baseDamage * 2048) / 4096);
            desc.weather = field.weather;
          }
        }
        if (isCritical) {
          baseDamage = Math.floor((0, util_2.OF32)(baseDamage * 1.5));
          desc.isCritical = isCritical;
        }
        return baseDamage;
      }
      function calculateFinalModsSMSSSV(gen, attacker, defender, move, field, desc, isCritical, typeEffectiveness, hitCount) {
        if (isCritical === void 0) {
          isCritical = false;
        }
        if (hitCount === void 0) {
          hitCount = 0;
        }
        var finalMods = [];
        if (field.defenderSide.isReflect && move.category === "Physical" && !isCritical && !field.defenderSide.isAuroraVeil) {
          finalMods.push(field.gameType !== "Singles" ? 2732 : 2048);
          desc.isReflect = true;
        } else if (field.defenderSide.isLightScreen && move.category === "Special" && !isCritical && !field.defenderSide.isAuroraVeil) {
          finalMods.push(field.gameType !== "Singles" ? 2732 : 2048);
          desc.isLightScreen = true;
        }
        if (field.defenderSide.isAuroraVeil && !isCritical) {
          finalMods.push(field.gameType !== "Singles" ? 2732 : 2048);
          desc.isAuroraVeil = true;
        }
        if (attacker.hasAbility("Neuroforce") && typeEffectiveness > 1) {
          finalMods.push(5120);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Sniper") && isCritical) {
          finalMods.push(6144);
          desc.attackerAbility = attacker.ability;
        } else if (attacker.hasAbility("Tinted Lens") && typeEffectiveness < 1) {
          finalMods.push(8192);
          desc.attackerAbility = attacker.ability;
        }
        if (defender.isDynamaxed && move.named("Dynamax Cannon", "Behemoth Blade", "Behemoth Bash")) {
          finalMods.push(8192);
        }
        if (defender.hasAbility("Multiscale", "Shadow Shield") && defender.curHP() === defender.maxHP() && hitCount === 0 && (!field.defenderSide.isSR && (!field.defenderSide.spikes || defender.hasType("Flying")) || defender.hasItem("Heavy-Duty Boots")) && !attacker.hasAbility("Parental Bond (Child)")) {
          finalMods.push(2048);
          desc.defenderAbility = defender.ability;
        }
        if (defender.hasAbility("Fluffy") && move.flags.contact && !attacker.hasAbility("Long Reach")) {
          finalMods.push(2048);
          desc.defenderAbility = defender.ability;
        } else if (defender.hasAbility("Punk Rock") && move.flags.sound || defender.hasAbility("Ice Scales") && move.category === "Special") {
          finalMods.push(2048);
          desc.defenderAbility = defender.ability;
        }
        if (defender.hasAbility("Solid Rock", "Filter", "Prism Armor") && typeEffectiveness > 1) {
          finalMods.push(3072);
          desc.defenderAbility = defender.ability;
        }
        if (field.defenderSide.isFriendGuard) {
          finalMods.push(3072);
          desc.isFriendGuard = true;
        }
        if (defender.hasAbility("Fluffy") && move.hasType("Fire")) {
          finalMods.push(8192);
          desc.defenderAbility = defender.ability;
        }
        if (attacker.hasItem("Expert Belt") && typeEffectiveness > 1 && !move.isZ) {
          finalMods.push(4915);
          desc.attackerItem = attacker.item;
        } else if (attacker.hasItem("Life Orb")) {
          finalMods.push(5324);
          desc.attackerItem = attacker.item;
        } else if (attacker.hasItem("Metronome") && move.timesUsedWithMetronome >= 1) {
          var timesUsedWithMetronome = Math.floor(move.timesUsedWithMetronome);
          if (timesUsedWithMetronome <= 4) {
            finalMods.push(4096 + timesUsedWithMetronome * 819);
          } else {
            finalMods.push(8192);
          }
          desc.attackerItem = attacker.item;
        }
        if (move.hasType((0, items_1.getBerryResistType)(defender.item)) && (typeEffectiveness > 1 || move.hasType("Normal")) && hitCount === 0 && !attacker.hasAbility("Unnerve", "As One (Glastrier)", "As One (Spectrier)")) {
          if (defender.hasAbility("Ripen")) {
            finalMods.push(1024);
          } else {
            finalMods.push(2048);
          }
          desc.defenderItem = defender.item;
        }
        return finalMods;
      }
      exports.calculateFinalModsSMSSSV = calculateFinalModsSMSSSV;
      function hasTerrainSeed(pokemon) {
        return pokemon.hasItem("Electric Seed", "Misty Seed", "Grassy Seed", "Psychic Seed");
      }
    }
  });

  // node_modules/@smogon/calc/dist/calc.js
  var require_calc = __commonJS({
    "node_modules/@smogon/calc/dist/calc.js"(exports) {
      "use strict";
      exports.__esModule = true;
      exports.calculate = void 0;
      var field_1 = require_field();
      var gen12_1 = require_gen12();
      var gen3_1 = require_gen3();
      var gen4_1 = require_gen4();
      var gen56_1 = require_gen56();
      var gen789_1 = require_gen789();
      var MECHANICS = [
        function() {
        },
        gen12_1.calculateRBYGSC,
        gen12_1.calculateRBYGSC,
        gen3_1.calculateADV,
        gen4_1.calculateDPP,
        gen56_1.calculateBWXY,
        gen56_1.calculateBWXY,
        gen789_1.calculateSMSSSV,
        gen789_1.calculateSMSSSV,
        gen789_1.calculateSMSSSV
      ];
      function calculate2(gen, attacker, defender, move, field) {
        return MECHANICS[gen.num](gen, attacker.clone(), defender.clone(), move.clone(), field ? field.clone() : new field_1.Field());
      }
      exports.calculate = calculate2;
    }
  });

  // node_modules/@smogon/calc/dist/pokemon.js
  var require_pokemon = __commonJS({
    "node_modules/@smogon/calc/dist/pokemon.js"(exports) {
      "use strict";
      var __assign = exports && exports.__assign || function() {
        __assign = Object.assign || function(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
              t[p] = s[p];
          }
          return t;
        };
        return __assign.apply(this, arguments);
      };
      var __values = exports && exports.__values || function(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
          next: function() {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
          }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
      };
      exports.__esModule = true;
      exports.Pokemon = void 0;
      var stats_1 = require_stats();
      var util_1 = require_util();
      var STATS = ["hp", "atk", "def", "spa", "spd", "spe"];
      var SPC = /* @__PURE__ */ new Set(["spc"]);
      var Pokemon2 = (function() {
        function Pokemon3(gen, name, options) {
          var e_1, _a;
          if (options === void 0) {
            options = {};
          }
          var _b;
          this.species = (0, util_1.extend)(true, {}, gen.species.get((0, util_1.toID)(name)), options.overrides);
          this.gen = gen;
          this.name = options.name || name;
          this.types = this.species.types;
          this.weightkg = this.species.weightkg;
          this.level = options.level || 100;
          this.gender = options.gender || this.species.gender || "M";
          this.ability = options.ability || ((_b = this.species.abilities) === null || _b === void 0 ? void 0 : _b[0]) || void 0;
          this.abilityOn = !!options.abilityOn;
          this.isDynamaxed = !!options.isDynamaxed;
          this.dynamaxLevel = this.isDynamaxed ? options.dynamaxLevel === void 0 ? 10 : options.dynamaxLevel : void 0;
          this.alliesFainted = options.alliesFainted;
          this.boostedStat = options.boostedStat;
          this.teraType = options.teraType;
          this.item = options.item;
          this.nature = options.nature || "Serious";
          this.ivs = Pokemon3.withDefault(gen, options.ivs, 31);
          this.evs = Pokemon3.withDefault(gen, options.evs, gen.num >= 3 ? 0 : 252);
          this.boosts = Pokemon3.withDefault(gen, options.boosts, 0, false);
          if (this.weightkg === 0 && !this.isDynamaxed && this.species.baseSpecies) {
            this.weightkg = gen.species.get((0, util_1.toID)(this.species.baseSpecies)).weightkg;
          }
          if (gen.num < 3) {
            this.ivs.hp = stats_1.Stats.DVToIV(stats_1.Stats.getHPDV({
              atk: this.ivs.atk,
              def: this.ivs.def,
              spe: this.ivs.spe,
              spc: this.ivs.spa
            }));
          }
          this.rawStats = {};
          this.stats = {};
          try {
            for (var STATS_1 = __values(STATS), STATS_1_1 = STATS_1.next(); !STATS_1_1.done; STATS_1_1 = STATS_1.next()) {
              var stat = STATS_1_1.value;
              var val = this.calcStat(gen, stat);
              this.rawStats[stat] = val;
              this.stats[stat] = val;
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (STATS_1_1 && !STATS_1_1.done && (_a = STATS_1["return"])) _a.call(STATS_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
          var curHP = options.curHP || options.originalCurHP;
          this.originalCurHP = curHP && curHP <= this.rawStats.hp ? curHP : this.rawStats.hp;
          this.status = options.status || "";
          this.toxicCounter = options.toxicCounter || 0;
          this.moves = options.moves || [];
        }
        Pokemon3.prototype.maxHP = function(original) {
          if (original === void 0) {
            original = false;
          }
          if (!original && this.isDynamaxed && this.species.baseStats.hp !== 1) {
            return Math.floor(this.rawStats.hp * (150 + 5 * this.dynamaxLevel) / 100);
          }
          return this.rawStats.hp;
        };
        Pokemon3.prototype.curHP = function(original) {
          if (original === void 0) {
            original = false;
          }
          if (!original && this.isDynamaxed && this.species.baseStats.hp !== 1) {
            return Math.ceil(this.originalCurHP * (150 + 5 * this.dynamaxLevel) / 100);
          }
          return this.originalCurHP;
        };
        Pokemon3.prototype.hasAbility = function() {
          var abilities = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            abilities[_i] = arguments[_i];
          }
          return !!(this.ability && abilities.includes(this.ability));
        };
        Pokemon3.prototype.hasItem = function() {
          var items = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
          }
          return !!(this.item && items.includes(this.item));
        };
        Pokemon3.prototype.hasStatus = function() {
          var statuses = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            statuses[_i] = arguments[_i];
          }
          return !!(this.status && statuses.includes(this.status));
        };
        Pokemon3.prototype.hasType = function() {
          var e_2, _a;
          var types = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            types[_i] = arguments[_i];
          }
          try {
            for (var types_1 = __values(types), types_1_1 = types_1.next(); !types_1_1.done; types_1_1 = types_1.next()) {
              var type = types_1_1.value;
              if (this.teraType && this.teraType !== "Stellar" ? this.teraType === type : this.types.includes(type)) {
                return true;
              }
            }
          } catch (e_2_1) {
            e_2 = { error: e_2_1 };
          } finally {
            try {
              if (types_1_1 && !types_1_1.done && (_a = types_1["return"])) _a.call(types_1);
            } finally {
              if (e_2) throw e_2.error;
            }
          }
          return false;
        };
        Pokemon3.prototype.hasOriginalType = function() {
          var e_3, _a;
          var types = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            types[_i] = arguments[_i];
          }
          try {
            for (var types_2 = __values(types), types_2_1 = types_2.next(); !types_2_1.done; types_2_1 = types_2.next()) {
              var type = types_2_1.value;
              if (this.types.includes(type))
                return true;
            }
          } catch (e_3_1) {
            e_3 = { error: e_3_1 };
          } finally {
            try {
              if (types_2_1 && !types_2_1.done && (_a = types_2["return"])) _a.call(types_2);
            } finally {
              if (e_3) throw e_3.error;
            }
          }
          return false;
        };
        Pokemon3.prototype.named = function() {
          var names = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            names[_i] = arguments[_i];
          }
          return names.includes(this.name);
        };
        Pokemon3.prototype.clone = function() {
          return new Pokemon3(this.gen, this.name, {
            level: this.level,
            ability: this.ability,
            abilityOn: this.abilityOn,
            isDynamaxed: this.isDynamaxed,
            dynamaxLevel: this.dynamaxLevel,
            alliesFainted: this.alliesFainted,
            boostedStat: this.boostedStat,
            item: this.item,
            gender: this.gender,
            nature: this.nature,
            ivs: (0, util_1.extend)(true, {}, this.ivs),
            evs: (0, util_1.extend)(true, {}, this.evs),
            boosts: (0, util_1.extend)(true, {}, this.boosts),
            originalCurHP: this.originalCurHP,
            status: this.status,
            teraType: this.teraType,
            toxicCounter: this.toxicCounter,
            moves: this.moves.slice(),
            overrides: this.species
          });
        };
        Pokemon3.prototype.calcStat = function(gen, stat) {
          return stats_1.Stats.calcStat(gen, stat, this.species.baseStats[stat], this.ivs[stat], this.evs[stat], this.level, this.nature);
        };
        Pokemon3.getForme = function(gen, speciesName, item, moveName) {
          var species = gen.species.get((0, util_1.toID)(speciesName));
          if (!(species === null || species === void 0 ? void 0 : species.otherFormes)) {
            return speciesName;
          }
          var i = 0;
          if (item && (item.includes("ite") && !item.includes("ite Y") || speciesName === "Groudon" && item === "Red Orb" || speciesName === "Kyogre" && item === "Blue Orb") || moveName && speciesName === "Meloetta" && moveName === "Relic Song" || speciesName === "Rayquaza" && moveName === "Dragon Ascent") {
            i = 1;
          } else if (item === null || item === void 0 ? void 0 : item.includes("ite Y")) {
            i = 2;
          }
          return i ? species.otherFormes[i - 1] : species.name;
        };
        Pokemon3.withDefault = function(gen, current, val, match) {
          if (match === void 0) {
            match = true;
          }
          var cur = {};
          if (current) {
            (0, util_1.assignWithout)(cur, current, SPC);
            if (current.spc) {
              cur.spa = current.spc;
              cur.spd = current.spc;
            }
            if (match && gen.num <= 2 && current.spa !== current.spd) {
              throw new Error("Special Attack and Special Defense must match before Gen 3");
            }
          }
          return __assign({ hp: val, atk: val, def: val, spa: val, spd: val, spe: val }, cur);
        };
        return Pokemon3;
      })();
      exports.Pokemon = Pokemon2;
    }
  });

  // node_modules/@smogon/calc/dist/move.js
  var require_move = __commonJS({
    "node_modules/@smogon/calc/dist/move.js"(exports) {
      "use strict";
      exports.__esModule = true;
      exports.getMaxMoveName = exports.getZMoveName = exports.Move = void 0;
      var util_1 = require_util();
      var SPECIAL = ["Fire", "Water", "Grass", "Electric", "Ice", "Psychic", "Dark", "Dragon"];
      var Move2 = (function() {
        function Move3(gen, name, options) {
          if (options === void 0) {
            options = {};
          }
          var _a, _b;
          name = options.name || name;
          this.originalName = name;
          var data = (0, util_1.extend)(true, { name }, gen.moves.get((0, util_1.toID)(name)), options.overrides);
          this.hits = 1;
          if (options.useMax && data.maxMove) {
            var maxMoveName_1 = getMaxMoveName(data.type, data.name, options.species, !!(data.category === "Status"), options.ability);
            var maxMove_1 = gen.moves.get((0, util_1.toID)(maxMoveName_1));
            var maxPower = function() {
              if (["G-Max Drum Solo", "G-Max Fire Ball", "G-Max Hydrosnipe"].includes(maxMoveName_1)) {
                return 160;
              }
              if (maxMove_1.basePower === 10 || maxMoveName_1 === "Max Flare") {
                return data.maxMove.basePower;
              }
              return maxMove_1.basePower;
            };
            data = (0, util_1.extend)(true, {}, maxMove_1, {
              name: maxMoveName_1,
              basePower: maxPower(),
              category: data.category
            });
          }
          if (options.useZ && ((_a = data.zMove) === null || _a === void 0 ? void 0 : _a.basePower)) {
            var zMoveName = getZMoveName(data.name, data.type, options.item);
            var zMove = gen.moves.get((0, util_1.toID)(zMoveName));
            data = (0, util_1.extend)(true, {}, zMove, {
              name: zMoveName,
              basePower: zMove.basePower === 1 ? data.zMove.basePower : zMove.basePower,
              category: data.category
            });
          } else {
            if (data.multihit) {
              if (data.multiaccuracy && typeof data.multihit === "number") {
                this.hits = options.hits || data.multihit;
              } else {
                if (typeof data.multihit === "number") {
                  this.hits = data.multihit;
                } else if (options.hits) {
                  this.hits = options.hits;
                } else {
                  this.hits = options.ability === "Skill Link" ? data.multihit[1] : data.multihit[0] + 1;
                }
              }
            }
            this.timesUsedWithMetronome = options.timesUsedWithMetronome;
          }
          this.gen = gen;
          this.name = data.name;
          this.ability = options.ability;
          this.item = options.item;
          this.useZ = options.useZ;
          this.useMax = options.useMax;
          this.overrides = options.overrides;
          this.species = options.species;
          this.bp = data.basePower;
          var typelessDamage = gen.num >= 2 && data.id === "struggle" || gen.num <= 4 && ["futuresight", "doomdesire"].includes(data.id);
          this.type = typelessDamage ? "???" : data.type;
          this.category = data.category || (gen.num < 4 ? SPECIAL.includes(data.type) ? "Special" : "Physical" : "Status");
          var stat = this.category === "Special" ? "spa" : "atk";
          if (((_b = data.self) === null || _b === void 0 ? void 0 : _b.boosts) && data.self.boosts[stat] && data.self.boosts[stat] < 0) {
            this.dropsStats = Math.abs(data.self.boosts[stat]);
          }
          this.timesUsed = options.timesUsed || 1;
          this.secondaries = data.secondaries;
          this.target = data.target || "any";
          this.recoil = data.recoil;
          this.hasCrashDamage = !!data.hasCrashDamage;
          this.mindBlownRecoil = !!data.mindBlownRecoil;
          this.struggleRecoil = !!data.struggleRecoil;
          this.isCrit = !!options.isCrit || !!data.willCrit || gen.num === 1 && ["crabhammer", "razorleaf", "slash", "karate chop"].includes(data.id);
          this.isStellarFirstUse = !!options.isStellarFirstUse;
          this.drain = data.drain;
          this.flags = data.flags;
          this.priority = data.priority || 0;
          this.ignoreDefensive = !!data.ignoreDefensive;
          this.overrideOffensiveStat = data.overrideOffensiveStat;
          this.overrideDefensiveStat = data.overrideDefensiveStat;
          this.overrideOffensivePokemon = data.overrideOffensivePokemon;
          this.overrideDefensivePokemon = data.overrideDefensivePokemon;
          this.breaksProtect = !!data.breaksProtect;
          this.isZ = !!data.isZ;
          this.isMax = !!data.isMax;
          this.multiaccuracy = !!data.multiaccuracy;
          if (!this.bp) {
            if (["return", "frustration", "pikapapow", "veeveevolley"].includes(data.id)) {
              this.bp = 102;
            }
          }
        }
        Move3.prototype.named = function() {
          var names = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            names[_i] = arguments[_i];
          }
          return names.includes(this.name);
        };
        Move3.prototype.hasType = function() {
          var types = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            types[_i] = arguments[_i];
          }
          return types.includes(this.type);
        };
        Move3.prototype.clone = function() {
          return new Move3(this.gen, this.originalName, {
            ability: this.ability,
            item: this.item,
            species: this.species,
            useZ: this.useZ,
            useMax: this.useMax,
            isCrit: this.isCrit,
            isStellarFirstUse: this.isStellarFirstUse,
            hits: this.hits,
            timesUsed: this.timesUsed,
            timesUsedWithMetronome: this.timesUsedWithMetronome,
            overrides: this.overrides
          });
        };
        return Move3;
      })();
      exports.Move = Move2;
      function getZMoveName(moveName, moveType, item) {
        item = item || "";
        if (moveName.includes("Hidden Power"))
          return "Breakneck Blitz";
        if (moveName === "Clanging Scales" && item === "Kommonium Z")
          return "Clangorous Soulblaze";
        if (moveName === "Darkest Lariat" && item === "Incinium Z")
          return "Malicious Moonsault";
        if (moveName === "Giga Impact" && item === "Snorlium Z")
          return "Pulverizing Pancake";
        if (moveName === "Moongeist Beam" && item === "Lunalium Z")
          return "Menacing Moonraze Maelstrom";
        if (moveName === "Photon Geyser" && item === "Ultranecrozium Z") {
          return "Light That Burns the Sky";
        }
        if (moveName === "Play Rough" && item === "Mimikium Z")
          return "Let's Snuggle Forever";
        if (moveName === "Psychic" && item === "Mewnium Z")
          return "Genesis Supernova";
        if (moveName === "Sparkling Aria" && item === "Primarium Z")
          return "Oceanic Operetta";
        if (moveName === "Spectral Thief" && item === "Marshadium Z") {
          return "Soul-Stealing 7-Star Strike";
        }
        if (moveName === "Spirit Shackle" && item === "Decidium Z")
          return "Sinister Arrow Raid";
        if (moveName === "Stone Edge" && item === "Lycanium Z")
          return "Splintered Stormshards";
        if (moveName === "Sunsteel Strike" && item === "Solganium Z")
          return "Searing Sunraze Smash";
        if (moveName === "Volt Tackle" && item === "Pikanium Z")
          return "Catastropika";
        if (moveName === "Nature's Madness" && item === "Tapunium Z")
          return "Guardian of Alola";
        if (moveName === "Thunderbolt") {
          if (item === "Aloraichium Z")
            return "Stoked Sparksurfer";
          if (item === "Pikashunium Z")
            return "10,000,000 Volt Thunderbolt";
        }
        return ZMOVES_TYPING[moveType];
      }
      exports.getZMoveName = getZMoveName;
      var ZMOVES_TYPING = {
        Bug: "Savage Spin-Out",
        Dark: "Black Hole Eclipse",
        Dragon: "Devastating Drake",
        Electric: "Gigavolt Havoc",
        Fairy: "Twinkle Tackle",
        Fighting: "All-Out Pummeling",
        Fire: "Inferno Overdrive",
        Flying: "Supersonic Skystrike",
        Ghost: "Never-Ending Nightmare",
        Grass: "Bloom Doom",
        Ground: "Tectonic Rage",
        Ice: "Subzero Slammer",
        Normal: "Breakneck Blitz",
        Poison: "Acid Downpour",
        Psychic: "Shattered Psyche",
        Rock: "Continental Crush",
        Steel: "Corkscrew Crash",
        Water: "Hydro Vortex"
      };
      function getMaxMoveName(moveType, moveName, pokemonSpecies, isStatus, pokemonAbility) {
        if (isStatus)
          return "Max Guard";
        if (pokemonAbility === "Normalize")
          return "Max Strike";
        if (moveType === "Fire") {
          if (pokemonSpecies === "Charizard-Gmax")
            return "G-Max Wildfire";
          if (pokemonSpecies === "Centiskorch-Gmax")
            return "G-Max Centiferno";
          if (pokemonSpecies === "Cinderace-Gmax")
            return "G-Max Fire Ball";
        }
        if (moveType === "Normal") {
          if (pokemonSpecies === "Eevee-Gmax")
            return "G-Max Cuddle";
          if (pokemonSpecies === "Meowth-Gmax")
            return "G-Max Gold Rush";
          if (pokemonSpecies === "Snorlax-Gmax")
            return "G-Max Replenish";
          if (!(moveName === "Weather Ball" || moveName === "Terrain Pulse")) {
            if (pokemonAbility === "Pixilate")
              return "Max Starfall";
            if (pokemonAbility === "Aerilate")
              return "Max Airstream";
            if (pokemonAbility === "Refrigerate")
              return "Max Hailstorm";
            if (pokemonAbility === "Galvanize")
              return "Max Lightning";
          }
        }
        if (moveType === "Fairy") {
          if (pokemonSpecies === "Alcremie-Gmax")
            return "G-Max Finale";
          if (pokemonSpecies === "Hatterene-Gmax")
            return "G-Max Smite";
        }
        if (moveType === "Steel") {
          if (pokemonSpecies === "Copperajah-Gmax")
            return "G-Max Steelsurge";
          if (pokemonSpecies === "Melmetal-Gmax")
            return "G-Max Meltdown";
        }
        if (moveType === "Electric") {
          if (pokemonSpecies === "Pikachu-Gmax")
            return "G-Max Volt Crash";
          if ((pokemonSpecies === null || pokemonSpecies === void 0 ? void 0 : pokemonSpecies.startsWith("Toxtricity")) && (pokemonSpecies === null || pokemonSpecies === void 0 ? void 0 : pokemonSpecies.endsWith("Gmax")))
            return "G-Max Stun Shock";
        }
        if (moveType === "Grass") {
          if (pokemonSpecies === "Appletun-Gmax")
            return "G-Max Sweetness";
          if (pokemonSpecies === "Flapple-Gmax")
            return "G-Max Tartness";
          if (pokemonSpecies === "Rillaboom-Gmax")
            return "G-Max Drum Solo";
          if (pokemonSpecies === "Venusaur-Gmax")
            return "G-Max Vine Lash";
        }
        if (moveType === "Water") {
          if (pokemonSpecies === "Blastoise-Gmax")
            return "G-Max Cannonade";
          if (pokemonSpecies === "Drednaw-Gmax")
            return "G-Max Stonesurge";
          if (pokemonSpecies === "Inteleon-Gmax")
            return "G-Max Hydrosnipe";
          if (pokemonSpecies === "Kingler-Gmax")
            return "G-Max Foam Burst";
          if (pokemonSpecies === "Urshifu-Rapid-Strike-Gmax")
            return "G-Max Rapid Flow";
        }
        if (moveType === "Dark") {
          if (pokemonSpecies === "Grimmsnarl-Gmax")
            return "G-Max Snooze";
          if (pokemonSpecies === "Urshifu-Gmax")
            return "G-Max One Blow";
        }
        if (moveType === "Poison" && pokemonSpecies === "Garbodor-Gmax")
          return "G-Max Malodor";
        if (moveType === "Fighting" && pokemonSpecies === "Machamp-Gmax")
          return "G-Max Chi Strike";
        if (moveType === "Ghost" && pokemonSpecies === "Gengar-Gmax")
          return "G-Max Terror";
        if (moveType === "Ice" && pokemonSpecies === "Lapras-Gmax")
          return "G-Max Resonance";
        if (moveType === "Flying" && pokemonSpecies === "Corviknight-Gmax")
          return "G-Max Wind Rage";
        if (moveType === "Dragon" && pokemonSpecies === "Duraludon-Gmax")
          return "G-Max Depletion";
        if (moveType === "Psychic" && pokemonSpecies === "Orbeetle-Gmax")
          return "G-Max Gravitas";
        if (moveType === "Rock" && pokemonSpecies === "Coalossal-Gmax")
          return "G-Max Volcalith";
        if (moveType === "Ground" && pokemonSpecies === "Sandaconda-Gmax")
          return "G-Max Sandblast";
        if (moveType === "Dark" && pokemonSpecies === "Grimmsnarl-Gmax")
          return "G-Max Snooze";
        return "Max " + MAXMOVES_TYPING[moveType];
      }
      exports.getMaxMoveName = getMaxMoveName;
      var MAXMOVES_TYPING = {
        Bug: "Flutterby",
        Dark: "Darkness",
        Dragon: "Wyrmwind",
        Electric: "Lightning",
        Fairy: "Starfall",
        Fighting: "Knuckle",
        Fire: "Flare",
        Flying: "Airstream",
        Ghost: "Phantasm",
        Grass: "Overgrowth",
        Ground: "Quake",
        Ice: "Hailstorm",
        Normal: "Strike",
        Poison: "Ooze",
        Psychic: "Mindstorm",
        Rock: "Rockfall",
        Steel: "Steelspike",
        Water: "Geyser"
      };
    }
  });

  // node_modules/@smogon/calc/dist/adaptable.js
  var require_adaptable = __commonJS({
    "node_modules/@smogon/calc/dist/adaptable.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      exports.__esModule = true;
      exports.Stats = exports.Result = exports.Side = exports.Field = exports.Move = exports.Pokemon = exports.calculate = void 0;
      var calc_1 = require_calc();
      __createBinding(exports, calc_1, "calculate");
      var pokemon_1 = require_pokemon();
      __createBinding(exports, pokemon_1, "Pokemon");
      var move_1 = require_move();
      __createBinding(exports, move_1, "Move");
      var field_1 = require_field();
      __createBinding(exports, field_1, "Field");
      __createBinding(exports, field_1, "Side");
      var result_1 = require_result();
      __createBinding(exports, result_1, "Result");
      var stats_1 = require_stats();
      __createBinding(exports, stats_1, "Stats");
    }
  });

  // node_modules/@smogon/calc/dist/index.js
  var require_dist = __commonJS({
    "node_modules/@smogon/calc/dist/index.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }) : function(o, v) {
        o["default"] = v;
      });
      var __importStar = exports && exports.__importStar || function(mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) {
          for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
        }
        __setModuleDefault(result, mod);
        return result;
      };
      exports.__esModule = true;
      exports.Stats = exports.STATS = exports.TYPE_CHART = exports.NATURES = exports.SPECIES = exports.MOVES = exports.MEGA_STONES = exports.ITEMS = exports.ABILITIES = exports.toID = exports.Generations = exports.Result = exports.Side = exports.Field = exports.calcStat = exports.Pokemon = exports.Move = exports.calculate = void 0;
      var data_1 = require_data();
      var A = __importStar(require_adaptable());
      var Acalculate = exports.calculate;
      function calculate2(gen, attacker, defender, move, field) {
        return (Acalculate || A.calculate)(typeof gen === "number" ? data_1.Generations.get(gen) : gen, attacker, defender, move, field);
      }
      exports.calculate = calculate2;
      var Move2 = (function(_super) {
        __extends(Move3, _super);
        function Move3(gen, name, options) {
          if (options === void 0) {
            options = {};
          }
          return _super.call(this, typeof gen === "number" ? data_1.Generations.get(gen) : gen, name, options) || this;
        }
        return Move3;
      })(A.Move);
      exports.Move = Move2;
      var Pokemon2 = (function(_super) {
        __extends(Pokemon3, _super);
        function Pokemon3(gen, name, options) {
          if (options === void 0) {
            options = {};
          }
          return _super.call(this, typeof gen === "number" ? data_1.Generations.get(gen) : gen, name, options) || this;
        }
        Pokemon3.getForme = function(gen, speciesName, item, moveName) {
          return A.Pokemon.getForme(typeof gen === "number" ? data_1.Generations.get(gen) : gen, speciesName, item, moveName);
        };
        return Pokemon3;
      })(A.Pokemon);
      exports.Pokemon = Pokemon2;
      function calcStat(gen, stat, base, iv, ev, level, nature) {
        return A.Stats.calcStat(typeof gen === "number" ? data_1.Generations.get(gen) : gen, stat === "spc" ? "spa" : stat, base, iv, ev, level, nature);
      }
      exports.calcStat = calcStat;
      var field_1 = require_field();
      __createBinding(exports, field_1, "Field");
      __createBinding(exports, field_1, "Side");
      var result_1 = require_result();
      __createBinding(exports, result_1, "Result");
      var index_1 = require_data();
      __createBinding(exports, index_1, "Generations");
      var util_1 = require_util();
      __createBinding(exports, util_1, "toID");
      var abilities_1 = require_abilities();
      __createBinding(exports, abilities_1, "ABILITIES");
      var items_1 = require_items();
      __createBinding(exports, items_1, "ITEMS");
      __createBinding(exports, items_1, "MEGA_STONES");
      var moves_1 = require_moves();
      __createBinding(exports, moves_1, "MOVES");
      var species_1 = require_species();
      __createBinding(exports, species_1, "SPECIES");
      var natures_1 = require_natures();
      __createBinding(exports, natures_1, "NATURES");
      var types_1 = require_types();
      __createBinding(exports, types_1, "TYPE_CHART");
      var stats_1 = require_stats();
      __createBinding(exports, stats_1, "STATS");
      __createBinding(exports, stats_1, "Stats");
    }
  });

  // scripts/smogon-calc-browser.js
  var smogon_calc_browser_exports = {};
  __export(smogon_calc_browser_exports, {
    Field: () => import_calc.Field,
    Generations: () => import_calc.Generations,
    Move: () => import_calc.Move,
    Pokemon: () => import_calc.Pokemon,
    calculate: () => import_calc.calculate
  });
  var import_calc = __toESM(require_dist());
  return __toCommonJS(smogon_calc_browser_exports);
})();
