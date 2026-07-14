/** T3-07 — Component regression detection. */

import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { RegressionProtectionConfiguration } from "./configuration.js";
import type { BaselineUiState, ProposedUiState, UiRegression } from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { UxBaselineComparator } from "./ux-baseline-comparator.js";
import { appendRegressionLog } from "./regression-logging.js";

export class ComponentRegressionDetector {
  private readonly metadata = new RegressionMetadataGenerator();
  private readonly comparator = new UxBaselineComparator();

  detect(
    baseline: BaselineUiState,
    proposed: ProposedUiState,
    componentGeneration: ComponentGenerationReport | null,
    config: RegressionProtectionConfiguration,
  ): UiRegression[] {
    if (!config.componentRegressionRulesEnabled) return [];
    if (!config.regressionCategories.includes("component_regression")) return [];

    appendRegressionLog({
      event: "regression_detection",
      level: "info",
      details: "Checking component regressions",
    });

    const regressions: UiRegression[] = [];
    const delta = this.comparator.scoreDelta(baseline.componentScore, proposed.componentScore);
    if (delta >= config.uxScoreRegressionThreshold) {
      regressions.push(
        this.metadata.enrichRegression({
          regressionId: this.metadata.buildRegressionId(),
          regressionCategory: "component_regression",
          regressionDescription: `Component score dropped by ${delta.toFixed(1)} points`,
          severity: delta >= 12 ? "high" : "medium",
          baselineReference: baseline.baselineUiStateId,
          proposedReference: proposed.proposedUiStateId,
          affectedScreenId: proposed.screenIds[0] ?? null,
          affectedRouteOrViewId: null,
          affectedComponentId: proposed.componentIds[0] ?? null,
          affectedLayoutRegionId: null,
          evidenceMetadata: {
            baselineComponentScore: String(baseline.componentScore),
            proposedComponentScore: String(proposed.componentScore),
          },
          detectionConfidence: 78,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    const blocked =
      componentGeneration?.records.filter(
        (r) => r.generationStatus === "blocked" || r.generationStatus === "failed",
      ) ?? [];
    for (const record of blocked) {
      regressions.push(
        this.metadata.enrichRegression({
          regressionId: this.metadata.buildRegressionId(),
          regressionCategory: "component_regression",
          regressionDescription: `Component ${record.componentName} regressed to ${record.generationStatus}`,
          severity: "high",
          baselineReference: baseline.baselineUiStateId,
          proposedReference: proposed.proposedUiStateId,
          affectedScreenId: proposed.screenIds[0] ?? null,
          affectedRouteOrViewId: null,
          affectedComponentId: record.componentGenerationId,
          affectedLayoutRegionId: null,
          evidenceMetadata: { componentName: record.componentName },
          detectionConfidence: 82,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    return regressions;
  }
}
