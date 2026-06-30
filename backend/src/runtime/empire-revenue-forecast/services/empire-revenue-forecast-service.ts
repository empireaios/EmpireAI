import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import { buildGlobalMarketplaceDistributionDashboard } from "../../global-marketplace-operations/services/global-marketplace-distribution-dashboard-service.js";
import { buildGlobalRevenueSimulation } from "../../global-revenue-simulation/services/global-revenue-simulation-service.js";
import type { EmpireRevenueForecast } from "../models/empire-revenue-forecast.js";

type ForecastItem = EmpireRevenueForecast["items"][number];

const PERIODS = ["monthly", "quarterly", "annual"] as const;
const SCENARIOS = ["BEST_CASE", "EXPECTED", "WORST_CASE"] as const;

function periodMultiplier(period: (typeof PERIODS)[number]): number {
  if (period === "quarterly") return 3;
  if (period === "annual") return 12;
  return 1;
}

function scenarioMultiplier(scenario: (typeof SCENARIOS)[number]): number {
  if (scenario === "BEST_CASE") return 1.4;
  if (scenario === "WORST_CASE") return 0.5;
  return 1;
}

function success001Why(revenueUsd: number, netProfitUsd: number): string {
  const distance = Math.max(0, 100_000 - Math.max(netProfitUsd, 0));
  return distance > 0
    ? `Forecast $${revenueUsd}/period — USD ${distance} remaining to SUCCESS-001 net profit target`
    : "Forecast supports sustaining SUCCESS-001 net profit trajectory";
}

function makeItem(
  itemId: string,
  label: string,
  revenueUsd: number,
  netProfitUsd: number,
  status: ForecastItem["status"],
  recommendation: string,
  evidence: string,
): ForecastItem {
  const score = Math.max(0, Math.min(100, Math.round(40 + (revenueUsd / 500) + (netProfitUsd > 0 ? 25 : 0))));
  return {
    itemId,
    label,
    score,
    status,
    recommendation,
    evidence,
    why: success001Why(revenueUsd, netProfitUsd),
  };
}

/** REAL-081 — Empire revenue forecast (economics + global-revenue-simulation patterns). */
export function buildEmpireRevenueForecast(
  workspaceId: string,
  companyId: string,
): EmpireRevenueForecast {
  seedRevenuePipeline(workspaceId, companyId);
  const economics = buildEmpireEconomics(workspaceId, companyId);
  const simulation = buildGlobalRevenueSimulation(workspaceId, companyId);
  const products = listPipelineProducts(workspaceId, companyId);

  let gmo: ReturnType<typeof buildGlobalMarketplaceDistributionDashboard> | null = null;
  try {
    gmo = buildGlobalMarketplaceDistributionDashboard(workspaceId, companyId);
  } catch { /* optional */ }

  const items: ForecastItem[] = [];
  const baseRevenue = economics.monthlyRecurringRevenueUsd;
  const baseNet = economics.netProfitUsd;

  for (const period of PERIODS) {
    const mult = periodMultiplier(period);
    for (const scenario of SCENARIOS) {
      const sim = simulation.scenarios.find((s) => s.scenario === scenario)!;
      const rev = Math.round(sim.revenueUsd * mult * (scenario === "EXPECTED" ? 1 : scenarioMultiplier(scenario) / scenarioMultiplier("EXPECTED")));
      const profit = Math.round(sim.profitUsd * mult);
      items.push(makeItem(
        `forecast-${period}-${scenario.toLowerCase()}`,
        `${period.charAt(0).toUpperCase() + period.slice(1)} · ${scenario.replace("_", " ")}`,
        rev,
        profit,
        profit > 0 ? "READY" : "BLOCKED",
        profit > 0
          ? `Scale ${period} plan under ${scenario} guardrails`
          : `${scenario} case unprofitable — reduce MRC before launch`,
        `REAL-030 ${scenario}: revenue $${sim.revenueUsd}/mo · profit $${sim.profitUsd}/mo`,
      ));
    }
  }

  (gmo?.revenueByCountry ?? [{ countryName: "United States", revenueUsd: baseRevenue, profitUsd: baseNet }])
    .slice(0, 5)
    .forEach((c, i) => {
      items.push(makeItem(
        `country-${i}`,
        `Country · ${c.countryName}`,
        c.revenueUsd * 12,
        c.profitUsd * 12,
        c.profitUsd > 0 ? "READY" : "PENDING",
        i === 0 ? "Primary launch market — prioritize listings" : "Expand after US SUCCESS-001 proof",
        `GMO annualized revenue $${c.revenueUsd * 12} · profit $${c.profitUsd * 12}`,
      ));
    });

  (gmo?.revenueByMarketplace ?? [{ marketplaceName: "Amazon US", revenueUsd: baseRevenue, profitUsd: baseNet }])
    .slice(0, 4)
    .forEach((m, i) => {
      items.push(makeItem(
        `marketplace-${i}`,
        `Marketplace · ${m.marketplaceName}`,
        m.revenueUsd * 12,
        m.profitUsd * 12,
        economics.liveFeedAttached ? "READY" : "PENDING",
        i === 0 ? "Connect live credentials — REAL-002B" : "Secondary channel after primary proof",
        economics.liveFeedAttached ? "Live feed attached" : "Architecture ready — credentials pending",
      ));
    });

  const supplierMap = new Map<string, number>();
  for (const p of products) {
    const key = p.supplierPlatform ?? "unknown";
    supplierMap.set(key, (supplierMap.get(key) ?? 0) + (["LIVE", "SCALING"].includes(p.state) ? 800 : 200));
  }
  [...supplierMap.entries()].slice(0, 3).forEach(([supplier, revenueUsd], i) => {
    items.push(makeItem(
      `supplier-${i}`,
      `Supplier · ${supplier}`,
      revenueUsd * 12,
      Math.round(revenueUsd * 12 * 0.32),
      supplier === "cj-dropshipping" ? "READY" : "PENDING",
      "Attach live catalog — SUP-LIVE-001 before scaling SKUs",
      `${products.filter((p) => p.supplierPlatform === supplier).length} pipeline products · est. $${revenueUsd}/mo`,
    ));
  });

  const categoryMap = new Map<string, number>();
  for (const p of products) {
    const cat = p.category ?? "general";
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + (p.state === "LIVE" ? 600 : 100));
  }
  [...categoryMap.entries()].slice(0, 4).forEach(([category, revenueUsd], i) => {
    items.push(makeItem(
      `category-${i}`,
      `Category · ${category}`,
      revenueUsd * 12,
      Math.round(revenueUsd * 12 * 0.3),
      revenueUsd > 500 ? "READY" : "PENDING",
      "Win first category in US before multi-category expansion",
      `${products.filter((p) => p.category === category).length} products · est. $${revenueUsd}/mo`,
    ));
  });

  const expectedAnnual = Math.round((simulation.scenarios.find((s) => s.scenario === "EXPECTED")?.profitUsd ?? baseNet) * 12);
  const summary = `REAL-081 · ${items.length} forecasts · expected annual profit $${expectedAnnual} · ${products.filter((p) => p.state === "LIVE").length} live products`;

  return {
    moduleId: "empire-revenue-forecast",
    missionId: "REAL-081",
    workspaceId,
    companyId,
    summary,
    items,
    reusedModules: ["empire-economics", "global-revenue-simulation", "global-marketplace-operations", "grand-king-revenue-pipeline"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
