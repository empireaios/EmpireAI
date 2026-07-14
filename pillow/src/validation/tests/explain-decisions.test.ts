import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach, afterEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

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
} from "../../layout-evaluation-engine/index.js";
import {
  createWorkflowOptimizationEngine,
  resetWorkflowOptimizationForTesting,
} from "../../workflow-optimization-engine/index.js";
import {
  createAccessibilityIntelligenceEngine,
  resetAccessibilityIntelligenceForTesting,
} from "../../accessibility-intelligence-engine/index.js";
import {
  createVisualConsistencyEngine,
  resetVisualConsistencyForTesting,
} from "../../visual-consistency-engine/index.js";
import {
  createUxScoringEngine,
  resetUxScoringForTesting,
} from "../../ux-scoring-engine/index.js";
import {
  createRecommendationEngine,
  resetRecommendationEngineForTesting,
} from "../../recommendation-engine/index.js";
import {
  createUxIntelligenceCertificationEngine,
  resetUxIntelligenceCertificationForTesting,
} from "../../ux-intelligence-certification-engine/index.js";
import {
  createFrontendBuilder,
  resetFrontendBuilderForTesting,
} from "../../frontend-builder/index.js";
import {
  createComponentGenerator,
  resetComponentGeneratorForTesting,
} from "../../component-generator/index.js";
import {
  createLayoutRefactoringEngine,
  resetLayoutRefactoringForTesting,
} from "../../layout-refactoring/index.js";
import {
  createThemeBuilder,
  resetThemeBuilderForTesting,
} from "../../theme-builder/index.js";
import {
  createPreviewGenerator,
  resetPreviewGeneratorForTesting,
} from "../../preview-generator/index.js";
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
} from "../../visual-foundation-certification-engine/index.js";
import {
  createValidationEngine,
  resetValidationEngineForTesting,
} from "../../validation-engine/index.js";
import {
  createRegressionProtectionEngine,
  resetRegressionProtectionForTesting,
} from "../../regression-protection/index.js";
import {
  createRollbackManager,
  resetRollbackManagerForTesting,
} from "../../rollback-manager/index.js";
import {
  createChangeDocumentation,
  resetChangeDocumentationForTesting,
} from "../../change-documentation/index.js";
import {
  createAutonomousBuilderCertificationEngine,
  resetAutonomousBuilderCertificationForTesting,
} from "../../autonomous-builder-certification-engine/index.js";
import {
  createNaturalUxConversation,
  resetNaturalUxConversationForTesting,
} from "../../natural-ux-conversation/index.js";
import {
  createVoiceUxCommands,
  resetVoiceUxCommandsForTesting,
} from "../../voice-ux-commands/index.js";
import {
  createScreenAnnotation,
  resetScreenAnnotationForTesting,
} from "../../screen-annotation/index.js";
import {
  createMultiProposalGenerator,
  resetMultiProposalGeneratorForTesting,
} from "../../multi-proposal-generator/index.js";
import {
  createSideBySideComparison,
  resetSideBySideComparisonForTesting,
} from "../../side-by-side-comparison/index.js";
import {
  createExplainDecisions,
  resetExplainDecisionsForTesting,
  buildExplainDecisionsConfiguration,
  EXPLAIN_DECISIONS_SYSTEM_PATH,
  EXPLANATION_TYPES,
} from "../../explain-decisions/index.js";
import { buildCaptureFrameMetadata } from "../../visual-capture-engine/capture-metadata-generator.js";

const MINIMAL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function buildTestFrame(frameNumber: number) {
  const metadata = buildCaptureFrameMetadata({
    sessionId: "abc-test-session",
    frameNumber,
    windowId: "win-abc",
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
    { autoStart: false },
  );
  await tracking.initialize();
  const contextAwareness = createContextAwarenessEngine(
    bootstrap,
    tracking,
    navigation,
    layout,
    recognition,
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
  const visualFoundation = createVisualFoundationCertificationEngine(
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
        reportOutputRoot: ".pillow-side-by-side-comparison-test",
        requiredPassThreshold: 50,
      },
    },
  );
  await visualFoundation.initialize();
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
  const workflowOptimization = createWorkflowOptimizationEngine(
    bootstrap,
    contextAwareness,
    tracking,
    navigation,
    layoutEvaluation,
  );
  await workflowOptimization.initialize();
  const accessibilityIntelligence = createAccessibilityIntelligenceEngine(
    bootstrap,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    tracking,
    contextAwareness,
    workflowOptimization,
  );
  await accessibilityIntelligence.initialize();
  const visualConsistency = createVisualConsistencyEngine(
    bootstrap,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    accessibilityIntelligence,
  );
  await visualConsistency.initialize();
  const uxScoring = createUxScoringEngine(
    bootstrap,
    uiStateMapper,
    navigation,
    uxRuleEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    workflowOptimization,
    accessibilityIntelligence,
    visualConsistency,
  );
  await uxScoring.initialize();
  const recommendationEngine = createRecommendationEngine(
    bootstrap,
    uiStateMapper,
    navigation,
    uxRuleEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    workflowOptimization,
    accessibilityIntelligence,
    visualConsistency,
    uxScoring,
  );
  await recommendationEngine.initialize();
  const certification = createUxIntelligenceCertificationEngine(
    bootstrap,
    uxRuleEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    workflowOptimization,
    accessibilityIntelligence,
    visualConsistency,
    uxScoring,
    recommendationEngine,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    tracking,
    null,
  );
  await certification.initialize();
  const frontendBuilder = createFrontendBuilder(
    bootstrap,
    uiStateMapper,
    navigation,
    designSystemIntelligence,
    executiveStyleLearning,
    uxScoring,
    recommendationEngine,
    certification,
  );
  await frontendBuilder.initialize();
  const componentGenerator = createComponentGenerator(
    bootstrap,
    recommendationEngine,
    frontendBuilder,
    designSystemIntelligence,
    executiveStyleLearning,
  );
  await componentGenerator.initialize();
  const layoutRefactoring = createLayoutRefactoringEngine(
    bootstrap,
    recommendationEngine,
    uxScoring,
    layoutEvaluation,
    workflowOptimization,
    designSystemIntelligence,
    executiveStyleLearning,
    frontendBuilder,
    componentGenerator,
    layout,
  );
  await layoutRefactoring.initialize();
  const themeBuilder = createThemeBuilder(
    bootstrap,
    recommendationEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
  );
  await themeBuilder.initialize();
  const previewGenerator = createPreviewGenerator(
    bootstrap,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
  );
  await previewGenerator.initialize();
  const validationEngine = createValidationEngine(
    bootstrap,
    previewGenerator,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
  );
  await validationEngine.initialize();
  const regressionProtection = createRegressionProtectionEngine(
    bootstrap,
    validationEngine,
    previewGenerator,
    frontendBuilder,
    componentGenerator,
    uxScoring,
    recommendationEngine,
    layout,
    navigation,
    visualFoundation,
  );
  await regressionProtection.initialize();
  const rollbackManager = createRollbackManager(
    bootstrap,
    regressionProtection,
    validationEngine,
    previewGenerator,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
  );
  await rollbackManager.initialize();
  const changeDocumentation = createChangeDocumentation(
    bootstrap,
    rollbackManager,
    regressionProtection,
    validationEngine,
    previewGenerator,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
  );
  await changeDocumentation.initialize();
  const autonomousBuilderCertification = createAutonomousBuilderCertificationEngine(
    bootstrap,
    certification,
    recommendationEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
    previewGenerator,
    validationEngine,
    regressionProtection,
    rollbackManager,
    changeDocumentation,
  );
  await autonomousBuilderCertification.initialize();
  const naturalUxConversation = createNaturalUxConversation(
    bootstrap,
    autonomousBuilderCertification,
    certification,
    recommendationEngine,
    frontendBuilder,
  );
  await naturalUxConversation.initialize();
  const voiceUxCommands = createVoiceUxCommands(
    bootstrap,
    naturalUxConversation,
    uiStateMapper,
    recommendationEngine,
    autonomousBuilderCertification,
  );
  await voiceUxCommands.initialize();
  const screenAnnotation = createScreenAnnotation(
    bootstrap,
    naturalUxConversation,
    voiceUxCommands,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    recommendationEngine,
    autonomousBuilderCertification,
  );
  await screenAnnotation.initialize();
  const multiProposalGenerator = createMultiProposalGenerator(
    bootstrap,
    naturalUxConversation,
    voiceUxCommands,
    screenAnnotation,
    uiStateMapper,
    recommendationEngine,
    autonomousBuilderCertification,
  );
  await multiProposalGenerator.initialize();
  const sideBySideComparison = createSideBySideComparison(
    bootstrap,
    multiProposalGenerator,
    previewGenerator,
    validationEngine,
    uxScoring,
    uiStateMapper,
  );
  await sideBySideComparison.initialize();
  const explainDecisions = createExplainDecisions(
    bootstrap,
    multiProposalGenerator,
    sideBySideComparison,
    uxScoring,
    recommendationEngine,
    previewGenerator,
    validationEngine,
  );
  await explainDecisions.initialize();
  return {
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    uxRuleEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    workflowOptimization,
    accessibilityIntelligence,
    visualConsistency,
    uxScoring,
    recommendationEngine,
    certification,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
    previewGenerator,
    validationEngine,
    regressionProtection,
    multiProposalGenerator,
    sideBySideComparison,
    explainDecisions,
  };
}

async function primeUpstream(engines: Awaited<ReturnType<typeof buildPipeline>>) {
  const uiState = engines.uiStateMapper.processFrame(buildTestFrame(1));
  const recognitionResult = engines.recognition.recognizeUiState(uiState!);
  const layoutModel = engines.layout.analyzeRecognition(recognitionResult!);
  engines.navigation.mapLayout(layoutModel!);
  engines.uxRuleEngine.runValidation();
  engines.designSystemIntelligence.runAnalysis();
  engines.executiveStyleLearning.runLearning();
  engines.layoutEvaluation.runEvaluation();
  engines.workflowOptimization.runAnalysis();
  engines.accessibilityIntelligence.runReview();
  engines.visualConsistency.runReview();
  engines.uxScoring.runScoring();
  engines.recommendationEngine.generateRecommendations();
  engines.certification.runCertification();
  engines.frontendBuilder.generateFrontendCode();
  engines.componentGenerator.generateComponents();
  engines.layoutRefactoring.refactorLayouts();
  engines.themeBuilder.generateThemes();
  engines.previewGenerator.generatePreviews();
  engines.validationEngine.validateUi();
  engines.regressionProtection.checkRegressions();
}

describe("T4-06 Explain Decisions", () => {
  beforeEach(() => {
    resetVisualCaptureEngineForTesting();
    resetUiStateMapperForTesting();
    resetComponentRecognitionForTesting();
    resetLayoutUnderstandingForTesting();
    resetNavigationMappingForTesting();
    resetInteractionTrackingForTesting();
    resetContextAwarenessForTesting();
    resetUxRuleEngineForTesting();
    resetDesignSystemIntelligenceForTesting();
    resetExecutiveStyleLearningForTesting();
    resetLayoutEvaluationForTesting();
    resetWorkflowOptimizationForTesting();
    resetAccessibilityIntelligenceForTesting();
    resetVisualConsistencyForTesting();
    resetUxScoringForTesting();
    resetRecommendationEngineForTesting();
    resetUxIntelligenceCertificationForTesting();
    resetFrontendBuilderForTesting();
    resetComponentGeneratorForTesting();
    resetLayoutRefactoringForTesting();
    resetThemeBuilderForTesting();
    resetPreviewGeneratorForTesting();
    resetValidationEngineForTesting();
    resetVisualMemoryForTesting();
    resetSessionContinuityForTesting();
    resetVisualFoundationCertificationForTesting();
    resetRegressionProtectionForTesting();
    resetRollbackManagerForTesting();
    resetChangeDocumentationForTesting();
    resetAutonomousBuilderCertificationForTesting();
    resetNaturalUxConversationForTesting();
    resetVoiceUxCommandsForTesting();
    resetScreenAnnotationForTesting();
    resetMultiProposalGeneratorForTesting();
    resetSideBySideComparisonForTesting();
    resetExplainDecisionsForTesting();
    process.env.VISUAL_CAPTURE_AUTO_START = "false";
    process.env.UI_STATE_MAPPER_AUTO_START = "false";
  });

  afterEach(() => {
    delete process.env.VISUAL_CAPTURE_AUTO_START;
    delete process.env.UI_STATE_MAPPER_AUTO_START;
  });

  test("buildExplainDecisionsConfiguration loads defaults", () => {
    const config = buildExplainDecisionsConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.explanationDetailLevel, "standard");
    assert.equal(config.supportedExplanationTypes.length, EXPLANATION_TYPES.length);
  });

  test("explain decisions initializes with doctrine doc", async () => {
    const engines = await buildPipeline();
    const state = engines.explainDecisions.getState();
    assert.equal(state.engineVersion, "PILLOW-ED-001");
    assert.equal(state.missionId, "T4-06");
    assert.ok(EXPLAIN_DECISIONS_SYSTEM_PATH.includes("EXPLAIN_DECISIONS"));
    engines.visualCapture.stopCapture();
  });

  test("explain produces proposal rationale record", async () => {
    const engines = await buildPipeline();
    engines.multiProposalGenerator.generateProposals();
    const report = engines.explainDecisions.explain({
      explanationType: "proposal_rationale",
    });
    assert.ok(report.explanationRunReportId.startsWith("ed-run-"));
    assert.ok(report.explanation.designRationale.length > 0);
    assert.ok(report.explanation.uxBenefitSummary.length > 0);
    assert.notEqual(report.validation.decision, "fail");
    engines.visualCapture.stopCapture();
  });

  test("explain produces comparison rationale with evidence", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    engines.multiProposalGenerator.generateProposals();
    engines.sideBySideComparison.compare({ comparisonType: "original_vs_proposal" });
    const report = engines.explainDecisions.explain({
      explanationType: "comparison_rationale",
    });
    assert.ok(report.explanation.sourceComparisonId);
    assert.ok(report.explanation.evidenceReferences.length >= 1);
    engines.visualCapture.stopCapture();
  });

  test("explain tradeoffs and weak evidence notes", async () => {
    const engines = await buildPipeline();
    engines.multiProposalGenerator.generateProposals();
    const report = engines.explainDecisions.explain({
      explanationType: "tradeoff_explanation",
    });
    assert.ok(report.explanation.tradeoffSummary.length > 0);
    assert.ok(Array.isArray(report.explanation.weakEvidenceNotes));
    engines.visualCapture.stopCapture();
  });

  test("explanation record is machine-readable with metadata", async () => {
    const engines = await buildPipeline();
    engines.multiProposalGenerator.generateProposals();
    const report = engines.explainDecisions.explain({
      explanationType: "layout_rationale",
    });
    const record = report.explanation;
    assert.ok(record.explanationId.startsWith("ed-exp-"));
    assert.ok(record.sourceProposalIds.length > 0);
    assert.ok(record.metadataVersion);
    assert.ok(record.confidenceScore >= 0);
    engines.visualCapture.stopCapture();
  });

  test("validateForSupervisorSync reports readiness after explanation", async () => {
    const engines = await buildPipeline();
    engines.multiProposalGenerator.generateProposals();
    engines.explainDecisions.explain({ explanationType: "proposal_rationale" });
    const sync = engines.explainDecisions.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    engines.visualCapture.stopCapture();
  });

  test("explanation preserves Grand King control without auto-apply", async () => {
    const engines = await buildPipeline();
    engines.multiProposalGenerator.generateProposals();
    const report = engines.explainDecisions.explain({
      explanationType: "proposal_rationale",
    });
    assert.equal(
      report.validation.errors.some((e) => e.includes("apply UX changes")),
      false,
    );
    assert.equal(
      report.validation.errors.some((e) => e.includes("approve changes")),
      false,
    );
    engines.visualCapture.stopCapture();
  });

  test("getLatestReport returns most recent explanation run", async () => {
    const engines = await buildPipeline();
    engines.multiProposalGenerator.generateProposals();
    const report = engines.explainDecisions.explain({
      explanationType: "accessibility_rationale",
    });
    const latest = engines.explainDecisions.getLatestReport();
    assert.equal(latest?.explanationRunReportId, report.explanationRunReportId);
    engines.visualCapture.stopCapture();
  });
});
