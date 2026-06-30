import { z } from "zod";

/** Package lifecycle status — no production deployment is executed. */
export const DEPLOYMENT_STATUSES = [
  "PACKAGE_CREATED",
  "PACKAGE_VALIDATED",
  "PACKAGE_FAILED",
] as const;

export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export const deploymentStatusSchema = z.enum(DEPLOYMENT_STATUSES);

/** Validates a deployment status value. */
export function validateDeploymentStatus(value: unknown): DeploymentStatus {
  return deploymentStatusSchema.parse(value);
}
