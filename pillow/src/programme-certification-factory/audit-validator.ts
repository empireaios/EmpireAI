import { isForbiddenMissionId } from "./mission-guard.js";
import type { PcfctInput, PcfctValidation, ValidationStatus } from "./types.js";

export class PcfctValidator {
  hasBoundaryViolation(input: PcfctInput): boolean {
    return this.collectBoundaryErrors(input).length > 0;
  }

  collectBoundaryErrors(input: PcfctInput): string[] {
    const errors: string[] = [];
    if (input.fabricateFindings === true) errors.push("fabricateFindings forbidden");
    if (input.autoModifyProduction === true) errors.push("autoModifyProduction forbidden");
    if (input.certifyFromClaimsAlone === true) errors.push("certifyFromClaimsAlone forbidden — repository evidence only");
    if (input.bypassGovernance === true) errors.push("bypassGovernance forbidden");
    if (input.overridePillow === true) errors.push("overridePillow forbidden");
    if (input.overrideGrandKing === true) errors.push("overrideGrandKing forbidden");
    if (input.implementQ1307OrLater === true) errors.push("implementQ1307OrLater forbidden — Q13-06 is final Q Series mission");
    if (input.inventMissions === true) errors.push("inventMissions forbidden — evidence-derived inventory only");
    if (input.missionId && isForbiddenMissionId(input.missionId)) {
      errors.push(`forbidden missionId ${input.missionId}`);
    }
    return errors;
  }

  validateInput(input: PcfctInput, started = Date.now()): PcfctValidation {
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
  ): PcfctValidation {
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
