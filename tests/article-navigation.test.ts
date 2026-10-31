import { describe, expect, it } from 'vitest';
import type { Article } from '../src/lib/articles';
import { articleNavigation } from '../src/lib/article-navigation';

function article(id: string, day: number, topic = 'swift', language = 'en', draft = false) {
  return {
    id,
    data: { topic, language, draft, published: new Date(`2026-01-${String(day).padStart(2, '0')}`) },
  } as unknown as Article;
}

describe('article publication navigation', () => {
  it('crosses topics by publication date without changing input order', () => {
    const old = article('old', 1);
    const current = article('current', 2, 'architecture');
    const next = article('next', 3, 'frontend');
    const all = [next, old, current];
    expect(articleNavigation(current, all)).toEqual({ previous: old, next });
    expect(all.map(({ id }) => id)).toEqual(['next', 'old', 'current']);
  });

  it('excludes drafts and other languages and handles the oldest/newest article', () => {
    const old = article('old', 1);
    const next = article('next', 4);
    const all = [old, article('draft', 2, 'swift', 'en', true), article('translation', 3, 'swift', 'pt-BR'), next];
    expect(articleNavigation(old, all)).toEqual({ previous: undefined, next });
    expect(articleNavigation(next, all)).toEqual({ previous: old, next: undefined });
  });

  it('does not offer a next article for an entry outside the published list', () => {
    expect(articleNavigation(article('draft', 2, 'swift', 'en', true), [article('old', 1)])).toEqual({
      previous: undefined,
      next: undefined,
    });
  });
});
