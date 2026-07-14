/** PILLOW-FEC-001 — Financial Executive Certification paths (E3-16). */

export const FINANCIAL_EXECUTIVE_CERTIFICATION_PATH =
  "docs/governance/EMPIREAI_FINANCIAL_EXECUTIVE_CERTIFICATION.md";

export const FEC_CERTIFICATION_SCOPE = [
  { id: "E3-01", key: "executive_finance_framework", title: "Executive Finance Framework" },
  { id: "E3-02", key: "capital_allocation_engine", title: "Capital Allocation Engine" },
  { id: "E3-03", key: "executive_budget_planner", title: "Executive Budget Planner" },
  { id: "E3-04", key: "investment_evaluation_engine", title: "Investment Evaluation Engine" },
  { id: "E3-05", key: "roi_intelligence_engine", title: "ROI Intelligence Engine" },
  { id: "E3-06", key: "cash_reserve_intelligence", title: "Cash Reserve Intelligence" },
  { id: "E3-07", key: "profit_optimization_engine", title: "Profit Optimization Engine" },
  { id: "E3-08", key: "cost_optimization_engine", title: "Cost Optimization Engine" },
  { id: "E3-09", key: "financial_scenario_engine", title: "Financial Scenario Engine" },
  { id: "E3-10", key: "executive_kpi_engine", title: "Executive KPI Engine" },
  { id: "E3-11", key: "capital_risk_engine", title: "Capital Risk Engine" },
  { id: "E3-12", key: "executive_forecast_intelligence", title: "Executive Forecast Intelligence" },
  { id: "E3-13", key: "executive_performance_dashboard", title: "Executive Performance Dashboard" },
  { id: "E3-14", key: "enterprise_valuation_engine", title: "Enterprise Valuation Engine" },
  { id: "E3-15", key: "executive_capital_strategy", title: "Executive Capital Strategy" },
] as const;

export const FEC_CERTIFICATION_GATES = [
  "executive_finance_framework_complete",
  "capital_allocation_complete",
  "executive_budget_planner_complete",
  "investment_evaluation_complete",
  "roi_intelligence_complete",
  "cash_reserve_intelligence_complete",
  "profit_optimization_complete",
  "cost_optimization_complete",
  "financial_scenario_engine_complete",
  "executive_kpi_engine_complete",
  "capital_risk_engine_complete",
  "executive_forecast_intelligence_complete",
  "executive_performance_dashboard_complete",
  "enterprise_valuation_engine_complete",
  "executive_capital_strategy_complete",
  "repository_integrity_preserved",
  "constitutional_compliance_confirmed",
] as const;

export const FEC_CERTIFICATION_VALIDATIONS = [
  "executive_finance_framework",
  "capital_allocation",
  "executive_budget_planning",
  "investment_evaluation",
  "roi_intelligence",
  "cash_reserve_intelligence",
  "profit_optimization",
  "cost_optimization",
  "financial_scenario_analysis",
  "executive_kpi_management",
  "capital_risk_management",
  "executive_forecasting",
  "executive_performance_dashboard",
  "enterprise_valuation",
  "executive_capital_strategy",
] as const;

export const FEC_INTEGRATION_VALIDATIONS = [
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
  "executive_planning_programme",
  "executive_decision_engine",
] as const;

export const FEC_FINANCIAL_QUALITY_DOMAINS = [
  "financial_completeness",
  "financial_consistency",
  "architecture_consistency",
  "executive_usability",
  "cross_system_integration",
  "policy_compliance",
  "financial_transparency",
  "strategic_traceability",
  "financial_performance_visibility",
] as const;

export const FEC_DEFECT_SEVERITIES = ["critical", "high", "medium", "low"] as const;

export const FEC_DEFECT_CATEGORIES = [
  "financial",
  "architecture",
  "repository",
  "integration",
  "documentation",
] as const;

/** AI Chief Financial Officer capability criteria (15 executive functions). */
export const FEC_AI_CFO_CAPABILITIES = [
  "plan_enterprise_finances",
  "allocate_capital_intelligently",
  "build_and_manage_budgets",
  "evaluate_investments",
  "measure_roi",
  "optimise_profitability",
  "optimise_costs",
  "manage_liquidity",
  "forecast_financial_performance",
  "monitor_executive_kpis",
  "assess_financial_risk",
  "estimate_enterprise_value",
  "build_long_term_capital_strategy",
  "present_executive_financial_dashboards",
  "support_executive_financial_decisions",
] as const;

/** End-to-end executive financial workflow validations. */
export const FEC_WORKFLOW_VALIDATIONS = [
  "financial_planning_workflow",
  "capital_allocation_workflow",
  "budget_management_workflow",
  "investment_evaluation_workflow",
  "roi_analysis_workflow",
  "liquidity_management_workflow",
  "profit_optimization_workflow",
  "cost_optimization_workflow",
  "scenario_analysis_workflow",
  "kpi_monitoring_workflow",
  "risk_assessment_workflow",
  "forecasting_workflow",
  "performance_dashboard_workflow",
  "valuation_workflow",
  "capital_strategy_workflow",
  "cross_module_integration_workflow",
  "executive_decision_support_workflow",
] as const;

/** Stress and resilience test domains. */
export const FEC_STRESS_TESTS = [
  "multi_engine_chain_stress",
  "concurrent_assembly_stress",
  "getter_chain_depth_stress",
  "fallback_recovery_stress",
  "integration_cascade_stress",
  "data_integrity_stress",
] as const;

/** Performance benchmark domains. */
export const FEC_PERFORMANCE_BENCHMARKS = [
  "assembler_latency",
  "fallback_chain_latency",
  "getter_chain_latency",
  "api_snapshot_latency",
  "dashboard_refresh_latency",
] as const;
