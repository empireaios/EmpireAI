/**
 * Store Deployment Pipeline module — connects deployment plans to generated storefronts.
 */

import {
  StoreDeploymentPipelineEngine,
  defaultStoreDeploymentPipelineEngine,
  type StoreDeploymentPipelineInput,
} from "../engines/store-deployment-pipeline-engine.js";
import type { StoreDeploymentRecord } from "../models/store-deployment-record.js";
import {
  storeDeploymentPipelineScoring,
  scoreStoreDeploymentPipeline,
  type StoreDeploymentPlanInput,
  type StoreDeploymentProjectInput,
} from "../scoring/store-deployment-pipeline-scoring.js";
import type {
  StoreDeploymentPipelineRepository,
  StoreDeploymentPipelineRepositoryQuery,
} from "../repositories/store-deployment-pipeline-repository.js";
import { createInMemoryStoreDeploymentPipelineRepository } from "../repositories/in-memory-store-deployment-pipeline-repository.js";

export const STORE_DEPLOYMENT_PIPELINE_MODULE_ID = "store-deployment-pipeline" as const;
export type StoreDeploymentPipelineModuleId = typeof STORE_DEPLOYMENT_PIPELINE_MODULE_ID;

export const STORE_DEPLOYMENT_PIPELINE_MODULE_VERSION = "0.1.0" as const;

export type StoreDeploymentPipelineCapability =
  | "store-deployment-pipeline.create"
  | "store-deployment-pipeline.score"
  | "store-deployment-pipeline.persist"
  | "store-deployment-pipeline.list";

export const STORE_DEPLOYMENT_PIPELINE_CAPABILITIES: readonly StoreDeploymentPipelineCapability[] = [
  "store-deployment-pipeline.create",
  "store-deployment-pipeline.score",
  "store-deployment-pipeline.persist",
  "store-deployment-pipeline.list",
] as const;

export type StoreDeploymentPipelineModuleContract = {
  moduleId: StoreDeploymentPipelineModuleId;
  version: string;
  capabilities: readonly StoreDeploymentPipelineCapability[];
};

export const STORE_DEPLOYMENT_PIPELINE_MODULE_CONTRACT: StoreDeploymentPipelineModuleContract = {
  moduleId: STORE_DEPLOYMENT_PIPELINE_MODULE_ID,
  version: STORE_DEPLOYMENT_PIPELINE_MODULE_VERSION,
  capabilities: STORE_DEPLOYMENT_PIPELINE_CAPABILITIES,
};

/** Orchestrates store deployment package creation and persistence. */
export class StoreDeploymentPipelineModule {
  readonly contract = STORE_DEPLOYMENT_PIPELINE_MODULE_CONTRACT;
  private readonly engine: StoreDeploymentPipelineEngine;

  constructor(
    private readonly repository: StoreDeploymentPipelineRepository,
    engine?: StoreDeploymentPipelineEngine,
  ) {
    this.engine = engine ?? new StoreDeploymentPipelineEngine(repository);
  }

  scoreStoreDeploymentPipeline = scoreStoreDeploymentPipeline;
  scoring = storeDeploymentPipelineScoring;

  createDeploymentPackage(input: StoreDeploymentPipelineInput) {
    return this.engine.createDeploymentPackage(input);
  }

  async persistDeploymentPackage(
    workspaceId: string,
    input: StoreDeploymentPipelineInput,
  ): Promise<StoreDeploymentRecord> {
    return this.engine.createAndSave(workspaceId, input);
  }

  async getDeploymentPackage(
    workspaceId: string,
    recordId: string,
  ): Promise<StoreDeploymentRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getDeploymentPackageByProject(
    workspaceId: string,
    projectId: string,
  ): Promise<StoreDeploymentRecord | null> {
    return this.repository.getByProject(workspaceId, projectId);
  }

  async listDeploymentPackages(
    workspaceId: string,
    filters: Omit<StoreDeploymentPipelineRepositoryQuery, "workspaceId"> = {},
  ): Promise<StoreDeploymentRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a store deployment pipeline module with optional custom dependencies. */
export function createStoreDeploymentPipelineModule(
  repository: StoreDeploymentPipelineRepository = createInMemoryStoreDeploymentPipelineRepository(),
  engine?: StoreDeploymentPipelineEngine,
): StoreDeploymentPipelineModule {
  return new StoreDeploymentPipelineModule(
    repository,
    engine ?? new StoreDeploymentPipelineEngine(repository),
  );
}

export const storeDeploymentPipelineModule = createStoreDeploymentPipelineModule();

export type {
  StoreDeploymentPipelineInput,
  StoreDeploymentPlanInput,
  StoreDeploymentProjectInput,
};

export { defaultStoreDeploymentPipelineEngine };
