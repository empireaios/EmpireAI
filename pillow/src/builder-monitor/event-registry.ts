import type { BuilderMonitorEventKind } from "./types.js";

export interface BuilderEventDefinition {
  kind: BuilderMonitorEventKind;
  label: string;
  description: string;
}

/** Builder event model (P6-04). */
export const BUILDER_EVENT_REGISTRY: BuilderEventDefinition[] = [
  { kind: "mission_started", label: "Mission Started", description: "Builder began mission execution" },
  { kind: "mission_updated", label: "Mission Updated", description: "Mission state or scope updated" },
  { kind: "progress_changed", label: "Progress Changed", description: "Overall or stage progress changed" },
  { kind: "repository_updated", label: "Repository Updated", description: "Repository files or branch changed" },
  { kind: "dependency_changed", label: "Dependency Changed", description: "Mission dependency status changed" },
  { kind: "validation_started", label: "Validation Started", description: "Builder entered validation" },
  { kind: "validation_completed", label: "Validation Completed", description: "Validation proof recorded" },
  { kind: "recovery_started", label: "Recovery Started", description: "Recovery invoked during execution" },
  { kind: "recovery_completed", label: "Recovery Completed", description: "Recovery finished" },
  { kind: "mission_completed", label: "Mission Completed", description: "Mission constitutionally complete" },
  { kind: "mission_failed", label: "Mission Failed", description: "Mission failed — escalation required" },
  { kind: "mission_cancelled", label: "Mission Cancelled", description: "Mission cancelled" },
  { kind: "heartbeat", label: "Heartbeat", description: "Builder heartbeat — execution alive" },
];
