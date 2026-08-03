/** PILLOW-AFC-001 — Affiliate Factory Core (Q8-01). */
export const AFFILIATE_FACTORY_CORE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AFFILIATE_FACTORY_CORE_SYSTEM.md" as const;
export const AFFILIATE_FACTORY_CORE_ID = "affiliate-factory-core" as const;
export const AFC_METADATA_VERSION = "AFC-001-v1" as const;
export const AFFILIATE_FACTORY_REPORT_VERSION = "AFC-RPT-v1" as const;
export const AFFILIATE_BUSINESS_PROJECT_VERSION = "AFC-ABP-v1" as const;
export const AFFILIATE_FACTORY_VERSION = "Q8-AFC-v1" as const;

export const AFFILIATE_FACTORY_CORE_IDENTITY = {
  workerId: "wkr-affiliate-factory-core-01",
  workerName: "Affiliate Factory Core",
  workerType: "coordinator",
  department: "affiliate_businesses",
  factory: "affiliate-factory",
  role: "role-coordinator-affiliate-factory-core",
  reportingLine: ["wkr-affiliate-factory-core-01", "pillow"] as string[],
  skillProfile: [
    "skill-affiliate-project-registration",
    "skill-lifecycle-coordination",
    "skill-worker-orchestration",
    "skill-dependency-management",
    "skill-readiness-monitoring",
    "skill-traceability",
  ],
  approvedTools: [
    "affiliate_project_registry",
    "lifecycle_registry",
    "worker_role_registry",
    "structured_reporting",
  ],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "coordinating",
  "validating",
  "creating",
  "registering",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Affiliate niches / categories — extensible via config merge. */
export const AFFILIATE_NICHES = [
  "travel_gear",
  "health_and_wellness",
  "personal_finance",
  "technology_and_gadgets",
  "home_and_garden",
  "beauty_and_skincare",
  "fitness_and_sports",
  "pet_products",
  "fashion_and_apparel",
  "education_and_courses",
  "software_and_saas",
  "outdoor_and_camping",
  "unknown",
] as const;

/** Affiliate business project lifecycle — orchestration only, never auto-launched. */
export const LIFECYCLE_STATUSES = [
  "project_registered",
  "workers_coordinated",
  "preparation",
  "readiness_review",
  "operating",
  "paused",
  "completed",
  "archived",
] as const;

export const PROJECT_STATUSES = [
  "active",
  "coordinating",
  "preparing",
  "in_readiness_review",
  "operating",
  "paused",
  "completed",
  "archived",
  "rejected",
] as const;

export const WORKER_STATUSES = ["unassigned", "assigned", "ready", "blocked", "unknown"] as const;
export const READINESS_STATUSES = ["not_ready", "partial", "ready", "blocked", "unknown"] as const;
export const AUDIT_STATUSES = ["not_audited", "pending", "passed", "partial", "failed"] as const;

/**
 * Structural worker role slots for future Q8-02+ affiliate workers.
 * AFC registers these as placeholders only — it never implements the workers themselves.
 */
export const AFFILIATE_WORKER_ROLES = [
  "opportunity_discovery_worker",
  "content_creation_worker",
  "compliance_review_worker",
  "link_tracking_worker",
  "conversion_optimization_worker",
  "analytics_reporting_worker",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_recovery_system",
  "audit_runtime",
  "mission_runtime",
  "queue_runtime",
  "memory_runtime",
  "affiliate_factory_core_validation",
] as const;

export const AFC_CAPABILITIES = [
  "create_affiliate_business_projects",
  "register_affiliate_business_projects",
  "coordinate_affiliate_business_lifecycle",
  "coordinate_workers",
  "assign_workers",
  "manage_worker_dependencies",
  "maintain_business_metadata",
  "monitor_factory_readiness",
  "track_project_status",
  "track_project_progress",
  "produce_executive_summary",
  "produce_machine_readable_affiliate_factory_reports",
  "coordinate_downstream_affiliate_workers",
  "preserve_project_traceability",
  "preserve_factory_audit_history",
  "submit_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_recovery_system",
  "integrate_audit_runtime",
  "integrate_mission_runtime",
  "integrate_queue_runtime",
  "integrate_memory_runtime",
  "affiliate_factory_core_validation",
  "health_monitoring",
  "recovery_management",
] as const;
