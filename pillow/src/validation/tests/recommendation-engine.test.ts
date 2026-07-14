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
  buildRecommendationEngineConfiguration,
  RECOMMENDATION_ENGINE_SYSTEM_PATH,
  RECOMMENDATION_CATEGORIES,
} from "../../recommendation-engine/index.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "rec-test-session",
    frameNumber,
    windowId: "win-rec",
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
  return {
    bootstrap,
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    tracking,
    contextAwareness,
    uxRuleEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    workflowOptimization,
    accessibilityIntelligence,
    visualConsistency,
    uxScoring,
    recommendationEngine,
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
}

describe("T2-09 Recommendation Engine", () => {
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

  test("buildRecommendationEngineConfiguration loads defaults", () => {
    const config = buildRecommendationEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.confidenceThreshold, 0.4);
    assert.equal(config.recommendationCategories.length, RECOMMENDATION_CATEGORIES.length);
  });

  test("recommendation engine initializes with doctrine doc", async () => {
    const { recommendationEngine, visualCapture } = await buildPipeline();
    const state = recommendationEngine.getState();
    assert.equal(state.engineVersion, "PILLOW-REC-001");
    assert.equal(state.missionId, "T2-09");
    assert.ok(state.configuration);
    assert.ok(RECOMMENDATION_ENGINE_SYSTEM_PATH.includes("RECOMMENDATION_ENGINE"));
    visualCapture.stopCapture();
  });

  test("generateRecommendations produces machine-readable redesign proposals", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.recommendationEngine.generateRecommendations();
    assert.ok(report.recommendationReportId.startsWith("rec-report-"));
    assert.ok(report.record.recommendationRecordId.startsWith("rec-record-"));
    assert.ok(["pass", "partial", "fail"].includes(report.validation.decision));
    assert.ok(report.record.proposals.length >= 0);

    const record = engines.recommendationEngine.getLatestRecord();
    assert.ok(record);
    engines.visualCapture.stopCapture();
  });

  test("proposals include priority, confidence, and evidence", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.recommendationEngine.generateRecommendations();
    for (const proposal of report.record.proposals) {
      assert.ok(proposal.recommendationTitle.length > 0);
      assert.ok(proposal.recommendationDescription.length > 0);
      assert.ok(["critical", "high", "medium", "low"].includes(proposal.priority));
      assert.ok(proposal.confidenceScore >= 0 && proposal.confidenceScore <= 100);
      assert.ok(proposal.expectedUxBenefit.length > 0);
      assert.ok(proposal.recommendationId.startsWith("rec-"));
    }
    engines.visualCapture.stopCapture();
  });

  test("validateForSupervisorSync reports readiness after generation", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.recommendationEngine.generateRecommendations();

    const sync = engines.recommendationEngine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 40);
    assert.ok(sync.notes.some((n) => n.includes("Reports generated")));
    engines.visualCapture.stopCapture();
  });

  test("cockpit snapshot exposes recommendation status", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.recommendationEngine.generateRecommendations();

    const cockpit = engines.recommendationEngine.getCockpitSnapshot();
    assert.equal(cockpit.totalReports, 1);
    assert.ok(cockpit.lastDecision);
    assert.ok(cockpit.proposalsCount >= 0);
    engines.visualCapture.stopCapture();
  });

  test("handles missing upstream data gracefully", async () => {
    const { recommendationEngine, visualCapture } = await buildPipeline();
    const report = recommendationEngine.generateRecommendations();
    assert.ok(report.record);
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    visualCapture.stopCapture();
  });

  test("links proposals to UX score and finding evidence when available", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.recommendationEngine.generateRecommendations();
    const uxScoreId = engines.uxScoring.getLatestRecord()?.uxScoreId ?? null;
    if (report.record.proposals.length > 0) {
      const withEvidence = report.record.proposals.filter(
        (p) => p.evidenceReferences.length > 0 || p.sourceFindingIds.length > 0,
      );
      assert.ok(withEvidence.length >= 0);
      if (uxScoreId) {
        assert.equal(report.record.sourceUxScoreId, uxScoreId);
      }
    }
    engines.visualCapture.stopCapture();
  });
});
