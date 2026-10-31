import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

const sources = import.meta.glob<{ default: ImageMetadata }>('../assets/covers/*.{png,jpg,jpeg,webp}', { eager: true });

/**
 * As capas são opcionais: um artigo sem `cover`, com arquivo ausente ou com uma imagem que não
 * pode ser processada segue sem imagem e a página mostra o fallback (components/shared/CoverFallback.astro).
 * Nenhuma função daqui lança; devolvem `undefined` quando não há imagem utilizável.
 */

/** A capa declarada no front matter (`/covers/x.png` ou `x.png`) como imagem otimizável. */
export function coverSource(cover?: string): ImageMetadata | undefined {
  const name = cover?.split('/').pop();
  if (!name) return undefined;
  return Object.entries(sources).find(([path]) => path.endsWith(`/${name}`))?.[1].default;
}

/** A versão escura (`x-dark.png`), que `npm run covers` gera para as capas em SVG. */
const darkSource = (cover?: string) => coverSource(cover?.replace(/(\.[a-z]+)$/, '-dark$1'));

/** Metadados locais para Image e variantes responsivas para a versão escura. */
export async function articleCover(cover?: string) {
  const src = coverSource(cover);
  if (!src) return undefined;
  const dark = darkSource(cover);
  const darkImage = dark ? await getImage({ src: dark, widths: [320, 640, 960, 1200], format: 'webp' }) : undefined;
  return { src, dark: darkImage, width: src.width, height: src.height };
}

/** URL estável da capa original (og:image) em /covers/<arquivo>; sem capa, o layout usa /og-default.png. */
export const socialCover = (cover?: string) => (coverSource(cover) ? `/covers/${cover!.split('/').pop()}` : undefined);
