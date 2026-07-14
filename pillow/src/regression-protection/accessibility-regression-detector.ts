/** T3-07 — Accessibility regression detection. */

import type { RegressionProtectionConfiguration } from "./configuration.js";
import type { BaselineUiState, ProposedUiState, UiRegression } from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { UxBaselineComparator } from "./ux-baseline-comparator.js";
import { appendRegressionLog } from "./regression-logging.js";

export class AccessibilityRegressionDetector {
  private readonly metadata = new RegressionMetadataGenerator();
  private readonly comparator = new UxBaselineComparator();

  detect(
    baseline: BaselineUiState,
    proposed: ProposedUiState,
    config: RegressionProtectionConfiguration,
  ): UiRegression[] {
    if (!config.accessibilityRegressionRulesEnabled) return [];
    if (!config.regressionCategories.includes("accessibility_regression")) return [];

    appendRegressionLog({
      event: "regression_detection",
      level: "info",
      details: "Checking accessibility regressions",
    });

    const delta = this.comparator.scoreDelta(
      baseline.accessibilityScore,
      proposed.accessibilityScore,
    );
    if (delta < config.uxScoreRegressionThreshold) return [];

    return [
      this.metadata.enrichRegression({
        regressionId: this.metadata.buildRegressionId(),
        regressionCategory: "accessibility_regression",
        regressionDescription: `Accessibility score dropped by ${delta.toFixed(1)} points`,
        severity: delta >= 12 ? "critical" : "high",
        baselineReference: baseline.baselineUiStateId,
        proposedReference: proposed.proposedUiStateId,
        affectedScreenId: proposed.screenIds[0] ?? null,
        affectedRouteOrViewId: null,
        affectedComponentId: null,
        affectedLayoutRegionId: null,
        evidenceMetadata: {
          baselineA11yScore: String(baseline.accessibilityScore),
          proposedA11yScore: String(proposed.accessibilityScore),
        },
        detectionConfidence: 84,
        timestamp: new Date().toISOString(),
        metadataVersion: "1.0.0",
      }),
    ];
  }
}
