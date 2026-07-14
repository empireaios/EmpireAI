import type { RepositoryEvolutionArchitecture } from "../repository-evolution-architecture/types.js";
import type { GraphSummary } from "../intelligence/types.js";
import {
  KNOWLEDGE_EVOLUTION_PIPELINE,
  KNOWLEDGE_PRINCIPLES,
  GOVERNED_DOMAINS,
  KNOWLEDGE_CLASSIFICATIONS,
  KNOWLEDGE_SOURCES,
  KNOWLEDGE_GOVERNANCE_FIELDS,
} from "./paths.js";
import type {
  KnowledgeEvolutionArchitecture,
  KnowledgePipelinePhase,
  KnowledgeItem,
  KnowledgeCategorySummary,
  KnowledgeEvolutionRecommendation,
  KnowledgeClassification,
  KnowledgeSource,
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

function buildPipeline(activePhase: KnowledgePipelinePhase = "knowledge_integration"): KnowledgeEvolutionArchitecture["evolutionPipeline"] {
  const activeIdx = KNOWLEDGE_EVOLUTION_PIPELINE.indexOf(activePhase);
  return KNOWLEDGE_EVOLUTION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function classifyFromEvidence(text: string): KnowledgeClassification {
  const lower = text.toLowerCase();
  if (lower.includes("constitution") || lower.includes("constitutional")) return "constitutional_knowledge";
  if (lower.includes("architecture") || lower.includes("component")) return "architectural_knowledge";
  if (lower.includes("commerce") || lower.includes("revenue") || lower.includes("product")) return "commercial_knowledge";
  if (lower.includes("recovery") || lower.includes("incident")) return "recovery_knowledge";
  if (lower.includes("production") || lower.includes("deploy")) return "production_knowledge";
  if (lower.includes("vision") || lower.includes("soul")) return "vision_knowledge";
  if (lower.includes("engineer") || lower.includes("builder")) return "engineering_knowledge";
  if (lower.includes("business") || lower.includes("factory")) return "business_knowledge";
  if (lower.includes("runtime") || lower.includes("guardian")) return "runtime_knowledge";
  return "historical_knowledge";
}

function inferSource(text: string): KnowledgeSource {
  const lower = text.toLowerCase();
  if (lower.includes("builder")) return "builder";
  if (lower.includes("supervisor")) return "supervisor";
  if (lower.includes("guardian")) return "guardian";
  if (lower.includes("recovery")) return "recovery_events";
  if (lower.includes("test") || lower.includes("browser")) return "testing_results";
  if (lower.includes("commerce") || lower.includes("intelligence")) return "commercial_intelligence";
  if (lower.includes("journey") || lower.includes("mission")) return "journey";
  return "pillow";
}

function itemsFromJourney(journey: Record<string, unknown>): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  const lessons = (journey.lessonsLearned ?? []) as string[];
  const evidence = (journey.evidence ?? []) as string[];
  const repoChanges = (journey.repositoryChanges ?? []) as string[];
  const mission = String(journey.currentMission ?? "unknown");
  const now = new Date().toISOString();

  for (const [i, lesson] of lessons.slice(-4).entries()) {
    items.push({
      knowledgeId: `KN-JRN-L-${i}`,
      classification: classifyFromEvidence(lesson),
      source: "journey",
      title: lesson.slice(0, 100),
      evidence: lesson,
      owner: "Journey System",
      dateCreated: now,
      validationStatus: "validated",
      relatedMissions: [mission],
    });
  }

  for (const [i, ev] of evidence.slice(-3).entries()) {
    items.push({
      knowledgeId: `KN-JRN-E-${i}`,
      classification: classifyFromEvidence(ev),
      source: inferSource(ev),
      title: ev.slice(0, 100),
      evidence: ev,
      owner: "Mission Evidence",
      dateCreated: now,
      validationStatus: "validated",
      relatedMissions: [mission],
    });
  }

  for (const [i, change] of repoChanges.slice(-2).entries()) {
    items.push({
      knowledgeId: `KN-REP-${i}`,
      classification: "engineering_knowledge",
      source: "repository",
      title: change.slice(0, 100),
      evidence: change,
      owner: "Repository Evolution",
      dateCreated: now,
      validationStatus: "integrated",
      relatedMissions: [mission],
    });
  }

  return items;
}

function buildCategorySummaries(items: KnowledgeItem[]): KnowledgeCategorySummary[] {
  const counts = new Map<KnowledgeClassification, number>();
  for (const item of items) {
    counts.set(item.classification, (counts.get(item.classification) ?? 0) + 1);
  }

  return KNOWLEDGE_CLASSIFICATIONS.filter((c) => c !== "rejected_knowledge" && c !== "deferred_knowledge")
    .map((classification) => ({
      classification,
      label: label(classification),
      count: counts.get(classification) ?? 0,
      quality: (counts.get(classification) ?? 0) > 0 ? "active" : "awaiting",
    }))
    .filter((c) => c.count > 0 || ["architectural_knowledge", "engineering_knowledge", "historical_knowledge"].includes(c.classification));
}

function buildRecommendations(input: {
  repositoryEvolution?: RepositoryEvolutionArchitecture | null;
  knowledgeGaps: string[];
  journey?: Record<string, unknown>;
}): KnowledgeEvolutionRecommendation[] {
  const recs: KnowledgeEvolutionRecommendation[] = [];

  for (const gap of input.knowledgeGaps.slice(0, 4)) {
    recs.push({
      id: `gap-${gap.slice(0, 24).replace(/\s+/g, "-")}`,
      title: gap,
      why: "Knowledge gap detected in constitutional memory",
      what: "Extract and validate evidence from completed mission",
      how: "Mission Completed → Evidence → Classification → Validation → Integration",
      domain: "knowledge_integration",
      confidencePercent: 80,
    });
  }

  for (const rec of (input.repositoryEvolution?.recommendations ?? []).slice(0, 3)) {
    recs.push({
      id: `repo-${rec.id}`,
      title: rec.title,
      why: rec.why,
      what: rec.what,
      how: "Repository update → Vision accumulation → Future mission improvement",
      domain: "repository_update",
      confidencePercent: rec.confidencePercent,
    });
  }

  const lessons = ((input.journey?.lessonsLearned ?? []) as string[]).length;
  if (lessons === 0) {
    recs.push({
      id: "kev-default-001",
      title: "Record lessons learned from current mission",
      why: "Every mission shall strengthen the Empire through validated knowledge",
      what: "Capture evidence and lessons at mission completion",
      how: "Journey recording → Knowledge extraction → EKLS candidate review",
      domain: "future_mission_improvement",
      confidencePercent: 85,
    });
  }

  return recs.slice(0, 8);
}

export function assembleKnowledgeEvolutionArchitecture(input: {
  repositoryEvolution?: RepositoryEvolutionArchitecture | null;
  graphSummary?: GraphSummary | null;
  journey?: Record<string, unknown>;
  builder?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
  commercialIntelligence?: Record<string, unknown>;
}): KnowledgeEvolutionArchitecture {
  const journey = input.journey ?? {};
  const repositoryEvolution = input.repositoryEvolution;
  const graphSummary = input.graphSummary;

  const recentKnowledge = itemsFromJourney(journey);
  const entityCount = graphSummary?.nodeCount ?? repositoryEvolution?.healthScore ?? 0;
  const healthScore = Math.min(
    100,
    Math.max(
      50,
      (repositoryEvolution?.healthScore ?? 72) +
        Math.min(15, recentKnowledge.length * 3) +
        (graphSummary ? Math.min(10, Math.floor(graphSummary.edgeCount / 20)) : 0),
    ),
  );

  const knowledgeGaps: string[] = [];
  if (recentKnowledge.length === 0) {
    knowledgeGaps.push("No recent mission knowledge captured — start Pillow session");
  }
  if ((repositoryEvolution?.driftSignals.length ?? 0) > 0) {
    knowledgeGaps.push(`${repositoryEvolution!.driftSignals.length} drift signals need knowledge reconciliation`);
  }
  if ((journey.lessonsLearned as string[] | undefined)?.length === 0) {
    knowledgeGaps.push("Lessons learned pipeline empty for current journey");
  }
  if ((graphSummary?.nodeCount ?? 0) === 0) {
    knowledgeGaps.push("Repository intelligence graph not indexed");
  }

  const knowledgeCategories = buildCategorySummaries(recentKnowledge);
  const recommendations = buildRecommendations({ repositoryEvolution, knowledgeGaps, journey });

  const timeline = (journey.timeline ?? []) as string[];
  const historicalGrowth = [
    `${recentKnowledge.length} knowledge items from current journey`,
    `${entityCount} entities in repository intelligence graph`,
    ...timeline.slice(-4),
  ].filter(Boolean);

  const pillowAdvisory = [
    `Knowledge health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${recentKnowledge.length} recent validated knowledge items`,
    `${knowledgeGaps.length} knowledge gaps identified`,
    `Repository evolution: ${repositoryEvolution?.repositoryHealth ?? "standby"}`,
    `Journey: ${String(journey.currentMission ?? "awaiting mission")}`,
    `Supervisor: ${String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring")}`,
    "Grand King approval required before permanent EKLS integration",
  ];

  return {
    architectureVersion: "P9-02",
    computedAt: new Date().toISOString(),
    grandKingSummary:
      "Continuous Knowledge Evolution — every mission, recovery, and decision permanently strengthens the Empire through validated, evidence-based knowledge without duplicate truth",
    knowledgeHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    knowledgeGrowth: `${recentKnowledge.length} recent · ${entityCount} graph entities`,
    knowledgeQuality: recentKnowledge.every((k) => k.validationStatus === "validated")
      ? "validated"
      : recentKnowledge.length > 0
        ? "integrating"
        : "awaiting evidence",
    healthScore,
    recentKnowledge,
    knowledgeCategories,
    knowledgeGaps,
    recommendations,
    historicalGrowth,
    evolutionPipeline: buildPipeline(recentKnowledge.length > 0 ? "vision_accumulation" : "knowledge_extraction"),
    governedDomains: [...GOVERNED_DOMAINS],
    knowledgePrinciples: [...KNOWLEDGE_PRINCIPLES],
    knowledgeClassifications: [...KNOWLEDGE_CLASSIFICATIONS],
    knowledgeSources: [...KNOWLEDGE_SOURCES],
    knowledgeGovernance: [...KNOWLEDGE_GOVERNANCE_FIELDS],
    pillowAdvisory,
    integrations: {
      repositoryEvolution: repositoryEvolution
        ? `P9-01 · ${repositoryEvolution.repositoryHealth}`
        : "standby",
      journeyStatus: String(journey.currentJourney ?? journey.currentMission ?? "P9 Evolution"),
      builderStatus: String(input.builder?.status ?? input.builder?.currentStep ?? "ready"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      guardianStatus: String(input.guardian?.overallHealth ?? input.guardian?.status ?? "monitoring"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "coordinating"),
      vieStatus: String(input.vie?.visionAlignment ?? input.vie?.approvalStatus ?? "aligned"),
      commercialIntelligence: String(
        input.commercialIntelligence?.businessHealth ?? input.commercialIntelligence?.status ?? "standby",
      ),
    },
  };
}

export function buildFallbackKnowledgeEvolutionArchitecture(): KnowledgeEvolutionArchitecture {
  return assembleKnowledgeEvolutionArchitecture({});
}
