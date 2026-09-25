"""Replay battles, coded small enough to carry a month of them on a phone.

A Showdown log is mostly predictable: after a move comes its damage, a
Pokemon switched in has the HP it left with, the next turn is the last one
plus one. This codec turns a battle into the decisions it actually took --
which command, which Pokemon, which move, how much HP -- and codes each as
bits whose odds come from what the battle has shown so far. A month of every
format is about 20 MB where the logs are nearly 2 GB.

The pieces:

canonical(log)
    The battle as the app's player needs it, and nothing else: the protocol
    lines that show the battle and open team sheets, nicknames replaced by
    species, levels and genders dropped from details, players as p1/p2. Chat,
    timers and the like go. Everything this keeps comes back exactly.

The model (Model)
    Every decision is a small binary tree. Each bit of it is predicted by
    several contexts at once (the lines before, the Pokemon, the move, this
    game so far), mixed by weights that learned which context to trust, and
    packed by a range coder. Integer arithmetic throughout, so the app's
    decoder (TypeScript) gets the same bits.

    Trained on the server from a format's recent games, then shipped: each
    context's cells, pruned to those seen often and quantized, in a table
    keyed by a 24-bit fingerprint of the context. The phone loads it and
    decodes one game at a time; only a game's own contexts learn while it is
    decoded, so every game decodes on its own.

The files
    A model file per format and month (model_file / read_model_file), and a
    day file per format and day (day_file / read_day_file): one coded battle
    per replay in the app's day file for that day, in its order.

Nothing outside the standard library, so the replay workflow can run it
without the site's dependencies.
"""

import gzip
import json
import re
import zlib

VERSION = 1

# ─── canonical battle lines ────────────────────────────────────────────────

BATTLE = {
    "switch", "drag", "replace", "detailschange", "-formechange", "move", "-damage", "-heal",
    "-sethp", "faint", "-status", "-curestatus", "-cureteam", "-boost", "-unboost", "-setboost",
    "-clearboost", "-clearallboost", "-clearnegativeboost", "-clearpositiveboost", "-copyboost",
    "-invertboost", "-swapboost", "-weather", "-fieldstart", "-fieldend", "-sidestart",
    "-sideend", "-swapsideconditions", "-ability", "-endability", "-item", "-enditem", "-mega",
    "-primal", "-burst", "-terastallize", "-transform", "-start", "-end", "-singleturn",
    "-singlemove", "-activate", "-crit", "-supereffective", "-resisted", "-immune", "-miss",
    "-fail", "-block", "-notarget", "-hitcount", "-prepare", "-mustrecharge", "-nothing",
    "-center", "-combine", "-waiting", "-zpower", "-zbroken", "cant", "turn", "win", "tie",
    "-message", "swap", "showteam",
}

_IDENT = re.compile(r"(p[1-4][a-d]?): ([^|,\]]*)")
_SWITCH = re.compile(r"^\|(switch|drag|replace)\|(p[1-4])[a-d]: ([^|]*)\|([^|,]*)")
_PLAYER = re.compile(r"^\|player\|(p[1-4])\|([^|]*)")
_SIDE_NAMED = re.compile(r"^(\[of\] )?(p[1-4]): (.+)$")
_DETAILS_FIELD = {"switch": 2, "drag": 2, "replace": 2, "detailschange": 2, "-formechange": 2}
_DROPPED_DETAIL = re.compile(r"L\d+|M|F")


def canonical(log):
    """The lines of a log that show its battle, nicknames as species, level
    and gender left out of details, players as p1 and p2 (the app's index
    has their names)."""
    species = {}
    players = {}
    out = []
    for line in log.split("\n"):
        line = line.rstrip("\r")
        m = _PLAYER.match(line)
        if m and m.group(2):
            players[m.group(2)] = m.group(1)
        if not line.startswith("|"):
            continue
        fields = line[1:].split("|")
        cmd = fields[0]
        if cmd not in BATTLE:
            continue
        if cmd == "showteam":
            out.append(_canonical_team(fields))
            continue
        m = _SWITCH.match(line)
        if m:
            species.setdefault((m.group(2), m.group(3)), m.group(4))
        if cmd == "-message":
            # Only a forfeit says anything the battle does not; who forfeited
            # is whoever did not win.
            if line.endswith(" forfeited."):
                out.append("|-message|forfeit")
            continue
        if cmd == "win":
            out.append("|win|" + players.get(fields[1] if len(fields) > 1 else "", "?"))
            continue
        # A side named by its player: "p1: peer+mol" -> "p1".
        fields = [_SIDE_NAMED.sub(lambda x: (x.group(1) or "") + x.group(2) if x.group(3) in players else x.group(0), f)
                  for f in fields]
        line = "|" + "|".join(fields)
        line = _IDENT.sub(lambda i: "%s: %s" % (i.group(1), species.get((i.group(1)[:2], i.group(2)), i.group(2))),
                          line)
        at = _DETAILS_FIELD.get(cmd)
        if at is not None:
            fields = line[1:].split("|")
            if len(fields) > at:
                fields[at] = ", ".join(p for p in fields[at].split(", ") if not _DROPPED_DETAIL.fullmatch(p))
            line = "|" + "|".join(fields)
        out.append(line)
    return "\n".join(out)


def _canonical_team(fields):
    """|showteam|p1|packed team: each Pokemon named by its species."""
    if len(fields) < 3:
        return "|" + "|".join(fields)
    entries = []
    for entry in "|".join(fields[2:]).split("]"):
        parts = entry.split("|")
        if len(parts) > 1 and parts[1]:
            parts[0], parts[1] = parts[1], ""
        entries.append("|".join(parts))
    return "|showteam|%s|%s" % (fields[1], "]".join(entries))


# ─── contexts ──────────────────────────────────────────────────────────────

SEP = "\x1f"
SUB = "\x1e"


def _part(x):
    if x is None:
        return "~"
    if x is True:
        return "1"
    if x is False:
        return "0"
    if isinstance(x, int):
        return str(x)
    if isinstance(x, (tuple, list)):
        return "(" + SUB.join(_part(y) for y in x) + ")"
    return x


def K(*parts):
    """A context's key: its parts in one string, as the app spells it too.
    Keys starting "L" are the game's own, forgotten when the next begins."""
    return SEP.join(_part(x) for x in parts)


def fingerprint(key, bits=24):
    return zlib.crc32(key.encode("utf8")) >> (32 - bits)


def FK(*parts):
    """A field's key: which line, which field, which part of it."""
    return "/".join(str(p) for p in parts)


# ─── range coder (LZMA's, with 12-bit odds passed in) ────────────────────

TOP = 1 << 24
MASK32 = 0xFFFFFFFF


class Encoder:
    def __init__(self):
        self.low = 0
        self.range = MASK32
        self.cache = 0
        self.cache_size = 1
        self.out = bytearray()

    def put(self, p0, bit):
        """Code a bit whose chance of being 0 is p0/4096."""
        bound = (self.range >> 12) * p0
        if bit:
            self.low += bound
            self.range -= bound
        else:
            self.range = bound
        while self.range < TOP:
            self.range = (self.range << 8) & MASK32
            self._shift_low()
        return bit

    def _shift_low(self):
        if self.low < 0xFF000000 or self.low > MASK32:
            carry = self.low >> 32
            temp = self.cache
            while True:
                self.out.append((temp + carry) & 0xFF)
                temp = 0xFF
                self.cache_size -= 1
                if not self.cache_size:
                    break
            self.cache = (self.low >> 24) & 0xFF
        self.cache_size += 1
        self.low = (self.low & 0x00FFFFFF) << 8

    def finish(self):
        """The shortest ending: any value in [low, low + range) decodes the
        same, and one rounded up to a whole top byte needs only that byte (the
        decoder reads zeros past the end). The first byte is always 0 and is
        left out too, and so are trailing zeros."""
        self.low = (self.low + 0xFFFFFF) & ~0xFFFFFF
        self._shift_low()
        self._shift_low()
        return bytes(self.out[1:]).rstrip(b"\0")


class Decoder:
    def __init__(self, data):
        self.data = data
        self.pos = 0
        self.range = MASK32
        self.code = 0
        for _ in range(4):
            self.code = ((self.code << 8) | self._byte()) & MASK32

    def _byte(self):
        b = self.data[self.pos] if self.pos < len(self.data) else 0
        self.pos += 1
        return b

    def put(self, p0, _bit=None):
        bound = (self.range >> 12) * p0
        if self.code < bound:
            self.range = bound
            bit = 0
        else:
            self.code -= bound
            self.range -= bound
            bit = 1
        while self.range < TOP:
            self.range = (self.range << 8) & MASK32
            self.code = ((self.code << 8) | self._byte()) & MASK32
        return bit


# ─── mixing ────────────────────────────────────────────────────────────────

_SQ = [1, 2, 3, 6, 10, 16, 27, 45, 73, 120, 194, 310, 488, 747, 1101, 1546, 2047, 2549, 2994, 3348,
       3607, 3785, 3901, 3975, 4022, 4050, 4068, 4079, 4085, 4089, 4092, 4093, 4094]


def squash(d):
    """1/(1+e^-x): d is x in 256ths, the result a probability in 4096ths."""
    if d > 2047:
        d = 2047
    elif d < -2047:
        d = -2047
    w = d & 127
    i = (d >> 7) + 16
    return (_SQ[i] * (128 - w) + _SQ[i + 1] * w + 64) >> 7


STRETCH = [0] * 4096
_pi = 0
for _x in range(-2047, 2048):
    _v = squash(_x)
    for _j in range(_pi, _v + 1):
        STRETCH[_j] = _x
    _pi = _v + 1
for _j in range(_pi, 4096):
    STRETCH[_j] = 2047
ST_HALF = STRETCH[2048]

LIMIT = 255
RATE = [131072 // (2 * n + 3) for n in range(LIMIT + 1)]
LR = 16
W0 = 20000
STEP = 128          # a shipped cell's stretch, to the nearest STEP
HASH_BITS = 24      # a shipped context's fingerprint
NO_CELLS = {}


class Model:
    """Learning (training on the server) or frozen (a shipped table, on the
    server when coding and on the phone when decoding).

    Learning: cells[key] = {node: [p, n]}, p the chance of a 1 in 65536ths
    and n how often seen; the mixers' weights learn too.
    Frozen: table[fingerprint] = {node: stretch}; nothing shared learns.
    Keys starting "L" are the game's own in either case, and learn."""

    def __init__(self, table=None, weights=None):
        self.rc = None
        self.frozen = table is not None
        self.table = table
        self.cells = {}
        self.local = {}
        self.weights = weights if weights is not None else {}
        self.fps = {}

    def _srcs(self, ctxs):
        out = []
        for c in ctxs:
            if c[0] == "L" and c[1] == SEP:
                a = self.local.get(c)
                if a is None:
                    a = self.local[c] = {}
                out.append((a, False))
            elif self.frozen:
                f = self.fps.get(c)
                if f is None:
                    f = self.fps[c] = fingerprint(c, HASH_BITS)
                out.append((self.table.get(f, NO_CELLS), True))
            else:
                a = self.cells.get(c)
                if a is None:
                    a = self.cells[c] = {}
                out.append((a, False))
        return out

    def _weights(self, wkey, k, rows):
        ws = self.weights.get(wkey)
        if ws is None:
            ws = [[W0] * (k - 1) + [0] for _ in range(rows)]
            if not self.frozen:
                self.weights[wkey] = ws
        return ws

    def _bit(self, srcs, w, node, bit):
        """One decision: each context's cell at this node, mixed, coded; then
        whatever learns, learns."""
        st = []
        cells = []
        for a, shipped in srcs:
            if shipped:
                st.append(a.get(node, 0))
                continue
            c = a.get(node)
            if c is None:
                c = a[node] = [32768, 0]
                st.append(ST_HALF)
            else:
                st.append(STRETCH[c[0] >> 4])
            cells.append(c)
        st.append(256)
        k = len(st)
        dot = 0
        for j in range(k):
            dot += w[j] * st[j]
        p1 = squash(dot >> 16)
        b = self.rc.put(4096 - p1, bit)
        if not self.frozen:
            err = ((b << 12) - p1) * LR
            for j in range(k):
                w[j] += (st[j] * err) >> 16
        for c in cells:
            p, n = c
            if b:
                p += ((65536 - p) * RATE[n]) >> 16
            else:
                p -= (p * RATE[n]) >> 16
            c[0] = 32 if p < 32 else (65504 if p > 65504 else p)
            if n < LIMIT:
                c[1] = n + 1
        return b

    def code(self, name, ctxs, nbits, value=None, sel=None):
        """A value of nbits, most significant bit first; sel picks the
        mixer's weights, so contexts can be trusted differently by case."""
        srcs = self._srcs(ctxs)
        k = len(srcs) + 1
        ws = self._weights(K(name, k, nbits, sel), k, nbits)
        m = 1
        for depth in range(nbits):
            b = None if value is None else (value >> (nbits - 1 - depth)) & 1
            b = self._bit(srcs, ws[depth], m, b)
            m = (m << 1) | b
        return m - (1 << nbits)

    def gcode(self, name, ctxs, value=None, sel=None):
        """A small number, small ones likelier: how many bits it takes, in
        unary, then those bits below the top one. Common values take few
        decisions, and a context touches few cells."""
        srcs = self._srcs(ctxs)
        k = len(srcs) + 1
        ws = self._weights(K(name, k, "g", sel), k, 40)
        v = None if value is None else value + 1
        nb = None if v is None else v.bit_length()
        i = 1
        while True:
            if not self._bit(srcs, ws[min(i, 19)], i, None if nb is None else int(nb > i)):
                break
            i += 1
        val = 1
        row = ws[20 + min(i, 19)]
        base = 64 + (1 << (i + 1))
        for j in range(i - 2, -1, -1):
            b = None if v is None else (v >> j) & 1
            b = self._bit(srcs, row, base + val, b)
            val = (val << 1) | b
        return val - 1

    def number(self, name, ctxs, n=None):
        """A non-negative number: its length in bits, then its top bits,
        modelled; any lower bits are sent as they are."""
        v = None if n is None else n + 1
        k = None if v is None else v.bit_length() - 1
        k = self.code(name + "k", [c + SEP + "k" for c in ctxs], 5, k)
        if k == 0:
            return 0
        hi = min(k, 3)
        top = None if v is None else (v >> (k - hi)) & ((1 << hi) - 1)
        top = self.code(name + "h", [c + SEP + "h" + SEP + str(k) for c in ctxs], hi, top)
        rest = 0
        for i in range(k - hi - 1, -1, -1):
            rest = (rest << 1) | self.rc.put(2048, None if v is None else (v >> i) & 1)
        return (((1 << hi) | top) << (k - hi) | rest) - 1


# ─── the battle ────────────────────────────────────────────────────────────

EMPTY, DICT, REF, LIT, INT, IDENT, NUM, PAIR, KW, LIST, BRACKET = range(11)
# Piece kinds, commonest first (gcode favours small numbers).
KORDER = [DICT, IDENT, EMPTY, KW, INT, NUM, PAIR, LIST, LIT, REF, BRACKET]
KRANK = {k: i for i, k in enumerate(KORDER)}
KWS = ["from", "of", "spread", "silent", "still", "miss", "upkeep", "eat", "msg", "anim", "notarget",
       "partiallytrapped", "premajor", "fromitem", "zeffect", "consumed", "damage", "weaken", "wisher",
       "block", "identify", "source", "number", "prepare"]
KW_INDEX = {k: i for i, k in enumerate(KWS)}
IDENT_RE = re.compile(r"^p([1-4])([a-d]?)(?:: (.*))?$", re.S)
NUM_RE = re.compile(r"^(0|[1-9][0-9]{0,8})(\D.*)$", re.S)
INT_RE = re.compile(r"^(0|[1-9][0-9]{0,8})$")
KW_RE = re.compile(r"^\[([a-z]+)\] (.*)$", re.S)
HP_RE = re.compile(r"^(0|[1-9][0-9]{0,3})(/[0-9]+)?((?: [a-z]+)?)$")
STATUSES = ["", " brn", " par", " slp", " frz", " psn", " tox", " fnt"]
SWITCHES = ("switch", "drag", "replace")
HPS = ("-damage", "-heal", "-sethp")
AFTER_MOVE = ("move", "-supereffective", "-resisted", "-crit", "-damage", "-activate", "-hitcount")
REPORTS = ("-damage", "-immune", "-miss", "-activate", "-fail", "-block")
HAZARDS = ("G-Max Steelsurge", "Spikes", "Stealth Rock", "Sticky Web", "Toxic Spikes")
POOL = 12


def to_id(text):
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def slot_ident(s):
    """(side, slot, name) for "p1a: Name", else None."""
    m = IDENT_RE.match(s)
    if m and m.group(2) and m.group(3) is not None:
        return int(m.group(1)) - 1, "abcd".find(m.group(2)) + 1, m.group(3)
    return None


def ident_text(pos, name):
    return "p%d%s: %s" % ((pos >> 3) + 1, "abcd"[(pos & 7) - 1], name)


def rel(c, ref):
    if ref is None:
        return "-"
    if c == ref:
        return "S"
    return "A" if c >> 3 == ref >> 3 else "F"


def hp_of(s):
    m = HP_RE.match(s)
    if m and m.group(2) in (None, "/100"):
        return int(m.group(1)), m.group(3)
    return None


def places_of(pos):
    """From a place, the four it acts on: across, across and over, beside, itself."""
    side, slot = pos >> 3, pos & 7
    return [(1 - side) * 8 + slot, (1 - side) * 8 + 3 - slot, side * 8 + 3 - slot, pos]


class Dictionary:
    """The strings a format's battles use (their commands and field values),
    commonest first."""

    def __init__(self, commands, strings):
        self.commands = list(commands)
        self.cmd_id = {c: i for i, c in enumerate(self.commands)}
        self.strings = list(strings)
        self.str_id = {s: i for i, s in enumerate(self.strings)}


class Codec:
    """Encodes when handed values, decodes when handed None: the same code
    walks both ways, so the two cannot drift apart."""

    def __init__(self, d, model):
        self.d = d
        self.m = model
        self.lits = []           # strings no dictionary had, as first seen
        self.lit_id = {}
        self.dbits = max(1, (len(d.strings) - 1).bit_length())
        self.pool = {}           # species -> {move: how often}; shipped as orders
        self.vocab = {}          # field -> ([dictionary ids], {id: place})
        self.lit_base = 0
        self.new_game()

    # ─── a game ───
    def new_game(self, teams=None):
        self.m.local = {}
        if self.m.frozen:
            for s in self.lits[self.lit_base:]:
                del self.lit_id[s]
            del self.lits[self.lit_base:]
        teams = teams or [[], []]
        self.roster = [[{"pv": s, "name": None, "det": None, "rest": None, "tera": None} for s in teams[i]]
                       for i in (0, 1)]
        self.active = {}          # place -> name
        self.hp = {}              # (side, name) -> HP
        self.status = {}
        self.moves = {}           # (side, name) -> moves used, latest first
        self.sheet = {}           # (side, name) -> {"moves": ids, "tag": item and ability}
        self.fainted = set()
        self.pending = set()      # places whose Pokemon fainted, not yet replaced
        self.mru = []             # places, latest mentioned first
        self.moved = set()
        self.turn = 0
        self.doubles = 0
        self.prev = self.prev2 = self.prev3 = "^"
        self.tag = "^"
        self.last_move = "^"
        self.last_subj = None
        self.last_actor = None
        self.targets = ()
        self.cur = "-"
        self.cur_side = 4
        self.pf = "^"
        self.pos = 1
        self.tsp = "-"
        self.side_cond = [set(), set(), set(), set()]
        self.weather = ""
        self.single = {}          # place -> its single-turn effect (Protect...)
        self.ptargets = set()     # a move's targets not yet reported on
        self.dying = set()        # at 0 HP, faint line still to come
        self.gimmick = [0, 0]     # terastallized / mega evolved, per side
        self.field = set()        # Trick Room, terrains...
        self.toxn = {}            # toxic's count, per Pokemon
        self.last_delta = 0
        self.last_faint = "-"

    def game(self, text=None, teams=None):
        """One game: its lines, then the end. Returns the text."""
        self.new_game(teams)
        if text is None:
            lines = []
            while True:
                line = self.line()
                if line is None:
                    return "\n".join(lines)
                lines.append(line)
        for line in text.split("\n"):
            self.line(line)
        self.command(0)
        return text

    # ─── what the battle looks like ───
    def hazards(self, side):
        if side > 3:
            return ()
        return tuple(c for c in HAZARDS if c in self.side_cond[side])

    def tstate(self):
        """What the next line is likely about: after a move, whether its target
        is protecting and how many targets are left; after a switch, the
        hazards it came in on; else what is left to report."""
        if self.prev == "move":
            tg = self.targets[0] if self.targets else None
            return ("m", self.single.get(tg, ""), len(self.ptargets))
        if self.prev in ("switch", "drag"):
            side = (self.last_subj >> 3) if self.last_subj is not None else 0
            return ("s", self.hazards(side), self.weather)
        return ("o", len(self.ptargets), len(self.dying))

    def sstate(self):
        """The line's Pokemon: its status, its side's hazards, the weather --
        what residual damage and end-of-turn effects depend on."""
        side = self.cur_side
        return (self.status.get((side, self.cur), ""), self.hazards(side), self.weather, self.last_faint)

    def foe(self, pos):
        side = pos >> 3
        if side > 1:
            return "-"
        return self.active.get((1 - side) * 8 + (pos & 7), "-")

    def side_names(self, side):
        if side > 1:
            return []
        return [e["name"] or e["pv"] for e in self.roster[side]]

    def sheet_tag(self):
        s = self.sheet.get((self.cur_side, self.cur))
        return s["tag"] if s else None

    # ─── pieces ───
    def classify(self, s, depth):
        if s == "":
            return EMPTY
        if s in self.d.str_id:
            return DICT
        if s in self.lit_id:
            return REF
        if depth < 3:
            if INT_RE.match(s):
                return INT
            if IDENT_RE.match(s):
                return IDENT
            m = KW_RE.match(s)
            if m and m.group(1) in KW_INDEX:
                return KW
            if NUM_RE.match(s):
                return NUM
            if ", " in s:
                return PAIR
            if s.startswith("]") and len(s) > 1:
                return BRACKET
            if "," in s:
                return LIST
        return LIT

    def piece(self, key, s=None, depth=0):
        m = self.m
        kind = None if s is None else self.classify(s, depth)
        r = m.gcode("k", [K("k", key), K("k", key, self.prev), K("k", key, self.cur), K("k", key, self.pf)],
                    None if kind is None else KRANK[kind])
        kind = KORDER[r]
        if kind == EMPTY:
            return ""
        if kind == DICT:
            return self.dict_str(key, s)
        if kind == REF:
            return self.lits[m.number("r", [K("r")], None if s is None else self.lit_id[s])]
        if kind == LIT:
            s = self.text("lit", s)
            self.lit_id[s] = len(self.lits)
            self.lits.append(s)
            return s
        if kind == INT:
            return str(m.number("i", [K("i", key), K("i", key, self.pf), K("i", key, self.last_move)],
                                None if s is None else int(s)))
        if kind == IDENT:
            return self.who(key, s)
        if kind == NUM:
            mm = None if s is None else NUM_RE.match(s)
            n = m.number("n", [K("n", key)], None if mm is None else int(mm.group(1)))
            return str(n) + self.piece(FK(key, "nr"), None if mm is None else mm.group(2), depth + 1)
        if kind == PAIR:
            a, b = (None, None) if s is None else s.split(", ", 1)
            return self.piece(FK(key, "a"), a, depth + 1) + ", " + self.piece(FK(key, "b"), b, depth + 1)
        if kind == KW:
            mm = None if s is None else KW_RE.match(s)
            k = m.gcode("kw", [K("kw", key), K("kw", key, self.prev), K("kw", key, self.cur), K("kw", key, self.pf)],
                        None if mm is None else KW_INDEX[mm.group(1)])
            name = KWS[k]
            rest = None if mm is None else mm.group(2)
            if name == "spread":
                return "[spread] " + self.spread(rest)
            return "[%s] %s" % (name, self.piece(FK(key, name), rest, depth + 1))
        if kind == LIST:
            parts = None if s is None else s.split(",")
            n = m.number("ln", [K("ln", key)], None if parts is None else len(parts))
            return ",".join(self.piece(FK(key, "li"), None if parts is None else parts[j], depth + 1)
                            for j in range(n))
        if kind == BRACKET:
            return "]" + self.piece(FK(key, "br"), None if s is None else s[1:], depth + 1)
        raise ValueError("bad piece kind %d" % kind)

    def dict_str(self, key, s=None):
        """A field's string: by its place in the field's own vocabulary (in
        the order the field first used them), else from the dictionary."""
        voc = self.vocab.get(key)
        if voc is None:
            voc = ([], {})
            if not self.m.frozen:
                self.vocab[key] = voc
        ids, pos = voc
        i = None if s is None else self.d.str_id[s]
        at = None if i is None else pos.get(i, -1)
        known = self.m.code("dk", [K("dk", key), K("dk", key, self.cur), K("L", "dk", key)], 1,
                            None if at is None else int(at >= 0))
        if known:
            ctxs = [K("dv", key), K("dv", key, self.cur), K("dv", key, self.pf), K("dv", key, self.last_move),
                    K("L", "dv", key, self.cur), K("dv", key, self.prev, self.tag), K("dv", key, self.sstate())]
            tag = self.sheet_tag()
            if tag is not None:
                ctxs.append(K("dv", key, tag))
            return self.d.strings[ids[self.m.gcode("dv", ctxs, at)]]
        i = self.m.code("ds", [K("ds", key.split("/", 1)[0]), K("ds")], self.dbits, i)
        if not self.m.frozen:
            pos[i] = len(ids)
            ids.append(i)
        return self.d.strings[i]

    def text(self, key, s=None):
        raw = None if s is None else s.encode("utf8")
        n = self.m.number("tl", [K("tl", key)], None if raw is None else len(raw))
        out = bytearray()
        prev = 0
        for i in range(n):
            b = self.m.code("tb", [K("tb", prev), K("tb")], 8, None if raw is None else raw[i])
            out.append(b)
            prev = b
        return out.decode("utf8", "replace")

    # ─── who ───
    def who(self, key, s=None):
        """A Pokemon on the field: asked of each in turn, the most recently
        mentioned first; anything else is spelled out."""
        cands = [p for p in self.mru if p in self.active]
        cands += sorted(p for p in self.active if p not in cands)
        mine = None
        if s is not None:
            t = slot_ident(s)
            if t and self.active.get(t[0] * 8 + t[1]) == t[2]:
                mine = t[0] * 8 + t[1]
        n = len(cands)
        for j, c in enumerate(cands):
            rs = rel(c, self.last_subj)
            ra = rel(c, self.last_actor)
            it = int(c in self.targets)
            h0 = int(self.hp.get((c >> 3, self.active[c]), 100) == 0)
            ctxs = [K("w", key, self.prev, rs, ra, it, h0, int(c in self.ptargets)), K("w", key, self.tag, rs, it),
                    K("w", key, j, n), K("L", "w", key, self.prev, c), K("w", key, self.prev, self.active[c])]
            if self.m.code("w", ctxs, 1, None if s is None else int(c == mine)):
                return ident_text(c, self.active[c])
        return self.spell(key, s)

    def spell(self, key, s=None):
        m = None if s is None else IDENT_RE.match(s)
        side = self.m.code("is", [K("is", key)], 2, None if m is None else int(m.group(1)) - 1)
        slot = self.m.code("il", [K("il", key, side)], 3,
                           None if m is None else ("abcd".find(m.group(2)) + 1 if m.group(2) else 0))
        named = self.m.code("in", [K("in", key)], 1, None if m is None else int(m.group(3) is not None))
        prefix = "p%d%s" % (side + 1, " abcd"[slot].strip())
        if not named:
            return prefix
        name = None if m is None else m.group(3)
        names = self.side_names(side)
        k = min(len(names), 7)
        at = None if name is None else (names.index(name) if name in names[:k] else 7)
        at = self.m.code("inm", [K("inm", key, k)], 3, at)
        if at < k:
            return prefix + ": " + names[at]
        return prefix + ": " + self.piece("nm", name, 1)

    # ─── lines ───
    def line(self, line=None):
        d = self.d
        if line is not None:
            fields = line[1:].split("|") if line.startswith("|") else None
            v = 1
            if fields is not None and fields[0] in d.cmd_id:
                v = d.cmd_id[fields[0]] + 2
        else:
            fields = v = None
        v = self.command(v)
        if v == 0:
            return None
        if v == 1:
            text = self.text("raw", line)
            self.shift("(raw)", "")
            return text
        cmd = d.commands[v - 2]
        f = None if fields is None else fields[1:]
        if cmd == "showteam" and f is not None and len(f) > 2:
            f = [f[0], "|".join(f[1:])]   # the packed team has "|"s of its own
        self.cur = "-"
        self.cur_side = 4
        self.pf = "^"
        if cmd == "move":
            out = self.move_line(f)
        elif cmd in SWITCHES:
            out = self.switch_line(cmd, f)
        elif cmd in HPS:
            out = self.hp_line(cmd, f)
        elif cmd == "turn":
            out = self.turn_line(f)
        elif cmd == "showteam":
            out = self.showteam_line(f)
        else:
            out = self.generic(cmd, f)
        self.track(cmd, out)
        return "|" + "|".join([cmd] + out)

    def command(self, v=None):
        """0 ends the game, 1 is a text line, then the dictionary's commands."""
        nw = sum(1 for p in self.active if p not in self.moved and (p >> 3, self.active[p]) not in self.fainted)
        ctxs = [K("c", self.prev, self.tag), K("c", self.prev2, self.prev), K("c", self.prev3, self.prev2, self.prev),
                K("c", self.prev, self.last_move),
                K("c", self.prev, nw, len(self.pending), len(self.dying), bool(self.weather)),
                K("L", "c", self.prev, self.tag), K("c", self.prev, self.tag, self.tsp),
                K("c", self.prev, self.tag, self.tstate()), K("c", self.prev, self.gimmick)]
        return self.m.gcode("c", ctxs, v, sel=self.prev)

    def count(self, cmd, n=None):
        """How many more fields a line has."""
        ctxs = [K("nf", cmd, self.prev, self.tag), K("nf", cmd, self.cur), K("nf", cmd, self.last_move),
                K("L", "nf", cmd, self.cur, self.prev)]
        return self.m.gcode("nf", ctxs, n)

    @staticmethod
    def field_tag(v):
        return "@" if IDENT_RE.match(v) else v

    def generic(self, cmd, f=None):
        has = self.m.code("h0", [K("h0", cmd)], 1, None if f is None else int(len(f) > 0))
        if not has:
            return []
        first = self.piece(FK(cmd, 0), None if f is None else f[0])
        t = IDENT_RE.match(first)
        self.cur = (t.group(3) or first) if t else "-"
        self.cur_side = int(t.group(1)) - 1 if t else 4
        out = [first]
        n = self.count(cmd, None if f is None else len(f) - 1)
        for i in range(1, n + 1):
            self.pf = self.field_tag(out[-1])
            out.append(self.piece(FK(cmd, min(i, 6)), None if f is None else f[i]))
        return out

    def turn_line(self, f=None):
        exp = str(self.turn + 1)
        if self.m.code("tn", [K("tn")], 1, None if f is None else int(f == [exp])):
            return [exp]
        return self.generic("turn", f)

    # ─── moves ───
    def move_line(self, f=None):
        m = self.m
        ok = m.code("mok", [K("mok")], 1, None if f is None else int(len(f) >= 2 and slot_ident(f[0]) is not None))
        if not ok:
            return self.generic("move", f)
        actor = self.actor(None if f is None else f[0])
        side, slot, name = slot_ident(actor)
        who = (side, name)
        self.cur = name
        self.cur_side = side
        self.pos = side * 8 + slot
        move = self.move_name(who, None if f is None else f[1])
        self.last_move = move
        n = None if f is None else len(f) - 2
        nrest = m.gcode("mnf", [K("mnf", move), K("mnf", self.prev), K("L", "mnf", side, name, move)], n)
        out = [actor, move]
        if nrest >= 1:
            out.append(self.target(self.pos, who, move, None if f is None else f[2]))
        for i in range(3, 2 + nrest):
            self.pf = self.field_tag(out[-1])
            out.append(self.piece(FK("move", min(i, 6)), None if f is None else f[i]))
        return out

    def actor(self, s=None):
        """Who moves: asked of each Pokemon that has not moved this turn."""
        waiting = [p for p in sorted(self.active)
                   if p not in self.moved and (p >> 3, self.active[p]) not in self.fainted]
        mine = None
        if s is not None:
            t = slot_ident(s)
            if t and self.active.get(t[0] * 8 + t[1]) == t[2]:
                mine = t[0] * 8 + t[1]
        k = len(waiting)
        for j, c in enumerate(waiting):
            sp = self.active[c]
            side = c >> 3
            others = sorted(self.active[o] for o in waiting if o != c)
            tw = ("Tailwind" in self.side_cond[side], side < 2 and "Tailwind" in self.side_cond[1 - side])
            ctxs = [K("ac", sp, k), K("ac", j, k, self.prev), K("L", "ac", c, waiting), K("ac", sp, self.prev),
                    K("ac", sp, others), K("ac", sp, k, "Trick Room" in self.field, tw, self.turn == 1)]
            if self.m.code("ac", ctxs, 1, None if s is None else int(c == mine)):
                return ident_text(c, sp)
        return self.who(FK("move", 0), s)

    def move_name(self, who, s=None):
        """One of the moves this Pokemon has used, the latest first; else one
        from its species' movepool (its team sheet's first); else any."""
        known = self.moves.setdefault(who, [])
        sp = who[1]
        foe = self.foe(self.pos)
        for j, mv in enumerate(known):
            ctxs = [K("mk", sp, mv), K("mk", mv, j == 0), K("L", "mk", who[0], sp, mv), K("mk", j, len(known), self.prev),
                    K("mk", sp, mv, foe)]
            if self.m.code("mk", ctxs, 1, None if s is None else int(s == mv)):
                known.insert(0, known.pop(j))
                return mv
        sheet = self.sheet.get(who)
        order = self.pool.get(sp, ()) if self.m.frozen else self.pool_order(sp)
        cands = [mv for mv in order if mv not in known]
        if sheet is not None:
            first = [mv for mv in cands if to_id(mv) in sheet["moves"]]
            cands = first + [mv for mv in cands if mv not in first]
        for j, mv in enumerate(cands[:POOL]):
            in_sheet = -1 if sheet is None else int(to_id(mv) in sheet["moves"])
            ctxs = [K("mc", sp, mv), K("mc", mv), K("mc", sp, j), K("mc", sp, mv, len(known)), K("mc", in_sheet, j)]
            if self.m.code("mc", ctxs, 1, None if s is None else int(s == mv)):
                self.learn_move(sp, mv)
                known.insert(0, mv)
                return mv
        ind = self.m.code("mnd", [K("mnd")], 1, None if s is None else int(s in self.d.str_id))
        if ind:
            mv = self.d.strings[self.m.code("mn", [K("mn"), K("mn", len(known))], self.dbits,
                                            None if s is None else self.d.str_id[s])]
        else:
            mv = self.piece("mvl", s)
        self.learn_move(sp, mv)
        known.insert(0, mv)
        return mv

    def pool_order(self, sp):
        pool = self.pool.get(sp) or {}
        return sorted(pool, key=lambda mv: (-pool[mv], mv))

    def learn_move(self, sp, mv):
        if not self.m.frozen:
            pool = self.pool.setdefault(sp, {})
            pool[mv] = pool.get(mv, 0) + 1

    def target(self, pos, who, move, s=None):
        """A move's target by where it stands from the user: across, across
        and over, beside, itself; else spelled out."""
        places = places_of(pos)
        r = None
        if s is not None:
            r = 4
            t = slot_ident(s)
            if t:
                p = t[0] * 8 + t[1]
                if p in places and self.active.get(p) == t[2]:
                    r = places.index(p)
        ctxs = [K("tg", move), K("tg", move, self.doubles), K("L", "tg", who[0], who[1], move), K("tg", who[1], move),
                K("tg", move, self.active.get(places[0], "-")), K("tg", move, self.active.get(places[1], "-"))]
        r = self.m.code("tg", ctxs, 3, r)
        if r < 4:
            p = places[r]
            return ident_text(p, self.active[p])
        return self.piece(FK("move", 2), s)

    def spread(self, rest=None):
        """Where a spread move landed: a mask over the four places."""
        places = places_of(self.pos)
        ok = None
        mask = None
        if rest is not None:
            mask = 0
            good = True
            for p in rest.split(","):
                t = IDENT_RE.match(p)
                if not t or not t.group(2) or t.group(3) is not None:
                    good = False
                    break
                q = (int(t.group(1)) - 1) * 8 + "abcd".find(t.group(2)) + 1
                if q not in places:
                    good = False
                    break
                mask |= 1 << places.index(q)
            ok = int(good and self.mask_text(places, mask) == rest)
        ok = self.m.code("spo", [K("spo")], 1, ok)
        if not ok:
            return self.piece("spread", rest, 1)
        mask = self.m.code("spm", [K("spm", self.last_move), K("spm"), K("L", "spm", self.last_move)], 4, mask)
        return self.mask_text(places, mask)

    @staticmethod
    def mask_text(places, mask):
        hit = sorted(places[i] for i in range(4) if mask >> i & 1)
        return ",".join("p%d%s" % ((p >> 3) + 1, "abcd"[(p & 7) - 1]) for p in hit)

    # ─── HP ───
    def hp_line(self, cmd, f=None):
        ok = self.m.code("hok", [K("hok", cmd)], 1,
                         None if f is None else int(len(f) >= 2 and slot_ident(f[0]) is not None))
        if not ok:
            return self.generic(cmd, f)
        subj = self.who(FK(cmd, 0), None if f is None else f[0])
        side, slot, name = slot_ident(subj)
        who = (side, name)
        self.cur = name
        self.cur_side = side
        n = self.count(cmd, None if f is None else len(f) - 2)
        # What caused it first: the HP change depends on it.
        extras = []
        for i in range(n):
            self.pf = "^" if not extras else self.field_tag(extras[-1])
            extras.append(self.piece(FK(cmd, 2 + min(i, 3)), None if f is None else f[2 + i]))
        if extras:
            cause = extras[0]
        elif self.prev in AFTER_MOVE:
            cause = "mv:" + self.last_move
        else:
            cause = "p:" + self.prev
        hp = self.hp_value(cmd, who, cause, None if f is None else f[1])
        return [subj, hp] + extras

    def hp_value(self, cmd, who, cause, s=None):
        m = self.m
        mm = None if s is None else HP_RE.match(s)
        ok = None if s is None else int(bool(mm) and mm.group(2) in (None, "/100") and mm.group(3) in STATUSES)
        ok = m.code("hvo", [K("hvo", cmd)], 1, ok)
        if not ok:
            return self.piece(FK(cmd, 1), s)
        have = self.hp.get(who, 100)
        band = min(have // 10, 10)
        new = None if mm is None else int(mm.group(1))
        sp = who[1]
        if cmd == "-damage":
            ko = m.code("ko", [K("ko", cause), K("ko", cause, band), K("ko", band), K("ko", sp, cause)], 1,
                        None if new is None else int(new == 0))
            if ko:
                new = 0
            else:
                new = have - self.delta(cmd, sp, cause, band, None if new is None else have - new)
        elif cmd == "-heal":
            full = m.code("fu", [K("fu", cause), K("fu", cause, band), K("fu", band), K("fu", sp, cause)], 1,
                          None if new is None else int(new == 100))
            if full:
                new = 100
            else:
                new = have + self.delta(cmd, sp, cause, band, None if new is None else new - have)
        else:
            new = have + self.delta(cmd, sp, cause, band, None if new is None else new - have)
        # The rest: "/100" (none when fainted) and the status it has, which
        # is almost always the one we know.
        exp_st = " fnt" if new == 0 else self.status.get(who, "")
        exp_slash = new != 0
        if mm is None:
            if m.code("hsx", [K("hsx", cmd)], 1):
                slash, st = exp_slash, exp_st
            else:
                slash = bool(m.code("hsl", [K("hsl", cmd)], 1))
                st = STATUSES[m.code("hst", [K("hst", cmd)], 3)]
        else:
            slash = mm.group(2) is not None
            st = mm.group(3)
            same = int(slash == exp_slash and st == exp_st)
            m.code("hsx", [K("hsx", cmd)], 1, same)
            if not same:
                m.code("hsl", [K("hsl", cmd)], 1, int(slash))
                m.code("hst", [K("hst", cmd)], 3, STATUSES.index(st))
        return "%d%s%s" % (new, "/100" if slash else "", st)

    def delta(self, cmd, sp, cause, band, d=None):
        m = self.m
        neg = m.code("dn", [K("dn", cmd)], 1, None if d is None else int(d < 0))
        a = None if d is None else abs(d)
        att = self.active.get(self.last_actor, "-") if cause.startswith("mv:") else "-"
        who = (self.cur_side, sp)
        ctxs = [K("dm", cmd, cause), K("dm", cmd, cause, sp), K("dm", cmd, cause, band), K("dm", cmd),
                K("L", "dm", cmd, cause), K("dm", cmd, cause, att), K("dm", cmd, cause, self.prev),
                K("L", "dm", cause, sp), K("dm", cmd, cause, self.status.get(who, ""), self.toxn.get(who, 0)),
                K("dm", cmd, cause, min(self.last_delta, 100) // 3)]
        full = None if a is None else min(a, 127)
        hi = m.code("dm", ctxs, 4, None if full is None else full >> 3)
        lo = m.code("dml", [K("dml", cmd, cause, hi), K("dml", cmd, hi), K("L", "dml", cmd, cause, hi)], 3,
                    None if full is None else full & 7)
        v = (hi << 3) | lo
        if v == 127:
            v = 127 + m.number("dmx", [K("dmx")], None if a is None else a - 127)
        return -v if neg else v

    # ─── switches ───
    def match_entry(self, side, name, det_sp):
        """The team member a switch-in is: by the name it has shown, else by
        its species -- team preview shows "Urshifu-*", and the app's index
        "Urshifu", for any Urshifu."""
        roster = self.roster[side]
        for e in roster:
            if e["name"] == name:
                return e
        for e in roster:
            if e["name"] is None and e["pv"] == det_sp:
                return e
        for e in roster:
            if e["name"] is None:
                pv = e["pv"][:-2] if e["pv"].endswith("-*") else e["pv"]
                if pv and det_sp.startswith(pv + "-"):
                    return e
        return None

    def switch_line(self, cmd, f=None):
        m = self.m
        ok = None
        t = None
        if f is not None:
            t = slot_ident(f[0]) if len(f) >= 3 else None
            ok = int(t is not None and t[0] < 2 and hp_of(f[2]) is not None)
        ok = m.code("sok", [K("sok", cmd)], 1, ok)
        if not ok:
            return self.generic(cmd, f)
        ref = (self.last_actor >> 3) if self.last_actor is not None and self.last_actor >> 3 < 2 else 0
        rpend = sorted(((p >> 3) ^ ref) * 8 + (p & 7) for p in self.pending if p >> 3 < 2)
        other = m.code("ss", [K("ss", cmd, self.prev, rpend), K("ss", cmd, self.tag), K("L", "ss", cmd, self.prev),
                              K("ss", cmd, self.last_move, rpend)], 1,
                       None if t is None else int(t[0] != ref))
        side = ref ^ other
        pend = sorted(self.pending)
        slot = m.code("sl", [K("sl", cmd, side, pend), K("sl", cmd, self.prev), K("sl", self.doubles)], 2,
                      None if t is None else t[1] - 1) + 1
        pos = side * 8 + slot
        leaving = self.active.get(pos)
        on = {v for p, v in self.active.items() if p >> 3 == side}
        bench = [e for e in self.roster[side]
                 if (e["name"] is None or e["name"] not in on) and (side, e["name"]) not in self.fainted]
        me = None
        det_sp = det_rest = None
        if f is not None:
            det_sp, det_rest = (f[1].split(", ", 1) + [None])[:2]
            me = self.match_entry(side, t[2], det_sp)
        k = len(bench)
        chosen = None
        foe = self.foe(pos)
        for j, e in enumerate(bench):
            ctxs = [K("sw", e["pv"], cmd, k), K("sw", j, k, self.prev), K("L", "sw", side, e["pv"]),
                    K("L", "sw", side, e["pv"], leaving), K("sw", e["pv"], foe)]
            if m.code("sw", ctxs, 1, None if f is None else int(e is me)):
                chosen = e
                break
        if chosen is None:
            name = self.piece("swn", None if f is None else t[2], 1)
            det = self.piece(FK(cmd, 1), None if f is None else f[1])
        else:
            exp = chosen["det"] or chosen["pv"]
            same = m.code("dsm", [K("dsm", chosen["det"] is None)], 1, None if f is None else int(det_sp == exp))
            sp = exp if same else self.piece("det", det_sp, 1)
            same_rest = 0
            if chosen["det"] is not None:
                exp_rest = chosen["rest"]
                if chosen["tera"] and "tera:" not in (exp_rest or ""):
                    exp_rest = (exp_rest + ", " if exp_rest else "") + "tera:" + chosen["tera"]
                same_rest = m.code("drs", [K("drs", exp_rest is None)], 1,
                                   None if f is None else int(det_rest == exp_rest))
                if same_rest:
                    det = sp + (", " + exp_rest if exp_rest is not None else "")
            if not same_rest:
                more = m.code("dmo", [K("dmo"), K("L", "dmo", side, sp)], 1,
                              None if f is None else int(det_rest is not None))
                det = sp + (", " + self.piece("detx", det_rest, 1) if more else "")
            exp_name = chosen["name"] or sp
            nsame = m.code("nsm", [K("nsm", chosen["name"] is None)], 1, None if f is None else int(t[2] == exp_name))
            name = exp_name if nsame else self.piece("swn", None if f is None else t[2], 1)
        ident = ident_text(pos, name)
        who = (side, name)
        self.cur = name
        self.cur_side = side
        have = self.hp.get(who, 100)
        exp_hp = "%d/100%s" % (have, self.status.get(who, "")) if have > 0 else "0 fnt"
        hsame = m.code("hsm", [K("hsm", cmd, have == 100)], 1, None if f is None else int(f[2] == exp_hp))
        hp = exp_hp if hsame else self.hp_value("switch", who, "switch", None if f is None else f[2])
        n = self.count(cmd, None if f is None else len(f) - 3)
        out = [ident, det, hp]
        for i in range(n):
            self.pf = self.field_tag(out[-1])
            out.append(self.piece(FK(cmd, 3 + min(i, 3)), None if f is None else f[3 + i]))
        return out

    # ─── open team sheets ───
    def showteam_line(self, f=None):
        """|showteam|p1|a packed team: each Pokemon by its place in the team
        the index has, then its sheet field by field."""
        m = self.m
        ok = m.code("sto", [K("sto")], 1, None if f is None else int(len(f) == 2 and f[0] in ("p1", "p2")))
        if not ok:
            return self.generic("showteam", f)
        side = m.code("sts", [K("sts", self.prev)], 1, None if f is None else int(f[0] == "p2"))
        entries = None if f is None else f[1].split("]")
        n = m.gcode("stn", [K("stn", len(self.roster[side]))], None if entries is None else len(entries))
        out = []
        for j in range(n):
            out.append(self.sheet_entry(side, j, None if entries is None else entries[j]))
        return ["p%d" % (side + 1), "]".join(out)]

    def sheet_entry(self, side, j, e=None):
        m = self.m
        fs = None if e is None else e.split("|")
        ok = m.code("ste", [K("ste")], 1, None if fs is None else int(len(fs) == 12 and fs[1] == ""))
        if not ok:
            return self.piece("st/raw", e, 1)
        roster = self.roster[side]
        pv = roster[j]["pv"] if j < len(roster) else None
        same = m.code("stp", [K("stp", pv is None)], 1, None if fs is None else int(pv is not None and fs[0] == pv))
        sp = pv if same else self.piece("st/sp", None if fs is None else fs[0], 1)
        self.cur = sp
        self.cur_side = side
        vals = [sp, ""]
        for i in range(2, 12):
            self.pf = self.field_tag(vals[-1]) if i > 2 else "^"
            v = None if fs is None else fs[i]
            if i == 4:
                vals.append(self.sheet_moves(sp, v))
            else:
                vals.append(self.piece(FK("st", i), v, 1))
        return "|".join(vals)

    def sheet_moves(self, sp, v=None):
        parts = None if v is None else v.split(",")
        n = self.m.gcode("stm", [K("stm", sp), K("stm")], None if parts is None else len(parts))
        out = []
        for j in range(n):
            self.pf = out[-1] if out else "^"
            out.append(self.piece("st/mv", None if parts is None else parts[j], 1))
        return ",".join(out)

    # ─── what the battle now looks like ───
    def track(self, cmd, f):
        subj = slot_ident(f[0]) if f else None
        tag = None
        # Whom the next line is likely about: a move's target, else this
        # line's Pokemon.
        self.tsp = subj[2] if subj else "-"
        if cmd == "move" and len(f) > 2:
            tt = slot_ident(f[2])
            self.tsp = tt[2] if tt else "-"
        self.track_state(cmd, f, subj)
        if cmd in SWITCHES and subj and len(f) >= 3:
            side, slot, name = subj
            pos = side * 8 + slot
            det_sp = f[1].split(", ")[0]
            if side < 2:
                e = self.match_entry(side, name, det_sp)
                if e is None:
                    e = {"pv": det_sp, "name": None, "det": None, "rest": None, "tera": None}
                    self.roster[side].append(e)
                e["name"] = name
                e["det"] = det_sp
                e["rest"] = f[1].split(", ", 1)[1] if ", " in f[1] else None
            self.active[pos] = name
            self.pending.discard(pos)
            self.fainted.discard((side, name))
            h = hp_of(f[2])
            if h:
                self.hp[(side, name)] = h[0]
                self.status[(side, name)] = "" if h[1] == " fnt" else h[1]
            if slot == 2:
                self.doubles = 1
            tag = det_sp
        elif cmd == "move" and subj:
            pos = subj[0] * 8 + subj[1]
            self.moved.add(pos)
            self.last_actor = pos
            self.last_move = f[1] if len(f) > 1 else ""
            tg = []
            if len(f) > 2:
                tt = slot_ident(f[2])
                if tt:
                    tg.append(tt[0] * 8 + tt[1])
            for x in f[3:]:
                if x.startswith("[spread] "):
                    for p in x[9:].split(","):
                        mm = IDENT_RE.match(p)
                        if mm and mm.group(2):
                            tg.append((int(mm.group(1)) - 1) * 8 + "abcd".find(mm.group(2)) + 1)
            self.targets = tuple(tg)
            tag = self.last_move
        elif cmd == "turn":
            self.moved = set()
            if f and INT_RE.match(f[0]):
                self.turn = int(f[0])
            tag = ""
        elif cmd in HPS and subj and len(f) > 1:
            h = hp_of(f[1])
            band = "?"
            if h:
                who = (subj[0], subj[2])
                self.hp[who] = h[0]
                if h[1] != " fnt":
                    self.status[who] = h[1]
                band = "0" if h[0] == 0 else ("q" if h[0] <= 25 else ("h" if h[0] <= 50 else "+"))
            tag = (f[2] if len(f) > 2 else "") + "|" + band
        elif cmd == "faint" and subj:
            who = (subj[0], subj[2])
            self.hp[who] = 0
            self.fainted.add(who)
            self.pending.add(subj[0] * 8 + subj[1])
        elif cmd == "-status" and subj and len(f) > 1:
            self.status[(subj[0], subj[2])] = " " + f[1]
        elif cmd == "-curestatus" and subj:
            self.status[(subj[0], subj[2])] = ""
        elif cmd == "detailschange" and subj and len(f) > 1 and subj[0] < 2:
            e = self.match_entry(subj[0], subj[2], f[1].split(", ")[0])
            if e is not None:
                e["det"] = f[1].split(", ")[0]
        elif cmd == "-weather":
            tag = "|".join(f)
        elif cmd == "showteam" and len(f) == 2 and f[0] in ("p1", "p2"):
            self.read_sheet(0 if f[0] == "p1" else 1, f[1])
            tag = f[0]
        if tag is None:
            if len(f) > 1 and not IDENT_RE.match(f[1]):
                tag = f[1]
            elif f and not IDENT_RE.match(f[0]):
                tag = f[0]
            else:
                tag = ""
        for x in f:
            if x.startswith("[of] "):
                x = x[5:]
            t = slot_ident(x)
            if t:
                p = t[0] * 8 + t[1]
                if p in self.mru:
                    self.mru.remove(p)
                self.mru.insert(0, p)
        if subj:
            self.last_subj = subj[0] * 8 + subj[1]
        self.shift(cmd, tag)

    def read_sheet(self, side, packed):
        """What an open team sheet tells the rest of the battle: each
        Pokemon's moves, item and ability."""
        for entry in packed.split("]"):
            fs = entry.split("|")
            if len(fs) < 5 or not fs[0]:
                continue
            self.sheet[(side, fs[0])] = {"moves": {to_id(x) for x in fs[4].split(",") if x},
                                         "tag": to_id(fs[2]) + "|" + to_id(fs[3])}

    def track_state(self, cmd, f, subj):
        pos = subj[0] * 8 + subj[1] if subj else None
        who = (subj[0], subj[2]) if subj else None
        if cmd == "turn":
            self.single = {}
            self.ptargets = set()
        elif cmd == "move" and pos is not None:
            tg = set()
            if len(f) > 2:
                tt = slot_ident(f[2])
                if tt:
                    tg.add(tt[0] * 8 + tt[1])
            for x in f[3:]:
                if x.startswith("[spread] "):
                    tg = set()
                    for q in x[9:].split(","):
                        mm = IDENT_RE.match(q)
                        if mm and mm.group(2):
                            tg.add((int(mm.group(1)) - 1) * 8 + "abcd".find(mm.group(2)) + 1)
            tg.discard(pos)
            self.ptargets = tg
        elif pos in self.ptargets and cmd in REPORTS:
            self.ptargets.discard(pos)
        if cmd == "-singleturn" and pos is not None and len(f) > 1:
            self.single[pos] = f[1][6:] if f[1].startswith("move: ") else f[1]
        elif cmd in ("-sidestart", "-sideend") and f:
            mm = IDENT_RE.match(f[0])
            if mm and len(f) > 1:
                side = int(mm.group(1)) - 1
                c = f[1][6:] if f[1].startswith("move: ") else f[1]
                if cmd == "-sidestart":
                    self.side_cond[side].add(c)
                else:
                    self.side_cond[side].discard(c)
        elif cmd == "-weather" and f:
            if f[0] == "none":
                self.weather = ""
            elif "[upkeep]" not in f:
                self.weather = f[0]
        elif cmd in ("-terastallize", "-mega") and subj and subj[0] < 2:
            self.gimmick[subj[0]] = 1
            if cmd == "-terastallize" and len(f) > 1:
                e = self.match_entry(subj[0], subj[2], subj[2])
                if e is not None:
                    e["tera"] = f[1]
        elif cmd in ("-fieldstart", "-fieldend") and f:
            c = f[0][6:] if f[0].startswith("move: ") else f[0]
            if cmd == "-fieldstart":
                self.field.add(c)
            else:
                self.field.discard(c)
        elif cmd == "faint" and who:
            self.dying.discard(who)
            self.last_faint = "p%d" % (who[0] + 1)
        elif cmd in SWITCHES and who:
            self.toxn[who] = 0
        if cmd in HPS and who and len(f) > 1:
            h = hp_of(f[1])
            if h:
                self.last_delta = abs(h[0] - self.hp.get(who, 100))
                if h[0] == 0:
                    self.dying.add(who)
                if cmd == "-damage" and len(f) > 2 and f[2] == "[from] psn" and self.status.get(who) == " tox":
                    self.toxn[who] = self.toxn.get(who, 0) + 1

    def shift(self, cmd, tag):
        self.prev3, self.prev2, self.prev = self.prev2, self.prev, cmd
        self.tag = tag


# ─── the dictionary ────────────────────────────────────────────────────────

def leaves(field, depth=0):
    """The strings a field breaks into, as the codec would look them up."""
    if field == "":
        return
    if depth < 3:
        if INT_RE.match(field):
            return
        m = IDENT_RE.match(field)
        if m:
            if m.group(3) is not None:
                yield from leaves(m.group(3), depth + 1)
            return
        m = KW_RE.match(field)
        if m and m.group(1) in KW_INDEX:
            if m.group(1) != "spread":
                yield from leaves(m.group(2), depth + 1)
            return
        m = NUM_RE.match(field)
        if m:
            yield from leaves(m.group(2), depth + 1)
            return
        if ", " in field:
            a, b = field.split(", ", 1)
            yield from leaves(a, depth + 1)
            yield from leaves(b, depth + 1)
            return
        if field.startswith("]") and len(field) > 1:
            yield from leaves(field[1:], depth + 1)
            return
        if "," in field:
            for part in field.split(","):
                yield from leaves(part, depth + 1)
            return
    yield field


def build_dictionary(texts, min_games=2):
    """Commands and field strings, commonest first; a string must turn up in
    min_games games to be worth a place."""
    cmd_tf = {}
    leaf_tf = {}
    leaf_df = {}
    for text in texts:
        seen = set()
        for line in text.split("\n"):
            if not line.startswith("|"):
                continue
            fields = line[1:].split("|")
            cmd_tf[fields[0]] = cmd_tf.get(fields[0], 0) + 1
            if fields[0] == "showteam" and len(fields) > 2:
                entries = "|".join(fields[2:]).split("]")
                values = [x for entry in entries for v in entry.split("|") for x in v.split(",")]
            else:
                values = fields[1:]
            for f in values:
                for leaf in leaves(f):
                    leaf_tf[leaf] = leaf_tf.get(leaf, 0) + 1
                    seen.add(leaf)
        for leaf in seen:
            leaf_df[leaf] = leaf_df.get(leaf, 0) + 1
    commands = sorted(cmd_tf, key=lambda c: (-cmd_tf[c], c))
    strings = sorted((s for s in leaf_tf if leaf_df[s] >= min_games), key=lambda s: (-leaf_tf[s], s))
    return Dictionary(commands, strings)


# ─── training, and what is shipped ────────────────────────────────────────

def train(games):
    """A codec trained on games -- [(canonical text, teams)] -- oldest
    first, so it ends on the latest."""
    d = build_dictionary([text for text, _ in games])
    codec = Codec(d, Model())
    codec.m.rc = Encoder()
    for text, teams in games:
        codec.game(text, teams)
    return codec


def shipped_table(model, min_seen=8):
    """The cells worth shipping: seen at least min_seen times, quantized,
    grouped by the context's fingerprint (two contexts on one fingerprint:
    the one with more kept cells)."""
    table = {}
    for key, cells in model.cells.items():
        kept = {}
        for node, (p, n) in cells.items():
            if n < min_seen:
                continue
            q = int(round(STRETCH[p >> 4] / STEP))
            if q:
                kept[node] = q * STEP
        if not kept:
            continue
        f = fingerprint(key, HASH_BITS)
        if f in table and len(table[f]) >= len(kept):
            continue
        table[f] = kept
    return table


def frozen_codec(d, table, weights, pools, vocab, lits):
    """The codec as the phone has it: the shipped table and lists, nothing
    shared learning."""
    codec = Codec(d, Model(table=table, weights=weights))
    codec.pool = pools
    codec.vocab = vocab
    codec.lits = list(lits)
    codec.lit_id = {s: i for i, s in enumerate(codec.lits)}
    codec.lit_base = len(codec.lits)
    return codec


def ship(codec, min_seen=8):
    """A trained codec, frozen as it would be shipped: (frozen codec, the
    parts to write in the model file)."""
    table = shipped_table(codec.m, min_seen)
    # Enough of each movepool that the POOL asked after leaving out the four
    # a Pokemon has shown are the same ones training asked.
    pools = {sp: codec.pool_order(sp)[:POOL + 4] for sp in codec.pool}
    vocab = {k: (list(ids), dict(pos)) for k, (ids, pos) in codec.vocab.items()}
    parts = {"table": table, "weights": codec.m.weights, "pools": pools, "vocab": vocab, "lits": list(codec.lits),
             "commands": codec.d.commands, "strings": codec.d.strings}
    return frozen_codec(codec.d, table, codec.m.weights, pools, vocab, codec.lits), parts


def encode_game(codec, text, teams):
    """One game's bytes, from a frozen codec."""
    enc = Encoder()
    codec.m.rc = enc
    codec.game(text, teams)
    return enc.finish()


def decode_game(codec, data, teams):
    codec.m.rc = Decoder(data)
    return codec.game(None, teams)


# ─── files ─────────────────────────────────────────────────────────────────

def _varint(out, n):
    while n >= 0x80:
        out.append((n & 0x7F) | 0x80)
        n >>= 7
    out.append(n)


def _zigzag(n):
    return n << 1 if n >= 0 else (-n << 1) - 1


def _unzigzag(z):
    return z >> 1 if not z & 1 else -((z + 1) >> 1)


def _string(out, s):
    b = s.encode("utf8")
    _varint(out, len(b))
    out += b


class _Reader:
    def __init__(self, data):
        self.data = data
        self.pos = 0

    def varint(self):
        n = 0
        shift = 0
        while True:
            b = self.data[self.pos]
            self.pos += 1
            n |= (b & 0x7F) << shift
            if b < 0x80:
                return n
            shift += 7

    def string(self):
        n = self.varint()
        s = self.data[self.pos:self.pos + n].decode("utf8")
        self.pos += n
        return s

    def strings(self):
        return [self.string() for _ in range(self.varint())]

    def raw(self, n):
        b = self.data[self.pos:self.pos + n]
        self.pos += n
        return b


MODEL_MAGIC = b"MSBM"
DAY_MAGIC = b"MSBD"


def model_file(parts, meta):
    """A shipped model, gzipped:
        "MSBM", version, header (JSON: format, id, games trained on...),
        commands, dictionary strings, literal strings,
        field vocabularies (field key, dictionary ids),
        movepools (species, moves in the order asked),
        mixer weights (key, rows, inputs, weights),
        the table: fingerprints (gaps), node counts, nodes (gaps), stretches
    -- the table by column, so gzip finds each column's repeats."""
    out = bytearray(MODEL_MAGIC)
    out.append(VERSION)
    _string(out, json.dumps(dict(meta, hash_bits=HASH_BITS, step=STEP), separators=(",", ":"), sort_keys=True))
    for group in (parts["commands"], parts["strings"], parts["lits"]):
        _varint(out, len(group))
        for s in group:
            _string(out, s)
    _varint(out, len(parts["vocab"]))
    for key in sorted(parts["vocab"]):
        ids = parts["vocab"][key][0]
        _string(out, key)
        _varint(out, len(ids))
        for i in ids:
            _varint(out, i)
    _varint(out, len(parts["pools"]))
    for sp in sorted(parts["pools"]):
        _string(out, sp)
        moves = parts["pools"][sp]
        _varint(out, len(moves))
        for mv in moves:
            _string(out, mv)
    _varint(out, len(parts["weights"]))
    for key in sorted(parts["weights"]):
        rows = parts["weights"][key]
        _string(out, key)
        _varint(out, len(rows))
        _varint(out, len(rows[0]) if rows else 0)
        for row in rows:
            for w in row:
                _varint(out, _zigzag(w))
    table = parts["table"]
    fps = sorted(table)
    _varint(out, len(fps))
    prev = -1
    for f in fps:
        _varint(out, f - prev - 1)
        prev = f
    for f in fps:
        _varint(out, len(table[f]))
    values = bytearray()
    for f in fps:
        prev = 0
        for node in sorted(table[f]):
            _varint(out, node - prev)
            prev = node
            values.append((table[f][node] // STEP) & 0xFF)
    out += values
    return gzip.compress(bytes(out), compresslevel=9, mtime=0)


def read_model_file(blob):
    """(meta, frozen codec) from a model file."""
    data = gzip.decompress(blob)
    if data[:4] != MODEL_MAGIC or data[4] != VERSION:
        raise ValueError("not a version %d battle model" % VERSION)
    r = _Reader(data)
    r.pos = 5
    meta = json.loads(r.string())
    commands = r.strings()
    strings = r.strings()
    lits = r.strings()
    vocab = {}
    for _ in range(r.varint()):
        key = r.string()
        ids = [r.varint() for _ in range(r.varint())]
        vocab[key] = (ids, {i: j for j, i in enumerate(ids)})
    pools = {}
    for _ in range(r.varint()):
        sp = r.string()
        pools[sp] = [r.string() for _ in range(r.varint())]
    weights = {}
    for _ in range(r.varint()):
        key = r.string()
        rows, k = r.varint(), r.varint()
        weights[key] = [[_unzigzag(r.varint()) for _ in range(k)] for _ in range(rows)]
    n = r.varint()
    fps = []
    prev = -1
    for _ in range(n):
        prev += r.varint() + 1
        fps.append(prev)
    counts = [r.varint() for _ in range(n)]
    nodes = []
    for c in counts:
        prev = 0
        row = []
        for _ in range(c):
            prev += r.varint()
            row.append(prev)
        nodes.append(row)
    table = {}
    for f, row in zip(fps, nodes):
        cells = {}
        for node in row:
            q = data[r.pos]
            r.pos += 1
            cells[node] = (q - 256 if q > 127 else q) * STEP
        table[f] = cells
    d = Dictionary(commands, strings)
    return meta, frozen_codec(d, table, weights, pools, vocab, lits)


def day_file(model_id, matches, codes):
    """A day's battles: "MSBD", version, the model they were coded with, the
    revision of the app's day file they follow (row for row), then each
    game's length and bytes -- 0 bytes for one the phone must fetch instead."""
    out = bytearray(DAY_MAGIC)
    out.append(VERSION)
    _string(out, model_id)
    _string(out, matches)
    _varint(out, len(codes))
    for c in codes:
        _varint(out, len(c))
    for c in codes:
        out += c
    return bytes(out)


def read_day_file(blob):
    """(model id, day-file revision it follows, [bytes per game])."""
    if blob[:4] != DAY_MAGIC or blob[4] != VERSION:
        raise ValueError("not a version %d battle day file" % VERSION)
    r = _Reader(blob)
    r.pos = 5
    model_id = r.string()
    matches = r.string()
    lengths = [r.varint() for _ in range(r.varint())]
    return model_id, matches, [r.raw(n) for n in lengths]
