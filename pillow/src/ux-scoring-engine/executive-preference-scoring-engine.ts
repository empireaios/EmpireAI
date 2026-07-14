/** T2-08 — Executive preference alignment scoring. */

import type { ExecutiveStyleModel } from "../executive-style-learning-engine/types.js";
import type { LayoutEvaluationModel } from "../layout-evaluation-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import type { RuleValidationReport } from "../ux-rule-engine/types.js";
import { ScoringWeightManager } from "./scoring-weight-manager.js";
import { countSeverities } from "./scoring-helpers.js";
import type { ScoreBreakdownEntry } from "./types.js";
import type { UxScoringConfiguration } from "./configuration.js";

export class ExecutivePreferenceScoringEngine {
  private readonly weights = new ScoringWeightManager();

  score(
    executiveStyle: ExecutiveStyleModel | null,
    layoutEvaluation: LayoutEvaluationModel | null,
    designSystem: DesignSystemModel | null,
    uxRules: RuleValidationReport | null,
    config: UxScoringConfiguration,
  ): { executivePreferenceAlignmentScore: number; breakdown: ScoreBreakdownEntry[] } {
    let base = config.scoreScale.max;
    const deviations = layoutEvaluation?.executivePreferenceDeviations ?? [];
    const dsDeviations = layoutEvaluation?.designSystemDeviations ?? [];
    const ruleFailures = uxRules?.rulesFailed ?? 0;

    const severityCounts = countSeverities(deviations);
    base = this.weights.applySeverityImpact(base, severityCounts, config);
    base = this.weights.applySeverityImpact(
      base,
      { error: 0, warning: dsDeviations.length, info: 0 },
      config,
    );
    base = this.weights.clamp(base - ruleFailures * 2, config);

    if (executiveStyle && executiveStyle.confidenceScore > 50) {
      base = this.weights.applyStrengthBonus(base, 1, config);
    }
    if (designSystem && designSystem.componentLibrary.length > 0) {
      base = this.weights.applyStrengthBonus(base, 1, config);
    }

    const breakdown: ScoreBreakdownEntry[] = [
      {
        category: "executive_preference_alignment",
        score: this.weights.clamp(base, config),
        weight: this.weights.getWeight(config, "executive_preference_alignment"),
        weightedScore: 0,
        findingsCount: deviations.length,
        strengthsCount: executiveStyle ? 1 : 0,
        evidenceRef: executiveStyle?.executiveStyleId ?? null,
      },
      {
        category: "design_system_alignment",
        score: this.weights.clamp(
          config.scoreScale.max - dsDeviations.length * config.severityImpact.warning,
          config,
        ),
        weight: this.weights.getWeight(config, "design_system_alignment"),
        weightedScore: 0,
        findingsCount: dsDeviations.length,
        strengthsCount: designSystem ? 1 : 0,
        evidenceRef: designSystem?.designSystemId ?? null,
      },
      {
        category: "governance_compliance",
        score: this.weights.clamp(
          uxRules
            ? config.scoreScale.max -
                (uxRules.rulesFailed / Math.max(uxRules.totalRules, 1)) * 40
            : config.scoreScale.max * 0.5,
          config,
        ),
        weight: this.weights.getWeight(config, "governance_compliance"),
        weightedScore: 0,
        findingsCount: ruleFailures,
        strengthsCount: uxRules?.rulesPassed ?? 0,
        evidenceRef: uxRules?.validationReportId ?? null,
      },
    ];

    return {
      executivePreferenceAlignmentScore: this.weights.clamp(base, config),
      breakdown,
    };
  }
}
