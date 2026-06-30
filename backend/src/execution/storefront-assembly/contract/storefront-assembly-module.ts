/**
 * Storefront Assembly module — converts renderable pages into a deployable storefront.
 */

import {
  StorefrontAssemblyEngine,
  defaultStorefrontAssemblyEngine,
  type StorefrontAssemblyInput,
} from "../engines/storefront-assembly-engine.js";
import type { Storefront } from "../models/storefront.js";
import {
  storefrontAssemblyScoring,
  scoreStorefrontAssembly,
  type AssemblyBrandInput,
  type AssemblyBlueprintInput,
  type AssemblyPageInput,
} from "../scoring/storefront-assembly-scoring.js";
import type {
  StorefrontRepository,
  StorefrontRepositoryQuery,
} from "../repositories/storefront-repository.js";
import { createInMemoryStorefrontRepository } from "../repositories/in-memory-storefront-repository.js";

export const STOREFRONT_ASSEMBLY_MODULE_ID = "storefront-assembly" as const;
export type StorefrontAssemblyModuleId = typeof STOREFRONT_ASSEMBLY_MODULE_ID;

export const STOREFRONT_ASSEMBLY_MODULE_VERSION = "0.1.0" as const;

export type StorefrontAssemblyCapability =
  | "storefront-assembly.assemble"
  | "storefront-assembly.score"
  | "storefront-assembly.persist"
  | "storefront-assembly.list";

export const STOREFRONT_ASSEMBLY_CAPABILITIES: readonly StorefrontAssemblyCapability[] = [
  "storefront-assembly.assemble",
  "storefront-assembly.score",
  "storefront-assembly.persist",
  "storefront-assembly.list",
] as const;

export type StorefrontAssemblyModuleContract = {
  moduleId: StorefrontAssemblyModuleId;
  version: string;
  capabilities: readonly StorefrontAssemblyCapability[];
};

export const STOREFRONT_ASSEMBLY_MODULE_CONTRACT: StorefrontAssemblyModuleContract = {
  moduleId: STOREFRONT_ASSEMBLY_MODULE_ID,
  version: STOREFRONT_ASSEMBLY_MODULE_VERSION,
  capabilities: STOREFRONT_ASSEMBLY_CAPABILITIES,
};

/** Orchestrates storefront assembly and persistence. */
export class StorefrontAssemblyModule {
  readonly contract = STOREFRONT_ASSEMBLY_MODULE_CONTRACT;
  private readonly engine: StorefrontAssemblyEngine;

  constructor(
    private readonly repository: StorefrontRepository,
    engine?: StorefrontAssemblyEngine,
  ) {
    this.engine = engine ?? new StorefrontAssemblyEngine(repository);
  }

  scoreStorefrontAssembly = scoreStorefrontAssembly;
  scoring = storefrontAssemblyScoring;

  assembleStorefront(input: StorefrontAssemblyInput) {
    return this.engine.assembleStorefront(input);
  }

  async persistStorefront(
    workspaceId: string,
    input: StorefrontAssemblyInput,
  ): Promise<Storefront> {
    return this.engine.assembleAndSave(workspaceId, input);
  }

  async getStorefront(
    workspaceId: string,
    storefrontId: string,
  ): Promise<Storefront | null> {
    return this.repository.getById(workspaceId, storefrontId);
  }

  async getStorefrontByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<Storefront | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async getStorefrontByBrand(
    workspaceId: string,
    brandId: string,
  ): Promise<Storefront | null> {
    return this.repository.getByBrand(workspaceId, brandId);
  }

  async listStorefronts(
    workspaceId: string,
    filters: Omit<StorefrontRepositoryQuery, "workspaceId"> = {},
  ): Promise<Storefront[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a storefront assembly module with optional custom dependencies. */
export function createStorefrontAssemblyModule(
  repository: StorefrontRepository = createInMemoryStorefrontRepository(),
  engine?: StorefrontAssemblyEngine,
): StorefrontAssemblyModule {
  return new StorefrontAssemblyModule(
    repository,
    engine ?? new StorefrontAssemblyEngine(repository),
  );
}

export const storefrontAssemblyModule = createStorefrontAssemblyModule();

export type {
  StorefrontAssemblyInput,
  AssemblyBrandInput,
  AssemblyBlueprintInput,
  AssemblyPageInput,
};

export { defaultStorefrontAssemblyEngine };
