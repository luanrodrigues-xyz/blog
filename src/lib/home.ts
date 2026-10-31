import { getArticles } from './articles';
import { availableCategories, publications } from './topics';

/** Quantos artigos recentes aparecem na home. */
const HOME_LATEST_COUNT = 4;

/** A home e o catálogo compartilham a mesma seleção de publicações, dos dois idiomas editoriais. */
export async function homeContent() {
  const articles = publications(await getArticles());
  return {
    articles,
    latest: articles.slice(0, HOME_LATEST_COUNT),
    categories: availableCategories(articles),
  };
}
