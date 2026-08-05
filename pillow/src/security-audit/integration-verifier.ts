import { INTEGRATION_TARGETS } from "./paths.js";
import type { SecurityAuditDependencies } from "./integrations.js";
import type { IntegrationCheckRow, IntegrationTarget, IntegrationVerification } from "./types.js";

function isBound(target: IntegrationTarget, deps: SecurityAuditDependencies): boolean {
  switch (target) {
    case "business_factory_audit":
      return !!deps.businessFactoryAudit;
    case "production_certification_core":
      return !!deps.productionCertificationCore;
    case "authentication_worker":
      return !!deps.authenticationWorker;
    case "authorization_worker":
      return !!deps.authorizationWorker;
    case "authority_matrix":
      return !!deps.authorityMatrix;
    case "api_runtime":
      return !!deps.apiRuntime;
    case "tool_runtime":
      return !!deps.toolRuntime;
    case "monitoring_runtime":
      return !!deps.monitoringRuntime;
    case "audit_runtime":
      return !!deps.auditRuntime;
    case "executive_reporting_runtime":
      return !!deps.executiveReportingRuntime;
    case "shared_runtime_core":
      return !!deps.sharedRuntimeCore;
    case "worker_registry":
      return !!deps.workerRegistry;
    case "pillow_orchestration_runtime":
      return !!deps.pillowOrchestrationRuntime;
    default:
      return false;
  }
}

/** Verifies integration wiring strictly from injected dependency presence. */
export function verifyIntegrations(deps: SecurityAuditDependencies): IntegrationVerification {
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
