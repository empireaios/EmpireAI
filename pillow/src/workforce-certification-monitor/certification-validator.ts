import { WCM_METADATA_VERSION } from "./paths.js";
import type {
  CertificationRecord,
  WorkforceCertificationMonitorInput,
  WorkforceCertificationMonitorValidationReport,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  repairWorkersAutomatically?: boolean;
  replaceWorkerQualityStandard?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class CertificationValidator {
  decide(
    input: WorkforceCertificationMonitorInput,
    requireWorker = false,
  ): WorkforceCertificationMonitorValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (requireWorker && !input.workerId?.trim() && !(input.workers?.length)) {
      return "partial";
    }
    return "pass";
  }

  validateRecords(
    records: CertificationRecord[] | null,
    input: WorkforceCertificationMonitorInput,
    started: number,
    requireWorker = false,
  ): WorkforceCertificationMonitorValidationReport {
    const decision = this.decide(input, requireWorker);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Workforce Certification Monitor requires validated=true");
    }
    if (requireWorker && !input.workerId?.trim() && !(input.workers?.length)) {
      warnings.push("workerId or workers[] is recommended");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No certification records were produced");
    } else {
      for (const record of records) {
        if (!record.certificationId) errors.push("Missing certification ID");
        if (!record.workerId) warnings.push(`Worker ID empty for ${record.certificationId}`);
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.workersRepairedAutomatically) {
          errors.push("workersRepairedAutomatically must remain false");
        }
        if (record.workerQualityStandardReplaced) {
          errors.push("workerQualityStandardReplaced must remain false");
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
      input.repairWorkersAutomatically === true ||
      input.replaceWorkerQualityStandard === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Workforce Certification Monitor must never execute worker tasks");
    }
    if (input.repairWorkersAutomatically === true) {
      errors.push("Workforce Certification Monitor must never repair workers automatically");
    }
    if (input.replaceWorkerQualityStandard === true) {
      errors.push("Workforce Certification Monitor must never replace Worker Quality Standard");
    }
    if (input.overridePillow === true) {
      errors.push("Workforce Certification Monitor must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Workforce Certification Monitor must never override Grand King");
    }
  }

  finalize(
    decision: WorkforceCertificationMonitorValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkforceCertificationMonitorValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `wcm-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WCM_METADATA_VERSION,
    };
  }
}

export class WorkforceCertificationMonitorMetadataGenerator {
  generate(certificationCount: number, certifiedCount: number) {
    return {
      metadataVersion: WCM_METADATA_VERSION,
      engineVersion: "PILLOW-WCM-001" as const,
      missionId: "Q0-29" as const,
      certificationCount,
      certifiedCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(
    decision: WorkforceCertificationMonitorValidationReport["decision"] | null,
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
