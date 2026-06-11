import dotenv from 'dotenv';

dotenv.config();

export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  LOG_LEVEL: string;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value || defaultValue || '';
};

export const environment: Environment = {
  NODE_ENV: (process.env.NODE_ENV as any) || 'development',
  PORT: parseInt(getEnv('PORT', '3000'), 10),
  DATABASE_URL: getEnv('DATABASE_URL'),
  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '7d'),
  LOG_LEVEL: getEnv('LOG_LEVEL', 'debug'),
};

Object.freeze(environment);
