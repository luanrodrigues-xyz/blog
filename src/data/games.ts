export interface Game {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  status: string;
  technologies: string[];
  development: string;
  mechanics: string[];
  playUrl?: string;
  sourceUrl?: string;
}

export const games: Game[] = [
  {
    slug: 'tessora', title: 'Tessora', tagline: 'One shape. Many solutions.',
    description: 'A geometric puzzle where you cut, move and rotate pieces to reconstruct shapes. The geometry engine accepts different valid solutions instead of checking against one fixed arrangement.',
    status: 'Playable · Browser', technologies: ['TypeScript', 'PixiJS', 'React'],
    development: 'Built around a geometry engine independent of React and PixiJS. Current work focuses on precision of cuts, touch interaction and real-device playtests.',
    playUrl: 'https://luanrodrigues.itch.io/tessora',
    mechanics: ['Cut a shape into fragments', 'Move and rotate each piece', 'Reconstruct a target without gaps or overlaps']
  },
  {
    slug: 'ruptura', title: 'Ruptura', tagline: 'Momentum is your way out.',
    description: 'A 2D precision platformer about Brik, a small creature escaping an industrial facility through impact, recoil and carefully controlled movement.',
    status: 'Playable prototype · Desktop', technologies: ['C++20', 'SDL3', 'CMake'],
    development: 'The movement model and first playable chamber have been validated in playtests. The next stage focuses on level architecture and challenges.',
    mechanics: ['Run and jump', 'Charge a directional impulse', 'Break barriers and use ricochets']
  },
  {
    slug: 'deploy-ou-ruina', title: 'Deploy ou Ruína', tagline: 'Starting over is a full-time job.',
    description: 'A narrative 2D iPhone game about Carlos, a developer rebuilding his career in Silicon City while balancing time, decisions and limited resources.',
    status: 'Internal alpha · iPhone', technologies: ['Swift 6', 'SpriteKit', 'SwiftUI'],
    development: 'The alpha includes a room, desktop interface, job application flow, narrative clock and save system. The larger city and additional activities remain planned.',
    mechanics: ['Explore Carlos’s room', 'Interact with a fictional computer and job listings', 'Manage time and decisions']
  }
];
