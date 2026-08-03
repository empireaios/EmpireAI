/** PILLOW-CIE-001 — Country Intelligence Engine types (X4-02). */

import type {
  CIE_CAPABILITIES,
  ENGINE_STATUSES,
  EXPANSION_PRIORITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CountryIntelligenceEngineConfiguration } from "./configuration.js";

export type CountryIntelligenceEngineVersion = "PILLOW-CIE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type CieCapability = (typeof CIE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ExpansionPriority = (typeof EXPANSION_PRIORITIES)[number];

export type CountryIntelligenceRecord = {
  countryIntelligenceId: string;
  timestamp: string;
  country: string;
  marketSizeScore: number;
  economicScore: number;
  commerceReadinessScore: number;
  operationalFeasibilityScore: number;
  expansionPriority: ExpansionPriority;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  structuralSignalOnly: true;
};

export type CountryIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CieCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    globalExpansionFramework: boolean;
  };
  metadataVersion: string;
};

export type CountryRecommendation = {
  recommendationId: string;
  timestamp: string;
  country: string;
  recommendationSummary: string;
  expansionPriority: ExpansionPriority;
  compositeScore: number;
  structuralSignalOnly: true;
  neverRecommendUsingUnvalidatedCountryData: true;
};

export type CountryValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CieRunReport = {
  countryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "evaluate_country"
    | "monitor_economic_indicators"
    | "analyze_market"
    | "assess_commerce_readiness"
    | "rank_countries"
    | "recommend_countries"
    | "diagnostics";
  engineRecord: CountryIntelligenceEngineRecord;
  countryRecords: CountryIntelligenceRecord[];
  recommendations: CountryRecommendation[];
  validation: CountryValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CieHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CountryValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCountryRecords: number;
  highPriorityCount: number;
  averageCompositeScore: number;
  notes: string[];
};

export type CiePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  countryEvaluations: number;
  economicMonitors: number;
  marketAnalyses: number;
  readinessAssessments: number;
  rankingsRun: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CountryIntelligenceEngineState = {
  engineVersion: CountryIntelligenceEngineVersion;
  missionId: "X4-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: CountryIntelligenceEngineConfiguration;
  latestReport: CieRunReport | null;
  engineRecord: CountryIntelligenceEngineRecord | null;
  health: CieHealthReport;
  performance: CiePerformanceStats;
};

export type CieCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: CountryValidationReport["decision"] | null;
  totalCountryRecords: number;
  highPriorityCount: number;
  averageCompositeScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type CieLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectCountryIntelligenceEngineInput = Record<string, unknown>;

export type CountryEvaluationInput = {
  country?: string;
  marketSizeHint?: number;
  economicHint?: number;
  purchasingPowerHint?: number;
  competitiveLandscapeHint?: number;
  easeOfDoingBusinessHint?: number;
  commerceReadinessHint?: number;
  operationalFeasibilityHint?: number;
  validated?: boolean;
};

/** Alias used by controller/engine public surface. */
export type CountryAnalysisInput = CountryEvaluationInput;

export type RunCieDiagnosticsInput = Record<string, unknown>;
