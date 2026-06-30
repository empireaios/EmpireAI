import { z } from "zod";

const productionDeploymentEnvSchema = z.object({
  VERCEL_API_TOKEN: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
  PRODUCTION_DEPLOYMENT_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  PRODUCTION_DEPLOY_ROOT: z.string().default("./data/production-deployments"),
  PRODUCTION_DEPLOY_MOCK: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type ProductionDeploymentEnv = z.infer<typeof productionDeploymentEnvSchema>;

/** Production deployment config — live Vercel disabled by default (Protect The Empire). */
export function loadProductionDeploymentEnv(
  env: NodeJS.ProcessEnv = process.env,
): ProductionDeploymentEnv {
  const parsed = productionDeploymentEnvSchema.parse(env);
  const mockMode =
    parsed.PRODUCTION_DEPLOY_MOCK ||
    !parsed.VERCEL_API_TOKEN ||
    parsed.VERCEL_API_TOKEN.length === 0;

  return {
    ...parsed,
    PRODUCTION_DEPLOY_MOCK: mockMode,
  };
}

export function isVercelLiveConfigured(config: ProductionDeploymentEnv): boolean {
  return Boolean(
    config.VERCEL_API_TOKEN &&
      !config.PRODUCTION_DEPLOY_MOCK &&
      config.PRODUCTION_DEPLOYMENT_ENABLED,
  );
}
