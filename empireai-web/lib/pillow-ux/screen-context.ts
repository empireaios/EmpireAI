import { resolveCockpitCentreId, getCockpitCentreById } from "@/lib/cockpit-ux/navigation";
import type { PillowPageContextOverride, PillowWorkspaceContext } from "./types";

type ScreenMeta = {
  screenId: string;
  screenTitle: string;
  module?: string;
  purpose?: string;
  uxId?: string;
};

const COCKPIT_SCREEN_OVERRIDES: Array<{ prefix: string; meta: ScreenMeta }> = [
  { prefix: "/cockpit/founder/builder", meta: { screenId: "P7-BUILDER", screenTitle: "Builder Console", module: "builder", purpose: "Live Builder execution · repository · validation · recovery", uxId: "P7-05" } },
  { prefix: "/cockpit/founder/live-eta", meta: { screenId: "P7-LIVE-ETA", screenTitle: "Live ETA", module: "live_eta", purpose: "Mission countdown · supervisor timer · builder execution evidence", uxId: "P7-06" } },
  { prefix: "/cockpit/founder/explainability", meta: { screenId: "P7-EXPLAIN", screenTitle: "Explainability", module: "explainability", purpose: "Constitutional WHY · WHAT · HOW · PROOF for every recommendation", uxId: "P7-07" } },
  { prefix: "/cockpit/commerce/factory", meta: { screenId: "P8-FACTORY", screenTitle: "Business Factory", module: "factory", purpose: "Manufacture businesses from vision through launch and growth", uxId: "P8-01" } },
  { prefix: "/cockpit/commerce/operating", meta: { screenId: "P8-COMMERCE", screenTitle: "Commerce Operating Model", module: "commerce", purpose: "Sell · fulfil · advertise · revenue · growth", uxId: "P8-02" } },
  { prefix: "/cockpit/commerce/automation", meta: { screenId: "P8-AUTOMATION", screenTitle: "Business Automation", module: "automation", purpose: "Constitutionally governed commercial automation", uxId: "P8-04" } },
  { prefix: "/cockpit/commerce/intelligence", meta: { screenId: "P8-INTELLIGENCE", screenTitle: "Commercial Intelligence", module: "intelligence", purpose: "Evidence-backed commercial decisions and recommendations", uxId: "P8-05" } },
  { prefix: "/cockpit/founder/grand-king", meta: { screenId: "P8-GRAND-KING", screenTitle: "Grand King Operating Account", module: "grand_king", purpose: "Constitutional production reference · co-grand-king", uxId: "P8-06" } },
  { prefix: "/cockpit/founder/repository-evolution", meta: { screenId: "P9-REPOSITORY", screenTitle: "Repository Evolution", module: "repository_evolution", purpose: "Continuous repository improvement · constitutional memory", uxId: "P9-01" } },
  { prefix: "/cockpit/founder/knowledge-evolution", meta: { screenId: "P9-KNOWLEDGE", screenTitle: "Knowledge Evolution", module: "knowledge_evolution", purpose: "Evidence-based knowledge growth · no knowledge loss", uxId: "P9-02" } },
  { prefix: "/cockpit/founder/architecture-evolution", meta: { screenId: "P9-ARCHITECTURE", screenTitle: "Architecture Evolution", module: "architecture_evolution", purpose: "Continuous architecture improvement · constitutional stability", uxId: "P9-03" } },
  { prefix: "/cockpit/founder/ai-evolution", meta: { screenId: "P9-AI-EVOLUTION", screenTitle: "AI Evolution", module: "ai_evolution", purpose: "Continuous AI improvement · explainable · constitutionally governed", uxId: "P9-04" } },
  { prefix: "/cockpit/founder/empire-evolution", meta: { screenId: "P9-EMPIRE", screenTitle: "Empire Evolution", module: "empire_evolution", purpose: "P1–P9 constitutional completion · perpetual Empire improvement", uxId: "P9-05" } },
  { prefix: "/cockpit/founder/executive-planning-certification", meta: { screenId: "E1-CERTIFIED", screenTitle: "Executive Planning Certified", module: "executive_planning_certification", purpose: "E1-15 programme certification · Phase E1 complete", uxId: "E1-15" } },
  { prefix: "/cockpit/founder/decision-architecture", meta: { screenId: "E2-DECISIONS", screenTitle: "Decision Architecture", module: "decision_architecture", purpose: "E2-01 Executive Decision Architecture", uxId: "E2-01" } },
  { prefix: "/cockpit/founder/risk-assessment", meta: { screenId: "E2-RISKS", screenTitle: "Risk Assessment Engine", module: "risk_assessment", purpose: "E2-02 Risk Assessment Engine", uxId: "E2-02" } },
  { prefix: "/cockpit/founder/decision-simulation", meta: { screenId: "E2-SIMULATION", screenTitle: "Decision Simulation Engine", module: "decision_simulation", purpose: "E2-03 Decision Simulation Engine", uxId: "E2-03" } },
  { prefix: "/cockpit/founder/executive-recommendations", meta: { screenId: "E2-RECOMMENDATIONS", screenTitle: "Executive Recommendation Engine", module: "executive_recommendations", purpose: "E2-04 Executive Recommendation Engine", uxId: "E2-04" } },
  { prefix: "/cockpit/founder/resource-allocation", meta: { screenId: "E2-RESOURCES", screenTitle: "Resource Allocation Engine", module: "resource_allocation", purpose: "E2-05 Resource Allocation Engine", uxId: "E2-05" } },
  { prefix: "/cockpit/founder/conflict-resolution", meta: { screenId: "E2-CONFLICTS", screenTitle: "Conflict Resolution Engine", module: "conflict_resolution", purpose: "E2-06 Conflict Resolution Engine", uxId: "E2-06" } },
  { prefix: "/cockpit/founder/executive-approval", meta: { screenId: "E2-APPROVAL", screenTitle: "Executive Approval Intelligence", module: "executive_approval", purpose: "E2-07 Executive Approval Intelligence", uxId: "E2-07" } },
  { prefix: "/cockpit/founder/crisis-decisions", meta: { screenId: "E2-CRISES", screenTitle: "Crisis Decision Engine", module: "crisis_decisions", purpose: "E2-08 Crisis Decision Engine", uxId: "E2-08" } },
  { prefix: "/cockpit/founder/executive-escalations", meta: { screenId: "E2-ESCALATIONS", screenTitle: "Executive Escalation Engine", module: "executive_escalations", purpose: "E2-09 Executive Escalation Engine", uxId: "E2-09" } },
  { prefix: "/cockpit/founder/trade-off-analysis", meta: { screenId: "E2-TRADEOFFS", screenTitle: "Trade-off Analysis Engine", module: "trade_off_analysis", purpose: "E2-10 Trade-off Analysis Engine", uxId: "E2-10" } },
  { prefix: "/cockpit/founder/executive-consensus", meta: { screenId: "E2-CONSENSUS", screenTitle: "Executive Consensus Engine", module: "executive_consensus", purpose: "E2-11 Executive Consensus Engine", uxId: "E2-11" } },
  { prefix: "/cockpit/founder/executive-policies", meta: { screenId: "E2-POLICIES", screenTitle: "Executive Policy Engine", module: "executive_policies", purpose: "E2-12 Executive Policy Engine", uxId: "E2-12" } },
  { prefix: "/cockpit/founder/decision-audit", meta: { screenId: "E2-AUDIT", screenTitle: "Decision Audit Engine", module: "decision_audit", purpose: "E2-13 Decision Audit Engine", uxId: "E2-13" } },
  { prefix: "/cockpit/founder/executive-confidence", meta: { screenId: "E2-CONFIDENCE", screenTitle: "Executive Confidence Engine", module: "executive_confidence", purpose: "E2-14 Executive Confidence Engine", uxId: "E2-14" } },
  { prefix: "/cockpit/founder/autonomous-decision-monitor", meta: { screenId: "E2-MONITOR", screenTitle: "Autonomous Decision Monitor", module: "autonomous_decision_monitor", purpose: "E2-15 Autonomous Decision Monitor", uxId: "E2-15" } },
  { prefix: "/cockpit/founder/executive-decision-certification", meta: { screenId: "E2-CERTIFIED", screenTitle: "Executive Decision Certification", module: "executive_decision_certification", purpose: "E2-16 Executive Decision Certified", uxId: "E2-16" } },
  { prefix: "/cockpit/founder/executive-finance", meta: { screenId: "E3-FINANCE", screenTitle: "Executive Finance Framework", module: "executive_finance", purpose: "E3-01 Executive Finance Framework", uxId: "E3-01" } },
  { prefix: "/cockpit/founder/capital-allocation", meta: { screenId: "E3-CAPITAL", screenTitle: "Capital Allocation Engine", module: "capital_allocation", purpose: "E3-02 Capital Allocation Engine", uxId: "E3-02" } },
  { prefix: "/cockpit/founder/executive-budget", meta: { screenId: "E3-BUDGET", screenTitle: "Executive Budget Planner", module: "executive_budget", purpose: "E3-03 Executive Budget Planner", uxId: "E3-03" } },
  { prefix: "/cockpit/founder/investment-evaluation", meta: { screenId: "E3-INVEST", screenTitle: "Investment Evaluation Engine", module: "investment_evaluation", purpose: "E3-04 Investment Evaluation Engine", uxId: "E3-04" } },
  { prefix: "/cockpit/founder/roi-intelligence", meta: { screenId: "E3-ROI", screenTitle: "ROI Intelligence Engine", module: "roi_intelligence", purpose: "E3-05 ROI Intelligence Engine", uxId: "E3-05" } },
  { prefix: "/cockpit/founder/cash-reserve", meta: { screenId: "E3-CASH", screenTitle: "Cash Reserve Intelligence", module: "cash_reserve", purpose: "E3-06 Cash Reserve Intelligence", uxId: "E3-06" } },
  { prefix: "/cockpit/founder/profit-optimization", meta: { screenId: "E3-PROFIT", screenTitle: "Profit Optimization Engine", module: "profit_optimization", purpose: "E3-07 Profit Optimization Engine", uxId: "E3-07" } },
  { prefix: "/cockpit/founder/cost-optimization", meta: { screenId: "E3-COST", screenTitle: "Cost Optimization Engine", module: "cost_optimization", purpose: "E3-08 Cost Optimization Engine", uxId: "E3-08" } },
  { prefix: "/cockpit/founder/financial-scenario", meta: { screenId: "E3-SCENARIO", screenTitle: "Financial Scenario Engine", module: "financial_scenario", purpose: "E3-09 Financial Scenario Engine", uxId: "E3-09" } },
  { prefix: "/cockpit/founder/executive-kpi", meta: { screenId: "E3-KPI", screenTitle: "Executive KPI Engine", module: "executive_kpi", purpose: "E3-10 Executive KPI Engine", uxId: "E3-10" } },
  { prefix: "/cockpit/founder/capital-risk", meta: { screenId: "E3-RISK", screenTitle: "Capital Risk Engine", module: "capital_risk", purpose: "E3-11 Capital Risk Engine", uxId: "E3-11" } },
  { prefix: "/cockpit/founder/executive-forecast", meta: { screenId: "E3-FORECAST", screenTitle: "Executive Forecast Intelligence", module: "executive_forecast", purpose: "E3-12 Executive Forecast Intelligence", uxId: "E3-12" } },
  { prefix: "/cockpit/founder/executive-performance", meta: { screenId: "E3-PERFORMANCE", screenTitle: "Executive Performance Dashboard", module: "executive_performance", purpose: "E3-13 Executive Performance Dashboard", uxId: "E3-13" } },
  { prefix: "/cockpit/founder/enterprise-valuation", meta: { screenId: "E3-VALUATION", screenTitle: "Enterprise Valuation Engine", module: "enterprise_valuation", purpose: "E3-14 Enterprise Valuation Engine", uxId: "E3-14" } },
  { prefix: "/cockpit/founder/executive-capital-strategy", meta: { screenId: "E3-CAPSTRAT", screenTitle: "Executive Capital Strategy", module: "executive_capital_strategy", purpose: "E3-15 Executive Capital Strategy", uxId: "E3-15" } },
  { prefix: "/cockpit/founder/financial-executive-certification", meta: { screenId: "E3-CERTIFIED", screenTitle: "Financial Executive Certification", module: "financial_executive_certification", purpose: "E3-16 Financial Executive Certified", uxId: "E3-16" } },
  { prefix: "/cockpit/founder/market-intelligence", meta: { screenId: "E4-MARKETS", screenTitle: "Market Intelligence Engine", module: "market_intelligence", purpose: "E4-01 Market Intelligence Engine", uxId: "E4-01" } },
  { prefix: "/cockpit/founder/competitor-intelligence", meta: { screenId: "E4-COMPETITORS", screenTitle: "Competitor Intelligence Engine", module: "competitor_intelligence", purpose: "E4-02 Competitor Intelligence Engine", uxId: "E4-02" } },
  { prefix: "/cockpit/founder/opportunity-discovery", meta: { screenId: "E4-OPPORTUNITIES", screenTitle: "Opportunity Discovery Engine", module: "opportunity_discovery", purpose: "E4-03 Opportunity Discovery Engine", uxId: "E4-03" } },
  { prefix: "/cockpit/founder/threat-detection", meta: { screenId: "E4-THREATS", screenTitle: "Threat Detection Engine", module: "threat_detection", purpose: "E4-04 Threat Detection Engine", uxId: "E4-04" } },
  { prefix: "/cockpit/founder/industry-intelligence", meta: { screenId: "E4-INDUSTRIES", screenTitle: "Industry Intelligence Engine", module: "industry_intelligence", purpose: "E4-05 Industry Intelligence Engine", uxId: "E4-05" } },
  { prefix: "/cockpit/founder/customer-behaviour", meta: { screenId: "E4-CUSTOMERS", screenTitle: "Customer Behaviour Intelligence", module: "customer_behaviour", purpose: "E4-06 Customer Behaviour Intelligence", uxId: "E4-06" } },
  { prefix: "/cockpit/founder/innovation-intelligence", meta: { screenId: "E4-INNOVATION", screenTitle: "Innovation Intelligence Engine", module: "innovation_intelligence", purpose: "E4-07 Innovation Intelligence Engine", uxId: "E4-07" } },
  { prefix: "/cockpit/founder/executive-knowledge-graph", meta: { screenId: "E4-KNOWLEDGE", screenTitle: "Executive Knowledge Graph", module: "executive_knowledge_graph", purpose: "E4-08 Executive Knowledge Graph", uxId: "E4-08" } },
  { prefix: "/cockpit/founder/executive-prediction", meta: { screenId: "E4-PREDICTION", screenTitle: "Executive Prediction Engine", module: "executive_prediction", purpose: "E4-09 Executive Prediction Engine", uxId: "E4-09" } },
  { prefix: "/cockpit/founder/executive-insight", meta: { screenId: "E4-INSIGHT", screenTitle: "Executive Insight Engine", module: "executive_insight", purpose: "E4-10 Executive Insight Engine", uxId: "E4-10" } },
  { prefix: "/cockpit/founder/enterprise-pattern", meta: { screenId: "E4-PATTERN", screenTitle: "Enterprise Pattern Engine", module: "enterprise_pattern", purpose: "E4-11 Enterprise Pattern Engine", uxId: "E4-11" } },
  { prefix: "/cockpit/founder/executive-benchmark", meta: { screenId: "E4-BENCHMARK", screenTitle: "Executive Benchmark Engine", module: "executive_benchmark", purpose: "E4-12 Executive Benchmark Engine", uxId: "E4-12" } },
  { prefix: "/cockpit/founder/cross-business-intelligence", meta: { screenId: "E4-CROSS-BUSINESS", screenTitle: "Cross-Business Intelligence", module: "cross_business_intelligence", purpose: "E4-13 Cross-Business Intelligence", uxId: "E4-13" } },
  { prefix: "/cockpit/founder/executive-advisory", meta: { screenId: "E4-ADVISORY", screenTitle: "Executive Advisory Engine", module: "executive_advisory", purpose: "E4-14 Executive Advisory Engine", uxId: "E4-14" } },
  { prefix: "/cockpit/founder/executive-intelligence-certification", meta: { screenId: "E4-CERTIFIED", screenTitle: "Executive Intelligence Certification", module: "executive_intelligence_certification", purpose: "E4-15 Executive Intelligence Certified", uxId: "E4-15" } },
  { prefix: "/cockpit/founder/enterprise-governance", meta: { screenId: "E5-GOVERNANCE", screenTitle: "Enterprise Governance Framework", module: "enterprise_governance", purpose: "E5-01 Enterprise Governance Framework", uxId: "E5-01" } },
  { prefix: "/cockpit/founder/executive-constitutional-monitor", meta: { screenId: "E5-CONSTITUTIONAL", screenTitle: "Executive Constitutional Monitor", module: "executive_constitutional_monitor", purpose: "E5-02 Executive Constitutional Monitor", uxId: "E5-02" } },
  { prefix: "/cockpit/founder/enterprise-audit-engine", meta: { screenId: "E5-AUDIT", screenTitle: "Enterprise Audit Engine", module: "enterprise_audit_engine", purpose: "E5-03 Enterprise Audit Engine", uxId: "E5-03" } },
  { prefix: "/cockpit/founder/executive-compliance", meta: { screenId: "E5-COMPLIANCE", screenTitle: "Executive Compliance Engine", module: "executive_compliance", purpose: "E5-04 Executive Compliance Engine", uxId: "E5-04" } },
  { prefix: "/cockpit/founder/executive-ethics", meta: { screenId: "E5-ETHICS", screenTitle: "Executive Ethics Engine", module: "executive_ethics", purpose: "E5-05 Executive Ethics Engine", uxId: "E5-05" } },
  { prefix: "/cockpit/founder/executive-accountability", meta: { screenId: "E5-ACCOUNTABILITY", screenTitle: "Executive Accountability Engine", module: "executive_accountability", purpose: "E5-06 Executive Accountability Engine", uxId: "E5-06" } },
  { prefix: "/cockpit/founder/executive-transparency", meta: { screenId: "E5-TRANSPARENCY", screenTitle: "Executive Transparency Engine", module: "executive_transparency", purpose: "E5-07 Executive Transparency Engine", uxId: "E5-07" } },
  { prefix: "/cockpit/founder/executive-exception-manager", meta: { screenId: "E5-EXCEPTION", screenTitle: "Executive Exception Manager", module: "executive_exception_manager", purpose: "E5-08 Executive Exception Manager", uxId: "E5-08" } },
  { prefix: "/cockpit/founder/enterprise-risk-governance", meta: { screenId: "E5-RISK", screenTitle: "Enterprise Risk Governance", module: "enterprise_risk_governance", purpose: "E5-09 Enterprise Risk Governance", uxId: "E5-09" } },
  { prefix: "/cockpit/founder/executive-review-board", meta: { screenId: "E5-REVIEW", screenTitle: "Executive Review Board", module: "executive_review_board", purpose: "E5-10 Executive Review Board", uxId: "E5-10" } },
  { prefix: "/cockpit/founder/executive-policy-evolution", meta: { screenId: "E5-POLICY-EVO", screenTitle: "Executive Policy Evolution", module: "executive_policy_evolution", purpose: "E5-11 Executive Policy Evolution", uxId: "E5-11" } },
  { prefix: "/cockpit/founder/executive-trust-engine", meta: { screenId: "E5-TRUST", screenTitle: "Executive Trust Engine", module: "executive_trust_engine", purpose: "E5-12 Executive Trust Engine", uxId: "E5-12" } },
  { prefix: "/cockpit/founder/enterprise-constitutional-guardian", meta: { screenId: "E5-GUARDIAN", screenTitle: "Enterprise Constitutional Guardian", module: "enterprise_constitutional_guardian", purpose: "E5-13 Enterprise Constitutional Guardian", uxId: "E5-13" } },
  { prefix: "/cockpit/founder/executive-resilience-engine", meta: { screenId: "E5-RESILIENCE", screenTitle: "Executive Resilience Engine", module: "executive_resilience_engine", purpose: "E5-14 Executive Resilience Engine", uxId: "E5-14" } },
  { prefix: "/cockpit/founder/grand-king-executive-cockpit", meta: { screenId: "E5-GK-COCKPIT", screenTitle: "Grand King Executive Cockpit", module: "grand_king_executive_cockpit", purpose: "E5-15 Grand King Executive Cockpit", uxId: "E5-15" } },
  { prefix: "/cockpit/founder/executive-governance-certification", meta: { screenId: "E5-CERTIFIED", screenTitle: "Executive Governance Certified", module: "executive_governance_certification", purpose: "E5-16 programme certification · Phase E5 complete", uxId: "E5-16" } },
  { prefix: "/cockpit/founder/executive-planning", meta: { screenId: "E1-PLANNING", screenTitle: "Executive Planning Dashboard", module: "executive_planning", purpose: "E1-14 unified planning command center", uxId: "E1-14" } },
  { prefix: "/cockpit/founder/corporate-vision", meta: { screenId: "E1-VISION", screenTitle: "Corporate Vision", module: "corporate_vision", purpose: "E1 Corporate Vision Engine · sync · accumulation · alignment", uxId: "E1-02" } },
  { prefix: "/cockpit/founder/strategic-objectives", meta: { screenId: "E1-OBJECTIVES", screenTitle: "Strategic Objectives", module: "strategic_objectives", purpose: "E1 Strategic Objective Engine · measurable WHAT · monitoring", uxId: "E1-03" } },
  { prefix: "/cockpit/founder/executive-roadmap", meta: { screenId: "E1-ROADMAP", screenTitle: "Executive Roadmap", module: "executive_roadmap", purpose: "E1 Executive Roadmap Engine · WHEN & ORDER · programmes", uxId: "E1-04" } },
  { prefix: "/cockpit/founder/priority-management", meta: { screenId: "E1-PRIORITIES", screenTitle: "Priority Management", module: "priority_management", purpose: "E1 Priority Management Engine · WHAT FIRST · scoring", uxId: "E1-05" } },
  { prefix: "/cockpit/founder/initiative-portfolio", meta: { screenId: "E1-PORTFOLIO", screenTitle: "Initiative Portfolio", module: "initiative_portfolio", purpose: "E1 Initiative Portfolio Engine · HOW collectively", uxId: "E1-06" } },
  { prefix: "/cockpit/founder/department-planning", meta: { screenId: "E1-DEPARTMENTS", screenTitle: "Department Planning", module: "department_planning", purpose: "E1 Department Planning Engine · department alignment", uxId: "E1-07" } },
  { prefix: "/cockpit/founder/executive-calendar", meta: { screenId: "E1-CALENDAR", screenTitle: "Executive Calendar", module: "executive_calendar", purpose: "E1 Executive Calendar Engine · WHEN · cadence", uxId: "E1-08" } },
  { prefix: "/cockpit/founder/executive-dependencies", meta: { screenId: "E1-DEPENDENCIES", screenTitle: "Executive Dependencies", module: "executive_dependencies", purpose: "E1 Executive Dependency Engine · critical path", uxId: "E1-09" } },
  { prefix: "/cockpit/founder/executive-scenarios", meta: { screenId: "E1-SCENARIOS", screenTitle: "Executive Scenarios", module: "executive_scenarios", purpose: "E1 Executive Scenario Planner · multiple futures", uxId: "E1-10" } },
  { prefix: "/cockpit/founder/long-term-growth", meta: { screenId: "E1-GROWTH", screenTitle: "Long-Term Growth", module: "long_term_growth", purpose: "E1 Long-Term Growth Planner · multi-year horizons", uxId: "E1-11" } },
  { prefix: "/cockpit/founder/opportunity-prioritization", meta: { screenId: "E1-OPPORTUNITIES", screenTitle: "Opportunity Prioritization", module: "opportunity_prioritization", purpose: "E1 Opportunity Prioritization Engine · ROI ranking", uxId: "E1-12" } },
  { prefix: "/cockpit/founder/strategic-alignment", meta: { screenId: "E1-ALIGNMENT", screenTitle: "Strategic Alignment", module: "strategic_alignment", purpose: "E1 Strategic Alignment Monitor · drift detection", uxId: "E1-13" } },
  { prefix: "/cockpit/founder/supervisor", meta: { screenId: "P7-SUPERVISOR", screenTitle: "Supervisor Centre", module: "supervisor", purpose: "Mission supervision and recovery", uxId: "P7-02" } },
  { prefix: "/cockpit/founder/guardian", meta: { screenId: "P7-GUARDIAN", screenTitle: "Guardian Centre", module: "guardian", purpose: "Runtime and infrastructure health", uxId: "P7-02" } },
  { prefix: "/cockpit/founder/journey", meta: { screenId: "P7-JOURNEY", screenTitle: "Journey Centre", module: "journey", purpose: "Empire journey and roadmap", uxId: "P7-02" } },
  { prefix: "/cockpit/founder/production", meta: { screenId: "P7-PRODUCTION", screenTitle: "Production Centre", module: "production", purpose: "Production truth and deployment", uxId: "P7-02" } },
  { prefix: "/cockpit/founder/architecture", meta: { screenId: "P7-KNOWLEDGE", screenTitle: "Knowledge Centre", module: "repository-intelligence", purpose: "Repository architecture intelligence", uxId: "PILLOW-RI-002" } },
  { prefix: "/cockpit/development/pillow", meta: { screenId: "SCR-800", screenTitle: "Pillow Centre", module: "pillow", purpose: "Executive intelligence platform", uxId: "P7-03" } },
  { prefix: "/cockpit/missions", meta: { screenId: "SCR-020", screenTitle: "Mission Centre", module: "missions", purpose: "Active and queued missions", uxId: "G4-03" } },
  { prefix: "/cockpit/commerce/marketplace", meta: { screenId: "SCR-205", screenTitle: "Marketplace Integration", module: "marketplace-integration", purpose: "Unified marketplace connectors · sync · health", uxId: "P8-03" } },
  { prefix: "/cockpit/commerce", meta: { screenId: "SCR-200", screenTitle: "Commerce Centre", module: "commerce", purpose: "Commerce operations", uxId: "G2-01" } },
];

export function resolveCockpitScreenContext(screenPath: string): ScreenMeta {
  const normalized = screenPath.split("?")[0] ?? screenPath;

  if (normalized === "/cockpit" || normalized === "/cockpit/") {
    return {
      screenId: "SCR-001",
      screenTitle: "Executive Home",
      module: "executive-home",
      purpose: "Executive operating system — one-screen awareness",
      uxId: "P7-02",
    };
  }

  const override = [...COCKPIT_SCREEN_OVERRIDES]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((entry) => normalized === entry.prefix || normalized.startsWith(`${entry.prefix}/`));
  if (override) return override.meta;

  const centreId = resolveCockpitCentreId(normalized);
  const centre = getCockpitCentreById(centreId);
  if (centre) {
    return {
      screenId: centre.id === "executive_home" ? "SCR-001" : centre.id.toUpperCase(),
      screenTitle: centre.label,
      module: centre.id,
      purpose: centre.description,
      uxId: "P7-02",
    };
  }

  return {
    screenId: "SCR-000",
    screenTitle: "Executive Cockpit",
    purpose: "EmpireAI executive operations",
  };
}

export function buildPillowWorkspaceContext(input: {
  screenPath: string;
  navigationHistory: string[];
  pageOverride?: PillowPageContextOverride | null;
  executive?: {
    currentBusiness?: string | null;
    currentMission?: string | null;
    currentJourney?: string | null;
    currentRoadmapItem?: string | null;
    builderStatus?: string | null;
    supervisorStatus?: string | null;
    productionStatus?: string | null;
    guardianStatus?: string | null;
    repositoryFingerprint?: string | null;
    pendingApprovals?: number;
    unreadNotifications?: number;
    recommendations?: string[];
    risks?: string[];
    kpiLabel?: string | null;
    kpiValue?: string | null;
  };
}): PillowWorkspaceContext {
  const meta = resolveCockpitScreenContext(input.screenPath);
  return {
    screenPath: input.screenPath,
    screenId: meta.screenId,
    screenTitle: input.pageOverride?.screenTitle ?? meta.screenTitle,
    module: input.pageOverride?.module ?? meta.module,
    workflow: input.pageOverride?.workflow,
    uxId: meta.uxId,
    purpose: meta.purpose,
    extensionId: input.pageOverride?.extensionId,
    kpiLabel: input.pageOverride?.kpiLabel ?? input.executive?.kpiLabel ?? null,
    kpiValue: input.pageOverride?.kpiValue ?? input.executive?.kpiValue ?? null,
    pendingApprovals: input.executive?.pendingApprovals,
    unreadNotifications: input.executive?.unreadNotifications,
    navigationHistory: input.navigationHistory.slice(-12),
    selectedRecords: input.pageOverride?.selectedRecords,
    businessEntity: input.pageOverride?.businessEntity,
    currentBusiness: input.executive?.currentBusiness ?? null,
    currentMission: input.executive?.currentMission ?? null,
    currentJourney: input.executive?.currentJourney ?? null,
    currentRoadmapItem: input.executive?.currentRoadmapItem ?? null,
    builderStatus: input.executive?.builderStatus ?? null,
    supervisorStatus: input.executive?.supervisorStatus ?? null,
    productionStatus: input.executive?.productionStatus ?? null,
    guardianStatus: input.executive?.guardianStatus ?? null,
    repositoryFingerprint: input.executive?.repositoryFingerprint ?? null,
    recommendations: input.executive?.recommendations,
    risks: input.executive?.risks,
  };
}
