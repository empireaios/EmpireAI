import { z } from "zod";

import { hostingTargetSchema, type HostingTarget } from "../../deployment-blueprint/models/hosting-target.js";

export const DEPLOYMENT_EXECUTION_MODES = ["PACKAGE_ONLY"] as const;

export type DeploymentExecutionMode = (typeof DEPLOYMENT_EXECUTION_MODES)[number];

/** Metadata describing how a deployment package was assembled. */
export type DeploymentMetadata = {
  deploymentPlanId: string | null;
  projectId: string;
  generatedStorefrontId: string;
  storeId: string;
  brandId: string;
  hostingTarget: HostingTarget;
  buildCommand: string;
  startCommand: string;
  outputDirectory: string;
  environmentVariableCount: number;
  stepCount: number;
  sourceFileCount: number;
  planConfidence: number;
  projectConfidence: number;
  executionMode: DeploymentExecutionMode;
  notes: string;
};

export const deploymentMetadataSchema = z.object({
  deploymentPlanId: z.string().nullable(),
  projectId: z.string().min(1),
  generatedStorefrontId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  hostingTarget: hostingTargetSchema,
  buildCommand: z.string().min(1),
  startCommand: z.string().min(1),
  outputDirectory: z.string().min(1),
  environmentVariableCount: z.number().int().min(0),
  stepCount: z.number().int().min(1),
  sourceFileCount: z.number().int().min(1),
  planConfidence: z.number().min(0).max(100),
  projectConfidence: z.number().min(0).max(100),
  executionMode: z.enum(DEPLOYMENT_EXECUTION_MODES),
  notes: z.string().min(1),
});

/** Validates DeploymentMetadata record shape. */
export function validateDeploymentMetadata(value: unknown): DeploymentMetadata {
  return deploymentMetadataSchema.parse(value);
}
