import type { RepositoryArchitectureCockpitSnapshot } from "../repository-intelligence/types.js";
import type { RepositoryHealthReport } from "../intelligence/types.js";
import type { ImprovementBacklogItem } from "../continuous-evolution/types.js";
import {
  REPOSITORY_EVOLUTION_PIPELINE,
  EVOLUTION_PRINCIPLES,
  GOVERNED_DOMAINS,
  EVOLUTION_CAPABILITIES,
  HEALTH_EVALUATIONS,
  CHANGE_GOVERNANCE_FIELDS,
  REPOSITORY_HEALTH_DOMAINS,
  DRIFT_DETECTION_TYPES,
  IMPROVEMENT_TYPES,
} from "./paths.js";
import type {
  RepositoryEvolutionArchitecture,
  EvolutionPipelinePhase,
  RepositoryImprovement,
  RepositoryEvolutionRecommendation,
  RepositoryHealthMetric,
  DriftDetectionRecord,
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

function buildPipeline(activePhase: EvolutionPipelinePhase = "drift_detection"): RepositoryEvolutionArchitecture["evolutionPipeline"] {
  const activeIdx = REPOSITORY_EVOLUTION_PIPELINE.indexOf(activePhase);
  return REPOSITORY_EVOLUTION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function improvementsFromBacklog(items: ImprovementBacklogItem[]): RepositoryImprovement[] {
  return items.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    priority: item.priority,
    effort: item.estimatedEffort,
    status: item.priority >= 90 ? "urgent" : item.priority >= 75 ? "planned" : "backlog",
  }));
}

function recommendationsFromHealth(
  health: RepositoryHealthReport | null | undefined,
  snapshot: RepositoryArchitectureCockpitSnapshot | null | undefined,
): RepositoryEvolutionRecommendation[] {
  const recs: RepositoryEvolutionRecommendation[] = [];

  for (const issue of (health?.issues ?? []).slice(0, 5)) {
    recs.push({
      id: `health-${issue.code}-${issue.entityId ?? "global"}`,
      title: issue.message.slice(0, 120),
      why: issue.message,
      what: issue.recommendation,
      how: "Builder Console → validation → Browser Truth → Journey recording",
      domain: issue.code.toLowerCase(),
      confidencePercent: issue.severity === "error" ? 90 : issue.severity === "warning" ? 75 : 60,
    });
  }

  for (const hotspot of (snapshot?.dependencyHotspots ?? []).slice(0, 3)) {
    recs.push({
      id: `hotspot-${hotspot.id}`,
      title: `Architectural hotspot: ${hotspot.id}`,
      why: hotspot.reason,
      what: "Refactor dependency chain to reduce coupling",
      how: "Impact analysis → mission generation → Builder implementation",
      domain: "architecture_consolidation",
      confidencePercent: Math.min(95, Math.round(hotspot.score)),
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: "rev-default-001",
      title: "Maintain constitutional repository evolution cadence",
      why: "Repository is the living constitutional memory of EmpireAI",
      what: "Run continuous repository analysis before each evolution mission",
      how: "Vision Sync → Context Sync → Repository Analysis pipeline",
      domain: "continuous_improvement",
      confidencePercent: 85,
    });
  }

  return recs;
}

function buildHealthMetrics(input: {
  score: number;
  indicators?: RepositoryHealthReport["indicators"];
  snapshot?: RepositoryArchitectureCockpitSnapshot | null;
  technicalDebtScore: number;
  knowledgeDebtScore: number;
}): RepositoryHealthMetric[] {
  const indicators = input.indicators;
  const snapshot = input.snapshot;

  const values: Record<string, { status: string; summary: string }> = {
    architecture_consistency: {
      status: (snapshot?.hotspotCount ?? 0) === 0 ? "consistent" : "review",
      summary: snapshot ? `${snapshot.hotspotCount} hotspots · ${snapshot.circularDependencyCount} circular deps` : "Awaiting scan",
    },
    folder_consistency: {
      status: snapshot ? "indexed" : "pending",
      summary: snapshot ? `${snapshot.folderCount} folders · ${snapshot.fileCount} files` : "Repository scan required",
    },
    documentation_quality: {
      status: (indicators?.missingDocumentation ?? 0) === 0 ? "aligned" : "gaps",
      summary: `${indicators?.missingDocumentation ?? 0} documentation gaps`,
    },
    canonical_truth: {
      status: (indicators?.duplicateOwnership ?? 0) === 0 ? "single_truth" : "review",
      summary: `${indicators?.duplicateOwnership ?? 0} duplicate ownership signals`,
    },
    mission_coverage: {
      status: (indicators?.missingJourneyReferences ?? 0) === 0 ? "covered" : "gaps",
      summary: `${indicators?.missingJourneyReferences ?? 0} missing journey references`,
    },
    registry_health: {
      status: "active",
      summary: `${indicators?.totalEntities ?? snapshot?.componentCount ?? 0} entities indexed`,
    },
    code_quality: {
      status: input.score >= 85 ? "strong" : input.score >= 70 ? "stable" : "attention",
      summary: `Health score ${input.score}/100`,
    },
    technical_debt: {
      status: input.technicalDebtScore >= 20 ? "elevated" : input.technicalDebtScore >= 10 ? "moderate" : "low",
      summary: `Debt index ${input.technicalDebtScore}`,
    },
    naming_consistency: {
      status: (indicators?.brokenDependencyChains ?? 0) === 0 ? "consistent" : "review",
      summary: `${indicators?.brokenDependencyChains ?? 0} broken dependency chains`,
    },
    production_readiness: {
      status: input.score >= 80 ? "ready" : "building",
      summary: "Production Truth · validation · browser verification",
    },
    repository_integrity: {
      status: (indicators?.orphanedArtifacts ?? 0) === 0 ? "protected" : "attention",
      summary: `${indicators?.orphanedArtifacts ?? 0} orphaned artifacts`,
    },
  };

  return REPOSITORY_HEALTH_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Repository health monitored",
  }));
}

function buildDriftDetection(input: {
  driftSignals: string[];
  duplicateConcepts: string[];
  unusedComponents: string[];
  indicators?: RepositoryHealthReport["indicators"];
}): DriftDetectionRecord[] {
  const map: Record<string, { detected: boolean; summary: string }> = {
    duplicate_architectures: {
      detected: input.duplicateConcepts.length > 0,
      summary: input.duplicateConcepts.length ? input.duplicateConcepts.join(" · ") : "No duplicate architectures",
    },
    duplicate_engines: {
      detected: input.duplicateConcepts.some((c) => /engine|duplicate/i.test(c)),
      summary: "Single canonical engine per domain enforced",
    },
    duplicate_documents: {
      detected: (input.indicators?.duplicateOwnership ?? 0) > 0,
      summary: `${input.indicators?.duplicateOwnership ?? 0} duplicate ownership signals`,
    },
    conflicting_truth: {
      detected: input.driftSignals.some((s) => /drift|conflict/i.test(s)),
      summary: input.driftSignals[0] ?? "No conflicting truth detected",
    },
    broken_references: {
      detected: (input.indicators?.brokenDependencyChains ?? 0) > 0,
      summary: `${input.indicators?.brokenDependencyChains ?? 0} broken references`,
    },
    unused_components: {
      detected: input.unusedComponents.length > 0,
      summary: input.unusedComponents.length ? input.unusedComponents.join(" · ") : "No unused components",
    },
    dead_code: {
      detected: input.unusedComponents.length > 2,
      summary: `${input.unusedComponents.length} potentially unused components`,
    },
    obsolete_files: {
      detected: (input.indicators?.orphanedArtifacts ?? 0) > 0,
      summary: `${input.indicators?.orphanedArtifacts ?? 0} orphaned artifacts`,
    },
    mission_drift: {
      detected: (input.indicators?.missingJourneyReferences ?? 0) > 0,
      summary: `${input.indicators?.missingJourneyReferences ?? 0} mission reference gaps`,
    },
    repository_fragmentation: {
      detected: input.driftSignals.length > 2,
      summary: `${input.driftSignals.length} active drift signals`,
    },
  };

  return DRIFT_DETECTION_TYPES.map((type) => ({
    type,
    label: label(type),
    detected: map[type]?.detected ?? false,
    summary: map[type]?.summary ?? "Monitored",
  }));
}

export function assembleRepositoryEvolutionArchitecture(input: {
  repositorySnapshot?: RepositoryArchitectureCockpitSnapshot | null;
  repositoryHealth?: RepositoryHealthReport | null;
  improvementBacklog?: ImprovementBacklogItem[];
  visionSync?: Record<string, unknown>;
  contextSync?: Record<string, unknown>;
  builder?: Record<string, unknown>;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): RepositoryEvolutionArchitecture {
  const snapshot = input.repositorySnapshot;
  const health = input.repositoryHealth;
  const score = health?.score ?? (snapshot ? Math.max(50, 100 - snapshot.hotspotCount * 3 - snapshot.circularDependencyCount * 5) : 72);
  const indicators = health?.indicators;

  const driftSignals: string[] = [];
  if ((indicators?.architectureDriftSignals ?? 0) > 0) {
    driftSignals.push(`${indicators!.architectureDriftSignals} architecture drift signals`);
  }
  if ((indicators?.missingDocumentation ?? 0) > 0) {
    driftSignals.push(`${indicators!.missingDocumentation} documentation gaps`);
  }
  if ((snapshot?.circularDependencyCount ?? 0) > 0) {
    driftSignals.push(`${snapshot!.circularDependencyCount} circular dependencies`);
  }
  const vieDrifts = (input.vie?.currentDrift ?? input.vie?.detectedDrifts) as string[] | undefined;
  if (vieDrifts?.length) {
    driftSignals.push(...vieDrifts.slice(0, 3));
  }

  const duplicateConcepts = snapshot?.dependencyGraph?.duplicatedResponsibilities?.slice(0, 6) ?? [];
  const unusedComponents = snapshot?.dependencyGraph?.unusedComponents?.slice(0, 6) ?? [];

  const technicalDebtScore = Math.max(
    0,
    (indicators?.brokenDependencyChains ?? 0) * 5 +
      (indicators?.duplicateOwnership ?? 0) * 3 +
      duplicateConcepts.length * 2,
  );
  const knowledgeDebtScore = Math.max(
    0,
    (indicators?.missingJourneyReferences ?? 0) * 2 +
      (indicators?.missingDocumentation ?? 0) * 3 +
      (indicators?.orphanedArtifacts ?? 0) * 2,
  );

  const currentImprovements = improvementsFromBacklog(input.improvementBacklog ?? []);
  const recommendations = recommendationsFromHealth(health, snapshot);
  const repositoryHealthMetrics = buildHealthMetrics({
    score,
    indicators,
    snapshot,
    technicalDebtScore,
    knowledgeDebtScore,
  });
  const driftDetection = buildDriftDetection({
    driftSignals,
    duplicateConcepts,
    unusedComponents,
    indicators,
  });

  const canonicalIntegrity =
    driftSignals.length === 0 && duplicateConcepts.length === 0
      ? "validated · single source of truth"
      : `${driftSignals.length} drift · ${duplicateConcepts.length} duplicate concepts · integrity monitored`;

  const activePhase: EvolutionPipelinePhase =
    currentImprovements.length > 0 ? "safe_evolution" : "improvement_recommendation";

  const pillowAdvisory = [
    `Repository health: ${score}/100 (${healthLabel(score)})`,
    snapshot
      ? `${snapshot.componentCount} components · ${snapshot.hotspotCount} hotspots indexed`
      : "Start Pillow session for live repository intelligence",
    `Documentation: ${indicators?.missingDocumentation ?? 0} gaps tracked`,
    `Architecture drift: ${indicators?.architectureDriftSignals ?? driftSignals.length} signals`,
    `Technical debt index: ${technicalDebtScore}`,
    `Knowledge debt index: ${knowledgeDebtScore}`,
    `Supervisor: ${String(input.supervisor?.currentMission ?? input.supervisor?.missionStatus ?? "monitoring evolution")}`,
  ];

  return {
    architectureVersion: "P9-01",
    computedAt: new Date().toISOString(),
    grandKingSummary:
      snapshot?.grandKingSummary ??
      "Continuous Repository Evolution — constitutional memory that improves without losing integrity, history or alignment",
    repositoryHealth: `${score}/100 · ${healthLabel(score)}`,
    repositoryQuality: snapshot
      ? `${snapshot.componentCount} components · ${snapshot.folderCount} folders · ${snapshot.fileCount} files`
      : "Awaiting repository intelligence scan",
    architectureHealth:
      snapshot && snapshot.hotspotCount === 0
        ? "stable"
        : snapshot
          ? `${snapshot.hotspotCount} hotspots · ${snapshot.circularDependencyCount} circular deps`
          : "analysis pending",
    documentationHealth:
      (indicators?.missingDocumentation ?? 0) === 0
        ? "aligned"
        : `${indicators?.missingDocumentation ?? 0} documentation gaps`,
    technicalDebt: technicalDebtScore >= 20 ? "elevated" : technicalDebtScore >= 10 ? "moderate" : "low",
    knowledgeDebt: knowledgeDebtScore >= 15 ? "elevated" : knowledgeDebtScore >= 8 ? "moderate" : "low",
    canonicalIntegrity,
    healthScore: score,
    currentImprovements,
    evolutionQueue: currentImprovements,
    recommendations,
    executiveRecommendations: recommendations,
    repositoryHealthMetrics,
    driftDetection,
    improvementTypes: [...IMPROVEMENT_TYPES],
    evolutionPipeline: buildPipeline(activePhase),
    governedDomains: [...GOVERNED_DOMAINS],
    evolutionPrinciples: [...EVOLUTION_PRINCIPLES],
    evolutionCapabilities: [...EVOLUTION_CAPABILITIES],
    healthEvaluations: [...HEALTH_EVALUATIONS],
    changeGovernance: [...CHANGE_GOVERNANCE_FIELDS],
    pillowAdvisory,
    integrations: {
      repositoryIntelligence: snapshot ? `PILLOW-RI-002 · ${snapshot.version}` : "standby",
      continuousEvolution: input.improvementBacklog?.length ? "PILLOW-CEV-001 active" : "standby",
      builderStatus: String(input.builder?.status ?? input.builder?.currentStep ?? "ready"),
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.phase ?? "P9 Evolution"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      guardianStatus: String(input.guardian?.overallHealth ?? input.guardian?.status ?? "monitoring"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "coordinating"),
      vieStatus: String(input.vie?.approvalStatus ?? input.vie?.visionAlignment ?? "VIE active"),
    },
    driftSignals,
    duplicateConcepts,
    unusedComponents,
  };
}

export function buildFallbackRepositoryEvolutionArchitecture(): RepositoryEvolutionArchitecture {
  return assembleRepositoryEvolutionArchitecture({
    repositoryHealth: {
      score: 72,
      issues: [],
      indicators: {
        totalEntities: 0,
        missingOwnerReferences: 0,
        brokenDependencyChains: 0,
        duplicateOwnership: 0,
        orphanedArtifacts: 0,
        architectureDriftSignals: 0,
        missingJourneyReferences: 0,
        missingDocumentation: 0,
      },
    },
  });
}
