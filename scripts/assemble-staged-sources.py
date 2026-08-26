#!/usr/bin/env python3
"""Assemble staged source chunks into their real paths."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def list_parts(src_glob: str):
    parts = sorted(ROOT.glob(src_glob))
    three = [p for p in parts if p.stem.startswith("part_") and len(p.stem.split("_", 1)[-1]) == 3]
    if three:
        return sorted(three)
    return parts

def join_parts(src_glob: str):
    parts = list_parts(src_glob)
    if not parts:
        return None
    return "".join(p.read_text() for p in parts)

def assemble(src_glob: str, dest: Path, strip_newlines: bool = False) -> bool:
    data = join_parts(src_glob)
    if data is None:
        print(f"skip {dest}: no parts for {src_glob}")
        return False
    if strip_newlines:
        data = data.replace("\n", "")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(data)
    print(f"wrote {dest} ({len(data)} bytes)")
    return True

def assemble_json(src_glob: str, dest: Path) -> bool:
    data = join_parts(src_glob)
    if data is None:
        print(f"skip {dest}: no parts for {src_glob}")
        return False
    data = data.replace("\n", "")
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError as e:
        print(f"skip {dest}: incomplete/invalid JSON ({e})")
        return False
    if not isinstance(parsed, dict) or not parsed:
        print(f"skip {dest}: empty or non-object JSON")
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(data)
    print(f"wrote {dest} ({len(data)} bytes, {len(parsed)} keys)")
    return True

assemble("scripts/staging/play/part_*.txt", ROOT / "src/routes/play.$levelId.tsx")
assemble("scripts/staging/css/part_*.txt", ROOT / "src/styles/app.css")

for i in range(6):
    assemble_json(
        f"scripts/staging/assets/{i:02d}/part_*.txt",
        ROOT / f"scripts/anaclara-star-assets-{i:02d}.b64.json",
    )
