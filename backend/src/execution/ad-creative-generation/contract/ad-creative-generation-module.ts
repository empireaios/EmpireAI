/**
 * Ad Creative Generation module — production-ready ad blueprints without live submission.
 */

import {
  AdCreativeGenerationEngine,
  defaultAdCreativeGenerationEngine,
  type AdCreativeGenerationInput,
} from "../engines/ad-creative-generation-engine.js";
import type { AdCreativeRecord } from "../models/ad-creative-record.js";
import {
  generateAdCreativePackage,
  adCreativeGenerationScoring,
  type AdCreativeBrandInput,
  type AdCreativeOfferInput,
} from "../scoring/ad-creative-generation-scoring.js";
import type {
  AdCreativeRepository,
  AdCreativeRepositoryQuery,
} from "../repositories/ad-creative-repository.js";
import { createInMemoryAdCreativeRepository } from "../repositories/in-memory-ad-creative-repository.js";

export const AD_CREATIVE_GENERATION_MODULE_ID = "ad-creative-generation" as const;
export type AdCreativeGenerationModuleId = typeof AD_CREATIVE_GENERATION_MODULE_ID;

export const AD_CREATIVE_GENERATION_MODULE_VERSION = "0.1.0" as const;

export type AdCreativeGenerationCapability =
  | "ad-creative-generation.generate"
  | "ad-creative-generation.score"
  | "ad-creative-generation.persist"
  | "ad-creative-generation.list";

export const AD_CREATIVE_GENERATION_CAPABILITIES: readonly AdCreativeGenerationCapability[] = [
  "ad-creative-generation.generate",
  "ad-creative-generation.score",
  "ad-creative-generation.persist",
  "ad-creative-generation.list",
] as const;

export type AdCreativeGenerationModuleContract = {
  moduleId: AdCreativeGenerationModuleId;
  version: string;
  capabilities: readonly AdCreativeGenerationCapability[];
};

export const AD_CREATIVE_GENERATION_MODULE_CONTRACT: AdCreativeGenerationModuleContract = {
  moduleId: AD_CREATIVE_GENERATION_MODULE_ID,
  version: AD_CREATIVE_GENERATION_MODULE_VERSION,
  capabilities: AD_CREATIVE_GENERATION_CAPABILITIES,
};

/** Orchestrates ad creative package generation and persistence. */
export class AdCreativeGenerationModule {
  readonly contract = AD_CREATIVE_GENERATION_MODULE_CONTRACT;
  private readonly engine: AdCreativeGenerationEngine;

  constructor(
    private readonly repository: AdCreativeRepository,
    engine?: AdCreativeGenerationEngine,
  ) {
    this.engine = engine ?? new AdCreativeGenerationEngine(repository);
  }

  generateAdCreativePackage = generateAdCreativePackage;
  scoring = adCreativeGenerationScoring;

  generatePackage(input: AdCreativeGenerationInput) {
    return this.engine.generatePackage(input);
  }

  async persistPackage(
    workspaceId: string,
    input: AdCreativeGenerationInput,
  ): Promise<AdCreativeRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getPackageRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<AdCreativeRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getPackageByBrand(
    workspaceId: string,
    brandId: string,
  ): Promise<AdCreativeRecord | null> {
    return this.repository.getByBrand(workspaceId, brandId);
  }

  async listPackageRecords(
    workspaceId: string,
    filters: Omit<AdCreativeRepositoryQuery, "workspaceId"> = {},
  ): Promise<AdCreativeRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for an ad creative generation module with optional custom dependencies. */
export function createAdCreativeGenerationModule(
  repository: AdCreativeRepository = createInMemoryAdCreativeRepository(),
  engine?: AdCreativeGenerationEngine,
): AdCreativeGenerationModule {
  return new AdCreativeGenerationModule(
    repository,
    engine ?? new AdCreativeGenerationEngine(repository),
  );
}

export const adCreativeGenerationModule = createAdCreativeGenerationModule();

export type { AdCreativeGenerationInput, AdCreativeBrandInput, AdCreativeOfferInput };

export { defaultAdCreativeGenerationEngine };
