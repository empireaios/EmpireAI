/** Canonical Guardian Monitoring System (P5-04). */
export const GUARDIAN_MONITORING_PATH =
  "docs/governance/EMPIREAI_GUARDIAN_MONITORING_SYSTEM.md";

/** Durable Sessions companion (P5-03). */
export const DURABLE_SESSIONS_COMPANION_PATH =
  "docs/governance/EMPIREAI_DURABLE_SESSION_ARCHITECTURE.md";

/** Production Mode companion (P5-02). */
export const PRODUCTION_MODE_COMPANION_PATH =
  "docs/governance/EMPIREAI_PRODUCTION_MODE.md";

/** Brain Runtime companion (P5-01). */
export const BRAIN_RUNTIME_COMPANION_PATH =
  "docs/governance/EMPIREAI_BRAIN_RUNTIME_SYSTEM.md";

/** Backend Guardian executor — not duplicated (P5-04 observes, does not execute). */
export const GUARDIAN_EXECUTOR_PATH = "backend/src/guardian/guardian-engine.ts";

/** Monitoring principles (P5-04). */
export const MONITORING_PRINCIPLES = [
  "Continuous Observation",
  "Real-time Health",
  "Historical Trends",
  "Anomaly Detection",
  "Evidence Collection",
  "Non-invasive Monitoring",
  "Production-safe Monitoring",
  "No Silent Failure",
] as const;

/** Health classifications (P5-04). */
export const HEALTH_CLASSIFICATIONS = [
  "healthy",
  "warning",
  "degraded",
  "critical",
  "unavailable",
  "recovering",
  "maintenance",
  "historical",
] as const;

/** Alert severities (P5-04). */
export const ALERT_SEVERITIES = [
  "informational",
  "low",
  "medium",
  "high",
  "critical",
] as const;

/** Monitored domains (P5-04). */
export const MONITORED_DOMAINS = [
  "brain_runtime",
  "pillow",
  "builder",
  "supervisor",
  "cockpit",
  "journey",
  "authentication",
  "sessions",
  "redis",
  "database",
  "queues",
  "workers",
  "memory",
  "cpu",
  "storage",
  "network",
  "api",
  "business_engines",
  "commerce",
  "production_services",
] as const;

/** Component documentation fields. */
export const MONITORING_DOCUMENTATION_FIELDS = [
  "purpose",
  "healthStatus",
  "metricsCollected",
  "alertThresholds",
  "probeSource",
  "owner",
  "dependencies",
  "knownDegradations",
  "futureEvolution",
] as const;
