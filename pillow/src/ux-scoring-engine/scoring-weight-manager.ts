/** T2-08 — Scoring weight management. */

import type { UxScoringConfiguration } from "./configuration.js";
import type { ScoringCategory } from "./types.js";

export class ScoringWeightManager {
  getWeight(config: UxScoringConfiguration, category: ScoringCategory): number {
    const entry = config.categoryWeights.find((w) => w.category === category);
    return entry?.weight ?? 0;
  }

  getNormalizedWeights(config: UxScoringConfiguration): Map<ScoringCategory, number> {
    const total = config.categoryWeights.reduce((sum, w) => sum + w.weight, 0);
    const map = new Map<ScoringCategory, number>();
    for (const entry of config.categoryWeights) {
      map.set(entry.category, total > 0 ? entry.weight / total : 0);
    }
    return map;
  }

  applySeverityImpact(
    baseScore: number,
    severityCounts: { error: number; warning: number; info: number },
    config: UxScoringConfiguration,
  ): number {
    const deduction =
      severityCounts.error * config.severityImpact.error +
      severityCounts.warning * config.severityImpact.warning +
      severityCounts.info * config.severityImpact.info;
    return Math.max(config.scoreScale.min, baseScore - deduction);
  }

  applyStrengthBonus(
    score: number,
    strengthCount: number,
    config: UxScoringConfiguration,
  ): number {
    const bonus = Math.min(20, strengthCount * config.strengthBonus);
    return Math.min(config.scoreScale.max, score + bonus);
  }

  applyConfidence(score: number, confidence: number, config: UxScoringConfiguration): number {
    if (!config.confidenceImpactEnabled) return score;
    const factor = 0.5 + confidence * 0.5;
    return Math.round(score * factor);
  }

  clamp(score: number, config: UxScoringConfiguration): number {
    return Math.max(config.scoreScale.min, Math.min(config.scoreScale.max, Math.round(score)));
  }
}
