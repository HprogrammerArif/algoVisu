import type { Connection } from 'oracledb';

const CATEGORIES = [
  { slug: 'sorting', name: 'Sorting', description: 'Ordering elements in a sequence', order: 1 },
  { slug: 'searching', name: 'Searching', description: 'Finding an element in a collection', order: 2 },
  { slug: 'graph', name: 'Graphs', description: 'Traversal and shortest paths', order: 3 },
  { slug: 'grid', name: 'Grid / Pathfinding', description: 'Pathfinding on 2D grids', order: 4 },
  { slug: 'dynamic-programming', name: 'Dynamic Programming', description: 'Overlapping subproblems', order: 5 },
  { slug: 'math', name: 'Math', description: 'Number theory and mathematics', order: 6 },
  { slug: 'lists', name: 'Lists', description: 'Linked lists and sequences', order: 7 },
];

export async function seedCategories(conn: Connection): Promise<void> {
  for (const c of CATEGORIES) {
    await conn.execute(
      `MERGE INTO categories t
         USING (SELECT :slug AS slug FROM dual) src
         ON (t.slug = src.slug)
       WHEN NOT MATCHED THEN
         INSERT (slug, name, description, display_order)
         VALUES (:slug, :name, :description, :displayOrder)`,
      { slug: c.slug, name: c.name, description: c.description, displayOrder: c.order },
    );
  }
  console.log(`  seeded categories (${CATEGORIES.length})`);
}
