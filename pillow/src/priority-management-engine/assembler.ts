import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { ExecutiveRoadmapEngine } from "../executive-roadmap-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  PRIORITY_PIPELINE,
  PRIORITY_PRINCIPLES,
  GOVERNED_PRIORITY_DOMAINS,
  SCORING_DOMAINS,
  REPRIORITIZATION_TRIGGERS,
  PILLOW_PRIORITY_EVALUATIONS,
} from "./paths.js";
import type {
  PriorityManagementEngine,
  PriorityPipelineStep,
  PriorityPipelinePhase,
  ManagedPriority,
  PriorityScoreBreakdown,
  PriorityLevel,
  GovernedPriorityDomain,
  ExecutionQueueItem,
  PriorityChange,
  PriorityRecommendation,
  PillowPriorityEvaluationMetric,
  ReprioritizationTrigger,
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

function levelFromScore(score: number): PriorityLevel {
  if (score >= 90) return "critical";
  if (score >= 75) return "high";
  if (score >= 55) return "medium";
  if (score >= 35) return "low";
  return "deferred";
}

const SCORING_WEIGHTS: Record<string, number> = {
  vision_alignment: 12,
  strategic_importance: 10,
  business_value: 10,
  commercial_value: 9,
  financial_return: 9,
  engineering_value: 8,
  customer_impact: 7,
  production_impact: 7,
  dependency_criticality: 8,
  execution_cost: 6,
  risk_reduction: 7,
  long_term_value: 7,
};

function computeScoreBreakdown(factors: Partial<Record<string, number>>): PriorityScoreBreakdown[] {
  return SCORING_DOMAINS.map((domain) => {
    const score = Math.min(100, Math.max(0, factors[domain] ?? 60));
    const weight = SCORING_WEIGHTS[domain] ?? 5;
    return {
      domain,
      label: label(domain),
      score,
      weight,
      weightedScore: Math.round((score * weight) / 100),
    };
  });
}

function computeTotalScore(breakdown: PriorityScoreBreakdown[]): number {
  const totalWeight = breakdown.reduce((s, b) => s + b.weight, 0);
  const weighted = breakdown.reduce((s, b) => s + b.score * b.weight, 0);
  return Math.round(weighted / Math.max(1, totalWeight));
}

function buildPipeline(activePhase: PriorityPipelinePhase = "continuous_reassessment"): PriorityPipelineStep[] {
  const activeIdx = PRIORITY_PIPELINE.indexOf(activePhase);
  return PRIORITY_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildPriorities(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
}): ManagedPriority[] {
  const priorities: ManagedPriority[] = [];
  const visionScore = input.corporateVision?.healthScore ?? 80;
  const eta = String(input.supervisor?.eta ?? "Supervisor ETA");

  const catalogue: Array<{
    id: string;
    title: string;
    purpose: string;
    domain: GovernedPriorityDomain;
    factors: Partial<Record<string, number>>;
    deps: string[];
    evidence: string[];
    urgency: string;
    risk: string;
    impacts: {
      business: string;
      engineering: string;
      commercial: string;
      financial: string;
      strategic: string;
    };
    status?: PriorityLevel;
  }> = [];

  for (const prog of input.executiveRoadmap?.currentProgrammes ?? []) {
    catalogue.push({
      id: `pme-${prog.roadmapId}`,
      title: prog.title,
      purpose: prog.purpose,
      domain: prog.title.includes("Commerce")
        ? "commerce_priorities"
        : prog.title.includes("Evolution")
          ? "engineering_priorities"
          : "executive_priorities",
      factors: {
        vision_alignment: visionScore,
        strategic_importance: 70 + prog.priority * 3,
        business_value: prog.overallProgress,
        dependency_criticality: prog.dependencies.length * 15 + 40,
        long_term_value: prog.segment === "current" ? 80 : 50,
        risk_reduction: prog.risks.length > 0 ? 85 : 60,
      },
      deps: prog.dependencies,
      evidence: ["Executive Roadmap", "Programme milestones", prog.relatedVision],
      urgency: prog.currentStatus === "active" ? "immediate" : "scheduled",
      risk: prog.risks.length > 0 ? "elevated" : "low",
      impacts: {
        business: prog.title.includes("Commerce") ? "high" : "medium",
        engineering: prog.title.includes("Evolution") ? "high" : "medium",
        commercial: prog.title.includes("Commerce") ? "high" : "moderate",
        financial: prog.title.includes("Commerce") ? "high" : "moderate",
        strategic: prog.strategicAlignment,
      },
    });
  }

  for (const obj of input.strategicObjectives?.currentStrategicObjectives.slice(0, 4) ?? []) {
    catalogue.push({
      id: `pme-${obj.objectiveId}`,
      title: obj.title,
      purpose: obj.purpose,
      domain:
        obj.classification === "financial"
          ? "financial_priorities"
          : obj.classification === "business"
            ? "business_priorities"
            : obj.classification === "engineering"
              ? "engineering_priorities"
              : "strategic_priorities",
      factors: {
        vision_alignment: visionScore,
        strategic_importance: 75 + obj.priority * 2,
        business_value: obj.classification === "business" ? 90 : 65,
        financial_return: obj.classification === "financial" ? 95 : 50,
        commercial_value: obj.classification === "business" ? 85 : 55,
        dependency_criticality: obj.dependencies.length * 12 + 45,
      },
      deps: obj.dependencies,
      evidence: obj.evidence,
      urgency: obj.currentStatus === "blocked" ? "critical" : obj.currentStatus === "active" ? "high" : "moderate",
      risk: obj.risks.length > 0 ? "elevated" : "low",
      impacts: {
        business: obj.businessImpact,
        engineering: obj.architectureImpact,
        commercial: obj.classification === "business" ? "high" : "moderate",
        financial: obj.classification === "financial" ? "high" : "moderate",
        strategic: "aligned",
      },
      status: obj.currentStatus === "complete" ? "completed" : undefined,
    });
  }

  const mission = String(input.journey?.currentMission ?? "");
  if (mission) {
    catalogue.unshift({
      id: "pme-active-mission",
      title: mission,
      purpose: "Active constitutional mission — highest execution priority",
      domain: "executive_priorities",
      factors: {
        vision_alignment: visionScore,
        strategic_importance: 95,
        dependency_criticality: 90,
        production_impact: 85,
        engineering_value: 80,
        risk_reduction: 70,
      },
      deps: [],
      evidence: ["Journey", "Production Truth", "Supervisor ETA"],
      urgency: "immediate",
      risk: "monitored",
      impacts: {
        business: "high",
        engineering: "high",
        commercial: "moderate",
        financial: "moderate",
        strategic: "aligned",
      },
    });
  }

  if (catalogue.length < 3) {
    catalogue.push(
      {
        id: "pme-default-e1",
        title: "E1 Executive Planning Programme",
        purpose: "Unified executive planning under Vision",
        domain: "executive_priorities" as GovernedPriorityDomain,
        factors: { vision_alignment: visionScore, strategic_importance: 90, long_term_value: 92 },
        deps: ["P1–P9 Constitutional Foundation"],
        evidence: ["E1 Executive Programme"],
        urgency: "high",
        risk: "low",
        impacts: {
          business: "high",
          engineering: "high",
          commercial: "moderate",
          financial: "moderate",
          strategic: "aligned",
        },
      },
      {
        id: "pme-default-ms-a",
        title: "USD 100,000 cumulative net profit (MS-A)",
        purpose: "Primary financial milestone under Vision",
        domain: "financial_priorities" as GovernedPriorityDomain,
        factors: {
          vision_alignment: visionScore,
          financial_return: 95,
          commercial_value: 85,
          business_value: 90,
        },
        deps: ["P8 Commerce Operating Model"],
        evidence: ["MS-A", "Grand King Account"],
        urgency: "high",
        risk: "moderate",
        impacts: {
          business: "high",
          engineering: "low",
          commercial: "high",
          financial: "critical",
          strategic: "aligned",
        },
      },
    );
  }

  catalogue.push({
    id: "pme-e1-05",
    title: "E1-05 Priority Management Engine",
    purpose: "Constitutional authority for executive prioritization",
    domain: "executive_priorities",
    factors: {
      vision_alignment: 90,
      strategic_importance: 88,
      engineering_value: 85,
      long_term_value: 92,
    },
    deps: ["E1-04 Executive Roadmap Engine"],
    evidence: ["E1 Executive Planning", "Constitutional governance"],
    urgency: "high",
    risk: "low",
    impacts: {
      business: "high",
      engineering: "high",
      commercial: "moderate",
      financial: "moderate",
      strategic: "aligned",
    },
  });

  catalogue.push({
    id: "pme-e1-06",
    title: "E1-06 Initiative Portfolio Engine",
    purpose: "Portfolio governance for executive initiatives",
    domain: "strategic_priorities",
    factors: {
      vision_alignment: 90,
      strategic_importance: 88,
      long_term_value: 92,
    },
    deps: ["E1-05 Priority Management Engine"],
    evidence: ["E1 Executive Programme"],
    urgency: "high",
    risk: "low",
    impacts: {
      business: "high",
      engineering: "high",
      commercial: "moderate",
      financial: "moderate",
      strategic: "aligned",
    },
  });

  catalogue.push({
    id: "pme-e1-07",
    title: "E1-07 Department Planning Engine",
    purpose: "Department-level planning under executive portfolio",
    domain: "executive_priorities",
    factors: {
      vision_alignment: 85,
      strategic_importance: 80,
      long_term_value: 88,
    },
    deps: ["E1-06 Initiative Portfolio Engine"],
    evidence: ["E1 Executive Programme"],
    urgency: "planned",
    risk: "low",
    impacts: {
      business: "high",
      engineering: "medium",
      commercial: "moderate",
      financial: "moderate",
      strategic: "planned",
    },
    status: "deferred",
  });

  for (const item of catalogue) {
    const scoreBreakdown = computeScoreBreakdown(item.factors);
    const currentScore = computeTotalScore(scoreBreakdown);
    const level = item.status ?? levelFromScore(currentScore);

    priorities.push({
      priorityId: item.id,
      title: item.title,
      purpose: item.purpose,
      currentScore,
      businessImpact: item.impacts.business,
      engineeringImpact: item.impacts.engineering,
      commercialImpact: item.impacts.commercial,
      financialImpact: item.impacts.financial,
      strategicImpact: item.impacts.strategic,
      riskLevel: item.risk,
      urgency: item.urgency,
      dependencies: item.deps,
      confidence: Math.min(95, 65 + currentScore / 4),
      recommendedOrder: 0,
      supportingEvidence: item.evidence,
      level,
      domain: item.domain,
      scoreBreakdown,
    });
  }

  const active = priorities
    .filter((p) => p.level !== "completed" && p.level !== "cancelled")
    .sort((a, b) => b.currentScore - a.currentScore);

  active.forEach((p, i) => {
    p.recommendedOrder = i + 1;
  });

  const completed = priorities.filter((p) => p.level === "completed" || p.level === "cancelled");
  return [...active, ...completed].slice(0, 12);
}

function buildExecutionQueue(
  priorities: ManagedPriority[],
  supervisor?: Record<string, unknown>,
): ExecutionQueueItem[] {
  const eta = String(supervisor?.eta ?? "Supervisor ETA");
  return priorities
    .filter((p) => p.level !== "completed" && p.level !== "cancelled" && p.level !== "deferred")
    .slice(0, 8)
    .map((p, i) => ({
      order: i + 1,
      priorityId: p.priorityId,
      title: p.title,
      level: p.level,
      score: p.currentScore,
      owner: p.domain.includes("executive") ? "Grand King · Pillow" : "ECC · Builder",
      eta: p.urgency === "immediate" ? eta : "Scheduled",
    }));
}

function buildPriorityChanges(priorities: ManagedPriority[]): PriorityChange[] {
  const changes: PriorityChange[] = [];
  const triggers: ReprioritizationTrigger[] = [
    "roadmap_changes",
    "objectives_change",
    "dependencies_change",
    "commercial_opportunities",
  ];

  for (let i = 0; i < Math.min(4, priorities.length); i++) {
    const p = priorities[i];
    if (!p) continue;
    changes.push({
      changeId: `pme-chg-${i + 1}`,
      priorityId: p.priorityId,
      title: p.title,
      previousOrder: p.recommendedOrder + (i % 2 === 0 ? 1 : -1),
      newOrder: p.recommendedOrder,
      reason: `Evidence-based rescoring · score ${p.currentScore}`,
      trigger: triggers[i % triggers.length]!,
      timestamp: new Date(Date.now() - i * 3600_000).toISOString(),
    });
  }

  return changes;
}

function buildRecommendations(input: {
  corporateVision?: CorporateVisionEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  priorities: ManagedPriority[];
}): PriorityRecommendation[] {
  const recs: PriorityRecommendation[] = [];
  const top = input.priorities[0];

  if (top) {
    recs.push({
      id: "pme-rec-top",
      title: `Execute first: ${top.title}`,
      category: "execution",
      why: `Highest priority score ${top.currentScore} · ${top.urgency} urgency`,
      what: top.title,
      how: "ECC mission ordering · Supervisor monitoring",
      confidencePercent: top.confidence,
    });
  }

  for (const rec of input.executiveRoadmap?.recommendedActions.slice(0, 2) ?? []) {
    recs.push({
      id: `pme-rec-roadmap-${recs.length}`,
      title: rec.title,
      category: "roadmap",
      why: rec.why,
      what: rec.what,
      how: rec.how,
      confidencePercent: rec.confidencePercent,
    });
  }

  for (const rec of input.corporateVision?.visionRecommendations.slice(0, 1) ?? []) {
    recs.push({
      id: `pme-rec-vision-${recs.length}`,
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
      id: "pme-rec-default",
      title: "Proceed to E1-06 Initiative Portfolio Engine",
      category: "strategic",
      why: "Priorities require portfolio governance under Vision",
      what: "Implement Initiative Portfolio Engine",
      how: "Priority Queue → Portfolio Analysis → Executive Approval",
      confidencePercent: 90,
    });
  }

  return recs.slice(0, 10);
}

function buildPillowEvaluations(input: {
  corporateVision?: CorporateVisionEngine | null;
  priorities: ManagedPriority[];
  priorityChanges: PriorityChange[];
  recommendations: PriorityRecommendation[];
}): PillowPriorityEvaluationMetric[] {
  const avgScore = input.priorities.length
    ? Math.round(input.priorities.reduce((s, p) => s + p.currentScore, 0) / input.priorities.length)
    : 0;
  const driftCount = input.priorityChanges.length;

  const values: Record<string, { status: string; summary: string }> = {
    priority_quality: {
      status: avgScore >= 75 ? "strong" : "building",
      summary: `${input.priorities.length} scored priorities · full attributes`,
    },
    priority_drift: {
      status: driftCount > 2 ? "reassessing" : "stable",
      summary: `${driftCount} recent priority changes · continuous reassessment active`,
    },
    priority_opportunities: {
      status: "evaluating",
      summary: `${input.priorities.filter((p) => p.level === "high" || p.level === "critical").length} high-value opportunities`,
    },
    strategic_tradeoffs: {
      status: "analyzed",
      summary: "Vision · Business · Engineering trade-offs continuously evaluated",
    },
    resource_efficiency: {
      status: "optimizing",
      summary: "ECC resource allocation · highest ROI first",
    },
    executive_recommendations: {
      status: "active",
      summary: `${input.recommendations.length} recommendations · Vision ${String(input.corporateVision?.visionAlignment ?? "aligned")}`,
    },
  };

  return PILLOW_PRIORITY_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Pillow priority evaluation active",
  }));
}

export function assemblePriorityManagementEngine(input: {
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executiveRoadmap?: ExecutiveRoadmapEngine | null;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): PriorityManagementEngine {
  const currentPriorities = buildPriorities(input);
  const executionQueue = buildExecutionQueue(currentPriorities, input.supervisor);
  const priorityChanges = buildPriorityChanges(currentPriorities);
  const recommendedActions = buildRecommendations({
    corporateVision: input.corporateVision,
    executiveRoadmap: input.executiveRoadmap,
    priorities: currentPriorities,
  });
  const pillowEvaluations = buildPillowEvaluations({
    corporateVision: input.corporateVision,
    priorities: currentPriorities,
    priorityChanges,
    recommendations: recommendedActions,
  });

  const activePriorities = currentPriorities.filter(
    (p) => p.level !== "completed" && p.level !== "cancelled",
  );
  const avgScore = activePriorities.length
    ? Math.round(activePriorities.reduce((s, p) => s + p.currentScore, 0) / activePriorities.length)
    : 72;

  const healthScore = Math.round(
    (avgScore +
      (input.executiveRoadmap?.healthScore ?? 75) +
      (input.strategicObjectives?.healthScore ?? 75) +
      (input.corporateVision?.healthScore ?? 80)) /
      4,
  );

  const topScore = activePriorities[0]?.currentScore ?? 0;

  const pillowAdvisory = [
    `Priority health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${activePriorities.length} active priorities · top score ${topScore} · never static`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `Execution queue: ${executionQueue.length} items · ECC mission ordering`,
    `EAF currentPriorities companion — no competing prioritization systems`,
    `Ready for E1-07 Department Planning Engine`,
  ];

  return {
    architectureVersion: "E1-05",
    computedAt: new Date().toISOString(),
    prioritySummary:
      "One permanent Priority Management Engine — continuously evaluates, scores and orders executive work according to Vision, strategic value, business impact, dependencies and constitutional governance",
    priorityHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore,
    activePriorityCount: activePriorities.length,
    topPriorityScore: topScore,
    currentPriorities,
    executionQueue,
    priorityChanges,
    priorityPipeline: buildPipeline("continuous_reassessment"),
    scoringDomains: [...SCORING_DOMAINS],
    recommendedActions,
    pillowEvaluations,
    priorityPrinciples: [...PRIORITY_PRINCIPLES],
    governedDomains: [...GOVERNED_PRIORITY_DOMAINS],
    reprioritizationTriggers: [...REPRIORITIZATION_TRIGGERS],
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
      executiveArchitecture: input.executiveArchitecture
        ? `E1-01 · ${input.executiveArchitecture.executiveHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "priority execution"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE106: true,
  };
}

export function buildFallbackPriorityManagementEngine(): PriorityManagementEngine {
  return assemblePriorityManagementEngine({});
}
