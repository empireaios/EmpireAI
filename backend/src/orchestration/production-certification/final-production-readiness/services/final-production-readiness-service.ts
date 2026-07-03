/**
 * G6-10 — Final production readiness certification service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  FinalCertificationOutcome,
  FinalProductionReadinessOverview,
  FinalProductionReadinessRecord,
  FinalProductionReadinessRunResult,
} from "../contracts/final-production-readiness-types.js";
import { FINAL_PRODUCTION_READINESS_CERTIFICATION_VERSION, G6_MISSION_AUDIT_REFS } from "../contracts/final-production-readiness-types.js";
import { recordFinalReadinessEklsObservation } from "../ekls/final-readiness-ekls-integration.js";
import { validateFinalReadinessPillowGovernance } from "../governance/final-readiness-pillow-governance.js";
import { resolveFinalReadinessRules } from "../registry/final-readiness-registry-resolver.js";
import {
  aggregateFinalCertificationDomains,
  computeFinalReadinessScore,
  deriveFinalCertificationOutcome,
} from "./final-certification-aggregator.js";
import { evaluateGrandKingReadiness } from "./grand-king-readiness-evaluator.js";
import { evaluateProductionEligibility } from "./production-eligibility-engine.js";

let lastRun: FinalProductionReadinessRunResult | undefined;

export function getFinalProductionReadinessOverview(
  context: RegistryLoaderContext = {},
): FinalProductionReadinessOverview {
  const rules = resolveFinalReadinessRules(context);
  return {
    frameworkVersion: FINAL_PRODUCTION_READINESS_CERTIFICATION_VERSION,
    domainRuleCount: rules.length,
    missionAuditCount: G6_MISSION_AUDIT_REFS.length,
    lastRunId: lastRun?.runId,
    lastCertificationStatus: lastRun?.record.certificationStatus,
    generatedAt: new Date().toISOString(),
  };
}

export function getLastFinalProductionReadinessRun(): FinalProductionReadinessRunResult | undefined {
  return lastRun;
}

export function resetFinalProductionReadinessStateForTests(): void {
  lastRun = undefined;
}

function buildReports(record: FinalProductionReadinessRecord, readinessScore: number) {
  const passed = record.validatedDomains.filter((d) => d.status === "pass" || d.status === "pass_with_conditions").length;
  return {
    finalProductionReadinessReport: `G6 Final Production Readiness: ${record.certificationStatus} (score ${readinessScore})`,
    g6CompletionSummary: `G6 programme complete: ${passed}/${record.validatedDomains.length} domains validated`,
    g6RiskRegister: record.risks,
    g6BlockerRegister: record.blockers,
    grandKingReadinessSummary: record.grandKingReadiness,
    productionConditionsSummary: record.conditions,
  };
}

function recordOutcomeEkls(
  input: { actorId: string; workspaceId: string; runId: string; outcome: FinalCertificationOutcome },
): void {
  const base = { actorId: input.actorId, workspaceId: input.workspaceId, runId: input.runId, pillowGovernance: true as const };
  recordFinalReadinessEklsObservation({ ...base, kind: "final_certification_completed", summary: `Final certification completed: ${input.outcome}` });
  switch (input.outcome) {
    case "PRODUCTION_READY":
      recordFinalReadinessEklsObservation({ ...base, kind: "production_ready", summary: "EmpireAI production ready" });
      break;
    case "PRODUCTION_READY_WITH_CONDITIONS":
      recordFinalReadinessEklsObservation({ ...base, kind: "production_ready_with_conditions", summary: "Production ready with conditions" });
      break;
    case "BLOCKED":
      recordFinalReadinessEklsObservation({ ...base, kind: "production_blocked", summary: "Production certification blocked" });
      break;
    case "FAILED":
      recordFinalReadinessEklsObservation({ ...base, kind: "production_failed", summary: "Production certification failed" });
      break;
    default:
      break;
  }
  recordFinalReadinessEklsObservation({ ...base, kind: "grand_king_readiness_recorded", summary: "Grand King readiness evaluated" });
}

export async function runFinalProductionReadinessCertification(input: {
  context?: RegistryLoaderContext;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): Promise<FinalProductionReadinessRunResult> {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const governance = validateFinalReadinessPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "run_final",
    pillowGovernance: true,
  });

  const runId = randomUUID();
  const correlationId = randomUUID();
  const governanceState = governance.allowed ? "pillow-approved" : "pillow-blocked";

  recordFinalReadinessEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    runId,
    kind: "final_certification_started",
    summary: "Final production readiness certification started",
    pillowGovernance: true,
  });

  if (!governance.allowed) {
    const blockedRecord: FinalProductionReadinessRecord = {
      certificationId: runId,
      programmeId: "G6",
      certificationStatus: "BLOCKED",
      productionEligibility: false,
      conditions: [governance.reason],
      blockers: [{
        blockerId: "pillow-blocked",
        domainId: "final_production_readiness",
        domainLabel: "Pillow Governance",
        severity: "critical",
        message: governance.reason,
      }],
      risks: [],
      evidence: [],
      recommendations: ["Resolve Pillow governance before final certification"],
      validatedDomains: [],
      failedDomains: [],
      warningDomains: [],
      requiredActions: ["Enable Pillow governance"],
      optionalActions: [],
      timestamp: new Date().toISOString(),
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
    const result: FinalProductionReadinessRunResult = {
      runId,
      correlationId,
      record: blockedRecord,
      readinessScore: 0,
      scannedAt: new Date().toISOString(),
      discoverySource: "REG-CERTIFICATION-FINAL-READINESS",
      reports: buildReports(blockedRecord, 0),
    };
    lastRun = result;
    recordOutcomeEkls({ actorId: input.actorId, workspaceId: input.workspaceId, runId, outcome: "BLOCKED" });
    return result;
  }

  const rules = resolveFinalReadinessRules(context);
  const aggregated = await aggregateFinalCertificationDomains({
    rules,
    context,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
  });

  const readinessScore = computeFinalReadinessScore(aggregated.validatedDomains);
  const eligibility = evaluateProductionEligibility({
    validatedDomains: aggregated.validatedDomains,
    blockers: aggregated.blockers,
  });

  const grandKingReadiness = evaluateGrandKingReadiness({
    validatedDomains: aggregated.validatedDomains,
    blockers: aggregated.blockers,
    productionEligible: eligibility.eligible,
    readinessScore,
  });

  const certificationStatus = deriveFinalCertificationOutcome(
    aggregated.validatedDomains,
    grandKingReadiness.blockers,
    eligibility.eligible,
  );

  const failedDomains = aggregated.validatedDomains.filter((d) => d.status === "fail" || d.status === "blocked").map((d) => d.domainId);
  const warningDomains = aggregated.validatedDomains.filter((d) => d.status === "warning" || d.status === "pass_with_conditions").map((d) => d.domainId);

  const recommendations = [
    ...eligibility.requiredActions,
    ...(certificationStatus === "PRODUCTION_READY" ? ["EmpireAI eligible to proceed toward G7 Grand King Live Operations"] : []),
    ...(certificationStatus === "PRODUCTION_READY_WITH_CONDITIONS" ? ["Review production conditions before G7"] : []),
  ];

  const record: FinalProductionReadinessRecord = {
    certificationId: runId,
    programmeId: "G6",
    certificationStatus,
    productionEligibility: eligibility.eligible && certificationStatus !== "BLOCKED" && certificationStatus !== "FAILED",
    conditions: [...eligibility.conditions, ...grandKingReadiness.conditions],
    blockers: grandKingReadiness.blockers,
    risks: aggregated.risks,
    evidence: aggregated.evidence,
    recommendations,
    validatedDomains: aggregated.validatedDomains,
    failedDomains,
    warningDomains,
    requiredActions: eligibility.requiredActions,
    optionalActions: eligibility.conditions.length > 0 ? ["Monitor conditional domains post-certification"] : [],
    timestamp: new Date().toISOString(),
    correlationId,
    governanceState,
    grandKingReadiness,
  };

  const result: FinalProductionReadinessRunResult = {
    runId,
    correlationId,
    record,
    readinessScore,
    scannedAt: new Date().toISOString(),
    discoverySource: "REG-CERTIFICATION-FINAL-READINESS",
    reports: buildReports(record, readinessScore),
  };

  lastRun = result;
  recordOutcomeEkls({ actorId: input.actorId, workspaceId: input.workspaceId, runId, outcome: certificationStatus });
  return result;
}

export function getProductionEligibilitySummary(context: RegistryLoaderContext = {}): {
  eligible: boolean;
  certificationStatus: FinalCertificationOutcome;
  conditions: string[];
} {
  const run = lastRun;
  if (!run) {
    return { eligible: false, certificationStatus: "UNKNOWN", conditions: ["No final certification run recorded"] };
  }
  return {
    eligible: run.record.productionEligibility,
    certificationStatus: run.record.certificationStatus,
    conditions: run.record.conditions,
  };
}

export function getProductionBlockers(): FinalProductionReadinessRecord["blockers"] {
  return lastRun?.record.blockers ?? [];
}

export function getProductionConditions(): string[] {
  return lastRun?.record.conditions ?? [];
}

export function getProductionRiskRegister(): FinalProductionReadinessRecord["risks"] {
  return lastRun?.record.risks ?? [];
}

export function getGrandKingReadinessSummary() {
  return lastRun?.record.grandKingReadiness ?? {
    ready: false,
    score: 0,
    blockers: [],
    conditions: ["No final certification run recorded"],
    programmeRefsValidated: [],
  };
}

export function getCertificationCompletionSummary(context: RegistryLoaderContext = {}): string {
  const overview = getFinalProductionReadinessOverview(context);
  const run = lastRun;
  if (!run) {
    return `G6 Production Certification programme: ${overview.domainRuleCount} final readiness rules, awaiting final certification run`;
  }
  return run.reports.g6CompletionSummary;
}
