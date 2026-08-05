import { isForbiddenMissionId } from "./mission-guard.js";
import { PLMRT_METADATA_VERSION } from "./paths.js";
import type { PlmrtInput, PlmrtValidationReport } from "./types.js";

type BoundaryInput = {
  fabricateProductionEvidence?: boolean;
  suppressCriticalIncidents?: boolean;
  hideFailures?: boolean;
  autoModifyProduction?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ1112OrLater?: boolean;
  forceHealthy?: boolean;
  forceFail?: boolean;
  missionId?: string | null;
  validated?: boolean;
};

export class PlmrtValidator {
  hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.fabricateProductionEvidence === true ||
      input.suppressCriticalIncidents === true ||
      input.hideFailures === true ||
      input.autoModifyProduction === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ1112OrLater === true ||
      input.forceHealthy === true ||
      input.forceFail === true ||
      (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim()))
    );
  }

  collectBoundaryErrors(input: BoundaryInput): string[] {
    const errors: string[] = [];
    this.pushBoundaryErrors(input, errors);
    return errors;
  }

  validateInput(input: PlmrtInput, started: number): PlmrtValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Post-Launch Monitoring requires validated=true when explicitly set");
    }
    return this.finalize(errors.length ? "fail" : warnings.length ? "partial" : "pass", errors, warnings, started);
  }

  finalize(
    decision: "pass" | "partial" | "fail",
    errors: string[],
    warnings: string[],
    started: number,
  ): PlmrtValidationReport {
    return {
      validationReportId: `plmrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors: [...errors],
      warnings: [...warnings],
      durationMs: Math.max(1, Date.now() - started),
      metadataVersion: PLMRT_METADATA_VERSION,
    };
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.fabricateProductionEvidence) errors.push("neverFabricateProductionEvidence boundary violated");
    if (input.suppressCriticalIncidents) errors.push("neverSuppressCriticalIncidents boundary violated");
    if (input.hideFailures) errors.push("neverHideFailures boundary violated");
    if (input.autoModifyProduction) errors.push("neverAutoModifyProduction boundary violated");
    if (input.overridePillow) errors.push("neverOverridePillow boundary violated");
    if (input.overrideGrandKing) errors.push("neverOverrideGrandKing boundary violated");
    if (input.implementQ1112OrLater) errors.push("neverImplementQ1112OrLater boundary violated");
    if (input.forceHealthy) errors.push("forceHealthy forbidden — never fabricate production health");
    if (input.forceFail) errors.push("forceFail forbidden");
    if (typeof input.missionId === "string" && isForbiddenMissionId(input.missionId.trim())) {
      errors.push(`forbidden missionId ${input.missionId.trim()} — Q11-11 never implements Q11-12+`);
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

export function resetPlmrtValidatorForTesting() {
  /* stateless validator — no-op */
}
