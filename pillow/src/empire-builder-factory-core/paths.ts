/** PILLOW-EBF-001 — Empire Builder Factory Core (Q2-01). */
export const EMPIRE_BUILDER_FACTORY_CORE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EMPIRE_BUILDER_FACTORY_CORE_SYSTEM.md" as const;
export const EMPIRE_BUILDER_FACTORY_CORE_ID = "empire-builder-factory-core" as const;
export const EBF_METADATA_VERSION = "EBF-001-v1" as const;
export const BUSINESS_BUILD_MISSION_VERSION = "EBF-BBM-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "accepting",
  "creating",
  "classifying",
  "preparing",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Minimum business types (Q2-01).
 * Architecture allows additional types via configuration without redesign.
 */
export const BUSINESS_TYPES = [
  "media",
  "commerce",
  "local_cleaning",
  "affiliate",
  "digital_product",
  "local_services",
  "saas",
  "agency",
  "unknown",
] as const;

export const MISSION_STATUSES = [
  "drafted",
  "classified",
  "prepared",
  "awaiting_approval",
  "ready_for_q2_workers",
  "rejected",
] as const;

export const APPROVAL_STATUSES = [
  "pending_pillow_review",
  "pending_grand_king_acknowledgment",
  "approved",
  "rejected",
  "not_required",
] as const;

export const REQUIRED_NEXT_STEPS = [
  "classify_business_type",
  "capture_mission_objective",
  "await_pillow_approval",
  "prepare_for_q2_workers",
  "hand_off_to_q2_02",
  "none",
] as const;

export const EBF_CAPABILITIES = [
  "accept_grand_king_business_command",
  "create_business_build_mission",
  "classify_intended_business_type",
  "capture_original_command",
  "capture_mission_objective",
  "capture_expected_business_output",
  "capture_required_approval_status",
  "prepare_mission_for_later_q2_workers",
  "produce_machine_readable_business_build_mission_record",
  "preserve_traceability_to_grand_king_command",
  "extensible_business_types",
  "empire_builder_factory_core_validation",
  "health_monitoring",
  "recovery_management",
] as const;
