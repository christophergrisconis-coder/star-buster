#!/usr/bin/env python3
"""Assemble staged source chunks into their real paths."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# One-char MCP transcription fixes for pack 05 staging (applied before assemble).
PACK05_FIXES = [
    ("scripts/staging/assets/05/part_004.txt", "qeEuDp", "qeUuDp"),
    ("scripts/staging/assets/05/part_008.txt", "WgigqDAG", "WwigqDAG"),
    ("scripts/staging/assets/05/part_009.txt", "5113352", "5111352"),
]

def patch_pack05_staging() -> None:
    for rel, old, new in PACK05_FIXES:
        path = ROOT / rel
        if not path.exists():
            continue
        text = path.read_text()
        if old not in text:
            continue
        path.write_text(text.replace(old, new, 1))
        print(f"patched {rel}: {old} -> {new}")

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

patch_pack05_staging()

assemble("scripts/staging/play/part_*.txt", ROOT / "src/routes/play.$levelId.tsx")
assemble("scripts/staging/css/part_*.txt", ROOT / "src/styles/app.css")

for i in range(6):
    assemble_json(
        f"scripts/staging/assets/{i:02d}/part_*.txt",
        ROOT / f"scripts/anaclara-star-assets-{i:02d}.b64.json",
    )
