import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildCashflowWorkerConfiguration,
  createCashflowWorker,
  moneyFromDecimal,
  resetCashflowWorkerForTesting,
  type CfwInput,
  type InjectedAccountingEntry,
} from "../../cashflow-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createCashflowWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createCashflowWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const BIZ = "cfw-biz-growth-01";

function incomeEntry(params: {
  entryId: string;
  businessId?: string;
  amount: number;
  timestamp: string;
  cashAccountId?: string;
  incomeAccountId?: string;
}): InjectedAccountingEntry {
  return {
    entryId: params.entryId,
    entryType: "income",
    businessId: params.businessId ?? BIZ,
    accountingPeriod: params.timestamp.slice(0, 7),
    timestamp: params.timestamp,
    currency: "SGD",
    lines: [
      { accountId: params.cashAccountId ?? "acct-cash-01", debit: params.amount, credit: 0, currency: "SGD" },
      { accountId: params.incomeAccountId ?? "acct-income-01", debit: 0, credit: params.amount, currency: "SGD" },
    ],
    traceabilityRefs: [`accw:entry:${params.entryId}`],
  };
}

function expenseEntry(params: {
  entryId: string;
  businessId?: string;
  amount: number;
  timestamp: string;
  cashAccountId?: string;
  expenseAccountId?: string;
}): InjectedAccountingEntry {
  return {
    entryId: params.entryId,
    entryType: "expense",
    businessId: params.businessId ?? BIZ,
    accountingPeriod: params.timestamp.slice(0, 7),
    timestamp: params.timestamp,
    currency: "SGD",
    lines: [
      { accountId: params.expenseAccountId ?? "acct-expense-01", debit: params.amount, credit: 0, currency: "SGD" },
      { accountId: params.cashAccountId ?? "acct-cash-01", debit: 0, credit: params.amount, currency: "SGD" },
    ],
    traceabilityRefs: [`accw:entry:${params.entryId}`],
  };
}

function transferEntry(params: {
  entryId: string;
  businessId?: string;
  amount: number;
  timestamp: string;
  fromAccountId: string;
  toAccountId: string;
}): InjectedAccountingEntry {
  return {
    entryId: params.entryId,
    entryType: "transfer",
    businessId: params.businessId ?? BIZ,
    accountingPeriod: params.timestamp.slice(0, 7),
    timestamp: params.timestamp,
    currency: "SGD",
    lines: [
      { accountId: params.fromAccountId, debit: 0, credit: params.amount, currency: "SGD" },
      { accountId: params.toAccountId, debit: params.amount, credit: 0, currency: "SGD" },
    ],
    traceabilityRefs: [`accw:entry:${params.entryId}`],
  };
}

describe("Q9-03 Cashflow Worker", () => {
  beforeEach(resetCashflowWorkerForTesting);

  test("1 locks mandatory cashflow-worker boundaries", () => {
    const c = buildCashflowWorkerConfiguration(REPO_ROOT, {
      neverFabricateBalancesOrFlows: false as never,
      neverCreateBudgets: false as never,
      neverForecastFutureCashflow: false as never,
      neverCalculateCompleteBusinessProfitability: false as never,
      neverApproveSpending: false as never,
      neverMoveMoney: false as never,
      neverModifyVerifiedAccountingRecords: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ904OrLater: false as never,
      preserveHistoricalReports: false as never,
    });
    assert.equal(c.neverFabricateBalancesOrFlows, true);
    assert.equal(c.neverCreateBudgets, true);
    assert.equal(c.neverForecastFutureCashflow, true);
    assert.equal(c.neverCalculateCompleteBusinessProfitability, true);
    assert.equal(c.neverApproveSpending, true);
    assert.equal(c.neverMoveMoney, true);
    assert.equal(c.neverModifyVerifiedAccountingRecords, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ904OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveHistoricalReports, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-CFW-001 for Q9-03 with reporting frequency catalog", async () => {
    const engine = await build();
    const state = engine.getState();
    assert.equal(state.missionId, "Q9-03");
    assert.equal(state.engineVersion, "PILLOW-CFW-001");
    for (const frequency of ["daily", "weekly", "monthly", "annual", "custom"]) {
      assert.ok(state.configuration.reportingFrequencies.includes(frequency));
    }
    assert.equal(state.configuration.workerId, "wkr-cashflow-01");
  });

  test("3 consumes verified accounting records (injected entries) — never fabricates on empty input", async () => {
    const engine = await build();

    const empty = engine.consumeAccountingRecords({ validated: true });
    assert.equal(empty.validation.decision, "fail");
    assert.ok(empty.validation.errors.some((e) => e.toLowerCase().includes("never fabricates")));

    const result = engine.consumeAccountingRecords({
      accountingEntries: [incomeEntry({ entryId: "e-income-01", amount: 1000, timestamp: "2026-08-03T10:00:00.000Z" })],
      validated: true,
    });
    assert.equal(result.action, "consume_accounting_records");
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.movements.length >= 1);
    const movement = result.movements.find((m) => m.sourceEntryId === "e-income-01")!;
    assert.equal(movement.direction, "inflow");
    assert.equal(movement.amountStatus, "recorded");
    assert.equal(movement.fabricated, false);
    assert.equal(movement.amountMinor.minorUnits, 100000);
    assert.equal(movement.amountMinor.currency, "SGD");
  });

  test("4 tracks cash inflows correctly from verified income entries", async () => {
    const engine = await build();
    engine.consumeAccountingRecords({
      accountingEntries: [
        incomeEntry({ entryId: "e-income-01", amount: 1000, timestamp: "2026-08-03T10:00:00.000Z" }),
        incomeEntry({ entryId: "e-income-02", amount: 500, timestamp: "2026-08-05T10:00:00.000Z" }),
      ],
      validated: true,
    });
    const result = engine.trackCashInflows({ capitalBusinessId: BIZ, validated: true });
    assert.equal(result.action, "track_cash_inflows");
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.inflowSummary);
    assert.equal(result.inflowSummary!.totalMinor.minorUnits, 150000);
    assert.equal(result.inflowSummary!.fabricated, false);
    assert.equal(result.inflowSummary!.movementCount, 2);
    assert.equal(result.movements.every((m) => m.direction === "inflow"), true);
  });

  test("5 tracks cash outflows correctly from verified expense entries", async () => {
    const engine = await build();
    engine.consumeAccountingRecords({
      accountingEntries: [
        incomeEntry({ entryId: "e-income-01", amount: 1000, timestamp: "2026-08-03T10:00:00.000Z" }),
        expenseEntry({ entryId: "e-expense-01", amount: 300, timestamp: "2026-08-04T10:00:00.000Z" }),
      ],
      validated: true,
    });
    const result = engine.trackCashOutflows({ capitalBusinessId: BIZ, validated: true });
    assert.equal(result.action, "track_cash_outflows");
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.outflowSummary);
    assert.equal(result.outflowSummary!.totalMinor.minorUnits, 30000);
    assert.equal(result.movements.every((m) => m.direction === "outflow"), true);
  });

  test("6 internal transfers are tracked separately and NOT counted as enterprise income/expense", async () => {
    const engine = await build();
    engine.consumeAccountingRecords({
      accountingEntries: [
        incomeEntry({ entryId: "e-income-01", amount: 1000, timestamp: "2026-08-03T10:00:00.000Z" }),
        transferEntry({
          entryId: "e-transfer-01",
          amount: 200,
          timestamp: "2026-08-04T10:00:00.000Z",
          fromAccountId: "acct-cash-01",
          toAccountId: "acct-cash-02",
        }),
      ],
      validated: true,
    });

    const inflows = engine.trackCashInflows({ capitalBusinessId: BIZ, validated: true });
    // Only the income movement counts as an enterprise inflow — the transfer_in leg must not appear here.
    assert.equal(inflows.inflowSummary!.totalMinor.minorUnits, 100000);
    assert.ok(inflows.movements.every((m) => m.direction === "inflow"));

    const outflows = engine.trackCashOutflows({ capitalBusinessId: BIZ, validated: true });
    assert.equal(outflows.outflowSummary!.totalMinor.minorUnits, 0);

    const net = engine.calculateNetCashflow({ capitalBusinessId: BIZ, validated: true });
    assert.equal(net.netCashflow!.minorUnits, 100000);

    const movements = engine.getMovements();
    const transferIn = movements.find((m) => m.direction === "transfer_in");
    const transferOut = movements.find((m) => m.direction === "transfer_out");
    assert.ok(transferIn);
    assert.ok(transferOut);
    assert.equal(transferIn!.amountMinor.minorUnits, 20000);
    assert.equal(transferOut!.amountMinor.minorUnits, 20000);
  });

  test("7 net cashflow and opening/closing balances reconcile", async () => {
    const engine = await build();
    engine.consumeAccountingRecords({
      accountingEntries: [
        incomeEntry({ entryId: "e-income-01", amount: 1000, timestamp: "2026-08-03T10:00:00.000Z" }),
        expenseEntry({ entryId: "e-expense-01", amount: 300, timestamp: "2026-08-04T10:00:00.000Z" }),
      ],
      validated: true,
    });

    const view = engine.produceMonthlyCashflowView({
      capitalBusinessId: BIZ,
      scope: "business",
      reportingPeriod: "2026-08",
      openingCashBalanceMinor: 50000,
      validated: true,
    });
    assert.equal(view.action, "produce_monthly_view");
    assert.equal(view.validation.decision, "pass");
    const v = view.view!;
    assert.equal(v.openingCashBalance.minorUnits, 50000);
    assert.equal(v.cashInflows.minorUnits, 100000);
    assert.equal(v.cashOutflows.minorUnits, 30000);
    assert.equal(v.netCashflow.minorUnits, 70000);
    // closing = opening + inflows - outflows (business scope, no transfers)
    assert.equal(v.closingCashBalance.minorUnits, 50000 + 70000);
    assert.equal(v.availableCash.minorUnits, v.closingCashBalance.minorUnits - v.restrictedCash.amountMinor.minorUnits);
    assert.equal(v.fabricated, false);
  });

  test("8 produces deterministic daily and weekly views", async () => {
    const engine = await build();
    engine.consumeAccountingRecords({
      accountingEntries: [
        incomeEntry({ entryId: "e-income-day", amount: 100, timestamp: "2026-08-03T10:00:00.000Z" }),
      ],
      validated: true,
    });

    const daily = engine.produceDailyCashflowView({
      capitalBusinessId: BIZ,
      scope: "business",
      reportingPeriod: "2026-08-03",
      validated: true,
    });
    assert.equal(daily.action, "produce_daily_view");
    assert.equal(daily.view!.reportingFrequency, "daily");
    assert.equal(daily.view!.periodLabel, "2026-08-03");
    assert.equal(daily.view!.periodStart.slice(0, 10), "2026-08-03");
    assert.equal(daily.view!.cashInflows.minorUnits, 10000);

    const weekly = engine.produceWeeklyCashflowView({
      capitalBusinessId: BIZ,
      scope: "business",
      reportingPeriod: "2026-08-03",
      validated: true,
    });
    assert.equal(weekly.action, "produce_weekly_view");
    assert.equal(weekly.view!.reportingFrequency, "weekly");
    // 2026-08-03 is a Monday, ISO week label should reflect that week.
    assert.match(weekly.view!.periodLabel, /^2026-W\d{2}$/);
    assert.equal(weekly.view!.cashInflows.minorUnits, 10000);

    const customMissing = engine.produceCustomCashflowView({ capitalBusinessId: BIZ, validated: true });
    assert.equal(customMissing.validation.decision, "fail");

    const custom = engine.produceCustomCashflowView({
      capitalBusinessId: BIZ,
      periodStart: "2026-08-01T00:00:00.000Z",
      periodEnd: "2026-08-31T23:59:59.999Z",
      validated: true,
    });
    assert.equal(custom.action, "produce_custom_view");
    assert.equal(custom.validation.decision, "pass");
    assert.equal(custom.view!.reportingFrequency, "custom");
  });

  test("9 produces monthly and annual views with period-over-period comparison", async () => {
    const engine = await build();
    engine.consumeAccountingRecords({
      accountingEntries: [
        incomeEntry({ entryId: "e-income-jul", amount: 1000, timestamp: "2026-07-15T10:00:00.000Z" }),
        incomeEntry({ entryId: "e-income-aug", amount: 2000, timestamp: "2026-08-15T10:00:00.000Z" }),
      ],
      validated: true,
    });

    const july = engine.produceMonthlyCashflowView({ capitalBusinessId: BIZ, reportingPeriod: "2026-07", validated: true });
    assert.equal(july.view!.periodLabel, "2026-07");
    assert.equal(july.view!.cashInflows.minorUnits, 100000);
    assert.equal(july.view!.periodComparison.evidencePresent, false);

    const august = engine.produceMonthlyCashflowView({ capitalBusinessId: BIZ, reportingPeriod: "2026-08", validated: true });
    assert.equal(august.view!.periodLabel, "2026-08");
    assert.equal(august.view!.cashInflows.minorUnits, 200000);
    assert.equal(august.view!.openingCashBalance.minorUnits, july.view!.closingCashBalance.minorUnits);
    assert.equal(august.view!.periodComparison.evidencePresent, true);
    assert.equal(august.view!.periodComparison.priorPeriodLabel, "2026-07");
    assert.equal(august.view!.periodComparison.changeInNetCashflow!.minorUnits, 100000);

    const annual = engine.produceAnnualCashflowView({ capitalBusinessId: BIZ, reportingPeriod: "2026", validated: true });
    assert.equal(annual.action, "produce_annual_view");
    assert.equal(annual.view!.periodLabel, "2026");
    assert.equal(annual.view!.cashInflows.minorUnits, 300000);
  });

  test("10 produces business-level and consolidated views; surfaces unreconciled movements", async () => {
    const engine = await build();
    engine.consumeAccountingRecords({
      accountingEntries: [
        incomeEntry({ entryId: "e-income-biz1", amount: 1000, timestamp: "2026-08-03T10:00:00.000Z" }),
        incomeEntry({
          entryId: "e-income-biz2",
          businessId: "cfw-biz-treasury-01",
          amount: 500,
          timestamp: "2026-08-04T10:00:00.000Z",
          cashAccountId: "acct-cash-treasury",
          incomeAccountId: "acct-income-treasury",
        }),
        {
          entryId: "e-unknown-01",
          entryType: "journal",
          businessId: BIZ,
          accountingPeriod: "2026-08",
          timestamp: "2026-08-06T10:00:00.000Z",
          currency: "SGD",
          lines: [
            { accountId: "acct-cash-01", debit: 75, credit: 0, currency: "SGD" },
            { accountId: "acct-misc-01", debit: 0, credit: 75, currency: "SGD" },
          ],
          traceabilityRefs: ["accw:entry:e-unknown-01"],
        },
      ],
      validated: true,
    });

    const businessView = engine.produceBusinessCashflowView({
      capitalBusinessId: BIZ,
      reportingPeriod: "2026-08",
      validated: true,
    });
    assert.equal(businessView.action, "produce_business_view");
    assert.equal(businessView.view!.scope, "business");
    assert.equal(businessView.view!.cashInflows.minorUnits, 100000);
    assert.ok(businessView.view!.unreconciledMovements.length >= 1);
    assert.equal(businessView.view!.reconciliationStatus, "partial");

    const consolidated = engine.produceConsolidatedCashflowView({ reportingPeriod: "2026-08", validated: true });
    assert.equal(consolidated.action, "produce_consolidated_view");
    assert.equal(consolidated.view!.scope, "enterprise");
    assert.equal(consolidated.view!.cashInflows.minorUnits, 150000);

    const unreconciled = engine.identifyUnreconciledMovements({ capitalBusinessId: BIZ, validated: true });
    assert.equal(unreconciled.action, "identify_unreconciled_movements");
    assert.ok(unreconciled.unreconciledMovements.some((m) => m.sourceEntryId === "e-unknown-01"));
    assert.ok(unreconciled.unreconciledMovements.every((m) => m.amountStatus === "pending" || m.amountStatus === "disputed"));
  });

  test("11 produces full Cashflow Report with consumableByQ904 and submits through ERR", async () => {
    const engine = await build({
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: () => ({ records: [{ reportId: `ert-cfw-test-${Date.now()}` }] }),
        },
        auditRuntime: {
          recordAuditEntry: () => ({ accepted: true }),
        },
      },
    });
    engine.consumeAccountingRecords({
      accountingEntries: [
        incomeEntry({ entryId: "e-income-01", amount: 1000, timestamp: "2026-08-03T10:00:00.000Z" }),
        expenseEntry({ entryId: "e-expense-01", amount: 300, timestamp: "2026-08-04T10:00:00.000Z" }),
      ],
      validated: true,
    });
    engine.produceDailyCashflowView({ capitalBusinessId: BIZ, reportingPeriod: "2026-08-03", validated: true });
    engine.produceWeeklyCashflowView({ capitalBusinessId: BIZ, reportingPeriod: "2026-08-03", validated: true });
    engine.produceAnnualCashflowView({ capitalBusinessId: BIZ, reportingPeriod: "2026", validated: true });

    const result = engine.produceCashflowReport({
      capitalBusinessId: BIZ,
      capitalProjectId: "capfc-prj-0001",
      reportingPeriod: "2026-08",
      reportingFrequency: "monthly",
      validated: true,
    });
    assert.equal(result.action, "produce_cashflow_report");
    const report = result.latestReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.reportingPeriod, "2026-08");
    assert.equal(report.reportingFrequency, "monthly");
    assert.ok(report.cashInflowSummary);
    assert.ok(report.cashOutflowSummary);
    assert.equal(report.netCashflow.minorUnits, 70000);
    assert.ok(report.transfersSummary);
    assert.ok(report.restrictedCash);
    assert.ok(report.periodComparison);
    assert.ok(report.liquidityStatus);
    assert.ok(Array.isArray(report.sourceRecordReferences));
    assert.ok(report.reconciliationStatus);
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 100);
    assert.equal(report.capitalBusinessId, BIZ);
    assert.equal(report.capitalProjectId, "capfc-prj-0001");
    assert.ok(report.views.daily.length >= 1);
    assert.ok(report.views.weekly.length >= 1);
    assert.ok(report.views.monthly.length >= 1);
    assert.ok(report.views.annual.length >= 1);
    assert.equal(report.consumableByQ904, true);
    assert.equal(report.neverFabricateBalancesOrFlows, true);
    assert.equal(report.neverCreateBudgets, true);
    assert.equal(report.neverForecastFutureCashflow, true);
    assert.equal(report.neverCalculateCompleteBusinessProfitability, true);
    assert.equal(report.neverApproveSpending, true);
    assert.equal(report.neverMoveMoney, true);
    assert.equal(report.neverModifyVerifiedAccountingRecords, true);
    assert.equal(report.neverBypassGrandKingApproval, true);
    assert.equal(report.preserveCompleteTraceability, true);
    assert.equal(report.preserveHistoricalReports, true);

    const submit = engine.submitReport({ capitalBusinessId: BIZ, validated: true });
    assert.equal(submit.action, "submit_report");
    assert.ok(submit.validation.decision === "pass" || submit.validation.decision === "partial");
    assert.equal(submit.latestReport!.submittedToExecutiveReporting, true);
    assert.ok(submit.latestReport!.executiveReportId);
    assert.equal(submit.latestReport!.auditStatus, "passed");

    // Historical reports are preserved, not overwritten.
    assert.ok(engine.getReports().length >= 1);
  });

  test("12 rejects Q9-04+ missions and every forbidden CFW boundary; exposes Q904 contract and cockpit", async () => {
    const engine = await build();
    engine.consumeAccountingRecords({
      accountingEntries: [incomeEntry({ entryId: "e-income-01", amount: 1000, timestamp: "2026-08-03T10:00:00.000Z" })],
      validated: true,
    });
    const baseline: CfwInput = { capitalBusinessId: BIZ, validated: true };

    assert.equal(engine.trackCashInflows({ ...baseline, fabricateBalancesOrFlows: true }).validation.decision, "fail");
    assert.equal(engine.trackCashInflows({ ...baseline, createBudgets: true }).validation.decision, "fail");
    assert.equal(engine.trackCashInflows({ ...baseline, forecastFutureCashflow: true }).validation.decision, "fail");
    assert.equal(
      engine.trackCashInflows({ ...baseline, calculateCompleteBusinessProfitability: true }).validation.decision,
      "fail",
    );
    assert.equal(engine.trackCashInflows({ ...baseline, approveSpending: true }).validation.decision, "fail");
    assert.equal(engine.trackCashInflows({ ...baseline, moveMoney: true }).validation.decision, "fail");
    assert.equal(
      engine.trackCashInflows({ ...baseline, modifyVerifiedAccountingRecords: true }).validation.decision,
      "fail",
    );
    assert.equal(engine.trackCashInflows({ ...baseline, overrideApprovedArchitecture: true }).validation.decision, "fail");
    assert.equal(engine.trackCashInflows({ ...baseline, overridePillow: true }).validation.decision, "fail");
    assert.equal(engine.trackCashInflows({ ...baseline, overrideGrandKing: true }).validation.decision, "fail");
    assert.equal(engine.trackCashInflows({ ...baseline, bypassGrandKingApproval: true }).validation.decision, "fail");
    assert.equal(engine.trackCashInflows({ ...baseline, implementQ904OrLater: true }).validation.decision, "fail");
    assert.equal(
      engine.produceCashflowReport({ ...baseline, missionId: "Q9-04" }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.consumeAccountingRecords({ validated: true, fabricateBalancesOrFlows: true }).validation.decision,
      "fail",
    );

    const contract = engine.getQ904ConsumableContract();
    assert.equal(contract.missionId, "Q9-03");
    assert.equal(contract.consumerMissionId, "Q9-04");
    assert.equal(contract.neverImplementQ904OrLater, true);
    assert.ok(contract.exposedFields.includes("netCashflow"));
    assert.ok(contract.reportingFrequencyCatalog.length > 0);
    assert.ok(contract.currencyCatalog.includes("SGD"));

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q9-03");
    assert.equal(cockpit.neverFabricateBalancesOrFlows, true);
    assert.equal(cockpit.neverCreateBudgets, true);
    assert.equal(cockpit.neverForecastFutureCashflow, true);
    assert.equal(cockpit.neverCalculateCompleteBusinessProfitability, true);
    assert.equal(cockpit.neverApproveSpending, true);
    assert.equal(cockpit.neverMoveMoney, true);
    assert.equal(cockpit.neverImplementQ904OrLater, true);
    assert.equal(cockpit.consumableByQ904, true);
    assert.ok(cockpit.totalMovements >= 1);
    assert.equal(cockpit.workerId, "wkr-cashflow-01");
    assert.equal(cockpit.latestCapitalBusinessId, BIZ);

    const list = engine.list();
    assert.equal(list.action, "list");
    assert.ok(list.movements.length >= 1);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(diagnostics.validation.decision === "pass" || diagnostics.validation.decision === "partial");
  });

  test("money math uses integer minor units, never floating point (10.50 -> 1050 cents)", () => {
    const fromNumber = moneyFromDecimal(10.5, "SGD");
    assert.equal(fromNumber.minorUnits, 1050);
    assert.equal(Number.isInteger(fromNumber.minorUnits), true);

    const fromString = moneyFromDecimal("10.50", "SGD");
    assert.equal(fromString.minorUnits, 1050);

    const fromTricky = moneyFromDecimal(0.1, "SGD");
    assert.equal(fromTricky.minorUnits, 10);

    const large = moneyFromDecimal("1000000.00", "SGD");
    assert.equal(large.minorUnits, 100000000);
  });
});
