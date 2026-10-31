# Analytics

Configuração do GA4 e do Google Tag Manager do site.

[Voltar ao README](../README.md)

## Google Analytics 4

O fluxo Web de `https://luanrodrigues.xyz` usa o ID de medição `G-EDBQ8DXY4C`,
configurado como padrão em `src/components/GoogleAnalytics.astro`.
O envio é gerenciado pelo contêiner GTM descrito abaixo; o ID também serve como
padrão para o modo direto quando GTM está desativado.
Para substituir o ID, configure `PUBLIC_GA_MEASUREMENT_ID` em **Settings → Secrets and variables → Actions → Variables**
no GitHub, passando a variável ao passo de build no workflow, ou em `.env.local` para builds locais.
O ID é público e entra no HTML durante o build; não é uma senha.

No fluxo Web, em **Medição otimizada → Visualizações de página → Configurações avançadas**,
desative **Alterações na página com base em eventos do histórico do navegador**.
O site envia uma visualização em cada `astro:page-load`, incluindo navegação interna
e voltar/avançar; a coleta automática do histórico duplicaria esses eventos.
Veja as referências de [pageviews do GA4](https://developers.google.com/analytics/devguides/collection/ga4/views)
e do [ciclo de navegação do Astro](https://docs.astro.build/en/guides/view-transitions/#astropage-load).

A integração só é incluída em builds de produção. Com JavaScript, o carregamento
fica restrito a `luanrodrigues.xyz`. O fallback `noscript` é incluído no HTML de
produção e também pode carregar em previews com JavaScript desativado.
Defina ambas as variáveis com valor vazio para desativar toda a integração.
Não é necessário alterar DNS ou Cloudflare.
Após publicar um build com o ID, abra o domínio e navegue entre páginas; confirme
as visitas em **Relatórios → Tempo real** no GA4. Bloqueadores podem impedir a coleta.

## Google Tag Manager

O contêiner Web `GTM-W2MRDPVS` está configurado como padrão no código, sem exigir
variáveis no GitHub. `PUBLIC_GTM_CONTAINER_ID` permite substituir o ID; valor vazio
ativa o modo direto GA4. Com GTM ativo, o site não carrega a integração direta GA4.
No contêiner, crie uma **Google tag** com ID `G-EDBQ8DXY4C`, parâmetro
`send_page_view` igual a `false` e acionador **Initialization – All Pages**.
Crie uma tag **Google Analytics: GA4 Event**, evento `page_view`, com acionador
de evento personalizado `portfolio_page_view`. Adicione os parâmetros `page_location`,
`page_title` e `page_referrer`, cada um usando uma variável de camada de dados
com o mesmo nome. Mantenha desativada a medição automática de mudanças do histórico.
Valide no Preview do GTM a carga inicial, links internos e voltar/avançar antes de
publicar o contêiner. O snippet `noscript` fica no início do body; os eventos
`portfolio_page_view` dependem de JavaScript.
Referência: [configurar GA4 no GTM](https://support.google.com/tagmanager/answer/9442095).

### Cliques de navegação

O site envia `portfolio_navigation_click` à camada de dados para menu, cards e
títulos de artigos, anterior/próximo, categorias e links GitHub/LinkedIn.
O evento GA4 correspondente é `navigation_click`, com `click_kind` (`menu`,
`article`, `category`, `social`), `click_section`, `link_text`, `link_url`,
`link_anchor`, `page_location` e `page_title`. URLs de clique não incluem query
strings; rótulos têm limite de 100 caracteres. Cliques por teclado e botão do
meio também são registrados. Links editoriais comuns e o atalho “Skip to content”
não geram esse evento. A navegação não espera o Analytics para continuar.

O arquivo [config/analytics/gtm-container.json](../config/analytics/gtm-container.json)
prepara a Google tag, os dois acionadores, as variáveis e os eventos `page_view`
e `navigation_click`. No contêiner `GTM-W2MRDPVS`, use **Admin → Import Container**,
selecione esse arquivo e **Merge**. Confira a prévia das alterações e evite manter
tags antigas que enviem os mesmos eventos. A importação ainda precisa ser validada
no painel; gerar o JSON localmente não valida a aceitação pelo GTM.
Veja a [documentação de importação](https://support.google.com/tagmanager/answer/6106997).

No **Preview**, confirme um `portfolio_page_view` por página e um
`portfolio_navigation_click` por clique; teste também navegação interna e voltar.
Depois publique o contêiner e confira os eventos no DebugView/Tempo real do GA4.
Em GA4 → **Admin → Custom definitions**, registre `click_kind` e `click_section`
como dimensões de escopo evento para usá-las nos relatórios. O evento personalizado
`navigation_click` é separado do `click` automático de links externos da medição
otimizada; não some os dois para contar cliques sociais.
