import oracledb, { type Connection } from 'oracledb';
import { getConnection } from '../connection';
import type {
  IAlgorithmRepository,
  AlgorithmFilters,
  NewAlgorithm,
} from '../../../domain/repositories/IAlgorithmRepository';
import type {
  AlgorithmSummary,
  AlgorithmDetail,
  TimeComplexities,
} from '../../../domain/entities/Algorithm';

interface SummaryRow {
  ALGORITHM_ID: number;
  SLUG: string;
  NAME: string;
  SUMMARY: string | null;
  CATEGORY: string;
  DIFFICULTY: string | null;
  VISUALIZER_TYPE: string;
}

interface DetailRow extends SummaryRow {
  DESCRIPTION: string | null;
  SPACE_COMPLEXITY: string | null;
}

function mapSummary(row: SummaryRow): AlgorithmSummary {
  return {
    id: row.ALGORITHM_ID,
    slug: row.SLUG,
    name: row.NAME,
    summary: row.SUMMARY,
    category: row.CATEGORY,
    difficulty: row.DIFFICULTY,
    visualizerType: row.VISUALIZER_TYPE,
  };
}

const SUMMARY_COLS = `
  a.algorithm_id, a.slug, a.name, a.summary, a.difficulty, a.visualizer_type,
  c.slug AS category`;

export class OracleAlgorithmRepository implements IAlgorithmRepository {
  async findAll(filters: AlgorithmFilters): Promise<AlgorithmSummary[]> {
    const conn = await getConnection();
    try {
      const binds: Record<string, string | number> = {};
      const clauses: string[] = [];
      if (filters.category) {
        clauses.push('c.slug = :category');
        binds.category = filters.category;
      }
      if (filters.difficulty) {
        clauses.push('a.difficulty = :difficulty');
        binds.difficulty = filters.difficulty;
      }
      if (filters.search) {
        clauses.push('(LOWER(a.name) LIKE :search OR LOWER(a.summary) LIKE :search)');
        binds.search = `%${filters.search.toLowerCase()}%`;
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const result = await conn.execute<SummaryRow>(
        `SELECT ${SUMMARY_COLS}
           FROM algorithms a
           JOIN categories c ON c.category_id = a.category_id
           ${where}
          ORDER BY a.name`,
        binds,
      );
      return (result.rows ?? []).map(mapSummary);
    } finally {
      await conn.close();
    }
  }

  async findBySlug(slug: string): Promise<AlgorithmDetail | null> {
    const conn = await getConnection();
    try {
      return await this.loadDetail(conn, 'a.slug = :key', { key: slug });
    } finally {
      await conn.close();
    }
  }

  async findById(id: number): Promise<AlgorithmDetail | null> {
    const conn = await getConnection();
    try {
      return await this.loadDetail(conn, 'a.algorithm_id = :key', { key: id });
    } finally {
      await conn.close();
    }
  }

  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const conn = await getConnection();
    try {
      const extra = excludeId !== undefined ? ' AND algorithm_id != :excludeId' : '';
      const binds: Record<string, string | number> = { slug };
      if (excludeId !== undefined) binds.excludeId = excludeId;
      const result = await conn.execute<{ CNT: number }>(
        `SELECT COUNT(*) AS CNT FROM algorithms WHERE slug = :slug${extra}`,
        binds,
      );
      return (result.rows?.[0]?.CNT ?? 0) > 0;
    } finally {
      await conn.close();
    }
  }

  async create(algorithm: NewAlgorithm): Promise<AlgorithmDetail> {
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        `INSERT INTO algorithms
           (category_id, slug, name, summary, description, visualizer_type, difficulty, space_complexity)
         VALUES (:categoryId, :slug, :name, :summary, :description, :visualizerType, :difficulty, :spaceComplexity)
         RETURNING algorithm_id INTO :id`,
        {
          categoryId: algorithm.categoryId,
          slug: algorithm.slug,
          name: algorithm.name,
          summary: algorithm.summary ?? null,
          description: algorithm.description ?? null,
          visualizerType: algorithm.visualizerType,
          difficulty: algorithm.difficulty ?? null,
          spaceComplexity: algorithm.spaceComplexity ?? null,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: false },
      );
      const id = (result.outBinds as { id: number[] }).id[0];
      await this.insertChildren(conn, id, algorithm);
      await conn.commit();
      const detail = await this.loadDetail(conn, 'a.algorithm_id = :key', { key: id });
      if (!detail) throw new Error('Failed to load created algorithm');
      return detail;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      await conn.close();
    }
  }

  async update(id: number, algorithm: NewAlgorithm): Promise<AlgorithmDetail | null> {
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        `UPDATE algorithms
            SET category_id = :categoryId, slug = :slug, name = :name, summary = :summary,
                description = :description, visualizer_type = :visualizerType,
                difficulty = :difficulty, space_complexity = :spaceComplexity,
                updated_at = CURRENT_TIMESTAMP
          WHERE algorithm_id = :id`,
        {
          id,
          categoryId: algorithm.categoryId,
          slug: algorithm.slug,
          name: algorithm.name,
          summary: algorithm.summary ?? null,
          description: algorithm.description ?? null,
          visualizerType: algorithm.visualizerType,
          difficulty: algorithm.difficulty ?? null,
          spaceComplexity: algorithm.spaceComplexity ?? null,
        },
        { autoCommit: false },
      );
      if (!result.rowsAffected) {
        await conn.rollback();
        return null;
      }
      await conn.execute(`DELETE FROM time_complexities WHERE algorithm_id = :id`, { id });
      await conn.execute(`DELETE FROM code_snippets WHERE algorithm_id = :id`, { id });
      await this.insertChildren(conn, id, algorithm);
      await conn.commit();
      return this.loadDetail(conn, 'a.algorithm_id = :key', { key: id });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      await conn.close();
    }
  }

  async remove(id: number): Promise<boolean> {
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        `DELETE FROM algorithms WHERE algorithm_id = :id`,
        { id },
        { autoCommit: true },
      );
      return (result.rowsAffected ?? 0) > 0;
    } finally {
      await conn.close();
    }
  }

  /** Inserts time_complexities + code_snippets for an algorithm (no commit). */
  private async insertChildren(conn: Connection, id: number, algorithm: NewAlgorithm): Promise<void> {
    for (const caseType of ['best', 'average', 'worst'] as const) {
      await conn.execute(
        `INSERT INTO time_complexities (algorithm_id, case_type, big_o)
         VALUES (:algorithmId, :caseType, :bigO)`,
        { algorithmId: id, caseType, bigO: algorithm.timeComplexities[caseType] },
      );
    }
    for (const snippet of algorithm.codeSnippets) {
      await conn.execute(
        `INSERT INTO code_snippets (algorithm_id, language, code)
         VALUES (:algorithmId, :language, :code)`,
        { algorithmId: id, language: snippet.language, code: snippet.code },
      );
    }
  }

  private async loadDetail(
    conn: Connection,
    keyClause: string,
    binds: Record<string, string | number>,
  ): Promise<AlgorithmDetail | null> {
    const algoRes = await conn.execute<DetailRow>(
      `SELECT ${SUMMARY_COLS}, a.description, a.space_complexity
         FROM algorithms a
         JOIN categories c ON c.category_id = a.category_id
        WHERE ${keyClause}`,
      binds,
    );
    const row = algoRes.rows?.[0];
    if (!row) return null;

    const cplxRes = await conn.execute<{ CASE_TYPE: string; BIG_O: string }>(
      `SELECT case_type, big_o FROM time_complexities WHERE algorithm_id = :id`,
      { id: row.ALGORITHM_ID },
    );
    const time: TimeComplexities = { best: '', average: '', worst: '' };
    for (const c of cplxRes.rows ?? []) {
      if (c.CASE_TYPE === 'best' || c.CASE_TYPE === 'average' || c.CASE_TYPE === 'worst') {
        time[c.CASE_TYPE] = c.BIG_O;
      }
    }

    const snipRes = await conn.execute<{ LANGUAGE: string; CODE: string }>(
      `SELECT language, code FROM code_snippets WHERE algorithm_id = :id ORDER BY language`,
      { id: row.ALGORITHM_ID },
    );

    return {
      ...mapSummary(row),
      description: row.DESCRIPTION,
      spaceComplexity: row.SPACE_COMPLEXITY,
      timeComplexities: time,
      codeSnippets: (snipRes.rows ?? []).map((s) => ({ language: s.LANGUAGE, code: s.CODE })),
    };
  }
}
