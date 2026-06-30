import type {
  CroIntelligenceRecord,
  CroIntelligenceRecordCreateInput,
} from "../models/cro-intelligence-record.js";

export type CroIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for CRO intelligence records. */
export type CroIntelligenceRepository = {
  save(
    workspaceId: string,
    input: CroIntelligenceRecordCreateInput,
  ): Promise<CroIntelligenceRecord>;
  getById(workspaceId: string, recordId: string): Promise<CroIntelligenceRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<CroIntelligenceRecord | null>;
  list(query: CroIntelligenceRepositoryQuery): Promise<CroIntelligenceRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
