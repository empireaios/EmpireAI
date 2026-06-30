/**
 * Store Blueprint module — converts brand, portfolio, offer, and content into a store blueprint.
 */

import {
  StoreBlueprintEngine,
  defaultStoreBlueprintEngine,
  type StoreBlueprintInput,
} from "../engines/store-blueprint-engine.js";
import type { StoreBlueprint } from "../models/store-blueprint.js";
import {
  storeBlueprintScoring,
  scoreStoreBlueprint,
  type StoreBrandInput,
  type StorePortfolioInput,
  type StoreOfferInput,
  type StoreContentInput,
} from "../scoring/store-blueprint-scoring.js";
import type {
  StoreBlueprintRepository,
  StoreBlueprintRepositoryQuery,
} from "../repositories/store-blueprint-repository.js";
import { createInMemoryStoreBlueprintRepository } from "../repositories/in-memory-store-blueprint-repository.js";

export const STORE_BLUEPRINT_MODULE_ID = "store-blueprint" as const;
export type StoreBlueprintModuleId = typeof STORE_BLUEPRINT_MODULE_ID;

export const STORE_BLUEPRINT_MODULE_VERSION = "0.1.0" as const;

export type StoreBlueprintCapability =
  | "store-blueprint.generate"
  | "store-blueprint.score"
  | "store-blueprint.persist"
  | "store-blueprint.list";

export const STORE_BLUEPRINT_CAPABILITIES: readonly StoreBlueprintCapability[] = [
  "store-blueprint.generate",
  "store-blueprint.score",
  "store-blueprint.persist",
  "store-blueprint.list",
] as const;

export type StoreBlueprintModuleContract = {
  moduleId: StoreBlueprintModuleId;
  version: string;
  capabilities: readonly StoreBlueprintCapability[];
};

export const STORE_BLUEPRINT_MODULE_CONTRACT: StoreBlueprintModuleContract = {
  moduleId: STORE_BLUEPRINT_MODULE_ID,
  version: STORE_BLUEPRINT_MODULE_VERSION,
  capabilities: STORE_BLUEPRINT_CAPABILITIES,
};

/** Orchestrates store blueprint generation and persistence. */
export class StoreBlueprintModule {
  readonly contract = STORE_BLUEPRINT_MODULE_CONTRACT;
  private readonly engine: StoreBlueprintEngine;

  constructor(
    private readonly repository: StoreBlueprintRepository,
    engine?: StoreBlueprintEngine,
  ) {
    this.engine = engine ?? new StoreBlueprintEngine(repository);
  }

  scoreStoreBlueprint = scoreStoreBlueprint;
  scoring = storeBlueprintScoring;

  generateStoreBlueprint(input: StoreBlueprintInput) {
    return this.engine.generateBlueprint(input);
  }

  async persistStoreBlueprint(
    workspaceId: string,
    input: StoreBlueprintInput,
  ): Promise<StoreBlueprint> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getStoreBlueprint(
    workspaceId: string,
    storeId: string,
  ): Promise<StoreBlueprint | null> {
    return this.repository.getById(workspaceId, storeId);
  }

  async getStoreBlueprintByBrand(
    workspaceId: string,
    brandId: string,
  ): Promise<StoreBlueprint | null> {
    return this.repository.getByBrand(workspaceId, brandId);
  }

  async listStoreBlueprints(
    workspaceId: string,
    filters: Omit<StoreBlueprintRepositoryQuery, "workspaceId"> = {},
  ): Promise<StoreBlueprint[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a store blueprint module with optional custom dependencies. */
export function createStoreBlueprintModule(
  repository: StoreBlueprintRepository = createInMemoryStoreBlueprintRepository(),
  engine?: StoreBlueprintEngine,
): StoreBlueprintModule {
  return new StoreBlueprintModule(
    repository,
    engine ?? new StoreBlueprintEngine(repository),
  );
}

export const storeBlueprintModule = createStoreBlueprintModule();

export type {
  StoreBlueprintInput,
  StoreBrandInput,
  StorePortfolioInput,
  StoreOfferInput,
  StoreContentInput,
};

export { defaultStoreBlueprintEngine };
