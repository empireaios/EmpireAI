import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildTaxSupportWorkerConfiguration,
  createTaxSupportWorker,
  resetTaxSupportWorkerForTesting,
  type TaxSupportTransaction,
  type TswInput,
} from "../../tax-support-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../../");

async function build(config?: Parameters<typeof createTaxSupportWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createTaxSupportWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

const BIZ = "tsw-biz-alpha-01";
const PERIOD = "2026-03";

function tx(
  transactionId: string,
  category: TaxSupportTransaction["category"],
  amountMinor: number,
  sourceRef: string,
  extras: Partial<TaxSupportTransaction> = {},
): TaxSupportTransaction {
  return {
    transactionId,
    category,
    amountMinor,
    currency: "SGD",
    businessId: BIZ,
    reportingPeriod: PERIOD,
    sourceRef,
    recordKind: "factual_financial_record",
    fabricated: false,
    ...extras,
  };
}

function baseInput(overrides: Partial<TswInput> = {}): TswInput {
  return {
    capitalBusinessId: BIZ,
    capitalProjectId: "cap-proj-tsw-01",
    reportingPeriod: PERIOD,
    currency: "SGD",
    periodEndDate: "2026-03-31",
    validated: true,
    transactions: [
      tx("t-rev-1", "income_revenue", 250000, "accw-entry-rev-1"),
      tx("t-other-1", "income_other", 15000, "accw-entry-other-1"),
      tx("t-cogs-1", "expense_cogs", 80000, "accw-entry-cogs-1"),
      tx("t-opex-1", "expense_opex", 45000, "accw-entry-opex-1"),
    ],
    documents: [{ kind: "invoice", sourceRef: "doc-invoice-1" }],
    ...overrides,
  };
}

describe("Q9-07 Tax Support Worker", () => {
  beforeEach(resetTaxSupportWorkerForTesting);

  test("1 locks mandatory tax-support-worker boundaries", () => {
    const c = buildTaxSupportWorkerConfiguration(REPO_ROOT, {
      neverProvideLegalOrTaxAdvice: false as never,
      neverFabricateTaxCalculationsOrObligations: false as never,
      neverSubmitFilingsAutomatically: false as never,
      neverReplaceAccountantsOrTaxProfessionals: false as never,
      neverModifyAccountingRecords: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ908OrLater: false as never,
      preserveTaxSupportHistory: false as never,
    });
    assert.equal(c.neverProvideLegalOrTaxAdvice, true);
    assert.equal(c.neverFabricateTaxCalculationsOrObligations, true);
    assert.equal(c.neverSubmitFilingsAutomatically, true);
    assert.equal(c.neverReplaceAccountantsOrTaxProfessionals, true);
    assert.equal(c.neverModifyAccountingRecords, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ908OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveTaxSupportHistory, true);
    assert.equal(c.factualRecordsDistinctFromReminders, true);
    assert.equal(c.structuralSignalOnly, true);
  });

  test("2 initializes PILLOW-TSW-001 for Q9-07 with tax-support catalog", async () => {
    const engine = await build();
    const state = engine.getState();
    assert.equal(state.missionId, "Q9-07");
    assert.equal(state.engineVersion, "PILLOW-TSW-001");
    assert.equal(state.configuration.workerId, "wkr-tax-support-01");
    assert.ok(state.configuration.taxSupportCategories.includes("income_revenue"));
    assert.ok(state.configuration.requiredDocumentKinds.includes("bank_statement"));
  });

  test("3 organises verified tax-support records from tagged transactions", async () => {
    const engine = await build();
    const organised = engine.organiseRecords(baseInput());
    assert.equal(organised.action, "organise_records");
    assert.equal(organised.validation.decision, "pass");
    assert.ok(organised.organisedRecord);
    assert.equal(organised.organisedRecord!.transactions.length, 4);
    assert.ok(organised.organisedRecord!.transactions.every((t) => t.fabricated === false));
    assert.ok(organised.organisedRecord!.transactions.every((t) => t.recordKind === "factual_financial_record"));
  });

  test("4 prepares factual income and expense summaries", async () => {
    const engine = await build();
    const income = engine.prepareIncomeSummary(baseInput());
    assert.equal(income.validation.decision, "pass");
    assert.equal(income.incomeSummary!.totalIncome.minorUnits, 265000);
    assert.equal(income.incomeSummary!.recordKind, "factual_financial_record");
    const expense = engine.prepareExpenseSummary(baseInput());
    assert.equal(expense.expenseSummary!.totalExpenses.minorUnits, 125000);
    assert.equal(expense.expenseSummary!.cogs.minorUnits, 80000);
  });

  test("5 detects missing tax-support documentation", async () => {
    const engine = await build();
    const missing = engine.detectMissingDocumentation(baseInput());
    assert.equal(missing.validation.decision, "pass");
    assert.ok(missing.missingDocumentation);
    const kinds = missing.missingDocumentation!.map((m) => m.kind).sort();
    assert.deepEqual(kinds, ["bank_statement", "receipt"]);
    assert.ok(missing.missingDocumentation!.every((m) => m.signalKind === "missing_documentation_signal"));
  });

  test("6 generates filing reminder schedule without advice or filing instructions", async () => {
    const engine = await build();
    const reminders = engine.generateFilingReminders(baseInput());
    assert.equal(reminders.validation.decision, "pass");
    assert.ok(reminders.filingReminders!.length >= 4);
    assert.ok(reminders.filingReminders!.every((r) => r.isAdvice === false));
    assert.ok(reminders.filingReminders!.every((r) => r.isFilingInstruction === false));
    assert.ok(reminders.filingReminders!.every((r) => r.signalKind === "filing_reminder_schedule"));
    const filingWindow = reminders.filingReminders!.find((r) => r.kind === "filing_window");
    assert.ok(filingWindow);
    assert.equal(filingWindow!.dueDate, "2026-05-15");
  });

  test("7 flags professional review items where appropriate", async () => {
    const engine = await build();
    const flagged = engine.flagProfessionalReview(
      baseInput({
        jurisdictionExtensionPoint: "sg-ir-extension",
        transactions: [
          ...baseInput().transactions!,
          tx("t-high", "expense_opex", 2_000_000, "accw-high-1"),
          tx("t-other", "other", 1000, "accw-other-1"),
        ],
      }),
    );
    assert.equal(flagged.validation.decision, "pass");
    const reasons = new Set(flagged.professionalReviewFlags!.map((f) => f.reason));
    assert.ok(reasons.has("missing_documentation"));
    assert.ok(reasons.has("high_value_transaction"));
    assert.ok(reasons.has("uncategorised_transactions"));
    assert.ok(reasons.has("jurisdiction_extension_point"));
    assert.ok(flagged.professionalReviewFlags!.every((f) => f.isAdvice === false));
  });

  test("8 preserves historical tax-support reports", async () => {
    const engine = await build();
    engine.produceTaxSupportReport(baseInput({ reportingPeriod: "2026-01", periodEndDate: "2026-01-31" }));
    engine.produceTaxSupportReport(baseInput({ reportingPeriod: "2026-02", periodEndDate: "2026-02-28" }));
    const reports = engine.getReports();
    assert.equal(reports.length, 2);
    assert.equal(reports[0]!.reportingPeriod, "2026-01");
    assert.equal(reports[1]!.reportingPeriod, "2026-02");
  });

  test("9 produces machine-readable Tax Support Report with required fields", async () => {
    const engine = await build();
    const produced = engine.produceTaxSupportReport(baseInput());
    assert.equal(produced.action, "produce_tax_support_report");
    assert.equal(produced.validation.decision, "pass");
    const report = produced.taxSupportReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.capitalProjectId, "cap-proj-tsw-01");
    assert.equal(report.reportingPeriod, PERIOD);
    assert.ok(report.incomeSummary);
    assert.ok(report.expenseSummary);
    assert.ok(report.taxCategories.length >= 1);
    assert.ok(report.supportingRecords.length >= 1);
    assert.ok(Array.isArray(report.missingDocumentation));
    assert.ok(Array.isArray(report.filingReminders));
    assert.ok(Array.isArray(report.professionalReviewFlags));
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.equal(report.metadataVersion, "TSW-001-v1");
    assert.equal(report.consumableByQ908, true);
    assert.equal(report.neverProvideLegalOrTaxAdvice, true);
    assert.equal(report.neverFabricateTaxCalculationsOrObligations, true);
    assert.equal(report.neverSubmitFilingsAutomatically, true);
    assert.equal(report.factualRecordsDistinctFromReminders, true);
  });

  test("10 submits through ERR when injected and keeps history", async () => {
    const engine = await build({
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: () => ({
            records: [{ reportId: "err-tsw-001" }],
            engineRecord: { lastReportType: "tax_support_report" },
          }),
        },
        auditRuntime: {
          recordAuditEntry: () => ({ accepted: true }),
        },
      },
    });
    const submitted = engine.submitReport(baseInput());
    assert.equal(submitted.validation.decision, "pass");
    assert.equal(submitted.taxSupportReport!.submittedThroughExecutiveReportingRuntime, true);
    assert.equal(submitted.taxSupportReport!.executiveReportId, "err-tsw-001");
    assert.equal(submitted.taxSupportReport!.auditStatus, "passed");
  });

  test("11 rejects Q9-08+ and refuses empty-business fabrication", async () => {
    const engine = await build();
    const future = engine.organiseRecords({
      ...baseInput(),
      missionId: "Q9-08",
    } as TswInput & { missionId: string });
    assert.equal(future.validation.decision, "fail");
    assert.ok(future.validation.errors.some((e) => /Q9-08/i.test(e)));

    const empty = engine.organiseRecords({
      reportingPeriod: PERIOD,
      validated: true,
      transactions: [tx("t1", "income_revenue", 100, "src")],
    });
    assert.equal(empty.validation.decision, "fail");
  });

  test("12 exposes Q908 consumable contract and cockpit snapshot", async () => {
    const engine = await build();
    engine.produceTaxSupportReport(baseInput());
    const contract = engine.getQ908ConsumableContract();
    assert.equal(contract.missionId, "Q9-07");
    assert.equal(contract.consumerMissionId, "Q9-08");
    assert.equal(contract.producedBy, "tax-support-worker");
    assert.equal(contract.neverImplementQ908OrLater, true);
    assert.ok(contract.exposedFields.includes("incomeSummary"));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q9-07");
    assert.equal(cockpit.consumableByQ908, true);
    assert.equal(cockpit.neverProvideLegalOrTaxAdvice, true);
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
  });
});
