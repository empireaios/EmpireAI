import type {
  ReviewIntelligenceRecord,
  ReviewIntelligenceRecordCreateInput,
} from "../models/review-intelligence-record.js";

export type ReviewIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for review intelligence records. */
export type ReviewIntelligenceRepository = {
  save(
    workspaceId: string,
    input: ReviewIntelligenceRecordCreateInput,
  ): Promise<ReviewIntelligenceRecord>;
  getById(workspaceId: string, recordId: string): Promise<ReviewIntelligenceRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<ReviewIntelligenceRecord | null>;
  list(query: ReviewIntelligenceRepositoryQuery): Promise<ReviewIntelligenceRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
