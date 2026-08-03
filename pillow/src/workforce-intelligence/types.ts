/** PILLOW-WFI-001 — Workforce Intelligence types (X3-08). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  WFI_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { WorkforceIntelligenceConfiguration } from "./configuration.js";

export type WorkforceIntelligenceVersion = "PILLOW-WFI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type WfiCapability = (typeof WFI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type WorkforceRecord = {
  workforceRecordId: string;
  timestamp: string;
  companyReference: string;
  workforceReference: string;
  agentUtilization: number;
  workloadDistribution: number;
  throughputMetrics: number;
  workforceEfficiencyScore: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverOverloadWorkforceBeyondValidatedLimits: true;
  structuralSignalOnly: true;
  sensitiveOperationalData: false;
};

export type WorkforceIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WfiCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    autonomousScalingFramework: boolean;
    winningProductDetector: boolean;
    scalingDecisionEngine: boolean;
    capacityPlanningEngine: boolean;
    marketingScaleEngine: boolean;
    supplierScaleEngine: boolean;
    financialScaleEngine: boolean;
  };
  metadataVersion: string;
};

export type WorkforceRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  workforceReference: string;
  recommendationSummary: string;
  agentUtilization: number;
  workloadDistribution: number;
  throughputMetrics: number;
  workforceEfficiencyScore: number;
  structuralSignalOnly: true;
  neverOverloadWorkforceBeyondValidatedLimits: true;
};

export type WorkforceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WfiRunReport = {
  workforceIntelligenceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_workforce_capacity"
    | "monitor_agent_utilization"
    | "monitor_workload_distribution"
    | "monitor_execution_throughput"
    | "monitor_task_completion"
    | "monitor_workforce_efficiency"
    | "detect_workforce_bottlenecks"
    | "detect_underutilized_agents"
    | "recommend_workforce_optimization"
    | "diagnostics";
  engineRecord: WorkforceIntelligenceEngineRecord;
  workforceRecords: WorkforceRecord[];
  recommendations: WorkforceRecommendation[];
  validation: WorkforceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WfiHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: WorkforceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalWorkforceRecords: number;
  bottleneckCount: number;
  averageEfficiency: number;
  notes: string[];
};

export type WfiPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  underutilizedAgentsDetected: number;
  bottlenecksDetected: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type WorkforceIntelligenceState = {
  engineVersion: WorkforceIntelligenceVersion;
  missionId: "X3-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: WorkforceIntelligenceConfiguration;
  latestReport: WfiRunReport | null;
  engineRecord: WorkforceIntelligenceEngineRecord | null;
  health: WfiHealthReport;
  performance: WfiPerformanceStats;
};

export type WfiCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: WorkforceValidationReport["decision"] | null;
  totalWorkforceRecords: number;
  bottleneckCount: number;
  averageEfficiency: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type WfiLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectWorkforceIntelligenceInput = Record<string, unknown>;

export type WorkforceIntelligenceInput = {
  companyReference?: string;
  workforceReference?: string;
  utilizationHint?: number;
  distributionHint?: number;
  throughputHint?: number;
  efficiencyHint?: number;
  capacityHint?: number;
  taskCompletionHint?: number;
  validated?: boolean;
};

export type RunWfiDiagnosticsInput = Record<string, unknown>;
