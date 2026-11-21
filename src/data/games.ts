export const gameSlugs = ['tessora', 'ruptura', 'deploy-ou-ruina'] as const;
export type GameSlug = (typeof gameSlugs)[number];

/** Badge tone for the game's stage; each maps to a colour pair in components.css. */
export type StatusTone = 'playable' | 'prototype' | 'visual';

export interface Game {
  slug: GameSlug;
  title: string;
  tagline: string;
  description: string;
  status: string;
  tone: StatusTone;
  technologies: string[];
  development: string;
  mechanics: { title: string; text: string }[];
  /** Background of the game's art panel (a token name from tokens.css). */
  panel: 'peach' | 'concrete' | 'khaki';
  playUrl?: string;
  sourceUrl?: string;
}

export const games: Game[] = [
  {
    slug: 'tessora',
    title: 'Tessora',
    tagline: 'One shape. Many solutions.',
    description:
      'A geometric puzzle where you cut, move and rotate pieces to reconstruct shapes. The geometry engine accepts different valid solutions instead of checking against one fixed arrangement.',
    status: 'Playable · Browser',
    tone: 'playable',
    technologies: ['TypeScript', 'PixiJS', 'React'],
    development:
      'Built around a geometry engine independent of React and PixiJS. Current work focuses on precision of cuts, touch interaction and real-device playtests.',
    playUrl: 'https://luanrodrigues.itch.io/tessora',
    panel: 'peach',
    mechanics: [
      { title: 'Cut', text: 'Slice a shape into fragments along any line.' },
      { title: 'Move & rotate', text: 'Pick up each piece and turn it into place.' },
      { title: 'Reconstruct', text: 'Rebuild the target with no gaps or overlaps — any valid answer counts.' },
    ],
  },
  {
    slug: 'ruptura',
    title: 'Ruptura',
    tagline: 'Momentum is your way out.',
    description:
      'A 2D precision platformer about Brik, a small creature escaping an industrial facility through impact, recoil and carefully controlled movement.',
    status: 'Prototype · Desktop',
    tone: 'prototype',
    technologies: ['C++20', 'SDL3', 'CMake'],
    development:
      'The movement model and first playable chamber have been validated in playtests. The next stage focuses on level architecture and challenges.',
    panel: 'concrete',
    mechanics: [
      { title: 'Run & jump', text: 'Tight, readable movement as the base of every room.' },
      { title: 'Charge', text: 'Build up a directional impulse and launch Brik.' },
      { title: 'Break through', text: 'Smash barriers and use ricochets to reach the exit.' },
    ],
  },
  {
    slug: 'deploy-ou-ruina',
    title: 'Deploy ou Ruína',
    tagline: 'Starting over is a full-time job.',
    description:
      'An original satirical project about Carlos and the absurdities of the technology job market, told through comics, character art and a 2D game in development.',
    status: 'Visual dev · Prototype',
    tone: 'visual',
    technologies: ['C++20', 'SDL3'],
    development: 'Current work includes character illustration, comic strips and a C++ gameplay prototype.',
    panel: 'khaki',
    mechanics: [
      {
        title: 'Character design & satire',
        text: 'Carlos and the people around him carry the jokes — every pose says something about the job market.',
      },
      {
        title: 'Environmental storytelling',
        text: 'Silicon City tells the story too: signs, offices and stairways full of small details.',
      },
      {
        title: 'Gameplay experiments',
        text: 'A C++ prototype where the comic’s ideas are tested as mechanics before they become levels.',
      },
    ],
  },
];

export const gameUrl = (game: Pick<Game, 'slug'>) => `/games/${game.slug}/`;
