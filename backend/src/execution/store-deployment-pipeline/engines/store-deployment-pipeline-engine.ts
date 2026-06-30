import type { StoreDeploymentRecord } from "../models/store-deployment-record.js";
import type { StoreDeploymentPipelineRepository } from "../repositories/store-deployment-pipeline-repository.js";
import {
  scoreStoreDeploymentPipeline,
  type StoreDeploymentPipelineInput,
} from "../scoring/store-deployment-pipeline-scoring.js";

/** Assembles store deployment packages from deployment plans and materialized projects. */
export class StoreDeploymentPipelineEngine {
  constructor(private readonly repository: StoreDeploymentPipelineRepository) {}

  createDeploymentPackage(input: StoreDeploymentPipelineInput) {
    return scoreStoreDeploymentPipeline(input);
  }

  async createAndSave(
    workspaceId: string,
    input: StoreDeploymentPipelineInput,
  ): Promise<StoreDeploymentRecord> {
    const breakdown = scoreStoreDeploymentPipeline(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultStoreDeploymentPipelineEngine = {
  createDeploymentPackage: scoreStoreDeploymentPipeline,
};

export type { StoreDeploymentPipelineInput };
