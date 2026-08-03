/** PILLOW-CBW-001 — Course Builder Worker (Q5-05). */
export const COURSE_BUILDER_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_COURSE_BUILDER_WORKER_SYSTEM.md" as const;
export const COURSE_BUILDER_WORKER_ID = "course-builder-worker" as const;
export const CBW_METADATA_VERSION = "CBW-001-v1" as const;
export const COURSE_BUILDER_REPORT_VERSION = "CBW-RPT-v1" as const;

export const COURSE_BUILDER_WORKER_IDENTITY = {
  workerId: "wkr-course-builder-01",
  workerName: "Course Builder Worker",
  workerType: "creator",
  department: "digital_products",
  factory: "digital-products-factory",
  role: "role-creator-course-builder",
  reportingLine: ["wkr-course-builder-01", "pillow"] as string[],
  skillProfile: [
    "skill-approved-research-intake",
    "skill-course-curriculum-design",
    "skill-module-organization",
    "skill-lesson-creation",
    "skill-quizzes-assessments",
    "skill-downloadable-resources",
    "skill-learning-objectives",
    "skill-instructional-flow-validation",
    "skill-export-ready-course-assets",
  ],
  approvedTools: ["course_ledger", "course_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "designing_curriculum",
  "organizing_modules",
  "creating_lessons",
  "generating_quizzes",
  "generating_resources",
  "creating_objectives",
  "validating_flow",
  "exporting",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/** Supported course / educational product types (extensible). */
export const PRODUCT_TYPES = [
  "self_paced_course",
  "video_course",
  "text_based_course",
  "workshop",
  "masterclass",
  "bootcamp",
  "certification_course",
  "hybrid_course",
  "unknown",
] as const;

export const EXPORT_FORMATS = [
  "markdown",
  "scorm_ready",
  "zip_ready",
  "lms_package_ready",
] as const;

export const RESEARCH_COMPLIANCE_LEVELS = ["compliant", "partial", "non_compliant"] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "digital_products_factory_core",
  "digital_product_research_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const CBW_CAPABILITIES = [
  "receive_approved_digital_product_research",
  "design_complete_course_curriculum",
  "organize_modules",
  "create_lessons",
  "generate_quizzes_and_assessments",
  "generate_downloadable_resources",
  "create_learning_objectives",
  "validate_instructional_flow",
  "package_export_ready_course_assets",
  "produce_machine_readable_course_builder_reports",
  "follow_approved_product_research",
  "follow_approved_product_intent",
  "produce_original_course_material",
  "preserve_complete_traceability",
  "validate_educational_quality",
  "perform_self_review_before_submission",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "never_build_sales_pages",
  "never_process_payments",
  "never_deliver_courses_to_customers",
  "never_publish_courses_directly",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_digital_products_factory_core",
  "integrate_digital_product_research_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "course_builder_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
