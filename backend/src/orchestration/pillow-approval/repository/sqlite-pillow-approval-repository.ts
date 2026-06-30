import { getDatabase } from "../../../brain/database.js";
import type {
  ApprovalHistoryEntry,
  ApprovalRequest,
  CursorMissionRecord,
  DispatchHistoryEntry,
  RecoveryHistoryEntry,
} from "../types.js";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row.record_json)) as T;
}

export function ensurePillowApprovalTables(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS pillow_approval_requests (
      approval_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      status TEXT NOT NULL,
      type TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pillow_approval_history (
      history_id TEXT PRIMARY KEY,
      approval_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pillow_cursor_missions (
      mission_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      phase TEXT NOT NULL,
      record_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pillow_dispatch_history (
      dispatch_id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pillow_recovery_history (
      recovery_id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      workspace_id TEXT NOT NULL,
      record_json TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pillow_approval_workspace
      ON pillow_approval_requests(workspace_id, status);
    CREATE INDEX IF NOT EXISTS idx_pillow_approval_history_workspace
      ON pillow_approval_history(workspace_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_pillow_cursor_missions_workspace
      ON pillow_cursor_missions(workspace_id, phase);
  `);
}

export class SqlitePillowApprovalRepository {
  saveApproval(request: ApprovalRequest): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO pillow_approval_requests
        (approval_id, workspace_id, status, type, record_json, created_at, updated_at)
       VALUES (@approvalId, @workspaceId, @status, @type, @json, @createdAt, @updatedAt)
       ON CONFLICT(approval_id) DO UPDATE SET
         status = excluded.status,
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
    ).run({
      approvalId: request.approvalId,
      workspaceId: request.workspaceId,
      status: request.status,
      type: request.type,
      json: JSON.stringify(request),
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    });
  }

  getApproval(approvalId: string): ApprovalRequest | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM pillow_approval_requests WHERE approval_id = @approvalId`,
      )
      .get({ approvalId }) as Record<string, unknown> | undefined;
    return row ? mapJson<ApprovalRequest>(row) : null;
  }

  listApprovals(
    workspaceId: string,
    filters?: { status?: string; limit?: number },
  ): ApprovalRequest[] {
    const db = getDatabase();
    let sql = `SELECT record_json FROM pillow_approval_requests WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = {
      workspaceId,
      limit: filters?.limit ?? 100,
    };
    if (filters?.status) {
      sql += ` AND status = @status`;
      params.status = filters.status;
    }
    sql += ` ORDER BY updated_at DESC LIMIT @limit`;
    const rows = db.prepare(sql).all(params) as Record<string, unknown>[];
    return rows.map((row) => mapJson<ApprovalRequest>(row));
  }

  appendHistory(entry: ApprovalHistoryEntry): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO pillow_approval_history
        (history_id, approval_id, workspace_id, record_json, timestamp)
       VALUES (@historyId, @approvalId, @workspaceId, @json, @timestamp)`,
    ).run({
      historyId: entry.historyId,
      approvalId: entry.approvalId,
      workspaceId: entry.workspaceId,
      json: JSON.stringify(entry),
      timestamp: entry.timestamp,
    });
  }

  listApprovalHistory(
    workspaceId: string,
    limit = 100,
  ): ApprovalHistoryEntry[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM pillow_approval_history
         WHERE workspace_id = @workspaceId
         ORDER BY timestamp DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit }) as Record<string, unknown>[];
    return rows.map((row) => mapJson<ApprovalHistoryEntry>(row));
  }

  saveMission(record: CursorMissionRecord): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO pillow_cursor_missions
        (mission_id, workspace_id, phase, record_json, created_at, updated_at)
       VALUES (@missionId, @workspaceId, @phase, @json, @createdAt, @updatedAt)
       ON CONFLICT(mission_id) DO UPDATE SET
         phase = excluded.phase,
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
    ).run({
      missionId: record.missionId,
      workspaceId: record.workspaceId,
      phase: record.phase,
      json: JSON.stringify(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  getMission(missionId: string): CursorMissionRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM pillow_cursor_missions WHERE mission_id = @missionId`,
      )
      .get({ missionId }) as Record<string, unknown> | undefined;
    return row ? mapJson<CursorMissionRecord>(row) : null;
  }

  listMissions(
    workspaceId: string,
    filters?: { phase?: string; limit?: number },
  ): CursorMissionRecord[] {
    const db = getDatabase();
    let sql = `SELECT record_json FROM pillow_cursor_missions WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = {
      workspaceId,
      limit: filters?.limit ?? 100,
    };
    if (filters?.phase) {
      sql += ` AND phase = @phase`;
      params.phase = filters.phase;
    }
    sql += ` ORDER BY updated_at DESC LIMIT @limit`;
    const rows = db.prepare(sql).all(params) as Record<string, unknown>[];
    return rows.map((row) => mapJson<CursorMissionRecord>(row));
  }

  appendDispatch(entry: DispatchHistoryEntry): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO pillow_dispatch_history
        (dispatch_id, mission_id, workspace_id, record_json, timestamp)
       VALUES (@dispatchId, @missionId, @workspaceId, @json, @timestamp)`,
    ).run({
      dispatchId: entry.dispatchId,
      missionId: entry.missionId,
      workspaceId: entry.workspaceId,
      json: JSON.stringify(entry),
      timestamp: entry.timestamp,
    });
  }

  listDispatchHistory(
    workspaceId: string,
    limit = 100,
  ): DispatchHistoryEntry[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM pillow_dispatch_history
         WHERE workspace_id = @workspaceId
         ORDER BY timestamp DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit }) as Record<string, unknown>[];
    return rows.map((row) => mapJson<DispatchHistoryEntry>(row));
  }

  appendRecovery(entry: RecoveryHistoryEntry): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO pillow_recovery_history
        (recovery_id, mission_id, workspace_id, record_json, timestamp)
       VALUES (@recoveryId, @missionId, @workspaceId, @json, @timestamp)`,
    ).run({
      recoveryId: entry.recoveryId,
      missionId: entry.missionId,
      workspaceId: entry.workspaceId,
      json: JSON.stringify(entry),
      timestamp: entry.timestamp,
    });
  }

  listRecoveryHistory(
    workspaceId: string,
    limit = 100,
  ): RecoveryHistoryEntry[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM pillow_recovery_history
         WHERE workspace_id = @workspaceId
         ORDER BY timestamp DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit }) as Record<string, unknown>[];
    return rows.map((row) => mapJson<RecoveryHistoryEntry>(row));
  }
}
