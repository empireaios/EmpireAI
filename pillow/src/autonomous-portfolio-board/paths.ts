/** PILLOW-APB-001 — Autonomous Portfolio Board paths (X2-20). */

export const SYSTEM_PATH =
  "docs/governance/EMPIREAI_AUTONOMOUS_PORTFOLIO_BOARD_SYSTEM.md" as const;
export const AUTONOMOUS_PORTFOLIO_BOARD_SYSTEM_PATH = SYSTEM_PATH;

export const APB_METADATA_VERSION = "APB-001-v1" as const;
export const AUTONOMOUS_PORTFOLIO_BOARD_ID = "autonomous-portfolio-board" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "reviewing",
  "prioritizing",
  "recommending",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const OPERATIONAL_STATES = [
  "disconnected",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const APB_CAPABILITIES = [
  "enterprise_performance_review",
  "portfolio_health_review",
  "strategic_opportunity_review",
  "enterprise_risk_review",
  "capital_allocation_review",
  "expansion_opportunity_review",
  "acquisition_opportunity_review",
  "executive_decision_prioritization",
  "executive_recommendations",
  "enterprise_governance",
  "executive_validation",
  "executive_metadata_generation",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const REVIEW_CATEGORIES = [
  "performance",
  "health",
  "opportunity",
  "risk",
  "capital",
  "expansion",
  "acquisition",
] as const;

export const PRIORITY_LEVELS = ["critical", "high", "medium", "low"] as const;
