export interface Product {
  name: string;
  description: string;
  kind: 'sticker' | 'shirt' | 'mug';
  panel: 'orange' | 'khaki' | 'concrete';
}

export const products: Product[] = [
  {
    name: 'Stickers',
    description: 'Original character art for laptops, notebooks and sketchbooks.',
    kind: 'sticker',
    panel: 'orange',
  },
  {
    name: 'T-shirts',
    description: 'Wearable illustrations from the Art by Luan collection.',
    kind: 'shirt',
    panel: 'khaki',
  },
  { name: 'Mugs', description: 'Illustrated mugs for your desk and coffee breaks.', kind: 'mug', panel: 'concrete' },
];
