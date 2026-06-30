import { buildCompetitorIntelligence } from "../../competitor-intelligence/services/competitor-intelligence-service.js";
import { buildCustomerIntelligence } from "../../customer-intelligence/services/customer-intelligence-service.js";
import { buildCustomerPsychologyEngine } from "../../customer-psychology-engine/services/customer-psychology-engine-service.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import { buildGlobalCategoryExpansionEngine } from "../../global-category-expansion-engine/services/global-category-expansion-engine-service.js";
import { buildGlobalRevenueSimulation } from "../../global-revenue-simulation/services/global-revenue-simulation-service.js";
import type { AiChiefOfCommerceDashboard } from "../models/ai-chief-of-commerce.js";

/** REAL-031 — AI Chief of Commerce (permanent commercial intelligence, recommend only). */
export function buildAiChiefOfCommerce(
  workspaceId: string,
  companyId: string,
): AiChiefOfCommerceDashboard {
  const economics = buildEmpireEconomics(workspaceId, companyId);
  const customers = buildCustomerIntelligence(workspaceId, companyId);
  const competitors = buildCompetitorIntelligence(workspaceId, companyId);
  const psychology = buildCustomerPsychologyEngine(workspaceId, companyId);
  const categories = buildGlobalCategoryExpansionEngine(workspaceId, companyId);
  const simulation = buildGlobalRevenueSimulation(workspaceId, companyId);

  const expected = simulation.scenarios.find((s) => s.scenario === "EXPECTED")!;

  return {
    moduleId: "ai-chief-of-commerce",
    missionId: "REAL-031",
    workspaceId,
    companyId,
    responsibilities: [
      "Revenue", "Profit", "Pricing", "Expansion", "Competition",
      "Category growth", "Market share", "Supplier decisions",
    ],
    revenueSummaryUsd: economics.monthlyRecurringRevenueUsd,
    profitSummaryUsd: economics.netProfitUsd,
    pricingInsights: [
      economics.netProfitUsd < 0 ? "Reduce price promotions until net positive" : "Test premium pricing on winners",
      `Contribution margin ${economics.contributionMarginPercent}%`,
    ],
    expansionInsights: categories.topOpportunities.map((c) => `Expand ${c}`),
    competitionInsights: competitors.competitors.slice(0, 3).map((c) => c.whyEmpireWins),
    categoryGrowthInsights: categories.categories.filter((c) => c.priority === "CRITICAL").map((c) => c.categoryName),
    marketShareEstimatePercent: economics.monthlyRecurringRevenueUsd > 0 ? 2 : 0,
    supplierDecisions: [{
      decision: economics.netProfitUsd < 0 ? "Defer new supplier SKUs until burn reduced" : "Prioritize CJ live catalog attach",
      evidence: `MRC $${economics.monthlyRecurringCostUsd} · net $${economics.netProfitUsd}`,
    }],
    executiveRecommendations: [
      {
        title: economics.netProfitUsd < 0 ? "Reduce burn before scaling" : competitors.executiveRecommendation,
        evidence: economics.netProfitUsd < 0 ? "Negative net profit — CONSTITUTION-030" : customers.recommendationEvidence,
        expectedProfitImpactUsd: expected.profitUsd,
      },
      {
        title: psychology.executiveRecommendation,
        evidence: psychology.recommendationEvidence,
        expectedProfitImpactUsd: Math.round(expected.profitUsd * 0.15),
      },
      {
        title: competitors.executiveRecommendation,
        evidence: competitors.recommendationEvidence,
        expectedProfitImpactUsd: Math.round(expected.profitUsd * 0.1),
      },
    ],
    recommendOnly: true,
    reusedModules: [
      "empire-economics", "customer-intelligence", "competitor-intelligence",
      "customer-psychology-engine", "global-category-expansion-engine", "global-revenue-simulation",
    ],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
