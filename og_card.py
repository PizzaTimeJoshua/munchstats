"""Server-rendered Open Graph stat cards (1200x630 PNG) for link previews.

render_card() draws a card from a plain facts dict so it stays testable
without Flask. Fonts come from Pillow's bundled scalable default font --
no font files to ship, identical output on Windows dev and Heroku.
"""
import io
import unicodedata

from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1200, 630

# Same palette as the site's dark theme (cards are always dark).
BG = "#1e1e1e"
PANEL = "#252525"
PANEL_BORDER = "#444"
TEXT = "#e0e0e0"
TEXT_MUTED = "#aaa"
TEXT_DIM = "#888"
ACCENT = "#ffd54f"

TYPE_COLORS = {
    "Normal": "#a8a878", "Fire": "#f08030", "Water": "#6890f0",
    "Electric": "#f8d030", "Grass": "#78c850", "Ice": "#98d8d8",
    "Fighting": "#c03028", "Poison": "#a040a0", "Ground": "#e0c068",
    "Flying": "#a890f0", "Psychic": "#f85888", "Bug": "#a8b820",
    "Rock": "#b8a038", "Ghost": "#705898", "Dragon": "#7038f8",
    "Dark": "#705848", "Steel": "#b8b8d0", "Fairy": "#f0b6bc",
    "Stellar": "#40a0ff",
}

_fonts = {}
_icon_sheet = None


def icon_from_sheet(sheet_path, row, col):
    """PNG bytes of one 40x30 icon cropped from the local pokemonicons
    sheet (12 icons per row), or None for an empty cell. Fallback art for
    Pokemon without a Showdown gen5 sprite (e.g. Champions-only Megas)."""
    global _icon_sheet
    try:
        if _icon_sheet is None:
            _icon_sheet = Image.open(sheet_path).convert("RGBA")
        icon = _icon_sheet.crop((col * 40, row * 30, col * 40 + 40, row * 30 + 30))
        if icon.getbbox() is None:
            return None
        out = io.BytesIO()
        icon.save(out, "PNG")
        return out.getvalue()
    except Exception:
        return None


def _font(size):
    if size not in _fonts:
        _fonts[size] = ImageFont.load_default(size=size)
    return _fonts[size]


def _fit_text(draw, text, size, max_width, min_size=24):
    """Largest font <= size that fits text in max_width."""
    while size > min_size:
        f = _font(size)
        if draw.textlength(text, font=f) <= max_width:
            return f
        size -= 4
    return _font(min_size)


def _ellipsize(draw, text, font, max_width):
    """Trim text with a trailing ellipsis so it fits in max_width."""
    if draw.textlength(text, font=font) <= max_width:
        return text
    while text and draw.textlength(text + "…", font=font) > max_width:
        text = text[:-1]
    return text + "…"


def _pct(value):
    """'63.412' / 63.412 -> '63.4%'."""
    try:
        return f"{float(value):.1f}%"
    except (TypeError, ValueError):
        return "?"


def _ascii(text):
    """Transliterate to ASCII: Pillow's bundled default font has no glyphs
    outside ASCII, so 'Pokémon' would render a tofu box otherwise."""
    text = str(text).replace("—", "-")
    text = unicodedata.normalize("NFKD", text)
    return "".join(c if ord(c) < 128 or c == "·" else "" for c in text)


def render_card(facts):
    """facts keys: name, format_name, month, usage_percent, rank, total,
    types (list), moves ([(name, pct)]), item ((name, pct) or None),
    ability ((name, pct) or None), sprite_png (bytes or None).
    Everything except name is optional. Returns PNG bytes."""
    img = Image.new("RGB", (WIDTH, HEIGHT), BG)
    d = ImageDraw.Draw(img)

    # Accent bar + brand line
    d.rectangle([0, 0, WIDTH, 10], fill=ACCENT)
    d.text((48, 34), "MunchStats", font=_font(34), fill=ACCENT)
    sub = facts.get("format_name") or ""
    if facts.get("month"):
        sub = f"{sub}  ·  {facts['month']}" if sub else facts["month"]
    if sub:
        sub = _ellipsize(d, _ascii(sub), _font(26), WIDTH - 48 - 280)
        d.text((WIDTH - 48, 40), sub, font=_font(26), fill=TEXT_MUTED, anchor="ra")

    # Sprite panel on the left
    panel = (48, 120, 448, 520)
    d.rounded_rectangle(panel, radius=18, fill=PANEL, outline=PANEL_BORDER, width=2)
    sprite_png = facts.get("sprite_png")
    if sprite_png:
        try:
            sprite = Image.open(io.BytesIO(sprite_png)).convert("RGBA")
            scale = min(340 // sprite.width, 340 // sprite.height) or 1
            sprite = sprite.resize(
                (sprite.width * scale, sprite.height * scale), Image.NEAREST
            )
            cx = (panel[0] + panel[2] - sprite.width) // 2
            cy = (panel[1] + panel[3] - sprite.height) // 2
            img.paste(sprite, (cx, cy), sprite)
        except Exception:
            pass

    x = 500
    name = _ascii(facts.get("name", "?"))
    d.text((x, 130), name, font=_fit_text(d, name, 64, WIDTH - x - 48), fill="#fff")

    # Type badges
    bx, by = x, 220
    for t in facts.get("types") or []:
        f = _font(24)
        w = d.textlength(t, font=f)
        d.rounded_rectangle([bx, by, bx + w + 28, by + 40], radius=8,
                            fill=TYPE_COLORS.get(t, TEXT_DIM))
        d.text((bx + 14, by + 7), t, font=f, fill="#fff")
        bx += w + 42

    # Usage + rank
    usage = facts.get("usage_percent")
    if usage is not None:
        d.text((x, 292), _pct(usage), font=_font(72), fill=ACCENT)
        rank, total = facts.get("rank"), facts.get("total")
        line = "usage"
        if isinstance(rank, int):
            of = f" of {total}" if total else ""
            line += f"  ·  rank #{rank}{of}"
        if facts.get("win_rate"):
            line += f"  ·  {facts['win_rate']}% win rate"
        d.text((x, 380), line, font=_font(28), fill=TEXT_MUTED)

    # Top moves (left column) and item/ability (right column)
    col_y = 440
    moves = (facts.get("moves") or [])[:4]
    if moves:
        d.text((x, col_y), "TOP MOVES", font=_font(20), fill=TEXT_DIM)
        for i, (mv, pct) in enumerate(moves):
            row_y = col_y + 32 + i * 34
            d.text((x, row_y), _ascii(mv), font=_font(24), fill=TEXT)
            d.text((x + 300, row_y), _pct(pct), font=_font(24), fill=TEXT_MUTED)

    x2 = x + 400
    row2 = col_y
    for label, pair in (("TOP ITEM", facts.get("item")),
                        ("TOP ABILITY", facts.get("ability"))):
        if not pair:
            continue
        d.text((x2, row2), label, font=_font(20), fill=TEXT_DIM)
        line = f"{_ascii(pair[0])}  ({_pct(pair[1])})"
        f = _fit_text(d, line, 24, WIDTH - x2 - 48, 18)
        d.text((x2, row2 + 32), _ellipsize(d, line, f, WIDTH - x2 - 48), fill=TEXT)
        row2 += 76

    d.text((48, HEIGHT - 34), "munchstats.com",
           font=_font(22), fill=TEXT_DIM, anchor="ls")

    out = io.BytesIO()
    img.save(out, "PNG", optimize=True)
    return out.getvalue()
