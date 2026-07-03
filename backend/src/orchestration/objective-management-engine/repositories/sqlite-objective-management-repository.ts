import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type {
  ExecutiveObjective,
  ObjectiveAlert,
  ObjectiveEvaluationSnapshot,
} from "../models/objective-management.js";

let tablesEnsured = false;

export function ensureObjectiveManagementTables(): void {
  if (tablesEnsured) return;
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS executive_objectives (
      objective_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      progress_percent INTEGER NOT NULL DEFAULT 0,
      confidence_percent INTEGER NOT NULL DEFAULT 0,
      health TEXT NOT NULL DEFAULT 'YELLOW',
      objective_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_executive_objectives_workspace
      ON executive_objectives(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_executive_objectives_status
      ON executive_objectives(status);

    CREATE TABLE IF NOT EXISTS objective_evaluation_snapshots (
      snapshot_id TEXT PRIMARY KEY,
      objective_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      evaluated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_objective_snapshots_objective
      ON objective_evaluation_snapshots(objective_id, evaluated_at DESC);

    CREATE TABLE IF NOT EXISTS objective_alerts (
      alert_id TEXT PRIMARY KEY,
      objective_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      alert_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      acknowledged_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_objective_alerts_workspace
      ON objective_alerts(workspace_id, created_at DESC);
  `);
  tablesEnsured = true;
}

let repositoryInstance: SqliteObjectiveManagementRepository | null = null;

export function getObjectiveManagementRepository(): SqliteObjectiveManagementRepository {
  ensureObjectiveManagementTables();
  if (!repositoryInstance) {
    repositoryInstance = new SqliteObjectiveManagementRepository();
  }
  return repositoryInstance;
}

export function resetObjectiveManagementRepository(): void {
  repositoryInstance = null;
  tablesEnsured = false;
}

export class SqliteObjectiveManagementRepository {
  saveObjective(objective: ExecutiveObjective): ExecutiveObjective {
    const db = getDatabase();
    const now = new Date().toISOString();
    const record = { ...objective, lastUpdated: now };
    db.prepare(
      `INSERT INTO executive_objectives
        (objective_id, workspace_id, company_id, status, priority, progress_percent,
         confidence_percent, health, objective_json, created_at, updated_at)
       VALUES
        (@objectiveId, @workspaceId, @companyId, @status, @priority, @progressPercent,
         @confidencePercent, @health, @objectiveJson, @createdAt, @updatedAt)
       ON CONFLICT(objective_id) DO UPDATE SET
         status = excluded.status,
         priority = excluded.priority,
         progress_percent = excluded.progress_percent,
         confidence_percent = excluded.confidence_percent,
         health = excluded.health,
         objective_json = excluded.objective_json,
         updated_at = excluded.updated_at`,
    ).run({
      objectiveId: record.objectiveId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      status: record.status,
      priority: record.executivePriority,
      progressPercent: record.currentProgressPercent,
      confidencePercent: record.confidencePercent,
      health: record.overallHealth,
      objectiveJson: JSON.stringify(record),
      createdAt: record.startDate,
      updatedAt: now,
    });
    return record;
  }

  getObjective(objectiveId: string): ExecutiveObjective | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT objective_json FROM executive_objectives WHERE objective_id = @objectiveId`)
      .get({ objectiveId }) as { objective_json: string } | undefined;
    return row ? (JSON.parse(row.objective_json) as ExecutiveObjective) : null;
  }

  listObjectives(
    workspaceId: string,
    filters?: { status?: string; companyId?: string },
  ): ExecutiveObjective[] {
    const db = getDatabase();
    let sql = `SELECT objective_json FROM executive_objectives WHERE workspace_id = @workspaceId`;
    const params: Record<string, string> = { workspaceId };
    if (filters?.status) {
      sql += ` AND status = @status`;
      params.status = filters.status;
    }
    if (filters?.companyId) {
      sql += ` AND company_id = @companyId`;
      params.companyId = filters.companyId;
    }
    sql += ` ORDER BY
      CASE priority WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END,
      progress_percent ASC,
      updated_at DESC`;
    const rows = db.prepare(sql).all(params) as Array<{ objective_json: string }>;
    return rows.map((row) => JSON.parse(row.objective_json) as ExecutiveObjective);
  }

  saveSnapshot(snapshot: ObjectiveEvaluationSnapshot): ObjectiveEvaluationSnapshot {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO objective_evaluation_snapshots
        (snapshot_id, objective_id, workspace_id, snapshot_json, evaluated_at)
       VALUES (@snapshotId, @objectiveId, @workspaceId, @snapshotJson, @evaluatedAt)`,
    ).run({
      snapshotId: snapshot.snapshotId,
      objectiveId: snapshot.objectiveId,
      workspaceId: snapshot.workspaceId,
      snapshotJson: JSON.stringify(snapshot),
      evaluatedAt: snapshot.evaluatedAt,
    });
    return snapshot;
  }

  getLatestSnapshot(objectiveId: string): ObjectiveEvaluationSnapshot | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT snapshot_json FROM objective_evaluation_snapshots
         WHERE objective_id = @objectiveId
         ORDER BY evaluated_at DESC LIMIT 1`,
      )
      .get({ objectiveId }) as { snapshot_json: string } | undefined;
    return row ? (JSON.parse(row.snapshot_json) as ObjectiveEvaluationSnapshot) : null;
  }

  saveAlert(alert: ObjectiveAlert): ObjectiveAlert {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO objective_alerts
        (alert_id, objective_id, workspace_id, alert_json, created_at, acknowledged_at)
       VALUES (@alertId, @objectiveId, @workspaceId, @alertJson, @createdAt, @acknowledgedAt)`,
    ).run({
      alertId: alert.alertId,
      objectiveId: alert.objectiveId,
      workspaceId: alert.workspaceId,
      alertJson: JSON.stringify(alert),
      createdAt: alert.createdAt,
      acknowledgedAt: alert.acknowledgedAt,
    });
    return alert;
  }

  listAlerts(workspaceId: string, limit = 20): ObjectiveAlert[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT alert_json FROM objective_alerts
         WHERE workspace_id = @workspaceId
         ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit }) as Array<{ alert_json: string }>;
    return rows.map((row) => JSON.parse(row.alert_json) as ObjectiveAlert);
  }

  createId(prefix: string): string {
    return `${prefix}-${randomUUID()}`;
  }
}
