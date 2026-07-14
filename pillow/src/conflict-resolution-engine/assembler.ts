import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { DecisionSimulationEngine } from "../decision-simulation-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { ResourceAllocationEngine } from "../resource-allocation-engine/types.js";
import type { RiskAssessmentEngine } from "../risk-assessment-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  CONFLICT_PIPELINE,
  CONFLICT_PRINCIPLES,
  GOVERNED_CONFLICT_DOMAINS,
  CONFLICT_ANALYSIS_DIMENSIONS,
  PILLOW_CONFLICT_EVALUATIONS,
} from "./paths.js";
import type {
  ConflictResolutionEngine,
  ConflictPipelineStep,
  ConflictPipelinePhase,
  EnterpriseConflict,
  ConflictAnalysisMetric,
  ResolutionStatusEntry,
  ConflictEscalation,
  ConflictResolutionRecommendation,
  PillowConflictEvaluationMetric,
  GovernedConflictDomain,
  ConflictClassification,
  ResolutionStrategy,
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

function buildPipeline(activePhase: ConflictPipelinePhase = "resolution_generation"): ConflictPipelineStep[] {
  const activeIdx = CONFLICT_PIPELINE.indexOf(activePhase);
  return CONFLICT_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function mapDomain(type: ConflictClassification): GovernedConflictDomain {
  const map: Record<ConflictClassification, GovernedConflictDomain> = {
    strategic: "priority_conflicts",
    business: "business_conflicts",
    financial: "resource_conflicts",
    engineering: "mission_conflicts",
    architecture: "architecture_conflicts",
    commerce: "commerce_conflicts",
    operational: "scheduling_conflicts",
    production: "mission_conflicts",
    scheduling: "scheduling_conflicts",
    dependency: "dependency_conflicts",
    governance: "governance_conflicts",
    executive: "executive_recommendation_conflicts",
  };
  return map[type];
}

function buildConflicts(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  resourceAllocationEngine?: ResourceAllocationEngine | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  decisionSimulationEngine?: DecisionSimulationEngine | null;
}): EnterpriseConflict[] {
  const bottlenecks = input.resourceAllocationEngine?.currentBottlenecks ?? [];
  const highPriorityRecs =
    input.executiveRecommendationEngine?.currentRecommendations.filter((r) => r.priority >= 85) ?? [];
  const pendingDecisions =
    input.executiveDecisionArchitecture?.currentDecisions.filter(
      (d) => d.status === "pending" || d.status === "queued",
    ) ?? [];
  const criticalRisks = input.riskAssessmentEngine?.criticalRisks ?? [];
  const simConflicts = input.decisionSimulationEngine?.scenarioComparison.filter(
    (s) => !s.recommended && s.successProbability >= 60,
  ) ?? [];

  const catalogue: Array<{
    id: string;
    title: string;
    description: string;
    type: ConflictClassification;
    source: string;
    affected: string[];
    business: string;
    financial: string;
    engineering: string;
    strategic: string;
    deps: string[];
    severity: string;
    priority: number;
    resolution: string;
    strategy: ResolutionStrategy;
    confidence: number;
    evidence: string[];
    status: string;
    escalated: boolean;
  }> = [
    {
      id: "cre-resource-engineering",
      title: "Engineering capacity vs MS-A commerce investment",
      description: "E2 programme engineering demand competes with P8 commerce execution capacity",
      type: "financial",
      source: "Resource Allocation Engine",
      affected: ["E2 Executive Decision Engine", "P8 Commerce", "Engineering"],
      business: "high",
      financial: "capital allocation tension",
      engineering: "critical",
      strategic: "aligned",
      deps: ["E2-05 Resource Allocation", "MS-A Investment", "E2 Roadmap"],
      severity: "high",
      priority: 92,
      resolution: "Phase E2 completion before MS-A acceleration · rebalance 70/30 engineering split",
      strategy: "resource_reallocation",
      confidence: 85,
      evidence: [bottlenecks[0]?.title ?? "Engineering bottleneck", "Resource utilization data"],
      status: "resolving",
      escalated: false,
    },
    {
      id: "cre-priority-opportunity",
      title: "Competing strategic opportunity priorities",
      description: "Multiple high-confidence recommendations compete for executive resources",
      type: "strategic",
      source: "Executive Recommendation Engine",
      affected: ["Opportunity Prioritization", "Executive Calendar", "Resource Allocation"],
      business: "critical",
      financial: "ROI competition",
      engineering: "moderate",
      strategic: "tension",
      deps: ["E1-12 Opportunity Prioritization", "E2-04 Recommendations"],
      severity: "medium",
      priority: 88,
      resolution: "Apply E1-12 ranking · defer lower-ranked opportunities · priority queue enforcement",
      strategy: "priority_adjustment",
      confidence: 90,
      evidence: highPriorityRecs.slice(0, 2).map((r) => r.title),
      status: "resolving",
      escalated: false,
    },
    {
      id: "cre-recommendation-sim",
      title: "Simulation outcome vs executive recommendation divergence",
      description: "Some simulated scenarios recommend different paths than top executive recommendation",
      type: "executive",
      source: "Decision Simulation Engine",
      affected: ["E2-03 Simulation", "E2-04 Recommendations", "Decision Architecture"],
      business: "moderate",
      financial: "moderate",
      engineering: "low",
      strategic: "aligned",
      deps: ["E2-03 Decision Simulation", "E2-04 Recommendations"],
      severity: "medium",
      priority: 82,
      resolution: "Reconcile via comparative analysis · Grand King review for divergent paths only",
      strategy: "business_compromise",
      confidence: 82,
      evidence: simConflicts.slice(0, 2).map((s) => s.title),
      status: "analysing",
      escalated: false,
    },
    {
      id: "cre-commerce-expand",
      title: "Commerce expansion timing conflict",
      description: "Commerce expansion recommendation conflicts with defer-until-MS-A resource policy",
      type: "commerce",
      source: "Executive Recommendations · Resource Allocation",
      affected: ["Commerce", "MS-A Milestone", "Marketing Investment"],
      business: "high",
      financial: "high",
      engineering: "moderate",
      strategic: "moderate tension",
      deps: ["MS-A foundation", "Commerce Expansion Decision", "Growth Planner"],
      severity: "medium",
      priority: 78,
      resolution: "Defer expansion · maintain single-market focus until MS-A achieved",
      strategy: "deferred_execution",
      confidence: 88,
      evidence: ["E2-04 defer recommendation", "E2-03 expansion simulation"],
      status: "resolved",
      escalated: false,
    },
    {
      id: "cre-dependency-e2",
      title: "E2 mission dependency ordering conflict",
      description: "E2-06 through E2-07 missions have overlapping ECC scheduling demands",
      type: "dependency",
      source: "ECC · Mission Ordering",
      affected: ["E2 Roadmap", "ECC", "Supervisor"],
      business: "moderate",
      financial: "low",
      engineering: "high",
      strategic: "aligned",
      deps: ["E2-01 through E2-05", "ECC scheduling"],
      severity: "low",
      priority: 72,
      resolution: "Sequential E2 mission completion · dependency reordering per roadmap",
      strategy: "dependency_reordering",
      confidence: 92,
      evidence: ["E2 roadmap", "Mission dependencies"],
      status: "resolving",
      escalated: false,
    },
    {
      id: "cre-arch-competing",
      title: "Architecture consolidation vs innovation investment",
      description: "Innovation experiments may introduce systems competing with canonical architecture",
      type: "architecture",
      source: "Architecture Governance",
      affected: ["Canonical Architecture", "P9 AI Evolution", "Innovation Pipeline"],
      business: "high",
      financial: "moderate",
      engineering: "critical",
      strategic: "aligned",
      deps: ["E1-01 Executive Architecture", "No competing systems doctrine"],
      severity: "high",
      priority: 85,
      resolution: "Policy resolution · no competing systems · innovation within constitutional framework only",
      strategy: "policy_resolution",
      confidence: 94,
      evidence: ["Canonical architecture policy", "E2-01 decision architecture"],
      status: "resolved",
      escalated: false,
    },
    {
      id: "cre-scheduling-executive",
      title: "Executive attention scheduling conflict",
      description: "Pending decisions exceed available Grand King review bandwidth",
      type: "scheduling",
      source: "Executive Calendar · Pending Decisions",
      affected: ["Grand King", "Executive Calendar", "Decision Queue"],
      business: "critical",
      financial: "decision velocity",
      engineering: "low",
      strategic: "aligned",
      deps: ["Executive Calendar", "E2-01 Decision Queue"],
      severity: "high",
      priority: 90,
      resolution: "Mission rescheduling · top-3 priority review block · defer non-critical decisions",
      strategy: "mission_rescheduling",
      confidence: 86,
      evidence: [`${pendingDecisions.length} pending decisions`, "Executive calendar"],
      status: "resolving",
      escalated: true,
    },
    {
      id: "cre-risk-msa",
      title: "MS-A financial risk vs investment recommendation conflict",
      description: "Risk assessment flags MS-A delay risk while recommendation urges phased investment",
      type: "financial",
      source: "Risk Assessment · Recommendations",
      affected: ["MS-A", "Risk Register", "Investment Decision"],
      business: "critical",
      financial: "critical",
      engineering: "moderate",
      strategic: "aligned",
      deps: ["E2-02 Risk Assessment", "E2-04 MS-A recommendation"],
      severity: "high",
      priority: 87,
      resolution: "Phased investment with weekly ROI gates · risk-triggered pause conditions",
      strategy: "alternative_strategy",
      confidence: 75,
      evidence: [criticalRisks[0]?.title ?? "MS-A financial risk", "Phased investment plan"],
      status: "analysing",
      escalated: true,
    },
    {
      id: "cre-governance-e1e2",
      title: "E1 planning governance vs E2 decision velocity",
      description: "Full E1 planning context required for E2 decisions may slow decision velocity",
      type: "governance",
      source: "Planning Programme Integration",
      affected: ["E1 Executive Planning", "E2 Decision Engine", "Alignment Monitor"],
      business: "moderate",
      financial: "foundation",
      engineering: "moderate",
      strategic: "aligned",
      deps: ["E1-15 Certification", "E2-01 Decision Architecture"],
      severity: "low",
      priority: 65,
      resolution: "Programme reprioritization · lightweight planning context for routine decisions",
      strategy: "programme_reprioritization",
      confidence: 88,
      evidence: ["E1 certification", "E2 integration status"],
      status: "resolved",
      escalated: false,
    },
    {
      id: "cre-production-priority",
      title: "Production hardening vs feature delivery priority",
      description: "Production operations allocation competes with E2 feature delivery timeline",
      type: "production",
      source: "Resource Allocation · Mission Conflicts",
      affected: ["Production Centre", "Guardian", "E2 Development"],
      business: "high",
      financial: "risk reduction",
      engineering: "high",
      strategic: "aligned",
      deps: ["Guardian", "Production Truth", "E2 Roadmap"],
      severity: "medium",
      priority: 80,
      resolution: "Production-first doctrine · feature delivery within production constraints",
      strategy: "priority_adjustment",
      confidence: 90,
      evidence: ["Production mode", "Guardian monitoring"],
      status: "resolving",
      escalated: false,
    },
  ];

  return catalogue.map((c) => ({
    conflictId: c.id,
    title: c.title,
    description: c.description,
    conflictType: c.type,
    domain: mapDomain(c.type),
    source: c.source,
    affectedSystems: c.affected,
    businessImpact: c.business,
    financialImpact: c.financial,
    engineeringImpact: c.engineering,
    strategicImpact: c.strategic,
    dependencies: c.deps,
    severity: c.severity,
    priority: c.priority,
    recommendedResolution: c.resolution,
    resolutionStrategy: c.strategy,
    confidence: c.confidence,
    evidence: c.evidence,
    resolutionStatus: c.status,
    escalated: c.escalated,
  }));
}

function buildAnalysis(conflicts: EnterpriseConflict[]): ConflictAnalysisMetric[] {
  const avgConf = Math.round(conflicts.reduce((s, c) => s + c.confidence, 0) / Math.max(conflicts.length, 1));
  const values: Record<string, { score: number; status: string }> = {
    business_value: { score: 78, status: "evaluated" },
    strategic_value: { score: 82, status: "aligned" },
    financial_value: { score: 72, status: "quantified" },
    risk: { score: conflicts.filter((c) => c.severity === "high" || c.severity === "critical").length * 15 + 40, status: "assessed" },
    dependencies: { score: 80, status: "mapped" },
    capacity: { score: 68, status: "evaluated" },
    executive_impact: { score: conflicts.filter((c) => c.escalated).length * 20 + 50, status: "monitored" },
    long_term_value: { score: 75, status: "evaluated" },
    recovery_impact: { score: avgConf, status: "projected" },
  };

  return CONFLICT_ANALYSIS_DIMENSIONS.map((dimension) => ({
    dimension,
    label: label(dimension),
    score: values[dimension]?.score ?? 65,
    status: values[dimension]?.status ?? "analysing",
  }));
}

function buildResolutionStatus(conflicts: EnterpriseConflict[]): ResolutionStatusEntry[] {
  return conflicts
    .filter((c) => c.resolutionStatus !== "resolved")
    .slice(0, 8)
    .map((c) => ({
      conflictId: c.conflictId,
      title: c.title,
      resolutionStrategy: c.resolutionStrategy,
      recommendedResolution: c.recommendedResolution,
      status: c.resolutionStatus,
      progress: c.resolutionStatus === "resolved" ? 100 : c.resolutionStatus === "resolving" ? 65 : 35,
      escalated: c.escalated,
    }));
}

function buildEscalations(conflicts: EnterpriseConflict[]): ConflictEscalation[] {
  return conflicts
    .filter((c) => c.escalated)
    .map((c, i) => ({
      order: i + 1,
      conflictId: c.conflictId,
      title: c.title,
      severity: c.severity,
      reason: `Requires Grand King oversight · ${c.source}`,
      owner: "Grand King",
    }));
}

function buildRecommendations(input: {
  conflicts: EnterpriseConflict[];
  escalations: ConflictEscalation[];
}): ConflictResolutionRecommendation[] {
  const top = [...input.conflicts].sort((a, b) => b.priority - a.priority)[0];
  const active = input.conflicts.filter((c) => c.resolutionStatus !== "resolved");

  return [
    {
      id: "cre-rec-1",
      title: "Apply constitutional conflict pipeline before execution impact",
      category: "conflict_framework",
      why: "No hidden conflicts · explainable resolution · business first",
      what: "Detect → Context → Evidence → Impact → Risk → Resolve → Approve → Integrate",
      how: "E2-06 Conflict Resolution Engine · VIE validation · Journey recording",
      confidencePercent: 94,
    },
    {
      id: "cre-rec-2",
      title: top ? `Resolve priority conflict: ${top.title}` : "Review active conflict register",
      category: "resolution",
      why: `${top?.severity ?? "medium"} severity · priority ${top?.priority ?? 0} · ${top?.resolutionStrategy ?? "strategy"} strategy`,
      what: top?.recommendedResolution ?? "Complete conflict analysis",
      how: "ECC coordination · Supervisor monitoring · executive approval",
      confidencePercent: top?.confidence ?? 85,
    },
    {
      id: "cre-rec-3",
      title: `${input.escalations.length} escalations require Grand King review`,
      category: "escalation",
      why: "Executive escalation for conflicts exceeding autonomous resolution authority",
      what: input.escalations.map((e) => e.title).join(" · ") || "No escalations",
      how: "Grand King review · resolution approval · decision support",
      confidencePercent: 88,
    },
    {
      id: "cre-rec-4",
      title: "Reconcile resource conflicts via E2-05 allocation rebalance",
      category: "resource_integration",
      why: "Resource conflicts resolved through constitutional allocation optimization",
      what: `${active.filter((c) => c.domain === "resource_conflicts").length} resource conflicts · rebalance capacity`,
      how: "E2-05 Resource Allocation · resource_reallocation strategy",
      confidencePercent: 90,
    },
    {
      id: "cre-rec-5",
      title: "Prepare E2-07 Executive Approval Intelligence integration",
      category: "e2_roadmap",
      why: "Approval intelligence automates Grand King review for routine resolutions",
      what: "Extend conflict engine with executive approval intelligence",
      how: "E2-07 mission · integrate with resolution_approval pipeline phase",
      confidencePercent: 86,
    },
  ];
}

function buildPillowEvaluations(input: {
  conflicts: EnterpriseConflict[];
  recommendations: ConflictResolutionRecommendation[];
  healthScore: number;
}): PillowConflictEvaluationMetric[] {
  const active = input.conflicts.filter((c) => c.resolutionStatus !== "resolved").length;
  const values: Record<string, { status: string; summary: string }> = {
    emerging_conflicts: {
      status: active >= 5 ? "elevated" : "monitored",
      summary: `${active} active conflicts · continuous detection`,
    },
    resolution_options: {
      status: "evaluated",
      summary: `${input.conflicts.length} conflicts · 10 resolution strategies available`,
    },
    strategic_trade_offs: {
      status: "documented",
      summary: "Business · strategic · financial trade-offs per conflict",
    },
    priority_conflicts: {
      status: "resolving",
      summary: `${input.conflicts.filter((c) => c.domain === "priority_conflicts").length} priority conflicts`,
    },
    resource_conflicts: {
      status: "resolving",
      summary: `${input.conflicts.filter((c) => c.domain === "resource_conflicts").length} resource conflicts`,
    },
    executive_recommendations: {
      status: input.recommendations.length >= 4 ? "strong" : "building",
      summary: `${input.recommendations.length} conflict resolution recommendations`,
    },
  };

  return PILLOW_CONFLICT_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "evaluating",
    summary: values[domain]?.summary ?? "Pillow conflict evaluation active",
  }));
}

export function assembleConflictResolutionEngine(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  decisionSimulationEngine?: DecisionSimulationEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  resourceAllocationEngine?: ResourceAllocationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): ConflictResolutionEngine {
  const activeConflicts = buildConflicts(input);
  const conflictAnalysis = buildAnalysis(activeConflicts);
  const resolutionStatus = buildResolutionStatus(activeConflicts);
  const escalations = buildEscalations(activeConflicts);
  const recommendedActions = buildRecommendations({ conflicts: activeConflicts, escalations });

  const criticalCount = activeConflicts.filter((c) => c.severity === "critical" || c.severity === "high").length;
  const unresolved = activeConflicts.filter((c) => c.resolutionStatus !== "resolved").length;

  const healthScore = Math.round(
    100 -
      unresolved * 3 -
      escalations.length * 5 +
      (input.corporateVision?.healthScore ?? 80) / 5 +
      (input.resourceAllocationEngine?.healthScore ?? 80) / 5,
  );

  const clampedHealth = Math.max(0, Math.min(100, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    conflicts: activeConflicts,
    recommendations: recommendedActions,
    healthScore: clampedHealth,
  });

  const pillowAdvisory = [
    `Engine health: ${clampedHealth}/100 (${healthLabel(clampedHealth)})`,
    `${activeConflicts.length} conflicts · ${unresolved} active · ${escalations.length} escalations`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `No competing conflict systems · one constitutional resolution authority`,
    `Grand King oversees outcomes · routine conflicts autonomously resolved`,
    `Ready for E2-07 Executive Approval Intelligence`,
  ];

  return {
    engineVersion: "E2-06",
    computedAt: new Date().toISOString(),
    engineSummary:
      "One permanent Conflict Resolution Engine — constitutional executive system detecting, analysing and resolving enterprise conflicts through evidence, strategic alignment and explainable resolution before execution impact",
    engineHealth: `${clampedHealth}/100 · ${healthLabel(clampedHealth)}`,
    conflictHealth: unresolved <= 3 ? "stable" : unresolved <= 6 ? "attention" : "elevated",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    activeConflictCount: activeConflicts.length,
    criticalConflictCount: criticalCount,
    escalationCount: escalations.length,
    activeConflicts,
    conflictAnalysis,
    resolutionStatus,
    escalations,
    conflictPipeline: buildPipeline("resolution_approval"),
    recommendedActions,
    pillowEvaluations,
    conflictPrinciples: [...CONFLICT_PRINCIPLES],
    governedDomains: [...GOVERNED_CONFLICT_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      riskAssessmentEngine: input.riskAssessmentEngine
        ? `E2-02 · ${input.riskAssessmentEngine.engineHealth}`
        : "E2-02 · standby",
      decisionSimulationEngine: input.decisionSimulationEngine
        ? `E2-03 · ${input.decisionSimulationEngine.engineHealth}`
        : "E2-03 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth}`
        : "E2-04 · standby",
      resourceAllocationEngine: input.resourceAllocationEngine
        ? `E2-05 · ${input.resourceAllocationEngine.engineHealth} · ${input.resourceAllocationEngine.bottleneckCount} bottlenecks`
        : "E2-05 · standby",
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring conflicts"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "conflict resolution coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE207: true,
  };
}

export function buildFallbackConflictResolutionEngine(): ConflictResolutionEngine {
  return assembleConflictResolutionEngine({});
}
