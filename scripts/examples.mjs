// Pacotes Swift com o código e os testes de cada artigo, em EXAMPLES_ROOT/<assunto>/<slug>/ (a mesma
// organização de contents/notebook/<assunto>/<slug>/).
// O autor escreve o código e os testes; este script só cria o esqueleto, roda os testes,
// confere se o artigo e o pacote declaram as mesmas coisas.
//
// npm run exemplo -- <slug> --module ModuleName [--assunto x]   cria o pacote do artigo (--assunto se o artigo ainda não existe)
// npm run testar-exemplos [-- <slug>]         confere e roda `swift test` nos pacotes dos artigos do caderno
// npm run conferir-exemplos                   só a conferência artigo ↔ código
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, relative as relativePath, isAbsolute } from 'node:path';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import { articleFiles } from './article-files.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://luanrodrigues.xyz';

/** A configuração local não é versionada; a variável do processo tem precedência. */
export function resolveExamplesRoot(root = ROOT, env = process.env) {
  const config = join(root, '.env.local');
  const local = existsSync(config) ? parseEnv(readFileSync(config, 'utf8')) : {};
  const value = env.EXAMPLES_ROOT ?? local.EXAMPLES_ROOT;
  if (!value?.trim()) return undefined;
  const base = resolve(root, value.trim());
  const inside = relativePath(resolve(root), base);
  if (
    !inside ||
    (!inside.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && inside !== '..' && !isAbsolute(inside))
  ) {
    throw new Error('EXAMPLES_ROOT deve apontar para uma pasta fora do projeto do site.');
  }
  return base;
}

function requireExamplesRoot(base) {
  if (!base)
    throw new Error('Configure EXAMPLES_ROOT em .env.local ou no ambiente; exemplos não são criados dentro do site.');
  if (!existsSync(base) || !statSync(base).isDirectory())
    throw new Error(`Diretório de exemplos não encontrado: ${base}`);
  return base;
}

// Prefer the English example when a bundle has both translations.
const articleFor = (root, slug) => {
  const matches = articleFiles(root).filter((item) => item.slug === slug || item.urlSlug === slug);
  return matches.find((item) => item.language === 'en') ?? matches[0];
};
const articlePath = (root, slug) => articleFor(root, slug)?.file;

const titleOf = (markdown) => /^title:\s*"?(.*?)"?\s*$/m.exec(markdown)?.[1].replace(/\\"/g, '"') ?? '';
const urlOf = (markdown, slug) =>
  `${ORIGIN}${/^language:\s*"?pt-BR"?\s*$/m.test(markdown) ? `/articles/pt/${slug}/` : `/articles/${slug}/`}`;

export const articleSlugs = (root = ROOT) => [...new Set(articleFiles(root).map((item) => item.slug))];
const topicOf = (root, slug) => articleFor(root, slug)?.topic;

/** EXAMPLES_ROOT/<assunto>/<slug>/, onde quer que o pacote já esteja; senão, no assunto do artigo. */
const packageOf = (root, slug, base = resolveExamplesRoot(root)) => {
  if (!base) return undefined;
  const existing = existsSync(base)
    ? readdirSync(base)
        .map((topic) => join(base, topic, slug))
        .find((dir) => existsSync(dir))
    : undefined;
  const topic = topicOf(root, slug);
  return existing ?? (topic ? join(base, topic, slug) : undefined);
};
const hasPackage = (root, slug, base = resolveExamplesRoot(root)) => {
  const folder = packageOf(root, slug, base);
  return Boolean(folder) && existsSync(join(folder, 'Package.swift'));
};
/**
 * Cria EXAMPLES_ROOT/<assunto>/<slug>/ com Package.swift, um arquivo em Sources, um em Tests e o LEIA-ME.
 * O código vem antes do artigo: se ele ainda não existe, o título provisório é o próprio slug.
 * @param {{ slug: string, name?: string, topic?: string, root?: string, examplesRoot?: string }} options
 */
export function createExample({
  slug,
  name,
  topic = undefined,
  root = ROOT,
  examplesRoot = resolveExamplesRoot(root),
}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? '')) throw new Error(`Slug inválido: ${slug}`);
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name ?? ''))
    throw new Error('Informe --module com um nome de módulo em inglês e UpperCamelCase.');
  requireExamplesRoot(examplesRoot);
  if (topic && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic)) throw new Error(`Assunto inválido: ${topic}`);
  if (hasPackage(root, slug, examplesRoot))
    throw new Error(`${relativePath(examplesRoot, packageOf(root, slug, examplesRoot))}/Package.swift já existe`);
  const target = packageOf(root, slug, examplesRoot) ?? (topic ? join(examplesRoot, topic, slug) : undefined);
  if (!target) throw new Error(`${slug} ainda não tem artigo: informe o assunto com --assunto`);

  const article = articlePath(root, slug);
  const markdown = article ? readFileSync(article, 'utf8') : '';
  const title = article ? titleOf(markdown) : slug;
  const url = urlOf(markdown, slug);
  const files = {
    'Package.swift': `// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "${name}",
    platforms: [.macOS(.v14), .iOS(.v17)],
    targets: [
        .target(name: "${name}"),
        .testTarget(name: "${name}Tests", dependencies: ["${name}"]),
    ]
)
`,
    [`Sources/${name}/${name}.swift`]: `// Código do artigo "${title}".
// ${url}
`,
    [`Tests/${name}Tests/${name}Tests.swift`]: `import Testing
@testable import ${name}
`,
    'LEIA-ME.md': `# ${title}

Código e testes do artigo [${title}](${url}).

- \`Sources/${name}/\`: o código mostrado no artigo.
- \`Tests/${name}Tests/\`: os testes, com [Swift Testing](https://developer.apple.com/documentation/testing).

## Rodar os testes

\`\`\`sh
cd ${relativePath(examplesRoot, target)}
swift test
\`\`\`

Também dá para abrir o \`Package.swift\` no Xcode e rodar com ⌘U.
`,
  };
  for (const [path, text] of Object.entries(files)) {
    const file = join(target, path);
    if (existsSync(file)) continue;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  return target;
}

// Uma declaração: atributos e modificadores opcionais, depois a palavra que declara algo.
const MODIFIERS =
  /^(?:@\w+(?:\([^)]*\))?\s+|(?:public|private|fileprivate|internal|package|open|final|static|class|override|mutating|nonmutating|convenience|required|nonisolated|indirect|lazy|weak|unowned)(?:\(set\))?\s+)*/;
const DECLARATION = /^(?:func|struct|class|enum|protocol|actor|extension|init|typealias)\b/;

const parenBalance = (text) => (text.match(/\(/g)?.length ?? 0) - (text.match(/\)/g)?.length ?? 0);

const normalize = (text) =>
  text
    .replace(/\{.*$/, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),:<>])\s*/g, '$1')
    .trim();

/**
 * Uma declaração por item: atributos, modificadores, `{` final e espaços extras fora. Quando a
 * assinatura é quebrada em várias linhas, junta-as até os parênteses fecharem.
 */
export function declarations(code) {
  const found = [];
  let buffer = null;
  let depth = 0;
  for (const raw of code.split('\n')) {
    const line = raw.trim().replace(/\/\/.*$/, '');
    if (buffer === null) {
      const start = line.replace(MODIFIERS, '');
      if (!DECLARATION.test(start)) continue;
      buffer = start;
      depth = parenBalance(start);
    } else {
      buffer += ` ${line}`;
      depth += parenBalance(line);
    }
    if (depth <= 0) {
      found.push(normalize(buffer));
      buffer = null;
    }
  }
  if (buffer !== null) found.push(normalize(buffer));
  return found;
}

const swiftFences = (markdown) =>
  [...markdown.matchAll(/^([ \t]*)(`{3,}|~{3,})swift\b[^\n]*\n([\s\S]*?)^\1\2[ \t]*$/gm)].map((match) => match[3]);

const swiftFiles = (folder) =>
  existsSync(folder)
    ? readdirSync(folder).flatMap((name) => {
        const path = join(folder, name);
        if (statSync(path).isDirectory()) return swiftFiles(path);
        return name.endsWith('.swift') ? [path] : [];
      })
    : [];

/** Arquivos .swift soltos na raiz do exemplo: alvo do Xcode (views, previews, app), ao lado do pacote. */
const rootSwiftFiles = (folder) =>
  existsSync(folder)
    ? readdirSync(folder)
        .filter((name) => name.endsWith('.swift') && statSync(join(folder, name)).isFile())
        .map((name) => join(folder, name))
    : [];

/** Pastas de teste: Tests/ do pacote e os alvos de teste do Xcode na raiz (`…Tests`, `…UITests`). */
const testFolders = (folder) =>
  existsSync(folder)
    ? readdirSync(folder)
        .filter((name) => name.endsWith('Tests') && statSync(join(folder, name)).isDirectory())
        .map((name) => join(folder, name))
    : [];

/**
 * Declarações que o artigo mostra e que não existem no pacote (Sources/ e Tests/), nos .swift do alvo
 * Xcode na raiz do exemplo (padrão do modelo testável em Sources/ com as views ao lado) nem nos alvos de
 * teste do Xcode. Só artigos com pacote.
 */
export function checkExamples({
  root = ROOT,
  slugs = articleSlugs(root),
  examplesRoot = resolveExamplesRoot(root),
  optional = false,
} = {}) {
  if (optional && (!examplesRoot || !existsSync(examplesRoot))) return [];
  requireExamplesRoot(examplesRoot);
  return slugs
    .filter((slug) => hasPackage(root, slug, examplesRoot))
    .map((slug) => {
      const folder = packageOf(root, slug, examplesRoot);
      const files = [
        ...swiftFiles(join(folder, 'Sources')),
        ...rootSwiftFiles(folder),
        ...testFolders(folder).flatMap(swiftFiles),
      ];
      const inPackage = new Set(files.flatMap((file) => declarations(readFileSync(file, 'utf8'))));
      const shown = swiftFences(readFileSync(articlePath(root, slug), 'utf8')).flatMap(declarations);
      return { slug, missing: [...new Set(shown)].filter((line) => !inPackage.has(line)) };
    })
    .filter(({ missing }) => missing.length);
}

function report(problems) {
  const examplesRoot = resolveExamplesRoot();
  for (const { slug, missing } of problems) {
    console.error(
      `${relativePath(examplesRoot, packageOf(ROOT, slug, examplesRoot))}: o artigo declara o que o exemplo (Sources/, Tests/, alvo Xcode) não tem:`,
    );
    for (const line of missing) console.error(`  ${line}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2);
  const option = (flag) => {
    const index = args.indexOf(flag);
    return index === -1 ? undefined : args[index + 1];
  };
  const slug = args.find((arg, index) => !arg.startsWith('--') && !args[index - 1]?.startsWith('--'));
  try {
    if (command === 'novo') {
      if (!slug) throw new Error('Uso: npm run exemplo -- <slug> --module ModuleName [--assunto x]');
      const examplesRoot = requireExamplesRoot(resolveExamplesRoot());
      console.log(
        relativePath(examplesRoot, createExample({ slug, name: option('--module'), topic: option('--assunto') })),
      );
    } else if (command === 'conferir' || command === 'testar') {
      const slugs = slug ? [slug] : articleSlugs();
      requireExamplesRoot(resolveExamplesRoot());
      if (slug && !articlePath(ROOT, slug)) throw new Error(`Artigo não encontrado: ${slug}`);
      if (slug && !hasPackage(ROOT, slug)) throw new Error(`Pacote não encontrado para ${slug} em EXAMPLES_ROOT.`);
      if (!slugs.some((item) => hasPackage(ROOT, item)))
        throw new Error('Nenhum pacote correspondente aos artigos foi encontrado em EXAMPLES_ROOT.');
      const problems = checkExamples({ slugs });
      report(problems);
      let failed = problems.length > 0;
      if (command === 'testar') {
        for (const name of slugs.filter((item) => hasPackage(ROOT, item))) {
          console.log(`\n▶ ${relativePath(resolveExamplesRoot(), packageOf(ROOT, name))}`);
          // Evita que o cache incremental do manifesto perca plugins de macro, como TestingMacros,
          // entre execuções consecutivas no toolchain Swift 6.4 das Command Line Tools.
          const run = spawnSync('swift', ['test', '--disable-build-manifest-caching'], {
            cwd: packageOf(ROOT, name),
            stdio: 'inherit',
          });
          if (run.status !== 0) failed = true;
        }
      }
      if (failed) process.exit(1);
      console.log(command === 'testar' ? '\nOK: exemplos conferidos e testados.' : 'OK: artigos e pacotes conferem.');
    } else {
      throw new Error('Comandos: novo <slug>, testar [slug], conferir');
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
