import type {
  AdCreativeRecord,
  AdCreativeRecordCreateInput,
} from "../models/ad-creative-record.js";

export type AdCreativeRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  campaignId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for ad creative generation records. */
export type AdCreativeRepository = {
  save(workspaceId: string, input: AdCreativeRecordCreateInput): Promise<AdCreativeRecord>;
  getById(workspaceId: string, recordId: string): Promise<AdCreativeRecord | null>;
  getByBrand(workspaceId: string, brandId: string): Promise<AdCreativeRecord | null>;
  list(query: AdCreativeRepositoryQuery): Promise<AdCreativeRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
