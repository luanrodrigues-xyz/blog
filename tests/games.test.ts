import { describe, expect, it } from 'vitest';
import { gameSlugs, games, gameUrl } from '../src/data/games';

describe('game catalogue', () => {
  it('lists each journal slug exactly once, in the same order', () => {
    expect(games.map(({ slug }) => slug)).toEqual([...gameSlugs]);
  });

  it('gives every game a page URL, status, technologies and three mechanics', () => {
    for (const game of games) {
      expect(gameUrl(game)).toBe(`/games/${game.slug}/`);
      expect(game.status).not.toBe('');
      expect(game.technologies.length).toBeGreaterThan(0);
      expect(game.mechanics).toHaveLength(3);
    }
  });

  it('only links to playable builds over https', () => {
    for (const game of games.filter(({ playUrl }) => playUrl)) expect(game.playUrl).toMatch(/^https:\/\//);
  });
});
