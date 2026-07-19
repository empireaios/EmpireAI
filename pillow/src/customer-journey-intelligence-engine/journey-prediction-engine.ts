/** R4-17 — Journey Prediction Engine. */

import type { CustomerJourneyIntelligenceConfiguration } from "./configuration.js";
import type { JourneyStage } from "./types.js";

const STAGE_ORDER: JourneyStage[] = [
  "awareness",
  "consideration",
  "purchase",
  "retention",
  "advocacy",
];

export class JourneyPredictionEngine {
  predictNextStage(
    currentStage: JourneyStage,
    journeyScore: number,
    config: CustomerJourneyIntelligenceConfiguration,
  ): { predictedStage: JourneyStage; confidence: number } {
    if (!config.predictionRulesEnabled) {
      return { predictedStage: currentStage, confidence: 50 };
    }

    const boost = config.predictionRules.find((r) => r.enabled)?.progressionBoost ?? 10;
    const idx = STAGE_ORDER.indexOf(currentStage);
    let predictedStage = currentStage;
    let confidence = 50 + boost;

    if (currentStage === "at_risk" || currentStage === "churned") {
      return { predictedStage: "consideration", confidence: Math.min(100, 40 + boost) };
    }

    if (journeyScore >= 70 && idx >= 0 && idx < STAGE_ORDER.length - 1) {
      predictedStage = STAGE_ORDER[idx + 1] ?? predictedStage;
      confidence = Math.min(100, journeyScore);
    } else if (journeyScore < 40 && idx > 0) {
      predictedStage = STAGE_ORDER[idx - 1] ?? predictedStage;
      confidence = Math.min(100, 60 + boost);
    }

    return { predictedStage, confidence };
  }
}
