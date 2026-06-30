import { z } from "zod";

export const DEPLOYMENT_PIPELINE_SIGNAL_TYPES = [
  "plan_project_alignment",
  "source_file_coverage",
  "config_completeness",
  "env_readiness",
  "hosting_target_fit",
  "manifest_coverage",
  "pipeline_composite",
] as const;

export type DeploymentPipelineSignalType = (typeof DEPLOYMENT_PIPELINE_SIGNAL_TYPES)[number];

/** Individual factor contributing to store deployment pipeline scoring. */
export type DeploymentPipelineSignal = {
  signalType: DeploymentPipelineSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const deploymentPipelineSignalSchema = z.object({
  signalType: z.enum(DEPLOYMENT_PIPELINE_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a DeploymentPipelineSignal record shape. */
export function validateDeploymentPipelineSignal(value: unknown): DeploymentPipelineSignal {
  return deploymentPipelineSignalSchema.parse(value);
}
