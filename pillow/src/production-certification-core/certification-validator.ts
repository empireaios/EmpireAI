import { isForbiddenMissionId } from "./programme-catalog.js";
import { PCCRT_METADATA_VERSION } from "./paths.js";
import type { PccrtInput, PccrtValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateCertificationEvidence?: boolean;
  forceFail?: boolean;
  certifyMissingCapabilities?: boolean;
  assumeImplementation?: boolean;
  implementMissingCapabilities?: boolean;
  modifyProductionLogic?: boolean;
  replaceIndividualAuditProgrammes?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1102OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class PccrtValidator {
  decide(input: PccrtInput): PccrtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateCertificationEvidence === true ||
      input.forceFail === true ||
      input.certifyMissingCapabilities === true ||
      input.assumeImplementation === true ||
      input.implementMissingCapabilities === true ||
      input.modifyProductionLogic === true ||
      input.replaceIndividualAuditProgrammes === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1102OrLater === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: PccrtInput, started: number): PccrtValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Production Certification Core requires validated=true when explicitly set");
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
    decision: PccrtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): PccrtValidationReport {
    return {
      validationReportId: `pccrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PCCRT_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateCertificationEvidence === true) {
      errors.push("Production Certification Core must never fabricate certification evidence");
    }
    if (input.forceFail === true) {
      errors.push("Production Certification Core rejects forced failure boundary violation");
    }
    if (input.certifyMissingCapabilities === true) {
      errors.push("Production Certification Core must never certify missing capabilities");
    }
    if (input.assumeImplementation === true) {
      errors.push("Production Certification Core must never assume implementation");
    }
    if (input.implementMissingCapabilities === true) {
      errors.push("Production Certification Core must never implement missing capabilities");
    }
    if (input.modifyProductionLogic === true) {
      errors.push("Production Certification Core must never modify production logic");
    }
    if (input.replaceIndividualAuditProgrammes === true) {
      errors.push("Production Certification Core must never replace individual audit programmes");
    }
    if (input.bypassPillowGovernance === true) {
      errors.push("Production Certification Core must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Production Certification Core must never bypass Grand King approval");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Production Certification Core must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Production Certification Core must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Production Certification Core must never override Grand King");
    }
    if (input.implementQ1102OrLater === true) {
      errors.push("Production Certification Core must never implement Q11-02 or later");
    }
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`Production Certification Core rejects forbidden missionId ${input.missionId}`);
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
