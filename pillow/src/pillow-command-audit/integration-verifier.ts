import { INTEGRATION_TARGETS } from "./paths.js";
import type { PillowCommandAuditDependencies } from "./integrations.js";
import type { IntegrationCheckRow, IntegrationTarget, IntegrationVerification } from "./types.js";

function isBound(target: IntegrationTarget, deps: PillowCommandAuditDependencies): boolean {
  switch (target) {
    case "worker_registry":
      return !!deps.workerRegistry;
    case "worker_readiness_audit":
      return !!deps.workerReadinessAudit;
    case "production_certification_core":
      return !!deps.productionCertificationCore;
    case "pillow_orchestration_runtime":
      return !!deps.pillowOrchestrationRuntime;
    case "communication_runtime":
      return !!deps.communicationRuntime;
    case "mission_runtime":
      return !!deps.missionRuntime;
    case "monitoring_runtime":
      return !!deps.monitoringRuntime;
    case "audit_runtime":
      return !!deps.auditRuntime;
    case "executive_reporting_runtime":
      return !!deps.executiveReportingRuntime;
    default:
      return false;
  }
}

/** Verifies integration wiring strictly from injected dependency presence. */
export function verifyIntegrations(deps: PillowCommandAuditDependencies): IntegrationVerification {
  const rows: IntegrationCheckRow[] = INTEGRATION_TARGETS.map((target) => {
    const bound = isBound(target, deps);
    return {
      target,
      bound,
      evidence: `${target}: ${bound ? "bound" : "unavailable"}`,
    };
  });
  const boundCount = rows.filter((r) => r.bound).length;
  return {
    verifiedAt: new Date().toISOString(),
    rows,
    totalTargets: rows.length,
    boundCount,
    allBound: boundCount === rows.length,
    evidence: rows.map((r) => r.evidence),
  };
}
