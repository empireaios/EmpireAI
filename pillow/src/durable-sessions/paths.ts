/** Canonical Durable Session Architecture (P5-03). */
export const SESSION_ARCHITECTURE_PATH =
  "docs/governance/EMPIREAI_DURABLE_SESSION_ARCHITECTURE.md";

/** Production Mode companion (P5-02). */
export const PRODUCTION_MODE_COMPANION_PATH =
  "docs/governance/EMPIREAI_PRODUCTION_MODE.md";

/** Brain Runtime companion (P5-01). */
export const BRAIN_RUNTIME_COMPANION_PATH =
  "docs/governance/EMPIREAI_BRAIN_RUNTIME_SYSTEM.md";

/** Journey System companion (P4-08). */
export const JOURNEY_COMPANION_PATH = "docs/governance/EMPIREAI_JOURNEY_SYSTEM.md";

/** Session lifecycle states (P5-03). */
export const SESSION_LIFECYCLE_STATES = [
  "created",
  "authenticated",
  "active",
  "persisted",
  "recovered",
  "resumed",
  "expired",
  "archived",
] as const;

/** Session domains governed by P5-03. */
export const SESSION_DOMAINS = [
  "authentication",
  "executive",
  "pillow",
  "builder",
  "supervisor",
  "journey",
  "mission",
  "production",
  "browser",
  "api",
] as const;

/** Durability tiers. */
export const DURABILITY_TIERS = [
  "durable",
  "semi_durable",
  "recoverable",
  "ephemeral",
] as const;

/** Session record documentation fields. */
export const SESSION_DOCUMENTATION_FIELDS = [
  "purpose",
  "persistence",
  "durabilityTier",
  "lifecycleState",
  "recoveryStrategy",
  "expirationPolicy",
  "securityControls",
  "knownLossScenarios",
  "owner",
  "futureEvolution",
] as const;
