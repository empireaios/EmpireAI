import { appendPorLog } from "./por-logging.js";
import { POR_METADATA_VERSION } from "./paths.js";
import { nextPorId } from "./orchestration-store.js";
import type { OrchestrationStore } from "./orchestration-store.js";
import type { PorIntegrationCoordinator } from "./integrations.js";
import type { ApprovalAction, ApprovalRequestDescriptor, PorInput } from "./types.js";

export class ApprovalCoordinator {
  route(
    store: OrchestrationStore,
    integrations: PorIntegrationCoordinator,
    descriptor: ApprovalRequestDescriptor,
    input: PorInput,
  ): ApprovalAction {
    const actionId = nextPorId("por-approval");
    const routedAt = new Date().toISOString();
    const requiresGrandKingApproval = descriptor.requiresGrandKingApproval === true || input.highRisk === true;
    const grandKingApproved = input.grandKingApproved === true;
    const deps = integrations.getDependencies();
    const handler = deps.approvalRouter?.routeApproval ?? deps.approvalWorkflow?.submitApproval;

    if (requiresGrandKingApproval && !grandKingApproved) {
      const blocked: ApprovalAction = {
        actionId,
        approvalId: descriptor.approvalId,
        kind: descriptor.kind,
        status: "blocked",
        routedAt,
        requiresGrandKingApproval: true,
        grandKingApproved: false,
        handlerInvoked: false,
        notes: ["High-risk approval blocked — Grand King approval required"],
        metadataVersion: POR_METADATA_VERSION,
      };
      store.saveApprovalAction(blocked);
      appendPorLog({ event: "route_approval_blocked", details: descriptor.approvalId });
      return blocked;
    }

    if (handler) {
      handler({ ...descriptor, grandKingApproved, sessionId: input.sessionId });
      const routed: ApprovalAction = {
        actionId,
        approvalId: descriptor.approvalId,
        kind: descriptor.kind,
        status: "succeeded",
        routedAt,
        requiresGrandKingApproval,
        grandKingApproved,
        handlerInvoked: true,
        notes: [`Approval ${descriptor.approvalId} routed via DI handler`],
        metadataVersion: POR_METADATA_VERSION,
      };
      store.saveApprovalAction(routed);
      appendPorLog({ event: "route_approval", details: descriptor.approvalId });
      return routed;
    }

    const recorded: ApprovalAction = {
      actionId,
      approvalId: descriptor.approvalId,
      kind: descriptor.kind,
      status: "structural_recorded",
      routedAt,
      requiresGrandKingApproval,
      grandKingApproved,
      handlerInvoked: false,
      notes: [
        `Structural approval routing recorded for ${descriptor.approvalId}`,
        "No DI approval handler available — never fabricates approval success",
      ],
      metadataVersion: POR_METADATA_VERSION,
    };
    store.saveApprovalAction(recorded);
    appendPorLog({ event: "route_approval_structural", details: descriptor.approvalId });
    return recorded;
  }
}
