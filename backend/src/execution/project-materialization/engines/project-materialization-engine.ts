import type { MaterializedProject } from "../models/materialized-project.js";
import type { MaterializationRepository } from "../repositories/materialization-repository.js";
import {
  scoreProjectMaterialization,
  type ProjectMaterializationInput,
} from "../scoring/materialization-scoring.js";

/** Converts generated storefront artifacts into a materialized project structure. */
export class ProjectMaterializationEngine {
  constructor(private readonly repository: MaterializationRepository) {}

  materializeProject(input: ProjectMaterializationInput) {
    return scoreProjectMaterialization(input);
  }

  async materializeAndSave(
    workspaceId: string,
    input: ProjectMaterializationInput,
  ): Promise<MaterializedProject> {
    const breakdown = scoreProjectMaterialization(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultProjectMaterializationEngine = {
  materializeProject: scoreProjectMaterialization,
};

export type { ProjectMaterializationInput };
