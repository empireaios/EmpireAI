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
} from "../../explain-decisions/index.js";
import {
  createApprovalWorkflow,
  resetApprovalWorkflowForTesting,
} from "../../approval-workflow/index.js";
import {
  createPreferenceLearning,
  resetPreferenceLearningForTesting,
} from "../../preference-learning/index.js";
import {
  createContinuousCollaboration,
  resetContinuousCollaborationForTesting,
} from "../../continuous-collaboration/index.js";
import {
  createExecutiveCollaborationCertificationEngine,
  resetExecutiveCollaborationCertificationForTesting,
} from "../../executive-collaboration-certification-engine/index.js";
import {
  createContinuousScreenObservationEngine,
  resetContinuousScreenObservationForTesting,
} from "../../continuous-screen-observation-engine/index.js";
import {
  createAutonomousUxAuditEngine,
  resetAutonomousUxAuditForTesting,
} from "../../autonomous-ux-audit-engine/index.js";
import {
  createUxOpportunityDiscoveryEngine,
  resetUxOpportunityDiscoveryForTesting,
} from "../../ux-opportunity-discovery-engine/index.js";
import {
  createProductivityIntelligenceEngine,
  resetProductivityIntelligenceForTesting,
} from "../../productivity-intelligence-engine/index.js";
import {
  createWorkflowEvolutionEngine,
  resetWorkflowEvolutionForTesting,
} from "../../workflow-evolution-engine/index.js";
import {
  createAdaptiveInterfaceEngine,
  resetAdaptiveInterfaceForTesting,
} from "../../adaptive-interface-engine/index.js";
import {
  createContinuousUxEvolutionEngine,
  resetContinuousUxEvolutionForTesting,
} from "../../continuous-ux-evolution-engine/index.js";
import {
  createExecutiveWorkspaceIntelligenceEngine,
  resetExecutiveWorkspaceIntelligenceForTesting,
  buildExecutiveWorkspaceIntelligenceConfiguration,
  EXECUTIVE_WORKSPACE_INTELLIGENCE_SYSTEM_PATH,
  WORKSPACE_CATEGORIES,
} from "../../executive-workspace-intelligence-engine/index.js";
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
    { autoStart: false, configuration: { eventDebounceMs: 0 } },
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
  const approvalWorkflow = createApprovalWorkflow(
    bootstrap,
    multiProposalGenerator,
    sideBySideComparison,
    explainDecisions,
    autonomousBuilderCertification,
  );
  await approvalWorkflow.initialize();
  const preferenceLearning = createPreferenceLearning(
    bootstrap,
    approvalWorkflow,
    explainDecisions,
    multiProposalGenerator,
    naturalUxConversation,
    voiceUxCommands,
    screenAnnotation,
    sideBySideComparison,
  );
  await preferenceLearning.initialize();
  const continuousCollaboration = createContinuousCollaboration(
    bootstrap,
    naturalUxConversation,
    voiceUxCommands,
    screenAnnotation,
    multiProposalGenerator,
    sideBySideComparison,
    explainDecisions,
    approvalWorkflow,
    preferenceLearning,
  );
  await continuousCollaboration.initialize();
  const executiveCollaborationCertification = createExecutiveCollaborationCertificationEngine(
    bootstrap,
    naturalUxConversation,
    voiceUxCommands,
    screenAnnotation,
    multiProposalGenerator,
    sideBySideComparison,
    explainDecisions,
    approvalWorkflow,
    preferenceLearning,
    continuousCollaboration,
    autonomousBuilderCertification,
    {
      configuration: {
        reportOutputRoot: ".pillow-executive-collaboration-certification-test",
        requiredPassThreshold: 40,
      },
    },
  );
  await executiveCollaborationCertification.initialize();
  const continuousScreenObservation = createContinuousScreenObservationEngine(
    bootstrap,
    visualCapture,
    uiStateMapper,
    recognition,
    layout,
    navigation,
    tracking,
    contextAwareness,
    uxScoring,
    frontendBuilder,
    continuousCollaboration,
    executiveCollaborationCertification,
    {
      configuration: {
        continuousObservationEnabled: false,
        observationFrequencyMs: 5000,
      },
    },
  );
  await continuousScreenObservation.initialize();
  const autonomousUxAudit = createAutonomousUxAuditEngine(
    bootstrap,
    continuousScreenObservation,
    uxRuleEngine,
    designSystemIntelligence,
    accessibilityIntelligence,
    visualConsistency,
    layoutEvaluation,
    workflowOptimization,
    {
      configuration: {
        continuousAuditEnabled: false,
        auditFrequencyMs: 5000,
      },
    },
  );
  await autonomousUxAudit.initialize();
  const uxOpportunityDiscovery = createUxOpportunityDiscoveryEngine(
    bootstrap,
    autonomousUxAudit,
    continuousScreenObservation,
    uxScoring,
    recommendationEngine,
    continuousCollaboration,
    uxRuleEngine,
    designSystemIntelligence,
    accessibilityIntelligence,
    visualConsistency,
    {
      configuration: {
        continuousDiscoveryEnabled: false,
        discoveryFrequencyMs: 8000,
      },
    },
  );
  await uxOpportunityDiscovery.initialize();
  const productivityIntelligence = createProductivityIntelligenceEngine(
    bootstrap,
    uxOpportunityDiscovery,
    autonomousUxAudit,
    continuousScreenObservation,
    tracking,
    contextAwareness,
    workflowOptimization,
    uxScoring,
    continuousCollaboration,
    {
      configuration: {
        continuousLearningEnabled: false,
        learningFrequencyMs: 10000,
      },
    },
  );
  await productivityIntelligence.initialize();
  const workflowEvolution = createWorkflowEvolutionEngine(
    bootstrap,
    productivityIntelligence,
    uxOpportunityDiscovery,
    autonomousUxAudit,
    continuousScreenObservation,
    {
      configuration: {
        continuousEvolutionEnabled: false,
        analysisFrequencyMs: 12000,
      },
    },
  );
  await workflowEvolution.initialize();
  const adaptiveInterface = createAdaptiveInterfaceEngine(
    bootstrap,
    workflowEvolution,
    productivityIntelligence,
    uxOpportunityDiscovery,
    autonomousUxAudit,
    continuousScreenObservation,
    contextAwareness,
    tracking,
    {
      configuration: {
        continuousAdaptationEnabled: false,
        contextDetectionFrequencyMs: 15000,
      },
    },
  );
  await adaptiveInterface.initialize();
  const continuousUxEvolution = createContinuousUxEvolutionEngine(
    bootstrap,
    adaptiveInterface,
    workflowEvolution,
    productivityIntelligence,
    uxOpportunityDiscovery,
    autonomousUxAudit,
    continuousScreenObservation,
    {
      configuration: {
        continuousEvolutionEnabled: false,
        evolutionFrequencyMs: 18000,
      },
    },
  );
  await continuousUxEvolution.initialize();
  const executiveWorkspaceIntelligence = createExecutiveWorkspaceIntelligenceEngine(
    bootstrap,
    continuousUxEvolution,
    adaptiveInterface,
    workflowEvolution,
    productivityIntelligence,
    uxOpportunityDiscovery,
    autonomousUxAudit,
    continuousScreenObservation,
    {
      configuration: {
        continuousOptimizationEnabled: false,
        workspaceOptimizationFrequencyMs: 20000,
      },
    },
  );
  await executiveWorkspaceIntelligence.initialize();
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
    autonomousBuilderCertification,
    multiProposalGenerator,
    sideBySideComparison,
    explainDecisions,
    approvalWorkflow,
    preferenceLearning,
    continuousCollaboration,
    executiveCollaborationCertification,
    continuousScreenObservation,
    autonomousUxAudit,
    tracking,
    contextAwareness,
    workflowOptimization,
    uxOpportunityDiscovery,
    productivityIntelligence,
    workflowEvolution,
    adaptiveInterface,
    continuousUxEvolution,
    executiveWorkspaceIntelligence,
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
  engines.continuousScreenObservation.observe({
    uiSnapshot: {
      screenId: "screen-audit",
      routeOrViewId: "/audit",
      surfaceStates: ["loading"],
    },
  });
  engines.autonomousUxAudit.audit();
  engines.uxOpportunityDiscovery.discover();
  for (let i = 0; i < 4; i++) {
    engines.tracking.recordInteraction({
      interactionType: "click",
      pointerX: 100 + i,
      pointerY: 200,
      componentId: "btn-submit",
    });
  }
  engines.contextAwareness.analyzeContextNow();
  engines.productivityIntelligence.learn();
  engines.workflowEvolution.evolve();
  engines.adaptiveInterface.adapt();
  engines.continuousUxEvolution.optimize();
}

describe("T5-08 Executive Workspace Intelligence", () => {
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
    resetApprovalWorkflowForTesting();
    resetPreferenceLearningForTesting();
    resetContinuousCollaborationForTesting();
    resetExecutiveCollaborationCertificationForTesting();
    resetContinuousScreenObservationForTesting();
    resetAutonomousUxAuditForTesting();
    resetUxOpportunityDiscoveryForTesting();
    resetProductivityIntelligenceForTesting();
    resetWorkflowEvolutionForTesting();
    resetAdaptiveInterfaceForTesting();
    resetContinuousUxEvolutionForTesting();
    resetExecutiveWorkspaceIntelligenceForTesting();
    process.env.VISUAL_CAPTURE_AUTO_START = "false";
    process.env.UI_STATE_MAPPER_AUTO_START = "false";
  });

  afterEach(() => {
    delete process.env.VISUAL_CAPTURE_AUTO_START;
    delete process.env.UI_STATE_MAPPER_AUTO_START;
  });

  test("buildExecutiveWorkspaceIntelligenceConfiguration loads defaults", () => {
    const config = buildExecutiveWorkspaceIntelligenceConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.recommendOnlyMode, true);
    assert.equal(config.dashboardRecommendationRulesEnabled, true);
    assert.ok(WORKSPACE_CATEGORIES.includes("mission_dashboard"));
  });

  test("executive workspace intelligence initializes with doctrine doc", async () => {
    const engines = await buildPipeline();
    const state = engines.executiveWorkspaceIntelligence.getState();
    assert.equal(state.engineVersion, "PILLOW-EWI-001");
    assert.equal(state.missionId, "T5-08");
    assert.ok(EXECUTIVE_WORKSPACE_INTELLIGENCE_SYSTEM_PATH.includes("EXECUTIVE_WORKSPACE"));
    engines.visualCapture.stopCapture();
  });

  test("optimizeWorkspace produces machine-readable workspace intelligence records", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = engines.executiveWorkspaceIntelligence.optimizeWorkspace();
    if (report.validation.decision === "fail") {
      assert.fail(`validation failed: ${report.validation.errors.join("; ")}`);
    }
    assert.ok(report.workspaceRunReportId.startsWith("ewi-run-"));
    assert.ok(report.records.length > 0, `expected records, got ${report.records.length}`);
    for (const record of report.records) {
      assert.equal(record.recommendOnly, true);
      assert.ok(record.workspaceIntelligenceId.startsWith("ewi-"));
      assert.ok(record.metadataVersion);
      assert.ok(record.activeMissionContext);
      assert.ok(record.expectedProductivityBenefit);
      assert.ok(record.recommendedDashboardLayout.length > 0);
      assert.ok(record.recommendedWidgets.length > 0);
    }
    engines.visualCapture.stopCapture();
  });

  test("generates mission-specific dashboard recommendations", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = engines.executiveWorkspaceIntelligence.optimizeWorkspace();
    assert.ok(
      report.records.some(
        (r) =>
          r.workspaceCategory === "mission_dashboard" ||
          r.workspaceCategory === "executive_dashboard" ||
          r.workspaceCategory === "workflow_dashboard",
      ),
    );
    engines.visualCapture.stopCapture();
  });

  test("recommends workspace layouts", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = engines.executiveWorkspaceIntelligence.optimizeWorkspace();
    assert.ok(
      report.records.some(
        (r) =>
          r.workspaceCategory === "workspace_layout_optimization" ||
          r.workspaceCategory === "priority_based_workspace" ||
          r.recommendedWorkspaceConfiguration.length > 0,
      ),
    );
    engines.visualCapture.stopCapture();
  });

  test("recommends executive widgets and shortcuts", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = engines.executiveWorkspaceIntelligence.optimizeWorkspace();
    assert.ok(report.records.some((r) => r.recommendedWidgets.length > 0));
    assert.ok(
      report.records.some(
        (r) =>
          r.recommendedShortcuts.length > 0 ||
          r.workspaceCategory === "executive_shortcut_organization",
      ),
    );
    engines.visualCapture.stopCapture();
  });

  test("never applies workspace changes automatically (recommend-only)", async () => {
    const engines = await buildPipeline();
    const report = engines.executiveWorkspaceIntelligence.optimizeWorkspace();
    for (const record of report.records) {
      assert.equal(record.recommendOnly, true);
    }
    engines.visualCapture.stopCapture();
  });

  test("start and stop continuous optimization toggles monitoring state", async () => {
    const engines = await buildPipeline();
    const started = engines.executiveWorkspaceIntelligence.startContinuousOptimization();
    assert.equal(started.health.continuousOptimizationActive, true);
    const stopped = engines.executiveWorkspaceIntelligence.stopContinuousOptimization();
    assert.equal(stopped.health.continuousOptimizationActive, false);
    engines.visualCapture.stopCapture();
  });

  test("validateForSupervisorSync reports readiness after optimization", async () => {
    const engines = await buildPipeline();
    engines.executiveWorkspaceIntelligence.optimizeWorkspace();
    const sync = engines.executiveWorkspaceIntelligence.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    engines.visualCapture.stopCapture();
  });

  test("cockpit snapshot exposes workspace intelligence health", async () => {
    const engines = await buildPipeline();
    engines.executiveWorkspaceIntelligence.optimizeWorkspace();
    const cockpit = engines.executiveWorkspaceIntelligence.getCockpitSnapshot();
    assert.ok(cockpit.totalOptimizationCycles >= 1);
    assert.ok(cockpit.engineStatus);
    engines.visualCapture.stopCapture();
  });

  test("getLatestReport returns most recent optimization run", async () => {
    const engines = await buildPipeline();
    const report = engines.executiveWorkspaceIntelligence.optimizeWorkspace();
    const latest = engines.executiveWorkspaceIntelligence.getLatestReport();
    assert.equal(latest?.workspaceRunReportId, report.workspaceRunReportId);
    engines.visualCapture.stopCapture();
  });

  test("understands executive priorities and mission context", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = engines.executiveWorkspaceIntelligence.optimizeWorkspace();
    assert.ok(
      report.records.some(
        (r) => r.executivePriorities.length > 0 && r.activeMissionContext.includes("T5-08"),
      ),
    );
    engines.visualCapture.stopCapture();
  });
});
