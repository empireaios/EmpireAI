import { z } from "zod";

import {
  DEPLOYMENT_STATUSES,
  type DeploymentStatus,
} from "../../../execution/store-deployment-pipeline/models/deployment-status.js";

/** Deployment row displayed on the founder command center dashboard. */
export type DashboardDeploymentItem = {
  recordId: string;
  storeId: string;
  deploymentStatus: DeploymentStatus;
  hostingTarget: string;
  confidence: number;
};

/** Aggregated deployment status section for the founder dashboard. */
export type DashboardDeploymentSection = {
  totalCount: number;
  validatedCount: number;
  failedCount: number;
  healthScore: number;
  summary: string;
  items: DashboardDeploymentItem[];
};

export const dashboardDeploymentItemSchema = z.object({
  recordId: z.string().min(1),
  storeId: z.string().min(1),
  deploymentStatus: z.enum(DEPLOYMENT_STATUSES),
  hostingTarget: z.string().min(1),
  confidence: z.number().min(0).max(100),
});

export const dashboardDeploymentSectionSchema = z.object({
  totalCount: z.number().int().min(0),
  validatedCount: z.number().int().min(0),
  failedCount: z.number().int().min(0),
  healthScore: z.number().min(0).max(100),
  summary: z.string().min(1),
  items: z.array(dashboardDeploymentItemSchema),
});

/** Validates a DashboardDeploymentSection record shape. */
export function validateDashboardDeploymentSection(
  value: unknown,
): DashboardDeploymentSection {
  return dashboardDeploymentSectionSchema.parse(value);
}
