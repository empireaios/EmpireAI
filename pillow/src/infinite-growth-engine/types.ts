import type { InfiniteGrowthEngineConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  IGE_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type InfiniteGrowthCapability = (typeof IGE_CAPABILITIES)[number];

export type InfiniteGrowthInput = {
  enterpriseScope?: string;
  growthCategory?: string;
  sustainabilityScore?: number;
  governanceScore?: number;
  operationalScore?: number;
  growthPriority?: number;
  recommendationSummary?: string;
  validated?: boolean;
  sacrificeGovernanceForGrowth?: boolean;
  reduceOperationalQualityForGrowth?: boolean;
  constraintHint?: boolean;
  governanceRiskHint?: boolean;
  operationalRiskHint?: boolean;
};

export type GrowthRecord = {
  growthRecordId: string;
  timestamp: string;
  enterpriseScope: string;
  growthCategory: string;
  sustainabilityScore: number;
  governanceScore: number;
  operationalScore: number;
  growthPriority: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  structuralSignalOnly: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverSacrificeConstitutionalGovernanceForGrowth: true;
  neverReduceOperationalQualityToIncreaseGrowth: true;
  sacrificedConstitutionalGovernanceForGrowth: false;
  reducedOperationalQualityForGrowth: false;
  preserveGrowthTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  growthTraceId: string;
  maskSensitiveValues: true;
};

export type GrowthRecommendation = {
  recommendationId: string;
  timestamp: string;
  growthRecordId: string;
  recommendationSummary: string;
  growthPriority: number;
  structuralSignalOnly: true;
  neverSacrificeConstitutionalGovernanceForGrowth: true;
  neverReduceOperationalQualityToIncreaseGrowth: true;
  sacrificedConstitutionalGovernanceForGrowth: false;
  reducedOperationalQualityForGrowth: false;
};

export type GrowthValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type InfiniteGrowthEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-IGE-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: InfiniteGrowthCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    empireIntelligenceFramework: boolean;
    empirePerformanceGuardian: boolean;
    autonomousEmpireEvolution: boolean;
  };
  metadataVersion: string;
};

export type InfiniteGrowthRunReport = {
  growthRunReportId: string;
  runTimestamp: string;
  action: string;
  engineRecord: InfiniteGrowthEngineRecord;
  growthRecords: GrowthRecord[];
  recommendations: GrowthRecommendation[];
  validation: GrowthValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type InfiniteGrowthState = {
  engineVersion: "PILLOW-IGE-001";
  missionId: "X5-19";
  status: EngineStatus;
  initializedAt: string;
  configuration: InfiniteGrowthEngineConfiguration;
  latestReport: InfiniteGrowthRunReport | null;
  engineRecord: InfiniteGrowthEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: GrowthValidationReport["decision"] | null;
    totalGrowthRecords: number;
    notes: string[];
  };
};

export type InfiniteGrowthCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: GrowthValidationReport["decision"] | null;
  totalGrowthRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};
