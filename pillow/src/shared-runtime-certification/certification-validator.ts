import { isForbiddenMissionId } from "./runtime-catalog.js";
import { SRCRT_METADATA_VERSION } from "./paths.js";
import type { SrcrtInput, SrcrtValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateCertificationEvidence?: boolean;
  forceFail?: boolean;
  certifyMissingFunctionality?: boolean;
  assumeImplementation?: boolean;
  implementMissingRuntimes?: boolean;
  modifyRuntimeBehaviour?: boolean;
  automaticallyFixFailures?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1101OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class SrcrtValidator {
  decide(input: SrcrtInput): SrcrtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateCertificationEvidence === true ||
      input.forceFail === true ||
      input.certifyMissingFunctionality === true ||
      input.assumeImplementation === true ||
      input.implementMissingRuntimes === true ||
      input.modifyRuntimeBehaviour === true ||
      input.automaticallyFixFailures === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1101OrLater === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: SrcrtInput, started: number): SrcrtValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Shared Runtime Certification requires validated=true when explicitly set");
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
    decision: SrcrtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): SrcrtValidationReport {
    return {
      validationReportId: `srcrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SRCRT_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateCertificationEvidence === true) {
      errors.push("Shared Runtime Certification must never fabricate certification evidence");
    }
    if (input.forceFail === true) {
      errors.push("Shared Runtime Certification rejects forced failure boundary violation");
    }
    if (input.certifyMissingFunctionality === true) {
      errors.push("Shared Runtime Certification must never certify missing functionality");
    }
    if (input.assumeImplementation === true) {
      errors.push("Shared Runtime Certification must never assume implementation");
    }
    if (input.implementMissingRuntimes === true) {
      errors.push("Shared Runtime Certification must never implement missing runtimes");
    }
    if (input.modifyRuntimeBehaviour === true) {
      errors.push("Shared Runtime Certification must never modify runtime behaviour");
    }
    if (input.automaticallyFixFailures === true) {
      errors.push("Shared Runtime Certification must never automatically fix failures");
    }
    if (input.bypassPillowGovernance === true) {
      errors.push("Shared Runtime Certification must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Shared Runtime Certification must never bypass Grand King approval");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Shared Runtime Certification must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Shared Runtime Certification must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Shared Runtime Certification must never override Grand King");
    }
    if (input.implementQ1101OrLater === true) {
      errors.push("Shared Runtime Certification must never implement Q11-01 or later");
    }
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`Shared Runtime Certification rejects forbidden missionId ${input.missionId}`);
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
