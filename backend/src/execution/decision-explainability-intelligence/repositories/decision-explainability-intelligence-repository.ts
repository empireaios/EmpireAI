import type {
  DecisionExplainabilityRecord,
  DecisionExplainabilityRecordCreateInput,
} from "../models/decision-explainability-record.js";

export type DecisionExplainabilityIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  decisionType?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for decision explainability intelligence records. */
export type DecisionExplainabilityIntelligenceRepository = {
  save(
    workspaceId: string,
    input: DecisionExplainabilityRecordCreateInput,
  ): Promise<DecisionExplainabilityRecord>;
  getById(workspaceId: string, recordId: string): Promise<DecisionExplainabilityRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<DecisionExplainabilityRecord | null>;
  list(
    query: DecisionExplainabilityIntelligenceRepositoryQuery,
  ): Promise<DecisionExplainabilityRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
