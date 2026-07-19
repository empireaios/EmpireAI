/** R4-11 — Review Classification Engine. */

import type { ReviewManagementEngineConfiguration } from "./configuration.js";
import type { ReviewRecord, ReviewSentiment } from "./types.js";

const NEGATIVE_KEYWORDS = [
  "terrible",
  "awful",
  "bad",
  "poor",
  "disappointed",
  "broken",
  "worst",
  "never again",
  "refund",
  "scam",
];
const POSITIVE_KEYWORDS = [
  "excellent",
  "great",
  "love",
  "amazing",
  "perfect",
  "recommend",
  "fantastic",
  "happy",
  "thank",
  "best",
];

export class ReviewClassificationEngine {
  classifyFromRating(
    rating: number,
    config: ReviewManagementEngineConfiguration,
  ): ReviewSentiment {
    if (rating <= config.negativeRatingThreshold) return "negative";
    if (rating >= config.positiveRatingThreshold) return "positive";
    return "neutral";
  }

  classifyFromComment(comment: string): ReviewSentiment | null {
    const normalized = comment.toLowerCase();
    if (!normalized.trim()) return null;

    const negativeHits = NEGATIVE_KEYWORDS.filter((kw) => normalized.includes(kw)).length;
    const positiveHits = POSITIVE_KEYWORDS.filter((kw) => normalized.includes(kw)).length;

    if (negativeHits > positiveHits && negativeHits > 0) return "negative";
    if (positiveHits > negativeHits && positiveHits > 0) return "positive";
    return null;
  }

  classifyReview(
    record: Pick<ReviewRecord, "reviewRating" | "reviewComment">,
    config: ReviewManagementEngineConfiguration,
  ): ReviewSentiment {
    const fromComment = this.classifyFromComment(record.reviewComment);
    const fromRating = this.classifyFromRating(record.reviewRating, config);

    if (fromComment && fromComment !== fromRating) {
      if (fromComment === "negative" || fromRating === "negative") return "negative";
      if (fromComment === "positive" || fromRating === "positive") return "positive";
    }

    return fromComment ?? fromRating;
  }

  sentimentToScore(sentiment: ReviewSentiment): number {
    switch (sentiment) {
      case "positive":
        return 85;
      case "negative":
        return 20;
      default:
        return 50;
    }
  }
}
