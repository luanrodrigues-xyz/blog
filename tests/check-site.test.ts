import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkSite } from '../src/integrations/check-site.mjs';

const ORIGIN = 'https://luanrodrigues.xyz';
const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

/** A minimal dist with one indexable page (the home) and the sitemap that lists it. */
function site(body: string, head = '') {
  const dist = mkdtempSync(join(tmpdir(), 'check-site-'));
  dirs.push(dist);
  mkdirSync(dist, { recursive: true });
  writeFileSync(
    join(dist, 'index.html'),
    `<!doctype html><html lang="en"><head><link rel="canonical" href="${ORIGIN}/">${head}</head><body><h1>Home</h1>${body}</body></html>`,
  );
  const listed = head.includes('noindex') ? '' : `<url><loc>${ORIGIN}/</loc></url>`;
  writeFileSync(join(dist, 'sitemap.xml'), `<urlset>${listed}</urlset>`);
  return dist;
}

describe('checkSite', () => {
  it('accepts a valid page', () => {
    expect(checkSite(site('<a href="#main">Skip</a><main id="main"></main>')).errors).toEqual([]);
  });

  it('rejects a broken local link and a missing anchor', () => {
    const { errors } = checkSite(site('<a href="/games/">Games</a><a href="#nowhere">Jump</a>'));
    expect(errors).toEqual(['index.html: missing /games/', 'index.html: missing anchor #nowhere']);
  });

  it('requires an alt attribute on every image, accepting an empty one for decoration', () => {
    const dist = site('<img src="/a.webp"><img src="/b.webp" alt="">');
    writeFileSync(join(dist, 'a.webp'), '');
    writeFileSync(join(dist, 'b.webp'), '');
    expect(checkSite(dist).errors).toEqual(['index.html: image /a.webp without alt attribute']);
  });

  it('rejects design placeholders that reach a published page', () => {
    expect(checkSite(site('<p>[YOUR PRICE]</p>')).errors).toEqual(['index.html: marcador [YOUR  em página publicada']);
  });

  it('only warns about placeholders on a noindex page', () => {
    expect(checkSite(site('<p>TODO: art</p>', '<meta name="robots" content="noindex">')).errors).toEqual([]);
  });

  it('requires exactly one h1', () => {
    const dist = site('<h1>Again</h1>');
    expect(checkSite(dist).errors).toEqual(['index.html: 2 h1 headings']);
  });
});
