// Consistência visual dos diagramas (guia: editorial/guia-diagramas.md, "Layout" e "Tipografia").
// O build só confere o aria-label; isto pega o que faz um desenho parecer "bagunçado":
// Raios discretos são permitidos: o guia atual não exige raio proporcional.
//   - font-size fora dos tokens --f-num, --f-texto e --f-rotulo;
//   - cor solta (hex, rgb, hsl) fora de Diagrama.astro: as cores são tokens --d-…;
//   - bordas visíveis quase alinhadas (1 a 6 unidades de diferença, mas não iguais).
// npm run auditar-diagramas   (sai com código 1 se achar algo)
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'components', 'diagramas');
const BASE = new Set(['Diagrama', 'Seta']);
const VISIVEL = /\b(nodo|celula|regiao|hachura|papel|fundo|contorno|interno|lista|estreita)\b/;
const LADOS = {
  esquerda: (c) => c.x,
  direita: (c) => c.x + c.w,
  topo: (c) => c.y,
  base: (c) => c.y + c.h,
};

/** Achados de um componente; `s` é o código-fonte do `.astro`. */
export function auditar(nome, s) {
  const achados = [];
  const linhas = s.split('\n');
  linhas.forEach((linha, i) => {
    const onde = `${nome}:${i + 1}`;
    if (nome !== 'Diagrama.astro' && /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(linha)) {
      achados.push(`${onde}: cor solta (${linha.trim()}); use um token --d-… de Diagrama.astro`);
    }
    if (
      /font-size:/.test(linha) &&
      !/var\(--f-(num|texto|rotulo)\)|0\.5em|--f-/.test(linha) &&
      !linha.includes('--f-')
    ) {
      if (nome !== 'Diagrama.astro' || !/clamp\(/.test(linha))
        achados.push(`${onde}: font-size fora dos tokens (${linha.trim()})`);
    }
  });

  const caixas = [];
  for (const m of s.matchAll(/<(?:div|span)\s+class="([^"]*)"\s+style="([^"]*--x:[^"]*)"/g)) {
    if (!VISIVEL.test(m[1])) continue;
    const g = (k) => Number(new RegExp(`--${k}:\\s*(-?[\\d.]+)`).exec(m[2])?.[1]);
    const c = { x: g('x'), y: g('y'), w: g('w'), h: g('h') };
    if (Object.values(c).every(Number.isFinite)) caixas.push(c);
  }
  for (const [lado, borda] of Object.entries(LADOS)) {
    for (let i = 0; i < caixas.length; i++) {
      for (let j = i + 1; j < caixas.length; j++) {
        const d = Math.abs(borda(caixas[i]) - borda(caixas[j]));
        if (d > 0 && d <= 6)
          achados.push(`${nome}: borda ${lado} quase alinhada (${borda(caixas[i])} e ${borda(caixas[j])})`);
      }
    }
  }
  return achados;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const achados = readdirSync(DIR)
    .filter((f) => (f.endsWith('.astro') && !BASE.has(f.replace('.astro', ''))) || f === 'Diagrama.astro')
    .flatMap((f) => auditar(f, readFileSync(join(DIR, f), 'utf8')));
  if (achados.length) {
    console.error(achados.map((a) => `- ${a}`).join('\n'));
    console.error(`\n${achados.length} ponto(s) para revisar em src/components/diagramas/.`);
    process.exit(1);
  }
  console.log('Diagramas: fontes e cores nos tokens, bordas alinhadas.');
}
