import { isForbiddenMissionId } from "./mission-guard.js";
import { ISENG_METADATA_VERSION } from "./paths.js";
import type { IsengInput, IsengValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateRepositoryState?: boolean;
  overwriteVerifiedImplementations?: boolean;
  executeImplementation?: boolean;
  autoDeploy?: boolean;
  bypassGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1302OrLater?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class IsengValidator {
  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateRepositoryState === true ||
      input.overwriteVerifiedImplementations === true ||
      input.executeImplementation === true ||
      input.autoDeploy === true ||
      input.bypassGovernance === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1302OrLater === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: IsengInput, started: number): IsengValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Implementation Specification Engine requires validated=true when explicitly set");
    }
    return this.finalize(errors.length ? "fail" : warnings.length ? "partial" : "pass", errors, warnings, started);
  }

  finalize(
    decision: "pass" | "partial" | "fail",
    errors: string[],
    warnings: string[],
    started: number,
  ): IsengValidationReport {
    return {
      validationReportId: `iseng-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors: [...errors],
      warnings: [...warnings],
      durationMs: Math.max(1, Date.now() - started),
      metadataVersion: ISENG_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateRepositoryState) errors.push("neverFabricateRepositoryState boundary violated");
    if (input.overwriteVerifiedImplementations) errors.push("neverOverwriteVerifiedImplementations boundary violated");
    if (input.executeImplementation) errors.push("neverExecuteImplementations boundary violated");
    if (input.autoDeploy) errors.push("neverAutoDeploy boundary violated");
    if (input.bypassGovernance) errors.push("neverBypassGovernance boundary violated");
    if (input.overridePillow) errors.push("neverOverridePillow boundary violated");
    if (input.overrideGrandKing) errors.push("neverOverrideGrandKing boundary violated");
    if (input.implementQ1302OrLater) errors.push("neverImplementQ1302OrLater boundary violated");
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`forbidden missionId ${input.missionId.trim()} — Q13-01 never implements Q13-02+ or Q14+`);
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
