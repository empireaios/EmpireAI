import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ACCOUNT_TYPES,
  ACCOUNTING_REPORT_VERSION,
  ACCW_METADATA_VERSION,
  ENTRY_TYPES,
  buildAccountingWorkerConfiguration,
  createAccountingWorker,
  resetAccountingWorkerForTesting,
  type AccwInput,
} from "../../accounting-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createAccountingWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createAccountingWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

function sum(values: number[]) {
  return Math.round(values.reduce((s, v) => s + v, 0) * 100) / 100;
}

describe("Q9-02 Accounting Worker", () => {
  beforeEach(resetAccountingWorkerForTesting);

  test("1 locks mandatory accounting-worker boundaries", () => {
    const c = buildAccountingWorkerConfiguration(REPO_ROOT, {
      neverFabricateAccountingRecords: false as never,
      neverForecastFinances: false as never,
      neverApproveInvestments: false as never,
      neverReplaceBudgetPlanningWorker: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ903OrLater: false as never,
      preserveImmutableAccountingHistory: false as never,
    });
    assert.equal(c.neverFabricateAccountingRecords, true);
    assert.equal(c.neverForecastFinances, true);
    assert.equal(c.neverApproveInvestments, true);
    assert.equal(c.neverReplaceBudgetPlanningWorker, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ903OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutableAccountingHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-ACCW-001 for Q9-02 with account/entry types", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q9-02");
    assert.equal(state.engineVersion, "PILLOW-ACCW-001");
    for (const type of ACCOUNT_TYPES) {
      assert.ok(state.configuration.accountTypes.includes(type));
    }
    for (const type of ENTRY_TYPES) {
      assert.ok(state.configuration.entryTypes.includes(type));
    }
  });

  test("3 records income as a balanced double-entry journal posting", async () => {
    const engine = await build();
    const result = engine.recordIncome({
      capitalBusinessId: "accw-biz-growth-01",
      amount: 1000,
      currency: "SGD",
      accountingPeriod: "2026-08",
      description: "Consulting revenue",
      validated: true,
    });
    assert.equal(result.action, "record_income");
    assert.equal(result.validation.decision, "pass");
    const entry = result.entry!;
    assert.equal(entry.entryType, "income");
    assert.equal(entry.fabricated, false);
    assert.equal(entry.immutable, true);
    assert.equal(
      sum(entry.lines.map((l) => l.debit)),
      sum(entry.lines.map((l) => l.credit)),
    );
    const income = result.accounts.find((a) => a.accountType === "income")!;
    const cash = result.accounts.find((a) => a.accountType === "asset")!;
    assert.equal(income.balance, 1000);
    assert.equal(cash.balance, 1000);
    assert.equal(income.fabricated, false);
  });

  test("4 records expense as a balanced double-entry journal posting", async () => {
    const engine = await build();
    engine.recordIncome({ capitalBusinessId: "accw-biz-growth-01", amount: 1000, currency: "SGD", validated: true });
    const result = engine.recordExpense({
      capitalBusinessId: "accw-biz-growth-01",
      amount: 300,
      currency: "SGD",
      accountingPeriod: "2026-08",
      description: "Office supplies",
      validated: true,
    });
    assert.equal(result.validation.decision, "pass");
    const entry = result.entry!;
    assert.equal(entry.entryType, "expense");
    assert.equal(
      sum(entry.lines.map((l) => l.debit)),
      sum(entry.lines.map((l) => l.credit)),
    );
    const expense = result.accounts.find((a) => a.accountType === "expense")!;
    const cash = result.accounts.find((a) => a.accountType === "asset")!;
    assert.equal(expense.balance, 300);
    assert.equal(cash.balance, 700);
  });

  test("5 maintains asset register entries", async () => {
    const engine = await build();
    const result = engine.maintainAsset({
      capitalBusinessId: "accw-biz-growth-01",
      amount: 5000,
      currency: "SGD",
      category: "equipment",
      notes: "Office laptops",
      validated: true,
    });
    assert.equal(result.action, "maintain_asset");
    assert.equal(result.validation.decision, "pass");
    assert.equal(result.assets.length, 1);
    assert.equal(result.assets[0]!.amount, 5000);
    assert.equal(result.assets[0]!.category, "equipment");
    assert.equal(result.assets[0]!.fabricated, false);
  });

  test("6 maintains liability register entries", async () => {
    const engine = await build();
    const result = engine.maintainLiability({
      capitalBusinessId: "accw-biz-growth-01",
      amount: 2500,
      currency: "SGD",
      category: "vendor_payable",
      notes: "Outstanding invoice",
      validated: true,
    });
    assert.equal(result.action, "maintain_liability");
    assert.equal(result.validation.decision, "pass");
    assert.equal(result.liabilities.length, 1);
    assert.equal(result.liabilities[0]!.amount, 2500);
    assert.equal(result.liabilities[0]!.category, "vendor_payable");
    assert.equal(result.liabilities[0]!.fabricated, false);
  });

  test("7 records transfers and posts a balanced general ledger entry", async () => {
    const engine = await build();
    engine.recordIncome({ capitalBusinessId: "accw-biz-growth-01", amount: 1000, currency: "SGD", validated: true });
    const accounts = engine.getAccounts().filter((a) => a.businessId === "accw-biz-growth-01");
    const cash = accounts.find((a) => a.accountType === "asset")!;
    const payable = accounts.find((a) => a.accountType === "liability")!;

    const transfer = engine.recordTransfer({
      capitalBusinessId: "accw-biz-growth-01",
      fromAccountId: cash.accountId,
      toAccountId: payable.accountId,
      amount: 200,
      currency: "SGD",
      accountingPeriod: "2026-08",
      validated: true,
    });
    assert.equal(transfer.action, "record_transfer");
    assert.equal(transfer.validation.decision, "pass");
    const transferEntry = transfer.entry!;
    assert.equal(
      sum(transferEntry.lines.map((l) => l.debit)),
      sum(transferEntry.lines.map((l) => l.credit)),
    );

    const ledger = engine.maintainGeneralLedger({
      capitalBusinessId: "accw-biz-growth-01",
      currency: "SGD",
      accountingPeriod: "2026-08",
      lines: [
        { accountId: cash.accountId, debit: 0, credit: 50, currency: "SGD" },
        { accountId: payable.accountId, debit: 50, credit: 0, currency: "SGD" },
      ],
      validated: true,
    });
    assert.equal(ledger.action, "maintain_general_ledger");
    assert.equal(ledger.validation.decision, "pass");
    assert.ok(ledger.entry);

    const unbalanced = engine.postJournalEntry({
      capitalBusinessId: "accw-biz-growth-01",
      currency: "SGD",
      lines: [{ accountId: cash.accountId, debit: 10, credit: 0, currency: "SGD" }],
      validated: true,
    });
    assert.equal(unbalanced.validation.decision, "fail");
  });

  test("8 generates accounting summary from observed ledger data", async () => {
    const engine = await build();
    engine.recordIncome({ capitalBusinessId: "accw-biz-growth-01", amount: 1000, currency: "SGD", validated: true });
    engine.recordExpense({ capitalBusinessId: "accw-biz-growth-01", amount: 300, currency: "SGD", validated: true });
    const result = engine.generateAccountingSummary({ capitalBusinessId: "accw-biz-growth-01", validated: true });
    assert.equal(result.action, "generate_accounting_summary");
    assert.ok(result.summary);
    assert.equal(result.summary!.fabricated, false);
    assert.ok(result.summary!.evidencePresent);
    assert.ok(result.notes.some((n) => n.startsWith("income=1000")));
    assert.ok(result.notes.some((n) => n.startsWith("expense=300")));
  });

  test("9 produces full Accounting Report consumable by Q9-03", async () => {
    const engine = await build();
    engine.recordIncome({ capitalBusinessId: "accw-biz-growth-01", amount: 1000, currency: "SGD", validated: true });
    engine.recordExpense({ capitalBusinessId: "accw-biz-growth-01", amount: 300, currency: "SGD", validated: true });

    const result = engine.produceAccountingReport({
      capitalBusinessId: "accw-biz-growth-01",
      capitalProjectId: "capfc-prj-0001",
      accountingPeriod: "2026-08",
      validated: true,
    });
    assert.equal(result.action, "produce_accounting_report");
    assert.equal(result.validation.decision, "pass");
    const report = result.latestReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.accountingPeriod, "2026-08");
    assert.ok(report.incomeSummary);
    assert.ok(report.expenseSummary);
    assert.ok(report.assetSummary);
    assert.ok(report.liabilitySummary);
    assert.ok(report.ledgerBalance);
    assert.equal(report.ledgerBalance.balanced, true);
    assert.ok(Array.isArray(report.financialEvents));
    assert.ok(report.financialEvents.length >= 2);
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 100);
    assert.equal(report.metadataVersion, ACCW_METADATA_VERSION);
    assert.equal(report.reportVersion, ACCOUNTING_REPORT_VERSION);
    assert.equal(report.capitalBusinessId, "accw-biz-growth-01");
    assert.equal(report.capitalProjectId, "capfc-prj-0001");
    assert.ok(report.equitySummary);
    assert.ok(Array.isArray(report.accountBalances));
    assert.equal(report.consumableByQ903, true);
    assert.equal(report.neverFabricateAccountingRecords, true);
    assert.equal(report.neverForecastFinances, true);
    assert.equal(report.neverApproveInvestments, true);
    assert.equal(report.neverReplaceBudgetPlanningWorker, true);
    assert.equal(report.neverBypassGrandKingApproval, true);
    assert.equal(report.preserveImmutableAccountingHistory, true);
  });

  test("10 submits report through Executive Reporting Runtime when injected", async () => {
    const engine = await build({
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: () => ({
            records: [{ reportId: `ert-accw-test-${Date.now()}` }],
          }),
        },
        auditRuntime: {
          recordAuditEntry: () => ({ accepted: true }),
        },
      },
    });
    engine.recordIncome({ capitalBusinessId: "accw-biz-growth-01", amount: 1000, currency: "SGD", validated: true });
    engine.produceAccountingReport({ capitalBusinessId: "accw-biz-growth-01", validated: true });

    const submit = engine.submitReport({ capitalBusinessId: "accw-biz-growth-01", validated: true });
    assert.equal(submit.action, "submit_report");
    assert.ok(submit.validation.decision === "pass" || submit.validation.decision === "partial");
    assert.equal(submit.latestReport!.submittedToExecutiveReporting, true);
    assert.ok(submit.latestReport!.executiveReportId);
    assert.equal(submit.latestReport!.auditStatus, "passed");
  });

  test("11 rejects Q9-03+ missions and forbidden ACCW boundary attempts", async () => {
    const engine = await build();
    const baseline: AccwInput = { capitalBusinessId: "accw-biz-growth-01", amount: 100, currency: "SGD", validated: true };

    assert.equal(
      engine.recordIncome({ ...baseline, fabricateAccountingRecords: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recordIncome({ ...baseline, forecastFinances: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recordIncome({ ...baseline, approveInvestments: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recordIncome({ ...baseline, replaceBudgetPlanningWorker: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recordIncome({ ...baseline, overrideApprovedArchitecture: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recordIncome({ ...baseline, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recordIncome({ ...baseline, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recordIncome({ ...baseline, bypassGrandKingApproval: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recordIncome({ ...baseline, implementQ903OrLater: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceAccountingReport({ ...baseline, missionId: "Q9-03" }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.recordIncome({ capitalBusinessId: "accw-biz-growth-01", currency: "SGD", validated: true }).validation
        .decision,
      "fail",
    );
  });

  test("12 exposes Q9-03 consumable contract, cockpit, and multi-business/multi-currency extension", async () => {
    const engine = await build();
    engine.recordIncome({ capitalBusinessId: "accw-biz-growth-01", amount: 1000, currency: "SGD", validated: true });

    const contract = engine.getQ903ConsumableContract();
    assert.equal(contract.missionId, "Q9-02");
    assert.equal(contract.consumerMissionId, "Q9-03");
    assert.equal(contract.neverImplementQ903OrLater, true);
    assert.ok(contract.exposedFields.includes("capitalBusinessId"));
    assert.ok(contract.accountTypeCatalog.length > 0);
    assert.ok(contract.currencyCatalog.includes("SGD"));

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q9-02");
    assert.equal(cockpit.neverFabricateAccountingRecords, true);
    assert.equal(cockpit.neverForecastFinances, true);
    assert.equal(cockpit.neverApproveInvestments, true);
    assert.equal(cockpit.neverReplaceBudgetPlanningWorker, true);
    assert.equal(cockpit.neverImplementQ903OrLater, true);
    assert.equal(cockpit.consumableByQ903, true);
    assert.ok(cockpit.totalAccounts >= 1);
    assert.equal(cockpit.workerId, "wkr-accounting-01");
    assert.equal(cockpit.latestCapitalBusinessId, "accw-biz-growth-01");

    // Multi-business + multi-currency extension point.
    engine.recordIncome({ capitalBusinessId: "accw-biz-treasury-01", amount: 500, currency: "USD", validated: true });
    const accounts = engine.getAccounts();
    assert.ok(accounts.some((a) => a.businessId === "accw-biz-growth-01" && a.currency === "SGD"));
    assert.ok(accounts.some((a) => a.businessId === "accw-biz-treasury-01" && a.currency === "USD"));

    const list = engine.list();
    assert.equal(list.action, "list");
    assert.ok(list.accounts.length >= 2);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(diagnostics.validation.decision === "pass" || diagnostics.validation.decision === "partial");
  });
});
