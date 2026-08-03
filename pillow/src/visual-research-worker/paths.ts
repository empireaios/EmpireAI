/** PILLOW-VRW-001 — Visual Research Worker (Q4-08). */
export const VISUAL_RESEARCH_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_VISUAL_RESEARCH_WORKER_SYSTEM.md" as const;
export const VISUAL_RESEARCH_WORKER_ID = "visual-research-worker" as const;
export const VRW_METADATA_VERSION = "VRW-001-v1" as const;
export const VRW_REPORT_VERSION = "VRW-RPT-v1" as const;

export const VISUAL_RESEARCH_WORKER_IDENTITY = {
  workerId: "wkr-visual-research-01",
  workerName: "Visual Research Worker",
  workerType: "researcher",
  department: "media",
  factory: "media-factory",
  role: "role-researcher-visual-research",
  reportingLine: ["wkr-visual-research-01", "pillow"] as string[],
  skillProfile: [
    "skill-visual-scene-analysis",
    "skill-stock-library-search",
    "skill-public-domain-research",
    "skill-copyright-classification",
    "skill-timeline-visual-mapping",
    "skill-asset-traceability",
  ],
  approvedTools: ["visual_research_ledger", "visual_asset_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "researching",
  "classifying",
  "reporting",
  "validating",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const CONTENT_FORMATS = [
  "long_form_video",
  "short",
  "reel",
  "documentary",
  "explainer",
  "educational",
  "news",
  "list_video",
  "social_content",
] as const;

export const ASSET_TYPES = [
  "stock_image",
  "stock_video",
  "public_domain_image",
  "public_domain_video",
  "original_generated_image",
  "original_generated_graphic",
  "diagram",
  "screenshot",
  "archive_material",
] as const;

export const COPYRIGHT_STATUSES = [
  "licensed_stock",
  "public_domain",
  "original_internal",
  "fair_use_candidate",
  "unknown",
  "restricted",
] as const;

export const USAGE_RIGHTS = [
  "royalty_free",
  "editorial_only",
  "commercial_ok",
  "attribution_required",
  "internal_only",
  "restricted",
  "unknown",
] as const;

export const COVERAGE_STATUSES = ["covered", "partial", "missing", "needs_generation"] as const;

export const APPROVED_VISUAL_SOURCES = [
  "shutterstock",
  "getty_images",
  "adobe_stock",
  "pexels",
  "unsplash",
  "pixabay",
  "wikimedia_commons",
  "library_of_congress",
  "internet_archive",
  "internal_generated",
] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "script_worker",
  "thumbnail_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const VRW_CAPABILITIES = [
  "receive_approved_scripts",
  "break_scripts_into_visual_scenes",
  "identify_required_visual_assets",
  "search_approved_stock_libraries",
  "search_public_domain_sources",
  "identify_internally_generated_assets",
  "classify_copyright_status",
  "match_visuals_to_script_timeline",
  "detect_missing_visual_coverage",
  "produce_machine_readable_visual_research_reports",
  "use_only_approved_visual_sources",
  "preserve_complete_asset_traceability",
  "preserve_copyright_information",
  "identify_licensing_restrictions",
  "detect_missing_visual_assets",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_script_worker",
  "integrate_thumbnail_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "visual_research_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
