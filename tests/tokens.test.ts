import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Silicon City palette (src/styles/tokens.css): every text pair the components use must pass WCAG AA.
const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/g)].map((m) => [m[1], m[2]]));

const rgb = (hex: string): number[] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(rgb(tokens[a])), lum(rgb(tokens[b]))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** [text, background] pairs, as used in components.css and the layout. */
const textPairs: [string, string][] = [
  ['ink', 'paper'],
  ['ink', 'paper-raised'],
  ['ink', 'concrete-light'],
  ['ink', 'concrete'],
  ['ink', 'orange'],
  ['ink', 'peach'],
  ['ink', 'khaki'],
  ['muted', 'paper'],
  ['muted', 'concrete-light'],
  ['link-hover', 'paper'],
  ['paper', 'ink'],
  ['on-ink-muted', 'ink'],
  ['orange', 'ink'],
  ['paper-raised', 'plum'],
  ['peach', 'plum'],
  ['paper-raised', 'green'],
];

describe('design tokens', () => {
  it('defines every colour the components rely on', () => {
    for (const name of new Set(textPairs.flat())) expect(tokens[name], name).toMatch(/^#[0-9a-f]{6}$/);
  });

  it.each(textPairs)('%s on %s reaches 4.5:1', (text, background) => {
    expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
  });
});
