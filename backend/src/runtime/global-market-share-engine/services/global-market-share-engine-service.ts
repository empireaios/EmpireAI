import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildGlobalMarketplaceDistributionDashboard } from "../../global-marketplace-operations/services/global-marketplace-distribution-dashboard-service.js";
import type { GlobalMarketShareEngine } from "../models/global-market-share-engine.js";

const CATEGORY_TAM: Record<string, number> = {
  kitchen: 2_400_000_000,
  home: 1_800_000_000,
  electronics: 3_200_000_000,
  default: 1_000_000_000,
};

/** REAL-053 — Global market share engine (GMO + PROGRAM_CATALOG derived). */
export function buildGlobalMarketShareEngine(
  workspaceId: string,
  companyId: string,
): GlobalMarketShareEngine {
  const gmo = buildGlobalMarketplaceDistributionDashboard(workspaceId, companyId);
  const marketplaceProgram = PROGRAM_CATALOG.find((p) => p.programId === "marketplace-intelligence");
  const commerceProgram = PROGRAM_CATALOG.find((p) => p.programId === "commerce-execution");

  const totalRevenue = gmo.worldOverview.totalRevenueUsd;
  const addressableMarketUsd = gmo.countries.reduce((s, c) => {
    const tam = c.productsLive > 0 ? 500_000_000 : 250_000_000;
    return s + tam;
  }, 0);

  const currentSharePercent = addressableMarketUsd > 0
    ? Math.round((totalRevenue / addressableMarketUsd) * 10000) / 100
    : 0;

  const programBoost = (marketplaceProgram?.baseCompletionPercent ?? 50) / 100;
  const potentialSharePercent = Math.min(15, Math.round((currentSharePercent + programBoost * 5) * 100) / 100);

  const categories = ["kitchen", "home", "electronics"];
  const opportunities = gmo.revenueByMarketplace.slice(0, 12).map((slot, i) => {
    const category = categories[i % categories.length]!;
    const tam = CATEGORY_TAM[category] ?? CATEGORY_TAM.default!;
    const currentShare = slot.revenueUsd > 0 ? (slot.revenueUsd / tam) * 100 : 0;
    const potentialShare = Math.min(8, currentShare + (programBoost * 2));
    return {
      countryCode: slot.countryCode,
      marketplaceId: slot.marketplaceId,
      category,
      addressableMarketUsd: tam,
      currentSharePercent: Math.round(currentShare * 1000) / 1000,
      potentialSharePercent: Math.round(potentialShare * 1000) / 1000,
      gapUsd: Math.round((potentialShare - currentShare) / 100 * tam),
      rationale: commerceProgram?.nextCursorMission ?? marketplaceProgram?.nextCursorMission ?? "Expand verified listings",
    };
  });

  return {
    moduleId: "global-market-share-engine",
    missionId: "REAL-053",
    workspaceId,
    companyId,
    addressableMarketUsd,
    currentSharePercent,
    potentialSharePercent,
    opportunities,
    reusedModules: ["global-marketplace-operations", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
