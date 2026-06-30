/**
 * Project Materialization module — converts artifacts into materialized projects.
 */

import {
  ProjectMaterializationEngine,
  defaultProjectMaterializationEngine,
  type ProjectMaterializationInput,
} from "../engines/project-materialization-engine.js";
import type { MaterializedProject } from "../models/materialized-project.js";
import {
  materializationScoring,
  scoreProjectMaterialization,
  type MaterializationArtifactInput,
} from "../scoring/materialization-scoring.js";
import type {
  MaterializationRepository,
  MaterializationRepositoryQuery,
} from "../repositories/materialization-repository.js";
import { createInMemoryMaterializationRepository } from "../repositories/in-memory-materialization-repository.js";

export const PROJECT_MATERIALIZATION_MODULE_ID = "project-materialization" as const;
export type ProjectMaterializationModuleId = typeof PROJECT_MATERIALIZATION_MODULE_ID;

export const PROJECT_MATERIALIZATION_MODULE_VERSION = "0.1.0" as const;

export type ProjectMaterializationCapability =
  | "project-materialization.materialize"
  | "project-materialization.score"
  | "project-materialization.persist"
  | "project-materialization.list";

export const PROJECT_MATERIALIZATION_CAPABILITIES: readonly ProjectMaterializationCapability[] = [
  "project-materialization.materialize",
  "project-materialization.score",
  "project-materialization.persist",
  "project-materialization.list",
] as const;

export type ProjectMaterializationModuleContract = {
  moduleId: ProjectMaterializationModuleId;
  version: string;
  capabilities: readonly ProjectMaterializationCapability[];
};

export const PROJECT_MATERIALIZATION_MODULE_CONTRACT: ProjectMaterializationModuleContract = {
  moduleId: PROJECT_MATERIALIZATION_MODULE_ID,
  version: PROJECT_MATERIALIZATION_MODULE_VERSION,
  capabilities: PROJECT_MATERIALIZATION_CAPABILITIES,
};

/** Orchestrates project materialization and persistence. */
export class ProjectMaterializationModule {
  readonly contract = PROJECT_MATERIALIZATION_MODULE_CONTRACT;
  private readonly engine: ProjectMaterializationEngine;

  constructor(
    private readonly repository: MaterializationRepository,
    engine?: ProjectMaterializationEngine,
  ) {
    this.engine = engine ?? new ProjectMaterializationEngine(repository);
  }

  scoreProjectMaterialization = scoreProjectMaterialization;
  scoring = materializationScoring;

  materializeProject(input: ProjectMaterializationInput) {
    return this.engine.materializeProject(input);
  }

  async persistMaterializedProject(
    workspaceId: string,
    input: ProjectMaterializationInput,
  ): Promise<MaterializedProject> {
    return this.engine.materializeAndSave(workspaceId, input);
  }

  async getMaterializedProject(
    workspaceId: string,
    projectId: string,
  ): Promise<MaterializedProject | null> {
    return this.repository.getById(workspaceId, projectId);
  }

  async getMaterializedProjectByStorefront(
    workspaceId: string,
    generatedStorefrontId: string,
  ): Promise<MaterializedProject | null> {
    return this.repository.getByStorefront(workspaceId, generatedStorefrontId);
  }

  async getMaterializedProjectByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<MaterializedProject | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listMaterializedProjects(
    workspaceId: string,
    filters: Omit<MaterializationRepositoryQuery, "workspaceId"> = {},
  ): Promise<MaterializedProject[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a project materialization module with optional custom dependencies. */
export function createProjectMaterializationModule(
  repository: MaterializationRepository = createInMemoryMaterializationRepository(),
  engine?: ProjectMaterializationEngine,
): ProjectMaterializationModule {
  return new ProjectMaterializationModule(
    repository,
    engine ?? new ProjectMaterializationEngine(repository),
  );
}

export const projectMaterializationModule = createProjectMaterializationModule();

export type { ProjectMaterializationInput, MaterializationArtifactInput };

export { defaultProjectMaterializationEngine };
