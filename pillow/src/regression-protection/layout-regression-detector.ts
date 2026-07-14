/** T3-07 — Layout regression detection. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { RegressionProtectionConfiguration } from "./configuration.js";
import type { BaselineUiState, ProposedUiState, UiRegression } from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { UxBaselineComparator } from "./ux-baseline-comparator.js";
import { appendRegressionLog } from "./regression-logging.js";

export class LayoutRegressionDetector {
  private readonly metadata = new RegressionMetadataGenerator();
  private readonly comparator = new UxBaselineComparator();

  detect(
    baseline: BaselineUiState,
    proposed: ProposedUiState,
    layoutModel: LayoutModel | null,
    config: RegressionProtectionConfiguration,
  ): UiRegression[] {
    if (!config.layoutRegressionRulesEnabled) return [];
    if (!config.regressionCategories.includes("layout_regression")) return [];

    appendRegressionLog({
      event: "regression_detection",
      level: "info",
      details: "Checking layout regressions",
    });

    const regressions: UiRegression[] = [];
    const delta = this.comparator.scoreDelta(baseline.layoutScore, proposed.layoutScore);
    if (delta >= config.uxScoreRegressionThreshold) {
      regressions.push(
        this.metadata.enrichRegression({
          regressionId: this.metadata.buildRegressionId(),
          regressionCategory: "layout_regression",
          regressionDescription: `Layout score dropped by ${delta.toFixed(1)} points`,
          severity: delta >= 12 ? "high" : "medium",
          baselineReference: baseline.baselineUiStateId,
          proposedReference: proposed.proposedUiStateId,
          affectedScreenId: proposed.screenIds[0] ?? null,
          affectedRouteOrViewId: null,
          affectedComponentId: null,
          affectedLayoutRegionId: layoutModel?.regions[0]?.regionId ?? null,
          evidenceMetadata: {
            baselineLayoutScore: String(baseline.layoutScore),
            proposedLayoutScore: String(proposed.layoutScore),
            regionCount: String(layoutModel?.regions.length ?? 0),
          },
          detectionConfidence: 80,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (layoutModel && layoutModel.regions.length === 0) {
      regressions.push(
        this.metadata.enrichRegression({
          regressionId: this.metadata.buildRegressionId(),
          regressionCategory: "layout_regression",
          regressionDescription: "Proposed layout has no structural regions",
          severity: "high",
          baselineReference: baseline.baselineUiStateId,
          proposedReference: proposed.proposedUiStateId,
          affectedScreenId: proposed.screenIds[0] ?? null,
          affectedRouteOrViewId: null,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          evidenceMetadata: { regions: "0" },
          detectionConfidence: 75,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    return regressions;
  }
}
