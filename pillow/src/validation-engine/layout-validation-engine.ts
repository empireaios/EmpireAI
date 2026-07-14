/** T3-06 — Layout defect validation. */

import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ValidationEngineConfiguration } from "./configuration.js";
import type { PreviewValidationTarget } from "./preview-validation-runner.js";
import type { UiDefect } from "./types.js";
import { ValidationMetadataGenerator } from "./validation-metadata-generator.js";
import { appendValidationLog } from "./validation-logging.js";

export class LayoutValidationEngine {
  private readonly metadata = new ValidationMetadataGenerator();

  validate(
    target: PreviewValidationTarget,
    layoutRefactoring: LayoutRefactoringReport | null,
    config: ValidationEngineConfiguration,
  ): UiDefect[] {
    if (!config.layoutValidationRulesEnabled) return [];

    appendValidationLog({
      event: "layout_validation",
      level: "info",
      details: `Validating layouts for ${target.preview.previewBuildId}`,
    });

    const defects: UiDefect[] = [];
    const records =
      layoutRefactoring?.records.filter((r) =>
        target.layoutRefactoringIds.includes(r.layoutRefactoringId),
      ) ?? [];

    for (const record of records) {
      if (record.refactoringStatus === "blocked" || record.refactoringStatus === "failed") {
        defects.push(
          this.metadata.enrichDefect({
            defectId: this.metadata.buildDefectId(),
            defectCategory: "broken_layout",
            defectDescription: `Layout refactoring ${record.refactoringStatus} for ${record.targetScreenId}`,
            severity: "high",
            sourcePreviewBuildId: target.preview.previewBuildId,
            affectedScreenId: record.targetScreenId,
            affectedRouteOrViewId: record.targetRouteOrViewId,
            affectedComponentId: null,
            affectedLayoutRegionId: record.targetScreenId,
            evidenceMetadata: { scope: record.proposedLayoutStructure.join(",") },
            detectionConfidence: 80,
            timestamp: new Date().toISOString(),
            metadataVersion: "1.0.0",
          }),
        );
      }
      if (record.componentPlacementMap.length === 0) {
        defects.push(
          this.metadata.enrichDefect({
            defectId: this.metadata.buildDefectId(),
            defectCategory: "misaligned_component",
            defectDescription: "Layout has no component placements defined",
            severity: "medium",
            sourcePreviewBuildId: target.preview.previewBuildId,
            affectedScreenId: record.targetScreenId,
            affectedRouteOrViewId: record.targetRouteOrViewId,
            affectedComponentId: null,
            affectedLayoutRegionId: record.targetScreenId,
            evidenceMetadata: { placements: "0" },
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
