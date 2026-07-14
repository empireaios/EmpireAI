/** E5-10 — Executive Review Board service orchestrator. */

import { getReviewAuditHistory } from "./audit-logging.js";
import { buildReviewConfiguration, type ReviewBoardConfiguration } from "./configuration.js";
import {
  buildAssignedActions,
  buildReviewCalendar,
  buildCurrentReviews,
  buildExecutiveFindings,
  buildStrategicProgress,
  buildGovernanceHealthEntries,
} from "./actions.js";
import { buildReviewMonitoringStatus } from "./monitoring.js";
import { buildReviewExecutiveReport, buildReviewMetrics } from "./reporting.js";
import { resetReviewAuditForTesting } from "./audit-logging.js";
import type { ExecutiveReviewRecord, ReviewHealthStatus } from "./types.js";

let configuration = buildReviewConfiguration();

export function getReviewConfiguration(): ReviewBoardConfiguration {
  return { ...configuration };
}

export function updateReviewConfiguration(
  overrides: Partial<ReviewBoardConfiguration>,
): ReviewBoardConfiguration {
  configuration = buildReviewConfiguration({ ...configuration, ...overrides });
  return { ...configuration };
}

export function getReviewHealthStatus(input: {
  healthScore: number;
  records: ExecutiveReviewRecord[];
  unreviewedCritical: number;
}): ReviewHealthStatus {
  const history = getReviewAuditHistory(1);
  return {
    status: input.healthScore >= 85 ? "healthy" : input.healthScore >= 70 ? "stable" : "attention",
    healthScore: input.healthScore,
    reviewRegisterCount: input.records.length,
    unreviewedCriticalAreas: input.unreviewedCritical,
    auditEventCount: getReviewAuditHistory(1000).length,
    lastEventAt: history[0]?.timestamp ?? null,
  };
}

export function buildReviewSubsystems(input: {
  records: ExecutiveReviewRecord[];
  reviewHealth: string;
  healthScore: number;
  activeCount: number;
  pendingActionCount: number;
  overdueActionCount: number;
  unreviewedCritical: number;
  e5Gov: boolean;
  e5Risk: boolean;
  computedAt: string;
}) {
  const auditHistory = getReviewAuditHistory(100);
  const assignedActions = buildAssignedActions(input.records);
  const governanceHealth = buildGovernanceHealthEntries({
    e5Gov: input.e5Gov,
    e5Risk: input.e5Risk,
    healthScore: input.healthScore,
  });

  return {
    reviewCalendar: buildReviewCalendar(input.records),
    currentReviews: buildCurrentReviews(input.records),
    executiveFindings: buildExecutiveFindings(input.records),
    assignedActions,
    strategicProgress: buildStrategicProgress(input.records),
    governanceHealth,
    reviewAuditHistory: auditHistory,
    monitoringStatus: buildReviewMonitoringStatus({
      config: configuration,
      activeCount: input.activeCount,
      pendingActionCount: input.pendingActionCount,
      overdueActionCount: input.overdueActionCount,
      reviewQualityScore: input.healthScore,
      lastScanAt: input.computedAt,
    }),
    executiveReport: buildReviewExecutiveReport({
      reviewHealth: input.reviewHealth,
      totalReviews: input.records.length,
      activeReviews: input.activeCount,
      auditHistory,
    }),
    metrics: buildReviewMetrics({
      records: input.records,
      assignedActions,
      governanceHealthScore: governanceHealth[0]?.score ?? input.healthScore,
    }),
    healthStatus: getReviewHealthStatus({
      healthScore: input.healthScore,
      records: input.records,
      unreviewedCritical: input.unreviewedCritical,
    }),
  };
}

export function resetReviewServiceForTesting(): void {
  configuration = buildReviewConfiguration();
  resetReviewAuditForTesting();
}

export { getReviewAuditHistory };
