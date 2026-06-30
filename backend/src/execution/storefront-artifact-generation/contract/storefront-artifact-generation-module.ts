/**
 * Storefront Artifact Generation module — converts code outputs into file artifacts.
 */

import {
  StorefrontArtifactGenerationEngine,
  defaultStorefrontArtifactGenerationEngine,
  type StorefrontArtifactGenerationInput,
} from "../engines/storefront-artifact-generation-engine.js";
import type { GeneratedArtifact } from "../models/generated-artifact.js";
import {
  artifactGenerationScoring,
  scoreStorefrontArtifactGeneration,
  type ArtifactCodeGenerationInput,
} from "../scoring/artifact-generation-scoring.js";
import type {
  ArtifactRepository,
  ArtifactRepositoryQuery,
} from "../repositories/artifact-repository.js";
import { createInMemoryArtifactRepository } from "../repositories/in-memory-artifact-repository.js";

export const STOREFRONT_ARTIFACT_GENERATION_MODULE_ID = "storefront-artifact-generation" as const;
export type StorefrontArtifactGenerationModuleId =
  typeof STOREFRONT_ARTIFACT_GENERATION_MODULE_ID;

export const STOREFRONT_ARTIFACT_GENERATION_MODULE_VERSION = "0.1.0" as const;

export type StorefrontArtifactGenerationCapability =
  | "storefront-artifact-generation.generate"
  | "storefront-artifact-generation.score"
  | "storefront-artifact-generation.persist"
  | "storefront-artifact-generation.list";

export const STOREFRONT_ARTIFACT_GENERATION_CAPABILITIES: readonly StorefrontArtifactGenerationCapability[] =
  [
    "storefront-artifact-generation.generate",
    "storefront-artifact-generation.score",
    "storefront-artifact-generation.persist",
    "storefront-artifact-generation.list",
  ] as const;

export type StorefrontArtifactGenerationModuleContract = {
  moduleId: StorefrontArtifactGenerationModuleId;
  version: string;
  capabilities: readonly StorefrontArtifactGenerationCapability[];
};

export const STOREFRONT_ARTIFACT_GENERATION_MODULE_CONTRACT: StorefrontArtifactGenerationModuleContract =
  {
    moduleId: STOREFRONT_ARTIFACT_GENERATION_MODULE_ID,
    version: STOREFRONT_ARTIFACT_GENERATION_MODULE_VERSION,
    capabilities: STOREFRONT_ARTIFACT_GENERATION_CAPABILITIES,
  };

/** Orchestrates storefront artifact generation and persistence. */
export class StorefrontArtifactGenerationModule {
  readonly contract = STOREFRONT_ARTIFACT_GENERATION_MODULE_CONTRACT;
  private readonly engine: StorefrontArtifactGenerationEngine;

  constructor(
    private readonly repository: ArtifactRepository,
    engine?: StorefrontArtifactGenerationEngine,
  ) {
    this.engine = engine ?? new StorefrontArtifactGenerationEngine(repository);
  }

  scoreStorefrontArtifactGeneration = scoreStorefrontArtifactGeneration;
  scoring = artifactGenerationScoring;

  generateArtifacts(input: StorefrontArtifactGenerationInput) {
    return this.engine.generateArtifacts(input);
  }

  async persistArtifacts(
    workspaceId: string,
    input: StorefrontArtifactGenerationInput,
  ): Promise<GeneratedArtifact[]> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getArtifact(
    workspaceId: string,
    artifactId: string,
  ): Promise<GeneratedArtifact | null> {
    return this.repository.getById(workspaceId, artifactId);
  }

  async getArtifactByFilePath(
    workspaceId: string,
    generatedStorefrontId: string,
    filePath: string,
  ): Promise<GeneratedArtifact | null> {
    return this.repository.getByFilePath(workspaceId, generatedStorefrontId, filePath);
  }

  async listArtifacts(
    workspaceId: string,
    filters: Omit<ArtifactRepositoryQuery, "workspaceId"> = {},
  ): Promise<GeneratedArtifact[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a storefront artifact generation module with optional custom dependencies. */
export function createStorefrontArtifactGenerationModule(
  repository: ArtifactRepository = createInMemoryArtifactRepository(),
  engine?: StorefrontArtifactGenerationEngine,
): StorefrontArtifactGenerationModule {
  return new StorefrontArtifactGenerationModule(
    repository,
    engine ?? new StorefrontArtifactGenerationEngine(repository),
  );
}

export const storefrontArtifactGenerationModule = createStorefrontArtifactGenerationModule();

export type { StorefrontArtifactGenerationInput, ArtifactCodeGenerationInput };

export { defaultStorefrontArtifactGenerationEngine };
