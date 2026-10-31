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

/** Um dist mínimo com uma página indexável (a home) e o sitemap que a lista. */
function site(body: string, head = '') {
  const dist = mkdtempSync(join(tmpdir(), 'check-site-'));
  dirs.push(dist);
  mkdirSync(dist, { recursive: true });
  writeFileSync(
    join(dist, 'index.html'),
    `<!doctype html><html lang="pt-BR"><head><link rel="canonical" href="${ORIGIN}/">${head}</head><body><h1>Início</h1>${body}</body></html>`,
  );
  // Uma página noindex não entra no sitemap.
  const listed = head.includes('noindex') ? '' : `<url><loc>${ORIGIN}/</loc></url>`;
  writeFileSync(join(dist, 'sitemap.xml'), `<urlset>${listed}</urlset>`);
  return dist;
}

const diagram = (label?: string) =>
  `<figure class="diagrama"><div class="rolagem"><div class="quadro" role="img"${
    label === undefined ? '' : ` aria-label="${label}"`
  }>…</div></div><figcaption>legenda</figcaption></figure>`;

describe('checkSite: diagramas', () => {
  it('aceita um diagrama descrito por uma frase', () => {
    const { errors } = checkSite(
      site(diagram('O chamador propõe 240 pontos e a linha responde com a medida que ocupa.')),
    );
    expect(errors).toEqual([]);
  });

  it('recusa um diagrama sem aria-label', () => {
    const { errors } = checkSite(site(diagram()));
    expect(errors).toEqual([expect.stringMatching(/diagrama nº 1 sem descrição acessível/)]);
  });

  it('recusa um rótulo curto demais para ser uma conclusão', () => {
    const { errors } = checkSite(site(diagram('diagrama')));
    expect(errors).toHaveLength(1);
  });

  it('numera cada diagrama sem descrição da página', () => {
    const boa = diagram('Antes, o Café aparece expandido; depois de inverter, ele acompanha o id.');
    const { errors } = checkSite(site(boa + diagram() + boa + diagram('')));
    expect(errors.map((e) => e.match(/nº (\d+)/)?.[1])).toEqual(['2', '4']);
  });

  it('só avisa, sem erro, numa página noindex (rascunho)', () => {
    const { errors } = checkSite(site(diagram(), '<meta name="robots" content="noindex">'));
    expect(errors).toEqual([]);
  });
});

describe('checkSite: Mermaid', () => {
  it('recusa um bloco mermaid que chegou à página publicada', () => {
    const { errors } = checkSite(site('<pre><code class="language-mermaid">flowchart LR</code></pre>'));
    expect(errors).toEqual([expect.stringMatching(/Mermaid não é mais convertido/)]);
  });
});

describe('checkSite: feed discovery', () => {
  it('checks the feed link without treating it as a language alternate', () => {
    const dist = site('', '<link rel="alternate" type="application/rss+xml" href="/rss.xml">');
    writeFileSync(join(dist, 'rss.xml'), '<rss version="2.0"><channel /></rss>');
    expect(checkSite(dist).errors).toEqual([]);
    rmSync(join(dist, 'rss.xml'));
    expect(checkSite(dist).errors).toContain('index.html: missing /rss.xml');
  });
});
