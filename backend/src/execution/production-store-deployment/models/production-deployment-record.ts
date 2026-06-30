import { z } from "zod";

export const PRODUCTION_DEPLOYMENT_STATUSES = [
  "PENDING_APPROVAL",
  "APPROVED",
  "BUILDING",
  "DEPLOYING",
  "DEPLOYED",
  "FAILED",
  "ROLLED_BACK",
  "CANCELLED",
] as const;

export type ProductionDeploymentStatus = (typeof PRODUCTION_DEPLOYMENT_STATUSES)[number];

export const DEPLOYMENT_EXECUTION_MODES = ["VERCEL_LIVE", "VERCEL_MOCK"] as const;

export type DeploymentExecutionMode = (typeof DEPLOYMENT_EXECUTION_MODES)[number];

/** Grand King approval gate — required before any production deploy. */
export type DeploymentApproval = {
  approvalToken: string;
  approvedBy: string;
  approvedAt: string;
  approved: true;
};

export type ProductionDeploymentRecord = {
  deploymentId: string;
  workspaceId: string;
  companyId: string;
  storeId: string;
  brandId: string;
  projectName: string;
  sourcePath: string;
  hostingTarget: "VERCEL";
  status: ProductionDeploymentStatus;
  executionMode: DeploymentExecutionMode;
  approval: DeploymentApproval | null;
  environmentVariables: Record<string, string>;
  customDomain: string | null;
  sslEnabled: boolean;
  vercelProjectId: string | null;
  vercelDeploymentId: string | null;
  vercelDeploymentUrl: string | null;
  previousDeploymentId: string | null;
  productionUrl: string | null;
  buildCommand: string;
  outputDirectory: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const deploymentApprovalSchema = z.object({
  approvalToken: z.string().min(1),
  approvedBy: z.string().min(1),
  approvedAt: isoTimestamp,
  approved: z.literal(true),
});

export const productionDeploymentRecordSchema = z.object({
  deploymentId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  projectName: z.string().min(1),
  sourcePath: z.string().min(1),
  hostingTarget: z.literal("VERCEL"),
  status: z.enum(PRODUCTION_DEPLOYMENT_STATUSES),
  executionMode: z.enum(DEPLOYMENT_EXECUTION_MODES),
  approval: deploymentApprovalSchema.nullable(),
  environmentVariables: z.record(z.string(), z.string()),
  customDomain: z.string().nullable(),
  sslEnabled: z.boolean(),
  vercelProjectId: z.string().nullable(),
  vercelDeploymentId: z.string().nullable(),
  vercelDeploymentUrl: z.string().nullable(),
  previousDeploymentId: z.string().nullable(),
  productionUrl: z.string().nullable(),
  buildCommand: z.string().min(1),
  outputDirectory: z.string().min(1),
  errorMessage: z.string().nullable(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

export function validateProductionDeploymentRecord(value: unknown): ProductionDeploymentRecord {
  return productionDeploymentRecordSchema.parse(value);
}

export function isDeploymentApproved(
  record: Pick<ProductionDeploymentRecord, "approval" | "status">,
): boolean {
  return record.approval?.approved === true && record.status === "APPROVED";
}
