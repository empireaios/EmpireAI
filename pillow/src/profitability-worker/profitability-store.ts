import type { MoneyMinor } from "./money.js";
import type {
  FinancialLineItem,
  InjectedAccountingEntry,
  InjectedBudgetReport,
  InjectedCashflowReport,
  LossDriver,
  ProfitabilityAnalysis,
  ProfitabilityReport,
  ProfitabilityRanking,
  ProfitDriver,
} from "./types.js";

let analysisSeq = 0;
let driverSeq = 0;
let reportSeq = 0;

export function resetPrfwSequenceForTesting() {
  analysisSeq = 0;
  driverSeq = 0;
  reportSeq = 0;
}

export function nextAnalysisId(): string {
  analysisSeq += 1;
  return `prfw-analysis-${String(analysisSeq).padStart(4, "0")}`;
}

export function nextDriverId(): string {
  driverSeq += 1;
  return `prfw-driver-${String(driverSeq).padStart(4, "0")}`;
}

export function nextReportId(): string {
  reportSeq += 1;
  return `prfw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

function analysisKey(scope: string, scopeId: string): string {
  return `${scope}:${scopeId}`;
}

/**
 * Authoritative in-memory profitability store. Financial line items are
 * accumulated and deduplicated by `sourceRef` (an upsert-by-source model:
 * re-submitting the same verified line item replaces the earlier copy
 * rather than double-counting it). Analyses are upserted per
 * `scope:scopeId` so re-running an analysis for the same business/product/
 * project reflects the latest verified data. Historical Profitability
 * Reports are preserved (append-only) in keeping with
 * `preserveHistoricalProfitabilityReports`.
 */
export class PrfwStore {
  private lineItems = new Map<string, FinancialLineItem>();
  private accountingEntries: InjectedAccountingEntry[] = [];
  private cashflowReports: InjectedCashflowReport[] = [];
  private budgetReports: InjectedBudgetReport[] = [];
  private analyses = new Map<string, ProfitabilityAnalysis>();
  private rankings: ProfitabilityRanking[] = [];
  private profitDrivers: ProfitDriver[] = [];
  private lossDrivers: LossDriver[] = [];
  private sharedAllocations = new Map<string, MoneyMinor>();
  private reports: ProfitabilityReport[] = [];
  private latestBusinessId: string | null = null;
  private latestScope: string | null = null;
  private auditTrail: Array<{ timestamp: string; action: string; detail: string }> = [];

  seed(lineItems: FinancialLineItem[]) {
    this.lineItems.clear();
    for (const item of lineItems) {
      this.lineItems.set(item.sourceRef, cloneLineItem(item));
      if (item.businessId) this.latestBusinessId = item.businessId;
    }
  }

  addLineItems(items: FinancialLineItem[]): FinancialLineItem[] {
    const added: FinancialLineItem[] = [];
    for (const item of items) {
      const cloned = cloneLineItem(item);
      this.lineItems.set(item.sourceRef, cloned);
      added.push(cloned);
      if (item.businessId) this.latestBusinessId = item.businessId;
    }
    if (added.length) this.audit("add_line_items", `count=${added.length}`);
    return added;
  }

  listLineItems(): FinancialLineItem[] {
    return [...this.lineItems.values()].map(cloneLineItem);
  }

  countLineItems(): number {
    return this.lineItems.size;
  }

  addAccountingEntries(entries: InjectedAccountingEntry[]): InjectedAccountingEntry[] {
    const cloned = entries.map((e) => ({ ...e, lines: e.lines.map((l) => ({ ...l })) }));
    this.accountingEntries.push(...cloned);
    for (const entry of entries) {
      if (entry.businessId) this.latestBusinessId = entry.businessId;
    }
    if (cloned.length) this.audit("consume_accounting_records", `count=${cloned.length}`);
    return cloned;
  }

  listAccountingEntries(): InjectedAccountingEntry[] {
    return this.accountingEntries.map((e) => ({ ...e, lines: e.lines.map((l) => ({ ...l })) }));
  }

  addCashflowReports(reports: InjectedCashflowReport[]): InjectedCashflowReport[] {
    const cloned = reports.map((r) => ({ ...r }));
    this.cashflowReports.push(...cloned);
    for (const report of reports) {
      if (report.capitalBusinessId) this.latestBusinessId = report.capitalBusinessId;
    }
    if (cloned.length) this.audit("consume_cashflow_reports", `count=${cloned.length}`);
    return cloned;
  }

  listCashflowReports(): InjectedCashflowReport[] {
    return this.cashflowReports.map((r) => ({ ...r }));
  }

  addBudgetReports(reports: InjectedBudgetReport[]): InjectedBudgetReport[] {
    const cloned = reports.map((r) => ({ ...r }));
    this.budgetReports.push(...cloned);
    for (const report of reports) {
      if (report.capitalBusinessId) this.latestBusinessId = report.capitalBusinessId;
    }
    if (cloned.length) this.audit("consume_budget_reports", `count=${cloned.length}`);
    return cloned;
  }

  listBudgetReports(): InjectedBudgetReport[] {
    return this.budgetReports.map((r) => ({ ...r }));
  }

  upsertAnalysis(analysis: ProfitabilityAnalysis): ProfitabilityAnalysis {
    const key = analysisKey(analysis.scope, analysis.scopeId);
    this.analyses.set(key, cloneAnalysis(analysis));
    this.latestBusinessId = analysis.scope === "business" ? analysis.scopeId : this.latestBusinessId;
    this.latestScope = analysis.scope;
    this.audit(`upsert_analysis:${key}`, `netProfit=${analysis.netProfit.minorUnits}`);
    return this.getAnalysis(analysis.scope, analysis.scopeId)!;
  }

  getAnalysis(scope: string, scopeId: string): ProfitabilityAnalysis | null {
    const found = this.analyses.get(analysisKey(scope, scopeId));
    return found ? cloneAnalysis(found) : null;
  }

  listAnalyses(scope?: string): ProfitabilityAnalysis[] {
    const all = [...this.analyses.values()].map(cloneAnalysis);
    return scope ? all.filter((a) => a.scope === scope) : all;
  }

  countAnalyses(): number {
    return this.analyses.size;
  }

  setRankings(rankings: ProfitabilityRanking[]): ProfitabilityRanking[] {
    this.rankings = rankings.map((r) => ({ ...r, netProfit: { ...r.netProfit } }));
    return this.listRankings();
  }

  listRankings(): ProfitabilityRanking[] {
    return this.rankings.map((r) => ({ ...r, netProfit: { ...r.netProfit } }));
  }

  setProfitDrivers(drivers: ProfitDriver[]): ProfitDriver[] {
    this.profitDrivers = drivers.map(cloneDriver);
    return this.listProfitDrivers();
  }

  listProfitDrivers(): ProfitDriver[] {
    return this.profitDrivers.map(cloneDriver);
  }

  setLossDrivers(drivers: LossDriver[]): LossDriver[] {
    this.lossDrivers = drivers.map(cloneDriver);
    return this.listLossDrivers();
  }

  listLossDrivers(): LossDriver[] {
    return this.lossDrivers.map(cloneDriver);
  }

  setSharedAllocations(allocations: Map<string, MoneyMinor>) {
    for (const [scopeId, amount] of allocations) {
      this.sharedAllocations.set(scopeId, { ...amount });
    }
  }

  getSharedAllocation(scopeId: string): MoneyMinor | null {
    const found = this.sharedAllocations.get(scopeId);
    return found ? { ...found } : null;
  }

  listSharedAllocations(): Array<{ scopeId: string; allocatedMinor: MoneyMinor }> {
    return [...this.sharedAllocations.entries()].map(([scopeId, allocatedMinor]) => ({
      scopeId,
      allocatedMinor: { ...allocatedMinor },
    }));
  }

  /** Historical reports are preserved — never overwritten. */
  addReport(report: ProfitabilityReport): ProfitabilityReport {
    const stored = cloneReport(report);
    this.reports.push(stored);
    this.latestBusinessId = report.capitalBusinessId;
    this.audit(`add_report:${report.reportId}`, `business=${report.capitalBusinessId}`);
    return cloneReport(stored);
  }

  replaceLatestReport(report: ProfitabilityReport): ProfitabilityReport {
    if (this.reports.length && this.reports[this.reports.length - 1]!.reportId === report.reportId) {
      this.reports[this.reports.length - 1] = cloneReport(report);
    } else {
      this.reports.push(cloneReport(report));
    }
    this.latestBusinessId = report.capitalBusinessId;
    return cloneReport(this.getLatestReport()!);
  }

  getLatestReport(): ProfitabilityReport | null {
    return this.reports.length ? cloneReport(this.reports[this.reports.length - 1]!) : null;
  }

  listReports(): ProfitabilityReport[] {
    return this.reports.map(cloneReport);
  }

  getLatestBusinessId(): string | null {
    return this.latestBusinessId;
  }

  getLatestScope(): string | null {
    return this.latestScope;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((e) => ({ ...e }));
  }

  private audit(action: string, detail: string) {
    this.auditTrail.push({ timestamp: new Date().toISOString(), action, detail });
  }
}

function cloneLineItem(item: FinancialLineItem): FinancialLineItem {
  return { ...item };
}

function cloneDriver<T extends ProfitDriver | LossDriver>(driver: T): T {
  return { ...driver, amountMinor: { ...driver.amountMinor }, evidenceRefs: [...driver.evidenceRefs] };
}

function cloneAnalysis(analysis: ProfitabilityAnalysis): ProfitabilityAnalysis {
  return {
    ...analysis,
    grossRevenue: { ...analysis.grossRevenue },
    discounts: { ...analysis.discounts },
    refunds: { ...analysis.refunds },
    netRevenue: { ...analysis.netRevenue },
    cogs: { ...analysis.cogs },
    operatingExpenses: { ...analysis.operatingExpenses },
    advertisingCosts: { ...analysis.advertisingCosts },
    platformFees: { ...analysis.platformFees },
    paymentFees: { ...analysis.paymentFees },
    taxProvisions: { ...analysis.taxProvisions },
    sharedCostAllocation: { ...analysis.sharedCostAllocation },
    grossProfit: { ...analysis.grossProfit },
    operatingProfit: { ...analysis.operatingProfit },
    netProfit: { ...analysis.netProfit },
    sourceRefs: [...analysis.sourceRefs],
    outstandingIssues: [...analysis.outstandingIssues],
  };
}

function cloneReport(report: ProfitabilityReport): ProfitabilityReport {
  return {
    ...report,
    revenueSummary: {
      ...report.revenueSummary,
      grossRevenue: { ...report.revenueSummary.grossRevenue },
      discounts: { ...report.revenueSummary.discounts },
      refunds: { ...report.revenueSummary.refunds },
      netRevenue: { ...report.revenueSummary.netRevenue },
    },
    costSummary: {
      ...report.costSummary,
      cogs: { ...report.costSummary.cogs },
      operatingExpenses: { ...report.costSummary.operatingExpenses },
      advertisingCosts: { ...report.costSummary.advertisingCosts },
      sharedCostAllocation: { ...report.costSummary.sharedCostAllocation },
      totalCosts: { ...report.costSummary.totalCosts },
    },
    feeSummary: {
      ...report.feeSummary,
      platformFees: { ...report.feeSummary.platformFees },
      paymentFees: { ...report.feeSummary.paymentFees },
      totalFees: { ...report.feeSummary.totalFees },
    },
    refundSummary: { ...report.refundSummary, refunds: { ...report.refundSummary.refunds } },
    taxSummary: { ...report.taxSummary, taxProvisions: { ...report.taxSummary.taxProvisions } },
    grossProfit: { ...report.grossProfit },
    operatingProfit: { ...report.operatingProfit },
    netProfit: { ...report.netProfit },
    profitMargins: { ...report.profitMargins },
    profitabilityRankings: report.profitabilityRankings.map((r) => ({ ...r, netProfit: { ...r.netProfit } })),
    profitDrivers: report.profitDrivers.map(cloneDriver),
    lossDrivers: report.lossDrivers.map(cloneDriver),
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    analyses: report.analyses.map(cloneAnalysis),
    validation: report.validation
      ? { ...report.validation, errors: [...report.validation.errors], warnings: [...report.validation.warnings] }
      : null,
    traceabilityRefs: [...report.traceabilityRefs],
  };
}
