import { BPW_METADATA_VERSION } from "./paths.js";
import type { BpwInput, BpwValidationReport, BudgetPlanningReport, BudgetRecord } from "./types.js";

type BoundaryInput = {
  fabricateBudgetValuesOrSpendingData?: boolean;
  approveExpenditure?: boolean;
  executePayments?: boolean;
  forecastRevenue?: boolean;
  replaceProfitabilityWorker?: boolean;
  modifyAccountingRecords?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  implementQ905OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

/** Rejects Q9-05 and every later mission — Budget Planning Worker is Q9-04 only. */
const FORBIDDEN_MISSION_ID = /^(Q9-0[5-9]|Q9-\d{2,}|Q[1-9]\d-\d+)/i;

export class BpwValidator {
  decide(input: BoundaryInput): BpwValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateBudget(budget: BudgetRecord | null, input: BpwInput, started: number): BpwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Budget Planning Worker requires validated=true");
    }

    if (!budget) {
      errors.push("No budget record was produced");
    } else {
      if (budget.fabricated !== false) errors.push("Budget record fabricated flag must be false");
      if (!budget.budgetId) errors.push("Missing budget ID");
      if (!budget.periodStart || !budget.periodEnd) errors.push("Budget record is missing period boundaries");
      // Absence of actual-expenditure evidence on an individual budget is
      // expected for a freshly created or not-yet-spent budget (zero is a
      // legitimate, non-fabricated default) — it is surfaced transparently
      // via `actualExpenditureEvidencePresent` and report-level outstanding
      // issues rather than downgrading this budget's own validation.
    }

    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateBudgets(budgets: BudgetRecord[], input: BpwInput, started: number, requireEvidence: boolean): BpwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Budget Planning Worker requires validated=true");
    }

    if (!budgets.length) {
      if (requireEvidence) {
        errors.push("No budgets were available — Budget Planning Worker never fabricates budgets or spending data.");
      } else if (decision !== "fail") {
        warnings.push("No budgets were produced");
      }
    } else {
      for (const budget of budgets) {
        if (!budget.budgetId) errors.push("Missing budget ID");
        if (budget.fabricated !== false) errors.push("Budget record fabricated flag must be false");
        if (!budget.actualExpenditureEvidencePresent) {
          warnings.push(`Budget ${budget.budgetId} has no actual-expenditure evidence — treated as zero`);
        }
      }
    }

    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateReport(report: BudgetPlanningReport | null, input: BpwInput, started: number): BpwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Budget Planning Worker requires validated=true");
    }

    if (!report) {
      errors.push("No Budget Planning Report was produced");
    } else {
      const required: Array<keyof BudgetPlanningReport> = [
        "reportId",
        "timestamp",
        "budgetPeriod",
        "budgetScope",
        "budgetCategories",
        "plannedBudget",
        "actualSpending",
        "remainingBudget",
        "budgetUtilisation",
        "varianceSummary",
        "budgetRisks",
        "adjustmentRecommendations",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
        "metadataVersion",
      ];
      for (const field of required) {
        if (report[field] === undefined || report[field] === null) {
          errors.push(`Budget Planning Report missing required field: ${String(field)}`);
        }
      }
      if (typeof report.confidenceScore !== "number" || report.confidenceScore < 0 || report.confidenceScore > 100) {
        errors.push("Budget Planning Report confidenceScore must be 0-100");
      }
      if (!report.consumableByQ905) errors.push("consumableByQ905 must be true");
      if (!report.neverFabricateBudgetValuesOrSpendingData) {
        errors.push("Budget Planning Report must enforce neverFabricateBudgetValuesOrSpendingData boundary");
      }
      if (!report.neverApproveExpenditure) errors.push("Budget Planning Report must enforce neverApproveExpenditure boundary");
      if (!report.neverExecutePayments) errors.push("Budget Planning Report must enforce neverExecutePayments boundary");
      if (!report.neverForecastRevenue) errors.push("Budget Planning Report must enforce neverForecastRevenue boundary");
      if (!report.neverReplaceProfitabilityWorker) {
        errors.push("Budget Planning Report must enforce neverReplaceProfitabilityWorker boundary");
      }
      if (!report.neverModifyAccountingRecords) {
        errors.push("Budget Planning Report must enforce neverModifyAccountingRecords boundary");
      }
      if (!report.neverBypassGrandKingApproval) {
        errors.push("Budget Planning Report must enforce neverBypassGrandKingApproval boundary");
      }
      if (!report.neverImplementQ905OrLater) {
        errors.push("Budget Planning Report must enforce neverImplementQ905OrLater boundary");
      }
      if (!report.preserveCompleteTraceability) {
        errors.push("Budget Planning Report must preserve complete traceability");
      }
      if (report.outstandingIssues.length) {
        warnings.push(`Budget Planning Report has ${report.outstandingIssues.length} outstanding issue(s)`);
      }
    }

    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateGeneric(input: BpwInput, started: number): BpwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Budget Planning Worker requires validated=true");
    }
    return this.finalize(errors.length || decision === "fail" ? "fail" : decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateBudgetValuesOrSpendingData === true ||
      input.approveExpenditure === true ||
      input.executePayments === true ||
      input.forecastRevenue === true ||
      input.replaceProfitabilityWorker === true ||
      input.modifyAccountingRecords === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.implementQ905OrLater === true ||
      (!!input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateBudgetValuesOrSpendingData === true) {
      errors.push("Budget Planning Worker must never fabricate budget values or spending data");
    }
    if (input.approveExpenditure === true) {
      errors.push("Budget Planning Worker must never approve expenditure");
    }
    if (input.executePayments === true) {
      errors.push("Budget Planning Worker must never execute payments");
    }
    if (input.forecastRevenue === true) {
      errors.push("Budget Planning Worker must never forecast revenue");
    }
    if (input.replaceProfitabilityWorker === true) {
      errors.push("Budget Planning Worker must never replace the Profitability Worker");
    }
    if (input.modifyAccountingRecords === true) {
      errors.push("Budget Planning Worker must never modify accounting records");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Budget Planning Worker must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Budget Planning Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Budget Planning Worker must never override Grand King");
    }
    if (input.bypassGrandKingApproval === true || input.bypassApproval === true) {
      errors.push("Budget Planning Worker must never bypass Grand King approval");
    }
    if (input.implementQ905OrLater === true) {
      errors.push("Budget Planning Worker must never implement Q9-05 or later");
    }
    if (input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Budget Planning Worker rejects out-of-scope missionId ${input.missionId}`);
    }
  }

  finalize(
    decision: BpwValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): BpwValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `bpw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BPW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(decision: BpwValidationReport["decision"] | null, enabled: boolean) {
    if (!enabled) return "standby" as const;
    if (decision === "fail" || decision === "partial") return "degraded" as const;
    return "healthy" as const;
  }
}

export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
    return this.failures;
  }
  reset() {
    this.failures = 0;
  }
  failureCount() {
    return this.failures;
  }
}
