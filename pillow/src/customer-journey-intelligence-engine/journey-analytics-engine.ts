/** R4-17 — Journey Analytics Engine. */

import type { CustomerJourneySignals, JourneyStage } from "./types.js";

export class JourneyAnalyticsEngine {
  measurePerformance(signals: CustomerJourneySignals, stage: JourneyStage): { journeyScore: number } {
    let score = 40;
    score += Math.min(25, signals.timelineEventCount * 5);
    score += Math.min(20, signals.purchaseCount * 8);
    if (signals.avgSentimentScore >= 60) score += 10;
    if (signals.avgSentimentScore < 40) score -= 15;
    if (stage === "advocacy" || stage === "retention") score += 10;
    if (stage === "at_risk" || stage === "churned") score -= 20;
    if (signals.daysSinceLastEvent > 14) score -= 10;
    return { journeyScore: Math.max(0, Math.min(100, score)) };
  }

  measureConversion(signals: CustomerJourneySignals, purchaseThreshold: number): {
    conversionStatus: "not_started" | "in_progress" | "converted" | "dropped_off" | "stalled";
    conversionRate: number;
  } {
    if (signals.purchaseCount >= purchaseThreshold) {
      return { conversionStatus: "converted", conversionRate: 100 };
    }
    if (signals.timelineEventCount === 0) {
      return { conversionStatus: "not_started", conversionRate: 0 };
    }
    if (signals.daysSinceLastEvent > 30) {
      return { conversionStatus: "dropped_off", conversionRate: 0 };
    }
    if (signals.timelineEventCount >= 2 && signals.purchaseCount === 0) {
      return {
        conversionStatus: "in_progress",
        conversionRate: Math.min(80, signals.timelineEventCount * 20),
      };
    }
    return { conversionStatus: "stalled", conversionRate: 10 };
  }

  detectDropOff(signals: CustomerJourneySignals, inactivityDays: number): string[] {
    const indicators: string[] = [];
    if (signals.daysSinceLastEvent >= inactivityDays) {
      indicators.push("inactivity_dropoff");
    }
    if (signals.timelineEventCount >= 2 && signals.purchaseCount === 0 && signals.daysSinceLastEvent > 14) {
      indicators.push("consideration_abandonment");
    }
    return indicators;
  }

  detectFriction(signals: CustomerJourneySignals, sentimentThreshold: number): string[] {
    const indicators: string[] = [];
    if (signals.negativeSentimentCount >= 2) indicators.push("negative_sentiment_friction");
    if (signals.avgSentimentScore < sentimentThreshold) indicators.push("low_sentiment_friction");
    if (signals.supportCount >= 2) indicators.push("repeat_support_friction");
    return indicators;
  }
}
