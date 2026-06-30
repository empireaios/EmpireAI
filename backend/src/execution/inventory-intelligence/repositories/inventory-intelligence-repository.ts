import type {
  InventoryIntelligenceRecord,
  InventoryIntelligenceRecordCreateInput,
} from "../models/inventory-intelligence-record.js";

export type InventoryIntelligenceRepositoryQuery = {
  workspaceId: string;
  brandId?: string;
  storeId?: string;
  limit?: number;
  offset?: number;
};

/** Persistence contract for inventory intelligence records. */
export type InventoryIntelligenceRepository = {
  save(
    workspaceId: string,
    input: InventoryIntelligenceRecordCreateInput,
  ): Promise<InventoryIntelligenceRecord>;
  getById(workspaceId: string, recordId: string): Promise<InventoryIntelligenceRecord | null>;
  getByStore(workspaceId: string, storeId: string): Promise<InventoryIntelligenceRecord | null>;
  list(query: InventoryIntelligenceRepositoryQuery): Promise<InventoryIntelligenceRecord[]>;
  delete(workspaceId: string, recordId: string): Promise<boolean>;
};
