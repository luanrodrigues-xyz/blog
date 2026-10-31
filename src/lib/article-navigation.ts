import type { Article } from './articles';

export function articleNavigation(entry: Article, articles: Article[]) {
  const ordered = articles
    .filter(({ data }) => !data.draft && data.language === entry.data.language)
    .sort((a, b) => a.data.published.getTime() - b.data.published.getTime() || a.id.localeCompare(b.id));
  const index = ordered.findIndex(({ id }) => id === entry.id);
  return {
    previous: index > 0 ? ordered[index - 1] : undefined,
    next: index >= 0 ? ordered[index + 1] : undefined,
  };
}
