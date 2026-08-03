import { LBC_METADATA_VERSION } from "./paths.js";
import type { LbcInput, LocalBusinessCertificationValidationReport } from "./types.js";

/** Reject Q8-01 and any later Q8 mission id. Q7-11 itself is allowed. */
const FORBIDDEN_MISSION_ID = /^Q8-\d+/i;

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
  implementQ801OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class LbcValidator {
  decide(input: LbcInput): LocalBusinessCertificationValidationReport["decision"] {
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
      input.implementQ801OrLater === true ||
      (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: LbcInput, started: number): LocalBusinessCertificationValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Local Business Certification requires validated=true when explicitly set");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: LocalBusinessCertificationValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): LocalBusinessCertificationValidationReport {
    return {
      validationReportId: `lbc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: LBC_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateVerificationResults === true) {
      errors.push("Local Business Certification must never fabricate verification results");
    }
    if (input.certifyUnsupportedFunctionality === true) {
      errors.push("Local Business Certification must never certify unsupported functionality");
    }
    if (input.implementMissingFunctionality === true) {
      errors.push("Local Business Certification must never implement missing functionality");
    }
    if (input.autoCorrectFailedImplementations === true) {
      errors.push("Local Business Certification must never auto-correct failed implementations");
    }
    if (input.overrideGovernance === true) {
      errors.push("Local Business Certification must never override governance");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Local Business Certification must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Local Business Certification must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Local Business Certification must never override Grand King");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Local Business Certification must never bypass Grand King approval");
    }
    if (input.implementQ801OrLater === true) {
      errors.push("Local Business Certification must never implement Q8-01 or later");
    }
    if (typeof input.missionId === "string" && FORBIDDEN_MISSION_ID.test(input.missionId.trim())) {
      errors.push(`Local Business Certification rejects forbidden missionId ${input.missionId}`);
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
