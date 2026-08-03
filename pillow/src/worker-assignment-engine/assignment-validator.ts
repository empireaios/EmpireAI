import { WAE_METADATA_VERSION } from "./paths.js";
import type {
  AssignmentRecord,
  WorkerAssignmentCatalog,
  WorkerAssignmentInput,
  WorkerAssignmentValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  replaceTaskNegotiationProtocol?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class AssignmentValidator {
  decide(input: WorkerAssignmentInput): WorkerAssignmentValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecords(
    records: AssignmentRecord[] | null,
    input: WorkerAssignmentInput,
    started: number,
    planErrors: string[] = [],
  ): WorkerAssignmentValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [...planErrors];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Worker Assignment Engine requires validated=true");
    }
    if (!records || records.length === 0) {
      if (decision !== "fail" && planErrors.length === 0) {
        warnings.push("No assignment records were produced yet");
      }
    } else {
      for (const record of records) {
        if (!record.assignmentId) errors.push("Missing assignment ID");
        if (!record.missionId) errors.push("Missing mission ID");
        if (!Array.isArray(record.candidateWorkers)) {
          errors.push("Candidate workers must be an array");
        }
        if (!record.neverExecuteWorkerTasks) {
          errors.push("Assignment records must remain non-executing");
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
    catalog: WorkerAssignmentCatalog | null,
    input: WorkerAssignmentInput,
    started: number,
  ): WorkerAssignmentValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!catalog) errors.push("Worker Assignment catalog missing");
    else {
      if (!catalog.assignmentVersion) errors.push("Missing assignment version");
      if (!catalog.workers.length) warnings.push("No workers in assignment pool yet");
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
      input.executeWorkerTasks === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.replaceTaskNegotiationProtocol === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Worker Assignment Engine must never execute worker tasks");
    }
    if (input.replaceWorkforceOrchestrator === true) {
      errors.push("Worker Assignment Engine must never replace Workforce Orchestrator");
    }
    if (input.replaceTaskNegotiationProtocol === true) {
      errors.push("Worker Assignment Engine must never replace Task Negotiation Protocol");
    }
    if (input.overridePillow === true) {
      errors.push("Worker Assignment Engine must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Worker Assignment Engine must never override Grand King");
    }
  }

  finalize(
    decision: WorkerAssignmentValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkerAssignmentValidationReport {
    return {
      validationReportId: `wae-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WAE_METADATA_VERSION,
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

export class WorkerAssignmentMetadataGenerator {
  generate(workerCount: number, recordCount: number) {
    return {
      metadataVersion: WAE_METADATA_VERSION,
      workerCount,
      recordCount,
      generatedAt: new Date().toISOString(),
    };
  }
}
