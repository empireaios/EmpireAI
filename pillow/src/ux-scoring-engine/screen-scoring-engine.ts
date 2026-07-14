/** T2-08 — Screen-level UX scoring. */

import type { RuleValidationReport } from "../ux-rule-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import { ScoringWeightManager } from "./scoring-weight-manager.js";
import { countSeverities } from "./scoring-helpers.js";
import type { ScoreBreakdownEntry } from "./types.js";
import type { UxScoringConfiguration } from "./configuration.js";

export class ScreenScoringEngine {
  private readonly weights = new ScoringWeightManager();

  score(
    uxRules: RuleValidationReport | null,
    layoutEvaluation: LayoutEvaluationModel | null,
    config: UxScoringConfiguration,
  ): { screenScore: number; breakdown: ScoreBreakdownEntry[] } {
    let base = config.scoreScale.max;
    const violations = uxRules?.violations ?? [];
    const weaknesses = layoutEvaluation?.layoutWeaknesses ?? [];
    const strengths = layoutEvaluation?.layoutStrengths ?? [];

    const severityCounts = countSeverities([
      ...violations.map((v) => ({ severity: v.severity })),
      ...weaknesses,
    ]);

    base = this.weights.applySeverityImpact(base, severityCounts, config);
    base = this.weights.applyStrengthBonus(base, strengths.length, config);

    const clarityViolations = violations.filter((v) => v.category === "clarity").length;
    const clarityScore = this.weights.clamp(
      config.scoreScale.max - clarityViolations * config.severityImpact.warning,
      config,
    );

    const breakdown: ScoreBreakdownEntry[] = [
      {
        category: "clarity",
        score: clarityScore,
        weight: this.weights.getWeight(config, "clarity"),
        weightedScore: 0,
        findingsCount: clarityViolations + weaknesses.length,
        strengthsCount: strengths.length,
        evidenceRef: uxRules?.validationReportId ?? null,
      },
      {
        category: "visual_hierarchy",
        score: this.weights.clamp(base, config),
        weight: this.weights.getWeight(config, "visual_hierarchy"),
        weightedScore: 0,
        findingsCount: weaknesses.filter((w) => w.category === "visual_hierarchy").length,
        strengthsCount: strengths.filter((s) => s.category === "visual_hierarchy").length,
        evidenceRef: layoutEvaluation?.evaluationId ?? null,
      },
    ];

    return { screenScore: this.weights.clamp(base, config), breakdown };
  }
}
