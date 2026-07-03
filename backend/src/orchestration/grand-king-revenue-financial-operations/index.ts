/**
 * G7-05 — Grand King Revenue & Financial Operations public surface.
 */

import { resetRegistryLoaderForTests } from "../../registry/registry-loader.js";
import { resetProductionWorkspaceRegistryBatchForTests } from "../../registry/sources/production-workspace-source.js";
import { resetFinancialObservationStoreForTests } from "./ekls/financial-operations-observation-store.js";
import { resetFinancialOperationsPluginHostForTests } from "./plugins/financial-operations-plugin-host.js";
import { resetFinancialLedgerForTests } from "./services/financial-ledger.js";
import { resetFinancialOperationsStateForTests } from "./services/grand-king-revenue-financial-operations-service.js";

export {
  GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_VERSION,
  FINANCIAL_DOMAIN_IDS,
  FINANCIAL_STATUSES,
  FINANCIAL_TRANSACTION_TYPES,
  FINANCIAL_EKLS_KINDS,
  RECONCILIATION_STATUSES,
  VALID_FINANCIAL_STATUS_TRANSITIONS,
  type FinancialDomainId,
  type FinancialStatus,
  type FinancialTransactionType,
  type ReconciliationStatus,
  type FinancialRecord,
  type FinancialKpiSnapshot,
  type FinancialOperationsOverview,
  type ProfitabilityReport,
  type CashPositionSummary,
  type PayoutStatusSummary,
  type SubscriptionMetricsSummary,
  type AdvertisingRoiSummary,
  type FinancialRiskRegister,
  type FinancialEklsKind,
  type FinancialOperationsPluginManifest,
  isValidFinancialStatusTransition,
  redactFinancialSecrets,
} from "./contracts/financial-operations-types.js";

export {
  COCKPIT_REVENUE_FINANCIAL_OPERATIONS_VIEW_ID,
  buildCockpitRevenueFinancialOperationsView,
  type CockpitRevenueFinancialOperationsView,
} from "./contracts/financial-operations-cockpit-contracts.js";

export {
  GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_MODULE_ID,
  GRAND_KING_REVENUE_FINANCIAL_OPERATIONS_CAPABILITIES,
  createGrandKingRevenueFinancialOperationsModuleContract,
  type GrandKingRevenueFinancialOperationsCapability,
  type GrandKingRevenueFinancialOperationsModuleContract,
} from "./contract/financial-operations-module.js";

export {
  resolveFinancialPolicies,
  resolveFinancialOperationDependencies,
  listFinancialOperationsRegistryIds,
  deriveRateSignalFromRef,
  resolveDomainForProvider,
  resolveTransactionTypeForDomain,
} from "./registry/financial-operations-registry-resolver.js";

export {
  validateFinancialOperationsPillowGovernance,
  type FinancialOperationsPillowContext,
  type FinancialOperationsPillowResult,
} from "./governance/financial-operations-pillow-governance.js";

export {
  recordFinancialEklsObservation,
  searchFinancialEklsObservations,
  listFinancialEklsKinds,
} from "./ekls/financial-operations-ekls-integration.js";

export { aggregateRevenue } from "./services/revenue-aggregation-engine.js";
export { aggregateExpenses } from "./services/expense-aggregation-engine.js";
export { computeProfitability } from "./services/profitability-engine.js";
export { trackPayouts } from "./services/payout-tracker.js";
export { trackSubscriptions } from "./services/subscription-tracker.js";
export { trackAdvertisingSpend } from "./services/advertising-spend-tracker.js";
export { trackRefunds } from "./services/refund-tracker.js";
export { aggregateFinancialKpis } from "./services/financial-kpi-engine.js";
export {
  buildExecutiveFinanceDashboard,
  buildFinancialRiskRegister,
  getCashPosition,
  getExecutiveFinancialSummary,
} from "./services/executive-finance-dashboard.js";
export {
  appendFinancialRecord,
  getFinancialRecord,
  listFinancialRecords,
  transitionFinancialRecordStatus,
} from "./services/financial-ledger.js";

export {
  initializeFinancialOperations,
  getFinancialOperationsOverview,
  reconcileFinancialRecord,
  getFinancialHealth,
  getFinancialStatus,
  listFinancialRecords as listFinancialLedgerRecords,
} from "./services/grand-king-revenue-financial-operations-service.js";

export {
  registerFinancialOperationsPlugin,
  listFinancialOperationsPlugins,
} from "./plugins/financial-operations-plugin-host.js";

export { grandKingRevenueFinancialOperationsTools } from "./tools/financial-operations-tools.js";

export function resetGrandKingRevenueFinancialOperationsHarnessForTests(): void {
  resetRegistryLoaderForTests();
  resetProductionWorkspaceRegistryBatchForTests();
  resetFinancialOperationsStateForTests();
  resetFinancialLedgerForTests();
  resetFinancialObservationStoreForTests();
  resetFinancialOperationsPluginHostForTests();
  delete process.env.FINANCIAL_ANOMALY_SIGNAL;
}
