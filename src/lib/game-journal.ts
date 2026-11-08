import type { CollectionEntry } from 'astro:content';

export function gameJournalUrl(entry: CollectionEntry<'gameJournal'>): string {
  const slug = entry.id.split('/').at(-1);
  return `/games/${entry.data.game}/journal/${slug}/`;
}
