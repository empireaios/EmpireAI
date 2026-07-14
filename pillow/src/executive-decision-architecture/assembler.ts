import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRoadmapEngine } from "../executive-roadmap-engine/types.js";
import type { OpportunityPrioritizationEngine } from "../opportunity-prioritization-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  DECISION_PIPELINE,
  DECISION_PRINCIPLES,
  GOVERNED_DECISION_DOMAINS,
  DECISION_GOVERNANCE_RECORDS,
  PILLOW_DECISION_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveDecisionArchitecture,
  DecisionPipelineStep,
  DecisionPipelinePhase,
  ExecutiveDecision,
  DecisionQueueItem,
  DecisionGovernanceEntry,
  DecisionArchitectureRecommendation,
  PillowDecisionEvaluationMetric,
  GovernedDecisionDomain,
  DecisionClassification,
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

function buildPipeline(activePhase: DecisionPipelinePhase = "recommendation_generation"): DecisionPipelineStep[] {
  const activeIdx = DECISION_PIPELINE.indexOf(activePhase);
  return DECISION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildDecisions(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
}): ExecutiveDecision[] {
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3) ?? [
      "E1 Executive Planning",
    ];
  const topOpportunity = input.opportunityPrioritization?.highestPriorityOpportunities[0];
  const e1Certified = input.executivePlanningCertification?.programmeCertified ?? true;

  const catalogue: Array<{
    id: string;
    title: string;
    purpose: string;
    decisionType: DecisionClassification;
    domain: GovernedDecisionDomain;
    context: string;
    objective: string;
    business: string;
    financial: string;
    engineering: string;
    risk: string;
    deps: string[];
    alternatives: string[];
    confidence: number;
    owner: string;
    outcome: string;
    status: string;
    evidence: string[];
  }> = [
    {
      id: "eda-e2-commence",
      title: "Commence Phase E2 Executive Decision Engine",
      purpose: "Begin E2 with constitutional decision architecture before decision automation",
      decisionType: "strategic",
      domain: "strategic_decisions",
      context: "E1 certified · enterprise planning active · ready for E2",
      objective: "E2 Executive Decision Engine",
      business: "critical",
      financial: "moderate investment",
      engineering: "high",
      risk: "low",
      deps: ["E1-15 Executive Planning Certified"],
      alternatives: ["Delay E2", "Partial decision framework"],
      confidence: 92,
      owner: "Grand King",
      outcome: e1Certified ? "approved" : "pending E1",
      status: e1Certified ? "approved" : "pending",
      evidence: ["E1 certification", "Executive Planning Dashboard"],
    },
    {
      id: "eda-ms-a-invest",
      title: "MS-A Commerce Investment Decision",
      purpose: "Authorize constitutional commerce execution toward USD 100k net profit",
      decisionType: "investment",
      domain: "financial_decisions",
      context: "Primary financial milestone · P8 Commerce programme",
      objective: "MS-A Financial Milestone",
      business: "critical",
      financial: "critical",
      engineering: "moderate",
      risk: "medium",
      deps: ["P8 Commerce", "Business Factory", "Grand King Account"],
      alternatives: ["Conservative path", "Accelerated path", "Defer investment"],
      confidence: 68,
      owner: "Executive",
      outcome: "evaluating",
      status: "pending",
      evidence: topOpportunity ? [topOpportunity.title, topOpportunity.expectedRoi] : ["Opportunity analysis"],
    },
    {
      id: "eda-e1-governance",
      title: "Maintain E1 Planning Governance",
      purpose: "Continue unified executive planning under certified E1 framework",
      decisionType: "governance",
      domain: "governance_decisions",
      context: "No competing planning systems · constitutional compliance",
      objective: objectives[0] ?? "E1 Governance",
      business: "high",
      financial: "foundation",
      engineering: "high",
      risk: "low",
      deps: ["Executive Planning Dashboard", "Strategic Alignment Monitor"],
      alternatives: ["Fragment planning", "Maintain unified framework"],
      confidence: 95,
      owner: "Pillow",
      outcome: "approved",
      status: "active",
      evidence: ["E1 certification gates", "Alignment monitor"],
    },
    {
      id: "eda-arch-consolidate",
      title: "Architecture Consolidation Decision",
      purpose: "Consolidate competing systems into canonical architecture",
      decisionType: "architecture",
      domain: "architecture_decisions",
      context: "E2 decision architecture must not compete with existing frameworks",
      objective: "Canonical Architecture",
      business: "high",
      financial: "moderate",
      engineering: "critical",
      risk: "low",
      deps: ["E1-01 Executive Architecture", "E2-01 Decision Architecture"],
      alternatives: ["Multiple decision systems", "One constitutional framework"],
      confidence: 90,
      owner: "Technical Chief",
      outcome: "approved",
      status: "approved",
      evidence: ["No competing systems doctrine", "Repository integrity"],
    },
    {
      id: "eda-priority-top",
      title: topOpportunity?.title ?? "Prioritize Top Strategic Opportunity",
      purpose: "Focus executive resources on highest-value ranked opportunity",
      decisionType: "strategic",
      domain: "business_decisions",
      context: "E1-12 Opportunity Prioritization · evidence-backed ranking",
      objective: objectives[1] ?? "Strategic Growth",
      business: "high",
      financial: "high",
      engineering: "moderate",
      risk: "medium",
      deps: topOpportunity?.dependencies ?? ["Priority Management"],
      alternatives: input.opportunityPrioritization?.highestPriorityOpportunities.slice(1, 3).map((o) => o.title) ?? [
        "Alternative opportunity",
      ],
      confidence: topOpportunity?.confidence ?? 80,
      owner: "Executive",
      outcome: "queued",
      status: "queued",
      evidence: topOpportunity?.evidence ?? ["ROI analysis"],
    },
    {
      id: "eda-production-truth",
      title: "Production Truth Validation Decision",
      purpose: "Maintain production-first execution for all executive decisions",
      decisionType: "operational",
      domain: "production_decisions",
      context: "Every decision must align with production truth",
      objective: "Production Truth",
      business: "high",
      financial: "moderate",
      engineering: "high",
      risk: "low",
      deps: ["Guardian", "Production Centre", "Browser Truth"],
      alternatives: ["Sandbox-only decisions", "Production-validated decisions"],
      confidence: 88,
      owner: "Supervisor",
      outcome: "approved",
      status: "active",
      evidence: ["Production mode", "Guardian monitoring"],
    },
    {
      id: "eda-commerce-expand",
      title: "Commerce Expansion Decision",
      purpose: "Evaluate multi-market commerce expansion post MS-A foundation",
      decisionType: "commerce",
      domain: "commerce_decisions",
      context: "Long-term growth horizon · market expansion",
      objective: "Market Expansion",
      business: "high",
      financial: "high",
      engineering: "moderate",
      risk: "medium",
      deps: ["MS-A foundation", "Long-Term Growth Planner"],
      alternatives: ["Single market focus", "Multi-market expansion", "Defer expansion"],
      confidence: 58,
      owner: "Commerce",
      outcome: "deferred",
      status: "deferred",
      evidence: ["Growth planner", "Scenario analysis"],
    },
    {
      id: "eda-innovation",
      title: "AI Innovation Investment Decision",
      purpose: "Authorize evidence-backed innovation experiments under constitutional governance",
      decisionType: "innovation",
      domain: "investment_decisions",
      context: "P9 AI Evolution · explainable · governed",
      objective: objectives[2] ?? "Innovation",
      business: "moderate",
      financial: "moderate",
      engineering: "high",
      risk: "medium",
      deps: ["P9-04 AI Evolution", "Scenario Planner"],
      alternatives: ["No innovation spend", "Measured experiments", "Aggressive innovation"],
      confidence: 72,
      owner: "Executive",
      outcome: "evaluating",
      status: "pending",
      evidence: ["Innovation pipeline", "Scenario simulations"],
    },
  ];

  return catalogue.map((c) => ({
    decisionId: c.id,
    title: c.title,
    purpose: c.purpose,
    decisionType: c.decisionType,
    domain: c.domain,
    context: c.context,
    evidence: c.evidence,
    strategicObjective: c.objective,
    businessImpact: c.business,
    financialImpact: c.financial,
    engineeringImpact: c.engineering,
    riskAssessment: c.risk,
    dependencies: c.deps,
    alternativesConsidered: c.alternatives,
    confidence: c.confidence,
    decisionOwner: c.owner,
    decisionOutcome: c.outcome,
    status: c.status,
  }));
}

function buildQueue(decisions: ExecutiveDecision[]): DecisionQueueItem[] {
  const priority = ["pending", "queued", "evaluating", "active", "deferred", "approved"];
  return [...decisions]
    .sort((a, b) => priority.indexOf(a.status) - priority.indexOf(b.status) || b.confidence - a.confidence)
    .slice(0, 8)
    .map((d, i) => ({
      order: i + 1,
      decisionId: d.decisionId,
      title: d.title,
      decisionType: d.decisionType,
      status: d.status,
      confidence: d.confidence,
      owner: d.decisionOwner,
    }));
}

function buildGovernance(decisions: ExecutiveDecision[]): DecisionGovernanceEntry[] {
  const primary = decisions.find((d) => d.status === "pending" || d.status === "queued") ?? decisions[0];
  const values: Record<string, { value: string; status: string }> = {
    purpose: { value: primary?.purpose ?? "Constitutional executive decision", status: "recorded" },
    reason: { value: "Evidence-first · strategic alignment · no arbitrary decisions", status: "recorded" },
    evidence: { value: `${primary?.evidence.length ?? 0} evidence items · E1 planning context`, status: "collected" },
    alternatives: {
      value: `${primary?.alternativesConsidered.length ?? 0} alternatives considered`,
      status: "evaluated",
    },
    trade_offs: { value: "Business · financial · engineering · risk trade-offs analyzed", status: "documented" },
    expected_outcome: { value: primary?.decisionOutcome ?? "pending", status: "defined" },
    actual_outcome: { value: "outcome review pending execution", status: "pending" },
    business_impact: { value: primary?.businessImpact ?? "evaluated", status: "assessed" },
    architecture_impact: { value: "canonical architecture preserved", status: "validated" },
    repository_impact: { value: "no competing decision systems", status: "integrity preserved" },
    journey_entry: { value: "E2-01 Decision Architecture · journey recording active", status: "active" },
  };

  return DECISION_GOVERNANCE_RECORDS.map((record) => ({
    record,
    label: label(record),
    value: values[record]?.value ?? "governed",
    status: values[record]?.status ?? "active",
  }));
}

function buildRecommendations(input: {
  decisions: ExecutiveDecision[];
  corporateVision?: CorporateVisionEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
}): DecisionArchitectureRecommendation[] {
  const pending = input.decisions.filter((d) => d.status === "pending" || d.status === "queued");
  const top = pending[0] ?? input.decisions[0];

  return [
    {
      id: "eda-rec-1",
      title: "Apply constitutional decision pipeline to all executive decisions",
      category: "decision_framework",
      why: "No arbitrary decisions · one unified constitutional decision architecture",
      what: "Vision → Evidence → Risk → Scenario → Recommendation → Decision → Outcome → Knowledge",
      how: "E2-01 Decision Architecture · VIE validation · Journey recording",
      confidencePercent: 94,
    },
    {
      id: "eda-rec-2",
      title: top ? `Next decision: ${top.title}` : "Review decision queue",
      category: "decision_queue",
      why: `Confidence ${top?.confidence ?? 0}% · ${top?.riskAssessment ?? "medium"} risk · evidence-backed`,
      what: top?.purpose ?? "Evaluate pending decisions",
      how: "Executive approval · ECC execution · Supervisor monitoring",
      confidencePercent: top?.confidence ?? 85,
    },
    {
      id: "eda-rec-3",
      title: "Maintain E1 planning context for all E2 decisions",
      category: "planning_integration",
      why: "Planning determines WHAT · Decision Architecture determines HOW",
      what: input.executivePlanningCertification?.programmeCertified
        ? "E1 certified · planning context available"
        : "Verify E1 certification before major decisions",
      how: "Executive Planning Dashboard · Strategic Alignment · Opportunity Prioritization",
      confidencePercent: 90,
    },
    {
      id: "eda-rec-4",
      title: "Prepare E2-02 Risk Assessment Engine integration",
      category: "e2_roadmap",
      why: "Risk assessment is core to constitutional decision-making",
      what: "Extend decision architecture with dedicated risk assessment engine",
      how: "E2-02 mission · integrate with decision pipeline risk_assessment phase",
      confidencePercent: 88,
    },
  ];
}

function buildPillowEvaluations(input: {
  decisions: ExecutiveDecision[];
  recommendations: DecisionArchitectureRecommendation[];
  healthScore: number;
}): PillowDecisionEvaluationMetric[] {
  const pending = input.decisions.filter((d) => d.status === "pending" || d.status === "queued").length;
  const values: Record<string, { status: string; summary: string }> = {
    decision_quality: {
      status: input.healthScore >= 80 ? "strong" : "building",
      summary: `${input.decisions.length} decisions · constitutional framework · explainable`,
    },
    decision_risks: {
      status: input.decisions.some((d) => d.riskAssessment === "high" || d.riskAssessment === "critical")
        ? "evaluated"
        : "managed",
      summary: `${input.decisions.filter((d) => d.riskAssessment === "medium" || d.riskAssessment === "high").length} decisions with elevated risk`,
    },
    decision_opportunities: {
      status: "active",
      summary: `${input.decisions.filter((d) => d.confidence >= 80).length} high-confidence decisions`,
    },
    alternative_decisions: {
      status: "evaluated",
      summary: "Alternatives considered for every decision · no single-assumption decisions",
    },
    strategic_trade_offs: {
      status: "documented",
      summary: "Business · financial · engineering trade-offs in governance records",
    },
    executive_recommendations: {
      status: input.recommendations.length >= 3 ? "strong" : "building",
      summary: `${input.recommendations.length} evidence-based decision recommendations`,
    },
  };

  return PILLOW_DECISION_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "evaluating",
    summary: values[domain]?.summary ?? "Pillow decision evaluation active",
  }));
}

export function assembleExecutiveDecisionArchitecture(input: {
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): ExecutiveDecisionArchitecture {
  const currentDecisions = buildDecisions(input);
  const decisionQueue = buildQueue(currentDecisions);
  const decisionGovernance = buildGovernance(currentDecisions);
  const recommendedActions = buildRecommendations({
    decisions: currentDecisions,
    corporateVision: input.corporateVision,
    executivePlanningCertification: input.executivePlanningCertification,
  });

  const pendingCount = currentDecisions.filter(
    (d) => d.status === "pending" || d.status === "queued" || d.status === "evaluating",
  ).length;

  const healthScore = Math.round(
    (currentDecisions.reduce((s, d) => s + d.confidence, 0) / Math.max(currentDecisions.length, 1) +
      (input.corporateVision?.healthScore ?? 80) +
      (input.strategicObjectives?.healthScore ?? 80) +
      (input.executivePlanningCertification?.healthScore ?? 85)) /
      4,
  );

  const pillowEvaluations = buildPillowEvaluations({
    decisions: currentDecisions,
    recommendations: recommendedActions,
    healthScore,
  });

  const pillowAdvisory = [
    `Architecture health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${currentDecisions.length} executive decisions · ${pendingCount} pending · constitutional framework`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `No competing decision architectures · one unified framework`,
    `Planning context: ${input.executivePlanningCertification?.programmeCertified ? "E1 certified" : "E1 integration"}`,
    `Ready for E2-02 Risk Assessment Engine`,
  ];

  return {
    architectureVersion: "E2-01",
    computedAt: new Date().toISOString(),
    architectureSummary:
      "One permanent Executive Decision Architecture — constitutional framework governing all executive decisions through evidence, strategic alignment, explainability and executive accountability",
    architectureHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore,
    activeDecisionCount: currentDecisions.length,
    pendingDecisionCount: pendingCount,
    currentDecisions,
    decisionQueue,
    decisionPipeline: buildPipeline("recommendation_generation"),
    decisionGovernance,
    recommendedActions,
    pillowEvaluations,
    decisionPrinciples: [...DECISION_PRINCIPLES],
    governedDomains: [...GOVERNED_DECISION_DOMAINS],
    pillowAdvisory,
    integrations: {
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? `E1-15 · certified · ${input.executivePlanningCertification.gatesPassed}/${input.executivePlanningCertification.gatesTotal} gates`
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      strategicObjectiveEngine: input.strategicObjectives
        ? `E1-03 · ${input.strategicObjectives.objectiveHealth}`
        : "standby",
      executiveRoadmapEngine: input.executiveRoadmap
        ? `E1-04 · ${input.executiveRoadmap.roadmapHealth}`
        : "standby",
      executiveArchitecture: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring decisions"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "decision execution"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE202: true,
  };
}

export function buildFallbackExecutiveDecisionArchitecture(): ExecutiveDecisionArchitecture {
  return assembleExecutiveDecisionArchitecture({});
}
