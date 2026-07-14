/** PILLOW-SIUX-001 — Self-Improving UX Engine types (T5-09). */

import type {
  LEARNING_CATEGORIES,
  LEARNING_STATUSES,
  ENGINE_STATUSES,
} from "./paths.js";
import type { SelfImprovingUxConfiguration } from "./configuration.js";

export type SelfImprovingUxEngineVersion = "PILLOW-SIUX-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type LearningStatus = (typeof LEARNING_STATUSES)[number];
export type LearningCategory = (typeof LEARNING_CATEGORIES)[number];

export type UxLearningRecord = {
  learningId: string;
  timestamp: string;
  sourceWorkspaceIntelligenceId: string | null;
  sourceUxEvolutionId: string | null;
  sourceWorkflowEvolutionId: string | null;
  sourceRedesignHistory: string[];
  sourceDeploymentOutcomes: string[];
  sourceApprovalHistory: string[];
  learnedUxInsight: string;
  improvementSummary: string;
  recommendationImprovement: string;
  prioritizationImprovement: string;
  learningCategory: LearningCategory;
  evidenceReferences: string[];
  confidenceScore: number;
  status: LearningStatus;
  metadataVersion: string;
  learnOnly: true;
};

export type KnowledgeBaseEntry = {
  entryId: string;
  recordedAt: string;
  learningCategory: LearningCategory;
  insightSummary: string;
  confidenceScore: number;
  metadataVersion: string;
};

export type LearningValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  recordsValidated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SelfImprovingUxRunReport = {
  learningRunReportId: string;
  runTimestamp: string;
  records: UxLearningRecord[];
  knowledgeEntries: KnowledgeBaseEntry[];
  validation: LearningValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LearningSessionRecord = {
  learningSessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: EngineStatus;
  learningCyclesRecorded: number;
  learningCyclesFailed: number;
  insightsGenerated: number;
  lastLearningAt: string | null;
  continuousLearningActive: boolean;
};

export type LearningHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  learningEnabled: boolean;
  continuousLearningActive: boolean;
  lastLearningAt: string | null;
  lastValidationDecision: LearningValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  knowledgeBaseSize: number;
  notes: string[];
};

export type LearningPerformanceStats = {
  totalLearningCycles: number;
  successfulLearningCycles: number;
  failedLearningCycles: number;
  totalInsights: number;
  redesignLearnings: number;
  approvalLearnings: number;
  deploymentLearnings: number;
  recommendationImprovements: number;
  prioritizationImprovements: number;
  knowledgeBaseUpdates: number;
  duplicatesSkipped: number;
  averageLearningDurationMs: number;
  peakLearningDurationMs: number;
  skippedCycles: number;
};

export type LearningLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type SelfImprovingUxState = {
  engineVersion: SelfImprovingUxEngineVersion;
  missionId: "T5-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: SelfImprovingUxConfiguration;
  latestReport: SelfImprovingUxRunReport | null;
  activeSession: LearningSessionRecord | null;
  knowledgeBase: KnowledgeBaseEntry[];
  topLearnings: UxLearningRecord[];
  health: LearningHealthReport;
  performance: LearningPerformanceStats;
};

export type SelfImprovingUxCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: LearningHealthReport["status"];
  lastDecision: LearningValidationReport["decision"] | null;
  continuousLearningActive: boolean;
  totalLearningCycles: number;
  totalInsights: number;
  knowledgeBaseSize: number;
  confidenceScore: number;
  dominantLearningCategory: LearningCategory | null;
  recentLogs: string[];
};

export type SelfImprovingUxInput = {
  sessionId?: string;
  forceLearning?: boolean;
  workspaceIntelligenceId?: string;
};

export type SelfImprovingUxEngineBundle = {
  executiveWorkspaceIntelligence: import("../executive-workspace-intelligence-engine/engine.js").ExecutiveWorkspaceIntelligenceEngine | null;
  continuousUxEvolution: import("../continuous-ux-evolution-engine/engine.js").ContinuousUxEvolutionEngine | null;
  adaptiveInterface: import("../adaptive-interface-engine/engine.js").AdaptiveInterfaceEngine | null;
  workflowEvolution: import("../workflow-evolution-engine/engine.js").WorkflowEvolutionEngine | null;
  productivityIntelligence: import("../productivity-intelligence-engine/engine.js").ProductivityIntelligenceEngine | null;
  uxOpportunityDiscovery: import("../ux-opportunity-discovery-engine/engine.js").UxOpportunityDiscoveryEngine | null;
  autonomousUxAudit: import("../autonomous-ux-audit-engine/engine.js").AutonomousUxAuditEngine | null;
  continuousScreenObservation: import("../continuous-screen-observation-engine/engine.js").ContinuousScreenObservationEngine | null;
  approvalWorkflow: import("../approval-workflow/engine.js").ApprovalWorkflowEngine | null;
  changeDocumentation: import("../change-documentation/engine.js").ChangeDocumentationEngine | null;
};

export type RawLearningCandidate = {
  learningCategory: LearningCategory;
  learnedUxInsight: string;
  improvementSummary: string;
  recommendationImprovement: string;
  prioritizationImprovement: string;
  sourceRedesignHistory: string[];
  sourceDeploymentOutcomes: string[];
  sourceApprovalHistory: string[];
  evidenceReferences: string[];
  confidenceScore: number;
  impactScore: number;
  sourceEngine: string;
  sourceWorkspaceIntelligenceId?: string | null;
  sourceUxEvolutionId?: string | null;
  sourceWorkflowEvolutionId?: string | null;
};
