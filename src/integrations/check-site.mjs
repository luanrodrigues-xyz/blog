import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Parser } from 'htmlparser2';
import { checkExamples } from '../../scripts/examples.mjs';

const ORIGIN = 'https://luanrodrigues.xyz';
// Marcadores que nunca podem chegar a uma página publicada (rascunhos são noindex e só avisam).
const PLACEHOLDERS = ['RESULTADO_UI', 'CONFERENCIA', 'TODO:', 'FIXME'];
// Um diagrama (src/components/diagramas/) só é descrito a leitores de tela pelo aria-label do quadro role="img":
// uma frase com a conclusão. Menos que isto é vazio ou um rótulo solto, como "diagrama".
const MIN_DIAGRAM_LABEL = 20;

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
    rawMermaid: false,
    diagrams: 0,
    diagramsWithoutLabel: [],
    isArticle: false,
    figuresWithoutAlt: [],
    pendingFigures: [],
    emptyArticle: /class="[^"]*\barticle-body\b[^"]*"><\/div>/.test(text),
    markers: PLACEHOLDERS.filter((marker) => text.includes(marker)),
  };
  let diagram = null; // <figure class="diagrama"> aberto: procuramos o quadro role="img" com aria-label
  new Parser(
    {
      onopentag(tag, a) {
        if (tag === 'figure' && (a.class ?? '').split(/\s+/).includes('diagrama')) {
          page.diagrams += 1;
          diagram = { index: page.diagrams, label: '' };
        }
        if (diagram && a.role === 'img') diagram.label = (a['aria-label'] ?? '').trim();
        if (tag === 'img' && a.src?.startsWith('/figures/') && !(a.alt ?? '').trim())
          page.figuresWithoutAlt.push(a.src);
        if (tag === 'code' && (a.class ?? '').split(/\s+/).includes('language-mermaid')) page.rawMermaid = true;
        if (a.id) page.ids.add(a.id);
        if (tag === 'html') page.lang = a.lang;
        if (tag === 'meta' && a.property === 'og:type') page.isArticle = a.content === 'article';
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
      onclosetag(tag) {
        if (tag === 'figure' && diagram) {
          if (diagram.label.length < MIN_DIAGRAM_LABEL) page.diagramsWithoutLabel.push(diagram.index);
          diagram = null;
        }
      },
      oncomment(data) {
        if (data.includes('FIGURA PENDENTE')) page.pendingFigures.push(data.trim());
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
    for (const src of page.figuresWithoutAlt) errors.push(`${rel(path)}: figura ${src} sem texto alternativo (alt)`);
    if (page.emptyArticle)
      errors.push(`${rel(path)}: artigo sem conteúdo (falha ao processar o Markdown; veja o log do build)`);
    if (page.rawMermaid)
      errors.push(
        `${rel(path)}: bloco mermaid: Mermaid não é mais convertido; use um componente de src/components/diagramas/`,
      );
    for (const index of page.diagramsWithoutLabel) {
      const problem = `${rel(path)}: diagrama nº ${index} sem descrição acessível (role="img" com aria-label de uma frase)`;
      if (page.noindex) console.log(`AVISO ${problem}`);
      else errors.push(problem);
    }
    if (!page.noindex) {
      if (page.h1 !== 1) errors.push(`${rel(path)}: ${page.h1} h1 headings`);
      if (!page.canonical?.startsWith(`${ORIGIN}/`)) errors.push(`${rel(path)}: missing production canonical`);
      if (!['pt-BR', 'en'].includes(page.lang)) errors.push(`${rel(path)}: unsupported language ${page.lang}`);
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
    for (const marker of page.pendingFigures) {
      if (page.noindex) console.log(`AVISO ${rel(path)}: ${marker}`);
      else errors.push(`${rel(path)}: figura pendente em página publicada: ${marker.slice(0, 120)}`);
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
        console.log(`OK: ${pages} pages; ${urls} canonical URLs; local links, anchors and language alternates.`);
        // Artigo e pacote externo são mantidos à mão; avisa quando divergem (npm run conferir-exemplos).
        for (const { slug, missing } of checkExamples({ optional: true })) {
          console.log(`AVISO labs/<assunto>/${slug}: o artigo declara o que Sources/ não tem: ${missing.join('; ')}`);
        }
      },
    },
  };
}
