import type {
  ContinuousOptimizationRecord,
  ContinuousOptimizationRecordCreateInput,
} from "../models/continuous-optimization-record.js";

export type ContinuousOptimizationIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for continuous optimization intelligence records. */
export type ContinuousOptimizationIntelligenceRepository = {
  save(
    workspaceId: string,
    input: ContinuousOptimizationRecordCreateInput,
  ): Promise<ContinuousOptimizationRecord>;
  getById(workspaceId: string, recordId: string): Promise<ContinuousOptimizationRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<ContinuousOptimizationRecord | null>;
  list(
    query: ContinuousOptimizationIntelligenceRepositoryQuery,
  ): Promise<ContinuousOptimizationRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
