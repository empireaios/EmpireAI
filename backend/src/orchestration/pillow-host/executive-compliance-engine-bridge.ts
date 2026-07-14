import {
  assembleExecutiveComplianceEngine,
  buildFallbackExecutiveComplianceEngine,
  runComplianceEvaluation,
  getCompliancePolicyRegistry,
  getComplianceConfiguration,
  updateCompliancePolicy,
  getComplianceHealthStatus,
  getComplianceMetrics,
  getViolationHistory,
  getComplianceLogs,
} from "@empireai/pillow";
import type {
  ComplianceEvaluationRequest,
  CompliancePolicyRecord,
  ComplianceEngineConfiguration,
  ComplianceExecutiveReport,
  ExecutiveComplianceEngine,
} from "@empireai/pillow";

/** Fallback Executive Compliance Engine when Pillow session is unavailable. */
export function collectExecutiveComplianceEngineSnapshot() {
  const engine = buildFallbackExecutiveComplianceEngine();
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-04",
    live: false,
    executiveComplianceEngine: engine,
  };
}

export function evaluateExecutiveCompliance(request: ComplianceEvaluationRequest) {
  const response = runComplianceEvaluation(request);
  return {
    computedAt: new Date().toISOString(),
    evaluation: response,
  };
}

export function getExecutiveCompliancePolicies(): {
  computedAt: string;
  policies: CompliancePolicyRecord[];
  configuration: ComplianceEngineConfiguration;
} {
  return {
    computedAt: new Date().toISOString(),
    policies: getCompliancePolicyRegistry(),
    configuration: getComplianceConfiguration(),
  };
}

export function getExecutiveComplianceReport(): {
  computedAt: string;
  report: ComplianceExecutiveReport;
  scorecard: ExecutiveComplianceEngine["complianceScorecard"];
  departmentSummaries: ExecutiveComplianceEngine["departmentSummaries"];
  monitoring: ExecutiveComplianceEngine["monitoringStatus"];
} {
  const engine = buildFallbackExecutiveComplianceEngine();
  return {
    computedAt: new Date().toISOString(),
    report: engine.executiveReport,
    scorecard: engine.complianceScorecard,
    departmentSummaries: engine.departmentSummaries,
    monitoring: engine.monitoringStatus,
  };
}

export function getExecutiveComplianceViolations() {
  return {
    computedAt: new Date().toISOString(),
    violations: getViolationHistory(100),
    activeViolations: buildFallbackExecutiveComplianceEngine().activeViolations,
  };
}

export function getExecutiveComplianceHealth() {
  const engine = buildFallbackExecutiveComplianceEngine();
  return {
    computedAt: new Date().toISOString(),
    health: engine.healthStatus,
    metrics: engine.metrics,
    engineHealth: engine.engineHealth,
    complianceHealth: engine.complianceHealth,
  };
}

export function patchExecutiveCompliancePolicy(
  policyId: string,
  updates: { enabled?: boolean; priority?: number; severity?: string; version?: string },
) {
  const updated = updateCompliancePolicy(policyId, updates);
  if (!updated) {
    return { error: "Policy not found", policyId };
  }
  return {
    computedAt: new Date().toISOString(),
    policy: updated,
  };
}

export { assembleExecutiveComplianceEngine, buildFallbackExecutiveComplianceEngine };
