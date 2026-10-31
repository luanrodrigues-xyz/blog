// Gera as capas (1200x630) a partir de src/config/covers.json: uma por artigo em
// src/assets/covers. As capas em SVG (src/covers/) saem também em <nome>-dark.png,
// com prefers-color-scheme: dark emulado. O preview padrão do site é um asset de marca
// independente em public/og-default.png. npm run covers
import puppeteer from 'puppeteer';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [WIDTH, HEIGHT] = [1200, 630];
const data = JSON.parse(readFileSync(join(ROOT, 'src/config/covers.json'), 'utf8'));
// Nomes opcionais: npm run covers -- swiftui swiftui-layout
const requested = new Set(process.argv.slice(2));
for (const file of requested) {
  if (!data.covers.some((spec) => spec.file === file)) throw new Error(`Capa desconhecida: ${file}`);
}

const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');

function coverSvg(spec, { title, subtitle } = {}) {
  // Capas no estilo editorial (skill capas) são um SVG completo; as antigas, um ícone sobre a cor.
  if (spec.svg) return readFileSync(join(ROOT, spec.svg), 'utf8');
  const iconSize = spec.iconSize ?? 300;
  const iconY = spec.iconY ?? 105;
  const text = title
    ? `<text x="72" y="500" fill="#fff" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="64" font-weight="700">${escape(title)}</text>` +
      `<text x="72" y="556" fill="#ffffffcc" font-family="ui-monospace,Menlo,monospace" font-size="30">${escape(subtitle)}</text>`
    : spec.brand === false
      ? ''
      : '<text x="72" y="566" fill="#ffffffcc" font-family="ui-monospace,Menlo,monospace" font-size="28">Swift Decodificado</text>';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">` +
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${data.tiles[spec.tile]}"/>` +
    `<g transform="translate(${(WIDTH - iconSize) / 2} ${iconY}) scale(${iconSize / 24})" fill="none" stroke="#fff" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${spec.glyph}</g>${text}</svg>`
  );
}

const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });
  const render = async (svg, path, scheme = 'light') => {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>html,body{margin:0}</style>${svg}`);
    mkdirSync(dirname(path), { recursive: true });
    await page.screenshot({ path, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    console.log(path.replace(`${ROOT}/`, ''));
  };
  for (const spec of data.covers.filter((spec) => requested.size === 0 || requested.has(spec.file))) {
    await render(coverSvg(spec), join(ROOT, 'src/assets/covers', `${spec.file}.png`));
    if (spec.svg) await render(coverSvg(spec), join(ROOT, 'src/assets/covers', `${spec.file}-dark.png`), 'dark');
  }
} finally {
  await browser.close();
}
