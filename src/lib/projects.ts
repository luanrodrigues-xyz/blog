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
    "details": "Reynio is a frame-by-frame raster animation editor. Drawing, layers, frame timing and playback run locally. The first release is planned for Mac and iPhone; iPad support is still in development planning.",
    "focus": "Drawing tools, frame timing and playback."
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
    "details": "Unsealed follows Noah through a guarded facility. The player avoids detection, investigates documents, finds alternate routes and interacts with fictional infrastructure. The opening area is implemented and the level design is still being tested.",
    "focus": "First scenes, guard behavior and exploration."
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
    "details": "A solution is valid when the assembled pieces match the target shape, regardless of how they were arranged. Twenty levels are registered in development. The public beta is available.",
    "focus": "Touch controls and geometric validation."
  }
];

export const featuredProjects = projects.filter((project) => project.featured);
export const otherProjects = projects.filter((project) => !project.featured);
export const projectsPath = '/projects/';
export function projectPath(slug: string): string {
  return `${projectsPath}${slug}/`;
}
export const projectRoutes = [projectsPath, ...projects.map(({ slug }) => projectPath(slug))];
