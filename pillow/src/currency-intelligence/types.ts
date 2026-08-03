/** PILLOW-CUR-001 — Currency Intelligence types (X4-05). */

import type {
  CUR_CAPABILITIES,
  ENGINE_STATUSES,
  EXCHANGE_RATE_SOURCES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  REGIONAL_PRICING_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CurrencyIntelligenceConfiguration } from "./configuration.js";

export type CurrencyIntelligenceVersion = "PILLOW-CUR-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type CurCapability = (typeof CUR_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type RegionalPricingStatus = (typeof REGIONAL_PRICING_STATUSES)[number];
export type ExchangeRateSource = (typeof EXCHANGE_RATE_SOURCES)[number];

export type CurrencyIntelligenceRecord = {
  currencyIntelligenceId: string;
  timestamp: string;
  companyReference: string;
  currencyCode: string;
  exchangeRateSource: ExchangeRateSource;
  regionalPricingStatus: RegionalPricingStatus;
  exchangeRateTimestamp: string;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  exchangeRateToUsd: number;
  fluctuationPercent: number;
  preferenceConfidence: number;
  anomalyScore: number;
  structuralSignalOnly: true;
  neverPerformFinancialConversionsUsingUnvalidatedExchangeData: true;
};

export type CurrencyIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CurCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    globalExpansionFramework: boolean;
    countryIntelligenceEngine: boolean;
    localizationEngine: boolean;
    languageIntelligence: boolean;
  };
  metadataVersion: string;
};

export type CurrencyRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  currencyCode: string;
  exchangeRateSource: ExchangeRateSource;
  recommendationSummary: string;
  structuralSignalOnly: true;
  neverPerformFinancialConversionsUsingUnvalidatedExchangeData: true;
};

export type CurrencyValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CurRunReport = {
  currencyRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_currencies"
    | "detect_preference"
    | "convert_price"
    | "refresh_exchange_rates"
    | "monitor_fluctuations"
    | "regional_pricing"
    | "detect_anomalies"
    | "recommend_currency"
    | "diagnostics";
  engineRecord: CurrencyIntelligenceEngineRecord;
  currencyRecords: CurrencyIntelligenceRecord[];
  recommendations: CurrencyRecommendation[];
  validation: CurrencyValidationReport;
  durationMs: number;
  metadataVersion: string;
  convertedAmount?: number | null;
};

export type CurHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CurrencyValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCurrencyRecords: number;
  anomalyCount: number;
  averageFluctuationPercent: number;
  notes: string[];
};

export type CurPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  currencyManagementOps: number;
  preferenceDetections: number;
  conversions: number;
  exchangeRateRefreshes: number;
  fluctuationMonitors: number;
  regionalPricingOps: number;
  anomalyDetections: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CurrencyIntelligenceEngineState = {
  engineVersion: CurrencyIntelligenceVersion;
  missionId: "X4-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: CurrencyIntelligenceConfiguration;
  latestReport: CurRunReport | null;
  engineRecord: CurrencyIntelligenceEngineRecord | null;
  health: CurHealthReport;
  performance: CurPerformanceStats;
};

export type CurCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: CurrencyValidationReport["decision"] | null;
  totalCurrencyRecords: number;
  anomalyCount: number;
  averageFluctuationPercent: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type CurLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectCurrencyIntelligenceInput = Record<string, unknown>;

export type CurrencyAnalysisInput = {
  companyReference?: string;
  currencyCode?: string;
  targetCurrencyCode?: string;
  amount?: number;
  region?: string;
  rateHint?: number;
  fluctuationHint?: number;
  preferenceHint?: number;
  anomalyHint?: number;
  exchangeDataValidated?: boolean;
  validated?: boolean;
};

export type RunCurDiagnosticsInput = {
  companyReference?: string;
  currencyCode?: string;
};
