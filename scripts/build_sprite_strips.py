"""Slice pokemonicons-sheet.png into strips for the mobile app.

The app draws an icon by rendering the whole sheet and clipping to one 40x30
tile -- the standard CSS-sprite trick. That breaks on a phone: the sheet is
4110 points tall, so at 3x device density the texture needs to be 12,330 pixels
tall, well past the 8192 limit most Android GPUs have. Over the limit the
texture is scaled down to fit, and every icon drawn from it is soft. It is also
why shipping a higher-resolution sheet changed nothing: the limit is on the
rendered texture, not the source file.

Strips of 24 tile rows are 720 points tall, which is 2160 pixels even at 3x --
inside the limit on every device, including the 4096 ones.

Each strip is written at 1x and again as @2x, a nearest-neighbour double. Pixel
art doubles exactly; interpolation would only invent detail that is not there.
Metro picks the density variant per device.

Usage:
    python scripts/build_sprite_strips.py ../munchstats-app/assets
"""

import os
import sys

from PIL import Image

SOURCE = os.path.join("static", "pokemonicons-sheet.png")
TILE_W, TILE_H = 40, 30
COLUMNS = 12
ROWS_PER_STRIP = 24
PREFIX = "pokemonicons"


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__.strip().splitlines()[-1])
    out_dir = sys.argv[1]
    if not os.path.isdir(out_dir):
        sys.exit("no such directory: %s" % out_dir)

    sheet = Image.open(SOURCE).convert("RGBA")
    width, height = sheet.size
    total_rows = height // TILE_H
    strips = (total_rows + ROWS_PER_STRIP - 1) // ROWS_PER_STRIP

    print("source %s  %dx%d  %d tile rows" % (SOURCE, width, height, total_rows))
    print("slicing into %d strips of <=%d rows\n" % (strips, ROWS_PER_STRIP))

    manifest = []
    strip_h = ROWS_PER_STRIP * TILE_H
    for i in range(strips):
        top = i * strip_h
        bottom = min(top + strip_h, height)
        # Every strip is padded to the full height. The app sizes them all
        # identically, and a short last strip stretched to that size would
        # distort the icons in it.
        strip = Image.new("RGBA", (width, strip_h), (0, 0, 0, 0))
        strip.paste(sheet.crop((0, top, width, bottom)), (0, 0))

        base = os.path.join(out_dir, "%s-%d.png" % (PREFIX, i))
        strip.save(base, optimize=True)
        doubled = strip.resize((strip.width * 2, strip.height * 2), Image.NEAREST)
        doubled.save(os.path.join(out_dir, "%s-%d@2x.png" % (PREFIX, i)),
                     optimize=True)

        manifest.append((i, strip.size, os.path.getsize(base)))
        print("  %s-%d.png  %dx%d  %5.0f KB   (+@2x %5.0f KB)"
              % (PREFIX, i, strip.width, strip.height,
                 os.path.getsize(base) / 1024,
                 os.path.getsize(os.path.join(out_dir, "%s-%d@2x.png" % (PREFIX, i)))
                 / 1024))

    tallest = max(s[1][1] for s in manifest)
    print("\ntallest strip %d pt -> %d px at 3x (limit 8192)"
          % (tallest, tallest * 3))
    print("columns %d, rows per strip %d -- keep src/ui/theme.ts in step"
          % (COLUMNS, ROWS_PER_STRIP))


if __name__ == "__main__":
    main()
