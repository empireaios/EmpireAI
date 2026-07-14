/** E5-14 — Executive Resilience Engine service orchestrator. */

import { getResilienceAuditHistory } from "./audit-logging.js";
import { buildResilienceConfiguration, type ResilienceEngineConfiguration } from "./configuration.js";
import {
  buildEnterpriseHealthEntries,
  buildContinuityStatus,
  buildActiveIncidents,
  buildRecoveryProgress,
  buildOperationalReadiness,
} from "./continuity.js";
import { buildResilienceMonitoringStatus } from "./monitoring.js";
import { buildResilienceExecutiveReport, buildResilienceMetrics } from "./reporting.js";
import { resetResilienceAuditForTesting } from "./audit-logging.js";
import type { ResilienceIncidentRecord, ResilienceHealthStatus } from "./types.js";

let configuration = buildResilienceConfiguration();

export function getResilienceConfiguration(): ResilienceEngineConfiguration {
  return { ...configuration };
}

export function updateResilienceConfiguration(
  overrides: Partial<ResilienceEngineConfiguration>,
): ResilienceEngineConfiguration {
  configuration = buildResilienceConfiguration({ ...configuration, ...overrides });
  return { ...configuration };
}

export function getResilienceHealthStatus(input: {
  healthScore: number;
  records: ResilienceIncidentRecord[];
  unresolvedCritical: number;
}): ResilienceHealthStatus {
  const history = getResilienceAuditHistory(1);
  return {
    status: input.healthScore >= 85 ? "healthy" : input.healthScore >= 70 ? "stable" : "attention",
    healthScore: input.healthScore,
    incidentRegisterCount: input.records.length,
    unresolvedCriticalCount: input.unresolvedCritical,
    auditEventCount: getResilienceAuditHistory(1000).length,
    lastEventAt: history[0]?.timestamp ?? null,
  };
}

export function buildResilienceSubsystems(input: {
  records: ResilienceIncidentRecord[];
  resilienceHealth: string;
  healthScore: number;
  enterpriseHealthScore: number;
  recoveryReadinessScore: number;
  activeIncidents: number;
  recoveredCount: number;
  unresolvedCritical: number;
  e5Gov: boolean;
  e5Guard: boolean;
  buildClean: boolean;
  computedAt: string;
}) {
  const auditHistory = getResilienceAuditHistory(100);
  const continuityStatus = buildContinuityStatus(input.records);
  const avgContinuity =
    continuityStatus.length > 0
      ? Math.round(continuityStatus.reduce((a, b) => a + b.availability, 0) / continuityStatus.length)
      : 95;
  const operationalReadiness = buildOperationalReadiness({
    healthScore: input.healthScore,
    recoveryReadiness: input.recoveryReadinessScore,
    buildClean: input.buildClean,
  });

  return {
    enterpriseHealth: buildEnterpriseHealthEntries({
      healthScore: input.enterpriseHealthScore,
      e5Gov: input.e5Gov,
      e5Guard: input.e5Guard,
      activeIncidents: input.activeIncidents,
    }),
    continuityStatus,
    activeIncidents: buildActiveIncidents(input.records),
    recoveryProgress: buildRecoveryProgress(input.records),
    operationalReadiness,
    resilienceAuditHistory: auditHistory,
    monitoringStatus: buildResilienceMonitoringStatus({
      config: configuration,
      totalIncidents: input.records.length,
      activeIncidents: input.activeIncidents,
      recoveredIncidents: input.recoveredCount,
      resilienceHealthScore: input.healthScore,
      lastScanAt: input.computedAt,
    }),
    executiveReport: buildResilienceExecutiveReport({
      resilienceHealth: input.resilienceHealth,
      enterpriseHealthScore: input.enterpriseHealthScore,
      activeIncidents: input.activeIncidents,
      recoveryReadiness: input.recoveryReadinessScore,
    }),
    metrics: buildResilienceMetrics({
      records: input.records,
      enterpriseHealthScore: input.enterpriseHealthScore,
      operationalReadinessScore: operationalReadiness[0]?.score ?? input.healthScore,
      continuityAvailability: avgContinuity,
    }),
    healthStatus: getResilienceHealthStatus({
      healthScore: input.healthScore,
      records: input.records,
      unresolvedCritical: input.unresolvedCritical,
    }),
  };
}

export function resetResilienceServiceForTesting(): void {
  configuration = buildResilienceConfiguration();
  resetResilienceAuditForTesting();
}

export { getResilienceAuditHistory };
