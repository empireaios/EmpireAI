import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import { buildGlobalOpportunityEngine } from "../../global-opportunity-engine/services/global-opportunity-engine-service.js";
import type { EmpirePriorityEngine } from "../models/empire-priority-engine.js";

type PriorityItem = EmpirePriorityEngine["items"][number];

function priorityScore(input: {
  businessValue: number;
  profitUsd: number;
  riskScore: number;
  confidence: number;
  timeDays: number;
}): number {
  const timeFactor = Math.max(0, 100 - input.timeDays);
  return Math.round(
    input.businessValue * 0.25
    + Math.min(input.profitUsd / 100, 30)
    + input.confidence * 0.2
    + timeFactor * 0.15
    + (100 - input.riskScore) * 0.1,
  );
}

function priorityWhy(rank: number, title: string, profitUsd: number): string {
  return rank === 1
    ? `#1 priority "${title}" — highest composite score toward USD 100K net profit (SUCCESS-001) · $${profitUsd} expected impact`
    : `#${rank} "${title}" — ranked by business value, profit, risk, confidence, time for SUCCESS-001 critical path`;
}

/** REAL-090 — Empire priority engine (PROGRAM_CATALOG + global-opportunity-engine). */
export function buildEmpirePriorityEngine(
  workspaceId: string,
  companyId: string,
): EmpirePriorityEngine {
  const economics = buildEmpireEconomics(workspaceId, companyId);
  const opportunities = buildGlobalOpportunityEngine(workspaceId, companyId);
  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k);

  const candidates: Array<{
    itemId: string;
    label: string;
    score: number;
    status: PriorityItem["status"];
    recommendation: string;
    evidence: string;
    profitUsd: number;
  }> = [];

  for (const program of blockingPrograms) {
    const riskScore = 100 - program.baseCompletionPercent;
    const score = priorityScore({
      businessValue: program.blocksUsd100k ? 90 : 50,
      profitUsd: (100 - program.baseCompletionPercent) * 300,
      riskScore,
      confidence: program.baseCompletionPercent,
      timeDays: program.baseCompletionPercent >= 80 ? 14 : 45,
    });
    candidates.push({
      itemId: `priority-program-${program.programId}`,
      label: `Program · ${program.name}`,
      score,
      status: program.baseCompletionPercent >= 70 ? "PENDING" : "BLOCKED",
      recommendation: program.nextCursorMission,
      evidence: `${program.name} @ ${program.baseCompletionPercent}% · blocks SUCCESS-001 · owner: ${program.ownerModules.slice(0, 2).join(", ")}`,
      profitUsd: (100 - program.baseCompletionPercent) * 300,
    });
  }

  for (const opp of opportunities.opportunityQueue.slice(0, 8)) {
    const riskScore = 100 - opp.opportunityScore;
    const score = priorityScore({
      businessValue: opp.priority === "CRITICAL" ? 95 : opp.priority === "HIGH" ? 80 : 60,
      profitUsd: opp.expectedProfitUsd,
      riskScore,
      confidence: opp.opportunityScore,
      timeDays: opp.expectedPaybackDays,
    });
    candidates.push({
      itemId: `priority-opp-${opp.opportunityId.slice(0, 8)}`,
      label: `Opportunity · ${opp.title}`,
      score,
      status: opp.opportunityScore >= 70 ? "READY" : "PENDING",
      recommendation: opp.executiveRecommendation,
      evidence: `Score ${opp.opportunityScore} · ROI ${opp.expectedRoi} · payback ${opp.expectedPaybackDays}d · type ${opp.opportunityType}`,
      profitUsd: opp.expectedProfitUsd,
    });
  }

  if (economics.netProfitUsd < 0) {
    candidates.push({
      itemId: "priority-burn-reduction",
      label: "Critical · Reduce monthly burn",
      score: priorityScore({
        businessValue: 100,
        profitUsd: economics.burnRateUsd,
        riskScore: 85,
        confidence: 90,
        timeDays: 7,
      }),
      status: "BLOCKED",
      recommendation: "Close burn gap before scaling ads — CONSTITUTION-030",
      evidence: `Net profit $${economics.netProfitUsd} · burn $${economics.burnRateUsd}/mo · MRC $${economics.monthlyRecurringCostUsd}`,
      profitUsd: economics.burnRateUsd,
    });
  }

  const ranked = candidates.sort((a, b) => b.score - a.score);
  const items: PriorityItem[] = ranked.map((c, index) => ({
    itemId: c.itemId,
    label: c.label,
    score: c.score,
    status: c.status,
    recommendation: c.recommendation,
    evidence: c.evidence,
    why: priorityWhy(index + 1, c.label, c.profitUsd),
  }));

  const top = ranked[0]?.label ?? "Program completion";
  const summary = `REAL-090 · Empire priority engine · ${items.length} ranked items · #1: ${top} · ${blockingPrograms.length} catalog blockers · net profit $${economics.netProfitUsd}`;

  return {
    moduleId: "empire-priority-engine",
    missionId: "REAL-090",
    workspaceId,
    companyId,
    summary,
    items,
    reusedModules: ["master-completion-ledger", "global-opportunity-engine", "empire-economics"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
