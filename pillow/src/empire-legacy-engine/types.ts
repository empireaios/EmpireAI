import type { EmpireLegacyEngineConfiguration } from "./configuration.js";
import type {
  ELE_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SIGNIFICANCE_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HistoricalSignificance = (typeof SIGNIFICANCE_LEVELS)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type EmpireLegacyCapability = (typeof ELE_CAPABILITIES)[number];

export type EmpireLegacyInput = {
  companyReference?: string;
  legacyCategory?: string;
  historicalEventReference?: string;
  achievementReference?: string;
  historicalSignificance?: HistoricalSignificance;
  recommendationSummary?: string;
  validated?: boolean;
  authorizedToModifyValidatedHistory?: boolean;
  attemptModifyValidatedHistory?: boolean;
  missingHistoryHint?: boolean;
};

export type LegacyRecord = {
  legacyRecordId: string;
  timestamp: string;
  companyReference: string;
  legacyCategory: string;
  historicalEventReference: string;
  achievementReference: string;
  historicalSignificance: HistoricalSignificance;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  structuralSignalOnly: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverModifyValidatedHistoricalRecordsWithoutAuthorization: true;
  modifiedValidatedHistoricalRecordWithoutAuthorization: false;
  preserveHistoricalTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  legacyTraceId: string;
  maskSensitiveValues: true;
};

export type LegacyRecommendation = {
  recommendationId: string;
  timestamp: string;
  legacyRecordId: string;
  recommendationSummary: string;
  historicalSignificance: HistoricalSignificance;
  structuralSignalOnly: true;
  neverModifyValidatedHistoricalRecordsWithoutAuthorization: true;
  modifiedValidatedHistoricalRecordWithoutAuthorization: false;
};

export type LegacyValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EmpireLegacyEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-ELE-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EmpireLegacyCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    empireIntelligenceFramework: boolean;
    empireMemoryEngine: boolean;
    enterpriseSuccessionEngine: boolean;
  };
  metadataVersion: string;
};

export type EmpireLegacyRunReport = {
  legacyRunReportId: string;
  runTimestamp: string;
  action: string;
  engineRecord: EmpireLegacyEngineRecord;
  legacyRecords: LegacyRecord[];
  recommendations: LegacyRecommendation[];
  validation: LegacyValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EmpireLegacyState = {
  engineVersion: "PILLOW-ELE-001";
  missionId: "X5-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: EmpireLegacyEngineConfiguration;
  latestReport: EmpireLegacyRunReport | null;
  engineRecord: EmpireLegacyEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: LegacyValidationReport["decision"] | null;
    totalLegacyRecords: number;
    notes: string[];
  };
};

export type EmpireLegacyCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: LegacyValidationReport["decision"] | null;
  totalLegacyRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};
