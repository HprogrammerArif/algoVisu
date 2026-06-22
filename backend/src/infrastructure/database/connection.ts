import oracledb, { type Pool, type Connection } from 'oracledb';
import { oraclePoolConfig } from '../../config/database';

// Return CLOBs as JS strings and rows as plain objects.
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

let pool: Pool | undefined;

export async function initPool(): Promise<Pool> {
  if (pool) return pool;
  pool = await oracledb.createPool(oraclePoolConfig());
  return pool;
}

export async function getConnection(): Promise<Connection> {
  if (!pool) await initPool();
  return (pool as Pool).getConnection();
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close(10);
    pool = undefined;
  }
}
