export const site = {
  name: 'Luan Rodrigues',
  brand: 'Luan Rodrigues',
  origin: 'https://luanrodrigues.xyz',
  author: 'Luan Rodrigues',
  avatar: '/brand/swift-decodificado.png',
  /** Canais públicos, usados no rodapé e na página 404. */
  links: [
    { label: 'GitHub', href: 'https://github.com/luanrodrigues-xyz' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/luanrodrigues-xyz/' },
  ],
};

/** Feature flags: seções ainda em preparação ficam fora da navegação e não geram página. */
export const features = {
  lab: false,
};

export const languages = ['pt-BR', 'en'] as const;
export type Language = (typeof languages)[number];

/**
 * Idioma da interface (navegação, rótulos, datas, categorias): sempre inglês, independente do
 * idioma do conteúdo editorial de cada artigo. Não existe uma UI em português.
 */
export const interfaceLanguage: Language = 'en';

/**
 * Quando um artigo existe nos dois idiomas, qual versão aparece como o card nas listagens
 * (Caderno, categorias, home). Usado só por `isListed` em `lib/topics.ts`. A outra versão fica
 * acessível pelo botão de idioma dentro do próprio artigo, não como um card à parte.
 */
export const defaultArticleLanguage: Language = 'pt-BR';

/** Textos e rotas fixas da interface. O conteúdo editorial (título, descrição, corpo) continua no idioma do artigo. */
export const ui = {
  skip: 'Skip to content',
  home: 'Home',
  homeUrl: '/',
  about: 'About',
  aboutUrl: '/about/',
  notebook: 'Notebook',
  navigation: 'Main navigation',
  channels: 'Channels',
  latest: 'Recent articles',
  tagsLabel: 'Article tags',
  topicTags: 'Tags in this category',
  breadcrumb: 'Breadcrumb',
  previous: 'Previous',
  next: 'Next',
  read: 'Read the post',
  notes: 'articles',
  fromNotes: 'Revised from my study notes in Obsidian.',
  notesOne: 'article',
  notFound: 'This page could not be found.',
  articles: 'Writing',
  games: 'Games',
  gamesUrl: '/games/',
  articlesUrl: '/articles/',
  allArticles: 'View all articles',
  lab: 'Lab',
  labUrl: '/lab/',
  viewOnGitHub: 'View on GitHub',
  categories: 'Categories',
  category: 'Category',
};

export function languageOf(value: string | undefined): Language {
  return value === 'en' ? 'en' : 'pt-BR';
}

export function formatDate(value: Date | undefined, language: Language, fallback = ''): string {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'pt-BR', {
    timeZone: 'UTC',
    year: 'numeric',
    month: language === 'en' ? 'short' : '2-digit',
    day: language === 'en' ? 'numeric' : '2-digit',
  }).format(value);
}

/**
 * Rota pública de um artigo: inglês em /articles/<slug>/, português em /articles/pt/<slug>/.
 * O idioma vem do metadado do artigo (`language`), nunca de inspecionar o slug.
 */
export function articlePath(language: Language, slug: string): string {
  return language === 'en' ? `/articles/${slug}/` : `/articles/pt/${slug}/`;
}

export function articleSlug(id: string): string {
  const parts = id.split('/');
  if (parts.length >= 4 && ['en', 'pt-br'].includes(parts.at(-1)!)) parts.pop();
  return parts.at(-1)!;
}

export function articleUrl(article: { id: string; data: { language: Language; urlSlug?: string } }): string {
  return articlePath(article.data.language, article.data.urlSlug ?? articleSlug(article.id));
}

/** Rota de uma sitePage fora do esquema de artigos (Home, Sobre): o id já é o próprio caminho. */
export function routeOf(id: string): string {
  return id === 'index' ? '/' : `/${id}/`;
}
