import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { KingPromise, PromiseLifecycleRecord } from "../models/king-promise.js";
import type { PromiseRepository } from "../repositories/promise-repository.js";

function mapPromiseRow(row: Record<string, unknown>): KingPromise {
  return JSON.parse(String(row.promise_json)) as KingPromise;
}

function mapLifecycleRow(row: Record<string, unknown>): PromiseLifecycleRecord {
  return {
    lifecycleId: String(row.lifecycle_id),
    promiseId: String(row.promise_id),
    workspaceId: String(row.workspace_id),
    event: row.event as PromiseLifecycleRecord["event"],
    summary: String(row.summary),
    actor: String(row.actor),
    correlationId: row.correlation_id ? String(row.correlation_id) : undefined,
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
  };
}

let repositoryInstance: SqlitePromiseRepository | null = null;

export function getPromiseRepository(): SqlitePromiseRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqlitePromiseRepository();
  }
  return repositoryInstance;
}

export function resetPromiseRepository(): void {
  repositoryInstance = null;
}

/** SQLite persistence — promises are never deleted, only status-transitioned. */
export class SqlitePromiseRepository implements PromiseRepository {
  savePromise(promise: KingPromise): KingPromise {
    const db = getDatabase();
    const record = { ...promise, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO king_promises
        (promise_id, workspace_id, status, progress_percent, promise_json, created_at, updated_at)
       VALUES
        (@promiseId, @workspaceId, @status, @progressPercent, @promiseJson, @createdAt, @updatedAt)
       ON CONFLICT(promise_id) DO UPDATE SET
         status = excluded.status,
         progress_percent = excluded.progress_percent,
         promise_json = excluded.promise_json,
         updated_at = excluded.updated_at`,
    ).run({
      promiseId: record.promiseId,
      workspaceId: record.workspaceId,
      status: record.status,
      progressPercent: record.progressPercent,
      promiseJson: JSON.stringify(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return record;
  }

  getPromiseById(promiseId: string): KingPromise | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT promise_json FROM king_promises WHERE promise_id = @promiseId`)
      .get({ promiseId });
    return row ? mapPromiseRow(row as Record<string, unknown>) : null;
  }

  listPromises(workspaceId: string, status?: string): KingPromise[] {
    const db = getDatabase();
    const rows = status
      ? db
          .prepare(
            `SELECT promise_json FROM king_promises
             WHERE workspace_id = @workspaceId AND status = @status
             ORDER BY promise_id ASC`,
          )
          .all({ workspaceId, status })
      : db
          .prepare(
            `SELECT promise_json FROM king_promises
             WHERE workspace_id = @workspaceId ORDER BY promise_id ASC`,
          )
          .all({ workspaceId });
    return (rows as Record<string, unknown>[]).map(mapPromiseRow);
  }

  appendLifecycle(record: PromiseLifecycleRecord): PromiseLifecycleRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO promise_lifecycle
        (lifecycle_id, promise_id, workspace_id, event, summary, actor, correlation_id, metadata_json, created_at)
       VALUES
        (@lifecycleId, @promiseId, @workspaceId, @event, @summary, @actor, @correlationId, @metadataJson, @createdAt)`,
    ).run({
      lifecycleId: record.lifecycleId,
      promiseId: record.promiseId,
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

  listLifecycle(promiseId: string, limit = 100): PromiseLifecycleRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM promise_lifecycle
         WHERE promise_id = @promiseId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ promiseId, limit });
    return (rows as Record<string, unknown>[]).map(mapLifecycleRow);
  }

  listWorkspaceLifecycle(workspaceId: string, limit = 100): PromiseLifecycleRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM promise_lifecycle
         WHERE workspace_id = @workspaceId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit });
    return (rows as Record<string, unknown>[]).map(mapLifecycleRow);
  }
}

export function createPromiseLifecycleRecord(
  input: Omit<PromiseLifecycleRecord, "lifecycleId" | "createdAt">,
): PromiseLifecycleRecord {
  return {
    lifecycleId: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
}
