import { getCollection } from 'astro:content';
import { site } from '../config/site';
import { games } from '../data/games';
import { gameJournalUrl } from '../lib/game-journal';

export const prerender = true;

const staticRoutes = ['/', '/art/', '/games/', '/shop/', '/about/'];

export async function GET() {
  const journal = await getCollection('gameJournal', ({ data }) => !data.draft);
  const locations = [
    ...staticRoutes.map((path) => ({ path, date: undefined as Date | undefined })),
    ...games.flatMap((game) => [
      { path: `/games/${game.slug}/`, date: undefined as Date | undefined },
      { path: `/games/${game.slug}/journal/`, date: undefined as Date | undefined },
    ]),
    ...journal.map((entry) => ({ path: gameJournalUrl(entry), date: entry.data.date })),
  ];
  const urls = locations
    .map(
      ({ path, date }) =>
        `  <url><loc>${escapeXml(site.origin + path)}</loc>${date ? `<lastmod>${date.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`,
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
