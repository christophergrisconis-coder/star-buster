#!/usr/bin/env python3
"""Flood-fill near-black backgrounds out of voyage planet PNGs."""

from __future__ import annotations

import struct
import zlib
from collections import deque
from pathlib import Path

SIG = b"\x89PNG\r\n\x1a\n"


def read_png(path: Path) -> tuple[int, int, list[int]]:
    data = path.read_bytes()
    if data[:8] != SIG:
        raise ValueError(f"not a png: {path}")
    width = height = 0
    color_type = bit_depth = 0
    idat = bytearray()
    off = 8
    while off < len(data):
        length = struct.unpack(">I", data[off : off + 4])[0]
        kind = data[off + 4 : off + 8]
        chunk = data[off + 8 : off + 8 + length]
        off += 12 + length
        if kind == b"IHDR":
            width, height, bit_depth, color_type, *_ = struct.unpack(">IIBBBBB", chunk)
        elif kind == b"IDAT":
            idat.extend(chunk)
        elif kind == b"IEND":
            break
    if bit_depth != 8 or color_type not in (2, 6):
        raise ValueError(f"unsupported png {path}: depth={bit_depth} type={color_type}")
    raw = zlib.decompress(bytes(idat))
    bpp = 3 if color_type == 2 else 4
    stride = width * bpp
    rows: list[bytearray] = []
    i = 0
    prev = bytearray(stride)
    for _ in range(height):
        ftype = raw[i]
        scan = bytearray(raw[i + 1 : i + 1 + stride])
        i += 1 + stride
        if ftype == 1:
            for x in range(bpp, stride):
                scan[x] = (scan[x] + scan[x - bpp]) & 255
        elif ftype == 2:
            for x in range(stride):
                scan[x] = (scan[x] + prev[x]) & 255
        elif ftype == 3:
            for x in range(stride):
                left = scan[x - bpp] if x >= bpp else 0
                scan[x] = (scan[x] + ((left + prev[x]) // 2)) & 255
        elif ftype == 4:
            for x in range(stride):
                a = scan[x - bpp] if x >= bpp else 0
                b = prev[x]
                c = prev[x - bpp] if x >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if pa <= pb and pa <= pc else b if pb <= pc else c
                scan[x] = (scan[x] + pr) & 255
        elif ftype != 0:
            raise ValueError(f"filter {ftype}")
        rows.append(scan)
        prev = scan
    pixels = [0] * (width * height * 4)
    for y, row in enumerate(rows):
        for x in range(width):
            o = (y * width + x) * 4
            s = x * bpp
            pixels[o] = row[s]
            pixels[o + 1] = row[s + 1]
            pixels[o + 2] = row[s + 2]
            pixels[o + 3] = 255 if bpp == 3 else row[s + 3]
    return width, height, pixels


def write_png(path: Path, width: int, height: int, pixels: list[int]) -> None:
    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)
        start = y * stride
        raw.extend(pixels[start : start + stride])
    compressed = zlib.compress(bytes(raw), 9)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)

    def chunk(kind: bytes, body: bytes) -> bytes:
        crc = zlib.crc32(kind)
        crc = zlib.crc32(body, crc) & 0xFFFFFFFF
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", crc)

    path.write_bytes(SIG + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b""))


def is_space(r: int, g: int, b: int, a: int) -> bool:
    if a < 8:
        return True
    return max(r, g, b) <= 5 and (r + g + b) <= 8


def knockout(width: int, height: int, pixels: list[int]) -> None:
    n = width * height
    mark = bytearray(n)
    q: deque[int] = deque()

    def push(i: int) -> None:
        o = i * 4
        if mark[i] or not is_space(pixels[o], pixels[o + 1], pixels[o + 2], pixels[o + 3]):
            return
        mark[i] = 1
        q.append(i)

    for x in range(width):
        push(x)
        push((height - 1) * width + x)
    for y in range(height):
        push(y * width)
        push(y * width + width - 1)

    while q:
        i = q.popleft()
        x, y = i % width, i // width
        if x > 0:
            push(i - 1)
        if x + 1 < width:
            push(i + 1)
        if y > 0:
            push(i - width)
        if y + 1 < height:
            push(i + width)

    for i, flagged in enumerate(mark):
        if not flagged:
            continue
        o = i * 4
        r, g, b = pixels[o], pixels[o + 1], pixels[o + 2]
        lum = (r + g + b) / 3
        pixels[o + 3] = 0 if lum <= 10 else int(max(0, min(255, (lum - 10) * 10)))


def erode(width: int, height: int, pixels: list[int], radius: int) -> None:
    n = width * height
    edge = bytearray(n)
    for i in range(n):
        if pixels[i * 4 + 3] > 0:
            continue
        x, y = i % width, i // width
        for dy in range(-radius, radius + 1):
            yy = y + dy
            if yy < 0 or yy >= height:
                continue
            span = int((radius * radius - dy * dy) ** 0.5)
            for dx in range(-span, span + 1):
                xx = x + dx
                if 0 <= xx < width:
                    edge[yy * width + xx] = 1
    for i, flagged in enumerate(edge):
        if flagged:
            pixels[i * 4 + 3] = 0


def main() -> None:
    root = Path("public/voyage/planets")
    for path in sorted(root.glob("*.png")):
        w, h, px = read_png(path)
        knockout(w, h, px)
        write_png(path, w, h, px)
        print(f"knocked out {path.name} ({w}x{h})")


if __name__ == "__main__":
    main()
