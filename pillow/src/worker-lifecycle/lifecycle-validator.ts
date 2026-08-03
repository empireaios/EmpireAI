import { WLC_METADATA_VERSION } from "./paths.js";
import type {
  LifecycleRecord,
  WorkerLifecycleCatalog,
  WorkerLifecycleInput,
  WorkerLifecycleProfile,
  WorkerLifecycleValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceWorkerRegistry?: boolean;
  replaceWorkforceCertificationMonitor?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  permanentlyDelete?: boolean;
  validated?: boolean;
};

export class LifecycleValidator {
  decide(input: WorkerLifecycleInput): WorkerLifecycleValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecords(
    records: LifecycleRecord[] | null,
    input: WorkerLifecycleInput,
    started: number,
    planErrors: string[] = [],
  ): WorkerLifecycleValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [...planErrors];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Worker Lifecycle requires validated=true");
    }
    if (!records || records.length === 0) {
      if (decision !== "fail" && planErrors.length === 0) {
        warnings.push("No lifecycle records were produced yet");
      }
    } else {
      for (const record of records) {
        if (!record.lifecycleId) errors.push("Missing lifecycle ID");
        if (record.permanentlyDeleted) errors.push("permanentlyDeleted must remain false");
        if (!record.preserveAuditability) errors.push("Auditability must be preserved");
        if (!record.preserveTraceability) errors.push("Traceability must be preserved");
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
    catalog: WorkerLifecycleCatalog | null,
    profiles: WorkerLifecycleProfile[],
    input: WorkerLifecycleInput,
    started: number,
  ): WorkerLifecycleValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!catalog) errors.push("Worker Lifecycle catalog missing");
    else {
      if (!catalog.lifecycleVersion) errors.push("Missing lifecycle version");
      if (!profiles.length) warnings.push("No workers in lifecycle yet");
      if (catalog.executiveAuthority !== "pillow") {
        errors.push("Executive authority must remain pillow");
      }
      if (catalog.neverPermanentlyDeleted !== true) {
        errors.push("Workers must never be permanently deleted");
      }
    }
    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkerRegistry === true ||
      input.replaceWorkforceCertificationMonitor === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.permanentlyDelete === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Worker Lifecycle must never execute worker tasks");
    }
    if (input.replaceWorkerRegistry === true) {
      errors.push("Worker Lifecycle must never replace Worker Registry");
    }
    if (input.replaceWorkforceCertificationMonitor === true) {
      errors.push("Worker Lifecycle must never replace Workforce Certification Monitor");
    }
    if (input.overridePillow === true) {
      errors.push("Worker Lifecycle must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Worker Lifecycle must never override Grand King");
    }
    if (input.permanentlyDelete === true) {
      errors.push("Worker Lifecycle must never permanently delete workers");
    }
  }

  finalize(
    decision: WorkerLifecycleValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkerLifecycleValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `wlc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WLC_METADATA_VERSION,
    };
  }
}

export class WorkerLifecycleMetadataGenerator {
  generate(workerCount: number, recordCount: number) {
    return {
      metadataVersion: WLC_METADATA_VERSION,
      engineVersion: "PILLOW-WLC-001" as const,
      missionId: "Q1-08" as const,
      workerCount,
      recordCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: WorkerLifecycleValidationReport["decision"] | null, enabled: boolean) {
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
