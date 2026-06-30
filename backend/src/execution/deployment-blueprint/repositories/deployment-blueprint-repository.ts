import type { DeploymentPlan } from "../models/deployment-plan.js";
import type { HostingTarget } from "../models/hosting-target.js";

export type DeploymentBlueprintRepositoryQuery = {
  workspaceId: string;
  projectId?: string;
  storeId?: string;
  generatedStorefrontId?: string;
  hostingTarget?: HostingTarget;
  limit?: number;
  offset?: number;
};

/** Persistence contract for deployment plans. */
export type DeploymentBlueprintRepository = {
  save(
    workspaceId: string,
    input: import("../models/deployment-plan.js").DeploymentPlanCreateInput,
  ): Promise<DeploymentPlan>;
  getById(workspaceId: string, deploymentPlanId: string): Promise<DeploymentPlan | null>;
  getByProject(workspaceId: string, projectId: string): Promise<DeploymentPlan | null>;
  list(query: DeploymentBlueprintRepositoryQuery): Promise<DeploymentPlan[]>;
  delete(workspaceId: string, deploymentPlanId: string): Promise<boolean>;
};
