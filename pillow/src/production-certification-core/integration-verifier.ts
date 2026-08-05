import { INTEGRATION_TARGETS } from "./paths.js";
import type { ProductionCertificationCoreDependencies } from "./integrations.js";
import type { IntegrationCheckRow, IntegrationTarget, IntegrationVerification } from "./types.js";

function isBound(target: IntegrationTarget, deps: ProductionCertificationCoreDependencies): boolean {
  switch (target) {
    case "shared-runtime-core":
    case "shared-runtime-core-factories":
      return !!deps.sharedRuntimeCore;
    case "shared-runtime-certification":
      return !!deps.sharedRuntimeCertification;
    case "worker_registry":
      return !!deps.workerRegistry;
    case "worker_lifecycle":
      return !!deps.workerLifecycle;
    case "audit_runtime":
      return !!deps.auditRuntime;
    case "monitoring_runtime":
      return !!deps.monitoringRuntime;
    case "approval_runtime":
      return !!deps.approvalRuntime;
    case "recovery_runtime":
      return !!deps.recoveryRuntime;
    case "executive_reporting_runtime":
      return !!deps.executiveReportingRuntime;
    case "worker_recovery_system":
      return !!deps.workerRecoverySystem;
    default:
      return false;
  }
}

/** Verifies integration wiring strictly from injected dependency presence. */
export function verifyIntegrations(
  deps: ProductionCertificationCoreDependencies,
): IntegrationVerification {
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
