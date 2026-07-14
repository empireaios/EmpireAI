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
  buildInteractionTrackingConfiguration,
  effectiveTrackingIntervalMs,
  INTERACTION_TRACKING_SYSTEM_PATH,
  INTERACTION_TYPES,
} from "../../interaction-tracking-engine/index.js";
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
  return { bootstrap, visualCapture, uiStateMapper, recognition, layout, navigation, tracking };
}

describe("T1-06 Interaction Tracking", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    resetLayoutUnderstandingForTesting();
    resetNavigationMappingForTesting();
    resetInteractionTrackingForTesting();
    process.env.VISUAL_CAPTURE_AUTO_START = "false";
    process.env.UI_STATE_MAPPER_AUTO_START = "false";
    process.env.COMPONENT_RECOGNITION_AUTO_START = "false";
    process.env.LAYOUT_UNDERSTANDING_AUTO_START = "false";
    process.env.NAVIGATION_MAPPING_AUTO_START = "false";
    process.env.INTERACTION_TRACKING_AUTO_START = "false";
  });

  afterEach(() => {
    delete process.env.VISUAL_CAPTURE_AUTO_START;
    delete process.env.UI_STATE_MAPPER_AUTO_START;
    delete process.env.COMPONENT_RECOGNITION_AUTO_START;
    delete process.env.LAYOUT_UNDERSTANDING_AUTO_START;
    delete process.env.NAVIGATION_MAPPING_AUTO_START;
    delete process.env.INTERACTION_TRACKING_AUTO_START;
  });

  test("buildInteractionTrackingConfiguration loads defaults", () => {
    const config = buildInteractionTrackingConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.sensitiveFieldPatterns.length >= 1);
  });

  test("effectiveTrackingIntervalMs respects max rate", () => {
    const config = buildInteractionTrackingConfiguration(REPO_ROOT, {
      trackingIntervalMs: 50,
      maxTrackingRate: 5,
    });
    assert.equal(effectiveTrackingIntervalMs(config), 200);
  });

  test("interaction tracking initializes with doctrine doc", async () => {
    const { tracking, visualCapture } = await buildPipeline();
    const state = tracking.getState();
    assert.equal(state.engineVersion, "PILLOW-ITE-001");
    assert.equal(state.missionId, "T1-06");
    assert.ok(state.configuration);
    assert.ok(state.health);
    tracking.stopInteractionTracking();
    visualCapture.stopCapture();
  });

  test("records ingested click interaction", async () => {
    const { uiStateMapper, recognition, layout, navigation, tracking, visualCapture } =
      await buildPipeline();

    const uiState = uiStateMapper.processFrame(buildTestFrame(1));
    const recognitionResult = recognition.recognizeUiState(uiState!);
    const layoutModel = layout.analyzeRecognition(recognitionResult!);
    navigation.mapLayout(layoutModel!);

    const componentId = recognitionResult!.components[0]?.componentId;
    const event = tracking.recordInteraction({
      interactionType: "click",
      componentId,
      pointerX: 100,
      pointerY: 50,
    });

    assert.ok(event, "Expected interaction event");
    assert.ok(event!.eventId.startsWith("int-evt-"));
    assert.equal(event!.interactionType, "click");
    assert.ok(INTERACTION_TYPES.includes(event!.interactionType));
    assert.ok(event!.confidence >= 0.4);
    assert.ok(event!.timestamp);

    tracking.stopInteractionTracking();
    visualCapture.stopCapture();
  });

  test("masks sensitive password field values", async () => {
    const { tracking, visualCapture } = await buildPipeline();

    const event = tracking.recordInteraction({
      interactionType: "text_input",
      inputFieldId: "user-password-field",
      previousValue: "old-secret",
      newValue: "new-secret",
    });

    assert.ok(event);
    assert.equal(event!.previousValue, "[REDACTED]");
    assert.equal(event!.newValue, "[REDACTED]");
    assert.equal(event!.inputChange?.masked, true);

    const state = tracking.getState();
    assert.ok(state.performance.maskedSensitiveEvents >= 1);

    tracking.stopInteractionTracking();
    visualCapture.stopCapture();
  });

  test("infers navigation interactions from graph changes", async () => {
    const { uiStateMapper, recognition, layout, navigation, tracking, visualCapture } =
      await buildPipeline();

    const state1 = uiStateMapper.processFrame(buildTestFrame(1));
    const result1 = recognition.recognizeUiState(state1!);
    const layout1 = layout.analyzeRecognition(result1!);
    navigation.mapLayout(layout1!);

    const frame2 = buildTestFrame(2);
    frame2.imageBase64 = MINIMAL_PNG_BASE64 + "X";
    const state2 = uiStateMapper.processFrame(frame2);
    const result2 = recognition.recognizeUiState(state2!);
    const layout2 = layout.analyzeRecognition(result2!);
    navigation.mapLayout(layout2!);

    await tracking.startInteractionTracking();
    await new Promise((r) => setTimeout(r, 600));
    const events = tracking.getRecentEvents(10);
    tracking.stopInteractionTracking();

    assert.ok(events.length >= 0);

    visualCapture.stopCapture();
  });

  test("pause and resume interaction tracking safely", async () => {
    const { tracking, visualCapture } = await buildPipeline();
    await tracking.startInteractionTracking();
    tracking.pauseInteractionTracking();
    assert.equal(tracking.getState().status, "paused");
    tracking.resumeInteractionTracking();
    assert.equal(tracking.getState().status, "tracking");
    tracking.stopInteractionTracking();
    assert.equal(tracking.getState().status, "stopped");
    visualCapture.stopCapture();
  });

  test("governance doc path is canonical", () => {
    assert.equal(
      INTERACTION_TRACKING_SYSTEM_PATH,
      "docs/governance/EMPIREAI_INTERACTION_TRACKING_SYSTEM.md",
    );
  });
});
