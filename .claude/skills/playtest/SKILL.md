---
name: playtest
description: Run a website or browser game headless, screenshot it at phone and desktop sizes, and report console errors. Use before saying UI or game work is done, or when asked to playtest, screenshot or check the page.
---

Run the bundled script from the project root:

```
node .claude/skills/playtest/scripts/playtest.js <folder | file.html | http://localhost:PORT>
```

- A folder or HTML file is served from a temporary local server. For a dev server (Vite etc.), start it in the background and pass its URL.
- Options: `--wait 4000` (ms to let the page or game run), `--sizes 390x844,1280x800`, `--press Space,ArrowRight` (keys pressed before the final screenshot), `--out DIR`.
- Exit code 1 means a console error, failed request, uncaught exception or blank page. Fix the root cause and rerun.
- Open each screenshot path it prints with the Read tool and describe what is actually on screen. Do not report the UI as correct from the exit code alone.
- If Playwright is missing: `npm i -D playwright && npx playwright install chromium`.
- Screenshots go to the OS temp folder by default, so nothing lands in the repo.

You can't judge game feel (speed, difficulty, fun). Say what you verified and leave the feel to the human.
