import type { ApprovalStore } from "./approval-store.js";
import type { ApprovalTimelineEntry } from "./types.js";

export class MetricsCollector {
  collect(store: ApprovalStore) {
    const requests = store.listRequests();
    return {
      totalPolicies: store.listPolicies().length,
      totalRequests: requests.length,
      pendingApprovals: requests.filter((r) =>
        ["pending", "routed", "awaiting_pillow", "awaiting_grand_king", "delegated", "escalated"].includes(
          r.currentStatus,
        ),
      ).length,
      approvedRequests: requests.filter((r) => r.currentStatus === "approved" || r.currentStatus === "resumed")
        .length,
      rejectedRequests: requests.filter((r) => r.currentStatus === "rejected").length,
      escalatedRequests: requests.filter(
        (r) => r.currentStatus === "escalated" || r.escalationHistory.length > 0,
      ).length,
      totalDecisions: store.listDecisions().length,
      totalReports: store.listReports().length,
    };
  }

  buildApprovalTimelines(store: ApprovalStore): ApprovalTimelineEntry[] {
    return store.listRequests().map((r) => ({
      approvalId: r.approvalId,
      status: r.currentStatus,
      stageIndex: r.stageIndex,
      currentApprover: r.currentApprover,
      timestamps: [...r.timestampHistory],
      structuralSignalOnly: true as const,
    }));
  }
}
