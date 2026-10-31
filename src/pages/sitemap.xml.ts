import { areas, areaRoute } from '../lib/areas';
import { getCollection } from 'astro:content';
import { getArticles } from '../lib/articles';
import { features, site, ui } from '../config/site';
import { pageExists, topicRoute, topics } from '../lib/topics';

export const prerender = true;

export async function GET() {
  const [pages, articles] = await Promise.all([
    getCollection(
      'sitePages',
      ({ data }) =>
        Boolean(data.canonical) &&
        data.noindex !== true &&
        data.draft !== true &&
        (data.isLab !== true || features.lab),
    ),
    getArticles(({ data }) => !data.draft),
  ]);
  const locations = [
    ...areas.map(({ id }) => ({ url: `${site.origin}${areaRoute(id)}`, date: undefined as Date | undefined })),
    { url: `${site.origin}${ui.articlesUrl}`, date: undefined as Date | undefined },
    ...pages.map(({ data }) => ({ url: data.canonical!, date: undefined as Date | undefined })),
    ...articles.map(({ data }) => ({ url: data.canonical, date: data.updated ?? data.published })),
  ];
  const subjects = topics
    .filter((topic) => pageExists(articles, topic))
    .map((topic) => ({ url: `${site.origin}${topicRoute(topic)}`, date: undefined as Date | undefined }));
  locations.push(...subjects);
  const unique = [...new Map(locations.map((location) => [location.url, location])).values()];
  const urls = unique
    .map(
      ({ url, date }) =>
        `  <url><loc>${escapeXml(url)}</loc>${date ? `<lastmod>${date.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
