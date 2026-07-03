/**
 * G7-05 — Cockpit Grand King Revenue & Financial Operations backend contracts.
 */

import type {
  AdvertisingRoiSummary,
  CashPositionSummary,
  FinancialKpiSnapshot,
  FinancialOperationsOverview,
  FinancialRecord,
  PayoutStatusSummary,
  ProfitabilityReport,
  SubscriptionMetricsSummary,
} from "./financial-operations-types.js";

export const COCKPIT_REVENUE_FINANCIAL_OPERATIONS_VIEW_ID =
  "cockpit-grand-king-revenue-financial-operations" as const;

export type CockpitRevenueFinancialOperationsView = {
  viewId: typeof COCKPIT_REVENUE_FINANCIAL_OPERATIONS_VIEW_ID;
  computedAt: string;
  dataMode: "financial";
  financialDashboard: FinancialOperationsOverview;
  revenueDashboard: {
    grossRevenue: number;
    netRevenue: number;
    recordsByDomain: Array<{ domainId: string; netAmount: number }>;
  };
  profitDashboard: ProfitabilityReport;
  cashFlow: CashPositionSummary;
  payoutStatus: PayoutStatusSummary;
  advertisingRoi: AdvertisingRoiSummary;
  executiveFinancialSummary: string;
  financialKpis: FinancialKpiSnapshot;
  recentRecords: Array<Pick<FinancialRecord, "financialRecordId" | "providerId" | "transactionType" | "netAmount" | "status">>;
  discoverySource: "grand-king-revenue-financial-operations:cockpit";
  designLanguage: "g4-cockpit";
};

export function buildCockpitRevenueFinancialOperationsView(input: {
  overview: FinancialOperationsOverview;
  kpis: FinancialKpiSnapshot;
  profitability: ProfitabilityReport;
  cashPosition: CashPositionSummary;
  payoutStatus: PayoutStatusSummary;
  advertisingRoi: AdvertisingRoiSummary;
  subscriptionMetrics: SubscriptionMetricsSummary;
  records: FinancialRecord[];
  executiveFinancialSummary: string;
}): CockpitRevenueFinancialOperationsView {
  const revenueDomains = input.records
    .filter((r) => r.transactionType === "revenue" || r.transactionType === "subscription")
    .reduce<Map<string, number>>((acc, record) => {
      acc.set(record.domainId, (acc.get(record.domainId) ?? 0) + record.netAmount);
      return acc;
    }, new Map());

  return {
    viewId: COCKPIT_REVENUE_FINANCIAL_OPERATIONS_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "financial",
    financialDashboard: input.overview,
    revenueDashboard: {
      grossRevenue: input.kpis.grossRevenue,
      netRevenue: input.kpis.netRevenue,
      recordsByDomain: [...revenueDomains.entries()].map(([domainId, netAmount]) => ({ domainId, netAmount })),
    },
    profitDashboard: input.profitability,
    cashFlow: input.cashPosition,
    payoutStatus: input.payoutStatus,
    advertisingRoi: input.advertisingRoi,
    executiveFinancialSummary: input.executiveFinancialSummary,
    financialKpis: input.kpis,
    recentRecords: input.records.slice(0, 10).map((r) => ({
      financialRecordId: r.financialRecordId,
      providerId: r.providerId,
      transactionType: r.transactionType,
      netAmount: r.netAmount,
      status: r.status,
    })),
    discoverySource: "grand-king-revenue-financial-operations:cockpit",
    designLanguage: "g4-cockpit",
  };
}
