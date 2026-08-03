import type { CollectiveReasoningEngineConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  REASONING_MODES,
  CORE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ReasoningMode = (typeof REASONING_MODES)[number];
export type CollectiveReasoningCapability = (typeof CORE_CAPABILITIES)[number];

/** Input for Q0-13 — multi-worker reasoning coordination only. */
export type CollectiveReasoningEngineInput = {
  executiveQuestion: string;
  businessContext?: string | null;
  preferredExpertise?: string[];
  preferredParticipantIds?: string[];
  reasoningModes?: Array<ReasoningMode | string>;
  minPanelSize?: number;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWork?: boolean;
  assignWorkersPermanently?: boolean;
  replacePillow?: boolean;
  overrideGrandKing?: boolean;
  approveActions?: boolean;
};

export type ReasoningParticipant = {
  workerId: string;
  workerName: string;
  expertise: string[];
  stanceBias: "supportive" | "neutral" | "challenging";
  authorityWeight: number;
};

export type IndependentOpinion = {
  workerId: string;
  workerName: string;
  position: string;
  confidence: number;
  assumptions: string[];
  evidence: string[];
};

export type ChallengeRaised = {
  challengerId: string;
  targetWorkerId: string;
  assumption: string;
  challenge: string;
  severity: "low" | "medium" | "high";
};

export type MinorityOpinion = {
  workerId: string;
  workerName: string;
  position: string;
  rationale: string;
};

/** Machine-readable Reasoning Record (Q0-13). */
export type ReasoningRecord = {
  reasoningId: string;
  timestamp: string;
  executiveQuestion: string;
  participants: string[];
  independentOpinions: IndependentOpinion[];
  challengesRaised: ChallengeRaised[];
  supportingEvidence: string[];
  consensusPosition: string;
  minorityOpinions: MinorityOpinion[];
  confidenceScore: number;
  recommendedAction: string;
  metadataVersion: string;
  reasoningTraceId: string;
  modesApplied: string[];
  requiredExpertise: string[];
  conflictsDetected: number;
  debateSummary: string;
  validationStatus: ValidationStatus;
  /** Explicit Q0-13 boundaries. */
  neverExecuteWork: true;
  neverAssignWorkersPermanently: true;
  neverReplacePillow: true;
  neverOverrideGrandKing: true;
  neverApproveActions: true;
  workExecuted: false;
  workersAssignedPermanently: false;
  pillowReplaced: false;
  grandKingOverridden: false;
  actionsApproved: false;
  preserveReasoningTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ReasoningValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CollectiveReasoningEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CORE-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CollectiveReasoningCapability[];
  totalReasoningRecords: number;
  lastConfidenceScore: number | null;
  metadataVersion: string;
};

export type CollectiveReasoningEngineRunReport = {
  reasoningRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "reason"
    | "identify_expertise"
    | "assemble_panel"
    | "collect_opinions"
    | "detect_conflicts"
    | "debate"
    | "build_consensus"
    | "recommend"
    | "list_records"
    | "validate_reasoning"
    | "diagnostics";
  engineRecord: CollectiveReasoningEngineRecord;
  records: ReasoningRecord[];
  participants: ReasoningParticipant[];
  requiredExpertise: string[];
  modesApplied: string[];
  validation: ReasoningValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CollectiveReasoningEngineState = {
  engineVersion: "PILLOW-CORE-001";
  missionId: "Q0-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: CollectiveReasoningEngineConfiguration;
  latestReport: CollectiveReasoningEngineRunReport | null;
  engineRecord: CollectiveReasoningEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalReasoningRecords: number;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type CollectiveReasoningEngineCockpitSnapshot = {
  missionId: "Q0-13";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalReasoningRecords: number;
  latestReasoningId: string | null;
  lastConfidenceScore: number | null;
  neverExecuteWork: true;
  neverAssignWorkersPermanently: true;
  neverReplacePillow: true;
  neverOverrideGrandKing: true;
  neverApproveActions: true;
};
