import type { FinancialReport, FrwInput, ValidationResult, VerifiedRevenueSnapshot } from "./types.js";

const FORBIDDEN_MISSION = /^(Q9-1[0-9]|Q9-[2-9]\d|Q9-\d{3,}|Q[1-9]\d-\d+)/i;

function validateSnapshotFabricated(
  snapshot: { fabricated?: boolean } | null | undefined,
  label: string,
  errors: string[],
) {
  if (snapshot && snapshot.fabricated !== false) {
    errors.push(`${label} must have fabricated:false — never accept fabricated figures`);
  }
}

function validateSnapshotSourceRefs(
  snapshot: { sourceRefs?: string[] } | null | undefined,
  label: string,
  errors: string[],
) {
  if (snapshot && (!snapshot.sourceRefs || snapshot.sourceRefs.length === 0)) {
    errors.push(`${label} requires sourceRefs — never accept unverified figures`);
  }
}

function validateSnapshotMinor(
  value: number | null | undefined,
  label: string,
  errors: string[],
) {
  if (value != null && (!Number.isInteger(value) || value < 0)) {
    errors.push(`${label} must be a non-negative safe integer minor unit when supplied`);
  }
}

export class FrwValidator {
  validateInput(input: FrwInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.forceFail) errors.push("forceFail requested");
    if (input.validated === false) errors.push("Caller marked input as unvalidated");
    const businessId = input.capitalBusinessId?.trim();
    if (!businessId) errors.push("capitalBusinessId is required");
    const period = input.reportingPeriod?.trim();
    if (!period) errors.push("reportingPeriod is required");

    validateSnapshotFabricated(input.revenueSnapshot, "revenueSnapshot", errors);
    validateSnapshotSourceRefs(input.revenueSnapshot, "revenueSnapshot", errors);
    if (input.revenueSnapshot) {
      validateSnapshotMinor(input.revenueSnapshot.totalRevenueMinor, "revenueSnapshot.totalRevenueMinor", errors);
    }

    validateSnapshotFabricated(input.expenseSnapshot, "expenseSnapshot", errors);
    validateSnapshotSourceRefs(input.expenseSnapshot, "expenseSnapshot", errors);
    if (input.expenseSnapshot) {
      validateSnapshotMinor(input.expenseSnapshot.totalExpenseMinor, "expenseSnapshot.totalExpenseMinor", errors);
    }

    validateSnapshotFabricated(input.cashflowSnapshot, "cashflowSnapshot", errors);
    validateSnapshotSourceRefs(input.cashflowSnapshot, "cashflowSnapshot", errors);
    validateSnapshotFabricated(input.budgetSnapshot, "budgetSnapshot", errors);
    validateSnapshotSourceRefs(input.budgetSnapshot, "budgetSnapshot", errors);
    validateSnapshotFabricated(input.profitabilitySnapshot, "profitabilitySnapshot", errors);
    validateSnapshotSourceRefs(input.profitabilitySnapshot, "profitabilitySnapshot", errors);
    validateSnapshotFabricated(input.forecastSnapshot, "forecastSnapshot", errors);
    validateSnapshotSourceRefs(input.forecastSnapshot, "forecastSnapshot", errors);
    validateSnapshotFabricated(input.investmentSnapshot, "investmentSnapshot", errors);
    validateSnapshotSourceRefs(input.investmentSnapshot, "investmentSnapshot", errors);
    validateSnapshotFabricated(input.taxSupportSnapshot, "taxSupportSnapshot", errors);
    validateSnapshotSourceRefs(input.taxSupportSnapshot, "taxSupportSnapshot", errors);

    const hasAnySnapshot =
      input.revenueSnapshot ||
      input.expenseSnapshot ||
      input.cashflowSnapshot ||
      input.budgetSnapshot ||
      input.profitabilitySnapshot ||
      input.forecastSnapshot ||
      input.investmentSnapshot ||
      input.taxSupportSnapshot;
    if (!hasAnySnapshot) {
      warnings.push("No verified snapshot blocks supplied — summaries may be unavailable unless upstream DI reports exist");
    }

    return {
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
    };
  }

  validateReport(report: FinancialReport): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!report.consumableByQ910) errors.push("consumableByQ910 must be true");
    if (!report.neverExecuteFinancialTransactions) errors.push("neverExecuteFinancialTransactions must be true");
    if (!report.neverApproveFinancialDecisions) errors.push("neverApproveFinancialDecisions must be true");
    if (!report.neverModifyAccountingRecords) errors.push("neverModifyAccountingRecords must be true");
    if (!report.neverFabricateFinancialFigures) errors.push("neverFabricateFinancialFigures must be true");
    if (!report.neverImplementQ910OrLater) errors.push("neverImplementQ910OrLater must be true");
    if (!report.measuredDataDistinctFromProjections) {
      errors.push("measuredDataDistinctFromProjections must be true");
    }
    const summaries = [
      report.revenueSummary,
      report.expenseSummary,
      report.cashflowSummary,
      report.budgetSummary,
      report.profitabilitySummary,
      report.forecastSummary,
      report.investmentSummary,
      report.taxSupportSummary,
      report.capitalSummary,
    ];
    for (const summary of summaries) {
      if (summary.fabricated !== false) errors.push("All summaries must have fabricated:false");
    }
    return {
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
    };
  }

  rejectFutureMissions(missionId?: string | null): ValidationResult {
    if (missionId && FORBIDDEN_MISSION.test(missionId)) {
      return {
        decision: "fail",
        errors: [`Financial Reporting Worker never implements ${missionId} (Q9-10 or later)`],
        warnings: [],
      };
    }
    return { decision: "pass", errors: [], warnings: [] };
  }

  validateRevenueSnapshot(snapshot: VerifiedRevenueSnapshot): ValidationResult {
    const errors: string[] = [];
    validateSnapshotFabricated(snapshot, "revenueSnapshot", errors);
    validateSnapshotSourceRefs(snapshot, "revenueSnapshot", errors);
    validateSnapshotMinor(snapshot.totalRevenueMinor, "totalRevenueMinor", errors);
    return { decision: errors.length ? "fail" : "pass", errors, warnings: [] };
  }
}
