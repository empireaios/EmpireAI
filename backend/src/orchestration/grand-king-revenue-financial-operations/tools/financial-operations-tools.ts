/**
 * G7-05 — Grand King Revenue & Financial Operations Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import { buildCockpitRevenueFinancialOperationsView } from "../contracts/financial-operations-cockpit-contracts.js";
import {
  buildExecutiveFinanceDashboard,
  buildFinancialRiskRegister,
  getCashPosition,
  getExecutiveFinancialSummary,
  getFinancialHealth,
  getFinancialOperationsOverview,
  getFinancialStatus,
  initializeFinancialOperations,
  listFinancialRecords,
  aggregateFinancialKpis,
  computeProfitability,
  trackAdvertisingSpend,
  trackSubscriptions,
} from "../services/grand-king-revenue-financial-operations-service.js";
import { resolveFinancialOperationDependencies } from "../registry/financial-operations-registry-resolver.js";
import { trackPayouts } from "../services/payout-tracker.js";

export const grandKingRevenueFinancialOperationsTools: RegisteredTool[] = [
  {
    name: "financial_overview",
    description: "G7-05 — Grand King financial overview and Cockpit view",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => {
      const overview = getFinancialOperationsOverview();
      const dashboard = buildExecutiveFinanceDashboard();
      const summary = getExecutiveFinancialSummary();
      return {
        overview,
        cockpitView: buildCockpitRevenueFinancialOperationsView({
          overview,
          kpis: dashboard.kpis,
          profitability: dashboard.profitability,
          cashPosition: getCashPosition(),
          payoutStatus: dashboard.payouts,
          advertisingRoi: dashboard.advertising,
          subscriptionMetrics: dashboard.subscriptions,
          records: dashboard.records,
          executiveFinancialSummary: summary,
        }),
      };
    },
  },
  {
    name: "financial_summary",
    description: "G7-05 — Executive financial summary",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ summary: getExecutiveFinancialSummary() }),
  },
  {
    name: "financial_dashboard",
    description: "G7-05 — Executive finance dashboard",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => buildExecutiveFinanceDashboard(),
  },
  {
    name: "profitability_report",
    description: "G7-05 — Profitability report",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => computeProfitability(),
  },
  {
    name: "cash_position",
    description: "G7-05 — Cash position summary",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getCashPosition(),
  },
  {
    name: "advertising_roi",
    description: "G7-05 — Advertising ROI metrics",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => trackAdvertisingSpend(),
  },
  {
    name: "subscription_metrics",
    description: "G7-05 — Subscription metrics",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => trackSubscriptions(),
  },
  {
    name: "financial_risk_register",
    description: "G7-05 — Financial risk register",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => buildFinancialRiskRegister(),
  },
  {
    name: "financial_status",
    description: "G7-05 — Financial operations status",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getFinancialStatus(),
  },
  {
    name: "initialize_grand_king_revenue_financial_operations",
    description: "G7-05 — Initialize financial operations",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L2",
    parameters: { type: "object", properties: {} },
    handler: async () => initializeFinancialOperations(),
  },
  {
    name: "financial_dependencies",
    description: "G7-05 — Financial registry dependencies",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => resolveFinancialOperationDependencies(),
  },
  {
    name: "financial_health",
    description: "G7-05 — Financial health KPIs",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getFinancialHealth(),
  },
  {
    name: "financial_records",
    description: "G7-05 — List financial ledger records",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { financialRecordId: { type: "string" } },
    },
    handler: async (args) => {
      if (args.financialRecordId) {
        const { getFinancialRecord } = await import(
          "../services/grand-king-revenue-financial-operations-service.js"
        );
        const record = getFinancialRecord(String(args.financialRecordId));
        return record ? { record } : { error: "Record not found" };
      }
      return { records: listFinancialRecords(), kpis: aggregateFinancialKpis() };
    },
  },
  {
    name: "financial_payouts",
    description: "G7-05 — Payout status tracker",
    module: "grand-king-revenue-financial-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => trackPayouts(),
  },
];
