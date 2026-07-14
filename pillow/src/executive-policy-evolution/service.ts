/** E5-11 — Executive Policy Evolution service orchestrator. */

import { getPolicyEvolutionAuditHistory } from "./audit-logging.js";
import { buildPolicyEvolutionConfiguration, type PolicyEvolutionConfiguration } from "./configuration.js";
import {
  buildPolicyVersions,
  buildEvolutionQueue,
  buildImprovementOpportunities,
  buildPolicyEffectiveness,
  buildGovernanceStabilityEntries,
} from "./evolution.js";
import { buildPolicyEvolutionMonitoringStatus } from "./monitoring.js";
import { buildPolicyEvolutionExecutiveReport, buildPolicyEvolutionMetrics } from "./reporting.js";
import { resetPolicyEvolutionAuditForTesting } from "./audit-logging.js";
import type { PolicyEvolutionRecord, PolicyEvolutionHealthStatus } from "./types.js";

let configuration = buildPolicyEvolutionConfiguration();

export function getPolicyEvolutionConfiguration(): PolicyEvolutionConfiguration {
  return { ...configuration };
}

export function updatePolicyEvolutionConfiguration(
  overrides: Partial<PolicyEvolutionConfiguration>,
): PolicyEvolutionConfiguration {
  configuration = buildPolicyEvolutionConfiguration({ ...configuration, ...overrides });
  return { ...configuration };
}

export function getPolicyEvolutionHealthStatus(input: {
  healthScore: number;
  records: PolicyEvolutionRecord[];
  regressionRiskCount: number;
}): PolicyEvolutionHealthStatus {
  const history = getPolicyEvolutionAuditHistory(1);
  return {
    status: input.healthScore >= 85 ? "healthy" : input.healthScore >= 70 ? "stable" : "attention",
    healthScore: input.healthScore,
    evolutionRegisterCount: input.records.length,
    regressionRiskCount: input.regressionRiskCount,
    auditEventCount: getPolicyEvolutionAuditHistory(1000).length,
    lastEventAt: history[0]?.timestamp ?? null,
  };
}

export function buildPolicyEvolutionSubsystems(input: {
  records: PolicyEvolutionRecord[];
  evolutionHealth: string;
  healthScore: number;
  pendingCount: number;
  approvedCount: number;
  publishedCount: number;
  regressionRiskCount: number;
  e5Gov: boolean;
  e5Review: boolean;
  computedAt: string;
}) {
  const auditHistory = getPolicyEvolutionAuditHistory(100);
  const policyVersions = buildPolicyVersions(input.records);
  const governanceStability = buildGovernanceStabilityEntries({
    e5Gov: input.e5Gov,
    e5Review: input.e5Review,
    healthScore: input.healthScore,
  });

  return {
    policyVersions,
    evolutionQueue: buildEvolutionQueue(input.records),
    improvementOpportunities: buildImprovementOpportunities(input.records),
    policyEffectiveness: buildPolicyEffectiveness(input.records),
    governanceStability,
    evolutionAuditHistory: auditHistory,
    monitoringStatus: buildPolicyEvolutionMonitoringStatus({
      config: configuration,
      pendingCount: input.pendingCount,
      approvedCount: input.approvedCount,
      publishedCount: input.publishedCount,
      policyStabilityScore: input.healthScore,
      lastScanAt: input.computedAt,
    }),
    executiveReport: buildPolicyEvolutionExecutiveReport({
      evolutionHealth: input.evolutionHealth,
      totalEvolutions: input.records.length,
      pendingEvolutions: input.pendingCount,
      auditHistory,
    }),
    metrics: buildPolicyEvolutionMetrics({
      records: input.records,
      governanceStabilityScore: governanceStability[0]?.score ?? input.healthScore,
      policyStabilityScore: input.healthScore,
    }),
    healthStatus: getPolicyEvolutionHealthStatus({
      healthScore: input.healthScore,
      records: input.records,
      regressionRiskCount: input.regressionRiskCount,
    }),
  };
}

export function resetPolicyEvolutionServiceForTesting(): void {
  configuration = buildPolicyEvolutionConfiguration();
  resetPolicyEvolutionAuditForTesting();
}

export { getPolicyEvolutionAuditHistory };
