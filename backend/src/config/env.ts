import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().default('*'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  REFRESH_COOKIE_MAX_AGE_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(7 * 24 * 60 * 60 * 1000), // 7 days

  // --- Mail (Mailtrap SMTP) ---
  MAILTRAP_HOST: z.string().min(1, 'MAILTRAP_HOST is required'),
  MAILTRAP_PORT: z.coerce.number().int().positive().default(2525),
  MAILTRAP_USER: z.string().min(1, 'MAILTRAP_USER is required'),
  MAILTRAP_PASS: z.string().min(1, 'MAILTRAP_PASS is required'),
  MAIL_FROM: z.string().email().default('no-reply@yourplatform.com'),

  // --- Used to build links sent in emails (e.g. doctor invitation) ---
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),

  // --- Cloudflare R2 (book storage) ---
  R2_ACCOUNT_ID: z.string().min(1, 'R2_ACCOUNT_ID is required'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
  R2_BUCKET: z.string().min(1, 'R2_BUCKET is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast: an invalid/missing configuration should never reach runtime.
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  corsOrigin: parsed.data.CORS_ORIGIN,
  corsOrigins: parsed.data.CORS_ORIGIN === '*'
    ? []
    : parsed.data.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
  frontendOrigin: new URL(parsed.data.FRONTEND_URL).origin,
  isProduction: parsed.data.NODE_ENV === 'production',
  isDevelopment: parsed.data.NODE_ENV === 'development',
  jwt: {
    accessSecret: parsed.data.JWT_ACCESS_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    accessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },
  cookies: {
    refreshMaxAgeMs: parsed.data.REFRESH_COOKIE_MAX_AGE_MS,
  },
  mail: {
    host: parsed.data.MAILTRAP_HOST,
    port: parsed.data.MAILTRAP_PORT,
    user: parsed.data.MAILTRAP_USER,
    pass: parsed.data.MAILTRAP_PASS,
    from: parsed.data.MAIL_FROM,
  },
  frontendUrl: parsed.data.FRONTEND_URL,
  r2: {
    accountId: parsed.data.R2_ACCOUNT_ID,
    accessKeyId: parsed.data.R2_ACCESS_KEY_ID,
    secretAccessKey: parsed.data.R2_SECRET_ACCESS_KEY,
    bucket: parsed.data.R2_BUCKET,
  },
} as const;