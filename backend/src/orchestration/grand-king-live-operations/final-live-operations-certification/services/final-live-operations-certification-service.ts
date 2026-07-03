/**
 * G7-10 — Final live operations certification service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  LiveLaunchOutcome,
  FinalLiveOperationsCertificationOverview,
  FinalLiveOperationsCertificationRecord,
  FinalLiveOperationsCertificationRunResult,
} from "../contracts/final-live-operations-certification-types.js";
import {
  FINAL_LIVE_OPERATIONS_CERTIFICATION_VERSION,
  G7_MISSION_AUDIT_REFS,
} from "../contracts/final-live-operations-certification-types.js";
import { recordFinalLiveLaunchEklsObservation } from "../ekls/final-live-launch-ekls-integration.js";
import { validateFinalLiveLaunchPillowGovernance } from "../governance/final-live-launch-pillow-governance.js";
import { resolveFinalLiveCertificationRules } from "../registry/final-live-certification-registry-resolver.js";
import {
  aggregateFinalLiveCertificationDomains,
  computeLiveLaunchScore,
  deriveLiveLaunchOutcome,
} from "./final-live-certification-aggregator.js";
import { evaluateGrandKingLaunchReadiness } from "./grand-king-launch-readiness-evaluator.js";
import { evaluateLaunchEligibility } from "./launch-eligibility-engine.js";
import { evaluateEmpireHealthForLaunch } from "./empire-health-evaluator.js";

let lastRun: FinalLiveOperationsCertificationRunResult | undefined;

export function getFinalLiveOperationsCertificationOverview(
  context: RegistryLoaderContext = {},
): FinalLiveOperationsCertificationOverview {
  const rules = resolveFinalLiveCertificationRules(context);
  return {
    frameworkVersion: FINAL_LIVE_OPERATIONS_CERTIFICATION_VERSION,
    domainRuleCount: rules.length,
    missionAuditCount: G7_MISSION_AUDIT_REFS.length,
    lastRunId: lastRun?.runId,
    lastLaunchStatus: lastRun?.record.launchStatus,
    generatedAt: new Date().toISOString(),
  };
}

export function getLastFinalLiveOperationsCertificationRun(): FinalLiveOperationsCertificationRunResult | undefined {
  return lastRun;
}

export function resetFinalLiveOperationsCertificationStateForTests(): void {
  lastRun = undefined;
}

function buildLaunchDecision(outcome: LiveLaunchOutcome): string {
  switch (outcome) {
    case "LIVE_READY":
      return "Authorise EmpireAI Version 1 for Grand King production operation";
    case "LIVE_READY_WITH_CONDITIONS":
      return "Authorise Version 1 launch with documented conditions";
    case "LIVE_BLOCKED":
      return "Version 1 launch blocked — resolve critical blockers";
    case "LIVE_FAILED":
      return "Version 1 launch failed — re-certify failed domains";
    default:
      return "Launch decision unknown — complete certification";
  }
}

function buildReports(record: FinalLiveOperationsCertificationRecord, launchScore: number) {
  const passed = record.validatedDomains.filter((d) => d.status === "pass" || d.status === "pass_with_conditions").length;
  return {
    version1LaunchReport: `G7 Version 1 Launch: ${record.launchStatus} (score ${launchScore})`,
    liveOperationsSummary: `G7 Live Operations programme complete: ${passed}/${record.validatedDomains.length} domains validated`,
    operationalRiskRegister: record.risks,
    operationalConditionsRegister: record.conditions,
    launchChecklist: record.requiredActions,
    empireHealthReport: `Empire health score: ${record.overallEmpireHealth}`,
  };
}

function recordOutcomeEkls(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  runId: string;
  outcome: LiveLaunchOutcome;
}): void {
  const base = {
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    runId: input.runId,
    pillowGovernance: true as const,
  };
  recordFinalLiveLaunchEklsObservation({ ...base, kind: "live_launch_completed", summary: `Live launch certification completed: ${input.outcome}` });
  switch (input.outcome) {
    case "LIVE_READY":
      recordFinalLiveLaunchEklsObservation({ ...base, kind: "version1_launched", summary: "EmpireAI Version 1 launch authorised" });
      recordFinalLiveLaunchEklsObservation({ ...base, kind: "grand_king_launch_certified", summary: "Grand King launch certified" });
      break;
    case "LIVE_READY_WITH_CONDITIONS":
      recordFinalLiveLaunchEklsObservation({ ...base, kind: "grand_king_launch_certified", summary: "Grand King launch certified with conditions" });
      break;
    case "LIVE_BLOCKED":
      recordFinalLiveLaunchEklsObservation({ ...base, kind: "launch_blocked", summary: "Version 1 launch blocked" });
      break;
    case "LIVE_FAILED":
      recordFinalLiveLaunchEklsObservation({ ...base, kind: "launch_failed", summary: "Version 1 launch certification failed" });
      break;
    default:
      break;
  }
  recordFinalLiveLaunchEklsObservation({ ...base, kind: "operational_learning_recorded", summary: "Operational learning baseline recorded for live launch" });
}

export async function runLiveLaunchCertification(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  ownerId: string;
  workspaceId: string;
  pillowGovernance: true;
}): Promise<FinalLiveOperationsCertificationRunResult> {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const governance = validateFinalLiveLaunchPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "run_launch",
    pillowGovernance: true,
  });

  const runId = randomUUID();
  const correlationId = randomUUID();
  const now = new Date().toISOString();
  const governanceState = governance.allowed ? "pillow-approved" : "pillow-blocked";

  recordFinalLiveLaunchEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    runId,
    kind: "live_launch_started",
    summary: "Grand King live launch certification started",
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const blockedRecord: FinalLiveOperationsCertificationRecord = {
      certificationId: runId,
      programmeId: "G7",
      workspaceId: input.workspaceId,
      launchStatus: "LIVE_BLOCKED",
      liveEligibility: false,
      conditions: [governance.reason],
      blockers: [{
        blockerId: "pillow-blocked",
        domainId: "production_governance",
        domainLabel: "Pillow Governance",
        severity: "critical",
        message: governance.reason,
      }],
      risks: [],
      evidence: [],
      recommendations: ["Resolve Pillow governance before live launch certification"],
      validatedDomains: [],
      failedDomains: [],
      warningDomains: [],
      requiredActions: ["Enable Pillow governance"],
      optionalActions: [],
      overallEmpireHealth: 0,
      launchDecision: buildLaunchDecision("LIVE_BLOCKED"),
      createdAt: now,
      completedAt: now,
      correlationId,
      governanceState,
      grandKingReadiness: {
        ready: false,
        score: 0,
        blockers: [],
        conditions: [governance.reason],
        programmeRefsValidated: [],
      },
    };
    const result: FinalLiveOperationsCertificationRunResult = {
      runId,
      correlationId,
      record: blockedRecord,
      launchScore: 0,
      scannedAt: now,
      discoverySource: "REG-LIVE-OPERATIONS-FINAL-CERTIFICATION",
      reports: buildReports(blockedRecord, 0),
    };
    lastRun = result;
    recordOutcomeEkls({ actorId: input.actorId, workspaceId: input.workspaceId, ownerId: input.ownerId, runId, outcome: "LIVE_BLOCKED" });
    return result;
  }

  const rules = resolveFinalLiveCertificationRules(context);
  const aggregated = await aggregateFinalLiveCertificationDomains({
    rules,
    context,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
  });

  const launchScore = computeLiveLaunchScore(aggregated.validatedDomains);
  const eligibility = evaluateLaunchEligibility({
    validatedDomains: aggregated.validatedDomains,
    blockers: aggregated.blockers,
  });

  const grandKingReadiness = evaluateGrandKingLaunchReadiness({
    validatedDomains: aggregated.validatedDomains,
    blockers: aggregated.blockers,
    liveEligible: eligibility.eligible,
    launchScore,
  });

  const launchStatus = deriveLiveLaunchOutcome(
    aggregated.validatedDomains,
    grandKingReadiness.blockers,
    eligibility.eligible,
  );

  const overallEmpireHealth = await evaluateEmpireHealthForLaunch({
    validatedDomains: aggregated.validatedDomains,
    context,
  });

  const failedDomains = aggregated.validatedDomains
    .filter((d) => d.status === "fail" || d.status === "blocked")
    .map((d) => d.domainId);
  const warningDomains = aggregated.validatedDomains
    .filter((d) => d.status === "warning" || d.status === "pass_with_conditions")
    .map((d) => d.domainId);

  const recommendations = [
    ...eligibility.requiredActions,
    ...(launchStatus === "LIVE_READY" ? ["EmpireAI Version 1 authorised for Grand King production operation"] : []),
    ...(launchStatus === "LIVE_READY_WITH_CONDITIONS" ? ["Review launch conditions before full production operation"] : []),
  ];

  const record: FinalLiveOperationsCertificationRecord = {
    certificationId: runId,
    programmeId: "G7",
    workspaceId: input.workspaceId,
    launchStatus,
    liveEligibility: eligibility.eligible && launchStatus !== "LIVE_BLOCKED" && launchStatus !== "LIVE_FAILED",
    conditions: [...eligibility.conditions, ...grandKingReadiness.conditions],
    blockers: grandKingReadiness.blockers,
    risks: aggregated.risks,
    evidence: aggregated.evidence,
    recommendations,
    validatedDomains: aggregated.validatedDomains,
    failedDomains,
    warningDomains,
    requiredActions: eligibility.requiredActions,
    optionalActions: eligibility.conditions.length > 0 ? ["Monitor conditional domains post-launch"] : [],
    overallEmpireHealth,
    launchDecision: buildLaunchDecision(launchStatus),
    createdAt: now,
    completedAt: now,
    correlationId,
    governanceState,
    grandKingReadiness,
  };

  const result: FinalLiveOperationsCertificationRunResult = {
    runId,
    correlationId,
    record,
    launchScore,
    scannedAt: now,
    discoverySource: "REG-LIVE-OPERATIONS-FINAL-CERTIFICATION",
    reports: buildReports(record, launchScore),
  };

  lastRun = result;
  recordOutcomeEkls({ actorId: input.actorId, workspaceId: input.workspaceId, ownerId: input.ownerId, runId, outcome: launchStatus });
  return result;
}

export function getLiveLaunchStatus(context: RegistryLoaderContext = {}): {
  launchStatus: LiveLaunchOutcome;
  liveEligibility: boolean;
  conditions: string[];
} {
  const run = lastRun;
  if (!run) {
    return { launchStatus: "UNKNOWN", liveEligibility: false, conditions: ["No live launch certification run recorded"] };
  }
  return {
    launchStatus: run.record.launchStatus,
    liveEligibility: run.record.liveEligibility,
    conditions: run.record.conditions,
  };
}

export function getLaunchBlockers() {
  return lastRun?.record.blockers ?? [];
}

export function getLaunchConditions(): string[] {
  return lastRun?.record.conditions ?? [];
}

export function getLaunchRiskRegister() {
  return lastRun?.record.risks ?? [];
}

export function getGrandKingLaunchReadinessSummary() {
  return lastRun?.record.grandKingReadiness ?? {
    ready: false,
    score: 0,
    blockers: [],
    conditions: ["No live launch certification run recorded"],
    programmeRefsValidated: [],
  };
}

export function getVersion1LaunchSummary(context: RegistryLoaderContext = {}): string {
  const overview = getFinalLiveOperationsCertificationOverview(context);
  const run = lastRun;
  if (!run) {
    return `G7 Live Operations programme: ${overview.domainRuleCount} final certification rules, awaiting live launch certification run`;
  }
  return run.reports.version1LaunchReport;
}

export function getLiveOperationHealth(context: RegistryLoaderContext = {}) {
  const run = lastRun;
  return {
    launchStatus: run?.record.launchStatus ?? "UNKNOWN",
    overallEmpireHealth: run?.record.overallEmpireHealth ?? 0,
    validatedDomainCount: run?.record.validatedDomains.length ?? 0,
    failedDomainCount: run?.record.failedDomains.length ?? 0,
    generatedAt: new Date().toISOString(),
  };
}

export function getLiveOperationsCompletionSummary(context: RegistryLoaderContext = {}): string {
  const run = lastRun;
  if (!run) {
    return getFinalLiveOperationsCertificationOverview(context).domainRuleCount + " certification rules configured";
  }
  return run.reports.liveOperationsSummary;
}
