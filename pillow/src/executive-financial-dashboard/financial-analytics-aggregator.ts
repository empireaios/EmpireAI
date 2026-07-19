/** R3-16 — Financial analytics aggregator. */

import type { DashboardFinancialData } from "./dashboard-data-source.js";
import type { DashboardTrend, ExecutiveKpi } from "./types.js";

export class FinancialAnalyticsAggregator {
  buildTrends(data: DashboardFinancialData, kpis: ExecutiveKpi[]): DashboardTrend[] {
    const trends: DashboardTrend[] = [];

    trends.push({
      trendId: `efd-trend-${Date.now()}-rev`,
      metric: "revenue",
      direction: data.totalRevenue > 0 ? "up" : "stable",
      changePercent: data.totalRevenue > 0 ? 100 : 0,
      description: `Total revenue ${data.totalRevenue} from ${data.revenueCount} records`,
    });

    trends.push({
      trendId: `efd-trend-${Date.now()}-exp`,
      metric: "expense",
      direction: data.totalExpenses > data.totalRevenue * 0.8 ? "up" : "stable",
      changePercent: data.totalRevenue > 0 ? Math.round((data.totalExpenses / data.totalRevenue) * 100) : 0,
      description: `Total expenses ${data.totalExpenses} from ${data.expenseCount} records`,
    });

    trends.push({
      trendId: `efd-trend-${Date.now()}-profit`,
      metric: "profit",
      direction: data.netProfit >= 0 ? "up" : "down",
      changePercent: data.profitMarginPercent,
      description: `Net profit ${data.netProfit} (${data.profitMarginPercent}% margin)`,
    });

    trends.push({
      trendId: `efd-trend-${Date.now()}-cf`,
      metric: "cash_flow",
      direction: data.netCashFlow >= 0 ? "up" : "down",
      changePercent: 0,
      description: `Net cash flow ${data.netCashFlow}, liquidity ${data.liquidity}`,
    });

    if (data.forecastConfidence > 0) {
      trends.push({
        trendId: `efd-trend-${Date.now()}-fct`,
        metric: "forecast",
        direction: data.revenueForecast > data.expenseForecast ? "up" : "down",
        changePercent: data.forecastConfidence,
        description: `Forecast confidence ${data.forecastConfidence}%`,
      });
    }

    const riskKpi = kpis.find((k) => k.kpiId === "risk_score");
    if (riskKpi) {
      trends.push({
        trendId: `efd-trend-${Date.now()}-risk`,
        metric: "risk",
        direction: data.riskScore >= 65 ? "down" : "stable",
        changePercent: data.riskScore,
        description: `Risk score ${data.riskScore} with ${data.activeAlerts} active alerts`,
      });
    }

    return trends;
  }
}
