import { defineHastPlugin } from 'satteri';
import GithubSlugger from 'github-slugger';

/** Ids de títulos sem acentos, para que os fragmentos publicados continuem os mesmos. */
export const asciiSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const headingIds = () => {
  const slugger = new GithubSlugger();
  const counts = new Map<string, number>();
  return defineHastPlugin({
    name: 'ascii-heading-ids',
    element: {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      visit(node, ctx) {
        if (typeof node.properties?.id === 'string') return;
        const id = slugger.slug(ctx.textContent(node));
        const plain = asciiSlug(id);
        let final = id;
        if (plain !== id) {
          const count = counts.get(plain) ?? 0;
          counts.set(plain, count + 1);
          final = count === 0 ? plain : `${plain}-${count}`;
        }
        ctx.setProperty(node, 'id', final);
      },
    },
  });
};
