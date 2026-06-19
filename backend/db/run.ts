import path from 'path';
import fs from 'fs';
import type { Connection } from 'oracledb';
import { initPool, getConnection, closePool } from '../src/infrastructure/database/connection';
import { seedRoles } from './seeds/seedRoles';
import { seedAdmin } from './seeds/seedAdmin';
import { seedCategories } from './seeds/seedCategories';
import { seedCatalog } from './seeds/seedCatalog';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Reverse dependency order — children dropped before parents.
const TABLES_REVERSE = [
  'progress',
  'bookmarks',
  'code_snippets',
  'time_complexities',
  'algorithms',
  'categories',
  'users',
  'roles',
];

/** Split a .sql file into individual statements separated by a line containing only `/`. */
function splitStatements(sql: string): string[] {
  return sql
    .split(/^\s*\/\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.split('\n').every((line) => line.trim().startsWith('--')));
}

async function dropAll(conn: Connection): Promise<void> {
  for (const table of TABLES_REVERSE) {
    // Swallow ORA-00942 (table does not exist) so reset is idempotent.
    await conn.execute(
      `BEGIN
         EXECUTE IMMEDIATE 'DROP TABLE ${table} CASCADE CONSTRAINTS PURGE';
       EXCEPTION WHEN OTHERS THEN
         IF SQLCODE != -942 THEN RAISE; END IF;
       END;`,
    );
    console.log(`  dropped (if existed): ${table}`);
  }
}

async function migrate(conn: Connection): Promise<void> {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    for (const statement of splitStatements(sql)) {
      await conn.execute(statement);
    }
    console.log(`  applied migration: ${file}`);
  }
}

async function seed(conn: Connection): Promise<void> {
  await seedRoles(conn);
  await seedAdmin(conn);
  await seedCategories(conn);
  await seedCatalog(conn);
}

async function main(): Promise<void> {
  const mode = process.argv[2] || '--setup';
  const valid = ['--setup', '--migrate', '--seed', '--reset'];
  if (!valid.includes(mode)) {
    console.error(`Unknown mode "${mode}". Use one of: ${valid.join(', ')}`);
    process.exit(1);
  }

  await initPool();
  const conn = await getConnection();
  try {
    if (mode === '--setup' || mode === '--migrate' || mode === '--reset') {
      console.log('Resetting schema...');
      await dropAll(conn);
    }
    if (mode === '--setup' || mode === '--migrate') {
      console.log('Applying migrations...');
      await migrate(conn);
    }
    if (mode === '--setup' || mode === '--seed') {
      console.log('Seeding data...');
      await seed(conn);
    }
    await conn.commit();
    console.log('Database task complete.');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
    await closePool();
  }
}

main().catch((err) => {
  console.error('Database task failed:', err);
  process.exit(1);
});
