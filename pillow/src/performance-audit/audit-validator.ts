import { isForbiddenMissionId } from "./mission-guard.js";
import { PERFART_METADATA_VERSION } from "./paths.js";
import type { PerfartInput, PerfartValidationReport } from "./types.js";

type BoundaryInput = {
  fabricatePerformanceEvidence?: boolean;
  forceFail?: boolean;
  certifyUntestedPerformance?: boolean;
  optimizeOrModifyProductionSystems?: boolean;
  assumeImplementation?: boolean;
  modifyPerformanceImplementations?: boolean;
  repairFailedPerformanceComponents?: boolean;
  bypassPillowGovernance?: boolean;
  bypassGrandKingApproval?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1107OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class PerfartValidator {
  decide(input: PerfartInput): PerfartValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricatePerformanceEvidence === true ||
      input.forceFail === true ||
      input.certifyUntestedPerformance === true ||
      input.optimizeOrModifyProductionSystems === true ||
      input.assumeImplementation === true ||
      input.modifyPerformanceImplementations === true ||
      input.repairFailedPerformanceComponents === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overrideApprovedArchitecture === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1107OrLater === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: PerfartInput, started: number): PerfartValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Performance Audit requires validated=true when explicitly set");
    }
    if (input.grandKingApproved === false) {
      warnings.push("Grand King approval not confirmed — performance readiness gate will not reach certify");
    }
    if (input.pillowCommandConfirmed === false) {
      warnings.push("Pillow command not confirmed — performance readiness gate will not reach certify");
    }
    return this.finalize(
      errors.length ? "fail" : warnings.length ? "partial" : "pass",
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: PerfartValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): PerfartValidationReport {
    return {
      validationReportId: `perfart-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PERFART_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricatePerformanceEvidence === true) {
      errors.push("Performance Audit must never fabricate performance evidence");
    }
    if (input.forceFail === true) {
      errors.push("Performance Audit rejects forced failure boundary violation");
    }
    if (input.certifyUntestedPerformance === true) {
      errors.push("Performance Audit must never certify untested performance");
    }
    if (input.optimizeOrModifyProductionSystems === true) {
      errors.push("Performance Audit must never optimize or modify production systems — audit only");
    }
    if (input.assumeImplementation === true) {
      errors.push("Performance Audit must never assume implementation");
    }
    if (input.modifyPerformanceImplementations === true) {
      errors.push("Performance Audit must never modify performance implementations");
    }
    if (input.repairFailedPerformanceComponents === true) {
      errors.push("Performance Audit must never repair failed performance components");
    }
    if (input.bypassPillowGovernance === true) {
      errors.push("Performance Audit must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval === true) {
      errors.push("Performance Audit must never bypass Grand King approval");
    }
    if (input.overrideApprovedArchitecture === true) {
      errors.push("Performance Audit must never override approved architecture");
    }
    if (input.overridePillow === true) {
      errors.push("Performance Audit must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Performance Audit must never override Grand King");
    }
    if (input.implementQ1107OrLater === true) {
      errors.push("Performance Audit must never implement Q11-07 or later");
    }
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`Performance Audit rejects forbidden missionId ${input.missionId}`);
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
