/**
 * Marketing Campaign Genesis module — generates launch campaigns automatically.
 */

import {
  MarketingCampaignGenesisEngine,
  defaultMarketingCampaignGenesisEngine,
  type MarketingCampaignGenesisInput,
} from "../engines/marketing-campaign-genesis-engine.js";
import type { CampaignGenesisRecord } from "../models/campaign-genesis-record.js";
import {
  generateMarketingCampaign,
  marketingCampaignGenesisScoring,
  type CampaignGenesisBrandInput,
  type CampaignGenesisOfferInput,
} from "../scoring/marketing-campaign-genesis-scoring.js";
import type {
  CampaignGenesisRepository,
  CampaignGenesisRepositoryQuery,
} from "../repositories/campaign-genesis-repository.js";
import { createInMemoryCampaignGenesisRepository } from "../repositories/in-memory-campaign-genesis-repository.js";

export const MARKETING_CAMPAIGN_GENESIS_MODULE_ID = "marketing-campaign-genesis" as const;
export type MarketingCampaignGenesisModuleId = typeof MARKETING_CAMPAIGN_GENESIS_MODULE_ID;

export const MARKETING_CAMPAIGN_GENESIS_MODULE_VERSION = "0.1.0" as const;

export type MarketingCampaignGenesisCapability =
  | "marketing-campaign-genesis.generate"
  | "marketing-campaign-genesis.score"
  | "marketing-campaign-genesis.persist"
  | "marketing-campaign-genesis.list";

export const MARKETING_CAMPAIGN_GENESIS_CAPABILITIES: readonly MarketingCampaignGenesisCapability[] =
  [
    "marketing-campaign-genesis.generate",
    "marketing-campaign-genesis.score",
    "marketing-campaign-genesis.persist",
    "marketing-campaign-genesis.list",
  ] as const;

export type MarketingCampaignGenesisModuleContract = {
  moduleId: MarketingCampaignGenesisModuleId;
  version: string;
  capabilities: readonly MarketingCampaignGenesisCapability[];
};

export const MARKETING_CAMPAIGN_GENESIS_MODULE_CONTRACT: MarketingCampaignGenesisModuleContract =
  {
    moduleId: MARKETING_CAMPAIGN_GENESIS_MODULE_ID,
    version: MARKETING_CAMPAIGN_GENESIS_MODULE_VERSION,
    capabilities: MARKETING_CAMPAIGN_GENESIS_CAPABILITIES,
  };

/** Orchestrates marketing campaign generation and persistence. */
export class MarketingCampaignGenesisModule {
  readonly contract = MARKETING_CAMPAIGN_GENESIS_MODULE_CONTRACT;
  private readonly engine: MarketingCampaignGenesisEngine;

  constructor(
    private readonly repository: CampaignGenesisRepository,
    engine?: MarketingCampaignGenesisEngine,
  ) {
    this.engine = engine ?? new MarketingCampaignGenesisEngine(repository);
  }

  generateMarketingCampaign = generateMarketingCampaign;
  scoring = marketingCampaignGenesisScoring;

  generateCampaign(input: MarketingCampaignGenesisInput) {
    return this.engine.generateCampaign(input);
  }

  async persistCampaign(
    workspaceId: string,
    input: MarketingCampaignGenesisInput,
  ): Promise<CampaignGenesisRecord> {
    return this.engine.generateAndSave(workspaceId, input);
  }

  async getCampaignRecord(
    workspaceId: string,
    recordId: string,
  ): Promise<CampaignGenesisRecord | null> {
    return this.repository.getById(workspaceId, recordId);
  }

  async getCampaignByBrand(
    workspaceId: string,
    brandId: string,
  ): Promise<CampaignGenesisRecord | null> {
    return this.repository.getByBrand(workspaceId, brandId);
  }

  async listCampaignRecords(
    workspaceId: string,
    filters: Omit<CampaignGenesisRepositoryQuery, "workspaceId"> = {},
  ): Promise<CampaignGenesisRecord[]> {
    return this.repository.list({ workspaceId, ...filters });
  }
}

/** Factory for a marketing campaign genesis module with optional custom dependencies. */
export function createMarketingCampaignGenesisModule(
  repository: CampaignGenesisRepository = createInMemoryCampaignGenesisRepository(),
  engine?: MarketingCampaignGenesisEngine,
): MarketingCampaignGenesisModule {
  return new MarketingCampaignGenesisModule(
    repository,
    engine ?? new MarketingCampaignGenesisEngine(repository),
  );
}

export const marketingCampaignGenesisModule = createMarketingCampaignGenesisModule();

export type {
  MarketingCampaignGenesisInput,
  CampaignGenesisBrandInput,
  CampaignGenesisOfferInput,
};

export { defaultMarketingCampaignGenesisEngine };
