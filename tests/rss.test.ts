import { describe, expect, it, vi } from 'vitest';
import { getArticles, type Article } from '../src/lib/articles';
import { GET } from '../src/pages/rss.xml';
vi.mock('../src/lib/articles', () => ({ getArticles: vi.fn() }));

function article(id: string, date: string, draft = false, language = 'en') {
  return {
    id,
    data: {
      title: 'Swift & <types>',
      description: 'A "summary" & details',
      canonical: `https://luanrodrigues.xyz/articles/${id}/`,
      published: new Date(date),
      language,
      topicLabel: 'Swift',
      draft,
    },
  } as unknown as Article;
}

describe('RSS', () => {
  it('excludes drafts, preserves both languages, sorts by publication and escapes XML', async () => {
    vi.mocked(getArticles).mockResolvedValue([
      article('old', '2026-01-01'),
      article('draft', '2026-03-01', true),
      article('new', '2026-02-01', false, 'pt-BR'),
    ]);
    const response = await GET();
    const xml = await response.text();
    expect(response.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    expect(xml).not.toContain('/draft/');
    expect(xml.indexOf('/new/')).toBeLessThan(xml.indexOf('/old/'));
    expect(xml).toContain('Swift &amp; &lt;types&gt;');
    expect(xml).toContain('A &quot;summary&quot; &amp; details');
    expect(xml).toContain('<dc:language>pt-BR</dc:language>');
    expect(xml).toContain('<dc:language>en</dc:language>');
    expect(xml).toContain('<guid isPermaLink="true">https://luanrodrigues.xyz/articles/new/</guid>');
    expect(xml).toContain('<pubDate>Sun, 01 Feb 2026 00:00:00 GMT</pubDate>');
  });

  it('produces a channel with no items when no articles are published', async () => {
    vi.mocked(getArticles).mockResolvedValue([]);
    const xml = await (await GET()).text();
    expect(xml).toContain('<channel>');
    expect(xml).not.toContain('<item>');
    expect(xml).not.toContain('Invalid Date');
  });
});
