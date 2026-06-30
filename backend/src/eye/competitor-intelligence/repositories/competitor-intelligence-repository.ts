import type {
  CompetitorIntelligenceRecord,
  CompetitorIntelligenceRecordCreateInput,
} from "../models/competitor-intelligence-record.js";
import type { CompetitorSnapshot } from "../models/competitor-snapshot.js";

export type CompetitorIntelligenceRepositoryQuery = {
  workspaceId: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for competitor intelligence records. */
export type CompetitorIntelligenceRepository = {
  save(
    workspaceId: string,
    input: CompetitorIntelligenceRecordCreateInput,
  ): Promise<CompetitorIntelligenceRecord>;
  getById(workspaceId: string, recordId: string): Promise<CompetitorIntelligenceRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<CompetitorIntelligenceRecord | null>;
  list(query: CompetitorIntelligenceRepositoryQuery): Promise<CompetitorIntelligenceRecord[]>;
  getLatestSnapshots(workspaceId: string, storeId: string): Promise<CompetitorSnapshot[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
