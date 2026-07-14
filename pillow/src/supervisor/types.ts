/** PILLOW-SV-001 — Supervisor System types (P6-03). */

import type { CursorMissionDocument } from "../planner/types.js";
import type {
  MISSION_HEALTH_CLASSIFICATIONS,
  SUPERVISION_EVENTS,
  SUPERVISION_PIPELINE,
} from "./paths.js";

export type MissionHealthClassification = (typeof MISSION_HEALTH_CLASSIFICATIONS)[number];
export type SupervisionPipelineStage = (typeof SUPERVISION_PIPELINE)[number];
export type SupervisionEventKind = (typeof SUPERVISION_EVENTS)[number];

export interface SupervisionPipelineStageRecord {
  stage: SupervisionPipelineStage;
  order: number;
  owner: string;
  description: string;
}

export interface SupervisionEventRecord {
  at: string;
  kind: SupervisionEventKind;
  missionId: string;
  missionTitle: string;
  detail: string;
  health: MissionHealthClassification;
}

export interface SupervisorSystemRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
}

export interface SupervisorReadinessPipeline {
  pipelineVersion: "P6-03";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  pipelineDocumented: boolean;
  eventsDocumented: boolean;
  healthClassificationsReady: boolean;
  eccIntegrationReady: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface SupervisorBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: SupervisorReadinessPipeline;
}

export interface SupervisorSystemSnapshot {
  capturedAt: string;
  activeMissionId: string | null;
  activeMissionTitle: string | null;
  missionHealth: MissionHealthClassification;
  currentPhase: string | null;
  currentStep: string | null;
  currentActivity: string | null;
  overallProgressPercent: number;
  executionState: string | null;
  activeDependencies: string[];
  currentRisks: string[];
  currentWarnings: string[];
  recoveryStatus: string | null;
  validationStatus: string | null;
}

export interface SupervisorSystemAssessment {
  success: boolean;
  missionHealth: MissionHealthClassification;
  supervisionGrade: "observing" | "degraded" | "blocked";
  activeMissions: number;
  snapshot: SupervisorSystemSnapshot;
  observations: string[];
  recommendations: string[];
  grandKingSummary: string;
}

export interface SupervisorSystemMetrics {
  totalResponsibilities: number;
  pipelineStages: number;
  supervisionEvents: number;
  healthClassifications: number;
  readinessScore: number;
  activeMissions: number;
  completedMissions: number;
  trend: "stable" | "improving" | "degrading";
}

export interface SupervisorSystemAnalysis {
  executionEfficiency: string[];
  missionQuality: string[];
  engineeringBottlenecks: string[];
  architectureBottlenecks: string[];
  repositoryBottlenecks: string[];
  recommendations: string[];
}

export type CursorMissionState =
  | "queued"
  | "preparing"
  | "synchronizing"
  | "reviewing"
  | "planning"
  | "implementing"
  | "testing"
  | "validating"
  | "production_verification"
  | "awaiting_grand_king"
  | "completed"
  | "blocked"
  | "recovering"
  | "cancelled"
  /** Legacy PILLOW-007 states (mapped to P4-04 lifecycle) */
  | "repository_inspection"
  | "implementation"
  | "validation"
  | "executive_audit"
  | "recovery"
  | "failed";

export type HeartbeatKind =
  | "repository_inspection"
  | "file_modified"
  | "validation"
  | "executive_audit"
  | "state_transition"
  | "repository_interaction"
  | "reasoning";

export type StallKind =
  | "waiting_background_process"
  | "waiting_detached_process"
  | "waiting_npm"
  | "waiting_build"
  | "reconnecting"
  | "taking_longer_than_expected"
  | "no_state_change"
  | "no_repository_activity"
  | "no_validation_progress"
  | "no_reasoning_progress";

export type MissionRiskLevel = "low" | "medium" | "high" | "critical";

export type MissionOutcome =
  | "pending"
  | "success"
  | "failed"
  | "recovered"
  | "cancelled";

export interface HeartbeatSignal {
  at: string;
  kind: HeartbeatKind;
  detail: string;
}

export interface ProgressEvent {
  at: string;
  kind:
    | "repository_analysis"
    | "file_created"
    | "file_modified"
    | "acceptance_criteria"
    | "validation_executed"
    | "executive_audit_generated"
    | "repository_synchronized"
    | "vision_synchronized";
  detail: string;
}

export interface StallSignal {
  kind: StallKind;
  detectedAt: string;
  message: string;
  doctrineRef: string;
}

export interface MissionHealth {
  score: number;
  riskLevel: MissionRiskLevel;
  stallSignals: StallSignal[];
  isDeadAgent: boolean;
  isSlowMission: boolean;
  lastProgressAt: string | null;
  lastHeartbeatAt: string | null;
  stateUnchangedMs: number;
}

export interface SupervisedMission {
  id: string;
  title: string;
  state: CursorMissionState;
  launchedAt: string;
  updatedAt: string;
  stateEnteredAt: string;
  durationMs: number;
  heartbeats: HeartbeatSignal[];
  progress: ProgressEvent[];
  health: MissionHealth;
  dependencies: string[];
  outcome: MissionOutcome;
  executiveAuditProduced: boolean;
  validationCompleted: boolean;
  recoveryAttempts: number;
  missionAuthority: string;
  objective: string;
}

export interface MissionRegistrySnapshot {
  activeMission: SupervisedMission | null;
  queued: SupervisedMission[];
  completed: SupervisedMission[];
  failed: SupervisedMission[];
  recovered: SupervisedMission[];
  history: SupervisedMission[];
}

export interface HeartbeatConfig {
  /** Ms without heartbeat before risk increases */
  heartbeatStaleMs: number;
  /** Ms without progress before stall consideration */
  progressStaleMs: number;
  /** Ms in same state before no_state_change stall */
  stateStaleMs: number;
  /** Ms before dead agent classification */
  deadAgentMs: number;
  /** Ms for slow-but-alive long-running validation */
  slowValidationMs: number;
}

export interface RecoveryStep {
  step: number;
  label: string;
  status: "pending" | "completed" | "skipped";
  detail: string;
}

export interface RecoveryAssessment {
  missionId: string;
  triggeredAt: string;
  stallSignals: StallSignal[];
  steps: RecoveryStep[];
  validationAlreadySucceeded: boolean;
  repositoryInspection: {
    modifiedFiles: number;
    createdFilesHint: string;
    gitDiffAvailable: boolean;
  };
  recommendation: string;
}

export interface RecoveryResult {
  assessment: RecoveryAssessment;
  missionState: CursorMissionState;
  recovered: boolean;
  /** Full PILLOW-008 recovery record when RecoveryManagerEngine is used */
  execution?: import("../recovery/types.js").RecoveryExecutionResult;
}

export interface ExecutiveAuditVerification {
  missionId: string;
  complete: boolean;
  hasExecutiveAudit: boolean;
  hasValidation: boolean;
  hasAcceptanceVerification: boolean;
  hasRepositoryContinuity: boolean;
  issues: string[];
}

export interface CursorSupervisorState {
  supervisorVersion: "PILLOW-SV-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  systemDoctrinePath: string;
  registry: MissionRegistrySnapshot;
  heartbeatConfig: HeartbeatConfig;
  lastAssessment: SupervisorSystemAssessment | null;
  recentEvents: SupervisionEventRecord[];
}

export interface LaunchMissionRequest {
  document: CursorMissionDocument;
  initialState?: CursorMissionState;
  /** Grand King explicit override — bypass synchronization refusal */
  grandKingOverride?: boolean;
}

export interface LaunchMissionResult {
  mission: SupervisedMission;
  launched: boolean;
}

export interface SupervisionTickResult {
  evaluatedAt: string;
  missionsEvaluated: number;
  stallsDetected: number;
  recoveriesInvoked: number;
  deadAgentsDetected: number;
}

export interface CursorSupervisorOptions {
  heartbeatConfig?: Partial<HeartbeatConfig>;
  /** Inject clock for tests */
  now?: () => number;
  /** PILLOW-008 Recovery Manager engine */
  recoveryManager?: import("../recovery/engine.js").RecoveryManagerEngine;
  /** PILLOW-009 Executive Audit Reviewer engine */
  auditReviewer?: import("../audit-reviewer/engine.js").ExecutiveAuditReviewerEngine;
  /** PILLOW-VS-001 Vision Synchronization engine (P4-02) */
  visionSync?: import("../vision-synchronization/engine.js").VisionSynchronizationEngine;
  /** PILLOW-CS-001 Context Synchronization engine (P4-03) */
  contextSync?: import("../context-synchronization/engine.js").ContextSynchronizationEngine;
  /** PILLOW-RD-001 Recovery Doctrine engine (P4-05) */
  recoveryDoctrine?: import("../recovery-doctrine/engine.js").RecoveryDoctrineEngine;
  /** PILLOW-BT-001 Browser Truth engine (P4-06) */
  browserTruth?: import("../browser-truth/engine.js").BrowserTruthEngine;
  /** PILLOW-VCE-001 Visual Capture engine (T1-01) */
  visualCapture?: import("../visual-capture-engine/engine.js").VisualCaptureEngine;
  /** PILLOW-USM-001 UI State Mapper engine (T1-02) */
  uiStateMapper?: import("../ui-state-mapper/engine.js").UiStateMapperEngine;
  /** PILLOW-CRE-001 Component Recognition engine (T1-03) */
  componentRecognition?: import("../component-recognition-engine/engine.js").ComponentRecognitionEngine;
  /** PILLOW-LUE-001 Layout Understanding engine (T1-04) */
  layoutUnderstanding?: import("../layout-understanding-engine/engine.js").LayoutUnderstandingEngine;
  /** PILLOW-NME-001 Navigation Mapping engine (T1-05) */
  navigationMapping?: import("../navigation-mapping-engine/engine.js").NavigationMappingEngine;
  /** PILLOW-ITE-001 Interaction Tracking engine (T1-06) */
  interactionTracking?: import("../interaction-tracking-engine/engine.js").InteractionTrackingEngine;
  /** PILLOW-CAE-001 Context Awareness engine (T1-07) */
  contextAwareness?: import("../context-awareness-engine/engine.js").ContextAwarenessEngine;
  visualMemory?: import("../visual-memory-engine/engine.js").VisualMemoryEngine;
  sessionContinuity?: import("../session-continuity-engine/engine.js").SessionContinuityEngine;
  visualFoundationCertification?: import("../visual-foundation-certification-engine/engine.js").VisualFoundationCertificationEngine;
  uxRuleEngine?: import("../ux-rule-engine/engine.js").UxRuleEngine;
  designSystemIntelligence?: import("../design-system-intelligence-engine/engine.js").DesignSystemIntelligenceEngine;
  executiveStyleLearning?: import("../executive-style-learning-engine/engine.js").ExecutiveStyleLearningEngine;
  layoutEvaluation?: import("../layout-evaluation-engine/engine.js").LayoutEvaluationEngine;
  workflowOptimization?: import("../workflow-optimization-engine/engine.js").WorkflowOptimizationEngine;
  accessibilityIntelligence?: import("../accessibility-intelligence-engine/engine.js").AccessibilityIntelligenceEngine;
  visualConsistency?: import("../visual-consistency-engine/engine.js").VisualConsistencyEngine;
  uxScoring?: import("../ux-scoring-engine/engine.js").UxScoringEngine;
  recommendationEngine?: import("../recommendation-engine/engine.js").RecommendationEngine;
  uxIntelligenceCertification?: import("../ux-intelligence-certification-engine/engine.js").UxIntelligenceCertificationEngine;
  frontendBuilder?: import("../frontend-builder/engine.js").FrontendBuilder;
  componentGenerator?: import("../component-generator/engine.js").ComponentGenerator;
  layoutRefactoring?: import("../layout-refactoring/engine.js").LayoutRefactoringEngine;
  themeBuilder?: import("../theme-builder/engine.js").ThemeBuilder;
  previewGenerator?: import("../preview-generator/engine.js").PreviewGenerator;
  validationEngine?: import("../validation-engine/engine.js").ValidationEngine;
  regressionProtection?: import("../regression-protection/engine.js").RegressionProtectionEngine;
  rollbackManager?: import("../rollback-manager/engine.js").RollbackManagerEngine;
  changeDocumentation?: import("../change-documentation/engine.js").ChangeDocumentationEngine;
  autonomousBuilderCertification?: import("../autonomous-builder-certification-engine/engine.js").AutonomousBuilderCertificationEngine;
  naturalUxConversation?: import("../natural-ux-conversation/engine.js").NaturalUxConversationEngine;
  voiceUxCommands?: import("../voice-ux-commands/engine.js").VoiceUxCommandsEngine;
  screenAnnotation?: import("../screen-annotation/engine.js").ScreenAnnotationEngine;
  multiProposalGenerator?: import("../multi-proposal-generator/engine.js").MultiProposalGeneratorEngine;
  sideBySideComparison?: import("../side-by-side-comparison/engine.js").SideBySideComparisonEngine;
  explainDecisions?: import("../explain-decisions/engine.js").ExplainDecisionsEngine;
  approvalWorkflow?: import("../approval-workflow/engine.js").ApprovalWorkflowEngine;
  preferenceLearning?: import("../preference-learning/engine.js").PreferenceLearningEngine;
  continuousCollaboration?: import("../continuous-collaboration/engine.js").ContinuousCollaborationEngine;
  executiveCollaborationCertification?: import("../executive-collaboration-certification-engine/engine.js").ExecutiveCollaborationCertificationEngine;
  e2eTesting?: import("../e2e-testing/engine.js").E2eTestingEngine;
  journeySystem?: import("../journey-system/engine.js").JourneySystemEngine;
  brainRuntime?: import("../brain-runtime/engine.js").BrainRuntimeEngine;
  productionMode?: import("../production-mode/engine.js").ProductionModeEngine;
  durableSessions?: import("../durable-sessions/engine.js").DurableSessionEngine;
  guardianMonitoring?: import("../guardian-monitoring/engine.js").GuardianMonitoringEngine;
  scalingArchitecture?: import("../scaling-architecture/engine.js").ScalingArchitectureEngine;
  performanceGovernance?: import("../performance-governance/engine.js").PerformanceGovernanceEngine;
  executionControlCenter?: import("../execution-control-center/engine.js").ExecutionControlCenterEngine;
  visionIntegrity?: import("../vision-integrity-engine/engine.js").VisionIntegrityEngine;
  builderMonitor?: import("../builder-monitor/engine.js").BuilderMonitorEngine;
}

export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  heartbeatStaleMs: 120_000,
  progressStaleMs: 180_000,
  stateStaleMs: 300_000,
  deadAgentMs: 600_000,
  slowValidationMs: 900_000,
};
