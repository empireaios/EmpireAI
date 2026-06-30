import { z } from "zod";

const grandKingsRevenueEnvSchema = z.object({
  GRAND_KINGS_REVENUE_ENGINE_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  GRAND_KINGS_REVENUE_ENGINE_MOCK: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type GrandKingsRevenueEnv = z.infer<typeof grandKingsRevenueEnvSchema>;

export function loadGrandKingsRevenueEnv(
  env: NodeJS.ProcessEnv = process.env,
): GrandKingsRevenueEnv {
  return grandKingsRevenueEnvSchema.parse(env);
}

export function isGrandKingsRevenueEngineEnabled(config: GrandKingsRevenueEnv): boolean {
  return config.GRAND_KINGS_REVENUE_ENGINE_ENABLED;
}
