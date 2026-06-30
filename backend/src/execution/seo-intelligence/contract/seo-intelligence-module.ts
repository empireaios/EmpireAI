/**
 * SEO Intelligence module — complete SEO strategy for manufactured stores.
 */

import {
  SeoIntelligenceEngine,
  defaultSeoIntelligenceEngine,
  type SeoIntelligenceInput,
} from "../engines/seo-intelligence-engine.js";
import type { SeoIntelligenceRecord } from "../models/seo-intelligence-record.js";
import {
  generateSeoIntelligence,
  seoIntelligenceScoring,
  type SeoIntelligenceBrandInput,
  type SeoIntelligenceOfferInput,
} from "../scoring/seo-intelligence-scoring.js";
import type {
  SeoIntelligenceRepository,
  SeoIntelligenceRepositoryQuery,
} from "../repositories/seo-intelligence-repository.js";
import { createInMemorySeoIntelligenceRepository } from "../repositories/in-memory-seo-intelligence-repository.js";

export const SEO_INTELLIGENCE_MODULE_ID = "seo-intelligence" as const;
export type SeoIntelligenceModuleId = typeof SEO_INTELLIGENCE_MODULE_ID;

export const SEO_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type SeoIntelligenceCapability =
  | "seo-intelligence.generate"
  | "seo-intelligence.score"
  | "seo-intelligence.persist"
  | "seo-intelligence.list";

export const SEO_INTELLIGENCE_CAPABILITIES: readonly SeoIntelligenceCapability[] = [
  "seo-intelligence.generate",
  "seo-intelligence.score",
  "seo-intelligence.persist",
  "seo-intelligence.list",
] as const;

export type SeoIntelligenceModuleContract = {
  moduleId: SeoIntelligenceModuleId;
  version: string;
  capabilities: readonly SeoIntelligenceCapability[];
};

export const SEO_INTELLIGENCE_MODULE_CONTRACT: SeoIntelligenceModuleContract = {
  moduleId: SEO_INTELLIGENCE_MODULE_ID,
  version: SEO_INTELLIGENCE_MODULE_VERSION,
  capabilities: SEO_INTELLIGENCE_CAPABILITIES,
};

/** Orchestrates SEO intelligence generation and persistence. */
export class SeoIntelligenceModule {
  readonly contract = SEO_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: SeoIntelligenceEngine;

  constructor(
    private readonly repository: SeoIntelligenceRepository,
    engine?: SeoIntelligenceEngine,
  ) {
    this.engine = engine ?? new SeoIntelligenceEngine(repository);
  }

  generateSeoIntelligence = generateSeoIntelligence;
  scoring = seoIntelligenceScoring;

  generateProfile(input: SeoIntelligenceInput) {
    return this.engine.generateProfile(input);
  }

  async persistProfile(
    workspaceId: string,
    input: SeoIntelligenceInput,
  ): Promise<SeoIntelligenceRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getProfileRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<SeoIntelligenceRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getProfileByStore(
    workspaceId: string,
    storeId: string,
  ): Promise<SeoIntelligenceRecord | null> {
    return this.repository.getByStore(workspaceId, storeId);
  }

  async listProfileRecords(
    workspaceId: string,
    filters: Omit<SeoIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<SeoIntelligenceRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for an SEO intelligence module with optional custom dependencies. */
export function createSeoIntelligenceModule(
  repository: SeoIntelligenceRepository = createInMemorySeoIntelligenceRepository(),
  engine?: SeoIntelligenceEngine,
): SeoIntelligenceModule {
  return new SeoIntelligenceModule(
    repository,
    engine ?? new SeoIntelligenceEngine(repository),
  );
}

export const seoIntelligenceModule = createSeoIntelligenceModule();

export type {
  SeoIntelligenceInput,
  SeoIntelligenceBrandInput,
  SeoIntelligenceOfferInput,
};

export { defaultSeoIntelligenceEngine };
