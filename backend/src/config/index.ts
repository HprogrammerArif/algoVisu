import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REQUIRED = ['DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING', 'JWT_SECRET'] as const;

export interface AppConfig {
  env: string;
  port: number;
  corsOrigin: string;
  db: {
    user: string;
    password: string;
    connectString: string;
    poolMin: number;
    poolMax: number;
  };
  jwt: { secret: string; expiresIn: string };
  admin: { email?: string; password?: string };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  return {
    env: env.NODE_ENV || 'development',
    port: Number(env.PORT) || 3000,
    corsOrigin: env.CORS_ORIGIN || 'http://127.0.0.1:5500',
    db: {
      user: env.DB_USER as string,
      password: env.DB_PASSWORD as string,
      connectString: env.DB_CONNECT_STRING as string,
      poolMin: Number(env.DB_POOL_MIN) || 2,
      poolMax: Number(env.DB_POOL_MAX) || 10,
    },
    jwt: {
      secret: env.JWT_SECRET as string,
      expiresIn: env.JWT_EXPIRES_IN || '1d',
    },
    admin: {
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
    },
  };
}

let cached: AppConfig | undefined;
export function getConfig(): AppConfig {
  if (!cached) cached = loadConfig();
  return cached;
}
