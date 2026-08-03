import type { AutonomousEmpireEvolutionConfiguration } from "./configuration.js";
import type {
  AEE_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type AutonomousEmpireEvolutionCapability = (typeof AEE_CAPABILITIES)[number];

export type AutonomousEmpireEvolutionInput = {
  evolutionCategory?: string;
  targetComponent?: string;
  currentState?: string;
  proposedState?: string;
  expectedImprovement?: number;
  priorityScore?: number;
  recommendationSummary?: string;
  validated?: boolean;
  approvedForArchitectureModification?: boolean;
  bypassConstitutionalGovernance?: boolean;
};

export type EvolutionRecord = {
  evolutionId: string;
  timestamp: string;
  evolutionCategory: string;
  targetComponent: string;
  currentState: string;
  proposedState: string;
  expectedImprovement: number;
  priorityScore: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  structuralSignalOnly: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverModifyGovernanceApprovedEnterpriseArchitectureAutomatically: true;
  neverBypassConstitutionalGovernance: true;
  approvedForArchitectureModification: false;
  preserveEvolutionTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  evolutionTraceId: string;
  maskSensitiveValues: true;
};

export type EvolutionRecommendation = {
  recommendationId: string;
  timestamp: string;
  evolutionId: string;
  recommendationSummary: string;
  priorityScore: number;
  structuralSignalOnly: true;
  neverModifyGovernanceApprovedEnterpriseArchitectureAutomatically: true;
  neverBypassConstitutionalGovernance: true;
  approvedForArchitectureModification: false;
};

export type EvolutionValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AutonomousEmpireEvolutionEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-AEE-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AutonomousEmpireEvolutionCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    empireIntelligenceFramework: boolean;
    empireSelfImprovementEngine: boolean;
    civilizationKnowledgeEngine: boolean;
  };
  metadataVersion: string;
};

export type AutonomousEmpireEvolutionRunReport = {
  evolutionRunReportId: string;
  runTimestamp: string;
  action: string;
  engineRecord: AutonomousEmpireEvolutionEngineRecord;
  evolutionRecords: EvolutionRecord[];
  recommendations: EvolutionRecommendation[];
  validation: EvolutionValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AutonomousEmpireEvolutionState = {
  engineVersion: "PILLOW-AEE-001";
  missionId: "X5-17";
  status: EngineStatus;
  initializedAt: string;
  configuration: AutonomousEmpireEvolutionConfiguration;
  latestReport: AutonomousEmpireEvolutionRunReport | null;
  engineRecord: AutonomousEmpireEvolutionEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: EvolutionValidationReport["decision"] | null;
    totalEvolutionRecords: number;
    notes: string[];
  };
};

export type AutonomousEmpireEvolutionCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: EvolutionValidationReport["decision"] | null;
  totalEvolutionRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};
