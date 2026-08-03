import type { ApprovalRouterConfiguration } from "./configuration.js";
import type {
  APPROVAL_LEVELS,
  APPROVAL_STATES,
  AR_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ApprovalLevel = (typeof APPROVAL_LEVELS)[number];
export type ApprovalState = (typeof APPROVAL_STATES)[number];
export type ApprovalRouterCapability = (typeof AR_CAPABILITIES)[number];

/** Input for Q0-06 — execution request for approval routing only. */
export type ApprovalRouterInput = {
  requestId?: string;
  requestedAction: string;
  requestSummary: string;
  relatedBusiness?: string | null;
  relatedMission?: string | null;
  riskHints?: string[];
  impactHints?: string[];
  policyHints?: string[];
  forceApprovalLevel?: ApprovalLevel;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  approveRequest?: boolean;
  executeRequest?: boolean;
  assignWorkers?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

/** Record an externally made outcome — router never invents approvals. */
export type RecordExternalOutcomeInput = {
  approvalId: string;
  status: Exclude<ApprovalState, "pending">;
  authority: "pillow" | "grand_king" | "external_system" | "requester";
  note?: string;
  validated?: boolean;
  approveRequest?: boolean;
  executeRequest?: boolean;
  assignWorkers?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type ExecutionGateInput = {
  approvalId?: string;
  requestId?: string;
  validated?: boolean;
  executeRequest?: boolean;
  approveRequest?: boolean;
  assignWorkers?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type ApprovalHistoryEntry = {
  entryId: string;
  timestamp: string;
  status: ApprovalState;
  actorRole: "system" | "router" | "external_authority";
  authority: string | null;
  note: string;
};

/** Machine-readable Approval Request (Q0-06). */
export type ApprovalRequest = {
  approvalId: string;
  timestamp: string;
  requestId: string;
  relatedBusiness: string | null;
  relatedMission: string | null;
  requestSummary: string;
  requestedAction: string;
  approvalLevel: ApprovalLevel;
  reasonApprovalIsRequired: string;
  riskAssessment: string[];
  expectedImpact: string[];
  currentStatus: ApprovalState;
  approvalHistory: ApprovalHistoryEntry[];
  metadataVersion: string;
  approvalTraceId: string;
  approvalRequired: boolean;
  executionAllowed: boolean;
  executionBlockedReason: string | null;
  policyRuleId: string | null;
  validationStatus: ValidationStatus;
  /** Explicit Q0-06 boundaries. */
  neverApproveRequests: true;
  neverExecuteRequests: true;
  neverAssignWorkers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  requestApprovedByRouter: false;
  requestExecutedByRouter: false;
  workersAssignedByRouter: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveApprovalTraceability: true;
  preserveAuditability: true;
  preserveApprovalIntegrity: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ExecutionGateResult = {
  gateId: string;
  timestamp: string;
  approvalId: string | null;
  requestId: string | null;
  executionAllowed: boolean;
  blocked: boolean;
  blockReason: string | null;
  approvalLevel: ApprovalLevel | null;
  currentStatus: ApprovalState | null;
  metadataVersion: string;
};

export type ApprovalValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ApprovalRouterEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-AR-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ApprovalRouterCapability[];
  totalRequests: number;
  pendingCount: number;
  metadataVersion: string;
};

export type ApprovalRouterRunReport = {
  approvalRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "evaluate_request"
    | "route_request"
    | "generate_approval_request"
    | "list_pending_queue"
    | "record_external_outcome"
    | "check_execution_gate"
    | "list_requests"
    | "validate_approvals"
    | "diagnostics";
  engineRecord: ApprovalRouterEngineRecord;
  requests: ApprovalRequest[];
  gate: ExecutionGateResult | null;
  validation: ApprovalValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ApprovalRouterState = {
  engineVersion: "PILLOW-AR-001";
  missionId: "Q0-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: ApprovalRouterConfiguration;
  latestReport: ApprovalRouterRunReport | null;
  engineRecord: ApprovalRouterEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalRequests: number;
    pendingCount: number;
    notes: string[];
  };
};

export type ApprovalRouterCockpitSnapshot = {
  missionId: "Q0-06";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalRequests: number;
  pendingCount: number;
  latestApprovalId: string | null;
  neverApproveRequests: true;
  neverExecuteRequests: true;
  neverAssignWorkers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
