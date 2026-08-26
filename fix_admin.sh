#!/bin/bash
sed -i '' -e 's/export const LIFE_MAX = 5/export const LIFE_MAX = 5\n\nexport function getMaxLives() {\n  if (typeof window === '"'undefined'") return 5;\n  try {\n    const raw = localStorage.getItem('"'"'star-buster-owner'"'"');\n    if (raw && JSON.parse(raw).role === '"'"'co-admin'"'"') return 7;\n  } catch {}\n  return 5;\n}/' src/data/gifts.ts
