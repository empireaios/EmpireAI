/** T3-07 — UX score regression detection. */

import type { RegressionProtectionConfiguration } from "./configuration.js";
import type { BaselineUiState, ProposedUiState, UiRegression } from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { UxBaselineComparator } from "./ux-baseline-comparator.js";
import { appendRegressionLog } from "./regression-logging.js";

export class UxScoreRegressionDetector {
  private readonly metadata = new RegressionMetadataGenerator();
  private readonly comparator = new UxBaselineComparator();

  detect(
    baseline: BaselineUiState,
    proposed: ProposedUiState,
    config: RegressionProtectionConfiguration,
  ): UiRegression[] {
    if (!config.regressionCategories.includes("ux_score_regression")) return [];

    appendRegressionLog({
      event: "regression_detection",
      level: "info",
      details: "Checking UX score regressions",
    });

    const delta = this.comparator.scoreDelta(baseline.overallUxScore, proposed.overallUxScore);
    if (delta < config.uxScoreRegressionThreshold) return [];

    return [
      this.metadata.enrichRegression({
        regressionId: this.metadata.buildRegressionId(),
        regressionCategory: "ux_score_regression",
        regressionDescription: `Overall UX score dropped by ${delta.toFixed(1)} points`,
        severity: delta >= 15 ? "critical" : delta >= 10 ? "high" : "medium",
        baselineReference: baseline.baselineUiStateId,
        proposedReference: proposed.proposedUiStateId,
        affectedScreenId: proposed.screenIds[0] ?? null,
        affectedRouteOrViewId: null,
        affectedComponentId: null,
        affectedLayoutRegionId: null,
        evidenceMetadata: {
          baselineScore: String(baseline.overallUxScore),
          proposedScore: String(proposed.overallUxScore),
          delta: String(delta),
        },
        detectionConfidence: 85,
        timestamp: new Date().toISOString(),
        metadataVersion: "1.0.0",
      }),
    ];
  }
}
