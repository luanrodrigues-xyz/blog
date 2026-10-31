# Rotas e funcionamento do site

[Voltar ao README](../README.md)

## Conteúdo e rotas

A interface é uma só, sempre em inglês: não existe um site PT e um site EN em paralelo. Home, catálogo,
categoria e About têm uma única URL cada, e podem listar ou não artigos dos dois idiomas. Só o artigo
individual tem uma rota por idioma, decidida pelo `language` do seu front matter (nunca pelo texto do slug):

| Página            | URL                       | Observação                                             |
| ----------------- | ------------------------- | ------------------------------------------------------- |
| Home              | `/`                       | compartilhada                                          |
| Área              | `/articles/backend/`, `/articles/ios/` | filtra artigos e categorias por área |
| Catálogo          | `/articles/`              | lista artigos dos dois idiomas, mais recentes primeiro |
| Categoria         | `/categories/<slug>/`     | uma por assunto; mistura os dois idiomas                |
| Artigo em inglês  | `/articles/<slug>/`       |                                                         |
| Artigo em português | `/articles/pt/<slug>/`  |                                                         |
| About             | `/about/`                 | compartilhada                                          |

Cada versão tem canonical próprio.
O título HTML dos artigos usa o título editorial sem sufixo de marca, para reduzir
o comprimento nos resultados de busca. A Home usa `Luan Rodrigues | iOS Developer`;
as demais páginas mantêm o sufixo com o nome do site.
Versões publicadas no mesmo bundle são pareadas automaticamente e
recebem alternates recíprocos. O cabeçalho exibe um botão para English ou Português quando a tradução está
publicada. Se estiver ausente ou em rascunho, aparece “Em tradução” no artigo em português ou
“Translation pending” no artigo em inglês, sem link. A interface geral continua em inglês.
Depois de publicado, não altere uma URL sem decidir antes como
tratar quem já a usa — redirects permanentes de `/artigos/`, `/artigos/<slug>/`, `/categorias/<slug>/` e
`/sobre/` para as rotas atuais ficam em `legacyRedirects()`, em `astro.config.mjs`, lidos diretamente de
`contents/notebook/` (só artigos com `language: "pt-BR"` recebem o redirect de `/artigos/<slug>/`, já que
essa rota só existiu enquanto o site era só em português).

Preserve os campos de idioma, `canonical` e `alternates`. `readingOrder`
controla a ordem dentro de cada assunto, nos dois idiomas quando a categoria usa `sort: "readingOrder"`
em `topics.json` (ordem de leitura); `sort: "date"` (hoje só "Notas") lista por data, mais recente primeiro.
`Previous article`/`Next article` seguem a data de publicação, entre assuntos, sempre
no idioma do artigo atual. As páginas de assunto mantêm suas ordens de leitura.
As sugestões em `Continue reading` combinam conexões editoriais em
`src/lib/related-articles.ts`, tags e assunto; excluem rascunhos, traduções e os
artigos já oferecidos em Previous/Next e mostram até duas opções.

## Publicação do site

O feed RSS 2.0 fica em `/rss.xml`, com título, resumo, categoria, idioma, autor,
data de publicação e URL de cada versão publicada de artigo, em ordem de publicação
mais recente primeiro. Rascunhos ficam de fora. O conteúdo completo continua na
página do artigo. O feed é gerado em cada build, tem descoberta automática no head
das páginas e um link no rodapé. O GUID usa a URL canonical estável.

O projeto está migrando do GitLab para o GitHub, no repositório
[luanrodrigues-xyz/blog](https://github.com/luanrodrigues-xyz/blog).

O workflow `.github/workflows/pages.yml` usa Node.js 24, instala as dependências com
`npm ci --ignore-scripts`, executa os testes e gera `dist/`. Pull requests validam
o site; pushes em `main` e execuções manuais em `main` também publicam no GitHub Pages.
O build local não publica o site.

Em **Settings → Pages → Build and deployment**, a origem deve ser **GitHub Actions**.
O domínio permanece `luanrodrigues.xyz`, configurado em **Custom domain** no mesmo painel.
`astro.config.mjs`, `src/config/site.ts` e `public/CNAME` mantêm esse domínio;
o site usa a raiz do domínio, sem prefixo `/blog/`.
A migração de DNS depende do apontamento do domínio para o GitHub Pages.

O workflow usa as permissões `pages: write` e `id-token: write` apenas no job de deploy.
Os IDs públicos de Analytics podem ser substituídos por variáveis do repositório,
como descrito em [Analytics](analytics.md).

## Navegação e leitura

A Home apresenta engenharia de software para iOS e web. Seus destaques e áreas
incluem artigos publicados de todas as áreas, incluindo web, iOS e Java backend. As rotas `/articles/frontend/`, `/articles/backend/` e
`/articles/ios/` continuam disponíveis. Os identificadores `frontend` (web) e `ios`
(mobile nativo) são preservados em `src/lib/areas.ts` e no front matter.

A Home mostra os 4 artigos publicados mais recentes de todas as áreas
(`HOME_LATEST_COUNT` em `src/lib/home.ts`), na ordem de data usada pelo catálogo,
sem seleção manual por slug. Rascunhos não participam dos destaques nem das categorias.
Home e catálogo usam iOS, Web e Backend como áreas principais; filtros sem artigos
publicados ficam ocultos. O catálogo tem uma lista cronológica única, com filtros
por área. As URLs de assuntos (`/categories/<slug>/`) continuam disponíveis para
consulta e preservam suas ordens configuradas. Não há página Projects vazia.

Artigos com pelo menos três seções H2 recebem um índice recolhível, gerado no build,
antes do corpo. Blocos de código mostram linguagem e cópia como melhoria progressiva;
o código continua disponível sem JavaScript. Compartilhamento usa LinkedIn, a API
nativa do navegador quando disponível, ou cópia do permalink. O tema acompanha o
sistema por padrão; o botão no header permite escolher claro/escuro e salva a preferência
localmente. Os links sociais e RSS ficam visíveis no rodapé.

`npm run test:browser` serve `dist/` em localhost, bloqueia requisições externas e
salva screenshots e resultados em uma pasta temporária indicada na saída.
Use `CHROME_PATH` para escolher um Chrome instalado; sem essa variável, usa o Chrome
gerenciado pelo Puppeteer. O script também testa leitura sem JavaScript e alto contraste.
