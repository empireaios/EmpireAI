/**
 * Shadow CEO — Authority, Capital and Safety enforcement.
 * Mission default: SYNTHETIC. External/live actions fail closed.
 */

export type {
  OperatingMode,
  ExternalActionKind,
  LiveSideEffectKind,
  ApprovalStatus,
  ApprovalSource,
  GateDecision,
  BlockReason,
  BudgetEnvelope,
  AttemptExternalActionInput,
  BlockedActionRecord,
  AllowedActionRecord,
  ExternalActionResult,
  ApprovalRequest,
  ModeTransitionInput,
  ModeTransitionResult,
  OperatingLoopStopRecord,
  OperatingLoopState,
} from "./types.js";

export {
  OPERATING_MODES,
  MISSION_DEFAULT_MODE,
  LIVE_SIDE_EFFECT_KINDS,
  EXTERNAL_ACTION_KINDS,
  DEFAULT_BUDGET_CAPS,
} from "./types.js";

export {
  defaultBudgetEnvelope,
  assertBudgetFromDeterministicState,
  wouldExceedBudget,
} from "./budget.js";

export {
  isLiveSideEffectKind,
  isApprovalGranted,
  createBlockedActionRecord,
  createApprovalRequest,
  assertModeTransition,
  attemptExternalAction,
  createInitialLoopState,
  stopOperatingLoop,
} from "./gate.js";

export {
  resolveStorePath,
  emptyAuthorityStore,
  loadAuthorityStore,
  saveAuthorityStore,
  persistBlockedAction,
  persistApprovalRequest,
  persistLoopState,
  listBlockedActions,
} from "./repository/json-authority-store.js";

export type { AuthorityStoreFile } from "./repository/json-authority-store.js";

import {
  attemptExternalAction as gateAttempt,
  createApprovalRequest as makeApproval,
  stopOperatingLoop as stopLoop,
} from "./gate.js";
import {
  persistApprovalRequest,
  persistBlockedAction,
  persistLoopState,
} from "./repository/json-authority-store.js";
import type {
  ApprovalRequest,
  AttemptExternalActionInput,
  BlockedActionRecord,
  ExternalActionResult,
  OperatingLoopState,
} from "./types.js";

/**
 * Gate + persist: every blocked attempt is recorded in the authority store.
 */
export function attemptExternalActionAndPersist(
  input: AttemptExternalActionInput,
  baseDir?: string,
): ExternalActionResult {
  const result = gateAttempt(input);
  if (result.decision === "BLOCKED") {
    persistBlockedAction(result, baseDir);
  }
  return result;
}

export function createApprovalRequestAndPersist(
  input: Parameters<typeof makeApproval>[0],
  baseDir?: string,
): ApprovalRequest {
  const approval = makeApproval(input);
  return persistApprovalRequest(approval, baseDir);
}

export function stopOperatingLoopAndPersist(
  reason: string,
  current?: OperatingLoopState,
  baseDir?: string,
): OperatingLoopState {
  const next = stopLoop(reason, current);
  return persistLoopState(next, baseDir);
}

/** Convenience: ensure a blocked record exists for a live-looking attempt. */
export function recordBlockedIfNeeded(
  result: ExternalActionResult,
  baseDir?: string,
): BlockedActionRecord | null {
  if (result.decision !== "BLOCKED") return null;
  return persistBlockedAction(result, baseDir);
}
