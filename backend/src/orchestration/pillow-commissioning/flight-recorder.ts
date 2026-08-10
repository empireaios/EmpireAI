/**
 * Pillow Flight Recorder — canonical durable executive activity ledger.
 * Business-level events only (not private chain-of-thought, not raw heartbeats).
 */

import { randomUUID } from "node:crypto";

import { getDatabase } from "../../brain/database.js";

export type FlightEventType =
  | "WAKE"
  | "OBSERVE"
  | "ANALYSE"
  | "PRIORITISE"
  | "PLAN"
  | "RECOMMEND"
  | "EXECUTE"
  | "VERIFY"
  | "FAIL"
  | "RECOVER"
  | "LEARN"
  | "MEMORY"
  | "APPROVAL_REQUEST"
  | "COST"
  | "COST_GUARD"
  | "COMMERCE_CYCLE"
  | "COMMISSIONING"
  | "BIRTH_GATE"
  | "NEXT_WORK"
  | "STATE_CHANGE";

export type FlightEvent = {
  eventId: string;
  workspaceId: string;
  recordedAt: string;
  eventType: FlightEventType;
  businessArea: string;
  subsystem: string;
  objective: string;
  observation: string | null;
  analysisSummary: string | null;
  evidenceConsidered: string[];
  decision: string | null;
  recommendation: string | null;
  actionAttempted: string | null;
  actionCompleted: string | null;
  actionFailed: string | null;
  reason: string | null;
  authority: "pillow" | "system" | "grand_king" | "cursor_build";
  approvalDependency: string | null;
  result: string | null;
  verification: string | null;
  lesson: string | null;
  memoryLink: string | null;
  attributableCostUsd: number | null;
  durationMs: number | null;
  nextAction: string | null;
  nextScheduledAt: string | null;
  evidenceRef: string | null;
  entityRefs: Record<string, string>;
};

export function ensureFlightRecorderTables(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS pillow_flight_recorder (
      event_id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      event_type TEXT NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pillow_flight_ws_time
      ON pillow_flight_recorder(workspace_id, recorded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_pillow_flight_type
      ON pillow_flight_recorder(workspace_id, event_type, recorded_at DESC);
  `);
}

export type FlightEventInput = {
  workspaceId: string;
  eventType: FlightEventType;
  businessArea: string;
  subsystem: string;
  objective: string;
  authority: FlightEvent["authority"];
  eventId?: string;
  recordedAt?: string;
  observation?: string | null;
  analysisSummary?: string | null;
  evidenceConsidered?: string[];
  decision?: string | null;
  recommendation?: string | null;
  actionAttempted?: string | null;
  actionCompleted?: string | null;
  actionFailed?: string | null;
  reason?: string | null;
  approvalDependency?: string | null;
  result?: string | null;
  verification?: string | null;
  lesson?: string | null;
  memoryLink?: string | null;
  attributableCostUsd?: number | null;
  durationMs?: number | null;
  nextAction?: string | null;
  nextScheduledAt?: string | null;
  evidenceRef?: string | null;
  entityRefs?: Record<string, string>;
};

export function recordFlightEvent(input: FlightEventInput): FlightEvent {
  ensureFlightRecorderTables();
  const event: FlightEvent = {
    eventId: input.eventId ?? randomUUID(),
    recordedAt: input.recordedAt ?? new Date().toISOString(),
    workspaceId: input.workspaceId,
    eventType: input.eventType,
    businessArea: input.businessArea,
    subsystem: input.subsystem,
    objective: input.objective,
    observation: input.observation ?? null,
    analysisSummary: input.analysisSummary ?? null,
    evidenceConsidered: input.evidenceConsidered ?? [],
    decision: input.decision ?? null,
    recommendation: input.recommendation ?? null,
    actionAttempted: input.actionAttempted ?? null,
    actionCompleted: input.actionCompleted ?? null,
    actionFailed: input.actionFailed ?? null,
    reason: input.reason ?? null,
    authority: input.authority,
    approvalDependency: input.approvalDependency ?? null,
    result: input.result ?? null,
    verification: input.verification ?? null,
    lesson: input.lesson ?? null,
    memoryLink: input.memoryLink ?? null,
    attributableCostUsd: input.attributableCostUsd ?? null,
    durationMs: input.durationMs ?? null,
    nextAction: input.nextAction ?? null,
    nextScheduledAt: input.nextScheduledAt ?? null,
    evidenceRef: input.evidenceRef ?? null,
    entityRefs: input.entityRefs ?? {},
  };
  const db = getDatabase();
  db.prepare(
    `INSERT INTO pillow_flight_recorder (event_id, workspace_id, recorded_at, event_type, record_json)
     VALUES (@eventId, @workspaceId, @recordedAt, @eventType, @json)`,
  ).run({
    eventId: event.eventId,
    workspaceId: event.workspaceId,
    recordedAt: event.recordedAt,
    eventType: event.eventType,
    json: JSON.stringify(event),
  });
  return event;
}

export function listFlightEvents(
  workspaceId: string,
  options?: { limit?: number; since?: string; eventType?: FlightEventType },
): FlightEvent[] {
  ensureFlightRecorderTables();
  const limit = Math.min(Math.max(options?.limit ?? 40, 1), 200);
  const db = getDatabase();
  let rows: Array<{ record_json: string }>;
  if (options?.since && options.eventType) {
    rows = db
      .prepare(
        `SELECT record_json FROM pillow_flight_recorder
         WHERE workspace_id = @workspaceId AND recorded_at >= @since AND event_type = @eventType
         ORDER BY recorded_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, since: options.since, eventType: options.eventType, limit }) as Array<{
      record_json: string;
    }>;
  } else if (options?.since) {
    rows = db
      .prepare(
        `SELECT record_json FROM pillow_flight_recorder
         WHERE workspace_id = @workspaceId AND recorded_at >= @since
         ORDER BY recorded_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, since: options.since, limit }) as Array<{ record_json: string }>;
  } else {
    rows = db
      .prepare(
        `SELECT record_json FROM pillow_flight_recorder
         WHERE workspace_id = @workspaceId
         ORDER BY recorded_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit }) as Array<{ record_json: string }>;
  }
  return rows.map((r) => JSON.parse(r.record_json) as FlightEvent);
}

export function getLatestFlightEvent(
  workspaceId: string,
  eventType?: FlightEventType,
): FlightEvent | null {
  const events = listFlightEvents(workspaceId, { limit: 1, eventType });
  return events[0] ?? null;
}

export function countFlightEventsSince(workspaceId: string, since: string): {
  total: number;
  byType: Record<string, number>;
} {
  ensureFlightRecorderTables();
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT event_type, COUNT(*) AS n FROM pillow_flight_recorder
       WHERE workspace_id = @workspaceId AND recorded_at >= @since
       GROUP BY event_type`,
    )
    .all({ workspaceId, since }) as Array<{ event_type: string; n: number }>;
  const byType: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    byType[row.event_type] = row.n;
    total += row.n;
  }
  return { total, byType };
}
