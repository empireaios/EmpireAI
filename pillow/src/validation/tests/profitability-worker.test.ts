import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildProfitabilityWorkerConfiguration,
  createProfitabilityWorker,
  resetProfitabilityWorkerForTesting,
  type PrfwInput,
} from "../../profitability-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createProfitabilityWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createProfitabilityWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const BIZ = "prfw-biz-growth-01";
const BIZ2 = "prfw-biz-scale-02";

describe("Q9-05 Profitability Worker", () => {
  beforeEach(resetProfitabilityWorkerForTesting);

  test("1 locks mandatory profitability-worker boundaries", () => {
    const c = buildProfitabilityWorkerConfiguration(REPO_ROOT, {
      neverFabricateRevenueCostFeeRefundOrProfitabilityFigures: false as never,
      neverForecastFutureProfitability: false as never,
      neverApproveSpending: false as never,
      neverExecuteFinancialTransactions: false as never,
      neverReplaceForecastingWorker: false as never,
      neverModifyAccountingRecords: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ906OrLater: false as never,
      preserveHistoricalProfitabilityReports: false as never,
    });
    assert.equal(c.neverFabricateRevenueCostFeeRefundOrProfitabilityFigures, true);
    assert.equal(c.neverForecastFutureProfitability, true);
    assert.equal(c.neverApproveSpending, true);
    assert.equal(c.neverExecuteFinancialTransactions, true);
    assert.equal(c.neverReplaceForecastingWorker, true);
    assert.equal(c.neverModifyAccountingRecords, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ906OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveHistoricalProfitabilityReports, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-PRFW-001 for Q9-05 with cost-category/scope catalog", async () => {
    const engine = await build();
    const state = engine.getState();
    assert.equal(state.missionId, "Q9-05");
    assert.equal(state.engineVersion, "PILLOW-PRFW-001");
    for (const category of [
      "revenue",
      "discount",
      "refund",
      "cogs",
      "opex",
      "advertising",
      "platform_fee",
      "payment_fee",
      "tax",
      "shared_cost",
      "other",
    ]) {
      assert.ok(state.configuration.costCategories.includes(category));
    }
    for (const scope of ["business", "product", "project", "factory", "enterprise"]) {
      assert.ok(state.configuration.analysisScopes.includes(scope));
    }
    assert.equal(state.configuration.workerId, "wkr-profitability-01");
  });

  test("3 aggregates revenue, discounts, and refunds correctly from injected financial line items", async () => {
    const engine = await build();
    const result = engine.calculateGrossProfit({
      capitalBusinessId: BIZ,
      currency: "SGD",
      financialLineItems: [
        { category: "revenue", amountMinor: 500000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t3-rev1", realised: true, fabricated: false },
        { category: "revenue", amountMinor: 300000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t3-rev2", realised: true, fabricated: false },
        { category: "discount", amountMinor: 20000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t3-disc", realised: true, fabricated: false },
        { category: "refund", amountMinor: 10000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t3-refund", realised: true, fabricated: false },
        { category: "cogs", amountMinor: 200000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t3-cogs", realised: true, fabricated: false },
      ],
      validated: true,
    });
    assert.equal(result.action, "calculate_gross_profit");
    const breakdown = result.breakdown!;
    assert.equal(breakdown.grossRevenue.minorUnits, 800000);
    assert.equal(breakdown.discounts.minorUnits, 20000);
    assert.equal(breakdown.refunds.minorUnits, 10000);
    assert.equal(breakdown.netRevenue.minorUnits, 770000);
    assert.equal(breakdown.cogs.minorUnits, 200000);
    assert.equal(breakdown.grossProfit.minorUnits, 570000);
    assert.equal(breakdown.grossMarginPercent, 74.02);
    assert.equal(breakdown.fabricated, false);
    assert.ok(breakdown.sourceRefs.length === 5);
  });

  test("4 allocates shared operational costs proportionally by net-revenue weight, remainder to the largest", async () => {
    const engine = await build();
    const allocation = engine.allocateSharedOperationalCosts({
      sharedCostPoolMinor: 100001,
      currency: "SGD",
      financialLineItems: [
        { category: "revenue", amountMinor: 700000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t4-rev1", realised: true, fabricated: false },
        { category: "revenue", amountMinor: 300000, currency: "SGD", businessId: BIZ2, sourceRef: "prfw-t4-rev2", realised: true, fabricated: false },
      ],
      validated: true,
    });
    assert.equal(allocation.action, "allocate_shared_operational_costs");
    const biz1Alloc = allocation.sharedCostAllocations.find((a) => a.scopeId === BIZ)!;
    const biz2Alloc = allocation.sharedCostAllocations.find((a) => a.scopeId === BIZ2)!;
    assert.ok(biz1Alloc);
    assert.ok(biz2Alloc);
    // floor(100001*700000/1000000)=70000, floor(100001*300000/1000000)=30000; remainder 1 -> largest weight (BIZ).
    assert.equal(biz1Alloc.allocatedMinor.minorUnits, 70001);
    assert.equal(biz2Alloc.allocatedMinor.minorUnits, 30000);
    assert.equal(biz1Alloc.allocatedMinor.minorUnits + biz2Alloc.allocatedMinor.minorUnits, 100001);

    const operating = engine.calculateOperatingProfit({
      capitalBusinessId: BIZ,
      currency: "SGD",
      financialLineItems: [
        { category: "opex", amountMinor: 50000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t4-opex", realised: true, fabricated: false },
      ],
      validated: true,
    });
    const breakdown = operating.breakdown!;
    assert.equal(breakdown.sharedCostAllocation.minorUnits, 70001);
    assert.equal(breakdown.operatingExpenses.minorUnits, 50000);
    assert.equal(breakdown.operatingProfit.minorUnits, 579999);
  });

  test("5 calculates platform and payment fees correctly", async () => {
    const engine = await build();
    const result = engine.calculateOperatingProfit({
      capitalBusinessId: BIZ,
      currency: "SGD",
      financialLineItems: [
        { category: "revenue", amountMinor: 1000000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t5-rev", realised: true, fabricated: false },
        { category: "platform_fee", amountMinor: 30000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t5-plat", realised: true, fabricated: false },
        { category: "payment_fee", amountMinor: 15000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t5-pay", realised: true, fabricated: false },
      ],
      validated: true,
    });
    const breakdown = result.breakdown!;
    assert.equal(breakdown.platformFees.minorUnits, 30000);
    assert.equal(breakdown.paymentFees.minorUnits, 15000);
    assert.equal(breakdown.operatingProfit.minorUnits, 955000);
  });

  test("6 deducts refunds from net revenue and gross profit correctly", async () => {
    const engine = await build();
    const result = engine.calculateGrossProfit({
      capitalBusinessId: BIZ,
      currency: "SGD",
      financialLineItems: [
        { category: "revenue", amountMinor: 500000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t6-rev", realised: true, fabricated: false },
        { category: "refund", amountMinor: 75000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t6-refund", realised: true, fabricated: false },
      ],
      validated: true,
    });
    const breakdown = result.breakdown!;
    assert.equal(breakdown.refunds.minorUnits, 75000);
    assert.equal(breakdown.netRevenue.minorUnits, 425000);
    assert.equal(breakdown.grossProfit.minorUnits, 425000);
  });

  test("7 incorporates tax provisions correctly — explicit lines win, rate applies only when supplied, never invented", async () => {
    const engineExplicit = await build();
    const explicit = engineExplicit.calculateNetProfit({
      capitalBusinessId: BIZ,
      currency: "SGD",
      financialLineItems: [
        { category: "revenue", amountMinor: 1000000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t7-rev1", realised: true, fabricated: false },
        { category: "tax", amountMinor: 50000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t7-tax", realised: true, fabricated: false },
      ],
      taxRateBps: 2000,
      validated: true,
    });
    assert.equal(explicit.breakdown!.taxProvisions.minorUnits, 50000);
    assert.equal(explicit.breakdown!.netProfit.minorUnits, 950000);

    const engineRate = await build();
    const estimated = engineRate.calculateNetProfit({
      capitalBusinessId: BIZ2,
      currency: "SGD",
      financialLineItems: [
        { category: "revenue", amountMinor: 1000000, currency: "SGD", businessId: BIZ2, sourceRef: "prfw-t7-rev2", realised: true, fabricated: false },
      ],
      taxRateBps: 1700,
      validated: true,
    });
    assert.equal(estimated.breakdown!.taxProvisions.minorUnits, 170000);
    assert.equal(estimated.breakdown!.netProfit.minorUnits, 830000);

    const engineNoEvidence = await build();
    const noEvidence = engineNoEvidence.calculateNetProfit({
      capitalBusinessId: BIZ,
      currency: "SGD",
      financialLineItems: [
        { category: "revenue", amountMinor: 1000000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t7-rev3", realised: true, fabricated: false },
      ],
      validated: true,
    });
    assert.equal(noEvidence.breakdown!.taxProvisions.minorUnits, 0);
    assert.ok(noEvidence.validation.warnings.some((w) => w.toLowerCase().includes("tax")));
  });

  test("8 calculates gross, operating, and net profit with integer-basis-point margins", async () => {
    const engine = await build();
    const result = engine.calculateNetProfit({
      capitalBusinessId: BIZ,
      currency: "SGD",
      financialLineItems: [
        { category: "revenue", amountMinor: 1000000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t8-rev", realised: true, fabricated: false },
        { category: "cogs", amountMinor: 400000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t8-cogs", realised: true, fabricated: false },
        { category: "opex", amountMinor: 100000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t8-opex", realised: true, fabricated: false },
        { category: "tax", amountMinor: 50000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t8-tax", realised: true, fabricated: false },
      ],
      validated: true,
    });
    const b = result.breakdown!;
    assert.equal(b.grossProfit.minorUnits, 600000);
    assert.equal(b.operatingProfit.minorUnits, 500000);
    assert.equal(b.netProfit.minorUnits, 450000);
    assert.equal(b.grossMarginPercent, 60);
    assert.equal(b.operatingMarginPercent, 50);
    assert.equal(b.netMarginPercent, 45);
  });

  test("9 generates profitability rankings across multiple businesses by net profit descending", async () => {
    const engine = await build();
    engine.analyseProfitabilityByBusiness({
      currency: "SGD",
      financialLineItems: [
        { category: "revenue", amountMinor: 900000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t9-rev1", realised: true, fabricated: false },
        { category: "cogs", amountMinor: 100000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t9-cogs1", realised: true, fabricated: false },
        { category: "revenue", amountMinor: 500000, currency: "SGD", businessId: BIZ2, sourceRef: "prfw-t9-rev2", realised: true, fabricated: false },
        { category: "cogs", amountMinor: 50000, currency: "SGD", businessId: BIZ2, sourceRef: "prfw-t9-cogs2", realised: true, fabricated: false },
      ],
      validated: true,
    });
    const ranked = engine.rankProfitability({ scope: "business", validated: true });
    assert.equal(ranked.action, "rank_profitability");
    assert.ok(ranked.rankings.length >= 2);
    assert.equal(ranked.rankings[0]!.scopeId, BIZ);
    assert.equal(ranked.rankings[0]!.rank, 1);
    assert.equal(ranked.rankings[1]!.scopeId, BIZ2);
    assert.equal(ranked.rankings[1]!.rank, 2);
    assert.ok(ranked.rankings[0]!.netProfit.minorUnits > ranked.rankings[1]!.netProfit.minorUnits);
    assert.equal(ranked.rankings[0]!.fabricated, false);
  });

  test("10 produces full Profitability Report with consumableByQ906 and submits through ERR", async () => {
    const engine = await build({
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: () => ({ records: [{ reportId: `ert-prfw-test-${Date.now()}` }] }),
        },
        auditRuntime: {
          recordAuditEntry: () => ({ accepted: true }),
        },
      },
    });
    const result = engine.produceProfitabilityReport({
      capitalBusinessId: BIZ,
      capitalProjectId: "capfc-prj-0001",
      reportingPeriod: "2026-08",
      currency: "SGD",
      financialLineItems: [
        { category: "revenue", amountMinor: 1000000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t10-rev", realised: true, fabricated: false },
        { category: "discount", amountMinor: 20000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t10-disc", realised: true, fabricated: false },
        { category: "refund", amountMinor: 10000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t10-refund", realised: true, fabricated: false },
        { category: "cogs", amountMinor: 300000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t10-cogs", realised: true, fabricated: false },
        { category: "opex", amountMinor: 100000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t10-opex", realised: true, fabricated: false },
        { category: "platform_fee", amountMinor: 20000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t10-plat", realised: true, fabricated: false },
        { category: "payment_fee", amountMinor: 10000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t10-pay", realised: true, fabricated: false },
        { category: "tax", amountMinor: 50000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t10-tax", realised: true, fabricated: false },
      ],
      validated: true,
    });
    assert.equal(result.action, "produce_profitability_report");
    const report = result.latestReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.reportingPeriod, "2026-08");
    assert.equal(report.revenueSummary.grossRevenue.minorUnits, 1000000);
    assert.equal(report.revenueSummary.netRevenue.minorUnits, 970000);
    assert.equal(report.costSummary.cogs.minorUnits, 300000);
    assert.equal(report.feeSummary.platformFees.minorUnits, 20000);
    assert.equal(report.feeSummary.paymentFees.minorUnits, 10000);
    assert.equal(report.refundSummary.refunds.minorUnits, 10000);
    assert.equal(report.taxSummary.taxProvisions.minorUnits, 50000);
    assert.equal(report.grossProfit.minorUnits, 670000);
    assert.equal(report.operatingProfit.minorUnits, 540000);
    assert.equal(report.netProfit.minorUnits, 490000);
    assert.ok(typeof report.profitMargins.netMarginPercent === "number");
    assert.ok(Array.isArray(report.profitabilityRankings));
    assert.ok(Array.isArray(report.profitDrivers));
    assert.ok(Array.isArray(report.lossDrivers));
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 100);
    assert.equal(report.capitalBusinessId, BIZ);
    assert.equal(report.analyses.length, 1);
    assert.equal(report.consumableByQ906, true);
    assert.equal(report.neverFabricateRevenueCostFeeRefundOrProfitabilityFigures, true);
    assert.equal(report.neverForecastFutureProfitability, true);
    assert.equal(report.neverApproveSpending, true);
    assert.equal(report.neverExecuteFinancialTransactions, true);
    assert.equal(report.neverReplaceForecastingWorker, true);
    assert.equal(report.neverModifyAccountingRecords, true);
    assert.equal(report.neverBypassGrandKingApproval, true);
    assert.equal(report.preserveCompleteTraceability, true);
    assert.equal(report.preserveHistoricalProfitabilityReports, true);

    const submit = engine.submitReport({ capitalBusinessId: BIZ, validated: true });
    assert.equal(submit.action, "submit_report");
    assert.ok(submit.validation.decision === "pass" || submit.validation.decision === "partial");
    assert.equal(submit.latestReport!.submittedToExecutiveReporting, true);
    assert.ok(submit.latestReport!.executiveReportId);
    assert.equal(submit.latestReport!.auditStatus, "passed");

    assert.ok(engine.getReports().length >= 1);
  });

  test("11 rejects Q9-06+ missions and every forbidden Profitability Worker boundary", async () => {
    const engine = await build();
    const baseline: PrfwInput = {
      capitalBusinessId: BIZ,
      currency: "SGD",
      financialLineItems: [
        { category: "revenue", amountMinor: 10000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t11-rev", realised: true, fabricated: false },
      ],
      validated: true,
    };

    assert.equal(engine.calculateGrossProfit({ ...baseline, fabricateRevenueCostFeeRefundOrProfitabilityFigures: true }).validation.decision, "fail");
    assert.equal(engine.calculateGrossProfit({ ...baseline, forecastFutureProfitability: true }).validation.decision, "fail");
    assert.equal(engine.calculateGrossProfit({ ...baseline, approveSpending: true }).validation.decision, "fail");
    assert.equal(engine.calculateGrossProfit({ ...baseline, executeFinancialTransactions: true }).validation.decision, "fail");
    assert.equal(engine.calculateGrossProfit({ ...baseline, replaceForecastingWorker: true }).validation.decision, "fail");
    assert.equal(engine.calculateGrossProfit({ ...baseline, modifyAccountingRecords: true }).validation.decision, "fail");
    assert.equal(engine.calculateGrossProfit({ ...baseline, overrideApprovedArchitecture: true }).validation.decision, "fail");
    assert.equal(engine.calculateGrossProfit({ ...baseline, overridePillow: true }).validation.decision, "fail");
    assert.equal(engine.calculateGrossProfit({ ...baseline, overrideGrandKing: true }).validation.decision, "fail");
    assert.equal(engine.calculateGrossProfit({ ...baseline, bypassGrandKingApproval: true }).validation.decision, "fail");
    assert.equal(engine.calculateGrossProfit({ ...baseline, implementQ906OrLater: true }).validation.decision, "fail");
    assert.equal(engine.calculateGrossProfit({ ...baseline, missionId: "Q9-06" }).validation.decision, "fail");
    assert.equal(engine.calculateGrossProfit({ ...baseline, missionId: "Q9-07" }).validation.decision, "fail");
  });

  test("12 exposes Q906 consumable contract and cockpit snapshot; supports multi-business analysis", async () => {
    const engine = await build();
    const analysed = engine.analyseProfitabilityByBusiness({
      currency: "SGD",
      financialLineItems: [
        { category: "revenue", amountMinor: 600000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t12-rev1", realised: true, fabricated: false },
        { category: "cogs", amountMinor: 100000, currency: "SGD", businessId: BIZ, sourceRef: "prfw-t12-cogs1", realised: true, fabricated: false },
        { category: "revenue", amountMinor: 400000, currency: "SGD", businessId: BIZ2, sourceRef: "prfw-t12-rev2", realised: true, fabricated: false },
        { category: "cogs", amountMinor: 250000, currency: "SGD", businessId: BIZ2, sourceRef: "prfw-t12-cogs2", realised: true, fabricated: false },
      ],
      validated: true,
    });
    assert.equal(analysed.action, "analyse_profitability_by_business");
    assert.equal(analysed.analyses.length, 2);
    const biz1 = analysed.analyses.find((a) => a.scopeId === BIZ)!;
    const biz2 = analysed.analyses.find((a) => a.scopeId === BIZ2)!;
    assert.equal(biz1.netProfit.minorUnits, 500000);
    assert.equal(biz2.netProfit.minorUnits, 150000);
    assert.equal(biz1.fabricated, false);
    assert.ok(biz1.sourceRefs.length > 0);

    const stored = engine.getAnalyses("business");
    assert.equal(stored.length, 2);

    const contract = engine.getQ906ConsumableContract();
    assert.equal(contract.missionId, "Q9-05");
    assert.equal(contract.consumerMissionId, "Q9-06");
    assert.equal(contract.neverImplementQ906OrLater, true);
    assert.ok(contract.exposedFields.includes("profitDrivers"));
    assert.ok(contract.costCategoryCatalog.includes("revenue"));
    assert.ok(contract.currencyCatalog.includes("SGD"));

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q9-05");
    assert.equal(cockpit.neverFabricateRevenueCostFeeRefundOrProfitabilityFigures, true);
    assert.equal(cockpit.neverForecastFutureProfitability, true);
    assert.equal(cockpit.neverApproveSpending, true);
    assert.equal(cockpit.neverExecuteFinancialTransactions, true);
    assert.equal(cockpit.neverReplaceForecastingWorker, true);
    assert.equal(cockpit.neverImplementQ906OrLater, true);
    assert.equal(cockpit.consumableByQ906, true);
    assert.ok(cockpit.totalAnalyses >= 2);
    assert.equal(cockpit.workerId, "wkr-profitability-01");

    const list = engine.list();
    assert.equal(list.action, "list");
    assert.ok(list.analyses.length >= 2);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(diagnostics.validation.decision === "pass" || diagnostics.validation.decision === "partial");
  });
});
