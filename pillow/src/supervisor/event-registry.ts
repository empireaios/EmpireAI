import type { SupervisionEventKind } from "./types.js";

export interface SupervisionEventDefinition {
  kind: SupervisionEventKind;
  label: string;
  description: string;
}

/** Supervision events Supervisor records (P6-03). */
export const SUPERVISION_EVENT_REGISTRY: SupervisionEventDefinition[] = [
  { kind: "mission_started", label: "Mission Started", description: "Builder execution began under supervision" },
  { kind: "mission_paused", label: "Mission Paused", description: "Execution paused — awaiting input or dependency" },
  { kind: "mission_resumed", label: "Mission Resumed", description: "Execution resumed after pause" },
  { kind: "mission_delayed", label: "Mission Delayed", description: "Progress slower than expected" },
  { kind: "mission_blocked", label: "Mission Blocked", description: "Execution blocked — intervention required" },
  { kind: "recovery_started", label: "Recovery Started", description: "Recovery doctrine invoked" },
  { kind: "recovery_completed", label: "Recovery Completed", description: "Recovery finished — execution may resume" },
  { kind: "validation_started", label: "Validation Started", description: "Validation phase entered" },
  { kind: "validation_completed", label: "Validation Completed", description: "Validation proof recorded" },
  { kind: "mission_completed", label: "Mission Completed", description: "Mission constitutionally complete" },
];
