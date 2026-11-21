import { defineConfig } from 'astro/config';
import checkSite from './src/integrations/check-site.mjs';

/**
 * The site used to be a technical blog. Its old listing routes now lead to the portfolio
 * instead of a 404; individual article URLs were retired with the content.
 */
const legacyRedirects = {
  '/artigos/': '/',
  '/articles/': '/',
  '/sobre/': '/about/',
};

export default defineConfig({
  site: 'https://luanrodrigues.xyz',
  outDir: './dist',
  trailingSlash: process.argv.includes('dev') ? 'ignore' : 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  redirects: legacyRedirects,
  integrations: [checkSite()],
});
