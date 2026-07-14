import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach, afterEach } from "node:test";

import { runBootstrap } from "../../bootstrap/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
import {
  createVisualCaptureEngine,
  resetVisualCaptureEngineForTesting,
  buildVisualCaptureConfiguration,
  effectiveCaptureIntervalMs,
  VISUAL_CAPTURE_SYSTEM_PATH,
} from "../../visual-capture-engine/index.js";

describe("T1-01 Visual Capture Engine", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    process.env.VISUAL_CAPTURE_AUTO_START = "false";
  });

  afterEach(() => {
    delete process.env.VISUAL_CAPTURE_AUTO_START;
  });

  test("buildVisualCaptureConfiguration loads defaults and env", () => {
    const config = buildVisualCaptureConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.ok(config.captureIntervalMs >= 200);
    assert.ok(config.bufferLimit >= 1);
    assert.ok(config.windowTitlePatterns.length >= 1);
  });

  test("effectiveCaptureIntervalMs respects max frame rate", () => {
    const config = buildVisualCaptureConfiguration(REPO_ROOT, {
      captureIntervalMs: 100,
      maxFrameRate: 2,
    });
    assert.equal(effectiveCaptureIntervalMs(config), 500);
  });

  test("visual capture engine initializes with doctrine doc", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    const engine = createVisualCaptureEngine(bootstrap, { autoStart: false });
    const state = await engine.initialize();
    assert.equal(state.engineVersion, "PILLOW-VCE-001");
    assert.equal(state.missionId, "T1-01");
    assert.ok(state.configuration);
    assert.ok(state.health);
    engine.stopCapture();
  });

  test("capture session produces frames with metadata", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    const engine = createVisualCaptureEngine(bootstrap, {
      autoStart: false,
      configuration: {
        enabled: true,
        captureIntervalMs: 100,
        maxFrameRate: 10,
        windowTitlePatterns: ["__EMPIREAI_TEST_NO_MATCH__"],
        selectedWindowId: "win-empireai-synthetic",
      },
    });
    await engine.initialize();
    await engine.startCapture();
    await new Promise((r) => setTimeout(r, 1500));
    const frame = engine.getLatestFrame();
    engine.stopCapture();

    assert.ok(frame, "Expected at least one captured frame");
    assert.equal(frame!.mimeType, "image/png");
    assert.ok(frame!.imageBase64.length > 20);
    assert.ok(frame!.metadata.sessionId);
    assert.ok(frame!.metadata.frameNumber >= 1);
    assert.ok(frame!.metadata.viewport.width >= 1);
    assert.ok(frame!.metadata.viewport.height >= 1);
    assert.ok(frame!.metadata.timestamp);
  });

  test("pause and resume capture safely", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    const engine = createVisualCaptureEngine(bootstrap, { autoStart: false });
    await engine.initialize();
    await engine.startCapture();
    engine.pauseCapture();
    assert.equal(engine.getState().status, "paused");
    engine.resumeCapture();
    assert.equal(engine.getState().status, "capturing");
    engine.stopCapture();
    assert.equal(engine.getState().status, "stopped");
  });

  test("governance doc path is canonical", () => {
    assert.equal(VISUAL_CAPTURE_SYSTEM_PATH, "docs/governance/EMPIREAI_VISUAL_CAPTURE_SYSTEM.md");
  });
});
