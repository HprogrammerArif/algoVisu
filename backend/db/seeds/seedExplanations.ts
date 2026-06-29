import type { Connection } from 'oracledb';
import { EXPLANATIONS } from './explanationsData';

/**
 * Seeds algorithm_explanations. Resolves each algorithm by slug and inserts its
 * sections only when that algorithm currently has none — idempotent and
 * independent of seedCatalog's "skip existing slug" logic (the curated
 * algorithms already exist, so explanations must seed regardless).
 */
export async function seedExplanations(conn: Connection): Promise<void> {
  let inserted = 0;
  for (const entry of EXPLANATIONS) {
    const algoRes = await conn.execute<{ ALGORITHM_ID: number }>(
      `SELECT algorithm_id AS ALGORITHM_ID FROM algorithms WHERE slug = :slug`,
      { slug: entry.slug },
    );
    const algorithmId = algoRes.rows?.[0]?.ALGORITHM_ID;
    if (algorithmId === undefined) continue; // algorithm not seeded — skip

    const existing = await conn.execute<{ CNT: number }>(
      `SELECT COUNT(*) AS CNT FROM algorithm_explanations WHERE algorithm_id = :id`,
      { id: algorithmId },
    );
    if ((existing.rows?.[0]?.CNT ?? 0) > 0) continue; // already has explanations

    for (let order = 0; order < entry.sections.length; order++) {
      const section = entry.sections[order];
      await conn.execute(
        `INSERT INTO algorithm_explanations (algorithm_id, heading, body, display_order)
         VALUES (:algorithmId, :heading, :body, :displayOrder)`,
        { algorithmId, heading: section.heading, body: section.body, displayOrder: order },
      );
    }
    inserted += 1;
  }
  console.log(`  seeded explanations (${inserted} algorithm(s) populated, ${EXPLANATIONS.length} defined)`);
}
