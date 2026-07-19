/** PILLOW-LPE-001 — Loyalty Programme Engine paths (R4-12). */

export const LOYALTY_PROGRAMME_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LOYALTY_PROGRAMME_ENGINE_SYSTEM.md";

export const LPE_METADATA_VERSION = "LPE-001-v1" as const;

export const LOYALTY_PROGRAMME_ENGINE_ID = "loyalty-programme-engine" as const;

export const ENGINE_STATUSES = [
  "idle",
  "initializing",
  "connecting",
  "connected",
  "active",
  "processing",
  "degraded",
  "suspended",
  "failed",
  "stopped",
] as const;

export const ENGINE_STATES = [
  "registered",
  "connected",
  "active",
  "suspended",
  "failed",
  "shutdown",
] as const;

export const LOYALTY_TIERS = ["bronze", "silver", "gold", "platinum"] as const;

export const LOYALTY_ACTIVITY_TYPES = [
  "registration",
  "points_awarded",
  "points_redeemed",
  "tier_change",
  "reward_generated",
  "abuse_detected",
] as const;

export const LPE_CAPABILITIES = [
  "programme_creation",
  "member_registration",
  "points_award",
  "points_redemption",
  "tier_management",
  "balance_tracking",
  "activity_tracking",
  "abuse_detection",
  "reward_generation",
  "failure_detection",
  "health_monitoring",
  "recovery",
] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;
