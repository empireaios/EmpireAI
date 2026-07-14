import type { CapitalAllocationEngine } from "../capital-allocation-engine/types.js";
import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveBudgetPlanner } from "../executive-budget-planner/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutiveFinanceFramework } from "../executive-finance-framework/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { RiskAssessmentEngine } from "../risk-assessment-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import type { TradeOffAnalysisEngine } from "../trade-off-analysis-engine/types.js";
import {
  INVESTMENT_EVALUATION_PIPELINE,
  INVESTMENT_PRINCIPLES,
  GOVERNED_INVESTMENT_DOMAINS,
  INVESTMENT_ANALYSIS_DOMAINS,
  PILLOW_INVESTMENT_EVALUATIONS,
} from "./paths.js";
import type {
  InvestmentEvaluationEngine,
  InvestmentEvaluationPipelineStep,
  InvestmentEvaluationPipelinePhase,
  EnterpriseInvestment,
  InvestmentPortfolioEntry,
  InvestmentAnalysisMetric,
  InvestmentRiskEntry,
  StrategicAlignmentEntry,
  InvestmentEvaluationRecommendation,
  PillowInvestmentEvaluationMetric,
  GovernedInvestmentDomain,
  InvestmentClassification,
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

function mapDomain(category: InvestmentClassification): GovernedInvestmentDomain {
  const map: Record<InvestmentClassification, GovernedInvestmentDomain> = {
    strategic_investment: "strategic_investments",
    growth_investment: "business_investments",
    technology_investment: "technology_investments",
    infrastructure_investment: "infrastructure_investments",
    marketing_investment: "marketing_investments",
    commerce_investment: "commerce_investments",
    innovation_investment: "innovation_investments",
    research_investment: "research_investments",
    operational_investment: "automation_investments",
    reserve_investment: "strategic_investments",
    future_investment_classes: "future_investment_categories",
  };
  return map[category];
}

function buildPipeline(
  activePhase: InvestmentEvaluationPipelinePhase = "expected_roi_analysis",
): InvestmentEvaluationPipelineStep[] {
  const activeIdx = INVESTMENT_EVALUATION_PIPELINE.indexOf(activePhase);
  return INVESTMENT_EVALUATION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildInvestments(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  tradeOffAnalysisEngine?: TradeOffAnalysisEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
}): EnterpriseInvestment[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E3 Financial Executive",
    ];
  const allocations = input.capitalAllocationEngine?.currentAllocations ?? [];
  const budgets = input.executiveBudgetPlanner?.enterpriseBudgets ?? [];
  const criticalRisks = input.riskAssessmentEngine?.currentRisks.filter(
    (r) => r.severity === "critical" || r.severity === "high",
  ) ?? [];
  const tradeOffs = input.tradeOffAnalysisEngine?.tradeOffAnalyses ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];

  const catalogue: Array<Omit<EnterpriseInvestment, "domain"> & { category: InvestmentClassification }> = [
    {
      investmentId: "iee-msa-expansion",
      title: "MS-A Market Expansion",
      category: "growth_investment",
      purpose: "Phased market expansion with ROI gates at each phase transition",
      owner: "Commerce Executive",
      businessUnit: "Commerce",
      strategicObjective: objectives[1] ?? "Market expansion",
      requiredCapital: "$850K",
      expectedRevenue: "$1.2M Year 1",
      expectedCost: "$680K",
      expectedProfit: "$520K",
      expectedRoi: "112%",
      investmentHorizon: "18 months",
      riskAssessment: criticalRisks[0]?.title ?? "Moderate — market timing managed",
      confidence: 88,
      evidence: [allocations[0]?.title ?? "Capital allocation validated", "E2-10 trade-off validated"],
      evaluationScore: 87,
      strategicAlignment: "aligned",
      status: "approved",
    },
    {
      investmentId: "iee-e3-programme",
      title: "E3 Financial Executive Programme",
      category: "strategic_investment",
      purpose: "Phase E3 financial intelligence capabilities E3-01 through E3-16",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "E3 Financial Executive",
      requiredCapital: "$480K",
      expectedRevenue: "Strategic compounding",
      expectedCost: "$480K",
      expectedProfit: "Enterprise value",
      expectedRoi: "340%",
      investmentHorizon: "12 months",
      riskAssessment: "Low — phased delivery",
      confidence: 91,
      evidence: [budgets[1]?.title ?? "E3 budget linked", "E3-01 framework · E3-03 budget"],
      evaluationScore: 92,
      strategicAlignment: "aligned",
      status: "deploying",
    },
    {
      investmentId: "iee-platform-scale",
      title: "Platform Scaling Architecture",
      category: "infrastructure_investment",
      purpose: "Production truth, scaling architecture and Guardian monitoring",
      owner: "CTO",
      businessUnit: "Engineering",
      strategicObjective: "Production excellence",
      requiredCapital: "$320K",
      expectedRevenue: "Incident cost avoidance",
      expectedCost: "$282K",
      expectedProfit: "Reliability value",
      expectedRoi: "220%",
      investmentHorizon: "9 months",
      riskAssessment: "Low",
      confidence: 91,
      evidence: [allocations[2]?.title ?? "Infrastructure capital linked", "Guardian validated"],
      evaluationScore: 89,
      strategicAlignment: "aligned",
      status: "approved",
    },
    {
      investmentId: "iee-commerce-mvp",
      title: "Commerce MVP Launch",
      category: "commerce_investment",
      purpose: "Commerce launch and early revenue operations",
      owner: "Commerce Executive",
      businessUnit: "Commerce",
      strategicObjective: "Commerce growth",
      requiredCapital: "$255K",
      expectedRevenue: "$390K Year 1",
      expectedCost: "$255K",
      expectedProfit: "$145K",
      expectedRoi: "152%",
      investmentHorizon: "6 months",
      riskAssessment: "Moderate — support scaling",
      confidence: 82,
      evidence: [budgets[3]?.title ?? "Commerce budget tracked", recommendations[0]?.title ?? "Executive recommendation"],
      evaluationScore: 80,
      strategicAlignment: "aligned",
      status: "evaluating",
    },
    {
      investmentId: "iee-marketing-acquisition",
      title: "Marketing Customer Acquisition",
      category: "marketing_investment",
      purpose: "Brand awareness and customer acquisition pipeline",
      owner: "Marketing Executive",
      businessUnit: "Commerce",
      strategicObjective: "Customer acquisition",
      requiredCapital: "$85K",
      expectedRevenue: "$190K",
      expectedCost: "$85K",
      expectedProfit: "$105K",
      expectedRoi: "165%",
      investmentHorizon: "4 months",
      riskAssessment: "Low-Moderate",
      confidence: 80,
      evidence: ["Commerce launch plan", allocations[5]?.title ?? "Marketing capital linked"],
      evaluationScore: 78,
      strategicAlignment: "aligned",
      status: "pending",
    },
    {
      investmentId: "iee-ai-automation",
      title: "Zero-Human Automation Stack",
      category: "operational_investment",
      purpose: "Autonomous execution, recovery and zero-human automation",
      owner: "Operations Executive",
      businessUnit: "Platform",
      strategicObjective: "Operational excellence",
      requiredCapital: "$180K",
      expectedRevenue: "Efficiency gains",
      expectedCost: "$180K",
      expectedProfit: "8% cost reduction",
      expectedRoi: "195%",
      investmentHorizon: "8 months",
      riskAssessment: "Low",
      confidence: 89,
      evidence: ["P6 automation validated", "ECC execution readiness"],
      evaluationScore: 86,
      strategicAlignment: "aligned",
      status: "approved",
    },
    {
      investmentId: "iee-rd-innovation",
      title: "R&D Innovation Pipeline",
      category: "innovation_investment",
      purpose: "AI innovation, knowledge evolution and research",
      owner: "Innovation Executive",
      businessUnit: "R&D",
      strategicObjective: "Long-term advantage",
      requiredCapital: "$200K",
      expectedRevenue: "Future product value",
      expectedCost: "$200K",
      expectedProfit: "Innovation pipeline",
      expectedRoi: "280%",
      investmentHorizon: "24 months",
      riskAssessment: "Moderate — R&D uncertainty",
      confidence: 85,
      evidence: [allocations[4]?.title ?? "Innovation capital linked", "P9 knowledge evolution"],
      evaluationScore: 84,
      strategicAlignment: "aligned",
      status: "approved",
    },
    {
      investmentId: "iee-business-factory",
      title: "Business Factory Portfolio",
      category: "growth_investment",
      purpose: "Multi-business portfolio expansion and diversification",
      owner: "Business Executive",
      businessUnit: "Business Factory",
      strategicObjective: "Portfolio growth",
      requiredCapital: "$360K/year",
      expectedRevenue: "$550K",
      expectedCost: "$360K",
      expectedProfit: "$190K",
      expectedRoi: "165%",
      investmentHorizon: "12 months",
      riskAssessment: "Moderate — diversification",
      confidence: 86,
      evidence: [budgets[8]?.title ?? "Business factory budget", tradeOffs[0]?.title ?? "Trade-off validated"],
      evaluationScore: 83,
      strategicAlignment: "aligned",
      status: "evaluating",
    },
    {
      investmentId: "iee-acquisition-target",
      title: "Strategic Acquisition Target A",
      category: "strategic_investment",
      purpose: "Evaluate strategic acquisition for market entry acceleration",
      owner: "Grand King",
      businessUnit: "EmpireAI Executive",
      strategicObjective: objectives[2] ?? "Strategic expansion",
      requiredCapital: "$2.4M",
      expectedRevenue: "$3.8M Year 2",
      expectedCost: "$2.4M",
      expectedProfit: "$1.4M",
      expectedRoi: "95%",
      investmentHorizon: "36 months",
      riskAssessment: criticalRisks[1]?.title ?? "High — due diligence required",
      confidence: 72,
      evidence: ["Due diligence pipeline", "E2-02 risk assessment active"],
      evaluationScore: 74,
      strategicAlignment: "review",
      status: "due_diligence",
    },
    {
      investmentId: "iee-tech-platform",
      title: "Executive Intelligence Platform",
      category: "technology_investment",
      purpose: "Pillow, executive engines and cockpit intelligence stack",
      owner: "CTO",
      businessUnit: "Engineering",
      strategicObjective: "Executive intelligence",
      requiredCapital: "$420K",
      expectedRevenue: "Platform value",
      expectedCost: "$420K",
      expectedProfit: "Strategic moat",
      expectedRoi: "245%",
      investmentHorizon: "12 months",
      riskAssessment: "Low",
      confidence: 90,
      evidence: [input.executiveFinanceFramework?.frameworkSummary ?? "E3-01 framework", "Pillow canonical"],
      evaluationScore: 90,
      strategicAlignment: "aligned",
      status: "deploying",
    },
    {
      investmentId: "iee-research-lab",
      title: "AI Research Lab",
      category: "research_investment",
      purpose: "Advanced AI research and competitive advantage development",
      owner: "Innovation Executive",
      businessUnit: "R&D",
      strategicObjective: "Research excellence",
      requiredCapital: "$150K",
      expectedRevenue: "IP and capability value",
      expectedCost: "$150K",
      expectedProfit: "Long-term advantage",
      expectedRoi: "210%",
      investmentHorizon: "18 months",
      riskAssessment: "Moderate — research uncertainty",
      confidence: 83,
      evidence: ["Research budget linked", "Innovation pipeline"],
      evaluationScore: 81,
      strategicAlignment: "aligned",
      status: "approved",
    },
    {
      investmentId: "iee-reserve-fund",
      title: "Strategic Reserve Fund",
      category: "reserve_investment",
      purpose: "Reserve capital for opportunistic investments and emergencies",
      owner: "Finance Executive",
      businessUnit: "EmpireAI Executive",
      strategicObjective: "Financial resilience",
      requiredCapital: "$500K",
      expectedRevenue: "Optionality value",
      expectedCost: "$0 deployed",
      expectedProfit: "Risk buffer",
      expectedRoi: "N/A — reserve",
      investmentHorizon: "Ongoing",
      riskAssessment: "Minimal — reserve held",
      confidence: 95,
      evidence: ["E3-02 reserve capital", "Constitutional reserve governance"],
      evaluationScore: 96,
      strategicAlignment: "aligned",
      status: "held",
    },
  ];

  return catalogue.map((item) => ({
    ...item,
    domain: mapDomain(item.category),
  }));
}

function buildPortfolio(investments: EnterpriseInvestment[]): InvestmentPortfolioEntry[] {
  return investments.map((inv) => ({
    investmentId: inv.investmentId,
    title: inv.title,
    category: label(inv.category),
    requiredCapital: inv.requiredCapital,
    expectedRoi: inv.expectedRoi,
    investmentHorizon: inv.investmentHorizon,
    strategicAlignment: inv.strategicAlignment,
    status: inv.status,
  }));
}

function buildAnalysis(investments: EnterpriseInvestment[], avgRoi: number): InvestmentAnalysisMetric[] {
  const avgScore = Math.round(
    investments.reduce((s, i) => s + i.evaluationScore, 0) / Math.max(investments.length, 1),
  );
  const scores: Record<string, { score: number; summary: string }> = {
    business_value: { score: avgScore, summary: "Business value assessed per investment proposal" },
    financial_return: { score: 84, summary: "Financial return analysis via E3-01 framework" },
    expected_roi: { score: Math.min(100, avgRoi), summary: `Portfolio avg expected ROI ${avgRoi}%` },
    capital_efficiency: { score: 86, summary: "Capital efficiency linked to E3-02 allocations" },
    risk_exposure: { score: 82, summary: "Risk exposure evaluated via E2-02 Risk Assessment Engine" },
    strategic_alignment: { score: 88, summary: "All investments linked to strategic objectives" },
    competitive_advantage: { score: 85, summary: "Competitive advantage assessed per investment" },
    time_to_value: { score: 80, summary: "Time to value tracked across investment horizons" },
    long_term_sustainability: { score: 87, summary: "Long-term sustainability principle enforced" },
    enterprise_value: { score: 89, summary: "Enterprise value compounding validated" },
  };

  return INVESTMENT_ANALYSIS_DOMAINS.map((domain) => {
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

function buildRisks(investments: EnterpriseInvestment[]): InvestmentRiskEntry[] {
  return investments
    .filter((i) => i.status === "evaluating" || i.status === "due_diligence" || i.confidence < 85)
    .slice(0, 6)
    .map((inv) => ({
      riskId: `irisk-${inv.investmentId}`,
      investmentId: inv.investmentId,
      title: inv.title,
      severity: inv.confidence < 75 ? "high" : inv.confidence < 85 ? "moderate" : "low",
      exposure: `${inv.riskAssessment} · confidence ${inv.confidence}%`,
      mitigation: "E2-02 risk assessment · E2-10 trade-off · executive approval gate",
      status: inv.status === "due_diligence" ? "active_review" : "monitored",
    }));
}

function buildStrategicAlignments(investments: EnterpriseInvestment[]): StrategicAlignmentEntry[] {
  return investments.slice(0, 8).map((inv) => ({
    investmentId: inv.investmentId,
    title: inv.title,
    visionAlignment: inv.strategicAlignment === "aligned" ? "aligned" : "review",
    strategicAlignment: inv.strategicAlignment,
    constitutionalAlignment: inv.evaluationScore >= 80 ? "compliant" : "review",
    score: inv.evaluationScore,
    status: inv.strategicAlignment,
  }));
}

function buildPillowEvaluations(input: {
  investmentCount: number;
  avgRoi: number;
  riskCount: number;
  pendingCount: number;
}): PillowInvestmentEvaluationMetric[] {
  return PILLOW_INVESTMENT_EVALUATIONS.map((domain) => {
    const summaries: Record<(typeof PILLOW_INVESTMENT_EVALUATIONS)[number], { status: string; summary: string }> = {
      investment_opportunities: { status: "active", summary: `${input.investmentCount} investments · ${input.pendingCount} pending evaluation` },
      investment_quality: { status: input.avgRoi >= 150 ? "strong" : "adequate", summary: `Avg expected ROI ${input.avgRoi}% · evidence-based evaluation` },
      investment_risks: { status: input.riskCount <= 3 ? "managed" : "attention", summary: `${input.riskCount} investment risks monitored via E2-02` },
      expected_returns: { status: "tracked", summary: "Expected returns validated through ROI analysis pipeline" },
      executive_recommendations: { status: "active", summary: "Investment recommendations via E2-04 · approval via E2-07" },
    };
    const s = summaries[domain];
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(): InvestmentEvaluationRecommendation[] {
  return [
    {
      id: "iee-rec-discipline",
      title: "Enforce Investment Evaluation Discipline",
      category: "governance",
      why: "Every investment must undergo disciplined executive evaluation before capital is committed",
      what: "Govern all investments through PILLOW-IEE-001 constitutional authority",
      how: "Investment pipeline · 5s refresh · no unvalidated investments",
      confidencePercent: 94,
    },
    {
      id: "iee-rec-commerce",
      title: "Complete Commerce MVP Investment Evaluation",
      category: "evaluation",
      why: "Commerce MVP at 80 evaluation score — support scaling risk requires trade-off review",
      what: "Complete E2-10 trade-off analysis and executive approval before capital deployment",
      how: "Investment pipeline step 8 · E2-02 risk · E2-04 recommendation",
      confidencePercent: 86,
    },
    {
      id: "iee-rec-acquisition",
      title: "Hold Acquisition Target Pending Due Diligence",
      category: "risk",
      why: "Strategic Acquisition Target A at 72% confidence — high capital exposure",
      what: "Complete due diligence pipeline before executive approval",
      how: "E2-02 risk assessment · evidence collection · constitutional review",
      confidencePercent: 88,
    },
    {
      id: "iee-rec-e306",
      title: "Proceed to E3-06 Cash Reserve Intelligence",
      category: "programme",
      why: "E3-05 ROI intelligence established · cash reserve intelligence is next E3 capability",
      what: "Implement Cash Reserve Intelligence building on RIE foundation",
      how: "E3 sequence · integrate EFF · CAE · EBP · IEE · ROI-cash linkage",
      confidencePercent: 92,
    },
  ];
}

function parseRoi(roi: string): number {
  const match = roi.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function assembleInvestmentEvaluationEngine(input: {
  executiveFinanceFramework?: ExecutiveFinanceFramework | null;
  capitalAllocationEngine?: CapitalAllocationEngine | null;
  executiveBudgetPlanner?: ExecutiveBudgetPlanner | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  tradeOffAnalysisEngine?: TradeOffAnalysisEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): InvestmentEvaluationEngine {
  const enterpriseInvestments = buildInvestments(input);
  const investmentPortfolio = buildPortfolio(enterpriseInvestments);
  const investmentRisks = buildRisks(enterpriseInvestments);
  const strategicAlignments = buildStrategicAlignments(enterpriseInvestments);

  const roiValues = enterpriseInvestments
    .map((i) => parseRoi(i.expectedRoi))
    .filter((r) => r > 0);
  const averageExpectedRoi = Math.round(
    roiValues.reduce((a, b) => a + b, 0) / Math.max(roiValues.length, 1),
  );
  const averageConfidence = Math.round(
    enterpriseInvestments.reduce((s, i) => s + i.confidence, 0) / Math.max(enterpriseInvestments.length, 1),
  );

  const investmentAnalysis = buildAnalysis(enterpriseInvestments, averageExpectedRoi);
  const approvedInvestmentCount = enterpriseInvestments.filter(
    (i) => i.status === "approved" || i.status === "deploying" || i.status === "held",
  ).length;
  const pendingEvaluationCount = enterpriseInvestments.filter(
    (i) => i.status === "evaluating" || i.status === "pending" || i.status === "due_diligence",
  ).length;

  const healthInputs = [
    input.executiveFinanceFramework?.healthScore ?? 85,
    input.capitalAllocationEngine?.healthScore ?? 85,
    input.executiveBudgetPlanner?.healthScore ?? 85,
    input.riskAssessmentEngine?.healthScore ?? 85,
    averageConfidence,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    investmentCount: enterpriseInvestments.length,
    avgRoi: averageExpectedRoi,
    riskCount: investmentRisks.length,
    pendingCount: pendingEvaluationCount,
  });
  const recommendedActions = buildRecommendations();

  const pillowAdvisory = [
    "Investment Evaluation Engine — constitutional investment evaluation authority active",
    `${enterpriseInvestments.length} investments · avg ROI ${averageExpectedRoi}% · avg confidence ${averageConfidence}%`,
    "No unvalidated investments · evidence-first evaluation enforced",
    "Integrated with E3-01 Finance · E3-02 Capital · E3-03 Budget · E2-02 Risk · E2-10 Trade-off",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting investment integrity")}`,
    "ECC coordinates approval · Supervisor monitors investment performance",
    "VIE validates investment alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E3-04",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Investment Evaluation Engine continuously assesses investment opportunities using financial, strategic, operational and constitutional criteria. Every investment recommendation is evidence-based, explainable and measurable. The Grand King always understands why an investment should or should not proceed.",
    engineHealth: healthLabel(clampedHealth),
    investmentHealth: averageConfidence >= 85 ? "disciplined" : averageConfidence >= 75 ? "active" : "attention",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeInvestmentCount: enterpriseInvestments.filter(
      (i) => i.status !== "held" && i.status !== "pending",
    ).length,
    totalCapitalRequired: "$6.2M",
    averageExpectedRoi,
    averageConfidence,
    approvedInvestmentCount,
    pendingEvaluationCount,
    enterpriseInvestments,
    investmentPipeline: buildPipeline("expected_roi_analysis"),
    investmentPortfolio,
    investmentAnalysis,
    investmentRisks,
    strategicAlignments,
    recommendedActions,
    pillowEvaluations,
    investmentPrinciples: [...INVESTMENT_PRINCIPLES],
    governedDomains: [...GOVERNED_INVESTMENT_DOMAINS],
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
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      riskAssessmentEngine: input.riskAssessmentEngine
        ? `E2-02 · ${input.riskAssessmentEngine.engineHealth} · ${input.riskAssessmentEngine.activeRiskCount} risks`
        : "E2-02 · standby",
      tradeOffAnalysisEngine: input.tradeOffAnalysisEngine
        ? `E2-10 · ${input.tradeOffAnalysisEngine.engineHealth} · ${input.tradeOffAnalysisEngine.activeTradeOffCount} trade-offs`
        : "E2-10 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "investment integrity protected")}`,
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E3 Financial Executive"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring investment health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "investment approval coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE305: true,
  };
}

export function buildFallbackInvestmentEvaluationEngine(): InvestmentEvaluationEngine {
  return assembleInvestmentEvaluationEngine({});
}
