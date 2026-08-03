/** PILLOW-ARW-001 — Architecture Worker (Q6-03). */

export const ARCHITECTURE_WORKER_SYSTEM_PATH =

  "docs/governance/EMPIREAI_ARCHITECTURE_WORKER_SYSTEM.md" as const;

export const ARCHITECTURE_WORKER_ID = "architecture-worker" as const;

export const ARW_METADATA_VERSION = "ARW-001-v1" as const;

export const ARCHITECTURE_WORKER_REPORT_VERSION = "ARW-RPT-v1" as const;



export const ARCHITECTURE_WORKER_IDENTITY = {

  workerId: "wkr-architecture-01",

  workerName: "Architecture Worker",

  workerType: "architect",

  department: "enterprise_platforms",

  factory: "enterprise-platform-factory",

  role: "role-architect-architecture",

  reportingLine: ["wkr-architecture-01", "pillow"] as string[],

  skillProfile: [

    "skill-requirements-intake",

    "skill-system-architecture-design",

    "skill-module-architecture",

    "skill-api-architecture",

    "skill-service-boundaries",

    "skill-data-flow-architecture",

    "skill-deployment-topology",

    "skill-architectural-dependencies",

    "skill-scalability-security-maintainability-evaluation",

    "skill-structural-architecture-reporting",

  ],

  approvedTools: ["architecture_ledger", "architecture_registry", "structured_reporting"],

  authorityLevel: "autonomous_worker_decision",

} as const;



export const ENGINE_STATUSES = [

  "idle",

  "connecting",

  "active",

  "receiving_requirements",

  "designing_system",

  "defining_modules",

  "designing_apis",

  "designing_services",

  "designing_data_flow",

  "designing_deployment",

  "identifying_dependencies",

  "evaluating_quality",

  "reporting",

  "validating",

  "failed",

] as const;



export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;

export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;

export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;



/** Supported architecture domains (extensible). */

export const ARCHITECTURE_DOMAINS = [

  "system_architecture",

  "module_design",

  "api_design",

  "service_architecture",

  "database_interaction",

  "event_flow",

  "deployment_topology",

  "external_integrations",

  "unknown",

] as const;



export const ARCHITECTURAL_COMPLIANCE_LEVELS = ["compliant", "partial", "non_compliant"] as const;



export const INTEGRATION_TARGETS = [

  "worker_registry",

  "worker_lifecycle",

  "worker_assignment_engine",

  "enterprise_platform_factory_core",

  "requirements_worker",

  "executive_reporting_runtime",

  "worker_performance_review",

  "worker_recovery_system",

] as const;



export const ARW_CAPABILITIES = [

  "receive_approved_requirements_reports",

  "design_overall_system_architecture",

  "define_application_modules",

  "design_internal_and_external_apis",

  "design_service_boundaries",

  "design_data_flow_architecture",

  "design_deployment_topology",

  "identify_architectural_dependencies",

  "evaluate_scalability_security_and_maintainability",

  "produce_machine_readable_architecture_reports",

  "follow_approved_requirements",

  "preserve_complete_traceability",

  "separate_architectural_decisions_from_assumptions",

  "validate_architectural_consistency",

  "never_write_frontend_code",

  "never_write_backend_code",

  "never_deploy_applications",

  "never_override_pillow",

  "never_override_grand_king",

  "never_implement_application_logic",

  "never_implement_q604_or_later",

  "preserve_audit_history",

  "submit_reports_through_executive_reporting_runtime",

  "integrate_worker_registry",

  "integrate_worker_lifecycle",

  "integrate_worker_assignment_engine",

  "integrate_enterprise_platform_factory_core",

  "integrate_requirements_worker",

  "integrate_executive_reporting_runtime",

  "integrate_worker_performance_review",

  "integrate_worker_recovery_system",

  "architecture_worker_validation",

  "health_monitoring",

  "recovery_management",

] as const;


