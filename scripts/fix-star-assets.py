#!/usr/bin/env python3
"""Repair star logo assets.

The alpha channel of public/stars/luma.png is the only clean cutout of the
1017x1024 Luma render, but it has a hole erased through the left eye. All
three big logos are the same render, pixel-registered:

- public/stars/luma.checkerboard-backup.png — heart, intact RGB, checkerboard
- public/luma-heart.png (JPEG)              — heart, intact RGB, checkerboard
- public/luma-star.png  (JPEG)              — no heart, intact RGB, checkerboard

So: repair the alpha by filling interior holes (transparency not connected to
the image border), then recombine it with the intact RGB sources:

1. public/stars/luma.png + public/luma-heart.png <- backup RGB + fixed alpha
2. public/luma-star.png <- its own JPEG RGB (no heart) + fixed alpha
3. public/stars/{gold,red,green,blue,purple,cyan,ingredient,nova}.png — the
   board tile art referenced by src/ui/starArt.ts. Regenerated from the clean
   256x256 red Luma in scripts/anaclara-star-assets-05.b64.json by replacing
   the hue per color. gold-heart.png is a 256px downscale of stars/luma.png.

Requires: macOS `sips` (JPEG -> PNG). Everything else is stdlib.
"""

from __future__ import annotations

import base64
import colorsys
import importlib.util
import json
import subprocess
import sys
import tempfile
from collections import deque
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ko", ROOT / "scripts" / "knockout-planets.py")
ko = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(ko)

# hue in degrees; lightness boost applied only to saturated (body) pixels
TILE_COLORS: dict[str, tuple[float, float]] = {
    "red": (0.0, 0.0),
    "gold": (48.0, 0.10),
    "green": (130.0, 0.0),
    "blue": (215.0, 0.0),
    "purple": (275.0, 0.0),
    "cyan": (187.0, 0.0),
    "ingredient": (28.0, 0.0),
    "nova": (300.0, 0.12),
}
SAT_FLOOR = 0.15  # leave eyes/highlights (low saturation) untouched


def recolor(width: int, height: int, pixels: list[int], hue_deg: float, boost: float) -> list[int]:
    out = pixels[:]
    hue = (hue_deg % 360.0) / 360.0
    for i in range(width * height):
        o = i * 4
        if out[o + 3] == 0:
            continue
        r, g, b = out[o] / 255, out[o + 1] / 255, out[o + 2] / 255
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        if s < SAT_FLOOR:
            continue
        l = l + (1.0 - l) * boost
        r, g, b = colorsys.hls_to_rgb(hue, l, s)
        out[o] = round(r * 255)
        out[o + 1] = round(g * 255)
        out[o + 2] = round(b * 255)
    return out


def fixed_alpha(width: int, height: int, pixels: list[int]) -> list[int]:
    """Alpha channel with interior holes (erased eye) forced back to opaque."""
    n = width * height
    outside = bytearray(n)
    queue: deque[int] = deque()

    def push(i: int) -> None:
        if outside[i] or pixels[i * 4 + 3] == 255:
            return
        outside[i] = 1
        queue.append(i)

    for x in range(width):
        push(x)
        push((height - 1) * width + x)
    for y in range(height):
        push(y * width)
        push(y * width + width - 1)
    while queue:
        i = queue.popleft()
        x, y = i % width, i // width
        if x > 0:
            push(i - 1)
        if x + 1 < width:
            push(i + 1)
        if y > 0:
            push(i - width)
        if y + 1 < height:
            push(i + width)

    alpha = [pixels[i * 4 + 3] for i in range(n)]
    for i in range(n):
        if alpha[i] < 255 and not outside[i]:
            alpha[i] = 255
    return alpha


def combine(width: int, height: int, rgb_src: list[int], alpha: list[int]) -> list[int]:
    out = rgb_src[:]
    for i in range(width * height):
        out[i * 4 + 3] = alpha[i]
        if alpha[i] == 0:
            out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 0
    return out


def jpeg_to_pixels(path: Path) -> tuple[int, int, list[int]]:
    with tempfile.NamedTemporaryFile(suffix=".png") as tmp:
        subprocess.run(
            ["sips", "-s", "format", "png", str(path), "--out", tmp.name],
            check=True,
            capture_output=True,
        )
        return ko.read_png(Path(tmp.name))


def main() -> None:
    stars_dir = ROOT / "public" / "stars"
    luma = stars_dir / "luma.png"
    lw, lh, lpx = ko.read_png(luma)
    alpha = fixed_alpha(lw, lh, lpx)

    # 1. heart version: backup RGB (intact eye + heart) + repaired alpha
    bw, bh, bpx = ko.read_png(stars_dir / "luma.checkerboard-backup.png")
    if (bw, bh) != (lw, lh):
        raise SystemExit(f"backup {bw}x{bh} does not match luma.png {lw}x{lh}")
    heart_px = combine(lw, lh, bpx, alpha)
    ko.write_png(luma, lw, lh, heart_px)
    ko.write_png(ROOT / "public" / "luma-heart.png", lw, lh, heart_px)
    print("rebuilt public/stars/luma.png + public/luma-heart.png")

    # 2. no-heart version: luma-star JPEG RGB + repaired alpha
    star_path = ROOT / "public" / "luma-star.png"
    sw, sh, spx = jpeg_to_pixels(star_path)
    if (sw, sh) != (lw, lh):
        raise SystemExit(f"luma-star.png {sw}x{sh} does not match luma.png {lw}x{lh}")
    ko.write_png(star_path, sw, sh, combine(sw, sh, spx, alpha))
    print("rebuilt public/luma-star.png")

    # 3. board tiles from the packed clean red Luma
    pack = json.loads((ROOT / "scripts" / "anaclara-star-assets-05.b64.json").read_text())
    red_bytes = base64.b64decode(pack["public/stars/red.png"])
    with tempfile.NamedTemporaryFile(suffix=".png") as tmp:
        Path(tmp.name).write_bytes(red_bytes)
        rw, rh, rpx = ko.read_png(Path(tmp.name))
    for name, (hue_deg, boost) in TILE_COLORS.items():
        out = stars_dir / f"{name}.png"
        ko.write_png(out, rw, rh, recolor(rw, rh, rpx, hue_deg, boost))
        print(f"wrote {out.relative_to(ROOT)}")

    # gold-heart: the heart Luma downscaled to tile size
    gold_heart = stars_dir / "gold-heart.png"
    ko.write_png(gold_heart, lw, lh, heart_px)
    subprocess.run(["sips", "-Z", "256", str(gold_heart)], check=True, capture_output=True)
    print(f"wrote {gold_heart.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
