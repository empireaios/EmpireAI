/**
 * G7-00 — Cockpit Grand King Live Operations backend contracts.
 */

import type {
  LiveOperation,
  LiveOperationBlocker,
  LiveOperationEvidence,
  LiveOperationRisk,
  LiveOperationsOverview,
  LiveOperationRun,
} from "./live-operations-types.js";

export const COCKPIT_LIVE_OPERATIONS_VIEW_ID = "cockpit-grand-king-live-operations" as const;

export type CockpitLiveOperationsView = {
  viewId: typeof COCKPIT_LIVE_OPERATIONS_VIEW_ID;
  computedAt: string;
  dataMode: "live";
  liveOperationsOverview: LiveOperationsOverview;
  liveOperationStatus: LiveOperation[];
  liveRisks: LiveOperationRisk[];
  liveEvidence: LiveOperationEvidence[];
  liveNextAction: string[];
  incidentSummary: {
    incidentCount: number;
    degradedCount: number;
    blockedCount: number;
  };
  discoverySource: "grand-king-live-operations:cockpit";
};

export function buildCockpitLiveOperationsView(input: {
  overview: LiveOperationsOverview;
  run?: LiveOperationRun;
  nextActions?: string[];
}): CockpitLiveOperationsView {
  const operations = input.run?.operations ?? [];
  return {
    viewId: COCKPIT_LIVE_OPERATIONS_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live",
    liveOperationsOverview: input.overview,
    liveOperationStatus: operations,
    liveRisks: operations.flatMap((op) => op.risks),
    liveEvidence: operations.flatMap((op) => op.evidence),
    liveNextAction: input.nextActions ?? [],
    incidentSummary: {
      incidentCount: operations.filter((op) => op.status === "incident").length,
      degradedCount: operations.filter((op) => op.status === "degraded").length,
      blockedCount: operations.filter((op) => op.status === "blocked").length,
    },
    discoverySource: "grand-king-live-operations:cockpit",
  };
}
