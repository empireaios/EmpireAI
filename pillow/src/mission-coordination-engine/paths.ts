/** PILLOW-MCE-001 — Mission Coordination Engine (Q0-25). */
export const MISSION_COORDINATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_MISSION_COORDINATION_ENGINE_SYSTEM.md" as const;
export const MISSION_COORDINATION_ENGINE_ID = "mission-coordination-engine" as const;
export const MCE_METADATA_VERSION = "MCE-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "planning",
  "coordinating",
  "monitoring",
  "closing",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default mission states (Q0-25).
 * Architecture allows additional states via configuration without redesign.
 */
export const MISSION_STATES = [
  "planned",
  "waiting",
  "ready",
  "running",
  "waiting_approval",
  "blocked",
  "paused",
  "recovering",
  "completed",
  "cancelled",
  "failed",
] as const;

export const MISSION_PHASES = [
  "planning",
  "preparation",
  "execution",
  "review",
  "approval",
  "completion",
  "closure",
] as const;

export const COMPLETION_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "closed",
  "cancelled",
  "failed",
] as const;

export const MCE_CAPABILITIES = [
  "receive_mission_plans",
  "create_mission_records",
  "track_mission_lifecycle",
  "coordinate_mission_phases",
  "coordinate_worker_dependencies",
  "coordinate_approval_checkpoints",
  "detect_blocked_missions",
  "detect_stalled_missions",
  "coordinate_mission_completion",
  "coordinate_mission_closure",
  "produce_mission_records",
  "machine_readable_mission_output",
  "extensible_mission_states",
  "preserve_auditability",
  "preserve_traceability",
  "mission_coordination_engine_validation",
  "health_monitoring",
  "recovery_management",
] as const;
