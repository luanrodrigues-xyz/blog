# From code to pixels

O blog é um caderno de estudos, não um catálogo de produtos. A interface permanece em inglês; artigos podem ser em português ou inglês. Não inventar experiências, números de performance ou resultados de testes.

## Áreas

- `systems` — Systems Programming: C++20, ownership, memory layout, concurrency and native interoperability.
- `graphics` — Computer Graphics: GPU pipelines, rasterization, shaders, Metal and Swift.
- `games` — Game Development: SDL3, game loops, physics, collisions and cameras.
- `wasm` — WebAssembly: C++, Emscripten, TypeScript and the browser runtime.
- `geometry` — Computational Geometry: Polygons, intersections, transformations and numerical precision.
- `performance` — Performance Engineering: Profiling, benchmarks, memory bandwidth and cache locality.

## Formatos

- Notas: dúvida concreta, explicação, fontes e limitações.
- Deep dives: modelo técnico, código, diagramas, hipóteses e evidências.
- Lab: experimento reproduzível, controles, resultado observável e escopo.

## Backlog inicial

1. Pipeline gráfico e arquitetura de GPU: tile-based deferred rendering, memória unificada e comunicação CPU/GPU.
2. C++ e SDL3: game loop, timestep fixo, colisão e câmera.
3. C++ + WebAssembly + TypeScript: memória linear, fronteira JS/Wasm, geometria no navegador e benchmark controlado.
4. Matemática: vetores, matrizes, área orientada, interseções, curvas e robustez numérica.
5. Swift + Metal: criação de buffers, command buffers, sincronização e profiling em hardware Apple.

## Fluxo

Registrar a dúvida, consultar fontes primárias, construir um pequeno exemplo, verificar o comportamento, escrever, revisar e publicar. O código e medições devem ser reproduzíveis; declarar dispositivo, compilador e condições de teste quando aplicável.

O Lab começa com Raster Playground e Polygon Lab em TypeScript. Eles são modelos didáticos e não benchmarks de GPU ou Wasm. Physics Sandbox e Shader Playground ficam no backlog. A ferramenta histórica de exemplos Swift continua disponível; exemplos C++/Wasm/Metal precisam de seus próprios processos de build e validação.
