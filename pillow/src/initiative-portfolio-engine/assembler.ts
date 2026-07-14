import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { ExecutiveRoadmapEngine } from "../executive-roadmap-engine/types.js";
import type { PriorityManagementEngine } from "../priority-management-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  PORTFOLIO_HIERARCHY,
  INITIATIVE_LIFECYCLE,
  PORTFOLIO_PRINCIPLES,
  GOVERNED_PORTFOLIO_DOMAINS,
  PORTFOLIO_SEGMENTS,
  PORTFOLIO_ANALYSIS_DOMAINS,
  PILLOW_PORTFOLIO_EVALUATIONS,
} from "./paths.js";
import type {
  InitiativePortfolioEngine,
  PortfolioHierarchyStep,
  InitiativeLifecycleStep,
  InitiativeLifecyclePhase,
  PortfolioInitiative,
  PortfolioSegmentSummary,
  PortfolioAnalysisMetric,
  PortfolioRecommendation,
  PillowPortfolioEvaluationMetric,
  GovernedPortfolioDomain,
  PortfolioSegment,
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

function buildHierarchy(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  journey?: Record<string, unknown>;
}): PortfolioHierarchyStep[] {
  const summaries: Record<string, string> = {
    vision: input.corporateVision?.visionWhy?.slice(0, 120) ?? "EMPIREAI_VISION.md",
    strategic_objectives:
      input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 3).join(" · ") ??
      "E1-03 measurable WHAT",
    executive_portfolio: "One unified executive initiative portfolio · E1-06",
    programmes:
      input.executiveRoadmap?.currentProgrammes.map((p) => p.title).slice(0, 3).join(" · ") ??
      "E1 Executive Programme",
    initiatives:
      input.priorityManagement?.currentPriorities.map((p) => p.title).slice(0, 3).join(" · ") ??
      "Portfolio initiatives",
    projects: String(input.journey?.currentMission ?? "Active mission"),
    missions: String(input.journey?.currentJourney ?? "Constitutional execution"),
    execution: "ECC · Supervisor · Production Truth",
  };

  return PORTFOLIO_HIERARCHY.map((layer, i) => ({
    layer,
    label: label(layer),
    order: i + 1,
    summary: summaries[layer] ?? "Portfolio hierarchy active",
  }));
}

function buildLifecycle(activePhase: InitiativeLifecyclePhase = "execution"): InitiativeLifecycleStep[] {
  const activeIdx = INITIATIVE_LIFECYCLE.indexOf(activePhase);
  return INITIATIVE_LIFECYCLE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function inferDomain(title: string): GovernedPortfolioDomain {
  const t = title.toLowerCase();
  if (t.includes("commerce") || t.includes("marketplace")) return "commerce_initiatives";
  if (t.includes("evolution") || t.includes("architecture") || t.includes("repository"))
    return "engineering_initiatives";
  if (t.includes("factory") || t.includes("business")) return "business_initiatives";
  if (t.includes("infrastructure") || t.includes("scaling")) return "infrastructure_initiatives";
  if (t.includes("governance") || t.includes("e1-")) return "governance_initiatives";
  if (t.includes("profit") || t.includes("ms-a") || t.includes("financial")) return "growth_initiatives";
  if (t.includes("executive") || t.includes("planning")) return "executive_initiatives";
  return "strategic_initiatives";
}

function buildInitiatives(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
}): PortfolioInitiative[] {
  const initiatives: PortfolioInitiative[] = [];
  const seen = new Set<string>();
  const eta = String(input.supervisor?.eta ?? "Supervisor ETA");
  const visionRef = input.corporateVision?.currentVision?.slice(0, 80) ?? "EMPIREAI_VISION.md";

  const defaults: Array<Omit<PortfolioInitiative, "initiativeId"> & { id: string }> = [
    {
      id: "ipe-e1-06",
      title: "E1-06 Initiative Portfolio Engine",
      description: "Unified executive initiative portfolio management",
      purpose: "Govern HOW all strategic initiatives are managed collectively",
      businessCase: "One portfolio · no individual initiative management",
      strategicObjective: "E1 Executive Planning",
      portfolio: "Executive Portfolio",
      owner: "Pillow · Executive",
      priority: 1,
      currentStatus: "active",
      dependencies: ["E1-05 Priority Management Engine"],
      budget: "Executive programme",
      resources: "Pillow · ECC · Supervisor",
      targetCompletion: "Current E1 milestone",
      successCriteria: ["Portfolio framework", "Analysis metrics", "Cockpit integration"],
      businessValue: "high",
      evidence: ["E1 Executive Programme", "Constitutional governance"],
      segment: "active",
      domain: "governance_initiatives",
      progressPercent: 85,
      expectedRoi: "strategic",
      risks: [],
    },
    {
      id: "ipe-e1-07",
      title: "E1-07 Department Planning Engine",
      description: "Department-level planning under executive portfolio",
      purpose: "Extend portfolio governance to departmental planning",
      businessCase: "Enterprise-wide planning coherence",
      strategicObjective: "E1 Executive Planning",
      portfolio: "Executive Portfolio",
      owner: "Pillow · Executive",
      priority: 10,
      currentStatus: "planned",
      dependencies: ["E1-06 Initiative Portfolio Engine"],
      budget: "Planned",
      resources: "Queued",
      targetCompletion: "After E1-06",
      successCriteria: ["Department framework", "Portfolio integration"],
      businessValue: "high",
      evidence: ["E1 Executive Programme"],
      segment: "future",
      domain: "executive_initiatives",
      progressPercent: 0,
      expectedRoi: "moderate",
      risks: [],
    },
  ];

  for (const d of defaults) {
    addInitiative(d);
  }

  function addInitiative(item: Omit<PortfolioInitiative, "initiativeId"> & { id: string }) {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    initiatives.push({
      initiativeId: item.id,
      title: item.title,
      description: item.description,
      purpose: item.purpose,
      businessCase: item.businessCase,
      strategicObjective: item.strategicObjective,
      portfolio: item.portfolio,
      owner: item.owner,
      priority: item.priority,
      currentStatus: item.currentStatus,
      dependencies: item.dependencies,
      budget: item.budget,
      resources: item.resources,
      targetCompletion: item.targetCompletion,
      successCriteria: item.successCriteria,
      businessValue: item.businessValue,
      evidence: item.evidence,
      segment: item.segment,
      domain: item.domain,
      progressPercent: item.progressPercent,
      expectedRoi: item.expectedRoi,
      risks: item.risks,
    });
  }

  for (const init of input.executiveArchitecture?.currentInitiatives ?? []) {
    addInitiative({
      id: `ipe-eaf-${init.id}`,
      title: init.title,
      description: init.title,
      purpose: "Executive initiative under E1-01 framework",
      businessCase: "Constitutional executive planning",
      strategicObjective: init.phase,
      portfolio: "Executive Portfolio",
      owner: "Grand King · Pillow",
      priority: initiatives.length + 1,
      currentStatus: init.status,
      dependencies: [],
      budget: "Executive programme",
      resources: "Pillow · ECC",
      targetCompletion: eta,
      successCriteria: ["Vision aligned", "Executive approval", "Evidence-backed"],
      businessValue: "high",
      evidence: ["Executive Architecture Framework"],
      segment: init.status === "complete" ? "completed" : "active",
      domain: "executive_initiatives",
      progressPercent: init.status === "complete" ? 100 : init.status === "active" ? 75 : 40,
      expectedRoi: "strategic",
      risks: [],
    });
  }

  for (const prog of input.executiveRoadmap?.currentProgrammes ?? []) {
    addInitiative({
      id: `ipe-prog-${prog.roadmapId}`,
      title: prog.title,
      description: prog.description,
      purpose: prog.purpose,
      businessCase: `${prog.overallProgress}% programme progress · ${prog.strategicAlignment} alignment`,
      strategicObjective: prog.relatedObjectives[0] ?? "E1 Executive Planning",
      portfolio: "Executive Portfolio",
      owner: prog.owner,
      priority: prog.priority,
      currentStatus: prog.currentStatus,
      dependencies: prog.dependencies,
      budget: prog.estimatedDuration,
      resources: "ECC · Builder · Supervisor",
      targetCompletion: prog.targetCompletion,
      successCriteria: prog.successCriteria,
      businessValue: prog.title.includes("Commerce") ? "high" : "medium",
      evidence: [prog.relatedVision, "Executive Roadmap"],
      segment: "active",
      domain: inferDomain(prog.title),
      progressPercent: prog.overallProgress,
      expectedRoi: prog.title.includes("Commerce") ? "high" : "moderate",
      risks: prog.risks,
    });
  }

  for (const obj of input.strategicObjectives?.currentStrategicObjectives.slice(0, 5) ?? []) {
    const segment: PortfolioSegment =
      obj.currentStatus === "complete"
        ? "completed"
        : obj.currentStatus === "planned"
          ? "planned"
          : "active";
    addInitiative({
      id: `ipe-obj-${obj.objectiveId}`,
      title: obj.title,
      description: obj.description,
      purpose: obj.purpose,
      businessCase: obj.expectedOutcome,
      strategicObjective: obj.title,
      portfolio: "Strategic Portfolio",
      owner: obj.owner,
      priority: obj.priority,
      currentStatus: obj.currentStatus,
      dependencies: obj.dependencies,
      budget: "Mission-driven",
      resources: "Pillow · Journey",
      targetCompletion: obj.targetDate,
      successCriteria: obj.successCriteria,
      businessValue: obj.businessImpact,
      evidence: obj.evidence,
      segment,
      domain: inferDomain(obj.title),
      progressPercent: obj.completionPercent,
      expectedRoi: obj.classification === "financial" ? "high" : "moderate",
      risks: obj.risks,
    });
  }

  for (const pri of input.priorityManagement?.currentPriorities.slice(0, 6) ?? []) {
    const priInitId = `ipe-pri-${pri.priorityId}`;
    if (seen.has(priInitId)) continue;
    const segment: PortfolioSegment =
      pri.level === "completed"
        ? "completed"
        : pri.level === "deferred"
          ? "deferred"
          : pri.level === "cancelled"
            ? "cancelled"
            : "active";
    addInitiative({
      id: priInitId,
      title: pri.title,
      description: pri.purpose,
      purpose: pri.purpose,
      businessCase: `Priority score ${pri.currentScore} · ${pri.urgency} urgency`,
      strategicObjective: pri.strategicImpact,
      portfolio: "Priority Portfolio",
      owner: "Pillow · Executive",
      priority: pri.recommendedOrder,
      currentStatus: pri.level,
      dependencies: pri.dependencies,
      budget: "Executive allocation",
      resources: "ECC · Supervisor",
      targetCompletion: eta,
      successCriteria: ["Priority validated", "Evidence-backed", "Executive visibility"],
      businessValue: pri.businessImpact,
      evidence: pri.supportingEvidence,
      segment,
      domain: inferDomain(pri.title),
      progressPercent: Math.min(100, pri.currentScore),
      expectedRoi: pri.financialImpact,
      risks: pri.riskLevel !== "low" ? [pri.riskLevel] : [],
    });
  }

  return initiatives.slice(0, 20);
}

function buildSegmentSummaries(initiatives: PortfolioInitiative[]): PortfolioSegmentSummary[] {
  return PORTFOLIO_SEGMENTS.map((segment) => {
    const items = initiatives.filter((i) => i.segment === segment);
    return {
      segment,
      label: label(segment),
      count: items.length,
      summary:
        items.length > 0
          ? items.map((i) => i.title).join(" · ")
          : segment === "cancelled" || segment === "historical"
            ? "Fully traceable · no active items"
            : "None scheduled",
    };
  });
}

function buildPortfolioAnalysis(initiatives: PortfolioInitiative[]): PortfolioAnalysisMetric[] {
  const active = initiatives.filter((i) => i.segment === "active");
  const avgProgress = active.length
    ? Math.round(active.reduce((s, i) => s + i.progressPercent, 0) / active.length)
    : 0;
  const riskCount = initiatives.reduce((s, i) => s + i.risks.length, 0);
  const depCount = initiatives.reduce((s, i) => s + i.dependencies.length, 0);
  const highValue = initiatives.filter((i) => i.businessValue === "high" || i.businessValue === "critical").length;
  const domains = new Set(initiatives.map((i) => i.domain));

  const values: Record<string, { value: string; status: string }> = {
    strategic_coverage: {
      value: `${domains.size}/${GOVERNED_PORTFOLIO_DOMAINS.length} domains`,
      status: domains.size >= 5 ? "broad" : "building",
    },
    business_value: {
      value: `${highValue} high-value initiatives`,
      status: highValue >= 3 ? "strong" : "moderate",
    },
    resource_allocation: {
      value: `${active.length} active · ECC coordinated`,
      status: "allocated",
    },
    dependency_health: {
      value: `${depCount} dependencies tracked`,
      status: depCount > 5 ? "review" : "healthy",
    },
    portfolio_risk: {
      value: String(riskCount),
      status: riskCount > 2 ? "attention" : "clear",
    },
    portfolio_balance: {
      value: `${Math.round((domains.size / GOVERNED_PORTFOLIO_DOMAINS.length) * 100)}% domain coverage`,
      status: "balanced",
    },
    capacity: {
      value: active.length <= 8 ? "within capacity" : "constrained",
      status: active.length <= 8 ? "available" : "attention",
    },
    expected_roi: {
      value: `${initiatives.filter((i) => i.expectedRoi === "high").length} high ROI`,
      status: "evaluating",
    },
    portfolio_progress: {
      value: `${avgProgress}%`,
      status: avgProgress >= 70 ? "on_track" : avgProgress >= 40 ? "steady" : "building",
    },
  };

  return PORTFOLIO_ANALYSIS_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    value: values[domain]?.value ?? "—",
    status: values[domain]?.status ?? "monitoring",
  }));
}

function buildRecommendations(input: {
  corporateVision?: CorporateVisionEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  initiatives: PortfolioInitiative[];
}): PortfolioRecommendation[] {
  const recs: PortfolioRecommendation[] = [];
  const top = input.initiatives.filter((i) => i.segment === "active").sort((a, b) => a.priority - b.priority)[0];

  if (top) {
    recs.push({
      id: "ipe-rec-focus",
      title: `Portfolio focus: ${top.title}`,
      category: "portfolio",
      why: `Priority ${top.priority} · ${top.progressPercent}% progress · ${top.businessValue} business value`,
      what: top.title,
      how: "ECC programme coordination · Supervisor milestone monitoring",
      confidencePercent: 88,
    });
  }

  for (const rec of input.priorityManagement?.recommendedActions.slice(0, 2) ?? []) {
    recs.push({
      id: `ipe-rec-pme-${recs.length}`,
      title: rec.title,
      category: "priority",
      why: rec.why,
      what: rec.what,
      how: rec.how,
      confidencePercent: rec.confidencePercent,
    });
  }

  for (const rec of input.corporateVision?.visionRecommendations.slice(0, 1) ?? []) {
    recs.push({
      id: `ipe-rec-vision-${recs.length}`,
      title: rec.title,
      category: "vision",
      why: rec.why,
      what: rec.what,
      how: rec.how,
      confidencePercent: rec.confidencePercent,
    });
  }

  if (recs.length < 2) {
    recs.push({
      id: "ipe-rec-default",
      title: "Proceed to E1-07 Department Planning Engine",
      category: "strategic",
      why: "Portfolio requires departmental planning extension",
      what: "Implement Department Planning Engine",
      how: "Portfolio → Department Analysis → Executive Approval",
      confidencePercent: 90,
    });
  }

  return recs.slice(0, 10);
}

function buildPillowEvaluations(input: {
  corporateVision?: CorporateVisionEngine | null;
  initiatives: PortfolioInitiative[];
  portfolioAnalysis: PortfolioAnalysisMetric[];
  recommendations: PortfolioRecommendation[];
  healthScore: number;
}): PillowPortfolioEvaluationMetric[] {
  const active = input.initiatives.filter((i) => i.segment === "active");
  const riskCount = input.initiatives.reduce((s, i) => s + i.risks.length, 0);

  const values: Record<string, { status: string; summary: string }> = {
    portfolio_health: {
      status: healthLabel(input.healthScore),
      summary: `${input.initiatives.length} initiatives · ${active.length} active · health ${input.healthScore}/100`,
    },
    portfolio_risks: {
      status: riskCount > 2 ? "attention" : "clear",
      summary: `${riskCount} portfolio risk signals · dependency health monitored`,
    },
    portfolio_opportunities: {
      status: "evaluating",
      summary: `${input.initiatives.filter((i) => i.segment === "future" || i.segment === "planned").length} planned initiatives`,
    },
    resource_balance: {
      status: active.length <= 8 ? "balanced" : "constrained",
      summary: "ECC resource allocation · capacity continuously evaluated",
    },
    initiative_quality: {
      status: "strong",
      summary: "Full initiative attributes · evidence-backed · no duplicates",
    },
    strategic_recommendations: {
      status: "active",
      summary: `${input.recommendations.length} recommendations · Vision ${String(input.corporateVision?.visionAlignment ?? "aligned")}`,
    },
  };

  return PILLOW_PORTFOLIO_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Pillow portfolio evaluation active",
  }));
}

export function assembleInitiativePortfolioEngine(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorityManagement?: PriorityManagementEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): InitiativePortfolioEngine {
  const allInitiatives = buildInitiatives(input);
  const activeInitiatives = allInitiatives.filter((i) => i.segment === "active");
  const portfolioAnalysis = buildPortfolioAnalysis(allInitiatives);
  const recommendedActions = buildRecommendations({
    corporateVision: input.corporateVision,
    priorityManagement: input.priorityManagement,
    initiatives: allInitiatives,
  });

  const overallProgress = activeInitiatives.length
    ? Math.round(activeInitiatives.reduce((s, i) => s + i.progressPercent, 0) / activeInitiatives.length)
    : 0;

  const healthScore = Math.round(
    (overallProgress +
      (input.priorityManagement?.healthScore ?? 75) +
      (input.executiveRoadmap?.healthScore ?? 75) +
      (input.strategicObjectives?.healthScore ?? 75) +
      (input.corporateVision?.healthScore ?? 80)) /
      5,
  );

  const pillowEvaluations = buildPillowEvaluations({
    corporateVision: input.corporateVision,
    initiatives: allInitiatives,
    portfolioAnalysis,
    recommendations: recommendedActions,
    healthScore,
  });

  const domains = new Set(allInitiatives.map((i) => i.domain));
  const activePhase: InitiativeLifecyclePhase = activeInitiatives.some((i) => i.currentStatus === "active")
    ? "execution"
    : "portfolio_assessment";

  const pillowAdvisory = [
    `Portfolio health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${allInitiatives.length} initiatives · ${activeInitiatives.length} active · one executive portfolio`,
    `Strategic coverage: ${domains.size}/${GOVERNED_PORTFOLIO_DOMAINS.length} governed domains`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `EAF currentInitiatives companion — no competing portfolio systems`,
    `Ready for E1-08 Executive Calendar Engine`,
  ];

  return {
    architectureVersion: "E1-06",
    computedAt: new Date().toISOString(),
    portfolioSummary:
      "One permanent Initiative Portfolio Engine — unifies every strategic initiative into a single executive portfolio enabling enterprise-wide planning, prioritization and investment under one constitutional framework",
    portfolioHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicCoverage: `${domains.size}/${GOVERNED_PORTFOLIO_DOMAINS.length} domains · ${activeInitiatives.length} active initiatives`,
    healthScore,
    overallProgress,
    activeInitiativeCount: activeInitiatives.length,
    activeInitiatives,
    portfolioHierarchy: buildHierarchy(input),
    initiativeLifecycle: buildLifecycle(activePhase),
    portfolioSegments: buildSegmentSummaries(allInitiatives),
    portfolioAnalysis,
    recommendedActions,
    pillowEvaluations,
    portfolioPrinciples: [...PORTFOLIO_PRINCIPLES],
    governedDomains: [...GOVERNED_PORTFOLIO_DOMAINS],
    pillowAdvisory,
    integrations: {
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      strategicObjectiveEngine: input.strategicObjectives
        ? `E1-03 · ${input.strategicObjectives.objectiveHealth}`
        : "standby",
      executiveRoadmapEngine: input.executiveRoadmap
        ? `E1-04 · ${input.executiveRoadmap.roadmapHealth}`
        : "standby",
      priorityManagementEngine: input.priorityManagement
        ? `E1-05 · ${input.priorityManagement.priorityHealth}`
        : "standby",
      executiveArchitecture: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "portfolio coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE107: true,
  };
}

export function buildFallbackInitiativePortfolioEngine(): InitiativePortfolioEngine {
  return assembleInitiativePortfolioEngine({});
}
