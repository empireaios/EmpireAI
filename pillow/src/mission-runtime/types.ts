import type { MissionRuntimeConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  MISSION_LIFECYCLE_STATES,
  MISSION_TYPES,
  MSR_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type MissionLifecycleState = (typeof MISSION_LIFECYCLE_STATES)[number];
export type MissionType = (typeof MISSION_TYPES)[number];
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type MsrCapability = (typeof MSR_CAPABILITIES)[number];

export type DependencyRef = {
  missionId: string;
  mode: "parent" | "sequential" | "parallel";
  satisfied: boolean;
};

export type LifecycleTransition = {
  transitionId: string;
  missionId: string;
  fromState: MissionLifecycleState;
  toState: MissionLifecycleState;
  timestamp: string;
  reason: string;
  fabricated: false;
  metadataVersion: string;
};

export type Checkpoint = {
  checkpointId: string;
  missionId: string;
  label: string;
  state: MissionLifecycleState;
  timestamp: string;
  payload: Record<string, unknown>;
  metadataVersion: string;
};

export type RetryRecord = {
  retryId: string;
  missionId: string;
  attempt: number;
  timestamp: string;
  fromState: MissionLifecycleState;
  toState: MissionLifecycleState;
  reason: string;
  metadataVersion: string;
};

export type RecoveryRecord = {
  recoveryId: string;
  missionId: string;
  timestamp: string;
  fromState: MissionLifecycleState;
  toState: MissionLifecycleState;
  checkpointId: string | null;
  reason: string;
  metadataVersion: string;
};

export type MissionInstance = {
  missionId: string;
  missionType: MissionType;
  missionName: string;
  parentMissionId: string | null;
  dependencyMissionIds: string[];
  mode: "sequential" | "parallel" | "standalone";
  currentStatus: MissionLifecycleState;
  createdAt: string;
  updatedAt: string;
  workers: string[];
  highRisk: boolean;
  pillowConfirmed: boolean;
  grandKingApproved: boolean;
  retryCount: number;
  progress: number;
  traceabilityRefs: string[];
  metadataVersion: string;
  structuralSignalOnly: true;
  fabricated: false;
};

export type ExecutionTimelineEntry = {
  entryId: string;
  timestamp: string;
  label: string;
  state: MissionLifecycleState | string;
  notes: string[];
};

export type MissionRuntimeReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  missionId: string;
  missionType: MissionType;
  currentStatus: MissionLifecycleState;
  executionTimeline: ExecutionTimelineEntry[];
  progress: number;
  activeWorkers: string[];
  dependencies: DependencyRef[];
  checkpoints: Checkpoint[];
  retryHistory: RetryRecord[];
  recoveryHistory: RecoveryRecord[];
  failureSummary: string | null;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1004: boolean;
  neverReplaceWorkerLogic: true;
  neverReplaceOrchestrationLogic: true;
  neverExecuteUnauthorisedMissions: true;
  neverFabricateMissionState: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1004OrLater: true;
  preserveCompleteTraceability: true;
  preserveMissionHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type Q1004ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "mission-runtime";
  missionId: "Q10-03";
  consumerMissionId: "Q10-04";
  exposedFields: string[];
  lifecycleStateCatalog: string[];
  missionTypeCatalog: string[];
  notes: string[];
  neverImplementQ1004OrLater: true;
  structuralSignalOnly: true;
};

export type MsrInput = {
  missionId?: string;
  missionType?: MissionType;
  missionName?: string;
  parentMissionId?: string;
  dependencyMissionIds?: string[];
  mode?: "sequential" | "parallel" | "standalone";
  highRisk?: boolean;
  pillowConfirmed?: boolean;
  grandKingApproved?: boolean;
  validated?: boolean;
  forceFail?: boolean;
  workers?: string[];
  checkpointLabel?: string;
  completeAfterRun?: boolean;
  fabricateState?: boolean;
  replaceWorkerLogic?: boolean;
  replaceOrchestrationLogic?: boolean;
  executeUnauthorisedMissions?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  implementQ1004OrLater?: boolean;
  targetMissionId?: string | null;
};

export type MsrValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MsrRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: MsrValidationReport;
  mission: MissionInstance | null;
  missionRuntimeReport: MissionRuntimeReport | null;
  transitions: LifecycleTransition[];
  errors: string[];
  warnings: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type MsrEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalMissions: number;
  totalReports: number;
  lastReportId: string | null;
  supportedCapabilities: MsrCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type MsrDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalMissions: number;
  totalTransitions: number;
  totalCheckpoints: number;
  totalReports: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type MissionRuntimeState = {
  engineVersion: "PILLOW-MSR-001";
  missionId: "Q10-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: MissionRuntimeConfiguration;
  latestReport: MsrRunReport | null;
  engineRecord: MsrEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalMissions: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type MissionRuntimeCockpitSnapshot = {
  missionId: "Q10-03";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalMissions: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverReplaceWorkerLogic: true;
  neverReplaceOrchestrationLogic: true;
  neverExecuteUnauthorisedMissions: true;
  neverFabricateMissionState: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1004OrLater: true;
  structuralSignalOnly: true;
};
