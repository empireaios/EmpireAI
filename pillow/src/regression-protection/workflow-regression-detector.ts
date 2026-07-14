/** T3-07 — Workflow usability regression detection. */

import type { RegressionProtectionConfiguration } from "./configuration.js";
import type { BaselineUiState, ProposedUiState, UiRegression } from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { UxBaselineComparator } from "./ux-baseline-comparator.js";
import { appendRegressionLog } from "./regression-logging.js";

export class WorkflowRegressionDetector {
  private readonly metadata = new RegressionMetadataGenerator();
  private readonly comparator = new UxBaselineComparator();

  detect(
    baseline: BaselineUiState,
    proposed: ProposedUiState,
    config: RegressionProtectionConfiguration,
  ): UiRegression[] {
    if (!config.workflowRegressionRulesEnabled) return [];
    if (!config.regressionCategories.includes("workflow_usability_regression")) return [];

    appendRegressionLog({
      event: "regression_detection",
      level: "info",
      details: "Checking workflow regressions",
    });

    const delta = this.comparator.scoreDelta(baseline.workflowScore, proposed.workflowScore);
    if (delta < config.uxScoreRegressionThreshold) return [];

    return [
      this.metadata.enrichRegression({
        regressionId: this.metadata.buildRegressionId(),
        regressionCategory: "workflow_usability_regression",
        regressionDescription: `Workflow usability score dropped by ${delta.toFixed(1)} points`,
        severity: delta >= 12 ? "high" : "medium",
        baselineReference: baseline.baselineUiStateId,
        proposedReference: proposed.proposedUiStateId,
        affectedScreenId: proposed.screenIds[0] ?? null,
        affectedRouteOrViewId: null,
        affectedComponentId: null,
        affectedLayoutRegionId: null,
        evidenceMetadata: {
          baselineWorkflow: String(baseline.workflowScore),
          proposedWorkflow: String(proposed.workflowScore),
        },
        detectionConfidence: 74,
        timestamp: new Date().toISOString(),
        metadataVersion: "1.0.0",
      }),
    ];
  }
}
