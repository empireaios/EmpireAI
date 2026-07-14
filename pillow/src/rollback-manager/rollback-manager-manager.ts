/** T3-08 — Rollback Manager — core rollback pipeline. */

import type { RegressionRunReport } from "../regression-protection/types.js";
import type { ValidationRunReport } from "../validation-engine/types.js";
import type { PreviewGenerationReport } from "../preview-generator/types.js";
import type { FrontendBuildReport } from "../frontend-builder/types.js";
import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { RollbackManagerConfiguration } from "./configuration.js";
import type { RollbackRunReport, RollbackTrigger } from "./types.js";
import { RestorePointManager } from "./restore-point-manager.js";
import { KnownGoodStateRegistry } from "./known-good-state-registry.js";
import { RollbackDecisionEngine } from "./rollback-decision-engine.js";
import { RollbackExecutionEngine } from "./rollback-execution-engine.js";
import { RollbackVerificationEngine } from "./rollback-verification-engine.js";
import { RollbackReportGenerator } from "./rollback-report-generator.js";
import { RollbackValidator } from "./rollback-validator.js";
import { RollbackMetadataGenerator } from "./rollback-metadata-generator.js";
import { ROLLBACK_METADATA_VERSION } from "./paths.js";
import { appendRollbackLog } from "./rollback-logging.js";

export class RollbackManagerManager {
  private readonly restorePointManager = new RestorePointManager();
  private readonly knownGoodRegistry = new KnownGoodStateRegistry();
  private readonly decisionEngine = new RollbackDecisionEngine();
  private readonly executionEngine = new RollbackExecutionEngine();
  private readonly verificationEngine = new RollbackVerificationEngine();
  private readonly reportGenerator = new RollbackReportGenerator();
  private readonly validator = new RollbackValidator();
  private readonly metadata = new RollbackMetadataGenerator();

  createRestorePoint(input: {
    config: RollbackManagerConfiguration;
    frontendBuild: FrontendBuildReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutRefactoring: LayoutRefactoringReport | null;
    themeGeneration: ThemeGenerationReport | null;
    previewGeneration: PreviewGenerationReport | null;
    regressionReport: RegressionRunReport | null;
  }) {
    return this.restorePointManager.createRestorePoint(input);
  }

  executeRollback(input: {
    config: RollbackManagerConfiguration;
    regressionReport: RegressionRunReport | null;
    validationReport: ValidationRunReport | null;
    previewGeneration: PreviewGenerationReport | null;
    frontendBuild: FrontendBuildReport | null;
    componentGeneration: ComponentGenerationReport | null;
    layoutRefactoring: LayoutRefactoringReport | null;
    themeGeneration: ThemeGenerationReport | null;
    manualTrigger?: RollbackTrigger;
  }): RollbackRunReport {
    const started = Date.now();

    appendRollbackLog({
      event: "rollback_manager_start",
      level: "info",
      details: "Starting rollback operation",
    });

    let restorePointsCreated = 0;
    if (input.config.autoCreateRestorePoints && this.restorePointManager.getActiveRestorePoints().length === 0) {
      this.createRestorePoint({
        config: input.config,
        frontendBuild: input.frontendBuild,
        componentGeneration: input.componentGeneration,
        layoutRefactoring: input.layoutRefactoring,
        themeGeneration: input.themeGeneration,
        previewGeneration: input.previewGeneration,
        regressionReport: input.regressionReport,
      });
      restorePointsCreated += 1;
    }

    const trigger = this.decisionEngine.detectTrigger({
      regressionReport: input.regressionReport,
      validationReport: input.validationReport,
      previewGeneration: input.previewGeneration,
      componentGeneration: input.componentGeneration,
      layoutRefactoring: input.layoutRefactoring,
      themeGeneration: input.themeGeneration,
      config: input.config,
      manualTrigger: input.manualTrigger,
    });

    const reports = [];
    const activePoints = this.restorePointManager.getActiveRestorePoints();

    if (this.decisionEngine.shouldRollback(trigger) && trigger) {
      const rollbackPoint = this.knownGoodRegistry.selectFromReports({
        regressionReport: input.regressionReport,
        validationReport: input.validationReport,
        restorePoints: activePoints,
        config: input.config,
      });

      if (!rollbackPoint) {
        appendRollbackLog({
          event: "rollback_failure",
          level: "error",
          details: "No restore point available for rollback",
        });
        const validation = this.validator.validate([], restorePointsCreated, input.config);
        return {
          rollbackRunReportId: this.metadata.buildRunReportId(),
          runTimestamp: new Date().toISOString(),
          reports: [],
          restorePoints: activePoints,
          validation: {
            ...validation,
            decision: "fail",
            errors: [...validation.errors, "No restore point available"],
          },
          durationMs: Date.now() - started,
          metadataVersion: ROLLBACK_METADATA_VERSION,
        };
      }

      const execution = this.executionEngine.execute({
        restorePoint: rollbackPoint.restorePoint,
        restorePointManager: this.restorePointManager,
        componentGeneration: input.componentGeneration,
        layoutRefactoring: input.layoutRefactoring,
        themeGeneration: input.themeGeneration,
        config: input.config,
      });

      const verification = this.verificationEngine.verify(execution, input.config);
      const preview = input.previewGeneration?.records[0];
      const frontendRecord = input.frontendBuild?.records[0];

      reports.push(
        this.reportGenerator.buildReport({
          trigger,
          sourceRegressionReportId: input.regressionReport?.regressionRunReportId ?? null,
          sourceValidationReportId: input.validationReport?.validationRunReportId ?? null,
          sourcePreviewBuildId: preview?.previewBuildId ?? null,
          sourceFrontendBuildRecordId: frontendRecord?.buildRecordId ?? null,
          restorePointId: rollbackPoint.restorePoint.restorePointId,
          previousKnownGoodStateId: rollbackPoint.stateId,
          execution,
          verification,
        }),
      );
    }

    const validation = this.validator.validate(reports, restorePointsCreated, input.config);
    const runReport: RollbackRunReport = {
      rollbackRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      reports,
      restorePoints: this.restorePointManager.getRestorePoints(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: ROLLBACK_METADATA_VERSION,
    };

    appendRollbackLog({
      event: "rollback_manager_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Rollback ${validation.decision.toUpperCase()} · ${reports.length} executed · ${runReport.durationMs}ms`,
    });

    return runReport;
  }

  getActiveRestorePointCount(): number {
    return this.restorePointManager.getActiveRestorePoints().length;
  }

  resetForTesting(): void {
    this.restorePointManager.resetForTesting();
    this.knownGoodRegistry.resetForTesting();
  }
}
