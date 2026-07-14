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
  createUxRuleEngine,
  resetUxRuleEngineForTesting,
  buildUxRuleEngineConfiguration,
  UX_RULE_ENGINE_SYSTEM_PATH,
  DEFAULT_UX_RULES,
  RULE_CATEGORIES,
} from "../../ux-rule-engine/index.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "ure-test-session",
    frameNumber,
    windowId: "win-ure",
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
  const uxRuleEngine = createUxRuleEngine(
    bootstrap,
    uiStateMapper,
    recognition,
    layout,
    navigation,
  );
  await uxRuleEngine.initialize();
  return {
    bootstrap,
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    uxRuleEngine,
  };
}

async function primeUpstream(engines: Awaited<ReturnType<typeof buildPipeline>>) {
  const uiState = engines.uiStateMapper.processFrame(buildTestFrame(1));
  const recognitionResult = engines.recognition.recognizeUiState(uiState!);
  const layoutModel = engines.layout.analyzeRecognition(recognitionResult!);
  engines.navigation.mapLayout(layoutModel!);
}

describe("T2-01 UX Rule Engine", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    resetLayoutUnderstandingForTesting();
    resetNavigationMappingForTesting();
    resetUxRuleEngineForTesting();
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

  test("buildUxRuleEngineConfiguration loads defaults", () => {
    const config = buildUxRuleEngineConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.ruleSourceLocation, "config/ux-rules.json");
    assert.deepEqual(config.ruleCategories, [...RULE_CATEGORIES]);
    assert.ok(config.ruleSeverityLevels.length >= 4);
    assert.ok(config.ruleTargetTypes.length === 4);
  });

  test("UX rule engine initializes with doctrine doc and loads rules", async () => {
    const { uxRuleEngine, visualCapture } = await buildPipeline();
    const state = uxRuleEngine.getState();
    assert.equal(state.engineVersion, "PILLOW-URE-001");
    assert.equal(state.missionId, "T2-01");
    assert.ok(state.rulesLoaded >= DEFAULT_UX_RULES.length);
    assert.ok(state.rulesEnabled >= DEFAULT_UX_RULES.length);
    visualCapture.stopCapture();
  });

  test("runValidation evaluates UI state, component, layout, and navigation rules", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.uxRuleEngine.runValidation();
    assert.ok(report.validationReportId.startsWith("ux-validation-"));
    assert.ok(report.rulesEvaluated >= 8);
    assert.ok(["pass", "fail", "partial"].includes(report.decision));
    assert.equal(report.results.length, report.totalRules);

    const targetTypes = new Set(report.results.map((r) => r.targetType));
    assert.ok(targetTypes.has("ui_state"));
    assert.ok(targetTypes.has("component"));
    assert.ok(targetTypes.has("layout"));
    assert.ok(targetTypes.has("navigation"));

    engines.visualCapture.stopCapture();
  });

  test("produces rule pass/fail results and violation records", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.uxRuleEngine.runValidation();
    const passed = report.results.filter((r) => r.passed && !r.skipped).length;
    const failed = report.results.filter((r) => !r.passed && !r.skipped).length;

    assert.ok(passed + failed === report.rulesEvaluated);
    for (const violation of report.violations) {
      assert.ok(violation.violationId);
      assert.ok(violation.ruleId);
      assert.ok(violation.severity);
      assert.ok(violation.violationDescription);
      assert.ok(violation.metadataVersion);
    }

    engines.visualCapture.stopCapture();
  });

  test("rule enable/disable controls are operational", async () => {
    const engines = await buildPipeline();
    const rules = engines.uxRuleEngine.getRules();
    const target = rules[0]!;
    const initialEnabled = engines.uxRuleEngine.getState().rulesEnabled;

    assert.equal(engines.uxRuleEngine.setRuleEnabled(target.ruleId, false), true);
    assert.equal(engines.uxRuleEngine.getState().rulesEnabled, initialEnabled - 1);

    assert.equal(engines.uxRuleEngine.setRuleEnabled(target.ruleId, true), true);
    assert.equal(engines.uxRuleEngine.getState().rulesEnabled, initialEnabled);

    engines.visualCapture.stopCapture();
  });

  test("handles missing upstream data safely", async () => {
    const engines = await buildPipeline();

    const report = engines.uxRuleEngine.runValidation();
    assert.ok(report.rulesEvaluated >= 1);
    assert.ok(report.warnings.length >= 1);
    assert.ok(["pass", "fail", "partial"].includes(report.decision));

    engines.visualCapture.stopCapture();
  });

  test("supervisor validation reports readiness after validation", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.uxRuleEngine.runValidation();

    const supervisor = engines.uxRuleEngine.validateForSupervisorSync();
    assert.equal(supervisor.valid, true);
    assert.ok(supervisor.readinessScore >= 40);

    engines.visualCapture.stopCapture();
  });

  test("governance doc path is canonical", () => {
    assert.equal(
      UX_RULE_ENGINE_SYSTEM_PATH,
      "docs/governance/EMPIREAI_UX_RULE_ENGINE_SYSTEM.md",
    );
  });
});
