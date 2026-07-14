/** Canonical Vision Integrity Engine (P6-02). */
export const VISION_INTEGRITY_ENGINE_PATH =
  "docs/governance/EMPIREAI_VISION_INTEGRITY_ENGINE.md";

/** Vision Synchronization companion (P4-02). */
export const VISION_SYNC_COMPANION_PATH =
  "docs/governance/EMPIREAI_VISION_SYNCHRONIZATION_SYSTEM.md";

/** Execution Control Center companion (P6-01). */
export const EXECUTION_CONTROL_CENTER_COMPANION_PATH =
  "docs/governance/EMPIREAI_EXECUTION_CONTROL_CENTER.md";

/** VIE principles (P6-02). */
export const VIE_PRINCIPLES = [
  "Execution asks Can we do this? — VIE asks Should we do this?",
  "VIE is the constitutional guardian of Empire direction",
  "Every mission · repository change · deployment · architecture · business capability evaluated against Vision",
  "Pillow owns the Vision Integrity Engine",
  "ECC requests VIE validation before approving execution",
  "Critical Drift blocks execution unless Grand King explicitly approves",
  "Single Vision Integrity authority — no competing systems",
  "Integrity classifications include reason · evidence · impact · recommendation",
] as const;

/** VIE responsibilities (P6-02). */
export const VIE_RESPONSIBILITIES = [
  "vision_validation",
  "vision_compliance",
  "mission_validation",
  "roadmap_validation",
  "architecture_validation",
  "engineering_validation",
  "business_validation",
  "repository_validation",
  "production_validation",
  "evolution_validation",
] as const;

/** Vision validation pipeline stages (P6-02). */
export const VIE_VALIDATION_PIPELINE = [
  "vision",
  "vision_accumulation",
  "soul",
  "ctd",
  "constitution_hierarchy",
  "roadmap",
  "architecture",
  "repository",
  "production_truth",
  "mission_proposal",
  "integrity_evaluation",
  "recommendation",
  "ecc_decision",
] as const;

/** Drift signals VIE detects (P6-02). */
export const VIE_DRIFT_SIGNALS = [
  "vision_drift",
  "mission_drift",
  "architecture_drift",
  "repository_drift",
  "engineering_drift",
  "business_drift",
  "production_drift",
  "knowledge_drift",
  "documentation_drift",
] as const;

/** Integrity classifications (P6-02). */
export const INTEGRITY_CLASSIFICATIONS = [
  "aligned",
  "minor_drift",
  "moderate_drift",
  "major_drift",
  "critical_drift",
  "unknown",
] as const;

/** Integrity review dimensions (P6-02). */
export const INTEGRITY_REVIEW_DIMENSIONS = [
  "why",
  "what",
  "how",
  "proof",
  "business_impact",
  "architecture_impact",
  "engineering_impact",
  "constitutional_impact",
  "long_term_vision_impact",
] as const;
