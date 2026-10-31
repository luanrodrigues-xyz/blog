import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createArticle } from '../scripts/new-article.mjs';
import { publishArticle, unpublishArticle } from '../scripts/publish-article.mjs';
import { checkExamples, createExample, declarations, resolveExamplesRoot } from '../scripts/examples.mjs';
import { checkSite } from '../src/integrations/check-site.mjs';

const write = (path: string, text: string) => {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, text);
};

describe('new-article', () => {
  it('scaffolds a draft with the next reading order, counting drafts', () => {
    const root = mkdtempSync(join(tmpdir(), 'site-'));
    write(join(root, 'src/config/topics.json'), '{"topics": [{"slug": "Fundamentals"}]}');
    const first = createArticle({ slug: 'um', topic: 'Fundamentals', title: 'Um "teste"', root });
    const second = createArticle({ slug: 'dois', topic: 'Fundamentals', title: 'Dois', root });
    expect(readFileSync(first, 'utf8')).toContain('title: "Um \\"teste\\""');
    expect(readFileSync(second, 'utf8')).toContain('readingOrder: 2');
    expect(readFileSync(second, 'utf8')).toContain('draft: true');
    expect(first).toContain('/contents/notebook/Fundamentals/um/');
    expect(() => createArticle({ slug: 'um', topic: 'Fundamentals', title: 'Repetido', root })).toThrow(/já existe/);
    // O slug é a URL (/articles/<slug>/): não pode repetir nem em outro assunto.
    write(join(root, 'src/config/topics.json'), '{"topics": [{"slug": "Fundamentals"}, {"slug": "swiftui"}]}');
    expect(() => createArticle({ slug: 'um', topic: 'swiftui', title: 'Repetido', root })).toThrow(/já existe/);
    expect(() => createArticle({ slug: 'tres', topic: 'inexistente', title: 'Três', root })).toThrow(
      /Assunto desconhecido/,
    );
  });
});

describe('check-site', () => {
  const page = (route: string, body: string, head = '') =>
    `<!doctype html><html lang="pt-BR"><head>` +
    `<link rel="canonical" href="https://luanrodrigues.xyz/${route}">${head}</head><body>${body}</body></html>`;

  it('accepts a consistent site and reports broken links and sitemap drift', () => {
    const dist = mkdtempSync(join(tmpdir(), 'dist-'));
    write(join(dist, 'index.html'), page('', '<h1>Início</h1><a href="/ok/">ok</a>'));
    write(
      join(dist, 'ok/index.html'),
      page(
        'ok/',
        '<h1 id="a">Ok</h1><a href="/#nada">âncora</a><a href="/sumiu/">x</a>',
        '<meta property="og:type" content="article">',
      ),
    );
    write(join(dist, 'antigo/index.html'), '<!doctype html><meta http-equiv="refresh" content="0;url=/some/#x">');
    write(join(dist, 'vazio/index.html'), page('vazio/', '<h1>Vazio</h1><div class="prose article-body"></div>'));
    write(join(dist, 'sitemap.xml'), '<urlset><url><loc>https://luanrodrigues.xyz/</loc></url></urlset>');
    const { errors } = checkSite(dist);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('ok/index.html: missing /sumiu/'),
        expect.stringContaining('ok/index.html: missing anchor /#nada'),
        expect.stringContaining('antigo/index.html: missing /some/#x'),
        expect.stringContaining('vazio/index.html: artigo sem conteúdo'),
        'Sitemap does not match indexable pages',
      ]),
    );
  });
});

describe('publish and unpublish', () => {
  it('flips draft in place, inside notebook/<assunto>/', () => {
    const root = mkdtempSync(join(tmpdir(), 'site-'));
    write(join(root, 'contents/notebook/Fundamentals/um/index.md'), '---\ntitle: "Um"\ndraft: true\n---\n');
    const published = publishArticle({ slug: 'um', root });
    expect(published).toContain('contents/notebook/Fundamentals/um');
    expect(readFileSync(join(published, 'index.md'), 'utf8')).toContain('draft: false');
    expect(() => publishArticle({ slug: 'um', root })).toThrow(/draft: true/);
    expect(() => publishArticle({ slug: 'sumiu', root })).toThrow(/não existe/);

    const back = unpublishArticle({ slug: 'um', root });
    expect(back).toContain('contents/notebook/Fundamentals/um');
    expect(readFileSync(join(back, 'index.md'), 'utf8')).toContain('draft: true');
  });

  it('dates the article on the day it is published', () => {
    const root = mkdtempSync(join(tmpdir(), 'site-'));
    write(
      join(root, 'contents/notebook/Fundamentals/tres/index.md'),
      '---\ntitle: "Três"\ndate: "2026-01-06"\ndraft: true\n---\n',
    );
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const text = readFileSync(join(publishArticle({ slug: 'tres', root }), 'index.md'), 'utf8');
    expect(text).toContain(`date: "${today}"`);
  });

  it('adds draft: true when the front matter has none', () => {
    const root = mkdtempSync(join(tmpdir(), 'site-'));
    write(join(root, 'contents/notebook/Fundamentals/dois/index.md'), '---\ntitle: "Dois"\n---\n');
    const target = unpublishArticle({ slug: 'dois', root });
    expect(readFileSync(join(target, 'index.md'), 'utf8')).toContain('draft: true');
  });

  it('refuses to publish an article that is not a draft', () => {
    const root = mkdtempSync(join(tmpdir(), 'site-'));
    write(join(root, 'contents/notebook/Fundamentals/tres/index.md'), '---\ntitle: "Três"\ndraft: false\n---\n');
    expect(() => publishArticle({ slug: 'tres', root })).toThrow(/draft: true/);
  });
});

describe('examples', () => {
  const site = () => {
    const root = mkdtempSync(join(tmpdir(), 'site-'));
    write(
      join(root, 'contents/notebook/Fundamentals/funcoes-em-swift/index.md'),
      '---\ntitle: "Funções"\nlanguage: "pt-BR"\n---\n\n```swift\nfunc double(_ x: Int) -> Int {\n    x * 2\n}\nprint(double(2)) // 4\n```\n',
    );
    write(join(root, '.gitignore'), 'node_modules/\n/examples/\n');
    return root;
  };

  it('loads the local labs path, lets the environment override it and rejects paths inside the site', () => {
    const root = site();
    const labs = mkdtempSync(join(tmpdir(), 'labs-'));
    expect(resolveExamplesRoot(root, {})).toBeUndefined();
    write(join(root, '.env.local'), `EXAMPLES_ROOT="${labs}"\n`);
    expect(resolveExamplesRoot(root, {})).toBe(labs);
    expect(resolveExamplesRoot(root, { EXAMPLES_ROOT: `${labs}/other` })).toBe(`${labs}/other`);
    expect(() => resolveExamplesRoot(root, { EXAMPLES_ROOT: './examples' })).toThrow(/fora do projeto/);
    expect(() => resolveExamplesRoot(root, { EXAMPLES_ROOT: root })).toThrow(/fora do projeto/);
  });

  it('requires labs for commands but permits a site build without them', () => {
    const root = site();
    expect(() => createExample({ slug: 'funcoes-em-swift', name: 'Functions', root, examplesRoot: '' })).toThrow(
      /Configure EXAMPLES_ROOT/,
    );
    expect(() => checkExamples({ root, examplesRoot: '' })).toThrow(/Configure EXAMPLES_ROOT/);
    expect(checkExamples({ root, examplesRoot: '', optional: true })).toEqual([]);
    const absent = join(root, '..', 'missing-labs', root.split('/').pop()!);
    expect(() => checkExamples({ root, examplesRoot: absent })).toThrow(/não encontrado/);
    expect(checkExamples({ root, examplesRoot: absent, optional: true })).toEqual([]);
    expect(existsSync(join(root, 'examples'))).toBe(false);
  });

  it('compares declarations without modifiers, braces or spacing', () => {
    expect(
      declarations('@objc private func add() {\n// func commentedOut()\nlet x = 1\n  static func f( a : Int )->Int {'),
    ).toEqual(['func add()', 'func f(a:Int)->Int']);
  });

  it('scaffolds a package and reports what the article declares but Sources lacks', () => {
    const root = site();
    const examplesRoot = mkdtempSync(join(tmpdir(), 'labs-'));
    expect(() => createExample({ slug: 'funcoes-em-swift', root, examplesRoot })).toThrow(/--module/);
    expect(() => createExample({ slug: 'funcoes-em-swift', name: 'funcoes', root, examplesRoot })).toThrow(
      /UpperCamelCase/,
    );
    const target = createExample({ slug: 'funcoes-em-swift', name: 'Functions', root, examplesRoot });
    // O exemplo fica no mesmo assunto do artigo, e o LEIA-ME aponta para essa pasta.
    expect(target).toBe(join(examplesRoot, 'Fundamentals/funcoes-em-swift'));
    expect(readFileSync(join(target, 'LEIA-ME.md'), 'utf8')).toContain('cd Fundamentals/funcoes-em-swift');
    expect(readFileSync(join(target, 'Package.swift'), 'utf8')).toContain('.testTarget(name: "FunctionsTests"');
    expect(readFileSync(join(target, 'LEIA-ME.md'), 'utf8')).toContain('/articles/pt/funcoes-em-swift/');
    expect(() => createExample({ slug: 'funcoes-em-swift', name: 'Functions', root, examplesRoot })).toThrow(
      /já existe/,
    );
    expect(() => createExample({ slug: 'Slug Errado', name: 'Functions', root, examplesRoot })).toThrow(
      /Slug inválido/,
    );
    expect(() => createExample({ slug: 'ainda-sem-artigo', name: 'PendingArticle', root, examplesRoot })).toThrow(
      /--assunto/,
    );
    const early = createExample({
      slug: 'ainda-sem-artigo',
      name: 'PendingArticle',
      topic: 'swiftui',
      root,
      examplesRoot,
    });
    expect(early).toBe(join(examplesRoot, 'swiftui/ainda-sem-artigo'));
    expect(readFileSync(join(early, 'LEIA-ME.md'), 'utf8')).toMatch(/^# ainda-sem-artigo/);
    expect(checkExamples({ root, examplesRoot })).toEqual([
      { slug: 'funcoes-em-swift', missing: ['func double(_ x:Int)->Int'] },
    ]);
    write(join(target, 'Sources/Functions/Double.swift'), 'public func double(_ x: Int) -> Int { x * 2 }\n');
    expect(checkExamples({ root, examplesRoot })).toEqual([]);
  });

  it('reads an .mdx article and also checks .swift files at the root of the example (Xcode target)', () => {
    const root = mkdtempSync(join(tmpdir(), 'site-'));
    const examplesRoot = mkdtempSync(join(tmpdir(), 'labs-'));
    write(
      join(root, 'contents/notebook/swiftui/observacao/index.mdx'),
      '---\ntitle: "Observação"\n---\n\n' +
        '```swift fragment\nstruct Model {\n    var title = ""\n}\n```\n\n' +
        '```swift fragment\nstruct Screen: View {\n    var body: some View { Text("") }\n}\n```\n',
    );
    write(join(root, '.gitignore'), 'node_modules/\n/examples/\n');
    const target = createExample({ slug: 'observacao', name: 'Observation', root, examplesRoot });
    write(join(target, 'Sources/Observation/Model.swift'), 'struct Model {\n    var title = ""\n}\n');
    write(join(target, 'Screen.swift'), 'struct Screen: View {\n    var body: some View { Text("") }\n}\n');
    expect(checkExamples({ root, examplesRoot })).toEqual([]);
  });

  it('also finds test functions shown in the article in Tests/ and in Xcode test targets', () => {
    const root = mkdtempSync(join(tmpdir(), 'site-'));
    const examplesRoot = mkdtempSync(join(tmpdir(), 'labs-'));
    write(
      join(root, 'contents/notebook/arquitetura/contratos/index.mdx'),
      '---\ntitle: "Contratos"\n---\n\n' +
        '```swift fragment\n@Test func validBatch() throws {\n}\n```\n\n' +
        '```swift fragment\n@MainActor\nfunc testScreen() {\n}\n```\n',
    );
    const target = createExample({ slug: 'contratos', name: 'Contracts', root, examplesRoot });
    expect(checkExamples({ root, examplesRoot })).toEqual([
      { slug: 'contratos', missing: ['func validBatch()throws', 'func testScreen()'] },
    ]);
    write(join(target, 'Tests/ContractsTests/ContractsTests.swift'), '@Test func validBatch() throws {\n}\n');
    write(join(target, 'AppUITests/ScreenUITests.swift'), '@MainActor\nfunc testScreen() {\n}\n');
    expect(checkExamples({ root, examplesRoot })).toEqual([]);
  });
});

describe('localized article scripts', () => {
  it('creates English drafts inside the locale folder', () => {
    const root = mkdtempSync(join(tmpdir(), 'localized-site-'));
    write(join(root, 'src/config/topics.json'), '{"topics": [{"slug": "architecture"}]}');
    const file = createArticle({ slug: 'contract', topic: 'architecture', title: 'Contract', root });
    expect(file).toContain('/contract/en/index.md');
  });

  it('publishes only the selected language of a bundle', () => {
    const root = mkdtempSync(join(tmpdir(), 'localized-site-'));
    const bundle = join(root, 'contents/notebook/architecture/contract');
    write(join(bundle, 'en/index.mdx'), '---\nlanguage: "en"\ndraft: true\n---\n');
    write(join(bundle, 'pt-br/index.mdx'), '---\nlanguage: "pt-BR"\ndraft: true\n---\n');
    publishArticle({ slug: 'contract', root, language: 'pt-BR' });
    expect(readFileSync(join(bundle, 'pt-br/index.mdx'), 'utf8')).toContain('draft: false');
    expect(readFileSync(join(bundle, 'en/index.mdx'), 'utf8')).toContain('draft: true');
    expect(() => publishArticle({ slug: 'contract', root, language: 'en' })).not.toThrow();
  });
});
