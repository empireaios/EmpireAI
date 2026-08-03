/** PILLOW-AFCRT-001 — Affiliate Certification (Q8-09). Final Q8 acceptance gate. */
export const AFFILIATE_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_AFFILIATE_CERTIFICATION_SYSTEM.md" as const;
export const AFFILIATE_CERTIFICATION_ID = "affiliate-certification" as const;
export const AFCRT_METADATA_VERSION = "AFCRT-001-v1" as const;
export const AFFILIATE_CERTIFICATION_REPORT_VERSION = "AFCRT-RPT-v1" as const;
export const AFCRT_MISSION_ID = "Q8-09" as const;

export const AFFILIATE_CERTIFICATION_IDENTITY = {
  workerId: "wkr-affiliate-certification-01",
  workerName: "Affiliate Certification",
  workerType: "certifier",
  department: "affiliate",
  factory: "affiliate-factory",
  role: "role-certifier-affiliate-certification",
  reportingLine: ["wkr-affiliate-certification-01", "pillow"] as string[],
  skillProfile: [
    "skill-repository-evidence-collection",
    "skill-runtime-worker-probing",
    "skill-integration-verification",
    "skill-production-readiness-assessment",
    "skill-governance-compliance-verification",
    "skill-operational-readiness-assessment",
    "skill-workflow-completeness-verification",
    "skill-reporting-capability-verification",
    "skill-certification-decision-gating",
    "skill-certification-reporting",
  ],
  approvedTools: ["repository_evidence_scanner", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "collecting_evidence",
  "probing_runtime",
  "verifying_integrations",
  "assessing_readiness",
  "certifying",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Every certification decision is derived from observed evidence — never fabricated. */
export const COMPONENT_STATUSES = [
  "Completed",
  "Partially Implemented",
  "Missing",
  "Broken / Deviating",
  "Intentionally Deferred",
] as const;

export const CERTIFICATION_DECISIONS = [
  "Certified",
  "Conditionally_Certified",
  "Not_Certified",
  "Failed",
  "Deferred",
] as const;

export const AUDIT_STATUSES = [
  "draft",
  "evidence_collected",
  "integrations_verified",
  "readiness_assessed",
  "certified",
  "conditionally_certified",
  "not_certified",
  "failed",
  "deferred",
  "submitted",
  "rejected",
  "unknown",
] as const;

/**
 * Q8-01..Q8-08 — the complete Affiliate Factory worker pipeline this
 * mission certifies. Every field is used as repository/runtime evidence —
 * nothing here is invented per-run; it is the fixed, observed map of what
 * must exist for the factory to be Certified.
 */
export const Q8_MISSION_CATALOG = [
  {
    missionId: "Q8-01",
    missionName: "affiliate-factory-core",
    subsystemId: "affiliate-factory-core",
    modulePath: "pillow/src/affiliate-factory-core/",
    auditPath: "docs/audits/pillow/q8-01-affiliate-factory-core/",
    configPath: "config/affiliate-factory-core.config.json",
    governancePath: "docs/governance/EMPIREAI_AFFILIATE_FACTORY_CORE_SYSTEM.md",
    dependencyKey: "affiliateFactoryCore",
    expectedDeliverable:
      "Affiliate Factory Core registration, mission lifecycle, and Q8 worker coordination",
  },
  {
    missionId: "Q8-02",
    missionName: "affiliate-opportunity-worker",
    subsystemId: "affiliate-opportunity-worker",
    modulePath: "pillow/src/affiliate-opportunity-worker/",
    auditPath: "docs/audits/pillow/q8-02-affiliate-opportunity-worker/",
    configPath: "config/affiliate-opportunity-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_AFFILIATE_OPPORTUNITY_WORKER_SYSTEM.md",
    dependencyKey: "affiliateOpportunityWorker",
    expectedDeliverable:
      "Evidence-driven affiliate opportunity scoring and Affiliate Opportunity Reports",
  },
  {
    missionId: "Q8-03",
    missionName: "comparison-site-worker",
    subsystemId: "comparison-site-worker",
    modulePath: "pillow/src/comparison-site-worker/",
    auditPath: "docs/audits/pillow/q8-03-comparison-site-worker/",
    configPath: "config/comparison-site-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_COMPARISON_SITE_WORKER_SYSTEM.md",
    dependencyKey: "comparisonSiteWorker",
    expectedDeliverable:
      "Comparison site structure and Comparison Site Reports derived from opportunity packages",
  },
  {
    missionId: "Q8-04",
    missionName: "review-content-worker",
    subsystemId: "review-content-worker",
    modulePath: "pillow/src/review-content-worker/",
    auditPath: "docs/audits/pillow/q8-04-review-content-worker/",
    configPath: "config/review-content-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_REVIEW_CONTENT_WORKER_SYSTEM.md",
    dependencyKey: "reviewContentWorker",
    expectedDeliverable:
      "Review articles, pros/cons, alternatives, and Review Content Reports",
  },
  {
    missionId: "Q8-05",
    missionName: "seo-content-worker",
    subsystemId: "seo-content-worker",
    modulePath: "pillow/src/seo-content-worker/",
    auditPath: "docs/audits/pillow/q8-05-seo-content-worker/",
    configPath: "config/seo-content-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_SEO_CONTENT_WORKER_SYSTEM.md",
    dependencyKey: "seoContentWorker",
    expectedDeliverable:
      "SEO content plans, articles, keyword mapping, and SEO Content Reports",
  },
  {
    missionId: "Q8-06",
    missionName: "email-funnel-worker",
    subsystemId: "email-funnel-worker",
    modulePath: "pillow/src/email-funnel-worker/",
    auditPath: "docs/audits/pillow/q8-06-email-funnel-worker/",
    configPath: "config/email-funnel-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_EMAIL_FUNNEL_WORKER_SYSTEM.md",
    dependencyKey: "emailFunnelWorker",
    expectedDeliverable:
      "Lead magnets, email sequences, CTA strategy, and Email Funnel Reports",
  },
  {
    missionId: "Q8-07",
    missionName: "analytics-worker",
    subsystemId: "analytics-worker",
    modulePath: "pillow/src/analytics-worker/",
    auditPath: "docs/audits/pillow/q8-07-analytics-worker/",
    configPath: "config/analytics-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_ANALYTICS_WORKER_SYSTEM.md",
    dependencyKey: "analyticsWorker",
    expectedDeliverable:
      "Click/conversion/commission/SEO/funnel analytics and Analytics Reports",
  },
  {
    missionId: "Q8-08",
    missionName: "affiliate-compliance-worker",
    subsystemId: "affiliate-compliance-worker",
    modulePath: "pillow/src/affiliate-compliance-worker/",
    auditPath: "docs/audits/pillow/q8-08-affiliate-compliance-worker/",
    configPath: "config/affiliate-compliance-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_AFFILIATE_COMPLIANCE_WORKER_SYSTEM.md",
    dependencyKey: "affiliateComplianceWorker",
    expectedDeliverable:
      "Disclosure/platform/disclaimer validation and Affiliate Compliance Reports consumable by Q8-09",
  },
] as const;

/** Missions whose absence must always block Certified — every Q8-01..Q8-08 pipeline stage is critical. */
export const CRITICAL_MISSION_IDS = Q8_MISSION_CATALOG.map((m) => m.missionId);

export const INTEGRATION_TARGETS = [
  ...Q8_MISSION_CATALOG.map((m) => m.subsystemId),
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_recovery_system",
  "audit_runtime",
] as const;

export const AFCRT_CAPABILITIES = [
  "collect_repository_evidence",
  "probe_runtime_workers",
  "classify_component_status",
  "verify_integrations",
  "verify_deliverables",
  "verify_workflow_completeness",
  "verify_production_readiness",
  "verify_governance_compliance",
  "verify_reporting_capability",
  "verify_operational_readiness",
  "produce_certification_findings",
  "produce_affiliate_certification_reports",
  "submit_reports_through_executive_reporting_runtime",
  "preserve_complete_traceability",
  "preserve_certification_audit_history",
  "never_fabricate_verification_results",
  "never_certify_unsupported_functionality",
  "never_implement_missing_functionality",
  "never_auto_correct_failed_implementations",
  "never_override_governance",
  "never_override_approved_architecture",
  "never_override_pillow",
  "never_override_grand_king",
  "never_bypass_grand_king_approval",
  "never_implement_q901_or_later",
  "integrate_affiliate_factory_core",
  "integrate_affiliate_opportunity_worker",
  "integrate_comparison_site_worker",
  "integrate_review_content_worker",
  "integrate_seo_content_worker",
  "integrate_email_funnel_worker",
  "integrate_analytics_worker",
  "integrate_affiliate_compliance_worker",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_recovery_system",
  "integrate_audit_runtime",
  "affiliate_certification_validation",
  "health_monitoring",
  "recovery_management",
  "final_q8_gate",
] as const;
