/**
 * G8-07 — Reauthorization state machine.
 */

import type { TokenLifecycleState } from "../contracts/token-lifecycle-types.js";

const TRANSITIONS: Record<TokenLifecycleState, TokenLifecycleState[]> = {
  active: ["expiring_soon", "refresh_required", "expired", "revoked", "reauthorization_pending"],
  expiring_soon: ["refresh_required", "expired", "reauthorization_pending", "active"],
  expired: ["reconnect_required", "reauthorization_pending", "reauthorized"],
  refresh_required: ["refreshing", "reconnect_required", "reauthorization_pending"],
  refreshing: ["reauthorized", "refresh_failed", "active"],
  refresh_failed: ["reconnect_required", "reauthorization_pending"],
  reconnect_required: ["reauthorization_pending", "reauthorized"],
  reauthorization_pending: ["refreshing", "reconnect_required", "reauthorized", "refresh_failed"],
  reauthorized: ["active", "expiring_soon"],
  revoked: ["reauthorization_pending", "reconnect_required"],
  suspended: ["reauthorization_pending", "active"],
  invalid: ["reauthorization_pending", "reconnect_required"],
  unknown: ["reauthorization_pending", "active", "expired"],
};

export function canTransitionReauthorization(from: TokenLifecycleState, to: TokenLifecycleState): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function transitionReauthorizationState(
  from: TokenLifecycleState,
  to: TokenLifecycleState,
): { ok: boolean; state: TokenLifecycleState; reason: string } {
  if (from === to) return { ok: true, state: to, reason: "No-op transition" };
  if (!canTransitionReauthorization(from, to)) {
    return { ok: false, state: from, reason: `Invalid reauthorization transition: ${from} → ${to}` };
  }
  return { ok: true, state: to, reason: `Transitioned ${from} → ${to}` };
}

export function resolveReauthorizationTargetState(input: {
  currentState: TokenLifecycleState;
  refreshEligible: boolean;
  action: "start" | "refresh" | "reconnect" | "cancel" | "complete" | "fail";
}): TokenLifecycleState {
  switch (input.action) {
    case "start":
      return input.refreshEligible ? "reauthorization_pending" : "reconnect_required";
    case "refresh":
      return "refreshing";
    case "reconnect":
      return "reconnect_required";
    case "cancel":
      return input.currentState === "reauthorization_pending" ? "reconnect_required" : input.currentState;
    case "complete":
      return "reauthorized";
    case "fail":
      return input.refreshEligible ? "refresh_failed" : "reconnect_required";
    default:
      return input.currentState;
  }
}
