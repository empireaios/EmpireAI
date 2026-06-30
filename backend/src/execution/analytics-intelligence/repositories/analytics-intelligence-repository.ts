import type {
  AnalyticsIntelligenceRecord,
  AnalyticsIntelligenceRecordCreateInput,
} from "../models/analytics-intelligence-record.js";

export type AnalyticsIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for analytics intelligence records. */
export type AnalyticsIntelligenceRepository = {
  save(
    workspaceId: string,
    input: AnalyticsIntelligenceRecordCreateInput,
  ): Promise<AnalyticsIntelligenceRecord>;
  getById(workspaceId: string, recordId: string): Promise<AnalyticsIntelligenceRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<AnalyticsIntelligenceRecord | null>;
  list(query: AnalyticsIntelligenceRepositoryQuery): Promise<AnalyticsIntelligenceRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
