import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { DecisionLifecycleRecord, EmpireDecision } from "../models/empire-decision.js";
import type { DecisionRepository } from "../repositories/decision-repository.js";

function mapDecisionRow(row: Record<string, unknown>): EmpireDecision {
  return JSON.parse(String(row.decision_json)) as EmpireDecision;
}

function mapLifecycleRow(row: Record<string, unknown>): DecisionLifecycleRecord {
  return {
    lifecycleId: String(row.lifecycle_id),
    decisionId: String(row.decision_id),
    workspaceId: String(row.workspace_id),
    event: row.event as DecisionLifecycleRecord["event"],
    summary: String(row.summary),
    actor: String(row.actor),
    correlationId: row.correlation_id ? String(row.correlation_id) : undefined,
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
  };
}

let repositoryInstance: SqliteDecisionRepository | null = null;

export function getDecisionRepository(): SqliteDecisionRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteDecisionRepository();
  }
  return repositoryInstance;
}

export function resetDecisionRepository(): void {
  repositoryInstance = null;
}

/** SQLite persistence — decisions are never deleted, only status-transitioned. */
export class SqliteDecisionRepository implements DecisionRepository {
  saveDecision(decision: EmpireDecision): EmpireDecision {
    const db = getDatabase();
    const record = { ...decision, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO empire_decisions
        (decision_id, workspace_id, category, status, version, decision_json, created_at, updated_at)
       VALUES
        (@decisionId, @workspaceId, @category, @status, @version, @decisionJson, @createdAt, @updatedAt)
       ON CONFLICT(decision_id) DO UPDATE SET
         category = excluded.category,
         status = excluded.status,
         version = excluded.version,
         decision_json = excluded.decision_json,
         updated_at = excluded.updated_at`,
    ).run({
      decisionId: record.decisionId,
      workspaceId: record.workspaceId,
      category: record.category,
      status: record.status,
      version: record.version,
      decisionJson: JSON.stringify(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return record;
  }

  getDecisionById(decisionId: string): EmpireDecision | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT decision_json FROM empire_decisions WHERE decision_id = @decisionId`)
      .get({ decisionId });
    return row ? mapDecisionRow(row as Record<string, unknown>) : null;
  }

  listDecisions(workspaceId: string, status?: string, category?: string): EmpireDecision[] {
    const db = getDatabase();
    let query = `SELECT decision_json FROM empire_decisions WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };

    if (status) {
      query += ` AND status = @status`;
      params.status = status;
    }
    if (category) {
      query += ` AND category = @category`;
      params.category = category;
    }
    query += ` ORDER BY decision_id ASC`;

    const rows = db.prepare(query).all(params);
    return (rows as Record<string, unknown>[]).map(mapDecisionRow);
  }

  appendLifecycle(record: DecisionLifecycleRecord): DecisionLifecycleRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO decision_lifecycle
        (lifecycle_id, decision_id, workspace_id, event, summary, actor, correlation_id, metadata_json, created_at)
       VALUES
        (@lifecycleId, @decisionId, @workspaceId, @event, @summary, @actor, @correlationId, @metadataJson, @createdAt)`,
    ).run({
      lifecycleId: record.lifecycleId,
      decisionId: record.decisionId,
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

  listLifecycle(decisionId: string, limit = 100): DecisionLifecycleRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM decision_lifecycle
         WHERE decision_id = @decisionId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ decisionId, limit });
    return (rows as Record<string, unknown>[]).map(mapLifecycleRow);
  }

  listWorkspaceLifecycle(workspaceId: string, limit = 100): DecisionLifecycleRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM decision_lifecycle
         WHERE workspace_id = @workspaceId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit });
    return (rows as Record<string, unknown>[]).map(mapLifecycleRow);
  }
}

export function createDecisionLifecycleRecord(
  input: Omit<DecisionLifecycleRecord, "lifecycleId" | "createdAt">,
): DecisionLifecycleRecord {
  return {
    lifecycleId: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
}
