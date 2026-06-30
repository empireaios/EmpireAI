import type {
  CampaignIntelligenceRecord,
  CampaignIntelligenceRecordCreateInput,
} from "../models/campaign-intelligence-record.js";

export type CampaignIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for marketing campaign intelligence records. */
export type CampaignIntelligenceRepository = {
  save(
    workspaceId: string,
    input: CampaignIntelligenceRecordCreateInput,
  ): Promise<CampaignIntelligenceRecord>;
  getById(workspaceId: string, recordId: string): Promise<CampaignIntelligenceRecord | null>;
  getByBrand(workspaceId: string, brandId: string): Promise<CampaignIntelligenceRecord | null>;
  list(query: CampaignIntelligenceRepositoryQuery): Promise<CampaignIntelligenceRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
