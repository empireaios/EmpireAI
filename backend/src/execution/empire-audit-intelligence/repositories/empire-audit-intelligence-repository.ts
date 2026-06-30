import type {
  EmpireAuditRecord,
  EmpireAuditRecordCreateInput,
} from "../models/empire-audit-record.js";

export type EmpireAuditIntelligenceRepositoryQuery = {
  workspaceId: string;
  limit?: number;
  offset?: number;
};

/** Repository contract for empire audit intelligence records. */
export interface EmpireAuditIntelligenceRepository {
  save(input: EmpireAuditRecordCreateInput): Promise<EmpireAuditRecord>;
  getById(workspaceId: string, recordId: string): Promise<EmpireAuditRecord | null>;
  getByWorkspace(workspaceId: string): Promise<EmpireAuditRecord | null>;
  list(query: EmpireAuditIntelligenceRepositoryQuery): Promise<EmpireAuditRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
}
