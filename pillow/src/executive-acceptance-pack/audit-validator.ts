import { isForbiddenMissionId } from "./mission-guard.js";
import { EAPRT_METADATA_VERSION } from "./paths.js";
import type { EaprtInput, EaprtValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateAcceptanceEvidence?: boolean;
  hideFailedAudits?: boolean;
  approveProductionDeployment?: boolean;
  overrideFailedCertifications?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1110OrLater?: boolean;
  forceFail?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class EaprtValidator {
  decide(input: EaprtInput): EaprtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateAcceptanceEvidence === true ||
      input.hideFailedAudits === true ||
      input.approveProductionDeployment === true ||
      input.overrideFailedCertifications === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1110OrLater === true ||
      input.forceFail === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: EaprtInput, started: number): EaprtValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Executive Acceptance Pack requires validated=true when explicitly set");
    }
    if (input.grandKingApproved === false) {
      warnings.push("Grand King approval not confirmed — acceptance gate will not reach certify");
    }
    if (input.pillowCommandConfirmed === false) {
      warnings.push("Pillow command not confirmed — acceptance gate will not reach certify");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: EaprtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): EaprtValidationReport {
    return {
      validationReportId: `eaprt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EAPRT_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateAcceptanceEvidence === true) {
      errors.push("Executive Acceptance Pack must never fabricate acceptance evidence");
    }
    if (input.hideFailedAudits === true) {
      errors.push("Executive Acceptance Pack must never hide failed audits");
    }
    if (input.approveProductionDeployment === true) {
      errors.push("Executive Acceptance Pack must never approve production deployment");
    }
    if (input.overrideFailedCertifications === true) {
      errors.push("Executive Acceptance Pack must never override failed certifications");
    }
    if (input.bypassPillowGovernance === true) {
      errors.push("Executive Acceptance Pack must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Executive Acceptance Pack must never bypass Grand King approval");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Executive Acceptance Pack must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Executive Acceptance Pack must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Executive Acceptance Pack must never override Grand King");
    }
    if (input.implementQ1110OrLater === true) {
      errors.push("Executive Acceptance Pack must never implement Q11-10 or later");
    }
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`Executive Acceptance Pack rejects forbidden missionId ${input.missionId}`);
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

export class PackManager {
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
