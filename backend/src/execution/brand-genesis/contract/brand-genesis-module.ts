/**
 * Brand Genesis module — generates businesses from revenue opportunities.
 */

import {
  BrandGenesisEngine,
  defaultBrandGenesisEngine,
  type BrandGenesisInput,
} from "../engines/brand-genesis-engine.js";
import type { BrandProfile } from "../models/brand-profile.js";
import {
  brandScoring,
  scoreBrandGenesis,
  type BrandGenesisCapitalAllocationInput,
  type BrandGenesisPortfolioEntryInput,
  type BrandGenesisRevenueOpportunityInput,
} from "../scoring/brand-scoring.js";
import type { BrandRepository, BrandRepositoryQuery } from "../repositories/brand-repository.js";
import { createInMemoryBrandRepository } from "../repositories/in-memory-brand-repository.js";

export const BRAND_GENESIS_MODULE_ID = "brand-genesis" as const;
export type BrandGenesisModuleId = typeof BRAND_GENESIS_MODULE_ID;

export const BRAND_GENESIS_MODULE_VERSION = "0.1.0" as const;

export type BrandGenesisCapability =
  | "brand-genesis.generate"
  | "brand-genesis.score"
  | "brand-genesis.persist"
  | "brand-genesis.list";

export const BRAND_GENESIS_CAPABILITIES: readonly BrandGenesisCapability[] = [
  "brand-genesis.generate",
  "brand-genesis.score",
  "brand-genesis.persist",
  "brand-genesis.list",
] as const;

export type BrandGenesisModuleContract = {
  moduleId: BrandGenesisModuleId;
  version: string;
  capabilities: readonly BrandGenesisCapability[];
};

export const BRAND_GENESIS_MODULE_CONTRACT: BrandGenesisModuleContract = {
  moduleId: BRAND_GENESIS_MODULE_ID,
  version: BRAND_GENESIS_MODULE_VERSION,
  capabilities: BRAND_GENESIS_CAPABILITIES,
};

/** Orchestrates brand generation and persistence. */
export class BrandGenesisModule {
  readonly contract = BRAND_GENESIS_MODULE_CONTRACT;
  private readonly engine: BrandGenesisEngine;

  constructor(
    private readonly repository: BrandRepository,
    engine?: BrandGenesisEngine,
  ) {
    this.engine = engine ?? new BrandGenesisEngine(repository);
  }

  scoreBrandGenesis = scoreBrandGenesis;
  scoring = brandScoring;

  generateBrandProfile(input: BrandGenesisInput) {
    return this.engine.generateBrand(input);
  }

  async persistBrandProfile(
    workspaceId: string,
    input: BrandGenesisInput,
  ): Promise<BrandProfile> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getBrandProfile(
    workspaceId: string,
    brandId: string,
  ): Promise<BrandProfile | null> {
    return this.repository.getById(workspaceId, brandId);
  }

  async getBrandByOpportunity(
    workspaceId: string,
    opportunityId: string,
  ): Promise<BrandProfile | null> {
    return this.repository.getByOpportunity(workspaceId, opportunityId);
  }

  async listBrandProfiles(
    workspaceId: string,
    filters: Omit<BrandRepositoryQuery, "workspaceId"> = {},
  ): Promise<BrandProfile[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a brand genesis module with optional custom dependencies. */
export function createBrandGenesisModule(
  repository: BrandRepository = createInMemoryBrandRepository(),
  engine?: BrandGenesisEngine,
): BrandGenesisModule {
  return new BrandGenesisModule(repository, engine ?? new BrandGenesisEngine(repository));
}

export const brandGenesisModule = createBrandGenesisModule();

export type {
  BrandGenesisInput,
  BrandGenesisRevenueOpportunityInput,
  BrandGenesisPortfolioEntryInput,
  BrandGenesisCapitalAllocationInput,
};

export { defaultBrandGenesisEngine };
