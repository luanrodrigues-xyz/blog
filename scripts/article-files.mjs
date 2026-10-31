import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** Read both localized bundles and the older flat layout during migration. */
export function articleFiles(root) {
  const base = join(root, 'contents/notebook');
  if (!existsSync(base)) return [];
  const result = [];
  for (const topic of readdirSync(base, { withFileTypes: true }).filter((item) => item.isDirectory())) {
    const topicDir = join(base, topic.name);
    for (const article of readdirSync(topicDir, { withFileTypes: true }).filter((item) => item.isDirectory())) {
      const bundle = join(topicDir, article.name);
      for (const locale of ['', 'en', 'pt-br']) {
        const folder = join(bundle, locale);
        const file = ['index.md', 'index.mdx'].map((name) => join(folder, name)).find(existsSync);
        if (!file) continue;
        const source = readFileSync(file, 'utf8');
        const language = /^language:\s*["']?([^"'\s]+)["']?\s*$/m.exec(source)?.[1];
        const urlSlug = /^urlSlug:\s*["']?([^"'\s]+)["']?\s*$/m.exec(source)?.[1] ?? article.name;
        result.push({ topic: topic.name, slug: article.name, urlSlug, language, file, folder: dirname(file), source });
      }
    }
  }
  return result;
}
