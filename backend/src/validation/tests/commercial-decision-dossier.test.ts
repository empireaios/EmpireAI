import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assembleCommercialDecisionDossier,
  decideDossierVerdict,
  pickCheapestFreight,
} from "../../orchestration/pillow-commerce-presale/assemble-commercial-dossier.js";
import {
  assessDeliveryPromise,
  classifyBrandRoute,
} from "../../orchestration/pillow-commerce-presale/commercial-decision-dossier.js";
import { amazonCjFulfillmentIdempotencyKey } from "../../orchestration/pillow-commerce-presale/amazon-shipment-confirm.js";
import { buildCommerceOperatingLoopReadiness } from "../../orchestration/pillow-commerce-presale/commerce-operating-loop.js";
import { computeActualContribution } from "../../orchestration/pillow-commerce-presale/commerce-actual-pnl.js";

describe("commercial decision dossier FD-CDD-001", () => {
  it("rejects branded catalog without authenticity verification", () => {
    const brand = classifyBrandRoute({ brandName: "Sony", productName: "Headphones" });
    assert.equal(brand.route, "EXISTING_BRANDED_CATALOG");
    const decided = decideDossierVerdict({
      brandRoute: brand.route,
      deliveryCanMeet: "YES",
      amazonEligibility: "PASS",
      profitOk: true,
    });
    assert.equal(decided.verdict, "REJECT");
    assert.equal(decided.rejectCode, "BRAND_AUTHENTICITY_UNVERIFIED");
  });

  it("rejects delivery promise mismatch (Amazon 3–5 vs CJ 10–15)", () => {
    const delivery = assessDeliveryPromise({
      freightDaysMin: 10,
      freightDaysMax: 15,
      processingDaysMin: 1,
      processingDaysMax: 3,
      amazonHandlingDays: 1,
      amazonBuyerPromiseDaysMin: 3,
      amazonBuyerPromiseDaysMax: 5,
    });
    assert.equal(delivery.supplierCanMeet, "NO");
    assert.equal(delivery.lateDeliveryRisk, "HIGH");
    const decided = decideDossierVerdict({
      brandRoute: "GENERIC_UNBRANDED",
      deliveryCanMeet: delivery.supplierCanMeet,
      amazonEligibility: "PASS",
      profitOk: true,
    });
    assert.equal(decided.verdict, "REJECT");
  });

  it("approves generic route with complete dossier fields", () => {
    const assembled = assembleCommercialDecisionDossier({
      productName: "Generic Desk Organizer",
      marketplaceId: "ATVPDKIKX0DER",
      asin: "B0TESTGENERIC",
      amazonSellerSku: "EMP-FD-TEST",
      cjPid: "PID1",
      cjVid: "VID1",
      cjVariantSku: "SKU1",
      mappingTimestamp: new Date().toISOString(),
      stockUnits: 40,
      stockFreshness: "LIVE",
      productCost: { amountUsd: 4.21, freshness: "LIVE", source: "cj" },
      usShipping: { amountUsd: 8.3, freshness: "LIVE", source: "freight" },
      amazonFees: { amountUsd: 3.63, freshness: "LIVE", source: "fees" },
      proposedSellingPriceUsd: 24.21,
      expectedProfitUsd: 8.07,
      expectedMarginPct: 33.3,
      brandName: null,
      amazonEligibility: "PASS",
      restrictionStatus: "PASS",
      competition: {
        competingOfferCount: 4,
        lowestCompetitorPriceUsd: 22.5,
        featuredOfferPriceUsd: 21.99,
        featuredOfferSellerId: "A1OTHER",
        featuredOfferEligible: "YES",
        currentlyFeaturedOffer: "NO",
        relativeOfferPosition: "OFFER POSITION: above lowest by $1.71 (not organic search rank)",
        freshness: "LIVE",
        source: "test",
      },
      freightOption: { logisticPrice: 8.3, logisticAging: "7-12", countryCode: "CN" },
      salesRank: 120000,
      risks: ["test"],
    });
    assert.equal(assembled.verdict, "APPROVE");
    assert.equal(assembled.dossier.dossierVersion, "FD-CDD-001");
    assert.match(assembled.dossier.grandKingSummary, /GRAND KING DECISION/);
    assert.match(assembled.dossier.grandKingSummary, /Expected profit/);
    assert.ok(assembled.dossier.productIdentity.asin === "B0TESTGENERIC");
  });

  it("picks cheapest freight and keeps transit aging", () => {
    const picked = pickCheapestFreight([
      { logisticPrice: 12, logisticAging: "10-15" },
      { logisticPrice: 8.3, logisticAging: "7-12" },
      { logisticPrice: 9.1, logisticAging: "8-14" },
    ]);
    assert.equal(picked.priceUsd, 8.3);
    assert.equal(picked.option?.logisticAging, "7-12");
  });

  it("keeps expected vs actual P&L distinct", () => {
    const actual = computeActualContribution({
      customerRevenueUsd: 24.21,
      amazonFeesUsd: 3.63,
      cjProductCostUsd: 4.21,
      cjShippingUsd: 8.3,
    });
    assert.equal(actual.realisedContributionUsd, 8.07);
  });

  it("builds durable Amazon↔CJ idempotency key", () => {
    const key = amazonCjFulfillmentIdempotencyKey({
      amazonOrderId: "111-222",
      orderItemId: "1",
      amazonSellerSku: "EMP-FD-X",
    });
    assert.equal(key, "amz:111-222|item:1|sku:EMP-FD-X");
  });

  it("reports operating loop with EmpireAI Amazon→CJ bridge as canonical", () => {
    const loop = buildCommerceOperatingLoopReadiness();
    assert.equal(loop.canonicalAmazonToCjRoute, "EMPIREAI_AUTOMATED_BRIDGE");
    assert.equal(loop.cursorRequiredForNormalOperation, false);
    assert.ok(
      loop.stages.some(
        (s) =>
          s.stage === "AMAZON_TO_CJ_ORCHESTRATION" &&
          s.status === "READY_AWAITING_FIRST_REAL_ORDER",
      ),
    );
  });
});
