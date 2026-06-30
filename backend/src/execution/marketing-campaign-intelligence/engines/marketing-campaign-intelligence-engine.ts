import type { CampaignIntelligenceRecord } from "../models/campaign-intelligence-record.js";
import type { CampaignIntelligenceRepository } from "../repositories/campaign-intelligence-repository.js";
import {
  generateMarketingCampaignIntelligence,
  type MarketingCampaignIntelligenceInput,
} from "../scoring/marketing-campaign-intelligence-scoring.js";

/** Generates marketing campaign intelligence from brand and offer inputs. */
export class MarketingCampaignIntelligenceEngine {
  constructor(private readonly repository: CampaignIntelligenceRepository) {}

  generateIntelligence(input: MarketingCampaignIntelligenceInput) {
    return generateMarketingCampaignIntelligence(input);
  }

  async generateAndSave(
    workspaceId: string,
    input: MarketingCampaignIntelligenceInput,
  ): Promise<CampaignIntelligenceRecord> {
    const breakdown = generateMarketingCampaignIntelligence(input);
    return this.repository.save(workspaceId, breakdown);
  }
}

export const defaultMarketingCampaignIntelligenceEngine = {
  generateIntelligence: generateMarketingCampaignIntelligence,
};

export type { MarketingCampaignIntelligenceInput };
