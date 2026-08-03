/** PILLOW-CCRE-001 — Cross-Company Resource Engine types (X2-11). */

import type {
  ALLOCATION_STATUSES,
  CCRE_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  RESOURCE_CATEGORIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CrossCompanyResourceEngineConfiguration } from "./configuration.js";

export type CrossCompanyResourceEngineVersion = "PILLOW-CCRE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];
export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];
export type CcreCapability = (typeof CCRE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ResourceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CcreCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    multiCompanyRegistry: boolean;
    portfolioPerformanceEngine: boolean;
    crossBusinessKnowledgeEngine: boolean;
    capitalDistributionEngine: boolean;
    portfolioIntelligenceCertified: boolean;
  };
  metadataVersion: string;
};

export type ResourceAllocationRecord = {
  resourceAllocationId: string;
  timestamp: string;
  resourceIdentifier: string;
  resourceCategory: ResourceCategory;
  owningCompany: string;
  assignedCompany: string;
  allocationStatus: AllocationStatus;
  utilizationScore: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  protectedResource: boolean;
  authorizedAllocation: boolean;
  structuralSignalOnly: true;
  sensitiveEnterpriseData: false;
};

export type ResourceConflictSignal = {
  conflictId: string;
  timestamp: string;
  resourceIdentifier: string;
  conflictType: "double_allocation" | "capacity_overrun" | "protected_without_auth" | "sync_failure";
  companiesInvolved: string[];
  severity: "low" | "medium" | "high";
  rationale: string;
  structuralSignalOnly: true;
};

export type ResourceRecommendation = {
  recommendationId: string;
  timestamp: string;
  resourceIdentifier: string | null;
  companyReference: string | null;
  recommendationType:
    | "share"
    | "reallocate"
    | "release_idle"
    | "resolve_conflict"
    | "authorize_protected"
    | "manual_review";
  rationale: string;
  priority: "low" | "medium" | "high";
  structuralSignalOnly: true;
};

export type ResourceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ResourceRunReport = {
  resourceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_resource"
    | "allocate_resource"
    | "detect_idle"
    | "detect_conflicts"
    | "optimize"
    | "recommend"
    | "diagnostics";
  engineRecord: ResourceEngineRecord;
  resourceRecords: ResourceAllocationRecord[];
  conflictSignals: ResourceConflictSignal[];
  recommendations: ResourceRecommendation[];
  validation: ResourceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ResourceHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ResourceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalResourceRecords: number;
  idleResources: number;
  conflictCount: number;
  notes: string[];
};

export type ResourcePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  resourcesRegistered: number;
  allocationsProposed: number;
  idleDetections: number;
  conflictDetections: number;
  optimizationsRun: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ResourceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type CrossCompanyResourceEngineState = {
  engineVersion: CrossCompanyResourceEngineVersion;
  missionId: "X2-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: CrossCompanyResourceEngineConfiguration;
  latestReport: ResourceRunReport | null;
  engineRecord: ResourceEngineRecord | null;
  health: ResourceHealthReport;
  performance: ResourcePerformanceStats;
};

export type ResourceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ResourceValidationReport["decision"] | null;
  totalResourceRecords: number;
  idleResources: number;
  conflictCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectCrossCompanyResourceInput = {
  forceReconnect?: boolean;
};

export type RegisterResourceInput = {
  resourceIdentifier: string;
  resourceCategory: ResourceCategory;
  owningCompany: string;
  utilizationScore?: number;
  protectedResource?: boolean;
  authorizedAllocation?: boolean;
  validated?: boolean;
};

export type AllocateResourceInput = {
  resourceIdentifier: string;
  assignedCompany: string;
  utilizationScore?: number;
  authorizedAllocation?: boolean;
  validated?: boolean;
};

export type DetectIdleResourcesInput = {
  validated?: boolean;
};

export type DetectResourceConflictsInput = {
  validated?: boolean;
};

export type OptimizeResourcesInput = {
  validated?: boolean;
};

export type RecommendResourceInput = {
  companyReference?: string;
  resourceIdentifier?: string;
};

export type RunResourceDiagnosticsInput = {
  companyReference?: string;
};
