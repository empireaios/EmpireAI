import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import { buildGlobalCategoryExpansionEngine } from "../../global-category-expansion-engine/services/global-category-expansion-engine-service.js";
import type { EmpireInvestmentEngine } from "../models/empire-investment-engine.js";

type InvestmentItem = EmpireInvestmentEngine["items"][number];

function investmentWhy(expectedReturnUsd: number, blocker: string): string {
  return expectedReturnUsd > 0
    ? `Capital here unblocks ${blocker} — highest ROI path toward USD 100K net profit (SUCCESS-001)`
    : `Defer capital until ${blocker} resolved — premature spend delays SUCCESS-001`;
}

function makeItem(
  itemId: string,
  label: string,
  score: number,
  status: InvestmentItem["status"],
  recommendation: string,
  evidence: string,
  expectedReturnUsd: number,
  blocker: string,
): InvestmentItem {
  return {
    itemId,
    label,
    score,
    status,
    recommendation,
    evidence,
    why: investmentWhy(expectedReturnUsd, blocker),
  };
}

/** REAL-083 — Empire investment engine (capital allocation from PROGRAM_CATALOG blockers). */
export function buildEmpireInvestmentEngine(
  workspaceId: string,
  companyId: string,
): EmpireInvestmentEngine {
  const economics = buildEmpireEconomics(workspaceId, companyId);
  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k);

  let categories: ReturnType<typeof buildGlobalCategoryExpansionEngine> | null = null;
  try {
    categories = buildGlobalCategoryExpansionEngine(workspaceId, companyId);
  } catch { /* optional */ }

  const items: InvestmentItem[] = [];
  const netPositive = economics.netProfitUsd > 0;

  items.push(makeItem(
    "invest-advertising",
    "Capital · Advertising scale",
    netPositive ? 78 : 35,
    netPositive ? "READY" : "BLOCKED",
    netPositive
      ? "Scale Meta Ads on net-positive SKUs only — monitor CAC vs margin"
      : "Defer ad scale until net profit positive — CONSTITUTION-030",
    `Net profit $${economics.netProfitUsd} · ad budget $${economics.revenueBreakdown.advertisingUsd}/mo`,
    netPositive ? Math.round(economics.grossProfitUsd * 0.25) : 0,
    "positive unit economics",
  ));

  items.push(makeItem(
    "invest-expansion-us",
    "Capital · US marketplace expansion",
    82,
    blockingPrograms.some((p) => p.programId === "operational-access") ? "PENDING" : "READY",
    blockingPrograms.find((p) => p.programId === "operational-access")?.nextCursorMission
      ?? "REAL-002B — Connect Amazon SP-API + verified credentials",
    "US-first launch — highest GCI expansion score",
    12_000,
    "REAL-002B marketplace credentials",
  ));

  const topCategory = categories?.categories.sort((a, b) => b.profitPotentialUsd - a.profitPotentialUsd)[0];
  items.push(makeItem(
    "invest-categories",
    "Capital · Category winners",
    topCategory ? Math.min(90, topCategory.marketplaceSuitability) : 60,
    topCategory ? "READY" : "PENDING",
    topCategory
      ? `Prioritize ${topCategory.categoryName} — profit potential $${topCategory.profitPotentialUsd}`
      : "Evaluate category expansion via global-category-expansion-engine",
    topCategory?.evidence ?? "Category engine pending",
    topCategory?.profitPotentialUsd ?? 5000,
    "category winner validation",
  ));

  const infraProgram = blockingPrograms.find((p) => p.programId === "foundation");
  items.push(makeItem(
    "invest-infrastructure",
    "Capital · Infrastructure & production",
    infraProgram ? 70 : 85,
    "READY",
    infraProgram?.nextCursorMission ?? "FOUNDATION-001 — Production env vars on Vercel",
    `Foundation ${PROGRAM_CATALOG.find((p) => p.programId === "foundation")?.baseCompletionPercent ?? 0}% complete`,
    3000,
    "production hardening",
  ));

  for (const program of blockingPrograms.slice(0, 4)) {
    const capitalUse = program.programId === "supplier-intelligence" ? "supplier"
      : program.programId === "commerce-execution" ? "commerce pipeline"
      : program.programId === "marketplace-intelligence" ? "marketplace listings"
      : "program completion";
    items.push(makeItem(
      `invest-blocker-${program.programId}`,
      `Capital · ${program.name} blocker`,
      program.baseCompletionPercent,
      program.baseCompletionPercent >= 70 ? "PENDING" : "BLOCKED",
      program.nextCursorMission,
      `${program.name} @ ${program.baseCompletionPercent}% · blocks SUCCESS-001`,
      Math.round((100 - program.baseCompletionPercent) * 200),
      `${capitalUse} — ${program.nextCursorMission}`,
    ));
  }

  items.push(makeItem(
    "invest-supplier-catalog",
    "Capital · Supplier live catalog",
    blockingPrograms.some((p) => p.programId === "supplier-intelligence") ? 55 : 80,
    "PENDING",
    "SUP-LIVE-001 — CJ live catalog sync + fulfillment attach",
    `Supplier COGS $${economics.revenueBreakdown.supplierCostsUsd}/mo · architecture ready`,
    8000,
    "SUP-LIVE-001 live catalog attach",
  ));

  const ranked = [...items].sort((a, b) => b.score - a.score);
  const topPick = ranked[0]?.label ?? "Advertising";
  const summary = `REAL-083 · ${blockingPrograms.length} SUCCESS-001 blockers · top capital use: ${topPick} · net profit $${economics.netProfitUsd}`;

  return {
    moduleId: "empire-investment-engine",
    missionId: "REAL-083",
    workspaceId,
    companyId,
    summary,
    items,
    reusedModules: ["master-completion-ledger", "empire-economics", "global-category-expansion-engine"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
