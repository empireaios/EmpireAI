import assert from "node:assert/strict";
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
  buildComponentRecognitionConfiguration,
  effectiveRecognitionIntervalMs,
  COMPONENT_RECOGNITION_SYSTEM_PATH,
  COMPONENT_TYPES,
} from "../../component-recognition-engine/index.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

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

describe("T1-03 Component Recognition", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    process.env.VISUAL_CAPTURE_AUTO_START = "false";
    process.env.UI_STATE_MAPPER_AUTO_START = "false";
    process.env.COMPONENT_RECOGNITION_AUTO_START = "false";
  });

  afterEach(() => {
    delete process.env.VISUAL_CAPTURE_AUTO_START;
    delete process.env.UI_STATE_MAPPER_AUTO_START;
    delete process.env.COMPONENT_RECOGNITION_AUTO_START;
  });

  test("buildComponentRecognitionConfiguration loads defaults", () => {
    const config = buildComponentRecognitionConfiguration(process.cwd());
    assert.equal(config.enabled, true);
    assert.ok(config.confidenceThreshold >= 0);
    assert.ok(config.componentTypeRules.length >= 1);
  });

  test("effectiveRecognitionIntervalMs respects max rate", () => {
    const config = buildComponentRecognitionConfiguration(process.cwd(), {
      recognitionIntervalMs: 100,
      maxRecognitionRate: 2,
    });
    assert.equal(effectiveRecognitionIntervalMs(config), 500);
  });

  test("component recognition initializes with doctrine doc", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: process.cwd() });
    const visualCapture = createVisualCaptureEngine(bootstrap, { autoStart: false });
    await visualCapture.initialize();
    const uiStateMapper = createUiStateMapperEngine(bootstrap, visualCapture, { autoStart: false });
    await uiStateMapper.initialize();
    const recognition = createComponentRecognitionEngine(bootstrap, uiStateMapper, {
      autoStart: false,
    });
    const state = await recognition.initialize();
    assert.equal(state.engineVersion, "PILLOW-CRE-001");
    assert.equal(state.missionId, "T1-03");
    assert.ok(state.configuration);
    assert.ok(state.health);
    recognition.stopRecognition();
    uiStateMapper.stopMapping();
    visualCapture.stopCapture();
  });

  test("detects components from UI state model", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: process.cwd() });
    const visualCapture = createVisualCaptureEngine(bootstrap, { autoStart: false });
    await visualCapture.initialize();
    const uiStateMapper = createUiStateMapperEngine(bootstrap, visualCapture, { autoStart: false });
    await uiStateMapper.initialize();
    const recognition = createComponentRecognitionEngine(bootstrap, uiStateMapper, {
      autoStart: false,
      configuration: { confidenceThreshold: 0.4 },
    });
    await recognition.initialize();

    const uiState = uiStateMapper.processFrame(buildTestFrame(1));
    assert.ok(uiState);
    const result = recognition.recognizeUiState(uiState!);
    assert.ok(result, "Expected recognition result");
    assert.ok(result!.metadata.recognitionId);
    assert.ok(result!.components.length >= 1);
    assert.ok(result!.hierarchy.length >= 1);

    for (const component of result!.components) {
      assert.ok(component.componentId.startsWith("cmp-"));
      assert.ok(COMPONENT_TYPES.includes(component.componentType));
      assert.ok(component.detectionConfidence >= 0.4);
      assert.ok(component.bounds.width >= 0);
      assert.ok(component.sourceStateId);
      assert.ok(component.timestamp);
    }

    recognition.stopRecognition();
    uiStateMapper.stopMapping();
    visualCapture.stopCapture();
  });

  test("detects component changes between states", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: process.cwd() });
    const visualCapture = createVisualCaptureEngine(bootstrap, { autoStart: false });
    await visualCapture.initialize();
    const uiStateMapper = createUiStateMapperEngine(bootstrap, visualCapture, { autoStart: false });
    await uiStateMapper.initialize();
    const recognition = createComponentRecognitionEngine(bootstrap, uiStateMapper, {
      autoStart: false,
      configuration: { confidenceThreshold: 0.4 },
    });
    await recognition.initialize();

    const state1 = uiStateMapper.processFrame(buildTestFrame(1));
    recognition.recognizeUiState(state1!);

    const frame2 = buildTestFrame(2);
    frame2.imageBase64 = MINIMAL_PNG_BASE64 + "Y";
    const state2 = uiStateMapper.processFrame(frame2);
    const result2 = recognition.recognizeUiState(state2!);

    assert.ok(result2?.changeSummary);
    assert.equal(result2!.changeSummary!.hasChanges, true);

    recognition.stopRecognition();
    uiStateMapper.stopMapping();
    visualCapture.stopCapture();
  });

  test("pause and resume recognition safely", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: process.cwd() });
    const visualCapture = createVisualCaptureEngine(bootstrap, { autoStart: false });
    await visualCapture.initialize();
    const uiStateMapper = createUiStateMapperEngine(bootstrap, visualCapture, { autoStart: false });
    await uiStateMapper.initialize();
    const recognition = createComponentRecognitionEngine(bootstrap, uiStateMapper, {
      autoStart: false,
    });
    await recognition.initialize();
    await recognition.startRecognition();
    recognition.pauseRecognition();
    assert.equal(recognition.getState().status, "paused");
    recognition.resumeRecognition();
    assert.equal(recognition.getState().status, "recognizing");
    recognition.stopRecognition();
    assert.equal(recognition.getState().status, "stopped");
    visualCapture.stopCapture();
  });

  test("governance doc path is canonical", () => {
    assert.equal(
      COMPONENT_RECOGNITION_SYSTEM_PATH,
      "docs/governance/EMPIREAI_COMPONENT_RECOGNITION_SYSTEM.md",
    );
  });
});
