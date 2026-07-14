import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach, afterEach } from "node:test";

import { runBootstrap } from "../../bootstrap/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
import {
  createVisualCaptureEngine,
  resetVisualCaptureEngineForTesting,
} from "../../visual-capture-engine/index.js";
import {
  createUiStateMapperEngine,
  resetUiStateMapperForTesting,
  buildUiStateMapperConfiguration,
  effectiveUpdateIntervalMs,
  UI_STATE_MAPPER_SYSTEM_PATH,
} from "../../ui-state-mapper/index.js";
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

describe("T1-02 UI State Mapper", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    process.env.VISUAL_CAPTURE_AUTO_START = "false";
    process.env.UI_STATE_MAPPER_AUTO_START = "false";
  });

  afterEach(() => {
    delete process.env.VISUAL_CAPTURE_AUTO_START;
    delete process.env.UI_STATE_MAPPER_AUTO_START;
  });

  test("buildUiStateMapperConfiguration loads defaults and env", () => {
    const config = buildUiStateMapperConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.ok(config.updateIntervalMs >= 200);
    assert.ok(config.gridRows >= 1);
    assert.ok(config.gridColumns >= 1);
  });

  test("effectiveUpdateIntervalMs respects max update rate", () => {
    const config = buildUiStateMapperConfiguration(REPO_ROOT, {
      updateIntervalMs: 100,
      maxUpdateRate: 2,
    });
    assert.equal(effectiveUpdateIntervalMs(config), 500);
  });

  test("ui state mapper initializes with doctrine doc", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    const visualCapture = createVisualCaptureEngine(bootstrap, { autoStart: false });
    await visualCapture.initialize();
    const mapper = createUiStateMapperEngine(bootstrap, visualCapture, { autoStart: false });
    const state = await mapper.initialize();
    assert.equal(state.engineVersion, "PILLOW-USM-001");
    assert.equal(state.missionId, "T1-02");
    assert.ok(state.configuration);
    assert.ok(state.health);
    mapper.stopMapping();
    visualCapture.stopCapture();
  });

  test("processes frame into machine-readable UI model", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    const visualCapture = createVisualCaptureEngine(bootstrap, { autoStart: false });
    await visualCapture.initialize();
    const mapper = createUiStateMapperEngine(bootstrap, visualCapture, { autoStart: false });
    await mapper.initialize();

    const uiState = mapper.processFrame(buildTestFrame(1));
    assert.ok(uiState, "Expected UI state from frame");
    assert.ok(uiState!.metadata.stateId);
    assert.ok(uiState!.metadata.sessionId);
    assert.ok(uiState!.metadata.sourceFrameId);
    assert.equal(uiState!.metadata.version, "1.0.0");
    assert.ok(uiState!.screen.regions.length >= 1);
    assert.ok(uiState!.screen.hierarchy.length >= 1);
    assert.ok(uiState!.serialized.length > 50);
    assert.equal(uiState!.screen.viewport.width, 1280);
    assert.equal(uiState!.screen.viewport.height, 720);

    mapper.stopMapping();
    visualCapture.stopCapture();
  });

  test("detects state changes between consecutive frames", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    const visualCapture = createVisualCaptureEngine(bootstrap, { autoStart: false });
    await visualCapture.initialize();
    const mapper = createUiStateMapperEngine(bootstrap, visualCapture, { autoStart: false });
    await mapper.initialize();

    mapper.processFrame(buildTestFrame(1));
    const frame2 = buildTestFrame(2);
    frame2.imageBase64 = MINIMAL_PNG_BASE64 + "X";
    const second = mapper.processFrame(frame2);

    assert.ok(second?.changeSummary);
    assert.equal(second!.changeSummary!.hasChanges, true);
    assert.ok(second!.changeSummary!.modified.length >= 0 || second!.changeSummary!.appeared.length >= 0);

    mapper.stopMapping();
    visualCapture.stopCapture();
  });

  test("pause and resume mapping safely", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    const visualCapture = createVisualCaptureEngine(bootstrap, { autoStart: false });
    await visualCapture.initialize();
    const mapper = createUiStateMapperEngine(bootstrap, visualCapture, { autoStart: false });
    await mapper.initialize();
    await mapper.startMapping();
    mapper.pauseMapping();
    assert.equal(mapper.getState().status, "paused");
    mapper.resumeMapping();
    assert.equal(mapper.getState().status, "mapping");
    mapper.stopMapping();
    assert.equal(mapper.getState().status, "stopped");
    visualCapture.stopCapture();
  });

  test("governance doc path is canonical", () => {
    assert.equal(
      UI_STATE_MAPPER_SYSTEM_PATH,
      "docs/governance/EMPIREAI_UI_STATE_MAPPER_SYSTEM.md",
    );
  });
});
