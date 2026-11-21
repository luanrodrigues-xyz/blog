import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Parser } from 'htmlparser2';

const ORIGIN = 'https://luanrodrigues.xyz';
// Marcadores que nunca podem chegar a uma página publicada (rascunhos são noindex e só avisam).
const PLACEHOLDERS = ['[YOUR ', 'TODO:', 'FIXME', 'lorem ipsum'];

function parse(path) {
  const text = readFileSync(path, 'utf8');
  const page = {
    ids: new Set(),
    links: [],
    alternates: [],
    h1: 0,
    canonical: null,
    noindex: false,
    lang: null,
    imagesWithoutAlt: [],
    markers: PLACEHOLDERS.filter((marker) => text.includes(marker)),
  };
  new Parser(
    {
      onopentag(tag, a) {
        // Every image is artwork here: decorative images must say so with alt="" explicitly.
        if (tag === 'img' && a.alt === undefined) page.imagesWithoutAlt.push(a.src);
        if (a.id) page.ids.add(a.id);
        if (tag === 'html') page.lang = a.lang;
        if (tag === 'h1') page.h1 += 1;
        if (tag === 'meta' && a.name === 'robots') page.noindex = (a.content ?? '').includes('noindex');
        if (tag === 'link' && a.rel === 'canonical') page.canonical = a.href;
        if (
          tag === 'link' &&
          a.rel === 'alternate' &&
          !['application/rss+xml', 'application/atom+xml'].includes(a.type)
        )
          page.alternates.push(a);
        // Redirecionamentos (meta refresh) também precisam apontar para uma página e âncora que existem.
        if (tag === 'meta' && (a['http-equiv'] ?? '').toLowerCase() === 'refresh') {
          const target = /url=\s*(\S+)/i.exec(a.content ?? '')?.[1];
          if (target) page.links.push(target);
        }
        if (['a', 'img', 'script', 'link'].includes(tag)) {
          const value = a.href || a.src;
          if (value) page.links.push(value);
        }
      },
    },
    { decodeEntities: true },
  ).end(text);
  return page;
}

const walk = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

/** Valida páginas, links locais, âncoras, alternates de idioma, CSS e sitemap; devolve a lista de erros. */
export function checkSite(dist) {
  const files = walk(dist);
  const pages = new Map(files.filter((file) => file.endsWith('.html')).map((file) => [file, parse(file)]));
  const rel = (path) => relative(dist, path);
  const errors = [];

  for (const [path, page] of pages) {
    for (const src of page.imagesWithoutAlt) errors.push(`${rel(path)}: image ${src} without alt attribute`);
    if (!page.noindex) {
      if (page.h1 !== 1) errors.push(`${rel(path)}: ${page.h1} h1 headings`);
      if (!page.canonical?.startsWith(`${ORIGIN}/`)) errors.push(`${rel(path)}: missing production canonical`);
      if (page.lang !== 'en') errors.push(`${rel(path)}: unsupported language ${page.lang}`);
      const route = rel(dirname(path));
      const expected = `${ORIGIN}/${route === '' ? '' : `${route}/`}`;
      if (page.canonical && page.canonical !== expected)
        errors.push(`${rel(path)}: canonical ${page.canonical} != ${expected}`);
    }
    for (const link of page.links) {
      let url;
      try {
        url = new URL(link, `${ORIGIN}/${rel(dirname(path))}/`);
      } catch {
        continue;
      }
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== ORIGIN) continue;
      // Um link só com âncora aponta para a própria página, não para a rota que a URL base sugere.
      let target = link.startsWith('#') ? path : join(dist, decodeURIComponent(url.pathname));
      if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
      target = resolve(target);
      if (!existsSync(target)) errors.push(`${rel(path)}: missing ${link}`);
      else if (url.hash && pages.has(target) && !pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))) {
        errors.push(`${rel(path)}: missing anchor ${link}`);
      }
    }
    for (const alternate of page.alternates) {
      const other = pages.get(resolve(dist, new URL(alternate.href).pathname.replace(/^\//, ''), 'index.html'));
      if (!other || other.lang !== alternate.hreflang) errors.push(`${rel(path)}: invalid language alternate`);
      else if (!other.alternates.some((item) => item.href === page.canonical))
        errors.push(`${rel(path)}: nonreciprocal language alternate`);
    }
    for (const marker of page.markers) {
      if (page.noindex) console.log(`AVISO ${rel(path)}: marcador ${marker} no texto`);
      else errors.push(`${rel(path)}: marcador ${marker} em página publicada`);
    }
  }

  // Recursos de CSS depois do bundle: import ou asset ausente derruba o build.
  for (const stylesheet of files.filter((file) => file.endsWith('.css'))) {
    const css = readFileSync(stylesheet, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const references = [
      ...css.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g),
      ...css.matchAll(/@import\s+['"]([^'"]+)['"]/g),
    ].map((match) => match[1]);
    for (const reference of references) {
      if (/^(?:[a-z]+:|\/\/|#)/i.test(reference)) continue;
      const path = reference.split(/[?#]/)[0];
      const target = path.startsWith('/') ? join(dist, path) : join(dirname(stylesheet), path);
      if (!existsSync(target)) errors.push(`${rel(stylesheet)}: missing CSS resource ${reference}`);
    }
  }

  let urls = [];
  try {
    urls = [...readFileSync(join(dist, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => match[1],
    );
    const expected = new Set([...pages.values()].filter((page) => !page.noindex).map((page) => page.canonical));
    if (urls.length !== new Set(urls).size || urls.length !== expected.size || urls.some((url) => !expected.has(url))) {
      errors.push('Sitemap does not match indexable pages');
    }
  } catch (error) {
    errors.push(`Sitemap: ${error.message}`);
  }
  return { errors, pages: pages.size, urls: urls.length };
}

export default function checkSiteIntegration() {
  return {
    name: 'check-site',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const { errors, pages, urls } = checkSite(fileURLToPath(dir));
        if (errors.length) throw new Error(`\n${errors.join('\n')}`);
        console.log(`OK: ${pages} pages; ${urls} canonical URLs; local links, anchors and image alt text.`);
      },
    },
  };
}
