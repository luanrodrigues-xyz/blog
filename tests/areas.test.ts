import { describe, expect, it } from 'vitest';
import { articleAreas, areaRoute } from '../src/lib/areas';

describe('development areas', () => {
  it('keeps frontend articles out of the iOS area', () => {
    expect(articleAreas({ data: { topic: 'frontend' } }).map(({ id }) => id)).toEqual(['frontend']);
    expect(areaRoute('frontend')).toBe('/articles/frontend/');
  });
  it('keeps existing Java and iOS articles in their respective areas', () => {
    expect(articleAreas({ data: { topic: 'java-backend' } }).map(({ id }) => id)).toEqual(['backend']);
    expect(articleAreas({ data: { topic: 'swiftui' } }).map(({ id }) => id)).toEqual(['ios']);
  });
  it('allows a shared article to appear in both areas without duplicating its page', () => {
    expect(articleAreas({ data: { topic: 'payments', areas: ['ios', 'backend'] } }).map(({ id }) => id)).toEqual([
      'backend',
      'ios',
    ]);
    expect(areaRoute('backend')).toBe('/articles/backend/');
    expect(areaRoute('ios')).toBe('/articles/ios/');
  });
});
