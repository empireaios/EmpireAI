/** PILLOW-REC-001 — Strategic Recommendation Engine (Q0-07). */
export const STRATEGIC_RECOMMENDATION_ENGINE_SYSTEM_PATH =
  "docs/governance/EMPIREAI_STRATEGIC_RECOMMENDATION_ENGINE_SYSTEM.md" as const;
export const STRATEGIC_RECOMMENDATION_ENGINE_ID = "strategic-recommendation-engine" as const;
export const REC_METADATA_VERSION = "REC-001-v1" as const;

export const ENGINE_STATUSES = [
  "idle",
  "connecting",
  "active",
  "analysing",
  "generating",
  "ranking",
  "failed",
] as const;

export const OPERATIONAL_STATES = ["disconnected", "connected", "active", "failed"] as const;
export const VALIDATION_STATUSES = ["pending", "passed", "partial", "failed"] as const;
export const HEALTH_STATUSES = ["healthy", "degraded", "failed", "standby"] as const;

/**
 * Default recommendation categories (Q0-07).
 * Architecture allows additional categories via configuration without redesign.
 */
export const RECOMMENDATION_CATEGORIES = [
  "revenue_growth",
  "cost_reduction",
  "business_expansion",
  "product_improvement",
  "workforce_optimization",
  "infrastructure_improvement",
  "security",
  "customer_experience",
  "automation",
  "risk_mitigation",
  "operational_excellence",
] as const;

export const CATEGORY_LABELS: Record<(typeof RECOMMENDATION_CATEGORIES)[number], string> = {
  revenue_growth: "Revenue Growth",
  cost_reduction: "Cost Reduction",
  business_expansion: "Business Expansion",
  product_improvement: "Product Improvement",
  workforce_optimization: "Workforce Optimization",
  infrastructure_improvement: "Infrastructure Improvement",
  security: "Security",
  customer_experience: "Customer Experience",
  automation: "Automation",
  risk_mitigation: "Risk Mitigation",
  operational_excellence: "Operational Excellence",
};

export const PRIORITY_LEVELS = [
  "critical",
  "high",
  "medium",
  "low",
  "informational",
] as const;

export const PRIORITY_RANK: Record<(typeof PRIORITY_LEVELS)[number], number> = {
  critical: 100,
  high: 80,
  medium: 60,
  low: 40,
  informational: 20,
};

export const APPROVAL_REQUIREMENTS = [
  "none",
  "pillow_approval",
  "grand_king_approval",
  "multi_stage_approval",
] as const;

export const REC_CAPABILITIES = [
  "analyse_empire_state",
  "analyse_active_businesses",
  "analyse_business_performance",
  "analyse_workforce_performance",
  "analyse_infrastructure",
  "analyse_operational_bottlenecks",
  "detect_strategic_opportunities",
  "detect_strategic_risks",
  "generate_executive_recommendations",
  "rank_recommendations_by_priority",
  "explain_recommendation_rationale",
  "produce_recommendation_package",
  "machine_readable_recommendation_output",
  "extensible_recommendation_categories",
  "preserve_auditability",
  "preserve_traceability",
  "recommendation_validation",
  "health_monitoring",
  "recovery_management",
] as const;
