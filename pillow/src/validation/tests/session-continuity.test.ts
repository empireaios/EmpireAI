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
} from "../../visual-memory-engine/index.js";
import {
  createSessionContinuityEngine,
  resetSessionContinuityForTesting,
  buildSessionContinuityConfiguration,
  effectiveContinuityUpdateIntervalMs,
  SESSION_CONTINUITY_SYSTEM_PATH,
} from "../../session-continuity-engine/index.js";
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
    { autoStart: false, configuration: { storageBackend: "memory" } },
  );
  await visualMemory.initialize();
  const sessionContinuity = createSessionContinuityEngine(
    bootstrap,
    uiStateMapper,
    layout,
    navigation,
    tracking,
    contextAwareness,
    visualMemory,
    { autoStart: false, configuration: { persistSessionContext: false } },
  );
  await sessionContinuity.initialize();
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
    sessionContinuity,
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
  engines.visualMemory.captureMemoryNow();
}

describe("T1-09 Session Continuity", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    resetLayoutUnderstandingForTesting();
    resetNavigationMappingForTesting();
    resetInteractionTrackingForTesting();
    resetContextAwarenessForTesting();
    resetVisualMemoryForTesting();
    resetSessionContinuityForTesting();
    process.env.VISUAL_CAPTURE_AUTO_START = "false";
    process.env.UI_STATE_MAPPER_AUTO_START = "false";
    process.env.COMPONENT_RECOGNITION_AUTO_START = "false";
    process.env.LAYOUT_UNDERSTANDING_AUTO_START = "false";
    process.env.NAVIGATION_MAPPING_AUTO_START = "false";
    process.env.INTERACTION_TRACKING_AUTO_START = "false";
    process.env.CONTEXT_AWARENESS_AUTO_START = "false";
    process.env.VISUAL_MEMORY_AUTO_START = "false";
    process.env.SESSION_CONTINUITY_AUTO_START = "false";
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
    delete process.env.SESSION_CONTINUITY_AUTO_START;
  });

  test("buildSessionContinuityConfiguration loads defaults", () => {
    const config = buildSessionContinuityConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.maskSensitiveValues, true);
    assert.equal(config.validateContinuity, true);
  });

  test("effectiveContinuityUpdateIntervalMs respects max rate", () => {
    const config = buildSessionContinuityConfiguration(REPO_ROOT, {
      continuityUpdateIntervalMs: 50,
      maxUpdateRate: 4,
    });
    assert.equal(effectiveContinuityUpdateIntervalMs(config), 250);
  });

  test("session continuity initializes with doctrine doc", async () => {
    const { sessionContinuity, visualCapture } = await buildPipeline();
    const state = sessionContinuity.getState();
    assert.equal(state.engineVersion, "PILLOW-SCE-001");
    assert.equal(state.missionId, "T1-09");
    assert.ok(state.configuration);
    assert.ok(state.health);
    sessionContinuity.stopSessionContinuity();
    visualCapture.stopCapture();
  });

  test("updateContinuityNow preserves session context after upstream primed", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const continuity = engines.sessionContinuity.updateContinuityNow();
    assert.ok(continuity, "Expected session continuity model");
    assert.ok(continuity!.sessionContinuityId.startsWith("scont-"));
    assert.ok(continuity!.currentUiStateId);
    assert.ok(continuity!.recentMemoryRecordIds.length >= 1);
    assert.ok(continuity!.recentInteractionEventIds.length >= 1);
    assert.ok(continuity!.continuityConfidence >= 0.4);

    const state = engines.sessionContinuity.getState();
    assert.equal(state.latestContinuity?.sessionContinuityId, continuity!.sessionContinuityId);

    engines.sessionContinuity.stopSessionContinuity();
    engines.visualCapture.stopCapture();
  });

  test("detects context changes across navigation updates", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.sessionContinuity.updateContinuityNow();

    const frame2 = buildTestFrame(2);
    frame2.imageBase64 = MINIMAL_PNG_BASE64 + "Y";
    const state2 = engines.uiStateMapper.processFrame(frame2);
    const result2 = engines.recognition.recognizeUiState(state2!);
    const layout2 = engines.layout.analyzeRecognition(result2!);
    engines.navigation.mapLayout(layout2!);
    engines.tracking.recordInteraction({ interactionType: "navigation", pointerX: 0, pointerY: 0 });
    engines.contextAwareness.analyzeContextNow();
    engines.visualMemory.captureMemoryNow();

    const second = engines.sessionContinuity.updateContinuityNow();
    assert.ok(second);
    assert.ok(engines.sessionContinuity.getState().performance.successfulUpdates >= 2);

    engines.sessionContinuity.stopSessionContinuity();
    engines.visualCapture.stopCapture();
  });

  test("start stop pause and resume session continuity safely", async () => {
    const { sessionContinuity, visualCapture } = await buildPipeline();
    await sessionContinuity.startSessionContinuity("test-actor");
    assert.equal(sessionContinuity.getState().status, "active");
    sessionContinuity.pauseSessionContinuity();
    assert.equal(sessionContinuity.getState().status, "paused");
    sessionContinuity.resumeSessionContinuity();
    assert.equal(sessionContinuity.getState().status, "active");
    sessionContinuity.stopSessionContinuity();
    assert.equal(sessionContinuity.getState().status, "stopped");
    visualCapture.stopCapture();
  });

  test("supervisor validation reports readiness", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.sessionContinuity.updateContinuityNow();

    const supervisor = engines.sessionContinuity.validateForSupervisorSync();
    assert.equal(supervisor.valid, true);
    assert.ok(supervisor.readinessScore >= 50);

    engines.sessionContinuity.stopSessionContinuity();
    engines.visualCapture.stopCapture();
  });

  test("governance doc path is canonical", () => {
    assert.equal(
      SESSION_CONTINUITY_SYSTEM_PATH,
      "docs/governance/EMPIREAI_SESSION_CONTINUITY_SYSTEM.md",
    );
  });
});
