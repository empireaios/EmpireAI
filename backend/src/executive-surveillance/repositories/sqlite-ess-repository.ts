import type { ExecutiveSignal, ExecutiveObservation, ExecutiveSurveillanceMission, ExecutiveAlert } from "../models/surveillance-core.js";
import type { ExecutiveWatcher } from "../models/surveillance-core.js";
import type { ObservationHistoryRecord } from "../models/observation-history.js";
import { getDatabase } from "../../brain/database.js";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row["record_json"])) as T;
}

export class ExecutiveSurveillanceRepository {
  ensureWatchers(workspaceId: string, companyId: string, watchers: ExecutiveWatcher[]): void {
    const db = getDatabase();
    const stmt = db.prepare(
      `INSERT INTO ess_watchers (watcher_id, workspace_id, company_id, record_json, updated_at)
       VALUES (@watcherId, @workspaceId, @companyId, @json, @updatedAt)
       ON CONFLICT(watcher_id, workspace_id, company_id) DO NOTHING`,
    );
    for (const w of watchers) {
      stmt.run({ watcherId: w.watcherId, workspaceId, companyId, json: JSON.stringify(w), updatedAt: new Date().toISOString() });
    }
  }

  listWatchers(workspaceId: string, companyId: string): ExecutiveWatcher[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT record_json FROM ess_watchers WHERE workspace_id = @workspaceId AND company_id = @companyId`).all({ workspaceId, companyId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<ExecutiveWatcher>(r));
  }

  saveWatcher(workspaceId: string, companyId: string, watcher: ExecutiveWatcher): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ess_watchers (watcher_id, workspace_id, company_id, record_json, updated_at)
       VALUES (@watcherId, @workspaceId, @companyId, @json, @updatedAt)
       ON CONFLICT(watcher_id, workspace_id, company_id) DO UPDATE SET record_json = excluded.record_json, updated_at = excluded.updated_at`,
    ).run({ watcherId: watcher.watcherId, workspaceId, companyId, json: JSON.stringify(watcher), updatedAt: new Date().toISOString() });
  }

  saveObservation(observation: ExecutiveObservation, workspaceId: string, companyId: string): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ess_observations (observation_id, workspace_id, company_id, record_json, observed_at)
       VALUES (@observationId, @workspaceId, @companyId, @json, @observedAt)`,
    ).run({ observationId: observation.observationId, workspaceId, companyId, json: JSON.stringify(observation), observedAt: observation.observedAt });
  }

  saveSignal(signal: ExecutiveSignal, workspaceId: string, companyId: string): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ess_signals (signal_id, workspace_id, company_id, record_json, emitted_at)
       VALUES (@signalId, @workspaceId, @companyId, @json, @emittedAt)`,
    ).run({ signalId: signal.signalId, workspaceId, companyId, json: JSON.stringify(signal), emittedAt: signal.emittedAt });
  }

  listSignals(workspaceId: string, companyId: string, limit = 100): ExecutiveSignal[] {
    const db = getDatabase();
    const rows = db.prepare(
      `SELECT record_json FROM ess_signals WHERE workspace_id = @workspaceId AND company_id = @companyId ORDER BY emitted_at DESC LIMIT @limit`,
    ).all({ workspaceId, companyId, limit }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<ExecutiveSignal>(r));
  }

  saveMission(mission: ExecutiveSurveillanceMission, workspaceId: string, companyId: string): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ess_missions (mission_id, workspace_id, company_id, record_json, generated_at)
       VALUES (@missionId, @workspaceId, @companyId, @json, @generatedAt)`,
    ).run({ missionId: mission.missionId, workspaceId, companyId, json: JSON.stringify(mission), generatedAt: mission.generatedAt });
  }

  listMissions(workspaceId: string, companyId: string, limit = 100): ExecutiveSurveillanceMission[] {
    const db = getDatabase();
    const rows = db.prepare(
      `SELECT record_json FROM ess_missions WHERE workspace_id = @workspaceId AND company_id = @companyId ORDER BY generated_at DESC LIMIT @limit`,
    ).all({ workspaceId, companyId, limit }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<ExecutiveSurveillanceMission>(r));
  }

  saveHistory(record: ObservationHistoryRecord): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO ess_observation_history (record_id, workspace_id, company_id, record_json, recorded_at)
       VALUES (@recordId, @workspaceId, @companyId, @json, @recordedAt)`,
    ).run({ recordId: record.recordId, workspaceId: record.workspaceId, companyId: record.companyId, json: JSON.stringify(record), recordedAt: record.recordedAt });
  }

  listHistory(workspaceId: string, companyId: string, limit = 50): ObservationHistoryRecord[] {
    const db = getDatabase();
    const rows = db.prepare(
      `SELECT record_json FROM ess_observation_history WHERE workspace_id = @workspaceId AND company_id = @companyId ORDER BY recorded_at DESC LIMIT @limit`,
    ).all({ workspaceId, companyId, limit }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<ObservationHistoryRecord>(r));
  }
}

let repository: ExecutiveSurveillanceRepository | null = null;

export function getExecutiveSurveillanceRepository(): ExecutiveSurveillanceRepository {
  if (!repository) repository = new ExecutiveSurveillanceRepository();
  return repository;
}

export function resetExecutiveSurveillanceRepository(): void {
  repository = null;
}
