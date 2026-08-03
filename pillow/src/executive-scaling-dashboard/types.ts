/** PILLOW-ESD-001 — Executive Scaling Dashboard types (X3-09). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  ESD_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ExecutiveScalingDashboardConfiguration } from "./configuration.js";

export type ExecutiveScalingDashboardVersion = "PILLOW-ESD-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type EsdCapability = (typeof ESD_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type DomainSummary = {
  domain: string;
  readinessScore: number;
  statusLabel: string;
  sourceAvailable: boolean;
  notes: string;
};

export type ExecutiveDashboardSnapshot = {
  dashboardId: string;
  timestamp: string;
  companyReference: string;
  scalingSummary: DomainSummary;
  opportunitySummary: DomainSummary;
  capacitySummary: DomainSummary;
  marketingSummary: DomainSummary;
  supplierSummary: DomainSummary;
  financialSummary: DomainSummary;
  workforceSummary: DomainSummary;
  executiveAlerts: string[];
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverExposeRestrictedEnterpriseInformation: true;
  structuralSignalOnly: true;
  sensitiveEnterpriseData: false;
};

export type ExecutiveScalingDashboardEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EsdCapability[];
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
  };
  metadataVersion: string;
};

export type ExecutiveScalingRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  recommendationSummary: string;
  scalingReadinessScore: number;
  opportunityScore: number;
  capacityScore: number;
  structuralSignalOnly: true;
  neverExposeRestrictedEnterpriseInformation: true;
};

export type ExecutiveDashboardValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EsdRunReport = {
  executiveScalingDashboardRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "refresh_dashboard"
    | "get_scaling_status"
    | "get_scaling_opportunities"
    | "get_scaling_decisions"
    | "get_operational_capacity"
    | "get_marketing_growth"
    | "get_supplier_readiness"
    | "get_financial_readiness"
    | "get_workforce_utilization"
    | "get_executive_alerts"
    | "get_scaling_recommendations"
    | "diagnostics";
  engineRecord: ExecutiveScalingDashboardEngineRecord;
  dashboardSnapshots: ExecutiveDashboardSnapshot[];
  recommendations: ExecutiveScalingRecommendation[];
  validation: ExecutiveDashboardValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EsdHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ExecutiveDashboardValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalDashboardSnapshots: number;
  alertCount: number;
  averageReadiness: number;
  notes: string[];
};

export type EsdPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  refreshRuns: number;
  widgetQueries: number;
  alertsGenerated: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ExecutiveScalingDashboardState = {
  engineVersion: ExecutiveScalingDashboardVersion;
  missionId: "X3-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExecutiveScalingDashboardConfiguration;
  latestReport: EsdRunReport | null;
  engineRecord: ExecutiveScalingDashboardEngineRecord | null;
  health: EsdHealthReport;
  performance: EsdPerformanceStats;
};

export type EsdCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ExecutiveDashboardValidationReport["decision"] | null;
  totalDashboardSnapshots: number;
  alertCount: number;
  averageReadiness: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type EsdLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectExecutiveScalingDashboardInput = Record<string, unknown>;

export type ExecutiveScalingDashboardInput = {
  companyReference?: string;
  scalingHint?: number;
  opportunityHint?: number;
  capacityHint?: number;
  marketingHint?: number;
  supplierHint?: number;
  financialHint?: number;
  workforceHint?: number;
  validated?: boolean;
};

export type RunEsdDiagnosticsInput = Record<string, unknown>;
