/** T3-06 — UI state defect validation. */

import type { ValidationEngineConfiguration } from "./configuration.js";
import type { PreviewValidationTarget } from "./preview-validation-runner.js";
import type { UiDefect } from "./types.js";
import { ValidationMetadataGenerator } from "./validation-metadata-generator.js";
import { appendValidationLog } from "./validation-logging.js";

export class StateValidationEngine {
  private readonly metadata = new ValidationMetadataGenerator();

  validate(
    target: PreviewValidationTarget,
    config: ValidationEngineConfiguration,
  ): UiDefect[] {
    if (!config.stateValidationRulesEnabled) return [];

    appendValidationLog({
      event: "state_validation",
      level: "info",
      details: `Validating UI states for ${target.preview.previewBuildId}`,
    });

    const defects: UiDefect[] = [];
    const preview = target.preview;

    if (preview.buildStatus === "blocked" || preview.buildStatus === "failed") {
      defects.push(
        this.metadata.enrichDefect({
          defectId: this.metadata.buildDefectId(),
          defectCategory: "preview_build_failure",
          defectDescription: `Preview build status: ${preview.buildStatus}`,
          severity: "critical",
          sourcePreviewBuildId: preview.previewBuildId,
          affectedScreenId: preview.previewTargetScreenId,
          affectedRouteOrViewId: preview.previewTargetRouteOrViewId,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          evidenceMetadata: { buildStatus: preview.buildStatus },
          detectionConfidence: 90,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (!preview.previewUrl && !preview.previewLocalReference) {
      defects.push(
        this.metadata.enrichDefect({
          defectId: this.metadata.buildDefectId(),
          defectCategory: "broken_loading_state",
          defectDescription: "Preview has no accessible URL or local reference",
          severity: "high",
          sourcePreviewBuildId: preview.previewBuildId,
          affectedScreenId: preview.previewTargetScreenId,
          affectedRouteOrViewId: preview.previewTargetRouteOrViewId,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          evidenceMetadata: { check: "preview-reference" },
          detectionConfidence: 85,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    if (preview.previewEnvironmentStatus === "failed") {
      defects.push(
        this.metadata.enrichDefect({
          defectId: this.metadata.buildDefectId(),
          defectCategory: "broken_error_state",
          defectDescription: "Preview environment failed to initialize",
          severity: "critical",
          sourcePreviewBuildId: preview.previewBuildId,
          affectedScreenId: preview.previewTargetScreenId,
          affectedRouteOrViewId: preview.previewTargetRouteOrViewId,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          evidenceMetadata: { envStatus: preview.previewEnvironmentStatus },
          detectionConfidence: 90,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    const stateScopes: Record<string, "broken_loading_state" | "broken_empty_state" | "broken_error_state"> = {
      loading_state: "broken_loading_state",
      empty_state: "broken_empty_state",
      error_state: "broken_error_state",
    };
    const stateDefect = stateScopes[preview.previewScope];
    if (stateDefect && preview.previewFiles.length === 0) {
      defects.push(
        this.metadata.enrichDefect({
          defectId: this.metadata.buildDefectId(),
          defectCategory: stateDefect,
          defectDescription: `${preview.previewScope} preview has no artifact files`,
          severity: "medium",
          sourcePreviewBuildId: preview.previewBuildId,
          affectedScreenId: preview.previewTargetScreenId,
          affectedRouteOrViewId: preview.previewTargetRouteOrViewId,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          evidenceMetadata: { scope: preview.previewScope },
          detectionConfidence: 75,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    return defects.filter((d) => config.defectCategories.includes(d.defectCategory));
  }
}
