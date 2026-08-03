import { CORE_METADATA_VERSION } from "./paths.js";
import type {
  ReasoningRecord,
  ReasoningValidationReport,
  CollectiveReasoningEngineInput,
} from "./types.js";

type BoundaryInput = {
  executeWork?: boolean;
  assignWorkersPermanently?: boolean;
  replacePillow?: boolean;
  overrideGrandKing?: boolean;
  approveActions?: boolean;
  validated?: boolean;
};

export class ReasoningValidator {
  decide(input: CollectiveReasoningEngineInput): ReasoningValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (!input.executiveQuestion?.trim()) return "fail";
    if (input.executiveQuestion.trim().length < 8) return "partial";
    return "pass";
  }

  validateRecords(
    records: ReasoningRecord[] | null,
    input: CollectiveReasoningEngineInput,
    started: number,
  ): ReasoningValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (!input.executiveQuestion?.trim()) errors.push("Executive question is required");
    if (input.validated === false) errors.push("Collective reasoning requires validated=true");

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No reasoning records were produced");
    } else {
      for (const record of records) {
        if (!record.reasoningId) errors.push("Missing reasoning ID");
        if (!record.executiveQuestion.trim()) errors.push("Executive question missing on record");
        if (!Array.isArray(record.participants) || record.participants.length < 2) {
          warnings.push("Reasoning panel should include multiple participants");
        }
        if (!Array.isArray(record.independentOpinions)) errors.push("Independent opinions missing");
        if (record.workExecuted) errors.push("workExecuted must remain false");
        if (record.workersAssignedPermanently) {
          errors.push("workersAssignedPermanently must remain false");
        }
        if (record.pillowReplaced) errors.push("pillowReplaced must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (record.actionsApproved) errors.push("actionsApproved must remain false");
        if (record.conflictsDetected > 0 && record.challengesRaised.length === 0) {
          warnings.push("Conflicts detected without recorded challenges");
        }
        if (record.confidenceScore < 50) {
          warnings.push(`Low collective confidence (${record.confidenceScore})`);
        }
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWork === true ||
      input.assignWorkersPermanently === true ||
      input.replacePillow === true ||
      input.overrideGrandKing === true ||
      input.approveActions === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWork === true) {
      errors.push("Collective Reasoning Engine must never execute work");
    }
    if (input.assignWorkersPermanently === true) {
      errors.push("Collective Reasoning Engine must never assign workers permanently");
    }
    if (input.replacePillow === true) {
      errors.push("Collective Reasoning Engine must never replace Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Collective Reasoning Engine must never override Grand King");
    }
    if (input.approveActions === true) {
      errors.push("Collective Reasoning Engine must never approve actions");
    }
  }

  finalize(
    decision: ReasoningValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ReasoningValidationReport {
    const finalDecision =
      errors.length || decision === "fail" ? "fail" : warnings.length || decision === "partial" ? "partial" : "pass";
    return {
      validationReportId: `core-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CORE_METADATA_VERSION,
    };
  }
}

export class ReasoningMetadataGenerator {
  generate(reasoningCount: number, lastConfidence: number | null) {
    return {
      metadataVersion: CORE_METADATA_VERSION,
      engineVersion: "PILLOW-CORE-001" as const,
      missionId: "Q0-13" as const,
      reasoningCount,
      lastConfidence,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: ReasoningValidationReport["decision"] | null, enabled: boolean) {
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
      workersAssignedPermanently: false as const,
      pillowReplaced: false as const,
      grandKingOverridden: false as const,
      actionsApproved: false as const,
    };
  }
  reset() {
    this.failures = 0;
  }
}
