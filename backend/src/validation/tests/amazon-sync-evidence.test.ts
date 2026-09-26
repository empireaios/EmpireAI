import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, test } from "node:test";
import { amazonUsSpApiAdapter } from "../../orchestration/reality-integration/live-commerce/adapters/amazon-sp-api-adapter.js";
import { setHttpTransportOverride, resetHttpTransportOverride } from "../../orchestration/reality-integration/live-commerce/http-transport.js";
import { getLiveCommerceRepository, resetLiveCommerceRepository } from "../../orchestration/reality-integration/live-commerce/repositories/sqlite-live-commerce-repository.js";
import { assessLiveCommerceGoLive, processLiveCommerceWebhook } from "../../orchestration/reality-integration/live-commerce/services/live-commerce-integration-service.js";
import { resetDatabaseInstance } from "../../brain/database.js";

afterEach(() => { resetHttpTransportOverride(); resetLiveCommerceRepository(); resetDatabaseInstance(); });

test("unsupported pricing and missing inventory/listing/order credentials never invent processed records", async () => {
  let calls = 0;
  setHttpTransportOverride(async () => {
    calls++;
    throw new Error("The incomplete SP-API endpoints must not be contacted");
  });
  const ctx = { workspaceId: "ws-amazon-sync", providerId: "amazon-us",
    credentials: { accessToken: "synthetic" }, mode: "production" as const };
  await assert.rejects(amazonUsSpApiAdapter.syncCatalog(ctx), /seller ID and access token required/);
  await assert.rejects(amazonUsSpApiAdapter.syncInventory(ctx), /seller ID and access token required/);
  for (const [name, operation] of [
    ["pricing", amazonUsSpApiAdapter.syncPricing],
  ] as const) {
    await assert.rejects(operation(ctx), new RegExp(`AMAZON_${name.toUpperCase()}_SYNC_UNIMPLEMENTED`));
  }
  await assert.rejects(amazonUsSpApiAdapter.syncOrders({
    ...ctx, credentials: {},
  }), /access token required/);
  assert.equal(calls, 0);
  const sandbox = await amazonUsSpApiAdapter.syncOrders({ ...ctx, mode: "sandbox" });
  assert.equal(sandbox.liveApiVerified, false);
  assert.equal(sandbox.itemsProcessed, 4); // Explicit fixture, zero production credit.
});

test("historic completed fixture jobs cannot unlock production commerce readiness", () => {
  const prior = process.env.DATABASE_PATH;
  process.env.DATABASE_PATH = ":memory:amazon-sync-evidence";
  try {
    resetDatabaseInstance();
    const repo = getLiveCommerceRepository();
    for (const type of ["catalog", "inventory", "pricing", "orders"] as const) {
      repo.saveSyncJob({ jobId: `legacy-${type}`, workspaceId: "ws-amazon-sync",
        providerId: "amazon-us", syncType: type, status: "completed",
        itemsProcessed: 10, itemsFailed: 0, errorMessage: null, mode: "production",
        startedAt: new Date().toISOString(), completedAt: new Date().toISOString() });
    }
    const assessment = assessLiveCommerceGoLive("ws-amazon-sync");
    assert.equal(assessment.goLiveEligible, false);
    assert.ok(assessment.blockers.some(b => b.includes("Full verified Amazon US sync cycle incomplete")));
  } finally {
    resetLiveCommerceRepository();
    resetDatabaseInstance();
    if (prior === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = prior;
  }
});

test("production Amazon notifications cannot be manufactured with caller-supplied HMAC secrets", () => {
  const priorMode = process.env.LIVE_COMMERCE_INTEGRATION_MODE;
  const priorPath = process.env.DATABASE_PATH;
  process.env.LIVE_COMMERCE_INTEGRATION_MODE = "production";
  process.env.DATABASE_PATH = ":memory:amazon-notifications";
  try {
    resetDatabaseInstance();
    const payload = JSON.stringify({ orderId: "invented" });
    const secret = "synthetic-secret";
    const signature = createHmac("sha256", secret).update(payload).digest("hex");
    assert.equal(amazonUsSpApiAdapter.verifyWebhookSignature(payload, signature, secret), false);
    const result = processLiveCommerceWebhook({
      workspaceId: "ws-amazon-sync", providerId: "amazon-us", topic: "ORDER_CHANGE",
      payload, secret, signature,
    });
    assert.equal(result.status, "dead_letter");
    assert.equal(result.signatureValid, false);
    assert.equal(result.processedAt, null);
    const pending = getLiveCommerceRepository().listPendingRecoveries("ws-amazon-sync");
    assert.equal(pending.length, 1);
    const recovery = pending[0];
    assert.ok(recovery);
    assert.match(recovery.errorMessage, /verified SQS\/EventBridge transport/);
  } finally {
    resetLiveCommerceRepository();
    resetDatabaseInstance();
    if (priorMode === undefined) delete process.env.LIVE_COMMERCE_INTEGRATION_MODE;
    else process.env.LIVE_COMMERCE_INTEGRATION_MODE = priorMode;
    if (priorPath === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = priorPath;
  }
});
