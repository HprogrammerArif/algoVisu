import oracledb from 'oracledb';
import { getConnection } from '../connection';
import type {
  ICategoryRepository,
  NewCategory,
} from '../../../domain/repositories/ICategoryRepository';
import type { Category } from '../../../domain/entities/Category';

interface CategoryRow {
  CATEGORY_ID: number;
  SLUG: string;
  NAME: string;
  DESCRIPTION: string | null;
  DISPLAY_ORDER: number;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.CATEGORY_ID,
    slug: row.SLUG,
    name: row.NAME,
    description: row.DESCRIPTION,
    displayOrder: row.DISPLAY_ORDER,
  };
}

const SELECT = `SELECT category_id, slug, name, description, display_order FROM categories`;

export class OracleCategoryRepository implements ICategoryRepository {
  async findAll(): Promise<Category[]> {
    const conn = await getConnection();
    try {
      const result = await conn.execute<CategoryRow>(`${SELECT} ORDER BY display_order, name`);
      return (result.rows ?? []).map(mapCategory);
    } finally {
      await conn.close();
    }
  }

  async findById(id: number): Promise<Category | null> {
    const conn = await getConnection();
    try {
      const result = await conn.execute<CategoryRow>(`${SELECT} WHERE category_id = :id`, { id });
      const row = result.rows?.[0];
      return row ? mapCategory(row) : null;
    } finally {
      await conn.close();
    }
  }

  async create(category: NewCategory): Promise<Category> {
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        `INSERT INTO categories (slug, name, description, display_order)
         VALUES (:slug, :name, :description, :displayOrder)
         RETURNING category_id INTO :id`,
        {
          slug: category.slug,
          name: category.name,
          description: category.description ?? null,
          displayOrder: category.displayOrder ?? 0,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true },
      );
      const id = (result.outBinds as { id: number[] }).id[0];
      const created = await this.findById(id);
      if (!created) throw new Error('Failed to load created category');
      return created;
    } finally {
      await conn.close();
    }
  }

  async update(id: number, category: NewCategory): Promise<Category | null> {
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        `UPDATE categories
            SET slug = :slug, name = :name, description = :description, display_order = :displayOrder
          WHERE category_id = :id`,
        {
          id,
          slug: category.slug,
          name: category.name,
          description: category.description ?? null,
          displayOrder: category.displayOrder ?? 0,
        },
        { autoCommit: true },
      );
      if (!result.rowsAffected) return null;
      return this.findById(id);
    } finally {
      await conn.close();
    }
  }

  async remove(id: number): Promise<boolean> {
    const conn = await getConnection();
    try {
      const result = await conn.execute(`DELETE FROM categories WHERE category_id = :id`, { id }, {
        autoCommit: true,
      });
      return (result.rowsAffected ?? 0) > 0;
    } finally {
      await conn.close();
    }
  }

  async countAlgorithms(id: number): Promise<number> {
    const conn = await getConnection();
    try {
      const result = await conn.execute<{ CNT: number }>(
        `SELECT COUNT(*) AS CNT FROM algorithms WHERE category_id = :id`,
        { id },
      );
      return result.rows?.[0]?.CNT ?? 0;
    } finally {
      await conn.close();
    }
  }
}
