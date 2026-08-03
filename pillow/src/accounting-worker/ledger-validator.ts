import { ACCW_METADATA_VERSION } from "./paths.js";
import type { AccountingReport, AccwInput, AccwValidationReport, JournalEntry, LedgerAccount } from "./types.js";

type BoundaryInput = {
  fabricateAccountingRecords?: boolean;
  forecastFinances?: boolean;
  approveInvestments?: boolean;
  replaceBudgetPlanningWorker?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  implementQ903OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

/** Rejects Q9-03 and every later mission — Accounting Worker is Q9-02 only. */
const FORBIDDEN_MISSION_ID = /^(Q9-0[3-9]|Q9-\d{2,}|Q[1-9]\d-\d+)/i;
const BALANCE_EPSILON = 0.005;

export class AccwValidator {
  decide(input: BoundaryInput): AccwValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateEntry(
    entry: JournalEntry | null,
    input: AccwInput,
    started: number,
  ): AccwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Accounting Worker requires validated=true");
    }

    if (!entry) {
      if (decision !== "fail") {
        warnings.push("No journal entry was produced");
      }
    } else {
      if (!entry.entryId) errors.push("Missing journal entry ID");
      if (!entry.businessId) errors.push("Missing business ID on journal entry");
      if (!entry.accountingPeriod) errors.push("Missing accounting period on journal entry");
      if (!entry.timestamp) errors.push("Missing timestamp on journal entry");
      if (!entry.currency) errors.push("Missing currency on journal entry");
      if (!entry.lines.length) errors.push("Journal entry must have at least one line");
      if (entry.fabricated !== false) {
        errors.push("Journal entry fabricated flag must be false");
      }
      if (!entry.immutable) errors.push("Journal entry must be immutable");

      const totalDebits = round2(entry.lines.reduce((sum, l) => sum + (l.debit || 0), 0));
      const totalCredits = round2(entry.lines.reduce((sum, l) => sum + (l.credit || 0), 0));
      if (Math.abs(totalDebits - totalCredits) > BALANCE_EPSILON) {
        errors.push(
          `Journal entry lines are not balanced: debits=${totalDebits} credits=${totalCredits}`,
        );
      }
    }

    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  validateAccounts(
    accounts: LedgerAccount[],
    input: AccwInput,
    started: number,
  ): AccwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Accounting Worker requires validated=true");
    }
    if (!accounts.length) {
      if (decision !== "fail") warnings.push("No ledger accounts were produced");
    } else {
      for (const account of accounts) {
        if (!account.accountId) errors.push("Missing account ID");
        if (!account.businessId) errors.push("Missing business ID on ledger account");
        if (!account.accountType) errors.push("Missing account type");
        if (account.fabricated !== false) errors.push("Ledger account fabricated flag must be false");
      }
    }
    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  validateReport(
    report: AccountingReport | null,
    input: AccwInput,
    started: number,
  ): AccwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Accounting Worker requires validated=true");
    }

    if (!report) {
      errors.push("No Accounting Report was produced");
    } else {
      const required: Array<keyof AccountingReport> = [
        "reportId",
        "timestamp",
        "accountingPeriod",
        "incomeSummary",
        "expenseSummary",
        "assetSummary",
        "liabilitySummary",
        "ledgerBalance",
        "financialEvents",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
        "metadataVersion",
      ];
      for (const field of required) {
        if (report[field] === undefined || report[field] === null) {
          errors.push(`Accounting Report missing required field: ${String(field)}`);
        }
      }
      if (
        typeof report.confidenceScore !== "number" ||
        report.confidenceScore < 0 ||
        report.confidenceScore > 100
      ) {
        errors.push("Accounting Report confidenceScore must be 0-100");
      }
      if (!report.consumableByQ903) errors.push("consumableByQ903 must be true");
      if (!report.neverFabricateAccountingRecords) {
        errors.push("Accounting Report must enforce neverFabricateAccountingRecords boundary");
      }
      if (!report.neverForecastFinances) {
        errors.push("Accounting Report must enforce neverForecastFinances boundary");
      }
      if (!report.neverApproveInvestments) {
        errors.push("Accounting Report must enforce neverApproveInvestments boundary");
      }
      if (!report.neverReplaceBudgetPlanningWorker) {
        errors.push("Accounting Report must enforce neverReplaceBudgetPlanningWorker boundary");
      }
      if (!report.neverBypassGrandKingApproval) {
        errors.push("Accounting Report must enforce neverBypassGrandKingApproval boundary");
      }
      if (!report.neverImplementQ903OrLater) {
        errors.push("Accounting Report must enforce neverImplementQ903OrLater boundary");
      }
      if (!report.preserveImmutableAccountingHistory) {
        errors.push("Accounting Report must preserve immutable accounting history");
      }
      if (!report.ledgerBalance.balanced) {
        warnings.push(`General ledger not balanced: difference=${report.ledgerBalance.difference}`);
      }
    }

    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  validateGeneric(input: AccwInput, started: number): AccwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Accounting Worker requires validated=true");
    }
    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision,
      errors,
      warnings,
      started,
    );
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
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
      (!!input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateAccountingRecords === true) {
      errors.push("Accounting Worker must never fabricate accounting records");
    }
    if (input.forecastFinances === true) {
      errors.push("Accounting Worker must never forecast finances");
    }
    if (input.approveInvestments === true) {
      errors.push("Accounting Worker must never approve investments");
    }
    if (input.replaceBudgetPlanningWorker === true) {
      errors.push("Accounting Worker must never replace the Budget Planning Worker");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Accounting Worker must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Accounting Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Accounting Worker must never override Grand King");
    }
    if (input.bypassGrandKingApproval === true || input.bypassApproval === true) {
      errors.push("Accounting Worker must never bypass Grand King approval");
    }
    if (input.implementQ903OrLater === true) {
      errors.push("Accounting Worker must never implement Q9-03 or later");
    }
    if (input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Accounting Worker rejects out-of-scope missionId ${input.missionId}`);
    }
  }

  finalize(
    decision: AccwValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): AccwValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `accw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: ACCW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(decision: AccwValidationReport["decision"] | null, enabled: boolean) {
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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
