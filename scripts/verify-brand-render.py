"""
Pixel-level verification of the rendered brand mark.

I cannot view images directly, so instead of "looking", this measures the
rendered PNGs: it isolates the letter inside the tile, checks that the counter
is actually open (i.e. the shape reads as an A and not a solid blob), reports
glyph coverage per size, and verifies left/right optical symmetry.

Usage:  python scripts/verify-brand-render.py
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PREVIEW = ROOT / "docs" / "brand" / "preview"


def load(name: str) -> Image.Image:
    return Image.open(PREVIEW / name).convert("RGB")


def is_glyph(px: tuple[int, int, int]) -> bool:
    """The letter is near-white; the tile is a saturated indigo/cyan."""
    r, g, b = px
    return r > 205 and g > 205 and b > 205


def analyse_icon(img: Image.Image, x0: int, y0: int, size: int) -> dict:
    glyph = []
    for y in range(y0, y0 + size):
        for x in range(x0, x0 + size):
            if is_glyph(img.getpixel((x, y))):
                glyph.append((x, y))

    if not glyph:
        return {"ok": False, "reason": "no glyph pixels found"}

    xs = [p[0] for p in glyph]
    ys = [p[1] for p in glyph]
    gx0, gx1 = min(xs), max(xs)
    gy0, gy1 = min(ys), max(ys)

    # Horizontal runs per row inside the glyph bounding box: two runs on a row
    # means the counter is open at that height.
    open_rows = 0
    rows = 0
    for y in range(gy0, gy1 + 1):
        runs = 0
        prev = False
        for x in range(gx0, gx1 + 1):
            cur = is_glyph(img.getpixel((x, y)))
            if cur and not prev:
                runs += 1
            prev = cur
        if runs:
            rows += 1
        if runs >= 2:
            open_rows += 1

    return {
        "ok": True,
        "coverage": len(glyph) / (size * size),
        "bbox": (gx0 - x0, gy0 - y0, gx1 - x0, gy1 - y0),
        "left_margin": gx0 - x0,
        "right_margin": (x0 + size - 1) - gx1,
        "open_rows": open_rows,
        "open_ratio": open_rows / rows if rows else 0.0,
    }


def main() -> int:
    failures = []

    print("=" * 72)
    print("MARK AT SIZE — glyph coverage, centring and counter openness")
    print("=" * 72)

    # mark-sizes-dark.png: 7 sizes, flex row with 26px gaps, 34px padding,
    # each cell = 128px tall slot + 10px gap + 11px label.
    img = load("mark-sizes-dark.png")
    sizes = [16, 24, 32, 48, 64, 96, 128]
    # Locate each icon by scanning columns for saturated (tile) pixels.
    width = img.width

    def col_has_tile(x: int) -> bool:
        for y in range(0, img.height):
            r, g, b = img.getpixel((x, y))
            if b > 120 and b > r + 25 and g < b:
                return True
        return False

    spans = []
    run_start = None
    for x in range(width):
        hit = col_has_tile(x)
        if hit and run_start is None:
            run_start = x
        elif not hit and run_start is not None:
            if x - run_start > 8:
                spans.append((run_start, x - 1))
            run_start = None
    if run_start is not None:
        spans.append((run_start, width - 1))

    print(f"detected {len(spans)} icon columns (expected {len(sizes)})")
    if len(spans) != len(sizes):
        failures.append(f"detected {len(spans)} icons, expected {len(sizes)}")

    for (start, end), size in zip(spans, sizes):
        width_px = end - start + 1
        # Vertical extent of the tile in this column band.
        y_top, y_bot = None, None
        for y in range(img.height):
            row_hit = any(
                col_has_tile_pixel(img, x, y) for x in range(start, end + 1, max(1, width_px // 6))
            )
            if row_hit and y_top is None:
                y_top = y
            if row_hit:
                y_bot = y
        if y_top is None:
            continue
        result = analyse_icon(img, start, y_top, min(width_px, y_bot - y_top + 1))
        if not result["ok"]:
            failures.append(f"{size}px: {result['reason']}")
            continue
        print(
            f"{size:>4}px  tile={width_px:>3}px  glyph coverage={result['coverage'] * 100:5.1f}%  "
            f"bbox={result['bbox']}  margins L/R={result['left_margin']}/{result['right_margin']}  "
            f"open counter rows={result['open_ratio'] * 100:5.1f}%"
        )
        if abs(result["left_margin"] - result["right_margin"]) > 1:
            failures.append(
                f"{size}px: glyph is off-centre (L={result['left_margin']} R={result['right_margin']})"
            )
        if size >= 24 and result["open_ratio"] < 0.15:
            failures.append(f"{size}px: counter is closed ({result['open_ratio'] * 100:.0f}% open rows)")

    print()
    print("=" * 72)
    print("16px FAVICON — does it survive the tab strip?")
    print("=" * 72)
    strip = load("favicon-strip.png")
    hits = [
        (x, y)
        for x in range(strip.width)
        for y in range(strip.height)
        if is_glyph(strip.getpixel((x, y)))
    ]
    if not hits:
        failures.append("favicon stripe: glyph not visible at 16px")
    else:
        xs = [h[0] for h in hits]
        # First icon in the strip sits near x=22.
        local = [h for h in hits if h[0] < 45]
        if local:
            lx = [h[0] for h in local]
            ly = [h[1] for h in local]
            print(
                f"16px glyph: {len(local)} lit px, bbox x={min(lx)}..{max(lx)} y={min(ly)}..{max(ly)}"
            )
            if len(local) < 18:
                failures.append(f"favicon glyph too thin at 16px ({len(local)} lit px)")

    print()
    print("=" * 72)
    if failures:
        print(f"FAIL ({len(failures)})")
        for f in failures:
            print("  ✗", f)
        return 1
    print("PASS — mark is centred, the counter opens above 24px, the 16px tab icon holds.")
    return 0


def col_has_tile_pixel(img: Image.Image, x: int, y: int) -> bool:
    r, g, b = img.getpixel((x, y))
    return b > 120 and b > r + 25 and g < b


if __name__ == "__main__":
    sys.exit(main())
