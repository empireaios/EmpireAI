/** T3-06 — Validation report generation. */

import type { PreviewValidationTarget } from "./preview-validation-runner.js";
import type { UiDefect, UiValidationReport, ValidationScope } from "./types.js";
import { ValidationMetadataGenerator } from "./validation-metadata-generator.js";
import { appendValidationLog } from "./validation-logging.js";
import { VALIDATION_METADATA_VERSION } from "./paths.js";

function maxSeverity(defects: UiDefect[]): UiValidationReport["severity"] {
  const order = ["critical", "high", "medium", "low", "info"] as const;
  for (const level of order) {
    if (defects.some((d) => d.severity === level)) return level;
  }
  return "info";
}

export class ValidationReportGenerator {
  private readonly metadata = new ValidationMetadataGenerator();

  buildReport(input: {
    target: PreviewValidationTarget;
    defects: UiDefect[];
    scope: ValidationScope;
  }): UiValidationReport {
    appendValidationLog({
      event: "validation_report_generation",
      level: input.defects.length > 0 ? "warn" : "info",
      details: `Report for ${input.target.preview.previewBuildId} · ${input.defects.length} defects`,
    });

    const validationStatus =
      input.defects.length === 0
        ? "validated"
        : input.defects.some((d) => d.severity === "critical")
          ? "blocked"
          : "defects_found";

    const confidenceScore =
      input.defects.length === 0
        ? 100
        : Math.max(
            0,
            100 -
              input.defects.reduce((sum, d) => sum + (100 - d.detectionConfidence), 0) /
                Math.max(1, input.defects.length),
          );

    return this.metadata.enrichReport({
      validationReportId: this.metadata.buildReportId(),
      timestamp: new Date().toISOString(),
      sourcePreviewBuildId: input.target.preview.previewBuildId,
      sourceFrontendBuildRecordIds: input.target.frontendBuildIds,
      sourceComponentGenerationIds: input.target.componentGenerationIds,
      sourceLayoutRefactoringIds: input.target.layoutRefactoringIds,
      sourceThemeIds: input.target.themeIds,
      validationScope: input.scope,
      validationStatus,
      detectedDefects: input.defects,
      affectedScreens: [
        ...new Set(
          input.defects
            .map((d) => d.affectedScreenId)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
      affectedComponents: [
        ...new Set(
          input.defects
            .map((d) => d.affectedComponentId)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
      affectedLayouts: [
        ...new Set(
          input.defects
            .map((d) => d.affectedLayoutRegionId)
            .filter((id): id is string => Boolean(id)),
        ),
      ],
      affectedThemes: input.target.themeIds,
      evidenceReferences: input.defects.map((d) => d.defectId),
      severity: maxSeverity(input.defects),
      confidenceScore: Math.round(confidenceScore),
      metadataVersion: VALIDATION_METADATA_VERSION,
    });
  }
}
