import { describe, expect, it } from 'vitest';
import { dirtyTiles, signedArea } from '../src/lib/graphics-lab';

describe('graphics lab', () => {
  it('does not invalidate neighboring tiles at a half-open edge', () => {
    expect(dirtyTiles(512, 128, 0, 0, 128, 128)).toEqual([{ x: 0, y: 0, width: 128, height: 128 }]);
  });
  it('clips dirty bounds to the canvas', () => {
    expect(dirtyTiles(512, 128, 500, 500, 100, 100)).toEqual([{ x: 384, y: 384, width: 128, height: 128 }]);
    expect(dirtyTiles(512, 128, 512, 0, 10, 10)).toEqual([]);
  });
  it('counts candidates at a crossing', () => {
    expect(dirtyTiles(512, 128, 64, 205, 150, 105)).toHaveLength(4);
  });
  it('preserves absolute area when winding changes', () => {
    const triangle = [[0, 0], [4, 0], [0, 3]] as const;
    expect(signedArea(triangle)).toBe(6);
    expect(signedArea([...triangle].reverse())).toBe(-6);
    expect(signedArea([])).toBe(0);
  });
});
