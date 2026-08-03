import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildForecastingWorkerConfiguration,
  createForecastingWorker,
  resetForecastingWorkerForTesting,
  type FrcwInput,
  type HistoricalPoint,
} from "../../forecasting-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../../");

async function build(config?: Parameters<typeof createForecastingWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createForecastingWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const BIZ = "frcw-biz-growth-01";
const BIZ2 = "frcw-biz-scale-02";

function hist(
  periodLabel: string,
  amountMinor: number,
  metric: HistoricalPoint["metric"],
  sourceRef: string,
  businessId: string = BIZ,
  currency = "SGD",
): HistoricalPoint {
  return { periodLabel, amountMinor, currency, metric, businessId, sourceRef, isHistorical: true, fabricated: false };
}

describe("Q9-06 Forecasting Worker", () => {
  beforeEach(resetForecastingWorkerForTesting);

  test("1 locks mandatory forecasting-worker boundaries", () => {
    const c = buildForecastingWorkerConfiguration(REPO_ROOT, {
      neverFabricateHistoricalFinancialData: false as never,
      neverPresentForecastsAsGuaranteedOutcomes: false as never,
      neverExecuteInvestments: false as never,
      neverApproveBudgets: false as never,
      neverReplaceInvestmentPlanningWorker: false as never,
      neverModifyAccountingRecords: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ907OrLater: false as never,
      preserveForecastHistory: false as never,
    });
    assert.equal(c.neverFabricateHistoricalFinancialData, true);
    assert.equal(c.neverPresentForecastsAsGuaranteedOutcomes, true);
    assert.equal(c.neverExecuteInvestments, true);
    assert.equal(c.neverApproveBudgets, true);
    assert.equal(c.neverReplaceInvestmentPlanningWorker, true);
    assert.equal(c.neverModifyAccountingRecords, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ907OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveForecastHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-FRCW-001 for Q9-06 with forecast-model/scenario catalog", async () => {
    const engine = await build();
    const state = engine.getState();
    assert.equal(state.missionId, "Q9-06");
    assert.equal(state.engineVersion, "PILLOW-FRCW-001");
    for (const model of [
      "historical_trend",
      "rolling",
      "scenario",
      "sensitivity",
      "growth_assumption",
      "cost_assumption",
      "cash_runway",
      "profit_projection",
      "reinvestment",
    ]) {
      assert.ok(state.configuration.forecastModels.includes(model));
    }
    for (const scenario of ["best_case", "expected", "worst_case"]) {
      assert.ok(state.configuration.scenarioKinds.includes(scenario));
    }
    assert.equal(state.configuration.workerId, "wkr-forecasting-01");
  });

  test("3 consumes verified historical series and rejects empty-history fabrication", async () => {
    const engine = await build();
    const withHistory = engine.forecastRevenue({
      capitalBusinessId: BIZ,
      currency: "SGD",
      historicalSeries: [
        hist("2026-01", 100000, "revenue", "frcw-t3-rev1"),
        hist("2026-02", 110000, "revenue", "frcw-t3-rev2"),
      ],
      validated: true,
    });
    assert.equal(withHistory.action, "forecast_revenue");
    assert.equal(withHistory.validation.decision, "pass");
    assert.ok(withHistory.revenueForecast);
    assert.equal(withHistory.historicalBaseline!.points.length, 2);
    assert.ok(withHistory.historicalBaseline!.points.every((p) => p.isHistorical === true));

    const engineEmpty = await build();
    const noHistory = engineEmpty.forecastRevenue({
      capitalBusinessId: BIZ2,
      currency: "SGD",
      validated: true,
    });
    assert.equal(noHistory.action, "forecast_revenue");
    assert.equal(noHistory.validation.decision, "fail");
    assert.equal(noHistory.revenueForecast, null);
    assert.ok(
      noHistory.validation.errors.some((e) => e.toLowerCase().includes("never fabricates historical financial data")),
    );
  });

  test("4 generates a revenue forecast clearly separated from history (isForecast true)", async () => {
    const engine = await build();
    const result = engine.forecastRevenue({
      capitalBusinessId: BIZ,
      currency: "SGD",
      horizonPeriods: 3,
      historicalSeries: [
        hist("2026-01", 100000, "revenue", "frcw-t4-rev1"),
        hist("2026-02", 110000, "revenue", "frcw-t4-rev2"),
      ],
      validated: true,
    });
    assert.equal(result.validation.decision, "pass");
    const series = result.revenueForecast!;
    assert.equal(series.metric, "revenue");
    assert.equal(series.scenario, "expected");
    assert.equal(series.growthRateBps, 1000);
    assert.equal(series.points.length, 3);
    assert.equal(series.points[0]!.periodLabel, "2026-03");
    assert.equal(series.points[0]!.amountMinor, 121000);
    assert.equal(series.points[1]!.amountMinor, 133100);
    assert.equal(series.points[2]!.amountMinor, 146410);
    for (const point of series.points) {
      assert.equal(point.isForecast, true);
      assert.equal(point.isHistorical, false);
      assert.equal(point.fabricated, false);
      assert.ok(point.assumptionRefs.length > 0);
    }
    assert.equal(result.historicalBaseline!.points.length, 2);
    assert.ok(result.historicalBaseline!.points.every((p) => p.isHistorical === true && p.isForecast === undefined));
    assert.ok(result.forecastAssumptions!.length >= 1);
  });

  test("5 generates a cost forecast using an explicit costGrowthRateBps", async () => {
    const engine = await build();
    const result = engine.forecastCosts({
      capitalBusinessId: BIZ,
      currency: "SGD",
      horizonPeriods: 2,
      costGrowthRateBps: 800,
      historicalSeries: [
        hist("2026-01", 40000, "cost", "frcw-t5-cost1"),
        hist("2026-02", 41000, "cost", "frcw-t5-cost2"),
      ],
      validated: true,
    });
    assert.equal(result.action, "forecast_costs");
    assert.equal(result.validation.decision, "pass");
    const series = result.costForecast!;
    assert.equal(series.metric, "cost");
    assert.equal(series.growthRateBps, 800);
    assert.equal(series.points.length, 2);
    assert.equal(series.points[0]!.amountMinor, 44280);
    assert.equal(series.points[1]!.amountMinor, 47822);
    assert.ok(series.points.every((p) => p.isForecast === true));
  });

  test("6 generates a cashflow forecast as revenue minus cost, period-aligned", async () => {
    const engine = await build();
    const result = engine.forecastCashflow({
      capitalBusinessId: BIZ,
      currency: "SGD",
      horizonPeriods: 2,
      historicalSeries: [
        hist("2026-01", 100000, "revenue", "frcw-t6-rev1"),
        hist("2026-02", 110000, "revenue", "frcw-t6-rev2"),
        hist("2026-01", 40000, "cost", "frcw-t6-cost1"),
        hist("2026-02", 42000, "cost", "frcw-t6-cost2"),
      ],
      validated: true,
    });
    assert.equal(result.action, "forecast_cashflow");
    assert.equal(result.validation.decision, "pass");
    const revenue = result.revenueForecast!;
    const cost = result.costForecast!;
    const cashflow = result.cashflowForecast!;
    assert.equal(cashflow.metric, "net_cashflow");
    assert.equal(cashflow.points.length, 2);
    for (let i = 0; i < cashflow.points.length; i += 1) {
      assert.equal(cashflow.points[i]!.amountMinor, revenue.points[i]!.amountMinor - cost.points[i]!.amountMinor);
      assert.equal(cashflow.points[i]!.isForecast, true);
    }
    assert.equal(cashflow.points[0]!.amountMinor, 76900);
  });

  test("7 estimates cash runway from verified net_cashflow evidence and opening cash", async () => {
    const engine = await build();
    const result = engine.estimateCashRunway({
      capitalBusinessId: BIZ,
      currency: "SGD",
      openingCashMinor: 500000,
      historicalSeries: [
        hist("2026-01", -20000, "net_cashflow", "frcw-t7-cf1"),
        hist("2026-02", -30000, "net_cashflow", "frcw-t7-cf2"),
        hist("2026-03", -25000, "net_cashflow", "frcw-t7-cf3"),
      ],
      validated: true,
    });
    assert.equal(result.action, "estimate_cash_runway");
    assert.equal(result.validation.decision, "pass");
    const runway = result.cashRunway!;
    assert.equal(runway.runwayStatus, "burning");
    assert.equal(runway.monthlyNetBurnMinor.minorUnits, 25000);
    assert.equal(runway.openingCashMinor.minorUnits, 500000);
    assert.equal(runway.runwayMonths, 20);
    assert.equal(runway.runwayDays, 600);
    assert.equal(runway.isForecast, true);
    assert.equal(runway.fabricated, false);
    assert.ok(runway.supportingEvidence.length === 3);

    const engineSurplus = await build();
    const surplus = engineSurplus.estimateCashRunway({
      capitalBusinessId: BIZ,
      currency: "SGD",
      openingCashMinor: 200000,
      historicalSeries: [
        hist("2026-01", 15000, "net_cashflow", "frcw-t7-surplus1"),
        hist("2026-02", 17000, "net_cashflow", "frcw-t7-surplus2"),
      ],
      validated: true,
    });
    assert.equal(surplus.cashRunway!.runwayStatus, "surplus");
    assert.equal(surplus.cashRunway!.runwayMonths, null);
    assert.equal(surplus.cashRunway!.runwayDays, null);
    assert.ok(surplus.cashRunway!.monthlySurplusMinor.minorUnits > 0);
  });

  test("8 generates a profit forecast from historical profit trend", async () => {
    const engine = await build();
    const result = engine.forecastProfitability({
      capitalBusinessId: BIZ,
      currency: "SGD",
      horizonPeriods: 1,
      historicalSeries: [
        hist("2026-01", 50000, "profit", "frcw-t8-profit1"),
        hist("2026-02", 55000, "profit", "frcw-t8-profit2"),
      ],
      validated: true,
    });
    assert.equal(result.action, "forecast_profitability");
    assert.equal(result.validation.decision, "pass");
    const series = result.profitForecast!;
    assert.equal(series.metric, "profit");
    assert.equal(series.model, "profit_projection");
    assert.equal(series.growthRateBps, 1000);
    assert.equal(series.points[0]!.amountMinor, 60500);
    assert.equal(series.points[0]!.isForecast, true);

    const engineFallback = await build();
    const fallback = engineFallback.forecastProfitability({
      capitalBusinessId: BIZ2,
      currency: "SGD",
      horizonPeriods: 1,
      historicalSeries: [
        hist("2026-01", 100000, "revenue", "frcw-t8-rev1", BIZ2),
        hist("2026-02", 110000, "revenue", "frcw-t8-rev2", BIZ2),
        hist("2026-01", 40000, "cost", "frcw-t8-cost1", BIZ2),
        hist("2026-02", 42000, "cost", "frcw-t8-cost2", BIZ2),
      ],
      validated: true,
    });
    assert.equal(fallback.validation.decision, "pass");
    assert.equal(fallback.profitForecast!.model, "profit_projection");
    assert.equal(fallback.profitForecast!.points[0]!.amountMinor, 121000 - 44100);
  });

  test("9 produces structural reinvestment options sized from a real monthly surplus", async () => {
    const engine = await build();
    const result = engine.recommendReinvestmentOptions({
      capitalBusinessId: BIZ,
      currency: "SGD",
      openingCashMinor: 400000,
      historicalSeries: [
        hist("2026-01", 30000, "net_cashflow", "frcw-t9-cf1"),
        hist("2026-02", 32000, "net_cashflow", "frcw-t9-cf2"),
        hist("2026-03", 31000, "net_cashflow", "frcw-t9-cf3"),
      ],
      validated: true,
    });
    assert.equal(result.action, "recommend_reinvestment_options");
    assert.equal(result.validation.decision, "pass");
    assert.equal(result.reinvestmentOptions.length, 3);
    for (const option of result.reinvestmentOptions) {
      assert.equal(option.isForecast, true);
      assert.equal(option.fabricated, false);
      assert.ok(option.recommendedAmountMinor.minorUnits > 0);
      assert.ok(option.riskNotes.length > 0);
      assert.ok(option.riskNotes.some((n) => n.toLowerCase().includes("never executes investments")));
    }
    assert.equal(result.reinvestmentOptions[0]!.recommendedAmountMinor.minorUnits, 7750);
    assert.equal(result.reinvestmentOptions[1]!.recommendedAmountMinor.minorUnits, 15500);
    assert.equal(result.reinvestmentOptions[2]!.recommendedAmountMinor.minorUnits, 23250);

    const engineBurning = await build();
    const burning = engineBurning.recommendReinvestmentOptions({
      capitalBusinessId: BIZ,
      currency: "SGD",
      openingCashMinor: 100000,
      historicalSeries: [hist("2026-01", -10000, "net_cashflow", "frcw-t9-burn1")],
      validated: true,
    });
    assert.equal(burning.reinvestmentOptions.length, 0);
  });

  test("10 produces a full Forecasting Report with consumableByQ907 and submits through ERR", async () => {
    const engine = await build({
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: () => ({ records: [{ reportId: `ert-frcw-test-${Date.now()}` }] }),
        },
        auditRuntime: {
          recordAuditEntry: () => ({ accepted: true }),
        },
      },
    });
    const result = engine.produceForecastingReport({
      capitalBusinessId: BIZ,
      capitalProjectId: "capfc-prj-0001",
      forecastPeriod: "2026-H2",
      currency: "SGD",
      horizonPeriods: 3,
      openingCashMinor: 500000,
      historicalSeries: [
        hist("2026-01", 100000, "revenue", "frcw-t10-rev1"),
        hist("2026-02", 110000, "revenue", "frcw-t10-rev2"),
        hist("2026-01", 40000, "cost", "frcw-t10-cost1"),
        hist("2026-02", 42000, "cost", "frcw-t10-cost2"),
        hist("2026-01", -20000, "net_cashflow", "frcw-t10-cf1"),
        hist("2026-02", -15000, "net_cashflow", "frcw-t10-cf2"),
      ],
      validated: true,
    });
    assert.equal(result.action, "produce_forecasting_report");
    const report = result.latestReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.forecastPeriod, "2026-H2");
    assert.equal(report.capitalBusinessId, BIZ);
    assert.equal(report.capitalProjectId, "capfc-prj-0001");
    assert.ok(report.revenueForecast.points.every((p) => p.isForecast === true));
    assert.ok(report.costForecast.points.every((p) => p.isForecast === true));
    assert.ok(report.cashflowForecast.points.every((p) => p.isForecast === true));
    assert.ok(report.profitForecast.points.every((p) => p.isForecast === true));
    assert.equal(report.historicalBaseline.isHistorical, true);
    assert.ok(report.historicalBaseline.points.every((p) => p.isHistorical === true));
    assert.ok(report.historicalBaseline.points.length >= 6);
    assert.ok(report.cashRunway);
    assert.ok(Array.isArray(report.reinvestmentOptions));
    assert.ok(Array.isArray(report.forecastAssumptions));
    assert.ok(report.forecastAssumptions.length > 0);
    assert.ok(report.confidenceAssessment);
    assert.ok(typeof report.confidenceAssessment.overallConfidenceBps === "number");
    assert.ok(report.scenarioComparison.scenarios.length === 3);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 100);
    assert.equal(report.consumableByQ907, true);
    assert.equal(report.neverFabricateHistoricalFinancialData, true);
    assert.equal(report.neverPresentForecastsAsGuaranteedOutcomes, true);
    assert.equal(report.neverExecuteInvestments, true);
    assert.equal(report.neverApproveBudgets, true);
    assert.equal(report.neverReplaceInvestmentPlanningWorker, true);
    assert.equal(report.neverModifyAccountingRecords, true);
    assert.equal(report.neverBypassGrandKingApproval, true);
    assert.equal(report.preserveCompleteTraceability, true);
    assert.equal(report.preserveForecastHistory, true);

    const submit = engine.submitReport({ capitalBusinessId: BIZ, validated: true });
    assert.equal(submit.action, "submit_report");
    assert.ok(submit.validation.decision === "pass" || submit.validation.decision === "partial");
    assert.equal(submit.latestReport!.submittedToExecutiveReporting, true);
    assert.ok(submit.latestReport!.executiveReportId);
    assert.equal(submit.latestReport!.auditStatus, "passed");

    assert.ok(engine.getReports().length >= 1);
  });

  test("11 rejects Q9-07+ missions and every forbidden Forecasting Worker boundary", async () => {
    const engine = await build();
    const baseline: FrcwInput = {
      capitalBusinessId: BIZ,
      currency: "SGD",
      historicalSeries: [
        hist("2026-01", 100000, "revenue", "frcw-t11-rev1"),
        hist("2026-02", 110000, "revenue", "frcw-t11-rev2"),
      ],
      validated: true,
    };

    assert.equal(engine.forecastRevenue({ ...baseline, fabricateHistoricalFinancialData: true }).validation.decision, "fail");
    assert.equal(engine.forecastRevenue({ ...baseline, presentForecastsAsGuaranteedOutcomes: true }).validation.decision, "fail");
    assert.equal(engine.forecastRevenue({ ...baseline, executeInvestments: true }).validation.decision, "fail");
    assert.equal(engine.forecastRevenue({ ...baseline, approveBudgets: true }).validation.decision, "fail");
    assert.equal(engine.forecastRevenue({ ...baseline, replaceInvestmentPlanningWorker: true }).validation.decision, "fail");
    assert.equal(engine.forecastRevenue({ ...baseline, modifyAccountingRecords: true }).validation.decision, "fail");
    assert.equal(engine.forecastRevenue({ ...baseline, overrideApprovedArchitecture: true }).validation.decision, "fail");
    assert.equal(engine.forecastRevenue({ ...baseline, overridePillow: true }).validation.decision, "fail");
    assert.equal(engine.forecastRevenue({ ...baseline, overrideGrandKing: true }).validation.decision, "fail");
    assert.equal(engine.forecastRevenue({ ...baseline, bypassGrandKingApproval: true }).validation.decision, "fail");
    assert.equal(engine.forecastRevenue({ ...baseline, implementQ907OrLater: true }).validation.decision, "fail");
    assert.equal(engine.forecastRevenue({ ...baseline, missionId: "Q9-07" }).validation.decision, "fail");
    assert.equal(engine.forecastRevenue({ ...baseline, missionId: "Q9-08" }).validation.decision, "fail");
  });

  test("12 exposes Q907 consumable contract and cockpit snapshot; compares best/expected/worst scenarios", async () => {
    const engine = await build();
    const compared = engine.compareScenarios({
      capitalBusinessId: BIZ,
      currency: "SGD",
      horizonPeriods: 2,
      openingCashMinor: 500000,
      historicalSeries: [
        hist("2026-01", 100000, "revenue", "frcw-t12-rev1"),
        hist("2026-02", 110000, "revenue", "frcw-t12-rev2"),
        hist("2026-01", 40000, "cost", "frcw-t12-cost1"),
        hist("2026-02", 42000, "cost", "frcw-t12-cost2"),
      ],
      validated: true,
    });
    assert.equal(compared.action, "compare_scenarios");
    assert.equal(compared.validation.decision === "pass" || compared.validation.decision === "partial", true);
    const comparison = compared.scenarioComparison!;
    assert.equal(comparison.scenarios.length, 3);
    const best = comparison.scenarios.find((s) => s.scenario === "best_case")!;
    const expected = comparison.scenarios.find((s) => s.scenario === "expected")!;
    const worst = comparison.scenarios.find((s) => s.scenario === "worst_case")!;
    assert.ok(best);
    assert.ok(expected);
    assert.ok(worst);
    assert.equal(best.growthRateBps, expected.growthRateBps + 500);
    assert.equal(worst.growthRateBps, expected.growthRateBps - 500);
    assert.ok(best.endingRevenueMinor.minorUnits > expected.endingRevenueMinor.minorUnits);
    assert.ok(expected.endingRevenueMinor.minorUnits > worst.endingRevenueMinor.minorUnits);
    assert.equal(comparison.isForecast, true);
    assert.equal(comparison.fabricated, false);

    const contract = engine.getQ907ConsumableContract();
    assert.equal(contract.missionId, "Q9-06");
    assert.equal(contract.consumerMissionId, "Q9-07");
    assert.equal(contract.neverImplementQ907OrLater, true);
    assert.ok(contract.exposedFields.includes("cashRunway"));
    assert.ok(contract.exposedFields.includes("reinvestmentOptions"));
    assert.ok(contract.forecastModelCatalog.includes("historical_trend"));
    assert.ok(contract.currencyCatalog.includes("SGD"));

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q9-06");
    assert.equal(cockpit.neverFabricateHistoricalFinancialData, true);
    assert.equal(cockpit.neverPresentForecastsAsGuaranteedOutcomes, true);
    assert.equal(cockpit.neverExecuteInvestments, true);
    assert.equal(cockpit.neverApproveBudgets, true);
    assert.equal(cockpit.neverReplaceInvestmentPlanningWorker, true);
    assert.equal(cockpit.neverImplementQ907OrLater, true);
    assert.equal(cockpit.consumableByQ907, true);
    assert.ok(cockpit.totalForecastSeries >= 1);
    assert.equal(cockpit.workerId, "wkr-forecasting-01");

    const list = engine.list();
    assert.equal(list.action, "list");

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(diagnostics.validation.decision === "pass" || diagnostics.validation.decision === "partial");
  });
});
