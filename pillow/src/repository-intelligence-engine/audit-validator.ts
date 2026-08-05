import { isForbiddenMissionId } from "./mission-guard.js";
import type { RiengInput, RiengValidation, ValidationStatus } from "./types.js";

export class RiengValidator {
  hasBoundaryViolation(input: RiengInput): boolean {
    return this.collectBoundaryErrors(input).length > 0;
  }

  collectBoundaryErrors(input: RiengInput): string[] {
    const errors: string[] = [];
    if (input.modifyRepository === true) errors.push("modifyRepository forbidden — read-only analysis only");
    if (input.implementQ1303OrLater === true) errors.push("implementQ1303OrLater forbidden");
    if (input.certifyQ1301 === true) errors.push("certifyQ1301 forbidden — RIENG never certifies Q13-01");
    if (input.missionId && isForbiddenMissionId(input.missionId)) {
      errors.push(`forbidden missionId ${input.missionId}`);
    }
    return errors;
  }

  validateInput(input: RiengInput, started = Date.now()): RiengValidation {
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
  ): RiengValidation {
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

export function resetRiengValidatorForTesting() {
  /* stateless validator — no-op */
}

export function resetGateManagerForTesting(manager: GateManager) {
  manager.resetForTesting();
}
