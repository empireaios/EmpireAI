import { WCT_METADATA_VERSION } from "./paths.js";
import type {
  WorkerConstitutionDefinition,
  WorkerConstitutionInput,
  WorkerConstitutionValidationReport,
  WorkerInheritanceRecord,
} from "./types.js";

type BoundaryInput = {
  executeWorkerTasks?: boolean;
  replaceWorkerQualityStandard?: boolean;
  replaceGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class ConstitutionValidator {
  decide(
    input: WorkerConstitutionInput,
    requireWorker = false,
  ): WorkerConstitutionValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (requireWorker && !input.workerId?.trim()) return "partial";
    return "pass";
  }

  validateRecords(
    records: WorkerInheritanceRecord[] | null,
    input: WorkerConstitutionInput,
    started: number,
    requireWorker = false,
  ): WorkerConstitutionValidationReport {
    const decision = this.decide(input, requireWorker);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Worker Constitution requires validated=true");
    }
    if (requireWorker && !input.workerId?.trim()) {
      warnings.push("workerId is recommended");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail" && requireWorker) {
        errors.push("No inheritance records were produced");
      }
    } else {
      for (const record of records) {
        if (!record.inheritanceId) errors.push("Missing inheritance ID");
        if (!record.inherited) errors.push("Worker must inherit the constitution");
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.workerQualityStandardReplaced) {
          errors.push("workerQualityStandardReplaced must remain false");
        }
        if (record.governanceReplaced) errors.push("governanceReplaced must remain false");
        if (record.pillowOverridden) errors.push("pillowOverridden must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  validateConstitution(
    constitution: WorkerConstitutionDefinition | null,
    input: WorkerConstitutionInput,
    started: number,
  ): WorkerConstitutionValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    this.pushBoundaryErrors(input, errors);
    if (!constitution) errors.push("Worker Constitution definition missing");
    else {
      if (!constitution.constitutionVersion) errors.push("Missing constitution version");
      if (!constitution.constitutionalRules.length) {
        errors.push("Constitutional rules required");
      }
      if (!constitution.neverOverridePillow) errors.push("Pillow governance must remain locked");
    }
    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.executeWorkerTasks === true ||
      input.replaceWorkerQualityStandard === true ||
      input.replaceGovernance === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.executeWorkerTasks === true) {
      errors.push("Worker Constitution must never execute worker tasks");
    }
    if (input.replaceWorkerQualityStandard === true) {
      errors.push("Worker Constitution must never replace Worker Quality Standard");
    }
    if (input.replaceGovernance === true) {
      errors.push("Worker Constitution must never replace Governance");
    }
    if (input.overridePillow === true) {
      errors.push("Worker Constitution must never override Pillow");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Worker Constitution must never override Grand King");
    }
  }

  finalize(
    decision: WorkerConstitutionValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkerConstitutionValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `wct-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WCT_METADATA_VERSION,
    };
  }
}

export class WorkerConstitutionMetadataGenerator {
  generate(inheritanceCount: number, compliantCount: number) {
    return {
      metadataVersion: WCT_METADATA_VERSION,
      engineVersion: "PILLOW-WCT-001" as const,
      missionId: "Q1-01" as const,
      inheritanceCount,
      compliantCount,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: WorkerConstitutionValidationReport["decision"] | null, enabled: boolean) {
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
