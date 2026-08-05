import type { ApprovalStore } from "./approval-store.js";
import { ApprovalRouter } from "./approval-router.js";
import type { ApprovalPolicy, ApprovalRequest } from "./types.js";

export class MultiStageEngine {
  private readonly router = new ApprovalRouter();

  /**
   * Advance stages only after approve. Reject blocks all further stages.
   */
  applyApprove(
    store: ApprovalStore,
    request: ApprovalRequest,
    policy: ApprovalPolicy,
  ): ApprovalRequest {
    const nextIndex = request.stageIndex + 1;
    if (nextIndex >= policy.stages.length) {
      return (
        store.updateRequest(request.approvalId, {
          stageIndex: policy.stages.length - 1,
          currentStatus: "approved",
          currentApprover: request.currentApprover,
          timestampHistory: [...request.timestampHistory, new Date().toISOString()],
        }) ?? request
      );
    }

    const provisional: ApprovalRequest = {
      ...request,
      stageIndex: nextIndex,
    };
    const routed = this.router.route(provisional, policy);
    return (
      store.updateRequest(request.approvalId, {
        stageIndex: routed.stageIndex,
        currentApprover: routed.currentApprover,
        currentStatus: routed.currentStatus,
        timestampHistory: [...request.timestampHistory, new Date().toISOString()],
      }) ?? request
    );
  }

  applyReject(store: ApprovalStore, request: ApprovalRequest): ApprovalRequest {
    return (
      store.updateRequest(request.approvalId, {
        currentStatus: "rejected",
        resumeToken: null,
        timestampHistory: [...request.timestampHistory, new Date().toISOString()],
      }) ?? request
    );
  }

  isFullyApproved(request: ApprovalRequest, policy: ApprovalPolicy): boolean {
    return request.currentStatus === "approved" && request.stageIndex >= policy.stages.length - 1;
  }
}
