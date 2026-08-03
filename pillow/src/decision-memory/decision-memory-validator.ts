import { DMEM_METADATA_VERSION } from "./paths.js";
import type {
  DecisionMemoryInput,
  DecisionRecord,
  DecisionValidationReport,
} from "./types.js";

type BoundaryInput = {
  makeDecisions?: boolean;
  executeWork?: boolean;
  replaceExecutionMemory?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class DecisionMemoryValidator {
  decide(input: DecisionMemoryInput, requireRecordFields = false): DecisionValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (requireRecordFields) {
      if (!input.executiveObjective?.trim()) return "fail";
      if (!input.decisionSummary?.trim() && !input.executiveObjective?.trim()) return "fail";
      if (!input.recommendedOption?.trim()) return "partial";
      if (!input.decisionRationale?.trim()) return "partial";
    }
    return "pass";
  }

  validateRecords(
    records: DecisionRecord[] | null,
    input: DecisionMemoryInput,
    started: number,
    requireRecordFields = false,
  ): DecisionValidationReport {
    const decision = this.decide(input, requireRecordFields);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Decision Memory requires validated=true");
    if (requireRecordFields) {
      if (!input.executiveObjective?.trim()) errors.push("Executive objective is required");
      if (!input.recommendedOption?.trim()) warnings.push("Recommended option missing");
      if (!input.decisionRationale?.trim()) warnings.push("Decision rationale missing");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No decision records were produced");
    } else {
      for (const record of records) {
        if (!record.decisionId) errors.push("Missing decision ID");
        if (!record.executiveObjective.trim()) errors.push("Executive objective missing on record");
        if (!record.decisionSummary.trim()) warnings.push(`Decision summary empty for ${record.decisionId}`);
        if (record.decisionsMade) errors.push("decisionsMade must remain false");
        if (record.workExecuted) errors.push("workExecuted must remain false");
        if (record.executionMemoryReplaced) errors.push("executionMemoryReplaced must remain false");
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (record.confidenceScore < 40) {
          warnings.push(`Low confidence decision recorded (${record.confidenceScore})`);
        }
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.makeDecisions === true ||
      input.executeWork === true ||
      input.replaceExecutionMemory === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.makeDecisions === true) errors.push("Decision Memory must never make decisions");
    if (input.executeWork === true) errors.push("Decision Memory must never execute work");
    if (input.replaceExecutionMemory === true) {
      errors.push("Decision Memory must never replace Execution Memory");
    }
    if (input.overridePillow === true) errors.push("Decision Memory must never override Pillow");
    if (input.overrideGrandKing === true) {
      errors.push("Decision Memory must never override Grand King");
    }
  }

  finalize(
    decision: DecisionValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): DecisionValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `dmem-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: DMEM_METADATA_VERSION,
    };
  }
}

export class DecisionMetadataGenerator {
  generate(decisionCount: number, lastConfidence: number | null) {
    return {
      metadataVersion: DMEM_METADATA_VERSION,
      engineVersion: "PILLOW-DMEM-001" as const,
      missionId: "Q0-16" as const,
      decisionCount,
      lastConfidence,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: DecisionValidationReport["decision"] | null, enabled: boolean) {
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
      decisionsMade: false as const,
      workExecuted: false as const,
      executionMemoryReplaced: false as const,
      pillowOverridden: false as const,
      grandKingOverridden: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
