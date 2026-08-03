import { WQS_METADATA_VERSION } from "./paths.js";
import type {
  QualityRecord,
  WorkerQualityStandardInput,
  WorkerQualityStandardValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceWorkerImplementations?: boolean;
  replacePeerReviewRuntime?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class QualityValidator {
  decide(
    input: WorkerQualityStandardInput,
    requireWorker = false,
  ): WorkerQualityStandardValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (requireWorker && !input.workerId?.trim()) return "partial";
    return "pass";
  }

  validateRecords(
    records: QualityRecord[] | null,
    input: WorkerQualityStandardInput,
    started: number,
    requireWorker = false,
  ): WorkerQualityStandardValidationReport {
    const decision = this.decide(input, requireWorker);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Worker Quality Standard requires validated=true");
    }
    if (requireWorker && !input.workerId?.trim()) {
      warnings.push("workerId is recommended");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No quality records were produced");
    } else {
      for (const record of records) {
        if (!record.qualityRecordId) errors.push("Missing quality record ID");
        if (!record.workerId) warnings.push(`Worker ID empty for ${record.qualityRecordId}`);
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.workerImplementationsReplaced) {
          errors.push("workerImplementationsReplaced must remain false");
        }
        if (record.peerReviewRuntimeReplaced) {
          errors.push("peerReviewRuntimeReplaced must remain false");
        }
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkerImplementations === true ||
      input.replacePeerReviewRuntime === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Worker Quality Standard must never execute worker tasks");
    }
    if (input.replaceWorkerImplementations === true) {
      errors.push("Worker Quality Standard must never replace worker implementations");
    }
    if (input.replacePeerReviewRuntime === true) {
      errors.push("Worker Quality Standard must never replace Peer Review Runtime");
    }
    if (input.overridePillow === true) {
      errors.push("Worker Quality Standard must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Worker Quality Standard must never override Grand King");
    }
  }

  finalize(
    decision: WorkerQualityStandardValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkerQualityStandardValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `wqs-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WQS_METADATA_VERSION,
    };
  }
}

export class WorkerQualityStandardMetadataGenerator {
  generate(qualityCount: number, compliantCount: number) {
    return {
      metadataVersion: WQS_METADATA_VERSION,
      engineVersion: "PILLOW-WQS-001" as const,
      missionId: "Q0-27" as const,
      qualityCount,
      compliantCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: WorkerQualityStandardValidationReport["decision"] | null, enabled: boolean) {
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
    return this.failures;
  }
  reset() {
    this.failures = 0;
  }
  failureCount() {
    return this.failures;
  }
}
