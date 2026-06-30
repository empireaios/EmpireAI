import { randomUUID } from "node:crypto";

import type {
  FollowUpMission,
  PerformanceSnapshot,
  ProductLaunchMission,
} from "../models/commerce-intelligence-core.js";
import {
  getMission,
  listFollowUpMissions,
  listPerformanceSnapshots,
  saveFollowUpMission,
  saveMission,
  savePerformanceSnapshot,
} from "../store/commerce-intelligence-store.js";

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** PILLOW-020 — Performance monitoring after launch (Pillow-owned). */
export function buildPerformanceSnapshot(mission: ProductLaunchMission): PerformanceSnapshot {
  const seed = hashSeed(mission.missionId);
  const sales = 5 + (seed % 40);
  const revenueUsd = Math.round(sales * mission.arbitrage.expectedSellingPriceUsd * 100) / 100;
  const adSpendUsd = Math.round(mission.launchBudgetUsd * 0.15 * 100) / 100;
  const netProfitUsd = Math.round((revenueUsd * mission.expectedMarginPercent) / 100 * 100) / 100;
  const roas = adSpendUsd > 0 ? Math.round((revenueUsd / adSpendUsd) * 100) / 100 : 0;

  return {
    snapshotId: randomUUID(),
    missionId: mission.missionId,
    sales,
    revenueUsd,
    conversionRate: clamp(1.5 + (seed % 40) / 10),
    adSpendUsd,
    roas,
    refunds: seed % 3,
    reviewScore: Math.round((3.8 + (seed % 12) / 10) * 10) / 10,
    rankingPercentile: 20 + (seed % 60),
    netProfitUsd,
    inventoryRemaining: Math.max(0, mission.product.inventoryTotal - sales),
    supplierHealthScore: mission.product.supplierReliabilityScore,
    competitorChangeDetected: seed % 5 === 0,
    computedAt: new Date().toISOString(),
  };
}

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

/** Generates approval-gated follow-up missions from performance data. */
export function generateFollowUpMissions(
  mission: ProductLaunchMission,
  snapshot: PerformanceSnapshot,
): FollowUpMission[] {
  const now = new Date().toISOString();
  const followUps: FollowUpMission[] = [];

  const add = (type: FollowUpMission["type"], title: string, rationale: string) => {
    followUps.push({
      followUpId: randomUUID(),
      missionId: mission.missionId,
      type,
      title,
      rationale,
      status: "pending_approval",
      approvalRequired: true,
      intelligenceOwner: "pillow",
      createdAt: now,
    });
  };

  if (snapshot.roas >= 2.5 && snapshot.conversionRate >= 2) {
    add("increase_ads", "Increase ad spend", `ROAS ${snapshot.roas}x exceeds target — scale winning creative`);
  } else if (snapshot.roas < 1.2) {
    add("reduce_ads", "Reduce ad spend", `ROAS ${snapshot.roas}x below breakeven — protect margin`);
  }

  if (snapshot.netProfitUsd < 0) {
    add("pause_listing", "Pause listing", "Negative net profit detected — pause until unit economics recover");
  }

  if (snapshot.competitorChangeDetected) {
    add("change_price", "Adjust pricing", "Competitor price movement detected — re-evaluate sell price");
  }

  if (snapshot.refunds >= 2) {
    add("improve_creative", "Improve creative", `${snapshot.refunds} refunds — refresh listing copy and images`);
  }

  if (snapshot.inventoryRemaining < 20) {
    add("replace_supplier", "Evaluate supplier backup", "Inventory running low — assess alternate fulfilment");
  }

  if (snapshot.reviewScore < 3.5) {
    add("stop_product", "Consider stopping product", `Review score ${snapshot.reviewScore}/5 — high reputation risk`);
  }

  if (followUps.length === 0) {
    add("improve_creative", "Optimize creative refresh", "Stable performance — test next creative variant");
  }

  return followUps;
}

export function monitorMissionPerformance(
  workspaceId: string,
  missionId: string,
): { snapshot: PerformanceSnapshot; followUps: FollowUpMission[]; mission: ProductLaunchMission } {
  const mission = getMission(workspaceId, missionId);
  if (!mission) throw new Error("Mission not found");
  if (!["monitoring", "live", "approved", "publishing"].includes(mission.status)) {
    throw new Error("Performance monitoring available only after launch");
  }

  const snapshot = buildPerformanceSnapshot(mission);
  savePerformanceSnapshot(workspaceId, snapshot);

  const followUps = generateFollowUpMissions(mission, snapshot);
  for (const followUp of followUps) {
    saveFollowUpMission(workspaceId, followUp);
  }

  const updated: ProductLaunchMission = {
    ...mission,
    status: "monitoring",
    updatedAt: new Date().toISOString(),
  };
  saveMission(workspaceId, updated);

  return { snapshot, followUps, mission: updated };
}

export function getMissionPerformance(
  workspaceId: string,
  missionId: string,
): { snapshots: PerformanceSnapshot[]; followUps: FollowUpMission[] } {
  return {
    snapshots: listPerformanceSnapshots(workspaceId, missionId),
    followUps: listFollowUpMissions(workspaceId, missionId),
  };
}
