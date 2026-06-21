#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

if [[ -n "${PYTHON:-}" ]]; then
  PYTHON_CMD=("$PYTHON")
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD=(python3)
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD=(python)
elif command -v py >/dev/null 2>&1; then
  PYTHON_CMD=(py -3)
else
  fail "python3, python, or py is required for json validation"
fi

"${PYTHON_CMD[@]}" -m json.tool plugins/work-splitter/.codex-plugin/plugin.json >/dev/null

cmp -s SKILL.md skills/666/SKILL.md \
  || fail "root SKILL.md must match skills/666/SKILL.md"

cmp -s agents/openai.yaml skills/666/agents/openai.yaml \
  || fail "root agents/openai.yaml must match skills/666/agents/openai.yaml"

for skill in slash-work-planner work-planner needs-solution-designer work-splitter; do
  cmp -s "skills/$skill/SKILL.md" "plugins/work-splitter/skills/$skill/SKILL.md" \
    || fail "plugin copy for $skill/SKILL.md is out of sync; run scripts/sync-plugin-skills.sh"

  cmp -s "skills/$skill/agents/openai.yaml" "plugins/work-splitter/skills/$skill/agents/openai.yaml" \
    || fail "plugin copy for $skill/agents/openai.yaml is out of sync; run scripts/sync-plugin-skills.sh"
done

maintainer_path_pattern="/Users"/"/buyu"

if grep -R -n "$maintainer_path_pattern" \
  -- AGENTS.md README.md SKILL.md agents plugins rules skills scripts .github; then
  fail "public repository files should not contain maintainer-local absolute paths"
fi

printf 'Consistency checks passed.\n'
