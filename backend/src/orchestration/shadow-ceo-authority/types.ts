/**
 * Shadow CEO — Authority, Capital and Safety types.
 * Enforceable operating modes + fail-closed external action gate.
 */

export const OPERATING_MODES = [
  "OBSERVE",
  "SYNTHETIC",
  "READ_ONLY_LIVE",
  "APPROVAL_REQUIRED",
  "LIVE_EXECUTION",
] as const;

export type OperatingMode = (typeof OPERATING_MODES)[number];

/** Mission default: only SYNTHETIC may execute synthetic actions. */
export const MISSION_DEFAULT_MODE: OperatingMode = "SYNTHETIC";

export const LIVE_SIDE_EFFECT_KINDS = [
  "listing",
  "ads",
  "supplier_order",
  "customer_comm",
  "money_move",
  "live",
] as const;

export type LiveSideEffectKind = (typeof LIVE_SIDE_EFFECT_KINDS)[number];

export const EXTERNAL_ACTION_KINDS = [
  ...LIVE_SIDE_EFFECT_KINDS,
  "synthetic_experiment_run",
  "observe_read",
  "credential_read",
] as const;

export type ExternalActionKind = (typeof EXTERNAL_ACTION_KINDS)[number];

/**
 * Approval status must originate from a deterministic store —
 * never from an LLM-generated claim.
 */
export type ApprovalStatus = "none" | "pending" | "granted" | "denied";

export type ApprovalSource = "deterministic_store" | "llm_claim";

export type GateDecision = "ALLOWED" | "BLOCKED";

export type BlockReason =
  | "LIVE_SIDE_EFFECT_FORBIDDEN"
  | "MODE_FORBIDS_EXECUTION"
  | "APPROVAL_PENDING_NOT_GRANTED"
  | "APPROVAL_DENIED"
  | "APPROVAL_REQUIRED_MISSING"
  | "LLM_APPROVAL_FORBIDDEN"
  | "BUDGET_ENVELOPE_EXCEEDED"
  | "MISSION_MODE_RESTRICTED"
  | "CREDENTIAL_EXPOSURE_FORBIDDEN"
  | "UNAUTHORIZED"
  | "LOOP_STOPPED"
  | "FAIL_CLOSED_DEFAULT";

export interface BudgetEnvelope {
  /** Hard total capital cap in SGD — deterministic constant/state only. */
  totalCapSgd: number;
  /** Monthly out-of-pocket cap in SGD — deterministic constant/state only. */
  monthlyOopCapSgd: number;
  spentTotalSgd: number;
  spentMonthlyOopSgd: number;
  currency: "SGD";
  source: "deterministic_state";
}

export const DEFAULT_BUDGET_CAPS = Object.freeze({
  totalCapSgd: 10_000,
  monthlyOopCapSgd: 500,
});

export interface AttemptExternalActionInput {
  kind: ExternalActionKind;
  mode: OperatingMode;
  /** Must be resolved from deterministic store; never LLM prose. */
  approvalStatus: ApprovalStatus;
  approvalSource?: ApprovalSource;
  authorized?: boolean;
  /** Optional spend proposed for this action (SGD). Checked against envelope. */
  proposedSpendSgd?: number;
  budget?: BudgetEnvelope;
  actionId?: string;
  correlationId?: string;
  detail?: string;
  loopRunning?: boolean;
}

export interface BlockedActionRecord {
  recordId: string;
  kind: ExternalActionKind;
  mode: OperatingMode;
  approvalStatus: ApprovalStatus;
  decision: "BLOCKED";
  reason: BlockReason;
  createdAt: string;
  correlationId: string | null;
  detail: string | null;
  financialConsequenceSgd: number | null;
}

export interface AllowedActionRecord {
  recordId: string;
  kind: ExternalActionKind;
  mode: OperatingMode;
  approvalStatus: ApprovalStatus;
  decision: "ALLOWED";
  reason: string;
  createdAt: string;
  correlationId: string | null;
  detail: string | null;
}

export type ExternalActionResult = BlockedActionRecord | AllowedActionRecord;

export interface ApprovalRequest {
  approvalId: string;
  kind: ExternalActionKind;
  mode: OperatingMode;
  status: ApprovalStatus;
  /** Always deterministic_store — LLM cannot create granted approvals. */
  source: "deterministic_store";
  requestedAt: string;
  reason: string;
  correlationId: string | null;
  requestedAction: string;
  whyRequired: string;
  financialExternalConsequence: string;
  optionsForGrandKing: string[];
  approvingAuthority: "grand_king";
}

export interface ModeTransitionInput {
  from: OperatingMode;
  to: OperatingMode;
  /** Explicit Grand King / system authorization for elevating modes. */
  explicitlyAuthorized?: boolean;
}

export interface ModeTransitionResult {
  allowed: boolean;
  reason: string | null;
}

export interface OperatingLoopStopRecord {
  stopped: true;
  reason: string;
  stoppedAt: string;
  stoppedBy: "grand_king";
}

export interface OperatingLoopState {
  running: boolean;
  mode: OperatingMode;
  stoppedAt: string | null;
  stopReason: string | null;
  stopRecord: OperatingLoopStopRecord | null;
}
