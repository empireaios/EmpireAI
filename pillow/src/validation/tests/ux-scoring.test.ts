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
  buildUxScoringConfiguration,
  UX_SCORING_SYSTEM_PATH,
  SCORING_CATEGORIES,
} from "../../ux-scoring-engine/index.js";
import { ScoringWeightManager } from "../../ux-scoring-engine/scoring-weight-manager.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "uxs-test-session",
    frameNumber,
    windowId: "win-uxs",
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
}

describe("T2-08 UX Scoring", () => {
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

  test("buildUxScoringConfiguration loads defaults", () => {
    const config = buildUxScoringConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.passThreshold, 70);
    assert.equal(config.categoryWeights.length, SCORING_CATEGORIES.length);
  });

  test("ux scoring initializes with doctrine doc", async () => {
    const { uxScoring, visualCapture } = await buildPipeline();
    const state = uxScoring.getState();
    assert.equal(state.engineVersion, "PILLOW-UXS-001");
    assert.equal(state.missionId, "T2-08");
    assert.ok(state.configuration);
    assert.ok(UX_SCORING_SYSTEM_PATH.includes("UX_SCORING"));
    visualCapture.stopCapture();
  });

  test("runScoring produces machine-readable UX score report", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.uxScoring.runScoring();
    assert.ok(report.scoringReportId.startsWith("uxs-report-"));
    assert.ok(report.record.uxScoreId.startsWith("uxs-score-"));
    assert.ok(report.record.overallUxScore >= 0 && report.record.overallUxScore <= 100);
    assert.ok(["pass", "partial", "fail"].includes(report.validation.decision));
    assert.ok(report.record.scoreBreakdown.length > 0);

    const record = engines.uxScoring.getLatestRecord();
    assert.ok(record);
    assert.ok(record!.scoreEvidenceReferences.length >= 0);
    engines.visualCapture.stopCapture();
  });

  test("runScoring generates all dimension scores", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.uxScoring.runScoring();
    const r = report.record;
    assert.ok(r.screenScore >= 0 && r.screenScore <= 100);
    assert.ok(r.componentScore >= 0 && r.componentScore <= 100);
    assert.ok(r.layoutScore >= 0 && r.layoutScore <= 100);
    assert.ok(r.workflowScore >= 0 && r.workflowScore <= 100);
    assert.ok(r.accessibilityScore >= 0 && r.accessibilityScore <= 100);
    assert.ok(r.consistencyScore >= 0 && r.consistencyScore <= 100);
    assert.ok(
      r.executivePreferenceAlignmentScore >= 0 && r.executivePreferenceAlignmentScore <= 100,
    );
    engines.visualCapture.stopCapture();
  });

  test("scoring weight manager applies severity impact", () => {
    const manager = new ScoringWeightManager();
    const config = buildUxScoringConfiguration(REPO_ROOT);
    const score = manager.applySeverityImpact(
      100,
      { error: 1, warning: 2, info: 1 },
      config,
    );
    assert.equal(score, 100 - 15 - 16 - 3);
  });

  test("validateForSupervisorSync reports readiness after scoring", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.uxScoring.runScoring();

    const sync = engines.uxScoring.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    assert.ok(sync.notes.some((n) => n.includes("Scores completed")));
    engines.visualCapture.stopCapture();
  });

  test("cockpit snapshot exposes scoring status", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.uxScoring.runScoring();

    const cockpit = engines.uxScoring.getCockpitSnapshot();
    assert.equal(cockpit.totalScorings, 1);
    assert.ok(cockpit.overallUxScore >= 0);
    assert.ok(cockpit.lastDecision);
    engines.visualCapture.stopCapture();
  });

  test("handles missing upstream data gracefully", async () => {
    const { uxScoring, visualCapture } = await buildPipeline();
    const report = uxScoring.runScoring();
    assert.ok(report.record);
    assert.ok(report.record.overallUxScore >= 0);
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    visualCapture.stopCapture();
  });
});
