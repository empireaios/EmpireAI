/** R4-11 — Reputation Monitoring Engine. */

import type { ReviewRecord } from "./types.js";

export type ReputationSummary = {
  totalReviews: number;
  positiveReviews: number;
  negativeReviews: number;
  neutralReviews: number;
  averageRating: number;
  reputationScore: number;
  activeAlerts: number;
  failedRecords: number;
};

export class ReputationMonitoringEngine {
  summarize(records: ReviewRecord[], activeAlerts: number): ReputationSummary {
    const totalReviews = records.length;
    const positiveReviews = records.filter((r) => r.reviewSentiment === "positive").length;
    const negativeReviews = records.filter((r) => r.reviewSentiment === "negative").length;
    const neutralReviews = records.filter((r) => r.reviewSentiment === "neutral").length;
    const failedRecords = records.filter((r) => r.validationStatus === "failed").length;

    const averageRating =
      totalReviews > 0
        ? Math.round(
            (records.reduce((sum, r) => sum + r.reviewRating, 0) / totalReviews) * 10,
          ) / 10
        : 0;

    let reputationScore = 100;
    if (totalReviews > 0) {
      reputationScore = Math.round(
        (positiveReviews * 100 + neutralReviews * 60 + negativeReviews * 20) / totalReviews,
      );
    }
    if (negativeReviews > positiveReviews && totalReviews >= 2) {
      reputationScore = Math.max(0, reputationScore - 15);
    }

    return {
      totalReviews,
      positiveReviews,
      negativeReviews,
      neutralReviews,
      averageRating,
      reputationScore,
      activeAlerts,
      failedRecords,
    };
  }

  toMachineReadable(record: ReviewRecord): Record<string, unknown> {
    return {
      reviewRecordId: record.reviewRecordId,
      timestamp: record.timestamp,
      customerId: record.customerId,
      marketplaceReference: record.marketplaceReference,
      productReference: record.productReference,
      orderReference: record.orderReference,
      reviewRating: record.reviewRating,
      reviewComment: record.reviewComment,
      reviewSentiment: record.reviewSentiment,
      reviewStatus: record.reviewStatus,
      validationStatus: record.validationStatus,
      metadataVersion: record.metadataVersion,
    };
  }
}
