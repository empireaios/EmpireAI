/**
 * Since-your-last-visit executive brief — persisted visit clock + delta counts.
 */

import { getDatabase } from "../../brain/database.js";
import { buildSmartViableKpiSnapshot } from "../pillow-commerce-presale/smart-viable-kpi.js";
import { getPillowCommercePresaleRepository } from "../pillow-commerce-presale/repository/sqlite-pillow-commerce-presale-repository.js";
import { buildCostGuardStatus } from "./cost-guard.js";
import { countFlightEventsSince, listFlightEvents } from "./flight-recorder.js";
import { buildPillowOperatingState } from "./operating-state.js";

export type SinceLastVisitBrief = {
  computedAt: string;
  lastVisitAt: string | null;
  previousVisitAt: string | null;
  windowStart: string;
  discovered: number;
  analysed: number;
  rejected: number;
  progressed: number;
  approvalsRequested: number;
  purchasesMade: number;
  aiApiCostIncurredUsd: number;
  currentFocus: string;
  latestMeaningfulActions: Array<{ at: string; type: string; summary: string }>;
  nextWork: string | null;
  nextWorkAt: string | null;
  needsGrandKing: boolean;
  needsGrandKingReason: string | null;
  operatingState: string;
  notes: string[];
};

export function ensureVisitTables(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS pillow_founder_visits (
      workspace_id TEXT PRIMARY KEY,
      last_visit_at TEXT NOT NULL,
      previous_visit_at TEXT,
      updated_at TEXT NOT NULL
    );
  `);
}

export function touchFounderVisit(workspaceId: string): {
  lastVisitAt: string;
  previousVisitAt: string | null;
} {
  ensureVisitTables();
  const db = getDatabase();
  const now = new Date().toISOString();
  const row = db
    .prepare(`SELECT last_visit_at, previous_visit_at FROM pillow_founder_visits WHERE workspace_id = @workspaceId`)
    .get({ workspaceId }) as { last_visit_at: string; previous_visit_at: string | null } | undefined;

  if (!row) {
    db.prepare(
      `INSERT INTO pillow_founder_visits (workspace_id, last_visit_at, previous_visit_at, updated_at)
       VALUES (@workspaceId, @now, NULL, @now)`,
    ).run({ workspaceId, now });
    return { lastVisitAt: now, previousVisitAt: null };
  }

  db.prepare(
    `UPDATE pillow_founder_visits
     SET previous_visit_at = @prev, last_visit_at = @now, updated_at = @now
     WHERE workspace_id = @workspaceId`,
  ).run({ workspaceId, prev: row.last_visit_at, now });
  return { lastVisitAt: now, previousVisitAt: row.last_visit_at };
}

export function getVisitClock(workspaceId: string): {
  lastVisitAt: string | null;
  previousVisitAt: string | null;
} {
  ensureVisitTables();
  const db = getDatabase();
  const row = db
    .prepare(`SELECT last_visit_at, previous_visit_at FROM pillow_founder_visits WHERE workspace_id = @workspaceId`)
    .get({ workspaceId }) as { last_visit_at: string; previous_visit_at: string | null } | undefined;
  return {
    lastVisitAt: row?.last_visit_at ?? null,
    previousVisitAt: row?.previous_visit_at ?? null,
  };
}

export function buildSinceLastVisitBrief(
  workspaceId: string,
  options?: { recordVisit?: boolean },
): SinceLastVisitBrief {
  const clock = options?.recordVisit
    ? touchFounderVisit(workspaceId)
    : getVisitClock(workspaceId);

  // Delta window = previous visit when available; else last 24h (honest note).
  const windowStart =
    clock.previousVisitAt ??
    clock.lastVisitAt ??
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const usedFallbackWindow = !clock.previousVisitAt && !clock.lastVisitAt;

  const counts = countFlightEventsSince(workspaceId, windowStart);
  const events = listFlightEvents(workspaceId, { limit: 12, since: windowStart });
  const op = buildPillowOperatingState(workspaceId);
  const kpi = buildSmartViableKpiSnapshot(workspaceId);
  const cost = buildCostGuardStatus(workspaceId);
  const pending = getPillowCommercePresaleRepository().getPendingApprovalOpportunity(workspaceId);

  const aiCost = cost.spend.dailyAi.actualUsd + cost.spend.autonomousPaid.actualUsd;

  return {
    computedAt: new Date().toISOString(),
    lastVisitAt: clock.lastVisitAt,
    previousVisitAt: clock.previousVisitAt,
    windowStart,
    discovered: counts.byType.COMMERCE_CYCLE ?? counts.byType.OBSERVE ?? 0,
    analysed: (counts.byType.ANALYSE ?? 0) + (counts.byType.COMMERCE_CYCLE ?? 0),
    rejected: kpi.rejected,
    progressed: counts.byType.COMMISSIONING ?? counts.byType.EXECUTE ?? 0,
    approvalsRequested: counts.byType.APPROVAL_REQUEST ?? (pending ? 1 : 0),
    purchasesMade: 0,
    aiApiCostIncurredUsd: Number(aiCost.toFixed(4)),
    currentFocus: op.currentFocus,
    latestMeaningfulActions: events.slice(0, 8).map((e) => ({
      at: e.recordedAt,
      type: e.eventType,
      summary:
        e.analysisSummary ||
        e.decision ||
        e.result ||
        e.objective ||
        e.eventType,
    })),
    nextWork: op.currentFocus,
    nextWorkAt: op.nextScheduledCycleAt,
    needsGrandKing: op.needsGrandKing,
    needsGrandKingReason: op.needsGrandKingReason,
    operatingState: op.state,
    notes: [
      usedFallbackWindow
        ? "No prior visit recorded — window defaults to last 24 hours until Grand King opens Executive Home."
        : "Delta anchored to previous Grand King visit timestamp.",
      "Purchases remain 0 until authorised supplier spend occurs.",
      `SMART viable progress ${kpi.smartViable}/1000 (pipeline evidence, not birth).`,
    ],
  };
}
