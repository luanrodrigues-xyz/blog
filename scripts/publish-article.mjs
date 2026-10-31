// Publica ou despublica um artigo trocando o `draft` do front matter; o artigo não muda de pasta.
// npm run publicar -- <slug>
// npm run despublicar -- <slug>
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articleFiles } from './article-files.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Artigos com diagrama Astro usam .mdx (editorial/guia-diagramas.md); os demais continuam .md.
const INDEX_NAMES = ['index.md', 'index.mdx'];

/** Pasta do artigo: contents/notebook/<assunto>/<slug>. */
export function findArticle(root, slug, language = 'en') {
  const matches = articleFiles(root).filter((item) => item.slug === slug || item.urlSlug === slug);
  const exact = matches.find((item) => item.language === language);
  const legacy = matches.find((item) => !['en', 'pt-br'].includes(item.folder.split('/').at(-1)));
  return (exact ?? legacy)?.folder;
}

/** Data local, não UTC: publicar à noite no Brasil não pode gravar o dia seguinte. */
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

function setDraft({ slug, draft, root, language }) {
  const folder = findArticle(root, slug, language);
  if (!folder) throw new Error(`${slug} não existe em contents/notebook/`);
  const file = join(
    folder,
    INDEX_NAMES.find((name) => existsSync(join(folder, name))),
  );

  let text = readFileSync(file, 'utf8');
  const flag = /^draft:.*$/m;
  if (!draft && !/^draft:\s*true\s*$/m.test(text)) throw new Error(`${slug} não está com draft: true`);
  text = flag.test(text) ? text.replace(flag, `draft: ${draft}`) : text.replace(/^---\n/, `---\ndraft: ${draft}\n`);
  // A data do artigo é o dia em que ele entra no site (AGENTS.md).
  if (!draft) text = text.replace(/^date:.*$/m, `date: "${today()}"`);
  writeFileSync(file, text);

  // O cache do conteúdo guarda os links dos outros artigos para este; limpar para eles serem refeitos.
  rmSync(join(root, 'node_modules/.astro/data-store.json'), { force: true });
  return folder;
}

export const publishArticle = ({ slug, root = ROOT, language = 'en' }) =>
  setDraft({ slug, draft: false, root, language });

export const unpublishArticle = ({ slug, root = ROOT, language = 'en' }) =>
  setDraft({ slug, draft: true, root, language });

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const undo = args.includes('--undo');
  const languageIndex = args.indexOf('--language');
  const slug = args.find(
    (arg, index) => !arg.startsWith('--') && (languageIndex === -1 || index !== languageIndex + 1),
  );
  const language = args[args.indexOf('--language') + 1] ?? 'en';
  const selectedLanguage = args.includes('--language') ? language : 'en';
  if (!['en', 'pt-BR'].includes(selectedLanguage)) throw new Error('Use --language en ou pt-BR');
  try {
    const target = (undo ? unpublishArticle : publishArticle)({ slug, language: selectedLanguage });
    console.log(target.replace(`${ROOT}/`, ''));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
