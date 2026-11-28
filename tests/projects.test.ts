import { describe, expect, it } from 'vitest';
import { featuredProjects, otherProjects, projectPath, projectRoutes, projects } from '../src/lib/projects';

describe('project catalog', () => {
  it('features only the three featured projects in order', () => {
    expect(featuredProjects.map(({ slug }) => slug)).toEqual(['reynio', 'ruptura', 'unsealed']);
    expect(projects.some(({ slug }) => slug === 'vetra')).toBe(false);
    expect(projectRoutes).not.toContain('/projects/vetra/');
    expect(otherProjects.map(({ slug }) => slug)).toEqual(['tessora', 'deploy-ou-ruina']);
  });

  it('keeps every project route unique and represented in the sitemap source', () => {
    expect(projectRoutes).toEqual(['/projects/', ...projects.map(({ slug }) => projectPath(slug))]);
    expect(new Set(projectRoutes).size).toBe(projectRoutes.length);
    expect(projects.every(({ slug }) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))).toBe(true);
  });
});
