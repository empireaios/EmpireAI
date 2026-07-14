import type { RepositoryEvolutionArchitecture } from "../repository-evolution-architecture/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { RepositoryArchitectureCockpitSnapshot } from "../repository-intelligence/types.js";
import type { RepositoryHealthReport } from "../intelligence/types.js";
import {
  ARCHITECTURE_EVOLUTION_PIPELINE,
  ARCHITECTURE_PRINCIPLES,
  GOVERNED_DOMAINS,
  ARCHITECTURE_HEALTH_EVALUATIONS,
  ARCHITECTURE_REVIEW_DOMAINS,
  ARCHITECTURE_GOVERNANCE_FIELDS,
} from "./paths.js";
import type {
  ArchitectureEvolutionArchitecture,
  ArchitecturePipelinePhase,
  ArchitectureImprovement,
  ArchitectureReviewSummary,
  ArchitectureEvolutionRecommendation,
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
  activePhase: ArchitecturePipelinePhase = "architecture_health_review",
): ArchitectureEvolutionArchitecture["evolutionPipeline"] {
  const activeIdx = ARCHITECTURE_EVOLUTION_PIPELINE.indexOf(activePhase);
  return ARCHITECTURE_EVOLUTION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildReviews(input: {
  repositoryEvolution?: RepositoryEvolutionArchitecture | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  vie?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  commercialIntelligence?: Record<string, unknown>;
}): ArchitectureReviewSummary[] {
  const repo = input.repositoryEvolution;
  const knowledge = input.knowledgeEvolution;

  return ARCHITECTURE_REVIEW_DOMAINS.map((domain) => {
    let status = "stable";
    let summary = "Canonical architecture active";

    switch (domain) {
      case "canonical_architecture":
        status = repo?.architectureHealth.includes("hotspot") ? "review" : "aligned";
        summary = repo?.repositoryQuality ?? "Repository intelligence indexed";
        break;
      case "runtime_architecture":
        status = String(input.guardian?.overallHealth ?? "healthy");
        summary = `Guardian: ${String(input.guardian?.status ?? "monitoring runtime")}`;
        break;
      case "production_architecture":
        summary = "Production Truth · Browser verification · deployment gates";
        break;
      case "business_architecture":
        summary = `Knowledge: ${knowledge?.knowledgeGrowth ?? "business layer standby"}`;
        break;
      case "commerce_architecture":
        status = String(input.commercialIntelligence?.businessHealth ?? "building");
        summary = "Business Factory → Commerce → Intelligence pipeline";
        break;
      case "ux_architecture":
        summary = "Executive Cockpit · Founder Shell · Pillow UX";
        break;
      case "ai_architecture":
        summary = "Pillow · OpenAI · Intelligence Platform · ECC";
        break;
      case "future_opportunities":
        status = (repo?.recommendations.length ?? 0) > 0 ? "opportunity" : "stable";
        summary = `${repo?.recommendations.length ?? 0} architecture recommendations queued`;
        break;
      default:
        break;
    }

    return { domain, label: label(domain), status, summary };
  });
}

function improvementsFromEvolution(
  repositoryEvolution?: RepositoryEvolutionArchitecture | null,
): ArchitectureImprovement[] {
  return (repositoryEvolution?.currentImprovements ?? []).map((item, i) => ({
    architectureId: `AEV-${item.id}`,
    title: item.title,
    domain: item.category,
    priority: item.priority,
    status: item.status,
    riskLevel: item.priority >= 90 ? "high" : item.priority >= 75 ? "medium" : "low",
  }));
}

function buildRecommendations(input: {
  repositoryEvolution?: RepositoryEvolutionArchitecture | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  driftSignals: string[];
}): ArchitectureEvolutionRecommendation[] {
  const recs: ArchitectureEvolutionRecommendation[] = [];

  for (const rec of (input.repositoryEvolution?.recommendations ?? []).slice(0, 4)) {
    recs.push({
      id: `arch-${rec.id}`,
      title: rec.title,
      why: rec.why,
      what: rec.what,
      how: "Constitution validation → Grand King approval → Architecture evolution → Journey recording",
      domain: rec.domain,
      confidencePercent: rec.confidencePercent,
      riskLevel: rec.confidencePercent >= 85 ? "low" : "medium",
    });
  }

  for (const rec of (input.knowledgeEvolution?.recommendations ?? []).slice(0, 3)) {
    recs.push({
      id: `know-${rec.id}`,
      title: rec.title,
      why: rec.why,
      what: rec.what,
      how: "Knowledge integration → Architecture alignment → Repository update",
      domain: rec.domain,
      confidencePercent: rec.confidencePercent,
      riskLevel: "low",
    });
  }

  for (const drift of input.driftSignals.slice(0, 3)) {
    recs.push({
      id: `drift-${drift.slice(0, 20).replace(/\s+/g, "-")}`,
      title: `Resolve architecture drift: ${drift.slice(0, 80)}`,
      why: drift,
      what: "Reconcile drift against canonical architecture",
      how: "VIE assessment → Impact analysis → Constitutional review",
      domain: "architecture_drift",
      confidencePercent: 88,
      riskLevel: "high",
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: "aev-default-001",
      title: "Maintain continuous architecture evolution cadence",
      why: "Architecture is never static — constitutional stability requires traceable evolution",
      what: "Run architecture health review before each evolution mission",
      how: "Vision Sync → Architecture Analysis → Constitution Validation",
      domain: "continuous_improvement",
      confidencePercent: 85,
      riskLevel: "low",
    });
  }

  return recs.slice(0, 8);
}

export function assembleArchitectureEvolutionArchitecture(input: {
  repositoryEvolution?: RepositoryEvolutionArchitecture | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  repositorySnapshot?: RepositoryArchitectureCockpitSnapshot | null;
  repositoryHealth?: RepositoryHealthReport | null;
  journey?: Record<string, unknown>;
  builder?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
  commercialIntelligence?: Record<string, unknown>;
}): ArchitectureEvolutionArchitecture {
  const repositoryEvolution = input.repositoryEvolution;
  const knowledgeEvolution = input.knowledgeEvolution;
  const snapshot = input.repositorySnapshot;
  const health = input.repositoryHealth;
  const vie = input.vie ?? {};
  const journey = input.journey ?? {};

  const driftSignals = [
    ...(repositoryEvolution?.driftSignals ?? []),
    ...((vie.currentDrift ?? []) as string[]),
  ].slice(0, 8);

  const duplicateArchitectures = [
    ...(snapshot?.dependencyGraph?.duplicatedResponsibilities ?? []),
    ...(repositoryEvolution?.duplicateConcepts ?? []),
  ].slice(0, 6);

  const healthScore = Math.min(
    100,
    Math.max(
      45,
      (repositoryEvolution?.healthScore ?? health?.score ?? 72) -
        driftSignals.length * 2 -
        duplicateArchitectures.length * 3,
    ),
  );

  const architectureDrift =
    driftSignals.length === 0
      ? "none detected"
      : `${driftSignals.length} drift signal${driftSignals.length === 1 ? "" : "s"} · constitutional review required`;

  const architectureRisks = [
    ...driftSignals,
    ...duplicateArchitectures.map((d) => `Duplicate architecture: ${d}`),
  ].slice(0, 8);

  const architectureOpportunities = [
    ...(repositoryEvolution?.recommendations.map((r) => r.title) ?? []),
    ...(knowledgeEvolution?.recommendations.map((r) => r.title) ?? []),
  ].slice(0, 8);

  const currentImprovements = improvementsFromEvolution(repositoryEvolution);
  const recommendations = buildRecommendations({ repositoryEvolution, knowledgeEvolution, driftSignals });
  const architectureReviews = buildReviews({
    repositoryEvolution,
    knowledgeEvolution,
    vie,
    guardian: input.guardian,
    commercialIntelligence: input.commercialIntelligence,
  });

  const timeline = (journey.timeline ?? []) as string[];
  const architectureTimeline = [
    `Architecture health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    snapshot ? `${snapshot.componentCount} components · ${snapshot.hotspotCount} hotspots` : "Awaiting repository scan",
    ...timeline.slice(-5),
  ].filter(Boolean);

  const activePhase: ArchitecturePipelinePhase =
    driftSignals.length > 0 ? "constitution_validation" : currentImprovements.length > 0 ? "architecture_recommendation" : "architecture_health_review";

  const pillowAdvisory = [
    `Architecture health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `Drift: ${architectureDrift}`,
    `${duplicateArchitectures.length} duplicate architecture signals`,
    `Layer integrity: ${health?.indicators?.architectureDriftSignals ?? 0} drift indicators`,
    `VIE alignment: ${String(vie.visionAlignment ?? vie.approvalStatus ?? "awaiting assessment")}`,
    `Technical debt: ${repositoryEvolution?.technicalDebt ?? "moderate"}`,
    "Grand King approval required for canonical architecture changes",
  ];

  return {
    architectureVersion: "P9-03",
    computedAt: new Date().toISOString(),
    grandKingSummary:
      snapshot?.grandKingSummary ??
      "Continuous Architecture Evolution — architecture improves while preserving constitutional integrity, canonical stability and backward compatibility",
    architectureHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    architectureDrift,
    healthScore,
    architectureOpportunities,
    currentImprovements,
    architectureTimeline,
    technicalDebt: repositoryEvolution?.technicalDebt ?? "moderate",
    architectureRisks,
    recommendations,
    evolutionPipeline: buildPipeline(activePhase),
    governedDomains: [...GOVERNED_DOMAINS],
    architecturePrinciples: [...ARCHITECTURE_PRINCIPLES],
    healthEvaluations: [...ARCHITECTURE_HEALTH_EVALUATIONS],
    architectureReviews,
    architectureGovernance: [...ARCHITECTURE_GOVERNANCE_FIELDS],
    pillowAdvisory,
    integrations: {
      repositoryEvolution: repositoryEvolution
        ? `P9-01 · ${repositoryEvolution.repositoryHealth}`
        : "standby",
      knowledgeEvolution: knowledgeEvolution
        ? `P9-02 · ${knowledgeEvolution.knowledgeHealth}`
        : "standby",
      journeyStatus: String(journey.currentJourney ?? journey.currentMission ?? "P9 Evolution"),
      builderStatus: String(input.builder?.status ?? input.builder?.currentStep ?? "ready"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      guardianStatus: String(input.guardian?.overallHealth ?? input.guardian?.status ?? "monitoring"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "coordinating"),
      vieStatus: String(vie.visionAlignment ?? vie.approvalStatus ?? "aligned"),
    },
    driftSignals,
    duplicateArchitectures,
  };
}

export function buildFallbackArchitectureEvolutionArchitecture(): ArchitectureEvolutionArchitecture {
  return assembleArchitectureEvolutionArchitecture({});
}
