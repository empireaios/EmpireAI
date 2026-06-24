import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  REDIS_OPTIONAL: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  DATABASE_PATH: z.string().default("./data/empireai-brain.db"),
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
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  ADMIN_EMAIL: z.string().default("admin@empireai.com"),
  ADMIN_PASSWORD: z.string().default("EmpireAI2026!"),
  FOUNDER_EMAIL: z.string().default("founder@empireai.com"),
  FOUNDER_PASSWORD: z.string().default("EmpireAI2026!"),
  GUARDIAN_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

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
