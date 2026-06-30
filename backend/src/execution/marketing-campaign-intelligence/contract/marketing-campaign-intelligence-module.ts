/**
 * Marketing Campaign Intelligence module — determines how to advertise before any live campaigns.
 */

import {
  MarketingCampaignIntelligenceEngine,
  defaultMarketingCampaignIntelligenceEngine,
  type MarketingCampaignIntelligenceInput,
} from "../engines/marketing-campaign-intelligence-engine.js";
import type { CampaignIntelligenceRecord } from "../models/campaign-intelligence-record.js";
import {
  generateMarketingCampaignIntelligence,
  marketingCampaignIntelligenceScoring,
  type CampaignIntelligenceBrandInput,
  type CampaignIntelligenceOfferInput,
} from "../scoring/marketing-campaign-intelligence-scoring.js";
import type {
  CampaignIntelligenceRepository,
  CampaignIntelligenceRepositoryQuery,
} from "../repositories/campaign-intelligence-repository.js";
import { createInMemoryCampaignIntelligenceRepository } from "../repositories/in-memory-campaign-intelligence-repository.js";

export const MARKETING_CAMPAIGN_INTELLIGENCE_MODULE_ID =
  "marketing-campaign-intelligence" as const;
export type MarketingCampaignIntelligenceModuleId =
  typeof MARKETING_CAMPAIGN_INTELLIGENCE_MODULE_ID;

export const MARKETING_CAMPAIGN_INTELLIGENCE_MODULE_VERSION = "0.1.0" as const;

export type MarketingCampaignIntelligenceCapability =
  | "marketing-campaign-intelligence.generate"
  | "marketing-campaign-intelligence.score"
  | "marketing-campaign-intelligence.persist"
  | "marketing-campaign-intelligence.list";

export const MARKETING_CAMPAIGN_INTELLIGENCE_CAPABILITIES: readonly MarketingCampaignIntelligenceCapability[] =
  [
    "marketing-campaign-intelligence.generate",
    "marketing-campaign-intelligence.score",
    "marketing-campaign-intelligence.persist",
    "marketing-campaign-intelligence.list",
  ] as const;

export type MarketingCampaignIntelligenceModuleContract = {
  moduleId: MarketingCampaignIntelligenceModuleId;
  version: string;
  capabilities: readonly MarketingCampaignIntelligenceCapability[];
};

export const MARKETING_CAMPAIGN_INTELLIGENCE_MODULE_CONTRACT: MarketingCampaignIntelligenceModuleContract =
  {
    moduleId: MARKETING_CAMPAIGN_INTELLIGENCE_MODULE_ID,
    version: MARKETING_CAMPAIGN_INTELLIGENCE_MODULE_VERSION,
    capabilities: MARKETING_CAMPAIGN_INTELLIGENCE_CAPABILITIES,
  };

/** Orchestrates marketing campaign intelligence generation and persistence. */
export class MarketingCampaignIntelligenceModule {
  readonly contract = MARKETING_CAMPAIGN_INTELLIGENCE_MODULE_CONTRACT;
  private readonly engine: MarketingCampaignIntelligenceEngine;

  constructor(
    private readonly repository: CampaignIntelligenceRepository,
    engine?: MarketingCampaignIntelligenceEngine,
  ) {
    this.engine = engine ?? new MarketingCampaignIntelligenceEngine(repository);
  }

  generateMarketingCampaignIntelligence = generateMarketingCampaignIntelligence;
  scoring = marketingCampaignIntelligenceScoring;

  generateIntelligence(input: MarketingCampaignIntelligenceInput) {
    return this.engine.generateIntelligence(input);
  }

  async persistIntelligence(
    workspaceId: string,
    input: MarketingCampaignIntelligenceInput,
  ): Promise<CampaignIntelligenceRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getIntelligenceRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<CampaignIntelligenceRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getIntelligenceByBrand(
    workspaceId: string,
    brandId: string,
  ): Promise<CampaignIntelligenceRecord | null> {
    return this.repository.getByBrand(workspaceId, brandId);
  }

  async listIntelligenceRecords(
    workspaceId: string,
    filters: Omit<CampaignIntelligenceRepositoryQuery, "workspaceId"> = {},
  ): Promise<CampaignIntelligenceRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a marketing campaign intelligence module with optional custom dependencies. */
export function createMarketingCampaignIntelligenceModule(
  repository: CampaignIntelligenceRepository = createInMemoryCampaignIntelligenceRepository(),
  engine?: MarketingCampaignIntelligenceEngine,
): MarketingCampaignIntelligenceModule {
  return new MarketingCampaignIntelligenceModule(
    repository,
    engine ?? new MarketingCampaignIntelligenceEngine(repository),
  );
}

export const marketingCampaignIntelligenceModule =
  createMarketingCampaignIntelligenceModule();

export type {
  MarketingCampaignIntelligenceInput,
  CampaignIntelligenceBrandInput,
  CampaignIntelligenceOfferInput,
};

export { defaultMarketingCampaignIntelligenceEngine };
