/** T4-05 — Links UX scores and validation reports to comparisons. */

import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { ValidationEngine } from "../validation-engine/engine.js";
import type { SideBySideComparisonConfiguration } from "./configuration.js";
import type { ScoreDifferenceSummary } from "./types.js";
import { appendComparisonLog } from "./comparison-logging.js";

export class ScoreComparisonConnector {
  collect(input: {
    config: SideBySideComparisonConfiguration;
    uxScoring: UxScoringEngine | null;
    validationEngine: ValidationEngine | null;
  }): {
    uxScoreIds: string[];
    validationReportIds: string[];
    uxScoreDifferences: ScoreDifferenceSummary[];
    accessibilityDifferences: ScoreDifferenceSummary[];
    consistencyDifferences: ScoreDifferenceSummary[];
    workflowDifferences: ScoreDifferenceSummary[];
  } {
    const uxScoreIds: string[] = [];
    const validationReportIds: string[] = [];
    const uxScoreDifferences: ScoreDifferenceSummary[] = [];
    const accessibilityDifferences: ScoreDifferenceSummary[] = [];
    const consistencyDifferences: ScoreDifferenceSummary[] = [];
    const workflowDifferences: ScoreDifferenceSummary[] = [];

    if (input.config.uxScoreDisplayRulesEnabled && input.uxScoring) {
      try {
        const report = input.uxScoring.getLatestReport?.() ?? null;
        if (report?.record) {
          uxScoreIds.push(report.record.uxScoreId);
          appendComparisonLog({
            event: "ux_score_comparison",
            level: "info",
            details: "Linked UX score for comparison display",
          });
          uxScoreDifferences.push({
            metric: "overallUxScore",
            baselineValue: report.record.overallUxScore,
            comparedValue: null,
            delta: null,
          });
          if (input.config.accessibilityDisplayRulesEnabled) {
            accessibilityDifferences.push({
              metric: "accessibilityScore",
              baselineValue: report.record.accessibilityScore,
              comparedValue: null,
              delta: null,
            });
          }
          if (input.config.consistencyDisplayRulesEnabled) {
            consistencyDifferences.push({
              metric: "consistencyScore",
              baselineValue: report.record.consistencyScore,
              comparedValue: null,
              delta: null,
            });
          }
          workflowDifferences.push({
            metric: "workflowScore",
            baselineValue: report.record.workflowScore,
            comparedValue: null,
            delta: null,
          });
        }
      } catch {
        appendComparisonLog({
          event: "ux_score_comparison",
          level: "warn",
          details: "UX scoring data unavailable",
        });
      }
    }

    if (input.validationEngine) {
      try {
        const report = input.validationEngine.getLatestReport?.() ?? null;
        for (const r of report?.reports ?? []) {
          validationReportIds.push(r.validationReportId);
        }
      } catch {
        appendComparisonLog({
          event: "validation_results",
          level: "warn",
          details: "Validation reports unavailable",
        });
      }
    }

    return {
      uxScoreIds,
      validationReportIds,
      uxScoreDifferences,
      accessibilityDifferences,
      consistencyDifferences,
      workflowDifferences,
    };
  }
}
