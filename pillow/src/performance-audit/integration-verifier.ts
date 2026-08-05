import { INTEGRATION_TARGETS } from "./paths.js";
import type { PerformanceAuditDependencies } from "./integrations.js";
import type { IntegrationCheckRow, IntegrationTarget, IntegrationVerification } from "./types.js";

function isBound(target: IntegrationTarget, deps: PerformanceAuditDependencies): boolean {
  switch (target) {
    case "security_audit":
      return !!deps.securityAudit;
    case "production_certification_core":
      return !!deps.productionCertificationCore;
    case "shared_runtime_core":
      return !!deps.sharedRuntimeCore;
    case "monitoring_runtime":
      return !!deps.monitoringRuntime;
    case "audit_runtime":
      return !!deps.auditRuntime;
    case "queue_runtime":
      return !!deps.queueRuntime;
    case "api_runtime":
      return !!deps.apiRuntime;
    case "worker_registry":
      return !!deps.workerRegistry;
    case "executive_reporting_runtime":
      return !!deps.executiveReportingRuntime;
    case "pillow_orchestration_runtime":
      return !!deps.pillowOrchestrationRuntime;
    case "scheduling_runtime":
      return !!deps.schedulingRuntime;
    default:
      return false;
  }
}

/** Verifies integration wiring strictly from injected dependency presence. */
export function verifyIntegrations(deps: PerformanceAuditDependencies): IntegrationVerification {
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
