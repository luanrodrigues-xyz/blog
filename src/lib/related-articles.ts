import { articleSlug } from '../config/site';
import type { Article } from './articles';

// Editorial connections across areas, complementing shared topics and tags.
const connections = [
  [
    'server-driven-ui-contract-boundary',
    'ai-response-rendering-contract',
    'modeling-components-and-actions-in-swift',
    'evolving-remote-components-and-schema-versions',
  ],
];

export function relatedArticles(entry: Article, articles: Article[], exclude: string[] = []) {
  const slug = articleSlug(entry.id);
  const connected = new Set(connections.filter((group) => group.includes(slug)).flat());
  const tags = new Set(entry.data.tags.map((tag) => tag.toLowerCase()));
  return articles
    .filter(
      (candidate) =>
        candidate.id !== entry.id &&
        !candidate.data.draft &&
        candidate.data.language === entry.data.language &&
        articleSlug(candidate.id) !== slug &&
        !exclude.includes(candidate.id),
    )
    .map((candidate) => ({
      article: candidate,
      score:
        (connected.has(articleSlug(candidate.id)) ? 100 : 0) +
        candidate.data.tags.filter((tag) => tags.has(tag.toLowerCase())).length * 10 +
        (candidate.data.topic === entry.data.topic ? 1 : 0),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.article.data.date.getTime() - a.article.data.date.getTime() ||
        a.article.id.localeCompare(b.article.id),
    )
    .slice(0, 2)
    .map(({ article }) => article);
}
