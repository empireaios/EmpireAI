import type { CampaignGenesisRecord } from "../models/campaign-genesis-record.js";

export type CampaignGenesisRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for marketing campaign genesis records. */
export type CampaignGenesisRepository = {
  save(
    workspaceId: string,
    input: import("../models/campaign-genesis-record.js").CampaignGenesisRecordCreateInput,
  ): Promise<CampaignGenesisRecord>;
  getById(workspaceId: string, recordId: string): Promise<CampaignGenesisRecord | null>;
  getByBrand(workspaceId: string, brandId: string): Promise<CampaignGenesisRecord | null>;
  list(query: CampaignGenesisRepositoryQuery): Promise<CampaignGenesisRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
