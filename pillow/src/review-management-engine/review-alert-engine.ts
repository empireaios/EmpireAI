/** R4-11 — Review Alert Engine. */

import type { ReviewManagementEngineConfiguration } from "./configuration.js";
import type { ReputationAlert, ReviewRecord } from "./types.js";
import { ReviewMetadataGenerator } from "./review-metadata-generator.js";

export class ReviewAlertEngine {
  private readonly metadata = new ReviewMetadataGenerator();

  generateAlerts(
    record: ReviewRecord,
    config: ReviewManagementEngineConfiguration,
  ): ReputationAlert[] {
    if (!config.reputationAlertRulesEnabled) return [];

    const alerts: ReputationAlert[] = [];

    for (const rule of config.reputationAlertRules) {
      if (!rule.enabled) continue;
      if (record.reviewSentiment !== rule.sentiment) continue;
      if (record.reviewRating < rule.minRating || record.reviewRating > rule.maxRating) {
        continue;
      }

      alerts.push(
        this.metadata.buildAlert({
          reviewRecordId: record.reviewRecordId,
          customerId: record.customerId,
          alertType:
            record.reviewSentiment === "negative"
              ? "negative_review"
              : record.reviewSentiment === "positive"
                ? "positive_review"
                : "reputation_decline",
          severity: rule.severity,
          message: `${rule.label}: ${record.reviewRating}/5 on ${record.productReference} (${record.marketplaceReference})`,
        }),
      );
    }

    return alerts;
  }
}
