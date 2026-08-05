import { isForbiddenMissionId } from "./mission-guard.js";
import { QSCRT_METADATA_VERSION } from "./paths.js";
import type { QscrtInput, QscrtValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateCertificationEvidence?: boolean;
  certifyMissing?: boolean;
  bypassGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1113OrLater?: boolean;
  forceCertify?: boolean;
  forceFail?: boolean;
  deferCertification?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class QscrtValidator {
  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateCertificationEvidence === true ||
      input.certifyMissing === true ||
      input.bypassGovernance === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1113OrLater === true ||
      input.forceCertify === true ||
      input.forceFail === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: QscrtInput, started: number): QscrtValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Q Series Certification requires validated=true when explicitly set");
    }
    return this.finalize(errors.length ? "fail" : warnings.length ? "partial" : "pass", errors, warnings, started);
  }

  finalize(
    decision: "pass" | "partial" | "fail",
    errors: string[],
    warnings: string[],
    started: number,
  ): QscrtValidationReport {
    return {
      validationReportId: `qscrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors: [...errors],
      warnings: [...warnings],
      durationMs: Math.max(1, Date.now() - started),
      metadataVersion: QSCRT_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateCertificationEvidence) errors.push("neverFabricateCertificationEvidence boundary violated");
    if (input.certifyMissing) errors.push("neverCertifyMissingFunctionality boundary violated");
    if (input.bypassGovernance) errors.push("neverBypassGovernance boundary violated");
    if (input.overridePillow) errors.push("neverOverridePillow boundary violated");
    if (input.overrideGrandKing) errors.push("neverOverrideGrandKing boundary violated");
    if (input.implementQ1113OrLater) errors.push("neverImplementQ1113OrLater boundary violated");
    if (input.forceCertify) errors.push("forceCertify forbidden — honest certify rule enforced");
    if (input.forceFail) errors.push("forceFail forbidden");
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`forbidden missionId ${input.missionId.trim()} — Q11-12 never implements Q11-13+`);
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
