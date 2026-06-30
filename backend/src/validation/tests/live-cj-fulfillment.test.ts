import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { liveCjFulfillmentTools } from "../../execution/live-cj-fulfillment/tools/live-cj-fulfillment-tools.js";
import {
  applyFounderApproval,
  executeLiveCjSubmit,
  LiveCjFulfillmentBlockedError,
  prepareLiveCjFulfillment,
  recoverFailedFulfillment,
  syncLiveCjTracking,
} from "../../execution/live-cj-fulfillment/index.js";
import {
  applyPipelineApproval,
  ingestVerifiedPayment,
} from "../../revenue/customer-order-pipeline/index.js";
import {
  completeMockCheckout,
  createLiveCheckout,
} from "../../revenue/live-payment-engine/index.js";
import { deployLiveStore } from "../../revenue/minimum-live-revenue-loop/index.js";
import type { ToolContext } from "../../brain/types.js";

const WORKSPACE_ID = "ws-m105";
const COMPANY_ID = "co-grand-king";
const ORIGINAL_ENV = { ...process.env };
let tempDeployRoot = "";

function uniqueSlug(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "live-cj-fulfillment",
    correlationId: "corr-m105",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = liveCjFulfillmentTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

async function buildReadyPipeline() {
  const slug = uniqueSlug("live-cj");
  const deployed = deployLiveStore({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    brandId: "brand-gk",
    slug,
    productName: "LIVE CJ Product",
    productDescription: "Mission 105 test",
    priceCents: 7200,
    cjSupplierSku: "CJ-SKU-M105",
    cjSupplierProductId: "CJ-PID-M105",
    unitCostCents: 2100,
  });

  const checkout = await createLiveCheckout({
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    storeId: deployed.store.storeId,
    productName: deployed.store.productName,
    amountCents: 7200,
  });

  const payment = await completeMockCheckout({
    sessionId: checkout.sessionId,
    workspaceId: WORKSPACE_ID,
    companyId: COMPANY_ID,
    amountCents: 7200,
    storeId: deployed.store.storeId,
  });

  const pipeline = await ingestVerifiedPayment(payment.paymentId);
  applyPipelineApproval({
    pipelineId: pipeline.pipelineId,
    approvalToken: "pipeline-approve-m105",
    approvedBy: "founder@empireai.com",
    approvedAt: new Date().toISOString(),
  });

  return pipeline;
}

beforeEach(() => {
  tempDeployRoot = fs.mkdtempSync(path.join(os.tmpdir(), "empire-m105-"));
  process.env.REVENUE_LOOP_DEPLOY_ROOT = tempDeployRoot;
  process.env.LIVE_PAYMENT_MOCK = "true";
  process.env.LIVE_CJ_FULFILLMENT_MOCK = "true";
  process.env.LIVE_CJ_FULFILLMENT_ENABLED = "false";
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.CJ_API_KEY;
  delete process.env.CJ_API_SECRET;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  if (tempDeployRoot && fs.existsSync(tempDeployRoot)) {
    fs.rmSync(tempDeployRoot, { recursive: true, force: true });
  }
});

describe("Mission 105 LIVE CJ Fulfillment", () => {
  it("registers seven LIVE CJ fulfillment Brain tools", () => {
    assert.equal(liveCjFulfillmentTools.length, 7);
    assert.ok(liveCjFulfillmentTools.some((tool) => tool.name === "live_cj_fulfillment.submit_live"));
  });

  it("prepares fulfillment at PENDING_FOUNDER_APPROVAL without submitting", async () => {
    const pipeline = await buildReadyPipeline();
    const fulfillment = prepareLiveCjFulfillment({ pipelineId: pipeline.pipelineId });

    assert.equal(fulfillment.status, "PENDING_FOUNDER_APPROVAL");
    assert.equal(fulfillment.supplierOrderId, null);
    assert.equal(fulfillment.attemptCount, 0);
  });

  it("blocks LIVE submit when Protect The Empire gate is disabled", async () => {
    const pipeline = await buildReadyPipeline();
    const prepared = prepareLiveCjFulfillment({ pipelineId: pipeline.pipelineId });

    const approved = applyFounderApproval({
      fulfillmentId: prepared.fulfillmentId,
      approvalToken: "founder-live-m105-block",
      approvedBy: "founder@empireai.com",
      approvedAt: new Date().toISOString(),
    });

    assert.equal(approved.status, "APPROVED");

    const toolResult = (await invokeTool("live_cj_fulfillment.submit_live", {
      fulfillmentId: approved.fulfillmentId,
    })) as { blocked: boolean; protectTheEmpire: boolean };

    assert.equal(toolResult.blocked, true);
    assert.equal(toolResult.protectTheEmpire, true);

    await assert.rejects(
      () => executeLiveCjSubmit(approved.fulfillmentId),
      LiveCjFulfillmentBlockedError,
    );
  });

  it("executes founder-approved LIVE mock submit with tracking and delivery", async () => {
    process.env.LIVE_CJ_FULFILLMENT_ENABLED = "true";

    const pipeline = await buildReadyPipeline();
    const prepared = prepareLiveCjFulfillment({ pipelineId: pipeline.pipelineId });

    applyFounderApproval({
      fulfillmentId: prepared.fulfillmentId,
      approvalToken: "founder-live-m105-submit",
      approvedBy: "founder@empireai.com",
      approvedAt: new Date().toISOString(),
    });

    const submitted = await executeLiveCjSubmit(prepared.fulfillmentId);
    assert.equal(submitted.status, "SUBMITTED");
    assert.ok(submitted.supplierOrderId?.startsWith("cj-live-mock-"));
    assert.ok(submitted.trackingNumber);
    assert.equal(submitted.integrationMode, "MOCK_LIVE");

    const tracked = await syncLiveCjTracking(submitted.fulfillmentId, { markDelivered: true });
    assert.equal(tracked.status, "DELIVERED");
    assert.equal(tracked.fulfillmentOrder.status, "DELIVERED");
  });

  it("recovers failed LIVE submit after founder re-approval", async () => {
    const pipeline = await buildReadyPipeline();
    const prepared = prepareLiveCjFulfillment({ pipelineId: pipeline.pipelineId });

    applyFounderApproval({
      fulfillmentId: prepared.fulfillmentId,
      approvalToken: "founder-live-m105-fail",
      approvedBy: "founder@empireai.com",
      approvedAt: new Date().toISOString(),
    });

    await assert.rejects(
      () => executeLiveCjSubmit(prepared.fulfillmentId),
      LiveCjFulfillmentBlockedError,
    );

    const failed = (await invokeTool("live_cj_fulfillment.get", {
      fulfillmentId: prepared.fulfillmentId,
    })) as { fulfillment: { status: string }; attempts: Array<{ phase: string }> };

    assert.equal(failed.fulfillment.status, "RECOVERABLE");
    assert.ok(failed.attempts.some((attempt) => attempt.phase === "submit"));

    const recovered = recoverFailedFulfillment({
      fulfillmentId: prepared.fulfillmentId,
      approvalToken: "founder-recovery-m105",
      approvedBy: "founder@empireai.com",
      approvedAt: new Date().toISOString(),
    });

    assert.equal(recovered.status, "APPROVED");

    process.env.LIVE_CJ_FULFILLMENT_ENABLED = "true";
    const resubmitted = await executeLiveCjSubmit(recovered.fulfillmentId);
    assert.equal(resubmitted.status, "SUBMITTED");
  });

  it("updates pipeline status after LIVE tracking sync", async () => {
    process.env.LIVE_CJ_FULFILLMENT_ENABLED = "true";

    const pipeline = await buildReadyPipeline();
    const prepared = prepareLiveCjFulfillment({ pipelineId: pipeline.pipelineId });

    applyFounderApproval({
      fulfillmentId: prepared.fulfillmentId,
      approvalToken: "founder-track-m105",
      approvedBy: "founder@empireai.com",
      approvedAt: new Date().toISOString(),
    });

    const submitted = await executeLiveCjSubmit(prepared.fulfillmentId);
    const inTransit = await syncLiveCjTracking(submitted.fulfillmentId);

    assert.equal(inTransit.status, "IN_TRANSIT");
    assert.ok(inTransit.lastTrackingSyncAt);
  });

  it("lists LIVE CJ fulfillment jobs via Brain tool", async () => {
    const listed = (await invokeTool("live_cj_fulfillment.list", {
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
    })) as { fulfillments: Array<{ fulfillmentId: string }> };

    assert.ok(Array.isArray(listed.fulfillments));
  });
});
