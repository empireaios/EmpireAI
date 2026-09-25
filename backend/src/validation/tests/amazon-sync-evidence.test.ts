import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { amazonUsSpApiAdapter } from "../../orchestration/reality-integration/live-commerce/adapters/amazon-sp-api-adapter.js";
import { setHttpTransportOverride, resetHttpTransportOverride } from "../../orchestration/reality-integration/live-commerce/http-transport.js";
import { getLiveCommerceRepository, resetLiveCommerceRepository } from "../../orchestration/reality-integration/live-commerce/repositories/sqlite-live-commerce-repository.js";
import { assessLiveCommerceGoLive } from "../../orchestration/reality-integration/live-commerce/services/live-commerce-integration-service.js";
import { resetDatabaseInstance } from "../../brain/database.js";

afterEach(() => { resetHttpTransportOverride(); resetLiveCommerceRepository(); resetDatabaseInstance(); });

test("Amazon production syncs never invent processed orders, inventory, prices or catalog records", async () => {
  let calls = 0;
  setHttpTransportOverride(async () => {
    calls++;
    throw new Error("The incomplete SP-API endpoints must not be contacted");
  });
  const ctx = { workspaceId: "ws-amazon-sync", providerId: "amazon-us",
    credentials: { accessToken: "synthetic" }, mode: "production" as const };
  for (const [name, operation] of [
    ["catalog", amazonUsSpApiAdapter.syncCatalog],
    ["inventory", amazonUsSpApiAdapter.syncInventory],
    ["pricing", amazonUsSpApiAdapter.syncPricing],
    ["orders", amazonUsSpApiAdapter.syncOrders],
  ] as const) {
    await assert.rejects(operation(ctx), new RegExp(`AMAZON_${name.toUpperCase()}_SYNC_UNIMPLEMENTED`));
  }
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
