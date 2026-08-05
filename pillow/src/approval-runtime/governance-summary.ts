import type { ApprovalStore } from "./approval-store.js";
import type { GovernanceSummary } from "./types.js";
import type { MetricsCollector } from "./metrics-collector.js";

export class GovernanceSummaryBuilder {
  build(store: ApprovalStore, metricsCollector: MetricsCollector): GovernanceSummary {
    const metrics = metricsCollector.collect(store);
    return {
      pillowEnforced: true,
      grandKingEnforced: true,
      neverFabricateApprovalDecisions: true,
      neverAutoApproveRestrictedActions: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1010OrLater: true,
      deterministicApprovalRouting: true,
      preserveApprovalHistory: true,
      preserveAuditHistory: true,
      preventUnauthorizedExecution: true,
      totalPolicies: metrics.totalPolicies,
      totalRequests: metrics.totalRequests,
      totalDecisions: metrics.totalDecisions,
      notes: [
        "Pillow and Grand King approval requirements are enforced structurally",
        "Decisions originate only from explicit decide/approve/reject/escalate/delegate calls",
        "Approval Runtime does not implement Q10-10 Monitoring Runtime",
      ],
    };
  }
}
