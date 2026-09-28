import assert from "node:assert/strict";
import { test } from "node:test";
import { CjApiClient } from "../../suppliers/cj-dropshipping/cj-api-client.js";
import type { CjConfig } from "../../suppliers/cj-dropshipping/cj-config.js";

const config: CjConfig = {
  apiBaseUrl: "https://cj.invalid/api2.0/v1", apiKey: "offline",
  apiSecret: null, integrationMode: "LIVE", requestTimeoutMs: 50,
  maxRetries: 3, rateLimitPerMinute: 100,
};

test("point-charged CJ response body is bounded and cannot retry an oversized payload", async () => {
  let requests = 0;
  let reservations = 0;
  const client = new CjApiClient(config, async () => {
    requests++;
    return new Response(new Uint8Array(4 * 1024 * 1024 + 1), { status: 200 });
  }, async () => { reservations++; });
  await assert.rejects(client.request({ path: "/product/list", authenticated: false }),
    /CJ response exceeds bounded size/);
  assert.equal(requests, 1);
  assert.equal(reservations, 1);
});

test("point-charged CJ timeout covers a body stalled after headers", async () => {
  let requests = 0;
  let reservations = 0;
  const client = new CjApiClient(config, async (_input, init) => {
    requests++;
    return new Response(new ReadableStream({
      start(controller) {
        init?.signal?.addEventListener("abort", () =>
          controller.error(new DOMException("timed out", "AbortError")), { once: true });
      },
    }), { status: 200 });
  }, async () => { reservations++; });
  await assert.rejects(client.request({ path: "/product/list", authenticated: false }),
    /CJ API request timed out/);
  assert.equal(requests, 1);
  assert.equal(reservations, 1);
});
