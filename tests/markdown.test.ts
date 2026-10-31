import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { markdownToHtml } from 'satteri';
import { callouts } from '../src/markdown/callouts';
import { highlightCode } from '../src/markdown/code';
import { headingIds } from '../src/markdown/headings';
import { unpublishedLinks } from '../src/markdown/unpublished-links';

const html = async (source: string, hastPlugins: any[]) => (await markdownToHtml(source, { hastPlugins })).html;

describe('callouts', () => {
  it('turns a labelled blockquote into an aside of that kind', async () => {
    for (const [label, kind] of [
      ['Nota', 'note'],
      ['Note', 'note'],
      ['Importante', 'important'],
      ['Important', 'important'],
      ['Atenção', 'warning'],
      ['Warning', 'warning'],
      ['Para executar', 'run'],
      ['To run', 'run'],
    ]) {
      const result = await html(`> **${label}**\n>\n> texto`, [callouts]);
      expect(result).toContain(`callout-${kind}`);
      expect(result).toContain(`<p class="callout-title">${label}</p>`);
      expect(result).not.toContain('<blockquote>');
    }
  });

  it('keeps a nested blockquote inside the aside', async () => {
    const result = await html('> **Nota**\n>\n> x\n>\n> > y\n>\n> z', [callouts]);
    expect(result.indexOf('<p>z</p>')).toBeLessThan(result.indexOf('</aside>'));
    expect(result.match(/<blockquote>/g)).toHaveLength(1);
    expect(result.match(/<\/blockquote>/g)).toHaveLength(1);
    expect(result.indexOf('<p>y</p>')).toBeLessThan(result.indexOf('</aside>'));
  });

  it('preserves an ordinary quotation', async () => {
    expect(await html('> citação', [callouts])).toContain('<blockquote>');
  });
});

describe('heading ids', () => {
  it('drops accents and numbers repeated headings', async () => {
    const result = await html('## Variáveis e constantes\n\n## Variáveis e constantes\n\n## O que é?', [headingIds]);
    expect(result).toContain('id="variaveis-e-constantes"');
    expect(result).toContain('id="variaveis-e-constantes-1"');
    expect(result).toContain('id="o-que-e"');
  });
});

describe('code highlighting', () => {
  it('colors Swift at build time and leaves unknown languages alone', async () => {
    const swift = await html('```swift\nlet a = 1\n```', [highlightCode]);
    expect(swift).toContain('<span class="xc-keyword">let</span>');
    expect(swift).toContain('data-highlighted="yes"');
    expect(await html('```json\n{"a": 1}\n```', [highlightCode])).toContain('hljs-');
    expect(await html('```mermaid-ish\nx\n```', [highlightCode])).not.toContain('hljs');
  });

  it('separates project names from system names, like Xcode', async () => {
    const result = await html(
      '```swift\nstruct Conta { var saldo = 0 }\nfunc depositar() {}\n```\n\n```swift fragment\nlet c = Conta()\nprint(c.saldo, c.description)\ndepositar()\nlet n: Int = 1\n```',
      [highlightCode],
    );
    expect(result).toContain('<span class="xc-decl-type">Conta</span>');
    expect(result).toContain('<span class="xc-decl-other">depositar</span>');
    expect(result).toContain('<span class="xc-type">Conta</span>()');
    expect(result).toContain('<span class="xc-function-system">print</span>');
    expect(result).toContain('<span class="xc-variable">saldo</span>');
    expect(result).toContain('<span class="xc-variable-system">description</span>');
    expect(result).toContain('<span class="xc-function">depositar</span>()');
    expect(result).toContain('<span class="xc-type-system">Int</span>');
  });

  it('keeps string interpolation as code and argument labels plain', async () => {
    const result = await html('```swift\nlet total = 1\nmostrar(total: total, "\\(total)")\n```', [highlightCode]);
    expect(result).toContain('(total: <span class="xc-variable">total</span>');
    expect(result).toContain('\\(<span class="xc-variable">total</span>)');
  });
});

describe('unpublished links', () => {
  let fixture: string;
  let published: string;
  let source: string;

  beforeAll(() => {
    mkdirSync('contents/notebook', { recursive: true });
    fixture = mkdtempSync('contents/notebook/test-');
    published = `${basename(fixture).toLowerCase()}-published`;
    const draft = `${published}-draft`;
    for (const [slug, isDraft] of [
      [published, false],
      [draft, true],
    ] as const) {
      const dir = join(fixture, slug);
      mkdirSync(dir);
      writeFileSync(join(dir, 'index.mdx'), `---\ntitle: Fixture\ndraft: ${isDraft}\nlanguage: "pt-BR"\n---\n`);
    }
    source = `[ok](/articles/pt/${published}/) e [rascunho](/articles/pt/${draft}/) e [ausente](/articles/pt/nao-existe-ainda/#x) e [fora](https://exemplo.com/articles/pt/x/) e [ingles](/articles/nao-existe-em-ingles/)`;
  });

  afterAll(() => {
    if (fixture) rmSync(fixture, { recursive: true, force: true });
  });

  it('keeps links to published articles and unlinks unpublished ones in production', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const out = await html(source, [unpublishedLinks]);
      expect(out).toContain(`<a href="/articles/pt/${published}/">ok</a>`);
      expect(out).toContain('<span class="unpublished-link">rascunho</span>');
      expect(out).toContain('<span class="unpublished-link">ausente</span>');
      expect(out).toContain('<span class="unpublished-link">ingles</span>');
      expect(out).toContain('href="https://exemplo.com/articles/pt/x/"');
    } finally {
      process.env.NODE_ENV = previous;
    }
  });

  it('leaves every link alone outside production', async () => {
    expect(await html(source, [unpublishedLinks])).toContain('<a href="/articles/pt/nao-existe-ainda/#x">');
  });
});
