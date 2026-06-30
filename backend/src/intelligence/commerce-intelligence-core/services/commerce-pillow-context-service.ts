import type { CommercePillowContext } from "../models/commerce-intelligence-core.js";
import {
  getMission,
  listFollowUpMissions,
  listLaunchStatus,
  listMissions,
  listQueueEntries,
} from "../store/commerce-intelligence-store.js";

/** PILLOW-020 — Commerce context for Pillow Executive Companion. */
export function buildCommercePillowContext(
  workspaceId: string,
  missionId?: string,
  candidateId?: string,
): CommercePillowContext {
  const missions = listMissions(workspaceId);
  const queue = listQueueEntries(workspaceId);
  const launchStatus = listLaunchStatus(workspaceId);

  const mission =
    (missionId ? getMission(workspaceId, missionId) : undefined) ??
    missions.find((m) => m.status === "pending_review") ??
    missions[0];

  const queueEntry =
    candidateId
      ? queue.find((q) => q.candidateId === candidateId)
      : mission
        ? queue.find((q) => q.missionId === mission.missionId)
        : queue[0];

  const statusEntry = mission ? launchStatus.find((s) => s.missionId === mission.missionId) : undefined;
  const followUps = mission ? listFollowUpMissions(workspaceId, mission.missionId) : [];

  const context: CommercePillowContext = {
    intelligenceOwner: "pillow",
    program: "PILLOW-020",
  };

  if (queueEntry) {
    context.currentCandidate = {
      candidateId: queueEntry.candidateId,
      title: queueEntry.title,
      status: queueEntry.status,
      commercialScore: queueEntry.commercialScore,
    };
  }

  if (mission) {
    context.currentMission = {
      missionId: mission.missionId,
      title: mission.creative.title,
      status: mission.status,
      proposalReadiness: mission.proposalReadiness,
      route: mission.route,
      confidenceScore: mission.confidenceScore,
      approvalState: mission.kingApproved ? "approved" : mission.status,
      creativeReadiness: mission.creative.mediaReadiness,
      whyEvidence: mission.whyEvidence,
    };
    context.supplier = mission.supplierId;
    context.marketplace = mission.marketplaceId;
    context.launchStatus = statusEntry?.status ?? mission.status;
  }

  if (followUps.length > 0 && context.currentMission) {
    context.currentMission = {
      ...context.currentMission,
      whyEvidence: [
        ...context.currentMission.whyEvidence,
        `${followUps.length} follow-up mission(s) pending Grand King approval`,
      ],
    };
  }

  return context;
}
