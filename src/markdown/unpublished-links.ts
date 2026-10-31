import { defineHastPlugin } from 'satteri';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { articleFiles } from '../../scripts/article-files.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
// /articles/<slug>/ é inglês; /articles/pt/<slug>/ é português. O idioma do link decide qual árvore conferir.
const ARTICLE_LINK = /^\/articles\/(pt\/)?([a-z0-9-]+)\/?(?:[#?].*)?$/;

/** Publicado = existe no idioma do link, sem `draft: true`. Rascunhos e slugs desconhecidos não contam. */
const isPublished = (slug: string, pt: boolean) => {
  const base = join(ROOT, 'contents/notebook');
  if (!existsSync(base)) return false;
  const language = pt ? 'pt-BR' : 'en';
  return articleFiles(ROOT).some(
    (item) => item.urlSlug === slug && item.language === language && !/^draft:\s*true\s*$/m.test(item.source),
  );
};

const warned = new Set<string>();

/**
 * No build de produção, um link para um artigo que ainda não foi publicado vira texto simples
 * (`<span class="unpublished-link">`), em vez de derrubar o build com um link morto. Quando o
 * artigo é publicado (`draft: false`), o link volta sozinho. Cada caso é avisado no log.
 * No `astro dev` os links não mudam, para navegar entre rascunhos.
 */
export const unpublishedLinks = defineHastPlugin({
  name: 'unpublished-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      if (process.env.NODE_ENV !== 'production') return;
      const href = node.properties?.href;
      const match = typeof href === 'string' ? ARTICLE_LINK.exec(href) : null;
      const slug = match?.[2];
      if (!slug || isPublished(slug, Boolean(match![1]))) return;

      const where = ctx.fileURL ? fileURLToPath(ctx.fileURL).replace(ROOT, '') : 'artigo';
      if (!warned.has(`${where}:${slug}`)) {
        warned.add(`${where}:${slug}`);
        console.warn(`AVISO ${where}: link para "${slug}", que não está publicado; exibido sem link.`);
      }
      return {
        type: 'element',
        tagName: 'span',
        properties: { className: ['unpublished-link'] },
        children: node.children,
      } as any;
    },
  },
});
