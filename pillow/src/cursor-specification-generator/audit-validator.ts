import { isForbiddenMissionId } from "./mission-guard.js";
import type { CsgenInput, CsgenValidation, ValidationStatus } from "./types.js";

export class CsgenValidator {
  hasBoundaryViolation(input: CsgenInput): boolean {
    return this.collectBoundaryErrors(input).length > 0;
  }

  collectBoundaryErrors(input: CsgenInput): string[] {
    const errors: string[] = [];
    if (input.fabricateRepositoryFindings === true) errors.push("fabricateRepositoryFindings forbidden");
    if (input.inventMission === true) errors.push("inventMission forbidden");
    if (input.renameMission === true) errors.push("renameMission forbidden");
    if (input.alterDeliverable === true) errors.push("alterDeliverable forbidden");
    if (input.implementCode === true) errors.push("implementCode forbidden — specification only");
    if (input.executeCursorMission === true) errors.push("executeCursorMission forbidden — specification only");
    if (input.bypassGovernance === true) errors.push("bypassGovernance forbidden");
    if (input.selfApprove === true) errors.push("selfApprove forbidden");
    if (input.overridePillow === true) errors.push("overridePillow forbidden");
    if (input.overrideGrandKing === true) errors.push("overrideGrandKing forbidden");
    if (input.implementQ1305OrLater === true) errors.push("implementQ1305OrLater forbidden");
    if (input.missionId && isForbiddenMissionId(input.missionId)) {
      errors.push(`forbidden missionId ${input.missionId}`);
    }
    return errors;
  }

  validateInput(input: CsgenInput, started = Date.now()): CsgenValidation {
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
  ): CsgenValidation {
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
