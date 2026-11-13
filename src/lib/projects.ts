export interface Project {
  slug: string;
  title: string;
  kind: string;
  summary: string;
  stack: string;
  details: string;
}

export const projects: Project[] = [
  {
    slug: 'vetra',
    title: 'Vetra',
    kind: 'Game development tools',
    summary: 'A native macOS editor for working with shapes, layers and visual content for games.',
    stack: 'C++ · Swift 6 · macOS',
    details: 'Current work includes editor interaction, layer ordering, geometry correctness and profiling large documents. A recent stress test with 2,000 layers exposed an expensive ID lookup; reorganizing that lookup brought the observed p95 from 38.49 ms to 5.27 ms in that test.'
  },
  {
    slug: 'tessora',
    title: 'Tessora',
    kind: 'Geometry puzzle',
    summary: 'Cut, move and rotate pieces to reconstruct shapes, with more than one valid solution.',
    stack: 'TypeScript · React · PixiJS',
    details: 'The puzzle rules validate the union of pieces against a target instead of relying on a fixed assembly. Work has focused on precise cuts, snapping, geometric validation and making the puzzles playable with touch input.'
  },
  {
    slug: 'ruptura',
    title: 'Ruptura',
    kind: 'Physics platformer',
    summary: 'A 2D platformer built around charging, launching, impact and breakable obstacles.',
    stack: 'C++20 · SDL3',
    details: 'The technical work covers fixed-step simulation, collision detection at high speed, camera presets and accumulated impact damage. The object playground is used to isolate and reproduce gameplay regressions.'
  },
  {
    slug: 'unsealed',
    title: 'Unsealed',
    kind: 'Stealth and exploration',
    summary: 'A 2D game about physical exploration, environmental puzzles and hacking systems.',
    stack: 'C++20 · SDL3',
    details: 'The level design explores multiple routes, camera constraints, rooms with hidden documents and interactive systems such as doors and lifts. The priority is making exploration readable before polishing visuals.'
  },
  {
    slug: 'deploy-ou-ruina',
    title: 'Deploy ou Ruína',
    kind: 'Satirical 2D game',
    summary: 'A game about work, technology and everyday absurdity, with exploration and dialogue.',
    stack: 'C++20 · SDL3',
    details: 'The current work is focused on the city graybox, one smooth camera, movement pacing and small events in the environment. The final art direction is still under review.'
  }
];
