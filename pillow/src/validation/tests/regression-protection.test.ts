import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach, afterEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createVisualCaptureEngine,
  resetVisualCaptureEngineForTesting,
} from "../../visual-capture-engine/index.js";
import {
  createUiStateMapperEngine,
  resetUiStateMapperForTesting,
} from "../../ui-state-mapper/index.js";
import {
  createComponentRecognitionEngine,
  resetComponentRecognitionForTesting,
} from "../../component-recognition-engine/index.js";
import {
  createLayoutUnderstandingEngine,
  resetLayoutUnderstandingForTesting,
} from "../../layout-understanding-engine/index.js";
import {
  createNavigationMappingEngine,
  resetNavigationMappingForTesting,
} from "../../navigation-mapping-engine/index.js";
import {
  createInteractionTrackingEngine,
  resetInteractionTrackingForTesting,
} from "../../interaction-tracking-engine/index.js";
import {
  createContextAwarenessEngine,
  resetContextAwarenessForTesting,
} from "../../context-awareness-engine/index.js";
import {
  createUxRuleEngine,
  resetUxRuleEngineForTesting,
} from "../../ux-rule-engine/index.js";
import {
  createDesignSystemIntelligenceEngine,
  resetDesignSystemIntelligenceForTesting,
} from "../../design-system-intelligence-engine/index.js";
import {
  createExecutiveStyleLearningEngine,
  resetExecutiveStyleLearningForTesting,
} from "../../executive-style-learning-engine/index.js";
import {
  createLayoutEvaluationEngine,
  resetLayoutEvaluationForTesting,
} from "../../layout-evaluation-engine/index.js";
import {
  createWorkflowOptimizationEngine,
  resetWorkflowOptimizationForTesting,
} from "../../workflow-optimization-engine/index.js";
import {
  createAccessibilityIntelligenceEngine,
  resetAccessibilityIntelligenceForTesting,
} from "../../accessibility-intelligence-engine/index.js";
import {
  createVisualConsistencyEngine,
  resetVisualConsistencyForTesting,
} from "../../visual-consistency-engine/index.js";
import {
  createUxScoringEngine,
  resetUxScoringForTesting,
} from "../../ux-scoring-engine/index.js";
import {
  createRecommendationEngine,
  resetRecommendationEngineForTesting,
} from "../../recommendation-engine/index.js";
import {
  createUxIntelligenceCertificationEngine,
  resetUxIntelligenceCertificationForTesting,
} from "../../ux-intelligence-certification-engine/index.js";
import {
  createFrontendBuilder,
  resetFrontendBuilderForTesting,
} from "../../frontend-builder/index.js";
import {
  createComponentGenerator,
  resetComponentGeneratorForTesting,
} from "../../component-generator/index.js";
import {
  createLayoutRefactoringEngine,
  resetLayoutRefactoringForTesting,
} from "../../layout-refactoring/index.js";
import {
  createThemeBuilder,
  resetThemeBuilderForTesting,
} from "../../theme-builder/index.js";
import {
  createPreviewGenerator,
  resetPreviewGeneratorForTesting,
} from "../../preview-generator/index.js";
import {
  createVisualMemoryEngine,
  resetVisualMemoryForTesting,
} from "../../visual-memory-engine/index.js";
import {
  createSessionContinuityEngine,
  resetSessionContinuityForTesting,
} from "../../session-continuity-engine/index.js";
import {
  createVisualFoundationCertificationEngine,
  resetVisualFoundationCertificationForTesting,
} from "../../visual-foundation-certification-engine/index.js";
import {
  createValidationEngine,
  resetValidationEngineForTesting,
} from "../../validation-engine/index.js";
import {
  createRegressionProtectionEngine,
  resetRegressionProtectionForTesting,
  buildRegressionProtectionConfiguration,
  REGRESSION_PROTECTION_SYSTEM_PATH,
  COMPARISON_SCOPES,
  REGRESSION_CATEGORIES,
} from "../../regression-protection/index.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "rp-test-session",
    frameNumber,
    windowId: "win-rp",
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

async function buildPipeline() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
  const visualCapture = createVisualCaptureEngine(bootstrap, { autoStart: false });
  await visualCapture.initialize();
  const uiStateMapper = createUiStateMapperEngine(bootstrap, visualCapture, { autoStart: false });
  await uiStateMapper.initialize();
  const recognition = createComponentRecognitionEngine(bootstrap, uiStateMapper, {
    autoStart: false,
    configuration: { confidenceThreshold: 0.4 },
  });
  await recognition.initialize();
  const layout = createLayoutUnderstandingEngine(bootstrap, recognition, {
    autoStart: false,
    configuration: { confidenceThreshold: 0.4 },
  });
  await layout.initialize();
  const navigation = createNavigationMappingEngine(bootstrap, layout, {
    autoStart: false,
    configuration: { confidenceThreshold: 0.4 },
  });
  await navigation.initialize();
  const tracking = createInteractionTrackingEngine(
    bootstrap,
    navigation,
    layout,
    recognition,
    { autoStart: false },
  );
  await tracking.initialize();
  const contextAwareness = createContextAwarenessEngine(
    bootstrap,
    tracking,
    navigation,
    layout,
    recognition,
  );
  await contextAwareness.initialize();
  await contextAwareness.initialize();
  const visualMemory = createVisualMemoryEngine(
    bootstrap,
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    tracking,
    contextAwareness,
    { autoStart: false, configuration: { storageBackend: "memory", confidenceThreshold: 0.4 } },
  );
  await visualMemory.initialize();
  const sessionContinuity = createSessionContinuityEngine(
    bootstrap,
    uiStateMapper,
    layout,
    navigation,
    tracking,
    contextAwareness,
    visualMemory,
    { autoStart: false, configuration: { persistSessionContext: false } },
  );
  await sessionContinuity.initialize();
  const visualFoundation = createVisualFoundationCertificationEngine(
    bootstrap,
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    tracking,
    contextAwareness,
    visualMemory,
    sessionContinuity,
    {
      configuration: {
        reportOutputRoot: ".pillow-regression-protection-test",
        requiredPassThreshold: 50,
      },
    },
  );
  await visualFoundation.initialize();
  const uxRuleEngine = createUxRuleEngine(
    bootstrap,
    uiStateMapper,
    recognition,
    layout,
    navigation,
  );
  await uxRuleEngine.initialize();
  const designSystemIntelligence = createDesignSystemIntelligenceEngine(
    bootstrap,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    uxRuleEngine,
  );
  await designSystemIntelligence.initialize();
  const executiveStyleLearning = createExecutiveStyleLearningEngine(
    bootstrap,
    designSystemIntelligence,
  );
  await executiveStyleLearning.initialize();
  const layoutEvaluation = createLayoutEvaluationEngine(
    bootstrap,
    layout,
    recognition,
    navigation,
    designSystemIntelligence,
    executiveStyleLearning,
    uxRuleEngine,
  );
  await layoutEvaluation.initialize();
  const workflowOptimization = createWorkflowOptimizationEngine(
    bootstrap,
    contextAwareness,
    tracking,
    navigation,
    layoutEvaluation,
  );
  await workflowOptimization.initialize();
  const accessibilityIntelligence = createAccessibilityIntelligenceEngine(
    bootstrap,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    tracking,
    contextAwareness,
    workflowOptimization,
  );
  await accessibilityIntelligence.initialize();
  const visualConsistency = createVisualConsistencyEngine(
    bootstrap,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    accessibilityIntelligence,
  );
  await visualConsistency.initialize();
  const uxScoring = createUxScoringEngine(
    bootstrap,
    uiStateMapper,
    navigation,
    uxRuleEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    workflowOptimization,
    accessibilityIntelligence,
    visualConsistency,
  );
  await uxScoring.initialize();
  const recommendationEngine = createRecommendationEngine(
    bootstrap,
    uiStateMapper,
    navigation,
    uxRuleEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    workflowOptimization,
    accessibilityIntelligence,
    visualConsistency,
    uxScoring,
  );
  await recommendationEngine.initialize();
  const certification = createUxIntelligenceCertificationEngine(
    bootstrap,
    uxRuleEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    workflowOptimization,
    accessibilityIntelligence,
    visualConsistency,
    uxScoring,
    recommendationEngine,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    tracking,
    null,
  );
  await certification.initialize();
  const frontendBuilder = createFrontendBuilder(
    bootstrap,
    uiStateMapper,
    navigation,
    designSystemIntelligence,
    executiveStyleLearning,
    uxScoring,
    recommendationEngine,
    certification,
  );
  await frontendBuilder.initialize();
  const componentGenerator = createComponentGenerator(
    bootstrap,
    recommendationEngine,
    frontendBuilder,
    designSystemIntelligence,
    executiveStyleLearning,
  );
  await componentGenerator.initialize();
  const layoutRefactoring = createLayoutRefactoringEngine(
    bootstrap,
    recommendationEngine,
    uxScoring,
    layoutEvaluation,
    workflowOptimization,
    designSystemIntelligence,
    executiveStyleLearning,
    frontendBuilder,
    componentGenerator,
    layout,
  );
  await layoutRefactoring.initialize();
  const themeBuilder = createThemeBuilder(
    bootstrap,
    recommendationEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
  );
  await themeBuilder.initialize();
  const previewGenerator = createPreviewGenerator(
    bootstrap,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
  );
  await previewGenerator.initialize();
  const validationEngine = createValidationEngine(
    bootstrap,
    previewGenerator,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
  );
  await validationEngine.initialize();
  const regressionProtection = createRegressionProtectionEngine(
    bootstrap,
    validationEngine,
    previewGenerator,
    frontendBuilder,
    componentGenerator,
    uxScoring,
    recommendationEngine,
    layout,
    navigation,
    visualFoundation,
  );
  await regressionProtection.initialize();
  return {
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    uxRuleEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    workflowOptimization,
    accessibilityIntelligence,
    visualConsistency,
    uxScoring,
    recommendationEngine,
    certification,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
    previewGenerator,
    validationEngine,
    regressionProtection,
    visualFoundation,
  };
}

async function primeUpstream(engines: Awaited<ReturnType<typeof buildPipeline>>) {
  const uiState = engines.uiStateMapper.processFrame(buildTestFrame(1));
  const recognitionResult = engines.recognition.recognizeUiState(uiState!);
  const layoutModel = engines.layout.analyzeRecognition(recognitionResult!);
  engines.navigation.mapLayout(layoutModel!);
  engines.uxRuleEngine.runValidation();
  engines.designSystemIntelligence.runAnalysis();
  engines.executiveStyleLearning.runLearning();
  engines.layoutEvaluation.runEvaluation();
  engines.workflowOptimization.runAnalysis();
  engines.accessibilityIntelligence.runReview();
  engines.visualConsistency.runReview();
  engines.uxScoring.runScoring();
  engines.recommendationEngine.generateRecommendations();
  engines.certification.runCertification();
  engines.frontendBuilder.generateFrontendCode();
  engines.componentGenerator.generateComponents();
  engines.layoutRefactoring.refactorLayouts();
  engines.themeBuilder.generateThemes();
  engines.previewGenerator.generatePreviews();
  engines.validationEngine.validateUi();
}

describe("T3-07 Regression Protection", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    resetLayoutUnderstandingForTesting();
    resetNavigationMappingForTesting();
    resetInteractionTrackingForTesting();
    resetContextAwarenessForTesting();
    resetUxRuleEngineForTesting();
    resetDesignSystemIntelligenceForTesting();
    resetExecutiveStyleLearningForTesting();
    resetLayoutEvaluationForTesting();
    resetWorkflowOptimizationForTesting();
    resetAccessibilityIntelligenceForTesting();
    resetVisualConsistencyForTesting();
    resetUxScoringForTesting();
    resetRecommendationEngineForTesting();
    resetUxIntelligenceCertificationForTesting();
    resetFrontendBuilderForTesting();
    resetComponentGeneratorForTesting();
    resetLayoutRefactoringForTesting();
    resetThemeBuilderForTesting();
    resetPreviewGeneratorForTesting();
    resetValidationEngineForTesting();
    resetVisualMemoryForTesting();
    resetSessionContinuityForTesting();
    resetVisualFoundationCertificationForTesting();
    resetRegressionProtectionForTesting();
    process.env.VISUAL_CAPTURE_AUTO_START = "false";
    process.env.UI_STATE_MAPPER_AUTO_START = "false";
    process.env.COMPONENT_RECOGNITION_AUTO_START = "false";
    process.env.LAYOUT_UNDERSTANDING_AUTO_START = "false";
    process.env.NAVIGATION_MAPPING_AUTO_START = "false";
    process.env.INTERACTION_TRACKING_AUTO_START = "false";
    process.env.CONTEXT_AWARENESS_AUTO_START = "false";
  });

  afterEach(() => {
    delete process.env.VISUAL_CAPTURE_AUTO_START;
    delete process.env.UI_STATE_MAPPER_AUTO_START;
    delete process.env.COMPONENT_RECOGNITION_AUTO_START;
    delete process.env.LAYOUT_UNDERSTANDING_AUTO_START;
    delete process.env.NAVIGATION_MAPPING_AUTO_START;
    delete process.env.INTERACTION_TRACKING_AUTO_START;
    delete process.env.CONTEXT_AWARENESS_AUTO_START;
  });

  test("buildRegressionProtectionConfiguration loads defaults", () => {
    const config = buildRegressionProtectionConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.blockOnCriticalRegressions, true);
    assert.equal(config.comparisonScopes.length, COMPARISON_SCOPES.length);
    assert.equal(config.regressionCategories.length, REGRESSION_CATEGORIES.length);
  });

  test("regression protection initializes with doctrine doc", async () => {
    const { regressionProtection, visualCapture } = await buildPipeline();
    const state = regressionProtection.getState();
    assert.equal(state.engineVersion, "PILLOW-RP-001");
    assert.equal(state.missionId, "T3-07");
    assert.ok(REGRESSION_PROTECTION_SYSTEM_PATH.includes("REGRESSION_PROTECTION"));
    visualCapture.stopCapture();
  });

  test("checkRegressions produces machine-readable regression reports", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.regressionProtection.checkRegressions();
    assert.ok(report.regressionRunReportId.startsWith("rp-run-"));
    assert.ok(["pass", "partial", "fail", "blocked"].includes(report.validation.decision));
    assert.ok(report.reports.length > 0);
    for (const rpReport of report.reports) {
      assert.ok(rpReport.regressionReportId.startsWith("rp-report-"));
      assert.ok(rpReport.baselineUiStateId.startsWith("rp-baseline-"));
      assert.ok(rpReport.proposedUiStateId.startsWith("rp-proposed-"));
    }
    engines.visualCapture.stopCapture();
  });

  test("regression detection includes required metadata", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.regressionProtection.checkRegressions();
    for (const rpReport of report.reports) {
      for (const regression of rpReport.detectedRegressions) {
        assert.ok(regression.regressionId.startsWith("rp-regression-"));
        assert.ok(REGRESSION_CATEGORIES.includes(regression.regressionCategory));
        assert.ok(regression.regressionDescription.length > 0);
        assert.ok(regression.detectionConfidence >= 0);
      }
    }
    engines.visualCapture.stopCapture();
  });

  test("validateForSupervisorSync reports readiness after check", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.regressionProtection.checkRegressions();

    const sync = engines.regressionProtection.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    engines.visualCapture.stopCapture();
  });

  test("cockpit snapshot exposes protection status", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.regressionProtection.checkRegressions();

    const cockpit = engines.regressionProtection.getCockpitSnapshot();
    assert.equal(cockpit.totalChecks, 1);
    assert.ok(cockpit.lastDecision);
    engines.visualCapture.stopCapture();
  });

  test("handles missing validation data gracefully", async () => {
    const { regressionProtection, visualCapture } = await buildPipeline();
    const report = regressionProtection.checkRegressions();
    assert.ok(report);
    assert.ok(report.reports.length > 0);
    visualCapture.stopCapture();
  });

  test("isStableImprovement reflects protection decision", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = engines.regressionProtection.checkRegressions();
    const stable = engines.regressionProtection.isStableImprovement();
    const expected =
      report.validation.decision === "pass" || report.validation.decision === "partial";
    assert.equal(stable, expected);
    engines.visualCapture.stopCapture();
  });

  test("health monitor reports engine status", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.regressionProtection.checkRegressions();

    const state = engines.regressionProtection.getState();
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
    assert.ok(state.health.healthScore >= 0);
    engines.visualCapture.stopCapture();
  });
});
