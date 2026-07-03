/**
 * G5-05 — Canonical Pillow Approval Router (routing only — no workflow execution).
 */

import { randomUUID } from "node:crypto";
import type {
  ApprovalHistoryEntry,
  ApprovalOutcomeInput,
  ApprovalSubmissionInput,
  AutomationApprovalRequest,
  CockpitApprovalCard,
  CockpitApprovalStatusSnapshot,
  ResolvedApprovalPolicy,
} from "../contracts/approval-types.js";
import type { ApprovalRoutingResult, TriggerApprovalState } from "../contracts/trigger-types.js";
import { recordApprovalAuditEvent } from "../audit/approval-audit-recorder.js";
import {
  validateApprovalMutation,
  validateApprovalSubmission,
} from "../governance/approval-pillow-governance.js";
import {
  computeApprovalExpiry,
  resolveApprovalPolicy,
} from "./approval-policy-resolver.js";
import { approvalPluginRegistry } from "./approval-plugin-registry.js";
import { getApprovalRequestStore } from "./approval-request-store.js";
import type { AutomationNotificationRow } from "../../../registry/types/automation-registry-types.js";
import { REG_AUTOMATION_NOTIFICATION } from "../../../registry/types/registry-ids.js";
import { resolveAutomationRegistry } from "../registry/automation-registry-resolver.js";
import { getAutomationQueue } from "../queue/automation-queue.js";
import { getWorkflowOrchestrator } from "../orchestrator/workflow-orchestrator.js";
import { dispatchToWorkflowScheduler } from "../scheduler/workflow-scheduler-dispatch.js";

function tierToTriggerApprovalState(tier: string): TriggerApprovalState {
  switch (tier) {
    case "A0":
      return "routed_a0";
    case "A1":
      return "routed_a1";
    case "A2":
      return "routed_a2";
    case "A3":
      return "routed_a3";
    default:
      return "pending";
  }
}

function appendHistory(
  request: AutomationApprovalRequest,
  state: AutomationApprovalRequest["approvalState"],
  actorId: string,
  reason: string,
): ApprovalHistoryEntry {
  const entry: ApprovalHistoryEntry = {
    entryId: randomUUID(),
    state,
    actorId,
    reason,
    recordedAt: new Date().toISOString(),
  };
  request.history.push(entry);
  return entry;
}

function transitionState(
  request: AutomationApprovalRequest,
  nextState: AutomationApprovalRequest["approvalState"],
  actorId: string,
  reason: string,
): AutomationApprovalRequest {
  const previousState = request.approvalState;
  request.approvalState = nextState;
  appendHistory(request, nextState, actorId, reason);
  approvalPluginRegistry.notifyStateChange(request, previousState);
  return request;
}

export class PillowApprovalRouter {
  private readonly store = getApprovalRequestStore();

  evaluateRequirement(input: {
    approvalRegistryId?: string;
    policyRegistryId?: string;
    payload?: Record<string, unknown>;
  }): { policy: ResolvedApprovalPolicy; routing: ApprovalRoutingResult } {
    const policy = resolveApprovalPolicy(input);
    const approvalState: TriggerApprovalState =
      policy.required && policy.tier !== "A0"
        ? tierToTriggerApprovalState(policy.tier)
        : policy.tier === "A0"
          ? "not_required"
          : "rejected";

    const routing: ApprovalRoutingResult = {
      required: policy.required,
      tier: policy.tier,
      approvalState: policy.approvalRegistryId === "unbound" ? "not_required" : approvalState,
      routingRuleId: policy.routingRuleId,
      reason: policy.reason,
    };

    if (!policy.pillowBridge && policy.required) {
      routing.required = true;
      routing.approvalState = "rejected";
      routing.reason = "Approval registry row missing Pillow bridge — blocked";
    }

    return { policy, routing };
  }

  async submitApprovalRequest(input: ApprovalSubmissionInput): Promise<AutomationApprovalRequest> {
    const governance = validateApprovalSubmission(input);
    if (!governance.eligible) {
      throw new Error(`Approval submission rejected: ${governance.reason}`);
    }

    const { policy } = this.evaluateRequirement({
      approvalRegistryId: input.approvalRegistryId,
      policyRegistryId: input.policyRegistryId,
      payload: input.payload,
    });

    if (!policy.required) {
      throw new Error("Approval submission rejected — approval not required for this request");
    }

    const requestedAt = new Date().toISOString();
    const approvalId = randomUUID();
    const request: AutomationApprovalRequest = {
      approvalId,
      workflowId: input.workflowId,
      workflowVersion: input.workflowVersion,
      executionId: input.executionId,
      triggerId: input.triggerId,
      queueId: input.queueId,
      decisionReference: input.decisionReference,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      brandId: input.brandId,
      approvalTier: policy.tier,
      approvalPolicyId: policy.policyRegistryId ?? "unbound",
      approvalRegistryId: policy.approvalRegistryId,
      requestedBy: input.actorId,
      requestedAt,
      expiryAt: computeApprovalExpiry(requestedAt, policy.expiryMs),
      correlationId: input.correlationId,
      approvalState: "pending",
      supportingEvidence: input.supportingEvidence,
      notificationRegistryIds: policy.notificationRegistryIds,
      routingRuleId: policy.routingRuleId,
      pillowGovernance: true,
      history: [],
    };

    appendHistory(request, "pending", input.actorId, "Approval request submitted");
    const validation = approvalPluginRegistry.runValidators({ policy, request });
    if (!validation.valid) {
      transitionState(request, "rejected", input.actorId, validation.reason);
      this.store.save(request);
      throw new Error(`Approval validation failed: ${validation.reason}`);
    }

    transitionState(request, "awaiting_review", input.actorId, "Approval routed for Pillow review");
    this.store.save(request);

    await this.routeNotifications(request);

    recordApprovalAuditEvent({
      eventType: "approval_requested",
      workspaceId: request.workspaceId,
      actorId: input.actorId,
      approvalId: request.approvalId,
      workflowId: request.workflowId,
      triggerId: request.triggerId,
      correlationId: request.correlationId,
      approvalState: request.approvalState,
      decisionReference: request.decisionReference,
      reason: policy.reason,
      evidence: request.supportingEvidence,
    });

    const { mirrorG5SubmissionToCanonicalGate } = await import(
      "../../pillow-approval/canonical-pillow-approval-pipeline.js"
    );
    mirrorG5SubmissionToCanonicalGate(request);
    this.store.save(request);

    return request;
  }

  private async routeNotifications(request: AutomationApprovalRequest): Promise<void> {
    const notifications = resolveAutomationRegistry({}, REG_AUTOMATION_NOTIFICATION)
      .rows as AutomationNotificationRow[];

    await approvalPluginRegistry.deliverNotifications({
      request,
      notificationRegistryIds: request.notificationRegistryIds,
      resolveNotification: (id) => {
        const row = notifications.find((item) => item.id === id);
        if (!row) return undefined;
        return { templateRef: row.templateRef, channel: row.channel };
      },
    });
  }

  async grantApproval(input: ApprovalOutcomeInput): Promise<AutomationApprovalRequest> {
    return this.applyTerminalOutcome(input, "approved", "approval_granted");
  }

  async rejectApproval(input: ApprovalOutcomeInput): Promise<AutomationApprovalRequest> {
    return this.applyTerminalOutcome(input, "rejected", "approval_rejected");
  }

  async cancelApproval(input: ApprovalOutcomeInput): Promise<AutomationApprovalRequest> {
    return this.applyTerminalOutcome(input, "cancelled", "approval_cancelled");
  }

  async expireApproval(input: ApprovalOutcomeInput): Promise<AutomationApprovalRequest> {
    return this.applyTerminalOutcome(input, "expired", "approval_expired");
  }

  private async applyTerminalOutcome(
    input: ApprovalOutcomeInput,
    state: AutomationApprovalRequest["approvalState"],
    auditType: "approval_granted" | "approval_rejected" | "approval_cancelled" | "approval_expired",
  ): Promise<AutomationApprovalRequest> {
    const request = this.store.getById(input.approvalId);
    if (!request) {
      throw new Error(`Approval request not found: ${input.approvalId}`);
    }

    const governance = validateApprovalMutation(request, input);
    if (!governance.eligible) {
      throw new Error(`Approval outcome rejected: ${governance.reason}`);
    }

    if (["approved", "rejected", "expired", "cancelled", "completed", "superseded"].includes(request.approvalState)) {
      throw new Error(`Approval request is terminal — current state: ${request.approvalState}`);
    }

    transitionState(request, state, input.actorId, input.reason ?? `Approval ${state}`);
    this.store.save(request);

    recordApprovalAuditEvent({
      eventType: auditType,
      workspaceId: request.workspaceId,
      actorId: input.actorId,
      approvalId: request.approvalId,
      workflowId: request.workflowId,
      triggerId: request.triggerId,
      correlationId: request.correlationId,
      approvalState: request.approvalState,
      decisionReference: request.decisionReference,
      reason: input.reason ?? `Approval ${state}`,
      evidence: request.supportingEvidence,
    });

    if (state === "approved") {
      await this.resumeAutomationAfterApproval(request, input.actorId);
      transitionState(request, "completed", input.actorId, "Approval completed — automation resumed");
      this.store.save(request);
    } else if (state === "rejected" || state === "expired" || state === "cancelled") {
      await this.terminateAutomationAfterRejection(request, input.actorId, state);
    }

    const { syncG5OutcomeToGate, recordCanonicalApprovalEklsOutcome } = await import(
      "../../pillow-approval/canonical-pillow-approval-pipeline.js"
    );
    syncG5OutcomeToGate(request, input.actorId);
    recordCanonicalApprovalEklsOutcome({
      approvalId: request.approvalId,
      workspaceId: request.workspaceId,
      actorId: input.actorId,
      outcome: state,
      summary: `${request.workflowId} · ${request.approvalTier}`,
    });

    return request;
  }

  async resumeAutomationAfterApproval(
    request: AutomationApprovalRequest,
    actorId: string,
  ): Promise<void> {
    if (request.executionId) {
      const orchestrator = getWorkflowOrchestrator();
      const run = orchestrator.getRun(request.executionId);
      if (run && run.lifecycleState === "step_waiting") {
        await orchestrator.advanceRun(request.executionId, {
          actorId,
          pillowGovernance: true,
        });
      }
      return;
    }

    if (request.queueId) {
      const queue = getAutomationQueue();
      const entry = queue.getById(request.queueId);
      if (entry) {
        entry.approvalReference = `approved:${request.approvalId}`;
        if (entry.executionState === "scheduled" || entry.executionState === "pending") {
          entry.executionState = "queued";
          entry.orchestratorHandoffReady = true;
        }
      }
      return;
    }

    const evidence = request.supportingEvidence;
    const triggerContext = evidence?.triggerContext as import("../contracts/trigger-types.js").TriggerContext | undefined;
    const workflowRef = evidence?.workflowRef as { id: string; version: string } | undefined;
    const approvalRouting = evidence?.approvalRouting as ApprovalRoutingResult | undefined;
    if (triggerContext && workflowRef && approvalRouting) {
      dispatchToWorkflowScheduler(
        {
          triggerContext: {
            ...triggerContext,
            approvalState: "not_required",
          },
          workflowRef,
          registryRefs: triggerContext.registryReferences,
          approvalRouting: { ...approvalRouting, required: false, approvalState: "not_required" },
          correlationId: request.correlationId,
        },
        { actorId },
      );
    }
  }

  async terminateAutomationAfterRejection(
    request: AutomationApprovalRequest,
    actorId: string,
    state: AutomationApprovalRequest["approvalState"],
  ): Promise<void> {
    if (request.executionId) {
      getWorkflowOrchestrator().cancelRun(request.executionId, actorId);
      return;
    }

    if (request.queueId) {
      const queue = getAutomationQueue();
      const entry = queue.getById(request.queueId);
      if (entry) {
        entry.approvalReference = `${state}:${request.approvalId}`;
        entry.executionState = "cancelled";
      }
    }
  }

  submitFromTriggerContext(input: {
    actorId: string;
    pillowGovernance: true;
    approvalRegistryId?: string;
    policyRegistryId?: string;
    workflowId: string;
    workflowVersion: string;
    triggerId: string;
    workspaceId: string;
    companyId?: string;
    brandId?: string;
    correlationId: string;
    decisionReference?: string;
    payload?: Record<string, unknown>;
    supportingEvidence?: Record<string, unknown>;
    triggerContext: import("../contracts/trigger-types.js").TriggerContext;
    approvalRouting: ApprovalRoutingResult;
  }): Promise<AutomationApprovalRequest> {
    return this.submitApprovalRequest({
      actorId: input.actorId,
      pillowGovernance: true,
      workflowId: input.workflowId,
      workflowVersion: input.workflowVersion,
      triggerId: input.triggerId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      brandId: input.brandId,
      correlationId: input.correlationId,
      decisionReference: input.decisionReference,
      approvalRegistryId: input.approvalRegistryId,
      policyRegistryId: input.policyRegistryId,
      payload: input.payload,
      supportingEvidence: {
        ...input.supportingEvidence,
        triggerContext: input.triggerContext,
        approvalRouting: input.approvalRouting,
      },
    });
  }

  pauseExecutionForApproval(input: {
    executionId: string;
    actorId: string;
    approvalRegistryId?: string;
    policyRegistryId?: string;
    workflowId: string;
    triggerId: string;
    workspaceId: string;
    correlationId: string;
    decisionReference?: string;
    companyId?: string;
    brandId?: string;
  }): Promise<AutomationApprovalRequest> {
    getWorkflowOrchestrator().pauseRun(input.executionId, input.actorId);

    return this.submitApprovalRequest({
      actorId: input.actorId,
      pillowGovernance: true,
      workflowId: input.workflowId,
      executionId: input.executionId,
      triggerId: input.triggerId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      brandId: input.brandId,
      correlationId: input.correlationId,
      decisionReference: input.decisionReference,
      approvalRegistryId: input.approvalRegistryId,
      policyRegistryId: input.policyRegistryId,
      supportingEvidence: { pausedExecutionId: input.executionId },
    });
  }

  getApprovalStatus(approvalId: string): AutomationApprovalRequest | undefined {
    return this.store.getById(approvalId);
  }

  getCockpitApprovalStatus(workspaceId: string): CockpitApprovalStatusSnapshot {
    const requests = this.store.list({ workspaceId });
    const cards: CockpitApprovalCard[] = requests
      .filter((request) =>
        ["pending", "awaiting_review"].includes(request.approvalState),
      )
      .map((request) => ({
        approvalId: request.approvalId,
        workflowId: request.workflowId,
        triggerId: request.triggerId,
        approvalTier: request.approvalTier,
        approvalState: request.approvalState,
        requestedBy: request.requestedBy,
        requestedAt: request.requestedAt,
        expiryAt: request.expiryAt,
        correlationId: request.correlationId,
        decisionReference: request.decisionReference,
        summary: `${request.workflowId} · tier ${request.approvalTier} · ${request.approvalState}`,
      }));

    return {
      workspaceId,
      pendingCount: requests.filter((request) => request.approvalState === "pending").length,
      awaitingReviewCount: requests.filter((request) => request.approvalState === "awaiting_review")
        .length,
      requests,
      cards,
      generatedAt: new Date().toISOString(),
    };
  }

  checkExpiredApprovals(nowIso: string = new Date().toISOString()): AutomationApprovalRequest[] {
    const expired: AutomationApprovalRequest[] = [];
    for (const request of this.store.list()) {
      if (!request.expiryAt) continue;
      if (!["pending", "awaiting_review"].includes(request.approvalState)) continue;
      if (Date.parse(request.expiryAt) > Date.parse(nowIso)) continue;
      transitionState(request, "expired", "system:approval-router", "Approval expired per registry policy");
      this.store.save(request);
      recordApprovalAuditEvent({
        eventType: "approval_expired",
        workspaceId: request.workspaceId,
        actorId: "system:approval-router",
        approvalId: request.approvalId,
        workflowId: request.workflowId,
        triggerId: request.triggerId,
        correlationId: request.correlationId,
        approvalState: "expired",
        decisionReference: request.decisionReference,
        reason: "Approval expired per registry expiry policy",
      });
      expired.push(request);
    }
    return expired;
  }

  resetForTests(): void {
    this.store.resetForTests();
  }
}

let sharedRouter: PillowApprovalRouter | undefined;

export function getPillowApprovalRouter(): PillowApprovalRouter {
  if (!sharedRouter) {
    sharedRouter = new PillowApprovalRouter();
  }
  return sharedRouter;
}

export function resetPillowApprovalRouterForTests(): void {
  sharedRouter = undefined;
}
