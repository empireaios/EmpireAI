/** R4-10 — Sentiment scoring engine. */

import type { SentimentRecord } from "./types.js";

export class SentimentScoringEngine {
  calculateScore(record: SentimentRecord): number {
    return Math.max(0, Math.min(100, record.sentimentScore));
  }

  isSatisfied(record: SentimentRecord, threshold: number): boolean {
    return (
      record.sentimentScore >= threshold ||
      record.sentimentCategory === "satisfied" ||
      record.sentimentCategory === "positive"
    );
  }

  isFrustrated(record: SentimentRecord, threshold: number): boolean {
    return record.sentimentScore <= threshold || record.sentimentCategory === "frustrated";
  }

  isEscalationRisk(record: SentimentRecord, threshold: number): boolean {
    return (
      record.sentimentScore <= threshold || record.sentimentCategory === "escalation_risk"
    );
  }

  isPositiveExperience(record: SentimentRecord, threshold: number): boolean {
    return (
      record.sentimentScore >= threshold &&
      (record.sentimentCategory === "positive" || record.sentimentCategory === "satisfied")
    );
  }
}
