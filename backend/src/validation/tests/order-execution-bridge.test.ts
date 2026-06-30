import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  orderExecutionSessionStore,
  orderExecutionTools,
  OrderSandboxSubmissionBlockedError,
} from "../../agents/order-execution-bridge/index.js";
import type { ToolContext } from "../../brain/types.js";
import { loadCjConfig } from "../../suppliers/cj-dropshipping/cj-config.js";
import { clearCjAuthCache } from "../../suppliers/cj-dropshipping/index.js";

const WORKSPACE_ID = "ws-m076-bridge";

const ORIGINAL_ENV = { ...process.env };

function toolContext(workspaceId = WORKSPACE_ID): ToolContext {
  return {
    workspaceId,
    agentId: "order-ops",
    correlationId: "corr-m076",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = orderExecutionTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  clearCjAuthCache();
  orderExecutionSessionStore.clear();
});

describe("Mission 076 Order Execution Bridge", () => {
  beforeEach(() => {
    orderExecutionSessionStore.clear();
    delete process.env.CJ_INTEGRATION_MODE;
    delete process.env.CJ_API_KEY;
    delete process.env.CJ_API_SECRET;
  });

  it("registers all five order Brain tools", () => {
    const names = orderExecutionTools.map((tool) => tool.name);
    assert.deepEqual(names, [
      "order.prepare_fulfillment_from_manufacturing_run",
      "order.get_fulfillment_readiness",
      "order.get_draft_order",
      "order.apply_order_approval",
      "order.submit_approved_order_sandbox_only",
    ]);
  });

  it("prepares fulfillment from manufacturing run with UI-shaped readiness output", async () => {
    const result = (await invokeTool("order.prepare_fulfillment_from_manufacturing_run", {
      useDeterministicMocks: true,
    })) as {
      runId: string;
      readiness: { ready: boolean; liveSubmitEnabled: false; safetyMessage: string };
      draftOrder: { orderId: string; payload: { sandbox: boolean } };
      autoSubmitEnabled: false;
    };

    assert.ok(result.runId);
    assert.equal(result.readiness.liveSubmitEnabled, false);
    assert.match(result.readiness.safetyMessage, /Sandbox only/i);
    assert.equal(result.draftOrder.payload?.sandbox, true);
    assert.equal(result.autoSubmitEnabled, false);
  });

  it("returns fulfillment readiness and draft order from session getters", async () => {
    await invokeTool("order.prepare_fulfillment_from_manufacturing_run", {
      useDeterministicMocks: true,
    });

    const readiness = (await invokeTool("order.get_fulfillment_readiness")) as {
      readiness: { ready: boolean };
      liveSubmitEnabled: false;
      autoSubmitEnabled: false;
    };
    const draft = (await invokeTool("order.get_draft_order")) as {
      draftOrder: { orderId: string; payload: Record<string, unknown> };
    };

    assert.equal(readiness.liveSubmitEnabled, false);
    assert.equal(readiness.autoSubmitEnabled, false);
    assert.ok(readiness.readiness.ready);
    assert.ok(draft.draftOrder.orderId);
    assert.ok(draft.draftOrder.payload);
  });

  it("blocks sandbox submit without approval gate", async () => {
    await invokeTool("order.prepare_fulfillment_from_manufacturing_run", {
      useDeterministicMocks: true,
    });

    await assert.rejects(
      () => invokeTool("order.submit_approved_order_sandbox_only"),
      /approved order/i,
    );
  });

  it("applies approval and submits sandbox-only without payment execution", async () => {
    await invokeTool("order.prepare_fulfillment_from_manufacturing_run", {
      useDeterministicMocks: true,
    });

    const approval = (await invokeTool("order.apply_order_approval", {
      approvalToken: "token-m076",
      approvedBy: "founder@empireai.test",
      approvedAt: new Date().toISOString(),
    })) as { approvalGate: { satisfied: boolean }; liveSubmitEnabled: false };

    assert.equal(approval.approvalGate.satisfied, true);
    assert.equal(approval.liveSubmitEnabled, false);

    const submission = (await invokeTool("order.submit_approved_order_sandbox_only")) as {
      integrationMode: "SANDBOX";
      paymentExecuted: false;
      walletDeducted: false;
      tracking: { trackingNumber: string; carrier: string } | null;
    };

    assert.equal(submission.integrationMode, "SANDBOX");
    assert.equal(submission.paymentExecuted, false);
    assert.equal(submission.walletDeducted, false);
    assert.ok(submission.tracking?.trackingNumber);
  });

  it("rejects sandbox submit when CJ integration mode is LIVE", async () => {
    process.env.CJ_INTEGRATION_MODE = "LIVE";
    process.env.CJ_API_KEY = "test-key";
    process.env.CJ_API_SECRET = "test-secret";

    await invokeTool("order.prepare_fulfillment_from_manufacturing_run", {
      useDeterministicMocks: true,
    });

    await invokeTool("order.apply_order_approval", {
      approvalToken: "token-m076-live-block",
      approvedBy: "founder@empireai.test",
      approvedAt: new Date().toISOString(),
    });

    await assert.rejects(
      () => invokeTool("order.submit_approved_order_sandbox_only"),
      (error: unknown) => error instanceof OrderSandboxSubmissionBlockedError,
    );

    const config = loadCjConfig();
    assert.equal(config.integrationMode, "LIVE");
  });
});
