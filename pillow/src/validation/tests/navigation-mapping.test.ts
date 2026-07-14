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
  buildNavigationMappingConfiguration,
  effectiveMappingIntervalMs,
  NAVIGATION_MAPPING_SYSTEM_PATH,
  NODE_KINDS,
  TRANSITION_TYPES,
} from "../../navigation-mapping-engine/index.js";
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
  return { bootstrap, visualCapture, uiStateMapper, recognition, layout, navigation };
}

describe("T1-05 Navigation Mapping", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    resetLayoutUnderstandingForTesting();
    resetNavigationMappingForTesting();
    process.env.VISUAL_CAPTURE_AUTO_START = "false";
    process.env.UI_STATE_MAPPER_AUTO_START = "false";
    process.env.COMPONENT_RECOGNITION_AUTO_START = "false";
    process.env.LAYOUT_UNDERSTANDING_AUTO_START = "false";
    process.env.NAVIGATION_MAPPING_AUTO_START = "false";
  });

  afterEach(() => {
    delete process.env.VISUAL_CAPTURE_AUTO_START;
    delete process.env.UI_STATE_MAPPER_AUTO_START;
    delete process.env.COMPONENT_RECOGNITION_AUTO_START;
    delete process.env.LAYOUT_UNDERSTANDING_AUTO_START;
    delete process.env.NAVIGATION_MAPPING_AUTO_START;
  });

  test("buildNavigationMappingConfiguration loads defaults", () => {
    const config = buildNavigationMappingConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.ok(config.confidenceThreshold >= 0);
    assert.ok(config.navigationComponentRules.length >= 1);
  });

  test("effectiveMappingIntervalMs respects max rate", () => {
    const config = buildNavigationMappingConfiguration(REPO_ROOT, {
      mappingIntervalMs: 100,
      maxMappingRate: 2,
    });
    assert.equal(effectiveMappingIntervalMs(config), 500);
  });

  test("navigation mapping initializes with doctrine doc", async () => {
    const { navigation, visualCapture } = await buildPipeline();
    const state = navigation.getState();
    assert.equal(state.engineVersion, "PILLOW-NME-001");
    assert.equal(state.missionId, "T1-05");
    assert.ok(state.configuration);
    assert.ok(state.health);
    navigation.stopNavigationMapping();
    visualCapture.stopCapture();
  });

  test("maps navigation graph from layout model", async () => {
    const { uiStateMapper, recognition, layout, navigation, visualCapture } =
      await buildPipeline();

    const uiState = uiStateMapper.processFrame(buildTestFrame(1));
    assert.ok(uiState);
    const recognitionResult = recognition.recognizeUiState(uiState!);
    assert.ok(recognitionResult);
    const layoutModel = layout.analyzeRecognition(recognitionResult!);
    assert.ok(layoutModel);

    const graph = navigation.mapLayout(layoutModel!);
    assert.ok(graph, "Expected navigation graph");
    assert.ok(graph!.metadata.graphId);
    assert.ok(graph!.metadata.currentScreenId);
    assert.ok(graph!.nodes.length >= 1);
    assert.ok(graph!.metadata.confidenceScore >= 0);

    for (const node of graph!.nodes) {
      assert.ok(node.nodeId.startsWith("nav-node-"));
      assert.ok(NODE_KINDS.includes(node.kind));
      assert.ok(node.confidence >= 0);
    }

    assert.ok(graph!.entryPoints.length >= 0);
    assert.ok(graph!.destinations.length >= 1);
    assert.ok(graph!.relationships.length >= 0);

    navigation.stopNavigationMapping();
    visualCapture.stopCapture();
  });

  test("detects navigation transitions between layouts", async () => {
    const { uiStateMapper, recognition, layout, navigation, visualCapture } =
      await buildPipeline();

    const state1 = uiStateMapper.processFrame(buildTestFrame(1));
    const result1 = recognition.recognizeUiState(state1!);
    const layout1 = layout.analyzeRecognition(result1!);
    navigation.mapLayout(layout1!);

    const frame2 = buildTestFrame(2);
    frame2.imageBase64 = MINIMAL_PNG_BASE64 + "Z";
    const state2 = uiStateMapper.processFrame(frame2);
    const result2 = recognition.recognizeUiState(state2!);
    const layout2 = layout.analyzeRecognition(result2!);
    const graph2 = navigation.mapLayout(layout2!);

    assert.ok(graph2?.changeSummary);
    assert.equal(graph2!.changeSummary!.hasChanges, true);

    navigation.stopNavigationMapping();
    visualCapture.stopCapture();
  });

  test("pause and resume navigation mapping safely", async () => {
    const { navigation, visualCapture } = await buildPipeline();
    await navigation.startNavigationMapping();
    navigation.pauseNavigationMapping();
    assert.equal(navigation.getState().status, "paused");
    navigation.resumeNavigationMapping();
    assert.equal(navigation.getState().status, "mapping");
    navigation.stopNavigationMapping();
    assert.equal(navigation.getState().status, "stopped");
    visualCapture.stopCapture();
  });

  test("governance doc path is canonical", () => {
    assert.equal(
      NAVIGATION_MAPPING_SYSTEM_PATH,
      "docs/governance/EMPIREAI_NAVIGATION_MAPPING_SYSTEM.md",
    );
    assert.ok(TRANSITION_TYPES.includes("navigation"));
  });
});
