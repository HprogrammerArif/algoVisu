import type { Connection } from 'oracledb';

const ROLES = [
  { name: 'admin', description: 'Full catalog management' },
  { name: 'teacher', description: 'Bookmarks, progress, classroom use' },
  { name: 'student', description: 'Bookmarks and progress tracking' },
];

export async function seedRoles(conn: Connection): Promise<void> {
  for (const role of ROLES) {
    await conn.execute(
      `MERGE INTO roles r
         USING (SELECT :name AS name FROM dual) src
         ON (r.name = src.name)
       WHEN NOT MATCHED THEN
         INSERT (name, description) VALUES (:name, :description)`,
      { name: role.name, description: role.description },
    );
  }
  console.log(`  seeded roles (${ROLES.length})`);
}
