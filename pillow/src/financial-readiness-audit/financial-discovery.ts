import { safeCall } from "./evidence-collector.js";
import {
  ALL_FINANCIAL_COMPONENT_KEYS,
  FINANCIAL_COMPONENT_LABELS,
  FINANCIAL_COMPONENT_TYPES,
} from "./paths.js";
import type { FinancialReadinessAuditDependencies } from "./integrations.js";
import type { AllFinancialComponentKey, DiscoveredFinancialComponentRecord, FinancialComponentDiscoveryResult } from "./types.js";

export function handleFor(
  componentKey: AllFinancialComponentKey,
  deps: FinancialReadinessAuditDependencies,
): object | null | undefined {
  switch (componentKey) {
    case "commerce-factory-core":
      return deps.commerceFactoryCore;
    case "payment-gateway-integration":
      return deps.paymentGatewayIntegration;
    case "billing-worker":
      return deps.billingWorker;
    case "revenue-engine":
      return deps.revenueEngine;
    case "expense-engine":
      return deps.expenseEngine;
    case "accounting-worker":
      return deps.accountingWorker;
    case "financial-reporting-worker":
      return deps.financialReportingWorker;
    case "profit-calculation-engine":
      return deps.profitCalculationEngine;
    case "audit-runtime":
      return deps.auditRuntime;
    case "executive-reporting-runtime":
      return deps.executiveReportingRuntime;
    case "production-certification-core":
      return deps.productionCertificationCore;
    case "api-runtime":
      return deps.apiRuntime;
    case "monitoring-runtime":
      return deps.monitoringRuntime;
    case "refund-engine":
      return deps.refundEngine;
    case "reconciliation-engine":
      return deps.reconciliationEngine;
    case "capital-factory-core":
      return deps.capitalFactoryCore;
    case "financial-operations-certification":
      return deps.financialOperationsCertification;
    case "financial-risk-monitor":
      return deps.financialRiskMonitor;
    default:
      return null;
  }
}

function healthStatusFor(handle: { getState?: () => unknown } | null | undefined): string | null {
  if (!handle || typeof handle.getState !== "function") return null;
  const state = safeCall(() => handle.getState!()) as { status?: string; health?: { status?: string } } | null;
  return state?.health?.status ?? state?.status ?? null;
}

/**
 * Discovers financial components strictly from the fixed, evidence-backed
 * `ALL_FINANCIAL_COMPONENT_KEYS` catalog by checking injected dependency
 * presence only. A component is never reported "discovered" unless its
 * corresponding handle was actually injected — nothing is invented beyond
 * this catalog.
 */
export function collectFinancialComponentDiscovery(
  deps: FinancialReadinessAuditDependencies,
): FinancialComponentDiscoveryResult {
  const components: DiscoveredFinancialComponentRecord[] = ALL_FINANCIAL_COMPONENT_KEYS.map((componentKey) => {
    const handle = handleFor(componentKey, deps);
    const bound = handle != null;
    return {
      componentKey,
      componentName: FINANCIAL_COMPONENT_LABELS[componentKey],
      componentType: FINANCIAL_COMPONENT_TYPES[componentKey],
      bound,
      healthStatus: bound ? healthStatusFor(handle as { getState?: () => unknown }) : null,
      evidencePresent: bound,
    };
  });

  const discoveredCount = components.filter((c) => c.bound).length;

  return {
    discoveredAt: new Date().toISOString(),
    discoveredCount,
    totalCatalogued: components.length,
    components,
    evidence: [
      `discoveredCount=${discoveredCount}/${components.length}`,
      ...components.map((c) => `${c.componentKey}:${c.bound ? "bound" : "unavailable"}`),
    ],
  };
}
