import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { Doctrine, DoctrineLifecycleRecord } from "../models/doctrine.js";
import type { DoctrineRepository } from "../repositories/doctrine-repository.js";

function mapDoctrineRow(row: Record<string, unknown>): Doctrine {
  return JSON.parse(String(row.doctrine_json)) as Doctrine;
}

function mapLifecycleRow(row: Record<string, unknown>): DoctrineLifecycleRecord {
  return {
    lifecycleId: String(row.lifecycle_id),
    doctrineId: String(row.doctrine_id),
    workspaceId: String(row.workspace_id),
    event: row.event as DoctrineLifecycleRecord["event"],
    summary: String(row.summary),
    actor: String(row.actor),
    correlationId: row.correlation_id ? String(row.correlation_id) : undefined,
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
  };
}

let repositoryInstance: SqliteDoctrineRepository | null = null;

export function getDoctrineRepository(): SqliteDoctrineRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteDoctrineRepository();
  }
  return repositoryInstance;
}

export function resetDoctrineRepository(): void {
  repositoryInstance = null;
}

/** SQLite persistence for doctrines and lifecycle tracking. */
export class SqliteDoctrineRepository implements DoctrineRepository {
  saveDoctrine(doctrine: Doctrine): Doctrine {
    const db = getDatabase();
    const record = { ...doctrine, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO empire_doctrines
        (doctrine_id, workspace_id, status, version, doctrine_json, created_at, updated_at)
       VALUES
        (@doctrineId, @workspaceId, @status, @version, @doctrineJson, @createdAt, @updatedAt)
       ON CONFLICT(doctrine_id) DO UPDATE SET
         status = excluded.status,
         version = excluded.version,
         doctrine_json = excluded.doctrine_json,
         updated_at = excluded.updated_at`,
    ).run({
      doctrineId: record.doctrineId,
      workspaceId: record.workspaceId,
      status: record.status,
      version: record.version,
      doctrineJson: JSON.stringify(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return record;
  }

  getDoctrineById(doctrineId: string): Doctrine | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT doctrine_json FROM empire_doctrines WHERE doctrine_id = @doctrineId`)
      .get({ doctrineId });
    return row ? mapDoctrineRow(row as Record<string, unknown>) : null;
  }

  listDoctrines(workspaceId: string, status?: string): Doctrine[] {
    const db = getDatabase();
    const rows = status
      ? db
          .prepare(
            `SELECT doctrine_json FROM empire_doctrines
             WHERE workspace_id = @workspaceId AND status = @status
             ORDER BY doctrine_id ASC`,
          )
          .all({ workspaceId, status })
      : db
          .prepare(
            `SELECT doctrine_json FROM empire_doctrines
             WHERE workspace_id = @workspaceId ORDER BY doctrine_id ASC`,
          )
          .all({ workspaceId });
    return (rows as Record<string, unknown>[]).map(mapDoctrineRow);
  }

  appendLifecycle(record: DoctrineLifecycleRecord): DoctrineLifecycleRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO doctrine_lifecycle
        (lifecycle_id, doctrine_id, workspace_id, event, summary, actor, correlation_id, metadata_json, created_at)
       VALUES
        (@lifecycleId, @doctrineId, @workspaceId, @event, @summary, @actor, @correlationId, @metadataJson, @createdAt)`,
    ).run({
      lifecycleId: record.lifecycleId,
      doctrineId: record.doctrineId,
      workspaceId: record.workspaceId,
      event: record.event,
      summary: record.summary,
      actor: record.actor,
      correlationId: record.correlationId ?? null,
      metadataJson: JSON.stringify(record.metadata),
      createdAt: record.createdAt,
    });
    return record;
  }

  listLifecycle(doctrineId: string, limit = 100): DoctrineLifecycleRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM doctrine_lifecycle
         WHERE doctrine_id = @doctrineId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ doctrineId, limit });
    return (rows as Record<string, unknown>[]).map(mapLifecycleRow);
  }

  listWorkspaceLifecycle(workspaceId: string, limit = 100): DoctrineLifecycleRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM doctrine_lifecycle
         WHERE workspace_id = @workspaceId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit });
    return (rows as Record<string, unknown>[]).map(mapLifecycleRow);
  }
}

export function createDoctrineLifecycleRecord(
  input: Omit<DoctrineLifecycleRecord, "lifecycleId" | "createdAt">,
): DoctrineLifecycleRecord {
  return {
    lifecycleId: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
}
