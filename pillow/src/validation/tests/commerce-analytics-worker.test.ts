import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CAW_CAPABILITIES,
  CAW_INTEGRATION_TARGETS,
  CAW_METADATA_VERSION,
  COMMERCE_ANALYTICS_REPORT_VERSION,
  METRIC_KINDS,
  PRODUCT_PERFORMANCE_CLASSIFICATIONS,
  buildCommerceAnalyticsWorkerConfiguration,
  createCommerceAnalyticsWorker,
  resetCommerceAnalyticsWorkerForTesting,
} from "../../commerce-analytics-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createCommerceAnalyticsWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCommerceAnalyticsWorker(bootstrap, config);
  await engine.initialize();
  engine.connectCommerceAnalyticsWorker();
  return engine;
}

const sampleInput = {
  analyticsContext: {
    businessId: "biz-commerce-bamboo-01",
    productId: "prod-bamboo-desk-organizer",
    productName: "Bamboo Desk Organizer",
    supplierId: "sup-shenzhen-bamboo-co",
    supplierName: "Shenzhen Bamboo Co",
    unitsSold: 120,
    revenue: 5256,
    sessions: 2400,
    orders: 180,
    averageOrderValue: 29.2,
    grossProfit: 2100,
    netProfit: 1260,
    costOfGoods: 3156,
    customerIssueCount: 8,
    refundCount: 6,
    refundAmount: 262.8,
    onTimeFulfilments: 170,
    totalFulfilments: 180,
    fulfilmentFailures: 4,
    currentStock: 90,
    reorderPoint: 85,
    recommendedSellingPrice: 43.8,
    landedCost: 28.47,
    targetMargin: 35,
    previousUnitsSold: 150,
    previousRevenue: 6570,
    previousConversionRate: 0.09,
    previousNetProfit: 1680,
    previousRefundRate: 0.02,
    periodLabel: "current_period",
    pricingReportId: "prw-prc-bamboo-01",
    inventoryReportId: "inw-inv-bamboo-01",
    orderReportIds: ["orw-ord-bamboo-01"],
    refundCaseIds: ["rdw-case-bamboo-01"],
    businessMissionId: "cmf-cbm-commerce-01",
  },
  evidenceSources: [
    {
      source: "order_worker",
      claim: "Sales derived from Order Worker fulfilment history",
      kind: "fact",
      relatedTopic: "sales",
    },
  ],
  validated: true,
};

const highPerformingInput = {
  ...sampleInput,
  analyticsContext: {
    ...sampleInput.analyticsContext,
    unitsSold: 200,
    revenue: 8760,
    sessions: 2000,
    orders: 200,
    refundCount: 4,
    refundAmount: 175.2,
    customerIssueCount: 2,
    grossProfit: 4200,
    netProfit: 2800,
    previousUnitsSold: 180,
    previousRevenue: 7884,
    previousConversionRate: 0.09,
    previousNetProfit: 2400,
    previousRefundRate: 0.03,
  },
};

const decliningInput = {
  ...sampleInput,
  analyticsContext: {
    ...sampleInput.analyticsContext,
    unitsSold: 40,
    revenue: 1200,
    sessions: 3000,
    orders: 45,
    refundCount: 12,
    refundAmount: 525.6,
    customerIssueCount: 18,
    grossProfit: 200,
    netProfit: 40,
    previousUnitsSold: 120,
    previousRevenue: 5256,
    previousConversionRate: 0.075,
    previousNetProfit: 1260,
    previousRefundRate: 0.03,
  },
};

describe("Q3-13 Commerce Analytics Worker", () => {
  beforeEach(resetCommerceAnalyticsWorkerForTesting);

  test("1 locks mandatory commerce-analytics-worker boundaries", () => {
    const c = buildCommerceAnalyticsWorkerConfiguration(REPO_ROOT, {
      neverModifyProducts: false as never,
      neverModifyPricing: false as never,
      neverModifySuppliers: false as never,
      neverExecuteOptimizations: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ314OrLater: false as never,
      neverModifyOperationalData: false as never,
    });
    assert.equal(c.neverModifyProducts, true);
    assert.equal(c.neverModifyPricing, true);
    assert.equal(c.neverModifySuppliers, true);
    assert.equal(c.neverExecuteOptimizations, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ314OrLater, true);
    assert.equal(c.neverModifyOperationalData, true);
  });

  test("2 initializes PILLOW-CAW-001 for Q3-13 with commerce + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-13");
    assert.equal(state.engineVersion, "PILLOW-CAW-001");
    assert.equal(state.configuration.workerId, "wkr-commerce-analytics-01");
    for (const target of CAW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const kind of METRIC_KINDS) {
      assert.ok(typeof kind === "string");
    }
    for (const classification of PRODUCT_PERFORMANCE_CLASSIFICATIONS) {
      assert.ok(typeof classification === "string");
    }
    assert.ok(CAW_CAPABILITIES.includes("identify_optimization_opportunities"));
  });

  test("3 tracks product and sales performance", async () => {
    const engine = await build();
    const product = engine.trackProductPerformance(sampleInput);
    const sales = engine.trackSalesPerformance(sampleInput);
    assert.equal(product.action, "track_product_performance");
    assert.equal(sales.latestAnalyticsReport!.salesMetrics.unitsSold.value, 120);
    assert.equal(sales.latestAnalyticsReport!.salesMetrics.revenue.value, 5256);
  });

  test("4 tracks conversion and profit metrics", async () => {
    const engine = await build();
    const conversion = engine.trackConversionRates(sampleInput);
    const profit = engine.trackGrossAndNetProfit(sampleInput);
    assert.ok(conversion.latestAnalyticsReport!.conversionMetrics.conversionRate.value > 0);
    assert.equal(profit.latestAnalyticsReport!.profitMetrics.grossProfit.value, 2100);
    assert.equal(profit.latestAnalyticsReport!.profitMetrics.netProfit.value, 1260);
    assert.ok(
      ["measured", "estimated"].includes(
        profit.latestAnalyticsReport!.profitMetrics.netProfit.kind,
      ),
    );
  });

  test("5 tracks customer issues, refund rates, and supplier performance", async () => {
    const engine = await build();
    const issues = engine.trackCustomerIssues(sampleInput);
    const refunds = engine.trackRefundRates(sampleInput);
    const supplier = engine.trackSupplierPerformance(sampleInput);
    assert.equal(issues.latestAnalyticsReport!.customerIssueMetrics.issueCount.value, 8);
    assert.equal(refunds.latestAnalyticsReport!.refundMetrics.refundCount.value, 6);
    assert.ok(supplier.latestAnalyticsReport!.supplierPerformance.overallScore.value >= 0);
  });

  test("6 detects declining and high-performing products", async () => {
    const engine = await build();
    const declining = engine.detectDecliningProducts(decliningInput);
    const high = engine.detectHighPerformingProducts(highPerformingInput);
    assert.equal(declining.latestAnalyticsReport!.productPerformanceClassification, "declining");
    assert.equal(high.latestAnalyticsReport!.productPerformanceClassification, "high_performing");
  });

  test("7 identifies optimization opportunities and executive recommendations", async () => {
    const report = (await build()).identifyOptimizationOpportunities(decliningInput);
    const latest = report.latestAnalyticsReport!;
    assert.ok(latest.improvementOpportunities.length >= 1);
    assert.ok(latest.executiveRecommendations.length >= 1);
    assert.ok(latest.executiveRecommendations[0]!.recommendation.length > 10);
    assert.ok(!/execute optimization/i.test(latest.executiveRecommendations[0]!.recommendation));
  });

  test("8 produces machine-readable Commerce Analytics Report with required fields", async () => {
    const report = (await build()).produceCommerceAnalyticsReport(sampleInput);
    const latest = report.latestAnalyticsReport!;
    assert.ok(latest.analyticsReportId.startsWith("caw-anl-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessId, "biz-commerce-bamboo-01");
    assert.equal(latest.productId, "prod-bamboo-desk-organizer");
    assert.ok(latest.salesMetrics.unitsSold);
    assert.ok(latest.conversionMetrics.conversionRate);
    assert.ok(latest.profitMetrics.netProfit);
    assert.ok(latest.customerIssueMetrics.issueCount);
    assert.ok(latest.refundMetrics.refundRate);
    assert.ok(latest.supplierPerformance);
    assert.ok(Array.isArray(latest.improvementOpportunities));
    assert.ok(Array.isArray(latest.executiveRecommendations));
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, CAW_METADATA_VERSION);
    assert.equal(latest.reportVersion, COMMERCE_ANALYTICS_REPORT_VERSION);
    assert.equal(latest.neverModifyOperationalData, true);
    assert.equal(latest.neverExecuteOptimizations, true);
    assert.ok(latest.significantChanges.length >= 1);
  });

  test("9 rejects modify / execute / override / Q3-14 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { modifyProducts: true },
      { modifyPricing: true },
      { modifySuppliers: true },
      { executeOptimizations: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ314OrLater: true },
      { modifyOperationalData: true },
    ] as const) {
      const report = engine.produceCommerceAnalyticsReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestAnalyticsReport, null);
    }
  });

  test("10 submits findings through ERR and preserves audit / cockpit boundaries", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createCommerceAnalyticsWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-caw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectCommerceAnalyticsWorker();
    const produced = engine.produceCommerceAnalyticsReport(sampleInput);
    const submitted = engine.submitFindings({
      analyticsReportId: produced.latestAnalyticsReport!.analyticsReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q3-13"]);
    assert.equal(submitted.latestAnalyticsReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestAnalyticsReport!.executiveReportId, "ert-worker-caw-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-13");
    assert.equal(cockpit.neverExecuteOptimizations, true);
    assert.equal(cockpit.neverModifyOperationalData, true);
  });
});
