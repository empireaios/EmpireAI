/** PILLOW-ICW-001 — Image & Creative Worker (Q4-09). */
export const IMAGE_CREATIVE_WORKER_SYSTEM_PATH =
  "docs/governance/EMPIREAI_IMAGE_CREATIVE_WORKER_SYSTEM.md" as const;
export const IMAGE_CREATIVE_WORKER_ID = "image-creative-worker" as const;
export const ICW_METADATA_VERSION = "ICW-001-v1" as const;
export const ICW_REPORT_VERSION = "ICW-RPT-v1" as const;

export const IMAGE_CREATIVE_WORKER_IDENTITY = {
  workerId: "wkr-image-creative-01",
  workerName: "Image & Creative Worker",
  workerType: "creator",
  department: "media",
  factory: "media-factory",
  role: "role-creator-image-creative",
  reportingLine: ["wkr-image-creative-01", "pillow"] as string[],
  skillProfile: [
    "skill-original-graphic-design",
    "skill-image-editing",
    "skill-infographic-creation",
    "skill-cover-banner-design",
    "skill-social-media-assets",
    "skill-copyright-compliance",
    "skill-creative-variant-generation",
  ],
  approvedTools: ["creative_asset_ledger", "creative_registry", "structured_reporting"],
  authorityLevel: "autonomous_worker_decision",
} as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "receiving",
  "generating",
  "editing",
  "validating",
  "reporting",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const ENGINE_HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

export const CREATIVE_ASSET_TYPES = [
  "thumbnail",
  "cover_image",
  "banner",
  "infographic",
  "diagram",
  "illustration",
  "social_graphic",
  "presentation_graphic",
  "supporting_visual",
] as const;

export const QUALITY_STATUSES = ["pass", "pass_with_notes", "fail", "pending_review"] as const;

export const COPYRIGHT_STATUSES = [
  "original",
  "licensed_derivative",
  "public_domain_derivative",
  "restricted",
  "unknown",
] as const;

export const INTEGRATION_TARGETS = [
  "worker_registry",
  "worker_lifecycle",
  "worker_assignment_engine",
  "visual_research_worker",
  "thumbnail_worker",
  "executive_reporting_runtime",
  "worker_performance_review",
  "worker_recovery_system",
] as const;

export const ICW_CAPABILITIES = [
  "receive_visual_research_reports",
  "receive_thumbnail_specifications",
  "generate_original_graphics",
  "edit_existing_images",
  "create_diagrams_and_infographics",
  "create_covers_and_banners",
  "create_social_media_assets",
  "generate_multiple_creative_variants",
  "validate_asset_quality_and_compliance",
  "produce_machine_readable_creative_asset_reports",
  "preserve_complete_asset_traceability",
  "respect_copyright_and_licensing",
  "preserve_original_assets",
  "record_all_edits_performed",
  "produce_multiple_variants_when_appropriate",
  "preserve_audit_history",
  "submit_reports_through_executive_reporting_runtime",
  "integrate_worker_registry",
  "integrate_worker_lifecycle",
  "integrate_worker_assignment_engine",
  "integrate_visual_research_worker",
  "integrate_thumbnail_worker",
  "integrate_worker_performance_review",
  "integrate_worker_recovery_system",
  "image_creative_worker_validation",
  "health_monitoring",
  "recovery_management",
] as const;
