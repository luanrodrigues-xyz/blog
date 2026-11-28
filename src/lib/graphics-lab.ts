/** Candidate tiles for a half-open dirty rectangle inside a square canvas. */
export function dirtyTiles(size: number, tile: number, x: number, y: number, width: number, height: number) {
  if (size <= 0 || tile <= 0 || width <= 0 || height <= 0) return [];
  const left = Math.max(0, x), top = Math.max(0, y);
  const right = Math.min(size, x + width), bottom = Math.min(size, y + height);
  if (right <= left || bottom <= top) return [];
  const cells: { x: number; y: number; width: number; height: number }[] = [];
  for (let row = Math.floor(top / tile); row < Math.ceil(bottom / tile); row++) {
    for (let col = Math.floor(left / tile); col < Math.ceil(right / tile); col++) {
      cells.push({ x: col * tile, y: row * tile, width: Math.min(tile, size - col * tile), height: Math.min(tile, size - row * tile) });
    }
  }
  return cells;
}

export type Point = readonly [number, number];

/** Signed shoelace area; sign depends on coordinate orientation. */
export function signedArea(points: readonly Point[]) {
  let twice = 0;
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[(i + 1) % points.length];
    twice += x * ny - nx * y;
  }
  return twice / 2;
}
