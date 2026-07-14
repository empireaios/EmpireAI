import type { ArchitectureEvolutionArchitecture } from "../architecture-evolution-architecture/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { CommercialIntelligenceArchitecture } from "../commercial-intelligence/types.js";
import type { ExplainabilityArchitecture } from "../explainability/types.js";
import {
  AI_EVOLUTION_PIPELINE,
  AI_EVOLUTION_PRINCIPLES,
  GOVERNED_DOMAINS,
  AI_CAPABILITIES,
  INTELLIGENCE_QUALITY_EVALUATIONS,
  AI_GOVERNANCE_FIELDS,
} from "./paths.js";
import type {
  AiEvolutionArchitecture,
  AiPipelinePhase,
  AiImprovement,
  AiEvolutionRecommendation,
  IntelligenceQualityScore,
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

function explainabilityConfidence(explain?: ExplainabilityArchitecture | null): {
  percent: number;
  label: string;
} {
  const conf = explain?.currentRecommendation?.confidence ?? explain?.recommendations[0]?.confidence;
  if (conf) {
    return { percent: conf.confidencePercent, label: conf.confidenceClassification };
  }
  return { percent: 72, label: "medium" };
}

function buildPipeline(activePhase: AiPipelinePhase = "reasoning_review"): AiEvolutionArchitecture["evolutionPipeline"] {
  const activeIdx = AI_EVOLUTION_PIPELINE.indexOf(activePhase);
  return AI_EVOLUTION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildQualityScores(input: {
  architectureEvolution?: ArchitectureEvolutionArchitecture | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  commercialIntelligence?: CommercialIntelligenceArchitecture | null;
  explainability?: ExplainabilityArchitecture | null;
  healthScore: number;
}): IntelligenceQualityScore[] {
  const commercial = input.commercialIntelligence;
  const explain = input.explainability;

  const explainConf = explainabilityConfidence(explain);

  const scores: Record<string, { score: string; status: string }> = {
    reasoning_accuracy: {
      score: explain ? `${explainConf.percent}%` : `${Math.min(95, input.healthScore + 5)}%`,
      status: explainConf.label,
    },
    recommendation_quality: {
      score: `${commercial?.recommendations.length ?? 0} active`,
      status: (commercial?.recommendations.length ?? 0) > 0 ? "active" : "building",
    },
    decision_quality: {
      score: healthLabel(input.healthScore),
      status: input.healthScore >= 75 ? "validated" : "review",
    },
    prediction_accuracy: {
      score: commercial ? `${commercial.winningProducts.length} products scored` : "standby",
      status: "evidence-backed",
    },
    context_awareness: {
      score: input.knowledgeEvolution?.knowledgeGrowth ?? "awaiting",
      status: "integrating",
    },
    business_value: {
      score: commercial?.businessHealth ?? "building",
      status: commercial?.integrations.commerceHealth ?? "building",
    },
    engineering_value: {
      score: input.architectureEvolution?.architectureHealth ?? "stable",
      status: "aligned",
    },
    commercial_value: {
      score: commercial?.revenueTrends[0] ?? "Pre-revenue pipeline",
      status: "monitoring",
    },
    executive_value: {
      score: `${(commercial?.recommendations.length ?? 0) + (input.architectureEvolution?.recommendations.length ?? 0)} guidance items`,
      status: "executive-first",
    },
  };

  return INTELLIGENCE_QUALITY_EVALUATIONS.map((evaluation) => ({
    evaluation,
    label: label(evaluation),
    score: scores[evaluation]?.score ?? "—",
    status: scores[evaluation]?.status ?? "pending",
  }));
}

function improvementsFromLayers(input: {
  architectureEvolution?: ArchitectureEvolutionArchitecture | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
}): AiImprovement[] {
  const items: AiImprovement[] = [];

  for (const imp of (input.architectureEvolution?.currentImprovements ?? []).slice(0, 4)) {
    items.push({
      evolutionId: imp.architectureId,
      title: imp.title,
      capability: "architecture_analysis_improvement",
      priority: imp.priority,
      status: imp.status,
      expectedImprovement: "Reduced coupling · improved boundary integrity",
    });
  }

  for (const rec of (input.knowledgeEvolution?.recommendations ?? []).slice(0, 3)) {
    items.push({
      evolutionId: rec.id,
      title: rec.title,
      capability: "knowledge_integration_improvement",
      priority: rec.confidencePercent,
      status: "planned",
      expectedImprovement: "Stronger constitutional memory from mission evidence",
    });
  }

  return items.slice(0, 8);
}

function buildRecommendations(input: {
  architectureEvolution?: ArchitectureEvolutionArchitecture | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  commercialIntelligence?: CommercialIntelligenceArchitecture | null;
  explainability?: ExplainabilityArchitecture | null;
}): AiEvolutionRecommendation[] {
  const recs: AiEvolutionRecommendation[] = [];

  for (const rec of (input.commercialIntelligence?.recommendations ?? []).slice(0, 3)) {
    recs.push({
      id: `ci-${rec.id}`,
      title: rec.title,
      why: rec.why,
      what: rec.what,
      how: rec.how,
      domain: "commercial_intelligence_improvement",
      confidencePercent: rec.confidencePercent,
      evidence: rec.proof,
    });
  }

  for (const rec of (input.architectureEvolution?.recommendations ?? []).slice(0, 3)) {
    recs.push({
      id: `arch-${rec.id}`,
      title: rec.title,
      why: rec.why,
      what: rec.what,
      how: "Constitution validation → AI evolution → Journey recording",
      domain: "reasoning_improvement",
      confidencePercent: rec.confidencePercent,
      evidence: rec.why,
    });
  }

  for (const rec of (input.knowledgeEvolution?.recommendations ?? []).slice(0, 2)) {
    recs.push({
      id: `know-${rec.id}`,
      title: rec.title,
      why: rec.why,
      what: rec.what,
      how: "Knowledge integration → reasoning enrichment",
      domain: "knowledge_integration_improvement",
      confidencePercent: rec.confidencePercent,
      evidence: rec.why,
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: "aie-default-001",
      title: "Maintain continuous AI evolution cadence",
      why: "EmpireAI intelligence must never become static",
      what: "Run reasoning and performance review after each mission",
      how: "Mission Completed → Evidence → Knowledge → Architecture → AI Evolution",
      domain: "continuous_improvement",
      confidencePercent: 85,
      evidence: "P9-04 constitutional AI evolution pipeline",
    });
  }

  return recs.slice(0, 8);
}

export function assembleAiEvolutionArchitecture(input: {
  architectureEvolution?: ArchitectureEvolutionArchitecture | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  commercialIntelligence?: CommercialIntelligenceArchitecture | null;
  explainability?: ExplainabilityArchitecture | null;
  journey?: Record<string, unknown>;
  builder?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): AiEvolutionArchitecture {
  const architectureEvolution = input.architectureEvolution;
  const knowledgeEvolution = input.knowledgeEvolution;
  const commercialIntelligence = input.commercialIntelligence;
  const explainability = input.explainability;
  const journey = input.journey ?? {};

  const baseScore = Math.round(
    ((architectureEvolution?.healthScore ?? 72) +
      (knowledgeEvolution?.healthScore ?? 72) +
      (commercialIntelligence ? 80 : 65)) /
      3,
  );
  const healthScore = Math.min(100, Math.max(45, baseScore));

  const explainConf = explainabilityConfidence(explainability);

  const reasoningQuality = explainability
    ? `${explainConf.percent}% · ${explainConf.label}`
    : `${healthScore}% · ${healthLabel(healthScore)}`;

  const recommendationQuality =
    (commercialIntelligence?.recommendations.length ?? 0) +
      (architectureEvolution?.recommendations.length ?? 0) +
      (knowledgeEvolution?.recommendations.length ?? 0) >
    0
      ? `${(commercialIntelligence?.recommendations.length ?? 0) + (architectureEvolution?.recommendations.length ?? 0)} evidence-backed`
      : "building pipeline";

  const currentImprovements = improvementsFromLayers({ architectureEvolution, knowledgeEvolution });
  const recommendations = buildRecommendations({
    architectureEvolution,
    knowledgeEvolution,
    commercialIntelligence,
    explainability,
  });
  const intelligenceQuality = buildQualityScores({
    architectureEvolution,
    knowledgeEvolution,
    commercialIntelligence,
    explainability,
    healthScore,
  });

  const timeline = (journey.timeline ?? []) as string[];
  const evolutionTimeline = [
    `AI health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `Reasoning: ${reasoningQuality}`,
    `Knowledge growth: ${knowledgeEvolution?.knowledgeGrowth ?? "standby"}`,
    `Architecture: ${architectureEvolution?.architectureHealth ?? "standby"}`,
    ...timeline.slice(-4),
  ].filter(Boolean);

  const activePhase: AiPipelinePhase =
    currentImprovements.length > 0 ? "intelligence_recommendation" : "performance_review";

  const pillowAdvisory = [
    `AI health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `Reasoning quality: ${reasoningQuality}`,
    `Recommendation quality: ${recommendationQuality}`,
    `Commercial intelligence: ${commercialIntelligence?.businessHealth ?? "standby"}`,
    `Knowledge evolution: ${knowledgeEvolution?.knowledgeHealth ?? "standby"}`,
    `Architecture alignment: ${architectureEvolution?.architectureHealth ?? "standby"}`,
    "Grand King approval required before permanent AI model evolution",
    "No hidden intelligence · explainability enforced",
  ];

  return {
    architectureVersion: "P9-04",
    computedAt: new Date().toISOString(),
    grandKingSummary:
      "Continuous AI Evolution — intelligence continuously becomes more capable, accurate and valuable while preserving constitutional governance, explainability and executive trust",
    aiHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    reasoningQuality,
    recommendationQuality,
    healthScore,
    currentImprovements,
    knowledgeGrowth: knowledgeEvolution?.knowledgeGrowth ?? "Awaiting knowledge evolution",
    architectureAlignment: architectureEvolution?.architectureHealth ?? "Awaiting architecture review",
    businessIntelligence: commercialIntelligence?.businessHealth ?? "Business intelligence building",
    commercialIntelligence: commercialIntelligence
      ? `${commercialIntelligence.winningProducts.length} products · ${commercialIntelligence.recommendations.length} recommendations`
      : "Commercial intelligence standby",
    evolutionTimeline,
    recommendations,
    evolutionPipeline: buildPipeline(activePhase),
    governedDomains: [...GOVERNED_DOMAINS],
    aiEvolutionPrinciples: [...AI_EVOLUTION_PRINCIPLES],
    aiCapabilities: [...AI_CAPABILITIES],
    intelligenceQuality,
    aiGovernance: [...AI_GOVERNANCE_FIELDS],
    pillowAdvisory,
    integrations: {
      knowledgeEvolution: knowledgeEvolution
        ? `P9-02 · ${knowledgeEvolution.knowledgeHealth}`
        : "standby",
      architectureEvolution: architectureEvolution
        ? `P9-03 · ${architectureEvolution.architectureHealth}`
        : "standby",
      commercialIntelligence: commercialIntelligence
        ? `P8-05 · ${commercialIntelligence.businessHealth}`
        : "standby",
      explainability: explainability
        ? `P7-07 · ${explainConf.percent}% confidence`
        : "standby",
      journeyStatus: String(journey.currentJourney ?? journey.currentMission ?? "P9 Evolution"),
      builderStatus: String(input.builder?.status ?? input.builder?.currentStep ?? "ready"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "supervising"),
      guardianStatus: String(input.guardian?.overallHealth ?? input.guardian?.status ?? "monitoring"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "coordinating"),
      vieStatus: String(input.vie?.visionAlignment ?? input.vie?.approvalStatus ?? "aligned"),
    },
  };
}

export function buildFallbackAiEvolutionArchitecture(): AiEvolutionArchitecture {
  return assembleAiEvolutionArchitecture({});
}
