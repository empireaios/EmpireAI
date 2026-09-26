import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { ConnectorConnectionRepository } from "../../connectors/connection-repository.js";
import { closeDatabase, getDatabase, resetDatabaseInstance } from "../../brain/database.js";
import { amazonUsSpApiAdapter } from "../../orchestration/reality-integration/live-commerce/adapters/amazon-sp-api-adapter.js";
import { getAmazonSellerInventoryImportStatus, listCurrentAmazonSellerInventory, listImportedAmazonSellerInventory } from "../../orchestration/reality-integration/live-commerce/adapters/amazon-seller-inventory-import.js";
import { resetHttpTransportOverride, setHttpTransportOverride } from "../../orchestration/reality-integration/live-commerce/http-transport.js";
import { getCredentialVaultRepository, resetCredentialVaultRepository } from "../../orchestration/reality-integration/repositories/sqlite-credential-vault-repository.js";
import { resetConnectorRuntimeStates } from "../../orchestration/reality-integration/services/connector-runtime.js";
import { getLiveCommerceRepository, resetLiveCommerceRepository } from "../../orchestration/reality-integration/live-commerce/repositories/sqlite-live-commerce-repository.js";
import { runLiveCommerceSync } from "../../orchestration/reality-integration/live-commerce/services/live-commerce-integration-service.js";
import { continueOneAmazonSellerInventoryImport } from "../../orchestration/reality-integration/live-commerce/services/amazon-seller-inventory-continuation.js";

const priorPath = process.env.DATABASE_PATH;
const priorMode = process.env.LIVE_COMMERCE_INTEGRATION_MODE;
let directory: string | null = null;
const ctx = { workspaceId: "ws_inventory_offline", providerId: "amazon-us",
  mode: "production" as const, credentials: { sellerId: "SELLER123", accessToken: "fake-token" } };
function useDisk(): void {
  directory = mkdtempSync(join(tmpdir(), "amazon-inventory-proof-"));
  process.env.DATABASE_PATH = join(directory, "brain.db");
  resetDatabaseInstance();
}
afterEach(() => {
  resetHttpTransportOverride(); resetConnectorRuntimeStates();
  resetCredentialVaultRepository(); resetLiveCommerceRepository(); resetDatabaseInstance();
  if (directory) rmSync(directory, { recursive: true, force: true });
  directory = null;
  if (priorPath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = priorPath;
  if (priorMode === undefined) delete process.env.LIVE_COMMERCE_INTEGRATION_MODE;
  else process.env.LIVE_COMMERCE_INTEGRATION_MODE = priorMode;
});
const row = (sku: string, quantity: number, channel = "DEFAULT") => ({
  sku, summaries: [{ marketplaceId: "ATVPDKIKX0DER" }],
  fulfillmentAvailability: [{ fulfillmentChannelCode: channel, quantity }],
  offers: [{ price: { currency: "USD", amount: "1.00" } }],
});

test("seller-managed quantities survive disk restart with seller-bound cursor and no price claim", async () => {
  useDisk();
  const requests: URL[] = [];
  setHttpTransportOverride(async request => {
    const url = new URL(request.url); requests.push(url);
    assert.equal(url.pathname, "/listings/2021-08-01/items/SELLER123");
    assert.equal(url.searchParams.get("includedData"), "summaries,fulfillmentAvailability");
    assert.equal(url.searchParams.get("marketplaceIds"), "ATVPDKIKX0DER");
    assert.equal(request.headers?.["x-amz-access-token"], "fake-token");
    if (requests.length === 1) return { ok: true, status: 200, latencyMs: 0,
      json: { items: [row("SKU-A", 4)], pagination: { nextToken: "next" } } };
    assert.equal(url.searchParams.get("pageToken"), "next");
    return { ok: true, status: 200, latencyMs: 0,
      json: { items: [row("SKU-B", 0)] } };
  });
  await assert.rejects(amazonUsSpApiAdapter.syncInventory(ctx), /PAGINATION_PENDING/);
  closeDatabase();
  assert.equal(listImportedAmazonSellerInventory(ctx.workspaceId, ctx.credentials.sellerId)[0]?.sellerFulfilledQuantity, 4);
  await assert.rejects(amazonUsSpApiAdapter.syncInventory(ctx), /RATE_LIMIT_PENDING/);
  assert.equal(requests.length, 1);
  getDatabase().prepare(`UPDATE amazon_seller_inventory_gate SET next_allowed_at='2000-01-01T00:00:00Z'`).run();
  await getDatabase().requestCriticalPersist(); closeDatabase();
  const receipt = await amazonUsSpApiAdapter.syncInventory(ctx);
  assert.equal(receipt.itemsProcessed, 2);
  assert.equal(receipt.liveApiVerified, true);
  assert.equal(receipt.durableReadbackVerified, true);
  closeDatabase();
  const saved = listImportedAmazonSellerInventory(ctx.workspaceId, ctx.credentials.sellerId);
  assert.deepEqual(saved.map(s => s.sellerFulfilledQuantity), [4, 0]);
  assert.doesNotMatch(JSON.stringify(saved), /offers|1\.00|fake-token|next/);
  await assert.rejects(amazonUsSpApiAdapter.syncInventory({ ...ctx,
    credentials: { ...ctx.credentials, sellerId: "OTHER" } }), /seller binding changed/);
});

test("FBA-only, absent and malformed seller inventory do not create usable stock receipts", async () => {
  useDisk();
  let calls = 0;
  setHttpTransportOverride(async () => { calls++; return { ok: true, status: 200, latencyMs: 0,
    json: { items: [row("SKU-A", 1000, "AMAZON_NA")] } }; });
  await assert.rejects(amazonUsSpApiAdapter.syncInventory({ ...ctx,
    credentials: { accessToken: "fake-token" } }), /seller ID and access token required/);
  assert.equal(calls, 0);
  await assert.rejects(amazonUsSpApiAdapter.syncInventory(ctx), /seller-fulfilled inventory absent/);
  assert.equal(listImportedAmazonSellerInventory(ctx.workspaceId, ctx.credentials.sellerId).length, 0);
  getDatabase().prepare(`UPDATE amazon_seller_inventory_gate SET next_allowed_at='2000-01-01T00:00:00Z'`).run();
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0,
    json: { items: [{ sku: "SKU-B", summaries: [{ marketplaceId: "ATVPDKIKX0DER" }] }] } }));
  await assert.rejects(amazonUsSpApiAdapter.syncInventory(ctx), /availability missing/);
  assert.equal(listImportedAmazonSellerInventory(ctx.workspaceId, ctx.credentials.sellerId).length, 0);
});

test("a partial seller inventory sync is queued without granting full-cycle inventory proof", async () => {
  useDisk(); process.env.LIVE_COMMERCE_INTEGRATION_MODE = "production";
  const vault = getCredentialVaultRepository().storeCredential({
    workspaceId: ctx.workspaceId, providerId: ctx.providerId,
    credentialType: "oauth", secretPayload: ctx.credentials,
  });
  new ConnectorConnectionRepository().upsert({ workspaceId: ctx.workspaceId,
    connectorId: ctx.providerId, category: "commerce", status: "connected",
    credentialsRef: vault.credentialsRef });
  await getDatabase().requestCriticalPersist(); closeDatabase(); resetConnectorRuntimeStates();
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0,
    json: { items: [row("SKU-A", 5)], pagination: { nextToken: "more" } } }));
  const job = await runLiveCommerceSync({ workspaceId: ctx.workspaceId,
    providerId: ctx.providerId, syncType: "inventory" });
  assert.equal(job.status, "queued");
  assert.equal(job.durableReadbackVerified, false);
  assert.equal(getLiveCommerceRepository().listPendingRecoveries(ctx.workspaceId).length, 0);
  closeDatabase();
  assert.equal(listImportedAmazonSellerInventory(ctx.workspaceId, ctx.credentials.sellerId)[0]?.sellerFulfilledQuantity, 5);
  const status = getAmazonSellerInventoryImportStatus(ctx.workspaceId);
  assert.equal(status?.pagesPending, true);
  assert.doesNotMatch(JSON.stringify(status), /more|fake-token/);
  assert.equal(await continueOneAmazonSellerInventoryImport(), "waiting");
  getDatabase().prepare(`UPDATE amazon_seller_inventory_gate SET next_allowed_at='2000-01-01T00:00:00Z'`).run();
  await getDatabase().requestCriticalPersist(); closeDatabase();
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0, json: { items: [] } }));
  assert.equal(await continueOneAmazonSellerInventoryImport(), "completed");
  closeDatabase();
  assert.equal(getAmazonSellerInventoryImportStatus(ctx.workspaceId)?.status, "completed");
  getDatabase().prepare(`UPDATE amazon_seller_inventory_gate SET next_allowed_at='2000-01-01T00:00:00Z'`).run();
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0,
    json: { items: [row("SKU-NEW", 2)] } }));
  assert.equal((await amazonUsSpApiAdapter.syncInventory(ctx)).itemsProcessed, 1);
  closeDatabase();
  assert.deepEqual(listCurrentAmazonSellerInventory(ctx.workspaceId).map(item => item.sku), ["SKU-NEW"]);
});

test("inventory continuation pauses after a provider failure and retains prior saved stock", async () => {
  useDisk(); process.env.LIVE_COMMERCE_INTEGRATION_MODE = "production";
  const vault = getCredentialVaultRepository().storeCredential({
    workspaceId: ctx.workspaceId, providerId: ctx.providerId,
    credentialType: "oauth", secretPayload: ctx.credentials,
  });
  new ConnectorConnectionRepository().upsert({ workspaceId: ctx.workspaceId,
    connectorId: ctx.providerId, category: "commerce", status: "connected",
    credentialsRef: vault.credentialsRef });
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0,
    json: { items: [row("SKU-A", 5)], pagination: { nextToken: "more" } } }));
  assert.equal((await runLiveCommerceSync({ workspaceId: ctx.workspaceId,
    providerId: ctx.providerId, syncType: "inventory" })).status, "queued");
  getDatabase().prepare(`UPDATE amazon_seller_inventory_gate SET next_allowed_at='2000-01-01T00:00:00Z'`).run();
  await getDatabase().requestCriticalPersist(); closeDatabase(); resetConnectorRuntimeStates();
  setHttpTransportOverride(async () => ({ ok: false, status: 403, latencyMs: 0, json: null }));
  assert.equal(await continueOneAmazonSellerInventoryImport(), "paused");
  closeDatabase();
  assert.equal(getAmazonSellerInventoryImportStatus(ctx.workspaceId)?.status, "paused");
  assert.equal(await continueOneAmazonSellerInventoryImport(), "idle");
  assert.equal(listImportedAmazonSellerInventory(ctx.workspaceId, ctx.credentials.sellerId)[0]?.sellerFulfilledQuantity, 5);
});
