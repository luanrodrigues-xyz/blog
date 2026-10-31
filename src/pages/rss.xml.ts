import { getArticles } from '../lib/articles';
import { site } from '../config/site';

export const prerender = true;

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function GET() {
  const articles = (await getArticles())
    .filter(({ data }) => !data.draft)
    .sort((a, b) => b.data.published.getTime() - a.data.published.getTime() || a.id.localeCompare(b.id));
  const items = articles
    .map(
      ({ data }) => `
    <item>
      <title>${escapeXml(data.title)}</title>
      <link>${escapeXml(data.canonical)}</link>
      <guid isPermaLink="true">${escapeXml(data.canonical)}</guid>
      <description>${escapeXml(data.description ?? '')}</description>
      <pubDate>${data.published.toUTCString()}</pubDate>
      <dc:creator>${escapeXml(site.author)}</dc:creator>
      <dc:language>${data.language}</dc:language>
      <category>${escapeXml(data.topicLabel)}</category>
    </item>`,
    )
    .join('');
  const latestUpdate = articles.length
    ? new Date(Math.max(...articles.map(({ data }) => (data.updated ?? data.published).getTime())))
    : undefined;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(site.name)} | iOS Developer</title>
    <link>${site.origin}/</link>
    <description>Technical articles on iOS and web development, in English and Portuguese.</description>
    <atom:link href="${site.origin}/rss.xml" rel="self" type="application/rss+xml" />
    ${latestUpdate ? `<lastBuildDate>${latestUpdate.toUTCString()}</lastBuildDate>` : ''}
    ${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
