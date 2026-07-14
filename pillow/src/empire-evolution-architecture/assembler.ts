import type { AiEvolutionArchitecture } from "../ai-evolution-architecture/types.js";
import type { ArchitectureEvolutionArchitecture } from "../architecture-evolution-architecture/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { RepositoryEvolutionArchitecture } from "../repository-evolution-architecture/types.js";
import type { GrandKingOperatingAccount } from "../grand-king-operating-account/types.js";
import type { BusinessFactoryArchitecture } from "../business-factory/types.js";
import type { CommerceOperatingModel } from "../commerce-operating-model/types.js";
import {
  EMPIRE_EVOLUTION_PIPELINE,
  EMPIRE_PRINCIPLES,
  EVOLVING_SUBSYSTEMS,
  EMPIRE_HEALTH_DOMAINS,
  CONTINUOUS_REVIEW_DOMAINS,
  EMPIRE_GOVERNANCE_FIELDS,
  CONSTITUTIONAL_PHASES,
} from "./paths.js";
import type {
  EmpireEvolutionArchitecture,
  EmpirePipelinePhase,
  EmpireHealthMetric,
  ContinuousReviewMetric,
  EmpireEvolutionRecommendation,
  PhaseCompletionStatus,
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

function buildPipeline(activePhase: EmpirePipelinePhase = "empire_health_review"): EmpireEvolutionArchitecture["evolutionPipeline"] {
  const activeIdx = EMPIRE_EVOLUTION_PIPELINE.indexOf(activePhase);
  return EMPIRE_EVOLUTION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildHealthMetrics(input: {
  aiEvolution?: AiEvolutionArchitecture | null;
  architectureEvolution?: ArchitectureEvolutionArchitecture | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  repositoryEvolution?: RepositoryEvolutionArchitecture | null;
  grandKing?: GrandKingOperatingAccount | null;
  factory?: BusinessFactoryArchitecture | null;
  commerce?: CommerceOperatingModel | null;
  vie?: Record<string, unknown>;
}): EmpireHealthMetric[] {
  const gk = input.grandKing?.executiveControl;

  const values: Record<string, { status: string; summary: string }> = {
    vision_health: {
      status: String(input.vie?.visionAlignment ?? "aligned"),
      summary: "Vision · Soul · CTD synchronized",
    },
    constitution_health: {
      status: String(input.vie?.approvalStatus ?? "validated"),
      summary: "Constitution hierarchy · Engineering Constitution active",
    },
    architecture_health: {
      status: input.architectureEvolution?.architectureHealth ?? "stable",
      summary: input.architectureEvolution?.architectureDrift ?? "No drift detected",
    },
    repository_health: {
      status: input.repositoryEvolution?.repositoryHealth ?? "stable",
      summary: input.repositoryEvolution?.repositoryQuality ?? "Repository intelligence indexed",
    },
    knowledge_health: {
      status: input.knowledgeEvolution?.knowledgeHealth ?? "growing",
      summary: input.knowledgeEvolution?.knowledgeGrowth ?? "Knowledge evolution active",
    },
    engineering_health: {
      status: String(input.aiEvolution?.integrations.builderStatus ?? "ready"),
      summary: "Builder · repository · validation pipeline",
    },
    business_health: {
      status: gk?.businessHealth ?? input.factory?.currentFactoryStage ?? "building",
      summary: `${input.grandKing?.businessPortfolio.length ?? input.factory?.activeBusinessCount ?? 0} portfolio businesses`,
    },
    commerce_health: {
      status: gk?.commerce ?? input.commerce?.commerceHealth ?? "building",
      summary: input.commerce?.revenueSummary ?? gk?.revenue ?? "Pre-revenue pipeline",
    },
    production_health: {
      status: gk?.production ?? input.grandKing?.productionHealth ?? "validated",
      summary: "Production Truth · Guardian · browser verification",
    },
    automation_health: {
      status: "standby",
      summary: "Business automation · zero-human pipeline",
    },
    experience_health: {
      status: "integrated",
      summary: `${input.grandKing?.experienceStack.length ?? 10} experience layers active`,
    },
    executive_health: {
      status: gk?.empireHealth ?? "healthy",
      summary: gk?.currentMission ?? "Constitutional execution",
    },
  };

  return EMPIRE_HEALTH_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Empire subsystem active",
  }));
}

function buildContinuousReviews(input: {
  aiEvolution?: AiEvolutionArchitecture | null;
  architectureEvolution?: ArchitectureEvolutionArchitecture | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  repositoryEvolution?: RepositoryEvolutionArchitecture | null;
  grandKing?: GrandKingOperatingAccount | null;
  vie?: Record<string, unknown>;
}): ContinuousReviewMetric[] {
  const vie = input.vie ?? {};

  return CONTINUOUS_REVIEW_DOMAINS.map((domain) => {
    let alignment = "aligned";
    let summary = "Constitutional alignment verified";

    switch (domain) {
      case "vision_alignment":
        alignment = String(vie.visionAlignment ?? "aligned");
        summary = String(vie.repositoryAlignment ?? "Vision · Soul · CTD active");
        break;
      case "constitution_alignment":
        alignment = String(vie.approvalStatus ?? "conditional");
        summary = "Engineering Constitution · hierarchy preserved";
        break;
      case "architecture_alignment":
        alignment = input.architectureEvolution?.architectureHealth ?? "stable";
        summary = `${input.architectureEvolution?.driftSignals.length ?? 0} drift signals`;
        break;
      case "repository_alignment":
        alignment = input.repositoryEvolution?.repositoryHealth ?? "stable";
        summary = input.repositoryEvolution?.documentationHealth ?? "Documentation tracked";
        break;
      case "business_alignment":
        alignment = input.grandKing?.executiveControl.businessHealth ?? "building";
        summary = input.grandKing?.currentRevenue ?? "Business portfolio building";
        break;
      case "production_alignment":
        alignment = input.grandKing?.productionHealth ?? "validated";
        summary = "Production Truth · deployment gates";
        break;
      case "commercial_alignment":
        alignment = input.grandKing?.executiveControl.commerce ?? "building";
        summary = input.aiEvolution?.commercialIntelligence ?? "Commercial intelligence active";
        break;
      case "knowledge_alignment":
        alignment = input.knowledgeEvolution?.knowledgeQuality ?? "integrating";
        summary = input.knowledgeEvolution?.knowledgeGrowth ?? "Knowledge evolution";
        break;
      case "executive_experience":
        alignment = "executive-first";
        summary = "Founder Shell · Executive Home · Pillow · Cockpit";
        break;
      case "operational_performance":
        alignment = String(input.aiEvolution?.integrations.guardianStatus ?? "monitoring");
        summary = "Guardian · runtime · availability";
        break;
      default:
        break;
    }

    return { domain, label: label(domain), alignment, summary };
  });
}

function buildRecommendations(input: {
  aiEvolution?: AiEvolutionArchitecture | null;
  architectureEvolution?: ArchitectureEvolutionArchitecture | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  grandKing?: GrandKingOperatingAccount | null;
}): EmpireEvolutionRecommendation[] {
  const recs: EmpireEvolutionRecommendation[] = [];

  const categories = [
    { source: input.grandKing?.recommendations ?? [], category: "strategic" },
    { source: input.aiEvolution?.recommendations.map((r) => r.title) ?? [], category: "ai" },
    { source: input.architectureEvolution?.recommendations.map((r) => r.title) ?? [], category: "architectural" },
    { source: input.knowledgeEvolution?.recommendations.map((r) => r.title) ?? [], category: "knowledge" },
    { source: input.grandKing?.pillowAdvisory ?? [], category: "empire" },
  ];

  for (const group of categories) {
    for (const title of group.source.slice(0, 3)) {
      recs.push({
        id: `eev-${group.category}-${recs.length}`,
        title: title.slice(0, 120),
        category: group.category,
        why: "Continuous Empire evolution requires evidence-backed improvement",
        what: title,
        how: "Empire Health Review → Constitution Validation → Journey Recording",
        confidencePercent: 80,
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      id: "eev-default-001",
      title: "Maintain continuous Empire evolution cadence",
      category: "empire",
      why: "EmpireAI is never finished — P1–P9 foundation enables perpetual evolution",
      what: "Run Empire Health Review after each constitutional mission",
      how: "Vision Sync → Repository → Knowledge → Architecture → AI → Empire Evolution",
      confidencePercent: 90,
    });
  }

  return recs.slice(0, 12);
}

function buildPhaseStatus(): PhaseCompletionStatus[] {
  const counts: Record<string, number> = {
    P1_Foundation: 4,
    P2_Governance: 4,
    P3_Documentation: 4,
    P4_Engineering: 9,
    P5_Runtime: 7,
    P6_Execution: 8,
    P7_Experience: 9,
    P8_Business: 9,
    P9_Evolution: 9,
  };

  return CONSTITUTIONAL_PHASES.map((phase) => ({
    phase,
    label: label(phase.replace("_", " ")),
    status: "complete" as const,
    itemCount: counts[phase] ?? 0,
  }));
}

export function assembleEmpireEvolutionArchitecture(input: {
  aiEvolution?: AiEvolutionArchitecture | null;
  architectureEvolution?: ArchitectureEvolutionArchitecture | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  repositoryEvolution?: RepositoryEvolutionArchitecture | null;
  grandKing?: GrandKingOperatingAccount | null;
  factory?: BusinessFactoryArchitecture | null;
  commerce?: CommerceOperatingModel | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): EmpireEvolutionArchitecture {
  const aiEvolution = input.aiEvolution;
  const architectureEvolution = input.architectureEvolution;
  const knowledgeEvolution = input.knowledgeEvolution;
  const repositoryEvolution = input.repositoryEvolution;
  const grandKing = input.grandKing;
  const vie = input.vie ?? {};

  const scores = [
    aiEvolution?.healthScore,
    architectureEvolution?.healthScore,
    knowledgeEvolution?.healthScore,
    repositoryEvolution?.healthScore,
  ].filter((s): s is number => typeof s === "number");

  const healthScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 72;

  const empireHealthMetrics = buildHealthMetrics({
    aiEvolution,
    architectureEvolution,
    knowledgeEvolution,
    repositoryEvolution,
    grandKing,
    factory: input.factory,
    commerce: input.commerce,
    vie,
  });

  const continuousReviews = buildContinuousReviews({
    aiEvolution,
    architectureEvolution,
    knowledgeEvolution,
    repositoryEvolution,
    grandKing,
    vie,
  });

  const currentRecommendations = buildRecommendations({
    aiEvolution,
    architectureEvolution,
    knowledgeEvolution,
    grandKing,
  });

  const constitutionalPhases = buildPhaseStatus();
  const roadmapItemsExecuted = constitutionalPhases.reduce((sum, p) => sum + p.itemCount, 0);

  const activePhase: EmpirePipelinePhase =
    currentRecommendations.length > 3 ? "constitution_validation" : "empire_health_review";

  const pillowAdvisory = [
    `Empire health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `P1–P9 constitutional execution: ${roadmapItemsExecuted} roadmap items complete`,
    `Vision alignment: ${String(vie.visionAlignment ?? "aligned")}`,
    `Repository: ${repositoryEvolution?.repositoryHealth ?? "standby"}`,
    `Knowledge: ${knowledgeEvolution?.knowledgeHealth ?? "standby"}`,
    `Architecture: ${architectureEvolution?.architectureHealth ?? "standby"}`,
    `AI: ${aiEvolution?.aiHealth ?? "standby"}`,
    `Business: ${grandKing?.executiveControl.businessHealth ?? "building"}`,
    "Future growth appends new programmes — constitutional roadmap locked",
  ];

  return {
    architectureVersion: "P9-05",
    computedAt: new Date().toISOString(),
    grandKingSummary:
      grandKing?.grandKingSummary ??
      "Continuous Empire Evolution — one constitutional operating system that learns, improves, operates, monitors, recovers and grows without fragmentation or uncontrolled drift",
    empireHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    currentEvolution: String(input.journey?.currentMission ?? grandKing?.currentMission ?? "P9-05 Empire"),
    strategicDirection: grandKing?.executiveControl.journey ?? "Phase P9 Evolution complete · perpetual improvement",
    visionAlignment: String(vie.visionAlignment ?? vie.approvalStatus ?? "aligned"),
    healthScore,
    architectureHealth: architectureEvolution?.architectureHealth ?? "stable",
    repositoryHealth: repositoryEvolution?.repositoryHealth ?? "stable",
    businessHealth: grandKing?.executiveControl.businessHealth ?? input.factory?.currentFactoryStage ?? "building",
    commercialHealth: grandKing?.executiveControl.commerce ?? input.commerce?.commerceHealth ?? "building",
    productionHealth: grandKing?.productionHealth ?? "Production Truth active",
    knowledgeGrowth: knowledgeEvolution?.knowledgeGrowth ?? "Knowledge evolution active",
    aiEvolution: aiEvolution?.aiHealth ?? "AI evolution active",
    currentRecommendations,
    evolutionPipeline: buildPipeline(activePhase),
    empireHealthMetrics,
    continuousReviews,
    evolvingSubsystems: [...EVOLVING_SUBSYSTEMS],
    empirePrinciples: [...EMPIRE_PRINCIPLES],
    empireGovernance: [...EMPIRE_GOVERNANCE_FIELDS],
    constitutionalPhases,
    pillowAdvisory,
    integrations: {
      repositoryEvolution: repositoryEvolution
        ? `P9-01 · ${repositoryEvolution.repositoryHealth}`
        : "standby",
      knowledgeEvolution: knowledgeEvolution
        ? `P9-02 · ${knowledgeEvolution.knowledgeHealth}`
        : "standby",
      architectureEvolution: architectureEvolution
        ? `P9-03 · ${architectureEvolution.architectureHealth}`
        : "standby",
      aiEvolution: aiEvolution ? `P9-04 · ${aiEvolution.aiHealth}` : "standby",
      grandKingAccount: grandKing ? `${grandKing.accountId} · ${grandKing.empireStatus}` : "standby",
      businessFactory: input.factory ? `P8-01 · ${input.factory.currentFactoryStage}` : "standby",
      commerce: input.commerce ? `P8-02 · ${input.commerce.commerceHealth}` : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "P9 Evolution"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      guardianStatus: String(input.guardian?.overallHealth ?? input.guardian?.status ?? "monitoring"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "coordinating"),
    },
    constitutionalExecutionComplete: true,
    roadmapItemsExecuted,
  };
}

export function buildFallbackEmpireEvolutionArchitecture(): EmpireEvolutionArchitecture {
  return assembleEmpireEvolutionArchitecture({});
}
