/** T2-08 — Accessibility scoring. */

import type { AccessibilityReviewRecord } from "../accessibility-intelligence-engine/types.js";
import { ScoringWeightManager } from "./scoring-weight-manager.js";
import { countSeverities } from "./scoring-helpers.js";
import type { ScoreBreakdownEntry } from "./types.js";
import type { UxScoringConfiguration } from "./configuration.js";

export class AccessibilityScoringEngine {
  private readonly weights = new ScoringWeightManager();

  score(
    accessibility: AccessibilityReviewRecord | null,
    config: UxScoringConfiguration,
  ): { accessibilityScore: number; breakdown: ScoreBreakdownEntry[] } {
    let base = config.scoreScale.max;
    const findings = accessibility?.accessibilityFindings ?? [];
    const strengths = accessibility?.accessibilityStrengths ?? [];

    const severityCounts = countSeverities(findings);
    base = this.weights.applySeverityImpact(base, severityCounts, config);
    base = this.weights.applyStrengthBonus(base, strengths.length, config);

    const errorFindings = findings.filter((f) => f.findingCategory === "error_messages").length;
    const loadingFindings = findings.filter((f) => f.findingCategory === "loading_states").length;
    const emptyFindings = findings.filter((f) => f.findingCategory === "empty_states").length;

    const breakdown: ScoreBreakdownEntry[] = [
      {
        category: "accessibility_quality",
        score: this.weights.clamp(base, config),
        weight: this.weights.getWeight(config, "accessibility_quality"),
        weightedScore: 0,
        findingsCount: findings.length,
        strengthsCount: strengths.length,
        evidenceRef: accessibility?.accessibilityReviewId ?? null,
      },
      {
        category: "error_state_quality",
        score: this.weights.clamp(
          config.scoreScale.max - errorFindings * config.severityImpact.warning,
          config,
        ),
        weight: this.weights.getWeight(config, "error_state_quality"),
        weightedScore: 0,
        findingsCount: errorFindings,
        strengthsCount: 0,
        evidenceRef: accessibility?.accessibilityReviewId ?? null,
      },
      {
        category: "loading_state_quality",
        score: this.weights.clamp(
          config.scoreScale.max - loadingFindings * config.severityImpact.info,
          config,
        ),
        weight: this.weights.getWeight(config, "loading_state_quality"),
        weightedScore: 0,
        findingsCount: loadingFindings,
        strengthsCount: 0,
        evidenceRef: accessibility?.accessibilityReviewId ?? null,
      },
      {
        category: "empty_state_quality",
        score: this.weights.clamp(
          config.scoreScale.max - emptyFindings * config.severityImpact.info,
          config,
        ),
        weight: this.weights.getWeight(config, "empty_state_quality"),
        weightedScore: 0,
        findingsCount: emptyFindings,
        strengthsCount: 0,
        evidenceRef: accessibility?.accessibilityReviewId ?? null,
      },
    ];

    return { accessibilityScore: this.weights.clamp(base, config), breakdown };
  }
}
