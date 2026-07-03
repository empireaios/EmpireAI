/**
 * G6-07 — Cockpit Executive Operations backend contracts.
 */

import type {
  CockpitHealthSummary,
  ExecutiveActionSafetySummary,
  ExecutiveBlocker,
  ExecutiveOperationsOverview,
  ExecutiveResultState,
  ExecutiveOperationsScanResult,
  ExecutiveVisibilityEntry,
} from "./executive-operations-types.js";

export const COCKPIT_EXECUTIVE_OPERATIONS_VIEW_ID = "cockpit-executive-operations" as const;

export type CockpitExecutiveOperationsView = {
  viewId: typeof COCKPIT_EXECUTIVE_OPERATIONS_VIEW_ID;
  computedAt: string;
  dataMode: "live";
  executiveOperationsOverview: ExecutiveOperationsOverview;
  cockpitHealth: CockpitHealthSummary;
  executiveActionSafety: ExecutiveActionSafetySummary;
  approvalVisibility: boolean;
  automationVisibility: boolean;
  readinessVisibility: boolean;
  executiveReportsStatus: boolean;
  certificationStatus: ExecutiveResultState;
  executiveScore: number;
  recommendations: string[];
  blockers: ExecutiveBlocker[];
  visibility: ExecutiveVisibilityEntry[];
  lastScan?: Pick<ExecutiveOperationsScanResult, "scanId" | "status" | "executiveScore" | "scannedAt">;
  discoverySource: "production-certification:executive-operations-cockpit";
};

export function buildCockpitExecutiveOperationsView(input: {
  overview: ExecutiveOperationsOverview;
  scan?: ExecutiveOperationsScanResult;
}): CockpitExecutiveOperationsView {
  const scan = input.scan;
  const visibility = scan?.visibility ?? [];
  const hasSignal = (ref: string) => visibility.some((entry) => entry.signalRef === ref && entry.satisfied);
  return {
    viewId: COCKPIT_EXECUTIVE_OPERATIONS_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live",
    executiveOperationsOverview: input.overview,
    cockpitHealth: scan?.cockpitHealth ?? {
      executiveHomeReady: false,
      commandCentreReady: false,
      automationCentreReady: false,
      approvalQueueVisible: false,
    },
    executiveActionSafety: scan?.actionSafety ?? {
      actionSafe: false,
      approvalAuthorityVerified: false,
      visibilityAuthorityVerified: false,
    },
    approvalVisibility: hasSignal("signal:approval-visibility"),
    automationVisibility: hasSignal("signal:automation-visibility"),
    readinessVisibility: hasSignal("signal:readiness-visibility"),
    executiveReportsStatus: hasSignal("signal:executive-report"),
    certificationStatus: scan?.status ?? "warning",
    executiveScore: scan?.executiveScore ?? 0,
    recommendations: scan?.executiveRecommendations ?? [],
    blockers: scan?.blockers ?? [],
    visibility,
    lastScan: scan
      ? { scanId: scan.scanId, status: scan.status, executiveScore: scan.executiveScore, scannedAt: scan.scannedAt }
      : undefined,
    discoverySource: "production-certification:executive-operations-cockpit",
  };
}
