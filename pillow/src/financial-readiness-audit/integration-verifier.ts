import { INTEGRATION_TARGETS } from "./paths.js";
import type { FinancialReadinessAuditDependencies } from "./integrations.js";
import type { IntegrationCheckRow, IntegrationTarget, IntegrationVerification } from "./types.js";

function isBound(target: IntegrationTarget, deps: FinancialReadinessAuditDependencies): boolean {
  switch (target) {
    case "recovery_audit":
      return !!deps.recoveryAudit;
    case "production_certification_core":
      return !!deps.productionCertificationCore;
    case "commerce_factory_core":
      return !!deps.commerceFactoryCore;
    case "payment_gateway_integration":
      return !!deps.paymentGatewayIntegration;
    case "billing_worker":
      return !!deps.billingWorker;
    case "revenue_engine":
      return !!deps.revenueEngine;
    case "expense_engine":
      return !!deps.expenseEngine;
    case "accounting_worker":
      return !!deps.accountingWorker;
    case "financial_reporting_worker":
      return !!deps.financialReportingWorker;
    case "profit_calculation_engine":
      return !!deps.profitCalculationEngine;
    case "refund_engine":
      return !!deps.refundEngine;
    case "reconciliation_engine":
      return !!deps.reconciliationEngine;
    case "financial_operations_certification":
      return !!deps.financialOperationsCertification;
    case "capital_factory_core":
      return !!deps.capitalFactoryCore;
    case "api_runtime":
      return !!deps.apiRuntime;
    case "audit_runtime":
      return !!deps.auditRuntime;
    case "monitoring_runtime":
      return !!deps.monitoringRuntime;
    case "executive_reporting_runtime":
      return !!deps.executiveReportingRuntime;
    case "shared_runtime_core":
      return !!deps.sharedRuntimeCore;
    case "worker_registry":
      return !!deps.workerRegistry;
    default:
      return false;
  }
}

export function verifyIntegrations(deps: FinancialReadinessAuditDependencies): IntegrationVerification {
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
