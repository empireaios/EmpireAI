import type { EmpirePerformanceGuardianConfiguration } from "./configuration.js";
import type {
  ANOMALY_STATUSES,
  ENGINE_STATUSES,
  EPG_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type AnomalyStatus = (typeof ANOMALY_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type EmpirePerformanceGuardianCapability = (typeof EPG_CAPABILITIES)[number];

export type EmpirePerformanceGuardianInput = {
  companyReference?: string;
  performanceCategory?: string;
  kpiSummary?: string;
  healthScore?: number;
  anomalyHint?: AnomalyStatus;
  recommendationSummary?: string;
  validated?: boolean;
  suppressCriticalAlert?: boolean;
  degradationHint?: boolean;
  priorityScore?: number;
};

export type PerformanceRecord = {
  performanceRecordId: string;
  timestamp: string;
  companyReference: string;
  performanceCategory: string;
  kpiSummary: string;
  healthScore: number;
  anomalyStatus: AnomalyStatus;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  structuralSignalOnly: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverSuppressCriticalEnterpriseAlerts: true;
  criticalAlertSuppressed: false;
  preservePerformanceTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  performanceTraceId: string;
  maskSensitiveValues: true;
  priorityScore: number;
};

export type PerformanceRecommendation = {
  recommendationId: string;
  timestamp: string;
  performanceRecordId: string;
  recommendationSummary: string;
  healthScore: number;
  anomalyStatus: AnomalyStatus;
  structuralSignalOnly: true;
  neverSuppressCriticalEnterpriseAlerts: true;
  criticalAlertSuppressed: false;
};

export type PerformanceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EmpirePerformanceGuardianEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-EPG-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EmpirePerformanceGuardianCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    empireIntelligenceFramework: boolean;
    executiveEmpireDashboard: boolean;
    autonomousEmpireEvolution: boolean;
  };
  metadataVersion: string;
};

export type EmpirePerformanceGuardianRunReport = {
  performanceRunReportId: string;
  runTimestamp: string;
  action: string;
  engineRecord: EmpirePerformanceGuardianEngineRecord;
  performanceRecords: PerformanceRecord[];
  recommendations: PerformanceRecommendation[];
  validation: PerformanceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EmpirePerformanceGuardianState = {
  engineVersion: "PILLOW-EPG-001";
  missionId: "X5-18";
  status: EngineStatus;
  initializedAt: string;
  configuration: EmpirePerformanceGuardianConfiguration;
  latestReport: EmpirePerformanceGuardianRunReport | null;
  engineRecord: EmpirePerformanceGuardianEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: PerformanceValidationReport["decision"] | null;
    totalPerformanceRecords: number;
    notes: string[];
  };
};

export type EmpirePerformanceGuardianCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: PerformanceValidationReport["decision"] | null;
  totalPerformanceRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};
