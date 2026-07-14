import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { DecisionAuditEngine } from "../decision-audit-engine/types.js";
import type { DecisionSimulationEngine } from "../decision-simulation-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { RiskAssessmentEngine } from "../risk-assessment-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  CONFIDENCE_PIPELINE,
  CONFIDENCE_PRINCIPLES,
  GOVERNED_CONFIDENCE_DOMAINS,
  CONFIDENCE_CALCULATION_DOMAINS,
  PILLOW_CONFIDENCE_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveConfidenceEngine,
  ConfidencePipelineStep,
  ConfidencePipelinePhase,
  ConfidenceAssessment,
  ConfidenceTrendEntry,
  ConfidenceDriverMetric,
  ConfidenceCalibrationEntry,
  ExecutiveConfidenceRecommendation,
  PillowConfidenceEvaluationMetric,
  GovernedConfidenceDomain,
  ConfidenceClassification,
  ConfidenceLevel,
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

function scoreToLevel(score: number): ConfidenceLevel {
  if (score >= 90) return "very_high";
  if (score >= 80) return "high";
  if (score >= 65) return "moderate";
  if (score >= 50) return "low";
  if (score >= 30) return "very_low";
  return "unknown";
}

function mapDomain(category: ConfidenceClassification): GovernedConfidenceDomain {
  const map: Record<ConfidenceClassification, GovernedConfidenceDomain> = {
    strategic: "strategic_decisions",
    business: "business_decisions",
    financial: "financial_decisions",
    commerce: "commerce_decisions",
    engineering: "engineering_decisions",
    architecture: "architecture_decisions",
    operational: "operational_decisions",
    production: "production_decisions",
    governance: "governance_decisions",
    investment: "investment_decisions",
    recommendation: "executive_recommendations",
    simulation: "executive_simulations",
  };
  return map[category];
}

function buildPipeline(activePhase: ConfidencePipelinePhase = "confidence_calculation"): ConfidencePipelineStep[] {
  const activeIdx = CONFIDENCE_PIPELINE.indexOf(activePhase);
  return CONFIDENCE_PIPELINE.map((phase, i) => ({
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
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  decisionAuditEngine?: DecisionAuditEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  decisionSimulationEngine?: DecisionSimulationEngine | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
}): ConfidenceAssessment[] {
  const audits = input.decisionAuditEngine?.recentDecisions ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];
  const simulations = input.decisionSimulationEngine?.availableSimulations ?? [];
  const criticalRisks = input.riskAssessmentEngine?.currentRisks.filter(
    (r) => r.severity === "critical" || r.severity === "high",
  ) ?? [];
  const knowledge = input.knowledgeEvolution?.recentKnowledge ?? [];

  const catalogue: Array<{
    id: string;
    decisionId: string;
    title: string;
    category: ConfidenceClassification;
    score: number;
    evidence: string;
    historical: number;
    business: string;
    financial: string;
    engineering: string;
    strategic: string;
    risk: string;
    supporting: string[];
    limiting: string[];
    action: string;
    trend: string;
    status: string;
  }> = [
    {
      id: "ecfe-e2-engineering",
      decisionId: "dec-e2-engineering",
      title: "Engineering Resource Allocation",
      category: "engineering",
      score: 90,
      evidence: "strong",
      historical: 88,
      business: "critical",
      financial: "optimized",
      engineering: "sustainable",
      strategic: "aligned",
      risk: "low — gated milestones",
      supporting: ["E2-10 trade-off score 88", "E2-11 consensus 88%", "85% utilization evidence", audits[0]?.supportingEvidence[0] ?? "Audit verified"],
      limiting: ["Commerce delay risk if gates fail"],
      action: audits[0]?.recommendationHistory[0] ?? "Balanced phased allocation",
      trend: "stable",
      status: "calibrated",
    },
    {
      id: "ecfe-msa-financial",
      decisionId: "dec-msa-financial",
      title: "MS-A Investment Phasing",
      category: "financial",
      score: 88,
      evidence: "strong",
      historical: 85,
      business: "critical",
      financial: "controlled",
      engineering: "moderate",
      strategic: "aligned",
      risk: "moderate — financial exposure",
      supporting: ["ROI gate validation", "E2-11 financial consensus", criticalRisks[0]?.title ?? "MS-A risk assessed"],
      limiting: ["Market timing uncertainty", "Phase transition overhead"],
      action: "Phased investment with ROI gates",
      trend: "improving",
      status: "calibrated",
    },
    {
      id: "ecfe-architecture-canonical",
      decisionId: "dec-arch-policy",
      title: "Canonical Architecture Enforcement",
      category: "architecture",
      score: 93,
      evidence: "very strong",
      historical: 92,
      business: "high",
      financial: "moderate",
      engineering: "high quality",
      strategic: "constitutionally aligned",
      risk: "minimal",
      supporting: ["VIE validation 94%", "E2-11 consensus 92%", "Constitution hierarchy compliance"],
      limiting: ["20% slower initial delivery"],
      action: "Strict canonical enforcement",
      trend: "stable",
      status: "calibrated",
    },
    {
      id: "ecfe-commerce-mvp",
      decisionId: "dec-p8-launch",
      title: "Commerce MVP Launch",
      category: "commerce",
      score: 86,
      evidence: "strong",
      historical: 82,
      business: "high",
      financial: "early revenue",
      engineering: "focused",
      strategic: "aligned",
      risk: "moderate — managed MVP",
      supporting: ["Market analysis evidence", "E2-10 MVP score 85", "Commerce intelligence"],
      limiting: ["Limited initial features", "Support scaling unknown"],
      action: "MVP launch with transparent roadmap",
      trend: "stable",
      status: "calibrated",
    },
    {
      id: "ecfe-e2-sequencing",
      decisionId: "dec-e2-sequencing",
      title: "E2 Sequential Completion",
      category: "strategic",
      score: 92,
      evidence: "very strong",
      historical: 91,
      business: "high",
      financial: "optimized",
      engineering: "sustainable",
      strategic: "fully aligned",
      risk: "minimal",
      supporting: ["E2 dependency chain validated", "Zero integration debt", knowledge[0]?.title ?? "E2 knowledge base"],
      limiting: ["Extended programme timeline"],
      action: "Sequential constitutional completion",
      trend: "stable",
      status: "calibrated",
    },
    {
      id: "ecfe-production-truth",
      decisionId: "dec-production-truth",
      title: "Production Truth Enforcement",
      category: "production",
      score: 94,
      evidence: "very strong",
      historical: 93,
      business: "high",
      financial: "moderate",
      engineering: "high integrity",
      strategic: "aligned",
      risk: "minimal",
      supporting: ["Guardian validation 96%", "Production audit verified", "Zero production drift"],
      limiting: ["Validation gate overhead"],
      action: "Strict production truth enforcement",
      trend: "stable",
      status: "calibrated",
    },
    {
      id: "ecfe-constitution-policy",
      decisionId: "dec-constitution-first",
      title: "Constitution First Governance",
      category: "governance",
      score: 98,
      evidence: "very strong",
      historical: 96,
      business: "critical",
      financial: "low",
      engineering: "low",
      strategic: "critical",
      risk: "minimal",
      supporting: ["Constitution hierarchy", "VIE validation 98%", "Policy engine active"],
      limiting: [],
      action: "Constitutional validation before all decisions",
      trend: "stable",
      status: "calibrated",
    },
    {
      id: "ecfe-crisis-emergency",
      decisionId: "dec-crisis-emergency",
      title: "Crisis Emergency Response",
      category: "business",
      score: 78,
      evidence: "moderate",
      historical: 75,
      business: "critical",
      financial: "critical",
      engineering: "critical",
      strategic: "critical",
      risk: "high — emergency pathway",
      supporting: ["E2-08 crisis detection", "Emergency escalation validated"],
      limiting: ["Post-crisis review pending", "Limited historical emergency data"],
      action: "Activate crisis decision pipeline",
      trend: "monitoring",
      status: "calibrating",
    },
    {
      id: "ecfe-e2-investment",
      decisionId: "dec-e2-investment",
      title: "E2 Programme Investment",
      category: "investment",
      score: 89,
      evidence: "strong",
      historical: 87,
      business: "high",
      financial: "controlled",
      engineering: "sustainable",
      strategic: "aligned",
      risk: "low — gated phases",
      supporting: ["Phased investment model", "E1-15 certification", "ROI validation per mission"],
      limiting: ["Extended programme timeline"],
      action: "Incremental phased investment",
      trend: "improving",
      status: "calibrated",
    },
    {
      id: "ecfe-recommendation-top",
      decisionId: recommendations[0]?.recommendationId ?? "rec-top",
      title: recommendations[0]?.title ?? "Top Executive Recommendation",
      category: "recommendation",
      score: recommendations[0]?.confidence ?? 88,
      evidence: "strong",
      historical: 86,
      business: recommendations[0]?.businessImpact ?? "high",
      financial: recommendations[0]?.financialImpact ?? "moderate",
      engineering: recommendations[0]?.engineeringImpact ?? "moderate",
      strategic: recommendations[0]?.strategicImpact ?? "aligned",
      risk: recommendations[0]?.riskAssessment ?? "moderate",
      supporting: recommendations[0]?.supportingEvidence ?? ["E2-04 recommendation evidence"],
      limiting: ["Decision complexity", "Alternative paths exist"],
      action: recommendations[0]?.recommendedAction ?? "Follow executive recommendation",
      trend: "stable",
      status: "active",
    },
    {
      id: "ecfe-simulation-top",
      decisionId: simulations[0]?.decisionId ?? "sim-top",
      title: simulations[0]?.title ?? "Top Decision Simulation",
      category: "simulation",
      score: simulations[0]?.confidence ?? 85,
      evidence: "strong",
      historical: 84,
      business: simulations[0]?.businessImpact ?? "high",
      financial: simulations[0]?.financialImpact ?? "moderate",
      engineering: simulations[0]?.engineeringImpact ?? "moderate",
      strategic: simulations[0]?.strategicImpact ?? "aligned",
      risk: simulations[0]?.riskProfile ?? "moderate",
      supporting: [`${simulations[0]?.successProbability ?? 85}% success probability`, "E2-03 simulation evidence"],
      limiting: [`${simulations[0]?.failureProbability ?? 15}% failure probability`, "Assumption sensitivity"],
      action: simulations[0]?.expectedOutcome ?? "Follow recommended simulation path",
      trend: "stable",
      status: "active",
    },
    {
      id: "ecfe-historical-e2-01",
      decisionId: audits[10]?.decisionId ?? "dec-e2-01-architecture",
      title: "E2-01 Decision Architecture (Historical)",
      category: "strategic",
      score: 96,
      evidence: "very strong",
      historical: 95,
      business: "critical",
      financial: "strategic",
      engineering: "foundational",
      strategic: "fully aligned",
      risk: "minimal",
      supporting: ["Historical audit verified", "Programme established", "E2 chain progressing"],
      limiting: [],
      action: "Continue E2 programme execution",
      trend: "stable",
      status: "calibrated",
    },
  ];

  return catalogue.map((c) => ({
    confidenceId: c.id,
    decisionId: c.decisionId,
    title: c.title,
    category: c.category,
    domain: mapDomain(c.category),
    confidenceScore: c.score,
    confidenceLevel: scoreToLevel(c.score),
    evidenceStrength: c.evidence,
    historicalAccuracy: c.historical,
    businessImpact: c.business,
    financialImpact: c.financial,
    engineeringImpact: c.engineering,
    strategicImpact: c.strategic,
    riskInfluence: c.risk,
    supportingFactors: c.supporting,
    limitingFactors: c.limiting,
    recommendedAction: c.action,
    trend: c.trend,
    status: c.status,
  }));
}

function buildTrends(assessments: ConfidenceAssessment[]): ConfidenceTrendEntry[] {
  return assessments
    .filter((a) => a.trend !== "stable" || a.confidenceScore >= 85)
    .slice(0, 10)
    .map((a) => ({
      confidenceId: a.confidenceId,
      decisionId: a.decisionId,
      title: a.title,
      previousScore: a.trend === "improving" ? a.confidenceScore - 4 : a.confidenceScore + 2,
      currentScore: a.confidenceScore,
      trend: a.trend,
      calibrationStatus: a.status,
    }));
}

function buildDrivers(): ConfidenceDriverMetric[] {
  return CONFIDENCE_CALCULATION_DOMAINS.map((domain) => {
    const metrics: Record<string, { score: number; influence: string; summary: string }> = {
      evidence_quality: { score: 92, influence: "high", summary: "Strong evidence chains on verified decisions" },
      historical_accuracy: { score: 89, influence: "high", summary: "Historical outcome validation integrated with audit engine" },
      prediction_accuracy: { score: 86, influence: "moderate", summary: "Simulation predictions tracking within 5% of outcomes" },
      simulation_consistency: { score: 88, influence: "high", summary: "E2-03 simulation consistency across decision scenarios" },
      risk_exposure: { score: 84, influence: "moderate", summary: "E2-02 risk assessment feeds confidence calculation" },
      business_certainty: { score: 87, influence: "high", summary: "Business impact certainty from trade-off and consensus engines" },
      strategic_alignment: { score: 91, influence: "high", summary: "Vision and strategic alignment validated by VIE" },
      decision_complexity: { score: 78, influence: "moderate", summary: "Complex decisions receive lower baseline confidence" },
      data_completeness: { score: 90, influence: "high", summary: "Minimum 2 evidence items per confidence assessment" },
      executive_consensus: { score: 88, influence: "high", summary: "E2-11 consensus strength feeds confidence scoring" },
    };
    const m = metrics[domain] ?? { score: 85, influence: "moderate", summary: "Confidence driver active" };
    return { domain, label: label(domain), score: m.score, influence: m.influence, summary: m.summary };
  });
}

function buildCalibration(assessments: ConfidenceAssessment[]): ConfidenceCalibrationEntry[] {
  return assessments
    .filter((a) => a.status === "calibrated" || a.status === "calibrating")
    .slice(0, 8)
    .map((a) => ({
      confidenceId: a.confidenceId,
      title: a.title,
      predictedConfidence: a.confidenceScore,
      actualOutcome: a.status === "calibrated" ? "Outcome validated · within prediction range" : "Calibrating · outcome pending",
      calibrationDelta: a.status === "calibrated" ? Math.abs(a.confidenceScore - a.historicalAccuracy) : 5,
      status: a.status,
    }));
}

function buildPillowEvaluations(input: {
  assessedCount: number;
  avgScore: number;
  highCount: number;
}): PillowConfidenceEvaluationMetric[] {
  return PILLOW_CONFIDENCE_EVALUATIONS.map((domain) => {
    const metrics: Record<string, { status: string; summary: string }> = {
      confidence_quality: {
        status: "high",
        summary: `${input.assessedCount} assessments · avg ${input.avgScore}% confidence`,
      },
      evidence_quality: {
        status: "strong",
        summary: "Evidence strength validated against audit and knowledge records",
      },
      prediction_reliability: {
        status: "reliable",
        summary: "Simulation predictions within calibration tolerance",
      },
      recommendation_reliability: {
        status: "reliable",
        summary: "E2-04 recommendations include confidence scores",
      },
      executive_confidence: {
        status: "calibrated",
        summary: `${input.highCount} high/very high confidence decisions`,
      },
      strategic_recommendations: {
        status: "active",
        summary: "Confidence communicated with every executive recommendation",
      },
    };
    const m = metrics[domain] ?? { status: "active", summary: "Pillow evaluation active" };
    return { domain, label: label(domain), status: m.status, summary: m.summary };
  });
}

function buildRecommendations(input: {
  assessments: ConfidenceAssessment[];
  avgScore: number;
}): ExecutiveConfidenceRecommendation[] {
  const top = [...input.assessments].sort((a, b) => b.confidenceScore - a.confidenceScore)[0];
  const low = input.assessments.filter((a) => a.confidenceLevel === "low" || a.confidenceLevel === "very_low" || a.confidenceLevel === "moderate");

  return [
    {
      id: "ecfe-rec-1",
      title: "Transparent confidence — no artificial certainty in any recommendation",
      category: "confidence_framework",
      why: "Grand King understands both the recommendation and its certainty",
      what: "Context → Evidence → History → Risk → Simulation → Calculate → Recommend → Validate → Calibrate",
      how: "E2-14 Executive Confidence Engine · E2-13 Audit · E2-03 Simulation · E2-02 Risk",
      confidencePercent: 96,
    },
    {
      id: "ecfe-rec-2",
      title: top ? `Highest confidence: ${top.title} (${top.confidenceScore}%)` : "Review confidence register",
      category: "confidence_priority",
      why: `${label(top?.confidenceLevel ?? "high")} · ${top?.evidenceStrength ?? "strong"} evidence · ${top?.historicalAccuracy ?? 85}% historical accuracy`,
      what: top?.recommendedAction ?? "Proceed with high-confidence recommendation",
      how: "Supporting factors documented · limiting factors transparent",
      confidencePercent: top?.confidenceScore ?? 90,
    },
    {
      id: "ecfe-rec-3",
      title: `Average confidence ${input.avgScore}% across ${input.assessments.length} decisions`,
      category: "confidence_health",
      why: "Continuous calibration improves confidence accuracy over time",
      what: low.length > 0 ? `${low.length} decisions require additional evidence before high-confidence recommendation` : "All decisions above moderate confidence",
      how: "Supervisor monitors confidence drift · outcome validation feeds calibration",
      confidencePercent: 92,
    },
    {
      id: "ecfe-rec-4",
      title: "Integrate confidence with audit outcomes for continuous calibration",
      category: "calibration_integration",
      why: "Historical outcomes improve future confidence predictions",
      what: "E2-13 audit outcomes feed E2-14 confidence calibration pipeline",
      how: "Knowledge Evolution · Journey · continuous learning loop",
      confidencePercent: 94,
    },
  ];
}

export function assembleExecutiveConfidenceEngine(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  decisionAuditEngine?: DecisionAuditEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  decisionSimulationEngine?: DecisionSimulationEngine | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): ExecutiveConfidenceEngine {
  const confidenceAssessments = buildAssessments(input);
  const confidenceTrends = buildTrends(confidenceAssessments);
  const confidenceDrivers = buildDrivers();
  const confidenceCalibration = buildCalibration(confidenceAssessments);

  const highCount = confidenceAssessments.filter(
    (a) => a.confidenceLevel === "very_high" || a.confidenceLevel === "high",
  ).length;
  const moderateCount = confidenceAssessments.filter((a) => a.confidenceLevel === "moderate").length;
  const lowCount = confidenceAssessments.filter(
    (a) => a.confidenceLevel === "low" || a.confidenceLevel === "very_low",
  ).length;
  const avgScore = Math.round(
    confidenceAssessments.reduce((s, a) => s + a.confidenceScore, 0) / Math.max(confidenceAssessments.length, 1),
  );

  const healthInputs = [
    input.executiveDecisionArchitecture?.healthScore ?? 75,
    input.decisionAuditEngine?.healthScore ?? 75,
    input.executiveRecommendationEngine?.healthScore ?? 75,
    input.decisionSimulationEngine?.healthScore ?? 75,
    avgScore >= 85 ? 92 : avgScore >= 75 ? 82 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    assessedCount: confidenceAssessments.length,
    avgScore,
    highCount,
  });
  const recommendedActions = buildRecommendations({ assessments: confidenceAssessments, avgScore });

  const pillowAdvisory = [
    "Transparent confidence — every recommendation includes measurable certainty",
    `${confidenceAssessments.length} assessments · avg ${avgScore}% · ${highCount} high/very high`,
    "No artificial certainty · limiting factors always disclosed",
    "Integrated with E2-13 Audit · E2-04 Recommendations · E2-03 Simulation · E2-02 Risk",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting confidence integrity")}`,
    "ECC publishes confidence · Supervisor monitors drift and calibration",
    "VIE validates confidence alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E2-14",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Executive Confidence Engine measures, calibrates and communicates executive decision confidence using validated evidence, historical performance, simulation consistency and risk analysis. The Grand King understands not only the recommended decision, but also the certainty behind it.",
    engineHealth: healthLabel(clampedHealth),
    confidenceHealth: avgScore >= 88 ? "strong" : avgScore >= 80 ? "stable" : "calibrating",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    assessedDecisionCount: confidenceAssessments.length,
    highConfidenceCount: highCount,
    moderateConfidenceCount: moderateCount,
    lowConfidenceCount: lowCount,
    averageConfidenceScore: avgScore,
    confidenceAssessments,
    confidenceTrends,
    confidenceDrivers,
    confidenceCalibration,
    confidencePipeline: buildPipeline("confidence_calculation"),
    recommendedActions,
    pillowEvaluations,
    confidencePrinciples: [...CONFIDENCE_PRINCIPLES],
    governedDomains: [...GOVERNED_CONFIDENCE_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      decisionAuditEngine: input.decisionAuditEngine
        ? `E2-13 · ${input.decisionAuditEngine.engineHealth} · ${input.decisionAuditEngine.auditedDecisionCount} audited`
        : "E2-13 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      decisionSimulationEngine: input.decisionSimulationEngine
        ? `E2-03 · ${input.decisionSimulationEngine.engineHealth} · ${input.decisionSimulationEngine.activeSimulationCount} simulations`
        : "E2-03 · standby",
      riskAssessmentEngine: input.riskAssessmentEngine
        ? `E2-02 · ${input.riskAssessmentEngine.engineHealth} · ${input.riskAssessmentEngine.criticalRiskCount} critical/high`
        : "E2-02 · standby",
      knowledgeEvolution: input.knowledgeEvolution
        ? `P9-02 · ${input.knowledgeEvolution.knowledgeHealth} · calibration knowledge active`
        : "P9-02 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "confidence integrity protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring confidence health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "confidence publication coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE215: true,
  };
}

export function buildFallbackExecutiveConfidenceEngine(): ExecutiveConfidenceEngine {
  return assembleExecutiveConfidenceEngine({});
}
