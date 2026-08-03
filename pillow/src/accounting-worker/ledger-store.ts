import type { AccountingReport, AssetRecord, JournalEntry, LedgerAccount, LiabilityRecord } from "./types.js";

let accountSeq = 0;
let entrySeq = 0;
let assetSeq = 0;
let liabilitySeq = 0;
let reportSeq = 0;
let sessionSeq = 0;

export function resetAccwSequenceForTesting() {
  accountSeq = 0;
  entrySeq = 0;
  assetSeq = 0;
  liabilitySeq = 0;
  reportSeq = 0;
  sessionSeq = 0;
}

export function nextAccountId() {
  accountSeq += 1;
  return `accw-acct-${String(accountSeq).padStart(4, "0")}`;
}

export function nextEntryId() {
  entrySeq += 1;
  return `accw-entry-${String(entrySeq).padStart(4, "0")}`;
}

export function nextAssetId() {
  assetSeq += 1;
  return `accw-asset-${String(assetSeq).padStart(4, "0")}`;
}

export function nextLiabilityId() {
  liabilitySeq += 1;
  return `accw-liab-${String(liabilitySeq).padStart(4, "0")}`;
}

export function nextReportId() {
  reportSeq += 1;
  return `accw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextSessionId() {
  sessionSeq += 1;
  return `accw-sess-${String(sessionSeq).padStart(4, "0")}`;
}

/**
 * Authoritative in-memory ledger store — append-only journal entries, mutable
 * (balance-only) account/asset/liability registers, and immutable audit trail.
 * Past journal entries are never rewritten or removed once posted.
 */
export class AccwLedgerStore {
  private accounts = new Map<string, LedgerAccount>();
  private entries: JournalEntry[] = [];
  private assets: AssetRecord[] = [];
  private liabilities: LiabilityRecord[] = [];
  private reports = new Map<string, AccountingReport>();
  private latestBusinessId: string | null = null;
  private latestReportBusinessId: string | null = null;
  private auditTrail: Array<{ timestamp: string; action: string; detail: string }> = [];

  seed(accounts: LedgerAccount[], entries: JournalEntry[]) {
    this.accounts.clear();
    this.entries = [];
    for (const account of accounts) {
      this.accounts.set(account.accountId, cloneAccount(account));
      this.latestBusinessId = account.businessId;
    }
    for (const entry of entries) {
      this.entries.push(cloneEntry(entry));
      this.latestBusinessId = entry.businessId;
    }
  }

  listAccounts(): LedgerAccount[] {
    return [...this.accounts.values()].map(cloneAccount);
  }

  listAccountsByBusiness(businessId: string): LedgerAccount[] {
    return this.listAccounts().filter((a) => a.businessId === businessId);
  }

  getAccount(accountId: string): LedgerAccount | null {
    const account = this.accounts.get(accountId);
    return account ? cloneAccount(account) : null;
  }

  upsertAccount(account: LedgerAccount): LedgerAccount {
    this.accounts.set(account.accountId, cloneAccount(account));
    this.latestBusinessId = account.businessId;
    this.audit(`upsert_account:${account.accountId}`, `business=${account.businessId} type=${account.accountType}`);
    return this.getAccount(account.accountId)!;
  }

  countAccounts(): number {
    return this.accounts.size;
  }

  /** Append an immutable journal entry — past entries are never mutated or removed. */
  appendEntry(entry: JournalEntry): JournalEntry {
    this.entries.push(cloneEntry(entry));
    this.latestBusinessId = entry.businessId;
    this.audit(`append_entry:${entry.entryId}`, `business=${entry.businessId} type=${entry.entryType}`);
    return cloneEntry(entry);
  }

  listEntries(): JournalEntry[] {
    return this.entries.map(cloneEntry);
  }

  listEntriesByBusiness(businessId: string): JournalEntry[] {
    return this.listEntries().filter((e) => e.businessId === businessId);
  }

  countEntries(): number {
    return this.entries.length;
  }

  addAsset(asset: AssetRecord): AssetRecord {
    this.assets.push({ ...asset });
    this.latestBusinessId = asset.businessId;
    this.audit(`add_asset:${asset.assetId}`, `business=${asset.businessId} amount=${asset.amount}`);
    return { ...asset };
  }

  listAssets(): AssetRecord[] {
    return this.assets.map((a) => ({ ...a }));
  }

  listAssetsByBusiness(businessId: string): AssetRecord[] {
    return this.listAssets().filter((a) => a.businessId === businessId);
  }

  addLiability(liability: LiabilityRecord): LiabilityRecord {
    this.liabilities.push({ ...liability });
    this.latestBusinessId = liability.businessId;
    this.audit(
      `add_liability:${liability.liabilityId}`,
      `business=${liability.businessId} amount=${liability.amount}`,
    );
    return { ...liability };
  }

  listLiabilities(): LiabilityRecord[] {
    return this.liabilities.map((l) => ({ ...l }));
  }

  listLiabilitiesByBusiness(businessId: string): LiabilityRecord[] {
    return this.listLiabilities().filter((l) => l.businessId === businessId);
  }

  saveReport(report: AccountingReport) {
    this.reports.set(report.capitalBusinessId, cloneReport(report));
    this.latestReportBusinessId = report.capitalBusinessId;
    this.audit(
      `save_report:${report.reportId}`,
      `business=${report.capitalBusinessId} balanced=${report.ledgerBalance.balanced}`,
    );
    return this.getReport(report.capitalBusinessId)!;
  }

  getReport(businessId: string): AccountingReport | null {
    const report = this.reports.get(businessId);
    return report ? cloneReport(report) : null;
  }

  getLatestReport(): AccountingReport | null {
    return this.latestReportBusinessId ? this.getReport(this.latestReportBusinessId) : null;
  }

  listReports(): AccountingReport[] {
    return [...this.reports.values()].map(cloneReport);
  }

  getLatestBusinessId(): string | null {
    return this.latestBusinessId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((e) => ({ ...e }));
  }

  private audit(action: string, detail: string) {
    this.auditTrail.push({ timestamp: new Date().toISOString(), action, detail });
  }
}

function cloneAccount(account: LedgerAccount): LedgerAccount {
  return { ...account, metadata: { ...account.metadata } };
}

function cloneEntry(entry: JournalEntry): JournalEntry {
  return {
    ...entry,
    lines: entry.lines.map((l) => ({ ...l })),
    traceabilityRefs: [...entry.traceabilityRefs],
  };
}

function cloneReport(report: AccountingReport): AccountingReport {
  return {
    ...report,
    incomeSummary: cloneSummary(report.incomeSummary),
    expenseSummary: cloneSummary(report.expenseSummary),
    assetSummary: cloneSummary(report.assetSummary),
    liabilitySummary: cloneSummary(report.liabilitySummary),
    ledgerBalance: { ...report.ledgerBalance },
    financialEvents: report.financialEvents.map(cloneEntry),
    outstandingIssues: [...report.outstandingIssues],
    equitySummary: {
      ...report.equitySummary,
      byBusiness: report.equitySummary.byBusiness.map((b) => ({ ...b })),
    },
    accountBalances: report.accountBalances.map(cloneAccount),
    validation: report.validation
      ? { ...report.validation, errors: [...report.validation.errors], warnings: [...report.validation.warnings] }
      : null,
    traceabilityRefs: [...report.traceabilityRefs],
  };
}

function cloneSummary<T extends { totalsByCurrency: unknown[]; totalsByBusiness: unknown[] }>(summary: T): T {
  return {
    ...summary,
    totalsByCurrency: (summary.totalsByCurrency as Array<Record<string, unknown>>).map((t) => ({ ...t })),
    totalsByBusiness: (summary.totalsByBusiness as Array<Record<string, unknown>>).map((t) => ({ ...t })),
  };
}
