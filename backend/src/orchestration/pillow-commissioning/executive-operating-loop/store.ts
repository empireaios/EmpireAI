/**
 * Durable SQLite store for executive cycles, outcomes, and current objective.
 */

import { getDatabase } from "../../../brain/database.js";
import type { ExecutiveCycleRecord, OutcomeRecord } from "./types.js";

export function ensureExecutiveOperatingLoopTables(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS pillow_executive_cycles (
      cycle_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      state_fingerprint TEXT NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pillow_executive_cycles_ws
      ON pillow_executive_cycles(workspace_id, completed_at);

    CREATE TABLE IF NOT EXISTS pillow_executive_outcomes (
      outcome_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      initiative_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pillow_executive_outcomes_ws
      ON pillow_executive_outcomes(workspace_id, updated_at);

    CREATE TABLE IF NOT EXISTS pillow_executive_objective (
      workspace_id TEXT PRIMARY KEY,
      objective_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pillow_capability_test_runs (
      run_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      record_json TEXT NOT NULL
    );
  `);
}

export function persistExecutiveCycle(record: ExecutiveCycleRecord): void {
  ensureExecutiveOperatingLoopTables();
  const db = getDatabase();
  db.prepare(
    `INSERT OR REPLACE INTO pillow_executive_cycles
      (cycle_id, workspace_id, mode, started_at, completed_at, state_fingerprint, record_json)
     VALUES (@cycleId, @workspaceId, @mode, @startedAt, @completedAt, @stateFingerprint, @recordJson)`,
  ).run({
    cycleId: record.cycleId,
    workspaceId: record.workspaceId,
    mode: record.mode,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    stateFingerprint: record.stateFingerprint,
    recordJson: JSON.stringify(record),
  });
}

export function listExecutiveCycles(
  workspaceId: string,
  limit = 20,
): ExecutiveCycleRecord[] {
  ensureExecutiveOperatingLoopTables();
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT record_json FROM pillow_executive_cycles
       WHERE workspace_id = @workspaceId
       ORDER BY completed_at DESC LIMIT @limit`,
    )
    .all({ workspaceId, limit }) as Array<{ record_json: string }>;
  return rows.map((r) => JSON.parse(r.record_json) as ExecutiveCycleRecord);
}

export function getLatestExecutiveCycle(
  workspaceId: string,
): ExecutiveCycleRecord | null {
  return listExecutiveCycles(workspaceId, 1)[0] ?? null;
}

export function persistOutcome(record: OutcomeRecord): void {
  ensureExecutiveOperatingLoopTables();
  const db = getDatabase();
  db.prepare(
    `INSERT OR REPLACE INTO pillow_executive_outcomes
      (outcome_id, workspace_id, initiative_id, status, created_at, updated_at, record_json)
     VALUES (@outcomeId, @workspaceId, @initiativeId, @status, @createdAt, @updatedAt, @recordJson)`,
  ).run({
    outcomeId: record.id,
    workspaceId: record.workspaceId,
    initiativeId: record.initiativeId,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    recordJson: JSON.stringify(record),
  });
}

export function listOutcomes(workspaceId: string, limit = 50): OutcomeRecord[] {
  ensureExecutiveOperatingLoopTables();
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT record_json FROM pillow_executive_outcomes
       WHERE workspace_id = @workspaceId
       ORDER BY updated_at DESC LIMIT @limit`,
    )
    .all({ workspaceId, limit }) as Array<{ record_json: string }>;
  return rows.map((r) => JSON.parse(r.record_json) as OutcomeRecord);
}

export type CurrentObjective = {
  workspaceId: string;
  objective: string;
  currentInitiativeId: string | null;
  lastCycleId: string | null;
  lastDisposition: string | null;
  pendingEscalation: boolean;
  updatedAt: string;
};

export function setCurrentObjective(objective: CurrentObjective): void {
  ensureExecutiveOperatingLoopTables();
  const db = getDatabase();
  db.prepare(
    `INSERT OR REPLACE INTO pillow_executive_objective
      (workspace_id, objective_json, updated_at)
     VALUES (@workspaceId, @objectiveJson, @updatedAt)`,
  ).run({
    workspaceId: objective.workspaceId,
    objectiveJson: JSON.stringify(objective),
    updatedAt: objective.updatedAt,
  });
}

export function getCurrentObjective(workspaceId: string): CurrentObjective | null {
  ensureExecutiveOperatingLoopTables();
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT objective_json FROM pillow_executive_objective WHERE workspace_id = @workspaceId`,
    )
    .get({ workspaceId }) as { objective_json: string } | undefined;
  return row ? (JSON.parse(row.objective_json) as CurrentObjective) : null;
}

export function persistCapabilityTestRun(run: {
  runId: string;
  workspaceId: string;
  completedAt: string;
  record: unknown;
}): void {
  ensureExecutiveOperatingLoopTables();
  const db = getDatabase();
  db.prepare(
    `INSERT OR REPLACE INTO pillow_capability_test_runs
      (run_id, workspace_id, completed_at, record_json)
     VALUES (@runId, @workspaceId, @completedAt, @recordJson)`,
  ).run({
    runId: run.runId,
    workspaceId: run.workspaceId,
    completedAt: run.completedAt,
    recordJson: JSON.stringify(run.record),
  });
}

export function getLatestCapabilityTestRun(workspaceId: string): unknown | null {
  ensureExecutiveOperatingLoopTables();
  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT record_json FROM pillow_capability_test_runs
       WHERE workspace_id = @workspaceId
       ORDER BY completed_at DESC LIMIT 1`,
    )
    .get({ workspaceId }) as { record_json: string } | undefined;
  return row ? JSON.parse(row.record_json) : null;
}
