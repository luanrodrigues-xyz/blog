import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';

export const prerender = true;

// As capas moram em src/assets/covers (o Astro otimiza as versões usadas nas páginas). Esta rota
// mantém as URLs públicas de sempre, /covers/<arquivo>, com o arquivo original.
const directory = join(process.cwd(), 'src/assets/covers');
const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

export function getStaticPaths() {
  return readdirSync(directory)
    .filter((file) => extname(file) in TYPES)
    .map((file) => ({ params: { file } }));
}

export function GET({ params }: { params: { file: string } }) {
  return new Response(readFileSync(join(directory, params.file)), {
    headers: { 'Content-Type': TYPES[extname(params.file)] },
  });
}
