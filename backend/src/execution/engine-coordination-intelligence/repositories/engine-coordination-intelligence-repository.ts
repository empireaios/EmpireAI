import type {
  EngineCoordinationRecord,
  EngineCoordinationRecordCreateInput,
} from "../models/engine-coordination-record.js";

export type EngineCoordinationIntelligenceRepositoryQuery = {
  workspaceId: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for engine coordination intelligence records. */
export type EngineCoordinationIntelligenceRepository = {
  save(
    input: EngineCoordinationRecordCreateInput,
  ): Promise<EngineCoordinationRecord>;
  getById(workspaceId: string, recordId: string): Promise<EngineCoordinationRecord | null>;
  getByWorkspace(workspaceId: string): Promise<EngineCoordinationRecord | null>;
  list(query: EngineCoordinationIntelligenceRepositoryQuery): Promise<EngineCoordinationRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
