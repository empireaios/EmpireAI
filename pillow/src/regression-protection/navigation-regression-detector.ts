/** T3-07 — Navigation regression detection. */

import type { NavigationGraph } from "../navigation-mapping-engine/types.js";
import type { RegressionProtectionConfiguration } from "./configuration.js";
import type { BaselineUiState, ProposedUiState, UiRegression } from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { UxBaselineComparator } from "./ux-baseline-comparator.js";
import { appendRegressionLog } from "./regression-logging.js";

export class NavigationRegressionDetector {
  private readonly metadata = new RegressionMetadataGenerator();
  private readonly comparator = new UxBaselineComparator();

  detect(
    baseline: BaselineUiState,
    proposed: ProposedUiState,
    navigationGraph: NavigationGraph | null,
    config: RegressionProtectionConfiguration,
  ): UiRegression[] {
    if (!config.navigationRegressionRulesEnabled) return [];
    if (!config.regressionCategories.includes("navigation_regression")) return [];

    appendRegressionLog({
      event: "regression_detection",
      level: "info",
      details: "Checking navigation regressions",
    });

    const regressions: UiRegression[] = [];
    const delta = this.comparator.scoreDelta(baseline.navigationScore, proposed.navigationScore);
    if (delta >= config.uxScoreRegressionThreshold) {
      regressions.push(
        this.metadata.enrichRegression({
          regressionId: this.metadata.buildRegressionId(),
          regressionCategory: "navigation_regression",
          regressionDescription: `Navigation score dropped by ${delta.toFixed(1)} points`,
          severity: delta >= 12 ? "high" : "medium",
          baselineReference: baseline.baselineUiStateId,
          proposedReference: proposed.proposedUiStateId,
          affectedScreenId: proposed.screenIds[0] ?? null,
          affectedRouteOrViewId: navigationGraph?.entryPoints[0] ?? null,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          evidenceMetadata: {
            baselineNavScore: String(baseline.navigationScore),
            proposedNavScore: String(proposed.navigationScore),
            nodeCount: String(navigationGraph?.nodes.length ?? 0),
          },
          detectionConfidence: 76,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (navigationGraph && navigationGraph.entryPoints.length === 0) {
      regressions.push(
        this.metadata.enrichRegression({
          regressionId: this.metadata.buildRegressionId(),
          regressionCategory: "navigation_regression",
          regressionDescription: "Proposed navigation has no entry points",
          severity: "high",
          baselineReference: baseline.baselineUiStateId,
          proposedReference: proposed.proposedUiStateId,
          affectedScreenId: proposed.screenIds[0] ?? null,
          affectedRouteOrViewId: null,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          evidenceMetadata: { entryPoints: "0" },
          detectionConfidence: 80,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    return regressions;
  }
}
