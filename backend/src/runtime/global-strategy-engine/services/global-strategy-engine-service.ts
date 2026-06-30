import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import { MILESTONE_TARGETS } from "../models/global-strategy-engine.js";
import type { GlobalStrategyEngineDashboard } from "../models/global-strategy-engine.js";

/** REAL-034 — Global strategy: highest probability path to USD 100K → 1M → 10M. */
export function buildGlobalStrategyEngine(
  workspaceId: string,
  companyId: string,
): GlobalStrategyEngineDashboard {
  let netProfit = 0;
  try {
    const econ = buildEmpireEconomics(workspaceId, companyId);
    netProfit = econ.netProfitUsd;
  } catch { /* optional */ }

  const milestones = MILESTONE_TARGETS.map((m) => {
    const progress = m.targetUsd > 0 ? Math.min(100, Math.round((Math.max(netProfit, 0) / m.targetUsd) * 100)) : 0;
    const distance = Math.max(0, m.targetUsd - Math.max(netProfit, 0));
    let path = "PROOF-001 → REAL-002B → scale winners with net-profit guardrails";
    if (m.milestoneId === "SUCCESS-002") path = "Replicate US winners to 3 countries · category expansion REAL-029";
    if (m.milestoneId === "SUCCESS-003") path = "Full GMO rollout · autonomous supplier loop · brand portfolio";
    return {
      milestoneId: m.milestoneId,
      label: m.label,
      targetUsd: m.targetUsd,
      progressPercent: progress,
      distanceUsd: distance,
      highestProbabilityPath: path,
    };
  });

  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k);
  const strategicRecommendations = blockingPrograms.slice(0, 5).map((p) => ({
    title: p.nextCursorMission,
    evidence: `${p.name} @ ${p.baseCompletionPercent}% · blocks SUCCESS-001`,
    profitImpactUsd: p.programId === "proof-of-money" ? 100_000 : 10_000,
  }));

  const commerceRecs: string[] = [
    "Attach live P&L before scaling ads",
    "Complete PROOF-001 for verified net profit evidence",
  ];

  return {
    moduleId: "global-strategy-engine",
    missionId: "REAL-034",
    workspaceId,
    companyId,
    currentNetProfitUsd: netProfit,
    milestones,
    strategicRecommendations,
    quarterlyObjectives: [
      "Q1: First verified net profit (PROOF-001)",
      "Q2: 3 live marketplaces with positive unit economics",
      "Q3: Category expansion in top 2 verticals",
      "Q4: Path to USD 100K net profit validated",
    ],
    commercialPriorities: [
      "Net profit before revenue (CONSTITUTION-023)",
      "Customer psychology gate before launch (CONSTITUTION-027)",
      "Competitive differentiation evidence (CONSTITUTION-028)",
      ...commerceRecs.slice(0, 2),
    ],
    executiveDebateInputs: [
      "Which single category wins fastest toward USD 100K?",
      "US-first vs multi-country launch tradeoff",
      "Ad spend vs supplier inventory allocation",
    ],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
