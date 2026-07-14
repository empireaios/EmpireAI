/** Canonical ETA Engine (P6-05). */
export const ETA_ENGINE_PATH = "docs/governance/EMPIREAI_ETA_ENGINE.md";

/** Builder Monitor companion (P6-04). */
export const BUILDER_MONITOR_COMPANION_PATH =
  "docs/governance/EMPIREAI_BUILDER_MONITOR.md";

/** Supervisor System companion (P6-03). */
export const SUPERVISOR_SYSTEM_ETA_COMPANION_PATH =
  "docs/governance/EMPIREAI_SUPERVISOR_SYSTEM.md";

/** ETA Engine principles (P6-05). */
export const ETA_PRINCIPLES = [
  "ETA shall never be static — continuously updated from live evidence",
  "ETA shall continuously improve using execution history",
  "The Grand King shall always know how much work remains",
  "Single ETA Engine authority — no competing ETA systems",
  "Evidence-based prediction — reason · evidence · uncertainty · recommendation",
  "Supervisor supplies progress · Builder supplies activity · ECC consumes predictions",
  "Automatic update on state · progress · dependency · recovery · validation changes",
  "Confidence model reflects known uncertainty honestly",
] as const;

/** ETA Engine responsibilities (P6-05). */
export const ETA_RESPONSIBILITIES = [
  "remaining_time_prediction",
  "completion_timestamp_prediction",
  "confidence_scoring",
  "velocity_tracking",
  "critical_path_analysis",
  "delay_detection",
  "historical_comparison",
  "ecc_scheduling_support",
  "journey_timeline_integration",
  "prediction_quality_analysis",
] as const;

/** Evidence inputs ETA analyses (P6-05). */
export const ETA_ANALYSIS_INPUTS = [
  "current_mission",
  "current_roadmap_item",
  "mission_complexity",
  "current_phase",
  "current_step",
  "completed_steps",
  "remaining_steps",
  "mission_dependencies",
  "repository_activity",
  "builder_activity",
  "supervisor_events",
  "recovery_events",
  "validation_events",
  "historical_mission_durations",
  "current_runtime_health",
] as const;

/** ETA calculation pipeline (P6-05). */
export const ETA_CALCULATION_PIPELINE = [
  "elapsed_time",
  "remaining_work",
  "dependency_delay",
  "recovery_delay",
  "validation_delay",
  "historical_comparison",
  "confidence_score",
  "predicted_completion_time",
] as const;

/** ETA update triggers (P6-05). */
export const ETA_UPDATE_TRIGGERS = [
  "mission_state_change",
  "progress_change",
  "dependency_change",
  "recovery_begin",
  "recovery_end",
  "validation_begin",
  "validation_end",
  "repository_activity_change",
  "execution_velocity_change",
] as const;

/** Confidence classifications (P6-05). */
export const ETA_CONFIDENCE_CLASSIFICATIONS = [
  "very_high",
  "high",
  "medium",
  "low",
  "unknown",
] as const;
