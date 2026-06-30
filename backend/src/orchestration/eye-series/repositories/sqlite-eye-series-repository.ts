import { createHash, randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type {
  EmpireObservation,
  EyeId,
  EyeIntelligenceReport,
  InvestigationRecord,
} from "../models/eye-series.js";

let repositoryInstance: SqliteEyeSeriesRepository | null = null;

export function getEyeSeriesRepository(): SqliteEyeSeriesRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteEyeSeriesRepository();
  }
  return repositoryInstance;
}

export function resetEyeSeriesRepository(): void {
  repositoryInstance = null;
}

export function buildObservationDedupHash(
  eyeId: EyeId,
  workspaceId: string,
  observation: string,
  source: string,
): string {
  return createHash("sha256")
    .update(`${eyeId}:${workspaceId}:${observation}:${source}`)
    .digest("hex");
}

export class SqliteEyeSeriesRepository {
  saveObservation(observation: EmpireObservation): EmpireObservation | null {
    const db = getDatabase();
    const existing = db
      .prepare(`SELECT observation_id FROM empire_knowledge_graph WHERE dedup_hash = @dedupHash`)
      .get({ dedupHash: observation.dedupHash }) as { observation_id: string } | undefined;
    if (existing) return null;

    db.prepare(
      `INSERT INTO empire_knowledge_graph
        (observation_id, eye_id, workspace_id, company_id, record_json, dedup_hash, observed_at)
       VALUES
        (@observationId, @eyeId, @workspaceId, @companyId, @recordJson, @dedupHash, @observedAt)`,
    ).run({
      observationId: observation.observationId,
      eyeId: observation.eyeId,
      workspaceId: observation.workspaceId,
      companyId: observation.companyId ?? null,
      recordJson: JSON.stringify(observation),
      dedupHash: observation.dedupHash,
      observedAt: observation.timestamp,
    });
    return observation;
  }

  getObservation(observationId: string): EmpireObservation | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM empire_knowledge_graph WHERE observation_id = @observationId`)
      .get({ observationId });
    return row ? (JSON.parse(String((row as { record_json: string }).record_json)) as EmpireObservation) : null;
  }

  listObservations(
    workspaceId: string,
    filters?: { eyeId?: EyeId; search?: string; limit?: number },
  ): EmpireObservation[] {
    const db = getDatabase();
    let query = `SELECT record_json FROM empire_knowledge_graph WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (filters?.eyeId) {
      query += ` AND eye_id = @eyeId`;
      params.eyeId = filters.eyeId;
    }
    query += ` ORDER BY observed_at DESC LIMIT @limit`;
    params.limit = filters?.limit ?? 100;
    const rows = db.prepare(query).all(params) as { record_json: string }[];
    let results = rows.map((row) => JSON.parse(row.record_json) as EmpireObservation);
    if (filters?.search) {
      const term = filters.search.toLowerCase();
      results = results.filter(
        (o) =>
          o.observation.toLowerCase().includes(term) ||
          o.source.toLowerCase().includes(term),
      );
    }
    return results;
  }

  countObservations(workspaceId: string, eyeId?: EyeId): number {
    const db = getDatabase();
    let query = `SELECT COUNT(*) as count FROM empire_knowledge_graph WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (eyeId) {
      query += ` AND eye_id = @eyeId`;
      params.eyeId = eyeId;
    }
    return (db.prepare(query).get(params) as { count: number }).count;
  }

  saveReport(report: EyeIntelligenceReport): EyeIntelligenceReport {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO eye_series_reports
        (report_id, eye_id, workspace_id, company_id, record_json, created_at)
       VALUES
        (@reportId, @eyeId, @workspaceId, @companyId, @recordJson, @createdAt)
       ON CONFLICT(report_id) DO UPDATE SET record_json = excluded.record_json`,
    ).run({
      reportId: report.reportId,
      eyeId: report.eyeId,
      workspaceId: report.workspaceId,
      companyId: report.companyId ?? null,
      recordJson: JSON.stringify(report),
      createdAt: report.createdAt,
    });
    return report;
  }

  getReport(reportId: string): EyeIntelligenceReport | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT record_json FROM eye_series_reports WHERE report_id = @reportId`)
      .get({ reportId });
    return row ? (JSON.parse(String((row as { record_json: string }).record_json)) as EyeIntelligenceReport) : null;
  }

  listReports(workspaceId: string, eyeId?: EyeId, limit = 50): EyeIntelligenceReport[] {
    const db = getDatabase();
    let query = `SELECT record_json FROM eye_series_reports WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId, limit };
    if (eyeId) {
      query += ` AND eye_id = @eyeId`;
      params.eyeId = eyeId;
    }
    query += ` ORDER BY created_at DESC LIMIT @limit`;
    const rows = db.prepare(query).all(params) as { record_json: string }[];
    return rows.map((row) => JSON.parse(row.record_json) as EyeIntelligenceReport);
  }

  saveInvestigation(record: InvestigationRecord): InvestigationRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO eye_series_investigations
        (investigation_id, eye_id, workspace_id, record_json, created_at)
       VALUES
        (@investigationId, @eyeId, @workspaceId, @recordJson, @createdAt)
       ON CONFLICT(investigation_id) DO UPDATE SET record_json = excluded.record_json`,
    ).run({
      investigationId: record.investigationId,
      eyeId: record.eyeId,
      workspaceId: record.workspaceId,
      recordJson: JSON.stringify(record),
      createdAt: record.createdAt,
    });
    return record;
  }

  listInvestigations(workspaceId: string, eyeId?: EyeId, limit = 50): InvestigationRecord[] {
    const db = getDatabase();
    let query = `SELECT record_json FROM eye_series_investigations WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId, limit };
    if (eyeId) {
      query += ` AND eye_id = @eyeId`;
      params.eyeId = eyeId;
    }
    query += ` ORDER BY created_at DESC LIMIT @limit`;
    const rows = db.prepare(query).all(params) as { record_json: string }[];
    return rows.map((row) => JSON.parse(row.record_json) as InvestigationRecord);
  }
}

export function recordObservation(input: Omit<EmpireObservation, "observationId" | "dedupHash" | "observationOnly">): EmpireObservation | null {
  const dedupHash = buildObservationDedupHash(input.eyeId, input.workspaceId, input.observation, input.source);
  return getEyeSeriesRepository().saveObservation({
    ...input,
    observationId: `obs-${randomUUID()}`,
    dedupHash,
    observationOnly: true,
  });
}
