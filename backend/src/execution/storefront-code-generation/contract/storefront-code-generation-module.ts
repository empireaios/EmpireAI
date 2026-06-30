/**
 * Storefront Code Generation module — converts assembly outputs into deployable code.
 */

import {
  StorefrontCodeGenerationEngine,
  defaultStorefrontCodeGenerationEngine,
  type StorefrontCodeGenerationInput,
} from "../engines/storefront-code-generation-engine.js";
import type { GeneratedStorefront } from "../models/generated-storefront.js";
import {
  storefrontCodeGenerationScoring,
  scoreStorefrontCodeGeneration,
  type CodeBrandInput,
  type CodeStorefrontInput,
  type CodePageInput,
} from "../scoring/storefront-code-generation-scoring.js";
import type {
  CodeGenerationRepository,
  CodeGenerationRepositoryQuery,
} from "../repositories/code-generation-repository.js";
import { createInMemoryCodeGenerationRepository } from "../repositories/in-memory-code-generation-repository.js";

export const STOREFRONT_CODE_GENERATION_MODULE_ID = "storefront-code-generation" as const;
export type StorefrontCodeGenerationModuleId = typeof STOREFRONT_CODE_GENERATION_MODULE_ID;

export const STOREFRONT_CODE_GENERATION_MODULE_VERSION = "0.1.0" as const;

export type StorefrontCodeGenerationCapability =
  | "storefront-code-generation.generate"
  | "storefront-code-generation.score"
  | "storefront-code-generation.persist"
  | "storefront-code-generation.list";

export const STOREFRONT_CODE_GENERATION_CAPABILITIES: readonly StorefrontCodeGenerationCapability[] =
  [
    "storefront-code-generation.generate",
    "storefront-code-generation.score",
    "storefront-code-generation.persist",
    "storefront-code-generation.list",
  ] as const;

export type StorefrontCodeGenerationModuleContract = {
  moduleId: StorefrontCodeGenerationModuleId;
  version: string;
  capabilities: readonly StorefrontCodeGenerationCapability[];
};

export const STOREFRONT_CODE_GENERATION_MODULE_CONTRACT: StorefrontCodeGenerationModuleContract =
  {
    moduleId: STOREFRONT_CODE_GENERATION_MODULE_ID,
    version: STOREFRONT_CODE_GENERATION_MODULE_VERSION,
    capabilities: STOREFRONT_CODE_GENERATION_CAPABILITIES,
  };

/** Orchestrates storefront code generation and persistence. */
export class StorefrontCodeGenerationModule {
  readonly contract = STOREFRONT_CODE_GENERATION_MODULE_CONTRACT;
  private readonly engine: StorefrontCodeGenerationEngine;

  constructor(
    private readonly repository: CodeGenerationRepository,
    engine?: StorefrontCodeGenerationEngine,
  ) {
    this.engine = engine ?? new StorefrontCodeGenerationEngine(repository);
  }

  scoreStorefrontCodeGeneration = scoreStorefrontCodeGeneration;
  scoring = storefrontCodeGenerationScoring;

  generateStorefrontCode(input: StorefrontCodeGenerationInput) {
    return this.engine.generateCode(input);
  }

  async persistGeneratedStorefront(
    workspaceId: string,
    input: StorefrontCodeGenerationInput,
  ): Promise<GeneratedStorefront> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getGeneratedStorefront(
    workspaceId: string,
    generatedStorefrontId: string,
  ): Promise<GeneratedStorefront | null> {
    return this.repository.getById(workspaceId, generatedStorefrontId);
  }

  async getGeneratedStorefrontByAssembly(
    workspaceId: string,
    storefrontId: string,
  ): Promise<GeneratedStorefront | null> {
    return this.repository.getByStorefront(workspaceId, storefrontId);
  }

  async getGeneratedStorefrontByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<GeneratedStorefront | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listGeneratedStorefronts(
    workspaceId: string,
    filters: Omit<CodeGenerationRepositoryQuery, "workspaceId"> = {},
  ): Promise<GeneratedStorefront[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a storefront code generation module with optional custom dependencies. */
export function createStorefrontCodeGenerationModule(
  repository: CodeGenerationRepository = createInMemoryCodeGenerationRepository(),
  engine?: StorefrontCodeGenerationEngine,
): StorefrontCodeGenerationModule {
  return new StorefrontCodeGenerationModule(
    repository,
    engine ?? new StorefrontCodeGenerationEngine(repository),
  );
}

export const storefrontCodeGenerationModule = createStorefrontCodeGenerationModule();

export type {
  StorefrontCodeGenerationInput,
  CodeBrandInput,
  CodeStorefrontInput,
  CodePageInput,
};

export { defaultStorefrontCodeGenerationEngine };
