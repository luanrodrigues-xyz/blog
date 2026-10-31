import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { auditArticle, findArticle, inspectSource } from '../scripts/audit-editorial.mjs';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'editorial-'));
  roots.push(root);
  const file = join(root, 'contents/notebook/ia/exemplo/index.mdx');
  mkdirSync(join(file, '..'), { recursive: true });
  return { root, file };
}

describe('triagem editorial', () => {
  it('conta somente prosa, inclusive em legendas, preservando expressões entre marcas Markdown', () => {
    const result = inspectSource(`---
title: decide
---

import decide from './decide.png';

> decide dono

\`decide\` e “decide” e "dono".

~~~swift
let decide = "dono"
~~~

<Diagrama rotulo="decide dono">

Decide; continua **sendo**. Não muda. Dono.

</Diagrama>
`);
    expect(result.vocabulary.map(({ count }) => count)).toEqual([1, 1, 1, 1]);
    expect(result.imports).toEqual([{ source: './decide.png', line: 5 }]);
  });

  it('alerta por expressão, sem somar termos diferentes ou flexões', () => {
    const result = inspectSource(
      'Decide decide decide decide decide. Decidir decisão decididamente. Dono dono dono dono.',
    );
    expect(result.vocabulary[0]).toMatchObject({ count: 5, review: true });
    expect(result.vocabulary[1]).toMatchObject({ count: 4, review: false });
  });

  it('não transforma registro ou teste existente em evidência aprovada e não confunde negação com sucesso', () => {
    const { root, file } = fixture();
    writeFileSync(file, 'Não executei os testes.\n\nOs seis testes passaram.');
    const example = join(root, 'examples/ia/exemplo');
    mkdirSync(join(example, 'Tests'), { recursive: true });
    writeFileSync(join(example, 'VALIDACAO.md'), 'Execução antiga, sem resultado.');
    writeFileSync(join(example, 'Tests/ExemploTests.swift'), '@Test func exemplo() {}');
    const report = auditArticle(file, root);
    expect(report.claims).toHaveLength(2);
    expect(report.claims.every((claim) => claim.status === 'conferir evidência e contexto')).toBe(true);
    expect(report.evidence.records).toHaveLength(1);
    expect(report.evidence.tests).toHaveLength(1);
    expect(report.evidence.status).toContain('pendente');
    expect(report.checks.visual).toContain('não inspecionado');
  });

  it('preserva valores e aspas do relato para permitir a comparação com o registro', () => {
    const result = inspectSource('O modelo devolveu `centavos 0` e "Receita".');
    expect(result.claims[0].text).toBe('O modelo devolveu `centavos 0` e "Receita".');
  });

  it('resolve imports multilinha a partir do artigo e detecta arquivos ausentes', () => {
    const { root, file } = fixture();
    writeFileSync(
      file,
      `import {
  Figura
} from './figura.astro';

import './ausente.css';

import externo from '@alias/externo';

![Outra figura](outra.png)
`,
    );
    writeFileSync(join(file, '../figura.astro'), '<figure />');
    const report = auditArticle(file, root);
    expect(report.imports.map(({ line }) => line)).toEqual([1, 5, 7]);
    expect(report.assets.map(({ status }) => status)).toEqual(['existe', 'ausente', 'não verificado', 'ausente']);
  });

  it('localiza rascunhos e rejeita slug ausente ou ambíguo', () => {
    const { root, file } = fixture();
    writeFileSync(file, '---\ndraft: true\n---\n');
    expect(findArticle('exemplo', root)).toBe(file);
    expect(() => findArticle('ausente', root)).toThrow('encontrei 0');
    const other = join(root, 'contents/notebook/swiftui/exemplo');
    mkdirSync(other, { recursive: true });
    writeFileSync(join(other, 'index.md'), 'Texto');
    expect(() => findArticle('exemplo', root)).toThrow('encontrei 2');
  });
});
