#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PLUGIN_SKILLS_DIR="plugins/work-splitter/skills"

for skill in slash-work-planner work-planner needs-solution-designer work-splitter; do
  src="skills/$skill"
  dest="$PLUGIN_SKILLS_DIR/$skill"

  if [[ ! -d "$src" ]]; then
    printf 'ERROR: missing source skill: %s\n' "$src" >&2
    exit 1
  fi

  mkdir -p "$dest"
  cp -R "$src"/. "$dest"/
done

printf 'Plugin skill copies synced.\n'
