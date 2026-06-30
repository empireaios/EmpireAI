import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  runCommercialReview,
  generateWinningListing,
  recommendCommercialStrategy,
  classifyProductExperiment,
  runFullCommercialIntelligence,
  buildCisMissionControlDashboard,
  resetCisRepository,
  COMMERCIAL_REVIEW_PERSPECTIVES,
} from "../../runtime/commerce-intelligence-studio/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-cis001";
const COMPANY_ID = "co-grand-king";

const SAMPLE_PRODUCT = {
  supplierProductId: "cj-prod-8821",
  supplierName: "CJ Dropshipping",
  title: "Wireless Bluetooth Earbuds with Charging Case",
  description: "Premium wireless earbuds with noise cancellation and 30-hour battery life.",
  category: "Electronics > Audio",
  costPrice: 8.5,
  suggestedRetailPrice: 29.99,
  shippingDays: 18,
  marginPercent: 72,
  imageUrls: ["https://example.com/earbuds.jpg"],
  attributes: { color: "Black", connectivity: "Bluetooth 5.0" },
  tags: ["earbuds", "wireless", "audio"],
};

describe("Revenue Slice 001A — Commerce Intelligence Studio (CIS-001–CIS-005)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetCisRepository();
  });

  afterEach(() => {
    resetCisRepository();
    resetDatabaseInstance();
  });

  it("CIS-001 — commercial review engine produces 9 perspective reviews", () => {
    const review = runCommercialReview(WORKSPACE_ID, COMPANY_ID, SAMPLE_PRODUCT);

    assert.equal(review.perspectives.length, COMMERCIAL_REVIEW_PERSPECTIVES.length);
    assert.ok(review.perspectives.every((p) => p.score >= 0 && p.score <= 100));
    assert.ok(review.perspectives.every((p) => p.strengths.length >= 0));
    assert.ok(review.perspectives.every((p) => p.recommendations.length >= 1));
    assert.ok(review.perspectives.every((p) => p.confidence >= 0));
    assert.ok(review.aggregateScore >= 0);
  });

  it("CIS-002 — winning listing engine returns platform-neutral package with strength score", () => {
    runCommercialReview(WORKSPACE_ID, COMPANY_ID, SAMPLE_PRODUCT);
    const listing = generateWinningListing(WORKSPACE_ID, COMPANY_ID, SAMPLE_PRODUCT, {
      supplierProductId: SAMPLE_PRODUCT.supplierProductId,
      brandName: "EmpireAudio",
    });

    assert.ok(listing.title.length > 0);
    assert.ok(listing.benefits.length >= 3);
    assert.ok(listing.faqs.length >= 2);
    assert.ok(listing.objectionHandlers.length >= 2);
    assert.ok(listing.listingStrengthScore >= 0);
    assert.ok(listing.seoQualityScore >= 0);
    assert.ok(listing.conversionQualityScore >= 0);
    assert.ok(listing.brandConsistencyScore >= 0);
  });

  it("CIS-003 — commercial strategy engine recommends strategy with pricing and reasoning", () => {
    runCommercialReview(WORKSPACE_ID, COMPANY_ID, SAMPLE_PRODUCT);
    const strategy = recommendCommercialStrategy(WORKSPACE_ID, COMPANY_ID, SAMPLE_PRODUCT);

    assert.ok(strategy.recommendedStrategy);
    assert.ok(strategy.pricingStrategy.suggestedRetailPrice > 0);
    assert.ok(strategy.expectedOutcome.length > 0);
    assert.ok(strategy.reasoning.length > 0);
    assert.ok(strategy.confidence >= 0);
    assert.ok(strategy.alternativeStrategies.length >= 2);
  });

  it("CIS-004 — experiment engine classifies without rejecting on shipping or margin alone", () => {
    runCommercialReview(WORKSPACE_ID, COMPANY_ID, SAMPLE_PRODUCT);
    recommendCommercialStrategy(WORKSPACE_ID, COMPANY_ID, SAMPLE_PRODUCT);

    const slowShipping = classifyProductExperiment(WORKSPACE_ID, COMPANY_ID, {
      ...SAMPLE_PRODUCT,
      supplierProductId: "cj-slow-ship",
      shippingDays: 25,
      marginPercent: 12,
    });

    assert.notEqual(slowShipping.classification, "REMOVE");
    assert.ok(slowShipping.shippingDaysNote?.includes("not used as sole rejection"));
    assert.ok(slowShipping.marginNote?.includes("not sole rejection"));
    assert.ok(["HIGH_CONFIDENCE", "EXPERIMENT", "WATCHLIST"].includes(slowShipping.classification));
  });

  it("CIS-005 — Mission Control dashboard exposes commercial intelligence payload", () => {
    runFullCommercialIntelligence(WORKSPACE_ID, COMPANY_ID, SAMPLE_PRODUCT, "EmpireAudio");
    const dashboard = buildCisMissionControlDashboard(WORKSPACE_ID, COMPANY_ID);

    assert.equal(dashboard.moduleId, "commerce-intelligence-studio");
    assert.equal(dashboard.missionId, "CIS-001-CIS-005");
    assert.ok(dashboard.winningListings.length >= 1);
    assert.ok(dashboard.commercialConfidence >= 0);
    assert.ok(dashboard.topCommercialOpportunities.length >= 1);
  });
});
