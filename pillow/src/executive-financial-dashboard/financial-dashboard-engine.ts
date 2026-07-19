/** R3-16 — Financial dashboard engine. */

import type { ExecutiveFinancialDashboardConfiguration } from "./configuration.js";
import type { DashboardFinancialData } from "./dashboard-data-source.js";
import type { DashboardSnapshot, ExecutiveKpi } from "./types.js";
import { DashboardMetadataGenerator } from "./dashboard-metadata-generator.js";
import { FinancialKpiEngine } from "./financial-kpi-engine.js";
import { FinancialAnalyticsAggregator } from "./financial-analytics-aggregator.js";

export class FinancialDashboardEngine {
  private readonly metadataGenerator = new DashboardMetadataGenerator();
  private readonly kpiEngine = new FinancialKpiEngine();
  private readonly analyticsAggregator = new FinancialAnalyticsAggregator();

  buildSnapshot(
    data: DashboardFinancialData,
    config: ExecutiveFinancialDashboardConfiguration,
  ): DashboardSnapshot {
    const kpis = this.kpiEngine.aggregate(data, config);
    const trends = this.analyticsAggregator.buildTrends(data, kpis);

    return this.metadataGenerator.buildSnapshot({
      revenueSummary: { total: data.totalRevenue, count: data.revenueCount, currency: "USD" },
      expenseSummary: { total: data.totalExpenses, count: data.expenseCount, currency: "USD" },
      profitSummary: {
        netProfit: data.netProfit,
        marginPercent: data.profitMarginPercent,
        currency: "USD",
      },
      cashFlowSummary: {
        netCashFlow: data.netCashFlow,
        liquidity: data.liquidity,
        currency: "USD",
      },
      budgetSummary: {
        totalAllocation: data.budgetAllocation,
        utilizationPercent: data.budgetUtilization,
        count: data.budgetCount,
      },
      forecastSummary: {
        revenueForecast: data.revenueForecast,
        expenseForecast: data.expenseForecast,
        confidence: data.forecastConfidence,
      },
      financialRiskSummary: {
        riskScore: data.riskScore,
        activeAlerts: data.activeAlerts,
        status: data.riskStatus,
      },
      kpiSummary: { kpis },
      trendSummary: { trends },
    });
  }

  buildExecutiveSummary(snapshot: DashboardSnapshot): string {
    return [
      `Revenue: ${snapshot.revenueSummary.total} (${snapshot.revenueSummary.count} records)`,
      `Expenses: ${snapshot.expenseSummary.total}`,
      `Profit: ${snapshot.profitSummary.netProfit} (${snapshot.profitSummary.marginPercent}% margin)`,
      `Cash Flow: ${snapshot.cashFlowSummary.netCashFlow}`,
      `Budget Utilization: ${snapshot.budgetSummary.utilizationPercent}%`,
      `Risk Score: ${snapshot.financialRiskSummary.riskScore}`,
    ].join(" · ");
  }
}
