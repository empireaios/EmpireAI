import { z } from "zod";

import { deploymentArtifactSchema, type DeploymentArtifact } from "./deployment-artifact.js";
import { deploymentMetadataSchema, type DeploymentMetadata } from "./deployment-metadata.js";
import { deploymentPackageSchema, type DeploymentPackage } from "./deployment-package.js";
import {
  deploymentPipelineSignalSchema,
  type DeploymentPipelineSignal,
} from "./deployment-pipeline-signal.js";
import { deploymentStatusSchema, type DeploymentStatus } from "./deployment-status.js";

export type StoreDeploymentRecordId = string;

/** Store deployment package connecting a deployment plan to a materialized storefront. */
export type StoreDeploymentRecord = {
  recordId: StoreDeploymentRecordId;
  workspaceId: string;
  deploymentPackage: DeploymentPackage;
  deploymentArtifacts: DeploymentArtifact[];
  deploymentStatus: DeploymentStatus;
  deploymentMetadata: DeploymentMetadata;
  confidence: number;
  signals: DeploymentPipelineSignal[];
  createdAt: string;
  updatedAt: string;
};

export type StoreDeploymentRecordCreateInput = Omit<
  StoreDeploymentRecord,
  "recordId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const storeDeploymentRecordSchema = z.object({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  deploymentPackage: deploymentPackageSchema,
  deploymentArtifacts: z.array(deploymentArtifactSchema).min(1),
  deploymentStatus: deploymentStatusSchema,
  deploymentMetadata: deploymentMetadataSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(deploymentPipelineSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a StoreDeploymentRecord record shape. */
export function validateStoreDeploymentRecord(value: unknown): StoreDeploymentRecord {
  return storeDeploymentRecordSchema.parse(value);
}
