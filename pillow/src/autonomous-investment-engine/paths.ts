/** PILLOW-AIE-001 — Autonomous Investment Engine (X5-12). */
export const AUTONOMOUS_INVESTMENT_ENGINE_SYSTEM_PATH = "docs/governance/EMPIREAI_AUTONOMOUS_INVESTMENT_ENGINE_SYSTEM.md" as const;
export const AUTONOMOUS_INVESTMENT_ENGINE_ID = "autonomous-investment-engine" as const;
export const AIE_METADATA_VERSION = "AIE-001-v1" as const;
export const ENGINE_STATUSES = ["idle", "connecting", "active", "discovering", "evaluating", "assessing", "prioritizing", "recommending", "executing", "monitoring", "failed"] as const;
export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const EXECUTION_STATUSES = ["recommended", "pending_governance", "approved", "executed", "blocked", "underperforming", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
export const AIE_CAPABILITIES = [
  "investment_opportunity_discovery",
  "investment_opportunity_evaluation",
  "expected_return_estimation",
  "investment_risk_assessment",
  "investment_opportunity_prioritization",
  "investment_strategy_recommendation",
  "governance_approved_strategy_execution",
  "investment_performance_monitoring",
  "underperforming_investment_detection",
  "investment_metadata_generation",
  "investment_validation",
  "health_monitoring",
  "recovery_management",
] as const;
