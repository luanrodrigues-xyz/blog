import { describe, expect, it } from 'vitest';
import type { Article } from '../src/lib/articles';
import { relatedArticles } from '../src/lib/related-articles';

function article(slug: string, topic = 'swift', language = 'en', draft = false, tags: string[] = []) {
  return {
    id: `notebook/${topic}/${slug}/${language === 'en' ? 'en' : 'pt-br'}`,
    data: { topic, language, draft, tags, date: new Date('2026-01-01') },
  } as unknown as Article;
}

describe('related reading', () => {
  it('connects contract articles across areas in the same language', () => {
    const current = article('server-driven-ui-contract-boundary', 'architecture', 'pt-BR');
    const connected = article('ai-response-rendering-contract', 'frontend', 'pt-BR');
    const sameTopic = article('other', 'architecture', 'pt-BR');
    expect(relatedArticles(current, [current, sameTopic, connected]).map(({ id }) => id)).toEqual([
      connected.id,
      sameTopic.id,
    ]);
  });

  it('excludes drafts, translations, the current article, adjacent links and unrelated content', () => {
    const current = article('current');
    const adjacent = article('previous');
    const candidates = [
      current,
      adjacent,
      article('draft', 'swift', 'en', true),
      article('current', 'swift', 'pt-BR'),
      article('other-language', 'swift', 'pt-BR'),
      article('unrelated', 'frontend'),
    ];
    expect(relatedArticles(current, candidates, [adjacent.id])).toEqual([]);
  });

  it('prefers shared tags over topic-only matches and limits suggestions', () => {
    const current = article('current', 'swift', 'en', false, ['API']);
    const tagged = article('tagged', 'frontend', 'en', false, ['api']);
    const rest = ['a', 'b', 'c', 'd'].map((slug) => article(slug));
    const input = [tagged, ...rest];
    const ids = input.map(({ id }) => id);
    expect(relatedArticles(current, input)[0].id).toBe(tagged.id);
    expect(relatedArticles(current, input)).toHaveLength(2);
    expect(input.map(({ id }) => id)).toEqual(ids);
  });
});
