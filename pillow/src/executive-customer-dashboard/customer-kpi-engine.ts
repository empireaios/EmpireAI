/** R4-18 — Customer KPI Engine. */

import type { ExecutiveCustomerDashboardConfiguration } from "./configuration.js";
import type { DashboardCustomerData, ExecutiveCustomerKpi } from "./types.js";

export class CustomerKpiEngine {
  aggregate(
    data: DashboardCustomerData,
    config: ExecutiveCustomerDashboardConfiguration,
  ): ExecutiveCustomerKpi[] {
    if (!config.kpiSelectionRulesEnabled) return [];

    const kpis: ExecutiveCustomerKpi[] = [];
    const resolutionRate =
      data.totalSupportRecords > 0
        ? Math.round((data.resolvedSupportCount / data.totalSupportRecords) * 100)
        : 0;

    const candidates: ExecutiveCustomerKpi[] = [
      {
        kpiId: "total_customers",
        label: "Total Customers",
        value: data.totalCustomers,
        unit: "customers",
        direction: data.newCustomers > 0 ? "up" : "stable",
        changePercent: data.totalCustomers > 0 ? Math.round((data.newCustomers / data.totalCustomers) * 100) : 0,
      },
      {
        kpiId: "avg_clv",
        label: "Average CLV",
        value: Math.round(data.averageClv * 100) / 100,
        unit: "currency",
        direction: data.averageClv >= 500 ? "up" : data.averageClv < 100 ? "down" : "stable",
        changePercent: 0,
      },
      {
        kpiId: "avg_sentiment",
        label: "Average Sentiment",
        value: Math.round(data.averageSentiment),
        unit: "score",
        direction: data.averageSentiment >= 60 ? "up" : data.averageSentiment < 40 ? "down" : "stable",
        changePercent: 0,
      },
      {
        kpiId: "high_risk_count",
        label: "High Risk Customers",
        value: data.highRiskCustomers,
        unit: "customers",
        direction: data.highRiskCustomers > 0 ? "down" : "stable",
        changePercent: data.highRiskCustomers,
      },
      {
        kpiId: "support_resolution_rate",
        label: "Support Resolution Rate",
        value: resolutionRate,
        unit: "percent",
        direction: resolutionRate >= 80 ? "up" : resolutionRate < 50 ? "down" : "stable",
        changePercent: resolutionRate,
      },
    ];

    for (const rule of config.kpiRules) {
      if (!rule.enabled) continue;
      const kpi = candidates.find((c) => c.kpiId === rule.kpiId);
      if (kpi) kpis.push({ ...kpi, label: rule.label });
    }

    return kpis;
  }
}
