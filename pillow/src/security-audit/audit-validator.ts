import { isForbiddenMissionId } from "./mission-guard.js";
import { SECART_METADATA_VERSION } from "./paths.js";
import type { SecartInput, SecartValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateSecurityEvidence?: boolean;
  forceFail?: boolean;
  certifyInsecureImplementations?: boolean;
  exposeSecretsDuringAuditing?: boolean;
  assumeImplementation?: boolean;
  modifySecurityImplementations?: boolean;
  repairFailedSecurityComponents?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1106OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class SecartValidator {
  decide(input: SecartInput): SecartValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateSecurityEvidence === true ||
      input.forceFail === true ||
      input.certifyInsecureImplementations === true ||
      input.exposeSecretsDuringAuditing === true ||
      input.assumeImplementation === true ||
      input.modifySecurityImplementations === true ||
      input.repairFailedSecurityComponents === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1106OrLater === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: SecartInput, started: number): SecartValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Security Audit requires validated=true when explicitly set");
    }
    if (input.grandKingApproved === false) {
      warnings.push("Grand King approval not confirmed — security readiness gate will not reach certify");
    }
    if (input.pillowCommandConfirmed === false) {
      warnings.push("Pillow command not confirmed — security readiness gate will not reach certify");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: SecartValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): SecartValidationReport {
    return {
      validationReportId: `secart-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SECART_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateSecurityEvidence === true) {
      errors.push("Security Audit must never fabricate security evidence");
    }
    if (input.forceFail === true) {
      errors.push("Security Audit rejects forced failure boundary violation");
    }
    if (input.certifyInsecureImplementations === true) {
      errors.push("Security Audit must never certify insecure implementations");
    }
    if (input.exposeSecretsDuringAuditing === true) {
      errors.push("Security Audit must never expose secrets during auditing");
    }
    if (input.assumeImplementation === true) {
      errors.push("Security Audit must never assume implementation");
    }
    if (input.modifySecurityImplementations === true) {
      errors.push("Security Audit must never modify security implementations");
    }
    if (input.repairFailedSecurityComponents === true) {
      errors.push("Security Audit must never repair failed security components");
    }
    if (input.bypassPillowGovernance === true) {
      errors.push("Security Audit must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Security Audit must never bypass Grand King approval");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Security Audit must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Security Audit must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Security Audit must never override Grand King");
    }
    if (input.implementQ1106OrLater === true) {
      errors.push("Security Audit must never implement Q11-06 or later");
    }
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`Security Audit rejects forbidden missionId ${input.missionId}`);
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
