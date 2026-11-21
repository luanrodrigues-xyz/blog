# Rotas, design system e publicação

[Voltar ao README](../README.md)

## Rotas

A interface é uma só, em inglês.

| Página          | URL                                  | Fonte                                   |
| --------------- | ------------------------------------ | --------------------------------------- |
| Home            | `/`                                  | `src/pages/index.astro`                 |
| Art             | `/art/`                              | `src/data/art.ts`                       |
| Games           | `/games/`                            | `src/data/games.ts`                     |
| Jogo            | `/games/<slug>/`                     | `src/data/games.ts`                     |
| Diário          | `/games/<slug>/journal/[<entrada>/]` | `contents/game-journal/` (veja [game-journal.md](game-journal.md)) |
| Shop            | `/shop/`                             | `src/data/shop.ts`                      |
| About           | `/about/`                            | `src/pages/about.astro`                 |

O site foi um blog técnico até novembro de 2026. Os artigos foram removidos; `/articles/` e `/artigos/`
redirecionam para a home e `/sobre/` para `/about/` (`astro.config.mjs`). URLs de artigos individuais
caem na página 404, que explica a mudança.

O build (`src/integrations/check-site.mjs`) falha quando uma página publicada tem link local ou âncora
quebrada, imagem sem `alt`, mais de um `h1`, canonical errado, sitemap divergente ou um marcador de
rascunho como `[YOUR …]`, `TODO:` ou `FIXME`.

## Design system "Silicon City"

Tudo vem da ilustração principal (`src/assets/art/silicon-city.webp`): papel quente, cinza de concreto,
um laranja forte e traço de tinta grosso. O visual deve parecer impresso, não brilhante.

- **Tokens** — `src/styles/tokens.css`. Cores (`--ink`, `--paper`, `--orange`, `--peach`, `--plum`,
  `--khaki`, `--concrete`…), fontes, contornos, sombras, raios e espaçamentos. Os pares de texto e fundo
  são testados para contraste AA em `tests/tokens.test.ts`: uma cor nova usada em texto entra nessa lista.
- **Tipografia** — Anton (títulos, sempre em caixa alta), Archivo (texto) e JetBrains Mono (rótulos
  `// SEÇÃO`, chips de tecnologia e o selo `</>`), carregadas do Google Fonts em `BaseLayout.astro`.
- **Regras** — contorno de 3px em todo card, botão e painel (4px na arte de destaque); sombra dura sem
  desfoque (4/6/8/12px); inclinação de 1–3° só em adesivos, balões e painéis de destaque; textura de
  retícula (`.dots`), nunca degradê.
- **Componentes** — `src/styles/components.css`: `.section`, `.split`, `.grid`, `.eyebrow`, `.highlight`,
  `.sticker`, `.bubble`, `.btn` (`--primary`, `--small`, `--row`), `.badge` (`--playable`, `--prototype`,
  `--visual`), `.chip`, `.pills`, `.card`, `.panel` (`--hero`, `--flat` e uma cor), `.ticker`, `.entry-list`,
  `.steps` (componente `Steps.astro`, para processos e mecânicas), `.counter-list`, `.stamp` e `.prose`
  (num post do diário, um `> bloco de citação` vira um balão de nota).

O canvas de design de referência (home, todas as páginas internas e o guia de estilo) fica nos Artifacts do claude.ai.

## Arte e imagens

Arte finalizada entra em `src/assets/art/` e é referenciada em `src/data/art.ts`; o Astro gera as versões
WebP responsivas. As "prateleiras" do mural sem imagem levam ao Instagram até a arte ser publicada aqui.
`public/og-default.png` (1200×630), `favicon.svg`, `favicon-32.png` e `apple-touch-icon.png` foram gerados
a partir da ilustração e do selo `</>`.

## Publicação

O workflow `.github/workflows/pages.yml` usa Node.js 24, instala as dependências com
`npm ci --ignore-scripts`, executa os testes e gera `dist/`. Pull requests validam o site;
pushes em `main` e execuções manuais em `main` também publicam no GitHub Pages.

Em **Settings → Pages → Build and deployment**, a origem deve ser **GitHub Actions**.

Para `npm run test:browser` num contêiner que roda como root, defina `CHROME_NO_SANDBOX=1` e, se o
Chrome do Puppeteer não estiver instalado, `CHROME_PATH` com o caminho de outro Chromium.
