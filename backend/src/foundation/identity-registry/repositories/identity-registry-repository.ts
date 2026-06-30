import type { IdentityEntity, IdentityHistoryEntry } from "../models/identity-entity.js";

export interface IdentityRegistryRepository {
  saveEntity(entity: IdentityEntity): IdentityEntity;
  getEntityByCanonicalId(canonicalId: string): IdentityEntity | null;
  listEntities(workspaceId?: string): IdentityEntity[];

  appendHistory(entry: IdentityHistoryEntry): IdentityHistoryEntry;
  listHistory(canonicalId: string, limit?: number): IdentityHistoryEntry[];
}
