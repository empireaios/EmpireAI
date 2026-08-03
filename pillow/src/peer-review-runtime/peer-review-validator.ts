import { PRR_METADATA_VERSION } from "./paths.js";
import type {
  PeerReviewRecord,
  PeerReviewRuntimeInput,
  PeerReviewRuntimeValidationReport,
} from "./types.js";

type BoundaryInput = {
  replaceWorkers?: boolean;
  rewriteCompletedWork?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  executeBusinessTasks?: boolean;
  validated?: boolean;
};

export class PeerReviewValidator {
  decide(
    input: PeerReviewRuntimeInput,
    requireWork = false,
  ): PeerReviewRuntimeValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (requireWork && !input.taskId?.trim()) return "fail";
    if (requireWork && !input.originalWorker?.trim()) return "partial";
    return "pass";
  }

  validateRecords(
    records: PeerReviewRecord[] | null,
    input: PeerReviewRuntimeInput,
    started: number,
    requireWork = false,
  ): PeerReviewRuntimeValidationReport {
    const decision = this.decide(input, requireWork);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Peer Review Runtime requires validated=true");
    }
    if (requireWork && !input.taskId?.trim()) {
      errors.push("taskId is required for peer review");
    }
    if (requireWork && !input.originalWorker?.trim()) {
      warnings.push("originalWorker is recommended for peer review");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No peer review records were produced");
    } else {
      for (const record of records) {
        if (!record.reviewId) errors.push("Missing review ID");
        if (!record.taskId) warnings.push(`Task ID empty for ${record.reviewId}`);
        if (record.workersReplaced) errors.push("workersReplaced must remain false");
        if (record.completedWorkRewritten) errors.push("completedWorkRewritten must remain false");
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
        if (record.businessTasksExecuted) errors.push("businessTasksExecuted must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.replaceWorkers === true ||
      input.rewriteCompletedWork === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.executeBusinessTasks === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.replaceWorkers === true) {
      errors.push("Peer Review Runtime must never replace workers");
    }
    if (input.rewriteCompletedWork === true) {
      errors.push("Peer Review Runtime must never rewrite completed work");
    }
    if (input.overridePillow === true) {
      errors.push("Peer Review Runtime must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Peer Review Runtime must never override Grand King");
    }
    if (input.executeBusinessTasks === true) {
      errors.push("Peer Review Runtime must never execute business tasks");
    }
  }

  finalize(
    decision: PeerReviewRuntimeValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): PeerReviewRuntimeValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `prr-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: PRR_METADATA_VERSION,
    };
  }
}

export class PeerReviewRuntimeMetadataGenerator {
  generate(reviewCount: number, lastOutcome: string | null) {
    return {
      metadataVersion: PRR_METADATA_VERSION,
      engineVersion: "PILLOW-PRR-001" as const,
      missionId: "Q0-21" as const,
      reviewCount,
      lastOutcome,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: PeerReviewRuntimeValidationReport["decision"] | null, enabled: boolean) {
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
