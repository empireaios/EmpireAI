import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildGlobalRiskCommand } from "../../global-risk-command/services/global-risk-command-service.js";
import { buildGlobalStrategyEngine } from "../../global-strategy-engine/services/global-strategy-engine-service.js";
import type { EmpireStrategicCenter } from "../models/empire-strategic-center.js";

/** REAL-067 — Empire strategic center (long-term roadmaps, expansion, revenue, risk). */
export function buildEmpireStrategicCenter(
  workspaceId: string,
  companyId: string,
): EmpireStrategicCenter {
  const strategy = buildGlobalStrategyEngine(workspaceId, companyId);

  let riskSummary: ReturnType<typeof buildGlobalRiskCommand> | null = null;
  try {
    riskSummary = buildGlobalRiskCommand(workspaceId, companyId);
  } catch { /* optional */ }

  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k);
  const netProfit = strategy.milestones[0]?.progressPercent ?? 0;

  const roadmaps: EmpireStrategicCenter["roadmaps"] = [
    {
      roadmapId: "expansion-90d",
      label: "90-day expansion",
      horizon: "90d",
      focus: "US Amazon proof + 2 category winners",
      revenueTargetUsd: 25_000,
      riskLevel: blockingPrograms.length > 2 ? "HIGH" : "MEDIUM",
      progressPercent: netProfit,
      evidence: strategy.milestones[0]?.highestProbabilityPath ?? "SUCCESS-001 path",
    },
    {
      roadmapId: "revenue-1y",
      label: "1-year revenue",
      horizon: "1y",
      focus: "USD 100K net profit (SUCCESS-001)",
      revenueTargetUsd: 100_000,
      riskLevel: "CRITICAL",
      progressPercent: strategy.milestones[0]?.progressPercent ?? 0,
      evidence: "global-strategy-engine SUCCESS-001 milestone",
    },
    {
      roadmapId: "scale-3y",
      label: "3-year scale",
      horizon: "3y",
      focus: "USD 1M net profit (SUCCESS-002)",
      revenueTargetUsd: 1_000_000,
      riskLevel: "MEDIUM",
      progressPercent: strategy.milestones[1]?.progressPercent ?? 0,
      evidence: strategy.milestones[1]?.highestProbabilityPath ?? "Multi-country replication",
    },
    {
      roadmapId: "empire-5y",
      label: "5-year empire",
      horizon: "5y",
      focus: "USD 10M net profit (SUCCESS-003)",
      revenueTargetUsd: 10_000_000,
      riskLevel: "LOW",
      progressPercent: strategy.milestones[2]?.progressPercent ?? 0,
      evidence: strategy.milestones[2]?.highestProbabilityPath ?? "Full GMO autonomous loop",
    },
  ];

  const expansionPriorities = strategy.strategicRecommendations.slice(0, 4).map((r) => r.title);
  const revenuePriorities = strategy.commercialPriorities.slice(0, 4);
  const marketSharePriorities = [
    "Capture US Amazon category share in top 3 winners",
    "Expand to UK/DE after PROOF-001 verified",
    ...blockingPrograms.slice(0, 2).map((p) => p.nextCursorMission),
  ];
  const riskPriorities = (riskSummary?.executiveRecommendations ?? [])
    .slice(0, 4)
    .map((r) => r.action);

  const executiveSummary = strategy.milestones
    .map((m) => `${m.label}: ${m.progressPercent}% (${m.distanceUsd} USD remaining)`)
    .join(" · ");

  return {
    moduleId: "empire-strategic-center",
    missionId: "REAL-067",
    workspaceId,
    companyId,
    roadmaps,
    expansionPriorities,
    revenuePriorities,
    marketSharePriorities,
    riskPriorities,
    executiveSummary,
    reusedModules: ["global-strategy-engine", "global-risk-command", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
