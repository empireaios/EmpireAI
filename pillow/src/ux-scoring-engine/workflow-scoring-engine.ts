/** T2-08 — Workflow-level UX scoring. */

import type { WorkflowOptimizationRecord } from "../workflow-optimization-engine/types.js";
import { ScoringWeightManager } from "./scoring-weight-manager.js";
import { countSeverities } from "./scoring-helpers.js";
import type { ScoreBreakdownEntry } from "./types.js";
import type { UxScoringConfiguration } from "./configuration.js";

export class WorkflowScoringEngine {
  private readonly weights = new ScoringWeightManager();

  score(
    workflowOptimization: WorkflowOptimizationRecord | null,
    config: UxScoringConfiguration,
  ): { workflowScore: number; breakdown: ScoreBreakdownEntry[] } {
    let base = config.scoreScale.max;
    const friction = workflowOptimization?.detectedFrictionPoints ?? [];
    const strengths = workflowOptimization?.detectedWorkflowStrengths ?? [];

    const severityCounts = countSeverities(friction);
    base = this.weights.applySeverityImpact(base, severityCounts, config);
    base = this.weights.applyStrengthBonus(base, strengths.length, config);

    const formFriction = friction.filter(
      (f) => f.category === "poor_form_sequence" || f.category === "confusing_field_grouping",
    ).length;
    const dashboardFriction = friction.filter((f) =>
      f.description.toLowerCase().includes("dashboard"),
    ).length;

    const breakdown: ScoreBreakdownEntry[] = [
      {
        category: "workflow_usability",
        score: this.weights.clamp(base, config),
        weight: this.weights.getWeight(config, "workflow_usability"),
        weightedScore: 0,
        findingsCount: friction.length,
        strengthsCount: strengths.length,
        evidenceRef: workflowOptimization?.optimizationRecordId ?? null,
      },
      {
        category: "form_usability",
        score: this.weights.clamp(
          config.scoreScale.max - formFriction * config.severityImpact.warning,
          config,
        ),
        weight: this.weights.getWeight(config, "form_usability"),
        weightedScore: 0,
        findingsCount: formFriction,
        strengthsCount: 0,
        evidenceRef: workflowOptimization?.optimizationRecordId ?? null,
      },
      {
        category: "dashboard_usability",
        score: this.weights.clamp(
          config.scoreScale.max - dashboardFriction * config.severityImpact.warning,
          config,
        ),
        weight: this.weights.getWeight(config, "dashboard_usability"),
        weightedScore: 0,
        findingsCount: dashboardFriction,
        strengthsCount: 0,
        evidenceRef: workflowOptimization?.optimizationRecordId ?? null,
      },
      {
        category: "navigation_quality",
        score: this.weights.clamp(
          config.scoreScale.max -
            friction.filter(
              (f) => f.category === "excessive_navigation" || f.category === "backtracking",
            ).length *
              config.severityImpact.warning,
          config,
        ),
        weight: this.weights.getWeight(config, "navigation_quality"),
        weightedScore: 0,
        findingsCount: friction.filter(
          (f) => f.category === "excessive_navigation" || f.category === "backtracking",
        ).length,
        strengthsCount: 0,
        evidenceRef: workflowOptimization?.optimizationRecordId ?? null,
      },
    ];

    return { workflowScore: this.weights.clamp(base, config), breakdown };
  }
}
