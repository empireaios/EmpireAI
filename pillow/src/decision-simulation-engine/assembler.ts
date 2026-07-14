import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveDecision } from "../executive-decision-architecture/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { EnterpriseRisk } from "../risk-assessment-engine/types.js";
import type { RiskAssessmentEngine } from "../risk-assessment-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  SIMULATION_PIPELINE,
  SIMULATION_PRINCIPLES,
  GOVERNED_SIMULATION_DOMAINS,
  SIMULATION_TYPES,
  COMPARATIVE_ANALYSIS_DIMENSIONS,
  SIMULATION_OUTPUT_DOMAINS,
  PILLOW_SIMULATION_EVALUATIONS,
} from "./paths.js";
import type {
  DecisionSimulationEngine,
  SimulationPipelineStep,
  SimulationPipelinePhase,
  DecisionSimulation,
  ScenarioComparisonEntry,
  PredictedOutcome,
  ComparativeAnalysisMetric,
  SimulationOutputMetric,
  DecisionSimulationRecommendation,
  PillowSimulationEvaluationMetric,
  GovernedSimulationDomain,
  SimulationType,
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

function mapDomain(decisionType: string): GovernedSimulationDomain {
  const map: Record<string, GovernedSimulationDomain> = {
    strategic: "strategic_decisions",
    investment: "investment_decisions",
    financial: "financial_decisions",
    commerce: "commerce_decisions",
    architecture: "architecture_decisions",
    engineering: "engineering_decisions",
    operational: "operational_decisions",
    governance: "executive_decisions",
    innovation: "growth_decisions",
    business: "business_decisions",
  };
  return map[decisionType] ?? "executive_decisions";
}

function buildPipeline(activePhase: SimulationPipelinePhase = "comparative_analysis"): SimulationPipelineStep[] {
  const activeIdx = SIMULATION_PIPELINE.indexOf(activePhase);
  return SIMULATION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function scenarioProfiles(decision: ExecutiveDecision): Array<{
  scenario: SimulationType;
  success: number;
  roi: string;
  outcome: string;
  risk: string;
  recommended: boolean;
}> {
  const base = decision.confidence;
  return [
    {
      scenario: "best_case",
      success: Math.min(95, base + 15),
      roi: "high · accelerated returns",
      outcome: `${decision.title} exceeds targets · strategic momentum gained`,
      risk: "low",
      recommended: false,
    },
    {
      scenario: "expected_case",
      success: base,
      roi: "moderate · planned returns",
      outcome: `${decision.title} achieves planned objectives within timeline`,
      risk: decision.riskAssessment,
      recommended: base >= 70,
    },
    {
      scenario: "worst_case",
      success: Math.max(15, base - 35),
      roi: "negative · capital at risk",
      outcome: `${decision.title} underperforms · dependencies unresolved`,
      risk: "high",
      recommended: false,
    },
    {
      scenario: "conservative",
      success: Math.min(90, base + 5),
      roi: "stable · lower variance",
      outcome: `${decision.title} phased approach · reduced exposure`,
      risk: "low",
      recommended: base < 70,
    },
    {
      scenario: "aggressive",
      success: Math.min(85, base + 10),
      roi: "high · higher variance",
      outcome: `${decision.title} accelerated execution · resource intensive`,
      risk: "medium",
      recommended: false,
    },
  ];
}

function buildSimulations(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
}): DecisionSimulation[] {
  const decisions =
    input.executiveDecisionArchitecture?.currentDecisions.filter(
      (d) => d.status === "pending" || d.status === "queued" || d.status === "evaluating" || d.status === "approved",
    ) ?? [];

  const risks = input.riskAssessmentEngine?.currentRisks ?? [];
  const simulations: DecisionSimulation[] = [];

  const catalogue: Array<{
    decisionId: string;
    title: string;
    purpose: string;
    decisionType: string;
    domain: GovernedSimulationDomain;
    deps: string[];
    evidence: string[];
    confidence: number;
    riskProfile: string;
  }> = decisions.length
    ? decisions.slice(0, 5).map((d) => ({
        decisionId: d.decisionId,
        title: d.title,
        purpose: d.purpose,
        decisionType: d.decisionType,
        domain: mapDomain(d.decisionType),
        deps: d.dependencies,
        evidence: d.evidence,
        confidence: d.confidence,
        riskProfile: d.riskAssessment,
      }))
    : [
        {
          decisionId: "eda-ms-a-invest",
          title: "MS-A Commerce Investment Decision",
          purpose: "Authorize constitutional commerce execution toward USD 100k net profit",
          decisionType: "investment",
          domain: "investment_decisions",
          deps: ["P8 Commerce", "Business Factory", "Grand King Account"],
          evidence: ["Opportunity ROI analysis", "Risk assessment"],
          confidence: 68,
          riskProfile: "medium",
        },
        {
          decisionId: "eda-priority-top",
          title: "Prioritize Top Strategic Opportunity",
          purpose: "Focus executive resources on highest-value ranked opportunity",
          decisionType: "strategic",
          domain: "strategic_decisions",
          deps: ["Opportunity Prioritization", "Priority Management"],
          evidence: ["ROI ranking", "Strategic alignment"],
          confidence: 80,
          riskProfile: "medium",
        },
        {
          decisionId: "eda-commerce-expand",
          title: "Commerce Expansion Decision",
          purpose: "Evaluate multi-market commerce expansion post MS-A foundation",
          decisionType: "commerce",
          domain: "commerce_decisions",
          deps: ["MS-A foundation", "Long-Term Growth Planner"],
          evidence: ["Growth planner", "Scenario analysis"],
          confidence: 58,
          riskProfile: "medium",
        },
      ];

  for (const item of catalogue) {
    const linkedRisk = risks.find((r) => r.source.includes(item.decisionId) || r.title.includes(item.title.split("·")[0]?.trim() ?? ""));
    const riskProfile = linkedRisk?.severity ?? item.riskProfile;

    const mockDecision: ExecutiveDecision = {
      decisionId: item.decisionId,
      title: item.title,
      purpose: item.purpose,
      decisionType: item.decisionType as ExecutiveDecision["decisionType"],
      domain: item.domain.replace("_decisions", "_decisions") as ExecutiveDecision["domain"],
      context: "",
      evidence: item.evidence,
      strategicObjective: "",
      businessImpact: linkedRisk?.businessImpact ?? "high",
      financialImpact: linkedRisk?.financialImpact ?? "moderate",
      engineeringImpact: linkedRisk?.engineeringImpact ?? "moderate",
      riskAssessment: riskProfile,
      dependencies: item.deps,
      alternativesConsidered: [],
      confidence: item.confidence,
      decisionOwner: "Executive",
      decisionOutcome: "simulating",
      status: "simulating",
    };

    for (const profile of scenarioProfiles(mockDecision)) {
      simulations.push({
        simulationId: `dse-${item.decisionId}-${profile.scenario}`,
        decisionId: item.decisionId,
        title: `${item.title} · ${label(profile.scenario)}`,
        purpose: item.purpose,
        scenario: profile.scenario,
        domain: item.domain,
        assumptions: [
          "Constitutional governance maintained",
          "Production truth validated",
          `${label(profile.scenario)} market conditions`,
        ],
        constraints: ["No competing systems", "Evidence-first execution", "Executive accountability"],
        dependencies: item.deps,
        expectedOutcome: profile.outcome,
        businessImpact: mockDecision.businessImpact,
        financialImpact: profile.roi,
        engineeringImpact: mockDecision.engineeringImpact,
        strategicImpact: "aligned",
        riskProfile: profile.risk,
        probability: profile.success,
        confidence: item.confidence,
        evidence: item.evidence,
        successProbability: profile.success,
        failureProbability: 100 - profile.success,
        expectedRoi: profile.roi,
        status: profile.recommended ? "recommended" : "simulated",
      });
    }
  }

  const expansionScenarios: Array<{ scenario: SimulationType; title: string; success: number; roi: string }> = [
    { scenario: "expansion", title: "Multi-Market Expansion Simulation", success: 62, roi: "high · 18-month horizon" },
    { scenario: "innovation", title: "AI Innovation Investment Simulation", success: 72, roi: "moderate · measured experiments" },
    { scenario: "disruption", title: "Market Disruption Response Simulation", success: 55, roi: "variable · defensive positioning" },
    { scenario: "competitive", title: "Competitive Response Simulation", success: 68, roi: "moderate · market share defense" },
    { scenario: "recovery", title: "Operational Recovery Simulation", success: 78, roi: "stable · resilience focus" },
  ];

  for (const exp of expansionScenarios) {
    simulations.push({
      simulationId: `dse-programme-${exp.scenario}`,
      decisionId: "programme-level",
      title: exp.title,
      purpose: `Simulate ${label(exp.scenario)} outcome before executive commitment`,
      scenario: exp.scenario,
      domain: exp.scenario === "innovation" ? "growth_decisions" : "strategic_decisions",
      assumptions: ["E1 planning context active", "Risk assessment complete", "Multiple futures evaluated"],
      constraints: ["Constitution first", "No single-outcome decisions"],
      dependencies: ["E2-01 Decision Architecture", "E2-02 Risk Assessment"],
      expectedOutcome: `${label(exp.scenario)} path achieves constitutional alignment`,
      businessImpact: "high",
      financialImpact: exp.roi,
      engineeringImpact: "moderate",
      strategicImpact: "aligned",
      riskProfile: exp.success >= 70 ? "medium" : "high",
      probability: exp.success,
      confidence: exp.success - 5,
      evidence: ["Scenario planner", "Risk register"],
      successProbability: exp.success,
      failureProbability: 100 - exp.success,
      expectedRoi: exp.roi,
      status: "simulated",
    });
  }

  return simulations;
}

function buildScenarioComparison(simulations: DecisionSimulation[]): ScenarioComparisonEntry[] {
  const byDecision = new Map<string, DecisionSimulation[]>();
  for (const s of simulations) {
    const group = byDecision.get(s.decisionId) ?? [];
    group.push(s);
    byDecision.set(s.decisionId, group);
  }

  const entries: ScenarioComparisonEntry[] = [];
  let order = 1;

  for (const [, group] of byDecision) {
    const recommended = group.find((s) => s.status === "recommended") ?? group.sort((a, b) => b.successProbability - a.successProbability)[0];
    for (const s of group.slice(0, 5)) {
      entries.push({
        order: order++,
        simulationId: s.simulationId,
        title: s.title,
        scenario: s.scenario,
        successProbability: s.successProbability,
        failureProbability: s.failureProbability,
        expectedRoi: s.expectedRoi,
        riskProfile: s.riskProfile,
        strategicAlignment: s.strategicImpact,
        recommended: s.simulationId === recommended?.simulationId,
      });
    }
  }

  return entries.slice(0, 12);
}

function buildPredictedOutcomes(simulations: DecisionSimulation[]): PredictedOutcome[] {
  return [...simulations]
    .sort((a, b) => b.successProbability - a.successProbability)
    .slice(0, 10)
    .map((s) => ({
      simulationId: s.simulationId,
      title: s.title,
      scenario: s.scenario,
      outcome: s.expectedOutcome,
      successProbability: s.successProbability,
      businessImpact: s.businessImpact,
      financialImpact: s.financialImpact,
      confidence: s.confidence,
    }));
}

function buildComparativeAnalysis(simulations: DecisionSimulation[]): ComparativeAnalysisMetric[] {
  const recommended = simulations.filter((s) => s.status === "recommended");
  const top = recommended[0] ?? simulations.sort((a, b) => b.successProbability - a.successProbability)[0];

  const avgSuccess = Math.round(
    simulations.reduce((s, sim) => s + sim.successProbability, 0) / Math.max(simulations.length, 1),
  );

  const values: Record<string, { best: string; score: number; summary: string }> = {
    business_value: {
      best: top?.scenario ?? "expected_case",
      score: avgSuccess,
      summary: `${simulations.length} simulations · business impact quantified`,
    },
    financial_return: {
      best: top?.scenario ?? "expected_case",
      score: Math.round(avgSuccess * 0.9),
      summary: "Expected ROI compared across scenarios",
    },
    strategic_value: {
      best: "expected_case",
      score: 82,
      summary: "Vision-aligned scenarios prioritized",
    },
    engineering_complexity: {
      best: "conservative",
      score: 55,
      summary: "Conservative path reduces engineering complexity",
    },
    commercial_value: {
      best: "aggressive",
      score: 70,
      summary: "Commerce simulations include expansion paths",
    },
    risk: {
      best: "conservative",
      score: 65,
      summary: "Worst-case and risk profiles compared per decision",
    },
    time_to_value: {
      best: "aggressive",
      score: 60,
      summary: "Aggressive scenarios faster · higher variance",
    },
    operational_impact: {
      best: "expected_case",
      score: 72,
      summary: "Operational exposure mapped per scenario",
    },
    long_term_value: {
      best: "expansion",
      score: 68,
      summary: "Long-term growth simulations via expansion scenarios",
    },
  };

  return COMPARATIVE_ANALYSIS_DIMENSIONS.map((dimension) => ({
    dimension,
    label: label(dimension),
    bestScenario: values[dimension]?.best ?? "expected_case",
    score: values[dimension]?.score ?? 60,
    summary: values[dimension]?.summary ?? "Comparative analysis active",
  }));
}

function buildSimulationOutputs(simulations: DecisionSimulation[], recommended: DecisionSimulation | undefined): SimulationOutputMetric[] {
  const top = recommended ?? simulations.sort((a, b) => b.successProbability - a.successProbability)[0];
  const alternatives = simulations.filter((s) => s.simulationId !== top?.simulationId).slice(0, 3);

  const values: Record<string, { value: string; status: string }> = {
    predicted_outcomes: { value: `${simulations.length} simulated futures`, status: "generated" },
    success_probability: { value: `${top?.successProbability ?? 0}% · ${top?.title ?? "pending"}`, status: "quantified" },
    failure_probability: { value: `${top?.failureProbability ?? 0}% residual failure exposure`, status: "quantified" },
    risk_comparison: { value: "Best · Expected · Worst · Conservative · Aggressive compared", status: "complete" },
    expected_roi: { value: top?.expectedRoi ?? "pending", status: "evaluated" },
    time_impact: { value: "Aggressive fastest · Conservative most stable", status: "mapped" },
    cost_impact: { value: "Resource requirements vary by scenario path", status: "estimated" },
    resource_impact: { value: "ECC resource planning coordinated", status: "planned" },
    strategic_alignment: { value: top?.strategicImpact ?? "aligned", status: "validated" },
    recommended_decision: { value: top?.title ?? "Simulation in progress", status: top ? "recommended" : "pending" },
    alternative_decisions: {
      value: alternatives.map((a) => a.scenario).join(" · ") || "multiple alternatives",
      status: "evaluated",
    },
  };

  return SIMULATION_OUTPUT_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    value: values[domain]?.value ?? "simulating",
    status: values[domain]?.status ?? "active",
  }));
}

function buildRecommendations(input: {
  simulations: DecisionSimulation[];
  recommended?: DecisionSimulation;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
}): DecisionSimulationRecommendation[] {
  const top = input.recommended ?? input.simulations.sort((a, b) => b.successProbability - a.successProbability)[0];

  return [
    {
      id: "dse-rec-1",
      title: "Simulate multiple futures before every major executive decision",
      category: "simulation_framework",
      why: "No single-outcome decisions · constitutional requirement · executive transparency",
      what: "Best · Expected · Worst · Conservative · Aggressive scenarios per decision",
      how: "E2-03 Decision Simulation Engine · E2-01 decision linkage · E2-02 risk profiles",
      confidencePercent: 94,
    },
    {
      id: "dse-rec-2",
      title: top ? `Recommended: ${top.title}` : "Complete scenario comparison",
      category: "recommended_option",
      why: `${top?.successProbability ?? 0}% success · ${top?.riskProfile ?? "medium"} risk · evidence-backed`,
      what: top?.expectedOutcome ?? "Evaluate simulated outcomes",
      how: "Executive approval · comparative analysis review · Journey recording",
      confidencePercent: top?.confidence ?? 85,
    },
    {
      id: "dse-rec-3",
      title: "Cross-reference simulations with Risk Assessment Engine",
      category: "risk_integration",
      why: "Risk profiles inform scenario probability and failure exposure",
      what: input.riskAssessmentEngine
        ? `${input.riskAssessmentEngine.activeRiskCount} risks · ${input.riskAssessmentEngine.criticalRiskCount} critical/high linked`
        : "Link risk assessment to simulations",
      how: "E2-02 Risk Assessment · risk_assessment pipeline phase",
      confidencePercent: 90,
    },
    {
      id: "dse-rec-4",
      title: "Maintain decision context via Executive Decision Architecture",
      category: "decision_integration",
      why: "Every simulation tied to a constitutional executive decision",
      what: input.executiveDecisionArchitecture
        ? `${input.executiveDecisionArchitecture.pendingDecisionCount} pending decisions · simulation-ready`
        : "Link decisions to simulations",
      how: "E2-01 Decision Architecture · decision_selection pipeline phase",
      confidencePercent: 88,
    },
    {
      id: "dse-rec-5",
      title: "Prepare E2-04 Executive Recommendation Engine integration",
      category: "e2_roadmap",
      why: "Simulation outputs feed executive recommendation generation",
      what: "Extend simulation engine with dedicated recommendation synthesis",
      how: "E2-04 mission · integrate with executive_recommendation pipeline phase",
      confidencePercent: 86,
    },
  ];
}

function buildPillowEvaluations(input: {
  simulations: DecisionSimulation[];
  recommendations: DecisionSimulationRecommendation[];
  healthScore: number;
}): PillowSimulationEvaluationMetric[] {
  const recommended = input.simulations.filter((s) => s.status === "recommended").length;
  const values: Record<string, { status: string; summary: string }> = {
    simulation_quality: {
      status: input.healthScore >= 80 ? "strong" : "building",
      summary: `${input.simulations.length} simulations · multiple futures per decision`,
    },
    decision_alternatives: {
      status: "evaluated",
      summary: `${new Set(input.simulations.map((s) => s.decisionId)).size} decisions · 5+ scenarios each`,
    },
    strategic_trade_offs: {
      status: "documented",
      summary: "Business · financial · strategic · engineering trade-offs compared",
    },
    predicted_outcomes: {
      status: "generated",
      summary: `${input.simulations.length} predicted outcomes · success/failure quantified`,
    },
    risk_exposure: {
      status: "compared",
      summary: "Worst-case and risk profiles mapped per scenario path",
    },
    executive_recommendations: {
      status: input.recommendations.length >= 4 ? "strong" : "building",
      summary: `${input.recommendations.length} evidence-based simulation recommendations`,
    },
  };

  return PILLOW_SIMULATION_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "evaluating",
    summary: values[domain]?.summary ?? "Pillow simulation evaluation active",
  }));
}

export function assembleDecisionSimulationEngine(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  executiveScenarioPlanner?: Record<string, unknown> | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): DecisionSimulationEngine {
  const availableSimulations = buildSimulations(input);
  const scenarioComparison = buildScenarioComparison(availableSimulations);
  const predictedOutcomes = buildPredictedOutcomes(availableSimulations);
  const comparativeAnalysis = buildComparativeAnalysis(availableSimulations);

  const recommendedSim =
    availableSimulations.find((s) => s.status === "recommended") ??
    availableSimulations.sort((a, b) => b.successProbability - a.successProbability)[0];

  const simulationOutputs = buildSimulationOutputs(availableSimulations, recommendedSim);
  const recommendedActions = buildRecommendations({
    simulations: availableSimulations,
    recommended: recommendedSim,
    executiveDecisionArchitecture: input.executiveDecisionArchitecture,
    riskAssessmentEngine: input.riskAssessmentEngine,
  });

  const healthScore = Math.round(
    (availableSimulations.reduce((s, sim) => s + sim.successProbability, 0) /
      Math.max(availableSimulations.length, 1) +
      (input.corporateVision?.healthScore ?? 80) +
      (input.executiveDecisionArchitecture?.healthScore ?? 80) +
      (input.riskAssessmentEngine?.healthScore ?? 80)) /
      4,
  );

  const pillowEvaluations = buildPillowEvaluations({
    simulations: availableSimulations,
    recommendations: recommendedActions,
    healthScore,
  });

  const pillowAdvisory = [
    `Engine health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${availableSimulations.length} simulations · ${new Set(availableSimulations.map((s) => s.decisionId)).size} decisions · multiple futures`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `Recommended: ${recommendedSim?.title ?? "pending simulation completion"}`,
    `No competing simulation systems · one constitutional simulation authority`,
    `Ready for E2-04 Executive Recommendation Engine`,
  ];

  return {
    engineVersion: "E2-03",
    computedAt: new Date().toISOString(),
    engineSummary:
      "One permanent Decision Simulation Engine — constitutional executive simulation system evaluating multiple futures, comparing strategic outcomes and supporting evidence-based decision-making before executive commitment",
    engineHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore,
    activeSimulationCount: availableSimulations.filter((s) => s.status === "simulated" || s.status === "recommended").length,
    availableSimulationCount: availableSimulations.length,
    availableSimulations,
    scenarioComparison,
    predictedOutcomes,
    comparativeAnalysis,
    simulationOutputs,
    simulationPipeline: buildPipeline("executive_recommendation"),
    recommendedOption: recommendedSim?.title ?? "Pending simulation completion",
    recommendedConfidence: recommendedSim?.confidence ?? 0,
    recommendedActions,
    pillowEvaluations,
    simulationPrinciples: [...SIMULATION_PRINCIPLES],
    governedDomains: [...GOVERNED_SIMULATION_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth} · ${input.executiveDecisionArchitecture.pendingDecisionCount} pending`
        : "E2-01 · standby",
      riskAssessmentEngine: input.riskAssessmentEngine
        ? `E2-02 · ${input.riskAssessmentEngine.engineHealth} · ${input.riskAssessmentEngine.criticalRiskCount} critical/high`
        : "E2-02 · standby",
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified · planning context active"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      executiveScenarioPlanner: input.executiveScenarioPlanner
        ? "E1-10 · scenario context integrated · no competing systems"
        : "E1-10 · complementary",
      journeyStatus: String(input.journey?.currentJourney ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring simulations"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "simulation scheduling"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE204: true,
  };
}

export function buildFallbackDecisionSimulationEngine(): DecisionSimulationEngine {
  return assembleDecisionSimulationEngine({});
}
