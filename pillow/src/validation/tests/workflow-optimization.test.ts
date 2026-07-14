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
  buildWorkflowOptimizationConfiguration,
  WORKFLOW_OPTIMIZATION_SYSTEM_PATH,
  FRICTION_CATEGORIES,
} from "../../workflow-optimization-engine/index.js";
import { RepetitionDetector } from "../../workflow-optimization-engine/repetition-detector.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "wfo-test-session",
    frameNumber,
    windowId: "win-wfo",
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
  return {
    bootstrap,
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    tracking,
    contextAwareness,
    designSystemIntelligence,
    layoutEvaluation,
    workflowOptimization,
  };
}

async function primeUpstream(engines: Awaited<ReturnType<typeof buildPipeline>>) {
  const uiState = engines.uiStateMapper.processFrame(buildTestFrame(1));
  const recognitionResult = engines.recognition.recognizeUiState(uiState!);
  const layoutModel = engines.layout.analyzeRecognition(recognitionResult!);
  engines.navigation.mapLayout(layoutModel!);
  engines.designSystemIntelligence.runAnalysis();
  engines.layoutEvaluation.runEvaluation();

  const componentId = recognitionResult!.components[0]?.componentId;
  for (let i = 0; i < 3; i++) {
    engines.tracking.recordInteraction({
      interactionType: "click",
      componentId,
      pointerX: 100 + i,
      pointerY: 50,
    });
  }
  engines.tracking.recordInteraction({
    interactionType: "navigation_trigger",
    pointerX: 0,
    pointerY: 0,
  });
  engines.contextAwareness.analyzeContextNow();
}

describe("T2-05 Workflow Optimization", () => {
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

  test("buildWorkflowOptimizationConfiguration loads defaults", () => {
    const config = buildWorkflowOptimizationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.stepThreshold, 5);
    assert.equal(config.repetitionThreshold, 3);
    assert.equal(config.frictionCategories.length, FRICTION_CATEGORIES.length);
  });

  test("workflow optimization initializes with doctrine doc", async () => {
    const { workflowOptimization, visualCapture } = await buildPipeline();
    const state = workflowOptimization.getState();
    assert.equal(state.engineVersion, "PILLOW-WFO-001");
    assert.equal(state.missionId, "T2-05");
    assert.ok(state.configuration);
    assert.ok(WORKFLOW_OPTIMIZATION_SYSTEM_PATH.includes("WORKFLOW_OPTIMIZATION"));
    visualCapture.stopCapture();
  });

  test("runAnalysis produces machine-readable optimization findings", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.workflowOptimization.runAnalysis();
    assert.ok(report.optimizationReportId.startsWith("wfo-report-"));
    assert.ok(report.record.optimizationRecordId.startsWith("wfo-record-"));
    assert.ok(report.record.sourceWorkflowContextId || report.record.sourceInteractionEventIds.length > 0);
    assert.ok(["pass", "partial", "fail"].includes(report.validation.decision));

    const record = engines.workflowOptimization.getLatestRecord();
    assert.ok(record);
    assert.ok(record!.evidenceReferences.length >= 0);
    engines.visualCapture.stopCapture();
  });

  test("runAnalysis detects friction and strengths", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.workflowOptimization.runAnalysis();
    const totalFindings =
      report.record.detectedFrictionPoints.length +
      report.record.detectedWorkflowStrengths.length;
    assert.ok(totalFindings > 0, "Expected friction points or workflow strengths");
    engines.visualCapture.stopCapture();
  });

  test("repetition detector identifies repeated actions", () => {
    const detector = new RepetitionDetector();
    const config = buildWorkflowOptimizationConfiguration(REPO_ROOT);
    const events = Array.from({ length: 4 }, (_, i) => ({
      eventId: `evt-${i}`,
      sessionId: "s1",
      timestamp: new Date().toISOString(),
      interactionType: "click" as const,
      sourceComponentId: "btn-submit",
      sourceLayoutRegionId: null,
      sourceNavigationNodeId: null,
      destinationNavigationNodeId: null,
      triggeredNavigationEdgeId: null,
      pointerPosition: { x: 10, y: 10 },
      keyboardKey: null,
      inputFieldId: null,
      inputChange: null,
      scroll: null,
      previousValue: null,
      newValue: null,
      currentScreenId: "screen-1",
      currentRouteId: null,
      confidence: 0.8,
      metadataVersion: "1.0.0",
    }));
    const friction = detector.analyze(events, config);
    assert.ok(friction.some((f) => f.category === "repeated_actions"));
  });

  test("validateForSupervisorSync reports readiness after analysis", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.workflowOptimization.runAnalysis();

    const sync = engines.workflowOptimization.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    assert.ok(sync.notes.some((n) => n.includes("Analyses completed")));
    engines.visualCapture.stopCapture();
  });

  test("cockpit snapshot exposes optimization status", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.workflowOptimization.runAnalysis();

    const cockpit = engines.workflowOptimization.getCockpitSnapshot();
    assert.equal(cockpit.totalAnalyses, 1);
    assert.ok(cockpit.lastDecision);
    engines.visualCapture.stopCapture();
  });

  test("handles missing workflow context gracefully", async () => {
    const { workflowOptimization, visualCapture } = await buildPipeline();
    const report = workflowOptimization.runAnalysis();
    assert.ok(report.record);
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    visualCapture.stopCapture();
  });
});
