/** R5-10 — Marketing KPI Engine. */

import type {
  AdvertisingSpendSummary,
  AudienceSummary,
  CampaignSummary,
  ConversionSummary,
  KpiSummary,
  RoiSummary,
  SeoSummary,
  TrafficSummary,
} from "./types.js";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export class MarketingKpiEngine {
  compute(input: {
    campaign: CampaignSummary;
    spend: AdvertisingSpendSummary;
    traffic: TrafficSummary;
    conversion: ConversionSummary;
    roi: RoiSummary;
    audience: AudienceSummary;
    seo: SeoSummary;
  }): KpiSummary {
    const campaignPerformanceScore = clamp(
      input.campaign.totalCampaigns === 0
        ? 40
        : (input.campaign.activeCampaigns / Math.max(1, input.campaign.totalCampaigns)) * 70 +
            input.campaign.channelsConnected * 5,
    );
    const spendEfficiencyScore = clamp(
      input.spend.totalSpend <= 0
        ? 50
        : Math.min(100, (input.roi.attributedRevenue / Math.max(1, input.spend.totalSpend)) * 25),
    );
    const trafficScore = clamp(
      Math.min(100, input.traffic.clickThroughRate * 20 + Math.log10(input.traffic.impressions + 1) * 15),
    );
    const conversionScore = clamp(
      Math.min(100, input.conversion.conversionRate * 10 + input.conversion.conversions * 2),
    );
    const roiScore = clamp(
      Math.min(100, input.roi.roas * 20 + Math.max(0, input.roi.marketingRoiPercent) / 5),
    );
    const audienceScore = clamp(
      (input.audience.averageQualityScore + input.audience.averageEngagementScore) / 2,
    );
    const seoScore = clamp(
      (input.seo.averageRankingScore + input.seo.organicPerformanceScore) / 2,
    );
    const overallScore = clamp(
      campaignPerformanceScore * 0.15 +
        spendEfficiencyScore * 0.15 +
        trafficScore * 0.15 +
        conversionScore * 0.15 +
        roiScore * 0.15 +
        audienceScore * 0.15 +
        seoScore * 0.1,
    );

    return {
      campaignPerformanceScore,
      spendEfficiencyScore,
      trafficScore,
      conversionScore,
      roiScore,
      audienceScore,
      seoScore,
      overallScore,
    };
  }
}
