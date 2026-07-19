/** R4-13 — Return Insights Engine. */

import type { ReturnInsight, ReturnIntelligenceRecord } from "./types.js";
import type { ReturnHistorySummary } from "./return-history-engine.js";
import type { CustomerReturnProfile } from "./customer-return-profile-engine.js";
import { RIE_METADATA_VERSION } from "./paths.js";
import { buildReturnInsightId } from "./return-metadata-generator.js";

export class ReturnInsightsEngine {
  summarize(
    records: ReturnIntelligenceRecord[],
    insights: ReturnInsight[],
  ): {
    totalRecords: number;
    highRiskReturns: number;
    repeatPatternCustomers: number;
    activeInsights: number;
    failedRecords: number;
  } {
    const customerIds = new Set(records.map((r) => r.customerId));
    const repeatCustomers = [...customerIds].filter((customerId) => {
      const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const monthly = records.filter(
        (r) =>
          r.customerId === customerId && new Date(r.timestamp).getTime() >= oneMonthAgo,
      );
      return monthly.length >= 2;
    });

    return {
      totalRecords: records.length,
      highRiskReturns: records.filter((r) => r.returnRiskScore >= 75).length,
      repeatPatternCustomers: repeatCustomers.length,
      activeInsights: insights.length,
      failedRecords: records.filter((r) => r.validationStatus === "failed").length,
    };
  }

  buildHistoryInsight(
    customerId: string,
    returnIntelligenceId: string,
    history: ReturnHistorySummary,
  ): ReturnInsight {
    return {
      insightId: buildReturnInsightId(),
      timestamp: new Date().toISOString(),
      customerId,
      returnIntelligenceId,
      insightType: "history",
      summary: `${history.totalReturns} prior return(s); ${history.returnsThisMonth} this month; avg risk ${history.averageRiskScore}`,
      metadataVersion: RIE_METADATA_VERSION,
    };
  }

  buildPatternInsight(
    customerId: string,
    returnIntelligenceId: string,
    profile: CustomerReturnProfile,
  ): ReturnInsight {
    return {
      insightId: buildReturnInsightId(),
      timestamp: new Date().toISOString(),
      customerId,
      returnIntelligenceId,
      insightType: "pattern",
      summary: profile.repeatPatternDetected
        ? "Repeat return pattern detected for customer"
        : "No repeat return pattern detected",
      metadataVersion: RIE_METADATA_VERSION,
    };
  }

  toMachineReadable(record: ReturnIntelligenceRecord): Record<string, unknown> {
    return {
      returnIntelligenceId: record.returnIntelligenceId,
      timestamp: record.timestamp,
      customerId: record.customerId,
      returnReference: record.returnReference,
      orderReference: record.orderReference,
      productReference: record.productReference,
      returnReason: record.returnReason,
      returnRiskScore: record.returnRiskScore,
      recommendedAction: record.recommendedAction,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}
