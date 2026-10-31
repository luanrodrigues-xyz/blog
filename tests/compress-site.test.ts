import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { compressSite } from '../scripts/compress-site.mjs';

describe('precompressed static assets', () => {
  it('keeps originals, compresses nested text, and skips images and existing sidecars', async () => {
    const root = await mkdtemp(join(tmpdir(), 'compressed-site-'));
    await mkdir(join(root, '_astro'));
    const source = '<html><body>Article content</body></html>'.repeat(100);
    await writeFile(join(root, 'index.html'), source);
    await writeFile(join(root, '_astro/site.css'), '.article { color: black; }'.repeat(100));
    await writeFile(join(root, 'cover.webp'), 'already compressed image');
    expect(await compressSite(root)).toBe(4);
    expect((await readFile(join(root, 'index.html'))).toString()).toBe(source);
    expect(brotliDecompressSync(await readFile(join(root, 'index.html.br'))).toString()).toBe(source);
    expect(gunzipSync(await readFile(join(root, 'index.html.gz'))).toString()).toBe(source);
    expect(await compressSite(root)).toBe(4);
    expect((await readdir(root)).sort()).toEqual([
      '_astro',
      'cover.webp',
      'index.html',
      'index.html.br',
      'index.html.gz',
    ]);
  });
});
