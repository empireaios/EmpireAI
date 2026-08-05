import { isForbiddenMissionId } from "./mission-guard.js";
import type { MpengInput, MpengValidation, ValidationStatus } from "./types.js";

export class MpengValidator {
  hasBoundaryViolation(input: MpengInput): boolean {
    return this.collectBoundaryErrors(input).length > 0;
  }

  collectBoundaryErrors(input: MpengInput): string[] {
    const errors: string[] = [];
    if (input.fabricateRepositoryState === true) errors.push("fabricateRepositoryState forbidden");
    if (input.modifyRepository === true) errors.push("modifyRepository forbidden — planning only");
    if (input.executeImplementation === true) errors.push("executeImplementation forbidden — planning only");
    if (input.bypassGovernance === true) errors.push("bypassGovernance forbidden");
    if (input.overridePillow === true) errors.push("overridePillow forbidden");
    if (input.overrideGrandKing === true) errors.push("overrideGrandKing forbidden");
    if (input.ignoreDiscoveredDependencies === true) errors.push("ignoreDiscoveredDependencies forbidden");
    if (input.implementQ1304OrLater === true) errors.push("implementQ1304OrLater forbidden");
    if (input.autoDeploy === true) errors.push("autoDeploy forbidden");
    if (input.missionId && isForbiddenMissionId(input.missionId)) {
      errors.push(`forbidden missionId ${input.missionId}`);
    }
    return errors;
  }

  validateInput(input: MpengInput, started = Date.now()): MpengValidation {
    const errors = this.collectBoundaryErrors(input);
    if (errors.length > 0) return this.finalize("failed", errors, [], started);
    if (input.validated === false || input.pillowCommandConfirmed === false) {
      return this.finalize("partial", [], ["input not fully validated"], started);
    }
    return this.finalize("passed", [], [], started);
  }

  finalize(
    decision: ValidationStatus,
    errors: string[],
    warnings: string[],
    started: number,
  ): MpengValidation {
    return {
      decision,
      errors: [...errors],
      warnings: [...warnings],
      durationMs: Date.now() - started,
    };
  }
}

export class HealthMonitor {
  evaluate(confidenceScore: number, validationDecision: ValidationStatus): "healthy" | "degraded" | "failed" | "standby" | "blocked" {
    if (validationDecision === "failed") return "failed";
    if (confidenceScore < 0.35) return "degraded";
    if (confidenceScore >= 0.6) return "healthy";
    return "degraded";
  }
}

export class GateManager {
  private failures = 0;

  recordFailure() {
    this.failures += 1;
  }

  failureCount() {
    return this.failures;
  }

  resetForTesting() {
    this.failures = 0;
  }
}
