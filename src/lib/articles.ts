import { getCollection, type CollectionEntry } from 'astro:content';
import { articleUrl, formatDate, interfaceLanguage, site } from '../config/site';
import { topicName, topics } from './topics';
import { articleAlternates } from './article-translations';

/**
 * Único ponto em que os metadados de um artigo são completados.
 * O front matter só declara o que o autor decide (título, descrição, data, assunto, ordem,
 * tags, capa); idioma, canonical, alternates, datas de exibição e rótulo do assunto saem daqui.
 * Um valor escrito no front matter tem precedência sobre o derivado.
 */
const readingMinutes = (body = '') => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));

function complete(entry: CollectionEntry<'articles'>, all: CollectionEntry<'articles'>[]) {
  const { data, id } = entry;
  const language = data.language;

  // A pasta é o assunto (notebook/<assunto>/<slug>); mover o artigo e esquecer o front matter
  // (ou o contrário) desorganizaria o caderno sem nenhum aviso.
  const parts = id.split('/');
  const locale = parts.length >= 4 && ['en', 'pt-br'].includes(parts.at(-1)!) ? parts.pop() : undefined;
  const folder = parts.at(-2);
  if (locale && locale !== (language === 'en' ? 'en' : 'pt-br')) {
    throw new Error(`contents/${id}: language does not match its locale folder`);
  }
  if (folder !== data.topic) {
    throw new Error(`contents/${id}: está na pasta "${folder}", mas o front matter diz topic: "${data.topic}"`);
  }

  const canonical = data.canonical ?? `${site.origin}${articleUrl(entry)}`;
  const alternates = articleAlternates(entry, all);
  const topic = topics.find((item) => item.slug === data.topic);
  const published = data.published ?? data.date;

  return {
    ...entry,
    data: {
      ...data,
      language,
      canonical,
      alternates,
      published,
      displayDate: data.displayDate ?? formatDate(published, interfaceLanguage),
      topicLabel: data.topicLabel ?? (topic ? topicName(topic) : data.topic),
      readingMinutes: data.readingMinutes ?? readingMinutes(entry.body),
    },
  };
}

export async function getArticles(filter?: (article: ReturnType<typeof complete>) => boolean) {
  const all = await getCollection('articles');
  const articles = all.map((entry) => complete(entry, all));
  return filter ? articles.filter(filter) : articles;
}

export type Article = Awaited<ReturnType<typeof getArticles>>[number];
