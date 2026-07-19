/** R5-10 — Dashboard Widget Manager. */

import type {
  DashboardSnapshot,
  DashboardWidget,
  DashboardWidgetId,
} from "./types.js";

export class DashboardWidgetManager {
  buildWidgets(snapshot: Omit<DashboardSnapshot, "widgets" | "executiveSummary" | "alerts" | "validationStatus" | "metadataVersion"> & {
    alerts?: string[];
  }): DashboardWidget[] {
    const now = new Date().toISOString();
    const defs: Array<{
      widgetType: DashboardWidgetId;
      title: string;
      value: number | string;
      unit: string;
      status: DashboardWidget["status"];
    }> = [
      {
        widgetType: "campaign_performance",
        title: "Campaign Performance",
        value: snapshot.campaignSummary.activeCampaigns,
        unit: "active",
        status: snapshot.campaignSummary.totalCampaigns > 0 ? "ok" : "empty",
      },
      {
        widgetType: "advertising_spend",
        title: "Advertising Spend",
        value: snapshot.advertisingSpendSummary.totalSpend,
        unit: "USD",
        status: snapshot.advertisingSpendSummary.totalSpend > 0 ? "ok" : "warning",
      },
      {
        widgetType: "impressions",
        title: "Impressions",
        value: snapshot.trafficSummary.impressions,
        unit: "count",
        status: snapshot.trafficSummary.impressions > 0 ? "ok" : "empty",
      },
      {
        widgetType: "clicks",
        title: "Clicks",
        value: snapshot.trafficSummary.clicks,
        unit: "count",
        status: snapshot.trafficSummary.clicks > 0 ? "ok" : "empty",
      },
      {
        widgetType: "ctr",
        title: "Click-Through Rate",
        value: snapshot.trafficSummary.clickThroughRate,
        unit: "%",
        status: snapshot.trafficSummary.clickThroughRate >= 1 ? "ok" : "warning",
      },
      {
        widgetType: "conversions",
        title: "Conversions",
        value: snapshot.conversionSummary.conversions,
        unit: "count",
        status: snapshot.conversionSummary.conversions > 0 ? "ok" : "warning",
      },
      {
        widgetType: "roas",
        title: "ROAS",
        value: snapshot.roiSummary.roas,
        unit: "x",
        status: snapshot.roiSummary.roas >= 1 ? "ok" : "critical",
      },
      {
        widgetType: "marketing_roi",
        title: "Marketing ROI",
        value: snapshot.roiSummary.marketingRoiPercent,
        unit: "%",
        status: snapshot.roiSummary.marketingRoiPercent >= 0 ? "ok" : "critical",
      },
      {
        widgetType: "audience_performance",
        title: "Audience Performance",
        value: snapshot.audienceSummary.averageQualityScore,
        unit: "score",
        status: snapshot.audienceSummary.totalAudiences > 0 ? "ok" : "empty",
      },
      {
        widgetType: "seo_performance",
        title: "SEO Performance",
        value: snapshot.seoSummary.organicPerformanceScore,
        unit: "score",
        status: snapshot.seoSummary.keywordsTracked > 0 ? "ok" : "empty",
      },
      {
        widgetType: "executive_summary",
        title: "Overall Marketing Score",
        value: snapshot.kpiSummary.overallScore,
        unit: "score",
        status: snapshot.kpiSummary.overallScore >= 60 ? "ok" : "warning",
      },
    ];

    return defs.map((d) => ({
      widgetId: `mad-widget-${d.widgetType}`,
      widgetType: d.widgetType,
      title: d.title,
      value: d.value,
      unit: d.unit,
      status: d.status,
      refreshedAt: now,
    }));
  }
}
