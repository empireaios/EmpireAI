/** R4-18 — Customer Dashboard Engine. */

import { ECD_METADATA_VERSION } from "./paths.js";
import type { ExecutiveCustomerDashboardConfiguration } from "./configuration.js";
import type { CustomerDashboardSnapshot, DashboardCustomerData } from "./types.js";

export function buildDashboardId(): string {
  return `ecd-dash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class CustomerDashboardEngine {
  buildSnapshot(
    data: DashboardCustomerData,
    _config: ExecutiveCustomerDashboardConfiguration,
  ): CustomerDashboardSnapshot {
    const growthRatePercent =
      data.totalCustomers > 0 ? Math.round((data.newCustomers / data.totalCustomers) * 100) : 0;

    return {
      dashboardId: buildDashboardId(),
      timestamp: new Date().toISOString(),
      customerGrowthSummary: {
        totalCustomers: data.totalCustomers,
        newCustomers: data.newCustomers,
        growthRatePercent,
        trend: growthRatePercent > 5 ? "up" : growthRatePercent > 0 ? "stable" : "down",
      },
      customerActivitySummary: {
        totalEvents: data.totalEvents,
        purchaseEvents: data.purchaseEvents,
        supportEvents: data.supportEvents,
        communicationEvents: data.communicationEvents,
        activeCustomers: data.activeCustomers,
      },
      customerLifetimeValueSummary: {
        averageClv: Math.round(data.averageClv * 100) / 100,
        totalClv: Math.round(data.totalClv * 100) / 100,
        highValueCustomers: data.highValueCustomers,
        decliningValueCustomers: data.decliningValueCustomers,
      },
      customerSegmentationSummary: {
        totalSegments: data.totalSegments,
        assignedCustomers: data.assignedCustomers,
        topSegments: data.topSegments,
      },
      customerSentimentSummary: {
        averageScore: Math.round(data.averageSentiment * 100) / 100,
        positiveCount: data.positiveSentimentCount,
        negativeCount: data.negativeSentimentCount,
        neutralCount: data.neutralSentimentCount,
      },
      loyaltySummary: {
        totalMembers: data.loyaltyMembers,
        averagePoints: Math.round(data.averageLoyaltyPoints),
        tierDistribution: data.tierDistribution,
      },
      journeySummary: {
        journeysMapped: data.journeysMapped,
        averageJourneyScore: Math.round(data.averageJourneyScore),
        dropOffDetected: data.dropOffDetected,
        frictionDetected: data.frictionDetected,
      },
      customerRiskSummary: {
        averageRiskScore: Math.round(data.averageRiskScore),
        highRiskCustomers: data.highRiskCustomers,
        mediumRiskCustomers: data.mediumRiskCustomers,
        lowRiskCustomers: data.lowRiskCustomers,
      },
      supportSummary: {
        totalSupportRecords: data.totalSupportRecords,
        resolvedCount: data.resolvedSupportCount,
        openCount: data.openSupportCount,
        resolutionRatePercent:
          data.totalSupportRecords > 0
            ? Math.round((data.resolvedSupportCount / data.totalSupportRecords) * 100)
            : 0,
        averageResponseTimeMs: Math.round(data.averageResponseTimeMs),
      },
      kpiSummary: { kpis: [] },
      metadataVersion: ECD_METADATA_VERSION,
    };
  }

  buildExecutiveSummary(snapshot: CustomerDashboardSnapshot): string {
    return [
      `${snapshot.customerGrowthSummary.totalCustomers} customers (${snapshot.customerGrowthSummary.growthRatePercent}% growth)`,
      `Avg CLV ${snapshot.customerLifetimeValueSummary.averageClv}`,
      `Sentiment ${snapshot.customerSentimentSummary.averageScore}`,
      `${snapshot.customerRiskSummary.highRiskCustomers} high-risk customers`,
      `Support resolution ${snapshot.supportSummary.resolutionRatePercent}%`,
    ].join(" · ");
  }
}
