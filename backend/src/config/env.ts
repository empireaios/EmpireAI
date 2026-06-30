import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

/** Normalize Railway / ops aliases before Zod parse (env-only, no business logic). */
function normalizeProcessEnv(): NodeJS.ProcessEnv {
  const normalized = { ...process.env };

  if (!normalized.GOOGLE_AI_API_KEY?.trim() && normalized.GEMINI_API_KEY?.trim()) {
    normalized.GOOGLE_AI_API_KEY = normalized.GEMINI_API_KEY;
  }

  if (!normalized.EMPIREAI_REPO_ROOT?.trim()) {
    if (normalized.RAILWAY_ENVIRONMENT || normalized.RAILWAY_SERVICE_NAME) {
      normalized.EMPIREAI_REPO_ROOT = "/app";
    }
  }

  return normalized;
}

function defaultDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  return process.env.VERCEL ? "/tmp/empireai-brain.db" : "./data/empireai-brain.db";
}

function defaultCorsOrigin(): string {
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:5173";
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  REDIS_OPTIONAL: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  DATABASE_PATH: z.string().default(defaultDatabasePath()),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  DEFAULT_LLM_PROVIDER: z
    .enum(["openai", "anthropic", "gemini"])
    .default("openai"),
  DEFAULT_LLM_MODEL: z.string().default("gpt-4o-mini"),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  SESSION_SECRET: z.string().min(32).default("empireai-dev-session-secret-change-in-production"),
  SESSION_TTL_SECONDS: z.coerce.number().default(60 * 60 * 24 * 7),
  CORS_ORIGIN: z.string().default(defaultCorsOrigin()),
  ADMIN_EMAIL: z.string().default("admin@empireai.com"),
  ADMIN_PASSWORD: z.string().default("EmpireAI2026!"),
  FOUNDER_EMAIL: z.string().default("founder@empireai.com"),
  FOUNDER_PASSWORD: z.string().default("EmpireAI2026!"),
  EMPIREAI_REPO_ROOT: z.string().optional(),
  GUARDIAN_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(normalizeProcessEnv());

export function requireProviderKey(
  provider: "openai" | "anthropic" | "gemini",
): string {
  const keys = {
    openai: env.OPENAI_API_KEY,
    anthropic: env.ANTHROPIC_API_KEY,
    gemini: env.GOOGLE_AI_API_KEY,
  } as const;

  const key = keys[provider];
  if (!key) {
    throw new Error(
      `Missing API key for ${provider}. Set ${provider.toUpperCase()}_API_KEY in environment.`,
    );
  }
  return key;
}
