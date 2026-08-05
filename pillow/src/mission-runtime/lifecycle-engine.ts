import type { MissionLifecycleState } from "./types.js";

const ALLOWED_TRANSITIONS: Record<MissionLifecycleState, MissionLifecycleState[]> = {
  Created: ["Queued"],
  Queued: ["Ready"],
  Ready: ["Running"],
  Running: ["Waiting", "Paused", "Completed", "Failed", "Cancelled"],
  Waiting: ["Running", "Paused", "Cancelled"],
  Paused: ["Resumed", "Cancelled"],
  Resumed: ["Running"],
  Retrying: ["Running", "Failed"],
  Completed: ["Archived"],
  Failed: ["Retrying", "Archived", "Cancelled"],
  Cancelled: ["Archived"],
  Recovered: ["Running", "Paused"],
  Archived: [],
};

const INTERRUPTED_STATES: MissionLifecycleState[] = ["Running", "Paused", "Waiting"];

export function canTransition(
  from: MissionLifecycleState,
  to: MissionLifecycleState,
): boolean {
  if (from === to) return false;
  if (to === "Recovered" && INTERRUPTED_STATES.includes(from)) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validateTransition(
  from: MissionLifecycleState,
  to: MissionLifecycleState,
): { valid: boolean; reason: string } {
  if (from === to) {
    return { valid: false, reason: `No-op transition ${from} → ${to}` };
  }
  if (to === "Recovered" && INTERRUPTED_STATES.includes(from)) {
    return { valid: true, reason: `Recovery from interrupted state ${from}` };
  }
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    return { valid: false, reason: `Invalid transition ${from} → ${to}` };
  }
  return { valid: true, reason: `Allowed transition ${from} → ${to}` };
}

export function applyTransition(
  from: MissionLifecycleState,
  to: MissionLifecycleState,
): MissionLifecycleState {
  const check = validateTransition(from, to);
  if (!check.valid) {
    throw new Error(check.reason);
  }
  return to;
}

export function isInterruptedState(state: MissionLifecycleState): boolean {
  return INTERRUPTED_STATES.includes(state);
}

export function getAllowedTransitions(from: MissionLifecycleState): MissionLifecycleState[] {
  const base = [...(ALLOWED_TRANSITIONS[from] ?? [])];
  if (INTERRUPTED_STATES.includes(from) && !base.includes("Recovered")) {
    base.push("Recovered");
  }
  return base;
}

export { ALLOWED_TRANSITIONS, INTERRUPTED_STATES };
