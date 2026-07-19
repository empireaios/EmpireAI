/** R4-14 — Fraud Detection Engine. */

import type { CustomerRiskEngineConfiguration } from "./configuration.js";

export type FraudSignalContext = {
  returnCount: number;
  highRiskReturnCount: number;
  negativeSentimentCount: number;
  openTicketCount: number;
  negativeReviewCount: number;
};

export class FraudDetectionEngine {
  detect(
    context: FraudSignalContext,
    config: CustomerRiskEngineConfiguration,
  ): { indicators: string[]; score: number } {
    if (!config.fraudDetectionRulesEnabled) return { indicators: [], score: 0 };

    const indicators: string[] = [];
    let score = 0;

    for (const rule of config.fraudDetectionRules) {
      if (!rule.enabled) continue;
      if (rule.ruleId === "repeat_returns" && context.returnCount >= config.maxReturnsForAbuseFlag) {
        indicators.push("repeat_return_pattern");
        score += rule.indicatorWeight;
      }
      if (rule.ruleId === "negative_sentiment" && context.negativeSentimentCount >= 2) {
        indicators.push("negative_sentiment_cluster");
        score += rule.indicatorWeight;
      }
      if (rule.ruleId === "open_tickets" && context.openTicketCount >= config.maxTicketsForAbuseFlag) {
        indicators.push("excessive_open_tickets");
        score += rule.indicatorWeight;
      }
    }

    if (context.highRiskReturnCount >= 2) {
      indicators.push("high_risk_return_history");
      score += 15;
    }
    if (context.negativeReviewCount >= 2) {
      indicators.push("negative_review_pattern");
      score += 10;
    }

    return { indicators, score: Math.min(100, score) };
  }
}
