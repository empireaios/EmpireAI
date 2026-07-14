/** T2-08 — Component-level UX scoring. */

import type { RuleValidationReport } from "../ux-rule-engine/types.js";
import type { ConsistencyReviewRecord } from "../visual-consistency-engine/types.js";
import type { DesignSystemModel } from "../design-system-intelligence-engine/types.js";
import { ScoringWeightManager } from "./scoring-weight-manager.js";
import { countSeverities } from "./scoring-helpers.js";
import type { ScoreBreakdownEntry } from "./types.js";
import type { UxScoringConfiguration } from "./configuration.js";

export class ComponentScoringEngine {
  private readonly weights = new ScoringWeightManager();

  score(
    uxRules: RuleValidationReport | null,
    consistency: ConsistencyReviewRecord | null,
    designSystem: DesignSystemModel | null,
    config: UxScoringConfiguration,
  ): { componentScore: number; breakdown: ScoreBreakdownEntry[] } {
    let base = config.scoreScale.max;
    const componentViolations =
      uxRules?.violations.filter((v) => v.sourceComponentId) ?? [];
    const consistencyFindings =
      consistency?.consistencyFindings.filter(
        (f) => f.findingCategory === "components" || f.findingCategory === "component_variants",
      ) ?? [];
    const consistencyStrengths =
      consistency?.consistencyStrengths.filter((s) => s.category === "components") ?? [];

    const severityCounts = countSeverities([
      ...componentViolations.map((v) => ({ severity: v.severity })),
      ...consistencyFindings,
    ]);

    base = this.weights.applySeverityImpact(base, severityCounts, config);
    base = this.weights.applyStrengthBonus(
      base,
      consistencyStrengths.length + (designSystem?.componentLibrary.length ? 1 : 0),
      config,
    );

    const breakdown: ScoreBreakdownEntry[] = [
      {
        category: "component_quality",
        score: this.weights.clamp(base, config),
        weight: this.weights.getWeight(config, "component_quality"),
        weightedScore: 0,
        findingsCount: componentViolations.length + consistencyFindings.length,
        strengthsCount: consistencyStrengths.length,
        evidenceRef: consistency?.consistencyReviewId ?? null,
      },
    ];

    return { componentScore: this.weights.clamp(base, config), breakdown };
  }
}
