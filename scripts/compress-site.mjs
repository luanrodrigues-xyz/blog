import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

/** GitLab Pages negotiates these sidecar files through Accept-Encoding. */
export async function compressSite(directory) {
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) {
      count += await compressSite(file);
    } else if (entry.isFile() && /\.(?:html?|css|js|mjs|json|xml|txt|svg)$/.test(entry.name)) {
      const input = await readFile(file);
      const variants = [
        ['br', brotliCompressSync(input, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } })],
        ['gz', gzipSync(input, { level: 9 })],
      ];
      for (const [extension, compressed] of variants) {
        if (compressed.length < input.length) {
          await writeFile(`${file}.${extension}`, compressed);
          count++;
        }
      }
    }
  }
  return count;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const count = await compressSite(resolve(process.argv[2] ?? 'dist'));
  console.log(`Created ${count} Brotli/gzip assets for static hosting.`);
}
