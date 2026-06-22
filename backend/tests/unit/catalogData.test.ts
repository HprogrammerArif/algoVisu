import { describe, it, expect } from 'vitest';
import { ALGORITHMS } from '../../db/seeds/catalogData';

const EXPECTED_SLUGS = [
  'bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort', 'quick-sort',
  'linear-search', 'binary-search',
  'breadth-first-search', 'depth-first-search', 'dijkstra',
  'a-star', 'knapsack-01', 'kmp-search',
  'sieve-of-eratosthenes', 'tower-of-hanoi',
];
const VIZ = ['array', 'grid', 'graph', 'matrix', 'string', 'math'];
const DIFF = ['easy', 'medium', 'hard'];
const CATS = ['sorting', 'searching', 'graph', 'grid', 'dynamic-programming', 'string', 'math'];

describe('curated catalog data', () => {
  it('defines exactly the 15 curated algorithms', () => {
    expect(ALGORITHMS).toHaveLength(15);
    expect(ALGORITHMS.map((a) => a.slug).sort()).toEqual([...EXPECTED_SLUGS].sort());
  });

  it('has unique slugs', () => {
    const slugs = ALGORITHMS.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every entry has valid required fields', () => {
    for (const a of ALGORITHMS) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.summary.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
      expect(VIZ).toContain(a.visualizerType);
      expect(DIFF).toContain(a.difficulty);
      expect(CATS).toContain(a.categorySlug);
      expect(a.spaceComplexity.length).toBeGreaterThan(0);
      expect(a.time.best.length).toBeGreaterThan(0);
      expect(a.time.average.length).toBeGreaterThan(0);
      expect(a.time.worst.length).toBeGreaterThan(0);
    }
  });

  it('every entry has javascript + pseudocode snippets', () => {
    for (const a of ALGORITHMS) {
      const langs = a.snippets.map((s) => s.language);
      expect(langs).toContain('javascript');
      expect(langs).toContain('pseudocode');
      for (const s of a.snippets) expect(s.code.trim().length).toBeGreaterThan(0);
    }
  });

  it('covers all six visualizer types', () => {
    const used = new Set(ALGORITHMS.map((a) => a.visualizerType));
    for (const v of VIZ) expect(used).toContain(v);
  });
});
