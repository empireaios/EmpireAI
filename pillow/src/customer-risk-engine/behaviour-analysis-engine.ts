/** R4-14 — Behaviour Analysis Engine. */

export type BehaviourContext = {
  returnRiskScore: number;
  sentimentScore: number;
  openTickets: number;
  negativeReviews: number;
  recentTimelineEvents: number;
};

export class BehaviourAnalysisEngine {
  analyzePurchasing(context: BehaviourContext): { indicators: string[]; score: number } {
    const indicators: string[] = [];
    let score = 0;

    if (context.recentTimelineEvents > 30) {
      indicators.push("high_purchase_activity");
      score += 20;
    }
    if (context.recentTimelineEvents > 50 && context.returnRiskScore > 40) {
      indicators.push("purchase_return_mismatch");
      score += 25;
    }

    return { indicators, score: Math.min(100, score) };
  }

  analyzeReturns(context: BehaviourContext): { indicators: string[]; score: number } {
    const indicators: string[] = [];
    let score = context.returnRiskScore;

    if (context.returnRiskScore >= 65) indicators.push("elevated_return_risk");
    if (context.returnRiskScore >= 85) indicators.push("critical_return_risk");

    return { indicators, score: Math.min(100, score) };
  }

  analyzeCommunication(context: BehaviourContext): { indicators: string[]; score: number } {
    const indicators: string[] = [];
    let score = 0;

    if (context.sentimentScore < -0.3) {
      indicators.push("negative_sentiment");
      score += 25;
    }
    if (context.openTickets >= 3) {
      indicators.push("support_escalation_pattern");
      score += 15;
    }

    return { indicators, score: Math.min(100, score) };
  }
}
