export const areas = [
  {
    id: 'frontend',
    label: 'Web',
    description: 'Web interfaces, state, accessibility, and frontend engineering.',
  },
  {
    id: 'backend',
    label: 'Backend',
    description: 'Java, HTTP APIs, persistence, and backend development.',
  },
  {
    id: 'ios',
    label: 'iOS',
    description: 'Swift, SwiftUI, UIKit, and app architecture.',
  },
] as const;

export type AreaId = (typeof areas)[number]['id'];
export const areaRoute = (id: AreaId) => `/articles/${id}/`;

/** Explicit areas support articles that cover both the app and the backend. */
export function articleAreas(article: { data: { topic: string; areas?: AreaId[] } }) {
  const ids = article.data.areas ?? [
    article.data.topic === 'frontend' ? 'frontend' : article.data.topic === 'java-backend' ? 'backend' : 'ios',
  ];
  return areas.filter((area) => ids.includes(area.id));
}

/** Frontend engineering includes web interfaces and native mobile interfaces. */
export function isFrontendArticle(article: Parameters<typeof articleAreas>[0]) {
  return articleAreas(article).some(({ id }) => id === 'frontend' || id === 'ios');
}
