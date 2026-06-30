import { analyzeArbitrage } from "./arbitrage-service.js";
import { generateCreativePackage } from "./creative-service.js";
import { applyCeoLens, applyCtoLens } from "./executive-lens-service.js";
import { buildProductLaunchMission } from "./mission-service.js";
import { studyAmazonMarketplace } from "./marketplace-study-service.js";
import { normalizeCjProduct } from "./normalization-service.js";
import { evaluateProductFit } from "./product-fit-service.js";
import { analyzeSupplierIntelligence } from "./supplier-intelligence-service.js";
import { pullCjSupplierProducts } from "./supplier-pull-service.js";
import type {
  CommerceIntelligenceDashboard,
  MissionDecision,
  MissionDecisionOutcome,
  ProductLaunchMission,
  QueueEntry,
} from "../models/commerce-intelligence-core.js";
import {
  getLastPullAt,
  getMission,
  listFollowUpMissions,
  listLaunchStatus,
  listMissions,
  listQueueEntries,
  saveCandidate,
  saveMission,
  saveQueueEntry,
  setLastPullAt,
} from "../store/commerce-intelligence-store.js";

export class MissionNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissionNotReadyError";
  }
}

export type PipelineRunResult = {
  pulled: number;
  processed: number;
  missionsCreated: number;
  rejected: number;
  deferred: number;
  notReady: number;
  queue: QueueEntry[];
};

function buildDashboard(workspaceId: string, companyId: string): CommerceIntelligenceDashboard {
  const queue = listQueueEntries(workspaceId);
  const missions = listMissions(workspaceId);
  const followUps = listFollowUpMissions(workspaceId);

  return {
    moduleId: "commerce-intelligence-core",
    missionId: "PILLOW-020",
    programLabel: "Commerce Intelligence Operating System",
    intelligenceOwner: "pillow",
    workspaceId,
    companyId,
    summary: `Pillow Commerce Intelligence OS · ${queue.length} candidate(s) · ${missions.filter((m) => m.status === "pending_review").length} mission(s) awaiting Grand King review`,
    queue: {
      total: queue.length,
      shortlisted: queue.filter((q) => q.status === "shortlisted" || q.status === "mission_ready").length,
      rejected: queue.filter((q) => q.status === "rejected").length,
      deferred: queue.filter((q) => q.status === "deferred").length,
      missionReady: queue.filter((q) => q.status === "mission_ready").length,
      notReady: queue.filter((q) => q.status === "not_ready").length,
    },
    missions: {
      pendingReview: missions.filter((m) => m.status === "pending_review").length,
      approved: missions.filter((m) => m.status === "approved" || m.kingApproved).length,
      live: missions.filter((m) => m.status === "live").length,
      blocked: missions.filter((m) => m.status === "blocked" || m.status === "failed").length,
      monitoring: missions.filter((m) => m.status === "monitoring").length,
    },
    followUpMissions: {
      pendingApproval: followUps.filter((f) => f.status === "pending_approval").length,
      total: followUps.length,
    },
    lastPullAt: getLastPullAt(workspaceId),
    computedAt: new Date().toISOString(),
  };
}

/** PILLOW-020 — Full governed commerce intelligence pipeline under Pillow ownership. */
export async function runCommerceIntelligencePipeline(
  workspaceId: string,
  companyId: string,
  keyword?: string,
): Promise<PipelineRunResult> {
  const pull = await pullCjSupplierProducts(keyword);
  setLastPullAt(workspaceId, pull.pulledAt);

  let processed = 0;
  let missionsCreated = 0;
  let rejected = 0;
  let deferred = 0;
  let notReady = 0;

  for (const cjProduct of pull.products) {
    processed += 1;
    const candidate = normalizeCjProduct(workspaceId, companyId, cjProduct);
    saveCandidate(workspaceId, candidate);

    const supplierIntelligence = analyzeSupplierIntelligence(candidate);
    const study = studyAmazonMarketplace(candidate);
    const arbitrage = analyzeArbitrage(candidate, study);
    const fit = evaluateProductFit(candidate, arbitrage);
    const creative = generateCreativePackage(candidate, study, fit);
    const ceoLens = applyCeoLens(candidate, study, arbitrage, fit);
    const ctoLens = applyCtoLens(candidate, study, fit);

    const now = new Date().toISOString();

    if (!arbitrage.passesThreshold || supplierIntelligence.candidateStatus === "not_ready") {
      rejected += 1;
      saveQueueEntry(workspaceId, {
        candidateId: candidate.candidateId,
        title: candidate.title,
        category: candidate.category,
        status: "rejected",
        confidenceScore: ceoLens.overallScore,
        commercialScore: arbitrage.arbitrageScore,
        netMarginPercent: arbitrage.estimatedNetMarginPercent,
        route: fit.route,
        rejectionReason:
          arbitrage.rejectionReason ??
          "Supplier not viable — insufficient fulfilment readiness",
        updatedAt: now,
      });
      continue;
    }

    const mission = buildProductLaunchMission(
      workspaceId,
      companyId,
      candidate,
      supplierIntelligence,
      study,
      arbitrage,
      fit,
      creative,
      ceoLens,
      ctoLens,
    );
    saveMission(workspaceId, mission);
    missionsCreated += 1;

    if (mission.proposalReadiness === "NOT_READY") {
      notReady += 1;
      deferred += 1;
      saveQueueEntry(workspaceId, {
        candidateId: candidate.candidateId,
        title: candidate.title,
        category: candidate.category,
        status: "not_ready",
        confidenceScore: mission.confidenceScore,
        commercialScore: mission.commercialScore,
        netMarginPercent: arbitrage.estimatedNetMarginPercent,
        route: fit.route,
        deferReason: mission.recommendation,
        missionId: mission.missionId,
        updatedAt: now,
      });
    } else {
      saveQueueEntry(workspaceId, {
        candidateId: candidate.candidateId,
        title: candidate.title,
        category: candidate.category,
        status: "mission_ready",
        confidenceScore: mission.confidenceScore,
        commercialScore: mission.commercialScore,
        netMarginPercent: arbitrage.estimatedNetMarginPercent,
        route: fit.route,
        missionId: mission.missionId,
        updatedAt: now,
      });
    }
  }

  return {
    pulled: pull.products.length,
    processed,
    missionsCreated,
    rejected,
    deferred,
    notReady,
    queue: listQueueEntries(workspaceId),
  };
}

export function getCommerceIntelligenceDashboard(
  workspaceId: string,
  companyId: string,
): CommerceIntelligenceDashboard {
  return buildDashboard(workspaceId, companyId);
}

export function decideMission(
  workspaceId: string,
  missionId: string,
  decision: MissionDecision,
  actor: string,
  note?: string,
): MissionDecisionOutcome {
  const mission = getMission(workspaceId, missionId);
  if (!mission) throw new Error("Mission not found");

  if (decision === "why") {
    return { decisionKind: "why", whyEvidence: mission.whyEvidence, mission };
  }

  if (decision === "approve") {
    if (mission.proposalReadiness === "NOT_READY") {
      throw new MissionNotReadyError("Proposal NOT READY — CEO/CTO lenses must pass before approval");
    }
    if (["rejected", "deferred"].includes(mission.status) && mission.proposalReadiness !== "READY") {
      throw new MissionNotReadyError("Cannot approve deferred or blocked proposal");
    }
  }

  const now = new Date().toISOString();
  let status: ProductLaunchMission["status"] = mission.status;

  if (decision === "approve") {
    status = "approved";
  } else if (decision === "reject") {
    status = "rejected";
  } else if (decision === "defer") {
    status = "deferred";
  }

  const updated: ProductLaunchMission = {
    ...mission,
    status,
    kingApproved: decision === "approve",
    decidedAt: now,
    decidedBy: actor,
    updatedAt: now,
    recommendation:
      decision === "approve"
        ? note ?? "Grand King approved — launch automation available"
        : decision === "reject"
          ? note ?? "Grand King rejected — mission closed"
          : note ?? "Grand King deferred — revisit in intelligence queue",
  };

  saveMission(workspaceId, updated);
  return updated;
}

export {
  listQueueEntries,
  listMissions,
  getMission,
  listLaunchStatus,
};
