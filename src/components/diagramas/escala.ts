// Figuras "em escala": as medidas vêm de pontos reais do exemplo, com uma única escala por figura.
// O que depende de fonte (largura de texto, quebra de linha) continua esquemático e é marcado com <Escala>.

/** Converte pontos em unidades do desenho: `const { pt } = escala(2.45)` → `pt(12)` = 29.4. */
export function escala(unidadesPorPt: number) {
  const pt = (valor: number) => Math.round(valor * unidadesPorPt * 100) / 100;
  return { pt };
}

const pct = (n: number) => `${Math.round(n * 10000) / 100}%`;

/**
 * `clip-path` (evenodd) do anel de padding: a hachura só existe entre a caixa externa (w × h) e a
 * caixa interna, afastada `horizontal` e `vertical` unidades de cada borda.
 */
export function anelDePadding(w: number, h: number, horizontal: number, vertical = horizontal) {
  const x1 = pct(horizontal / w);
  const x2 = pct(1 - horizontal / w);
  const y1 = pct(vertical / h);
  const y2 = pct(1 - vertical / h);
  return `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${x1} ${y1}, ${x1} ${y2}, ${x2} ${y2}, ${x2} ${y1}, ${x1} ${y1})`;
}
