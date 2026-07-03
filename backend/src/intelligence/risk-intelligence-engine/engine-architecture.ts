/**
 * G3-08 — Risk Intelligence Engine · Architecture Layer
 * Executive AI Engine for continuous registry-driven business risk assessment.
 * Architecture only — no live compliance or marketplace policy API connections in G3-08.
 */

import { buildMarketIntelligenceDiscoveryView, getRegistryLoader } from "../../registry/index.js";
import { REG_COUNTRY } from "../../registry/types/registry-ids.js";
import {
  loadMarketplaceRows,
  loadPolicyCatalogRows,
  loadSupplierCatalogRows,
} from "../../registry/sources/platform-catalog-source.js";
import type { Country, ProviderEntry } from "../../runtime/global-commerce/models/global-registry.js";
import { loadFinancialIntelligenceEngineViewForWorkspace } from "../../domain/services/financial-intelligence-engine-views.js";
import { loadMarketIntelligenceEngineViewForWorkspace } from "../../domain/services/market-intelligence-engine-views.js";
import { loadSupplierIntelligenceEngineViewForWorkspace } from "../../domain/services/supplier-intelligence-engine-views.js";
import { OrderRepository } from "../../domain/repositories/order-repository.js";
import { TicketRepository } from "../../domain/repositories/ticket-repository.js";

const orders = new OrderRepository();
const tickets = new TicketRepository();

export const G3_08_SCHEMA_VERSION = "g3-08-v1" as const;

export type RiskSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RiskIntelligenceEvidence = {
  source: string;
  label: string;
  value: string;
  href?: string | null;
};

export type RiskIntelligenceCategoryId =
  | "marketplace_risk"
  | "supplier_risk"
  | "financial_risk"
  | "operational_risk"
  | "policy_risk"
  | "growth_risk";

/** G3-08 — Every assessed risk exposes this contract. */
export type RiskIntelligenceAnalysisContract = {
  riskId: string;
  riskName: string;
  riskCategory: RiskIntelligenceCategoryId;
  registrySourceId: string | null;
  riskScore: number;
  severity: RiskSeverity;
  probability: number;
  confidence: number;
  mitigation: string;
  recommendedAction: string;
  supportingEvidence: RiskIntelligenceEvidence[];
  computedAt: string;
};

export type RiskIntelligenceCapabilityDefinition = {
  id: RiskIntelligenceCategoryId;
  label: string;
  description: string;
  implementationStatus: "live" | "partial" | "architecture";
  dataMode: "mock" | "domain-store" | "registry" | "derived";
};

export type RiskIntelligenceEngineIntegrationId =
  | "market-intelligence-engine"
  | "supplier-intelligence-engine"
  | "financial-intelligence-engine"
  | "guardian";

export type RiskIntelligenceEngineIntegration = {
  engineId: RiskIntelligenceEngineIntegrationId;
  label: string;
  relationship: "feeds" | "consumes" | "validates" | "reports";
  description: string;
  cockpitRoute: string;
  brainModule: string;
};

export type RiskDiscoveryView = {
  computedAt: string;
  registrySource: "RegistryLoader:risk-discovery-composite";
  marketplaceProviders: ProviderEntry[];
  supplierProviders: ProviderEntry[];
  policyProviders: ProviderEntry[];
  operationalCountries: Country[];
  marketChannelCount: number;
};

export type RiskComparisonRow = {
  riskId: string;
  riskName: string;
  riskCategory: RiskIntelligenceCategoryId;
  riskScore: number;
  severity: RiskSeverity;
  probability: number;
  rank: number;
};

export type RiskIntelligenceEngineArchitecture = {
  schemaVersion: typeof G3_08_SCHEMA_VERSION;
  computedAt: string;
  engineId: "risk-intelligence-engine";
  displayName: string;
  missionRef: "G3-08";
  scopeGate: string;
  riskDiscovery: RiskDiscoveryView;
  capabilities: RiskIntelligenceCapabilityDefinition[];
  integrations: RiskIntelligenceEngineIntegration[];
  dataFlow: Array<{ stage: string; from: string; to: string; description: string }>;
  futureExpansion: string[];
};

export type RiskIntelligenceEngineView = {
  architecture: RiskIntelligenceEngineArchitecture;
  assessedRisks: RiskIntelligenceAnalysisContract[];
  topRisks: RiskIntelligenceAnalysisContract[];
  riskComparison: RiskComparisonRow[];
  executiveSummary: string;
  nextExecutiveAction: string;
};

export const G3_08_CAPABILITIES: readonly RiskIntelligenceCapabilityDefinition[] = [
  {
    id: "marketplace_risk",
    label: "Marketplace risk",
    description: "Registry marketplace dependency and channel concentration risk",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "supplier_risk",
    label: "Supplier risk",
    description: "Supplier trust, fake-supplier, and fulfilment reliability risk",
    implementationStatus: "partial",
    dataMode: "derived",
  },
  {
    id: "financial_risk",
    label: "Financial risk",
    description: "Margin, cash flow, and ROI scenario downside risk",
    implementationStatus: "partial",
    dataMode: "derived",
  },
  {
    id: "operational_risk",
    label: "Operational risk",
    description: "Order backlog, support escalation, and logistics coverage risk",
    implementationStatus: "partial",
    dataMode: "domain-store",
  },
  {
    id: "policy_risk",
    label: "Policy risk",
    description: "Registry policy frameworks and cross-border compliance exposure",
    implementationStatus: "partial",
    dataMode: "registry",
  },
  {
    id: "growth_risk",
    label: "Growth risk",
    description: "Market saturation and over-scaling growth trajectory risk",
    implementationStatus: "partial",
    dataMode: "derived",
  },
];

export const G3_08_ENGINE_INTEGRATIONS: readonly RiskIntelligenceEngineIntegration[] = [
  {
    engineId: "market-intelligence-engine",
    label: "Market Intelligence Engine",
    relationship: "feeds",
    description: "Country risk, saturation, and market entry downside signals",
    cockpitRoute: "/cockpit/intelligence/markets",
    brainModule: "market-intelligence-engine",
  },
  {
    engineId: "supplier-intelligence-engine",
    label: "Supplier Intelligence Engine",
    relationship: "feeds",
    description: "Supplier trust, fake-supplier, and reliability risk scores",
    cockpitRoute: "/cockpit/intelligence/suppliers",
    brainModule: "supplier-intelligence-engine",
  },
  {
    engineId: "financial-intelligence-engine",
    label: "Financial Intelligence Engine",
    relationship: "feeds",
    description: "Margin, ROI, and cash-flow scenario downside risk",
    cockpitRoute: "/cockpit/finance/intelligence",
    brainModule: "financial-intelligence-engine",
  },
  {
    engineId: "guardian",
    label: "Guardian",
    relationship: "validates",
    description: "Policy enforcement gates and architecture validation risk flags",
    cockpitRoute: "/cockpit/governance/v1",
    brainModule: "guardian",
  },
];

export const G3_08_DATA_FLOW: RiskIntelligenceEngineArchitecture["dataFlow"] = [
  {
    stage: "1 — Discovery",
    from: "RegistryLoader → marketplaces, suppliers, policy frameworks",
    to: "Risk universe",
    description: "Channel, supplier, and policy risk surfaces discovered dynamically",
  },
  {
    stage: "2 — Cross-engine overlay",
    from: "MIE + SIE + FIE + domain store",
    to: "Risk signals",
    description: "Market, supplier, financial, and operational telemetry merged",
  },
  {
    stage: "3 — Scoring",
    from: "Discovery + cross-engine",
    to: "RiskIntelligenceAnalysisContract",
    description: "Risk score, severity, probability, confidence, mitigation",
  },
  {
    stage: "4 — Executive output",
    from: "Analysis contract",
    to: "Cockpit SCR-108",
    description: "Ranked risk board with recommended mitigation actions",
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

function severityFromScore(riskScore: number): RiskSeverity {
  if (riskScore >= 80) return "CRITICAL";
  if (riskScore >= 60) return "HIGH";
  if (riskScore >= 40) return "MEDIUM";
  return "LOW";
}

export function buildRiskIntelligenceDiscoveryView(): RiskDiscoveryView {
  const marketDiscovery = buildMarketIntelligenceDiscoveryView({});
  const operationalCountries = (getRegistryLoader().resolve({}, REG_COUNTRY).rows as Country[]).filter(
    (c) => c.commerceDomains.includes("logistics"),
  );

  return {
    computedAt: new Date().toISOString(),
    registrySource: "RegistryLoader:risk-discovery-composite",
    marketplaceProviders: loadMarketplaceRows().slice(0, 16),
    supplierProviders: loadSupplierCatalogRows(),
    policyProviders: loadPolicyCatalogRows(),
    operationalCountries,
    marketChannelCount: marketDiscovery.intelligenceSources.length,
  };
}

type RegistryRiskUnit = {
  riskId: string;
  riskName: string;
  riskCategory: RiskIntelligenceCategoryId;
  registrySourceId: string | null;
  baseScore: number;
  baseProbability: number;
  source: "domain-store" | "cross-engine" | "registry-architecture";
};

export function resolveRegistryDiscoveredRisks(
  workspaceId: string,
  discovery: RiskDiscoveryView = buildRiskIntelligenceDiscoveryView(),
): RegistryRiskUnit[] {
  const units: RegistryRiskUnit[] = [];
  const seen = new Set<string>();

  let mieMarkets: Array<{ marketId: string; marketName: string; riskScore: number; saturationScore: number }> = [];
  try {
    const mie = loadMarketIntelligenceEngineViewForWorkspace(workspaceId);
    mieMarkets = mie.analysedMarkets.map((m) => ({
      marketId: m.marketId,
      marketName: m.marketName,
      riskScore: m.riskScore,
      saturationScore: m.saturationScore,
    }));
  } catch {
    mieMarkets = [];
  }

  for (const market of mieMarkets.filter((m) => m.riskScore >= 45).slice(0, 6)) {
    units.push({
      riskId: `mie:${market.marketId}`,
      riskName: `${market.marketName} market exposure`,
      riskCategory: "marketplace_risk",
      registrySourceId: market.marketId,
      baseScore: market.riskScore,
      baseProbability: clampScore(market.riskScore * 0.85),
      source: "cross-engine",
    });
    seen.add(market.marketId);
  }

  for (const mp of discovery.marketplaceProviders.slice(0, 8)) {
    if (seen.has(mp.providerId)) continue;
    const seed = hashSeed(mp.providerId);
    units.push({
      riskId: `mp:${mp.providerId}`,
      riskName: `${mp.displayName} channel dependency`,
      riskCategory: "marketplace_risk",
      registrySourceId: mp.providerId,
      baseScore: clampScore(35 + (seed % 35)),
      baseProbability: clampScore(30 + (seed % 40)),
      source: "registry-architecture",
    });
    seen.add(mp.providerId);
  }

  try {
    const sie = loadSupplierIntelligenceEngineViewForWorkspace(workspaceId);
    for (const supplier of sie.analysedSuppliers.filter((s) => s.risk >= 35).slice(0, 6)) {
      units.push({
        riskId: `sie:${supplier.supplierId}`,
        riskName: `${supplier.supplierName} supplier reliability`,
        riskCategory: "supplier_risk",
        registrySourceId: supplier.registryId,
        baseScore: supplier.risk,
        baseProbability: clampScore(supplier.risk * 0.9),
        source: "cross-engine",
      });
    }
  } catch {
    /* optional */
  }

  for (const supplier of discovery.supplierProviders) {
    if (units.some((u) => u.registrySourceId === supplier.providerId)) continue;
    units.push({
      riskId: `reg:sup:${supplier.providerId}`,
      riskName: `${supplier.displayName} supplier concentration`,
      riskCategory: "supplier_risk",
      registrySourceId: supplier.providerId,
      baseScore: 42,
      baseProbability: 38,
      source: "registry-architecture",
    });
  }

  try {
    const fie = loadFinancialIntelligenceEngineViewForWorkspace(workspaceId);
    for (const scenario of fie.analysedScenarios.filter(
      (s) => s.recommendation === "REDUCE" || s.financialScore < 50,
    ).slice(0, 4)) {
      units.push({
        riskId: `fie:${scenario.scenarioId}`,
        riskName: `${scenario.scenarioName} financial downside`,
        riskCategory: "financial_risk",
        registrySourceId: scenario.scenarioId,
        baseScore: clampScore(100 - scenario.financialScore),
        baseProbability: clampScore((100 - scenario.financialScore) * 0.75),
        source: "cross-engine",
      });
    }
  } catch {
    /* optional */
  }

  const orderStats = orders.statsForWorkspace(workspaceId);
  const ticketStats = tickets.statsForWorkspace(workspaceId);
  const operationalScore = clampScore(
    orderStats.processing * 8 + (100 - ticketStats.autoResolvedPct) * 0.4 + (ticketStats.avgResolutionSeconds > 60 ? 20 : 0),
  );
  if (operationalScore >= 30 || orderStats.processing > 0) {
    units.push({
      riskId: `ops:${workspaceId}`,
      riskName: "Order fulfilment and support backlog",
      riskCategory: "operational_risk",
      registrySourceId: null,
      baseScore: Math.max(operationalScore, 32),
      baseProbability: clampScore(operationalScore * 0.7),
      source: "domain-store",
    });
  }

  for (const policy of discovery.policyProviders) {
    units.push({
      riskId: `policy:${policy.providerId}`,
      riskName: `${policy.displayName} compliance exposure`,
      riskCategory: "policy_risk",
      registrySourceId: policy.providerId,
      baseScore: clampScore(40 + hashSeed(policy.providerId) % 30),
      baseProbability: clampScore(35 + hashSeed(policy.providerId) % 35),
      source: "registry-architecture",
    });
  }

  for (const market of mieMarkets.filter((m) => m.saturationScore >= 65).slice(0, 4)) {
    units.push({
      riskId: `growth:${market.marketId}`,
      riskName: `${market.marketName} growth saturation`,
      riskCategory: "growth_risk",
      registrySourceId: market.marketId,
      baseScore: market.saturationScore,
      baseProbability: clampScore(market.saturationScore * 0.8),
      source: "cross-engine",
    });
  }

  if (!units.some((u) => u.riskCategory === "growth_risk")) {
    units.push({
      riskId: "reg:growth:expansion",
      riskName: "Unvalidated expansion velocity",
      riskCategory: "growth_risk",
      registrySourceId: null,
      baseScore: 45,
      baseProbability: 40,
      source: "registry-architecture",
    });
  }

  return units;
}

function mitigationForCategory(category: RiskIntelligenceCategoryId, riskName: string): string {
  switch (category) {
    case "marketplace_risk":
      return `Diversify channels away from ${riskName} — reduce single-marketplace concentration`;
    case "supplier_risk":
      return `Qualify backup suppliers and tighten Guardian gates for ${riskName}`;
    case "financial_risk":
      return `Reduce exposure on ${riskName} — tighten margin guardrails and cash reserves`;
    case "operational_risk":
      return `Clear fulfilment backlog and automate support resolution for ${riskName}`;
    case "policy_risk":
      return `Audit compliance controls against ${riskName} before scaling listings`;
    case "growth_risk":
      return `Slow expansion pace for ${riskName} — validate unit economics before scaling`;
  }
}

function recommendedActionFromContract(contract: RiskIntelligenceAnalysisContract): string {
  const { severity, riskName, riskScore } = contract;
  if (severity === "CRITICAL") {
    return `Immediate executive review — ${riskName} at risk score ${riskScore}`;
  }
  if (severity === "HIGH") {
    return `Schedule mitigation sprint for ${riskName} within 7 days`;
  }
  if (severity === "MEDIUM") {
    return `Monitor ${riskName} weekly — assign risk owner`;
  }
  return `Track ${riskName} in next governance review`;
}

function analyseRiskUnit(
  unit: RegistryRiskUnit,
  discovery: RiskDiscoveryView,
  crossSignals: {
    guardianPolicyFlags: number;
    logisticsCountryCount: number;
    supplierProviderCount: number;
  },
): RiskIntelligenceAnalysisContract {
  const categoryBoost =
    unit.riskCategory === "policy_risk"
      ? crossSignals.guardianPolicyFlags * 5
      : unit.riskCategory === "operational_risk"
        ? Math.max(0, 10 - crossSignals.logisticsCountryCount)
        : 0;
  const riskScore = clampScore(unit.baseScore + categoryBoost);
  const probability = clampScore(unit.baseProbability + categoryBoost * 0.5);
  const confidence = clampScore(
    (unit.source === "cross-engine" ? 82 : unit.source === "domain-store" ? 76 : 50) +
      (unit.registrySourceId ? 8 : 0),
  );
  const severity = severityFromScore(riskScore);
  const computedAt = new Date().toISOString();

  const contract: RiskIntelligenceAnalysisContract = {
    riskId: unit.riskId,
    riskName: unit.riskName,
    riskCategory: unit.riskCategory,
    registrySourceId: unit.registrySourceId,
    riskScore,
    severity,
    probability,
    confidence,
    mitigation: mitigationForCategory(unit.riskCategory, unit.riskName),
    recommendedAction: "",
    supportingEvidence: [
      { source: "registry", label: "Category", value: unit.riskCategory },
      { source: "registry", label: "Source id", value: unit.registrySourceId ?? "unmapped" },
      { source: "registry", label: "Marketplace providers", value: String(discovery.marketplaceProviders.length) },
      { source: "registry", label: "Policy frameworks", value: String(discovery.policyProviders.length) },
      { source: "registry", label: "Supplier providers", value: String(crossSignals.supplierProviderCount) },
      { source: "registry", label: "Logistics countries", value: String(crossSignals.logisticsCountryCount) },
      { source: "guardian", label: "Policy flags", value: String(crossSignals.guardianPolicyFlags) },
    ],
    computedAt,
  };
  contract.recommendedAction = recommendedActionFromContract(contract);
  return contract;
}

export function rankRiskAnalysisContracts(
  risks: RiskIntelligenceAnalysisContract[],
): RiskIntelligenceAnalysisContract[] {
  return [...risks].sort((a, b) => {
    const scoreA = a.riskScore * 0.5 + a.probability * 0.35 + (100 - a.confidence) * 0.05;
    const scoreB = b.riskScore * 0.5 + b.probability * 0.35 + (100 - b.confidence) * 0.05;
    return scoreB - scoreA;
  });
}

export function buildRiskComparison(
  risks: RiskIntelligenceAnalysisContract[],
): RiskComparisonRow[] {
  return rankRiskAnalysisContracts(risks).map((risk, index) => ({
    riskId: risk.riskId,
    riskName: risk.riskName,
    riskCategory: risk.riskCategory,
    riskScore: risk.riskScore,
    severity: risk.severity,
    probability: risk.probability,
    rank: index + 1,
  }));
}

export function buildRiskIntelligenceEngineArchitecture(): RiskIntelligenceEngineArchitecture {
  const riskDiscovery = buildRiskIntelligenceDiscoveryView();
  return {
    schemaVersion: G3_08_SCHEMA_VERSION,
    computedAt: new Date().toISOString(),
    engineId: "risk-intelligence-engine",
    displayName: "Risk Intelligence Engine",
    missionRef: "G3-08",
    scopeGate: "Architecture only — no live compliance or marketplace policy API connections in G3-08",
    riskDiscovery,
    capabilities: [...G3_08_CAPABILITIES],
    integrations: [...G3_08_ENGINE_INTEGRATIONS],
    dataFlow: G3_08_DATA_FLOW,
    futureExpansion: [
      ...riskDiscovery.policyProviders.slice(0, 4).map(
        (p) => `${p.displayName} (${p.providerId}) — registry policy framework`,
      ),
      "Live marketplace policy violation webhooks",
      "Guardian real-time policy gate telemetry",
      "Append REG policy provider row without engine code change",
    ],
  };
}

export function loadRiskIntelligenceEngineView(workspaceId: string): RiskIntelligenceEngineView {
  const architecture = buildRiskIntelligenceEngineArchitecture();
  const discovery = architecture.riskDiscovery;
  const units = resolveRegistryDiscoveredRisks(workspaceId, discovery);

  const crossSignals = {
    guardianPolicyFlags: discovery.policyProviders.length,
    logisticsCountryCount: discovery.operationalCountries.length,
    supplierProviderCount: discovery.supplierProviders.length,
  };

  const assessedRisks = units.map((unit) => analyseRiskUnit(unit, discovery, crossSignals));
  const topRisks = rankRiskAnalysisContracts(assessedRisks).slice(0, 12);
  const criticalCount = assessedRisks.filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH").length;

  return {
    architecture,
    assessedRisks,
    topRisks,
    riskComparison: buildRiskComparison(assessedRisks),
    executiveSummary: `${assessedRisks.length} risks assessed · ${criticalCount} HIGH/CRITICAL · ${discovery.policyProviders.length} policy frameworks · ${discovery.marketplaceProviders.length} marketplace channels monitored`,
    nextExecutiveAction:
      topRisks[0]?.recommendedAction ??
      "Seed cross-engine telemetry to activate continuous risk assessment",
  };
}
