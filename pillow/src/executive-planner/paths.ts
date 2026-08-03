/** PILLOW-EP-001 — Executive Planner (Q0-01). */
export const EXECUTIVE_PLANNER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_PLANNER_SYSTEM.md" as const;
export const EXECUTIVE_PLANNER_ID = "executive-planner" as const;
export const EP_METADATA_VERSION = "EP-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "analyzing",
  "planning",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Workforce categories only — never specific workers (Q0-01 boundary). */
export const WORKFORCE_CATEGORIES = [
  "strategy",
  "product",
  "engineering",
  "operations",
  "finance",
  "compliance",
  "legal",
  "marketing",
  "sales",
  "customer_success",
  "data_intelligence",
  "security",
  "talent",
  "executive_governance",
] as const;

export const EP_CAPABILITIES = [
  "accept_high_level_objective",
  "extract_intent",
  "extract_constraints",
  "extract_priorities",
  "extract_risks",
  "extract_assumptions",
  "extract_dependencies",
  "extract_approval_needs",
  "extract_success_criteria",
  "produce_structured_execution_plan",
  "identify_execution_stages",
  "identify_workforce_categories",
  "machine_readable_plan_output",
  "preserve_auditability",
  "preserve_traceability",
  "plan_validation",
  "health_monitoring",
  "recovery_management",
] as const;
