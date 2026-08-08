import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

import { ApprovalGateEngine } from "../../orchestration/pillow-approval/approval-gate-engine.js";
import {
  interpretListingCommercialState,
  isProof001FailureClass,
} from "../../orchestration/pillow-commerce-presale/amazon-commerce-preflight.js";
import { calculateExpectedContribution, proposeSellingPrice } from "../../orchestration/pillow-commerce-presale/economics.js";
import { pillowCommercePresaleTools } from "../../orchestration/pillow-commerce-presale/tools/pillow-commerce-presale-tools.js";
import { setHttpTransportOverride, resetHttpTransportOverride } from "../../orchestration/reality-integration/live-commerce/http-transport.js";
import { runPillowCommercePresaleCycle } from "../../orchestration/pillow-commerce-presale/services/presale-cycle-service.js";
import { clearCjAuthCache } from "../../suppliers/cj-dropshipping/cj-auth.js";
import { pickLiveCjVariant } from "../../orchestration/pillow-commerce-presale/cj-live-normalize.js";

describe("pillow-commerce-presale", () => {
  beforeEach(() => {
    process.env.DATABASE_PATH = ":memory:";
    process.env.CJ_INTEGRATION_MODE = "LIVE";
    process.env.CJ_API_KEY = "test-cj-key";
    process.env.AMAZON_SELLER_ID = "A1TESTSELLER";
    process.env.AMAZON_SP_API_CLIENT_ID = "cid";
    process.env.AMAZON_SP_API_CLIENT_SECRET = "secret";
    process.env.AMAZON_SP_API_REFRESH_TOKEN = "refresh";
    process.env.AMAZON_SP_API_REFRESH_TOKEN_NA = "refresh";
    clearCjAuthCache();
  });

  afterEach(() => {
    resetHttpTransportOverride();
  });

  it("registers Pillow commerce tools", () => {
    assert.ok(pillowCommercePresaleTools.some((t) => t.name === "pillow_commerce.run_presale_cycle"));
    assert.ok(pillowCommercePresaleTools.some((t) => t.name === "pillow_commerce.latest_opportunity"));
  });

  it("treats ACCEPTED as not BUYABLE (Proof 001 regression class)", () => {
    const accepted = interpretListingCommercialState({ amazonStatus: "ACCEPTED" });
    assert.equal(accepted.state, "ACCEPTED");
    assert.notEqual(accepted.state, "BUYABLE");

    const suppressed = interpretListingCommercialState({
      amazonStatus: "ACCEPTED",
      summaries: [{ status: ["DISCOVERABLE"], selectable: false }],
      issues: [
        {
          code: "18304",
          message: "You need approval to list in this brand.",
          categories: ["QUALIFICATION_REQUIRED", "LISTING_SUPPRESSED"],
        },
      ],
    });
    assert.equal(suppressed.state, "QUALIFICATION_REQUIRED");
  });

  it("rejects Proof 001 Anker / blocked ASIN identity", () => {
    assert.equal(isProof001FailureClass({ asin: "B088NRLMPV" }), true);
    assert.equal(isProof001FailureClass({ productName: "Anker USB-C Cable" }), true);
    assert.equal(isProof001FailureClass({ productName: "Generic desk organizer", asin: "B0TEST1234" }), false);
  });

  it("normalizes live CJ variantSellPrice / variantList.price into cost", () => {
    const picked = pickLiveCjVariant({
      pid: "P1",
      productName: "Test",
      variantList: [
        {
          vid: "V9",
          sku: "SKU-9",
          variantSellPrice: 3.45,
        },
      ],
    });
    assert.equal(picked.costUsd, 3.45);
    assert.equal(picked.variant?.vid, "V9");
  });

  it("rejects loss-making economics and unavailable live inputs", () => {
    const loss = calculateExpectedContribution({
      proposedSellingPriceUsd: 10,
      amazonFees: { amountUsd: 3, freshness: "LIVE", source: "fees" },
      supplierCost: { amountUsd: 6, freshness: "LIVE", source: "cj" },
      shipping: { amountUsd: 5, freshness: "LIVE", source: "freight" },
    });
    assert.equal(loss.passesGate, false);

    const missingCost = calculateExpectedContribution({
      proposedSellingPriceUsd: 30,
      amazonFees: { amountUsd: 3, freshness: "LIVE", source: "fees" },
      supplierCost: { amountUsd: null, freshness: "UNAVAILABLE", source: "static-forbidden" },
      shipping: { amountUsd: 5, freshness: "LIVE", source: "freight" },
    });
    assert.equal(missingCost.passesGate, false);
    assert.match(missingCost.blocker ?? "", /UNAVAILABLE/);

    const ok = calculateExpectedContribution({
      proposedSellingPriceUsd: proposeSellingPrice({
        supplierCostUsd: 4,
        shippingUsd: 5.5,
        feeGuessUsd: 3,
      }),
      amazonFees: { amountUsd: 3, freshness: "LIVE", source: "fees" },
      supplierCost: { amountUsd: 4, freshness: "LIVE", source: "cj" },
      shipping: { amountUsd: 5.5, freshness: "LIVE", source: "freight" },
    });
    assert.equal(ok.passesGate, true);
    assert.ok((ok.expectedProfitUsd ?? 0) >= 1);
  });

  it("runs autonomous cycle via Pillow path: reject bad, qualify good, surface approval, no publish/spend", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("api.amazon.com/auth/o2/token")) {
        return new Response(JSON.stringify({ access_token: "tok" }), { status: 200 });
      }
      if (url.includes("cjdropshipping.com") || url.includes("/product/") || url.includes("/logistic/") || url.includes("/authentication/")) {
        if (url.includes("/authentication/getAccessToken")) {
          return new Response(
            JSON.stringify({
              code: 200,
              result: true,
              message: "ok",
              data: {
                accessToken: "cj-access",
                accessTokenExpiryDate: Date.now() + 86_400_000,
                refreshToken: "cj-refresh",
              },
            }),
            { status: 200 },
          );
        }
        if (url.includes("/product/list")) {
          return new Response(
            JSON.stringify({
              code: 200,
              result: true,
              message: "ok",
              data: {
                list: [
                  {
                    pid: "P_ANKER",
                    productNameEn: "Anker USB-C Cable",
                    sellPrice: 4,
                    variants: [{ vid: "V1", sku: "ANK-1", sellPrice: 4 }],
                  },
                  {
                    pid: "P_GOOD",
                    productNameEn: "Silicone Kitchen Spatula Set",
                    sellPrice: 3.2,
                    suggestSellPrice: 14.99,
                    variants: [{ vid: "VGOOD", sku: "SPA-1", sellPrice: 3.2, suggestSellPrice: 14.99 }],
                  },
                ],
              },
            }),
            { status: 200 },
          );
        }
        if (url.includes("/product/query")) {
          const pid = new URL(url).searchParams.get("pid");
          if (pid === "P_ANKER") {
            return new Response(
              JSON.stringify({
                code: 200,
                result: true,
                data: {
                  pid: "P_ANKER",
                  productNameEn: "Anker USB-C Cable",
                  sellPrice: 4,
                  variants: [{ vid: "V1", sku: "ANK-1", sellPrice: 4 }],
                },
              }),
              { status: 200 },
            );
          }
          return new Response(
            JSON.stringify({
              code: 200,
              result: true,
              data: {
                pid: "P_GOOD",
                productNameEn: "Silicone Kitchen Spatula Set",
                sellPrice: 3.2,
                suggestSellPrice: 14.99,
                variants: [{ vid: "VGOOD", sku: "SPA-1", sellPrice: 3.2, suggestSellPrice: 14.99 }],
              },
            }),
            { status: 200 },
          );
        }
        if (url.includes("/product/stock/queryByPid")) {
          return new Response(
            JSON.stringify({
              code: 200,
              result: true,
              data: [{ sku: "SPA-1", vid: "VGOOD", inventory: 120 }],
            }),
            { status: 200 },
          );
        }
        if (url.includes("/logistic/freightCalculate")) {
          return new Response(
            JSON.stringify({
              code: 200,
              result: true,
              data: [{ logisticName: "CJPacket", logisticPrice: 4.8 }],
            }),
            { status: 200 },
          );
        }
      }
      return originalFetch(input, init);
    }) as typeof fetch;

    setHttpTransportOverride(async (request) => {
      if (request.url.includes("/catalog/2022-04-01/items")) {
        return {
          status: 200,
          ok: true,
          latencyMs: 1,
          json: {
            items: [{ asin: "B0TESTSPATULA", summaries: [{ brandName: "GenericHome", itemName: "Spatula" }] }],
          },
        };
      }
      if (request.url.includes("/listings/2021-08-01/restrictions")) {
        return { status: 200, ok: true, latencyMs: 1, json: { restrictions: [] } };
      }
      if (request.url.includes("/feesEstimate")) {
        return {
          status: 200,
          ok: true,
          latencyMs: 1,
          json: {
            payload: {
              FeesEstimateResult: {
                Status: "Success",
                FeesEstimate: { TotalFeesEstimate: { Amount: 2.5, CurrencyCode: "USD" } },
              },
            },
          },
        };
      }
      return { status: 404, ok: false, latencyMs: 1, json: { error: "unexpected" } };
    });

    const gate = new ApprovalGateEngine();
    const cycle = await runPillowCommercePresaleCycle({
      workspaceId: "ws_empire_1",
      companyId: "co-grand-king",
      initiatedBy: "pillow-autonomous",
      approvalGate: gate,
      fetchImpl: globalThis.fetch,
    });

    assert.equal(cycle.actorWasCursor, false);
    assert.equal(cycle.publicationAttempted, false);
    assert.equal(cycle.supplierSpendAttempted, false);
    assert.ok(cycle.rejections.some((r) => r.reasonCode === "PROOF_001_BRAND_FAILURE_CLASS"));
    assert.equal(cycle.outcome, "APPROVAL_SURFACED");
    assert.ok(cycle.qualifiedOpportunity);
    assert.equal(cycle.qualifiedOpportunity!.mapping.asin, "B0TESTSPATULA");
    assert.equal(cycle.qualifiedOpportunity!.mapping.cjPid, "P_GOOD");
    assert.equal(cycle.qualifiedOpportunity!.mapping.supplierCostUsd.freshness, "LIVE");
    assert.equal(cycle.qualifiedOpportunity!.mapping.shippingUsd.freshness, "LIVE");
    assert.equal(cycle.qualifiedOpportunity!.mapping.amazonFeesUsd.freshness, "LIVE");
    assert.ok(cycle.qualifiedOpportunity!.approvalId);
    assert.equal(cycle.qualifiedOpportunity!.publicationAllowed, false);
    assert.equal(cycle.qualifiedOpportunity!.supplierSpendAllowed, false);
    assert.match(cycle.qualifiedOpportunity!.recommendation.fullNarrative, /APPROVAL REQUIRED/);

    const pending = gate.listPending("ws_empire_1");
    assert.ok(pending.some((a) => a.approvalId === cycle.qualifiedOpportunity!.approvalId));

    globalThis.fetch = originalFetch;
  });
});
