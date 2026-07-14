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
  buildAccessibilityIntelligenceConfiguration,
  ACCESSIBILITY_INTELLIGENCE_SYSTEM_PATH,
  ACCESSIBILITY_CATEGORIES,
} from "../../accessibility-intelligence-engine/index.js";
import { KeyboardNavigationAnalyzer } from "../../accessibility-intelligence-engine/keyboard-navigation-analyzer.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "aii-test-session",
    frameNumber,
    windowId: "win-aii",
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
    accessibilityIntelligence,
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
  for (let i = 0; i < 6; i++) {
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
  engines.workflowOptimization.runAnalysis();
}

describe("T2-06 Accessibility Intelligence", () => {
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

  test("buildAccessibilityIntelligenceConfiguration loads defaults", () => {
    const config = buildAccessibilityIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.minTouchTargetPx, 44);
    assert.equal(config.reviewCategories.length, ACCESSIBILITY_CATEGORIES.length);
  });

  test("accessibility intelligence initializes with doctrine doc", async () => {
    const { accessibilityIntelligence, visualCapture } = await buildPipeline();
    const state = accessibilityIntelligence.getState();
    assert.equal(state.engineVersion, "PILLOW-AII-001");
    assert.equal(state.missionId, "T2-06");
    assert.ok(state.configuration);
    assert.ok(ACCESSIBILITY_INTELLIGENCE_SYSTEM_PATH.includes("ACCESSIBILITY_INTELLIGENCE"));
    visualCapture.stopCapture();
  });

  test("runReview produces machine-readable accessibility findings", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.accessibilityIntelligence.runReview();
    assert.ok(report.reviewReportId.startsWith("aii-report-"));
    assert.ok(report.record.accessibilityReviewId.startsWith("aii-review-"));
    assert.ok(
      report.record.sourceUiStateId ||
        report.record.sourceComponentSetId ||
        report.record.sourceLayoutId,
    );
    assert.ok(["pass", "partial", "fail"].includes(report.validation.decision));

    const record = engines.accessibilityIntelligence.getLatestRecord();
    assert.ok(record);
    assert.ok(record!.evidenceReferences.length >= 0);
    engines.visualCapture.stopCapture();
  });

  test("runReview detects findings and strengths", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.accessibilityIntelligence.runReview();
    const total =
      report.record.accessibilityFindings.length +
      report.record.accessibilityStrengths.length;
    assert.ok(total > 0, "Expected accessibility findings or strengths");
    engines.visualCapture.stopCapture();
  });

  test("keyboard navigation analyzer flags click-only navigation", () => {
    const analyzer = new KeyboardNavigationAnalyzer();
    const config = buildAccessibilityIntelligenceConfiguration(REPO_ROOT);
    const events = Array.from({ length: 6 }, (_, i) => ({
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
    events.push({
      eventId: "evt-nav",
      sessionId: "s1",
      timestamp: new Date().toISOString(),
      interactionType: "navigation_trigger",
      sourceComponentId: null,
      sourceLayoutRegionId: null,
      sourceNavigationNodeId: null,
      destinationNavigationNodeId: null,
      triggeredNavigationEdgeId: null,
      pointerPosition: { x: 0, y: 0 },
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
    });
    const result = analyzer.analyze(events, null, config);
    assert.ok(result.findings.some((f) => f.findingCategory === "keyboard_navigation"));
  });

  test("validateForSupervisorSync reports readiness after review", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.accessibilityIntelligence.runReview();

    const sync = engines.accessibilityIntelligence.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    assert.ok(sync.notes.some((n) => n.includes("Reviews completed")));
    engines.visualCapture.stopCapture();
  });

  test("cockpit snapshot exposes review status", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.accessibilityIntelligence.runReview();

    const cockpit = engines.accessibilityIntelligence.getCockpitSnapshot();
    assert.equal(cockpit.totalReviews, 1);
    assert.ok(cockpit.lastDecision);
    engines.visualCapture.stopCapture();
  });

  test("handles missing upstream data gracefully", async () => {
    const { accessibilityIntelligence, visualCapture } = await buildPipeline();
    const report = accessibilityIntelligence.runReview();
    assert.ok(report.record);
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    visualCapture.stopCapture();
  });
});
