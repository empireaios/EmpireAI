import { listExpansionIntelligenceScores } from "../../global-commerce-intelligence/services/expansion-intelligence-score-service.js";
import { buildGlobalMarketplaceOperations } from "./country-marketplace-operations-service.js";

/** REAL-009 — Global Marketplace Distribution Dashboard for Executive HQ. */
export function buildGlobalMarketplaceDistributionDashboard(workspaceId: string, companyId: string) {
  const ops = buildGlobalMarketplaceOperations(workspaceId, companyId);
  const scores = listExpansionIntelligenceScores(workspaceId, companyId);

  const countriesActive = ops.countries.filter((c) => c.status === "ACTIVE").length;
  const countriesReady = ops.countries.filter((c) => c.status === "READY").length;
  const countriesBlocked = ops.countries.filter((c) => c.status === "BLOCKED").length;

  const marketplacesConnected = ops.slots.filter((s) =>
    ["CONNECTED", "VERIFIED", "READY", "ACTIVE"].includes(s.connectionStatus),
  ).length;
  const marketplacesPending = ops.slots.filter((s) =>
    ["PENDING", "AUTH_REQUIRED"].includes(s.connectionStatus),
  ).length;
  const marketplacesBlocked = ops.slots.filter((s) =>
    s.connectionStatus === "BLOCKED" || s.connectionStatus === "NOT_CONNECTED",
  ).length;

  const allProducts = ops.slots.flatMap((s) => s.products);
  const productsLive = allProducts.filter((p) => p.status === "LIVE").length;
  const productsPending = allProducts.filter((p) => p.status === "PENDING" || p.status === "READY").length;
  const productsBlocked = allProducts.filter((p) => p.status === "BLOCKED").length;
  const productsAwaitingApproval = allProducts.filter((p) => p.status === "AWAITING_APPROVAL").length;

  const revenueByCountry = ops.countries
    .map((c) => ({ countryCode: c.countryCode, countryName: c.countryName, revenueUsd: c.revenueUsd, profitUsd: c.profitUsd }))
    .sort((a, b) => b.revenueUsd - a.revenueUsd);

  const revenueByMarketplace = ops.slots
    .map((s) => ({
      marketplaceId: s.marketplaceId,
      marketplaceName: s.marketplaceName,
      countryCode: s.countryCode,
      revenueUsd: s.revenueUsd,
      profitUsd: s.profitUsd,
    }))
    .sort((a, b) => b.revenueUsd - a.revenueUsd);

  const topOpportunityCountries = scores.slice(0, 5).map((s) => ({
    countryCode: s.countryCode,
    countryName: s.displayName,
    expansionScore: s.expansionScore,
    grade: s.grade,
  }));

  const topWeakCountries = [...ops.countries]
    .filter((c) => c.status === "BLOCKED" || c.productsLive === 0)
    .slice(0, 5)
    .map((c) => ({
      countryCode: c.countryCode,
      countryName: c.countryName,
      reason: c.status === "BLOCKED" ? "All marketplaces blocked" : "No live products",
    }));

  const nextRecommendedCountry = scores[0]
    ? { countryCode: scores[0].countryCode, countryName: scores[0].displayName, expansionScore: scores[0].expansionScore }
    : ops.countries.find((c) => c.status === "READY")
      ? { countryCode: ops.countries.find((c) => c.status === "READY")!.countryCode, countryName: ops.countries.find((c) => c.status === "READY")!.countryName, expansionScore: 0 }
      : null;

  const totalRevenue = revenueByCountry.reduce((s, c) => s + c.revenueUsd, 0);
  const totalProfit = revenueByCountry.reduce((s, c) => s + c.profitUsd, 0);

  return {
    moduleId: "global-marketplace-operations" as const,
    missionIds: ["REAL-008", "REAL-009"] as const,
    workspaceId,
    companyId,
    architecturePercent: 78,
    architectureComplete: true,
    livePublishBlocked: true,
    worldOverview: {
      totalCountries: ops.countries.length,
      totalMarketplaceSlots: ops.slots.length,
      countriesActive,
      countriesReady,
      countriesBlocked,
      marketplacesConnected,
      marketplacesPending,
      marketplacesBlocked,
      productsDistributed: allProducts.length,
      productsLive,
      productsPending,
      productsBlocked,
      productsAwaitingApproval,
      totalRevenueUsd: totalRevenue,
      totalProfitUsd: totalProfit,
    },
    revenueByCountry,
    profitByCountry: revenueByCountry.map((c) => ({ ...c })),
    revenueByMarketplace: revenueByMarketplace.slice(0, 20),
    profitByMarketplace: revenueByMarketplace.slice(0, 20).map((m) => ({ ...m })),
    topOpportunityCountries,
    topWeakCountries,
    nextRecommendedCountry,
    countries: ops.countries,
    operatingModel: {
      hierarchy: ["Country", "Marketplace", "Products", "Performance", "Executive Recommendations"],
      grandKingView: true,
    },
    computedAt: new Date().toISOString(),
  };
}

export type GlobalMarketplaceDistributionDashboard = ReturnType<typeof buildGlobalMarketplaceDistributionDashboard>;
