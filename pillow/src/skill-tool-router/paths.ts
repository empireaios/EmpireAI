/** PILLOW-STR-001 — Skill & Tool Router (Q0-12). */
export const SKILL_TOOL_ROUTER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_SKILL_TOOL_ROUTER_SYSTEM.md" as const;
export const SKILL_TOOL_ROUTER_ID = "skill-tool-router" as const;
export const STR_METADATA_VERSION = "STR-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "analysing",
  "matching",
  "recommending",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default routing factors (Q0-12).
 * Architecture allows additional criteria via configuration without redesign.
 */
export const ROUTING_FACTORS = [
  "worker_capability",
  "worker_availability",
  "worker_performance",
  "worker_authority",
  "tool_compatibility",
  "tool_availability",
  "security",
  "cost",
  "risk",
  "business_context",
] as const;

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export const COST_LEVELS = ["low", "medium", "high"] as const;

export const STR_CAPABILITIES = [
  "receive_executive_request",
  "analyse_required_capabilities",
  "query_workforce_capability_registry",
  "match_suitable_workers",
  "match_approved_tools",
  "evaluate_worker_suitability",
  "evaluate_tool_suitability",
  "consider_execution_context",
  "consider_risk",
  "consider_execution_cost",
  "produce_routing_recommendations",
  "produce_routing_records",
  "machine_readable_routing_output",
  "evaluate_alternative_routes",
  "escalation_recommendation",
  "extensible_routing_factors",
  "preserve_auditability",
  "preserve_traceability",
  "routing_validation",
  "health_monitoring",
  "recovery_management",
] as const;
