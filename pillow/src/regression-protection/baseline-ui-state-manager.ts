/** T3-07 — Baseline UI state management. */

import type { UxScoringReport } from "../ux-scoring-engine/types.js";
import type { ValidationRunReport } from "../validation-engine/types.js";
import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { VisualFoundationCertificationReport } from "../visual-foundation-certification-engine/types.js";
import type { RegressionProtectionConfiguration } from "./configuration.js";
import type { BaselineUiState } from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { appendRegressionLog } from "./regression-logging.js";
import { REGRESSION_METADATA_VERSION } from "./paths.js";

export class BaselineUiStateManager {
  private storedBaseline: BaselineUiState | null = null;
  private readonly metadata = new RegressionMetadataGenerator();

  selectBaseline(input: {
    config: RegressionProtectionConfiguration;
    validationReport: ValidationRunReport | null;
    uxScoring: UxScoringReport | null;
    previewGeneration: PreviewGenerationReport | null;
    frontendBuild: FrontendBuildReport | null;
    visualFoundation: VisualFoundationCertificationReport | null;
  }): BaselineUiState {
    appendRegressionLog({
      event: "baseline_selection",
      level: "info",
      details: "Selecting known-good baseline UI state",
    });

    if (
      input.config.baselineSourceRules.includes("stored_baseline") &&
      this.storedBaseline
    ) {
      return this.storedBaseline;
    }

    const uxRecord = input.uxScoring?.record;
    const validationPass =
      input.validationReport?.validation.decision === "pass" ||
      input.validationReport?.validation.decision === "partial";
    const preview = input.previewGeneration?.records[0];
    const frontendIds =
      preview?.sourceFrontendBuildRecordIds ??
      input.frontendBuild?.records.map((r) => r.buildRecordId) ??
      [];

    const baseline: BaselineUiState = {
      baselineUiStateId: this.metadata.buildBaselineId(),
      timestamp: new Date().toISOString(),
      sourceValidationReportId: validationPass
        ? (input.validationReport?.validationRunReportId ?? null)
        : null,
      sourceUxScoreId: uxRecord?.uxScoreId ?? null,
      sourcePreviewBuildId: preview?.previewBuildId ?? null,
      sourceFrontendBuildRecordIds: frontendIds,
      overallUxScore: uxRecord?.overallUxScore ?? 75,
      layoutScore: uxRecord?.layoutScore ?? 75,
      componentScore: uxRecord?.componentScore ?? 75,
      navigationScore: uxRecord?.screenScore ?? 75,
      accessibilityScore: uxRecord?.accessibilityScore ?? 75,
      consistencyScore: uxRecord?.consistencyScore ?? 75,
      workflowScore: uxRecord?.workflowScore ?? 75,
      responsiveScore: uxRecord?.layoutScore ?? 75,
      executivePreferenceScore: uxRecord?.executivePreferenceAlignmentScore ?? 75,
      screenIds: preview ? [preview.previewTargetScreenId] : [],
      componentIds: preview?.sourceComponentGenerationIds ?? [],
      metadataVersion: REGRESSION_METADATA_VERSION,
    };

    if (input.visualFoundation?.finalCertificationDecision === "pass") {
      const scores = input.visualFoundation.missionResults.map((m) => m.readinessScore);
      const avgReadiness =
        scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      baseline.overallUxScore = Math.max(baseline.overallUxScore, avgReadiness);
    }

    if (validationPass || input.config.baselineSourceRules.includes("latest_ux_score")) {
      this.storedBaseline = baseline;
    }

    return baseline;
  }

  getStoredBaseline(): BaselineUiState | null {
    return this.storedBaseline;
  }

  resetForTesting(): void {
    this.storedBaseline = null;
  }
}
