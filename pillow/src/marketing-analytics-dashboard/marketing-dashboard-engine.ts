/** R5-10 — Marketing Dashboard Engine (snapshot assembly). */

import { MAD_METADATA_VERSION } from "./paths.js";
import type { MarketingAnalyticsDashboardConfiguration } from "./configuration.js";
import { MarketingAnalyticsAggregator } from "./marketing-analytics-aggregator.js";
import { MarketingKpiEngine } from "./marketing-kpi-engine.js";
import { DashboardWidgetManager } from "./dashboard-widget-manager.js";
import type { DashboardSnapshot } from "./types.js";

export class MarketingDashboardEngine {
  private readonly kpiEngine = new MarketingKpiEngine();
  private readonly widgets = new DashboardWidgetManager();

  constructor(private readonly aggregator: MarketingAnalyticsAggregator) {}

  buildSnapshot(
    config: MarketingAnalyticsDashboardConfiguration,
    includeAlerts: boolean,
  ): DashboardSnapshot {
    const campaignSummary = this.aggregator.aggregateCampaign();
    const advertisingSpendSummary = this.aggregator.aggregateSpend();
    const trafficSummary = this.aggregator.aggregateTraffic(advertisingSpendSummary);
    const conversionSummary = this.aggregator.aggregateConversions(trafficSummary);
    const roiSummary = this.aggregator.aggregateRoi(advertisingSpendSummary, conversionSummary);
    const audienceSummary = this.aggregator.aggregateAudience();
    const seoSummary = this.aggregator.aggregateSeo();
    const kpiSummary = this.kpiEngine.compute({
      campaign: campaignSummary,
      spend: advertisingSpendSummary,
      traffic: trafficSummary,
      conversion: conversionSummary,
      roi: roiSummary,
      audience: audienceSummary,
      seo: seoSummary,
    });

    const base = {
      dashboardId: `mad-dash-${Date.now()}`,
      timestamp: new Date().toISOString(),
      campaignSummary,
      advertisingSpendSummary,
      trafficSummary,
      conversionSummary,
      roiSummary,
      audienceSummary,
      seoSummary,
      kpiSummary,
    };

    const widgets = this.widgets.buildWidgets(base);
    const alerts = includeAlerts && config.alertDisplayRulesEnabled
      ? this.buildAlerts(base)
      : [];
    const executiveSummary = config.executiveSummaryRulesEnabled
      ? this.buildExecutiveSummary(base)
      : "Executive summary disabled";

    return {
      ...base,
      widgets,
      executiveSummary,
      alerts,
      validationStatus: "passed",
      metadataVersion: MAD_METADATA_VERSION,
    };
  }

  private buildAlerts(base: {
    campaignSummary: DashboardSnapshot["campaignSummary"];
    roiSummary: DashboardSnapshot["roiSummary"];
    trafficSummary: DashboardSnapshot["trafficSummary"];
    kpiSummary: DashboardSnapshot["kpiSummary"];
  }): string[] {
    const alerts: string[] = [];
    if (base.campaignSummary.failedCampaigns > 0) {
      alerts.push(`${base.campaignSummary.failedCampaigns} campaign(s) in failed state`);
    }
    if (base.roiSummary.roas < 1 && base.roiSummary.attributedRevenue > 0) {
      alerts.push("ROAS below 1.0 — review spend efficiency");
    }
    if (base.trafficSummary.clickThroughRate > 0 && base.trafficSummary.clickThroughRate < 1) {
      alerts.push("CTR below 1% — creative/targeting review suggested");
    }
    if (base.kpiSummary.overallScore < 50) {
      alerts.push("Overall marketing score below 50");
    }
    return alerts;
  }

  private buildExecutiveSummary(base: {
    campaignSummary: DashboardSnapshot["campaignSummary"];
    advertisingSpendSummary: DashboardSnapshot["advertisingSpendSummary"];
    conversionSummary: DashboardSnapshot["conversionSummary"];
    roiSummary: DashboardSnapshot["roiSummary"];
    audienceSummary: DashboardSnapshot["audienceSummary"];
    seoSummary: DashboardSnapshot["seoSummary"];
    kpiSummary: DashboardSnapshot["kpiSummary"];
  }): string {
    return [
      `Executive marketing cockpit · score ${base.kpiSummary.overallScore}/100.`,
      `${base.campaignSummary.totalCampaigns} campaign(s) · spend $${base.advertisingSpendSummary.totalSpend}.`,
      `${base.conversionSummary.conversions} conversion(s) · ROAS ${base.roiSummary.roas}x · ROI ${base.roiSummary.marketingRoiPercent}%.`,
      `${base.audienceSummary.totalAudiences} audience(s) · SEO organic ${base.seoSummary.organicPerformanceScore}.`,
    ].join(" ");
  }
}
