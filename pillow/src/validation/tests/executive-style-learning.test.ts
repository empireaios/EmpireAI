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
  buildExecutiveStyleLearningConfiguration,
  EXECUTIVE_STYLE_LEARNING_SYSTEM_PATH,
  PREFERENCE_CATEGORIES,
} from "../../executive-style-learning-engine/index.js";
import { PreferenceConflictResolver } from "../../executive-style-learning-engine/preference-conflict-resolver.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

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
  return {
    bootstrap,
    visualCapture,
    designSystemIntelligence,
    executiveStyleLearning,
  };
}

describe("T2-03 Executive Style Learning", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    resetLayoutUnderstandingForTesting();
    resetNavigationMappingForTesting();
    resetUxRuleEngineForTesting();
    resetDesignSystemIntelligenceForTesting();
    resetExecutiveStyleLearningForTesting();
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

  test("buildExecutiveStyleLearningConfiguration loads defaults", () => {
    const config = buildExecutiveStyleLearningConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.approvalWeight, 0.15);
    assert.equal(config.rejectionWeight, 0.2);
    assert.equal(config.confidenceThreshold, 0.4);
    assert.equal(config.preferenceCategories.length, PREFERENCE_CATEGORIES.length);
  });

  test("executive style learning initializes with doctrine doc", async () => {
    const { executiveStyleLearning, visualCapture } = await buildPipeline();
    const state = executiveStyleLearning.getState();
    assert.equal(state.engineVersion, "PILLOW-ESL-001");
    assert.equal(state.missionId, "T2-03");
    assert.ok(state.configuration);
    assert.ok(EXECUTIVE_STYLE_LEARNING_SYSTEM_PATH.includes("EXECUTIVE_STYLE_LEARNING"));
    visualCapture.stopCapture();
  });

  test("recordApproval learns active preference", async () => {
    const { executiveStyleLearning, visualCapture } = await buildPipeline();
    const record = executiveStyleLearning.recordApproval({
      category: "layout",
      description: "Prefers sidebar navigation layout",
      value: "sidebar-primary",
      referenceId: "decision-001",
    });
    assert.ok(record);
    assert.equal(record!.preferenceCategory, "layout");
    assert.equal(record!.currentStatus, "active");
    assert.ok(record!.learningConfidence >= 0.4);
    visualCapture.stopCapture();
  });

  test("recordRejection deprecates preference when confidence falls below threshold", async () => {
    const { executiveStyleLearning, visualCapture } = await buildPipeline();
    const record = executiveStyleLearning.recordRejection({
      category: "color",
      description: "Rejects neon accent palette",
      value: "neon-accent",
      referenceId: "decision-002",
    });
    assert.ok(record);
    assert.equal(record!.currentStatus, "deprecated");
    assert.ok(record!.learningConfidence < 0.4);
    visualCapture.stopCapture();
  });

  test("runLearning builds executive style model from approvals", async () => {
    const engines = await buildPipeline();

    engines.executiveStyleLearning.recordApproval({
      category: "typography",
      description: "Prefers Inter for body text",
      value: "inter-body",
      referenceId: "decision-003",
    });
    engines.executiveStyleLearning.recordApproval({
      category: "spacing",
      description: "Prefers generous section spacing",
      value: "section-loose",
      referenceId: "decision-004",
    });

    const report = engines.executiveStyleLearning.runLearning();
    assert.ok(report.learningReportId.startsWith("esl-learning-"));
    assert.ok(report.model.executiveStyleId.startsWith("esl-"));
    assert.ok(report.model.preferredTypography.includes("inter-body"));
    assert.ok(report.model.preferredSpacingPreferences.includes("section-loose"));
    assert.ok(report.model.confidenceScore > 0);
    assert.ok(["pass", "partial"].includes(report.validation.decision));

    const model = engines.executiveStyleLearning.getLatestModel();
    assert.ok(model);
    assert.equal(model!.preferenceModelVersion, "1.0.1");
    engines.visualCapture.stopCapture();
  });

  test("preference conflict resolver favors higher-confidence approval", () => {
    const resolver = new PreferenceConflictResolver();
    const { resolved, conflictsResolved } = resolver.resolve([
      {
        preferenceId: "pref-a",
        preferenceCategory: "layout",
        preferenceDescription: "Sidebar layout approved",
        preferenceValue: "sidebar-primary",
        sourceReference: "approval-dec-1",
        learningConfidence: 0.7,
        firstObservedTimestamp: new Date().toISOString(),
        lastUpdatedTimestamp: new Date().toISOString(),
        currentStatus: "active",
        version: "1.0.0",
        metadataVersion: "1.0.0",
      },
      {
        preferenceId: "pref-b",
        preferenceCategory: "layout",
        preferenceDescription: "Sidebar layout rejected",
        preferenceValue: "sidebar-primary",
        sourceReference: "rejection-dec-2",
        learningConfidence: 0.3,
        firstObservedTimestamp: new Date().toISOString(),
        lastUpdatedTimestamp: new Date().toISOString(),
        currentStatus: "deprecated",
        version: "1.0.0",
        metadataVersion: "1.0.0",
      },
    ]);
    assert.equal(conflictsResolved, 1);
    assert.equal(resolved.length, 1);
    assert.equal(resolved[0]!.sourceReference, "approval-dec-1");
  });

  test("validateForSupervisorSync reports readiness after learning", async () => {
    const engines = await buildPipeline();
    engines.executiveStyleLearning.recordApproval({
      category: "dashboard",
      description: "Prefers metric-first dashboard",
      value: "metrics-first",
      referenceId: "decision-005",
    });
    engines.executiveStyleLearning.runLearning();
    const sync = engines.executiveStyleLearning.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    assert.ok(sync.notes.some((n) => n.includes("Preferences learned")));
    engines.visualCapture.stopCapture();
  });

  test("cockpit snapshot exposes learning status", async () => {
    const engines = await buildPipeline();
    engines.executiveStyleLearning.recordApproval({
      category: "navigation",
      description: "Prefers top navigation",
      value: "top-nav",
      referenceId: "decision-006",
    });
    engines.executiveStyleLearning.runLearning();
    const cockpit = engines.executiveStyleLearning.getCockpitSnapshot();
    assert.equal(cockpit.totalApprovals, 1);
    assert.ok(cockpit.preferencesLearned >= 1);
    assert.ok(cockpit.preferenceModelVersion);
    engines.visualCapture.stopCapture();
  });
});
