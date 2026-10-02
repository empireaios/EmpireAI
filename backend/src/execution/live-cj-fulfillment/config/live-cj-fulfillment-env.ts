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
  const deployedRuntime = env.NODE_ENV === "production" || Boolean(
    env.RAILWAY_ENVIRONMENT || env.RAILWAY_ENVIRONMENT_NAME || env.RAILWAY_SERVICE_NAME || env.RAILWAY_DEPLOYMENT_ID,
  );
  if (deployedRuntime && parsed.LIVE_CJ_FULFILLMENT_MOCK) {
    throw new Error("CJ mock fulfillment is forbidden in production");
  }
  // Missing live configuration is a blocker, never implicit permission to fake it.
  return parsed;
}

export function isLiveCjFulfillmentAllowed(config: LiveCjFulfillmentEnv): boolean {
  return config.LIVE_CJ_FULFILLMENT_ENABLED;
}
