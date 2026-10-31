import { render } from 'astro:content';
import { getArticles, type Article } from './articles';
import { articleCover, socialCover } from './covers';
import { languageOf, ui } from '../config/site';
import { topicName, topicRoute, topics } from './topics';
import { relatedArticles } from './related-articles';
import { articleNavigation } from './article-navigation';

/** Tudo o que a página de um artigo precisa além do texto: navegação, assunto e capa. O layout só apresenta. */
export async function articlePage(entry: Article) {
  const { data } = entry;
  const language = languageOf(data.language);
  const { Content, headings } = await render(entry);
  // Publication order across subjects, keeping the current article's language.
  const all = await getArticles(({ data: item }) => !item.draft && item.language === data.language);
  const topic = topics.find((item) => item.slug === data.topic);
  const { previous, next } = articleNavigation(entry, all);
  return {
    language,
    Content,
    headings: headings.filter(({ depth }) => depth === 2),
    previous,
    next,
    related: relatedArticles(
      entry,
      all,
      [previous?.id, next?.id].filter((id): id is string => Boolean(id)),
    ),
    topic,
    topicUrl: topic ? topicRoute(topic) : ui.articlesUrl,
    topicLabel: topic ? topicName(topic) : data.topicLabel,
    cover: await articleCover(data.cover),
    socialCover: socialCover(data.cover),
  };
}
