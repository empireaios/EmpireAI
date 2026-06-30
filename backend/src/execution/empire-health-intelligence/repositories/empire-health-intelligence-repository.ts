import type {
  EmpireHealthRecord,
  EmpireHealthRecordCreateInput,
} from "../models/empire-health-record.js";

export type EmpireHealthIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for empire health intelligence records. */
export type EmpireHealthIntelligenceRepository = {
  save(
    workspaceId: string,
    input: EmpireHealthRecordCreateInput,
  ): Promise<EmpireHealthRecord>;
  getById(workspaceId: string, recordId: string): Promise<EmpireHealthRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<EmpireHealthRecord | null>;
  list(query: EmpireHealthIntelligenceRepositoryQuery): Promise<EmpireHealthRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
