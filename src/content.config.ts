import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { gameSlugs } from './data/games';

/** One Markdown file per update in contents/game-journal/<game>/ (see docs/game-journal.md). */
const gameJournal = defineCollection({
  loader: glob({
    base: './contents/game-journal',
    pattern: '**/*.md',
  }),
  schema: z.object({
    game: z.enum(gameSlugs),
    title: z.string().min(1),
    date: z.coerce.date(),
    version: z.string().optional(),
    summary: z.string().min(1),
    draft: z.boolean().default(false),
  }),
});

export const collections = { gameJournal };
