import { z } from "zod";

const revenueLoopEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  REVENUE_LOOP_STORE_BASE_URL: z.string().default("http://localhost:4000"),
  REVENUE_LOOP_DEPLOY_ROOT: z.string().default("./data/deployed-stores"),
  REVENUE_LOOP_LIVE_FULFILLMENT_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  REVENUE_LOOP_MIN_PROFIT_CENTS: z.coerce.number().default(100),
  REVENUE_LOOP_MOCK_PAYMENTS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type RevenueLoopEnv = z.infer<typeof revenueLoopEnvSchema>;

/** Revenue loop configuration — live fulfillment disabled by default (Protect The Empire). */
export function loadRevenueLoopEnv(
  env: NodeJS.ProcessEnv = process.env,
): RevenueLoopEnv {
  const parsed = revenueLoopEnvSchema.parse(env);
  const mockPayments =
    parsed.REVENUE_LOOP_MOCK_PAYMENTS ||
    !parsed.STRIPE_SECRET_KEY ||
    parsed.STRIPE_SECRET_KEY.length === 0;

  return {
    ...parsed,
    REVENUE_LOOP_MOCK_PAYMENTS: mockPayments,
  };
}

export function isStripeConfigured(config: RevenueLoopEnv): boolean {
  return Boolean(config.STRIPE_SECRET_KEY && !config.REVENUE_LOOP_MOCK_PAYMENTS);
}
