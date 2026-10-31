import { describe, expect, it } from 'vitest';
import { auditar } from '../scripts/audit-diagrams.mjs';

describe('auditoria dos diagramas', () => {
  it('aceita raio proporcional, fonte em token e bordas alinhadas', () => {
    const fonte = `<div class="no celula" style="--x:20; --y:100; --w:200; --h:64"></div>
<div class="no celula" style="--x:300; --y:100; --w:200; --h:64"></div>
<style>.a { font-size: var(--f-texto); border-radius: 999px; }</style>`;
    expect(auditar('Ok.astro', fonte)).toEqual([]);
  });

  it('aceita raio discreto e acusa fonte fora dos tokens e bordas quase alinhadas', () => {
    const fonte = `<div class="no celula" style="--x:20; --y:488; --w:200; --h:64"></div>
<div class="no celula" style="--x:300; --y:492; --w:200; --h:56"></div>
<style>.a { border-radius: 8px; font-size: 18px; color: #0088ff; }</style>`;
    const achados: string[] = auditar('Ruim.astro', fonte);
    expect(achados.some((a) => a.includes('raio de 8px'))).toBe(false);
    expect(achados.some((a) => a.includes('font-size fora dos tokens'))).toBe(true);
    expect(achados.some((a) => a.includes('cor solta'))).toBe(true);
    expect(achados.filter((a) => a.includes('quase alinhada'))).toHaveLength(2);
  });
});
