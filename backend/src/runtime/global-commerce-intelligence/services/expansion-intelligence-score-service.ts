import type { ExpansionIntelligenceScore, ExpansionScoreDimension } from "../models/expansion-intelligence-score.js";
import { buildPluginRegistrySnapshot } from "../../commerce-runtime/services/plugin-dispatch-service.js";
import {
  buildOrLoadGlobalCommerceIdentity,
  buildGlobalCommerceRegistry,
  computeOnboardingReadiness,
  getMarketplacesByCountry,
  listRuntimePluginCoverage,
} from "../../global-commerce/index.js";
import { getCountryIntelligenceProfile } from "./country-intelligence-service.js";
import { buildCommerceEcosystemProfile } from "./commerce-ecosystem-service.js";

const DIMENSION_WEIGHTS: Array<{ id: string; name: string; weight: number }> = [
  { id: "market_opportunity", name: "Market Opportunity", weight: 0.12 },
  { id: "competition", name: "Competition", weight: 0.06 },
  { id: "profit_potential", name: "Profit Potential", weight: 0.12 },
  { id: "expansion_cost", name: "Expansion Cost", weight: 0.08 },
  { id: "operational_complexity", name: "Operational Complexity", weight: 0.08 },
  { id: "automation_potential", name: "Automation Potential", weight: 0.08 },
  { id: "runtime_coverage", name: "Runtime Coverage", weight: 0.06 },
  { id: "plugin_coverage", name: "Plugin Coverage", weight: 0.06 },
  { id: "account_readiness", name: "Account Readiness", weight: 0.1 },
  { id: "supplier_coverage", name: "Supplier Coverage", weight: 0.06 },
  { id: "logistics_coverage", name: "Logistics Coverage", weight: 0.06 },
  { id: "payment_coverage", name: "Payment Coverage", weight: 0.06 },
  { id: "language_support", name: "Language Support", weight: 0.04 },
  { id: "risk", name: "Risk", weight: 0.06 },
];

function gradeFromScore(score: number): ExpansionIntelligenceScore["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function invert(value: number): number {
  return 100 - value;
}

/** B-013 — Weighted Expansion Intelligence Score per country. */
export function computeExpansionIntelligenceScore(
  workspaceId: string,
  companyId: string,
  countryCode: string,
): ExpansionIntelligenceScore | null {
  const intelligence = getCountryIntelligenceProfile(countryCode);
  const ecosystem = buildCommerceEcosystemProfile(countryCode);
  if (!intelligence || !ecosystem) return null;

  const identity = buildOrLoadGlobalCommerceIdentity({ workspaceId, companyId });
  const countryReadiness = identity.countryReadiness.find((c) => c.countryCode === countryCode);
  const accountReadinessScore = countryReadiness?.readinessScore ?? 0;

  const marketplaces = getMarketplacesByCountry(countryCode);
  const pluginCoverage = listRuntimePluginCoverage();
  const pluginSnapshot = buildPluginRegistrySnapshot();
  const pluginsWithCoverage = marketplaces.filter((m) => m.runtimePluginId).length;
  const pluginScore = marketplaces.length
    ? Math.round((pluginsWithCoverage / marketplaces.length) * 100)
    : 0;
  const runtimeScore = pluginSnapshot.plugins.length > 0
    ? Math.round((pluginCoverage.reduce((s, p) => s + p.countries.length, 0) / Math.max(1, pluginCoverage.length)) * 10)
    : 0;

  const onboardingSample = marketplaces.slice(0, 2).map((m) =>
    computeOnboardingReadiness(workspaceId, companyId, countryCode, m.providerId),
  );
  const avgOnboarding = onboardingSample.length
    ? onboardingSample.reduce((s, o) => s + o.readinessScore, 0) / onboardingSample.length
    : 0;

  const dim = intelligence.dimensions;
  const getDomainScore = (domain: string) =>
    ecosystem.domains.find((d) => d.domain === domain)?.coverageScore ?? 30;

  const rawScores: Record<string, number> = {
    market_opportunity: Math.round((dim.marketGrowth + dim.ecommercePenetration + dim.consumerPurchasingPower) / 3),
    competition: invert(dim.competitionIntensity),
    profit_potential: Math.round((dim.consumerPurchasingPower + dim.marketMaturity + dim.marketplaceDensity) / 3),
    expansion_cost: invert(Math.round((dim.taxComplexity + dim.regulatoryDifficulty) / 2)),
    operational_complexity: invert(Math.round((dim.languageComplexity + dim.regulatoryDifficulty + dim.taxComplexity) / 3)),
    automation_potential: Math.round((dim.digitalPaymentMaturity + avgOnboarding + pluginScore) / 3),
    runtime_coverage: Math.min(100, runtimeScore),
    plugin_coverage: pluginScore,
    account_readiness: accountReadinessScore,
    supplier_coverage: getDomainScore("supplier") || dim.supplierAccessibility,
    logistics_coverage: getDomainScore("logistics") || dim.logisticsMaturity,
    payment_coverage: getDomainScore("payment") || dim.digitalPaymentMaturity,
    language_support: invert(dim.languageComplexity),
    risk: invert(Math.round((dim.regulatoryDifficulty + dim.competitionIntensity) / 2)),
  };

  const dimensions: ExpansionScoreDimension[] = DIMENSION_WEIGHTS.map((w) => {
    const rawScore = rawScores[w.id] ?? 50;
    return {
      dimensionId: w.id,
      displayName: w.name,
      weight: w.weight,
      rawScore,
      weightedContribution: Math.round(rawScore * w.weight * 10) / 10,
      evidence: `${w.name}: ${rawScore}/100`,
    };
  });

  const expansionScore = Math.round(
    dimensions.reduce((s, d) => s + d.rawScore * d.weight, 0) /
      dimensions.reduce((s, d) => s + d.weight, 0),
  );

  return {
    countryCode: intelligence.countryCode,
    displayName: intelligence.displayName,
    expansionScore,
    grade: gradeFromScore(expansionScore),
    dimensions,
    summary: `${intelligence.displayName} expansion score ${expansionScore} (${gradeFromScore(expansionScore)}) — ${intelligence.evidenceSummary}`,
    computedAt: new Date().toISOString(),
  };
}

export function listExpansionIntelligenceScores(
  workspaceId: string,
  companyId: string,
): ExpansionIntelligenceScore[] {
  const registry = buildGlobalCommerceRegistry();

  return registry.countries
    .map((c) => computeExpansionIntelligenceScore(workspaceId, companyId, c.countryCode))
    .filter((s): s is ExpansionIntelligenceScore => s !== null)
    .sort((a, b) => b.expansionScore - a.expansionScore);
}
