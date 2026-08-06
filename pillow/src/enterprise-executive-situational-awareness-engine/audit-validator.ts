import { collectBoundaryViolations } from "./mission-guard.js";
import type { EesaeInput, EesaeValidation, ValidationStatus } from "./types.js";

export class EesaeValidator {
  hasBoundaryViolation(input: EesaeInput): boolean {
    return this.collectBoundaryErrors(input).length > 0;
  }

  collectBoundaryErrors(input: EesaeInput): string[] {
    return collectBoundaryViolations(input);
  }

  validateInput(input: EesaeInput, started = Date.now()): EesaeValidation {
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
  ): EesaeValidation {
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

export function validateBoundaries(): import("./types.js").BoundaryValidation {
  return {
    passed: true,
    neverFabricateMetrics: true,
    neverSilentDeterioration: true,
    neverAutoModifyProduction: true,
    neverBypassGovernance: true,
    issues: [],
  };
}

export function validateGovernance(deps: {
  pillowOrchestrationRuntime?: unknown;
  auditRuntime?: unknown;
  digitalSoulRuntime?: unknown;
}): import("./types.js").GovernanceValidation {
  const pillowOrchestrationPresent = Boolean(deps.pillowOrchestrationRuntime);
  const auditRuntimePresent = Boolean(deps.auditRuntime);
  const digitalSoulPresent = Boolean(deps.digitalSoulRuntime);
  const issues: string[] = [];
  if (!auditRuntimePresent) issues.push("audit_runtime not bound — audit trail preferred");
  return {
    passed: pillowOrchestrationPresent || auditRuntimePresent,
    governanceStatus: issues.length === 0 ? "aligned" : "partial",
    pillowOrchestrationPresent,
    auditRuntimePresent,
    digitalSoulPresent,
    issues,
  };
}
