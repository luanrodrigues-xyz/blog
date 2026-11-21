# Art by Luan — luanrodrigues.xyz

Portfolio of Luan Rodrigues: concept art, 2D illustration and independent games.
Built with Astro and published on GitHub Pages.

[Site](https://luanrodrigues.xyz) · [Instagram](https://www.instagram.com/artbyluan/) · [GitHub](https://github.com/luanrodrigues-xyz) · [LinkedIn](https://www.linkedin.com/in/luanrodrigues-xyz/)

## Rodar localmente

Requer Node.js 22.12 ou superior.

```sh
npm ci
npm run dev
```

## Comandos

```sh
npm run build          # gera e valida o site em dist/
npm run preview        # abre o build local
npm test               # testes
npm run check          # verificação Astro e TypeScript
npm run lint           # ESLint
npm run test:browser   # overflow, h1 e alvos de toque em 320/390/1280 px (depois do build)
```

## Estrutura

- `src/data/`: jogos, artes e produtos — é aqui que o conteúdo do site muda.
- `src/styles/`: o design system "Silicon City" (tokens, base e componentes).
- `src/components/`, `src/pages/`: componentes e rotas.
- `src/assets/art/`: ilustrações otimizadas pelo Astro.
- `contents/game-journal/`: diário de desenvolvimento dos jogos, em Markdown.
- `scripts/` e `tests/`: ferramentas e testes.

## Documentação

- [Rotas, design system e publicação](docs/site.md)
- [Diário de desenvolvimento dos jogos](docs/game-journal.md)
- [Analytics](docs/analytics.md)
