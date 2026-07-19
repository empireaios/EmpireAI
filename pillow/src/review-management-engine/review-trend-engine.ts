/** R4-11 — Review Trend Engine. */

import type { ReviewManagementEngineConfiguration } from "./configuration.js";
import type { ReviewRecord, ReviewTrend } from "./types.js";
import { ReviewMetadataGenerator } from "./review-metadata-generator.js";
import { ReviewClassificationEngine } from "./review-classification-engine.js";

export class ReviewTrendEngine {
  private readonly metadata = new ReviewMetadataGenerator();
  private readonly classifier = new ReviewClassificationEngine();

  trackTrends(
    records: ReviewRecord[],
    config: ReviewManagementEngineConfiguration,
    input: { marketplaceReference?: string; productReference?: string },
  ): ReviewTrend | null {
    const filtered = records.filter((r) => {
      if (input.marketplaceReference && r.marketplaceReference !== input.marketplaceReference) {
        return false;
      }
      if (input.productReference && r.productReference !== input.productReference) {
        return false;
      }
      return true;
    });

    if (filtered.length < 2) return null;

    const averageRating =
      Math.round(
        (filtered.reduce((sum, r) => sum + r.reviewRating, 0) / filtered.length) * 10,
      ) / 10;

    const sentimentScores = filtered.map((r) =>
      this.classifier.sentimentToScore(r.reviewSentiment),
    );
    const averageSentimentScore = Math.round(
      sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length,
    );

    const sorted = [...filtered].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const firstHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
    const secondHalf = sorted.slice(Math.ceil(sorted.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, r) => sum + r.reviewRating, 0) / Math.max(firstHalf.length, 1);
    const secondAvg =
      secondHalf.reduce((sum, r) => sum + r.reviewRating, 0) / Math.max(secondHalf.length, 1);

    let trendDirection: ReviewTrend["trendDirection"] = "stable";
    if (secondAvg - firstAvg >= 0.5) trendDirection = "improving";
    else if (firstAvg - secondAvg >= 0.5) trendDirection = "declining";

    const marketplaceReference =
      input.marketplaceReference ?? filtered[0]?.marketplaceReference ?? "unknown";
    const productReference =
      input.productReference ?? filtered[0]?.productReference ?? "unknown";

    return this.metadata.buildTrend({
      marketplaceReference,
      productReference,
      averageRating,
      averageSentimentScore,
      trendDirection,
      recordCount: filtered.length,
    });
  }
}
