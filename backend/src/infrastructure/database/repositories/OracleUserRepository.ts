import oracledb from 'oracledb';
import { getConnection } from '../connection';
import type { IUserRepository, NewUser } from '../../../domain/repositories/IUserRepository';
import type { User } from '../../../domain/entities/User';

interface UserRow {
  USER_ID: number;
  ROLE_ID: number;
  ROLE: string;
  FULL_NAME: string;
  EMAIL: string;
  PASSWORD_HASH: string;
  IS_ACTIVE: number;
}

function mapUser(row: UserRow): User {
  return {
    id: row.USER_ID,
    roleId: row.ROLE_ID,
    role: row.ROLE,
    fullName: row.FULL_NAME,
    email: row.EMAIL,
    passwordHash: row.PASSWORD_HASH,
    isActive: row.IS_ACTIVE === 1,
  };
}

const SELECT_USER = `
  SELECT u.user_id, u.role_id, r.name AS role, u.full_name, u.email,
         u.password_hash, u.is_active
    FROM users u
    JOIN roles r ON r.role_id = u.role_id`;

export class OracleUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const conn = await getConnection();
    try {
      const result = await conn.execute<UserRow>(`${SELECT_USER} WHERE u.email = :email`, { email });
      const row = result.rows?.[0];
      return row ? mapUser(row) : null;
    } finally {
      await conn.close();
    }
  }

  async findById(id: number): Promise<User | null> {
    const conn = await getConnection();
    try {
      const result = await conn.execute<UserRow>(`${SELECT_USER} WHERE u.user_id = :id`, { id });
      const row = result.rows?.[0];
      return row ? mapUser(row) : null;
    } finally {
      await conn.close();
    }
  }

  async findRoleIdByName(name: string): Promise<number | null> {
    const conn = await getConnection();
    try {
      const result = await conn.execute<{ ROLE_ID: number }>(
        `SELECT role_id FROM roles WHERE name = :name`,
        { name },
      );
      return result.rows?.[0]?.ROLE_ID ?? null;
    } finally {
      await conn.close();
    }
  }

  async create(user: NewUser): Promise<User> {
    const conn = await getConnection();
    try {
      const result = await conn.execute(
        `INSERT INTO users (role_id, full_name, email, password_hash)
         VALUES (:roleId, :fullName, :email, :passwordHash)
         RETURNING user_id INTO :id`,
        {
          roleId: user.roleId,
          fullName: user.fullName,
          email: user.email,
          passwordHash: user.passwordHash,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true },
      );
      const id = (result.outBinds as { id: number[] }).id[0];
      const created = await this.findById(id);
      if (!created) throw new Error('Failed to load newly created user');
      return created;
    } finally {
      await conn.close();
    }
  }
}
