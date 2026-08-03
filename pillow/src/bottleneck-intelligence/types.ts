/** PILLOW-BNI-001 — Bottleneck Intelligence types (X3-10). */

import type {
  BOTTLENECK_CATEGORIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  BNI_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { BottleneckIntelligenceConfiguration } from "./configuration.js";

export type BottleneckIntelligenceVersion = "PILLOW-BNI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type BottleneckCategory = (typeof BOTTLENECK_CATEGORIES)[number];
export type BniCapability = (typeof BNI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type BottleneckRecord = {
  bottleneckId: string;
  timestamp: string;
  companyReference: string;
  bottleneckCategory: BottleneckCategory;
  affectedComponent: string;
  severityScore: number;
  businessImpactScore: number;
  resolutionPriority: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverGenerateUnsupportedBottleneckConclusions: true;
  structuralSignalOnly: true;
  sensitiveOperationalData: false;
};

export type BottleneckIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BniCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    autonomousScalingFramework: boolean;
    winningProductDetector: boolean;
    scalingDecisionEngine: boolean;
    capacityPlanningEngine: boolean;
    marketingScaleEngine: boolean;
    supplierScaleEngine: boolean;
    financialScaleEngine: boolean;
    workforceIntelligence: boolean;
    executiveScalingDashboard: boolean;
  };
  metadataVersion: string;
};

export type BottleneckRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  bottleneckCategory: BottleneckCategory;
  affectedComponent: string;
  recommendationSummary: string;
  severityScore: number;
  businessImpactScore: number;
  resolutionPriority: number;
  structuralSignalOnly: true;
  neverGenerateUnsupportedBottleneckConclusions: true;
};

export type BottleneckValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type BniRunReport = {
  bottleneckIntelligenceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_operational_bottlenecks"
    | "monitor_infrastructure_bottlenecks"
    | "monitor_supplier_bottlenecks"
    | "monitor_marketing_bottlenecks"
    | "monitor_financial_bottlenecks"
    | "monitor_workforce_bottlenecks"
    | "detect_throughput_constraints"
    | "rank_bottlenecks_by_impact"
    | "recommend_bottleneck_resolutions"
    | "diagnostics";
  engineRecord: BottleneckIntelligenceEngineRecord;
  bottleneckRecords: BottleneckRecord[];
  recommendations: BottleneckRecommendation[];
  validation: BottleneckValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type BniHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: BottleneckValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalBottleneckRecords: number;
  highSeverityCount: number;
  averageImpact: number;
  notes: string[];
};

export type BniPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  throughputConstraintsDetected: number;
  bottlenecksRanked: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type BottleneckIntelligenceState = {
  engineVersion: BottleneckIntelligenceVersion;
  missionId: "X3-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: BottleneckIntelligenceConfiguration;
  latestReport: BniRunReport | null;
  engineRecord: BottleneckIntelligenceEngineRecord | null;
  health: BniHealthReport;
  performance: BniPerformanceStats;
};

export type BniCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: BottleneckValidationReport["decision"] | null;
  totalBottleneckRecords: number;
  highSeverityCount: number;
  averageImpact: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type BniLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectBottleneckIntelligenceInput = Record<string, unknown>;

export type BottleneckIntelligenceInput = {
  companyReference?: string;
  affectedComponent?: string;
  severityHint?: number;
  impactHint?: number;
  throughputHint?: number;
  constraintHint?: number;
  validated?: boolean;
};

export type RunBniDiagnosticsInput = Record<string, unknown>;
