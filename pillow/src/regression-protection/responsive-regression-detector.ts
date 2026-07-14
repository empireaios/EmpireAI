/** T3-07 — Responsive layout regression detection. */

import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { RegressionProtectionConfiguration } from "./configuration.js";
import type { BaselineUiState, ProposedUiState, UiRegression } from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { UxBaselineComparator } from "./ux-baseline-comparator.js";
import { appendRegressionLog } from "./regression-logging.js";

export class ResponsiveRegressionDetector {
  private readonly metadata = new RegressionMetadataGenerator();
  private readonly comparator = new UxBaselineComparator();

  detect(
    baseline: BaselineUiState,
    proposed: ProposedUiState,
    previewGeneration: PreviewGenerationReport | null,
    config: RegressionProtectionConfiguration,
  ): UiRegression[] {
    if (!config.responsiveRegressionRulesEnabled) return [];
    if (!config.regressionCategories.includes("responsive_layout_regression")) return [];

    appendRegressionLog({
      event: "regression_detection",
      level: "info",
      details: "Checking responsive regressions",
    });

    const regressions: UiRegression[] = [];
    const delta = this.comparator.scoreDelta(baseline.responsiveScore, proposed.responsiveScore);
    if (delta >= config.uxScoreRegressionThreshold) {
      regressions.push(
        this.metadata.enrichRegression({
          regressionId: this.metadata.buildRegressionId(),
          regressionCategory: "responsive_layout_regression",
          regressionDescription: `Responsive layout score dropped by ${delta.toFixed(1)} points`,
          severity: "medium",
          baselineReference: baseline.baselineUiStateId,
          proposedReference: proposed.proposedUiStateId,
          affectedScreenId: proposed.screenIds[0] ?? null,
          affectedRouteOrViewId: null,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          evidenceMetadata: {
            baselineResponsive: String(baseline.responsiveScore),
            proposedResponsive: String(proposed.responsiveScore),
          },
          detectionConfidence: 70,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    const responsivePreviews =
      previewGeneration?.records.filter(
        (r) =>
          r.previewScope === "responsive_breakpoint" ||
          r.previewScope === "layout" ||
          r.previewScope === "dashboard",
      ) ?? [];
    for (const preview of responsivePreviews) {
      const hasResponsive = preview.previewFiles.some((f) =>
        f.includes("responsive"),
      );
      if (!hasResponsive && preview.previewFiles.length > 0) {
        regressions.push(
          this.metadata.enrichRegression({
            regressionId: this.metadata.buildRegressionId(),
            regressionCategory: "responsive_layout_regression",
            regressionDescription: "Responsive preview artifacts missing breakpoint coverage",
            severity: "medium",
            baselineReference: baseline.baselineUiStateId,
            proposedReference: proposed.proposedUiStateId,
            affectedScreenId: preview.previewTargetScreenId,
            affectedRouteOrViewId: preview.previewTargetRouteOrViewId,
            affectedComponentId: null,
            affectedLayoutRegionId: null,
            evidenceMetadata: { previewScope: preview.previewScope },
            detectionConfidence: 68,
            timestamp: new Date().toISOString(),
            metadataVersion: "1.0.0",
          }),
        );
      }
    }

    return regressions;
  }
}
