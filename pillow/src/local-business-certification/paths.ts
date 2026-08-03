/** PILLOW-LBC-001 — Local Business Certification (Q7-11). Final Q7 acceptance gate. */
export const LOCAL_BUSINESS_CERTIFICATION_SYSTEM_PATH =
  "docs/governance/EMPIREAI_LOCAL_BUSINESS_CERTIFICATION_SYSTEM.md" as const;
export const LOCAL_BUSINESS_CERTIFICATION_ID = "local-business-certification" as const;
export const LBC_METADATA_VERSION = "LBC-001-v1" as const;
export const LOCAL_BUSINESS_CERTIFICATION_REPORT_VERSION = "LBC-RPT-v1" as const;
export const LBC_MISSION_ID = "Q7-11" as const;

export const LOCAL_BUSINESS_CERTIFICATION_IDENTITY = {
  workerId: "wkr-local-business-certification-01",
  workerName: "Local Business Certification",
  workerType: "certifier",
  department: "local_business",
  factory: "local-business-factory",
  role: "role-certifier-local-business-certification",
  reportingLine: ["wkr-local-business-certification-01", "pillow"] as string[],
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
 * Q7-01..Q7-10 — the complete Local Business Factory worker pipeline this
 * mission certifies. Every field is used as repository/runtime evidence —
 * nothing here is invented per-run; it is the fixed, observed map of what
 * must exist for the factory to be Certified.
 */
export const Q7_MISSION_CATALOG = [
  {
    missionId: "Q7-01",
    missionName: "local-business-factory-core",
    subsystemId: "local-business-factory-core",
    modulePath: "pillow/src/local-business-factory-core/",
    auditPath: "docs/audits/pillow/q7-01-local-business-factory-core/",
    configPath: "config/local-business-factory-core.config.json",
    governancePath: "docs/governance/EMPIREAI_LOCAL_BUSINESS_FACTORY_CORE_SYSTEM.md",
    dependencyKey: "localBusinessFactoryCore",
    expectedDeliverable:
      "Local Business Factory Core registration, mission lifecycle, and Q7 worker coordination",
  },
  {
    missionId: "Q7-02",
    missionName: "local-market-research-worker",
    subsystemId: "local-market-research-worker",
    modulePath: "pillow/src/local-market-research-worker/",
    auditPath: "docs/audits/pillow/q7-02-local-market-research-worker/",
    configPath: "config/local-market-research-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_LOCAL_MARKET_RESEARCH_WORKER_SYSTEM.md",
    dependencyKey: "localMarketResearchWorker",
    expectedDeliverable:
      "Fixture/evidence-driven demand, competitor, pricing, and opportunity local market research reports",
  },
  {
    missionId: "Q7-03",
    missionName: "service-offer-worker",
    subsystemId: "service-offer-worker",
    modulePath: "pillow/src/service-offer-worker/",
    auditPath: "docs/audits/pillow/q7-03-service-offer-worker/",
    configPath: "config/service-offer-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_SERVICE_OFFER_WORKER_SYSTEM.md",
    dependencyKey: "serviceOfferWorker",
    expectedDeliverable:
      "Service catalogue, packages, and pricing recommendations derived from Q7-02 market research",
  },
  {
    missionId: "Q7-04",
    missionName: "booking-worker",
    subsystemId: "booking-worker",
    modulePath: "pillow/src/booking-worker/",
    auditPath: "docs/audits/pillow/q7-04-booking-worker/",
    configPath: "config/booking-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_BOOKING_WORKER_SYSTEM.md",
    dependencyKey: "bookingWorker",
    expectedDeliverable:
      "Booking create/assign/modify/cancel lifecycle with conflict prevention and confirmation evidence",
  },
  {
    missionId: "Q7-05",
    missionName: "crm-worker",
    subsystemId: "crm-worker",
    modulePath: "pillow/src/crm-worker/",
    auditPath: "docs/audits/pillow/q7-05-crm-worker/",
    configPath: "config/crm-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_CRM_WORKER_SYSTEM.md",
    dependencyKey: "crmWorker",
    expectedDeliverable:
      "Customer profile, lead capture, contact history, and CRM lifecycle management",
  },
  {
    missionId: "Q7-06",
    missionName: "whatsapp-worker",
    subsystemId: "whatsapp-worker",
    modulePath: "pillow/src/whatsapp-worker/",
    auditPath: "docs/audits/pillow/q7-06-whatsapp-worker/",
    configPath: "config/whatsapp-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_WHATSAPP_WORKER_SYSTEM.md",
    dependencyKey: "whatsAppWorker",
    expectedDeliverable:
      "Inbound/outbound WhatsApp conversation handling with preserved conversation history",
  },
  {
    missionId: "Q7-07",
    missionName: "local-seo-worker",
    subsystemId: "local-seo-worker",
    modulePath: "pillow/src/local-seo-worker/",
    auditPath: "docs/audits/pillow/q7-07-local-seo-worker/",
    configPath: "config/local-seo-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_LOCAL_SEO_WORKER_SYSTEM.md",
    dependencyKey: "localSeoWorker",
    expectedDeliverable:
      "GBP recommendations, landing pages, keywords, and metadata derived from Q7-03 service offers",
  },
  {
    missionId: "Q7-08",
    missionName: "lead-generation-worker",
    subsystemId: "lead-generation-worker",
    modulePath: "pillow/src/lead-generation-worker/",
    auditPath: "docs/audits/pillow/q7-08-lead-generation-worker/",
    configPath: "config/lead-generation-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_LEAD_GENERATION_WORKER_SYSTEM.md",
    dependencyKey: "leadGenerationWorker",
    expectedDeliverable:
      "Lead funnel, enquiry capture, qualification, and scoring routed through CRM/booking",
  },
  {
    missionId: "Q7-09",
    missionName: "operations-worker",
    subsystemId: "operations-worker",
    modulePath: "pillow/src/operations-worker/",
    auditPath: "docs/audits/pillow/q7-09-operations-worker/",
    configPath: "config/operations-worker.config.json",
    governancePath: "docs/governance/EMPIREAI_OPERATIONS_WORKER_SYSTEM.md",
    dependencyKey: "operationsWorker",
    expectedDeliverable:
      "Service delivery, assignment, fulfilment, QA, escalation, and completion workflow evidence",
  },
  {
    missionId: "Q7-10",
    missionName: "local-business-launch-pack",
    subsystemId: "local-business-launch-pack",
    modulePath: "pillow/src/local-business-launch-pack/",
    auditPath: "docs/audits/pillow/q7-10-local-business-launch-pack/",
    configPath: "config/local-business-launch-pack.config.json",
    governancePath: "docs/governance/EMPIREAI_LOCAL_BUSINESS_LAUNCH_PACK_SYSTEM.md",
    dependencyKey: "localBusinessLaunchPack",
    expectedDeliverable:
      "Executive launch package assembled and verified from Q7-01..Q7-09 evidence with readiness assessment",
  },
] as const;

/** Missions whose absence must always block Certified — every Q7-01..Q7-10 pipeline stage is critical. */
export const CRITICAL_MISSION_IDS = Q7_MISSION_CATALOG.map((m) => m.missionId);

export const INTEGRATION_TARGETS = [
  ...Q7_MISSION_CATALOG.map((m) => m.subsystemId),
  "worker_registry",
  "worker_lifecycle",
  "executive_reporting_runtime",
  "worker_recovery_system",
  "audit_runtime",
] as const;

export const LBC_CAPABILITIES = [
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
  "produce_local_business_certification_reports",
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
  "never_implement_q801_or_later",
  "integrate_local_business_factory_core",
  "integrate_local_market_research_worker",
  "integrate_service_offer_worker",
  "integrate_booking_worker",
  "integrate_crm_worker",
  "integrate_whatsapp_worker",
  "integrate_local_seo_worker",
  "integrate_lead_generation_worker",
  "integrate_operations_worker",
  "integrate_local_business_launch_pack",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_executive_reporting_runtime",
  "integrate_worker_recovery_system",
  "integrate_audit_runtime",
  "local_business_certification_validation",
  "health_monitoring",
  "recovery_management",
  "final_q7_gate",
] as const;
