/**
 * G3-04 — Financial Intelligence Engine · Architecture Layer
 * Executive AI Engine for registry-driven financial modelling and projections.
 * Architecture only — no live accounting integrations in G3-04.
 */

import {
  buildMarketIntelligenceDiscoveryView,
  getRegistryLoader,
} from "../../registry/index.js";
import { REG_PRICING_POLICY } from "../../registry/types/registry-ids.js";
import type { DiscoverySnapshotView } from "../../registry/index.js";
import { loadPaymentCatalogRows } from "../../registry/sources/platform-catalog-source.js";
import type { ProviderEntry } from "../../runtime/global-commerce/models/global-registry.js";
import type { IntelligenceSourceDefinition } from "../shared/intelligence-market-discovery.js";
import { getCountryIntelligenceProfile } from "../../runtime/global-commerce-intelligence/services/country-intelligence-service.js";
import { productIntelligenceService } from "../product-intelligence-engine/service.js";
import { loadFinanceView } from "../../domain/services/module-views.js";
import { CompanyRepository } from "../../domain/repositories/company-repository.js";
import { AdRepository } from "../../domain/repositories/ad-repository.js";

const companies = new CompanyRepository();
const ads = new AdRepository();

export const G3_04_SCHEMA_VERSION = "g3-04-v1" as const;

export type FinancialIntelligenceRecommendation = "INVEST" | "HOLD" | "REDUCE" | "REVIEW";

export type FinancialIntelligenceEvidence = {
  source: string;
  label: string;
  value: string;
  href?: string | null;
};

/** G3-04 — Every analysed financial scenario exposes this contract. */
export type FinancialIntelligenceAnalysisContract = {
  scenarioId: string;
  scenarioName: string;
  scenarioKind: "channel" | "workspace";
  countryCode: string | null;
  financialScore: number;
  profitProjection: number;
  marginProjection: number;
  roi: number;
  confidence: number;
  supportingEvidence: FinancialIntelligenceEvidence[];
  recommendedAction: string;
  recommendation: FinancialIntelligenceRecommendation;
  computedAt: string;
};

export type FinancialIntelligenceCapabilityId =
  | "revenue_modelling"
  | "cost_modelling"
  | "margin_modelling"
  | "cash_flow_modelling"
  | "pricing_analysis"
  | "break_even_analysis"
  | "roi_analysis"
  | "profit_forecasting";

export type FinancialIntelligenceCapabilityDefinition = {
  id: FinancialIntelligenceCapabilityId;
  label: string;
  description: string;
  implementationStatus: "live" | "partial" | "architecture";
  dataMode: "mock" | "domain-store" | "registry" | "future";
};

export type FinancialIntelligenceEngineIntegrationId =
  | "payment-engine"
  | "analytics-engine"
  | "quantitative-intelligence-engine"
  | "advertising-engine";

export type FinancialIntelligenceEngineIntegration = {
  engineId: FinancialIntelligenceEngineIntegrationId;
  label: string;
  relationship: "feeds" | "consumes" | "validates" | "reports";
  description: string;
  cockpitRoute: string;
  brainModule: string;
};

export type FinancialDiscoveryView = {
  computedAt: string;
  registrySource: "RegistryLoader:financial-discovery-composite";
  marketDiscovery: DiscoverySnapshotView;
  paymentProviders: ProviderEntry[];
  pricingPolicyRows: unknown[];
  revenueChannels: IntelligenceSourceDefinition[];
};

export type FinancialIntelligenceEngineArchitecture = {
  schemaVersion: typeof G3_04_SCHEMA_VERSION;
  computedAt: string;
  engineId: "financial-intelligence-engine";
  displayName: string;
  missionRef: "G3-04";
  scopeGate: string;
  financialDiscovery: FinancialDiscoveryView;
  capabilities: FinancialIntelligenceCapabilityDefinition[];
  integrations: FinancialIntelligenceEngineIntegration[];
  dataFlow: Array<{ stage: string; from: string; to: string; description: string }>;
  futureExpansion: string[];
};

export type FinancialIntelligenceEngineView = {
  architecture: FinancialIntelligenceEngineArchitecture;
  analysedScenarios: FinancialIntelligenceAnalysisContract[];
  topOpportunities: FinancialIntelligenceAnalysisContract[];
  workspaceSummary: FinancialIntelligenceAnalysisContract | null;
  executiveSummary: string;
  nextExecutiveAction: string;
};

export const G3_04_CAPABILITIES: readonly FinancialIntelligenceCapabilityDefinition[] = [
  {
    id: "revenue_modelling",
    label: "Revenue modelling",
    description: "Registry channel revenue potential from country e-commerce penetration and deployment readiness",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "cost_modelling",
    label: "Cost modelling",
    description: "COGS, ad spend, and platform fee proxies from finance domain store",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "margin_modelling",
    label: "Margin modelling",
    description: "Net margin projection from revenue and cost composites",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "cash_flow_modelling",
    label: "Cash flow modelling",
    description: "Cash runway and working capital signals from finance view",
    implementationStatus: "architecture",
    dataMode: "domain-store",
  },
  {
    id: "pricing_analysis",
    label: "Pricing analysis",
    description: "REG-PRICING-POLICY overlay and PIE margin score signals",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "break_even_analysis",
    label: "Break-even analysis",
    description: "Fixed cost vs contribution margin architecture model",
    implementationStatus: "architecture",
    dataMode: "mock",
  },
  {
    id: "roi_analysis",
    label: "ROI analysis",
    description: "Return on invested capital proxy from profit projection and ad spend",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "profit_forecasting",
    label: "Profit forecasting",
    description: "Forward profit projection from composite financial score",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
];

export const G3_04_ENGINE_INTEGRATIONS: readonly FinancialIntelligenceEngineIntegration[] = [
  {
    engineId: "payment-engine",
    label: "Payment Engine",
    relationship: "feeds",
    description: "Registry payment providers, fee structures, and billing readiness",
    cockpitRoute: "/cockpit/finance/billing",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "analytics-engine",
    label: "Analytics Engine",
    relationship: "reports",
    description: "Revenue telemetry and profit validation from order repository",
    cockpitRoute: "/cockpit/finance/profit",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "quantitative-intelligence-engine",
    label: "Quantitative Intelligence Engine",
    relationship: "consumes",
    description: "Consumes financial scores for opportunity ranking board",
    cockpitRoute: "/cockpit/intelligence/discovery",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "advertising-engine",
    label: "Advertising Engine",
    relationship: "validates",
    description: "Ad spend feasibility and campaign ROI cross-check",
    cockpitRoute: "/cockpit/commerce/marketing",
    brainModule: "cockpit-engine",
  },
];

export const G3_04_DATA_FLOW: FinancialIntelligenceEngineArchitecture["dataFlow"] = [
  {
    stage: "1 — Discovery",
    from: "RegistryLoader → channels + payment providers + pricing policy",
    to: "Financial scenario universe",
    description: "Revenue channels and payment paths discovered dynamically",
  },
  {
    stage: "2 — Domain signals",
    from: "Finance view + PIE catalog",
    to: "Cost, margin, and pricing inputs",
    description: "Workspace finance domain store and product margin aggregates",
  },
  {
    stage: "3 — Modelling",
    from: "Discovery + domain signals",
    to: "FinancialIntelligenceAnalysisContract",
    description: "Revenue, cost, margin, cash flow, break-even, ROI, profit forecast",
  },
  {
    stage: "4 — Executive output",
    from: "Analysis contract",
    to: "Cockpit SCR-105 + Analytics + QIE",
    description: "Seven-field contract per financial scenario",
  },
  {
    stage: "5 — Engine integration",
    from: "Financial rankings",
    to: "Payment · Analytics · Ads · QIE",
    description: "Downstream engines consume financial priority signals (architecture wiring)",
  },
];

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function parseMarginPct(marginStr: string): number {
  const parsed = Number.parseFloat(marginStr.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildFinancialIntelligenceDiscoveryView(): FinancialDiscoveryView {
  const marketDiscovery = buildMarketIntelligenceDiscoveryView({});
  const paymentProviders = loadPaymentCatalogRows();
  const pricingPolicyRows = getRegistryLoader().resolve({}, REG_PRICING_POLICY).rows;
  const revenueChannels = marketDiscovery.intelligenceSources.filter(
    (s) => s.channelType === "marketplace" || s.channelType === "storefront",
  );

  return {
    computedAt: new Date().toISOString(),
    registrySource: "RegistryLoader:financial-discovery-composite",
    marketDiscovery,
    paymentProviders,
    pricingPolicyRows,
    revenueChannels,
  };
}

function channelCountryCode(source: IntelligenceSourceDefinition): string | null {
  const match = source.region.match(/\(([A-Z]{2})\)/);
  if (match?.[1]) return match[1];
  if (source.region === "Global") return null;
  return null;
}

function deriveWorkspaceFinancialSignals(workspaceId: string): {
  revenueCents: number;
  netMarginPct: number;
  adSpendMonthlyCents: number;
  avgPieMargin: number;
  productCount: number;
} {
  productIntelligenceService.seedCatalog(workspaceId);
  const portfolio = companies.portfolioTotals(workspaceId);
  const adStats = ads.statsForWorkspace(workspaceId);
  const finance = loadFinanceView(workspaceId);
  const products = productIntelligenceService.listProducts(workspaceId);
  const avgPieMargin =
    products.length > 0
      ? products.reduce((sum, p) => sum + p.marginScore, 0) / products.length
      : 50;

  const revenueCents = portfolio.revenueCents;
  const cogs = Math.round(revenueCents * 0.39);
  const adSpendMonthlyCents = adStats.dailyBudgetCents * 30;
  const platformFees = Math.round(revenueCents * 0.017);
  const netProfit = revenueCents - cogs - adSpendMonthlyCents - platformFees;
  const netMarginPct = revenueCents > 0 ? (netProfit / revenueCents) * 100 : 0;

  return {
    revenueCents,
    netMarginPct,
    adSpendMonthlyCents,
    avgPieMargin,
    productCount: products.length,
  };
}

function recommendationFromScores(
  financialScore: number,
  roi: number,
  marginProjection: number,
): FinancialIntelligenceRecommendation {
  if (financialScore >= 72 && roi >= 15 && marginProjection >= 25) return "INVEST";
  if (financialScore >= 55 && marginProjection >= 15) return "HOLD";
  if (financialScore < 40 || marginProjection < 5) return "REDUCE";
  return "REVIEW";
}

function recommendedActionFromContract(contract: FinancialIntelligenceAnalysisContract): string {
  const { recommendation, scenarioName, financialScore, roi, marginProjection } = contract;
  if (recommendation === "INVEST") {
    return `Increase investment in ${scenarioName} — financial score ${financialScore}, ROI ${roi}%, margin ${marginProjection}%`;
  }
  if (recommendation === "HOLD") {
    return `Maintain current spend on ${scenarioName} — monitor margin ${marginProjection}% and ROI ${roi}%`;
  }
  if (recommendation === "REDUCE") {
    return `Reduce exposure to ${scenarioName} — financial score ${financialScore} below threshold`;
  }
  return `Executive review for ${scenarioName} — mixed signals on margin and ROI`;
}

function analyseChannelScenario(
  source: IntelligenceSourceDefinition,
  discovery: FinancialDiscoveryView,
  workspaceSignals: ReturnType<typeof deriveWorkspaceFinancialSignals>,
): FinancialIntelligenceAnalysisContract {
  const countryCode = channelCountryCode(source);
  const countryProfile = countryCode ? getCountryIntelligenceProfile(countryCode) : null;
  const ecommercePenetration = countryProfile?.dimensions.ecommercePenetration ?? 50;
  const paymentCount = discovery.paymentProviders.length;

  const revenueBase = clampScore(ecommercePenetration * 0.6 + (source.status === "live" ? 25 : 10));
  const costLoad = clampScore(39 + workspaceSignals.adSpendMonthlyCents / Math.max(workspaceSignals.revenueCents, 1) * 20);
  const marginProjection = clampScore(
    workspaceSignals.avgPieMargin * 0.4 + (100 - costLoad) * 0.35 + revenueBase * 0.25,
  );
  const profitProjection = clampScore(marginProjection * 0.85 + revenueBase * 0.15);
  const roi = clampScore(
    marginProjection > 0
      ? (profitProjection / Math.max(costLoad, 1)) * 10
      : 0,
  );
  const cashFlowScore = clampScore(55 + (countryProfile?.dimensions.digitalPaymentMaturity ?? 45) * 0.3);
  const breakEvenMonths = marginProjection > 0 ? Math.max(1, Math.round(120 / marginProjection)) : 24;
  const financialScore = clampScore(
    revenueBase * 0.2 +
      marginProjection * 0.25 +
      profitProjection * 0.2 +
      roi * 0.15 +
      cashFlowScore * 0.1 +
      (100 - costLoad) * 0.1,
  );
  const confidence = clampScore(
    (countryProfile?.dataSource === "SEED" ? 78 : 52) +
      (source.status === "live" ? 12 : 0) +
      Math.min(10, paymentCount * 4),
  );
  const recommendation = recommendationFromScores(financialScore, roi, marginProjection);
  const computedAt = new Date().toISOString();

  const contract: FinancialIntelligenceAnalysisContract = {
    scenarioId: source.id,
    scenarioName: source.label,
    scenarioKind: "channel",
    countryCode,
    financialScore,
    profitProjection,
    marginProjection,
    roi,
    confidence,
    supportingEvidence: [
      { source: "registry", label: "Channel status", value: source.status },
      { source: "registry", label: "Launch readiness", value: source.launchReadiness },
      { source: "registry", label: "Payment providers", value: String(paymentCount) },
      { source: "country-intel", label: "E-commerce penetration", value: String(ecommercePenetration) },
      { source: "domain", label: "PIE avg margin score", value: String(Math.round(workspaceSignals.avgPieMargin)) },
      { source: "model", label: "Break-even (months)", value: String(breakEvenMonths) },
      { source: "registry", label: "Pricing policy rows", value: String(discovery.pricingPolicyRows.length) },
    ],
    recommendedAction: "",
    recommendation,
    computedAt,
  };
  contract.recommendedAction = recommendedActionFromContract(contract);
  return contract;
}

function analyseWorkspaceScenario(
  workspaceId: string,
  signals: ReturnType<typeof deriveWorkspaceFinancialSignals>,
): FinancialIntelligenceAnalysisContract {
  const finance = loadFinanceView(workspaceId);
  const marginProjection = clampScore(signals.netMarginPct || parseMarginPct(finance.breakdown.margin));
  const profitProjection = clampScore(marginProjection * 0.9 + signals.avgPieMargin * 0.1);
  const roi = clampScore(
    signals.adSpendMonthlyCents > 0
      ? (profitProjection / (signals.adSpendMonthlyCents / 10000)) * 5
      : profitProjection * 0.5,
  );
  const financialScore = clampScore(
    marginProjection * 0.35 + profitProjection * 0.3 + roi * 0.2 + signals.avgPieMargin * 0.15,
  );
  const confidence = clampScore(signals.productCount > 0 ? 75 : 45);
  const recommendation = recommendationFromScores(financialScore, roi, marginProjection);
  const computedAt = new Date().toISOString();

  const contract: FinancialIntelligenceAnalysisContract = {
    scenarioId: `workspace:${workspaceId}`,
    scenarioName: "Workspace Portfolio",
    scenarioKind: "workspace",
    countryCode: null,
    financialScore,
    profitProjection,
    marginProjection,
    roi,
    confidence,
    supportingEvidence: [
      { source: "finance", label: "Net profit (MTD)", value: finance.breakdown.netProfit },
      { source: "finance", label: "Revenue", value: finance.breakdown.revenue },
      { source: "finance", label: "COGS", value: finance.breakdown.cogs },
      { source: "finance", label: "Ad spend", value: finance.breakdown.adSpend },
      { source: "pie", label: "Products scored", value: String(signals.productCount) },
      { source: "pie", label: "Avg margin score", value: String(Math.round(signals.avgPieMargin)) },
    ],
    recommendedAction: "",
    recommendation,
    computedAt,
  };
  contract.recommendedAction = recommendedActionFromContract(contract);
  return contract;
}

export function rankFinancialAnalysisContracts(
  scenarios: FinancialIntelligenceAnalysisContract[],
): FinancialIntelligenceAnalysisContract[] {
  return [...scenarios].sort((a, b) => {
    const scoreA = a.financialScore * 0.45 + a.roi * 0.25 + a.confidence * 0.1 - (100 - a.marginProjection) * 0.1;
    const scoreB = b.financialScore * 0.45 + b.roi * 0.25 + b.confidence * 0.1 - (100 - b.marginProjection) * 0.1;
    return scoreB - scoreA;
  });
}

function buildFutureExpansionFromRegistry(discovery: FinancialDiscoveryView): string[] {
  return [
    ...discovery.paymentProviders.slice(0, 4).map((p) => `${p.displayName} (${p.providerId}) — payment registry`),
    "Append payment provider row to REG catalog for new billing path",
    "Live accounting / QuickBooks / Xero integration (explicitly deferred)",
    "Treasury and cash flow live feeds from Payment Engine",
    "Generative financial briefs (out of G3-04 scope)",
  ];
}

export function buildFinancialIntelligenceEngineArchitecture(): FinancialIntelligenceEngineArchitecture {
  const financialDiscovery = buildFinancialIntelligenceDiscoveryView();
  return {
    schemaVersion: G3_04_SCHEMA_VERSION,
    computedAt: new Date().toISOString(),
    engineId: "financial-intelligence-engine",
    displayName: "Financial Intelligence Engine",
    missionRef: "G3-04",
    scopeGate: "Architecture only — no live accounting integrations in G3-04",
    financialDiscovery,
    capabilities: [...G3_04_CAPABILITIES],
    integrations: [...G3_04_ENGINE_INTEGRATIONS],
    dataFlow: G3_04_DATA_FLOW,
    futureExpansion: buildFutureExpansionFromRegistry(financialDiscovery),
  };
}

export function loadFinancialIntelligenceEngineView(workspaceId: string): FinancialIntelligenceEngineView {
  const architecture = buildFinancialIntelligenceEngineArchitecture();
  const discovery = architecture.financialDiscovery;
  const workspaceSignals = deriveWorkspaceFinancialSignals(workspaceId);

  const channelScenarios = discovery.revenueChannels.map((source) =>
    analyseChannelScenario(source, discovery, workspaceSignals),
  );
  const workspaceSummary = analyseWorkspaceScenario(workspaceId, workspaceSignals);
  const analysedScenarios = rankFinancialAnalysisContracts([workspaceSummary, ...channelScenarios]);
  const topOpportunities = analysedScenarios.slice(0, 12);
  const investCount = analysedScenarios.filter((s) => s.recommendation === "INVEST").length;

  return {
    architecture,
    analysedScenarios,
    topOpportunities,
    workspaceSummary,
    executiveSummary: `${analysedScenarios.length} financial scenarios analysed · ${investCount} INVEST recommendations · ${discovery.revenueChannels.length} registry revenue channels · ${discovery.paymentProviders.length} payment providers`,
    nextExecutiveAction:
      topOpportunities[0]?.recommendedAction ??
      "Refresh RegistryLoader financial discovery to activate modelling",
  };
}
