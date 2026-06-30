import { z } from "zod";

export const DEPLOYMENT_SIGNAL_TYPES = [
  "framework_fit",
  "hosting_alignment",
  "env_readiness",
  "domain_readiness",
  "step_coverage",
  "build_metadata_alignment",
  "deployment_composite",
] as const;

export type DeploymentSignalType = (typeof DEPLOYMENT_SIGNAL_TYPES)[number];

/** Individual factor contributing to deployment blueprint scoring. */
export type DeploymentSignal = {
  signalType: DeploymentSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const deploymentSignalSchema = z.object({
  signalType: z.enum(DEPLOYMENT_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a DeploymentSignal record shape. */
export function validateDeploymentSignal(value: unknown): DeploymentSignal {
  return deploymentSignalSchema.parse(value);
}
