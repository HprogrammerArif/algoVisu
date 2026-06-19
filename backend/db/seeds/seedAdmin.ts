import type { Connection } from 'oracledb';
import bcrypt from 'bcryptjs';
import { getConfig } from '../../src/config';

/**
 * Seeds the default admin user. Password is bcrypt-hashed here (pure SQL cannot
 * hash), then stored via a bind variable. Idempotent via MERGE on email.
 */
export async function seedAdmin(conn: Connection): Promise<void> {
  const { admin } = getConfig();
  if (!admin.email || !admin.password) {
    console.log('  skipped admin seed (ADMIN_EMAIL/ADMIN_PASSWORD not set)');
    return;
  }
  const passwordHash = await bcrypt.hash(admin.password, 10);
  await conn.execute(
    `MERGE INTO users u
       USING (SELECT :email AS email FROM dual) src
       ON (u.email = src.email)
     WHEN NOT MATCHED THEN
       INSERT (role_id, full_name, email, password_hash)
       VALUES ((SELECT role_id FROM roles WHERE name = 'admin'), :fullName, :email, :passwordHash)`,
    { email: admin.email, fullName: 'Administrator', passwordHash },
  );
  console.log(`  seeded admin user (${admin.email})`);
}
