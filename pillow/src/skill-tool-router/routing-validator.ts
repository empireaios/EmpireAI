import { STR_METADATA_VERSION } from "./paths.js";
import type {
  RoutingRecord,
  RoutingValidationReport,
  SkillToolRouterInput,
} from "./types.js";

type BoundaryInput = {
  executeWork?: boolean;
  performOrchestration?: boolean;
  replaceWorkers?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class RoutingValidator {
  decide(input: SkillToolRouterInput): RoutingValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (!input.executiveRequest?.trim()) return "fail";
    if (input.executiveRequest.trim().length < 8) return "partial";
    return "pass";
  }

  validateRecords(
    records: RoutingRecord[] | null,
    input: SkillToolRouterInput,
    started: number,
  ): RoutingValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (!input.executiveRequest?.trim()) errors.push("Executive request is required");
    if (input.validated === false) errors.push("Skill & Tool routing requires validated=true");

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No routing records were produced");
    } else {
      for (const record of records) {
        if (!record.routingId) errors.push("Missing routing ID");
        if (!record.executiveRequest.trim()) errors.push("Executive request missing on record");
        if (!Array.isArray(record.requiredCapabilities)) errors.push("Required capabilities missing");
        if (record.workExecuted) errors.push("workExecuted must remain false");
        if (record.orchestrationPerformed) errors.push("orchestrationPerformed must remain false");
        if (record.workersReplaced) errors.push("workersReplaced must remain false");
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (record.selectedWorkers.length === 0) {
          warnings.push("No workers selected — escalation path expected");
        }
        if (record.escalationRecommended) {
          warnings.push(`Escalation recommended for ${record.routingId}`);
        }
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWork === true ||
      input.performOrchestration === true ||
      input.replaceWorkers === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWork === true) errors.push("Skill & Tool Router must never execute work");
    if (input.performOrchestration === true) {
      errors.push("Skill & Tool Router must never perform orchestration");
    }
    if (input.replaceWorkers === true) errors.push("Skill & Tool Router must never replace workers");
    if (input.overridePillow === true) errors.push("Skill & Tool Router must never override Pillow");
    if (input.overrideGrandKing === true) {
      errors.push("Skill & Tool Router must never override Grand King");
    }
  }

  finalize(
    decision: RoutingValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): RoutingValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `str-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: STR_METADATA_VERSION,
    };
  }
}

export class RoutingMetadataGenerator {
  generate(routingCount: number, lastConfidence: number | null) {
    return {
      metadataVersion: STR_METADATA_VERSION,
      engineVersion: "PILLOW-STR-001" as const,
      missionId: "Q0-12" as const,
      routingCount,
      lastConfidence,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: RoutingValidationReport["decision"] | null, enabled: boolean) {
    if (!enabled) return "standby" as const;
    if (decision === "fail") return "degraded" as const;
    if (decision === "partial") return "degraded" as const;
    return "healthy" as const;
  }
}

export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
    return {
      recoveryAttempted: true,
      failures: this.failures,
      workExecuted: false as const,
      orchestrationPerformed: false as const,
      workersReplaced: false as const,
      pillowOverridden: false as const,
      grandKingOverridden: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
