/** T3-07 — UI state regression detection (loading/empty/error/design system). */

import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { ValidationRunReport } from "../validation-engine/types.js";
import type { RegressionProtectionConfiguration } from "./configuration.js";
import type { BaselineUiState, ProposedUiState, UiRegression } from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { appendRegressionLog } from "./regression-logging.js";

export class StateRegressionDetector {
  private readonly metadata = new RegressionMetadataGenerator();

  detect(
    baseline: BaselineUiState,
    proposed: ProposedUiState,
    validationReport: ValidationRunReport | null,
    previewGeneration: PreviewGenerationReport | null,
    config: RegressionProtectionConfiguration,
  ): UiRegression[] {
    if (!config.stateRegressionRulesEnabled) return [];

    appendRegressionLog({
      event: "regression_detection",
      level: "info",
      details: "Checking UI state regressions",
    });

    const regressions: UiRegression[] = [];

    if (validationReport?.validation.decision === "blocked") {
      regressions.push(
        this.metadata.enrichRegression({
          regressionId: this.metadata.buildRegressionId(),
          regressionCategory: "design_system_regression",
          regressionDescription: "Validation blocked proposed changes — potential design system regression",
          severity: "critical",
          baselineReference: baseline.baselineUiStateId,
          proposedReference: proposed.proposedUiStateId,
          affectedScreenId: proposed.screenIds[0] ?? null,
          affectedRouteOrViewId: null,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          evidenceMetadata: { validationDecision: "blocked" },
          detectionConfidence: 90,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    const stateScopes: Record<
      string,
      "loading_state_regression" | "empty_state_regression" | "error_state_regression"
    > = {
      loading_state: "loading_state_regression",
      empty_state: "empty_state_regression",
      error_state: "error_state_regression",
    };

    for (const preview of previewGeneration?.records ?? []) {
      const category = stateScopes[preview.previewScope];
      if (!category || !config.regressionCategories.includes(category)) continue;
      if (preview.buildStatus === "failed" || preview.buildStatus === "blocked") {
        regressions.push(
          this.metadata.enrichRegression({
            regressionId: this.metadata.buildRegressionId(),
            regressionCategory: category,
            regressionDescription: `${preview.previewScope} preview regressed to ${preview.buildStatus}`,
            severity: "high",
            baselineReference: baseline.baselineUiStateId,
            proposedReference: proposed.proposedUiStateId,
            affectedScreenId: preview.previewTargetScreenId,
            affectedRouteOrViewId: preview.previewTargetRouteOrViewId,
            affectedComponentId: null,
            affectedLayoutRegionId: null,
            evidenceMetadata: { buildStatus: preview.buildStatus },
            detectionConfidence: 82,
            timestamp: new Date().toISOString(),
            metadataVersion: "1.0.0",
          }),
        );
      }
    }

    return regressions.filter((r) => config.regressionCategories.includes(r.regressionCategory));
  }
}
