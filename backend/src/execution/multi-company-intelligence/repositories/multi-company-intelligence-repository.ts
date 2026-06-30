import type {
  MultiCompanyRecord,
  MultiCompanyRecordCreateInput,
} from "../models/multi-company-record.js";

export type MultiCompanyIntelligenceRepositoryQuery = {
  workspaceId: string;
  empireId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for multi-company intelligence records. */
export type MultiCompanyIntelligenceRepository = {
  save(
    workspaceId: string,
    input: MultiCompanyRecordCreateInput,
  ): Promise<MultiCompanyRecord>;
  getById(workspaceId: string, recordId: string): Promise<MultiCompanyRecord | null>;
  getByEmpire(workspaceId: string, empireId: string): Promise<MultiCompanyRecord | null>;
  list(query: MultiCompanyIntelligenceRepositoryQuery): Promise<MultiCompanyRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
