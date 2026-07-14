/** T2-10 — End-to-end UX Intelligence test runner. */

import { buildCaptureFrameMetadata } from "../visual-capture-engine/capture-metadata-generator.js";
import { appendCertificationLog } from "./certification-logging.js";
import type { T2EngineBundle } from "./t2-capability-validator.js";
import type { E2eValidationResult, E2eValidationStep } from "./types.js";

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "uic-e2e-session",
    frameNumber,
    windowId: "win-uic",
    displayId: "display-primary",
    viewport: { width: 1280, height: 720 },
    resolution: { width: 1920, height: 1080 },
    captureDurationMs: 5,
    captureStatus: "capturing",
    captureSource: "browser_viewport",
  });
  return {
    metadata,
    imageBase64: MINIMAL_PNG_BASE64,
    mimeType: "image/png" as const,
    byteLength: 68,
  };
}

export class EndToEndUxIntelligenceTestRunner {
  async run(engines: T2EngineBundle): Promise<E2eValidationResult> {
    const started = Date.now();
    const steps: E2eValidationStep[] = [];

    appendCertificationLog({
      event: "e2e_test_start",
      level: "info",
      details: "Starting end-to-end UX Intelligence validation",
    });

    try {
      const vfcReport = engines.visualFoundationCertification?.getLatestReport();
      const t1Available =
        !!engines.uiStateMapper.getLatestState() ||
        vfcReport?.finalCertificationDecision === "pass" ||
        vfcReport?.finalCertificationDecision === "conditional";
      steps.push({
        step: "T1 Visual foundation data available",
        passed: t1Available,
        details: vfcReport
          ? `T1 decision=${vfcReport.finalCertificationDecision}`
          : engines.uiStateMapper.getLatestState()
            ? "UI state available"
            : "No T1 foundation data",
      });

      const frameNumber = engines.uiStateMapper.getLatestState() ? 2 : 1;
      const frame = buildTestFrame(frameNumber);
      const uiState = engines.uiStateMapper.processFrame(frame);
      const recognition = uiState
        ? engines.componentRecognition.recognizeUiState(uiState)
        : null;
      const layout = recognition
        ? engines.layoutUnderstanding.analyzeRecognition(recognition)
        : null;
      if (layout) engines.navigationMapping.mapLayout(layout);

      const uxRules = engines.uxRuleEngine.runValidation();
      steps.push({
        step: "T2-01 UX rules evaluate interface",
        passed: !!uxRules.validationReportId,
        details: uxRules ? `reportId=${uxRules.validationReportId}` : "No UX rule report",
      });

      const designSystem = engines.designSystemIntelligence.runAnalysis();
      steps.push({
        step: "T2-02 Design system intelligence operational",
        passed: !!designSystem.analysisReportId,
        details: designSystem
          ? `reportId=${designSystem.analysisReportId}`
          : "No design system report",
      });

      const execStyle = engines.executiveStyleLearning.runLearning();
      steps.push({
        step: "T2-03 Executive style preferences represented",
        passed: !!execStyle.model?.executiveStyleId,
        details: execStyle.model
          ? `modelId=${execStyle.model.executiveStyleId}`
          : "No executive style model",
      });

      const layoutEval = engines.layoutEvaluation.runEvaluation();
      steps.push({
        step: "T2-04 Layout evaluation detects strengths/weaknesses",
        passed: !!layoutEval.model?.evaluationId,
        details: layoutEval.model
          ? `evaluationId=${layoutEval.model.evaluationId}`
          : "No layout evaluation",
      });

      const workflow = engines.workflowOptimization.runAnalysis();
      steps.push({
        step: "T2-05 Workflow optimization detects friction",
        passed: !!workflow.record?.optimizationRecordId,
        details: workflow.record
          ? `recordId=${workflow.record.optimizationRecordId}`
          : "No workflow record",
      });

      const accessibility = engines.accessibilityIntelligence.runReview();
      steps.push({
        step: "T2-06 Accessibility intelligence produces findings",
        passed: !!accessibility.record?.accessibilityReviewId,
        details: accessibility.record
          ? `reviewId=${accessibility.record.accessibilityReviewId}`
          : "No accessibility review",
      });

      const consistency = engines.visualConsistency.runReview();
      steps.push({
        step: "T2-07 Visual consistency detects issues",
        passed: !!consistency.record?.consistencyReviewId,
        details: consistency.record
          ? `reviewId=${consistency.record.consistencyReviewId}`
          : "No consistency review",
      });

      const scoring = engines.uxScoring.runScoring();
      steps.push({
        step: "T2-08 UX scoring produces measurable scores",
        passed:
          !!scoring.scoringReportId &&
          scoring.record.overallUxScore >= 0 &&
          scoring.record.overallUxScore <= 100,
        details: scoring
          ? `score=${scoring.record.overallUxScore}`
          : "No UX scoring report",
      });

      const recommendations = engines.recommendationEngine.generateRecommendations();
      steps.push({
        step: "T2-09 Recommendation engine produces proposals",
        passed: !!recommendations.recommendationReportId,
        details: recommendations
          ? `${recommendations.record.proposals.length} proposals`
          : "No recommendation report",
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
          ? "Full T2 UX Intelligence pipeline operational end-to-end"
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
