import type {
  ICategoryRepository,
  NewCategory,
} from '../../src/domain/repositories/ICategoryRepository';
import type { Category } from '../../src/domain/entities/Category';

export interface FakeCategoryRepository extends ICategoryRepository {
  _items: Category[];
  _setAlgorithmCount(id: number, n: number): void;
}

const DEFAULT: Category[] = [
  { id: 1, slug: 'sorting', name: 'Sorting', description: 'Ordering elements', displayOrder: 1 },
  { id: 2, slug: 'searching', name: 'Searching', description: 'Finding elements', displayOrder: 2 },
];

export function createFakeCategoryRepository(seed: Category[] = DEFAULT): FakeCategoryRepository {
  const items: Category[] = seed.map((c) => ({ ...c }));
  const algoCounts: Record<number, number> = {};
  let nextId = items.reduce((max, i) => Math.max(max, i.id), 0) + 1;

  return {
    _items: items,
    _setAlgorithmCount(id, n) {
      algoCounts[id] = n;
    },
    async findAll() {
      return [...items].sort((a, b) => a.displayOrder - b.displayOrder);
    },
    async findById(id) {
      return items.find((i) => i.id === id) ?? null;
    },
    async create(c: NewCategory) {
      const cat: Category = {
        id: nextId++,
        slug: c.slug,
        name: c.name,
        description: c.description ?? null,
        displayOrder: c.displayOrder ?? 0,
      };
      items.push(cat);
      return cat;
    },
    async update(id, c) {
      const item = items.find((i) => i.id === id);
      if (!item) return null;
      item.slug = c.slug;
      item.name = c.name;
      item.description = c.description ?? null;
      item.displayOrder = c.displayOrder ?? 0;
      return item;
    },
    async remove(id) {
      const idx = items.findIndex((i) => i.id === id);
      if (idx < 0) return false;
      items.splice(idx, 1);
      return true;
    },
    async countAlgorithms(id) {
      return algoCounts[id] ?? 0;
    },
  };
}
