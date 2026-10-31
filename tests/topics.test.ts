import { describe, expect, it } from 'vitest';
import {
  chapters,
  publications,
  availableCategories,
  tagsOf,
  latestOf,
  pageExists,
  topicRoute,
  topicStyle,
  type Topic,
} from '../src/lib/topics';

const topic = (extra: object = {}) =>
  ({
    slug: 'swiftui',
    pt: 'SwiftUI',
    en: 'SwiftUI',
    tile: 'indigo',
    sort: 'readingOrder',
    ...extra,
  }) as unknown as Topic;
const article = (title: string, order: number, language: 'pt-BR' | 'en' = 'pt-BR', slug = 'swiftui') => ({
  id: `${language}/${title}`,
  data: { title, topic: slug, language, readingOrder: order, date: new Date('2026-01-01') },
});

describe('topics', () => {
  it('lists the tags of a category by frequency, then alphabetically', () => {
    const tagged = (tags: string[]) => ({ data: { tags } });
    expect(tagsOf([tagged(['Task', 'async/await', 'Task']), tagged(['Task', 'Estado'])])).toEqual([
      { tag: 'Task', count: 2 },
      { tag: 'async/await', count: 1 },
      { tag: 'Estado', count: 1 },
    ]);
  });

  it('routes every topic to a single category, regardless of content language', () => {
    expect(topicRoute(topic())).toBe('/categories/swiftui/');
    expect(topicRoute(topic({ slug: 'memoria' }))).toBe('/categories/memoria/');
  });

  it('lists chapters of a topic in reading order, mixing both editorial languages', () => {
    const list = [article('b', 2), article('a', 1), article('c', 1, 'en'), article('d', 1, 'pt-BR', 'outro')];
    expect(chapters(list, 'swiftui').map(({ data }) => data.title)).toEqual(['c', 'a', 'b']);
  });

  it('a category only has a page with at least one published article, in any language', () => {
    expect(pageExists([], topic())).toBe(false);
    expect(pageExists([article('a', 1)], topic())).toBe(true);
    expect(pageExists([article('a', 1, 'en')], topic())).toBe(true);
  });

  it('does not create a category page for drafts', () => {
    const draft = { ...article('rascunho', 1), data: { ...article('rascunho', 1).data, draft: true } };
    expect(pageExists([draft], topic())).toBe(false);
    expect(availableCategories([draft])).toEqual([]);
    expect(
      availableCategories([draft, article('publicado', 2)]).map(({ topic, count }) => [topic.slug, count]),
    ).toEqual([['swiftui', 1]]);
  });

  it('orders publications by date across both languages, excluding drafts, without mutating input', () => {
    const older = article('anterior', 99);
    const newer = { ...article('recente', 1), data: { ...article('recente', 1).data, date: new Date('2026-02-01') } };
    const draft = { ...article('rascunho', 100), data: { ...article('rascunho', 100).data, draft: true } };
    const translation = article('traducao', 2, 'en');
    const list = [older, draft, translation, newer];
    expect(publications(list).map(({ data }) => data.title)).toEqual(['recente', 'anterior', 'traducao']);
    expect(list[0]).toBe(older);
  });

  it('lists both language versions of a topic, since articles are no longer paired as translations', () => {
    const en = article('let and var', 1, 'en');
    const pt = article('let e var', 1, 'pt-BR');
    expect(publications([pt, en]).map(({ data }) => data.title)).toEqual(['let and var', 'let e var']);
    expect(chapters([pt, en], 'swiftui').map(({ data }) => data.title)).toEqual(['let and var', 'let e var']);
  });

  it('styles a topic with its tile and the default glyph', () => {
    expect(topicStyle(topic())).toMatch(/--tile: var\(--tile-indigo\); --glyph: url\("data:image\/svg\+xml,.*M4 8\.5/);
  });

  it('features the most recent article of a subject', () => {
    const note = (title: string, date: string, slug = 'notas') => ({
      id: title,
      data: { title, topic: slug, language: 'pt-BR' as const, readingOrder: 1, date: new Date(date) },
    });
    const articles = [
      note('antiga', '2026-09-22'),
      note('nova', '2026-09-25'),
      note('outro-assunto', '2026-09-30', 'swiftui'),
    ];
    expect(latestOf(articles, 'notas')?.id).toBe('nova');
    expect(latestOf(articles, 'memoria')).toBeUndefined();
  });
});
