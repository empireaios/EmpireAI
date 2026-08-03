import type { CashflowReport, CashMovement, PeriodCashflowView } from "./types.js";

let movementSeq = 0;
let viewSeq = 0;
let reportSeq = 0;

export function resetCfwSequenceForTesting() {
  movementSeq = 0;
  viewSeq = 0;
  reportSeq = 0;
}

export function nextMovementSequence() {
  movementSeq += 1;
  return movementSeq;
}

export function nextViewId() {
  viewSeq += 1;
  return `cfw-view-${String(viewSeq).padStart(4, "0")}`;
}

export function nextReportId() {
  reportSeq += 1;
  return `cfw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

/** Build the view lookup key used to find the deterministic prior period. */
export function viewLookupKey(scope: string, scopeId: string, frequency: string, periodLabel: string): string {
  return `${scope}:${scopeId}:${frequency}:${periodLabel}`;
}

/**
 * Authoritative in-memory cashflow store — cash movements are append-only and
 * derived exclusively from verified accounting records (never fabricated).
 * Historical views and reports are preserved rather than overwritten, in
 * keeping with `preserveHistoricalReports`.
 */
export class CfwCashflowStore {
  private movements = new Map<string, CashMovement>();
  private views = new Map<string, PeriodCashflowView>();
  private reports: CashflowReport[] = [];
  private latestBusinessId: string | null = null;
  private latestReport: CashflowReport | null = null;
  private auditTrail: Array<{ timestamp: string; action: string; detail: string }> = [];

  seed(movements: CashMovement[]) {
    this.movements.clear();
    for (const movement of movements) {
      this.movements.set(movement.movementId, cloneMovement(movement));
      this.latestBusinessId = movement.businessId;
    }
  }

  /** Idempotent append — movements derived from the same source entry/account/direction dedupe. */
  upsertMovement(movement: CashMovement): CashMovement {
    this.movements.set(movement.movementId, cloneMovement(movement));
    this.latestBusinessId = movement.businessId;
    this.audit(`upsert_movement:${movement.movementId}`, `business=${movement.businessId} direction=${movement.direction}`);
    return cloneMovement(movement);
  }

  listMovements(): CashMovement[] {
    return [...this.movements.values()].map(cloneMovement);
  }

  countMovements(): number {
    return this.movements.size;
  }

  saveView(view: PeriodCashflowView): PeriodCashflowView {
    const key = viewLookupKey(view.scope, view.scopeId, view.reportingFrequency, view.periodLabel);
    this.views.set(key, cloneView(view));
    this.audit(`save_view:${view.viewId}`, `scope=${view.scope} scopeId=${view.scopeId} period=${view.periodLabel}`);
    return this.getView(view.scope, view.scopeId, view.reportingFrequency, view.periodLabel)!;
  }

  getView(scope: string, scopeId: string, frequency: string, periodLabel: string): PeriodCashflowView | null {
    const view = this.views.get(viewLookupKey(scope, scopeId, frequency, periodLabel));
    return view ? cloneView(view) : null;
  }

  listViews(): PeriodCashflowView[] {
    return [...this.views.values()].map(cloneView);
  }

  countViews(): number {
    return this.views.size;
  }

  /** Historical reports are preserved — never overwritten. */
  addReport(report: CashflowReport): CashflowReport {
    const stored = cloneReport(report);
    this.reports.push(stored);
    this.latestBusinessId = report.capitalBusinessId;
    this.latestReport = stored;
    this.audit(`add_report:${report.reportId}`, `business=${report.capitalBusinessId}`);
    return cloneReport(stored);
  }

  replaceLatestReport(report: CashflowReport): CashflowReport {
    if (this.reports.length && this.reports[this.reports.length - 1]!.reportId === report.reportId) {
      this.reports[this.reports.length - 1] = cloneReport(report);
    } else {
      this.reports.push(cloneReport(report));
    }
    this.latestBusinessId = report.capitalBusinessId;
    this.latestReport = cloneReport(report);
    return cloneReport(this.latestReport);
  }

  getLatestReport(): CashflowReport | null {
    return this.latestReport ? cloneReport(this.latestReport) : null;
  }

  listReports(): CashflowReport[] {
    return this.reports.map(cloneReport);
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

function cloneMovement(movement: CashMovement): CashMovement {
  return {
    ...movement,
    amountMinor: { ...movement.amountMinor },
    traceabilityRefs: [...movement.traceabilityRefs],
  };
}

function cloneView(view: PeriodCashflowView): PeriodCashflowView {
  return {
    ...view,
    openingCashBalance: { ...view.openingCashBalance },
    cashInflows: { ...view.cashInflows },
    cashOutflows: { ...view.cashOutflows },
    netCashflow: { ...view.netCashflow },
    transfersSummary: { ...view.transfersSummary },
    restrictedCash: { ...view.restrictedCash, amountMinor: { ...view.restrictedCash.amountMinor } },
    availableCash: { ...view.availableCash },
    closingCashBalance: { ...view.closingCashBalance },
    periodComparison: {
      ...view.periodComparison,
      priorNetCashflow: view.periodComparison.priorNetCashflow ? { ...view.periodComparison.priorNetCashflow } : null,
      changeInNetCashflow: view.periodComparison.changeInNetCashflow
        ? { ...view.periodComparison.changeInNetCashflow }
        : null,
    },
    unreconciledMovements: view.unreconciledMovements.map(cloneMovement),
    sourceRecordRefs: [...view.sourceRecordRefs],
  };
}

function cloneReport(report: CashflowReport): CashflowReport {
  return {
    ...report,
    openingCashBalance: { ...report.openingCashBalance },
    cashInflowSummary: cloneAmountSummary(report.cashInflowSummary),
    cashOutflowSummary: cloneAmountSummary(report.cashOutflowSummary),
    netCashflow: { ...report.netCashflow },
    transfersSummary: { ...report.transfersSummary },
    restrictedCash: { ...report.restrictedCash, amountMinor: { ...report.restrictedCash.amountMinor } },
    availableCash: { ...report.availableCash },
    closingCashBalance: { ...report.closingCashBalance },
    periodComparison: {
      ...report.periodComparison,
      priorNetCashflow: report.periodComparison.priorNetCashflow
        ? { ...report.periodComparison.priorNetCashflow }
        : null,
      changeInNetCashflow: report.periodComparison.changeInNetCashflow
        ? { ...report.periodComparison.changeInNetCashflow }
        : null,
    },
    sourceRecordReferences: [...report.sourceRecordReferences],
    outstandingIssues: [...report.outstandingIssues],
    views: {
      daily: report.views.daily.map(cloneView),
      weekly: report.views.weekly.map(cloneView),
      monthly: report.views.monthly.map(cloneView),
      annual: report.views.annual.map(cloneView),
      custom: report.views.custom.map(cloneView),
    },
    validation: report.validation
      ? { ...report.validation, errors: [...report.validation.errors], warnings: [...report.validation.warnings] }
      : null,
    traceabilityRefs: [...report.traceabilityRefs],
  };
}

function cloneAmountSummary(summary: CashAmountSummaryLike): CashAmountSummaryLike {
  return {
    ...summary,
    totalMinor: { ...summary.totalMinor },
    recordedMinor: { ...summary.recordedMinor },
    reconciledMinor: { ...summary.reconciledMinor },
    pendingMinor: { ...summary.pendingMinor },
    disputedMinor: { ...summary.disputedMinor },
    byCategory: summary.byCategory.map((c) => ({ ...c, totalMinor: { ...c.totalMinor } })),
  };
}

type CashAmountSummaryLike = CashflowReport["cashInflowSummary"];
