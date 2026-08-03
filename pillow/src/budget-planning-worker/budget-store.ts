import type {
  BudgetAdjustmentRecommendation,
  BudgetPlanningReport,
  BudgetRecord,
  VarianceFinding,
} from "./types.js";

let budgetSeq = 0;
let findingSeq = 0;
let recommendationSeq = 0;
let reportSeq = 0;

export function resetBpwSequenceForTesting() {
  budgetSeq = 0;
  findingSeq = 0;
  recommendationSeq = 0;
  reportSeq = 0;
}

export function nextBudgetId(): string {
  budgetSeq += 1;
  return `bpw-budget-${String(budgetSeq).padStart(4, "0")}`;
}

export function nextFindingId(): string {
  findingSeq += 1;
  return `bpw-finding-${String(findingSeq).padStart(4, "0")}`;
}

export function nextRecommendationId(): string {
  recommendationSeq += 1;
  return `bpw-rec-${String(recommendationSeq).padStart(4, "0")}`;
}

export function nextReportId(): string {
  reportSeq += 1;
  return `bpw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

/**
 * Authoritative in-memory budget store — budgets are append-only with a
 * preserved revision history (never overwritten in place without a
 * revision entry), variance findings and recommendations are derived
 * exclusively from stored budgets, and historical Budget Planning Reports
 * are preserved rather than overwritten, in keeping with
 * `preserveHistoricalBudgetRevisions`.
 */
export class BpwBudgetStore {
  private budgets = new Map<string, BudgetRecord>();
  private findings: VarianceFinding[] = [];
  private recommendations: BudgetAdjustmentRecommendation[] = [];
  private reports: BudgetPlanningReport[] = [];
  private latestBusinessId: string | null = null;
  private latestApprovalStatus: BudgetRecord["approvalStatus"] | null = null;
  private latestReport: BudgetPlanningReport | null = null;
  private auditTrail: Array<{ timestamp: string; action: string; detail: string }> = [];

  seed(budgets: BudgetRecord[]) {
    this.budgets.clear();
    for (const budget of budgets) {
      this.budgets.set(budget.budgetId, cloneBudget(budget));
      this.latestBusinessId = budget.capitalBusinessId ?? budget.businessOrProject.businessId ?? this.latestBusinessId;
      this.latestApprovalStatus = budget.approvalStatus;
    }
  }

  getBudget(budgetId: string): BudgetRecord | null {
    const budget = this.budgets.get(budgetId);
    return budget ? cloneBudget(budget) : null;
  }

  /** Append-only upsert: replaces the current state but the caller is responsible for preserving revision history. */
  upsertBudget(budget: BudgetRecord): BudgetRecord {
    this.budgets.set(budget.budgetId, cloneBudget(budget));
    const businessId = budget.capitalBusinessId ?? budget.businessOrProject.businessId;
    if (businessId) this.latestBusinessId = businessId;
    this.latestApprovalStatus = budget.approvalStatus;
    this.audit(`upsert_budget:${budget.budgetId}`, `category=${budget.budgetCategory} status=${budget.approvalStatus}`);
    return this.getBudget(budget.budgetId)!;
  }

  listBudgets(): BudgetRecord[] {
    return [...this.budgets.values()].map(cloneBudget);
  }

  countBudgets(): number {
    return this.budgets.size;
  }

  addFindings(findings: VarianceFinding[]): VarianceFinding[] {
    const cloned = findings.map(cloneFinding);
    this.findings.push(...cloned);
    if (findings.length) {
      this.audit(`add_findings`, `count=${findings.length}`);
    }
    return cloned;
  }

  listFindings(): VarianceFinding[] {
    return this.findings.map(cloneFinding);
  }

  countFindings(): number {
    return this.findings.length;
  }

  addRecommendations(recommendations: BudgetAdjustmentRecommendation[]): BudgetAdjustmentRecommendation[] {
    const cloned = recommendations.map(cloneRecommendation);
    this.recommendations.push(...cloned);
    return cloned;
  }

  listRecommendations(): BudgetAdjustmentRecommendation[] {
    return this.recommendations.map(cloneRecommendation);
  }

  /** Historical reports are preserved — never overwritten. */
  addReport(report: BudgetPlanningReport): BudgetPlanningReport {
    const stored = cloneReport(report);
    this.reports.push(stored);
    this.latestBusinessId = report.capitalBusinessId;
    this.latestReport = stored;
    this.audit(`add_report:${report.reportId}`, `business=${report.capitalBusinessId}`);
    return cloneReport(stored);
  }

  replaceLatestReport(report: BudgetPlanningReport): BudgetPlanningReport {
    if (this.reports.length && this.reports[this.reports.length - 1]!.reportId === report.reportId) {
      this.reports[this.reports.length - 1] = cloneReport(report);
    } else {
      this.reports.push(cloneReport(report));
    }
    this.latestBusinessId = report.capitalBusinessId;
    this.latestReport = cloneReport(report);
    return cloneReport(this.latestReport);
  }

  getLatestReport(): BudgetPlanningReport | null {
    return this.latestReport ? cloneReport(this.latestReport) : null;
  }

  listReports(): BudgetPlanningReport[] {
    return this.reports.map(cloneReport);
  }

  getLatestBusinessId(): string | null {
    return this.latestBusinessId;
  }

  getLatestApprovalStatus(): BudgetRecord["approvalStatus"] | null {
    return this.latestApprovalStatus;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((e) => ({ ...e }));
  }

  private audit(action: string, detail: string) {
    this.auditTrail.push({ timestamp: new Date().toISOString(), action, detail });
  }
}

function cloneBudget(budget: BudgetRecord): BudgetRecord {
  return {
    ...budget,
    businessOrProject: { ...budget.businessOrProject },
    plannedAmount: { ...budget.plannedAmount },
    actualExpenditure: { ...budget.actualExpenditure },
    remainingBudget: { ...budget.remainingBudget },
    varianceAmount: { ...budget.varianceAmount },
    supportingNotes: [...budget.supportingNotes],
    revisionHistory: budget.revisionHistory.map((r) => ({
      ...r,
      previousPlannedAmount: r.previousPlannedAmount ? { ...r.previousPlannedAmount } : null,
      changedFields: [...r.changedFields],
    })),
    traceabilityRefs: [...budget.traceabilityRefs],
  };
}

function cloneFinding(finding: VarianceFinding): VarianceFinding {
  return {
    ...finding,
    amountMinor: finding.amountMinor ? { ...finding.amountMinor } : undefined,
    sourceRefs: [...finding.sourceRefs],
  };
}

function cloneRecommendation(recommendation: BudgetAdjustmentRecommendation): BudgetAdjustmentRecommendation {
  return {
    ...recommendation,
    suggestedDeltaMinor: recommendation.suggestedDeltaMinor ? { ...recommendation.suggestedDeltaMinor } : undefined,
    evidenceRefs: [...recommendation.evidenceRefs],
  };
}

function cloneReport(report: BudgetPlanningReport): BudgetPlanningReport {
  return {
    ...report,
    budgetCategories: [...report.budgetCategories],
    plannedBudget: { ...report.plannedBudget },
    actualSpending: { ...report.actualSpending },
    remainingBudget: { ...report.remainingBudget },
    varianceSummary: {
      ...report.varianceSummary,
      totalVarianceMinor: { ...report.varianceSummary.totalVarianceMinor },
      findings: report.varianceSummary.findings.map(cloneFinding),
    },
    budgetRisks: report.budgetRisks.map(cloneFinding),
    adjustmentRecommendations: report.adjustmentRecommendations.map(cloneRecommendation),
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    budgets: report.budgets.map(cloneBudget),
    validation: report.validation
      ? { ...report.validation, errors: [...report.validation.errors], warnings: [...report.validation.warnings] }
      : null,
    traceabilityRefs: [...report.traceabilityRefs],
  };
}
