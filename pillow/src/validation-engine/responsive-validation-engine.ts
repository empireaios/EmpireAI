/** T3-06 — Responsive defect validation. */

import type { ValidationEngineConfiguration } from "./configuration.js";
import type { PreviewValidationTarget } from "./preview-validation-runner.js";
import type { UiDefect } from "./types.js";
import { ValidationMetadataGenerator } from "./validation-metadata-generator.js";
import { appendValidationLog } from "./validation-logging.js";

export class ResponsiveValidationEngine {
  private readonly metadata = new ValidationMetadataGenerator();

  validate(
    target: PreviewValidationTarget,
    config: ValidationEngineConfiguration,
  ): UiDefect[] {
    if (!config.responsiveValidationRulesEnabled) return [];

    appendValidationLog({
      event: "responsive_validation",
      level: "info",
      details: `Validating responsive layout for ${target.preview.previewBuildId}`,
    });

    const defects: UiDefect[] = [];
    const preview = target.preview;

    if (
      preview.previewScope === "responsive_breakpoint" ||
      preview.previewScope === "layout" ||
      preview.previewScope === "dashboard"
    ) {
      const hasResponsive = preview.previewFiles.some(
        (f) => f.includes("responsive") || f.includes("breakpoint"),
      );
      if (!hasResponsive && preview.previewFiles.length > 0) {
        defects.push(
          this.metadata.enrichDefect({
            defectId: this.metadata.buildDefectId(),
            defectCategory: "broken_responsive_layout",
            defectDescription: "Responsive breakpoint rules not found in preview artifacts",
            severity: "medium",
            sourcePreviewBuildId: preview.previewBuildId,
            affectedScreenId: preview.previewTargetScreenId,
            affectedRouteOrViewId: preview.previewTargetRouteOrViewId,
            affectedComponentId: null,
            affectedLayoutRegionId: null,
            evidenceMetadata: { scope: preview.previewScope },
            detectionConfidence: 65,
            timestamp: new Date().toISOString(),
            metadataVersion: "1.0.0",
          }),
        );
      }
    }

    return defects.filter((d) => config.defectCategories.includes(d.defectCategory));
  }
}
