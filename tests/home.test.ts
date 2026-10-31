import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getArticles, type Article } from '../src/lib/articles';
import { homeContent } from '../src/lib/home';
vi.mock('../src/lib/articles', () => ({ getArticles: vi.fn() }));

function article(id: string, topic: string, day: number, draft = false, areas?: string[]) {
  return {
    id,
    data: {
      title: id,
      topic,
      language: 'en',
      date: new Date(`2026-10-${String(day).padStart(2, '0')}`),
      readingOrder: day,
      draft,
      ...(areas ? { areas } : {}),
    },
  } as unknown as Article;
}

describe('home selection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('features all areas by date and excludes drafts', async () => {
    vi.mocked(getArticles).mockResolvedValue([
      article('mobile', 'swiftui', 4),
      article('web', 'frontend', 6),
      article('backend', 'java-backend', 9),
      article('draft', 'frontend', 10, true),
    ]);
    const content = await homeContent();
    expect(content.latest.map(({ id }) => id)).toEqual(['backend', 'web', 'mobile']);
    expect(content.articles.map(({ id }) => id)).toEqual(['backend', 'web', 'mobile']);
    expect(content.categories.some(({ topic }) => topic.slug === 'java-backend')).toBe(true);
  });

  it('includes shared mobile/backend articles once and limits highlights to four', async () => {
    vi.mocked(getArticles).mockResolvedValue([
      article('shared', 'payments', 10, false, ['ios', 'backend']),
      article('web-a', 'frontend', 9),
      article('mobile-a', 'swift', 8),
      article('web-b', 'frontend', 7),
      article('mobile-b', 'uikit', 6),
    ]);
    const content = await homeContent();
    expect(content.latest.map(({ id }) => id)).toEqual(['shared', 'web-a', 'mobile-a', 'web-b']);
    expect(content.categories.some(({ topic }) => topic.slug === 'payments')).toBe(true);
  });
});
