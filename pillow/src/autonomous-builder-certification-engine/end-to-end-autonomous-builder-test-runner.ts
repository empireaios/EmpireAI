/** T3-10 — End-to-end Autonomous Builder test runner. */

import { appendCertificationLog } from "./certification-logging.js";
import type { T3EngineBundle } from "./t3-capability-validator.js";
import type { E2eValidationResult, E2eValidationStep } from "./types.js";

export class EndToEndAutonomousBuilderTestRunner {
  async run(engines: T3EngineBundle): Promise<E2eValidationResult> {
    const started = Date.now();
    const steps: E2eValidationStep[] = [];

    appendCertificationLog({
      event: "e2e_test_start",
      level: "info",
      details: "Starting end-to-end Autonomous Builder validation",
    });

    try {
      const uicReport = engines.uxIntelligenceCertification.getLatestReport();
      const recommendations = engines.recommendationEngine.generateRecommendations();
      steps.push({
        step: "Certified UX recommendations received",
        passed: !!recommendations.recommendationReportId,
        details: recommendations
          ? `${recommendations.record.proposals.length} proposals · T2=${uicReport?.finalCertificationDecision ?? "not_run"}`
          : "No recommendation report",
      });

      const frontend = engines.frontendBuilder.generateFrontendCode();
      steps.push({
        step: "T3-01 Frontend code generated",
        passed: !!frontend.frontendBuildReportId && frontend.records.length > 0,
        details: frontend
          ? `reportId=${frontend.frontendBuildReportId} · ${frontend.records.length} records`
          : "No frontend build",
      });

      const components = engines.componentGenerator.generateComponents();
      steps.push({
        step: "T3-02 Components generated",
        passed: !!components.componentGenerationReportId && components.records.length > 0,
        details: components
          ? `${components.records.length} components`
          : "No component generation",
      });

      const layouts = engines.layoutRefactoring.refactorLayouts();
      steps.push({
        step: "T3-03 Layouts refactored",
        passed: !!layouts.layoutRefactoringReportId && layouts.records.length > 0,
        details: layouts ? `${layouts.records.length} layouts` : "No layout refactoring",
      });

      const themes = engines.themeBuilder.generateThemes();
      steps.push({
        step: "T3-04 Themes generated",
        passed: !!themes.themeGenerationReportId && themes.records.length > 0,
        details: themes ? `${themes.records.length} themes` : "No theme generation",
      });

      const previews = engines.previewGenerator.generatePreviews();
      steps.push({
        step: "T3-05 Preview builds created",
        passed: !!previews.previewGenerationReportId && previews.records.length > 0,
        details: previews ? `${previews.records.length} previews` : "No preview generation",
      });

      const validation = engines.validationEngine.validateUi();
      steps.push({
        step: "T3-06 UI validation is operational",
        passed: !!validation.validationRunReportId && !!validation.validation.decision,
        details: validation
          ? `decision=${validation.validation.decision} · defects=${validation.validation.defectsDetected}`
          : "No validation report",
      });

      const regression = engines.regressionProtection.checkRegressions();
      steps.push({
        step: "T3-07 Regression protection is operational",
        passed: !!regression.regressionRunReportId && !!regression.validation.decision,
        details: regression
          ? `decision=${regression.validation.decision} · ${regression.validation.regressionsDetected} regressions`
          : "No regression report",
      });

      const restorePoint = engines.rollbackManager.createRestorePoint();
      steps.push({
        step: "T3-08 Rollback capability verified",
        passed: !!restorePoint.restorePointId && restorePoint.fileSnapshotReferences.length > 0,
        details: restorePoint
          ? `restorePoint=${restorePoint.restorePointId}`
          : "No restore point",
      });

      const documentation = engines.changeDocumentation.documentChanges();
      steps.push({
        step: "T3-09 Change documentation generated",
        passed:
          !!documentation.changeDocumentationRunReportId && documentation.records.length > 0,
        details: documentation
          ? `${documentation.records.length} change records`
          : "No documentation report",
      });

      const passed = steps.every((s) => s.passed);
      const durationMs = Date.now() - started;

      appendCertificationLog({
        event: "e2e_test_end",
        level: passed ? "info" : "warn",
        details: `E2E ${passed ? "PASS" : "FAIL"} · ${steps.filter((s) => s.passed).length}/${steps.length} steps · ${durationMs}ms`,
      });

      return {
        passed,
        steps,
        durationMs,
        summary: passed
          ? "Full T3 Autonomous Builder pipeline operational end-to-end"
          : `${steps.filter((s) => !s.passed).length} step(s) failed`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "E2E test failed";
      steps.push({ step: "E2E execution", passed: false, details: message });
      return {
        passed: false,
        steps,
        durationMs: Date.now() - started,
        summary: message,
      };
    }
  }
}
