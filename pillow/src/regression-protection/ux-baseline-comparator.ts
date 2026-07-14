/** T3-07 — Proposed UI state builder and UX baseline comparison. */

import type { UxScoringReport } from "../ux-scoring-engine/types.js";
import type { RecommendationReport } from "../recommendation-engine/types.js";
import type { ValidationRunReport } from "../validation-engine/types.js";
import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { BaselineUiState, ProposedUiState } from "./types.js";
import { RegressionMetadataGenerator } from "./regression-metadata-generator.js";
import { appendRegressionLog } from "./regression-logging.js";
import { REGRESSION_METADATA_VERSION } from "./paths.js";

export class UxBaselineComparator {
  private readonly metadata = new RegressionMetadataGenerator();

  buildProposedState(input: {
    validationReport: ValidationRunReport | null;
    uxScoring: UxScoringReport | null;
    recommendationReport: RecommendationReport | null;
    previewGeneration: PreviewGenerationReport | null;
    frontendBuild: FrontendBuildReport | null;
  }): ProposedUiState {
    appendRegressionLog({
      event: "baseline_comparison",
      level: "info",
      details: "Building proposed UI state for comparison",
    });

    const uxRecord = input.uxScoring?.record;
    const preview = input.previewGeneration?.records[0];
    const frontendIds =
      preview?.sourceFrontendBuildRecordIds ??
      input.frontendBuild?.records.map((r) => r.buildRecordId) ??
      [];

    return {
      proposedUiStateId: this.metadata.buildProposedId(),
      timestamp: new Date().toISOString(),
      sourceValidationReportId: input.validationReport?.validationRunReportId ?? null,
      sourcePreviewBuildId: preview?.previewBuildId ?? null,
      sourceFrontendBuildRecordIds: frontendIds,
      sourceUxScoreId: uxRecord?.uxScoreId ?? null,
      sourceRecommendationId: input.recommendationReport?.record.recommendationRecordId ?? null,
      overallUxScore: uxRecord?.overallUxScore ?? 70,
      layoutScore: uxRecord?.layoutScore ?? 70,
      componentScore: uxRecord?.componentScore ?? 70,
      navigationScore: uxRecord?.screenScore ?? 70,
      accessibilityScore: uxRecord?.accessibilityScore ?? 70,
      consistencyScore: uxRecord?.consistencyScore ?? 70,
      workflowScore: uxRecord?.workflowScore ?? 70,
      responsiveScore: uxRecord?.layoutScore ?? 70,
      executivePreferenceScore: uxRecord?.executivePreferenceAlignmentScore ?? 70,
      screenIds: preview ? [preview.previewTargetScreenId] : [],
      componentIds: preview?.sourceComponentGenerationIds ?? [],
      metadataVersion: REGRESSION_METADATA_VERSION,
    };
  }

  scoreDelta(baseline: number, proposed: number): number {
    return baseline - proposed;
  }
}
