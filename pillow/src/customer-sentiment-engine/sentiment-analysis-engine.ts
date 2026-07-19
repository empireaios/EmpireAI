/** R4-10 — Sentiment analysis engine. */

import type { CustomerSentimentEngineConfiguration } from "./configuration.js";
import type { SentimentCategory } from "./types.js";

export type MessageAnalysis = {
  sentimentScore: number;
  sentimentCategory: SentimentCategory;
  confidenceScore: number;
  matchedRules: string[];
};

export class SentimentAnalysisEngine {
  analyzeMessage(
    text: string,
    config: CustomerSentimentEngineConfiguration,
  ): MessageAnalysis {
    const normalized = text.toLowerCase().trim();
    let score = 50;
    let category: SentimentCategory = "neutral";
    let confidence = 55;
    const matchedRules: string[] = [];

    if (!normalized) {
      return { sentimentScore: 50, sentimentCategory: "neutral", confidenceScore: 40, matchedRules };
    }

    if (config.analysisRulesEnabled) {
      for (const rule of config.analysisRules) {
        if (!rule.enabled) continue;
        if (rule.keywords.some((kw) => normalized.includes(kw.toLowerCase()))) {
          score += rule.scoreDelta;
          category = rule.category;
          matchedRules.push(rule.ruleId);
          confidence += 10;
        }
      }
    }

    score = Math.max(0, Math.min(100, score));
    confidence = Math.max(30, Math.min(95, confidence + matchedRules.length * 5));

    if (matchedRules.length === 0) {
      category = score >= 60 ? "positive" : score <= 40 ? "negative" : "neutral";
    }

    return { sentimentScore: score, sentimentCategory: category, confidenceScore: confidence, matchedRules };
  }
}
