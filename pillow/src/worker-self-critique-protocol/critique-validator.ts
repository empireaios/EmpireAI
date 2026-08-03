import { WSCP_METADATA_VERSION } from "./paths.js";
import type {
  SelfCritiqueRecord,
  WorkerSelfCritiqueProtocolInput,
  WorkerSelfCritiqueProtocolValidationReport,
} from "./types.js";

type BoundaryInput = {
  replacePeerReviewRuntime?: boolean;
  replaceWorkerQualityStandard?: boolean;
  executeWorkerTasks?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class CritiqueValidator {
  decide(
    input: WorkerSelfCritiqueProtocolInput,
    requireOutput = false,
  ): WorkerSelfCritiqueProtocolValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (requireOutput && !input.outputReviewed?.trim() && !input.workerId?.trim()) {
      return "partial";
    }
    return "pass";
  }

  validateRecords(
    records: SelfCritiqueRecord[] | null,
    input: WorkerSelfCritiqueProtocolInput,
    started: number,
    requireOutput = false,
  ): WorkerSelfCritiqueProtocolValidationReport {
    const decision = this.decide(input, requireOutput);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Worker Self-Critique Protocol requires validated=true");
    }
    if (requireOutput && !input.outputReviewed?.trim() && !input.workerId?.trim()) {
      warnings.push("outputReviewed or workerId is recommended");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No self-critique records were produced");
    } else {
      for (const record of records) {
        if (!record.selfCritiqueId) errors.push("Missing self-critique ID");
        if (!record.outputReviewed) {
          warnings.push(`Output reviewed empty for ${record.selfCritiqueId}`);
        }
        if (record.peerReviewRuntimeReplaced) {
          errors.push("peerReviewRuntimeReplaced must remain false");
        }
        if (record.workerQualityStandardReplaced) {
          errors.push("workerQualityStandardReplaced must remain false");
        }
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.replacePeerReviewRuntime === true ||
      input.replaceWorkerQualityStandard === true ||
      input.executeWorkerTasks === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.replacePeerReviewRuntime === true) {
      errors.push("Worker Self-Critique Protocol must never replace Peer Review Runtime");
    }
    if (input.replaceWorkerQualityStandard === true) {
      errors.push("Worker Self-Critique Protocol must never replace Worker Quality Standard");
    }
    if (input.executeWorkerTasks === true) {
      errors.push("Worker Self-Critique Protocol must never execute worker tasks");
    }
    if (input.overridePillow === true) {
      errors.push("Worker Self-Critique Protocol must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Worker Self-Critique Protocol must never override Grand King");
    }
  }

  finalize(
    decision: WorkerSelfCritiqueProtocolValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkerSelfCritiqueProtocolValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `wscp-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WSCP_METADATA_VERSION,
    };
  }
}

export class WorkerSelfCritiqueProtocolMetadataGenerator {
  generate(critiqueCount: number, reviseCount: number) {
    return {
      metadataVersion: WSCP_METADATA_VERSION,
      engineVersion: "PILLOW-WSCP-001" as const,
      missionId: "Q0-28" as const,
      critiqueCount,
      reviseCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(
    decision: WorkerSelfCritiqueProtocolValidationReport["decision"] | null,
    enabled: boolean,
  ) {
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
