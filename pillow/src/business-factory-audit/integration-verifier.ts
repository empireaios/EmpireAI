import { INTEGRATION_TARGETS } from "./paths.js";
import type { BusinessFactoryAuditDependencies } from "./integrations.js";
import type { IntegrationCheckRow, IntegrationTarget, IntegrationVerification } from "./types.js";

function isBound(target: IntegrationTarget, deps: BusinessFactoryAuditDependencies): boolean {
  switch (target) {
    case "pillow_command_audit":
      return !!deps.pillowCommandAudit;
    case "production_certification_core":
      return !!deps.productionCertificationCore;
    case "shared_runtime_core":
      return !!deps.sharedRuntimeCore;
    case "worker_registry":
      return !!deps.workerRegistry;
    case "empire_builder_factory_core":
      return !!deps.empireBuilderFactoryCore;
    case "commerce_factory_core":
      return !!deps.commerceFactoryCore;
    case "media_factory_core":
      return !!deps.mediaFactoryCore;
    case "digital_products_factory_core":
      return !!deps.digitalProductsFactoryCore;
    case "enterprise_platform_factory_core":
      return !!deps.enterprisePlatformFactoryCore;
    case "local_business_factory_core":
      return !!deps.localBusinessFactoryCore;
    case "affiliate_factory_core":
      return !!deps.affiliateFactoryCore;
    case "capital_factory_core":
      return !!deps.capitalFactoryCore;
    case "pillow_orchestration_runtime":
      return !!deps.pillowOrchestrationRuntime;
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
export function verifyIntegrations(deps: BusinessFactoryAuditDependencies): IntegrationVerification {
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
