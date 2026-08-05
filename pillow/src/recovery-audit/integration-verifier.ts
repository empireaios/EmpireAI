import { INTEGRATION_TARGETS } from "./paths.js";
import type { RecoveryAuditDependencies } from "./integrations.js";
import type { IntegrationCheckRow, IntegrationTarget, IntegrationVerification } from "./types.js";

function isBound(target: IntegrationTarget, deps: RecoveryAuditDependencies): boolean {
  switch (target) {
    case "performance_audit":
      return !!deps.performanceAudit;
    case "production_certification_core":
      return !!deps.productionCertificationCore;
    case "recovery_runtime":
      return !!deps.recoveryRuntime;
    case "shared_runtime_core":
      return !!deps.sharedRuntimeCore;
    case "monitoring_runtime":
      return !!deps.monitoringRuntime;
    case "audit_runtime":
      return !!deps.auditRuntime;
    case "queue_runtime":
      return !!deps.queueRuntime;
    case "mission_runtime":
      return !!deps.missionRuntime;
    case "worker_registry":
      return !!deps.workerRegistry;
    case "executive_reporting_runtime":
      return !!deps.executiveReportingRuntime;
    case "pillow_orchestration_runtime":
      return !!deps.pillowOrchestrationRuntime;
    default:
      return false;
  }
}

export function verifyIntegrations(deps: RecoveryAuditDependencies): IntegrationVerification {
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
