import { isForbiddenMissionId } from "./mission-guard.js";
import { BFART_METADATA_VERSION } from "./paths.js";
import type { BfartInput, BfartValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateAuditEvidence?: boolean;
  forceFail?: boolean;
  certifyIncompleteWorkflows?: boolean;
  certifyMissingIntegrations?: boolean;
  assumeImplementation?: boolean;
  modifyFactoryImplementations?: boolean;
  repairFailedFactories?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1105OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class BfartValidator {
  decide(input: BfartInput): BfartValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateAuditEvidence === true ||
      input.forceFail === true ||
      input.certifyIncompleteWorkflows === true ||
      input.certifyMissingIntegrations === true ||
      input.assumeImplementation === true ||
      input.modifyFactoryImplementations === true ||
      input.repairFailedFactories === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1105OrLater === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: BfartInput, started: number): BfartValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Business Factory Audit requires validated=true when explicitly set");
    }
    if (input.grandKingApproved === false) {
      warnings.push("Grand King approval not confirmed — business factory readiness gate will not reach certify");
    }
    if (input.pillowCommandConfirmed === false) {
      warnings.push("Pillow command not confirmed — business factory readiness gate will not reach certify");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: BfartValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): BfartValidationReport {
    return {
      validationReportId: `bfart-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: BFART_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateAuditEvidence === true) {
      errors.push("Business Factory Audit must never fabricate audit evidence");
    }
    if (input.forceFail === true) {
      errors.push("Business Factory Audit rejects forced failure boundary violation");
    }
    if (input.certifyIncompleteWorkflows === true) {
      errors.push("Business Factory Audit must never certify incomplete workflows");
    }
    if (input.certifyMissingIntegrations === true) {
      errors.push("Business Factory Audit must never certify missing integrations");
    }
    if (input.assumeImplementation === true) {
      errors.push("Business Factory Audit must never assume implementation");
    }
    if (input.modifyFactoryImplementations === true) {
      errors.push("Business Factory Audit must never modify factory implementations");
    }
    if (input.repairFailedFactories === true) {
      errors.push("Business Factory Audit must never repair failed factories");
    }
    if (input.bypassPillowGovernance === true) {
      errors.push("Business Factory Audit must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Business Factory Audit must never bypass Grand King approval");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Business Factory Audit must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Business Factory Audit must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Business Factory Audit must never override Grand King");
    }
    if (input.implementQ1105OrLater === true) {
      errors.push("Business Factory Audit must never implement Q11-05 or later");
    }
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`Business Factory Audit rejects forbidden missionId ${input.missionId}`);
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
