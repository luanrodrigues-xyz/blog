import puppeteer from 'puppeteer';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const out = fs.mkdtempSync(path.join(tmpdir(), 'portfolio-review-'));
console.log(`Browser review artifacts: ${out}`);
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || puppeteer.executablePath(),
    // Containers that run as root need this; never set it on a desktop.
    args: process.env.CHROME_NO_SANDBOX ? ['--no-sandbox'] : [],
  });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (r) => (r.url().startsWith(origin) || r.url().startsWith('data:') ? r.continue() : r.abort()));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const routes = [
    '/',
    '/art/',
    '/games/',
    '/games/tessora/',
    '/games/deploy-ou-ruina/',
    '/shop/',
    '/about/',
    '/404.html',
  ];
  const results = [];
  for (const width of [320, 390, 1280]) {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    for (const route of routes) {
      await page.goto(origin + route, { waitUntil: 'load' });
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        h1: document.querySelectorAll('h1').length,
        smallTargets: [...document.querySelectorAll('main a.btn, .site-header nav a')]
          .filter((el) => el.getBoundingClientRect().height < 44)
          .map((el) => el.textContent.trim()),
      }));
      assert.equal(state.overflow, false, `${width} ${route}: page overflow`);
      assert.equal(state.h1, 1, `${width} ${route}: h1 count`);
      assert.deepEqual(state.smallTargets, [], `${width} ${route}: touch targets under 44px`);
      results.push({ width, route, ...state });
      if (width !== 390)
        await page.screenshot({ path: `${out}/${width}-${route.replaceAll('/', '_') || 'home'}.png`, fullPage: true });
    }
  }
  // Client navigation keeps the header in sync.
  await page.goto(origin + '/', { waitUntil: 'networkidle0' });
  await page.click('.site-header a[href="/games/"]');
  await page.waitForFunction(
    () =>
      location.pathname === '/games/' &&
      document.querySelector('.site-header a[aria-current="page"]')?.getAttribute('href') === '/games/',
  );
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    out + '/results.json',
    JSON.stringify({ browser: await browser.version(), results, errors }, null, 2),
  );
  console.log(
    JSON.stringify({ browser: await browser.version(), pagesChecked: results.length, screenshots: out, errors }),
  );
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
