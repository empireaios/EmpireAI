/**
 * G3-02 — Market Intelligence Engine · Architecture Layer
 * Executive AI Engine for market-level discovery, scoring, comparison, and recommendations.
 * Architecture only — no live API connections in G3-02.
 */

import { buildMarketIntelligenceDiscoveryView } from "../../registry/index.js";
import type { DiscoverySnapshotView, IntelligenceSourceDefinition } from "../../registry/index.js";
import { getCountryIntelligenceProfile } from "../../runtime/global-commerce-intelligence/services/country-intelligence-service.js";
import type { CountryIntelligenceDimensions } from "../../runtime/global-commerce-intelligence/models/country-intelligence.js";
import type { MarketplaceChannelProfile } from "../shared/marketplace-channel-registry.js";

export const G3_02_SCHEMA_VERSION = "g3-02-v1" as const;

export type MarketIntelligenceRecommendation = "ENTER" | "WATCH" | "AVOID" | "EXPAND";

export type MarketIntelligenceMarketKind = "channel" | "country";

export type MarketIntelligenceEvidence = {
  source: string;
  label: string;
  value: string;
  href?: string | null;
};

/** G3-02 — Every analysed market exposes this contract. */
export type MarketIntelligenceAnalysisContract = {
  marketId: string;
  marketName: string;
  marketKind: MarketIntelligenceMarketKind;
  countryCode: string | null;
  opportunityScore: number;
  growthScore: number;
  competitionScore: number;
  saturationScore: number;
  riskScore: number;
  confidence: number;
  supportingEvidence: MarketIntelligenceEvidence[];
  recommendedAction: string;
  recommendation: MarketIntelligenceRecommendation;
  computedAt: string;
};

/** G3-02 — Ten core engine capabilities. */
export type MarketIntelligenceCapabilityId =
  | "market_demand_analysis"
  | "category_trend_analysis"
  | "seasonal_opportunity_analysis"
  | "country_opportunity_analysis"
  | "marketplace_comparison"
  | "competition_density"
  | "category_saturation"
  | "growth_prediction"
  | "market_risk_assessment"
  | "executive_recommendations";

export type MarketIntelligenceCapabilityDefinition = {
  id: MarketIntelligenceCapabilityId;
  label: string;
  description: string;
  implementationStatus: "live" | "partial" | "architecture";
  dataMode: "mock" | "domain-store" | "registry" | "future";
};

export type MarketIntelligenceEngineIntegrationId =
  | "product-intelligence-engine"
  | "marketplace-engine"
  | "quantitative-intelligence-engine"
  | "analytics-engine"
  | "advertising-engine";

export type MarketIntelligenceEngineIntegration = {
  engineId: MarketIntelligenceEngineIntegrationId;
  label: string;
  relationship: "feeds" | "consumes" | "validates" | "reports";
  description: string;
  cockpitRoute: string;
  brainModule: string;
};

export type MarketplaceComparisonRow = {
  marketId: string;
  marketName: string;
  countryCode: string | null;
  opportunityScore: number;
  growthScore: number;
  competitionScore: number;
  rank: number;
};

export type MarketIntelligenceEngineArchitecture = {
  schemaVersion: typeof G3_02_SCHEMA_VERSION;
  computedAt: string;
  engineId: "market-intelligence-engine";
  displayName: string;
  missionRef: "G3-02";
  scopeGate: string;
  marketDiscovery: DiscoverySnapshotView;
  capabilities: MarketIntelligenceCapabilityDefinition[];
  integrations: MarketIntelligenceEngineIntegration[];
  dataFlow: Array<{ stage: string; from: string; to: string; description: string }>;
  futureExpansion: string[];
};

export type MarketIntelligenceEngineView = {
  architecture: MarketIntelligenceEngineArchitecture;
  analysedMarkets: MarketIntelligenceAnalysisContract[];
  topOpportunities: MarketIntelligenceAnalysisContract[];
  countryMarkets: MarketIntelligenceAnalysisContract[];
  channelMarkets: MarketIntelligenceAnalysisContract[];
  marketplaceComparison: MarketplaceComparisonRow[];
  executiveSummary: string;
  nextExecutiveAction: string;
};

export const G3_02_CAPABILITIES: readonly MarketIntelligenceCapabilityDefinition[] = [
  {
    id: "market_demand_analysis",
    label: "Market demand analysis",
    description: "Demand potential from country intelligence dimensions and e-commerce penetration",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "category_trend_analysis",
    label: "Category trend analysis",
    description: "Category momentum signals from Product Intelligence Engine catalog aggregates",
    implementationStatus: "architecture",
    dataMode: "domain-store",
  },
  {
    id: "seasonal_opportunity_analysis",
    label: "Seasonal opportunity analysis",
    description: "Deterministic seasonal curve applied to growth and opportunity scores",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "country_opportunity_analysis",
    label: "Country opportunity analysis",
    description: "Registry-discovered countries ranked by composite opportunity",
    implementationStatus: "live",
    dataMode: "registry",
  },
  {
    id: "marketplace_comparison",
    label: "Marketplace comparison",
    description: "Side-by-side channel and country market scores from discovery snapshot",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "competition_density",
    label: "Competition density",
    description: "Competition intensity and marketplace count per country",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "category_saturation",
    label: "Category saturation",
    description: "Marketplace density and maturity as saturation proxy",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "growth_prediction",
    label: "Growth prediction",
    description: "Growth score with seasonal modifier and emerging-market uplift",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "market_risk_assessment",
    label: "Market risk assessment",
    description: "Regulatory, tax, language, and cross-border risk composite",
    implementationStatus: "live",
    dataMode: "registry",
  },
  {
    id: "executive_recommendations",
    label: "Executive recommendations",
    description: "ENTER / WATCH / AVOID / EXPAND with recommended next action",
    implementationStatus: "live",
    dataMode: "registry",
  },
];

export const G3_02_ENGINE_INTEGRATIONS: readonly MarketIntelligenceEngineIntegration[] = [
  {
    engineId: "product-intelligence-engine",
    label: "Product Intelligence Engine",
    relationship: "feeds",
    description: "Product category aggregates and SKU-level demand for category trend signals",
    cockpitRoute: "/cockpit/intelligence/products",
    brainModule: "product-intelligence-engine",
  },
  {
    engineId: "marketplace-engine",
    label: "Marketplace Engine",
    relationship: "feeds",
    description: "Registry channel profiles, launch readiness, and marketplace health",
    cockpitRoute: "/cockpit/intelligence/marketplace",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "quantitative-intelligence-engine",
    label: "Quantitative Intelligence Engine",
    relationship: "consumes",
    description: "Consumes market opportunity scores for discovery board ranking",
    cockpitRoute: "/cockpit/intelligence/discovery",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "advertising-engine",
    label: "Advertising Engine",
    relationship: "validates",
    description: "Ad spend feasibility and campaign potential for priority markets",
    cockpitRoute: "/cockpit/commerce/marketing",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "analytics-engine",
    label: "Analytics Engine",
    relationship: "reports",
    description: "Revenue telemetry validation for launched market channels",
    cockpitRoute: "/cockpit/finance/profit",
    brainModule: "cockpit-engine",
  },
];

export const G3_02_DATA_FLOW: MarketIntelligenceEngineArchitecture["dataFlow"] = [
  {
    stage: "1 — Discovery",
    from: "RegistryLoader → DERIVED-DISCOVERY-SNAPSHOT",
    to: "Market universe",
    description: "Countries, deployment channels, and expansion marketplaces discovered dynamically",
  },
  {
    stage: "2 — Intelligence overlay",
    from: "Country Intelligence Engine",
    to: "Dimension signals",
    description: "Per-country maturity, growth, competition, saturation, and risk dimensions",
  },
  {
    stage: "3 — Market scoring",
    from: "Discovery + country dimensions + seasonal curve",
    to: "MarketIntelligenceAnalysisContract",
    description: "Eight-field contract computed per channel and country market",
  },
  {
    stage: "4 — Comparison",
    from: "Scored markets",
    to: "Marketplace comparison board",
    description: "Ranked side-by-side channel and country opportunities",
  },
  {
    stage: "5 — Executive output",
    from: "Analysis contract",
    to: "Cockpit SCR-104 + QIE + Global Assistant",
    description: "ENTER / WATCH / AVOID / EXPAND recommendations per market",
  },
  {
    stage: "6 — Engine integration",
    from: "Market rankings",
    to: "PIE · Marketplace · Ads · Analytics",
    description: "Downstream engines consume market priority signals (architecture wiring)",
  },
];

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function seasonalOpportunityModifier(month: number): number {
  const seasonalCurve = [0, -5, -3, 0, 2, 0, -2, -4, 2, 8, 12, 10];
  return seasonalCurve[month] ?? 0;
}

function resolveCountryDimensions(countryCode: string): {
  dimensions: CountryIntelligenceDimensions;
  confidenceBase: number;
  dataSource: string;
} {
  const profile = getCountryIntelligenceProfile(countryCode);
  if (!profile) {
    return {
      dimensions: {
        marketMaturity: 50,
        marketGrowth: 55,
        ecommercePenetration: 45,
        digitalPaymentMaturity: 45,
        logisticsMaturity: 45,
        consumerPurchasingPower: 45,
        languageComplexity: 50,
        taxComplexity: 55,
        businessFriendliness: 50,
        marketplaceDensity: 40,
        competitionIntensity: 50,
        supplierAccessibility: 50,
        crossBorderFriendliness: 45,
        regulatoryDifficulty: 55,
      },
      confidenceBase: 35,
      dataSource: "unknown-country",
    };
  }
  return {
    dimensions: profile.dimensions,
    confidenceBase: profile.dataSource === "SEED" ? 82 : 52,
    dataSource: profile.dataSource,
  };
}

function deriveDemandScore(dimensions: CountryIntelligenceDimensions): number {
  return clampScore(
    dimensions.ecommercePenetration * 0.35 +
      dimensions.consumerPurchasingPower * 0.25 +
      dimensions.digitalPaymentMaturity * 0.2 +
      dimensions.logisticsMaturity * 0.2,
  );
}

function deriveGrowthScore(dimensions: CountryIntelligenceDimensions, month: number): number {
  const emergingBoost = dimensions.marketMaturity < 72 ? 6 : 0;
  return clampScore(dimensions.marketGrowth + seasonalOpportunityModifier(month) + emergingBoost);
}

function deriveCompetitionScore(
  dimensions: CountryIntelligenceDimensions,
  marketplaceCount: number,
): number {
  const densityPenalty = Math.min(25, marketplaceCount * 4);
  return clampScore(100 - dimensions.competitionIntensity - densityPenalty * 0.5);
}

function deriveSaturationScore(dimensions: CountryIntelligenceDimensions): number {
  return clampScore(dimensions.marketplaceDensity * 0.6 + dimensions.marketMaturity * 0.4);
}

function deriveRiskScore(dimensions: CountryIntelligenceDimensions): number {
  return clampScore(
    dimensions.regulatoryDifficulty * 0.35 +
      dimensions.taxComplexity * 0.25 +
      dimensions.languageComplexity * 0.2 +
      (100 - dimensions.crossBorderFriendliness) * 0.2,
  );
}

function deriveOpportunityScore(
  demand: number,
  growth: number,
  competition: number,
  saturation: number,
  risk: number,
): number {
  return clampScore(
    demand * 0.25 + growth * 0.25 + competition * 0.2 + (100 - saturation) * 0.15 - risk * 0.15,
  );
}

function channelConfidenceModifier(source: IntelligenceSourceDefinition): number {
  if (source.status === "live") return 12;
  if (source.status === "mock") return 6;
  if (source.status === "architecture") return 0;
  return -8;
}

function recommendationFromScores(
  opportunity: number,
  risk: number,
  saturation: number,
  launchReadiness?: MarketplaceChannelProfile["launchReadiness"],
): MarketIntelligenceRecommendation {
  if (launchReadiness === "architecture_only") {
    return opportunity >= 65 ? "EXPAND" : "WATCH";
  }
  if (opportunity >= 72 && risk <= 45 && saturation <= 70) return "ENTER";
  if (opportunity >= 58 && risk <= 60) return "WATCH";
  if (opportunity < 45 || risk >= 75) return "AVOID";
  return "WATCH";
}

function recommendedActionFromContract(contract: MarketIntelligenceAnalysisContract): string {
  const { recommendation, marketName, opportunityScore, riskScore } = contract;
  if (recommendation === "ENTER") {
    return `Prioritise ${marketName} — opportunity ${opportunityScore}, risk ${riskScore}`;
  }
  if (recommendation === "EXPAND") {
    return `Plan registry expansion for ${marketName} — architecture slot ready`;
  }
  if (recommendation === "WATCH") {
    return `Monitor ${marketName} — opportunity ${opportunityScore}, reassess after next discovery refresh`;
  }
  return `Deprioritise ${marketName} — risk ${riskScore} exceeds opportunity threshold`;
}

function analyseCountryMarket(
  countryCode: string,
  displayName: string,
  discovery: DiscoverySnapshotView,
  month: number,
): MarketIntelligenceAnalysisContract {
  const { dimensions, confidenceBase, dataSource } = resolveCountryDimensions(countryCode);
  const marketplaceCount = discovery.marketplacesByCountry[countryCode]?.length ?? 0;
  const demand = deriveDemandScore(dimensions);
  const growth = deriveGrowthScore(dimensions, month);
  const competition = deriveCompetitionScore(dimensions, marketplaceCount);
  const saturation = deriveSaturationScore(dimensions);
  const risk = deriveRiskScore(dimensions);
  const opportunity = deriveOpportunityScore(demand, growth, competition, saturation, risk);
  const confidence = clampScore(confidenceBase + Math.min(10, marketplaceCount * 2));
  const recommendation = recommendationFromScores(opportunity, risk, saturation);
  const computedAt = new Date().toISOString();

  const contract: MarketIntelligenceAnalysisContract = {
    marketId: `country:${countryCode}`,
    marketName: displayName,
    marketKind: "country",
    countryCode,
    opportunityScore: opportunity,
    growthScore: growth,
    competitionScore: competition,
    saturationScore: saturation,
    riskScore: risk,
    confidence,
    supportingEvidence: [
      { source: "registry", label: "Marketplaces registered", value: String(marketplaceCount) },
      { source: "country-intel", label: "Demand proxy", value: String(demand) },
      { source: "country-intel", label: "Growth", value: String(dimensions.marketGrowth) },
      { source: "country-intel", label: "Competition intensity", value: String(dimensions.competitionIntensity) },
      { source: "country-intel", label: "Saturation (density)", value: String(dimensions.marketplaceDensity) },
      { source: "country-intel", label: "Data source", value: dataSource },
      { source: "seasonal", label: "Seasonal modifier", value: String(seasonalOpportunityModifier(month)) },
    ],
    recommendedAction: "",
    recommendation,
    computedAt,
  };
  contract.recommendedAction = recommendedActionFromContract(contract);
  return contract;
}

function findChannelProfile(
  sourceId: string,
  channels: MarketplaceChannelProfile[],
): MarketplaceChannelProfile | undefined {
  return channels.find((c) => c.registryId === sourceId);
}

function analyseChannelMarket(
  source: IntelligenceSourceDefinition,
  discovery: DiscoverySnapshotView,
  month: number,
): MarketIntelligenceAnalysisContract {
  const profile = findChannelProfile(source.id, discovery.deploymentChannels);
  const countryCode =
    profile?.countryCode && profile.countryCode !== "GLOBAL" ? profile.countryCode : null;
  const { dimensions, confidenceBase, dataSource } = countryCode
    ? resolveCountryDimensions(countryCode)
    : resolveCountryDimensions("GLOBAL");

  const marketplaceCount = countryCode
    ? (discovery.marketplacesByCountry[countryCode]?.length ?? 0)
    : discovery.deploymentChannels.filter((c) => c.channelType === "marketplace").length;

  const demand = deriveDemandScore(dimensions);
  const growth = deriveGrowthScore(dimensions, month);
  const competition = deriveCompetitionScore(dimensions, marketplaceCount);
  const saturation = deriveSaturationScore(dimensions);
  const risk = deriveRiskScore(dimensions);
  const opportunity = deriveOpportunityScore(demand, growth, competition, saturation, risk);
  const confidence = clampScore(
    confidenceBase + channelConfidenceModifier(source) + (profile?.launchReadiness === "live" ? 8 : 0),
  );
  const recommendation = recommendationFromScores(
    opportunity,
    risk,
    saturation,
    profile?.launchReadiness,
  );
  const computedAt = new Date().toISOString();

  const contract: MarketIntelligenceAnalysisContract = {
    marketId: source.id,
    marketName: source.label,
    marketKind: "channel",
    countryCode,
    opportunityScore: opportunity,
    growthScore: growth,
    competitionScore: competition,
    saturationScore: saturation,
    riskScore: risk,
    confidence,
    supportingEvidence: [
      { source: "registry", label: "Channel status", value: source.status },
      { source: "registry", label: "Launch readiness", value: source.launchReadiness },
      { source: "registry", label: "Platform family", value: source.platformFamily },
      { source: "country-intel", label: "Country data source", value: dataSource },
      { source: "seasonal", label: "Seasonal modifier", value: String(seasonalOpportunityModifier(month)) },
    ],
    recommendedAction: "",
    recommendation,
    computedAt,
  };
  contract.recommendedAction = recommendedActionFromContract(contract);
  return contract;
}

export function rankMarketAnalysisContracts(
  markets: MarketIntelligenceAnalysisContract[],
): MarketIntelligenceAnalysisContract[] {
  return [...markets].sort((a, b) => {
    const scoreA = a.opportunityScore * 0.45 + a.growthScore * 0.25 + a.confidence * 0.1 - a.riskScore * 0.2;
    const scoreB = b.opportunityScore * 0.45 + b.growthScore * 0.25 + b.confidence * 0.1 - b.riskScore * 0.2;
    return scoreB - scoreA;
  });
}

export function buildMarketplaceComparison(
  markets: MarketIntelligenceAnalysisContract[],
): MarketplaceComparisonRow[] {
  const ranked = rankMarketAnalysisContracts(markets);
  return ranked.map((market, index) => ({
    marketId: market.marketId,
    marketName: market.marketName,
    countryCode: market.countryCode,
    opportunityScore: market.opportunityScore,
    growthScore: market.growthScore,
    competitionScore: market.competitionScore,
    rank: index + 1,
  }));
}

function buildFutureExpansionFromRegistry(discovery: DiscoverySnapshotView): string[] {
  const expansionLabels = discovery.expansionMarketplaces
    .slice(0, 8)
    .map((p) => `${p.displayName} (${p.countryCode}) — registry expansion market`);
  return [
    ...expansionLabels,
    "Append REG-CHANNEL row to activate new deployment channel without engine code change",
    "Country intelligence seed overlay via REG-COUNTRY append model",
    "Live marketplace demand signals per channel launch readiness",
    "Category trend fusion with PIE catalog time-series (REAL-013)",
    "Generative market briefs (explicitly out of G3-02 scope)",
  ];
}

export function buildMarketIntelligenceEngineArchitecture(): MarketIntelligenceEngineArchitecture {
  const marketDiscovery = buildMarketIntelligenceDiscoveryView({});
  return {
    schemaVersion: G3_02_SCHEMA_VERSION,
    computedAt: new Date().toISOString(),
    engineId: "market-intelligence-engine",
    displayName: "Market Intelligence Engine",
    missionRef: "G3-02",
    scopeGate: "Architecture only — no live API connections in G3-02",
    marketDiscovery,
    capabilities: [...G3_02_CAPABILITIES],
    integrations: [...G3_02_ENGINE_INTEGRATIONS],
    dataFlow: G3_02_DATA_FLOW,
    futureExpansion: buildFutureExpansionFromRegistry(marketDiscovery),
  };
}

export function loadMarketIntelligenceEngineView(): MarketIntelligenceEngineView {
  const discovery = buildMarketIntelligenceDiscoveryView({});
  const month = new Date().getMonth();

  const countryMarkets = discovery.countries.map((country) =>
    analyseCountryMarket(country.countryCode, country.displayName, discovery, month),
  );
  const channelMarkets = discovery.intelligenceSources.map((source) =>
    analyseChannelMarket(source, discovery, month),
  );
  const analysedMarkets = rankMarketAnalysisContracts([...countryMarkets, ...channelMarkets]);
  const topOpportunities = analysedMarkets.slice(0, 12);
  const enterCount = analysedMarkets.filter((m) => m.recommendation === "ENTER").length;
  const expandCount = analysedMarkets.filter((m) => m.recommendation === "EXPAND").length;

  return {
    architecture: buildMarketIntelligenceEngineArchitecture(),
    analysedMarkets,
    topOpportunities,
    countryMarkets: rankMarketAnalysisContracts(countryMarkets),
    channelMarkets: rankMarketAnalysisContracts(channelMarkets),
    marketplaceComparison: buildMarketplaceComparison(analysedMarkets),
    executiveSummary: `${analysedMarkets.length} markets analysed (${countryMarkets.length} countries · ${channelMarkets.length} channels) · ${enterCount} ENTER · ${expandCount} EXPAND · Registry: ${discovery.intelligenceSources.length} sources`,
    nextExecutiveAction:
      topOpportunities[0]?.recommendedAction ??
      "Refresh RegistryLoader discovery snapshot to activate market analysis",
  };
}
