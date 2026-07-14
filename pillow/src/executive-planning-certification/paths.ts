/** PILLOW-EPC-001 — Executive Planning Certification paths (E1-15). */

export const EXECUTIVE_PLANNING_CERTIFICATION_PATH =
  "docs/governance/EMPIREAI_EXECUTIVE_PLANNING_CERTIFICATION.md";

export const CERTIFICATION_SCOPE = [
  { id: "E1-01", key: "executive_architecture_framework", title: "Executive Architecture Framework" },
  { id: "E1-02", key: "corporate_vision_engine", title: "Corporate Vision Engine" },
  { id: "E1-03", key: "strategic_objective_engine", title: "Strategic Objective Engine" },
  { id: "E1-04", key: "executive_roadmap_engine", title: "Executive Roadmap Engine" },
  { id: "E1-05", key: "priority_management_engine", title: "Priority Management Engine" },
  { id: "E1-06", key: "initiative_portfolio_engine", title: "Initiative Portfolio Engine" },
  { id: "E1-07", key: "department_planning_engine", title: "Department Planning Engine" },
  { id: "E1-08", key: "executive_calendar_engine", title: "Executive Calendar Engine" },
  { id: "E1-09", key: "executive_dependency_engine", title: "Executive Dependency Engine" },
  { id: "E1-10", key: "executive_scenario_planner", title: "Executive Scenario Planner" },
  { id: "E1-11", key: "long_term_growth_planner", title: "Long-Term Growth Planner" },
  { id: "E1-12", key: "opportunity_prioritization_engine", title: "Opportunity Prioritization Engine" },
  { id: "E1-13", key: "strategic_alignment_monitor", title: "Strategic Alignment Monitor" },
  { id: "E1-14", key: "executive_planning_dashboard", title: "Executive Planning Dashboard" },
] as const;

export const CERTIFICATION_GATES = [
  "executive_architecture_complete",
  "vision_synchronization_complete",
  "strategic_planning_complete",
  "dependency_intelligence_complete",
  "scenario_planning_complete",
  "growth_planning_complete",
  "strategic_alignment_monitoring_complete",
  "executive_planning_dashboard_complete",
  "repository_integrity_preserved",
  "constitutional_compliance_confirmed",
] as const;

export const CERTIFICATION_VALIDATIONS = [
  "corporate_vision_management",
  "strategic_objective_management",
  "enterprise_roadmap_planning",
  "priority_management",
  "initiative_portfolio_management",
  "department_planning",
  "executive_scheduling",
  "dependency_intelligence",
  "scenario_planning",
  "long_term_growth_planning",
  "opportunity_prioritization",
  "strategic_alignment_monitoring",
  "executive_planning_dashboard",
] as const;

export const INTEGRATION_VALIDATIONS = [
  "vision",
  "soul",
  "ctd",
  "constitution_hierarchy",
  "engineering_constitution",
  "canonical_architecture",
  "repository",
  "production_truth",
  "journey",
  "pillow",
  "ecc",
  "supervisor",
  "guardian",
  "business_factory",
  "commerce",
  "executive_cockpit",
] as const;

export const EXECUTIVE_QUALITY_DOMAINS = [
  "planning_completeness",
  "strategic_consistency",
  "architecture_consistency",
  "executive_usability",
  "cross_system_integration",
  "dependency_integrity",
  "planning_explainability",
  "executive_transparency",
  "strategic_traceability",
] as const;

export const DEFECT_SEVERITIES = ["critical", "high", "medium", "low"] as const;

export const DEFECT_CATEGORIES = [
  "planning",
  "architecture",
  "repository",
  "integration",
  "documentation",
] as const;
