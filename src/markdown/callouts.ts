import { defineHastPlugin } from 'satteri';

/** Blockquote cujo primeiro parágrafo é um rótulo em negrito vira um aside (Nota, Importante, Atenção, Para executar). */
export const KINDS: Record<string, string> = {
  'Para executar': 'run',
  'To run': 'run',
  Nota: 'note',
  Note: 'note',
  Importante: 'important',
  Important: 'important',
  Atenção: 'warning',
  Warning: 'warning',
};

const isBlank = (node: any) => node.type === 'text' && !node.value.trim();

/** O rótulo, se `node` é `<p><strong>Rótulo</strong></p>` com um rótulo conhecido. */
export function calloutLabel(node: any): string | undefined {
  if (node?.type !== 'element' || node.tagName !== 'p' || node.children.length !== 1) return;
  const [strong] = node.children;
  if (strong.type !== 'element' || strong.tagName !== 'strong' || strong.children.length !== 1) return;
  const [text] = strong.children;
  return text.type === 'text' && text.value in KINDS ? text.value : undefined;
}

export const callouts = defineHastPlugin({
  name: 'callouts',
  element: {
    filter: ['blockquote'],
    visit(node) {
      const children = node.children as any[];
      const first = children.findIndex((child) => !isBlank(child));
      const label = calloutLabel(children[first]);
      if (!label) return;
      return {
        type: 'element',
        tagName: 'aside',
        properties: { className: ['callout', `callout-${KINDS[label]}`], role: 'note', ariaLabel: label },
        children: [
          {
            type: 'element',
            tagName: 'p',
            properties: { className: ['callout-title'] },
            children: [{ type: 'text', value: label }],
          },
          ...children.slice(first + 1).filter((child, index) => index > 0 || !isBlank(child)),
        ],
      } as any;
    },
  },
});
