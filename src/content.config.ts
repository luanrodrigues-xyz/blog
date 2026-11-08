import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({
    base: './contents',
    pattern: ['notebook/*/*/index.{md,mdx}', 'notebook/*/*/{en,pt-br}/index.{md,mdx}'],
    generateId: ({ entry }) => entry.replace(/\/index\.mdx?$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    topic: z.string(),
    areas: z
      .array(z.enum(['frontend', 'backend', 'ios']))
      .min(1)
      .optional(),
    draft: z.boolean().default(false),
    readingOrder: z.number().int(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    // Texto que começou nas notas de estudo do Obsidian e foi revisado para o site.
    notasDeEstudo: z.boolean().default(false),
    language: z.enum(['pt-BR', 'en']),
    translationKey: z.string().min(1).optional(),
    urlSlug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      .optional(),
    canonical: z.string().optional(),
    topicLabel: z.string().optional(),
    published: z.coerce.date().optional(),
    readingMinutes: z.number().int().optional(),
    displayDate: z.string().optional(),
    alternates: z.array(z.object({ language: z.string(), url: z.string() })).optional(),
  }),
});

const pageSchema = z.looseObject({
  title: z.string().optional(),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),
  topic: z.string().optional(),
  format: z.string().optional(),
  status: z.string().optional(),
  draft: z.boolean().optional(),
  readingOrder: z.number().int().optional(),
  breadcrumb: z.string().optional(),
  tags: z.array(z.string()).optional(),
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
  coverUrl: z.string().optional(),
  photo: z.string().optional(),
  photoAlt: z.string().optional(),
  language: z.enum(['pt-BR', 'en']).optional(),
  canonical: z.string().optional(),
  topicLabel: z.string().optional(),
  published: z.coerce.date().optional(),
  readingMinutes: z.number().int().optional(),
  displayDate: z.string().optional(),
  languageUrl: z.string().optional(),
  otherLanguage: z.string().optional(),
  otherLanguageLabel: z.string().optional(),
  alternates: z.array(z.object({ language: z.string(), url: z.string() })).optional(),
  ogType: z.string().optional(),
  heroTitle: z.string().optional(),
  intro: z.string().optional(),
  introDetail: z.string().optional(),
  isHome: z.boolean().optional(),
  isAbout: z.boolean().optional(),
  isLab: z.boolean().optional(),
  isPortuguese: z.boolean().optional(),
  noindex: z.boolean().optional(),
  code: z.number().int().optional(),
});

const sitePages = defineCollection({
  loader: glob({
    base: './contents',
    pattern: ['**/index.{md,mdx}', '!notebook/**'],
    generateId: ({ entry }) => entry.replace(/\/index\.mdx?$/, ''),
  }),
  schema: pageSchema,
});

const gameJournal = defineCollection({
  loader: glob({
    base: './contents/game-journal',
    pattern: '**/*.md',
  }),
  schema: z.object({
    game: z.enum(['tessora', 'ruptura', 'deploy-ou-ruina']),
    title: z.string().min(1),
    date: z.coerce.date(),
    version: z.string().optional(),
    summary: z.string().min(1),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles, sitePages, gameJournal };
