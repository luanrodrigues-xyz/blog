# luanrodrigues.xyz

Caderno público de engenharia: computação gráfica, programação de sistemas, jogos, WebAssembly, geometria computacional e performance.
Feito com Astro, Markdown e MDX.

O site é publicado pelo GitHub Pages.

[Site](https://luanrodrigues.xyz) · [YouTube](https://www.youtube.com/@iosgamecraft) · [GitHub](https://github.com/luanrodrigues-xyz) · [LinkedIn](https://www.linkedin.com/in/luanrodrigues-xyz/)

## Rodar localmente

Requer Node.js 22.12 ou superior.

```sh
npm ci
npm run dev
```

## Comandos

```sh
npm run build     # gera e valida o site em dist/
npm run preview   # abre o build local
npm test          # testes
npm run check     # verificação Astro e TypeScript
npm run lint      # ESLint
```

## Estrutura

- `contents/`: páginas e artigos em Markdown e MDX.
- `src/`: componentes, rotas, estilos e configuração do site.
- `scripts/` e `tests/`: ferramentas e testes.
- `docs/`: documentação do site.

## Linha editorial

- [Plano editorial e experimentos](docs/editorial.md)
- O laboratório é acessível em `/lab/`.

## Documentação

- [Funcionamento e publicação do site](docs/site.md)
- [Analytics](docs/analytics.md)
