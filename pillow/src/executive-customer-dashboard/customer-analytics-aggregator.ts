/** R4-18 — Customer analytics aggregator. */

import type { DashboardCustomerData, ExecutiveCustomerKpi } from "./types.js";

export class CustomerAnalyticsAggregator {
  enrichSnapshotKpis(
    snapshot: { kpiSummary: { kpis: ExecutiveCustomerKpi[] } },
    kpis: ExecutiveCustomerKpi[],
  ): void {
    snapshot.kpiSummary = { kpis };
  }

  computeAlerts(data: DashboardCustomerData, thresholds: { highRisk: number; lowSentiment: number }) {
    const alerts: string[] = [];
    if (data.highRiskCustomers > 0 && data.averageRiskScore >= thresholds.highRisk) {
      alerts.push(`${data.highRiskCustomers} high-risk customer(s) detected`);
    }
    if (data.averageSentiment < thresholds.lowSentiment) {
      alerts.push(`Average sentiment below threshold (${data.averageSentiment})`);
    }
    if (data.dropOffDetected > 0) {
      alerts.push(`${data.dropOffDetected} journey drop-off(s) detected`);
    }
    return alerts;
  }
}
