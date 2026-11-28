export interface Project {
  slug: string;
  title: string;
  kind: string;
  category: 'tools' | 'games';
  featured: boolean;
  summary: string;
  stack: string;
  status: string;
  platforms: string;
  details: string;
  focus: string;
}

export const projects: Project[] = [
  {
    "slug": "reynio",
    "title": "Reynio",
    "kind": "Creative software",
    "category": "tools",
    "featured": true,
    "summary": "A native frame-by-frame 2D animation editor for artists.",
    "stack": "C++20 · Swift 6 · Metal",
    "status": "In development",
    "platforms": "macOS and iPhone; iPad planned",
    "details": "Reynio is designed for traditional raster animation with an offline-first workflow. The native application and C++ core are being developed around drawing, frame timing, layers, and playback. The first release is planned as a paid universal purchase for Mac and iPhone; iPad availability is not yet confirmed.",
    "focus": "Refining the drawing and animation workflow and validating the tools against traditional animation exercises."
  },
  {
    "slug": "unsealed",
    "title": "Unsealed",
    "kind": "Stealth and exploration",
    "category": "games",
    "featured": true,
    "summary": "A 2D stealth exploration game about infiltration, environmental puzzles and hacking.",
    "stack": "C++20 · SDL3",
    "status": "Playable prototype",
    "platforms": "Desktop prototype",
    "details": "Unsealed follows Noah through a guarded facility. The player avoids detection, investigates documents, finds alternate routes and interacts with fictional infrastructure. The opening perimeter and an early section of the facility are implemented; visual and gameplay approval is still in progress.",
    "focus": "Refining the first scenes and testing exploration, guard behavior and progression before expanding the world."
  },
  {
    "slug": "tessora",
    "title": "Tessora",
    "kind": "Geometry puzzle",
    "category": "games",
    "featured": true,
    "summary": "Cut, move and rotate pieces to reconstruct shapes, with more than one valid solution.",
    "stack": "TypeScript · React · PixiJS",
    "status": "Public beta",
    "platforms": "Web",
    "details": "The puzzle rules validate the union of pieces against a target instead of relying on a fixed assembly. The game includes twenty registered levels, precise cuts, snapping and geometric validation. A public beta is available.",
    "focus": "Testing the puzzle experience and touch interaction on real devices."
  }
];

export const featuredProjects = projects.filter((project) => project.featured);
export const otherProjects = projects.filter((project) => !project.featured);
export const projectsPath = '/projects/';
export function projectPath(slug: string): string {
  return `${projectsPath}${slug}/`;
}
export const projectRoutes = [projectsPath, ...projects.map(({ slug }) => projectPath(slug))];
