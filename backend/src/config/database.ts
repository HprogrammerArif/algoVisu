import type { PoolAttributes } from 'oracledb';
import { getConfig } from './index';

export function oraclePoolConfig(): PoolAttributes {
  const { db } = getConfig();
  return {
    user: db.user,
    password: db.password,
    connectString: db.connectString,
    poolMin: db.poolMin,
    poolMax: db.poolMax,
    poolIncrement: 1,
  };
}
