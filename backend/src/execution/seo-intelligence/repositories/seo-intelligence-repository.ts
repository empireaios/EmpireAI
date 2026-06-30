import type {
  SeoIntelligenceRecord,
  SeoIntelligenceRecordCreateInput,
} from "../models/seo-intelligence-record.js";

export type SeoIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for SEO intelligence records. */
export type SeoIntelligenceRepository = {
  save(
    workspaceId: string,
    input: SeoIntelligenceRecordCreateInput,
  ): Promise<SeoIntelligenceRecord>;
  getById(workspaceId: string, recordId: string): Promise<SeoIntelligenceRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<SeoIntelligenceRecord | null>;
  list(query: SeoIntelligenceRepositoryQuery): Promise<SeoIntelligenceRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
