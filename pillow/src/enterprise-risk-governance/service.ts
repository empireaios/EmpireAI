/** E5-09 — Enterprise Risk Governance service orchestrator. */

import { getRiskAuditHistory } from "./audit-logging.js";
import { buildRiskConfiguration, type RiskGovernanceConfiguration } from "./configuration.js";
import { buildCriticalRisks, buildMitigationProgress, hasMitigationPlan } from "./mitigation.js";
import { buildRiskMonitoringStatus } from "./monitoring.js";
import { buildRiskExecutiveReport, buildRiskMetrics } from "./reporting.js";
import { resetRiskAuditForTesting } from "./audit-logging.js";
import type { EnterpriseRiskRecord, RiskHealthStatus } from "./types.js";

let configuration = buildRiskConfiguration();

export function getRiskConfiguration(): RiskGovernanceConfiguration {
  return { ...configuration };
}

export function updateRiskConfiguration(
  overrides: Partial<RiskGovernanceConfiguration>,
): RiskGovernanceConfiguration {
  configuration = buildRiskConfiguration({ ...configuration, ...overrides });
  return { ...configuration };
}

export function getRiskHealthStatus(input: { healthScore: number; records: EnterpriseRiskRecord[] }): RiskHealthStatus {
  const history = getRiskAuditHistory(1);
  const critical = input.records.filter((r) => r.severity === "critical");
  const criticalWithMitigation = critical.filter(hasMitigationPlan).length;
  return {
    status: input.healthScore >= 85 ? "healthy" : input.healthScore >= 70 ? "stable" : "attention",
    healthScore: input.healthScore,
    riskRegisterCount: input.records.length,
    criticalWithMitigation,
    auditEventCount: getRiskAuditHistory(1000).length,
    lastEventAt: history[0]?.timestamp ?? null,
  };
}

export function buildRiskSubsystems(input: {
  records: EnterpriseRiskRecord[];
  riskHealth: string;
  healthScore: number;
  criticalCount: number;
  highCount: number;
  unmanagedCriticalCount: number;
  mitigationInProgressCount: number;
  computedAt: string;
}) {
  const auditHistory = getRiskAuditHistory(100);
  const mitigationProgress = buildMitigationProgress(input.records);
  const criticalRisks = buildCriticalRisks(input.records);

  return {
    criticalRisks,
    mitigationProgress,
    riskAuditHistory: auditHistory,
    monitoringStatus: buildRiskMonitoringStatus({
      config: configuration,
      criticalCount: input.criticalCount,
      highCount: input.highCount,
      unmanagedCriticalCount: input.unmanagedCriticalCount,
      mitigationInProgressCount: input.mitigationInProgressCount,
      lastScanAt: input.computedAt,
    }),
    executiveReport: buildRiskExecutiveReport({
      riskHealth: input.riskHealth,
      totalRisks: input.records.length,
      criticalRisks: input.criticalCount,
      auditHistory,
    }),
    metrics: buildRiskMetrics({ records: input.records, mitigationProgress }),
    healthStatus: getRiskHealthStatus({ healthScore: input.healthScore, records: input.records }),
  };
}

export function resetRiskServiceForTesting(): void {
  configuration = buildRiskConfiguration();
  resetRiskAuditForTesting();
}

export { getRiskAuditHistory, buildCriticalRisks, buildMitigationProgress };
