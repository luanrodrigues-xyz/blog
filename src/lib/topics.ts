import topicsData from '../config/topics.json';
import { defaultArticleLanguage, interfaceLanguage, type Language } from '../config/site';

/** Categorias editoriais. A fonte é topics.json; aqui ficam consultas puras sobre artigos publicados. */
export type Topic = (typeof topicsData.topics)[number];
type TopicArticle = {
  id: string;
  data: {
    topic: string;
    language: Language;
    readingOrder: number;
    date: Date;
    title: string;
    draft?: boolean;
    alternates?: { language: string; url: string }[];
  };
};

/**
 * Quando um artigo tem uma versão no idioma padrão de listagem, as listagens mostram só essa
 * versão. A outra fica acessível pelo botão de idioma dentro do próprio artigo, não como um card
 * à parte.
 */
const isListed = <T extends TopicArticle>(article: T) =>
  article.data.language === defaultArticleLanguage ||
  !(article.data.alternates ?? []).some((alt) => alt.language === defaultArticleLanguage);

export const topics: Topic[] = topicsData.topics;

/** O artigo mais recente de um assunto (por data; no mesmo dia, o de maior readingOrder). */
export const latestOf = <T extends TopicArticle>(articles: T[], slug: string): T | undefined =>
  articles
    .filter(({ data }) => data.topic === slug)
    .sort(
      (left, right) =>
        right.data.date.getTime() - left.data.date.getTime() || right.data.readingOrder - left.data.readingOrder,
    )[0];

/** `hidden: true` em topics.json: o assunto existe, mas não aparece nos cards do Caderno. */
export const isHidden = (topic: Topic) => Boolean((topic as any).hidden);
// Categoria é navegação/interface, sempre em inglês (interfaceLanguage), mesmo quando o artigo listado é português.
export const topicName = (topic: Topic) => (interfaceLanguage === 'en' ? topic.en : topic.pt);
export const topicSummary = (topic: Topic) =>
  (interfaceLanguage === 'en' ? topic.summary.en : topic.summary.pt) as string;
export const topicRoute = (topic: Topic) => `/categories/${topic.slug}/`;

/** `--tile` e `--glyph` do assunto, para o atributo style de quem tem data-topic. */
const DEFAULT_GLYPH = "<path d='M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z'/><path d='M4 8.5 12 13l8-4.5M12 13v7'/>";
export function topicStyle(topic: Topic) {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' " +
    `stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>${(topic as any).glyph || DEFAULT_GLYPH}</svg>`;
  return `--tile: var(--tile-${topic.tile}); --glyph: url("data:image/svg+xml,${encodeURIComponent(svg).replace(/%2F/g, '/').replace(/%3A/g, ':').replace(/%3D/g, '=').replace(/%27/g, "'").replace(/%20/g, ' ')}")`;
}

/**
 * Artigos publicados de um assunto, na ordem de leitura, dos dois idiomas editoriais.
 * A categoria é uma só por assunto; o idioma é do conteúdo de cada artigo, não da página.
 */
export function chapters<T extends TopicArticle>(articles: T[], slug: string): T[] {
  const published = articles.filter((article) => !article.data.draft && isListed(article));
  return published
    .filter((article) => article.data.topic === slug)
    .sort(
      (a, b) =>
        a.data.readingOrder - b.data.readingOrder ||
        a.data.date.getTime() - b.data.date.getTime() ||
        a.id.localeCompare(b.id),
    );
}

/** Artigos de um assunto na ordem configurada por `topic.sort` (readingOrder ou date). */
export function topicArticles<T extends TopicArticle>(articles: T[], topic: Topic): T[] {
  return (topic as any).sort === 'readingOrder'
    ? chapters(articles, topic.slug)
    : publications(articles).filter(({ data }) => data.topic === topic.slug);
}

/** A categoria só tem página quando existe ao menos um artigo publicado, em qualquer idioma. */
export const pageExists = (articles: TopicArticle[], topic: Topic) =>
  articles.some(({ data }) => !data.draft && data.topic === topic.slug);

/** Publicações por data, dos dois idiomas, sem expor rascunhos nem alterar a coleção recebida. */
export function publications<T extends TopicArticle>(articles: T[]): T[] {
  return articles
    .filter((article) => !article.data.draft && isListed(article))
    .sort(
      (a, b) =>
        b.data.date.getTime() - a.data.date.getTime() ||
        b.data.readingOrder - a.data.readingOrder ||
        a.id.localeCompare(b.id),
    );
}

export function availableCategories(articles: TopicArticle[]) {
  const listed = publications(articles);
  return topics
    .filter((topic) => !isHidden(topic) && pageExists(articles, topic))
    .map((topic) => ({
      topic,
      count: listed.filter(({ data }) => data.topic === topic.slug).length,
    }));
}

/** Tags de um conjunto de artigos, das mais frequentes para as menos; no empate, em ordem alfabética. */
export function tagsOf(articles: { data: { tags?: string[] } }[]) {
  const counts = new Map<string, number>();
  for (const { data } of articles)
    for (const tag of new Set(data.tags ?? [])) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, interfaceLanguage, { sensitivity: 'base' }));
}
