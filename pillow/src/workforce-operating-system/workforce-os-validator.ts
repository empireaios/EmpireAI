import { WFOS_METADATA_VERSION } from "./paths.js";
import type {
  WorkforceOperatingSystemInput,
  WorkforceOperatingSystemValidationReport,
  WorkforceOsRecord,
} from "./types.js";

type BoundaryInput = {
  replacePillow?: boolean;
  replaceWorkforceOrchestrator?: boolean;
  executeWorkerTasks?: boolean;
  makeStrategicDecisions?: boolean;
  overrideGrandKing?: boolean;
  validated?: boolean;
};

export class WorkforceOsValidator {
  decide(input: WorkforceOperatingSystemInput): WorkforceOperatingSystemValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateRecords(
    records: WorkforceOsRecord[] | null,
    input: WorkforceOperatingSystemInput,
    started: number,
  ): WorkforceOperatingSystemValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Workforce Operating System requires validated=true");
    }

    if (!records || records.length === 0) {
      if (decision !== "fail") errors.push("No Workforce OS records were produced");
    } else {
      for (const record of records) {
        if (!record.runtimeId) errors.push("Missing runtime ID");
        if (!record.organizationState) warnings.push(`Organization state empty for ${record.runtimeId}`);
        if (record.pillowReplaced) errors.push("pillowReplaced must remain false");
        if (record.workforceOrchestratorReplaced) {
          errors.push("workforceOrchestratorReplaced must remain false");
        }
        if (record.workerTasksExecuted) errors.push("workerTasksExecuted must remain false");
        if (record.strategicDecisionsMade) errors.push("strategicDecisionsMade must remain false");
        if (record.grandKingOverridden) errors.push("grandKingOverridden must remain false");
      }
    }

    return this.finalize(decision, errors, warnings, started);
  }

  private hasBoundaryViolation(input: BoundaryInput): boolean {
    return (
      input.replacePillow === true ||
      input.replaceWorkforceOrchestrator === true ||
      input.executeWorkerTasks === true ||
      input.makeStrategicDecisions === true ||
      input.overrideGrandKing === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.replacePillow === true) {
      errors.push("Workforce Operating System must never replace Pillow");
    }
    if (input.replaceWorkforceOrchestrator === true) {
      errors.push("Workforce Operating System must never replace Workforce Orchestrator");
    }
    if (input.executeWorkerTasks === true) {
      errors.push("Workforce Operating System must never execute worker tasks");
    }
    if (input.makeStrategicDecisions === true) {
      errors.push("Workforce Operating System must never make strategic decisions");
    }
    if (input.overrideGrandKing === true) {
      errors.push("Workforce Operating System must never override Grand King");
    }
  }

  finalize(
    decision: WorkforceOperatingSystemValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): WorkforceOperatingSystemValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `wfos-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: WFOS_METADATA_VERSION,
    };
  }
}

export class WorkforceOperatingSystemMetadataGenerator {
  generate(runtimeCount: number, activeWorkers: number) {
    return {
      metadataVersion: WFOS_METADATA_VERSION,
      engineVersion: "PILLOW-WFOS-001" as const,
      missionId: "Q0-19" as const,
      runtimeCount,
      activeWorkers,
      timestamp: new Date().toISOString(),
    };
  }
}

export class HealthMonitor {
  status(decision: WorkforceOperatingSystemValidationReport["decision"] | null, enabled: boolean) {
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
