import { z } from "zod";

const firstRevenueValidationEnvSchema = z.object({
  FIRST_REVENUE_VALIDATION_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  FIRST_REVENUE_VALIDATION_MOCK: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export type FirstRevenueValidationEnv = z.infer<typeof firstRevenueValidationEnvSchema>;

export function loadFirstRevenueValidationEnv(
  env: NodeJS.ProcessEnv = process.env,
): FirstRevenueValidationEnv {
  return firstRevenueValidationEnvSchema.parse(env);
}

export function isFirstRevenueValidationEnabled(config: FirstRevenueValidationEnv): boolean {
  return config.FIRST_REVENUE_VALIDATION_ENABLED;
}
