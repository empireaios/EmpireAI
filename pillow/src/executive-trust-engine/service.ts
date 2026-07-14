/** E5-12 — Executive Trust Engine service orchestrator. */

import { getTrustAuditHistory } from "./audit-logging.js";
import { buildTrustConfiguration, type TrustEngineConfiguration } from "./configuration.js";
import {
  buildExecutiveTrustScores,
  buildGovernanceTrustScores,
  buildDecisionConfidenceEntries,
  buildTrustTrends,
  buildTrustHistory,
  buildConfidenceAnalysis,
} from "./scoring.js";
import { buildTrustMonitoringStatus } from "./monitoring.js";
import { buildTrustExecutiveReport, buildTrustMetrics } from "./reporting.js";
import { resetTrustAuditForTesting } from "./audit-logging.js";
import { TRUST_ANALYSIS_DOMAINS } from "./paths.js";
import type { TrustAssessmentRecord, TrustHealthStatus } from "./types.js";

let configuration = buildTrustConfiguration();

export function getTrustConfiguration(): TrustEngineConfiguration {
  return { ...configuration };
}

export function updateTrustConfiguration(
  overrides: Partial<TrustEngineConfiguration>,
): TrustEngineConfiguration {
  configuration = buildTrustConfiguration({ ...configuration, ...overrides });
  return { ...configuration };
}

export function getTrustHealthStatus(input: {
  healthScore: number;
  records: TrustAssessmentRecord[];
  unsupportedRatingCount: number;
}): TrustHealthStatus {
  const history = getTrustAuditHistory(1);
  return {
    status: input.healthScore >= 85 ? "healthy" : input.healthScore >= 70 ? "stable" : "attention",
    healthScore: input.healthScore,
    assessmentCount: input.records.length,
    unsupportedRatingCount: input.unsupportedRatingCount,
    auditEventCount: getTrustAuditHistory(1000).length,
    lastEventAt: history[0]?.timestamp ?? null,
  };
}

export function buildTrustSubsystems(input: {
  records: TrustAssessmentRecord[];
  trustHealth: string;
  healthScore: number;
  executiveTrustScore: number;
  governanceTrustScore: number;
  decisionConfidence: number;
  lowTrustCount: number;
  criticalTrustCount: number;
  unsupportedRatingCount: number;
  e5Gov: boolean;
  e5Review: boolean;
  e5Policy: boolean;
  computedAt: string;
}) {
  const auditHistory = getTrustAuditHistory(100);
  const executiveTrustScores = buildExecutiveTrustScores(input.records);
  const governanceTrustScores = buildGovernanceTrustScores({
    e5Gov: input.e5Gov,
    e5Review: input.e5Review,
    e5Policy: input.e5Policy,
    records: input.records,
  });
  const confidenceAnalysis = buildConfidenceAnalysis(input.records, TRUST_ANALYSIS_DOMAINS);

  return {
    executiveTrustScores,
    governanceTrustScores,
    decisionConfidenceEntries: buildDecisionConfidenceEntries(input.records),
    trustTrends: buildTrustTrends(input.records),
    trustHistory: buildTrustHistory(input.records),
    confidenceAnalysis,
    trustAuditHistory: auditHistory,
    monitoringStatus: buildTrustMonitoringStatus({
      config: configuration,
      totalAssessments: input.records.length,
      lowTrustCount: input.lowTrustCount,
      criticalTrustCount: input.criticalTrustCount,
      trustHealthScore: input.healthScore,
      lastScanAt: input.computedAt,
    }),
    executiveReport: buildTrustExecutiveReport({
      trustHealth: input.trustHealth,
      executiveTrustScore: input.executiveTrustScore,
      governanceTrustScore: input.governanceTrustScore,
      decisionConfidence: input.decisionConfidence,
    }),
    metrics: buildTrustMetrics({
      records: input.records,
      executiveTrustScore: input.executiveTrustScore,
      governanceTrustScore: input.governanceTrustScore,
    }),
    healthStatus: getTrustHealthStatus({
      healthScore: input.healthScore,
      records: input.records,
      unsupportedRatingCount: input.unsupportedRatingCount,
    }),
  };
}

export function resetTrustServiceForTesting(): void {
  configuration = buildTrustConfiguration();
  resetTrustAuditForTesting();
}

export { getTrustAuditHistory };
