# Claude full-potential kit (copy-paste templates)

Everything here is free to use. Snippets marked [Anthropic] are quoted from Anthropic's
own docs (platform.claude.com prompting guides, code.claude.com best-practices).
Anthropic wrote those for system prompts; putting them in CLAUDE.md is my adaptation.

---------------------------------------------------------------------------
## 1. CLAUDE.md for a website  (save as CLAUDE.md in the repo root, keep < 200 lines)

```markdown
# Project
Static website: plain HTML/CSS/JS, hosted on GitHub Pages. (edit me)

# Commands
- Preview: `python3 -m http.server 8000` (never test via file://)
- UI check: screenshot at 390px and 1280px wide and read console errors before saying done

# Rules
- Run a real check that exercises the change before reporting it done. Show the evidence
  (screenshot, console output, test output).
- Only do what was asked. Do not add features, tests, files, docs or refactors that
  weren't requested; mention them at the end instead.
- Never put API keys or secrets in client-side code. Keep .env in .gitignore.
- If you create temporary scripts or files, delete them at the end of the task.

# Compaction
When compacting, preserve the list of modified files, open TODOs and how to run the project.

# Design
<frontend_aesthetics>   [Anthropic, abridged; full version in the prompting best-practices guide]
You tend to converge toward generic, "on distribution" outputs. In frontend design, this
creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive
frontends that surprise and delight.
- Typography: choose beautiful, unique, interesting fonts. Avoid generic fonts like Arial and Inter.
- Color & Theme: commit to a cohesive aesthetic. Use CSS variables. Dominant colors with
  sharp accents outperform timid, evenly-distributed palettes.
- Motion: prefer CSS-only animation. One well-orchestrated page load with staggered reveals
  beats scattered micro-interactions.
- Backgrounds: create atmosphere and depth (layered gradients, geometric patterns) rather
  than solid colors.
Avoid: overused fonts (Inter, Roboto, Arial, system fonts), purple gradients on white,
predictable layouts, cookie-cutter design. Vary between light and dark themes and fonts.
</frontend_aesthetics>
```

---------------------------------------------------------------------------
## 2. CLAUDE.md for a browser game  (edit the Project and Commands lines to match your setup)

```markdown
# Project
2D browser game, Phaser 4 + TypeScript + Vite. (edit me)
Phaser 4 only. Most of my training data is Phaser 3, so check the API before using it.
The Phaser repo has a `skills/` folder of agent skills (github.com/phaserjs/phaser).

# Commands
- Dev: `npm run dev`   Build: `npm run build`   Test: `npm test`   (edit me)

# Rules
- Build in playable milestones. Every milestone must run end to end before the next starts.
- Game logic (score, collisions, state, spawning) lives in pure functions with unit tests.
  Rendering stays thin.
- After each change: run tests, load the game headless, wait ~5 seconds, take a screenshot,
  and report console errors. Zero console errors is the bar.
- I playtest game feel. Do not claim the game "feels good"; report what you verified.
- Scope control: do not add features I didn't ask for. Suggest them at the end instead.
- Assets: use only CC0 or assets I have approved (Kenney.nl is CC0). Record each asset's
  source and license in ASSETS.md.

# Compaction
When compacting, preserve modified files, the current milestone, and test commands.
```

---------------------------------------------------------------------------
## 3. Optional token saver: .claude/settings.json

Stops reads of junk folders and secrets. Remove the node_modules line if you want
Claude to read library source or typings.

```json
{
  "permissions": {
    "deny": [
      "Read(node_modules/**)",
      "Read(dist/**)",
      "Read(./.env)",
      "Read(./.env.*)"
    ]
  }
}
```
Strict JSON: no comments, no trailing commas. Run `/status` afterwards to confirm it loaded.

---------------------------------------------------------------------------
## 4. Prompts

### Start any non-trivial build (interview, then spec)   [Anthropic]
```
I want to build [brief description]. Interview me in detail using the AskUserQuestion tool.

Ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs. Don't ask
obvious questions, dig into the hard parts I might not have considered.

Keep interviewing until we've covered everything, then write a complete spec to SPEC.md.
```
Then `/clear` (or start a fresh session) and say: "Implement SPEC.md milestone 1."

### Verification wording
```
Implement X. Define how you'll verify it first. Run the check, then show me the output or
a screenshot. If the check fails, fix the root cause; don't suppress the error.
```

### Keep scope tight   [Anthropic, Sonnet 5.5 guide]
```
When the work the user asked for is done and checked, stop and report. Don't add features,
tests, files, docs or refactors that weren't asked for. If you think one would help,
mention it at the end instead of doing it.
```

### Stop "reported done but never ran it"   [Anthropic, Sonnet 5.5 guide]
```
When you change code that can be run, built, or type-checked, run a real check that
exercises the change before reporting it done: the project's tests, type-checker, or build,
or the changed command itself. A syntax-only check, or a check command that failed to
start, does not count; if all that is missing is the project's declared dependencies,
install them with its own package manager and lockfile (e.g. npm install, pip install -r requirements.txt), never via sudo
or the system package manager, unless told not to. Only if no real check can run here, say
which one you did not run and why instead of reporting the change as done.
```

### Ideas first, no building   [Anthropic, Sonnet 5.5 guide]
```
When the user asks for ideas, options or a plan, give them that and stop. Don't start
building or changing anything until they say to go ahead.
```

---------------------------------------------------------------------------
## 5. Session habits (all from code.claude.com docs)

- Start each session on the model you want, since a mid-session switch costs one uncached turn:
  `/model sonnet` for everyday work. `/model opusplan` plans on Opus and builds on Sonnet.
- `/clear` between unrelated tasks. `/rename` first if you want to find it later.
- Corrected the same thing twice? `/clear` and rewrite the prompt with what you learned.
- `/context` shows what is eating the window. `/usage` shows where plan usage goes
  (press `f` to apply its fixes). `/status` shows the account and login method in use.
- `/btw` for a side question that should not stay in context. `/rewind` to abandon a path.
- Shift+Tab cycles into plan mode: use it for multi-file or uncertain work, skip it for a
  one-sentence diff.
- Avoid unless you mean to pay: `/fast`, `/usage-credits`, `/model fable`, and a set
  ANTHROPIC_API_KEY (run `unset ANTHROPIC_API_KEY`, then check `/status`).

---------------------------------------------------------------------------
## 6. Pre-launch security check (sites with logins, payments or a database)
- No secrets in frontend code or git history; rotate anything that leaked
- Server-side auth on every API route
- Test with two accounts: neither can read the other's data
- Confirm every package Claude added actually exists and is the intended one
- Debug mode off in production
