import type { EmpireEvolutionArchitecture } from "../empire-evolution-architecture/types.js";
import type { GrandKingOperatingAccount } from "../grand-king-operating-account/types.js";
import type { BusinessFactoryArchitecture } from "../business-factory/types.js";
import type { CommerceOperatingModel } from "../commerce-operating-model/types.js";
import {
  EXECUTIVE_PLANNING_PIPELINE,
  EXECUTIVE_LAYERS,
  EXECUTIVE_PRINCIPLES,
  EXECUTIVE_GOVERNED_DOMAINS,
  EXECUTIVE_RESPONSIBILITIES,
  EXECUTIVE_OWNERSHIP,
  PILLOW_EXECUTIVE_EVALUATIONS,
} from "./paths.js";
import type {
  ExecutiveArchitectureFramework,
  ExecutivePlanningPhase,
  ExecutivePlanningStep,
  ExecutiveLayerStep,
  ExecutiveObjective,
  ExecutivePriority,
  ExecutiveInitiative,
  ExecutiveRisk,
  ExecutiveOpportunity,
  ExecutiveArchitectureRecommendation,
  ExecutiveEvaluationMetric,
  ExecutiveOwnershipEntry,
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

function buildPipeline(
  activePhase: ExecutivePlanningPhase = "executive_context_synchronization",
): ExecutivePlanningStep[] {
  const activeIdx = EXECUTIVE_PLANNING_PIPELINE.indexOf(activePhase);
  return EXECUTIVE_PLANNING_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildExecutiveLayers(input: {
  grandKing?: GrandKingOperatingAccount | null;
  journey?: Record<string, unknown>;
  factory?: BusinessFactoryArchitecture | null;
  empireEvolution?: EmpireEvolutionArchitecture | null;
}): ExecutiveLayerStep[] {
  const summaries: Record<string, { owner: string; summary: string }> = {
    grand_king: {
      owner: "Grand King",
      summary: input.grandKing?.grandKingSummary?.slice(0, 120) ?? "Vision · Purpose · Direction",
    },
    pillow_executive_intelligence: {
      owner: "Pillow",
      summary: "Plans · coordinates · advises · evaluates · improves",
    },
    executive_planning: {
      owner: "Pillow",
      summary: "E1 Executive Programme · unified planning governance",
    },
    executive_decisions: {
      owner: "Grand King · Pillow",
      summary: "Evidence-backed executive approval before execution",
    },
    business_factory: {
      owner: "Business Factory",
      summary: input.factory?.currentFactoryStage ?? "Manufacture · launch · grow businesses",
    },
    execution: {
      owner: "ECC",
      summary: String(input.journey?.currentMission ?? "Constitutional execution"),
    },
    production: {
      owner: "Guardian · Production Truth",
      summary: input.grandKing?.productionHealth ?? "Production Truth · browser verification",
    },
    continuous_evolution: {
      owner: "Empire Evolution",
      summary: input.empireEvolution?.currentEvolution ?? "P1–P9 foundation · perpetual improvement",
    },
  };

  return EXECUTIVE_LAYERS.map((layer, i) => ({
    layer,
    label: label(layer),
    order: i + 1,
    owner: summaries[layer]?.owner ?? "Empire",
    summary: summaries[layer]?.summary ?? "Executive layer active",
  }));
}

function buildObjectives(input: {
  journey?: Record<string, unknown>;
  grandKing?: GrandKingOperatingAccount | null;
  empireEvolution?: EmpireEvolutionArchitecture | null;
}): ExecutiveObjective[] {
  const objectives: ExecutiveObjective[] = [
    {
      id: "eaf-obj-001",
      title: "Establish Executive Architecture Framework (E1-01)",
      status: "active",
      alignment: "E1 Executive Planning",
    },
    {
      id: "eaf-obj-002",
      title: String(input.journey?.currentMission ?? input.grandKing?.currentMission ?? "E1 Executive Programme"),
      status: "in_progress",
      alignment: String(input.empireEvolution?.visionAlignment ?? "constitutional"),
    },
    {
      id: "eaf-obj-003",
      title: "Corporate Vision Engine (E1-02)",
      status: "queued",
      alignment: "Executive Vision · Strategy",
    },
  ];
  return objectives;
}

function buildPriorities(input: {
  grandKing?: GrandKingOperatingAccount | null;
}): ExecutivePriority[] {
  const recs = input.grandKing?.recommendations ?? [];
  const priorities: ExecutivePriority[] = [
    { id: "eaf-pri-001", title: "One Executive Truth — no competing frameworks", rank: 1, status: "active" },
    { id: "eaf-pri-002", title: "Constitution First — preserve P1–P9 foundation", rank: 2, status: "active" },
    { id: "eaf-pri-003", title: "Executive Planning Pipeline governance", rank: 3, status: "active" },
  ];
  for (const [i, rec] of recs.slice(0, 2).entries()) {
    priorities.push({
      id: `eaf-pri-gk-${i}`,
      title: rec.slice(0, 100),
      rank: priorities.length + 1,
      status: "monitoring",
    });
  }
  return priorities.slice(0, 6);
}

function buildInitiatives(input: {
  empireEvolution?: EmpireEvolutionArchitecture | null;
  factory?: BusinessFactoryArchitecture | null;
}): ExecutiveInitiative[] {
  return [
    {
      id: "eaf-init-001",
      title: "E1 Executive Architecture Framework",
      phase: "E1 Executive Planning",
      status: "active",
    },
    {
      id: "eaf-init-002",
      title: "Constitutional Execution P1–P9",
      phase: "P9 Evolution",
      status: input.empireEvolution?.constitutionalExecutionComplete ? "complete" : "in_progress",
    },
    {
      id: "eaf-init-003",
      title: "Business Factory Operations",
      phase: "P8 Business",
      status: input.factory?.currentFactoryStage ?? "building",
    },
    {
      id: "eaf-init-004",
      title: "E1-02 Corporate Vision Engine",
      phase: "E1 Executive Planning",
      status: "planned",
    },
  ];
}

function buildRisks(input: {
  empireEvolution?: EmpireEvolutionArchitecture | null;
  guardian?: Record<string, unknown>;
}): ExecutiveRisk[] {
  const risks: ExecutiveRisk[] = [
    {
      id: "eaf-risk-001",
      title: "Strategic drift without continuous executive review",
      severity: "medium",
      mitigation: "Continuous Executive Review · One Executive Truth",
    },
    {
      id: "eaf-risk-002",
      title: "Competing executive frameworks",
      severity: "high",
      mitigation: "PILLOW-EAF-001 canonical assembler · no duplicate truth",
    },
  ];

  const driftCount = input.empireEvolution?.continuousReviews.filter(
    (r) => r.alignment !== "aligned" && r.alignment !== "stable",
  ).length;
  if (driftCount && driftCount > 0) {
    risks.push({
      id: "eaf-risk-drift",
      title: `${driftCount} alignment signals require executive attention`,
      severity: "medium",
      mitigation: "Executive Planning Pipeline · Constitution Validation",
    });
  }

  const guardianHealth = String(input.guardian?.overallHealth ?? input.guardian?.status ?? "monitoring");
  if (guardianHealth === "critical" || guardianHealth === "attention") {
    risks.push({
      id: "eaf-risk-guardian",
      title: "Production health requires executive oversight",
      severity: guardianHealth,
      mitigation: "Guardian Centre · Production Truth · Executive Review",
    });
  }

  return risks.slice(0, 8);
}

function buildOpportunities(input: {
  grandKing?: GrandKingOperatingAccount | null;
  empireEvolution?: EmpireEvolutionArchitecture | null;
}): ExecutiveOpportunity[] {
  const opps: ExecutiveOpportunity[] = [
    {
      id: "eaf-opp-001",
      title: "E1 Executive Programme — govern all strategic planning",
      impact: "high",
      confidencePercent: 92,
    },
    {
      id: "eaf-opp-002",
      title: "P1–P9 constitutional foundation enables executive intelligence",
      impact: "high",
      confidencePercent: 95,
    },
  ];

  for (const rec of (input.grandKing?.recommendations ?? []).slice(0, 3)) {
    opps.push({
      id: `eaf-opp-gk-${opps.length}`,
      title: rec.slice(0, 120),
      impact: "medium",
      confidencePercent: 80,
    });
  }

  for (const rec of (input.empireEvolution?.currentRecommendations ?? []).slice(0, 2)) {
    opps.push({
      id: `eaf-opp-eev-${opps.length}`,
      title: rec.title.slice(0, 120),
      impact: rec.category,
      confidencePercent: rec.confidencePercent,
    });
  }

  return opps.slice(0, 10);
}

function buildRecommendations(input: {
  grandKing?: GrandKingOperatingAccount | null;
  empireEvolution?: EmpireEvolutionArchitecture | null;
}): ExecutiveArchitectureRecommendation[] {
  const recs: ExecutiveArchitectureRecommendation[] = [];

  const sources = [
    { items: input.grandKing?.pillowAdvisory ?? [], category: "executive" },
    { items: input.grandKing?.recommendations ?? [], category: "strategic" },
    {
      items: input.empireEvolution?.currentRecommendations.map((r) => r.title) ?? [],
      category: "empire",
    },
  ];

  for (const group of sources) {
    for (const title of group.items.slice(0, 3)) {
      recs.push({
        id: `eaf-rec-${group.category}-${recs.length}`,
        title: title.slice(0, 120),
        category: group.category,
        why: "Executive Architecture requires evidence-backed recommendations",
        what: title,
        how: "Vision Sync → Strategic Analysis → Executive Approval → Execution",
        confidencePercent: 85,
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      id: "eaf-rec-default",
      title: "Proceed to E1-02 Corporate Vision Engine",
      category: "executive",
      why: "E1-01 establishes the executive operating model",
      what: "Implement Corporate Vision Engine under Executive Architecture",
      how: "Executive Planning Pipeline → Vision Synchronization → Strategic Analysis",
      confidencePercent: 90,
    });
  }

  return recs.slice(0, 12);
}

function buildPillowEvaluations(input: {
  empireEvolution?: EmpireEvolutionArchitecture | null;
  vie?: Record<string, unknown>;
  grandKing?: GrandKingOperatingAccount | null;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
}): ExecutiveEvaluationMetric[] {
  const vie = input.vie ?? {};
  const gk = input.grandKing?.executiveControl;

  const values: Record<string, { status: string; summary: string }> = {
    strategic_alignment: {
      status: String(vie.visionAlignment ?? input.empireEvolution?.visionAlignment ?? "aligned"),
      summary: "Vision · Soul · CTD · Constitution hierarchy synchronized",
    },
    executive_opportunities: {
      status: "evaluating",
      summary: `${buildOpportunities({ grandKing: input.grandKing, empireEvolution: input.empireEvolution }).length} opportunities identified`,
    },
    executive_risks: {
      status: buildRisks({ empireEvolution: input.empireEvolution, guardian: input.guardian }).length > 2
        ? "attention"
        : "monitored",
      summary: "Strategic drift · competing frameworks · production health",
    },
    cross_system_dependencies: {
      status: "coordinated",
      summary: "P1–P9 · Factory · Commerce · ECC · Supervisor · Guardian integrated",
    },
    enterprise_readiness: {
      status: input.empireEvolution?.constitutionalExecutionComplete ? "ready" : "building",
      summary: `${input.empireEvolution?.roadmapItemsExecuted ?? 63} constitutional items · executive layer active`,
    },
    executive_recommendations: {
      status: "active",
      summary: `${buildRecommendations({ grandKing: input.grandKing, empireEvolution: input.empireEvolution }).length} recommendations queued`,
    },
  };

  return PILLOW_EXECUTIVE_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Pillow executive evaluation active",
  }));
}

function buildOwnership(): ExecutiveOwnershipEntry[] {
  const roles: Record<string, { label: string; responsibilities: string[] }> = {
    grand_king: {
      label: "Grand King",
      responsibilities: ["Defines Vision", "Defines Purpose", "Defines Direction"],
    },
    pillow: {
      label: "Pillow",
      responsibilities: ["Plans", "Coordinates", "Advises", "Evaluates", "Improves"],
    },
    ecc: {
      label: "ECC",
      responsibilities: ["Executes"],
    },
    supervisor: {
      label: "Supervisor",
      responsibilities: ["Observes"],
    },
    guardian: {
      label: "Guardian",
      responsibilities: ["Protects"],
    },
    builder: {
      label: "Builder",
      responsibilities: ["Builds"],
    },
  };

  return EXECUTIVE_OWNERSHIP.map((role) => ({
    role,
    label: roles[role]?.label ?? label(role),
    responsibilities: roles[role]?.responsibilities ?? [],
  }));
}

export function assembleExecutiveArchitectureFramework(input: {
  empireEvolution?: EmpireEvolutionArchitecture | null;
  grandKing?: GrandKingOperatingAccount | null;
  factory?: BusinessFactoryArchitecture | null;
  commerce?: CommerceOperatingModel | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  builder?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): ExecutiveArchitectureFramework {
  const empireEvolution = input.empireEvolution;
  const grandKing = input.grandKing;
  const vie = input.vie ?? {};
  const healthScore = empireEvolution?.healthScore ?? 72;

  const activePhase: ExecutivePlanningPhase =
    empireEvolution?.constitutionalExecutionComplete
      ? "strategic_analysis"
      : "executive_context_synchronization";

  const planningPipeline = buildPipeline(activePhase);
  const activeStep = planningPipeline.find((s) => s.status === "active");
  const planningStatus = activeStep
    ? `${activeStep.label} · ${planningPipeline.filter((s) => s.status === "complete").length}/${planningPipeline.length} phases`
    : "Executive Planning active";

  const currentObjectives = buildObjectives({ journey: input.journey, grandKing, empireEvolution });
  const currentPriorities = buildPriorities({ grandKing });
  const currentInitiatives = buildInitiatives({ empireEvolution, factory: input.factory });
  const executiveRisks = buildRisks({ empireEvolution, guardian: input.guardian });
  const executiveOpportunities = buildOpportunities({ grandKing, empireEvolution });
  const executiveRecommendations = buildRecommendations({ grandKing, empireEvolution });
  const pillowEvaluations = buildPillowEvaluations({
    empireEvolution,
    vie,
    grandKing,
    supervisor: input.supervisor,
    guardian: input.guardian,
  });

  const pillowAdvisory = [
    `Executive health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `Planning status: ${planningStatus}`,
    `Constitutional foundation: ${empireEvolution?.constitutionalExecutionComplete ? "P1–P9 complete" : "in progress"}`,
    `Vision alignment: ${String(vie.visionAlignment ?? empireEvolution?.visionAlignment ?? "aligned")}`,
    `Strategic direction: ${grandKing?.executiveControl.journey ?? empireEvolution?.strategicDirection ?? "E1 Executive Programme"}`,
    `One Executive Truth — PILLOW-EAF-001 canonical framework`,
    `Ready for E1-02 Corporate Vision Engine upon Grand King acceptance`,
  ];

  return {
    architectureVersion: "E1-01",
    computedAt: new Date().toISOString(),
    executiveSummary:
      "One permanent Executive Architecture Framework governing executive planning, strategy, priorities, decisions, portfolio, risk, reviews and growth — constitutional executive layer above P1–P9 without competing frameworks",
    executiveHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    strategicDirection:
      grandKing?.executiveControl.journey ??
      empireEvolution?.strategicDirection ??
      "E1 Executive Programme · Corporate Vision Engine next",
    planningStatus,
    healthScore,
    visionAlignment: String(vie.visionAlignment ?? empireEvolution?.visionAlignment ?? "aligned"),
    constitutionStatus: String(vie.approvalStatus ?? "validated · P1–P9 foundation preserved"),
    currentObjectives,
    currentPriorities,
    currentInitiatives,
    executiveRisks,
    executiveOpportunities,
    executiveRecommendations,
    planningPipeline,
    executiveLayers: buildExecutiveLayers({
      grandKing,
      journey: input.journey,
      factory: input.factory,
      empireEvolution,
    }),
    executivePrinciples: [...EXECUTIVE_PRINCIPLES],
    governedDomains: [...EXECUTIVE_GOVERNED_DOMAINS],
    executiveResponsibilities: [...EXECUTIVE_RESPONSIBILITIES],
    executiveOwnership: buildOwnership(),
    pillowEvaluations,
    pillowAdvisory,
    integrations: {
      empireEvolution: empireEvolution
        ? `P9-05 · ${empireEvolution.empireHealth}`
        : "standby",
      grandKingAccount: grandKing ? `${grandKing.accountId} · ${grandKing.empireStatus}` : "standby",
      visionIntegrity: String(vie.visionAlignment ?? vie.approvalStatus ?? "aligned"),
      businessFactory: input.factory ? `P8-01 · ${input.factory.currentFactoryStage}` : "standby",
      commerce: input.commerce ? `P8-02 · ${input.commerce.commerceHealth}` : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      guardianStatus: String(input.guardian?.overallHealth ?? input.guardian?.status ?? "monitoring"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "coordinating"),
      builderStatus: String(input.builder?.status ?? input.builder?.mode ?? "ready"),
    },
    constitutionalFoundationComplete: empireEvolution?.constitutionalExecutionComplete ?? true,
    readyForE102: true,
  };
}

export function buildFallbackExecutiveArchitectureFramework(): ExecutiveArchitectureFramework {
  return assembleExecutiveArchitectureFramework({});
}
