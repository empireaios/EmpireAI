import { WRS_METADATA_VERSION } from "./paths.js";
import type {
  RecoveryRecord,
  WorkerRecoveryCatalog,
  WorkerRecoveryInput,
  WorkerRecoveryValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerBusinessLogic?: boolean;
  replaceWorkerMonitoring?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class RecoveryValidator {
  decide(input: WorkerRecoveryInput): WorkerRecoveryValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecords(
    records: RecoveryRecord[] | null,
    input: WorkerRecoveryInput,
    started: number,
    planErrors: string[] = [],
  ): WorkerRecoveryValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [...planErrors];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Worker Recovery System requires validated=true");
    }
    if (!records || records.length === 0) {
      if (decision !== "fail" && planErrors.length === 0) {
        warnings.push("No recovery records were produced yet");
      }
    } else {
      for (const record of records) {
        if (!record.recoveryId) errors.push("Missing recovery ID");
        if (!record.workerId) errors.push("Missing worker ID");
        if (!record.neverExecuteWorkerBusinessLogic) {
          errors.push("Recovery records must not execute worker business logic");
        }
        if (!record.executionStatePreserved) {
          errors.push("Execution state must be preserved");
        }
        if (!record.preventDuplicateExecution) {
          errors.push("Duplicate execution must be prevented");
        }
      }
    }
    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision,
      errors,
      warnings,
      started,
    );
  }

  validateCatalog(
    catalog: WorkerRecoveryCatalog | null,
    input: WorkerRecoveryInput,
    started: number,
  ): WorkerRecoveryValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!catalog) errors.push("Worker Recovery catalog missing");
    else {
      if (!catalog.recoveryVersion) errors.push("Missing recovery version");
      if (!catalog.workers.length) warnings.push("No workers registered for recovery yet");
      if (catalog.executiveAuthority !== "pillow") {
        errors.push("Executive authority must remain pillow");
      }
    }
    return this.finalize(
      errors.length || decision === "fail" ? "fail" : decision,
      errors,
      warnings,
      started,
    );
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerBusinessLogic === true ||
      input.replaceWorkerMonitoring === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerBusinessLogic === true) {
      errors.push("Worker Recovery System must never execute worker business logic");
    }
    if (input.replaceWorkerMonitoring === true) {
      errors.push("Worker Recovery System must never replace Worker Monitoring");
    }
    if (input.replaceWorkforceOrchestrator === true) {
      errors.push("Worker Recovery System must never replace Workforce Orchestrator");
    }
    if (input.overridePillow === true) {
      errors.push("Worker Recovery System must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Worker Recovery System must never override Grand King");
    }
  }

  finalize(
    decision: WorkerRecoveryValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkerRecoveryValidationReport {
    return {
      validationReportId: `wrs-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WRS_METADATA_VERSION,
    };
  }
}

export class HealthMonitor {
  status(decision: "pass" | "partial" | "fail" | null, enabled: boolean) {
    if (!enabled) return "failed" as const;
    if (decision === "fail") return "failed" as const;
    if (decision === "partial") return "degraded" as const;
    if (decision === "pass") return "healthy" as const;
    return "standby" as const;
  }
}

export class RecoveryManager {
  private failures = 0;
  recordFailure() {
    this.failures += 1;
  }
  reset() {
    this.failures = 0;
  }
  failureCount() {
    return this.failures;
  }
}

export class WorkerRecoveryMetadataGenerator {
  generate(workerCount: number, recordCount: number, escalationCount: number) {
    return {
      metadataVersion: WRS_METADATA_VERSION,
      workerCount,
      recordCount,
      escalationCount,
      generatedAt: new Date().toISOString(),
    };
  }
}
