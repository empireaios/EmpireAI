/** T2-08 — Layout-level UX scoring. */

import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { ConsistencyReviewRecord } from "../visual-consistency-engine/types.js";
import { ScoringWeightManager } from "./scoring-weight-manager.js";
import { countSeverities } from "./scoring-helpers.js";
import type { ScoreBreakdownEntry } from "./types.js";
import type { UxScoringConfiguration } from "./configuration.js";

export class LayoutScoringEngine {
  private readonly weights = new ScoringWeightManager();

  score(
    layoutEvaluation: LayoutEvaluationModel | null,
    consistency: ConsistencyReviewRecord | null,
    config: UxScoringConfiguration,
  ): { layoutScore: number; breakdown: ScoreBreakdownEntry[] } {
    let base = config.scoreScale.max;
    const weaknesses = layoutEvaluation?.layoutWeaknesses ?? [];
    const strengths = layoutEvaluation?.layoutStrengths ?? [];
    const layoutFindings =
      consistency?.consistencyFindings.filter(
        (f) => f.findingCategory === "layout_structure" || f.findingCategory === "spacing",
      ) ?? [];

    const severityCounts = countSeverities([...weaknesses, ...layoutFindings]);
    base = this.weights.applySeverityImpact(base, severityCounts, config);
    base = this.weights.applyStrengthBonus(base, strengths.length, config);

    const responsivenessWeaknesses = weaknesses.filter(
      (w) => w.category === "responsive_layout",
    ).length;

    const breakdown: ScoreBreakdownEntry[] = [
      {
        category: "layout_quality",
        score: this.weights.clamp(base, config),
        weight: this.weights.getWeight(config, "layout_quality"),
        weightedScore: 0,
        findingsCount: weaknesses.length + layoutFindings.length,
        strengthsCount: strengths.length,
        evidenceRef: layoutEvaluation?.evaluationId ?? null,
      },
      {
        category: "responsiveness",
        score: this.weights.clamp(
          config.scoreScale.max - responsivenessWeaknesses * config.severityImpact.warning,
          config,
        ),
        weight: this.weights.getWeight(config, "responsiveness"),
        weightedScore: 0,
        findingsCount: responsivenessWeaknesses,
        strengthsCount: 0,
        evidenceRef: layoutEvaluation?.evaluationId ?? null,
      },
    ];

    return { layoutScore: this.weights.clamp(base, config), breakdown };
  }
}
