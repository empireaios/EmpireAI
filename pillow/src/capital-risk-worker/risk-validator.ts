import type { CapitalRiskReport, CaprwInput, ValidationResult } from "./types.js";

const FORBIDDEN_MISSION = /^(Q9-1[1-9]|Q9-[2-9]\d|Q9-\d{3,}|Q[1-9]\d-\d+)/i;

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

export class CaprwValidator {
  validateInput(input: CaprwInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (input.forceFail) errors.push("forceFail requested");
    if (input.validated === false) errors.push("Caller marked input as unvalidated");
    const businessId = input.capitalBusinessId?.trim();
    if (!businessId) errors.push("capitalBusinessId is required");
    const period = input.reportingPeriod?.trim();
    if (!period) errors.push("reportingPeriod is required");

    validateSnapshotFabricated(input.budgetSnapshot, "budgetSnapshot", errors);
    validateSnapshotSourceRefs(input.budgetSnapshot, "budgetSnapshot", errors);
    if (input.budgetSnapshot) {
      validateSnapshotMinor(input.budgetSnapshot.plannedMinor, "budgetSnapshot.plannedMinor", errors);
      validateSnapshotMinor(input.budgetSnapshot.actualMinor, "budgetSnapshot.actualMinor", errors);
    }

    validateSnapshotFabricated(input.cashflowSnapshot, "cashflowSnapshot", errors);
    validateSnapshotSourceRefs(input.cashflowSnapshot, "cashflowSnapshot", errors);
    if (input.cashflowSnapshot) {
      if (
        input.cashflowSnapshot.netCashflowMinor != null &&
        !Number.isInteger(input.cashflowSnapshot.netCashflowMinor)
      ) {
        errors.push("cashflowSnapshot.netCashflowMinor must be a safe integer minor unit when supplied");
      }
      validateSnapshotMinor(input.cashflowSnapshot.cashPositionMinor, "cashflowSnapshot.cashPositionMinor", errors);
    }

    validateSnapshotFabricated(input.profitabilitySnapshot, "profitabilitySnapshot", errors);
    validateSnapshotSourceRefs(input.profitabilitySnapshot, "profitabilitySnapshot", errors);

    validateSnapshotFabricated(input.revenueSnapshot, "revenueSnapshot", errors);
    validateSnapshotSourceRefs(input.revenueSnapshot, "revenueSnapshot", errors);
    if (input.revenueSnapshot) {
      validateSnapshotMinor(input.revenueSnapshot.totalMinor, "revenueSnapshot.totalMinor", errors);
    }

    validateSnapshotFabricated(input.investmentSnapshot, "investmentSnapshot", errors);
    validateSnapshotSourceRefs(input.investmentSnapshot, "investmentSnapshot", errors);
    if (input.investmentSnapshot) {
      for (const opp of input.investmentSnapshot.opportunities) {
        if (!opp.evidenceRefs?.length) {
          errors.push(`Investment opportunity ${opp.opportunityId} requires evidenceRefs`);
        }
      }
    }

    if (input.liquiditySnapshot) {
      if (input.liquiditySnapshot.fabricated !== false) {
        errors.push("liquiditySnapshot must have fabricated:false");
      }
      validateSnapshotSourceRefs(input.liquiditySnapshot, "liquiditySnapshot", errors);
    }

    const hasAnySnapshot =
      input.budgetSnapshot ||
      input.cashflowSnapshot ||
      input.profitabilitySnapshot ||
      input.revenueSnapshot ||
      input.investmentSnapshot ||
      input.liquiditySnapshot;
    if (!hasAnySnapshot) {
      warnings.push("No verified snapshot blocks supplied — risk detection may produce empty results");
    }

    return {
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
    };
  }

  validateReport(report: CapitalRiskReport): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!report.consumableByQ911) errors.push("consumableByQ911 must be true");
    if (!report.neverApproveFinancialDecisions) errors.push("neverApproveFinancialDecisions must be true");
    if (!report.neverExecuteInvestments) errors.push("neverExecuteInvestments must be true");
    if (!report.neverMoveCapital) errors.push("neverMoveCapital must be true");
    if (!report.neverModifyAccountingRecords) errors.push("neverModifyAccountingRecords must be true");
    if (!report.neverFabricateRisksOrEvidence) errors.push("neverFabricateRisksOrEvidence must be true");
    if (!report.neverAutomaticallyExecuteMitigation) errors.push("neverAutomaticallyExecuteMitigation must be true");
    if (!report.neverImplementQ911OrLater) errors.push("neverImplementQ911OrLater must be true");
    if (!report.observedRisksDistinctFromPredictions) {
      errors.push("observedRisksDistinctFromPredictions must be true");
    }
    for (const risk of report.detectedRisks) {
      if (risk.fabricated !== false) errors.push(`Risk ${risk.riskId} must have fabricated:false`);
      if (!risk.evidenceRefs.length) errors.push(`Risk ${risk.riskId} requires evidenceRefs`);
    }
    for (const mit of report.recommendedMitigations) {
      if (mit.isAutomaticExecution !== false) {
        errors.push(`Mitigation ${mit.mitigationId} must not auto-execute`);
      }
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
        errors: [`Capital Risk Worker never implements ${missionId} (Q9-11 or later)`],
        warnings: [],
      };
    }
    return { decision: "pass", errors: [], warnings: [] };
  }
}
