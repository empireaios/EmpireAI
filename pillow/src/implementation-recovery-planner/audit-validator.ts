import { isForbiddenMissionId } from "./mission-guard.js";
import type { IrplnInput, IrplnValidation, ValidationStatus } from "./types.js";

export class IrplnValidator {
  hasBoundaryViolation(input: IrplnInput): boolean {
    return this.collectBoundaryErrors(input).length > 0;
  }

  collectBoundaryErrors(input: IrplnInput): string[] {
    const errors: string[] = [];
    if (input.fabricateRepositoryFindings === true) errors.push("fabricateRepositoryFindings forbidden");
    if (input.overwriteVerifiedImplementations === true) errors.push("overwriteVerifiedImplementations forbidden");
    if (input.deleteProductionCode === true) errors.push("deleteProductionCode forbidden without evidence");
    if (input.restartCompletedWork === true) errors.push("restartCompletedWork unnecessarily forbidden");
    if (input.executeRecovery === true) errors.push("executeRecovery forbidden — recovery planning only");
    if (input.modifyRepository === true) errors.push("modifyRepository forbidden — read-only analysis");
    if (input.bypassGovernance === true) errors.push("bypassGovernance forbidden");
    if (input.overridePillow === true) errors.push("overridePillow forbidden");
    if (input.overrideGrandKing === true) errors.push("overrideGrandKing forbidden");
    if (input.implementQ1306OrLater === true) errors.push("implementQ1306OrLater forbidden");
    if (input.missionId && isForbiddenMissionId(input.missionId)) {
      errors.push(`forbidden missionId ${input.missionId}`);
    }
    return errors;
  }

  validateInput(input: IrplnInput, started = Date.now()): IrplnValidation {
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
  ): IrplnValidation {
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
