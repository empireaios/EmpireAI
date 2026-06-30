/**
 * Store Page Generation module — converts store blueprints into renderable storefront pages.
 */

import {
  StorePageGenerationEngine,
  defaultStorePageGenerationEngine,
  type StorePageGenerationInput,
} from "../engines/store-page-generation-engine.js";
import type { RenderableStorePage } from "../models/renderable-store-page.js";
import {
  storePageGenerationScoring,
  scoreStorePageGeneration,
  type StoreBlueprintInput,
  type StoreLandingContentInput,
} from "../scoring/store-page-generation-scoring.js";
import type {
  StorePageRepository,
  StorePageRepositoryQuery,
} from "../repositories/store-page-repository.js";
import { createInMemoryStorePageRepository } from "../repositories/in-memory-store-page-repository.js";

export const STORE_PAGE_GENERATION_MODULE_ID = "store-page-generation" as const;
export type StorePageGenerationModuleId = typeof STORE_PAGE_GENERATION_MODULE_ID;

export const STORE_PAGE_GENERATION_MODULE_VERSION = "0.1.0" as const;

export type StorePageGenerationCapability =
  | "store-page-generation.generate"
  | "store-page-generation.score"
  | "store-page-generation.persist"
  | "store-page-generation.list";

export const STORE_PAGE_GENERATION_CAPABILITIES: readonly StorePageGenerationCapability[] = [
  "store-page-generation.generate",
  "store-page-generation.score",
  "store-page-generation.persist",
  "store-page-generation.list",
] as const;

export type StorePageGenerationModuleContract = {
  moduleId: StorePageGenerationModuleId;
  version: string;
  capabilities: readonly StorePageGenerationCapability[];
};

export const STORE_PAGE_GENERATION_MODULE_CONTRACT: StorePageGenerationModuleContract = {
  moduleId: STORE_PAGE_GENERATION_MODULE_ID,
  version: STORE_PAGE_GENERATION_MODULE_VERSION,
  capabilities: STORE_PAGE_GENERATION_CAPABILITIES,
};

/** Orchestrates renderable store page generation and persistence. */
export class StorePageGenerationModule {
  readonly contract = STORE_PAGE_GENERATION_MODULE_CONTRACT;
  private readonly engine: StorePageGenerationEngine;

  constructor(
    private readonly repository: StorePageRepository,
    engine?: StorePageGenerationEngine,
  ) {
    this.engine = engine ?? new StorePageGenerationEngine(repository);
  }

  scoreStorePageGeneration = scoreStorePageGeneration;
  scoring = storePageGenerationScoring;

  generateStorePages(input: StorePageGenerationInput) {
    return this.engine.generatePages(input);
  }

  async persistStorePages(
    workspaceId: string,
    input: StorePageGenerationInput,
  ): Promise<RenderableStorePage[]> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getRenderablePage(
    workspaceId: string,
    renderablePageId: string,
  ): Promise<RenderableStorePage | null> {
    return this.repository.getById(workspaceId, renderablePageId);
  }

  async getPageByBlueprintPage(
    workspaceId: string,
    pageId: string,
  ): Promise<RenderableStorePage | null> {
    return this.repository.getByPage(workspaceId, pageId);
  }

  async getPageByRoute(
    workspaceId: string,
    route: string,
  ): Promise<RenderableStorePage | null> {
    return this.repository.getByRoute(workspaceId, route);
  }

  async listRenderablePages(
    workspaceId: string,
    filters: Omit<StorePageRepositoryQuery, "workspaceId"> = {},
  ): Promise<RenderableStorePage[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a store page generation module with optional custom dependencies. */
export function createStorePageGenerationModule(
  repository: StorePageRepository = createInMemoryStorePageRepository(),
  engine?: StorePageGenerationEngine,
): StorePageGenerationModule {
  return new StorePageGenerationModule(
    repository,
    engine ?? new StorePageGenerationEngine(repository),
  );
}

export const storePageGenerationModule = createStorePageGenerationModule();

export type {
  StorePageGenerationInput,
  StoreBlueprintInput,
  StoreLandingContentInput,
};

export { defaultStorePageGenerationEngine };
