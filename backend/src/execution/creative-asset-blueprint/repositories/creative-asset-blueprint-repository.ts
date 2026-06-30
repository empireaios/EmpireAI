import type { CreativeAssetRecord } from "../models/creative-asset-record.js";

export type CreativeAssetBlueprintRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  campaignId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for creative asset blueprint records. */
export type CreativeAssetBlueprintRepository = {
  save(
    workspaceId: string,
    input: import("../models/creative-asset-record.js").CreativeAssetRecordCreateInput,
  ): Promise<CreativeAssetRecord>;
  getById(workspaceId: string, recordId: string): Promise<CreativeAssetRecord | null>;
  getByCampaign(workspaceId: string, campaignId: string): Promise<CreativeAssetRecord | null>;
  getByBrand(workspaceId: string, brandId: string): Promise<CreativeAssetRecord | null>;
  list(query: CreativeAssetBlueprintRepositoryQuery): Promise<CreativeAssetRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
