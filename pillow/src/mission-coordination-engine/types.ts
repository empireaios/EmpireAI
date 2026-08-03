import type { MissionCoordinationEngineConfiguration } from "./configuration.js";
import type {
  COMPLETION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MCE_CAPABILITIES,
  MISSION_PHASES,
  MISSION_STATES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type MissionStatus = (typeof MISSION_STATES)[number];
export type MissionPhase = (typeof MISSION_PHASES)[number];
export type CompletionStatus = (typeof COMPLETION_STATUSES)[number];
export type MissionCoordinationEngineCapability = (typeof MCE_CAPABILITIES)[number];

export type ApprovalCheckpoint = {
  checkpointId: string;
  name: string;
  required: boolean;
  approved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
};

export type WorkerDependency = {
  workerId: string;
  dependsOn: string[];
  satisfied: boolean;
};

/** Machine-readable Mission Record (Q0-25). */
export type MissionRecord = {
  missionId: string;
  timestamp: string;
  businessId: string;
  missionName: string;
  missionOwner: string;
  missionStatus: MissionStatus | string;
  currentPhase: MissionPhase | string;
  assignedWorkers: string[];
  dependencies: WorkerDependency[];
  approvalCheckpoints: ApprovalCheckpoint[];
  progress: number;
  blockers: string[];
  completionStatus: CompletionStatus;
  metadataVersion: string;
  missionTraceId: string;
  validationStatus: ValidationStatus;
  stalled: boolean;
  phaseHistory: string[];
  /** Explicit Q0-25 boundaries. */
  neverExecuteWorkerLogic: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplaceExecutivePlanner: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerLogicExecuted: false;
  workforceOrchestratorReplaced: false;
  executivePlannerReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveMissionTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-25 — coordinate lifecycle only. */
export type MissionCoordinationEngineInput = {
  missionId?: string | null;
  businessId?: string | null;
  missionName?: string | null;
  missionOwner?: string | null;
  missionStatus?: MissionStatus | string | null;
  currentPhase?: MissionPhase | string | null;
  assignedWorkers?: string[];
  dependencies?: Array<{ workerId: string; dependsOn?: string[] }>;
  approvalCheckpoints?: Array<{ checkpointId?: string; name: string; required?: boolean }>;
  progress?: number | null;
  blockers?: string[];
  checkpointId?: string | null;
  approvedBy?: string | null;
  forceBlocked?: boolean;
  forceStalled?: boolean;
  stallIdleMs?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerLogic?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  replaceExecutivePlanner?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type MissionCoordinationEngineValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MissionCoordinationEngineEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-MCE-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: MissionCoordinationEngineCapability[];
  totalMissionRecords: number;
  activeMissions: number;
  blockedMissions: number;
  completedMissions: number;
  lastPhase: MissionPhase | string | null;
  metadataVersion: string;
};

export type MissionCoordinationEngineRunReport = {
  missionRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_plan"
    | "create"
    | "advance_phase"
    | "track_dependencies"
    | "handle_approval"
    | "detect_blocked"
    | "detect_stalled"
    | "complete"
    | "close"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: MissionCoordinationEngineEngineRecord;
  records: MissionRecord[];
  currentPhase: MissionPhase | string | null;
  missionStatus: MissionStatus | string | null;
  completionStatus: CompletionStatus | null;
  validation: MissionCoordinationEngineValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type MissionCoordinationEngineState = {
  engineVersion: "PILLOW-MCE-001";
  missionId: "Q0-25";
  status: EngineStatus;
  initializedAt: string;
  configuration: MissionCoordinationEngineConfiguration;
  latestReport: MissionCoordinationEngineRunReport | null;
  engineRecord: MissionCoordinationEngineEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalMissionRecords: number;
    activeMissions: number;
    blockedMissions: number;
    completedMissions: number;
    lastPhase: MissionPhase | string | null;
    notes: string[];
  };
};

export type MissionCoordinationEngineCockpitSnapshot = {
  missionId: "Q0-25";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalMissionRecords: number;
  latestMissionId: string | null;
  activeMissions: number;
  neverExecuteWorkerLogic: true;
  neverReplaceWorkforceOrchestrator: true;
  neverReplaceExecutivePlanner: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
