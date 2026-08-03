/** PILLOW-OPBK-001 — Operational Playbook Engine (Q0-15). */
export const OPERATIONAL_PLAYBOOK_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_OPERATIONAL_PLAYBOOK_ENGINE_SYSTEM.md" as const;
export const OPERATIONAL_PLAYBOOK_ENGINE_ID = "operational-playbook-engine" as const;
export const OPBK_METADATA_VERSION = "OPBK-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "registering",
  "selecting",
  "interpreting",
  "tracking",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default playbook categories (Q0-15).
 * Architecture allows additional types via configuration without redesign.
 */
export const PLAYBOOK_CATEGORIES = [
  "business",
  "commerce",
  "media",
  "marketplace",
  "marketing",
  "finance",
  "customer_service",
  "operations",
  "recovery",
  "emergency",
] as const;

export const EXECUTION_STATUSES = [
  "prepared",
  "prerequisites_met",
  "in_progress",
  "blocked",
  "completed",
  "failed",
] as const;

export const OPBK_CAPABILITIES = [
  "register_approved_playbooks",
  "categorize_playbooks",
  "version_playbooks",
  "validate_playbook_integrity",
  "select_correct_playbook",
  "interpret_playbook_steps",
  "validate_execution_prerequisites",
  "produce_executable_workflows",
  "track_playbook_execution_progress",
  "produce_playbook_execution_records",
  "machine_readable_playbook_output",
  "extensible_playbook_types",
  "preserve_auditability",
  "preserve_traceability",
  "playbook_validation",
  "health_monitoring",
  "recovery_management",
] as const;
