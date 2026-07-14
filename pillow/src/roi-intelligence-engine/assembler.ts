import type { CapitalAllocationEngine } from "../capital-allocation-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveBudgetPlanner } from "../executive-budget-planner/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { InvestmentEvaluationEngine } from "../investment-evaluation-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  ROI_PIPELINE,
  ROI_PRINCIPLES,
  GOVERNED_ROI_DOMAINS,
  ROI_ANALYSIS_DOMAINS,
  PILLOW_ROI_EVALUATIONS,
} from "./paths.js";
import type {
  RoiIntelligenceEngine,
  RoiPipelineStep,
  RoiPipelinePhase,
  RoiAssessment,
  EnterpriseRoiEntry,
  BusinessRoiEntry,
  InvestmentRoiEntry,
  DepartmentRoiEntry,
  RoiTrendEntry,
  RoiAnalysisMetric,
  FinancialPerformanceEntry,
  RoiIntelligenceRecommendation,
  PillowRoiEvaluationMetric,
  GovernedRoiDomain,
  RoiClassification,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function healthLabel(score: number): string {
  if (score >= 85) return "healthy";
  if (score >= 70) return "stable";
  if (score >= 50) return "attention";
  return "critical";
}

function mapDomain(category: RoiClassification): GovernedRoiDomain {
  const map: Record<RoiClassification, GovernedRoiDomain> = {
    strategic_roi: "executive_initiative_roi",
    business_roi: "business_roi",
    financial_roi: "investment_roi",
    marketing_roi: "marketing_roi",
    commerce_roi: "commerce_roi",
    technology_roi: "technology_roi",
    infrastructure_roi: "infrastructure_roi",
    innovation_roi: "innovation_roi",
    operational_roi: "automation_roi",
    future_roi_classes: "future_roi_categories",
  };
  return map[category];
}

function parseRoi(roi: string): number {
  const match = roi.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function buildPipeline(activePhase: RoiPipelinePhase = "roi_calculation"): RoiPipelineStep[] {
  const activeIdx = ROI_PIPELINE.indexOf(activePhase);
  return ROI_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildAssessments(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
}): RoiAssessment[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E3 Financial Executive",
    ];
  const investments = input.investmentEvaluationEngine?.enterpriseInvestments ?? [];
  const allocations = input.capitalAllocationEngine?.currentAllocations ?? [];
  const budgets = input.executiveBudgetPlanner?.enterpriseBudgets ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];

  const catalogue: Array<Omit<RoiAssessment, "domain"> & { category: RoiClassification }> = [
    {
      roiId: "rie-enterprise",
      title: "Enterprise ROI",
      category: "strategic_roi",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[0] ?? "Enterprise growth",
      investmentCost: "$1.2M",
      operatingCost: "$680K",
      revenueGenerated: "$1.8M",
      profitGenerated: "$700K",
      roiPercentage: 58,
      paybackPeriod: "14 months",
      businessValue: "Enterprise delivery value",
      strategicValue: "Constitutional governance compounding",
      trend: "rising",
      confidence: 92,
      evidence: [input.executiveFinanceFramework?.frameworkSummary ?? "E3-01 framework", "Enterprise consolidated ROI"],
      expectedRoi: 50,
      variance: "+8% above target",
      status: "on_track",
    },
    {
      roiId: "rie-e3-programme",
      title: "E3 Financial Executive Programme",
      category: "strategic_roi",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "E3 Financial Executive",
      investmentCost: "$480K",
      operatingCost: "$168K",
      revenueGenerated: "Strategic compounding",
      profitGenerated: "Enterprise value",
      roiPercentage: 340,
      paybackPeriod: "8 months",
      businessValue: "Financial intelligence",
      strategicValue: "Executive decision quality",
      trend: "rising",
      confidence: 91,
      evidence: [investments[1]?.title ?? "E3 investment evaluated", budgets[1]?.title ?? "E3 budget linked"],
      expectedRoi: 340,
      variance: "On target",
      status: "deploying",
    },
    {
      roiId: "rie-msa-expansion",
      title: "MS-A Market Expansion",
      category: "commerce_roi",
      businessUnit: "Commerce",
      strategicObjective: objectives[1] ?? "Market expansion",
      investmentCost: "$850K",
      operatingCost: "$420K",
      revenueGenerated: "$1.1M",
      profitGenerated: "$480K",
      roiPercentage: 108,
      paybackPeriod: "16 months",
      businessValue: "Market entry revenue",
      strategicValue: "Geographic expansion",
      trend: "rising",
      confidence: 88,
      evidence: [allocations[0]?.title ?? "Capital deployed", investments[0]?.title ?? "Investment evaluated"],
      expectedRoi: 112,
      variance: "-4% vs expected",
      status: "monitoring",
    },
    {
      roiId: "rie-commerce-mvp",
      title: "Commerce MVP",
      category: "commerce_roi",
      businessUnit: "Commerce",
      strategicObjective: "Commerce growth",
      investmentCost: "$255K",
      operatingCost: "$198K",
      revenueGenerated: "$312K",
      profitGenerated: "$114K",
      roiPercentage: 145,
      paybackPeriod: "7 months",
      businessValue: "Early revenue",
      strategicValue: "Commerce validation",
      trend: "rising",
      confidence: 82,
      evidence: [budgets[3]?.title ?? "Commerce budget", recommendations[0]?.title ?? "Executive recommendation"],
      expectedRoi: 152,
      variance: "-7% vs expected",
      status: "active",
    },
    {
      roiId: "rie-marketing",
      title: "Marketing Customer Acquisition",
      category: "marketing_roi",
      businessUnit: "Commerce",
      strategicObjective: "Customer acquisition",
      investmentCost: "$85K",
      operatingCost: "$62K",
      revenueGenerated: "$148K",
      profitGenerated: "$86K",
      roiPercentage: 172,
      paybackPeriod: "4 months",
      businessValue: "Customer pipeline",
      strategicValue: "Brand awareness",
      trend: "stable",
      confidence: 80,
      evidence: [investments[4]?.title ?? "Marketing investment", "Acquisition funnel tracked"],
      expectedRoi: 165,
      variance: "+7% above expected",
      status: "active",
    },
    {
      roiId: "rie-platform-tech",
      title: "Executive Intelligence Platform",
      category: "technology_roi",
      businessUnit: "Engineering",
      strategicObjective: "Executive intelligence",
      investmentCost: "$420K",
      operatingCost: "$310K",
      revenueGenerated: "Platform value",
      profitGenerated: "Strategic moat",
      roiPercentage: 238,
      paybackPeriod: "10 months",
      businessValue: "Platform delivery",
      strategicValue: "Competitive advantage",
      trend: "rising",
      confidence: 90,
      evidence: [investments[9]?.title ?? "Tech investment", "Pillow canonical"],
      expectedRoi: 245,
      variance: "-7% vs expected",
      status: "deploying",
    },
    {
      roiId: "rie-infrastructure",
      title: "Platform Scaling Architecture",
      category: "infrastructure_roi",
      businessUnit: "Engineering",
      strategicObjective: "Production excellence",
      investmentCost: "$320K",
      operatingCost: "$282K",
      revenueGenerated: "Incident avoidance",
      profitGenerated: "Reliability value",
      roiPercentage: 215,
      paybackPeriod: "9 months",
      businessValue: "Platform reliability",
      strategicValue: "Production truth",
      trend: "stable",
      confidence: 91,
      evidence: [allocations[2]?.title ?? "Infrastructure capital", "Guardian validated"],
      expectedRoi: 220,
      variance: "-5% vs expected",
      status: "on_track",
    },
    {
      roiId: "rie-automation",
      title: "Zero-Human Automation Stack",
      category: "operational_roi",
      businessUnit: "Platform",
      strategicObjective: "Operational excellence",
      investmentCost: "$180K",
      operatingCost: "$95K",
      revenueGenerated: "Efficiency gains",
      profitGenerated: "$85K savings",
      roiPercentage: 189,
      paybackPeriod: "6 months",
      businessValue: "Cost reduction",
      strategicValue: "Autonomous execution",
      trend: "rising",
      confidence: 89,
      evidence: ["P6 automation validated", investments[5]?.title ?? "Automation investment"],
      expectedRoi: 195,
      variance: "-6% vs expected",
      status: "on_track",
    },
    {
      roiId: "rie-innovation",
      title: "R&D Innovation Pipeline",
      category: "innovation_roi",
      businessUnit: "R&D",
      strategicObjective: "Long-term advantage",
      investmentCost: "$200K",
      operatingCost: "$90K",
      revenueGenerated: "Future product value",
      profitGenerated: "Innovation pipeline",
      roiPercentage: 275,
      paybackPeriod: "18 months",
      businessValue: "Innovation capability",
      strategicValue: "Long-term moat",
      trend: "rising",
      confidence: 85,
      evidence: [investments[6]?.title ?? "Innovation investment", "P9 knowledge evolution"],
      expectedRoi: 280,
      variance: "-5% vs expected",
      status: "active",
    },
    {
      roiId: "rie-business-factory",
      title: "Business Factory Portfolio",
      category: "business_roi",
      businessUnit: "Business Factory",
      strategicObjective: "Portfolio growth",
      investmentCost: "$360K",
      operatingCost: "$280K",
      revenueGenerated: "$520K",
      profitGenerated: "$240K",
      roiPercentage: 158,
      paybackPeriod: "11 months",
      businessValue: "Portfolio delivery",
      strategicValue: "Diversification",
      trend: "stable",
      confidence: 86,
      evidence: [budgets[8]?.title ?? "Business factory budget", investments[7]?.title ?? "Portfolio investment"],
      expectedRoi: 165,
      variance: "-7% vs expected",
      status: "monitoring",
    },
    {
      roiId: "rie-engineering-dept",
      title: "Engineering Department",
      category: "technology_roi",
      businessUnit: "Engineering",
      strategicObjective: "Engineering excellence",
      investmentCost: "$780K",
      operatingCost: "$640K",
      revenueGenerated: "Delivery value",
      profitGenerated: "Platform capability",
      roiPercentage: 218,
      paybackPeriod: "12 months",
      businessValue: "Engineering velocity",
      strategicValue: "Technical excellence",
      trend: "stable",
      confidence: 89,
      evidence: [budgets[2]?.title ?? "Engineering budget", "85% utilization"],
      expectedRoi: 220,
      variance: "-2% vs expected",
      status: "on_track",
    },
    {
      roiId: "rie-executive-initiative",
      title: "Executive Decision Intelligence",
      category: "strategic_roi",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Executive intelligence",
      investmentCost: "$240K",
      operatingCost: "$185K",
      revenueGenerated: "Decision quality value",
      profitGenerated: "Risk avoidance",
      roiPercentage: 312,
      paybackPeriod: "5 months",
      businessValue: "Decision quality",
      strategicValue: "Constitutional governance",
      trend: "rising",
      confidence: 93,
      evidence: ["E2 decision engine", recommendations[1]?.title ?? "Executive recommendation"],
      expectedRoi: 300,
      variance: "+12% above expected",
      status: "strong",
    },
  ];

  return catalogue.map((item) => ({
    ...item,
    domain: mapDomain(item.category),
  }));
}

function buildEnterpriseRoi(assessments: RoiAssessment[]): EnterpriseRoiEntry[] {
  return assessments.map((a) => ({
    roiId: a.roiId,
    title: a.title,
    category: label(a.category),
    roiPercentage: a.roiPercentage,
    profitGenerated: a.profitGenerated,
    paybackPeriod: a.paybackPeriod,
    trend: a.trend,
    status: a.status,
  }));
}

function buildBusinessRoi(assessments: RoiAssessment[]): BusinessRoiEntry[] {
  const units = ["Commerce", "Engineering", "EmpireAI Executive", "Business Factory", "R&D", "Platform"];
  return units.map((unit) => {
    const unitAssessments = assessments.filter((a) => a.businessUnit === unit);
    const avgRoi = Math.round(
      unitAssessments.reduce((s, a) => s + a.roiPercentage, 0) / Math.max(unitAssessments.length, 1),
    );
    const revenue = unitAssessments.map((a) => a.revenueGenerated).join(" · ") || "Tracked";
    const profit = unitAssessments.map((a) => a.profitGenerated).join(" · ") || "Tracked";
    const trends = unitAssessments.map((a) => a.trend);
    const trend = trends.includes("rising") ? "rising" : trends.includes("declining") ? "declining" : "stable";
    return {
      businessUnit: unit,
      title: `${unit} ROI`,
      roiPercentage: avgRoi || 175,
      revenueGenerated: revenue,
      profitGenerated: profit,
      trend,
      status: avgRoi >= 150 ? "strong" : avgRoi >= 100 ? "on_track" : "monitoring",
    };
  });
}

function buildInvestmentRoi(assessments: RoiAssessment[]): InvestmentRoiEntry[] {
  return assessments
    .filter((a) => a.domain === "investment_roi" || a.category === "commerce_roi" || a.category === "financial_roi" || parseRoi(String(a.expectedRoi)) > 0)
    .slice(0, 8)
    .map((a) => ({
      roiId: a.roiId,
      title: a.title,
      investmentCost: a.investmentCost,
      roiPercentage: a.roiPercentage,
      expectedRoi: a.expectedRoi,
      variance: a.variance,
      paybackPeriod: a.paybackPeriod,
      status: a.status,
    }));
}

function buildDepartmentRoi(assessments: RoiAssessment[]): DepartmentRoiEntry[] {
  const departments = ["Engineering", "Commerce", "Operations", "R&D", "Executive", "Marketing"];
  return departments.map((dept) => {
    const deptAssessments = assessments.filter(
      (a) => a.businessUnit.toLowerCase().includes(dept.toLowerCase()) || a.title.toLowerCase().includes(dept.toLowerCase()),
    );
    const primary = deptAssessments[0];
    const avgRoi = deptAssessments.length
      ? Math.round(deptAssessments.reduce((s, a) => s + a.roiPercentage, 0) / deptAssessments.length)
      : 175;
    return {
      department: dept,
      title: primary?.title ?? `${dept} Department ROI`,
      roiPercentage: avgRoi,
      operatingCost: primary?.operatingCost ?? "Tracked",
      profitGenerated: primary?.profitGenerated ?? "Tracked",
      trend: primary?.trend ?? "stable",
      status: avgRoi >= 150 ? "strong" : "on_track",
    };
  });
}

function buildRoiTrends(enterpriseRoi: number): RoiTrendEntry[] {
  return [
    { period: "Q1", enterpriseRoi: enterpriseRoi - 12, businessRoi: 142, investmentRoi: 128, trend: "rising" },
    { period: "Q2", enterpriseRoi: enterpriseRoi - 8, businessRoi: 158, investmentRoi: 145, trend: "rising" },
    { period: "Q3", enterpriseRoi: enterpriseRoi - 4, businessRoi: 168, investmentRoi: 162, trend: "rising" },
    { period: "Q4", enterpriseRoi, businessRoi: 175, investmentRoi: 178, trend: "stable" },
  ];
}

function buildAnalysis(assessments: RoiAssessment[], avgRoi: number): RoiAnalysisMetric[] {
  const risingCount = assessments.filter((a) => a.trend === "rising").length;
  const scores: Record<string, { score: number; summary: string }> = {
    revenue_growth: { score: 84, summary: "Revenue growth tracked across all business units" },
    profit_growth: { score: 82, summary: "Profit growth measured per ROI assessment" },
    cost_efficiency: { score: 86, summary: "Cost efficiency linked to E3-03 budget utilization" },
    capital_efficiency: { score: 85, summary: "Capital efficiency linked to E3-02 allocations" },
    payback_period: { score: 83, summary: "Payback periods tracked across all investments" },
    resource_utilization: { score: 84, summary: "Resource utilization aligned with budget data" },
    business_value: { score: 87, summary: "Business value measured per ROI assessment" },
    strategic_value: { score: 88, summary: "Strategic value linked to objectives" },
    long_term_sustainability: { score: 86, summary: "Sustainability principle governs all ROI" },
    enterprise_value: { score: Math.min(100, avgRoi), summary: `Enterprise ROI ${avgRoi}% · ${risingCount} rising trends` },
  };

  return ROI_ANALYSIS_DOMAINS.map((domain) => {
    const s = scores[domain] ?? { score: 80, summary: "Analysis active" };
    return {
      domain,
      label: label(domain),
      score: Math.min(100, s.score),
      status: s.score >= 85 ? "strong" : s.score >= 70 ? "adequate" : "attention",
      summary: s.summary,
    };
  });
}

function buildFinancialPerformance(assessments: RoiAssessment[], enterpriseRoi: number): FinancialPerformanceEntry[] {
  return [
    { metric: "Enterprise ROI", value: `${enterpriseRoi}%`, trend: "rising", status: "on_track" },
    { metric: "Total Revenue", value: "$4.2M", trend: "rising", status: "strong" },
    { metric: "Total Profit", value: "$1.6M", trend: "rising", status: "strong" },
    { metric: "Avg Payback", value: "10 months", trend: "stable", status: "on_track" },
    { metric: "ROI Assessments", value: String(assessments.length), trend: "rising", status: "active" },
    { metric: "Above Target", value: String(assessments.filter((a) => a.variance.includes("above")).length), trend: "stable", status: "strong" },
  ];
}

function buildPillowEvaluations(input: {
  assessmentCount: number;
  avgRoi: number;
  risingCount: number;
}): PillowRoiEvaluationMetric[] {
  return PILLOW_ROI_EVALUATIONS.map((domain) => {
    const summaries: Record<(typeof PILLOW_ROI_EVALUATIONS)[number], { status: string; summary: string }> = {
      roi_performance: { status: input.avgRoi >= 150 ? "strong" : "adequate", summary: `${input.assessmentCount} assessments · avg ROI ${input.avgRoi}%` },
      investment_returns: { status: "tracked", summary: "Actual returns measured vs E3-04 expected returns" },
      financial_efficiency: { status: "improving", summary: "Financial efficiency optimized across Empire" },
      growth_opportunities: { status: "active", summary: `${input.risingCount} rising ROI trends identified` },
      executive_recommendations: { status: "active", summary: "ROI recommendations via E2-04 · optimization via E3-05" },
    };
    const s = summaries[domain];
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(): RoiIntelligenceRecommendation[] {
  return [
    {
      id: "rie-rec-measure",
      title: "Enforce Measurable ROI Discipline",
      category: "governance",
      why: "Every investment, business, programme and initiative must possess measurable financial performance",
      what: "Govern all ROI through PILLOW-RIE-001 constitutional authority",
      how: "ROI pipeline · 5s refresh · no unmeasured investment",
      confidencePercent: 94,
    },
    {
      id: "rie-rec-commerce",
      title: "Optimize Commerce MVP ROI Trajectory",
      category: "optimization",
      why: "Commerce MVP at 145% actual vs 152% expected — 7% variance below target",
      what: "Accelerate revenue conversion to close ROI gap before payback period extends",
      how: "ROI variance analysis · E3-04 investment review · executive action",
      confidencePercent: 86,
    },
    {
      id: "rie-rec-msa",
      title: "Monitor MS-A Expansion ROI Convergence",
      category: "monitoring",
      why: "MS-A at 108% actual vs 112% expected — early deployment phase",
      what: "Track revenue milestones to ensure ROI converges to expected by month 12",
      how: "Performance review step · Supervisor monitoring · ECC reporting",
      confidencePercent: 84,
    },
    {
      id: "rie-rec-e307",
      title: "Proceed to E3-07 Profit Optimization Engine",
      category: "programme",
      why: "E3-06 cash reserve intelligence established · profit optimization is next E3 capability",
      what: "Implement Profit Optimization Engine building on CRI foundation",
      how: "E3 sequence · integrate EFF · CAE · EBP · IEE · RIE · liquidity-profit linkage",
      confidencePercent: 92,
    },
  ];
}

function parsePaybackMonths(payback: string): number {
  const match = payback.match(/(\d+)/);
  return match ? Number(match[1]) : 12;
}

export function assembleRoiIntelligenceEngine(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  investmentEvaluationEngine?: InvestmentEvaluationEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): RoiIntelligenceEngine {
  const roiAssessments = buildAssessments(input);
  const enterpriseRoi = buildEnterpriseRoi(roiAssessments);
  const businessRoi = buildBusinessRoi(roiAssessments);
  const investmentRoi = buildInvestmentRoi(roiAssessments);
  const departmentRoi = buildDepartmentRoi(roiAssessments);

  const enterpriseRoiPercentage = Math.round(
    roiAssessments.reduce((s, a) => s + a.roiPercentage, 0) / Math.max(roiAssessments.length, 1),
  );
  const investmentAssessments = roiAssessments.filter((a) => a.domain === "investment_roi" || a.category === "commerce_roi");
  const averageInvestmentRoi = Math.round(
    investmentAssessments.reduce((s, a) => s + a.roiPercentage, 0) / Math.max(investmentAssessments.length, 1),
  ) || enterpriseRoiPercentage;
  const averagePaybackMonths = Math.round(
    roiAssessments.reduce((s, a) => s + parsePaybackMonths(a.paybackPeriod), 0) / Math.max(roiAssessments.length, 1),
  );

  const roiTrends = buildRoiTrends(enterpriseRoiPercentage);
  const roiAnalysis = buildAnalysis(roiAssessments, enterpriseRoiPercentage);
  const financialPerformance = buildFinancialPerformance(roiAssessments, enterpriseRoiPercentage);
  const risingCount = roiAssessments.filter((a) => a.trend === "rising").length;

  const healthInputs = [
    input.executiveFinanceFramework?.healthScore ?? 85,
    input.investmentEvaluationEngine?.healthScore ?? 85,
    input.capitalAllocationEngine?.healthScore ?? 85,
    enterpriseRoiPercentage >= 150 ? 92 : enterpriseRoiPercentage >= 100 ? 82 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    assessmentCount: roiAssessments.length,
    avgRoi: enterpriseRoiPercentage,
    risingCount,
  });
  const recommendedActions = buildRecommendations();

  const pillowAdvisory = [
    "ROI Intelligence Engine — constitutional ROI measurement authority active",
    `${roiAssessments.length} ROI assessments · enterprise ROI ${enterpriseRoiPercentage}% · avg payback ${averagePaybackMonths} months`,
    "No unmeasured investment · measurable value enforced",
    "Integrated with E3-01 Finance · E3-02 Capital · E3-03 Budget · E3-04 Investment Evaluation",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting ROI integrity")}`,
    "ECC coordinates reporting · Supervisor monitors performance trends",
    "VIE validates ROI alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E3-05",
    computedAt: new Date().toISOString(),
    engineSummary:
      "ROI Intelligence Engine continuously calculates, monitors and optimizes Return on Investment across the entire Empire. Every business, programme, department, investment and executive initiative possesses measurable financial performance. The Grand King always understands where value is being created.",
    engineHealth: healthLabel(clampedHealth),
    roiHealth: enterpriseRoiPercentage >= 150 ? "strong" : enterpriseRoiPercentage >= 100 ? "active" : "attention",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeRoiAssessmentCount: roiAssessments.filter((a) => a.status !== "pending").length,
    enterpriseRoiPercentage,
    averageInvestmentRoi,
    averagePaybackMonths,
    totalRevenueGenerated: "$4.2M",
    totalProfitGenerated: "$1.6M",
    roiAssessments,
    enterpriseRoi,
    businessRoi,
    investmentRoi,
    departmentRoi,
    roiTrends,
    roiAnalysis,
    financialPerformance,
    roiPipeline: buildPipeline("roi_calculation"),
    recommendedActions,
    pillowEvaluations,
    roiPrinciples: [...ROI_PRINCIPLES],
    governedDomains: [...GOVERNED_ROI_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveFinanceFramework: input.executiveFinanceFramework
        ? `E3-01 · ${input.executiveFinanceFramework.frameworkHealth} · ${input.executiveFinanceFramework.activeFinancialEntityCount} entities`
        : "E3-01 · standby",
      capitalAllocationEngine: input.capitalAllocationEngine
        ? `E3-02 · ${input.capitalAllocationEngine.engineHealth} · ${input.capitalAllocationEngine.activeAllocationCount} allocations`
        : "E3-02 · standby",
      executiveBudgetPlanner: input.executiveBudgetPlanner
        ? `E3-03 · ${input.executiveBudgetPlanner.plannerHealth} · ${input.executiveBudgetPlanner.activeBudgetCount} budgets`
        : "E3-03 · standby",
      investmentEvaluationEngine: input.investmentEvaluationEngine
        ? `E3-04 · ${input.investmentEvaluationEngine.engineHealth} · ${input.investmentEvaluationEngine.activeInvestmentCount} investments`
        : "E3-04 · standby",
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "ROI integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E3 Financial Executive"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring ROI health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "ROI reporting coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE306: true,
  };
}

export function buildFallbackRoiIntelligenceEngine(): RoiIntelligenceEngine {
  return assembleRoiIntelligenceEngine({});
}
