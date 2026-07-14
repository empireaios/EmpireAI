/** T3-06 — Component defect validation. */

import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { ValidationEngineConfiguration } from "./configuration.js";
import type { PreviewValidationTarget } from "./preview-validation-runner.js";
import type { UiDefect } from "./types.js";
import { ValidationMetadataGenerator } from "./validation-metadata-generator.js";
import { appendValidationLog } from "./validation-logging.js";

export class ComponentValidationEngine {
  private readonly metadata = new ValidationMetadataGenerator();

  validate(
    target: PreviewValidationTarget,
    componentGeneration: ComponentGenerationReport | null,
    config: ValidationEngineConfiguration,
  ): UiDefect[] {
    if (!config.componentValidationRulesEnabled) return [];

    appendValidationLog({
      event: "component_validation",
      level: "info",
      details: `Validating components for ${target.preview.previewBuildId}`,
    });

    const defects: UiDefect[] = [];
    const records =
      componentGeneration?.records.filter((r) =>
        target.componentGenerationIds.includes(r.componentGenerationId),
      ) ?? [];

    for (const record of records) {
      if (record.generationStatus === "blocked" || record.generationStatus === "failed") {
        defects.push(
          this.metadata.enrichDefect({
            defectId: this.metadata.buildDefectId(),
            defectCategory: "broken_component",
            defectDescription: `Component ${record.componentName} generation ${record.generationStatus}`,
            severity: "high",
            sourcePreviewBuildId: target.preview.previewBuildId,
            affectedScreenId: target.preview.previewTargetScreenId,
            affectedRouteOrViewId: target.preview.previewTargetRouteOrViewId,
            affectedComponentId: record.componentGenerationId,
            affectedLayoutRegionId: null,
            evidenceMetadata: { componentName: record.componentName },
            detectionConfidence: 85,
            timestamp: new Date().toISOString(),
            metadataVersion: "1.0.0",
          }),
        );
      }
      if (!record.generatedComponentCode.includes("use client")) {
        defects.push(
          this.metadata.enrichDefect({
            defectId: this.metadata.buildDefectId(),
            defectCategory: "missing_component",
            defectDescription: `Component ${record.componentName} missing use client directive`,
            severity: "medium",
            sourcePreviewBuildId: target.preview.previewBuildId,
            affectedScreenId: target.preview.previewTargetScreenId,
            affectedRouteOrViewId: target.preview.previewTargetRouteOrViewId,
            affectedComponentId: record.componentGenerationId,
            affectedLayoutRegionId: null,
            evidenceMetadata: { check: "use-client" },
            detectionConfidence: 70,
            timestamp: new Date().toISOString(),
            metadataVersion: "1.0.0",
          }),
        );
      }
    }

    if (records.length === 0 && target.componentGenerationIds.length > 0) {
      defects.push(
        this.metadata.enrichDefect({
          defectId: this.metadata.buildDefectId(),
          defectCategory: "missing_component",
          defectDescription: "Referenced component records not found in generation report",
          severity: "medium",
          sourcePreviewBuildId: target.preview.previewBuildId,
          affectedScreenId: target.preview.previewTargetScreenId,
          affectedRouteOrViewId: target.preview.previewTargetRouteOrViewId,
          affectedComponentId: null,
          affectedLayoutRegionId: null,
          evidenceMetadata: { expected: String(target.componentGenerationIds.length) },
          detectionConfidence: 60,
          timestamp: new Date().toISOString(),
          metadataVersion: "1.0.0",
        }),
      );
    }

    return defects.filter((d) => config.defectCategories.includes(d.defectCategory));
  }
}
