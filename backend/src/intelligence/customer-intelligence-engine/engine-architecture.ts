/**
 * G3-07 — Customer Intelligence Engine · Architecture Layer
 * Executive AI Engine for registry-driven customer understanding.
 * Architecture only — no live CRM or marketplace customer API connections in G3-07.
 */

import { buildMarketIntelligenceDiscoveryView, getRegistryLoader } from "../../registry/index.js";
import { REG_COUNTRY } from "../../registry/types/registry-ids.js";
import {
  loadCustomerCatalogRows,
  loadMarketplaceRows,
} from "../../registry/sources/platform-catalog-source.js";
import type { Country, ProviderEntry } from "../../runtime/global-commerce/models/global-registry.js";
import { loadFinanceView } from "../../domain/services/module-views.js";
import { loadAdvertisingIntelligenceEngineViewForWorkspace } from "../../domain/services/advertising-intelligence-engine-views.js";
import { OrderRepository } from "../../domain/repositories/order-repository.js";
import { TicketRepository } from "../../domain/repositories/ticket-repository.js";

const orders = new OrderRepository();
const tickets = new TicketRepository();

export const G3_07_SCHEMA_VERSION = "g3-07-v1" as const;

export type CustomerIntelligenceRecommendation = "RETAIN" | "ENGAGE" | "WIN_BACK" | "MONITOR";

export type CustomerIntelligenceEvidence = {
  source: string;
  label: string;
  value: string;
  href?: string | null;
};

/** G3-07 — Every analysed customer segment exposes this contract. */
export type CustomerIntelligenceAnalysisContract = {
  customerId: string;
  customerName: string;
  segmentLabel: string;
  marketplaceId: string | null;
  registryProviderId: string | null;
  customerScore: number;
  segmentationScore: number;
  behaviourScore: number;
  journeyScore: number;
  retentionScore: number;
  churnRiskScore: number;
  ltvScore: number;
  satisfactionScore: number;
  confidence: number;
  supportingEvidence: CustomerIntelligenceEvidence[];
  recommendedAction: string;
  recommendation: CustomerIntelligenceRecommendation;
  computedAt: string;
};

export type CustomerIntelligenceCapabilityId =
  | "segmentation"
  | "behaviour"
  | "buying_journey"
  | "retention"
  | "churn"
  | "lifetime_value"
  | "satisfaction"
  | "executive_recommendations";

export type CustomerIntelligenceCapabilityDefinition = {
  id: CustomerIntelligenceCapabilityId;
  label: string;
  description: string;
  implementationStatus: "live" | "partial" | "architecture";
  dataMode: "mock" | "domain-store" | "registry" | "derived";
};

export type CustomerIntelligenceEngineIntegrationId =
  | "marketplace-engine"
  | "analytics-engine"
  | "advertising-engine";

export type CustomerIntelligenceEngineIntegration = {
  engineId: CustomerIntelligenceEngineIntegrationId;
  label: string;
  relationship: "feeds" | "consumes" | "validates" | "reports";
  description: string;
  cockpitRoute: string;
  brainModule: string;
};

export type CustomerDiscoveryView = {
  computedAt: string;
  registrySource: "RegistryLoader:customer-discovery-composite";
  customerServiceProviders: ProviderEntry[];
  customerCountries: Country[];
  marketplaceSegments: ProviderEntry[];
  marketChannelCount: number;
};

export type CustomerComparisonRow = {
  customerId: string;
  customerName: string;
  customerScore: number;
  ltvScore: number;
  churnRiskScore: number;
  rank: number;
  recommendation: CustomerIntelligenceRecommendation;
};

export type CustomerIntelligenceEngineArchitecture = {
  schemaVersion: typeof G3_07_SCHEMA_VERSION;
  computedAt: string;
  engineId: "customer-intelligence-engine";
  displayName: string;
  missionRef: "G3-07";
  scopeGate: string;
  customerDiscovery: CustomerDiscoveryView;
  capabilities: CustomerIntelligenceCapabilityDefinition[];
  integrations: CustomerIntelligenceEngineIntegration[];
  dataFlow: Array<{ stage: string; from: string; to: string; description: string }>;
  futureExpansion: string[];
};

export type CustomerIntelligenceEngineView = {
  architecture: CustomerIntelligenceEngineArchitecture;
  analysedCustomers: CustomerIntelligenceAnalysisContract[];
  topSegments: CustomerIntelligenceAnalysisContract[];
  customerComparison: CustomerComparisonRow[];
  executiveSummary: string;
  nextExecutiveAction: string;
};

export const G3_07_CAPABILITIES: readonly CustomerIntelligenceCapabilityDefinition[] = [
  {
    id: "segmentation",
    label: "Segmentation",
    description: "Registry marketplace and country segments for buyer cohorts",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "behaviour",
    label: "Behaviour",
    description: "Order frequency, repeat purchase, and ticket interaction signals",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "buying_journey",
    label: "Buying journey",
    description: "Order-to-support journey stage proxy from domain telemetry",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "retention",
    label: "Retention",
    description: "Repeat purchase and engagement retention index",
    implementationStatus: "partial",
    dataMode: "derived",
  },
  {
    id: "churn",
    label: "Churn",
    description: "Churn risk score from satisfaction, refunds, and inactivity proxies",
    implementationStatus: "partial",
    dataMode: "derived",
  },
  {
    id: "lifetime_value",
    label: "Lifetime value",
    description: "LTV score from order value aggregates and segment benchmarks",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "satisfaction",
    label: "Satisfaction",
    description: "CSAT proxy from support tickets and resolution quality",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "executive_recommendations",
    label: "Executive recommendations",
    description: "RETAIN / ENGAGE / WIN_BACK / MONITOR with recommended next action",
    implementationStatus: "live",
    dataMode: "derived",
  },
];

export const G3_07_ENGINE_INTEGRATIONS: readonly CustomerIntelligenceEngineIntegration[] = [
  {
    engineId: "marketplace-engine",
    label: "Marketplace",
    relationship: "feeds",
    description: "Registry marketplace segments and buyer geography context",
    cockpitRoute: "/cockpit/intelligence/marketplace",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "analytics-engine",
    label: "Analytics",
    relationship: "reports",
    description: "Order profit and revenue telemetry for LTV validation",
    cockpitRoute: "/cockpit/finance/profit",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "advertising-engine",
    label: "Advertising",
    relationship: "consumes",
    description: "Ad acquisition context for new-customer cohort behaviour",
    cockpitRoute: "/cockpit/commerce/marketing",
    brainModule: "cockpit-engine",
  },
];

export const G3_07_DATA_FLOW: CustomerIntelligenceEngineArchitecture["dataFlow"] = [
  {
    stage: "1 — Discovery",
    from: "RegistryLoader → customer service providers + marketplace segments",
    to: "Customer universe",
    description: "CRM platforms and marketplace buyer segments discovered dynamically",
  },
  {
    stage: "2 — Domain overlay",
    from: "Orders + support tickets domain store",
    to: "Customer behaviour metrics",
    description: "Purchase frequency, LTV proxy, satisfaction, and journey signals",
  },
  {
    stage: "3 — Cross-engine inputs",
    from: "Analytics + Advertising",
    to: "Acquisition and revenue context",
    description: "Order profit validation and ad-driven acquisition cohort signals",
  },
  {
    stage: "4 — Scoring",
    from: "Discovery + domain + cross-engine",
    to: "CustomerIntelligenceAnalysisContract",
    description: "Segmentation, retention, churn, LTV, satisfaction, executive recommendation",
  },
  {
    stage: "5 — Executive output",
    from: "Analysis contract",
    to: "Cockpit SCR-107 + Marketplace Engine",
    description: "RETAIN / ENGAGE / WIN_BACK / MONITOR per analysed customer segment",
  },
];

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function buildCustomerIntelligenceDiscoveryView(): CustomerDiscoveryView {
  const marketDiscovery = buildMarketIntelligenceDiscoveryView({});
  const customerServiceProviders = loadCustomerCatalogRows();
  const customerCountries = (getRegistryLoader().resolve({}, REG_COUNTRY).rows as Country[]).filter(
    (c) => c.commerceDomains.includes("customer_service"),
  );
  const marketplaceSegments = loadMarketplaceRows().slice(0, 12);

  return {
    computedAt: new Date().toISOString(),
    registrySource: "RegistryLoader:customer-discovery-composite",
    customerServiceProviders,
    customerCountries,
    marketplaceSegments,
    marketChannelCount: marketDiscovery.intelligenceSources.length,
  };
}

type RegistryCustomerUnit = {
  customerId: string;
  customerName: string;
  segmentLabel: string;
  marketplaceId: string | null;
  registryProviderId: string | null;
  orderCount: number;
  ticketCount: number;
  repeatPurchases: number;
  ltvCents: number;
  satisfactionProxy: number;
  source: "domain-store" | "registry-architecture";
};

function matchMarketplaceForSegment(
  label: string,
  marketplaces: ProviderEntry[],
): ProviderEntry | undefined {
  const key = label.toLowerCase().replace(/[^a-z0-9]/g, "");
  return marketplaces.find((m) => {
    const mpKey = m.displayName.toLowerCase().replace(/[^a-z0-9]/g, "");
    return key.includes(mpKey) || mpKey.includes(key);
  });
}

export function resolveRegistryDiscoveredCustomers(
  workspaceId: string,
  discovery: CustomerDiscoveryView = buildCustomerIntelligenceDiscoveryView(),
): RegistryCustomerUnit[] {
  const workspaceOrders = orders.listByWorkspace(workspaceId);
  const workspaceTickets = tickets.listByWorkspace(workspaceId);
  const seen = new Set<string>();
  const units: RegistryCustomerUnit[] = [];

  const customerTicketCounts = new Map<string, number>();
  for (const ticket of workspaceTickets) {
    customerTicketCounts.set(
      ticket.customerName,
      (customerTicketCounts.get(ticket.customerName) ?? 0) + 1,
    );
  }

  for (const [customerName, ticketCount] of customerTicketCounts) {
    const seed = hashSeed(`${workspaceId}:${customerName}`);
    const relatedOrders = workspaceOrders.filter(
      (o) => o.companyName.toLowerCase().includes(customerName.split(" ")[0]?.toLowerCase() ?? ""),
    );
    const orderCount = Math.max(relatedOrders.length, 1);
    const ltvCents = relatedOrders.reduce((sum, o) => sum + o.totalCents, 0) || 5000 + (seed % 8000);
    const mp = matchMarketplaceForSegment(customerName, discovery.marketplaceSegments);
    units.push({
      customerId: `cust:${customerName.replace(/\s+/g, "-").toLowerCase()}`,
      customerName,
      segmentLabel: mp?.displayName ?? "Direct buyer",
      marketplaceId: mp?.providerId ?? null,
      registryProviderId: discovery.customerServiceProviders[seed % discovery.customerServiceProviders.length]?.providerId ?? null,
      orderCount,
      ticketCount,
      repeatPurchases: Math.min(orderCount, seed % 5),
      ltvCents,
      satisfactionProxy: clampScore(70 + (seed % 25) - ticketCount * 3),
      source: "domain-store",
    });
    seen.add(customerName);
  }

  for (const order of workspaceOrders) {
    const proxyName = `${order.productName} buyer`;
    if (seen.has(proxyName)) continue;
    const seed = hashSeed(`${workspaceId}:${order.id}`);
    const mp = matchMarketplaceForSegment(order.companyName, discovery.marketplaceSegments);
    units.push({
      customerId: `order:${order.id}`,
      customerName: proxyName,
      segmentLabel: mp?.displayName ?? order.companyName,
      marketplaceId: mp?.providerId ?? null,
      registryProviderId: null,
      orderCount: 1,
      ticketCount: 0,
      repeatPurchases: seed % 2,
      ltvCents: order.totalCents,
      satisfactionProxy: clampScore(75 + (seed % 20)),
      source: "domain-store",
    });
    seen.add(proxyName);
  }

  for (const mp of discovery.marketplaceSegments.slice(0, 6)) {
    const already = units.some((u) => u.marketplaceId === mp.providerId);
    if (already) continue;
    units.push({
      customerId: `reg:${mp.providerId}`,
      customerName: `${mp.displayName} buyer segment (architecture)`,
      segmentLabel: mp.displayName,
      marketplaceId: mp.providerId,
      registryProviderId: null,
      orderCount: 0,
      ticketCount: 0,
      repeatPurchases: 0,
      ltvCents: 0,
      satisfactionProxy: 55,
      source: "registry-architecture",
    });
  }

  for (const provider of discovery.customerServiceProviders) {
    const already = units.some((u) => u.registryProviderId === provider.providerId);
    if (already) continue;
    units.push({
      customerId: `reg:cs:${provider.providerId}`,
      customerName: `${provider.displayName} CRM segment (architecture)`,
      segmentLabel: "Customer service",
      marketplaceId: null,
      registryProviderId: provider.providerId,
      orderCount: 0,
      ticketCount: 0,
      repeatPurchases: 0,
      ltvCents: 0,
      satisfactionProxy: 50,
      source: "registry-architecture",
    });
  }

  return units;
}

function recommendationFromScores(
  customerScore: number,
  retentionScore: number,
  churnRiskScore: number,
  ltvScore: number,
  source: string,
): CustomerIntelligenceRecommendation {
  if (source === "registry-architecture") return "MONITOR";
  if (churnRiskScore >= 70) return "WIN_BACK";
  if (retentionScore >= 65 && ltvScore >= 60) return "RETAIN";
  if (customerScore >= 55 && ltvScore >= 45) return "ENGAGE";
  return "MONITOR";
}

function recommendedActionFromContract(contract: CustomerIntelligenceAnalysisContract): string {
  const { recommendation, customerName, ltvScore, churnRiskScore } = contract;
  if (recommendation === "RETAIN") {
    return `Retain ${customerName} — LTV score ${ltvScore}, loyalty programme candidate`;
  }
  if (recommendation === "ENGAGE") {
    return `Engage ${customerName} — upsell and cross-sell opportunity`;
  }
  if (recommendation === "WIN_BACK") {
    return `Win back ${customerName} — churn risk ${churnRiskScore} exceeds threshold`;
  }
  return `Monitor ${customerName} — gather more behavioural data before action`;
}

function analyseCustomerUnit(
  unit: RegistryCustomerUnit,
  discovery: CustomerDiscoveryView,
  crossSignals: {
    adBlendedRoas: number;
    orderProfitTodayCents: number;
    ticketCsat: number;
    marketplaceSegmentCount: number;
  },
): CustomerIntelligenceAnalysisContract {
  const seed = hashSeed(unit.customerId);
  const segmentationScore = clampScore(
    (unit.marketplaceId ? 35 : 15) +
      (unit.registryProviderId ? 20 : 10) +
      Math.min(45, crossSignals.marketplaceSegmentCount * 3),
  );
  const behaviourScore = clampScore(
    unit.orderCount * 12 + unit.repeatPurchases * 15 + unit.ticketCount * 5 + (seed % 10),
  );
  const journeyScore = clampScore(
    unit.orderCount > 0 && unit.ticketCount === 0
      ? 80
      : unit.orderCount > 0 && unit.ticketCount > 0
        ? 55
        : 30 + (seed % 20),
  );
  const retentionScore = clampScore(unit.repeatPurchases * 22 + behaviourScore * 0.35);
  const churnRiskScore = clampScore(
    100 -
      retentionScore * 0.5 -
      unit.satisfactionProxy * 0.3 -
      (unit.orderCount > 0 ? 10 : 0) +
      (unit.ticketCount > 2 ? 15 : 0),
  );
  const ltvScore = clampScore(
    unit.ltvCents > 0 ? Math.min(100, unit.ltvCents / 150) : 25 + (seed % 30),
  );
  const satisfactionScore = clampScore(
    unit.ticketCount > 0
      ? unit.satisfactionProxy * 0.6 + crossSignals.ticketCsat * 0.4
      : unit.satisfactionProxy,
  );
  const customerScore = clampScore(
    segmentationScore * 0.12 +
      behaviourScore * 0.18 +
      journeyScore * 0.12 +
      retentionScore * 0.2 +
      ltvScore * 0.2 +
      satisfactionScore * 0.18 -
      churnRiskScore * 0.1,
  );
  const confidence = clampScore(
    (unit.source === "domain-store" ? 76 : 46) +
      (unit.marketplaceId ? 8 : 0) +
      (unit.orderCount > 0 ? 10 : 0) +
      (crossSignals.orderProfitTodayCents > 0 ? 6 : 0),
  );
  const recommendation = recommendationFromScores(
    customerScore,
    retentionScore,
    churnRiskScore,
    ltvScore,
    unit.source,
  );
  const computedAt = new Date().toISOString();

  const contract: CustomerIntelligenceAnalysisContract = {
    customerId: unit.customerId,
    customerName: unit.customerName,
    segmentLabel: unit.segmentLabel,
    marketplaceId: unit.marketplaceId,
    registryProviderId: unit.registryProviderId,
    customerScore,
    segmentationScore,
    behaviourScore,
    journeyScore,
    retentionScore,
    churnRiskScore,
    ltvScore,
    satisfactionScore,
    confidence,
    supportingEvidence: [
      { source: "domain", label: "Orders", value: String(unit.orderCount) },
      { source: "domain", label: "Tickets", value: String(unit.ticketCount) },
      { source: "domain", label: "Repeat purchases", value: String(unit.repeatPurchases) },
      { source: "domain", label: "LTV cents", value: String(unit.ltvCents) },
      { source: "registry", label: "Marketplace segment", value: unit.marketplaceId ?? "unmapped" },
      { source: "registry", label: "CRM provider", value: unit.registryProviderId ?? "unmapped" },
      { source: "registry", label: "Customer countries", value: String(discovery.customerCountries.length) },
      { source: "advertising", label: "Blended ROAS input", value: crossSignals.adBlendedRoas.toFixed(1) },
      { source: "analytics", label: "Profit today cents", value: String(crossSignals.orderProfitTodayCents) },
    ],
    recommendedAction: "",
    recommendation,
    computedAt,
  };
  contract.recommendedAction = recommendedActionFromContract(contract);
  return contract;
}

export function rankCustomerAnalysisContracts(
  customers: CustomerIntelligenceAnalysisContract[],
): CustomerIntelligenceAnalysisContract[] {
  return [...customers].sort((a, b) => {
    const scoreA = a.customerScore * 0.4 + a.ltvScore * 0.3 + a.retentionScore * 0.2 - a.churnRiskScore * 0.1;
    const scoreB = b.customerScore * 0.4 + b.ltvScore * 0.3 + b.retentionScore * 0.2 - b.churnRiskScore * 0.1;
    return scoreB - scoreA;
  });
}

export function buildCustomerComparison(
  customers: CustomerIntelligenceAnalysisContract[],
): CustomerComparisonRow[] {
  return rankCustomerAnalysisContracts(customers).map((customer, index) => ({
    customerId: customer.customerId,
    customerName: customer.customerName,
    customerScore: customer.customerScore,
    ltvScore: customer.ltvScore,
    churnRiskScore: customer.churnRiskScore,
    rank: index + 1,
    recommendation: customer.recommendation,
  }));
}

export function buildCustomerIntelligenceEngineArchitecture(): CustomerIntelligenceEngineArchitecture {
  const customerDiscovery = buildCustomerIntelligenceDiscoveryView();
  return {
    schemaVersion: G3_07_SCHEMA_VERSION,
    computedAt: new Date().toISOString(),
    engineId: "customer-intelligence-engine",
    displayName: "Customer Intelligence Engine",
    missionRef: "G3-07",
    scopeGate: "Architecture only — no live CRM or marketplace customer API connections in G3-07",
    customerDiscovery,
    capabilities: [...G3_07_CAPABILITIES],
    integrations: [...G3_07_ENGINE_INTEGRATIONS],
    dataFlow: G3_07_DATA_FLOW,
    futureExpansion: [
      ...customerDiscovery.customerServiceProviders.slice(0, 4).map(
        (p) => `${p.displayName} (${p.providerId}) — registry CRM platform`,
      ),
      "Live Shopify / Amazon buyer API signal ingestion",
      "Churn prediction model from QIE probability feeds",
      "Append REG customer provider row without engine code change",
    ],
  };
}

export function loadCustomerIntelligenceEngineView(workspaceId: string): CustomerIntelligenceEngineView {
  const architecture = buildCustomerIntelligenceEngineArchitecture();
  const discovery = architecture.customerDiscovery;
  const units = resolveRegistryDiscoveredCustomers(workspaceId, discovery);

  let adBlendedRoas = 2;
  try {
    const aie = loadAdvertisingIntelligenceEngineViewForWorkspace(workspaceId);
    const roasValues = aie.analysedCampaigns.map((c) => c.roas);
    adBlendedRoas =
      roasValues.length > 0 ? roasValues.reduce((s, r) => s + r, 0) / roasValues.length : 2;
  } catch {
    adBlendedRoas = 2;
  }

  const orderStats = orders.statsForWorkspace(workspaceId);
  const ticketStats = tickets.statsForWorkspace(workspaceId);
  loadFinanceView(workspaceId);

  const crossSignals = {
    adBlendedRoas,
    orderProfitTodayCents: orderStats.profitTodayCents,
    ticketCsat: ticketStats.csatScore,
    marketplaceSegmentCount: discovery.marketplaceSegments.length,
  };

  const analysedCustomers = units.map((unit) => analyseCustomerUnit(unit, discovery, crossSignals));
  const topSegments = rankCustomerAnalysisContracts(analysedCustomers).slice(0, 12);
  const retainCount = analysedCustomers.filter((c) => c.recommendation === "RETAIN").length;

  return {
    architecture,
    analysedCustomers,
    topSegments,
    customerComparison: buildCustomerComparison(analysedCustomers),
    executiveSummary: `${analysedCustomers.length} customer segments analysed · ${retainCount} RETAIN recommendations · ${discovery.customerServiceProviders.length} registry CRM providers · ${discovery.marketplaceSegments.length} marketplace segments`,
    nextExecutiveAction:
      topSegments[0]?.recommendedAction ??
      "Seed orders and support tickets in domain store to activate customer analysis",
  };
}
