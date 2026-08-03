import type { AccountingWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type AccountingWorkerDependencies } from "./integrations.js";
import { appendAccwLog } from "./accw-logging.js";
import { ACCW_CAPABILITIES, ACCW_METADATA_VERSION, ACCOUNTING_WORKER_ID, INTEGRATION_TARGETS } from "./paths.js";
import { AccwLedgerBuilder, normalizeCurrency } from "./ledger-builder.js";
import { AccwLedgerStore } from "./ledger-store.js";
import { AccwValidator, HealthMonitor, RecoveryManager } from "./ledger-validator.js";
import type {
  AccountingReport,
  AccountingWorkerCatalog,
  AccountingWorkerEngineRecord,
  AccwInput,
  AccwRunReport,
  AccwValidationReport,
  AssetRecord,
  FinancialSummary,
  IntegrationHandshake,
  JournalEntry,
  LedgerAccount,
  LiabilityRecord,
  OperationalState,
  Q903ConsumableContract,
} from "./types.js";

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export class AccountingWorkerManager {
  private engineRecord: AccountingWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: AccountingWorkerCatalog | null = null;
  private readonly store = new AccwLedgerStore();
  private readonly builder = new AccwLedgerBuilder();
  private readonly validator = new AccwValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: AccountingWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: AccountingWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedAccounts, config.seedEntries);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listAccounts(),
      this.store.listEntries(),
      this.store.listReports(),
      this.handshakes,
    );
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getAccounts() {
    return this.store.listAccounts();
  }

  getEntries() {
    return this.store.listEntries();
  }

  getAssets() {
    return this.store.listAssets();
  }

  getLiabilities() {
    return this.store.listLiabilities();
  }

  getReports() {
    return this.store.listReports();
  }

  getLatestBusinessId() {
    return this.store.getLatestBusinessId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getQ903ConsumableContract(config: AccountingWorkerConfiguration): Q903ConsumableContract {
    return this.builder.buildQ903ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: AccountingWorkerConfiguration): AccwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.integrationTargets.length
        ? (config.integrationTargets as (typeof INTEGRATION_TARGETS)[number][])
        : [...INTEGRATION_TARGETS],
    );
    this.rebuildCatalog(config);
    this.ensureRecord("connected", config);
    appendAccwLog({
      event: "connect",
      details: `Accounting Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      null,
      [],
      [],
      [],
      null,
      config.enabled ? "pass" : "fail",
      started,
      [],
      null,
      config.enabled ? [] : ["Accounting Worker is disabled"],
      [],
    );
  }

  recordIncome(input: AccwInput, config: AccountingWorkerConfiguration): AccwRunReport {
    return this.recordDoubleEntry("record_income", "income", input, config);
  }

  recordExpense(input: AccwInput, config: AccountingWorkerConfiguration): AccwRunReport {
    return this.recordDoubleEntry("record_expense", "expense", input, config);
  }

  private recordDoubleEntry(
    action: "record_income" | "record_expense",
    kind: "income" | "expense",
    input: AccwInput,
    config: AccountingWorkerConfiguration,
  ): AccwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.ledgerRulesEnabled) {
      return this.disabled(action, config, started, !config.enabled ? "Accounting Worker is disabled" : "Ledger rules are disabled");
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    const businessId = this.resolveBusinessId(input);
    const amount = typeof input.amount === "number" ? input.amount : null;
    if (amount === null || !Number.isFinite(amount) || amount <= 0) {
      const validation = this.validator.finalize(
        "fail",
        [`Accounting Worker requires a positive amount to ${kind === "income" ? "record income" : "record an expense"} — amounts are never fabricated`],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, null, this.store.listAccountsByBusiness(businessId), [], [], null, validation, started);
    }

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const accountingPeriod = input.accountingPeriod?.trim() || currentPeriod();
    const description = input.description?.trim() || `${kind === "income" ? "Income" : "Expense"} recorded for ${businessId}`;

    const existing = this.store.listAccountsByBusiness(businessId);
    const { accounts, created } = this.builder.ensureChartOfAccounts(businessId, currency, existing);
    for (const account of created) this.store.upsertAccount(account);

    const primaryAccount = this.builder.findAccountByType(accounts, businessId, kind, currency)!;
    const cashAccount = this.builder.findAccountByType(accounts, businessId, "asset", currency)!;

    const entry =
      kind === "income"
        ? this.builder.buildIncomeEntry(
            businessId,
            accountingPeriod,
            amount,
            currency,
            description,
            primaryAccount.accountId,
            cashAccount.accountId,
          )
        : this.builder.buildExpenseEntry(
            businessId,
            accountingPeriod,
            amount,
            currency,
            description,
            primaryAccount.accountId,
            cashAccount.accountId,
          );

    const validation = this.validator.validateEntry(entry, { ...input, validated: input.validated ?? true }, started);
    if (validation.decision === "fail") {
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, null, accounts, [], [], null, validation, started);
    }

    this.store.appendEntry(entry);
    const updatedAccounts = this.builder.applyLinesToAccounts(entry.lines, accounts);
    for (const account of updatedAccounts) {
      if (account.accountId === primaryAccount.accountId || account.accountId === cashAccount.accountId) {
        this.store.upsertAccount(account);
      }
    }

    this.rebuildCatalog(config);
    this.recovery.reset();
    this.ensureRecord("active", config, "passed", businessId);
    appendAccwLog({ event: action, details: `business=${businessId} amount=${amount} currency=${currency}` });
    return this.report(
      action,
      entry,
      this.store.listAccountsByBusiness(businessId),
      [],
      [],
      null,
      validation,
      started,
    );
  }

  maintainAsset(input: AccwInput, config: AccountingWorkerConfiguration): AccwRunReport {
    return this.maintainRegister("maintain_asset", "asset", input, config);
  }

  maintainLiability(input: AccwInput, config: AccountingWorkerConfiguration): AccwRunReport {
    return this.maintainRegister("maintain_liability", "liability", input, config);
  }

  private maintainRegister(
    action: "maintain_asset" | "maintain_liability",
    kind: "asset" | "liability",
    input: AccwInput,
    config: AccountingWorkerConfiguration,
  ): AccwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.ledgerRulesEnabled) {
      return this.disabled(action, config, started, !config.enabled ? "Accounting Worker is disabled" : "Ledger rules are disabled");
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    const businessId = this.resolveBusinessId(input);
    const amount = typeof input.amount === "number" ? input.amount : null;
    if (amount === null || !Number.isFinite(amount) || amount <= 0) {
      const validation = this.validator.finalize(
        "fail",
        [`Accounting Worker requires a positive amount to maintain a ${kind} record — amounts are never fabricated`],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, null, this.store.listAccountsByBusiness(businessId), [], [], null, validation, started);
    }

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const category = input.category?.trim() || "general";
    const notes = input.notes?.trim() || input.description?.trim() || `${kind === "asset" ? "Asset" : "Liability"} maintained via Accounting Worker`;

    let entry: JournalEntry | null = null;
    let accounts = this.store.listAccountsByBusiness(businessId);
    if (input.lines?.length) {
      const balance = this.builder.computeLedgerBalance(input.lines, currency);
      if (!balance.balanced) {
        const validation = this.validator.finalize(
          "fail",
          [`Supplied journal lines for ${kind} maintenance are not balanced: difference=${balance.difference}`],
          [],
          started,
        );
        this.recovery.recordFailure();
        this.ensureRecord("failed", config, "failed");
        return this.report(action, null, accounts, [], [], null, validation, started);
      }
      const ensured = this.builder.ensureChartOfAccounts(businessId, currency, accounts);
      for (const account of ensured.created) this.store.upsertAccount(account);
      accounts = ensured.accounts;
      entry = this.builder.buildJournalEntry(
        businessId,
        input.accountingPeriod?.trim() || currentPeriod(),
        currency,
        notes,
        input.lines,
        kind,
      );
      const entryValidation = this.validator.validateEntry(entry, { ...input, validated: input.validated ?? true }, started);
      if (entryValidation.decision === "fail") {
        this.recovery.recordFailure();
        this.ensureRecord("failed", config, "failed");
        return this.report(action, null, accounts, [], [], null, entryValidation, started);
      }
      this.store.appendEntry(entry);
      const updated = this.builder.applyLinesToAccounts(entry.lines, accounts);
      for (const account of updated) this.store.upsertAccount(account);
      accounts = this.store.listAccountsByBusiness(businessId);
    }

    const record =
      kind === "asset"
        ? this.store.addAsset(this.builder.buildAssetRecord(businessId, amount, currency, category, notes))
        : this.store.addLiability(this.builder.buildLiabilityRecord(businessId, amount, currency, category, notes));

    const validation = this.validator.finalize(
      this.hasBoundary(input) ? "fail" : "pass",
      [],
      [],
      started,
    );
    this.rebuildCatalog(config);
    this.recovery.reset();
    this.ensureRecord("active", config, "passed", businessId);
    appendAccwLog({ event: action, details: `business=${businessId} amount=${amount} category=${category}` });
    return this.report(
      action,
      entry,
      accounts,
      kind === "asset" ? [record as AssetRecord] : [],
      kind === "liability" ? [record as LiabilityRecord] : [],
      null,
      validation,
      started,
    );
  }

  recordTransfer(input: AccwInput, config: AccountingWorkerConfiguration): AccwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.ledgerRulesEnabled) {
      return this.disabled("record_transfer", config, started, !config.enabled ? "Accounting Worker is disabled" : "Ledger rules are disabled");
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("record_transfer", input, config, started);
    }

    const businessId = this.resolveBusinessId(input);
    const amount = typeof input.amount === "number" ? input.amount : null;
    const fromAccountId = input.fromAccountId?.trim();
    const toAccountId = input.toAccountId?.trim();

    if (amount === null || !Number.isFinite(amount) || amount <= 0 || !fromAccountId || !toAccountId) {
      const validation = this.validator.finalize(
        "fail",
        ["Accounting Worker requires fromAccountId, toAccountId, and a positive amount to record a transfer"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("record_transfer", null, this.store.listAccountsByBusiness(businessId), [], [], null, validation, started);
    }

    const fromAccount = this.store.getAccount(fromAccountId);
    const toAccount = this.store.getAccount(toAccountId);
    if (!fromAccount || !toAccount) {
      const validation = this.validator.finalize(
        "fail",
        ["Accounting Worker cannot record a transfer between unknown ledger accounts"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("record_transfer", null, this.store.listAccountsByBusiness(businessId), [], [], null, validation, started);
    }
    if (
      fromAccount.currency !== toAccount.currency &&
      fromAccount.currency !== "UNKNOWN" &&
      toAccount.currency !== "UNKNOWN"
    ) {
      const validation = this.validator.finalize(
        "fail",
        [
          `Accounting Worker requires matching currencies for a transfer unless marked UNKNOWN: ${fromAccount.currency} vs ${toAccount.currency}`,
        ],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("record_transfer", null, this.store.listAccountsByBusiness(businessId), [], [], null, validation, started);
    }

    const currency = normalizeCurrency(input.currency ?? fromAccount.currency, config.defaultCurrency);
    const accountingPeriod = input.accountingPeriod?.trim() || currentPeriod();
    const description = input.description?.trim() || `Transfer recorded for ${businessId}`;
    const entry = this.builder.buildTransferEntry(
      businessId,
      accountingPeriod,
      amount,
      currency,
      description,
      fromAccount.accountId,
      toAccount.accountId,
    );

    const validation = this.validator.validateEntry(entry, { ...input, validated: input.validated ?? true }, started);
    if (validation.decision === "fail") {
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report("record_transfer", null, this.store.listAccountsByBusiness(businessId), [], [], null, validation, started);
    }

    this.store.appendEntry(entry);
    const updated = this.builder.applyLinesToAccounts(entry.lines, [fromAccount, toAccount]);
    for (const account of updated) this.store.upsertAccount(account);

    this.rebuildCatalog(config);
    this.recovery.reset();
    this.ensureRecord("active", config, "passed", businessId);
    appendAccwLog({ event: "record_transfer", details: `business=${businessId} amount=${amount} from=${fromAccountId} to=${toAccountId}` });
    return this.report(
      "record_transfer",
      entry,
      this.store.listAccountsByBusiness(businessId),
      [],
      [],
      null,
      validation,
      started,
    );
  }

  postJournalEntry(input: AccwInput, config: AccountingWorkerConfiguration): AccwRunReport {
    return this.postJournal("post_journal_entry", input, config);
  }

  maintainGeneralLedger(input: AccwInput, config: AccountingWorkerConfiguration): AccwRunReport {
    return this.postJournal("maintain_general_ledger", input, config);
  }

  private postJournal(
    action: "post_journal_entry" | "maintain_general_ledger",
    input: AccwInput,
    config: AccountingWorkerConfiguration,
  ): AccwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.ledgerRulesEnabled) {
      return this.disabled(action, config, started, !config.enabled ? "Accounting Worker is disabled" : "Ledger rules are disabled");
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    const businessId = this.resolveBusinessId(input);
    const lines = input.lines ?? [];
    if (!lines.length) {
      const validation = this.validator.finalize(
        "fail",
        ["Accounting Worker requires explicit balanced lines to post a general ledger entry"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, null, this.store.listAccountsByBusiness(businessId), [], [], null, validation, started);
    }

    const currency = normalizeCurrency(input.currency, config.defaultCurrency);
    const balance = this.builder.computeLedgerBalance(lines, currency);
    if (!balance.balanced) {
      const validation = this.validator.finalize(
        "fail",
        [`Accounting Worker rejects unbalanced journal entries: difference=${balance.difference}`],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, null, this.store.listAccountsByBusiness(businessId), [], [], null, validation, started);
    }

    const accountingPeriod = input.accountingPeriod?.trim() || currentPeriod();
    const description = input.description?.trim() || `General ledger entry for ${businessId}`;
    const entry = this.builder.buildJournalEntry(
      businessId,
      accountingPeriod,
      currency,
      description,
      lines,
      typeof input.entryType === "string" ? input.entryType : "journal",
    );

    const validation = this.validator.validateEntry(entry, { ...input, validated: input.validated ?? true }, started);
    if (validation.decision === "fail") {
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, null, this.store.listAccountsByBusiness(businessId), [], [], null, validation, started);
    }

    this.store.appendEntry(entry);
    const accounts = this.store.listAccountsByBusiness(businessId);
    const touched = accounts.filter((a) => lines.some((l) => l.accountId === a.accountId));
    const updated = this.builder.applyLinesToAccounts(entry.lines, touched.length ? touched : accounts);
    for (const account of updated) this.store.upsertAccount(account);

    this.rebuildCatalog(config);
    this.recovery.reset();
    this.ensureRecord("active", config, "passed", businessId);
    appendAccwLog({ event: action, details: `business=${businessId} lines=${lines.length}` });
    return this.report(action, entry, this.store.listAccountsByBusiness(businessId), [], [], null, validation, started);
  }

  generateAccountingSummary(input: AccwInput, config: AccountingWorkerConfiguration): AccwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const businessId = this.resolveBusinessId(input);
    const accounts = this.store.listAccountsByBusiness(businessId);
    const assets = this.store.listAssetsByBusiness(businessId);
    const liabilities = this.store.listLiabilitiesByBusiness(businessId);

    const incomeSummary = this.builder.buildFinancialSummary(accounts, "income");
    const expenseSummary = this.builder.buildFinancialSummary(accounts, "expense");
    const assetSummary = this.builder.buildFinancialSummary(
      accounts,
      "asset",
      assets.map((a) => ({ businessId: a.businessId, currency: a.currency, amount: a.amount })),
    );
    const liabilitySummary = this.builder.buildFinancialSummary(
      accounts,
      "liability",
      liabilities.map((l) => ({ businessId: l.businessId, currency: l.currency, amount: l.amount })),
    );

    const summary: FinancialSummary = {
      totalsByCurrency: [
        ...incomeSummary.totalsByCurrency,
        ...expenseSummary.totalsByCurrency,
        ...assetSummary.totalsByCurrency,
        ...liabilitySummary.totalsByCurrency,
      ],
      totalsByBusiness: [
        ...incomeSummary.totalsByBusiness,
        ...expenseSummary.totalsByBusiness,
        ...assetSummary.totalsByBusiness,
        ...liabilitySummary.totalsByBusiness,
      ],
      grandTotal:
        incomeSummary.grandTotal - expenseSummary.grandTotal + assetSummary.grandTotal - liabilitySummary.grandTotal,
      fabricated: false,
      evidencePresent:
        incomeSummary.evidencePresent ||
        expenseSummary.evidencePresent ||
        assetSummary.evidencePresent ||
        liabilitySummary.evidencePresent,
    };

    const validation = this.validator.validateGeneric({ ...input, validated: input.validated ?? true }, started);
    this.rebuildCatalog(config);
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      businessId,
    );
    appendAccwLog({ event: "generate_accounting_summary", details: `business=${businessId}` });
    return this.report("generate_accounting_summary", null, accounts, assets, liabilities, summary, validation, started, [
      `income=${incomeSummary.grandTotal}`,
      `expense=${expenseSummary.grandTotal}`,
      `asset=${assetSummary.grandTotal}`,
      `liability=${liabilitySummary.grandTotal}`,
    ]);
  }

  produceAccountingReport(input: AccwInput, config: AccountingWorkerConfiguration): AccwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("produce_accounting_report", input, config, started);
    }

    const businessId = this.resolveBusinessId(input);
    const accountingPeriod = input.accountingPeriod?.trim() || currentPeriod();
    const capitalProjectId = input.capitalProjectId?.trim() || null;

    const report = this.builder.buildReport(
      config,
      businessId,
      capitalProjectId,
      accountingPeriod,
      this.store.listAccounts(),
      this.store.listEntries(),
      this.store.listAssets(),
      this.store.listLiabilities(),
      null,
    );

    const validation = this.validator.validateReport(
      report,
      { ...input, validated: input.validated ?? true },
      started,
    );
    const finalReport: AccountingReport = { ...report, validation };
    this.store.saveReport(finalReport);
    this.rebuildCatalog(config);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", businessId);
    appendAccwLog({ event: "produce_accounting_report", details: `business=${businessId} balanced=${report.ledgerBalance.balanced}` });
    return this.report(
      "produce_accounting_report",
      null,
      report.accountBalances,
      [],
      [],
      null,
      validation,
      started,
      [],
      finalReport,
    );
  }

  submitReport(input: AccwInput, config: AccountingWorkerConfiguration): AccwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, started, "Executive reporting submission is disabled");
    }

    const businessId = this.resolveBusinessId(input);
    let report = this.store.getReport(businessId);
    if (!report) {
      const produced = this.produceAccountingReport(input, config);
      report = produced.latestReport;
    }
    if (!report) {
      return this.disabled("submit_report", config, started, "No Accounting Report available for submission");
    }

    const audit = this.integrations.recordAudit(report);
    if (audit.audited) {
      report = { ...report, auditStatus: "passed" };
      this.store.saveReport(report);
    }

    const submission = this.integrations.submitReport(report);
    if (submission.submitted && submission.executiveReportId) {
      report = {
        ...report,
        submittedToExecutiveReporting: true,
        executiveReportId: submission.executiveReportId,
      };
      this.store.saveReport(report);
    }
    this.integrations.recordMemory(report);

    this.rebuildCatalog(config);
    const validation = this.validator.validateReport(
      report,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) validation.warnings.push("executive_reporting_runtime_unavailable");
    const finalValidation =
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" as const }
        : validation;
    if (finalValidation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, finalValidation.decision === "fail" ? "failed" : "passed", businessId);
    return this.report("submit_report", null, report.accountBalances, [], [], null, finalValidation, started, [], report);
  }

  list(config: AccountingWorkerConfiguration): AccwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const accounts = this.store.listAccounts();
    const validation = this.validator.validateAccounts(accounts, { validated: true }, started);
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "list",
      null,
      accounts,
      this.store.listAssets(),
      this.store.listLiabilities(),
      null,
      validation,
      started,
      [],
      this.store.getLatestReport(),
    );
  }

  validate(input: AccwInput, config: AccountingWorkerConfiguration): AccwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const accounts = this.store.listAccounts();
    const validation = this.validator.validateAccounts(
      accounts,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "validate",
      null,
      accounts,
      this.store.listAssets(),
      this.store.listLiabilities(),
      null,
      validation,
      started,
      [],
      this.store.getLatestReport(),
    );
  }

  diagnostics(config: AccountingWorkerConfiguration): AccwRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.rebuildCatalog(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Accounting Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendAccwLog({ event: "diagnostics", details: `accounts=${this.store.countAccounts()} entries=${this.store.countEntries()}` });
    return this.report("diagnostics", null, this.store.listAccounts(), [], [], null, validation, started);
  }

  runDiagnostics(config: AccountingWorkerConfiguration) {
    return this.diagnostics(config);
  }

  private resolveBusinessId(input: AccwInput): string {
    return (
      input.capitalBusinessId?.trim() ||
      input.businessId?.trim() ||
      this.integrations.resolveCapitalBusinessId(null) ||
      this.store.getLatestBusinessId() ||
      "unspecified"
    );
  }

  private rebuildCatalog(config: AccountingWorkerConfiguration) {
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listAccounts(),
      this.store.listEntries(),
      this.store.listReports(),
      this.handshakes,
    );
  }

  private hasBoundary(input: AccwInput) {
    return (
      input.fabricateAccountingRecords === true ||
      input.forecastFinances === true ||
      input.approveInvestments === true ||
      input.replaceBudgetPlanningWorker === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.implementQ903OrLater === true ||
      (!!input.missionId && /^(Q9-0[3-9]|Q9-\d{2,}|Q[1-9]\d-\d+)/i.test(input.missionId.trim()))
    );
  }

  private boundaryFail(
    action: AccwRunReport["action"],
    input: AccwInput,
    config: AccountingWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateGeneric(input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, null, this.store.listAccounts(), [], [], null, validation, started);
  }

  private disabled(
    action: AccwRunReport["action"],
    config: AccountingWorkerConfiguration,
    started: number,
    message: string,
  ) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, null, this.store.listAccounts(), [], [], null, validation, started);
  }

  private ensureRecord(
    state: OperationalState,
    config: AccountingWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    lastBusinessId: string | null = null,
  ) {
    const ledgerBalance = this.computeOverallLedgerBalanced();
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `accw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: ACCOUNTING_WORKER_ID,
      engineVersion: "PILLOW-ACCW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(validationStatus === "failed" ? "fail" : "pass", config.enabled),
      validationStatus,
      supportedCapabilities: [...ACCW_CAPABILITIES],
      totalEntries: this.store.countEntries(),
      totalAccounts: this.store.countAccounts(),
      lastLedgerBalanced: ledgerBalance,
      lastBusinessId: lastBusinessId ?? this.store.getLatestBusinessId(),
      lastReportId: this.store.getLatestReport()?.reportId ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: ACCW_METADATA_VERSION,
    };
  }

  private computeOverallLedgerBalanced(): boolean | null {
    const entries = this.store.listEntries();
    if (!entries.length) return null;
    const balance = this.builder.computeGeneralLedgerBalance(entries, "SGD");
    return balance.balanced;
  }

  private report(
    action: AccwRunReport["action"],
    entry: JournalEntry | null,
    accounts: LedgerAccount[],
    assets: AssetRecord[],
    liabilities: LiabilityRecord[],
    summary: FinancialSummary | null,
    validationOrDecision: AccwValidationReport | AccwValidationReport["decision"],
    started: number,
    notes: string[] = [],
    latestReport: AccountingReport | null = null,
    extraErrors: string[] = [],
    extraWarnings: string[] = [],
  ): AccwRunReport {
    const validation: AccwValidationReport =
      typeof validationOrDecision === "string"
        ? this.validator.finalize(validationOrDecision, extraErrors, extraWarnings, started)
        : validationOrDecision;
    const engineRecord = this.getEngineRecord()!;
    return {
      accwRunReportId: `accw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog: this.getCatalog(),
      entry,
      accounts,
      assets,
      liabilities,
      summary,
      latestReport: latestReport ?? this.store.getLatestReport(),
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: ACCW_METADATA_VERSION,
      notes,
    };
  }
}

function cloneCatalog(catalog: AccountingWorkerCatalog): AccountingWorkerCatalog {
  return {
    ...catalog,
    accountTypes: [...catalog.accountTypes],
    entryTypes: [...catalog.entryTypes],
    currencies: [...catalog.currencies],
    accounts: catalog.accounts.map((a) => ({ ...a, metadata: { ...a.metadata } })),
    entries: catalog.entries.map((e) => ({ ...e, lines: e.lines.map((l) => ({ ...l })) })),
    reports: catalog.reports.map((r) => ({ ...r })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
