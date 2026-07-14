/** E5-04 — Executive Compliance Engine service orchestrator. */

import { buildComplianceConfiguration, type ComplianceEngineConfiguration } from "./configuration.js";
import { evaluateCompliance } from "./evaluation-engine.js";
import { getComplianceLogs, getViolationHistory } from "./logging.js";
import { buildMonitoringStatus } from "./monitoring.js";
import {
  buildCompliancePolicyRegistry,
  getEnabledPolicies,
  getPolicyCategories,
} from "./policy-registry.js";
import {
  buildComplianceScorecard,
  buildDepartmentSummaries,
  buildExecutiveReport,
} from "./reporting.js";
import type {
  ComplianceEvaluationRequest,
  ComplianceEvaluationResponse,
  ComplianceHealthStatus,
  ComplianceMetrics,
  CompliancePolicyRecord,
} from "./types.js";

let policyRegistry = buildCompliancePolicyRegistry();
let configuration = buildComplianceConfiguration();

export function getCompliancePolicyRegistry(): CompliancePolicyRecord[] {
  return [...policyRegistry];
}

export function getComplianceConfiguration(): ComplianceEngineConfiguration {
  return { ...configuration };
}

export function updateComplianceConfiguration(
  overrides: Partial<ComplianceEngineConfiguration>,
): ComplianceEngineConfiguration {
  configuration = buildComplianceConfiguration({ ...configuration, ...overrides });
  return { ...configuration };
}

export function updateCompliancePolicy(
  policyId: string,
  updates: Partial<Pick<CompliancePolicyRecord, "enabled" | "priority" | "severity" | "version">>,
): CompliancePolicyRecord | null {
  const idx = policyRegistry.findIndex((p) => p.policyId === policyId);
  if (idx < 0) return null;
  const current = policyRegistry[idx]!;
  const updated: CompliancePolicyRecord = {
    policyId: current.policyId,
    title: current.title,
    description: current.description,
    category: current.category,
    effectiveFrom: current.effectiveFrom,
    effectiveTo: current.effectiveTo,
    owner: current.owner,
    metadata: current.metadata,
    enabled: updates.enabled ?? current.enabled,
    priority: updates.priority ?? current.priority,
    severity: updates.severity ?? current.severity,
    version: updates.version ?? current.version,
  };
  policyRegistry[idx] = updated;
  return updated;
}

export function runComplianceEvaluation(
  request: ComplianceEvaluationRequest,
): ComplianceEvaluationResponse {
  return evaluateCompliance(request, policyRegistry, configuration);
}

export function getComplianceHealthStatus(input: {
  healthScore: number;
  complianceScore: number;
}): ComplianceHealthStatus {
  const logs = getComplianceLogs(1);
  return {
    status: input.healthScore >= 85 ? "healthy" : input.healthScore >= 70 ? "stable" : "attention",
    healthScore: input.healthScore,
    complianceScore: input.complianceScore,
    policyCount: policyRegistry.length,
    enabledPolicyCount: getEnabledPolicies(policyRegistry).length,
    evaluationCount: getComplianceLogs(1000).length,
    lastEvaluationAt: logs[0]?.timestamp ?? null,
  };
}

export function getComplianceMetrics(complianceScore: number): ComplianceMetrics {
  const logs = getComplianceLogs(1000);
  return {
    totalEvaluations: logs.length,
    passCount: logs.filter((l) => l.result === "PASS").length,
    warningCount: logs.filter((l) => l.result === "WARNING").length,
    violationCount: logs.filter((l) => l.result === "VIOLATION").length,
    criticalCount: logs.filter((l) => l.result === "CRITICAL").length,
    blockCount: logs.filter((l) => l.enforcementAction === "hard_block" || l.enforcementAction === "auto_reject").length,
    averageComplianceScore: complianceScore,
  };
}

export function resetComplianceServiceForTesting(): void {
  policyRegistry = buildCompliancePolicyRegistry();
  configuration = buildComplianceConfiguration();
}

export {
  buildMonitoringStatus,
  buildExecutiveReport,
  buildDepartmentSummaries,
  buildComplianceScorecard,
  getViolationHistory,
  getComplianceLogs,
  getPolicyCategories,
  getEnabledPolicies,
};
