import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildFinancialReportingWorkerConfiguration,
  createFinancialReportingWorker,
  resetFinancialReportingWorkerForTesting,
  type FrwInput,
} from "../../financial-reporting-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../../");

async function build(config?: Parameters<typeof createFinancialReportingWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createFinancialReportingWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const BIZ = "frw-biz-alpha-01";
const PERIOD = "2026-Q2";

function baseInput(overrides: Partial<FrwInput> = {}): FrwInput {
  return {
    capitalBusinessId: BIZ,
    capitalProjectId: "cap-proj-frw-01",
    reportingPeriod: PERIOD,
    currency: "SGD",
    validated: true,
    revenueSnapshot: {
      totalRevenueMinor: 5_000_000,
      currency: "SGD",
      sourceRefs: ["acct-rev-2026-q2"],
      fabricated: false,
    },
    expenseSnapshot: {
      totalExpenseMinor: 3_200_000,
      currency: "SGD",
      sourceRefs: ["acct-exp-2026-q2"],
      fabricated: false,
    },
    cashflowSnapshot: {
      netCashflowMinor: 800_000,
      closingCashBalanceMinor: 2_500_000,
      openingCashBalanceMinor: 1_700_000,
      currency: "SGD",
      sourceRefs: ["cf-report-2026-q2"],
      fabricated: false,
    },
    budgetSnapshot: {
      availableBudgetMinor: 1_000_000,
      allocatedBudgetMinor: 750_000,
      currency: "SGD",
      sourceRefs: ["budget-report-2026-q2"],
      fabricated: false,
    },
    profitabilitySnapshot: {
      grossProfitMinor: 1_800_000,
      operatingProfitMinor: 1_200_000,
      netProfitMinor: 900_000,
      currency: "SGD",
      sourceRefs: ["profit-report-2026-q2"],
      fabricated: false,
    },
    forecastSnapshot: {
      projectedRevenueMinor: 5_500_000,
      projectedExpensesMinor: 3_400_000,
      currency: "SGD",
      sourceRefs: ["forecast-report-2026-q3"],
      fabricated: false,
    },
    investmentSnapshot: {
      availableCapitalMinor: 2_000_000,
      evaluatedOpportunityCount: 3,
      currency: "SGD",
      sourceRefs: ["ipw-report-2026-q2"],
      fabricated: false,
    },
    taxSupportSnapshot: {
      estimatedTaxLiabilityMinor: 150_000,
      currency: "SGD",
      sourceRefs: ["tax-report-2026-q2"],
      fabricated: false,
    },
    ...overrides,
  };
}

describe("Q9-09 Financial Reporting Worker", () => {
  beforeEach(resetFinancialReportingWorkerForTesting);

  test("1 locks mandatory financial-reporting-worker boundaries", () => {
    const c = buildFinancialReportingWorkerConfiguration(REPO_ROOT, {
      neverExecuteFinancialTransactions: false as never,
      neverApproveFinancialDecisions: false as never,
      neverModifyAccountingRecords: false as never,
      neverFabricateFinancialFigures: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ910OrLater: false as never,
      preserveReportHistory: false as never,
    });
    assert.equal(c.neverExecuteFinancialTransactions, true);
    assert.equal(c.neverApproveFinancialDecisions, true);
    assert.equal(c.neverModifyAccountingRecords, true);
    assert.equal(c.neverFabricateFinancialFigures, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ910OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveReportHistory, true);
    assert.equal(c.measuredDataDistinctFromProjections, true);
    assert.equal(c.structuralSignalOnly, true);
  });

  test("2 initializes PILLOW-FRW-001 for Q9-09 with reporting catalog", async () => {
    const engine = await build();
    const state = engine.getState();
    assert.equal(state.missionId, "Q9-09");
    assert.equal(state.engineVersion, "PILLOW-FRW-001");
    assert.equal(state.configuration.workerId, "wkr-financial-reporting-01");
    assert.ok(state.configuration.reportSectionKinds.includes("revenue"));
    assert.ok(state.configuration.dashboardWidgetKinds.includes("revenue_kpi"));
  });

  test("3 generates executive dashboard from verified snapshots", async () => {
    const engine = await build();
    const result = engine.generateExecutiveDashboard(baseInput());
    assert.equal(result.action, "generate_executive_dashboard");
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.executiveDashboard);
    assert.ok(result.executiveDashboard!.widgets.length >= 5);
    assert.ok(result.executiveDashboard!.kpis.factualSourceCount >= 1);
  });

  test("4 builds revenue summary from verified snapshot only", async () => {
    const engine = await build();
    const produced = engine.produceFinancialReport(baseInput());
    const summary = produced.financialReport!.revenueSummary;
    assert.equal(summary.status, "available");
    assert.equal(summary.recordKind, "factual_measured");
    assert.equal(summary.totalRevenue?.minorUnits, 5_000_000);
    assert.equal(summary.fabricated, false);
    assert.ok(summary.sourceRefs.includes("acct-rev-2026-q2"));
  });

  test("5 builds cashflow summary from verified snapshot", async () => {
    const engine = await build();
    const produced = engine.produceFinancialReport(baseInput());
    const summary = produced.financialReport!.cashflowSummary;
    assert.equal(summary.status, "available");
    assert.equal(summary.netCashflow?.minorUnits, 800_000);
    assert.equal(summary.closingCashBalance?.minorUnits, 2_500_000);
    assert.equal(summary.fabricated, false);
  });

  test("6 builds budget summary from verified snapshot", async () => {
    const engine = await build();
    const produced = engine.produceFinancialReport(baseInput());
    const summary = produced.financialReport!.budgetSummary;
    assert.equal(summary.status, "available");
    assert.equal(summary.availableBudget?.minorUnits, 1_000_000);
    assert.equal(summary.allocatedBudget?.minorUnits, 750_000);
    assert.equal(summary.fabricated, false);
  });

  test("7 builds profitability summary from verified snapshot", async () => {
    const engine = await build();
    const produced = engine.produceFinancialReport(baseInput());
    const summary = produced.financialReport!.profitabilitySummary;
    assert.equal(summary.status, "available");
    assert.equal(summary.netProfit?.minorUnits, 900_000);
    assert.equal(summary.grossProfit?.minorUnits, 1_800_000);
    assert.equal(summary.fabricated, false);
  });

  test("8 builds capital summary from cashflow and investment context", async () => {
    const engine = await build();
    const result = engine.generateCapitalSummary(baseInput());
    assert.equal(result.action, "generate_capital_summary");
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.capitalSummary);
    assert.equal(result.capitalSummary!.status, "available");
    assert.equal(result.capitalSummary!.closingCashBalance?.minorUnits, 2_500_000);
    assert.equal(result.capitalSummary!.availableCapital?.minorUnits, 2_000_000);
    assert.equal(result.capitalSummary!.fabricated, false);
  });

  test("9 produces consolidated Financial Report with consumableByQ910", async () => {
    const engine = await build();
    const produced = engine.produceFinancialReport(baseInput());
    assert.equal(produced.action, "produce_financial_report");
    assert.equal(produced.validation.decision, "pass");
    const report = produced.financialReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.capitalProjectId, "cap-proj-frw-01");
    assert.equal(report.reportingPeriod, PERIOD);
    assert.ok(report.executiveDashboard);
    assert.ok(report.revenueSummary);
    assert.ok(report.expenseSummary);
    assert.ok(report.cashflowSummary);
    assert.ok(report.budgetSummary);
    assert.ok(report.profitabilitySummary);
    assert.ok(report.forecastSummary);
    assert.equal(report.forecastSummary.recordKind, "projected_caller_supplied");
    assert.ok(report.investmentSummary);
    assert.ok(report.taxSupportSummary);
    assert.ok(report.capitalSummary);
    assert.ok(report.enterpriseKpis);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.equal(typeof report.confidenceScore, "number");
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.equal(report.metadataVersion, "FRW-001-v1");
    assert.equal(report.consumableByQ910, true);
    assert.equal(report.neverExecuteFinancialTransactions, true);
    assert.equal(report.neverFabricateFinancialFigures, true);
    assert.equal(report.measuredDataDistinctFromProjections, true);
  });

  test("10 rejects fabricated snapshots and unvalidated input", async () => {
    const engine = await build();
    const unvalidated = engine.produceFinancialReport(baseInput({ validated: false }));
    assert.equal(unvalidated.validation.decision, "fail");

    const noRefs = engine.produceFinancialReport(
      baseInput({
        revenueSnapshot: {
          totalRevenueMinor: 100,
          currency: "SGD",
          sourceRefs: [],
          fabricated: false,
        },
      }),
    );
    assert.equal(noRefs.validation.decision, "fail");
  });

  test("11 rejects Q9-10+ mission requests", async () => {
    const engine = await build();
    const future = engine.produceFinancialReport({
      ...baseInput(),
      missionId: "Q9-10",
    } as FrwInput & { missionId: string });
    assert.equal(future.validation.decision, "fail");
    assert.ok(future.validation.errors.some((e) => /Q9-10/i.test(e)));
  });

  test("12 never executes or approves — Q910 contract and cockpit enforced", async () => {
    const engine = await build();
    engine.produceFinancialReport(baseInput());
    const contract = engine.getQ910ConsumableContract();
    assert.equal(contract.missionId, "Q9-09");
    assert.equal(contract.consumerMissionId, "Q9-10");
    assert.equal(contract.producedBy, "financial-reporting-worker");
    assert.equal(contract.neverImplementQ910OrLater, true);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.neverExecuteFinancialTransactions, true);
    assert.equal(cockpit.neverApproveFinancialDecisions, true);
    assert.equal(cockpit.consumableByQ910, true);
    const report = engine.getLatestReport()!;
    assert.equal(report.neverExecuteFinancialTransactions, true);
    assert.equal(report.neverApproveFinancialDecisions, true);
    assert.equal(report.neverModifyAccountingRecords, true);
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
  });
});
