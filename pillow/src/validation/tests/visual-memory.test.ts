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
  createVisualMemoryEngine,
  resetVisualMemoryForTesting,
  buildVisualMemoryConfiguration,
  effectiveMemoryCaptureIntervalMs,
  VISUAL_MEMORY_SYSTEM_PATH,
} from "../../visual-memory-engine/index.js";
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
  const visualMemory = createVisualMemoryEngine(
    bootstrap,
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    tracking,
    contextAwareness,
    {
      autoStart: false,
      configuration: { storageBackend: "memory" },
    },
  );
  await visualMemory.initialize();
  return {
    bootstrap,
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    tracking,
    contextAwareness,
    visualMemory,
  };
}

async function primeUpstream(engines: Awaited<ReturnType<typeof buildPipeline>>) {
  const uiState = engines.uiStateMapper.processFrame(buildTestFrame(1));
  const recognitionResult = engines.recognition.recognizeUiState(uiState!);
  const layoutModel = engines.layout.analyzeRecognition(recognitionResult!);
  engines.navigation.mapLayout(layoutModel!);
  engines.tracking.recordInteraction({
    interactionType: "click",
    componentId: recognitionResult!.components[0]?.componentId,
    pointerX: 100,
    pointerY: 50,
  });
  engines.contextAwareness.analyzeContextNow();
}

describe("T1-08 Visual Memory", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    resetLayoutUnderstandingForTesting();
    resetNavigationMappingForTesting();
    resetInteractionTrackingForTesting();
    resetContextAwarenessForTesting();
    resetVisualMemoryForTesting();
    process.env.VISUAL_CAPTURE_AUTO_START = "false";
    process.env.UI_STATE_MAPPER_AUTO_START = "false";
    process.env.COMPONENT_RECOGNITION_AUTO_START = "false";
    process.env.LAYOUT_UNDERSTANDING_AUTO_START = "false";
    process.env.NAVIGATION_MAPPING_AUTO_START = "false";
    process.env.INTERACTION_TRACKING_AUTO_START = "false";
    process.env.CONTEXT_AWARENESS_AUTO_START = "false";
    process.env.VISUAL_MEMORY_AUTO_START = "false";
  });

  afterEach(() => {
    delete process.env.VISUAL_CAPTURE_AUTO_START;
    delete process.env.UI_STATE_MAPPER_AUTO_START;
    delete process.env.COMPONENT_RECOGNITION_AUTO_START;
    delete process.env.LAYOUT_UNDERSTANDING_AUTO_START;
    delete process.env.NAVIGATION_MAPPING_AUTO_START;
    delete process.env.INTERACTION_TRACKING_AUTO_START;
    delete process.env.CONTEXT_AWARENESS_AUTO_START;
    delete process.env.VISUAL_MEMORY_AUTO_START;
  });

  test("buildVisualMemoryConfiguration loads defaults", () => {
    const config = buildVisualMemoryConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.ok(config.sensitiveFieldPatterns.length >= 1);
  });

  test("effectiveMemoryCaptureIntervalMs respects max rate", () => {
    const config = buildVisualMemoryConfiguration(REPO_ROOT, {
      memoryCaptureIntervalMs: 50,
      maxCaptureRate: 3,
    });
    assert.equal(effectiveMemoryCaptureIntervalMs(config), 334);
  });

  test("visual memory initializes with doctrine doc", async () => {
    const { visualMemory, visualCapture } = await buildPipeline();
    const state = visualMemory.getState();
    assert.equal(state.engineVersion, "PILLOW-VME-001");
    assert.equal(state.missionId, "T1-08");
    assert.ok(state.configuration);
    assert.ok(state.health);
    visualMemory.stopVisualMemory();
    visualCapture.stopCapture();
  });

  test("captureMemoryNow stores historical UI state after upstream primed", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const record = engines.visualMemory.captureMemoryNow();
    assert.ok(record, "Expected visual memory record");
    assert.ok(record!.memoryRecordId.startsWith("vmem-"));
    assert.ok(record!.sourceUiStateId);
    assert.ok(record!.stateSummary);
    assert.ok(record!.confidence >= 0.4);

    const state = engines.visualMemory.getState();
    assert.equal(state.latestRecord?.memoryRecordId, record!.memoryRecordId);
    assert.ok(state.performance.successfulRecords >= 1);

    engines.visualMemory.stopVisualMemory();
    engines.visualCapture.stopCapture();
  });

  test("retrieves recent and historical records", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const record = engines.visualMemory.captureMemoryNow();
    assert.ok(record);

    const recent = engines.visualMemory.retrieveRecent(5);
    assert.ok(recent.length >= 1);
    assert.equal(recent[0]!.memoryRecordId, record!.memoryRecordId);

    const byScreen = engines.visualMemory.retrieveByScreen(record!.screenId ?? "unknown");
    assert.ok(byScreen.length >= 0);

    const byId = engines.visualMemory.retrieveById(record!.memoryRecordId);
    assert.equal(byId?.memoryRecordId, record!.memoryRecordId);

    engines.visualMemory.stopVisualMemory();
    engines.visualCapture.stopCapture();
  });

  test("compares current state against historical record", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const record = engines.visualMemory.captureMemoryNow();
    assert.ok(record);

    const comparison = engines.visualMemory.compareWithCurrent(record!.memoryRecordId);
    assert.ok(comparison);
    assert.equal(comparison!.memoryRecordId, record!.memoryRecordId);
    assert.ok(comparison!.summary);

    const state = engines.visualMemory.getState();
    assert.ok(state.performance.comparisons >= 1);

    engines.visualMemory.stopVisualMemory();
    engines.visualCapture.stopCapture();
  });

  test("start stop pause and resume visual memory safely", async () => {
    const { visualMemory, visualCapture } = await buildPipeline();
    await visualMemory.startVisualMemory();
    assert.equal(visualMemory.getState().status, "recording");
    visualMemory.pauseVisualMemory();
    assert.equal(visualMemory.getState().status, "paused");
    visualMemory.resumeVisualMemory();
    assert.equal(visualMemory.getState().status, "recording");
    visualMemory.stopVisualMemory();
    assert.equal(visualMemory.getState().status, "stopped");
    visualCapture.stopCapture();
  });

  test("supervisor validation reports readiness", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.visualMemory.captureMemoryNow();

    const supervisor = engines.visualMemory.validateForSupervisorSync();
    assert.equal(supervisor.valid, true);
    assert.ok(supervisor.readinessScore >= 50);

    engines.visualMemory.stopVisualMemory();
    engines.visualCapture.stopCapture();
  });

  test("governance doc path is canonical", () => {
    assert.equal(
      VISUAL_MEMORY_SYSTEM_PATH,
      "docs/governance/EMPIREAI_VISUAL_MEMORY_SYSTEM.md",
    );
  });
});
