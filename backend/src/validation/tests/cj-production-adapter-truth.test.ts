import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cjDropshippingAdapter } from "../../orchestration/reality-integration/live-commerce/adapters/supplier-cj-adapter.js";
import { resetHttpTransportOverride, setHttpTransportOverride } from "../../orchestration/reality-integration/live-commerce/http-transport.js";

const ctx = { workspaceId: "ws_cj_offline", providerId: "cj-dropshipping",
  mode: "production" as const, credentials: { apiKey: "fixture-api-key" } };
afterEach(() => resetHttpTransportOverride());

test("CJ authentication sends API key only in JSON body and withholds production readiness", async () => {
  let calls = 0;
  setHttpTransportOverride(async request => {
    calls++;
    assert.equal(request.method, "POST");
    assert.equal(request.url, "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken");
    assert.deepEqual(request.body, { apiKey: "fixture-api-key" });
    assert.equal(request.headers?.["CJ-Access-Token"], undefined);
    assert.equal(request.timeoutMs, 15_000);
    assert.equal(request.maxResponseBytes, 64 * 1024);
    return { ok: true, status: 200, latencyMs: 0,
      json: { code: 200, result: true, data: { accessToken: "fixture-access-token",
        accessTokenExpiryDate: new Date(Date.now() + 3_600_000).toISOString() } } };
  });
  const result = await cjDropshippingAdapter.validateConnection(ctx);
  assert.equal(calls, 1);
  assert.equal(result.liveApiVerified, true);
  assert.equal(result.valid, false);
  assert.deepEqual(result.capabilities, []);
  assert.ok(result.blockers.some(x => /durable item/.test(x)));
  assert.doesNotMatch(JSON.stringify(result), /fixture-api-key|fixture-access-token/);
});

test("HTTP success without a valid CJ access token is not authentication proof", async () => {
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0,
    json: { code: 1601000, result: false, data: null } }));
  const denied = await cjDropshippingAdapter.validateConnection(ctx);
  assert.equal(denied.liveApiVerified, false); assert.equal(denied.valid, false);
  setHttpTransportOverride(async () => ({ ok: true, status: 200, latencyMs: 0,
    json: { code: 200, result: true, data: { accessToken: "short-lived",
      accessTokenExpiryDate: new Date(Date.now() + 5_000).toISOString() } } }));
  const expires = await cjDropshippingAdapter.validateConnection(ctx);
  assert.equal(expires.liveApiVerified, false); assert.equal(expires.valid, false);
});

test("CJ production syncs refuse fabricated counts without issuing provider operations", async () => {
  let calls = 0;
  setHttpTransportOverride(async () => { calls++; throw Error("Unexpected provider operation"); });
  for (const method of ["syncCatalog", "syncInventory", "syncPricing", "syncOrders"] as const) {
    await assert.rejects(cjDropshippingAdapter[method](ctx), /CJ production .*requires/);
  }
  assert.equal(calls, 0);
});
