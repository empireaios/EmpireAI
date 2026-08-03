import { XPL_METADATA_VERSION } from "./paths.js";
import type {
  ExperienceRecord,
  ExperienceReplayEngineInput,
  ExperienceValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWork?: boolean;
  replaceExecutionMemory?: boolean;
  replaceDecisionEngine?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class ExperienceValidator {
  decide(input: ExperienceReplayEngineInput): ExperienceValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecords(
    records: ExperienceRecord[] | null,
    input: ExperienceReplayEngineInput,
    started: number,
  ): ExperienceValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Experience replay requires validated=true");

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No experience records were produced");
    } else {
      for (const record of records) {
        if (!record.experienceId) errors.push("Missing experience ID");
        if (!record.missionId) errors.push("Mission ID is required");
        if (!record.eventType) errors.push("Event type is required");
        if (!Array.isArray(record.lessonsLearned) || record.lessonsLearned.length === 0) {
          warnings.push(`No lessons learned on ${record.experienceId}`);
        }
        if (record.workExecuted) errors.push("workExecuted must remain false");
        if (record.executionMemoryReplaced) errors.push("executionMemoryReplaced must remain false");
        if (record.decisionEngineReplaced) errors.push("decisionEngineReplaced must remain false");
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (record.confidenceScore < 50) {
          warnings.push(`Low experience confidence (${record.confidenceScore})`);
        }
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWork === true ||
      input.replaceExecutionMemory === true ||
      input.replaceDecisionEngine === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWork === true) {
      errors.push("Experience Replay Engine must never execute work");
    }
    if (input.replaceExecutionMemory === true) {
      errors.push("Experience Replay Engine must never replace Execution Memory");
    }
    if (input.replaceDecisionEngine === true) {
      errors.push("Experience Replay Engine must never replace Decision Engine");
    }
    if (input.overridePillow === true) {
      errors.push("Experience Replay Engine must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Experience Replay Engine must never override Grand King");
    }
  }

  finalize(
    decision: ExperienceValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ExperienceValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `xpl-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: XPL_METADATA_VERSION,
    };
  }
}

export class ExperienceMetadataGenerator {
  generate(experienceCount: number, lastConfidence: number | null) {
    return {
      metadataVersion: XPL_METADATA_VERSION,
      engineVersion: "PILLOW-XPL-001" as const,
      missionId: "Q0-14" as const,
      experienceCount,
      lastConfidence,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: ExperienceValidationReport["decision"] | null, enabled: boolean) {
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
      executionMemoryReplaced: false as const,
      decisionEngineReplaced: false as const,
      pillowOverridden: false as const,
      grandKingOverridden: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
