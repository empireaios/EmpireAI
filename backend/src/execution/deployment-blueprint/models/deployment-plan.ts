import { z } from "zod";

import {
  deploymentSignalSchema,
  type DeploymentSignal,
} from "./deployment-signal.js";
import { deploymentStepSchema, type DeploymentStep } from "./deployment-step.js";
import {
  domainRequirementsSchema,
  type DomainRequirements,
} from "./domain-requirements.js";
import { hostingTargetSchema, type HostingTarget } from "./hosting-target.js";

export type DeploymentPlanId = string;

/** Deployment plan generated from a materialized storefront project. */
export type DeploymentPlan = {
  deploymentPlanId: DeploymentPlanId;
  workspaceId: string;
  projectId: string;
  generatedStorefrontId: string;
  storeId: string;
  brandId: string;
  framework: string;
  hostingTarget: HostingTarget;
  environmentVariables: Record<string, string>;
  domainRequirements: DomainRequirements;
  deploymentSteps: DeploymentStep[];
  confidence: number;
  signals: DeploymentSignal[];
  createdAt: string;
  updatedAt: string;
};

export type DeploymentPlanCreateInput = Omit<
  DeploymentPlan,
  "deploymentPlanId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const deploymentPlanSchema = z.object({
  deploymentPlanId: z.string().min(1),
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  generatedStorefrontId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  framework: z.string().min(1),
  hostingTarget: hostingTargetSchema,
  environmentVariables: z.record(z.string(), z.string()),
  domainRequirements: domainRequirementsSchema,
  deploymentSteps: z.array(deploymentStepSchema).min(1),
  confidence: z.number().min(0).max(100),
  signals: z.array(deploymentSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a DeploymentPlan record shape. */
export function validateDeploymentPlan(value: unknown): DeploymentPlan {
  return deploymentPlanSchema.parse(value);
}
