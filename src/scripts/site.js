// Progressive reading enhancements; the content remains usable without JavaScript.
// With <ClientRouter/> (astro:transitions), navigation swaps <main> instead of reloading the
// page, and a module script only ever executes once. Everything that reads the current page
// (headings, tables, the <html lang>-dependent labels...) lives in init() and reruns on
// `astro:page-load`, which fires on the first load too. Only `window`-level listeners that must
// never be bound twice (window outlives every navigation) are registered outside init().
(() => {
  // Headings get ids so a section can be linked.
  function identifyHeadings() {
    document.querySelectorAll('.article-body h2').forEach((heading, index) => {
      if (!heading.id) heading.id = `section-${index + 1}`;
    });
  }

  // Safari's default is that Tab skips links and buttons (a setting in Safari > Settings > Advanced; Option+Tab
  // always works). An explicit tabindex makes them reachable with plain Tab there, and changes nothing elsewhere.
  function makeReachableInSafari() {
    const safari = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
    if (!safari) return;
    document.querySelectorAll('a[href], button, summary').forEach((element) => {
      if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
    });
  }

  function wrapTables(labels) {
    document.querySelectorAll('.prose table').forEach((table) => {
      if (table.closest('.concept-figure, .table-scroll')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      wrapper.setAttribute('role', 'group');
      wrapper.setAttribute('aria-label', table.querySelector('caption')?.textContent.trim() || labels.table);
      table.before(wrapper);
      wrapper.append(table);
    });
  }

  function enhanceCode(labels) {
    document.querySelectorAll('.prose pre > code').forEach((code) => {
      const pre = code.parentElement;
      if (pre.closest('.code-example') || pre.classList.contains('mensagem-compilador')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'code-example';
      const toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';
      const language = document.createElement('span');
      language.textContent =
        [...code.classList].find((name) => name.startsWith('language-'))?.slice(9) || labels.example;
      toolbar.append(language);
      if (navigator.clipboard && window.isSecureContext) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-code';
        button.textContent = labels.copy;
        button.setAttribute('aria-label', `${labels.copy}: ${language.textContent}`);
        const status = document.createElement('span');
        status.className = 'copy-status';
        status.setAttribute('role', 'status');
        button.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(code.textContent);
            status.textContent = labels.copied;
          } catch {
            status.textContent = labels.copyFailed;
          }
        });
        toolbar.append(status, button);
      }
      pre.before(wrapper);
      wrapper.append(toolbar, pre);
    });
  }

  // Articles and catalogs are long: a button to return to the top appears once the
  // reader has scrolled a while. The button is recreated on every navigation (the previous one
  // left with the swapped-out <main>); click and scroll are handled once, below, by delegation,
  // so they keep working for whichever button currently exists without rebinding per page.
  function addBackToTop(labels) {
    document.querySelector('.to-top')?.remove();
    if (!document.querySelector('[data-article], .listing-page')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'to-top';
    button.hidden = true;
    button.setAttribute('aria-label', labels.top);
    button.title = labels.top;
    document.body.append(button);
  }

  // Catalog: the category pills jump to a section on the same page. A smooth, JS-driven scroll
  // reaches it instead of the instant default; this avoids the global `scroll-behavior: smooth`
  // that can drop keyboard scrolling in Safari (see the comment on `html` in base.css).
  function smoothCatalogJumps() {
    document.querySelectorAll('.catalog-categories a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const target = document.getElementById(link.getAttribute('href').slice(1));
        if (!target) return;
        event.preventDefault();
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        history.pushState(null, '', link.getAttribute('href'));
        // Keyboard and screen reader users land in the section instead of staying on the pill.
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  // A code block only becomes a keyboard stop when it scrolls; otherwise there is nothing to reach with the arrow keys.
  const syncScrollable = () =>
    document.querySelectorAll('.prose pre, .prose .table-scroll').forEach((box) => {
      if (box.scrollWidth > box.clientWidth) box.tabIndex = 0;
      else box.removeAttribute('tabindex');
    });

  function init() {
    const portuguese = (document.documentElement.dataset.uiLang ?? document.documentElement.lang).startsWith('pt');
    const labels = portuguese
      ? {
          example: 'Exemplo de código',
          table: 'Tabela',
          top: 'Voltar ao topo',
          copy: 'Copiar código',
          copied: 'Copiado',
          copyFailed: 'Não foi possível copiar',
        }
      : {
          example: 'Code example',
          table: 'Table',
          top: 'Back to top',
          copy: 'Copy code',
          copied: 'Copied',
          copyFailed: 'Could not copy',
        };

    identifyHeadings();
    wrapTables(labels);
    enhanceCode(labels);
    const share = document.querySelector('.share-article');
    if (share && !share.dataset.bound && (navigator.share || (navigator.clipboard && window.isSecureContext))) {
      share.dataset.bound = 'true';
      share.hidden = false;
      share.textContent = navigator.share ? 'Share article' : 'Copy article link';
      share.addEventListener('click', async () => {
        const status = document.querySelector('.share-status');
        status.textContent = '';
        try {
          if (navigator.share) await navigator.share({ title: share.dataset.shareTitle, url: share.dataset.shareUrl });
          else {
            await navigator.clipboard.writeText(share.dataset.shareUrl);
            status.textContent = 'Link copied';
          }
        } catch (error) {
          if (error.name !== 'AbortError')
            status.textContent = 'Could not share. You can copy the URL from the address bar.';
        }
      });
    }
    document.querySelectorAll('.prose pre').forEach((pre) => {
      pre.setAttribute('role', 'group');
      pre.setAttribute('aria-label', labels.example);
    });
    syncScrollable();
    addBackToTop(labels);
    smoothCatalogJumps();
    makeReachableInSafari();
  }

  // `window` outlives every navigation, so these are bound once and read the current DOM
  // themselves instead of closing over elements a later page would have already replaced.
  window.addEventListener('resize', syncScrollable);
  window.addEventListener(
    'scroll',
    (() => {
      let queued = false;
      return () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          const button = document.querySelector('.to-top');
          if (button) button.hidden = window.scrollY < window.innerHeight;
        });
      };
    })(),
    { passive: true },
  );
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.to-top')) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    // Keyboard users continue from the top of the page instead of from the hidden button.
    document.getElementById('main')?.focus({ preventScroll: true });
  });

  // Fires on the first load and again after every <ClientRouter/> navigation.
  document.addEventListener('astro:page-load', init);
})();
