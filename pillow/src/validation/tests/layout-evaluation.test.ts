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
} from "../../design-system-intelligence-engine/index.js";
import {
  createExecutiveStyleLearningEngine,
  resetExecutiveStyleLearningForTesting,
} from "../../executive-style-learning-engine/index.js";
import {
  createLayoutEvaluationEngine,
  resetLayoutEvaluationForTesting,
  buildLayoutEvaluationConfiguration,
  LAYOUT_EVALUATION_SYSTEM_PATH,
  EVALUATION_CATEGORIES,
} from "../../layout-evaluation-engine/index.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "lev-test-session",
    frameNumber,
    windowId: "win-lev",
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
  const executiveStyleLearning = createExecutiveStyleLearningEngine(
    bootstrap,
    designSystemIntelligence,
  );
  await executiveStyleLearning.initialize();
  const layoutEvaluation = createLayoutEvaluationEngine(
    bootstrap,
    layout,
    recognition,
    navigation,
    designSystemIntelligence,
    executiveStyleLearning,
    uxRuleEngine,
  );
  await layoutEvaluation.initialize();
  return {
    bootstrap,
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    uxRuleEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
  };
}

async function primeUpstream(engines: Awaited<ReturnType<typeof buildPipeline>>) {
  const uiState = engines.uiStateMapper.processFrame(buildTestFrame(1));
  const recognitionResult = engines.recognition.recognizeUiState(uiState!);
  const layoutModel = engines.layout.analyzeRecognition(recognitionResult!);
  engines.navigation.mapLayout(layoutModel!);
  engines.designSystemIntelligence.runAnalysis();
  engines.executiveStyleLearning.recordApproval({
    category: "layout",
    description: "Prefers structured sidebar layout",
    value: "sidebar-primary",
    referenceId: "lev-pref-001",
  });
  engines.executiveStyleLearning.runLearning();
}

describe("T2-04 Layout Evaluation", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    resetLayoutUnderstandingForTesting();
    resetNavigationMappingForTesting();
    resetUxRuleEngineForTesting();
    resetDesignSystemIntelligenceForTesting();
    resetExecutiveStyleLearningForTesting();
    resetLayoutEvaluationForTesting();
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

  test("buildLayoutEvaluationConfiguration loads defaults", () => {
    const config = buildLayoutEvaluationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.evaluationFrequency, "on_demand");
    assert.equal(config.ruleValidationEnabled, true);
    assert.equal(config.evaluationCategories.length, EVALUATION_CATEGORIES.length);
  });

  test("layout evaluation initializes with doctrine doc", async () => {
    const { layoutEvaluation, visualCapture } = await buildPipeline();
    const state = layoutEvaluation.getState();
    assert.equal(state.engineVersion, "PILLOW-LEV-001");
    assert.equal(state.missionId, "T2-04");
    assert.ok(state.configuration);
    assert.ok(LAYOUT_EVALUATION_SYSTEM_PATH.includes("LAYOUT_EVALUATION"));
    visualCapture.stopCapture();
  });

  test("runEvaluation produces machine-readable report from upstream data", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.layoutEvaluation.runEvaluation();
    assert.ok(report.evaluationReportId.startsWith("lev-report-"));
    assert.ok(report.model.evaluationId.startsWith("lev-eval-"));
    assert.ok(report.model.sourceLayoutId);
    assert.ok(["pass", "partial", "fail"].includes(report.model.overallEvaluationStatus));
    assert.ok(
      report.model.layoutStrengths.length + report.model.layoutWeaknesses.length > 0 ||
        report.model.overallEvaluationStatus === "skipped",
    );
    assert.ok(["pass", "partial", "fail"].includes(report.validation.decision));

    const model = engines.layoutEvaluation.getLatestModel();
    assert.ok(model);
    assert.ok(model!.evidenceReferences.length >= 0);
    engines.visualCapture.stopCapture();
  });

  test("runEvaluation detects layout strengths and weaknesses", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.layoutEvaluation.runEvaluation();
    const totalFindings =
      report.model.layoutStrengths.length + report.model.layoutWeaknesses.length;
    assert.ok(totalFindings > 0, "Expected at least one strength or weakness finding");
    engines.visualCapture.stopCapture();
  });

  test("runEvaluation validates against UX rules and design system", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);

    const report = engines.layoutEvaluation.runEvaluation();
    assert.ok(Array.isArray(report.model.ruleViolations));
    assert.ok(Array.isArray(report.model.designSystemDeviations));
    assert.ok(Array.isArray(report.model.executivePreferenceDeviations));
    engines.visualCapture.stopCapture();
  });

  test("validateForSupervisorSync reports readiness after evaluation", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.layoutEvaluation.runEvaluation();

    const sync = engines.layoutEvaluation.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    assert.ok(sync.notes.some((n) => n.includes("Evaluations completed")));
    engines.visualCapture.stopCapture();
  });

  test("cockpit snapshot exposes evaluation status", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.layoutEvaluation.runEvaluation();

    const cockpit = engines.layoutEvaluation.getCockpitSnapshot();
    assert.equal(cockpit.totalEvaluations, 1);
    assert.ok(cockpit.lastDecision);
    engines.visualCapture.stopCapture();
  });

  test("handles missing layout data gracefully", async () => {
    const { layoutEvaluation, visualCapture } = await buildPipeline();
    const report = layoutEvaluation.runEvaluation();
    assert.equal(report.model.overallEvaluationStatus, "skipped");
    assert.ok(report.model.layoutWeaknesses.some((w) => w.description.includes("No layout")));
    visualCapture.stopCapture();
  });
});
