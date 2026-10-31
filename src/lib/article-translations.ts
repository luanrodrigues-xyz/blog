import { articleSlug, articleUrl, site, type Language } from '../config/site';

type TranslationArticle = {
  id: string;
  data: {
    language: Language;
    topic: string;
    draft?: boolean;
    canonical?: string;
    translationKey?: string;
    urlSlug?: string;
    alternates?: { language: string; url: string }[];
  };
};

const keyOf = (article: TranslationArticle) =>
  `${article.data.topic}/${
    article.data.translationKey ??
    (article.data.language === 'pt-BR' ? articleSlug(article.id).replace(/-pt$/, '') : articleSlug(article.id))
  }`;
const alternateOf = (article: TranslationArticle) => ({
  language: article.data.language,
  url: article.data.canonical ?? `${site.origin}${articleUrl(article)}`,
});

/** Resolve pares antes dos filtros de listagem, sem expor traduções em rascunho. */
export function articleAlternates(article: TranslationArticle, all: TranslationArticle[]) {
  if (article.data.alternates) return article.data.alternates;
  const translations = all.filter(
    (candidate) => candidate.id !== article.id && !candidate.data.draft && keyOf(candidate) === keyOf(article),
  );
  const languages = new Set<Language>([article.data.language]);
  for (const translation of translations) {
    if (languages.has(translation.data.language)) {
      throw new Error(`Ambiguous translation for ${article.id}: ${translation.id}`);
    }
    languages.add(translation.data.language);
  }
  return [alternateOf(article), ...translations.map(alternateOf)];
}
