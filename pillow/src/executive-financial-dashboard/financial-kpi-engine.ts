/** R3-16 — Financial KPI engine. */

import type { ExecutiveFinancialDashboardConfiguration } from "./configuration.js";
import type { DashboardFinancialData } from "./dashboard-data-source.js";
import type { ExecutiveKpi } from "./types.js";

export class FinancialKpiEngine {
  aggregate(data: DashboardFinancialData, config: ExecutiveFinancialDashboardConfiguration): ExecutiveKpi[] {
    const kpis: ExecutiveKpi[] = [];
    const rules = config.kpiRules.filter((r) => !config.kpiSelectionRulesEnabled || r.enabled);

    for (const rule of rules) {
      const kpi = this.buildKpi(rule.kpiId, rule.label, data);
      if (kpi) kpis.push(kpi);
    }

    return kpis;
  }

  private buildKpi(kpiId: string, label: string, data: DashboardFinancialData): ExecutiveKpi | null {
    switch (kpiId) {
      case "net_profit":
        return {
          kpiId,
          label,
          value: data.netProfit,
          unit: "USD",
          direction: data.netProfit >= 0 ? "up" : "down",
          changePercent: data.profitMarginPercent,
        };
      case "profit_margin":
        return {
          kpiId,
          label,
          value: data.profitMarginPercent,
          unit: "%",
          direction: data.profitMarginPercent >= 10 ? "up" : data.profitMarginPercent >= 0 ? "stable" : "down",
          changePercent: data.profitMarginPercent,
        };
      case "cash_flow":
        return {
          kpiId,
          label,
          value: data.netCashFlow,
          unit: "USD",
          direction: data.netCashFlow >= 0 ? "up" : "down",
          changePercent: 0,
        };
      case "budget_utilization":
        return {
          kpiId,
          label,
          value: data.budgetUtilization,
          unit: "%",
          direction: data.budgetUtilization >= 90 ? "down" : "stable",
          changePercent: data.budgetUtilization,
        };
      case "risk_score":
        return {
          kpiId,
          label,
          value: data.riskScore,
          unit: "score",
          direction: data.riskScore >= 65 ? "down" : "up",
          changePercent: data.riskScore,
        };
      default:
        return null;
    }
  }
}
