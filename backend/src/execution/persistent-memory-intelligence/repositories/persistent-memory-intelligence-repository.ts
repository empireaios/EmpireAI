import type {
  PersistentMemoryRecord,
  PersistentMemoryRecordCreateInput,
} from "../models/persistent-memory-record.js";

export type PersistentMemoryIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for persistent memory intelligence records. */
export type PersistentMemoryIntelligenceRepository = {
  save(
    workspaceId: string,
    input: PersistentMemoryRecordCreateInput,
  ): Promise<PersistentMemoryRecord>;
  getById(workspaceId: string, recordId: string): Promise<PersistentMemoryRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<PersistentMemoryRecord | null>;
  list(query: PersistentMemoryIntelligenceRepositoryQuery): Promise<PersistentMemoryRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
