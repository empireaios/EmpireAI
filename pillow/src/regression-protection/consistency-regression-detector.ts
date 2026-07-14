/** T3-07 — Visual consistency regression detection. */

import type { RegressionProtectionConfiguration } from "./configuration.js";
import type { BaselineUiState, ProposedUiState, UiRegression } from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { UxBaselineComparator } from "./ux-baseline-comparator.js";
import { appendRegressionLog } from "./regression-logging.js";

export class ConsistencyRegressionDetector {
  private readonly metadata = new RegressionMetadataGenerator();
  private readonly comparator = new UxBaselineComparator();

  detect(
    baseline: BaselineUiState,
    proposed: ProposedUiState,
    config: RegressionProtectionConfiguration,
  ): UiRegression[] {
    if (!config.consistencyRegressionRulesEnabled) return [];
    if (!config.regressionCategories.includes("visual_consistency_regression")) return [];

    appendRegressionLog({
      event: "regression_detection",
      level: "info",
      details: "Checking consistency regressions",
    });

    const regressions: UiRegression[] = [];
    const delta = this.comparator.scoreDelta(baseline.consistencyScore, proposed.consistencyScore);
    if (delta >= config.uxScoreRegressionThreshold) {
      regressions.push(
        this.metadata.enrichRegression({
          regressionId: this.metadata.buildRegressionId(),
          regressionCategory: "visual_consistency_regression",
          regressionDescription: `Visual consistency score dropped by ${delta.toFixed(1)} points`,
          severity: "medium",
          baselineReference: baseline.baselineUiStateId,
          proposedReference: proposed.proposedUiStateId,
          affectedScreenId: proposed.screenIds[0] ?? null,
          affectedRouteOrViewId: null,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          evidenceMetadata: {
            baselineConsistency: String(baseline.consistencyScore),
            proposedConsistency: String(proposed.consistencyScore),
          },
          detectionConfidence: 72,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    const execDelta = this.comparator.scoreDelta(
      baseline.executivePreferenceScore,
      proposed.executivePreferenceScore,
    );
    if (
      execDelta >= config.uxScoreRegressionThreshold &&
      config.regressionCategories.includes("executive_preference_regression")
    ) {
      regressions.push(
        this.metadata.enrichRegression({
          regressionId: this.metadata.buildRegressionId(),
          regressionCategory: "executive_preference_regression",
          regressionDescription: `Executive preference alignment dropped by ${execDelta.toFixed(1)} points`,
          severity: "medium",
          baselineReference: baseline.baselineUiStateId,
          proposedReference: proposed.proposedUiStateId,
          affectedScreenId: proposed.screenIds[0] ?? null,
          affectedRouteOrViewId: null,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          evidenceMetadata: {
            baselineExecScore: String(baseline.executivePreferenceScore),
            proposedExecScore: String(proposed.executivePreferenceScore),
          },
          detectionConfidence: 70,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    return regressions;
  }
}
