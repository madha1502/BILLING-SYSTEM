import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  JWT_SECRET: z.string().default('super-secret-kiranapro-jwt-key-2026!'),
  JWT_EXPIRES_IN: z.string().default('30d'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/kiranapro_db?schema=public'),
  CORS_ORIGIN: z.string().default('*'),
});

export const env = envSchema.parse(process.env);
