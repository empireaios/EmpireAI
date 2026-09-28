import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateAmazonFees } from "../../orchestration/pillow-commerce-presale/amazon-commerce-preflight.js";
import { resetHttpTransportOverride, setHttpTransportOverride } from "../../orchestration/reality-integration/live-commerce/http-transport.js";

const session = { accessToken: "offline", sellerId: "seller", endpoint: "https://amazon.invalid", marketplaceId: "US" };

test("only successful exact-cent USD Amazon fee estimates become live economics", async t => {
  t.after(resetHttpTransportOverride);
  const cases = [
    { amount: 2.5, currency: "USD", status: "Success", http: 200, expected: 2.5 },
    { amount: 0, currency: "USD", status: "Success", http: 200, expected: 0 },
    { amount: -1, currency: "USD", status: "Success", http: 200 },
    { amount: 1.001, currency: "USD", status: "Success", http: 200 },
    { amount: 2.5, currency: "EUR", status: "Success", http: 200 },
    { amount: 2.5, currency: undefined, status: "Success", http: 200 },
    { amount: 2.5, currency: "USD", status: "Error", http: 200 },
    { amount: 2.5, currency: "USD", status: "Success", http: 503 },
    { amount: Infinity, currency: "USD", status: "Success", http: 200 },
  ];
  for (const row of cases) {
    setHttpTransportOverride(async () => ({ status: row.http, ok: row.http === 200, latencyMs: 1,
      json: { payload: { FeesEstimateResult: { Status: row.status,
        FeesEstimate: { TotalFeesEstimate: { Amount: row.amount, CurrencyCode: row.currency } },
      } } },
    }));
    const result = await estimateAmazonFees(session, "B00TEST", 20);
    assert.equal(result.totalFeesUsd, row.expected ?? null, JSON.stringify(row));
    assert.equal(result.freshness, row.expected === undefined ? "UNAVAILABLE" : "LIVE");
  }
  let calls = 0;
  setHttpTransportOverride(async () => { calls++; throw new Error("provider request should not occur"); });
  for (const price of [0, -1, NaN, Infinity, 20.001, Number.MAX_VALUE]) {
    const result = await estimateAmazonFees(session, "B00TEST", price);
    assert.equal(result.totalFeesUsd, null);
    assert.match(result.blocker ?? "", /Invalid selling price/);
  }
  assert.equal(calls, 0);
});
