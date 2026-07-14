/** T3-06 — Validation Engine manager — core validation pipeline. */

import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { ValidationEngineConfiguration } from "./configuration.js";
import { PreviewValidationRunner } from "./preview-validation-runner.js";
import { UiDefectDetectionEngine } from "./ui-defect-detection-engine.js";
import { ValidationReportGenerator } from "./validation-report-generator.js";
import { ValidationOutputValidator } from "./validation-output-validator.js";
import { ValidationMetadataGenerator } from "./validation-metadata-generator.js";
import type { UiValidationReport, ValidationRunReport, ValidationScope } from "./types.js";
import { VALIDATION_METADATA_VERSION } from "./paths.js";
import { appendValidationLog } from "./validation-logging.js";

export class ValidationEngineManager {
  private readonly runner = new PreviewValidationRunner();
  private readonly detector = new UiDefectDetectionEngine();
  private readonly reportGenerator = new ValidationReportGenerator();
  private readonly outputValidator = new ValidationOutputValidator();
  private readonly metadata = new ValidationMetadataGenerator();

  runValidation(input: {
    config: ValidationEngineConfiguration;
    previewGeneration: PreviewGenerationReport | null;
    frontendBuild: FrontendBuildReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutRefactoring: LayoutRefactoringReport | null;
    themeGeneration: ThemeGenerationReport | null;
  }): ValidationRunReport {
    const started = Date.now();

    appendValidationLog({
      event: "validation_engine_start",
      level: "info",
      details: "Starting UI validation run",
    });

    const targets = this.runner.collectTargets({
      previewGeneration: input.previewGeneration,
      frontendBuild: input.frontendBuild,
      componentGeneration: input.componentGeneration,
      layoutRefactoring: input.layoutRefactoring,
      themeGeneration: input.themeGeneration,
    });

    const reports: UiValidationReport[] = [];
    const scopes = input.config.validationScopes;

    for (const target of targets) {
      if (reports.length >= input.config.maxReportsPerValidation) break;

      const defects = this.detector.detect({
        target,
        frontendBuild: input.frontendBuild,
        componentGeneration: input.componentGeneration,
        layoutRefactoring: input.layoutRefactoring,
        themeGeneration: input.themeGeneration,
        config: input.config,
      });

      const scope: ValidationScope = scopes.includes("full")
        ? "full"
        : (scopes[0] ?? "preview");

      reports.push(
        this.reportGenerator.buildReport({
          target,
          defects,
          scope,
        }),
      );
    }

    const validation = this.outputValidator.validate(reports, input.config);
    const report: ValidationRunReport = {
      validationRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      reports,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: VALIDATION_METADATA_VERSION,
    };

    appendValidationLog({
      event: "validation_engine_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Validation ${validation.decision.toUpperCase()} · ${validation.defectsDetected} defects · ${report.durationMs}ms`,
    });

    return report;
  }
}
