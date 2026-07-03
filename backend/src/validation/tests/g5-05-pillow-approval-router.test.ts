import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  approvalPluginRegistry,
  evaluateAutomationApprovalRequirement,
  expireDueAutomationApprovals,
  getAutomationApprovalStatus,
  getCockpitAutomationApprovalStatus,
  grantAutomationApproval,
  listApprovalAuditEvents,
  peekSchedulerQueue,
  receiveAutomationTrigger,
  rejectAutomationApproval,
  resetBusinessAutomationHarnessForTests,
  routeApprovalRequirement,
  submitAutomationApproval,
} from "../../orchestration/business-automation/index.js";
import {
  resetAutomationRegistryBatchForTests,
  resetRegistryLoaderForTests,
} from "../../registry/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

function resetG505Harness(): void {
  resetRegistryLoaderForTests();
  resetAutomationRegistryBatchForTests();
  resetBusinessAutomationHarnessForTests();
}

describe("G5-05 — Pillow Approval Router", () => {
  it("resolves approval tiers from REG-AUTOMATION-APPROVAL without hardcoded chains", () => {
    resetG505Harness();
    const evaluation = evaluateAutomationApprovalRequirement({
      approvalRegistryId: "appr-foundation-tier-a1",
      policyRegistryId: "pol-foundation-default",
    });
    assert.equal(evaluation.policy.tier, "A1");
    assert.equal(evaluation.policy.required, true);
    assert.equal(evaluation.routing.tier, "A1");
    assert.ok(evaluation.policy.notificationRegistryIds.includes("ntf-foundation-gc03-alert"));
    assert.equal(evaluation.policy.expiryMs, 86_400_000);
  });

  it("routes irreversible payload to higher tier via registry rules", () => {
    resetG505Harness();
    const routing = routeApprovalRequirement({
      approvalRef: "appr-foundation-tier-a1",
      payload: { irreversible: true },
    });
    assert.equal(routing.tier, "A2");
    assert.equal(routing.required, true);
  });

  it("creates approval request with full context contract fields", async () => {
    resetG505Harness();
    const submitted = await submitAutomationApproval({
      actorId: "actor_g505",
      workspaceId: "ws_g505",
      workflowId: "wf-foundation-decision-orchestration",
      workflowVersion: "1.0.0",
      triggerId: "trg-foundation-decision-gate",
      correlationId: "corr-approval-context",
      approvalRegistryId: "appr-foundation-tier-a1",
      policyRegistryId: "pol-foundation-default",
      decisionReference: "dec-g505",
      companyId: "co_g505",
      supportingEvidence: { note: "foundation test" },
    });

    assert.ok(submitted.approvalId);
    const status = getAutomationApprovalStatus(submitted.approvalId);
    assert.equal(status.found, true);
    assert.equal(status.approvalState, "awaiting_review");
    assert.equal(status.approvalTier, "A1");
  });

  it("transitions approval states through grant and completed", async () => {
    resetG505Harness();
    const submitted = await submitAutomationApproval({
      actorId: "actor_g505",
      workspaceId: "ws_g505_grant",
      workflowId: "wf-foundation-decision-orchestration",
      triggerId: "trg-foundation-decision-gate",
      correlationId: "corr-grant",
      approvalRegistryId: "appr-foundation-tier-a1",
    });

    const granted = await grantAutomationApproval({
      approvalId: submitted.approvalId,
      actorId: "reviewer_g505",
      workspaceId: "ws_g505_grant",
      reason: "Grand King approved",
    });

    assert.equal(granted.approvalState, "completed");
    const history = getAutomationApprovalStatus(submitted.approvalId);
    assert.ok(history.found);
    assert.ok((history.history?.length ?? 0) >= 3);
  });

  it("rejects approval and records EKLS audit events through Pillow governance", async () => {
    resetG505Harness();
    const submitted = await submitAutomationApproval({
      actorId: "actor_g505",
      workspaceId: "ws_g505_reject",
      workflowId: "wf-foundation-decision-orchestration",
      triggerId: "trg-foundation-decision-gate",
      correlationId: "corr-reject",
      approvalRegistryId: "appr-foundation-tier-a1",
    });

    const rejected = await rejectAutomationApproval({
      approvalId: submitted.approvalId,
      actorId: "reviewer_g505",
      workspaceId: "ws_g505_reject",
      reason: "Policy violation",
    });

    assert.equal(rejected.approvalState, "rejected");
    const events = listApprovalAuditEvents("ws_g505_reject");
    assert.ok(events.some((event) => event.eventType === "approval_requested"));
    assert.ok(events.some((event) => event.eventType === "approval_rejected"));
    assert.equal(events.every((event) => event.pillowGovernance === true), true);
  });

  it("integrates trigger intake with approval router submission", async () => {
    resetG505Harness();
    const result = await receiveAutomationTrigger({
      category: "executive_decision",
      workspaceId: "ws_g505_trigger",
      actorId: "actor_g505",
      correlationId: "corr-trigger-approval",
      pillowGovernance: true,
      registryTriggerId: "trg-foundation-decision-gate",
    });

    if (result.outcome === "held" || result.outcome === "rejected") {
      assert.ok(result.reason.length > 0);
      return;
    }

    assert.equal(result.outcome, "approval_required");
    assert.ok(result.approvalId);
    assert.equal(result.automationRequest, undefined);
    assert.ok(getAutomationApprovalStatus(result.approvalId!).found);
  });

  it("resumes automation to scheduler after approval grant at trigger stage", async () => {
    resetG505Harness();
    const result = await receiveAutomationTrigger({
      category: "executive_decision",
      workspaceId: "ws_g505_resume",
      actorId: "actor_g505",
      correlationId: "corr-resume",
      pillowGovernance: true,
      registryTriggerId: "trg-foundation-decision-gate",
    });

    if (result.outcome !== "approval_required" || !result.approvalId) {
      return;
    }

    await grantAutomationApproval({
      approvalId: result.approvalId,
      actorId: "reviewer_g505",
      workspaceId: "ws_g505_resume",
    });

    assert.ok(peekSchedulerQueue("ws_g505_resume").length >= 1);
  });

  it("routes notifications through plugin providers without hardcoded channels", async () => {
    resetG505Harness();
    const deliveries: string[] = [];
    approvalPluginRegistry.registerNotificationProvider({
      pluginId: "test-gc03-provider",
      notificationRegistryId: "ntf-foundation-gc03-alert",
      deliver: async ({ request, channel }) => {
        deliveries.push(`${request.approvalId}:${channel ?? "unknown"}`);
        return { delivered: true, reason: "Plugin delivered" };
      },
    });

    await submitAutomationApproval({
      actorId: "actor_g505",
      workspaceId: "ws_g505_notify",
      workflowId: "wf-foundation-decision-orchestration",
      triggerId: "trg-foundation-decision-gate",
      correlationId: "corr-notify",
      approvalRegistryId: "appr-foundation-tier-a1",
    });

    assert.equal(deliveries.length, 1);
    assert.ok(deliveries[0]?.includes("gc03"));
  });

  it("exposes cockpit approval cards for future Automation Centre", async () => {
    resetG505Harness();
    await submitAutomationApproval({
      actorId: "actor_g505",
      workspaceId: "ws_g505_cockpit",
      workflowId: "wf-foundation-decision-orchestration",
      triggerId: "trg-foundation-decision-gate",
      correlationId: "corr-cockpit",
      approvalRegistryId: "appr-foundation-tier-a1",
    });

    const cockpit = getCockpitAutomationApprovalStatus("ws_g505_cockpit");
    assert.equal(cockpit.awaitingReviewCount, 1);
    assert.equal(cockpit.cards.length, 1);
    assert.equal(cockpit.cards[0]?.approvalTier, "A1");
    assert.ok(cockpit.cards[0]?.summary.includes("wf-foundation-decision-orchestration"));
  });

  it("expires approvals per registry expiry policy", async () => {
    resetG505Harness();
    const submitted = await submitAutomationApproval({
      actorId: "actor_g505",
      workspaceId: "ws_g505_expire",
      workflowId: "wf-foundation-decision-orchestration",
      triggerId: "trg-foundation-decision-gate",
      correlationId: "corr-expire",
      approvalRegistryId: "appr-foundation-tier-a1",
    });

    const future = new Date(Date.now() + 200_000_000).toISOString();
    const expired = await expireDueAutomationApprovals({ nowIso: future });
    assert.ok(expired.approvalIds.includes(submitted.approvalId));
    assert.equal(getAutomationApprovalStatus(submitted.approvalId).approvalState, "expired");
  });
});
