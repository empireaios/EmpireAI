import { AFCRT_METADATA_VERSION } from "./paths.js";
import type { AfcrtInput, AffiliateCertificationValidationReport } from "./types.js";

/** Reject Q9-01 and any later Q9 mission id. Q8-09 itself is allowed. */
const FORBIDDEN_MISSION_ID = /^Q9-\d+/i;

type BoundaryInput = {
  fabricateVerificationResults?: boolean;
  certifyUnsupportedFunctionality?: boolean;
  implementMissingFunctionality?: boolean;
  autoCorrectFailedImplementations?: boolean;
  overrideGovernance?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ901OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class AfcrtValidator {
  decide(input: AfcrtInput): AffiliateCertificationValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateVerificationResults === true ||
      input.certifyUnsupportedFunctionality === true ||
      input.implementMissingFunctionality === true ||
      input.autoCorrectFailedImplementations === true ||
      input.overrideGovernance === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.bypassGrandKingApproval === true ||
      input.implementQ901OrLater === true ||
      (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: AfcrtInput, started: number): AffiliateCertificationValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Affiliate Certification requires validated=true when explicitly set");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: AffiliateCertificationValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): AffiliateCertificationValidationReport {
    return {
      validationReportId: `afcrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AFCRT_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateVerificationResults === true) {
      errors.push("Affiliate Certification must never fabricate verification results");
    }
    if (input.certifyUnsupportedFunctionality === true) {
      errors.push("Affiliate Certification must never certify unsupported functionality");
    }
    if (input.implementMissingFunctionality === true) {
      errors.push("Affiliate Certification must never implement missing functionality");
    }
    if (input.autoCorrectFailedImplementations === true) {
      errors.push("Affiliate Certification must never auto-correct failed implementations");
    }
    if (input.overrideGovernance === true) {
      errors.push("Affiliate Certification must never override governance");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Affiliate Certification must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Affiliate Certification must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Affiliate Certification must never override Grand King");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Affiliate Certification must never bypass Grand King approval");
    }
    if (input.implementQ901OrLater === true) {
      errors.push("Affiliate Certification must never implement Q9-01 or later");
    }
    if (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Affiliate Certification rejects forbidden missionId ${input.missionId}`);
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
