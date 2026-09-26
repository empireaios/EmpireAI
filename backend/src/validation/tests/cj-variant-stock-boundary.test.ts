import assert from "node:assert/strict";
import { test } from "node:test";
import { cjManagedStockByVid } from "../../orchestration/pillow-commerce-presale/cj-variant-stock.js";
import { CjApiClient } from "../../suppliers/cj-dropshipping/cj-api-client.js";
import { clearCjAuthCache } from "../../suppliers/cj-dropshipping/cj-auth.js";
import type { CjConfig } from "../../suppliers/cj-dropshipping/cj-config.js";

test("one VID sums only direct CJ-managed warehouse units and never factory inventory", () => {
  const data = [
    { vid: "V1", areaId: 1, countryCode: "CN", cjInventoryNum: 2, factoryInventoryNum: 10000, totalInventoryNum: 10002, stock: [{ inventory: 2 }] },
    { vid: "V1", areaId: 2, countryCode: "US", cjInventoryNum: 3, factoryInventoryNum: 500, totalInventoryNum: 503 },
  ];
  assert.equal(cjManagedStockByVid(data, "V1"), 5);
  assert.equal(cjManagedStockByVid([{ ...data[0], cjInventoryNum: 0 }], "V1"), 0);
  assert.equal(cjManagedStockByVid([{ ...data[0], cjInventoryNum: undefined }], "V1"), 0);
  assert.equal(cjManagedStockByVid(data, "V2"), 0);
  assert.equal(cjManagedStockByVid([...data, { ...data[0], vid: "V2" }], "V1"), 0);
  assert.equal(cjManagedStockByVid([data[0], data[0]], "V1"), 0);
  assert.equal(cjManagedStockByVid([{ ...data[0], cjInventoryNum: 1.5 }], "V1"), 0);
  assert.equal(cjManagedStockByVid([{ ...data[0], countryCode: undefined }], "V1"), 0);
});

test("a stock lookup never retries and spends at most one queryByVid call on provider failure", async () => {
  clearCjAuthCache();
  let stockCalls = 0;
  const config: CjConfig = {
    apiBaseUrl: "https://cj.invalid/api2.0/v1", apiKey: "offline-key", apiSecret: null,
    integrationMode: "LIVE", requestTimeoutMs: 500, maxRetries: 3, rateLimitPerMinute: 60,
  };
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/authentication/getAccessToken")) {
      return Response.json({ code: 200, result: true, data: {
        accessToken: "offline-token", accessTokenExpiryDate: Date.now() + 3_600_000,
      } });
    }
    stockCalls += 1;
    assert.match(url, /\/product\/stock\/queryByVid\?vid=V1$/);
    return Response.json({ code: 500, result: false, message: "provider unavailable" }, { status: 503 });
  };
  await assert.rejects(new CjApiClient(config, fetchImpl).queryStockByVid("V1"));
  assert.equal(stockCalls, 1);
  clearCjAuthCache();
});
