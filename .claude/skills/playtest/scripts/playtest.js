#!/usr/bin/env node
// Load a page in headless Chromium, wait, screenshot it at several sizes, and report
// console errors. Exit code 1 if anything went wrong, so the result can't be missed.
//
//   node playtest.js <folder | file.html | http://localhost:5173>
//        [--wait 4000] [--sizes 390x844,1280x800] [--press Space,ArrowRight] [--out DIR]
//
// A folder or file is served from a throwaway local server (never file://).
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const target = argv.find((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
if (!target) {
  console.error('Usage: node playtest.js <folder | file.html | http://url> [--wait ms] [--sizes WxH,WxH] [--press Key,Key] [--out DIR]');
  process.exit(2);
}
const waitMs = Number(flag('wait', 4000));
const sizes = flag('sizes', '390x844,1280x800').split(',').map((s) => s.split('x').map(Number));
const keys = flag('press', '').split(',').filter(Boolean);
const outDir = flag('out', path.join(os.tmpdir(), `playtest-${Date.now()}`));
fs.mkdirSync(outDir, { recursive: true });

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2',
  '.wasm': 'application/wasm', '.ico': 'image/x-icon',
};

function serve(root) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let file;
      try {
        file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      } catch {
        return res.writeHead(400).end();
      }
      if (file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      fs.readFile(file, (err, data) => {
        if (err) return res.writeHead(404).end('not found');
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  let server;
  let url = target;
  if (!/^https?:\/\//.test(target)) {
    const full = path.resolve(target);
    if (!fs.existsSync(full)) {
      console.error(`Not found: ${full}`);
      process.exit(2);
    }
    const isFile = fs.statSync(full).isFile();
    server = await serve(isFile ? path.dirname(full) : full);
    url = `http://127.0.0.1:${server.address().port}/${isFile ? path.basename(full) : ''}`;
  }

  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  let failed = false;
  console.log(`Testing ${url}`);

  for (const [width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height } });
    const problems = [];
    page.on('console', (m) => m.type() === 'error' && problems.push(`console.error: ${m.text()}`));
    page.on('pageerror', (e) => problems.push(`uncaught exception: ${e.message}`));
    page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`));
    page.on('response', (r) => {
      if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) problems.push(`HTTP ${r.status()}: ${r.url()}`);
    });

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    } catch (e) {
      problems.push(`page failed to load: ${e.message}`);
    }
    await page.waitForTimeout(waitMs);
    for (const key of keys) await page.keyboard.press(key, { delay: 100 });
    if (keys.length) await page.waitForTimeout(500);

    const info = await page
      .evaluate(() => ({
        title: document.title,
        canvases: document.querySelectorAll('canvas').length,
        textChars: (document.body?.innerText || '').trim().length,
        images: document.images.length,
      }))
      .catch(() => null);
    if (info && !info.canvases && !info.textChars && !info.images) problems.push('page looks blank');

    const shot = path.join(outDir, `playtest-${width}x${height}.png`);
    await page.screenshot({ path: shot });
    console.log(`\n[${width}x${height}] title="${info?.title ?? '?'}" canvases=${info?.canvases ?? '?'} text=${info?.textChars ?? '?'} chars`);
    console.log(`  screenshot: ${shot}`);
    if (problems.length) {
      failed = true;
      for (const p of [...new Set(problems)]) console.log(`  PROBLEM ${p}`);
    } else {
      console.log('  no console errors');
    }
    await page.close();
  }

  await browser.close();
  if (server) server.close();
  console.log(failed ? '\nFAILED: fix the problems above.' : '\nOK: no problems found. Look at the screenshots before claiming it looks right.');
  process.exit(failed ? 1 : 0);
})();
