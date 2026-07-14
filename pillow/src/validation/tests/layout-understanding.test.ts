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
  buildLayoutUnderstandingConfiguration,
  effectiveAnalysisIntervalMs,
  LAYOUT_UNDERSTANDING_SYSTEM_PATH,
  STRUCTURAL_REGION_TYPES,
} from "../../layout-understanding-engine/index.js";
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

describe("T1-04 Layout Understanding", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    resetLayoutUnderstandingForTesting();
    process.env.VISUAL_CAPTURE_AUTO_START = "false";
    process.env.UI_STATE_MAPPER_AUTO_START = "false";
    process.env.COMPONENT_RECOGNITION_AUTO_START = "false";
    process.env.LAYOUT_UNDERSTANDING_AUTO_START = "false";
  });

  afterEach(() => {
    delete process.env.VISUAL_CAPTURE_AUTO_START;
    delete process.env.UI_STATE_MAPPER_AUTO_START;
    delete process.env.COMPONENT_RECOGNITION_AUTO_START;
    delete process.env.LAYOUT_UNDERSTANDING_AUTO_START;
  });

  test("buildLayoutUnderstandingConfiguration loads defaults", () => {
    const config = buildLayoutUnderstandingConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.ok(config.confidenceThreshold >= 0);
    assert.ok(config.structuralRegionRules.length >= 1);
  });

  test("effectiveAnalysisIntervalMs respects max rate", () => {
    const config = buildLayoutUnderstandingConfiguration(REPO_ROOT, {
      analysisIntervalMs: 100,
      maxAnalysisRate: 2,
    });
    assert.equal(effectiveAnalysisIntervalMs(config), 500);
  });

  test("layout understanding initializes with doctrine doc", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    const visualCapture = createVisualCaptureEngine(bootstrap, { autoStart: false });
    await visualCapture.initialize();
    const uiStateMapper = createUiStateMapperEngine(bootstrap, visualCapture, { autoStart: false });
    await uiStateMapper.initialize();
    const recognition = createComponentRecognitionEngine(bootstrap, uiStateMapper, {
      autoStart: false,
    });
    await recognition.initialize();
    const layout = createLayoutUnderstandingEngine(bootstrap, recognition, { autoStart: false });
    const state = await layout.initialize();
    assert.equal(state.engineVersion, "PILLOW-LUE-001");
    assert.equal(state.missionId, "T1-04");
    assert.ok(state.configuration);
    assert.ok(state.health);
    layout.stopLayoutAnalysis();
    recognition.stopRecognition();
    uiStateMapper.stopMapping();
    visualCapture.stopCapture();
  });

  test("analyzes layout from component recognition result", async () => {
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

    const uiState = uiStateMapper.processFrame(buildTestFrame(1));
    assert.ok(uiState);
    const recognitionResult = recognition.recognizeUiState(uiState!);
    assert.ok(recognitionResult);

    const layoutModel = layout.analyzeRecognition(recognitionResult!);
    assert.ok(layoutModel, "Expected layout model");
    assert.ok(layoutModel!.metadata.layoutId);
    assert.ok(layoutModel!.regions.length >= 1);
    assert.ok(layoutModel!.metadata.confidenceScore >= 0);

    for (const region of layoutModel!.regions) {
      assert.ok(region.regionId.startsWith("layout-region-"));
      assert.ok(STRUCTURAL_REGION_TYPES.includes(region.regionType));
      assert.ok(region.bounds.width >= 0);
      assert.ok(region.confidence >= 0);
    }

    assert.ok(layoutModel!.spatialRelationships.length >= 0);
    assert.ok(layoutModel!.stackingOrder.length >= 1);
    assert.ok(layoutModel!.responsiveBreakpoints.length >= 1);

    layout.stopLayoutAnalysis();
    recognition.stopRecognition();
    uiStateMapper.stopMapping();
    visualCapture.stopCapture();
  });

  test("detects layout changes between recognitions", async () => {
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

    const state1 = uiStateMapper.processFrame(buildTestFrame(1));
    const result1 = recognition.recognizeUiState(state1!);
    layout.analyzeRecognition(result1!);

    const frame2 = buildTestFrame(2);
    frame2.imageBase64 = MINIMAL_PNG_BASE64 + "Y";
    const state2 = uiStateMapper.processFrame(frame2);
    const result2 = recognition.recognizeUiState(state2!);
    const layout2 = layout.analyzeRecognition(result2!);

    assert.ok(layout2?.changeSummary);
    assert.equal(layout2!.changeSummary!.hasChanges, true);

    layout.stopLayoutAnalysis();
    recognition.stopRecognition();
    uiStateMapper.stopMapping();
    visualCapture.stopCapture();
  });

  test("pause and resume layout analysis safely", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    const visualCapture = createVisualCaptureEngine(bootstrap, { autoStart: false });
    await visualCapture.initialize();
    const uiStateMapper = createUiStateMapperEngine(bootstrap, visualCapture, { autoStart: false });
    await uiStateMapper.initialize();
    const recognition = createComponentRecognitionEngine(bootstrap, uiStateMapper, {
      autoStart: false,
    });
    await recognition.initialize();
    const layout = createLayoutUnderstandingEngine(bootstrap, recognition, { autoStart: false });
    await layout.initialize();
    await layout.startLayoutAnalysis();
    layout.pauseLayoutAnalysis();
    assert.equal(layout.getState().status, "paused");
    layout.resumeLayoutAnalysis();
    assert.equal(layout.getState().status, "analyzing");
    layout.stopLayoutAnalysis();
    assert.equal(layout.getState().status, "stopped");
    visualCapture.stopCapture();
  });

  test("governance doc path is canonical", () => {
    assert.equal(
      LAYOUT_UNDERSTANDING_SYSTEM_PATH,
      "docs/governance/EMPIREAI_LAYOUT_UNDERSTANDING_SYSTEM.md",
    );
  });
});
