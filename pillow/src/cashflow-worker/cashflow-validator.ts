import { CFW_METADATA_VERSION } from "./paths.js";
import type { CashflowReport, CashMovement, CfwInput, CfwValidationReport, PeriodCashflowView } from "./types.js";

type BoundaryInput = {
  fabricateBalancesOrFlows?: boolean;
  createBudgets?: boolean;
  forecastFutureCashflow?: boolean;
  calculateCompleteBusinessProfitability?: boolean;
  approveSpending?: boolean;
  moveMoney?: boolean;
  modifyVerifiedAccountingRecords?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  bypassApproval?: boolean;
  implementQ904OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

/** Rejects Q9-04 and every later mission — Cashflow Worker is Q9-03 only. */
const FORBIDDEN_MISSION_ID = /^(Q9-0[4-9]|Q9-\d{2,}|Q[1-9]\d-\d+)/i;

export class CfwValidator {
  decide(input: BoundaryInput): CfwValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateMovements(
    movements: CashMovement[],
    input: CfwInput,
    started: number,
    requireEvidence: boolean,
  ): CfwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Cashflow Worker requires validated=true");
    }

    if (!movements.length) {
      if (requireEvidence) {
        errors.push(
          "No verified accounting records were available or injected — Cashflow Worker never fabricates cash movements.",
        );
      } else if (decision !== "fail") {
        warnings.push("No cash movements were produced");
      }
    } else {
      for (const movement of movements) {
        if (!movement.movementId) errors.push("Missing cash movement ID");
        if (!movement.businessId) errors.push("Missing business ID on cash movement");
        if (!movement.accountId) errors.push("Missing account ID on cash movement");
        if (movement.fabricated !== false) errors.push("Cash movement fabricated flag must be false");
      }
    }

    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateView(view: PeriodCashflowView | null, input: CfwInput, started: number): CfwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Cashflow Worker requires validated=true");
    }

    if (!view) {
      errors.push("No cashflow view was produced");
    } else {
      if (view.fabricated !== false) errors.push("Cashflow view fabricated flag must be false");
      if (!view.periodStart || !view.periodEnd) errors.push("Cashflow view is missing period boundaries");
      if (view.reconciliationStatus === "disputed") {
        warnings.push(`Cashflow view has disputed movements for scope ${view.scope}:${view.scopeId}`);
      }
      if (view.reconciliationStatus === "unreconciled") {
        warnings.push(`Cashflow view has no reconciled cash movements for scope ${view.scope}:${view.scopeId}`);
      }
      // Missing opening-balance evidence is surfaced transparently via
      // `openingBalanceEvidencePresent` and outstanding issues rather than
      // downgrading validation — a first-ever period never has a prior
      // closing balance, and that is expected, not an error condition.
    }

    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateReport(report: CashflowReport | null, input: CfwInput, started: number): CfwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Cashflow Worker requires validated=true");
    }

    if (!report) {
      errors.push("No Cashflow Report was produced");
    } else {
      const required: Array<keyof CashflowReport> = [
        "reportId",
        "timestamp",
        "reportingPeriod",
        "reportingFrequency",
        "currency",
        "openingCashBalance",
        "cashInflowSummary",
        "cashOutflowSummary",
        "netCashflow",
        "transfersSummary",
        "restrictedCash",
        "availableCash",
        "closingCashBalance",
        "periodComparison",
        "liquidityStatus",
        "sourceRecordReferences",
        "reconciliationStatus",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
        "metadataVersion",
      ];
      for (const field of required) {
        if (report[field] === undefined || report[field] === null) {
          errors.push(`Cashflow Report missing required field: ${String(field)}`);
        }
      }
      if (typeof report.confidenceScore !== "number" || report.confidenceScore < 0 || report.confidenceScore > 100) {
        errors.push("Cashflow Report confidenceScore must be 0-100");
      }
      if (!report.consumableByQ904) errors.push("consumableByQ904 must be true");
      if (!report.neverFabricateBalancesOrFlows) {
        errors.push("Cashflow Report must enforce neverFabricateBalancesOrFlows boundary");
      }
      if (!report.neverCreateBudgets) errors.push("Cashflow Report must enforce neverCreateBudgets boundary");
      if (!report.neverForecastFutureCashflow) {
        errors.push("Cashflow Report must enforce neverForecastFutureCashflow boundary");
      }
      if (!report.neverCalculateCompleteBusinessProfitability) {
        errors.push("Cashflow Report must enforce neverCalculateCompleteBusinessProfitability boundary");
      }
      if (!report.neverApproveSpending) errors.push("Cashflow Report must enforce neverApproveSpending boundary");
      if (!report.neverMoveMoney) errors.push("Cashflow Report must enforce neverMoveMoney boundary");
      if (!report.neverModifyVerifiedAccountingRecords) {
        errors.push("Cashflow Report must enforce neverModifyVerifiedAccountingRecords boundary");
      }
      if (!report.neverBypassGrandKingApproval) {
        errors.push("Cashflow Report must enforce neverBypassGrandKingApproval boundary");
      }
      if (!report.neverImplementQ904OrLater) {
        errors.push("Cashflow Report must enforce neverImplementQ904OrLater boundary");
      }
      if (!report.preserveCompleteTraceability) {
        errors.push("Cashflow Report must preserve complete traceability");
      }
      if (report.reconciliationStatus === "disputed") {
        warnings.push("Cashflow Report has disputed movements outstanding");
      }
      if (report.outstandingIssues.length) {
        warnings.push(`Cashflow Report has ${report.outstandingIssues.length} outstanding issue(s)`);
      }
    }

    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision === "pass" && warnings.length ? "partial" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateGeneric(input: CfwInput, started: number): CfwValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Cashflow Worker requires validated=true");
    }
    return this.finalize(errors.length || decision === "fail" ? "fail" : decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateBalancesOrFlows === true ||
      input.createBudgets === true ||
      input.forecastFutureCashflow === true ||
      input.calculateCompleteBusinessProfitability === true ||
      input.approveSpending === true ||
      input.moveMoney === true ||
      input.modifyVerifiedAccountingRecords === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.bypassApproval === true ||
      input.implementQ904OrLater === true ||
      (!!input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateBalancesOrFlows === true) {
      errors.push("Cashflow Worker must never fabricate balances or flows");
    }
    if (input.createBudgets === true) {
      errors.push("Cashflow Worker must never create budgets");
    }
    if (input.forecastFutureCashflow === true) {
      errors.push("Cashflow Worker must never forecast future cashflow");
    }
    if (input.calculateCompleteBusinessProfitability === true) {
      errors.push("Cashflow Worker must never calculate complete business profitability");
    }
    if (input.approveSpending === true) {
      errors.push("Cashflow Worker must never approve spending");
    }
    if (input.moveMoney === true) {
      errors.push("Cashflow Worker must never move money");
    }
    if (input.modifyVerifiedAccountingRecords === true) {
      errors.push("Cashflow Worker must never modify verified accounting records");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Cashflow Worker must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Cashflow Worker must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Cashflow Worker must never override Grand King");
    }
    if (input.bypassGrandKingApproval === true || input.bypassApproval === true) {
      errors.push("Cashflow Worker must never bypass Grand King approval");
    }
    if (input.implementQ904OrLater === true) {
      errors.push("Cashflow Worker must never implement Q9-04 or later");
    }
    if (input.missionId && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Cashflow Worker rejects out-of-scope missionId ${input.missionId}`);
    }
  }

  finalize(
    decision: CfwValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): CfwValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `cfw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CFW_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(decision: CfwValidationReport["decision"] | null, enabled: boolean) {
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
