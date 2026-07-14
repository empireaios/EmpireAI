import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach, afterEach } from "node:test";

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
  buildLayoutRefactoringConfiguration,
  LAYOUT_REFACTORING_SYSTEM_PATH,
  LAYOUT_SCOPES,
} from "../../layout-refactoring/index.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "lr-test-session",
    frameNumber,
    windowId: "win-lr",
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
}

describe("T3-03 Layout Refactoring", () => {
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

  test("buildLayoutRefactoringConfiguration loads defaults", () => {
    const config = buildLayoutRefactoringConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.minConfidenceThreshold, 0.4);
    assert.equal(config.allowedLayoutScopes.length, LAYOUT_SCOPES.length);
  });

  test("layout refactoring initializes with doctrine doc", async () => {
    const { layoutRefactoring, visualCapture } = await buildPipeline();
    const state = layoutRefactoring.getState();
    assert.equal(state.engineVersion, "PILLOW-LR-001");
    assert.equal(state.missionId, "T3-03");
    assert.ok(LAYOUT_REFACTORING_SYSTEM_PATH.includes("LAYOUT_REFACTORING"));
    visualCapture.stopCapture();
  });

  test("refactorLayouts produces machine-readable refactoring records", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.layoutRefactoring.refactorLayouts();
    assert.ok(report.layoutRefactoringReportId.startsWith("lr-report-"));
    assert.ok(["pass", "partial", "fail"].includes(report.validation.decision));

    engines.visualCapture.stopCapture();
  });

  test("refactoring records include structure, placements, and responsive behavior", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.layoutRefactoring.refactorLayouts();
    for (const record of report.records) {
      assert.ok(record.layoutRefactoringId.startsWith("lr-record-"));
      assert.ok(record.sourceRecommendationId.startsWith("rec-"));
      assert.ok(record.proposedLayoutStructure.length > 0);
      assert.ok(record.componentPlacementMap.length > 0);
      assert.ok(record.responsiveBehaviorSummary.length > 0);
      assert.ok(record.targetFiles.length > 0);
    }
    engines.visualCapture.stopCapture();
  });

  test("safety checks enforce frontend-only scope", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.layoutRefactoring.refactorLayouts();
    for (const record of report.records) {
      if (record.refactoringStatus === "blocked") continue;
      const frontendOnly = record.safetyChecks.find((c) => c.checkId === "frontend-only");
      assert.ok(frontendOnly?.passed);
      for (const target of record.targetFiles) {
        assert.ok(
          target.startsWith("empireai-web/"),
          `Expected frontend path: ${target}`,
        );
      }
    }
    engines.visualCapture.stopCapture();
  });

  test("validateForSupervisorSync reports readiness after refactoring", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.layoutRefactoring.refactorLayouts();

    const sync = engines.layoutRefactoring.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 40);
    engines.visualCapture.stopCapture();
  });

  test("cockpit snapshot exposes refactoring status", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.layoutRefactoring.refactorLayouts();

    const cockpit = engines.layoutRefactoring.getCockpitSnapshot();
    assert.equal(cockpit.totalRefactorings, 1);
    assert.ok(cockpit.lastDecision);
    engines.visualCapture.stopCapture();
  });

  test("handles missing recommendations gracefully", async () => {
    const { layoutRefactoring, visualCapture } = await buildPipeline();
    const report = layoutRefactoring.refactorLayouts();
    assert.ok(report);
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    visualCapture.stopCapture();
  });
});
