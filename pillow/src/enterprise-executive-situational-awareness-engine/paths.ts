/** PILLOW-EESAE-001 — Enterprise Executive Situational Awareness Engine (EESAE-01). */

export const EESAE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_ENTERPRISE_EXECUTIVE_SITUATIONAL_AWARENESS_ENGINE_SYSTEM.md" as const;

export const EESAE_ENGINE_ID = "enterprise-executive-situational-awareness-engine" as const;

export const EESAE_METADATA_VERSION = "EESAE-001-v1" as const;

export const EESAE_REPORT_VERSION = "EESAE-RPT-v1" as const;

export const EESAE_MISSION_ID = "EESAE-01" as const;

export const EESAE_RUNTIME_VERSION = "EESAE-CRT-v1" as const;

export const EESAE_IDENTITY = {
  workerId: "wkr-enterprise-executive-situational-awareness-01",
  workerName: "Enterprise Executive Situational Awareness Engine",
  workerType: "executive_situational_awareness",
  department: "enterprise_executive_situational_awareness",
  factory: "enterprise-executive-situational-awareness-engine",
  role: "role-eesae",
  reportingLine: ["wkr-enterprise-executive-situational-awareness-01", "pillow"] as string[],
  skillProfile: [
    "skill-system-health-evaluation",
    "skill-performance-intelligence",
    "skill-business-intelligence",
    "skill-workforce-intelligence",
    "skill-self-awareness",
    "skill-deterioration-detection",
    "skill-root-cause-investigation",
    "skill-executive-recommendations",
    "skill-escalation-management",
    "skill-situational-awareness-reporting",
    "skill-digital-soul-alignment",
  ],
  approvedTools: ["structured_reporting"],
  authorityLevel: "observe_recommend_escalate_only",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "connected",
  "active",
  "evaluating",
  "investigating",
  "escalating",
  "reporting",
  "validating",
  "blocked",
  "standby",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "blocked", "standby", "failed"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby", "blocked"] as const;

export const FINDING_DOMAINS = ["performance", "business", "workforce", "system", "self", "governance"] as const;

export const FINDING_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const INTEGRATION_TARGETS = [
  "monitoring_runtime",
  "executive_reporting_runtime",
  "audit_runtime",
  "pillow_orchestration_runtime",
  "digital_soul_runtime",
  "worker_registry",
  "commerce_intelligence",
  "empire_knowledge_engine",
  "programme_certification_factory",
  "queue_runtime",
  "memory_runtime",
  "recovery_runtime",
  "shared_runtime_core",
  "intelligence_context",
] as const;

export const EESAE_CAPABILITIES = [
  "evaluate_system_health",
  "evaluate_performance_intelligence",
  "evaluate_business_intelligence",
  "evaluate_ai_workforce_intelligence",
  "evaluate_self_awareness",
  "detect_deterioration",
  "investigate_root_causes",
  "estimate_business_impact_and_urgency",
  "generate_executive_recommendations",
  "escalate_unacknowledged",
  "acknowledge_finding",
  "produce_situational_awareness_report",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_awareness_history",
  "run_awareness_cycle",
  "never_fabricate_metrics",
  "never_silent_deterioration",
  "never_auto_modify_production",
  "never_bypass_governance",
  "constitutional_duty_active",
] as const;
