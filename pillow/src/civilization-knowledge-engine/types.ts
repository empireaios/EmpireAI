import type { CivilizationKnowledgeEngineConfiguration } from "./configuration.js";
import type {
  CKE_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  IMPACT_LEVELS,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type BusinessImpact = (typeof IMPACT_LEVELS)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type CivilizationKnowledgeCapability = (typeof CKE_CAPABILITIES)[number];

export type CivilizationKnowledgeInput = {
  knowledgeCategory?: string;
  sourceDomain?: string;
  strategicRelevanceScore?: number;
  businessImpact?: BusinessImpact;
  recommendationSummary?: string;
  validated?: boolean;
  integrateIntoDecisionMakingAutomatically?: boolean;
  emergingHint?: boolean;
};

export type CivilizationKnowledgeRecord = {
  knowledgeRecordId: string;
  timestamp: string;
  knowledgeCategory: string;
  sourceDomain: string;
  strategicRelevanceScore: number;
  businessImpact: BusinessImpact;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  structuralSignalOnly: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverIntegrateUnvalidatedExternalKnowledgeIntoEnterpriseDecisionMakingAutomatically: true;
  integratedUnvalidatedExternalKnowledgeAutomatically: false;
  preserveKnowledgeTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  knowledgeTraceId: string;
  maskSensitiveValues: true;
};

export type CivilizationKnowledgeRecommendation = {
  recommendationId: string;
  timestamp: string;
  knowledgeRecordId: string;
  recommendationSummary: string;
  strategicRelevanceScore: number;
  structuralSignalOnly: true;
  neverIntegrateUnvalidatedExternalKnowledgeIntoEnterpriseDecisionMakingAutomatically: true;
  integratedUnvalidatedExternalKnowledgeAutomatically: false;
};

export type CivilizationKnowledgeValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CivilizationKnowledgeEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CKE-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CivilizationKnowledgeCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    empireIntelligenceFramework: boolean;
    empireKnowledgeEngine: boolean;
    grandKingAdvisoryEngine: boolean;
  };
  metadataVersion: string;
};

export type CivilizationKnowledgeRunReport = {
  knowledgeRunReportId: string;
  runTimestamp: string;
  action: string;
  engineRecord: CivilizationKnowledgeEngineRecord;
  knowledgeRecords: CivilizationKnowledgeRecord[];
  recommendations: CivilizationKnowledgeRecommendation[];
  validation: CivilizationKnowledgeValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CivilizationKnowledgeState = {
  engineVersion: "PILLOW-CKE-001";
  missionId: "X5-16";
  status: EngineStatus;
  initializedAt: string;
  configuration: CivilizationKnowledgeEngineConfiguration;
  latestReport: CivilizationKnowledgeRunReport | null;
  engineRecord: CivilizationKnowledgeEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: CivilizationKnowledgeValidationReport["decision"] | null;
    totalKnowledgeRecords: number;
    notes: string[];
  };
};

export type CivilizationKnowledgeCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: CivilizationKnowledgeValidationReport["decision"] | null;
  totalKnowledgeRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};
