/** PILLOW-CORE-001 — Collective Reasoning Engine (Q0-13). */
export const COLLECTIVE_REASONING_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COLLECTIVE_REASONING_ENGINE_SYSTEM.md" as const;
export const COLLECTIVE_REASONING_ENGINE_ID = "collective-reasoning-engine" as const;
export const CORE_METADATA_VERSION = "CORE-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "assembling",
  "analysing",
  "debating",
  "consensus",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default reasoning modes (Q0-13).
 * Architecture allows additional modes via configuration without redesign.
 */
export const REASONING_MODES = [
  "independent_analysis",
  "structured_debate",
  "peer_challenge",
  "consensus_building",
  "minority_report",
] as const;

export const CORE_CAPABILITIES = [
  "receive_executive_reasoning_request",
  "identify_required_expertise",
  "assemble_reasoning_panel",
  "collect_independent_opinions",
  "detect_conflicting_viewpoints",
  "coordinate_structured_debate",
  "challenge_assumptions",
  "build_consensus",
  "record_minority_opinions",
  "produce_executive_recommendation",
  "produce_reasoning_records",
  "machine_readable_reasoning_output",
  "extensible_reasoning_modes",
  "preserve_auditability",
  "preserve_traceability",
  "reasoning_validation",
  "health_monitoring",
  "recovery_management",
] as const;
