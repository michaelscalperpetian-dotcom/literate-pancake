# Project
(Not chosen yet. Replace this block with: what it is, the stack, how to run it, how to check it.)

# Rules
- Before reporting code done, run a real check that exercises the change: the tests, type-checker or build, or the changed command itself. Show the output. If no real check can run, say which one you skipped and why.
- For anything visual or any game, run `/playtest` and describe what the screenshots actually show.
- Do only what was asked. Don't add features, tests, files, docs or refactors that weren't requested; mention them at the end instead.
- When asked for ideas, options or a plan, give that and stop. Don't build until told to.
- Never put API keys or secrets in client-side code or commit `.env`. Keep `.env`, `node_modules/` and `dist/` in `.gitignore`.
- Delete any temporary scripts or files you create before finishing.
- Never read a file you haven't opened before answering questions about it.

# Verification
- `.claude/hooks/verify.sh` runs when you finish a turn: the project's `npm test`, else `npm run build`, else pytest. If it blocks, fix the root cause; never weaken or skip the check.
- To pick the check yourself, put one shell line in `.claude/verify-command`. An empty file turns the hook off.

# Compaction
When compacting, preserve the list of modified files, open TODOs, the current milestone and how to run and check the project.

# UI design
Avoid the generic "AI" look. Pick distinctive fonts (not Arial, Inter, Roboto or system fonts), commit to one cohesive palette with CSS variables and sharp accents (no purple gradient on white), use layered backgrounds instead of flat color, and prefer CSS-only motion with one well-staged page load. Vary themes between projects.
