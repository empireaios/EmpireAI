import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { DecisionSimulationEngine } from "../decision-simulation-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { OpportunityPrioritizationEngine } from "../opportunity-prioritization-engine/types.js";
import type { RiskAssessmentEngine } from "../risk-assessment-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  RECOMMENDATION_PIPELINE,
  RECOMMENDATION_PRINCIPLES,
  GOVERNED_RECOMMENDATION_DOMAINS,
  RECOMMENDATION_QUALITY_DIMENSIONS,
  PILLOW_RECOMMENDATION_GENERATIONS,
} from "./paths.js";
import type {
  ExecutiveRecommendationEngine,
  RecommendationPipelineStep,
  RecommendationPipelinePhase,
  ExecutiveRecommendation,
  RecommendationExplainability,
  RecommendationQualityMetric,
  PriorityRecommendationItem,
  EngineRecommendationAction,
  PillowRecommendationGenerationMetric,
  GovernedRecommendationDomain,
  RecommendationClassification,
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

function mapDomain(type: string): GovernedRecommendationDomain {
  const map: Record<string, GovernedRecommendationDomain> = {
    strategic: "strategic_recommendations",
    business: "business_recommendations",
    commerce: "commerce_recommendations",
    financial: "financial_recommendations",
    investment: "investment_recommendations",
    engineering: "engineering_recommendations",
    architecture: "architecture_recommendations",
    operational: "operational_recommendations",
    production: "production_recommendations",
    governance: "governance_recommendations",
    innovation: "growth_recommendations",
    emergency: "governance_recommendations",
  };
  return map[type] ?? "strategic_recommendations";
}

function buildPipeline(activePhase: RecommendationPipelinePhase = "recommendation_generation"): RecommendationPipelineStep[] {
  const activeIdx = RECOMMENDATION_PIPELINE.indexOf(activePhase);
  return RECOMMENDATION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildRecommendations(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  decisionSimulationEngine?: DecisionSimulationEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
}): ExecutiveRecommendation[] {
  const decisions = input.executiveDecisionArchitecture?.currentDecisions ?? [];
  const risks = input.riskAssessmentEngine?.criticalRisks ?? [];
  const topSimulation = input.decisionSimulationEngine?.scenarioComparison.find((s) => s.recommended);
  const topOpportunity = input.opportunityPrioritization?.highestPriorityOpportunities[0];

  const catalogue: Array<{
    id: string;
    title: string;
    purpose: string;
    type: RecommendationClassification;
    priority: number;
    evidence: string[];
    business: string;
    financial: string;
    engineering: string;
    strategic: string;
    risk: string;
    alternatives: string[];
    confidence: number;
    action: string;
    outcome: string;
    status: string;
  }> = [
    {
      id: "ere-sim-approve",
      title: topSimulation
        ? `Approve simulated path: ${topSimulation.title}`
        : "Approve expected-case simulation for top pending decision",
      purpose: "Execute constitutionally aligned decision based on multi-scenario simulation",
      type: "strategic",
      priority: 95,
      evidence: [
        "E2-03 Decision Simulation",
        `${topSimulation?.successProbability ?? 70}% success probability`,
        "Comparative analysis complete",
      ],
      business: "critical",
      financial: topSimulation?.expectedRoi ?? "moderate · planned returns",
      engineering: "moderate",
      strategic: topSimulation?.strategicAlignment ?? "aligned",
      risk: topSimulation?.riskProfile ?? "medium",
      alternatives: ["Conservative path", "Defer decision", "Aggressive path"],
      confidence: topSimulation?.successProbability ?? 72,
      action: "Grand King review · executive validation · ECC execution scheduling",
      outcome: topSimulation ? "Simulated outcome achieved within planned horizon" : "Expected-case outcome",
      status: "pending_review",
    },
    {
      id: "ere-risk-mitigate",
      title: risks[0] ? `Mitigate critical risk: ${risks[0].title}` : "Address top critical enterprise risk",
      purpose: "Reduce executive exposure before major decision execution",
      type: "governance",
      priority: 92,
      evidence: ["E2-02 Risk Assessment", "Critical risk register", "Mitigation status"],
      business: "high",
      financial: "high exposure reduction",
      engineering: "moderate",
      strategic: "foundation",
      risk: risks[0]?.severity ?? "high",
      alternatives: ["Accept risk", "Defer mitigation", "Full mitigation programme"],
      confidence: 88,
      action: "Activate mitigation plan · Supervisor monitoring · weekly risk review",
      outcome: "Residual risk reduced to acceptable level",
      status: "active",
    },
    {
      id: "ere-ms-a-invest",
      title: "Proceed with phased MS-A commerce investment",
      purpose: "Advance toward USD 100k net profit with constitutional commerce execution",
      type: "investment",
      priority: 90,
      evidence: ["MS-A decision context", "Opportunity ROI", "Risk assessment", "Simulation"],
      business: "critical",
      financial: "critical",
      engineering: "moderate",
      strategic: "aligned",
      risk: "medium",
      alternatives: ["Conservative phased path", "Accelerated path", "Defer investment"],
      confidence: 68,
      action: "Authorize phased P8 Commerce investment · weekly ROI tracking",
      outcome: "MS-A milestone progress within 18-month horizon",
      status: "pending_review",
    },
    {
      id: "ere-priority-focus",
      title: topOpportunity
        ? `Focus resources on: ${topOpportunity.title}`
        : "Prioritize highest-value strategic opportunity",
      purpose: "Align executive resources with evidence-backed opportunity ranking",
      type: "business",
      priority: 88,
      evidence: topOpportunity?.evidence ?? ["E1-12 Opportunity Prioritization", "ROI ranking"],
      business: "high",
      financial: "high",
      engineering: "moderate",
      strategic: "aligned",
      risk: "medium",
      alternatives: input.opportunityPrioritization?.highestPriorityOpportunities.slice(1, 3).map((o) => o.title) ?? [
        "Alternative opportunity",
      ],
      confidence: topOpportunity?.confidence ?? 80,
      action: "Reallocate executive calendar and mission priorities to top opportunity",
      outcome: "Highest ROI opportunity advanced",
      status: "recommended",
    },
    {
      id: "ere-arch-consolidate",
      title: "Maintain canonical architecture — no competing systems",
      purpose: "Preserve constitutional architecture integrity across all recommendations",
      type: "architecture",
      priority: 85,
      evidence: ["Canonical architecture policy", "E2-01 Decision Architecture", "Repository integrity"],
      business: "high",
      financial: "foundation",
      engineering: "critical",
      strategic: "aligned",
      risk: "low",
      alternatives: ["Fragment systems", "Maintain unified framework"],
      confidence: 94,
      action: "Continue consolidation reviews · reject competing recommendation systems",
      outcome: "Single constitutional advisory authority maintained",
      status: "approved",
    },
    {
      id: "ere-production-first",
      title: "Enforce production-first execution for all recommendations",
      purpose: "Ensure every recommended action validates against production truth",
      type: "production",
      priority: 82,
      evidence: ["Production mode", "Guardian monitoring", "Browser truth"],
      business: "high",
      financial: "moderate",
      engineering: "high",
      strategic: "aligned",
      risk: "low",
      alternatives: ["Sandbox-only recommendations", "Production-validated recommendations"],
      confidence: 90,
      action: "Gate all recommendation execution through production validation",
      outcome: "Zero production-truth deviations from recommendations",
      status: "active",
    },
    {
      id: "ere-innovation-measured",
      title: "Authorize measured AI innovation experiments",
      purpose: "Pursue P9 AI Evolution with evidence-backed governed experiments",
      type: "innovation",
      priority: 75,
      evidence: ["Innovation pipeline", "E2-03 simulation", "Scenario planner"],
      business: "moderate",
      financial: "moderate",
      engineering: "high",
      strategic: "aligned",
      risk: "medium",
      alternatives: ["No innovation spend", "Measured experiments", "Aggressive innovation"],
      confidence: 72,
      action: "Approve capped innovation budget · approval gates per experiment",
      outcome: "Governed innovation progress without uncontrolled spend",
      status: "evaluating",
    },
    {
      id: "ere-commerce-defer",
      title: "Defer multi-market commerce expansion until MS-A achieved",
      purpose: "Avoid premature expansion risk identified in simulation and risk assessment",
      type: "commerce",
      priority: 70,
      evidence: ["E2-03 expansion simulation", "E2-02 commerce risk", "Growth planner"],
      business: "high",
      financial: "risk reduction",
      engineering: "low",
      strategic: "aligned",
      risk: "low",
      alternatives: ["Proceed with expansion", "Single market focus", "Defer expansion"],
      confidence: 78,
      action: "Maintain single-market focus · revisit after MS-A milestone",
      outcome: "Resources concentrated on foundation milestone",
      status: "recommended",
    },
    {
      id: "ere-e1-maintain",
      title: "Continue unified E1 planning governance",
      purpose: "Maintain certified executive planning as context for all recommendations",
      type: "governance",
      priority: 68,
      evidence: ["E1-15 certification", "Executive Planning Dashboard", "Alignment monitor"],
      business: "high",
      financial: "foundation",
      engineering: "high",
      strategic: "critical",
      risk: "low",
      alternatives: ["Fragment planning", "Maintain unified E1 framework"],
      confidence: 95,
      action: "Weekly planning sync · alignment monitor review",
      outcome: "Planning context remains available for all E2 recommendations",
      status: "active",
    },
    {
      id: "ere-resource-e205",
      title: "Prepare E2-05 Resource Allocation Engine integration",
      purpose: "Extend recommendation engine with resource allocation for execution",
      type: "operational",
      priority: 60,
      evidence: ["E2 roadmap", "ECC resource planning", "Recommendation pipeline"],
      business: "moderate",
      financial: "moderate",
      engineering: "high",
      strategic: "aligned",
      risk: "low",
      alternatives: ["Manual allocation", "Automated resource engine"],
      confidence: 85,
      action: "Commence E2-05 mission after E2-04 certification",
      outcome: "Recommendations linked to resource allocation",
      status: "planned",
    },
  ];

  for (const decision of decisions.filter((d) => d.status === "pending" || d.status === "queued")) {
    catalogue.push({
      id: `ere-decision-${decision.decisionId}`,
      title: `Review and decide: ${decision.title}`,
      purpose: decision.purpose,
      type: (decision.decisionType as RecommendationClassification) || "strategic",
      priority: Math.round(decision.confidence * 0.9),
      evidence: decision.evidence,
      business: decision.businessImpact,
      financial: decision.financialImpact,
      engineering: decision.engineeringImpact,
      strategic: decision.strategicObjective,
      risk: decision.riskAssessment,
      alternatives: decision.alternativesConsidered,
      confidence: decision.confidence,
      action: `Executive validation · Grand King review · ${decision.decisionOwner} coordination`,
      outcome: decision.decisionOutcome,
      status: "pending_review",
    });
  }

  return catalogue
    .sort((a, b) => b.priority - a.priority)
    .map((c) => ({
      recommendationId: c.id,
      title: c.title,
      purpose: c.purpose,
      recommendationType: c.type,
      domain: mapDomain(c.type),
      priority: c.priority,
      supportingEvidence: c.evidence,
      businessImpact: c.business,
      financialImpact: c.financial,
      engineeringImpact: c.engineering,
      strategicImpact: c.strategic,
      riskAssessment: c.risk,
      alternativesConsidered: c.alternatives,
      confidence: c.confidence,
      recommendedAction: c.action,
      expectedOutcome: c.outcome,
      status: c.status,
    }));
}

function buildExplainability(recommendations: ExecutiveRecommendation[]): RecommendationExplainability[] {
  return recommendations.slice(0, 10).map((r) => ({
    recommendationId: r.recommendationId,
    title: r.title,
    why: `${r.purpose} · evidence-backed · ${r.supportingEvidence.length} proof items`,
    what: r.recommendedAction,
    how: `E2-04 pipeline · ${r.recommendationType} · ECC execution · Supervisor monitoring`,
    proof: r.supportingEvidence.join(" · "),
    businessImpact: r.businessImpact,
    strategicImpact: r.strategicImpact,
    risk: r.riskAssessment,
    confidence: r.confidence,
    alternativeOptions: r.alternativesConsidered,
  }));
}

function buildQualityMetrics(recommendations: ExecutiveRecommendation[]): RecommendationQualityMetric[] {
  const avg = (fn: (r: ExecutiveRecommendation) => number) =>
    Math.round(recommendations.reduce((s, r) => s + fn(r), 0) / Math.max(recommendations.length, 1));

  const values: Record<string, { score: number; status: string }> = {
    evidence_strength: { score: avg((r) => Math.min(r.supportingEvidence.length * 20, 95)), status: "evaluated" },
    business_value: {
      score: avg((r) => (r.businessImpact === "critical" ? 90 : r.businessImpact === "high" ? 75 : 55)),
      status: "quantified",
    },
    financial_value: {
      score: avg((r) => (r.financialImpact.includes("critical") ? 90 : r.financialImpact.includes("high") ? 75 : 55)),
      status: "quantified",
    },
    strategic_value: {
      score: avg((r) => (r.strategicImpact === "critical" ? 95 : r.strategicImpact === "aligned" ? 82 : 65)),
      status: "aligned",
    },
    engineering_value: {
      score: avg((r) => (r.engineeringImpact === "critical" ? 90 : r.engineeringImpact === "high" ? 70 : 50)),
      status: "assessed",
    },
    risk_reduction: {
      score: avg((r) => (r.riskAssessment === "low" ? 85 : r.riskAssessment === "medium" ? 65 : 45)),
      status: "evaluated",
    },
    expected_roi: { score: avg((r) => r.confidence), status: "projected" },
    long_term_value: { score: 72, status: "evaluated" },
    executive_confidence: { score: avg((r) => r.confidence), status: "transparent" },
  };

  return RECOMMENDATION_QUALITY_DIMENSIONS.map((dimension) => ({
    dimension,
    label: label(dimension),
    score: values[dimension]?.score ?? 60,
    status: values[dimension]?.status ?? "evaluating",
  }));
}

function buildPriorityQueue(recommendations: ExecutiveRecommendation[]): PriorityRecommendationItem[] {
  return recommendations.slice(0, 10).map((r, i) => ({
    order: i + 1,
    recommendationId: r.recommendationId,
    title: r.title,
    priority: r.priority,
    recommendationType: r.recommendationType,
    confidence: r.confidence,
    businessImpact: r.businessImpact,
    status: r.status,
  }));
}

function buildEngineActions(input: {
  recommendations: ExecutiveRecommendation[];
  decisionSimulationEngine?: DecisionSimulationEngine | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
}): EngineRecommendationAction[] {
  const top = input.recommendations[0];

  return [
    {
      id: "ere-act-1",
      title: "Apply constitutional recommendation pipeline to all executive advice",
      category: "recommendation_framework",
      why: "No hidden reasoning · explainable intelligence · evidence-first advisory",
      what: "Vision → Evidence → Risk → Simulation → Trade-off → Recommendation → Grand King Review",
      how: "E2-04 Executive Recommendation Engine · VIE validation · Journey recording",
      confidencePercent: 94,
    },
    {
      id: "ere-act-2",
      title: top ? `Top priority: ${top.title}` : "Review recommendation queue",
      category: "priority_action",
      why: `Priority ${top?.priority ?? 0} · ${top?.confidence ?? 0}% confidence · ${top?.riskAssessment ?? "medium"} risk`,
      what: top?.recommendedAction ?? "Evaluate pending recommendations",
      how: "Grand King review · executive validation · ECC execution",
      confidencePercent: top?.confidence ?? 85,
    },
    {
      id: "ere-act-3",
      title: "Ground recommendations in simulation outcomes",
      category: "simulation_integration",
      why: "Recommendations informed by multiple simulated futures",
      what: input.decisionSimulationEngine
        ? `${input.decisionSimulationEngine.availableSimulationCount} simulations · recommended: ${input.decisionSimulationEngine.recommendedOption}`
        : "Link simulation outcomes to recommendations",
      how: "E2-03 Decision Simulation · scenario_simulation pipeline phase",
      confidencePercent: 90,
    },
    {
      id: "ere-act-4",
      title: "Incorporate risk intelligence into every recommendation",
      category: "risk_integration",
      why: "Risk reduction is a core recommendation quality dimension",
      what: input.riskAssessmentEngine
        ? `${input.riskAssessmentEngine.criticalRiskCount} critical/high risks inform advisory`
        : "Link risk assessment to recommendations",
      how: "E2-02 Risk Assessment · risk_assessment pipeline phase",
      confidencePercent: 88,
    },
    {
      id: "ere-act-5",
      title: "Prepare E2-05 Resource Allocation Engine integration",
      category: "e2_roadmap",
      why: "Recommendations require resource allocation for execution",
      what: "Extend recommendation engine with dedicated resource allocation",
      how: "E2-05 mission · integrate with ECC resource planning",
      confidencePercent: 86,
    },
  ];
}

function buildPillowGenerations(input: {
  recommendations: ExecutiveRecommendation[];
  actions: EngineRecommendationAction[];
  healthScore: number;
}): PillowRecommendationGenerationMetric[] {
  const values: Record<string, { status: string; summary: string }> = {
    strategic_recommendations: {
      status: "active",
      summary: `${input.recommendations.filter((r) => r.recommendationType === "strategic").length} strategic recommendations`,
    },
    business_recommendations: {
      status: "active",
      summary: `${input.recommendations.filter((r) => r.domain === "business_recommendations" || r.domain === "commerce_recommendations").length} business/commerce recommendations`,
    },
    commercial_recommendations: {
      status: "active",
      summary: `${input.recommendations.filter((r) => r.recommendationType === "commerce" || r.recommendationType === "investment").length} commercial/investment recommendations`,
    },
    engineering_recommendations: {
      status: "active",
      summary: `${input.recommendations.filter((r) => r.recommendationType === "engineering" || r.recommendationType === "architecture").length} engineering/architecture recommendations`,
    },
    growth_recommendations: {
      status: "active",
      summary: `${input.recommendations.filter((r) => r.recommendationType === "innovation").length} growth/innovation recommendations`,
    },
    executive_advice: {
      status: input.actions.length >= 4 ? "strong" : "building",
      summary: `${input.actions.length} explainable executive actions · ${input.recommendations.length} total recommendations`,
    },
  };

  return PILLOW_RECOMMENDATION_GENERATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "generating",
    summary: values[domain]?.summary ?? "Pillow recommendation generation active",
  }));
}

export function assembleExecutiveRecommendationEngine(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  decisionSimulationEngine?: DecisionSimulationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): ExecutiveRecommendationEngine {
  const currentRecommendations = buildRecommendations(input);
  const explainability = buildExplainability(currentRecommendations);
  const qualityMetrics = buildQualityMetrics(currentRecommendations);
  const priorityQueue = buildPriorityQueue(currentRecommendations);
  const recommendedActions = buildEngineActions({
    recommendations: currentRecommendations,
    decisionSimulationEngine: input.decisionSimulationEngine,
    riskAssessmentEngine: input.riskAssessmentEngine,
  });

  const highPriorityCount = currentRecommendations.filter((r) => r.priority >= 85).length;

  const healthScore = Math.round(
    (currentRecommendations.reduce((s, r) => s + r.confidence, 0) / Math.max(currentRecommendations.length, 1) +
      (input.corporateVision?.healthScore ?? 80) +
      (input.decisionSimulationEngine?.healthScore ?? 80) +
      (input.riskAssessmentEngine?.healthScore ?? 80)) /
      4,
  );

  const pillowGenerations = buildPillowGenerations({
    recommendations: currentRecommendations,
    actions: recommendedActions,
    healthScore,
  });

  const pillowAdvisory = [
    `Engine health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${currentRecommendations.length} recommendations · ${highPriorityCount} high priority · explainable`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `Top recommendation: ${currentRecommendations[0]?.title ?? "generating"}`,
    `No competing recommendation systems · one constitutional advisory authority`,
    `Ready for E2-05 Resource Allocation Engine`,
  ];

  return {
    engineVersion: "E2-04",
    computedAt: new Date().toISOString(),
    engineSummary:
      "One permanent Executive Recommendation Engine — constitutional advisory system transforming enterprise evidence into explainable, evidence-backed executive recommendations with quantified impacts, confidence scores and alternative options",
    engineHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore,
    activeRecommendationCount: currentRecommendations.length,
    highPriorityCount,
    currentRecommendations,
    priorityQueue,
    explainability,
    qualityMetrics,
    recommendationPipeline: buildPipeline("grand_king_review"),
    recommendedActions,
    pillowGenerations,
    recommendationPrinciples: [...RECOMMENDATION_PRINCIPLES],
    governedDomains: [...GOVERNED_RECOMMENDATION_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth} · ${input.executiveDecisionArchitecture.pendingDecisionCount} pending`
        : "E2-01 · standby",
      riskAssessmentEngine: input.riskAssessmentEngine
        ? `E2-02 · ${input.riskAssessmentEngine.engineHealth} · ${input.riskAssessmentEngine.criticalRiskCount} critical/high`
        : "E2-02 · standby",
      decisionSimulationEngine: input.decisionSimulationEngine
        ? `E2-03 · ${input.decisionSimulationEngine.engineHealth} · ${input.decisionSimulationEngine.availableSimulationCount} simulations`
        : "E2-03 · standby",
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified · planning context active"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring recommendations"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "recommendation execution"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE205: true,
  };
}

export function buildFallbackExecutiveRecommendationEngine(): ExecutiveRecommendationEngine {
  return assembleExecutiveRecommendationEngine({});
}
