import type {
  FounderCommandCenterRecord,
  FounderCommandCenterRecordCreateInput,
} from "../models/founder-command-center-record.js";

export type FounderCommandCenterRepositoryQuery = {
  workspaceId: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
};

/** Persistence contract for founder command center dashboard snapshots. */
export type FounderCommandCenterRepository = {
  save(
    workspaceId: string,
    input: FounderCommandCenterRecordCreateInput,
  ): Promise<FounderCommandCenterRecord>;
  getById(
    workspaceId: string,
    recordId: string,
  ): Promise<FounderCommandCenterRecord | null>;
  getLatest(workspaceId: string): Promise<FounderCommandCenterRecord | null>;
  list(query: FounderCommandCenterRepositoryQuery): Promise<FounderCommandCenterRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
