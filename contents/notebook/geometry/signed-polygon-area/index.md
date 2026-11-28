---
title: "Área orientada e a ordem dos vértices de um polígono"
description: "A fórmula de Shoelace, o sinal da área e o cuidado com a orientação do sistema de coordenadas."
date: "2026-11-28"
topic: "geometry"
areas: ["geometry", "wasm"]
readingOrder: 1
draft: false
tags: ["Geometry", "TypeScript", "C++", "Algorithms"]
language: "pt-BR"
---

Em um editor de formas ou jogo geométrico, dois polígonos podem representar exatamente a mesma região mesmo que os vértices sejam percorridos em ordens opostas. A área absoluta é a mesma; a área orientada muda de sinal.

## A fórmula

A fórmula de Shoelace soma o determinante de cada par de vértices consecutivos, incluindo a aresta que fecha o polígono. Para um polígono simples, a metade do módulo dessa soma é sua área.

Uma implementação em TypeScript:

```ts
type Point = readonly [number, number];

function signedArea(points: readonly Point[]): number {
  let twiceArea = 0;
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[(i + 1) % points.length];
    twiceArea += x * ny - nx * y;
  }
  return twiceArea / 2;
}
```

## Coordenadas de tela

Em coordenadas cartesianas com Y crescente para cima, o sinal positivo corresponde à orientação anti-horária. Em coordenadas de tela com Y crescente para baixo, a interpretação visual é invertida.

O [Polygon Lab](/lab/#polygon) permite mover um vértice e inverter a ordem de percurso sem alterar a região representada.

## Limites da operação

Área igual não implica formas iguais: dois polígonos diferentes podem ter exatamente a mesma área. Também não basta somar áreas para validar uma montagem quando há sobreposição ou lacunas. Uma validação geométrica completa exige operações adicionais e tratamento de tolerâncias numéricas.

A implementação usa números de ponto flutuante do JavaScript; não há aqui uma comparação de precisão ou desempenho com C++ e WebAssembly.
