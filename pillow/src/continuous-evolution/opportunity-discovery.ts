import { getQualityThreshold } from "../commerce-intelligence/product-scorer.js";
import type { ContinuousEvolutionDeps, DiscoveredOpportunity, OpportunityDiscoveryReport } from "./types.js";

const OPPORTUNITY_THRESHOLD = 72;

export function discoverOpportunities(deps: ContinuousEvolutionDeps): OpportunityDiscoveryReport {
  const opportunities: DiscoveredOpportunity[] = [];
  const commerce = deps.commerceIntelligence.analyzeCommerce();

  for (const winner of commerce.recommendedProducts) {
    opportunities.push({
      type: "product",
      title: winner.product.name,
      valueScore: winner.compositeScore,
      rationale: `Margin ${winner.product.profitMarginPercent}% · demand ${winner.product.demandScore}/100`,
      aboveThreshold: winner.compositeScore >= OPPORTUNITY_THRESHOLD,
    });
  }

  for (const supplier of commerce.supplierRankings.filter((s) => s.preferred).slice(0, 2)) {
    opportunities.push({
      type: "supplier",
      title: supplier.supplier.name,
      valueScore: supplier.compositeScore,
      rationale: `Preferred supplier · reliability ${supplier.supplier.reliabilityScore}/100`,
      aboveThreshold: supplier.compositeScore >= OPPORTUNITY_THRESHOLD,
    });
  }

  for (const market of commerce.marketOpportunities.filter((m) => m.opportunityScore >= 70).slice(0, 2)) {
    opportunities.push({
      type: "market",
      title: market.market.name,
      valueScore: market.opportunityScore,
      rationale: market.recommendation,
      aboveThreshold: market.opportunityScore >= OPPORTUNITY_THRESHOLD,
    });
  }

  opportunities.push({
    type: "ai_capability",
    title: "Live @cursor/sdk autonomous dispatch",
    valueScore: 78,
    rationale: "Cursor Bridge Phase 5 ready — wire SDK for approved missions",
    aboveThreshold: true,
  });

  opportunities.push({
    type: "business_model",
    title: "Multi-brand portfolio under Empire OS",
    valueScore: 80,
    rationale: "FitForge + PetJoy model scales to additional winning products",
    aboveThreshold: true,
  });

  opportunities.push({
    type: "revenue",
    title: "SG/SEA hub first-launch strategy",
    valueScore: 81,
    rationale: "Priority market from Commerce Intelligence with favourable logistics",
    aboveThreshold: true,
  });

  const filtered = opportunities
    .filter((o) => o.aboveThreshold)
    .sort((a, b) => b.valueScore - a.valueScore);

  return {
    opportunities: filtered,
    highValueCount: filtered.length,
    qualityThreshold: OPPORTUNITY_THRESHOLD,
  };
}

export function getOpportunityThreshold(): number {
  return OPPORTUNITY_THRESHOLD;
}
