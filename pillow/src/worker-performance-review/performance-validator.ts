import { WPR_METADATA_VERSION } from "./paths.js";
import type {
  PerformanceRecord,
  WorkerPerformanceCatalog,
  WorkerPerformanceInput,
  WorkerPerformanceValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceWorkerMonitoring?: boolean;
  replaceWorkforceCertificationMonitor?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class PerformanceValidator {
  decide(input: WorkerPerformanceInput): WorkerPerformanceValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecords(
    records: PerformanceRecord[] | null,
    input: WorkerPerformanceInput,
    started: number,
    planErrors: string[] = [],
  ): WorkerPerformanceValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [...planErrors];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Worker Performance Review requires validated=true");
    }
    if (!records || records.length === 0) {
      if (decision !== "fail" && planErrors.length === 0) {
        warnings.push("No performance records were produced yet");
      }
    } else {
      for (const record of records) {
        if (!record.performanceReviewId) errors.push("Missing performance review ID");
        if (!record.workerId) errors.push("Missing worker ID");
        if (!record.neverExecuteWorkerTasks) {
          errors.push("Performance records must remain non-executing");
        }
        if (!record.preserveHistoricalPerformance) {
          errors.push("Historical performance must be preserved");
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
    catalog: WorkerPerformanceCatalog | null,
    input: WorkerPerformanceInput,
    started: number,
  ): WorkerPerformanceValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!catalog) errors.push("Worker Performance catalog missing");
    else {
      if (!catalog.performanceVersion) errors.push("Missing performance version");
      if (!catalog.workers.length) warnings.push("No workers enrolled for performance review yet");
      if (catalog.executiveAuthority !== "pillow") {
        errors.push("Executive authority must remain pillow");
      }
      if (!catalog.integratesWithWorkerAssignmentEngine) {
        errors.push("Must integrate with Worker Assignment Engine");
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
      input.executeWorkerTasks === true ||
      input.replaceWorkerMonitoring === true ||
      input.replaceWorkforceCertificationMonitor === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Worker Performance Review must never execute worker tasks");
    }
    if (input.replaceWorkerMonitoring === true) {
      errors.push("Worker Performance Review must never replace Worker Monitoring");
    }
    if (input.replaceWorkforceCertificationMonitor === true) {
      errors.push(
        "Worker Performance Review must never replace Workforce Certification Monitor",
      );
    }
    if (input.overridePillow === true) {
      errors.push("Worker Performance Review must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Worker Performance Review must never override Grand King");
    }
  }

  finalize(
    decision: WorkerPerformanceValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkerPerformanceValidationReport {
    return {
      validationReportId: `wpr-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WPR_METADATA_VERSION,
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

export class WorkerPerformanceMetadataGenerator {
  generate(workerCount: number, recordCount: number) {
    return {
      metadataVersion: WPR_METADATA_VERSION,
      workerCount,
      recordCount,
      generatedAt: new Date().toISOString(),
    };
  }
}
