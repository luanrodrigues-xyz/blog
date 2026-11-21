export const site = {
  name: 'Art by Luan',
  author: 'Luan Rodrigues',
  origin: 'https://luanrodrigues.xyz',
  tagline: 'Concept art, illustration & independent games',
  instagram: 'https://www.instagram.com/artbyluan/',
  /** Public channels, used in the footer, the About page and the 404 page. */
  links: [
    { label: 'Instagram', href: 'https://www.instagram.com/artbyluan/' },
    { label: 'GitHub', href: 'https://github.com/luanrodrigues-xyz' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/luanrodrigues-xyz/' },
  ],
};

/** Main navigation. An item is current on its own page and on every page below it. */
export const navigation = [
  { label: 'Art', href: '/art/' },
  { label: 'Games', href: '/games/' },
  { label: 'Shop', href: '/shop/' },
  { label: 'About', href: '/about/' },
];

export function isCurrent(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href);
}

export function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(value);
}
