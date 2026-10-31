import { defineHastPlugin, htmlToHast, type PluginFactoryContext } from 'satteri';
import hljs from 'highlight.js';
import { collectDeclarations, highlightSwift, swiftBlocks } from './swift.ts';

const language = (code: any) =>
  (Array.isArray(code.properties?.className) ? code.properties.className : [])
    .find((name: unknown) => typeof name === 'string' && name.startsWith('language-'))
    ?.slice('language-'.length) as string | undefined;

/**
 * Pinta os blocos ``` no build, para o leitor não baixar um realçador nem depender de JavaScript.
 * Swift segue o tema padrão do Xcode (`swift.ts`), com as declarações de todos os blocos do
 * artigo, para que um trecho reconheça o que o exemplo completo declara; o resto usa highlight.js.
 */
export const highlightCode = ({ source }: PluginFactoryContext) => {
  const known = collectDeclarations(swiftBlocks(source));
  return defineHastPlugin({
    name: 'highlight-code',
    element: {
      filter: ['pre'],
      visit(node, ctx) {
        const code = node.children?.find((child: any) => child.type === 'element' && child.tagName === 'code') as any;
        const name = code && language(code);
        if (!name || (name !== 'swift' && !hljs.getLanguage(name))) return;
        const text = ctx.textContent(code);
        const html =
          name === 'swift'
            ? highlightSwift(text, known)
            : hljs.highlight(text, { language: name, ignoreIllegals: true }).value;
        const tree: any = htmlToHast(
          `<pre><code class="hljs language-${name}" data-highlighted="yes">${html}</code></pre>`,
          { fragment: true },
        );
        return tree.children[0];
      },
    },
  });
};
