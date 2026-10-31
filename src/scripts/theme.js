// Apply the existing CSS media palettes, including high contrast and component styles,
// without keeping a second copy of their tokens for the manual theme preference.
const originalMedia = new WeakMap();
const originalSources = new WeakMap();
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
let preference;
try {
  preference = localStorage.getItem('color-theme');
} catch {
  /* Storage can be unavailable. */
}
const effectiveTheme = () =>
  ['light', 'dark'].includes(preference) ? preference : systemTheme.matches ? 'dark' : 'light';

function applyRules(rules, theme) {
  for (const rule of rules) {
    if (rule instanceof CSSMediaRule) {
      if (!originalMedia.has(rule)) originalMedia.set(rule, rule.media.mediaText);
      const original = originalMedia.get(rule);
      rule.media.mediaText = original.replace(/\(prefers-color-scheme:\s*(dark|light)\)/g, (_, scheme) =>
        scheme === theme ? '(min-width: 0px)' : '(max-width: 0px)',
      );
    }
    if (rule.cssRules) applyRules(rule.cssRules, theme);
  }
}

function applyTheme() {
  const theme = effectiveTheme();
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  for (const sheet of document.styleSheets) {
    // Browser extensions and external stylesheets may deny CSSOM access.
    try {
      applyRules(sheet.cssRules, theme);
    } catch {
      /* Keep that stylesheet's system preference. */
    }
  }
  for (const source of document.querySelectorAll(
    'picture source[media*="prefers-color-scheme"], picture source[data-theme-source]',
  )) {
    if (!originalSources.has(source)) originalSources.set(source, source.media);
    source.dataset.themeSource = '';
    source.media = originalSources
      .get(source)
      .replace(/\(prefers-color-scheme:\s*(dark|light)\)/g, (_, scheme) =>
        scheme === theme ? '(min-width: 0px)' : '(max-width: 0px)',
      );
  }
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.media =
      meta.content === '#000000' ? (theme === 'dark' ? 'all' : 'not all') : theme === 'light' ? 'all' : 'not all';
  }
  const button = document.querySelector('.theme-toggle');
  if (button) {
    button.hidden = false;
    button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    button.title = button.getAttribute('aria-label');
  }
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element) || !event.target.closest('.theme-toggle')) return;
  preference = effectiveTheme() === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem('color-theme', preference);
  } catch {
    /* Keep the preference for this session. */
  }
  applyTheme();
});
systemTheme.addEventListener('change', applyTheme);
window.addEventListener('storage', (event) => {
  if (event.key !== 'color-theme') return;
  preference = event.newValue;
  applyTheme();
});
document.addEventListener('astro:after-swap', applyTheme);
document.addEventListener('astro:page-load', applyTheme);
