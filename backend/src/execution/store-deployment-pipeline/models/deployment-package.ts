import { z } from "zod";

import { hostingTargetSchema, type HostingTarget } from "../../deployment-blueprint/models/hosting-target.js";

export type DeploymentPackageId = string;

/** Descriptor for a generated store deployment package. */
export type DeploymentPackage = {
  packageId: DeploymentPackageId;
  packageRoot: string;
  hostingTarget: HostingTarget;
  framework: string;
  primaryDomain: string;
  artifactCount: number;
  packageVersion: string;
};

export const deploymentPackageSchema = z.object({
  packageId: z.string().min(1),
  packageRoot: z.string().min(1),
  hostingTarget: hostingTargetSchema,
  framework: z.string().min(1),
  primaryDomain: z.string().min(1),
  artifactCount: z.number().int().min(1),
  packageVersion: z.string().min(1),
});

/** Validates a DeploymentPackage record shape. */
export function validateDeploymentPackage(value: unknown): DeploymentPackage {
  return deploymentPackageSchema.parse(value);
}
