/** PILLOW-EWI-001 — Executive Workspace Intelligence types (T5-08). */

import type {
  WORKSPACE_CATEGORIES,
  WORKSPACE_STATUSES,
  ENGINE_STATUSES,
  WORKSPACE_PRIORITIES,
} from "./paths.js";
import type { ExecutiveWorkspaceIntelligenceConfiguration } from "./configuration.js";

export type ExecutiveWorkspaceIntelligenceEngineVersion = "PILLOW-EWI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];
export type WorkspaceCategory = (typeof WORKSPACE_CATEGORIES)[number];
export type WorkspacePriority = (typeof WORKSPACE_PRIORITIES)[number];

export type WorkspaceIntelligenceRecord = {
  workspaceIntelligenceId: string;
  timestamp: string;
  sourceUxEvolutionId: string | null;
  sourceAdaptiveInterfaceId: string | null;
  sourceWorkflowEvolutionId: string | null;
  sourceProductivityIntelligenceId: string | null;
  activeMissionContext: string;
  executivePriorities: string[];
  recommendedDashboardLayout: string[];
  recommendedWorkspaceConfiguration: string[];
  recommendedWidgets: string[];
  recommendedShortcuts: string[];
  expectedProductivityBenefit: string;
  workspaceCategory: WorkspaceCategory;
  workspacePriority: WorkspacePriority;
  evidenceReferences: string[];
  confidenceScore: number;
  status: WorkspaceStatus;
  metadataVersion: string;
  recommendOnly: true;
};

export type WorkspaceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  recordsValidated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExecutiveWorkspaceIntelligenceRunReport = {
  workspaceRunReportId: string;
  runTimestamp: string;
  records: WorkspaceIntelligenceRecord[];
  validation: WorkspaceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WorkspaceSessionRecord = {
  workspaceSessionId: string;
  startedAt: string;
  endedAt: string | null;
  status: EngineStatus;
  optimizationCyclesRecorded: number;
  optimizationCyclesFailed: number;
  recommendationsGenerated: number;
  lastOptimizationAt: string | null;
  lastMissionContext: string | null;
  continuousOptimizationActive: boolean;
};

export type WorkspaceHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  workspaceIntelligenceEnabled: boolean;
  continuousOptimizationActive: boolean;
  lastOptimizationAt: string | null;
  lastValidationDecision: WorkspaceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type WorkspacePerformanceStats = {
  totalOptimizationCycles: number;
  successfulOptimizationCycles: number;
  failedOptimizationCycles: number;
  totalRecommendations: number;
  dashboardRecommendations: number;
  layoutRecommendations: number;
  widgetRecommendations: number;
  shortcutRecommendations: number;
  missionAnalyses: number;
  duplicatesSkipped: number;
  averageOptimizationDurationMs: number;
  peakOptimizationDurationMs: number;
  skippedCycles: number;
};

export type WorkspaceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ExecutiveWorkspaceIntelligenceState = {
  engineVersion: ExecutiveWorkspaceIntelligenceEngineVersion;
  missionId: "T5-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExecutiveWorkspaceIntelligenceConfiguration;
  latestReport: ExecutiveWorkspaceIntelligenceRunReport | null;
  activeSession: WorkspaceSessionRecord | null;
  topRecommendations: WorkspaceIntelligenceRecord[];
  health: WorkspaceHealthReport;
  performance: WorkspacePerformanceStats;
};

export type ExecutiveWorkspaceIntelligenceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: WorkspaceHealthReport["status"];
  lastDecision: WorkspaceValidationReport["decision"] | null;
  continuousOptimizationActive: boolean;
  totalOptimizationCycles: number;
  totalRecommendations: number;
  topPriorityCount: number;
  confidenceScore: number;
  activeMissionContext: string | null;
  recentLogs: string[];
};

export type ExecutiveWorkspaceIntelligenceInput = {
  sessionId?: string;
  forceOptimization?: boolean;
  uxEvolutionId?: string;
};

export type ExecutiveWorkspaceIntelligenceEngineBundle = {
  continuousUxEvolution: import("../continuous-ux-evolution-engine/engine.js").ContinuousUxEvolutionEngine | null;
  adaptiveInterface: import("../adaptive-interface-engine/engine.js").AdaptiveInterfaceEngine | null;
  workflowEvolution: import("../workflow-evolution-engine/engine.js").WorkflowEvolutionEngine | null;
  productivityIntelligence: import("../productivity-intelligence-engine/engine.js").ProductivityIntelligenceEngine | null;
  uxOpportunityDiscovery: import("../ux-opportunity-discovery-engine/engine.js").UxOpportunityDiscoveryEngine | null;
  autonomousUxAudit: import("../autonomous-ux-audit-engine/engine.js").AutonomousUxAuditEngine | null;
  continuousScreenObservation: import("../continuous-screen-observation-engine/engine.js").ContinuousScreenObservationEngine | null;
};

export type ExecutiveContext = {
  activeMissionContext: string;
  executivePriorities: string[];
  operationalContext: string;
  evidenceReferences: string[];
  confidenceScore: number;
};

export type RawWorkspaceCandidate = {
  workspaceCategory: WorkspaceCategory;
  activeMissionContext: string;
  executivePriorities: string[];
  recommendedDashboardLayout: string[];
  recommendedWorkspaceConfiguration: string[];
  recommendedWidgets: string[];
  recommendedShortcuts: string[];
  expectedProductivityBenefit: string;
  evidenceReferences: string[];
  confidenceScore: number;
  impactScore: number;
  sourceEngine: string;
  sourceUxEvolutionId?: string | null;
  sourceAdaptiveInterfaceId?: string | null;
  sourceWorkflowEvolutionId?: string | null;
  sourceProductivityIntelligenceId?: string | null;
};
