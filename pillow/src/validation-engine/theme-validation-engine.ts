/** T3-06 — Theme defect validation. */

import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { ValidationEngineConfiguration } from "./configuration.js";
import type { PreviewValidationTarget } from "./preview-validation-runner.js";
import type { UiDefect } from "./types.js";
import { ValidationMetadataGenerator } from "./validation-metadata-generator.js";
import { appendValidationLog } from "./validation-logging.js";

export class ThemeValidationEngine {
  private readonly metadata = new ValidationMetadataGenerator();

  validate(
    target: PreviewValidationTarget,
    themeGeneration: ThemeGenerationReport | null,
    config: ValidationEngineConfiguration,
  ): UiDefect[] {
    if (!config.themeValidationRulesEnabled) return [];

    appendValidationLog({
      event: "theme_validation",
      level: "info",
      details: `Validating themes for ${target.preview.previewBuildId}`,
    });

    const defects: UiDefect[] = [];
    const records =
      themeGeneration?.records.filter((r) => target.themeIds.includes(r.themeId)) ?? [];

    for (const record of records) {
      if (record.themeStatus === "blocked" || record.themeStatus === "failed") {
        defects.push(
          this.metadata.enrichDefect({
            defectId: this.metadata.buildDefectId(),
            defectCategory: "broken_theme_token",
            defectDescription: `Theme ${record.themeName} generation ${record.themeStatus}`,
            severity: "high",
            sourcePreviewBuildId: target.preview.previewBuildId,
            affectedScreenId: target.preview.previewTargetScreenId,
            affectedRouteOrViewId: target.preview.previewTargetRouteOrViewId,
            affectedComponentId: null,
            affectedLayoutRegionId: null,
            evidenceMetadata: { themeName: record.themeName },
            detectionConfidence: 80,
            timestamp: new Date().toISOString(),
            metadataVersion: "1.0.0",
          }),
        );
      }
      if (record.colorTokens.length === 0) {
        defects.push(
          this.metadata.enrichDefect({
            defectId: this.metadata.buildDefectId(),
            defectCategory: "inconsistent_styling",
            defectDescription: `Theme ${record.themeName} has no color tokens`,
            severity: "medium",
            sourcePreviewBuildId: target.preview.previewBuildId,
            affectedScreenId: target.preview.previewTargetScreenId,
            affectedRouteOrViewId: target.preview.previewTargetRouteOrViewId,
            affectedComponentId: null,
            affectedLayoutRegionId: null,
            evidenceMetadata: { themeScope: record.themeScope },
            detectionConfidence: 70,
            timestamp: new Date().toISOString(),
            metadataVersion: "1.0.0",
          }),
        );
      }
    }

    return defects.filter((d) => config.defectCategories.includes(d.defectCategory));
  }
}
