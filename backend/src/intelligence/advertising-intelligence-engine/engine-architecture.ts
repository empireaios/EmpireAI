/**
 * G3-06 — Advertising Intelligence Engine · Architecture Layer
 * Executive AI Engine for registry-driven ad campaign optimisation.
 * Architecture only — no live advertising API connections in G3-06.
 */

import { buildMarketIntelligenceDiscoveryView, getRegistryLoader } from "../../registry/index.js";
import { REG_COUNTRY } from "../../registry/types/registry-ids.js";
import { loadAdvertisingCatalogRows } from "../../registry/sources/platform-catalog-source.js";
import type { ProviderEntry } from "../../runtime/global-commerce/models/global-registry.js";
import type { Country } from "../../runtime/global-commerce/models/global-registry.js";
import { loadAdsView, loadFinanceView, loadMarketingView } from "../../domain/services/module-views.js";
import { loadFinancialIntelligenceEngineViewForWorkspace } from "../../domain/services/financial-intelligence-engine-views.js";
import { loadQuantitativeIntelligenceEngineViewForWorkspace } from "../../domain/services/quantitative-intelligence-engine-views.js";
import { AdRepository } from "../../domain/repositories/ad-repository.js";

const ads = new AdRepository();

export const G3_06_SCHEMA_VERSION = "g3-06-v1" as const;

export type AdvertisingIntelligenceRecommendation = "SCALE" | "MAINTAIN" | "PAUSE" | "TEST";

export type AdvertisingIntelligenceEvidence = {
  source: string;
  label: string;
  value: string;
  href?: string | null;
};

/** G3-06 — Every analysed campaign/channel exposes this contract. */
export type AdvertisingIntelligenceAnalysisContract = {
  campaignId: string;
  campaignName: string;
  channelId: string | null;
  registryProviderId: string | null;
  advertisingScore: number;
  roas: number;
  cacScore: number;
  budgetAllocationScore: number;
  scalingScore: number;
  confidence: number;
  supportingEvidence: AdvertisingIntelligenceEvidence[];
  recommendedAction: string;
  recommendation: AdvertisingIntelligenceRecommendation;
  computedAt: string;
};

export type AdvertisingIntelligenceCapabilityId =
  | "budget_allocation"
  | "creative_performance"
  | "audience_analysis"
  | "campaign_comparison"
  | "cac_analysis"
  | "roas_analysis"
  | "scaling_opportunities"
  | "executive_recommendations";

export type AdvertisingIntelligenceCapabilityDefinition = {
  id: AdvertisingIntelligenceCapabilityId;
  label: string;
  description: string;
  implementationStatus: "live" | "partial" | "architecture";
  dataMode: "mock" | "domain-store" | "registry" | "derived";
};

export type AdvertisingIntelligenceEngineIntegrationId =
  | "advertising-engine"
  | "financial-intelligence-engine"
  | "quantitative-intelligence-engine"
  | "analytics-engine";

export type AdvertisingIntelligenceEngineIntegration = {
  engineId: AdvertisingIntelligenceEngineIntegrationId;
  label: string;
  relationship: "feeds" | "consumes" | "validates" | "reports";
  description: string;
  cockpitRoute: string;
  brainModule: string;
};

export type AdvertisingDiscoveryView = {
  computedAt: string;
  registrySource: "RegistryLoader:advertising-discovery-composite";
  advertisingProviders: ProviderEntry[];
  advertisingCountries: Country[];
  marketChannelCount: number;
};

export type CampaignComparisonRow = {
  campaignId: string;
  campaignName: string;
  advertisingScore: number;
  roas: number;
  cacScore: number;
  rank: number;
  recommendation: AdvertisingIntelligenceRecommendation;
};

export type AdvertisingIntelligenceEngineArchitecture = {
  schemaVersion: typeof G3_06_SCHEMA_VERSION;
  computedAt: string;
  engineId: "advertising-intelligence-engine";
  displayName: string;
  missionRef: "G3-06";
  scopeGate: string;
  advertisingDiscovery: AdvertisingDiscoveryView;
  capabilities: AdvertisingIntelligenceCapabilityDefinition[];
  integrations: AdvertisingIntelligenceEngineIntegration[];
  dataFlow: Array<{ stage: string; from: string; to: string; description: string }>;
  futureExpansion: string[];
};

export type AdvertisingIntelligenceEngineView = {
  architecture: AdvertisingIntelligenceEngineArchitecture;
  analysedCampaigns: AdvertisingIntelligenceAnalysisContract[];
  topPerformers: AdvertisingIntelligenceAnalysisContract[];
  campaignComparison: CampaignComparisonRow[];
  executiveSummary: string;
  nextExecutiveAction: string;
};

export const G3_06_CAPABILITIES: readonly AdvertisingIntelligenceCapabilityDefinition[] = [
  {
    id: "budget_allocation",
    label: "Budget allocation",
    description: "Optimal budget weight by channel ROAS and spend efficiency",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "creative_performance",
    label: "Creative performance",
    description: "Campaign conversion and reach signals as creative proxy",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "audience_analysis",
    label: "Audience analysis",
    description: "Registry advertising-country coverage and audience reach potential",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "campaign_comparison",
    label: "Campaign comparison",
    description: "Ranked side-by-side campaign scorecards",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "cac_analysis",
    label: "CAC",
    description: "Customer acquisition cost index from spend and conversion signals",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "roas_analysis",
    label: "ROAS",
    description: "Return on ad spend from domain store and channel aggregates",
    implementationStatus: "live",
    dataMode: "domain-store",
  },
  {
    id: "scaling_opportunities",
    label: "Scaling opportunities",
    description: "Composite scaling score from ROAS, CAC, and QIE probability inputs",
    implementationStatus: "partial",
    dataMode: "derived",
  },
  {
    id: "executive_recommendations",
    label: "Executive recommendations",
    description: "SCALE / MAINTAIN / PAUSE / TEST with recommended next action",
    implementationStatus: "live",
    dataMode: "derived",
  },
];

export const G3_06_ENGINE_INTEGRATIONS: readonly AdvertisingIntelligenceEngineIntegration[] = [
  {
    engineId: "advertising-engine",
    label: "Advertising Engine",
    relationship: "feeds",
    description: "Campaign domain store, ad channels, and spend telemetry",
    cockpitRoute: "/cockpit/commerce/marketing",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "financial-intelligence-engine",
    label: "Financial Intelligence Engine",
    relationship: "validates",
    description: "Financial ROI and margin context for ad spend feasibility",
    cockpitRoute: "/cockpit/finance/intelligence",
    brainModule: "financial-intelligence-engine",
  },
  {
    engineId: "quantitative-intelligence-engine",
    label: "Quantitative Intelligence Engine",
    relationship: "consumes",
    description: "Probability and forecast models for scaling confidence",
    cockpitRoute: "/cockpit/intelligence/discovery",
    brainModule: "quantitative-intelligence-engine",
  },
  {
    engineId: "analytics-engine",
    label: "Analytics Engine",
    relationship: "reports",
    description: "Order profit and revenue validation for ROAS cross-check",
    cockpitRoute: "/cockpit/finance/profit",
    brainModule: "cockpit-engine",
  },
];

export const G3_06_DATA_FLOW: AdvertisingIntelligenceEngineArchitecture["dataFlow"] = [
  {
    stage: "1 — Discovery",
    from: "RegistryLoader → advertising providers + advertising countries",
    to: "Campaign universe",
    description: "Ad platforms and geo coverage discovered dynamically",
  },
  {
    stage: "2 — Domain overlay",
    from: "Ads + marketing domain store",
    to: "Campaign metrics",
    description: "Spend, ROAS, conversion, and reach signals",
  },
  {
    stage: "3 — Cross-engine inputs",
    from: "FIE + QIE + analytics",
    to: "Scaling and CAC context",
    description: "Financial, mathematical, and revenue validation inputs",
  },
  {
    stage: "4 — Scoring",
    from: "Discovery + domain + cross-engine",
    to: "AdvertisingIntelligenceAnalysisContract",
    description: "ROAS, CAC, budget allocation, scaling, executive recommendation",
  },
  {
    stage: "5 — Executive output",
    from: "Analysis contract",
    to: "Cockpit SCR-106 + Advertising Engine",
    description: "SCALE / MAINTAIN / PAUSE / TEST per analysed campaign",
  },
];

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function parseConversionPct(conversion: string): number {
  const parsed = Number.parseFloat(conversion.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildAdvertisingIntelligenceDiscoveryView(): AdvertisingDiscoveryView {
  const marketDiscovery = buildMarketIntelligenceDiscoveryView({});
  const advertisingProviders = loadAdvertisingCatalogRows();
  const advertisingCountries = (getRegistryLoader().resolve({}, REG_COUNTRY).rows as Country[]).filter(
    (c) => c.commerceDomains.includes("advertising"),
  );

  return {
    computedAt: new Date().toISOString(),
    registrySource: "RegistryLoader:advertising-discovery-composite",
    advertisingProviders,
    advertisingCountries,
    marketChannelCount: marketDiscovery.intelligenceSources.length,
  };
}

type RegistryCampaignUnit = {
  campaignId: string;
  campaignName: string;
  channel: string;
  registryProviderId: string | null;
  roas: number;
  spendCents: number;
  conversionPct: number;
  reach: string;
  status: string;
  source: "domain-store" | "registry-architecture";
};

function normalizeChannelKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchProviderForChannel(
  channel: string,
  providers: ProviderEntry[],
): ProviderEntry | undefined {
  const key = normalizeChannelKey(channel);
  return providers.find((p) => {
    const providerKey = normalizeChannelKey(p.displayName);
    const realityKey = p.realityProviderId ? normalizeChannelKey(p.realityProviderId) : "";
    return key.includes(providerKey) || providerKey.includes(key) || (realityKey && key.includes(realityKey));
  });
}

export function resolveRegistryDiscoveredCampaigns(
  workspaceId: string,
  discovery: AdvertisingDiscoveryView = buildAdvertisingIntelligenceDiscoveryView(),
): RegistryCampaignUnit[] {
  const marketing = loadMarketingView(workspaceId);
  const adChannels = ads.listByWorkspace(workspaceId);
  const seen = new Set<string>();
  const units: RegistryCampaignUnit[] = [];

  for (const campaign of marketing.campaigns) {
    const adChannel = adChannels.find(
      (a) => normalizeChannelKey(a.channel) === normalizeChannelKey(campaign.channel),
    );
    const provider = matchProviderForChannel(campaign.channel, discovery.advertisingProviders);
    units.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      channel: campaign.channel,
      registryProviderId: provider?.providerId ?? null,
      roas: adChannel?.roas ?? 1.5,
      spendCents: adChannel?.spendCents ?? 0,
      conversionPct: parseConversionPct(campaign.conversion),
      reach: campaign.reach,
      status: campaign.status,
      source: "domain-store",
    });
    seen.add(campaign.id);
  }

  for (const ad of adChannels) {
    if (units.some((u) => normalizeChannelKey(u.channel) === normalizeChannelKey(ad.channel))) continue;
    const provider = matchProviderForChannel(ad.channel, discovery.advertisingProviders);
    units.push({
      campaignId: ad.id,
      campaignName: `${ad.channel} Channel`,
      channel: ad.channel,
      registryProviderId: provider?.providerId ?? null,
      roas: ad.roas,
      spendCents: ad.spendCents,
      conversionPct: 2.5,
      reach: "—",
      status: ad.status,
      source: "domain-store",
    });
    seen.add(ad.id);
  }

  for (const provider of discovery.advertisingProviders) {
    const already = units.some((u) => u.registryProviderId === provider.providerId);
    if (already) continue;
    units.push({
      campaignId: `reg:${provider.providerId}`,
      campaignName: `${provider.displayName} (architecture)`,
      channel: provider.displayName,
      registryProviderId: provider.providerId,
      roas: 2,
      spendCents: 0,
      conversionPct: 0,
      reach: "—",
      status: "architecture",
      source: "registry-architecture",
    });
  }

  return units;
}

function deriveCacScore(spendCents: number, conversionPct: number, conversions: number): number {
  const effectiveConversions = conversionPct > 0 ? Math.max(1, conversions) : Math.max(1, conversions);
  const cacCents = spendCents > 0 ? spendCents / effectiveConversions : 5000;
  if (cacCents <= 800) return 95;
  if (cacCents <= 1500) return 82;
  if (cacCents <= 3000) return 65;
  if (cacCents <= 6000) return 45;
  return 25;
}

function recommendationFromScores(
  advertisingScore: number,
  roas: number,
  scalingScore: number,
  status: string,
): AdvertisingIntelligenceRecommendation {
  if (status === "architecture" || status === "Paused") return "TEST";
  if (advertisingScore >= 72 && roas >= 2.5 && scalingScore >= 65) return "SCALE";
  if (advertisingScore >= 50 && roas >= 1.5) return "MAINTAIN";
  if (advertisingScore < 40 || roas < 1) return "PAUSE";
  return "TEST";
}

function recommendedActionFromContract(contract: AdvertisingIntelligenceAnalysisContract): string {
  const { recommendation, campaignName, roas, advertisingScore } = contract;
  if (recommendation === "SCALE") {
    return `Scale ${campaignName} — ROAS ${roas.toFixed(1)}×, ad score ${advertisingScore}`;
  }
  if (recommendation === "MAINTAIN") {
    return `Maintain spend on ${campaignName} — monitor ROAS ${roas.toFixed(1)}×`;
  }
  if (recommendation === "PAUSE") {
    return `Pause or restructure ${campaignName} — ad score ${advertisingScore} below threshold`;
  }
  return `Test creative and audience variants for ${campaignName} before scaling`;
}

function analyseCampaignUnit(
  unit: RegistryCampaignUnit,
  discovery: AdvertisingDiscoveryView,
  crossSignals: {
    qieProbability: number;
    financialScore: number;
    adStats: ReturnType<typeof ads.statsForWorkspace>;
    audienceReachCountries: number;
  },
): AdvertisingIntelligenceAnalysisContract {
  const roas = unit.roas;
  const cacScore = deriveCacScore(unit.spendCents, unit.conversionPct, crossSignals.adStats.conversions);
  const creativeScore = clampScore(unit.conversionPct * 8 + (unit.reach !== "—" ? 15 : 5));
  const budgetAllocationScore = clampScore(
    roas >= 3 ? 88 : roas >= 2 ? 72 : roas >= 1.5 ? 55 : 35,
  );
  const audienceScore = clampScore(
    Math.min(100, crossSignals.audienceReachCountries * 6 + (unit.registryProviderId ? 20 : 10)),
  );
  const scalingScore = clampScore(
    roas * 15 + cacScore * 0.25 + crossSignals.qieProbability * 30 + crossSignals.financialScore * 0.15,
  );
  const advertisingScore = clampScore(
    roas * 20 + cacScore * 0.2 + budgetAllocationScore * 0.2 + creativeScore * 0.15 + scalingScore * 0.15,
  );
  const confidence = clampScore(
    (unit.source === "domain-store" ? 78 : 48) +
      (unit.registryProviderId ? 10 : 0) +
      (unit.spendCents > 0 ? 8 : 0),
  );
  const recommendation = recommendationFromScores(advertisingScore, roas, scalingScore, unit.status);
  const computedAt = new Date().toISOString();

  const contract: AdvertisingIntelligenceAnalysisContract = {
    campaignId: unit.campaignId,
    campaignName: unit.campaignName,
    channelId: unit.channel,
    registryProviderId: unit.registryProviderId,
    advertisingScore,
    roas: Number(roas.toFixed(2)),
    cacScore,
    budgetAllocationScore,
    scalingScore,
    confidence,
    supportingEvidence: [
      { source: "domain", label: "Spend", value: String(unit.spendCents) },
      { source: "domain", label: "Conversion", value: `${unit.conversionPct}%` },
      { source: "domain", label: "Creative proxy", value: String(creativeScore) },
      { source: "registry", label: "Ad provider", value: unit.registryProviderId ?? "unmapped" },
      { source: "registry", label: "Audience countries", value: String(crossSignals.audienceReachCountries) },
      { source: "qie", label: "Probability input", value: String(crossSignals.qieProbability.toFixed(2)) },
      { source: "fie", label: "Financial score input", value: String(crossSignals.financialScore) },
    ],
    recommendedAction: "",
    recommendation,
    computedAt,
  };
  contract.recommendedAction = recommendedActionFromContract(contract);
  return contract;
}

export function rankAdvertisingAnalysisContracts(
  campaigns: AdvertisingIntelligenceAnalysisContract[],
): AdvertisingIntelligenceAnalysisContract[] {
  return [...campaigns].sort((a, b) => {
    const scoreA = a.advertisingScore * 0.4 + a.roas * 10 + a.scalingScore * 0.2 - (100 - a.cacScore) * 0.1;
    const scoreB = b.advertisingScore * 0.4 + b.roas * 10 + b.scalingScore * 0.2 - (100 - b.cacScore) * 0.1;
    return scoreB - scoreA;
  });
}

export function buildCampaignComparison(
  campaigns: AdvertisingIntelligenceAnalysisContract[],
): CampaignComparisonRow[] {
  return rankAdvertisingAnalysisContracts(campaigns).map((campaign, index) => ({
    campaignId: campaign.campaignId,
    campaignName: campaign.campaignName,
    advertisingScore: campaign.advertisingScore,
    roas: campaign.roas,
    cacScore: campaign.cacScore,
    rank: index + 1,
    recommendation: campaign.recommendation,
  }));
}

export function buildAdvertisingIntelligenceEngineArchitecture(): AdvertisingIntelligenceEngineArchitecture {
  const advertisingDiscovery = buildAdvertisingIntelligenceDiscoveryView();
  return {
    schemaVersion: G3_06_SCHEMA_VERSION,
    computedAt: new Date().toISOString(),
    engineId: "advertising-intelligence-engine",
    displayName: "Advertising Intelligence Engine",
    missionRef: "G3-06",
    scopeGate: "Architecture only — no live advertising API connections in G3-06",
    advertisingDiscovery,
    capabilities: [...G3_06_CAPABILITIES],
    integrations: [...G3_06_ENGINE_INTEGRATIONS],
    dataFlow: G3_06_DATA_FLOW,
    futureExpansion: [
      ...advertisingDiscovery.advertisingProviders.slice(0, 4).map(
        (p) => `${p.displayName} (${p.providerId}) — registry ad platform`,
      ),
      "Live Meta / Google Ads API signal ingestion",
      "Creative asset performance from ad platform webhooks",
      "Append REG advertising provider row without engine code change",
    ],
  };
}

export function loadAdvertisingIntelligenceEngineView(workspaceId: string): AdvertisingIntelligenceEngineView {
  const architecture = buildAdvertisingIntelligenceEngineArchitecture();
  const discovery = architecture.advertisingDiscovery;
  const units = resolveRegistryDiscoveredCampaigns(workspaceId, discovery);

  const qie = loadQuantitativeIntelligenceEngineViewForWorkspace(workspaceId);
  const probModel = qie.modelResults.find((r) => r.modelKind === "probability");
  const qieProbability = Number(probModel?.outputs.probabilityAboveThreshold ?? 0.5);

  const fie = loadFinancialIntelligenceEngineViewForWorkspace(workspaceId);
  const financialScore = fie.workspaceSummary?.financialScore ?? 50;

  const adStats = ads.statsForWorkspace(workspaceId);
  loadFinanceView(workspaceId);

  const crossSignals = {
    qieProbability,
    financialScore,
    adStats,
    audienceReachCountries: discovery.advertisingCountries.length,
  };

  const analysedCampaigns = units.map((unit) => analyseCampaignUnit(unit, discovery, crossSignals));
  const topPerformers = rankAdvertisingAnalysisContracts(analysedCampaigns).slice(0, 12);
  const scaleCount = analysedCampaigns.filter((c) => c.recommendation === "SCALE").length;

  return {
    architecture,
    analysedCampaigns,
    topPerformers,
    campaignComparison: buildCampaignComparison(analysedCampaigns),
    executiveSummary: `${analysedCampaigns.length} campaigns analysed · ${scaleCount} SCALE recommendations · ${discovery.advertisingProviders.length} registry ad providers · blended ROAS ${adStats.blendedRoas.toFixed(1)}×`,
    nextExecutiveAction:
      topPerformers[0]?.recommendedAction ??
      "Seed marketing campaigns in domain store to activate advertising analysis",
  };
}
