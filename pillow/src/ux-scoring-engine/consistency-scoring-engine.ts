/** T2-08 — Visual consistency scoring. */

import type { ConsistencyReviewRecord } from "../visual-consistency-engine/types.js";
import { ScoringWeightManager } from "./scoring-weight-manager.js";
import { countSeverities } from "./scoring-helpers.js";
import type { ScoreBreakdownEntry } from "./types.js";
import type { UxScoringConfiguration } from "./configuration.js";

export class ConsistencyScoringEngine {
  private readonly weights = new ScoringWeightManager();

  score(
    consistency: ConsistencyReviewRecord | null,
    config: UxScoringConfiguration,
  ): { consistencyScore: number; breakdown: ScoreBreakdownEntry[] } {
    let base = config.scoreScale.max;
    const findings = consistency?.consistencyFindings ?? [];
    const strengths = consistency?.consistencyStrengths ?? [];

    const severityCounts = countSeverities(findings);
    base = this.weights.applySeverityImpact(base, severityCounts, config);
    base = this.weights.applyStrengthBonus(base, strengths.length, config);

    const breakdown: ScoreBreakdownEntry[] = [
      {
        category: "visual_consistency",
        score: this.weights.clamp(base, config),
        weight: this.weights.getWeight(config, "visual_consistency"),
        weightedScore: 0,
        findingsCount: findings.length,
        strengthsCount: strengths.length,
        evidenceRef: consistency?.consistencyReviewId ?? null,
      },
    ];

    return { consistencyScore: this.weights.clamp(base, config), breakdown };
  }
}
