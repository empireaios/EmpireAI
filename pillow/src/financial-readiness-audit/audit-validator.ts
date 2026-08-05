import { isForbiddenMissionId } from "./mission-guard.js";
import { FINART_METADATA_VERSION } from "./paths.js";
import type { FinartInput, FinartValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateFinancialEvidence?: boolean;
  forceFail?: boolean;
  certifyUnverifiedFinancialCapability?: boolean;
  executeFinancialTransactions?: boolean;
  modifyAccountingRecords?: boolean;
  assumeImplementation?: boolean;
  repairFailedFinancialComponents?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1109OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class FinartValidator {
  decide(input: FinartInput): FinartValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateFinancialEvidence === true ||
      input.forceFail === true ||
      input.certifyUnverifiedFinancialCapability === true ||
      input.executeFinancialTransactions === true ||
      input.modifyAccountingRecords === true ||
      input.assumeImplementation === true ||
      input.repairFailedFinancialComponents === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1109OrLater === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: FinartInput, started: number): FinartValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Financial Readiness Audit requires validated=true when explicitly set");
    }
    if (input.grandKingApproved === false) {
      warnings.push("Grand King approval not confirmed — financial readiness gate will not reach certify");
    }
    if (input.pillowCommandConfirmed === false) {
      warnings.push("Pillow command not confirmed — financial readiness gate will not reach certify");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: FinartValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): FinartValidationReport {
    return {
      validationReportId: `finart-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: FINART_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateFinancialEvidence === true) {
      errors.push("Financial Readiness Audit must never fabricate financial evidence");
    }
    if (input.forceFail === true) {
      errors.push("Financial Readiness Audit rejects forced failure boundary violation");
    }
    if (input.certifyUnverifiedFinancialCapability === true) {
      errors.push("Financial Readiness Audit must never certify unverified financial capability");
    }
    if (input.executeFinancialTransactions === true) {
      errors.push("Financial Readiness Audit must never execute financial transactions during audit");
    }
    if (input.modifyAccountingRecords === true) {
      errors.push("Financial Readiness Audit must never modify accounting records");
    }
    if (input.assumeImplementation === true) {
      errors.push("Financial Readiness Audit must never assume implementation");
    }
    if (input.repairFailedFinancialComponents === true) {
      errors.push("Financial Readiness Audit must never repair failed financial components");
    }
    if (input.bypassPillowGovernance === true) {
      errors.push("Financial Readiness Audit must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Financial Readiness Audit must never bypass Grand King approval");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Financial Readiness Audit must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Financial Readiness Audit must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Financial Readiness Audit must never override Grand King");
    }
    if (input.implementQ1109OrLater === true) {
      errors.push("Financial Readiness Audit must never implement Q11-09 or later");
    }
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`Financial Readiness Audit rejects forbidden missionId ${input.missionId}`);
    }
  }
}

export class HealthMonitor {
  status(
    decision: "pass" | "partial" | "fail",
    enabled: boolean,
  ): "healthy" | "degraded" | "failed" | "standby" {
    if (!enabled) return "standby";
    if (decision === "fail") return "failed";
    if (decision === "partial") return "degraded";
    return "healthy";
  }
}

export class FinancialManager {
  private failures = 0;

  recordFailure() {
    this.failures += 1;
  }

  reset() {
    this.failures = 0;
  }

  failureCount() {
    return this.failures;
  }
}
