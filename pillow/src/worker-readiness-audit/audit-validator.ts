import { isForbiddenMissionId } from "./mission-guard.js";
import { WRART_METADATA_VERSION } from "./paths.js";
import type { WrartInput, WrartValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateAuditEvidence?: boolean;
  forceFail?: boolean;
  certifyMissingWorkers?: boolean;
  certifyUnreachableWorkers?: boolean;
  assumeImplementation?: boolean;
  modifyWorkerImplementations?: boolean;
  repairFailedWorkers?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1103OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class WrartValidator {
  decide(input: WrartInput): WrartValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateAuditEvidence === true ||
      input.forceFail === true ||
      input.certifyMissingWorkers === true ||
      input.certifyUnreachableWorkers === true ||
      input.assumeImplementation === true ||
      input.modifyWorkerImplementations === true ||
      input.repairFailedWorkers === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1103OrLater === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: WrartInput, started: number): WrartValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Worker Readiness Audit requires validated=true when explicitly set");
    }
    if (input.grandKingApproved === false) {
      warnings.push("Grand King approval not confirmed — readiness gate will not reach Ready");
    }
    if (input.pillowCommandConfirmed === false) {
      warnings.push("Pillow command not confirmed — readiness gate will not reach Ready");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: WrartValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WrartValidationReport {
    return {
      validationReportId: `wrart-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WRART_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateAuditEvidence === true) {
      errors.push("Worker Readiness Audit must never fabricate audit evidence");
    }
    if (input.forceFail === true) {
      errors.push("Worker Readiness Audit rejects forced failure boundary violation");
    }
    if (input.certifyMissingWorkers === true) {
      errors.push("Worker Readiness Audit must never certify missing workers");
    }
    if (input.certifyUnreachableWorkers === true) {
      errors.push("Worker Readiness Audit must never certify unreachable workers");
    }
    if (input.assumeImplementation === true) {
      errors.push("Worker Readiness Audit must never assume implementation");
    }
    if (input.modifyWorkerImplementations === true) {
      errors.push("Worker Readiness Audit must never modify worker implementations");
    }
    if (input.repairFailedWorkers === true) {
      errors.push("Worker Readiness Audit must never repair failed workers");
    }
    if (input.bypassPillowGovernance === true) {
      errors.push("Worker Readiness Audit must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Worker Readiness Audit must never bypass Grand King approval");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Worker Readiness Audit must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Worker Readiness Audit must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Worker Readiness Audit must never override Grand King");
    }
    if (input.implementQ1103OrLater === true) {
      errors.push("Worker Readiness Audit must never implement Q11-03 or later");
    }
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`Worker Readiness Audit rejects forbidden missionId ${input.missionId}`);
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
