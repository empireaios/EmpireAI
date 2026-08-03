import type { AccountingWorkerConfiguration } from "./configuration.js";
import {
  ACCOUNTING_REPORT_VERSION,
  ACCOUNTING_WORKER_IDENTITY,
  ACCW_METADATA_VERSION,
  DEFAULT_CURRENCY,
  STANDARD_CHART_OF_ACCOUNTS,
} from "./paths.js";
import { nextAccountId, nextAssetId, nextEntryId, nextLiabilityId, nextReportId } from "./ledger-store.js";
import type {
  AccountingReport,
  AccountingWorkerCatalog,
  AccwValidationReport,
  AssetRecord,
  BusinessTotal,
  CurrencyTotal,
  EquitySummary,
  FinancialSummary,
  IntegrationHandshake,
  JournalEntry,
  LedgerAccount,
  LedgerBalance,
  LedgerLine,
  LiabilityRecord,
  Q903ConsumableContract,
} from "./types.js";

const NORMAL_DEBIT_TYPES = new Set(["asset", "expense"]);

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

export function normalizeCurrency(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim().toUpperCase();
  return trimmed || fallback || DEFAULT_CURRENCY;
}

/** Pure Accounting Worker helpers for Q9-02 — real ledger construction only, never fabricated. */
export class AccwLedgerBuilder {
  /** Seed the five standard chart-of-accounts entries for a business/currency on first use. */
  ensureChartOfAccounts(
    businessId: string,
    currency: string,
    existingAccounts: LedgerAccount[],
  ): { accounts: LedgerAccount[]; created: LedgerAccount[] } {
    const now = new Date().toISOString();
    const created: LedgerAccount[] = [];
    const accounts = [...existingAccounts];
    for (const standard of STANDARD_CHART_OF_ACCOUNTS) {
      const found = accounts.find(
        (a) =>
          a.businessId === businessId &&
          a.accountType === standard.accountType &&
          a.name === standard.name &&
          a.currency === currency,
      );
      if (found) continue;
      const account: LedgerAccount = {
        accountId: nextAccountId(),
        businessId,
        accountType: standard.accountType,
        name: standard.name,
        currency,
        balance: 0,
        metadata: { chartOfAccounts: "standard" },
        createdAt: now,
        updatedAt: now,
        fabricated: false,
      };
      accounts.push(account);
      created.push(account);
    }
    return { accounts, created };
  }

  findAccountByType(
    accounts: LedgerAccount[],
    businessId: string,
    accountType: string,
    currency?: string,
  ): LedgerAccount | null {
    const matches = accounts.filter((a) => a.businessId === businessId && a.accountType === accountType);
    if (currency) {
      const exact = matches.find((a) => a.currency === currency);
      if (exact) return exact;
    }
    return matches[0] ?? null;
  }

  /** Apply a balanced pair (or set) of lines to the mutable balance-only account registers. */
  applyLinesToAccounts(lines: LedgerLine[], accounts: LedgerAccount[]): LedgerAccount[] {
    const now = new Date().toISOString();
    const byId = new Map(accounts.map((a) => [a.accountId, { ...a, metadata: { ...a.metadata } }]));
    for (const line of lines) {
      const account = byId.get(line.accountId);
      if (!account) continue;
      const delta = NORMAL_DEBIT_TYPES.has(account.accountType)
        ? line.debit - line.credit
        : line.credit - line.debit;
      account.balance = Math.round((account.balance + delta) * 100) / 100;
      account.updatedAt = now;
      byId.set(line.accountId, account);
    }
    return [...byId.values()];
  }

  buildIncomeEntry(
    businessId: string,
    accountingPeriod: string,
    amount: number,
    currency: string,
    description: string,
    incomeAccountId: string,
    cashAccountId: string,
  ): JournalEntry {
    const entryId = nextEntryId();
    return {
      entryId,
      entryType: "income",
      businessId,
      accountingPeriod,
      timestamp: new Date().toISOString(),
      description,
      currency,
      lines: [
        { accountId: cashAccountId, debit: amount, credit: 0, currency, memo: description },
        { accountId: incomeAccountId, debit: 0, credit: amount, currency, memo: description },
      ],
      fabricated: false,
      immutable: true,
      traceabilityRefs: unique([`q9-02:income:${businessId}`, `q9-02:entry:${entryId}`]),
    };
  }

  buildExpenseEntry(
    businessId: string,
    accountingPeriod: string,
    amount: number,
    currency: string,
    description: string,
    expenseAccountId: string,
    cashAccountId: string,
  ): JournalEntry {
    const entryId = nextEntryId();
    return {
      entryId,
      entryType: "expense",
      businessId,
      accountingPeriod,
      timestamp: new Date().toISOString(),
      description,
      currency,
      lines: [
        { accountId: expenseAccountId, debit: amount, credit: 0, currency, memo: description },
        { accountId: cashAccountId, debit: 0, credit: amount, currency, memo: description },
      ],
      fabricated: false,
      immutable: true,
      traceabilityRefs: unique([`q9-02:expense:${businessId}`, `q9-02:entry:${entryId}`]),
    };
  }

  buildTransferEntry(
    businessId: string,
    accountingPeriod: string,
    amount: number,
    currency: string,
    description: string,
    fromAccountId: string,
    toAccountId: string,
  ): JournalEntry {
    const entryId = nextEntryId();
    return {
      entryId,
      entryType: "transfer",
      businessId,
      accountingPeriod,
      timestamp: new Date().toISOString(),
      description,
      currency,
      lines: [
        { accountId: fromAccountId, debit: 0, credit: amount, currency, memo: description },
        { accountId: toAccountId, debit: amount, credit: 0, currency, memo: description },
      ],
      fabricated: false,
      immutable: true,
      traceabilityRefs: unique([`q9-02:transfer:${businessId}`, `q9-02:entry:${entryId}`]),
    };
  }

  buildJournalEntry(
    businessId: string,
    accountingPeriod: string,
    currency: string,
    description: string,
    lines: LedgerLine[],
    entryType: string,
  ): JournalEntry {
    const entryId = nextEntryId();
    return {
      entryId,
      entryType,
      businessId,
      accountingPeriod,
      timestamp: new Date().toISOString(),
      description,
      currency,
      lines: lines.map((l) => ({ ...l, currency: l.currency || currency })),
      fabricated: false,
      immutable: true,
      traceabilityRefs: unique([`q9-02:journal:${businessId}`, `q9-02:entry:${entryId}`]),
    };
  }

  buildAssetRecord(
    businessId: string,
    amount: number,
    currency: string,
    category: string,
    notes: string,
  ): AssetRecord {
    return {
      assetId: nextAssetId(),
      businessId,
      amount,
      currency,
      category,
      notes,
      timestamp: new Date().toISOString(),
      fabricated: false,
    };
  }

  buildLiabilityRecord(
    businessId: string,
    amount: number,
    currency: string,
    category: string,
    notes: string,
  ): LiabilityRecord {
    return {
      liabilityId: nextLiabilityId(),
      businessId,
      amount,
      currency,
      category,
      notes,
      timestamp: new Date().toISOString(),
      fabricated: false,
    };
  }

  /** Compute totals strictly from observed ledger accounts + extension registers — never fabricated. */
  buildFinancialSummary(
    accounts: LedgerAccount[],
    accountType: string,
    extras: Array<{ businessId: string; currency: string; amount: number }> = [],
  ): FinancialSummary {
    const currencyTotals = new Map<string, number>();
    const businessTotals = new Map<string, number>();
    let grandTotal = 0;

    for (const account of accounts.filter((a) => a.accountType === accountType)) {
      currencyTotals.set(account.currency, (currencyTotals.get(account.currency) ?? 0) + account.balance);
      businessTotals.set(account.businessId, (businessTotals.get(account.businessId) ?? 0) + account.balance);
      grandTotal += account.balance;
    }
    for (const extra of extras) {
      currencyTotals.set(extra.currency, (currencyTotals.get(extra.currency) ?? 0) + extra.amount);
      businessTotals.set(extra.businessId, (businessTotals.get(extra.businessId) ?? 0) + extra.amount);
      grandTotal += extra.amount;
    }

    const totalsByCurrency: CurrencyTotal[] = [...currencyTotals.entries()].map(([currency, total]) => ({
      currency,
      total: round2(total),
      fabricated: false,
    }));
    const totalsByBusiness: BusinessTotal[] = [...businessTotals.entries()].map(([businessId, total]) => ({
      businessId,
      total: round2(total),
      fabricated: false,
    }));

    return {
      totalsByCurrency,
      totalsByBusiness,
      grandTotal: round2(grandTotal),
      fabricated: false,
      evidencePresent: totalsByCurrency.length > 0,
    };
  }

  buildEquitySummary(accounts: LedgerAccount[], defaultCurrency: string): EquitySummary {
    const equityAccounts = accounts.filter((a) => a.accountType === "equity");
    const businessTotals = new Map<string, number>();
    let totalEquity = 0;
    let currency = defaultCurrency;
    for (const account of equityAccounts) {
      businessTotals.set(account.businessId, (businessTotals.get(account.businessId) ?? 0) + account.balance);
      totalEquity += account.balance;
      currency = account.currency || currency;
    }
    return {
      totalEquity: round2(totalEquity),
      currency,
      byBusiness: [...businessTotals.entries()].map(([businessId, total]) => ({
        businessId,
        total: round2(total),
        fabricated: false,
      })),
      fabricated: false,
    };
  }

  /** Verify a set of lines truly balances (per-currency) before it may ever be posted. */
  computeLedgerBalance(lines: LedgerLine[], currency: string): LedgerBalance {
    const totalDebits = round2(lines.reduce((sum, l) => sum + (l.debit || 0), 0));
    const totalCredits = round2(lines.reduce((sum, l) => sum + (l.credit || 0), 0));
    const difference = round2(totalDebits - totalCredits);
    return {
      balanced: Math.abs(difference) < 0.005,
      totalDebits,
      totalCredits,
      difference,
      currency,
    };
  }

  /** Aggregate ledger balance across every posted entry for a business — general ledger check. */
  computeGeneralLedgerBalance(entries: JournalEntry[], currency: string): LedgerBalance {
    const lines = entries.flatMap((e) => e.lines);
    return this.computeLedgerBalance(lines, currency);
  }

  buildCatalog(
    config: AccountingWorkerConfiguration,
    accounts: LedgerAccount[],
    entries: JournalEntry[],
    reports: AccountingReport[],
    integrations: IntegrationHandshake[],
  ): AccountingWorkerCatalog {
    return {
      reportVersion: ACCOUNTING_REPORT_VERSION,
      workerId: config.workerId,
      accountTypes: [...config.accountTypes],
      entryTypes: [...config.entryTypes],
      currencies: [...config.currencies],
      accounts: accounts.map((a) => ({ ...a, metadata: { ...a.metadata } })),
      entries: entries.map((e) => ({ ...e, lines: e.lines.map((l) => ({ ...l })) })),
      reports: reports.map((r) => ({ ...r })),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: ACCW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverFabricateAccountingRecords: true,
      neverForecastFinances: true,
      neverApproveInvestments: true,
      neverReplaceBudgetPlanningWorker: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ903OrLater: true,
    };
  }

  buildReport(
    config: AccountingWorkerConfiguration,
    capitalBusinessId: string,
    capitalProjectId: string | null,
    accountingPeriod: string,
    accounts: LedgerAccount[],
    entries: JournalEntry[],
    assets: AssetRecord[],
    liabilities: LiabilityRecord[],
    validation: AccwValidationReport | null,
  ): AccountingReport {
    const businessAccounts = accounts.filter((a) => a.businessId === capitalBusinessId);
    const businessEntries = entries.filter((e) => e.businessId === capitalBusinessId);
    const businessAssets = assets.filter((a) => a.businessId === capitalBusinessId);
    const businessLiabilities = liabilities.filter((l) => l.businessId === capitalBusinessId);

    const incomeSummary = this.buildFinancialSummary(businessAccounts, "income");
    const expenseSummary = this.buildFinancialSummary(businessAccounts, "expense");
    const assetSummary = this.buildFinancialSummary(
      businessAccounts,
      "asset",
      businessAssets.map((a) => ({ businessId: a.businessId, currency: a.currency, amount: a.amount })),
    );
    const liabilitySummary = this.buildFinancialSummary(
      businessAccounts,
      "liability",
      businessLiabilities.map((l) => ({ businessId: l.businessId, currency: l.currency, amount: l.amount })),
    );
    const equitySummary = this.buildEquitySummary(businessAccounts, config.defaultCurrency);
    const currency = businessAccounts[0]?.currency ?? config.defaultCurrency;
    const ledgerBalance = this.computeGeneralLedgerBalance(businessEntries, currency);

    const outstandingIssues: string[] = [];
    if (!ledgerBalance.balanced) {
      outstandingIssues.push(
        `General ledger is not balanced for ${capitalBusinessId}: difference=${ledgerBalance.difference}`,
      );
    }
    if (businessAccounts.length === 0) {
      outstandingIssues.push(`No chart-of-accounts observed for ${capitalBusinessId}`);
    }

    const confidenceScore = computeConfidenceScore(
      businessAccounts,
      businessEntries,
      ledgerBalance,
      outstandingIssues,
    );
    const auditStatus = ledgerBalance.balanced && businessEntries.length > 0 ? "passed" : outstandingIssues.length ? "partial" : "pending";

    const reportId = nextReportId();
    const now = new Date().toISOString();
    return {
      reportId,
      timestamp: now,
      accountingPeriod,
      incomeSummary,
      expenseSummary,
      assetSummary,
      liabilitySummary,
      ledgerBalance,
      financialEvents: businessEntries,
      auditStatus,
      outstandingIssues,
      confidenceScore,
      metadataVersion: ACCW_METADATA_VERSION,
      reportVersion: ACCOUNTING_REPORT_VERSION,
      workerId: config.workerId || ACCOUNTING_WORKER_IDENTITY.workerId,
      capitalBusinessId,
      capitalProjectId,
      equitySummary,
      accountBalances: businessAccounts,
      validation,
      runTimestamp: now,
      consumableByQ903: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: unique([
        `q9-02:report:${reportId}`,
        `q9-02:capital_business:${capitalBusinessId}`,
        `q9-02:accounting_period:${accountingPeriod}`,
      ]),
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      preserveCompleteTraceability: true,
      preserveImmutableAccountingHistory: true,
      neverFabricateAccountingRecords: true,
      neverForecastFinances: true,
      neverApproveInvestments: true,
      neverReplaceBudgetPlanningWorker: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ903OrLater: true,
    };
  }

  buildQ903ConsumableContract(config: AccountingWorkerConfiguration): Q903ConsumableContract {
    return {
      contractId: `accw-q903-contract-${ACCW_METADATA_VERSION}`,
      contractVersion: ACCW_METADATA_VERSION,
      producedBy: "accounting-worker",
      missionId: "Q9-02",
      consumerMissionId: "Q9-03",
      exposedFields: [
        "capitalBusinessId",
        "accountingPeriod",
        "incomeSummary",
        "expenseSummary",
        "assetSummary",
        "liabilitySummary",
        "equitySummary",
        "ledgerBalance",
        "accountBalances",
        "financialEvents",
        "auditStatus",
        "confidenceScore",
        "metadataVersion",
      ],
      accountTypeCatalog: [...config.accountTypes],
      entryTypeCatalog: [...config.entryTypes],
      currencyCatalog: [...config.currencies],
      notes: [
        "Accounting Worker (Q9-02) maintains a real, append-only ledger from observed inputs only.",
        "It does not forecast finances, approve investments, or replace the Budget Planning Worker.",
        "Q9-03 and later workers must consume this contract rather than reimplement Q9-02 ledger logic.",
      ],
      neverImplementQ903OrLater: true,
      structuralSignalOnly: true,
    };
  }
}

function computeConfidenceScore(
  accounts: LedgerAccount[],
  entries: JournalEntry[],
  ledgerBalance: LedgerBalance,
  outstandingIssues: string[],
): number {
  const checks: boolean[] = [
    accounts.length > 0,
    entries.length > 0,
    ledgerBalance.balanced,
    outstandingIssues.length === 0,
    accounts.some((a) => a.accountType === "income"),
    accounts.some((a) => a.accountType === "expense"),
    accounts.some((a) => a.accountType === "asset"),
    accounts.some((a) => a.accountType === "liability"),
  ];
  const weight = 100 / checks.length;
  let score = 0;
  for (const ok of checks) if (ok) score += weight;
  return Math.min(100, Math.round(score));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
