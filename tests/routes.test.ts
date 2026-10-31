import { describe, expect, it } from 'vitest';
import { articlePath, articleUrl, routeOf } from '../src/config/site';

describe('routeOf', () => {
  it('maps a sitePage id to its route', () => {
    expect(routeOf('about')).toBe('/about/');
    expect(routeOf('index')).toBe('/');
  });
});

describe('articlePath', () => {
  it('routes english content at /articles/<slug>/ and portuguese content at /articles/pt/<slug>/', () => {
    expect(articlePath('en', 'variables-in-swift')).toBe('/articles/variables-in-swift/');
    expect(articlePath('pt-BR', 'arc-em-swift')).toBe('/articles/pt/arc-em-swift/');
  });
});

describe('articleUrl', () => {
  it('uses the article metadata language, not the slug text', () => {
    expect(articleUrl({ id: 'notebook/Fundamentals/variables-in-swift', data: { language: 'en' } })).toBe(
      '/articles/variables-in-swift/',
    );
    expect(articleUrl({ id: 'notebook/memoria/arc-em-swift', data: { language: 'pt-BR' } })).toBe(
      '/articles/pt/arc-em-swift/',
    );
  });
});

it('routes localized sources with their article slug and preserves historical overrides', () => {
  expect(articleUrl({ id: 'notebook/architecture/contract/en', data: { language: 'en' } })).toBe('/articles/contract/');
  expect(articleUrl({ id: 'notebook/architecture/contract/pt-br', data: { language: 'pt-BR' } })).toBe(
    '/articles/pt/contract/',
  );
  expect(
    articleUrl({ id: 'notebook/architecture/contract/pt-br', data: { language: 'pt-BR', urlSlug: 'contract-pt' } }),
  ).toBe('/articles/pt/contract-pt/');
});
