import {
  registerProductCandidate,
  transitionProductState,
} from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import type { RevenuePipelineState } from "../../../grand-king-revenue-pipeline/models/revenue-state-machine.js";
import { buildMarketplaceListingPackage, enqueueMarketplacePublish } from "../../../runtime/marketplace-publishing/services/marketplace-publishing-service.js";
import { monitorMissionPerformance } from "./performance-monitoring-service.js";
import type { ProductLaunchMission } from "../models/commerce-intelligence-core.js";
import {
  getMission,
  saveLaunchStatus,
  saveMission,
} from "../store/commerce-intelligence-store.js";

export class LaunchAutomationBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LaunchAutomationBlockedError";
  }
}

function advanceToReadyToPublish(
  workspaceId: string,
  companyId: string,
  productId: string,
): void {
  const path: RevenuePipelineState[] = [
    "UNDER_REVIEW",
    "EXECUTIVE_REVIEW",
    "KING_APPROVAL",
    "READY_TO_PUBLISH",
  ];
  for (const state of path) {
    transitionProductState(
      workspaceId,
      companyId,
      productId,
      state,
      "Commerce Intelligence Core — Grand King approved launch mission",
    );
  }
}

/** Approval-gated launch automation — executes only after Grand King approval. */
export function executeApprovedLaunch(
  workspaceId: string,
  missionId: string,
  actor: string,
): ProductLaunchMission {
  const mission = getMission(workspaceId, missionId);
  if (!mission) throw new LaunchAutomationBlockedError("Mission not found");
  if (mission.status !== "approved" && !mission.kingApproved) {
    throw new LaunchAutomationBlockedError(
      "Launch blocked — Grand King approval required before automation (GC-02)",
    );
  }

  const now = new Date().toISOString();
  let gkrProductId = mission.gkrProductId;

  if (!gkrProductId) {
    const registered = registerProductCandidate(workspaceId, mission.companyId, {
      title: mission.creative.title,
      category: mission.product.category,
      supplierPlatform: mission.supplierId,
      supplierProductId: mission.product.supplierProductId,
    });
    gkrProductId = registered.productId;
    advanceToReadyToPublish(workspaceId, mission.companyId, gkrProductId);
  }

  if (mission.route === "marketplace") {
    const marketplaceId = "amazon" as const;
    const pkg = buildMarketplaceListingPackage({
      workspaceId,
      companyId: mission.companyId,
      productId: gkrProductId,
      marketplaceId,
      title: mission.creative.title,
      description: mission.creative.amazonListingCopy,
      bulletPoints: mission.creative.bulletPoints,
      specifications: { category: mission.product.category, route: mission.route },
      price: mission.arbitrage.expectedSellingPriceUsd,
      images: mission.product.images,
      executiveCouncilApproved: true,
      kingApproved: true,
    });
    enqueueMarketplacePublish(pkg);
  }

  const updated: ProductLaunchMission = {
    ...mission,
    status: "publishing",
    gkrProductId,
    kingApproved: true,
    updatedAt: now,
  };
  saveMission(workspaceId, updated);

  saveLaunchStatus(workspaceId, {
    missionId: updated.missionId,
    title: updated.creative.title,
    route: updated.route,
    status: "publishing",
    gkrProductId,
    lastEvent: `Launch automation started by ${actor} — listing package queued (approval-gated)`,
    updatedAt: now,
  });

  const monitoringMission: ProductLaunchMission = {
    ...updated,
    status: "monitoring",
    updatedAt: new Date().toISOString(),
  };
  saveMission(workspaceId, monitoringMission);
  saveLaunchStatus(workspaceId, {
    missionId: monitoringMission.missionId,
    title: monitoringMission.creative.title,
    route: monitoringMission.route,
    status: "monitoring",
    gkrProductId,
    lastEvent: "Post-launch monitoring active — performance snapshot and follow-up missions generated",
    updatedAt: monitoringMission.updatedAt,
  });

  monitorMissionPerformance(workspaceId, missionId);

  return getMission(workspaceId, missionId)!;
}
