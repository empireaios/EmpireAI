import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  COST_KINDS,
  PRW_CAPABILITIES,
  PRW_INTEGRATION_TARGETS,
  PRW_METADATA_VERSION,
  PRICING_REPORT_VERSION,
  buildPricingWorkerConfiguration,
  createPricingWorker,
  resetPricingWorkerForTesting,
} from "../../pricing-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createPricingWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createPricingWorker(bootstrap, config);
  await engine.initialize();
  engine.connectPricingWorker();
  return engine;
}

const sampleInput = {
  marketplace: "amazon",
  approvedProduct: {
    productId: "prod-bamboo-desk-organizer",
    productName: "Bamboo Desk Organizer",
    listingId: "plw-lst-bamboo-01",
    supplierId: "sup-shenzhen-bamboo-co",
    supplierName: "Shenzhen Bamboo Co",
    supplierCost: 12.5,
    supplierCostKind: "actual",
    shippingCost: 3.75,
    shippingCostKind: "actual",
    currency: "USD",
    competitorPrices: [
      {
        competitorId: "comp-desk-a",
        competitorName: "DeskCo Essentials",
        price: 39.99,
        currency: "USD",
        source: "marketplace_listing",
        kind: "estimated",
      },
      {
        competitorId: "comp-desk-b",
        competitorName: "Organizer Hub",
        price: 44.5,
        currency: "USD",
        source: "marketplace_listing",
        kind: "estimated",
      },
    ],
    evaluationId: "sew-eval-bamboo-01",
    discoveryId: "sdw-discovery-bamboo-01",
    businessMissionId: "cmf-cbm-commerce-01",
  },
  targetMarginPercent: 35,
  marketplaceFeePercent: 15,
  paymentFeePercent: 2.9,
  advertisingPercent: 10,
  evidenceSources: [
    {
      source: "product_listing_worker",
      claim: "Pricing linked to listing package plw-lst-bamboo-01",
      kind: "fact",
      relatedTopic: "listing",
    },
  ],
  validated: true,
};

describe("Q3-09 Pricing Worker", () => {
  beforeEach(resetPricingWorkerForTesting);

  test("1 locks mandatory pricing-worker boundaries", () => {
    const c = buildPricingWorkerConfiguration(REPO_ROOT, {
      neverPublishListings: false as never,
      neverModifySupplierCosts: false as never,
      neverExecutePromotions: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ310OrLater: false as never,
      neverPublishPricingAutomatically: false as never,
    });
    assert.equal(c.neverPublishListings, true);
    assert.equal(c.neverModifySupplierCosts, true);
    assert.equal(c.neverExecutePromotions, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ310OrLater, true);
    assert.equal(c.neverPublishPricingAutomatically, true);
  });

  test("2 initializes PILLOW-PRW-001 for Q3-09 with listing + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-09");
    assert.equal(state.engineVersion, "PILLOW-PRW-001");
    assert.equal(state.configuration.workerId, "wkr-pricing-01");
    for (const target of PRW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const kind of COST_KINDS) {
      assert.ok(typeof kind === "string");
    }
    assert.ok(PRW_CAPABILITIES.includes("recommend_selling_price"));
  });

  test("3 receives approved products and supplier cost information", async () => {
    const engine = await build();
    const products = engine.receiveApprovedProducts(sampleInput);
    const costs = engine.receiveSupplierCostInformation(sampleInput);
    assert.equal(products.action, "receive_approved_products");
    assert.equal(costs.action, "receive_supplier_costs");
  });

  test("4 calculates landed cost, marketplace fees, and payment fees", async () => {
    const engine = await build();
    const landed = engine.calculateTotalLandedCost(sampleInput);
    const fees = engine.calculateMarketplaceFees(sampleInput);
    const payment = engine.calculatePaymentProcessingFees(sampleInput);
    const report = landed.latestPricingReport!;
    assert.ok(report.totalLandedCost.amount > 0);
    assert.ok(fees.latestPricingReport!.marketplaceFees.amount > 0);
    assert.ok(payment.latestPricingReport!.paymentFees.amount > 0);
    assert.equal(report.supplierCost.kind, "actual");
    assert.equal(report.marketplaceFees.kind, "estimated");
  });

  test("5 calculates advertising, shipping, target margin, and target profit", async () => {
    const engine = await build();
    const ads = engine.calculateAdvertisingCostAssumptions(sampleInput);
    const shipping = engine.calculateShippingCost(sampleInput);
    const margin = engine.calculateTargetMargin(sampleInput);
    const profit = engine.calculateTargetProfit(sampleInput);
    assert.ok(ads.latestPricingReport!.advertisingAllocation.amount > 0);
    assert.equal(shipping.latestPricingReport!.shippingCost.amount, 3.75);
    assert.equal(margin.latestPricingReport!.targetMargin, 35);
    assert.ok(profit.latestPricingReport!.targetProfit.amount > 0);
  });

  test("6 compares competitors and recommends selling price", async () => {
    const engine = await build();
    const compared = engine.compareAgainstCompetitorPricing(sampleInput);
    const recommended = engine.recommendSellingPrice(sampleInput);
    assert.equal(compared.latestPricingReport!.competitorPricing.length, 2);
    assert.ok(recommended.latestPricingReport!.recommendedSellingPrice > 16.25);
    assert.ok(recommended.latestPricingReport!.pricingRationale.length > 20);
  });

  test("7 produces machine-readable Pricing Report with required fields", async () => {
    const report = (await build()).producePricingReport(sampleInput);
    const latest = report.latestPricingReport!;
    assert.ok(latest.pricingId.startsWith("prw-prc-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.productId, "prod-bamboo-desk-organizer");
    assert.equal(latest.supplierCost.amount, 12.5);
    assert.equal(latest.shippingCost.amount, 3.75);
    assert.ok(latest.marketplaceFees.amount > 0);
    assert.ok(latest.paymentFees.amount > 0);
    assert.ok(latest.advertisingAllocation.amount > 0);
    assert.ok(latest.totalLandedCost.amount > 0);
    assert.equal(latest.targetMargin, 35);
    assert.ok(latest.targetProfit.amount > 0);
    assert.equal(latest.competitorPricing.length, 2);
    assert.ok(latest.recommendedSellingPrice > 0);
    assert.ok(latest.pricingRationale);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, PRW_METADATA_VERSION);
    assert.equal(latest.reportVersion, PRICING_REPORT_VERSION);
    assert.equal(latest.neverPublishPricingAutomatically, true);
  });

  test("8 separates actual costs from estimated costs", async () => {
    const latest = (await build()).producePricingReport(sampleInput).latestPricingReport!;
    assert.equal(latest.supplierCost.kind, "actual");
    assert.equal(latest.shippingCost.kind, "actual");
    assert.equal(latest.marketplaceFees.kind, "estimated");
    assert.equal(latest.paymentFees.kind, "estimated");
    assert.equal(latest.advertisingAllocation.kind, "estimated");
    assert.ok(latest.actualCostTotal > 0);
    assert.ok(latest.estimatedCostTotal > 0);
  });

  test("9 rejects publish / modify-costs / promotions / override / Q3-10 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { publishListings: true },
      { modifySupplierCosts: true },
      { executePromotions: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ310OrLater: true },
      { publishPricing: true },
    ] as const) {
      const report = engine.producePricingReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestPricingReport, null);
    }
  });

  test("10 submits findings through ERR and preserves audit / cockpit boundaries", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createPricingWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-prw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectPricingWorker();
    const produced = engine.producePricingReport(sampleInput);
    const submitted = engine.submitFindings({
      pricingId: produced.latestPricingReport!.pricingId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q3-09"]);
    assert.equal(submitted.latestPricingReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestPricingReport!.executiveReportId, "ert-worker-prw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-09");
    assert.equal(cockpit.neverPublishPricingAutomatically, true);
    assert.equal(cockpit.neverModifySupplierCosts, true);
  });
});
