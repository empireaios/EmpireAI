import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { ConnectorConnectionRepository } from "../../connectors/connection-repository.js";
import { closeDatabase, getDatabase, resetDatabaseInstance } from "../../brain/database.js";
import { amazonUsSpApiAdapter } from "../../orchestration/reality-integration/live-commerce/adapters/amazon-sp-api-adapter.js";
import { getAmazonUsListingsImportStatus, listCurrentAmazonUsListings, listImportedAmazonUsListings } from "../../orchestration/reality-integration/live-commerce/adapters/amazon-listings-import.js";
import { resetHttpTransportOverride, setHttpTransportOverride } from "../../orchestration/reality-integration/live-commerce/http-transport.js";
import { getCredentialVaultRepository, resetCredentialVaultRepository } from "../../orchestration/reality-integration/repositories/sqlite-credential-vault-repository.js";
import { resetConnectorRuntimeStates } from "../../orchestration/reality-integration/services/connector-runtime.js";
import { getLiveCommerceRepository, resetLiveCommerceRepository } from "../../orchestration/reality-integration/live-commerce/repositories/sqlite-live-commerce-repository.js";
import { runLiveCommerceSync } from "../../orchestration/reality-integration/live-commerce/services/live-commerce-integration-service.js";
import { continueOneAmazonUsListingsImport } from "../../orchestration/reality-integration/live-commerce/services/amazon-listings-continuation.js";

const priorPath = process.env.DATABASE_PATH;
const priorMode = process.env.LIVE_COMMERCE_INTEGRATION_MODE;
let directory: string | null = null;
const ctx = { workspaceId: "ws_offline_listing", providerId: "amazon-us",
  mode: "production" as const, credentials: { sellerId: "SELLER123", accessToken: "fake-token" } };
function useDisk(): void {
  directory = mkdtempSync(join(tmpdir(), "amazon-listings-proof-"));
  process.env.DATABASE_PATH = join(directory, "brain.db");
  resetDatabaseInstance();
}
afterEach(() => {
  resetHttpTransportOverride();
  resetConnectorRuntimeStates(); resetCredentialVaultRepository(); resetLiveCommerceRepository();
  resetDatabaseInstance();
  if (directory) rmSync(directory, { recursive: true, force: true });
  directory = null;
  if (priorPath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = priorPath;
  if (priorMode === undefined) delete process.env.LIVE_COMMERCE_INTEGRATION_MODE;
  else process.env.LIVE_COMMERCE_INTEGRATION_MODE = priorMode;
});
const row = (sku: string) => ({ sku, summaries: [{ marketplaceId: "ATVPDKIKX0DER",
  asin: "B123456789", itemName: `Listing ${sku}`, status: ["BUYABLE"],
  lastUpdatedDate: "2026-09-25T00:00:00Z" }],
  offers: [{ marketplaceId: "ATVPDKIKX0DER", offerType: "B2C",
    price: { amount: "9.99", currency: "USD" } }],
  fulfillmentAvailability: [{ quantity: 1234 }] });

test("Amazon US listing pages use seller binding, persist across process restart and complete only after final page", async () => {
  useDisk();
  const requests: URL[] = [];
  setHttpTransportOverride(async request => {
    const url = new URL(request.url);
    requests.push(url);
    assert.equal(url.origin, "https://sellingpartnerapi-na.amazon.com");
    assert.equal(url.pathname, "/listings/2021-08-01/items/SELLER123");
    assert.equal(url.searchParams.get("marketplaceIds"), "ATVPDKIKX0DER");
    assert.equal(url.searchParams.get("includedData"), "summaries,offers");
    assert.equal(url.searchParams.get("pageSize"), "20");
    assert.equal(request.headers?.["x-amz-access-token"], "fake-token");
    if (requests.length === 1) {
      assert.equal(url.searchParams.has("pageToken"), false);
      return { ok: true, status: 200, latencyMs: 0, json: {
        items: [row("SKU-1")], pagination: { nextToken: "next-page" },
      } };
    }
    assert.equal(url.searchParams.get("pageToken"), "next-page");
    return { ok: true, status: 200, latencyMs: 0, json: { items: [row("SKU-2")] } };
  });
  await assert.rejects(amazonUsSpApiAdapter.syncCatalog(ctx), /PAGINATION_PENDING/);
  closeDatabase();
  assert.equal(listImportedAmazonUsListings(ctx.workspaceId, ctx.credentials.sellerId).length, 1);
  await assert.rejects(amazonUsSpApiAdapter.syncCatalog(ctx), /RATE_LIMIT_PENDING/);
  assert.equal(requests.length, 1);
  getDatabase().prepare(`UPDATE amazon_listing_import_gate SET next_allowed_at='2000-01-01T00:00:00Z'`).run();
  await getDatabase().requestCriticalPersist();
  closeDatabase();
  const complete = await amazonUsSpApiAdapter.syncCatalog(ctx);
  assert.equal(complete.liveApiVerified, true);
  assert.equal(complete.durableReadbackVerified, true);
  assert.equal(complete.itemsProcessed, 2);
  closeDatabase();
  const saved = listImportedAmazonUsListings(ctx.workspaceId, ctx.credentials.sellerId);
  assert.deepEqual(saved.map(item => item.sku), ["SKU-1", "SKU-2"]);
  assert.deepEqual(saved.map(item => [item.sellerOfferPriceCents, item.sellerOfferCurrency]),
    [[999, "USD"], [999, "USD"]]);
  assert.doesNotMatch(JSON.stringify(saved), /quantity|9\.99|offers/);
  assert.equal(requests.length, 2);
  await assert.rejects(amazonUsSpApiAdapter.syncCatalog({ ...ctx,
    credentials: { ...ctx.credentials, sellerId: "OTHERSELLER" } }), /seller binding changed/);
});

test("seller B2C USD offer is current-cycle read-only price evidence, never supplier cost", async () => {
  useDisk();
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0, json: { items: [
    { ...row("PRICE"), offers: [
      { marketplaceId: "OTHER", offerType: "B2C", price: { currency: "USD", amount: "1.00" } },
      { marketplaceId: "ATVPDKIKX0DER", offerType: "B2B", price: { currency: "USD", amount: "2.00" } },
      { marketplaceId: "ATVPDKIKX0DER", offerType: "B2C", price: { currency: "USD", amount: "30.0" } },
    ] },
    { ...row("NO-PRICE"), offers: [{ marketplaceId: "ATVPDKIKX0DER", offerType: "B2B",
      price: { currency: "USD", amount: "3.00" } }] },
  ] } }));
  assert.equal((await amazonUsSpApiAdapter.syncCatalog(ctx)).itemsProcessed, 2);
  closeDatabase();
  const current = listCurrentAmazonUsListings(ctx.workspaceId);
  assert.deepEqual(current.map(item => [item.sku, item.sellerOfferPriceCents, item.sellerOfferCurrency]),
    [["NO-PRICE", null, null], ["PRICE", 3000, "USD"]]);
  assert.doesNotMatch(JSON.stringify(current), /supplierCost|margin|30\.0/);
  const old = { ...current[1] } as Record<string, unknown>;
  delete old.sellerOfferPriceCents; delete old.sellerOfferCurrency;
  getDatabase().prepare(`UPDATE amazon_listing_import_rows SET record_json=@record
    WHERE sku='PRICE'`).run({ record: JSON.stringify(old) });
  assert.deepEqual(listCurrentAmazonUsListings(ctx.workspaceId).find(item => item.sku === "PRICE")
    ?.sellerOfferPriceCents, null);
});

test("ambiguous, unsupported, zero and malformed seller offers cannot create a price receipt", async () => {
  useDisk();
  let variant: unknown = null;
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0,
    json: { items: [{ ...row("BAD"), offers: variant }] } }));
  const offer = (currency: string, amount: string) => ({ marketplaceId: "ATVPDKIKX0DER",
    offerType: "B2C", price: { currency, amount } });
  for (const [offers, error] of [
    [[offer("USD", "9.99"), offer("USD", "8.99")], /ambiguous/],
    [[offer("EUR", "9.99")], /USD price invalid/],
    [[offer("USD", "0.00")], /USD price invalid/],
    [[offer("USD", "9.999")], /USD price invalid/],
    [{ amount: "9.99" }, /offers malformed/],
  ] as Array<[unknown, RegExp]>) {
    variant = offers;
    await assert.rejects(amazonUsSpApiAdapter.syncCatalog(ctx), error);
    assert.deepEqual(listImportedAmazonUsListings(ctx.workspaceId, ctx.credentials.sellerId), []);
    assert.equal(getDatabase().prepare("SELECT COUNT(*) AS n FROM amazon_listing_import_cursor").get()?.n, 0);
    getDatabase().prepare(`UPDATE amazon_listing_import_gate SET next_allowed_at='2000-01-01T00:00:00Z'`).run();
  }
});

test("malformed listing response, missing seller binding and HTTP failure never claim catalog proof", async () => {
  useDisk();
  let calls = 0;
  setHttpTransportOverride(async () => { calls++; return { ok: true, status: 200, latencyMs: 0,
    json: { items: [row("SKU-1"), { sku: "OTHER", summaries: [{ marketplaceId: "wrong" }] }] } }; });
  await assert.rejects(amazonUsSpApiAdapter.syncCatalog({ ...ctx,
    credentials: { accessToken: "fake-token" } }), /seller ID and access token required/);
  assert.equal(calls, 0);
  await assert.rejects(amazonUsSpApiAdapter.syncCatalog(ctx), /marketplace summary ambiguous/);
  assert.equal(listImportedAmazonUsListings(ctx.workspaceId, ctx.credentials.sellerId).length, 0);
  assert.equal(getDatabase().prepare("SELECT COUNT(*) AS n FROM amazon_listing_import_cursor").get()?.n, 0);
  getDatabase().prepare(`UPDATE amazon_listing_import_gate SET next_allowed_at='2000-01-01T00:00:00Z'`).run();
  setHttpTransportOverride(async () => ({ ok: false, status: 403, latencyMs: 0, json: null }));
  await assert.rejects(amazonUsSpApiAdapter.syncCatalog(ctx), /HTTP 403/);
  assert.equal(listImportedAmazonUsListings(ctx.workspaceId, ctx.credentials.sellerId).length, 0);
});

test("owner-started partial listing page queues normal continuation without a recovery failure", async () => {
  useDisk();
  process.env.LIVE_COMMERCE_INTEGRATION_MODE = "production";
  const vault = getCredentialVaultRepository().storeCredential({
    workspaceId: ctx.workspaceId, providerId: ctx.providerId,
    credentialType: "oauth", secretPayload: ctx.credentials,
  });
  new ConnectorConnectionRepository().upsert({
    workspaceId: ctx.workspaceId, connectorId: ctx.providerId,
    category: "commerce", status: "connected", credentialsRef: vault.credentialsRef,
  });
  await getDatabase().requestCriticalPersist();
  closeDatabase();
  resetConnectorRuntimeStates();
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0,
    json: { items: [row("SKU-1")], pagination: { nextToken: "more" } } }));
  const job = await runLiveCommerceSync({ workspaceId: ctx.workspaceId,
    providerId: ctx.providerId, syncType: "catalog" });
  assert.equal(job.status, "queued");
  assert.equal(job.durableReadbackVerified, false);
  assert.equal(getLiveCommerceRepository().listPendingRecoveries(ctx.workspaceId).length, 0);
  closeDatabase();
  assert.equal(listImportedAmazonUsListings(ctx.workspaceId, ctx.credentials.sellerId).length, 1);
  const status = getAmazonUsListingsImportStatus(ctx.workspaceId);
  assert.equal(status?.pagesPending, true);
  assert.doesNotMatch(JSON.stringify(status), /more|fake-token/);
  assert.equal(await continueOneAmazonUsListingsImport(), "waiting");
  getDatabase().prepare(`UPDATE amazon_listing_import_gate SET next_allowed_at='2000-01-01T00:00:00Z'`).run();
  await getDatabase().requestCriticalPersist();
  closeDatabase();
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0, json: { items: [] } }));
  assert.equal(await continueOneAmazonUsListingsImport(), "completed");
  closeDatabase();
  assert.equal(getAmazonUsListingsImportStatus(ctx.workspaceId)?.status, "completed");
  assert.equal(listImportedAmazonUsListings(ctx.workspaceId, ctx.credentials.sellerId).length, 1);
  getDatabase().prepare(`UPDATE amazon_listing_import_gate SET next_allowed_at='2000-01-01T00:00:00Z'`).run();
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0,
    json: { items: [row("SKU-NEW")] } }));
  assert.equal((await amazonUsSpApiAdapter.syncCatalog(ctx)).itemsProcessed, 1);
  closeDatabase();
  assert.deepEqual(listCurrentAmazonUsListings(ctx.workspaceId).map(item => item.sku), ["SKU-NEW"]);
});

test("continuation pauses an owner-started cursor after provider rejection", async () => {
  useDisk();
  process.env.LIVE_COMMERCE_INTEGRATION_MODE = "production";
  const vault = getCredentialVaultRepository().storeCredential({
    workspaceId: ctx.workspaceId, providerId: ctx.providerId,
    credentialType: "oauth", secretPayload: ctx.credentials,
  });
  new ConnectorConnectionRepository().upsert({
    workspaceId: ctx.workspaceId, connectorId: ctx.providerId,
    category: "commerce", status: "connected", credentialsRef: vault.credentialsRef,
  });
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0,
    json: { items: [row("SKU-1")], pagination: { nextToken: "more" } } }));
  assert.equal((await runLiveCommerceSync({ workspaceId: ctx.workspaceId,
    providerId: ctx.providerId, syncType: "catalog" })).status, "queued");
  getDatabase().prepare(`UPDATE amazon_listing_import_gate SET next_allowed_at='2000-01-01T00:00:00Z'`).run();
  await getDatabase().requestCriticalPersist();
  closeDatabase(); resetConnectorRuntimeStates();
  setHttpTransportOverride(async () => ({ ok: false, status: 403, latencyMs: 0, json: null }));
  assert.equal(await continueOneAmazonUsListingsImport(), "paused");
  closeDatabase();
  assert.equal(getAmazonUsListingsImportStatus(ctx.workspaceId)?.status, "paused");
  assert.equal(await continueOneAmazonUsListingsImport(), "idle");
  assert.equal(listImportedAmazonUsListings(ctx.workspaceId, ctx.credentials.sellerId).length, 1);
});
