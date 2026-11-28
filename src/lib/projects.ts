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
    "slug": "vetra",
    "title": "Vetra",
    "kind": "Game development tool",
    "category": "tools",
    "featured": true,
    "summary": "A native vector asset editor for game developers, from drawing to runtime export.",
    "stack": "C++20 · Swift 6 · Metal",
    "status": "In development",
    "platforms": "macOS",
    "details": "Vetra brings vector asset creation, assembly and animation into a single application. The current priority is Draw, with geometry, layer editing and deterministic export to game runtimes. Assemble and Motion remain planned milestones; they are not presented as released features.",
    "focus": "Finishing and validating Draw, including editing, rendering, runtime export and performance."
  },
  {
    "slug": "ruptura",
    "title": "Ruptura",
    "kind": "Precision platformer",
    "category": "games",
    "featured": true,
    "summary": "A 2D platformer where recoil, momentum and impact shape how you move.",
    "stack": "C++20 · SDL3",
    "status": "Playable prototype",
    "platforms": "Desktop prototype",
    "details": "Brik escapes industrial containment by charging and releasing an impulse, ricocheting and breaking obstacles when the impact is strong enough. The first chamber is playable and has been approved in an internal playtest. The game is built around short challenges and learning through repeated attempts.",
    "focus": "Closing the architecture of the first chamber and refining movement, collision and level design."
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
    "featured": false,
    "summary": "Cut, move and rotate pieces to reconstruct shapes, with more than one valid solution.",
    "stack": "TypeScript · React · PixiJS",
    "status": "In development",
    "platforms": "Web",
    "details": "The puzzle rules validate the union of pieces against a target instead of relying on a fixed assembly. The game includes twenty registered levels, precise cuts, snapping and geometric validation.",
    "focus": "Testing the puzzle experience and touch interaction on real devices."
  },
  {
    "slug": "deploy-ou-ruina",
    "title": "Deploy ou Ruína",
    "kind": "Satirical 2D game",
    "category": "games",
    "featured": false,
    "summary": "A game about work, technology and everyday absurdity, with exploration and dialogue.",
    "stack": "Swift 6 · SpriteKit · SwiftUI",
    "status": "Internal alpha",
    "platforms": "iPhone",
    "details": "Carlos Silva tries to find stability in Silicon City. The current native iPhone project includes job applications, freelance contracts, survival expenses and exploration of the first street. It shares its fictional world with the comic series.",
    "focus": "Refining the existing gameplay and visual direction before expanding the city."
  }
];

export const featuredProjects = projects.filter((project) => project.featured);
export const otherProjects = projects.filter((project) => !project.featured);
export const projectsPath = '/projects/';
export function projectPath(slug: string): string {
  return `${projectsPath}${slug}/`;
}
export const projectRoutes = [projectsPath, ...projects.map(({ slug }) => projectPath(slug))];
