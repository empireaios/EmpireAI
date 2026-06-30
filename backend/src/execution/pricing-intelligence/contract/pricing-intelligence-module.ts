/**
 * Pricing Intelligence module — optimal pricing blueprints without auto-apply.
 */

import {
  PricingIntelligenceEngine,
  defaultPricingIntelligenceEngine,
  type PricingIntelligenceInput,
} from "../engines/pricing-intelligence-engine.js";
import type { PricingIntelligenceRecord } from "../models/pricing-intelligence-record.js";
import {
  generatePricingBlueprint,
  pricingIntelligenceScoring,
  type PricingIntelligenceBrandInput,
  type PricingIntelligenceOfferInput,
} from "../scoring/pricing-intelligence-scoring.js";
import type {
  PricingIntelligenceRepository,
  PricingIntelligenceRepositoryQuery,
} from "../repositories/pricing-intelligence-repository.js";
import { createInMemoryPricingIntelligenceRepository } from "../repositories/in-memory-pricing-intelligence-repository.js";

export const PRICING_INTELLIGENCE_MODULE_ID = "pricing-intelligence" as const;
export type PricingIntelligenceModuleId = typeof PRICING_INTELLIGENCE_MODULE_ID;

export const PRICING_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type PricingIntelligenceCapability =
  | "pricing-intelligence.generate"
  | "pricing-intelligence.score"
  | "pricing-intelligence.persist"
  | "pricing-intelligence.list";

export const PRICING_INTELLIGENCE_CAPABILITIES: readonly PricingIntelligenceCapability[] = [
  "pricing-intelligence.generate",
  "pricing-intelligence.score",
  "pricing-intelligence.persist",
  "pricing-intelligence.list",
] as const;

export type PricingIntelligenceModuleContract = {
  moduleId: PricingIntelligenceModuleId;
  version: string;
  capabilities: readonly PricingIntelligenceCapability[];
};

export const PRICING_INTELLIGENCE_MODULE_CONTRACT: PricingIntelligenceModuleContract = {
  moduleId: PRICING_INTELLIGENCE_MODULE_ID,
  version: PRICING_INTELLIGENCE_MODULE_VERSION,
  capabilities: PRICING_INTELLIGENCE_CAPABILITIES,
};

/** Orchestrates pricing blueprint generation and persistence. */
export class PricingIntelligenceModule {
  readonly contract = PRICING_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: PricingIntelligenceEngine;

  constructor(
    private readonly repository: PricingIntelligenceRepository,
    engine?: PricingIntelligenceEngine,
  ) {
    this.engine = engine ?? new PricingIntelligenceEngine(repository);
  }

  generatePricingBlueprint = generatePricingBlueprint;
  scoring = pricingIntelligenceScoring;

  generateBlueprint(input: PricingIntelligenceInput) {
    return this.engine.generateBlueprint(input);
  }

  async persistBlueprint(
    workspaceId: string,
    input: PricingIntelligenceInput,
  ): Promise<PricingIntelligenceRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getBlueprintRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<PricingIntelligenceRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getBlueprintByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<PricingIntelligenceRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listBlueprintRecords(
    workspaceId: string,
    filters: Omit<PricingIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<PricingIntelligenceRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a pricing intelligence module. */
export function createPricingIntelligenceModule(
  repository: PricingIntelligenceRepository = createInMemoryPricingIntelligenceRepository(),
  engine?: PricingIntelligenceEngine,
): PricingIntelligenceModule {
  return new PricingIntelligenceModule(
    repository,
    engine ?? new PricingIntelligenceEngine(repository),
  );
}

export const pricingIntelligenceModule = createPricingIntelligenceModule();

export type {
  PricingIntelligenceInput,
  PricingIntelligenceBrandInput,
  PricingIntelligenceOfferInput,
};

export { defaultPricingIntelligenceEngine };
