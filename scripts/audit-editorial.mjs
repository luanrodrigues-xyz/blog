// Triagem editorial: os achados exigem leitura; não certificam estilo, execução ou publicação.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownToMdast, mdxToMdast } from 'satteri';
import { articleFiles } from './article-files.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TERMS = ['decide', 'dono', 'continua sendo', 'não muda'];
const OMIT = new Set([
  'yaml',
  'toml',
  'code',
  'inlineCode',
  'blockquote',
  'html',
  'mdxFlowExpression',
  'mdxTextExpression',
]);
const CLAIM =
  /\b(?:rodei|executei|testei|compilei|conferi|observei|inspecionei)\b|\b(?:testes?|suíte|pacote|interface)\b[^.!?]*\b(?:passaram|passou|falharam|falhou)\b|\b(?:modelo|resposta|execução)\b[^.!?]*\b(?:devolveu|voltou|voltaram|imprime|imprimiu)\b/iu;

function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

function prose(node) {
  if (OMIT.has(node.type)) return ' ';
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(prose).join('');
}

function withoutQuotes(text) {
  return text.replace(/“[^”]*”|"[^"\n]*"|‘[^’]*’/gu, ' ');
}

/** Usa a árvore Markdown/MDX para não contar código, atributos, imports ou citações em bloco. */
export function inspectSource(source, mdx = true) {
  const tree = (mdx ? mdxToMdast : markdownToMdast)(source);
  const paragraphs = [];
  const imports = [];
  function collect(node) {
    if (OMIT.has(node.type)) return;
    if (node.type === 'mdxjsEsm') {
      for (const match of node.value.matchAll(/\bimport\s+(?:[^;]*?\s+from\s+)?['"]([^'"]+)['"]/gu)) {
        imports.push({
          source: match[1],
          line: node.position.start.line + node.value.slice(0, match.index).split('\n').length - 1,
        });
      }
      return;
    }
    if (['paragraph', 'heading', 'tableCell'].includes(node.type)) {
      paragraphs.push({
        text: withoutQuotes(prose(node)),
        excerpt: source.slice(node.position.start.offset, node.position.end.offset),
        line: node.position.start.line,
      });
      return;
    }
    for (const child of node.children ?? []) collect(child);
  }
  collect(tree);
  const vocabulary = TERMS.map((term) => {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])${term.replaceAll(' ', '\\s+')}(?![\\p{L}\\p{N}_])`, 'giu');
    const occurrences = paragraphs.flatMap(({ text, line }) => [...text.matchAll(pattern)].map(() => line));
    return { term, count: occurrences.length, lines: occurrences, review: occurrences.length >= 5 };
  });
  const claims = paragraphs
    .filter(({ text }) => CLAIM.test(text))
    .map(({ excerpt, line }) => ({
      line,
      text: excerpt.replace(/\s+/gu, ' ').trim(),
      status: 'conferir evidência e contexto',
    }));
  // Imagens Markdown são verificadas também; imagens em atributos MDX não são imports.
  const images = [];
  const definitions = new Map();
  walk(tree, (node) => {
    if (node.type === 'definition') definitions.set(node.identifier, node.url);
  });
  walk(tree, (node) => {
    if (node.type === 'image') images.push({ source: node.url, line: node.position.start.line });
    if (node.type === 'imageReference')
      images.push({ source: definitions.get(node.identifier) ?? '', line: node.position.start.line });
  });
  return { vocabulary, claims, imports, images };
}

function filesIn(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const path = join(directory, entry.name);
    if (entry.name.endsWith('.xcresult')) return [path];
    return entry.isDirectory() ? filesIn(path) : entry.isFile() ? [path] : [];
  });
}

export function auditArticle(file, root = ROOT) {
  const source = readFileSync(file, 'utf8');
  const analysis = inspectSource(source, file.endsWith('.mdx'));
  const assets = [
    ...analysis.imports.map((asset) => ({ ...asset, kind: 'import' })),
    ...analysis.images.map((asset) => ({ ...asset, kind: 'image' })),
  ].map((asset) => {
    const specifier = asset.source.split(/[?#]/u)[0];
    const path = specifier.startsWith('.')
      ? resolve(dirname(file), specifier)
      : asset.kind === 'image' && specifier && !/^(?:[a-z]+:|\/\/)/iu.test(specifier)
        ? specifier.startsWith('/')
          ? join(root, 'public', specifier.slice(1))
          : resolve(dirname(file), specifier)
        : null;
    return {
      ...asset,
      status: path ? (existsSync(path) && statSync(path).isFile() ? 'existe' : 'ausente') : 'não verificado',
    };
  });
  const articleFolder = ['en', 'pt-br'].includes(dirname(file).split('/').at(-1))
    ? dirname(dirname(file))
    : dirname(file);
  const bundle = relative(join(root, 'contents', 'notebook'), articleFolder);
  const example = join(root, 'examples', bundle);
  const files = bundle.startsWith('..') ? [] : filesIn(example);
  const records = files.filter((path) => /(?:VALIDACAO\.md|README\.md|LEIA-ME\.md|\.log|\.xcresult)$/iu.test(path));
  const tests = files.filter((path) => /(?:Tests|UITests)[/\\]|Tests\.swift$/u.test(path));
  return {
    article: relative(root, file),
    ...analysis,
    assets,
    evidence: {
      status: 'pendente de correspondência com cada relato',
      records: records.map((p) => relative(root, p)),
      tests: tests.map((p) => relative(root, p)),
    },
    checks: { build: 'não executado por este comando', visual: 'não inspecionado por este comando' },
  };
}

export function findArticle(slug, root = ROOT, language) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) throw new Error('Informe um slug válido.');
  const candidates = articleFiles(root).filter(
    (item) => (item.slug === slug || item.urlSlug === slug) && (!language || item.language === language),
  );
  const exact = candidates.filter((item) => item.urlSlug === slug);
  const matches = exact.length ? exact : candidates;
  if (
    new Set(matches.map((item) => item.topic)).size > 1 ||
    new Set(matches.map((item) => item.language)).size < matches.length
  ) {
    throw new Error(`Esperava um artigo para ${slug}; encontrei ${matches.length}.`);
  }
  const preferred = matches.find((item) => item.language === 'en') ?? matches[0];
  if (!preferred) throw new Error(`Esperava um artigo para ${slug}; encontrei 0.`);
  return preferred.file;
}

function printReport(report) {
  console.log(`\n${report.article}`);
  console.log('Vocabulário literal na prosa (sem somar flexões; linhas indicam o início do parágrafo):');
  for (const item of report.vocabulary) {
    console.log(
      `  ${item.term}: ${item.count}${item.review ? ' — REVISAR EM CONTEXTO' : ''}${item.lines.length ? ` (linhas ${item.lines.join(', ')})` : ''}`,
    );
  }
  console.log('Relatos candidatos — triagem heurística, não lista exaustiva nem prova de execução:');
  for (const claim of report.claims) console.log(`  ${claim.line}: ${claim.text}`);
  console.log('Arquivos para conferir (existência não valida os relatos):');
  for (const file of [...report.evidence.records, ...report.evidence.tests]) console.log(`  ${file}`);
  if (!report.evidence.records.length)
    console.log('  Nenhum registro de validação, README ou log localizado no exemplo.');
  console.log('Imports estáticos e imagens Markdown (não verifica dependências transitivas, aliases ou URLs):');
  for (const asset of report.assets) console.log(`  ${asset.line}: ${asset.status} — ${asset.source}`);
  console.log('Pendentes: correspondência das evidências; leitura editorial; check/build; inspeção visual.');
  console.log('Código 0 significa apenas ausência de arquivo local faltante nesta triagem; não aprova publicação.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const json = args.includes('--json');
    const languageIndex = args.indexOf('--language');
    const language = languageIndex < 0 ? undefined : args[languageIndex + 1];
    if (languageIndex >= 0 && !['en', 'pt-BR'].includes(language)) throw new Error('Use --language en ou pt-BR');
    const slugs = args.filter(
      (arg, index) => arg !== '--json' && arg !== '--language' && (languageIndex < 0 || index !== languageIndex + 1),
    );
    if (!slugs.length) throw new Error('Uso: npm run auditar-editorial -- <slug> [outro-slug] [--json]');
    const reports = slugs.map((slug) => auditArticle(findArticle(slug, ROOT, language)));
    if (json) console.log(JSON.stringify(reports, null, 2));
    else reports.forEach(printReport);
    if (reports.some((report) => report.assets.some((asset) => asset.status === 'ausente'))) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
