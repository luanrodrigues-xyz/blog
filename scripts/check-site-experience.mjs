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
  });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (r) => (r.url().startsWith(origin) || r.url().startsWith('data:') ? r.continue() : r.abort()));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const routes = [
    '/',
    '/about/',
    '/articles/',
    '/articles/frontend/',
    '/articles/ios/',
    '/articles/backend/',
    '/articles/pt/ai-response-rendering-contract/',
    '/articles/pt/server-driven-ui-contract-boundary-pt/',
  ];
  const results = [];
  for (const width of [320, 390, 1280])
    for (const theme of ['light', 'dark']) {
      await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
      for (const route of routes) {
        await page.goto(origin + route, { waitUntil: 'load' });
        await page.waitForFunction(() => Boolean(document.documentElement.dataset.theme));
        const state = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          h1: document.querySelectorAll('h1').length,
          code: document.querySelectorAll('.code-example').length,
          copy: document.querySelectorAll('.copy-code').length,
          toc: document.querySelectorAll('.article-toc').length,
          langs: document.querySelector('.language-current')?.textContent,
        }));
        assert.equal(state.overflow, false, `${width} ${theme} ${route}: page overflow`);
        assert.equal(state.h1, 1, route);
        if (route.includes('/articles/pt/')) {
          assert.ok(state.toc);
          assert.ok(state.copy);
          await page.click('.article-toc summary');
          const toc = await page.evaluate(() =>
            [...document.querySelectorAll('.article-toc a')].every((a) => document.getElementById(a.hash.slice(1))),
          );
          assert.ok(toc, 'toc targets');
        }
        results.push({ width, theme, route, ...state });
        if (width !== 390)
          await page.screenshot({
            path: `${out}/${width}-${theme}-${route.replaceAll('/', '_') || 'home'}.png`,
            fullPage: !route.includes('/articles/pt/'),
          });
      }
    }
  // Real client navigation, active filters, copy success/failure and repeat initialization.
  await page.goto(origin + '/articles/', { waitUntil: 'networkidle0' });
  await page.click('.area-links a[href="/articles/frontend/"]');
  await page.waitForFunction(
    () =>
      location.pathname === '/articles/frontend/' &&
      document.querySelector('.area-links a[aria-current="page"]')?.getAttribute('href') === '/articles/frontend/',
  );
  await page.goto(origin + '/articles/pt/ai-response-rendering-contract/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    window.__copied = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__copied = text;
        },
      },
    });
  });
  const code = await page.$eval('.code-example code', (el) => el.textContent);
  await page.click('.copy-code');
  await page.waitForFunction(() => document.querySelector('.copy-status').textContent === 'Copied');
  assert.equal(await page.evaluate(() => window.__copied), code);
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw Error('denied');
    };
  });
  await page.click('.copy-code');
  await page.waitForFunction(() => document.querySelector('.copy-status').textContent === 'Could not copy');
  const count = await page.$$eval('.code-example', (els) => els.length);
  await page.evaluate(() => document.dispatchEvent(new Event('astro:page-load')));
  assert.equal(await page.$$eval('.code-example', (els) => els.length), count);
  // No-JS reader still gets headings, TOC, related links and the full code.
  const plain = await browser.newPage();
  await plain.setJavaScriptEnabled(false);
  await plain.goto(origin + '/articles/pt/ai-response-rendering-contract/', { waitUntil: 'domcontentloaded' });
  assert.ok(await plain.$('.article-toc a'));
  assert.ok(await plain.$('.article-body pre code'));
  assert.ok(await plain.$('.article-pager a'));
  await plain.close();
  await page.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.goto(origin + '/', { waitUntil: 'networkidle0' });
  assert.equal(await page.$eval('html', (el) => el.dataset.theme), 'light');
  await page.click('.theme-toggle');
  assert.equal(await page.$eval('html', (el) => el.dataset.theme), 'dark');
  assert.equal(
    (await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--canvas')))
      .trim()
      .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3'),
    '#000000',
  );
  assert.equal(
    (await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--apple-blue')))
      .trim()
      .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3'),
    '#0091ff',
  );
  await page.click('.site-header a[href="/articles/"]');
  await page.waitForFunction(
    () => location.pathname === '/articles/' && document.documentElement.dataset.theme === 'dark',
  );
  assert.equal(
    (await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--canvas')))
      .trim()
      .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3'),
    '#000000',
  );
  assert.equal(await page.$('.area-links a[href="/articles/backend/"]'), null);
  await page.reload({ waitUntil: 'networkidle0' });
  assert.equal(await page.$eval('html', (el) => el.dataset.theme), 'dark');
  await (
    await page.createCDPSession()
  ).send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: 'light' },
      { name: 'prefers-contrast', value: 'more' },
    ],
  });
  await page.evaluate(() => document.dispatchEvent(new Event('astro:page-load')));
  assert.equal(
    (await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--apple-blue')))
      .trim()
      .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3'),
    '#5cb8ff',
  );
  await page.click('.theme-toggle');
  assert.equal(
    (await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--canvas')))
      .trim()
      .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3'),
    '#ffffff',
  );
  assert.equal(
    (await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--apple-blue')))
      .trim()
      .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3'),
    '#1e6ef4',
  );
  await page.goto(origin + '/articles/pt/ai-response-rendering-contract/', { waitUntil: 'networkidle0' });
  // Desktop browsers without a share sheet fall back to copying the canonical URL.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__shared = text;
        },
      },
    });
  });
  await page.click('.share-article');
  await page.waitForFunction(() => document.querySelector('.share-status').textContent === 'Link copied');
  assert.equal(
    await page.evaluate(() => window.__shared),
    'https://luanrodrigues.xyz/articles/pt/ai-response-rendering-contract/',
  );
  await page.click('.share-article');
  await page.waitForFunction(() => document.querySelector('.share-status').textContent === 'Link copied');
  await page.click('.article-toc summary');
  await page.$eval('.article-toc', (el) => el.scrollIntoView());
  await page.screenshot({ path: out + '/320-light-toc.png' });
  await page.$eval('.code-example', (el) => el.scrollIntoView());
  await page.screenshot({ path: out + '/320-light-code.png' });
  await page.click('.theme-toggle');
  await page.$eval('.code-example', (el) => el.scrollIntoView());
  await page.screenshot({ path: out + '/320-dark-code.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    out + '/results.json',
    JSON.stringify(
      {
        browser: await browser.version(),
        results,
        checks: [
          'client navigation and active area',
          'copy success and failure',
          'idempotent initialization',
          'no-JS reading',
          'no page overflow',
          'manual theme persistence and client navigation',
          'manual high contrast palettes',
          'empty Backend hidden',
          'sharing copies the canonical link repeatedly',
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({ browser: await browser.version(), pagesChecked: results.length, screenshots: out, errors }),
  );
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
