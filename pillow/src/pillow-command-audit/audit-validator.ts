import { isForbiddenMissionId } from "./mission-guard.js";
import { PCART_METADATA_VERSION } from "./paths.js";
import type { PcartInput, PcartValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateAuditEvidence?: boolean;
  forceFail?: boolean;
  certifyUnverifiedCommandCapability?: boolean;
  assumeImplementation?: boolean;
  modifyWorkerImplementations?: boolean;
  repairFailedWorkers?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1104OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class PcartValidator {
  decide(input: PcartInput): PcartValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateAuditEvidence === true ||
      input.forceFail === true ||
      input.certifyUnverifiedCommandCapability === true ||
      input.assumeImplementation === true ||
      input.modifyWorkerImplementations === true ||
      input.repairFailedWorkers === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1104OrLater === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: PcartInput, started: number): PcartValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Pillow Command Audit requires validated=true when explicitly set");
    }
    if (input.grandKingApproved === false) {
      warnings.push("Grand King approval not confirmed — command readiness gate will not reach Ready");
    }
    if (input.pillowCommandConfirmed === false) {
      warnings.push("Pillow command not confirmed — command readiness gate will not reach Ready");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: PcartValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): PcartValidationReport {
    return {
      validationReportId: `pcart-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PCART_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateAuditEvidence === true) {
      errors.push("Pillow Command Audit must never fabricate audit evidence");
    }
    if (input.forceFail === true) {
      errors.push("Pillow Command Audit rejects forced failure boundary violation");
    }
    if (input.certifyUnverifiedCommandCapability === true) {
      errors.push("Pillow Command Audit must never certify unverified command capability");
    }
    if (input.assumeImplementation === true) {
      errors.push("Pillow Command Audit must never assume implementation");
    }
    if (input.modifyWorkerImplementations === true) {
      errors.push("Pillow Command Audit must never modify worker implementations");
    }
    if (input.repairFailedWorkers === true) {
      errors.push("Pillow Command Audit must never repair failed workers");
    }
    if (input.bypassPillowGovernance === true) {
      errors.push("Pillow Command Audit must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Pillow Command Audit must never bypass Grand King approval");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Pillow Command Audit must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Pillow Command Audit must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Pillow Command Audit must never override Grand King");
    }
    if (input.implementQ1104OrLater === true) {
      errors.push("Pillow Command Audit must never implement Q11-04 or later");
    }
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`Pillow Command Audit rejects forbidden missionId ${input.missionId}`);
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
