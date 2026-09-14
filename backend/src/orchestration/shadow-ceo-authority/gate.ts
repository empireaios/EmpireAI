import { randomUUID } from "node:crypto";

import { wouldExceedBudget, defaultBudgetEnvelope } from "./budget.js";
import type {
  AllowedActionRecord,
  ApprovalRequest,
  ApprovalStatus,
  AttemptExternalActionInput,
  BlockedActionRecord,
  BlockReason,
  ExternalActionKind,
  ExternalActionResult,
  LiveSideEffectKind,
  ModeTransitionInput,
  ModeTransitionResult,
  OperatingLoopState,
  OperatingLoopStopRecord,
  OperatingMode,
} from "./types.js";
import { LIVE_SIDE_EFFECT_KINDS, MISSION_DEFAULT_MODE } from "./types.js";

export function isLiveSideEffectKind(
  kind: ExternalActionKind,
): kind is LiveSideEffectKind {
  return (LIVE_SIDE_EFFECT_KINDS as readonly string[]).includes(kind);
}

/** Pending is never treated as granted. */
export function isApprovalGranted(status: ApprovalStatus): boolean {
  return status === "granted";
}

function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function createBlockedActionRecord(input: {
  kind: ExternalActionKind;
  mode: OperatingMode;
  approvalStatus: ApprovalStatus;
  reason: BlockReason;
  correlationId?: string | null;
  detail?: string | null;
  financialConsequenceSgd?: number | null;
}): BlockedActionRecord {
  return {
    recordId: newId("blk"),
    kind: input.kind,
    mode: input.mode,
    approvalStatus: input.approvalStatus,
    decision: "BLOCKED",
    reason: input.reason,
    createdAt: new Date().toISOString(),
    correlationId: input.correlationId ?? null,
    detail: input.detail ?? null,
    financialConsequenceSgd: input.financialConsequenceSgd ?? null,
  };
}

export function createApprovalRequest(input: {
  kind: ExternalActionKind;
  mode: OperatingMode;
  reason: string;
  requestedAction: string;
  whyRequired: string;
  financialExternalConsequence: string;
  optionsForGrandKing?: string[];
  correlationId?: string | null;
}): ApprovalRequest {
  return {
    approvalId: newId("apr"),
    kind: input.kind,
    mode: input.mode,
    status: "pending",
    source: "deterministic_store",
    requestedAt: new Date().toISOString(),
    reason: input.reason,
    correlationId: input.correlationId ?? null,
    requestedAction: input.requestedAction,
    whyRequired: input.whyRequired,
    financialExternalConsequence: input.financialExternalConsequence,
    optionsForGrandKing: input.optionsForGrandKing ?? [
      "approve",
      "deny",
      "defer",
    ],
    approvingAuthority: "grand_king",
  };
}

/**
 * Silent synthetic→live transitions are forbidden.
 * Elevations require explicitlyAuthorized=true.
 */
export function assertModeTransition(
  input: ModeTransitionInput,
): ModeTransitionResult {
  const { from, to, explicitlyAuthorized = false } = input;
  if (from === to) {
    return { allowed: true, reason: null };
  }

  const elevatesToLive =
    to === "LIVE_EXECUTION" ||
    to === "READ_ONLY_LIVE" ||
    to === "APPROVAL_REQUIRED";

  if (
    (from === "SYNTHETIC" || from === "OBSERVE") &&
    elevatesToLive &&
    !explicitlyAuthorized
  ) {
    return {
      allowed: false,
      reason: "SILENT_SYNTHETIC_TO_LIVE_FORBIDDEN",
    };
  }

  if (to === "LIVE_EXECUTION" && !explicitlyAuthorized) {
    return { allowed: false, reason: "LIVE_EXECUTION_REQUIRES_EXPLICIT_AUTH" };
  }

  return { allowed: true, reason: null };
}

/**
 * Fail-closed external action gate.
 * Live-looking kinds always block. Pending ≠ granted.
 * Mission default: SYNTHETIC synthetic_experiment_run may proceed when authorized.
 */
export function attemptExternalAction(
  input: AttemptExternalActionInput,
): ExternalActionResult {
  const base = {
    kind: input.kind,
    mode: input.mode,
    approvalStatus: input.approvalStatus,
    correlationId: input.correlationId ?? null,
    detail: input.detail ?? null,
  };

  if (input.loopRunning === false) {
    return createBlockedActionRecord({ ...base, reason: "LOOP_STOPPED" });
  }

  if (input.approvalSource === "llm_claim") {
    return createBlockedActionRecord({
      ...base,
      reason: "LLM_APPROVAL_FORBIDDEN",
    });
  }

  if (input.kind === "credential_read") {
    return createBlockedActionRecord({
      ...base,
      reason: "CREDENTIAL_EXPOSURE_FORBIDDEN",
    });
  }

  if (isLiveSideEffectKind(input.kind)) {
    return createBlockedActionRecord({
      ...base,
      reason: "LIVE_SIDE_EFFECT_FORBIDDEN",
      financialConsequenceSgd: input.proposedSpendSgd ?? null,
    });
  }

  if (input.mode === "LIVE_EXECUTION") {
    return createBlockedActionRecord({
      ...base,
      reason: "MISSION_MODE_RESTRICTED",
    });
  }

  if (input.mode === "OBSERVE" || input.mode === "READ_ONLY_LIVE") {
    if (input.kind === "observe_read") {
      return allow(input, "READ_ONLY_OK");
    }
    return createBlockedActionRecord({
      ...base,
      reason: "MODE_FORBIDS_EXECUTION",
    });
  }

  // pending must never be treated as granted
  if (input.approvalStatus === "pending") {
    return createBlockedActionRecord({
      ...base,
      reason: "APPROVAL_PENDING_NOT_GRANTED",
    });
  }

  if (input.approvalStatus === "denied") {
    return createBlockedActionRecord({
      ...base,
      reason: "APPROVAL_DENIED",
    });
  }

  if (input.mode === "APPROVAL_REQUIRED" && !isApprovalGranted(input.approvalStatus)) {
    return createBlockedActionRecord({
      ...base,
      reason: "APPROVAL_REQUIRED_MISSING",
    });
  }

  const budget = input.budget ?? defaultBudgetEnvelope();
  if (
    typeof input.proposedSpendSgd === "number" &&
    wouldExceedBudget(budget, input.proposedSpendSgd)
  ) {
    return createBlockedActionRecord({
      ...base,
      reason: "BUDGET_ENVELOPE_EXCEEDED",
      financialConsequenceSgd: input.proposedSpendSgd,
    });
  }

  // Mission default path: SYNTHETIC + synthetic_experiment_run when authorized
  if (
    input.mode === MISSION_DEFAULT_MODE &&
    input.kind === "synthetic_experiment_run"
  ) {
    if (input.authorized === false) {
      return createBlockedActionRecord({ ...base, reason: "UNAUTHORIZED" });
    }
    return allow(input, "SYNTHETIC_AUTHORIZED");
  }

  if (input.mode === "SYNTHETIC" && input.kind === "observe_read") {
    return allow(input, "SYNTHETIC_READ_OK");
  }

  return createBlockedActionRecord({
    ...base,
    reason: "FAIL_CLOSED_DEFAULT",
  });
}

function allow(
  input: AttemptExternalActionInput,
  reason: string,
): AllowedActionRecord {
  return {
    recordId: newId("act"),
    kind: input.kind,
    mode: input.mode,
    approvalStatus: input.approvalStatus,
    decision: "ALLOWED",
    reason,
    createdAt: new Date().toISOString(),
    correlationId: input.correlationId ?? null,
    detail: input.detail ?? null,
  };
}

export function createInitialLoopState(
  mode: OperatingMode = MISSION_DEFAULT_MODE,
): OperatingLoopState {
  return {
    running: true,
    mode,
    stoppedAt: null,
    stopReason: null,
    stopRecord: null,
  };
}

/** Grand King stop control — halts the operating loop. */
export function stopOperatingLoop(
  reason: string,
  current?: OperatingLoopState,
): OperatingLoopState {
  const stopRecord: OperatingLoopStopRecord = {
    stopped: true,
    reason,
    stoppedAt: new Date().toISOString(),
    stoppedBy: "grand_king",
  };
  return {
    running: false,
    mode: current?.mode ?? MISSION_DEFAULT_MODE,
    stoppedAt: stopRecord.stoppedAt,
    stopReason: reason,
    stopRecord,
  };
}
