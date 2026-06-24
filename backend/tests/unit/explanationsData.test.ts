import { describe, it, expect } from 'vitest';
import { EXPLANATIONS } from '../../db/seeds/explanationsData';
import { ALGORITHMS } from '../../db/seeds/catalogData';

const HEADINGS = [
  'What problem it solves',
  'How it works',
  'Why & when to use it',
  'Complexity intuition',
  'Real-world uses',
];

describe('algorithm explanations data', () => {
  it('covers exactly the 15 curated slugs', () => {
    const explSlugs = EXPLANATIONS.map((e) => e.slug).sort();
    const catSlugs = ALGORITHMS.map((a) => a.slug).sort();
    expect(explSlugs).toEqual(catSlugs);
  });

  it('has unique slugs', () => {
    const slugs = EXPLANATIONS.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every algorithm the 5 standard sections in order', () => {
    for (const e of EXPLANATIONS) {
      expect(e.sections.map((s) => s.heading)).toEqual(HEADINGS);
    }
  });

  it('has non-empty, substantive body text for every section', () => {
    for (const e of EXPLANATIONS) {
      for (const s of e.sections) {
        expect(s.body.trim().length).toBeGreaterThan(40);
      }
    }
  });
});
