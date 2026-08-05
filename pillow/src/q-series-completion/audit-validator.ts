import { isForbiddenMissionId } from "./mission-guard.js";
import { QSCPT_METADATA_VERSION } from "./paths.js";
import type { QscptInput, QscptValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateCompletionEvidence?: boolean;
  markCompleteWhenUnmet?: boolean;
  bypassGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1201OrLater?: boolean;
  forceComplete?: boolean;
  forceFail?: boolean;
  deferCompletion?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class QscptValidator {
  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateCompletionEvidence === true ||
      input.markCompleteWhenUnmet === true ||
      input.bypassGovernance === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1201OrLater === true ||
      input.forceComplete === true ||
      input.forceFail === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: QscptInput, started: number): QscptValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Q Series Completion requires validated=true when explicitly set");
    }
    return this.finalize(errors.length ? "fail" : warnings.length ? "partial" : "pass", errors, warnings, started);
  }

  finalize(
    decision: "pass" | "partial" | "fail",
    errors: string[],
    warnings: string[],
    started: number,
  ): QscptValidationReport {
    return {
      validationReportId: `qscpt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors: [...errors],
      warnings: [...warnings],
      durationMs: Math.max(1, Date.now() - started),
      metadataVersion: QSCPT_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateCompletionEvidence) errors.push("neverFabricateCompletionEvidence boundary violated");
    if (input.markCompleteWhenUnmet) errors.push("neverMarkCompleteWhenUnmet boundary violated");
    if (input.bypassGovernance) errors.push("neverBypassGovernance boundary violated");
    if (input.overridePillow) errors.push("neverOverridePillow boundary violated");
    if (input.overrideGrandKing) errors.push("neverOverrideGrandKing boundary violated");
    if (input.implementQ1201OrLater) errors.push("neverImplementQ1201OrLater boundary violated");
    if (input.forceComplete) errors.push("forceComplete forbidden — honest complete rule enforced");
    if (input.forceFail) errors.push("forceFail forbidden");
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`forbidden missionId ${input.missionId.trim()} — Q11-13 never implements Q12-01+`);
    }
  }
}

export class HealthMonitor {
  private failureCount = 0;

  recordFailure() {
    this.failureCount += 1;
  }

  getFailureCount() {
    return this.failureCount;
  }

  resetForTesting() {
    this.failureCount = 0;
  }
}

export class GateManager {
  private failures = 0;

  recordFailure() {
    this.failures += 1;
  }

  resetForTesting() {
    this.failures = 0;
  }

  failureCount() {
    return this.failures;
  }
}
