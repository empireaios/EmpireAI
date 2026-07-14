import type { ExecutiveArchitectureFramework } from "../executive-architecture-framework/types.js";
import type { EmpireEvolutionArchitecture } from "../empire-evolution-architecture/types.js";
import type { GrandKingOperatingAccount } from "../grand-king-operating-account/types.js";
import {
  VISION_STRUCTURE,
  VISION_SYNC_PIPELINE,
  VISION_PRINCIPLES,
  VISION_GOVERNED_DOMAINS,
  VISION_ACCUMULATION_SOURCES,
  VISION_HEALTH_DOMAINS,
  PILLOW_VISION_EVALUATIONS,
  CANONICAL_VISION_WHY,
  CANONICAL_VISION_WHAT,
  CANONICAL_VISION_HOW,
} from "./paths.js";
import type {
  CorporateVisionEngine,
  VisionStructureStep,
  VisionSyncStep,
  VisionSyncPhase,
  VisionHealthMetric,
  VisionAccumulationItem,
  VisionAddition,
  VisionReview,
  VisionRecommendation,
  PillowVisionEvaluationMetric,
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

function buildVisionStructure(input: {
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  empireEvolution?: EmpireEvolutionArchitecture | null;
  journey?: Record<string, unknown>;
}): VisionStructureStep[] {
  const summaries: Record<string, string> = {
    why: CANONICAL_VISION_WHY.slice(0, 120),
    what: CANONICAL_VISION_WHAT.slice(0, 120),
    how: CANONICAL_VISION_HOW.slice(0, 120),
    strategic_objectives:
      input.executiveArchitecture?.currentObjectives.map((o) => o.title).join(" · ") ??
      "E1 Executive Programme objectives",
    roadmaps: `${input.empireEvolution?.roadmapItemsExecuted ?? 63} constitutional items · E1 Executive Planning`,
    initiatives:
      input.executiveArchitecture?.currentInitiatives.map((i) => i.title).join(" · ") ??
      "Executive initiatives active",
    execution: String(input.journey?.currentMission ?? "Constitutional execution"),
    business_growth:
      input.executiveArchitecture?.integrations.businessFactory ?? "Business Factory · Commerce",
    empire_evolution: input.empireEvolution?.currentEvolution ?? "P1–P9 · perpetual improvement",
  };

  return VISION_STRUCTURE.map((layer, i) => ({
    layer,
    label: label(layer),
    order: i + 1,
    summary: summaries[layer] ?? "Vision layer active",
  }));
}

function buildVisionSyncPipeline(
  activePhase: VisionSyncPhase = "vision_synchronization",
  visionSyncSuccess?: boolean,
): VisionSyncStep[] {
  const activeIdx = VISION_SYNC_PIPELINE.indexOf(activePhase);
  const owners: Record<string, string> = {
    vision_synchronization: "Pillow · P4-02",
    vision_integrity_review: "VIE · P6-02",
    vision_accumulation: "Pillow · P1-03",
    context_synchronization: "Pillow · P4-03",
    mission_planning: "Pillow · Planner",
    executive_execution: "ECC · Builder",
  };

  return VISION_SYNC_PIPELINE.map((phase, i) => {
    let status: VisionSyncStep["status"] =
      i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending";

    if (phase === "vision_synchronization" && visionSyncSuccess === false) {
      status = "required";
    }

    return {
      phase,
      label: label(phase),
      order: i + 1,
      status,
      owner: owners[phase] ?? "Empire",
    };
  });
}

function buildVisionHealthMetrics(input: {
  vie?: Record<string, unknown>;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  empireEvolution?: EmpireEvolutionArchitecture | null;
}): VisionHealthMetric[] {
  const vie = input.vie ?? {};
  const alignmentScore =
    typeof vie.visionAlignmentScore === "number" ? vie.visionAlignmentScore : 82;
  const driftCount = Array.isArray(vie.currentDrift) ? vie.currentDrift.length : 0;

  const values: Record<string, { status: string; score: number; summary: string }> = {
    vision_completeness: {
      status: "complete",
      score: 88,
      summary: "WHY · WHAT · HOW · Strategic Objectives · Roadmaps defined",
    },
    vision_alignment: {
      status: String(vie.visionAlignment ?? vie.approvalStatus ?? "aligned"),
      score: alignmentScore,
      summary: "Vision · Soul · CTD · Constitution hierarchy synchronized",
    },
    vision_consistency: {
      status: driftCount === 0 ? "consistent" : "review",
      score: Math.max(50, 95 - driftCount * 8),
      summary: "One canonical Vision File · no duplicate truth",
    },
    vision_drift: {
      status: driftCount === 0 ? "none" : `${driftCount} signals`,
      score: Math.max(40, 90 - driftCount * 10),
      summary: driftCount === 0 ? "No vision drift detected" : String((vie.currentDrift as string[] | undefined)?.[0] ?? "Monitor"),
    },
    vision_gaps: {
      status: "minimal",
      score: 78,
      summary: "E1-02 Corporate Vision Engine · accumulation register ready",
    },
    vision_opportunities: {
      status: "evaluating",
      score: 80,
      summary: "E1 Executive Programme · Strategic Objective Engine next",
    },
    strategic_coverage: {
      status: input.empireEvolution?.constitutionalExecutionComplete ? "comprehensive" : "building",
      score: input.empireEvolution?.healthScore ?? 72,
      summary: `P1–P9 · E1 Executive · ${input.executiveArchitecture?.currentInitiatives.length ?? 4} initiatives`,
    },
  };

  return VISION_HEALTH_DOMAINS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    score: values[domain]?.score ?? 70,
    summary: values[domain]?.summary ?? "Vision health monitored",
  }));
}

function buildVisionAccumulations(input: {
  journey?: Record<string, unknown>;
  grandKing?: GrandKingOperatingAccount | null;
  empireEvolution?: EmpireEvolutionArchitecture | null;
}): VisionAccumulationItem[] {
  const now = new Date().toISOString();
  const items: VisionAccumulationItem[] = [
    {
      id: "cve-acc-p1-09",
      source: "engineering_discoveries",
      label: label("engineering_discoveries"),
      title: "P1–P9 Constitutional Execution complete — perpetual evolution foundation",
      classification: "PV",
      disposition: "Approved",
      traceable: true,
      versioned: true,
      evidenceBacked: true,
      constitutionallyAligned: true,
      accumulatedAt: now,
    },
    {
      id: "cve-acc-e1-01",
      source: "executive_decisions",
      label: label("executive_decisions"),
      title: "E1-01 Executive Architecture Framework — unified executive operating model",
      classification: "EP",
      disposition: "Approved",
      traceable: true,
      versioned: true,
      evidenceBacked: true,
      constitutionallyAligned: true,
      accumulatedAt: now,
    },
    {
      id: "cve-acc-gk",
      source: "grand_king_decisions",
      label: label("grand_king_decisions"),
      title: input.grandKing?.currentMission ?? "Grand King sovereign commercial authority",
      classification: "BP",
      disposition: "Approved",
      traceable: true,
      versioned: true,
      evidenceBacked: true,
      constitutionallyAligned: true,
      accumulatedAt: now,
    },
    {
      id: "cve-acc-journey",
      source: "journey_knowledge",
      label: label("journey_knowledge"),
      title: String(input.journey?.currentJourney ?? "Empire journey · constitutional execution"),
      classification: "HE",
      disposition: "Approved",
      traceable: true,
      versioned: true,
      evidenceBacked: true,
      constitutionallyAligned: true,
      accumulatedAt: now,
    },
    {
      id: "cve-acc-arch",
      source: "architecture_discoveries",
      label: label("architecture_discoveries"),
      title: `Architecture evolution: ${input.empireEvolution?.architectureHealth ?? "stable"}`,
      classification: "AP",
      disposition: "Approved",
      traceable: true,
      versioned: true,
      evidenceBacked: true,
      constitutionallyAligned: true,
      accumulatedAt: now,
    },
  ];

  for (const source of VISION_ACCUMULATION_SOURCES) {
    if (items.some((i) => i.source === source)) continue;
    items.push({
      id: `cve-acc-${source}`,
      source,
      label: label(source),
      title: `${label(source)} — accumulation channel active`,
      classification: "HE",
      disposition: "Pending",
      traceable: true,
      versioned: true,
      evidenceBacked: false,
      constitutionallyAligned: true,
      accumulatedAt: now,
    });
  }

  return items.slice(0, 12);
}

function buildRecentAdditions(accumulations: VisionAccumulationItem[]): VisionAddition[] {
  return accumulations
    .filter((a) => a.disposition === "Approved")
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      title: a.title,
      source: a.label,
      classification: a.classification,
      addedAt: a.accumulatedAt,
    }));
}

function buildPendingReviews(input: {
  vie?: Record<string, unknown>;
}): VisionReview[] {
  const vie = input.vie ?? {};
  const reviews: VisionReview[] = [
    {
      id: "cve-rev-e1-02",
      title: "E1-02 Corporate Vision Engine — Grand King acceptance",
      status: "pending",
      reviewer: "Grand King",
      duePhase: "Vision Integrity Review",
    },
    {
      id: "cve-rev-e1-03",
      title: "E1-03 Strategic Objective Engine — vision alignment review",
      status: "pending",
      reviewer: "Pillow · VIE",
      duePhase: "Vision Synchronization",
    },
  ];

  const drift = vie.currentDrift as string[] | undefined;
  if (drift?.length) {
    reviews.push({
      id: "cve-rev-drift",
      title: `Vision drift review — ${drift.length} signal(s)`,
      status: "pending",
      reviewer: "VIE",
      duePhase: "Vision Integrity Review",
    });
  }

  return reviews.slice(0, 6);
}

function buildRecommendations(input: {
  vie?: Record<string, unknown>;
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  grandKing?: GrandKingOperatingAccount | null;
}): VisionRecommendation[] {
  const recs: VisionRecommendation[] = [];
  const vie = input.vie ?? {};

  for (const title of (vie.currentRecommendations as string[] | undefined) ?? []) {
    recs.push({
      id: `cve-rec-vie-${recs.length}`,
      title: title.slice(0, 120),
      category: "integrity",
      why: "VIE continuous validation of Vision alignment",
      what: title,
      how: "Vision Sync → Integrity Review → Accumulation",
      confidencePercent: 85,
    });
  }

  for (const rec of input.executiveArchitecture?.executiveRecommendations.slice(0, 3) ?? []) {
    recs.push({
      id: `cve-rec-eaf-${recs.length}`,
      title: rec.title,
      category: "executive",
      why: rec.why,
      what: rec.what,
      how: rec.how,
      confidencePercent: rec.confidencePercent,
    });
  }

  for (const title of input.grandKing?.recommendations.slice(0, 2) ?? []) {
    recs.push({
      id: `cve-rec-gk-${recs.length}`,
      title: title.slice(0, 120),
      category: "strategic",
      why: "Grand King strategic direction",
      what: title,
      how: "Vision Accumulation → Executive Planning",
      confidencePercent: 80,
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: "cve-rec-default",
      title: "Proceed to E1-03 Strategic Objective Engine",
      category: "vision",
      why: "Corporate Vision Engine established — objectives require vision sync",
      what: "Implement Strategic Objective Engine under Corporate Vision",
      how: "Vision Sync → Objective Definition → Executive Approval",
      confidencePercent: 90,
    });
  }

  return recs.slice(0, 12);
}

function buildPillowEvaluations(input: {
  vie?: Record<string, unknown>;
  healthMetrics: VisionHealthMetric[];
  recommendations: VisionRecommendation[];
}): PillowVisionEvaluationMetric[] {
  const vie = input.vie ?? {};
  const driftCount = Array.isArray(vie.currentDrift) ? vie.currentDrift.length : 0;

  const values: Record<string, { status: string; summary: string }> = {
    vision_quality: {
      status: "strong",
      summary: "Canonical EMPIREAI_VISION.md · P1-01 · CON-001 active",
    },
    vision_drift: {
      status: driftCount === 0 ? "none" : "attention",
      summary: driftCount === 0 ? "No drift detected" : `${driftCount} drift signal(s)`,
    },
    vision_completeness: {
      status: "complete",
      summary: "WHY · WHAT · HOW · structure · accumulation channels active",
    },
    future_direction: {
      status: "E1 Executive Programme",
      summary: "E1-03 Strategic Objective Engine · E1 Corporate Vision maturity",
    },
    strategic_opportunities: {
      status: "evaluating",
      summary: `${input.recommendations.length} vision recommendations queued`,
    },
    vision_recommendations: {
      status: "active",
      summary: `Health score avg: ${Math.round(input.healthMetrics.reduce((s, m) => s + m.score, 0) / input.healthMetrics.length)}/100`,
    },
  };

  return PILLOW_VISION_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "monitoring",
    summary: values[domain]?.summary ?? "Pillow vision evaluation active",
  }));
}

export function assembleCorporateVisionEngine(input: {
  executiveArchitecture?: ExecutiveArchitectureFramework | null;
  empireEvolution?: EmpireEvolutionArchitecture | null;
  grandKing?: GrandKingOperatingAccount | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
  visionSync?: Record<string, unknown>;
  contextSync?: Record<string, unknown>;
}): CorporateVisionEngine {
  const vie = input.vie ?? {};
  const executiveArchitecture = input.executiveArchitecture;
  const empireEvolution = input.empireEvolution;
  const grandKing = input.grandKing;

  const visionHealthMetrics = buildVisionHealthMetrics({
    vie,
    executiveArchitecture,
    empireEvolution,
  });

  const healthScore = Math.round(
    visionHealthMetrics.reduce((sum, m) => sum + m.score, 0) / visionHealthMetrics.length,
  );

  const visionAccumulations = buildVisionAccumulations({
    journey: input.journey,
    grandKing,
    empireEvolution,
  });

  const visionRecommendations = buildRecommendations({
    vie,
    executiveArchitecture,
    grandKing,
  });

  const pillowEvaluations = buildPillowEvaluations({
    vie,
    healthMetrics: visionHealthMetrics,
    recommendations: visionRecommendations,
  });

  const visionSyncSuccess =
    input.visionSync?.success === true || input.visionSync?.lastSyncSuccess === true;
  const activeSyncPhase: VisionSyncPhase = visionSyncSuccess
    ? "context_synchronization"
    : "vision_synchronization";

  const visionSyncPipeline = buildVisionSyncPipeline(activeSyncPhase, visionSyncSuccess);
  const activeSyncStep = visionSyncPipeline.find((s) => s.status === "active");

  const visionWhy =
    (input.visionSync?.currentWhy as string | undefined) ??
    (input.visionSync?.missionContext as { why?: string } | undefined)?.why ??
    CANONICAL_VISION_WHY;

  const visionWhat =
    (input.visionSync?.missionContext as { what?: string } | undefined)?.what ??
    CANONICAL_VISION_WHAT;

  const visionHow =
    (input.visionSync?.missionContext as { how?: string } | undefined)?.how ??
    CANONICAL_VISION_HOW;

  const pillowAdvisory = [
    `Vision health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `Vision alignment: ${String(vie.visionAlignment ?? vie.approvalStatus ?? "aligned")}`,
    `Sync status: ${activeSyncStep?.label ?? "Vision Synchronization required"}`,
    `Accumulation: ${visionAccumulations.filter((a) => a.disposition === "Approved").length} approved items`,
    `ECC gate: ${visionSyncSuccess ? "Vision Sync passed — execution permitted" : "Vision Sync required before executive execution"}`,
    `No executive mission shall bypass Vision Synchronization`,
    `Ready for E1-03 Strategic Objective Engine`,
  ];

  return {
    architectureVersion: "E1-02",
    computedAt: new Date().toISOString(),
    visionSummary:
      "One permanent Corporate Vision Engine — highest executive planning authority beneath the Constitution · continuously accumulates validated strategic direction · every future mission begins with Vision Synchronization",
    currentVision: CANONICAL_VISION_WHY.slice(0, 200),
    visionWhy,
    visionWhat,
    visionHow,
    strategicDirection:
      executiveArchitecture?.strategicDirection ??
      empireEvolution?.strategicDirection ??
      "E1 Executive Programme · manufacture companies · compound commercial judgment",
    executivePurpose:
      grandKing?.grandKingSummary?.slice(0, 160) ??
      "Grand King sovereign authority · USD 100,000 net profit mission · executive intelligence amplification",
    visionHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    visionAlignment: String(vie.visionAlignment ?? vie.approvalStatus ?? "aligned"),
    visionGrowth: `${visionAccumulations.filter((a) => a.disposition === "Approved").length} accumulated · register active`,
    healthScore,
    visionSyncRequired: !visionSyncSuccess,
    visionSyncStatus: activeSyncStep
      ? `${activeSyncStep.label} · ${visionSyncPipeline.filter((s) => s.status === "complete").length}/${visionSyncPipeline.length} phases`
      : "Vision Synchronization required",
    eccVisionGate: visionSyncSuccess
      ? "passed · ECC may proceed to executive execution"
      : "blocked · Vision Synchronization required (ECC-DP-002)",
    currentObjectives:
      executiveArchitecture?.currentObjectives.map((o) => o.title) ?? [
        "E1-02 Corporate Vision Engine",
        "E1-03 Strategic Objective Engine",
      ],
    longTermGoals: [
      "USD 100,000 cumulative net profit (MS-A)",
      "Commerce Operating Intelligence",
      "Multiple profitable companies under Grand King sovereignty",
      "MS-B gate for public rollout (USD 1,000,000)",
    ],
    futureProgrammes: [
      "E1-03 Strategic Objective Engine",
      "E1 Executive Planning programme",
      "Business Factory scale",
      "Continuous Empire Evolution",
    ],
    visionStructure: buildVisionStructure({ executiveArchitecture, empireEvolution, journey: input.journey }),
    visionSyncPipeline,
    visionHealthMetrics,
    visionAccumulations,
    recentVisionAdditions: buildRecentAdditions(visionAccumulations),
    pendingVisionReviews: buildPendingReviews({ vie }),
    visionRecommendations,
    pillowEvaluations,
    visionPrinciples: [...VISION_PRINCIPLES],
    governedDomains: [...VISION_GOVERNED_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveArchitecture: executiveArchitecture
        ? `E1-01 · ${executiveArchitecture.executiveHealth}`
        : "standby",
      visionIntegrityEngine: String(vie.approvalStatus ?? "VIE · P6-02 active"),
      visionSynchronization: String(
        input.visionSync?.status ?? input.visionSync?.doctrinePath ?? "P4-02 · PILLOW-VS-001",
      ),
      contextSynchronization: String(input.contextSync?.status ?? "P4-03 · context sync"),
      soulFile: "EMPIREAI_SOUL.md · P1-04 identity memory",
      visionFile: "EMPIREAI_VISION.md · P1-01 · CON-001",
      visionAccumulation: "P1-03 · accumulation register active",
      journeyStatus: String(input.journey?.currentJourney ?? "E1 Executive Planning"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "Vision gate enforced"),
      empireEvolution: empireEvolution
        ? `P9-05 · ${empireEvolution.empireHealth}`
        : "standby",
    },
    readyForE103: true,
  };
}

export function buildFallbackCorporateVisionEngine(): CorporateVisionEngine {
  return assembleCorporateVisionEngine({});
}
