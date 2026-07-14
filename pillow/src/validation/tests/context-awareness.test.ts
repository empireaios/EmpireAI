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
  buildContextAwarenessConfiguration,
  effectiveContextUpdateIntervalMs,
  CONTEXT_AWARENESS_SYSTEM_PATH,
  CONTEXT_STATES,
  INTERACTION_MODES,
} from "../../context-awareness-engine/index.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "vce-test-session",
    frameNumber,
    windowId: "win-test",
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
    { autoStart: false, configuration: { confidenceThreshold: 0.4 } },
  );
  await tracking.initialize();
  const contextAwareness = createContextAwarenessEngine(
    bootstrap,
    tracking,
    navigation,
    layout,
    recognition,
    { autoStart: false, configuration: { confidenceThreshold: 0.4 } },
  );
  await contextAwareness.initialize();
  return {
    bootstrap,
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    tracking,
    contextAwareness,
  };
}

describe("T1-07 Context Awareness", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    resetLayoutUnderstandingForTesting();
    resetNavigationMappingForTesting();
    resetInteractionTrackingForTesting();
    resetContextAwarenessForTesting();
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

  test("buildContextAwarenessConfiguration loads defaults", () => {
    const config = buildContextAwarenessConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.validateContexts, true);
    assert.ok(config.screenPurposeRules.length >= 1);
    assert.ok(config.interactionModeRules.length >= 1);
  });

  test("effectiveContextUpdateIntervalMs respects max rate", () => {
    const config = buildContextAwarenessConfiguration(REPO_ROOT, {
      contextUpdateIntervalMs: 50,
      maxUpdateRate: 5,
    });
    assert.equal(effectiveContextUpdateIntervalMs(config), 200);
  });

  test("context awareness initializes with doctrine doc", async () => {
    const { contextAwareness, visualCapture } = await buildPipeline();
    const state = contextAwareness.getState();
    assert.equal(state.engineVersion, "PILLOW-CAE-001");
    assert.equal(state.missionId, "T1-07");
    assert.ok(state.configuration);
    assert.ok(state.health);
    contextAwareness.stopContextAwareness();
    visualCapture.stopCapture();
  });

  test("analyzeContextNow produces workflow context after upstream primed", async () => {
    const { uiStateMapper, recognition, layout, navigation, tracking, contextAwareness, visualCapture } =
      await buildPipeline();

    const uiState = uiStateMapper.processFrame(buildTestFrame(1));
    const recognitionResult = recognition.recognizeUiState(uiState!);
    const layoutModel = layout.analyzeRecognition(recognitionResult!);
    navigation.mapLayout(layoutModel!);

    const componentId = recognitionResult!.components[0]?.componentId;
    tracking.recordInteraction({
      interactionType: "click",
      componentId,
      pointerX: 100,
      pointerY: 50,
    });

    const context = contextAwareness.analyzeContextNow();
    assert.ok(context, "Expected workflow context model");
    assert.ok(context!.contextId.startsWith("wf-ctx-"));
    assert.ok(CONTEXT_STATES.includes(context!.contextState));
    assert.ok(INTERACTION_MODES.includes(context!.currentInteractionMode));
    assert.ok(context!.confidence >= 0.4);
    assert.ok(context!.timestamp);

    const state = contextAwareness.getState();
    assert.equal(state.latestContext?.contextId, context!.contextId);

    contextAwareness.stopContextAwareness();
    visualCapture.stopCapture();
  });

  test("detects context changes on navigation update", async () => {
    const { uiStateMapper, recognition, layout, navigation, tracking, contextAwareness, visualCapture } =
      await buildPipeline();

    const state1 = uiStateMapper.processFrame(buildTestFrame(1));
    const result1 = recognition.recognizeUiState(state1!);
    const layout1 = layout.analyzeRecognition(result1!);
    navigation.mapLayout(layout1!);
    tracking.recordInteraction({ interactionType: "click", pointerX: 10, pointerY: 10 });
    contextAwareness.analyzeContextNow();

    const frame2 = buildTestFrame(2);
    frame2.imageBase64 = MINIMAL_PNG_BASE64 + "X";
    const state2 = uiStateMapper.processFrame(frame2);
    const result2 = recognition.recognizeUiState(state2!);
    const layout2 = layout.analyzeRecognition(result2!);
    navigation.mapLayout(layout2!);
    tracking.recordInteraction({ interactionType: "navigation", pointerX: 0, pointerY: 0 });

    const second = contextAwareness.analyzeContextNow();
    assert.ok(second);
    const perf = contextAwareness.getState().performance;
    assert.ok(perf.successfulContexts >= 2);

    contextAwareness.stopContextAwareness();
    visualCapture.stopCapture();
  });

  test("start stop pause and resume context awareness safely", async () => {
    const { contextAwareness, visualCapture } = await buildPipeline();
    await contextAwareness.startContextAwareness();
    assert.equal(contextAwareness.getState().status, "aware");
    contextAwareness.pauseContextAwareness();
    assert.equal(contextAwareness.getState().status, "paused");
    contextAwareness.resumeContextAwareness();
    assert.equal(contextAwareness.getState().status, "aware");
    contextAwareness.stopContextAwareness();
    assert.equal(contextAwareness.getState().status, "stopped");
    visualCapture.stopCapture();
  });

  test("supervisor validation reports readiness", async () => {
    const { uiStateMapper, recognition, layout, navigation, tracking, contextAwareness, visualCapture } =
      await buildPipeline();

    const uiState = uiStateMapper.processFrame(buildTestFrame(1));
    const result = recognition.recognizeUiState(uiState!);
    layout.analyzeRecognition(result!);
    navigation.mapLayout(layout.getLatestLayout()!);
    tracking.recordInteraction({ interactionType: "click", pointerX: 5, pointerY: 5 });
    contextAwareness.analyzeContextNow();

    const supervisor = contextAwareness.validateForSupervisorSync();
    assert.equal(supervisor.valid, true);
    assert.ok(supervisor.readinessScore >= 50);
    assert.ok(supervisor.notes.length >= 1);

    contextAwareness.stopContextAwareness();
    visualCapture.stopCapture();
  });

  test("governance doc path is canonical", () => {
    assert.equal(
      CONTEXT_AWARENESS_SYSTEM_PATH,
      "docs/governance/EMPIREAI_CONTEXT_AWARENESS_SYSTEM.md",
    );
  });
});
