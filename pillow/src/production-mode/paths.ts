/** Canonical Production Mode Doctrine (P5-02). */
export const PRODUCTION_MODE_PATH = "docs/governance/EMPIREAI_PRODUCTION_MODE.md";

/** Production Truth companion (P1-10). */
export const PRODUCTION_TRUTH_COMPANION_PATH =
  "docs/governance/EMPIREAI_PRODUCTION_TRUTH.md";

/** Brain Runtime companion (P5-01). */
export const BRAIN_RUNTIME_COMPANION_PATH =
  "docs/governance/EMPIREAI_BRAIN_RUNTIME_SYSTEM.md";

/** ADR-CON-002 reference. */
export const PRODUCTION_MODE_ADR = "ADR-CON-002";

/** Production Mode governed domains (P5-02). */
export const PRODUCTION_MODE_DOMAINS = [
  "brain",
  "pillow",
  "cockpit",
  "builder",
  "guardian",
  "supervisor",
  "journey",
  "commerce",
  "business_engines",
  "api_routes",
  "workers",
  "queues",
  "runtime_modules",
  "infrastructure",
  "feature_flags",
  "extensions",
] as const;

/** Canonical production states (P5-02). */
export const PRODUCTION_STATES = [
  "production_enabled",
  "production_disabled",
  "production_limited",
  "internal_only",
  "experimental",
  "deprecated",
  "historical",
  "deferred",
] as const;

/** Component documentation fields — every component shall record these. */
export const COMPONENT_DOCUMENTATION_FIELDS = [
  "purpose",
  "currentState",
  "productionState",
  "reason",
  "dependencies",
  "owner",
  "activationRules",
  "knownLimitations",
  "futureEvolution",
] as const;
