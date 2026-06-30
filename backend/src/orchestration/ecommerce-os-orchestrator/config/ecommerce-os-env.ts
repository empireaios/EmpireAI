import { z } from "zod";

const ecommerceOsEnvSchema = z.object({
  ECOMMERCE_OS_ORCHESTRATOR_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

export type EcommerceOsEnv = z.infer<typeof ecommerceOsEnvSchema>;

export function loadEcommerceOsEnv(env: NodeJS.ProcessEnv = process.env): EcommerceOsEnv {
  return ecommerceOsEnvSchema.parse(env);
}

export function isEcommerceOsOrchestratorEnabled(config?: EcommerceOsEnv): boolean {
  const env = config ?? loadEcommerceOsEnv();
  return env.ECOMMERCE_OS_ORCHESTRATOR_ENABLED;
}
