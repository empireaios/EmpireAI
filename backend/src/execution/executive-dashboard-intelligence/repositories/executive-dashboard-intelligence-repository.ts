import type {
  ExecutiveDashboardRecord,
  ExecutiveDashboardRecordCreateInput,
} from "../models/executive-dashboard-record.js";

export type ExecutiveDashboardIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for executive dashboard intelligence records. */
export type ExecutiveDashboardIntelligenceRepository = {
  save(
    workspaceId: string,
    input: ExecutiveDashboardRecordCreateInput,
  ): Promise<ExecutiveDashboardRecord>;
  getById(workspaceId: string, recordId: string): Promise<ExecutiveDashboardRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<ExecutiveDashboardRecord | null>;
  list(query: ExecutiveDashboardIntelligenceRepositoryQuery): Promise<ExecutiveDashboardRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
