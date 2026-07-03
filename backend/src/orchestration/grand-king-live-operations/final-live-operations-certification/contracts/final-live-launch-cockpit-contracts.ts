/**
 * G7-10 — Cockpit final live launch backend contracts.
 */

import type {
  LiveLaunchOutcome,
  FinalLiveOperationsCertificationOverview,
  FinalLiveOperationsCertificationRecord,
  FinalLiveOperationsCertificationRunResult,
  FinalLiveLaunchBlocker,
  FinalLiveLaunchEvidence,
  FinalLiveLaunchRisk,
  GrandKingLaunchReadinessSummary,
} from "./final-live-operations-certification-types.js";

export const COCKPIT_VERSION1_LAUNCH_VIEW_ID = "cockpit-grand-king-version1-launch" as const;

export type CockpitVersion1LaunchView = {
  viewId: typeof COCKPIT_VERSION1_LAUNCH_VIEW_ID;
  computedAt: string;
  dataMode: "live-launch-certification";
  version1LaunchStatus: LiveLaunchOutcome;
  liveEligibility: boolean;
  grandKingReadiness: GrandKingLaunchReadinessSummary;
  launchChecklist: string[];
  launchRisks: FinalLiveLaunchRisk[];
  launchConditions: string[];
  operationalHealth: { overallEmpireHealth: number; validatedDomainCount: number; failedDomainCount: number };
  empireHealthScore: number;
  executiveLaunchSummary: string;
  launchBlockers: FinalLiveLaunchBlocker[];
  certificationEvidence: FinalLiveLaunchEvidence[];
  overview: FinalLiveOperationsCertificationOverview;
  lastRun?: Pick<FinalLiveOperationsCertificationRunResult, "runId" | "launchScore" | "scannedAt">;
  discoverySource: "grand-king-live-operations:version1-launch-cockpit";
  designLanguage: "g4-cockpit";
};

export function buildCockpitVersion1LaunchView(input: {
  overview: FinalLiveOperationsCertificationOverview;
  run?: FinalLiveOperationsCertificationRunResult;
  executiveSummary?: string;
}): CockpitVersion1LaunchView {
  const record: FinalLiveOperationsCertificationRecord | undefined = input.run?.record;
  return {
    viewId: COCKPIT_VERSION1_LAUNCH_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live-launch-certification",
    version1LaunchStatus: record?.launchStatus ?? "UNKNOWN",
    liveEligibility: record?.liveEligibility ?? false,
    grandKingReadiness: record?.grandKingReadiness ?? {
      ready: false,
      score: 0,
      blockers: [],
      conditions: [],
      programmeRefsValidated: [],
    },
    launchChecklist: record?.requiredActions ?? [],
    launchRisks: record?.risks ?? [],
    launchConditions: record?.conditions ?? [],
    operationalHealth: {
      overallEmpireHealth: record?.overallEmpireHealth ?? 0,
      validatedDomainCount: record?.validatedDomains.length ?? 0,
      failedDomainCount: record?.failedDomains.length ?? 0,
    },
    empireHealthScore: record?.overallEmpireHealth ?? 0,
    executiveLaunchSummary: input.executiveSummary ?? record?.launchDecision ?? "Awaiting live launch certification",
    launchBlockers: record?.blockers ?? [],
    certificationEvidence: record?.evidence ?? [],
    overview: input.overview,
    lastRun: input.run
      ? { runId: input.run.runId, launchScore: input.run.launchScore, scannedAt: input.run.scannedAt }
      : undefined,
    discoverySource: "grand-king-live-operations:version1-launch-cockpit",
    designLanguage: "g4-cockpit",
  };
}
