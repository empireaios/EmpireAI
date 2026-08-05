import { isForbiddenMissionId } from "./mission-guard.js";
import { RECART_METADATA_VERSION } from "./paths.js";
import type { RecartInput, RecartValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateRecoveryEvidence?: boolean;
  forceFail?: boolean;
  certifyUntestedRecovery?: boolean;
  mutateProductionViaRecoveryCalls?: boolean;
  assumeImplementation?: boolean;
  modifyRecoveryImplementations?: boolean;
  repairFailedRecoveryComponents?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1108OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class RecartValidator {
  decide(input: RecartInput): RecartValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateRecoveryEvidence === true ||
      input.forceFail === true ||
      input.certifyUntestedRecovery === true ||
      input.mutateProductionViaRecoveryCalls === true ||
      input.assumeImplementation === true ||
      input.modifyRecoveryImplementations === true ||
      input.repairFailedRecoveryComponents === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1108OrLater === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: RecartInput, started: number): RecartValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Recovery Audit requires validated=true when explicitly set");
    }
    if (input.grandKingApproved === false) {
      warnings.push("Grand King approval not confirmed — recovery readiness gate will not reach certify");
    }
    if (input.pillowCommandConfirmed === false) {
      warnings.push("Pillow command not confirmed — recovery readiness gate will not reach certify");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: RecartValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): RecartValidationReport {
    return {
      validationReportId: `recart-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RECART_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateRecoveryEvidence === true) {
      errors.push("Recovery Audit must never fabricate recovery evidence");
    }
    if (input.forceFail === true) {
      errors.push("Recovery Audit rejects forced failure boundary violation");
    }
    if (input.certifyUntestedRecovery === true) {
      errors.push("Recovery Audit must never certify untested recovery");
    }
    if (input.mutateProductionViaRecoveryCalls === true) {
      errors.push("Recovery Audit must never mutate production via recovery side-effect calls during audit");
    }
    if (input.assumeImplementation === true) {
      errors.push("Recovery Audit must never assume implementation");
    }
    if (input.modifyRecoveryImplementations === true) {
      errors.push("Recovery Audit must never modify recovery implementations");
    }
    if (input.repairFailedRecoveryComponents === true) {
      errors.push("Recovery Audit must never repair failed recovery components");
    }
    if (input.bypassPillowGovernance === true) {
      errors.push("Recovery Audit must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Recovery Audit must never bypass Grand King approval");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Recovery Audit must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Recovery Audit must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Recovery Audit must never override Grand King");
    }
    if (input.implementQ1108OrLater === true) {
      errors.push("Recovery Audit must never implement Q11-08 or later");
    }
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`Recovery Audit rejects forbidden missionId ${input.missionId}`);
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
