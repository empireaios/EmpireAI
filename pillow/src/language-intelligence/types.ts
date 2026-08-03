/** PILLOW-LI-001 — Language Intelligence types (X4-04). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  LI_CAPABILITIES,
  OPERATIONAL_STATES,
  SUPPORTED_LANGUAGE_STATUSES,
  TRANSLATION_CATEGORIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { LanguageIntelligenceConfiguration } from "./configuration.js";

export type LanguageIntelligenceVersion = "PILLOW-LI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type LiCapability = (typeof LI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type TranslationCategory = (typeof TRANSLATION_CATEGORIES)[number];
export type SupportedLanguageStatus = (typeof SUPPORTED_LANGUAGE_STATUSES)[number];

export type LanguageIntelligenceRecord = {
  languageIntelligenceId: string;
  timestamp: string;
  companyReference: string;
  language: string;
  translationCategory: TranslationCategory;
  translationQualityScore: number;
  supportedLanguageStatus: SupportedLanguageStatus;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  detectedPreferenceConfidence: number;
  terminologyConsistencyScore: number;
  canonicalSourcePreserved: true;
  structuralSignalOnly: true;
  neverOverwriteCanonicalSourceContentAutomatically: true;
};

export type LanguageIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LiCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    globalExpansionFramework: boolean;
    countryIntelligenceEngine: boolean;
    localizationEngine: boolean;
  };
  metadataVersion: string;
};

export type LanguageRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  language: string;
  translationCategory: TranslationCategory;
  translationQualityScore: number;
  recommendationSummary: string;
  structuralSignalOnly: true;
  neverOverwriteCanonicalSourceContentAutomatically: true;
};

export type LanguageValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LiRunReport = {
  languageRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "detect_language"
    | "manage_supported_languages"
    | "translate_customer_facing"
    | "translate_operational"
    | "translate_ai_workforce"
    | "maintain_terminology"
    | "analyze_quality"
    | "detect_unsupported"
    | "recommend_language"
    | "diagnostics";
  engineRecord: LanguageIntelligenceEngineRecord;
  languageRecords: LanguageIntelligenceRecord[];
  recommendations: LanguageRecommendation[];
  validation: LanguageValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LiHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: LanguageValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalLanguageRecords: number;
  unsupportedCount: number;
  averageQualityScore: number;
  notes: string[];
};

export type LiPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  languageDetections: number;
  customerTranslations: number;
  operationalTranslations: number;
  aiWorkforceTranslations: number;
  terminologyOperations: number;
  qualityAnalyses: number;
  unsupportedDetections: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type LanguageIntelligenceEngineState = {
  engineVersion: LanguageIntelligenceVersion;
  missionId: "X4-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: LanguageIntelligenceConfiguration;
  latestReport: LiRunReport | null;
  engineRecord: LanguageIntelligenceEngineRecord | null;
  health: LiHealthReport;
  performance: LiPerformanceStats;
};

export type LiCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: LanguageValidationReport["decision"] | null;
  totalLanguageRecords: number;
  unsupportedCount: number;
  averageQualityScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type LiLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectLanguageIntelligenceInput = Record<string, unknown>;

export type LanguageAnalysisInput = {
  companyReference?: string;
  language?: string;
  sampleText?: string;
  translationCategory?: TranslationCategory;
  qualityHint?: number;
  preferenceHint?: number;
  terminologyHint?: number;
  validated?: boolean;
};

export type RunLiDiagnosticsInput = {
  companyReference?: string;
  language?: string;
};
