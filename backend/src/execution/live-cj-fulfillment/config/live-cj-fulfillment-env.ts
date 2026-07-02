import { z } from "zod";

const liveCjFulfillmentEnvSchema = z.object({
  LIVE_CJ_FULFILLMENT_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  LIVE_CJ_FULFILLMENT_MOCK: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  LIVE_CJ_FULFILLMENT_MAX_RETRY_ATTEMPTS: z.coerce.number().default(3),
  LIVE_CJ_FULFILLMENT_TRACKING_POLL_INTERVAL_MS: z.coerce.number().default(300_000),
});

export type LiveCjFulfillmentEnv = z.infer<typeof liveCjFulfillmentEnvSchema>;

/** LIVE CJ fulfillment config — disabled by default (Protect The Empire). */
export function loadLiveCjFulfillmentEnv(
  env: NodeJS.ProcessEnv = process.env,
): LiveCjFulfillmentEnv {
  const parsed = liveCjFulfillmentEnvSchema.parse(env);
  const mockMode =
    parsed.LIVE_CJ_FULFILLMENT_MOCK ||
    !(process.env.CJ_API_KEY?.trim() || process.env.CJ_DROPSHIPPING_API_KEY?.trim());

  return { ...parsed, LIVE_CJ_FULFILLMENT_MOCK: mockMode };
}

export function isLiveCjFulfillmentAllowed(config: LiveCjFulfillmentEnv): boolean {
  return config.LIVE_CJ_FULFILLMENT_ENABLED;
}
