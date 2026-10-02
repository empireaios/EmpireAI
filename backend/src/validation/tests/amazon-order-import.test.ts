import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { ConnectorConnectionRepository } from "../../connectors/connection-repository.js";
import { closeDatabase, getDatabase, resetDatabaseInstance } from "../../brain/database.js";
import { amazonUsSpApiAdapter } from "../../orchestration/reality-integration/live-commerce/adapters/amazon-sp-api-adapter.js";
import { getAmazonOrderImportStatus, listImportedAmazonOrders } from "../../orchestration/reality-integration/live-commerce/adapters/amazon-order-import.js";
import { httpTransport, resetHttpTransportOverride, setHttpTransportOverride } from "../../orchestration/reality-integration/live-commerce/http-transport.js";
import { continueOneAmazonOrderImport } from "../../orchestration/reality-integration/live-commerce/services/amazon-order-continuation.js";
import { getCredentialVaultRepository, resetCredentialVaultRepository } from "../../orchestration/reality-integration/repositories/sqlite-credential-vault-repository.js";
import { resetConnectorRuntimeStates } from "../../orchestration/reality-integration/services/connector-runtime.js";
import { getLiveCommerceRepository, resetLiveCommerceRepository } from "../../orchestration/reality-integration/live-commerce/repositories/sqlite-live-commerce-repository.js";
import { runLiveCommerceSync } from "../../orchestration/reality-integration/live-commerce/services/live-commerce-integration-service.js";

const oldPath = process.env.DATABASE_PATH;
const oldMode = process.env.LIVE_COMMERCE_INTEGRATION_MODE;
let directory: string | null = null;
const ctx = {
  workspaceId: "ws_order_import_proof", providerId: "amazon-us",
  mode: "production" as const, credentials: { accessToken: "offline-fake-access" },
};
function order(status: string, marketplaceId = "ATVPDKIKX0DER") {
  return {
    orderId: "111-2222222-3333333",
    salesChannel: { marketplaceId },
    createdTime: "2026-09-20T00:00:00Z",
    lastUpdatedTime: status === "SHIPPED" ? "2026-09-22T00:00:00Z" : "2026-09-21T00:00:00Z",
    fulfillment: { fulfillmentStatus: status, fulfilledBy: "MERCHANT" },
    orderItems: [{
      orderItemId: "item-1", quantityOrdered: 2,
      product: { sellerSku: "SKU-1" },
    }],
    proceeds: { grandTotal: { amount: "32.15", currencyCode: "USD" } },
    buyer: { buyerEmail: "must-never-be-persisted@example.test" },
  };
}
function useDiskDatabase() {
  directory = mkdtempSync(join(tmpdir(), "amazon-orders-proof-"));
  process.env.DATABASE_PATH = join(directory, "brain.db");
  resetDatabaseInstance();
}

afterEach(() => {
  resetHttpTransportOverride();
  resetConnectorRuntimeStates();
  resetCredentialVaultRepository();
  resetLiveCommerceRepository();
  resetDatabaseInstance();
  if (directory) rmSync(directory, { recursive: true, force: true });
  directory = null;
  if (oldPath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = oldPath;
  if (oldMode === undefined) delete process.env.LIVE_COMMERCE_INTEGRATION_MODE;
  else process.env.LIVE_COMMERCE_INTEGRATION_MODE = oldMode;
});

test("Amazon US imports a real-form page, preserves cursor across restart and only finishes after final page", async () => {
  useDiskDatabase();
  const requests: URL[] = [];
  setHttpTransportOverride(async request => {
    const url = new URL(request.url);
    requests.push(url);
    assert.equal(request.method, "GET");
    assert.equal(url.origin, "https://sellingpartnerapi-na.amazon.com");
    assert.equal(url.pathname, "/orders/2026-01-01/orders");
    assert.equal(url.searchParams.get("marketplaceIds"), "ATVPDKIKX0DER");
    assert.equal(url.searchParams.get("maxResultsPerPage"), "100");
    assert.equal(request.headers?.["x-amz-access-token"], "offline-fake-access");
    if (requests.length === 1) {
      assert.equal(url.searchParams.has("paginationToken"), false);
      return { status: 200, ok: true, json: {
        orders: [order("UNSHIPPED")], pagination: { nextToken: "next-page" },
      }, latencyMs: 1 };
    }
    assert.equal(url.searchParams.get("paginationToken"), "next-page");
    const firstRequest = requests[0];
    assert.ok(firstRequest);
    assert.equal(url.searchParams.get("lastUpdatedAfter"),
      firstRequest.searchParams.get("lastUpdatedAfter"));
    assert.equal(url.searchParams.get("lastUpdatedBefore"),
      firstRequest.searchParams.get("lastUpdatedBefore"));
    return { status: 200, ok: true, json: {
      orders: [order("SHIPPED")],
    }, latencyMs: 1 };
  });

  await assert.rejects(amazonUsSpApiAdapter.syncOrders(ctx), /PAGINATION_PENDING/);
  assert.equal(listImportedAmazonOrders(ctx.workspaceId).length, 1);
  closeDatabase(); // Reopen actual saved disk bytes, not the in-memory rows.
  await assert.rejects(amazonUsSpApiAdapter.syncOrders(ctx), /RATE_LIMIT_PENDING/);
  assert.equal(requests.length, 1); // Restart cannot evade a durable reservation.
  getDatabase().prepare(`
    UPDATE amazon_order_request_gate SET next_allowed_at = @past
    WHERE workspace_id = @workspaceId AND provider_id = @providerId
  `).run({ past: "2000-01-01T00:00:00Z", workspaceId: ctx.workspaceId, providerId: ctx.providerId });
  await getDatabase().requestCriticalPersist();
  closeDatabase();
  const receipt = await amazonUsSpApiAdapter.syncOrders(ctx);
  assert.equal(receipt.liveApiVerified, true);
  assert.equal(receipt.durableReadbackVerified, true);
  assert.equal(receipt.itemsProcessed, 2);
  assert.equal(requests.length, 2);
  closeDatabase();
  const imported = listImportedAmazonOrders(ctx.workspaceId);
  assert.equal(imported.length, 1); // Idempotent upsert of the same provider ID.
  const importedOrder = imported[0];
  assert.ok(importedOrder);
  assert.equal(importedOrder.fulfillmentStatus, "SHIPPED");
  assert.equal(importedOrder.grandTotalCents, 3215);
  assert.equal(importedOrder.orderItems[0]?.sellerSku, "SKU-1");
  assert.doesNotMatch(JSON.stringify(imported), /must-never-be-persisted/);
});

test("malformed or foreign-marketplace pages cannot be counted or persisted", async () => {
  process.env.DATABASE_PATH = ":memory:amazon-order-rejection";
  resetDatabaseInstance();
  let calls = 0;
  setHttpTransportOverride(async () => {
    calls++;
    return { status: 200, ok: true, json: {
      orders: [order("UNSHIPPED", "A19VAU5U5O7RUS")],
    }, latencyMs: 1 };
  });
  await assert.rejects(amazonUsSpApiAdapter.syncOrders(ctx), /marketplace or timestamps invalid/);
  assert.equal(calls, 1);
  assert.equal(listImportedAmazonOrders(ctx.workspaceId).length, 0);
});

test("Amazon HTTP calls enforce bounded provider response size without storing response data", async () => {
  resetHttpTransportOverride();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response("12345", { status: 200 })) as typeof fetch;
  try {
    await assert.rejects(httpTransport({
      url: "https://sellingpartnerapi-na.amazon.com/orders/2026-01-01/orders",
      method: "GET", timeoutMs: 1000, maxResponseBytes: 4,
    }), /response exceeds byte limit/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("saved partial Amazon cursor pauses unattended work on missing credential and exposes no token", async () => {
  useDiskDatabase();
  process.env.LIVE_COMMERCE_INTEGRATION_MODE = "production";
  let providerRequests = 0;
  setHttpTransportOverride(async () => {
    providerRequests++;
    return { status: 200, ok: true, json: {
      orders: [order("UNSHIPPED")], pagination: { nextToken: "private-page-token" },
    }, latencyMs: 1 };
  });
  await assert.rejects(amazonUsSpApiAdapter.syncOrders(ctx), /PAGINATION_PENDING/);
  assert.equal(getAmazonOrderImportStatus(ctx.workspaceId)?.status, "pending");
  closeDatabase();
  assert.equal(await continueOneAmazonOrderImport(), "waiting");
  getDatabase().prepare(`
    UPDATE amazon_order_request_gate SET next_allowed_at = @past
    WHERE workspace_id = @workspaceId AND provider_id = 'amazon-us'
  `).run({ past: "2000-01-01T00:00:00Z", workspaceId: ctx.workspaceId });
  await getDatabase().requestCriticalPersist();
  closeDatabase();
  assert.equal(await continueOneAmazonOrderImport(), "paused");
  assert.equal(providerRequests, 1); // Missing vault credential; no second provider call.
  closeDatabase();
  const state = getAmazonOrderImportStatus(ctx.workspaceId);
  assert.equal(state?.status, "paused");
  assert.equal(state?.reason, "PROVIDER_FAILURE");
  assert.doesNotMatch(JSON.stringify(state), /private-page-token/);
  assert.equal(await continueOneAmazonOrderImport(), "idle");
});

test("worker restart resumes owner-started order cursor using only a durable scoped vault reference", async () => {
  useDiskDatabase();
  process.env.LIVE_COMMERCE_INTEGRATION_MODE = "production";
  const vault = getCredentialVaultRepository().storeCredential({
    workspaceId: ctx.workspaceId, providerId: "amazon-us",
    credentialType: "oauth", secretPayload: { accessToken: "offline-restart-token" },
  });
  new ConnectorConnectionRepository().upsert({
    workspaceId: ctx.workspaceId, connectorId: "amazon-us",
    category: "commerce", status: "connected", credentialsRef: vault.credentialsRef,
  });
  await getDatabase().requestCriticalPersist();
  closeDatabase();
  resetConnectorRuntimeStates();
  const requests: URL[] = [];
  setHttpTransportOverride(async request => {
    assert.equal(request.headers?.["x-amz-access-token"], "offline-restart-token");
    requests.push(new URL(request.url));
    return { status: 200, ok: true, json: requests.length === 1
      ? { orders: [order("UNSHIPPED")], pagination: { nextToken: "restart-page" } }
      : { orders: [order("SHIPPED")] }, latencyMs: 1 };
  });
  const first = await runLiveCommerceSync({
    workspaceId: ctx.workspaceId, providerId: "amazon-us", syncType: "orders",
  });
  assert.equal(first.status, "queued"); // Partial is normal progress, not a failed import.
  assert.equal(getLiveCommerceRepository().listPendingRecoveries(ctx.workspaceId).length, 0);
  closeDatabase();
  resetConnectorRuntimeStates();
  assert.equal(await continueOneAmazonOrderImport(), "waiting");
  getDatabase().prepare(`
    UPDATE amazon_order_request_gate SET next_allowed_at = @past
    WHERE workspace_id = @workspaceId AND provider_id = 'amazon-us'
  `).run({ past: "2000-01-01T00:00:00Z", workspaceId: ctx.workspaceId });
  await getDatabase().requestCriticalPersist();
  closeDatabase();
  assert.equal(await continueOneAmazonOrderImport(), "completed");
  assert.equal(requests.length, 2);
  closeDatabase();
  assert.equal(getAmazonOrderImportStatus(ctx.workspaceId)?.status, "completed");
  assert.equal(listImportedAmazonOrders(ctx.workspaceId)[0]?.fulfillmentStatus, "SHIPPED");
});
