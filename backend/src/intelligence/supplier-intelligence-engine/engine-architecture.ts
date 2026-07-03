/**
 * G3-03 — Supplier Intelligence Engine · Architecture Layer
 * Executive AI Engine for registry-discovered supplier scoring, comparison, and recommendations.
 * Architecture only — no live supplier API connections in G3-03.
 */

import { buildMarketIntelligenceDiscoveryView } from "../../registry/index.js";
import type { DiscoverySnapshotView } from "../../registry/index.js";
import type { ProviderEntry } from "../../runtime/global-commerce/models/global-registry.js";
import type { MarketplaceChannelProfile } from "../shared/marketplace-channel-registry.js";
import { supplierIntelligenceEvaluationEngine } from "./supplier-intelligence-engine.js";
import { listMockCatalog } from "./mock-catalog.js";
import type { SupplierCatalogRecord, SupplierEvaluation, SupplierOverallRecommendation } from "./types.js";

export const G3_03_SCHEMA_VERSION = "g3-03-v1" as const;

export type SupplierIntelligenceEvidence = {
  source: string;
  label: string;
  value: string;
  href?: string | null;
};

/** G3-03 — Every analysed supplier exposes this contract. */
export type SupplierIntelligenceAnalysisContract = {
  supplierId: string;
  supplierName: string;
  registryId: string | null;
  supplierScore: number;
  reliability: number;
  risk: number;
  confidence: number;
  supportingEvidence: SupplierIntelligenceEvidence[];
  recommendedAction: string;
  recommendation: SupplierOverallRecommendation;
  computedAt: string;
};

export type SupplierIntelligenceCapabilityId =
  | "supplier_scoring"
  | "reliability_analysis"
  | "fulfilment_performance"
  | "stock_confidence"
  | "pricing_stability"
  | "quality_confidence"
  | "geographic_coverage"
  | "supplier_risk"
  | "supplier_comparison"
  | "executive_recommendations";

export type SupplierIntelligenceCapabilityDefinition = {
  id: SupplierIntelligenceCapabilityId;
  label: string;
  description: string;
  implementationStatus: "live" | "partial" | "architecture";
  dataMode: "mock" | "domain-store" | "registry" | "future";
};

export type SupplierIntelligenceEngineIntegrationId =
  | "supplier-engine"
  | "marketplace-engine"
  | "product-intelligence-engine"
  | "quantitative-intelligence-engine"
  | "logistics-engine";

export type SupplierIntelligenceEngineIntegration = {
  engineId: SupplierIntelligenceEngineIntegrationId;
  label: string;
  relationship: "feeds" | "consumes" | "validates" | "reports";
  description: string;
  cockpitRoute: string;
  brainModule: string;
};

export type SupplierComparisonRow = {
  supplierId: string;
  supplierName: string;
  supplierScore: number;
  reliability: number;
  risk: number;
  rank: number;
  recommendation: SupplierOverallRecommendation;
};

export type RegistryDiscoveredSupplier = {
  registryId: string;
  displayName: string;
  countryCode: string;
  connectorRef: string | null;
  catalogRecord: SupplierCatalogRecord;
  source: "registry-catalog" | "registry-architecture";
};

export type SupplierIntelligenceEngineArchitecture = {
  schemaVersion: typeof G3_03_SCHEMA_VERSION;
  computedAt: string;
  engineId: "supplier-intelligence-engine";
  displayName: string;
  missionRef: "G3-03";
  scopeGate: string;
  supplierDiscovery: DiscoverySnapshotView;
  discoveredSupplierCount: number;
  capabilities: SupplierIntelligenceCapabilityDefinition[];
  integrations: SupplierIntelligenceEngineIntegration[];
  dataFlow: Array<{ stage: string; from: string; to: string; description: string }>;
  futureExpansion: string[];
};

export type SupplierIntelligenceEngineView = {
  architecture: SupplierIntelligenceEngineArchitecture;
  analysedSuppliers: SupplierIntelligenceAnalysisContract[];
  topRanked: SupplierIntelligenceAnalysisContract[];
  supplierComparison: SupplierComparisonRow[];
  executiveSummary: string;
  nextExecutiveAction: string;
};

export const G3_03_CAPABILITIES: readonly SupplierIntelligenceCapabilityDefinition[] = [
  {
    id: "supplier_scoring",
    label: "Supplier scoring",
    description: "Composite trust score from quality, shipping, reliability, and pricing dimensions",
    implementationStatus: "live",
    dataMode: "mock",
  },
  {
    id: "reliability_analysis",
    label: "Reliability",
    description: "Tenure, verification, and historical fulfilment reliability signals",
    implementationStatus: "live",
    dataMode: "mock",
  },
  {
    id: "fulfilment_performance",
    label: "Fulfilment performance",
    description: "Shipping speed and fulfilment readiness from catalog signals",
    implementationStatus: "partial",
    dataMode: "mock",
  },
  {
    id: "stock_confidence",
    label: "Stock confidence",
    description: "Catalog depth and product count as inventory availability proxy",
    implementationStatus: "architecture",
    dataMode: "mock",
  },
  {
    id: "pricing_stability",
    label: "Pricing stability",
    description: "Unit cost competitiveness vs benchmark pricing",
    implementationStatus: "live",
    dataMode: "mock",
  },
  {
    id: "quality_confidence",
    label: "Quality confidence",
    description: "Quality index, defect rate, and verification status",
    implementationStatus: "live",
    dataMode: "mock",
  },
  {
    id: "geographic_coverage",
    label: "Geographic coverage",
    description: "Registry country code and supplier region coverage",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "supplier_risk",
    label: "Supplier risk",
    description: "Fake supplier detection, Guardian flags, and risk composite",
    implementationStatus: "live",
    dataMode: "mock",
  },
  {
    id: "supplier_comparison",
    label: "Supplier comparison",
    description: "Ranked side-by-side supplier scorecards",
    implementationStatus: "partial",
    dataMode: "mock",
  },
  {
    id: "executive_recommendations",
    label: "Executive recommendations",
    description: "SELL / REVIEW / REJECT with recommended next action",
    implementationStatus: "live",
    dataMode: "mock",
  },
];

export const G3_03_ENGINE_INTEGRATIONS: readonly SupplierIntelligenceEngineIntegration[] = [
  {
    engineId: "supplier-engine",
    label: "Supplier Engine",
    relationship: "feeds",
    description: "CJ connector credentials, fulfilment handoff, and supplier domain store",
    cockpitRoute: "/cockpit/intelligence/suppliers",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "marketplace-engine",
    label: "Marketplace Engine",
    relationship: "validates",
    description: "Channel listing readiness and marketplace fulfilment constraints",
    cockpitRoute: "/cockpit/intelligence/marketplace",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "product-intelligence-engine",
    label: "Product Intelligence Engine",
    relationship: "consumes",
    description: "Supplier availability signals for product scoring and SELL recommendations",
    cockpitRoute: "/cockpit/intelligence/products",
    brainModule: "product-intelligence-engine",
  },
  {
    engineId: "quantitative-intelligence-engine",
    label: "Quantitative Intelligence Engine",
    relationship: "reports",
    description: "Supplier score feeds discovery board and opportunity ranking",
    cockpitRoute: "/cockpit/intelligence/discovery",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "logistics-engine",
    label: "Logistics Engine",
    relationship: "validates",
    description: "Shipping lead times, fulfilment routing, and logistics health",
    cockpitRoute: "/cockpit/operations/fulfillment",
    brainModule: "cockpit-engine",
  },
];

export const G3_03_DATA_FLOW: SupplierIntelligenceEngineArchitecture["dataFlow"] = [
  {
    stage: "1 — Discovery",
    from: "RegistryLoader → supplierProviders + supplier deployment channels",
    to: "Registry-discovered supplier universe",
    description: "No hardcoded supplier lists — iterate registry snapshot at runtime",
  },
  {
    stage: "2 — Catalog overlay",
    from: "Mock catalog (architecture signals)",
    to: "Matched supplier records",
    description: "Catalog matched by connectorId / registryId — architecture defaults for unmatched rows",
  },
  {
    stage: "3 — Scoring",
    from: "Supplier catalog + signals",
    to: "SIE evaluateSupplier()",
    description: "Trust, reliability, quality, pricing, fake risk dimensions",
  },
  {
    stage: "4 — Comparison",
    from: "Scored suppliers",
    to: "Supplier comparison board",
    description: "Ranked scorecards with SELL / REVIEW / REJECT",
  },
  {
    stage: "5 — Executive output",
    from: "Analysis contract",
    to: "Cockpit SCR-101 + PIE + QIE",
    description: "Six-field contract exposed per analysed supplier",
  },
  {
    stage: "6 — Engine integration",
    from: "Supplier rankings",
    to: "Supplier Engine · Marketplace · Logistics",
    description: "Downstream engines consume supplier priority signals (architecture wiring)",
  },
];

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function connectorCandidates(
  provider: ProviderEntry,
  channels: MarketplaceChannelProfile[],
): string[] {
  const channelIds = channels
    .filter((c) => c.globalCommerceProviderId === provider.providerId || c.channelType === "supplier")
    .map((c) => c.registryId);
  return [
    provider.realityProviderId,
    provider.providerId,
    ...channelIds,
  ].filter((id): id is string => Boolean(id));
}

function findCatalogMatch(
  provider: ProviderEntry,
  channels: MarketplaceChannelProfile[],
): SupplierCatalogRecord | undefined {
  const candidates = new Set(connectorCandidates(provider, channels));
  return listMockCatalog().find(
    (s) => candidates.has(s.connectorId) || candidates.has(s.id),
  );
}

function architectureSupplierFromRegistry(
  provider: ProviderEntry,
  channel: MarketplaceChannelProfile | undefined,
): SupplierCatalogRecord {
  const connectorId = channel?.registryId ?? provider.realityProviderId ?? provider.providerId;
  return {
    id: `reg:${provider.providerId}`,
    name: provider.displayName,
    region: provider.countryCode === "GLOBAL" ? "GLOBAL" : provider.countryCode,
    connectorId,
    productCount: 40,
    avgUnitCostCents: 900,
    avgShipDays: 14,
    reliabilityScore: 60,
    status: "active",
    qualityIndex: 55,
    defectRatePct: 5,
    verified: channel?.launchReadiness === "live" || channel?.launchReadiness === "verified",
    yearsActive: 2,
    benchmarkUnitCostCents: 950,
  };
}

export function resolveRegistryDiscoveredSuppliers(
  discovery: DiscoverySnapshotView = buildMarketIntelligenceDiscoveryView({}),
): RegistryDiscoveredSupplier[] {
  const supplierChannels = discovery.deploymentChannels.filter((c) => c.channelType === "supplier");
  const seen = new Set<string>();
  const results: RegistryDiscoveredSupplier[] = [];

  for (const provider of discovery.supplierProviders) {
    if (seen.has(provider.providerId)) continue;
    seen.add(provider.providerId);

    const channel = supplierChannels.find(
      (c) => c.globalCommerceProviderId === provider.providerId || c.registryId === provider.realityProviderId,
    );
    const catalogMatch = findCatalogMatch(provider, supplierChannels);
    const catalogRecord = catalogMatch ?? architectureSupplierFromRegistry(provider, channel);

    results.push({
      registryId: provider.providerId,
      displayName: provider.displayName,
      countryCode: provider.countryCode,
      connectorRef: channel?.connectorRef ?? provider.realityProviderId ?? null,
      catalogRecord,
      source: catalogMatch ? "registry-catalog" : "registry-architecture",
    });
  }

  for (const channel of supplierChannels) {
    const providerId = channel.globalCommerceProviderId ?? channel.registryId;
    if (seen.has(providerId)) continue;
    seen.add(providerId);

    const provider: ProviderEntry = {
      providerId,
      displayName: channel.displayName,
      domain: "supplier",
      countryCode: channel.countryCode,
      realityProviderId: channel.registryId,
    };
    const catalogMatch = listMockCatalog().find((s) => s.connectorId === channel.registryId);
    const catalogRecord = catalogMatch ?? architectureSupplierFromRegistry(provider, channel);

    results.push({
      registryId: providerId,
      displayName: channel.displayName,
      countryCode: channel.countryCode,
      connectorRef: channel.connectorRef,
      catalogRecord,
      source: catalogMatch ? "registry-catalog" : "registry-architecture",
    });
  }

  return results;
}

function deriveRiskScore(evaluation: SupplierEvaluation): number {
  const guardianPenalty = evaluation.guardianVerdict.flags.length * 8;
  return clampScore(evaluation.fakeSupplierRisk + guardianPenalty);
}

function deriveStockConfidence(supplier: SupplierCatalogRecord): number {
  return clampScore(Math.min(100, supplier.productCount / 4) + (supplier.verified ? 10 : 0));
}

function recommendedActionFromEvaluation(
  evaluation: SupplierEvaluation,
): string {
  if (evaluation.overallRecommendation === "SELL") {
    return `Approve sourcing via ${evaluation.supplierName} — supplier score ${evaluation.trustScore}, reliability ${evaluation.reliabilityScore}`;
  }
  if (evaluation.overallRecommendation === "REVIEW") {
    return `Executive review required for ${evaluation.supplierName} — ${evaluation.explanation.slice(0, 120)}`;
  }
  return `Reject ${evaluation.supplierName} — risk ${evaluation.fakeSupplierRisk}, ${evaluation.explanation.slice(0, 100)}`;
}

export function mapEvaluationToAnalysisContract(
  evaluation: SupplierEvaluation,
  registryId: string | null,
  supplier: SupplierCatalogRecord,
): SupplierIntelligenceAnalysisContract {
  const contract: SupplierIntelligenceAnalysisContract = {
    supplierId: evaluation.supplierId,
    supplierName: evaluation.supplierName,
    registryId,
    supplierScore: evaluation.trustScore,
    reliability: evaluation.reliabilityScore,
    risk: deriveRiskScore(evaluation),
    confidence: evaluation.confidence,
    supportingEvidence: [
      { source: "sie", label: "Quality score", value: String(evaluation.qualityScore) },
      { source: "sie", label: "Fulfilment (shipping)", value: String(evaluation.shippingScore) },
      { source: "sie", label: "Pricing stability", value: String(evaluation.pricingScore) },
      { source: "sie", label: "Stock confidence", value: String(deriveStockConfidence(supplier)) },
      { source: "sie", label: "Geographic region", value: supplier.region },
      { source: "sie", label: "Fake supplier risk", value: String(evaluation.fakeSupplierRisk) },
      { source: "guardian", label: "Guardian flags", value: evaluation.guardianVerdict.flags.join(", ") || "none" },
    ],
    recommendedAction: recommendedActionFromEvaluation(evaluation),
    recommendation: evaluation.overallRecommendation,
    computedAt: evaluation.evaluatedAt,
  };
  return contract;
}

export function rankSupplierAnalysisContracts(
  suppliers: SupplierIntelligenceAnalysisContract[],
): SupplierIntelligenceAnalysisContract[] {
  return [...suppliers].sort((a, b) => {
    const scoreA = a.supplierScore * 0.5 + a.reliability * 0.25 - a.risk * 0.25;
    const scoreB = b.supplierScore * 0.5 + b.reliability * 0.25 - b.risk * 0.25;
    return scoreB - scoreA;
  });
}

export function buildSupplierComparison(
  suppliers: SupplierIntelligenceAnalysisContract[],
): SupplierComparisonRow[] {
  return rankSupplierAnalysisContracts(suppliers).map((supplier, index) => ({
    supplierId: supplier.supplierId,
    supplierName: supplier.supplierName,
    supplierScore: supplier.supplierScore,
    reliability: supplier.reliability,
    risk: supplier.risk,
    rank: index + 1,
    recommendation: supplier.recommendation,
  }));
}

function buildFutureExpansionFromRegistry(discovery: DiscoverySnapshotView): string[] {
  const expansionLabels = discovery.supplierProviders
    .slice(0, 6)
    .map((p) => `${p.displayName} (${p.providerId}) — registry supplier`);
  return [
    ...expansionLabels,
    "Append REG-SUPPLIER row to activate new supplier without engine code change",
    "Live CJ / Spocket / Zendrop API signal ingestion",
    "Stock confidence from live inventory feeds",
    "Fulfilment performance from Logistics Engine telemetry",
    "Generative supplier briefs (explicitly out of G3-03 scope)",
  ];
}

export function buildSupplierIntelligenceEngineArchitecture(): SupplierIntelligenceEngineArchitecture {
  const supplierDiscovery = buildMarketIntelligenceDiscoveryView({});
  const discovered = resolveRegistryDiscoveredSuppliers(supplierDiscovery);
  return {
    schemaVersion: G3_03_SCHEMA_VERSION,
    computedAt: new Date().toISOString(),
    engineId: "supplier-intelligence-engine",
    displayName: "Supplier Intelligence Engine",
    missionRef: "G3-03",
    scopeGate: "Architecture only — no live supplier API connections in G3-03",
    supplierDiscovery,
    discoveredSupplierCount: discovered.length,
    capabilities: [...G3_03_CAPABILITIES],
    integrations: [...G3_03_ENGINE_INTEGRATIONS],
    dataFlow: G3_03_DATA_FLOW,
    futureExpansion: buildFutureExpansionFromRegistry(supplierDiscovery),
  };
}

export function loadSupplierIntelligenceEngineView(workspaceId = "default"): SupplierIntelligenceEngineView {
  const architecture = buildSupplierIntelligenceEngineArchitecture();
  const discovered = resolveRegistryDiscoveredSuppliers(architecture.supplierDiscovery);

  const analysedSuppliers = discovered.map((entry) => {
    const evaluation = supplierIntelligenceEvaluationEngine.evaluateSupplierCatalogRecord(
      entry.catalogRecord,
      { workspaceId },
    );
    return mapEvaluationToAnalysisContract(evaluation, entry.registryId, entry.catalogRecord);
  });

  const topRanked = rankSupplierAnalysisContracts(analysedSuppliers).slice(0, 12);
  const sellCount = analysedSuppliers.filter((s) => s.recommendation === "SELL").length;

  return {
    architecture,
    analysedSuppliers,
    topRanked,
    supplierComparison: buildSupplierComparison(analysedSuppliers),
    executiveSummary: `${analysedSuppliers.length} registry-discovered suppliers analysed · ${sellCount} SELL recommendations · ${discovered.filter((d) => d.source === "registry-catalog").length} catalog matches`,
    nextExecutiveAction:
      topRanked[0]?.recommendedAction ??
      "Refresh RegistryLoader discovery snapshot to activate supplier analysis",
  };
}
