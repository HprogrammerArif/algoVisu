import oracledb, { type Connection } from 'oracledb';
import { ALGORITHMS } from './catalogData';

export async function seedCatalog(conn: Connection): Promise<void> {
  let inserted = 0;
  for (const algo of ALGORITHMS) {
    const existing = await conn.execute<{ CNT: number }>(
      `SELECT COUNT(*) AS CNT FROM algorithms WHERE slug = :slug`,
      { slug: algo.slug },
    );
    if ((existing.rows?.[0]?.CNT ?? 0) > 0) continue;

    const result = await conn.execute(
      `INSERT INTO algorithms
         (category_id, slug, name, summary, description, visualizer_type, difficulty, space_complexity)
       VALUES
         ((SELECT category_id FROM categories WHERE slug = :categorySlug),
          :slug, :name, :summary, :description, :visualizerType, :difficulty, :spaceComplexity)
       RETURNING algorithm_id INTO :id`,
      {
        categorySlug: algo.categorySlug,
        slug: algo.slug,
        name: algo.name,
        summary: algo.summary,
        description: algo.description,
        visualizerType: algo.visualizerType,
        difficulty: algo.difficulty,
        spaceComplexity: algo.spaceComplexity,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
    );
    const algorithmId = (result.outBinds as { id: number[] }).id[0];

    for (const caseType of ['best', 'average', 'worst'] as const) {
      await conn.execute(
        `INSERT INTO time_complexities (algorithm_id, case_type, big_o)
         VALUES (:algorithmId, :caseType, :bigO)`,
        { algorithmId, caseType, bigO: algo.time[caseType] },
      );
    }

    for (const snippet of algo.snippets) {
      await conn.execute(
        `INSERT INTO code_snippets (algorithm_id, language, code)
         VALUES (:algorithmId, :language, :code)`,
        { algorithmId, language: snippet.language, code: snippet.code },
      );
    }
    inserted += 1;
  }
  console.log(`  seeded catalog (${inserted} new algorithm(s), ${ALGORITHMS.length} total defined)`);
}
