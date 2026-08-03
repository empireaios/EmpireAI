import type { AdaptiveWorkforceOptimizerConfiguration } from "./configuration.js";
import type {
  AWO_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  OPTIMIZATION_SCOPES,
  OPTIMIZATION_TARGETS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type OptimizationTarget = (typeof OPTIMIZATION_TARGETS)[number];
export type OptimizationScope = (typeof OPTIMIZATION_SCOPES)[number];
export type AdaptiveWorkforceOptimizerCapability = (typeof AWO_CAPABILITIES)[number];

/** Snapshot of a worker's operational metrics for analysis. */
export type WorkerPerformanceSnapshot = {
  workerId: string;
  department: string;
  utilizationPct: number;
  queueDepth: number;
  throughput: number;
  accuracy: number;
  reliability: number;
  collaborationScore: number;
  routingEfficiency: number;
  operationalCost: number;
  assignmentLoad: number;
};

export type CurrentPerformance = {
  averageUtilizationPct: number;
  averageThroughput: number;
  averageAccuracy: number;
  averageReliability: number;
  averageCollaborationScore: number;
  averageRoutingEfficiency: number;
  totalQueueDepth: number;
  totalOperationalCost: number;
  workerCount: number;
};

export type RecommendedChange = {
  changeId: string;
  target: OptimizationTarget | string;
  summary: string;
  priority: "low" | "medium" | "high" | "critical";
  affectedWorkers: string[];
};

/** Machine-readable Optimization Record (Q0-17). */
export type OptimizationRecord = {
  optimizationId: string;
  timestamp: string;
  scope: OptimizationScope | string;
  workers: string[];
  department: string;
  currentPerformance: CurrentPerformance;
  bottlenecks: string[];
  improvementOpportunities: string[];
  recommendedChanges: RecommendedChange[];
  expectedBenefits: string[];
  confidenceScore: number;
  supportingEvidence: string[];
  metadataVersion: string;
  optimizationTraceId: string;
  validationStatus: ValidationStatus;
  overloadedWorkers: string[];
  underutilizedWorkers: string[];
  idleWorkers: string[];
  optimizationTargetsAddressed: string[];
  /** Explicit Q0-17 boundaries. */
  neverExecuteWorkerTasks: true;
  neverModifyWorkersAutomatically: true;
  neverReplacePillow: true;
  neverOverrideGrandKing: true;
  neverPerformStrategicPlanning: true;
  workerTasksExecuted: false;
  workersModifiedAutomatically: false;
  pillowReplaced: false;
  grandKingOverridden: false;
  strategicPlanningPerformed: false;
  preserveOptimizationTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-17 — analyse/detect/recommend only. */
export type AdaptiveWorkforceOptimizerInput = {
  optimizationId?: string | null;
  scope?: OptimizationScope | string | null;
  department?: string | null;
  workers?: WorkerPerformanceSnapshot[];
  workerIds?: string[];
  targets?: Array<OptimizationTarget | string>;
  recommendationFocus?:
    | "workforce"
    | "routing"
    | "collaboration"
    | "capability"
    | "all"
    | string
    | null;
  overloadedThreshold?: number | null;
  underutilizedThreshold?: number | null;
  idleThreshold?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  modifyWorkersAutomatically?: boolean;
  replacePillow?: boolean;
  overrideGrandKing?: boolean;
  performStrategicPlanning?: boolean;
};

export type AdaptiveWorkforceOptimizerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AdaptiveWorkforceOptimizerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-AWO-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AdaptiveWorkforceOptimizerCapability[];
  totalOptimizationRecords: number;
  lastConfidenceScore: number | null;
  metadataVersion: string;
};

export type AdaptiveWorkforceOptimizerRunReport = {
  optimizationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "analyse_utilization"
    | "analyse_performance"
    | "analyse_routing"
    | "analyse_collaboration"
    | "detect_bottlenecks"
    | "detect_overloaded"
    | "detect_underutilized"
    | "recommend"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: AdaptiveWorkforceOptimizerEngineRecord;
  records: OptimizationRecord[];
  overloadedWorkers: string[];
  underutilizedWorkers: string[];
  idleWorkers: string[];
  bottlenecks: string[];
  recommendations: RecommendedChange[];
  validation: AdaptiveWorkforceOptimizerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AdaptiveWorkforceOptimizerState = {
  engineVersion: "PILLOW-AWO-001";
  missionId: "Q0-17";
  status: EngineStatus;
  initializedAt: string;
  configuration: AdaptiveWorkforceOptimizerConfiguration;
  latestReport: AdaptiveWorkforceOptimizerRunReport | null;
  engineRecord: AdaptiveWorkforceOptimizerEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalOptimizationRecords: number;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type AdaptiveWorkforceOptimizerCockpitSnapshot = {
  missionId: "Q0-17";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalOptimizationRecords: number;
  latestOptimizationId: string | null;
  lastConfidenceScore: number | null;
  neverExecuteWorkerTasks: true;
  neverModifyWorkersAutomatically: true;
  neverReplacePillow: true;
  neverOverrideGrandKing: true;
  neverPerformStrategicPlanning: true;
};
