/**
 * G3-01 — Product Intelligence Engine · Architecture Layer
 * Executive AI Engine for discovery, scoring, ranking, and monitoring.
 * Architecture only — no live API connections in G3-01.
 */

import {
  buildIntelligenceMarketDiscoverySnapshot,
  formatIntelligenceSourceSummary,
  resolveDefaultProductSourceIds,
  resolveIntelligenceSources,
  type IntelligenceSourceDefinition,
} from "../shared/intelligence-market-discovery.js";
import type { ProductIntelligenceCatalogRecord } from "./catalog-repository.js";
import type { ProductIntelligenceRecommendation } from "./types.js";

export const G3_01_SCHEMA_VERSION = "g3-01-v1" as const;

/** Registry-derived source id — never hardcode marketplace names in engine logic. */
export type ProductIntelligenceSourceId = string;

export type ProductIntelligenceSourceStatus =
  | "architecture"
  | "mock"
  | "live"
  | "future";

/** @deprecated Use IntelligenceSourceDefinition from intelligence-market-discovery. */
export type ProductIntelligenceSourceDefinition = IntelligenceSourceDefinition;

/** G3-01 — Ten core engine capabilities. */
export type ProductIntelligenceCapabilityId =
  | "product_discovery"
  | "product_scoring"
  | "product_ranking"
  | "trend_monitoring"
  | "profitability_estimation"
  | "competition_analysis"
  | "supplier_availability"
  | "marketplace_availability"
  | "product_lifecycle_tracking"
  | "executive_recommendations";

export type ProductIntelligenceCapabilityDefinition = {
  id: ProductIntelligenceCapabilityId;
  label: string;
  description: string;
  implementationStatus: "live" | "partial" | "architecture";
  dataMode: "mock" | "domain-store" | "future";
};

/** Integrated Executive AI Engines (G3-01 integration map). */
export type ProductIntelligenceEngineIntegrationId =
  | "supplier-engine"
  | "marketplace-engine"
  | "quantitative-intelligence-engine"
  | "advertising-engine"
  | "analytics-engine";

export type ProductIntelligenceEngineIntegration = {
  engineId: ProductIntelligenceEngineIntegrationId;
  label: string;
  relationship: "feeds" | "consumes" | "validates" | "reports";
  description: string;
  cockpitRoute: string;
  brainModule: string;
};

export type ProductIntelligenceEvidence = {
  source: string;
  label: string;
  value: string;
  href?: string | null;
};

/**
 * G3-01 — Every analysed product exposes this contract.
 * Mapped from PIE catalog + evaluation aggregates (no new LLM logic).
 */
export type ProductIntelligenceAnalysisContract = {
  productId: string;
  productName: string;
  category: string;
  intelligenceScore: number;
  profitScore: number;
  competitionScore: number;
  riskScore: number;
  confidence: number;
  supportingEvidence: ProductIntelligenceEvidence[];
  recommendedAction: string;
  recommendation: ProductIntelligenceRecommendation;
  lifecycleStage: "discovered" | "scored" | "ranked" | "monitored" | "archived";
  sourceIds: ProductIntelligenceSourceId[];
  computedAt: string;
};

export type ProductIntelligenceEngineArchitecture = {
  schemaVersion: typeof G3_01_SCHEMA_VERSION;
  computedAt: string;
  engineId: "product-intelligence-engine";
  displayName: string;
  missionRef: "G3-01";
  scopeGate: string;
  marketDiscovery: ReturnType<typeof buildIntelligenceMarketDiscoverySnapshot>;
  sources: ProductIntelligenceSourceDefinition[];
  capabilities: ProductIntelligenceCapabilityDefinition[];
  integrations: ProductIntelligenceEngineIntegration[];
  dataFlow: Array<{ stage: string; from: string; to: string; description: string }>;
  futureExpansion: string[];
};

export type ProductIntelligenceEngineView = {
  architecture: ProductIntelligenceEngineArchitecture;
  catalogSize: number;
  analysedProducts: ProductIntelligenceAnalysisContract[];
  topRanked: ProductIntelligenceAnalysisContract[];
  executiveSummary: string;
  nextExecutiveAction: string;
};

/** Registry-discovered sources — V1 channels are deployment config, not engine constants. */
export function loadProductIntelligenceSources(): ProductIntelligenceSourceDefinition[] {
  return resolveIntelligenceSources();
}

/** @deprecated Use loadProductIntelligenceSources() — kept for backward-compatible test imports. */
export const G3_01_V1_SOURCES: readonly ProductIntelligenceSourceDefinition[] =
  loadProductIntelligenceSources();

export const G3_01_CAPABILITIES: readonly ProductIntelligenceCapabilityDefinition[] = [
  {
    id: "product_discovery",
    label: "Product discovery",
    description: "Seed and ingest product candidates from supported sources",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "product_scoring",
    label: "Product scoring",
    description: "PIE dimension scoring — demand, competition, margin, shipping, supplier",
    implementationStatus: "live",
    dataMode: "domain-store",
  },
  {
    id: "product_ranking",
    label: "Product ranking",
    description: "Rank scored products by intelligence and profit composite",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "trend_monitoring",
    label: "Trend monitoring",
    description: "Track trend direction from connector signals and historical demand",
    implementationStatus: "partial",
    dataMode: "mock",
  },
  {
    id: "profitability_estimation",
    label: "Profitability estimation",
    description: "Margin score from purchase, sell, and shipping cost signals",
    implementationStatus: "live",
    dataMode: "domain-store",
  },
  {
    id: "competition_analysis",
    label: "Competition analysis",
    description: "Competition intensity normalised to Empire-friendly score",
    implementationStatus: "live",
    dataMode: "domain-store",
  },
  {
    id: "supplier_availability",
    label: "Supplier availability",
    description: "CJ and supplier engine cross-check for fulfilment readiness",
    implementationStatus: "partial",
    dataMode: "mock",
  },
  {
    id: "marketplace_availability",
    label: "Marketplace availability",
    description: "Registry-discovered marketplace channel listing readiness",
    implementationStatus: "architecture",
    dataMode: "future",
  },
  {
    id: "product_lifecycle_tracking",
    label: "Product lifecycle tracking",
    description: "Discovered → scored → ranked → monitored lifecycle stages",
    implementationStatus: "architecture",
    dataMode: "future",
  },
  {
    id: "executive_recommendations",
    label: "Executive recommendations",
    description: "SELL / REVIEW / DO_NOT_SELL with recommended next action",
    implementationStatus: "live",
    dataMode: "domain-store",
  },
];

export const G3_01_ENGINE_INTEGRATIONS: readonly ProductIntelligenceEngineIntegration[] = [
  {
    engineId: "supplier-engine",
    label: "Supplier Engine",
    relationship: "feeds",
    description: "Supplier reliability, CJ credentials, and fulfilment availability",
    cockpitRoute: "/cockpit/intelligence/suppliers",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "marketplace-engine",
    label: "Marketplace Engine",
    relationship: "feeds",
    description: "Marketplace Registry profiles, channel listings, marketplace health",
    cockpitRoute: "/cockpit/intelligence/marketplace",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "quantitative-intelligence-engine",
    label: "Quantitative Intelligence Engine",
    relationship: "consumes",
    description: "Consumes PIE scores for discovery board and opportunity ranking",
    cockpitRoute: "/cockpit/intelligence/discovery",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "advertising-engine",
    label: "Advertising Engine",
    relationship: "validates",
    description: "Campaign potential and ad spend feasibility for ranked products",
    cockpitRoute: "/cockpit/commerce/marketing",
    brainModule: "cockpit-engine",
  },
  {
    engineId: "analytics-engine",
    label: "Analytics Engine",
    description: "Revenue telemetry and PROOF-001 validation for launched SKUs",
    relationship: "reports",
    cockpitRoute: "/cockpit/finance/profit",
    brainModule: "cockpit-engine",
  },
];

export const G3_01_DATA_FLOW: ProductIntelligenceEngineArchitecture["dataFlow"] = [
  {
    stage: "1 — Discovery",
    from: "Marketplace Registry → deployment channels + suppliers",
    to: "Connector signal plane",
    description: "Mock/architecture connectors emit normalized ProductIntelligenceSignal",
  },
  {
    stage: "2 — Scoring",
    from: "Connector signals + supplier data",
    to: "PIE evaluateProduct()",
    description: "Dimension scores → overall intelligence score",
  },
  {
    stage: "3 — Persistence",
    from: "PIE evaluation",
    to: "product_intelligence_catalog",
    description: "Catalog repository stores scored products per workspace",
  },
  {
    stage: "4 — Ranking",
    from: "Catalog",
    to: "Product Intelligence Engine view",
    description: "Composite rank by intelligence + profit − risk",
  },
  {
    stage: "5 — Executive output",
    from: "Analysis contract",
    to: "Cockpit SCR-100 + QIE + Global Assistant",
    description: "Seven-field contract exposed per analysed product",
  },
  {
    stage: "6 — Engine integration",
    from: "PIE rankings",
    to: "Supplier · Marketplace · Ads · Analytics",
    description: "Downstream engines consume ranked opportunities (architecture wiring)",
  },
];

function deriveRiskScore(record: ProductIntelligenceCatalogRecord): number {
  const competitionRisk = Math.max(0, 100 - record.competitionScore);
  const supplierRisk =
    record.supplierAvailability === "high"
      ? 10
      : record.supplierAvailability === "medium"
        ? 30
        : record.supplierAvailability === "low"
          ? 55
          : 85;
  const trendRisk =
    record.trendDirection === "falling" ? 25 : record.trendDirection === "stable" ? 10 : 0;
  return Math.min(100, Math.round(competitionRisk * 0.4 + supplierRisk * 0.4 + trendRisk * 0.2));
}

function recommendedActionFromRecord(
  record: ProductIntelligenceCatalogRecord,
): string {
  if (record.recommendation === "SELL") {
    return `Prioritise launch review for ${record.productName} — intelligence score ${record.overallScore}`;
  }
  if (record.recommendation === "REVIEW") {
    return `Executive review required — ${record.explanation.slice(0, 120)}`;
  }
  return `Do not pursue — ${record.explanation.slice(0, 120)}`;
}

function lifecycleStage(record: ProductIntelligenceCatalogRecord): ProductIntelligenceAnalysisContract["lifecycleStage"] {
  if (record.overallScore >= 70 && record.recommendation === "SELL") return "ranked";
  if (record.overallScore >= 50) return "scored";
  return "discovered";
}

function sourceIdsForRecord(): ProductIntelligenceSourceId[] {
  return resolveDefaultProductSourceIds();
}

export function mapCatalogToAnalysisContract(
  record: ProductIntelligenceCatalogRecord,
): ProductIntelligenceAnalysisContract {
  return {
    productId: record.id,
    productName: record.productName,
    category: record.category,
    intelligenceScore: record.overallScore,
    profitScore: record.marginScore,
    competitionScore: record.competitionScore,
    riskScore: deriveRiskScore(record),
    confidence: record.confidence,
    supportingEvidence: [
      { source: "pie", label: "Demand score", value: String(record.demandScore) },
      { source: "pie", label: "Competition score", value: String(record.competitionScore) },
      { source: "pie", label: "Margin score", value: String(record.marginScore) },
      { source: "pie", label: "Supplier availability", value: record.supplierAvailability },
      { source: "pie", label: "Trend", value: record.trendDirection },
      { source: "pie", label: "Provider signals", value: String(record.providerCount) },
    ],
    recommendedAction: recommendedActionFromRecord(record),
    recommendation: record.recommendation,
    lifecycleStage: lifecycleStage(record),
    sourceIds: sourceIdsForRecord(),
    computedAt: record.evaluatedAt,
  };
}

export function rankAnalysisContracts(
  products: ProductIntelligenceAnalysisContract[],
): ProductIntelligenceAnalysisContract[] {
  return [...products].sort((a, b) => {
    const scoreA = a.intelligenceScore * 0.5 + a.profitScore * 0.3 - a.riskScore * 0.2;
    const scoreB = b.intelligenceScore * 0.5 + b.profitScore * 0.3 - b.riskScore * 0.2;
    return scoreB - scoreA;
  });
}

function buildFutureExpansionFromRegistry(
  discovery: ReturnType<typeof buildIntelligenceMarketDiscoverySnapshot>,
): string[] {
  const expansionLabels = discovery.expansionMarketplaces
    .slice(0, 8)
    .map((p) => `${p.displayName} (${p.countryCode}) — registry expansion`);
  return [
    ...expansionLabels,
    "Append deployment profile row to activate expansion marketplace in V1",
    "GPIE discovery runs and opportunity rankings tables",
    "Live connector signal ingestion per channel launch readiness",
    "Product lifecycle state machine with REAL-013 live-PIE",
    "Generative product briefs (explicitly out of G3-01 scope)",
  ];
}

export function buildProductIntelligenceEngineArchitecture(): ProductIntelligenceEngineArchitecture {
  const marketDiscovery = buildIntelligenceMarketDiscoverySnapshot();
  return {
    schemaVersion: G3_01_SCHEMA_VERSION,
    computedAt: new Date().toISOString(),
    engineId: "product-intelligence-engine",
    displayName: "Product Intelligence Engine",
    missionRef: "G3-01",
    scopeGate: "Architecture only — no live API connections in G3-01",
    marketDiscovery,
    sources: marketDiscovery.intelligenceSources,
    capabilities: [...G3_01_CAPABILITIES],
    integrations: [...G3_01_ENGINE_INTEGRATIONS],
    dataFlow: G3_01_DATA_FLOW,
    futureExpansion: buildFutureExpansionFromRegistry(marketDiscovery),
  };
}

export function loadProductIntelligenceEngineView(
  products: ProductIntelligenceCatalogRecord[],
): ProductIntelligenceEngineView {
  const analysed = products.map(mapCatalogToAnalysisContract);
  const topRanked = rankAnalysisContracts(analysed).slice(0, 12);
  const sellCount = analysed.filter((p) => p.recommendation === "SELL").length;

  const sources = resolveIntelligenceSources();

  return {
    architecture: buildProductIntelligenceEngineArchitecture(),
    catalogSize: products.length,
    analysedProducts: analysed,
    topRanked,
    executiveSummary:
      products.length > 0
        ? `${products.length} products analysed · ${sellCount} SELL recommendations · Registry sources: ${formatIntelligenceSourceSummary(sources)}`
        : "Product catalog empty — seed PIE catalog to activate Product Intelligence Engine",
    nextExecutiveAction:
      topRanked[0]?.recommendedAction ??
      "Seed product intelligence catalog and run discovery scan",
  };
}
