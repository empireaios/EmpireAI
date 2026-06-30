import type { StoreDeploymentRecord } from "../models/store-deployment-record.js";
import type { DeploymentStatus } from "../models/deployment-status.js";
import type { HostingTarget } from "../../deployment-blueprint/models/hosting-target.js";

export type StoreDeploymentPipelineRepositoryQuery = {
  workspaceId: string;
  projectId?: string;
  storeId?: string;
  generatedStorefrontId?: string;
  deploymentStatus?: DeploymentStatus;
  hostingTarget?: HostingTarget;
  limit?: number;
  offset?: number;
};

/** Persistence contract for store deployment packages. */
export type StoreDeploymentPipelineRepository = {
  save(
    workspaceId: string,
    input: import("../models/store-deployment-record.js").StoreDeploymentRecordCreateInput,
  ): Promise<StoreDeploymentRecord>;
  getById(workspaceId: string, recordId: string): Promise<StoreDeploymentRecord | null>;
  getByProject(workspaceId: string, projectId: string): Promise<StoreDeploymentRecord | null>;
  list(query: StoreDeploymentPipelineRepositoryQuery): Promise<StoreDeploymentRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
