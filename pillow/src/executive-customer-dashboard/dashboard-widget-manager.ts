/** R4-18 — Dashboard widget manager. */

import type { ExecutiveCustomerDashboardConfiguration } from "./configuration.js";
import type {
  CustomerDashboardSnapshot,
  DashboardCustomerData,
  DashboardWidget,
  WidgetType,
} from "./types.js";

export class DashboardWidgetManager {
  buildWidgets(
    snapshot: CustomerDashboardSnapshot,
    data: DashboardCustomerData,
    config: ExecutiveCustomerDashboardConfiguration,
    filterTypes?: WidgetType[],
  ): DashboardWidget[] {
    const types = filterTypes ?? config.defaultWidgets;
    const now = new Date().toISOString();
    const status = data.warnings.length > 0 ? "degraded" : "ready";

    const all: DashboardWidget[] = [
      {
        widgetId: `ecd-widget-growth-${Date.now()}`,
        widgetType: "growth",
        label: "Customer Growth",
        value: snapshot.customerGrowthSummary.totalCustomers,
        status,
        lastUpdated: now,
      },
      {
        widgetId: `ecd-widget-activity-${Date.now()}`,
        widgetType: "activity",
        label: "Customer Activity",
        value: snapshot.customerActivitySummary.totalEvents,
        status,
        lastUpdated: now,
      },
      {
        widgetId: `ecd-widget-clv-${Date.now()}`,
        widgetType: "lifetime_value",
        label: "Average CLV",
        value: snapshot.customerLifetimeValueSummary.averageClv,
        status,
        lastUpdated: now,
      },
      {
        widgetId: `ecd-widget-seg-${Date.now()}`,
        widgetType: "segmentation",
        label: "Segmented Customers",
        value: snapshot.customerSegmentationSummary.assignedCustomers,
        status,
        lastUpdated: now,
      },
      {
        widgetId: `ecd-widget-sent-${Date.now()}`,
        widgetType: "sentiment",
        label: "Average Sentiment",
        value: snapshot.customerSentimentSummary.averageScore,
        status,
        lastUpdated: now,
      },
      {
        widgetId: `ecd-widget-loyalty-${Date.now()}`,
        widgetType: "loyalty",
        label: "Loyalty Members",
        value: snapshot.loyaltySummary.totalMembers,
        status,
        lastUpdated: now,
      },
      {
        widgetId: `ecd-widget-journey-${Date.now()}`,
        widgetType: "journey",
        label: "Journey Score",
        value: snapshot.journeySummary.averageJourneyScore,
        status,
        lastUpdated: now,
      },
      {
        widgetId: `ecd-widget-risk-${Date.now()}`,
        widgetType: "risk",
        label: "High Risk Customers",
        value: snapshot.customerRiskSummary.highRiskCustomers,
        status,
        lastUpdated: now,
      },
      {
        widgetId: `ecd-widget-support-${Date.now()}`,
        widgetType: "support",
        label: "Support Resolution Rate",
        value: `${snapshot.supportSummary.resolutionRatePercent}%`,
        status,
        lastUpdated: now,
      },
      {
        widgetId: `ecd-widget-kpi-${Date.now()}`,
        widgetType: "kpi",
        label: "Executive KPIs",
        value: snapshot.kpiSummary.kpis.length,
        status,
        lastUpdated: now,
      },
    ];

    return all.filter((w) => types.includes(w.widgetType));
  }
}
