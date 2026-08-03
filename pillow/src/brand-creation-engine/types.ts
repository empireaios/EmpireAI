/** PILLOW-BCE-001 — Brand Creation Engine types (X1-05). */

import type {
  BCE_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { BrandCreationEngineConfiguration } from "./configuration.js";

export type BrandCreationEngineVersion = "PILLOW-BCE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type BceCapability = (typeof BCE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type BrandEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BceCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
    businessOpportunityDiscovery: boolean;
    marketValidationEngine: boolean;
    businessModelGenerator: boolean;
  };
  metadataVersion: string;
};

export type BrandRecord = {
  brandId: string;
  timestamp: string;
  businessModelReference: string;
  companyName: string;
  brandIdentity: string;
  brandPositioning: string;
  brandMessaging: string;
  brandValues: string;
  brandVoice: string;
  colourRecommendations: string;
  typographyRecommendations: string;
  brandGuidelineReference: string;
  identityFingerprint: string;
  structuralSignalOnly: true;
  fabricatedBrandFacts: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type BrandValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type BrandRunReport = {
  brandRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_brand"
    | "generate_company_name"
    | "generate_brand_identity"
    | "generate_brand_positioning"
    | "generate_brand_messaging"
    | "generate_brand_values"
    | "generate_brand_voice"
    | "generate_colour_recommendations"
    | "generate_typography_recommendations"
    | "generate_brand_guidelines";
  engineRecord: BrandEngineRecord;
  brandRecords: BrandRecord[];
  validation: BrandValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type BrandHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: BrandValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalBrandRecords: number;
  notes: string[];
};

export type BrandPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  brandsCreated: number;
  namingRuns: number;
  identityRuns: number;
  guidelineRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type BrandLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type BrandCreationEngineState = {
  engineVersion: BrandCreationEngineVersion;
  missionId: "X1-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: BrandCreationEngineConfiguration;
  latestReport: BrandRunReport | null;
  engineRecord: BrandEngineRecord | null;
  health: BrandHealthReport;
  performance: BrandPerformanceStats;
};

export type BrandCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: BrandValidationReport["decision"] | null;
  totalBrandRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectBrandCreationEngineInput = {
  forceReconnect?: boolean;
};

export type CreateBrandInput = {
  businessModelReference?: string;
  industry?: string;
  companyNameHint?: string;
  validated?: boolean;
};

export type BrandActionInput = {
  brandId?: string;
  businessModelReference?: string;
  industry?: string;
  validated?: boolean;
};
