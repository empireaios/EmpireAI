import type { BusinessFactoryArchitecture } from "../business-factory/types.js";
import type { CommerceOperatingModel } from "../commerce-operating-model/types.js";
import type { BusinessAutomationArchitecture } from "../business-automation/types.js";
import type { CommercialIntelligenceArchitecture } from "../commercial-intelligence/types.js";
import type { LiveEtaExperience } from "../live-eta/types.js";
import {
  GRAND_KING_ACCOUNT_ID,
  GRAND_KING_WORKSPACE_ID,
  GRAND_KING_GOVERNED_DOMAINS,
  GRAND_KING_RESPONSIBILITIES,
  EMPIREAI_RESPONSIBILITIES,
  GRAND_KING_EXPERIENCE_STACK,
  PRODUCTION_REQUIREMENTS,
} from "./paths.js";
import type {
  GrandKingOperatingAccount,
  GrandKingExperienceLayerView,
  GrandKingPortfolioBusiness,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const EXPERIENCE_ROUTES: Record<string, { route: string; label: string }> = {
  founder_shell: { route: "/cockpit", label: "Founder Shell" },
  executive_home: { route: "/cockpit", label: "Executive Home" },
  pillow: { route: "/cockpit/development/pillow", label: "Pillow" },
  executive_cockpit: { route: "/cockpit", label: "Executive Cockpit" },
  builder_console: { route: "/cockpit/founder/builder", label: "Builder Console" },
  journey: { route: "/cockpit/founder/journey", label: "Journey" },
  business_factory: { route: "/cockpit/commerce/factory", label: "Business Factory" },
  commerce: { route: "/cockpit/commerce/operating", label: "Commerce" },
  commercial_intelligence: { route: "/cockpit/commerce/intelligence", label: "Commercial Intelligence" },
  production: { route: "/cockpit/founder/production", label: "Production" },
};

function buildExperienceStack(input: {
  founderShell?: Record<string, unknown>;
  factory?: BusinessFactoryArchitecture | null;
  commerce?: CommerceOperatingModel | null;
  intelligence?: CommercialIntelligenceArchitecture | null;
}): GrandKingExperienceLayerView[] {
  return GRAND_KING_EXPERIENCE_STACK.map((layer) => {
    const meta = EXPERIENCE_ROUTES[layer] ?? { route: "/cockpit", label: label(layer) };
    let status = "integrated";
    let summary = "Constitutional layer active";

    switch (layer) {
      case "founder_shell":
        status = String(input.founderShell?.shellHealth ?? "active");
        summary = String(input.founderShell?.grandKingSummary ?? "Founder Shell — one login · one workspace");
        break;
      case "business_factory":
        status = input.factory?.currentFactoryStage ?? "ready";
        summary = `${input.factory?.activeBusinessCount ?? 0} businesses in factory pipeline`;
        break;
      case "commerce":
        status = input.commerce?.commerceHealth ?? "building";
        summary = input.commerce?.revenueSummary ?? "Commerce operating model";
        break;
      case "commercial_intelligence":
        status = input.intelligence?.integrations.intelligenceEngine ?? "standby";
        summary = `${input.intelligence?.winningProducts.length ?? 0} winning products analysed`;
        break;
      case "production":
        summary = "Production Truth · Guardian · browser verification";
        break;
      default:
        break;
    }

    return { layer, label: meta.label, route: meta.route, status, summary };
  });
}

export function assembleGrandKingOperatingAccount(input: {
  founderShell?: Record<string, unknown>;
  factory?: BusinessFactoryArchitecture | null;
  commerce?: CommerceOperatingModel | null;
  automation?: BusinessAutomationArchitecture | null;
  intelligence?: CommercialIntelligenceArchitecture | null;
  liveEta?: LiveEtaExperience | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  production?: Record<string, unknown>;
}): GrandKingOperatingAccount {
  const founderShell = input.founderShell ?? {};
  const factory = input.factory;
  const commerce = input.commerce;
  const automation = input.automation;
  const intelligence = input.intelligence;
  const liveEta = input.liveEta;
  const journey = input.journey ?? {};
  const supervisor = input.supervisor ?? {};
  const guardian = input.guardian ?? {};
  const production = input.production ?? {};

  const executiveHome = (founderShell.executiveHome ?? {}) as Record<string, unknown>;
  const context = (founderShell.context ?? {}) as Record<string, unknown>;

  const portfolio: GrandKingPortfolioBusiness[] = (commerce?.businesses ?? factory?.businesses ?? []).map(
    (b) => ({
      id: b.id,
      name: b.name,
      stage: "lifecycleStage" in b ? String(b.lifecycleStage) : String(b.stage),
      revenue: "revenue" in b ? String(b.revenue) : "Pre-revenue",
      profit: "profit" in b ? String(b.profit) : "Pre-profit",
      health: "commerceHealth" in b ? String(b.commerceHealth) : String(b.health),
    }),
  );

  if (portfolio.length === 0) {
    portfolio.push({
      id: GRAND_KING_ACCOUNT_ID,
      name: "Grand King Portfolio",
      stage: "business_preparing",
      revenue: String(executiveHome.revenue ?? "Pre-revenue"),
      profit: "Pre-profit",
      health: String(executiveHome.businessStatus ?? "building"),
    });
  }

  const opportunities = [
    ...(intelligence?.currentOpportunities.map((o) => o.title) ?? []),
    ...(factory?.currentOpportunities ?? []),
    ...(commerce?.currentOpportunities ?? []),
  ].slice(0, 8);

  const risks = [
    ...(intelligence?.currentRisks.map((r) => r.title) ?? []),
    ...(factory?.currentRisks ?? []),
    ...(commerce?.currentRisks ?? []),
  ].slice(0, 8);

  const recommendations = [
    ...(intelligence?.recommendations.map((r) => r.title) ?? []),
    ...(automation?.pillow.recommendations ?? []),
    ...(intelligence?.pillow.strategicRecommendations ?? []),
  ].slice(0, 8);

  const pillowAdvisory = [
    "Business strategy aligned with Vision and Soul",
    "Architecture governed by Engineering Constitution",
    `Commerce: ${commerce?.commerceHealth ?? "building"}`,
    `Automation: ${automation?.automationLevel ?? "standby"}`,
    `Production: ${production.productionHealth ?? production.mode ?? "validated"}`,
    `Revenue trend: ${commerce?.revenueSummary ?? executiveHome.revenue ?? "Pre-revenue"}`,
    `Risk posture: ${risks.length} active signals`,
  ];

  const executiveControl = {
    empireHealth: String(guardian.overallHealth ?? founderShell.shellHealth ?? "healthy"),
    businessHealth: commerce?.commerceHealth ?? portfolio[0]?.health ?? "building",
    currentMission: String(
      supervisor.currentMission ?? journey.currentMission ?? context.currentMission ?? "Constitutional execution",
    ),
    journey: String(journey.currentJourney ?? context.currentJourney ?? "P8 Business"),
    eta: liveEta
      ? `${Math.round(liveEta.missionCountdown.remainingTimeMs / 60000)}m remaining · ${liveEta.confidence.confidencePercent}% confidence`
      : String(journey.eta ?? "Live ETA via Cockpit"),
    production: String(production.productionHealth ?? production.mode ?? "Production Truth active"),
    commerce: commerce?.commerceHealth ?? "building",
    revenue: commerce?.revenueSummary ?? String(executiveHome.revenue ?? "Pre-revenue"),
    profit: commerce?.profitSummary ?? "Pre-profit pipeline",
    recommendations,
    currentRisks: risks,
    currentOpportunities: opportunities,
  };

  return {
    architectureVersion: "P8-06",
    computedAt: new Date().toISOString(),
    accountId: GRAND_KING_ACCOUNT_ID,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    grandKingSummary:
      String(founderShell.grandKingSummary) ??
      intelligence?.grandKingSummary ??
      "Grand King Operating Account — constitutional production reference for EmpireAI-managed business",
    empireStatus: `${executiveControl.empireHealth} · ${portfolio.length} portfolio businesses`,
    businessPortfolio: portfolio,
    currentRevenue: executiveControl.revenue,
    currentProfit: executiveControl.profit,
    currentMission: executiveControl.currentMission,
    currentEta: executiveControl.eta,
    businessOpportunities: opportunities,
    businessRisks: risks,
    recommendations,
    productionHealth: executiveControl.production,
    executiveControl,
    experienceStack: buildExperienceStack({ founderShell, factory, commerce, intelligence }),
    governedDomains: [...GRAND_KING_GOVERNED_DOMAINS],
    grandKingResponsibilities: [...GRAND_KING_RESPONSIBILITIES],
    empireAiResponsibilities: [...EMPIREAI_RESPONSIBILITIES],
    productionRequirements: [...PRODUCTION_REQUIREMENTS],
    pillowAdvisory,
  };
}

export function buildFallbackGrandKingOperatingAccount(): GrandKingOperatingAccount {
  return assembleGrandKingOperatingAccount({
    founderShell: {
      grandKingSummary: "Start Pillow session for live Grand King Operating Account telemetry",
      shellHealth: "standby",
      executiveHome: { revenue: "Pre-revenue", businessStatus: "Portfolio building" },
    },
  });
}
