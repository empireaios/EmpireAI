/** PILLOW-WFO-001 — Workflow Optimization types (T2-05). */

import type {
  FRICTION_CATEGORIES,
  FRICTION_SEVERITIES,
  OPTIMIZATION_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { WorkflowOptimizationConfiguration } from "./configuration.js";

export type WorkflowOptimizationEngineVersion = "PILLOW-WFO-001";
export type OptimizationStatus = (typeof OPTIMIZATION_STATUSES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];
export type FrictionSeverity = (typeof FRICTION_SEVERITIES)[number];
export type FrictionCategory = (typeof FRICTION_CATEGORIES)[number];

export type WorkflowFrictionPoint = {
  frictionId: string;
  category: FrictionCategory;
  description: string;
  severity: FrictionSeverity;
  affectedScreens: string[];
  affectedComponents: string[];
  affectedNavigationNodes: string[];
  evidenceRef: string;
  confidence: number;
};

export type WorkflowStrength = {
  strengthId: string;
  description: string;
  category: string;
  affectedScreens: string[];
  evidenceRef: string;
  confidence: number;
};

export type WorkflowOptimizationRecord = {
  optimizationRecordId: string;
  timestamp: string;
  workflowId: string | null;
  currentWorkflowName: string | null;
  currentWorkflowStage: string | null;
  sourceWorkflowContextId: string | null;
  sourceInteractionEventIds: string[];
  sourceNavigationGraphId: string | null;
  sourceLayoutEvaluationId: string | null;
  detectedFrictionPoints: WorkflowFrictionPoint[];
  detectedWorkflowStrengths: WorkflowStrength[];
  affectedScreens: string[];
  affectedComponents: string[];
  affectedNavigationNodes: string[];
  evidenceReferences: string[];
  severity: FrictionSeverity;
  confidenceScore: number;
  metadataVersion: string;
};

export type WorkflowOptimizationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  recordsValidated: number;
  frictionPointsDetected: number;
  strengthsIdentified: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WorkflowOptimizationReport = {
  optimizationReportId: string;
  optimizationTimestamp: string;
  record: WorkflowOptimizationRecord;
  validation: WorkflowOptimizationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type OptimizationHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  optimizationEnabled: boolean;
  analysesCompleted: number;
  lastAnalysisAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type OptimizationPerformanceStats = {
  totalAnalyses: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  totalFrictionPoints: number;
  totalStrengthsIdentified: number;
  averageAnalysisDurationMs: number;
  peakAnalysisDurationMs: number;
};

export type OptimizationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type WorkflowOptimizationState = {
  engineVersion: WorkflowOptimizationEngineVersion;
  missionId: "T2-05";
  status: OptimizationStatus;
  initializedAt: string;
  configuration: WorkflowOptimizationConfiguration;
  latestRecord: WorkflowOptimizationRecord | null;
  latestReport: WorkflowOptimizationReport | null;
  health: OptimizationHealthReport;
  performance: OptimizationPerformanceStats;
};

export type WorkflowOptimizationCockpitSnapshot = {
  optimizationStatus: OptimizationStatus;
  healthStatus: string;
  lastDecision: ValidationDecision | null;
  frictionPointsCount: number;
  strengthsCount: number;
  workflowName: string | null;
  confidenceScore: number;
  totalAnalyses: number;
  recentLogs: string[];
};
