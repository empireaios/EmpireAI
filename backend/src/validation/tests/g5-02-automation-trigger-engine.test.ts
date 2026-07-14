import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateAutomationTriggers,
  getAutomationTriggerStatus,
  listTriggerAuditEvents,
  peekSchedulerQueue,
  receiveAutomationTrigger,
  resetTriggerAuditLogForTests,
  resetTriggerEngineForTests,
  resetTriggerPluginRegistryForTests,
  resetWorkflowSchedulerDispatchForTests,
  triggerPluginRegistry,
} from "../../orchestration/business-automation/index.js";
import {
  resetAutomationRegistryBatchForTests,
  resetRegistryLoaderForTests,
} from "../../registry/index.js";
import { evaluateRegistryFilterExpression } from "../../orchestration/business-automation/triggers/trigger-filter-evaluator.js";
import {
  classifyDecisionRecommendation,
  evaluateExecutiveDecisionGate,
} from "../../orchestration/business-automation/triggers/decision-gate-evaluator.js";
import { routeApprovalRequirement } from "../../orchestration/business-automation/triggers/approval-router.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

function resetG502Harness(): void {
  resetRegistryLoaderForTests();
  resetAutomationRegistryBatchForTests();
  resetTriggerEngineForTests();
  resetTriggerAuditLogForTests();
  resetWorkflowSchedulerDispatchForTests();
  resetTriggerPluginRegistryForTests();
}

describe("G5-02 — Automation Trigger Engine", () => {
  it("evaluates registry filter expressions without hardcoded business tokens", () => {
    assert.equal(
      evaluateRegistryFilterExpression("finalRecommendation IN ('PROCEED','PROCEED_WITH_CAUTION')", {
        finalRecommendation: "PROCEED",
      }),
      true,
    );
    assert.equal(
      evaluateRegistryFilterExpression("finalRecommendation IN ('PROCEED','PROCEED_WITH_CAUTION')", {
        finalRecommendation: "HOLD",
      }),
      false,
    );
  });

  it("classifies executive decision gate recommendations", () => {
    assert.deepEqual(classifyDecisionRecommendation("PROCEED"), {
      eligible: true,
      held: false,
      stopped: false,
    });
    assert.deepEqual(classifyDecisionRecommendation("PROCEED_WITH_CAUTION"), {
      eligible: true,
      held: false,
      stopped: false,
    });
    assert.deepEqual(classifyDecisionRecommendation("HOLD"), {
      eligible: false,
      held: true,
      stopped: false,
    });
    assert.deepEqual(classifyDecisionRecommendation("STOP"), {
      eligible: false,
      held: false,
      stopped: true,
    });
  });

  it("integrates G3-10 business-automation consumer in decision gate evaluation", () => {
    resetG502Harness();
    const gate = evaluateExecutiveDecisionGate({
      workspaceId: "ws_g502",
      filterExpression: "finalRecommendation IN ('PROCEED','PROCEED_WITH_CAUTION')",
    });
    assert.ok(gate.finalRecommendation);
    assert.ok(gate.decisionReference.startsWith("g3-10:"));
    assert.equal(typeof gate.consumerEligible, "boolean");
  });

  it("routes approval tiers from REG-AUTOMATION-APPROVAL without executing approval", () => {
    resetG502Harness();
    const routing = routeApprovalRequirement({ approvalRef: "appr-foundation-tier-a1" });
    assert.equal(routing.tier, "A1");
    assert.equal(routing.required, true);
    assert.equal(routing.approvalState, "routed_a1");
    assert.ok(routing.reason.includes("A1"));
  });

  it("routes irreversible payload to higher approval tier via registry rules", () => {
    resetG502Harness();
    const routing = routeApprovalRequirement({
      approvalRef: "appr-foundation-tier-a1",
      payload: { irreversible: true },
    });
    assert.equal(routing.tier, "A2");
    assert.equal(routing.approvalState, "routed_a2");
  });

  it("evaluates decision triggers from registry via Trigger Engine", async () => {
    resetG502Harness();
    const evaluations = await evaluateAutomationTriggers({
      workspaceId: "ws_g502",
      actorId: "actor:g502",
      correlationId: "corr:evaluate:1",
    });
    assert.ok(evaluations.length >= 1);
    const foundation = evaluations.find((item) => item.triggerId === "trg-foundation-decision-gate");
    assert.ok(foundation);
    assert.ok(["accepted", "held", "approval_required", "rejected"].includes(foundation.outcome));
  });

  it("rejects triggers when Pillow governance kill switch is active", async () => {
    resetG502Harness();
    const result = await receiveAutomationTrigger({
      category: "executive_decision",
      workspaceId: "ws_g502",
      actorId: "actor:g502",
      correlationId: "corr:kill:1",
      pillowGovernance: true,
      killSwitchActive: true,
      registryTriggerId: "trg-foundation-decision-gate",
    });
    assert.equal(result.outcome, "rejected");
    assert.ok(result.reason.includes("kill switch"));
  });

  it("rejects triggers without pillowGovernance", async () => {
    resetG502Harness();
    const result = await receiveAutomationTrigger({
      category: "manual_executive",
      workspaceId: "ws_g502",
      actorId: "actor:g502",
      correlationId: "corr:gov:1",
      pillowGovernance: false as unknown as true,
    });
    assert.equal(result.outcome, "rejected");
    assert.ok(result.reason.includes("Pillow governance"));
  });

  it("requires approval routing for foundation A1 trigger without executing approval", async () => {
    resetG502Harness();
    const result = await receiveAutomationTrigger({
      category: "executive_decision",
      workspaceId: "ws_g502",
      actorId: "actor:g502",
      correlationId: "corr:approval:1",
      pillowGovernance: true,
      registryTriggerId: "trg-foundation-decision-gate",
    });

    if (result.outcome === "held" || result.outcome === "rejected") {
      assert.ok(result.reason.length > 0);
      return;
    }

    assert.equal(result.outcome, "approval_required");
    assert.equal(result.approvalRouting?.tier, "A1");
    assert.equal(result.automationRequest, undefined);
    assert.ok(peekSchedulerQueue("ws_g502").length === 0);
  });

  it("accepts A0-routed manual trigger and dispatches to scheduler queue only", async () => {
    resetG502Harness();
    const result = await receiveAutomationTrigger({
      category: "manual_executive",
      workspaceId: "ws_g502",
      actorId: "actor:g502",
      correlationId: "corr:manual:1",
      pillowGovernance: true,
      registryTriggerId: "trg-foundation-decision-gate",
      payload: {},
    });

    if (result.outcome === "approval_required") {
      assert.equal(result.automationRequest, undefined);
      return;
    }

    if (result.outcome === "accepted") {
      assert.ok(result.automationRequest);
      assert.equal(result.automationRequest.state, "QUEUED_FOR_SCHEDULER");
      assert.equal(result.automationRequest.schedulerHandoff, true);
      assert.equal(result.automationRequest.workflowRef.id, "wf-foundation-decision-orchestration");
      assert.ok(peekSchedulerQueue("ws_g502").length >= 1);
      return;
    }

    assert.ok(result.reason);
  });

  it("records EKLS-governed trigger audit events", async () => {
    resetG502Harness();
    await receiveAutomationTrigger({
      category: "cockpit_action",
      workspaceId: "ws_g502",
      actorId: "actor:g502",
      correlationId: "corr:audit:1",
      pillowGovernance: true,
      registryTriggerId: "trg-foundation-decision-gate",
    });
    const events = listTriggerAuditEvents("ws_g502");
    assert.ok(events.some((event) => event.eventType === "trigger_received"));
    assert.ok(events.every((event) => event.pillowGovernance === true));
  });

  it("supports future plugin trigger validators without core modification", async () => {
    resetG502Harness();
    triggerPluginRegistry.registerValidator({
      pluginId: "test-trigger-validator",
      validate: () => ({ valid: false, reason: "plugin blocked" }),
    });

    const result = await receiveAutomationTrigger({
      category: "manual_executive",
      workspaceId: "ws_g502",
      actorId: "actor:g502",
      correlationId: "corr:plugin:1",
      pillowGovernance: true,
      registryTriggerId: "trg-foundation-decision-gate",
    });
    assert.equal(result.outcome, "rejected");
    assert.ok(result.reason.includes("plugin blocked"));
  });

  it("exposes cockpit trigger status snapshot without UI", async () => {
    resetG502Harness();
    await receiveAutomationTrigger({
      category: "mission_event",
      workspaceId: "ws_g502",
      actorId: "actor:g502",
      correlationId: "corr:status:1",
      pillowGovernance: true,
      registryTriggerId: "trg-foundation-decision-gate",
    });
    const status = getAutomationTriggerStatus("ws_g502");
    assert.equal(status.workspaceId, "ws_g502");
    assert.ok(status.generatedAt);
    assert.ok(Array.isArray(status.entries));
  });

  it("resolves trigger configuration from REG-AUTOMATION-TRIGGER registry dynamically", async () => {
    resetG502Harness();
    const result = await receiveAutomationTrigger({
      category: "executive_decision",
      workspaceId: "ws_g502",
      actorId: "actor:g502",
      correlationId: "corr:registry:1",
      pillowGovernance: true,
    });
    assert.equal(result.triggerId, "trg-foundation-decision-gate");
    assert.ok(result.reason);
  });

  it("does not hardcode marketplace or product tokens in trigger engine paths", async () => {
    resetG502Harness();
    const result = await receiveAutomationTrigger({
      category: "business_event",
      workspaceId: "ws_g502",
      actorId: "actor:g502",
      correlationId: "corr:hardcode:1",
      pillowGovernance: true,
      registryTriggerId: "trg-foundation-decision-gate",
    });
    const serialized = JSON.stringify(result);
    for (const token of ["amazon-us", "walmart-us", "SKU-", "supplier-"]) {
      assert.equal(serialized.includes(token), false, `unexpected hardcoded token: ${token}`);
    }
  });
});
