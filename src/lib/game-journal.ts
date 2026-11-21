import { getCollection, type CollectionEntry } from 'astro:content';
import type { GameSlug } from '../data/games';

export function gameJournalUrl(entry: CollectionEntry<'gameJournal'>): string {
  const slug = entry.id.split('/').at(-1);
  return `/games/${entry.data.game}/journal/${slug}/`;
}

/** Published entries of one game, newest first. */
export async function publishedJournal(game: GameSlug): Promise<CollectionEntry<'gameJournal'>[]> {
  const entries = await getCollection('gameJournal', ({ data }) => !data.draft && data.game === game);
  return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
