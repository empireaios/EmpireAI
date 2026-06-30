import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { IdentityEntity, IdentityHistoryEntry } from "../models/identity-entity.js";
import type { IdentityRegistryRepository } from "../repositories/identity-registry-repository.js";

function mapEntityRow(row: Record<string, unknown>): IdentityEntity {
  return JSON.parse(String(row.entity_json)) as IdentityEntity;
}

function mapHistoryRow(row: Record<string, unknown>): IdentityHistoryEntry {
  return {
    historyId: String(row.history_id),
    canonicalId: String(row.canonical_id),
    changeType: row.change_type as IdentityHistoryEntry["changeType"],
    previousValue: row.previous_value ? String(row.previous_value) : null,
    newValue: row.new_value ? String(row.new_value) : null,
    summary: String(row.summary),
    actor: String(row.actor),
    createdAt: String(row.created_at),
  };
}

let repositoryInstance: SqliteIdentityRegistryRepository | null = null;

export function getIdentityRegistryRepository(): SqliteIdentityRegistryRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteIdentityRegistryRepository();
  }
  return repositoryInstance;
}

export function resetIdentityRegistryRepository(): void {
  repositoryInstance = null;
}

/** SQLite persistence for canonical identity entities and change history. */
export class SqliteIdentityRegistryRepository implements IdentityRegistryRepository {
  saveEntity(entity: IdentityEntity): IdentityEntity {
    const db = getDatabase();
    const record = { ...entity, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO identity_entities
        (canonical_id, entity_type, display_name, aliases_json, workspace_id, entity_json, created_at, updated_at)
       VALUES
        (@canonicalId, @entityType, @displayName, @aliasesJson, @workspaceId, @entityJson, @createdAt, @updatedAt)
       ON CONFLICT(canonical_id) DO UPDATE SET
         entity_type = excluded.entity_type,
         display_name = excluded.display_name,
         aliases_json = excluded.aliases_json,
         workspace_id = excluded.workspace_id,
         entity_json = excluded.entity_json,
         updated_at = excluded.updated_at`,
    ).run({
      canonicalId: record.canonicalId,
      entityType: record.entityType,
      displayName: record.displayName,
      aliasesJson: JSON.stringify(record.aliases),
      workspaceId: record.workspaceId ?? null,
      entityJson: JSON.stringify(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return record;
  }

  getEntityByCanonicalId(canonicalId: string): IdentityEntity | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT entity_json FROM identity_entities WHERE canonical_id = @canonicalId`)
      .get({ canonicalId });
    return row ? mapEntityRow(row as Record<string, unknown>) : null;
  }

  listEntities(workspaceId?: string): IdentityEntity[] {
    const db = getDatabase();
    const rows = workspaceId
      ? db
          .prepare(
            `SELECT entity_json FROM identity_entities
             WHERE workspace_id IS NULL OR workspace_id = @workspaceId
             ORDER BY display_name ASC`,
          )
          .all({ workspaceId })
      : db
          .prepare(`SELECT entity_json FROM identity_entities ORDER BY display_name ASC`)
          .all();
    return (rows as Record<string, unknown>[]).map(mapEntityRow);
  }

  appendHistory(entry: IdentityHistoryEntry): IdentityHistoryEntry {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO identity_history
        (history_id, canonical_id, change_type, previous_value, new_value, summary, actor, created_at)
       VALUES
        (@historyId, @canonicalId, @changeType, @previousValue, @newValue, @summary, @actor, @createdAt)`,
    ).run({
      historyId: entry.historyId,
      canonicalId: entry.canonicalId,
      changeType: entry.changeType,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      summary: entry.summary,
      actor: entry.actor,
      createdAt: entry.createdAt,
    });
    return entry;
  }

  listHistory(canonicalId: string, limit = 100): IdentityHistoryEntry[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM identity_history
         WHERE canonical_id = @canonicalId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ canonicalId, limit });
    return (rows as Record<string, unknown>[]).map(mapHistoryRow);
  }
}

export function createIdentityHistoryEntry(
  input: Omit<IdentityHistoryEntry, "historyId" | "createdAt">,
): IdentityHistoryEntry {
  return {
    historyId: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
}
