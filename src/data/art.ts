import type { ImageMetadata } from 'astro';
import siliconCity from '../assets/art/silicon-city.webp';

export interface Artwork {
  title: string;
  caption: string;
  /** Finished pieces have an image; the rest are sketchbook shelves that link to Instagram for now. */
  image?: ImageMetadata;
  alt?: string;
  /** Panel colour for a shelf without an image (a token name from tokens.css). */
  panel?: 'peach' | 'khaki' | 'concrete' | 'raised';
}

export const keyArt: Required<Pick<Artwork, 'image' | 'alt'>> & Artwork = {
  title: 'Silicon City steps',
  caption: 'Key illustration · Deploy ou Ruína',
  image: siliconCity,
  alt: 'Two illustrated characters on concrete steps in Silicon City: a curly red-haired woman in a plum jacket and cargo shorts, and a developer in a white shirt and tie with his hands in his pockets.',
};

export const sketchbook: Artwork[] = [
  { title: 'Character sheets', caption: 'Turnarounds and expressions', panel: 'peach' },
  { title: 'Comic strips', caption: 'Carlos vs. the job market', panel: 'khaki' },
  { title: 'Environment studies', caption: 'Visual development', panel: 'concrete' },
  { title: 'Speed art', caption: 'Sketchbook & process', panel: 'raised' },
];
