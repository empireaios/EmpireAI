import { TAX_SUPPORT_CATEGORIES } from "./paths.js";
import type { TaxSupportReport, TaxSupportTransaction, TswInput, ValidationResult } from "./types.js";

const FORBIDDEN_MISSION = /^(Q9-0[8-9]|Q9-\d{3,}|Q[1-9]\d-\d+)/i;

export class TswValidator {
  validateInput(input: TswInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.forceFail) errors.push("forceFail requested");
    if (input.validated === false) errors.push("Caller marked input as unvalidated");
    const businessId = input.capitalBusinessId?.trim();
    if (!businessId) errors.push("capitalBusinessId is required");
    const period = input.reportingPeriod?.trim();
    if (!period) errors.push("reportingPeriod is required");
    if (input.jurisdictionExtensionPoint && /advice|obligation|liability/i.test(input.jurisdictionExtensionPoint)) {
      errors.push("jurisdictionExtensionPoint must not encode advice or fabricated obligations");
    }
    for (const t of input.transactions ?? []) {
      this.validateTransaction(t, errors);
    }
    return {
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
    };
  }

  validateTransaction(t: TaxSupportTransaction, errors: string[] = []): ValidationResult {
    if (!TAX_SUPPORT_CATEGORIES.includes(t.category)) {
      errors.push(`Unknown tax-support category: ${t.category}`);
    }
    if (!Number.isInteger(t.amountMinor) || !Number.isSafeInteger(t.amountMinor)) {
      errors.push(`Transaction ${t.transactionId} amountMinor must be a safe integer`);
    }
    if (t.fabricated !== false) errors.push(`Transaction ${t.transactionId} must have fabricated:false`);
    if (t.recordKind !== "factual_financial_record") {
      errors.push(`Transaction ${t.transactionId} must be a factual_financial_record`);
    }
    if (!t.sourceRef?.trim()) errors.push(`Transaction ${t.transactionId} missing sourceRef`);
    return {
      decision: errors.length ? "fail" : "pass",
      errors,
      warnings: [],
    };
  }

  validateReport(report: TaxSupportReport): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!report.consumableByQ908) errors.push("consumableByQ908 must be true");
    if (!report.neverProvideLegalOrTaxAdvice) errors.push("neverProvideLegalOrTaxAdvice must be true");
    if (!report.neverFabricateTaxCalculationsOrObligations) {
      errors.push("neverFabricateTaxCalculationsOrObligations must be true");
    }
    if (!report.neverSubmitFilingsAutomatically) errors.push("neverSubmitFilingsAutomatically must be true");
    if (!report.neverReplaceAccountantsOrTaxProfessionals) {
      errors.push("neverReplaceAccountantsOrTaxProfessionals must be true");
    }
    if (!report.neverModifyAccountingRecords) errors.push("neverModifyAccountingRecords must be true");
    if (!report.neverImplementQ908OrLater) errors.push("neverImplementQ908OrLater must be true");
    if (!report.factualRecordsDistinctFromReminders) {
      errors.push("factualRecordsDistinctFromReminders must be true");
    }
    for (const reminder of report.filingReminders) {
      if (reminder.isAdvice !== false) errors.push(`Reminder ${reminder.reminderId} must not be advice`);
      if (reminder.isFilingInstruction !== false) {
        errors.push(`Reminder ${reminder.reminderId} must not be a filing instruction`);
      }
      if (reminder.signalKind !== "filing_reminder_schedule") {
        errors.push(`Reminder ${reminder.reminderId} must be filing_reminder_schedule`);
      }
    }
    for (const flag of report.professionalReviewFlags) {
      if (flag.isAdvice !== false) errors.push(`Flag ${flag.flagId} must not be advice`);
    }
    if (report.incomeSummary.fabricated !== false) errors.push("incomeSummary must not be fabricated");
    if (report.expenseSummary.fabricated !== false) errors.push("expenseSummary must not be fabricated");
    if (report.incomeSummary.recordKind !== "factual_financial_record") {
      errors.push("incomeSummary must be factual_financial_record");
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
        errors: [`Tax Support Worker never implements ${missionId} (Q9-08 or later)`],
        warnings: [],
      };
    }
    return { decision: "pass", errors: [], warnings: [] };
  }
}
