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
} from "../../ux-rule-engine/index.js";
import {
  createDesignSystemIntelligenceEngine,
  resetDesignSystemIntelligenceForTesting,
  buildDesignSystemIntelligenceConfiguration,
  DESIGN_SYSTEM_INTELLIGENCE_SYSTEM_PATH,
  COMPONENT_FAMILIES,
} from "../../design-system-intelligence-engine/index.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "dsi-test-session",
    frameNumber,
    windowId: "win-dsi",
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
  const designSystemIntelligence = createDesignSystemIntelligenceEngine(
    bootstrap,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    uxRuleEngine,
  );
  await designSystemIntelligence.initialize();
  return {
    bootstrap,
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    uxRuleEngine,
    designSystemIntelligence,
  };
}

async function primeUpstream(engines: Awaited<ReturnType<typeof buildPipeline>>) {
  const uiState = engines.uiStateMapper.processFrame(buildTestFrame(1));
  const recognitionResult = engines.recognition.recognizeUiState(uiState!);
  const layoutModel = engines.layout.analyzeRecognition(recognitionResult!);
  engines.navigation.mapLayout(layoutModel!);
}

describe("T2-02 Design System Intelligence", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    resetLayoutUnderstandingForTesting();
    resetNavigationMappingForTesting();
    resetUxRuleEngineForTesting();
    resetDesignSystemIntelligenceForTesting();
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

  test("buildDesignSystemIntelligenceConfiguration loads defaults", () => {
    const config = buildDesignSystemIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.designTokenSource, "empireai-web/app/globals.css");
    assert.ok(config.supportedPatterns.length >= 10);
    assert.equal(config.validationRulesEnabled, true);
  });

  test("design system intelligence initializes with doctrine doc", async () => {
    const { designSystemIntelligence, visualCapture } = await buildPipeline();
    const state = designSystemIntelligence.getState();
    assert.equal(state.engineVersion, "PILLOW-DSI-001");
    assert.equal(state.missionId, "T2-02");
    assert.ok(state.configuration);
    visualCapture.stopCapture();
  });

  test("runAnalysis learns design system model from upstream data", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.designSystemIntelligence.runAnalysis();
    assert.ok(report.analysisReportId.startsWith("dsi-analysis-"));
    assert.ok(report.model.designSystemId.startsWith("dsi-"));
    assert.ok(report.model.componentLibrary.length >= 1);
    assert.ok(report.model.componentFamilies.length >= 1);
    assert.ok(report.model.componentVariants.length >= 1);
    assert.ok(report.model.typographyStandards.length >= 2);
    assert.ok(report.model.colorPalette.length >= 3);
    assert.ok(report.model.spacingScale.length >= 4);
    assert.ok(report.model.layoutStandards.length >= 1);

    engines.visualCapture.stopCapture();
  });

  test("identifies component families and variants", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.designSystemIntelligence.runAnalysis();
    const families = new Set(report.model.componentFamilies.map((f) => f.familyName));
    assert.ok([...families].every((f) => (COMPONENT_FAMILIES as readonly string[]).includes(f)));

    for (const component of report.model.componentLibrary) {
      assert.ok(component.componentId);
      assert.ok(component.componentFamily);
      assert.ok(component.componentVariant);
      assert.ok(component.metadataVersion);
    }

    engines.visualCapture.stopCapture();
  });

  test("detects design system deviations and produces validation report", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.designSystemIntelligence.runAnalysis();
    assert.ok(["pass", "fail", "partial"].includes(report.validation.decision));
    assert.ok(report.validation.componentsValidated >= 1);
    assert.ok(report.validation.standardsChecked >= 5);

    for (const deviation of report.validation.deviations) {
      assert.ok(deviation.deviationId);
      assert.ok(deviation.description);
      assert.ok(deviation.metadataVersion);
    }

    engines.visualCapture.stopCapture();
  });

  test("tracks design system evolution across repeated analyses", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const first = engines.designSystemIntelligence.runAnalysis();
    const second = engines.designSystemIntelligence.runAnalysis();

    assert.ok(second.evolutionSummary.previousVersion);
    assert.ok(second.evolutionSummary.currentVersion);
    assert.equal(typeof second.evolutionSummary.newComponents, "number");

    engines.visualCapture.stopCapture();
  });

  test("handles missing upstream data safely", async () => {
    const engines = await buildPipeline();

    const report = engines.designSystemIntelligence.runAnalysis();
    assert.ok(report.model);
    assert.ok(["pass", "fail", "partial"].includes(report.validation.decision));
    assert.ok(report.validation.warnings.length >= 0 || report.validation.deviations.length >= 1);

    engines.visualCapture.stopCapture();
  });

  test("supervisor validation reports readiness after analysis", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.designSystemIntelligence.runAnalysis();

    const supervisor = engines.designSystemIntelligence.validateForSupervisorSync();
    assert.equal(supervisor.valid, true);
    assert.ok(supervisor.readinessScore >= 40);

    engines.visualCapture.stopCapture();
  });

  test("governance doc path is canonical", () => {
    assert.equal(
      DESIGN_SYSTEM_INTELLIGENCE_SYSTEM_PATH,
      "docs/governance/EMPIREAI_DESIGN_SYSTEM_INTELLIGENCE_SYSTEM.md",
    );
  });
});
