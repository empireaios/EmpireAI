import type { ApprovalRequest, ApprovalStatus } from "./types.js";

/** Pending approval queue — backed by repository, filtered in memory for hot path. */
export class ApprovalQueue {
  listPending(requests: ApprovalRequest[]): ApprovalRequest[] {
    return requests
      .filter((request) => request.status === "Pending")
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }

  listByStatus(
    requests: ApprovalRequest[],
    status: ApprovalStatus,
  ): ApprovalRequest[] {
    return requests.filter((request) => request.status === status);
  }

  findByMissionId(
    requests: ApprovalRequest[],
    missionId: string,
  ): ApprovalRequest | undefined {
    return requests.find(
      (request) =>
        request.linkedMissionId === missionId ||
        request.proposal.missionId === missionId,
    );
  }
}
