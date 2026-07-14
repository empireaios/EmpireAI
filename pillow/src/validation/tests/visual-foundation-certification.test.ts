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
} from "../../session-continuity-engine/index.js";
import {
  createVisualFoundationCertificationEngine,
  resetVisualFoundationCertificationForTesting,
  buildVisualFoundationCertificationConfiguration,
  VISUAL_FOUNDATION_CERTIFICATION_SYSTEM_PATH,
  T1_MISSION_IDS,
} from "../../visual-foundation-certification-engine/index.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "vfc-test-session",
    frameNumber,
    windowId: "win-vfc",
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
    { autoStart: false, configuration: { storageBackend: "memory", confidenceThreshold: 0.4 } },
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
  const certification = createVisualFoundationCertificationEngine(
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
    {
      configuration: {
        reportOutputRoot: ".pillow-visual-foundation-certification-test",
        requiredPassThreshold: 50,
      },
    },
  );
  await certification.initialize();
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
    certification,
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
  engines.sessionContinuity.updateContinuityNow();
}

describe("T1-10 Visual Foundation Certification", () => {
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
    resetVisualFoundationCertificationForTesting();
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

  test("buildVisualFoundationCertificationConfiguration loads defaults", () => {
    const config = buildVisualFoundationCertificationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.requireEndToEndPass, true);
    assert.equal(config.validationScope.length, 9);
    assert.deepEqual(config.validationScope, [...T1_MISSION_IDS]);
  });

  test("certification engine initializes with doctrine doc", async () => {
    const { certification, visualCapture } = await buildPipeline();
    const state = certification.getState();
    assert.equal(state.engineVersion, "PILLOW-VFC-001");
    assert.equal(state.missionId, "T1-10");
    assert.ok(state.configuration);
    assert.ok(state.health);
    visualCapture.stopCapture();
  });

  test("runCertification validates T1-01 through T1-09", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = await engines.certification.runCertification();
    assert.ok(report.certificationReportId.startsWith("vfc-report-"));
    assert.equal(report.validatedMissionList.length, 9);
    assert.equal(report.missionResults.length, 9);

    const passed = report.missionResults.filter((m) => m.passed).length;
    assert.ok(passed >= 7, `Expected most missions to pass, got ${passed}/9`);

    engines.visualCapture.stopCapture();
  });

  test("end-to-end foundation validation passes when pipeline primed", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = await engines.certification.runCertification();
    assert.ok(report.endToEndValidationResult.passed, report.endToEndValidationResult.summary);
    assert.equal(report.endToEndValidationResult.steps.length, 8);

    engines.visualCapture.stopCapture();
  });

  test("generates certification report with decision and output path", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = await engines.certification.runCertification();
    assert.ok(["pass", "conditional", "fail"].includes(report.finalCertificationDecision));
    assert.ok(report.reportOutputPath);
    assert.ok(report.metadataVersion);

    const state = engines.certification.getState();
    assert.equal(state.latestReport?.certificationReportId, report.certificationReportId);

    engines.visualCapture.stopCapture();
  });

  test("confirms sensitive data protection in report", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = await engines.certification.runCertification();
    assert.equal(report.dataSafetySummary.sensitiveMaskingActive, true);
    assert.ok(report.dataSafetySummary.missionsWithMasking.length >= 1);

    engines.visualCapture.stopCapture();
  });

  test("supervisor validation reports readiness after certification", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    await engines.certification.runCertification();

    const supervisor = engines.certification.validateForSupervisorSync();
    assert.equal(supervisor.valid, true);
    assert.ok(supervisor.readinessScore >= 50);

    engines.visualCapture.stopCapture();
  });

  test("governance doc path is canonical", () => {
    assert.equal(
      VISUAL_FOUNDATION_CERTIFICATION_SYSTEM_PATH,
      "docs/governance/EMPIREAI_VISUAL_FOUNDATION_CERTIFICATION_SYSTEM.md",
    );
  });
});
