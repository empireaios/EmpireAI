import type { BusinessStateManagerConfiguration } from "./configuration.js";
import type {
  BUSINESS_HEALTH_STATUSES,
  BUSINESS_LIFECYCLE_STATES,
  BUSINESS_PHASES,
  BSM_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type BusinessLifecycleState = (typeof BUSINESS_LIFECYCLE_STATES)[number];
export type BusinessHealthStatus = (typeof BUSINESS_HEALTH_STATUSES)[number];
export type BusinessPhase = (typeof BUSINESS_PHASES)[number];
export type BusinessStateManagerCapability = (typeof BSM_CAPABILITIES)[number];

export type BusinessProgressSummary = {
  activeMissions: number;
  completedMissions: number;
  pendingApprovals: number;
  currentBlockers: number;
};

export type BusinessDependencies = {
  requiredInfrastructure: string[];
  requiredApis: string[];
  requiredWorkforceCategories: string[];
  requiredApprovals: string[];
};

/** Machine-readable authoritative business state object (Q0-03). */
export type BusinessState = {
  businessId: string;
  name: string;
  category: string;
  businessType: string;
  owner: string;
  currentState: BusinessLifecycleState;
  currentPhase: BusinessPhase;
  healthStatus: BusinessHealthStatus;
  progressSummary: BusinessProgressSummary;
  activeMissions: string[];
  completedMissions: string[];
  pendingApprovals: string[];
  blockers: string[];
  dependencies: BusinessDependencies;
  lastUpdateTimestamp: string;
  version: number;
  metadataVersion: string;
  stateTraceId: string;
  validationStatus: ValidationStatus;
  /** Explicit Q0-03 boundaries. */
  neverExecuteMissions: true;
  neverAssignWorkers: true;
  neverApproveActions: true;
  neverLaunchBusinesses: true;
  neverMakeStrategicDecisions: true;
  missionsExecuted: false;
  workersAssigned: false;
  actionsApproved: false;
  businessLaunchedByManager: false;
  strategicDecisionMade: false;
  preserveStateTraceability: true;
  preserveAuditability: true;
  preserveStateIntegrity: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type RegisterBusinessInput = {
  businessId?: string;
  name: string;
  category?: string;
  businessType?: string;
  owner?: string;
  currentState?: BusinessLifecycleState;
  currentPhase?: BusinessPhase;
  healthStatus?: BusinessHealthStatus;
  activeMissions?: string[];
  completedMissions?: string[];
  pendingApprovals?: string[];
  blockers?: string[];
  dependencies?: Partial<BusinessDependencies>;
  validated?: boolean;
  executeMissions?: boolean;
  assignWorkers?: boolean;
  approveActions?: boolean;
  launchBusinesses?: boolean;
  makeStrategicDecisions?: boolean;
};

export type UpdateBusinessStateInput = {
  businessId: string;
  currentState?: BusinessLifecycleState;
  currentPhase?: BusinessPhase;
  healthStatus?: BusinessHealthStatus;
  activeMissions?: string[];
  completedMissions?: string[];
  pendingApprovals?: string[];
  blockers?: string[];
  dependencies?: Partial<BusinessDependencies>;
  validated?: boolean;
  executeMissions?: boolean;
  assignWorkers?: boolean;
  approveActions?: boolean;
  launchBusinesses?: boolean;
  makeStrategicDecisions?: boolean;
};

export type QueryBusinessStateInput = {
  businessId?: string;
  currentState?: BusinessLifecycleState;
  healthStatus?: BusinessHealthStatus;
  category?: string;
  validated?: boolean;
};

export type BusinessStateManagerInput =
  | RegisterBusinessInput
  | UpdateBusinessStateInput
  | QueryBusinessStateInput
  | Record<string, unknown>;

export type BusinessStateValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type BusinessStateManagerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-BSM-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BusinessStateManagerCapability[];
  totalBusinesses: number;
  activeBusinessCount: number;
  metadataVersion: string;
};

export type BusinessStateManagerRunReport = {
  stateRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_business"
    | "update_business_state"
    | "update_health"
    | "update_progress"
    | "query_business_state"
    | "list_businesses"
    | "validate_consistency"
    | "diagnostics";
  engineRecord: BusinessStateManagerEngineRecord;
  businesses: BusinessState[];
  validation: BusinessStateValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type BusinessStateManagerState = {
  engineVersion: "PILLOW-BSM-001";
  missionId: "Q0-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: BusinessStateManagerConfiguration;
  latestReport: BusinessStateManagerRunReport | null;
  engineRecord: BusinessStateManagerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalBusinesses: number;
    activeBusinessCount: number;
    notes: string[];
  };
};

export type BusinessStateManagerCockpitSnapshot = {
  missionId: "Q0-03";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalBusinesses: number;
  activeBusinessCount: number;
  neverExecuteMissions: true;
  neverAssignWorkers: true;
  neverApproveActions: true;
  neverLaunchBusinesses: true;
  neverMakeStrategicDecisions: true;
};
