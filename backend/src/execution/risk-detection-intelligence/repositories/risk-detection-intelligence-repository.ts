import type {
  RiskDetectionRecord,
  RiskDetectionRecordCreateInput,
} from "../models/risk-detection-record.js";

export type RiskDetectionIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for risk detection intelligence records. */
export type RiskDetectionIntelligenceRepository = {
  save(
    workspaceId: string,
    input: RiskDetectionRecordCreateInput,
  ): Promise<RiskDetectionRecord>;
  getById(workspaceId: string, recordId: string): Promise<RiskDetectionRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<RiskDetectionRecord | null>;
  list(query: RiskDetectionIntelligenceRepositoryQuery): Promise<RiskDetectionRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
