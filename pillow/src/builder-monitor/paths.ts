/** Canonical Builder Monitor (P6-04). */
export const BUILDER_MONITOR_PATH =
  "docs/governance/EMPIREAI_BUILDER_MONITOR.md";

/** Supervisor System companion (P6-03). */
export const SUPERVISOR_SYSTEM_COMPANION_PATH =
  "docs/governance/EMPIREAI_SUPERVISOR_SYSTEM.md";

/** Builder architecture companion. */
export const BUILDER_ARCHITECTURE_COMPANION_PATH =
  "docs/architecture/EMPIREAI_BUILDER_ARCHITECTURE.md";

/** Builder Monitor principles (P6-04). */
export const BUILDER_MONITOR_PRINCIPLES = [
  "Supervisor never assumes — Supervisor continuously verifies",
  "Builder continuously reports — complete execution transparency",
  "No Builder execution shall become invisible",
  "Single Builder Monitor authority — no competing monitoring systems",
  "Interrogation remains efficient and production-safe",
  "Every interrogation result becomes part of the permanent Journey",
  "ECC consumes Builder Monitor data — Builder Monitor does not coordinate",
  "Evidence-based telemetry — heartbeat · progress · repository activity",
] as const;

/** Builder Monitor responsibilities (P6-04). */
export const BUILDER_MONITOR_RESPONSIBILITIES = [
  "builder_telemetry",
  "supervisor_interrogation",
  "mission_timeline",
  "progress_tracking",
  "repository_activity_tracking",
  "validation_state_tracking",
  "recovery_state_tracking",
  "heartbeat_monitoring",
  "execution_health_reporting",
  "journey_integration",
] as const;

/** Telemetry fields Builder shall publish (P6-04). */
export const BUILDER_TELEMETRY_FIELDS = [
  "current_mission",
  "current_roadmap_item",
  "current_phase",
  "current_step",
  "current_activity",
  "mission_state",
  "overall_progress",
  "stage_progress",
  "estimated_remaining_time",
  "elapsed_time",
  "current_file",
  "files_modified",
  "repository_activity",
  "current_branch",
  "current_dependency",
  "current_queue",
  "current_worker",
  "validation_state",
  "production_state",
  "recovery_state",
  "current_errors",
  "current_warnings",
  "heartbeat",
] as const;

/** Supervisor interrogation domains (P6-04). */
export const INTERROGATION_DOMAINS = [
  "mission_status",
  "execution_status",
  "repository_status",
  "validation_status",
  "recovery_status",
  "progress_status",
  "dependency_status",
  "worker_status",
  "queue_status",
  "heartbeat_status",
  "current_risks",
  "current_bottlenecks",
] as const;

/** Builder event model (P6-04). */
export const BUILDER_MONITOR_EVENTS = [
  "mission_started",
  "mission_updated",
  "progress_changed",
  "repository_updated",
  "dependency_changed",
  "validation_started",
  "validation_completed",
  "recovery_started",
  "recovery_completed",
  "mission_completed",
  "mission_failed",
  "mission_cancelled",
  "heartbeat",
] as const;

/** Interrogation frequency defaults (P6-04) — production-safe intervals in ms. */
export const INTERROGATION_FREQUENCIES = {
  heartbeatIntervalMs: 120_000,
  progressIntervalMs: 180_000,
  repositoryPollingMs: 300_000,
  workerPollingMs: 240_000,
  queuePollingMs: 60_000,
  validationPollingMs: 180_000,
  recoveryPollingMs: 120_000,
  productionPollingMs: 600_000,
} as const;
