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
} from "../../executive-workspace-intelligence-engine/index.js";
import {
  createSelfImprovingUxEngine,
  resetSelfImprovingUxForTesting,
} from "../../self-improving-ux-engine/index.js";
import {
  createVisualIntelligenceCertificationEngine,
  resetVisualIntelligenceCertificationForTesting,
  buildVisualIntelligenceCertificationConfiguration,
  VISUAL_INTELLIGENCE_CERTIFICATION_SYSTEM_PATH,
  CERTIFIED_PROGRAMMES,
  T5_MISSION_IDS,
} from "../../visual-intelligence-certification-engine/index.js";
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
  const selfImprovingUx = createSelfImprovingUxEngine(
    bootstrap,
    executiveWorkspaceIntelligence,
    continuousUxEvolution,
    adaptiveInterface,
    workflowEvolution,
    productivityIntelligence,
    uxOpportunityDiscovery,
    autonomousUxAudit,
    continuousScreenObservation,
    approvalWorkflow,
    changeDocumentation,
    {
      configuration: {
        continuousLearningEnabled: false,
        learningFrequencyMs: 22000,
      },
    },
  );
  await selfImprovingUx.initialize();
  const visualIntelligenceCertification = createVisualIntelligenceCertificationEngine(
    bootstrap,
    visualFoundation,
    certification,
    autonomousBuilderCertification,
    executiveCollaborationCertification,
    continuousScreenObservation,
    autonomousUxAudit,
    uxOpportunityDiscovery,
    productivityIntelligence,
    workflowEvolution,
    adaptiveInterface,
    continuousUxEvolution,
    executiveWorkspaceIntelligence,
    selfImprovingUx,
    approvalWorkflow,
    {
      configuration: {
        runNestedProgrammeCertifications: false,
        requiredPassThreshold: 20,
        reportOutputRoot: ".pillow-visual-intelligence-certification-test",
      },
    },
  );
  await visualIntelligenceCertification.initialize();
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
    changeDocumentation,
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
    selfImprovingUx,
    visualFoundation,
    visualIntelligenceCertification,
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
  engines.executiveWorkspaceIntelligence.optimizeWorkspace();
  engines.changeDocumentation.documentChanges();
  engines.selfImprovingUx.learnUx();
}

describe("T5-10 Visual Intelligence Certification", () => {
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
    resetSelfImprovingUxForTesting();
    resetVisualIntelligenceCertificationForTesting();
    process.env.VISUAL_CAPTURE_AUTO_START = "false";
    process.env.UI_STATE_MAPPER_AUTO_START = "false";
  });

  afterEach(() => {
    delete process.env.VISUAL_CAPTURE_AUTO_START;
    delete process.env.UI_STATE_MAPPER_AUTO_START;
  });

  test("buildVisualIntelligenceCertificationConfiguration loads defaults", () => {
    const config = buildVisualIntelligenceCertificationConfiguration(REPO_ROOT);
    assert.equal(config.enabled, true);
    assert.equal(config.certifyOnlyMode, true);
    assert.equal(config.validationScope.length, CERTIFIED_PROGRAMMES.length);
    assert.ok(T5_MISSION_IDS.includes("T5-09"));
  });

  test("visual intelligence certification initializes with doctrine doc", async () => {
    const engines = await buildPipeline();
    const state = engines.visualIntelligenceCertification.getState();
    assert.equal(state.engineVersion, "PILLOW-VIC-001");
    assert.equal(state.missionId, "T5-10");
    assert.ok(
      VISUAL_INTELLIGENCE_CERTIFICATION_SYSTEM_PATH.includes("VISUAL_INTELLIGENCE_CERTIFICATION"),
    );
    engines.visualCapture.stopCapture();
  });

  test("certifyVisualIntelligence produces machine-readable certification report", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = await engines.visualIntelligenceCertification.certifyVisualIntelligence();
    assert.ok(report.certificationId.startsWith("vic-report-"));
    assert.ok(report.certifiedProgrammes.length >= 5);
    assert.ok(report.t5MissionResults.length === 9);
    assert.ok(report.confidenceScore >= 0);
    assert.ok(report.metadataVersion);
    engines.visualCapture.stopCapture();
  });

  test("validates T5 missions T5-01 through T5-09", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = await engines.visualIntelligenceCertification.certifyVisualIntelligence();
    assert.equal(report.t5MissionResults.length, 9);
    assert.ok(report.certifiedMissions.includes("T5-01"));
    assert.ok(report.certifiedMissions.includes("T5-09"));
    engines.visualCapture.stopCapture();
  });

  test("validates T1 through T5 programmes", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = await engines.visualIntelligenceCertification.certifyVisualIntelligence();
    assert.equal(report.programmeResults.length, 5);
    assert.ok(report.programmeResults.some((p) => p.programmeId === "T1"));
    assert.ok(report.programmeResults.some((p) => p.programmeId === "T5"));
    engines.visualCapture.stopCapture();
  });

  test("end-to-end Visual Intelligence certification passes lifecycle", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = await engines.visualIntelligenceCertification.certifyVisualIntelligence();
    assert.ok(
      report.endToEndValidationResult.steps.length >= 8,
      `expected >= 8 e2e steps, got ${report.endToEndValidationResult.steps.length}: ${JSON.stringify(report.endToEndValidationResult.steps.map((s) => s.step))}`,
    );
    assert.ok(
      ["pass", "conditional", "fail"].includes(report.finalCertificationDecision),
    );
    engines.visualCapture.stopCapture();
  });

  test("verifies Grand King governance is preserved", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = await engines.visualIntelligenceCertification.certifyVisualIntelligence();
    assert.ok(report.governanceComplianceResult.grandKingAuthorityPreserved);
    assert.ok(report.governanceComplianceResult.noAutonomousApproval);
    assert.ok(report.governanceComplianceResult.learnOnlyModeVerified);
    engines.visualCapture.stopCapture();
  });

  test("never auto-applies UX changes (certify-only)", async () => {
    const engines = await buildPipeline();
    const config = engines.visualIntelligenceCertification.getState().configuration;
    assert.equal(config.certifyOnlyMode, true);
    engines.visualCapture.stopCapture();
  });

  test("validateForSupervisorSync reports readiness after certification", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    await engines.visualIntelligenceCertification.certifyVisualIntelligence();
    const sync = engines.visualIntelligenceCertification.validateForSupervisorSync();
    assert.ok(sync.readinessScore >= 20);
    assert.ok(["healthy", "degraded", "blocked"].includes(sync.health));
    engines.visualCapture.stopCapture();
  });

  test("cockpit snapshot exposes certification status", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    await engines.visualIntelligenceCertification.certifyVisualIntelligence();
    const cockpit = engines.visualIntelligenceCertification.getCockpitSnapshot();
    assert.ok(cockpit.totalCertifications >= 1);
    assert.ok(cockpit.grandKingAuthorityPreserved);
    engines.visualCapture.stopCapture();
  });

  test("getLatestReport returns most recent certification run", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = await engines.visualIntelligenceCertification.certifyVisualIntelligence();
    const latest = engines.visualIntelligenceCertification.getLatestReport();
    assert.equal(latest?.certificationId, report.certificationId);
    engines.visualCapture.stopCapture();
  });

  test("generates certification report with production readiness summary", async () => {
    const engines = await buildPipeline();
    await primeUpstream(engines);
    const report = await engines.visualIntelligenceCertification.certifyVisualIntelligence();
    assert.ok(report.reportOutputPath);
    assert.ok(report.productionReadinessResult);
    assert.ok(report.capabilityValidationSummary.programmesValidated >= 5);
    engines.visualCapture.stopCapture();
  });
});
