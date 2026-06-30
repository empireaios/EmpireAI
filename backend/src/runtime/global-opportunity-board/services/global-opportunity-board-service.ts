import { buildGlobalOpportunityEngine } from "../../global-opportunity-engine/services/global-opportunity-engine-service.js";
import type { GlobalOpportunityBoard } from "../models/global-opportunity-board.js";

type BoardLane = "HIGH" | "MEDIUM" | "EXPERIMENTAL" | "REJECTED" | "AWAITING_APPROVAL";
type BoardItem = GlobalOpportunityBoard["items"][number];

function assignLane(score: number, priority: string, title: string): BoardLane {
  if (title.toLowerCase().includes("reject") || score < 25) return "REJECTED";
  if (priority === "CRITICAL" || score >= 75) return "HIGH";
  if (score >= 55 || priority === "HIGH") return "MEDIUM";
  if (score >= 40) return "EXPERIMENTAL";
  return "AWAITING_APPROVAL";
}

function boardWhy(lane: BoardLane, profitUsd: number): string {
  const laneReason: Record<BoardLane, string> = {
    HIGH: "High-confidence opportunity — execute after Grand King approval to accelerate SUCCESS-001",
    MEDIUM: "Medium-confidence — validate economics before committing capital toward SUCCESS-001",
    EXPERIMENTAL: "Experimental lane — test small before scaling to protect SUCCESS-001 runway",
    REJECTED: "Rejected — poor ROI or blocked dependencies would delay SUCCESS-001 net profit path",
    AWAITING_APPROVAL: "Awaiting Grand King approval — DOCTRINE-005 recommend only until King decides",
  };
  return `${laneReason[lane]} · expected profit $${profitUsd}`;
}

function makeItem(
  itemId: string,
  label: string,
  score: number,
  lane: BoardLane,
  recommendation: string,
  evidence: string,
  profitUsd: number,
): BoardItem {
  const status: BoardItem["status"] = lane === "REJECTED" ? "BLOCKED"
    : lane === "AWAITING_APPROVAL" ? "PENDING"
    : "READY";
  return {
    itemId,
    label: `[${lane}] ${label}`,
    score,
    status,
    recommendation,
    evidence,
    why: boardWhy(lane, profitUsd),
  };
}

/** REAL-084 — Global opportunity board (wraps global-opportunity-engine). */
export function buildGlobalOpportunityBoard(
  workspaceId: string,
  companyId: string,
): GlobalOpportunityBoard {
  const engine = buildGlobalOpportunityEngine(workspaceId, companyId);
  const laneCounts: Record<BoardLane, number> = {
    HIGH: 0,
    MEDIUM: 0,
    EXPERIMENTAL: 0,
    REJECTED: 0,
    AWAITING_APPROVAL: 0,
  };

  const items: BoardItem[] = engine.opportunityQueue.map((opp) => {
    const lane = assignLane(opp.opportunityScore, opp.priority, opp.title);
    laneCounts[lane]++;
    return makeItem(
      opp.opportunityId,
      `${opp.opportunityType} · ${opp.title}`,
      opp.opportunityScore,
      lane,
      opp.executiveRecommendation,
      `Score ${opp.opportunityScore} · ROI ${opp.expectedRoi} · payback ${opp.expectedPaybackDays}d · priority ${opp.priority}`,
      opp.expectedProfitUsd,
    );
  });

  if (items.length === 0) {
    items.push(makeItem(
      "board-empty",
      "No opportunities queued",
      0,
      "AWAITING_APPROVAL",
      "Seed pipeline products and connect OAR credentials to populate opportunity board",
      "global-opportunity-engine returned empty queue",
      0,
    ));
    laneCounts.AWAITING_APPROVAL = 1;
  }

  const boardLanes = `HIGH:${laneCounts.HIGH} MEDIUM:${laneCounts.MEDIUM} EXPERIMENTAL:${laneCounts.EXPERIMENTAL} REJECTED:${laneCounts.REJECTED} AWAITING_APPROVAL:${laneCounts.AWAITING_APPROVAL}`;
  const summary = `REAL-084 · Opportunity board · ${items.length} cards · boardLanes[${boardLanes}] · Grand King approves all lanes`;

  return {
    moduleId: "global-opportunity-board",
    missionId: "REAL-084",
    workspaceId,
    companyId,
    summary,
    items,
    reusedModules: ["global-opportunity-engine"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
