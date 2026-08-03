import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  DPA_ANALYTICS_TYPES,
  DPA_CAPABILITIES,
  DPA_INTEGRATION_TARGETS,
  DPA_METADATA_VERSION,
  DIGITAL_PRODUCT_ANALYTICS_WORKER_REPORT_VERSION,
  buildDigitalProductAnalyticsWorkerConfiguration,
  createDigitalProductAnalyticsWorker,
  resetDigitalProductAnalyticsWorkerForTesting,
} from "../../digital-product-analytics-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(options?: Parameters<typeof createDigitalProductAnalyticsWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createDigitalProductAnalyticsWorker(bootstrap, options);
  await engine.initialize();
  engine.connect();
  return engine;
}

const productInput = {
  checkoutId: "ckw-chk-001",
  deliveryId: "ddw-dlv-001",
  productId: "dpa-prd-001",
  productTitle: "Freelancer Client Onboarding Toolkit",
  researchReportId: "dpr-rsh-001",
  opportunityId: "dpr-opp-001",
  businessId: "dbiz-dpa-01",
  factoryMissionId: "dpf-dpa-01",
  analyticsType: "sales_performance" as const,
  currency: "USD",
  periodLabel: "last_30_days",
  validated: true,
};

const measuredInput = {
  ...productInput,
  unitsSold: 42,
  ordersCount: 38,
  grossRevenue: 2099.58,
  estimatedProfit: 1364.73,
  marginPercent: 65,
  conversionRatePercent: 4.2,
  visitorsPlaceholder: 1000,
  checkoutsStarted: 120,
  purchasesCompleted: 38,
  refundRatePercent: 2.5,
  refundCount: 1,
  refundAmount: 49.99,
  feedbackThemes: ["easy to use", "great templates"],
  feedbackSentiment: "positive" as const,
  feedbackSampleSize: 12,
  feedbackSummary: "Customers appreciate the templates and onboarding clarity",
  validated: true,
};

describe("Q5-11 Digital Product Analytics Worker", () => {
  beforeEach(resetDigitalProductAnalyticsWorkerForTesting);

  test("1 locks mandatory digital-product-analytics-worker boundaries", () => {
    const c = buildDigitalProductAnalyticsWorkerConfiguration(REPO_ROOT, {
      neverEditProducts: false as never,
      neverProcessPayments: false as never,
      neverDeliverProducts: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ512OrLater: false as never,
      neverFabricateMetrics: false as never,
      neverModifyProductsWithoutPillowApproval: false as never,
    });
    assert.equal(c.neverEditProducts, true);
    assert.equal(c.neverProcessPayments, true);
    assert.equal(c.neverDeliverProducts, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ512OrLater, true);
    assert.equal(c.neverFabricateMetrics, true);
    assert.equal(c.neverModifyProductsWithoutPillowApproval, true);
  });

  test("2 initializes PILLOW-DPA-001 Q5-11 with checkout_worker + digital_delivery_worker integrations", async () => {
    const state = (
      await build({
        dependencies: {
          checkoutWorker: {
            getCheckouts: () => [
              {
                checkoutId: "ckw-chk-001",
                productId: "dpa-prd-001",
                productTitle: "Freelancer Client Onboarding Toolkit",
                checkoutReady: true,
                orderSummary: { unitsSold: 42, grossRevenue: 2099.58, currency: "USD" },
              },
            ],
            getLatestCheckoutId: () => "ckw-chk-001",
          },
          digitalDeliveryWorker: {
            getDeliveries: () => [
              {
                deliveryId: "ddw-dlv-001",
                productId: "dpa-prd-001",
                productTitle: "Freelancer Client Onboarding Toolkit",
                checkoutId: "ckw-chk-001",
                deliveryStatus: "delivered",
              },
            ],
            getLatestDeliveryId: () => "ddw-dlv-001",
          },
        },
      })
    ).getState();
    assert.equal(state.missionId, "Q5-11");
    assert.equal(state.engineVersion, "PILLOW-DPA-001");
    assert.equal(state.configuration.workerId, "wkr-digital-product-analytics-01");
    for (const target of DPA_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(state.configuration.integrationTargets.includes("checkout_worker"));
    assert.ok(state.configuration.integrationTargets.includes("digital_delivery_worker"));
    assert.ok(state.configuration.integrationTargets.includes("digital_products_factory_core"));
    for (const type of DPA_ANALYTICS_TYPES) {
      assert.ok(state.configuration.supportedAnalyticsTypes.includes(type));
    }
    assert.ok(DPA_CAPABILITIES.includes("track_product_sales"));
    assert.ok(DPA_CAPABILITIES.includes("produce_machine_readable_digital_product_analytics_reports"));
  });

  test("3 track product sales (with explicit measured input)", async () => {
    const report = (await build()).trackProductSales(measuredInput);
    assert.equal(report.action, "track_product_sales");
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.latestAnalyticsReport!.salesMetrics.unitsSold, 42);
    assert.equal(report.latestAnalyticsReport!.salesMetrics.measured, true);
    assert.ok(report.latestAnalyticsReport!.analyticsReportId.startsWith("dpa-anl-"));
  });

  test("4 track revenue/profit + conversion", async () => {
    const engine = await build();
    engine.trackProductSales(measuredInput);
    const revenue = engine.trackRevenueAndProfitMetrics(measuredInput);
    assert.equal(revenue.action, "track_revenue_and_profit_metrics");
    assert.equal(revenue.latestAnalyticsReport!.revenueMetrics.grossRevenue, 2099.58);
    assert.equal(revenue.latestAnalyticsReport!.revenueMetrics.measured, true);
    assert.equal(revenue.latestAnalyticsReport!.profitMetrics.estimatedProfit, 1364.73);
    assert.equal(revenue.latestAnalyticsReport!.profitMetrics.estimated, true);

    const conversion = engine.trackConversionRates(measuredInput);
    assert.equal(conversion.action, "track_conversion_rates");
    assert.equal(conversion.latestAnalyticsReport!.conversionMetrics.conversionRatePercent, 4.2);
    assert.equal(conversion.latestAnalyticsReport!.conversionMetrics.measured, true);
  });

  test("5 track refunds + analyse feedback", async () => {
    const engine = await build();
    engine.trackProductSales(measuredInput);
    engine.trackRevenueAndProfitMetrics(measuredInput);
    engine.trackConversionRates(measuredInput);

    const refunds = engine.trackRefundRates(measuredInput);
    assert.equal(refunds.action, "track_refund_rates");
    assert.equal(refunds.latestAnalyticsReport!.refundMetrics.refundRatePercent, 2.5);
    assert.equal(refunds.latestAnalyticsReport!.refundMetrics.measured, true);

    const feedback = engine.analyseCustomerFeedback(measuredInput);
    assert.equal(feedback.action, "analyse_customer_feedback");
    assert.equal(feedback.latestAnalyticsReport!.customerFeedbackSummary.sentiment, "positive");
    assert.ok(feedback.latestAnalyticsReport!.customerFeedbackSummary.themes.length >= 1);
  });

  test("6 detect trends + underperforming products", async () => {
    const engine = await build();
    engine.trackProductSales(measuredInput);
    engine.trackRevenueAndProfitMetrics(measuredInput);
    engine.trackConversionRates(measuredInput);
    engine.trackRefundRates(measuredInput);

    const trends = engine.detectProductPerformanceTrends(measuredInput);
    assert.equal(trends.action, "detect_product_performance_trends");
    assert.equal(trends.latestAnalyticsReport!.trendsDetected, true);

    const underperform = engine.detectUnderperformingProducts(measuredInput);
    assert.equal(underperform.action, "detect_underperforming_products");
    assert.ok(typeof underperform.latestAnalyticsReport!.underperformingDetected === "boolean");
  });

  test("7 recommend improvements + executive summary", async () => {
    const engine = await build();
    engine.trackProductSales(measuredInput);
    engine.trackRevenueAndProfitMetrics(measuredInput);
    engine.trackConversionRates(measuredInput);
    engine.trackRefundRates(measuredInput);
    engine.analyseCustomerFeedback(measuredInput);
    engine.detectProductPerformanceTrends(measuredInput);
    engine.detectUnderperformingProducts(measuredInput);

    const recs = engine.recommendImprovementOpportunities(measuredInput);
    assert.equal(recs.action, "recommend_improvement_opportunities");
    for (const rec of recs.latestAnalyticsReport!.improvementRecommendations) {
      assert.equal(rec.isRecommendation, true);
      assert.ok(rec.recommendationId.startsWith("dpa-rec-"));
    }

    const exec = engine.generateExecutivePerformanceSummaries(measuredInput);
    assert.equal(exec.action, "generate_executive_performance_summaries");
    assert.ok(exec.latestAnalyticsReport!.executiveSummary.length > 0);
  });

  test("8 produce Analytics Report with all required fields; recommendations have isRecommendation:true; measured metrics use provided numbers", async () => {
    const report = (await build()).produceDigitalProductAnalyticsReport(measuredInput);
    const latest = report.latestAnalyticsReport!;
    assert.ok(latest.analyticsReportId.startsWith("dpa-anl-"));
    assert.ok(latest.timestamp);
    assert.ok(latest.productId.startsWith("dpa-prd-"));
    assert.ok(latest.productTitle.length > 0);
    assert.equal(latest.salesMetrics.unitsSold, 42);
    assert.equal(latest.salesMetrics.measured, true);
    assert.equal(latest.revenueMetrics.grossRevenue, 2099.58);
    assert.equal(latest.revenueMetrics.measured, true);
    assert.equal(latest.profitMetrics.estimatedProfit, 1364.73);
    assert.equal(latest.conversionMetrics.conversionRatePercent, 4.2);
    assert.equal(latest.refundMetrics.refundRatePercent, 2.5);
    assert.ok(latest.customerFeedbackSummary);
    assert.ok(Array.isArray(latest.improvementRecommendations));
    assert.ok(latest.executiveSummary.length > 0);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, DPA_METADATA_VERSION);
    assert.equal(latest.reportVersion, DIGITAL_PRODUCT_ANALYTICS_WORKER_REPORT_VERSION);
    assert.equal(latest.neverEditProducts, true);
    assert.equal(latest.neverProcessPayments, true);
    assert.equal(latest.neverDeliverProducts, true);
    assert.equal(latest.neverFabricateMetrics, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
    for (const rec of latest.improvementRecommendations) {
      assert.equal(rec.isRecommendation, true);
    }
  });

  test("9 reject editProducts/processPayments/deliverProducts/override/Q5-12/fabricateMetrics", async () => {
    const engine = await build();
    engine.trackProductSales(measuredInput);
    for (const forbidden of [
      { editProducts: true },
      { modifyProducts: true },
      { processPayments: true },
      { deliverProducts: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ512OrLater: true },
      { fabricateMetrics: true },
    ] as const) {
      const report = engine.produceDigitalProductAnalyticsReport({
        ...measuredInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestAnalyticsReport, null);
    }
  });

  test("10 list + ERR submit missionId Q5-11 + cockpit + audit", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createDigitalProductAnalyticsWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-dpa-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    engine.trackProductSales(measuredInput);
    engine.trackRevenueAndProfitMetrics(measuredInput);
    engine.trackConversionRates(measuredInput);
    engine.trackRefundRates(measuredInput);
    engine.analyseCustomerFeedback(measuredInput);
    engine.detectProductPerformanceTrends(measuredInput);
    engine.detectUnderperformingProducts(measuredInput);
    engine.recommendImprovementOpportunities(measuredInput);
    engine.generateExecutivePerformanceSummaries(measuredInput);
    const produced = engine.produceDigitalProductAnalyticsReport(measuredInput);
    const listed = engine.list();
    assert.ok(listed.analyticsReports.length >= 1);
    const submitted = engine.submitReport({
      analyticsReportId: produced.latestAnalyticsReport!.analyticsReportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q5-11"]);
    assert.equal(submitted.latestAnalyticsReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestAnalyticsReport!.executiveReportId, "ert-dpa-001");
    assert.ok(engine.getAuditTrail().length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q5-11");
    assert.equal(cockpit.neverEditProducts, true);
    assert.equal(cockpit.neverProcessPayments, true);
    assert.equal(cockpit.neverDeliverProducts, true);
    assert.equal(cockpit.neverFabricateMetrics, true);
  });
});
