/** R4-18 — Customer dashboard data source (read-only upstream consumption). */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { AiCustomerSupport } from "../ai-customer-support/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { ReviewManagementEngine } from "../review-management-engine/engine.js";
import type { LoyaltyProgrammeEngine } from "../loyalty-programme-engine/engine.js";
import type { CustomerRiskEngine } from "../customer-risk-engine/engine.js";
import type { CustomerLifetimeValueEngine } from "../customer-lifetime-value-engine/engine.js";
import type { CustomerSegmentationEngine } from "../customer-segmentation-engine/engine.js";
import type { CustomerJourneyIntelligenceEngine } from "../customer-journey-intelligence-engine/engine.js";
import type { DashboardCustomerData } from "./types.js";

export class CustomerDashboardDataSource {
  constructor(
    private readonly identityEngine: CustomerIdentityEngine | null,
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
    private readonly aiCustomerSupport: AiCustomerSupport | null,
    private readonly sentimentEngine: CustomerSentimentEngine | null,
    private readonly reviewManagementEngine: ReviewManagementEngine | null,
    private readonly loyaltyProgrammeEngine: LoyaltyProgrammeEngine | null,
    private readonly customerRiskEngine: CustomerRiskEngine | null,
    private readonly customerLifetimeValueEngine: CustomerLifetimeValueEngine | null,
    private readonly customerSegmentationEngine: CustomerSegmentationEngine | null,
    private readonly customerJourneyIntelligenceEngine: CustomerJourneyIntelligenceEngine | null,
  ) {}

  aggregate(): DashboardCustomerData {
    const warnings: string[] = [];

    const identityRecords = this.identityEngine?.getCustomerRecords() ?? [];
    const crmRecords = this.crmFoundation?.getCrmRecords() ?? [];
    const totalCustomers = Math.max(identityRecords.length, crmRecords.length);
    const newCustomers = identityRecords.filter((r) => {
      const age = Date.now() - new Date(r.timestamp).getTime();
      return age < 30 * 24 * 60 * 60 * 1000;
    }).length;

    if (!this.identityEngine) warnings.push("Customer Identity Engine unavailable");
    if (!this.crmFoundation) warnings.push("CRM Foundation unavailable");

    const timelineEvents = this.timelineEngine?.getTimelineRecords() ?? [];
    const purchaseEvents = timelineEvents.filter((e) => e.eventType === "purchase").length;
    const supportEvents = timelineEvents.filter((e) => e.eventType === "support").length;
    const communicationEvents = timelineEvents.filter((e) => e.eventType === "communication").length;
    const activeCustomerIds = new Set(timelineEvents.map((e) => e.customerId));

    if (!this.timelineEngine) warnings.push("Customer Timeline Engine unavailable");

    const clvRecords =
      this.customerLifetimeValueEngine?.getClvRecords().filter((r) => r.validationStatus !== "failed") ??
      [];
    const averageClv =
      clvRecords.length > 0
        ? clvRecords.reduce((s, r) => s + r.lifetimeValue, 0) / clvRecords.length
        : 0;
    const totalClv = clvRecords.reduce((s, r) => s + r.lifetimeValue, 0);
    const highValueCustomers = clvRecords.filter((r) => r.lifetimeValue >= 500).length;
    const decliningValueCustomers = clvRecords.filter((r) => r.lifetimeValue < 100).length;

    if (!this.customerLifetimeValueEngine) warnings.push("Customer Lifetime Value Engine unavailable");

    const segmentationRecords = this.customerSegmentationEngine?.getSegmentationRecords() ?? [];
    const segments = this.customerSegmentationEngine?.getSegments() ?? [];
    const segmentCounts = new Map<string, number>();
    for (const record of segmentationRecords) {
      for (const seg of record.assignedSegments) {
        segmentCounts.set(seg, (segmentCounts.get(seg) ?? 0) + 1);
      }
    }
    const topSegments = [...segmentCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    if (!this.customerSegmentationEngine) warnings.push("Customer Segmentation Engine unavailable");

    const sentimentRecords = this.sentimentEngine?.getSentimentRecords() ?? [];
    const averageSentiment =
      sentimentRecords.length > 0
        ? sentimentRecords.reduce((s, r) => s + r.sentimentScore, 0) / sentimentRecords.length
        : 50;
    const positiveSentimentCount = sentimentRecords.filter((r) => r.sentimentScore >= 60).length;
    const negativeSentimentCount = sentimentRecords.filter((r) => r.sentimentScore < 40).length;
    const neutralSentimentCount =
      sentimentRecords.length - positiveSentimentCount - negativeSentimentCount;

    if (!this.sentimentEngine) warnings.push("Customer Sentiment Engine unavailable");

    const loyaltyRecords = this.loyaltyProgrammeEngine?.getLoyaltyRecords() ?? [];
    const tierDistribution: Record<string, number> = {};
    for (const record of loyaltyRecords) {
      tierDistribution[record.loyaltyTier] = (tierDistribution[record.loyaltyTier] ?? 0) + 1;
    }
    const averageLoyaltyPoints =
      loyaltyRecords.length > 0
        ? loyaltyRecords.reduce((s, r) => s + r.currentPointsBalance, 0) / loyaltyRecords.length
        : 0;

    if (!this.loyaltyProgrammeEngine) warnings.push("Loyalty Programme Engine unavailable");

    const journeyRecords = this.customerJourneyIntelligenceEngine?.getJourneyRecords() ?? [];
    const journeyInsights = this.customerJourneyIntelligenceEngine?.getInsights() ?? [];
    const averageJourneyScore =
      journeyRecords.length > 0
        ? journeyRecords.reduce((s, r) => s + r.journeyScore, 0) / journeyRecords.length
        : 0;

    if (!this.customerJourneyIntelligenceEngine) {
      warnings.push("Customer Journey Intelligence Engine unavailable");
    }

    const riskRecords = this.customerRiskEngine?.getCustomerRiskRecords() ?? [];
    const averageRiskScore =
      riskRecords.length > 0
        ? riskRecords.reduce((s, r) => s + r.riskScore, 0) / riskRecords.length
        : 0;
    const highRiskCustomers = riskRecords.filter((r) => r.riskLevel === "high").length;
    const mediumRiskCustomers = riskRecords.filter((r) => r.riskLevel === "medium").length;
    const lowRiskCustomers = riskRecords.filter((r) => r.riskLevel === "low").length;

    if (!this.customerRiskEngine) warnings.push("Customer Risk Engine unavailable");

    const supportRecords = this.aiCustomerSupport?.getAiSupportRecords() ?? [];
    const resolvedSupportCount = supportRecords.filter((r) => r.resolutionStatus === "resolved").length;
    const openSupportCount = supportRecords.filter((r) => r.resolutionStatus !== "resolved").length;
    let averageResponseTimeMs = 0;
    try {
      averageResponseTimeMs =
        this.aiCustomerSupport?.getState().performance.averageOperationDurationMs ?? 0;
    } catch {
      averageResponseTimeMs = 0;
    }

    if (!this.aiCustomerSupport) warnings.push("AI Customer Support unavailable");

    if (this.reviewManagementEngine) {
      void this.reviewManagementEngine.getReviewRecords();
    } else {
      warnings.push("Review Management Engine unavailable");
    }

    const growthRatePercent =
      totalCustomers > 0 ? Math.round((newCustomers / totalCustomers) * 100) : 0;

    return {
      totalCustomers,
      newCustomers,
      totalEvents: timelineEvents.length,
      purchaseEvents,
      supportEvents,
      communicationEvents,
      activeCustomers: activeCustomerIds.size,
      averageClv,
      totalClv,
      highValueCustomers,
      decliningValueCustomers,
      totalSegments: segments.length,
      assignedCustomers: segmentationRecords.length,
      topSegments,
      averageSentiment,
      positiveSentimentCount,
      negativeSentimentCount,
      neutralSentimentCount,
      loyaltyMembers: loyaltyRecords.length,
      averageLoyaltyPoints,
      tierDistribution,
      journeysMapped: journeyRecords.length,
      averageJourneyScore,
      dropOffDetected: journeyInsights.filter((i) => i.insightType === "dropoff").length,
      frictionDetected: journeyInsights.filter((i) => i.insightType === "friction").length,
      averageRiskScore,
      highRiskCustomers,
      mediumRiskCustomers,
      lowRiskCustomers,
      totalSupportRecords: supportRecords.length,
      resolvedSupportCount,
      openSupportCount,
      averageResponseTimeMs,
      warnings,
    };
  }
}
