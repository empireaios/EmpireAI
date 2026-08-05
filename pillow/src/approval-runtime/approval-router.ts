import type { ApprovalPolicy, ApprovalRequest, ApprovalStatus } from "./types.js";

export type RouteResult = {
  currentApprover: string;
  currentStatus: ApprovalStatus;
  stageIndex: number;
};

/**
 * Deterministic approval routing:
 * - pillow-only → awaiting_pillow / pillow
 * - grand_king / highRisk → pillow first, then grand_king
 * - multi_stage → advance stage order
 */
export class ApprovalRouter {
  route(request: ApprovalRequest, policy: ApprovalPolicy): RouteResult {
    const stageIndex = Math.min(request.stageIndex, Math.max(0, policy.stages.length - 1));
    const stage = policy.stages[stageIndex] ?? "pillow";
    const currentApprover = this.approverForStage(stage, request);
    const currentStatus = this.statusForStage(stage);
    return { currentApprover, currentStatus, stageIndex };
  }

  initialRoute(policy: ApprovalPolicy, request: Pick<ApprovalRequest, "factory" | "worker" | "requestedApprover">): RouteResult {
    const stageIndex = 0;
    const stage = policy.stages[0] ?? "pillow";
    return {
      stageIndex,
      currentApprover: this.approverForStage(stage, request),
      currentStatus: this.statusForStage(stage),
    };
  }

  private statusForStage(stage: string): ApprovalStatus {
    if (stage === "grand_king") return "awaiting_grand_king";
    if (stage === "pillow") return "awaiting_pillow";
    return "routed";
  }

  private approverForStage(
    stage: string,
    request: Pick<ApprovalRequest, "factory" | "worker" | "requestedApprover">,
  ): string {
    if (stage === "pillow") return "pillow";
    if (stage === "grand_king") return "grand_king";
    if (stage === "factory_lead") return `factory_lead:${request.factory}`;
    if (request.requestedApprover) return request.requestedApprover;
    return stage;
  }
}
