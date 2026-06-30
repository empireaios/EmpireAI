import { z } from "zod";

export const DEPLOYMENT_STEP_STATUSES = ["pending", "ready", "blocked"] as const;

export type DeploymentStepStatus = (typeof DEPLOYMENT_STEP_STATUSES)[number];

/** A single ordered step in a deployment plan. */
export type DeploymentStep = {
  stepId: string;
  order: number;
  title: string;
  description: string;
  command: string | null;
  status: DeploymentStepStatus;
};

export type DeploymentStepCreateInput = Omit<DeploymentStep, "stepId"> & {
  stepId?: string;
};

export const deploymentStepSchema = z.object({
  stepId: z.string().min(1),
  order: z.number().int().min(0),
  title: z.string().min(1),
  description: z.string().min(1),
  command: z.string().nullable(),
  status: z.enum(DEPLOYMENT_STEP_STATUSES),
});

/** Validates a DeploymentStep record shape. */
export function validateDeploymentStep(value: unknown): DeploymentStep {
  return deploymentStepSchema.parse(value);
}
