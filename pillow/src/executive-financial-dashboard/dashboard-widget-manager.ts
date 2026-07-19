/** R3-16 — Dashboard widget manager. */

import type { ExecutiveFinancialDashboardConfiguration } from "./configuration.js";
import type { DashboardFinancialData } from "./dashboard-data-source.js";
import type { DashboardSnapshot, DashboardWidget, WidgetType } from "./types.js";

export class DashboardWidgetManager {
  buildWidgets(
    snapshot: DashboardSnapshot,
    data: DashboardFinancialData,
    config: ExecutiveFinancialDashboardConfiguration,
    requestedTypes?: WidgetType[],
  ): DashboardWidget[] {
    const types = requestedTypes ?? config.defaultWidgets;
    const now = new Date().toISOString();
    const widgets: DashboardWidget[] = [];

    for (const type of types) {
      const widget = this.buildWidget(type, snapshot, data, now);
      if (widget) widgets.push(widget);
    }

    return widgets;
  }

  private buildWidget(
    type: WidgetType,
    snapshot: DashboardSnapshot,
    data: DashboardFinancialData,
    now: string,
  ): DashboardWidget | null {
    const base = {
      widgetId: `efd-widget-${type}-${Date.now()}`,
      widgetType: type,
      lastUpdated: now,
    };

    switch (type) {
      case "revenue":
        return {
          ...base,
          label: "Revenue",
          value: snapshot.revenueSummary.total,
          status: data.revenueCount > 0 ? "ready" : "degraded",
        };
      case "expense":
        return {
          ...base,
          label: "Expenses",
          value: snapshot.expenseSummary.total,
          status: data.expenseCount > 0 ? "ready" : "degraded",
        };
      case "profit":
        return {
          ...base,
          label: "Net Profit",
          value: snapshot.profitSummary.netProfit,
          status: "ready",
        };
      case "cash_flow":
        return {
          ...base,
          label: "Cash Flow",
          value: snapshot.cashFlowSummary.netCashFlow,
          status: "ready",
        };
      case "liquidity":
        return {
          ...base,
          label: "Liquidity",
          value: snapshot.cashFlowSummary.liquidity,
          status: "ready",
        };
      case "budget":
        return {
          ...base,
          label: "Budget Utilization",
          value: `${snapshot.budgetSummary.utilizationPercent}%`,
          status: data.budgetCount > 0 ? "ready" : "unavailable",
        };
      case "forecast":
        return {
          ...base,
          label: "Revenue Forecast",
          value: snapshot.forecastSummary.revenueForecast,
          status: snapshot.forecastSummary.confidence > 0 ? "ready" : "unavailable",
        };
      case "risk":
        return {
          ...base,
          label: "Risk Score",
          value: snapshot.financialRiskSummary.riskScore,
          status: snapshot.financialRiskSummary.riskScore > 0 ? "ready" : "unavailable",
        };
      case "kpi":
        return {
          ...base,
          label: "KPI Count",
          value: snapshot.kpiSummary.kpis.length,
          status: snapshot.kpiSummary.kpis.length > 0 ? "ready" : "degraded",
        };
      case "trend":
        return {
          ...base,
          label: "Trend Count",
          value: snapshot.trendSummary.trends.length,
          status: snapshot.trendSummary.trends.length > 0 ? "ready" : "degraded",
        };
      default:
        return null;
    }
  }
}
