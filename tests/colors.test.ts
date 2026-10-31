import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Paleta de sistema da Apple em src/styles/colors.css: quatro modos completos e texto legível.
const css = readFileSync(new URL('../src/styles/colors.css', import.meta.url), 'utf8');
const COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'mint',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'purple',
  'pink',
  'brown',
];
const GRAYS = ['gray', 'gray2', 'gray3', 'gray4', 'gray5', 'gray6'];

type Mode = Record<string, string>;
const blocks: Mode[] = [...css.matchAll(/:root \{([^}]*)\}/g)].map((m) =>
  Object.fromEntries([...m[1].matchAll(/--apple-([a-z0-9-]+):\s*(#[0-9a-f]{6});/g)].map((d) => [d[1], d[2]])),
);
const modes: Record<string, Mode> = { light: blocks[0], dark: blocks[1], lightMore: blocks[2], darkMore: blocks[3] };

const rgb = (hex: string): number[] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a: number[], b: number[]) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const mix = (fg: number[], bg: number[], a: number) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));

describe('paleta de sistema da Apple', () => {
  it('tem os quatro modos, cada um com as 12 cores, os 6 cinzas e as variantes de texto', () => {
    expect(blocks).toHaveLength(4);
    for (const [name, mode] of Object.entries(modes)) {
      for (const token of [...COLORS, ...GRAYS, 'gray-text', ...COLORS.map((c) => `${c}-text`)]) {
        expect(mode[token], `${name}: --apple-${token}`).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it('usa os valores da tabela da Apple (amostra: azul e índigo nos quatro modos)', () => {
    expect([modes.light.blue, modes.dark.blue, modes.lightMore.blue, modes.darkMore.blue]).toEqual([
      '#0088ff',
      '#0091ff',
      '#1e6ef4',
      '#5cb8ff',
    ]);
    expect([modes.light.indigo, modes.dark.indigo, modes.lightMore.indigo, modes.darkMore.indigo]).toEqual([
      '#6155f5',
      '#6d7cff',
      '#564ade',
      '#a7aaff',
    ]);
  });

  // Fundos de cada modo: o base, o alternativo (gray6) e a cápsula da própria cor.
  const setup: Record<string, { base: string; alt: string; alpha: number; min: number }> = {
    light: { base: '#ffffff', alt: '#f2f2f7', alpha: 0.12, min: 4.5 },
    dark: { base: '#000000', alt: '#1c1c1e', alpha: 0.2, min: 4.5 },
    lightMore: { base: '#ffffff', alt: '#ebebf0', alpha: 0.14, min: 6 },
    darkMore: { base: '#000000', alt: '#1c1c1e', alpha: 0.24, min: 6 },
  };
  for (const [name, mode] of Object.entries(modes)) {
    it(`as variantes -text passam o contraste no modo ${name}`, () => {
      const { base, alt, alpha, min } = setup[name];
      for (const color of COLORS) {
        const text = rgb(mode[`${color}-text`]);
        const capsule = mix(rgb(mode[color]), rgb(alt), alpha);
        for (const [onde, fundo] of [
          ['fundo', rgb(base)],
          ['fundo alternativo', rgb(alt)],
          ['cápsula', capsule],
        ] as const) {
          expect(contrast(text, fundo), `${name}: ${color}-text sobre ${onde}`).toBeGreaterThanOrEqual(min);
        }
      }
      const cinza = rgb(mode['gray-text']);
      expect(contrast(cinza, rgb(base))).toBeGreaterThanOrEqual(min);
      expect(contrast(cinza, rgb(alt))).toBeGreaterThanOrEqual(min);
    });
  }
});
