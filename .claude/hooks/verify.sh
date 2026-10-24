#!/bin/bash
# Stop hook: before Claude ends a turn, run the project's own check. If it fails, exit 2
# so Claude is sent back to fix it (stderr is what Claude reads).
# Does nothing when there is no check to run, or when nothing changed since the last pass.
#
# Which check runs (first match wins):
#   1. .claude/verify-command   one shell line, e.g. "npm test && npm run build"
#                               (empty file = turn this hook off for the project)
#   2. package.json "test" script, else its "build" script
#   3. pytest, if the project has a tests/ folder or pytest.ini
#
# After MAX_BLOCKS failed attempts in a row the hook lets Claude stop, so a check that
# can't be fixed doesn't burn tokens in a loop. (Claude Code's own cap is 8 in a row.)
MAX_BLOCKS=3

INPUT=$(cat)
cd "${CLAUDE_PROJECT_DIR:-$PWD}" || exit 0

SESSION=$(printf '%s' "$INPUT" \
  | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
  | head -n 1 | tr -cd 'A-Za-z0-9_-')
STATE="${TMPDIR:-/tmp}/claude-verify-${SESSION:-default}"

pkg_script() {
  [ -f package.json ] && command -v node >/dev/null 2>&1 \
    && node -p "(require('./package.json').scripts||{})['$1']||''" 2>/dev/null
}

CMD=""
if [ -f .claude/verify-command ]; then
  CMD=$(cat .claude/verify-command)
else
  TEST=$(pkg_script test)
  case "$TEST" in *"no test specified"*) TEST="" ;; esac
  if [ -n "$TEST" ]; then
    CMD="npm test"
  elif [ -n "$(pkg_script build)" ]; then
    CMD="npm run build"
  elif { [ -d tests ] || [ -f pytest.ini ]; } && python3 -m pytest --version >/dev/null 2>&1; then
    CMD="python3 -m pytest -q"
  fi
fi
[ -z "$CMD" ] && exit 0

# Skip if no project file changed since the last passing run (e.g. a question-only turn).
if [ -f "$STATE.pass" ]; then
  CHANGED=$(find . \( -name .git -o -name node_modules -o -name dist -o -name build \
    -o -name coverage -o -name __pycache__ -o -name .pytest_cache -o -name .vite \) -prune \
    -o -type f -newer "$STATE.pass" -print -quit 2>/dev/null)
  [ -z "$CHANGED" ] && exit 0
fi

RUN=""
command -v timeout >/dev/null 2>&1 && RUN="timeout 240"
OUT=$(CI=true $RUN bash -c "$CMD" 2>&1)
STATUS=$?

if [ "$STATUS" -eq 0 ]; then
  touch "$STATE.pass"   # stamped after the check, so files the check writes don't count as changes
  rm -f "$STATE.fails"
  exit 0
fi

FAILS=0
if [ -f "$STATE.fails" ] && [ -z "$(find "$STATE.fails" -mmin +10 2>/dev/null)" ]; then
  FAILS=$(cat "$STATE.fails")
fi
FAILS=$((FAILS + 1))
echo "$FAILS" > "$STATE.fails"
[ "$FAILS" -gt "$MAX_BLOCKS" ] && exit 0

{
  echo "Verification failed: $CMD (exit $STATUS, attempt $FAILS of $MAX_BLOCKS)."
  echo "Fix the root cause. Do not weaken, skip or delete the check."
  echo "--- last 60 lines of output ---"
  printf '%s\n' "$OUT" | tail -n 60
} >&2
exit 2
