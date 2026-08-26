#!/usr/bin/env python3
"""Assemble staged source chunks into their real paths."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def assemble(src_glob: str, dest: Path) -> None:
    parts = sorted(ROOT.glob(src_glob))
    if not parts:
        print(f"skip {dest}: no parts for {src_glob}")
        return
    data = "".join(p.read_text() for p in parts)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(data)
    print(f"wrote {dest} ({len(data)} bytes) from {len(parts)} parts")

assemble("scripts/staging/play/part_*.txt", ROOT / "src/routes/play.$levelId.tsx")
assemble("scripts/staging/css/part_*.txt", ROOT / "src/styles/app.css")
