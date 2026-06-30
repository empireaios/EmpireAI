import type { CampaignGenesisRecord } from "../models/campaign-genesis-record.js";
import type { CampaignGenesisRepository } from "../repositories/campaign-genesis-repository.js";
import {
  generateMarketingCampaign,
  type MarketingCampaignGenesisInput,
} from "../scoring/marketing-campaign-genesis-scoring.js";

/** Generates launch marketing campaigns from brand and offer inputs. */
export class MarketingCampaignGenesisEngine {
  constructor(private readonly repository: CampaignGenesisRepository) {}

  generateCampaign(input: MarketingCampaignGenesisInput) {
    return generateMarketingCampaign(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: MarketingCampaignGenesisInput,
  ): Promise<CampaignGenesisRecord> {
    const breakdown = generateMarketingCampaign(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultMarketingCampaignGenesisEngine = {
  generateCampaign: generateMarketingCampaign,
};

export type { MarketingCampaignGenesisInput };
