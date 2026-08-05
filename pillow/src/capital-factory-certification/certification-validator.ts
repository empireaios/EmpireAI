import { isForbiddenMissionId } from "./mission-catalog.js";
import { CAPCRT_METADATA_VERSION } from "./paths.js";
import type { CapcrtInput, CapcrtValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateSuccessfulTests?: boolean;
  forceFail?: boolean;
  assumeImplementation?: boolean;
  implementMissingWorkers?: boolean;
  modifyFinancialRecords?: boolean;
  automaticallyFixFailures?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ10OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class CapcrtValidator {
  decide(input: CapcrtInput): CapcrtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateSuccessfulTests === true ||
      input.forceFail === true ||
      input.assumeImplementation === true ||
      input.implementMissingWorkers === true ||
      input.modifyFinancialRecords === true ||
      input.automaticallyFixFailures === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.implementQ10OrLater === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: CapcrtInput, started: number): CapcrtValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Capital Factory Certification requires validated=true when explicitly set");
    }
    if (input.grandKingApproved === false) {
      warnings.push("Grand King approval not confirmed — certification gate will not reach Certified");
    }
    if (input.pillowCommandConfirmed === false) {
      warnings.push("Pillow command not confirmed — certification gate will not reach Certified");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: CapcrtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): CapcrtValidationReport {
    return {
      validationReportId: `capcrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CAPCRT_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateSuccessfulTests === true) {
      errors.push("Capital Factory Certification must never fabricate successful tests");
    }
    if (input.forceFail === true) {
      errors.push("Capital Factory Certification rejects forced failure boundary violation");
    }
    if (input.assumeImplementation === true) {
      errors.push("Capital Factory Certification must never assume implementation");
    }
    if (input.implementMissingWorkers === true) {
      errors.push("Capital Factory Certification must never implement missing workers");
    }
    if (input.modifyFinancialRecords === true) {
      errors.push("Capital Factory Certification must never modify financial records");
    }
    if (input.automaticallyFixFailures === true) {
      errors.push("Capital Factory Certification must never automatically fix failures");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Capital Factory Certification must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Capital Factory Certification must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Capital Factory Certification must never override Grand King");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Capital Factory Certification must never bypass Grand King approval");
    }
    if (input.implementQ10OrLater === true) {
      errors.push("Capital Factory Certification must never implement Q10 or later");
    }
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`Capital Factory Certification rejects forbidden missionId ${input.missionId}`);
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

export class RecoveryManager {
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
