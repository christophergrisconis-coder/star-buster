#!/usr/bin/env python3
"""Assemble staged source chunks into their real paths."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def assemble(src_glob: str, dest: Path) -> bool:
    parts = sorted(ROOT.glob(src_glob))
    if not parts:
        print(f"skip {dest}: no parts for {src_glob}")
        return False
    data = "".join(p.read_text() for p in parts)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(data)
    print(f"wrote {dest} ({len(data)} bytes) from {len(parts)} parts")
    return True

def assemble_json(src_glob: str, dest: Path) -> bool:
    parts = sorted(ROOT.glob(src_glob))
    if not parts:
        print(f"skip {dest}: no parts for {src_glob}")
        return False
    data = "".join(p.read_text() for p in parts)
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError as e:
        print(f"skip {dest}: incomplete/invalid JSON ({e}) from {len(parts)} parts")
        return False
    if not isinstance(parsed, dict) or not parsed:
        print(f"skip {dest}: empty or non-object JSON")
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(data)
    print(f"wrote {dest} ({len(data)} bytes) from {len(parts)} parts, {len(parsed)} keys")
    return True

assemble("scripts/staging/play/part_*.txt", ROOT / "src/routes/play.$levelId.tsx")
assemble("scripts/staging/css/part_*.txt", ROOT / "src/styles/app.css")

for i in range(6):
    assemble_json(
        f"scripts/staging/assets/{i:02d}/part_*.txt",
        ROOT / f"scripts/anaclara-star-assets-{i:02d}.b64.json",
    )
