import type { DeploymentPlan } from "../models/deployment-plan.js";
import type { DeploymentBlueprintRepository } from "../repositories/deployment-blueprint-repository.js";
import {
  scoreDeploymentBlueprint,
  type DeploymentBlueprintInput,
} from "../scoring/deployment-blueprint-scoring.js";

/** Generates deployment plans from materialized projects. */
export class DeploymentBlueprintEngine {
  constructor(private readonly repository: DeploymentBlueprintRepository) {}

  generateDeploymentPlan(input: DeploymentBlueprintInput) {
    return scoreDeploymentBlueprint(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: DeploymentBlueprintInput,
  ): Promise<DeploymentPlan> {
    const breakdown = scoreDeploymentBlueprint(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultDeploymentBlueprintEngine = {
  generateDeploymentPlan: scoreDeploymentBlueprint,
};

export type { DeploymentBlueprintInput };
