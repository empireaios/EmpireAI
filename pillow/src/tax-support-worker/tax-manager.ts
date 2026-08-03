import type { TaxSupportWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type TaxSupportWorkerDependencies } from "./integrations.js";
import {
  buildExpenseSummary,
  buildIncomeSummary,
  buildProfessionalReviewFlags,
  buildTaxCategorySummaries,
  computeConfidenceScore,
  detectMissingDocumentation,
  generateFilingReminders,
  resolvePeriodEndDate,
} from "./tax-calculator.js";
import {
  buildCatalog,
  buildEngineRecord,
  buildOrganisedRecord,
  buildQ908ConsumableContract,
  buildTaxSupportDocument,
  buildTaxSupportReport,
} from "./tax-builder.js";
import { TaxSupportStore } from "./tax-store.js";
import { appendTswLog } from "./tsw-logging.js";
import { TswValidator } from "./tax-validator.js";
import type {
  InjectedAccountingEntry,
  Q908ConsumableContract,
  TaxSupportCategory,
  TaxSupportDocument,
  TaxSupportTransaction,
  TswInput,
  TswRunReport,
} from "./types.js";
import { TAX_SUPPORT_CATEGORIES } from "./paths.js";

function isTaxSupportCategory(value: string | null | undefined): value is TaxSupportCategory {
  return Boolean(value && (TAX_SUPPORT_CATEGORIES as readonly string[]).includes(value));
}

/**
 * Convert verified Accounting Worker entries into tax-support transactions
 * only when lines already carry a verified taxSupportCategory. Never invents
 * categories, tax rates, or obligations from raw debit/credit alone.
 */
export function mapAccountingEntriesToTransactions(
  entries: readonly InjectedAccountingEntry[],
  reportingPeriod: string,
): TaxSupportTransaction[] {
  const out: TaxSupportTransaction[] = [];
  for (const entry of entries) {
    if (reportingPeriod && entry.accountingPeriod !== reportingPeriod) continue;
    for (const [index, line] of entry.lines.entries()) {
      if (!isTaxSupportCategory(line.taxSupportCategory ?? null)) continue;
      const amountMinor = Math.abs(Number(line.debit || 0) - Number(line.credit || 0));
      if (!Number.isInteger(amountMinor)) continue;
      out.push({
        transactionId: `${entry.entryId}-line-${index}`,
        category: line.taxSupportCategory!,
        amountMinor,
        currency: line.currency ?? entry.currency,
        businessId: entry.businessId,
        reportingPeriod: entry.accountingPeriod,
        sourceRef: entry.entryId,
        description: `Verified accounting line ${line.accountId}`,
        recordKind: "factual_financial_record",
        fabricated: false,
      });
    }
  }
  return out;
}

export class TaxSupportWorkerManager {
  private readonly store = new TaxSupportStore();
  private readonly integrations = new IntegrationCoordinator();
  private readonly validator = new TswValidator();
  private connected = false;

  bindIntegrations(deps: TaxSupportWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  getStore() {
    return this.store;
  }

  getEngineRecord() {
    return this.store.getEngineRecord();
  }

  getCatalog() {
    return this.store.getCatalog();
  }

  getReports() {
    return this.store.getReports();
  }

  getLatestReport() {
    return this.store.getLatestReport();
  }

  getLatestBusinessId() {
    return this.store.getLatestBusinessId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getQ908ConsumableContract(config: TaxSupportWorkerConfiguration): Q908ConsumableContract {
    return buildQ908ConsumableContract(config);
  }

  connect(config: TaxSupportWorkerConfiguration, _input: TswInput = {}): TswRunReport {
    const handshakes = this.integrations.connect(config.integrationTargets as never);
    this.connected = true;
    this.store.setCatalog(buildCatalog(config));
    this.refreshEngineRecord(config, "connected", "healthy", "passed");
    this.store.appendAudit("connect", `handshakes=${handshakes.length}`);
    return {
      action: "connect",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      handshakes,
      details: "Tax Support Worker connected",
    };
  }

  consumeAccounting(config: TaxSupportWorkerConfiguration, input: TswInput = {}): TswRunReport {
    const entries = this.integrations.fetchAccountingEntries();
    const period = input.reportingPeriod?.trim() ?? "";
    const mapped = mapAccountingEntriesToTransactions(entries, period);
    const merged: TswInput = {
      ...input,
      transactions: [...(input.transactions ?? []), ...mapped],
    };
    appendTswLog({
      event: "consume_accounting",
      details: `entries=${entries.length} mapped=${mapped.length}`,
    });
    this.store.appendAudit("consume_accounting", `mapped=${mapped.length}`);
    return this.organiseRecords(config, merged, "consume_accounting");
  }

  consumeCashflow(_config: TaxSupportWorkerConfiguration, input: TswInput = {}): TswRunReport {
    const reports = this.integrations.fetchCashflowReports();
    this.store.appendAudit("consume_cashflow", `reports=${reports.length}`);
    return {
      action: "consume_cashflow",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      details: `Consumed ${reports.length} cashflow report(s) for traceability`,
    };
  }

  consumeProfitability(_config: TaxSupportWorkerConfiguration, input: TswInput = {}): TswRunReport {
    const reports = this.integrations.fetchProfitabilityReports();
    this.store.appendAudit("consume_profitability", `reports=${reports.length}`);
    return {
      action: "consume_profitability",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      details: `Consumed ${reports.length} profitability report(s) for traceability`,
    };
  }

  consumeForecasting(_config: TaxSupportWorkerConfiguration, input: TswInput = {}): TswRunReport {
    const reports = this.integrations.fetchForecastingReports();
    this.store.appendAudit("consume_forecasting", `reports=${reports.length}`);
    return {
      action: "consume_forecasting",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: input.capitalBusinessId ?? null,
      reportingPeriod: input.reportingPeriod ?? null,
      details: `Consumed ${reports.length} forecasting report(s) for contextual reminders only`,
    };
  }

  organiseRecords(
    config: TaxSupportWorkerConfiguration,
    input: TswInput = {},
    action: TswRunReport["action"] = "organise_records",
  ): TswRunReport {
    const future = this.validator.rejectFutureMissions(
      typeof (input as { missionId?: string }).missionId === "string"
        ? (input as { missionId?: string }).missionId
        : null,
    );
    if (future.decision === "fail") {
      return {
        action,
        validation: future,
        runTimestamp: new Date().toISOString(),
        details: future.errors.join("; "),
      };
    }
    const validation = this.validator.validateInput(input);
    if (validation.decision === "fail") {
      return {
        action,
        validation,
        runTimestamp: new Date().toISOString(),
        capitalBusinessId: input.capitalBusinessId ?? null,
        reportingPeriod: input.reportingPeriod ?? null,
        details: validation.errors.join("; "),
      };
    }
    const businessId =
      this.integrations.resolveCapitalBusinessId(input.capitalBusinessId) ??
      input.capitalBusinessId!.trim();
    const reportingPeriod = input.reportingPeriod!.trim();
    const currency = (input.currency ?? config.defaultCurrency).trim();
    const transactions = (input.transactions ?? []).filter((t) => t.businessId === businessId || !t.businessId);
    const lockedTransactions: TaxSupportTransaction[] = transactions.map((t) => ({
      ...t,
      businessId: t.businessId || businessId,
      reportingPeriod: t.reportingPeriod || reportingPeriod,
      recordKind: "factual_financial_record",
      fabricated: false,
    }));
    for (const t of lockedTransactions) {
      const tv = this.validator.validateTransaction(t);
      if (tv.decision === "fail") {
        return {
          action,
          validation: tv,
          runTimestamp: new Date().toISOString(),
          capitalBusinessId: businessId,
          reportingPeriod,
          details: tv.errors.join("; "),
        };
      }
    }
    const documents: TaxSupportDocument[] = (input.documents ?? []).map((d) =>
      buildTaxSupportDocument({
        kind: d.kind,
        businessId: d.businessId?.trim() || businessId,
        reportingPeriod: d.reportingPeriod?.trim() || reportingPeriod,
        sourceRef: d.sourceRef,
      }),
    );
    const record = buildOrganisedRecord({
      businessId,
      reportingPeriod,
      currency,
      transactions: lockedTransactions,
      documents,
    });
    this.store.addRecord(record);
    for (const doc of documents) this.store.addDocument(doc);
    this.refreshEngineRecord(config, "active", "healthy", "passed", businessId, reportingPeriod);
    this.store.appendAudit(action, `record=${record.recordId} tx=${lockedTransactions.length}`);
    return {
      action,
      validation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: businessId,
      reportingPeriod,
      organisedRecord: record,
      details: `Organised ${lockedTransactions.length} verified tax-support transaction(s)`,
    };
  }

  prepareIncomeSummary(config: TaxSupportWorkerConfiguration, input: TswInput = {}): TswRunReport {
    const organised = this.ensureOrganised(config, input);
    if (organised.validation.decision === "fail" || !organised.organisedRecord) return organised;
    const summary = buildIncomeSummary(organised.organisedRecord.transactions, organised.organisedRecord.currency);
    return {
      action: "prepare_income_summary",
      validation: organised.validation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: organised.capitalBusinessId,
      reportingPeriod: organised.reportingPeriod,
      organisedRecord: organised.organisedRecord,
      incomeSummary: summary,
      details: "Factual income summary prepared — not tax advice",
    };
  }

  prepareExpenseSummary(config: TaxSupportWorkerConfiguration, input: TswInput = {}): TswRunReport {
    const organised = this.ensureOrganised(config, input);
    if (organised.validation.decision === "fail" || !organised.organisedRecord) return organised;
    const summary = buildExpenseSummary(organised.organisedRecord.transactions, organised.organisedRecord.currency);
    return {
      action: "prepare_expense_summary",
      validation: organised.validation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: organised.capitalBusinessId,
      reportingPeriod: organised.reportingPeriod,
      organisedRecord: organised.organisedRecord,
      expenseSummary: summary,
      details: "Factual expense summary prepared — not tax advice",
    };
  }

  detectMissingDocs(config: TaxSupportWorkerConfiguration, input: TswInput = {}): TswRunReport {
    const organised = this.ensureOrganised(config, input);
    if (organised.validation.decision === "fail" || !organised.organisedRecord) return organised;
    const missing = detectMissingDocumentation({
      businessId: organised.organisedRecord.businessId,
      reportingPeriod: organised.organisedRecord.reportingPeriod,
      documents: organised.organisedRecord.documents,
      requiredKinds: config.requiredDocumentKinds,
    });
    for (const item of missing) this.store.addMissing(item);
    return {
      action: "detect_missing_documentation",
      validation: organised.validation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: organised.capitalBusinessId,
      reportingPeriod: organised.reportingPeriod,
      organisedRecord: organised.organisedRecord,
      missingDocumentation: missing,
      details: `Missing documentation signals: ${missing.length}`,
    };
  }

  generateReminders(config: TaxSupportWorkerConfiguration, input: TswInput = {}): TswRunReport {
    const organised = this.ensureOrganised(config, input);
    if (organised.validation.decision === "fail" || !organised.organisedRecord) return organised;
    const periodEnd = resolvePeriodEndDate(
      organised.organisedRecord.reportingPeriod,
      input.periodEndDate,
    );
    const reminders = generateFilingReminders({
      businessId: organised.organisedRecord.businessId,
      reportingPeriod: organised.organisedRecord.reportingPeriod,
      periodEndDate: periodEnd,
      schedule: config.filingReminderSchedule,
    });
    for (const reminder of reminders) this.store.addReminder(reminder);
    this.refreshEngineRecord(
      config,
      "active",
      "healthy",
      "passed",
      organised.organisedRecord.businessId,
      organised.organisedRecord.reportingPeriod,
    );
    return {
      action: "generate_filing_reminders",
      validation: organised.validation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: organised.capitalBusinessId,
      reportingPeriod: organised.reportingPeriod,
      organisedRecord: organised.organisedRecord,
      filingReminders: reminders,
      details: `Generated ${reminders.length} filing reminder schedule entr(y/ies) — not advice`,
    };
  }

  flagProfessionalReview(config: TaxSupportWorkerConfiguration, input: TswInput = {}): TswRunReport {
    const organised = this.ensureOrganised(config, input);
    if (organised.validation.decision === "fail" || !organised.organisedRecord) return organised;
    const missing =
      this.detectMissingDocs(config, input).missingDocumentation ??
      detectMissingDocumentation({
        businessId: organised.organisedRecord.businessId,
        reportingPeriod: organised.organisedRecord.reportingPeriod,
        documents: organised.organisedRecord.documents,
        requiredKinds: config.requiredDocumentKinds,
      });
    const flags = buildProfessionalReviewFlags({
      businessId: organised.organisedRecord.businessId,
      reportingPeriod: organised.organisedRecord.reportingPeriod,
      transactions: organised.organisedRecord.transactions,
      missing,
      jurisdictionExtensionPoint: input.jurisdictionExtensionPoint?.trim() || null,
      highValueThresholdMinor: config.highValueTransactionThresholdMinor,
    });
    for (const flag of flags) this.store.addFlag(flag);
    return {
      action: "flag_professional_review",
      validation: organised.validation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: organised.capitalBusinessId,
      reportingPeriod: organised.reportingPeriod,
      organisedRecord: organised.organisedRecord,
      missingDocumentation: missing,
      professionalReviewFlags: flags,
      details: `Professional review flags: ${flags.length}`,
    };
  }

  produceTaxSupportReport(config: TaxSupportWorkerConfiguration, input: TswInput = {}): TswRunReport {
    const organised = this.ensureOrganised(config, input);
    if (organised.validation.decision === "fail" || !organised.organisedRecord) return organised;
    const record = organised.organisedRecord;
    const incomeSummary = buildIncomeSummary(record.transactions, record.currency);
    const expenseSummary = buildExpenseSummary(record.transactions, record.currency);
    const taxCategories = buildTaxCategorySummaries(record.transactions, record.currency);
    const missing = detectMissingDocumentation({
      businessId: record.businessId,
      reportingPeriod: record.reportingPeriod,
      documents: record.documents,
      requiredKinds: config.requiredDocumentKinds,
    });
    for (const item of missing) this.store.addMissing(item);
    const periodEnd = resolvePeriodEndDate(record.reportingPeriod, input.periodEndDate);
    const reminders = generateFilingReminders({
      businessId: record.businessId,
      reportingPeriod: record.reportingPeriod,
      periodEndDate: periodEnd,
      schedule: config.filingReminderSchedule,
    });
    for (const reminder of reminders) this.store.addReminder(reminder);
    const jurisdictionExtensionPoint = input.jurisdictionExtensionPoint?.trim() || null;
    const flags = buildProfessionalReviewFlags({
      businessId: record.businessId,
      reportingPeriod: record.reportingPeriod,
      transactions: record.transactions,
      missing,
      jurisdictionExtensionPoint,
      highValueThresholdMinor: config.highValueTransactionThresholdMinor,
    });
    for (const flag of flags) this.store.addFlag(flag);
    const evidence = [
      ...record.sourceRefs,
      ...this.integrations.fetchCashflowReports().map((r) => String(r.reportId ?? "cashflow")),
      ...this.integrations.fetchProfitabilityReports().map((r) => String(r.reportId ?? "profitability")),
      ...this.integrations.fetchForecastingReports().map((r) => String(r.reportId ?? "forecast")),
    ];
    const outstandingIssues = [
      ...missing.map((m) => `missing:${m.kind}`),
      ...flags.filter((f) => f.severity !== "info").map((f) => `review:${f.reason}`),
    ];
    const confidenceScore = computeConfidenceScore({
      transactionCount: record.transactions.length,
      missingCount: missing.length,
      documentCount: record.documents.length,
      requiredDocumentCount: config.requiredDocumentKinds.length,
    });
    const draft = buildTaxSupportReport({
      capitalBusinessId: record.businessId,
      capitalProjectId: input.capitalProjectId?.trim() || `project-${record.businessId}`,
      reportingPeriod: record.reportingPeriod,
      currency: record.currency,
      jurisdictionExtensionPoint,
      incomeSummary,
      expenseSummary,
      taxCategories,
      supportingRecords: [record],
      missingDocumentation: missing,
      filingReminders: reminders,
      professionalReviewFlags: flags,
      supportingEvidence: evidence,
      outstandingIssues,
      confidenceScore,
      validation: { decision: "pass", errors: [], warnings: [] },
      config,
    });
    const reportValidation = this.validator.validateReport(draft);
    const report = { ...draft, validation: reportValidation };
    if (reportValidation.decision === "fail") {
      return {
        action: "produce_tax_support_report",
        validation: reportValidation,
        runTimestamp: new Date().toISOString(),
        capitalBusinessId: record.businessId,
        reportingPeriod: record.reportingPeriod,
        details: reportValidation.errors.join("; "),
      };
    }
    this.store.addReport(report);
    const engineValidationStatus =
      reportValidation.decision === "pass"
        ? ("passed" as const)
        : reportValidation.decision === "partial"
          ? ("partial" as const)
          : ("failed" as const);
    this.refreshEngineRecord(config, "active", "healthy", engineValidationStatus, record.businessId, record.reportingPeriod);
    this.store.appendAudit("produce_tax_support_report", `report=${report.reportId}`);
    appendTswLog({ event: "produce_report", details: `report=${report.reportId}` });
    return {
      action: "produce_tax_support_report",
      validation: reportValidation,
      runTimestamp: new Date().toISOString(),
      capitalBusinessId: record.businessId,
      reportingPeriod: record.reportingPeriod,
      organisedRecord: record,
      incomeSummary,
      expenseSummary,
      missingDocumentation: missing,
      filingReminders: reminders,
      professionalReviewFlags: flags,
      taxSupportReport: report,
      details: `Tax Support Report ${report.reportId} produced`,
    };
  }

  submitReport(config: TaxSupportWorkerConfiguration, input: TswInput = {}): TswRunReport {
    const produced = this.produceTaxSupportReport(config, input);
    if (produced.validation.decision === "fail" || !produced.taxSupportReport) return produced;
    let report = produced.taxSupportReport;
    const audit = this.integrations.recordAudit(report);
    if (audit.audited) {
      report = { ...report, auditStatus: "passed" };
    }
    const submitted = this.integrations.submitReport(report);
    report = {
      ...report,
      submittedThroughExecutiveReportingRuntime: submitted.submitted,
      executiveReportId: submitted.executiveReportId,
    };
    this.store.addReport(report);
    this.store.appendAudit(
      "submit_report",
      `submitted=${submitted.submitted} executiveReportId=${submitted.executiveReportId}`,
    );
    return {
      ...produced,
      action: "submit_report",
      taxSupportReport: report,
      details: submitted.submitted
        ? `Submitted through ERR as ${submitted.executiveReportId}`
        : "ERR unavailable — report preserved locally",
    };
  }

  list(): TswRunReport {
    return {
      action: "list",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      details: `reports=${this.store.getReports().length}`,
      taxSupportReport: this.store.getLatestReport(),
    };
  }

  validate(config: TaxSupportWorkerConfiguration, input: TswInput = {}): TswRunReport {
    const validation = this.validator.validateInput({
      capitalBusinessId: input.capitalBusinessId ?? "validation-probe",
      reportingPeriod: input.reportingPeriod ?? "2026-01",
      ...input,
      validated: true,
    });
    return {
      action: "validate",
      validation,
      runTimestamp: new Date().toISOString(),
      details: `connected=${this.connected} catalog=${Boolean(this.store.getCatalog() ?? buildCatalog(config))}`,
    };
  }

  diagnostics(config: TaxSupportWorkerConfiguration): TswRunReport {
    this.refreshEngineRecord(config, this.connected ? "active" : "disconnected", "healthy", "passed");
    return {
      action: "diagnostics",
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: new Date().toISOString(),
      handshakes: this.integrations.getHandshakes(),
      details: JSON.stringify({
        records: this.store.getRecords().length,
        reminders: this.store.getReminders().length,
        missing: this.store.getMissing().length,
        flags: this.store.getFlags().length,
        reports: this.store.getReports().length,
        engineRecord: this.store.getEngineRecord(),
      }),
    };
  }

  private ensureOrganised(config: TaxSupportWorkerConfiguration, input: TswInput): TswRunReport {
    if (input.transactions?.length || input.documents?.length) {
      return this.organiseRecords(config, input);
    }
    const existing = this.store.getRecords().filter((r) => {
      if (input.capitalBusinessId && r.businessId !== input.capitalBusinessId) return false;
      if (input.reportingPeriod && r.reportingPeriod !== input.reportingPeriod) return false;
      return true;
    });
    if (existing.length) {
      const record = existing[existing.length - 1]!;
      return {
        action: "organise_records",
        validation: { decision: "pass", errors: [], warnings: [] },
        runTimestamp: new Date().toISOString(),
        capitalBusinessId: record.businessId,
        reportingPeriod: record.reportingPeriod,
        organisedRecord: record,
        details: "Reused organised tax-support record",
      };
    }
    return this.organiseRecords(config, input);
  }

  private refreshEngineRecord(
    config: TaxSupportWorkerConfiguration,
    operationalState: "disconnected" | "connected" | "active" | "failed",
    healthStatus: "healthy" | "degraded" | "failed" | "standby",
    validationStatus: "pending" | "passed" | "partial" | "failed",
    lastBusinessId: string | null = this.store.getLatestBusinessId(),
    lastReportingPeriod: string | null = this.store.getLatestReport()?.reportingPeriod ?? null,
  ) {
    if (!this.store.getCatalog()) this.store.setCatalog(buildCatalog(config));
    this.store.setEngineRecord(
      buildEngineRecord({
        operationalState,
        healthStatus,
        validationStatus,
        totalRecords: this.store.getRecords().length,
        totalReminders: this.store.getReminders().length,
        totalMissingDocs: this.store.getMissing().length,
        totalFlags: this.store.getFlags().length,
        lastBusinessId,
        lastReportingPeriod,
        handshakes: this.integrations.getHandshakes(),
      }),
    );
  }
}
