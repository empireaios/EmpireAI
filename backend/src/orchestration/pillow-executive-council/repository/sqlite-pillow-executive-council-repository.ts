import { getDatabase } from "../../../brain/database.js";
import type { StoredExecutiveCouncilRecord } from "../service.js";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row.record_json)) as T;
}

export class SqlitePillowExecutiveCouncilRepository {
  ensureTables(): void {
    const db = getDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS pillow_executive_council_records (
        record_id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        request_id TEXT NOT NULL,
        debate_id TEXT NOT NULL,
        recommendation_id TEXT NOT NULL,
        status TEXT NOT NULL,
        record_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_pec_workspace_request
        ON pillow_executive_council_records(workspace_id, request_id);
      CREATE INDEX IF NOT EXISTS idx_pec_workspace_status
        ON pillow_executive_council_records(workspace_id, status);
      CREATE INDEX IF NOT EXISTS idx_pec_recommendation
        ON pillow_executive_council_records(recommendation_id);
    `);
  }

  save(record: StoredExecutiveCouncilRecord): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO pillow_executive_council_records
        (record_id, workspace_id, session_id, request_id, debate_id, recommendation_id, status, record_json, created_at, updated_at)
       VALUES (@recordId, @workspaceId, @sessionId, @requestId, @debateId, @recommendationId, @status, @json, @createdAt, @updatedAt)
       ON CONFLICT(record_id) DO UPDATE SET
         status = excluded.status,
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
    ).run({
      recordId: record.recordId,
      workspaceId: record.workspaceId,
      sessionId: record.sessionId,
      requestId: record.requestId,
      debateId: record.debateId,
      recommendationId: record.recommendationId,
      status: record.status,
      json: JSON.stringify(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  getByRequest(workspaceId: string, requestId: string): StoredExecutiveCouncilRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM pillow_executive_council_records
         WHERE workspace_id = @workspaceId AND request_id = @requestId
         ORDER BY updated_at DESC LIMIT 1`,
      )
      .get({ workspaceId, requestId }) as Record<string, unknown> | undefined;
    return row ? mapJson<StoredExecutiveCouncilRecord>(row) : null;
  }

  getByDebateId(workspaceId: string, debateId: string): StoredExecutiveCouncilRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM pillow_executive_council_records
         WHERE workspace_id = @workspaceId AND debate_id = @debateId`,
      )
      .get({ workspaceId, debateId }) as Record<string, unknown> | undefined;
    return row ? mapJson<StoredExecutiveCouncilRecord>(row) : null;
  }

  getByRecommendationId(
    workspaceId: string,
    recommendationId: string,
  ): StoredExecutiveCouncilRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM pillow_executive_council_records
         WHERE workspace_id = @workspaceId AND recommendation_id = @recommendationId`,
      )
      .get({ workspaceId, recommendationId }) as Record<string, unknown> | undefined;
    return row ? mapJson<StoredExecutiveCouncilRecord>(row) : null;
  }

  listByStatus(workspaceId: string, status: string): StoredExecutiveCouncilRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM pillow_executive_council_records
         WHERE workspace_id = @workspaceId AND status = @status
         ORDER BY updated_at DESC`,
      )
      .all({ workspaceId, status }) as Array<Record<string, unknown>>;
    return rows.map((row) => mapJson<StoredExecutiveCouncilRecord>(row));
  }
}
