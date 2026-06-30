import { z } from "zod";

const livePaymentEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  LIVE_PAYMENT_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  LIVE_PAYMENT_MOCK: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  LIVE_PAYMENT_STORE_BASE_URL: z.string().default("http://localhost:4000"),
});

export type LivePaymentEnv = z.infer<typeof livePaymentEnvSchema>;

export function loadLivePaymentEnv(env: NodeJS.ProcessEnv = process.env): LivePaymentEnv {
  const parsed = livePaymentEnvSchema.parse(env);
  const mockMode =
    parsed.LIVE_PAYMENT_MOCK ||
    !parsed.STRIPE_SECRET_KEY ||
    parsed.STRIPE_SECRET_KEY.length === 0;

  return { ...parsed, LIVE_PAYMENT_MOCK: mockMode };
}

export function isStripeLiveConfigured(config: LivePaymentEnv): boolean {
  return Boolean(config.STRIPE_SECRET_KEY && !config.LIVE_PAYMENT_MOCK);
}
