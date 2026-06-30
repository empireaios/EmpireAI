import type { ExecutiveCouncilSession } from "../models/executive-core.js";
import type { ExecutiveAccountabilityRecord } from "../models/executive-accountability.js";
import type { ExecutiveGeneratedMission } from "../models/executive-mission.js";
import type { RegisteredExecutive } from "../models/executive-registry.js";
import { getDatabase } from "../../brain/database.js";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row["record_json"])) as T;
}

export class ExecutiveCouncilRepository {
  ensureExecutives(workspaceId: string, companyId: string, executives: RegisteredExecutive[]): void {
    const db = getDatabase();
    const stmt = db.prepare(
      `INSERT INTO ec_executives (executive_id, workspace_id, company_id, record_json, updated_at)
       VALUES (@executiveId, @workspaceId, @companyId, @json, @updatedAt)
       ON CONFLICT(executive_id, workspace_id, company_id) DO NOTHING`,
    );
    for (const exec of executives) {
      stmt.run({
        executiveId: exec.executiveId,
        workspaceId,
        companyId,
        json: JSON.stringify(exec),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  listExecutives(workspaceId: string, companyId: string): RegisteredExecutive[] {
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT record_json FROM ec_executives WHERE workspace_id = @workspaceId AND company_id = @companyId`)
      .all({ workspaceId, companyId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<RegisteredExecutive>(r));
  }

  saveExecutive(workspaceId: string, companyId: string, executive: RegisteredExecutive): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ec_executives (executive_id, workspace_id, company_id, record_json, updated_at)
       VALUES (@executiveId, @workspaceId, @companyId, @json, @updatedAt)
       ON CONFLICT(executive_id, workspace_id, company_id) DO UPDATE SET record_json = excluded.record_json, updated_at = excluded.updated_at`,
    ).run({
      executiveId: executive.executiveId,
      workspaceId,
      companyId,
      json: JSON.stringify(executive),
      updatedAt: new Date().toISOString(),
    });
  }

  saveSession(session: ExecutiveCouncilSession): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ec_council_sessions (session_id, workspace_id, company_id, record_json, started_at)
       VALUES (@sessionId, @workspaceId, @companyId, @json, @startedAt)`,
    ).run({
      sessionId: session.sessionId,
      workspaceId: session.workspaceId,
      companyId: session.companyId,
      json: JSON.stringify(session),
      startedAt: session.startedAt,
    });
  }

  getLatestSession(workspaceId: string, companyId: string): ExecutiveCouncilSession | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM ec_council_sessions
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY started_at DESC LIMIT 1`,
      )
      .get({ workspaceId, companyId }) as Record<string, unknown> | undefined;
    return row ? mapJson<ExecutiveCouncilSession>(row) : null;
  }

  listSessions(workspaceId: string, companyId: string, limit = 20): ExecutiveCouncilSession[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM ec_council_sessions
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY started_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, companyId, limit }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<ExecutiveCouncilSession>(r));
  }

  saveAccountability(record: ExecutiveAccountabilityRecord): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ec_accountability (record_id, workspace_id, company_id, executive_id, record_json, recorded_at)
       VALUES (@recordId, @workspaceId, @companyId, @executiveId, @json, @recordedAt)`,
    ).run({
      recordId: record.recordId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      executiveId: record.executiveId,
      json: JSON.stringify(record),
      recordedAt: record.recordedAt,
    });
  }

  listAccountability(workspaceId: string, companyId: string, executiveId?: string): ExecutiveAccountabilityRecord[] {
    const db = getDatabase();
    const rows = executiveId
      ? (db
          .prepare(
            `SELECT record_json FROM ec_accountability
             WHERE workspace_id = @workspaceId AND company_id = @companyId AND executive_id = @executiveId
             ORDER BY recorded_at DESC`,
          )
          .all({ workspaceId, companyId, executiveId }) as Record<string, unknown>[])
      : (db
          .prepare(
            `SELECT record_json FROM ec_accountability
             WHERE workspace_id = @workspaceId AND company_id = @companyId
             ORDER BY recorded_at DESC`,
          )
          .all({ workspaceId, companyId }) as Record<string, unknown>[]);
    return rows.map((r) => mapJson<ExecutiveAccountabilityRecord>(r));
  }

  saveMission(mission: ExecutiveGeneratedMission): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ec_generated_missions (mission_id, workspace_id, company_id, record_json, generated_at)
       VALUES (@missionId, @workspaceId, @companyId, @json, @generatedAt)`,
    ).run({
      missionId: mission.missionId,
      workspaceId: mission.workspaceId,
      companyId: mission.companyId,
      json: JSON.stringify(mission),
      generatedAt: mission.generatedAt,
    });
  }

  listMissions(workspaceId: string, companyId: string, limit = 50): ExecutiveGeneratedMission[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM ec_generated_missions
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY generated_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, companyId, limit }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<ExecutiveGeneratedMission>(r));
  }
}

let repository: ExecutiveCouncilRepository | null = null;

export function getExecutiveCouncilRepository(): ExecutiveCouncilRepository {
  if (!repository) repository = new ExecutiveCouncilRepository();
  return repository;
}

export function resetExecutiveCouncilRepository(): void {
  repository = null;
}
