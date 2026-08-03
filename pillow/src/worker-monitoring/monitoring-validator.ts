import { WMO_METADATA_VERSION } from "./paths.js";
import type {
  MonitoringRecord,
  WorkerMonitoringCatalog,
  WorkerMonitoringInput,
  WorkerMonitoringValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  restartWorkersAutomatically?: boolean;
  replaceWorkforceCertificationMonitor?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class MonitoringValidator {
  decide(input: WorkerMonitoringInput): WorkerMonitoringValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecords(
    records: MonitoringRecord[] | null,
    input: WorkerMonitoringInput,
    started: number,
    planErrors: string[] = [],
  ): WorkerMonitoringValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [...planErrors];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Worker Monitoring requires validated=true");
    }
    if (!records || records.length === 0) {
      if (decision !== "fail" && planErrors.length === 0) {
        warnings.push("No monitoring records were produced yet");
      }
    } else {
      for (const record of records) {
        if (!record.monitoringId) errors.push("Missing monitoring ID");
        if (!record.workerId) errors.push("Missing worker ID");
        if (!record.neverExecuteWorkerTasks) {
          errors.push("Monitoring records must remain non-executing");
        }
        if (!record.neverRestartWorkersAutomatically) {
          errors.push("Monitoring must never restart workers automatically");
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
    catalog: WorkerMonitoringCatalog | null,
    input: WorkerMonitoringInput,
    started: number,
  ): WorkerMonitoringValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!catalog) errors.push("Worker Monitoring catalog missing");
    else {
      if (!catalog.monitoringVersion) errors.push("Missing monitoring version");
      if (!catalog.workers.length) warnings.push("No workers registered for monitoring yet");
      if (catalog.executiveAuthority !== "pillow") {
        errors.push("Executive authority must remain pillow");
      }
      if (!catalog.supportsExecutiveReportingRuntime) {
        errors.push("Must support Executive Reporting Runtime integration");
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
      input.restartWorkersAutomatically === true ||
      input.replaceWorkforceCertificationMonitor === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Worker Monitoring must never execute worker tasks");
    }
    if (input.restartWorkersAutomatically === true) {
      errors.push("Worker Monitoring must never restart workers automatically");
    }
    if (input.replaceWorkforceCertificationMonitor === true) {
      errors.push("Worker Monitoring must never replace Workforce Certification Monitor");
    }
    if (input.overridePillow === true) {
      errors.push("Worker Monitoring must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Worker Monitoring must never override Grand King");
    }
  }

  finalize(
    decision: WorkerMonitoringValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkerMonitoringValidationReport {
    return {
      validationReportId: `wmo-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WMO_METADATA_VERSION,
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

export class WorkerMonitoringMetadataGenerator {
  generate(workerCount: number, recordCount: number, alertCount: number) {
    return {
      metadataVersion: WMO_METADATA_VERSION,
      workerCount,
      recordCount,
      alertCount,
      generatedAt: new Date().toISOString(),
    };
  }
}
