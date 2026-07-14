import {
  FACTORY_PIPELINE,
  FACTORY_PRINCIPLES,
  FACTORY_OUTPUTS,
  FACTORY_COORDINATED_SYSTEMS,
} from "./paths.js";
import type {
  BusinessFactoryArchitecture,
  FactoryBusinessRecord,
  FactoryBusinessStage,
  FactoryPipelinePhase,
  FactoryPipelineStageView,
} from "./types.js";

function labelPhase(phase: FactoryPipelinePhase): string {
  return phase.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function stageFromLaunchReadiness(readiness: string): FactoryBusinessStage {
  switch (readiness) {
    case "ready":
      return "business_launch_ready";
    case "conditional":
      return "business_preparing";
    default:
      return "business_constructing";
  }
}

function phaseFromStage(stage: FactoryBusinessStage): FactoryPipelinePhase {
  const map: Record<FactoryBusinessStage, FactoryPipelinePhase> = {
    business_idea: "business_opportunity",
    business_approved: "business_validation",
    business_constructing: "brand_creation",
    business_preparing: "marketing_preparation",
    business_launch_ready: "production_readiness",
    business_live: "business_operation",
    business_growing: "business_growth",
    business_optimising: "continuous_improvement",
    business_mature: "business_growth",
    business_historical: "continuous_improvement",
  };
  return map[stage];
}

function progressForStage(stage: FactoryBusinessStage): number {
  const order = [
    "business_idea",
    "business_approved",
    "business_constructing",
    "business_preparing",
    "business_launch_ready",
    "business_live",
    "business_growing",
    "business_optimising",
    "business_mature",
    "business_historical",
  ];
  const idx = order.indexOf(stage);
  return idx >= 0 ? Math.round(((idx + 1) / order.length) * 100) : 0;
}

function buildPipelineViews(activePhase: FactoryPipelinePhase): FactoryPipelineStageView[] {
  const activeIdx = FACTORY_PIPELINE.indexOf(activePhase);
  return FACTORY_PIPELINE.map((phase, i) => ({
    phase,
    label: labelPhase(phase),
    order: i + 1,
    status: i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending",
    description: `Factory stage ${i + 1} of ${FACTORY_PIPELINE.length}`,
  }));
}

function businessFromLaunchPlan(plan: {
  productId: string;
  storeConcept: string;
  brandPositioning: string;
  launchReadiness: string;
  marketingRecommendations?: string[];
}): FactoryBusinessRecord {
  const stage = stageFromLaunchReadiness(plan.launchReadiness);
  return {
    id: plan.productId,
    name: plan.storeConcept,
    stage,
    pipelinePhase: phaseFromStage(stage),
    progressPercent: progressForStage(stage),
    launchStatus: plan.launchReadiness.replace(/_/g, " "),
    health: plan.launchReadiness === "ready" ? "healthy" : "attention",
    revenue: "Pre-launch",
    growth: "Pipeline",
    brand: plan.brandPositioning,
    store: plan.storeConcept,
  };
}

export function assembleBusinessFactoryArchitecture(input: {
  commerceReport?: {
    launchPlans?: Array<{
      productId: string;
      storeConcept: string;
      brandPositioning: string;
      launchReadiness: string;
      marketingRecommendations?: string[];
    }>;
    recommendedActions?: string[];
    riskAssessment?: string;
    executiveBrief?: string;
    marketOpportunities?: Array<{ recommendation?: string }>;
    recommendedProducts?: Array<{ product?: { name?: string } }>;
  } | null;
  founderShell?: Record<string, unknown>;
  journey?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  vie?: Record<string, unknown>;
  production?: Record<string, unknown>;
}): BusinessFactoryArchitecture {
  const report = input.commerceReport;
  const founderShell = input.founderShell ?? {};
  const journey = input.journey ?? {};
  const ecc = input.ecc ?? {};
  const supervisor = input.supervisor ?? {};
  const guardian = input.guardian ?? {};
  const production = input.production ?? {};

  const executiveHome = (founderShell.executiveHome ?? {}) as Record<string, unknown>;
  const businesses: FactoryBusinessRecord[] = (report?.launchPlans ?? []).map(businessFromLaunchPlan);

  if (businesses.length === 0) {
    businesses.push({
      id: "portfolio-primary",
      name: String(executiveHome.businessStatus ?? "Empire Portfolio"),
      stage: "business_preparing",
      pipelinePhase: "commerce_configuration",
      progressPercent: 45,
      launchStatus: "conditional",
      health: String(executiveHome.businessStatus ?? "building"),
      revenue: String(executiveHome.revenue ?? "Pre-revenue"),
      growth: "Pipeline",
      brand: null,
      store: null,
    });
  }

  const liveCount = businesses.filter((b) =>
    ["business_live", "business_growing", "business_optimising", "business_mature"].includes(b.stage),
  ).length;

  const primary =
    businesses[0] ??
    ({
      id: "default",
      name: "Empire Portfolio",
      stage: "business_preparing" as const,
      pipelinePhase: "commerce_configuration" as const,
      progressPercent: 0,
      launchStatus: "pending",
      health: "unknown",
      revenue: "—",
      growth: "—",
      brand: null,
      store: null,
    } satisfies FactoryBusinessRecord);
  const currentFactoryStage = primary.stage;
  const pipeline = buildPipelineViews(primary.pipelinePhase);

  const opportunities = [
    ...(report?.marketOpportunities?.slice(0, 3).map((m) => m.recommendation ?? "Market opportunity") ?? []),
    ...(report?.recommendedProducts?.slice(0, 2).map((p) => p.product?.name ?? "Product opportunity") ?? []),
    ...(report?.recommendedActions ?? []).slice(0, 2),
  ].filter(Boolean);

  const risks = [
    report?.riskAssessment ?? "Standard pre-launch commerce risks",
    ...((guardian.analysis as { operationalRisks?: string[] })?.operationalRisks ?? []).slice(0, 2),
    ...((supervisor.currentRisks as string[]) ?? []).slice(0, 1),
  ].filter(Boolean);

  const pillowAnalysis = {
    opportunities,
    risks,
    improvements: [
      "Align business blueprint with Vision and Soul",
      "Validate commerce readiness before launch gate",
      ...(report?.recommendedActions ?? []).slice(0, 2),
    ],
    performance: [
      String(executiveHome.revenue ?? "Portfolio revenue tracking active"),
      `Active businesses: ${businesses.length} · Live: ${liveCount}`,
    ],
    growth: [
      "Replication path via Business Factory continuous improvement",
      String(journey.currentRoadmapItem ?? "Current roadmap item drives factory priority"),
    ],
    commercialRecommendations: report?.recommendedActions ?? ["Run commerce intelligence analysis"],
  };

  const coordination = FACTORY_COORDINATED_SYSTEMS.map((system) => {
    switch (system) {
      case "ECC":
        return {
          system,
          status: String(ecc.executionState ?? "coordinating"),
          summary: String(ecc.grandKingSummary ?? "Business creation scheduling and dependencies"),
          notes: ((ecc.analysis as { recommendations?: string[] })?.recommendations ?? []).slice(0, 2),
        };
      case "Supervisor":
        return {
          system,
          status: String(supervisor.missionHealth ?? "monitoring"),
          summary: String(supervisor.grandKingSummary ?? "Business creation progress supervision"),
          notes: [String(supervisor.progress ?? "—"), String(supervisor.currentStep ?? "—")],
        };
      case "Guardian":
        return {
          system,
          status: String(guardian.overallHealth ?? "monitoring"),
          summary: `Commerce ${guardian.runtimeHealth ?? "—"} · Production monitored`,
          notes: ((guardian.analysis as { recommendations?: string[] })?.recommendations ?? []).slice(0, 2),
        };
      case "Journey":
        return {
          system,
          status: String(journey.progress ?? 0) + "%",
          summary: `Journey ${journey.currentJourney ?? "—"} · ${journey.currentRoadmapItem ?? "—"}`,
          notes: ((journey.timeline as string[]) ?? []).slice(0, 2),
        };
      case "Production":
        return {
          system,
          status: String(production.productionHealth ?? production.mode ?? "validated"),
          summary: String(production.grandKingSummary ?? "Production readiness for business launch"),
          notes: [String(journey.productionStatus ?? "Pending validation")],
        };
      case "Pillow":
        return {
          system,
          status: "active",
          summary: String(founderShell.grandKingSummary ?? report?.executiveBrief ?? "Factory intelligence active"),
          notes: pillowAnalysis.commercialRecommendations.slice(0, 2),
        };
      default:
        return {
          system,
          status: "integrated",
          summary: `${system} coordinated via Business Factory architecture`,
          notes: [],
        };
    }
  });

  return {
    architectureVersion: "P8-01",
    computedAt: new Date().toISOString(),
    grandKingSummary:
      report?.executiveBrief ??
      String(founderShell.grandKingSummary) ??
      "Business Factory — manufacturing companies from vision through launch and growth",
    currentFactoryStage,
    pipelineProgressPercent: primary.progressPercent,
    activeBusinessCount: businesses.length,
    liveBusinessCount: liveCount,
    businesses,
    pipeline,
    principles: [...FACTORY_PRINCIPLES],
    outputs: [...FACTORY_OUTPUTS],
    launchStatus: primary.launchStatus,
    businessHealth: primary.health,
    revenueSummary: String(executiveHome.revenue ?? (liveCount > 0 ? "Live revenue tracking" : "Pre-revenue pipeline")),
    growthSummary: liveCount > 0 ? `${liveCount} live · growth phase` : "Pipeline growth — pre-launch",
    currentOpportunities: opportunities.slice(0, 6),
    currentRisks: risks.slice(0, 6),
    pillow: pillowAnalysis,
    coordination,
  };
}

export function buildFallbackBusinessFactoryArchitecture(): BusinessFactoryArchitecture {
  return assembleBusinessFactoryArchitecture({
    founderShell: {
      grandKingSummary: "Start Pillow session and run commerce intelligence for live factory pipeline",
      executiveHome: {
        businessStatus: "Portfolio building",
        revenue: "Pre-revenue",
      },
    },
  });
}
