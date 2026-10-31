import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { callouts } from './src/markdown/callouts.ts';
import { highlightCode } from './src/markdown/code.ts';
import { headingIds } from './src/markdown/headings.ts';
import { unpublishedLinks } from './src/markdown/unpublished-links.ts';
import checkSite from './src/integrations/check-site.mjs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { articleFiles } from './scripts/article-files.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));

/**
 * Migração de /artigos/ e /categorias/<assunto>/ (únicas rotas publicadas antes desta mudança) para
 * /articles/ e /categories/<assunto>/. Lida diretamente do disco, sem depender do content layer do Astro
 * (não disponível aqui), para cobrir toda URL que já esteve no ar. As rotas /artigos/ só existiram
 * enquanto o site era só em português, então só artigos com `language: "pt-BR"` recebem o redirect.
 */

function legacyRedirects() {
  const redirects = { '/artigos/': '/articles/', '/sobre/': '/about/' };
  const published = articleFiles(ROOT).filter(({ source }) => !/^draft:\s*true\s*$/m.test(source));
  for (const { topic, urlSlug, language } of published) {
    redirects[`/categorias/${topic}/`] = `/categories/${topic}/`;
    if (language === 'pt-BR') redirects[`/artigos/${urlSlug}/`] = `/articles/pt/${urlSlug}/`;
  }
  return redirects;
}

export default defineConfig({
  site: 'https://luanrodrigues.xyz',
  outDir: './dist',
  trailingSlash: process.argv.includes('dev') ? 'ignore' : 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  redirects: legacyRedirects(),
  markdown: {
    syntaxHighlight: false,
    processor: satteri({ hastPlugins: [callouts, headingIds, highlightCode, unpublishedLinks] }),
  },
  integrations: [mdx(), checkSite()],
});
