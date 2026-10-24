# literate-pancake

Project not chosen yet. The Claude Code setup is already in place:

- `CLAUDE.md`: standing rules (verify before "done", keep scope tight, UI design guidance)
- `.claude/settings.json`: deny rules for junk folders and `.env`, plus the Stop hook
- `.claude/hooks/verify.sh`: runs the project's tests or build before Claude finishes a turn
- `.claude/skills/playtest/`: headless screenshots and console-error check for sites and games
